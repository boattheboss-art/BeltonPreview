const fs = require('fs');
let code = fs.readFileSync('public/index.html', 'utf8');

const updatedLoaderCode = `        // ======================== GLTF LOADER & FILTER SINGLE MODEL ========================
        const gltfLoader = new THREE.GLTFLoader();

        function getExplodeVectorForNode(name, pos) {
            const n = (name || '').toLowerCase();
            
            // 1. Arm stack & blades (Vert.001..Vert.007, arm, blade)
            if (n.includes('vert.001') || n.includes('vert.002') || n.includes('vert.003') || 
                n.includes('vert.004') || n.includes('vert.005') || n.includes('vert.006') || 
                n.includes('vert.007') || n.includes('arm') || n.includes('blade') || n.includes('suspension')) {
                return new THREE.Vector3(-2.8, 0, 0.5);
            }
            // 2. Pivot bearing hub & cylindrical shafts (Pivot_Outer_Ring, ทรงกระบอก)
            if (n.includes('pivot') || n.includes('ทรงกระบอก')) {
                return new THREE.Vector3(0, 2.5, 0);
            }
            // 3. VCM / Voice coil magnet plate & coils (Vert.008, Vert.009, vcm)
            if (n.includes('vert.008') || n.includes('vert.009') || n.includes('vcm') || n.includes('voice_coil')) {
                return new THREE.Vector3(1.8, 0, 1.8);
            }
            // 4. Gold bezel & chassis wings
            if (n.includes('wing') || n.includes('gold') || n.includes('bezel') || n.includes('shroud')) {
                return new THREE.Vector3(1.8, 2.0, 1.8);
            }
            // 5. FPC ribbon & clamp
            if (n.includes('fpc') || n.includes('ribbon') || n.includes('clamp') || n.includes('strain') || n.includes('flex')) {
                return new THREE.Vector3(1.2, 0.8, -1.0);
            }
            // 6. Preamp PCB, IC chip, gold pins, connector, washers, pin base
            if (n.includes('pcb') || n.includes('pin') || n.includes('preamp') || n.includes('washer') || n.includes('header') || n.includes('chip') || n.includes('housing')) {
                return new THREE.Vector3(3.5, 0, -2.0);
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
                'models/coil.glb',
                (gltf) => {
                    const sceneModel = gltf.scene;
                    const children = [...sceneModel.children];
                    
                    // Pivot center offset to align the model to origin (0,0,0)
                    const centerOffset = new THREE.Vector3(0, 3.132168, 10.643891);
                    
                    children.forEach((child) => {
                        // กรองเอาเฉพาะโมเดลตัวหลักที่ผู้ใช้ปั้น (ตัดโมเดลตัวเก่า/ตัวซ้ำที่ติดมาออก)
                        const p = child.position;
                        const isMainModel = (p.z > 5.0 || p.y > 2.5);
                        
                        if (!isMainModel) {
                            return; // ข้ามโมเดลตัวเก่าที่ติดมาในไฟล์
                        }
                        
                        // ปรับตำแหน่งให้กึ่งกลาง (Center)
                        child.position.sub(centerOffset);
                        
                        // คำนวณเวกเตอร์แยกร่าง
                        const expVec = getExplodeVectorForNode(child.name, child.position);
                        
                        child.traverse((c) => {
                            if (c.isMesh) {
                                c.castShadow = true;
                                c.receiveShadow = true;
                                if (c.material) {
                                    c.material.side = THREE.DoubleSide;
                                    c.material.metalness = Math.min(c.material.metalness || 0.85, 0.9);
                                    c.material.roughness = Math.max(c.material.roughness || 0.25, 0.15);
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

const start = code.indexOf('// ======================== GLTF LOADER & EXPLODE FOR COIL MODEL ========================');
const end = code.indexOf('function buildCapacitor() {');

if (start !== -1 && end !== -1) {
    code = code.substring(0, start) + updatedLoaderCode + '\n\n        ' + code.substring(end);
    
    // Scale adjustment for single model
    code = code.replace(
        'const scale = (i === 0) ? 0.55 : 1.8;',
        'const scale = (i === 0) ? 0.75 : 1.8;'
    );
    
    fs.writeFileSync('public/index.html', code);
    console.log('Successfully updated index.html to show only the single main model!');
} else {
    console.error('Markers not found in public/index.html');
}

