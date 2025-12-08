import * as THREE from 'three';
import { createInfoPanel } from '../ui/InfoPanel.js';

// NOTA: Quitamos "controls" de los argumentos, no lo necesitamos aquí.
export function setupInteraction(scene, renderer, camera, userGroup) {
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();
    let currentPanel = null; 

    // --- DIMMER ---
    const dimmerGeo = new THREE.SphereGeometry(2, 32, 32); 
    const dimmerMat = new THREE.MeshBasicMaterial({
        color: 0x000000,
        transparent: true,
        opacity: 0.85,
        side: THREE.BackSide,
        depthTest: false 
    });
    const dimmer = new THREE.Mesh(dimmerGeo, dimmerMat);
    dimmer.position.y = 1.6; 
    dimmer.renderOrder = 999; 
    dimmer.visible = false; 
    dimmer.name = "GlobalDimmer"; 
    userGroup.add(dimmer);

    function handleInteraction(rayOrigin, rayDirection, actionType) {
        raycaster.set(rayOrigin, rayDirection);

        // A. SELECT
        if (currentPanel && actionType === 'SELECT') {
            const intersects = raycaster.intersectObjects(currentPanel.children, true);
            if (intersects.length > 0) {
                let target = intersects[0].object;
                if (target.parent?.userData?.isButton) target = target.parent;
                if (target.userData?.isButton) {
                    target.userData.action();
                    return; 
                }
            }
        }

        // B. MUNDO
        const intersects = raycaster.intersectObjects(scene.children, true);
        
        const hit = intersects.find(hit => {
            if (hit.object.name === "GlobalDimmer") return false;
            if (!hit.object.isMesh || !hit.object.visible) return false;

            let isSelf = false;
            let obj = hit.object;
            while(obj) {
                if (obj === userGroup) { isSelf = true; break; }
                obj = obj.parent;
            }
            if (isSelf) return false;

            if (actionType === 'SELECT') {
                return hit.object.userData && hit.object.userData.isInteractable;
            } 
            else if (actionType === 'MOVE') {
                if (currentPanel) return false;
                if (hit.object.name === "WorldFloor") return true; // Clic en el suelo
                return !hit.object.userData || !hit.object.userData.isInteractable;
            }
        });

        if (hit) {
            if (actionType === 'SELECT') {
                // Abrir Panel
                dimmer.visible = true;
                currentPanel = createInfoPanel(hit.object.userData, () => {
                    scene.remove(currentPanel);
                    currentPanel = null;
                    dimmer.visible = false;
                });

                const distance = 1.5; 
                const direction = new THREE.Vector3();
                camera.getWorldDirection(direction);
                direction.y = 0; 
                direction.normalize();

                const targetPos = new THREE.Vector3().copy(userGroup.position).add(direction.multiplyScalar(distance));
                targetPos.y = 1.6;

                currentPanel.position.copy(targetPos);
                currentPanel.lookAt(userGroup.position.x, 1.6, userGroup.position.z);
                
                currentPanel.traverse((child) => {
                    if (child.isMesh) {
                        child.renderOrder = 1000;
                        child.material.depthTest = false; 
                    }
                });
                scene.add(currentPanel);

            } else if (actionType === 'MOVE') {
                // --- MOVIMIENTO LIMPIO ---
                const p = hit.point;
                const offset = new THREE.Vector3().subVectors(p, userGroup.position);
                offset.y = 0;
                
                // Solo movemos el userGroup.
                // Como la cámara es hija del grupo, viaja con él.
                // Como OrbitControls trabaja en espacio local de la cámara, 
                // el target local (frente a la cara) viaja también con el grupo.
                userGroup.position.add(offset);
                
                console.log("Teletransportado a:", p.x.toFixed(2), p.z.toFixed(2));
            }
        }
    }

    // --- LISTENERS ---
    const canvas = renderer.domElement;
    let mouseDownPos = new THREE.Vector2();
    
    canvas.addEventListener('pointerdown', (e) => {
        mouseDownPos.set(e.clientX, e.clientY);
    });

    canvas.addEventListener('pointerup', (e) => {
        if (mouseDownPos.distanceTo(new THREE.Vector2(e.clientX, e.clientY)) < 10) {
            mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
            mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
            raycaster.setFromCamera(mouse, camera);

            if (e.button === 0) handleInteraction(raycaster.ray.origin, raycaster.ray.direction, 'SELECT');
            else if (e.button === 2) handleInteraction(raycaster.ray.origin, raycaster.ray.direction, 'MOVE');
        }
    });

    window.addEventListener('contextmenu', (e) => e.preventDefault());

    // VR
    const controller1 = renderer.xr.getController(0);
    const controller2 = renderer.xr.getController(1);

    function onVRInteraction(event, type) {
        const controller = event.target;
        if (!controller.visible) return;
        const tempMatrix = new THREE.Matrix4();
        tempMatrix.identity().extractRotation(controller.matrixWorld);
        const rayOrigin = new THREE.Vector3().setFromMatrixPosition(controller.matrixWorld);
        const rayDirection = new THREE.Vector3(0, 0, -1).applyMatrix4(tempMatrix);
        handleInteraction(rayOrigin, rayDirection, type);
    }

    controller1.addEventListener('select', (e) => onVRInteraction(e, 'SELECT'));
    controller2.addEventListener('select', (e) => onVRInteraction(e, 'SELECT'));
    controller1.addEventListener('squeeze', (e) => onVRInteraction(e, 'MOVE'));
    controller2.addEventListener('squeeze', (e) => onVRInteraction(e, 'MOVE'));
}