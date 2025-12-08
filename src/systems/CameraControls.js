import * as THREE from 'three';

export function setupCameraControls(camera, renderer) {
    let isDragging = false;
    let previousMousePosition = { x: 0, y: 0 };
    
    // Ajusta la sensibilidad a tu gusto
    const sensitivity = 0.002; 

    // IMPORTANTE: Cambiar el orden de rotación a YXZ evita que la cámara se incline de lado (roll)
    // Es el estándar para juegos en primera persona (FPS)
    camera.rotation.order = 'YXZ';

    const canvas = renderer.domElement;

    // Iniciar arrastre solo con clic IZQUIERDO (0)
    canvas.addEventListener('mousedown', (e) => {
        if (e.button === 0) {
            isDragging = true;
            previousMousePosition = { x: e.clientX, y: e.clientY };
        }
    });

    // Mover la cámara
    window.addEventListener('mousemove', (e) => {
        if (!isDragging) return;

        const deltaMove = {
            x: e.clientX - previousMousePosition.x,
            y: e.clientY - previousMousePosition.y
        };

        previousMousePosition = { x: e.clientX, y: e.clientY };

        // Rotación Horizontal (Yaw) - Gira todo el cuerpo o solo la cabeza
        // Al restar, invertimos el control para que se sienta natural (arrastrar mundo vs girar cabeza)
        camera.rotation.y -= deltaMove.x * sensitivity;
        
        // Rotación Vertical (Pitch) - Mirar arriba/abajo
        camera.rotation.x -= deltaMove.y * sensitivity;

        // Limitar la vista vertical para no romperse el cuello (90 grados arriba/abajo)
        const limit = Math.PI / 2 - 0.1;
        camera.rotation.x = Math.max(-limit, Math.min(limit, camera.rotation.x));
    });

    // Detener arrastre
    window.addEventListener('mouseup', () => {
        isDragging = false;
    });
    
    // Si el mouse sale de la ventana, también soltamos
    window.addEventListener('mouseleave', () => {
        isDragging = false;
    });
}