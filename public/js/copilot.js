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

  // SVG Icon definitions (No emojis)
  const SVG_CHEVRON = `<svg class="thought-chevron" viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="6 9 12 15 18 9"/></svg>`;
  const SVG_CHECK = `<svg class="step-check-svg" viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="#34d399" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`;
  const HTML_SPINNER = `<span class="step-spinner"></span>`;

  // Create Bot message container with live open thought process
  function createBotMessageContainer() {
    const row = document.createElement('div');
    row.className = 'message-row bot is-thinking';
    row.innerHTML = `
      <div class="bot-avatar" title="BELTON AI">
        <img src="belton_logo.png" alt="BELTON AI Logo" class="bot-avatar-img" />
      </div>
      <div class="bot-content">
        <!-- Live Open Thought Box (flowing downwards during thinking) -->
        <div class="thought-box is-open is-thinking">
          <button type="button" class="thought-toggle" aria-expanded="true">
            <span class="thought-toggle-left">
              <span class="thought-title">กำลังคิดวิเคราะห์...</span>
              <span class="thought-time">0.0s</span>
            </span>
            ${SVG_CHEVRON}
          </button>
          <div class="thought-dropdown">
            <div class="thought-steps-list"></div>
          </div>
        </div>
        <span class="bot-text" style="display: none;"></span>
        <span class="typing-cursor" style="display: none;"></span>
      </div>
    `;
    feed.appendChild(row);
    scrollToBottom();

    const thoughtBox = row.querySelector('.thought-box');
    const thoughtToggle = row.querySelector('.thought-toggle');
    const thoughtTitle = row.querySelector('.thought-title');
    const thoughtTime = row.querySelector('.thought-time');
    const thoughtDropdown = row.querySelector('.thought-dropdown');
    const thoughtStepsList = row.querySelector('.thought-steps-list');

    // Manual toggle on click
    thoughtToggle.addEventListener('click', () => {
      thoughtBox.classList.toggle('is-open');
      scrollToBottom();
    });

    return {
      rowEl: row,
      thoughtBox,
      thoughtTitle,
      thoughtTime,
      thoughtDropdown,
      thoughtStepsList,
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

  // Define Dynamic Thinking Stages based on user query intent (No Emojis)
  function getThinkingStages(query) {
    const q = query.toLowerCase();

    // Cleanroom / Gowning / Training procedures
    if (/ชุด|คลีนรูม|สวม|ถอด|hairnet|jumpsuit|booties|glove|mask|หน้ากาก|หมวก|รองเท้าบูท|แต่งตัว/i.test(q)) {
      return [
        'อ่านคำถามและวิเคราะห์หัวข้อคลีนรูม',
        'สืบค้นสไลด์ TM-00-00-05 เรื่อง Cleanroom Discipline',
        'ตรวจสอบลำดับ 5 อุปกรณ์ตามมาตรฐานสากล Belton',
        'ประมวลผลคำตอบด้วย Qwen 2.5 บนการ์ดจอ RTX 3050'
      ];
    }

    // Machine / Telemetry / SCADA
    if (/เครื่อง|เบอร์|ตู้|#\s*\d+|telemetry|dispenser|aca-disp|yield|พัง|เสีย|เตือน|warning|hold|ความดัน|อุณหภูมิ/i.test(q)) {
      return [
        'อ่านคำสั่งและระบุหมายเลขเครื่องจักร',
        'เชื่อมต่อฐานข้อมูล SCADA ตรวจสอบ Telemetry เครื่องจักร',
        'วิเคราะห์สถานะ Yield, Cycle Time และแรงดันพารามิเตอร์',
        'สังเคราะห์คำตอบด้วย Qwen 2.5 บนการ์ดจอ RTX 3050'
      ];
    }

    // Exam verification / Spec standard / Acceptance Criteria
    if (/ข้อสอบ|เกณฑ์|สเปก|สเปค|seagate|spe-|reject|accept|ยอมรับ|ของเสีย|defect|damper|broken wire|tinning|หัก/i.test(q)) {
      return [
        'วิเคราะห์ประเด็นคำถามและข้อกำหนดทางวิศวกรรม',
        'ตรวจสอบเปรียบเทียบกับคลังข้อสอบทางการ Master Exam',
        'สืบค้นคู่มือมาตรฐาน Seagate และสไลด์อบรม (669 หน้า)',
        'ประมวลผลการตัดสินด้วย Qwen 2.5 บนการ์ดจอ RTX 3050'
      ];
    }

    // Camera / 3D Teleport
    if (/วาร์ป|กล้อง|ซูม|ไปดู|ส่อง/i.test(q)) {
      return [
        'คำนวณพิกัดมุมมอง 3D ภายในโรงงานคลีนรูม',
        'ส่งคำสั่งควบคุมมุมมองกล้อง Real-time',
        'ประมวลผลมุมมองด้วย Qwen 2.5 บนการ์ดจอ RTX 3050'
      ];
    }

    // Default / General
    return [
      'อ่านและทำความเข้าใจคำถาม',
      'สืบค้นฐานข้อมูลสไลด์อบรมและเอกสารโรงงาน Belton',
      'ตรวจสอบความถูกต้องตามมาตรฐานงานผลิต',
      'ประมวลผลคำตอบด้วย Qwen 2.5 บนการ์ดจอ RTX 3050'
    ];
  }

  // Send message to Backend
  async function sendMessage(text) {
    if (!text || !text.trim() || isThinking) return;
    const cleanText = text.trim();
    isThinking = true;

    // 1. Add user bubble
    appendUserMessage(cleanText);
    dialogueHistory.push({ role: 'user', content: cleanText });

    // 2. Prepare bot bubble with live open thought box
    const {
      rowEl,
      thoughtBox,
      thoughtTitle,
      thoughtTime,
      thoughtDropdown,
      thoughtStepsList,
      textEl,
      cursorEl
    } = createBotMessageContainer();

    // 3. Live Step Flow Execution (Steps flow downwards without disappearing)
    const stages = getThinkingStages(cleanText);
    const startTime = Date.now();
    let currentStepItem = null;

    function appendStep(stepText) {
      if (currentStepItem) {
        currentStepItem.classList.remove('active');
        currentStepItem.classList.add('completed');
        const iconWrapper = currentStepItem.querySelector('.step-icon-wrapper');
        if (iconWrapper) iconWrapper.innerHTML = SVG_CHECK;
      }

      const item = document.createElement('div');
      item.className = 'thought-step-item active';
      item.innerHTML = `
        <span class="step-icon-wrapper">${HTML_SPINNER}</span>
        <span class="step-text">${stepText}</span>
      `;
      thoughtStepsList.appendChild(item);
      currentStepItem = item;
      scrollToBottom();
    }

    // Add Step 1 immediately
    appendStep(stages[0]);

    // Live timer ticking
    const timerInterval = setInterval(() => {
      const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
      thoughtTime.textContent = `${elapsed}s`;
    }, 100);

    // Flow subsequent steps downwards one by one
    let nextStageIdx = 1;
    const stepInterval = setInterval(() => {
      if (nextStageIdx < stages.length) {
        appendStep(stages[nextStageIdx]);
        nextStageIdx++;
      }
    }, 1150);

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

      // Stop tickers
      clearInterval(timerInterval);
      clearInterval(stepInterval);

      // Finalize the last active step as completed
      if (currentStepItem) {
        currentStepItem.classList.remove('active');
        currentStepItem.classList.add('completed');
        const iconWrapper = currentStepItem.querySelector('.step-icon-wrapper');
        if (iconWrapper) iconWrapper.innerHTML = SVG_CHECK;
      }

      // If action was triggered, append action badge if not in text
      if (data.action && data.action.type === 'teleport' && data.action.targetNum) {
        if (!reply.includes('[ACTION:TELEPORT:')) {
          reply += `\n\n[ACTION:TELEPORT:${data.action.targetNum}]`;
        }
      }

      // Append verified telemetry data (Sources, Exam, SCADA, Model)
      if (data.thoughtMetadata) {
        const meta = data.thoughtMetadata;
        const finalSec = (meta.durationMs / 1000).toFixed(1);
        thoughtTime.textContent = `${finalSec} วินาที`;
        thoughtTitle.textContent = 'กระบวนการคิดและแหล่งข้อมูล';

        // 1. Sources retrieved
        if (meta.sources && meta.sources.length > 0) {
          const sec = document.createElement('div');
          sec.className = 'thought-section';
          sec.innerHTML = `
            <span class="thought-section-label">เอกสารและสไลด์ที่สืบค้นพบ (${meta.sources.length} หน้า)</span>
            <div class="thought-tags-list">
              ${meta.sources.map(s => `
                <span class="thought-source-tag" title="${(s.docName || '').replace(/"/g, '&quot;')}">
                  <b>[${s.docCode}]</b> หน้า ${s.pageNumber}: ${s.title ? s.title.replace(/</g, '&lt;').slice(0, 48) : 'ข้อกำหนด'}
                </span>
              `).join('')}
            </div>
          `;
          thoughtDropdown.appendChild(sec);
        }

        // 2. Exam Ground Truth match
        if (meta.examMatch) {
          const ex = meta.examMatch;
          const isCorrect = ex.correctAnswer === 'ถูก';
          const sec = document.createElement('div');
          sec.className = 'thought-section';
          sec.innerHTML = `
            <span class="thought-section-label">การตรวจสอบกับคลังข้อสอบทางการ Master Exam</span>
            <div class="thought-tags-list">
              <span class="thought-exam-tag">
                <b>[${ex.docCode}]</b> ข้อ ${ex.questionNumber} (${ex.product || 'Standard'}) · เฉลยสเปก: <b>${ex.correctAnswer}</b> (${isCorrect ? 'ตรงตามมาตรฐาน' : 'ไม่ถูกต้องตามมาตรฐาน'})
              </span>
            </div>
          `;
          thoughtDropdown.appendChild(sec);
        }

        // 3. Tools executed
        if (meta.tools && meta.tools.length > 0) {
          const sec = document.createElement('div');
          sec.className = 'thought-section';
          sec.innerHTML = `
            <span class="thought-section-label">เครื่องมือและฐานข้อมูลที่เรียกใช้</span>
            <div class="thought-tags-list">
              ${meta.tools.map(t => `<span class="thought-tool-tag">${t}</span>`).join('')}
            </div>
          `;
          thoughtDropdown.appendChild(sec);
        }

        // 4. GPU spec
        const gpuSec = document.createElement('div');
        gpuSec.className = 'thought-section';
        gpuSec.innerHTML = `
          <span class="thought-section-label">ระบบประมวลผล Local AI</span>
          <div class="thought-tags-list">
            <span class="thought-gpu-tag">
              ${data.thoughtMetadata && data.thoughtMetadata.model ? data.thoughtMetadata.model : 'NVIDIA GeForce RTX 3050 (Local GPU) · Qwen 2.5:14b'}
            </span>
          </div>
        `;
        thoughtDropdown.appendChild(gpuSec);
      } else {
        thoughtTitle.textContent = 'กระบวนการคิดและแหล่งข้อมูล';
      }

      // Finish thinking state
      thoughtBox.classList.remove('is-thinking');
      rowEl.classList.remove('is-thinking');
      scrollToBottom();

      // Auto-collapse thought box after short pause so user sees steps complete
      await new Promise(r => setTimeout(r, 600));
      thoughtBox.classList.remove('is-open');

      // Start typewriter effect for reply
      textEl.style.display = 'inline';
      cursorEl.style.display = 'inline-block';

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
      clearInterval(timerInterval);
      clearInterval(stepInterval);
      console.error('Copilot Error:', err);
      thoughtBox.classList.remove('is-thinking');
      thoughtBox.classList.remove('is-open');
      rowEl.classList.remove('is-thinking');
      textEl.style.display = 'block';
      if (cursorEl && cursorEl.parentNode) cursorEl.parentNode.removeChild(cursorEl);
      textEl.innerHTML = `<div style="color:#ef4444;background:rgba(239,68,68,0.1);padding:12px 16px;border-radius:12px;border:1px solid rgba(239,68,68,0.25);">
        <b>ข้อผิดพลาด:</b> ${err.message}<br>
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

