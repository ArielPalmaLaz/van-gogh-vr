import { createScene } from './core/sceneSetup.js';
import { createDome } from './components/Dome.js';
import { VRButton } from 'three/examples/jsm/webxr/VRButton.js';

// 1. Inicializar configuración básica
const { scene, camera, renderer } = createScene();

// 2. Añadir al DOM
const container = document.getElementById('container');
container.appendChild(renderer.domElement);

// 3. Añadir Botón de VR (Requisito RF1 [cite: 36])
// Esto añade automáticamente el botón "Enter VR" si el navegador es compatible
document.body.appendChild(VRButton.createButton(renderer));

// 4. Construir el entorno
const dome = createDome();
scene.add(dome);

// 5. Bucle de Renderizado (Animation Loop)
// En VR NO se usa requestAnimationFrame estándar, se usa setAnimationLoop
renderer.setAnimationLoop(() => {
    // Aquí irá la lógica de actualizaciones por frame
    
    // Renderizar la escena
    renderer.render(scene, camera);
});