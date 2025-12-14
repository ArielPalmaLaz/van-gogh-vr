import * as THREE from 'three';

export function createDome() {
    const geometry = new THREE.SphereGeometry(15, 60, 40);
    geometry.scale(-1, 1, 1); 

    const material = new THREE.MeshBasicMaterial({ 
        color: 0x151520, 
        side: THREE.DoubleSide 
    });

    const dome = new THREE.Mesh(geometry, material);
    dome.position.set(0, 0, 0);
    
    dome.name = "DomeWalls"; 

    return dome;
}