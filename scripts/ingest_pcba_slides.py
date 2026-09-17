import os
import sys
import json
import sqlite3
import shutil

# Ensure UTF-8 output
sys.stdout.reconfigure(encoding='utf-8')

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DB_PATH = os.path.join(BASE_DIR, "data", "scada.db")
JSON_PATH = os.path.join(BASE_DIR, "data", "belton_slides_database.json")
SOURCE_PDF = r"C:\งานโบ๊ท\โปรเจค\เนื้อหาเทรนAI\PI-16-09-0001 Process Flow Chart for PCBA product_H.pdf"
DEST_PDF_DIR = os.path.join(BASE_DIR, "data", "documents")
os.makedirs(DEST_PDF_DIR, exist_ok=True)
DEST_PDF = os.path.join(DEST_PDF_DIR, "PI-16-09-0001 Process Flow Chart for PCBA product_H.pdf")

print("1. Copying PDF to project data directory...")
shutil.copy2(SOURCE_PDF, DEST_PDF)
print(f"   Copied to {DEST_PDF}")

# Structured 5-page contents for PI-16-09-0001 Rev. H
pages_data = [
    {
        "doc_code": "PI-16-09-0001",
        "doc_name": "Process Flow Chart for PCBA Process Instruction",
        "filename": "PI-16-09-0001 Process Flow Chart for PCBA product_H.pdf",
        "page_number": 1,
        "title": "PI-16-09-0001 Rev. H: Revision History & Document Purpose",
        "content": """BELTON INDUSTRIAL (THAILAND) LTD.
DOCUMENT NO. : PI-16-09-0001
TITLE : Process Flow Chart for PCBA Process Instruction
REV. : H
PAGE : 1 of 5
REL.DATE : Jul 09, 26

REVISION HISTORY:
- Rev. P1 (Aug 01, 22): Initial Release (ECN No. 2208-0011) - Yutthakarn P.
- Rev. A (Feb 24, 23): Add Process flow for clean model (ECN No. 2302-0025)
- Rev. B (Apr 10, 23): Revise process name in item 2.1 and 2.2 (ECN No. 2304-0044)
- Rev. C (Feb 06, 24): Add PCBA routing process (Opn. 90) (ECN No. 2402-0017)
- Rev. D (Feb 06, 24): Add Vacuum Pressure Oven & AOI Inspection (ECN No. 2501-0053)
- Rev. E (Apr 09, 25): Revise process item 2.1 OPN. 105, 165; Revise item 2.2 OPN. 105, 175 (ECN No. 2504-0018)
- Rev. F (Jul 01, 25): Add Item 2.3 Process flow for no DSP / Flip chip model (ECN No. 2507-0011)
- Rev. G (Nov 06, 25): Add Item 2.3 Process flow for assembly part on 2 sides (Top and Bottom) have DSP/Flipchip component, Topfill and underfill 2 side and cleaning process (ECN No. 2511-0010)
- Rev. H (Jul 01, 26): Addition Item 2.4 PCBAs with components assembled on both top and bottom sides, including PICs components; Swap process flow between laser mark barcode and Bad mark label & Kapton tape laminate (ECN No. 2607-0004) - Patcharin C.

PURPOSE:
1.1 To provide the process flow chart for PCBA Product Process Instruction."""
    },
    {
        "doc_code": "PI-16-09-0001",
        "doc_name": "Process Flow Chart for PCBA Process Instruction",
        "filename": "PI-16-09-0001 Process Flow Chart for PCBA product_H.pdf",
        "page_number": 2,
        "title": "PCBA Case 2.1: Assembly 2 sides (Top & Bottom) + DSP/Flipchip + Cleaning (30 Steps)",
        "content": """BELTON INDUSTRIAL (THAILAND) LTD.
DOCUMENT NO. : PI-16-09-0001 (Rev. H) หน้า 2 of 5
หัวข้อ: 2.1 In case of PCBA have assembly part on 2 sides (Top and Bottom) and DSP/Flipchip component and cleaning process
(กระบวนการผลิต PCBA กรณีประกอบ 2 ด้าน มีชิ้นส่วน DSP/Flipchip และมีกระบวนการล้างทำความสะอาด มีทั้งหมด 30 ขั้นตอน)

ลำดับขั้นตอนการผลิต (30 Operations/Inspections):
1. OPN 10: PCB lot preparation (จัดเตรียมล็อตแผ่นวงจรพิมพ์ PCB) [PI-16-09-0002]
2. OPN 20: PCB baking (อบไล่ความชื้นแผ่น PCB) [PI-16-09-0003]
3. OPN 30: Laser mark barcode (ยิงเลเซอร์มาร์กบาร์โค้ดระบุรหัสบอร์ด) [PI-16-09-0017]
4. OPN 40: Bad mark label and Kapton tape laminate (ติดฉลาก Bad mark และติดเทปแคปตอนป้องกัน) [PI-16-09-0004]
5. OPN 50: Solder paste printed 1 (พิมพ์ครีมบัดกรีรอบที่ 1 ด้านที่ 1) [PI-16-09-0005]
6. OPN 65: SPI 1 (ตรวจวัดคุณภาพเนื้อตะกั่วพิมพ์ 3D SPI รอบที่ 1) [PI-16-09-0006]
7. OPN 70: SMT 1 (วางชิ้นส่วนอุปกรณ์ SMT ด้านที่ 1) [PI-16-09-0007]
8. OPN 80: Reflow soldering 1 (เข้าเตาอบ Reflow หลอมประสานตะกั่วรอบที่ 1) [PI-16-09-0008]
9. OPN 95: AOI 1 (ตรวจสอบรอยต่อตะกั่วและชิ้นส่วนด้วยกล้องอัตโนมัติรอบที่ 1) [PI-16-09-0020]
10. OPN 105: X-ray inspection 1 (NPI 100% / Mass Sampling ตรวจเอกซเรย์จุดบัดกรีใต้ชิป) [PI-16-09-0010]
11. OPN 110: PCBA routing (ตัดแยกขอบบอร์ด PCBA) [PI-16-09-0022]
12. OPN 120: Solder paste printed 2 (พิมพ์ครีมบัดกรีรอบที่ 2 ด้านที่ 2) [PI-16-09-0005]
13. OPN 130: SPI 2 (ตรวจวัดเนื้อตะกั่วพิมพ์ 3D SPI รอบที่ 2) [PI-16-09-0006]
14. OPN 140: SMT 2 (วางชิ้นส่วนอุปกรณ์ SMT ด้านที่ 2) [PI-16-09-0007]
15. OPN 150: Reflow soldering 2 (เข้าเตาอบ Reflow หลอมประสานตะกั่วรอบที่ 2) [PI-16-09-0008]
16. OPN 165: AOI 2 (ตรวจสอบด้วยกล้องอัตโนมัติรอบที่ 2) [PI-16-09-0020]
17. OPN 175: X-ray inspection 2 (NPI 100% / Mass 100% ตรวจเอกซเรย์ 100%) [PI-16-09-0010]
18. OPN 180: Microclean (ล้างทำความสะอาดคราบฟลักซ์ Microclean) [PI-16-09-0018]
19. OPN 190: Dry baking 1 (อบแห้งหลังล้างทำความสะอาด) [PI-16-09-0019]
20. OPN 200: Plasma cleaning (ยิงพลาสม่าทำความสะอาดผิวหน้าสัมผัส) [PI-16-09-0011 / PI-16-09-0026]
21. OPN 210: Underfill dispense 1 (หยอดกาว Underfill ใต้ชิปรอบที่ 1) [PI-16-09-0012]
22. OPN 220: Vacuum Pressure Oven 1 (เข้าตู้อบสุญญากาศไล่ฟองอากาศกาว Underfill รอบที่ 1) [PI-16-09-0025]
23. OPN 230: Underfill cured 1 (อบให้กาว Underfill เซ็ตตัวสมบูรณ์รอบที่ 1) [PI-16-09-0013]
24. OPN 240: Underfill dispense 2 (หยอดกาว Underfill รอบที่ 2) [PI-16-09-0012]
25. OPN 250: Vacuum Pressure Oven 2 (เข้าตู้อบสุญญากาศรอบที่ 2) [PI-16-09-0025]
26. OPN 260: Underfill cured 2 (อบให้กาว Underfill เซ็ตตัวรอบที่ 2) [PI-16-09-0013]
27. OPN 275: 2D AOI Inspection (ตรวจสอบ 2D AOI ตรวจแนวขอบกาวและชิ้นส่วน) [PI-16-09-0029]
28. OPN 285: FVMI (ตรวจสอบความสมบูรณ์ขั้นสุดท้ายด้วยสายตา/กล้อง FVMI) [SPE-16-09-01]
29. OPN 295: OQA (ตรวจปล่อยคุณภาพขั้นสุดท้ายโดยฝ่ายประกันคุณภาพ OQA สุ่มตรวจ) [II-16-09-03]
30. OPN 300: Pack out (บรรจุชิ้นงาน PCBA ลงกล่อง/บรรจุภัณฑ์ส่งมอบ) [PI-16-09-0015]"""
    },
    {
        "doc_code": "PI-16-09-0001",
        "doc_name": "Process Flow Chart for PCBA Process Instruction",
        "filename": "PI-16-09-0001 Process Flow Chart for PCBA product_H.pdf",
        "page_number": 3,
        "title": "PCBA Case 2.2: Assembly 2 sides (Top & Bottom) + No DSP/Flipchip + Cleaning (28 Steps)",
        "content": """BELTON INDUSTRIAL (THAILAND) LTD.
DOCUMENT NO. : PI-16-09-0001 (Rev. H) หน้า 3 of 5
หัวข้อ: 2.2 In case of PCBA have assembly part on 2 sides (Top and Bottom) and No DSP/Flipchip component and cleaning process
(กระบวนการผลิต PCBA กรณีประกอบ 2 ด้าน ไม่มีชิ้นส่วน DSP/Flipchip และมีกระบวนการล้างทำความสะอาด มีทั้งหมด 28 ขั้นตอน)

ลำดับขั้นตอนการผลิต (28 Operations/Inspections):
1. OPN 10: PCB lot preparation (จัดเตรียมล็อต PCB) [PI-16-09-0002]
2. OPN 20: PCB baking (อบแผ่น PCB ไล่ความชื้น) [PI-16-09-0003]
3. OPN 30: Laser mark barcode (ยิงเลเซอร์ระบุบาร์โค้ด) [PI-16-09-0017]
4. OPN 40: Bad mark label and Kapton tape laminate (ติด Bad mark และเทปแคปตอน) [PI-16-09-0004]
5. OPN 50: Solder paste printed 1 (พิมพ์ครีมบัดกรีรอบที่ 1) [PI-16-09-0005]
6. OPN 65: SPI 1 (ตรวจสอบเนื้อตะกั่วบัดกรี SPI รอบที่ 1) [PI-16-09-0006]
7. OPN 70: SMT 1 (วางชิ้นส่วนอุปกรณ์ SMT รอบที่ 1) [PI-16-09-0007]
8. OPN 80: Reflow soldering 1 (อบบัดกรี Reflow รอบที่ 1) [PI-16-09-0008]
9. OPN 95: AOI 1 (ตรวจสอบด้วยกล้อง AOI รอบที่ 1) [PI-16-09-0020]
10. OPN 105: X-ray inspection 1 (NPI 100% / Mass Sampling ตรวจเอกซเรย์) [PI-16-09-0010]
11. OPN 110: Solder paste printed 2 (พิมพ์ครีมบัดกรีรอบที่ 2 ด้านที่ 2) [PI-16-09-0005]
12. OPN 120: SPI 2 (ตรวจสอบเนื้อตะกั่วบัดกรี SPI รอบที่ 2) [PI-16-09-0006]
13. OPN 130: SMT 2 (วางชิ้นส่วนอุปกรณ์ SMT รอบที่ 2) [PI-16-09-0007]
14. OPN 140: Reflow soldering 2 (อบบัดกรี Reflow รอบที่ 2) [PI-16-09-0008]
15. OPN 155: AOI 2 (ตรวจสอบด้วยกล้อง AOI รอบที่ 2) [PI-16-09-0020]
16. OPN 165: X-ray inspection 2 (NPI 100% / Mass 100% ตรวจเอกซเรย์ 100%) [PI-16-09-0010]
17. OPN 170: Microclean (ล้างทำความสะอาด Microclean) [PI-16-09-0018]
18. OPN 180: Dry baking 1 (อบแห้งหลังล้าง) [PI-16-09-0019]
19. OPN 190: Plasma cleaning (ยิงพลาสม่าเตรียมผิว) [PI-16-09-0011 / PI-16-09-0026]
20. OPN 200: Underfill dispense (หยอดกาว Underfill) [PI-16-09-0012]
21. OPN 210: Vacuum Pressure Oven (เข้าตู้อบสุญญากาศไล่ฟองอากาศ) [PI-16-09-0025]
22. OPN 220: Underfill cured (อบให้กาว Underfill แข็งตัว) [PI-16-09-0013]
23. OPN 230: Top fill dispense (หยอดกาว Top fill ด้านบน) [PI-16-09-0012]
24. OPN 240: UV Cured (อบแห้งกาวด้วยแสง UV) [PI-16-09-0024]
25. OPN 255: 2D AOI Inspection (ตรวจสอบด้วยกล้อง 2D AOI) [PI-16-09-0029]
26. OPN 265: FVMI (ตรวจสอบความสมบูรณ์ด้วยกล้อง FVMI) [SPE-16-09-01]
27. OPN 275: OQA (ตรวจปล่อยคุณภาพขั้นสุดท้ายโดยฝ่ายประกันคุณภาพ OQA) [II-16-09-03]
28. OPN 280: Pack out (บรรจุชิ้นงาน PCBA ลงกล่องส่งมอบ) [PI-16-09-0015]"""
    },
    {
        "doc_code": "PI-16-09-0001",
        "doc_name": "Process Flow Chart for PCBA Process Instruction",
        "filename": "PI-16-09-0001 Process Flow Chart for PCBA product_H.pdf",
        "page_number": 4,
        "title": "PCBA Case 2.3: Assembly 2 sides + DSP/Flipchip + Topfill & Underfill 2 sides + Cleaning (33 Steps)",
        "content": """BELTON INDUSTRIAL (THAILAND) LTD.
DOCUMENT NO. : PI-16-09-0001 (Rev. H) หน้า 4 of 5
หัวข้อ: 2.3 In case of PCBA have assembly part on 2 sides (Top and Bottom) have DSP/ Flipchip component, Topfill and underfill 2 side and cleaning process
(กระบวนการผลิต PCBA กรณีประกอบ 2 ด้าน มีชิ้นส่วน DSP/Flipchip หยอด Topfill และ Underfill ทั้ง 2 ด้าน และล้างทำความสะอาด มีทั้งหมด 33 ขั้นตอน)

ลำดับขั้นตอนการผลิต (33 Operations/Inspections):
1. OPN 20: PCB baking (อบไล่ความชื้น PCB) [PI-16-09-0003]
2. OPN 30: Laser mark barcode (ยิงเลเซอร์มาร์กบาร์โค้ด) [PI-16-09-0017]
3. OPN 40: Bad mark label and Kapton tape laminate (ติดฉลาก Bad mark และเทปแคปตอน) [PI-16-09-0004]
4. OPN 50: Solder paste printed 1 (พิมพ์ครีมบัดกรีรอบที่ 1) [PI-16-09-0005]
5. OPN 65: SPI 1 (ตรวจวัดตะกั่วพิมพ์ 3D SPI รอบที่ 1) [PI-16-09-0006]
6. OPN 70: SMT 1 (วางชิ้นส่วนอุปกรณ์ SMT ด้านที่ 1) [PI-16-09-0007]
7. OPN 80: Reflow soldering 1 (อบบัดกรี Reflow รอบที่ 1) [PI-16-09-0008]
8. OPN 95: AOI 1 (ตรวจสอบด้วยกล้อง AOI รอบที่ 1) [PI-16-09-0020]
9. OPN 105: X-ray inspection 1 (NPI 100% / Mass Sampling ตรวจเอกซเรย์) [PI-16-09-0010]
10. OPN 110: PCBA routing (ตัดแยกขอบบอร์ด PCBA) [PI-16-09-0022]
11. OPN 120: Solder paste printed 2 (พิมพ์ครีมบัดกรีรอบที่ 2 ด้านที่ 2) [PI-16-09-0005]
12. OPN 130: SPI 2 (ตรวจวัดตะกั่วพิมพ์ 3D SPI รอบที่ 2) [PI-16-09-0006]
13. OPN 140: SMT 2 (วางชิ้นส่วนอุปกรณ์ SMT ด้านที่ 2) [PI-16-09-0007]
14. OPN 150: Reflow soldering 2 (อบบัดกรี Reflow รอบที่ 2) [PI-16-09-0008]
15. OPN 165: AOI 2 (ตรวจสอบด้วยกล้อง AOI รอบที่ 2) [PI-16-09-0020]
16. OPN 180: Microclean (ล้างทำความสะอาด Microclean) [PI-16-09-0018]
17. OPN 190: Dry baking 1 (อบแห้งหลังล้าง) [PI-16-09-0019]
18. OPN 200: Plasma cleaning BOT (ยิงพลาสม่าผิวบอร์ดด้านล่าง Bottom) [PI-16-09-0011]
19. OPN 210: Underfill dispense BOT (หยอดกาว Underfill ด้านล่าง Bottom) [PI-16-09-0012]
20. OPN 220: Underfill cured BOT (อบให้กาว Underfill ด้านล่างเซ็ตตัว) [PI-16-09-0013]
21. OPN 230: Plasma cleaning TOP (ยิงพลาสม่าผิวบอร์ดด้านบน Top) [PI-16-09-0011 / PI-16-09-0026]
22. OPN 240: Underfill dispense TOP (หยอดกาว Underfill ด้านบน Top) [PI-16-09-0012]
23. OPN 250: Vacuum Oven TOP (เข้าเตาอบสุญญากาศไล่ฟองกาวด้านบน Top) [PI-16-09-0025]
24. OPN 260: Underfill cured TOP (อบให้กาว Underfill ด้านบนเซ็ตตัว) [PI-16-09-0013]
25. OPN 270: Top fill dispense BOT (หยอดกาว Top fill ด้านล่าง Bottom) [PI-16-09-0012]
26. OPN 280: UV Cured BOT (ฉายแสง UV อบกาวด้านล่าง Bottom) [PI-16-09-0024]
27. OPN 290: Top fill dispense TOP (หยอดกาว Top fill ด้านบน Top) [PI-16-09-0012]
28. OPN 300: UV Cured TOP (ฉายแสง UV อบกาวด้านบน Top) [PI-16-09-0024]
29. OPN 310: Topfill baking (อบเตาความร้อนให้กาว Topfill เซ็ตตัวสมบูรณ์) [PI-16-09-0024]
30. OPN 320: 2D AOI Inspection (ตรวจสอบแนวขอบกาวและชิ้นส่วนด้วย 2D AOI) [PI-16-09-0029]
31. OPN 335: FVMI (ตรวจสอบความสมบูรณ์ขั้นสุดท้ายด้วยกล้อง FVMI) [SPE-16-09-01]
32. OPN 345: OQA (ตรวจปล่อยคุณภาพขั้นสุดท้ายโดยฝ่ายประกันคุณภาพ OQA) [II-16-09-03]
33. OPN 350: Pack out (บรรจุชิ้นงาน PCBA ลงบรรจุภัณฑ์ส่งมอบ) [PI-16-09-0015]"""
    },
    {
        "doc_code": "PI-16-09-0001",
        "doc_name": "Process Flow Chart for PCBA Process Instruction",
        "filename": "PI-16-09-0001 Process Flow Chart for PCBA product_H.pdf",
        "page_number": 5,
        "title": "PCBA Case 2.4: Assembly 2 sides with PICs components + Cleaning 2 sides (28 Steps)",
        "content": """BELTON INDUSTRIAL (THAILAND) LTD.
DOCUMENT NO. : PI-16-09-0001 (Rev. H) หน้า 5 of 5
หัวข้อ: 2.4 In the case of PCBAs with components assembled on both the top and bottom sides, including PICs components, perform the cleaning process on both sides.
(กระบวนการผลิต PCBA กรณีประกอบ 2 ด้าน มีชิ้นส่วน PICs และมีกระบวนการล้างทำความสะอาดทั้ง 2 ด้าน มีทั้งหมด 28 ขั้นตอน)

ลำดับขั้นตอนการผลิต (28 Operations/Inspections):
1. OPN 10: PCB lot preparation (จัดเตรียมล็อตแผ่นวงจรพิมพ์ PCB) [PI-16-09-0002]
2. OPN 20: PCB baking (อบไล่ความชื้นแผ่น PCB) [PI-16-09-0003]
3. OPN 30: Laser mark barcode (ยิงเลเซอร์มาร์กบาร์โค้ด) [PI-16-09-0017]
4. OPN 40: Bad mark label and Kapton tape laminate (ติดฉลาก Bad mark และเทปแคปตอน) [PI-16-09-0004]
5. OPN 50: Solder paste printed 1 (พิมพ์ครีมบัดกรีรอบที่ 1) [PI-16-09-0005]
6. OPN 65: SPI 1 (ตรวจวัดคุณภาพเนื้อตะกั่วบัดกรี SPI รอบที่ 1) [PI-16-09-0006]
7. OPN 70: SMT 1 (วางชิ้นส่วนอุปกรณ์ SMT รอบที่ 1) [PI-16-09-0007]
8. OPN 80: Reflow soldering 1 (เข้าเตาอบ Reflow หลอมประสานตะกั่วรอบที่ 1) [PI-16-09-0008]
9. OPN 95: AOI 1 (ตรวจสอบด้วยกล้องอัตโนมัติ AOI รอบที่ 1) [PI-16-09-0020]
10. OPN 110: X-ray inspection 1 (NPI 100% / Mass Sampling ตรวจเอกซเรย์รอบที่ 1) [PI-16-09-0010]
11. OPN 120: Solder paste printed 2 (พิมพ์ครีมบัดกรีรอบที่ 2 ด้านที่ 2) [PI-16-09-0005]
12. OPN 135: SPI 2 (ตรวจวัดคุณภาพเนื้อตะกั่วบัดกรี SPI รอบที่ 2) [PI-16-09-0006]
13. OPN 145: Flip the PIC 180° into the tray (พลิกชิ้นส่วน PIC 180 องศาลงในถาด Tray) [PI-16-09-0030]
14. OPN 155: SMT 2 (วางชิ้นส่วนอุปกรณ์ SMT รอบที่ 2) [PI-16-09-0007]
15. OPN 180: AOI 2 (ตรวจสอบด้วยกล้องอัตโนมัติ AOI รอบที่ 2) [PI-16-09-0020]
16. OPN 195: PIC Inspection (ตรวจสอบชิ้นส่วน PICs) [PI-16-09-0014]
17. OPN 205: Microclean (ล้างทำความสะอาด Microclean) [PI-16-09-0018]
18. OPN 215: Dry baking 1 (อบแห้งหลังล้างทำความสะอาด) [PI-16-09-0019]
19. OPN 230: X-ray inspection 2 (NPI 100% / Mass 100% ตรวจเอกซเรย์รอบที่ 2) [PI-16-09-0010]
20. OPN 245: PIC Inspection (ตรวจสอบชิ้นส่วน PICs ซ้ำเพื่อความสมบูรณ์) [PI-16-09-0014]
21. OPN 255: Plasma cleaning (ยิงพลาสม่าเตรียมผิวทำความสะอาด) [PI-16-09-0011 / PI-16-09-0026]
22. OPN 265: Underfill dispense (หยอดกาว Underfill ใต้ชิป) [PI-16-09-0012]
23. OPN 275: Vacuum Pressure Oven (เข้าตู้อบสุญญากาศไล่ฟองอากาศกาว) [PI-16-09-0025]
24. OPN 285: Underfill cured (อบให้กาว Underfill เซ็ตตัวสมบูรณ์) [PI-16-09-0013]
25. OPN 300: Offline AOI Inspection (ตรวจสอบด้วยกล้อง AOI แบบออฟไลน์) [PI-16-09-0029]
26. OPN 315: PIC Inspection & FVMI (ตรวจสอบชิ้นส่วน PIC และตรวจสอบด้วยสายตาขั้นสุดท้าย) [PI-16-09-0014 / SPE-16-09-01]
27. OPN 330: OQA (ตรวจปล่อยคุณภาพขั้นสุดท้ายโดยฝ่ายประกันคุณภาพ OQA) [II-16-09-03]
28. OPN 340: Pack out (บรรจุชิ้นงาน PCBA ลงกล่อง/บรรจุภัณฑ์ส่งมอบ) [PI-16-09-0015]"""
    }
]

for p in pages_data:
    p["char_count"] = len(p["content"])

print("\n2. Connecting to SQLite database (data/scada.db)...")
conn = sqlite3.connect(DB_PATH)
cursor = conn.cursor()

# Remove old PI-16-09-0001 if already present
cursor.execute("DELETE FROM slide_pages WHERE doc_code = 'PI-16-09-0001'")
cursor.execute("DELETE FROM slides_fts WHERE doc_code = 'PI-16-09-0001'")

for p in pages_data:
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

# Verify total count in DB
cursor.execute("SELECT COUNT(*) FROM slide_pages")
total_db_pages = cursor.fetchone()[0]
print(f"   Database updated successfully! Total slide pages in scada.db: {total_db_pages}")
conn.close()

print("\n3. Updating belton_slides_database.json...")
all_slides = []
if os.path.exists(JSON_PATH):
    with open(JSON_PATH, "r", encoding="utf-8") as f:
        all_slides = json.load(f)

# Filter out any existing PI-16-09-0001
all_slides = [s for s in all_slides if s.get("doc_code") != "PI-16-09-0001"]

# Append new pages
for p in pages_data:
    all_slides.append({
        "doc_code": p["doc_code"],
        "doc_name": p["doc_name"],
        "filename": p["filename"],
        "page_number": p["page_number"],
        "title": p["title"],
        "content": p["content"],
        "char_count": p["char_count"]
    })

# Sort by doc_code and page_number
all_slides.sort(key=lambda x: (x["doc_code"], x["page_number"]))

with open(JSON_PATH, "w", encoding="utf-8") as f:
    json.dump(all_slides, f, ensure_ascii=False, indent=2)

print(f"   JSON updated successfully! Total records in belton_slides_database.json: {len(all_slides)}")

print("\n4. Verification: Querying PI-16-09-0001 from SQLite...")
conn = sqlite3.connect(DB_PATH)
c = conn.cursor()
rows = c.execute("SELECT page_number, title, char_count FROM slide_pages WHERE doc_code = 'PI-16-09-0001' ORDER BY page_number").fetchall()
for r in rows:
    print(f"   Page {r[0]}: {r[1]} ({r[2]} chars)")
conn.close()

print("\n--- ALL INGESTION STEPS COMPLETED SUCCESSFULLY ---")
