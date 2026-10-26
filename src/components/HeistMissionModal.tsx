/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { soundManager } from '../audio/soundManager';

interface HeistMissionModalProps {
  onSuccess: (coins: number, tokens: number, xp: number) => void;
  onClose: () => void;
}

export const HeistMissionModal: React.FC<HeistMissionModalProps> = ({ onSuccess, onClose }) => {
  const [missionState, setMissionState] = useState<'briefing' | 'infiltrating' | 'cracking' | 'extracting' | 'success' | 'busted'>('briefing');
  const [timeLeft, setTimeLeft] = useState(40);
  const [playerPos, setPlayerPos] = useState({ x: 0, y: 4 }); // 5x5 grid (0..4)
  const [cameraAngle, setCameraAngle] = useState(0); // rotates every second
  const [lootGrabbed, setLootGrabbed] = useState(false);
  const [lockCode, setLockCode] = useState(['', '', '']);
  const [targetCode] = useState([
    Math.floor(Math.random() * 9 + 1),
    Math.floor(Math.random() * 9 + 1),
    Math.floor(Math.random() * 9 + 1),
  ]);
  const [lockError, setLockError] = useState<string | null>(null);

  // Timer loop
  useEffect(() => {
    if (missionState !== 'infiltrating' && missionState !== 'cracking' && missionState !== 'extracting') return;
    const timer = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          soundManager.playAlarm();
          setMissionState('busted');
          return 0;
        }
        return t - 1;
      });
      setCameraAngle((a) => (a + 1) % 4);
    }, 1000);
    return () => clearInterval(timer);
  }, [missionState]);

  // Movement in stealth grid (5x5)
  const movePlayer = (dx: number, dy: number) => {
    if (missionState !== 'infiltrating' && missionState !== 'extracting') return;
    const nx = Math.max(0, Math.min(4, playerPos.x + dx));
    const ny = Math.max(0, Math.min(4, playerPos.y + dy));
    setPlayerPos({ x: nx, y: ny });
    soundManager.playFootstep();

    // Check camera laser detection (cell (2,2) and camera direction)
    const isUnderCamera = (cameraAngle === 0 && nx === 2 && ny <= 2) ||
                          (cameraAngle === 1 && ny === 2 && nx >= 2) ||
                          (cameraAngle === 2 && nx === 2 && ny >= 2) ||
                          (cameraAngle === 3 && ny === 2 && nx <= 2);

    if (isUnderCamera) {
      soundManager.playAlarm();
      setMissionState('busted');
      return;
    }

    // Vault Safe at (4, 0)
    if (nx === 4 && ny === 0 && !lootGrabbed) {
      soundManager.playClick();
      setMissionState('cracking');
    }

    // Extraction Point at (0, 4) with loot
    if (nx === 0 && ny === 4 && lootGrabbed) {
      soundManager.playVictory();
      setMissionState('success');
      onSuccess(850, 60, 350);
    }
  };

  const submitLockAttempt = () => {
    const num0 = parseInt(lockCode[0]);
    const num1 = parseInt(lockCode[1]);
    const num2 = parseInt(lockCode[2]);

    if (num0 === targetCode[0] && num1 === targetCode[1] && num2 === targetCode[2]) {
      soundManager.playCoin();
      setLootGrabbed(true);
      setLockError(null);
      setMissionState('extracting');
    } else {
      soundManager.playAlarm();
      setLockError(`Access Denied! Hint: Sum is ${targetCode[0] + targetCode[1] + targetCode[2]}. Digits 1-9.`);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 animate-fade-in font-sans">
      <div className="bg-[#0a0e17] border border-[#ef4444]/50 rounded-3xl w-full max-w-4xl h-[85vh] flex flex-col shadow-[0_0_60px_rgba(239,68,68,0.2)] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#1e293b] bg-[#12080a]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#dc2626] to-[#f87171] flex items-center justify-center text-white text-xl font-black shadow-md">
              🚨
            </div>
            <div>
              <h2 className="text-white font-bold text-lg tracking-wide flex items-center gap-2">
                <span>SUB-VAULT INFILTRATION</span>
                <span className="text-[10px] font-mono uppercase bg-[#ef4444]/20 text-[#f87171] px-2 py-0.5 rounded border border-[#ef4444]/40 font-bold">
                  HIGH SECURITY
                </span>
              </h2>
              <p className="text-xs text-[#94a3b8] font-mono">
                Bypass sweeping laser sensors · Crack biometric lock · Extract without alarm
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="bg-[#121824] border border-[#1e293b] px-3.5 py-1.5 rounded-xl font-mono text-xs">
              <span className="text-[#94a3b8]">COUNTDOWN: </span>
              <span className={`font-bold tabular-nums ${timeLeft < 15 ? 'text-[#ef4444] animate-pulse' : 'text-white'}`}>
                {timeLeft}s
              </span>
            </div>
            <button
              onClick={() => {
                soundManager.playClick();
                onClose();
              }}
              className="w-8 h-8 rounded-xl bg-[#1e293b] hover:bg-[#334155] text-[#94a3b8] hover:text-white flex items-center justify-center transition-colors font-bold"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 flex flex-col justify-between p-6 overflow-y-auto">
          {missionState === 'briefing' ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center max-w-xl mx-auto space-y-5">
              <div className="text-5xl">🗝️</div>
              <h3 className="text-white font-black text-2xl">Syndicate Black-Site Vault</h3>
              <p className="text-xs text-[#94a3b8] font-mono leading-relaxed">
                A fortified storage depot containing unlisted rare artifacts and heavy coin reserves. Navigate past the rotating security camera in the center, crack the terminal passcode at the vault, and sprint back to the extraction zone.
              </p>

              <div className="bg-[#121824] p-4 rounded-2xl border border-[#1e293b] text-left text-xs font-mono space-y-2 w-full">
                <div className="text-[#f59e0b] font-bold">OPERATIVE DIRECTIVES:</div>
                <div className="text-[#94a3b8]">1. Use directional buttons (or WASD / Arrow keys) to step across the grid.</div>
                <div className="text-[#94a3b8]">2. Do not step into the red laser sweep when the central scanner rotates towards you!</div>
                <div className="text-[#94a3b8]">3. Reach the top-right Vault Safe to initiate the lock-picking bypass.</div>
              </div>

              <button
                onClick={() => {
                  soundManager.playClick();
                  setMissionState('infiltrating');
                }}
                className="w-full py-4 rounded-xl bg-gradient-to-r from-[#dc2626] to-[#ef4444] hover:opacity-95 text-white font-black text-sm tracking-wider uppercase font-mono shadow-xl transition-all"
              >
                BREACH VAULT PERIMETER
              </button>
            </div>
          ) : missionState === 'success' ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center max-w-xl mx-auto space-y-5">
              <div className="text-6xl">💎</div>
              <h3 className="text-white font-black text-2xl text-[#10b981]">HEIST COMPLETED · CLEAN EXTRACTION!</h3>
              <p className="text-xs text-[#94a3b8] font-mono">
                You bypassed security protocols and evacuated the classified loot crate with seconds to spare.
              </p>

              <div className="grid grid-cols-3 gap-3 w-full font-mono text-xs">
                <div className="bg-[#121824] p-3 rounded-xl border border-[#1e293b]">
                  <span className="text-[#64748b] block text-[10px]">LOOTED COINS</span>
                  <span className="text-[#f59e0b] font-bold">+850 VC</span>
                </div>
                <div className="bg-[#121824] p-3 rounded-xl border border-[#1e293b]">
                  <span className="text-[#64748b] block text-[10px]">EVENT TOKENS</span>
                  <span className="text-[#c084fc] font-bold">+60 ET</span>
                </div>
                <div className="bg-[#121824] p-3 rounded-xl border border-[#1e293b]">
                  <span className="text-[#64748b] block text-[10px]">BATTLE PASS XP</span>
                  <span className="text-[#38bdf8] font-bold">+350 XP</span>
                </div>
              </div>

              <button
                onClick={() => {
                  soundManager.playClick();
                  onClose();
                }}
                className="w-full py-3.5 rounded-xl bg-[#10b981] hover:bg-[#059669] text-[#0a0e17] font-bold text-sm transition-all font-mono"
              >
                RETURN TO CITY WITH SPOILS
              </button>
            </div>
          ) : missionState === 'busted' ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center max-w-xl mx-auto space-y-5">
              <div className="text-6xl">🚨</div>
              <h3 className="text-white font-black text-2xl text-[#ef4444]">SECURITY LOCKDOWN TRIGGERED!</h3>
              <p className="text-xs text-[#94a3b8] font-mono">
                A laser scanner intercepted your signature or timer expired. Sub-vault gates sealed.
              </p>

              <button
                onClick={() => {
                  soundManager.playClick();
                  setTimeLeft(40);
                  setPlayerPos({ x: 0, y: 4 });
                  setLootGrabbed(false);
                  setMissionState('infiltrating');
                }}
                className="w-full py-3.5 rounded-xl bg-[#ef4444] hover:bg-[#dc2626] text-white font-bold text-sm transition-all font-mono"
              >
                RE-ATTEMPT INFILTRATION
              </button>
            </div>
          ) : missionState === 'cracking' ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center max-w-md mx-auto space-y-5">
              <div className="text-4xl">🔐</div>
              <h3 className="text-white font-bold text-xl">Biometric Keypad Bypass</h3>
              <p className="text-xs text-[#94a3b8] font-mono">
                Enter the 3-digit decryption sequence. Hint: The sum of digits is {targetCode[0] + targetCode[1] + targetCode[2]}.
              </p>

              {lockError && (
                <div className="text-xs text-[#ef4444] bg-[#ef4444]/15 border border-[#ef4444]/40 p-2.5 rounded-xl font-mono">
                  {lockError}
                </div>
              )}

              <div className="flex justify-center gap-3">
                {[0, 1, 2].map((idx) => (
                  <input
                    key={idx}
                    type="number"
                    maxLength={1}
                    value={lockCode[idx]}
                    onChange={(e) => {
                      const updated = [...lockCode];
                      updated[idx] = e.target.value.slice(-1);
                      setLockCode(updated);
                    }}
                    className="w-14 h-16 bg-[#121824] border-2 border-[#1e293b] focus:border-[#f59e0b] rounded-2xl text-center text-2xl font-bold font-mono text-white outline-none"
                  />
                ))}
              </div>

              <div className="flex items-center gap-3 w-full">
                <button
                  onClick={() => {
                    // Reveal one digit as aid
                    setLockCode([targetCode[0].toString(), targetCode[1].toString(), '']);
                  }}
                  className="px-4 py-3 bg-[#1e293b] hover:bg-[#334155] text-xs font-mono text-[#38bdf8] rounded-xl font-bold"
                >
                  Hack Clue
                </button>
                <button
                  onClick={submitLockAttempt}
                  className="flex-1 py-3 bg-[#f59e0b] hover:bg-[#d97706] text-[#0a0e17] font-black text-sm rounded-xl font-mono shadow-md"
                >
                  CONFIRM KEYCODE
                </button>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-between">
              {/* Status Header */}
              <div className="text-xs font-mono text-[#94a3b8] flex items-center justify-between w-full mb-3">
                <span>
                  MISSION OBJECTIVE:{' '}
                  <b className="text-white">{lootGrabbed ? 'SPRINT TO EXTRACTION (GREEN SQUARE)' : 'REACH VAULT SAFE (GOLD)'}</b>
                </span>
                <span className="text-[#38bdf8]">
                  SCANNER ANGLE: {cameraAngle * 90}°
                </span>
              </div>

              {/* 5x5 Infiltration Grid */}
              <div className="grid grid-cols-5 gap-2.5 p-4 bg-[#070b14] border-2 border-[#1e293b] rounded-2xl max-w-md w-full shadow-2xl">
                {Array.from({ length: 25 }).map((_, i) => {
                  const gx = i % 5;
                  const gy = Math.floor(i / 5);
                  const isPlayer = playerPos.x === gx && playerPos.y === gy;
                  const isVault = gx === 4 && gy === 0;
                  const isExit = gx === 0 && gy === 4;
                  const isScanner = gx === 2 && gy === 2;

                  // Laser beam calculation
                  const isLaser =
                    (cameraAngle === 0 && gx === 2 && gy <= 2) ||
                    (cameraAngle === 1 && gy === 2 && gx >= 2) ||
                    (cameraAngle === 2 && gx === 2 && gy >= 2) ||
                    (cameraAngle === 3 && gy === 2 && gx <= 2);

                  return (
                    <div
                      key={i}
                      className={`h-16 rounded-xl flex items-center justify-center text-xl font-mono font-bold transition-all ${
                        isPlayer
                          ? 'bg-[#38bdf8] text-[#0a0e17] shadow-[0_0_15px_#38bdf8]'
                          : isScanner
                          ? 'bg-[#ef4444]/40 border border-[#ef4444]'
                          : isLaser
                          ? 'bg-[#ef4444]/25 border border-[#ef4444]/60 animate-pulse'
                          : isVault
                          ? 'bg-[#f59e0b]/20 border border-[#f59e0b]'
                          : isExit
                          ? 'bg-[#10b981]/20 border border-[#10b981]'
                          : 'bg-[#0f172a] border border-[#1e293b]'
                      }`}
                    >
                      {isPlayer ? (
                        '🏃'
                      ) : isScanner ? (
                        '📹'
                      ) : isVault ? (
                        lootGrabbed ? '🔓' : '💰'
                      ) : isExit ? (
                        '🚁'
                      ) : isLaser ? (
                        '⚡'
                      ) : (
                        ''
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Directional Pad */}
              <div className="flex flex-col items-center gap-1.5 mt-4">
                <button
                  onClick={() => movePlayer(0, -1)}
                  className="w-14 h-12 bg-[#121824] hover:bg-[#1e293b] border border-[#1e293b] rounded-xl text-white font-bold text-lg"
                >
                  ▲
                </button>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => movePlayer(-1, 0)}
                    className="w-14 h-12 bg-[#121824] hover:bg-[#1e293b] border border-[#1e293b] rounded-xl text-white font-bold text-lg"
                  >
                    ◀
                  </button>
                  <button
                    onClick={() => movePlayer(0, 1)}
                    className="w-14 h-12 bg-[#121824] hover:bg-[#1e293b] border border-[#1e293b] rounded-xl text-white font-bold text-lg"
                  >
                    ▼
                  </button>
                  <button
                    onClick={() => movePlayer(1, 0)}
                    className="w-14 h-12 bg-[#121824] hover:bg-[#1e293b] border border-[#1e293b] rounded-xl text-white font-bold text-lg"
                  >
                    ▶
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
