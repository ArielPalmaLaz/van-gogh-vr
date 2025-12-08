import * as THREE from 'three';

export function loadGallery(scene) {
    const textureLoader = new THREE.TextureLoader();

    // 1. Cargar el JSON de datos
    fetch('./data/artworks.json')
        .then(response => response.json())
        .then(artworks => {
            
            artworks.forEach((artwork) => {
                // --- A. Crear el Cuadro ---
                const geometry = new THREE.PlaneGeometry(artwork.width, artwork.height);
                const texture = textureLoader.load(artwork.src);
                texture.colorSpace = THREE.SRGBColorSpace;

                const material = new THREE.MeshBasicMaterial({ map: texture });
                const painting = new THREE.Mesh(geometry, material);

                // --- B. Posicionamiento ---
                painting.position.set(artwork.position.x, artwork.position.y, artwork.position.z);
                if (artwork.rotation) {
                    painting.rotation.y = artwork.rotation.y;
                }

                // --- C. Datos para Interacción (CORREGIDO) ---
                // AHORA INCLUIMOS SRC, WIDTH Y HEIGHT
                painting.userData = {
                    id: artwork.id,
                    title: artwork.title,
                    author: artwork.author,
                    description: artwork.description,
                    src: artwork.src,      // <--- IMPORTANTE: Ruta de la imagen
                    width: artwork.width,  // <--- IMPORTANTE: Para calcular aspecto
                    height: artwork.height,// <--- IMPORTANTE
                    isInteractable: true 
                };

                // --- D. Añadir a la escena ---
                scene.add(painting);
            });

            console.log(`Galería cargada: ${artworks.length} obras instaladas.`);
        })
        .catch(error => {
            console.error('Error cargando la galería:', error);
        });
}