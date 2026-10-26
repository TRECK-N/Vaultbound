/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { PlayerProfile } from '../types/game';
import { WorldZoneTrigger } from '../engine/worldBuilder';
import { soundManager } from '../audio/soundManager';
import { formatCoins, formatTokens } from '../state/economyConfig';
import { MarketPulseIndicator } from './MarketPulseIndicator';
import { dayNightManager, TimeOfDayInfo } from '../state/dayNightCycle';

interface HUDProps {
  profile: PlayerProfile;
  currentView: 'city' | 'base';
  nearbyZone: WorldZoneTrigger | null;
  onOpenMenu: (menu: string) => void;
  onTriggerEmote: (emote: string) => void;
  onSwitchView: () => void;
}

export const HUD: React.FC<HUDProps> = ({
  profile,
  currentView,
  nearbyZone,
  onOpenMenu,
  onTriggerEmote,
  onSwitchView,
}) => {
  const [isMuted, setIsMuted] = useState(soundManager.isMuted);
  const [showEmotes, setShowEmotes] = useState(false);
  const [dockCollapsed, setDockCollapsed] = useState(false);
  const [timeInfo, setTimeInfo] = useState<TimeOfDayInfo>(() => dayNightManager.getTimeInfo());

  useEffect(() => {
    const unsub = dayNightManager.subscribe((info) => {
      setTimeInfo(info);
    });
    return unsub;
  }, []);

  const handleMuteToggle = () => {
    const muted = soundManager.toggleMute();
    setIsMuted(muted);
    soundManager.playClick();
  };

  return (
    <div className="absolute inset-0 pointer-events-none select-none overflow-hidden z-20 flex flex-col justify-between p-4 sm:p-6 font-sans">
      {/* Top Header Bar */}
      <div className="flex flex-wrap items-start justify-between w-full pointer-events-auto gap-3">
        {/* Left: Player Profile & Level */}
        <div
          onClick={() => {
            soundManager.playClick();
            onOpenMenu('profile');
          }}
          className="flex items-center gap-3 bg-[#0a0e17]/95 border border-[#1e293b] hover:border-[#f59e0b]/60 px-4 py-2.5 rounded-2xl cursor-pointer shadow-xl transition-colors group"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#0284c7] to-[#0f172a] border border-[#38bdf8]/40 flex items-center justify-center font-bold text-white text-base shadow-inner">
            {profile.displayName.substring(0, 2).toUpperCase()}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-white font-semibold text-sm group-hover:text-[#f59e0b] transition-colors">
                {profile.displayName}
              </span>
              <span className="text-[10px] font-mono uppercase bg-[#1e293b] text-[#38bdf8] px-1.5 py-0.5 rounded font-bold">
                LVL {profile.level}
              </span>
            </div>
            <div className="text-[11px] text-[#94a3b8] font-mono flex items-center gap-1.5 mt-0.5">
              <span>MMR:</span>
              <span className="text-[#f59e0b] font-bold tabular-nums">{profile.duelRating}</span>
              <span className="text-[#64748b]">·</span>
              <span className="text-[#38bdf8] uppercase">
                {currentView === 'city' ? `VAULTBOUND DISTRICT` : `HOME BASE (PLOT #${profile.assignedHomePlot})`}
              </span>
            </div>
          </div>
        </div>

        {/* Center: In-Game Clock, Currencies Cluster & Market Pulse */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          {/* Day/Night Clock Pill */}
          <div className="flex items-center gap-2 bg-[#0a0e17]/95 border border-[#1e293b] px-3.5 py-2 rounded-2xl shadow-xl font-mono text-xs">
            <span className="text-sm">{timeInfo.icon}</span>
            <div className="flex flex-col">
              <span className="text-white font-bold tracking-wider tabular-nums leading-tight">
                {timeInfo.timeString}
              </span>
              <span className="text-[9px] uppercase text-[#94a3b8] tracking-widest leading-none font-semibold">
                {timeInfo.phaseName}
              </span>
            </div>
          </div>

          {/* Currencies Cluster */}
          <div className="flex items-center gap-3 bg-[#0a0e17]/95 border border-[#1e293b] px-4 py-2 rounded-2xl shadow-xl">
            {/* Vault Coins */}
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-[#d97706] to-[#fbbf24] flex items-center justify-center text-[#0a0e17] font-black text-xs shadow-md">
                V
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] uppercase font-mono text-[#94a3b8] leading-none">Vault Coins</span>
                <span className="text-white font-mono font-bold text-sm tabular-nums leading-tight">
                  {formatCoins(profile.vaultCoins)}
                </span>
              </div>
            </div>

            <div className="w-[1px] h-6 bg-[#1e293b]" />

            {/* Event Tokens */}
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-[#7c3aed] to-[#c084fc] flex items-center justify-center text-white font-black text-xs shadow-md">
                E
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] uppercase font-mono text-[#94a3b8] leading-none">Event Tokens</span>
                <span className="text-white font-mono font-bold text-sm tabular-nums leading-tight">
                  {formatTokens(profile.eventTokens)}
                </span>
              </div>
            </div>
          </div>

          {/* Compact Market Pulse Indicator (Click opens Dynamic Market) */}
          <MarketPulseIndicator onOpenMarket={() => onOpenMenu('dynamic_market')} />
        </div>

        {/* Right: Room status & Settings / Mute */}
        <div className="flex items-center gap-2">
          {/* Room Mode Badge */}
          <div
            onClick={() => {
              soundManager.playClick();
              onOpenMenu('settings');
            }}
            className="hidden sm:flex items-center gap-2 bg-[#0a0e17]/95 border border-[#1e293b] hover:border-[#38bdf8]/50 px-3.5 py-2 rounded-2xl cursor-pointer text-xs font-mono text-[#94a3b8]"
          >
            <span className={`w-2 h-2 rounded-full ${profile.gameMode === 'solo' ? 'bg-[#38bdf8]' : 'bg-[#10b981]'}`} />
            <span className="uppercase">{profile.gameMode === 'solo' ? 'SOLO OFFLINE' : profile.activeRoomCode}</span>
          </div>

          {/* Sound Mute Toggle */}
          <button
            onClick={handleMuteToggle}
            className="w-10 h-10 bg-[#0a0e17]/95 border border-[#1e293b] hover:border-[#f59e0b] rounded-xl flex items-center justify-center text-[#94a3b8] hover:text-white transition-colors"
            title={isMuted ? 'Unmute Audio' : 'Mute Audio'}
          >
            {isMuted ? (
              <svg className="w-5 h-5 text-[#ef4444]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
              </svg>
            ) : (
              <svg className="w-5 h-5 text-[#38bdf8]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
              </svg>
            )}
          </button>

          {/* Pause / Settings */}
          <button
            onClick={() => {
              soundManager.playClick();
              onOpenMenu('settings');
            }}
            className="w-10 h-10 bg-[#0a0e17]/95 border border-[#1e293b] hover:border-[#f59e0b] rounded-xl flex items-center justify-center text-[#94a3b8] hover:text-white transition-colors"
            title="Settings & Menu [Esc]"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
        </div>
      </div>

      {/* Proximity Interaction Prompt Banner */}
      <div className="flex flex-col items-center justify-center my-auto">
        {nearbyZone && (
          <div
            onClick={() => {
              soundManager.playClick();
              onOpenMenu(nearbyZone.actionKey);
            }}
            className="pointer-events-auto bg-[#0a0e17]/95 border-2 border-[#f59e0b] shadow-[0_0_30px_rgba(245,158,11,0.35)] px-6 py-3.5 rounded-2xl flex items-center gap-4 cursor-pointer transform hover:scale-105 transition-all"
          >
            <div className="w-9 h-9 rounded-xl bg-[#f59e0b] text-[#0a0e17] font-black flex items-center justify-center text-sm shadow-inner">
              E
            </div>
            <div>
              <div className="text-white font-bold text-base tracking-wide flex items-center gap-2">
                <span>{nearbyZone.name}</span>
                <span className="text-[10px] bg-[#f59e0b]/20 text-[#f59e0b] border border-[#f59e0b]/40 px-2 py-0.5 rounded font-mono font-bold">
                  INTERACT
                </span>
              </div>
              <div className="text-xs text-[#94a3b8] font-mono mt-0.5">
                {nearbyZone.prompt}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Collapsible Unified Bottom Dock */}
      <div className="flex flex-col items-center gap-2 w-full pointer-events-auto">
        <button
          onClick={() => {
            soundManager.playClick();
            setDockCollapsed(!dockCollapsed);
          }}
          className="bg-[#0a0e17]/90 border border-[#1e293b] hover:border-[#f59e0b]/50 text-[#94a3b8] hover:text-white px-3.5 py-1 rounded-full text-[11px] font-mono flex items-center gap-1.5 transition-colors shadow-lg"
        >
          <span>{dockCollapsed ? '▴ Show District Dock' : '▾ Hide Controls (Zen Mode)'}</span>
        </button>

        {!dockCollapsed && (
          <div className="bg-[#0a0e17]/95 border border-[#1e293b] rounded-2xl p-2 px-3 flex flex-wrap items-center justify-center gap-2 shadow-2xl max-w-full">
            {/* Enter Base / City Toggle */}
            <button
              onClick={() => {
                soundManager.playClick();
                onSwitchView();
              }}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#121824] hover:bg-[#1e293b] border border-[#1e293b] hover:border-[#10b981] text-white text-xs font-semibold transition-all group"
            >
              <div className="w-6 h-6 rounded-lg bg-[#10b981]/20 text-[#10b981] flex items-center justify-center text-xs">
                {currentView === 'city' ? '🏠' : '🏙️'}
              </div>
              <span>{currentView === 'city' ? `Base (Plot #${profile.assignedHomePlot})` : 'City District'}</span>
            </button>

            {/* Grand Auction House */}
            <button
              onClick={() => {
                soundManager.playClick();
                onOpenMenu('auction');
              }}
              className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[#121824] hover:bg-[#1e293b] border border-[#1e293b] hover:border-[#f59e0b] text-white text-xs font-semibold transition-all group"
            >
              <div className="w-6 h-6 rounded-lg bg-[#f59e0b]/15 text-[#f59e0b] flex items-center justify-center text-xs">
                ⚖️
              </div>
              <span>Auction House</span>
            </button>

            {/* Marketplace */}
            <button
              onClick={() => {
                soundManager.playClick();
                onOpenMenu('market');
              }}
              className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[#121824] hover:bg-[#1e293b] border border-[#1e293b] hover:border-[#38bdf8] text-white text-xs font-semibold transition-all group"
            >
              <div className="w-6 h-6 rounded-lg bg-[#38bdf8]/15 text-[#38bdf8] flex items-center justify-center text-xs">
                🏪
              </div>
              <span>Marketplace</span>
            </button>

            {/* Vault Duel Arena */}
            <button
              onClick={() => {
                soundManager.playClick();
                onOpenMenu('duel');
              }}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-gradient-to-r from-[#7c3aed]/20 to-[#9333ea]/20 hover:from-[#7c3aed]/30 hover:to-[#9333ea]/30 border border-[#a855f7]/40 hover:border-[#c084fc] text-white text-xs font-semibold transition-all shadow-md group"
            >
              <div className="w-6 h-6 rounded-lg bg-[#a855f7] text-[#0a0e17] font-black flex items-center justify-center text-xs">
                ⚔️
              </div>
              <span className="text-[#c084fc] font-bold">Vault Duel</span>
            </button>

            {/* Heist Mission */}
            <button
              onClick={() => {
                soundManager.playClick();
                onOpenMenu('heist');
              }}
              className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[#121824] hover:bg-[#1e293b] border border-[#1e293b] hover:border-[#ef4444] text-white text-xs font-semibold transition-all group"
            >
              <div className="w-6 h-6 rounded-lg bg-[#ef4444]/15 text-[#ef4444] flex items-center justify-center text-xs">
                🚨
              </div>
              <span>Heist</span>
            </button>

            {/* Inventory */}
            <button
              onClick={() => {
                soundManager.playClick();
                onOpenMenu('inventory');
              }}
              className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[#121824] hover:bg-[#1e293b] border border-[#1e293b] hover:border-[#f59e0b] text-white text-xs font-semibold transition-all group"
            >
              <div className="w-6 h-6 rounded-lg bg-[#f59e0b]/15 text-[#f59e0b] flex items-center justify-center text-xs">
                🎒
              </div>
              <span>Inventory [I]</span>
            </button>

            {/* Dynamic Item Market */}
            <button
              onClick={() => {
                soundManager.playClick();
                onOpenMenu('dynamic_market');
              }}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-gradient-to-r from-[#0d9488]/20 to-[#14b8a6]/20 hover:from-[#0d9488]/30 hover:to-[#14b8a6]/30 border border-[#14b8a6]/50 hover:border-[#2dd4bf] text-white text-xs font-semibold transition-all shadow-md group"
            >
              <div className="w-6 h-6 rounded-lg bg-[#14b8a6] text-[#0a0e17] font-black flex items-center justify-center text-xs">
                📈
              </div>
              <span className="text-[#2dd4bf] font-bold">Market [M]</span>
            </button>

            {/* Wardrobe */}
            <button
              onClick={() => {
                soundManager.playClick();
                onOpenMenu('customizer');
              }}
              className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[#121824] hover:bg-[#1e293b] border border-[#1e293b] hover:border-[#e2e8f0] text-white text-xs font-semibold transition-all group"
            >
              <div className="w-6 h-6 rounded-lg bg-slate-700 text-white flex items-center justify-center text-xs">
                🤖
              </div>
              <span>Robot Studio</span>
            </button>

            {/* Emotes Trigger */}
            <div className="relative">
              <button
                onClick={() => setShowEmotes(!showEmotes)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#121824] hover:bg-[#1e293b] border border-[#1e293b] hover:border-[#f59e0b] text-white text-xs font-semibold transition-all"
              >
                <span>🕺</span>
                <span>Emote</span>
              </button>

              {showEmotes && (
                <div className="absolute bottom-12 left-1/2 -translate-x-1/2 bg-[#0a0e17] border border-[#1e293b] p-2 rounded-xl shadow-2xl flex flex-col gap-1 min-w-[120px]">
                  {['dance', 'flex', 'wave'].map((em) => (
                    <button
                      key={em}
                      onClick={() => {
                        soundManager.playClick();
                        onTriggerEmote(em);
                        setShowEmotes(false);
                      }}
                      className="px-3 py-1.5 rounded-lg text-left text-xs text-white hover:bg-[#1e293b] capitalize font-mono"
                    >
                      {em}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Flat Key Hints Line */}
        <div className="text-[11px] font-mono text-[#64748b] bg-[#0a0e17]/85 px-4 py-1 rounded-full border border-[#1e293b]/60 flex items-center gap-3">
          <span><b className="text-[#94a3b8]">WASD</b> Move</span>
          <span>·</span>
          <span><b className="text-[#94a3b8]">Shift</b> Sprint</span>
          <span>·</span>
          <span><b className="text-[#94a3b8]">Space</b> Jump</span>
          <span>·</span>
          <span><b className="text-[#f59e0b]">[E]</b> Interact</span>
          <span>·</span>
          <span><b className="text-[#2dd4bf]">[M]</b> Market</span>
          <span>·</span>
          <span><b className="text-[#94a3b8]">[I]</b> Inventory</span>
          <span>·</span>
          <span><b className="text-[#94a3b8]">Esc</b> Settings</span>
        </div>
      </div>
    </div>
  );
};
