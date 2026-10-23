/**
 * BENTON 3D EXPERIENCE ENGINE — GLITCH-FREE CAMERA INITIALIZATION
 * - Uses 100% local Spline runtime (./vendor/spline.runtime.js) so offline/firewall PCs never fail
 * - 1x native pixel ratio for smooth 60 FPS on integrated GPUs
 * - Non-blocking load with timeout guard
 */
import { Application } from './vendor/spline.runtime.js';

function resolveAssetUrl(relPath) {
  if (typeof window !== 'undefined' && typeof window.beltonUrl === 'function') {
    return window.beltonUrl(relPath);
  }
  return relPath;
}

function withTimeout(promise, ms) {
  return Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error('Spline load timeout')), ms))
  ]);
}

export function prefetchAsset() {
  try {
    fetch(resolveAssetUrl('assets/models/scene.splinecode'), { priority: 'high' }).catch(() => {});
  } catch (_) {}
}
prefetchAsset();

export async function createBentonScene(canvasId) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return null;

  const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
  canvas.width = window.innerWidth * dpr;
  canvas.height = window.innerHeight * dpr;

  const spline = new Application(canvas);

  try {
    await spline.load(resolveAssetUrl('assets/models/scene.splinecode'));
    canvas.classList.add('is-visible');
    if (spline.play) spline.play();
  } catch (err) {
    console.warn('Local load fallback to online Spline CDN:', err);
    try {
      await withTimeout(spline.load('https://prod.spline.design/UYgWwGgcdoouGLJH/scene.splinecode'), 10000);
      canvas.classList.add('is-visible');
      if (spline.play) spline.play();
    } catch (e) {
      console.error('Spline load error:', e);
    }
  }

  // Handle window resizing
  window.addEventListener('resize', () => {
    if (spline && spline.setSize) {
      spline.setSize(window.innerWidth, window.innerHeight);
    }
  });

  document.addEventListener('visibilitychange', () => {
    if (!spline) return;
    if (document.hidden && spline.stop) spline.stop();
    else if (!document.hidden && spline.play) spline.play();
  });

  return {
    spline,
    startZoomAnimation() {
      canvas.classList.add('is-visible');
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

export function isLowSpecDevice() {
  try {
    if (typeof navigator !== 'undefined') {
      if (navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 4) {
        return true;
      }
      if (navigator.deviceMemory && navigator.deviceMemory <= 4) {
        return true;
      }
    }
    if (typeof document !== 'undefined') {
      const glCanvas = document.createElement('canvas');
      const gl = glCanvas.getContext('webgl') || glCanvas.getContext('experimental-webgl');
      if (gl) {
        const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
        if (debugInfo) {
          const renderer = (gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) || '').toLowerCase();
          if (
            renderer.includes('intel') ||
            renderer.includes('basic render') ||
            renderer.includes('llvmpipe') ||
            renderer.includes('swiftshader') ||
            renderer.includes('mali') ||
            renderer.includes('hd graphics') ||
            renderer.includes('uhd graphics')
          ) {
            return true;
          }
        }
      }
    }
  } catch (_) {}
  return false;
}

export async function createBgSplineScene(canvasId) {
  const canvas = document.getElementById(canvasId);
  const gridFallback = document.getElementById('bgCyberGrid');

  // On low-spec devices, bypass the second WebGL canvas completely and use the high-performance CSS grid
  if (isLowSpecDevice()) {
    if (canvas) canvas.style.display = 'none';
    if (gridFallback) gridFallback.classList.add('is-visible');
    return null;
  }

  if (!canvas) return null;

  const dpr = 1;
  canvas.width = window.innerWidth * dpr;
  canvas.height = window.innerHeight * dpr;

  const spline = new Application(canvas);

  try {
    await spline.load(resolveAssetUrl('assets/models/bg_scene.splinecode'));
    canvas.classList.add('is-visible');
    if (spline.play) spline.play();
  } catch (err) {
    console.warn('Local bg spline load fallback to online CDN:', err);
    try {
      await withTimeout(spline.load('https://prod.spline.design/MG1LWxb8Jo7FVHqW/scene.splinecode'), 8000);
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

  document.addEventListener('visibilitychange', () => {
    if (!spline) return;
    if (document.hidden && spline.stop) spline.stop();
    else if (!document.hidden && spline.play) spline.play();
  });

  // Forward Global Window Pointer movements throttled to 1 per animation frame
  let pointerRafPending = false;
  let lastPointerEvent = null;
  window.addEventListener('pointermove', (e) => {
    lastPointerEvent = e;
    if (pointerRafPending) return;
    pointerRafPending = true;
    requestAnimationFrame(() => {
      pointerRafPending = false;
      if (!lastPointerEvent || document.hidden) return;
      canvas.dispatchEvent(new PointerEvent('pointermove', {
        clientX: lastPointerEvent.clientX,
        clientY: lastPointerEvent.clientY,
        screenX: lastPointerEvent.screenX,
        screenY: lastPointerEvent.screenY,
        pageX: lastPointerEvent.pageX,
        pageY: lastPointerEvent.pageY,
        bubbles: true,
        cancelable: true,
        pointerType: lastPointerEvent.pointerType || 'mouse'
      }));
    });
  }, { passive: true });

  return spline;
}
