const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');

const DB_PATH = path.resolve(__dirname, '../data/scada.db');
const JSON_PATH = path.resolve(__dirname, '../data/belton_slides_database.json');

const SLIDE_DATA = [
  {
    page_number: 1,
    title: "ขั้นตอนการสวมชุด Cleanroom 10 ขั้นตอน (Gowning Sequence Master)",
    content: `© 2016, Belton Technology Group. All rights reserved.
คู่มือมาตรฐานขั้นตอนการสวมชุด Cleanroom (Gowning Sequence) ทั้งหมด 10 ขั้นตอน ตามลำดับก่อน-หลัง (TM-00-00-05_3):
ลำดับที่ 1 (หน้า 2): สวมรองเท้า Plant shoes (หยิบออกจากตู้และสวมให้เรียบร้อย)
ลำดับที่ 2 (หน้า 3): สวม Hair net (หยิบออกจากกระเป๋า สวมให้คลุมผมและใบหูทั้ง 2 ข้าง ไม่ให้มีเส้นผมโผล่)
ลำดับที่ 3 (หน้า 4): สวมชุด Jumpsuit (ชุดหมี) โดยระวังไม่ให้แขนเสื้อทั้ง 2 ข้างสัมผัสกับพื้น
ลำดับที่ 4 (หน้า 5): สวม Face mask ให้กระชับใบหน้า คลุมจมูกและคาง
ลำดับที่ 5 (หน้า 6): ติดบัตรพนักงาน ที่บริเวณอกด้านซ้ายหรือแขนซ้ายของชุด Jumpsuit
ลำดับที่ 6 (หน้า 7): รูดซิป และติดกระดุมคอ ของชุด Jumpsuit ให้เรียบร้อย
ลำดับที่ 7 (หน้า 8): สวม Booties (รองเท้าบูทคลีนรูม) ติดกระดุมและรูดซิปให้เรียบร้อย
ลำดับที่ 8 (หน้า 9): สวม Wrist strap และสวมถุงมือ (ดึงถุงมือทับแขนเสื้อชั้นใน และดึงแขนเสื้อนอกทับถุงมือ)
ลำดับที่ 9 (หน้า 10): ติดกระดุมที่แขนชุด Jumpsuit ทั้ง 3 เม็ดให้เรียบร้อยทั้งสองข้าง
ลำดับที่ 10 (หน้า 11): ตรวจดูความเรียบร้อยที่กระจกเงา ก่อนก้าวเข้าสู่ห้องคลีนรูม
(สรุปลำดับ 4-5 อุปกรณ์หลักตาม TM-00-00-05_1 หน้า 33: Hairnet หมวก -> Jumpsuit ชุดหมี -> Facemask หน้ากาก -> Booties รองเท้าบูท -> Gloves ถุงมือ)`
  },
  {
    page_number: 2,
    title: "ขั้นตอนที่ 1: สวมรองเท้า Plant shoes (ข้อปฏิบัติเข้าห้องคลีนรูม Class 8)",
    content: `© 2016, Belton Technology Group. All rights reserved.
ข้อปฏิบัติในการเข้าห้องคลีนรูม Class 8 (ขั้นตอนการสวมชุด Cleanroom)
ขั้นตอนที่ 1 (ลำดับที่ 1): สวมรองเท้า Plant shoes
- หยิบรองเท้า Plant shoes ออกจากตู้ และสวมให้เรียบร้อย
- เป็นขั้นตอนแรกสุดในการเตรียมตัวก่อนเปลี่ยนชุดเข้าห้องคลีนรูม
(သန့်စင်ခန်းအတွင်းသို့ ဝင်ရောက်ရာတွင် လိုက်နာရမည့် စည်းကမ်းများ - အဆင့် ၁: Plant shoes ဖိနပ်ကို ဗီရိုထဲမှယူ၍ စနစ်တကျ စီးပါ)`
  },
  {
    page_number: 3,
    title: "ขั้นตอนที่ 2: สวม Hair net (หมวกคลุมผม)",
    content: `© 2016, Belton Technology Group. All rights reserved.
ขั้นตอนการสวมชุด Cleanroom (Gowning Sequence)
ขั้นตอนที่ 2 (ลำดับที่ 2): สวม Hair net (หมวกคลุมผม)
- หยิบ Hair net ออกจากกระเป๋า
- สวม Hair net ให้คลุมผมและใบหูทั้ง 2 ข้างให้มิดชิด ห้ามมีเส้นผมหรือใบหูโผล่ออกมาภายนอก
(သန့်စင်ခန်းဝတ်စုံ ဝတ်ဆင်ခြင်း အဆင့် ၂: Hair net ဆံပင်စွပ်ကို အိတ်ထဲမှထုတ်၍ ဆံပင်နှင့် နားရွက်နှစ်ဖက်လုံး လုံခြုံစွာ ဖုံးအုပ်အောင် စွပ်ပါ)`
  },
  {
    page_number: 4,
    title: "ขั้นตอนที่ 3: สวม Jumpsuit (ชุดหมีคลีนรูม)",
    content: `© 2016, Belton Technology Group. All rights reserved.
ขั้นตอนการสวมชุด Cleanroom (Gowning Sequence)
ขั้นตอนที่ 3 (ลำดับที่ 3): สวมชุด Jumpsuit (ชุดหมี)
- สวมชุด Jumpsuit ให้เรียบร้อย
- ข้อควรระวังสำคัญ: ระวังไม่ให้แขนเสื้อและขากางเกงทั้ง 2 ข้างสัมผัสกับพื้นโดยเด็ดขาด (Need to gather sleeves and legs, do not touch floor)
(သန့်စင်ခန်းဝတ်စုံ ဝတ်ဆင်ခြင်း အဆင့် ၃: Jumpsuit ဝတ်ရုံကို ကြမ်းပြင်နှင့် မထိစေဘဲ သတိထား၍ စနစ်တကျ ဝတ်ဆင်ပါ)`
  },
  {
    page_number: 5,
    title: "ขั้นตอนที่ 4: สวม Face mask (หน้ากากอนามัยคลีนรูม)",
    content: `© 2016, Belton Technology Group. All rights reserved.
ขั้นตอนการสวมชุด Cleanroom (Gowning Sequence)
ขั้นตอนที่ 4 (ลำดับที่ 4): สวม Face mask (หน้ากากอนามัย)
- สวม Face mask ให้กระชับใบหน้า คลุมทั้งจมูกและคางอย่างมิดชิด
(သန့်စင်ခန်းဝတ်စုံ ဝတ်ဆင်ခြင်း အဆင့် ၄: Face mask နှာခေါင်းစည်းကို နှာခေါင်းနှင့် မေးစေ့ လုံခြုံအောင် တပ်ဆင်ပါ)`
  },
  {
    page_number: 6,
    title: "ขั้นตอนที่ 5: ติดบัตรพนักงานบนชุด Jumpsuit",
    content: `© 2016, Belton Technology Group. All rights reserved.
ขั้นตอนการสวมชุด Cleanroom (Gowning Sequence)
ขั้นตอนที่ 5 (ลำดับที่ 5): ติดบัตรพนักงาน (Employee ID Card)
- นำบัตรพนักงานมาติดที่บริเวณหน้าอกด้านซ้าย หรือแขนเสื้อด้านซ้ายของชุด Jumpsuit ให้เห็นชัดเจน
(သန့်စင်ခန်းဝတ်စုံ ဝတ်ဆင်ခြင်း အဆင့် ၅: ဝန်ထမ်းကတ်ကို Jumpsuit ဝတ်ရုံ၏ ဘယ်ဘက်ရင်ဘတ် သို့မဟုတ် ဘယ်ဘက်လက်မောင်းတွင် ချိတ်ဆွဲပါ)`
  },
  {
    page_number: 7,
    title: "ขั้นตอนที่ 6: รูดซิปและติดกระดุมคอ Jumpsuit",
    content: `© 2016, Belton Technology Group. All rights reserved.
ขั้นตอนการสวมชุด Cleanroom (Gowning Sequence)
ขั้นตอนที่ 6 (ลำดับที่ 6): รูดซิป และติดกระดุมคอของชุด Jumpsuit
- รูดซิปชุด Jumpsuit ขึ้นจนสุด และติดกระดุมที่คอให้เรียบร้อยมิดชิด
(သန့်စင်ခန်းဝတ်စုံ ဝတ်ဆင်ခြင်း အဆင့် ၆: Jumpsuit ဝတ်ရုံ၏ ဇစ်ကို အဆုံးထိဆွဲတင်ပြီး လည်ပင်းကြယ်သီးကို စနစ်တကျ တပ်ပါ)`
  },
  {
    page_number: 8,
    title: "ขั้นตอนที่ 7: สวม Booties (รองเท้าบูทคลีนรูม)",
    content: `© 2016, Belton Technology Group. All rights reserved.
ขั้นตอนการสวมชุด Cleanroom (Gowning Sequence)
ขั้นตอนที่ 7 (ลำดับที่ 7): สวม Booties (รองเท้าบูทคลีนรูม)
- สวมรองเท้า Booties ทับขากางเกง Jumpsuit
- รูดซิปและติดกระดุมของ Booties ให้เรียบร้อยทั้งสองข้าง
(သန့်စင်ခန်းဝတ်စုံ ဝတ်ဆင်ခြင်း အဆင့် ၇: Booties ဖိနပ်ရှည်ကို စီး၍ ဇစ်ဆွဲပြီး ကြယ်သီးတပ်ပါ)`
  },
  {
    page_number: 9,
    title: "ขั้นตอนที่ 8: สวม Wrist strap และสวมถุงมือ (Gloves)",
    content: `© 2016, Belton Technology Group. All rights reserved.
ขั้นตอนการสวมชุด Cleanroom (Gowning Sequence)
ขั้นตอนที่ 8 (ลำดับที่ 8): สวม Wrist strap และสวมถุงมือ (Gloves)
- สวม Wrist strap ให้แนบสนิทกับผิวข้อมือ
- สวมถุงมือให้เรียบร้อย โดยดึงขอบถุงมือทับแขนเสื้อชั้นใน และดึงแขนเสื้อนอกของ Jumpsuit ทับถุงมือให้กระชับ
(သန့်စင်ခန်းဝတ်စုံ ဝတ်ဆင်ခြင်း အဆင့် ၈: Wrist strap လက်ပတ်နှင့် လက်အိတ်ကို စနစ်တကျ ဝတ်ဆင်ပါ)`
  },
  {
    page_number: 10,
    title: "ขั้นตอนที่ 9: ติดกระดุมที่แขนชุด Jumpsuit ทั้ง 3 เม็ด",
    content: `© 2016, Belton Technology Group. All rights reserved.
ขั้นตอนการสวมชุด Cleanroom (Gowning Sequence)
ขั้นตอนที่ 9 (ลำดับที่ 9): ติดกระดุมที่แขนชุด Jumpsuit
- ติดกระดุมที่แขนเสื้อชุด Jumpsuit ทั้ง 3 เม็ดให้เรียบร้อยทั้งสองข้าง (ซ้ายและขวา) เพื่อป้องกันสิ่งปนเปื้อนหลุดรอด
(သန့်စင်ခန်းဝတ်စုံ ဝတ်ဆင်ခြင်း အဆင့် ၉: Jumpsuit လက်မောင်းကြယ်သီး ၃ လုံးစလုံးကို ဘယ်ညာနှစ်ဖက်လုံး စနစ်တကျ တပ်ပါ)`
  },
  {
    page_number: 11,
    title: "ขั้นตอนที่ 10: ตรวจดูความเรียบร้อยที่กระจกก่อนเข้าห้องคลีนรูม",
    content: `© 2016, Belton Technology Group. All rights reserved.
ขั้นตอนการสวมชุด Cleanroom (Gowning Sequence)
ขั้นตอนที่ 10 (ลำดับที่ 10): ตรวจดูความเรียบร้อยที่กระจกเงา
- ส่องกระจกเงาตรวจสอบความเรียบร้อยตั้งแต่ศีรษะจรดเท้า (หมวกคลุมผมมิดชิด, หน้ากากปิดสนิท, ซิปและกระดุมติดครบ, รองเท้าบูทเรียบร้อย) ก่อนเดินผ่านเข้าสู่ห้องคลีนรูม
(သန့်စင်ခန်းဝတ်စုံ ဝတ်ဆင်ခြင်း အဆင့် ၁၀: သန့်စင်ခန်းထဲမဝင်မီ မှန်ရှေ့တွင် ဝတ်စုံသပ်ရပ်မှု ရှိမရှိ စစ်ဆေးပါ)`
  },
  {
    page_number: 12,
    title: "ขั้นตอนการถอดชุด Cleanroom 10 ขั้นตอน (Degowning Sequence Master)",
    content: `© 2016, Belton Technology Group. All rights reserved.
คู่มือมาตรฐานขั้นตอนการถอดชุด Cleanroom (Degowning Sequence) ทั้งหมด 10 ขั้นตอน ตามลำดับก่อน-หลัง (TM-00-00-05_3):
ข้อ 1 (หน้า 13): ถอด Booties (รองเท้าบูท) ออกให้เรียบร้อย
ข้อ 2 (หน้า 14): ประกบพื้น Booties ทั้ง 2 ข้างเข้าด้วยกัน
ข้อ 3 (หน้า 15): ม้วน Booties ให้เรียบร้อย และเก็บใส่ช่องกระเป๋า Jumpsuit ด้านนอก
ข้อ 4 (หน้า 16): ปลดกระดุมแขนเสื้อ และถอดถุงมือออกให้เรียบร้อย
ข้อ 5 (หน้า 17): รูดซิป ปลดกระดุมคอ Jumpsuit และย้ายบัตรพนักงานกลับมาติดที่กระเป๋าเสื้อทำงาน
ข้อ 6 (หน้า 18): ถอด Face mask ออก และเก็บลงในช่องกระเป๋า Jumpsuit ด้านใน
ข้อ 7 (หน้า 19): ถอดชุด Jumpsuit โดยระวังไม่ให้ชุดสัมผัสพื้น และพับเก็บใส่กระเป๋าให้เรียบร้อย
ข้อ 8 (หน้า 20): ถอด Hair net (หมวกคลุมผม) ออก
ข้อ 9 (หน้า 21): ม้วน Hair net และเก็บใส่กระเป๋าชุด
ข้อ 10 (หน้า 22): สวมรองเท้า Plant shoes และนำกระเป๋าชุดไปเก็บในตู้ล็อกเกอร์
(ข้อควรระวังสำคัญหน้า 23: ห้ามนำรองเท้า Plant shoes ใส่ไว้ใน Booties แล้วเก็บเข้าล็อกเกอร์เด็ดขาด)`
  },
  {
    page_number: 13,
    title: "ขั้นตอนการถอดชุด ข้อ 1: ถอด Booties ออกให้เรียบร้อย",
    content: `© 2016, Belton Technology Group. All rights reserved.
ขั้นตอนการถอดชุด Cleanroom (Degowning Sequence)
ข้อ 1 (ลำดับที่ 1 ในการถอด): ถอด Booties (รองเท้าบูทคลีนรูม) ออกให้เรียบร้อย
- ปลดกระดุม รูดซิป และถอดรองเท้า Booties ออกเป็นลำดับแรก
(သန့်စင်ခန်းဝတ်စုံ ချွတ်ခြင်း အဆင့် ၁: Booties ဖိနပ်ရှည်ကို စနစ်တကျ စတင်ချွတ်ပါ)`
  },
  {
    page_number: 14,
    title: "ขั้นตอนการถอดชุด ข้อ 2: ประกบพื้น Booties ทั้ง 2 ข้างเข้าด้วยกัน",
    content: `© 2016, Belton Technology Group. All rights reserved.
ขั้นตอนการถอดชุด Cleanroom (Degowning Sequence)
ข้อ 2 (ลำดับที่ 2 ในการถอด): ประกบพื้น Booties ทั้ง 2 ข้างเข้าด้วยกัน
- นำพื้นรองเท้า Booties ทั้งสองข้างมาประกบหันหน้าชนกัน เพื่อไม่ให้สิ่งสกปรกที่พื้นรองเท้าสัมผัสส่วนอื่น
(သန့်စင်ခန်းဝတ်စုံ ချွတ်ခြင်း အဆင့် ၂: Booties ဖိနပ်အောက်ခြေနှစ်ဖက်ကို ပူးကပ်ထားပါ)`
  },
  {
    page_number: 15,
    title: "ขั้นตอนการถอดชุด ข้อ 3: ม้วน Booties เก็บใส่ถุง Jumpsuit ด้านนอก",
    content: `© 2016, Belton Technology Group. All rights reserved.
ขั้นตอนการถอดชุด Cleanroom (Degowning Sequence)
ข้อ 3 (ลำดับที่ 3 ในการถอด): ม้วน Booties เก็บใส่ถุง Jumpsuit ด้านนอก
- ม้วน Booties ให้เรียบร้อย และเก็บใส่ในกระเป๋า/ช่องถุงชุด Jumpsuit ด้านนอกให้เรียบร้อย
(သန့်စင်ခန်းဝတ်စုံ ချွတ်ခြင်း အဆင့် ၃: Booties ကို လိပ်၍ Jumpsuit အိတ်၏ အပြင်ဘက်တွင် စနစ်တကျ သိမ်းပါ)`
  },
  {
    page_number: 16,
    title: "ขั้นตอนการถอดชุด ข้อ 4: ปลดกระดุมแขนเสื้อ ถอดถุงมือให้เรียบร้อย",
    content: `© 2016, Belton Technology Group. All rights reserved.
ขั้นตอนการถอดชุด Cleanroom (Degowning Sequence)
ข้อ 4 (ลำดับที่ 4 ในการถอด): ปลดกระดุมแขนเสื้อ ถอดถุงมือ
- ปลดกระดุมที่แขนเสื้อ Jumpsuit ทั้งสองข้าง และถอดถุงมือ (Gloves) ออกให้เรียบร้อย
(သန့်စင်ခန်းဝတ်စုံ ချွတ်ခြင်း အဆင့် ၄: လက်မောင်းကြယ်သီးများကို ဖြုတ်ပြီး လက်အိတ်ကို ချွတ်ပါ)`
  },
  {
    page_number: 17,
    title: "ขั้นตอนการถอดชุด ข้อ 5: รูดซิป ปลดกระดุมคอ Jumpsuit และย้ายบัตรพนักงาน",
    content: `© 2016, Belton Technology Group. All rights reserved.
ขั้นตอนการถอดชุด Cleanroom (Degowning Sequence)
ข้อ 5 (ลำดับที่ 5 ในการถอด): รูดซิป ปลดกระดุมคอ และย้ายบัตรพนักงาน
- ปลดกระดุมคอ รูดซิปชุด Jumpsuit ลง
- ปลดบัตรพนักงานออกจากชุด Jumpsuit และนำกลับมาติดที่กระเป๋าเสื้อทำงานตามเดิม
(သန့်စင်ခန်းဝတ်စုံ ချွတ်ခြင်း အဆင့် ၅: လည်ပင်းကြယ်သီးဖြုတ်၊ ဇစ်ဆွဲချပြီး ဝန်ထမ်းကတ်ကို အလုပ်ဝတ်စုံအိတ်ကပ်တွင် ပြန်ချိတ်ပါ)`
  },
  {
    page_number: 18,
    title: "ขั้นตอนการถอดชุด ข้อ 6: ถอด Face mask เก็บลงในถุง Jumpsuit ด้านใน",
    content: `© 2016, Belton Technology Group. All rights reserved.
ขั้นตอนการถอดชุด Cleanroom (Degowning Sequence)
ข้อ 6 (ลำดับที่ 6 ในการถอด): ถอด Face mask
- ปลดและถอด Face mask (หน้ากากอนามัย) ออก
- เก็บ Face mask ลงในช่องถุงชุด Jumpsuit ด้านในให้เรียบร้อย
(သန့်စင်ခန်းဝတ်စုံ ချွတ်ခြင်း အဆင့် ၆: Face mask ကို ချွတ်၍ Jumpsuit အိတ်၏ အတွင်းဘက်တွင် ထည့်ပါ)`
  },
  {
    page_number: 19,
    title: "ขั้นตอนการถอดชุด ข้อ 7: ถอดชุด Jumpsuit โดยไม่ให้สัมผัสพื้น",
    content: `© 2016, Belton Technology Group. All rights reserved.
ขั้นตอนการถอดชุด Cleanroom (Degowning Sequence)
ข้อ 7 (ลำดับที่ 7 ในการถอด): ถอดชุด Jumpsuit
- ถอดชุด Jumpsuit ออกอย่างระมัดระวัง โดยระวังไม่ให้ชุดสัมผัสกับพื้น
- พับและเก็บชุด Jumpsuit ใส่ลงในกระเป๋าชุดให้เรียบร้อย
(သန့်စင်ခန်းဝတ်စုံ ချွတ်ခြင်း အဆင့် ၇: Jumpsuit ကို ကြမ်းပြင်နှင့် မထိစေဘဲ ချွတ်၍ အိတ်ထဲသို့ စနစ်တကျ ခေါက်သိမ်းပါ)`
  },
  {
    page_number: 20,
    title: "ขั้นตอนการถอดชุด ข้อ 8: ถอด Hair net ออก",
    content: `© 2016, Belton Technology Group. All rights reserved.
ขั้นตอนการถอดชุด Cleanroom (Degowning Sequence)
ข้อ 8 (ลำดับที่ 8 ในการถอด): ถอด Hair net (หมวกคลุมผม)
- ถอด Hair net ออกจากศีรษะ
(သန့်စင်ခန်းဝတ်စုံ ချွတ်ခြင်း အဆင့် ၈: Hair net ဆံပင်စွပ်ကို ခေါင်းပေါ်မှ ချွတ်ပါ)`
  },
  {
    page_number: 21,
    title: "ขั้นตอนการถอดชุด ข้อ 9: ม้วน Hair net และเก็บใส่กระเป๋าชุด",
    content: `© 2016, Belton Technology Group. All rights reserved.
ขั้นตอนการถอดชุด Cleanroom (Degowning Sequence)
ข้อ 9 (ลำดับที่ 9 ในการถอด): ม้วน Hair net และเก็บใส่กระเป๋าชุด
- ม้วนและพับเก็บ Hair net ใส่ลงในกระเป๋าชุดคลีนรูมให้เรียบร้อย
(သန့်စင်ခန်းဝတ်စုံ ချွတ်ခြင်း အဆင့် ၉: Hair net ကို သပ်ရပ်စွာ လိပ်ပြီး ဝတ်စုံအိတ်ထဲသို့ ထည့်ပါ)`
  },
  {
    page_number: 22,
    title: "ขั้นตอนการถอดชุด ข้อ 10: สวมรองเท้า Plant shoes และเก็บชุดในตู้ล็อกเกอร์",
    content: `© 2016, Belton Technology Group. All rights reserved.
ขั้นตอนการถอดชุด Cleanroom (Degowning Sequence)
ข้อ 10 (ลำดับที่ 10 ในการถอด): สวม Plant shoes และเก็บชุดในล็อกเกอร์
- สวมรองเท้า Plant shoes
- นำกระเป๋าชุดคลีนรูมที่เก็บอุปกรณ์ทั้งหมดเรียบร้อยแล้วไปเก็บเข้าในตู้ล็อกเกอร์ประจำตัว
(သန့်စင်ခန်းဝတ်စုံ ချွတ်ခြင်း အဆင့် ၁၀: Plant shoes ဖိနပ်ကို စီးပြီး ဝတ်စုံအိတ်ကို လော့ကာဗီရိုထဲတွင် သိမ်းပါ)`
  },
  {
    page_number: 23,
    title: "ข้อควรระวังสำคัญ: Incorrect method ห้ามเก็บ Plant shoes ใน Booties เข้าตู้",
    content: `© 2016, Belton Technology Group. All rights reserved.
ข้อปฏิบัติและข้อห้ามเกี่ยวกับชุดคลีนรูม (Discipline & Caution)
Plant shoes in the booties keep in locker : incorrect method (วิธีที่ไม่ถูกต้องและเป็นข้อห้ามเด็ดขาด)
- ห้ามนำรองเท้า Plant shoes ใส่ไว้ด้านในของรองเท้า Booties แล้วนำไปเก็บในตู้ล็อกเกอร์โดยเด็ดขาด เพราะจะทำให้สิ่งสกปรกและฝุ่นละอองจาก Plant shoes ปนเปื้อนเข้าไปใน Booties คลีนรูม`
  }
];

console.log('🔄 [Slide Enrichment] Starting database update for TM-00-00-05_3...');

// 1. Update JSON database
const jsonRaw = fs.readFileSync(JSON_PATH, 'utf8');
const jsonData = JSON.parse(jsonRaw);

let updatedJsonCount = 0;
for (const item of SLIDE_DATA) {
  const target = jsonData.find(d => d.doc_code === 'TM-00-00-05_3' && d.page_number === item.page_number);
  if (target) {
    target.title = item.title;
    target.content = item.content;
    target.char_count = item.content.length;
    updatedJsonCount++;
  } else {
    jsonData.push({
      doc_code: 'TM-00-00-05_3',
      doc_name: 'Cleanroom Suit & Gowning Instruction (Thai & Myanmar)',
      filename: 'TM-00-00-05_3) Cleanroom suit instruction (Thai & MM).pdf',
      page_number: item.page_number,
      title: item.title,
      content: item.content,
      char_count: item.content.length
    });
    updatedJsonCount++;
  }
}

fs.writeFileSync(JSON_PATH, JSON.stringify(jsonData, null, 2), 'utf8');
console.log(`✅ [JSON DB] Successfully updated ${updatedJsonCount} slides in ${JSON_PATH}`);

// 2. Update SQLite database
const db = new Database(DB_PATH);

const updateStmt = db.prepare(`
  UPDATE slide_pages 
  SET title = ?, content = ?, char_count = ?
  WHERE doc_code = 'TM-00-00-05_3' AND page_number = ?
`);

const insertStmt = db.prepare(`
  INSERT INTO slide_pages (doc_code, doc_name, filename, page_number, title, content, char_count)
  VALUES (?, ?, ?, ?, ?, ?, ?)
`);

let updatedDbCount = 0;
for (const item of SLIDE_DATA) {
  const existing = db.prepare(`SELECT id FROM slide_pages WHERE doc_code = 'TM-00-00-05_3' AND page_number = ?`).get(item.page_number);
  if (existing) {
    updateStmt.run(item.title, item.content, item.content.length, item.page_number);
    updatedDbCount++;
  } else {
    insertStmt.run(
      'TM-00-00-05_3',
      'Cleanroom Suit & Gowning Instruction (Thai & Myanmar)',
      'TM-00-00-05_3) Cleanroom suit instruction (Thai & MM).pdf',
      item.page_number,
      item.title,
      item.content,
      item.content.length
    );
    updatedDbCount++;
  }
}

// Rebuild FTS5 table
console.log('🔄 [FTS5] Rebuilding Virtual Table slides_fts...');
db.exec(`
  DROP TABLE IF EXISTS slides_fts;
  CREATE VIRTUAL TABLE slides_fts USING fts5(
    page_id UNINDEXED,
    doc_code,
    doc_name,
    page_number UNINDEXED,
    title,
    content,
    tokenize='unicode61'
  );
  INSERT INTO slides_fts (page_id, doc_code, doc_name, page_number, title, content)
  SELECT id, doc_code, doc_name, page_number, title, content FROM slide_pages;
`);

console.log(`✅ [SQLite DB] Successfully updated ${updatedDbCount} slides & rebuilt FTS5 index in ${DB_PATH}`);
db.close();
