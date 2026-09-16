/**
 * Belton Technology (Thailand) - Cleanroom & Process Engineering Knowledge Base
 * Extracted from official training slides:
 * 1. TM-00-00-01: Product & Process Introduction (Coil Winding, ACA, FCOF, APFA)
 * 2. TM-00-00-05_1: Cleanroom Discipline & ESD Awareness (Staff & Operator 2026-27)
 * 3. TM-00-00-05_2: In-Out Cleanroom & Discipline Protocols
 * 4. TM-00-00-05_3: Cleanroom Suit Gowning & Undressing Instructions
 * 5. TM-00-00-05_4: Cleanroom Discipline Work Instruction (WI-CQA-00-00-19)
 */

const BELTON_KNOWLEDGE = `
[BELTON CLEANROOM & PROCESS ENGINEERING DOMAIN KNOWLEDGE]:

1. BELTON CLEANROOM CLASSIFICATION & ENVIRONMENTAL CONTROL (BITN Navanakorn Plant):
   * มาตรฐาน Cleanroom Class (ISO 14644-1 / FED-STD-209E):
     - ISO 5 (Class 100): Hook up, APFA (ความสะอาดสูงสุด อนุภาค >= 0.5 um ไม่เกิน 100 particles/ft³)
     - ISO 6 (Class 1,000): JCS Washing
     - ISO 7 (Class 10,000): Hook up (Assembly), FCA
     - ISO 8 (Class 100,000): FCOF, SMT, Coil Winding, ACA, Carriage
   * พารามิเตอร์ควบคุมสภาวะแวดล้อม (Cleanroom Environmental Standards):
     - อุณหภูมิ (Temperature): 20 - 24 °C
     - ความชื้นสัมพัทธ์ (Relative Humidity): 40 - 70% RH (ในไลน์สำคัญคุม 40 - 55% RH ป้องกัน ESD และสนิม)
     - ความเร็วลม (Air Velocity): 0.41 - 0.61 m/s (ผ่านระบบ FFU / HEPA filter)
     - ความดันอากาศห้อง (Differential Pressure Gauge): +0.05" wg (แรงดันบวก ป้องกันอากาศภายนอกรั่วไหลเข้า)
     - การวัดอนุภาคฝุ่น (Air Particle Counter): ตรวจนับอนุภาคขนาด >= 0.5 ไมครอนเทียบต่อลูกบาศก์ฟุต
   * หัวใจ 4 ข้อหลักในการควบคุมฝุ่นในคลีนรูม (Four Principles of Cleanroom):
     1. Not to Bring Any Dust: ไม่นำพาฝุ่นเข้ามาในห้องคลีนรูม (ทำความสะอาดหน้า ร่างกาย อุปกรณ์ก่อนเข้า)
     2. Not to Generate Any Dust: ไม่ก่อให้เกิดฝุ่นหรือสิ่งที่เกิดฝุ่นได้ง่าย (แต่งกายถูกต้อง ไม่ขยำกระดาษ ไม่ขัดถู)
     3. Not to Accumulate Any Dust: ไม่ทำให้เกิดการสะสมของฝุ่นตามซอกมุม (ทำความสะอาดพื้นที่ตามตารางเวลา)
     4. To Remove Any Dust Quickly: รีบกำจัดฝุ่นทันทีในบริเวณที่เกิด (ใช้ wiper ชุบ IPA เช็ดทันที)

2. CLEANROOM ENTRY, GOWNING & UNDRESSING PROCEDURES (ขั้นตอนการเข้า-ออก และแต่งตัว):
   * กฎการสวมใส่ชุดคลีนรูม (Gowning Sequence - สวมจากบนลงล่าง Top to Bottom):
     1. หมวกคลุมผมชั้นใน (Hairnet): สวมเก็บเส้นผมและรังแคให้มิดชิดใบหู ห้ามมีเส้นผมโผล่ออกมาเด็ดขาด
     2. หน้ากากอนามัย (Face Mask): สวมแนบสนิทปิดปากและจมูก ห้ามดึงลงมาใต้จมูกจนเห็นรูจมูกเด็ดขาด
     3. ชุดจั๊มสูทแบบมีฮูด (Cleanroom Jumpsuit with Hood): ถือรวบแขนและขากางเกงไว้เหนือพื้นขณะสวม ห้ามสัมผัสพื้นห้องแต่งตัวเด็ดขาด รูดซิปปิดมิดถึงคอ ติดกระดุมปลายแขนทั้ง 2 ข้าง
     4. รองเท้าบูทคลีนรูม (Cleanroom Booties / ESD Boots): สวมทับขากางเกง รัดสายล็อคให้กระชับ
     5. ถุงมือ ESD (ESD Gloves): สวมถุงมือคลุมทับปลายแขนเสื้อจั๊มสูทด้านใน และดึงปลายแขนเสื้อด้านนอกทับอีกชั้น ห้ามเผยผิวหนังข้อมือ
   * กฎการถอดชุดคลีนรูม (Undressing Sequence - ถอดตามลำดับย้อนกลับ):
     1. ถอดถุงมือ (Gloves) -> 2. ถอดรองเท้าบูท (Booties) -> 3. ถอดชุดจั๊มสูท (Jumpsuit) -> 4. ถอดหน้ากาก (Face Mask) -> 5. ถอดหมวกคลุมผม (Hairnet)
     - จัดเก็บชุดและ booties ในถุง Jump suit แยกช่อง และส่งซักอย่างน้อยสัปดาห์ละ 1 ครั้ง (Weekly washing color tag)
   * กฎเส้นเหลืองในห้องรองเท้า (Yellow Line Protocol in Shoe Room):
     - ถอดรองเท้าส่วนตัวก่อนก้าวข้ามเส้นเหลือง
     - ภายในเขตเส้นเหลือง ห้ามสวมรองเท้าใดๆ ทั้งสิ้น (เดินด้วยถุงเท้า)
     - รองเท้าส่วนตัวเก็บในตู้รองเท้าส่วนตัว ห้ามวางบนตู้หรือบนพื้น
     - รองเท้า Plant shoes สวมเฉพาะเข้าไลน์ Class 7, 8 และห้ามสวมออกนอกห้องเปลี่ยนชุดเด็ดขาด
   * การทดสอบคราบแป้ง/เครื่องสำอาง (Talc / Cosmetic Black Cloth Test):
     - ตรวจสอบ 100% ก่อนเข้าคลีนรูม: ใช้ผ้าดำเช็ดหน้าผาก แก้ม ลำคอ แขน และตรวจคิ้ว/ปากด้วยผ้าขาว ห้ามพบคราบขาว
     - ห้อง Class 100 ใช้เครื่อง AI ตรวจจับคราบขาวอัตโนมัติ สแกนบัตรพนักงาน หากพบแป้งไฟแดงจะกระพริบ ประตูจะไม่เปิด ต้องกลับไปล้างหน้าใหม่
   * ห้องอาบลม Air Shower (360-Degree Rule):
     - ยืนเป่าลมอย่างน้อย 15 - 20 วินาที โดยยกแขนขึ้น 90° 5 วินาที -> หมุนขวา 5 วินาที -> หมุนหลัง 5 วินาที -> หมุนซ้าย 5 วินาที
     - ห้ามยืนพิงผนัง ห้ามจับหัวจ่ายลม และห้ามกดปุ่มเปิดประตูก่อนเวลาระบบเป่าเสร็จ

3. CONTAMINATION CONTROL & CHEMISTRY (ประเภทสิ่งปนเปื้อนและแหล่งกำเนิด):
   * NVS (Non-Volatile Siloxanes / Organo-Silicon):
     - ลักษณะ: สารประกอบซิลิโคน (Polysiloxane) ระเหยเป็นแก๊ส (Outgassing) และควบแน่นเป็นคราบซิลิโคน (Silicone smear) บนหัวอ่านและแผ่นมีเดีย แม้ระดับ "นาโนกรัม" (Nanogram) ก็ทำให้หัวอ่านบินตกกระทบแผ่นดิสก์เสียหาย
     - แหล่งกำเนิด: ครีมทาหน้า, ครีมทามือ, โลชั่น, น้ำมันใส่ผม, สเปรย์ฉีดผม, ยางซิลิโคน, น้ำยากันสนิม unapproved, สารหล่อลื่น, กาว, หมึกริบบอน
     - สารต้องห้ามบนฉลาก (Banned Ingredients): Dimethicone, Cyclomethicone, Cyclotetrasiloxane, Cyclopentasiloxane
     - เทปต้องห้ามเด็ดขาด (Banned Tapes): Nitto 973UL-S, Tienta tape, Chukoh tape, Splicing tape 3M-1280, PSA tape, เทปใส/เทปโฟม 2 หน้า
   * Talc (Magnesium Silicate - MgSiO):
     - ลักษณะ: แร่ธรรมชาติผงสีขาว เปราะบาง แตกตัวเป็นอนุภาคเล็ก ขัดสีระหว่างหัวอ่านและแผ่นมีเดียทำให้เกิด Disk Scratch
     - แหล่งกำเนิด: แป้งผัดหน้า, แป้งเด็ก, แป้งเค้ก, ครีม whitening, โลชั่น, ยางพารา, แป้งโรยถุงมือยาง, กระดาษธรรมดา, Green mat
   * SiO2 (Silicon Dioxide / Quartz):
     - ลักษณะ: อนุภาคผลึกแข็ง ขัดสีอย่างรุนแรง ทำให้เกิดรอยขีดข่วนถาวรบนหน้าจานแม่เหล็ก (Severe head/media scratch)
     - แหล่งกำเนิด: ฝุ่นทราย, เศษกระจก/แก้ว, กระดาษทราย, แผ่นใยขัด Scotch-Brite, ซิลิกาเจลกันชื้น, ถาด APET Tray ที่ไม่ได้มาตรฐาน
   * Mesa (Western Digital) / Ghost (Seagate):
     - ลักษณะ: Defect ของอนุภาคคอนแทมที่เกิดจากการสลายตัวของไฮโดรคาร์บอน/ยาง (RHC - Rubber Hydrocarbon Compound) เมื่อถูกความร้อนหรือพลาสม่า ส่องใต้กล้องกำลังขยายสูงจะเห็นรูปร่างคล้าย "เงาผี"
     - แหล่งกำเนิด: หมึกพิมพ์ Ribbon, กรีนแมท, พลาสติกทำ Fixture ที่ไม่ทนความร้อน, ถาด Tray สกปรก, คราบน้ำมัน
   * Outgassing:
     - ลักษณะ: การระเหยของแก๊สจากวัสดุสู่บรรยากาศในระบบสุญญากาศของ HDD
     - แหล่งกำเนิด: น้ำยาทาเล็บ, น้ำหอม, ยาดม, ยาหม่อง, สารระเหย, Solvent (Hexane, unapproved IPA)

4. CLEANROOM DISCIPLINE & CODE OF CONDUCT (WI-CQA-00-00-19):
   * การแบ่งระดับความผิดและบทลงโทษ (Discipline Severity Levels & Penalties):
     - Critical (2 ข้อ): ผิดครั้งที่ 1 พักงาน 3 วัน (Suspend 3 days) -> ผิดครั้งที่ 2 ให้ออกทันที (Terminated)
     - Major (16 ข้อ): ครั้งที่ 1 หนังสือเตือน (Warning letter) -> ครั้งที่ 2 พักงาน 3 วัน -> ครั้งที่ 3 ให้ออก
     - Minor (33 ข้อ): ครั้งที่ 1 ตักเตือนด้วยวาจา (Verbal) -> ครั้งที่ 2 หนังสือเตือน -> ครั้งที่ 3 พักงาน 3 วัน -> ครั้งที่ 4 ให้ออก
     (บันทึกประวัติการลงโทษมีผล 1 ปี หาก Auditor ตรวจพบโดยตรง: ครั้งที่ 1 ออกหนังสือเตือน, ครั้งที่ 2 ให้ออกทันที)
   * กฎข้อห้ามระดับวิกฤต (Critical 2 Items):
     - C1: ห้ามแต่งหน้าด้วยเครื่องสำอางทุกชนิด รวมถึงแป้ง, whitening ครีม, ครีมกันแดด, ดินสอเขียนคิ้ว, ลิปสติก ก่อนเข้าหรือขณะอยู่ในห้องเปลี่ยนชุดและคลีนรูม
     - C2: ห้ามรับประทานอาหาร เครื่องดื่มทุกชนิด เคี้ยวหมากฝรั่ง อมลูกอม หรือเก็บอาหาร/เปลือกถุงขนมในชุดคลีนรูมหรือในห้องคลีนรูมเด็ดขาด
   * กฎข้อห้ามระดับรุนแรงมาก (Major 16 Items):
     - MA1: ผู้สัมผัสชิ้นงานที่มี Preamp ประกอบแล้ว ต้องสวมและเสียบสาย Wrist Strap ทุกครั้ง
     - MA2: ห้ามนำของใช้ส่วนตัวเข้าห้องรองเท้า ห้องเปลี่ยนชุด หรือคลีนรูม และห้ามเก็บของในกระเป๋าชุด
     - MA3: พนักงานต้องมีสติกเกอร์ Cleanroom Certificate ประจำปีบนบัตรและไม่หมดอายุ (คนนอกต้องมีพนักงานพาเข้าและผ่านสอบ 100%)
     - MA4: ต้องสวมชุดคลีนรูมให้ครบตามระเบียบ และห้ามสวมชุดคลีนรูมออกนอกห้องเปลี่ยนชุด
     - MA5: ห้ามใช้ชุด/booties ที่ชำรุด ดัดแปลง หรือเขียนข้อความ/วาดรูปบนชุด
     - MA6: ห้ามถอด Booties, ห้ามรูดซิปชุด, ห้ามหดแขนเข้าไปในชุดเพื่อล้วงของ
     - MA7: ห้ามดึงหน้ากากลงต่ำกว่าจมูกจนเห็นรูจมูกเด็ดขาดตลอดเวลาทำงาน
     - MA8: พนักงานห้อง Class 5, 6, 7 ต้องทำความสะอาดบัตรพนักงานและสาย Wrist strap ด้วย IPA ก่อนทำความสะอาดถุงมือ
     - MA9: สวมถุงมือมิดชิดไม่ให้เห็นผิวหนังข้อมือ ห้ามถอดในคลีนรูม หากขาด/เปื้อนต้องเปลี่ยนใหม่ทันที ห้ามกลับด้านใช้ซ้ำ
     - MA10: หยิบชิ้นงานครั้งละ 1 ชิ้น (เว้นแต่ระบุใน PI) และห้ามวางชิ้นงานมากกว่า 1 ชิ้นใน 1 ช่อง tray
     - MA11: ห้ามทำชิ้นงานตกพื้น หากตกต้องส่งทำความสะอาด/ล้างใหม่ และผ่าน VMI 100% พร้อมเปลี่ยนถุงมือใหม่ทันที
     - MA12: ห้ามเขียนหรือวาดรูปบนซองบัตร, โต๊ะ, รถเข็น หรือเฟอร์นิเจอร์ (อนุญาตเฉพาะแผ่น Laminate Sheet)
     - MA13: ห้ามเขียน วาดรูป หรือติดเทป 3M, DCM, 2D label ในถาด tray งาน
     - MA14: ห้ามเปิดประตู Pass Box พร้อมกัน 2 ด้านเด็ดขาด ใช้ส่งของเท่านั้น ห้ามคนมุดเข้า
     - MA15: ห้ามใช้สารเคมี สเปรย์ กาวซ่อมบำรุง ห้ามเชื่อม/บัดกรี ยกเว้นได้รับอนุมัติจาก Contamination Control
     - MA16: ห้ามใช้โทรศัพท์มือถือ หรือหูฟัง Small Talk ยกเว้นหัวหน้างาน โดยเครื่องต้องไม่มีเคสพลาสติก ซิลิโคน หรือพวงกุญแจ
   * กฎข้อห้ามระดับปานกลาง (Minor Highlights):
     - ห้ามวางสิ่งของที่ก่อให้เกิดไฟฟ้าสถิตใกล้ชิ้นงาน Preamp ภายในระยะ 12 นิ้ว (30 ซม.)
     - ห้ามวางโลหะสัมผัสโลหะโดยตรง (Metal to Metal - M2M) ต้องมีวัสดุป้องกัน
     - ห้ามวาง Tray หรืองานบนชั้นล่างสุดที่สูงจากพื้นไม่เกิน 12 นิ้ว
     - หยิบงานตามหลักการ "หยิบใกล้ วางไกล" (Pick near, Place far)
     - ห้ามวางของบังตะแกรงดูดอากาศกลับ (Air return) หรือปรับเลื่อนบานเกล็ดระบายลม
     - ห้ามใช้กระดาษธรรมดาในห้อง Class 5, 6, 7 (อนุญาตเฉพาะ Cleanroom Paper หรือ Class 8 เท่าที่จำเป็น)
     - ห้ามใช้ยาดม ยาหม่อง น้ำหอม หรือสารระเหยที่มีกลิ่นฉุนเกินระยะ 1 เมตร
     - ทำความสะอาดโต๊ะทำงานและอุปกรณ์ด้วย IPA 100% อย่างน้อย 2 ครั้งต่อกะ (ก่อนเบรคและก่อนเลิกงาน)

5. ELECTROSTATIC DISCHARGE (ESD) & EPA CONTROL:
   * ความรู้เบื้องต้นเกี่ยวกับไฟฟ้าสถิต:
     - ESD คือ การถ่ายเทประจุไฟฟ้าสถิตที่สะสมอยู่บนพื้นผิวของวัตถุอย่างรวดเร็วเมื่อเข้าใกล้วัตถุนำไฟฟ้า
     - ความเสียหายต่อวงจร: แบบแอบแฝง (Latent Failure - วงจรเสื่อม อุปกรณ์อายุสั้น ตรวจจับยาก) และแบบทันที (Catastrophic Failure - ไหม้ ละลาย ขาด)
   * โมเดลการจำลองประจุและสเปกขีดจำกัด (ESD Models & Limits):
     1. HBM (Human Body Model - ถ่ายเทจากร่างกายมนุษย์สู่ชิ้นงาน): พิกัดต้อง < 100 Volts (หาก >= 100 V Reject)
     2. CDM (Charged Device Model - ถ่ายเทจากประจุที่สะสมบนตัวงานเอง): พิกัดต้อง < 200 Volts (หาก >= 200 V Reject)
     3. MM (Machine Model - ถ่ายเทจากเครื่องจักร/อุปกรณ์สู่ชิ้นงาน): พิกัดต้อง < 35 Volts (หาก >= 35 V Reject)
     4. Insulator (วัสดุฉนวน): หากมีศักย์ไฟฟ้า > 125 V ต้องวางห่างชิ้นงานอย่างน้อย 1 นิ้ว; หาก > 2,000 V ต้องห่างอย่างน้อย 12 นิ้ว (30 ซม.) หรือเป่าล้างด้วย Air Ionizer
   * การจำแนกประเภทวัสดุ (Material Classification):
     - Shielding: วัสดุป้องกันสนามไฟฟ้าสถิต เช่น Static Shielding Bag, Moisture Barrier Bag
     - Conductive: วัสดุนำไฟฟ้า ถ่ายเทประจุลงกราวด์รวดเร็ว เช่น กล่องโลหะ, สายกราวด์
     - Dissipative: วัสดุกระจายประจุ ถ่ายเทประจุอย่างนุ่มนวล เช่น ESD Table Mat, ESD Tray, ESD Chair
     - Insulator: ฉนวน ไม่นำไฟฟ้า ประจุถ่ายเทไม่ได้ ห้ามนำเข้า EPA เว้นแต่ควบคุมระยะห่าง
   * มาตรฐานอุปกรณ์ในพื้นที่ EPA (Electrostatic Protected Area):
     - EPA GATE: พนักงานต้องยืนบนแผ่นสแตนเลส สวมและเสียบสาย Wrist Strap ทดสอบทั้งสายรัดข้อมือและรองเท้า ESD ก่อนเข้าทุกครั้ง (ค่าความต้านทาน Wrist strap 750 kΩ - 35 MΩ)
     - รถเข็น (Trolley): ล้อต้องเป็น Anti-static และมี โซ่กราวด์ (Ground drag chain) ลากสัมผัสพื้น ESD ตลอดเวลา
     - พัดลมเป่าสลายประจุ (Air Ionizer): ปรับความเร็วลมให้ถึงขีดเส้นสีแดง ปรับมุมเอียงเป่าตรงจุดปฏิบัติงาน และตรวจเช็คสมดุลไอออน (Ion Balance)
     - โต๊ะทำงาน (Work Surface): ปู ESD Table Mat ต่อสายกราวด์ลงดินอย่างสมบูรณ์

6. FCOF PROCESS (Flip Chip On Flex - ทั้งหมด 14 ขั้นตอน):
   * ขั้นตอนที่ 1: Flex Baking (อบไล่ความชื้นของแผ่นวงจรพิมพ์ FPC คุม Temperature และ Duration Time เพื่อป้องกันฟองอากาศ)
   * ขั้นตอนที่ 2: Solder Paste Printing (พิมพ์กาวตะกั่วเหลว คุม Printing Pressure, Speed, Gap และ Cleaning Frequency ของ Stencil aperture ป้องกันตะกั่วลัดวงจร)
   * ขั้นตอนที่ 3: SMT Placement (Chip components - วางอุปกรณ์ชิป Passive ด้วยหัวจับ Pick up/Placement Height และ Speed ความแม่นยำสูง ป้องกัน Tombstoning)
   * ขั้นตอนที่ 4: SMT Placement (Connector placement - จัดวางขั้วต่อคอนเน็กเตอร์ลงบนแผ่นวงจร Flex)
   * ขั้นตอนที่ 5: Die Placement (คว่ำชิปไอซีประมวลผล Pre-amp ลงบน Tacky flux และจัดวางลงบน Flex คุม Flux thickness และ Placement force ระวังไม่ให้ขาล้มช็อต)
   * ขั้นตอนที่ 6: Reflow Soldering (เตาหลอมเชื่อมตะกั่ว คุมเส้นโปรไฟล์อุณหภูมิความร้อน และระดับก๊าซ N2/O2 เพื่อรอยบัดกรีที่แข็งแรงสมบูรณ์)
   * ขั้นตอนที่ 7: Underfill Dispensing (หยอดกาวอีพ็อกซี่ Underfill ไหลแทรกใต้ฐานชิปไอซีด้วยแรงดูดฝอย Capillary action ไร้ฟองอากาศ Voids)
   * ขั้นตอนที่ 8: AOI Inspection (ระบบตรวจจับด้วยภาพถ่ายอัตโนมัติความเร็วสูง Automated Optical Inspection ตรวจเช็กรอยบัดกรีและทิศทางชิ้นส่วน 100% เชื่อมระบบ WMS)
   * ขั้นตอนที่ 9: Snap Cure (อบเตาเร่งการเซ็ตตัวของกาว Underfill ให้เกิด Complete polymerization ทนทานต่อแรงเค้นสะสม)
   * ขั้นตอนที่ 10: Flex Cleaning (ล้างทำความสะอาดแผ่น Flex ขจัดคราบฟลักซ์ตกค้าง คุมอุณหภูมิ, ความเร็วสายพาน, แรงดัน และค่า pH/Resistivity ของน้ำ DI Water)
   * ขั้นตอนที่ 11: X-Ray Inspection (สแกนเอกซเรย์ตรวจการเปียกของเนื้อตะกั่ว Solder wetting ใต้ Pre-amp bumps และเปอร์เซ็นต์โพรงอากาศ Void percent)
   * ขั้นตอนที่ 12: QMAX Test (ทดสอบคุณสมบัติการทำงานทางไฟฟ้าของแผงวงจร PCBA คุมรอบอายุเข็มวัด Probes life cycles และ PCBA working distance)
   * ขั้นตอนที่ 13: FMVI / OQA (Final Microscopic Visual Inspection & Outgoing Quality Assurance ตรวจพินิจความสะอาดและสุ่มตรวจประกันคุณภาพขั้นสุดท้าย)
   * ขั้นตอนที่ 14: Packing (บรรจุลงถาด Anti-static Package พร้อมแนบ Traveller Card ส่งมอบไปยังกระบวนการถัดไป)

7. COIL WINDING PROCESS (การผลิตคอยล์ - ทั้งหมด 14 ขั้นตอน):
   * 1. Winding & Unwire (พันลวดทองแดง) -> 2. Out gassing (อบไล่แก๊ส 180±5°C) -> 3. Dip coating (ชุบเคลือบกาว EPO-TEC-353ND) -> 4. Baking (อบเตา) -> 5. Auto 3-in-1 & UV cure (จัดสาย/ตัดสาย/ยิงกาว UV) -> 6. Auto Lead wire stripping (ลอกฉนวนลวดทองแดง) -> 7. Coil cleaning (ล้าง Ultrasonic) -> 8. Coil thickness inspection (วัดความหนาคอยล์) -> 9. Tube cutting (ตัดท่อหุ้ม) -> 10. Tube insert & wire tracking (สวมท่อหุ้มสายไฟ) -> 11. Baking 2 (อบแห้งท่อหุ้ม) -> 12. Coil resistance (วัดความต้านทาน DCR) -> 13. Visual inspection (ตรวจพินิจด้วยกล้อง) -> 14. OQA & Packing (ตรวจคุณภาพและบรรจุถุง ESD)

8. ACA PROCESS (Actuator Coil Assembly - ทั้งหมด 21 ขั้นตอน):
   * 1. Laser engraving -> 2. Pre-curing/Plasma bobbin -> 3. E-block cleaning -> 4. Coil pre-heating -> 5. Coil & bobbin dispensing -> 6. E-block & Coil dispensing -> 7. Epoxy inspection/mending -> 8. 1st curing -> 9. 2nd curing -> 10. DI water cleaning -> 11. Hi-pot & open test -> 12. Combine DVT & Coil height -> 13. Coil height inspection -> 14. Damper install -> 15. Tube length checking -> 16. Slit height checking -> 17. Resonance checking -> 18. Arm height & tweaking -> 19. Visual inspection -> 20. OQA (0.65% AQL, C=0) -> 21. Packing (บรรจุลงถาด ESD Tray)

9. APFA PROCESS (Arm Pivot Flex Assembly - ทั้งหมด 17 ขั้นตอน):
   * 1. Bending -> 2. Soldering ground pin & VCM pad -> 3. Flex bracket install -> 4. Load in carrier -> 5. AQ Cleaning -> 6. Unload from carrier -> 7. DCM attachment -> 8. T-ring insertion -> 9. Pivot Install -> 10. VMI -> 11. Pivot height checking -> 12. Arm height test -> 13. Electrical test -> 14. Tray label attachment -> 15. OQA -> 16. Final scan -> 17. Packing (ซีลถุงสุญญากาศ Vacuum Pack)
`;

module.exports = { BELTON_KNOWLEDGE };
