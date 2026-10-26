/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { soundManager } from '../audio/soundManager';
import {
  KeyAction,
  KEYBIND_METADATA,
  DEFAULT_KEYBINDS,
  formatKeyDisplay,
  normalizeKey,
} from '../state/keybinds';

interface PauseSettingsModalProps {
  roomCode: string;
  keybinds: Record<KeyAction, string>;
  onUpdateKeybinds: (binds: Record<KeyAction, string>) => void;
  onUpdateRoomCode: (code: string) => void;
  onResume: () => void;
  onExitToTitle: () => void;
  fromMainMenu?: boolean;
}

export const PauseSettingsModal: React.FC<PauseSettingsModalProps> = ({
  roomCode,
  keybinds,
  onUpdateKeybinds,
  onUpdateRoomCode,
  onResume,
  onExitToTitle,
  fromMainMenu = false,
}) => {
  const [activeTab, setActiveTab] = useState<'controls' | 'audio' | 'multiplayer'>('controls');
  const [isMuted, setIsMuted] = useState(soundManager.isMuted);
  const [inputCode, setInputCode] = useState('');
  const [copied, setCopied] = useState(false);

  // Keybinding remapping state
  const [rebindingAction, setRebindingAction] = useState<KeyAction | null>(null);
  const [conflictWarning, setConflictWarning] = useState<{ key: string; existingAction: KeyAction; newAction: KeyAction } | null>(null);

  // Listen for key press during rebinding
  React.useEffect(() => {
    if (!rebindingAction) return;

    const handleKeyCapture = (e: KeyboardEvent) => {
      e.preventDefault();
      e.stopPropagation();

      const newKey = normalizeKey(e);

      // Check if this key is already assigned to another action
      const conflictAction = (Object.keys(keybinds) as KeyAction[]).find(
        (act) => act !== rebindingAction && keybinds[act] === newKey
      );

      if (conflictAction) {
        soundManager.playAlarm();
        setConflictWarning({
          key: newKey,
          existingAction: conflictAction,
          newAction: rebindingAction,
        });
        setRebindingAction(null);
        return;
      }

      // Assign key
      soundManager.playClick();
      onUpdateKeybinds({
        ...keybinds,
        [rebindingAction]: newKey,
      });
      setRebindingAction(null);
      setConflictWarning(null);
    };

    window.addEventListener('keydown', handleKeyCapture, { capture: true });
    return () => window.removeEventListener('keydown', handleKeyCapture, { capture: true });
  }, [rebindingAction, keybinds, onUpdateKeybinds]);

  const handleResolveConflict = (replace: boolean) => {
    if (!conflictWarning) return;
    if (replace) {
      soundManager.playClick();
      // Swap or take over the key
      onUpdateKeybinds({
        ...keybinds,
        [conflictWarning.existingAction]: '', // unbind old
        [conflictWarning.newAction]: conflictWarning.key,
      });
    }
    setConflictWarning(null);
  };

  const handleRestoreDefaults = () => {
    soundManager.playClick();
    onUpdateKeybinds({ ...DEFAULT_KEYBINDS });
    setConflictWarning(null);
    setRebindingAction(null);
  };

  const handleToggleMute = () => {
    const m = soundManager.toggleMute();
    setIsMuted(m);
    soundManager.playClick();
  };

  const handleCopyCode = () => {
    navigator.clipboard?.writeText(roomCode);
    setCopied(true);
    soundManager.playClick();
    setTimeout(() => setCopied(false), 2000);
  };

  const handleJoinCode = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputCode.trim().length >= 4) {
      soundManager.playClick();
      onUpdateRoomCode(inputCode.trim().toUpperCase());
      setInputCode('');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 animate-fade-in font-sans">
      <div className="bg-[#0a0e17] border border-[#1e293b] rounded-3xl w-full max-w-2xl flex flex-col shadow-[0_0_50px_rgba(0,0,0,0.85)] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#1e293b] bg-[#0d1322]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#38bdf8] to-[#0284c7] flex items-center justify-center text-[#0a0e17] text-lg font-black shadow-md">
              ⚙️
            </div>
            <div>
              <h2 className="text-white font-bold text-lg tracking-wide">
                SETTINGS & CONTROLS
              </h2>
              <p className="text-xs text-[#94a3b8] font-mono">
                {fromMainMenu ? 'Main Menu Configuration' : 'Game Paused · District Simulation Suspended'}
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              soundManager.playClick();
              onResume();
            }}
            className="w-8 h-8 rounded-xl bg-[#1e293b] hover:bg-[#334155] text-[#94a3b8] hover:text-white flex items-center justify-center transition-colors font-bold"
          >
            ✕
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 px-6 py-2.5 border-b border-[#1e293b] bg-[#0a0e17]">
          <button
            onClick={() => {
              soundManager.playClick();
              setActiveTab('controls');
            }}
            className={`px-4 py-1.5 rounded-xl text-xs font-semibold font-mono transition-all ${
              activeTab === 'controls'
                ? 'bg-[#38bdf8] text-[#0a0e17] shadow-md font-bold'
                : 'text-[#94a3b8] hover:text-white hover:bg-[#1e293b]'
            }`}
          >
            CONTROLS & KEYBINDS
          </button>
          <button
            onClick={() => {
              soundManager.playClick();
              setActiveTab('audio');
            }}
            className={`px-4 py-1.5 rounded-xl text-xs font-semibold font-mono transition-all ${
              activeTab === 'audio'
                ? 'bg-[#38bdf8] text-[#0a0e17] shadow-md font-bold'
                : 'text-[#94a3b8] hover:text-white hover:bg-[#1e293b]'
            }`}
          >
            AUDIO & SYNTH
          </button>
          <button
            onClick={() => {
              soundManager.playClick();
              setActiveTab('multiplayer');
            }}
            className={`px-4 py-1.5 rounded-xl text-xs font-semibold font-mono transition-all ${
              activeTab === 'multiplayer'
                ? 'bg-[#38bdf8] text-[#0a0e17] shadow-md font-bold'
                : 'text-[#94a3b8] hover:text-white hover:bg-[#1e293b]'
            }`}
          >
            NETWORK & ROOM CODE
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-6 space-y-4 overflow-y-auto max-h-[68vh]">
          {activeTab === 'controls' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-white font-bold text-sm">Keyboard Actions & Bindings</h3>
                  <p className="text-[11px] text-[#94a3b8] font-mono">
                    Click Rebind on any action, then press your desired key. Saved automatically.
                  </p>
                </div>
                <button
                  onClick={handleRestoreDefaults}
                  className="px-3 py-1.5 bg-[#121824] hover:bg-[#1e293b] border border-[#1e293b] text-[#f59e0b] hover:text-white text-xs font-mono rounded-xl font-bold transition-colors"
                >
                  RESTORE DEFAULTS
                </button>
              </div>

              {/* Conflict warning modal banner */}
              {conflictWarning && (
                <div className="p-4 rounded-2xl bg-amber-500/15 border-2 border-amber-500 text-amber-300 font-mono text-xs space-y-2">
                  <div className="font-bold">⚠️ KEY CONFLICT DETECTED</div>
                  <p>
                    Key <b className="text-white uppercase font-bold">[{conflictWarning.key}]</b> is already assigned to{' '}
                    <b className="text-white">{KEYBIND_METADATA.find((m) => m.action === conflictWarning.existingAction)?.label}</b>.
                  </p>
                  <div className="flex items-center gap-3 pt-1">
                    <button
                      onClick={() => handleResolveConflict(true)}
                      className="px-3 py-1 bg-amber-500 text-[#0a0e17] font-bold rounded-lg"
                    >
                      Replace Assignment
                    </button>
                    <button
                      onClick={() => handleResolveConflict(false)}
                      className="px-3 py-1 bg-[#1e293b] text-white rounded-lg hover:bg-[#334155]"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {/* Waiting for keypress overlay */}
              {rebindingAction && (
                <div className="p-4 rounded-2xl bg-[#0284c7]/20 border-2 border-[#38bdf8] text-[#38bdf8] text-center font-mono text-xs animate-pulse">
                  Press any key to bind to{' '}
                  <b className="text-white">{KEYBIND_METADATA.find((m) => m.action === rebindingAction)?.label}</b>...
                  <div className="text-[10px] text-[#94a3b8] mt-1">(Press Esc to cancel)</div>
                </div>
              )}

              {/* Keybinding table */}
              <div className="space-y-1.5 font-mono text-xs">
                {KEYBIND_METADATA.map((meta) => {
                  const assigned = keybinds[meta.action] || 'Unbound';
                  const isRebinding = rebindingAction === meta.action;

                  return (
                    <div
                      key={meta.action}
                      className="flex items-center justify-between p-3 rounded-xl bg-[#121824] border border-[#1e293b]"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] uppercase font-bold text-[#64748b] bg-[#0a0e17] px-1.5 py-0.5 rounded">
                          {meta.category}
                        </span>
                        <span className="text-white font-medium">{meta.label}</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <span
                          className={`px-3 py-1 rounded-lg border text-center min-w-[70px] font-bold ${
                            isRebinding
                              ? 'bg-[#38bdf8] text-[#0a0e17] border-[#38bdf8] animate-pulse'
                              : 'bg-[#0a0e17] text-[#38bdf8] border-[#1e293b]'
                          }`}
                        >
                          {isRebinding ? '...' : formatKeyDisplay(assigned)}
                        </span>

                        <button
                          onClick={() => {
                            soundManager.playClick();
                            setRebindingAction(meta.action);
                            setConflictWarning(null);
                          }}
                          className="px-3 py-1 rounded-lg bg-[#1e293b] hover:bg-[#334155] text-white font-semibold text-[11px] transition-colors"
                        >
                          Rebind
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {activeTab === 'audio' && (
            <div className="space-y-4">
              <div className="bg-[#121824] border border-[#1e293b] p-4 rounded-2xl flex items-center justify-between">
                <div>
                  <div className="text-white font-bold text-sm">Procedural Web Audio Synthesizer</div>
                  <div className="text-xs text-[#94a3b8] font-mono mt-0.5">
                    Zero external MP3 dependencies · Live mathematical oscillator synthesis
                  </div>
                </div>
                <button
                  onClick={handleToggleMute}
                  className={`px-4 py-2 rounded-xl text-xs font-mono font-bold transition-all ${
                    isMuted
                      ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                      : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                  }`}
                >
                  {isMuted ? 'AUDIO MUTED 🔇' : 'AUDIO ACTIVE 🔊'}
                </button>
              </div>

              {/* Sound Test Panel */}
              <div className="bg-[#121824] border border-[#1e293b] p-4 rounded-2xl">
                <h4 className="text-white font-bold text-xs font-mono uppercase mb-3 text-[#38bdf8]">
                  🎵 SOUND EFFECTS TEST
                </h4>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => soundManager.playCoin()}
                    className="px-3 py-1.5 bg-[#1e293b] hover:bg-[#334155] rounded-xl text-xs font-mono text-white"
                  >
                    🪙 Coin Clink
                  </button>
                  <button
                    onClick={() => soundManager.playAuctionGavel()}
                    className="px-3 py-1.5 bg-[#1e293b] hover:bg-[#334155] rounded-xl text-xs font-mono text-white"
                  >
                    ⚖️ Auction Gavel
                  </button>
                  <button
                    onClick={() => soundManager.playCardSlam()}
                    className="px-3 py-1.5 bg-[#1e293b] hover:bg-[#334155] rounded-xl text-xs font-mono text-white"
                  >
                    ⚔️ Duel Card Slam
                  </button>
                  <button
                    onClick={() => soundManager.playVictory()}
                    className="px-3 py-1.5 bg-[#1e293b] hover:bg-[#334155] rounded-xl text-xs font-mono text-white"
                  >
                    🏆 Victory Fanfare
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'multiplayer' && (
            <div className="space-y-4">
              <div className="bg-[#121824] border border-[#1e293b] p-4 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs font-mono text-[#94a3b8] block">CURRENT MULTIPLAYER INSTANCE</span>
                    <span className="text-xl font-bold font-mono text-white tracking-widest">{roomCode}</span>
                  </div>
                  <button
                    onClick={handleCopyCode}
                    className="px-3.5 py-1.5 bg-[#1e293b] hover:bg-[#334155] text-xs font-mono text-[#38bdf8] rounded-xl font-bold transition-colors"
                  >
                    {copied ? 'COPIED!' : 'COPY CODE'}
                  </button>
                </div>

                <form onSubmit={handleJoinCode} className="flex items-center gap-2 pt-2 border-t border-[#1e293b]">
                  <input
                    type="text"
                    placeholder="Enter room code (e.g. VB-9921)"
                    value={inputCode}
                    onChange={(e) => setInputCode(e.target.value)}
                    className="bg-[#0a0e17] border border-[#1e293b] focus:border-[#38bdf8] px-3 py-1.5 rounded-xl text-xs text-white font-mono outline-none flex-1 uppercase"
                  />
                  <button
                    type="submit"
                    className="px-4 py-1.5 bg-[#38bdf8] text-[#0a0e17] font-bold text-xs rounded-xl font-mono"
                  >
                    JOIN ROOM
                  </button>
                </form>
              </div>

              <div className="p-3 rounded-xl bg-[#0e1424] border border-[#1e293b] text-[11px] font-mono text-[#94a3b8]">
                <b>Network Architecture:</b> Solo offline mode runs entirely in local persistent storage. Multiplayer lobby codes connect you to simulated room peers in the prototype, structured for real-time WebSocket / Firebase synchronization when cloud keys are provisioned.
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between p-4 border-t border-[#1e293b] bg-[#0d1322]">
          {!fromMainMenu && (
            <button
              onClick={() => {
                soundManager.playClick();
                onExitToTitle();
              }}
              className="px-4 py-2 bg-[#1e293b] hover:bg-[#334155] text-[#94a3b8] hover:text-white font-mono text-xs rounded-xl font-bold transition-colors"
            >
              EXIT TO MAIN MENU
            </button>
          )}
          <button
            onClick={() => {
              soundManager.playClick();
              onResume();
            }}
            className="ml-auto px-6 py-2.5 bg-[#f59e0b] hover:bg-[#d97706] text-[#0a0e17] font-mono font-black text-xs rounded-xl shadow-md transition-all"
          >
            {fromMainMenu ? 'CLOSE SETTINGS' : 'RESUME PLAY'}
          </button>
        </div>
      </div>
    </div>
  );
};
