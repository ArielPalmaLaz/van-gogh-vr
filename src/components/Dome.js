import * as THREE from 'three';

export function createDome() {
    // Radio de 15 metros, suficiente espacio para caminar
    const geometry = new THREE.SphereGeometry(15, 60, 40);
    
    // Invertimos la escala en X para ver la textura desde ADENTRO (Backface culling)
    geometry.scale(-1, 1, 1); 

    // Por ahora usamos una rejilla (Wireframe) para visualizar la curvatura
    // Más adelante cambiaremos esto por tu textura de pared
    const material = new THREE.MeshBasicMaterial({ 
        color: 0x404040, 
        wireframe: true // Temporal: para ver la estructura 3D claramente
    });

    const dome = new THREE.Mesh(geometry, material);
    
    // Bajamos un poco la cúpula para que el suelo "corte" la esfera si quisieras piso plano,
    // o la dejamos en 0,0,0 si el usuario flota en el centro.
    dome.position.set(0, 0, 0);

    return dome;
}