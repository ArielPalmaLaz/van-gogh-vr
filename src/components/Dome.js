import * as THREE from 'three';

export function createDome() {
    const loader = new THREE.TextureLoader();
    const domeTexture = loader.load('assets/textures/starfiaeld_4k.jpg');
    
    // Configuración para mejorar la apariencia de la textura
    domeTexture.colorSpace = THREE.SRGBColorSpace;

    // Radio 500 para que esté muy lejos del museo (radio 25)
    const geometry = new THREE.SphereGeometry(50, 60, 40);
    
    // Invertimos la esfera para que se vea desde adentro
    geometry.scale(-1, 1, 1); 

    const material = new THREE.MeshBasicMaterial({
        map: domeTexture, // ASIGNAR LA TEXTURA CARGADA
        side: THREE.DoubleSide
    });

    const dome = new THREE.Mesh(geometry, material);
    return dome;
}