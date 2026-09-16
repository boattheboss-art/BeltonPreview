// =========================================================================
// BELTON CLEANROOM AGENTIC COPILOT SERVICE (Ollama Qwen 2.5:3b + SCADA DB)
// 100% Standalone GPU-Accelerated Orchestrator with Function Calling
// =========================================================================
(function (window) {
  'use strict';

  let isReady = true;
  let isInitializing = false;
  let initError = null;
  const selectedModel = 'Qwen 2.5:3b (Ollama SCADA Agent)';

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
      return '<div style="display:inline-flex;align-items:center;gap:6px;padding:4px 10px;background:rgba(16,185,129,0.12);border:1px solid rgba(16,185,129,0.35);border-radius:6px;font-size:11px;color:#10b981;margin-top:8px;font-weight:600;">🎯 สั่งการกล้อง 3D: วาร์ปมาที่เครื่อง ACA-DISP-' + tag + ' เรียบร้อย</div>';
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
        onProgress({ text: '✨ Qwen 2.5:3b (Ollama + SCADA DB) พร้อมทำงาน!', progress: 1 });
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
    const res = await fetch('/api/copilot/chat', {
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

    const data = await res.json();
    const replyText = data.reply || '';

    // If 3D Camera action was triggered
    if (data.action && typeof onAction === 'function') {
      onAction(data.action);
    }

    // Typewriter effect simulation for smooth visual experience
    let displayed = '';
    const chunkSize = Math.max(3, Math.floor(replyText.length / 20));
    for (let i = 0; i < replyText.length; i += chunkSize) {
      const chunk = replyText.slice(i, i + chunkSize);
      displayed += chunk;
      if (typeof onChunk === 'function') {
        onChunk(chunk, displayed);
      }
      await new Promise(r => setTimeout(r, 25));
    }

    if (displayed !== replyText && typeof onChunk === 'function') {
      onChunk('', replyText);
    }

    return replyText;
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
