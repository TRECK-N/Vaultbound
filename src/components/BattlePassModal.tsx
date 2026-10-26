/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { BattlePassTier, DailyMission } from '../types/game';
import { soundManager } from '../audio/soundManager';

interface BattlePassModalProps {
  tiers: BattlePassTier[];
  missions: DailyMission[];
  currentXp: number;
  onClaimTier: (tierNumber: number) => void;
  onClaimMission: (missionId: string) => void;
  onClose: () => void;
}

export const BattlePassModal: React.FC<BattlePassModalProps> = ({
  tiers,
  missions,
  currentXp,
  onClaimTier,
  onClaimMission,
  onClose,
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 animate-fade-in font-sans">
      <div className="bg-[#0a0e17] border border-[#38bdf8]/40 rounded-3xl w-full max-w-4xl h-[85vh] flex flex-col shadow-[0_0_50px_rgba(56,189,248,0.15)] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#1e293b] bg-[#0d1322]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#0284c7] to-[#38bdf8] flex items-center justify-center text-[#0a0e17] text-xl font-black shadow-md">
              ⭐
            </div>
            <div>
              <h2 className="text-white font-bold text-lg tracking-wide flex items-center gap-2">
                <span>SEASON 1: VAULT SYNDICATE PASS</span>
                <span className="text-[10px] font-mono uppercase bg-[#38bdf8]/20 text-[#38bdf8] px-2 py-0.5 rounded border border-[#38bdf8]/40 font-bold">
                  FREE PASS ACTIVE
                </span>
              </h2>
              <p className="text-xs text-[#94a3b8] font-mono">
                Current Season XP: <b className="text-white tabular-nums">{currentXp} XP</b>
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

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Daily Missions Panel */}
          <div>
            <h3 className="text-white font-bold text-sm mb-3 font-mono flex items-center gap-2">
              <span>📋 DAILY SYNDICATE DIRECTIVES</span>
              <span className="text-[10px] text-[#38bdf8] bg-[#38bdf8]/15 px-2 py-0.5 rounded">
                RESETS DAILY
              </span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {missions.map((m) => {
                const canClaim = m.progress >= m.goal && !m.claimed;

                return (
                  <div key={m.id} className="bg-[#121824] border border-[#1e293b] p-3.5 rounded-2xl flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-white font-bold text-xs">{m.title}</span>
                        <span className="text-[10px] font-mono text-[#f59e0b] font-bold">
                          +{m.rewardCoins} VC · +{m.rewardXp} XP
                        </span>
                      </div>
                      <p className="text-[11px] text-[#94a3b8] mt-1">{m.desc}</p>
                    </div>

                    <div className="flex items-center justify-between mt-3 pt-2 border-t border-[#1e293b]">
                      <span className="text-[10px] font-mono text-[#64748b]">
                        Progress: {m.progress} / {m.goal}
                      </span>
                      {m.claimed ? (
                        <span className="text-[10px] font-mono text-[#10b981] font-bold">COMPLETED ✅</span>
                      ) : canClaim ? (
                        <button
                          onClick={() => {
                            soundManager.playCoin();
                            onClaimMission(m.id);
                          }}
                          className="px-3 py-1 bg-[#10b981] text-[#0a0e17] font-bold font-mono text-[10px] rounded-lg"
                        >
                          CLAIM REWARD
                        </button>
                      ) : (
                        <span className="text-[10px] font-mono text-[#64748b]">IN PROGRESS</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Tier Track */}
          <div>
            <h3 className="text-white font-bold text-sm mb-3 font-mono">
              🏆 BATTLE PASS TIERS TRACK
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              {tiers.map((t) => {
                const isUnlocked = currentXp >= t.requiredXp;
                const canClaim = isUnlocked && !t.claimed;

                return (
                  <div
                    key={t.tier}
                    className={`p-3.5 rounded-2xl border flex flex-col justify-between transition-all ${
                      t.claimed
                        ? 'bg-[#121824]/50 border-[#1e293b] opacity-60'
                        : isUnlocked
                        ? 'bg-[#38bdf8]/10 border-[#38bdf8] shadow-[0_0_15px_rgba(56,189,248,0.2)]'
                        : 'bg-[#0f172a] border-[#1e293b]'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-mono font-bold text-[#38bdf8]">
                          TIER {t.tier}
                        </span>
                        <span className="text-[10px] font-mono text-[#64748b]">
                          {t.requiredXp} XP
                        </span>
                      </div>

                      <div className="my-3 text-center">
                        <div className="text-3xl mb-1">
                          {t.rewardType === 'coins' ? '💰' : t.rewardType === 'tokens' ? '🎟️' : '💎'}
                        </div>
                        <div className="text-white font-bold text-xs truncate">
                          {t.rewardType === 'coins'
                            ? `${t.rewardAmount} Coins`
                            : t.rewardType === 'tokens'
                            ? `${t.rewardAmount} Tokens`
                            : t.rewardItem?.name}
                        </div>
                      </div>
                    </div>

                    <div>
                      {t.claimed ? (
                        <div className="w-full py-1.5 text-center text-[10px] font-mono text-[#64748b] bg-[#1e293b] rounded-lg">
                          CLAIMED
                        </div>
                      ) : canClaim ? (
                        <button
                          onClick={() => {
                            soundManager.playCoin();
                            onClaimTier(t.tier);
                          }}
                          className="w-full py-1.5 bg-[#38bdf8] hover:bg-[#0284c7] text-[#0a0e17] font-bold text-[10px] font-mono rounded-lg transition-all"
                        >
                          CLAIM
                        </button>
                      ) : (
                        <div className="w-full py-1.5 text-center text-[10px] font-mono text-[#64748b] bg-[#1e293b]/50 rounded-lg">
                          LOCKED
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
