/**
 * DIGITAL TWIN · 3D SMART FACTORY CONTROLLER (HYPER-DETAILED EDITION)
 * Belton Technology Group · Navanakorn Plant 2nd Floor
 * Authentic 1:1 Scale & Component Replication from Architectural Blueprint
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
      desc: 'Complete architectural layout of Belton Navanakorn Plant 2nd Floor. Every machine line, conveyor track, HVAC turbine, and chemical station is modeled 1:1 to the CAD blueprint.',
      bays: '7 Functional Sectors · 84 Total Machine Workcells',
      tolerance: '±0.0002 mm (Sub-Micron Engineering Standard)',
      tact: 'High-Volume Continuous Production',
      cleanroom: 'ISO Class 100 / Class 1000 Regulated Cleanroom',
      blueprint: 'Full Facility Boundary (Grids A1 through H8)',
      camPos: { x: 80, y: 105, z: 95 },
      lookAt: { x: 0, y: 0, z: 0 }
    },
    apfa: {
      title: 'ZONE 01: APFA AUTOMATION CELLS',
      desc: 'Heavy dual-bay automated robotic assembly cells. High-precision pick-and-place gantry systems inside illuminated acrylic clean enclosures.',
      bays: '4 Massive Dual Machine Enclosures (16 Sub-stations)',
      tolerance: '±0.0002 mm (Laser Optical Guidance)',
      tact: '0.42 sec / component',
      cleanroom: 'ISO 5 (Class 100) HEPA Laminar Downflow',
      blueprint: 'Center-Right Heavy Machine Grid (Grids C2-E4)',
      camPos: { x: 38, y: 36, z: 32 },
      lookAt: { x: 31, y: 3, z: 9 }
    },
    assembly: {
      title: 'ZONE 02: FINAL ASSEMBLY & TEST LINES',
      desc: '8 parallel motorized conveyor tracks with dual-sided ESD technician benches, overhead magnifying lamps, and automated electronic test fixtures.',
      bays: '8 Parallel Dual Conveyor Lines (48 Workstations)',
      tolerance: '100% In-Line Electrical & Dynamic Signal Test',
      tact: '0.35 sec / assembly throughput',
      cleanroom: 'ISO 6 (Class 1000) Continuous Laminar',
      blueprint: 'Far-Right Horizontal Conveyor Array (Grids F2-H6)',
      camPos: { x: 68, y: 34, z: 28 },
      lookAt: { x: 62, y: 2, z: 8 }
    },
    coil: {
      title: 'ZONE 03: MICRO-COIL & OPERATOR ASSEMBLY',
      desc: '4 vertical process bays with operator seating stations and a 4x5 grid of high-speed micro-wire voice coil winders with copper spools.',
      bays: '4 Stepped Lines + 20 Automated Winders',
      tolerance: '±0.0005 mm Concentricity & Tension Control',
      tact: '0.58 sec / coil assembly',
      cleanroom: 'ISO 5 Laminar Clean Flow Benches',
      blueprint: 'Center Core Assembly Lines (Grids B2-D5)',
      camPos: { x: -4, y: 32, z: 26 },
      lookAt: { x: -10, y: 2, z: 4 }
    },
    hvac: {
      title: 'ZONE 04: HVAC CHILLER & AIR SYSTEM',
      desc: '5 industrial cylindrical chillers with spinning aerodynamic fan blades, protective steel domes, and ceiling supply duct manifolds.',
      bays: '5 Heavy Industrial Chiller Turbines',
      tolerance: '1,240 CFM Constant Velocity Positive Pressure',
      tact: '24/7 Redundant Air Filtration System',
      cleanroom: '99.997% HEPA Filtration at 0.3 Microns',
      blueprint: 'Top-Center Plant Utility Boundary (Grid D1)',
      camPos: { x: 6, y: 32, z: -10 },
      lookAt: { x: 4, y: 4, z: -32 }
    },
    chemical: {
      title: 'ZONE 05: CHEMICAL & ULTRASONIC CLEANING',
      desc: '4 multi-stage vertical ultrasonic wash lines, chemical degreasing tanks, deionized water rinse stations, and hot air drying ovens.',
      bays: '4 Vertical Automated Ultrasonic Lines',
      tolerance: 'Sub-Micron Particulate & Residue Cleanliness',
      tact: 'Batch Ultrasonic Immersion & Agitation',
      cleanroom: 'ISO 5 Chemical Scrubbed & Exhausted Bay',
      blueprint: 'Far-Left Process Boundary (Grids A2-A6)',
      camPos: { x: -55, y: 34, z: 24 },
      lookAt: { x: -58, y: 2, z: 4 }
    },
    logistics: {
      title: 'ZONE 06: BUFFER RACKS & LOGISTICS',
      desc: 'High-bay structural steel pallet racking in industrial safety orange-red, holding raw components and WIP buffers along the southern wall.',
      bays: 'Full-Span Heavy-Duty Pallet Racking Units',
      tolerance: 'Automated Guided Vehicle (AGV) Laser Guided',
      tact: 'Continuous Material Replenishment Flow',
      cleanroom: 'Anti-Static ESD Containerized Pallets',
      blueprint: 'Southern Wall Logistics Boundary (Grids A7-H7)',
      camPos: { x: 10, y: 28, z: 58 },
      lookAt: { x: 5, y: 2, z: 38 }
    }
  };

  // High-Resolution Procedural Floor Texture
  function generateEpoxyFloorTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 2048;
    canvas.height = 1280;
    const ctx = canvas.getContext('2d');

    // Cleanroom Daylight White Base
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Architectural Tile Grid (1m grid lines)
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
    // Main horizontal artery across the plant
    ctx.fillRect(60, 540, canvas.width - 120, 110);
    // Vertical crossing arteries
    ctx.fillRect(520, 120, 80, canvas.height - 240);
    ctx.fillRect(1080, 120, 80, canvas.height - 240);
    ctx.fillRect(1520, 120, 80, canvas.height - 240);

    // Hazard Safety Striping (Yellow/Black Borders matching blueprint sectors)
    function drawHazardBox(x, y, w, h, label) {
      ctx.strokeStyle = 'rgba(234, 179, 8, 0.7)';
      ctx.lineWidth = 3;
      ctx.setLineDash([8, 6]);
      ctx.strokeRect(x, y, w, h);
      ctx.setLineDash([]);

      if (label) {
        ctx.fillStyle = 'rgba(100, 116, 139, 0.6)';
        ctx.font = 'bold 16px "Space Mono", monospace';
        ctx.fillText(label, x + 12, y + 24);
      }
    }

    // Mark sectors based on blueprint
    drawHazardBox(60, 200, 380, 820, 'SECTOR A: CHEMICAL CLEANING');
    drawHazardBox(480, 200, 540, 820, 'SECTOR B: MICRO-COIL WINDING');
    drawHazardBox(1080, 360, 420, 660, 'SECTOR C: APFA ROBOTICS');
    drawHazardBox(1520, 260, 480, 760, 'SECTOR D: ASSEMBLY & TEST');
    drawHazardBox(760, 60, 560, 220, 'SECTOR E: HVAC CHILLER');
    drawHazardBox(1360, 60, 640, 220, 'SECTOR F: ENGINEERING & AIRLOCK');
    drawHazardBox(60, 1080, 1940, 140, 'SECTOR G: LOGISTICS BUFFER RACKS');

    const texture = new THREE.CanvasTexture(canvas);
    return texture;
  }

  // Brushed Metal & Control Panel Texture
  function generatePanelTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#e2e8f0';
    ctx.fillRect(0, 0, 512, 512);

    // Bevel shading
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 4;
    ctx.strokeRect(4, 4, 504, 504);

    // Digital touchscreen UI mock
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(40, 40, 200, 120);
    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 18px monospace';
    ctx.fillText('STATUS: OK', 55, 75);
    ctx.fillStyle = '#10b981';
    ctx.fillText('SPEED: 100%', 55, 110);
    ctx.fillStyle = '#e2e8f0';
    ctx.fillText('YIELD: 99.98%', 55, 140);

    // Machine vent louvers
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
      ledAmber: new THREE.MeshStandardMaterial({ color: 0xf59e0b, emissive: 0xf59e0b, emissiveIntensity: 0.8 })
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

    // Accent Highlights over machine bays
    const spotRight = new THREE.PointLight(0x0284c7, 0.55, 140);
    spotRight.position.set(45, 28, 15);
    scene.add(spotRight);

    const spotLeft = new THREE.PointLight(0x10b981, 0.4, 140);
    spotLeft.position.set(-45, 28, 0);
    scene.add(spotLeft);
  }

  // =========================================================================
  // DETAILED PROCEDURAL MODELING COMPONENTS
  // =========================================================================

  // Helper: Create Articulated Robotic Arm with Pedestal & Tool Head
  function createDetailedRoboticArm(x, y, z) {
    const armGroup = new THREE.Group();
    armGroup.position.set(x, y, z);

    // Pedestal Base
    const baseGeo = new THREE.CylinderGeometry(0.75, 0.9, 0.5, 16);
    const baseMesh = new THREE.Mesh(baseGeo, MATS.machineBaseDark);
    baseMesh.castShadow = true;
    armGroup.add(baseMesh);

    // Swivel Waist Joint
    const waistGeo = new THREE.CylinderGeometry(0.65, 0.65, 0.6, 16);
    const waistMesh = new THREE.Mesh(waistGeo, MATS.steelBright);
    waistMesh.position.y = 0.55;
    armGroup.add(waistMesh);

    // Shoulder & Lower Arm
    const shoulderGeo = new THREE.SphereGeometry(0.5, 12, 12);
    const shoulderMesh = new THREE.Mesh(shoulderGeo, MATS.chemicalBlue);
    shoulderMesh.position.y = 1.1;
    armGroup.add(shoulderMesh);

    const armGeo = new THREE.BoxGeometry(0.4, 1.8, 0.4);
    const armMesh = new THREE.Mesh(armGeo, MATS.wallWhite);
    armMesh.position.set(0.2, 1.9, 0);
    armMesh.rotation.z = -0.25;
    armGroup.add(armMesh);

    // Elbow Joint & Forearm
    const elbowGeo = new THREE.SphereGeometry(0.42, 12, 12);
    const elbowMesh = new THREE.Mesh(elbowGeo, MATS.chemicalBlue);
    elbowMesh.position.set(0.4, 2.8, 0);
    armGroup.add(elbowMesh);

    const forearmGeo = new THREE.BoxGeometry(0.35, 1.6, 0.35);
    const forearmMesh = new THREE.Mesh(forearmGeo, MATS.wallWhite);
    forearmMesh.position.set(0.7, 3.4, 0);
    forearmMesh.rotation.z = 0.45;
    armGroup.add(forearmMesh);

    // Vacuum End-Effector Gripper Tool
    const toolGeo = new THREE.CylinderGeometry(0.2, 0.1, 0.6, 12);
    const toolMesh = new THREE.Mesh(toolGeo, MATS.steelBright);
    toolMesh.position.set(1.1, 4.0, 0);
    armGroup.add(toolMesh);

    roboticArms.push(armGroup);
    return armGroup;
  }

  // Helper: Create 3-Tier Signal Stack Tower (Patlite Light)
  function createSignalTower(x, y, z) {
    const towerGroup = new THREE.Group();
    towerGroup.position.set(x, y, z);

    // Stem pole
    const stemGeo = new THREE.CylinderGeometry(0.06, 0.06, 1.8, 8);
    const stemMesh = new THREE.Mesh(stemGeo, MATS.steelBright);
    stemMesh.position.y = 0.9;
    towerGroup.add(stemMesh);

    // Red Light
    const redGeo = new THREE.CylinderGeometry(0.14, 0.14, 0.25, 12);
    const redMesh = new THREE.Mesh(redGeo, MATS.ledRed);
    redMesh.position.y = 1.95;
    towerGroup.add(redMesh);

    // Amber Light
    const amberGeo = new THREE.CylinderGeometry(0.14, 0.14, 0.25, 12);
    const amberMesh = new THREE.Mesh(amberGeo, MATS.ledAmber);
    amberMesh.position.y = 2.25;
    towerGroup.add(amberMesh);

    // Green Light (Active)
    const greenGeo = new THREE.CylinderGeometry(0.14, 0.14, 0.25, 12);
    const greenMesh = new THREE.Mesh(greenGeo, MATS.ledGreen);
    greenMesh.position.y = 2.55;
    towerGroup.add(greenMesh);

    return towerGroup;
  }

  // Helper: Create Operator Swivel Chair
  function createOperatorChair(x, y, z) {
    const chairGroup = new THREE.Group();
    chairGroup.position.set(x, y, z);

    // 5-Star Base & Stem
    const baseGeo = new THREE.CylinderGeometry(0.6, 0.6, 0.08, 10);
    const baseMesh = new THREE.Mesh(baseGeo, MATS.machineBaseDark);
    baseMesh.position.y = 0.1;
    chairGroup.add(baseMesh);

    const stemGeo = new THREE.CylinderGeometry(0.08, 0.08, 0.8, 8);
    const stemMesh = new THREE.Mesh(stemGeo, MATS.steelBright);
    stemMesh.position.y = 0.5;
    chairGroup.add(stemMesh);

    // Seat Cushion
    const seatGeo = new THREE.CylinderGeometry(0.7, 0.7, 0.16, 16);
    const seatMesh = new THREE.Mesh(seatGeo, MATS.chairFabric);
    seatMesh.position.y = 0.95;
    chairGroup.add(seatMesh);

    // Backrest
    const backGeo = new THREE.BoxGeometry(0.7, 0.65, 0.12);
    const backMesh = new THREE.Mesh(backGeo, MATS.chairFabric);
    backMesh.position.set(0, 1.45, -0.35);
    chairGroup.add(backMesh);

    return chairGroup;
  }

  // Helper: Create Heavy-Duty Pallet Rack Bay
  function createPalletRackUnit(x, z, width, levels = 3) {
    const rackGroup = new THREE.Group();
    rackGroup.position.set(x, 0, z);

    // Upright End Frames
    const uprightGeo = new THREE.BoxGeometry(0.25, 7.5, 2.4);
    const upL = new THREE.Mesh(uprightGeo, MATS.rackRed);
    upL.position.set(-width / 2, 3.75, 0);
    const upR = new THREE.Mesh(uprightGeo, MATS.rackRed);
    upR.position.set(width / 2, 3.75, 0);
    rackGroup.add(upL, upR);

    // Shelf Beams and Loaded Pallets
    for (let l = 1; l <= levels; l++) {
      const beamY = l * 2.2;

      // Crossbeams
      const beamGeo = new THREE.BoxGeometry(width, 0.18, 0.18);
      const bFront = new THREE.Mesh(beamGeo, MATS.rackOrange);
      bFront.position.set(0, beamY, 1.1);
      const bBack = new THREE.Mesh(beamGeo, MATS.rackOrange);
      bBack.position.set(0, beamY, -1.1);
      rackGroup.add(bFront, bBack);

      // 2 Pallets on each shelf level
      [-width / 4, width / 4].forEach((px) => {
        const palGeo = new THREE.BoxGeometry(width / 2.3, 0.22, 2.1);
        const palMesh = new THREE.Mesh(palGeo, MATS.palletWood);
        palMesh.position.set(px, beamY + 0.12, 0);
        rackGroup.add(palMesh);

        // Cardboard Product Boxes on Pallet
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
  // MASTER FACTORY ARCHITECTURE (100% COMPLETE CAD BLUEPRINT REPLICATION)
  // =========================================================================
  function buildCompleteFactoryArchitecture() {
    const floorWidth = 160;
    const floorDepth = 92;

    // 1. Epoxy Floor & Foundation Slab
    const floorGeo = new THREE.PlaneGeometry(floorWidth, floorDepth);
    const floorMesh = new THREE.Mesh(floorGeo, MATS.floor);
    floorMesh.rotation.x = -Math.PI / 2;
    floorMesh.receiveShadow = true;
    scene.add(floorMesh);

    const slabGeo = new THREE.BoxGeometry(floorWidth + 4, 3.2, floorDepth + 4);
    const slabMesh = new THREE.Mesh(slabGeo, MATS.slab);
    slabMesh.position.y = -1.62;
    scene.add(slabMesh);

    // 2. Perimeter Walls with Glass Observation Ports
    buildPerimeterAndRooms(floorWidth, floorDepth);

    // 3. Zone 04: Top-Center 5 HVAC Chiller Turbines
    buildDetailedHvacCluster();

    // 4. Zone 01: Center-Right Heavy APFA Machine Cells (4 Massive Modules)
    buildDetailedApfaModules();

    // 5. Zone 02: Far-Right Final Assembly & Test Lines (8 Conveyors)
    buildFarRightAssemblyLines();

    // 6. Zone 03: Center Core Micro-Coil & Stepped Assembly Lines
    buildCenterCoreCoilAndLines();

    // 7. Zone 05: Far-Left Chemical & Ultrasonic Wash Lines (4 Vertical Lines)
    buildChemicalCleaningLines();

    // 8. Zone 06: Southern Wall High-Bay Pallet Racks (Full Length)
    buildSouthernLogisticsRacks(floorWidth);

    // 9. Top-Left Cleanroom Gowning Room & Air Shower Airlocks
    buildGowningAndAirShowers();

    // 10. Top-Right Engineering & Conference Hub
    buildEngineeringAndControlOffice();

    // 11. 3D Floating Interactive Pins
    createInteractiveZonePins();
  }

  // Perimeter Walls, Gowning Airlock, and Office Partitions
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

    // Outer Boundary Walls
    addWall(0, halfD, w, wallT); // South
    addWall(0, -halfD, w, wallT); // North
    addWall(-halfW, 0, wallT, d); // West
    // East wall with observation glass
    addWall(halfW, -22, wallT, 38);
    addWall(halfW, 4, wallT, 14, true); // Glass view
    addWall(halfW, 28, wallT, 34);

    // Internal Cleanroom Divider Walls
    addWall(-48, -32, wallT, 26); // Gowning room wall
    addWall(-48, 8, wallT, 52); // Chemical partition
    addWall(24, -32, wallT, 26, true); // Office glass partition

    scene.add(wallsGroup);
  }

  // Zone 04: Top-Center 5 Industrial Chiller Units (Hyper-Detailed)
  function buildDetailedHvacCluster() {
    const hvacGroup = new THREE.Group();
    const turbineR = 4.2;
    const turbineH = 5.2;

    // Heavy Concrete / Steel Vibration Isolator Pad
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

      // Corrugated Outer Cylinder Housing
      const tankGeo = new THREE.CylinderGeometry(turbineR, turbineR, turbineH, 28);
      const tankMesh = new THREE.Mesh(tankGeo, MATS.wallWhite);
      tankMesh.position.set(cx, turbineH / 2 + 1.0, cz);
      tankMesh.castShadow = true;
      hvacGroup.add(tankMesh);

      // Top Steel Flange & Protective Mesh Dome
      const domeGeo = new THREE.SphereGeometry(turbineR * 0.95, 20, 12, 0, Math.PI * 2, 0, Math.PI / 2);
      const domeMesh = new THREE.Mesh(domeGeo, MATS.steelBright);
      domeMesh.position.set(cx, turbineH + 1.0, cz);
      hvacGroup.add(domeMesh);

      // 4 Aerodynamic Twisted Blades
      const fanGroup = new THREE.Group();
      fanGroup.position.set(cx, turbineH + 1.2, cz);

      for (let b = 0; b < 4; b++) {
        const bladeGeo = new THREE.BoxGeometry(turbineR * 1.6, 0.08, 0.75);
        const bladeMesh = new THREE.Mesh(bladeGeo, MATS.machineBaseDark);
        bladeMesh.rotation.y = (b * Math.PI) / 2;
        bladeMesh.rotation.x = 0.25; // Aerodynamic pitch angle
        fanGroup.add(bladeMesh);
      }

      hvacGroup.add(fanGroup);
      spinningFans.push(fanGroup);

      // Heavy Coolant In/Out Flanged Valves
      const valveGeo = new THREE.CylinderGeometry(0.35, 0.35, 1.4, 12);
      const valveMesh = new THREE.Mesh(valveGeo, MATS.chemicalBlue);
      valveMesh.rotation.z = Math.PI / 2;
      valveMesh.position.set(cx + 2.5, 2.2, cz + turbineR);
      hvacGroup.add(valveMesh);
    }

    // Industrial Header Manifold Pipe
    const mainPipeGeo = new THREE.CylinderGeometry(1.1, 1.1, 52, 16);
    const mainPipeMesh = new THREE.Mesh(mainPipeGeo, MATS.steelBright);
    mainPipeMesh.rotation.z = Math.PI / 2;
    mainPipeMesh.position.set(4, 5.8, -40);
    hvacGroup.add(mainPipeMesh);

    scene.add(hvacGroup);
  }

  // Zone 01: Center-Right Heavy APFA Machine Cells (4 Massive Modules)
  function buildDetailedApfaModules() {
    const apfaGroup = new THREE.Group();

    // 4 Distinct Modules (2 Upper, 2 Lower matching blueprint)
    const moduleCoords = [
      { x: 32, z: -4 },
      { x: 32, z: 8 },
      { x: 32, z: 20 },
      { x: 32, z: 32 }
    ];

    moduleCoords.forEach((coord, idx) => {
      // Main Machine Base Platform
      const baseGeo = new THREE.BoxGeometry(32, 1.1, 7.5);
      const baseMesh = new THREE.Mesh(baseGeo, MATS.machineBaseDark);
      baseMesh.position.set(coord.x, 0.55, coord.z);
      baseMesh.castShadow = true;
      baseMesh.receiveShadow = true;
      apfaGroup.add(baseMesh);

      // Dual-Track In-line Conveyor
      const convGeo = new THREE.BoxGeometry(32, 0.4, 2.2);
      const convMesh = new THREE.Mesh(convGeo, MATS.conveyorBelt);
      convMesh.position.set(coord.x, 1.3, coord.z);
      apfaGroup.add(convMesh);

      // 3 Enclosed Automated Robotic Workcells per module
      for (let c = 0; c < 3; c++) {
        const cx = coord.x - 10 + c * 10;

        // Machine Body Columns
        const bodyGeo = new THREE.BoxGeometry(8.2, 4.2, 6.8);
        const bodyMesh = new THREE.Mesh(bodyGeo, MATS.machineChassis);
        bodyMesh.position.set(cx, 3.2, coord.z);
        bodyMesh.castShadow = true;
        apfaGroup.add(bodyMesh);

        // Transparent Cleanroom Acrylic Viewing Hood (Can see inside!)
        const hoodGeo = new THREE.BoxGeometry(7.4, 2.6, 6.2);
        const hoodMesh = new THREE.Mesh(hoodGeo, MATS.acrylicHood);
        hoodMesh.position.set(cx, 3.4, coord.z);
        apfaGroup.add(hoodMesh);

        // Internal Articulated Robot Arm inside each cell!
        createDetailedRoboticArm(cx, 1.5, coord.z);

        // Signal Stack Tower on roof of cell
        apfaGroup.add(createSignalTower(cx + 3.2, 5.3, coord.z - 2.8));

        // Touchscreen HMI on articulating arm
        const hmiGeo = new THREE.BoxGeometry(1.6, 1.2, 0.18);
        const hmiMesh = new THREE.Mesh(hmiGeo, MATS.steelBright);
        hmiMesh.position.set(cx - 3.2, 4.0, coord.z + 3.6);
        hmiMesh.rotation.y = 0.35;
        apfaGroup.add(hmiMesh);
      }
    });

    scene.add(apfaGroup);
  }

  // Zone 02: Far-Right Final Assembly & Test Lines (8 Horizontal Lines)
  function buildFarRightAssemblyLines() {
    const lineGroup = new THREE.Group();
    const startZ = -14;
    const stepZ = 6.2;

    for (let l = 0; l < 8; l++) {
      const zPos = startZ + l * stepZ;
      const xPos = 64;
      const trackLength = 25;

      // Motorized Roller Conveyor Track
      const trackGeo = new THREE.BoxGeometry(trackLength, 0.85, 2.8);
      const trackMesh = new THREE.Mesh(trackGeo, MATS.conveyorBelt);
      trackMesh.position.set(xPos, 1.2, zPos);
      trackMesh.castShadow = true;
      trackMesh.receiveShadow = true;
      lineGroup.add(trackMesh);

      // Conveyor Support Legs
      for (let leg = -trackLength / 2 + 2; leg <= trackLength / 2 - 2; leg += 6.5) {
        const legGeo = new THREE.CylinderGeometry(0.18, 0.18, 1.2, 8);
        const legMesh = new THREE.Mesh(legGeo, MATS.steelBright);
        legMesh.position.set(xPos + leg, 0.6, zPos);
        lineGroup.add(legMesh);
      }

      // Overhead Task Lighting & Tool Rail
      const railGeo = new THREE.BoxGeometry(trackLength, 0.12, 0.12);
      const railMesh = new THREE.Mesh(railGeo, MATS.steelBright);
      railMesh.position.set(xPos, 3.8, zPos);
      lineGroup.add(railMesh);

      // 4 Operator Workstations along each line
      for (let s = 0; s < 4; s++) {
        const sx = xPos - 8 + s * 5.5;

        // Operator Swivel Chair
        lineGroup.add(createOperatorChair(sx, 0, zPos + 2.6));

        // Part Bin Rack
        const binGeo = new THREE.BoxGeometry(1.6, 0.8, 0.9);
        const binMesh = new THREE.Mesh(binGeo, MATS.chemicalBlue);
        binMesh.position.set(sx, 2.0, zPos - 1.2);
        lineGroup.add(binMesh);
      }
    }

    scene.add(lineGroup);
  }

  // Zone 03: Center Core Micro-Coil & Stepped Assembly Lines
  function buildCenterCoreCoilAndLines() {
    const centerGroup = new THREE.Group();

    // 1. Top Grid: 4x5 High-Speed Voice Coil Winders (Grids B2-D3)
    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 5; c++) {
        const wx = -20 + c * 5.8;
        const wz = -20 + r * 4.2;

        // Machine Bench
        const benchGeo = new THREE.BoxGeometry(4.4, 2.2, 3.2);
        const benchMesh = new THREE.Mesh(benchGeo, MATS.machineChassis);
        benchMesh.position.set(wx, 1.1, wz);
        benchMesh.castShadow = true;
        centerGroup.add(benchMesh);

        // Copper Wire Spool Reel
        const spoolGeo = new THREE.CylinderGeometry(0.5, 0.5, 0.6, 16);
        const spoolMat = new THREE.MeshStandardMaterial({ color: 0xb45309, metalness: 0.8, roughness: 0.2 });
        const spoolMesh = new THREE.Mesh(spoolGeo, spoolMat);
        spoolMesh.position.set(wx + 1.2, 2.6, wz);
        centerGroup.add(spoolMesh);
      }
    }

    // 2. 4 Vertical Assembly Lines with Operator Stools (Grids C3-D6)
    const xLines = [-14, -6, 2, 10];
    xLines.forEach((lx) => {
      const lineLen = 30;
      const lz = 12;

      // Vertical Table Line
      const tblGeo = new THREE.BoxGeometry(3.6, 1.6, lineLen);
      const tblMesh = new THREE.Mesh(tblGeo, MATS.wallWhite);
      tblMesh.position.set(lx, 0.8, lz);
      tblMesh.castShadow = true;
      centerGroup.add(tblMesh);

      // Operator Chairs along the line
      for (let cz = lz - lineLen / 2 + 2.5; cz <= lz + lineLen / 2 - 2.5; cz += 5.2) {
        centerGroup.add(createOperatorChair(lx + 2.8, 0, cz));
      }
    });

    scene.add(centerGroup);
  }

  // Zone 05: Far-Left Chemical & Ultrasonic Cleaning Lines
  function buildChemicalCleaningLines() {
    const chemGroup = new THREE.Group();

    // 4 Vertical Process Tanks Lines (matching blueprint icons)
    const xChem = [-70, -64, -58, -52];

    xChem.forEach((cx, idx) => {
      const cz = 5;
      const len = 42;

      // Stainless Steel Spill Containment Basin
      const panGeo = new THREE.BoxGeometry(4.8, 0.4, len);
      const panMesh = new THREE.Mesh(panGeo, MATS.steelBright);
      panMesh.position.set(cx, 0.2, cz);
      chemGroup.add(panMesh);

      // Sequence of Immersion Dip Tanks (Washing, Ultrasonic, Rinse, Dry)
      for (let tz = cz - len / 2 + 3; tz <= cz + len / 2 - 3; tz += 6.5) {
        const tankGeo = new THREE.BoxGeometry(4.2, 3.2, 5.2);
        const tankMesh = new THREE.Mesh(tankGeo, MATS.chemicalBlue);
        tankMesh.position.set(cx, 1.8, tz);
        tankMesh.castShadow = true;
        chemGroup.add(tankMesh);

        // Liquid Bath Surface Inside
        const liqGeo = new THREE.PlaneGeometry(3.8, 4.6);
        const liqMesh = new THREE.Mesh(liqGeo, MATS.chemicalLiquid);
        liqMesh.rotation.x = -Math.PI / 2;
        liqMesh.position.set(cx, 3.25, tz);
        chemGroup.add(liqMesh);

        // Fume Extraction Canopy Hood Above
        const hoodGeo = new THREE.BoxGeometry(4.4, 1.2, 5.4);
        const hoodMesh = new THREE.Mesh(hoodGeo, MATS.steelDark);
        hoodMesh.position.set(cx, 5.2, tz);
        chemGroup.add(hoodMesh);
      }
    });

    scene.add(chemGroup);
  }

  // Zone 06: Southern Wall High-Bay Pallet Racks (Full Length)
  function buildSouthernLogisticsRacks(w) {
    const logGroup = new THREE.Group();
    const zPos = 40;
    const bayW = 14;

    // Racks span the whole southern boundary matching red blueprint racks
    for (let rx = -w / 2 + 10; rx <= w / 2 - 10; rx += bayW + 1.2) {
      logGroup.add(createPalletRackUnit(rx, zPos, bayW, 3));
    }

    scene.add(logGroup);
  }

  // Top-Left Cleanroom Gowning Room & Air Showers
  function buildGowningAndAirShowers() {
    const gownGroup = new THREE.Group();

    // 2 Air Shower Tunnels (Cleanroom Entrance)
    [-64, -58].forEach((ax) => {
      const az = -26;

      // Air Shower Cubicle
      const cubGeo = new THREE.BoxGeometry(4.8, 5.2, 4.8);
      const cubMesh = new THREE.Mesh(cubGeo, MATS.steelBright);
      cubMesh.position.set(ax, 2.6, az);
      gownGroup.add(cubMesh);

      // Glass Sliding Doors
      const doorGeo = new THREE.BoxGeometry(4.2, 4.8, 0.2);
      const doorMesh = new THREE.Mesh(doorGeo, MATS.glassCleanroom);
      doorMesh.position.set(ax, 2.5, az + 2.4);
      gownGroup.add(doorMesh);
    });

    // Locker Rows and Step-over Benches
    for (let lk = -72; lk <= -54; lk += 5) {
      const lockGeo = new THREE.BoxGeometry(4.2, 4.8, 1.8);
      const lockMesh = new THREE.Mesh(lockGeo, MATS.wallWhite);
      lockMesh.position.set(lk, 2.4, -40);
      gownGroup.add(lockMesh);
    }

    scene.add(gownGroup);
  }

  // Top-Right Engineering & Conference Hub
  function buildEngineeringAndControlOffice() {
    const offGroup = new THREE.Group();

    // 6 Pods of 4 Desks (Grids F1-H2 in blueprint)
    for (let pr = 0; pr < 2; pr++) {
      for (let pc = 0; pc < 3; pc++) {
        const ox = 38 + pc * 13;
        const oz = -38 + pr * 9;

        // Quad Desk Pod
        const deskGeo = new THREE.BoxGeometry(10.5, 1.6, 6.5);
        const deskMesh = new THREE.Mesh(deskGeo, MATS.wallWhite);
        deskMesh.position.set(ox, 0.8, oz);
        deskMesh.castShadow = true;
        offGroup.add(deskMesh);

        // 4 Monitors
        [
          { dx: -2.8, dz: -1.8 },
          { dx: 2.8, dz: -1.8 },
          { dx: -2.8, dz: 1.8 },
          { dx: 2.8, dz: 1.8 }
        ].forEach((m) => {
          const monGeo = new THREE.BoxGeometry(1.8, 1.2, 0.18);
          const monMesh = new THREE.Mesh(monGeo, MATS.steelDark);
          monMesh.position.set(ox + m.dx, 2.1, oz + m.dz);
          offGroup.add(monMesh);
        });
      }
    }

    // Conference Room Table
    const confGeo = new THREE.CylinderGeometry(3.5, 3.5, 1.5, 24);
    const confMesh = new THREE.Mesh(confGeo, MATS.steelBright);
    confMesh.position.set(70, 0.75, -24);
    offGroup.add(confMesh);

    scene.add(offGroup);
  }

  // Create 3D Interactive Floating Beacon Pins over Zones
  function createInteractiveZonePins() {
    const pinConfigs = [
      { id: 'apfa', name: '01 APFA AUTOMATION', pos: new THREE.Vector3(32, 9.5, 9) },
      { id: 'assembly', name: '02 FINAL ASSEMBLY', pos: new THREE.Vector3(64, 8.5, 8) },
      { id: 'coil', name: '03 MICRO-COIL', pos: new THREE.Vector3(-10, 8.5, 4) },
      { id: 'hvac', name: '04 HVAC CHILLER', pos: new THREE.Vector3(4, 9.5, -34) },
      { id: 'chemical', name: '05 CHEMICAL CLEAN', pos: new THREE.Vector3(-60, 8.5, 5) },
      { id: 'logistics', name: '06 BUFFER RACKS', pos: new THREE.Vector3(5, 8.5, 40) }
    ];

    pinConfigs.forEach((cfg) => {
      const pinGroup = new THREE.Group();
      pinGroup.position.copy(cfg.pos);
      pinGroup.userData = { zoneId: cfg.id };

      // Pulsing Base Ring
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

      // Laser Tether
      const lineGeo = new THREE.CylinderGeometry(0.08, 0.08, cfg.pos.y, 8);
      const lineMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.5 });
      const lineMesh = new THREE.Mesh(lineGeo, lineMat);
      lineMesh.position.y = -cfg.pos.y / 2;
      pinGroup.add(lineMesh);

      // Octahedron Marker
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

      // Canvas Sprite Label
      const labelCanvas = document.createElement('canvas');
      labelCanvas.width = 420;
      labelCanvas.height = 96;
      const lctx = labelCanvas.getContext('2d');
      lctx.fillStyle = 'rgba(15, 23, 42, 0.88)';
      lctx.roundRect(10, 10, 400, 76, 18);
      lctx.fill();
      lctx.strokeStyle = 'rgba(255, 255, 255, 0.55)';
      lctx.lineWidth = 2;
      lctx.roundRect(10, 10, 400, 76, 18);
      lctx.stroke();

      lctx.fillStyle = '#ffffff';
      lctx.font = 'bold 28px -apple-system, sans-serif';
      lctx.textAlign = 'center';
      lctx.textBaseline = 'middle';
      lctx.fillText(cfg.name, 210, 48);

      const labelTex = new THREE.CanvasTexture(labelCanvas);
      const spriteMat = new THREE.SpriteMaterial({ map: labelTex, depthTest: false });
      const sprite = new THREE.Sprite(spriteMat);
      sprite.scale.set(7.5, 1.8, 1);
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

    // Spin Chiller Fan Blades
    spinningFans.forEach((fan) => {
      fan.rotation.y += 0.08;
    });

    // Subtly animate robot arms
    const t = performance.now() * 0.0015;
    roboticArms.forEach((arm, idx) => {
      const forearm = arm.children[4];
      if (forearm) {
        forearm.rotation.z = 0.45 + Math.sin(t + idx) * 0.15;
      }
    });

    // Gently Bob Floating Zone Pins
    interactivePins.forEach((pin, i) => {
      const oct = pin.children.find((c) => c.geometry && c.geometry.type === 'OctahedronGeometry');
      if (oct) {
        oct.rotation.y += 0.02;
        oct.position.y = Math.sin(t * 1.5 + i) * 0.35;
      }
    });

    // Camera Transition
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
        // Top-Down Blueprint 1:1 Match
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
