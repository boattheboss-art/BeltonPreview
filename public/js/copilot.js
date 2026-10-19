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
  const btnVoiceToggle = document.getElementById('btnVoiceToggle');
  const btnMic = document.getElementById('btnMic');
  const voiceStatusPill = document.getElementById('voiceStatusPill');
  const btnLaunchVoiceMode = document.getElementById('btnLaunchVoiceMode');
  const voiceModeOverlay = document.getElementById('voiceModeOverlay');
  const btnExitVoiceMode = document.getElementById('btnExitVoiceMode');
  const voiceOrbCanvas = document.getElementById('voiceOrbCanvas');
  const voiceOrbWrapper = document.getElementById('voiceOrbWrapper');
  const voiceOrbAura = document.getElementById('voiceOrbAura');
  const voiceOrbStatus = document.getElementById('voiceOrbStatus');
  const voiceCaptionUser = document.getElementById('voiceCaptionUser');
  const voiceCaptionBot = document.getElementById('voiceCaptionBot');
  const btnVoiceModeMicToggle = document.getElementById('btnVoiceModeMicToggle');
  const btnVoiceModeInterrupt = document.getElementById('btnVoiceModeInterrupt');
  const btnVoiceGenderToggle = document.getElementById('btnVoiceGenderToggle');
  const voiceGenderLabel = document.getElementById('voiceGenderLabel');
  const cards = document.querySelectorAll('.suggestion-card');

  let dialogueHistory = [];
  let isThinking = false;
  let currentAbortController = null;
  let activeStopHandler = null;

  // Voice State (Default ON with Natural Crisp Thai Premwadee Voice)
  let isVoiceEnabled = localStorage.getItem('belton_voice_enabled') !== 'false';
  let selectedVoice = localStorage.getItem('belton_selected_voice') || 'th-TH-PremwadeeNeural';
  let currentAudio = null;
  let currentAudioBlobUrl = null;
  let currentIndicator = null;
  let isListening = false;
  let recognition = null;
  let isInVoiceMode = false;
  let voiceOrbState = 'idle'; // 'listening' | 'thinking' | 'speaking'
  let voiceOrbAnimId = null;
  let voiceOrbStartTime = performance.now();

  // Studio Vocal Audio Pipeline (Web Audio API for Weight and Broadcast Warmth)
  let studioAudioCtx = null;
  let studioAudioPlayer = null;
  let studioSourceNode = null;
  let studioWarmthFilter = null;
  let studioClarityFilter = null;
  let studioCompressor = null;
  let studioAnalyser = null;
  let studioDataArray = null;

  function initStudioAudioPipeline() {
    if (studioAudioPlayer) return;
    try {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (!AudioContextClass) {
        studioAudioPlayer = new Audio();
        return;
      }
      studioAudioCtx = new AudioContextClass();

      // Clean High-pass Filter: Cut sub-bass rumble below 80 Hz without muffling vocal tone
      studioWarmthFilter = studioAudioCtx.createBiquadFilter();
      studioWarmthFilter.type = 'highpass';
      studioWarmthFilter.frequency.value = 80;

      // Peaking Filter: Enhance vocal clarity and Thai consonant articulation (+1.5 dB at 3.5 kHz)
      studioClarityFilter = studioAudioCtx.createBiquadFilter();
      studioClarityFilter.type = 'peaking';
      studioClarityFilter.frequency.value = 3500;
      studioClarityFilter.Q.value = 0.9;
      studioClarityFilter.gain.value = 1.5;

      // Studio Dynamics Compressor: Gentle transparent leveling without pumping or crushing syllables
      studioCompressor = studioAudioCtx.createDynamicsCompressor();
      studioCompressor.threshold.value = -12;
      studioCompressor.knee.value = 10;
      studioCompressor.ratio.value = 2.0;
      studioCompressor.attack.value = 0.01;
      studioCompressor.release.value = 0.20;

      // Real-time Audio Analyser for organic Voice Orb pulsation
      studioAnalyser = studioAudioCtx.createAnalyser();
      studioAnalyser.fftSize = 64;
      studioDataArray = new Uint8Array(studioAnalyser.frequencyBinCount);

      // Connect Web Audio Graph
      studioWarmthFilter.connect(studioClarityFilter);
      studioClarityFilter.connect(studioCompressor);
      studioCompressor.connect(studioAnalyser);
      studioAnalyser.connect(studioAudioCtx.destination);

      studioAudioPlayer = new Audio();
      studioAudioPlayer.crossOrigin = 'anonymous';
      studioSourceNode = studioAudioCtx.createMediaElementSource(studioAudioPlayer);
      studioSourceNode.connect(studioWarmthFilter);
    } catch (e) {
      console.warn('[Studio Vocal Audio Init]:', e);
      if (!studioAudioPlayer) studioAudioPlayer = new Audio();
    }
  }

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

  function stopSpeaking() {
    if (studioAudioPlayer) {
      try {
        studioAudioPlayer.pause();
        studioAudioPlayer.currentTime = 0;
      } catch (e) {}
    }
    if (currentAudio && currentAudio !== studioAudioPlayer) {
      try {
        currentAudio.pause();
        currentAudio.currentTime = 0;
      } catch (e) {}
    }
    if (currentAudioBlobUrl) {
      try { URL.revokeObjectURL(currentAudioBlobUrl); } catch (e) {}
      currentAudioBlobUrl = null;
    }
    currentAudio = null;
    if (currentIndicator && currentIndicator.parentNode) {
      currentIndicator.parentNode.removeChild(currentIndicator);
      currentIndicator = null;
    }
    if (isInVoiceMode && voiceOrbState === 'speaking') {
      setVoiceOrbState('idle');
    }
  }

  function stopCurrentGeneration() {
    stopSpeaking();
    if (typeof activeStopHandler === 'function') {
      activeStopHandler();
      activeStopHandler = null;
    }
    if (isInVoiceMode) {
      setVoiceOrbState('idle', 'หยุดการตอบแล้ว (แตะวงกลมเพื่อพูดคุยต่อ)');
    }
  }

  function updateVoiceToggleUI() {
    if (!btnVoiceToggle) return;
    const iconOn = btnVoiceToggle.querySelector('.icon-voice-on');
    const iconOff = btnVoiceToggle.querySelector('.icon-voice-off');

    if (isVoiceEnabled) {
      btnVoiceToggle.classList.add('active');
      btnVoiceToggle.classList.remove('muted');
      btnVoiceToggle.title = 'เปิดเสียงตอบกลับอยู่ (คลิกเพื่อปิดเสียง)';
      if (iconOn) iconOn.style.display = 'block';
      if (iconOff) iconOff.style.display = 'none';
    } else {
      btnVoiceToggle.classList.remove('active');
      btnVoiceToggle.classList.add('muted');
      btnVoiceToggle.title = 'ปิดเสียงตอบกลับอยู่ (คลิกเพื่อเปิดเสียง)';
      if (iconOn) iconOn.style.display = 'none';
      if (iconOff) iconOff.style.display = 'block';
    }
  }

  // =========================================================================
  // INTERACTIVE FLUID VOICE ORB ANIMATOR (ChatGPT Voice Mode)
  // =========================================================================
  function setVoiceOrbState(newState, customStatus) {
    voiceOrbState = newState;
    if (voiceOrbAura) {
      if (newState === 'listening') {
        voiceOrbAura.style.background = 'radial-gradient(circle, rgba(56, 189, 248, 0.35) 0%, rgba(14, 165, 233, 0.15) 50%, transparent 75%)';
        if (voiceOrbStatus) voiceOrbStatus.textContent = customStatus || 'กำลังรับฟังเสียง... (พูดคุยได้เลยครับ)';
        if (btnVoiceModeInterrupt) btnVoiceModeInterrupt.style.display = 'none';
        if (btnVoiceModeMicToggle) btnVoiceModeMicToggle.classList.add('is-active');
      } else if (newState === 'thinking') {
        voiceOrbAura.style.background = 'radial-gradient(circle, rgba(192, 132, 252, 0.4) 0%, rgba(99, 102, 241, 0.2) 50%, transparent 75%)';
        if (voiceOrbStatus) voiceOrbStatus.textContent = customStatus || 'กำลังคิดวิเคราะห์และค้นหาข้อมูล...';
        if (btnVoiceModeInterrupt) btnVoiceModeInterrupt.style.display = 'none';
      } else if (newState === 'speaking') {
        voiceOrbAura.style.background = 'radial-gradient(circle, rgba(56, 189, 248, 0.45) 0%, rgba(168, 85, 247, 0.25) 50%, transparent 75%)';
        if (voiceOrbStatus) voiceOrbStatus.textContent = customStatus || 'กำลังตอบ... (แตะวงกลมเพื่อพูดแทรก)';
        if (btnVoiceModeInterrupt) btnVoiceModeInterrupt.style.display = 'inline-flex';
      } else {
        voiceOrbAura.style.background = 'radial-gradient(circle, rgba(56, 189, 248, 0.2) 0%, transparent 70%)';
        if (voiceOrbStatus) voiceOrbStatus.textContent = customStatus || 'แตะที่วงกลมเพื่อเริ่มพูด';
        if (btnVoiceModeInterrupt) btnVoiceModeInterrupt.style.display = 'none';
        if (btnVoiceModeMicToggle) btnVoiceModeMicToggle.classList.remove('is-active');
      }
    }
  }

  function startVoiceOrbAnimation() {
    if (!voiceOrbCanvas) return;
    const ctx = voiceOrbCanvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    const width = 380;
    const height = 380;
    voiceOrbCanvas.width = width * dpr;
    voiceOrbCanvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    const centerX = width / 2;
    const centerY = height / 2;

    function render(timestamp) {
      if (!isInVoiceMode) return;
      const t = (timestamp - voiceOrbStartTime) / 1000;
      ctx.clearRect(0, 0, width, height);

      let baseRadius = 105;
      let numPoints = 64;
      let amp1 = 5;
      let amp2 = 3;
      let speed = 2.0;

      if (voiceOrbState === 'listening') {
        baseRadius = 102 + Math.sin(t * 2.2) * 5;
        amp1 = 5 + Math.sin(t * 4) * 2;
        amp2 = 3;
        speed = 1.8;
      } else if (voiceOrbState === 'thinking') {
        baseRadius = 96;
        amp1 = 12 + Math.sin(t * 3.5) * 4;
        amp2 = 7;
        speed = 4.2;
      } else if (voiceOrbState === 'speaking') {
        let soundBoost = 1.0;
        if (studioAnalyser && studioDataArray) {
          studioAnalyser.getByteFrequencyData(studioDataArray);
          let sum = 0;
          for (let k = 0; k < studioDataArray.length; k++) sum += studioDataArray[k];
          const avg = sum / studioDataArray.length;
          soundBoost = Math.max(0.6, Math.min(2.2, avg / 28));
        }
        baseRadius = 114 + Math.sin(t * 8) * (8 * soundBoost);
        amp1 = (16 + Math.cos(t * 6) * 6) * soundBoost;
        amp2 = 10 * soundBoost;
        speed = 6.5;
      }

      // 1. Draw outer soft glow ring
      ctx.save();
      ctx.beginPath();
      for (let i = 0; i <= numPoints; i++) {
        const angle = (i / numPoints) * Math.PI * 2;
        const wave = Math.sin(angle * 3 + t * speed) * amp1 + Math.cos(angle * 5 - t * (speed * 0.7)) * amp2;
        const r = (baseRadius + 14) + wave;
        const x = centerX + Math.cos(angle) * r;
        const y = centerY + Math.sin(angle) * r;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.fillStyle = voiceOrbState === 'thinking' 
        ? 'rgba(192, 132, 252, 0.12)' 
        : 'rgba(56, 189, 248, 0.12)';
      ctx.fill();
      ctx.restore();

      // 2. Draw middle fluid body with gradient
      ctx.save();
      ctx.beginPath();
      for (let i = 0; i <= numPoints; i++) {
        const angle = (i / numPoints) * Math.PI * 2;
        const wave = Math.sin(angle * 4 + t * speed) * amp1 + Math.cos(angle * 6 - t * (speed * 0.8)) * amp2;
        const r = baseRadius + wave;
        const x = centerX + Math.cos(angle) * r;
        const y = centerY + Math.sin(angle) * r;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();

      const grad = ctx.createLinearGradient(centerX - baseRadius, centerY - baseRadius, centerX + baseRadius, centerY + baseRadius);
      if (voiceOrbState === 'thinking') {
        grad.addColorStop(0, '#c084fc');
        grad.addColorStop(0.5, '#6366f1');
        grad.addColorStop(1, '#38bdf8');
      } else if (voiceOrbState === 'speaking') {
        grad.addColorStop(0, '#38bdf8');
        grad.addColorStop(0.4, '#818cf8');
        grad.addColorStop(1, '#f472b6');
      } else {
        grad.addColorStop(0, '#38bdf8');
        grad.addColorStop(0.6, '#0ea5e9');
        grad.addColorStop(1, '#6366f1');
      }
      ctx.fillStyle = grad;
      ctx.shadowColor = voiceOrbState === 'thinking' ? '#c084fc' : '#38bdf8';
      ctx.shadowBlur = 24;
      ctx.fill();
      ctx.restore();

      // 3. Draw inner luminous core highlight
      ctx.save();
      ctx.beginPath();
      const coreR = baseRadius * 0.55 + Math.sin(t * (speed * 0.9)) * 3;
      ctx.arc(centerX, centerY, coreR, 0, Math.PI * 2);
      const coreGrad = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, coreR);
      coreGrad.addColorStop(0, 'rgba(255, 255, 255, 0.85)');
      coreGrad.addColorStop(0.4, 'rgba(255, 255, 255, 0.25)');
      coreGrad.addColorStop(1, 'transparent');
      ctx.fillStyle = coreGrad;
      ctx.fill();
      ctx.restore();

      voiceOrbAnimId = requestAnimationFrame(render);
    }

    voiceOrbStartTime = performance.now();
    if (voiceOrbAnimId) cancelAnimationFrame(voiceOrbAnimId);
    voiceOrbAnimId = requestAnimationFrame(render);
  }

  function startVoiceModeListening() {
    if (!recognition) return;
    if (isListening) return;
    setVoiceOrbState('listening');
    try {
      recognition.start();
    } catch (e) {
      console.warn('Voice Mode Recognition Start:', e);
    }
  }

  function openVoiceMode() {
    isInVoiceMode = true;
    initStudioAudioPipeline();
    if (studioAudioCtx && studioAudioCtx.state === 'suspended') {
      studioAudioCtx.resume().catch(() => {});
    }
    if (voiceModeOverlay) {
      voiceModeOverlay.style.display = 'flex';
    }
    startVoiceOrbAnimation();
    setVoiceOrbState('listening');
    if (voiceCaptionUser) voiceCaptionUser.textContent = '';
    if (voiceCaptionBot) voiceCaptionBot.textContent = 'ยินดีต้อนรับสู่ระบบเสียง Belton AI สามารถพูดคุยสอบถามได้เลยครับ';
    startVoiceModeListening();
  }

  function closeVoiceMode() {
    isInVoiceMode = false;
    stopSpeaking();
    if (recognition && isListening) {
      try { recognition.stop(); } catch(e) {}
    }
    if (voiceOrbAnimId) {
      cancelAnimationFrame(voiceOrbAnimId);
      voiceOrbAnimId = null;
    }
    if (voiceModeOverlay) {
      voiceModeOverlay.style.display = 'none';
    }
  }

  async function speakResponse(text, rowEl) {
    if (!isVoiceEnabled || !text) return;
    stopSpeaking();

    try {
      initStudioAudioPipeline();
      if (studioAudioCtx && studioAudioCtx.state === 'suspended') {
        await studioAudioCtx.resume().catch(() => {});
      }

      const res = await fetch(window.beltonUrl('/api/tts'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, voice: selectedVoice })
      });

      if (!res.ok) return;

      const blob = await res.blob();
      if (currentAudioBlobUrl) {
        try { URL.revokeObjectURL(currentAudioBlobUrl); } catch (e) {}
      }
      currentAudioBlobUrl = URL.createObjectURL(blob);

      const audio = studioAudioPlayer || new Audio();
      currentAudio = audio;
      audio.src = currentAudioBlobUrl;

      const indicator = document.createElement('span');
      indicator.className = 'speaking-indicator';
      indicator.innerHTML = '<span class="speaking-bar"></span><span class="speaking-bar"></span><span class="speaking-bar"></span><span style="margin-left:4px;">กำลังอ่านออกเสียง</span>';
      currentIndicator = indicator;

      const contentEl = rowEl ? rowEl.querySelector('.bot-content') : null;
      if (contentEl) {
        contentEl.appendChild(indicator);
      }

      if (isInVoiceMode) {
        setVoiceOrbState('speaking');
      }

      audio.onended = () => {
        if (indicator.parentNode) indicator.parentNode.removeChild(indicator);
        currentIndicator = null;
        if (currentAudioBlobUrl) {
          try { URL.revokeObjectURL(currentAudioBlobUrl); } catch (e) {}
          currentAudioBlobUrl = null;
        }
        if (currentAudio === audio) currentAudio = null;

        // Hands-free continuous loop in Voice Mode!
        if (isInVoiceMode) {
          setTimeout(() => {
            if (isInVoiceMode && !isThinking) {
              if (voiceCaptionUser) voiceCaptionUser.textContent = '';
              startVoiceModeListening();
            }
          }, 400);
        }
      };

      audio.onerror = () => {
        if (indicator.parentNode) indicator.parentNode.removeChild(indicator);
        currentIndicator = null;
        if (currentAudioBlobUrl) {
          try { URL.revokeObjectURL(currentAudioBlobUrl); } catch (e) {}
          currentAudioBlobUrl = null;
        }
        if (currentAudio === audio) currentAudio = null;

        if (isInVoiceMode) {
          setTimeout(() => {
            if (isInVoiceMode && !isThinking) {
              startVoiceModeListening();
            }
          }, 400);
        }
      };

      await audio.play();
    } catch (err) {
      console.warn('[Audio Playback Error]:', err);
      if (currentIndicator && currentIndicator.parentNode) {
        currentIndicator.parentNode.removeChild(currentIndicator);
        currentIndicator = null;
      }
      if (isInVoiceMode) {
        setVoiceOrbState('idle');
      }
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
      return `<a href="${window.beltonUrl('/factory')}?target=${pNum}" class="teleport-action-badge">
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
    stopSpeaking();
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
      const response = await fetch(window.beltonUrl('/api/copilot/chat-stream'), {
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
      let accumulatedText = '';
      let isStreamFinished = false;
      let actionData = null;

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

      function finalizeAndDisplayResponse(fullText) {
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

        let finalFull = fullText || '';
        if (actionData && actionData.type === 'teleport' && actionData.targetNum) {
          if (!finalFull.includes('[ACTION:TELEPORT:')) {
            finalFull += `\n\n[ACTION:TELEPORT:${actionData.targetNum}]`;
          }
        }

        // Render full response instantly (no typewriter lag!)
        textEl.style.display = 'block';
        textEl.innerHTML = formatMarkdown(finalFull);
        if (cursorEl && cursorEl.parentNode) cursorEl.parentNode.removeChild(cursorEl);

        dialogueHistory.push({ role: 'assistant', content: finalFull });
        isThinking = false;
        activeStopHandler = null;
        setButtonState(false);
        scrollToBottom();

        // Update Voice Mode Captions
        if (isInVoiceMode && voiceCaptionBot) {
          voiceCaptionBot.innerHTML = formatMarkdown(finalFull);
        }

        // Start speaking audio response immediately in sync
        speakResponse(finalFull, rowEl);
      }

      // Read SSE stream chunks
      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          if (!isStreamFinished) {
            isStreamFinished = true;
            finalizeAndDisplayResponse(accumulatedText);
          }
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
                accumulatedText += parsed.token;
              }
            } else if (eventType === 'action') {
              actionData = parsed;
            } else if (eventType === 'done') {
              isStreamFinished = true;
              if (parsed.thoughtMetadata) {
                renderMetadata(parsed.thoughtMetadata);
              }
              finalizeAndDisplayResponse(accumulatedText);
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
      textEl.innerHTML = formatMarkdown('กรุณาติดต่อผู้เปิดเซิฟเวอร์');
      dialogueHistory.push({ role: 'assistant', content: 'กรุณาติดต่อผู้เปิดเซิฟเวอร์' });
      isThinking = false;
      activeStopHandler = null;
      setButtonState(false);
      scrollToBottom();
      if (isInVoiceMode && voiceCaptionBot) {
        voiceCaptionBot.textContent = 'กรุณาติดต่อผู้เปิดเซิฟเวอร์';
      }
      speakResponse('กรุณาติดต่อผู้เปิดเซิฟเวอร์', rowEl);
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
      stopSpeaking();
      feed.innerHTML = '';
      dialogueHistory = [];
      if (hero) hero.classList.remove('is-hidden');
      if (input) input.focus();
    });
  }

  // Handle Voice Toggle Button
  if (btnVoiceToggle) {
    updateVoiceToggleUI();
    btnVoiceToggle.addEventListener('click', () => {
      isVoiceEnabled = !isVoiceEnabled;
      localStorage.setItem('belton_voice_enabled', isVoiceEnabled);
      updateVoiceToggleUI();
      if (!isVoiceEnabled) {
        stopSpeaking();
      }
    });
  }

  // Setup Web Speech Recognition (STT in Thai)
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (SpeechRecognition) {
    recognition = new SpeechRecognition();
    recognition.lang = 'th-TH';
    recognition.continuous = false;
    recognition.interimResults = true;

    recognition.onstart = () => {
      isListening = true;
      if (btnMic) btnMic.classList.add('is-listening');
      if (voiceStatusPill) {
        voiceStatusPill.style.display = 'flex';
        const textSpan = voiceStatusPill.querySelector('.voice-status-text');
        if (textSpan) textSpan.textContent = 'กำลังรับฟังเสียง... (พูดคำถามได้เลยครับ)';
      }
      if (isInVoiceMode) {
        setVoiceOrbState('listening');
      }
    };

    recognition.onresult = (event) => {
      let interimTranscript = '';
      let finalTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        } else {
          interimTranscript += event.results[i][0].transcript;
        }
      }

      const text = finalTranscript || interimTranscript;
      if (input && text) {
        input.value = text;
      }
      if (isInVoiceMode && voiceCaptionUser && text) {
        voiceCaptionUser.textContent = 'คุณ: ' + text;
      }
    };

    recognition.onerror = (event) => {
      console.warn('Speech Recognition Error:', event.error);
      if (voiceStatusPill) {
        const textSpan = voiceStatusPill.querySelector('.voice-status-text');
        if (textSpan) textSpan.textContent = 'ไม่พบเสียงพูด หรือกรุณาอนุญาตการใช้ไมโครโฟน';
        setTimeout(() => {
          if (!isListening && voiceStatusPill) voiceStatusPill.style.display = 'none';
        }, 2500);
      }
      if (btnMic) btnMic.classList.remove('is-listening');
      isListening = false;
      if (isInVoiceMode) {
        setVoiceOrbState('idle', 'ไม่พบเสียงพูด (แตะวงกลมเพื่อพูดคุยต่อ)');
      }
    };

    recognition.onend = () => {
      isListening = false;
      if (btnMic) btnMic.classList.remove('is-listening');
      if (voiceStatusPill) voiceStatusPill.style.display = 'none';

      const spokenQuery = input ? input.value.trim() : '';

      if (spokenQuery && !isThinking) {
        if (input) input.value = '';
        if (isInVoiceMode) {
          setVoiceOrbState('thinking');
        }
        sendMessage(spokenQuery);
      } else if (isInVoiceMode && !isThinking) {
        // Continuous hands-free loop: if silence timed out, seamlessly restart listening
        setTimeout(() => {
          if (isInVoiceMode && !isThinking && voiceOrbState === 'listening') {
            startVoiceModeListening();
          }
        }, 500);
      }
    };
  }

  // Handle Microphone Button Click -> Directly Launch Fullscreen VOICE LIVE Mode
  if (btnMic) {
    btnMic.addEventListener('click', (e) => {
      e.preventDefault();
      openVoiceMode();
    });
  }

  // Fullscreen Voice Mode Event Listeners
  if (btnLaunchVoiceMode) {
    btnLaunchVoiceMode.addEventListener('click', openVoiceMode);
  }

  if (btnExitVoiceMode) {
    btnExitVoiceMode.addEventListener('click', closeVoiceMode);
  }

  if (btnVoiceModeMicToggle) {
    btnVoiceModeMicToggle.addEventListener('click', () => {
      if (isListening) {
        if (recognition) recognition.stop();
        setVoiceOrbState('idle', 'ไมโครโฟนหยุดชั่วคราว (แตะเพื่อเปิดไมค์)');
      } else {
        startVoiceModeListening();
      }
    });
  }

  function updateVoiceGenderUI() {
    if (!voiceGenderLabel) return;
    const isMale = selectedVoice === 'th-TH-NiwatNeural';
    voiceGenderLabel.textContent = isMale ? 'เสียง: ชาย (Niwat)' : 'เสียง: หญิง (Premwadee)';
  }

  if (btnVoiceGenderToggle) {
    updateVoiceGenderUI();
    btnVoiceGenderToggle.addEventListener('click', () => {
      selectedVoice = selectedVoice === 'th-TH-NiwatNeural' ? 'th-TH-PremwadeeNeural' : 'th-TH-NiwatNeural';
      localStorage.setItem('belton_selected_voice', selectedVoice);
      updateVoiceGenderUI();
      if (currentAudio) {
        stopSpeaking();
      }
    });
  }

  if (btnVoiceModeInterrupt) {
    btnVoiceModeInterrupt.addEventListener('click', () => {
      stopSpeaking();
      startVoiceModeListening();
    });
  }

  if (voiceOrbWrapper) {
    voiceOrbWrapper.addEventListener('click', () => {
      if (voiceOrbState === 'speaking') {
        // Tap to interrupt
        stopSpeaking();
        startVoiceModeListening();
      } else if (voiceOrbState === 'idle' || voiceOrbState === 'listening') {
        if (isListening && recognition) {
          recognition.stop();
        } else {
          startVoiceModeListening();
        }
      }
    });
  }

  // Auto-focus input on page load
  if (input) {
    input.focus();
  }

})();

