/**
 * BELTON MANUFACTURING & PRECISION LAB — INTERACTIVE ENGINE
 * - Stage 03 Before / After Draggable Slider
 * - Stage 02 Live CNC Coordinate Telemetry Stream
 * - Metrology Bay Laser Tolerance Verification Scanner
 */

document.addEventListener('DOMContentLoaded', () => {
  initBeforeAfterSlider();
  initCncCoordinateStream();
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
// 1. BEFORE / AFTER INTERACTIVE SLIDER (STAGE 03)
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
    if (isDragging) {
      isDragging = false;
    }
  });

  // Touch Support (Mobile / iPad)
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
// 2. LIVE CNC G-CODE COORDINATE TELEMETRY STREAM (STAGE 02)
// ==========================================================================
function initCncCoordinateStream() {
  const elX = document.getElementById('cncX');
  const elY = document.getElementById('cncY');
  const elZ = document.getElementById('cncZ');
  const elFeed = document.getElementById('cncFeed');

  if (!elX || !elY || !elZ) return;

  let baseX = 14.820;
  let baseY = -4.090;
  let baseZ = 1.100;

  setInterval(() => {
    const jitterX = (Math.sin(Date.now() * 0.003) * 0.045).toFixed(3);
    const jitterY = (Math.cos(Date.now() * 0.004) * 0.038).toFixed(3);
    const jitterZ = (Math.sin(Date.now() * 0.002) * 0.012).toFixed(3);

    const curX = (baseX + parseFloat(jitterX)).toFixed(3);
    const curY = (baseY + parseFloat(jitterY)).toFixed(3);
    const curZ = (baseZ + parseFloat(jitterZ)).toFixed(3);

    elX.textContent = `${curX >= 0 ? '+' : ''}${curX} mm`;
    elY.textContent = `${curY >= 0 ? '+' : ''}${curY} mm`;
    elZ.textContent = `${curZ >= 0 ? '+' : ''}${curZ} mm`;

    if (elFeed) {
      const feed = Math.floor(12000 + Math.random() * 800);
      elFeed.textContent = `${feed.toLocaleString()} mm/min`;
    }
  }, 140);
}

// ==========================================================================
// 3. INTERACTIVE LASER TOLERANCE SCANNER
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
    startBtn.style.opacity = '0.6';
    startBtn.style.cursor = 'not-allowed';

    laserBeam.classList.add('is-scanning');

    if (resStatus) {
      resStatus.textContent = 'SCANNING PROFILE IN PROGRESS...';
      resStatus.style.color = '#38bdf8';
    }

    // Fluctuate numbers while scanning
    const sweepInterval = setInterval(() => {
      if (resPitch) resPitch.textContent = `0.${Math.floor(2480 + Math.random() * 40)} mm`;
      if (resRunout) resRunout.textContent = `0.000${Math.floor(2 + Math.random() * 5)} mm`;
      if (resGap) resGap.textContent = `0.${Math.floor(1180 + Math.random() * 40)} mm`;
    }, 100);

    // Conclude verification after 2.8s
    setTimeout(() => {
      clearInterval(sweepInterval);
      laserBeam.classList.remove('is-scanning');
      playSfx(sfxOpen);

      if (resPitch) resPitch.textContent = '0.2500 mm (±0.0002)';
      if (resRunout) resRunout.textContent = '0.0003 mm (EXCELLENT)';
      if (resGap) resGap.textContent = '0.1200 mm (OPTIMAL)';

      if (resStatus) {
        resStatus.textContent = 'VERIFIED // PASSED QC COMPLIANCE ✓';
        resStatus.style.color = '#10b981';
      }

      startBtn.disabled = false;
      startBtn.style.opacity = '1';
      startBtn.style.cursor = 'pointer';
      isScanning = false;
    }, 2800);
  });
}
