/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { CollectibleItem } from '../types/game';

export function createItemPreviewMesh(item: CollectibleItem): THREE.Group {
  const group = new THREE.Group();
  const primaryMat = new THREE.MeshStandardMaterial({
    color: item.color || '#f59e0b',
    roughness: 0.2,
    metalness: 0.9,
    emissive: item.accentColor || item.color,
    emissiveIntensity: 0.25,
  });

  const accentMat = new THREE.MeshStandardMaterial({
    color: item.accentColor || '#38bdf8',
    roughness: 0.15,
    metalness: 0.85,
    emissive: item.accentColor || '#38bdf8',
    emissiveIntensity: 0.5,
  });

  if (item.modelType === 'crown') {
    // Regal golden diadem
    const baseBand = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 0.75, 0.3, 16, 1, true), primaryMat);
    group.add(baseBand);
    for (let i = 0; i < 6; i++) {
      const angle = (i / 6) * Math.PI * 2;
      const spike = new THREE.Mesh(new THREE.ConeGeometry(0.18, 0.6, 4), primaryMat);
      spike.position.set(Math.cos(angle) * 0.78, 0.4, Math.sin(angle) * 0.78);
      group.add(spike);

      const gem = new THREE.Mesh(new THREE.OctahedronGeometry(0.1, 0), accentMat);
      gem.position.set(Math.cos(angle) * 0.78, 0.15, Math.sin(angle) * 0.78);
      group.add(gem);
    }
  } else if (item.modelType === 'chalice') {
    const base = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.7, 0.15, 16), primaryMat);
    const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.14, 0.8, 12), primaryMat);
    stem.position.y = 0.45;
    const cup = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.2, 0.75, 16, 1, true), primaryMat);
    cup.position.y = 1.1;
    group.add(base, stem, cup);
  } else if (item.modelType === 'gem_core') {
    const crystal = new THREE.Mesh(new THREE.OctahedronGeometry(0.9, 0), accentMat);
    const cage = new THREE.Mesh(new THREE.IcosahedronGeometry(1.2, 0), new THREE.MeshStandardMaterial({
      color: '#1e293b',
      wireframe: true,
      roughness: 0.3,
      metalness: 0.9,
    }));
    group.add(crystal, cage);
  } else if (item.modelType === 'dragon_statue') {
    const plinth = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.25, 1.2), new THREE.MeshStandardMaterial({ color: '#1e293b' }));
    const body = new THREE.Mesh(new THREE.TorusGeometry(0.5, 0.2, 8, 16, Math.PI * 1.5), primaryMat);
    body.position.y = 0.6;
    body.rotation.z = Math.PI / 4;
    const head = new THREE.Mesh(new THREE.ConeGeometry(0.2, 0.45, 4), accentMat);
    head.position.set(0.4, 1.0, 0);
    head.rotation.z = -Math.PI / 3;
    group.add(plinth, body, head);
  } else {
    // Default / cube_artifact: Vault tesseract
    const inner = new THREE.Mesh(new THREE.BoxGeometry(0.75, 0.75, 0.75), accentMat);
    const outer = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.2, 1.2), new THREE.MeshStandardMaterial({
      color: '#0f172a',
      wireframe: true,
      roughness: 0.2,
      metalness: 0.9,
    }));
    const coreOrb = new THREE.Mesh(new THREE.SphereGeometry(0.3, 12, 12), primaryMat);
    group.add(inner, outer, coreOrb);
  }

  return group;
}

export function initItemInspectorCanvas(container: HTMLDivElement, item: CollectibleItem): () => void {
  const width = container.clientWidth || 300;
  const height = container.clientHeight || 260;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#0a0e17');

  const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 50);
  camera.position.set(0, 1.2, 3.2);
  camera.lookAt(0, 0.3, 0);

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setSize(width, height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.2;

  // Studio Environment Reflection
  const pmremGenerator = new THREE.PMREMGenerator(renderer);
  scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
  pmremGenerator.dispose();

  // 3-point light rig
  const keyLight = new THREE.DirectionalLight('#fffbeb', 1.8);
  keyLight.position.set(3, 4, 3);
  scene.add(keyLight);

  const rimLight = new THREE.DirectionalLight('#38bdf8', 1.2);
  rimLight.position.set(-3, 2, -3);
  scene.add(rimLight);

  const ambient = new THREE.AmbientLight('#ffffff', 0.5);
  scene.add(ambient);

  const itemMesh = createItemPreviewMesh(item);
  itemMesh.position.y = 0.2;
  scene.add(itemMesh);

  container.innerHTML = '';
  container.appendChild(renderer.domElement);

  let frameId = 0;
  let isDragging = false;
  let prevMouseX = 0;
  let rotVelocity = 0.008;

  const onMouseDown = (e: MouseEvent) => {
    isDragging = true;
    prevMouseX = e.clientX;
  };
  const onMouseMove = (e: MouseEvent) => {
    if (!isDragging) return;
    const deltaX = e.clientX - prevMouseX;
    prevMouseX = e.clientX;
    itemMesh.rotation.y += deltaX * 0.012;
  };
  const onMouseUp = () => {
    isDragging = false;
  };

  container.addEventListener('mousedown', onMouseDown);
  window.addEventListener('mousemove', onMouseMove);
  window.addEventListener('mouseup', onMouseUp);

  const tick = () => {
    if (!isDragging) {
      itemMesh.rotation.y += rotVelocity;
      itemMesh.position.y = 0.2 + Math.sin(Date.now() * 0.002) * 0.05;
    }
    renderer.render(scene, camera);
    frameId = requestAnimationFrame(tick);
  };

  tick();

  return () => {
    cancelAnimationFrame(frameId);
    container.removeEventListener('mousedown', onMouseDown);
    window.removeEventListener('mousemove', onMouseMove);
    window.removeEventListener('mouseup', onMouseUp);
    renderer.dispose();
  };
}
