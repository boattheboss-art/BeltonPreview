const fs = require('fs');
let code = fs.readFileSync('public/index.html', 'utf8');

const oldHR = code.substring(code.indexOf('function onHR(results) {'), code.indexOf('const mpH = new Hands'));
const newHR = \unction onHR(results) {
            hCtx.save(); hCtx.clearRect(0, 0, handCanvas.width, handCanvas.height);
            if (appMode !== 'CAMERA') { hCtx.restore(); return; } // Skip hand logic in Normal mode

            let lm = results.multiHandLandmarks?.[0];
            handDetected = !!lm;

            if (handDetected) {
                document.getElementById('status-text').innerText = 'ระบบตรวจจับมือทำงาน'; document.getElementById('dot').classList.add('on');

                const px = lm.map(l => ({ x: (1 - l.x) * handCanvas.width, y: l.y * handCanvas.height }));

                // 2. 3D Positioning (Always in center, follow wrist)
                const w = lm[0], m = lm[9], idx = lm[5], pk = lm[17];
                modelHolder.position.lerp(new THREE.Vector3(0, 0, 0), 0.2);

                const vU = new THREE.Vector3(1 - m.x, 1 - m.y, -m.z * 1.5).sub(new THREE.Vector3(1 - w.x, 1 - w.y, -w.z * 1.5)).normalize();
                const vR = new THREE.Vector3(1 - pk.x, 1 - pk.y, -pk.z * 1.5).sub(new THREE.Vector3(1 - idx.x, 1 - idx.y, -idx.z * 1.5)).normalize();
                const vN = new THREE.Vector3().crossVectors(vR, vU).normalize(); vR.crossVectors(vU, vN).normalize();
                modelHolder.quaternion.slerp(new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(vR, vU, vN)), 0.2);

                // 3. Gesture Detection (Fist = Assemble, Open = Explode)
                const fI = lm[8].y > lm[6].y, fM = lm[12].y > lm[10].y, fR = lm[16].y > lm[14].y, fP = lm[20].y > lm[18].y;

                let newState = gestureState; 
                if (fI && fM && fR && fP) newState = 'NORMAL'; // Fist
                else if (!fI && !fM && !fR && !fP) newState = 'EXPLODED'; // Open hand

                if (newState !== gestureState) {
                    gestureState = newState;
                    if (gestureState === 'EXPLODED') { updateBadge('?? แยกร่าง (EXPLODED)', 'explode'); playSound('on'); }
                    else { updateBadge('? รวมร่าง (ASSEMBLED)', ''); playSound('off'); }
                }

                explodeLerpTarget = (gestureState === 'EXPLODED') ? 1 : 0;
                particleSys.visible = true;

                // 4. Holographic Ruler
                const tTip = px[4], iTip = px[8];
                const distPx = Math.sqrt((tTip.x - iTip.x) ** 2 + (tTip.y - iTip.y) ** 2);

                if (rulerEnabled) {
                    const mm = Math.round(distPx * 0.4);
                    hCtx.beginPath(); hCtx.moveTo(tTip.x, tTip.y); hCtx.lineTo(iTip.x, iTip.y);
                    hCtx.strokeStyle = 'rgba(10, 132, 255, 0.8)'; hCtx.lineWidth = 2; hCtx.setLineDash([5, 5]); hCtx.stroke(); hCtx.setLineDash([]);
                    hCtx.fillStyle = 'rgba(10, 132, 255, 0.9)'; hCtx.font = 'bold 14px sans-serif'; hCtx.textAlign = 'center';
                    hCtx.fillText(\\\\ mm\\\, (tTip.x + iTip.x) / 2, (tTip.y + iTip.y) / 2 - 10);
                }

                scaleLerp = THREE.MathUtils.lerp(scaleLerp, 1.0, 0.12);
            } else {
                document.getElementById('status-text').innerText = 'STANDBY'; document.getElementById('dot').classList.remove('on');
                scaleLerp = THREE.MathUtils.lerp(scaleLerp, 1.0, 0.05);
                modelHolder.position.lerp(new THREE.Vector3(0, 0, 0), 0.05);
                updateBadge('', ''); gestureState = 'NORMAL'; explodeLerpTarget = 0; particleSys.visible = true;
            }

            modelHolder.scale.setScalar(scaleLerp);
            hCtx.restore();
        }

        \;

code = code.replace(oldHR, newHR);
fs.writeFileSync('public/index.html', code);
