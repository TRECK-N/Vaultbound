/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { PlayerProfile, CollectibleItem, PlacedFurniture, AuctionListing, MarketListing, BattlePassTier, DailyMission } from '../types/game';
import { DEFAULT_APPEARANCE, INITIAL_ITEMS, INITIAL_AUCTIONS, INITIAL_MARKET_LISTINGS, INITIAL_BATTLE_PASS, INITIAL_MISSIONS } from './initialData';

const STORAGE_KEYS = {
  PROFILE: 'vb_profile_v1',
  INVENTORY: 'vb_inventory_v1',
  BASE_FURNITURE: 'vb_base_furniture_v1',
  AUCTIONS: 'vb_auctions_v1',
  MARKET: 'vb_market_v1',
  BATTLE_PASS: 'vb_bp_v1',
  MISSIONS: 'vb_missions_v1',
  LEDGER: 'vb_ledger_v1',
};

export interface LedgerEntry {
  id: string;
  type: 'earn' | 'spend' | 'trade' | 'auction' | 'reward';
  amount: number;
  currency: 'VC' | 'ET';
  description: string;
  timestamp: number;
}

export const loadProfile = (): PlayerProfile => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.PROFILE);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        ...parsed,
        assignedHomePlot: parsed.assignedHomePlot || 7,
        gameMode: parsed.gameMode || 'solo',
        appearance: { ...DEFAULT_APPEARANCE, ...parsed.appearance },
      };
    }
  } catch (e) {
    console.warn('Failed to load profile from storage', e);
  }
  return {
    id: 'user_' + Math.random().toString(36).substring(2, 9),
    displayName: 'Vanguard_' + Math.floor(100 + Math.random() * 900),
    vaultCoins: 3500,
    eventTokens: 250,
    level: 1,
    xp: 80,
    duelRating: 1240,
    duelWins: 3,
    duelLosses: 1,
    heistsCompleted: 1,
    baseTier: 1,
    assignedHomePlot: 7,
    appearance: DEFAULT_APPEARANCE,
    activeRoomCode: 'VB-8092',
    gameMode: 'solo',
  };
};

export const saveProfile = (profile: PlayerProfile) => {
  try {
    localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(profile));
  } catch (e) {
    console.error('Save profile failed', e);
  }
};

export const loadInventory = (): CollectibleItem[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.INVENTORY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.warn('Failed to load inventory', e);
  }
  return INITIAL_ITEMS;
};

export const saveInventory = (items: CollectibleItem[]) => {
  try {
    localStorage.setItem(STORAGE_KEYS.INVENTORY, JSON.stringify(items));
  } catch (e) {
    console.error('Save inventory failed', e);
  }
};

export const loadBaseFurniture = (): PlacedFurniture[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.BASE_FURNITURE);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.warn('Failed to load base furniture', e);
  }
  return [
    { id: 'f_sofa_1', furnitureId: 'item_sofa_01', name: 'Obsidian Cyber Lounger', type: 'sofa', x: -3.5, z: 2.0, rotation: 0 },
    { id: 'f_pedestal_1', furnitureId: 'item_pedestal_01', name: 'Marble Display Column', type: 'pedestal', x: 3.5, z: 2.0, rotation: 0, displayedItemId: 'item_sigil_01' },
    { id: 'f_safe_1', furnitureId: 'f_safe_01', name: 'Titanium Floor Safe', type: 'safe', x: -4.0, z: -3.5, rotation: 0.5 },
    { id: 'f_plant_1', furnitureId: 'f_plant_01', name: 'Bioluminescent Planter', type: 'plant', x: 4.0, z: -3.5, rotation: 0 },
  ];
};

export const saveBaseFurniture = (furniture: PlacedFurniture[]) => {
  try {
    localStorage.setItem(STORAGE_KEYS.BASE_FURNITURE, JSON.stringify(furniture));
  } catch (e) {
    console.error('Save base furniture failed', e);
  }
};

export const loadAuctions = (): AuctionListing[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.AUCTIONS);
    if (raw) {
      const parsed: AuctionListing[] = JSON.parse(raw);
      // Renew any expired auctions
      return parsed.map((a) => {
        if (a.endTime < Date.now()) {
          return { ...a, endTime: Date.now() + 180000 + Math.random() * 300000 };
        }
        return a;
      });
    }
  } catch (e) {
    console.warn('Failed to load auctions', e);
  }
  return INITIAL_AUCTIONS;
};

export const saveAuctions = (auctions: AuctionListing[]) => {
  try {
    localStorage.setItem(STORAGE_KEYS.AUCTIONS, JSON.stringify(auctions));
  } catch (e) {
    console.error('Save auctions failed', e);
  }
};

export const loadMarket = (): MarketListing[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.MARKET);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.warn('Failed to load market', e);
  }
  return INITIAL_MARKET_LISTINGS;
};

export const saveMarket = (market: MarketListing[]) => {
  try {
    localStorage.setItem(STORAGE_KEYS.MARKET, JSON.stringify(market));
  } catch (e) {
    console.error('Save market failed', e);
  }
};

export const loadBattlePass = (): BattlePassTier[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.BATTLE_PASS);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.warn('Failed to load battle pass', e);
  }
  return INITIAL_BATTLE_PASS;
};

export const saveBattlePass = (tiers: BattlePassTier[]) => {
  try {
    localStorage.setItem(STORAGE_KEYS.BATTLE_PASS, JSON.stringify(tiers));
  } catch (e) {
    console.error('Save battle pass failed', e);
  }
};

export const loadMissions = (): DailyMission[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.MISSIONS);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.warn('Failed to load missions', e);
  }
  return INITIAL_MISSIONS;
};

export const saveMissions = (missions: DailyMission[]) => {
  try {
    localStorage.setItem(STORAGE_KEYS.MISSIONS, JSON.stringify(missions));
  } catch (e) {
    console.error('Save missions failed', e);
  }
};

export const loadLedger = (): LedgerEntry[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.LEDGER);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.warn('Failed to load ledger', e);
  }
  return [
    { id: 'tx_init', type: 'earn', amount: 3500, currency: 'VC', description: 'Founding Citizen Grant', timestamp: Date.now() - 86400000 },
    { id: 'tx_tokens', type: 'earn', amount: 250, currency: 'ET', description: 'Season 1 Pass Registration', timestamp: Date.now() - 86400000 },
  ];
};

export const recordTransaction = (entry: Omit<LedgerEntry, 'id' | 'timestamp'>) => {
  const current = loadLedger();
  const newEntry: LedgerEntry = {
    ...entry,
    id: 'tx_' + Math.random().toString(36).substring(2, 9),
    timestamp: Date.now(),
  };
  const updated = [newEntry, ...current].slice(0, 50);
  try {
    localStorage.setItem(STORAGE_KEYS.LEDGER, JSON.stringify(updated));
  } catch (e) {
    console.error('Record tx failed', e);
  }
};
