/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as THREE from 'three';
import { CharacterAppearance } from '../types/game';

export interface CharacterRig {
  root: THREE.Group;
  leftLeg: THREE.Group;
  rightLeg: THREE.Group;
  leftArm: THREE.Group;
  rightArm: THREE.Group;
  torso: THREE.Group;
  head: THREE.Group;
  eyeDisplayGroup: THREE.Group;
  coreReactorGroup: THREE.Group;
  accessoryGroup: THREE.Group;
  outfitGroup: THREE.Group;
  updateAppearance: (app: CharacterAppearance) => void;
  animate: (speed: number, isMoving: boolean, time: number, emote?: string) => void;
}

export function createCharacterModel(appearance: CharacterAppearance): CharacterRig {
  const root = new THREE.Group();
  root.name = 'RobotCharacterRoot';

  // 1. Materials configuration based on robot specs
  const getChassisMaterialProps = (matType: string, color: string) => {
    switch (matType) {
      case 'white_ceramic':
        return { color: '#f8fafc', roughness: 0.25, metalness: 0.15 };
      case 'obsidian_gold':
        return { color: '#090d16', roughness: 0.35, metalness: 0.7 };
      case 'matte_stealth':
        return { color: color || '#1e293b', roughness: 0.85, metalness: 0.2 };
      case 'neon_circuit':
        return { color: '#0f172a', roughness: 0.4, metalness: 0.6 };
      case 'titanium_chrome':
      default:
        return { color: color || '#0f172a', roughness: 0.3, metalness: 0.85 };
    }
  };

  const chassisProps = getChassisMaterialProps(appearance.chassisMaterial, appearance.chassisColor);
  const chassisMat = new THREE.MeshStandardMaterial(chassisProps);

  const accentMat = new THREE.MeshStandardMaterial({
    color: appearance.accentColor || '#f59e0b',
    roughness: 0.25,
    metalness: 0.9,
  });

  const jointMat = new THREE.MeshStandardMaterial({
    color: '#334155',
    roughness: 0.45,
    metalness: 0.8,
  });

  const goldMat = new THREE.MeshStandardMaterial({
    color: '#f59e0b',
    roughness: 0.15,
    metalness: 0.95,
  });

  const eyeEmissiveMat = new THREE.MeshStandardMaterial({
    color: appearance.eyeColor || '#38bdf8',
    emissive: appearance.eyeColor || '#38bdf8',
    emissiveIntensity: 1.4,
    roughness: 0.1,
  });

  const coreEmissiveMat = new THREE.MeshStandardMaterial({
    color: appearance.coreColor || '#38bdf8',
    emissive: appearance.coreColor || '#38bdf8',
    emissiveIntensity: 1.3,
    roughness: 0.1,
  });

  const apparelMat = new THREE.MeshStandardMaterial({
    color: appearance.topColor || '#1e293b',
    roughness: 0.75,
    metalness: 0.15,
  });

  const footwearMat = new THREE.MeshStandardMaterial({
    color: appearance.footwearColor || '#f8fafc',
    roughness: 0.45,
    metalness: 0.3,
  });

  // ==========================================
  // 2. LEGS & PISTON JOINTS (Pivot at hip y = 0.82)
  // ==========================================
  const leftLeg = new THREE.Group();
  leftLeg.position.set(-0.22, 0.82, 0);

  const rightLeg = new THREE.Group();
  rightLeg.position.set(0.22, 0.82, 0);

  // Thigh & Shin Segmented Piston Rods
  const createLegAssembly = (isLeft: boolean) => {
    const legAssembly = new THREE.Group();

    // Hip Ball Joint
    const hipBall = new THREE.Mesh(new THREE.SphereGeometry(0.09, 12, 10), jointMat);
    legAssembly.add(hipBall);

    // Thigh Core Strut
    const thighStrut = new THREE.Mesh(new THREE.CylinderGeometry(0.065, 0.055, 0.34, 10), chassisMat);
    thighStrut.position.y = -0.17;
    thighStrut.castShadow = true;

    // Thigh Outer Armor Shell with Accent Stripe
    const thighArmor = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.26, 0.16), chassisMat);
    thighArmor.position.set(isLeft ? -0.02 : 0.02, -0.16, 0);
    thighArmor.castShadow = true;

    const thighStripe = new THREE.Mesh(new THREE.BoxGeometry(0.165, 0.06, 0.165), accentMat);
    thighStripe.position.set(isLeft ? -0.02 : 0.02, -0.16, 0);

    // Knee Piston Cylinder
    const kneeJoint = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.12, 12), jointMat);
    kneeJoint.rotation.z = Math.PI / 2;
    kneeJoint.position.y = -0.36;

    // Shin Strut
    const shinStrut = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.065, 0.34, 10), chassisMat);
    shinStrut.position.y = -0.53;
    shinStrut.castShadow = true;

    // Shin Front Armor Guard
    const shinGuard = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.28, 0.06), accentMat);
    shinGuard.position.set(0, -0.53, 0.08);
    shinGuard.castShadow = true;

    // Footwear Base
    const footGroup = new THREE.Group();
    footGroup.position.set(0, -0.72, 0.06);

    const fwStyle = appearance.footwearStyle || 'magnetic_boots';
    if (fwStyle === 'magnetic_boots') {
      // High-tech magnetic hover runner boots with glowing sole
      const bootBody = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.15, 0.34), footwearMat);
      bootBody.position.y = 0.07;
      bootBody.castShadow = true;

      const magSole = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.04, 0.36), coreEmissiveMat);
      magSole.position.y = -0.02;

      const ankleRing = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.06, 12), accentMat);
      ankleRing.position.y = 0.14;

      footGroup.add(bootBody, magSole, ankleRing);
    } else if (fwStyle === 'cyber_sneakers') {
      // Chunky streetwear robot sneakers
      const shoeUpper = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.16, 0.32), footwearMat);
      shoeUpper.position.y = 0.08;
      shoeUpper.castShadow = true;

      const rubberSole = new THREE.Mesh(
        new THREE.BoxGeometry(0.2, 0.06, 0.35),
        new THREE.MeshStandardMaterial({ color: '#f8fafc', roughness: 0.8 })
      );
      rubberSole.position.y = -0.02;

      const heelCap = new THREE.Mesh(new THREE.BoxGeometry(0.19, 0.12, 0.08), accentMat);
      heelCap.position.set(0, 0.08, -0.14);

      footGroup.add(shoeUpper, rubberSole, heelCap);
    } else {
      // Piston Strider Feet (Industrial mechanical clamps)
      const anklePivot = new THREE.Mesh(new THREE.SphereGeometry(0.08, 10, 8), jointMat);
      anklePivot.position.y = 0.06;

      const toePad = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.05, 0.22), chassisMat);
      toePad.position.set(0, 0, 0.1);

      const heelPad = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.05, 0.12), chassisMat);
      heelPad.position.set(0, 0, -0.1);

      footGroup.add(anklePivot, toePad, heelPad);
    }

    legAssembly.add(thighStrut, thighArmor, thighStripe, kneeJoint, shinStrut, shinGuard, footGroup);
    return legAssembly;
  };

  leftLeg.add(createLegAssembly(true));
  rightLeg.add(createLegAssembly(false));
  root.add(leftLeg, rightLeg);

  // ==========================================
  // 3. TORSO & CHEST ARC REACTOR (Pivot at waist y = 0.82)
  // ==========================================
  const torso = new THREE.Group();
  torso.position.y = 0.82;

  // Pelvis / Chassis Base
  const pelvis = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.14, 0.28), jointMat);
  pelvis.position.y = 0.05;
  pelvis.castShadow = true;
  torso.add(pelvis);

  // Torso Main Frame (Angular mechanical chassis)
  const torsoGeo = new THREE.BoxGeometry(0.52, 0.58, 0.34);
  const torsoMesh = new THREE.Mesh(torsoGeo, chassisMat);
  torsoMesh.position.y = 0.36;
  torsoMesh.castShadow = true;
  torso.add(torsoMesh);

  // Chest Armor Breastplate
  const chestPlate = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.32, 0.1), accentMat);
  chestPlate.position.set(0, 0.44, 0.18);
  chestPlate.castShadow = true;
  torso.add(chestPlate);

  // Central Glowing Core Reactor Group
  const coreReactorGroup = new THREE.Group();
  coreReactorGroup.position.set(0, 0.42, 0.24);

  function buildCoreReactor(coreType: string) {
    while (coreReactorGroup.children.length > 0) {
      coreReactorGroup.remove(coreReactorGroup.children[0]);
    }

    const housingRing = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.11, 0.04, 16), jointMat);
    housingRing.rotation.x = Math.PI / 2;
    coreReactorGroup.add(housingRing);

    if (coreType === 'hazard_tri') {
      // Inverted hazard triangle core
      const triGeo = new THREE.ConeGeometry(0.09, 0.04, 3);
      const triMesh = new THREE.Mesh(triGeo, coreEmissiveMat);
      triMesh.rotation.x = -Math.PI / 2;
      triMesh.rotation.z = Math.PI;
      coreReactorGroup.add(triMesh);
    } else if (coreType === 'flux_battery') {
      // Triple energy battery cells
      [-0.04, 0, 0.04].forEach((cx) => {
        const cell = new THREE.Mesh(new THREE.BoxGeometry(0.025, 0.08, 0.03), coreEmissiveMat);
        cell.position.x = cx;
        coreReactorGroup.add(cell);
      });
    } else if (coreType === 'golden_sigil') {
      // Golden vault sigil
      const sigil = new THREE.Mesh(new THREE.OctahedronGeometry(0.08, 0), goldMat);
      sigil.position.z = 0.02;
      coreReactorGroup.add(sigil);
    } else {
      // Arc Pulse (default)
      const coreBulb = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.075, 0.05, 16), coreEmissiveMat);
      coreBulb.rotation.x = Math.PI / 2;
      coreReactorGroup.add(coreBulb);
    }
  }

  buildCoreReactor(appearance.coreReactor || 'arc_pulse');
  torso.add(coreReactorGroup);

  // Streetwear Apparel Layer for Robot Torso
  const outfitGroup = new THREE.Group();

  function buildOutfitDetails(topStyle: string) {
    while (outfitGroup.children.length > 0) {
      outfitGroup.remove(outfitGroup.children[0]);
    }

    if (topStyle === 'hoodie') {
      // Streetwear robot hoodie with oversized hood draped on shoulders
      const hoodieBody = new THREE.Mesh(new THREE.BoxGeometry(0.56, 0.42, 0.38), apparelMat);
      hoodieBody.position.set(0, 0.32, 0);
      hoodieBody.castShadow = true;

      // Kangaroo pouch
      const pouch = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.16, 0.12), apparelMat);
      pouch.position.set(0, 0.22, 0.21);
      pouch.castShadow = true;

      // Draped back hood
      const hoodDrape = new THREE.Mesh(new THREE.SphereGeometry(0.24, 10, 8), apparelMat);
      hoodDrape.scale.set(1.15, 0.65, 0.85);
      hoodDrape.position.set(0, 0.62, -0.18);
      hoodDrape.castShadow = true;

      outfitGroup.add(hoodieBody, pouch, hoodDrape);
    } else if (topStyle === 'bomber_jacket') {
      // Tactical Syndicate Bomber Jacket with metallic gold zipper
      const jacketBody = new THREE.Mesh(new THREE.BoxGeometry(0.56, 0.46, 0.38), apparelMat);
      jacketBody.position.set(0, 0.34, 0);
      jacketBody.castShadow = true;

      const collar = new THREE.Mesh(new THREE.TorusGeometry(0.22, 0.045, 8, 16), accentMat);
      collar.rotation.x = Math.PI / 2;
      collar.position.set(0, 0.64, 0);

      const zipper = new THREE.Mesh(new THREE.BoxGeometry(0.025, 0.44, 0.03), goldMat);
      zipper.position.set(0, 0.34, 0.2);

      outfitGroup.add(jacketBody, collar, zipper);
    } else if (topStyle === 'tactical_vest') {
      // Armored ballistic ceramic vest with tactical pouches
      const vestBody = new THREE.Mesh(new THREE.BoxGeometry(0.54, 0.46, 0.36), apparelMat);
      vestBody.position.set(0, 0.35, 0);

      [-0.14, 0.14].forEach((px) => {
        const pouch = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.14, 0.08), accentMat);
        pouch.position.set(px, 0.26, 0.21);
        outfitGroup.add(pouch);
      });

      outfitGroup.add(vestBody);
    } else if (topStyle === 'cyber_blazer') {
      // High-society Syndicate blazer coat
      const blazerBody = new THREE.Mesh(new THREE.BoxGeometry(0.54, 0.52, 0.36), apparelMat);
      blazerBody.position.set(0, 0.33, 0);

      const lapel = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.45, 0.04), accentMat);
      lapel.rotation.z = -0.15;
      lapel.position.set(-0.1, 0.36, 0.2);

      outfitGroup.add(blazerBody, lapel);
    }
  }

  buildOutfitDetails(appearance.topStyle || 'bomber_jacket');
  torso.add(outfitGroup);

  // ==========================================
  // 4. ARTICULATED ROBOT ARMS (Pivot at shoulder y = 0.62)
  // ==========================================
  const leftArm = new THREE.Group();
  leftArm.position.set(-0.36, 0.62, 0);

  const rightArm = new THREE.Group();
  rightArm.position.set(0.36, 0.62, 0);

  const createArmAssembly = (isLeft: boolean) => {
    const armGroup = new THREE.Group();

    // Shoulder Ball Mount
    const shoulderBall = new THREE.Mesh(new THREE.SphereGeometry(0.095, 12, 10), jointMat);
    shoulderBall.position.set(0, 0, 0);

    // Shoulder Armor Pauldron
    const pauldron = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.15, 0.2), accentMat);
    pauldron.position.set(isLeft ? -0.03 : 0.03, 0.02, 0);
    pauldron.castShadow = true;

    // Upper Arm Piston Strut
    const upperArm = new THREE.Mesh(new THREE.CylinderGeometry(0.065, 0.055, 0.28, 10), chassisMat);
    upperArm.position.y = -0.16;
    upperArm.castShadow = true;

    // Elbow Pivot
    const elbowJoint = new THREE.Mesh(new THREE.CylinderGeometry(0.065, 0.065, 0.11, 10), jointMat);
    elbowJoint.rotation.x = Math.PI / 2;
    elbowJoint.position.y = -0.32;

    // Forearm Armor Shell
    const forearm = new THREE.Mesh(new THREE.BoxGeometry(0.13, 0.26, 0.13), chassisMat);
    forearm.position.y = -0.47;
    forearm.castShadow = true;

    const forearmStripe = new THREE.Mesh(new THREE.BoxGeometry(0.135, 0.05, 0.135), accentMat);
    forearmStripe.position.y = -0.47;

    // Mechanical 3-Finger Hand Clamp
    const handGroup = new THREE.Group();
    handGroup.position.set(0, -0.63, 0);

    const palm = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.07, 0.09), jointMat);
    const fingerA = new THREE.Mesh(new THREE.BoxGeometry(0.025, 0.08, 0.03), accentMat);
    fingerA.position.set(-0.03, -0.05, 0.02);
    const fingerB = new THREE.Mesh(new THREE.BoxGeometry(0.025, 0.08, 0.03), accentMat);
    fingerB.position.set(0.03, -0.05, 0.02);
    const thumb = new THREE.Mesh(new THREE.BoxGeometry(0.025, 0.07, 0.03), accentMat);
    thumb.position.set(isLeft ? 0.04 : -0.04, -0.04, -0.02);

    handGroup.add(palm, fingerA, fingerB, thumb);
    armGroup.add(shoulderBall, pauldron, upperArm, elbowJoint, forearm, forearmStripe, handGroup);
    return armGroup;
  };

  leftArm.add(createArmAssembly(true));
  rightArm.add(createArmAssembly(false));
  torso.add(leftArm, rightArm);

  // Neck Turret Ring
  const neckRing = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.14, 0.1, 14), jointMat);
  neckRing.position.y = 0.7;
  torso.add(neckRing);

  // ==========================================
  // 5. SIGNATURE MECHANICAL ROBOT HEAD
  // ==========================================
  const head = new THREE.Group();
  head.position.y = 0.82;

  const eyeDisplayGroup = new THREE.Group();
  const accessoryGroup = new THREE.Group();

  function buildRobotHead(chassisType: string, eyeType: string, accType: string) {
    // Clear head children except eyeDisplayGroup and accessoryGroup
    while (head.children.length > 0) {
      head.remove(head.children[0]);
    }
    while (eyeDisplayGroup.children.length > 0) {
      eyeDisplayGroup.remove(eyeDisplayGroup.children[0]);
    }
    while (accessoryGroup.children.length > 0) {
      accessoryGroup.remove(accessoryGroup.children[0]);
    }

    head.add(eyeDisplayGroup);
    head.add(accessoryGroup);

    if (chassisType === 'cyber_cube') {
      // Bold angular cube robot head with side heatsinks
      const cubeHead = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.44, 0.44), chassisMat);
      cubeHead.position.set(0, 0.18, 0);
      cubeHead.castShadow = true;

      // Side ventilation grills
      [-0.25, 0.25].forEach((gx) => {
        const grill = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.24, 0.24), jointMat);
        grill.position.set(gx, 0.18, 0);
        head.add(grill);
      });

      // Front Bevel Bezel
      const screenBezel = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.28, 0.04), jointMat);
      screenBezel.position.set(0, 0.18, 0.22);

      head.add(cubeHead, screenBezel);
    } else if (chassisType === 'retro_terminal') {
      // CRT-style retro monitor head
      const monitorBody = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.42, 0.46), chassisMat);
      monitorBody.position.set(0, 0.18, -0.03);
      monitorBody.castShadow = true;

      const screenBezel = new THREE.Mesh(new THREE.BoxGeometry(0.44, 0.32, 0.05), jointMat);
      screenBezel.position.set(0, 0.18, 0.2);

      // Top vacuum tube
      const tube = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.14, 8), accentMat);
      tube.position.set(-0.14, 0.44, -0.06);

      head.add(monitorBody, screenBezel, tube);
    } else if (chassisType === 'aero_helm') {
      // Aerodynamic swept stealth racing helmet
      const aeroGeo = new THREE.ConeGeometry(0.28, 0.52, 4);
      const aeroMesh = new THREE.Mesh(aeroGeo, chassisMat);
      aeroMesh.rotation.y = Math.PI / 4;
      aeroMesh.rotation.x = Math.PI / 2;
      aeroMesh.position.set(0, 0.18, -0.05);
      aeroMesh.castShadow = true;

      // Ear fins
      [-0.24, 0.24].forEach((fx) => {
        const fin = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.26, 0.16), accentMat);
        fin.position.set(fx, 0.24, -0.08);
        head.add(fin);
      });

      head.add(aeroMesh);
    } else if (chassisType === 'visor_unit') {
      // Industrial tactical robot head with brow visor
      const visorHead = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.42, 0.42), chassisMat);
      visorHead.position.set(0, 0.18, 0);
      visorHead.castShadow = true;

      const heavyBrow = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.1, 0.12), accentMat);
      heavyBrow.position.set(0, 0.32, 0.2);

      head.add(visorHead, heavyBrow);
    } else {
      // Capsule Dome (Default signature robot design)
      const domeGeo = new THREE.SphereGeometry(0.26, 18, 14);
      domeGeo.scale(1.0, 1.08, 1.0);
      const domeMesh = new THREE.Mesh(domeGeo, chassisMat);
      domeMesh.position.set(0, 0.18, 0);
      domeMesh.castShadow = true;

      // Ear audio node bolts
      [-0.26, 0.26].forEach((ex) => {
        const ear = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.04, 12), accentMat);
        ear.rotation.z = Math.PI / 2;
        ear.position.set(ex, 0.18, 0);
        head.add(ear);
      });

      head.add(domeMesh);
    }

    // ==========================================
    // DIGITAL FACE / EYE DISPLAY
    // ==========================================
    const faceZ = 0.225;
    if (eyeType === 'glow_visor') {
      // Wide continuous glowing visor bar
      const bar = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.08, 0.03), eyeEmissiveMat);
      bar.position.set(0, 0.18, faceZ);
      eyeDisplayGroup.add(bar);
    } else if (eyeType === 'pixel_smile') {
      // 8-bit digital pixel smiling face
      const eyeL = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.07, 0.03), eyeEmissiveMat);
      eyeL.position.set(-0.11, 0.21, faceZ);
      const eyeR = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.07, 0.03), eyeEmissiveMat);
      eyeR.position.set(0.11, 0.21, faceZ);
      const smile = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.035, 0.03), eyeEmissiveMat);
      smile.position.set(0, 0.12, faceZ);
      eyeDisplayGroup.add(eyeL, eyeR, smile);
    } else if (eyeType === 'stealth_slit') {
      // Narrow predatory slit eyes
      const slitL = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.035, 0.03), eyeEmissiveMat);
      slitL.rotation.z = 0.15;
      slitL.position.set(-0.11, 0.19, faceZ);
      const slitR = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.035, 0.03), eyeEmissiveMat);
      slitR.rotation.z = -0.15;
      slitR.position.set(0.11, 0.19, faceZ);
      eyeDisplayGroup.add(slitL, slitR);
    } else if (eyeType === 'matrix_dots') {
      // 3x2 Matrix sensor dots
      [-0.1, 0, 0.1].forEach((dx) => {
        [0.16, 0.22].forEach((dy) => {
          const dot = new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.035, 0.02), eyeEmissiveMat);
          dot.position.set(dx, dy, faceZ);
          eyeDisplayGroup.add(dot);
        });
      });
    } else {
      // Neon Reticles (Default)
      const reticleL = new THREE.Mesh(new THREE.RingGeometry(0.03, 0.065, 14), eyeEmissiveMat);
      reticleL.position.set(-0.11, 0.19, faceZ + 0.005);
      const pupilL = new THREE.Mesh(new THREE.CircleGeometry(0.02, 10), eyeEmissiveMat);
      pupilL.position.set(-0.11, 0.19, faceZ + 0.006);

      const reticleR = new THREE.Mesh(new THREE.RingGeometry(0.03, 0.065, 14), eyeEmissiveMat);
      reticleR.position.set(0.11, 0.19, faceZ + 0.005);
      const pupilR = new THREE.Mesh(new THREE.CircleGeometry(0.02, 10), eyeEmissiveMat);
      pupilR.position.set(0.11, 0.19, faceZ + 0.006);

      eyeDisplayGroup.add(reticleL, pupilL, reticleR, pupilR);
    }

    // ==========================================
    // ACCESSORIES & HEADGEAR
    // ==========================================
    if (accType === 'antenna_comms') {
      // Dual articulated communication antennas
      [-0.18, 0.18].forEach((ax) => {
        const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.02, 0.35, 8), accentMat);
        mast.position.set(ax, 0.54, 0);
        mast.rotation.z = ax > 0 ? -0.15 : 0.15;
        const tipBulb = new THREE.Mesh(new THREE.SphereGeometry(0.035, 8, 8), coreEmissiveMat);
        tipBulb.position.set(ax > 0 ? ax + 0.04 : ax - 0.04, 0.72, 0);
        accessoryGroup.add(mast, tipBulb);
      });
    } else if (accType === 'halo_ring') {
      // Floating golden holographic halo
      const halo = new THREE.Mesh(new THREE.TorusGeometry(0.24, 0.025, 8, 24), goldMat);
      halo.rotation.x = Math.PI / 2;
      halo.position.set(0, 0.54, 0);
      accessoryGroup.add(halo);
    } else if (accType === 'cyber_cap') {
      // Futuristic flat-brim robot cap
      const capDome = new THREE.Mesh(new THREE.SphereGeometry(0.27, 14, 8, 0, Math.PI * 2, 0, Math.PI * 0.5), apparelMat);
      capDome.position.set(0, 0.35, 0);
      const brim = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.025, 0.22), accentMat);
      brim.position.set(0, 0.34, 0.22);
      accessoryGroup.add(capDome, brim);
    } else if (accType === 'gold_chain') {
      // Heavy gold Cuban link chain
      const chain = new THREE.Mesh(new THREE.TorusGeometry(0.18, 0.03, 8, 20), goldMat);
      chain.rotation.x = Math.PI / 2 + 0.25;
      chain.position.set(0, -0.06, 0.08);
      accessoryGroup.add(chain);
    } else if (accType === 'tech_backpack') {
      // Thruster backpack with plasma exhaust ports
      const pack = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.44, 0.18), jointMat);
      pack.position.set(0, -0.42, -0.22);
      [-0.1, 0.1].forEach((tx) => {
        const noz = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.06, 0.1, 8), coreEmissiveMat);
        noz.position.set(tx, -0.66, -0.22);
        accessoryGroup.add(noz);
      });
      accessoryGroup.add(pack);
    }
  }

  buildRobotHead(
    appearance.headChassis || 'capsule_dome',
    appearance.eyeDisplay || 'neon_reticles',
    appearance.headAccessory || appearance.accessory || 'gold_chain'
  );

  torso.add(head);
  root.add(torso);

  // ==========================================
  // UPDATE APPEARANCE DYNAMICALLY
  // ==========================================
  const updateAppearance = (newApp: CharacterAppearance) => {
    // Update materials
    const updatedProps = getChassisMaterialProps(newApp.chassisMaterial, newApp.chassisColor);
    chassisMat.color.set(updatedProps.color);
    chassisMat.roughness = updatedProps.roughness;
    chassisMat.metalness = updatedProps.metalness;

    if (newApp.accentColor) accentMat.color.set(newApp.accentColor);
    if (newApp.eyeColor) {
      eyeEmissiveMat.color.set(newApp.eyeColor);
      eyeEmissiveMat.emissive.set(newApp.eyeColor);
    }
    if (newApp.coreColor) {
      coreEmissiveMat.color.set(newApp.coreColor);
      coreEmissiveMat.emissive.set(newApp.coreColor);
    }
    if (newApp.topColor) apparelMat.color.set(newApp.topColor);
    if (newApp.footwearColor) footwearMat.color.set(newApp.footwearColor);

    // Rebuild modular head, core, and outfit
    buildRobotHead(
      newApp.headChassis || 'capsule_dome',
      newApp.eyeDisplay || 'neon_reticles',
      newApp.headAccessory || newApp.accessory || 'gold_chain'
    );
    buildCoreReactor(newApp.coreReactor || 'arc_pulse');
    buildOutfitDetails(newApp.topStyle || 'bomber_jacket');
  };

  // ==========================================
  // MECHANICAL ROBOT ANIMATION SYSTEM
  // ==========================================
  const animate = (speed: number, isMoving: boolean, time: number, emote?: string) => {
    // 1. Idle micro-bobbing (mechanical breathing / hover bounce)
    const idleBob = Math.sin(time * 3.5) * 0.02;
    const corePulse = 1.2 + Math.sin(time * 5.0) * 0.3;
    coreEmissiveMat.emissiveIntensity = corePulse;

    if (!isMoving) {
      torso.position.y = 0.82 + idleBob;
      torso.rotation.x = THREE.MathUtils.damp(torso.rotation.x, 0, 8, 0.016);
      torso.rotation.y = THREE.MathUtils.damp(torso.rotation.y, 0, 8, 0.016);
      torso.rotation.z = THREE.MathUtils.damp(torso.rotation.z, 0, 8, 0.016);

      leftLeg.rotation.x = THREE.MathUtils.damp(leftLeg.rotation.x, 0, 10, 0.016);
      rightLeg.rotation.x = THREE.MathUtils.damp(rightLeg.rotation.x, 0, 10, 0.016);
      leftArm.rotation.x = THREE.MathUtils.damp(leftArm.rotation.x, 0.1, 10, 0.016);
      rightArm.rotation.x = THREE.MathUtils.damp(rightArm.rotation.x, 0.1, 10, 0.016);
      head.rotation.y = Math.sin(time * 1.2) * 0.08; // subtle mechanical scan

      // Emotes
      if (emote === 'dance') {
        const danceStep = Math.sin(time * 8.0);
        torso.rotation.z = danceStep * 0.18;
        torso.position.y = 0.82 + Math.abs(danceStep) * 0.08;
        leftArm.rotation.z = -0.6 + danceStep * 0.5;
        rightArm.rotation.z = 0.6 - danceStep * 0.5;
        head.rotation.y = danceStep * 0.3;
      } else if (emote === 'wave') {
        rightArm.rotation.x = Math.PI - 0.2;
        rightArm.rotation.z = 0.4 + Math.sin(time * 12.0) * 0.3;
      } else if (emote === 'victory') {
        leftArm.rotation.x = Math.PI * 0.9;
        rightArm.rotation.x = Math.PI * 0.9;
        torso.position.y = 0.82 + Math.sin(time * 6.0) * 0.05;
      }
      return;
    }

    // 2. Walking / Running mechanical locomotion
    const freq = speed * 9.5;
    const stride = Math.sin(time * freq);

    // Torso bob & forward lean
    torso.position.y = 0.82 + Math.abs(stride) * 0.04;
    torso.rotation.x = 0.08; // slight athletic forward lean
    torso.rotation.y = stride * 0.06;

    // Opposite leg & arm mechanical swings
    leftLeg.rotation.x = stride * 0.65;
    rightLeg.rotation.x = -stride * 0.65;

    leftArm.rotation.x = -stride * 0.55 + 0.1;
    rightArm.rotation.x = stride * 0.55 + 0.1;

    // Head stability
    head.rotation.y = -stride * 0.04;
  };

  return {
    root,
    leftLeg,
    rightLeg,
    leftArm,
    rightArm,
    torso,
    head,
    eyeDisplayGroup,
    coreReactorGroup,
    accessoryGroup,
    outfitGroup,
    updateAppearance,
    animate,
  };
}
