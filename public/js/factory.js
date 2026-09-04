/**
 * DIGITAL TWIN · 3D SMART FACTORY CONTROLLER (AUTHENTIC 100% BLUEPRINT EDITION)
 * Belton Technology Group · Navanakorn Plant 2nd Floor
 * Complete Architectural & Machinery Replication with Operator Verified Room Designations:
 * 1. Pre-Packing Component Storage & Camera Inspection Room (Left Wing)
 * 2. Cleanroom Gowning & Locker Center (Top-Right)
 * 3. Machine Maintenance & Tooling Workshop (Top-Center-Left)
 * 4. System Control & SCADA Engineering Office (Bottom-Right)
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
  const roboticArms = [];
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

  // Exact Zone Metadata mapped to 2nd Floor Blueprint
  const ZONES_DATA = {
    all: {
      title: '2ND FLOOR GLOBAL OVERVIEW',
      desc: 'Complete architectural blueprint layout of Belton Navanakorn Plant 2nd Floor. Every machine line, maintenance bay, gowning room, camera inspection buffer, and control office is modeled 100% to scale.',
      bays: '8 Specialized Rooms & Sectors · 96 Workcells',
      tolerance: '±0.0002 mm (Sub-Micron Capability)',
      tact: 'High-Volume Continuous Throughput',
      cleanroom: 'ISO Class 100 / Class 1000 Regulated',
      blueprint: 'Full Facility Boundary (Grids A1 through H8)',
      camPos: { x: 80, y: 105, z: 95 },
      lookAt: { x: 0, y: 0, z: 0 }
    },
    prepack: {
      title: 'ROOM 1: PRE-PACKING STORAGE & CAMERA INSPECTION',
      desc: 'Storage racks for finished sub-assemblies equipped with automated high-resolution optical inspection cameras scanning every shelf to verify part cleanliness before final carton packing.',
      bays: '6 Multi-Tier Racks + 12 Camera Inspection Heads',
      tolerance: '100% Optical Automated Visual Inspection (AOI)',
      tact: '0.24 sec / scan cycle',
      cleanroom: 'ISO 6 (Class 1000) Micro-Filtration',
      blueprint: 'Leftmost Partitioned Room (Grid A2-A6)',
      camPos: { x: -64, y: 32, z: 25 },
      lookAt: { x: -68, y: 2, z: 2 }
    },
    gowning: {
      title: 'ROOM 2: CLEANROOM GOWNING & AIRLOCK CENTER',
      desc: 'ESD cleanroom gowning room with step-over barrier benches, stainless steel lockers, sticky floor mats, and high-velocity dual air shower blowers.',
      bays: '24 Gowning Stations + 2 Air Showers',
      tolerance: '99.999% Personnel Particulate Removal',
      tact: 'Airlock Sealed & Interlocked Doors',
      cleanroom: 'Positive Pressure Airlock Transition',
      blueprint: 'Top-Right Gowning Sector (Grid G1-H2)',
      camPos: { x: 65, y: 32, z: -18 },
      lookAt: { x: 62, y: 2, z: -35 }
    },
    maintenance: {
      title: 'ROOM 3: MACHINE MAINTENANCE & TOOLING WORKSHOP',
      desc: 'Dedicated precision tooling and machine maintenance facility with heavy repair benches, spare parts cabinets, CNC spindle repair, and air compressor lines.',
      bays: '6 Maintenance Workbenches + Tooling Racks',
      tolerance: 'Micron-Level Tool & Die Calibration',
      tact: '24/7 Rapid Machine Uptime Support',
      cleanroom: 'Dedicated Tooling & Mechanical Bay',
      blueprint: 'Top Utility Room West of Chillers (Grid C1)',
      camPos: { x: -14, y: 30, z: -16 },
      lookAt: { x: -18, y: 2, z: -34 }
    },
    control: {
      title: 'ROOM 4: SYSTEM CONTROL & SCADA ENGINEERING',
      desc: 'Central control room housing facility monitoring consoles, SCADA telemetry servers, and live video surveillance overlooking the entire production floor.',
      bays: 'Main SCADA Consoles & Operations Desks',
      tolerance: 'Sub-Millisecond Industrial IoT Telemetry',
      tact: '24/7 Shift Supervisor & Automation Control',
      cleanroom: 'Observation Glass Overlooking Lines',
      blueprint: 'Bottom-Right Enclosed Office (Grid H7)',
      camPos: { x: 64, y: 28, z: 22 },
      lookAt: { x: 68, y: 2, z: 38 }
    },
    apfa: {
      title: 'ZONE 05: APFA AUTOMATION MODULES',
      desc: '4 massive dual-station robotic assembly cells with automated conveyors, articulated pick-and-place robots, clear acrylic hoods, and signal towers.',
      bays: '4 Dual Heavy Machine Modules (16 Stations)',
      tolerance: '±0.0002 mm (Sub-Micron Laser Guided)',
      tact: '0.42 sec / component',
      cleanroom: 'ISO 5 (Class 100) HEPA Laminar Flow',
      blueprint: 'Center-Right Production Grid (Grids C2-E4)',
      camPos: { x: 38, y: 36, z: 32 },
      lookAt: { x: 31, y: 3, z: 9 }
    },
    hvac: {
      title: 'ZONE 06: HVAC 5-CHILLER ARRAY',
      desc: '5 heavy industrial chillers with rotating aerodynamic fan blades, protective steel domes, and main supply header pipe manifold.',
      bays: '5 Heavy Industrial Chiller Turbines',
      tolerance: '1,240 CFM Constant Positive Pressure Flow',
      tact: '99.997% HEPA Filtration at 0.3 Microns',
      cleanroom: 'Primary Environmental Cleanroom Engine',
      blueprint: 'Top-Center Plant Utility Boundary (Grid D1)',
      camPos: { x: 6, y: 32, z: -10 },
      lookAt: { x: 4, y: 4, z: -32 }
    }
  };

  // High-Resolution Procedural Floor Texture
  function generateEpoxyFloorTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 2048;
    canvas.height = 1280;
    const ctx = canvas.getContext('2d');

    // Cleanroom White Base
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Architectural Tile Grid
    ctx.strokeStyle = 'rgba(203, 213, 225, 0.4)';
    ctx.lineWidth = 1;
    const gridSize = 48;
    for (let x = 0; x < canvas.width; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0); ctx.lineTo(x, canvas.height); ctx.stroke();
    }
    for (let y = 0; y < canvas.height; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y); ctx.lineTo(canvas.width, y); ctx.stroke();
    }

    // High-Traffic Logistics Paths (Cyan Cleanroom Epoxy Paths)
    ctx.fillStyle = 'rgba(2, 132, 199, 0.08)';
    ctx.fillRect(60, 540, canvas.width - 120, 110);
    ctx.fillRect(520, 120, 80, canvas.height - 240);
    ctx.fillRect(1080, 120, 80, canvas.height - 240);
    ctx.fillRect(1520, 120, 80, canvas.height - 240);

    // Hazard Safety Striping & Room Names
    function drawHazardBox(x, y, w, h, label) {
      ctx.strokeStyle = 'rgba(234, 179, 8, 0.7)';
      ctx.lineWidth = 3;
      ctx.setLineDash([8, 6]);
      ctx.strokeRect(x, y, w, h);
      ctx.setLineDash([]);

      if (label) {
        ctx.fillStyle = 'rgba(100, 116, 139, 0.65)';
        ctx.font = 'bold 15px "Space Mono", monospace';
        ctx.fillText(label, x + 12, y + 24);
      }
    }

    drawHazardBox(60, 200, 240, 820, 'ROOM 1: PRE-PACKING & CAMERA AOI');
    drawHazardBox(320, 200, 180, 820, 'CHEMICAL & ULTRASONIC CLEAN');
    drawHazardBox(520, 200, 500, 820, 'MICRO-COIL & STEPPED ASSEMBLY');
    drawHazardBox(1080, 360, 420, 660, 'APFA ROBOTIC CELL GRID');
    drawHazardBox(1520, 260, 480, 760, 'FINAL ASSEMBLY & TEST LINES');
    drawHazardBox(520, 60, 240, 220, 'ROOM 3: MACHINE MAINTENANCE');
    drawHazardBox(780, 60, 540, 220, 'HVAC CHILLER ARRAY (5 UNITS)');
    drawHazardBox(1400, 60, 600, 220, 'ROOM 2: CLEANROOM GOWNING');
    drawHazardBox(1680, 1060, 320, 160, 'ROOM 4: SYSTEM CONTROL');
    drawHazardBox(60, 1080, 1580, 140, 'LOGISTICS PALLET RACKS');

    return new THREE.CanvasTexture(canvas);
  }

  // Panel Texture for Machines
  function generatePanelTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#e2e8f0';
    ctx.fillRect(0, 0, 512, 512);

    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 4;
    ctx.strokeRect(4, 4, 504, 504);

    ctx.fillStyle = '#0f172a';
    ctx.fillRect(40, 40, 200, 120);
    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 18px monospace';
    ctx.fillText('STATUS: OK', 55, 75);
    ctx.fillStyle = '#10b981';
    ctx.fillText('SPEED: 100%', 55, 110);
    ctx.fillStyle = '#e2e8f0';
    ctx.fillText('YIELD: 99.98%', 55, 140);

    ctx.strokeStyle = '#64748b';
    ctx.lineWidth = 2;
    for (let y = 220; y < 460; y += 14) {
      ctx.beginPath();
      ctx.moveTo(40, y); ctx.lineTo(470, y); ctx.stroke();
    }

    return new THREE.CanvasTexture(canvas);
  }

  // Master Material Library
  let MATS = {};
  function initMaterials() {
    MATS = {
      floor: new THREE.MeshStandardMaterial({
        map: generateEpoxyFloorTexture(),
        roughness: 0.18,
        metalness: 0.08
      }),
      slab: new THREE.MeshStandardMaterial({ color: 0xcbd5e1, roughness: 0.8 }),
      wallWhite: new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.35, metalness: 0.1 }),
      wallDark: new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.4, metalness: 0.2 }),
      glassCleanroom: new THREE.MeshPhysicalMaterial({
        color: 0x93c5fd,
        transparent: true,
        opacity: 0.38,
        roughness: 0.08,
        transmission: 0.85,
        thickness: 0.6
      }),
      acrylicHood: new THREE.MeshPhysicalMaterial({
        color: 0xe0f2fe,
        transparent: true,
        opacity: 0.45,
        roughness: 0.12,
        transmission: 0.88,
        thickness: 0.4
      }),
      machineChassis: new THREE.MeshStandardMaterial({
        color: 0xffffff,
        roughness: 0.28,
        metalness: 0.35,
        map: generatePanelTexture()
      }),
      machineBaseDark: new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.4, metalness: 0.6 }),
      conveyorBelt: new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.7, metalness: 0.2 }),
      steelBright: new THREE.MeshStandardMaterial({ color: 0x94a3b8, roughness: 0.18, metalness: 0.85 }),
      steelDark: new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.3, metalness: 0.8 }),
      chemicalBlue: new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.3, metalness: 0.4 }),
      chemicalLiquid: new THREE.MeshPhysicalMaterial({
        color: 0x38bdf8,
        transparent: true,
        opacity: 0.75,
        roughness: 0.05,
        transmission: 0.6
      }),
      rackRed: new THREE.MeshStandardMaterial({ color: 0xef4444, roughness: 0.4, metalness: 0.3 }),
      rackOrange: new THREE.MeshStandardMaterial({ color: 0xf97316, roughness: 0.4, metalness: 0.3 }),
      palletWood: new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.8 }),
      boxCardboard: new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.5 }),
      chairFabric: new THREE.MeshStandardMaterial({ color: 0x0369a1, roughness: 0.6 }),
      ledGreen: new THREE.MeshStandardMaterial({ color: 0x10b981, emissive: 0x10b981, emissiveIntensity: 0.8 }),
      ledRed: new THREE.MeshStandardMaterial({ color: 0xef4444, emissive: 0xef4444, emissiveIntensity: 0.8 }),
      ledAmber: new THREE.MeshStandardMaterial({ color: 0xf59e0b, emissive: 0xf59e0b, emissiveIntensity: 0.8 }),
      cameraLens: new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.1, metalness: 0.9 })
    };
  }

  // Initialize Three.js Scene
  function initThreeScene() {
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf1f5f9);
    scene.fog = new THREE.FogExp2(0xf1f5f9, 0.0032);

    camera = new THREE.PerspectiveCamera(42, window.innerWidth / window.innerHeight, 0.5, 1200);
    camera.position.set(80, 105, 95);

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

    controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.06;
    controls.maxPolarAngle = Math.PI / 2.04;
    controls.minDistance = 12;
    controls.maxDistance = 280;
    controls.target.set(0, 0, 0);

    initMaterials();
    setupCleanroomLighting();
    buildCompleteFactoryArchitecture();

    window.addEventListener('resize', onWindowResize);
    window.addEventListener('mousemove', onMouseMove);
    canvas.addEventListener('click', onCanvasClick);

    animate();
  }

  // Cleanroom Daylight Lighting Rig
  function setupCleanroomLighting() {
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.76);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0xffffff, 0.88);
    keyLight.position.set(70, 120, 55);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.width = 2048;
    keyLight.shadow.mapSize.height = 2048;
    keyLight.shadow.camera.near = 10;
    keyLight.shadow.camera.far = 320;
    keyLight.shadow.camera.left = -100;
    keyLight.shadow.camera.right = 100;
    keyLight.shadow.camera.top = 80;
    keyLight.shadow.camera.bottom = -80;
    keyLight.shadow.bias = -0.0004;
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0xe2e8f0, 0.45);
    fillLight.position.set(-80, 50, -60);
    scene.add(fillLight);

    const spotRight = new THREE.PointLight(0x0284c7, 0.55, 140);
    spotRight.position.set(45, 28, 15);
    scene.add(spotRight);

    const spotLeft = new THREE.PointLight(0x10b981, 0.4, 140);
    spotLeft.position.set(-45, 28, 0);
    scene.add(spotLeft);
  }

  // Helper: Create Robotic Arm
  function createDetailedRoboticArm(x, y, z) {
    const armGroup = new THREE.Group();
    armGroup.position.set(x, y, z);

    const baseGeo = new THREE.CylinderGeometry(0.75, 0.9, 0.5, 16);
    const baseMesh = new THREE.Mesh(baseGeo, MATS.machineBaseDark);
    baseMesh.castShadow = true;
    armGroup.add(baseMesh);

    const waistGeo = new THREE.CylinderGeometry(0.65, 0.65, 0.6, 16);
    const waistMesh = new THREE.Mesh(waistGeo, MATS.steelBright);
    waistMesh.position.y = 0.55;
    armGroup.add(waistMesh);

    const shoulderGeo = new THREE.SphereGeometry(0.5, 12, 12);
    const shoulderMesh = new THREE.Mesh(shoulderGeo, MATS.chemicalBlue);
    shoulderMesh.position.y = 1.1;
    armGroup.add(shoulderMesh);

    const armGeo = new THREE.BoxGeometry(0.4, 1.8, 0.4);
    const armMesh = new THREE.Mesh(armGeo, MATS.wallWhite);
    armMesh.position.set(0.2, 1.9, 0);
    armMesh.rotation.z = -0.25;
    armGroup.add(armMesh);

    const elbowGeo = new THREE.SphereGeometry(0.42, 12, 12);
    const elbowMesh = new THREE.Mesh(elbowGeo, MATS.chemicalBlue);
    elbowMesh.position.set(0.4, 2.8, 0);
    armGroup.add(elbowMesh);

    const forearmGeo = new THREE.BoxGeometry(0.35, 1.6, 0.35);
    const forearmMesh = new THREE.Mesh(forearmGeo, MATS.wallWhite);
    forearmMesh.position.set(0.7, 3.4, 0);
    forearmMesh.rotation.z = 0.45;
    armGroup.add(forearmMesh);

    const toolGeo = new THREE.CylinderGeometry(0.2, 0.1, 0.6, 12);
    const toolMesh = new THREE.Mesh(toolGeo, MATS.steelBright);
    toolMesh.position.set(1.1, 4.0, 0);
    armGroup.add(toolMesh);

    roboticArms.push(armGroup);
    return armGroup;
  }

  // Helper: Signal Stack Tower (Patlite Light)
  function createSignalTower(x, y, z) {
    const towerGroup = new THREE.Group();
    towerGroup.position.set(x, y, z);

    const stemGeo = new THREE.CylinderGeometry(0.06, 0.06, 1.8, 8);
    const stemMesh = new THREE.Mesh(stemGeo, MATS.steelBright);
    stemMesh.position.y = 0.9;
    towerGroup.add(stemMesh);

    const redGeo = new THREE.CylinderGeometry(0.14, 0.14, 0.25, 12);
    const redMesh = new THREE.Mesh(redGeo, MATS.ledRed);
    redMesh.position.y = 1.95;
    towerGroup.add(redMesh);

    const amberGeo = new THREE.CylinderGeometry(0.14, 0.14, 0.25, 12);
    const amberMesh = new THREE.Mesh(amberGeo, MATS.ledAmber);
    amberMesh.position.y = 2.25;
    towerGroup.add(amberMesh);

    const greenGeo = new THREE.CylinderGeometry(0.14, 0.14, 0.25, 12);
    const greenMesh = new THREE.Mesh(greenGeo, MATS.ledGreen);
    greenMesh.position.y = 2.55;
    towerGroup.add(greenMesh);

    return towerGroup;
  }

  // Helper: Operator Swivel Chair
  function createOperatorChair(x, y, z) {
    const chairGroup = new THREE.Group();
    chairGroup.position.set(x, y, z);

    const baseGeo = new THREE.CylinderGeometry(0.6, 0.6, 0.08, 10);
    const baseMesh = new THREE.Mesh(baseGeo, MATS.machineBaseDark);
    baseMesh.position.y = 0.1;
    chairGroup.add(baseMesh);

    const stemGeo = new THREE.CylinderGeometry(0.08, 0.08, 0.8, 8);
    const stemMesh = new THREE.Mesh(stemGeo, MATS.steelBright);
    stemMesh.position.y = 0.5;
    chairGroup.add(stemMesh);

    const seatGeo = new THREE.CylinderGeometry(0.7, 0.7, 0.16, 16);
    const seatMesh = new THREE.Mesh(seatGeo, MATS.chairFabric);
    seatMesh.position.y = 0.95;
    chairGroup.add(seatMesh);

    const backGeo = new THREE.BoxGeometry(0.7, 0.65, 0.12);
    const backMesh = new THREE.Mesh(backGeo, MATS.chairFabric);
    backMesh.position.set(0, 1.45, -0.35);
    chairGroup.add(backMesh);

    return chairGroup;
  }

  // Helper: Heavy-Duty Pallet Rack
  function createPalletRackUnit(x, z, width, levels = 3) {
    const rackGroup = new THREE.Group();
    rackGroup.position.set(x, 0, z);

    const uprightGeo = new THREE.BoxGeometry(0.25, 7.5, 2.4);
    const upL = new THREE.Mesh(uprightGeo, MATS.rackRed);
    upL.position.set(-width / 2, 3.75, 0);
    const upR = new THREE.Mesh(uprightGeo, MATS.rackRed);
    upR.position.set(width / 2, 3.75, 0);
    rackGroup.add(upL, upR);

    for (let l = 1; l <= levels; l++) {
      const beamY = l * 2.2;
      const beamGeo = new THREE.BoxGeometry(width, 0.18, 0.18);
      const bFront = new THREE.Mesh(beamGeo, MATS.rackOrange);
      bFront.position.set(0, beamY, 1.1);
      const bBack = new THREE.Mesh(beamGeo, MATS.rackOrange);
      bBack.position.set(0, beamY, -1.1);
      rackGroup.add(bFront, bBack);

      [-width / 4, width / 4].forEach((px) => {
        const palGeo = new THREE.BoxGeometry(width / 2.3, 0.22, 2.1);
        const palMesh = new THREE.Mesh(palGeo, MATS.palletWood);
        palMesh.position.set(px, beamY + 0.12, 0);
        rackGroup.add(palMesh);

        const boxGeo = new THREE.BoxGeometry(width / 2.6, 1.3, 1.8);
        const boxMesh = new THREE.Mesh(boxGeo, MATS.boxCardboard);
        boxMesh.position.set(px, beamY + 0.9, 0);
        boxMesh.castShadow = true;
        rackGroup.add(boxMesh);
      });
    }

    return rackGroup;
  }

  // =========================================================================
  // MASTER FACTORY ARCHITECTURE (100% BLUEPRINT REPLICATION)
  // =========================================================================
  function buildCompleteFactoryArchitecture() {
    const floorWidth = 160;
    const floorDepth = 92;

    // Floor & Slab
    const floorGeo = new THREE.PlaneGeometry(floorWidth, floorDepth);
    const floorMesh = new THREE.Mesh(floorGeo, MATS.floor);
    floorMesh.rotation.x = -Math.PI / 2;
    floorMesh.receiveShadow = true;
    scene.add(floorMesh);

    const slabGeo = new THREE.BoxGeometry(floorWidth + 4, 3.2, floorDepth + 4);
    const slabMesh = new THREE.Mesh(slabGeo, MATS.slab);
    slabMesh.position.y = -1.62;
    scene.add(slabMesh);

    // 1. Perimeter Walls & Architectural Partitions
    buildPerimeterAndRooms(floorWidth, floorDepth);

    // 2. ROOM 1: Pre-Packing Storage with Automated Inspection Cameras (Left Wing)
    buildRoom1PrePackingStorage();

    // 3. ROOM 2: Cleanroom Gowning & Locker Center (Top-Right)
    buildRoom2GowningCenter();

    // 4. ROOM 3: Machine Maintenance & Tooling Workshop (Top-Center-Left)
    buildRoom3MaintenanceWorkshop();

    // 5. ROOM 4: System Control & SCADA Engineering Office (Bottom-Right)
    buildRoom4SystemControlOffice();

    // 6. ZONE 04: Top-Center 5 HVAC Chiller Turbines
    buildDetailedHvacCluster();

    // 7. ZONE 01: Center-Right Heavy APFA Machine Cells (4 Massive Modules)
    buildDetailedApfaModules();

    // 8. ZONE 02: Far-Right Final Assembly & Test Lines (8 Conveyors)
    buildFarRightAssemblyLines();

    // 9. ZONE 03: Center Core Micro-Coil & Stepped Assembly Lines
    buildCenterCoreCoilAndLines();

    // 10. Chemical & Ultrasonic Cleaning Lines (Beside Room 1)
    buildChemicalCleaningLines();

    // 11. Southern Wall Logistics Buffer Racks
    buildSouthernLogisticsRacks(floorWidth);

    // 12. 3D Floating Interactive Pins
    createInteractiveZonePins();
  }

  // Perimeter Walls & Room Partitions
  function buildPerimeterAndRooms(w, d) {
    const wallH = 6.2;
    const wallT = 1.0;
    const halfW = w / 2;
    const halfD = d / 2;

    const wallsGroup = new THREE.Group();

    function addWall(x, z, width, depth, isGlass = false) {
      const geo = new THREE.BoxGeometry(width, wallH, depth);
      const mesh = new THREE.Mesh(geo, isGlass ? MATS.glassCleanroom : MATS.wallWhite);
      mesh.position.set(x, wallH / 2, z);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      wallsGroup.add(mesh);
    }

    // Outer Boundary
    addWall(0, halfD, w, wallT); // South
    addWall(0, -halfD, w, wallT); // North
    addWall(-halfW, 0, wallT, d); // West
    addWall(halfW, -22, wallT, 38); // East
    addWall(halfW, 4, wallT, 14, true); // East Glass
    addWall(halfW, 28, wallT, 34);

    // ROOM 1 Wall: Separating Pre-packing Room from Main Floor
    addWall(-60, 0, wallT, 76);

    // ROOM 3 Wall: Machine Maintenance Workshop
    addWall(-28, -34, wallT, 24);
    addWall(-20, -22, 16, wallT);

    // ROOM 2 Wall: Cleanroom Gowning Center
    addWall(36, -34, wallT, 24, true);
    addWall(56, -22, 42, wallT);

    // ROOM 4 Wall: System Control Office (Bottom-Right)
    addWall(54, 38, wallT, 16);
    addWall(66, 30, 26, wallT, true); // Observation Glass looking into plant!

    scene.add(wallsGroup);
  }

  // =========================================================================
  // 1. ROOM 1: PRE-PACKING COMPONENT STORAGE & CAMERA INSPECTION (LEFT WING)
  // "ห้องเก็บชิ้นงาน จะเป็นชั้นวางของเเล้วมีกล้องค่อยส่องตรวจดูความเรียบร้อบก่อนpackking"
  // =========================================================================
  function buildRoom1PrePackingStorage() {
    const roomGroup = new THREE.Group();

    // 5 Rows of Storage Racks with Overhead Automated Inspection Cameras
    for (let r = 0; r < 5; r++) {
      const zPos = -26 + r * 13;
      const xPos = -70;

      // Storage Shelf Rack
      roomGroup.add(createPalletRackUnit(xPos, zPos, 14, 3));

      // Overhead Inspection Camera Gantry System
      const gantryGeo = new THREE.BoxGeometry(14, 0.15, 0.15);
      const gantryMesh = new THREE.Mesh(gantryGeo, MATS.steelBright);
      gantryMesh.position.set(xPos, 7.2, zPos + 1.8);
      roomGroup.add(gantryMesh);

      // 2 Automated Inspection Cameras pointing downward at the shelves
      [-3.5, 3.5].forEach((cx) => {
        const camHousingGeo = new THREE.BoxGeometry(0.7, 0.5, 0.8);
        const camHousingMesh = new THREE.Mesh(camHousingGeo, MATS.wallWhite);
        camHousingMesh.position.set(xPos + cx, 6.9, zPos + 1.8);
        roomGroup.add(camHousingMesh);

        // Camera Lens
        const lensGeo = new THREE.CylinderGeometry(0.18, 0.18, 0.3, 12);
        const lensMesh = new THREE.Mesh(lensGeo, MATS.cameraLens);
        lensMesh.rotation.x = Math.PI / 4; // Angle scanning shelves
        lensMesh.position.set(xPos + cx, 6.7, zPos + 1.6);
        roomGroup.add(lensMesh);

        // Active Optical Laser Scan Beam (Cone of light)
        const beamGeo = new THREE.ConeGeometry(1.6, 4.8, 16, 1, true);
        const beamMat = new THREE.MeshBasicMaterial({
          color: 0x0284c7,
          transparent: true,
          opacity: 0.15,
          side: THREE.DoubleSide
        });
        const beamMesh = new THREE.Mesh(beamGeo, beamMat);
        beamMesh.position.set(xPos + cx, 4.4, zPos + 1.0);
        beamMesh.rotation.x = -0.3;
        roomGroup.add(beamMesh);
      });
    }

    scene.add(roomGroup);
  }

  // =========================================================================
  // 2. ROOM 2: CLEANROOM GOWNING & LOCKER CENTER (TOP-RIGHT)
  // "ห้องเเต่งตัวชุดห้องคลีนroom"
  // =========================================================================
  function buildRoom2GowningCenter() {
    const gownGroup = new THREE.Group();

    // 4 Rows of Gowning Benches and Changing Seats
    for (let row = 0; row < 4; row++) {
      const zPos = -42 + row * 6;
      const xPos = 60;

      // Stainless Steel Step-Over Gowning Bench
      const benchGeo = new THREE.BoxGeometry(26, 0.8, 1.4);
      const benchMesh = new THREE.Mesh(benchGeo, MATS.steelBright);
      benchMesh.position.set(xPos, 0.4, zPos);
      gownGroup.add(benchMesh);

      // Cleanroom Boot & Shoe Storage Racks below
      const shoeGeo = new THREE.BoxGeometry(25, 0.4, 1.2);
      const shoeMesh = new THREE.Mesh(shoeGeo, MATS.machineBaseDark);
      shoeMesh.position.set(xPos, 0.2, zPos);
      gownGroup.add(shoeMesh);
    }

    // Cleanroom ESD Lockers along the Northern Wall
    for (let lk = 40; lk <= 74; lk += 4.2) {
      const lockGeo = new THREE.BoxGeometry(3.8, 5.2, 1.6);
      const lockMesh = new THREE.Mesh(lockGeo, MATS.wallWhite);
      lockMesh.position.set(lk, 2.6, -45);
      gownGroup.add(lockMesh);
    }

    // Dual High-Velocity Air Shower Tunnels exiting into cleanroom
    [34, 40].forEach((ax) => {
      const cubGeo = new THREE.BoxGeometry(4.6, 5.4, 4.6);
      const cubMesh = new THREE.Mesh(cubGeo, MATS.steelBright);
      cubMesh.position.set(ax, 2.7, -22);
      gownGroup.add(cubMesh);

      // Glass Interlocked Sliding Doors
      const doorGeo = new THREE.BoxGeometry(4.0, 5.0, 0.2);
      const doorMesh = new THREE.Mesh(doorGeo, MATS.glassCleanroom);
      doorMesh.position.set(ax, 2.5, -19.6);
      gownGroup.add(doorMesh);
    });

    scene.add(gownGroup);
  }

  // =========================================================================
  // 3. ROOM 3: MACHINE MAINTENANCE & TOOLING WORKSHOP (TOP-CENTER-LEFT)
  // "ห้องซ่อมบำรุงเครื่องจัก"
  // =========================================================================
  function buildRoom3MaintenanceWorkshop() {
    const maintGroup = new THREE.Group();

    // Heavy Industrial Maintenance Workbenches
    for (let b = 0; b < 3; b++) {
      const bz = -42 + b * 7;
      const bx = -20;

      const benchGeo = new THREE.BoxGeometry(10, 1.6, 3.6);
      const benchMesh = new THREE.Mesh(benchGeo, MATS.steelDark);
      benchMesh.position.set(bx, 0.8, bz);
      benchMesh.castShadow = true;
      maintGroup.add(benchMesh);

      // Bench Vise and Tooling Fixture
      const viseGeo = new THREE.BoxGeometry(0.8, 0.8, 1.2);
      const viseMesh = new THREE.Mesh(viseGeo, MATS.steelBright);
      viseMesh.position.set(bx - 3.8, 2.0, bz);
      maintGroup.add(viseMesh);

      // Tool Chest / Drawer Cabinet
      const chestGeo = new THREE.BoxGeometry(3.2, 3.4, 1.8);
      const chestMesh = new THREE.Mesh(chestGeo, MATS.chemicalBlue);
      chestMesh.position.set(bx + 2.8, 1.7, bz - 1.2);
      maintGroup.add(chestMesh);
    }

    // High-Pressure Air Compressor & Hydraulic Power Pack Unit
    const compGeo = new THREE.CylinderGeometry(1.4, 1.4, 4.2, 16);
    const compMesh = new THREE.Mesh(compGeo, MATS.rackRed);
    compMesh.rotation.z = Math.PI / 2;
    compMesh.position.set(-20, 2.2, -26);
    maintGroup.add(compMesh);

    scene.add(maintGroup);
  }

  // =========================================================================
  // 4. ROOM 4: SYSTEM CONTROL & SCADA ENGINEERING OFFICE (BOTTOM-RIGHT)
  // "ห้องช่างควบคุมระบบ"
  // =========================================================================
  function buildRoom4SystemControlOffice() {
    const ctrlGroup = new THREE.Group();

    // Central SCADA Engineering Console Desk
    const deskGeo = new THREE.BoxGeometry(18, 1.6, 5.5);
    const deskMesh = new THREE.Mesh(deskGeo, MATS.wallWhite);
    deskMesh.position.set(68, 0.8, 38);
    deskMesh.castShadow = true;
    ctrlGroup.add(deskMesh);

    // Multi-Screen Control Video Wall
    for (let m = 0; m < 4; m++) {
      const monGeo = new THREE.BoxGeometry(3.2, 1.8, 0.2);
      const monMat = new THREE.MeshStandardMaterial({
        color: 0x0284c7,
        emissive: 0x0284c7,
        emissiveIntensity: 0.45
      });
      const monMesh = new THREE.Mesh(monGeo, monMat);
      monMesh.position.set(61 + m * 4.2, 2.4, 36.5);
      ctrlGroup.add(monMesh);
    }

    // 2 Shift Supervisor Ergonomic Swivel Chairs
    ctrlGroup.add(createOperatorChair(64, 0, 41.5));
    ctrlGroup.add(createOperatorChair(72, 0, 41.5));

    // SCADA Server Racks along east wall
    for (let sr = 34; sr <= 42; sr += 3.8) {
      const rackGeo = new THREE.BoxGeometry(2.2, 5.2, 3.2);
      const rackMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.2, metalness: 0.8 });
      const rackMesh = new THREE.Mesh(rackGeo, rackMat);
      rackMesh.position.set(78, 2.6, sr);
      ctrlGroup.add(rackMesh);
    }

    scene.add(ctrlGroup);
  }

  // ZONE 04: Top-Center 5 HVAC Chiller Units
  function buildDetailedHvacCluster() {
    const hvacGroup = new THREE.Group();
    const turbineR = 4.2;
    const turbineH = 5.2;

    const padGeo = new THREE.BoxGeometry(50, 1.0, 16);
    const padMesh = new THREE.Mesh(padGeo, MATS.steelDark);
    padMesh.position.set(4, 0.5, -34);
    padMesh.castShadow = true;
    hvacGroup.add(padMesh);

    const startX = -15;
    const stepX = 9.5;

    for (let i = 0; i < 5; i++) {
      const cx = startX + i * stepX;
      const cz = -34;

      const tankGeo = new THREE.CylinderGeometry(turbineR, turbineR, turbineH, 28);
      const tankMesh = new THREE.Mesh(tankGeo, MATS.wallWhite);
      tankMesh.position.set(cx, turbineH / 2 + 1.0, cz);
      tankMesh.castShadow = true;
      hvacGroup.add(tankMesh);

      const domeGeo = new THREE.SphereGeometry(turbineR * 0.95, 20, 12, 0, Math.PI * 2, 0, Math.PI / 2);
      const domeMesh = new THREE.Mesh(domeGeo, MATS.steelBright);
      domeMesh.position.set(cx, turbineH + 1.0, cz);
      hvacGroup.add(domeMesh);

      const fanGroup = new THREE.Group();
      fanGroup.position.set(cx, turbineH + 1.2, cz);

      for (let b = 0; b < 4; b++) {
        const bladeGeo = new THREE.BoxGeometry(turbineR * 1.6, 0.08, 0.75);
        const bladeMesh = new THREE.Mesh(bladeGeo, MATS.machineBaseDark);
        bladeMesh.rotation.y = (b * Math.PI) / 2;
        bladeMesh.rotation.x = 0.25;
        fanGroup.add(bladeMesh);
      }

      hvacGroup.add(fanGroup);
      spinningFans.push(fanGroup);

      const valveGeo = new THREE.CylinderGeometry(0.35, 0.35, 1.4, 12);
      const valveMesh = new THREE.Mesh(valveGeo, MATS.chemicalBlue);
      valveMesh.rotation.z = Math.PI / 2;
      valveMesh.position.set(cx + 2.5, 2.2, cz + turbineR);
      hvacGroup.add(valveMesh);
    }

    const mainPipeGeo = new THREE.CylinderGeometry(1.1, 1.1, 52, 16);
    const mainPipeMesh = new THREE.Mesh(mainPipeGeo, MATS.steelBright);
    mainPipeMesh.rotation.z = Math.PI / 2;
    mainPipeMesh.position.set(4, 5.8, -40);
    hvacGroup.add(mainPipeMesh);

    scene.add(hvacGroup);
  }

  // ZONE 01: Center-Right Heavy APFA Machine Cells (4 Massive Modules)
  function buildDetailedApfaModules() {
    const apfaGroup = new THREE.Group();

    const moduleCoords = [
      { x: 32, z: -4 },
      { x: 32, z: 8 },
      { x: 32, z: 20 },
      { x: 32, z: 32 }
    ];

    moduleCoords.forEach((coord) => {
      const baseGeo = new THREE.BoxGeometry(32, 1.1, 7.5);
      const baseMesh = new THREE.Mesh(baseGeo, MATS.machineBaseDark);
      baseMesh.position.set(coord.x, 0.55, coord.z);
      baseMesh.castShadow = true;
      baseMesh.receiveShadow = true;
      apfaGroup.add(baseMesh);

      const convGeo = new THREE.BoxGeometry(32, 0.4, 2.2);
      const convMesh = new THREE.Mesh(convGeo, MATS.conveyorBelt);
      convMesh.position.set(coord.x, 1.3, coord.z);
      apfaGroup.add(convMesh);

      for (let c = 0; c < 3; c++) {
        const cx = coord.x - 10 + c * 10;

        const bodyGeo = new THREE.BoxGeometry(8.2, 4.2, 6.8);
        const bodyMesh = new THREE.Mesh(bodyGeo, MATS.machineChassis);
        bodyMesh.position.set(cx, 3.2, coord.z);
        bodyMesh.castShadow = true;
        apfaGroup.add(bodyMesh);

        const hoodGeo = new THREE.BoxGeometry(7.4, 2.6, 6.2);
        const hoodMesh = new THREE.Mesh(hoodGeo, MATS.acrylicHood);
        hoodMesh.position.set(cx, 3.4, coord.z);
        apfaGroup.add(hoodMesh);

        createDetailedRoboticArm(cx, 1.5, coord.z);
        apfaGroup.add(createSignalTower(cx + 3.2, 5.3, coord.z - 2.8));

        const hmiGeo = new THREE.BoxGeometry(1.6, 1.2, 0.18);
        const hmiMesh = new THREE.Mesh(hmiGeo, MATS.steelBright);
        hmiMesh.position.set(cx - 3.2, 4.0, coord.z + 3.6);
        hmiMesh.rotation.y = 0.35;
        apfaGroup.add(hmiMesh);
      }
    });

    scene.add(apfaGroup);
  }

  // ZONE 02: Far-Right Final Assembly & Test Lines (8 Horizontal Lines)
  function buildFarRightAssemblyLines() {
    const lineGroup = new THREE.Group();
    const startZ = -14;
    const stepZ = 6.2;

    for (let l = 0; l < 8; l++) {
      const zPos = startZ + l * stepZ;
      const xPos = 64;
      const trackLength = 25;

      const trackGeo = new THREE.BoxGeometry(trackLength, 0.85, 2.8);
      const trackMesh = new THREE.Mesh(trackGeo, MATS.conveyorBelt);
      trackMesh.position.set(xPos, 1.2, zPos);
      trackMesh.castShadow = true;
      trackMesh.receiveShadow = true;
      lineGroup.add(trackMesh);

      for (let leg = -trackLength / 2 + 2; leg <= trackLength / 2 - 2; leg += 6.5) {
        const legGeo = new THREE.CylinderGeometry(0.18, 0.18, 1.2, 8);
        const legMesh = new THREE.Mesh(legGeo, MATS.steelBright);
        legMesh.position.set(xPos + leg, 0.6, zPos);
        lineGroup.add(legMesh);
      }

      const railGeo = new THREE.BoxGeometry(trackLength, 0.12, 0.12);
      const railMesh = new THREE.Mesh(railGeo, MATS.steelBright);
      railMesh.position.set(xPos, 3.8, zPos);
      lineGroup.add(railMesh);

      for (let s = 0; s < 4; s++) {
        const sx = xPos - 8 + s * 5.5;
        lineGroup.add(createOperatorChair(sx, 0, zPos + 2.6));

        const binGeo = new THREE.BoxGeometry(1.6, 0.8, 0.9);
        const binMesh = new THREE.Mesh(binGeo, MATS.chemicalBlue);
        binMesh.position.set(sx, 2.0, zPos - 1.2);
        lineGroup.add(binMesh);
      }
    }

    scene.add(lineGroup);
  }

  // ZONE 03: Center Core Micro-Coil & Stepped Assembly Lines
  function buildCenterCoreCoilAndLines() {
    const centerGroup = new THREE.Group();

    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 5; c++) {
        const wx = -20 + c * 5.8;
        const wz = -20 + r * 4.2;

        const benchGeo = new THREE.BoxGeometry(4.4, 2.2, 3.2);
        const benchMesh = new THREE.Mesh(benchGeo, MATS.machineChassis);
        benchMesh.position.set(wx, 1.1, wz);
        benchMesh.castShadow = true;
        centerGroup.add(benchMesh);

        const spoolGeo = new THREE.CylinderGeometry(0.5, 0.5, 0.6, 16);
        const spoolMat = new THREE.MeshStandardMaterial({ color: 0xb45309, metalness: 0.8, roughness: 0.2 });
        const spoolMesh = new THREE.Mesh(spoolGeo, spoolMat);
        spoolMesh.position.set(wx + 1.2, 2.6, wz);
        centerGroup.add(spoolMesh);
      }
    }

    const xLines = [-14, -6, 2, 10];
    xLines.forEach((lx) => {
      const lineLen = 30;
      const lz = 12;

      const tblGeo = new THREE.BoxGeometry(3.6, 1.6, lineLen);
      const tblMesh = new THREE.Mesh(tblGeo, MATS.wallWhite);
      tblMesh.position.set(lx, 0.8, lz);
      tblMesh.castShadow = true;
      centerGroup.add(tblMesh);

      for (let cz = lz - lineLen / 2 + 2.5; cz <= lz + lineLen / 2 - 2.5; cz += 5.2) {
        centerGroup.add(createOperatorChair(lx + 2.8, 0, cz));
      }
    });

    scene.add(centerGroup);
  }

  // Chemical & Ultrasonic Cleaning Lines
  function buildChemicalCleaningLines() {
    const chemGroup = new THREE.Group();
    const xChem = [-52, -44, -36];

    xChem.forEach((cx) => {
      const cz = 5;
      const len = 42;

      const panGeo = new THREE.BoxGeometry(4.8, 0.4, len);
      const panMesh = new THREE.Mesh(panGeo, MATS.steelBright);
      panMesh.position.set(cx, 0.2, cz);
      chemGroup.add(panMesh);

      for (let tz = cz - len / 2 + 3; tz <= cz + len / 2 - 3; tz += 6.5) {
        const tankGeo = new THREE.BoxGeometry(4.2, 3.2, 5.2);
        const tankMesh = new THREE.Mesh(tankGeo, MATS.chemicalBlue);
        tankMesh.position.set(cx, 1.8, tz);
        tankMesh.castShadow = true;
        chemGroup.add(tankMesh);

        const liqGeo = new THREE.PlaneGeometry(3.8, 4.6);
        const liqMesh = new THREE.Mesh(liqGeo, MATS.chemicalLiquid);
        liqMesh.rotation.x = -Math.PI / 2;
        liqMesh.position.set(cx, 3.25, tz);
        chemGroup.add(liqMesh);

        const hoodGeo = new THREE.BoxGeometry(4.4, 1.2, 5.4);
        const hoodMesh = new THREE.Mesh(hoodGeo, MATS.steelDark);
        hoodMesh.position.set(cx, 5.2, tz);
        chemGroup.add(hoodMesh);
      }
    });

    scene.add(chemGroup);
  }

  // Southern Logistics Buffer Racks
  function buildSouthernLogisticsRacks(w) {
    const logGroup = new THREE.Group();
    const zPos = 40;
    const bayW = 14;

    for (let rx = -w / 2 + 10; rx <= w / 2 - 28; rx += bayW + 1.2) {
      logGroup.add(createPalletRackUnit(rx, zPos, bayW, 3));
    }

    scene.add(logGroup);
  }

  // Create 3D Interactive Floating Beacon Pins over Rooms and Zones
  function createInteractiveZonePins() {
    const pinConfigs = [
      { id: 'prepack', name: 'ROOM 1: PRE-PACK & AOI', pos: new THREE.Vector3(-68, 8.5, 2) },
      { id: 'gowning', name: 'ROOM 2: GOWNING CENTER', pos: new THREE.Vector3(56, 8.5, -34) },
      { id: 'maintenance', name: 'ROOM 3: MAINTENANCE', pos: new THREE.Vector3(-20, 8.5, -32) },
      { id: 'control', name: 'ROOM 4: SYSTEM CONTROL', pos: new THREE.Vector3(68, 8.5, 38) },
      { id: 'apfa', name: '05 APFA AUTOMATION', pos: new THREE.Vector3(32, 9.5, 9) },
      { id: 'hvac', name: '06 HVAC CHILLER (5)', pos: new THREE.Vector3(4, 9.5, -34) }
    ];

    pinConfigs.forEach((cfg) => {
      const pinGroup = new THREE.Group();
      pinGroup.position.copy(cfg.pos);
      pinGroup.userData = { zoneId: cfg.id };

      const ringGeo = new THREE.RingGeometry(1.8, 2.5, 32);
      const ringMat = new THREE.MeshBasicMaterial({
        color: 0x0284c7,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.65
      });
      const ringMesh = new THREE.Mesh(ringGeo, ringMat);
      ringMesh.rotation.x = -Math.PI / 2;
      ringMesh.position.y = -cfg.pos.y + 0.1;
      pinGroup.add(ringMesh);

      const lineGeo = new THREE.CylinderGeometry(0.08, 0.08, cfg.pos.y, 8);
      const lineMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.5 });
      const lineMesh = new THREE.Mesh(lineGeo, lineMat);
      lineMesh.position.y = -cfg.pos.y / 2;
      pinGroup.add(lineMesh);

      const octGeo = new THREE.OctahedronGeometry(1.4, 0);
      const octMat = new THREE.MeshStandardMaterial({
        color: 0xffffff,
        emissive: 0x0284c7,
        emissiveIntensity: 0.7,
        roughness: 0.2,
        metalness: 0.8
      });
      const octMesh = new THREE.Mesh(octGeo, octMat);
      octMesh.castShadow = true;
      pinGroup.add(octMesh);

      const labelCanvas = document.createElement('canvas');
      labelCanvas.width = 460;
      labelCanvas.height = 96;
      const lctx = labelCanvas.getContext('2d');
      lctx.fillStyle = 'rgba(15, 23, 42, 0.88)';
      lctx.roundRect(10, 10, 440, 76, 18);
      lctx.fill();
      lctx.strokeStyle = 'rgba(255, 255, 255, 0.55)';
      lctx.lineWidth = 2;
      lctx.roundRect(10, 10, 440, 76, 18);
      lctx.stroke();

      lctx.fillStyle = '#ffffff';
      lctx.font = 'bold 26px -apple-system, sans-serif';
      lctx.textAlign = 'center';
      lctx.textBaseline = 'middle';
      lctx.fillText(cfg.name, 230, 48);

      const labelTex = new THREE.CanvasTexture(labelCanvas);
      const spriteMat = new THREE.SpriteMaterial({ map: labelTex, depthTest: false });
      const sprite = new THREE.Sprite(spriteMat);
      sprite.scale.set(8.2, 1.8, 1);
      sprite.position.y = 2.6;
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

    document.querySelectorAll('.zone-pill').forEach((pill) => {
      pill.classList.toggle('active', pill.getAttribute('data-zone') === zoneKey);
    });

    flyCameraTo(data.camPos, data.lookAt);

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

    spinningFans.forEach((fan) => {
      fan.rotation.y += 0.08;
    });

    const t = performance.now() * 0.0015;
    roboticArms.forEach((arm, idx) => {
      const forearm = arm.children[4];
      if (forearm) {
        forearm.rotation.z = 0.45 + Math.sin(t + idx) * 0.15;
      }
    });

    interactivePins.forEach((pin, i) => {
      const oct = pin.children.find((c) => c.geometry && c.geometry.type === 'OctahedronGeometry');
      if (oct) {
        oct.rotation.y += 0.02;
        oct.position.y = Math.sin(t * 1.5 + i) * 0.35;
      }
    });

    if (isTransitioning) {
      transitionProgress += transitionSpeed;
      if (transitionProgress >= 1) {
        transitionProgress = 1;
        isTransitioning = false;
      }
      const easeT = 1 - Math.pow(1 - transitionProgress, 3);
      camera.position.lerpVectors(camStartPos, camTargetPos, easeT);
      controls.target.lerpVectors(lookStart, lookTarget, easeT);
    }

    controls.update();
    renderer.render(scene, camera);
  }

  // UI Button Bindings
  function initUI() {
    document.querySelectorAll('.zone-pill').forEach((pill) => {
      pill.addEventListener('click', () => {
        const zone = pill.getAttribute('data-zone');
        selectZone(zone);
      });
      pill.addEventListener('mouseenter', () => soundEngine.playHover());
    });

    const btnIso = document.getElementById('btnIsometricView');
    const btnTop = document.getElementById('btnTopDownView');
    const btnReset = document.getElementById('btnResetCamera');

    if (btnIso) {
      btnIso.addEventListener('click', () => {
        btnIso.classList.add('active');
        if (btnTop) btnTop.classList.remove('active');
        flyCameraTo({ x: 80, y: 105, z: 95 }, { x: 0, y: 0, z: 0 });
      });
    }

    if (btnTop) {
      btnTop.addEventListener('click', () => {
        btnTop.classList.add('active');
        if (btnIso) btnIso.classList.remove('active');
        flyCameraTo({ x: 0, y: 155, z: 0.1 }, { x: 0, y: 0, z: 0 });
      });
    }

    if (btnReset) {
      btnReset.addEventListener('click', () => {
        selectZone('all');
      });
    }

    if (closeInspectorBtn) {
      closeInspectorBtn.addEventListener('click', () => {
        zoneInspectorCard.classList.remove('is-visible');
        zoneInspectorCard.setAttribute('aria-hidden', 'true');
        soundEngine.playClick();
      });
    }

    initLogoutModal();
  }

  // Logout Modal with Typewriter Animation
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

  // DOM ready
  document.addEventListener('DOMContentLoaded', () => {
    initThreeScene();
    initUI();
  });
})();
