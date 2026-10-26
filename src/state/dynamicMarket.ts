/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type MarketAssetCategory = 'robotics' | 'apparel' | 'collectibles' | 'materials' | 'decor';

export type MarketTrendStatus = 'rising' | 'falling' | 'stable' | 'volatile' | 'surging';

export interface MarketPricePoint {
  timestamp: number;
  price: number;
}

export interface MarketAsset {
  id: string;
  name: string;
  category: MarketAssetCategory;
  icon: string;
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary' | 'mythic';
  description: string;
  currentPrice: number;
  previousPrice: number;
  basePrice: number;
  minPrice: number;
  maxPrice: number;
  volatility: number; // 0.02 to 0.08
  priceHistory: MarketPricePoint[];
  volume24h: number;
  change24h: number; // percentage change
  trendStatus: MarketTrendStatus;
  trendMomentum: number; // positive = upward pressure, negative = downward pressure
}

export interface PortfolioPosition {
  assetId: string;
  quantity: number;
  totalCost: number;
  avgBuyPrice: number;
}

export interface MarketTransaction {
  id: string;
  assetId: string;
  assetName: string;
  type: 'buy' | 'sell';
  quantity: number;
  pricePerUnit: number;
  totalAmount: number;
  fee: number;
  realizedPnL?: number;
  timestamp: number;
}

export interface PriceAlert {
  id: string;
  assetId: string;
  assetName: string;
  targetPrice: number;
  direction: 'above' | 'below';
  triggered: boolean;
  createdAt: number;
}

export interface MarketEvent {
  id: string;
  title: string;
  description: string;
  affectedCategory: MarketAssetCategory;
  impactMultiplier: number;
  durationTicks: number;
  active: boolean;
}

const STORAGE_KEYS = {
  MARKET_STATE: 'vb_dynamic_market_v1',
  PORTFOLIO: 'vb_market_portfolio_v1',
  TRANSACTIONS: 'vb_market_transactions_v1',
  WATCHLIST: 'vb_market_watchlist_v1',
  ALERTS: 'vb_market_alerts_v1',
};

// Initial balanced asset collection
const INITIAL_MARKET_ASSETS: MarketAsset[] = [
  // Robotics
  {
    id: 'asset_silver_visor',
    name: 'Silver Cyber Visor',
    category: 'robotics',
    icon: '🥽',
    rarity: 'rare',
    description: 'Polarized chrome HUD optics favored by district scout runners.',
    currentPrice: 250,
    previousPrice: 242,
    basePrice: 250,
    minPrice: 120,
    maxPrice: 650,
    volatility: 0.04,
    priceHistory: [],
    volume24h: 1420,
    change24h: 3.3,
    trendStatus: 'rising',
    trendMomentum: 1,
  },
  {
    id: 'asset_capsule_dome',
    name: 'Capsule Dome Chassis',
    category: 'robotics',
    icon: '🤖',
    rarity: 'epic',
    description: 'Sleek reinforced ceramic head chassis with internal digital reticles.',
    currentPrice: 520,
    previousPrice: 535,
    basePrice: 520,
    minPrice: 280,
    maxPrice: 1100,
    volatility: 0.035,
    priceHistory: [],
    volume24h: 980,
    change24h: -2.8,
    trendStatus: 'falling',
    trendMomentum: -1,
  },
  {
    id: 'asset_arc_reactor',
    name: 'Arc Pulse Core Reactor',
    category: 'robotics',
    icon: '⚡',
    rarity: 'legendary',
    description: 'High-output cold plasma battery for high-speed locomotion.',
    currentPrice: 780,
    previousPrice: 740,
    basePrice: 780,
    minPrice: 420,
    maxPrice: 1800,
    volatility: 0.055,
    priceHistory: [],
    volume24h: 2300,
    change24h: 5.4,
    trendStatus: 'surging',
    trendMomentum: 2,
  },
  {
    id: 'asset_strider_piston',
    name: 'Hydraulic Strider Piston',
    category: 'robotics',
    icon: '🦾',
    rarity: 'uncommon',
    description: 'Industrial titanium shock dampers for high-impact jumps.',
    currentPrice: 340,
    previousPrice: 342,
    basePrice: 340,
    minPrice: 180,
    maxPrice: 720,
    volatility: 0.04,
    priceHistory: [],
    volume24h: 1120,
    change24h: -0.6,
    trendStatus: 'stable',
    trendMomentum: 0,
  },

  // Apparel
  {
    id: 'asset_hover_runners',
    name: 'Neon Hover Runners',
    category: 'apparel',
    icon: '👟',
    rarity: 'rare',
    description: 'Magnetic levitation sneakers with responsive glow treads.',
    currentPrice: 420,
    previousPrice: 434,
    basePrice: 420,
    minPrice: 210,
    maxPrice: 950,
    volatility: 0.05,
    priceHistory: [],
    volume24h: 1640,
    change24h: -3.2,
    trendStatus: 'falling',
    trendMomentum: -1,
  },
  {
    id: 'asset_syndicate_bomber',
    name: 'Midnight Syndicate Bomber',
    category: 'apparel',
    icon: '🧥',
    rarity: 'epic',
    description: 'Ballistic insulated flight jacket with gold-plated hardware.',
    currentPrice: 350,
    previousPrice: 348,
    basePrice: 350,
    minPrice: 190,
    maxPrice: 800,
    volatility: 0.025,
    priceHistory: [],
    volume24h: 890,
    change24h: 0.6,
    trendStatus: 'stable',
    trendMomentum: 0,
  },
  {
    id: 'asset_gold_chain',
    name: 'Gilded Cuban Link',
    category: 'apparel',
    icon: '⛓️',
    rarity: 'epic',
    description: 'Pure 24k gilded syndicate neck collar with micro-welded links.',
    currentPrice: 920,
    previousPrice: 860,
    basePrice: 920,
    minPrice: 480,
    maxPrice: 2200,
    volatility: 0.06,
    priceHistory: [],
    volume24h: 3100,
    change24h: 7.0,
    trendStatus: 'rising',
    trendMomentum: 2,
  },
  {
    id: 'asset_cyber_hoodie',
    name: 'Cyber Tech Hoodie',
    category: 'apparel',
    icon: '👕',
    rarity: 'uncommon',
    description: 'Breathable carbon-weave hoodie with integrated headphone conduits.',
    currentPrice: 280,
    previousPrice: 275,
    basePrice: 280,
    minPrice: 140,
    maxPrice: 600,
    volatility: 0.03,
    priceHistory: [],
    volume24h: 750,
    change24h: 1.8,
    trendStatus: 'rising',
    trendMomentum: 1,
  },

  // Collectibles
  {
    id: 'asset_vault_sigil',
    name: 'Golden Vault Sigil',
    category: 'collectibles',
    icon: '🏵️',
    rarity: 'mythic',
    description: 'Excavated ancient founding emblem of the sub-vaults.',
    currentPrice: 1850,
    previousPrice: 1720,
    basePrice: 1850,
    minPrice: 950,
    maxPrice: 4500,
    volatility: 0.07,
    priceHistory: [],
    volume24h: 4200,
    change24h: 7.5,
    trendStatus: 'surging',
    trendMomentum: 3,
  },
  {
    id: 'asset_dragon_statue',
    name: 'Celestial Dragon Statuette',
    category: 'collectibles',
    icon: '🐉',
    rarity: 'legendary',
    description: 'Sculpted from celestial meteorite alloy by old master artisans.',
    currentPrice: 3400,
    previousPrice: 3550,
    basePrice: 3400,
    minPrice: 1800,
    maxPrice: 8500,
    volatility: 0.08,
    priceHistory: [],
    volume24h: 5800,
    change24h: -4.2,
    trendStatus: 'falling',
    trendMomentum: -2,
  },

  // Materials & Tech
  {
    id: 'asset_flux_battery',
    name: 'Quantum Flux Battery',
    category: 'materials',
    icon: '🔋',
    rarity: 'rare',
    description: 'High-density quantum cells required for top-tier base infrastructure.',
    currentPrice: 680,
    previousPrice: 610,
    basePrice: 680,
    minPrice: 320,
    maxPrice: 1600,
    volatility: 0.065,
    priceHistory: [],
    volume24h: 2900,
    change24h: 11.5,
    trendStatus: 'surging',
    trendMomentum: 3,
  },
  {
    id: 'asset_carbon_ingot',
    name: 'Nanocarbon Ingot',
    category: 'materials',
    icon: '🧱',
    rarity: 'common',
    description: 'Essential structural building block for robot frames and armor.',
    currentPrice: 190,
    previousPrice: 192,
    basePrice: 190,
    minPrice: 95,
    maxPrice: 420,
    volatility: 0.03,
    priceHistory: [],
    volume24h: 890,
    change24h: -1.0,
    trendStatus: 'stable',
    trendMomentum: 0,
  },
  {
    id: 'asset_super_circuit',
    name: 'Superconducting Circuit',
    category: 'materials',
    icon: '🔬',
    rarity: 'rare',
    description: 'Zero-resistance microprocessors used in duel targeting computers.',
    currentPrice: 440,
    previousPrice: 425,
    basePrice: 440,
    minPrice: 220,
    maxPrice: 1050,
    volatility: 0.05,
    priceHistory: [],
    volume24h: 1800,
    change24h: 3.5,
    trendStatus: 'rising',
    trendMomentum: 1,
  },

  // Decor
  {
    id: 'asset_cyber_lounger',
    name: 'Obsidian Cyber Lounger',
    category: 'decor',
    icon: '🛋️',
    rarity: 'uncommon',
    description: 'Ergonomic smart sofa with integrated sound dampeners.',
    currentPrice: 580,
    previousPrice: 575,
    basePrice: 580,
    minPrice: 320,
    maxPrice: 1200,
    volatility: 0.025,
    priceHistory: [],
    volume24h: 620,
    change24h: 0.9,
    trendStatus: 'stable',
    trendMomentum: 0,
  },
  {
    id: 'asset_bioplant',
    name: 'Bioluminescent Flora',
    category: 'decor',
    icon: '🪴',
    rarity: 'uncommon',
    description: 'Exotic genetically altered indoor plant with gentle cyan glow.',
    currentPrice: 310,
    previousPrice: 325,
    basePrice: 310,
    minPrice: 160,
    maxPrice: 750,
    volatility: 0.04,
    priceHistory: [],
    volume24h: 510,
    change24h: -4.6,
    trendStatus: 'falling',
    trendMomentum: -1,
  },
];

// Seed realistic price history if empty
function seedHistory(asset: MarketAsset): MarketPricePoint[] {
  const points: MarketPricePoint[] = [];
  const now = Date.now();
  let tempPrice = asset.currentPrice;

  for (let i = 24; i >= 0; i--) {
    const timestamp = now - i * 60 * 1000;
    // Walk back slightly
    const variation = (Math.sin(i * 0.8) + (Math.random() - 0.5) * 1.5) * (asset.currentPrice * asset.volatility * 0.4);
    const p = Math.max(asset.minPrice, Math.min(asset.maxPrice, Math.round(tempPrice + variation)));
    points.push({ timestamp, price: p });
  }
  points[points.length - 1].price = asset.currentPrice;
  return points;
}

export class DynamicMarketService {
  private assets: MarketAsset[] = [];
  private portfolio: Record<string, PortfolioPosition> = {};
  private transactions: MarketTransaction[] = [];
  private watchlist: Set<string> = new Set();
  private alerts: PriceAlert[] = [];
  private activeEvent: MarketEvent | null = null;
  private listeners: Set<() => void> = new Set();
  private alertListeners: Set<(alert: PriceAlert, newPrice: number) => void> = new Set();
  private timer: number | null = null;
  private tickCount: number = 0;

  constructor() {
    this.loadState();
    this.startSimulation();
  }

  private loadState() {
    try {
      // 1. Assets
      const rawAssets = localStorage.getItem(STORAGE_KEYS.MARKET_STATE);
      if (rawAssets) {
        const parsed: MarketAsset[] = JSON.parse(rawAssets);
        // Merge with defaults in case new items were added
        this.assets = INITIAL_MARKET_ASSETS.map((def) => {
          const found = parsed.find((p) => p.id === def.id);
          if (found && found.priceHistory && found.priceHistory.length > 0) {
            return {
              ...def,
              ...found,
              priceHistory: found.priceHistory,
            };
          }
          return {
            ...def,
            priceHistory: seedHistory(def),
          };
        });
      } else {
        this.assets = INITIAL_MARKET_ASSETS.map((a) => ({
          ...a,
          priceHistory: seedHistory(a),
        }));
      }

      // 2. Portfolio
      const rawPort = localStorage.getItem(STORAGE_KEYS.PORTFOLIO);
      if (rawPort) {
        this.portfolio = JSON.parse(rawPort);
      }

      // 3. Transactions
      const rawTx = localStorage.getItem(STORAGE_KEYS.TRANSACTIONS);
      if (rawTx) {
        this.transactions = JSON.parse(rawTx);
      }

      // 4. Watchlist
      const rawWl = localStorage.getItem(STORAGE_KEYS.WATCHLIST);
      if (rawWl) {
        const arr: string[] = JSON.parse(rawWl);
        this.watchlist = new Set(arr);
      } else {
        this.watchlist = new Set(['asset_silver_visor', 'asset_arc_reactor', 'asset_gold_chain']);
      }

      // 5. Alerts
      const rawAlerts = localStorage.getItem(STORAGE_KEYS.ALERTS);
      if (rawAlerts) {
        this.alerts = JSON.parse(rawAlerts);
      }
    } catch (e) {
      console.warn('Market load error fallback to defaults', e);
      this.assets = INITIAL_MARKET_ASSETS.map((a) => ({ ...a, priceHistory: seedHistory(a) }));
    }
  }

  public saveState() {
    try {
      localStorage.setItem(STORAGE_KEYS.MARKET_STATE, JSON.stringify(this.assets));
      localStorage.setItem(STORAGE_KEYS.PORTFOLIO, JSON.stringify(this.portfolio));
      localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(this.transactions.slice(0, 100)));
      localStorage.setItem(STORAGE_KEYS.WATCHLIST, JSON.stringify(Array.from(this.watchlist)));
      localStorage.setItem(STORAGE_KEYS.ALERTS, JSON.stringify(this.alerts));
    } catch (e) {
      console.warn('Market save error', e);
    }
  }

  private startSimulation() {
    if (this.timer !== null) return;
    // Central update tick every 8 seconds
    this.timer = window.setInterval(() => {
      this.updateMarketTick();
    }, 8000);
  }

  public stopSimulation() {
    if (this.timer !== null) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  public subscribe(callback: () => void): () => void {
    this.listeners.add(callback);
    return () => {
      this.listeners.delete(callback);
    };
  }

  public onAlertTriggered(callback: (alert: PriceAlert, newPrice: number) => void): () => void {
    this.alertListeners.add(callback);
    return () => {
      this.alertListeners.delete(callback);
    };
  }

  private notify() {
    this.listeners.forEach((cb) => cb());
  }

  /**
   * The core market update tick algorithm.
   */
  public updateMarketTick() {
    this.tickCount++;

    // 1. Check or trigger market events every 15-25 ticks (~2-3 mins)
    if (this.tickCount % 18 === 0) {
      this.cycleMarketEvent();
    }

    const now = Date.now();

    this.assets = this.assets.map((asset) => {
      const prevPrice = asset.currentPrice;

      // Random factor based on asset's specific volatility
      const randomNoise = (Math.random() - 0.49) * 2; // -1 to +1
      let deltaPercent = randomNoise * asset.volatility;

      // Add momentum
      deltaPercent += asset.trendMomentum * 0.008;

      // Mean-reversion pull if price deviated far from base price
      const deviation = (asset.currentPrice - asset.basePrice) / asset.basePrice;
      if (Math.abs(deviation) > 0.4) {
        deltaPercent -= deviation * 0.015;
      }

      // Apply active event impact
      if (this.activeEvent && this.activeEvent.affectedCategory === asset.category) {
        deltaPercent += (this.activeEvent.impactMultiplier - 1.0) * 0.15;
      }

      // Calculate candidate price
      let newPrice = Math.round(asset.currentPrice * (1 + deltaPercent));
      newPrice = Math.max(asset.minPrice, Math.min(asset.maxPrice, newPrice));

      // Adjust trend momentum for subsequent steps
      let newMomentum = asset.trendMomentum;
      if (Math.random() < 0.25) {
        // Shift momentum slightly
        newMomentum = Math.max(-3, Math.min(3, newMomentum + (Math.random() > 0.5 ? 1 : -1)));
      }

      // Determine trend status label
      const changePct = ((newPrice - prevPrice) / prevPrice) * 100;
      let trendStatus: MarketTrendStatus = 'stable';
      if (changePct > 4.5) trendStatus = 'surging';
      else if (changePct > 1.2) trendStatus = 'rising';
      else if (changePct < -4.5) trendStatus = 'volatile';
      else if (changePct < -1.2) trendStatus = 'falling';

      // Update price history (keep last 50 points)
      const updatedHistory = [...asset.priceHistory, { timestamp: now, price: newPrice }];
      if (updatedHistory.length > 50) {
        updatedHistory.shift();
      }

      // Calculate 24h change from oldest point
      const startPrice = updatedHistory[0]?.price || asset.basePrice;
      const change24h = Number((((newPrice - startPrice) / startPrice) * 100).toFixed(1));

      return {
        ...asset,
        previousPrice: prevPrice,
        currentPrice: newPrice,
        priceHistory: updatedHistory,
        change24h,
        trendStatus,
        trendMomentum: newMomentum,
      };
    });

    // 2. Evaluate price alerts
    this.checkPriceAlerts();

    // 3. Save and notify
    this.saveState();
    this.notify();
  }

  private cycleMarketEvent() {
    const events: MarketEvent[] = [
      {
        id: 'ev_tech_surge',
        title: '⚡ Sub-Vault Power Shortage',
        description: 'High demand for Arc Reactors and Batteries pushes Robotics & Materials upward!',
        affectedCategory: 'robotics',
        impactMultiplier: 1.14,
        durationTicks: 12,
        active: true,
      },
      {
        id: 'ev_street_hype',
        title: '👟 District Fashion Week',
        description: 'District influencers rave about Neon Runners & Syndicate Bombers. Apparel rallying!',
        affectedCategory: 'apparel',
        impactMultiplier: 1.12,
        durationTicks: 12,
        active: true,
      },
      {
        id: 'ev_relic_craze',
        title: '🏛️ Sub-Vault Relic Exhibition',
        description: 'Elite collectors flood the district for Rare Collectibles and ancient sigils.',
        affectedCategory: 'collectibles',
        impactMultiplier: 1.16,
        durationTicks: 10,
        active: true,
      },
      {
        id: 'ev_market_cool',
        title: '📉 Tech Sector Cooling',
        description: 'Supplies stabilize after massive shipment; raw Materials experiencing correction.',
        affectedCategory: 'materials',
        impactMultiplier: 0.92,
        durationTicks: 12,
        active: true,
      },
    ];

    const pick = events[Math.floor(Math.random() * events.length)];
    this.activeEvent = pick;
  }

  private checkPriceAlerts() {
    let triggeredAny = false;
    this.alerts = this.alerts.map((alert) => {
      if (alert.triggered) return alert;
      const asset = this.assets.find((a) => a.id === alert.assetId);
      if (!asset) return alert;

      const hit =
        (alert.direction === 'above' && asset.currentPrice >= alert.targetPrice) ||
        (alert.direction === 'below' && asset.currentPrice <= alert.targetPrice);

      if (hit) {
        triggeredAny = true;
        this.alertListeners.forEach((cb) => cb(alert, asset.currentPrice));
        return { ...alert, triggered: true };
      }
      return alert;
    });

    if (triggeredAny) {
      this.saveState();
    }
  }

  // ==========================================
  // GETTERS & READ METHODS
  // ==========================================
  public getAssets(): MarketAsset[] {
    return this.assets;
  }

  public getAsset(id: string): MarketAsset | undefined {
    return this.assets.find((a) => a.id === id);
  }

  public getMarketPulse(): {
    risingCount: number;
    fallingCount: number;
    topGainer: MarketAsset;
    topLoser: MarketAsset;
    marketTrend: 'bullish' | 'bearish' | 'neutral';
  } {
    let rising = 0;
    let falling = 0;

    const sortedByChange = [...this.assets].sort((a, b) => b.change24h - a.change24h);
    const topGainer = sortedByChange[0];
    const topLoser = sortedByChange[sortedByChange.length - 1];

    this.assets.forEach((a) => {
      if (a.currentPrice > a.previousPrice) rising++;
      else if (a.currentPrice < a.previousPrice) falling++;
    });

    const marketTrend = rising > falling ? 'bullish' : falling > rising ? 'bearish' : 'neutral';

    return {
      risingCount: rising,
      fallingCount: falling,
      topGainer,
      topLoser,
      marketTrend,
    };
  }

  public getPortfolio(): Record<string, PortfolioPosition> {
    return this.portfolio;
  }

  public getPortfolioSummary(): {
    totalInvested: number;
    currentValue: number;
    unrealizedPnL: number;
    unrealizedPnLPercent: number;
    positionsCount: number;
    bestPosition?: { asset: MarketAsset; pnl: number; pnlPercent: number };
  } {
    let totalInvested = 0;
    let currentValue = 0;
    let bestPos: { asset: MarketAsset; pnl: number; pnlPercent: number } | undefined = undefined;

    Object.values(this.portfolio).forEach((pos) => {
      if (pos.quantity <= 0) return;
      const asset = this.getAsset(pos.assetId);
      if (!asset) return;

      const posVal = pos.quantity * asset.currentPrice;
      const posPnl = posVal - pos.totalCost;
      const posPnlPct = pos.totalCost > 0 ? (posPnl / pos.totalCost) * 100 : 0;

      totalInvested += pos.totalCost;
      currentValue += posVal;

      if (!bestPos || posPnl > bestPos.pnl) {
        bestPos = { asset, pnl: posPnl, pnlPercent: posPnlPct };
      }
    });

    const unrealizedPnL = currentValue - totalInvested;
    const unrealizedPnLPercent = totalInvested > 0 ? (unrealizedPnL / totalInvested) * 100 : 0;

    return {
      totalInvested,
      currentValue,
      unrealizedPnL,
      unrealizedPnLPercent,
      positionsCount: Object.values(this.portfolio).filter((p) => p.quantity > 0).length,
      bestPosition: bestPos,
    };
  }

  public getTransactions(): MarketTransaction[] {
    return this.transactions;
  }

  public getWatchlist(): Set<string> {
    return this.watchlist;
  }

  public isWatched(assetId: string): boolean {
    return this.watchlist.has(assetId);
  }

  public toggleWatchlist(assetId: string): boolean {
    if (this.watchlist.has(assetId)) {
      this.watchlist.delete(assetId);
    } else {
      this.watchlist.add(assetId);
    }
    this.saveState();
    this.notify();
    return this.watchlist.has(assetId);
  }

  public getAlerts(): PriceAlert[] {
    return this.alerts;
  }

  public addAlert(assetId: string, targetPrice: number, direction: 'above' | 'below'): PriceAlert {
    const asset = this.getAsset(assetId);
    const newAlert: PriceAlert = {
      id: 'alert_' + Math.random().toString(36).substring(2, 9),
      assetId,
      assetName: asset?.name || 'Asset',
      targetPrice,
      direction,
      triggered: false,
      createdAt: Date.now(),
    };
    this.alerts = [newAlert, ...this.alerts];
    this.saveState();
    this.notify();
    return newAlert;
  }

  public removeAlert(alertId: string) {
    this.alerts = this.alerts.filter((a) => a.id !== alertId);
    this.saveState();
    this.notify();
  }

  public getActiveEvent(): MarketEvent | null {
    return this.activeEvent;
  }

  // ==========================================
  // TRANSACTION LOGIC (BUY & SELL)
  // ==========================================
  public buyPosition(
    assetId: string,
    quantity: number,
    availableCoins: number,
    feeRate: number = 0.01
  ): {
    success: boolean;
    newCoins: number;
    transaction?: MarketTransaction;
    error?: string;
  } {
    if (!Number.isInteger(quantity) || quantity <= 0) {
      return { success: false, newCoins: availableCoins, error: 'Quantity must be a positive integer.' };
    }

    const asset = this.getAsset(assetId);
    if (!asset) {
      return { success: false, newCoins: availableCoins, error: 'Asset not found in market registry.' };
    }

    const grossCost = asset.currentPrice * quantity;
    const fee = Math.max(1, Math.round(grossCost * feeRate));
    const totalCost = grossCost + fee;

    if (availableCoins < totalCost) {
      return {
        success: false,
        newCoins: availableCoins,
        error: `Insufficient Vault Coins! Need ${totalCost} VC (includes ${fee} VC brokerage fee).`,
      };
    }

    // Update position
    const existing = this.portfolio[assetId] || {
      assetId,
      quantity: 0,
      totalCost: 0,
      avgBuyPrice: 0,
    };

    const newQty = existing.quantity + quantity;
    const newCost = existing.totalCost + grossCost;
    const newAvg = Math.round(newCost / newQty);

    this.portfolio[assetId] = {
      assetId,
      quantity: newQty,
      totalCost: newCost,
      avgBuyPrice: newAvg,
    };

    const tx: MarketTransaction = {
      id: 'tx_' + Math.random().toString(36).substring(2, 9),
      assetId,
      assetName: asset.name,
      type: 'buy',
      quantity,
      pricePerUnit: asset.currentPrice,
      totalAmount: totalCost,
      fee,
      timestamp: Date.now(),
    };

    this.transactions = [tx, ...this.transactions];
    this.saveState();
    this.notify();

    return {
      success: true,
      newCoins: availableCoins - totalCost,
      transaction: tx,
    };
  }

  public sellPosition(
    assetId: string,
    quantity: number,
    availableCoins: number,
    feeRate: number = 0.01
  ): {
    success: boolean;
    newCoins: number;
    realizedPnL: number;
    transaction?: MarketTransaction;
    error?: string;
  } {
    if (!Number.isInteger(quantity) || quantity <= 0) {
      return { success: false, newCoins: availableCoins, realizedPnL: 0, error: 'Quantity must be a positive integer.' };
    }

    const pos = this.portfolio[assetId];
    if (!pos || pos.quantity < quantity) {
      return {
        success: false,
        newCoins: availableCoins,
        realizedPnL: 0,
        error: `You do not own enough units to sell! (Owned: ${pos ? pos.quantity : 0})`,
      };
    }

    const asset = this.getAsset(assetId);
    if (!asset) {
      return { success: false, newCoins: availableCoins, realizedPnL: 0, error: 'Asset not found in market registry.' };
    }

    const grossProceeds = asset.currentPrice * quantity;
    const fee = Math.max(1, Math.round(grossProceeds * feeRate));
    const netProceeds = grossProceeds - fee;

    // Realized Profit/Loss calculation
    const costBasisPortion = pos.avgBuyPrice * quantity;
    const realizedPnL = grossProceeds - costBasisPortion - fee;

    const remainingQty = pos.quantity - quantity;
    if (remainingQty <= 0) {
      delete this.portfolio[assetId];
    } else {
      const remainingCost = pos.avgBuyPrice * remainingQty;
      this.portfolio[assetId] = {
        ...pos,
        quantity: remainingQty,
        totalCost: remainingCost,
      };
    }

    const tx: MarketTransaction = {
      id: 'tx_' + Math.random().toString(36).substring(2, 9),
      assetId,
      assetName: asset.name,
      type: 'sell',
      quantity,
      pricePerUnit: asset.currentPrice,
      totalAmount: netProceeds,
      fee,
      realizedPnL,
      timestamp: Date.now(),
    };

    this.transactions = [tx, ...this.transactions];
    this.saveState();
    this.notify();

    return {
      success: true,
      newCoins: availableCoins + netProceeds,
      realizedPnL,
      transaction: tx,
    };
  }
}

export const dynamicMarketService = new DynamicMarketService();
