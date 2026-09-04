/**
 * DIGITAL TWIN · 3D SMART FACTORY CONTROLLER
 * Belton Technology Group · Navanakorn Plant 2nd Floor
 * Procedural PBR Three.js Architecture based on authentic Floor Plan Blueprint
 */

(function () {
  'use strict';

  // Sound FX Engine
  const soundEngine = {
    audioCtx: null,
    init() {
      if (!this.audioCtx) {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (AudioContext) this.audioCtx = new AudioContext();
      }
    },
    playClick() {
      this.init();
      if (!this.audioCtx) return;
      try {
        const osc = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(1400, this.audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(700, this.audioCtx.currentTime + 0.05);
        gain.gain.setValueAtTime(0.12, this.audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.audioCtx.currentTime + 0.05);
        osc.connect(gain);
        gain.connect(this.audioCtx.destination);
        osc.start();
        osc.stop(this.audioCtx.currentTime + 0.05);
      } catch (e) {}
    },
    playHover() {
      this.init();
      if (!this.audioCtx) return;
      try {
        const osc = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(950, this.audioCtx.currentTime);
        gain.gain.setValueAtTime(0.04, this.audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.audioCtx.currentTime + 0.03);
        osc.connect(gain);
        gain.connect(this.audioCtx.destination);
        osc.start();
        osc.stop(this.audioCtx.currentTime + 0.03);
      } catch (e) {}
    },
    playCameraFly() {
      this.init();
      if (!this.audioCtx) return;
      try {
        const osc = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(440, this.audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(880, this.audioCtx.currentTime + 0.18);
        gain.gain.setValueAtTime(0.08, this.audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.audioCtx.currentTime + 0.2);
        osc.connect(gain);
        gain.connect(this.audioCtx.destination);
        osc.start();
        osc.stop(this.audioCtx.currentTime + 0.2);
      } catch (e) {}
    }
  };

  // Three.js State
  let scene, camera, renderer, controls;
  const spinningFans = [];
  const interactivePins = [];
  const raycaster = new THREE.Raycaster();
  const mouse = new THREE.Vector2();

  // Camera Animation State
  let isTransitioning = false;
  let camStartPos = new THREE.Vector3();
  let camTargetPos = new THREE.Vector3();
  let lookStart = new THREE.Vector3();
  let lookTarget = new THREE.Vector3();
  let transitionProgress = 0;
  let transitionSpeed = 0.035;

  // DOM Elements
  const canvas = document.getElementById('factoryCanvas');
  const zoneInspectorCard = document.getElementById('zoneInspectorCard');
  const inspectorZoneTitle = document.getElementById('inspectorZoneTitle');
  const inspectorZoneDesc = document.getElementById('inspectorZoneDesc');
  const specBays = document.getElementById('specBays');
  const specTolerance = document.getElementById('specTolerance');
  const specTact = document.getElementById('specTact');
  const specCleanroom = document.getElementById('specCleanroom');
  const blueprintRefText = document.getElementById('blueprintRefText');
  const closeInspectorBtn = document.getElementById('closeInspectorBtn');

  // Zone Metadata mapped to 2nd Floor Blueprint
  const ZONES_DATA = {
    all: {
      title: '2ND FLOOR GLOBAL OVERVIEW',
      desc: 'Complete architectural layout of Belton Navanakorn Plant 2nd Floor, encompassing Sub-Micron APFA Automation, Micro-Coil Lines, Central HVAC, and Quality Metrology.',
      bays: '64 Total Production Stations',
      tolerance: '±0.0002 mm (Sub-Micron Capability)',
      tact: 'High-Volume Continuous Throughput',
      cleanroom: 'ISO Class 100 / Class 1000 Regulated',
      blueprint: 'Full Facility Boundary (Grids A1 through G8)',
      camPos: { x: 75, y: 95, z: 95 },
      lookAt: { x: 0, y: 0, z: 0 }
    },
    apfa: {
      title: 'ZONE 01: APFA AUTOMATION LINES',
      desc: 'High-precision automated dual-track assembly bays engineered for HDD Head Gimbal Assembly (HGA) and Actuator Pivot Flex Assembly with automated visual inspection.',
      bays: '4 Dual-Tracks (16 Robotic Stations)',
      tolerance: '±0.0002 mm (Sub-Micron Laser Guidance)',
      tact: '0.42 sec / component',
      cleanroom: 'ISO 5 (Class 100) HEPA Laminar Flow',
      blueprint: 'Center-Right Machine Bay (Grids B2 - E5)',
      camPos: { x: 35, y: 35, z: 35 },
      lookAt: { x: 30, y: 3, z: 8 }
    },
    coil: {
      title: 'ZONE 02: MICRO-COIL & FLEX ASSEMBLY',
      desc: 'Dedicated precision winding and flex termination bay. Ultra-fine micro-copper wire winding for voice coil motors with thermal ultrasonic bonding.',
      bays: '12 Automated High-Speed Winders',
      tolerance: '±0.0005 mm Coil Concentricity',
      tact: '0.65 sec / coil unit',
      cleanroom: 'ISO 6 (Class 1000) Micro-Filtration',
      blueprint: 'Center Core Assembly (Grids C2 - D4)',
      camPos: { x: -5, y: 32, z: 28 },
      lookAt: { x: -14, y: 2, z: 2 }
    },
    hvac: {
      title: 'ZONE 03: HVAC & CHILLER ARRAY',
      desc: 'Central air handling and industrial chiller turbine cluster providing constant 6500K airflow, static pressure regulation, and positive pressure cleanroom envelope.',
      bays: '5 Heavy Industrial Chiller Turbines',
      tolerance: 'Continuous 1,240 CFM / 99.997% HEPA',
      tact: '24/7 Redundant Cleanroom Circulation',
      cleanroom: 'Primary Environmental Backbone',
      blueprint: 'Top-Center Plant Utility Line (Grid D1)',
      camPos: { x: 8, y: 32, z: -10 },
      lookAt: { x: 6, y: 4, z: -32 }
    },
    control: {
      title: 'ZONE 04: CONTROL & ENGINEERING HUB',
      desc: 'Process engineering consoles, automated production telemetry terminals, SCADA server racks, and central cleanroom personnel airlock.',
      bays: '20 Operations & Telemetry Desks',
      tolerance: 'Real-Time IoT Sub-Millisecond Sync',
      tact: 'Continuous Digital Twin Surveillance',
      cleanroom: 'Airlock Sealed & Static-Dissipative',
      blueprint: 'Top-Right Operations Wing (Grids E1 - F2)',
      camPos: { x: 48, y: 30, z: -12 },
      lookAt: { x: 44, y: 2, z: -26 }
    },
    metrology: {
      title: 'ZONE 05: METROLOGY & QUALITY ASSURANCE',
      desc: 'Coordinate Measuring Machines (CMM), non-contact confocal laser metrology, optical surface profilometers, and raw material clean buffer storage.',
      bays: '8 Laser CMM & Optical Scanners',
      tolerance: 'Sub-Nanometer Optical Resolution',
      tact: '100% Automated Part Verification',
      cleanroom: 'ISO 5 Temperature-Stabilized Bay',
      blueprint: 'Left Wing QA & Material Airlock (Grids A2 - B6)',
      camPos: { x: -45, y: 34, z: 22 },
      lookAt: { x: -48, y: 2, z: 0 }
    }
  };

  // Procedural Texture Generator for High-Gloss Cleanroom Epoxy Floor
  function generateEpoxyFloorTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 2048;
    canvas.height = 1280;
    const ctx = canvas.getContext('2d');

    // Cleanroom Daylight White Base
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Subtle Architectural Tile Grid
    ctx.strokeStyle = 'rgba(203, 213, 225, 0.45)';
    ctx.lineWidth = 1;
    const gridSize = 64;
    for (let x = 0; x < canvas.width; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
      ctx.stroke();
    }
    for (let y = 0; y < canvas.height; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
    }

    // High-Traffic Cleanroom Logistics Arteries (Green & Cyan Paths)
    ctx.fillStyle = 'rgba(2, 132, 199, 0.08)';
    // Main horizontal artery
    ctx.fillRect(100, 580, canvas.width - 200, 100);
    // Vertical arteries
    ctx.fillRect(720, 150, 90, canvas.height - 300);
    ctx.fillRect(1320, 150, 90, canvas.height - 300);

    // Hazard Safety Striping around Machine Zones (Yellow / Slate)
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 3;
    // APFA Bay
    ctx.strokeRect(1000, 420, 950, 680);
    // Coil Bay
    ctx.strokeRect(380, 420, 560, 680);
    // Metrology Bay
    ctx.strokeRect(100, 250, 240, 850);
    // HVAC Bay
    ctx.strokeRect(840, 100, 440, 280);

    // High-Resolution Floor Stencil Text
    ctx.fillStyle = 'rgba(100, 116, 139, 0.38)';
    ctx.font = 'bold 24px "Space Mono", monospace';
    ctx.fillText('BELTON TECHNOLOGY // 2ND FLOOR APFA MANUFACTURING', 120, 640);
    ctx.fillText('SECTOR A: ROBOTIC AUTOMATION', 1050, 460);
    ctx.fillText('SECTOR B: MICRO-COIL WINDING', 400, 460);
    ctx.fillText('SECTOR C: HVAC CHILLER AIR HANDLING', 860, 140);
    ctx.fillText('SECTOR D: ENGINEERING CONTROL', 1400, 200);
    ctx.fillText('SECTOR E: LASER METROLOGY & CMM', 110, 290);

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.ClampToEdgeWrapping;
    texture.wrapT = THREE.ClampToEdgeWrapping;
    return texture;
  }

  // Texture Generator for Machine Tops & Solar-reflective Surfaces
  function generateMachinePlateTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#e2e8f0';
    ctx.fillRect(0, 0, 512, 512);

    // Micro grid lines
    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 1;
    for (let i = 0; i < 512; i += 32) {
      ctx.beginPath();
      ctx.moveTo(i, 0); ctx.lineTo(i, 512); ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, i); ctx.lineTo(512, i); ctx.stroke();
    }

    // Status LED dots
    ctx.fillStyle = '#10b981';
    ctx.fillRect(20, 20, 16, 16);
    ctx.fillRect(44, 20, 16, 16);

    const texture = new THREE.CanvasTexture(canvas);
    return texture;
  }

  // Initialize Three.js Scene
  function initThreeScene() {
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf1f5f9);

    // Subtle atmospheric fog for scale depth
    scene.fog = new THREE.FogExp2(0xf1f5f9, 0.0035);

    // Perspective Camera
    camera = new THREE.PerspectiveCamera(
      42,
      window.innerWidth / window.innerHeight,
      0.5,
      1000
    );
    camera.position.set(75, 95, 95);

    // WebGL Renderer with High-DPI & Soft Shadows
    renderer = new THREE.WebGLRenderer({
      canvas: canvas,
      antialias: true,
      powerPreference: 'high-performance'
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.08;

    // OrbitControls for 360 Rotation, Panning, and Zooming
    controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.06;
    controls.maxPolarAngle = Math.PI / 2.05; // Prevent going beneath floor
    controls.minDistance = 15;
    controls.maxDistance = 240;
    controls.target.set(0, 0, 0);

    // High-CRI 6500K Cleanroom Daylight Lighting
    setupCleanroomLighting();

    // Build 3D Architecture Extruded from Blueprint
    buildFactoryFloorplan();

    // Event Listeners
    window.addEventListener('resize', onWindowResize);
    window.addEventListener('mousemove', onMouseMove);
    canvas.addEventListener('click', onCanvasClick);

    // Start Render Loop
    animate();
  }

  // Cleanroom Lighting Rig
  function setupCleanroomLighting() {
    // Ambient Daylight
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.72);
    scene.add(ambientLight);

    // Primary High-Angle Cleanroom Key Light (Soft Shadows)
    const keyLight = new THREE.DirectionalLight(0xffffff, 0.85);
    keyLight.position.set(65, 110, 50);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.width = 2048;
    keyLight.shadow.mapSize.height = 2048;
    keyLight.shadow.camera.near = 10;
    keyLight.shadow.camera.far = 300;
    keyLight.shadow.camera.left = -90;
    keyLight.shadow.camera.right = 90;
    keyLight.shadow.camera.top = 70;
    keyLight.shadow.camera.bottom = -70;
    keyLight.shadow.bias = -0.0005;
    scene.add(keyLight);

    // Soft Rim Fill Light
    const fillLight = new THREE.DirectionalLight(0xe2e8f0, 0.4);
    fillLight.position.set(-80, 50, -60);
    scene.add(fillLight);

    // Machine Bay Spotlight for Metallic Highlights
    const baySpot = new THREE.PointLight(0x0284c7, 0.6, 120);
    baySpot.position.set(30, 25, 10);
    scene.add(baySpot);
  }

  // Build the 3D Factory from the 2nd Floor Blueprint
  function buildFactoryFloorplan() {
    const floorWidth = 140;
    const floorDepth = 85;

    // Materials
    const floorTexture = generateEpoxyFloorTexture();
    const floorMaterial = new THREE.MeshStandardMaterial({
      map: floorTexture,
      roughness: 0.18,
      metalness: 0.08
    });

    const wallMaterial = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.35,
      metalness: 0.1
    });

    const glassMaterial = new THREE.MeshPhysicalMaterial({
      color: 0x93c5fd,
      transparent: true,
      opacity: 0.45,
      roughness: 0.1,
      transmission: 0.8,
      thickness: 0.8
    });

    const machineBodyMaterial = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.25,
      metalness: 0.4,
      map: generateMachinePlateTexture()
    });

    const steelMaterial = new THREE.MeshStandardMaterial({
      color: 0x64748b,
      roughness: 0.2,
      metalness: 0.8
    });

    const acrylicGreen = new THREE.MeshStandardMaterial({
      color: 0x10b981,
      emissive: 0x10b981,
      emissiveIntensity: 0.35,
      roughness: 0.3
    });

    // 1. Epoxy Floor Slab
    const floorGeometry = new THREE.PlaneGeometry(floorWidth, floorDepth);
    const floorMesh = new THREE.Mesh(floorGeometry, floorMaterial);
    floorMesh.rotation.x = -Math.PI / 2;
    floorMesh.receiveShadow = true;
    scene.add(floorMesh);

    // Foundation Slab Depth
    const slabGeo = new THREE.BoxGeometry(floorWidth + 4, 3, floorDepth + 4);
    const slabMat = new THREE.MeshStandardMaterial({ color: 0xcbd5e1, roughness: 0.8 });
    const slabMesh = new THREE.Mesh(slabGeo, slabMat);
    slabMesh.position.y = -1.52;
    scene.add(slabMesh);

    // 2. Outer Perimeter Architectural Walls (Matches 2nd Floor Outline)
    buildPerimeterWalls(floorWidth, floorDepth, wallMaterial, glassMaterial);

    // 3. Zone 03: 5 Chiller & HVAC Turbines (Top-Center)
    buildHvacChillers(steelMaterial, wallMaterial);

    // 4. Zone 01: 4 Dual-Track APFA Automated Assembly Lines (Center-Right)
    buildApfaLines(machineBodyMaterial, steelMaterial, acrylicGreen);

    // 5. Zone 02: Micro-Coil & Flex Winding Tables (Center Core)
    buildCoilBays(machineBodyMaterial, steelMaterial);

    // 6. Zone 04: Control & Engineering Office (Top-Right)
    buildControlHub(wallMaterial, glassMaterial);

    // 7. Zone 05: Left Wing Laser Metrology & Quality Bay
    buildMetrologyBay(machineBodyMaterial, glassMaterial);

    // 8. Place 3D Interactive Floating Zone Pins
    createZoneBeaconPins();
  }

  // Outer Perimeter Walls with Glass Observation Ports
  function buildPerimeterWalls(w, d, wallMat, glassMat) {
    const wallH = 6;
    const wallThick = 1;
    const halfW = w / 2;
    const halfD = d / 2;

    const wallsGroup = new THREE.Group();

    // Helper to make wall segment
    function makeWall(x, z, width, depth, isGlass = false) {
      const geo = new THREE.BoxGeometry(width, wallH, depth);
      const mesh = new THREE.Mesh(geo, isGlass ? glassMat : wallMat);
      mesh.position.set(x, wallH / 2, z);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      wallsGroup.add(mesh);
    }

    // South Wall (Bottom Entrance)
    makeWall(0, halfD, w, wallThick);

    // North Wall (Top Utility Wall)
    makeWall(0, -halfD, w, wallThick);

    // West Wall (Left QA Boundary)
    makeWall(-halfW, 0, wallThick, d);

    // East Wall with Glass Observation Viewports (Right Exterior)
    makeWall(halfW, -20, wallThick, 35);
    makeWall(halfW, 5, wallThick, 15, true); // Glass window
    makeWall(halfW, 25, wallThick, 25);

    // Internal Cleanroom Partition Walls (Separating Offices and Line Zones)
    makeWall(-15, -20, wallThick, 38);
    makeWall(25, -20, wallThick, 38, true); // Glass partition to office
    makeWall(-35, 10, wallThick, 48); // QA partition

    scene.add(wallsGroup);
  }

  // Zone 03: HVAC Chiller Cluster (5 Circular Turbines)
  function buildHvacChillers(steelMat, wallMat) {
    const hvacGroup = new THREE.Group();
    const turbineRadius = 4.2;
    const turbineHeight = 4.8;

    // Platform Base
    const platformGeo = new THREE.BoxGeometry(45, 1, 16);
    const platformMesh = new THREE.Mesh(platformGeo, steelMat);
    platformMesh.position.set(8, 0.5, -31);
    platformMesh.castShadow = true;
    platformMesh.receiveShadow = true;
    hvacGroup.add(platformMesh);

    // 5 Cylindrical Chiller Units matching blueprint row
    const startX = -10;
    const stepX = 9;

    for (let i = 0; i < 5; i++) {
      const cx = startX + i * stepX;
      const cz = -31;

      // Outer Tank Cylinder
      const cylGeo = new THREE.CylinderGeometry(turbineRadius, turbineRadius, turbineHeight, 24);
      const cylMesh = new THREE.Mesh(cylGeo, wallMat);
      cylMesh.position.set(cx, turbineHeight / 2 + 1, cz);
      cylMesh.castShadow = true;
      cylMesh.receiveShadow = true;
      hvacGroup.add(cylMesh);

      // Top Steel Grille
      const grilleGeo = new THREE.CylinderGeometry(turbineRadius * 0.88, turbineRadius * 0.88, 0.3, 20);
      const grilleMesh = new THREE.Mesh(grilleGeo, steelMat);
      grilleMesh.position.set(cx, turbineHeight + 1.1, cz);
      hvacGroup.add(grilleMesh);

      // 4-Blade Spinning Fan inside
      const fanGroup = new THREE.Group();
      fanGroup.position.set(cx, turbineHeight + 1.25, cz);

      const bladeGeo = new THREE.BoxGeometry(turbineRadius * 1.5, 0.1, 0.8);
      const bladeMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.9, roughness: 0.2 });
      const b1 = new THREE.Mesh(bladeGeo, bladeMat);
      const b2 = new THREE.Mesh(bladeGeo, bladeMat);
      b2.rotation.y = Math.PI / 2;
      fanGroup.add(b1, b2);

      hvacGroup.add(fanGroup);
      spinningFans.push(fanGroup);
    }

    // Industrial duct pipes
    const pipeGeo = new THREE.CylinderGeometry(0.8, 0.8, 45, 12);
    const pipeMesh = new THREE.Mesh(pipeGeo, steelMat);
    pipeMesh.rotation.z = Math.PI / 2;
    pipeMesh.position.set(8, 5.2, -36);
    hvacGroup.add(pipeMesh);

    scene.add(hvacGroup);
  }

  // Zone 01: 4 Dual-Row APFA Automated Production Lines
  function buildApfaLines(machineMat, steelMat, indicatorMat) {
    const apfaGroup = new THREE.Group();

    // 4 Parallel Machine Bays (matching blueprint rows)
    const zPositions = [-4, 8, 20, 31];

    zPositions.forEach((zPos, lineIdx) => {
      // Base Conveyor Track Line
      const trackLength = 48;
      const trackGeo = new THREE.BoxGeometry(trackLength, 0.8, 4.5);
      const trackMesh = new THREE.Mesh(trackGeo, steelMat);
      trackMesh.position.set(34, 0.4, zPos);
      trackMesh.castShadow = true;
      trackMesh.receiveShadow = true;
      apfaGroup.add(trackMesh);

      // 4 Precision Machine Enclosures per line (16 total)
      for (let s = 0; s < 4; s++) {
        const mx = 16 + s * 12;

        const boxGeo = new THREE.BoxGeometry(7.5, 3.8, 5.2);
        const boxMesh = new THREE.Mesh(boxGeo, machineMat);
        boxMesh.position.set(mx, 2.3, zPos);
        boxMesh.castShadow = true;
        boxMesh.receiveShadow = true;
        apfaGroup.add(boxMesh);

        // Robotic Arm Mounting Gantry
        const gantryGeo = new THREE.CylinderGeometry(0.35, 0.45, 2.8, 12);
        const gantryMesh = new THREE.Mesh(gantryGeo, steelMat);
        gantryMesh.position.set(mx, 4.6, zPos);
        apfaGroup.add(gantryMesh);

        // Green Active Status Beacon on machine head
        const beaconGeo = new THREE.SphereGeometry(0.25, 8, 8);
        const beaconMesh = new THREE.Mesh(beaconGeo, indicatorMat);
        beaconMesh.position.set(mx, 5.8, zPos);
        apfaGroup.add(beaconMesh);
      }
    });

    scene.add(apfaGroup);
  }

  // Zone 02: Micro-Coil & Flex Winding Stations
  function buildCoilBays(machineMat, steelMat) {
    const coilGroup = new THREE.Group();

    // 3 Rows of Winding Benches
    const xCols = [-24, -14, -4];
    xCols.forEach((xPos) => {
      for (let r = 0; r < 4; r++) {
        const zPos = -2 + r * 9;

        const tableGeo = new THREE.BoxGeometry(6.5, 2.2, 5.5);
        const tableMesh = new THREE.Mesh(tableGeo, machineMat);
        tableMesh.position.set(xPos, 1.1, zPos);
        tableMesh.castShadow = true;
        tableMesh.receiveShadow = true;
        coilGroup.add(tableMesh);

        // Laminar Hood Top
        const hoodGeo = new THREE.BoxGeometry(5.8, 1.5, 4.8);
        const hoodMesh = new THREE.Mesh(hoodGeo, steelMat);
        hoodMesh.position.set(xPos, 3.2, zPos);
        coilGroup.add(hoodMesh);
      }
    });

    scene.add(coilGroup);
  }

  // Zone 04: Control & Engineering Office (Top-Right)
  function buildControlHub(wallMat, glassMat) {
    const hubGroup = new THREE.Group();

    // 3 Rows of Workstation Desks
    for (let row = 0; row < 3; row++) {
      const zPos = -32 + row * 8;
      const deskGeo = new THREE.BoxGeometry(22, 1.6, 3.2);
      const deskMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.3 });
      const deskMesh = new THREE.Mesh(deskGeo, deskMat);
      deskMesh.position.set(45, 0.8, zPos);
      deskMesh.castShadow = true;
      deskMesh.receiveShadow = true;
      hubGroup.add(deskMesh);

      // Computer Monitors on desks
      for (let m = 0; m < 4; m++) {
        const monGeo = new THREE.BoxGeometry(2.4, 1.4, 0.2);
        const monMat = new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.1 });
        const monMesh = new THREE.Mesh(monGeo, monMat);
        monMesh.position.set(37 + m * 5.2, 2.2, zPos);
        hubGroup.add(monMesh);
      }
    }

    scene.add(hubGroup);
  }

  // Zone 05: Left Wing Metrology & Quality Assurance
  function buildMetrologyBay(machineMat, glassMat) {
    const qaGroup = new THREE.Group();

    // Large Coordinate Measuring Machines (CMM)
    for (let i = 0; i < 4; i++) {
      const zPos = -18 + i * 14;

      // Heavy Granite Surface Plate
      const graniteGeo = new THREE.BoxGeometry(8.5, 1.4, 7.5);
      const graniteMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.1 });
      const graniteMesh = new THREE.Mesh(graniteGeo, graniteMat);
      graniteMesh.position.set(-50, 0.7, zPos);
      graniteMesh.castShadow = true;
      graniteMesh.receiveShadow = true;
      qaGroup.add(graniteMesh);

      // Metrology Bridge Gantry
      const gantryGeo = new THREE.BoxGeometry(2, 6.5, 7.5);
      const gantryMesh = new THREE.Mesh(gantryGeo, machineMat);
      gantryMesh.position.set(-50, 4.4, zPos);
      gantryMesh.castShadow = true;
      qaGroup.add(gantryMesh);

      // Probe Sensor Head
      const probeGeo = new THREE.CylinderGeometry(0.15, 0.15, 2.2, 8);
      const probeMat = new THREE.MeshStandardMaterial({ color: 0xef4444 });
      const probeMesh = new THREE.Mesh(probeGeo, probeMat);
      probeMesh.position.set(-50, 3.2, zPos);
      qaGroup.add(probeMesh);
    }

    scene.add(qaGroup);
  }

  // Create 3D Interactive Floating Beacon Pins over Zones
  function createZoneBeaconPins() {
    const pinConfigs = [
      { id: 'apfa', name: '01 APFA LINES', pos: new THREE.Vector3(30, 8.5, 8) },
      { id: 'coil', name: '02 MICRO-COIL', pos: new THREE.Vector3(-14, 7.5, 2) },
      { id: 'hvac', name: '03 HVAC CHILLER', pos: new THREE.Vector3(8, 9.5, -31) },
      { id: 'control', name: '04 CONTROL HUB', pos: new THREE.Vector3(45, 7.5, -24) },
      { id: 'metrology', name: '05 METROLOGY', pos: new THREE.Vector3(-48, 8.5, 0) }
    ];

    pinConfigs.forEach((cfg) => {
      const pinGroup = new THREE.Group();
      pinGroup.position.copy(cfg.pos);
      pinGroup.userData = { zoneId: cfg.id };

      // Pulsing Base Ring
      const ringGeo = new THREE.RingGeometry(1.6, 2.2, 32);
      const ringMat = new THREE.MeshBasicMaterial({
        color: 0x0284c7,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.6
      });
      const ringMesh = new THREE.Mesh(ringGeo, ringMat);
      ringMesh.rotation.x = -Math.PI / 2;
      ringMesh.position.y = -cfg.pos.y + 0.1; // Sits on floor
      pinGroup.add(ringMesh);

      // Vertical Laser Tether
      const lineGeo = new THREE.CylinderGeometry(0.06, 0.06, cfg.pos.y, 8);
      const lineMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.45 });
      const lineMesh = new THREE.Mesh(lineGeo, lineMat);
      lineMesh.position.y = -cfg.pos.y / 2;
      pinGroup.add(lineMesh);

      // Floating Diamond Pin Marker
      const octGeo = new THREE.OctahedronGeometry(1.3, 0);
      const octMat = new THREE.MeshStandardMaterial({
        color: 0xffffff,
        emissive: 0x0284c7,
        emissiveIntensity: 0.6,
        roughness: 0.2,
        metalness: 0.8
      });
      const octMesh = new THREE.Mesh(octGeo, octMat);
      octMesh.castShadow = true;
      pinGroup.add(octMesh);

      // Billboard Text Label (Canvas Sprite)
      const labelCanvas = document.createElement('canvas');
      labelCanvas.width = 380;
      labelCanvas.height = 96;
      const lctx = labelCanvas.getContext('2d');
      lctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
      lctx.roundRect(10, 10, 360, 76, 18);
      lctx.fill();
      lctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
      lctx.lineWidth = 2;
      lctx.roundRect(10, 10, 360, 76, 18);
      lctx.stroke();

      lctx.fillStyle = '#ffffff';
      lctx.font = 'bold 28px -apple-system, sans-serif';
      lctx.textAlign = 'center';
      lctx.textBaseline = 'middle';
      lctx.fillText(cfg.name, 190, 48);

      const labelTex = new THREE.CanvasTexture(labelCanvas);
      const spriteMat = new THREE.SpriteMaterial({ map: labelTex, depthTest: false });
      const sprite = new THREE.Sprite(spriteMat);
      sprite.scale.set(6.5, 1.8, 1);
      sprite.position.y = 2.4;
      pinGroup.add(sprite);

      scene.add(pinGroup);
      interactivePins.push(pinGroup);
    });
  }

  // Smooth Camera Fly-to Tween
  function flyCameraTo(targetCam, targetLook) {
    camStartPos.copy(camera.position);
    camTargetPos.set(targetCam.x, targetCam.y, targetCam.z);
    lookStart.copy(controls.target);
    lookTarget.set(targetLook.x, targetLook.y, targetLook.z);

    transitionProgress = 0;
    isTransitioning = true;
    soundEngine.playCameraFly();
  }

  // Select Zone & Update UI
  function selectZone(zoneKey) {
    const data = ZONES_DATA[zoneKey];
    if (!data) return;

    // Update Quick Selector Active Pill
    document.querySelectorAll('.zone-pill').forEach((pill) => {
      pill.classList.toggle('active', pill.getAttribute('data-zone') === zoneKey);
    });

    // Fly Camera
    flyCameraTo(data.camPos, data.lookAt);

    // Update & Reveal Inspector Card
    if (zoneKey !== 'all') {
      inspectorZoneTitle.textContent = data.title;
      inspectorZoneDesc.textContent = data.desc;
      specBays.textContent = data.bays;
      specTolerance.textContent = data.tolerance;
      specTact.textContent = data.tact;
      specCleanroom.textContent = data.cleanroom;
      blueprintRefText.textContent = data.blueprint;

      zoneInspectorCard.classList.add('is-visible');
      zoneInspectorCard.setAttribute('aria-hidden', 'false');
    } else {
      zoneInspectorCard.classList.remove('is-visible');
      zoneInspectorCard.setAttribute('aria-hidden', 'true');
    }

    soundEngine.playClick();
  }

  // Mouse Move / Raycasting
  function onMouseMove(event) {
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(interactivePins, true);

    if (intersects.length > 0) {
      document.body.style.cursor = 'pointer';
    } else {
      document.body.style.cursor = 'default';
    }
  }

  // Canvas Click Interaction
  function onCanvasClick(event) {
    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(interactivePins, true);

    if (intersects.length > 0) {
      let topGroup = intersects[0].object;
      while (topGroup.parent && topGroup.parent !== scene) {
        topGroup = topGroup.parent;
      }
      if (topGroup.userData && topGroup.userData.zoneId) {
        selectZone(topGroup.userData.zoneId);
      }
    }
  }

  // Window Resize
  function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  }

  // Animation Loop
  function animate() {
    requestAnimationFrame(animate);

    // Spin Chiller Fan Blades
    spinningFans.forEach((fan) => {
      fan.rotation.y += 0.08;
    });

    // Gently Bob Floating Zone Pins
    const time = performance.now() * 0.002;
    interactivePins.forEach((pin, i) => {
      const oct = pin.children.find((c) => c.geometry && c.geometry.type === 'OctahedronGeometry');
      if (oct) {
        oct.rotation.y += 0.02;
        oct.position.y = Math.sin(time + i) * 0.35;
      }
    });

    // Smooth Camera Transition (Ease-Out Cubic)
    if (isTransitioning) {
      transitionProgress += transitionSpeed;
      if (transitionProgress >= 1) {
        transitionProgress = 1;
        isTransitioning = false;
      }
      const t = 1 - Math.pow(1 - transitionProgress, 3); // Cubic ease-out
      camera.position.lerpVectors(camStartPos, camTargetPos, t);
      controls.target.lerpVectors(lookStart, lookTarget, t);
    }

    controls.update();
    renderer.render(scene, camera);
  }

  // UI Button Bindings
  function initUI() {
    // Quick-Selector Pills
    document.querySelectorAll('.zone-pill').forEach((pill) => {
      pill.addEventListener('click', () => {
        const zone = pill.getAttribute('data-zone');
        selectZone(zone);
      });
      pill.addEventListener('mouseenter', () => soundEngine.playHover());
    });

    // View Control Toggles (Top-Right)
    const btnIso = document.getElementById('btnIsometricView');
    const btnTop = document.getElementById('btnTopDownView');
    const btnReset = document.getElementById('btnResetCamera');

    if (btnIso) {
      btnIso.addEventListener('click', () => {
        btnIso.classList.add('active');
        if (btnTop) btnTop.classList.remove('active');
        flyCameraTo({ x: 75, y: 95, z: 95 }, { x: 0, y: 0, z: 0 });
      });
    }

    if (btnTop) {
      btnTop.addEventListener('click', () => {
        btnTop.classList.add('active');
        if (btnIso) btnIso.classList.remove('active');
        // Top-Down Blueprint Match
        flyCameraTo({ x: 0, y: 135, z: 0.1 }, { x: 0, y: 0, z: 0 });
      });
    }

    if (btnReset) {
      btnReset.addEventListener('click', () => {
        selectZone('all');
      });
    }

    // Close Inspector Card
    if (closeInspectorBtn) {
      closeInspectorBtn.addEventListener('click', () => {
        zoneInspectorCard.classList.remove('is-visible');
        zoneInspectorCard.setAttribute('aria-hidden', 'true');
        soundEngine.playClick();
      });
    }

    // Confirm Logout Modal Setup
    initLogoutModal();
  }

  // Logout Modal with Letter-by-Letter Typewriter Animation
  function initLogoutModal() {
    const factoryLogoutBtn = document.getElementById('factoryLogoutBtn');
    const logoutConfirmModal = document.getElementById('logoutConfirmModal');
    const logoutModalBackdrop = document.getElementById('logoutModalBackdrop');
    const logoutModalDesc = document.getElementById('logoutModalDesc');
    const cancelLogoutBtn = document.getElementById('cancelLogoutBtn');
    const confirmLogoutBtn = document.getElementById('confirmLogoutBtn');

    let logoutTypewriterTimer = null;
    const logoutPromptText = 'Are you sure you want to end your authenticated session and return to guest mode?';

    function playLogoutTypewriter() {
      if (!logoutModalDesc) return;
      clearInterval(logoutTypewriterTimer);
      logoutModalDesc.innerHTML = '<span class="logout-typewriter-cursor"></span>';
      let charIdx = 0;
      logoutTypewriterTimer = setInterval(() => {
        if (charIdx < logoutPromptText.length) {
          charIdx++;
          logoutModalDesc.innerHTML = logoutPromptText.slice(0, charIdx) + '<span class="logout-typewriter-cursor"></span>';
        } else {
          clearInterval(logoutTypewriterTimer);
          setTimeout(() => {
            if (logoutModalDesc) logoutModalDesc.textContent = logoutPromptText;
          }, 1200);
        }
      }, 20);
    }

    if (!factoryLogoutBtn || !logoutConfirmModal) return;

    factoryLogoutBtn.addEventListener('click', () => {
      logoutConfirmModal.classList.add('is-open');
      logoutConfirmModal.setAttribute('aria-hidden', 'false');
      playLogoutTypewriter();
      soundEngine.playClick();
    });

    const closeModal = () => {
      clearInterval(logoutTypewriterTimer);
      logoutConfirmModal.classList.remove('is-open');
      logoutConfirmModal.setAttribute('aria-hidden', 'true');
      soundEngine.playClick();
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

  // Init on DOM ready
  document.addEventListener('DOMContentLoaded', () => {
    initThreeScene();
    initUI();
  });
})();
