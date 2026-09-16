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

  // Define Dynamic Thinking Stages based on user query intent
  function getThinkingStages(query) {
    const q = query.toLowerCase();

    // Cleanroom / Gowning / Training procedures
    if (/ชุด|คลีนรูม|สวม|ถอด|hairnet|jumpsuit|booties|glove|mask|หน้ากาก|หมวก|รองเท้าบูท|แต่งตัว/i.test(q)) {
      return [
        'กำลังอ่านคำถามและวิเคราะห์หัวข้อคลีนรูม...',
        'กำลังสืบค้นสไลด์ TM-00-00-05 เรื่อง Cleanroom Discipline...',
        'กำลังตรวจสอบลำดับ 5 อุปกรณ์ตามมาตรฐานสากล Belton...',
        'กำลังประมวลผลคำตอบด้วย Qwen 2.5 บนการ์ดจอ RTX 3050...'
      ];
    }

    // Machine / Telemetry / SCADA
    if (/เครื่อง|เบอร์|ตู้|#\s*\d+|telemetry|dispenser|aca-disp|yield|พัง|เสีย|เตือน|warning|hold|ความดัน|อุณหภูมิ/i.test(q)) {
      return [
        'กำลังอ่านคำสั่งและระบุหมายเลขเครื่องจักร...',
        'กำลังเชื่อมต่อฐานข้อมูล SCADA ตรวจสอบ Telemetry เครื่องจักร...',
        'กำลังวิเคราะห์สถานะ Yield, Cycle Time และแรงดันพารามิเตอร์...',
        'กำลังสังเคราะห์คำตอบด้วย Qwen 2.5 บนการ์ดจอ RTX 3050...'
      ];
    }

    // Exam verification / Spec standard / Acceptance Criteria
    if (/ข้อสอบ|เกณฑ์|สเปก|สเปค|seagate|spe-|reject|accept|ยอมรับ|ของเสีย|defect|damper|broken wire|tinning|หัก/i.test(q)) {
      return [
        'กำลังวิเคราะห์ประเด็นคำถามและข้อกำหนดทางวิศวกรรม...',
        'กำลังตรวจสอบเปรียบเทียบกับคลังข้อสอบทางการ Master Exam...',
        'กำลังสืบค้นคู่มือมาตรฐาน Seagate และสไลด์อบรม (669 หน้า)...',
        'กำลังประมวลผลการตัดสินด้วย Qwen 2.5 บนการ์ดจอ RTX 3050...'
      ];
    }

    // Camera / 3D Teleport
    if (/วาร์ป|กล้อง|ซูม|ไปดู|ส่อง/i.test(q)) {
      return [
        'กำลังคำนวณพิกัดมุมมอง 3D ภายในโรงงานคลีนรูม...',
        'กำลังส่งคำสั่งควบคุมมุมมองกล้อง Real-time...',
        'กำลังประมวลผลมุมมองด้วย Qwen 2.5 บนการ์ดจอ RTX 3050...'
      ];
    }

    // Default / General
    return [
      'กำลังอ่านและทำความเข้าใจคำถาม...',
      'กำลังสืบค้นฐานข้อมูลสไลด์อบรมและเอกสารโรงงาน Belton...',
      'กำลังตรวจสอบความถูกต้องตามมาตรฐานงานผลิต...',
      'กำลังประมวลผลคำตอบด้วย Qwen 2.5 บนการ์ดจอ RTX 3050...'
    ];
  }

  // Create Collapsible Thought Process & Source Citation Card (ChatGPT / DeepSeek style)
  function createThoughtBox(metadata) {
    if (!metadata) return null;
    const box = document.createElement('div');
    box.className = 'thought-box';

    const durationSec = metadata.durationMs ? (metadata.durationMs / 1000).toFixed(1) : '1.0';
    const hasSources = metadata.sources && metadata.sources.length > 0;
    const hasExam = metadata.examMatch;
    const hasTools = metadata.tools && metadata.tools.length > 0;

    // Header / Toggle button
    const toggleBtn = document.createElement('button');
    toggleBtn.type = 'button';
    toggleBtn.className = 'thought-toggle';
    toggleBtn.innerHTML = `
      <span class="thought-toggle-left">
        <span class="thought-icon">💭</span>
        <span class="thought-title">กระบวนการคิดและแหล่งข้อมูล</span>
        <span class="thought-time">${durationSec} วินาที</span>
      </span>
      <span class="thought-chevron">▼</span>
    `;

    // Dropdown content
    const dropdown = document.createElement('div');
    dropdown.className = 'thought-dropdown';
    dropdown.style.display = 'none';

    let dropdownHTML = '';

    // 1. Sources retrieved
    if (hasSources) {
      dropdownHTML += `
        <div class="thought-section">
          <span class="thought-section-label">📚 แหล่งข้อมูลสไลด์ที่สืบค้นพบ (${metadata.sources.length} หน้า)</span>
          <div class="thought-tags-list">
            ${metadata.sources.map(s => `
              <span class="thought-source-tag" title="${s.docName || ''}">
                📄 <b>[${s.docCode}]</b> หน้า ${s.pageNumber}: ${s.title ? s.title.replace(/</g, '&lt;').slice(0, 45) : 'ข้อกำหนด'}
              </span>
            `).join('')}
          </div>
        </div>
      `;
    }

    // 2. Exam Ground Truth Match
    if (hasExam) {
      const isCorrect = hasExam.correctAnswer === 'ถูก';
      dropdownHTML += `
        <div class="thought-section">
          <span class="thought-section-label">📑 การตรวจสอบกับคลังข้อสอบทางการ Master Exam</span>
          <div class="thought-tags-list">
            <span class="thought-exam-tag">
              ${isCorrect ? '✅' : '❌'} <b>[${hasExam.docCode}]</b> ข้อที่ ${hasExam.questionNumber} (${hasExam.product || 'Standard'}) ➔ เฉลยสเปก: <b>${hasExam.correctAnswer}</b>
            </span>
          </div>
        </div>
      `;
    }

    // 3. Tools executed
    if (hasTools) {
      dropdownHTML += `
        <div class="thought-section">
          <span class="thought-section-label">⚙️ เครื่องมือที่ระบบเรียกใช้งาน</span>
          <div class="thought-tags-list">
            ${metadata.tools.map(t => `<span class="thought-tool-tag">⚡ ${t}</span>`).join('')}
          </div>
        </div>
      `;
    }

    // 4. Hardware / Model
    dropdownHTML += `
      <div class="thought-section">
        <span class="thought-section-label">⚡ โมเดลและชิปประมวลผล</span>
        <div class="thought-tags-list">
          <span class="thought-gpu-tag">
            🟢 NVIDIA GeForce RTX 3050 (Local GPU) • Qwen 2.5:3b
          </span>
        </div>
      </div>
    `;

    dropdown.innerHTML = dropdownHTML;

    // Toggle event
    toggleBtn.addEventListener('click', () => {
      const isOpen = box.classList.toggle('is-open');
      dropdown.style.display = isOpen ? 'flex' : 'none';
      scrollToBottom();
    });

    box.appendChild(toggleBtn);
    box.appendChild(dropdown);
    return box;
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

    // Setup Dynamic Live Thinking Status Ticker
    const stages = getThinkingStages(cleanText);
    let stageIdx = 0;
    const labelEl = thinkingPill ? thinkingPill.querySelector('.thinking-label') : null;
    if (labelEl && stages.length > 0) {
      labelEl.textContent = stages[0];
    }

    const tickerInterval = setInterval(() => {
      stageIdx++;
      if (labelEl && stageIdx < stages.length) {
        labelEl.style.opacity = '0';
        labelEl.style.transform = 'translateY(2px)';
        setTimeout(() => {
          labelEl.textContent = stages[stageIdx];
          labelEl.style.opacity = '1';
          labelEl.style.transform = 'translateY(0)';
        }, 150);
      }
    }, 1100);

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

      // Clear dynamic thinking ticker
      clearInterval(tickerInterval);

      // If action was triggered, append action badge if not in text
      if (data.action && data.action.type === 'teleport' && data.action.targetNum) {
        if (!reply.includes('[ACTION:TELEPORT:')) {
          reply += `\n\n[ACTION:TELEPORT:${data.action.targetNum}]`;
        }
      }

      // Remove thinking indicator
      if (thinkingPill && thinkingPill.parentNode) {
        thinkingPill.parentNode.removeChild(thinkingPill);
      }
      if (rowEl) rowEl.classList.remove('is-thinking');

      // Insert Collapsible Thought Box above text if metadata is present
      if (data.thoughtMetadata && contentEl) {
        const thoughtBox = createThoughtBox(data.thoughtMetadata);
        if (thoughtBox) {
          contentEl.insertBefore(thoughtBox, textEl);
        }
      }

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
      clearInterval(tickerInterval);
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

