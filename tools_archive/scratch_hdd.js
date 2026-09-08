const MODULE_GROUPS = {
      "arm_stack": {
        id: "01 / 06",
        name: "Actuator E-Block Comb (8-Tier)",
        material: "CNC Duralumin + Side Trace Stiffener",
        specs: "8-blade CNC-milled comb with recessed stiffener cavity, dual rivet ports, and side multi-channel trace flex pad.",
        offset: new THREE.Vector3(-2.2, 0, 1.2)
      },
      "pivot_bearing": {
        id: "02 / 06",
        name: "Pivot Hub & 3-Aperture Cluster",
        material: "Chamfered Stainless Steel Ring + Concentric Well",
        specs: "Precision turned bearing housing with concentric raceway and triad of 3 laser-drilled balance holes.",
        offset: new THREE.Vector3(0, 2.8, 0)
      },
      "voice_coil": {
        id: "03 / 06",
        name: "Voice Coil Core (Dark Triangular Plate)",
        material: "Sintered Magnet Core + Dual Balancing Ports",
        specs: "Dark charcoal triangular electromagnetic plate with dual precision alignment ports.",
        offset: new THREE.Vector3(1.8, 0, -1.8)
      },
      "vcm_top_shroud": {
        id: "04 / 06",
        name: "Gold-Anodized Chamfered VCM Yoke Bezel",
        material: "High-Luster Polished Gold/Brass Alloy",
        specs: "Two-tone gold-anodized yoke frame with facet chamfers directing high-density magnetic flux.",
        offset: new THREE.Vector3(1.8, 2.4, -1.8)
      },
      "flex_cable": {
        id: "05 / 06",
        name: "Wide S-Curved Polyimide FPC Ribbon",
        material: "Translucent Amber Kapton + Copper Micro-Traces",
        specs: "Sweeping S-curve ribbon carrying high-speed differential signals into the strain-relief clamp.",
        offset: new THREE.Vector3(1.0, 0.7, 0.8)
      },
      "connector_block": {
        id: "06 / 06",
        name: "Flex-Rigid Pre-Amp PCB & 28-Pin Header",
        material: "Glossy Amber PCB + Pre-Amp IC + 28 Gold Pins",
        specs: "Curved copper PCB artwork with Pre-Amp IC, exposed ground ring washers, and angled 45° 28-pin SMD connector.",
        offset: new THREE.Vector3(3.6, 0, 1.8)
      }
    };

    /* ==========================================================================
       Procedural Macro-Accurate High-Res Textures
       ========================================================================== */
    function generateBrushedMetalTexture() {
      const canvas = document.createElement('canvas');
      canvas.width = 512;
      canvas.height = 512;
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = '#e8e5db';
      ctx.fillRect(0, 0, 512, 512);

      for (let i = 0; i < 5000; i++) {
        const x = Math.random() * 512;
        const y = Math.random() * 512;
        const len = 30 + Math.random() * 80;
        const alpha = 0.03 + Math.random() * 0.07;
        ctx.strokeStyle = Math.random() > 0.5 ? `rgba(255,255,255,${alpha})` : `rgba(30,30,30,${alpha})`;
        ctx.lineWidth = 0.5 + Math.random() * 1.5;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x + len, y);
        ctx.stroke();
      }
      return new THREE.CanvasTexture(canvas);
    }

    function generatePCBArtworkTexture() {
      const canvas = document.createElement('canvas');
      canvas.width = 1024;
      canvas.height = 1024;
      const ctx = canvas.getContext('2d');

      // Amber/orange glossy polyimide PCB base
      ctx.fillStyle = '#d97828';
      ctx.fillRect(0, 0, 1024, 1024);

      // Sweeping copper circuit traces
      ctx.strokeStyle = '#f5ab62';
      ctx.lineWidth = 6;
      ctx.lineCap = 'round';

      for (let i = 0; i < 18; i++) {
        const yStart = 150 + i * 42;
        ctx.beginPath();
        ctx.moveTo(100, yStart);
        ctx.bezierCurveTo(400, yStart - 50, 600, yStart + 80, 920, yStart);
        ctx.stroke();
      }

      // Copper ground pours
      ctx.fillStyle = '#be6118';
      ctx.beginPath();
      ctx.arc(320, 320, 180, 0, Math.PI * 2);
      ctx.fill();

      // Gold rectangular solder pad array for the 28 pins
      ctx.fillStyle = '#ffd15c';
      for (let r = 0; r < 2; r++) {
        for (let p = 0; p < 14; p++) {
          ctx.fillRect(520 + p * 28, 480 + r * 45, 18, 30);
        }
      }

      // Silver grounding ring washers
      ctx.fillStyle = '#d6d9e0';
      ctx.beginPath();
      ctx.arc(820, 220, 60, 0, Math.PI * 2);
      ctx.arc(860, 800, 60, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#1c1e22';
      ctx.beginPath();
      ctx.arc(820, 220, 32, 0, Math.PI * 2);
      ctx.arc(860, 800, 32, 0, Math.PI * 2);
      ctx.fill();

      const tex = new THREE.CanvasTexture(canvas);
      tex.anisotropy = 16;
      return tex;
    }

    function generateCombSideTracesTexture() {
      const canvas = document.createElement('canvas');
      canvas.width = 512;
      canvas.height = 512;
      const ctx = canvas.getContext('2d');

      // Copper/orange flex base
      ctx.fillStyle = '#c96f26';
      ctx.fillRect(0, 0, 512, 512);

      // Horizontal micro-traces matching the 8 tiers
      for (let i = 0; i < 16; i++) {
        const y = 20 + i * 30;
        ctx.fillStyle = '#e8a356';
        ctx.fillRect(0, y, 512, 12);
        ctx.fillStyle = '#8f460d';
        ctx.fillRect(0, y + 12, 512, 4);
      }

      // Silver grounding bracket square
      ctx.fillStyle = '#ccd0d9';
      ctx.fillRect(380, 180, 80, 80);
      ctx.fillStyle = '#222';
      ctx.fillRect(405, 205, 30, 30);

      const tex = new THREE.CanvasTexture(canvas);
      return tex;
    }

    const brushedTex = generateBrushedMetalTexture();
    const pcbArtTex = generatePCBArtworkTexture();
    const combSideTex = generateCombSideTracesTexture();

    const palette = {
      aluminum: new THREE.MeshStandardMaterial({
        color: 0xe0ddd0,
        metalness: 0.82,
        roughness: 0.22,
        map: brushedTex
      }),
      cavityMilled: new THREE.MeshStandardMaterial({
        color: 0xc4c1b4,
        metalness: 0.75,
        roughness: 0.35
      }),
      pivotRing: new THREE.MeshStandardMaterial({
        color: 0xede9dc,
        metalness: 0.92,
        roughness: 0.15
      }),
      pivotWell: new THREE.MeshStandardMaterial({
        color: 0xdfd49e,
        metalness: 0.65,
        roughness: 0.28
      }),
      goldVCMBezel: new THREE.MeshStandardMaterial({
        color: 0xf0c85d, // Rich polished gold/brass luster
        metalness: 0.95,
        roughness: 0.18
      }),
      vcmDarkCore: new THREE.MeshStandardMaterial({
        color: 0x32343a, // Matte charcoal core
        metalness: 0.88,
        roughness: 0.35
      }),
      silverWing: new THREE.MeshStandardMaterial({
        color: 0xd6d3c7,
        metalness: 0.85,
        roughness: 0.25
      }),
      combSideFlex: new THREE.MeshStandardMaterial({
        color: 0xffffff,
        map: combSideTex,
        metalness: 0.4,
        roughness: 0.3
      }),
      fpcRibbon: new THREE.MeshStandardMaterial({
        color: 0xe07e2c,
        metalness: 0.3,
        roughness: 0.28,
        side: THREE.DoubleSide
      }),
      pcbGlossy: new THREE.MeshStandardMaterial({
        color: 0xffffff,
        map: pcbArtTex,
        metalness: 0.25,
        roughness: 0.22
      }),
      blackPlastic: new THREE.MeshStandardMaterial({
        color: 0x1a1c20,
        metalness: 0.5,
        roughness: 0.45
      }),
      goldPins: new THREE.MeshStandardMaterial({
        color: 0xf5d36e,
        metalness: 0.95,
        roughness: 0.12
      }),
      silverWasher: new THREE.MeshStandardMaterial({
        color: 0xd8dbe0,
        metalness: 0.96,
        roughness: 0.15
      }),
      highlight: new THREE.MeshStandardMaterial({
        color: 0xff9900,
        emissive: 0xff7700,
        emissiveIntensity: 0.55,
        metalness: 0.7,
        roughness: 0.25
      })
    };

    
function buildHDD() {\n      const n = new THREE.Group();\n      const x = new THREE.Group();
      // 1. ACTUATOR E-BLOCK COMB (8 Tiers with Milled Recessed Cavity & Rivet Ports)
      const armGroup = new THREE.Group();
      armGroup.name = "arm_stack";

      const numTiers = 8;
      const tierGap = 0.19;

      for (let i = 0; i < numTiers; i++) {
        const yOffset = (i - (numTiers - 1) / 2) * tierGap;

        // Solid aerodynamic blade profile
        const bladeShape = new THREE.Shape();
        bladeShape.moveTo(0, 0);
        bladeShape.lineTo(-1.6, 0.42);
        bladeShape.quadraticCurveTo(-2.6, 0.56, -3.4, 0.46);
        bladeShape.lineTo(-4.0, 0.2);
        bladeShape.lineTo(-4.15, 0.0);
        bladeShape.lineTo(-4.0, -0.2);
        bladeShape.lineTo(-3.4, -0.36);
        bladeShape.quadraticCurveTo(-2.6, -0.40, -1.6, -0.28);
        bladeShape.lineTo(0, -0.6);
        bladeShape.closePath();

        const bladeGeo = new THREE.ExtrudeGeometry(bladeShape, {
          depth: 0.065,
          bevelEnabled: true,
          bevelSegments: 4,
          bevelSize: 0.02,
          bevelThickness: 0.02
        });
        bladeGeo.rotateX(Math.PI / 2);

        const bladeMesh = new THREE.Mesh(bladeGeo, palette.aluminum);
        bladeMesh.position.set(0, yOffset, 0);
        bladeMesh.castShadow = true;
        bladeMesh.receiveShadow = true;
        armGroup.add(bladeMesh);

        // On the top arm tier: Render the distinct Elongated Recessed Milled Cavity (Pocket)
        if (i === numTiers - 1) {
          const pocketGeo = new THREE.BoxGeometry(1.2, 0.04, 0.32);
          const pocketMesh = new THREE.Mesh(pocketGeo, palette.cavityMilled);
          pocketMesh.position.set(-2.2, yOffset + 0.035, 0.08);
          armGroup.add(pocketMesh);

          // Two side-by-side silver rivet ports
          const r1 = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.06, 16), palette.silverWasher);
          r1.position.set(-3.2, yOffset + 0.04, 0.12);
          armGroup.add(r1);

          const r2 = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.06, 16), palette.silverWasher);
          r2.position.set(-3.2, yOffset + 0.04, -0.02);
          armGroup.add(r2);
        }

        // Tiny suspension mounting tips at the end of each tier
        const tipGeo = new THREE.BoxGeometry(0.25, 0.015, 0.08);
        const tipMesh = new THREE.Mesh(tipGeo, palette.silverWasher);
        tipMesh.position.set(-4.22, yOffset, 0);
        armGroup.add(tipMesh);
      }

      // Extended Copper/Orange Flex Stiffener Pad wrapping the side of all 8 tiers
      const combSidePad = new THREE.Mesh(new THREE.BoxGeometry(1.4, numTiers * tierGap + 0.12, 0.22), palette.combSideFlex);
      combSidePad.position.set(-0.95, 0, 0.54);
      combSidePad.rotation.y = -Math.PI * 0.08;
      combSidePad.castShadow = true;
      armGroup.add(combSidePad);

      // Diagonal silver axle / bracket pin behind the comb
      const axlePin = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.65, 16), palette.silverWasher);
      axlePin.position.set(0.25, 0.1, 0.65);
      axlePin.rotation.x = Math.PI / 4;
      axlePin.rotation.z = Math.PI / 6;
      armGroup.add(axlePin);

      addM(n, armGroup, MODULE_GROUPS["arm_stack"].offset);

      // 2. PIVOT BEARING HUB & 3-APERTURE CLUSTER
      const pivotGroup = new THREE.Group();
      pivotGroup.name = "pivot_bearing";

      // Polished Stainless Steel outer chamfered ring
      const pivotRimGeo = new THREE.CylinderGeometry(0.82, 0.82, 1.6, 48);
      const pivotRim = new THREE.Mesh(pivotRimGeo, palette.pivotRing);
      pivotRim.castShadow = true;
      pivotGroup.add(pivotRim);

      // Deep Concentric Turning Well
      const pivotWellGeo = new THREE.CylinderGeometry(0.64, 0.64, 1.65, 48);
      const pivotWell = new THREE.Mesh(pivotWellGeo, palette.pivotWell);
      pivotWell.position.set(0, 0.05, 0);
      pivotGroup.add(pivotWell);

      // Center Pin
      const pivotCenter = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.26, 1.72, 32), palette.aluminum);
      pivotCenter.position.set(0, 0.08, 0);
      pivotGroup.add(pivotCenter);

      // Triad of 3 Black Circular Holes (Cluster directly next to pivot in photo)
      const triadHoles = [
        { x: -0.45, z: 0.58, r: 0.13 },
        { x: -0.22, z: 0.66, r: 0.10 },
        { x: -0.66, z: 0.46, r: 0.085 }
      ];
      triadHoles.forEach(h => {
        const holeMesh = new THREE.Mesh(new THREE.CylinderGeometry(h.r, h.r, 1.7, 24), palette.blackPlastic);
        holeMesh.position.set(h.x, 0, h.z);
        pivotGroup.add(holeMesh);
      });

      addM(n, pivotGroup, MODULE_GROUPS["pivot_bearing"].offset);

      // 3. VOICE COIL (Dark Charcoal Triangular Plate Core)
      const vcmGroup = new THREE.Group();
      vcmGroup.name = "voice_coil";

      const vcmCoreShape = new THREE.Shape();
      vcmCoreShape.moveTo(0.5, -0.4);
      vcmCoreShape.lineTo(2.3, -1.15);
      vcmCoreShape.quadraticCurveTo(2.7, 0, 2.3, 1.15);
      vcmCoreShape.lineTo(0.5, 0.4);
      vcmCoreShape.closePath();

      const vcmCoreGeo = new THREE.ExtrudeGeometry(vcmCoreShape, {
        depth: 0.24,
        bevelEnabled: true,
        bevelSegments: 4,
        bevelSize: 0.03,
        bevelThickness: 0.03
      });
      vcmCoreGeo.rotateX(Math.PI / 2);

      const vcmCoreMesh = new THREE.Mesh(vcmCoreGeo, palette.vcmDarkCore);
      vcmCoreMesh.position.set(0.4, 0, 0);
      vcmCoreMesh.castShadow = true;
      vcmGroup.add(vcmCoreMesh);

      // Two precision drilled circular balance holes
      const vcmHole1 = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.35, 20), palette.blackPlastic);
      vcmHole1.position.set(1.9, 0, -0.28);
      vcmGroup.add(vcmHole1);

      const vcmHole2 = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.35, 20), palette.blackPlastic);
      vcmHole2.position.set(1.9, 0, 0.28);
      vcmGroup.add(vcmHole2);

      addM(n, vcmGroup, MODULE_GROUPS["voice_coil"].offset);

      // 4. GOLD-ANODIZED CHAMFERED VCM YOKE BEZEL & SILVER WINGS
      const topVcmGroup = new THREE.Group();
      topVcmGroup.name = "vcm_top_shroud";

      // Faceted Gold/Brass Yoke Bezel (Matching the sparkling gold chamfer in the photo!)
      const goldBezelShape = new THREE.Shape();
      goldBezelShape.moveTo(0.4, -0.5);
      goldBezelShape.lineTo(2.4, -1.35);
      goldBezelShape.quadraticCurveTo(3.0, 0, 2.4, 1.35);
      goldBezelShape.lineTo(0.4, 0.5);
      goldBezelShape.closePath();

      const innerWindow = new THREE.Path();
      innerWindow.moveTo(0.8, -0.35);
      innerWindow.lineTo(2.1, -1.0);
      innerWindow.quadraticCurveTo(2.4, 0, 2.1, 1.0);
      innerWindow.lineTo(0.8, 0.35);
      innerWindow.closePath();
      goldBezelShape.holes.push(innerWindow);

      const goldBezelGeo = new THREE.ExtrudeGeometry(goldBezelShape, {
        depth: 0.18,
        bevelEnabled: true,
        bevelSegments: 4,
        bevelSize: 0.045,
        bevelThickness: 0.045
      });
      goldBezelGeo.rotateX(Math.PI / 2);

      const goldBezelMesh = new THREE.Mesh(goldBezelGeo, palette.goldVCMBezel);
      goldBezelMesh.position.set(0.4, 0.22, 0);
      goldBezelMesh.castShadow = true;
      topVcmGroup.add(goldBezelMesh);

      // Silver outer chassis contour wings
      const wingGeo = new THREE.BoxGeometry(0.4, 0.12, 0.6);
      const wing1 = new THREE.Mesh(wingGeo, palette.silverWing);
      wing1.position.set(2.4, 0.12, -1.3);
      wing1.rotation.y = -Math.PI * 0.2;
      topVcmGroup.add(wing1);

      const wing2 = new THREE.Mesh(wingGeo, palette.silverWing);
      wing2.position.set(2.4, 0.12, 1.3);
      wing2.rotation.y = Math.PI * 0.2;
      topVcmGroup.add(wing2);

      addM(n, topVcmGroup, MODULE_GROUPS["vcm_top_shroud"].offset);

      // 5. FLEXIBLE PRINTED CIRCUIT (FPC S-CURVED RIBBON CABLE)
      const flexGroup = new THREE.Group();
      flexGroup.name = "flex_cable";

      const ribbonCurve = new THREE.CubicBezierCurve3(
        new THREE.Vector3(0.1, 0.05, 0.7),
        new THREE.Vector3(0.5, -0.1, 1.8),
        new THREE.Vector3(1.6, -0.05, 1.7),
        new THREE.Vector3(2.2, 0.0, 1.4)
      );

      const ribbonPoints = ribbonCurve.getPoints(48);
      const ribbonGeo = new THREE.BufferGeometry();
      const vertices = [];
      const uvs = [];
      const ribbonHeight = 0.58;

      for (let i = 0; i < ribbonPoints.length; i++) {
        const pt = ribbonPoints[i];
        vertices.push(pt.x, pt.y + ribbonHeight / 2, pt.z);
        vertices.push(pt.x, pt.y - ribbonHeight / 2, pt.z);
        uvs.push(i / ribbonPoints.length, 1);
        uvs.push(i / ribbonPoints.length, 0);
      }

      const indices = [];
      for (let i = 0; i < ribbonPoints.length - 1; i++) {
        const a = i * 2;
        const b = i * 2 + 1;
        const c = (i + 1) * 2;
        const d = (i + 1) * 2 + 1;
        indices.push(a, b, c);
        indices.push(c, b, d);
      }

      ribbonGeo.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
      ribbonGeo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
      ribbonGeo.setIndex(indices);
      ribbonGeo.computeVertexNormals();

      const ribbonMesh = new THREE.Mesh(ribbonGeo, palette.fpcRibbon);
      ribbonMesh.castShadow = true;
      flexGroup.add(ribbonMesh);

      // Molded black strain relief clamp
      const strainBracket = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.72, 0.28), palette.blackPlastic);
      strainBracket.position.set(2.15, 0.0, 1.45);
      strainBracket.rotation.y = -Math.PI * 0.15;
      flexGroup.add(strainBracket);

      addM(n, flexGroup, MODULE_GROUPS["flex_cable"].offset);

      // 6. FLEX-RIGID PRE-AMP PCB & 28-PIN HEADER (Exact Macro-Photo Circuit Layout)
      const connGroup = new THREE.Group();
      connGroup.name = "connector_block";

      // Molded Orange & Black Chassis Assembly
      const housingShape = new THREE.Shape();
      housingShape.moveTo(0, 0);
      housingShape.lineTo(1.8, -0.3);
      housingShape.lineTo(2.2, 0.8);
      housingShape.lineTo(1.6, 1.9);
      housingShape.lineTo(-0.2, 1.6);
      housingShape.closePath();

      const connHousingGeo = new THREE.ExtrudeGeometry(housingShape, {
        depth: 0.55,
        bevelEnabled: true,
        bevelSegments: 4,
        bevelSize: 0.045,
        bevelThickness: 0.045
      });
      connHousingGeo.rotateX(Math.PI / 2);

      const connHousing = new THREE.Mesh(connHousingGeo, palette.pcbGlossy);
      connHousing.position.set(2.4, 0.1, 0.6);
      connHousing.castShadow = true;
      connHousing.receiveShadow = true;
      connGroup.add(connHousing);

      // Pre-Amp IC Chip (surface mount black package)
      const icChip = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.04, 0.48), palette.blackPlastic);
      icChip.position.set(3.15, 0.39, 1.35);
      connGroup.add(icChip);

      // Two Exposed Silver Grounding Washers (top-right & bottom-right of PCB)
      const washer1 = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.65, 24), palette.silverWasher);
      washer1.position.set(3.2, 0.15, 0.95);
      connGroup.add(washer1);

      const washer2 = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.65, 24), palette.silverWasher);
      washer2.position.set(4.2, 0.15, 1.8);
      connGroup.add(washer2);

      // Angled 45° 28-Pin SMD Multi-Connector Header
      const pinBlockGroup = new THREE.Group();
      pinBlockGroup.position.set(3.8, 0.38, 1.35);
      pinBlockGroup.rotation.y = -Math.PI * 0.28; // 45 deg angle matching photo

      const pinMatrixBase = new THREE.Mesh(new THREE.BoxGeometry(1.65, 0.18, 0.45), palette.blackPlastic);
      pinBlockGroup.add(pinMatrixBase);

      const lockingRail = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.14, 0.14), palette.blackPlastic);
      lockingRail.position.set(0, 0.14, 0.08);
      pinBlockGroup.add(lockingRail);

      // 28 Gold Pins
      const singlePinGeo = new THREE.BoxGeometry(0.04, 0.22, 0.04);
      for (let row = 0; row < 2; row++) {
        for (let col = 0; col < 14; col++) {
          const pin = new THREE.Mesh(singlePinGeo, palette.goldPins);
          pin.position.set(-0.68 + col * 0.105, 0.16, -0.12 + row * 0.18);
          pinBlockGroup.add(pin);
        }
      }

      connGroup.add(pinBlockGroup);

      // Black Underbody Clamps
      const clamp1 = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.45, 0.22), palette.blackPlastic);
      clamp1.position.set(2.8, -0.05, 2.1);
      connGroup.add(clamp1);

      const clamp2 = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.45, 0.22), palette.blackPlastic);
      clamp2.position.set(3.8, -0.05, 0.7);
      connGroup.add(clamp2);

      addM(n, connGroup, MODULE_GROUPS["connector_block"].offset);

      // Model Orientation Matching Photo
      n.rotation.y = Math.PI * 0.22;
      n.position.set(0, 0, 0);
      return { n, x };
    }
    }

    