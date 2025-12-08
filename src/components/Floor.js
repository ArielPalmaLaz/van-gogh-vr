import * as THREE from 'three';

export function createFloor() {
    // 1. Geometría: Un círculo plano
    // Radio 14.5 para que llegue casi hasta la pared de la cúpula (que es 15)
    const geometry = new THREE.CircleGeometry(14.5, 64); 

    // 2. Material: Un gris oscuro mate para que no distraiga
    const material = new THREE.MeshStandardMaterial({ 
        color: 0x1a1a1a, 
        roughness: 0.8,
        metalness: 0.2,
        side: THREE.DoubleSide // Asegura que el raycaster lo detecte por ambos lados
    });

    const floor = new THREE.Mesh(geometry, material);

    // 3. Posicionamiento
    floor.rotation.x = -Math.PI / 2; // Acostarlo horizontalmente
    floor.position.y = 0.01; // Lo subimos un milímetro para que no se mezcle con la cúpula
    
    // 4. EL SECRETO: Le ponemos el nombre que busca Interaction.js
    floor.name = "WorldFloor";
    floor.receiveShadow = true; // Para que se vea bonito con luces

    return floor;
}