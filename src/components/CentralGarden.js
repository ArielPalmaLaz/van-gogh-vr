import * as THREE from 'three';

export function createCentralGarden() {
    const gardenGroup = new THREE.Group();

    // --- 1. LA BASE (TIERRA/CESPED) ---
    // Sustituimos la plataforma negra lisa por algo más orgánico pero contenido
    const soilGeo = new THREE.CylinderGeometry(4, 4.5, 0.5, 32);
    const soilMat = new THREE.MeshStandardMaterial({ 
        color: 0x2b3a42, // Gris azulado oscuro (pizarra/tierra moderna)
        roughness: 0.9,
        flatShading: true // Da el aspecto "Low Poly" facetado
    });
    const soil = new THREE.Mesh(soilGeo, soilMat);
    soil.position.y = 0.25;
    soil.receiveShadow = true;
    gardenGroup.add(soil);

    // --- 2. EL ÁRBOL CENTRAL (Escultural) ---
    
    // Tronco
    const trunkGeo = new THREE.CylinderGeometry(0.3, 0.6, 3.5, 7);
    const trunkMat = new THREE.MeshStandardMaterial({ 
        color: 0x4a3c31, // Marrón oscuro desaturado
        roughness: 0.8,
        flatShading: true 
    });
    const trunk = new THREE.Mesh(trunkGeo, trunkMat);
    trunk.position.y = 0.5 + (3.5 / 2); // Base + mitad altura
    trunk.castShadow = true;
    trunk.receiveShadow = true;
    gardenGroup.add(trunk);

    // Copa del árbol (Icosaedro para look geométrico)
    const leavesGeo = new THREE.IcosahedronGeometry(2.5, 0); // Radio 2.5, detalle 0 (muy facetado)
    const leavesMat = new THREE.MeshStandardMaterial({ 
        color: 0x4caf50, // Verde vibrante pero elegante
        roughness: 0.8,
        flatShading: true 
    });
    const leaves = new THREE.Mesh(leavesGeo, leavesMat);
    leaves.position.y = trunk.position.y + 1.5; // Arriba del tronco
    leaves.castShadow = true;
    gardenGroup.add(leaves);

    // --- 3. DETALLES (ROCAS Y ARBUSTOS) ---
    
    // Función auxiliar para aleatoriedad
    const random = (min, max) => Math.random() * (max - min) + min;

    // Rocas (Dodecaedros grises)
    const rockGeo = new THREE.DodecahedronGeometry(0.6, 0);
    const rockMat = new THREE.MeshStandardMaterial({ color: 0x777777, flatShading: true });

    for (let i = 0; i < 5; i++) {
        const rock = new THREE.Mesh(rockGeo, rockMat);
        // Posición aleatoria en el radio del suelo (evitando el centro exacto)
        const angle = random(0, Math.PI * 2);
        const radius = random(1.5, 3); 
        
        rock.position.set(Math.cos(angle) * radius, 0.6, Math.sin(angle) * radius);
        rock.rotation.set(random(0, 3), random(0, 3), random(0, 3));
        rock.scale.setScalar(random(0.8, 1.5));
        
        rock.castShadow = true;
        rock.receiveShadow = true;
        gardenGroup.add(rock);
    }

    // Arbustos pequeños (Tetraedros verdes)
    const bushGeo = new THREE.ConeGeometry(0.4, 0.8, 5);
    const bushMat = new THREE.MeshStandardMaterial({ color: 0x66bb6a, flatShading: true });

    for (let i = 0; i < 12; i++) {
        const bush = new THREE.Mesh(bushGeo, bushMat);
        const angle = random(0, Math.PI * 2);
        const radius = random(1.2, 3.5);

        bush.position.set(Math.cos(angle) * radius, 0.5, Math.sin(angle) * radius);
        bush.scale.setScalar(random(0.8, 1.2));
        bush.rotation.y = random(0, Math.PI);
        
        bush.castShadow = true;
        gardenGroup.add(bush);
    }

    // --- 4. LUCES DECORATIVAS (Luciernagas estáticas) ---
    // Pequeños puntos de luz cálida flotando cerca del árbol
    const fireflyGeo = new THREE.SphereGeometry(0.05, 8, 8);
    const fireflyMat = new THREE.MeshBasicMaterial({ color: 0xffffaa });
    
    for(let i=0; i<8; i++){
        const firefly = new THREE.Mesh(fireflyGeo, fireflyMat);
        const angle = random(0, Math.PI * 2);
        const radius = random(0.8, 2);
        const height = random(1, 3);
        
        firefly.position.set(Math.cos(angle) * radius, height, Math.sin(angle) * radius);
        gardenGroup.add(firefly);
    }

    return gardenGroup;
}