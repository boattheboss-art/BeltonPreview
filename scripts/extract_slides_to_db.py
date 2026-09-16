import os
import sys
import json
import re
import sqlite3

# Ensure stdout/stderr handles UTF-8 on Windows
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')
if hasattr(sys.stderr, 'reconfigure'):
    sys.stderr.reconfigure(encoding='utf-8', errors='replace')

from pypdf import PdfReader

SLIDES_DIR = r"C:\งานโบ๊ท\โปรเจค\เนื้อหาเทรนAI"
OUTPUT_JSON = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "data", "belton_slides_database.json"))
DB_PATH = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "data", "scada.db"))

SLIDE_FILES = [
    {
        "filename": "TM-00-00-01_1) Product & Process Introduction_03.pdf",
        "doc_code": "TM-00-00-01",
        "doc_name": "Product & Process Introduction (Coil Winding, ACA, FCOF, APFA)"
    },
    {
        "filename": "TM-00-00-05_1) CR Discipline training 2026-27 (Staff-Operator).pdf",
        "doc_code": "TM-00-00-05_1",
        "doc_name": "Cleanroom Discipline Training 2026-27 (Staff-Operator)"
    },
    {
        "filename": "TM-00-00-05_2) In-Out CR and discipline (Thai & MM).pdf",
        "doc_code": "TM-00-00-05_2",
        "doc_name": "In-Out Cleanroom & Discipline (Thai & Myanmar)"
    },
    {
        "filename": "TM-00-00-05_3) Cleanroom suit instruction (Thai & MM).pdf",
        "doc_code": "TM-00-00-05_3",
        "doc_name": "Cleanroom Suit & Gowning Instruction (Thai & Myanmar)"
    },
    {
        "filename": "TM-00-00-05_4) Cleanroom discipline (Thai&MM).pdf",
        "doc_code": "TM-00-00-05_4",
        "doc_name": "Cleanroom Discipline & Prohibited Items (Thai & Myanmar)"
    }
]

def clean_text(raw_text):
    if not raw_text:
        return ""
    # Replace carriage returns and weird unicode whitespace
    text = raw_text.replace('\r\n', '\n').replace('\r', '\n')
    # Remove null characters
    text = text.replace('\x00', '')
    # Collapse multiple consecutive newlines (> 2) into 2
    text = re.sub(r'\n{3,}', '\n\n', text)
    # Strip whitespace on lines
    lines = [line.strip() for line in text.split('\n')]
    # Filter out empty lines if there are too many
    clean = '\n'.join(lines).strip()
    return clean

def extract_title(content, default_doc_name, page_num):
    lines = [l.strip() for l in content.split('\n') if l.strip()]
    for line in lines:
        if 'Belton Technology' in line or 'All rights reserved' in line:
            continue
        if re.match(r'^\d+$', line):
            continue
        if 2 <= len(line) <= 120:
            return line
    return f"{default_doc_name} - Slide {page_num}"

def main():
    print(f"🚀 [Belton Slide Extractor] Reading PDFs from: {SLIDES_DIR}")
    if not os.path.exists(SLIDES_DIR):
        print(f"❌ Error: Slide directory does not exist: {SLIDES_DIR}")
        sys.exit(1)

    all_pages = []
    total_docs = 0
    total_pages = 0
    total_chars = 0

    for doc in SLIDE_FILES:
        filepath = os.path.join(SLIDES_DIR, doc["filename"])
        if not os.path.exists(filepath):
            print(f"⚠️ Warning: File not found: {filepath}")
            continue

        print(f"\n📄 Processing Document [{doc['doc_code']}]: {doc['filename']}")
        reader = PdfReader(filepath)
        page_count = len(reader.pages)
        print(f"   Found {page_count} pages.")
        total_docs += 1

        for idx, page in enumerate(reader.pages):
            page_num = idx + 1
            raw_text = page.extract_text() or ""
            cleaned = clean_text(raw_text)
            title = extract_title(cleaned, doc["doc_name"], page_num)
            char_count = len(cleaned)

            page_data = {
                "doc_code": doc["doc_code"],
                "doc_name": doc["doc_name"],
                "filename": doc["filename"],
                "page_number": page_num,
                "title": title,
                "content": cleaned,
                "char_count": char_count
            }
            all_pages.append(page_data)
            total_pages += 1
            total_chars += char_count

    print(f"\n=======================================================")
    print(f"📊 Extraction Summary:")
    print(f"   Total Documents: {total_docs}")
    print(f"   Total Pages Extracted: {total_pages}")
    print(f"   Total Text Characters: {total_chars:,}")
    print(f"=======================================================")

    # 1. Save JSON database
    os.makedirs(os.path.dirname(OUTPUT_JSON), exist_ok=True)
    with open(OUTPUT_JSON, "w", encoding="utf-8") as f:
        json.dump(all_pages, f, ensure_ascii=False, indent=2)
    print(f"💾 Saved JSON slide database to: {OUTPUT_JSON}")

    # 2. Ingest into SQLite (scada.db)
    print(f"🗄️ Ingesting into SQLite Database: {DB_PATH}")
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    # Drop old tables if exist
    cursor.execute("DROP TABLE IF EXISTS slides_fts")
    cursor.execute("DROP TABLE IF EXISTS slide_pages")

    # Create relational table
    cursor.execute("""
        CREATE TABLE slide_pages (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            doc_code TEXT NOT NULL,
            doc_name TEXT NOT NULL,
            filename TEXT NOT NULL,
            page_number INTEGER NOT NULL,
            title TEXT,
            content TEXT NOT NULL,
            char_count INTEGER NOT NULL
        )
    """)

    # Create Virtual FTS5 table
    cursor.execute("""
        CREATE VIRTUAL TABLE slides_fts USING fts5(
            page_id UNINDEXED,
            doc_code,
            doc_name,
            page_number UNINDEXED,
            title,
            content,
            tokenize='unicode61'
        )
    """)

    # Insert records
    for p in all_pages:
        cursor.execute("""
            INSERT INTO slide_pages (doc_code, doc_name, filename, page_number, title, content, char_count)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        """, (p["doc_code"], p["doc_name"], p["filename"], p["page_number"], p["title"], p["content"], p["char_count"]))
        
        page_id = cursor.lastrowid

        cursor.execute("""
            INSERT INTO slides_fts (page_id, doc_code, doc_name, page_number, title, content)
            VALUES (?, ?, ?, ?, ?, ?)
        """, (page_id, p["doc_code"], p["doc_name"], p["page_number"], p["title"], p["content"]))

    conn.commit()

    # Quick test query on FTS5
    print("\n🔍 Testing SQLite FTS5 search...")
    test_queries = ["FCOF", "Cleanroom", "ESD", "Preamp", "Silicone", "Wrist strap"]
    for q in test_queries:
        cursor.execute("""
            SELECT doc_code, page_number, title, substr(content, 1, 100) 
            FROM slides_fts 
            WHERE slides_fts MATCH ? 
            LIMIT 1
        """, (q,))
        row = cursor.fetchone()
        if row:
            print(f"   ✅ Query '{q}': [{row[0]} P.{row[1]}] {row[2][:40]}...")
        else:
            print(f"   ⚠️ Query '{q}': No match found")

    conn.close()
    print("\n🎉 [Complete] Belton slides successfully 100% ingested into Database!")

if __name__ == "__main__":
    main()
