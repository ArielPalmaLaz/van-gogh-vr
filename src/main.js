import * as THREE from 'three';
import { createScene } from './core/sceneSetup.js';
import { createDome } from './components/Dome.js';
import { createFloor } from './components/Floor.js';
import { loadGallery } from './components/Gallery.js';
import { setupControllers } from './systems/Controllers.js';
import { setupInteraction } from './systems/Interaction.js';
import { VRButton } from 'three/examples/jsm/webxr/VRButton.js';

// CAMBIO 1: Importamos nuestro nuevo control en lugar de OrbitControls
import { setupCameraControls } from './systems/CameraControls.js'; 

// 1. Configuración Básica
const { scene, camera, renderer } = createScene();
const container = document.getElementById('container');
container.appendChild(renderer.domElement);

// 2. User Rig
const userGroup = new THREE.Group();
userGroup.position.set(0, 0, 0); 
scene.add(userGroup);
userGroup.add(camera);

// 3. Botón VR
document.body.appendChild(VRButton.createButton(renderer));

// 4. Entorno
const dome = createDome();
scene.add(dome);
const floor = createFloor();
scene.add(floor);
loadGallery(scene);

// 5. Controles VR
const { controller1, controller2 } = setupControllers(scene, renderer);
userGroup.add(controller1);
userGroup.add(controller2);
const controllerGrip1 = renderer.xr.getControllerGrip(0);
const controllerGrip2 = renderer.xr.getControllerGrip(1);
userGroup.add(controllerGrip1);
userGroup.add(controllerGrip2);

// CAMBIO 2: Usamos el nuevo sistema de cámara manual
// Ya no creamos OrbitControls, lo que elimina el conflicto de "mirar al centro"
setupCameraControls(camera, renderer);

// 7. Interacción
setupInteraction(scene, renderer, camera, userGroup);

// 8. Loop
renderer.setAnimationLoop(() => {
    // Ya no hay controls.update()
    renderer.render(scene, camera);
});