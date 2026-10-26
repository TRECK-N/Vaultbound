/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import {
  CharacterAppearance,
  RobotHeadChassis,
  RobotEyeDisplay,
  RobotFrameMaterial,
  RobotCoreReactor,
  RobotJacketStyle,
  RobotFootwear,
  RobotHeadAccessory,
} from '../types/game';
import { createCharacterModel, CharacterRig } from '../engine/characterModel';
import { soundManager } from '../audio/soundManager';

interface CharacterCreatorModalProps {
  currentAppearance: CharacterAppearance;
  playerNickname?: string;
  onSave: (app: CharacterAppearance, newNickname?: string) => void;
  onClose: () => void;
}

export const CharacterCreatorModal: React.FC<CharacterCreatorModalProps> = ({
  currentAppearance,
  playerNickname = 'Unit-7',
  onSave,
  onClose,
}) => {
  const [appearance, setAppearance] = useState<CharacterAppearance>({
    headChassis: currentAppearance.headChassis || 'capsule_dome',
    eyeDisplay: currentAppearance.eyeDisplay || 'neon_reticles',
    eyeColor: currentAppearance.eyeColor || '#38bdf8',
    chassisMaterial: currentAppearance.chassisMaterial || 'titanium_chrome',
    chassisColor: currentAppearance.chassisColor || '#1e293b',
    accentColor: currentAppearance.accentColor || '#f59e0b',
    coreReactor: currentAppearance.coreReactor || 'arc_pulse',
    coreColor: currentAppearance.coreColor || '#0ea5e9',
    topStyle: currentAppearance.topStyle || 'hoodie',
    topColor: currentAppearance.topColor || '#0284c7',
    footwearStyle: currentAppearance.footwearStyle || 'magnetic_boots',
    footwearColor: currentAppearance.footwearColor || '#0f172a',
    headAccessory: currentAppearance.headAccessory || 'none',
    accessoryColor: currentAppearance.accessoryColor || '#f59e0b',
  });
  const [nickname, setNickname] = useState(playerNickname);
  const [activeTab, setActiveTab] = useState<'chassis' | 'frame' | 'apparel' | 'accessories'>('chassis');

  const mountRef = useRef<HTMLDivElement>(null);
  const rigRef = useRef<CharacterRig | null>(null);

  // Turntable Studio
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || 360;
    const height = container.clientHeight || 500;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#0a0e17');

    const camera = new THREE.PerspectiveCamera(38, width / height, 0.1, 50);
    camera.position.set(0, 1.25, 3.6);
    camera.lookAt(0, 0.85, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;

    const pmrem = new THREE.PMREMGenerator(renderer);
    scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    pmrem.dispose();

    const key = new THREE.DirectionalLight('#fff7ed', 2.0);
    key.position.set(2, 3, 3);
    scene.add(key);

    const rim = new THREE.DirectionalLight('#38bdf8', 1.4);
    rim.position.set(-2, 2, -2);
    scene.add(rim);

    // Studio pedestal
    const pedestal = new THREE.Mesh(
      new THREE.CylinderGeometry(1.4, 1.5, 0.1, 24),
      new THREE.MeshStandardMaterial({ color: '#1e293b', roughness: 0.3, metalness: 0.7 })
    );
    pedestal.position.y = -0.05;
    scene.add(pedestal);

    const rig = createCharacterModel(appearance);
    scene.add(rig.root);
    rigRef.current = rig;

    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    let frameId = 0;
    let isDragging = false;
    let prevMouseX = 0;
    let rotY = 0;

    const onMouseDown = (e: MouseEvent) => {
      isDragging = true;
      prevMouseX = e.clientX;
    };
    const onMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      const dx = e.clientX - prevMouseX;
      prevMouseX = e.clientX;
      rotY += dx * 0.015;
      rig.root.rotation.y = rotY;
    };
    const onMouseUp = () => {
      isDragging = false;
    };

    container.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);

    const tick = () => {
      rig.animate(0, false, Date.now() * 0.002);
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
  }, []);

  useEffect(() => {
    if (rigRef.current) {
      rigRef.current.updateAppearance(appearance);
    }
  }, [appearance]);

  const handleSave = () => {
    soundManager.playCoin();
    onSave(appearance, nickname.trim());
    onClose();
  };

  const handleReset = () => {
    soundManager.playClick();
    setAppearance(currentAppearance);
    setNickname(playerNickname);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 animate-fade-in font-sans">
      <div className="bg-[#0a0e17] border border-[#38bdf8]/40 rounded-3xl w-full max-w-5xl h-[88vh] flex flex-col shadow-[0_0_60px_rgba(56,189,248,0.2)] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#1e293b] bg-[#0d1322]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#0284c7] to-[#38bdf8] flex items-center justify-center text-[#0a0e17] text-xl font-black shadow-md">
              🤖
            </div>
            <div>
              <h2 className="text-white font-bold text-lg tracking-wide flex items-center gap-2">
                <span>ROBOT CYBER CHASSIS STUDIO</span>
                <span className="text-[10px] font-mono uppercase bg-[#38bdf8]/20 text-[#38bdf8] px-2 py-0.5 rounded border border-[#38bdf8]/40 font-bold">
                  CUSTOM RIG
                </span>
              </h2>
              <p className="text-xs text-[#94a3b8] font-mono">
                Customize chassis optics, arc reactor core, titanium finishes & streetwear gear
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleReset}
              className="px-3 py-1.5 bg-[#121824] hover:bg-[#1e293b] text-[#94a3b8] hover:text-white rounded-xl text-xs font-mono font-bold transition-colors cursor-pointer"
            >
              RESET
            </button>
            <button
              onClick={() => {
                soundManager.playClick();
                onClose();
              }}
              className="w-8 h-8 rounded-xl bg-[#1e293b] hover:bg-[#334155] text-[#94a3b8] hover:text-white flex items-center justify-center transition-colors font-bold cursor-pointer"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 px-6 py-2.5 border-b border-[#1e293b] bg-[#0a0e17] overflow-x-auto">
          {[
            { id: 'chassis', label: '1. CHASSIS & OPTICS', icon: '🤖' },
            { id: 'frame', label: '2. FRAME & CORE REACTOR', icon: '⚡' },
            { id: 'apparel', label: '3. STREETWEAR & BOOTS', icon: '🧥' },
            { id: 'accessories', label: '4. ACCESSORIES & COMMS', icon: '📡' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                soundManager.playClick();
                setActiveTab(tab.id as any);
              }}
              className={`px-4 py-2 rounded-xl text-xs font-semibold font-mono whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === tab.id
                  ? 'bg-[#38bdf8] text-[#0a0e17] shadow-lg font-bold'
                  : 'text-[#94a3b8] hover:text-white hover:bg-[#1e293b]'
              }`}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
          {/* Left Turntable Preview */}
          <div className="w-full md:w-1/2 relative bg-[#070a12] border-r border-[#1e293b] flex items-center justify-center overflow-hidden">
            <div ref={mountRef} className="w-full h-full cursor-grab active:cursor-grabbing" />
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-[#0a0e17]/85 border border-[#1e293b] px-3.5 py-1 rounded-full text-[10px] font-mono text-[#94a3b8] flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#10b981] animate-pulse" />
              <span>Drag to orbit 360° · Real-time Mechanical Rig</span>
            </div>
          </div>

          {/* Right Customization Controls */}
          <div className="w-full md:w-1/2 p-6 overflow-y-auto space-y-6">
            {/* Identity Call-Sign */}
            <div className="bg-[#121824] border border-[#1e293b] p-3.5 rounded-2xl">
              <label className="text-xs font-mono text-[#94a3b8] block mb-1">
                ROBOT DESIGNATION CALL-SIGN:
              </label>
              <input
                type="text"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                maxLength={18}
                className="w-full bg-[#0a0e17] border border-[#1e293b] focus:border-[#38bdf8] px-3.5 py-2 rounded-xl text-white font-mono font-bold text-sm outline-none"
              />
            </div>

            {/* TAB 1: CHASSIS & OPTICS */}
            {activeTab === 'chassis' && (
              <div className="space-y-5">
                {/* Head Chassis Cut */}
                <div>
                  <label className="text-xs font-mono text-[#94a3b8] block mb-2">
                    HEAD CHASSIS GEOMETRY:
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { id: 'capsule_dome', name: 'Capsule Dome', desc: 'Aerodynamic curved crown' },
                      { id: 'cyber_cube', name: 'Cyber Cube', desc: 'Angular voxel chassis with side vents' },
                      { id: 'retro_terminal', name: 'Retro Terminal', desc: 'Classic CRT display console' },
                      { id: 'aero_helm', name: 'Aero Helm', desc: 'Aggressive race scout helm' },
                      { id: 'visor_unit', name: 'Visor Unit', desc: 'Wrap-around panoramic sensory brow' },
                    ].map((ch) => (
                      <button
                        key={ch.id}
                        onClick={() => {
                          soundManager.playClick();
                          setAppearance({ ...appearance, headChassis: ch.id as RobotHeadChassis });
                        }}
                        className={`p-3 rounded-xl text-xs font-mono border transition-all text-left cursor-pointer ${
                          appearance.headChassis === ch.id
                            ? 'bg-[#38bdf8] text-[#0a0e17] border-[#38bdf8] font-bold shadow-md'
                            : 'bg-[#121824] text-white border-[#1e293b] hover:border-[#38bdf8]/50'
                        }`}
                      >
                        <div className="font-bold text-xs">{ch.name}</div>
                        <div className={`text-[10px] mt-0.5 ${appearance.headChassis === ch.id ? 'text-[#0a0e17]/80' : 'text-[#64748b]'}`}>
                          {ch.desc}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Digital LED Eye Display */}
                <div>
                  <label className="text-xs font-mono text-[#94a3b8] block mb-2">
                    DIGITAL EYE DISPLAY MODE:
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { id: 'neon_reticles', name: 'Dual Targeting Reticles', glyph: '⊙ ⊙' },
                      { id: 'glow_visor', name: 'Holographic Solid Visor', glyph: '▬▬' },
                      { id: 'pixel_smile', name: 'Emotive Pixel Face', glyph: '^ _ ^' },
                      { id: 'stealth_slit', name: 'Tactical Recon Slit', glyph: '— —' },
                      { id: 'matrix_dots', name: 'Matrix Micro Dots', glyph: ':: ::' },
                    ].map((eye) => (
                      <button
                        key={eye.id}
                        onClick={() => {
                          soundManager.playClick();
                          setAppearance({ ...appearance, eyeDisplay: eye.id as RobotEyeDisplay });
                        }}
                        className={`p-2.5 rounded-xl text-xs font-mono border transition-all text-left flex items-center justify-between cursor-pointer ${
                          appearance.eyeDisplay === eye.id
                            ? 'bg-[#38bdf8] text-[#0a0e17] border-[#38bdf8] font-bold shadow-md'
                            : 'bg-[#121824] text-white border-[#1e293b] hover:border-[#38bdf8]/50'
                        }`}
                      >
                        <span>{eye.name}</span>
                        <span className="font-mono text-xs">{eye.glyph}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* LED Glow Color */}
                <div>
                  <label className="text-xs font-mono text-[#94a3b8] block mb-2">
                    OPTICS / LED EMISSION COLOR:
                  </label>
                  <div className="flex flex-wrap items-center gap-2">
                    {[
                      { hex: '#38bdf8', label: 'Cyan' },
                      { hex: '#10b981', label: 'Emerald' },
                      { hex: '#f59e0b', label: 'Amber' },
                      { hex: '#c084fc', label: 'Plasma' },
                      { hex: '#ef4444', label: 'Crimson' },
                      { hex: '#f8fafc', label: 'White' },
                    ].map((col) => (
                      <button
                        key={col.hex}
                        onClick={() => {
                          soundManager.playClick();
                          setAppearance({ ...appearance, eyeColor: col.hex });
                        }}
                        className={`w-9 h-9 rounded-xl border-2 transition-transform cursor-pointer ${
                          appearance.eyeColor === col.hex ? 'border-white scale-110 shadow-lg' : 'border-transparent'
                        }`}
                        style={{ backgroundColor: col.hex }}
                        title={col.label}
                      />
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: FRAME & CORE REACTOR */}
            {activeTab === 'frame' && (
              <div className="space-y-5">
                {/* Frame Material */}
                <div>
                  <label className="text-xs font-mono text-[#94a3b8] block mb-2">
                    ROBOT FRAME FINISH & MATERIAL:
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { id: 'titanium_chrome', name: 'Titanium Chrome', desc: 'Reflective polished alloy' },
                      { id: 'matte_stealth', name: 'Matte Stealth', desc: 'Anti-radar dark polymer' },
                      { id: 'white_ceramic', name: 'White Ceramic', desc: 'Pristine lab-grade composite' },
                      { id: 'obsidian_gold', name: 'Obsidian & Gold', desc: 'High-society gilded chassis' },
                      { id: 'neon_circuit', name: 'Neon Circuit', desc: 'Hyper-responsive PCB finish' },
                    ].map((mat) => (
                      <button
                        key={mat.id}
                        onClick={() => {
                          soundManager.playClick();
                          setAppearance({ ...appearance, chassisMaterial: mat.id as RobotFrameMaterial });
                        }}
                        className={`p-3 rounded-xl text-xs font-mono border transition-all text-left cursor-pointer ${
                          appearance.chassisMaterial === mat.id
                            ? 'bg-[#38bdf8] text-[#0a0e17] border-[#38bdf8] font-bold shadow-md'
                            : 'bg-[#121824] text-white border-[#1e293b] hover:border-[#38bdf8]/50'
                        }`}
                      >
                        <div className="font-bold">{mat.name}</div>
                        <div className={`text-[10px] mt-0.5 ${appearance.chassisMaterial === mat.id ? 'text-[#0a0e17]/80' : 'text-[#64748b]'}`}>
                          {mat.desc}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Chassis Primary Hue */}
                <div>
                  <label className="text-xs font-mono text-[#94a3b8] block mb-2">
                    CHASSIS ARMOR BASE HUE:
                  </label>
                  <div className="flex flex-wrap items-center gap-2">
                    {['#1e293b', '#0f172a', '#334155', '#0284c7', '#7c3aed', '#b45309', '#065f46'].map((col) => (
                      <button
                        key={col}
                        onClick={() => {
                          soundManager.playClick();
                          setAppearance({ ...appearance, chassisColor: col });
                        }}
                        className={`w-9 h-9 rounded-xl border-2 transition-transform cursor-pointer ${
                          appearance.chassisColor === col ? 'border-[#38bdf8] scale-110 shadow-lg' : 'border-transparent'
                        }`}
                        style={{ backgroundColor: col }}
                      />
                    ))}
                  </div>
                </div>

                {/* Chest Arc Reactor Type */}
                <div className="pt-2 border-t border-[#1e293b]">
                  <label className="text-xs font-mono text-[#94a3b8] block mb-2">
                    CHEST ARC REACTOR PATTERN:
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { id: 'arc_pulse', name: 'Arc Pulse Ring', desc: 'Concentric high-energy loop' },
                      { id: 'hazard_tri', name: 'Hazard Tri-Core', desc: 'Overcharged triple emitters' },
                      { id: 'flux_battery', name: 'Flux Battery Cell', desc: 'Vertical ion energy columns' },
                      { id: 'golden_sigil', name: 'Golden Vault Sigil', desc: 'Ornamental crest of the founders' },
                    ].map((core) => (
                      <button
                        key={core.id}
                        onClick={() => {
                          soundManager.playClick();
                          setAppearance({ ...appearance, coreReactor: core.id as RobotCoreReactor });
                        }}
                        className={`p-2.5 rounded-xl text-xs font-mono border transition-all text-left cursor-pointer ${
                          appearance.coreReactor === core.id
                            ? 'bg-[#38bdf8] text-[#0a0e17] border-[#38bdf8] font-bold shadow-md'
                            : 'bg-[#121824] text-white border-[#1e293b] hover:border-[#38bdf8]/50'
                        }`}
                      >
                        <div className="font-bold">{core.name}</div>
                        <div className={`text-[10px] ${appearance.coreReactor === core.id ? 'text-[#0a0e17]/80' : 'text-[#64748b]'}`}>
                          {core.desc}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Reactor Glow Color */}
                <div>
                  <label className="text-xs font-mono text-[#94a3b8] block mb-2">
                    REACTOR CORE ENERGY GLOW:
                  </label>
                  <div className="flex flex-wrap items-center gap-2">
                    {['#0ea5e9', '#f59e0b', '#10b981', '#a855f7', '#ef4444', '#fbbf24'].map((col) => (
                      <button
                        key={col}
                        onClick={() => {
                          soundManager.playClick();
                          setAppearance({ ...appearance, coreColor: col });
                        }}
                        className={`w-8 h-8 rounded-xl border-2 transition-transform cursor-pointer ${
                          appearance.coreColor === col ? 'border-white scale-110 shadow-lg' : 'border-transparent'
                        }`}
                        style={{ backgroundColor: col }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: STREETWEAR & FOOTWEAR */}
            {activeTab === 'apparel' && (
              <div className="space-y-5">
                {/* Jacket Style */}
                <div>
                  <label className="text-xs font-mono text-[#94a3b8] block mb-2">
                    STREETWEAR APPAREL / JACKET:
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { id: 'hoodie', name: 'Streetwear Hoodie' },
                      { id: 'bomber_jacket', name: 'Aviator Flight Bomber' },
                      { id: 'tactical_vest', name: 'Tactical Plate Carrier' },
                      { id: 'cyber_blazer', name: 'Asymmetric Neo Blazer' },
                      { id: 'none', name: 'Bare Mechanical Frame' },
                    ].map((j) => (
                      <button
                        key={j.id}
                        onClick={() => {
                          soundManager.playClick();
                          setAppearance({
                            ...appearance,
                            topStyle: j.id as RobotJacketStyle,
                          });
                        }}
                        className={`p-2.5 rounded-xl text-xs font-mono font-bold border transition-all text-left cursor-pointer ${
                          appearance.topStyle === j.id
                            ? 'bg-[#38bdf8] text-[#0a0e17] border-[#38bdf8] shadow-md'
                            : 'bg-[#121824] text-white border-[#1e293b] hover:border-[#38bdf8]/50'
                        }`}
                      >
                        {j.name}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Jacket Color */}
                <div>
                  <label className="text-xs font-mono text-[#94a3b8] block mb-2">
                    JACKET COLORWAY:
                  </label>
                  <div className="flex flex-wrap items-center gap-2">
                    {['#0284c7', '#0f172a', '#d97706', '#7c3aed', '#15803d', '#b91c1c', '#475569'].map((col) => (
                      <button
                        key={col}
                        onClick={() => {
                          soundManager.playClick();
                          setAppearance({ ...appearance, topColor: col });
                        }}
                        className={`w-8 h-8 rounded-xl border-2 transition-transform cursor-pointer ${
                          appearance.topColor === col ? 'border-[#38bdf8] scale-110 shadow-lg' : 'border-transparent'
                        }`}
                        style={{ backgroundColor: col }}
                      />
                    ))}
                  </div>
                </div>

                {/* Footwear Type */}
                <div className="pt-2 border-t border-[#1e293b]">
                  <label className="text-xs font-mono text-[#94a3b8] block mb-2">
                    MECHANICAL FOOTWEAR & STRIDERS:
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: 'magnetic_boots', name: 'Mag-Boots' },
                      { id: 'cyber_sneakers', name: 'Cyber Sneakers' },
                      { id: 'piston_striders', name: 'Piston Striders' },
                    ].map((boot) => (
                      <button
                        key={boot.id}
                        onClick={() => {
                          soundManager.playClick();
                          setAppearance({ ...appearance, footwearStyle: boot.id as RobotFootwear });
                        }}
                        className={`p-2.5 rounded-xl text-xs font-mono font-bold border transition-all text-center cursor-pointer ${
                          appearance.footwearStyle === boot.id
                            ? 'bg-[#38bdf8] text-[#0a0e17] border-[#38bdf8] shadow-md'
                            : 'bg-[#121824] text-white border-[#1e293b] hover:border-[#38bdf8]/50'
                        }`}
                      >
                        {boot.name}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Footwear Color */}
                <div>
                  <label className="text-xs font-mono text-[#94a3b8] block mb-2">
                    FOOTWEAR ACCENT COLOR:
                  </label>
                  <div className="flex flex-wrap items-center gap-2">
                    {['#0f172a', '#1e293b', '#0284c7', '#d97706', '#e2e8f0', '#7c3aed'].map((col) => (
                      <button
                        key={col}
                        onClick={() => {
                          soundManager.playClick();
                          setAppearance({ ...appearance, footwearColor: col });
                        }}
                        className={`w-8 h-8 rounded-xl border-2 transition-transform cursor-pointer ${
                          appearance.footwearColor === col ? 'border-[#38bdf8] scale-110 shadow-lg' : 'border-transparent'
                        }`}
                        style={{ backgroundColor: col }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 4: ACCESSORIES & COMMS */}
            {activeTab === 'accessories' && (
              <div className="space-y-5">
                <label className="text-xs font-mono text-[#94a3b8] block mb-2">
                  TACTICAL HEAD & BODY HARDWARE:
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'none', name: 'None (Clean Frame)', desc: 'Standard aerodynamic profile' },
                    { id: 'antenna_comms', name: 'Tactical Antenna Comms', desc: 'Twin radio frequency telemetry masts' },
                    { id: 'halo_ring', name: 'Holo Halo Ring', desc: 'Levitating golden ionic crown' },
                    { id: 'cyber_cap', name: 'Syndicate Operative Cap', desc: 'Forward-facing embroidered hat' },
                    { id: 'gold_chain', name: 'Heavy Gilded Cuban Link', desc: 'Pure 24k syndicate neck collar' },
                    { id: 'tech_backpack', name: 'Tactical Cyber Backpack', desc: 'Dual booster thruster backpack' },
                  ].map((acc) => (
                    <button
                      key={acc.id}
                      onClick={() => {
                        soundManager.playClick();
                        setAppearance({ ...appearance, headAccessory: acc.id as RobotHeadAccessory });
                      }}
                      className={`p-3 rounded-xl text-xs font-mono border transition-all text-left cursor-pointer ${
                        appearance.headAccessory === acc.id
                          ? 'bg-[#38bdf8] text-[#0a0e17] border-[#38bdf8] font-bold shadow-md'
                          : 'bg-[#121824] text-white border-[#1e293b] hover:border-[#38bdf8]/50'
                      }`}
                    >
                      <div className="font-bold">{acc.name}</div>
                      <div className={`text-[10px] mt-0.5 ${appearance.headAccessory === acc.id ? 'text-[#0a0e17]/80' : 'text-[#64748b]'}`}>
                        {acc.desc}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Save & Deploy Button */}
            <div className="pt-4 border-t border-[#1e293b]">
              <button
                onClick={handleSave}
                className="w-full py-4 rounded-xl bg-gradient-to-r from-[#0284c7] via-[#0ea5e9] to-[#38bdf8] hover:opacity-95 text-[#0a0e17] font-black text-sm tracking-widest uppercase font-mono shadow-[0_0_25px_rgba(56,189,248,0.3)] transition-all cursor-pointer"
              >
                DEPLOY ROBOT CHASSIS & SAVE PROFILE
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
