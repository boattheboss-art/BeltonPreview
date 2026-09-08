const fs = require('fs');
let code = fs.readFileSync('public/index.html', 'utf8');

const newGlbCode = `        // ======================== GLTF LOADER & EXPLODE FOR COIL MODEL ========================
        const gltfLoader = new THREE.GLTFLoader();

        function getExplodeVectorForNode(name, pos) {
            const n = (name || '').toLowerCase();
            
            // 1. Arm stack, blades, suspension, rivets, cavity, comb
            if (n.includes('arm') || n.includes('blade') || n.includes('recessed') || n.includes('cavity') || n.includes('rivet') || n.includes('suspension') || n.includes('comb')) {
                return new THREE.Vector3(-2.5, 0, 1.2);
            }
            // 2. Pivot bearing & triad balance ports
            if (n.includes('pivot') || n.includes('triad')) {
                return new THREE.Vector3(0, 3.0, 0);
            }
            // 3. Voice coil & core plate & vcm balance ports
            if (n.includes('voice_coil') || n.includes('vcm_port') || n.includes('vcm_core')) {
                return new THREE.Vector3(2.0, 0, -2.0);
            }
            // 4. Gold yoke bezel & chassis wings
            if (n.includes('vcm') || n.includes('gold') || n.includes('bezel') || n.includes('wing') || n.includes('shroud')) {
                return new THREE.Vector3(2.0, 2.5, -2.0);
            }
            // 5. FPC flex ribbon & strain relief clamp
            if (n.includes('fpc') || n.includes('ribbon') || n.includes('clamp') || n.includes('strain') || n.includes('flex')) {
                return new THREE.Vector3(1.2, 0.8, 1.0);
            }
            // 6. Preamp PCB, IC chip, gold pins, connector, washers, pin base
            if (n.includes('pcb') || n.includes('pin') || n.includes('preamp') || n.includes('washer') || n.includes('header') || n.includes('chip') || n.includes('housing')) {
                return new THREE.Vector3(3.8, 0, 2.0);
            }
            
            // Custom sculpted parts (e.g. 'ทรงกระบอก', 'Vert', 'Stroke')
            if (pos) {
                const dir = new THREE.Vector3(pos.x, pos.y, pos.z);
                if (dir.lengthSq() > 0.05) {
                    return dir.clone().normalize().multiplyScalar(2.2);
                }
            }
            return new THREE.Vector3(0, 1.8, 0);
        }

        function buildHDD() {
            const n = new THREE.Group(), x = new THREE.Group();
            
            gltfLoader.load(
                'models/coil.glb',
                (gltf) => {
                    const sceneModel = gltf.scene;
                    const children = [...sceneModel.children];
                    
                    children.forEach((child) => {
                        const expVec = getExplodeVectorForNode(child.name, child.position);
                        child.traverse((c) => {
                            if (c.isMesh) {
                                c.castShadow = true;
                                c.receiveShadow = true;
                                if (c.material) {
                                    c.material.side = THREE.DoubleSide;
                                }
                            }
                        });
                        addM(n, child, expVec);
                    });
                    
                    // Initial rotation
                    n.rotation.y = Math.PI * 0.22;
                },
                undefined,
                (err) => {
                    console.error('Error loading models/coil.glb:', err);
                }
            );
            
            return { n, x };
        }`;

const start = code.indexOf('const MODULE_GROUPS = {');
const end = code.indexOf('function buildCapacitor() {');

if (start !== -1 && end !== -1) {
    code = code.substring(0, start) + newGlbCode + '\n\n        ' + code.substring(end);
    
    // Update COMP_DATA[0] info
    code = code.replace(
        "name: 'ชุดหัวอ่านฮาร์ดดิสก์', sub: 'Actuator E-Block',",
        "name: 'โมเดลคอยล์ & หัวอ่าน', sub: 'Coil & Actuator Model (GLB)',"
    );
    code = code.replace(
        "specs: [{ l: 'ประเภท', v: 'HDD Actuator Assembly' }, { l: 'วัสดุ', v: 'CNC Duralumin / Gold' }, { l: 'ชิ้นส่วน', v: '6 โมดูลหลัก' }],",
        "specs: [{ l: 'ประเภท', v: 'Coil & Actuator (GLB)' }, { l: 'แหล่งไฟล์', v: 'โมเดลคอย.glb' }, { l: 'การแสดงผล', v: 'แยกชิ้น Exploded View' }],"
    );
    
    // Update bottom dock button label
    code = code.replace(
        '<span class="dock-icon">💽</span><span class="dock-label">ฮาร์ดดิสก์</span>',
        '<span class="dock-icon">💽</span><span class="dock-label">โมเดลคอย</span>'
    );

    // Adjust scale for GLB model in loadComp
    code = code.replace(
        'const scale = (i === 0) ? 0.8 : 1.8;',
        'const scale = (i === 0) ? 0.55 : 1.8;'
    );
    
    fs.writeFileSync('public/index.html', code);
    console.log('Successfully updated index.html with GLB loader!');
} else {
    console.error('Markers not found in public/index.html');
}

