import * as THREE from 'three';
import { VRButton } from 'three/examples/jsm/webxr/VRButton.js';
import { createScene } from './core/sceneSetup.js';
import { createRoom } from './components/Room.js';
import { createFloor } from './components/Floor.js';
import { loadGallery } from './components/Gallery.js';
import { setupAudio } from './components/Audio.js';
import { setupControllers } from './systems/Controllers.js';
import { setupCameraControls } from './systems/CameraControls.js';
import { setupInteraction } from './systems/Interaction.js';
import { createCentralGarden } from './components/CentralGarden.js';
import { createDome } from './components/Dome.js';

const { scene, camera, renderer } = createScene();
document.getElementById('container').appendChild(renderer.domElement);
document.body.appendChild(VRButton.createButton(renderer));

const userGroup = new THREE.Group();
userGroup.position.set(0, 0, 50); 
scene.add(userGroup);
userGroup.add(camera);

scene.add(createRoom());
scene.add(createFloor());
scene.add(createCentralGarden());
scene.add(createDome());
loadGallery(scene);
setupAudio(camera);

const { controller1, controller2 } = setupControllers(scene, renderer);
userGroup.add(controller1); 
userGroup.add(controller2);
setupCameraControls(camera, renderer);

// --- ESTADO DE ANIMACIÓN ---
let isIntroAnimating = true;

// Pasamos la comprobación de animación como una función flecha
setupInteraction(scene, renderer, camera, userGroup, () => isIntroAnimating);

const startPos = new THREE.Vector3(0, 0, 50);
const targetPos = new THREE.Vector3(0, 0, 20); 
let progress = 0;

const entranceZ = 25; 
const doorThreshold = 15; 
const doorSpeed = 0.05;

renderer.setAnimationLoop(() => {
    // A. Cinemática
    if (isIntroAnimating) {
        progress += 0.0025;
        if (progress <= 1) {
            userGroup.position.lerpVectors(startPos, targetPos, progress);
        } else {
            isIntroAnimating = false; // Al terminar, setupInteraction permite clics automáticamente
        }
    }

    // B. Puertas
    const doorL = scene.getObjectByName("DoorLeft");
    const doorR = scene.getObjectByName("DoorRight");
    if (doorL && doorR) {
        const dist = userGroup.position.distanceTo(new THREE.Vector3(0, 0, entranceZ));
        const closedX_L = -(4.5 / 4); 
        const closedX_R = (4.5 / 4);

        if (isIntroAnimating && dist < doorThreshold) { 
            if (doorL.position.x > -4.5) doorL.position.x -= doorSpeed;
            if (doorR.position.x < 4.5) doorR.position.x += doorSpeed;
        } else { 
            if (doorL.position.x < closedX_L) doorL.position.x += doorSpeed;
            if (doorR.position.x > closedX_R) doorR.position.x -= doorSpeed;
        }
    }

    renderer.render(scene, camera);
});