const { test } = require('node:test');
const assert = require('node:assert/strict');
const { toOpenAIMessages, fromOpenAIMessage, openAIStream, fetchInference } = require('../src/inference-client');

test('tool results retain their matching call IDs across both providers', () => {
  const messages = toOpenAIMessages([
    { role: 'user', content: 'machine 27' },
    { role: 'assistant', tool_calls: [
      { id: 'native_1', function: { name: 'get_machine_telemetry', arguments: { machine_num: 27 } } },
      { function: { name: 'get_factory_overall_summary', arguments: {} } }
    ] },
    { role: 'tool', content: '{"id":27}' },
    { role: 'tool', content: '{"total_machines":50}' }
  ]);
  assert.equal(messages[1].tool_calls[0].function.arguments, '{"machine_num":27}');
  assert.equal(messages[2].tool_call_id, 'native_1');
  assert.equal(messages[3].tool_call_id, messages[1].tool_calls[1].id);
  assert.throws(() => toOpenAIMessages([{ role: 'tool', content: '{}' }]));
});

test('native tool arguments become objects and tool reasoning stays internal', () => {
  const result = fromOpenAIMessage({ content: null, reasoning_content: 'private reasoning', tool_calls: [
    { id: 'call_1', type: 'function', function: { name: 'get_machine_telemetry', arguments: '{"machine_num":27}' } }
  ] });
  assert.equal(result.content, '');
  assert.deepEqual(result.tool_calls[0].function.arguments, { machine_num: 27 });
  assert.equal(result.reasoning_content, 'private reasoning');
  assert.equal(toOpenAIMessages([result])[0].reasoning_content, 'private reasoning');
  assert.ok(!result.content.includes('private reasoning'));
});

test('SSE handles split UTF-8 packets and emits only answer tokens', async () => {
  const event = delta => 'data: ' + JSON.stringify({ choices: [{ delta }] }) + '\r\n\r\n';
  const bytes = new TextEncoder().encode(event({ reasoning_content: 'private reasoning' }) + event({ content: 'สวัสดี' }) + 'data: [DONE]\n\n');
  const body = new ReadableStream({ start(controller) {
    for (let index = 0; index < bytes.length; index += 7) controller.enqueue(bytes.slice(index, index + 7));
    controller.close();
  } });
  const output = await new Response(openAIStream(body)).text();
  assert.deepEqual(JSON.parse(output), { message: { content: 'สวัสดี' } });
  assert.ok(!output.includes('private reasoning'));
});

test('vLLM requests enable Qwen thinking and translate tool-check token budgets', async context => {
  const previous = { provider: process.env.LLM_PROVIDER, base: process.env.OPENAI_BASE_URL, fetch: global.fetch };
  context.after(() => {
    if (previous.provider === undefined) delete process.env.LLM_PROVIDER;
    else process.env.LLM_PROVIDER = previous.provider;
    if (previous.base === undefined) delete process.env.OPENAI_BASE_URL;
    else process.env.OPENAI_BASE_URL = previous.base;
    global.fetch = previous.fetch;
  });
  process.env.LLM_PROVIDER = 'openai';
  process.env.OPENAI_BASE_URL = 'http://inference.test/v1/';
  global.fetch = async (url, options) => {
    assert.equal(url, 'http://inference.test/v1/chat/completions');
    const body = JSON.parse(options.body);
    assert.equal(body.max_tokens, 4096);
    assert.equal(body.chat_template_kwargs.enable_thinking, true);
    assert.equal(body.model, 'Qwen3.6-35B-A3B-AWQ');
    assert.equal(Object.hasOwn(body, 'stop'), false);
    return Response.json({ choices: [{ message: { role: 'assistant', content: 'ready' }, finish_reason: 'stop' }] });
  };
  const response = await fetchInference('http://unused/api/chat', { body: JSON.stringify({
    model: 'Qwen3.6-35B-A3B-AWQ', messages: [{ role: 'user', content: 'hello' }], options: { num_predict: 128, stop: ['Assistant:'] }
  }) });
  assert.equal((await response.json()).message.content, 'ready');
});

test('Qwen final answer retains tool context and disables additional calls', async context => {
  const originalProvider = process.env.LLM_PROVIDER;
  const originalFetch = global.fetch;
  context.after(() => {
    global.fetch = originalFetch;
    if (originalProvider === undefined) delete process.env.LLM_PROVIDER;
    else process.env.LLM_PROVIDER = originalProvider;
  });
  process.env.LLM_PROVIDER = 'openai';
  global.fetch = async (url, options) => {
    const body = JSON.parse(options.body);
    assert.equal(body.tools.length, 5);
    assert.equal(body.tool_choice, 'none');
    assert.equal(body.messages[1].reasoning_content, 'internal tool context');
    assert.equal(body.messages[2].tool_call_id, body.messages[1].tool_calls[0].id);
    return Response.json({ choices: [{ message: { content: 'machine 27 is on hold' }, finish_reason: 'stop' }] });
  };
  const response = await fetchInference('http://unused/api/chat', { body: JSON.stringify({
    model: 'Qwen3.6-35B-A3B-AWQ', messages: [
      { role: 'user', content: 'machine 27' },
      fromOpenAIMessage({ content: null, reasoning_content: 'internal tool context', tool_calls: [
        { id: 'call_27', function: { name: 'get_machine_telemetry', arguments: '{"machine_num":27}' } }
      ] }),
      { role: 'tool', content: '{"status":"MAINTENANCE_HOLD"}' }
    ]
  }) });
  assert.equal((await response.json()).message.content, 'machine 27 is on hold');
});
