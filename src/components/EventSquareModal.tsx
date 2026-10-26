/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { CollectibleItem } from '../types/game';
import { soundManager } from '../audio/soundManager';

interface EventSquareModalProps {
  userTokens: number;
  onRedeemItem: (item: CollectibleItem, costTokens: number) => void;
  onClose: () => void;
}

export const EventSquareModal: React.FC<EventSquareModalProps> = ({
  userTokens,
  onRedeemItem,
  onClose,
}) => {
  const [notification, setNotification] = useState<string | null>(null);

  const eventItems: { item: CollectibleItem; costTokens: number }[] = [
    {
      item: {
        id: 'ev_item_chalice',
        name: 'Sunday Treasure Relic Chalice',
        category: 'artifact',
        rarity: 'mythic',
        description: 'Exclusively minted for the active Sunday Treasure Market event. Emits golden plasma.',
        estimatedValue: 6000,
        tradable: true,
        protected: true,
        serialNumber: 15,
        maxSupply: 50,
        modelType: 'chalice',
        color: '#f59e0b',
        accentColor: '#38bdf8',
        acquisitionSource: 'Sunday Treasure Market Event',
      },
      costTokens: 250,
    },
    {
      item: {
        id: 'ev_item_dragon',
        name: 'Celestial Dragon Statuette',
        category: 'statue',
        rarity: 'legendary',
        description: 'Sculpted from celestial meteorite alloy. An emblem of elite syndicate status.',
        estimatedValue: 4200,
        tradable: true,
        protected: true,
        serialNumber: 38,
        maxSupply: 100,
        modelType: 'dragon_statue',
        color: '#10b981',
        accentColor: '#fbbf24',
        acquisitionSource: 'Sunday Treasure Market Event',
      },
      costTokens: 180,
    },
    {
      item: {
        id: 'ev_item_jacket',
        name: 'Midnight Relics Stealth Vest',
        category: 'clothing',
        clothingSlot: 'top',
        rarity: 'epic',
        description: 'Ballistic ceramic plate carrier with integrated tactical HUD uplink.',
        estimatedValue: 1800,
        tradable: true,
        protected: false,
        modelType: 'jacket',
        color: '#1e293b',
        accentColor: '#a855f7',
        acquisitionSource: 'Midnight Relics Exhibition',
      },
      costTokens: 100,
    },
  ];

  const handleRedeem = (entry: { item: CollectibleItem; costTokens: number }) => {
    if (userTokens < entry.costTokens) {
      setNotification(`Need ${entry.costTokens} Event Tokens! You currently have ${userTokens} ET.`);
      return;
    }
    soundManager.playCoin();
    onRedeemItem(entry.item, entry.costTokens);
    setNotification(`Successfully redeemed ${entry.item.name}! Added to your Vault.`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 animate-fade-in font-sans">
      <div className="bg-[#0a0e17] border border-[#a855f7]/40 rounded-3xl w-full max-w-4xl h-[85vh] flex flex-col shadow-[0_0_50px_rgba(168,85,247,0.15)] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#1e293b] bg-[#120a1f]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#7c3aed] to-[#c084fc] flex items-center justify-center text-[#0a0e17] text-xl font-black shadow-md">
              🎪
            </div>
            <div>
              <h2 className="text-white font-bold text-lg tracking-wide flex items-center gap-2">
                <span>EVENT SQUARE · SUNDAY TREASURE MARKET</span>
                <span className="text-[10px] font-mono uppercase bg-[#a855f7]/20 text-[#c084fc] px-2 py-0.5 rounded border border-[#a855f7]/40 font-bold">
                  ACTIVE FESTIVAL
                </span>
              </h2>
              <p className="text-xs text-[#94a3b8] font-mono">
                Redeem exclusive limited-serial artifacts with Event Tokens (ET)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="bg-[#121824] border border-[#1e293b] px-3.5 py-1.5 rounded-xl font-mono text-xs">
              <span className="text-[#94a3b8]">YOUR TOKENS: </span>
              <span className="text-[#c084fc] font-bold tabular-nums">{userTokens} ET</span>
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

        {notification && (
          <div className="mx-6 mt-3 text-xs bg-[#121824] border border-[#a855f7]/40 text-[#c084fc] p-2.5 rounded-xl font-mono">
            ✨ {notification}
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <div>
            <h3 className="text-white font-bold text-sm mb-3 font-mono">
              💎 LIMITED EDITION FESTIVAL REDEMPTIONS
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {eventItems.map((entry) => (
                <div
                  key={entry.item.id}
                  className="bg-[#121824] border border-[#1e293b] hover:border-[#a855f7] p-4 rounded-2xl flex flex-col justify-between transition-all"
                >
                  <div>
                    <div className="flex items-start justify-between mb-2">
                      <span className="text-3xl">
                        {entry.item.category === 'artifact' ? '🏆' : entry.item.category === 'statue' ? '🐉' : '🦺'}
                      </span>
                      <span className="text-[9px] uppercase font-mono px-2 py-0.5 rounded bg-[#a855f7]/20 text-[#c084fc] font-bold border border-[#a855f7]/40">
                        {entry.item.rarity}
                      </span>
                    </div>

                    <h4 className="text-white font-bold text-sm">{entry.item.name}</h4>
                    <p className="text-xs text-[#94a3b8] mt-1 line-clamp-3 leading-relaxed">
                      {entry.item.description}
                    </p>

                    <div className="text-[10px] font-mono text-[#f59e0b] bg-[#f59e0b]/10 border border-[#f59e0b]/20 px-2 py-0.5 rounded inline-block mt-2">
                      Serial #{entry.item.serialNumber} / {entry.item.maxSupply}
                    </div>
                  </div>

                  <div className="pt-3 border-t border-[#1e293b] mt-4 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-mono text-[#64748b] block">TOKEN COST</span>
                      <span className="text-[#c084fc] font-mono font-bold text-sm">
                        {entry.costTokens} ET
                      </span>
                    </div>

                    <button
                      onClick={() => handleRedeem(entry)}
                      className="px-3.5 py-1.5 bg-gradient-to-r from-[#7c3aed] to-[#a855f7] hover:from-[#6d28d9] hover:to-[#7c3aed] text-white font-bold text-xs rounded-xl font-mono shadow-md"
                    >
                      REDEEM
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Event Schedule Calendar */}
          <div className="bg-[#0e1424] border border-[#1e293b] p-4 rounded-2xl">
            <h4 className="text-white font-bold text-xs font-mono uppercase mb-3 text-[#38bdf8]">
              📅 VAULTBOUND EVENT CALENDAR
            </h4>
            <div className="space-y-2 text-xs font-mono">
              <div className="flex justify-between py-1.5 border-b border-[#1e293b]/60">
                <span className="text-white">Sunday Treasure Market & Rare Relics</span>
                <span className="text-[#10b981] font-bold">ACTIVE NOW</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-[#1e293b]/60">
                <span className="text-white">Vault Duel Double MMR Championship</span>
                <span className="text-[#94a3b8]">Starts in 2 Days</span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-white">Midnight Syndicate Infiltration Gala</span>
                <span className="text-[#94a3b8]">Starts in 5 Days</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
