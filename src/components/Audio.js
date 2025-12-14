import * as THREE from 'three';

export function setupAudio(camera) {
    // 1. Crear el "Listener" (Oídos) y añadirlo a la cámara
    const listener = new THREE.AudioListener();
    camera.add(listener);

    // 2. Crear la fuente de sonido global (Sonido Ambiente)
    const sound = new THREE.Audio(listener);

    // 3. Cargar el archivo de audio
    const loader = new THREE.AudioLoader();
    loader.load('/assets/audio/ambient-piano-gallery-no8-409091.mp3', (buffer) => {
        sound.setBuffer(buffer);
        sound.setLoop(true); // Repetir en bucle
        sound.setVolume(0.3); // Volumen suave (0.0 a 1.0)
    });

    // 4. Lógica de "Autoplay" (Requiere interacción del usuario)
    // Los navegadores no permiten reproducir audio sin que el usuario haya interactuado primero.
    const startAudio = () => {
        // Reanudar contexto de audio si estaba suspendido
        if (sound.context.state === 'suspended') {
            sound.context.resume();
        }
        // Reproducir si ya cargó y no está sonando
        if (sound.buffer && !sound.isPlaying) {
            sound.play();
        }
    };

    // Escuchamos el primer clic o tecla para iniciar la música
    window.addEventListener('click', startAudio, { once: true });
    window.addEventListener('keydown', startAudio, { once: true });

    return sound;
}