/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { PlayerProfile, CollectibleItem } from '../types/game';
import { loadLedger, LedgerEntry } from '../state/gameStorage';
import { soundManager } from '../audio/soundManager';
import { formatCoins } from '../state/economyConfig';

interface ProfileModalProps {
  profile: PlayerProfile;
  inventory: CollectibleItem[];
  onUpdateName: (newName: string) => void;
  onClose: () => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({
  profile,
  inventory,
  onUpdateName,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'ledger' | 'trophies'>('overview');
  const [isEditingName, setIsEditingName] = useState(false);
  const [tempName, setTempName] = useState(profile.displayName);
  const ledger = loadLedger();

  const portfolioValue = inventory.reduce((acc, i) => acc + i.estimatedValue, 0);
  const totalNetWorth = profile.vaultCoins + portfolioValue;

  const getRankTier = (mmr: number) => {
    if (mmr >= 1500) return { name: 'APEX VAULTMASTER', color: 'text-amber-400 border-amber-500/50 bg-amber-500/15' };
    if (mmr >= 1350) return { name: 'DIAMOND OPERATIVE', color: 'text-cyan-400 border-cyan-500/50 bg-cyan-500/15' };
    if (mmr >= 1200) return { name: 'PLATINUM DUELIST', color: 'text-purple-400 border-purple-500/50 bg-purple-500/15' };
    if (mmr >= 1050) return { name: 'GOLD TACTICIAN', color: 'text-emerald-400 border-emerald-500/50 bg-emerald-500/15' };
    return { name: 'SILVER CHALLENGER', color: 'text-slate-400 border-slate-500/50 bg-slate-500/15' };
  };

  const rank = getRankTier(profile.duelRating);

  const handleSaveName = () => {
    if (tempName.trim().length >= 3) {
      soundManager.playClick();
      onUpdateName(tempName.trim());
      setIsEditingName(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 animate-fade-in font-sans">
      <div className="bg-[#0a0e17] border border-[#f59e0b]/40 rounded-3xl w-full max-w-4xl h-[85vh] flex flex-col shadow-[0_0_50px_rgba(245,158,11,0.15)] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#1e293b] bg-[#0d1322]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#d97706] to-[#f59e0b] flex items-center justify-center text-[#0a0e17] text-xl font-black shadow-md">
              👤
            </div>
            <div>
              <h2 className="text-white font-bold text-lg tracking-wide">CITIZEN DOSSIER & FINANCIAL AUDIT</h2>
              <p className="text-xs text-[#94a3b8] font-mono">
                Verified identification · Portfolio valuation · Secure transaction records
              </p>
            </div>
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

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 px-6 py-2.5 border-b border-[#1e293b] bg-[#0a0e17]">
          <button
            onClick={() => {
              soundManager.playClick();
              setActiveTab('overview');
            }}
            className={`px-4 py-1.5 rounded-xl text-xs font-semibold font-mono transition-all ${
              activeTab === 'overview'
                ? 'bg-[#f59e0b] text-[#0a0e17] shadow-md font-bold'
                : 'text-[#94a3b8] hover:text-white hover:bg-[#1e293b]'
            }`}
          >
            DOSSIER OVERVIEW
          </button>
          <button
            onClick={() => {
              soundManager.playClick();
              setActiveTab('ledger');
            }}
            className={`px-4 py-1.5 rounded-xl text-xs font-semibold font-mono transition-all ${
              activeTab === 'ledger'
                ? 'bg-[#f59e0b] text-[#0a0e17] shadow-md font-bold'
                : 'text-[#94a3b8] hover:text-white hover:bg-[#1e293b]'
            }`}
          >
            FINANCIAL TRANSACTION LEDGER ({ledger.length})
          </button>
          <button
            onClick={() => {
              soundManager.playClick();
              setActiveTab('trophies');
            }}
            className={`px-4 py-1.5 rounded-xl text-xs font-semibold font-mono transition-all ${
              activeTab === 'trophies'
                ? 'bg-[#f59e0b] text-[#0a0e17] shadow-md font-bold'
                : 'text-[#94a3b8] hover:text-white hover:bg-[#1e293b]'
            }`}
          >
            TROPHY & HIGHLIGHTS
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Identity Banner */}
              <div className="bg-[#121824] border border-[#1e293b] p-5 rounded-2xl flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#0284c7] to-[#0f172a] border border-[#38bdf8]/50 flex items-center justify-center font-black text-2xl text-white shadow-xl">
                    {profile.displayName.substring(0, 2).toUpperCase()}
                  </div>
                  <div>
                    {isEditingName ? (
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={tempName}
                          onChange={(e) => setTempName(e.target.value)}
                          className="bg-[#0a0e17] border border-[#f59e0b] px-3 py-1 rounded-lg text-white font-bold text-sm outline-none font-mono"
                        />
                        <button
                          onClick={handleSaveName}
                          className="px-3 py-1 bg-[#f59e0b] text-[#0a0e17] font-bold text-xs rounded-lg font-mono"
                        >
                          Save
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <h3 className="text-white font-bold text-xl">{profile.displayName}</h3>
                        <button
                          onClick={() => setIsEditingName(true)}
                          className="text-[11px] font-mono text-[#38bdf8] hover:underline"
                        >
                          [Edit Call-sign]
                        </button>
                      </div>
                    )}
                    <div className="text-xs font-mono text-[#94a3b8] mt-1 flex items-center gap-2">
                      <span>Account ID: {profile.id}</span>
                      <span>·</span>
                      <span className="text-[#10b981]">Citizen Status: Good Standing</span>
                    </div>
                  </div>
                </div>

                <div className={`px-4 py-2 rounded-xl border font-mono text-xs font-bold text-center ${rank.color}`}>
                  <div className="text-[10px] text-[#94a3b8] uppercase">COMPETITIVE RANK</div>
                  <div>{rank.name}</div>
                  <div className="text-xs">{profile.duelRating} MMR</div>
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono text-xs">
                <div className="bg-[#121824] p-4 rounded-xl border border-[#1e293b]">
                  <span className="text-[#64748b] block text-[10px]">TOTAL ESTIMATED NET WORTH</span>
                  <span className="text-xl font-bold text-[#f59e0b] tabular-nums mt-1 block">
                    {formatCoins(totalNetWorth)}
                  </span>
                </div>
                <div className="bg-[#121824] p-4 rounded-xl border border-[#1e293b]">
                  <span className="text-[#64748b] block text-[10px]">LIQUID VAULT COINS</span>
                  <span className="text-xl font-bold text-white tabular-nums mt-1 block">
                    {formatCoins(profile.vaultCoins)}
                  </span>
                </div>
                <div className="bg-[#121824] p-4 rounded-xl border border-[#1e293b]">
                  <span className="text-[#64748b] block text-[10px]">VAULT DUEL RECORD</span>
                  <span className="text-xl font-bold text-[#38bdf8] tabular-nums mt-1 block">
                    {profile.duelWins}W - {profile.duelLosses}L
                  </span>
                </div>
                <div className="bg-[#121824] p-4 rounded-xl border border-[#1e293b]">
                  <span className="text-[#64748b] block text-[10px]">SUCCESSFUL HEISTS</span>
                  <span className="text-xl font-bold text-[#10b981] tabular-nums mt-1 block">
                    {profile.heistsCompleted} Extractions
                  </span>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'ledger' && (
            <div className="space-y-3 font-mono text-xs">
              <div className="text-xs text-[#94a3b8] mb-2">
                All balance transactions are recorded in the immutable audit ledger.
              </div>
              {ledger.map((entry: LedgerEntry) => (
                <div
                  key={entry.id}
                  className="bg-[#121824] border border-[#1e293b] p-3 rounded-xl flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-base">
                      {entry.type === 'earn' ? '📈' : entry.type === 'spend' ? '📉' : entry.type === 'auction' ? '⚖️' : '🤝'}
                    </span>
                    <div>
                      <div className="text-white font-bold">{entry.description}</div>
                      <div className="text-[10px] text-[#64748b]">
                        ID: {entry.id} · {new Date(entry.timestamp).toLocaleTimeString()}
                      </div>
                    </div>
                  </div>

                  <div className={`font-bold tabular-nums text-sm ${entry.type === 'earn' ? 'text-[#10b981]' : 'text-[#ef4444]'}`}>
                    {entry.type === 'earn' ? '+' : '-'}{entry.amount.toLocaleString()} {entry.currency}
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'trophies' && (
            <div className="space-y-4">
              <h3 className="text-white font-bold text-sm font-mono">
                🏆 PERSONAL TROPHY & CITIZEN MILESTONES
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 font-mono text-xs">
                <div className="bg-[#121824] border border-[#1e293b] p-4 rounded-xl">
                  <div className="text-2xl mb-1">🥇</div>
                  <div className="text-white font-bold">Founding Pioneer</div>
                  <div className="text-[11px] text-[#94a3b8] mt-1">Entered Vaultbound during official genesis release.</div>
                </div>
                <div className="bg-[#121824] border border-[#1e293b] p-4 rounded-xl">
                  <div className="text-2xl mb-1">⚔️</div>
                  <div className="text-white font-bold">Duel Strategist</div>
                  <div className="text-[11px] text-[#94a3b8] mt-1">Achieved Platinum tier in competitive Vault Duel arena.</div>
                </div>
                <div className="bg-[#121824] border border-[#1e293b] p-4 rounded-xl">
                  <div className="text-2xl mb-1">🕵️</div>
                  <div className="text-white font-bold">Shadow Phantom</div>
                  <div className="text-[11px] text-[#94a3b8] mt-1">Successfully cracked a high-security syndicate vault.</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
