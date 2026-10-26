/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { soundManager } from '../audio/soundManager';
import { LobbyInfo, PlayerProfile } from '../types/game';
import { INITIAL_PUBLIC_LOBBIES } from '../state/initialData';
import { formatCoins, formatTokens } from '../state/economyConfig';

interface TitleScreenProps {
  playerProfile: PlayerProfile;
  inventoryCount: number;
  onStartGame: (mode: 'solo' | 'friends' | 'public_lobby', roomCode?: string) => void;
  onEnterBaseDirectly: () => void;
  onOpenCustomizer: () => void;
  onOpenMarketplace: () => void;
  onOpenInventory: () => void;
  onOpenSettings: () => void;
}

export const TitleScreen: React.FC<TitleScreenProps> = ({
  playerProfile,
  inventoryCount,
  onStartGame,
  onEnterBaseDirectly,
  onOpenCustomizer,
  onOpenMarketplace,
  onOpenInventory,
  onOpenSettings,
}) => {
  const [screenView, setScreenView] = useState<
    'main' | 'play_select' | 'friends' | 'public_lobbies' | 'create_lobby' | 'lobby_waiting'
  >('main');

  const [publicLobbies, setPublicLobbies] = useState<LobbyInfo[]>(INITIAL_PUBLIC_LOBBIES);
  const [activeLobby, setActiveLobby] = useState<LobbyInfo | null>(null);

  // Form states
  const [friendCodeInput, setFriendCodeInput] = useState('');
  const [newLobbyName, setNewLobbyName] = useState('Vanguard Syndicate Hub');
  const [newLobbyPrivate, setNewLobbyPrivate] = useState(false);
  const [newLobbyMax, setNewLobbyMax] = useState(10);
  const [searchFilter, setSearchFilter] = useState('');
  const [isMuted, setIsMuted] = useState(false);

  // Handle ESC key to return to main menu
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (screenView !== 'main') {
          soundManager.playClick();
          setScreenView('main');
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [screenView]);

  const handleToggleMute = () => {
    soundManager.playClick();
    const muted = soundManager.toggleMute();
    setIsMuted(muted);
  };

  const handlePlaySolo = () => {
    soundManager.playClick();
    onStartGame('solo', 'OFFLINE-SOLO');
  };

  const handleJoinByCode = (e: React.FormEvent) => {
    e.preventDefault();
    if (friendCodeInput.trim().length >= 4) {
      soundManager.playClick();
      const code = friendCodeInput.trim().toUpperCase();
      const mockLobby: LobbyInfo = {
        id: 'lobby_' + code,
        name: `Friend World [${code}]`,
        hostName: 'Friend_Host',
        playersCount: 2,
        maxPlayers: 8,
        isPrivate: true,
        roomCode: code,
        status: 'waiting',
        members: [
          { id: 'f1', name: 'Friend_Host', isReady: true, isHost: true },
          { id: 'me', name: playerProfile.displayName, isReady: true, isHost: false },
        ],
      };
      setActiveLobby(mockLobby);
      setScreenView('lobby_waiting');
    }
  };

  const handleCreateLobbySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    soundManager.playClick();
    const generatedCode = 'VB-' + Math.floor(1000 + Math.random() * 9000);
    const created: LobbyInfo = {
      id: 'lobby_' + generatedCode,
      name: newLobbyName || 'Custom Syndicate Lobby',
      hostName: `${playerProfile.displayName} (Host)`,
      playersCount: 1,
      maxPlayers: newLobbyMax,
      isPrivate: newLobbyPrivate,
      roomCode: generatedCode,
      status: 'waiting',
      members: [{ id: 'me', name: `${playerProfile.displayName} (Host)`, isReady: true, isHost: true }],
    };
    setActiveLobby(created);
    setScreenView('lobby_waiting');
  };

  const handleJoinPublicLobby = (lobby: LobbyInfo) => {
    soundManager.playClick();
    const updatedLobby: LobbyInfo = {
      ...lobby,
      playersCount: Math.min(lobby.maxPlayers, lobby.playersCount + 1),
      members: [...lobby.members, { id: 'me', name: playerProfile.displayName, isReady: true, isHost: false }],
    };
    setActiveLobby(updatedLobby);
    setScreenView('lobby_waiting');
  };

  const handleEnterWorldFromLobby = () => {
    if (!activeLobby) return;
    soundManager.playClick();
    onStartGame(activeLobby.isPrivate ? 'friends' : 'public_lobby', activeLobby.roomCode);
  };

  return (
    <div className="absolute inset-0 z-30 flex flex-col justify-between p-6 sm:p-10 select-none overflow-hidden bg-gradient-to-t from-[#060a12] via-[#060a12]/75 to-[#060a12]/85 font-sans pointer-events-auto">
      {/* Top Status Header */}
      <div className="w-full flex items-center justify-between text-xs font-mono text-[#94a3b8] z-20">
        {/* Left: Realm & Build Status */}
        <div className="flex items-center gap-3 bg-[#0a0f1d]/80 backdrop-blur-md px-3.5 py-2 rounded-xl border border-[#1e293b]">
          <span className="w-2.5 h-2.5 rounded-full bg-[#10b981] animate-pulse" />
          <span className="text-white font-bold tracking-wider">VAULTBOUND MINI-CITY</span>
          <span className="text-[#64748b]">·</span>
          <span className="text-[#f59e0b] font-semibold">DISTRICT REALM v2.5</span>
        </div>

        {/* Right: Player Profile & Currency Bar */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-4 bg-[#0a0f1d]/80 backdrop-blur-md px-4 py-2 rounded-xl border border-[#1e293b]">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#f59e0b]" />
              <span className="text-[#94a3b8] text-[11px]">COINS:</span>
              <span className="text-[#f59e0b] font-bold font-mono">
                {formatCoins(playerProfile.vaultCoins)}
              </span>
            </div>

            <div className="h-3.5 w-px bg-[#1e293b]" />

            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#c084fc]" />
              <span className="text-[#94a3b8] text-[11px]">TOKENS:</span>
              <span className="text-[#c084fc] font-bold font-mono">
                {formatTokens(playerProfile.eventTokens)}
              </span>
            </div>

            <div className="h-3.5 w-px bg-[#1e293b]" />

            <div className="flex items-center gap-2">
              <span className="text-[11px] text-white font-bold">{playerProfile.displayName}</span>
              <span className="text-[10px] text-[#38bdf8] bg-[#38bdf8]/10 px-1.5 py-0.5 rounded border border-[#38bdf8]/30 font-mono">
                PLOT #{playerProfile.assignedHomePlot}
              </span>
            </div>
          </div>

          {/* Sound Toggle */}
          <button
            onClick={handleToggleMute}
            title={isMuted ? 'Unmute Audio' : 'Mute Audio'}
            className="p-2.5 rounded-xl bg-[#0a0f1d]/80 backdrop-blur-md border border-[#1e293b] hover:border-[#f59e0b] text-[#94a3b8] hover:text-[#f59e0b] transition-colors"
          >
            {isMuted ? '🔇' : '🔊'}
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="my-auto w-full max-w-5xl mx-auto flex flex-col items-center z-20">
        {/* ======================================================== */}
        {/* 1. PRIMARY HOMESCREEN VIEW */}
        {/* ======================================================== */}
        {screenView === 'main' && (
          <div className="flex flex-col items-center text-center animate-fade-in w-full max-w-2xl">
            {/* Geometric Vault Sigil */}
            <div className="mb-3 transform hover:rotate-6 transition-transform duration-500">
              <svg className="w-20 h-20 text-[#f59e0b] drop-shadow-[0_0_35px_rgba(245,158,11,0.6)]" viewBox="0 0 100 100" fill="none">
                <polygon points="50,5 95,27.5 95,72.5 50,95 5,72.5 5,27.5" stroke="currentColor" strokeWidth="3" fill="#0f172a" fillOpacity="0.85" />
                <polygon points="50,18 82,34 82,66 50,82 18,66 18,34" stroke="#38bdf8" strokeWidth="2" strokeDasharray="4 2" />
                <circle cx="50" cy="50" r="14" stroke="currentColor" strokeWidth="3" />
                <circle cx="50" cy="50" r="6" fill="currentColor" />
              </svg>
            </div>

            <h1 className="text-6xl sm:text-7xl font-black tracking-wider text-transparent bg-clip-text bg-gradient-to-b from-white via-[#f8fafc] to-[#94a3b8] drop-shadow-[0_12px_40px_rgba(0,0,0,0.95)]">
              VAULTBOUND
            </h1>

            <p className="text-xs sm:text-sm font-mono tracking-widest text-[#f59e0b] font-bold uppercase mt-2 mb-8 drop-shadow">
              Build your fortune. Trust your instincts. Own the city.
            </p>

            {/* Main Action Navigation Stack */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full">
              {/* PLAY HERO BUTTON (Spans full width on 2-col) */}
              <button
                onClick={() => {
                  soundManager.playClick();
                  setScreenView('play_select');
                }}
                className="col-span-1 sm:col-span-2 py-4 px-6 rounded-2xl bg-gradient-to-r from-[#d97706] via-[#f59e0b] to-[#fbbf24] hover:opacity-95 text-[#0a0e17] font-black text-sm tracking-widest uppercase font-mono shadow-[0_0_35px_rgba(245,158,11,0.4)] transition-all transform hover:scale-[1.01] flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <span className="text-xl">🏙️</span>
                  <span>PLAY (CHOOSE GAME MODE)</span>
                </div>
                <span className="text-[10px] bg-[#0a0e17] text-[#f59e0b] px-2.5 py-1 rounded font-mono font-bold tracking-wider">
                  ENTER DISTRICT →
                </span>
              </button>

              {/* MY BASE (Direct Jump to Personal Penthouse Base) */}
              <button
                onClick={() => {
                  soundManager.playClick();
                  onEnterBaseDirectly();
                }}
                className="py-3.5 px-5 rounded-2xl bg-[#0f172a]/90 hover:bg-[#1e293b] border border-[#1e293b] hover:border-[#f59e0b]/60 text-white font-bold text-xs tracking-wider uppercase font-mono transition-all flex items-center justify-between shadow-lg"
              >
                <div className="flex items-center gap-3">
                  <span className="text-lg">🏡</span>
                  <span>MY BASE (PLOT #{playerProfile.assignedHomePlot})</span>
                </div>
                <span className="text-[10px] text-[#f59e0b] font-mono">TIER {playerProfile.baseTier}</span>
              </button>

              {/* CHARACTER WARDROBE */}
              <button
                onClick={() => {
                  soundManager.playClick();
                  onOpenCustomizer();
                }}
                className="py-3.5 px-5 rounded-2xl bg-[#0f172a]/90 hover:bg-[#1e293b] border border-[#1e293b] hover:border-[#38bdf8]/60 text-white font-bold text-xs tracking-wider uppercase font-mono transition-all flex items-center justify-between shadow-lg"
              >
                <div className="flex items-center gap-3">
                  <span className="text-lg">👕</span>
                  <span>CHARACTER WARDROBE</span>
                </div>
                <span className="text-[10px] text-[#38bdf8] font-mono">CUSTOMIZE</span>
              </button>

              {/* MARKETPLACE */}
              <button
                onClick={() => {
                  soundManager.playClick();
                  onOpenMarketplace();
                }}
                className="py-3.5 px-5 rounded-2xl bg-[#0f172a]/90 hover:bg-[#1e293b] border border-[#1e293b] hover:border-[#10b981]/60 text-white font-bold text-xs tracking-wider uppercase font-mono transition-all flex items-center justify-between shadow-lg"
              >
                <div className="flex items-center gap-3">
                  <span className="text-lg">🏪</span>
                  <span>24/7 MARKETPLACE</span>
                </div>
                <span className="text-[10px] text-[#10b981] font-mono">TRADE</span>
              </button>

              {/* INVENTORY & COLLECTION */}
              <button
                onClick={() => {
                  soundManager.playClick();
                  onOpenInventory();
                }}
                className="py-3.5 px-5 rounded-2xl bg-[#0f172a]/90 hover:bg-[#1e293b] border border-[#1e293b] hover:border-[#c084fc]/60 text-white font-bold text-xs tracking-wider uppercase font-mono transition-all flex items-center justify-between shadow-lg"
              >
                <div className="flex items-center gap-3">
                  <span className="text-lg">🎒</span>
                  <span>VAULT INVENTORY</span>
                </div>
                <span className="text-[10px] text-[#c084fc] font-mono">{inventoryCount} ITEMS</span>
              </button>

              {/* SETTINGS (Controls & Keybinds) */}
              <button
                onClick={() => {
                  soundManager.playClick();
                  onOpenSettings();
                }}
                className="col-span-1 sm:col-span-2 py-3 px-5 rounded-2xl bg-[#0b0f19]/80 hover:bg-[#162030] border border-[#1e293b] text-[#94a3b8] hover:text-white font-bold text-xs tracking-wider uppercase font-mono transition-all flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <span className="text-base">⚙️</span>
                  <span>CONTROLS & KEYBINDINGS CONFIGURATION</span>
                </div>
                <span className="text-[10px] text-[#94a3b8] font-mono">REMAPPING</span>
              </button>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* 2. MODE SELECTION SCREEN */}
        {/* ======================================================== */}
        {screenView === 'play_select' && (
          <div className="flex flex-col items-center animate-fade-in w-full max-w-xl bg-[#0a0f1d]/95 border border-[#1e293b] p-6 sm:p-8 rounded-3xl shadow-2xl backdrop-blur-xl">
            <div className="w-full flex items-center justify-between mb-6 pb-4 border-b border-[#1e293b]">
              <div>
                <h2 className="text-xl font-black text-white font-mono tracking-wider">SELECT GAME MODE</h2>
                <p className="text-xs text-[#94a3b8] font-mono">Choose how you want to experience the Vaultbound District</p>
              </div>
              <button
                onClick={() => {
                  soundManager.playClick();
                  setScreenView('main');
                }}
                className="px-3 py-1.5 rounded-xl bg-[#1e293b] hover:bg-[#334155] text-xs font-mono text-white transition-colors"
              >
                ← BACK
              </button>
            </div>

            <div className="flex flex-col gap-3 w-full">
              {/* PLAY SOLO */}
              <button
                onClick={handlePlaySolo}
                className="w-full p-4 rounded-2xl bg-[#121927] hover:bg-[#1c263b] border border-[#1e293b] hover:border-[#f59e0b] text-left transition-all group flex items-start gap-4"
              >
                <div className="w-12 h-12 rounded-xl bg-[#f59e0b]/10 border border-[#f59e0b]/30 flex items-center justify-center text-2xl flex-shrink-0 group-hover:scale-105 transition-transform">
                  🏙️
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-black text-white font-mono tracking-wider">PLAY SOLO (LOCAL DISTRICT)</span>
                    <span className="text-[10px] bg-[#10b981]/20 text-[#10b981] px-2 py-0.5 rounded font-mono font-bold">
                      OFFLINE
                    </span>
                  </div>
                  <p className="text-xs text-[#94a3b8] mt-1 leading-relaxed">
                    Explore the full 3D mini-city, visit your personal base (Plot #{playerProfile.assignedHomePlot}), trade in the Grand Auction House, and duel bots without needing other players.
                  </p>
                </div>
              </button>

              {/* PLAY WITH FRIENDS */}
              <button
                onClick={() => {
                  soundManager.playClick();
                  setScreenView('friends');
                }}
                className="w-full p-4 rounded-2xl bg-[#121927] hover:bg-[#1c263b] border border-[#1e293b] hover:border-[#38bdf8] text-left transition-all group flex items-start gap-4"
              >
                <div className="w-12 h-12 rounded-xl bg-[#38bdf8]/10 border border-[#38bdf8]/30 flex items-center justify-center text-2xl flex-shrink-0 group-hover:scale-105 transition-transform">
                  🤝
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-black text-white font-mono tracking-wider">PLAY WITH FRIENDS</span>
                    <span className="text-[10px] bg-[#38bdf8]/20 text-[#38bdf8] px-2 py-0.5 rounded font-mono font-bold">
                      INVITE CODE
                    </span>
                  </div>
                  <p className="text-xs text-[#94a3b8] mt-1 leading-relaxed">
                    Join a friend's private district using their 6-digit room code or host a private room for your squad.
                  </p>
                </div>
              </button>

              {/* PUBLIC LOBBIES */}
              <button
                onClick={() => {
                  soundManager.playClick();
                  setScreenView('public_lobbies');
                }}
                className="w-full p-4 rounded-2xl bg-[#121927] hover:bg-[#1c263b] border border-[#1e293b] hover:border-[#a855f7] text-left transition-all group flex items-start gap-4"
              >
                <div className="w-12 h-12 rounded-xl bg-[#a855f7]/10 border border-[#a855f7]/30 flex items-center justify-center text-2xl flex-shrink-0 group-hover:scale-105 transition-transform">
                  🌐
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-black text-white font-mono tracking-wider">PUBLIC LOBBIES BROWSER</span>
                    <span className="text-[10px] bg-[#a855f7]/20 text-[#a855f7] px-2 py-0.5 rounded font-mono font-bold">
                      PROTOTYPE POOL
                    </span>
                  </div>
                  <p className="text-xs text-[#94a3b8] mt-1 leading-relaxed">
                    Browse active community lobbies and enter a staging waiting room before launching into the district.
                  </p>
                </div>
              </button>

              {/* CREATE LOBBY */}
              <button
                onClick={() => {
                  soundManager.playClick();
                  setScreenView('create_lobby');
                }}
                className="w-full p-4 rounded-2xl bg-[#121927] hover:bg-[#1c263b] border border-[#1e293b] hover:border-[#f59e0b] text-left transition-all group flex items-start gap-4"
              >
                <div className="w-12 h-12 rounded-xl bg-[#f59e0b]/10 border border-[#f59e0b]/30 flex items-center justify-center text-2xl flex-shrink-0 group-hover:scale-105 transition-transform">
                  🛠️
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-black text-white font-mono tracking-wider">CREATE CUSTOM LOBBY</span>
                    <span className="text-[10px] bg-[#f59e0b]/20 text-[#f59e0b] px-2 py-0.5 rounded font-mono font-bold">
                      HOST
                    </span>
                  </div>
                  <p className="text-xs text-[#94a3b8] mt-1 leading-relaxed">
                    Set up your custom syndicate hub rules, maximum player capacity, and enter the host waiting room.
                  </p>
                </div>
              </button>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* 3. PLAY WITH FRIENDS (CODE INPUT) */}
        {/* ======================================================== */}
        {screenView === 'friends' && (
          <div className="flex flex-col items-center animate-fade-in w-full max-w-md bg-[#0a0f1d]/95 border border-[#1e293b] p-6 sm:p-8 rounded-3xl shadow-2xl backdrop-blur-xl">
            <div className="w-full flex items-center justify-between mb-4 pb-3 border-b border-[#1e293b]">
              <h2 className="text-lg font-black text-white font-mono tracking-wider">JOIN BY LOBBY CODE</h2>
              <button
                onClick={() => {
                  soundManager.playClick();
                  setScreenView('play_select');
                }}
                className="px-3 py-1 rounded-xl bg-[#1e293b] hover:bg-[#334155] text-xs font-mono text-white transition-colors"
              >
                ← BACK
              </button>
            </div>

            <p className="text-xs text-[#94a3b8] font-mono mb-4 text-center">
              Enter the 6-character room code provided by your friend to join their district session.
            </p>

            <form onSubmit={handleJoinByCode} className="w-full flex flex-col gap-4">
              <input
                type="text"
                placeholder="e.g. VB-8821"
                value={friendCodeInput}
                onChange={(e) => setFriendCodeInput(e.target.value.toUpperCase())}
                maxLength={10}
                className="w-full py-3 px-4 rounded-xl bg-[#060a12] border border-[#1e293b] focus:border-[#38bdf8] text-center font-mono text-xl tracking-widest text-white uppercase outline-none"
              />

              <button
                type="submit"
                disabled={friendCodeInput.trim().length < 4}
                className="w-full py-3.5 rounded-xl bg-[#38bdf8] hover:bg-[#0284c7] disabled:opacity-40 disabled:pointer-events-none text-[#0a0e17] font-black text-xs font-mono tracking-wider uppercase transition-all shadow-lg"
              >
                JOIN LOBBY ROOM →
              </button>
            </form>
          </div>
        )}

        {/* ======================================================== */}
        {/* 4. PUBLIC LOBBIES BROWSER */}
        {/* ======================================================== */}
        {screenView === 'public_lobbies' && (
          <div className="flex flex-col items-center animate-fade-in w-full max-w-2xl bg-[#0a0f1d]/95 border border-[#1e293b] p-6 rounded-3xl shadow-2xl backdrop-blur-xl max-h-[80vh] overflow-hidden">
            <div className="w-full flex items-center justify-between mb-4 pb-3 border-b border-[#1e293b]">
              <div>
                <h2 className="text-lg font-black text-white font-mono tracking-wider">PUBLIC DISTRICT LOBBIES</h2>
                <span className="text-[10px] text-[#f59e0b] font-mono">Simulated Local Prototype Staging Stack</span>
              </div>
              <button
                onClick={() => {
                  soundManager.playClick();
                  setScreenView('play_select');
                }}
                className="px-3 py-1 rounded-xl bg-[#1e293b] hover:bg-[#334155] text-xs font-mono text-white transition-colors"
              >
                ← BACK
              </button>
            </div>

            {/* Search Filter */}
            <input
              type="text"
              placeholder="Search by lobby name or host..."
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              className="w-full py-2.5 px-4 mb-3 rounded-xl bg-[#060a12] border border-[#1e293b] text-xs font-mono text-white outline-none focus:border-[#a855f7]"
            />

            <div className="w-full flex flex-col gap-2 overflow-y-auto pr-1">
              {publicLobbies
                .filter(
                  (l) =>
                    l.name.toLowerCase().includes(searchFilter.toLowerCase()) ||
                    l.hostName.toLowerCase().includes(searchFilter.toLowerCase())
                )
                .map((lobby) => (
                  <div
                    key={lobby.id}
                    className="p-3.5 rounded-xl bg-[#121927] border border-[#1e293b] hover:border-[#a855f7]/60 flex items-center justify-between transition-colors"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-white font-mono">{lobby.name}</span>
                        <span className="text-[10px] font-mono text-[#94a3b8] bg-[#060a12] px-1.5 py-0.5 rounded border border-[#1e293b]">
                          {lobby.roomCode}
                        </span>
                      </div>
                      <div className="text-[11px] text-[#94a3b8] font-mono mt-0.5">
                        Host: <span className="text-[#38bdf8]">{lobby.hostName}</span> · Ping: 24ms
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="text-xs font-mono text-[#10b981] font-bold">
                        {lobby.playersCount}/{lobby.maxPlayers}
                      </span>
                      <button
                        onClick={() => handleJoinPublicLobby(lobby)}
                        className="py-1.5 px-3.5 rounded-lg bg-[#a855f7] hover:bg-[#9333ea] text-white font-bold text-xs font-mono transition-all"
                      >
                        JOIN
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* 5. CREATE LOBBY */}
        {/* ======================================================== */}
        {screenView === 'create_lobby' && (
          <div className="flex flex-col items-center animate-fade-in w-full max-w-md bg-[#0a0f1d]/95 border border-[#1e293b] p-6 sm:p-8 rounded-3xl shadow-2xl backdrop-blur-xl">
            <div className="w-full flex items-center justify-between mb-4 pb-3 border-b border-[#1e293b]">
              <h2 className="text-lg font-black text-white font-mono tracking-wider">CREATE NEW LOBBY</h2>
              <button
                onClick={() => {
                  soundManager.playClick();
                  setScreenView('play_select');
                }}
                className="px-3 py-1 rounded-xl bg-[#1e293b] hover:bg-[#334155] text-xs font-mono text-white transition-colors"
              >
                ← BACK
              </button>
            </div>

            <form onSubmit={handleCreateLobbySubmit} className="w-full flex flex-col gap-3 font-mono">
              <div>
                <label className="text-[11px] text-[#94a3b8] uppercase font-bold block mb-1">Lobby Name</label>
                <input
                  type="text"
                  value={newLobbyName}
                  onChange={(e) => setNewLobbyName(e.target.value)}
                  className="w-full py-2.5 px-3 rounded-xl bg-[#060a12] border border-[#1e293b] text-white text-xs outline-none focus:border-[#f59e0b]"
                />
              </div>

              <div>
                <label className="text-[11px] text-[#94a3b8] uppercase font-bold block mb-1">Max Capacity: {newLobbyMax}</label>
                <input
                  type="range"
                  min="4"
                  max="16"
                  value={newLobbyMax}
                  onChange={(e) => setNewLobbyMax(Number(e.target.value))}
                  className="w-full accent-[#f59e0b]"
                />
              </div>

              <div className="flex items-center justify-between py-2 border-t border-[#1e293b] my-1">
                <span className="text-xs text-white">Private (Requires Code)</span>
                <input
                  type="checkbox"
                  checked={newLobbyPrivate}
                  onChange={(e) => setNewLobbyPrivate(e.target.checked)}
                  className="w-4 h-4 accent-[#f59e0b]"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3.5 mt-2 rounded-xl bg-gradient-to-r from-[#d97706] to-[#f59e0b] hover:opacity-95 text-[#0a0e17] font-black text-xs font-mono tracking-wider uppercase transition-all shadow-lg"
              >
                CREATE & ENTER WAITING ROOM →
              </button>
            </form>
          </div>
        )}

        {/* ======================================================== */}
        {/* 6. LOBBY WAITING ROOM */}
        {/* ======================================================== */}
        {screenView === 'lobby_waiting' && activeLobby && (
          <div className="flex flex-col items-center animate-fade-in w-full max-w-lg bg-[#0a0f1d]/95 border border-[#1e293b] p-6 sm:p-8 rounded-3xl shadow-2xl backdrop-blur-xl">
            <div className="w-full flex items-center justify-between mb-4 pb-3 border-b border-[#1e293b]">
              <div>
                <span className="text-[10px] text-[#f59e0b] font-mono uppercase font-bold tracking-wider">STAGING ROOM</span>
                <h2 className="text-lg font-black text-white font-mono">{activeLobby.name}</h2>
              </div>
              <button
                onClick={() => {
                  soundManager.playClick();
                  setScreenView('play_select');
                }}
                className="px-3 py-1 rounded-xl bg-[#1e293b] hover:bg-[#334155] text-xs font-mono text-white transition-colors"
              >
                LEAVE ROOM
              </button>
            </div>

            {/* Room Info Chip */}
            <div className="w-full flex items-center justify-between p-3 rounded-xl bg-[#060a12] border border-[#1e293b] mb-4 text-xs font-mono">
              <span className="text-[#94a3b8]">Room Code:</span>
              <span className="font-bold text-[#38bdf8] tracking-widest text-sm">{activeLobby.roomCode}</span>
            </div>

            {/* Player Members List */}
            <div className="w-full flex flex-col gap-2 mb-6">
              <span className="text-[11px] font-mono text-[#94a3b8] uppercase font-bold">
                Citizens in Room ({activeLobby.members.length}/{activeLobby.maxPlayers}):
              </span>
              {activeLobby.members.map((m) => (
                <div
                  key={m.id}
                  className="flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-[#121927] border border-[#1e293b]"
                >
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#10b981]" />
                    <span className="text-xs font-mono text-white font-bold">{m.name}</span>
                    {m.isHost && (
                      <span className="text-[9px] bg-[#f59e0b]/20 text-[#f59e0b] px-1.5 py-0.2 rounded font-mono font-bold">
                        HOST
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] font-mono text-[#10b981]">READY</span>
                </div>
              ))}
            </div>

            {/* Launch Game Button */}
            <button
              onClick={handleEnterWorldFromLobby}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-[#d97706] via-[#f59e0b] to-[#fbbf24] hover:opacity-95 text-[#0a0e17] font-black text-sm tracking-widest uppercase font-mono shadow-[0_0_35px_rgba(245,158,11,0.4)] transition-all transform hover:scale-[1.01]"
            >
              LAUNCH INTO DISTRICT →
            </button>
          </div>
        )}
      </div>

      {/* Bottom Footer Credits & Hint */}
      <div className="w-full flex items-center justify-between text-[11px] font-mono text-[#64748b] z-20">
        <div>VAULTBOUND © 2026 · ALL RIGHTS RESERVED</div>
        <div className="flex items-center gap-4">
          <span>PRESS [ESC] TO GO BACK</span>
          <span>·</span>
          <span>PRESS [W,A,S,D] IN-WORLD TO NAVIGATE</span>
        </div>
      </div>
    </div>
  );
};
