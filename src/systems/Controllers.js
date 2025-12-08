import * as THREE from 'three';
import { XRControllerModelFactory } from 'three/examples/jsm/webxr/XRControllerModelFactory.js';

export function setupControllers(scene, renderer) {
    const controllerModelFactory = new XRControllerModelFactory();

    // --- Configuración del Rayo (Láser) ---
    const geometry = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(0, 0, -5) // 5 metros de largo
    ]);
    const material = new THREE.LineBasicMaterial({ color: 0xffffff }); // Rayo blanco
    const line = new THREE.Line(geometry, material);
    line.name = 'line';
    line.scale.z = 1;

    // --- Controlador 1 (Derecho usualmente) ---
    const controller1 = renderer.xr.getController(0);
    controller1.add(line.clone()); // Añadimos el láser visual
    scene.add(controller1);

    // --- Controlador 2 (Izquierdo usualmente) ---
    const controller2 = renderer.xr.getController(1);
    controller2.add(line.clone());
    scene.add(controller2);

    // --- Modelos Visuales de los Mandos (Para ver las manos) ---
    const controllerGrip1 = renderer.xr.getControllerGrip(0);
    controllerGrip1.add(controllerModelFactory.createControllerModel(controllerGrip1));
    scene.add(controllerGrip1);

    const controllerGrip2 = renderer.xr.getControllerGrip(1);
    controllerGrip2.add(controllerModelFactory.createControllerModel(controllerGrip2));
    scene.add(controllerGrip2);

    return { controller1, controller2 };
}