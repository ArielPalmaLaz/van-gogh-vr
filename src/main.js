import * as THREE from 'three';
import { createScene } from './core/sceneSetup.js';
import { createFloor } from './components/Floor.js';
import { createRoom } from './components/Room.js';
import { loadGallery } from './components/Gallery.js';
import { createCentralGarden } from './components/CentralGarden.js'; // NUEVO
import { setupControllers } from './systems/Controllers.js';
import { setupInteraction } from './systems/Interaction.js';
import { setupCameraControls } from './systems/CameraControls.js';
import { VRButton } from 'three/examples/jsm/webxr/VRButton.js';
import { setupAudio } from './components/Audio.js';

// 1. CONFIGURACIÓN BÁSICA DE LA ESCENA
const { scene, camera, renderer } = createScene();
const container = document.getElementById('container');
container.appendChild(renderer.domElement);

// --- ILUMINACIÓN AMBIENTAL ---
// Muy tenue para mantener el drama. La luz principal viene de los focos de los cuadros.
const ambientLight = new THREE.AmbientLight(0xffffff, 0.05); 
scene.add(ambientLight);

// 2. USER RIG (Jugador)
const userGroup = new THREE.Group();
// Posición inicial: Z=20 (En la entrada de la "V", mirando hacia el jardín)
userGroup.position.set(0, 0, 20); 
scene.add(userGroup);
userGroup.add(camera);

// 3. BOTÓN VR
document.body.appendChild(VRButton.createButton(renderer));

// 4. ENTORNO ARQUITECTÓNICO
// A) La Habitación (Cúpula/Paredes exteriores)
const room = createRoom(); 
scene.add(room);

// B) El Suelo (Textura de Madera)
const floor = createFloor(); 
scene.add(floor);

// C) El Jardín Central (Decoración Low Poly en el centro)
const garden = createCentralGarden();
garden.position.set(0, 0, 0); // Centro exacto
scene.add(garden);

// 5. GALERÍA DE ARTE (Monolitos en V)
loadGallery(scene);

// 6. SISTEMA DE AUDIO (Música ambiente + Click to play)
setupAudio(camera);

// 7. CONTROLES (VR y PC)
// A) Controladores VR (Manos)
const { controller1, controller2 } = setupControllers(scene, renderer);
userGroup.add(controller1);
userGroup.add(controller2);

// Modelos de los mandos (Grips)
const controllerGrip1 = renderer.xr.getControllerGrip(0);
const controllerGrip2 = renderer.xr.getControllerGrip(1);
userGroup.add(controllerGrip1);
userGroup.add(controllerGrip2);

// B) Controles de Cámara PC (WASD + Mouse)
setupCameraControls(camera, renderer);

// 8. SISTEMA DE INTERACCIÓN (Raycaster, Hover, Clics)
setupInteraction(scene, renderer, camera, userGroup);

// 9. BUCLE DE RENDERIZADO
renderer.setAnimationLoop(() => {
    renderer.render(scene, camera);
});