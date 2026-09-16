const { runOrchestrator } = require('../src/orchestrator.js');

async function test() {
  console.log('🧪 Testing question 1: "ขั้นตอนการสวมชุดคลีนรูม มีกี่ขั้นตอน ต้องใส่อันไหนก่อน"');
  const res1 = await runOrchestrator('ขั้นตอนการสวมชุดคลีนรูม มีกี่ขั้นตอน ต้องใส่อันไหนก่อน', []);
  console.log('\n================ AI RESPONSE 1 ================\n');
  console.log(res1.reply);
  console.log('\n===============================================\n');

  console.log('🧪 Testing question 2 (Degowning): "ขั้นตอนการถอดชุดคลีนรูม ต้องถอดอะไรก่อน มีกี่ขั้นตอน"');
  const res2 = await runOrchestrator('ขั้นตอนการถอดชุดคลีนรูม ต้องถอดอะไรก่อน มีกี่ขั้นตอน', []);
  console.log('\n================ AI RESPONSE 2 ================\n');
  console.log(res2.reply);
  console.log('\n===============================================\n');
}

test().catch(err => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});

