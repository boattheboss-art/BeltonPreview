// Adapt the orchestrator's Ollama message contract to the existing vLLM service.
const { toolsDefinition } = require('./tools/schemas.js');
function toOpenAIMessages(messages) {
  let pending = [];
  return messages.map((message, index) => {
    const result = { role: message.role, content: message.content || '' };
    if (message.tool_calls?.length) {
      result.tool_calls = message.tool_calls.map((call, callIndex) => ({
        id: call.id || `call_${index}_${callIndex}`,
        type: 'function',
        function: {
          name: call.function.name,
          arguments: typeof call.function.arguments === 'string'
            ? call.function.arguments : JSON.stringify(call.function.arguments || {})
        }
      }));
      pending = result.tool_calls.map(call => call.id);
      if (message.reasoning_content !== undefined) result.reasoning_content = message.reasoning_content;
    }
    if (message.role === 'tool') {
      const id = pending.shift();
      result.tool_call_id = message.tool_call_id || id;
      if (!result.tool_call_id) throw new Error('Tool response has no matching tool call');
    }
    return result;
  });
}

function fromOpenAIMessage(message) {
  return {
    role: 'assistant', content: message.content || '',
    ...(message.tool_calls?.length ? {
      // Keep tool-turn context for Qwen's chat template. The orchestrator never
      // includes this field in its public reply or browser metadata.
      reasoning_content: message.reasoning_content || message.reasoning || '',
      tool_calls: message.tool_calls.map(call => ({
      ...call, function: {
        name: call.function.name,
        arguments: typeof call.function.arguments === 'string'
          ? JSON.parse(call.function.arguments || '{}') : call.function.arguments
      }
    })) } : {})
  };
}

function openAIStream(body) {
  const decoder = new TextDecoder();
  const encoder = new TextEncoder();
  let buffer = '';
  function emit(line, controller) {
    if (!line.startsWith('data:')) return;
    const data = line.slice(5).trim();
    if (!data || data === '[DONE]') return;
    const chunk = JSON.parse(data);
    if (chunk.error) throw new Error(chunk.error.message || 'Inference stream failed');
    const token = chunk.choices?.[0]?.delta?.content;
    if (token) controller.enqueue(encoder.encode(JSON.stringify({ message: { content: token } }) + '\n'));
  }
  return body.pipeThrough(new TransformStream({
    transform(chunk, controller) {
      buffer += decoder.decode(chunk, { stream: true });
      const lines = buffer.split(/\r?\n/);
      buffer = lines.pop();
      lines.forEach(line => emit(line, controller));
    },
    flush(controller) {
      buffer += decoder.decode();
      if (buffer.trim()) emit(buffer, controller);
    }
  }));
}

async function fetchInference(url, options) {
  if ((process.env.LLM_PROVIDER || 'ollama') === 'ollama') return fetch(url, options);
  if (process.env.LLM_PROVIDER !== 'openai') throw new Error('Unsupported LLM_PROVIDER');
  const input = JSON.parse(options.body);
  const settings = input.options || {};
  const base = (process.env.OPENAI_BASE_URL || 'http://host.docker.internal:8000/v1').replace(/\/+$/, '');
  const headers = { 'Content-Type': 'application/json' };
  if (process.env.OPENAI_API_KEY) headers.Authorization = `Bearer ${process.env.OPENAI_API_KEY}`;
  const payload = {
    model: input.model,
    messages: toOpenAIMessages(input.messages),
    stream: !!input.stream,
    max_tokens: Math.max(4096, settings.num_predict || 4096),
    temperature: settings.temperature,
    top_p: settings.top_p,
    // Ollama prompt-header stop strings can terminate Qwen reasoning before
    // an answer is emitted. vLLM applies the model's own end-of-turn tokens.
    // Qwen3.6 needs thinking enabled for reliable native tool calling.
    chat_template_kwargs: { enable_thinking: true }
  };
  if (input.tools?.length) {
    payload.tools = input.tools;
    payload.tool_choice = 'auto';
  } else if (input.messages.some(message => message.role === 'tool')) {
    // Qwen requires a consistent tool-aware template when consuming results.
    // This final turn must synthesize an answer instead of calling another tool.
    payload.tools = toolsDefinition;
    payload.tool_choice = 'none';
  }
  const response = await fetch(base + '/chat/completions', {
    method: 'POST', headers, body: JSON.stringify(payload),
    signal: options.signal || AbortSignal.timeout(240000)
  });
  if (!response.ok) return response;
  if (input.stream) return new Response(openAIStream(response.body), { headers: { 'Content-Type': 'application/x-ndjson' } });
  const data = await response.json();
  const choice = data.choices?.[0];
  if (!choice?.message) throw new Error('Inference returned no assistant message');
  if (!choice.message.content?.trim() && !choice.message.tool_calls?.length) {
    throw new Error(choice.finish_reason === 'length'
      ? 'Inference token budget exhausted before an answer was produced'
      : 'Inference returned an empty answer');
  }
  return Response.json({ message: fromOpenAIMessage(choice.message) });
}

module.exports = { fetchInference, toOpenAIMessages, fromOpenAIMessage, openAIStream };
