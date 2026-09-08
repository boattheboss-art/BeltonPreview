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
  const playerPos = new THREE.Vector3(46.0, EYE_HEIGHT, 38.0); // Spawn in center of East Highway looking North
  const euler = new THREE.Euler(0, Math.PI, 0, 'YXZ');
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
    { id: 'scada_suite', name: 'SCADA MASTER CONTROL SUITE', minX: 55.0, maxX: 92.0, minZ: 36.0, maxZ: 54.0, visited: false }
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

            const mat = child.material;
            if (mat) {
              const nameLower = (child.name + ' ' + (mat.name || '')).toLowerCase();
              if (nameLower.includes('glass') || nameLower.includes('window')) {
                mat.transparent = true;
                mat.opacity = 0.22;
                mat.roughness = 0.08;
                mat.metalness = 0.1;
                mat.depthWrite = true;
              }
            }
          }
        });

        scene.add(factoryModel);
        isModelLoaded = true;
        isReloadingModel = false;

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
    scene.background = new THREE.Color(0x0a0f1d);
    scene.fog = new THREE.FogExp2(0x0a0f1d, 0.009);
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
    window.addEventListener('resize', onWindowResize);
    requestAnimationFrame(animate);
  }

  function setupEventListeners() {
    const canvas = document.getElementById('factoryCanvas');
    const overlay = document.getElementById('fpsStartOverlay');
    const startBtn = document.getElementById('btnStartWalk');

    function enterWalkthrough() {
      if (!isModelLoaded) return;
      if (overlay) overlay.classList.add('is-hidden');
      initAudio();
      canvas.requestPointerLock();
    }

    if (startBtn) {
      startBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        enterWalkthrough();
      });
    }

    // Allow clicking the overlay backdrop to resume
    if (overlay) {
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
          enterWalkthrough();
        }
      });
    }

    // Re-lock mouse when clicking canvas if unlocked
    canvas.addEventListener('click', () => {
      if (!isPointerLocked && isModelLoaded) {
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

      // When user presses ESC (or mouse lock is released), show pause menu to resume
      if (!isPointerLocked) {
        // Clear all movement keys so player doesn't slide when paused
        Object.keys(keys).forEach(k => keys[k] = false);

        const logoutModal = document.getElementById('logoutConfirmModal');
        const isLoggingOut = logoutModal && (logoutModal.classList.contains('is-active') || logoutModal.classList.contains('is-open'));
        if (!isLoggingOut && overlay && isModelLoaded) {
          overlay.classList.remove('is-hidden');
          if (startBtn) {
            startBtn.disabled = false;
            startBtn.textContent = 'RESUME TOUR / เล่นต่อ (CLICK)';
            startBtn.classList.add('ready');
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
  // MAIN ANIMATION LOOP
  // =========================================================================
  function animate() {
    requestAnimationFrame(animate);

    const delta = Math.min((performance.now() - prevTime) * 0.001, 0.1);
    prevTime = performance.now();

    updatePlayer(delta);
    drawRadar();

    renderer.render(scene, camera);
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
