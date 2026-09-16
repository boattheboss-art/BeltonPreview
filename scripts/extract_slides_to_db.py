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

BASE_DIR = r"C:\งานโบ๊ท\โปรเจค\เนื้อหาเทรนAI"
SEAGATE_DIR = os.path.join(BASE_DIR, "01-Seagate")
OUTPUT_JSON = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "data", "belton_slides_database.json"))
DB_PATH = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "data", "scada.db"))

SLIDE_FILES = [
    # 1. Belton Standard General & Cleanroom Training Slides (273 pages)
    {
        "filepath": os.path.join(BASE_DIR, "TM-00-00-01_1) Product & Process Introduction_03.pdf"),
        "filename": "TM-00-00-01_1) Product & Process Introduction_03.pdf",
        "doc_code": "TM-00-00-01",
        "doc_name": "Product & Process Introduction (Coil Winding, ACA, FCOF, APFA)"
    },
    {
        "filepath": os.path.join(BASE_DIR, "TM-00-00-05_1) CR Discipline training 2026-27 (Staff-Operator).pdf"),
        "filename": "TM-00-00-05_1) CR Discipline training 2026-27 (Staff-Operator).pdf",
        "doc_code": "TM-00-00-05_1",
        "doc_name": "Cleanroom Discipline Training 2026-27 (Staff-Operator)"
    },
    {
        "filepath": os.path.join(BASE_DIR, "TM-00-00-05_2) In-Out CR and discipline (Thai & MM).pdf"),
        "filename": "TM-00-00-05_2) In-Out CR and discipline (Thai & MM).pdf",
        "doc_code": "TM-00-00-05_2",
        "doc_name": "In-Out Cleanroom & Discipline (Thai & Myanmar)"
    },
    {
        "filepath": os.path.join(BASE_DIR, "TM-00-00-05_3) Cleanroom suit instruction (Thai & MM).pdf"),
        "filename": "TM-00-00-05_3) Cleanroom suit instruction (Thai & MM).pdf",
        "doc_code": "TM-00-00-05_3",
        "doc_name": "Cleanroom Suit & Gowning Instruction (Thai & Myanmar)"
    },
    {
        "filepath": os.path.join(BASE_DIR, "TM-00-00-05_4) Cleanroom discipline (Thai&MM).pdf"),
        "filename": "TM-00-00-05_4) Cleanroom discipline (Thai&MM).pdf",
        "doc_code": "TM-00-00-05_4",
        "doc_name": "Cleanroom Discipline & Prohibited Items (Thai & Myanmar)"
    },

    # 2. Seagate Workmanship Standards & Exam Materials (396 pages)
    {
        "filepath": os.path.join(SEAGATE_DIR, r"01-00_Raw material\SPE-01-00-01 Raw material Workmanship Standards All Seagate product_P1.pdf"),
        "filename": "SPE-01-00-01 Raw material Workmanship Standards All Seagate product_P1.pdf",
        "doc_code": "SPE-01-00-01",
        "doc_name": "Raw Material Workmanship Standards (All Seagate Product)"
    },
    {
        "filepath": os.path.join(SEAGATE_DIR, r"01-02_Hookup\SPE-01-02-24 HU Workmanship Standards All Seagate product_N.pdf"),
        "filename": "SPE-01-02-24 HU Workmanship Standards All Seagate product_N.pdf",
        "doc_code": "SPE-01-02-24",
        "doc_name": "Hookup (HU) Workmanship Standards (All Seagate Product)"
    },
    {
        "filepath": os.path.join(SEAGATE_DIR, r"01-03_FCOF\SPE-01-03-01 FCOF SG Workmanship Standard_Z.pdf"),
        "filename": "SPE-01-03-01 FCOF SG Workmanship Standard_Z.pdf",
        "doc_code": "SPE-01-03-01",
        "doc_name": "PCCA & FCOF Seagate Workmanship Standards Specification"
    },
    {
        "filepath": os.path.join(SEAGATE_DIR, r"01-05_Tray washing\SPE-01-05-01 Tray Workmanship Standard Specification_C.pdf"),
        "filename": "SPE-01-05-01 Tray Workmanship Standard Specification_C.pdf",
        "doc_code": "SPE-01-05-01",
        "doc_name": "Tray & Cover Damper Workmanship Standards Specification"
    },
    {
        "filepath": os.path.join(SEAGATE_DIR, r"01-06_ACA\01-06_ACA\SPE-01-06-01 ACA Seagate Workmanship Standards_Z.pdf"),
        "filename": "SPE-01-06-01 ACA Seagate Workmanship Standards_Z.pdf",
        "doc_code": "SPE-01-06-01",
        "doc_name": "ACA Seagate Workmanship Standards Specification"
    },
    {
        "filepath": os.path.join(SEAGATE_DIR, r"01-08_Coil winding\SPE-01-08-01 Coil Seagate Workmanship Standards_G.pdf"),
        "filename": "SPE-01-08-01 Coil Seagate Workmanship Standards_G.pdf",
        "doc_code": "SPE-01-08-01",
        "doc_name": "Coil Seagate Workmanship Standards Specification"
    }
]

def sanitize_thai_text(text):
    if not text:
        return ""
    
    # 1. Spaced common factory words
    spaced_words = {
        r'เส\s+้น': 'เส้น',
        r'ด\s+้\s*วย': 'ด้วย',
        r'ข\s+้\s*อ': 'ข้อ',
        r'หน\s+้\s*า': 'หน้า',
        r'ใช\s+้': 'ใช้',
        r'ได\s+้': 'ได้',
        r'ให\s+้': 'ให้',
        r'แล\s+้\s*ว': 'แล้ว',
        r'ถ\s+้\s*า': 'ถ้า',
        r'ต\s+้\s*อง': 'ต้อง',
        r'ห\s+้\s*อง': 'ห้อง',
        r'ไว\s+้': 'ไว้',
        r'ไหม\s+้': 'ไหม้',
        r'แห\s+้\s*ง': 'แห้ง',
        r'เป\s+้\s*า': 'เป้า',
        r'ร\s+้\s*อย': 'ร้อย',
        r'น\s+้\s*อย': 'น้อย',
        r'ช\s+ิ[*+]\s*น': 'ชิ้น',
        r'ช\s+ิ\s*%\s*น': 'ชิ้น',
        r'ส\s+ี': 'สี',
        r'เป\s+็\s*น': 'เป็น',
        r'ฝ\s+่\s*าย': 'ฝ่าย',
        r'ฝุ\s+่\s*น': 'ฝุ่น',
        r'พื\s+น\s*ที\s*': 'พื้นที่ ',
        r'พื\s*[\*+]\s*น\s*ที\s*': 'พื้นที่ ',
        r'เกี\s+ยว': 'เกี่ยว',
        r'ซึ\s+ง': 'ซึ่ง',
        r'เบลต\s+ั\s*น': 'เบลตัน',
        r'ช\s+ั\s*a\s*น': 'ชั้น',
        r'ผู\s+้': 'ผู้',
        r'รู\s+้': 'รู้',
        r'เข\s+้\s*า': 'เข้า'
    }
    for pat, rep in spaced_words.items():
        text = re.sub(pat, rep, text)

    # General spaced tone marks & vowels
    text = re.sub(r'([\u0E00-\u0E7F])\s+([่้๊๋็์])', r'\1\2', text)
    text = re.sub(r'([\u0E00-\u0E7F])\s+([ิีึืั])', r'\1\2', text)
    text = re.sub(r'([\u0E00-\u0E7F])\s+([ุู])', r'\1\2', text)
    text = re.sub(r'([่้๊๋])\s+([ะาำ])', r'\1\2', text)
    text = re.sub(r'([่้๊๋])\s+([\u0E00-\u0E7F])', r'\1\2', text)
    text = re.sub(r'([เแโใไ])\s+([\u0E00-\u0E7F])', r'\1\2', text)

    # 2. Ligature glitches with digits/symbols (3, 4, *, +, 5, %, &)
    glitch_replacements = [
        (r'ซึ[34]ง', 'ซึ่ง'),
        (r'ที[34]', 'ที่'),
        (r'เพื[34]อ', 'เพื่อ'),
        (r'ชื[34]อ', 'ชื่อ'),
        (r'ยื[34]น', 'ยื่น'),
        (r'อื[34]น', 'อื่น'),
        (r'เปลี[34]ยน', 'เปลี่ยน'),
        (r'ฝั[34]ง', 'ฝั่ง'),
        (r'หนึ[34]ง', 'หนึ่ง'),
        (r'สิ[34]ง', 'สิ่ง'),
        (r'ตะกั[34]ว', 'ตะกั่ว'),
        (r'กว[34]า', 'กว่า'),
        (r'อย่[34]าง', 'อย่าง'),
        (r'ว่[34]า', 'ว่า'),
        (r'ต่า[34]ง', 'ต่าง'),
        (r'ช่อ[34]ง', 'ช่อง'),
        (r'ไม[34่]่', 'ไม่'),
        (r'ไม[34]', 'ไม่'),
        (r'ใช[34]', 'ใช่'),
        (r'ใส[34]', 'ใส่'),
        (r'ขึ[\*+]น', 'ขึ้น'),
        (r'ชิ[\*+%&]น', 'ชิ้น'),
        (r'เนื[\*+]อ', 'เนื้อ'),
        (r'ทั[\*+]ง', 'ทั้ง'),
        (r'นี[\*+]', 'นี้'),
        (r'บี[\*+]', 'บี้'),
        (r'คลํ[\*+]า', 'คล้ำ'),
        (r'ครั[5\*+]ง', 'ครั้ง'),
        (r'ตั[\*+]ง', 'ตั้ง'),
        (r'นั[\*+]น', 'นั้น'),
        (r'ชั[\*+]น', 'ชั้น'),
        (r'อื\(นที\(ไม่', 'อื่นที่ไม่'),
        (r'เป ็ น', 'เป็น')
    ]

    for pat, rep in glitch_replacements:
        text = re.sub(pat, rep, text)

    # Collapse multi-spaces
    text = re.sub(r'[ \t]{2,}', ' ', text)
    return text

def clean_text(raw_text):
    if not raw_text:
        return ""
    # Replace carriage returns and weird unicode whitespace
    text = raw_text.replace('\r\n', '\n').replace('\r', '\n')
    # Remove null characters
    text = text.replace('\x00', '')
    # Sanitize Thai character distortions
    text = sanitize_thai_text(text)
    # Collapse multiple consecutive newlines (> 2) into 2
    text = re.sub(r'\n{3,}', '\n\n', text)
    # Strip whitespace on lines
    lines = [line.strip() for line in text.split('\n')]
    clean = '\n'.join(lines).strip()
    return clean

def enrich_rejection_criteria(content):
    """
    Auto-enriches slides where 'Reject criteria' only says 'ไม่เป็นไปตามข้อกำหนดข้างต้น'
    by extracting the concrete conditions from 'Acceptance criteria' and appending them
    directly into the Reject section.
    """
    accept_match = re.search(r'(?:Acceptable|Acceptance criteria|Acceptance|เกณฑ์การยอมรับ)\s*[:\n]', content, re.IGNORECASE)
    reject_match = re.search(r'(?:Reject criteria|Rejection criteria|Reject|Rejection|เกณฑ์การปฏิเสธ)\s*[:\n]', content, re.IGNORECASE)
    
    if accept_match and reject_match and accept_match.start() < reject_match.start():
        accept_text = content[accept_match.end():reject_match.start()].strip()
        reject_text = content[reject_match.end():].strip()
        
        refers_back = re.search(r'(?:ไม่เป็นไปตาม|ข้อก[ำา]หนดข้างต้น|ข้อก[ำา]หนดของ acceptable|violat|not follow acceptable|if not meet)', reject_text, re.IGNORECASE)
        
        if refers_back and len(accept_text) > 5:
            clean_lines = [l.strip() for l in accept_text.split('\n') if l.strip() and not l.strip().lower().startswith(('rel. date', 'rev.', 'page', 'date:'))]
            clean_accept = ' '.join(clean_lines)
            if len(clean_accept) > 350:
                clean_accept = clean_accept[:350] + '...'
            
            enrichment_tag = f"\n\n[สรุปเกณฑ์ปฏิเสธ (Reject) เชิงรูปธรรม]: ปฏิเสธ (Reject) ทันทีหากไม่เป็นไปตามเกณฑ์ Acceptance criteria ข้างต้น (นั่นคือ: {clean_accept})"
            return content + enrichment_tag

    return content

def extract_title(content, default_doc_name, page_num):
    lines = [l.strip() for l in content.split('\n') if l.strip()]
    skip_patterns = [
        r'belton industrial', r'document no', r'^spe-', r'^tm-', r'^title\s*:', 
        r'proprietary information', r'^rel\.\s*date', r'^rev\.', r'^page\b',
        r'^date\s*:', r'^[:\-_\s]+$', r'^\d+$', r'all rights reserved',
        r'belton technology'
    ]
    for line in lines:
        lower = line.lower()
        if any(re.search(pat, lower) for pat in skip_patterns):
            continue
        if 3 <= len(line) <= 120:
            cleaned_title = re.sub(r'\s*Rel\.\s*Date.*$', '', line, flags=re.IGNORECASE)
            cleaned_title = re.sub(r'\s*Date\s*:.*$', '', cleaned_title, flags=re.IGNORECASE)
            cleaned_title = re.sub(r'\s*Rev\.\s*.*$', '', cleaned_title, flags=re.IGNORECASE)
            cleaned_title = cleaned_title.strip(' :-_')
            if len(cleaned_title) >= 3:
                return cleaned_title
    return f"{default_doc_name} - Slide {page_num}"

def main():
    print(f"🚀 [Belton & Seagate Knowledge Ingestion Engine]")
    print(f"   Target JSON Database: {OUTPUT_JSON}")
    print(f"   Target SQLite DB:     {DB_PATH}")

    all_pages = []
    total_docs = 0
    total_pages = 0
    total_chars = 0

    for doc in SLIDE_FILES:
        filepath = doc["filepath"]
        if not os.path.exists(filepath):
            print(f"⚠️ Warning: File not found: {filepath}")
            continue

        print(f"\n📄 Processing [{doc['doc_code']}]: {doc['filename']}")
        reader = PdfReader(filepath)
        page_count = len(reader.pages)
        print(f"   Found {page_count} pages.")
        total_docs += 1

        for idx, page in enumerate(reader.pages):
            page_num = idx + 1
            raw_text = page.extract_text() or ""
            cleaned = clean_text(raw_text)
            cleaned = enrich_rejection_criteria(cleaned)
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
    print(f"   Total Documents Processed: {total_docs}")
    print(f"   Total Pages Ingested:      {total_pages}")
    print(f"   Total Text Characters:     {total_chars:,}")
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

    # Verify search on FTS5 across both Belton & Seagate domains
    print("\n🔍 Verifying SQLite FTS5 multi-domain search...")
    test_queries = [
        "FCOF",
        "Cleanroom",
        "ESD",
        "Silicone",
        "Broken wire",
        "Wet Tray",
        "Hookup",
        "Raw material",
        "MBB"
    ]
    for q in test_queries:
        cursor.execute("""
            SELECT doc_code, page_number, title, substr(content, 1, 100) 
            FROM slides_fts 
            WHERE slides_fts MATCH ? 
            LIMIT 1
        """, (q,))
        row = cursor.fetchone()
        if row:
            snippet = row[3].replace('\n', ' ')
            print(f"   ✅ '{q}': [{row[0]} P.{row[1]}] {row[2][:35]}... -> \"{snippet[:45]}...\"")
        else:
            print(f"   ⚠️ '{q}': No match found")

    conn.close()
    print("\n🎉 [Complete] Belton & Seagate slides successfully 100% ingested into Database!")

if __name__ == "__main__":
    main()
