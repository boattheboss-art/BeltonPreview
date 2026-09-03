const fs = require('fs');
let code = fs.readFileSync('public/index.html', 'utf8');

const updatedLoaderCode = `        // ======================== GLTF LOADER FOR MAIN COIL MODEL ========================
        const gltfLoader = new THREE.GLTFLoader();

        function getExplodeVectorForNode(name, pos) {
            const n = (name || '').toLowerCase();
            
            // 1. Arm stack & blades (Vert.001..Vert.007, arm, blade)
            if (n.includes('vert.001') || n.includes('vert.002') || n.includes('vert.003') || 
                n.includes('vert.004') || n.includes('vert.005') || n.includes('vert.006') || 
                n.includes('vert.007') || n.includes('arm') || n.includes('blade') || n.includes('suspension')) {
                return new THREE.Vector3(-2.8, 0, 0.8);
            }
            // 2. Pivot bearing hub (Pivot_Outer_Ring, ทรงกระบอก)
            if (n.includes('pivot') || n.includes('ทรงกระบอก')) {
                return new THREE.Vector3(0, 2.5, 0);
            }
            // 3. VCM / Voice coil magnet plate & coils (Vert.008, Vert.009, vcm)
            if (n.includes('vert.008') || n.includes('vert.009') || n.includes('vcm') || n.includes('voice_coil')) {
                return new THREE.Vector3(2.0, 0, 1.2);
            }
            // 4. FPC ribbon & clamp
            if (n.includes('fpc') || n.includes('ribbon') || n.includes('clamp') || n.includes('strain') || n.includes('flex')) {
                return new THREE.Vector3(1.2, 0.8, -1.0);
            }
            // 5. Connector plate & PCB planes (ระนาบ)
            if (n.includes('ระนาบ') || n.includes('pcb') || n.includes('housing')) {
                return new THREE.Vector3(2.8, 0, -1.8);
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

        function buildHDD(loadId) {
            const n = new THREE.Group(), x = new THREE.Group();
            
            gltfLoader.load(
                'models/coil.glb?v=' + Date.now(), // Cache-busting
                (gltf) => {
                    // หากผู้ใช้สลับไปโมเดลอื่นแล้วก่อนที่ GLTF จะโหลดเสร็จ ให้ยกเลิก
                    if (loadId !== undefined && loadId !== currentLoadId) return;

                    const sceneModel = gltf.scene;
                    const allChildren = [...sceneModel.children];
                    
                    // 1. กรองเฉพาะชิ้นส่วนโมเดลหลัก (ตัดกล่อง PCB เก่าที่ลอยอยู่ที่ z < 5.0 ออก)
                    const mainParts = allChildren.filter(child => {
                        const p = child.position;
                        const isOldOrFloating = (p.z < 5.0 || child.name.includes('ว่างเปล่า'));
                        return !isOldOrFloating;
                    });
                    
                    // 2. คำนวณจุดกึ่งกลางโมเดลอย่างแม่นยำและปลอดภัยโดยตรง
                    const bbox = new THREE.Box3();
                    mainParts.forEach(part => bbox.expandByObject(part));
                    const centerOffset = new THREE.Vector3();
                    bbox.getCenter(centerOffset);
                    
                    // 3. จัดตำแหน่งและประกอบร่างโมเดล
                    mainParts.forEach((child) => {
                        child.position.sub(centerOffset);
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
                    
                    // ปรับมุมมองโมเดลให้สวยงาม
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
    fs.writeFileSync('public/index.html', code);
    console.log('Successfully updated index.html with safe bounding box & robust filter!');
} else {
    console.error('Markers not found in public/index.html');
}

