/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { CollectibleItem, ItemCategory } from '../types/game';
import { soundManager } from '../audio/soundManager';
import { initItemInspectorCanvas } from '../engine/collectibleViewer';
import { formatCoins } from '../state/economyConfig';
import { dynamicMarketService } from '../state/dynamicMarket';

interface InventoryModalProps {
  inventory: CollectibleItem[];
  userCoins: number;
  onToggleProtect: (itemId: string) => void;
  onEquipClothing?: (item: CollectibleItem) => void;
  onGoToBase?: () => void;
  onClose: () => void;
}

export const InventoryModal: React.FC<InventoryModalProps> = ({
  inventory,
  userCoins,
  onToggleProtect,
  onEquipClothing,
  onGoToBase,
  onClose,
}) => {
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [selectedItem, setSelectedItem] = useState<CollectibleItem | null>(inventory[0] || null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const previewRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!previewRef.current || !selectedItem) return;
    const cleanup = initItemInspectorCanvas(previewRef.current, selectedItem);
    return cleanup;
  }, [selectedItem]);

  const filteredItems = inventory.filter((item) => {
    if (activeCategory === 'all') return true;
    return item.category === activeCategory;
  });

  const handleEquip = () => {
    if (!selectedItem) return;
    soundManager.playCoin();
    onEquipClothing?.(selectedItem);
    setFeedback(`Equipped ${selectedItem.name}! Your 3D avatar has been updated.`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 animate-fade-in font-sans">
      <div className="bg-[#0a0e17] border border-[#f59e0b]/40 rounded-3xl w-full max-w-5xl h-[88vh] flex flex-col shadow-[0_0_50px_rgba(245,158,11,0.15)] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#1e293b] bg-[#0d1322]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#d97706] to-[#f59e0b] flex items-center justify-center text-[#0a0e17] text-lg font-black shadow-md">
              🎒
            </div>
            <div>
              <h2 className="text-white font-bold text-lg tracking-wide flex items-center gap-2">
                <span>PERSONAL VAULT INVENTORY</span>
                <span className="text-[10px] font-mono uppercase bg-[#f59e0b]/20 text-[#f59e0b] px-2 py-0.5 rounded border border-[#f59e0b]/40">
                  {inventory.length} POSSESSIONS
                </span>
              </h2>
              <p className="text-xs text-[#94a3b8] font-mono">
                Cryptographically secured assets & rare serial collectibles
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="bg-[#121824] border border-[#1e293b] px-3.5 py-1.5 rounded-xl font-mono text-xs">
              <span className="text-[#94a3b8]">PORTFOLIO VALUE: </span>
              <span className="text-[#f59e0b] font-bold tabular-nums">
                {formatCoins(inventory.reduce((acc, i) => acc + i.estimatedValue, 0))}
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

        {/* Category Navigation */}
        <div className="flex items-center gap-2 px-6 py-2.5 border-b border-[#1e293b] bg-[#0a0e17]">
          {['all', 'clothing', 'furniture', 'artifact', 'statue', 'accessory'].map((cat) => (
            <button
              key={cat}
              onClick={() => {
                soundManager.playClick();
                setActiveCategory(cat);
              }}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold font-mono uppercase transition-all ${
                activeCategory === cat
                  ? 'bg-[#f59e0b] text-[#0a0e17] shadow-md font-bold'
                  : 'text-[#94a3b8] hover:text-white hover:bg-[#1e293b]'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {feedback && (
          <div className="mx-6 mt-3 text-xs bg-[#121824] border border-[#f59e0b]/40 text-[#f59e0b] p-2.5 rounded-xl font-mono flex items-center justify-between">
            <span>✨ {feedback}</span>
            <button onClick={() => setFeedback(null)} className="text-white hover:text-rose-400">✕</button>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
          {/* Left Grid */}
          <div className="w-full md:w-3/5 border-r border-[#1e293b] overflow-y-auto p-4 grid grid-cols-2 sm:grid-cols-3 gap-3">
            {filteredItems.map((item) => {
              const isSelected = selectedItem?.id === item.id;

              return (
                <div
                  key={item.id}
                  onClick={() => {
                    soundManager.playClick();
                    setSelectedItem(item);
                  }}
                  className={`p-3 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                    isSelected
                      ? 'bg-[#1e293b]/70 border-[#f59e0b] shadow-[0_0_15px_rgba(245,158,11,0.25)]'
                      : 'bg-[#0f172a]/70 border-[#1e293b] hover:border-[#38bdf8]/50 hover:bg-[#121824]'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <span className="text-2xl">
                      {item.category === 'clothing' ? '👕' : item.category === 'furniture' ? '🛋️' : item.category === 'artifact' ? '💎' : '👑'}
                    </span>
                    <span className="text-[9px] uppercase font-mono px-1.5 py-0.5 rounded bg-[#1e293b] text-[#38bdf8] font-bold">
                      {item.rarity}
                    </span>
                  </div>

                  <div className="my-2">
                    <div className="text-white font-bold text-xs truncate">{item.name}</div>
                    <div className="text-[10px] text-[#f59e0b] font-mono mt-0.5">
                      Est. {formatCoins(item.estimatedValue)}
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[10px] font-mono text-[#64748b]">
                    {item.serialNumber ? <span>#{item.serialNumber}</span> : <span />}
                    {item.protected && <span>🔒 Protected</span>}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Right Inspector */}
          <div className="w-full md:w-2/5 p-6 flex flex-col justify-between overflow-y-auto bg-[#0a0e17]/50">
            {selectedItem ? (
              <>
                <div>
                  <div className="relative w-full h-52 rounded-2xl bg-[#070a10] border border-[#1e293b] overflow-hidden mb-4 shadow-inner">
                    <div ref={previewRef} className="w-full h-full" />
                    <div className="absolute top-2.5 left-3 text-[10px] font-mono uppercase bg-[#0a0e17]/80 text-[#94a3b8] px-2 py-0.5 rounded border border-[#1e293b]">
                      360° Real-time 3D View
                    </div>
                  </div>

                  <h3 className="text-white font-bold text-lg">{selectedItem.name}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] uppercase font-mono font-bold text-[#f59e0b] bg-[#f59e0b]/15 px-2 py-0.5 rounded border border-[#f59e0b]/30">
                      {selectedItem.rarity}
                    </span>
                    <span className="text-xs text-[#94a3b8] font-mono capitalize">
                      Category: {selectedItem.category}
                    </span>
                  </div>

                  <p className="text-xs text-[#94a3b8] leading-relaxed mt-3">
                    {selectedItem.description}
                  </p>

                  <div className="grid grid-cols-2 gap-2 mt-4 font-mono text-xs">
                    <div className="bg-[#121824] p-2.5 rounded-xl border border-[#1e293b]">
                      <span className="text-[#64748b] block text-[10px]">BASE ESTIMATE</span>
                      <span className="text-white font-bold">{formatCoins(selectedItem.estimatedValue)}</span>
                    </div>
                    <div className="bg-[#121824] p-2.5 rounded-xl border border-[#1e293b]">
                      <span className="text-[#64748b] block text-[10px]">ACQUIRED FROM</span>
                      <span className="text-[#38bdf8] font-bold truncate block">{selectedItem.acquisitionSource}</span>
                    </div>
                  </div>

                  {(() => {
                    const marketAsset = dynamicMarketService.getAssets().find((a) =>
                      selectedItem.name.toLowerCase().includes(a.name.toLowerCase().split(' ')[0]) ||
                      a.name.toLowerCase().includes(selectedItem.name.toLowerCase().split(' ')[0])
                    );
                    if (!marketAsset) return null;
                    const isUp = marketAsset.change24h >= 0;
                    return (
                      <div className="mt-2 p-2.5 bg-[#0d9488]/15 border border-[#14b8a6]/40 rounded-xl flex items-center justify-between text-xs font-mono">
                        <div className="flex items-center gap-1.5 text-[#2dd4bf] font-bold">
                          <span>📈 Live Market Ticker:</span>
                          <span>{formatCoins(marketAsset.currentPrice)}</span>
                        </div>
                        <span className={`text-[11px] font-bold ${isUp ? 'text-[#10b981]' : 'text-[#ef4444]'}`}>
                          {isUp ? '▲ +' : '▼ '}{marketAsset.change24h.toFixed(1)}%
                        </span>
                      </div>
                    );
                  })()}
                </div>

                <div className="pt-4 border-t border-[#1e293b] space-y-2 mt-4">
                  {/* Context action based on item type */}
                  {(selectedItem.category === 'clothing' || selectedItem.category === 'accessory') && (
                    <button
                      onClick={handleEquip}
                      className="w-full py-2.5 rounded-xl bg-[#38bdf8] hover:bg-[#0284c7] text-[#0a0e17] font-black font-mono text-xs transition-all shadow-md"
                    >
                      👕 EQUIP TO AVATAR
                    </button>
                  )}

                  {selectedItem.category === 'furniture' && (
                    <button
                      onClick={() => {
                        soundManager.playClick();
                        onClose();
                        onGoToBase?.();
                      }}
                      className="w-full py-2.5 rounded-xl bg-[#10b981] hover:bg-[#059669] text-[#0a0e17] font-black font-mono text-xs transition-all shadow-md"
                    >
                      🏠 GO TO BASE TO PLACE
                    </button>
                  )}

                  <button
                    onClick={() => {
                      soundManager.playClick();
                      onToggleProtect(selectedItem.id);
                    }}
                    className={`w-full py-2.5 rounded-xl font-mono text-xs font-bold transition-all border ${
                      selectedItem.protected
                        ? 'bg-[#10b981]/20 border-[#10b981] text-[#34d399]'
                        : 'bg-[#121824] border-[#1e293b] text-[#94a3b8] hover:text-white'
                    }`}
                  >
                    {selectedItem.protected ? '🔒 PROTECTED FROM TRADES / RAIDS' : '🔓 CLICK TO PROTECT IN VAULT'}
                  </button>
                </div>
              </>
            ) : (
              <div className="text-xs text-[#64748b] font-mono text-center my-auto">
                Select an item to inspect.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
