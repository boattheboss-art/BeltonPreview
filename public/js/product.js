/**
 * AETHER-X — MULTI-PRODUCT 2K SCROLLYTELLING & AUDIO ENGINE
 * Direct Automatic Launch • Zero Friction • Multi-Product Audio
 */

(() => {
  // Configuration
  const TOTAL_FRAMES = 240;
  const VIDEO_DURATION = 10.0;
  const INTRO_DURATION = 10.0;
  const FRAME_EXTENSION = '.jpg';

  // Product Database with Audio
  const PRODUCTS_CONFIG = {
    'A': {
      folder: 'frames',
      audioSrc: 'audio_a.mp3',
      label: 'MENU // PRODUCT A (APFA)',
      introTag: 'APFA // ARM PIVOT FLEX ASSEMBLY PREVIEW',
      brand: 'BELTON // ARM PIVOT FLEX ASSY (APFA)',
      heroKicker: 'PROCESS 01 // COMPLETE ACTUATOR HOOK-UP',
      heroTitle: 'APFA — ARM PIVOT',
      heroDesc: 'Full Actuator Pivot Flex Assembly integrating precision pivot bearings, structural T-ring retention, and automated flexible circuitry hook-up.',
      sec1Kicker: '01 // PIVOT CARTRIDGE INSTALL',
      sec1Title: 'Zero-friction bearing raceway.',
      sec1Desc: 'Sub-micron hydraulic press insertion of the dual-bearing pivot cartridge into the actuator bore with automated torque and depth feedback.',
      spec1Val: '±0.002 mm', spec1Lbl: 'Bore Insertion',
      spec2Val: 'Class 10', spec2Lbl: 'Cleanroom Standard',
      sec2Kicker: '02 // T-RING & DCM ATTACHMENT',
      sec2Title: 'Dynamic control module lock.',
      sec2Desc: 'Precision T-ring mechanical lock coupled with automated DCM attachment to secure flexible circuitry against continuous high-G seeking loads.',
      spec3Val: '65 G', spec3Lbl: 'Seeking Load',
      spec4Val: '100%', spec4Lbl: 'Retention Verified',
      sec3Kicker: '03 // VCM PAD & GROUND SOLDERING',
      sec3Title: 'Contactless laser micro-soldering.',
      sec3Desc: 'Automated closed-loop solder jetting for Voice Coil Motor lead pads and ESD ground pins, guaranteeing ultra-low electrical contact resistance.',
      spec5Val: '< 0.05 Ω', spec5Lbl: 'Contact Res.',
      spec6Val: '480°C', spec6Lbl: 'Laser Profile',
      sec4Kicker: '04 // FINAL ELECTRICAL & OQA SCAN',
      sec4Title: 'Complete continuity verification.',
      sec4Desc: 'High-speed multi-channel four-wire Kelvin electrical screening and laser arm height verification before cleanroom vacuum tray packing.',
      spec7Val: '100 MS/s', spec7Lbl: 'Kelvin Sampling',
      spec8Val: 'Zero ESD', spec8Lbl: 'Static Shield',
      finaleKicker: 'PRECISION ARCHITECTURE',
      finaleTitle: 'High-reliability sub-micron seeking precision.'
    },
    'B': {
      folder: 'frames_b',
      audioSrc: 'audio_b.mp3',
      label: 'MENU // PRODUCT B (ACA)',
      introTag: 'ACA // ACTUATOR COIL ASSEMBLY PREVIEW',
      brand: 'BELTON // ACTUATOR COIL ASSY (ACA)',
      heroKicker: 'PROCESS 02 // E-BLOCK & COIL BONDING',
      heroTitle: 'ACA — ACTUATOR COIL',
      heroDesc: 'Precision Actuator Coil Assembly uniting the CNC-milled 8-tier E-block comb with voice coil bobbins through automated structural dispensing.',
      sec1Kicker: '01 // E-BLOCK & COIL DISPENSING',
      sec1Title: 'Automated adhesive bonding.',
      sec1Desc: 'Dual-component structural epoxy dispensing with inline vision inspection, ensuring zero bubble entrapment between E-block cavities and bobbin mounts.',
      spec1Val: '±0.005 mm', spec1Lbl: 'Bond Tolerance',
      spec2Val: '2-Stage', spec2Lbl: 'Thermal Curing',
      sec2Kicker: '02 // LASER ENGRAVING & TRACEABILITY',
      sec2Title: 'Direct part marking protocol.',
      sec2Desc: 'Sub-micron UV laser engraving applied to the E-block body, providing 100% serialization and traceability across all manufacturing runs.',
      spec3Val: '100%', spec3Lbl: 'Serialization',
      spec4Val: '99.98%', spec4Lbl: 'Dispense Yield',
      sec3Kicker: '03 // COMBINE DVT & COIL HEIGHT',
      sec3Title: 'Multi-axis dynamic verification.',
      sec3Desc: 'Simultaneous DVT clearance gauging and contactless laser coil height measurement, eliminating any planar tilt prior to damper installation.',
      spec5Val: '< 12 µm', spec5Lbl: 'Planar Runout',
      spec6Val: '1.5 kV', spec6Lbl: 'Hi-Pot Voltage',
      sec4Kicker: '04 // RESONANCE & ARM TWEAKING',
      sec4Title: 'Harmonic vibration tuning.',
      sec4Desc: 'Piezo-driven swept-sine resonance checking with automated arm tweaking stations to optimize natural resonant frequencies and head flight geometry.',
      spec7Val: '> 32 kHz', spec7Lbl: 'Resonant Mode',
      spec8Val: '0.001 mm', spec8Lbl: 'Tweaking Acc.',
      finaleKicker: 'INDUSTRIAL CLASSIFICATION',
      finaleTitle: 'Pinnacle of hard disk drive micro-actuation.'
    },
    'C': {
      folder: 'frames_c',
      audioSrc: 'audio_c.mp3',
      label: 'MENU // PRODUCT C (FCOF)',
      introTag: 'FCOF // FLIP CHIP ON FLEX ASSEMBLY',
      brand: 'BELTON // FLIP CHIP ON FLEX (FCOF)',
      heroKicker: 'PROCESS 03 // MICRO-ELECTRONIC INTERCONNECT',
      heroTitle: 'FCOF — FLIP CHIP',
      heroDesc: 'Advanced Flip Chip on Flex interconnect technology mounting ultra-high-speed preamplifier ICs directly onto flexible polyimide carrier circuits.',
      sec1Kicker: '01 // HIGH-PRECISION PASTE PRINTING',
      sec1Title: 'Micro-aperture electroformed stencils.',
      sec1Desc: 'Automated stencil printing dispensing Type-6 solder paste onto sub-millimeter flex pads with 2D optical paste volume inspection.',
      spec1Val: '25 µm', spec1Lbl: 'Stencil Aperture',
      spec2Val: '99.9%', spec2Lbl: 'Paste Volume Cpk',
      sec2Kicker: '02 // FLIP CHIP DIE BONDING',
      sec2Title: 'Sub-micron thermo-compression.',
      sec2Desc: 'Direct flip-chip die placement aligning gold bump arrays with flexible circuits under thermal and pressure-controlled inert nitrogen atmosphere.',
      spec3Val: '±3 µm', spec3Lbl: 'Placement Acc.',
      spec4Val: '280°C', spec4Lbl: 'Peak Reflow',
      sec3Kicker: '03 // CAPILLARY UNDERFILL & CURING',
      sec3Title: 'Structural encapsulation matrix.',
      sec3Desc: 'Automated capillary underfill dispensing completely enveloping die solder joints to absorb thermal expansion stresses and mechanical shock.',
      spec5Val: 'Zero Voids', spec5Lbl: 'Acoustic Scan',
      spec6Val: '150°C', spec6Lbl: 'Curing Chamber',
      sec4Kicker: '04 // HIGH-FREQUENCY SIGNAL INTEGRITY',
      sec4Title: 'Gigabit differential testing.',
      sec4Desc: 'In-line high-frequency time-domain reflectometry and impedance matching checks ensuring clean read/write preamplifier signal transfer.',
      spec7Val: '6.0 Gbps', spec7Lbl: 'Bus Bandwidth',
      spec8Val: '< 15 ps', spec8Lbl: 'Signal Jitter',
      finaleKicker: 'INTEGRATED AVIONICS',
      finaleTitle: 'Next-generation micro-controller flex circuits.'
    },
    'D': {
      folder: 'frames_d',
      audioSrc: 'audio_d.mp3',
      label: 'MENU // PRODUCT D (COIL)',
      introTag: 'COIL // PRECISION VOICE COIL WINDING',
      brand: 'BELTON // COIL WINDING PROCESS',
      heroKicker: 'PROCESS 04 // ELECTROMAGNETIC CORE',
      heroTitle: 'VCM — COIL WINDING',
      heroDesc: 'High-density precision voice coil winding process utilizing self-bonding copper wire, automated 3-in-1 UV curing, and dielectric dip coating.',
      sec1Kicker: '01 // HIGH-SPEED WINDING & UNWIRE',
      sec1Title: 'Tension-controlled spindle winding.',
      sec1Desc: 'Multi-axis CNC spindle winders generating orthocyclic coil layers with continuous tension monitoring, preventing micro-fractures in magnet wire insulation.',
      spec1Val: '0.045 mm', spec1Lbl: 'Wire Diameter',
      spec2Val: '99.4%', spec2Lbl: 'Packing Density',
      sec2Kicker: '02 // AUTO 3-IN-1 & UV CURING',
      sec2Title: 'Integrated bond-line solidifying.',
      sec2Desc: 'Synchronized forming, terminal lead routing, and instantaneous high-intensity ultraviolet curing to fix coil dimensions before thermal out-gassing.',
      spec3Val: '365 nm', spec3Lbl: 'UV Wavelength',
      spec4Val: '1.2 sec', spec4Lbl: 'Cure Cycle',
      sec3Kicker: '03 // DIP COATING & VACUUM BAKING',
      sec3Title: 'Dielectric insulation barrier.',
      sec3Desc: 'Sub-micron conformal resin dip coating followed by multi-zone vacuum baking ovens to eliminate moisture and guarantee ultra-high dielectric strength.',
      spec5Val: '> 500 MΩ', spec5Lbl: 'Insulation Res.',
      spec6Val: '180°C', spec6Lbl: 'Bake Peak Temp',
      sec4Kicker: '04 // COIL THICKNESS & RESISTANCE',
      sec4Title: '100% Parametric screening.',
      sec4Desc: 'Automated 4-point probe resistance testing and non-contact optical thickness inspection to ensure perfectly balanced magnetic flux generation.',
      spec7Val: '±0.02 Ω', spec7Lbl: 'Coil Res. Delta',
      spec8Val: '0.002 mm', spec8Lbl: 'Thickness Tol.',
      finaleKicker: 'ELECTROMAGNETIC EXCELLENCE',
      finaleTitle: 'Ultra-low mass voice coils with maximum torque.'
    }
  };

  // DOM Elements
  const preloader = document.getElementById('preloader');
  const loadStatus = document.getElementById('loadStatus');
  const canvas = document.getElementById('scrubCanvas');
  const ctx = canvas.getContext('2d', { alpha: false });
  const timelineFill = document.getElementById('timelineFill');
  const orbitAngleDisplay = document.getElementById('orbitAngleDisplay');
  const introHud = document.getElementById('introHud');
  const introTagText = document.getElementById('introTagText');
  const skipIntroBtn = document.getElementById('skipIntroBtn');
  const revealElements = document.querySelectorAll('.reveal-ui');
  const audioToggleBtn = document.getElementById('audioToggleBtn');
  const audioStatusLabel = document.getElementById('audioStatusLabel');

  // SAO Menu Elements
  const saoMenuWrapper = document.getElementById('saoMenuWrapper');
  const saoTriggerBtn = document.getElementById('saoTriggerBtn');
  const saoTriggerLabel = document.getElementById('saoTriggerLabel');
  const saoItemCards = document.querySelectorAll('.sao-item-card');

  // Dynamic Content Elements
  const navBrandText = document.getElementById('navBrandText');
  const heroKicker = document.getElementById('heroKicker');
  const heroTitle = document.getElementById('heroTitle');
  const heroDesc = document.getElementById('heroDesc');
  const sec1Kicker = document.getElementById('sec1Kicker');
  const sec1Title = document.getElementById('sec1Title');
  const sec1Desc = document.getElementById('sec1Desc');
  const spec1Val = document.getElementById('spec1Val');
  const spec1Lbl = document.getElementById('spec1Lbl');
  const spec2Val = document.getElementById('spec2Val');
  const spec2Lbl = document.getElementById('spec2Lbl');
  const sec2Kicker = document.getElementById('sec2Kicker');
  const sec2Title = document.getElementById('sec2Title');
  const sec2Desc = document.getElementById('sec2Desc');
  const spec3Val = document.getElementById('spec3Val');
  const spec3Lbl = document.getElementById('spec3Lbl');
  const spec4Val = document.getElementById('spec4Val');
  const spec4Lbl = document.getElementById('spec4Lbl');
  const sec3Kicker = document.getElementById('sec3Kicker');
  const sec3Title = document.getElementById('sec3Title');
  const sec3Desc = document.getElementById('sec3Desc');
  const spec5Val = document.getElementById('spec5Val');
  const spec5Lbl = document.getElementById('spec5Lbl');
  const spec6Val = document.getElementById('spec6Val');
  const spec6Lbl = document.getElementById('spec6Lbl');
  const sec4Kicker = document.getElementById('sec4Kicker');
  const sec4Title = document.getElementById('sec4Title');
  const sec4Desc = document.getElementById('sec4Desc');
  const spec7Val = document.getElementById('spec7Val');
  const spec7Lbl = document.getElementById('spec7Lbl');
  const spec8Val = document.getElementById('spec8Val');
  const spec8Lbl = document.getElementById('spec8Lbl');
  const finaleKicker = document.getElementById('finaleKicker');
  const finaleTitle = document.getElementById('finaleTitle');

  // Audio Objects & SFX
  let currentAudio = new Audio();
  currentAudio.preload = 'auto';
  let isMuted = false;
  let audioUnlocked = false;

  const sfxOpen = new Audio('sao_open.wav');
  const sfxClick = new Audio('sao_click.wav');
  sfxOpen.preload = 'auto';
  sfxClick.preload = 'auto';

  const playSfx = (audioEl) => {
    if (isMuted) return;
    try {
      audioEl.currentTime = 0;
      audioEl.volume = 0.65;
      audioEl.play().catch(() => {});
    } catch(e) {}
  };

  // Ambient Glow Colors per Product
  const PRODUCT_ENHANCEMENTS = {
    'A': { glow: 'radial-gradient(circle, rgba(2, 132, 199, 0.18) 0%, rgba(246, 248, 250, 0) 70%)' },
    'B': { glow: 'radial-gradient(circle, rgba(59, 130, 246, 0.18) 0%, rgba(246, 248, 250, 0) 70%)' },
    'C': { glow: 'radial-gradient(circle, rgba(245, 158, 11, 0.16) 0%, rgba(246, 248, 250, 0) 70%)' },
    'D': { glow: 'radial-gradient(circle, rgba(217, 119, 6, 0.18) 0%, rgba(246, 248, 250, 0) 70%)' }
  };

  // DOM Elements for Enhancements
  const ambientGlow = document.getElementById('ambientGlow');

  // Multi-Product Image Caches
  const productFrameCaches = {
    'A': [],
    'B': [],
    'C': [],
    'D': []
  };

  const productIntroPlayed = {
    'A': false,
    'B': false,
    'C': false,
    'D': false
  };

  let currentProductKey = 'A';
  let targetScrollY = 0;
  let smoothScrollY = 0;
  let lastDrawnIndex = -1;

  // Intro State
  let isIntroPlaying = true;
  let introStartTime = null;

  // Helper: Format frame URL
  const getFrameUrl = (folder, index) => {
    const padIndex = String(index).padStart(4, '0');
    return `${folder}/frame_${padIndex}${FRAME_EXTENSION}`;
  };

  // Helper: Linear Interpolation
  const lerp = (start, end, factor) => start + (end - start) * factor;

  // Resize Canvas to Native HiDPI 2K Resolution
  const resizeCanvas = () => {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = window.innerWidth * dpr;
    canvas.height = window.innerHeight * dpr;
    ctx.scale(dpr, dpr);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    lastDrawnIndex = -1;
    renderFrame();
  };

  // Play Sound
  const playProductAudio = (productKey) => {
    const config = PRODUCTS_CONFIG[productKey];
    if (!config || !config.audioSrc) return;

    try {
      currentAudio.pause();
      currentAudio.src = config.audioSrc;
      currentAudio.currentTime = 0;
      currentAudio.muted = isMuted;

      const playPromise = currentAudio.play();
      if (playPromise !== undefined) {
        playPromise.then(() => {
          audioUnlocked = true;
        }).catch(() => {
          console.log('[Audio] Autoplay waiting for user click.');
        });
      }
    } catch (e) {
      console.warn('Audio play error:', e);
    }
  };

  // Stop Audio
  const stopAudio = () => {
    try {
      currentAudio.pause();
      currentAudio.currentTime = 0;
    } catch (e) {}
  };

  // Preload Images for a specific product
  const preloadProductFrames = (productKey, onProgress, onComplete) => {
    const folder = PRODUCTS_CONFIG[productKey].folder;
    const cache = productFrameCaches[productKey];

    if (cache.length >= TOTAL_FRAMES) {
      if (onComplete) onComplete();
      return;
    }

    let loaded = 0;
    for (let i = 1; i <= TOTAL_FRAMES; i++) {
      const img = new Image();
      img.src = getFrameUrl(folder, i);

      img.onload = () => {
        loaded++;
        if (onProgress) onProgress(loaded, TOTAL_FRAMES);
        if (loaded >= TOTAL_FRAMES && onComplete) onComplete();
      };

      img.onerror = () => {
        loaded++;
        if (loaded >= TOTAL_FRAMES && onComplete) onComplete();
      };

      cache.push(img);
    }
  };

  // Initial Preload -> Direct Launch
  const initApp = () => {
    preloadProductFrames('A', (loaded, total) => {
      if (loadStatus) {
        const pct = Math.round((loaded / total) * 100);
        loadStatus.innerText = `LOADING 2K MASTER ${pct}%`;
      }
    }, () => {
      setTimeout(() => {
        if (preloader) preloader.classList.add('fade-out');
        startCinematicIntro('A');
      }, 150);

      // Preload Product B, C, D progressively in background
      setTimeout(() => {
        preloadProductFrames('B', null, () => {
          console.log('[System] Product B 2K Frames Ready.');
          preloadProductFrames('C', null, () => {
            console.log('[System] Product C 2K Frames Ready.');
            preloadProductFrames('D', null, () => {
              console.log('[System] Product D 2K Frames Ready.');
            });
          });
        });
      }, 300);
    });
  };

  // Start Cinematic Intro
  const startCinematicIntro = (productKey) => {
    isIntroPlaying = true;
    introStartTime = performance.now();
    document.body.classList.add('intro-active');

    if (introHud) {
      introHud.classList.remove('hidden');
    }
    if (introTagText && PRODUCTS_CONFIG[productKey]) {
      introTagText.innerText = PRODUCTS_CONFIG[productKey].introTag;
    }

    revealElements.forEach((el) => {
      el.classList.remove('is-revealed');
    });

    window.scrollTo({ top: 0, behavior: 'auto' });
    targetScrollY = 0;
    smoothScrollY = 0;

    playProductAudio(productKey);
    productIntroPlayed[productKey] = true;
  };

  // Finish Intro & Reveal UI
  const completeIntro = () => {
    if (!isIntroPlaying) return;
    isIntroPlaying = false;
    stopAudio();

    if (introHud) introHud.classList.add('hidden');

    document.body.classList.remove('intro-active');
    window.scrollTo({ top: 0, behavior: 'auto' });
    targetScrollY = 0;
    smoothScrollY = 0;

    revealElements.forEach((el, index) => {
      setTimeout(() => {
        el.classList.add('is-revealed');
      }, index * 180 + 80);
    });
  };

  // Toggle SAO Menu on Click
  const toggleSaoMenu = () => {
    if (!saoMenuWrapper) return;
    saoMenuWrapper.classList.toggle('is-open');
  };

  // Close SAO Menu
  const closeSaoMenu = () => {
    if (saoMenuWrapper) saoMenuWrapper.classList.remove('is-open');
  };

  // Switch Active Product
  const switchProduct = (productKey) => {
    if (!PRODUCTS_CONFIG[productKey]) return;
    currentProductKey = productKey;
    lastDrawnIndex = -1;

    preloadProductFrames(productKey);

    saoItemCards.forEach((card) => {
      card.classList.toggle('active', card.getAttribute('data-product') === productKey);
    });

    const data = PRODUCTS_CONFIG[productKey];
    if (saoTriggerLabel) saoTriggerLabel.innerText = data.label;

    setTimeout(() => {
      closeSaoMenu();
    }, 180);

    if (navBrandText) navBrandText.innerHTML = `${data.brand}`;
    if (heroKicker) heroKicker.innerText = data.heroKicker;
    if (heroTitle) heroTitle.innerHTML = `${data.heroTitle}`;
    if (heroDesc) heroDesc.innerText = data.heroDesc;

    if (sec1Kicker) sec1Kicker.innerText = data.sec1Kicker;
    if (sec1Title) sec1Title.innerText = data.sec1Title;
    if (sec1Desc) sec1Desc.innerText = data.sec1Desc;
    if (spec1Val) spec1Val.innerText = data.spec1Val;
    if (spec1Lbl) spec1Lbl.innerText = data.spec1Lbl;
    if (spec2Val) spec2Val.innerText = data.spec2Val;
    if (spec2Lbl) spec2Lbl.innerText = data.spec2Lbl;

    if (sec2Kicker) sec2Kicker.innerText = data.sec2Kicker;
    if (sec2Title) sec2Title.innerText = data.sec2Title;
    if (sec2Desc) sec2Desc.innerText = data.sec2Desc;
    if (spec3Val) spec3Val.innerText = data.spec3Val;
    if (spec3Lbl) spec3Lbl.innerText = data.spec3Lbl;
    if (spec4Val) spec4Val.innerText = data.spec4Val;
    if (spec4Lbl) spec4Lbl.innerText = data.spec4Lbl;

    if (sec3Kicker) sec3Kicker.innerText = data.sec3Kicker;
    if (sec3Title) sec3Title.innerText = data.sec3Title;
    if (sec3Desc) sec3Desc.innerText = data.sec3Desc;
    if (spec5Val) spec5Val.innerText = data.spec5Val;
    if (spec5Lbl) spec5Lbl.innerText = data.spec5Lbl;
    if (spec6Val) spec6Val.innerText = data.spec6Val;
    if (spec6Lbl) spec6Lbl.innerText = data.spec6Lbl;

    if (sec4Kicker) sec4Kicker.innerText = data.sec4Kicker;
    if (sec4Title) sec4Title.innerText = data.sec4Title;
    if (sec4Desc) sec4Desc.innerText = data.sec4Desc;
    if (spec7Val) spec7Val.innerText = data.spec7Val;
    if (spec7Lbl) spec7Lbl.innerText = data.spec7Lbl;
    if (spec8Val) spec8Val.innerText = data.spec8Val;
    if (spec8Lbl) spec8Lbl.innerText = data.spec8Lbl;

    if (finaleKicker) finaleKicker.innerText = data.finaleKicker;
    if (finaleTitle) finaleTitle.innerText = data.finaleTitle;

    // Update Ambient Glow for selected product
    const enhancement = PRODUCT_ENHANCEMENTS[productKey];
    if (enhancement && ambientGlow) {
      ambientGlow.style.background = enhancement.glow;
    }

    if (!productIntroPlayed[productKey]) {
      startCinematicIntro(productKey);
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      renderFrame();
    }
  };

  // Draw current frame
  const renderFrame = () => {
    const currentCache = productFrameCaches[currentProductKey] || productFrameCaches['A'];
    if (!currentCache.length) return;

    let floatFrame = 0;

    if (isIntroPlaying) {
      let introProgress = 0;

      if (currentAudio && !currentAudio.paused && currentAudio.duration > 0) {
        introProgress = Math.min(1, Math.max(0, currentAudio.currentTime / VIDEO_DURATION));
      } else {
        const now = performance.now();
        const elapsed = (now - introStartTime) / 1000;
        introProgress = Math.min(1, Math.max(0, elapsed / INTRO_DURATION));
      }

      floatFrame = introProgress * (TOTAL_FRAMES - 1);

      if (introProgress >= 1 || (currentAudio && currentAudio.ended)) {
        completeIntro();
      }
    } else {
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const scrollProgress = docHeight > 0 ? Math.min(1, Math.max(0, smoothScrollY / docHeight)) : 0;

      floatFrame = scrollProgress * (TOTAL_FRAMES - 1);
    }

    const frameBase = Math.floor(floatFrame);
    const frameNext = Math.min(TOTAL_FRAMES - 1, frameBase + 1);
    const frameSubAlpha = floatFrame - frameBase; // Sub-frame interpolation fraction [0..1]

    const imgCurrent = currentCache[frameBase] || productFrameCaches['A'][frameBase];
    const imgNext = currentCache[frameNext] || productFrameCaches['A'][frameNext];

    if (!imgCurrent || !imgCurrent.complete || imgCurrent.naturalWidth === 0) return;

    const canvasW = window.innerWidth;
    const canvasH = window.innerHeight;
    const imgW = imgCurrent.naturalWidth;
    const imgH = imgCurrent.naturalHeight;

    const scale = Math.max(canvasW / imgW, canvasH / imgH);
    const drawW = imgW * scale;
    const drawH = imgH * scale;
    const drawX = (canvasW - drawW) / 2;
    const drawY = (canvasH - drawH) / 2;

    // Reset base canvas
    ctx.fillStyle = '#f6f8fa';
    ctx.fillRect(0, 0, canvasW, canvasH);

    // Draw primary base frame (100% Sharp)
    ctx.globalAlpha = 1.0;
    ctx.drawImage(imgCurrent, drawX, drawY, drawW, drawH);

    // If in motion and next frame is ready, cross-fade sub-frame at 60Hz+ with precise alpha
    if (frameSubAlpha > 0.04 && imgNext && imgNext.complete && imgNext.naturalWidth > 0 && frameBase !== frameNext) {
      ctx.globalAlpha = frameSubAlpha;
      ctx.drawImage(imgNext, drawX, drawY, drawW, drawH);
      ctx.globalAlpha = 1.0; // Reset
    }
  };

  // Update Telemetry & Timeline
  const updateScrollytelling = () => {
    if (isIntroPlaying) return;

    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    const scrollProgress = docHeight > 0 ? Math.min(1, Math.max(0, smoothScrollY / docHeight)) : 0;

    const currentTime = (scrollProgress * VIDEO_DURATION).toFixed(1);
    const angle = Math.round(scrollProgress * 360);

    if (orbitAngleDisplay) {
      orbitAngleDisplay.innerText = `${currentTime}s / ${angle}°`;
    }

    if (timelineFill) {
      timelineFill.style.width = `${scrollProgress * 100}%`;
    }
  };

  // Main Render Loop
  const animationLoop = () => {
    if (!isIntroPlaying) {
      smoothScrollY = lerp(smoothScrollY, targetScrollY, 0.08);
      if (Math.abs(smoothScrollY - targetScrollY) < 0.1) {
        smoothScrollY = targetScrollY;
      }
    }

    renderFrame();
    updateScrollytelling();

    requestAnimationFrame(animationLoop);
  };

  // Audio Toggle Button Listener
  if (audioToggleBtn) {
    audioToggleBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      isMuted = !isMuted;
      currentAudio.muted = isMuted;

      if (isMuted) {
        audioToggleBtn.classList.add('muted');
        if (audioStatusLabel) audioStatusLabel.innerText = 'AUDIO OFF';
      } else {
        audioToggleBtn.classList.remove('muted');
        if (audioStatusLabel) audioStatusLabel.innerText = 'AUDIO ON';
        if (isIntroPlaying) {
          currentAudio.play().catch(() => {});
        }
      }
    });
  }

  // SAO Trigger Button Click Listener (with Sound Effect)
  if (saoTriggerBtn) {
    saoTriggerBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      playSfx(sfxOpen);
      toggleSaoMenu();
    });
  }

  // Close SAO Menu when clicking outside
  document.addEventListener('click', (e) => {
    if (saoMenuWrapper && !saoMenuWrapper.contains(e.target)) {
      closeSaoMenu();
    }
  });

  // Event Listeners for SAO Product Items (with Confirmation Sound Effect)
  saoItemCards.forEach((card) => {
    card.addEventListener('click', (e) => {
      e.stopPropagation();
      playSfx(sfxClick);
      const prodKey = card.getAttribute('data-product');
      switchProduct(prodKey);
    });
  });

  // Skip Intro Button Event
  if (skipIntroBtn) {
    skipIntroBtn.addEventListener('click', () => {
      completeIntro();
    });
  }

  // Any Click anywhere unlocks audio automatically
  window.addEventListener('click', () => {
    if (!audioUnlocked && isIntroPlaying) {
      currentAudio.play().then(() => {
        audioUnlocked = true;
      }).catch(() => {});
    }
  }, { once: true });

  // Scroll Listener
  window.addEventListener('scroll', () => {
    if (!isIntroPlaying) {
      targetScrollY = window.scrollY || window.pageYOffset || 0;
    }
  }, { passive: true });

  window.addEventListener('resize', resizeCanvas);

  // Smooth Nav links
  document.querySelectorAll('.nav-item').forEach((link) => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const href = link.getAttribute('href');
      const targetEl = document.querySelector(href);
      if (targetEl) {
        targetEl.scrollIntoView({ behavior: 'smooth' });
      }
    });
  });

  // Init
  resizeCanvas();
  initApp();
  requestAnimationFrame(animationLoop);
})();
