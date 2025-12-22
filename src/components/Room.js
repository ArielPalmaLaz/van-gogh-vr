import * as THREE from 'three';

// Función auxiliar para crear el modelo de la lámpara (fuera de createRoom para limpieza)
function createCeilingLamp() {
    const lampGroup = new THREE.Group();

    // 1. Cable (un cilindro muy fino)
    const cableGeo = new THREE.CylinderGeometry(0.01, 0.01, 1.2, 8);
    const cableMat = new THREE.MeshStandardMaterial({ color: 0x111111 });
    const cable = new THREE.Mesh(cableGeo, cableMat);
    cable.position.y = -0.6; // Desplazamos hacia abajo para que el origen sea el anclaje al techo
    lampGroup.add(cable);

    // 2. Pantalla de la lámpara (un cono abierto)
    const shadeGeo = new THREE.CylinderGeometry(0.1, 0.4, 0.4, 32, 1, true);
    const shadeMat = new THREE.MeshStandardMaterial({ 
        color: 0x222222, 
        side: THREE.DoubleSide,
        metalness: 0.8,
        roughness: 0.2
    });
    const shade = new THREE.Mesh(shadeGeo, shadeMat);
    shade.position.y = -1.2;
    lampGroup.add(shade);

    // 3. Bombilla falsa (MeshBasic para que brille por sí sola sin emitir luz)
    const bulbGeo = new THREE.SphereGeometry(0.12, 16, 16);
    const bulbMat = new THREE.MeshBasicMaterial({ color: 0xfff0aa }); // Blanco cálido brillante
    const bulb = new THREE.Mesh(bulbGeo, bulbMat);
    bulb.position.y = -1.2;
    lampGroup.add(bulb);

    return lampGroup;
}

export function createRoom() {
    const group = new THREE.Group();
    const radius = 25;       
    const height = 8;        
    const pillarHeight = 5;  
    const textureLoader = new THREE.TextureLoader();
    const path = 'assets/textures/';

    // --- 1. CONFIGURACIÓN DE LA ENTRADA ---
    const entranceWidth = 4.5; 
    const gapAngle = entranceWidth / radius; 
    const wallThetaStart = gapAngle / 2;
    const wallThetaLength = (Math.PI * 2) - gapAngle;

    // --- 2. MATERIALES ---
    const loadPBR = (file, repeat = 1) => {
        const tex = textureLoader.load(`${path}${file}`);
        tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
        tex.repeat.set(repeat, repeat);
        return tex;
    };

    const concreteMaterial = new THREE.MeshStandardMaterial({
        map: loadPBR('Concrete048_1K-PNG_Color.png', 16),
        normalMap: loadPBR('Concrete048_1K-PNG_NormalGL.png', 16),
        roughnessMap: loadPBR('Concrete048_1K-PNG_Roughness.png', 16),
        side: THREE.DoubleSide, 
        roughness: 1.0
    });

    const roofDomeMaterial = new THREE.MeshStandardMaterial({
        color: 0x999999,      
        metalness: 0.9,
        roughness: 0.15,
        side: THREE.BackSide, // CAMBIADO A BACKSIDE para que sea visible desde dentro
        transparent: false,   
        opacity: 1.0
    });

    const accentMaterial = new THREE.MeshStandardMaterial({ 
        color: 0x1a1a1a,
        roughness: 0.8,
        metalness: 0.2
    });

    const darkMaterial = new THREE.MeshStandardMaterial({ 
        color: 0x151515, // Oscurecido un poco más el techo base
        roughness: 0.9
    });

    const grassMaterial = new THREE.MeshStandardMaterial({ 
        map: loadPBR('grass_color.jpg', 40), 
        normalMap: loadPBR('grass_normal.jpg', 40),
        color: 0x445533,
        roughness: 1.0 
    });

    const glassMaterial = new THREE.MeshStandardMaterial({
        color: 0x111111, transparent: true, opacity: 0.5, roughness: 0.1, metalness: 0.8
    });

    // --- 3. SUELO EXTERIOR ---
    const grassFloor = new THREE.Mesh(new THREE.RingGeometry(radius, 50, 64), grassMaterial);
    grassFloor.rotation.x = -Math.PI / 2;
    grassFloor.position.y = 0.01; 
    grassFloor.name = "WorldFloor"; 
    group.add(grassFloor);

    // --- 4. ESTRUCTURA: ZÓCALO Y CORNISA ---
    const zocalo = new THREE.Mesh(new THREE.CylinderGeometry(radius + 0.3, radius + 0.3, 0.5, 128, 1, true, wallThetaStart, wallThetaLength), accentMaterial);
    zocalo.material.side = THREE.FrontSide;
    zocalo.name = "Obstacle";
    zocalo.position.y = 0.25; 
    group.add(zocalo);

    const cornisa = new THREE.Mesh(new THREE.CylinderGeometry(radius + 0.2, radius + 0.1, 0.4, 128, 1, true), accentMaterial);
    cornisa.material.side = THREE.FrontSide;
    cornisa.name = "Obstacle";
    cornisa.position.y = height; 
    group.add(cornisa);

    // --- 5. PAREDES Y PILARES ---
    const bottomWalls = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, pillarHeight, 128, 1, true, wallThetaStart, wallThetaLength), concreteMaterial);
    bottomWalls.name = "Obstacle";
    bottomWalls.position.y = pillarHeight / 2; 
    group.add(bottomWalls);

    const topWalls = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, height - pillarHeight, 128, 1, true, 0, Math.PI * 2), concreteMaterial);
    topWalls.name = "Obstacle";
    topWalls.position.y = pillarHeight + ((height - pillarHeight) / 2); 
    group.add(topWalls);

    // Pilares
    for (let i = 0; i < 16; i++) {
        const angle = (i / 16) * Math.PI * 2;
        let norm = angle > Math.PI ? angle - Math.PI * 2 : angle;
        if (Math.abs(norm) < gapAngle / 2 + 0.1) continue;
        const pillar = new THREE.Mesh(new THREE.BoxGeometry(0.3, height - 0.1, 0.05), new THREE.MeshStandardMaterial({ color: 0x0a0a0a }));
        pillar.name = "Obstacle";
        pillar.position.set((radius + 0.04) * Math.sin(angle), height / 2, (radius + 0.04) * Math.cos(angle));
        pillar.lookAt(0, height / 2, 0);
        group.add(pillar);
    }

    // --- 6. PUERTAS ---
    const doorL = new THREE.Mesh(new THREE.BoxGeometry(entranceWidth / 2, pillarHeight, 0.1), glassMaterial);
    doorL.name = "DoorLeft";
    doorL.position.set(-(entranceWidth / 4), pillarHeight / 2, radius);
    group.add(doorL);
    const doorR = new THREE.Mesh(new THREE.BoxGeometry(entranceWidth / 2, pillarHeight, 0.1), glassMaterial);
    doorR.name = "DoorRight";
    doorR.position.set(entranceWidth / 4, pillarHeight / 2, radius);
    group.add(doorR);

    // --- 7. TECHOS ---
    const ceiling = new THREE.Mesh(new THREE.CircleGeometry(radius, 64), darkMaterial);
    ceiling.rotation.x = Math.PI / 2;
    ceiling.position.y = height;
    group.add(ceiling);

    const lightTrackMat = new THREE.MeshBasicMaterial({ color: 0xaaaaaa });
    const track1 = new THREE.Mesh(new THREE.RingGeometry(9, 10, 64), lightTrackMat);
    track1.rotation.x = Math.PI / 2; track1.position.y = height - 0.05;
    group.add(track1);
    const track2 = new THREE.Mesh(new THREE.RingGeometry(18, 19, 64), lightTrackMat);
    track2.rotation.x = Math.PI / 2; track2.position.y = height - 0.05;
    group.add(track2);

    // Domo Estructural (Techo del edificio)
    const roofDome = new THREE.Mesh(new THREE.SphereGeometry(radius, 64, 32, 0, Math.PI * 2, 0, Math.PI / 2), roofDomeMaterial);
    roofDome.position.y = height;
    roofDome.scale.set(1, 0.33, 1); 
    group.add(roofDome);

    // --- NUEVO: GENERACIÓN DE LÁMPARAS DECORATIVAS ---
    // Colocamos lámparas en dos anillos concéntricos
    const rings = [
        { r: 9.5, count: 8 },  // Sobre el primer carril
        { r: 18.5, count: 14 } // Sobre el segundo carril
    ];

    rings.forEach(ring => {
        for (let i = 0; i < ring.count; i++) {
            const angle = (i / ring.count) * Math.PI * 2;
            const lamp = createCeilingLamp();
            
            // Posicionamos la lámpara en el techo (altura = height)
            lamp.position.set(
                Math.cos(angle) * ring.r,
                height,
                Math.sin(angle) * ring.r
            );
            
            group.add(lamp);
        }
    });

    // --- 8. MARCO DE ENTRADA ---
    const frameGroup = new THREE.Group();
    const pG = new THREE.BoxGeometry(0.3, pillarHeight, 0.5);
    const pL = new THREE.Mesh(pG, accentMaterial);
    pL.name = "Obstacle";
    pL.position.set(radius * Math.sin(gapAngle / 2), pillarHeight / 2, radius * Math.cos(gapAngle / 2));
    pL.lookAt(0, pillarHeight / 2, 0); 
    frameGroup.add(pL);
    const pR = new THREE.Mesh(pG, accentMaterial);
    pR.name = "Obstacle";
    pR.position.set(radius * Math.sin(-gapAngle / 2), pillarHeight / 2, radius * Math.cos(-gapAngle / 2));
    pR.lookAt(0, pillarHeight / 2, 0);
    frameGroup.add(pR);
    const beam = new THREE.Mesh(new THREE.BoxGeometry(entranceWidth + 0.5, 0.3, 0.5), accentMaterial);
    beam.name = "Obstacle";
    beam.position.set(0, pillarHeight, radius - 0.1); 
    frameGroup.add(beam);
    group.add(frameGroup);

    return group;
}