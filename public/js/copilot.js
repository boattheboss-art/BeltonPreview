// =========================================================================
// BELTON GEMINI COPILOT - FRONTEND CLIENT CONTROLLER
// =========================================================================
(function () {
  'use strict';

  const hero = document.getElementById('geminiHero');
  const feed = document.getElementById('messagesFeed');
  const main = document.getElementById('geminiMain');
  const form = document.getElementById('geminiChatForm');
  const input = document.getElementById('chatInput');
  const btnClear = document.getElementById('btnClearChat');
  const cards = document.querySelectorAll('.suggestion-card');

  let dialogueHistory = [];
  let isThinking = false;

  // Format Markdown to clean HTML
  function formatMarkdown(text) {
    if (!text) return '';
    let html = text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

    // 3D Teleport Action
    html = html.replace(/\[ACTION:TELEPORT:(\d+)\]/gi, (match, num) => {
      const pNum = parseInt(num, 10);
      const tag = pNum < 10 ? '0' + pNum : pNum;
      return `<a href="/factory?target=${pNum}" class="teleport-action-badge">
        <span>📍 สั่งการกล้อง 3D: วาร์ปไปที่เครื่อง ACA-DISP-${tag}</span>
        <span style="font-size:11px;opacity:0.8;">(คลิกเพื่อเปิดดู 3D)</span>
      </a>`;
    });

    // Bold
    html = html.replace(/\*\*(.*?)\*\*/g, '<b>$1</b>');
    html = html.replace(/__(.*?)__/g, '<b>$1</b>');

    // Italic
    html = html.replace(/\*(.*?)\*/g, '<i>$1</i>');

    // Code
    html = html.replace(/`([^`]+)`/g, '<code>$1</code>');

    // Headers
    html = html.replace(/^###[ \t]+(.*)$/gm, '<h3>$1</h3>');
    html = html.replace(/^##[ \t]+(.*)$/gm, '<h2>$1</h2>');
    html = html.replace(/^#[ \t]+(.*)$/gm, '<h2>$1</h2>');

    // Bullet lists
    html = html.replace(/^[ \t]*[\*\-]\s+(.*)$/gm, '• $1');

    // Numbered lists
    html = html.replace(/^[ \t]*(\d+)\.\s+(.*)$/gm, '$1. $2');

    // Line breaks
    html = html.replace(/\n/g, '<br>');

    return html;
  }

  // Append a User message bubble
  function appendUserMessage(text) {
    if (hero && !hero.classList.contains('is-hidden')) {
      hero.classList.add('is-hidden');
    }

    const row = document.createElement('div');
    row.className = 'message-row user';
    row.innerHTML = `<div class="user-bubble">${text.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</div>`;
    feed.appendChild(row);
    scrollToBottom();
  }

  // Create Bot message container with typing cursor & thinking indicator
  function createBotMessageContainer() {
    const row = document.createElement('div');
    row.className = 'message-row bot is-thinking';
    row.innerHTML = `
      <div class="bot-avatar" title="BELTON AI">
        <img src="belton_logo.png" alt="BELTON AI Logo" class="bot-avatar-img" />
      </div>
      <div class="bot-content">
        <!-- Minimal Thinking Status Indicator -->
        <div class="thinking-status-pill">
          <span class="thinking-sparkle-icon">✦</span>
          <span class="thinking-label">กำลังคิด</span>
          <span class="thinking-dots">
            <span class="dot d1">.</span><span class="dot d2">.</span><span class="dot d3">.</span>
          </span>
        </div>
        <span class="bot-text" style="display: none;"></span>
        <span class="typing-cursor" style="display: none;"></span>
      </div>
    `;
    feed.appendChild(row);
    scrollToBottom();

    return {
      rowEl: row,
      thinkingPill: row.querySelector('.thinking-status-pill'),
      textEl: row.querySelector('.bot-text'),
      cursorEl: row.querySelector('.typing-cursor'),
      contentEl: row.querySelector('.bot-content')
    };
  }

  function scrollToBottom() {
    setTimeout(() => {
      main.scrollTop = main.scrollHeight;
    }, 20);
  }

  // Send message to Backend
  async function sendMessage(text) {
    if (!text || !text.trim() || isThinking) return;
    const cleanText = text.trim();
    isThinking = true;

    // 1. Add user bubble
    appendUserMessage(cleanText);
    dialogueHistory.push({ role: 'user', content: cleanText });

    // 2. Prepare bot bubble
    const { rowEl, thinkingPill, textEl, cursorEl, contentEl } = createBotMessageContainer();

    try {
      const response = await fetch('/api/copilot/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: cleanText,
          history: dialogueHistory
        })
      });

      if (!response.ok) {
        throw new Error('ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ Copilot ได้ (HTTP ' + response.status + ')');
      }

      const data = await response.json();
      let reply = data.reply || '';

      // If action was triggered, append action badge if not in text
      if (data.action && data.action.type === 'teleport' && data.action.targetNum) {
        if (!reply.includes('[ACTION:TELEPORT:')) {
          reply += `\n\n[ACTION:TELEPORT:${data.action.targetNum}]`;
        }
      }

      // Remove thinking indicator and reveal text stream
      if (thinkingPill && thinkingPill.parentNode) {
        thinkingPill.parentNode.removeChild(thinkingPill);
      }
      if (rowEl) rowEl.classList.remove('is-thinking');
      textEl.style.display = 'inline';
      cursorEl.style.display = 'inline-block';

      // Typewriter effect simulation for smooth visual streaming
      let charIdx = 0;
      const chunkSize = Math.max(3, Math.floor(reply.length / 25));

      const typeInterval = setInterval(() => {
        charIdx += chunkSize;
        const currentSlice = reply.slice(0, charIdx);
        textEl.innerHTML = formatMarkdown(currentSlice);
        scrollToBottom();

        if (charIdx >= reply.length) {
          clearInterval(typeInterval);
          textEl.innerHTML = formatMarkdown(reply);
          if (cursorEl && cursorEl.parentNode) cursorEl.parentNode.removeChild(cursorEl);
          isThinking = false;
          dialogueHistory.push({ role: 'assistant', content: reply });
          scrollToBottom();
        }
      }, 25);

    } catch (err) {
      console.error('Copilot Error:', err);
      if (thinkingPill && thinkingPill.parentNode) {
        thinkingPill.parentNode.removeChild(thinkingPill);
      }
      if (rowEl) rowEl.classList.remove('is-thinking');
      textEl.style.display = 'block';
      if (cursorEl && cursorEl.parentNode) cursorEl.parentNode.removeChild(cursorEl);
      textEl.innerHTML = `<div style="color:#ef4444;background:rgba(239,68,68,0.1);padding:12px 16px;border-radius:12px;border:1px solid rgba(239,68,68,0.25);">
        <b>⚠️ ขออภัยครับ:</b> ${err.message}<br>
        <span style="font-size:12px;opacity:0.8;">กรุณาตรวจสอบว่าได้เปิดคำสั่ง <code>gpu</code> หรือ <code>StartGpuTunnel.bat</code> ในเครื่องของคุณแล้วหรือไม่ครับ</span>
      </div>`;
      isThinking = false;
      scrollToBottom();
    }
  }

  // Handle Form Submit
  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const val = input.value;
      input.value = '';
      sendMessage(val);
    });
  }

  // Handle Suggestion Cards Click
  cards.forEach(card => {
    card.addEventListener('click', () => {
      const q = card.getAttribute('data-query');
      if (q) sendMessage(q);
    });
  });

  // Handle Clear Chat
  if (btnClear) {
    btnClear.addEventListener('click', () => {
      feed.innerHTML = '';
      dialogueHistory = [];
      if (hero) hero.classList.remove('is-hidden');
      if (input) input.focus();
    });
  }

  // Auto-focus input on page load
  if (input) {
    input.focus();
  }

})();

