import * as THREE from 'three';
import { createInfoPanel } from '../ui/InfoPanel.js';

export function setupInteraction(scene, renderer, camera, userGroup) {
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();
    
    // --- ESTADO GENERAL ---
    let currentPanel = null; 
    let hoveredObject = null; // Cuadros
    let savedIntensity = 0; 
    let hoveredButton = null; // Botones
    let savedButtonColor = new THREE.Color();

    // --- 1. INDICADOR DE TELETRANSPORTE  ---
    const markerGeo = new THREE.RingGeometry(0.2, 0.25, 32); // Anillo fino
    markerGeo.rotateX(-Math.PI / 2); // Acostado en el suelo
    const markerMat = new THREE.MeshBasicMaterial({ 
        color: 0xffffff, 
        transparent: true, 
        opacity: 0.8 
    });
    const teleportMarker = new THREE.Mesh(markerGeo, markerMat);
    teleportMarker.visible = false;
    // Importante: No queremos que el raycaster choque con el propio marcador
    teleportMarker.raycast = () => {}; 
    scene.add(teleportMarker);

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

    // --- UTILS ---
    function resetHover() {
        // Reset Cuadros
        if (hoveredObject) {
            document.body.style.cursor = 'default';
            if (hoveredObject.parent) {
                const spot = hoveredObject.parent.children.find(c => c.isSpotLight);
                if (spot) spot.intensity = savedIntensity; 
            }
            hoveredObject = null;
        }
        // Reset Botones
        if (hoveredButton) {
            document.body.style.cursor = 'default';
            hoveredButton.material.color.copy(savedButtonColor); 
            hoveredButton = null;
        }
    }

    // --- INTERACCIÓN (CLIC) ---
    function handleInteraction(rayOrigin, rayDirection, actionType) {
        raycaster.set(rayOrigin, rayDirection);

        // A. PANEL
        if (currentPanel && actionType === 'SELECT') {
            const intersects = raycaster.intersectObjects(currentPanel.children, true);
            const hit = intersects.find(h => h.object.userData.isButton || h.object.parent?.userData?.isButton);
            if (hit) {
                const target = hit.object.userData.isButton ? hit.object : hit.object.parent;
                if (target.userData.action) target.userData.action();
                return; 
            }
        }

        // B. MUNDO
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
            else if (actionType === 'MOVE') {
                if (currentPanel) return false; 
                if (hit.object.name === "WorldFloor") return true; 
                return false;
            }
        });

        if (hit) {
            if (actionType === 'SELECT') {
                // Abrir Panel
                dimmer.visible = true;
                teleportMarker.visible = false; // Ocultar marcador al abrir
                currentPanel = createInfoPanel(hit.object.userData, () => {
                    scene.remove(currentPanel);
                    currentPanel = null;
                    dimmer.visible = false;
                    resetHover(); 
                });
                
                // Posicionar panel..
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
                // Teletransportar
                const p = hit.point;
                const offset = new THREE.Vector3().subVectors(p, userGroup.position);
                offset.y = 0;
                userGroup.position.add(offset);
            }
        }
    }

    // --- HOVER Y MARCADOR (POINTER MOVE) ---
    function onPointerMove(event) {
        mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
        raycaster.setFromCamera(mouse, camera);

        // 1. SI HAY PANEL ABIERTO 
        if (currentPanel) {
            teleportMarker.visible = false; // No mostrar marcador
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

        // 2. EXPLORACIÓN DEL MUNDO
        const intersects = raycaster.intersectObjects(scene.children, true);
        
        // Buscamos Cuadros y Suelo por separado
        const hitArt = intersects.find(hit => {
            if (hit.object.name === "GlobalDimmer") return false;
            return hit.object.userData && hit.object.userData.isInteractable;
        });

        const hitFloor = intersects.find(hit => hit.object.name === "WorldFloor");

        // LÓGICA DE PRIORIDAD
        if (hitArt) {
            // Prioridad A: Estamos sobre un cuadro
            teleportMarker.visible = false; // Ocultar marcador de suelo

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
            // Prioridad B: No hay cuadro, pero hay suelo -> Mostrar Marcador
            resetHover(); // Limpiar hover de cuadros si salimos de uno
            
            teleportMarker.visible = true;
            // Copiamos la posición del impacto
            teleportMarker.position.copy(hitFloor.point);
            // Lo elevamos un milímetro para que no parpadee con la textura del suelo
            teleportMarker.position.y += 0.02; 
        } else {
            // Prioridad C: Nada (Cielo o paredes no interactivas)
            resetHover();
            teleportMarker.visible = false;
        }
    }

    // --- LISTENERS ---
    const canvas = renderer.domElement;
    let mouseDownPos = new THREE.Vector2();
    
    canvas.addEventListener('pointermove', onPointerMove);
    
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

    // VR CONTROLLERS (Mantenemos igual)
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