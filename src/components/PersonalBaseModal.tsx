/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { PlacedFurniture, CollectibleItem } from '../types/game';
import { soundManager } from '../audio/soundManager';

interface PersonalBaseModalProps {
  baseTier: number;
  placedFurniture: PlacedFurniture[];
  inventory: CollectibleItem[];
  userCoins: number;
  onUpgradeBase: (nextTier: number, cost: number) => void;
  onUpdateFurniture: (furniture: PlacedFurniture[]) => void;
  onClose: () => void;
}

export const PersonalBaseModal: React.FC<PersonalBaseModalProps> = ({
  baseTier,
  placedFurniture,
  inventory,
  userCoins,
  onUpgradeBase,
  onUpdateFurniture,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'decor' | 'pedestals' | 'storage' | 'upgrade'>('decor');
  const [notification, setNotification] = useState<string | null>(null);

  const upgradeCost = baseTier === 1 ? 3500 : 8000;
  const maxTier = 3;

  const handleUpgrade = () => {
    if (baseTier >= maxTier) return;
    if (userCoins < upgradeCost) {
      setNotification(`Need ${upgradeCost.toLocaleString()} VC to upgrade base to Tier ${baseTier + 1}!`);
      return;
    }
    soundManager.playCoin();
    onUpgradeBase(baseTier + 1, upgradeCost);
    setNotification(`Penthouse base expanded to Tier ${baseTier + 1}! Floor space and vault displays upgraded.`);
  };

  const handleAssignDisplay = (furnitureId: string, itemId: string) => {
    soundManager.playClick();
    const updated = placedFurniture.map((f) => {
      if (f.id === furnitureId) {
        return { ...f, displayedItemId: itemId };
      }
      return f;
    });
    onUpdateFurniture(updated);
    setNotification('Pedestal display updated with selected collectible!');
  };

  const handleMoveFurniture = (furnitureId: string, dx: number, dz: number) => {
    soundManager.playFootstep();
    const updated = placedFurniture.map((f) => {
      if (f.id === furnitureId) {
        return {
          ...f,
          x: Math.max(-6.5, Math.min(6.5, f.x + dx)),
          z: Math.max(-6.5, Math.min(6.5, f.z + dz)),
        };
      }
      return f;
    });
    onUpdateFurniture(updated);
  };

  const handleRotateFurniture = (furnitureId: string) => {
    soundManager.playClick();
    const updated = placedFurniture.map((f) => {
      if (f.id === furnitureId) {
        return { ...f, rotation: (f.rotation + Math.PI / 4) % (Math.PI * 2) };
      }
      return f;
    });
    onUpdateFurniture(updated);
  };

  const handlePlaceNewItem = (item: CollectibleItem) => {
    soundManager.playClick();
    let fType: PlacedFurniture['type'] = 'table';
    if (item.modelType === 'sofa') fType = 'sofa';
    else if (item.modelType === 'pedestal') fType = 'pedestal';
    else if (item.modelType === 'safe') fType = 'safe';
    else if (item.modelType === 'plant') fType = 'plant';
    else if (item.modelType === 'rug') fType = 'rug';

    const newPlaced: PlacedFurniture = {
      id: 'f_' + Math.random().toString(36).substring(2, 8),
      furnitureId: item.id,
      name: item.name,
      type: fType,
      x: (Math.random() - 0.5) * 4,
      z: (Math.random() - 0.5) * 4,
      rotation: 0,
    };
    onUpdateFurniture([...placedFurniture, newPlaced]);
    setNotification(`Placed ${item.name} inside your home living area!`);
  };

  const handleRemoveFurniture = (fId: string) => {
    soundManager.playClick();
    const updated = placedFurniture.filter((f) => f.id !== fId);
    onUpdateFurniture(updated);
    setNotification('Item returned to base storage.');
  };

  const pedestals = placedFurniture.filter((f) => f.type === 'pedestal');
  const rareArtifacts = inventory.filter((i) => i.category === 'artifact' || i.category === 'statue');
  const unplacedFurniture = inventory.filter((i) => i.category === 'furniture');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 animate-fade-in font-sans">
      <div className="bg-[#0a0e17] border border-[#10b981]/40 rounded-3xl w-full max-w-4xl h-[85vh] flex flex-col shadow-[0_0_50px_rgba(16,185,129,0.15)] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#1e293b] bg-[#0c141c]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#059669] to-[#34d399] flex items-center justify-center text-[#0a0e17] text-xl font-black shadow-md">
              🌆
            </div>
            <div>
              <h2 className="text-white font-bold text-lg tracking-wide flex items-center gap-2">
                <span>PERSONAL BASE & INTERIOR BUILDER</span>
                <span className="text-[10px] font-mono uppercase bg-[#10b981]/20 text-[#34d399] px-2 py-0.5 rounded border border-[#10b981]/40 font-bold">
                  TIER {baseTier}
                </span>
              </h2>
              <p className="text-xs text-[#94a3b8] font-mono">
                Real-time 3D home decorator · Arrange furnishings & showcase rare relics
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

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 px-6 py-2.5 border-b border-[#1e293b] bg-[#0a0e17]">
          <button
            onClick={() => {
              soundManager.playClick();
              setActiveTab('decor');
            }}
            className={`px-4 py-1.5 rounded-xl text-xs font-semibold font-mono transition-all ${
              activeTab === 'decor'
                ? 'bg-[#10b981] text-[#0a0e17] shadow-md font-bold'
                : 'text-[#94a3b8] hover:text-white hover:bg-[#1e293b]'
            }`}
          >
            ACTIVE FURNITURE ({placedFurniture.length})
          </button>
          <button
            onClick={() => {
              soundManager.playClick();
              setActiveTab('storage');
            }}
            className={`px-4 py-1.5 rounded-xl text-xs font-semibold font-mono transition-all ${
              activeTab === 'storage'
                ? 'bg-[#10b981] text-[#0a0e17] shadow-md font-bold'
                : 'text-[#94a3b8] hover:text-white hover:bg-[#1e293b]'
            }`}
          >
            PLACE FROM STORAGE ({unplacedFurniture.length})
          </button>
          <button
            onClick={() => {
              soundManager.playClick();
              setActiveTab('pedestals');
            }}
            className={`px-4 py-1.5 rounded-xl text-xs font-semibold font-mono transition-all ${
              activeTab === 'pedestals'
                ? 'bg-[#10b981] text-[#0a0e17] shadow-md font-bold'
                : 'text-[#94a3b8] hover:text-white hover:bg-[#1e293b]'
            }`}
          >
            RELIC PEDESTALS ({pedestals.length})
          </button>
          <button
            onClick={() => {
              soundManager.playClick();
              setActiveTab('upgrade');
            }}
            className={`px-4 py-1.5 rounded-xl text-xs font-semibold font-mono transition-all ${
              activeTab === 'upgrade'
                ? 'bg-[#10b981] text-[#0a0e17] shadow-md font-bold'
                : 'text-[#94a3b8] hover:text-white hover:bg-[#1e293b]'
            }`}
          >
            EXPAND PENTHOUSE
          </button>
        </div>

        {notification && (
          <div className="mx-6 mt-3 text-xs bg-[#121824] border border-[#10b981]/40 text-[#34d399] p-2.5 rounded-xl font-mono flex items-center justify-between">
            <span>✨ {notification}</span>
            <button onClick={() => setNotification(null)} className="text-white hover:text-rose-400">✕</button>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'decor' && (
            <div className="space-y-4">
              <h3 className="text-white font-bold text-base">Arrange Base Furniture</h3>
              <p className="text-xs text-[#94a3b8] font-mono">
                Nudge positions or rotate items inside your penthouse living space. Changes appear in 3D in real time.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {placedFurniture.map((f) => (
                  <div key={f.id} className="bg-[#121824] border border-[#1e293b] p-4 rounded-2xl space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xl">
                          {f.type === 'sofa' ? '🛋️' : f.type === 'pedestal' ? '🏛️' : f.type === 'safe' ? '🔒' : f.type === 'plant' ? '🪴' : '🪵'}
                        </span>
                        <div>
                          <div className="text-white font-bold text-xs">{f.name}</div>
                          <div className="text-[10px] text-[#94a3b8] font-mono">
                            [{f.x.toFixed(1)}, {f.z.toFixed(1)}] · Rot: {Math.round((f.rotation * 180) / Math.PI)}°
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={() => handleRemoveFurniture(f.id)}
                        className="text-[10px] font-mono text-rose-400 hover:text-rose-300 bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/30"
                      >
                        Store Item
                      </button>
                    </div>

                    {/* Move Nudge & Rotate Buttons */}
                    <div className="flex items-center justify-between pt-2 border-t border-[#1e293b]">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleMoveFurniture(f.id, 0, -0.5)}
                          className="px-2 py-1 bg-[#1e293b] hover:bg-[#334155] text-xs font-mono text-white rounded-lg"
                        >
                          ▲
                        </button>
                        <button
                          onClick={() => handleMoveFurniture(f.id, 0, 0.5)}
                          className="px-2 py-1 bg-[#1e293b] hover:bg-[#334155] text-xs font-mono text-white rounded-lg"
                        >
                          ▼
                        </button>
                        <button
                          onClick={() => handleMoveFurniture(f.id, -0.5, 0)}
                          className="px-2 py-1 bg-[#1e293b] hover:bg-[#334155] text-xs font-mono text-white rounded-lg"
                        >
                          ◀
                        </button>
                        <button
                          onClick={() => handleMoveFurniture(f.id, 0.5, 0)}
                          className="px-2 py-1 bg-[#1e293b] hover:bg-[#334155] text-xs font-mono text-white rounded-lg"
                        >
                          ▶
                        </button>
                      </div>

                      <button
                        onClick={() => handleRotateFurniture(f.id)}
                        className="px-2.5 py-1 bg-[#1e293b] hover:bg-[#334155] text-xs font-mono text-[#38bdf8] rounded-lg font-bold"
                      >
                        🔄 Rotate 45°
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'storage' && (
            <div className="space-y-4">
              <h3 className="text-white font-bold text-base">Place Owned Furniture from Vault Inventory</h3>
              <p className="text-xs text-[#94a3b8] font-mono">
                Items bought from the Marketplace appear here. Click Place to deploy into your living room.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {unplacedFurniture.map((item) => (
                  <div key={item.id} className="p-3.5 rounded-2xl bg-[#121824] border border-[#1e293b] flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <span className="text-2xl">
                        {item.modelType === 'sofa' ? '🛋️' : item.modelType === 'pedestal' ? '🏛️' : item.modelType === 'safe' ? '🔒' : '🪴'}
                      </span>
                      <div>
                        <div className="text-white font-bold text-xs">{item.name}</div>
                        <div className="text-[10px] text-[#f59e0b] font-mono uppercase">{item.rarity}</div>
                      </div>
                    </div>

                    <button
                      onClick={() => handlePlaceNewItem(item)}
                      className="px-3.5 py-1.5 bg-[#10b981] hover:bg-[#059669] text-[#0a0e17] font-bold text-xs rounded-xl font-mono"
                    >
                      PLACE
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'pedestals' && (
            <div className="space-y-4">
              <h3 className="text-white font-bold text-base">Showcase Owned Collectibles on Display Pedestals</h3>
              <p className="text-xs text-[#94a3b8] font-mono">
                Select an artifact from your vault to project upon your marble display column for visitors to admire.
              </p>

              {pedestals.map((ped) => {
                const currentDisplay = inventory.find((i) => i.id === ped.displayedItemId);

                return (
                  <div key={ped.id} className="bg-[#121824] border border-[#1e293b] p-4 rounded-2xl space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="text-white font-bold text-sm flex items-center gap-2">
                        <span>🏛️ {ped.name}</span>
                        {currentDisplay ? (
                          <span className="text-xs text-[#f59e0b] font-mono font-normal">
                            (Currently displaying: {currentDisplay.name})
                          </span>
                        ) : (
                          <span className="text-xs text-[#64748b] font-mono">(Empty Display)</span>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-2">
                      {rareArtifacts.map((art) => {
                        const isChosen = ped.displayedItemId === art.id;
                        return (
                          <button
                            key={art.id}
                            onClick={() => handleAssignDisplay(ped.id, art.id)}
                            className={`p-2.5 rounded-xl border text-left transition-all ${
                              isChosen
                                ? 'bg-[#10b981]/20 border-[#10b981]'
                                : 'bg-[#0f172a] border-[#1e293b] hover:border-[#38bdf8]/50'
                            }`}
                          >
                            <div className="text-white font-bold text-xs truncate">{art.name}</div>
                            <div className="text-[10px] text-[#f59e0b] font-mono uppercase">{art.rarity}</div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {activeTab === 'upgrade' && (
            <div className="max-w-xl mx-auto space-y-6 text-center py-4">
              <div className="text-5xl">🏰</div>
              <div>
                <h3 className="text-white font-bold text-2xl">
                  {baseTier === 1
                    ? 'Upgrade to Executive Penthouse (Tier 2)'
                    : baseTier === 2
                    ? 'Upgrade to Sovereign Citadel (Tier 3)'
                    : 'Maximum Base Tier Reached'}
                </h3>
                <p className="text-xs text-[#94a3b8] font-mono mt-2 leading-relaxed">
                  Upgrading expands 3D loft perimeter, unlocks additional pedestals for legendary relics, and expands vault storage limits.
                </p>
              </div>

              {baseTier < maxTier ? (
                <div className="bg-[#121824] border border-[#1e293b] p-5 rounded-2xl space-y-3 text-left font-mono text-xs">
                  <div className="flex justify-between text-white">
                    <span className="text-[#94a3b8]">Required Coins:</span>
                    <span className="font-bold text-[#f59e0b]">{upgradeCost.toLocaleString()} VC</span>
                  </div>
                  <div className="flex justify-between text-white">
                    <span className="text-[#94a3b8]">Your Available Coins:</span>
                    <span className="font-bold">{userCoins.toLocaleString()} VC</span>
                  </div>
                  <button
                    onClick={handleUpgrade}
                    className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#059669] to-[#10b981] hover:opacity-95 text-[#0a0e17] font-black text-sm tracking-wide transition-all shadow-lg"
                  >
                    CONFIRM PENTHOUSE EXPANSION
                  </button>
                </div>
              ) : (
                <div className="text-sm font-mono text-[#10b981] bg-[#10b981]/15 border border-[#10b981]/30 p-4 rounded-xl">
                  👑 You possess the apex Sovereign Citadel in Vaultbound.
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
