/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as THREE from 'three';
import { PlacedFurniture, CollectibleItem } from '../types/game';
import {
  Collider,
  createBoxCollider,
  createCircleCollider,
} from './collisionSystem';

export interface WorldZoneTrigger {
  id: string;
  name: string;
  prompt: string;
  actionKey: string;
  x: number;
  z: number;
  radius: number;
}

export interface ResidentialPlot {
  plotNumber: number;
  ownerName: string;
  isPlayerHome: boolean;
  x: number;
  z: number;
  rotation: number;
  facadeStyle: 'modern_carbon' | 'warm_timber' | 'obsidian_gold' | 'cyber_glass';
}

export interface CityBuildResult {
  zoneTriggers: WorldZoneTrigger[];
  animatedMeshes: THREE.Object3D[];
  colliders: Collider[];
  playerHomeCoords: { x: number; z: number };
  reactiveLightMaterials: {
    streetlamps: THREE.MeshStandardMaterial[];
    windows: THREE.MeshStandardMaterial[];
    neons: THREE.MeshStandardMaterial[];
  };
  windSwayMeshes: THREE.Object3D[];
  ambientParticles: THREE.Points;
  waterMesh: THREE.Mesh;
}

/**
 * Builds the complete procedural Mini-City for VAULTBOUND:
 * - Natural grass variations, paved road network, curbs, sidewalks, and plaza pavers
 * - Distinct districts: Central Plaza, Grand Auction House, Marketplace, Duel Arena, Syndicate Bunker, Event Square
 * - Residential District with 12 distinct private house plots enclosed with boundary walls and front gates
 * - Plot #7 customized as Player Base with entrance gate, personalized nameplate, and entrance portal
 * - Full collision representation for buildings, walls, fences, market stalls, trees, and street furniture
 * - Dynamic Day/Night reactive materials (streetlights, windows, neons)
 * - Animated ambient particles, wind-swaying trees, and animated fountain water
 */
export function buildProceduralCity(
  scene: THREE.Scene,
  playerDisplayName: string = 'You',
  playerPlotNumber: number = 7
): CityBuildResult {
  const animatedMeshes: THREE.Object3D[] = [];
  const zoneTriggers: WorldZoneTrigger[] = [];
  const colliders: Collider[] = [];
  const windSwayMeshes: THREE.Object3D[] = [];

  const reactiveLightMaterials = {
    streetlamps: [] as THREE.MeshStandardMaterial[],
    windows: [] as THREE.MeshStandardMaterial[],
    neons: [] as THREE.MeshStandardMaterial[],
  };

  // ==========================================
  // 1. GROUND PLANE WITH NATURAL GRASS & ROADS
  // ==========================================
  const grassCanvas = document.createElement('canvas');
  grassCanvas.width = 512;
  grassCanvas.height = 512;
  const grCtx = grassCanvas.getContext('2d')!;
  
  // Base lush turf
  grCtx.fillStyle = '#0d1914';
  grCtx.fillRect(0, 0, 512, 512);

  // Subtle natural variations in grass blade tone
  for (let i = 0; i < 4500; i++) {
    const gx = Math.random() * 512;
    const gy = Math.random() * 512;
    const tones = ['#102c1d', '#0e2318', '#143624', '#0b1913', '#16422b'];
    grCtx.fillStyle = tones[Math.floor(Math.random() * tones.length)];
    grCtx.fillRect(gx, gy, 2 + Math.random() * 3, 2 + Math.random() * 3);
  }

  const grassTex = new THREE.CanvasTexture(grassCanvas);
  grassTex.wrapS = THREE.RepeatWrapping;
  grassTex.wrapT = THREE.RepeatWrapping;
  grassTex.repeat.set(16, 16);
  grassTex.colorSpace = THREE.SRGBColorSpace;

  const grassMat = new THREE.MeshStandardMaterial({
    map: grassTex,
    roughness: 0.9,
    metalness: 0.05,
  });

  const baseGround = new THREE.Mesh(new THREE.PlaneGeometry(160, 160), grassMat);
  baseGround.rotation.x = -Math.PI / 2;
  baseGround.receiveShadow = true;
  baseGround.position.y = 0;
  scene.add(baseGround);

  // ==========================================
  // 2. STREETS, SIDEWALKS & CURBS
  // ==========================================
  const asphaltCanvas = document.createElement('canvas');
  asphaltCanvas.width = 512;
  asphaltCanvas.height = 512;
  const actx = asphaltCanvas.getContext('2d')!;
  actx.fillStyle = '#0f1722';
  actx.fillRect(0, 0, 512, 512);
  for (let s = 0; s < 1500; s++) {
    actx.fillStyle = Math.random() > 0.5 ? '#162232' : '#0c131c';
    actx.fillRect(Math.random() * 512, Math.random() * 512, 2, 2);
  }
  const roadTex = new THREE.CanvasTexture(asphaltCanvas);
  roadTex.wrapS = THREE.RepeatWrapping;
  roadTex.wrapT = THREE.RepeatWrapping;
  roadTex.repeat.set(6, 6);
  roadTex.colorSpace = THREE.SRGBColorSpace;

  const roadMat = new THREE.MeshStandardMaterial({
    map: roadTex,
    roughness: 0.8,
    metalness: 0.15,
  });

  const curbMat = new THREE.MeshStandardMaterial({
    color: '#273449',
    roughness: 0.6,
    metalness: 0.3,
  });

  const sidewalkMat = new THREE.MeshStandardMaterial({
    color: '#1a2332',
    roughness: 0.7,
    metalness: 0.2,
  });

  // Main North-South Avenue
  const roadNS = new THREE.Mesh(new THREE.BoxGeometry(10, 0.06, 100), roadMat);
  roadNS.position.set(0, 0.03, -2);
  roadNS.receiveShadow = true;
  scene.add(roadNS);

  // East-West Boulevard
  const roadEW = new THREE.Mesh(new THREE.BoxGeometry(100, 0.06, 10), roadMat);
  roadEW.position.set(0, 0.03, 0);
  roadEW.receiveShadow = true;
  scene.add(roadEW);

  // Residential Neighborhood Street
  const roadRes = new THREE.Mesh(new THREE.BoxGeometry(84, 0.06, 8), roadMat);
  roadRes.position.set(0, 0.03, 27);
  roadRes.receiveShadow = true;
  scene.add(roadRes);

  const createSidewalkSegment = (x: number, z: number, w: number, d: number) => {
    const sw = new THREE.Mesh(new THREE.BoxGeometry(w, 0.14, d), sidewalkMat);
    sw.position.set(x, 0.07, z);
    sw.receiveShadow = true;
    scene.add(sw);
  };

  createSidewalkSegment(-6.5, -2, 2.5, 96);
  createSidewalkSegment(6.5, -2, 2.5, 96);
  createSidewalkSegment(0, -6.5, 96, 2.5);
  createSidewalkSegment(0, 6.5, 96, 2.5);
  createSidewalkSegment(0, 21.8, 84, 2.2);
  createSidewalkSegment(0, 32.2, 84, 2.2);

  // ==========================================
  // 3. CENTRAL PLAZA & FOUNTAIN MONUMENT
  // ==========================================
  const plazaGroup = new THREE.Group();
  plazaGroup.position.set(0, 0, 0);

  const plazaMat = new THREE.MeshStandardMaterial({
    color: '#131d2e',
    roughness: 0.5,
    metalness: 0.35,
  });
  const plazaFloor = new THREE.Mesh(new THREE.CylinderGeometry(14, 14.5, 0.18, 24), plazaMat);
  plazaFloor.position.y = 0.09;
  plazaFloor.receiveShadow = true;
  plazaGroup.add(plazaFloor);

  const plazaGoldRing = new THREE.Mesh(
    new THREE.TorusGeometry(13.6, 0.1, 8, 32),
    new THREE.MeshStandardMaterial({ color: '#f59e0b', roughness: 0.2, metalness: 0.9 })
  );
  plazaGoldRing.rotation.x = Math.PI / 2;
  plazaGoldRing.position.y = 0.19;
  plazaGroup.add(plazaGoldRing);

  // Octagonal plaza fountain base
  const fountainPool = new THREE.Mesh(
    new THREE.CylinderGeometry(5.6, 6.2, 0.7, 8),
    new THREE.MeshStandardMaterial({ color: '#1e293b', roughness: 0.3, metalness: 0.6 })
  );
  fountainPool.position.y = 0.35;
  fountainPool.receiveShadow = true;
  plazaGroup.add(fountainPool);

  // Animated Water Feature
  const water = new THREE.Mesh(
    new THREE.CylinderGeometry(5.2, 5.2, 0.06, 24),
    new THREE.MeshPhysicalMaterial({
      color: '#0284c7',
      transmission: 0.8,
      transparent: true,
      opacity: 0.85,
      roughness: 0.1,
    })
  );
  water.position.y = 0.71;
  plazaGroup.add(water);

  // Floating Vault Tesseract Core
  const coreMat = new THREE.MeshStandardMaterial({
    color: '#f59e0b',
    metalness: 0.95,
    roughness: 0.15,
    emissive: '#d97706',
    emissiveIntensity: 0.45,
  });
  reactiveLightMaterials.neons.push(coreMat);

  const corePrism = new THREE.Mesh(new THREE.OctahedronGeometry(1.6, 0), coreMat);
  corePrism.position.y = 3.6;
  corePrism.castShadow = true;
  plazaGroup.add(corePrism);
  animatedMeshes.push(corePrism);

  const goldRingMat = new THREE.MeshStandardMaterial({ color: '#f59e0b', roughness: 0.2, metalness: 0.9 });
  const ringA = new THREE.Mesh(new THREE.TorusGeometry(2.5, 0.08, 12, 32), goldRingMat);
  ringA.position.y = 3.6;
  ringA.rotation.x = Math.PI / 4;
  plazaGroup.add(ringA);
  animatedMeshes.push(ringA);

  const ringB = new THREE.Mesh(new THREE.TorusGeometry(3.0, 0.08, 12, 32), goldRingMat);
  ringB.position.y = 3.6;
  ringB.rotation.y = Math.PI / 3;
  plazaGroup.add(ringB);
  animatedMeshes.push(ringB);

  // Plaza Welcome Sign Board
  const signBoard = new THREE.Mesh(
    new THREE.BoxGeometry(4.0, 1.2, 0.3),
    new THREE.MeshStandardMaterial({ color: '#0f172a', roughness: 0.4, metalness: 0.8 })
  );
  signBoard.position.set(0, 1.4, 7.2);

  const signTrimMat = new THREE.MeshStandardMaterial({
    color: '#f59e0b',
    emissive: '#d97706',
    emissiveIntensity: 0.8,
  });
  reactiveLightMaterials.neons.push(signTrimMat);

  const signTrim = new THREE.Mesh(new THREE.BoxGeometry(4.2, 0.12, 0.35), signTrimMat);
  signTrim.position.set(0, 2.05, 7.2);
  plazaGroup.add(signBoard, signTrim);

  scene.add(plazaGroup);

  colliders.push(createCircleCollider('col_fountain', 0, 0, 6.0, 'Central Fountain'));
  colliders.push(createBoxCollider('col_plaza_sign', 0, 7.2, 4.2, 0.6, 'Plaza Signboard'));

  // ==========================================
  // 4. ZONE B: GRAND AUCTION HOUSE (North)
  // ==========================================
  const auctionBuilding = new THREE.Group();
  auctionBuilding.position.set(0, 0, -34);

  // Grand Steps
  for (let s = 0; s < 5; s++) {
    const step = new THREE.Mesh(
      new THREE.BoxGeometry(20 - s * 1.4, 0.25, 4.8 - s * 0.7),
      new THREE.MeshStandardMaterial({ color: '#2b3648', roughness: 0.5, metalness: 0.4 })
    );
    step.position.set(0, s * 0.25 + 0.125, 4.5 - s * 0.7);
    step.receiveShadow = true;
    auctionBuilding.add(step);
  }

  // Neoclassical Building Body
  const facade = new THREE.Mesh(
    new THREE.BoxGeometry(26, 12, 16),
    new THREE.MeshStandardMaterial({ color: '#0c121e', roughness: 0.6, metalness: 0.3 })
  );
  facade.position.set(0, 6, -5.5);
  facade.castShadow = true;
  facade.receiveShadow = true;
  auctionBuilding.add(facade);

  // Arched Double Entrance Doors with Reactive Warm Glow
  const doorArch = new THREE.Mesh(
    new THREE.BoxGeometry(4.4, 5.2, 0.3),
    new THREE.MeshStandardMaterial({ color: '#162030', roughness: 0.3, metalness: 0.7 })
  );
  doorArch.position.set(0, 3.8, 2.6);

  const doorPanelsMat = new THREE.MeshStandardMaterial({
    color: '#f59e0b',
    emissive: '#78350f',
    emissiveIntensity: 0.5,
    metalness: 0.9,
    roughness: 0.2,
  });
  reactiveLightMaterials.windows.push(doorPanelsMat);

  const doorPanels = new THREE.Mesh(new THREE.BoxGeometry(3.6, 4.6, 0.2), doorPanelsMat);
  doorPanels.position.set(0, 3.8, 2.7);
  auctionBuilding.add(doorArch, doorPanels);

  // 6 Marble Pillars
  const pillarXPositions = [-9.5, -5.7, -1.9, 1.9, 5.7, 9.5];
  pillarXPositions.forEach((px) => {
    const colGroup = new THREE.Group();
    colGroup.position.set(px, 5.0, 2.4);

    const shaft = new THREE.Mesh(
      new THREE.CylinderGeometry(0.5, 0.55, 8.2, 16),
      new THREE.MeshStandardMaterial({ color: '#f1f5f9', roughness: 0.25, metalness: 0.2 })
    );
    shaft.castShadow = true;

    const capital = new THREE.Mesh(
      new THREE.BoxGeometry(1.3, 0.35, 1.3),
      new THREE.MeshStandardMaterial({ color: '#f59e0b', roughness: 0.15, metalness: 0.95 })
    );
    capital.position.y = 4.2;

    colGroup.add(shaft, capital);
    auctionBuilding.add(colGroup);
    colliders.push(createCircleCollider(`col_auc_pillar_${px}`, px, -34 + 2.4, 0.55, 'Auction Pillar'));
  });

  const marquee = new THREE.Mesh(
    new THREE.BoxGeometry(27, 1.6, 7),
    new THREE.MeshStandardMaterial({ color: '#f59e0b', roughness: 0.2, metalness: 0.9 })
  );
  marquee.position.set(0, 10.2, 1.2);
  marquee.castShadow = true;
  auctionBuilding.add(marquee);

  const aucSignMat = new THREE.MeshStandardMaterial({
    color: '#f59e0b',
    emissive: '#f59e0b',
    emissiveIntensity: 0.9,
  });
  reactiveLightMaterials.neons.push(aucSignMat);

  const aucSign = new THREE.Mesh(new THREE.BoxGeometry(16, 1.0, 0.2), aucSignMat);
  aucSign.position.set(0, 10.2, 4.8);
  auctionBuilding.add(aucSign);

  scene.add(auctionBuilding);

  colliders.push(createBoxCollider('col_auction_body', 0, -34 - 5.5, 26.5, 16.5, 'Grand Auction House Walls'));
  colliders.push(createBoxCollider('col_auction_left_wing', -7.5, -34 + 1.8, 11, 2.4, 'Auction Left Wing'));
  colliders.push(createBoxCollider('col_auction_right_wing', 7.5, -34 + 1.8, 11, 2.4, 'Auction Right Wing'));

  zoneTriggers.push({
    id: 'zone_auction',
    name: 'Grand Auction House',
    prompt: 'Press E to Enter Grand Auction House',
    actionKey: 'auction',
    x: 0,
    z: -27.5,
    radius: 4.8,
  });

  // ==========================================
  // 5. ZONE C: PLAYER MARKETPLACE DISTRICT (West)
  // ==========================================
  const marketDistrict = new THREE.Group();
  marketDistrict.position.set(-34, 0, 0);

  const pavilion = new THREE.Mesh(
    new THREE.BoxGeometry(16, 0.3, 26),
    new THREE.MeshStandardMaterial({ color: '#1a2332', roughness: 0.5, metalness: 0.3 })
  );
  pavilion.position.y = 0.15;
  pavilion.receiveShadow = true;
  marketDistrict.add(pavilion);

  const arcadeBackWall = new THREE.Mesh(
    new THREE.BoxGeometry(1.6, 6, 26),
    new THREE.MeshStandardMaterial({ color: '#0d131f', roughness: 0.8, metalness: 0.2 })
  );
  arcadeBackWall.position.set(-7.5, 3.0, 0);
  arcadeBackWall.castShadow = true;
  marketDistrict.add(arcadeBackWall);
  colliders.push(createBoxCollider('col_market_backwall', -34 - 7.5, 0, 2.0, 26.5, 'Market Arcade Wall'));

  const stallZOffsets = [-8, 0, 8];
  stallZOffsets.forEach((offsetZ, idx) => {
    const stall = new THREE.Group();
    stall.position.set(0, 0, offsetZ);

    const counter = new THREE.Mesh(
      new THREE.BoxGeometry(6.4, 1.2, 2.8),
      new THREE.MeshStandardMaterial({ color: '#2b3648', roughness: 0.6, metalness: 0.25 })
    );
    counter.position.y = 0.7;
    counter.castShadow = true;

    const canopy = new THREE.Mesh(
      new THREE.ConeGeometry(3.8, 1.4, 4),
      new THREE.MeshStandardMaterial({
        color: idx % 2 === 0 ? '#0284c7' : '#f59e0b',
        roughness: 0.4,
        metalness: 0.15,
      })
    );
    canopy.rotation.y = Math.PI / 4;
    canopy.position.y = 3.2;
    canopy.castShadow = true;

    stall.add(counter, canopy);
    marketDistrict.add(stall);
    colliders.push(createBoxCollider(`col_market_stall_${idx}`, -34, offsetZ, 6.6, 3.0, `Market Stall ${idx + 1}`));
  });

  const mktTotemMat = new THREE.MeshStandardMaterial({
    color: '#38bdf8',
    emissive: '#0284c7',
    emissiveIntensity: 0.8,
  });
  reactiveLightMaterials.neons.push(mktTotemMat);

  const mktTotem = new THREE.Mesh(new THREE.BoxGeometry(1.4, 5.5, 1.4), mktTotemMat);
  mktTotem.position.set(6, 2.75, 0);
  marketDistrict.add(mktTotem);
  colliders.push(createBoxCollider('col_market_totem', -34 + 6, 0, 1.6, 1.6, 'Market Totem'));

  scene.add(marketDistrict);

  zoneTriggers.push({
    id: 'zone_market',
    name: 'Player Marketplace',
    prompt: 'Press E to Enter Marketplace Stalls',
    actionKey: 'market',
    x: -26,
    z: 0,
    radius: 5.5,
  });

  // ==========================================
  // 6. ZONE D: VAULT DUEL ARENA & SYNDICATE HUB (East)
  // ==========================================
  const arenaGroup = new THREE.Group();
  arenaGroup.position.set(34, 0, 0);

  const arenaDome = new THREE.Mesh(
    new THREE.SphereGeometry(9.5, 20, 14, 0, Math.PI * 2, 0, Math.PI * 0.5),
    new THREE.MeshStandardMaterial({ color: '#0f172a', roughness: 0.35, metalness: 0.85 })
  );
  arenaDome.position.y = 0;
  arenaDome.castShadow = true;
  arenaGroup.add(arenaDome);

  const ringDuelMat = new THREE.MeshStandardMaterial({
    color: '#a855f7',
    emissive: '#9333ea',
    emissiveIntensity: 0.9,
  });
  reactiveLightMaterials.neons.push(ringDuelMat);

  const ringDuel = new THREE.Mesh(new THREE.TorusGeometry(9.8, 0.28, 8, 32), ringDuelMat);
  ringDuel.position.y = 4.8;
  ringDuel.rotation.x = Math.PI / 2;
  arenaGroup.add(ringDuel);
  animatedMeshes.push(ringDuel);

  const portalArch = new THREE.Mesh(
    new THREE.BoxGeometry(1.4, 4.2, 3.8),
    new THREE.MeshStandardMaterial({ color: '#1e1b4b', metalness: 0.8, roughness: 0.2 })
  );
  portalArch.position.set(-9.2, 2.1, 0);
  arenaGroup.add(portalArch);

  scene.add(arenaGroup);
  colliders.push(createCircleCollider('col_arena_dome', 34, 0, 9.2, 'Vault Duel Arena Dome'));

  zoneTriggers.push({
    id: 'zone_arena',
    name: 'Vault Duel Arena',
    prompt: 'Press E to Enter Vault Duel Arena',
    actionKey: 'duel',
    x: 24.5,
    z: 0,
    radius: 4.8,
  });

  // Syndicate Bunker
  const heistGroup = new THREE.Group();
  heistGroup.position.set(16, 0, -18);

  const heistBunker = new THREE.Mesh(
    new THREE.BoxGeometry(8.5, 4.5, 6.5),
    new THREE.MeshStandardMaterial({ color: '#090d16', roughness: 0.9, metalness: 0.25 })
  );
  heistBunker.position.y = 2.25;
  heistBunker.castShadow = true;
  heistGroup.add(heistBunker);

  const redBeaconMat = new THREE.MeshStandardMaterial({
    color: '#ef4444',
    emissive: '#dc2626',
    emissiveIntensity: 1.2,
  });
  reactiveLightMaterials.neons.push(redBeaconMat);

  const redBeacon = new THREE.Mesh(new THREE.SphereGeometry(0.35, 8, 8), redBeaconMat);
  redBeacon.position.set(0, 4.0, 3.4);
  heistGroup.add(redBeacon);

  scene.add(heistGroup);
  colliders.push(createBoxCollider('col_heist_bunker', 16, -18, 9.0, 7.0, 'Syndicate Bunker'));

  zoneTriggers.push({
    id: 'zone_heist',
    name: 'Syndicate Shadow Hub (Heist Mission)',
    prompt: 'Press E to Infiltrate Vault Heist',
    actionKey: 'heist',
    x: 16,
    z: -13.5,
    radius: 4.2,
  });

  // ==========================================
  // 7. ZONE E: EVENT SQUARE (South-Central)
  // ==========================================
  const eventGroup = new THREE.Group();
  eventGroup.position.set(0, 0, 16);

  const stagePad = new THREE.Mesh(
    new THREE.CylinderGeometry(4.8, 5.2, 0.4, 12),
    new THREE.MeshStandardMaterial({ color: '#581c87', roughness: 0.4, metalness: 0.6 })
  );
  stagePad.position.y = 0.2;
  stagePad.receiveShadow = true;
  eventGroup.add(stagePad);

  const holoPillarMat = new THREE.MeshStandardMaterial({
    color: '#c084fc',
    emissive: '#a855f7',
    emissiveIntensity: 0.85,
  });
  reactiveLightMaterials.neons.push(holoPillarMat);

  const holoPillar = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.8, 3.6, 8), holoPillarMat);
  holoPillar.position.y = 2.0;
  eventGroup.add(holoPillar);
  animatedMeshes.push(holoPillar);

  scene.add(eventGroup);
  colliders.push(createCircleCollider('col_event_pillar', 0, 16, 0.85, 'Event Pillar'));

  zoneTriggers.push({
    id: 'zone_event',
    name: 'Event Square (Sunday Treasure Market)',
    prompt: 'Press E to View Festival Events & Relics',
    actionKey: 'event',
    x: 0,
    z: 16,
    radius: 4.8,
  });

  // ==========================================
  // 8. ZONE F: RESIDENTIAL BASE DISTRICT (Plots 1 to 12)
  // ==========================================
  let playerHomeCoords = { x: -12, z: 39 };

  const plotPositions = [
    { plotNumber: 1, ownerName: "GhostHacker", x: -36, z: 39, style: 'modern_carbon' as const },
    { plotNumber: 2, ownerName: "Kallisto", x: -24, z: 39, style: 'warm_timber' as const },
    { plotNumber: 7, ownerName: `${playerDisplayName}'s Base`, x: -12, z: 39, style: 'obsidian_gold' as const, isPlayer: true },
    { plotNumber: 8, ownerName: "Nyx_Rogue", x: 0, z: 39, style: 'warm_timber' as const },
    { plotNumber: 9, ownerName: "Unit-09 Yard", x: 12, z: 39, style: 'modern_carbon' as const },
    { plotNumber: 10, ownerName: "GrandMaster_Vex", x: 24, z: 39, style: 'obsidian_gold' as const },
    { plotNumber: 3, ownerName: "Available Plot #03", x: -36, z: 15, style: 'obsidian_gold' as const, faceSouth: true },
    { plotNumber: 4, ownerName: "Rox_Trades", x: -24, z: 15, style: 'cyber_glass' as const, faceSouth: true },
    { plotNumber: 5, ownerName: "Vesper_Apex", x: -12, z: 15, style: 'obsidian_gold' as const, faceSouth: true },
    { plotNumber: 6, ownerName: "Cipher_99", x: 12, z: 15, style: 'modern_carbon' as const, faceSouth: true },
    { plotNumber: 11, ownerName: "Madame_Zuri", x: 24, z: 15, style: 'cyber_glass' as const, faceSouth: true },
    { plotNumber: 12, ownerName: "Scout-12 Depot", x: 36, z: 15, style: 'warm_timber' as const, faceSouth: true },
  ];

  plotPositions.forEach((p) => {
    const isPlayer = p.plotNumber === playerPlotNumber;
    if (isPlayer) {
      playerHomeCoords = { x: p.x, z: p.z };
    }

    const houseGroup = new THREE.Group();
    houseGroup.position.set(p.x, 0, p.z);
    if (p.faceSouth) {
      houseGroup.rotation.y = Math.PI;
    }

    const lawnMat = new THREE.MeshStandardMaterial({
      color: isPlayer ? '#14251c' : '#122018',
      roughness: 0.85,
      metalness: 0.05,
    });
    const lawn = new THREE.Mesh(new THREE.BoxGeometry(9.6, 0.12, 10.6), lawnMat);
    lawn.position.set(0, 0.06, 0);
    lawn.receiveShadow = true;
    houseGroup.add(lawn);

    const pathMat = new THREE.MeshStandardMaterial({ color: '#273449', roughness: 0.7, metalness: 0.2 });
    const stonePath = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.14, 4.6), pathMat);
    stonePath.position.set(0, 0.07, 2.6);
    stonePath.receiveShadow = true;
    houseGroup.add(stonePath);

    let wallColor = '#1e293b';
    let trimColor = '#38bdf8';
    if (p.style === 'warm_timber') {
      wallColor = '#2d2218';
      trimColor = '#d97706';
    } else if (p.style === 'obsidian_gold') {
      wallColor = '#0b1120';
      trimColor = '#f59e0b';
    } else if (p.style === 'cyber_glass') {
      wallColor = '#0f172a';
      trimColor = '#06b6d4';
    }

    const houseBody = new THREE.Mesh(
      new THREE.BoxGeometry(6.4, 5.6, 5.6),
      new THREE.MeshStandardMaterial({ color: wallColor, roughness: 0.65, metalness: 0.25 })
    );
    houseBody.position.set(0, 2.85, -1.6);
    houseBody.castShadow = true;
    houseBody.receiveShadow = true;
    houseGroup.add(houseBody);

    if (p.plotNumber % 2 === 0) {
      const pitchedRoof = new THREE.Mesh(
        new THREE.ConeGeometry(5.2, 2.0, 4),
        new THREE.MeshStandardMaterial({ color: '#090d16', roughness: 0.5, metalness: 0.5 })
      );
      pitchedRoof.rotation.y = Math.PI / 4;
      pitchedRoof.position.set(0, 6.6, -1.6);
      pitchedRoof.castShadow = true;
      houseGroup.add(pitchedRoof);
    } else {
      const flatRoof = new THREE.Mesh(
        new THREE.BoxGeometry(7.0, 0.45, 6.2),
        new THREE.MeshStandardMaterial({ color: trimColor, roughness: 0.3, metalness: 0.85 })
      );
      flatRoof.position.set(0, 5.75, -1.6);
      flatRoof.castShadow = true;
      houseGroup.add(flatRoof);
    }

    // Reactive House Window Material (Glows warmly at night!)
    const winMat = new THREE.MeshStandardMaterial({
      color: isPlayer ? '#f59e0b' : '#38bdf8',
      emissive: isPlayer ? '#d97706' : '#0284c7',
      emissiveIntensity: 0.7,
      roughness: 0.1,
    });
    reactiveLightMaterials.windows.push(winMat);

    const frontWindow = new THREE.Mesh(new THREE.BoxGeometry(3.4, 1.4, 0.15), winMat);
    frontWindow.position.set(0, 4.2, 1.25);
    houseGroup.add(frontWindow);

    const doorMat = new THREE.MeshStandardMaterial({
      color: isPlayer ? '#f59e0b' : '#334155',
      metalness: isPlayer ? 0.95 : 0.4,
      roughness: 0.2,
    });
    const frontDoor = new THREE.Mesh(new THREE.BoxGeometry(1.8, 2.6, 0.2), doorMat);
    frontDoor.position.set(0, 1.35, 1.25);
    houseGroup.add(frontDoor);

    const fenceMat = new THREE.MeshStandardMaterial({
      color: isPlayer ? '#f59e0b' : '#273449',
      metalness: isPlayer ? 0.7 : 0.3,
      roughness: 0.4,
    });
    const wallBaseMat = new THREE.MeshStandardMaterial({ color: '#162030', roughness: 0.7 });

    const backWall = new THREE.Mesh(new THREE.BoxGeometry(9.6, 1.4, 0.3), wallBaseMat);
    backWall.position.set(0, 0.7, -5.2);
    backWall.castShadow = true;
    houseGroup.add(backWall);

    const leftWall = new THREE.Mesh(new THREE.BoxGeometry(0.3, 1.4, 10.4), wallBaseMat);
    leftWall.position.set(-4.7, 0.7, 0);
    leftWall.castShadow = true;
    houseGroup.add(leftWall);

    const rightWall = new THREE.Mesh(new THREE.BoxGeometry(0.3, 1.4, 10.4), wallBaseMat);
    rightWall.position.set(4.7, 0.7, 0);
    rightWall.castShadow = true;
    houseGroup.add(rightWall);

    const frontFenceL = new THREE.Mesh(new THREE.BoxGeometry(3.5, 1.1, 0.2), fenceMat);
    frontFenceL.position.set(-3.0, 0.55, 5.2);
    frontFenceL.castShadow = true;
    houseGroup.add(frontFenceL);

    const frontFenceR = new THREE.Mesh(new THREE.BoxGeometry(3.5, 1.1, 0.2), fenceMat);
    frontFenceR.position.set(3.0, 0.55, 5.2);
    frontFenceR.castShadow = true;
    houseGroup.add(frontFenceR);

    const gatePillarL = new THREE.Mesh(new THREE.BoxGeometry(0.5, 1.6, 0.5), wallBaseMat);
    gatePillarL.position.set(-1.3, 0.8, 5.2);
    const gatePillarR = new THREE.Mesh(new THREE.BoxGeometry(0.5, 1.6, 0.5), wallBaseMat);
    gatePillarR.position.set(1.3, 0.8, 5.2);
    houseGroup.add(gatePillarL, gatePillarR);

    // Front Garden Bushes with wind sway
    const gardenBushL = new THREE.Mesh(
      new THREE.DodecahedronGeometry(0.65, 1),
      new THREE.MeshStandardMaterial({ color: '#166534', roughness: 0.8 })
    );
    gardenBushL.position.set(-2.5, 0.5, 3.2);
    gardenBushL.castShadow = true;
    windSwayMeshes.push(gardenBushL);

    const gardenBushR = new THREE.Mesh(
      new THREE.DodecahedronGeometry(0.65, 1),
      new THREE.MeshStandardMaterial({ color: '#15803d', roughness: 0.8 })
    );
    gardenBushR.position.set(2.5, 0.5, 3.2);
    gardenBushR.castShadow = true;
    windSwayMeshes.push(gardenBushR);
    houseGroup.add(gardenBushL, gardenBushR);

    // Personalized Nameplate Totem
    const nameplateTotemMat = new THREE.MeshStandardMaterial({
      color: isPlayer ? '#f59e0b' : '#0f172a',
      emissive: isPlayer ? '#b45309' : '#000000',
      emissiveIntensity: isPlayer ? 0.5 : 0,
      roughness: 0.3,
      metalness: 0.85,
    });
    if (isPlayer) reactiveLightMaterials.neons.push(nameplateTotemMat);

    const nameplateTotem = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.9, 0.15), nameplateTotemMat);
    nameplateTotem.position.set(-2.2, 0.65, 5.5);
    houseGroup.add(nameplateTotem);

    if (isPlayer) {
      const archHeader = new THREE.Mesh(
        new THREE.BoxGeometry(3.1, 0.3, 0.3),
        new THREE.MeshStandardMaterial({ color: '#f59e0b', roughness: 0.15, metalness: 0.95 })
      );
      archHeader.position.set(0, 2.2, 5.2);
      houseGroup.add(archHeader);

      const beaconMat = new THREE.MeshStandardMaterial({
        color: '#f59e0b',
        emissive: '#fbbf24',
        emissiveIntensity: 1.4,
      });
      reactiveLightMaterials.neons.push(beaconMat);

      const beacon = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.35, 0.6, 8), beaconMat);
      beacon.position.set(0, 3.2, 1.4);
      houseGroup.add(beacon);

      const triggerZ = p.faceSouth ? p.z - 3.5 : p.z + 3.5;
      zoneTriggers.push({
        id: 'zone_player_base',
        name: `Your Personal Base (Plot #${p.plotNumber})`,
        prompt: `YOUR BASE — Press E to Enter`,
        actionKey: 'base',
        x: p.x,
        z: triggerZ,
        radius: 3.6,
      });
    }

    scene.add(houseGroup);

    const houseCenterZ = p.faceSouth ? p.z + 1.6 : p.z - 1.6;
    colliders.push(createBoxCollider(`col_house_body_${p.plotNumber}`, p.x, houseCenterZ, 6.8, 6.0, `House #${p.plotNumber}`));
    colliders.push(createBoxCollider(`col_plot_left_${p.plotNumber}`, p.x - 4.7, p.z, 0.5, 10.6, `Plot #${p.plotNumber} Left Wall`));
    colliders.push(createBoxCollider(`col_plot_right_${p.plotNumber}`, p.x + 4.7, p.z, 0.5, 10.6, `Plot #${p.plotNumber} Right Wall`));
    const backZ = p.faceSouth ? p.z + 5.2 : p.z - 5.2;
    colliders.push(createBoxCollider(`col_plot_back_${p.plotNumber}`, p.x, backZ, 9.8, 0.5, `Plot #${p.plotNumber} Back Wall`));
    const frontZ = p.faceSouth ? p.z - 5.2 : p.z + 5.2;
    colliders.push(createBoxCollider(`col_plot_front_l_${p.plotNumber}`, p.x - 3.0, frontZ, 3.6, 0.5, `Plot #${p.plotNumber} Front Fence Left`));
    colliders.push(createBoxCollider(`col_plot_front_r_${p.plotNumber}`, p.x + 3.0, frontZ, 3.6, 0.5, `Plot #${p.plotNumber} Front Fence Right`));
  });

  // ==========================================
  // 9. PROCEDURAL TREES & WIND-SWAYING CANOPY
  // ==========================================
  const treePositions = [
    [-18, -16], [18, -16],
    [-20, 10], [20, 10],
    [-8, 20], [8, 20],
    [-46, 27], [46, 27],
    [-18, -2], [18, -2],
    [-8, -24], [8, -24],
    [-28, -20], [28, -20]
  ];

  treePositions.forEach(([tx, tz], tidx) => {
    const treeGroup = new THREE.Group();
    treeGroup.position.set(tx, 0, tz);

    const trunk = new THREE.Mesh(
      new THREE.CylinderGeometry(0.35, 0.5, 3.2, 8),
      new THREE.MeshStandardMaterial({ color: '#271b12', roughness: 0.9 })
    );
    trunk.position.y = 1.6;
    trunk.castShadow = true;
    treeGroup.add(trunk);

    const leafMat = new THREE.MeshStandardMaterial({
      color: tidx % 2 === 0 ? '#15803d' : '#166534',
      roughness: 0.75,
      metalness: 0.05,
    });

    const canopyGroup = new THREE.Group();
    canopyGroup.position.y = 3.6;

    const canopyMain = new THREE.Mesh(new THREE.DodecahedronGeometry(1.8, 1), leafMat);
    canopyMain.castShadow = true;

    const canopyTop = new THREE.Mesh(new THREE.DodecahedronGeometry(1.3, 1), leafMat);
    canopyTop.position.set(0.2, 1.2, 0.1);
    canopyTop.castShadow = true;

    const canopySide = new THREE.Mesh(new THREE.DodecahedronGeometry(1.2, 1), leafMat);
    canopySide.position.set(-0.6, 0.2, 0.5);
    canopySide.castShadow = true;

    canopyGroup.add(canopyMain, canopyTop, canopySide);
    treeGroup.add(canopyGroup);
    scene.add(treeGroup);

    windSwayMeshes.push(canopyGroup);
    colliders.push(createCircleCollider(`col_tree_${tidx}`, tx, tz, 0.5, 'Tree Trunk'));
  });

  // ==========================================
  // 10. REACTIVE STREETLIGHTS (Turn ON at night!)
  // ==========================================
  const lampPositions = [
    [-8, -12], [8, -12],
    [-8, 10], [8, 10],
    [-20, -5], [20, -5],
    [-20, 5], [20, 5],
    [-16, 26], [16, 26],
    [-32, 26], [32, 26]
  ];

  lampPositions.forEach(([lx, lz], idx) => {
    const lamp = new THREE.Group();
    lamp.position.set(lx, 0, lz);

    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.12, 4.0, 8), curbMat);
    post.position.y = 2.0;
    post.castShadow = true;
    lamp.add(post);

    const lampBulbMat = new THREE.MeshStandardMaterial({
      color: '#f59e0b',
      emissive: '#d97706',
      emissiveIntensity: 1.0,
      roughness: 0.2,
    });
    reactiveLightMaterials.streetlamps.push(lampBulbMat);

    const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.24, 12, 10), lampBulbMat);
    bulb.position.y = 4.0;
    lamp.add(bulb);

    scene.add(lamp);
    colliders.push(createCircleCollider(`col_lamp_${idx}`, lx, lz, 0.3, 'Street Lamp'));
  });

  // Park Benches
  const benchPositions = [
    { x: -9.5, z: -8, rot: Math.PI / 2 },
    { x: 9.5, z: -8, rot: -Math.PI / 2 },
    { x: -9.5, z: 8, rot: Math.PI / 2 },
    { x: 9.5, z: 8, rot: -Math.PI / 2 },
  ];

  benchPositions.forEach((bp, bidx) => {
    const bench = new THREE.Group();
    bench.position.set(bp.x, 0, bp.z);
    bench.rotation.y = bp.rot;

    const seat = new THREE.Mesh(
      new THREE.BoxGeometry(2.2, 0.12, 0.7),
      new THREE.MeshStandardMaterial({ color: '#451a03', roughness: 0.8 })
    );
    seat.position.y = 0.45;
    const back = new THREE.Mesh(
      new THREE.BoxGeometry(2.2, 0.5, 0.1),
      new THREE.MeshStandardMaterial({ color: '#451a03', roughness: 0.8 })
    );
    back.position.set(0, 0.75, -0.3);
    const legs = new THREE.Mesh(
      new THREE.BoxGeometry(2.0, 0.4, 0.6),
      new THREE.MeshStandardMaterial({ color: '#1e293b', roughness: 0.4, metalness: 0.8 })
    );
    legs.position.y = 0.2;

    bench.add(seat, back, legs);
    scene.add(bench);
    colliders.push(createBoxCollider(`col_bench_${bidx}`, bp.x, bp.z, 2.3, 1.0, 'Park Bench'));
  });

  // Street Directional Signboard
  const streetSign = new THREE.Group();
  streetSign.position.set(6.8, 0, 6.8);
  const signPole = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.1, 3.4, 8), curbMat);
  signPole.position.y = 1.7;
  const signPlaqueN = new THREE.Mesh(
    new THREE.BoxGeometry(1.6, 0.35, 0.08),
    new THREE.MeshStandardMaterial({ color: '#0f172a', emissive: '#38bdf8', emissiveIntensity: 0.4 })
  );
  signPlaqueN.position.set(0.6, 3.1, 0);
  const signPlaqueS = new THREE.Mesh(
    new THREE.BoxGeometry(1.6, 0.35, 0.08),
    new THREE.MeshStandardMaterial({ color: '#0f172a', emissive: '#f59e0b', emissiveIntensity: 0.4 })
  );
  signPlaqueS.position.set(-0.6, 2.7, 0);
  streetSign.add(signPole, signPlaqueN, signPlaqueS);
  scene.add(streetSign);
  colliders.push(createCircleCollider('col_street_sign', 6.8, 6.8, 0.35, 'Street Directional Sign'));

  // ==========================================
  // 11. MAP PERIMETER BOUNDARY WALLS
  // ==========================================
  const boundaryMat = new THREE.MeshStandardMaterial({
    color: '#080d16',
    roughness: 0.9,
    metalness: 0.2,
  });

  const boundWallN = new THREE.Mesh(new THREE.BoxGeometry(148, 5.0, 2.0), boundaryMat);
  boundWallN.position.set(0, 2.5, -72);
  const boundWallS = new THREE.Mesh(new THREE.BoxGeometry(148, 5.0, 2.0), boundaryMat);
  boundWallS.position.set(0, 2.5, 72);
  const boundWallW = new THREE.Mesh(new THREE.BoxGeometry(2.0, 5.0, 148), boundaryMat);
  boundWallW.position.set(-72, 2.5, 0);
  const boundWallE = new THREE.Mesh(new THREE.BoxGeometry(2.0, 5.0, 148), boundaryMat);
  boundWallE.position.set(72, 2.5, 0);

  scene.add(boundWallN, boundWallS, boundWallW, boundWallE);
  colliders.push(createBoxCollider('col_bound_n', 0, -72, 148, 2.0, 'North City Wall'));
  colliders.push(createBoxCollider('col_bound_s', 0, 72, 148, 2.0, 'South City Wall'));
  colliders.push(createBoxCollider('col_bound_w', -72, 0, 2.0, 148, 'West City Wall'));
  colliders.push(createBoxCollider('col_bound_e', 72, 0, 2.0, 148, 'East City Wall'));

  // Distant Skyline Towers
  const skylineGroup = new THREE.Group();
  for (let b = 0; b < 28; b++) {
    const angle = (b / 28) * Math.PI * 2;
    const dist = 76 + (b % 4) * 6;
    const height = 28 + ((b * 9) % 36);
    const width = 8 + (b % 3) * 4;

    const tower = new THREE.Mesh(
      new THREE.BoxGeometry(width, height, width),
      new THREE.MeshStandardMaterial({
        color: b % 2 === 0 ? '#0b1120' : '#090d16',
        roughness: 0.7,
        metalness: 0.5,
      })
    );
    tower.position.set(Math.cos(angle) * dist, height / 2, Math.sin(angle) * dist);
    skylineGroup.add(tower);
  }
  scene.add(skylineGroup);

  // ==========================================
  // 12. AMBIENT DRIFTING PARTICLES SYSTEM
  // ==========================================
  const particleCount = 280;
  const particleGeo = new THREE.BufferGeometry();
  const particlePositions = new Float32Array(particleCount * 3);

  for (let p = 0; p < particleCount; p++) {
    particlePositions[p * 3] = (Math.random() - 0.5) * 90;
    particlePositions[p * 3 + 1] = 0.5 + Math.random() * 6.5;
    particlePositions[p * 3 + 2] = (Math.random() - 0.5) * 90;
  }
  particleGeo.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));

  const particleMat = new THREE.PointsMaterial({
    color: '#f59e0b',
    size: 0.12,
    transparent: true,
    opacity: 0.65,
    blending: THREE.AdditiveBlending,
  });

  const ambientParticles = new THREE.Points(particleGeo, particleMat);
  scene.add(ambientParticles);

  return {
    zoneTriggers,
    animatedMeshes,
    colliders,
    playerHomeCoords,
    reactiveLightMaterials,
    windSwayMeshes,
    ambientParticles,
    waterMesh: water,
  };
}

/**
 * Builds the interior of the player's personal base loft:
 * - Room walls and floor
 * - Placed interactive furniture
 * - Base boundary colliders (outer walls and solid furniture)
 */
export function buildPersonalBase(
  scene: THREE.Scene,
  placedFurniture: PlacedFurniture[],
  inventoryItems: CollectibleItem[],
  tier: number = 1
): { interactiveObjects: THREE.Object3D[]; colliders: Collider[] } {
  const interactiveObjects: THREE.Object3D[] = [];
  const colliders: Collider[] = [];

  const roomWidth = 16 + tier * 3;
  const roomDepth = 16 + tier * 3;
  const roomHeight = 6.0;

  // Floor
  const floorCanvas = document.createElement('canvas');
  floorCanvas.width = 256;
  floorCanvas.height = 256;
  const fctx = floorCanvas.getContext('2d')!;
  fctx.fillStyle = '#0f172a';
  fctx.fillRect(0, 0, 256, 256);
  fctx.strokeStyle = '#1e293b';
  fctx.lineWidth = 3;
  fctx.strokeRect(0, 0, 128, 128);
  fctx.strokeRect(128, 0, 128, 128);
  fctx.strokeRect(0, 128, 128, 128);
  fctx.strokeRect(128, 128, 128, 128);

  const floorTex = new THREE.CanvasTexture(floorCanvas);
  floorTex.wrapS = THREE.RepeatWrapping;
  floorTex.wrapT = THREE.RepeatWrapping;
  floorTex.repeat.set(8, 8);
  floorTex.colorSpace = THREE.SRGBColorSpace;

  const floorMat = new THREE.MeshStandardMaterial({
    map: floorTex,
    roughness: 0.35,
    metalness: 0.4,
  });

  const floor = new THREE.Mesh(new THREE.PlaneGeometry(roomWidth, roomDepth), floorMat);
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  scene.add(floor);

  // Ceiling
  const ceilMat = new THREE.MeshStandardMaterial({ color: '#090d16', roughness: 0.9 });
  const ceiling = new THREE.Mesh(new THREE.PlaneGeometry(roomWidth, roomDepth), ceilMat);
  ceiling.rotation.x = Math.PI / 2;
  ceiling.position.y = roomHeight;
  scene.add(ceiling);

  // Back Wall
  const backWall = new THREE.Mesh(
    new THREE.BoxGeometry(roomWidth, roomHeight, 0.4),
    new THREE.MeshStandardMaterial({ color: '#1e293b', roughness: 0.8, metalness: 0.1 })
  );
  backWall.position.set(0, roomHeight / 2, -roomDepth / 2);
  backWall.receiveShadow = true;
  scene.add(backWall);

  // Left & Right Walls
  const sideWallMat = new THREE.MeshStandardMaterial({ color: '#111827', roughness: 0.8 });
  const leftWall = new THREE.Mesh(new THREE.BoxGeometry(0.4, roomHeight, roomDepth), sideWallMat);
  leftWall.position.set(-roomWidth / 2, roomHeight / 2, 0);
  scene.add(leftWall);

  const rightWall = new THREE.Mesh(new THREE.BoxGeometry(0.4, roomHeight, roomDepth), sideWallMat);
  rightWall.position.set(roomWidth / 2, roomHeight / 2, 0);
  scene.add(rightWall);

  // Front Panorama Floor-to-Ceiling Window
  const glassMat = new THREE.MeshPhysicalMaterial({
    color: '#38bdf8',
    transmission: 0.85,
    transparent: true,
    opacity: 0.25,
    roughness: 0.1,
  });
  const glassPane = new THREE.Mesh(new THREE.PlaneGeometry(roomWidth, roomHeight), glassMat);
  glassPane.position.set(0, roomHeight / 2, roomDepth / 2);
  glassPane.rotation.y = Math.PI;
  scene.add(glassPane);

  const frameMat = new THREE.MeshStandardMaterial({ color: '#0f172a', roughness: 0.4, metalness: 0.8 });
  const frameBottom = new THREE.Mesh(new THREE.BoxGeometry(roomWidth, 0.4, 0.4), frameMat);
  frameBottom.position.set(0, 0.2, roomDepth / 2);
  scene.add(frameBottom);

  colliders.push(createBoxCollider('col_base_back', 0, -roomDepth / 2, roomWidth, 0.8, 'Base Back Wall'));
  colliders.push(createBoxCollider('col_base_left', -roomWidth / 2, 0, 0.8, roomDepth, 'Base Left Wall'));
  colliders.push(createBoxCollider('col_base_right', roomWidth / 2, 0, 0.8, roomDepth, 'Base Right Wall'));
  colliders.push(createBoxCollider('col_base_front', 0, roomDepth / 2, roomWidth, 0.8, 'Base Front Window'));

  // City backdrop
  const cityGlowCanvas = document.createElement('canvas');
  cityGlowCanvas.width = 512;
  cityGlowCanvas.height = 256;
  const cgctx = cityGlowCanvas.getContext('2d')!;
  cgctx.fillStyle = '#05070e';
  cgctx.fillRect(0, 0, 512, 256);
  for (let i = 0; i < 24; i++) {
    const bx = i * 22;
    const bh = 60 + Math.random() * 150;
    const bw = 18;
    cgctx.fillStyle = '#0b1122';
    cgctx.fillRect(bx, 256 - bh, bw, bh);
    for (let wy = 256 - bh + 10; wy < 250; wy += 10) {
      if (Math.random() > 0.45) {
        cgctx.fillStyle = Math.random() > 0.5 ? '#f59e0b' : '#38bdf8';
        cgctx.fillRect(bx + 3, wy, 3, 3);
      }
    }
  }
  const cityTex = new THREE.CanvasTexture(cityGlowCanvas);
  cityTex.colorSpace = THREE.SRGBColorSpace;
  const cityBackdrop = new THREE.Mesh(
    new THREE.PlaneGeometry(roomWidth * 2.2, roomHeight * 2),
    new THREE.MeshBasicMaterial({ map: cityTex })
  );
  cityBackdrop.position.set(0, roomHeight / 2 + 1, roomDepth / 2 + 6);
  cityBackdrop.rotation.y = Math.PI;
  scene.add(cityBackdrop);

  // Placed Furniture
  placedFurniture.forEach((item, fidx) => {
    const fGroup = new THREE.Group();
    fGroup.position.set(item.x, 0, item.z);
    fGroup.rotation.y = item.rotation;

    if (item.type === 'sofa') {
      const sofaBase = new THREE.Mesh(
        new THREE.BoxGeometry(2.6, 0.4, 1.1),
        new THREE.MeshStandardMaterial({ color: '#1e293b', roughness: 0.8, metalness: 0.1 })
      );
      sofaBase.position.y = 0.2;
      sofaBase.castShadow = true;
      const sofaBack = new THREE.Mesh(
        new THREE.BoxGeometry(2.6, 0.65, 0.3),
        new THREE.MeshStandardMaterial({ color: '#0f172a', roughness: 0.85, metalness: 0.05 })
      );
      sofaBack.position.set(0, 0.65, -0.4);
      sofaBack.castShadow = true;
      fGroup.add(sofaBase, sofaBack);

      colliders.push(createBoxCollider(`col_furn_sofa_${fidx}`, item.x, item.z, 2.6, 1.2, 'Base Sofa'));
    } else if (item.type === 'pedestal') {
      const col = new THREE.Mesh(
        new THREE.CylinderGeometry(0.48, 0.58, 1.15, 16),
        new THREE.MeshStandardMaterial({ color: '#f8fafc', roughness: 0.25, metalness: 0.3 })
      );
      col.position.y = 0.575;
      col.castShadow = true;
      fGroup.add(col);

      const goldRing = new THREE.Mesh(
        new THREE.TorusGeometry(0.5, 0.04, 8, 16),
        new THREE.MeshStandardMaterial({ color: '#f59e0b', roughness: 0.15, metalness: 0.95 })
      );
      goldRing.position.y = 1.15;
      goldRing.rotation.x = Math.PI / 2;
      fGroup.add(goldRing);

      const displayed = inventoryItems.find((inv) => inv.id === item.displayedItemId);
      if (displayed) {
        const itemMesh = new THREE.Mesh(
          new THREE.OctahedronGeometry(0.28, 0),
          new THREE.MeshStandardMaterial({
            color: displayed.color,
            metalness: 0.9,
            roughness: 0.1,
            emissive: displayed.color,
            emissiveIntensity: 0.5,
          })
        );
        itemMesh.position.y = 1.55;
        fGroup.add(itemMesh);
      }

      colliders.push(createCircleCollider(`col_furn_ped_${fidx}`, item.x, item.z, 0.6, 'Base Relic Pedestal'));
    } else if (item.type === 'safe') {
      const safeBox = new THREE.Mesh(
        new THREE.BoxGeometry(1.1, 1.2, 0.95),
        new THREE.MeshStandardMaterial({ color: '#334155', roughness: 0.4, metalness: 0.85 })
      );
      safeBox.position.y = 0.6;
      safeBox.castShadow = true;
      const safeDial = new THREE.Mesh(
        new THREE.CylinderGeometry(0.2, 0.2, 0.1, 12),
        new THREE.MeshStandardMaterial({ color: '#f59e0b', roughness: 0.1, metalness: 0.95 })
      );
      safeDial.rotation.x = Math.PI / 2;
      safeDial.position.set(0.2, 0.6, 0.5);
      fGroup.add(safeBox, safeDial);

      colliders.push(createBoxCollider(`col_furn_safe_${fidx}`, item.x, item.z, 1.2, 1.0, 'Base Safe'));
    } else if (item.type === 'plant') {
      const pot = new THREE.Mesh(
        new THREE.CylinderGeometry(0.38, 0.28, 0.65, 12),
        new THREE.MeshStandardMaterial({ color: '#1e293b', roughness: 0.6 })
      );
      pot.position.y = 0.325;
      const foliage = new THREE.Mesh(
        new THREE.DodecahedronGeometry(0.55, 1),
        new THREE.MeshStandardMaterial({ color: '#10b981', roughness: 0.5, emissive: '#059669', emissiveIntensity: 0.3 })
      );
      foliage.position.y = 0.95;
      fGroup.add(pot, foliage);

      colliders.push(createCircleCollider(`col_furn_plant_${fidx}`, item.x, item.z, 0.45, 'Base Plant'));
    } else if (item.type === 'rug') {
      const rugMesh = new THREE.Mesh(
        new THREE.PlaneGeometry(3.6, 2.4),
        new THREE.MeshStandardMaterial({ color: '#0284c7', roughness: 0.9, metalness: 0.1 })
      );
      rugMesh.rotation.x = -Math.PI / 2;
      rugMesh.position.y = 0.02;
      fGroup.add(rugMesh);
    }

    interactiveObjects.push(fGroup);
    scene.add(fGroup);
  });

  return { interactiveObjects, colliders };
}
