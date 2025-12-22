import * as THREE from 'three';

export function setupAudio(camera) {
    // 1. Crear el Listener y añadirlo a la cámara
    const listener = new THREE.AudioListener();
    camera.add(listener);

    // 2. Crear la fuente de sonido global
    const sound = new THREE.Audio(listener);

    // 3. Cargar el archivo de audio
    const audioLoader = new THREE.AudioLoader();
    const audioPath = 'assets/audio/ambient-piano-gallery-no8-409091.mp3';

    audioLoader.load(audioPath, (buffer) => {
        sound.setBuffer(buffer);
        sound.setLoop(true);
        sound.setVolume(0.4); // Volumen moderado
        
        // Intentar reproducir (podría fallar por políticas de autoplay)
        sound.play();
    }, 
    (xhr) => {
        console.log((xhr.loaded / xhr.total * 100) + '% cargado');
    },
    (err) => {
        console.error('Error al cargar el audio:', err);
    });

    // --- SOLUCIÓN AL PROBLEMA DE AUTOPLAY ---

    // Función para activar el audio en el primer clic o interacción
    const resumeAudioContext = () => {
        if (listener.context.state === 'suspended') {
            listener.context.resume().then(() => {
                console.log('Contexto de audio reanudado correctamente');
                if (!sound.isPlaying && sound.buffer) {
                    sound.play();
                }
            });
        }
        // Una vez activado, quitamos los listeners para ahorrar recursos
        window.removeEventListener('click', resumeAudioContext);
        window.removeEventListener('keydown', resumeAudioContext);
        window.removeEventListener('touchstart', resumeAudioContext);
    };

    // Escuchar cualquier interacción inicial del usuario
    window.addEventListener('click', resumeAudioContext);
    window.addEventListener('keydown', resumeAudioContext);
    window.addEventListener('touchstart', resumeAudioContext);

    // También activar cuando se inicia la sesión VR (el botón de VR cuenta como clic)
    const renderer = camera.parent?.parent?.renderer; // Intentar obtener el renderer si está en la escena
    if (renderer && renderer.xr) {
        renderer.xr.addEventListener('sessionstart', resumeAudioContext);
    }

    return sound;
}