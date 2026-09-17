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
  const btnSubmit = document.getElementById('btnSubmit');
  const btnClear = document.getElementById('btnClearChat');
  const cards = document.querySelectorAll('.suggestion-card');

  let dialogueHistory = [];
  let isThinking = false;
  let currentAbortController = null;
  let activeStopHandler = null;

  const SVG_SEND = `<svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>`;
  const SVG_STOP = `<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><rect x="5" y="5" width="14" height="14" rx="2.5" ry="2.5"/></svg>`;

  function setButtonState(isWorking) {
    if (!btnSubmit) return;
    if (isWorking) {
      btnSubmit.classList.add('is-working');
      btnSubmit.innerHTML = SVG_STOP;
      btnSubmit.title = 'กดเพื่อหยุดการตอบข้อความ (Stop)';
      btnSubmit.setAttribute('aria-label', 'Stop generating');
      btnSubmit.type = 'button';
      if (input) input.removeAttribute('required');
    } else {
      btnSubmit.classList.remove('is-working');
      btnSubmit.innerHTML = SVG_SEND;
      btnSubmit.title = 'ส่งคำถาม (Send)';
      btnSubmit.setAttribute('aria-label', 'Send message');
      btnSubmit.type = 'submit';
      if (input) input.setAttribute('required', 'required');
    }
  }

  function stopCurrentGeneration() {
    if (typeof activeStopHandler === 'function') {
      activeStopHandler();
      activeStopHandler = null;
    }
  }

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
        <span><svg style="display:inline-block;vertical-align:middle;margin-right:4px;" viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="3"/><line x1="12" y1="1" x2="12" y2="5"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="1" y1="12" x2="5" y2="12"/><line x1="19" y1="12" x2="23" y2="12"/></svg>สั่งการกล้อง 3D: วาร์ปไปที่เครื่อง ACA-DISP-${tag}</span>
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
    if (!text || !text.trim()) return;
    if (isThinking) {
      stopCurrentGeneration();
      return;
    }
    const cleanText = text.trim();
    isThinking = true;
    setButtonState(true);

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

    currentAbortController = new AbortController();
    let displayedText = '';
    let typeInterval = null;

    activeStopHandler = () => {
      console.log('[Copilot] Generation stopped by user.');
      if (currentAbortController) {
        try { currentAbortController.abort(); } catch (e) {}
      }
      clearInterval(timerInterval);
      clearInterval(stepInterval);
      if (typeInterval) clearInterval(typeInterval);

      thoughtBox.classList.remove('is-thinking');
      thoughtBox.classList.remove('is-open');
      rowEl.classList.remove('is-thinking');

      if (cursorEl && cursorEl.parentNode) {
        cursorEl.parentNode.removeChild(cursorEl);
      }

      if (displayedText) {
        textEl.style.display = 'inline';
        textEl.innerHTML = formatMarkdown(displayedText);
        dialogueHistory.push({ role: 'assistant', content: displayedText });
      } else {
        textEl.style.display = 'inline';
        textEl.innerHTML = '<span style="color:var(--text-muted);font-style:italic;">[หยุดการทำงานตามคำสั่ง]</span>';
      }

      isThinking = false;
      activeStopHandler = null;
      setButtonState(false);
      if (input) input.focus();
      scrollToBottom();
    };

    try {
      const response = await fetch('/api/copilot/chat-stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: cleanText,
          history: dialogueHistory
        }),
        signal: currentAbortController.signal
      });

      if (!response.ok) {
        throw new Error('ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ Copilot ได้ (HTTP ' + response.status + ')');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let sseBuffer = '';
      let charQueue = [];
      displayedText = '';
      let isStreamFinished = false;
      let actionData = null;
      let hasStartedTyping = false;
      typeInterval = null;

      function renderMetadata(meta) {
        if (!meta) return;
        const finalSec = (meta.durationMs / 1000).toFixed(1);
        thoughtTime.textContent = `${finalSec} วินาที`;
        thoughtTitle.textContent = 'กระบวนการคิดและแหล่งข้อมูล';

        // Clear existing dynamic sections to avoid duplicate appends
        const existingSections = thoughtDropdown.querySelectorAll('.thought-section');
        existingSections.forEach(s => s.remove());

        // 1. Sources
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

        // 2. Exam match
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

        // 3. Tools
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
              ${meta.model || 'NVIDIA GeForce RTX 3050 (Local GPU) · Qwen 2.5:14b'}
            </span>
          </div>
        `;
        thoughtDropdown.appendChild(gpuSec);
      }

      function startTypingEngine() {
        if (hasStartedTyping) return;
        hasStartedTyping = true;

        // Stop thinking tickers
        clearInterval(timerInterval);
        clearInterval(stepInterval);

        // Finalize the last active step as completed
        if (currentStepItem) {
          currentStepItem.classList.remove('active');
          currentStepItem.classList.add('completed');
          const iconWrapper = currentStepItem.querySelector('.step-icon-wrapper');
          if (iconWrapper) iconWrapper.innerHTML = SVG_CHECK;
        }

        // Stop thinking state and auto-collapse thought box so user focuses on text
        thoughtBox.classList.remove('is-thinking');
        rowEl.classList.remove('is-thinking');
        thoughtBox.classList.remove('is-open');

        // Show text container & blinking cursor
        textEl.style.display = 'inline';
        cursorEl.style.display = 'inline-block';

        // Adaptive high-frequency typing loop (character-by-character flow)
        typeInterval = setInterval(() => {
          if (charQueue.length > 0) {
            // Pop 1 character per 16ms tick (~60 cps), adaptive burst if queue grows
            const popCount = charQueue.length > 50 ? 4 : (charQueue.length > 20 ? 2 : 1);
            const popped = charQueue.splice(0, popCount).join('');
            displayedText += popped;
            textEl.innerHTML = formatMarkdown(displayedText);
            scrollToBottom();
          } else if (isStreamFinished) {
            clearInterval(typeInterval);
            let finalFull = displayedText;
            if (actionData && actionData.type === 'teleport' && actionData.targetNum) {
              if (!finalFull.includes('[ACTION:TELEPORT:')) {
                finalFull += `\n\n[ACTION:TELEPORT:${actionData.targetNum}]`;
              }
            }
            textEl.innerHTML = formatMarkdown(finalFull);
            if (cursorEl && cursorEl.parentNode) cursorEl.parentNode.removeChild(cursorEl);
            dialogueHistory.push({ role: 'assistant', content: finalFull });
            isThinking = false;
            activeStopHandler = null;
            setButtonState(false);
            scrollToBottom();
          }
        }, 16);
      }

      // Read SSE stream chunks
      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          isStreamFinished = true;
          startTypingEngine();
          break;
        }

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
            if (eventType === 'meta') {
              renderMetadata(parsed);
            } else if (eventType === 'token') {
              if (parsed.token) {
                startTypingEngine();
                charQueue.push(...parsed.token.split(''));
              }
            } else if (eventType === 'action') {
              actionData = parsed;
            } else if (eventType === 'done') {
              isStreamFinished = true;
              if (parsed.thoughtMetadata) {
                renderMetadata(parsed.thoughtMetadata);
              }
              startTypingEngine();
            } else if (eventType === 'error') {
              throw new Error(parsed.message || 'Stream generation error');
            }
          } catch (e) {
            // JSON parse error on partial line
          }
        }
      }

    } catch (err) {
      clearInterval(timerInterval);
      clearInterval(stepInterval);
      if (typeInterval) clearInterval(typeInterval);

      if (err.name === 'AbortError') {
        // Handled cleanly by stop action
        return;
      }

      console.error('Copilot Error:', err);
      thoughtBox.classList.remove('is-thinking');
      thoughtBox.classList.remove('is-open');
      rowEl.classList.remove('is-thinking');
      textEl.style.display = 'block';
      if (cursorEl && cursorEl.parentNode) cursorEl.parentNode.removeChild(cursorEl);
      textEl.innerHTML = `<div style="color:#ef4444;background:rgba(239,68,68,0.1);padding:12px 16px;border-radius:12px;border:1px solid rgba(239,68,68,0.25);">
        <b>ข้อผิดพลาด:</b> ${err.message}<br>
        <span style="font-size:12px;opacity:0.8;">กรุณาตรวจสอบว่าได้เปิดคำสั่ง <code>gpu</code> หรือ <code>scripts/start_ollama.bat</code> ในเครื่องของคุณแล้วหรือไม่ครับ</span>
      </div>`;
      isThinking = false;
      activeStopHandler = null;
      setButtonState(false);
      scrollToBottom();
    }
  }

  // Handle Stop Button Click
  if (btnSubmit) {
    btnSubmit.addEventListener('click', (e) => {
      if (isThinking) {
        e.preventDefault();
        e.stopPropagation();
        stopCurrentGeneration();
      }
    });
  }

  // Handle Form Submit
  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      if (isThinking) {
        stopCurrentGeneration();
        return;
      }
      const val = input.value;
      input.value = '';
      sendMessage(val);
    });
  }

  // Handle Suggestion Cards Click
  cards.forEach(card => {
    card.addEventListener('click', () => {
      if (isThinking) {
        stopCurrentGeneration();
      }
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

