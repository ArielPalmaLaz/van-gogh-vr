import * as THREE from 'three';
import { createInfoPanel } from '../ui/InfoPanel.js';

export function setupInteraction(scene, renderer, camera, userGroup) {
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();
    
    // --- ESTADO GENERAL ---
    let currentPanel = null; 
    let hoveredObject = null; 
    let savedIntensity = 0; 
    let hoveredButton = null; 
    let savedButtonColor = new THREE.Color();

    // --- 1. INDICADOR DE TELETRANSPORTE ---
    const markerGeo = new THREE.RingGeometry(0.2, 0.25, 32);
    markerGeo.rotateX(-Math.PI / 2);
    const markerMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.8 });
    const teleportMarker = new THREE.Mesh(markerGeo, markerMat);
    teleportMarker.visible = false;
    teleportMarker.raycast = () => {}; 
    scene.add(teleportMarker);

    // --- DIMMER ---
    const dimmerGeo = new THREE.SphereGeometry(2, 32, 32); 
    const dimmerMat = new THREE.MeshBasicMaterial({
        color: 0x000000, transparent: true, opacity: 0.85,
        side: THREE.BackSide, depthTest: false 
    });
    const dimmer = new THREE.Mesh(dimmerGeo, dimmerMat);
    dimmer.position.y = 1.6; 
    dimmer.renderOrder = 999; 
    dimmer.visible = false; 
    dimmer.name = "GlobalDimmer"; 
    userGroup.add(dimmer);

    function resetHover() {
        if (hoveredObject) {
            document.body.style.cursor = 'default';
            if (hoveredObject.parent) {
                const spot = hoveredObject.parent.children.find(c => c.isSpotLight);
                if (spot) spot.intensity = savedIntensity; 
            }
            hoveredObject = null;
        }
        if (hoveredButton) {
            document.body.style.cursor = 'default';
            hoveredButton.material.color.copy(savedButtonColor); 
            hoveredButton = null;
        }
    }

    // --- INTERACCIÓN (CLIC) ---
    function handleInteraction(rayOrigin, rayDirection, actionType) {
        raycaster.set(rayOrigin, rayDirection);

        // A. PANEL (MODIFICADO PARA BLOQUEAR EL MUNDO)
        if (currentPanel) {
            if (actionType === 'SELECT') {
                const intersects = raycaster.intersectObjects(currentPanel.children, true);
                const hit = intersects.find(h => h.object.userData.isButton || h.object.parent?.userData?.isButton);
                if (hit) {
                    const target = hit.object.userData.isButton ? hit.object : hit.object.parent;
                    if (target.userData.action) target.userData.action();
                }
                // Si hay un panel, el flujo termina aquí para SELECT
                return; 
            }
            if (actionType === 'MOVE') {
                // Si hay un panel, bloqueamos el teletransporte
                return; 
            }
        }

        // B. MUNDO (Solo llegamos aquí si NO hay panel abierto)
        const intersects = raycaster.intersectObjects(scene.children, true);
        const hit = intersects.find(hit => {
            if (hit.object.name === "GlobalDimmer") return false;
            if (!hit.object.isMesh || !hit.object.visible) return false;
            let obj = hit.object;
            while(obj) {
                if (obj === userGroup) return false;
                obj = obj.parent;
            }
            if (actionType === 'SELECT') return hit.object.userData && hit.object.userData.isInteractable;
            else if (actionType === 'MOVE') return hit.object.name === "WorldFloor";
        });

        if (hit) {
            if (actionType === 'SELECT') {
                dimmer.visible = true;
                teleportMarker.visible = false;
                currentPanel = createInfoPanel(hit.object.userData, () => {
                    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
                    scene.remove(currentPanel);
                    currentPanel = null;
                    dimmer.visible = false;
                    resetHover(); 
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
                const p = hit.point;
                const offset = new THREE.Vector3().subVectors(p, userGroup.position);
                offset.y = 0;
                userGroup.position.add(offset);
            }
        }
    }

    // --- HOVER Y MARCADOR ---
    function onPointerMove(event) {
        mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
        raycaster.setFromCamera(mouse, camera);

        if (currentPanel) {
            teleportMarker.visible = false;
            const intersects = raycaster.intersectObjects(currentPanel.children, true);
            const hitBtn = intersects.find(h => h.object.userData.isButton || h.object.parent?.userData?.isButton);

            if (hitBtn) {
                const targetBtn = hitBtn.object.userData.isButton ? hitBtn.object : hitBtn.object.parent;
                if (hoveredButton !== targetBtn) {
                    if (hoveredButton) hoveredButton.material.color.copy(savedButtonColor);
                    hoveredButton = targetBtn;
                    savedButtonColor.copy(targetBtn.material.color); 
                    targetBtn.material.color.offsetHSL(0, 0, 0.2); 
                    document.body.style.cursor = 'pointer';
                }
            } else {
                if (hoveredButton) {
                    hoveredButton.material.color.copy(savedButtonColor);
                    hoveredButton = null;
                    document.body.style.cursor = 'default';
                }
            }
            return; // Bloquea hover de cuadros si el panel está abierto
        }

        const intersects = raycaster.intersectObjects(scene.children, true);
        const hitArt = intersects.find(hit => hit.object.userData && hit.object.userData.isInteractable);
        const hitFloor = intersects.find(hit => hit.object.name === "WorldFloor");

        if (hitArt) {
            teleportMarker.visible = false;
            const target = hitArt.object;
            if (hoveredObject !== target) {
                resetHover(); 
                hoveredObject = target;
                document.body.style.cursor = 'pointer';
                if (target.parent) {
                    const spot = target.parent.children.find(c => c.isSpotLight);
                    if (spot) {
                        savedIntensity = spot.intensity; 
                        spot.intensity = savedIntensity * 2.5; 
                    }
                }
            }
        } else if (hitFloor) {
            resetHover();
            teleportMarker.visible = true;
            teleportMarker.position.copy(hitFloor.point);
            teleportMarker.position.y += 0.02; 
        } else {
            resetHover();
            teleportMarker.visible = false;
        }
    }

    // Listeners de ratón y VR se mantienen iguales...
    const canvas = renderer.domElement;
    canvas.addEventListener('pointermove', onPointerMove);
    let mouseDownPos = new THREE.Vector2();
    canvas.addEventListener('pointerdown', (e) => mouseDownPos.set(e.clientX, e.clientY));
    canvas.addEventListener('pointerup', (e) => {
        if (mouseDownPos.distanceTo(new THREE.Vector2(e.clientX, e.clientY)) < 10) {
            mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
            mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
            raycaster.setFromCamera(mouse, camera);
            if (e.button === 0) handleInteraction(raycaster.ray.origin, raycaster.ray.direction, 'SELECT');
            else if (e.button === 2) handleInteraction(raycaster.ray.origin, raycaster.ray.direction, 'MOVE');
        }
    });

    window.addEventListener('contextmenu', (e) => e.preventDefault());

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