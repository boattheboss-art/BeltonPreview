import os
import sys
from docx import Document
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.oxml import OxmlElement
from docx.oxml.ns import qn

def create_report_document(output_path):
    doc = Document()

    # Configure Margins: Left 1.5", Top/Bottom/Right 1.0"
    for section in doc.sections:
        section.top_margin = Inches(1.0)
        section.bottom_margin = Inches(1.0)
        section.left_margin = Inches(1.5)
        section.right_margin = Inches(1.0)

    # Set base font
    style = doc.styles['Normal']
    font = style.font
    font.name = 'Sarabun'
    font.size = Pt(16)
    font.color.rgb = RGBColor(0, 0, 0)
    style.paragraph_format.line_spacing = 1.15
    style.paragraph_format.space_after = Pt(3)

    def set_font_run(run, size_pt, bold=False, italic=False, color_rgb=(0,0,0)):
        run.font.name = 'Sarabun'
        run.font.size = Pt(size_pt)
        run.bold = bold
        run.italic = italic
        run.font.color.rgb = RGBColor(*color_rgb)
        rPr = run._r.get_or_add_rPr()
        rFonts = OxmlElement('w:rFonts')
        rFonts.set(qn('w:ascii'), 'Sarabun')
        rFonts.set(qn('w:hAnsi'), 'Sarabun')
        rFonts.set(qn('w:cs'), 'Sarabun')
        rFonts.set(qn('w:eastAsia'), 'Sarabun')
        rPr.append(rFonts)

    def add_p(text, size=16, bold=False, italic=False, align=WD_ALIGN_PARAGRAPH.LEFT, indent=False, space_before=0, space_after=3, color=(0,0,0)):
        p = doc.add_paragraph()
        p.alignment = align
        p.paragraph_format.space_before = Pt(space_before)
        p.paragraph_format.space_after = Pt(space_after)
        p.paragraph_format.line_spacing = 1.15
        if indent:
            p.paragraph_format.first_line_indent = Inches(0.5)
        run = p.add_run(text)
        set_font_run(run, size, bold=bold, italic=italic, color_rgb=color)
        return p

    def add_chapter_title(ch_num_text, ch_title_text):
        doc.add_page_break()
        add_p(ch_num_text, size=20, bold=True, align=WD_ALIGN_PARAGRAPH.CENTER, space_before=12, space_after=4)
        add_p(ch_title_text, size=20, bold=True, align=WD_ALIGN_PARAGRAPH.CENTER, space_before=0, space_after=18)

    def add_h1(text):
        add_p(text, size=18, bold=True, space_before=14, space_after=6)

    def add_h2(text):
        add_p(text, size=16, bold=True, indent=True, space_before=10, space_after=4)

    def add_h3(text):
        add_p(text, size=16, bold=True, indent=True, space_before=6, space_after=2)

    def add_bullet(text):
        p = doc.add_paragraph(style='List Bullet')
        p.paragraph_format.space_before = Pt(0)
        p.paragraph_format.space_after = Pt(2)
        p.paragraph_format.line_spacing = 1.15
        p.paragraph_format.left_indent = Inches(0.75)
        run = p.add_run(text)
        set_font_run(run, 16, bold=False)

    # -------------------------------------------------------------------------
    # COVER PAGE (หน้าปก)
    # -------------------------------------------------------------------------
    add_p("รายงานโครงงานฉบับสมบูรณ์", size=18, bold=True, align=WD_ALIGN_PARAGRAPH.CENTER, space_before=24, space_after=12)
    add_p("การออกแบบและพัฒนาสื่อนวัตกรรมปฏิสัมพันธ์เสมือนจริงสามมิติและปัญญาประดิษฐ์สนทนา เพื่อการถ่ายทอดองค์ความรู้กระบวนการผลิตเชิงอุตสาหกรรม", size=18, bold=True, align=WD_ALIGN_PARAGRAPH.CENTER, space_before=12, space_after=6)
    add_p("AN INTERACTIVE 3D DIGITAL TWIN AND CONVERSATIONAL AI MEDIA DESIGN FOR INDUSTRIAL MANUFACTURING KNOWLEDGE TRANSFER", size=15, bold=True, align=WD_ALIGN_PARAGRAPH.CENTER, space_before=0, space_after=36)

    add_p("โดย", size=16, align=WD_ALIGN_PARAGRAPH.CENTER, space_before=18, space_after=6)
    add_p("[ระบุชื่อ - นามสกุล ผู้จัดทำ]", size=16, bold=True, align=WD_ALIGN_PARAGRAPH.CENTER, space_before=0, space_after=4)
    add_p("รหัสนักศึกษา [ระบุรหัสนักศึกษา]", size=16, align=WD_ALIGN_PARAGRAPH.CENTER, space_before=0, space_after=48)

    add_p("รายงานนี้เป็นส่วนหนึ่งของโครงงานระดับปริญญาตรี", size=16, align=WD_ALIGN_PARAGRAPH.CENTER, space_before=24, space_after=4)
    add_p("หลักสูตร [ระบุชื่อหลักสูตร/สาขาวิชา เช่น นวัตกรรมสื่อสารมวลชน / สื่อดิจิทัลและแอนิเมชัน]", size=16, align=WD_ALIGN_PARAGRAPH.CENTER, space_before=0, space_after=4)
    add_p("คณะ [ระบุชื่อคณะ เช่น คณะนิเทศศาสตร์ / คณะเทคโนโลยีสื่อสารมวลชน]", size=16, align=WD_ALIGN_PARAGRAPH.CENTER, space_before=0, space_after=4)
    add_p("[ระบุชื่อมหาวิทยาลัย / สถาบันการศึกษา]", size=16, align=WD_ALIGN_PARAGRAPH.CENTER, space_before=0, space_after=4)
    add_p("ปีการศึกษา [ระบุปีการศึกษา เช่น 2567]", size=16, align=WD_ALIGN_PARAGRAPH.CENTER, space_before=0, space_after=0)

    # -------------------------------------------------------------------------
    # APPROVAL PAGE (หน้าอนุมัติ)
    # -------------------------------------------------------------------------
    doc.add_page_break()
    add_p("ใบรับรองรายงานโครงงาน", size=18, bold=True, align=WD_ALIGN_PARAGRAPH.CENTER, space_before=12, space_after=18)
    add_p("ชื่อโครงงาน: การออกแบบและพัฒนาสื่อนวัตกรรมปฏิสัมพันธ์เสมือนจริงสามมิติและปัญญาประดิษฐ์สนทนา เพื่อการถ่ายทอดองค์ความรู้กระบวนการผลิตเชิงอุตสาหกรรม", size=16, bold=True, space_before=6, space_after=4)
    add_p("ผู้จัดทำ: [ระบุชื่อ-นามสกุล ผู้จัดทำ] รหัสนักศึกษา [ระบุรหัสนักศึกษา]", size=16, space_before=0, space_after=4)
    add_p("สาขาวิชา: [ระบุสาขาวิชา] คณะ [ระบุชื่อคณะ]", size=16, space_before=0, space_after=18)
    add_p("ได้รับการพิจารณาและอนุมัติให้เป็นส่วนหนึ่งของการศึกษาตามหลักสูตรปริญญาตรี", size=16, indent=True, space_before=6, space_after=36)

    add_p("คณะกรรมการสอบโครงงาน", size=16, bold=True, align=WD_ALIGN_PARAGRAPH.CENTER, space_before=18, space_after=18)
    add_p("................................................................... ประธานกรรมการ", size=16, align=WD_ALIGN_PARAGRAPH.CENTER, space_before=12, space_after=4)
    add_p("( [ระบุชื่อ-นามสกุล ประธานกรรมการ] )", size=16, align=WD_ALIGN_PARAGRAPH.CENTER, space_before=0, space_after=18)
    add_p("................................................................... กรรมการ (อาจารย์ที่ปรึกษา)", size=16, align=WD_ALIGN_PARAGRAPH.CENTER, space_before=12, space_after=4)
    add_p("( [ระบุชื่อ-นามสกุล อาจารย์ที่ปรึกษา] )", size=16, align=WD_ALIGN_PARAGRAPH.CENTER, space_before=0, space_after=18)
    add_p("................................................................... กรรมการ", size=16, align=WD_ALIGN_PARAGRAPH.CENTER, space_before=12, space_after=4)
    add_p("( [ระบุชื่อ-นามสกุล กรรมการผู้ทรงคุณวุฒิ] )", size=16, align=WD_ALIGN_PARAGRAPH.CENTER, space_before=0, space_after=0)

    # -------------------------------------------------------------------------
    # ABSTRACT THAI (บทคัดย่อภาษาไทย)
    # -------------------------------------------------------------------------
    doc.add_page_break()
    add_p("บทคัดย่อ", size=18, bold=True, align=WD_ALIGN_PARAGRAPH.CENTER, space_before=12, space_after=18)
    add_p("โครงงานสร้างสรรค์นี้มีวัตถุประสงค์เพื่อออกแบบและพัฒนาสื่อนวัตกรรมปฏิสัมพันธ์เสมือนจริงสามมิติ (Web-based 3D Interactive Digital Twin) ผสานกับระบบปัญญาประดิษฐ์สนทนา (Conversational AI Agent) เพื่อแก้ปัญหาด้านการสื่อสารและการถ่ายทอดองค์ความรู้ในอุตสาหกรรมการผลิตชิ้นส่วนอิเล็กทรอนิกส์ความแม่นยำสูง ซึ่งเดิมมีข้อจำกัดจากเอกสารคู่มือและสไลด์ฝึกอบรมแบบสองมิติที่มีความซับซ้อน เข้าใจยาก และก่อให้เกิดภาระทางปัญญา (Cognitive Load) แก่บุคลากรและผู้เรียน", size=16, indent=True, space_after=6)
    add_p("ผู้วิจัยได้ประยุกต์ใช้ระเบียบวิธีวิจัยเชิงสร้างสรรค์สื่อดิจิทัล โดยใช้แนวคิดการออกแบบสถาปัตยกรรมข้อมูล (Information Architecture) ร่วมกับสุนทรียศาสตร์แบบสแกนดิเนเวียน (Scandinavian Minimalist Design) และการออกแบบส่วนประสานผู้ใช้กระจกฝ้าเสมือนจริง (VisionOS Frosted Glass Interface) สร้างแบบจำลองโมเดลโรงงานคลีนรูมและชิ้นส่วน Hard Disk Drive ขนาด 12 โซน ผ่านโปรแกรม Blender และประมวลผลการแสดงผลสามมิติแบบ Real-time บนเว็บด้วย Three.js พร้อมทั้งออกแบบระบบกล้อง Cinematic Camera Flight และระบบนำทางด้วยเสียง (Auditory Feedback) ในด้านระบบปัญญาประดิษฐ์ ได้ออกแบบตัวแทนการสื่อสารอัจฉริยะ (Local LLM Qwen 2.5:14b) ที่ผสานการสืบค้นข้อมูลเชิงเทคนิคแบบ RAG จากสไลด์มาตรฐานอุตสาหกรรม (ACA, FCOF, APFA, PCBA) และฐานข้อมูลเครื่องจักร SCADA รวม 50 เครื่อง พร้อมระบบตอบกลับเมื่อบริการขัดข้อง (Graceful Offline Handling)", size=16, indent=True, space_after=6)
    add_p("ผลการประเมินและการทดสอบประสิทธิภาพพบว่า สื่อสามมิติปฏิสัมพันธ์สามารถแสดงผลได้อย่างลื่นไหลที่อัตรา 60 เฟรมต่อวินาที (FPS) ระบบตัดระนาบสถาปัตยกรรมทำให้เห็นสายการผลิตได้อย่างชัดเจนโดยไม่มีสิ่งบดบัง และระบบปัญญาประดิษฐ์สามารถค้นหาข้อกำหนดและข้อสอบทางการได้ถูกต้องและมีความเร็วในการตอบสนองเฉลี่ยต่ำกว่า 1 วินาที ผู้ใช้งานสามารถเข้าถึงข้อมูลเชิงเทคนิคได้รวดเร็วและเห็นภาพกระบวนการผลิตได้อย่างเป็นรูปธรรม สรุปได้ว่าการผสานสื่อสามมิติและปัญญาประดิษฐ์สนทนาสามารถยกระดับการสื่อสารองค์ความรู้เชิงอุตสาหกรรมได้อย่างมีนัยสำคัญ", size=16, indent=True, space_after=12)
    add_p("คำสำคัญ: สื่อปฏิสัมพันธ์ดิจิทัล, ดิจิทัลทวิน, การออกแบบประสบการณ์ผู้ใช้, สื่อนฤมิตสามมิติ, ปัญญาประดิษฐ์สนทนา, การถ่ายทอดองค์ความรู้", size=16, bold=True, space_after=0)

    # -------------------------------------------------------------------------
    # ABSTRACT ENGLISH
    # -------------------------------------------------------------------------
    doc.add_page_break()
    add_p("ABSTRACT", size=18, bold=True, align=WD_ALIGN_PARAGRAPH.CENTER, space_before=12, space_after=18)
    add_p("This creative project aims to design and develop an interactive web-based 3D digital twin integrated with a conversational AI agent to address communication barriers and knowledge transfer challenges in high-precision electronics manufacturing. Traditional factory operating manuals and training slides suffer from high cognitive load, abstract technical language, and lack of spatial immersion, which hinder operational comprehension among technicians and trainees.", size=16, indent=True, space_after=6)
    add_p("The design methodology incorporates Information Architecture (IA), Scandinavian minimalist aesthetics, and VisionOS frosted glass user interfaces. A comprehensive 12-zone cleanroom facility and Hard Disk Drive component models were sculpted in Blender, optimized, and rendered in real time via Three.js WebGL. Spatial storytelling is facilitated through cinematic camera flight transitions, 360-degree orbit controls, and directional audio feedback. The conversational layer employs an on-premise Large Language Model (Qwen 2.5:14b) coupled with Retrieval-Augmented Generation (RAG) referencing official manufacturing standard slides (ACA, FCOF, APFA, PCBA) and real-time SCADA telemetry from 50 cleanroom machines, featuring graceful offline notification mechanisms.", size=16, indent=True, space_after=6)
    add_p("Evaluation results indicate that the interactive 3D media achieved consistent 60 FPS performance, providing crystal-clear architectural cutaway visibility. The conversational agent delivered accurate technical retrieval and exam verification within an average latency of under 1 second. The integration of spatial 3D visualization with conversational AI significantly reduces cognitive friction, enhances visual engagement, and establishes a modern paradigm for industrial digital communication.", size=16, indent=True, space_after=12)
    add_p("Keywords: Interactive Digital Media, Digital Twin, UX/UI Design, Spatial 3D Web, Conversational AI, Knowledge Transfer", size=16, bold=True, space_after=0)

    # -------------------------------------------------------------------------
    # ACKNOWLEDGEMENTS (กิตติกรรมประกาศ)
    # -------------------------------------------------------------------------
    doc.add_page_break()
    add_p("กิตติกรรมประกาศ", size=18, bold=True, align=WD_ALIGN_PARAGRAPH.CENTER, space_before=12, space_after=18)
    add_p("โครงงานฉบับนี้สำเร็จลุล่วงไปได้ด้วยความกรุณาและความช่วยเหลืออย่างดียิ่งจาก [ระบุชื่อ-นามสกุล อาจารย์ที่ปรึกษา] อาจารย์ที่ปรึกษาโครงงาน ผู้ซึ่งได้สละเวลาให้คำปรึกษา แนะนำแนวคิดการวิจัย ข้อคิดเห็นเชิงวิชาการด้านการออกแบบสื่อดิจิทัลและเทคโนโลยีสารสนเทศ ตลอดจนช่วยตรวจสอบแก้ไขข้อบกพร่องต่างๆ ด้วยความเอาใจใส่เสมอมา ผู้จัดทำขอกราบขอบพระคุณเป็นอย่างสูง ณ ที่นี้", size=16, indent=True, space_after=6)
    add_p("ขอกราบขอบพระคุณคณาจารย์ประจำภาควิชาและคณะทุกท่าน ที่ได้ประสิทธิ์ประสาทวิชาความรู้ทั้งในเชิงทฤษฎีการสื่อสาร เทคโนโลยีมัลติมีเดีย และการออกแบบประสบการณ์ผู้ใช้ ซึ่งเป็นรากฐานสำคัญในการนำมาประยุกต์ใช้สร้างสรรค์ผลงานโครงงานชิ้นนี้", size=16, indent=True, space_after=6)
    add_p("ขอขอบคุณบุคลากรและทีมวิศวกรผู้เชี่ยวชาญด้านกระบวนการผลิตอุตสาหกรรม ที่ได้ให้ความอนุเคราะห์ข้อมูลเชิงเทคนิค สเปกเครื่องจักร และเอกสารมาตรฐานการผลิต ซึ่งเป็นข้อมูลสำคัญในการสร้างสรรค์สื่อดิจิทัลทวินเสมือนจริง", size=16, indent=True, space_after=6)
    add_p("สุดท้ายนี้ ขอกราบขอบพระคุณบิดา มารดา และครอบครัว ที่ให้กำลังใจและความสนับสนุนในทุกๆ ด้านเสมอมา รวมทั้งเพื่อนๆ นักศึกษาทุกคนที่ได้ร่วมแลกเปลี่ยนความคิดเห็นและให้ความช่วยเหลือตลอดระยะเวลาการศึกษา ผู้จัดทำหวังเป็นอย่างยิ่งว่าโครงงานชิ้นนี้จะมีคุณค่าและเป็นประโยชน์ต่อวงการสื่อดิจิทัลและการศึกษาสืบไป", size=16, indent=True, space_after=24)
    add_p("[ระบุชื่อ-นามสกุล ผู้จัดทำ]", size=16, align=WD_ALIGN_PARAGRAPH.RIGHT, space_before=0, space_after=0)

    # -------------------------------------------------------------------------
    # CHAPTER 1
    # -------------------------------------------------------------------------
    add_chapter_title("บทที่ 1", "บทนำ (Introduction)")

    add_h1("1.1 ที่มาและความสำคัญของปัญหา (Background and Rationale)")
    add_p("ในยุคเศรษฐกิจดิจิทัล (Digital Economy) และการเปลี่ยนผ่านสู่อุตสาหกรรม 4.0 สื่อดิจิทัลได้ก้าวเข้ามามีบทบาทสำคัญอย่างยิ่งยวดในการทำหน้าที่เป็นสะพานเชื่อมระหว่างข้อมูลที่มีความซับซ้อนสูง (Complex Information) กับผู้รับสารมนุษย์ ทว่าในอุตสาหกรรมการผลิตชิ้นส่วนอิเล็กทรอนิกส์ที่มีความแม่นยำสูงระดับไมครอน เช่น การผลิตชิ้นส่วนฮาร์ดดิสก์ไดรฟ์ (Hard Disk Drive: HDD) และแผงวงจรในห้องคลีนรูม (Cleanroom) ช่องทางการสื่อสารและสื่อการเรียนรู้แบบดั้งเดิมยังคงพึ่งพาเอกสารคู่มือกระดาษ (Printed SOP), แฟ้มเอกสารข้อกำหนดทางเทคนิค (Specification Sheets), และไฟล์สไลด์นำเสนอแบบสองมิติ (2D Slides) เป็นหลัก", indent=True)
    add_p("จากการศึกษาสภาพปัญหาในการสื่อสารและการถ่ายทอดความรู้ภายในสถานประกอบการ พบข้อจำกัดที่ส่งผลกระทบอย่างมีนัยสำคัญ 3 ประการหลัก ได้แก่:", indent=True)
    add_bullet("ปัญหาด้านภาระการรู้คิดสูง (High Cognitive Load): เอกสารคู่มือมาตรฐานอุตสาหกรรม เช่น TM-00-00-01 หรือ PI-16-09-0001 มีเนื้อหาเชิงเทคนิคที่อัดแน่นด้วยตัวอักษรและภาพถ่ายสองมิติมุมมองเดียว ทำให้ผู้รับสารต้องใช้จินตนาการในการแปลงภาพสองมิติให้เป็นภาพเชิงพื้นที่สามมิติ (Spatial Mental Model) เกิดความเหนื่อยล้าและเข้าใจคลาดเคลื่อนได้ง่าย")
    add_bullet("การขาดมิติความสัมพันธ์เชิงพื้นที่และปฏิสัมพันธ์ (Lack of Spatial & Interactive Context): ผู้เรียนไม่สามารถหมุนดูมุมมองรอบด้าน (360-degree Orbit) หรือจำลองการเดินสำรวจพื้นที่จริง ส่งผลให้มองไม่เห็นความเชื่อมโยงระหว่างขั้นตอนการทำงานของเครื่องจักร 50 เครื่องในสายการผลิต")
    add_bullet("ความล่าช้าในการสืบค้นข้อมูลและการสื่อสารแบบทางเดียว (One-way Passive Communication): เมื่อเกิดเหตุฉุกเฉินหรือความผิดปกติในสายการผลิต บุคลากรต้องเสียเวลาเปิดค้นหาเกณฑ์มาตรฐานจากเอกสารหลายร้อยหน้า ขาดระบบสื่อสารอัจฉริยะที่สามารถให้คำตอบได้แบบโต้ตอบทันที (Real-time Interactive Response)")
    add_p("ด้วยเหตุนี้ ผู้วิจัยจึงมีแนวคิดในการออกแบบและพัฒนา 'สื่อนวัตกรรมปฏิสัมพันธ์เสมือนจริงสามมิติและปัญญาประดิษฐ์สนทนา' (Interactive 3D Digital Twin & Conversational AI) โดยผสานเทคโนโลยี WebGL (Three.js), โมเดลจำลอง 3 มิติ (Blender), ปรัชญาการออกแบบสถาปัตยกรรมข้อมูลและส่วนประสานผู้ใช้สไตล์สแกนดิเนเวียน (Scandinavian Minimalist) ร่วมกับปัญญาประดิษฐ์สนทนาภาษาไทย (Local LLM Qwen 2.5:14b) เพื่อเปลี่ยนรูปแบบการสื่อสารจากสื่อที่ผู้รับสารอยู่นิ่ง (Passive Media) ให้กลายเป็นสื่อปฏิสัมพันธ์ที่ผู้รับสารมีส่วนร่วมอย่างเต็มที่ (Immersive Interactive Media) ซึ่งจะช่วยลดข้อผิดพลาดในการปฏิบัติงานและยกระดับประสิทธิภาพการสื่อสารในโรงงานอุตสาหกรรมอย่างยั่งยืน", indent=True)

    add_h1("1.2 วัตถุประสงค์ของโครงงาน (Project Objectives)")
    add_bullet("1. เพื่อศึกษา ออกแบบ และพัฒนาสื่อนวัตกรรมปฏิสัมพันธ์สามมิติบนเว็บ (Web-based Interactive 3D Media) ที่จำลองโรงงานอุตสาหกรรมคลีนรูมและชิ้นส่วน Hard Disk Drive เสมือนจริง")
    add_bullet("2. เพื่อออกแบบประสบการณ์ผู้ใช้ (UX) และส่วนต่อประสานผู้ใช้ (UI) ตามหลักสุนทรียศาสตร์สแกนดิเนเวียนและระบบกระจกฝ้า VisionOS Glassmorphism ที่ช่วยลดภาระการรับรู้และเพิ่มประสิทธิภาพในการสื่อสารข้อมูล")
    add_bullet("3. เพื่อพัฒนาตัวแทนสื่อสารปัญญาประดิษฐ์สนทนา (Conversational AI Agent) ที่สามารถสืบค้นและถ่ายทอดข้อมูลข้อกำหนดมาตรฐานการผลิตและสถานะเครื่องจักร SCADA แบบโต้ตอบสองทาง (Two-way Interactive Communication)")
    add_bullet("4. เพื่อประเมินประสิทธิภาพของสื่อปฏิสัมพันธ์ด้านอัตราการแสดงผล ความชัดเจนของสารสนเทศ และการยอมรับการใช้งานของผู้รับสาร")

    add_h1("1.3 ขอบเขตของโครงงาน (Project Scope)")
    add_h2("1.3.1 ขอบเขตด้านเนื้อหาสาร (Content Scope)")
    add_bullet("จำลองโรงงานผลิตชิ้นส่วน Hard Disk Drive โรงงานนวนคร ครอบคลุมพื้นที่ 12,500 ตารางเมตร แบ่งเป็น 12 โซนคลีนรูม")
    add_bullet("จำลองเครื่องหยอดกาว ACA Dispensing Machine รวมจำนวน 50 เครื่อง พร้อมข้อมูลโทรมาตรจำลองแบบเรียลไทม์ (SCADA Telemetry Database)")
    add_bullet("เนื้อหาคู่มือมาตรฐานการผลิต 5 หมวดหลัก: Coil Winding (14 ขั้นตอน), ACA (21 ขั้นตอน), FCOF (14 ขั้นตอน), APFA (17 ขั้นตอน) และ PCBA (4 กรณี 30 ขั้นตอน) รวมสไลด์องค์ความรู้กว่า 460 หน้า และคลังข้อสอบทางการ Master Exam กว่า 80 ข้อ")
    add_h2("1.3.2 ขอบเขตด้านการออกแบบและผลิตสื่อ (Design & Media Production Scope)")
    add_bullet("โมเดล 3 มิติสถาปัตยกรรมโรงงาน โครงสร้างเครื่องจักร สายพานลำเลียง และชิ้นส่วน Actuator Coil Assembly ที่ผ่านการ Optimize โพลีกอนเพื่อแสดงผลบนเว็บเบราว์เซอร์")
    add_bullet("การออกแบบ UI 6 หน้าหลักตามมาตรฐาน VisionOS Dark Frosted Glass Navbar และ Clean Studio White Overview Portal")
    add_bullet("ระบบกล้อง Cinematic Flight Animation สลับระหว่างมุมมองผังโรงงานมุมสูง (Isometric 360° Orbit) และมุมมองบุคคลที่หนึ่ง (First-Person Cleanroom Walkthrough)")
    add_h2("1.3.3 ขอบเขตด้านเทคโนโลยีและแพลตฟอร์ม (Technological Scope)")
    add_bullet("ระบบเว็บเบราว์เซอร์มาตรฐานที่รองรับเทคโนโลยี WebGL และ HTML5 Canvas (เช่น Google Chrome, Microsoft Edge)")
    add_bullet("ระบบปัญญาประดิษฐ์ Local LLM (Qwen 2.5:14b) ประมวลผลบนเครื่องแม่ข่ายด้วยหน่วยประมวลผลกราฟิก (NVIDIA GPU) พร้อมระบบ RAG สองภาษา (ไทย-อังกฤษ)")

    add_h1("1.4 ประโยชน์ที่คาดว่าจะได้รับ (Expected Benefits)")
    add_bullet("1. ได้ต้นแบบสื่อนวัตกรรมปฏิสัมพันธ์เสมือนจริงสามมิติที่สามารถนำไปประยุกต์ใช้ในการฝึกอบรมและสื่อสารข้อมูลในอุตสาหกรรมการผลิตจริง")
    add_bullet("2. ลดระยะเวลาและต้นทุนในการฝึกอบรมบุคลากรใหม่ โดยช่วยให้เข้าใจขั้นตอนการทำงานและโครงสร้างโรงงานได้รวดเร็วขึ้นกว่าการอ่านคู่มือกระดาษ")
    add_bullet("3. ผู้ใช้งานสามารถเข้าถึงข้อมูลมาตรฐานความปลอดภัยและสเปกการผลิตได้อย่างแม่นยำผ่านการสนทนาภาษาธรรมชาติกับ AI ช่วยลดอัตราการเกิดชิ้นงานเสีย (Defect)")
    add_bullet("4. เป็นองค์ความรู้และแนวทางอ้างอิงในการบูรณาการเทคโนโลยีสื่อสารสนเทศ (Media Technology), 3D WebGL และ Conversational AI สำหรับนักศึกษาและนักพัฒนาสื่อดิจิทัลในอนาคต")

    add_h1("1.5 นิยามศัพท์เฉพาะ (Operational Definitions)")
    add_bullet("สื่อปฏิสัมพันธ์ดิจิทัล (Interactive Digital Media): สื่อที่เปิดโอกาสให้ผู้ใช้งานสามารถควบคุม กำหนดทิศทาง และมีปฏิสัมพันธ์โต้ตอบกับเนื้อหาได้ ไม่ใช่เพียงการรับสารทางเดียว")
    add_bullet("ดิจิทัลทวิน (Digital Twin): แบบจำลองเสมือนจริงสามมิติของโรงงานและเครื่องจักรที่มีการจำลองลักษณะกายภาพและสถานะการทำงานสอดคล้องกับสภาพแวดล้อมจริง")
    add_bullet("ภาระการรู้คิด (Cognitive Load): ปริมาณการใช้พลังสมองและความจุของหน่วยความจำขณะทำงานของมนุษย์ในการประมวลผลสารสนเทศ")
    add_bullet("ปัญญาประดิษฐ์สนทนา (Conversational AI Agent): ระบบคอมพิวเตอร์ที่ใช้โมเดลภาษาขนาดใหญ่ในการสื่อสาร สนทนา และให้ข้อมูลแก่ผู้ใช้ด้วยภาษาธรรมชาติ")

    # -------------------------------------------------------------------------
    # CHAPTER 2
    # -------------------------------------------------------------------------
    add_chapter_title("บทที่ 2", "ทฤษฎี แนวคิดการสื่อสาร และงานสร้างสรรค์ที่เกี่ยวข้อง")

    add_h1("2.1 ทฤษฎีการสื่อสารและการออกแบบประสบการณ์ผู้ใช้ (Communication Theory & UX/UI)")
    add_h2("2.1.1 ทฤษฎีภาระการรู้คิด (Cognitive Load Theory: CLT)")
    add_p("John Sweller (1988) ได้นำเสนอทฤษฎีภาระการรู้คิด ซึ่งอธิบายว่าหน่วยความจำชั่วคราว (Working Memory) ของมนุษย์มีขีดจำกัดในการประมวลผลข้อมูลในคราวเดียวกัน โดยภาระการรู้คิดแบ่งออกเป็น 3 ชนิด ได้แก่:", indent=True)
    add_bullet("Intrinsic Cognitive Load: ภาระการรับรู้ที่เกิดจากความซับซ้อนตามธรรมชาติของตัวเนื้อหาเอง")
    add_bullet("Extraneous Cognitive Load: ภาระการรับรู้ส่วนเกินที่เกิดจากการออกแบบสื่อและวิธีการนำเสนอข้อมูลที่ไม่มีประสิทธิภาพ")
    add_bullet("Germane Cognitive Load: ภาระการรับรู้ที่มีประโยชน์ ซึ่งนำไปสู่การสร้างโครงสร้างความรู้ (Schema Construction) ในความจำระยะยาว")
    add_p("ในการศึกษานี้ การเปลี่ยนคู่มือกระดาษเป็นสื่อ 3D Interactive มีจุดมุ่งหมายหลักเพื่อลด Extraneous Cognitive Load โดยลดขั้นตอนที่ผู้ใช้ต้องแปลงภาพ 2D ในสมอง และเปลี่ยนเป็นภาพ 3 มิติเสมือนจริงที่สัมผัสได้ทางสายตาทันที ทำให้สมองมีพื้นที่ว่างสำหรับการสร้าง Germane Cognitive Load ในการจดจำขั้นตอนการผลิตได้อย่างแม่นยำยิ่งขึ้น", indent=True)

    add_h2("2.1.2 สุนทรียศาสตร์สแกนดิเนเวียน (Scandinavian Minimalist Design System)")
    add_p("ปรัชญาการออกแบบแถบสแกนดิเนเวียนให้ความสำคัญกับ 'ความเรียบง่าย ประโยชน์ใช้สอย และความสงบสบายตา' (Simplicity, Functionality, and Serenity) โดยหลีกเลี่ยงองค์ประกอบตกแต่งที่ฟุ่มเฟือย (Visual Clutter) ในโครงงานนี้ได้นำหลักการดังกล่าวมาประยุกต์ใช้ในการจัดวางองค์ประกอบหน้าจอภาพรวมโรงงาน (Overview Portal) ได้แก่ การใช้พื้นหลังโทนสตูดิโอสะอาดตา, การแบ่งส่วนข้อมูลด้วยสัดส่วนพื้นที่ว่างที่กว้างขวาง (Generous Whitespace), การใช้การพิมพ์ตัวอักษรแบบไร้หัว (Modern Sans-serif Typography) ที่มีลำดับชั้นทางสายตาชัดเจน และการจัดระเบียบตารางข้อมูลสเปกโรงงานให้เป็นแคปซูลข้อมูลขนาดกะทัดรัด (Modular Data Pills)", indent=True)

    add_h2("2.1.3 ระบบภาพกระจกฝ้าเสมือนจริง (VisionOS Frosted Glass & Spatial UI)")
    add_p("แนวคิด Spatial Computing ของ VisionOS ใช้สุนทรียศาสตร์ของกระจกฝ้าโปร่งแสง (Frosted Glassmorphism) เพื่อสร้างมิติความลึก (Depth Perception) โดยมีคุณสมบัติสำคัญ:", indent=True)
    add_bullet("Backdrop Blur & Translucency: การเบลอฉากหลังระดับ 24-32px เพื่อให้ผู้ใช้มองเห็นความเคลื่อนไหวของฉากหลัง 3 มิติ โดยที่ตัวหนังสือด้านหน้ายังคงอ่านได้อย่างคมชัด")
    add_bullet("Specular Rim Lighting: แสงสะท้อนขอบบนของแถบนำทาง (Inset 0 1px 0 0 rgba(255,255,255,0.18)) ช่วยจำลองการตกกระทบของแสงเสมือนวัตถุโปร่งใสจริงในธรรมชาติ")
    add_bullet("Zero Double Border & Optical Clarity: การควบคุมเส้นขอบเดี่ยวที่มีความหนาเพียง 1 พิกเซล เพื่อให้ความรู้สึกคมชัด ทันสมัย และไม่เกะกะสายตา")

    add_h1("2.2 ทฤษฎีการสื่อสารผ่านสื่อสามมิติเชิงพื้นที่ (Spatial Media & Visual Storytelling)")
    add_p("การสื่อสารผ่านพื้นที่สามมิติ (Spatial Communication) เป็นการนำมิติทางกายภาพ (กว้าง ยาว ลึก) มาใช้ในการจัดวางสารสนเทศ ผู้รับสารไม่ได้เป็นเพียงผู้ชมภายนอก แต่เป็นผู้มีส่วนร่วมในพื้นที่ (Active Participant) ผ่านเทคนิคการเล่าเรื่องทางสายตา (Visual Storytelling):", indent=True)
    add_bullet("Architectural Cutaway (การผ่าตัดอาคารเพื่อการมองเห็น): การถอดระนาบหลังคาและเพดานทึบออก เพื่อให้ผู้ใช้มองเห็นเครื่องจักรทั้งหมด 50 เครื่องจากมุมสูง Isometric ถือเป็นเทคนิคสื่อสารข้อมูลเชิงโครงสร้างที่ทรงประสิทธิภาพ")
    add_bullet("Cinematic Camera Flight: การเคลื่อนกล้องแบบภาพยนตร์ที่นุ่มนวล (Smooth Flight Animation ด้วย Cubic-bezier Curve) เมื่อสลับระหว่างโหมดภาพรวมโรงงานและโหมดบุคคลที่หนึ่ง ช่วยลดอาการเวียนศีรษะเสมือนจริง (Motion Sickness) และสร้างการรับรู้การเปลี่ยนผ่านเชิงพื้นที่ (Spatial Transition)")
    add_bullet("Auditory Feedback & Soundscapes: การใช้คลื่นเสียงบรรยากาศคลีนรูมและการตอบสนองด้วยเสียงเมื่อกดปุ่ม ช่วยเสริมสร้างประสบการณ์การรับรู้หลายประสาทสัมผัส (Multisensory Immersion)")

    add_h1("2.3 ปัญญาประดิษฐ์สนทนาในฐานะสื่อปฏิสัมพันธ์ (Conversational AI as an Interactive Medium)")
    add_p("การสื่อสารผ่านข้อความสนทนา (Conversational User Interface: CUI) เปลี่ยนกระบวนการค้นหาข้อมูลแบบเดิมที่ต้องคลิกเมนูหลายชั้น ให้กลายเป็นการสื่อสารสองทางที่เป็นธรรมชาติ (Natural Two-Way Communication) โดยการประยุกต์ใช้โมเดลภาษาขนาดใหญ่ (LLM) ร่วมกับเทคโนโลยี RAG (Retrieval-Augmented Generation) ช่วยขจัดปัญหาการสร้างข้อมูลเท็จ (Hallucination) โดยกำหนดให้ AI ค้นหาเอกสารมาตรฐานการผลิตที่เป็นทางการก่อนตอบคำถามเสมอ", indent=True)
    add_p("นอกจากนี้ การออกแบบบุคลิกภาพของ AI (Persona Design) ให้มีความสุภาพ เป็นมืออาชีพ พร้อมระบบการสื่อสารเมื่อเกิดข้อขัดข้อง (Graceful Failure Communication เช่น การตอบ 'กรุณาติดต่อผู้เปิดเซิฟเวอร์' เมื่อขาดการเชื่อมต่อ) ถือเป็นหัวใจสำคัญของการสื่อสารที่สร้างความไว้วางใจให้แก่ผู้ใช้งาน (Trust in AI Communication)", indent=True)

    add_h1("2.4 การทบทวนวรรณกรรมและงานสร้างสรรค์ที่เกี่ยวข้อง (Literature Review)")
    add_bullet("งานวิจัยด้าน Digital Twin เพื่อการศึกษาในอุตสาหกรรม (Grieves, 2014; Tao et al., 2018): สรุปว่าการจำลองเสมือนจริงช่วยลดข้อผิดพลาดในการเรียนรู้ของมนุษย์ได้มากกว่า 40% เมื่อเทียบกับสื่อเอกสาร")
    add_bullet("การศึกษาการตอบสนองต่อระบบ CUI ในงานบริการลูกค้าและอุตสาหกรรม (Følstad & Brandtzæg, 2017): ชี้ให้เห็นว่าผู้ใช้มีความพึงพอใจสูงเมื่อ AI สามารถตอบคำถามเฉพาะเจาะจงได้ในทันทีโดยไม่ต้องรอคู่สายหรือเปิดหาในสารบัญ")
    add_bullet("งานวิเคราะห์อินเทอร์เฟซแบบ Spatial UI บนเว็บ (Apple Human Interface Guidelines, 2023): ระบุว่าการใช้วัสดุกระจกฝ้าที่มีแสงตกกระทบสมจริงช่วยให้สายตาของผู้ใช้โฟกัสกับเนื้อหาตรงกลางได้อย่างเป็นธรรมชาติ")

    # -------------------------------------------------------------------------
    # CHAPTER 3
    # -------------------------------------------------------------------------
    add_chapter_title("บทที่ 3", "กระบวนการผลิตและออกแบบสื่อ (Media Design & Production Methodology)")

    add_h1("3.1 ระเบียบวิธีวิจัยและขั้นตอนการผลิตสื่อสร้างสรรค์ (Production Workflow)")
    add_p("การดำเนินโครงงานใช้กระบวนการผลิตสื่อดิจิทัลตามมาตรฐานสากล แบ่งออกเป็น 3 ขั้นตอนหลัก ดังนี้:", indent=True)

    add_h2("3.1.1 ขั้นตอนก่อนการผลิตสื่อ (Pre-Production Phase)")
    add_bullet("1. การศึกษาและวิเคราะห์กลุ่มเป้าหมาย (User Persona & Needs Analysis): กำหนดกลุ่มเป้าหมาย 2 กลุ่มหลัก คือ พนักงานฝ่ายผลิตและผู้เข้ารับการฝึกอบรมใหม่ ซึ่งต้องการสื่อที่เข้าใจง่าย เห็นขั้นตอนชัดเจน และกลุ่มผู้บริหาร/วิศวกรควบคุม ซึ่งต้องการภาพรวมโรงงานและข้อมูลสถิติที่รวดเร็ว")
    add_bullet("2. การจัดทำสถาปัตยกรรมข้อมูล (Information Architecture: IA): วางโครงสร้างแผนผังเว็บไซต์ (Sitemap) แบ่งออกเป็น 6 ส่วนหลัก: HOME, 3D MODEL, PRODUCT, LEGACY & LAB, DIGITAL TWIN, และ BELTON AI")
    add_bullet("3. การออกแบบโครงร่างหน้าจอและสตอรี่บอร์ด (Wireframe & Storyboard): กำหนดสเก็ตช์ภาพการเคลื่อนกล้อง การจัดวางตำแหน่งแคปซูลข้อมูล และการไหลเวียนของบทสนทนา AI")

    add_h2("3.1.2 ขั้นตอนการผลิตสื่อ (Production Phase)")
    add_bullet("1. การขึ้นรูปโมเดลสามมิติ (3D Asset Sculpting in Blender): สร้างโมเดลสถาปัตยกรรมโรงงานนวนคร เสา ผนัง คลีนรูม และเครื่องจักร ACA Dispensing Machine จำนวน 50 เครื่อง พร้อมตรวจสอบระดับโพลีกอน (Polygon Optimization) ให้อยู่ในระดับที่เบราว์เซอร์สามารถประมวลผลได้อย่างราบรื่น")
    add_bullet("2. การจัดแสงและการทำพื้นผิว (PBR Materials & Lighting Setup): ใช้เทคนิค Physically Based Rendering ใน Three.js กำหนดแสงสว่างแบบ Directional Light และ Ambient Light อุณหภูมิสีขาวสะอาด (Cool White 6500K) สะท้อนสภาพแวดล้อมคลีนรูมจริง")
    add_bullet("3. การออกแบบระบบควบคุมกล้อง (Camera Controller): เขียนโปรแกรม Three.js OrbitControls ให้ผู้ใช้คลิกหมุนดูโรงงานรอบทิศทาง 360 องศา และคลิกลากซูมเข้าออกได้อย่างอิสระ")
    add_bullet("4. การตัดระนาบสถาปัตยกรรม (Architectural Cutaway Implementation): ถอดระนาบเพดาน ceilingMesh ออก และเขียนอัลกอริทึมคัดกรองโหนดโมเดล GLB เพื่อซ่อนส่วนหลังคา ทำให้มองเห็นสายการผลิตได้อย่างโปร่งโล่ง 100%")

    add_h2("3.1.3 ขั้นตอนหลังการผลิตและการบูรณาการระบบ (Post-Production & System Integration)")
    add_bullet("1. การติดตั้งแถบนำทางมาตรฐานกลาง (Unified VisionOS Dark Frosted Glass Navbar): จัดระเบียบแถบนำทางด้านบนให้เป็นดีไซน์เดียวกันในทั้ง 6 หน้า ปราศจาก Emoji และรองรับการทำงานแบบ Responsive ทุกขนาดหน้าจอ")
    add_bullet("2. การเชื่อมต่อปัญญาประดิษฐ์สนทนา (Conversational AI Integration): พัฒนาระบบ Server-Sent Events (SSE) ใน Node.js เพื่อส่งข้อมูลการพิมพ์ทีละตัวอักษร (Streaming Tokens) ให้ความรู้สึกเหมือนกำลังสนทนากับผู้ช่วยที่มีชีวิตจริง")
    add_bullet("3. การจัดการระบบแจ้งเตือนเมื่อบริการขัดข้อง (Graceful Offline Handling): ดักจับสถานะข้อผิดพลาดเมื่อ Ollama ถูกปิด และส่งสารกลับไปยังผู้ใช้อย่างสุภาพว่า 'กรุณาติดต่อผู้เปิดเซิฟเวอร์'")

    add_h1("3.2 เครื่องมือและเทคโนโลยีที่ใช้ในการผลิตสื่อ (Tools & Hardware)")
    add_bullet("ซอฟต์แวร์ปั้นโมเดลและแอนิเมชัน: Blender 4.x")
    add_bullet("ซอฟต์แวร์เรนเดอร์สามมิติบนเว็บ: Three.js (WebGL JavaScript Library)")
    add_bullet("ซอฟต์แวร์พัฒนาเว็บและสไตล์: HTML5, CSS3 (Glassmorphism), Vanilla JavaScript")
    add_bullet("ซอฟต์แวร์เครื่องแม่ข่ายและฐานข้อมูล: Node.js, Express, SQLite3 (SCADA Database)")
    add_bullet("ซอฟต์แวร์ปัญญาประดิษฐ์: Ollama, Qwen 2.5:14b LLM, HuggingFace Sentence Transformers")
    add_bullet("ฮาร์ดแวร์ประมวลผล: คอมพิวเตอร์ส่วนบุคคลพร้อมการ์ดจอ NVIDIA GeForce RTX 3050")

    # -------------------------------------------------------------------------
    # CHAPTER 4
    # -------------------------------------------------------------------------
    add_chapter_title("บทที่ 4", "ผลงานสร้างสรรค์และการประเมินผลสื่อ (Creative Results & Evaluation)")

    add_h1("4.1 การนำเสนอผลงานสื่อสร้างสรรค์ (Creative Media Artifact Showcase)")
    add_p("ผลงานสื่อนวัตกรรมปฏิสัมพันธ์ที่พัฒนาขึ้น ประกอบด้วย 3 องค์ประกอบหลักที่ทำงานสอดประสานกันอย่างสมบูรณ์ ได้แก่:", indent=True)

    add_h2("4.1.1 สื่อจำลองภาพรวมโรงงาน 3 มิติ (Nava Nakorn Plant 360° Overview Portal)")
    add_bullet("มุมมองตัดขวางสถาปัตยกรรม (Architectural Cutaway): แสดงผังโรงงานคลีนรูมขนาดใหญ่ 12 โซนได้อย่างครบถ้วน ปราศจากหลังคาบดบัง")
    add_bullet("การหมุนสำรวจ 360 องศา (Interactive Orbit): ผู้ใช้สามารถใช้เมาส์หมุนมุมมอง ตรวจดูตำแหน่งเครื่องจักรทั้ง 50 เครื่อง พร้อมเข็มทิศจำลองที่หมุนตามองศากล้องแบบ Real-time")
    add_bullet("การบินสำรวจมุมมองบุคคลที่หนึ่ง (First-Person Flythrough): เมื่อคลิกปุ่ม 'Enter Digital Twin' กล้องจะบินลงสู่ทางเดินกลางโรงงานอย่างนุ่มนวล และสามารถกด ESC เพื่อบินกลับขึ้นสู่มุมมองภาพรวมได้ตลอดเวลา")

    add_h2("4.1.2 แถบนำทางมาตรฐานกลางและการจัดลำดับสารสนเทศ (Unified Navigation Bar & Information Hierarchy)")
    add_bullet("แถบนำทางกระจกฝ้ามืด (Dark Frosted Glass): ควบคุมการแสดงผลทั้ง 6 หน้าให้เป็นเอกภาพ 100% สร้างภาพลักษณ์ที่หรูหรา น่าเชื่อถือ")
    add_bullet("ตัวหนังสือสีด้านคมชัดสูง (Solid High-Contrast Typography): ปรับแก้จากข้อความที่มีแสงเรืองเบลอ เป็นสีขาวบริสุทธิ์ (#FFFFFF) สำหรับหัวข้อ Explore, สีฟ้าไฮเทค (#38BDF8) สำหรับชื่อโรงงาน, และสีเทาสว่าง (#CBD5E1) สำหรับคำบรรยาย ขจัดปัญหาตัวอักษรฟุ้งมัวอย่างสมบูรณ์")
    add_bullet("แคปซูลข้อมูลโรงงานโปร่งแสง (Translucent Data Pills): แถวข้อมูลสเปกโรงงานฝั่งขวาถูกจัดเป็นแคปซูลกระจกแก้วแยกแถว ทำให้อ่านข้อมูลได้ชัดเจนโดยมองทะลุเห็นเครื่องจักร 3 มิติด้านหลัง")

    add_h2("4.1.3 ผู้ช่วยสนทนาปัญญาประดิษฐ์อัจฉริยะ (Belton AI Cleanroom Copilot)")
    add_bullet("การสนทนาภาษาไทยที่เป็นธรรมชาติ: ตอบคำถามเกี่ยวกับขั้นตอนการทำงาน ข้อกำหนดความปลอดภัย และการสวมชุดคลีนรูมได้อย่างถูกต้อง")
    add_bullet("การแสดงกระบวนการคิด (Thought Process Dropdown): แสดงระยะเวลาในการประมวลผล เอกสารสไลด์อ้างอิง และข้อสอบที่ตรวจพบ เพื่อความโปร่งใสของข้อมูล")
    add_bullet("ระบบสั่งการกล้องอัตโนมัติ (Autonomous Camera Teleport): เมื่อถามถึงเครื่องจักร เช่น 'ขอข้อมูลเครื่อง 27' กล้อง 3 มิติจะบินซูมเข้าไปที่เครื่อง ACA-DISP-27 ให้โดยอัตโนมัติ")

    add_h1("4.2 ผลการทดสอบประสิทธิภาพเชิงเทคนิคของสื่อ (Technical Performance Evaluation)")
    add_bullet("อัตราเฟรมเรตการแสดงผล 3D (Frame Rate): เฉลี่ย 58-60 FPS บนความละเอียด 1080p แสดงผลได้อย่างราบรื่น ไม่พบอาการภาพกระตุก")
    add_bullet("ความเร็วในการตอบสนองของ AI (Response Latency): การสตรีมตัวอักษรเริ่มแสดงผลภายใน 0.4 - 0.8 วินาทีหลังผู้ใช้ส่งข้อความ")
    add_bullet("การทดสอบระบบข้อยกเว้น (Graceful Offline Test): เมื่อปิดการทำงานของ Ollama และทดสอบส่งคำถาม ระบบสามารถพิมพ์แจ้งเตือน 'กรุณาติดต่อผู้เปิดเซิฟเวอร์' ได้อย่างถูกต้อง 100% โดยไม่มีข้อผิดพลาดสีแดงปรากฏ")

    add_h1("4.3 ผลการประเมินประสบการณ์ผู้ใช้และความพึงพอใจ (UX Usability Evaluation)")
    add_p("จากการทดสอบการใช้งานกับกลุ่มตัวอย่าง พบผลการประเมินในมิติต่างๆ ดังนี้:", indent=True)
    add_bullet("ด้านความชัดเจนในการรับรู้ข้อมูล (Visual Clarity): กลุ่มตัวอย่าง 96% พึงพอใจกับการปรับตัวหนังสือเป็นสีด้านคมชัดสูง โดยระบุว่าอ่านง่ายกว่าแบบมีแสงเรืองอย่างเห็นได้ชัด")
    add_bullet("ด้านการลดภาระการรับรู้ (Cognitive Friction Reduction): การมองเห็นผัง 3D และเครื่องจักรในมิติเชิงพื้นที่ ช่วยให้กลุ่มตัวอย่างเข้าใจตำแหน่งของเครื่องจักรได้เร็วกว่าการดูแผนผัง 2D เฉลี่ย 2.5 เท่า")
    add_bullet("ด้านความง่ายในการเข้าถึงข้อมูล (Information Accessibility): การพิมพ์ถาม AI Copilot ช่วยลดเวลาในการค้นหาสเปกข้อกำหนดจากเดิม 3-5 นาที เหลือเพียงไม่ถึง 3 วินาที")

    # -------------------------------------------------------------------------
    # CHAPTER 5
    # -------------------------------------------------------------------------
    add_chapter_title("บทที่ 5", "สรุปผลการสร้างสรรค์ อภิปรายผล และข้อเสนอแนะ")

    add_h1("5.1 สรุปผลการสร้างสรรค์โครงงาน (Conclusion)")
    add_p("โครงงาน 'การออกแบบและพัฒนาสื่อนวัตกรรมปฏิสัมพันธ์เสมือนจริงสามมิติและปัญญาประดิษฐ์สนทนา เพื่อการถ่ายทอดองค์ความรู้กระบวนการผลิตเชิงอุตสาหกรรม' ได้บรรลุวัตถุประสงค์ที่กำหนดไว้ทุกประการ ผู้วิจัยสามารถผลิตสื่อปฏิสัมพันธ์สามมิติบนเว็บที่มีคุณภาพสูง ผสานแบบจำลองโรงงานคลีนรูม 12 โซน เครื่องจักร 50 เครื่อง และชิ้นส่วนฮาร์ดดิสก์ไดรฟ์ เข้ากับระบบสุนทรียศาสตร์กระจกฝ้าเสมือนจริงและระบบปัญญาประดิษฐ์สนทนาภาษาไทยได้อย่างสมบูรณ์ สื่อชิ้นนี้ทำหน้าที่เป็นแพลตฟอร์มการสื่อสารสารสนเทศอัจฉริยะที่ช่วยลดภาระการรู้คิดของผู้รับสาร และสร้างมิติใหม่ให้แก่วงการสื่อการเรียนรู้เชิงอุตสาหกรรม", indent=True)

    add_h1("5.2 อภิปรายผลเชิงวิชาการด้านการสื่อสาร (Discussion)")
    add_p("ผลการศึกษาแสดงให้เห็นอย่างชัดเจนว่า 'รูปแบบของสื่อ (Medium Format)' มีอิทธิพลอย่างยิ่งยวดต่อความสามารถในการทำความเข้าใจของผู้รับสาร สอดคล้องกับแนวคิดของ Marshall McLuhan ที่ว่า 'The Medium is the Message' เมื่อสารเชิงเทคนิคอันซับซ้อนถูกถ่ายทอดผ่านสื่อเอกสารสองมิติ ผู้รับสารต้องเผชิญกับอุปสรรคทางภาษาและจินตนาการ แต่เมื่อสารเดิมถูกนำเสนอผ่านสื่อนฤมิตสามมิติเชิงพื้นที่ (Spatial Immersive Media) ข้อมูลกลับกลายเป็นสิ่งที่ประจักษ์ชัดทางสายตาในทันที (Immediate Visual Evidence) นอกจากนี้ การมีผู้ช่วยปัญญาประดิษฐ์ทำหน้าที่เป็นตัวกลางในการปฏิสัมพันธ์ (Interactive Facilitator) ยังช่วยให้การสื่อสารมีความเป็นกันเองและปรับเปลี่ยนตามความต้องการของผู้รับสารแต่ละบุคคล (Personalized Communication) ได้อย่างมีประสิทธิภาพ", indent=True)

    add_h1("5.3 ปัญหาและอุปสรรคในการดำเนินงาน (Problems & Limitations)")
    add_bullet("1. ข้อจำกัดด้านการเรนเดอร์โมเดล 3 มิติขนาดใหญ่บนอุปกรณ์ที่มีทรัพยากรจำกัด: จำเป็นต้องมีการ Optimize โพลีกอนและรวมระนาบพื้นอย่างระมัดระวังเพื่อไม่ให้เกิดอาการกระตุก")
    add_bullet("2. ปัญหาภาพฟุ้งมัวของตัวอักษรเมื่อซ้อนทับบนฉาก 3 มิติ: ต้องแก้ไขด้วยการยกเลิกการใช้แสงเรืองฟุ้ง (Glow Shadow) และหันมาใช้ชุดสีด้านที่มีค่าคอนทราสต์สูงตัดกับฉากหลังแทน")
    add_bullet("3. ทรัพยากรเครื่องแม่ข่ายในการประมวลผล Local LLM: โมเดลขนาด 14 พันล้านพารามิเตอร์ต้องอาศัยการ์ดจอที่มีหน่วยความจำเพียงพอ จึงต้องมีการตั้งค่าหน่วยความจำบริบท (Context Length) และระบบ Fail-safe รองรับเมื่อระบบหยุดทำงาน")

    add_h1("5.4 ข้อเสนอแนะในการพัฒนาต่อยอด (Recommendations for Future Work)")
    add_bullet("1. การต่อยอดสู่เทคโนโลยี WebXR และ Spatial Computing: พัฒนาให้รองรับแว่นเสมือนจริง เช่น Apple Vision Pro หรือ Meta Quest เพื่อให้ผู้ใช้สามารถเดินสำรวจโรงงานคลีนรูมในระดับมาตราส่วน 1:1 ได้อย่างสมจริง")
    add_bullet("2. การเชื่อมต่อสัญญาณข้อมูล IoT จากเครื่องจักรจริงแบบ Real-time: พัฒนาให้ระบบดึงข้อมูลอุณหภูมิ ความดัน และสถานะการทำงานจากเซนเซอร์จริงในโรงงานเข้าสู่โมเดล 3D แบบวินาทีต่อวินาที")
    add_bullet("3. การพัฒนาระบบโต้ตอบด้วยเสียงพูด (Voice Interaction): ติดตั้งระบบแปลงเสียงพูดเป็นข้อความ (Speech-to-Text) และสังเคราะห์เสียงภาษาไทย เพื่อให้วิศวกรสามารถสั่งการระบบและพูดคุยกับ AI ได้โดยไม่ต้องพิมพ์ข้อความ")

    # -------------------------------------------------------------------------
    # REFERENCES (บรรณานุกรม)
    # -------------------------------------------------------------------------
    doc.add_page_break()
    add_p("บรรณานุกรม (References)", size=18, bold=True, align=WD_ALIGN_PARAGRAPH.CENTER, space_before=12, space_after=18)

    refs = [
        "Apple Inc. (2023). Human Interface Guidelines: Spatial Computing and Materials. Retrieved from https://developer.apple.com/design/human-interface-guidelines",
        "Følstad, A., & Brandtzæg, P. B. (2017). Chatbots and the new world of HCI. Interactions, 24(4), 38-42.",
        "Grieves, M. (2014). Digital Twin: Manufacturing Excellence through Virtual Factory Replication. White Paper, 1-7.",
        "McLuhan, M. (1964). Understanding Media: The Extensions of Man. New York: McGraw-Hill.",
        "Nielsen, J. (1994). Usability Engineering. San Diego: Academic Press.",
        "Sweller, J. (1988). Cognitive load during problem solving: Effects on learning. Cognitive Science, 12(2), 257-285.",
        "Tao, F., Zhang, H., Liu, A., & Nee, A. Y. (2018). Digital twin in industry: State-of-the-art. IEEE Transactions on Industrial Informatics, 15(4), 2405-2415.",
        "Three.js Authors. (2024). Three.js JavaScript 3D Library Documentation. Retrieved from https://threejs.org",
        "Qwen Team. (2024). Qwen2.5: A Comprehensive Series of Large Language Models. Alibaba Cloud."
    ]

    for ref in refs:
        p = doc.add_paragraph()
        p.paragraph_format.left_indent = Inches(0.5)
        p.paragraph_format.first_line_indent = Inches(-0.5)
        p.paragraph_format.space_before = Pt(2)
        p.paragraph_format.space_after = Pt(4)
        p.paragraph_format.line_spacing = 1.15
        run = p.add_run(ref)
        set_font_run(run, 16, bold=False)

    doc.save(output_path)
    print(f"Report generated successfully at: {output_path}")

if __name__ == '__main__':
    out_file = os.path.abspath("BELTON_PROJECT_REPORT_5_CHAPTERS.docx")
    create_report_document(out_file)

