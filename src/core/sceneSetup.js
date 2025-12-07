import * as THREE from 'three';

export function createScene() {
    // 1. Escena
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x202020); // Gris oscuro para no cansar la vista

    // 2. Cámara
    // FOV de 70 es estándar para pantallas, en VR el headset lo anula automáticamente.
    const camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.1, 100);
    // Posición inicial del usuario (altura promedio 1.6m - RNF3)
    camera.position.set(0, 1.6, 0); 

    // 3. Renderizador
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    
    // IMPORTANTE: Habilitar WebXR para que funcione en el Oculus
    renderer.xr.enabled = true;

    // 4. Iluminación Básica
    // Luz ambiental suave para que nada sea totalmente negro
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    // Luz direccional (como un "sol" o foco de techo) para dar sombras y volumen
    const dirLight = new THREE.DirectionalLight(0xffffff, 1);
    dirLight.position.set(5, 10, 7);
    scene.add(dirLight);

    // 5. Manejo de Redimensionado de Pantalla (Resize)
    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    });

    // Devolvemos los objetos para usarlos en el main.js
    return { scene, camera, renderer };
}