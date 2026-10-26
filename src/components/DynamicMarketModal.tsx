/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  dynamicMarketService,
  MarketAsset,
  MarketAssetCategory,
  PortfolioPosition,
  PriceAlert,
} from '../state/dynamicMarket';
import { formatCoins } from '../state/economyConfig';
import { soundManager } from '../audio/soundManager';

interface DynamicMarketModalProps {
  userCoins: number;
  onUpdateCoins: (newCoins: number) => void;
  onClose: () => void;
}

export const DynamicMarketModal: React.FC<DynamicMarketModalProps> = ({
  userCoins,
  onUpdateCoins,
  onClose,
}) => {
  const [, setTick] = useState(0);
  const [activeTab, setActiveTab] = useState<'board' | 'portfolio' | 'watchlist' | 'alerts'>('board');
  const [selectedAssetId, setSelectedAssetId] = useState<string | null>(null);

  // Filters & Sorting
  const [categoryFilter, setCategoryFilter] = useState<'all' | MarketAssetCategory>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'gainers' | 'losers' | 'price_high' | 'price_low' | 'volatility'>('gainers');

  // Trade form state
  const [buyQuantity, setBuyQuantity] = useState(1);
  const [sellQuantity, setSellQuantity] = useState(1);
  const [tradeMessage, setTradeMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // New alert form state
  const [showAlertModal, setShowAlertModal] = useState(false);
  const [alertTargetPrice, setAlertTargetPrice] = useState(300);
  const [alertDirection, setAlertDirection] = useState<'above' | 'below'>('above');

  // Time range for chart (5m, 1h, 24h)
  const [chartRange, setChartRange] = useState<'5m' | '1h' | '24h'>('1h');

  // Subscribe to live market updates
  useEffect(() => {
    const unsub = dynamicMarketService.subscribe(() => {
      setTick((t) => t + 1);
    });
    return unsub;
  }, []);

  // Handle ESC key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (selectedAssetId) {
          setSelectedAssetId(null);
        } else {
          onClose();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedAssetId, onClose]);

  const allAssets = dynamicMarketService.getAssets();
  const portfolio = dynamicMarketService.getPortfolio();
  const portfolioSummary = dynamicMarketService.getPortfolioSummary();
  const activeEvent = dynamicMarketService.getActiveEvent();
  const watchlist = dynamicMarketService.getWatchlist();
  const alerts = dynamicMarketService.getAlerts();
  const transactions = dynamicMarketService.getTransactions();

  const selectedAsset = selectedAssetId ? dynamicMarketService.getAsset(selectedAssetId) : null;
  const currentPosition: PortfolioPosition | undefined = selectedAssetId ? portfolio[selectedAssetId] : undefined;

  // Filter & sort assets
  const filteredAssets = allAssets
    .filter((a) => {
      if (activeTab === 'watchlist' && !watchlist.has(a.id)) return false;
      if (categoryFilter !== 'all' && a.category !== categoryFilter) return false;
      if (searchQuery.trim() && !a.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'gainers') return b.change24h - a.change24h;
      if (sortBy === 'losers') return a.change24h - b.change24h;
      if (sortBy === 'price_high') return b.currentPrice - a.currentPrice;
      if (sortBy === 'price_low') return a.currentPrice - b.currentPrice;
      if (sortBy === 'volatility') return b.volatility - a.volatility;
      return 0;
    });

  // Trade actions
  const handleBuy = () => {
    if (!selectedAsset) return;
    const res = dynamicMarketService.buyPosition(selectedAsset.id, buyQuantity, userCoins);
    if (res.success) {
      soundManager.playCoin();
      onUpdateCoins(res.newCoins);
      setTradeMessage({
        text: `Successfully bought ${buyQuantity}x ${selectedAsset.name} for ${formatCoins(res.transaction!.totalAmount)}!`,
        type: 'success',
      });
      setTimeout(() => setTradeMessage(null), 4000);
    } else {
      soundManager.playAlarm();
      setTradeMessage({ text: res.error || 'Purchase failed', type: 'error' });
      setTimeout(() => setTradeMessage(null), 4000);
    }
  };

  const handleSell = () => {
    if (!selectedAsset) return;
    const res = dynamicMarketService.sellPosition(selectedAsset.id, sellQuantity, userCoins);
    if (res.success) {
      soundManager.playCoin();
      onUpdateCoins(res.newCoins);
      const pnlSign = res.realizedPnL >= 0 ? `+${res.realizedPnL}` : `${res.realizedPnL}`;
      setTradeMessage({
        text: `Sold ${sellQuantity}x ${selectedAsset.name}! Realized P&L: ${pnlSign} VC. Received ${formatCoins(res.transaction!.totalAmount)}.`,
        type: 'success',
      });
      setTimeout(() => setTradeMessage(null), 4000);
    } else {
      soundManager.playAlarm();
      setTradeMessage({ text: res.error || 'Sale failed', type: 'error' });
      setTimeout(() => setTradeMessage(null), 4000);
    }
  };

  const handleCreateAlert = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAsset) return;
    soundManager.playClick();
    dynamicMarketService.addAlert(selectedAsset.id, alertTargetPrice, alertDirection);
    setShowAlertModal(false);
    setTradeMessage({
      text: `Alert created: notify when ${selectedAsset.name} is ${alertDirection} ${alertTargetPrice} VC!`,
      type: 'success',
    });
    setTimeout(() => setTradeMessage(null), 4000);
  };

  // Sparkline renderer for compact card charts
  const renderSparkline = (points: { price: number }[], isPositive: boolean) => {
    if (!points || points.length < 2) return null;
    const prices = points.map((p) => p.price);
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    const range = max - min || 1;
    const w = 90;
    const h = 26;

    const coords = prices.map((p, idx) => {
      const x = (idx / (prices.length - 1)) * w;
      const y = h - ((p - min) / range) * (h - 4) - 2;
      return `${x},${y}`;
    });

    const strokeColor = isPositive ? '#10b981' : '#ef4444';
    return (
      <svg className="w-[90px] h-[26px] overflow-visible" viewBox={`0 0 ${w} ${h}`}>
        <polyline
          fill="none"
          stroke={strokeColor}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          points={coords.join(' ')}
        />
      </svg>
    );
  };

  // Detailed Interactive SVG Price Chart
  const renderDetailedChart = (asset: MarketAsset) => {
    let history = asset.priceHistory;
    if (chartRange === '5m') history = history.slice(-10);
    else if (chartRange === '1h') history = history.slice(-25);

    if (history.length < 2) {
      return (
        <div className="h-44 flex items-center justify-center text-xs font-mono text-[#64748b]">
          Awaiting more market ticks to draw chart...
        </div>
      );
    }

    const prices = history.map((p) => p.price);
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    const range = max - min || 1;
    const width = 520;
    const height = 150;

    const points = history.map((pt, idx) => {
      const x = (idx / (history.length - 1)) * (width - 40) + 20;
      const y = height - 20 - ((pt.price - min) / range) * (height - 45);
      return { x, y, price: pt.price, time: pt.timestamp };
    });

    const polylineStr = points.map((p) => `${p.x},${p.y}`).join(' ');
    const isBull = asset.change24h >= 0;
    const color = isBull ? '#10b981' : '#ef4444';

    // Area fill polygon
    const areaStr = `${points[0].x},${height - 15} ${polylineStr} ${points[points.length - 1].x},${height - 15}`;

    return (
      <div className="w-full relative flex flex-col items-center">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-44 overflow-visible">
          <defs>
            <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity="0.3" />
              <stop offset="100%" stopColor={color} stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          <line x1="20" y1="20" x2={width - 20} y2="20" stroke="#1e293b" strokeDasharray="3 3" />
          <line x1="20" y1={height / 2} x2={width - 20} y2={height / 2} stroke="#1e293b" strokeDasharray="3 3" />
          <line x1="20" y1={height - 20} x2={width - 20} y2={height - 20} stroke="#1e293b" />

          {/* Price labels */}
          <text x="22" y="16" fill="#64748b" fontSize="10" fontFamily="monospace">
            MAX: {max} VC
          </text>
          <text x="22" y={height - 24} fill="#64748b" fontSize="10" fontFamily="monospace">
            MIN: {min} VC
          </text>

          {/* Gradient area */}
          <polygon points={areaStr} fill="url(#chartGradient)" />

          {/* Main price line */}
          <polyline
            fill="none"
            stroke={color}
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            points={polylineStr}
          />

          {/* Latest point pulse */}
          {points.length > 0 && (
            <circle
              cx={points[points.length - 1].x}
              cy={points[points.length - 1].y}
              r="4"
              fill={color}
              stroke="#0a0e17"
              strokeWidth="2"
            />
          )}
        </svg>

        {/* Range selectors */}
        <div className="flex items-center gap-1.5 self-end mt-1 text-[10px] font-mono">
          <span className="text-[#64748b]">Range:</span>
          {(['5m', '1h', '24h'] as const).map((r) => (
            <button
              key={r}
              onClick={() => {
                soundManager.playClick();
                setChartRange(r);
              }}
              className={`px-2 py-0.5 rounded ${
                chartRange === r
                  ? 'bg-[#38bdf8] text-[#0a0e17] font-bold'
                  : 'bg-[#121927] text-[#94a3b8] hover:text-white'
              }`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md animate-fade-in font-sans pointer-events-auto">
      <div className="bg-[#0a0f1d] border border-[#1e293b] hover:border-[#f59e0b]/40 rounded-3xl w-full max-w-5xl h-[88vh] flex flex-col shadow-[0_0_50px_rgba(0,0,0,0.85)] overflow-hidden transition-colors">
        {/* Top Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#1e293b] bg-[#0c1322]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#0284c7] via-[#38bdf8] to-[#f59e0b] flex items-center justify-center text-xl shadow-lg">
              📈
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-white font-black text-lg tracking-wider font-mono">
                  VAULTBOUND LIVE MARKET
                </h1>
                <span className="text-[10px] bg-[#10b981]/20 text-[#10b981] border border-[#10b981]/40 px-2 py-0.5 rounded font-mono font-bold animate-pulse">
                  SIMULATED LIVE TICK
                </span>
              </div>
              <p className="text-xs text-[#94a3b8] font-mono">
                Real-time dynamic virtual item economy & portfolio investments
              </p>
            </div>
          </div>

          {/* Right Header: Cash + Close */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 bg-[#060a12] border border-[#1e293b] px-3.5 py-1.5 rounded-xl font-mono text-xs">
              <span className="text-[#94a3b8]">Available VC:</span>
              <span className="text-[#f59e0b] font-bold text-sm tabular-nums">
                {formatCoins(userCoins)}
              </span>
            </div>

            <button
              onClick={() => {
                soundManager.playClick();
                onClose();
              }}
              className="w-9 h-9 rounded-xl bg-[#1e293b] hover:bg-[#334155] text-white flex items-center justify-center text-sm font-bold transition-colors"
              title="Close [Esc]"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Active Virtual Event Banner */}
        {activeEvent && (
          <div className="w-full bg-[#1e1b4b]/60 border-b border-[#a855f7]/30 px-6 py-2 flex items-center justify-between text-xs font-mono">
            <div className="flex items-center gap-2 text-white">
              <span className="text-sm">⚡</span>
              <span className="font-bold text-[#f59e0b]">{activeEvent.title}:</span>
              <span className="text-[#cbd5e1]">{activeEvent.description}</span>
            </div>
            <span className="text-[10px] text-[#c084fc] uppercase bg-[#0a0f1d] px-2 py-0.5 rounded border border-[#a855f7]/40">
              Category: {activeEvent.affectedCategory}
            </span>
          </div>
        )}

        {/* Global Notifications / Alert Banner */}
        {tradeMessage && (
          <div
            className={`w-full px-6 py-2.5 text-xs font-mono flex items-center justify-between transition-all ${
              tradeMessage.type === 'success'
                ? 'bg-[#064e3b]/80 border-b border-[#10b981] text-[#a7f3d0]'
                : 'bg-[#7f1d1d]/80 border-b border-[#ef4444] text-[#fecaca]'
            }`}
          >
            <span>{tradeMessage.text}</span>
            <button onClick={() => setTradeMessage(null)} className="text-white hover:opacity-80">
              ✕
            </button>
          </div>
        )}

        {/* Navigation Tabs Bar */}
        <div className="flex items-center justify-between px-6 py-2.5 border-b border-[#1e293b] bg-[#090e18] text-xs font-mono">
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                soundManager.playClick();
                setActiveTab('board');
                setSelectedAssetId(null);
              }}
              className={`px-3.5 py-1.5 rounded-xl transition-all ${
                activeTab === 'board' && !selectedAssetId
                  ? 'bg-[#f59e0b] text-[#0a0e17] font-black shadow-md'
                  : 'text-[#94a3b8] hover:text-white bg-[#121927] hover:bg-[#1e293b]'
              }`}
            >
              📊 All Assets ({allAssets.length})
            </button>

            <button
              onClick={() => {
                soundManager.playClick();
                setActiveTab('portfolio');
                setSelectedAssetId(null);
              }}
              className={`px-3.5 py-1.5 rounded-xl transition-all flex items-center gap-1.5 ${
                activeTab === 'portfolio'
                  ? 'bg-[#f59e0b] text-[#0a0e17] font-black shadow-md'
                  : 'text-[#94a3b8] hover:text-white bg-[#121927] hover:bg-[#1e293b]'
              }`}
            >
              <span>💼 My Portfolio</span>
              {portfolioSummary.positionsCount > 0 && (
                <span className="w-5 h-5 rounded-full bg-[#38bdf8] text-[#0a0e17] text-[10px] font-black flex items-center justify-center">
                  {portfolioSummary.positionsCount}
                </span>
              )}
            </button>

            <button
              onClick={() => {
                soundManager.playClick();
                setActiveTab('watchlist');
                setSelectedAssetId(null);
              }}
              className={`px-3.5 py-1.5 rounded-xl transition-all ${
                activeTab === 'watchlist'
                  ? 'bg-[#f59e0b] text-[#0a0e17] font-black shadow-md'
                  : 'text-[#94a3b8] hover:text-white bg-[#121927] hover:bg-[#1e293b]'
              }`}
            >
              ⭐ Watchlist ({watchlist.size})
            </button>

            <button
              onClick={() => {
                soundManager.playClick();
                setActiveTab('alerts');
                setSelectedAssetId(null);
              }}
              className={`px-3.5 py-1.5 rounded-xl transition-all ${
                activeTab === 'alerts'
                  ? 'bg-[#f59e0b] text-[#0a0e17] font-black shadow-md'
                  : 'text-[#94a3b8] hover:text-white bg-[#121927] hover:bg-[#1e293b]'
              }`}
            >
              🔔 Alerts ({alerts.length})
            </button>
          </div>

          {/* Quick Portfolio P&L Micro-chip */}
          <div className="flex items-center gap-3 text-[11px]">
            <span className="text-[#94a3b8]">Net Portfolio Value:</span>
            <span className="text-white font-bold">{formatCoins(portfolioSummary.currentValue)}</span>
            <span
              className={`font-bold ${
                portfolioSummary.unrealizedPnL >= 0 ? 'text-[#10b981]' : 'text-[#ef4444]'
              }`}
            >
              ({portfolioSummary.unrealizedPnL >= 0 ? '+' : ''}
              {portfolioSummary.unrealizedPnL} VC / {portfolioSummary.unrealizedPnLPercent.toFixed(1)}%)
            </span>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6 bg-[#080c16]">
          {/* ======================================================== */}
          {/* TAB 1: ASSET DETAIL & TRADING VIEW */}
          {/* ======================================================== */}
          {selectedAsset ? (
            <div className="flex flex-col gap-6 animate-fade-in max-w-4xl mx-auto">
              {/* Back to Board Button */}
              <button
                onClick={() => {
                  soundManager.playClick();
                  setSelectedAssetId(null);
                }}
                className="self-start flex items-center gap-2 text-xs font-mono text-[#94a3b8] hover:text-white bg-[#121927] hover:bg-[#1e293b] px-3.5 py-1.5 rounded-xl transition-colors"
              >
                ← Back to Market Assets
              </button>

              {/* Asset Hero Banner */}
              <div className="p-6 rounded-3xl bg-[#0e1526] border border-[#1e293b] flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-xl">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-[#162238] border border-[#38bdf8]/30 flex items-center justify-center text-3xl shadow-inner">
                    {selectedAsset.icon}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-white font-black text-xl font-mono">{selectedAsset.name}</h2>
                      <button
                        onClick={() => dynamicMarketService.toggleWatchlist(selectedAsset.id)}
                        className="text-base hover:scale-125 transition-transform"
                        title={watchlist.has(selectedAsset.id) ? 'Remove from Watchlist' : 'Add to Watchlist'}
                      >
                        {watchlist.has(selectedAsset.id) ? '⭐' : '☆'}
                      </button>
                    </div>
                    <p className="text-xs text-[#94a3b8] font-mono mt-1 max-w-md">
                      {selectedAsset.description}
                    </p>
                    <div className="flex items-center gap-2 mt-2 text-[10px] font-mono">
                      <span className="uppercase px-2 py-0.5 rounded bg-[#1e293b] text-[#38bdf8] font-bold">
                        {selectedAsset.category}
                      </span>
                      <span className="uppercase px-2 py-0.5 rounded bg-[#1e293b] text-[#f59e0b] font-bold">
                        {selectedAsset.rarity}
                      </span>
                      <span className="uppercase px-2 py-0.5 rounded bg-[#1e293b] text-[#cbd5e1]">
                        Vol: {(selectedAsset.volatility * 100).toFixed(0)}%
                      </span>
                    </div>
                  </div>
                </div>

                {/* Price Display */}
                <div className="flex flex-col items-end">
                  <span className="text-xs font-mono text-[#94a3b8] uppercase">Current Market Value</span>
                  <div className="text-3xl font-black text-white font-mono tabular-nums">
                    {formatCoins(selectedAsset.currentPrice)}
                  </div>
                  <div
                    className={`flex items-center gap-1.5 text-xs font-mono font-bold mt-1 ${
                      selectedAsset.change24h >= 0 ? 'text-[#10b981]' : 'text-[#ef4444]'
                    }`}
                  >
                    <span>{selectedAsset.change24h >= 0 ? '▲' : '▼'}</span>
                    <span>
                      {selectedAsset.change24h >= 0 ? '+' : ''}
                      {selectedAsset.change24h}%
                    </span>
                    <span className="text-[#64748b]">·</span>
                    <span className="uppercase text-[10px] bg-[#0a0e17] px-1.5 py-0.5 rounded border border-[#1e293b]">
                      {selectedAsset.trendStatus}
                    </span>
                  </div>
                </div>
              </div>

              {/* Interactive SVG Chart */}
              <div className="p-6 rounded-3xl bg-[#0e1526] border border-[#1e293b] shadow-xl">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-mono text-white font-bold uppercase tracking-wider">
                    Price History & Trajectory
                  </span>
                  <button
                    onClick={() => {
                      setAlertTargetPrice(selectedAsset.currentPrice);
                      setShowAlertModal(true);
                    }}
                    className="px-3 py-1 rounded-xl bg-[#1e293b] hover:bg-[#334155] text-xs font-mono text-[#38bdf8] flex items-center gap-1.5 transition-colors"
                  >
                    <span>🔔</span>
                    <span>Set Price Alert</span>
                  </button>
                </div>
                {renderDetailedChart(selectedAsset)}
              </div>

              {/* Trading Desk Grid: Buy & Sell */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* BUY PANEL */}
                <div className="p-6 rounded-3xl bg-[#0e1526] border border-[#10b981]/30 flex flex-col justify-between shadow-xl">
                  <div>
                    <div className="flex items-center justify-between pb-3 border-b border-[#1e293b] mb-4">
                      <span className="text-sm font-black font-mono text-white uppercase flex items-center gap-2">
                        <span className="text-[#10b981]">▲</span>
                        <span>Invest (Buy Units)</span>
                      </span>
                      <span className="text-[11px] font-mono text-[#94a3b8]">
                        Cost: {selectedAsset.currentPrice} VC / unit
                      </span>
                    </div>

                    {/* Quantity Selector */}
                    <div className="flex flex-col gap-2 font-mono mb-4">
                      <label className="text-[11px] text-[#94a3b8] uppercase">Select Quantity</label>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setBuyQuantity((q) => Math.max(1, q - 1))}
                          className="w-10 h-10 rounded-xl bg-[#121927] hover:bg-[#1e293b] text-white font-bold text-lg border border-[#1e293b]"
                        >
                          -
                        </button>
                        <input
                          type="number"
                          min="1"
                          max="999"
                          value={buyQuantity}
                          onChange={(e) => setBuyQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                          className="flex-1 py-2 text-center rounded-xl bg-[#060a12] border border-[#1e293b] text-white font-bold text-base outline-none"
                        />
                        <button
                          onClick={() => setBuyQuantity((q) => q + 1)}
                          className="w-10 h-10 rounded-xl bg-[#121927] hover:bg-[#1e293b] text-white font-bold text-lg border border-[#1e293b]"
                        >
                          +
                        </button>
                      </div>

                      {/* Quick Qty Buttons */}
                      <div className="flex items-center gap-2 mt-1">
                        {[1, 5, 10].map((num) => (
                          <button
                            key={num}
                            onClick={() => setBuyQuantity(num)}
                            className="flex-1 py-1 rounded-lg bg-[#121927] hover:bg-[#1e293b] text-[10px] text-[#94a3b8] hover:text-white"
                          >
                            +{num}
                          </button>
                        ))}
                        <button
                          onClick={() => {
                            const maxAfford = Math.max(1, Math.floor(userCoins / (selectedAsset.currentPrice * 1.01)));
                            setBuyQuantity(maxAfford);
                          }}
                          className="flex-1 py-1 rounded-lg bg-[#1e293b] hover:bg-[#334155] text-[10px] text-[#f59e0b] font-bold"
                        >
                          MAX
                        </button>
                      </div>
                    </div>

                    {/* Cost Breakdown */}
                    <div className="p-3.5 rounded-2xl bg-[#060a12] border border-[#1e293b] flex flex-col gap-1.5 text-xs font-mono mb-4">
                      <div className="flex justify-between text-[#94a3b8]">
                        <span>Subtotal:</span>
                        <span>{buyQuantity * selectedAsset.currentPrice} VC</span>
                      </div>
                      <div className="flex justify-between text-[#64748b] text-[10px]">
                        <span>Brokerage Fee (1%):</span>
                        <span>{Math.max(1, Math.round(buyQuantity * selectedAsset.currentPrice * 0.01))} VC</span>
                      </div>
                      <div className="border-t border-[#1e293b] pt-1.5 flex justify-between text-white font-bold">
                        <span>Total Required:</span>
                        <span className="text-[#f59e0b]">
                          {buyQuantity * selectedAsset.currentPrice +
                            Math.max(1, Math.round(buyQuantity * selectedAsset.currentPrice * 0.01))}{' '}
                          VC
                        </span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={handleBuy}
                    disabled={userCoins < buyQuantity * selectedAsset.currentPrice * 1.01}
                    className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-[#059669] to-[#10b981] hover:opacity-95 disabled:opacity-40 disabled:pointer-events-none text-[#0a0e17] font-black text-xs font-mono uppercase tracking-wider shadow-lg transition-all"
                  >
                    CONFIRM BUY ORDER →
                  </button>
                </div>

                {/* SELL / POSITION PANEL */}
                <div className="p-6 rounded-3xl bg-[#0e1526] border border-[#1e293b] flex flex-col justify-between shadow-xl">
                  <div>
                    <div className="flex items-center justify-between pb-3 border-b border-[#1e293b] mb-4">
                      <span className="text-sm font-black font-mono text-white uppercase flex items-center gap-2">
                        <span className="text-[#ef4444]">▼</span>
                        <span>Divest (Sell Position)</span>
                      </span>
                      <span className="text-[11px] font-mono text-[#94a3b8]">
                        Holdings: {currentPosition ? currentPosition.quantity : 0} units
                      </span>
                    </div>

                    {currentPosition && currentPosition.quantity > 0 ? (
                      <>
                        {/* Position Stats */}
                        <div className="p-3.5 rounded-2xl bg-[#060a12] border border-[#1e293b] flex flex-col gap-1.5 text-xs font-mono mb-4">
                          <div className="flex justify-between text-[#94a3b8]">
                            <span>Avg Purchase Price:</span>
                            <span>{currentPosition.avgBuyPrice} VC</span>
                          </div>
                          <div className="flex justify-between text-[#94a3b8]">
                            <span>Current Position Value:</span>
                            <span className="text-white font-bold">
                              {currentPosition.quantity * selectedAsset.currentPrice} VC
                            </span>
                          </div>
                          <div className="border-t border-[#1e293b] pt-1.5 flex justify-between font-bold">
                            <span>Unrealized P&L:</span>
                            <span
                              className={
                                currentPosition.quantity * selectedAsset.currentPrice - currentPosition.totalCost >= 0
                                  ? 'text-[#10b981]'
                                  : 'text-[#ef4444]'
                              }
                            >
                              {currentPosition.quantity * selectedAsset.currentPrice - currentPosition.totalCost >= 0
                                ? '+'
                                : ''}
                              {currentPosition.quantity * selectedAsset.currentPrice - currentPosition.totalCost} VC (
                              {(
                                ((selectedAsset.currentPrice - currentPosition.avgBuyPrice) /
                                  currentPosition.avgBuyPrice) *
                                100
                              ).toFixed(1)}
                              %)
                            </span>
                          </div>
                        </div>

                        {/* Quantity Selector */}
                        <div className="flex flex-col gap-2 font-mono mb-4">
                          <label className="text-[11px] text-[#94a3b8] uppercase">Sell Quantity</label>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => setSellQuantity((q) => Math.max(1, q - 1))}
                              className="w-10 h-10 rounded-xl bg-[#121927] hover:bg-[#1e293b] text-white font-bold text-lg border border-[#1e293b]"
                            >
                              -
                            </button>
                            <input
                              type="number"
                              min="1"
                              max={currentPosition.quantity}
                              value={sellQuantity}
                              onChange={(e) =>
                                setSellQuantity(
                                  Math.max(1, Math.min(currentPosition.quantity, parseInt(e.target.value) || 1))
                                )
                              }
                              className="flex-1 py-2 text-center rounded-xl bg-[#060a12] border border-[#1e293b] text-white font-bold text-base outline-none"
                            />
                            <button
                              onClick={() => setSellQuantity((q) => Math.min(currentPosition.quantity, q + 1))}
                              className="w-10 h-10 rounded-xl bg-[#121927] hover:bg-[#1e293b] text-white font-bold text-lg border border-[#1e293b]"
                            >
                              +
                            </button>
                          </div>

                          <div className="flex items-center gap-2 mt-1">
                            <button
                              onClick={() => setSellQuantity(1)}
                              className="flex-1 py-1 rounded-lg bg-[#121927] hover:bg-[#1e293b] text-[10px] text-[#94a3b8]"
                            >
                              1 Unit
                            </button>
                            <button
                              onClick={() => setSellQuantity(Math.max(1, Math.floor(currentPosition.quantity / 2)))}
                              className="flex-1 py-1 rounded-lg bg-[#121927] hover:bg-[#1e293b] text-[10px] text-[#94a3b8]"
                            >
                              Half (50%)
                            </button>
                            <button
                              onClick={() => setSellQuantity(currentPosition.quantity)}
                              className="flex-1 py-1 rounded-lg bg-[#1e293b] hover:bg-[#334155] text-[10px] text-[#ef4444] font-bold"
                            >
                              ALL (100%)
                            </button>
                          </div>
                        </div>

                        <button
                          onClick={handleSell}
                          className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-[#dc2626] to-[#ef4444] hover:opacity-95 text-white font-black text-xs font-mono uppercase tracking-wider shadow-lg transition-all"
                        >
                          CONFIRM SELL (LIQUIDATE) →
                        </button>
                      </>
                    ) : (
                      <div className="h-44 flex flex-col items-center justify-center text-center p-6 bg-[#060a12] rounded-2xl border border-[#1e293b]">
                        <span className="text-2xl mb-2">💼</span>
                        <span className="text-xs font-mono text-white font-bold">No Active Position</span>
                        <p className="text-[11px] text-[#64748b] font-mono mt-1 max-w-xs">
                          You currently do not own any market units of {selectedAsset.name}. Buy units to start investing.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ) : activeTab === 'portfolio' ? (
            /* ======================================================== */
            /* TAB 2: MY PORTFOLIO VIEW */
            /* ======================================================== */
            <div className="flex flex-col gap-6 animate-fade-in max-w-4xl mx-auto">
              {/* Portfolio Metrics Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="p-4 rounded-2xl bg-[#0e1526] border border-[#1e293b]">
                  <span className="text-[11px] font-mono text-[#94a3b8] uppercase">Total Invested</span>
                  <div className="text-xl font-black text-white font-mono mt-1">
                    {formatCoins(portfolioSummary.totalInvested)}
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-[#0e1526] border border-[#1e293b]">
                  <span className="text-[11px] font-mono text-[#94a3b8] uppercase">Current Value</span>
                  <div className="text-xl font-black text-white font-mono mt-1">
                    {formatCoins(portfolioSummary.currentValue)}
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-[#0e1526] border border-[#1e293b]">
                  <span className="text-[11px] font-mono text-[#94a3b8] uppercase">Unrealized P&L</span>
                  <div
                    className={`text-xl font-black font-mono mt-1 ${
                      portfolioSummary.unrealizedPnL >= 0 ? 'text-[#10b981]' : 'text-[#ef4444]'
                    }`}
                  >
                    {portfolioSummary.unrealizedPnL >= 0 ? '+' : ''}
                    {portfolioSummary.unrealizedPnL} VC
                  </div>
                  <span className="text-[10px] font-mono text-[#94a3b8]">
                    ({portfolioSummary.unrealizedPnLPercent.toFixed(1)}%)
                  </span>
                </div>

                <div className="p-4 rounded-2xl bg-[#0e1526] border border-[#1e293b]">
                  <span className="text-[11px] font-mono text-[#94a3b8] uppercase">Active Positions</span>
                  <div className="text-xl font-black text-[#f59e0b] font-mono mt-1">
                    {portfolioSummary.positionsCount} Assets
                  </div>
                </div>
              </div>

              {/* Positions List */}
              <div className="flex flex-col gap-3">
                <h3 className="text-sm font-bold font-mono text-white uppercase tracking-wider">
                  Open Market Positions
                </h3>

                {Object.values(portfolio).filter((p) => p.quantity > 0).length > 0 ? (
                  <div className="flex flex-col gap-2">
                    {Object.values(portfolio)
                      .filter((p) => p.quantity > 0)
                      .map((pos) => {
                        const asset = dynamicMarketService.getAsset(pos.assetId);
                        if (!asset) return null;
                        const posVal = pos.quantity * asset.currentPrice;
                        const pnl = posVal - pos.totalCost;
                        const pnlPct = ((asset.currentPrice - pos.avgBuyPrice) / pos.avgBuyPrice) * 100;

                        return (
                          <div
                            key={pos.assetId}
                            onClick={() => {
                              soundManager.playClick();
                              setSelectedAssetId(pos.assetId);
                            }}
                            className="p-4 rounded-2xl bg-[#0e1526] hover:bg-[#162238] border border-[#1e293b] hover:border-[#f59e0b] flex items-center justify-between cursor-pointer transition-all shadow-md group"
                          >
                            <div className="flex items-center gap-3">
                              <span className="text-2xl">{asset.icon}</span>
                              <div>
                                <span className="text-white font-bold font-mono text-sm group-hover:text-[#f59e0b] transition-colors">
                                  {asset.name}
                                </span>
                                <div className="text-[11px] text-[#94a3b8] font-mono">
                                  {pos.quantity} units · Avg: {pos.avgBuyPrice} VC · Cur: {asset.currentPrice} VC
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-6">
                              <div className="text-right">
                                <span className="text-sm font-black text-white font-mono">{formatCoins(posVal)}</span>
                                <div
                                  className={`text-[11px] font-mono font-bold ${
                                    pnl >= 0 ? 'text-[#10b981]' : 'text-[#ef4444]'
                                  }`}
                                >
                                  {pnl >= 0 ? '+' : ''}
                                  {pnl} VC ({pnlPct.toFixed(1)}%)
                                </div>
                              </div>

                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  soundManager.playClick();
                                  setSelectedAssetId(pos.assetId);
                                }}
                                className="px-3.5 py-1.5 rounded-xl bg-[#1e293b] group-hover:bg-[#f59e0b] text-white group-hover:text-[#0a0e17] font-bold font-mono text-xs transition-colors"
                              >
                                Trade →
                              </button>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                ) : (
                  <div className="p-10 rounded-3xl bg-[#0e1526] border border-[#1e293b] text-center flex flex-col items-center">
                    <span className="text-3xl mb-2">💼</span>
                    <span className="text-white font-bold font-mono text-sm">Your Investment Portfolio is Empty</span>
                    <p className="text-xs text-[#94a3b8] font-mono mt-1 max-w-sm">
                      Visit the All Assets market board, pick high-potential items, and invest your Vault Coins.
                    </p>
                    <button
                      onClick={() => setActiveTab('board')}
                      className="mt-4 px-4 py-2 rounded-xl bg-[#f59e0b] text-[#0a0e17] font-bold font-mono text-xs uppercase"
                    >
                      Browse Market Assets
                    </button>
                  </div>
                )}
              </div>

              {/* Transactions Ledger */}
              {transactions.length > 0 && (
                <div className="flex flex-col gap-3 mt-4">
                  <h3 className="text-xs font-bold font-mono text-[#94a3b8] uppercase tracking-wider">
                    Recent Investment Transactions
                  </h3>
                  <div className="flex flex-col gap-2 max-h-56 overflow-y-auto pr-1">
                    {transactions.map((tx) => (
                      <div
                        key={tx.id}
                        className="px-4 py-2.5 rounded-xl bg-[#060a12] border border-[#1e293b] flex items-center justify-between text-xs font-mono"
                      >
                        <div className="flex items-center gap-2">
                          <span
                            className={`w-2 h-2 rounded-full ${
                              tx.type === 'buy' ? 'bg-[#10b981]' : 'bg-[#ef4444]'
                            }`}
                          />
                          <span className="uppercase font-bold text-white">{tx.type}:</span>
                          <span className="text-[#cbd5e1]">{tx.quantity}x {tx.assetName}</span>
                          <span className="text-[#64748b]">@ {tx.pricePerUnit} VC</span>
                        </div>
                        <div className="flex items-center gap-4">
                          {tx.realizedPnL !== undefined && (
                            <span
                              className={`text-[11px] font-bold ${
                                tx.realizedPnL >= 0 ? 'text-[#10b981]' : 'text-[#ef4444]'
                              }`}
                            >
                              P&L: {tx.realizedPnL >= 0 ? '+' : ''}{tx.realizedPnL} VC
                            </span>
                          )}
                          <span className="text-white font-bold">{formatCoins(tx.totalAmount)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : activeTab === 'alerts' ? (
            /* ======================================================== */
            /* TAB 4: ALERTS VIEW */
            /* ======================================================== */
            <div className="flex flex-col gap-4 animate-fade-in max-w-3xl mx-auto">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold font-mono text-white uppercase tracking-wider">
                    Active Price Alerts ({alerts.length})
                  </h3>
                  <p className="text-xs text-[#94a3b8] font-mono">
                    You will receive non-intrusive notifications when an asset reaches your target price.
                  </p>
                </div>
              </div>

              {alerts.length > 0 ? (
                <div className="flex flex-col gap-2.5">
                  {alerts.map((al) => {
                    const asset = dynamicMarketService.getAsset(al.assetId);
                    return (
                      <div
                        key={al.id}
                        className="p-4 rounded-2xl bg-[#0e1526] border border-[#1e293b] flex items-center justify-between font-mono text-xs"
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-xl">{asset?.icon || '🔔'}</span>
                          <div>
                            <div className="text-white font-bold">{al.assetName}</div>
                            <div className="text-[11px] text-[#94a3b8]">
                              Trigger when price is <span className="text-[#38bdf8] font-bold uppercase">{al.direction}</span>{' '}
                              <span className="text-[#f59e0b] font-bold">{al.targetPrice} VC</span> (Current:{' '}
                              {asset?.currentPrice} VC)
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          {al.triggered ? (
                            <span className="px-2 py-0.5 rounded bg-[#10b981]/20 text-[#10b981] font-bold text-[10px]">
                              TRIGGERED ✓
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded bg-[#38bdf8]/20 text-[#38bdf8] font-bold text-[10px] animate-pulse">
                              MONITORING
                            </span>
                          )}
                          <button
                            onClick={() => dynamicMarketService.removeAlert(al.id)}
                            className="px-2.5 py-1 rounded-lg bg-[#1e293b] hover:bg-[#ef4444] text-white transition-colors"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="p-8 rounded-3xl bg-[#0e1526] border border-[#1e293b] text-center flex flex-col items-center">
                  <span className="text-3xl mb-2">🔔</span>
                  <span className="text-white font-bold font-mono text-sm">No Price Alerts Configured</span>
                  <p className="text-xs text-[#94a3b8] font-mono mt-1 max-w-sm">
                    Select any asset from the Market Board and click "Set Price Alert" to track upside breakouts or dip targets.
                  </p>
                </div>
              )}
            </div>
          ) : (
            /* ======================================================== */
            /* TAB 0 & 3: MARKET BOARD (ALL ASSETS & WATCHLIST) */
            /* ======================================================== */
            <div className="flex flex-col gap-4 animate-fade-in">
              {/* Category Pills & Filters */}
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-1.5 text-xs font-mono">
                  {(['all', 'robotics', 'apparel', 'collectibles', 'materials', 'decor'] as const).map((cat) => (
                    <button
                      key={cat}
                      onClick={() => {
                        soundManager.playClick();
                        setCategoryFilter(cat);
                      }}
                      className={`px-3 py-1 rounded-xl uppercase transition-colors ${
                        categoryFilter === cat
                          ? 'bg-[#38bdf8] text-[#0a0e17] font-bold'
                          : 'bg-[#0e1526] text-[#94a3b8] hover:text-white border border-[#1e293b]'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>

                {/* Search & Sort */}
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="Search market assets..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="py-1.5 px-3 rounded-xl bg-[#060a12] border border-[#1e293b] text-white text-xs font-mono outline-none focus:border-[#f59e0b] w-48"
                  />

                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as any)}
                    className="py-1.5 px-3 rounded-xl bg-[#060a12] border border-[#1e293b] text-[#94a3b8] text-xs font-mono outline-none focus:border-[#f59e0b]"
                  >
                    <option value="gainers">Top Gainers (24h)</option>
                    <option value="losers">Top Losers (24h)</option>
                    <option value="price_high">Price: High to Low</option>
                    <option value="price_low">Price: Low to High</option>
                    <option value="volatility">Highest Volatility</option>
                  </select>
                </div>
              </div>

              {/* Assets Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
                {filteredAssets.map((asset) => {
                  const isBull = asset.change24h >= 0;
                  const isFav = watchlist.has(asset.id);
                  const pos = portfolio[asset.id];

                  return (
                    <div
                      key={asset.id}
                      onClick={() => {
                        soundManager.playClick();
                        setSelectedAssetId(asset.id);
                      }}
                      className="p-4 rounded-2xl bg-[#0e1526] hover:bg-[#131d33] border border-[#1e293b] hover:border-[#f59e0b]/70 flex flex-col justify-between cursor-pointer transition-all shadow-md group transform hover:scale-[1.01]"
                    >
                      {/* Top Row: Icon + Name + Star */}
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2.5">
                          <span className="text-2xl">{asset.icon}</span>
                          <div>
                            <span className="text-sm font-bold font-mono text-white group-hover:text-[#f59e0b] transition-colors leading-tight block">
                              {asset.name}
                            </span>
                            <span className="text-[10px] uppercase font-mono text-[#64748b]">
                              {asset.category} · {asset.rarity}
                            </span>
                          </div>
                        </div>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            dynamicMarketService.toggleWatchlist(asset.id);
                          }}
                          className="text-sm text-[#94a3b8] hover:scale-125 transition-transform"
                        >
                          {isFav ? '⭐' : '☆'}
                        </button>
                      </div>

                      {/* Middle: Sparkline & Price */}
                      <div className="flex items-center justify-between my-3">
                        <div className="flex flex-col">
                          <span className="text-lg font-black text-white font-mono tabular-nums leading-none">
                            {formatCoins(asset.currentPrice)}
                          </span>
                          <span
                            className={`text-xs font-mono font-bold mt-1 ${
                              isBull ? 'text-[#10b981]' : 'text-[#ef4444]'
                            }`}
                          >
                            {isBull ? '▲ +' : '▼ '}
                            {asset.change24h}%
                          </span>
                        </div>

                        {/* Sparkline Graphic */}
                        {renderSparkline(asset.priceHistory, isBull)}
                      </div>

                      {/* Bottom Row: Status + Holding Badge + Trade CTA */}
                      <div className="flex items-center justify-between border-t border-[#1e293b]/70 pt-2 text-[10px] font-mono">
                        <div className="flex items-center gap-1.5">
                          <span className="uppercase px-1.5 py-0.5 rounded bg-[#060a12] text-[#94a3b8] border border-[#1e293b]">
                            {asset.trendStatus}
                          </span>
                          {pos && pos.quantity > 0 && (
                            <span className="bg-[#38bdf8]/15 text-[#38bdf8] border border-[#38bdf8]/30 px-1.5 py-0.5 rounded font-bold">
                              {pos.quantity} units held
                            </span>
                          )}
                        </div>

                        <span className="text-[#f59e0b] font-bold group-hover:translate-x-0.5 transition-transform">
                          Trade →
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {filteredAssets.length === 0 && (
                <div className="p-10 rounded-3xl bg-[#0e1526] border border-[#1e293b] text-center flex flex-col items-center my-6">
                  <span className="text-3xl mb-2">🔍</span>
                  <span className="text-white font-bold font-mono text-sm">No Matching Market Assets</span>
                  <p className="text-xs text-[#94a3b8] font-mono mt-1">
                    Try clearing your category filter or search keywords.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal footer hints */}
        <div className="px-6 py-3 border-t border-[#1e293b] bg-[#090e18] flex items-center justify-between text-[11px] font-mono text-[#64748b]">
          <div>MARKET PROTOCOL v1.0 · 1% BROKERAGE FEE APPLIES TO ORDERS</div>
          <div className="flex items-center gap-4">
            <span>PRESS [ESC] TO RETURN</span>
            <span>·</span>
            <span>PRESS [M] TO TOGGLE MARKET</span>
          </div>
        </div>
      </div>

      {/* Set Price Alert Modal Sub-Dialog */}
      {showAlertModal && selectedAsset && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/75 animate-fade-in font-mono">
          <div className="bg-[#0e1526] border border-[#38bdf8]/50 rounded-2xl w-full max-w-sm p-6 shadow-2xl">
            <h3 className="text-white font-bold text-sm mb-1">Set Price Alert: {selectedAsset.name}</h3>
            <p className="text-xs text-[#94a3b8] mb-4">
              Current price: <span className="text-white font-bold">{selectedAsset.currentPrice} VC</span>
            </p>

            <form onSubmit={handleCreateAlert} className="flex flex-col gap-3">
              <div>
                <label className="text-[11px] text-[#94a3b8] uppercase block mb-1">Trigger Condition</label>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <button
                    type="button"
                    onClick={() => setAlertDirection('above')}
                    className={`py-2 rounded-xl transition-colors ${
                      alertDirection === 'above'
                        ? 'bg-[#10b981] text-[#0a0e17] font-bold'
                        : 'bg-[#162238] text-[#94a3b8]'
                    }`}
                  >
                    Rises Above (▲)
                  </button>
                  <button
                    type="button"
                    onClick={() => setAlertDirection('below')}
                    className={`py-2 rounded-xl transition-colors ${
                      alertDirection === 'below'
                        ? 'bg-[#ef4444] text-white font-bold'
                        : 'bg-[#162238] text-[#94a3b8]'
                    }`}
                  >
                    Drops Below (▼)
                  </button>
                </div>
              </div>

              <div>
                <label className="text-[11px] text-[#94a3b8] uppercase block mb-1">Target Price (VC)</label>
                <input
                  type="number"
                  min="1"
                  value={alertTargetPrice}
                  onChange={(e) => setAlertTargetPrice(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full py-2.5 px-3 rounded-xl bg-[#060a12] border border-[#1e293b] text-white font-bold text-sm outline-none focus:border-[#38bdf8]"
                />
              </div>

              <div className="flex items-center gap-2 mt-2">
                <button
                  type="button"
                  onClick={() => setShowAlertModal(false)}
                  className="flex-1 py-2.5 rounded-xl bg-[#1e293b] hover:bg-[#334155] text-white text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-[#38bdf8] hover:bg-[#0284c7] text-[#0a0e17] text-xs font-bold"
                >
                  Save Alert
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
