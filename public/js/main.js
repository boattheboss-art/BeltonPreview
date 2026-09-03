/**
 * BELTON — Master Controller & Authentication Gateway
 * - Single [Login] CTA button in Hero & Nav
 * - Validates: Username 'admin', Password '60632'
 * - Redirects to belton_live_preview (http://localhost:8080)
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
  const navGetStartedBtn = document.getElementById('navGetStartedBtn');
  const heroLoginBtn = document.getElementById('heroLoginBtn');
  const scrollDownBtn = document.getElementById('scrollDownBtn');

  // Modal Elements
  const loginModal = document.getElementById('loginModal');
  const modalCloseBtn = document.getElementById('modalCloseBtn');
  const modalBackdrop = document.getElementById('modalBackdrop');
  const cyberLoginForm = document.getElementById('cyberLoginForm');
  const loginUsername = document.getElementById('loginUsername');
  const loginPassword = document.getElementById('loginPassword');
  const loginErrorMsg = document.getElementById('loginErrorMsg');
  const loginFormContainer = document.getElementById('loginFormContainer');
  const authSuccessCard = document.getElementById('authSuccessCard');

  let scene = null;

  // ═════════════════════════════════════════════════════════════════
  // STEP 0: FULLSCREEN 3D SPLINE BACKGROUND INITIALIZATION (z-0)
  // ═════════════════════════════════════════════════════════════════
  createBgSplineScene('bgSplineCanvas');

  // ═════════════════════════════════════════════════════════════════
  // STEP 1: PRE-FETCH 3D ASSET INTO BROWSER MEMORY (NON-BLOCKING)
  // ═════════════════════════════════════════════════════════════════
  prefetchAsset();
  const scenePromise = createBentonScene('bentonCanvas');

  const STAR_LOAD_TIME = 1000; // 1.0s preloader star spin

  setTimeout(() => {
    // ═══════════════════════════════════════════════════════════════
    // STEP 2: STAR FLASHES OUT & 'BELTON' LETTERS RISE UP SILKY SMOOTH
    // ═══════════════════════════════════════════════════════════════
    if (sitePreloader) sitePreloader.classList.add('flash-out');
    soundEngine.playIntroSparkle();

    // A. Reveal 'BELTON' letters (100% 60 FPS hardware accelerated)
    if (bgBeltonText) bgBeltonText.classList.add('play-intro');

    // ═══════════════════════════════════════════════════════════════
    // STEP 3: LETTERS FINISH (1.5s) -> FADE IN LOCKED MODEL (1.2s) -> PLAY ZOOM
    // ═══════════════════════════════════════════════════════════════
    const LETTERS_COMPLETE_DELAY = 1500;

    setTimeout(async () => {
      // 1. Ensure Spline 3D scene is ready and camera is locked at close-up pose
      scene = await scenePromise;

      // 2. Smoothly & gradually fade in 3D model while camera is LOCKED stationary (1.2s fade-in)
      if (bentonCanvas) {
        bentonCanvas.classList.add('is-visible');
      }

      // 3. Once fully visible (1.2s) -> UNLOCK and PLAY the live camera zoom-out!
      setTimeout(() => {
        if (scene && scene.startZoomAnimation) {
          scene.startZoomAnimation();
        }

        // 4. Reveal Navigation Bar & Bottom CTA Buttons as zoom completes
        setTimeout(() => {
          if (siteHeader) siteHeader.classList.add('intro-visible');
          if (heroOverlayContent) heroOverlayContent.classList.add('intro-visible');
        }, 1400);

      }, 1200); // 1.2s gradual fade-in time

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

  // ═════════════════════════════════════════════════════════════════
  // 1. AUTHENTICATION STATE & TOP NAV FLOW
  // ═════════════════════════════════════════════════════════════════
  let isLoginOpen = false;

  function applyLoggedInState(triggerAnimation = false) {
    sessionStorage.setItem('belton_logged_in', 'true');
    document.body.classList.add('is-logged-in');
    if (navGetStartedBtn) {
      navGetStartedBtn.textContent = 'LOGOUT';
      navGetStartedBtn.classList.add('btn-logout-state');
    }
    if (heroLoginBtn) {
      heroLoginBtn.style.display = 'none';
    }
    if (triggerAnimation && siteHeader) {
      siteHeader.classList.remove('just-authenticated');
      void siteHeader.offsetWidth; // Force CSS reflow
      siteHeader.classList.add('just-authenticated');
    }
  }

  function applyLoggedOutState() {
    sessionStorage.removeItem('belton_logged_in');
    document.body.classList.remove('is-logged-in');
    if (siteHeader) siteHeader.classList.remove('just-authenticated');
    if (navGetStartedBtn) {
      navGetStartedBtn.textContent = 'LOGIN';
      navGetStartedBtn.classList.remove('btn-logout-state');
    }
    if (heroLoginBtn) {
      heroLoginBtn.style.display = '';
      heroLoginBtn.textContent = 'LOGIN';
    }
    soundEngine.playUiClick();
  }

  // Auto-restore login state if active in session
  if (sessionStorage.getItem('belton_logged_in') === 'true') {
    applyLoggedInState(false);
  }

  function openLoginModal() {
    if (sessionStorage.getItem('belton_logged_in') === 'true') {
      window.location.href = '/explorer';
      return;
    }
    isLoginOpen = true;
    document.body.classList.add('is-login-open');
    if (loginModal) {
      loginModal.classList.add('is-open');
      loginModal.setAttribute('aria-hidden', 'false');
      if (loginFormContainer) loginFormContainer.style.display = 'block';
      if (authSuccessCard) authSuccessCard.classList.remove('active');
      if (loginErrorMsg) loginErrorMsg.style.display = 'none';
      if (loginUsername) {
        loginUsername.value = '';
        setTimeout(() => loginUsername.focus(), 250);
      }
      if (loginPassword) loginPassword.value = '';
      soundEngine.playUiClick();
    }
  }

  function closeLoginModal() {
    isLoginOpen = false;
    document.body.classList.remove('is-login-open');
    if (loginModal) {
      loginModal.classList.remove('is-open');
      loginModal.setAttribute('aria-hidden', 'true');
      soundEngine.playUiClick();
    }
  }

  if (heroLoginBtn) {
    heroLoginBtn.addEventListener('click', () => {
      if (sessionStorage.getItem('belton_logged_in') === 'true') {
        window.location.href = '/explorer';
      } else {
        openLoginModal();
      }
    });
  }

  const logoutConfirmModal = document.getElementById('logoutConfirmModal');
  const logoutModalBackdrop = document.getElementById('logoutModalBackdrop');
  const cancelLogoutBtn = document.getElementById('cancelLogoutBtn');
  const confirmLogoutBtn = document.getElementById('confirmLogoutBtn');

  function openLogoutConfirmModal() {
    if (!logoutConfirmModal) {
      applyLoggedOutState();
      return;
    }
    logoutConfirmModal.classList.add('is-open');
    logoutConfirmModal.setAttribute('aria-hidden', 'false');
    soundEngine.playUiClick();
  }

  function closeLogoutConfirmModal() {
    if (!logoutConfirmModal) return;
    logoutConfirmModal.classList.remove('is-open');
    logoutConfirmModal.setAttribute('aria-hidden', 'true');
    soundEngine.playUiClick();
  }

  if (cancelLogoutBtn) cancelLogoutBtn.addEventListener('click', closeLogoutConfirmModal);
  if (logoutModalBackdrop) logoutModalBackdrop.addEventListener('click', closeLogoutConfirmModal);

  if (confirmLogoutBtn) {
    confirmLogoutBtn.addEventListener('click', () => {
      closeLogoutConfirmModal();
      applyLoggedOutState();
    });
  }

  if (navGetStartedBtn) {
    navGetStartedBtn.addEventListener('click', () => {
      if (sessionStorage.getItem('belton_logged_in') === 'true') {
        openLogoutConfirmModal();
      } else {
        openLoginModal();
      }
    });
  }

  if (modalCloseBtn) modalCloseBtn.addEventListener('click', closeLoginModal);
  if (modalBackdrop) modalBackdrop.addEventListener('click', closeLoginModal);

  // ═════════════════════════════════════════════════════════════════
  // 2. LOGIN SUBMISSION & ANIMATED TOP NAV REVEAL
  // ═════════════════════════════════════════════════════════════════
  function handleLoginSuccess() {
    soundEngine.playAccessGranted();

    // Close Login Modal and return 3D robot to center
    if (loginModal) {
      loginModal.classList.remove('is-open');
      loginModal.setAttribute('aria-hidden', 'true');
    }
    document.body.classList.remove('is-login-open');

    // Reveal top navigation bar & 3D model link with dynamic slide-down animation
    applyLoggedInState(true);
  }

  // Submit Login Form
  if (cyberLoginForm) {
    cyberLoginForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const username = loginUsername ? loginUsername.value.trim() : '';
      const password = loginPassword ? loginPassword.value.trim() : '';

      // Check credentials: Username 'admin', Password '60632'
      if (username.toLowerCase() === 'admin' && password === '60632') {
        if (loginErrorMsg) loginErrorMsg.style.display = 'none';
        handleLoginSuccess();
      } else {
        // Error: Invalid credentials
        if (loginErrorMsg) {
          loginErrorMsg.textContent = '❌ ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง (Invalid Username or Password)';
          loginErrorMsg.style.display = 'block';
        }
        soundEngine.playUiClick();
        if (loginPassword) {
          loginPassword.value = '';
          loginPassword.focus();
        }
      }
    });
  }

  // Hover sound on buttons
  document.querySelectorAll('button, a').forEach((el) => {
    el.addEventListener('mouseenter', () => soundEngine.playUiHover());
  });
}
