import os
import sys
import re
import json
import sqlite3
import time
from concurrent.futures import ThreadPoolExecutor
from pypdf import PdfReader

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')
if hasattr(sys.stderr, 'reconfigure'):
    sys.stderr.reconfigure(encoding='utf-8', errors='replace')

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DB_PATH = os.path.join(BASE_DIR, "data", "scada.db")
JSON_PATH = os.path.join(BASE_DIR, "data", "belton_slides_database.json")

SPE_DIR = os.path.join(r"C:\งานโบ๊ท\โปรเจค\P'Chu", "SPE")
PI_DIR = os.path.join(r"C:\งานโบ๊ท\โปรเจค\P'Chu", "PI")

CUSTOMER_MAP = [
    (r'00-General|00-Common', 'General'),
    (r'01-Seagate|Seagate|\bSG\b', 'Seagate'),
    (r'02-WD|Western Digital|\bWD\b', 'Western Digital'),
    (r'15-Hitachi|Hitachi', 'Hitachi'),
    (r'16-Innolight|Innolight', 'Innolight'),
    (r'17-BTW|BTW', 'BTW'),
    (r'18-BYD|BYD', 'BYD'),
]

def sanitize_text(text):
    if not text:
        return ""
    # Normalize multiple whitespace
    text = re.sub(r'[\r\n]+', '\n', text)
    text = re.sub(r'[ \t]+', ' ', text)
    # Fix common spaced Thai accents or broken glyphs
    text = re.sub(r'เส\s+้น', 'เส้น', text)
    text = re.sub(r'ด\s+้\s*วย', 'ด้วย', text)
    text = re.sub(r'ข\s+้\s*อ', 'ข้อ', text)
    text = re.sub(r'ต\s+้\s*อง', 'ต้อง', text)
    text = re.sub(r'ห\s+้\s*าม', 'ห้าม', text)
    text = re.sub(r'ผ\s+่\s*าน', 'ผ่าน', text)
    text = re.sub(r'ไม\s+่', 'ไม่', text)
    text = re.sub(r'ได\s+้', 'ได้', text)
    return text.strip()

def parse_pdf_metadata(filepath, doc_type):
    filename = os.path.basename(filepath)
    customer = "General"
    for pat, name in CUSTOMER_MAP:
        if re.search(pat, filepath, re.IGNORECASE):
            customer = name
            break
            
    m_code = re.search(r'((?:PI|SPE)-[0-9]{2}-[0-9]{2}[A-Za-z]?-[0-9]{2,4}|(?:PI|SPE)-[0-9]{2}-[0-9]{2}[A-Za-z]?-[0-9]{2})', filename, re.IGNORECASE)
    if m_code:
        doc_code = m_code.group(1).upper()
    else:
        m_fallback = re.search(r'([A-Z]{2,4}-[0-9A-Z_-]+)', filename)
        doc_code = m_fallback.group(1) if m_fallback else os.path.splitext(filename)[0][:20]
        
    clean_name = re.sub(re.escape(doc_code), '', filename, flags=re.IGNORECASE)
    clean_name = re.sub(r'_[A-Za-z0-9]+\.pdf$', '', clean_name, flags=re.IGNORECASE)
    clean_name = re.sub(r'\.pdf$', '', clean_name, flags=re.IGNORECASE)
    clean_name = clean_name.strip(' _-')
    if not clean_name:
        clean_name = filename
        
    return {
        "doc_code": doc_code,
        "doc_name": clean_name,
        "customer": customer,
        "doc_type": doc_type,
        "filename": filename,
        "filepath": filepath
    }

def extract_pdf_pages(meta):
    results = []
    filepath = meta["filepath"]
    try:
        reader = PdfReader(filepath)
        total_p = len(reader.pages)
        for i, page in enumerate(reader.pages):
            raw_text = page.extract_text() or ""
            text = sanitize_text(raw_text)
            lines = [l.strip() for l in text.split('\n') if l.strip()]
            title = lines[0] if lines else f"{meta['doc_name']} Page {i + 1}"
            if len(title) > 120:
                title = title[:120]
                
            results.append({
                "doc_code": meta["doc_code"],
                "doc_name": meta["doc_name"],
                "customer": meta["customer"],
                "doc_type": meta["doc_type"],
                "filename": meta["filename"],
                "page_number": i + 1,
                "title": title,
                "content": text if text else f"[Diagram / Schematic Page] {meta['doc_name']} - {meta['doc_code']} (Page {i+1})",
                "char_count": len(text)
            })
    except Exception as e:
        print(f"  Warning: Error reading {meta['filename']}: {e}")
    return results

def setup_database(db):
    cur = db.cursor()
    # Check if customer and doc_type columns exist in slide_pages
    cur.execute("PRAGMA table_info(slide_pages);")
    cols = [r[1] for r in cur.fetchall()]
    if "customer" not in cols:
        print("Adding 'customer' column to slide_pages...")
        cur.execute("ALTER TABLE slide_pages ADD COLUMN customer TEXT DEFAULT 'General';")
    if "doc_type" not in cols:
        print("Adding 'doc_type' column to slide_pages...")
        cur.execute("ALTER TABLE slide_pages ADD COLUMN doc_type TEXT DEFAULT 'SPE';")
        
    # Update existing rows customer/doc_type if needed
    cur.execute("""
        UPDATE slide_pages 
        SET customer = CASE 
            WHEN doc_code LIKE '%SEAGATE%' OR doc_name LIKE '%SEAGATE%' OR doc_code LIKE 'SPE-01%' THEN 'Seagate'
            ELSE 'General'
        END,
        doc_type = CASE
            WHEN doc_code LIKE 'PI-%' THEN 'PI'
            ELSE 'SPE'
        END
        WHERE customer IS NULL OR customer = 'General';
    """)
    db.commit()

def build_fts_index(db):
    cur = db.cursor()
    print("Building SQLite FTS5 Full-Text Search index...")
    cur.execute("DROP TABLE IF EXISTS slide_pages_fts;")
    cur.execute("""
        CREATE VIRTUAL TABLE slide_pages_fts USING fts5(
            doc_code,
            doc_name,
            customer,
            doc_type,
            page_number UNINDEXED,
            title,
            content,
            tokenize='unicode61'
        );
    """)
    cur.execute("""
        INSERT INTO slide_pages_fts(rowid, doc_code, doc_name, customer, doc_type, page_number, title, content)
        SELECT id, doc_code, doc_name, customer, doc_type, page_number, title, content
        FROM slide_pages;
    """)
    db.commit()
    print("FTS5 Full-Text Search index built successfully!")

def main():
    start_time = time.time()
    print("=" * 70)
    print(" BELTON INDUSTRIAL AI - DOCUMENT INGESTION PIPELINE")
    print(" Ingesting 706 PDF Documents: 28 SPE + 678 PI")
    print("=" * 70)
    
    if not os.path.exists(DB_PATH):
        print(f"Error: Database not found at {DB_PATH}")
        sys.exit(1)
        
    db = sqlite3.connect(DB_PATH)
    setup_database(db)
    
    cur = db.cursor()
    cur.execute("SELECT COUNT(*), COUNT(DISTINCT doc_code) FROM slide_pages;")
    prev_pages, prev_docs = cur.fetchone()
    print(f"Current database state: {prev_pages} pages across {prev_docs} documents.")
    
    # Collect files
    file_metas = []
    for root, dirs, files in os.walk(SPE_DIR):
        for f in files:
            if f.lower().endswith('.pdf'):
                file_metas.append(parse_pdf_metadata(os.path.join(root, f), "SPE"))
                
    for root, dirs, files in os.walk(PI_DIR):
        for f in files:
            if f.lower().endswith('.pdf'):
                file_metas.append(parse_pdf_metadata(os.path.join(root, f), "PI"))
                
    print(f"\nDiscovered {len(file_metas)} PDF files to process.")
    
    # Query existing doc_codes so we can replace or append without duplicate pages
    cur.execute("SELECT DISTINCT doc_code FROM slide_pages;")
    existing_doc_codes = set(r[0] for r in cur.fetchall())
    
    # Process files
    total_files = len(file_metas)
    all_new_pages = []
    inserted_pages_count = 0
    updated_docs = 0
    
    print("\nExtracting and ingesting PDF pages (Batch mode)...")
    
    for idx, meta in enumerate(file_metas, 1):
        pages = extract_pdf_pages(meta)
        if not pages:
            continue
            
        doc_code = meta["doc_code"]
        
        # If this doc_code already had pages, remove old version so we cleanly upsert
        if doc_code in existing_doc_codes:
            cur.execute("DELETE FROM slide_pages WHERE doc_code = ?;", (doc_code,))
            
        for p in pages:
            cur.execute("""
                INSERT INTO slide_pages (doc_code, doc_name, customer, doc_type, filename, page_number, title, content, char_count)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);
            """, (
                p["doc_code"], p["doc_name"], p["customer"], p["doc_type"],
                p["filename"], p["page_number"], p["title"], p["content"], p["char_count"]
            ))
            all_new_pages.append(p)
            inserted_pages_count += 1
            
        updated_docs += 1
        existing_doc_codes.add(doc_code)
        
        if idx % 25 == 0 or idx == total_files:
            db.commit()
            elapsed = time.time() - start_time
            print(f"  Progress: {idx}/{total_files} files ({int(idx/total_files*100)}%) | Inserted {inserted_pages_count} pages | Time: {elapsed:.1f}s")
            
    db.commit()
    
    # Build FTS5 index
    build_fts_index(db)
    
    # Export combined database to belton_slides_database.json for in-memory fallback
    print("\nExporting updated knowledge base to JSON fallback file...")
    cur.execute("""
        SELECT doc_code, doc_name, customer, doc_type, filename, page_number, title, content, char_count
        FROM slide_pages
        ORDER BY doc_code, page_number;
    """)
    rows = cur.fetchall()
    json_data = []
    for r in rows:
        json_data.append({
            "doc_code": r[0],
            "doc_name": r[1],
            "customer": r[2],
            "doc_type": r[3],
            "filename": r[4],
            "page_number": r[5],
            "title": r[6],
            "content": r[7],
            "char_count": r[8]
        })
    with open(JSON_PATH, "w", encoding="utf-8") as f:
        json.dump(json_data, f, ensure_ascii=False, indent=2)
        
    cur.execute("SELECT COUNT(*), COUNT(DISTINCT doc_code) FROM slide_pages;")
    final_pages, final_docs = cur.fetchone()
    
    # Customer breakdown
    cur.execute("SELECT customer, COUNT(DISTINCT doc_code), COUNT(*) FROM slide_pages GROUP BY customer ORDER BY COUNT(*) DESC;")
    summary_rows = cur.fetchall()
    
    db.close()
    
    total_time = time.time() - start_time
    print("=" * 70)
    print(" INGESTION COMPLETE SUCCESSFULLY!")
    print(f" Total time: {total_time:.1f} seconds")
    print(f" Total documents indexed: {final_docs} documents")
    print(f" Total pages in knowledge base: {final_pages} pages (Previous: {prev_pages})")
    print("\n Breakdown by Customer:")
    for cust, d_cnt, p_cnt in summary_rows:
        print(f"   - {cust:18}: {d_cnt:4} documents | {p_cnt:6} pages")
    print(f" JSON backup updated at: {JSON_PATH}")
    print(f" SQLite database updated at: {DB_PATH}")
    print("=" * 70)

if __name__ == "__main__":
    main()

