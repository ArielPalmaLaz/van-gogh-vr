import * as THREE from 'three';

// Función auxiliar para texto
function createTextTexture(text, fontSize = 30, maxWidth = 500, align = 'center') {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    context.font = `bold ${fontSize}px Arial`;
    const words = text.split(' ');
    let line = '';
    const lines = [];
    words.forEach(word => {
        const testLine = line + word + ' ';
        if (context.measureText(testLine).width > maxWidth && line !== '') {
            lines.push(line);
            line = word + ' ';
        } else {
            line = testLine;
        }
    });
    lines.push(line);
    canvas.width = maxWidth + 40; 
    canvas.height = (lines.length * (fontSize + 12)) + 40;
    context.fillStyle = 'rgba(0, 0, 0, 0.6)'; 
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.font = `bold ${fontSize}px Arial`;
    context.fillStyle = 'white';
    context.textAlign = align;
    context.textBaseline = 'middle';
    const x = align === 'center' ? canvas.width / 2 : 20;
    lines.forEach((l, i) => {
        context.fillText(l, x, 20 + (fontSize/2) + (i * (fontSize + 12)));
    });
    return { texture: new THREE.CanvasTexture(canvas), width: canvas.width / 500, height: canvas.height / 500 }; 
}

// Función auxiliar para botones
function createButton(text, color, onClick) {
    const btnData = createTextTexture(text, 40, 200, 'center');
    const geometry = new THREE.PlaneGeometry(btnData.width, btnData.height);
    const material = new THREE.MeshBasicMaterial({ map: btnData.texture, color: color, transparent: true });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.userData = { isButton: true, action: onClick };
    return mesh;
}

export function createInfoPanel(artworkData, closeCallback) {
    const group = new THREE.Group();
    const contentGroup = new THREE.Group();
    group.add(contentGroup);

    // --- Panel Central (Imagen) ---
    const width = artworkData.width || 1;
    const height = artworkData.height || 1;
    const aspectRatio = height / width;
    const baseWidth = 2.0; 
    const imgGeometry = new THREE.PlaneGeometry(baseWidth, baseWidth * aspectRatio);
    
    let texture;
    if (artworkData.src) {
        texture = new THREE.TextureLoader().load(artworkData.src);
        texture.colorSpace = THREE.SRGBColorSpace;
    } else {
        texture = new THREE.Texture(); 
    }
    
    const imgMesh = new THREE.Mesh(imgGeometry, new THREE.MeshBasicMaterial({ 
        map: texture, 
        color: artworkData.src ? 0xffffff : 0xff00ff,
        transparent: true 
    }));
    
    imgMesh.position.set(0, 0.6, 0.05); 
    contentGroup.add(imgMesh);

    // --- Panel Derecho (Textos y Controles) ---
    const rightPanelX = 1.9;

    const titleData = createTextTexture(artworkData.title || "Sin Título", 50, 600, 'left');
    const titleMesh = new THREE.Mesh(
        new THREE.PlaneGeometry(titleData.width, titleData.height),
        new THREE.MeshBasicMaterial({ map: titleData.texture, transparent: true })
    );
    titleMesh.position.set(rightPanelX, 1.2, 0.05); 
    contentGroup.add(titleMesh);

    const descData = createTextTexture(artworkData.description || "...", 25, 600, 'left');
    const descMesh = new THREE.Mesh(
        new THREE.PlaneGeometry(descData.width, descData.height),
        new THREE.MeshBasicMaterial({ map: descData.texture, transparent: true })
    );
    descMesh.position.set(rightPanelX, 0.4, 0.05); 
    contentGroup.add(descMesh);

    // --- Botonera de Zoom ---
    const zoomY = -0.3; 
    
    const btnZoomOut = createButton("➖", 0x44ff44, () => {
        if (imgMesh.scale.x > 0.5) imgMesh.scale.multiplyScalar(0.8);
    });
    btnZoomOut.position.set(rightPanelX - 0.4, zoomY, 0.05);
    contentGroup.add(btnZoomOut);

    const btnReset = createButton("⟲", 0x4444ff, () => { imgMesh.scale.set(1, 1, 1); });
    btnReset.position.set(rightPanelX, zoomY, 0.05);
    contentGroup.add(btnReset);

    const btnZoomIn = createButton("➕", 0x44ff44, () => {
        if (imgMesh.scale.x < 3) imgMesh.scale.multiplyScalar(1.2);
    });
    btnZoomIn.position.set(rightPanelX + 0.4, zoomY, 0.05);
    contentGroup.add(btnZoomIn);

    // --- BOTÓN DE ALTAVOZ (LECTURA) ---
    const btnSpeaker = createButton("🔊 LECTURA", 0xaaaaaa, () => {
        if ('speechSynthesis' in window) {
            if (window.speechSynthesis.speaking) {
                window.speechSynthesis.cancel();
            } else {
                const textToRead = `${artworkData.title}. ${artworkData.description}`;
                const utterance = new SpeechSynthesisUtterance(textToRead);
                utterance.lang = 'es-ES';
                window.speechSynthesis.speak(utterance);
            }
        }
    });
    btnSpeaker.position.set(-rightPanelX, zoomY, 0.05);
    contentGroup.add(btnSpeaker);

    // --- Botón CERRAR ---
    const btnClose = createButton("❌ CERRAR VISTA", 0xff4444, closeCallback);
    btnClose.position.set(0, -0.9, 0.05); 
    contentGroup.add(btnClose);

    return group;
}