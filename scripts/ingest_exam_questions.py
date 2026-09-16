import re
import json
import sqlite3
import os
import sys

# Set stdout encoding
sys.stdout.reconfigure(encoding='utf-8')

GS_PATH = r"C:\งานโบ๊ท\โปรเจค\เนื้อหาเทรนAI\01-Seagate\Master_Exam_Script_SPESeagate_Detailed.gs"
OUTPUT_JSON = os.path.join(os.path.dirname(__file__), "..", "data", "seagate_exam_questions.json")
DB_PATH = os.path.join(os.path.dirname(__file__), "..", "data", "scada.db")

def main():
    print("🚀 [Seagate Master Exam Ingestion Engine]")
    print(f"   Source GS File: {GS_PATH}")
    print(f"   Output JSON:    {OUTPUT_JSON}")
    print(f"   Database:       {DB_PATH}")

    if not os.path.exists(GS_PATH):
        print(f"❌ Error: File not found: {GS_PATH}")
        return

    with open(GS_PATH, "r", encoding="utf-8") as f:
        content = f.read()

    pattern = r'\{\s*"tab":\s*"([^"]+)",\s*"exam_id":\s*"([^"]+)",\s*"title":\s*"([^"]+)",\s*"product":\s*"([^"]+)",\s*"questions":\s*\[(.*?)\]\s*\}'
    matches = re.findall(pattern, content, re.DOTALL)

    all_questions = []

    for tab, exam_id, title, product, q_block in matches:
        q_pairs = re.findall(r'\[\s*"(\d+)\.\s+([^"]+)",\s*"(ถูก|ผิด)"\s*\]', q_block)
        print(f"  📑 [{exam_id}] {product} ({tab}): {len(q_pairs)} questions")
        for q_num, q_text, ans in q_pairs:
            cleaned_text = q_text.strip()
            all_questions.append({
                "doc_code": exam_id,
                "product": product,
                "tab": tab,
                "question_number": int(q_num),
                "full_question": f"{q_num}. {cleaned_text}",
                "question_text": cleaned_text,
                "correct_answer": ans
            })

    print(f"\n📊 Total Master Exam Questions Ingested: {len(all_questions)}")

    # 1. Save to JSON
    os.makedirs(os.path.dirname(OUTPUT_JSON), exist_ok=True)
    with open(OUTPUT_JSON, "w", encoding="utf-8") as f:
        json.dump(all_questions, f, ensure_ascii=False, indent=2)
    print(f"💾 Saved JSON Exam Database: {OUTPUT_JSON}")

    # 2. Ingest into SQLite
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    cursor.execute("DROP TABLE IF EXISTS exam_questions_fts")
    cursor.execute("DROP TABLE IF EXISTS exam_questions")

    cursor.execute("""
        CREATE TABLE exam_questions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            doc_code TEXT NOT NULL,
            product TEXT NOT NULL,
            tab TEXT NOT NULL,
            question_number INTEGER NOT NULL,
            full_question TEXT NOT NULL,
            question_text TEXT NOT NULL,
            correct_answer TEXT NOT NULL
        )
    """)

    cursor.execute("""
        CREATE VIRTUAL TABLE exam_questions_fts USING fts5(
            question_id UNINDEXED,
            doc_code,
            product,
            question_number UNINDEXED,
            full_question,
            correct_answer,
            tokenize='unicode61'
        )
    """)

    for q in all_questions:
        cursor.execute("""
            INSERT INTO exam_questions (doc_code, product, tab, question_number, full_question, question_text, correct_answer)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        """, (q["doc_code"], q["product"], q["tab"], q["question_number"], q["full_question"], q["question_text"], q["correct_answer"]))
        
        q_id = cursor.lastrowid

        cursor.execute("""
            INSERT INTO exam_questions_fts (question_id, doc_code, product, question_number, full_question, correct_answer)
            VALUES (?, ?, ?, ?, ?, ?)
        """, (q_id, q["doc_code"], q["product"], q["question_number"], q["full_question"], q["correct_answer"]))

    conn.commit()
    print("🗄️ Ingested 180 questions into SQLite (exam_questions + exam_questions_fts)")

    # 3. Verification search
    print("\n🔍 Verifying Exam Search:")
    test_q = "Misalignment Damper Arm"
    cursor.execute("""
        SELECT question_id, doc_code, question_number, full_question, correct_answer
        FROM exam_questions_fts
        WHERE exam_questions_fts MATCH ?
        LIMIT 1
    """, (test_q,))
    row = cursor.fetchone()
    if row:
        print(f"  ✅ Matched Q#{row[2]} [{row[1]}]: Answer={row[4]}")
        print(f"     Question: {row[3][:100]}...")
    else:
        print("  ⚠️ No match found for verification")

    conn.close()
    print("\n🎉 Master Exam Ingestion Complete 100%!")

if __name__ == "__main__":
    main()
