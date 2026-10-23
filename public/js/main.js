/**
 * BELTON — Master Controller
 */
import { createBentonScene, createBgSplineScene, prefetchAsset } from './robot3d.js';
import { soundEngine } from './audio.js';

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

function init() {
  // ---- DOM Elements ----
  const sitePreloader = document.getElementById('sitePreloader');
  const bgBeltonText = document.getElementById('bgBeltonText');
  const bentonCanvas = document.getElementById('bentonCanvas');
  const siteHeader = document.getElementById('siteHeader');
  const heroOverlayContent = document.getElementById('heroOverlayContent');
  const audioToggleBtn = document.getElementById('audioToggleBtn');
  const scrollDownBtn = document.getElementById('scrollDownBtn');

  let scene = null;

  document.body.classList.add('is-logged-in');

  // Always guarantee navigation bar and hero content appear promptly without waiting on 3D network load
  setTimeout(() => {
    if (siteHeader) {
      siteHeader.classList.add('intro-visible', 'just-authenticated');
    }
    if (heroOverlayContent) {
      heroOverlayContent.classList.add('intro-visible');
    }
  }, 1200);

  // ═════════════════════════════════════════════════════════════════
  // STEP 0: FULLSCREEN 3D SPLINE BACKGROUND INITIALIZATION (z-0)
  // ═════════════════════════════════════════════════════════════════
  createBgSplineScene('bgSplineCanvas');

  // ═════════════════════════════════════════════════════════════════
  // STEP 1: PRE-FETCH 3D ASSET INTO BROWSER MEMORY (NON-BLOCKING)
  // ═════════════════════════════════════════════════════════════════
  prefetchAsset();
  const scenePromise = createBentonScene('bentonCanvas');

  const STAR_LOAD_TIME = 800; // 0.8s preloader star spin

  setTimeout(() => {
    // ═══════════════════════════════════════════════════════════════
    // STEP 2: STAR FLASHES OUT & 'BELTON' LETTERS RISE UP SILKY SMOOTH
    // ═══════════════════════════════════════════════════════════════
    if (sitePreloader) sitePreloader.classList.add('flash-out');
    soundEngine.playIntroSparkle();

    // A. Reveal 'BELTON' letters (100% 60 FPS hardware accelerated)
    if (bgBeltonText) bgBeltonText.classList.add('play-intro');

    // ═══════════════════════════════════════════════════════════════
    // STEP 3: LETTERS FINISH (1.2s) -> FADE IN LOCKED MODEL -> PLAY ZOOM
    // ═══════════════════════════════════════════════════════════════
    const LETTERS_COMPLETE_DELAY = 1200;

    setTimeout(async () => {
      try {
        scene = await scenePromise;
      } catch (_) {}

      if (bentonCanvas) {
        bentonCanvas.classList.add('is-visible');
      }

      setTimeout(() => {
        if (scene && scene.startZoomAnimation) {
          scene.startZoomAnimation();
        }
      }, 900);

    }, LETTERS_COMPLETE_DELAY);

  }, STAR_LOAD_TIME);

  // ---- Sound Toggle ----
  if (audioToggleBtn) {
    audioToggleBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const isMuted = soundEngine.toggleMute();
      audioToggleBtn.classList.toggle('is-active', !isMuted);
      audioToggleBtn.querySelector('span').textContent = isMuted ? 'MUTED' : 'AUDIO';
    });
  }

  // ---- Scroll Synchronization ----
  function onScroll() {
    const scrollY = window.scrollY;
    const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
    const progress = maxScroll > 0 ? scrollY / maxScroll : 0;

    if (scene && scene.setScrollProgress) scene.setScrollProgress(progress);
    if (siteHeader) siteHeader.classList.toggle('is-scrolled', scrollY > 50);
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  if (scrollDownBtn) {
    scrollDownBtn.addEventListener('click', () => {
      const features = document.getElementById('features');
      if (features) {
        features.scrollIntoView({ behavior: 'smooth' });
        soundEngine.playUiClick();
      }
    });
  }

  // Hover sound on buttons
  document.querySelectorAll('button, a').forEach((el) => {
    el.addEventListener('mouseenter', () => soundEngine.playUiHover());
  });
}
