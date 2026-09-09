/**
 * Belton Technology Group - 3D Smart Factory Digital Twin
 * Navanakorn Plant · 2nd Floor
 * Pure Blender GLB Engine (Zero Redundant Procedural Code)
 * Single Source of Truth: models/belton_factory_cleanroom_full.glb
 */

(function() {
  'use strict';

  let scene, camera, renderer;
  let isPointerLocked = false;
  let prevTime = performance.now();
  let factoryModel = null;
  let isModelLoaded = false;
  let isReloadingModel = false;
  let lastModelMtime = null;

  // Collision bounding boxes for physical boundaries (Cleared for free exploration in new Blender GLB model)
  const wallColliders = [];

  // Player state
  const EYE_HEIGHT = 1.7;
  const playerPos = new THREE.Vector3(20.0, EYE_HEIGHT, 48.0); // Spawn directly in central aisle facing 50 dispensing machines
  const euler = new THREE.Euler(0, 0, 0, 'YXZ'); // Facing North looking directly down aisle at machines
  const moveDir = new THREE.Vector3();
  let walkTime = 0;
  let canStep = true;
  let isMoving = false;

  const keys = {
    KeyW: false, KeyA: false, KeyS: false, KeyD: false,
    ArrowUp: false, ArrowLeft: false, ArrowDown: false, ArrowRight: false,
    ShiftLeft: false, ShiftRight: false
  };

  // Tour Goals & Zones
  const TOUR_ZONES = [
    { id: 'east_highway', name: 'EAST HIGHWAY PROMENADE', minX: 42.0, maxX: 49.0, minZ: -28.0, maxZ: 55.0, visited: false },
    { id: 'apfa_hall', name: 'APFA AUTOMATION HALL', minX: 1.0, maxX: 42.0, minZ: -22.0, maxZ: 30.0, visited: false },
    { id: 'qa_lines', name: 'QA 8-LINE INSPECTION FACILITY', minX: 49.0, maxX: 86.0, minZ: -25.0, maxZ: 30.0, visited: false },
    { id: 'north_highway', name: 'NORTH HIGHWAY CONNECTOR', minX: -75.0, maxX: 45.0, minZ: -29.0, maxZ: -23.0, visited: false },
    { id: 'central_promenade', name: 'CENTRAL PROMENADE AISLE', minX: -4.0, maxX: 2.0, minZ: -25.0, maxZ: 40.0, visited: false },
    { id: 'cnc_machining', name: 'PRECISION CNC MACHINING CENTER', minX: -45.0, maxX: -15.0, minZ: -10.0, maxZ: 32.0, visited: false },
    { id: 'aoi_cluster', name: 'AOI 3D OPTICAL INSPECTION', minX: -95.0, maxX: -68.0, minZ: -30.0, maxZ: 15.0, visited: false },
    { id: 'scada_suite', name: 'SCADA MASTER CONTROL SUITE', minX: 55.0, maxX: 92.0, minZ: 36.0, maxZ: 54.0, visited: false },
    { id: 'dispensing_hall', name: 'ACA EPOXY DISPENSING HALL (50 UNITS)', minX: 2.0, maxX: 43.0, minZ: 29.5, maxZ: 48.0, visited: false }
  ];

  let visitedCount = 0;

  // =========================================================================
  // WEB AUDIO (AUTHENTIC CLEANROOM HUM & FOOTSTEPS)
  // =========================================================================
  let audioCtx = null;
  let isAudioEnabled = true;
  let humGain = null;
  let airGain = null;

  function initAudio() {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return;
      audioCtx = new AudioContext();

      const humOsc = audioCtx.createOscillator();
      humOsc.type = 'sine';
      humOsc.frequency.setValueAtTime(58, audioCtx.currentTime);

      const humSub = audioCtx.createOscillator();
      humSub.type = 'sine';
      humSub.frequency.setValueAtTime(116, audioCtx.currentTime);

      humGain = audioCtx.createGain();
      humGain.gain.setValueAtTime(0.04, audioCtx.currentTime);

      humOsc.connect(humGain);
      humSub.connect(humGain);

      // Laminar flow hiss
      const bufferSize = audioCtx.sampleRate * 2;
      const noiseBuffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
      }
      const whiteNoise = audioCtx.createBufferSource();
      whiteNoise.buffer = noiseBuffer;
      whiteNoise.loop = true;

      const airFilter = audioCtx.createBiquadFilter();
      airFilter.type = 'bandpass';
      airFilter.frequency.setValueAtTime(850, audioCtx.currentTime);
      airFilter.Q.setValueAtTime(1.2, audioCtx.currentTime);

      airGain = audioCtx.createGain();
      airGain.gain.setValueAtTime(0.02, audioCtx.currentTime);

      whiteNoise.connect(airFilter);
      airFilter.connect(airGain);

      humGain.connect(audioCtx.destination);
      airGain.connect(audioCtx.destination);

      humOsc.start();
      humSub.start();
      whiteNoise.start();
    } catch (e) {}
  }

  function playStepSound() {
    if (!audioCtx || !isAudioEnabled || audioCtx.state !== 'running') return;
    try {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(180, audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(45, audioCtx.currentTime + 0.08);

      gain.gain.setValueAtTime(0.035, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.08);

      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.09);
    } catch (e) {}
  }

  function toggleAudio() {
    isAudioEnabled = !isAudioEnabled;
    const btn = document.getElementById('btnAudioToggle');
    const txt = document.getElementById('audioBtnText');
    if (audioCtx) {
      if (isAudioEnabled) {
        if (audioCtx.state === 'suspended') audioCtx.resume();
        if (humGain) humGain.gain.setValueAtTime(0.04, audioCtx.currentTime);
        if (airGain) airGain.gain.setValueAtTime(0.02, audioCtx.currentTime);
        if (btn) btn.classList.add('active');
        if (txt) txt.textContent = 'AUDIO ON';
      } else {
        if (humGain) humGain.gain.setValueAtTime(0.0, audioCtx.currentTime);
        if (airGain) airGain.gain.setValueAtTime(0.0, audioCtx.currentTime);
        if (btn) btn.classList.remove('active');
        if (txt) txt.textContent = 'AUDIO OFF';
      }
    }
  }

  // =========================================================================
  // TOAST NOTIFICATIONS
  // =========================================================================
  function showToast(title, desc) {
    const toast = document.getElementById('liveSyncToast');
    const tTitle = document.getElementById('toastTitle');
    const tDesc = document.getElementById('toastDesc');
    if (!toast) return;
    if (tTitle) tTitle.textContent = title;
    if (tDesc) tDesc.textContent = desc;
    toast.classList.remove('is-hidden');
    clearTimeout(toast.__timer);
    toast.__timer = setTimeout(() => {
      toast.classList.add('is-hidden');
    }, 4500);
  }

  // =========================================================================
  // 3D GLB MASTER LOADER WITH REAL-TIME PROGRESS BAR
  // =========================================================================
  function loadFullFactoryGLB(onComplete) {
    if (isReloadingModel) return;
    isReloadingModel = true;

    const fillBar = document.getElementById('modelLoadingBarFill');
    const percentTxt = document.getElementById('loadingPercentText');
    const statusTxt = document.getElementById('loadingStatusText');
    const startBtn = document.getElementById('btnStartWalk');
    const locTag = document.getElementById('currentRoomTitle');

    if (statusTxt) statusTxt.textContent = 'DOWNLOADING BLENDER MODEL...';
    if (locTag) locTag.textContent = 'DOWNLOADING FACTORY 3D MODEL...';

    const loader = new THREE.GLTFLoader();
    const modelUrl = 'models/belton_factory_cleanroom_full.glb?v=' + Date.now();

    loader.load(
      modelUrl,
      (gltf) => {
        // Remove previous model if hot-reloading
        if (factoryModel) {
          scene.remove(factoryModel);
          factoryModel.traverse(node => {
            if (node.geometry) node.geometry.dispose();
            if (node.material) {
              if (Array.isArray(node.material)) node.material.forEach(m => m.dispose());
              else node.material.dispose();
            }
          });
        }

        factoryModel = gltf.scene;
        factoryModel.name = 'Belton_Factory_Master_GLB';

        // Enhance materials, shadows, and glass transparency
        factoryModel.traverse(child => {
          if (child.isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;

            const mats = Array.isArray(child.material) ? child.material : [child.material];
            mats.forEach(m => {
              if (!m) return;
              const mName = (m.name || '').toLowerCase();
              const cName = (child.name || '').toLowerCase();
              const isGlass = mName.includes('glass') || mName.includes('window') || 
                              mName.startsWith('material_10') || mName.includes('material_10.') ||
                              cName.includes('glass') || cName.includes('window');

              if (isGlass) {
                m.transparent = true;
                m.opacity = 0.30;
                m.roughness = 0.05;
                m.metalness = 0.2;
                if (m.color) m.color.setHex(0xcce7ff); // cool cleanroom architectural tint
                m.depthWrite = false;
              }
            });
          }
        });

        scene.add(factoryModel);
        isModelLoaded = true;
        isReloadingModel = false;
        initMachineAnimations();
        initDispensingStation();

        // Update UI
        if (fillBar) fillBar.style.width = '100%';
        if (percentTxt) percentTxt.textContent = '100%';
        if (statusTxt) statusTxt.textContent = 'FACTORY 3D MODEL READY (100%)';
        if (startBtn) {
          startBtn.disabled = false;
          startBtn.textContent = 'ENTER CLEANROOM (CLICK)';
          startBtn.classList.add('ready');
        }

        showToast('⚡ MODEL LOADED', 'Loaded complete factory GLB from Blender (~25 MB)');
        updateLocationHUD();
        if (onComplete) onComplete();
      },
      (xhr) => {
        if (xhr.lengthComputable) {
          const percent = Math.min(Math.round((xhr.loaded / xhr.total) * 100), 99);
          const loadedMB = (xhr.loaded / (1024 * 1024)).toFixed(1);
          const totalMB = (xhr.total / (1024 * 1024)).toFixed(1);

          if (fillBar) fillBar.style.width = percent + '%';
          if (percentTxt) percentTxt.textContent = percent + '%';
          if (statusTxt) statusTxt.textContent = 'DOWNLOADING MODEL: ' + loadedMB + ' / ' + totalMB + ' MB (' + percent + '%)';
          if (startBtn) startBtn.textContent = 'LOADING MODEL (' + percent + '%)...';
        }
      },
      (err) => {
        console.error('Failed to load factory GLB:', err);
        isReloadingModel = false;
        if (statusTxt) statusTxt.textContent = '⚠️ FAILED TO LOAD GLB (CHECK CONNECTION)';
        showToast('⚠️ ERROR', 'Could not load factory GLB from server');
      }
    );
  }

  // Live Watcher for Blender auto-reloads
  function startBlenderWatchLoop() {
    setInterval(async () => {
      if (isReloadingModel) return;
      try {
        const res = await fetch('/api/model-status');
        if (!res.ok) return;
        const data = await res.json();
        if (data.exists && data.mtime) {
          if (lastModelMtime === null) {
            lastModelMtime = data.mtime;
          } else if (data.mtime !== lastModelMtime) {
            console.log('⚡ New export from Blender detected! Live reloading...', data.mtime);
            lastModelMtime = data.mtime;
            loadFullFactoryGLB();
          }
        }
      } catch (e) {}
    }, 2000);
  }

  // =========================================================================
  // LIGHTING SETUP (CLEANROOM ARCHITECTURAL SPEC)
  // =========================================================================
  function setupLighting() {
    // Soft cool-white ambient fill
    const ambientLight = new THREE.AmbientLight(0xdbeafe, 0.85);
    scene.add(ambientLight);

    // Ground bounce hemisphere light
    const hemiLight = new THREE.HemisphereLight(0xffffff, 0x1e293b, 0.45);
    scene.add(hemiLight);

    // Main cleanroom directional light with soft shadow mapping
    const dirLight1 = new THREE.DirectionalLight(0xffffff, 1.35);
    dirLight1.position.set(35, 45, 20);
    dirLight1.castShadow = true;
    dirLight1.shadow.mapSize.width = 2048;
    dirLight1.shadow.mapSize.height = 2048;
    dirLight1.shadow.camera.near = 1.0;
    dirLight1.shadow.camera.far = 160;
    dirLight1.shadow.camera.left = -90;
    dirLight1.shadow.camera.right = 90;
    dirLight1.shadow.camera.top = 70;
    dirLight1.shadow.camera.bottom = -70;
    dirLight1.shadow.bias = -0.0004;
    scene.add(dirLight1);

    // Secondary fill light for uniform cleanroom luminescence
    const dirLight2 = new THREE.DirectionalLight(0xa5f3fc, 0.55);
    dirLight2.position.set(-35, 35, -20);
    scene.add(dirLight2);
  }

  // =========================================================================
  // COLLISION DETECTION & PHYSICS
  // =========================================================================
  function checkCollision(px, pz, radius) {
    if (radius === undefined) radius = 0.45;
    for (let i = 0; i < wallColliders.length; i++) {
      const c = wallColliders[i];
      if (
        px + radius >= c.minX &&
        px - radius <= c.maxX &&
        pz + radius >= c.minZ &&
        pz - radius <= c.maxZ
      ) {
        return true;
      }
    }
    return false;
  }

  // =========================================================================
  // PLAYER MOVEMENT & CAMERA SYSTEM
  // =========================================================================
  function updatePlayer(delta) {
    if (!isPointerLocked) return;

    const forward = (keys.KeyW || keys.ArrowUp ? 1 : 0) - (keys.KeyS || keys.ArrowDown ? 1 : 0);
    const side = (keys.KeyD || keys.ArrowRight ? 1 : 0) - (keys.KeyA || keys.ArrowLeft ? 1 : 0);

    isMoving = forward !== 0 || side !== 0;
    const isSprinting = keys.ShiftLeft || keys.ShiftRight;
    const speed = isSprinting ? 9.5 : 5.2;

    if (isMoving) {
      moveDir.set(side, 0, -forward).normalize();
      moveDir.applyEuler(new THREE.Euler(0, euler.y, 0));

      const stepDist = speed * delta;
      const nextX = playerPos.x + moveDir.x * stepDist;
      const nextZ = playerPos.z + moveDir.z * stepDist;

      // Check collision on X and Z axes independently for smooth wall-sliding
      if (!checkCollision(nextX, playerPos.z)) {
        playerPos.x = nextX;
      }
      if (!checkCollision(playerPos.x, nextZ)) {
        playerPos.z = nextZ;
      }

      // Footstep sound cadence
      walkTime += delta * (isSprinting ? 14 : 9);
      if (Math.sin(walkTime) > 0.92 && canStep) {
        playStepSound();
        canStep = false;
      } else if (Math.sin(walkTime) <= 0) {
        canStep = true;
      }

      updateLocationHUD();
      checkTourProgress();
    }

    camera.position.set(playerPos.x, EYE_HEIGHT, playerPos.z);
  }

  // =========================================================================
  // LOCATION HUD & TOUR OBJECTIVE SYSTEM
  // =========================================================================
  function getCurrentRoom() {
    const x = playerPos.x;
    const z = playerPos.z;

    for (let i = 0; i < TOUR_ZONES.length; i++) {
      const zInfo = TOUR_ZONES[i];
      if (x >= zInfo.minX && x <= zInfo.maxX && z >= zInfo.minZ && z <= zInfo.maxZ) {
        return zInfo.name;
      }
    }
    return 'NAVANAKORN 2F CLEANROOM';
  }

  function updateLocationHUD() {
    const locTag = document.getElementById('currentRoomTitle');
    if (locTag) locTag.textContent = getCurrentRoom();
  }

  function checkTourProgress() {
    const x = playerPos.x;
    const z = playerPos.z;

    TOUR_ZONES.forEach(zone => {
      if (!zone.visited && x >= zone.minX && x <= zone.maxX && z >= zone.minZ && z <= zone.maxZ) {
        zone.visited = true;
        visitedCount++;

        const counter = document.getElementById('goalCounter');
        const fill = document.getElementById('goalBarFill');
        const msg = document.getElementById('goalStatusMsg');

        if (counter) counter.textContent = visitedCount + ' / ' + TOUR_ZONES.length + ' ZONES';
        if (fill) fill.style.width = ((visitedCount / TOUR_ZONES.length) * 100) + '%';
        if (msg) msg.textContent = 'VERIFIED: ' + zone.name;

        if (visitedCount === TOUR_ZONES.length) {
          const banner = document.getElementById('tourCompleteBanner');
          if (banner) banner.classList.remove('is-hidden');
        }
      }
    });
  }

  // =========================================================================
  // RADAR MINI-MAP (2F BLUEPRINT HUD)
  // =========================================================================
  let radarCanvas, radarCtx;

  function initMiniMap() {
    radarCanvas = document.getElementById('miniMapCanvas');
    if (!radarCanvas) return;
    radarCtx = radarCanvas.getContext('2d');
  }

  function drawRadar() {
    if (!radarCtx) return;
    const w = radarCanvas.width;
    const h = radarCanvas.height;

    radarCtx.fillStyle = '#060d19';
    radarCtx.fillRect(0, 0, w, h);

    function mapX(x) { return ((x + 105) / 210) * w; }
    function mapZ(z) { return ((z + 65) / 130) * h; }

    // Outer perimeter outline
    radarCtx.strokeStyle = '#1e293b';
    radarCtx.lineWidth = 1.0;
    radarCtx.strokeRect(mapX(-95), mapZ(-30), (190 / 210) * w, (85 / 130) * h);

    // East Highway walkway (Green)
    radarCtx.fillStyle = 'rgba(16, 185, 129, 0.35)';
    radarCtx.fillRect(mapX(43.5), mapZ(-28), (5 / 210) * w, (75 / 130) * h);

    // QA Aisle (Green)
    radarCtx.fillRect(mapX(48), mapZ(0.5), (36 / 210) * w, (4 / 130) * h);

    // Player position dot (Yellow)
    const px = mapX(playerPos.x);
    const pz = mapZ(playerPos.z);

    radarCtx.fillStyle = '#facc15';
    radarCtx.beginPath();
    radarCtx.arc(px, pz, 3.5, 0, Math.PI * 2);
    radarCtx.fill();

    // Direction arrow cone
    const lookDist = 7;
    radarCtx.strokeStyle = '#ffffff';
    radarCtx.lineWidth = 1.5;
    radarCtx.beginPath();
    radarCtx.moveTo(px, pz);
    radarCtx.lineTo(px - Math.sin(euler.y) * lookDist, pz - Math.cos(euler.y) * lookDist);
    radarCtx.stroke();

    const coordsEl = document.getElementById('minimapCoords');
    if (coordsEl) coordsEl.innerText = 'X: ' + playerPos.x.toFixed(1) + ' · Z: ' + playerPos.z.toFixed(1);
  }

  // =========================================================================
  // INITIALIZATION & EVENT LISTENERS
  // =========================================================================
  function init() {
    const canvas = document.getElementById('factoryCanvas');

    scene = new THREE.Scene();
    scene.name = 'Belton_Smart_Factory_Master';
    scene.background = new THREE.Color(0x0c1427);
    scene.fog = new THREE.FogExp2(0x0c1427, 0.003);
    window.__factoryScene = scene;

    const width = window.innerWidth;
    const height = window.innerHeight;

    camera = new THREE.PerspectiveCamera(65, width / height, 0.1, 400);
    camera.position.copy(playerPos);
    camera.quaternion.setFromEuler(euler);

    renderer = new THREE.WebGLRenderer({
      canvas: canvas,
      antialias: true,
      powerPreference: 'high-performance'
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;

    setupLighting();
    initMiniMap();

    // Load Master GLB Model directly from Blender
    loadFullFactoryGLB();
    startBlenderWatchLoop();

    setupEventListeners();
    initDispensingStation();
    setupDispensingUI();
    window.addEventListener('resize', onWindowResize);
    requestAnimationFrame(animate);
  }

  function setupEventListeners() {
    const canvas = document.getElementById('factoryCanvas');
    const overlay = document.getElementById('fpsStartOverlay');
    const startBtn = document.getElementById('btnStartWalk');

    function enterWalkthrough() {
      if (overlay) overlay.classList.add('is-hidden');
      initAudio();
      try {
        canvas.requestPointerLock();
      } catch (e) {
        console.warn('Pointer lock request error:', e);
      }
    }

    if (startBtn) {
      startBtn.disabled = false;
      startBtn.classList.add('ready');
      startBtn.textContent = 'ENTER CLEANROOM TOUR (CLICK)';
      startBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        enterWalkthrough();
      });
    }

    // Allow clicking the overlay backdrop to resume
    if (overlay) {
      overlay.addEventListener('click', (e) => {
        enterWalkthrough();
      });
    }

    // Re-lock mouse when clicking canvas if unlocked
    canvas.addEventListener('click', () => {
      if (!isPointerLocked && !isDispensingModalOpen) {
        const logoutModal = document.getElementById('logoutConfirmModal');
        const isLoggingOut = logoutModal && (logoutModal.classList.contains('is-active') || logoutModal.classList.contains('is-open'));
        if (!isLoggingOut) {
          enterWalkthrough();
        }
      }
    });

    document.addEventListener('pointerlockchange', () => {
      isPointerLocked = document.pointerLockElement === canvas;
      const reticle = document.getElementById('fpsReticle');
      if (reticle) reticle.style.opacity = isPointerLocked ? '1' : '0';

      if (!isPointerLocked) {
        Object.keys(keys).forEach(k => keys[k] = false);

        // When pointer lock is released (e.g. user pressed ESC), show pause/resume menu overlay
        const logoutModal = document.getElementById('logoutConfirmModal');
        const isLoggingOut = logoutModal && (logoutModal.classList.contains('is-active') || logoutModal.classList.contains('is-open'));
        if (!isLoggingOut && !isDispensingModalOpen && overlay) {
          overlay.classList.remove('is-hidden');
          if (startBtn) {
            startBtn.textContent = 'RESUME CLEANROOM TOUR (CLICK)';
          }
        }
      }
    });

    document.addEventListener('mousemove', (e) => {
      if (!isPointerLocked) return;
      const sensitivity = 0.0022;
      euler.y -= e.movementX * sensitivity;
      euler.x -= e.movementY * sensitivity;
      euler.x = Math.max(-Math.PI / 2.3, Math.min(Math.PI / 2.3, euler.x));
      camera.quaternion.setFromEuler(euler);
    });

    window.addEventListener('keydown', (e) => {
      if (keys.hasOwnProperty(e.code)) keys[e.code] = true;
    });

    window.addEventListener('keyup', (e) => {
      if (keys.hasOwnProperty(e.code)) keys[e.code] = false;
    });

    const audioBtn = document.getElementById('btnAudioToggle');
    if (audioBtn) audioBtn.addEventListener('click', toggleAudio);

    // Logout Modal
    const logoutBtn = document.getElementById('factoryLogoutBtn');
    const logoutModal = document.getElementById('logoutConfirmModal');
    const cancelLogout = document.getElementById('cancelLogoutBtn');
    const confirmLogout = document.getElementById('confirmLogoutBtn');

    if (logoutBtn && logoutModal) {
      logoutBtn.addEventListener('click', () => {
        document.exitPointerLock();
        logoutModal.classList.add('is-active');
        logoutModal.setAttribute('aria-hidden', 'false');
      });
    }
    if (cancelLogout && logoutModal) {
      cancelLogout.addEventListener('click', () => {
        logoutModal.classList.remove('is-active');
        logoutModal.setAttribute('aria-hidden', 'true');
      });
    }
    if (confirmLogout) {
      confirmLogout.addEventListener('click', () => {
        window.location.href = '/';
      });
    }

    // Export GLB button (if user wants to download current scene)
    const exportBtn = document.getElementById('btnExportGLTF');
    const exportBtnOverlay = document.getElementById('btnExportGLTFOverlay');
    [exportBtn, exportBtnOverlay].forEach(b => {
      if (b) {
        b.addEventListener('click', (e) => {
          e.stopPropagation();
          exportFactoryToGLTF();
        });
      }
    });
  }

  // =========================================================================
  // AUTOMATED CLEANROOM MACHINE & ROBOT ANIMATION SYSTEM
  // =========================================================================
  const animatedRobots = [];
  const animatedGantries = [];
  let machineStatusLights = [];

  function initMachineAnimations() {
    animatedRobots.length = 0;
    animatedGantries.length = 0;
    machineStatusLights.length = 0;

    if (!factoryModel) return;

    factoryModel.traverse((node) => {
      const name = (node.name || '');

      // 1. Articulated Industrial Robot Arms in APFA Automation Hall
      // (Target real robot base pivots and arm joints: Scene to Scene.011, LP_Top_low)
      // Strictly EXCLUDE all doors (Node_329, Mesh_238, Mesh_240, Cleanroom_Door)
      const isRobotJoint = (
        name === 'Scene' || (name.startsWith('Scene.') && parseInt(name.replace('Scene.', ''), 10) <= 11) ||
        name.startsWith('LP_Top_low')
      );

      const isDoor = (
        name.includes('329') || name.includes('238') || name.includes('240') ||
        name.includes('246') || name.includes('252') || name.includes('258') ||
        name.toLowerCase().includes('door') || name.toLowerCase().includes('leaf')
      );

      if (isRobotJoint && !isDoor) {
        const isBaseRotator = name.startsWith('Scene');
        animatedRobots.push({
          node: node,
          initialRot: node.rotation.clone(),
          speed: isBaseRotator ? 0.8 + (Math.random() * 0.4) : 1.2 + (Math.random() * 0.5),
          offset: Math.random() * Math.PI * 2,
          range: isBaseRotator ? 0.45 : 0.22,
          axis: isBaseRotator ? 'y' : 'z'
        });
      }

      // 2. Ultrasonic Wash Line Gantries (Mesh_3473, 3479, 3485, 3491, 3497)
      if (name === 'Mesh_3473' || name === 'Mesh_3479' || name === 'Mesh_3485' ||
          name === 'Mesh_3491' || name === 'Mesh_3497') {
        animatedGantries.push({
          node: node,
          initialX: node.position.x,
          speed: 0.5 + (Math.random() * 0.3),
          offset: Math.random() * Math.PI * 2,
          travel: 1.2
        });
      }

      // 3. Machine indicator lights & status beacons (CNC machine_02 and workstations)
      if (name.startsWith('machine_02') || name.includes('Machine') || name.includes('CNC')) {
        if (node.isMesh && node.material) {
          const mat = Array.isArray(node.material) ? node.material[0] : node.material;
          if (mat && mat.emissive) {
            machineStatusLights.push({
              material: mat,
              offset: Math.random() * Math.PI * 2
            });
          }
        }
      }
    });

    console.log(`[Machine Animation] Active: ${animatedRobots.length} robot joints, ${animatedGantries.length} gantries, ${machineStatusLights.length} beacons.`);
  }

  function updateMachineAnimations(delta, t) {
    // 1. Articulated Robot Arm Motions (Smooth Pick & Place cycles)
    for (let i = 0; i < animatedRobots.length; i++) {
      const r = animatedRobots[i];
      const cycle = Math.sin(t * r.speed + r.offset);
      if (r.axis === 'y') {
        r.node.rotation.y = r.initialRot.y + cycle * r.range;
      } else {
        r.node.rotation.x = r.initialRot.x + cycle * r.range * 0.6;
        r.node.rotation.z = r.initialRot.z + Math.cos(t * r.speed * 0.8 + r.offset) * 0.15;
      }
    }

    // 2. Ultrasonic Wash Line Gantry Motion
    for (let i = 0; i < animatedGantries.length; i++) {
      const g = animatedGantries[i];
      g.node.position.x = g.initialX + Math.sin(t * g.speed + g.offset) * g.travel;
    }

    // 3. Machine Running Status Light Pulses (Breathing Green & Active Cyan)
    for (let i = 0; i < machineStatusLights.length; i++) {
      const beacon = machineStatusLights[i];
      const intensity = 0.3 + 0.7 * (0.5 + 0.5 * Math.sin(t * 3.0 + beacon.offset));
      beacon.material.emissive.setRGB(0, intensity * 0.6, intensity * 0.4);
    }
  }

  // =========================================================================
  // ACA LINE AI EPOXY DISPENSING DIGITAL TWIN (BELTON SLIDES 26-29)
  // 50-UNIT CLEANROOM DISPENSING FACILITY (INDEPENDENT DATA ENGINE & SCADA DASHBOARD)
  // =========================================================================
  const TOTAL_DISPENSING_MACHINES = 50;
  const dispensingMachines = [];
  let inspectedMachineIndex = 0; // Currently viewed machine in dashboard
  let nearbyMachineIndex = 0;    // Closest physical machine in 3D
  const DISPENSING_POS = new THREE.Vector3(15.2, 0.0, 44.5); // Hero Machine #01 (Row 5 Col 5)

  let dispensingFacility = null;
  let dispensingWorkcell = null;
  let dispensingNozzle = null;
  let dispensingFilletBead = null;
  let dispensingHoloBadge = null;
  let holoBadgeCanvas = null;
  let holoBadgeCtx = null;
  let holoBadgeTexture = null;
  let digitalPressureCanvas = null;
  let digitalPressureCtx = null;
  let digitalPressureTexture = null;

  let matBeaconOptimal = null;
  let matBeaconWarning = null;
  let matBeaconDanger = null;

  let matAndonRedActive = null;
  let matAndonRedDim = null;
  let matAndonAmberActive = null;
  let matAndonAmberDim = null;
  let matAndonGreenActive = null;
  let matAndonGreenDim = null;
  let matFrontBarOptimal = null;
  let matFrontBarWarning = null;
  let matFrontBarDanger = null;

  let dispensingAiWeights = null;
  let isDispensingModalOpen = false;
  let cleanroomHallTotalShots = 184250;
  let lastTelemetryUiTime = 0;

  function initMachinesData() {
    dispensingMachines.length = 0;
    const rowZs = [32.5, 35.5, 38.5, 41.5, 44.5];
    const leftColsX = [4.0, 6.8, 9.6, 12.4, 15.2];
    const rightColsX = [24.8, 28.5, 32.2, 35.9, 39.6];

    let idx = 0;
    for (let r = 0; r < rowZs.length; r++) {
      const rz = rowZs[r];
      for (let c = 0; c < 10; c++) {
        const isLeft = c < 5;
        const rx = isLeft ? leftColsX[c] : rightColsX[c - 5];
        const machineNum = idx + 1;
        const tag = 'ACA-DISP-' + String(machineNum).padStart(2, '0');
        const wingStr = isLeft ? 'West Wing' : 'East Wing';
        const colStr = isLeft ? `Bay ${c + 1}` : `Bay ${c - 4}`;
        const aisleNear = (c === 4 || c === 5) ? ' · Central Aisle' : '';
        const locDesc = `Row ${r + 1} · ${colStr} (${wingStr})${aisleNear}`;
        const locShort = `R${r + 1}:C${c + 1}`;

        // Realistic cleanroom process parameter variations
        let potLife = (idx * 17) % 115 + 12.0;            // 12 to 127 mins
        let preheat = 60.0 + ((idx * 7) % 5 - 2) * 0.45;  // 59.1 to 60.9 °C
        let ambTemp = 22.0 + ((idx * 3) % 4 - 1.5) * 0.3; // 21.55 to 22.45 °C
        let humidity = 45.0 + ((idx * 5) % 5 - 2) * 0.7;  // 43.6 to 46.4 %
        let needleWear = 0.05 + ((idx * 11) % 35) * 0.009;// 0.05 to 0.36 index
        let cycleRate = 20.0 + ((idx * 2) % 5 - 2) * 0.4; // 19.2 to 20.8 cpm
        let batchCycles = 3400 + ((idx * 43) % 1200);     // 3400 to 4550 shots today
        let statusClass = 'status-optimal';
        let statusLabel = '● PASS 100% (NOMINAL)';
        let nextMaint = `In ~${Math.round(48 - needleWear * 35)} hrs`;

        // Specific Industrial Scenarios (Diverse Factory Conditions)
        if (machineNum === 14) {
          // Machine #14: High epoxy viscosity (Batch nearing pot-life limit)
          potLife = 148.0;
          preheat = 60.0;
          needleWear = 0.16;
          statusClass = 'status-warning';
          statusLabel = '▲ WARNING: Viscosity Rising (Pot-Life 148 min)';
          nextMaint = 'Syringe Replacement in ~15 mins';
        } else if (machineNum === 38) {
          // Machine #38: Thermal drift on pre-heat plate
          potLife = 138.0;
          preheat = 58.1;
          needleWear = 0.22;
          statusClass = 'status-warning';
          statusLabel = '▲ WARNING: Heater Plate Temp Drift 58.1°C';
          nextMaint = 'Inspect Heater Plate';
        } else if (machineNum === 27) {
          // Machine #27: High micro-needle wear / deposit accumulation alert
          potLife = 42.0;
          preheat = 61.5;
          needleWear = 0.79;
          statusClass = 'status-danger';
          statusLabel = '■ CRITICAL ALERT: Needle Wear Exceeded (>75%)';
          nextMaint = 'Immediate Needle Replacement Required';
        }

        dispensingMachines.push({
          index: idx,
          num: machineNum,
          tag: tag,
          row: r + 1,
          col: c + 1,
          locDesc: locDesc,
          locShort: locShort,
          pos: new THREE.Vector3(rx, 0, rz),
          potLifeMin: potLife,
          preheatTempC: preheat,
          ambientTempC: ambTemp,
          humidity: humidity,
          needleWear: needleWear,
          cycleRate: cycleRate,
          batchCycles: batchCycles,
          statusClass: statusClass,
          statusLabel: statusLabel,
          nextMaint: nextMaint,
          currentPressureKpa: 210.0,
          currentVolumeMg: 12.50,
          viscosity: 8500,
          nozzleHealth: '98.0',
          confidence: '99.0',
          goodParts: batchCycles,
          yieldPct: '99.95',
          defectClass: (statusClass === 'status-danger' ? 1 : (statusClass === 'status-warning' ? 2 : 0)),
          mesh: null,
          beacon: null
        });
        idx++;
      }
    }
  }

  function initDispensingStation() {
    initMachinesData();
    createDispensingFacility();
    loadDispensingAiWeights();
  }

  async function loadDispensingAiWeights() {
    try {
      const res = await fetch('models/dispensing_model_weights.json?v=' + Date.now());
      if (res.ok) {
        dispensingAiWeights = await res.json();
        console.log('⚡ [AI Dispensing] Loaded PyTorch edge neural network weights from JSON.');
      }
    } catch (e) {
      console.warn('[AI Dispensing] Using analytical model fallback:', e);
    }
    runAllMachinesAi();
    updateDispensingUI();
    updateHoloBadgeCanvas();
  }

  function evaluateMachineAi(m) {
    const potLife = m.potLifeMin;
    const preheat = m.preheatTempC;
    const ambTemp = m.ambientTempC;
    const hum = m.humidity;
    const wear = m.needleWear;
    const cpm = m.cycleRate;

    // Physical Rheology calculation (Arrhenius + Polymerization kinetics)
    const tempFactor = Math.exp(-0.035 * (preheat - 60.0));
    const timeFactor = Math.exp(0.0055 * potLife);
    const humFactor = 1.0 + 0.002 * (hum - 45.0);
    const viscosity = 8500.0 * tempFactor * timeFactor * humFactor;
    m.viscosity = Math.round(viscosity);

    let predPressure = 210.0 * (viscosity / 8500.0) * (1.0 + 0.45 * wear);

    // Evaluate PyTorch MultiTask Deep Neural Network if weights loaded
    if (dispensingAiWeights && dispensingAiWeights.layers && dispensingAiWeights.stats) {
      try {
        const stats = dispensingAiWeights.stats;
        const L = dispensingAiWeights.layers;
        const raw = [potLife, preheat, ambTemp, hum, wear, cpm];
        const x = raw.map((val, idx) => (val - stats.x_mean[idx]) / stats.x_std[idx]);

        function dense(vec, w, b) {
          const out = new Array(w.length);
          for (let i = 0; i < w.length; i++) {
            let sum = b[i];
            const row = w[i];
            for (let j = 0; j < vec.length; j++) sum += row[j] * vec[j];
            out[i] = sum;
          }
          return out;
        }
        function relu(vec) { return vec.map(v => Math.max(0, v)); }
        function batchnorm(vec, mean, variance, gamma, beta, eps=1e-5) {
          return vec.map((v, i) => (v - mean[i]) / Math.sqrt(variance[i] + eps) * gamma[i] + beta[i]);
        }

        let h = relu(dense(x, L.trunk_0_weight, L.trunk_0_bias));
        h = batchnorm(h, L.trunk_2_running_mean, L.trunk_2_running_var, L.trunk_2_weight, L.trunk_2_bias);
        h = relu(dense(h, L.trunk_3_weight, L.trunk_3_bias));
        h = batchnorm(h, L.trunk_5_running_mean, L.trunk_5_running_var, L.trunk_5_weight, L.trunk_5_bias);
        h = relu(dense(h, L.trunk_6_weight, L.trunk_6_bias));

        const pHidden = relu(dense(h, L.pressure_head_0_weight, L.pressure_head_0_bias));
        const pNorm = dense(pHidden, L.pressure_head_2_weight, L.pressure_head_2_bias)[0];
        predPressure = pNorm * stats.y_reg_std + stats.y_reg_mean;
      } catch (err) {
        console.warn('AI inference fallback:', err);
      }
    }

    m.currentPressureKpa = predPressure;
    m.nozzleHealth = Math.max(0, (1.0 - wear) * 100).toFixed(1);

    if (m.statusClass === 'status-optimal') {
      m.currentVolumeMg = 12.50 + (((m.index * 7) % 9 - 4) * 0.01);
      m.confidence = (99.0 + ((m.index * 3) % 9) * 0.1).toFixed(1);
      m.goodParts = m.batchCycles - Math.min(2, Math.floor(m.index / 20));
      m.yieldPct = ((m.goodParts / m.batchCycles) * 100).toFixed(2);
    } else if (m.statusClass === 'status-warning') {
      m.currentVolumeMg = 12.44;
      m.confidence = '94.6';
      m.goodParts = m.batchCycles - 9;
      m.yieldPct = ((m.goodParts / m.batchCycles) * 100).toFixed(2);
    } else {
      // Danger
      m.currentVolumeMg = 11.28;
      m.confidence = '97.2';
      m.goodParts = m.batchCycles - 26;
      m.yieldPct = ((m.goodParts / m.batchCycles) * 100).toFixed(2);
    }
  }

  function runAllMachinesAi() {
    dispensingMachines.forEach(m => evaluateMachineAi(m));
  }

  function createDispensingFacility() {
    if (dispensingFacility) scene.remove(dispensingFacility);

    dispensingFacility = new THREE.Group();
    dispensingFacility.name = 'ACA_Epoxy_Dispensing_Cleanroom_Facility';

    // Shared Workcell Geometries
    const tableTopGeo = new THREE.BoxGeometry(2.0, 0.12, 1.2);
    const legGeo = new THREE.CylinderGeometry(0.045, 0.045, 0.85, 12);
    const pillarGeo = new THREE.BoxGeometry(0.04, 1.2, 0.04);
    const hoodGeo = new THREE.BoxGeometry(2.0, 0.25, 1.2);
    const backGlassGeo = new THREE.BoxGeometry(1.9, 1.1, 0.02);
    const sideGlassGeo = new THREE.BoxGeometry(0.02, 1.1, 1.1);
    const gantryRailGeo = new THREE.BoxGeometry(1.4, 0.06, 0.08);
    const carriageGeo = new THREE.BoxGeometry(0.12, 0.15, 0.12);
    const syringeTubeGeo = new THREE.CylinderGeometry(0.025, 0.025, 0.22, 12);
    const epoxyFluidGeo = new THREE.CylinderGeometry(0.023, 0.023, 0.16, 12);
    const needleHubGeo = new THREE.CylinderGeometry(0.008, 0.012, 0.025, 10);
    const needleTipGeo = new THREE.CylinderGeometry(0.0018, 0.0018, 0.05, 8);
    const fixtureStageGeo = new THREE.BoxGeometry(0.45, 0.05, 0.35);
    const heaterPlateGeo = new THREE.BoxGeometry(0.3, 0.015, 0.22);
    const eblockArmGeo = new THREE.BoxGeometry(0.18, 0.02, 0.06);
    const coilGeo = new THREE.TorusGeometry(0.06, 0.012, 10, 16, Math.PI);
    const controllerBoxGeo = new THREE.BoxGeometry(0.32, 0.22, 0.28);
    const beaconGeo = new THREE.CylinderGeometry(0.035, 0.035, 0.09, 12);

    // 3-Tier Industrial Andon Stack Light Geometries (Red / Amber / Green)
    const andonPoleGeo = new THREE.CylinderGeometry(0.012, 0.012, 0.32, 10);
    const andonLensGeo = new THREE.CylinderGeometry(0.028, 0.028, 0.055, 12);
    const andonCapGeo = new THREE.CylinderGeometry(0.03, 0.03, 0.015, 12);

    // Front Hood Glow Bar Geometry
    const frontBarGeo = new THREE.BoxGeometry(1.9, 0.045, 0.02);

    // Fillet curve for active dispensing
    const filletCurve = new THREE.CubicBezierCurve3(
      new THREE.Vector3(-0.04, 0.995, 0.07),
      new THREE.Vector3(0.02, 0.995, 0.05),
      new THREE.Vector3(0.06, 0.995, 0.04),
      new THREE.Vector3(0.10, 0.995, 0.06)
    );
    const filletGeo = new THREE.TubeGeometry(filletCurve, 16, 0.0035, 6, false);

    // Shared Materials (Optimized for High FPS WebGL)
    const tableTopMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.25, metalness: 0.4 });
    const legMat = new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.8, roughness: 0.3 });
    const pillarMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.85, roughness: 0.25 });
    const hoodMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.3, metalness: 0.2 });
    const glassMat = new THREE.MeshStandardMaterial({
      color: 0xcce7ff,
      transparent: true,
      opacity: 0.25,
      roughness: 0.08,
      metalness: 0.1,
      depthWrite: false
    });
    const gantryRailMat = new THREE.MeshStandardMaterial({ color: 0x0284c7, metalness: 0.7, roughness: 0.3 });
    const carriageMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, metalness: 0.5, roughness: 0.4 });
    const syringeMat = new THREE.MeshStandardMaterial({ color: 0xffffff, transparent: true, opacity: 0.4, roughness: 0.2, metalness: 0.1 });
    const epoxyMat = new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.15, metalness: 0.1, transparent: true, opacity: 0.85 });
    const needleHubMat = new THREE.MeshStandardMaterial({ color: 0x0284c7, metalness: 0.6, roughness: 0.3 });
    const needleTipMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.95, roughness: 0.1 });
    const fixtureStageMat = new THREE.MeshStandardMaterial({ color: 0x0369a1, metalness: 0.7, roughness: 0.3 });
    const heaterPlateMat = new THREE.MeshStandardMaterial({ color: 0xb45309, metalness: 0.8, roughness: 0.4 });
    const eblockArmMat = new THREE.MeshStandardMaterial({ color: 0xc0c7d0, metalness: 0.9, roughness: 0.2 });
    const coilMat = new THREE.MeshStandardMaterial({ color: 0xd97706, metalness: 0.7, roughness: 0.3 });
    const controllerMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, metalness: 0.4, roughness: 0.5 });
    const staticScreenMat = new THREE.MeshBasicMaterial({ color: 0x0284c7 });
    const filletMat = new THREE.MeshStandardMaterial({ color: 0x34d399, emissive: 0x10b981, emissiveIntensity: 0.9, roughness: 0.2 });

    // Distinct Status Beacon Materials (Green, Amber, Red)
    matBeaconOptimal = new THREE.MeshStandardMaterial({ color: 0x34d399, emissive: 0x10b981, emissiveIntensity: 0.9, roughness: 0.2 });
    matBeaconWarning = new THREE.MeshStandardMaterial({ color: 0xfbbf24, emissive: 0xf59e0b, emissiveIntensity: 1.1, roughness: 0.2 });
    matBeaconDanger  = new THREE.MeshStandardMaterial({ color: 0xf43f5e, emissive: 0xe11d48, emissiveIntensity: 1.3, roughness: 0.2 });

    // Shared Andon Stack Light Materials (Zero per-instance shader compilation overhead!)
    const matAndonPole = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.8, roughness: 0.3 });
    const matAndonCap = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.5 });
    matAndonRedActive   = new THREE.MeshStandardMaterial({ color: 0xf43f5e, emissive: 0xe11d48, emissiveIntensity: 2.4, roughness: 0.2 });
    matAndonRedDim      = new THREE.MeshStandardMaterial({ color: 0x450a0a, roughness: 0.6 });
    matAndonAmberActive = new THREE.MeshStandardMaterial({ color: 0xfbbf24, emissive: 0xf59e0b, emissiveIntensity: 2.0, roughness: 0.2 });
    matAndonAmberDim    = new THREE.MeshStandardMaterial({ color: 0x451a03, roughness: 0.6 });
    matAndonGreenActive = new THREE.MeshStandardMaterial({ color: 0x34d399, emissive: 0x10b981, emissiveIntensity: 1.8, roughness: 0.2 });
    matAndonGreenDim    = new THREE.MeshStandardMaterial({ color: 0x064e3b, roughness: 0.6 });

    // Shared Front Hood Glowing Light Bar Materials
    matFrontBarOptimal = new THREE.MeshStandardMaterial({ color: 0x34d399, emissive: 0x10b981, emissiveIntensity: 1.4, roughness: 0.2 });
    matFrontBarWarning = new THREE.MeshStandardMaterial({ color: 0xfbbf24, emissive: 0xf59e0b, emissiveIntensity: 1.6, roughness: 0.2 });
    matFrontBarDanger  = new THREE.MeshStandardMaterial({ color: 0xf43f5e, emissive: 0xe11d48, emissiveIntensity: 1.8, roughness: 0.2 });

    // Lightweight Laser Spot Material (MeshBasicMaterial = ZERO light uniform overhead!)
    const laserSpotMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
    const laserSpotGeo = new THREE.SphereGeometry(0.005, 6, 6);

    // Cleanroom Floor Markings
    const floorLineMat = new THREE.MeshBasicMaterial({ color: 0xfacc15, depthWrite: false });
    const leftAisleLine = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.005, 14.8), floorLineMat);
    leftAisleLine.position.set(16.5, 0.015, 38.5);
    dispensingFacility.add(leftAisleLine);

    const rightAisleLine = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.005, 14.8), floorLineMat);
    rightAisleLine.position.set(23.5, 0.015, 38.5);
    dispensingFacility.add(rightAisleLine);

    for (let z = 32.5; z <= 44.5; z += 3.0) {
      const cLeft = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.005, 0.08), floorLineMat);
      cLeft.position.set(17.1, 0.015, z);
      dispensingFacility.add(cLeft);

      const cRight = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.005, 0.08), floorLineMat);
      cRight.position.set(22.9, 0.015, z);
      dispensingFacility.add(cRight);
    }

    // Build each of the 50 machines
    dispensingMachines.forEach(m => {
      const isHero = (m.num === 1);
      const isOptimal = (m.statusClass === 'status-optimal');
      const isWarn = (m.statusClass === 'status-warning');
      const isDanger = (m.statusClass === 'status-danger');

      const cell = new THREE.Group();
      cell.name = m.tag;
      cell.position.copy(m.pos);
      cell.userData.machineIndex = m.index;

      // Table
      const tableTop = new THREE.Mesh(tableTopGeo, tableTopMat);
      tableTop.position.set(0, 0.85, 0);
      tableTop.castShadow = true;
      tableTop.receiveShadow = true;
      cell.add(tableTop);

      // Legs
      [[-0.9, 0.425, -0.5], [0.9, 0.425, -0.5], [-0.9, 0.425, 0.5], [0.9, 0.425, 0.5]].forEach(pos => {
        const leg = new THREE.Mesh(legGeo, legMat);
        leg.position.set(...pos);
        cell.add(leg);
      });

      // Pillars
      [[-0.95, 1.5, -0.55], [0.95, 1.5, -0.55], [-0.95, 1.5, 0.55], [0.95, 1.5, 0.55]].forEach(pos => {
        const pillar = new THREE.Mesh(pillarGeo, pillarMat);
        pillar.position.set(...pos);
        cell.add(pillar);
      });

      // HEPA Hood
      const hood = new THREE.Mesh(hoodGeo, hoodMat);
      hood.position.set(0, 2.15, 0);
      cell.add(hood);

      // 1. Industrial 3-Tier Andon Stack Light on Top of Hood (Red / Amber / Green)
      const andonBase = new THREE.Group();
      andonBase.position.set(0.85, 2.27, 0);

      const andonPole = new THREE.Mesh(andonPoleGeo, matAndonPole);
      andonPole.position.set(0, 0.16, 0);
      andonBase.add(andonPole);

      // Bottom: Green
      const tierGreen = new THREE.Mesh(andonLensGeo, isOptimal ? matAndonGreenActive : matAndonGreenDim);
      tierGreen.position.set(0, 0.35, 0);
      andonBase.add(tierGreen);

      // Middle: Amber
      const tierAmber = new THREE.Mesh(andonLensGeo, isWarn ? matAndonAmberActive : matAndonAmberDim);
      tierAmber.position.set(0, 0.41, 0);
      andonBase.add(tierAmber);

      // Top: Red
      const tierRed = new THREE.Mesh(andonLensGeo, isDanger ? matAndonRedActive : matAndonRedDim);
      tierRed.position.set(0, 0.47, 0);
      andonBase.add(tierRed);

      const andonCap = new THREE.Mesh(andonCapGeo, matAndonCap);
      andonCap.position.set(0, 0.505, 0);
      andonBase.add(andonCap);

      cell.add(andonBase);
      m.tierGreen = tierGreen;
      m.tierAmber = tierAmber;
      m.tierRed = tierRed;

      // 2. Front Hood Glowing Light Bar (Facing Operator/Aisle)
      let fBarMat = matFrontBarOptimal;
      if (isWarn) fBarMat = matFrontBarWarning;
      if (isDanger) fBarMat = matFrontBarDanger;

      const frontBar = new THREE.Mesh(frontBarGeo, fBarMat);
      frontBar.position.set(0, 2.05, 0.61);
      cell.add(frontBar);
      m.frontBar = frontBar;

      // 3. High-Visibility Floating 3D Overhead Status Tag (Optimized Billboard Sprite)
      const tagCanvas = document.createElement('canvas');
      tagCanvas.width = 160;
      tagCanvas.height = 40;
      const tctx = tagCanvas.getContext('2d');

      if (isDanger) {
        tctx.fillStyle = '#FF3B30';
        tctx.beginPath();
        tctx.roundRect(2, 2, 156, 36, 8);
        tctx.fill();
        tctx.strokeStyle = '#D70015';
        tctx.lineWidth = 3;
        tctx.stroke();
        tctx.fillStyle = '#FFFFFF';
        tctx.font = 'bold 15px monospace';
        tctx.fillText(m.tag, 8, 25);
        tctx.fillStyle = '#FFFFFF';
        tctx.font = 'bold 13px sans-serif';
        tctx.fillText('🚨 BROKEN', 80, 25);
      } else if (isWarn) {
        tctx.fillStyle = '#FF9500';
        tctx.beginPath();
        tctx.roundRect(2, 2, 156, 36, 8);
        tctx.fill();
        tctx.strokeStyle = '#C97200';
        tctx.lineWidth = 3;
        tctx.stroke();
        tctx.fillStyle = '#FFFFFF';
        tctx.font = 'bold 15px monospace';
        tctx.fillText(m.tag, 8, 25);
        tctx.fillStyle = '#FFFFFF';
        tctx.font = 'bold 13px sans-serif';
        tctx.fillText('⚠️ WARN', 90, 25);
      } else {
        tctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
        tctx.beginPath();
        tctx.roundRect(2, 2, 156, 36, 8);
        tctx.fill();
        tctx.strokeStyle = 'rgba(52, 199, 89, 0.6)';
        tctx.lineWidth = 2;
        tctx.stroke();
        tctx.fillStyle = '#1D1D1F';
        tctx.font = 'bold 15px monospace';
        tctx.fillText(m.tag, 10, 25);
        tctx.fillStyle = '#34C759';
        tctx.font = 'bold 13px sans-serif';
        tctx.fillText('● PASS', 105, 25);
      }

      const tagTex = new THREE.CanvasTexture(tagCanvas);
      const tagSprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: tagTex, transparent: true, depthWrite: false }));
      tagSprite.scale.set(1.15, 0.3, 1.0);
      tagSprite.position.set(0, 2.75, 0);
      cell.add(tagSprite);
      m.tagSprite = tagSprite;

      // Safety Glass
      const backGlass = new THREE.Mesh(backGlassGeo, glassMat);
      backGlass.position.set(0, 1.5, -0.55);
      cell.add(backGlass);

      const leftGlass = new THREE.Mesh(sideGlassGeo, glassMat);
      leftGlass.position.set(-0.95, 1.5, 0);
      cell.add(leftGlass);

      const rightGlass = new THREE.Mesh(sideGlassGeo, glassMat);
      rightGlass.position.set(0.95, 1.5, 0);
      cell.add(rightGlass);

      // Gantry Rail
      const gantryRail = new THREE.Mesh(gantryRailGeo, gantryRailMat);
      gantryRail.position.set(0, 1.35, 0);
      cell.add(gantryRail);

      // Fixture stage & Coil
      const fixtureStage = new THREE.Mesh(fixtureStageGeo, fixtureStageMat);
      fixtureStage.position.set(0, 0.935, 0.04);
      cell.add(fixtureStage);

      const heaterPlate = new THREE.Mesh(heaterPlateGeo, heaterPlateMat);
      heaterPlate.position.set(0, 0.965, 0.04);
      cell.add(heaterPlate);

      const eblockArm = new THREE.Mesh(eblockArmGeo, eblockArmMat);
      eblockArm.position.set(-0.04, 0.985, 0.04);
      cell.add(eblockArm);

      const coilMesh = new THREE.Mesh(coilGeo, coilMat);
      coilMesh.rotation.x = Math.PI / 2;
      coilMesh.position.set(0.06, 0.985, 0.04);
      cell.add(coilMesh);

      // Controller box
      const controllerBox = new THREE.Mesh(controllerBoxGeo, controllerMat);
      controllerBox.position.set(-0.65, 1.02, -0.15);
      cell.add(controllerBox);

      // 4. Working Dispensing Gantry Head (Every machine has an active animated nozzle)
      const nozzleGroup = new THREE.Group();
      nozzleGroup.position.set(0, 1.35, 0);
      nozzleGroup.add(new THREE.Mesh(carriageGeo, carriageMat));

      const sTube = new THREE.Mesh(syringeTubeGeo, syringeMat);
      sTube.position.set(0, -0.1, 0.04);
      nozzleGroup.add(sTube);

      const sFluid = new THREE.Mesh(epoxyFluidGeo, epoxyMat);
      sFluid.position.set(0, -0.11, 0.04);
      nozzleGroup.add(sFluid);

      const sHub = new THREE.Mesh(needleHubGeo, needleHubMat);
      sHub.position.set(0, -0.22, 0.04);
      nozzleGroup.add(sHub);

      const sTip = new THREE.Mesh(needleTipGeo, needleTipMat);
      sTip.position.set(0, -0.255, 0.04);
      nozzleGroup.add(sTip);

      // Lightweight laser spot mesh (zero PointLight overhead)
      const laserSpot = new THREE.Mesh(laserSpotGeo, laserSpotMat);
      laserSpot.position.set(0, -0.28, 0.04);
      laserSpot.visible = false;
      nozzleGroup.add(laserSpot);

      cell.add(nozzleGroup);
      m.nozzle = nozzleGroup;
      m.laserSpot = laserSpot;
      m.phaseOffset = (m.index * 0.73) % 4.0;
      m.prevProgress = 0;

      // Fillet Bead on Coil
      const filletMesh = new THREE.Mesh(filletGeo, filletMat);
      filletMesh.visible = isOptimal;
      cell.add(filletMesh);
      m.filletMesh = filletMesh;

      if (isHero) {
        dispensingWorkcell = cell;
        dispensingNozzle = nozzleGroup;
        dispensingFilletBead = filletMesh;

        // Digital Pressure Canvas
        digitalPressureCanvas = document.createElement('canvas');
        digitalPressureCanvas.width = 256;
        digitalPressureCanvas.height = 128;
        digitalPressureCtx = digitalPressureCanvas.getContext('2d');
        digitalPressureTexture = new THREE.CanvasTexture(digitalPressureCanvas);

        const screenMesh = new THREE.Mesh(
          new THREE.PlaneGeometry(0.18, 0.09),
          new THREE.MeshBasicMaterial({ map: digitalPressureTexture })
        );
        screenMesh.position.set(-0.65, 1.05, -0.008);
        cell.add(screenMesh);

        // Task Light
        const taskLight = new THREE.SpotLight(0xffffff, 2.2, 4.0, Math.PI / 4, 0.4, 1.0);
        taskLight.position.set(0, 2.05, 0);
        taskLight.target = fixtureStage;
        cell.add(taskLight);

        // 3D Floating Tag
        createDispensingHoloTag();
      } else {
        const staticScreen = new THREE.Mesh(
          new THREE.PlaneGeometry(0.18, 0.09),
          staticScreenMat
        );
        staticScreen.position.set(-0.65, 1.05, -0.008);
        cell.add(staticScreen);
      }

      m.mesh = cell;
      dispensingFacility.add(cell);
    });

    scene.add(dispensingFacility);
    console.log(`[ACA Dispensing Facility] Created ${dispensingMachines.length} distinct automated workcells.`);
  }

  function createDispensingHoloTag() {
    holoBadgeCanvas = document.createElement('canvas');
    holoBadgeCanvas.width = 512;
    holoBadgeCanvas.height = 256;
    holoBadgeCtx = holoBadgeCanvas.getContext('2d');
    holoBadgeTexture = new THREE.CanvasTexture(holoBadgeCanvas);

    const badgeMat = new THREE.SpriteMaterial({
      map: holoBadgeTexture,
      transparent: true,
      depthWrite: false
    });
    dispensingHoloBadge = new THREE.Sprite(badgeMat);
    dispensingHoloBadge.scale.set(1.6, 0.8, 1.0);
    dispensingHoloBadge.position.set(0, 2.55, 0);
    dispensingWorkcell.add(dispensingHoloBadge);

    updateHoloBadgeCanvas();
  }

  function updateHoloBadgeCanvas() {
    if (!holoBadgeCtx) return;
    const m = dispensingMachines[inspectedMachineIndex] || dispensingMachines[0];
    if (!m) return;

    const ctx = holoBadgeCtx;
    const w = 512, h = 256;
    ctx.clearRect(0, 0, w, h);

    const isOptimal = m.statusClass === 'status-optimal';
    const isDanger = m.statusClass === 'status-danger';

    // Panel background
    const bgGrad = ctx.createLinearGradient(0, 0, 0, h);
    if (isDanger) {
      bgGrad.addColorStop(0, '#DC2626');
      bgGrad.addColorStop(1, '#991B1B');
    } else if (!isOptimal) {
      bgGrad.addColorStop(0, '#D97706');
      bgGrad.addColorStop(1, '#92400E');
    } else {
      bgGrad.addColorStop(0, 'rgba(15, 23, 42, 0.94)');
      bgGrad.addColorStop(1, 'rgba(10, 15, 29, 0.98)');
    }
    ctx.fillStyle = bgGrad;
    ctx.beginPath();
    ctx.roundRect(10, 10, w - 20, h - 20, 20);
    ctx.fill();

    // Border
    ctx.strokeStyle = isOptimal ? 'rgba(56, 189, 248, 0.8)' : (isDanger ? '#FFFFFF' : '#FEF3C7');
    ctx.lineWidth = isDanger ? 5 : 4;
    ctx.stroke();

    // Header badge
    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 20px "Space Mono", monospace';
    ctx.fillText(`// ACA LINE · ${m.tag} (${m.locShort})`, 30, 48);

    // Title / Status
    ctx.fillStyle = isOptimal ? '#34d399' : (isDanger ? '#f43f5e' : '#fbbf24');
    ctx.font = 'bold 24px -apple-system, sans-serif';
    ctx.fillText(m.statusLabel, 30, 88);

    // Divider
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(30, 105);
    ctx.lineTo(w - 30, 105);
    ctx.stroke();

    // Metric 1: Pressure
    ctx.fillStyle = '#94a3b8';
    ctx.font = '16px "Space Mono", monospace';
    ctx.fillText('AIR PRESSURE (AI):', 30, 138);
    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 24px "Space Mono", monospace';
    ctx.fillText(m.currentPressureKpa.toFixed(1) + ' kPa', 30, 170);

    // Metric 2: Volume
    ctx.fillStyle = '#94a3b8';
    ctx.font = '16px "Space Mono", monospace';
    ctx.fillText('DISPENSE MASS:', 290, 138);
    ctx.fillStyle = isOptimal ? '#34d399' : '#fbbf24';
    ctx.font = 'bold 24px "Space Mono", monospace';
    ctx.fillText(m.currentVolumeMg.toFixed(2) + ' mg', 290, 170);

    // Footer Hint
    ctx.fillStyle = '#64748b';
    ctx.font = '15px -apple-system, sans-serif';
    ctx.fillText('Press [E] to Open SCADA Telemetry Console', 30, 218);

    holoBadgeTexture.needsUpdate = true;

    // Mini screen on Machine #01
    if (digitalPressureCtx) {
      const c = digitalPressureCtx;
      c.fillStyle = '#050b14';
      c.fillRect(0, 0, 256, 128);
      c.fillStyle = '#0284c7';
      c.font = 'bold 16px monospace';
      c.fillText('SMC · ' + m.tag, 15, 28);
      c.fillStyle = isOptimal ? '#34d399' : (isDanger ? '#f43f5e' : '#fbbf24');
      c.font = 'bold 42px monospace';
      c.fillText(m.currentPressureKpa.toFixed(1), 15, 80);
      c.font = 'bold 16px monospace';
      c.fillStyle = '#94a3b8';
      c.fillText('kPa · SCADA LIVE', 15, 110);
      digitalPressureTexture.needsUpdate = true;
    }
  }

  function updateDispensingStation(delta, t) {
    // 1. Shared Light & Andon Pulse (Updated once = zero per-machine uniform overhead)
    if (matAndonGreenActive) matAndonGreenActive.emissiveIntensity = 1.3 + 0.4 * Math.sin(t * 2.5);
    if (matAndonAmberActive) matAndonAmberActive.emissiveIntensity = Math.sin(t * 4.0) > 0 ? 2.2 : 0.3;
    if (matAndonRedActive)   matAndonRedActive.emissiveIntensity   = Math.sin(t * 8.0) > 0 ? 2.6 : 0.2;
    if (matFrontBarOptimal)  matFrontBarOptimal.emissiveIntensity  = 1.1 + 0.3 * Math.sin(t * 2.5);
    if (matFrontBarWarning)  matFrontBarWarning.emissiveIntensity  = 1.1 + 0.5 * Math.sin(t * 4.0);
    if (matFrontBarDanger)   matFrontBarDanger.emissiveIntensity   = 1.2 + 0.7 * Math.sin(t * 8.0);

    // 2. Active Dispensing Animation & Cycle Counting for ALL 50 Machines (Staggered Phases)
    for (let i = 0; i < dispensingMachines.length; i++) {
      const m = dispensingMachines[i];
      if (!m.nozzle) continue;

      if (m.statusClass === 'status-danger') {
        // Machine #27: Maintenance Hold / Safety Stop (Nozzle parked at safe height)
        m.nozzle.position.y = 1.36;
        m.nozzle.position.x = -0.04;
        m.nozzle.position.z = 0.04;
        if (m.laserSpot) m.laserSpot.visible = false;
        if (m.filletMesh) m.filletMesh.visible = false;
      } else {
        const isWarn = (m.statusClass === 'status-warning');
        const cycleTime = isWarn ? 5.2 : 4.0;
        const progress = ((t + m.phaseOffset) % cycleTime) / cycleTime;

        // Detect completion of dispense stroke -> increment shot counter in real-time!
        if (m.prevProgress !== undefined && m.prevProgress < 0.65 && progress >= 0.65) {
          m.batchCycles += 1;
          cleanroomHallTotalShots += 1;
          if (!isWarn) m.goodParts += 1;
          m.yieldPct = ((m.goodParts / m.batchCycles) * 100).toFixed(2);
        }
        m.prevProgress = progress;
        m.potLifeMin += (delta / 60.0); // Advance pot life time

        if (progress < 0.65) {
          const u = progress / 0.65;
          const arcX = -0.04 + u * 0.12;
          const arcZ = 0.04 + Math.sin(u * Math.PI) * 0.035;
          m.nozzle.position.x = arcX;
          m.nozzle.position.z = arcZ;
          m.nozzle.position.y = 1.25;

          if (m.laserSpot) m.laserSpot.visible = true;
          if (m.filletMesh) {
            m.filletMesh.visible = true;
            m.filletMesh.material.emissiveIntensity = 0.6 + 0.3 * Math.sin(t * 6);
          }
        } else {
          m.nozzle.position.y = 1.35;
          m.nozzle.position.x = THREE.MathUtils.lerp(m.nozzle.position.x, -0.04, 0.1);
          m.nozzle.position.z = THREE.MathUtils.lerp(m.nozzle.position.z, 0.04, 0.1);
          if (m.laserSpot) m.laserSpot.visible = false;
        }
      }
    }

    // 3. Proximity Detection: Find the Closest of ALL 50 Machines
    let closestDist = Infinity;
    let closestIdx = 0;

    for (let i = 0; i < dispensingMachines.length; i++) {
      const d = camera.position.distanceTo(dispensingMachines[i].pos);
      if (d < closestDist) {
        closestDist = d;
        closestIdx = i;
      }
    }
    nearbyMachineIndex = closestIdx;

    const hintEl = document.getElementById('dispensingInteractHint');
    if (hintEl) {
      if (closestDist < 4.2 && !isDispensingModalOpen) {
        const m = dispensingMachines[closestIdx];
        hintEl.innerHTML = `<span>[E] INSPECT ${m.tag} (${m.locShort})</span>`;
        hintEl.classList.remove('is-hidden');
      } else {
        hintEl.classList.add('is-hidden');
      }
    }

    // 4. Live Running Telemetry on Open SCADA Dashboard (Runs smoothly at ~12 FPS)
    if (isDispensingModalOpen && (t - lastTelemetryUiTime > 0.08)) {
      lastTelemetryUiTime = t;
      updateLiveDashboardValues(t);
    }
  }

  function updateLiveDashboardValues(t) {
    // 1. Total cleanroom hall shots ticker
    const hallEl = document.getElementById('hallTotalShots');
    if (hallEl) {
      hallEl.innerHTML = cleanroomHallTotalShots.toLocaleString() + ' <small>SHOTS</small>';
    }

    // 2. Inspected machine live metrics
    const m = dispensingMachines[inspectedMachineIndex] || dispensingMachines[0];
    if (!m) return;

    const kpiPres = document.getElementById('dispKpiPressure');
    const kpiVol = document.getElementById('dispKpiVolume');
    const kpiPot = document.getElementById('dispKpiPotLife');
    const bCycles = document.getElementById('dispBatchCycles');
    const bGood = document.getElementById('dispBatchGood');

    // Micro-sensor jitter for live realism
    const livePressure = (m.currentPressureKpa + Math.sin(t * 8.0 + m.index) * 0.15).toFixed(1);
    const liveVolume = (m.currentVolumeMg + Math.sin(t * 6.3 + m.index) * 0.01).toFixed(2);

    if (kpiPres) kpiPres.innerHTML = `${livePressure} <span class="unit">kPa</span>`;
    if (kpiVol) kpiVol.innerHTML = `${liveVolume} <span class="unit">mg</span>`;
    if (kpiPot) kpiPot.innerHTML = `${Math.round(m.potLifeMin)} <span class="unit">min</span>`;
    if (bCycles) bCycles.textContent = `${m.batchCycles.toLocaleString()} units`;
    if (bGood) bGood.textContent = `${m.goodParts.toLocaleString()} units (${m.yieldPct}%)`;
  }

  function setupDispensingUI() {
    const modal = document.getElementById('dispensingTelemetryModal');
    const closeBtn = document.getElementById('closeDispensingBtn');
    const backdrop = document.getElementById('dispensingBackdrop');
    const topBtn = document.getElementById('btnDispensingAI');
    const jumpBtn = document.getElementById('btnJumpDispensing');

    function openModal(idx) {
      if (idx !== undefined && idx >= 0 && idx < dispensingMachines.length) {
        inspectedMachineIndex = idx;
      }
      isDispensingModalOpen = true;
      const overlay = document.getElementById('fpsStartOverlay');
      if (overlay) overlay.classList.add('is-hidden');
      try {
        if (document.pointerLockElement) {
          document.exitPointerLock();
        }
      } catch (e) {
        console.warn('exitPointerLock error:', e);
      }
      if (modal) {
        modal.classList.remove('is-hidden');
        modal.setAttribute('aria-hidden', 'false');
      }
      updateDispensingUI();
      updateHoloBadgeCanvas();
    }

    function closeModal(showPauseOverlay = true) {
      isDispensingModalOpen = false;
      if (modal) {
        modal.classList.add('is-hidden');
        modal.setAttribute('aria-hidden', 'true');
      }
      if (showPauseOverlay) {
        const overlay = document.getElementById('fpsStartOverlay');
        const startBtn = document.getElementById('btnStartWalk');
        if (overlay) {
          overlay.classList.remove('is-hidden');
          if (startBtn) {
            startBtn.textContent = 'RESUME CLEANROOM TOUR (CLICK)';
          }
        }
      }
    }

    if (topBtn) topBtn.addEventListener('click', () => openModal(inspectedMachineIndex));
    if (closeBtn) closeBtn.addEventListener('click', () => closeModal(true));
    if (backdrop) backdrop.addEventListener('click', () => closeModal(true));

    // Handle ESC key to close telemetry modal and show pause menu
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' || e.code === 'Escape') {
        if (isDispensingModalOpen) {
          e.stopPropagation();
          closeModal(true);
        }
      }
    });

    // Key 'KeyE' proximity interact
    window.addEventListener('keydown', (e) => {
      if (e.code === 'KeyE') {
        const m = dispensingMachines[nearbyMachineIndex];
        const dist = m ? camera.position.distanceTo(m.pos) : 999;
        if (dist < 4.2) {
          if (isDispensingModalOpen) closeModal(true);
          else openModal(nearbyMachineIndex);
        }
      }
    });

    // Populate the 50-Machine Interactive Grid Map
    const gridEl = document.getElementById('machineMatrixGrid');
    if (gridEl) {
      gridEl.innerHTML = '';
      dispensingMachines.forEach(m => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.id = `matrixCell_${m.index}`;
        btn.className = `matrix-cell ${m.statusClass === 'status-danger' ? 'status-cell-danger' : (m.statusClass === 'status-warning' ? 'status-cell-warning' : 'status-cell-optimal')}`;
        btn.textContent = String(m.num).padStart(2, '0');
        btn.title = `${m.tag} | ${m.locDesc}\nStatus: ${m.statusLabel}\nPressure: ${m.currentPressureKpa.toFixed(1)} kPa | Volume: ${m.currentVolumeMg.toFixed(2)} mg`;
        
        // Add extra space after Column 5 to visually represent the central aisle
        if (m.col === 5) {
          btn.style.marginRight = '6px';
        }

        btn.addEventListener('click', () => {
          inspectedMachineIndex = m.index;
          updateDispensingUI();
          updateHoloBadgeCanvas();
        });

        gridEl.appendChild(btn);
      });
    }

    // Teleport button jumps directly in front of the inspected machine
    if (jumpBtn) {
      jumpBtn.addEventListener('click', () => {
        closeModal(false);
        const m = dispensingMachines[inspectedMachineIndex] || dispensingMachines[0];
        // Stand right in front of the machine looking directly into the workcell
        window.__teleport(m.pos.x, m.pos.z + 1.35, 0);
        showToast('📍 TELEPORTED', `Camera positioned at ${m.tag} (${m.locShort})`);
      });
    }

    // Reliable 90ms timer ticker guaranteeing cleanroomHallTotalShots & dashboard update live
    setInterval(() => {
      cleanroomHallTotalShots += 1;
      if (isDispensingModalOpen) {
        updateLiveDashboardValues(performance.now() * 0.001);
      }
    }, 90);
  }

  function updateDispensingUI() {
    const m = dispensingMachines[inspectedMachineIndex] || dispensingMachines[0];
    if (!m) return;

    // Highlight active cell in matrix
    dispensingMachines.forEach(other => {
      const cell = document.getElementById(`matrixCell_${other.index}`);
      if (cell) {
        if (other.index === m.index) cell.classList.add('active-inspected');
        else cell.classList.remove('active-inspected');
      }
    });

    // 1. Inspected Machine Header
    const tagEl = document.getElementById('activeMachineTag');
    const locEl = document.getElementById('activeMachineLoc');
    const pillEl = document.getElementById('activeStatusPill');

    if (tagEl) tagEl.textContent = m.tag;
    if (locEl) locEl.textContent = m.locDesc;
    if (pillEl) {
      pillEl.className = `machine-status-badge ${m.statusClass}`;
      pillEl.textContent = m.statusLabel;
    }

    // 2. 4 Core Metrics
    const kpiPres = document.getElementById('dispKpiPressure');
    const kpiPresDelta = document.getElementById('dispKpiPressureDelta');
    const kpiVol = document.getElementById('dispKpiVolume');
    const kpiVolStatus = document.getElementById('dispKpiVolumeStatus');
    const kpiPot = document.getElementById('dispKpiPotLife');
    const kpiVisc = document.getElementById('dispKpiViscosity');
    const kpiNeedle = document.getElementById('dispKpiNeedle');
    const kpiPreheat = document.getElementById('dispKpiPreheat');

    if (kpiPres) kpiPres.innerHTML = `${m.currentPressureKpa.toFixed(1)} <span class="unit">kPa</span>`;
    if (kpiPresDelta) kpiPresDelta.textContent = `AI Dynamic Setpoint: ${m.currentPressureKpa.toFixed(1)} kPa (±0.2 kPa)`;

    if (kpiVol) {
      kpiVol.innerHTML = `${m.currentVolumeMg.toFixed(2)} <span class="unit">mg</span>`;
      kpiVol.style.color = m.statusClass === 'status-optimal' ? '#38bdf8' : (m.statusClass === 'status-danger' ? '#f43f5e' : '#fbbf24');
    }
    if (kpiVolStatus) {
      if (m.statusClass === 'status-optimal') {
        kpiVolStatus.textContent = '✓ Within Nominal Tolerance (Target: 12.50 mg)';
        kpiVolStatus.style.color = '#34d399';
      } else if (m.statusClass === 'status-danger') {
        kpiVolStatus.textContent = '✗ Underfill Risk - Micro-Nozzle Scaling Detected';
        kpiVolStatus.style.color = '#f43f5e';
      } else {
        kpiVolStatus.textContent = '▲ Viscosity Rising - Dynamic Pressure Offset Active';
        kpiVolStatus.style.color = '#fbbf24';
      }
    }

    if (kpiPot) kpiPot.innerHTML = `${Math.round(m.potLifeMin)} <span class="unit">min</span>`;
    if (kpiVisc) kpiVisc.textContent = `Calculated Viscosity: ${m.viscosity.toLocaleString()} mPa·s`;

    if (kpiNeedle) kpiNeedle.innerHTML = `${m.nozzleHealth} <span class="unit">%</span>`;
    if (kpiPreheat) kpiPreheat.textContent = `Pre-heat Plate: ${m.preheatTempC.toFixed(1)}°C (Hum: ${m.humidity.toFixed(0)}%)`;

    // 3. Batch production stats
    const bCycles = document.getElementById('dispBatchCycles');
    const bGood = document.getElementById('dispBatchGood');
    if (bCycles) bCycles.textContent = `${m.batchCycles.toLocaleString()} units`;
    if (bGood) bGood.textContent = `${m.goodParts.toLocaleString()} units (${m.yieldPct}%)`;

    // 4. AI PREDICTIVE MAINTENANCE & RUL HERO CARD (Prominent Showcase)
    const heroCard = document.getElementById('aiPdmHeroCard');
    const badgeEl = document.getElementById('pdmStatusBadge');
    const statusTextEl = document.getElementById('pdmStatusText');
    const timerNumEl = document.getElementById('pdmTimerNum');
    const healthScoreEl = document.getElementById('pdmHealthScore');
    const healthBarEl = document.getElementById('pdmHealthBar');
    const rxDescEl = document.getElementById('pdmRxDesc');

    const isOptimal = m.statusClass === 'status-optimal';
    const isDanger = m.statusClass === 'status-danger';

    if (heroCard) {
      heroCard.className = `ai-pdm-hero-card ${isOptimal ? 'pdm-theme-optimal' : (isDanger ? 'pdm-theme-danger' : 'pdm-theme-warning')}`;
    }

    if (badgeEl && statusTextEl) {
      if (isOptimal) {
        badgeEl.className = 'pdm-status-badge badge-optimal';
        statusTextEl.textContent = 'OPTIMAL CONDITION (NOMINAL)';
      } else if (isDanger) {
        badgeEl.className = 'pdm-status-badge badge-danger';
        statusTextEl.textContent = 'CRITICAL ALERT (SERVICE DUE)';
      } else {
        badgeEl.className = 'pdm-status-badge badge-warning';
        statusTextEl.textContent = 'PREVENTIVE WARNING (MONITOR)';
      }
    }

    if (timerNumEl) {
      if (isOptimal) {
        timerNumEl.textContent = `In ~${Math.round(48 - m.needleWear * 35)} hrs`;
        timerNumEl.style.color = '#34d399';
      } else if (isDanger) {
        timerNumEl.textContent = 'Immediate replacement required!';
        timerNumEl.style.color = '#f43f5e';
      } else {
        timerNumEl.textContent = m.num === 14 ? 'In ~15 mins' : 'In ~45 mins';
        timerNumEl.style.color = '#fbbf24';
      }
    }

    if (healthScoreEl) {
      healthScoreEl.textContent = `${m.nozzleHealth}%`;
      healthScoreEl.style.color = isOptimal ? '#34d399' : (isDanger ? '#f43f5e' : '#fbbf24');
    }

    if (healthBarEl) {
      healthBarEl.style.width = `${m.nozzleHealth}%`;
      if (isOptimal) {
        healthBarEl.style.background = 'linear-gradient(90deg, #10b981, #34d399)';
        healthBarEl.style.boxShadow = '0 0 10px rgba(52, 211, 153, 0.5)';
      } else if (isDanger) {
        healthBarEl.style.background = 'linear-gradient(90deg, #e11d48, #f43f5e)';
        healthBarEl.style.boxShadow = '0 0 10px rgba(244, 63, 94, 0.6)';
      } else {
        healthBarEl.style.background = 'linear-gradient(90deg, #d97706, #fbbf24)';
        healthBarEl.style.boxShadow = '0 0 10px rgba(251, 191, 36, 0.5)';
      }
    }

    if (rxDescEl) {
      if (isOptimal) {
        rxDescEl.textContent = `AI Analysis: Supply air pressure (${m.currentPressureKpa.toFixed(1)} kPa) and adhesive viscosity (${m.viscosity.toLocaleString()} mPa·s) are optimal. Micro-nozzle wear is exceptionally low (${(m.needleWear * 100).toFixed(0)}%). Continuous production approved.`;
      } else if (isDanger) {
        rxDescEl.textContent = `🚨 Critical AI Diagnosis: Cumulative micro-nozzle wear reached ${(m.needleWear * 100).toFixed(0)}% (>75%) with deposit accumulation. High void defect risk. Automated Safe Hold active — technician must replace micro-nozzle.`;
      } else if (m.num === 14) {
        rxDescEl.textContent = `⚠️ Predictive AI Alert: Adhesive has resided in barrel for 148 minutes. Viscosity elevated to ${m.viscosity.toLocaleString()} mPa·s. Dynamic pneumatic compensation active. Prepare fresh syringe within 15 minutes to prevent curing.`;
      } else {
        rxDescEl.textContent = `⚠️ Predictive AI Alert: Heated fixture plate temperature drifted down to ${m.preheatTempC.toFixed(1)}°C, slowing adhesive cure rate. Recommend technician inspect heating element (Heater Plate).`;
      }
    }

    // 4.1 Update Apple Watch Concentric Activity Rings
    const ringRul = document.getElementById('appleRingRul');
    const ringDisp = document.getElementById('appleRingDispense');
    const ringTherm = document.getElementById('appleRingThermal');
    const ringCenter = document.getElementById('appleRingsCenterVal');

    if (ringRul && ringCenter) {
      const rulHrs = Math.max(1, Math.round(48 - m.needleWear * 35));
      ringCenter.textContent = isDanger ? '0' : String(rulHrs);
      // Circumference = 2 * PI * 50 = 314.16
      const rulPct = isDanger ? 0.05 : (rulHrs / 48);
      ringRul.style.strokeDashoffset = (314.16 * (1 - Math.min(1, rulPct))).toFixed(1);
      ringRul.style.stroke = isOptimal ? '#34C759' : (isDanger ? '#FF3B30' : '#FF9500');

      if (ringDisp) {
        // Circumference = 2 * PI * 38 = 238.76
        const dispPct = m.nozzleHealth / 100;
        ringDisp.style.strokeDashoffset = (238.76 * (1 - dispPct)).toFixed(1);
      }
      if (ringTherm) {
        // Circumference = 2 * PI * 26 = 163.36
        const thermPct = Math.min(1, m.preheatTempC / 65);
        ringTherm.style.strokeDashoffset = (163.36 * (1 - thermPct)).toFixed(1);
      }
    }

    // 4.2 Update Apple Dynamic Island in Top Bar
    const islandDot = document.getElementById('islandPulseDot');
    const islandTitle = document.getElementById('islandStatusTitle');
    const islandDesc = document.getElementById('islandStatusDesc');
    if (islandDot && islandTitle) {
      if (isOptimal) {
        islandDot.style.background = '#34C759';
        islandDot.style.boxShadow = '0 0 10px #34C759';
        islandTitle.textContent = `${m.tag} · Nominal (100% OK)`;
      } else if (isDanger) {
        islandDot.style.background = '#FF3B30';
        islandDot.style.boxShadow = '0 0 10px #FF3B30';
        islandTitle.textContent = `${m.tag} · Critical Alert (Needle Wear)`;
      } else {
        islandDot.style.background = '#FF9500';
        islandDot.style.boxShadow = '0 0 10px #FF9500';
        islandTitle.textContent = `${m.tag} · Preventive Warning`;
      }
      if (islandDesc) {
        islandDesc.textContent = `P: ${m.currentPressureKpa.toFixed(1)} kPa · Mass: ${m.currentVolumeMg.toFixed(2)} mg · ISO Class 5`;
      }
    }

    // 4. Fillet Inspection Canvas
    const filletScanStatus = document.getElementById('filletScanStatus');
    const visualBeadText = document.getElementById('visualBeadText');

    if (filletScanStatus) {
      filletScanStatus.className = m.statusClass === 'status-optimal' ? 'tag-status-ok' : 'tag-status-ng';
      filletScanStatus.textContent = m.statusClass === 'status-optimal' ? 'Adhesive Fillet 100% Nominal' : (m.statusClass === 'status-danger' ? 'Void Discontinuity (NG)' : 'Minor Fillet Spread');
    }
    if (visualBeadText) {
      visualBeadText.textContent = m.statusClass === 'status-optimal'
        ? '● Uniform Adhesive Bond, Void-Free'
        : (m.statusClass === 'status-danger' ? '▲ Void / Break in Fillet Path (Void Defect)' : '▲ Excess Adhesive Overflow (Flash Defect)');
      visualBeadText.style.color = m.statusClass === 'status-optimal' ? '#34d399' : (m.statusClass === 'status-danger' ? '#f43f5e' : '#fbbf24');
    }

    drawFilletPreview(m);
  }

  function drawFilletPreview(m) {
    const cvs = document.getElementById('filletPreviewCanvas');
    if (!cvs) return;
    const ctx = cvs.getContext('2d');
    const w = cvs.width, h = cvs.height;
    ctx.clearRect(0, 0, w, h);

    // Cross-section background
    ctx.fillStyle = '#050a14';
    ctx.fillRect(0, 0, w, h);

    // Left Substrate (Coil Terminal)
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(20, 20, 110, 38);
    ctx.fillStyle = '#94a3b8';
    ctx.font = 'bold 11px sans-serif';
    ctx.fillText('HDD Coil', 35, 43);

    // Right Substrate (E-Block Aluminum Arm)
    ctx.fillStyle = '#334155';
    ctx.fillRect(330, 20, 110, 38);
    ctx.fillStyle = '#cbd5e1';
    ctx.fillText('E-Block Arm', 345, 43);

    // Epoxy Gap (X: 130 to 330)
    const isOptimal = m.statusClass === 'status-optimal';
    const isDanger = m.statusClass === 'status-danger';

    if (isOptimal) {
      // Perfect smooth concave meniscus fillet
      ctx.fillStyle = 'rgba(16, 185, 129, 0.85)';
      ctx.beginPath();
      ctx.moveTo(130, 28);
      ctx.quadraticCurveTo(230, 44, 330, 28);
      ctx.lineTo(330, 58);
      ctx.quadraticCurveTo(230, 58, 130, 58);
      ctx.closePath();
      ctx.fill();

      ctx.strokeStyle = '#34d399';
      ctx.lineWidth = 2.5;
      ctx.stroke();

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 11px sans-serif';
      ctx.fillText('✓ Uniform Bond Line', 165, 48);
    } else if (isDanger) {
      // Broken void gap
      ctx.fillStyle = 'rgba(239, 68, 68, 0.6)';
      ctx.beginPath();
      ctx.moveTo(130, 38);
      ctx.lineTo(165, 38);
      ctx.lineTo(165, 58);
      ctx.lineTo(130, 58);
      ctx.fill();

      ctx.beginPath();
      ctx.moveTo(295, 38);
      ctx.lineTo(330, 38);
      ctx.lineTo(330, 58);
      ctx.lineTo(295, 58);
      ctx.fill();

      // Dashed red void box
      ctx.strokeStyle = '#f43f5e';
      ctx.lineWidth = 2;
      ctx.setLineDash([4, 4]);
      ctx.strokeRect(170, 22, 120, 36);
      ctx.setLineDash([]);
      ctx.fillStyle = '#f43f5e';
      ctx.font = 'bold 11px sans-serif';
      ctx.fillText('❌ Fillet Void (NG)', 175, 44);
    } else {
      // Overflow flash
      ctx.fillStyle = 'rgba(245, 158, 11, 0.85)';
      ctx.beginPath();
      ctx.moveTo(110, 14);
      ctx.quadraticCurveTo(230, 4, 350, 14);
      ctx.lineTo(340, 62);
      ctx.lineTo(120, 62);
      ctx.closePath();
      ctx.fill();

      ctx.strokeStyle = '#fbbf24';
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.fillStyle = '#0f172a';
      ctx.font = 'bold 11px sans-serif';
      ctx.fillText('⚠️ Adhesive Flash (WARN)', 160, 42);
    }
  }

  // =========================================================================
  // MAIN ANIMATION LOOP
  // =========================================================================
  function animate() {
    requestAnimationFrame(animate);

    const delta = Math.min((performance.now() - prevTime) * 0.001, 0.1);
    prevTime = performance.now();

    try { updatePlayer(delta); } catch (e) { console.error('updatePlayer error:', e); }
    try { drawRadar(); } catch (e) { console.error('drawRadar error:', e); }
    try { updateMachineAnimations(delta, performance.now() * 0.001); } catch (e) { console.error('updateMachineAnimations error:', e); }
    try { updateDispensingStation(delta, performance.now() * 0.001); } catch (e) { console.error('updateDispensingStation error:', e); }

    try {
      renderer.render(scene, camera);
    } catch (e) {
      console.error('renderer.render error:', e);
    }
  }

  function onWindowResize() {
    const width = window.innerWidth;
    const height = window.innerHeight;
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);
  }

  // =========================================================================
  // EXPORT GLB UTILITY
  // =========================================================================
  function exportFactoryToGLTF() {
    if (typeof THREE.GLTFExporter === 'undefined' || !factoryModel) {
      alert('Model is still loading. Please wait.');
      return;
    }

    const exporter = new THREE.GLTFExporter();
    exporter.parse(
      scene,
      (gltf) => {
        const blob = new Blob([gltf], { type: 'application/octet-stream' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'belton_factory_cleanroom_full.glb';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setTimeout(() => URL.revokeObjectURL(url), 2000);
      },
      { binary: true }
    );
  }

  // Global helper hooks for automated testing
  window.__teleport = function(x, z, yaw) {
    playerPos.x = x;
    playerPos.z = z;
    camera.position.set(x, EYE_HEIGHT, z);
    if (yaw !== undefined) {
      euler.y = yaw;
      euler.x = 0;
      camera.quaternion.setFromEuler(euler);
    }
    updateLocationHUD();
    drawRadar();
  };
  window.__checkCollision = checkCollision;
  window.__wallColliders = wallColliders;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
