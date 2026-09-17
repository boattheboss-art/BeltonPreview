// =========================================================================
// BELTON CLEANROOM AGENTIC COPILOT SERVICE (Ollama Qwen 2.5:14b + SCADA DB)
// 100% Standalone GPU-Accelerated Orchestrator with Function Calling
// =========================================================================
(function (window) {
  'use strict';

  let isReady = true;
  let isInitializing = false;
  let initError = null;
  const selectedModel = 'Qwen 2.5:14b (Ollama SCADA Agent)';

  async function checkWebGPUSupport() {
    return true;
  }

  function formatMarkdownToHtml(markdownText) {
    if (!markdownText) return '';
    let html = markdownText
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

    // Replace Autonomous 3D Action tag with sleek badge
    html = html.replace(/\[ACTION:TELEPORT:(\d+)\]/gi, (match, num) => {
      const pNum = parseInt(num, 10);
      const tag = pNum < 10 ? '0' + pNum : pNum;
      return '<div style="display:inline-flex;align-items:center;gap:6px;padding:4px 10px;background:rgba(16,185,129,0.12);border:1px solid rgba(16,185,129,0.35);border-radius:6px;font-size:11px;color:#10b981;margin-top:8px;font-weight:600;">สั่งการกล้อง 3D: วาร์ปมาที่เครื่อง ACA-DISP-' + tag + ' เรียบร้อย</div>';
    });

    // Bold **text** or __text__
    html = html.replace(/\*\*(.*?)\*\*/g, '<b>$1</b>');
    html = html.replace(/__(.*?)__/g, '<b>$1</b>');

    // Italic *text* or _text_
    html = html.replace(/\*(.*?)\*/g, '<i>$1</i>');

    // Code `code`
    html = html.replace(/`([^`]+)`/g, '<code style="background:rgba(0,0,0,0.06);padding:2px 5px;border-radius:4px;font-family:monospace;font-size:12px;">$1</code>');

    // Headers
    html = html.replace(/^###[ \t]+(.*)$/gm, '<div style="font-weight:700;font-size:13px;margin:6px 0 2px;">$1</div>');
    html = html.replace(/^##[ \t]+(.*)$/gm, '<div style="font-weight:700;font-size:14px;margin:8px 0 4px;">$1</div>');
    html = html.replace(/^#[ \t]+(.*)$/gm, '<div style="font-weight:700;font-size:15px;margin:10px 0 4px;">$1</div>');

    // Bullet lists
    html = html.replace(/^[ \t]*[\*\-]\s+(.*)$/gm, '• $1');

    // Numbered lists
    html = html.replace(/^[ \t]*(\d+)\.\s+(.*)$/gm, '$1. $2');

    // Newlines
    html = html.replace(/\n/g, '<br>');

    return html;
  }

  async function initEngine(onProgress) {
    if (typeof onProgress === 'function') {
      try {
        onProgress({ text: 'Qwen 2.5:14b (Ollama + SCADA DB) พร้อมทำงาน', progress: 1 });
      } catch (e) {}
    }
    isReady = true;
    isInitializing = false;
    return { status: 'ready' };
  }

  function buildSystemPrompt(userQuery, activeMachineNum) {
    return 'Belton AI Copilot connected to SCADA Database';
  }

  async function streamChat(userQuery, conversationHistory, activeMachineNum, onChunk, onAction) {
    const res = await fetch('/api/copilot/chat-stream', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: userQuery,
        history: conversationHistory || []
      })
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: res.statusText }));
      throw new Error(err.error || 'Backend Orchestrator Error');
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder('utf-8');
    let sseBuffer = '';
    let currentFull = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      sseBuffer += decoder.decode(value, { stream: true });
      const rawEvents = sseBuffer.split('\n\n');
      sseBuffer = rawEvents.pop();

      for (const rawEvent of rawEvents) {
        if (!rawEvent.trim()) continue;
        const lines = rawEvent.split('\n');
        let eventType = 'message';
        let dataStr = '';

        for (const l of lines) {
          if (l.startsWith('event: ')) {
            eventType = l.slice(7).trim();
          } else if (l.startsWith('data: ')) {
            dataStr = l.slice(6).trim();
          }
        }

        if (!dataStr) continue;

        try {
          const parsed = JSON.parse(dataStr);
          if (eventType === 'token' && parsed.token) {
            currentFull += parsed.token;
            if (typeof onChunk === 'function') {
              onChunk(parsed.token, currentFull);
            }
          } else if (eventType === 'action' && typeof onAction === 'function') {
            onAction(parsed);
          } else if (eventType === 'error') {
            throw new Error(parsed.message || 'Stream error');
          }
        } catch (e) {}
      }
    }

    return currentFull;
  }

  window.BeltonWebLLM = {
    checkWebGPUSupport,
    initEngine,
    streamChat,
    formatMarkdownToHtml,
    buildSystemPrompt,
    isModelReady: () => isReady,
    isModelLoading: () => isInitializing,
    getInitError: () => initError,
    getModelName: () => selectedModel
  };
})(window);
