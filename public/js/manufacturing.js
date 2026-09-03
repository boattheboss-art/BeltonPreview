/**
 * BENTON CORPORATE LEGACY & PRECISION LAB — APPLE-GRADE INTERACTION ENGINE
 * - Left-Aligned HUD with Unobstructed 3D Kinetic Physics Viewport
 * - Spline Object Cleaner (hides template placeholder text in 3D scene)
 * - Scroll-Triggered Motion Graphics via IntersectionObserver
 * - Stage 03 Before / After Draggable Slider
 * - Live CNC Coordinate Telemetry Stream (Activated on Scroll)
 * - Cleanroom Particle Counter Countdown (Activated on Scroll)
 * - Laser Metrology Verification Scanner
 * Zero Emojis. Pure Precision.
 */

document.addEventListener('DOMContentLoaded', () => {
  initSplineSceneCleaner();
  initScrollTriggeredBoxes();
  initBeforeAfterSlider();
  initLaserToleranceScanner();
});

// Sound fx helpers
const sfxClick = document.getElementById('sfxClick');
const sfxOpen = document.getElementById('sfxOpen');

function playSfx(audio) {
  if (audio) {
    audio.currentTime = 0;
    audio.play().catch(() => {});
  }
}

// ==========================================================================
// 1. SPLINE 3D SCENE CLEANER & PHYSICS UNBLOCKER
// ==========================================================================
function initSplineSceneCleaner() {
  const viewer = document.getElementById('nanaSplineViewer');
  if (!viewer) return;

  // Once Spline finishes loading, hide embedded template text/buttons inside 3D
  viewer.addEventListener('load', (e) => {
    try {
      const app = viewer._app || (e && e.detail && e.detail.app);
      if (app && app.getAllObjects) {
        const objs = app.getAllObjects();
        objs.forEach(obj => {
          if (!obj || !obj.name) return;
          const n = obj.name.toLowerCase();
          // Target template texts, buttons, and placeholder subtitles
          if (n.includes('text') || n.includes('button') || n.includes('title') || n.includes('subtitle') || n.includes('heading') || n.includes('cta') || n.includes('label')) {
            obj.visible = false;
          }
        });
      }
    } catch (err) {
      console.warn('Spline cleaner notice:', err);
    }
  });
}

// ==========================================================================
// 2. APPLE-STYLE SCROLL-TRIGGERED MOTION OBSERVER
// ==========================================================================
function initScrollTriggeredBoxes() {
  const triggerBoxes = document.querySelectorAll('.scroll-trigger-box');
  if (!triggerBoxes.length) return;

  let cncStarted = false;
  let cleanroomStarted = false;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-in-view');

        const chapter = entry.target.getAttribute('data-chapter');

        // Chapter 2: Wake up CNC coordinate stream
        if (chapter === '2' && !cncStarted) {
          cncStarted = true;
          startCncCoordinateStream();
        }

        // Chapter 4: Wake up Cleanroom Particle Countdown
        if (chapter === '4' && !cleanroomStarted) {
          cleanroomStarted = true;
          startCleanroomParticleCountdown();
        }
      }
    });
  }, {
    threshold: 0.18,
    rootMargin: '0px 0px -50px 0px'
  });

  triggerBoxes.forEach((box) => observer.observe(box));
}

// ==========================================================================
// 3. BEFORE / AFTER INTERACTIVE SLIDER (CHAPTER 03)
// ==========================================================================
function initBeforeAfterSlider() {
  const container = document.getElementById('beforeAfterSlider');
  const afterLayer = document.getElementById('baAfterLayer');
  const handle = document.getElementById('baHandle');

  if (!container || !afterLayer || !handle) return;

  let isDragging = false;

  function updateSlider(clientX) {
    const rect = container.getBoundingClientRect();
    let x = clientX - rect.left;
    x = Math.max(0, Math.min(x, rect.width));

    const percent = (x / rect.width) * 100;
    afterLayer.style.width = `${percent}%`;
    handle.style.left = `${percent}%`;
  }

  container.addEventListener('mousedown', (e) => {
    isDragging = true;
    updateSlider(e.clientX);
    playSfx(sfxClick);
  });

  window.addEventListener('mousemove', (e) => {
    if (!isDragging) return;
    updateSlider(e.clientX);
  });

  window.addEventListener('mouseup', () => {
    if (isDragging) isDragging = false;
  });

  // Touch Support
  container.addEventListener('touchstart', (e) => {
    isDragging = true;
    updateSlider(e.touches[0].clientX);
  }, { passive: true });

  window.addEventListener('touchmove', (e) => {
    if (!isDragging) return;
    updateSlider(e.touches[0].clientX);
  }, { passive: true });

  window.addEventListener('touchend', () => {
    isDragging = false;
  });
}

// ==========================================================================
// 4. CNC G-CODE COORDINATE TELEMETRY STREAM (CHAPTER 02)
// ==========================================================================
function startCncCoordinateStream() {
  const elX = document.getElementById('cncX');
  const elY = document.getElementById('cncY');
  const elZ = document.getElementById('cncZ');
  const elFeed = document.getElementById('cncFeed');

  if (!elX || !elY || !elZ) return;

  let baseX = 14.820;
  let baseY = -4.090;
  let baseZ = 1.100;

  setInterval(() => {
    const jitterX = (Math.sin(Date.now() * 0.003) * 0.042).toFixed(3);
    const jitterY = (Math.cos(Date.now() * 0.004) * 0.036).toFixed(3);
    const jitterZ = (Math.sin(Date.now() * 0.002) * 0.011).toFixed(3);

    const curX = (baseX + parseFloat(jitterX)).toFixed(3);
    const curY = (baseY + parseFloat(jitterY)).toFixed(3);
    const curZ = (baseZ + parseFloat(jitterZ)).toFixed(3);

    elX.textContent = `${curX >= 0 ? '+' : ''}${curX} mm`;
    elY.textContent = `${curY >= 0 ? '+' : ''}${curY} mm`;
    elZ.textContent = `${curZ >= 0 ? '+' : ''}${curZ} mm`;

    if (elFeed) {
      const feed = Math.floor(12200 + Math.random() * 600);
      elFeed.textContent = `${feed.toLocaleString()} mm/min`;
    }
  }, 130);
}

// ==========================================================================
// 5. CLEANROOM PARTICLE COUNTDOWN ANIMATION (CHAPTER 04)
// ==========================================================================
function startCleanroomParticleCountdown() {
  const counterEl = document.getElementById('cleanCounter');
  if (!counterEl) return;

  let startVal = 46.5;
  const duration = 2400; // 2.4s
  const startTime = performance.now();

  function updateCount(now) {
    const elapsed = now - startTime;
    const progress = Math.min(elapsed / duration, 1);
    // Exponential deceleration curve
    const easeOut = 1 - Math.pow(1 - progress, 3);
    const current = Math.max(0, startVal * (1 - easeOut));

    counterEl.textContent = current.toFixed(1);

    if (progress < 1) {
      requestAnimationFrame(updateCount);
    } else {
      counterEl.textContent = '00.0';
    }
  }

  requestAnimationFrame(updateCount);
}

// ==========================================================================
// 6. INTERACTIVE LASER METROLOGY SCANNER
// ==========================================================================
function initLaserToleranceScanner() {
  const startBtn = document.getElementById('startScanBtn');
  const laserBeam = document.getElementById('scannerLaserBeam');
  const resPitch = document.getElementById('resPitch');
  const resRunout = document.getElementById('resRunout');
  const resGap = document.getElementById('resGap');
  const resStatus = document.getElementById('resStatus');

  if (!startBtn || !laserBeam) return;

  let isScanning = false;

  startBtn.addEventListener('click', () => {
    if (isScanning) return;
    isScanning = true;

    playSfx(sfxClick);
    startBtn.disabled = true;
    startBtn.style.opacity = '0.5';
    startBtn.style.cursor = 'not-allowed';

    laserBeam.classList.add('is-scanning');

    if (resStatus) {
      resStatus.textContent = 'SCANNING PROFILE IN PROGRESS...';
      resStatus.style.color = '#38bdf8';
    }

    const sweepInterval = setInterval(() => {
      if (resPitch) resPitch.textContent = `0.${Math.floor(2480 + Math.random() * 40)} mm`;
      if (resRunout) resRunout.textContent = `0.000${Math.floor(2 + Math.random() * 5)} mm`;
      if (resGap) resGap.textContent = `0.${Math.floor(1180 + Math.random() * 40)} mm`;
    }, 100);

    setTimeout(() => {
      clearInterval(sweepInterval);
      laserBeam.classList.remove('is-scanning');
      playSfx(sfxOpen);

      if (resPitch) resPitch.textContent = '0.2500 mm (+/- 0.0002)';
      if (resRunout) resRunout.textContent = '0.0003 mm (EXCELLENT)';
      if (resGap) resGap.textContent = '0.1200 mm (OPTIMAL)';

      if (resStatus) {
        resStatus.textContent = 'VERIFIED / PASSED QC COMPLIANCE';
        resStatus.style.color = '#00c853';
      }

      startBtn.disabled = false;
      startBtn.style.opacity = '1';
      startBtn.style.cursor = 'pointer';
      isScanning = false;
    }, 2800);
  });
}
