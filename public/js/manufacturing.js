/**
 * BENTON CORPORATE LEGACY & PRECISION LAB — APPLE-GRADE INTERACTION ENGINE
 * - Natural Mouse Wheel Page Scrolling (Fixes Spline scroll hijacking)
 * - Deep 3D Template Artifact Cleaner (Eliminates blue buttons, shapes, and texts)
 * - Scroll-Triggered Motion Graphics via IntersectionObserver
 * - Stage 03 Before / After Draggable Slider
 * - Live CNC Coordinate Telemetry Stream (Activated on Scroll)
 * - Cleanroom Particle Counter Countdown (Activated on Scroll)
 * - Laser Metrology Verification Scanner
 * Zero Emojis. Pure Precision.
 */

document.addEventListener('DOMContentLoaded', () => {
  initNaturalWheelScroll();
  initSplineSceneCleaner();
  initScrollTriggeredBoxes();
  initBeforeAfterSlider();
  initLaserToleranceScanner();
  initLogoutConfirmModal();
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
// 1. NATURAL MOUSE WHEEL SCROLLING (FIXES SPLINE SCROLL INTERCEPTION)
// ==========================================================================
function initNaturalWheelScroll() {
  const heroStage = document.getElementById('hero3DStage');
  if (!heroStage) return;

  // Use CAPTURE phase to intercept wheel before Spline shadow DOM cancels it
  window.addEventListener('wheel', (e) => {
    const path = e.composedPath ? e.composedPath() : [];
    if (heroStage.contains(e.target) || path.includes(heroStage)) {
      window.scrollBy({
        top: e.deltaY,
        left: 0,
        behavior: 'auto'
      });
    }
  }, { capture: true, passive: true });
}

// ==========================================================================
// 2. SPLINE 3D SCENE CLEANER (ELIMINATES BLUE PILL BUTTONS & TEMPLATE TEXT)
// ==========================================================================
function initSplineSceneCleaner() {
  const viewer = document.getElementById('nanaSplineViewer');
  if (!viewer) return;

  const targetNames = [
    'rectangle 3',
    'rectangle 4',
    'shape',
    'dis',
    'text 3',
    'text 4',
    'text',
    'button',
    'title',
    'subtitle',
    'discover',
    'future',
    'contact'
  ];

  const targetUuids = [
    'ebf570cf-b992-42c7-8ad4-78ff18c901d5', // Rectangle 4 (solid blue button)
    'db40c3c7-215e-47a8-bb6a-a87198e1e015', // Rectangle 3 (outline blue button)
    'fa194c9c-3804-4bdc-995b-588dfdecac2f', // Shape (arrow chevron)
    'b443010f-f3ab-4fdf-b32a-158a7a528468', // dis (Discover)
    '517ef7ec-b248-481d-8cd6-9ff7155f0761', // Text 3
    'edb14036-bebd-4c1c-9726-4e06a34cf44b', // Text 4
    '18228d8d-f233-429b-86d9-399ea4e18fe8', // Text Title
    'f9f5a5d7-0e2e-45af-96e8-a873456413ff', // Material
    'c3756221-d98d-49a8-b23c-c9d0d7e1e194'  // Material
  ];

  function banishObject(obj) {
    if (!obj) return;
    const name = (obj.name || '').toLowerCase();
    const id = (obj.id || obj.uuid || '').toLowerCase();

    const matchesName = targetNames.some(t => name.includes(t));
    const matchesUuid = targetUuids.includes(id);
    const isTextGeo = obj.geometry && (
      obj.geometry.type === 'TextGeometry' || 
      obj.geometry.type === 'ShapeGeometry'
    );

    if (matchesName || matchesUuid || isTextGeo) {
      obj.visible = false;
      if (obj.scale && typeof obj.scale.set === 'function') {
        obj.scale.set(0, 0, 0);
      }
      if (obj.position && typeof obj.position.set === 'function') {
        obj.position.set(99999, 99999, 99999);
      }
    }
  }

  function executeClean() {
    try {
      // 1. Spline Web Component API findObjectByName
      targetNames.forEach(async (name) => {
        if (typeof viewer.findObjectByName === 'function') {
          try {
            const o = await viewer.findObjectByName(name);
            if (o) banishObject(o);
          } catch (_) {}
        }
      });

      // 2. Spline Web Component API findObjectById
      targetUuids.forEach(async (uuid) => {
        if (typeof viewer.findObjectById === 'function') {
          try {
            const o = await viewer.findObjectById(uuid);
            if (o) banishObject(o);
          } catch (_) {}
        }
      });

      // 3. Direct Three.js Scene Traversal
      const app = viewer._app;
      if (app && app.scene && typeof app.scene.traverse === 'function') {
        app.scene.traverse(banishObject);
      }

      if (app && typeof app.getAllObjects === 'function') {
        app.getAllObjects().forEach(banishObject);
      }
    } catch (err) {
      // silent
    }
  }

  viewer.addEventListener('load', executeClean);
  
  // Also poll during load stages
  const timer = setInterval(executeClean, 150);
  setTimeout(() => clearInterval(timer), 4000);
}

// ==========================================================================
// 3. APPLE-STYLE SCROLL-TRIGGERED MOTION OBSERVER
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
// 4. BEFORE / AFTER INTERACTIVE SLIDER (CHAPTER 03)
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
// 5. CNC G-CODE COORDINATE TELEMETRY STREAM (CHAPTER 02)
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
// 6. CLEANROOM PARTICLE COUNTDOWN ANIMATION (CHAPTER 04)
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
// 7. INTERACTIVE LASER METROLOGY SCANNER
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

// ==========================================================================
// 8. LUXURY CONFIRM LOGOUT MODAL
// ==========================================================================
function initLogoutConfirmModal() {
  const mfgLogoutBtn = document.getElementById('mfgLogoutBtn');
  const logoutConfirmModal = document.getElementById('logoutConfirmModal');
  const logoutModalBackdrop = document.getElementById('logoutModalBackdrop');
  const cancelLogoutBtn = document.getElementById('cancelLogoutBtn');
  const confirmLogoutBtn = document.getElementById('confirmLogoutBtn');

  if (!mfgLogoutBtn || !logoutConfirmModal) return;

  mfgLogoutBtn.addEventListener('click', () => {
    logoutConfirmModal.classList.add('is-open');
    logoutConfirmModal.setAttribute('aria-hidden', 'false');
    playSfx(sfxClick);
  });

  const closeModal = () => {
    logoutConfirmModal.classList.remove('is-open');
    logoutConfirmModal.setAttribute('aria-hidden', 'true');
    playSfx(sfxClick);
  };

  if (cancelLogoutBtn) cancelLogoutBtn.addEventListener('click', closeModal);
  if (logoutModalBackdrop) logoutModalBackdrop.addEventListener('click', closeModal);

  if (confirmLogoutBtn) {
    confirmLogoutBtn.addEventListener('click', () => {
      sessionStorage.removeItem('belton_logged_in');
      window.location.href = '/';
    });
  }
}
