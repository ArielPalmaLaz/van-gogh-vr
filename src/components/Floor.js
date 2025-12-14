import * as THREE from 'three';

export function createFloor() {
    const group = new THREE.Group();

    // 1. CARGAR TEXTURA
    const loader = new THREE.TextureLoader();
    
    // Usamos una textura de madera de calidad (CC0)
    // Si quieres cambiarla, guarda tu imagen en public/assets/textures/suelo.jpg 
    // y cambia esta URL por: '/assets/textures/suelo.jpg'
    const textureUrl = 'https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/hardwood2_diffuse.jpg';
    
    const texture = loader.load(textureUrl);
    const normalMap = loader.load('https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/hardwood2_bump.jpg');
    const roughnessMap = loader.load('https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/hardwood2_roughness.jpg');

    // 2. CONFIGURAR REPETICIÓN (Tiling)
    // Esto es clave: hace que la textura se repita muchas veces para que tenga alta resolución
    [texture, normalMap, roughnessMap].forEach(t => {
        t.wrapS = THREE.RepeatWrapping;
        t.wrapT = THREE.RepeatWrapping;
        t.repeat.set(10, 10); // Repetir 10 veces en X y 10 en Y
        t.colorSpace = THREE.SRGBColorSpace;
    });

    // 3. MATERIAL REALISTA
    const floorMaterial = new THREE.MeshStandardMaterial({ 
        map: texture,
        normalMap: normalMap,       // Da relieve falso (grietas de la madera)
        roughnessMap: roughnessMap, // Controla qué partes brillan y cuáles no
        roughness: 0.8,             // Base mate
        metalness: 0.1,
        side: THREE.DoubleSide
    });

    // 4. SUELO PRINCIPAL (Círculo grande)
    const mainFloorGeo = new THREE.CircleGeometry(25, 64); 
    const mainFloor = new THREE.Mesh(mainFloorGeo, floorMaterial);
    
    mainFloor.rotation.x = -Math.PI / 2; 
    mainFloor.position.y = 0.01; 
    mainFloor.name = "WorldFloor"; // CRÍTICO: Permite teletransporte
    mainFloor.receiveShadow = true; 
    
    group.add(mainFloor);

    return group;
}