/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { AuctionListing, CollectibleItem } from '../types/game';
import { soundManager } from '../audio/soundManager';
import { initItemInspectorCanvas } from '../engine/collectibleViewer';
import { formatCoins } from '../state/economyConfig';

interface GrandAuctionHouseModalProps {
  auctions: AuctionListing[];
  inventory: CollectibleItem[];
  userCoins: number;
  userName: string;
  onPlaceBid: (auctionId: string, bidAmount: number) => void;
  onCreateAuction: (item: CollectibleItem, startingPrice: number, durationMinutes: number) => void;
  onClose: () => void;
}

export const GrandAuctionHouseModal: React.FC<GrandAuctionHouseModalProps> = ({
  auctions,
  inventory,
  userCoins,
  userName,
  onPlaceBid,
  onCreateAuction,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'live' | 'create' | 'rules'>('live');
  const [selectedAuction, setSelectedAuction] = useState<AuctionListing | null>(auctions[0] || null);
  const [customBidAmount, setCustomBidAmount] = useState<number>(0);
  const [filterRarity, setFilterRarity] = useState<string>('all');
  const [now, setNow] = useState(Date.now());
  const [bidError, setBidError] = useState<string | null>(null);
  const [bidSuccess, setBidSuccess] = useState<string | null>(null);

  // Create auction state
  const [selectedItemToList, setSelectedItemToList] = useState<CollectibleItem | null>(null);
  const [createStartPrice, setCreateStartPrice] = useState<number>(500);
  const [createDuration, setCreateDuration] = useState<number>(5);

  const previewContainerRef = useRef<HTMLDivElement>(null);

  // Clock tick for countdown
  useEffect(() => {
    const timer = setInterval(() => {
      setNow(Date.now());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Update default bid amount when selected auction changes
  useEffect(() => {
    if (selectedAuction) {
      setCustomBidAmount(selectedAuction.currentBid + 150);
      setBidError(null);
      setBidSuccess(null);
    }
  }, [selectedAuction]);

  // Mount 3D item inspector for selected auction
  useEffect(() => {
    if (!previewContainerRef.current || !selectedAuction) return;
    const cleanup = initItemInspectorCanvas(previewContainerRef.current, selectedAuction.item);
    return cleanup;
  }, [selectedAuction, activeTab]);

  const handleBid = () => {
    if (!selectedAuction) return;
    if (customBidAmount <= selectedAuction.currentBid) {
      setBidError(`Bid must exceed current bid of ${selectedAuction.currentBid.toLocaleString()} VC`);
      return;
    }
    if (customBidAmount > userCoins) {
      setBidError(`Insufficient Vault Coins! You have ${userCoins.toLocaleString()} VC.`);
      return;
    }
    soundManager.playAuctionGavel();
    onPlaceBid(selectedAuction.id, customBidAmount);
    setBidSuccess(`Bid of ${customBidAmount.toLocaleString()} VC placed! You are currently the highest bidder.`);
    setBidError(null);
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItemToList) return;
    if (createStartPrice < 50) {
      setBidError('Starting price must be at least 50 VC');
      return;
    }
    soundManager.playAuctionGavel();
    onCreateAuction(selectedItemToList, createStartPrice, createDuration);
    setSelectedItemToList(null);
    setActiveTab('live');
  };

  const formatRemainingTime = (end: number) => {
    const diff = Math.max(0, Math.floor((end - now) / 1000));
    const m = Math.floor(diff / 60);
    const s = diff % 60;
    return `${m}m ${s < 10 ? '0' : ''}${s}s`;
  };

  const filteredAuctions = auctions.filter((a) => {
    if (filterRarity === 'all') return true;
    return a.item.rarity === filterRarity;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 animate-fade-in font-sans">
      <div className="bg-[#0a0e17] border border-[#f59e0b]/40 rounded-3xl w-full max-w-5xl h-[88vh] flex flex-col shadow-[0_0_50px_rgba(245,158,11,0.15)] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#1e293b] bg-[#0d1322]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#d97706] to-[#fbbf24] flex items-center justify-center text-[#0a0e17] text-lg font-black shadow-md">
              ⚖️
            </div>
            <div>
              <h2 className="text-white font-bold text-lg tracking-wide flex items-center gap-2">
                <span>GRAND AUCTION HOUSE</span>
                <span className="text-[10px] font-mono uppercase bg-[#f59e0b]/20 text-[#f59e0b] px-2 py-0.5 rounded border border-[#f59e0b]/40">
                  LIVE GAVEL
                </span>
              </h2>
              <p className="text-xs text-[#94a3b8] font-mono">
                Real-time competitive bids · Escrow protected · Anti-sniping enabled
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

        {/* Tab Navigation */}
        <div className="flex items-center justify-between px-6 py-2.5 border-b border-[#1e293b] bg-[#0a0e17]">
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                soundManager.playClick();
                setActiveTab('live');
              }}
              className={`px-4 py-1.5 rounded-xl text-xs font-semibold font-mono transition-all ${
                activeTab === 'live'
                  ? 'bg-[#f59e0b] text-[#0a0e17] shadow-md font-bold'
                  : 'text-[#94a3b8] hover:text-white hover:bg-[#1e293b]'
              }`}
            >
              LIVE AUCTIONS ({auctions.length})
            </button>
            <button
              onClick={() => {
                soundManager.playClick();
                setActiveTab('create');
              }}
              className={`px-4 py-1.5 rounded-xl text-xs font-semibold font-mono transition-all ${
                activeTab === 'create'
                  ? 'bg-[#f59e0b] text-[#0a0e17] shadow-md font-bold'
                  : 'text-[#94a3b8] hover:text-white hover:bg-[#1e293b]'
              }`}
            >
              CREATE AUCTION
            </button>
            <button
              onClick={() => {
                soundManager.playClick();
                setActiveTab('rules');
              }}
              className={`px-4 py-1.5 rounded-xl text-xs font-semibold font-mono transition-all ${
                activeTab === 'rules'
                  ? 'bg-[#f59e0b] text-[#0a0e17] shadow-md font-bold'
                  : 'text-[#94a3b8] hover:text-white hover:bg-[#1e293b]'
              }`}
            >
              RULES & ESCROW
            </button>
          </div>

          {activeTab === 'live' && (
            <div className="flex items-center gap-1.5 text-xs font-mono">
              <span className="text-[#64748b]">RARITY:</span>
              {['all', 'mythic', 'legendary', 'epic', 'rare'].map((r) => (
                <button
                  key={r}
                  onClick={() => setFilterRarity(r)}
                  className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold transition-colors ${
                    filterRarity === r ? 'bg-[#38bdf8] text-[#0a0e17]' : 'text-[#94a3b8] hover:bg-[#1e293b]'
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
          {activeTab === 'live' && (
            <>
              {/* Left Column: List of Live Auctions */}
              <div className="w-full md:w-1/2 border-r border-[#1e293b] overflow-y-auto p-4 space-y-2.5">
                {filteredAuctions.map((auc) => {
                  const isSelected = selectedAuction?.id === auc.id;
                  const isHighest = auc.highestBidder === userName;
                  const isEndingSoon = auc.endTime - now < 120000;

                  return (
                    <div
                      key={auc.id}
                      onClick={() => {
                        soundManager.playClick();
                        setSelectedAuction(auc);
                      }}
                      className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                        isSelected
                          ? 'bg-[#1e293b]/70 border-[#f59e0b] shadow-[0_0_15px_rgba(245,158,11,0.2)]'
                          : 'bg-[#0f172a]/60 border-[#1e293b] hover:border-[#38bdf8]/40 hover:bg-[#121824]'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="w-12 h-12 rounded-xl flex items-center justify-center text-lg font-bold shadow-inner"
                          style={{
                            backgroundColor: (auc.item.color || '#f59e0b') + '25',
                            border: `1px solid ${auc.item.color || '#f59e0b'}`,
                          }}
                        >
                          {auc.item.category === 'artifact' ? '💎' : auc.item.category === 'statue' ? '👑' : '📦'}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-white font-bold text-sm">{auc.item.name}</span>
                            {auc.item.serialNumber && (
                              <span className="text-[10px] font-mono text-[#f59e0b] bg-[#f59e0b]/15 px-1 rounded">
                                #{auc.item.serialNumber}/{auc.item.maxSupply}
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-[#94a3b8] font-mono flex items-center gap-2 mt-0.5">
                            <span className="uppercase text-[#38bdf8] font-semibold">{auc.item.rarity}</span>
                            <span>·</span>
                            <span>Seller: {auc.sellerName}</span>
                          </div>
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="text-white font-mono font-bold text-sm tabular-nums text-[#f59e0b]">
                          {auc.currentBid.toLocaleString()} VC
                        </div>
                        <div
                          className={`text-[11px] font-mono font-semibold tabular-nums mt-0.5 ${
                            isEndingSoon ? 'text-[#ef4444] animate-pulse' : 'text-[#94a3b8]'
                          }`}
                        >
                          ⏳ {formatRemainingTime(auc.endTime)}
                        </div>
                        {isHighest && (
                          <div className="text-[10px] text-[#10b981] font-mono font-bold mt-0.5">
                            YOU ARE HIGHEST
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Right Column: 3D Item Preview & Bidding Panel */}
              <div className="w-full md:w-1/2 flex flex-col justify-between p-6 bg-[#0a0e17]/50">
                {selectedAuction ? (
                  <>
                    <div>
                      {/* 3D Inspect Canvas */}
                      <div className="relative w-full h-48 rounded-2xl bg-[#070a10] border border-[#1e293b] overflow-hidden mb-4 shadow-inner">
                        <div ref={previewContainerRef} className="w-full h-full" />
                        <div className="absolute top-2.5 left-3 text-[10px] font-mono uppercase bg-[#0a0e17]/80 text-[#94a3b8] px-2 py-0.5 rounded border border-[#1e293b]">
                          Interactive 360° Inspection
                        </div>
                        <div className="absolute top-2.5 right-3 text-[10px] font-mono uppercase bg-[#f59e0b]/20 text-[#f59e0b] px-2 py-0.5 rounded border border-[#f59e0b]/40 font-bold">
                          {selectedAuction.item.rarity}
                        </div>
                      </div>

                      {/* Item Details */}
                      <div>
                        <h3 className="text-white font-bold text-lg">{selectedAuction.item.name}</h3>
                        <p className="text-xs text-[#94a3b8] mt-1 leading-relaxed">{selectedAuction.item.description}</p>
                        <div className="grid grid-cols-2 gap-3 mt-3 font-mono text-xs">
                          <div className="bg-[#121824] p-2.5 rounded-xl border border-[#1e293b]">
                            <span className="text-[#64748b] block text-[10px]">ESTIMATED VALUATION</span>
                            <span className="text-white font-bold">{selectedAuction.item.estimatedValue.toLocaleString()} VC</span>
                          </div>
                          <div className="bg-[#121824] p-2.5 rounded-xl border border-[#1e293b]">
                            <span className="text-[#64748b] block text-[10px]">TOTAL BIDS PLACED</span>
                            <span className="text-[#38bdf8] font-bold">{selectedAuction.bidCount} bids</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Bid Action Form */}
                    <div className="mt-4 pt-4 border-t border-[#1e293b] space-y-3">
                      {bidError && (
                        <div className="text-xs text-[#ef4444] bg-[#ef4444]/10 border border-[#ef4444]/30 p-2.5 rounded-xl font-mono">
                          ⚠️ {bidError}
                        </div>
                      )}
                      {bidSuccess && (
                        <div className="text-xs text-[#10b981] bg-[#10b981]/10 border border-[#10b981]/30 p-2.5 rounded-xl font-mono">
                          ✅ {bidSuccess}
                        </div>
                      )}

                      <div className="flex items-center gap-3">
                        <div className="flex-1">
                          <label className="text-[11px] font-mono text-[#94a3b8] block mb-1">
                            ENTER BID AMOUNT (VC):
                          </label>
                          <input
                            type="number"
                            value={customBidAmount}
                            onChange={(e) => setCustomBidAmount(Number(e.target.value))}
                            className="w-full bg-[#121824] border border-[#1e293b] focus:border-[#f59e0b] rounded-xl px-4 py-2 text-white font-mono font-bold text-sm outline-none"
                          />
                        </div>

                        {/* Quick increment buttons */}
                        <div className="flex items-end gap-1.5">
                          {[+100, +250, +500].map((inc) => (
                            <button
                              key={inc}
                              type="button"
                              onClick={() => {
                                soundManager.playClick();
                                setCustomBidAmount(selectedAuction.currentBid + inc);
                              }}
                              className="px-2.5 py-2 bg-[#1e293b] hover:bg-[#334155] text-xs font-mono text-white rounded-xl font-bold"
                            >
                              +{inc}
                            </button>
                          ))}
                        </div>
                      </div>

                      <button
                        onClick={handleBid}
                        className="w-full bg-gradient-to-r from-[#d97706] to-[#f59e0b] hover:from-[#b45309] hover:to-[#d97706] text-[#0a0e17] font-black text-sm tracking-wide py-3 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2"
                      >
                        <span>STRIKE GAVEL · PLACE BID</span>
                        <span className="font-mono text-xs font-bold">({customBidAmount.toLocaleString()} VC)</span>
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="flex items-center justify-center h-full text-[#64748b] font-mono text-xs">
                    Select an auction from the list to inspect.
                  </div>
                )}
              </div>
            </>
          )}

          {activeTab === 'create' && (
            <div className="flex-1 p-6 overflow-y-auto">
              <h3 className="text-white font-bold text-base mb-1">List an Eligible Item for Public Auction</h3>
              <p className="text-xs text-[#94a3b8] font-mono mb-6">
                Choose a tradable collectible from your personal vault, set your starting price, and enter the live bidding floor.
              </p>

              <form onSubmit={handleCreateSubmit} className="max-w-xl space-y-5">
                <div>
                  <label className="text-xs font-mono text-[#94a3b8] block mb-2">
                    SELECT COLLECTIBLE FROM INVENTORY:
                  </label>
                  <div className="grid grid-cols-2 gap-3 max-h-48 overflow-y-auto p-1">
                    {inventory
                      .filter((i) => i.tradable)
                      .map((item) => {
                        const isChosen = selectedItemToList?.id === item.id;
                        return (
                          <div
                            key={item.id}
                            onClick={() => {
                              soundManager.playClick();
                              setSelectedItemToList(item);
                              setCreateStartPrice(Math.round(item.estimatedValue * 0.7));
                            }}
                            className={`p-3 rounded-xl border cursor-pointer flex items-center gap-2.5 transition-all ${
                              isChosen
                                ? 'bg-[#f59e0b]/15 border-[#f59e0b]'
                                : 'bg-[#121824] border-[#1e293b] hover:border-[#38bdf8]/50'
                            }`}
                          >
                            <span className="text-lg">💎</span>
                            <div>
                              <div className="text-white font-bold text-xs">{item.name}</div>
                              <div className="text-[10px] text-[#f59e0b] font-mono">
                                Est. {item.estimatedValue.toLocaleString()} VC
                              </div>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </div>

                {selectedItemToList && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-mono text-[#94a3b8] block mb-1">STARTING PRICE (VC):</label>
                      <input
                        type="number"
                        value={createStartPrice}
                        onChange={(e) => setCreateStartPrice(Number(e.target.value))}
                        className="w-full bg-[#121824] border border-[#1e293b] focus:border-[#f59e0b] rounded-xl px-4 py-2 text-white font-mono text-sm outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-mono text-[#94a3b8] block mb-1">DURATION (MINUTES):</label>
                      <select
                        value={createDuration}
                        onChange={(e) => setCreateDuration(Number(e.target.value))}
                        className="w-full bg-[#121824] border border-[#1e293b] focus:border-[#f59e0b] rounded-xl px-4 py-2 text-white font-mono text-sm outline-none"
                      >
                        <option value={3}>3 Minutes (Flash)</option>
                        <option value={5}>5 Minutes (Standard)</option>
                        <option value={10}>10 Minutes (Prime)</option>
                      </select>
                    </div>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={!selectedItemToList}
                  className="w-full bg-[#f59e0b] hover:bg-[#d97706] disabled:opacity-40 text-[#0a0e17] font-black text-sm py-3 rounded-xl transition-all"
                >
                  START PUBLIC AUCTION
                </button>
              </form>
            </div>
          )}

          {activeTab === 'rules' && (
            <div className="flex-1 p-6 overflow-y-auto space-y-4 font-mono text-xs text-[#94a3b8]">
              <h3 className="text-white font-bold text-base font-sans">Grand Auction House Protocol & Escrow</h3>
              <p>
                1. <b>Escrow Protection:</b> When you place a bid, the amount is held securely in vault escrow. If another player outbids you, your coins are refunded immediately to your available balance.
              </p>
              <p>
                2. <b>Anti-Sniping Protocol:</b> Bids placed during the final 30 seconds of an auction will automatically extend the remaining timer by +30 seconds, preventing last-second bot sniping and preserving legitimate competition.
              </p>
              <p>
                3. <b>Authentic Minting:</b> Collectibles marked with serial numbers are unique across the entire city instance. Once won, ownership transfers atomically on the secure backend ledger.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
