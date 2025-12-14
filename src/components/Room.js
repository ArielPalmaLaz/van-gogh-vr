import * as THREE from 'three';

export function createRoom() {
    const group = new THREE.Group();
    const radius = 25;
    const height = 8;

    // MATERIALES
    const darkMaterial = new THREE.MeshStandardMaterial({
        color: 0x050505, // Negro profundo
        roughness: 0.9,
        side: THREE.BackSide 
    });

    // 1. PAREDES EXTERIORES 
    const wallGeo = new THREE.CylinderGeometry(radius, radius, height, 64, 1, true);
    const walls = new THREE.Mesh(wallGeo, darkMaterial);
    walls.position.y = height / 2;
    walls.name = "Architecture";
    group.add(walls);

    // 2. TECHO 
    const ceilingGeo = new THREE.CircleGeometry(radius, 64);
    const ceiling = new THREE.Mesh(ceilingGeo, darkMaterial);
    ceiling.rotation.x = Math.PI / 2; // Mirando hacia abajo
    ceiling.position.y = height;
    group.add(ceiling);

    // 3. CARRILES DE LUZ SIMULADOS 
    // Esto es visual, las luces reales las pondremos en los cuadros.
    const lightTrackMat = new THREE.MeshBasicMaterial({ color: 0xaaaaaa });
    
    // Carril interior 
    const track1Geo = new THREE.RingGeometry(9, 10, 64);
    const track1 = new THREE.Mesh(track1Geo, lightTrackMat);
    track1.rotation.x = Math.PI / 2;
    track1.position.y = height - 0.05; // Justo debajo del techo
    group.add(track1);

    
    const track2Geo = new THREE.RingGeometry(18, 19, 64);
    const track2 = new THREE.Mesh(track2Geo, lightTrackMat);
    track2.rotation.x = Math.PI / 2;
    track2.position.y = height - 0.05;
    group.add(track2);

    return group;
}