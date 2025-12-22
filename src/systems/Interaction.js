import * as THREE from 'three';
import { createInfoPanel } from '../ui/InfoPanel.js';

// Añadimos isAnimatingCheck como parámetro
export function setupInteraction(scene, renderer, camera, userGroup, isAnimatingCheck) {
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
        // BLOQUEO DURANTE ANIMACIÓN
        if (isAnimatingCheck && isAnimatingCheck()) return;

        raycaster.set(rayOrigin, rayDirection);

        if (currentPanel) {
            if (actionType === 'SELECT') {
                const intersects = raycaster.intersectObjects(currentPanel.children, true);
                const hit = intersects.find(h => h.object.userData.isButton || h.object.parent?.userData?.isButton);
                if (hit) {
                    const target = hit.object.userData.isButton ? hit.object : hit.object.parent;
                    if (target.userData.action) target.userData.action();
                }
                return; 
            }
            if (actionType === 'MOVE') return; 
        }

        const allIntersects = raycaster.intersectObjects(scene.children, true);
        
        const validIntersects = allIntersects.filter(h => {
            if (h.object.name === "GlobalDimmer") return false;
            let obj = h.object;
            while(obj) {
                if (obj === userGroup) return false;
                obj = obj.parent;
            }
            return h.object.visible;
        });

        if (validIntersects.length > 0) {
            const firstHit = validIntersects[0].object;

            if (firstHit.name === "Obstacle" || firstHit.parent?.name === "Obstacle") {
                return;
            }

            if (actionType === 'SELECT' && firstHit.userData?.isInteractable) {
                dimmer.visible = true;
                teleportMarker.visible = false;
                currentPanel = createInfoPanel(firstHit.userData, () => {
                    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
                    scene.remove(currentPanel);
                    currentPanel = null;
                    dimmer.visible = false;
                    resetHover(); 
                });
                
                const direction = new THREE.Vector3();
                camera.getWorldDirection(direction);
                direction.y = 0; direction.normalize();
                const targetPos = new THREE.Vector3().copy(userGroup.position).add(direction.multiplyScalar(1.5));
                targetPos.y = 1.6;
                currentPanel.position.copy(targetPos);
                currentPanel.lookAt(userGroup.position.x, 1.6, userGroup.position.z);
                scene.add(currentPanel);

            } else if (actionType === 'MOVE' && firstHit.name === "WorldFloor") {
                const p = validIntersects[0].point;
                const offset = new THREE.Vector3().subVectors(p, userGroup.position);
                offset.y = 0;
                userGroup.position.add(offset);
            }
        }
    }

    // --- HOVER Y MARCADOR ---
    function onPointerMove(event) {
        // BLOQUEO DE EFECTOS VISUALES DURANTE ANIMACIÓN
        if (isAnimatingCheck && isAnimatingCheck()) {
            teleportMarker.visible = false;
            resetHover();
            return;
        }

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
            return;
        }

        const allIntersects = raycaster.intersectObjects(scene.children, true);
        const validIntersects = allIntersects.filter(h => h.object.visible && h.object.name !== "GlobalDimmer");

        if (validIntersects.length > 0) {
            const firstHit = validIntersects[0].object;

            if (firstHit.name === "Obstacle" || firstHit.parent?.name === "Obstacle") {
                resetHover();
                teleportMarker.visible = false;
                return;
            }

            if (firstHit.userData && firstHit.userData.isInteractable) {
                teleportMarker.visible = false;
                if (hoveredObject !== firstHit) {
                    resetHover(); 
                    hoveredObject = firstHit;
                    document.body.style.cursor = 'pointer';
                    const spot = firstHit.parent?.children.find(c => c.isSpotLight);
                    if (spot) {
                        savedIntensity = spot.intensity; 
                        spot.intensity = savedIntensity * 2.5; 
                    }
                }
            } 
            else if (firstHit.name === "WorldFloor") {
                resetHover();
                teleportMarker.visible = true;
                teleportMarker.position.copy(validIntersects[0].point);
                teleportMarker.position.y += 0.02; 
            } else {
                resetHover();
                teleportMarker.visible = false;
            }
        }
    }

    const canvas = renderer.domElement;
    canvas.addEventListener('pointermove', onPointerMove);
    let mouseDownPos = new THREE.Vector2();
    canvas.addEventListener('pointerdown', (e) => mouseDownPos.set(e.clientX, e.clientY));
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

    const controller1 = renderer.xr.getController(0);
    const controller2 = renderer.xr.getController(1);
    
    function onVRInteraction(event, type) {
        // Bloqueo VR
        if (isAnimatingCheck && isAnimatingCheck()) return;

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