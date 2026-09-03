const fs = require('fs');
let code = fs.readFileSync('public/index.html', 'utf8');

const updatedLoaderCode = `        // ======================== GLTF LOADER FOR LATEST COIL MODEL ========================
        const gltfLoader = new THREE.GLTFLoader();

        function getExplodeVectorForNode(name, pos) {
            const n = (name || '').toLowerCase();
            
            // 1. Arm stack & blades (Vert.001..Vert.007, arm, blade)
            if (n.includes('vert.001') || n.includes('vert.002') || n.includes('vert.003') || 
                n.includes('vert.004') || n.includes('vert.005') || n.includes('vert.006') || 
                n.includes('vert.007') || n.includes('arm') || n.includes('blade') || n.includes('suspension')) {
                return new THREE.Vector3(-2.8, 0, 1.2);
            }
            // 2. Pivot bearing hub & cylindrical shafts (Pivot, ทรงกระบอก)
            if (n.includes('pivot') || n.includes('ทรงกระบอก')) {
                return new THREE.Vector3(0, 2.5, 0);
            }
            // 3. VCM / Voice coil magnet plate & coils (Vert.008, Vert.009, vcm, voice_coil)
            if (n.includes('vert.008') || n.includes('vert.009') || n.includes('vcm') || n.includes('voice_coil')) {
                return new THREE.Vector3(1.8, 0, -1.8);
            }
            // 4. Gold bezel, wings, planes (ระนาบ, wing, bezel)
            if (n.includes('wing') || n.includes('gold') || n.includes('bezel') || n.includes('shroud') || n.includes('ระนาบ')) {
                return new THREE.Vector3(1.8, 2.0, -1.8);
            }
            // 5. FPC ribbon & clamp
            if (n.includes('fpc') || n.includes('ribbon') || n.includes('clamp') || n.includes('strain') || n.includes('flex')) {
                return new THREE.Vector3(1.2, 0.8, 1.0);
            }
            // 6. Preamp PCB, IC chip, gold pins, connector, washers, pin base
            if (n.includes('pcb') || n.includes('pin') || n.includes('preamp') || n.includes('washer') || n.includes('header') || n.includes('chip') || n.includes('housing')) {
                return new THREE.Vector3(3.5, 0, 1.8);
            }
            
            // Fallback for any other custom part
            if (pos) {
                const dir = new THREE.Vector3(pos.x, pos.y, pos.z);
                if (dir.lengthSq() > 0.05) {
                    return dir.clone().normalize().multiplyScalar(2.0);
                }
            }
            return new THREE.Vector3(0, 1.5, 0);
        }

        function buildHDD() {
            const n = new THREE.Group(), x = new THREE.Group();
            
            gltfLoader.load(
                'models/coil.glb?v=' + Date.now(), // Cache-busting to ensure latest file is loaded
                (gltf) => {
                    const sceneModel = gltf.scene;
                    
                    // คำนวณ Bounding Box และจุดกึ่งกลางของโมเดลอัตโนมัติ
                    const bbox = new THREE.Box3().setFromObject(sceneModel);
                    const centerOffset = new THREE.Vector3();
                    bbox.getCenter(centerOffset);
                    
                    const children = [...sceneModel.children];
                    
                    children.forEach((child) => {
                        // ปรับจุดกึ่งกลางโมเดลให้สมดุลที่ (0, 0, 0)
                        child.position.sub(centerOffset);
                        
                        // คำนวณเวกเตอร์แยกร่าง
                        const expVec = getExplodeVectorForNode(child.name, child.position);
                        
                        child.traverse((c) => {
                            if (c.isMesh) {
                                c.castShadow = true;
                                c.receiveShadow = true;
                                if (c.material) {
                                    c.material.side = THREE.DoubleSide;
                                    if (c.material.metalness !== undefined) {
                                        c.material.metalness = Math.min(c.material.metalness, 0.9);
                                    }
                                }
                            }
                        });
                        
                        addM(n, child, expVec);
                    });
                    
                    // ปรับมุมมองโมเดลให้เห็นสวยงาม
                    n.rotation.y = Math.PI * 0.15;
                },
                undefined,
                (err) => {
                    console.error('Error loading models/coil.glb:', err);
                }
            );
            
            return { n, x };
        }`;

const start = code.indexOf('// ======================== GLTF LOADER');
const end = code.indexOf('function buildCapacitor() {');

if (start !== -1 && end !== -1) {
    code = code.substring(0, start) + updatedLoaderCode + '\n\n        ' + code.substring(end);
    
    // Scale adjustment in loadComp
    code = code.replace(
        /const scale = \(i === 0\) \? [0-9.]+ : 1.8;/g,
        'const scale = (i === 0) ? 0.75 : 1.8;'
    );
    
    fs.writeFileSync('public/index.html', code);
    console.log('Successfully updated index.html with latest GLB loader and auto-centering!');
} else {
    console.error('Markers not found in public/index.html');
}

