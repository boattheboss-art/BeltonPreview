/**
 * BENTON 3D EXPERIENCE ENGINE — GLITCH-FREE CAMERA INITIALIZATION
 * - Pre-fetches asset in memory
 * - 80ms camera matrix settlement in the dark to hide the 1-frame camera snap
 * - Smoothly begins the live rising animation on screen
 */
import { Application } from 'https://unpkg.com/@splinetool/runtime@1.9.59/build/runtime.js';

export function prefetchAsset() {
  fetch('assets/models/scene.splinecode', { priority: 'high' }).catch(() => {});
}
prefetchAsset();

export async function createBentonScene(canvasId) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return null;

  // Pre-allocate high-DPI canvas buffer to prevent camera FOV recalculation pop
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = window.innerWidth * dpr;
  canvas.height = window.innerHeight * dpr;

  const spline = new Application(canvas);

  try {
    await spline.load('assets/models/scene.splinecode');
  } catch (err) {
    console.warn('Local load fallback to online Spline CDN:', err);
    try {
      await spline.load('https://prod.spline.design/UYgWwGgcdoouGLJH/scene.splinecode');
    } catch (e) {
      console.error('Spline load error:', e);
    }
  }

  // Lock camera and pause animations at the initial close-up pose in the dark
  if (spline.stop) {
    spline.stop();
  }

  // Handle window resizing
  window.addEventListener('resize', () => {
    if (spline && spline.setSize) {
      spline.setSize(window.innerWidth, window.innerHeight);
    }
  });

  return {
    spline,
    startZoomAnimation() {
      if (spline && spline.play) {
        spline.play();
      }
    },
    setScrollProgress(v) {
      try {
        if (spline.setVariable) {
          spline.setVariable('scroll', v);
        }
      } catch (_) {}
    },
  };
}

export async function createBgSplineScene(canvasId) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return null;

  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = window.innerWidth * dpr;
  canvas.height = window.innerHeight * dpr;

  const spline = new Application(canvas);

  try {
    await spline.load('assets/models/bg_scene.splinecode?v=' + Date.now());
    canvas.classList.add('is-visible');
    if (spline.play) spline.play();
  } catch (err) {
    console.warn('Local bg spline load fallback to online CDN:', err);
    try {
      await spline.load('https://prod.spline.design/MG1LWxb8Jo7FVHqW/scene.splinecode');
      canvas.classList.add('is-visible');
      if (spline.play) spline.play();
    } catch (e) {
      console.error('Spline background load error:', e);
    }
  }

  window.addEventListener('resize', () => {
    if (spline && spline.setSize) {
      spline.setSize(window.innerWidth, window.innerHeight);
    }
  });

  // Forward Global Window Pointer & Mouse movements to background canvas
  // so the 3D scene responds to mouse even when layered in the very back
  window.addEventListener('pointermove', (e) => {
    canvas.dispatchEvent(new PointerEvent('pointermove', {
      clientX: e.clientX,
      clientY: e.clientY,
      screenX: e.screenX,
      screenY: e.screenY,
      pageX: e.pageX,
      pageY: e.pageY,
      bubbles: true,
      cancelable: true,
      pointerType: e.pointerType || 'mouse'
    }));
  }, { passive: true });

  window.addEventListener('mousemove', (e) => {
    canvas.dispatchEvent(new MouseEvent('mousemove', {
      clientX: e.clientX,
      clientY: e.clientY,
      screenX: e.screenX,
      screenY: e.screenY,
      pageX: e.pageX,
      pageY: e.pageY,
      bubbles: true,
      cancelable: true
    }));
  }, { passive: true });

  return spline;
}
