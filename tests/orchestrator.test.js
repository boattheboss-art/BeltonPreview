const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { createRequire } = require('node:module');

test('JSON chat returns a synthesized answer after executing a telemetry tool', async () => {
  const filename = path.join(__dirname, '../src/orchestrator.js');
  const realRequire = createRequire(filename);
  const source = fs.readFileSync(filename, 'utf8');
  const calls = [];
  const stubs = {
    dotenv: { config() {} },
    './knowledge/slide_knowledge_db.js': {
      searchSlideKnowledge: () => [], searchExamQuestion: () => null
    },
    './tools/handlers.js': { executeTool: async (name, args) => {
      calls.push({ name, args });
      return { machine_id: 'ACA-DISP-27', status: 'MAINTENANCE_HOLD' };
    } },
    './inference-client.js': { fetchInference: async (url, options) => {
      const request = JSON.parse(options.body);
      if (!request.messages.some(message => message.role === 'tool')) {
        return Response.json({ message: { role: 'assistant', content: '', tool_calls: [
          { function: { name: 'get_machine_telemetry', arguments: { machine_num: 27 } } }
        ] } });
      }
      return Response.json({ message: { role: 'assistant', content: 'เครื่อง ACA-DISP-27 อยู่ระหว่างซ่อมบำรุง' } });
    } }
  };
  const module = { exports: {} };
  new Function('require', 'module', 'exports', source)(
    name => Object.hasOwn(stubs, name) ? stubs[name] : realRequire(name), module, module.exports);
  const result = await module.exports.runOrchestrator('ขอข้อมูลเครื่อง 27', []);
  assert.match(result.reply, /ACA-DISP-27/);
  assert.deepEqual(calls, [{ name: 'get_machine_telemetry', args: { machine_num: 27 } }]);
  assert.equal(result.toolsUsed[0].name, 'get_machine_telemetry');
});
