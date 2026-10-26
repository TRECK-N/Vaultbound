/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { CharacterAppearance, PlacedFurniture, CollectibleItem } from '../types/game';
import { createCharacterModel, CharacterRig } from '../engine/characterModel';
import { buildProceduralCity, buildPersonalBase, WorldZoneTrigger } from '../engine/worldBuilder';
import { Collider, resolveMovementWithCollision } from '../engine/collisionSystem';
import { dayNightManager } from '../state/dayNightCycle';
import { soundManager } from '../audio/soundManager';
import { KeyAction, normalizeKey } from '../state/keybinds';

export interface RobotNPC {
  id: string;
  name: string;
  role: string;
  x: number;
  z: number;
  rotation: number;
  dialogue: string;
  appearance: CharacterAppearance;
  wanderRadius: number;
}

interface WorldCanvasProps {
  currentView: 'city' | 'base';
  appearance: CharacterAppearance;
  playerDisplayName: string;
  playerPlotNumber: number;
  placedFurniture: PlacedFurniture[];
  inventory: CollectibleItem[];
  baseTier: number;
  keybinds: Record<KeyAction, string>;
  isInputFocused: boolean;
  isTitleScreen?: boolean;
  spawnPosition?: { x: number; z: number } | null;
  onZoneInteract: (zoneKey: string) => void;
  onNearbyZoneChange: (zone: WorldZoneTrigger | null) => void;
  onNPCTalk?: (npc: RobotNPC) => void;
  activeEmote?: string;
}

export const WorldCanvas: React.FC<WorldCanvasProps> = ({
  currentView,
  appearance,
  playerDisplayName,
  playerPlotNumber,
  placedFurniture,
  inventory,
  baseTier,
  keybinds,
  isInputFocused,
  isTitleScreen = false,
  spawnPosition = null,
  onZoneInteract,
  onNearbyZoneChange,
  onNPCTalk,
  activeEmote,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const currentViewRef = useRef(currentView);
  const appearanceRef = useRef(appearance);
  const activeEmoteRef = useRef(activeEmote);
  const onZoneInteractRef = useRef(onZoneInteract);
  const onNearbyZoneChangeRef = useRef(onNearbyZoneChange);
  const onNPCTalkRef = useRef(onNPCTalk);
  const keybindsRef = useRef(keybinds);
  const isInputFocusedRef = useRef(isInputFocused);
  const isTitleScreenRef = useRef(isTitleScreen);

  currentViewRef.current = currentView;
  appearanceRef.current = appearance;
  activeEmoteRef.current = activeEmote;
  onZoneInteractRef.current = onZoneInteract;
  onNearbyZoneChangeRef.current = onNearbyZoneChange;
  onNPCTalkRef.current = onNPCTalk;
  keybindsRef.current = keybinds;
  isInputFocusedRef.current = isInputFocused;
  isTitleScreenRef.current = isTitleScreen;

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // Detect software WebGL
    const isSoftwareGl = (() => {
      const gl = document.createElement('canvas').getContext('webgl2');
      if (!gl) return true;
      const ext = gl.getExtension('WEBGL_debug_renderer_info');
      const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
      const gpu = String(gl.getParameter(param));
      gl.getExtension('WEBGL_lose_context')?.loseContext();
      return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
    })();

    // 1. Scene & Renderer setup
    const scene = new THREE.Scene();
    const initialTimeInfo = dayNightManager.getTimeInfo();
    scene.background = new THREE.Color(initialTimeInfo.fogColor);
    scene.fog = new THREE.FogExp2(initialTimeInfo.fogColor, currentView === 'base' ? 0.012 : initialTimeInfo.fogDensity);

    const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.2, 240);

    const renderer = new THREE.WebGLRenderer({
      antialias: !isSoftwareGl,
      powerPreference: 'high-performance',
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    renderer.shadowMap.enabled = !isSoftwareGl;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    container.appendChild(renderer.domElement);

    // 2. Studio Environment Reflection
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
    pmremGenerator.dispose();

    // 3. Dynamic Sun / Celestial Directional Light
    const sunLight = new THREE.DirectionalLight(initialTimeInfo.sunColor, initialTimeInfo.sunIntensity);
    sunLight.position.set(30, 50, 25);
    sunLight.castShadow = !isSoftwareGl;
    if (!isSoftwareGl) {
      sunLight.shadow.mapSize.width = 1024;
      sunLight.shadow.mapSize.height = 1024;
      sunLight.shadow.camera.near = 10;
      sunLight.shadow.camera.far = 140;
      sunLight.shadow.camera.left = -50;
      sunLight.shadow.camera.right = 50;
      sunLight.shadow.camera.top = 50;
      sunLight.shadow.camera.bottom = -50;
      sunLight.shadow.bias = -0.0005;
      sunLight.shadow.normalBias = 0.02;
    }
    scene.add(sunLight);

    const hemiLight = new THREE.HemisphereLight(
      initialTimeInfo.ambientSkyColor,
      initialTimeInfo.ambientGroundColor,
      initialTimeInfo.ambientIntensity
    );
    scene.add(hemiLight);

    // Celestial Moon & Starfield Dome
    const moonGroup = new THREE.Group();
    const moonMesh = new THREE.Mesh(
      new THREE.SphereGeometry(2.4, 16, 12),
      new THREE.MeshStandardMaterial({
        color: '#e0f2fe',
        emissive: '#7dd3fc',
        emissiveIntensity: 0.9,
        roughness: 0.8,
      })
    );
    moonGroup.add(moonMesh);
    scene.add(moonGroup);

    const starCount = 600;
    const starGeo = new THREE.BufferGeometry();
    const starPos = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount; i++) {
      const u = Math.random();
      const v = Math.random();
      const theta = u * 2.0 * Math.PI;
      const phi = Math.acos(2.0 * v - 1.0);
      const r = 110.0;
      const sinPhi = Math.sin(phi);
      starPos[i * 3] = r * sinPhi * Math.cos(theta);
      starPos[i * 3 + 1] = Math.abs(r * Math.cos(phi)) + 12;
      starPos[i * 3 + 2] = r * sinPhi * Math.sin(theta);
    }
    starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
    const starMat = new THREE.PointsMaterial({
      color: '#ffffff',
      size: 1.1,
      transparent: true,
      opacity: initialTimeInfo.starsOpacity,
    });
    const starField = new THREE.Points(starGeo, starMat);
    scene.add(starField);

    // 4. Build Environment & Colliders based on current view
    let zoneTriggers: WorldZoneTrigger[] = [];
    let animatedMeshes: THREE.Object3D[] = [];
    let worldColliders: Collider[] = [];
    let windSwayMeshes: THREE.Object3D[] = [];
    let ambientParticles: THREE.Points | null = null;
    let waterMesh: THREE.Mesh | null = null;
    let cityLightMats = {
      streetlamps: [] as THREE.MeshStandardMaterial[],
      windows: [] as THREE.MeshStandardMaterial[],
      neons: [] as THREE.MeshStandardMaterial[],
    };

    if (currentView === 'city') {
      const city = buildProceduralCity(scene, playerDisplayName, playerPlotNumber);
      zoneTriggers = city.zoneTriggers;
      animatedMeshes = city.animatedMeshes;
      worldColliders = city.colliders;
      cityLightMats = city.reactiveLightMaterials;
      windSwayMeshes = city.windSwayMeshes;
      ambientParticles = city.ambientParticles;
      waterMesh = city.waterMesh;
    } else {
      const base = buildPersonalBase(scene, placedFurniture, inventory, baseTier);
      const roomDepth = 16 + baseTier * 3;
      worldColliders = base.colliders;
      zoneTriggers = [
        {
          id: 'zone_exit_base',
          name: 'Exit to Residential District',
          prompt: 'Press E to Exit to City District',
          actionKey: 'city',
          x: 0,
          z: roomDepth / 2 - 1.2,
          radius: 3.2,
        },
      ];
    }

    // 5. Signature Mini-Robot Player Rig
    const playerRig: CharacterRig = createCharacterModel(appearanceRef.current);
    scene.add(playerRig.root);

    // Set initial position
    if (currentView === 'city') {
      if (spawnPosition) {
        playerRig.root.position.set(spawnPosition.x, 0, spawnPosition.z);
      } else {
        playerRig.root.position.set(0, 0, 8.5);
      }
    } else {
      playerRig.root.position.set(0, 0, 4.0);
    }

    // 6. Ambient Mini-Robot Residents (NPCs)
    const npcsList: RobotNPC[] = [
      {
        id: 'npc_unit7',
        name: 'Unit-7',
        role: 'Market Assistant',
        x: -22,
        z: 2.5,
        rotation: 1.5,
        wanderRadius: 4,
        dialogue: "BEEP! Welcome to the 24/7 Global Marketplace. Vault Coins accepted worldwide!",
        appearance: {
          headChassis: 'visor_unit',
          eyeDisplay: 'stealth_slit',
          eyeColor: '#10b981',
          chassisMaterial: 'titanium_chrome',
          chassisColor: '#1e293b',
          accentColor: '#10b981',
          coreReactor: 'flux_battery',
          coreColor: '#10b981',
          topStyle: 'tactical_vest',
          topColor: '#0f172a',
          footwearStyle: 'magnetic_boots',
          footwearColor: '#10b981',
          headAccessory: 'antenna_comms',
          accessoryColor: '#10b981',
        },
      },
      {
        id: 'npc_vecho',
        name: 'V-Echo',
        role: 'Plaza Host',
        x: -4.5,
        z: -5.0,
        rotation: 0.8,
        wanderRadius: 5,
        dialogue: "Greetings, Citizen! Check the Grand Auction House North or relax by the Central Fountain.",
        appearance: {
          headChassis: 'capsule_dome',
          eyeDisplay: 'pixel_smile',
          eyeColor: '#f59e0b',
          chassisMaterial: 'white_ceramic',
          chassisColor: '#f8fafc',
          accentColor: '#f59e0b',
          coreReactor: 'arc_pulse',
          coreColor: '#f59e0b',
          topStyle: 'bomber_jacket',
          topColor: '#f59e0b',
          footwearStyle: 'cyber_sneakers',
          footwearColor: '#ffffff',
          headAccessory: 'halo_ring',
          accessoryColor: '#f59e0b',
        },
      },
      {
        id: 'npc_b88',
        name: 'B-88',
        role: 'Arena Sentinel',
        x: 21,
        z: -2.5,
        rotation: -1.6,
        wanderRadius: 3,
        dialogue: "Sensors detect high wager energy in the Vault Duel Arena! Step into the ring to claim your stake.",
        appearance: {
          headChassis: 'cyber_cube',
          eyeDisplay: 'matrix_dots',
          eyeColor: '#a855f7',
          chassisMaterial: 'obsidian_gold',
          chassisColor: '#090d16',
          accentColor: '#9333ea',
          coreReactor: 'hazard_tri',
          coreColor: '#a855f7',
          topStyle: 'tactical_vest',
          topColor: '#1e1b4b',
          footwearStyle: 'piston_striders',
          footwearColor: '#a855f7',
          headAccessory: 'tech_backpack',
          accessoryColor: '#a855f7',
        },
      },
      {
        id: 'npc_nyxbit',
        name: 'Nyx-Bit',
        role: 'Auction Scout',
        x: 6.5,
        z: -24.5,
        rotation: 3.1,
        wanderRadius: 4,
        dialogue: "Rare relics and high-tier artifacts drop every few hours at the Grand Auction House. Bid wisely!",
        appearance: {
          headChassis: 'aero_helm',
          eyeDisplay: 'glow_visor',
          eyeColor: '#38bdf8',
          chassisMaterial: 'matte_stealth',
          chassisColor: '#0f172a',
          accentColor: '#38bdf8',
          coreReactor: 'arc_pulse',
          coreColor: '#38bdf8',
          topStyle: 'hoodie',
          topColor: '#0284c7',
          footwearStyle: 'magnetic_boots',
          footwearColor: '#38bdf8',
          headAccessory: 'gold_chain',
          accessoryColor: '#f59e0b',
        },
      },
      {
        id: 'npc_gizmo9',
        name: 'Gizmo-9',
        role: 'Residential Courier',
        x: -1.5,
        z: 27.5,
        rotation: 0.2,
        wanderRadius: 8,
        dialogue: "Delivering parcels across the 12 Base Plots! Your residence on Plot #7 is looking prime.",
        appearance: {
          headChassis: 'retro_terminal',
          eyeDisplay: 'neon_reticles',
          eyeColor: '#fbbf24',
          chassisMaterial: 'titanium_chrome',
          chassisColor: '#1e293b',
          accentColor: '#f59e0b',
          coreReactor: 'golden_sigil',
          coreColor: '#fbbf24',
          topStyle: 'bomber_jacket',
          topColor: '#1e293b',
          footwearStyle: 'cyber_sneakers',
          footwearColor: '#f59e0b',
          headAccessory: 'cyber_cap',
          accessoryColor: '#f59e0b',
        },
      },
    ];

    const npcsRigs: { rig: CharacterRig; data: RobotNPC; startX: number; startZ: number; wanderTimer: number; targetX: number; targetZ: number }[] = [];

    if (currentView === 'city') {
      npcsList.forEach((npc) => {
        const npcRig = createCharacterModel(npc.appearance);
        npcRig.root.position.set(npc.x, 0, npc.z);
        npcRig.root.rotation.y = npc.rotation;
        scene.add(npcRig.root);

        npcsRigs.push({
          rig: npcRig,
          data: npc,
          startX: npc.x,
          startZ: npc.z,
          wanderTimer: Math.random() * 4 + 3,
          targetX: npc.x,
          targetZ: npc.z,
        });

        // Add interaction zone trigger for NPC
        zoneTriggers.push({
          id: `zone_${npc.id}`,
          name: `${npc.name} (${npc.role})`,
          prompt: `Press E to Talk to ${npc.name}`,
          actionKey: `talk_${npc.id}`,
          x: npc.x,
          z: npc.z,
          radius: 3.2,
        });
      });
    }

    // 7. Input State & Configurable Key Handling
    const movementHeld = {
      forward: false,
      backward: false,
      left: false,
      right: false,
      sprint: false,
    };

    let playerVelocityY = 0;
    let isGrounded = true;
    let yaw = 0;
    let pitch = 0.35;
    const cameraDist = currentView === 'base' ? 5.2 : 7.5;
    let isPointerLocked = false;

    const _moveDir = new THREE.Vector3();
    const _camForward = new THREE.Vector3();
    const _camRight = new THREE.Vector3();

    const onKeyDown = (e: KeyboardEvent) => {
      if (isTitleScreenRef.current || isInputFocusedRef.current) return;
      if (['INPUT', 'SELECT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) return;

      const norm = normalizeKey(e);
      const binds = keybindsRef.current;

      if (norm === binds.moveForward || norm === 'arrowup') movementHeld.forward = true;
      if (norm === binds.moveBackward || norm === 'arrowdown') movementHeld.backward = true;
      if (norm === binds.moveLeft || norm === 'arrowleft') movementHeld.left = true;
      if (norm === binds.moveRight || norm === 'arrowright') movementHeld.right = true;
      if (norm === binds.sprint || e.shiftKey) movementHeld.sprint = true;

      // Jump
      if (norm === binds.jump && isGrounded) {
        playerVelocityY = 7.5;
        isGrounded = false;
        soundManager.playJump();
      }

      // Interact (E key)
      if (norm === binds.interact) {
        const px = playerRig.root.position.x;
        const pz = playerRig.root.position.z;

        // Check NPC conversations
        for (const n of npcsList) {
          const dist = Math.hypot(px - n.x, pz - n.z);
          if (dist <= 3.4) {
            soundManager.playClick();
            if (onNPCTalkRef.current) {
              onNPCTalkRef.current(n);
            }
            return;
          }
        }

        // Check world zone triggers
        for (const zone of zoneTriggers) {
          const dist = Math.hypot(px - zone.x, pz - zone.z);
          if (dist <= zone.radius) {
            soundManager.playClick();
            onZoneInteractRef.current(zone.actionKey);
            break;
          }
        }
      }
    };

    const onKeyUp = (e: KeyboardEvent) => {
      const norm = normalizeKey(e);
      const binds = keybindsRef.current;

      if (norm === binds.moveForward || norm === 'arrowup') movementHeld.forward = false;
      if (norm === binds.moveBackward || norm === 'arrowdown') movementHeld.backward = false;
      if (norm === binds.moveLeft || norm === 'arrowleft') movementHeld.left = false;
      if (norm === binds.moveRight || norm === 'arrowright') movementHeld.right = false;
      if (norm === binds.sprint || !e.shiftKey) movementHeld.sprint = false;
    };

    const onWindowBlur = () => {
      movementHeld.forward = false;
      movementHeld.backward = false;
      movementHeld.left = false;
      movementHeld.right = false;
      movementHeld.sprint = false;
    };

    const onMouseMove = (e: MouseEvent) => {
      if (isTitleScreenRef.current) return;
      if (isPointerLocked || e.buttons === 1 || e.buttons === 2) {
        yaw -= e.movementX * 0.0035;
        pitch = Math.max(0.05, Math.min(Math.PI / 2.3, pitch + e.movementY * 0.0035));
      }
    };

    const onMouseDown = (e: MouseEvent) => {
      if (!isTitleScreenRef.current && e.button === 2) {
        renderer.domElement.requestPointerLock?.();
      }
    };

    const onPointerLockChange = () => {
      isPointerLocked = document.pointerLockElement === renderer.domElement;
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('blur', onWindowBlur);
    window.addEventListener('mousemove', onMouseMove);
    renderer.domElement.addEventListener('mousedown', onMouseDown);
    document.addEventListener('pointerlockchange', onPointerLockChange);

    // 8. Simulation Tick Loop
    let lastTime = performance.now();
    let frameId = 0;
    let clockTime = 0;

    const tick = () => {
      const now = performance.now();
      const rawDt = (now - lastTime) / 1000;
      lastTime = now;
      const dt = Math.min(rawDt, 0.05);
      clockTime += dt;

      // ==========================================
      // ADVANCE DYNAMIC DAY/NIGHT TIME ENGINE
      // ==========================================
      const timeInfo = dayNightManager.advanceTime(dt);

      // Celestial Sun trajectory
      const sunDist = 65;
      const sunX = Math.cos(timeInfo.sunAzimuth) * sunDist;
      const sunY = Math.sin(timeInfo.sunAltitude) * sunDist;
      const sunZ = Math.sin(timeInfo.sunAzimuth) * sunDist;
      sunLight.position.set(sunX, sunY, sunZ);
      sunLight.color.set(timeInfo.sunColor);
      sunLight.intensity = timeInfo.sunIntensity;

      // Celestial Moon (Opposite orbit)
      moonGroup.position.set(-sunX * 0.9, Math.max(8, -sunY * 0.85 + 24), -sunZ * 0.9);
      moonMesh.visible = timeInfo.nightFactor > 0.15;

      // Stars Dome Opacity
      starMat.opacity = timeInfo.starsOpacity;

      // Hemisphere Ambient Lighting & Fog
      hemiLight.color.set(timeInfo.ambientSkyColor);
      hemiLight.groundColor.set(timeInfo.ambientGroundColor);
      if (scene.background instanceof THREE.Color) {
        scene.background.set(timeInfo.fogColor);
      } else {
        scene.background = new THREE.Color(timeInfo.fogColor);
      }
      if (scene.fog) {
        (scene.fog as THREE.FogExp2).color.set(timeInfo.fogColor);
      }

      // Reactive City Lighting (Streetlights, Windows, Neons)
      cityLightMats.streetlamps.forEach((m) => {
        m.emissiveIntensity = timeInfo.streetlampGlowIntensity;
      });
      cityLightMats.windows.forEach((m) => {
        m.emissiveIntensity = timeInfo.windowGlowIntensity;
      });
      cityLightMats.neons.forEach((m) => {
        m.emissiveIntensity = 0.5 + timeInfo.nightFactor * 0.75;
      });

      // Environmental Life Animations
      windSwayMeshes.forEach((mesh, idx) => {
        mesh.rotation.z = Math.sin(clockTime * 1.8 + idx * 0.6) * 0.035;
      });
      if (ambientParticles) {
        ambientParticles.rotation.y = clockTime * 0.02;
      }
      if (waterMesh) {
        waterMesh.rotation.y = clockTime * 0.06;
      }

      // Animate world items (Monolith prism, duel rings)
      animatedMeshes.forEach((mesh, idx) => {
        mesh.rotation.y += dt * (0.8 + idx * 0.3);
      });

      // Update player model appearance
      playerRig.updateAppearance(appearanceRef.current);

      // TITLE SCREEN CINEMATIC ORBIT
      if (isTitleScreenRef.current) {
        const orbitAngle = clockTime * 0.08;
        const orbitRadius = 26;
        camera.position.set(
          Math.cos(orbitAngle) * orbitRadius,
          11 + Math.sin(clockTime * 0.2) * 1.5,
          Math.sin(orbitAngle) * orbitRadius
        );
        camera.lookAt(0, 3.2, 0);

        playerRig.root.position.set(0, 0, 7.5);
        playerRig.root.rotation.y = Math.PI;
        playerRig.animate(0, false, clockTime, 'idle');

        renderer.render(scene, camera);
        frameId = requestAnimationFrame(tick);
        return;
      }

      // IN-GAME CHARACTER MOVEMENT & COLLISION
      _camForward.set(-Math.sin(yaw), 0, -Math.cos(yaw)).normalize();
      _camRight.set(Math.cos(yaw), 0, -Math.sin(yaw)).normalize();

      _moveDir.set(0, 0, 0);
      if (movementHeld.forward) _moveDir.add(_camForward);
      if (movementHeld.backward) _moveDir.sub(_camForward);
      if (movementHeld.left) _moveDir.sub(_camRight);
      if (movementHeld.right) _moveDir.add(_camRight);

      const isMoving = _moveDir.lengthSq() > 0.001;
      const moveSpeed = movementHeld.sprint ? 9.5 : 5.5;

      if (isMoving) {
        _moveDir.normalize();
        const deltaX = _moveDir.x * moveSpeed * dt;
        const deltaZ = _moveDir.z * moveSpeed * dt;

        const playerRadius = 0.45;
        const mapBound = currentView === 'city' ? 71 : (16 + baseTier * 3) / 2 - 0.5;

        const steps = moveSpeed * dt > 0.25 ? 2 : 1;
        const stepDtX = deltaX / steps;
        const stepDtZ = deltaZ / steps;

        for (let s = 0; s < steps; s++) {
          const colResult = resolveMovementWithCollision(
            playerRig.root.position.x,
            playerRig.root.position.z,
            stepDtX,
            stepDtZ,
            playerRadius,
            worldColliders,
            mapBound
          );

          playerRig.root.position.x = colResult.x;
          playerRig.root.position.z = colResult.z;
        }

        const targetRot = Math.atan2(_moveDir.x, _moveDir.z);
        playerRig.root.rotation.y = THREE.MathUtils.damp(playerRig.root.rotation.y, targetRot, 14, dt);

        if (isGrounded) {
          soundManager.playFootstep();
        }
      }

      // Gravity
      if (!isGrounded) {
        playerVelocityY -= 22 * dt;
        playerRig.root.position.y += playerVelocityY * dt;
        if (playerRig.root.position.y <= 0) {
          playerRig.root.position.y = 0;
          playerVelocityY = 0;
          isGrounded = true;
        }
      }

      // Animate player robot rig
      playerRig.animate(moveSpeed / 6, isMoving, clockTime, activeEmoteRef.current);

      // Zone triggers proximity test
      let foundNearbyZone: WorldZoneTrigger | null = null;
      const px = playerRig.root.position.x;
      const pz = playerRig.root.position.z;

      for (const zone of zoneTriggers) {
        const dist = Math.hypot(px - zone.x, pz - zone.z);
        if (dist <= zone.radius) {
          foundNearbyZone = zone;
          break;
        }
      }
      onNearbyZoneChangeRef.current(foundNearbyZone);

      // Animate Ambient Robot NPCs (Wandering, looking, natural idle)
      npcsRigs.forEach((npcEntry) => {
        npcEntry.wanderTimer -= dt;
        if (npcEntry.wanderTimer <= 0) {
          npcEntry.wanderTimer = Math.random() * 5 + 4;
          const angle = Math.random() * Math.PI * 2;
          const dist = Math.random() * npcEntry.data.wanderRadius;
          npcEntry.targetX = npcEntry.startX + Math.cos(angle) * dist;
          npcEntry.targetZ = npcEntry.startZ + Math.sin(angle) * dist;
        }

        const dx = npcEntry.targetX - npcEntry.rig.root.position.x;
        const dz = npcEntry.targetZ - npcEntry.rig.root.position.z;
        const dist = Math.hypot(dx, dz);

        if (dist > 0.4) {
          const dirX = dx / dist;
          const dirZ = dz / dist;
          npcEntry.rig.root.position.x += dirX * 2.2 * dt;
          npcEntry.rig.root.position.z += dirZ * 2.2 * dt;
          npcEntry.rig.root.rotation.y = Math.atan2(dirX, dirZ);
          npcEntry.rig.animate(0.45, true, clockTime);
        } else {
          // Look towards player if nearby
          const toPlayerX = px - npcEntry.rig.root.position.x;
          const toPlayerZ = pz - npcEntry.rig.root.position.z;
          const distToPlayer = Math.hypot(toPlayerX, toPlayerZ);
          if (distToPlayer < 4.0) {
            const lookAngle = Math.atan2(toPlayerX, toPlayerZ);
            npcEntry.rig.root.rotation.y = THREE.MathUtils.damp(npcEntry.rig.root.rotation.y, lookAngle, 6, dt);
          }
          npcEntry.rig.animate(0, false, clockTime);
        }
      });

      // Third-person camera follow
      const targetCamX = playerRig.root.position.x + Math.sin(yaw) * Math.cos(pitch) * cameraDist;
      const targetCamY = playerRig.root.position.y + Math.sin(pitch) * cameraDist + 1.2;
      const targetCamZ = playerRig.root.position.z + Math.cos(yaw) * Math.cos(pitch) * cameraDist;

      camera.position.x = THREE.MathUtils.damp(camera.position.x, targetCamX, 10, dt);
      camera.position.y = THREE.MathUtils.damp(camera.position.y, targetCamY, 10, dt);
      camera.position.z = THREE.MathUtils.damp(camera.position.z, targetCamZ, 10, dt);

      camera.lookAt(playerRig.root.position.x, playerRig.root.position.y + 1.2, playerRig.root.position.z);

      renderer.render(scene, camera);
      frameId = requestAnimationFrame(tick);
    };

    frameId = requestAnimationFrame(tick);

    const onResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', onResize);

    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('blur', onWindowBlur);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('resize', onResize);
      renderer.domElement.removeEventListener('mousedown', onMouseDown);
      document.removeEventListener('pointerlockchange', onPointerLockChange);
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, [currentView, baseTier, playerPlotNumber, playerDisplayName, spawnPosition]);

  return <div ref={mountRef} className="absolute inset-0 w-full h-full overflow-hidden" />;
};
