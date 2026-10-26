/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { MarketListing, CollectibleItem, ItemRarity, ItemCategory } from '../types/game';
import { soundManager } from '../audio/soundManager';
import { formatCoins } from '../state/economyConfig';
import { dynamicMarketService } from '../state/dynamicMarket';

interface MarketplaceModalProps {
  marketListings: MarketListing[];
  inventory: CollectibleItem[];
  userCoins: number;
  userName: string;
  onBuyItem: (listingId: string) => void;
  onListItem: (item: CollectibleItem, price: number) => void;
  onClose: () => void;
}

export const MarketplaceModal: React.FC<MarketplaceModalProps> = ({
  marketListings,
  inventory,
  userCoins,
  userName,
  onBuyItem,
  onListItem,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'browse' | 'sell'>('browse');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterRarity, setFilterRarity] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedSellItem, setSelectedSellItem] = useState<CollectibleItem | null>(null);
  const [sellPrice, setSellPrice] = useState<number>(500);
  const [notification, setNotification] = useState<string | null>(null);

  const handleBuy = (listing: MarketListing) => {
    if (listing.sellerName === userName) {
      setNotification('You cannot buy your own listed item.');
      return;
    }
    if (userCoins < listing.price) {
      setNotification(`Insufficient Vault Coins! Need ${formatCoins(listing.price)}.`);
      return;
    }
    soundManager.playCoin();
    onBuyItem(listing.id);
    setNotification(`Successfully purchased ${listing.item.name} for ${formatCoins(listing.price)}! Check your inventory and base.`);
  };

  const handleSellSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSellItem) return;
    if (sellPrice < 20) {
      setNotification('Minimum listing price is 20 VC.');
      return;
    }
    soundManager.playCoin();
    onListItem(selectedSellItem, sellPrice);
    setNotification(`Listed ${selectedSellItem.name} on the marketplace for ${formatCoins(sellPrice)}!`);
    setSelectedSellItem(null);
    setActiveTab('browse');
  };

  const filteredListings = marketListings.filter((l) => {
    const matchCategory = filterCategory === 'all' || l.item.category === filterCategory;
    const matchRarity = filterRarity === 'all' || l.item.rarity === filterRarity;
    const matchSearch =
      l.item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.item.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.item.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCategory && matchRarity && matchSearch;
  });

  const getRarityBadgeColor = (rarity: ItemRarity) => {
    switch (rarity) {
      case 'mythic': return 'bg-rose-500/20 text-rose-400 border-rose-500/40';
      case 'legendary': return 'bg-amber-500/20 text-amber-400 border-amber-500/40';
      case 'epic': return 'bg-purple-500/20 text-purple-400 border-purple-500/40';
      case 'rare': return 'bg-cyan-500/20 text-cyan-400 border-cyan-500/40';
      case 'uncommon': return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40';
      default: return 'bg-slate-500/20 text-slate-400 border-slate-500/40';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 animate-fade-in font-sans">
      <div className="bg-[#0a0e17] border border-[#38bdf8]/40 rounded-3xl w-full max-w-5xl h-[88vh] flex flex-col shadow-[0_0_60px_rgba(56,189,248,0.15)] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#1e293b] bg-[#0d1322]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#0284c7] to-[#38bdf8] flex items-center justify-center text-[#0a0e17] text-lg font-black shadow-md">
              🏪
            </div>
            <div>
              <h2 className="text-white font-bold text-lg tracking-wide flex items-center gap-2">
                <span>PLAYER MARKETPLACE</span>
                <span className="text-[10px] font-mono uppercase bg-[#38bdf8]/20 text-[#38bdf8] px-2 py-0.5 rounded border border-[#38bdf8]/40 font-bold">
                  INSTANT TRADING
                </span>
              </h2>
              <p className="text-xs text-[#94a3b8] font-mono">
                Browse citizen listings · Furniture, clothing, and rare artifacts
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="bg-[#121824] border border-[#1e293b] px-3.5 py-1.5 rounded-xl font-mono text-xs">
              <span className="text-[#94a3b8]">YOUR BALANCE: </span>
              <span className="text-[#f59e0b] font-bold tabular-nums">{formatCoins(userCoins)}</span>
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

        {/* Navigation & Category Filter Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-2.5 border-b border-[#1e293b] bg-[#0a0e17]">
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                soundManager.playClick();
                setActiveTab('browse');
              }}
              className={`px-4 py-1.5 rounded-xl text-xs font-semibold font-mono transition-all ${
                activeTab === 'browse'
                  ? 'bg-[#38bdf8] text-[#0a0e17] shadow-md font-bold'
                  : 'text-[#94a3b8] hover:text-white hover:bg-[#1e293b]'
              }`}
            >
              BROWSE MARKET ({marketListings.length})
            </button>
            <button
              onClick={() => {
                soundManager.playClick();
                setActiveTab('sell');
              }}
              className={`px-4 py-1.5 rounded-xl text-xs font-semibold font-mono transition-all ${
                activeTab === 'sell'
                  ? 'bg-[#38bdf8] text-[#0a0e17] shadow-md font-bold'
                  : 'text-[#94a3b8] hover:text-white hover:bg-[#1e293b]'
              }`}
            >
              SELL AN ITEM
            </button>
          </div>

          {activeTab === 'browse' && (
            <div className="flex flex-wrap items-center gap-2 font-mono text-xs">
              {/* Category Pills */}
              <div className="flex items-center gap-1 bg-[#121824] p-1 rounded-xl border border-[#1e293b]">
                {['all', 'clothing', 'furniture', 'artifact', 'statue', 'accessory'].map((c) => (
                  <button
                    key={c}
                    onClick={() => {
                      soundManager.playClick();
                      setFilterCategory(c);
                    }}
                    className={`px-2.5 py-1 rounded-lg text-[10px] uppercase font-bold transition-colors ${
                      filterCategory === c ? 'bg-[#38bdf8] text-[#0a0e17]' : 'text-[#94a3b8] hover:text-white'
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>

              {/* Search input */}
              <input
                type="text"
                placeholder="Search items..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-[#121824] border border-[#1e293b] focus:border-[#38bdf8] px-3 py-1 rounded-xl text-xs text-white outline-none w-36"
              />
            </div>
          )}
        </div>

        {notification && (
          <div className="mx-6 mt-3 text-xs bg-[#121824] border border-[#38bdf8]/40 text-[#38bdf8] p-2.5 rounded-xl font-mono flex items-center justify-between">
            <span>ℹ️ {notification}</span>
            <button onClick={() => setNotification(null)} className="text-white hover:text-rose-400">✕</button>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'browse' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredListings.map((listing) => (
                <div
                  key={listing.id}
                  className="bg-[#0f172a]/70 border border-[#1e293b] hover:border-[#38bdf8]/60 p-4 rounded-2xl flex flex-col justify-between transition-all group"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">
                          {listing.item.category === 'clothing' ? '👕' : listing.item.category === 'furniture' ? '🛋️' : listing.item.category === 'artifact' ? '💎' : '👑'}
                        </span>
                        <div>
                          <h4 className="text-white font-bold text-sm group-hover:text-[#38bdf8] transition-colors">
                            {listing.item.name}
                          </h4>
                          <span className="text-[10px] text-[#94a3b8] font-mono">
                            Seller: <b className="text-white">{listing.sellerName}</b>
                          </span>
                        </div>
                      </div>
                      <span className={`text-[9px] uppercase font-mono px-2 py-0.5 rounded border font-bold ${getRarityBadgeColor(listing.item.rarity)}`}>
                        {listing.item.rarity}
                      </span>
                    </div>

                    <p className="text-xs text-[#94a3b8] leading-relaxed line-clamp-2 my-2">
                      {listing.item.description}
                    </p>

                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      {listing.item.serialNumber && (
                        <div className="text-[10px] font-mono text-[#f59e0b] bg-[#f59e0b]/10 border border-[#f59e0b]/20 px-2 py-0.5 rounded inline-block">
                          Mint #{listing.item.serialNumber} / {listing.item.maxSupply}
                        </div>
                      )}

                      {(() => {
                        const marketAsset = dynamicMarketService.getAssets().find((a) =>
                          listing.item.name.toLowerCase().includes(a.name.toLowerCase().split(' ')[0]) ||
                          a.name.toLowerCase().includes(listing.item.name.toLowerCase().split(' ')[0])
                        );
                        if (!marketAsset) return null;
                        const isUp = marketAsset.change24h >= 0;
                        return (
                          <div className="text-[10px] font-mono bg-[#0d9488]/20 text-[#2dd4bf] border border-[#14b8a6]/40 px-2 py-0.5 rounded flex items-center gap-1 font-semibold">
                            <span>📈 Market:</span>
                            <span className="font-bold">{formatCoins(marketAsset.currentPrice)}</span>
                            <span className={isUp ? 'text-[#10b981]' : 'text-[#ef4444]'}>
                              ({isUp ? '+' : ''}{marketAsset.change24h.toFixed(1)}%)
                            </span>
                          </div>
                        );
                      })()}
                    </div>
                  </div>

                  <div className="pt-3 border-t border-[#1e293b] flex items-center justify-between mt-3">
                    <div>
                      <span className="text-[10px] font-mono text-[#64748b] block">FIXED PRICE</span>
                      <span className="text-[#f59e0b] font-mono font-bold text-base tabular-nums">
                        {formatCoins(listing.price)}
                      </span>
                    </div>

                    <button
                      onClick={() => handleBuy(listing)}
                      className="px-4 py-2 bg-gradient-to-r from-[#0284c7] to-[#38bdf8] hover:from-[#0369a1] hover:to-[#0284c7] text-[#0a0e17] font-black text-xs rounded-xl shadow-md transition-all font-mono"
                    >
                      BUY INSTANT
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="max-w-xl mx-auto space-y-5">
              <h3 className="text-white font-bold text-base">List Item for Instant Purchase</h3>
              <p className="text-xs text-[#94a3b8] font-mono">
                Select an eligible item from your personal inventory. A standard 5% syndicate transaction fee applies when the item sells.
              </p>

              <form onSubmit={handleSellSubmit} className="space-y-4">
                <div>
                  <label className="text-xs font-mono text-[#94a3b8] block mb-2">
                    SELECT ELIGIBLE ITEM:
                  </label>
                  <div className="grid grid-cols-2 gap-3 max-h-56 overflow-y-auto p-1">
                    {inventory.filter((i) => i.tradable).map((item) => {
                      const isChosen = selectedSellItem?.id === item.id;
                      return (
                        <div
                          key={item.id}
                          onClick={() => {
                            soundManager.playClick();
                            setSelectedSellItem(item);
                            setSellPrice(item.estimatedValue);
                          }}
                          className={`p-3 rounded-xl border cursor-pointer flex items-center gap-2.5 transition-all ${
                            isChosen
                              ? 'bg-[#38bdf8]/15 border-[#38bdf8]'
                              : 'bg-[#121824] border-[#1e293b] hover:border-[#38bdf8]/40'
                          }`}
                        >
                          <span className="text-lg">💎</span>
                          <div>
                            <div className="text-white font-bold text-xs">{item.name}</div>
                            <div className="text-[10px] text-[#f59e0b] font-mono">
                              Est. {formatCoins(item.estimatedValue)}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {selectedSellItem && (
                  <div>
                    <label className="text-xs font-mono text-[#94a3b8] block mb-1">SET ASKING PRICE (VC):</label>
                    <input
                      type="number"
                      value={sellPrice}
                      onChange={(e) => setSellPrice(Number(e.target.value))}
                      className="w-full bg-[#121824] border border-[#1e293b] focus:border-[#38bdf8] rounded-xl px-4 py-2 text-white font-mono text-sm outline-none"
                    />
                    <div className="text-[11px] text-[#64748b] font-mono mt-1">
                      Syndicate fee (5%): {formatCoins(Math.round(sellPrice * 0.05))} · You receive: {formatCoins(Math.round(sellPrice * 0.95))}
                    </div>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={!selectedSellItem}
                  className="w-full bg-[#38bdf8] hover:bg-[#0284c7] disabled:opacity-40 text-[#0a0e17] font-black text-sm py-3 rounded-xl transition-all"
                >
                  POST MARKETPLACE LISTING
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
