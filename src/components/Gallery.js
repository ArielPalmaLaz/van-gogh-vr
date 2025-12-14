import * as THREE from 'three';
import { FontLoader } from 'three/examples/jsm/loaders/FontLoader.js';
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry.js';
import artworkData from '../../public/data/artworks.json';

export function loadGallery(scene) {
    const loader = new THREE.TextureLoader();
    const fontLoader = new FontLoader();

    fontLoader.load('https://threejs.org/examples/fonts/helvetiker_regular.typeface.json', (font) => {

        // --- CONFIGURACIÓN DE LA "V" INVERTIDA ---
        const startZ = 14; 
        const startX = 12; 
        const endZ = -8;   
        const endX = 4; 

        // --- DIMENSIONES MONOLITO ---
        const monoWidth = 3.0;  
        const monoHeight = 4.5;   
        const monoDepth = 0.5;  

        // Material del Muro 
        const wallMat = new THREE.MeshStandardMaterial({
            color: 0x222222, 
            roughness: 0.6,
        });

        // Material del Zócalo 
        const baseMat = new THREE.MeshStandardMaterial({
            color: 0x111111,
            roughness: 0.8,
            metalness: 0.2
        });

        // Material del Marco 
        const frameMat = new THREE.MeshStandardMaterial({
            color: 0xCFB53B, 
            roughness: 0.4,
            metalness: 0.6
        });

        // Material del Texto 
        const textMat = new THREE.MeshStandardMaterial({
            color: 0xffffff, 
            roughness: 0.4
        });

        const totalArt = artworkData.length;
        const countPerSide = Math.ceil(totalArt / 2);

        artworkData.forEach((data, index) => {
            const group = new THREE.Group();

            // 1. POSICIÓN 
            const isLeft = index % 2 === 0;
            const sideMultiplier = isLeft ? -1 : 1;
            const rowPos = Math.floor(index / 2); 
            const t = rowPos / Math.max(1, countPerSide - 1); 

            const currentXAbs = startX + (endX - startX) * t; 
            const posX = currentXAbs * sideMultiplier;
            const posZ = startZ + (endZ - startZ) * t;

            group.position.set(posX, 0, posZ);

            // 2. ROTACIÓN 
            const deltaX = (endX - startX) * sideMultiplier;
            const deltaZ = (endZ - startZ);
            const wallAngle = Math.atan2(deltaX, deltaZ);
            const turnToEntrance = Math.PI / -3; 
            const faceOffset = isLeft ? -Math.PI / 2 + turnToEntrance : Math.PI / 2 - turnToEntrance;
            group.rotation.y = wallAngle + faceOffset;

            // 3. ESTRUCTURA DEL MONOLITO 
            const monolithGroup = new THREE.Group();
            
            // A. El Muro 
            const wallGeo = new THREE.BoxGeometry(monoWidth, monoHeight, monoDepth);
            const wallMesh = new THREE.Mesh(wallGeo, wallMat);
            wallMesh.position.y = monoHeight / 2; 
            wallMesh.castShadow = true;
            wallMesh.receiveShadow = true;
            monolithGroup.add(wallMesh);

            // B. El Zócalo 
            const baseHeight = 0.6; 
            const baseGeo = new THREE.BoxGeometry(
                monoWidth + 0.2, 
                baseHeight, 
                monoDepth + 0.1  
            );
            const baseMesh = new THREE.Mesh(baseGeo, baseMat);
            baseMesh.position.y = baseHeight / 2; 
            baseMesh.castShadow = true;
            baseMesh.receiveShadow = true;
            monolithGroup.add(baseMesh);

            group.add(monolithGroup);

            // 4. CUADRO 
            const texture = loader.load(data.src);
            texture.colorSpace = THREE.SRGBColorSpace;
            
            const scaleFactor = 0.7; 
            const maxAvailableWidth = monoWidth - 0.2; 
            const maxAvailableHeight = monoHeight - 1.0; 
            const targetWidth = maxAvailableWidth * scaleFactor;
            const targetHeight = maxAvailableHeight * scaleFactor;
            const originalW = data.width || 1.8;
            const originalH = data.height || 1.8;
            const aspectRatio = originalH / originalW;

            let finalWidth = targetWidth;
            let finalHeight = finalWidth * aspectRatio;
            if (finalHeight > targetHeight) {
                finalHeight = targetHeight;
                finalWidth = finalHeight / aspectRatio;
            }

           
            const isHorizontal = finalWidth > finalHeight;
            
            
            const heightFromFloor = isHorizontal ? 1.5 : 1.3; 
            
            const centerY = heightFromFloor + (finalHeight / 2);

            const frameBorder = 0.08; 
            const frameDepth = 0.05;

            // --- A) Marco Dorado ---
            const frameGeo = new THREE.BoxGeometry(
                finalWidth + (frameBorder * 2), 
                finalHeight + (frameBorder * 2), 
                frameDepth
            );
            const frameMesh = new THREE.Mesh(frameGeo, frameMat);
            
            frameMesh.position.y = centerY;
            frameMesh.position.z = (monoDepth / 2) + (frameDepth / 2);
            frameMesh.castShadow = true;
            group.add(frameMesh);

            // --- B) Imagen ---
            const imgGeo = new THREE.PlaneGeometry(finalWidth, finalHeight);
            const imgMat = new THREE.MeshBasicMaterial({ map: texture });
            const imgMesh = new THREE.Mesh(imgGeo, imgMat);
            
            imgMesh.position.y = centerY;
            imgMesh.position.z = frameMesh.position.z + (frameDepth / 2) + 0.005; 
            imgMesh.userData = { isInteractable: true, ...data };
            group.add(imgMesh);

            // 5. ILUMINACIÓN 
            const spot = new THREE.SpotLight(0xffffff, 12); 
            spot.position.set(0, monoHeight + 1, 5);
            spot.target = imgMesh;
            spot.angle = 0.5;
            spot.penumbra = 0.4;
            spot.distance = 15;
            spot.castShadow = true;
            group.add(spot);
            group.add(spot.target);

            // 6. TÍTULO 3D 
            const textGeo = new TextGeometry(data.title, {
                font: font,
                size: 0.12, 
                depth: 0.01, 
                curveSegments: 6, 
                bevelEnabled: false
            });

            textGeo.computeBoundingBox();
            const textWidth = textGeo.boundingBox.max.x - textGeo.boundingBox.min.x;
            textGeo.translate(-textWidth / 2, 0, 0);

            const textMesh = new THREE.Mesh(textGeo, textMat);

            
            const frameBottomY = frameMesh.position.y - (finalHeight / 2) - frameBorder;
            
            textMesh.position.y = frameBottomY - 0.25;
            textMesh.position.z = (monoDepth / 2) + 0.02;

            group.add(textMesh);

            scene.add(group);
        });
    });
}