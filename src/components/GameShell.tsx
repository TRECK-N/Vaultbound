/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  PlayerProfile,
  CollectibleItem,
  AuctionListing,
  MarketListing,
  PlacedFurniture,
  BattlePassTier,
  DailyMission,
  CharacterAppearance,
} from '../types/game';
import {
  loadProfile,
  saveProfile,
  loadInventory,
  saveInventory,
  loadBaseFurniture,
  saveBaseFurniture,
  loadAuctions,
  saveAuctions,
  loadMarket,
  saveMarket,
  loadBattlePass,
  saveBattlePass,
  loadMissions,
  saveMissions,
  recordTransaction,
} from '../state/gameStorage';
import { loadKeybinds, saveKeybinds, KeyAction, normalizeKey } from '../state/keybinds';
import { WorldZoneTrigger } from '../engine/worldBuilder';
import { WorldCanvas } from './WorldCanvas';
import { HUD } from './HUD';
import { TitleScreen } from './TitleScreen';
import { GrandAuctionHouseModal } from './GrandAuctionHouseModal';
import { MarketplaceModal } from './MarketplaceModal';
import { VaultDuelArenaModal } from './VaultDuelArenaModal';
import { HeistMissionModal } from './HeistMissionModal';
import { PersonalBaseModal } from './PersonalBaseModal';
import { InventoryModal } from './InventoryModal';
import { EventSquareModal } from './EventSquareModal';
import { BattlePassModal } from './BattlePassModal';
import { CharacterCreatorModal } from './CharacterCreatorModal';
import { ProfileModal } from './ProfileModal';
import { PauseSettingsModal } from './PauseSettingsModal';
import { DynamicMarketModal } from './DynamicMarketModal';
import { dynamicMarketService, PriceAlert } from '../state/dynamicMarket';
import { soundManager } from '../audio/soundManager';

export const GameShell: React.FC = () => {
  // Game lifecycle states
  const [inGame, setInGame] = useState(false);
  const [currentView, setCurrentView] = useState<'city' | 'base'>('city');
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [nearbyZone, setNearbyZone] = useState<WorldZoneTrigger | null>(null);
  const [activeEmote, setActiveEmote] = useState<string | undefined>(undefined);
  const [playerSpawnCoords, setPlayerSpawnCoords] = useState<{ x: number; z: number } | null>(null);
  const [isEnteringWorld, setIsEnteringWorld] = useState(false);
  const [marketAlertToast, setMarketAlertToast] = useState<{ alert: PriceAlert; price: number } | null>(null);
  const [npcDialog, setNpcDialog] = useState<{ name: string; text: string; role: string } | null>(null);

  // Keybinds state
  const [keybinds, setKeybinds] = useState<Record<KeyAction, string>>(loadKeybinds);

  // Persistent States
  const [profile, setProfile] = useState<PlayerProfile>(loadProfile);
  const [inventory, setInventory] = useState<CollectibleItem[]>(loadInventory);
  const [baseFurniture, setBaseFurniture] = useState<PlacedFurniture[]>(loadBaseFurniture);
  const [auctions, setAuctions] = useState<AuctionListing[]>(loadAuctions);
  const [marketListings, setMarketListings] = useState<MarketListing[]>(loadMarket);
  const [battlePass, setBattlePass] = useState<BattlePassTier[]>(loadBattlePass);
  const [missions, setMissions] = useState<DailyMission[]>(loadMissions);

  // Listen to Price Alerts from Dynamic Market Service
  useEffect(() => {
    const unsub = dynamicMarketService.onAlertTriggered((alert, currentPrice) => {
      soundManager.playVictory();
      setMarketAlertToast({ alert, price: currentPrice });
      setTimeout(() => {
        setMarketAlertToast((curr) => (curr?.alert.id === alert.id ? null : curr));
      }, 6000);
    });
    return unsub;
  }, []);

  // Save keybinds when updated
  const handleUpdateKeybinds = (newBinds: Record<KeyAction, string>) => {
    setKeybinds(newBinds);
    saveKeybinds(newBinds);
  };

  // Keyboard shortcut listener (SAFE & AUDITED: A and D NEVER trigger menus!)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // If typing in input or search box, ignore all interface hotkeys
      const targetTag = (e.target as HTMLElement)?.tagName;
      if (['INPUT', 'SELECT', 'TEXTAREA'].includes(targetTag)) return;

      const norm = normalizeKey(e);

      // Escape key handles pause / closing active modal
      if (norm === keybinds.pause) {
        if (activeModal) {
          setActiveModal(null);
        } else if (inGame) {
          setActiveModal('settings');
        }
        return;
      }

      // If a modal is open, do not trigger in-game shortcuts
      if (activeModal) return;

      // Only listen to safe non-conflicting interface shortcuts
      if (inGame) {
        if (norm === keybinds.inventory) {
          setActiveModal('inventory');
        }
        if (norm === 'm' || e.code === 'KeyM') {
          soundManager.playClick();
          setActiveModal('dynamic_market');
        }
        if (norm === keybinds.map) {
          setActiveModal('profile');
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [inGame, activeModal, keybinds]);

  // Action handlers
  const handleStartGame = (mode: 'solo' | 'friends' | 'public_lobby', roomCode: string = 'VB-8092') => {
    const updated = {
      ...profile,
      gameMode: mode,
      activeRoomCode: roomCode,
    };
    setProfile(updated);
    saveProfile(updated);
    setIsEnteringWorld(true);
    setTimeout(() => {
      setIsEnteringWorld(false);
      setInGame(true);
      setCurrentView('city');
      setActiveModal(null);
    }, 400);
  };

  const handleEnterBaseDirectly = () => {
    setIsEnteringWorld(true);
    setTimeout(() => {
      setIsEnteringWorld(false);
      setInGame(true);
      setCurrentView('base');
      setPlayerSpawnCoords(null);
      setActiveModal(null);
    }, 400);
  };

  const handleZoneInteract = (zoneKey: string) => {
    if (zoneKey === 'city') {
      soundManager.playWhoosh();
      setCurrentView('city');
      // Place player right outside Plot #7's front gate path on the residential street sidewalk
      setPlayerSpawnCoords({ x: -12, z: 45.0 });
      return;
    }
    if (zoneKey === 'base') {
      soundManager.playWhoosh();
      setCurrentView('base');
      setPlayerSpawnCoords(null);
      return;
    }
    if (zoneKey === 'bank') {
      setActiveModal('profile');
      return;
    }
    setActiveModal(zoneKey);
  };

  const handlePlaceBid = (auctionId: string, bidAmount: number) => {
    setAuctions((prev) => {
      const updated = prev.map((a) => {
        if (a.id === auctionId) {
          const extension = a.endTime - Date.now() < 30000 ? 30000 : 0;
          return {
            ...a,
            currentBid: bidAmount,
            highestBidder: profile.displayName,
            bidCount: a.bidCount + 1,
            endTime: a.endTime + extension,
          };
        }
        return a;
      });
      saveAuctions(updated);
      return updated;
    });

    const newCoins = profile.vaultCoins - bidAmount;
    const newProfile = { ...profile, vaultCoins: newCoins };
    setProfile(newProfile);
    saveProfile(newProfile);

    recordTransaction({
      type: 'auction',
      amount: bidAmount,
      currency: 'VC',
      description: `Bid placed on Auction #${auctionId.slice(-4)}`,
    });

    setMissions((prev) => {
      const updated = prev.map((m) =>
        m.id === 'm_auction_bid' ? { ...m, progress: Math.min(m.goal, m.progress + 1) } : m
      );
      saveMissions(updated);
      return updated;
    });
  };

  const handleCreateAuction = (item: CollectibleItem, startingPrice: number, durationMinutes: number) => {
    const newAuction: AuctionListing = {
      id: 'auc_' + Math.random().toString(36).substring(2, 9),
      itemId: item.id,
      item,
      sellerName: profile.displayName,
      currentBid: startingPrice,
      startingPrice,
      highestBidder: 'System_Escrow',
      bidCount: 0,
      endTime: Date.now() + durationMinutes * 60000,
    };

    const updatedAuctions = [newAuction, ...auctions];
    setAuctions(updatedAuctions);
    saveAuctions(updatedAuctions);

    const updatedInventory = inventory.filter((i) => i.id !== item.id);
    setInventory(updatedInventory);
    saveInventory(updatedInventory);
  };

  const handleBuyMarketItem = (listingId: string) => {
    const listing = marketListings.find((l) => l.id === listingId);
    if (!listing) return;

    const newCoins = profile.vaultCoins - listing.price;
    const updatedInventory = [listing.item, ...inventory];
    const updatedListings = marketListings.filter((l) => l.id !== listingId);

    const newProfile = { ...profile, vaultCoins: newCoins };
    setProfile(newProfile);
    saveProfile(newProfile);

    setInventory(updatedInventory);
    saveInventory(updatedInventory);

    setMarketListings(updatedListings);
    saveMarket(updatedListings);

    recordTransaction({
      type: 'spend',
      amount: listing.price,
      currency: 'VC',
      description: `Purchased ${listing.item.name} from Marketplace`,
    });
  };

  const handleListMarketItem = (item: CollectibleItem, price: number) => {
    const fee = Math.round(price * 0.05);
    const newCoins = profile.vaultCoins - fee;

    const newListing: MarketListing = {
      id: 'mkt_' + Math.random().toString(36).substring(2, 9),
      itemId: item.id,
      item,
      sellerName: profile.displayName,
      price,
      listedAt: Date.now(),
    };

    const updatedListings = [newListing, ...marketListings];
    setMarketListings(updatedListings);
    saveMarket(updatedListings);

    const updatedInventory = inventory.filter((i) => i.id !== item.id);
    setInventory(updatedInventory);
    saveInventory(updatedInventory);

    const newProfile = { ...profile, vaultCoins: newCoins };
    setProfile(newProfile);
    saveProfile(newProfile);

    recordTransaction({
      type: 'spend',
      amount: fee,
      currency: 'VC',
      description: `Marketplace Listing Fee for ${item.name}`,
    });
  };

  const handleDuelComplete = (won: boolean, mmrDelta: number, rewardCoins: number, rewardXp: number) => {
    const nextRating = Math.max(800, profile.duelRating + mmrDelta);
    const nextCoins = profile.vaultCoins + rewardCoins;
    const nextXp = profile.xp + rewardXp;
    const nextWins = won ? profile.duelWins + 1 : profile.duelWins;
    const nextLosses = won ? profile.duelLosses : profile.duelLosses + 1;
    const nextLevel = Math.floor(nextXp / 500) + 1;

    const updatedProfile: PlayerProfile = {
      ...profile,
      duelRating: nextRating,
      vaultCoins: nextCoins,
      xp: nextXp,
      level: nextLevel,
      duelWins: nextWins,
      duelLosses: nextLosses,
    };

    setProfile(updatedProfile);
    saveProfile(updatedProfile);

    recordTransaction({
      type: 'earn',
      amount: rewardCoins,
      currency: 'VC',
      description: `Vault Duel Match Reward (${won ? 'Victory' : 'Consolation'})`,
    });

    if (won) {
      setMissions((prev) => {
        const updated = prev.map((m) =>
          m.id === 'm_duel_win' ? { ...m, progress: Math.min(m.goal, m.progress + 1) } : m
        );
        saveMissions(updated);
        return updated;
      });
    }
  };

  const handleHeistSuccess = (coins: number, tokens: number, xp: number) => {
    const updatedProfile: PlayerProfile = {
      ...profile,
      vaultCoins: profile.vaultCoins + coins,
      eventTokens: profile.eventTokens + tokens,
      xp: profile.xp + xp,
      heistsCompleted: profile.heistsCompleted + 1,
    };
    setProfile(updatedProfile);
    saveProfile(updatedProfile);

    recordTransaction({
      type: 'earn',
      amount: coins,
      currency: 'VC',
      description: 'Heist Infiltration Spoils',
    });

    setMissions((prev) => {
      const updated = prev.map((m) =>
        m.id === 'm_heist' ? { ...m, progress: Math.min(m.goal, m.progress + 1) } : m
      );
      saveMissions(updated);
      return updated;
    });
  };

  const handleUpgradeBase = (nextTier: number, cost: number) => {
    const updatedProfile: PlayerProfile = {
      ...profile,
      baseTier: nextTier,
      vaultCoins: profile.vaultCoins - cost,
    };
    setProfile(updatedProfile);
    saveProfile(updatedProfile);

    recordTransaction({
      type: 'spend',
      amount: cost,
      currency: 'VC',
      description: `Penthouse Base Upgrade to Tier ${nextTier}`,
    });
  };

  const handleUpdateFurniture = (furniture: PlacedFurniture[]) => {
    setBaseFurniture(furniture);
    saveBaseFurniture(furniture);
  };

  const handleToggleProtect = (itemId: string) => {
    const updated = inventory.map((i) => (i.id === itemId ? { ...i, protected: !i.protected } : i));
    setInventory(updated);
    saveInventory(updated);
  };

  const handleRedeemEventItem = (item: CollectibleItem, costTokens: number) => {
    const updatedProfile: PlayerProfile = {
      ...profile,
      eventTokens: profile.eventTokens - costTokens,
    };
    setProfile(updatedProfile);
    saveProfile(updatedProfile);

    const updatedInv = [item, ...inventory];
    setInventory(updatedInv);
    saveInventory(updatedInv);

    recordTransaction({
      type: 'spend',
      amount: costTokens,
      currency: 'ET',
      description: `Redeemed ${item.name} at Sunday Treasure Market`,
    });
  };

  const handleClaimBattlePassTier = (tierNumber: number) => {
    const tier = battlePass.find((t) => t.tier === tierNumber);
    if (!tier || tier.claimed) return;

    if (tier.rewardType === 'coins' && tier.rewardAmount) {
      setProfile((p) => {
        const up = { ...p, vaultCoins: p.vaultCoins + tier.rewardAmount! };
        saveProfile(up);
        return up;
      });
    } else if (tier.rewardType === 'tokens' && tier.rewardAmount) {
      setProfile((p) => {
        const up = { ...p, eventTokens: p.eventTokens + tier.rewardAmount! };
        saveProfile(up);
        return up;
      });
    } else if (tier.rewardItem) {
      setInventory((inv) => {
        const up = [tier.rewardItem!, ...inv];
        saveInventory(up);
        return up;
      });
    }

    const updatedBP = battlePass.map((t) => (t.tier === tierNumber ? { ...t, claimed: true } : t));
    setBattlePass(updatedBP);
    saveBattlePass(updatedBP);
  };

  const handleClaimMission = (missionId: string) => {
    const mission = missions.find((m) => m.id === missionId);
    if (!mission || mission.claimed) return;

    const updatedProfile: PlayerProfile = {
      ...profile,
      vaultCoins: profile.vaultCoins + mission.rewardCoins,
      xp: profile.xp + mission.rewardXp,
    };
    setProfile(updatedProfile);
    saveProfile(updatedProfile);

    const updatedMissions = missions.map((m) => (m.id === missionId ? { ...m, claimed: true } : m));
    setMissions(updatedMissions);
    saveMissions(updatedMissions);
  };

  const handleSaveAppearance = (newApp: CharacterAppearance, newNickname?: string) => {
    const updated = {
      ...profile,
      appearance: newApp,
      displayName: newNickname || profile.displayName,
    };
    setProfile(updated);
    saveProfile(updated);
  };

  const handleUpdateName = (newName: string) => {
    const updated = { ...profile, displayName: newName };
    setProfile(updated);
    saveProfile(updated);
  };

  const handleTriggerEmote = (emote: string) => {
    setActiveEmote(emote);
    setTimeout(() => {
      setActiveEmote(undefined);
    }, 3500);
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[#080c14] text-white select-none">
      {/* 3D Simulation Canvas */}
      <WorldCanvas
        currentView={currentView}
        appearance={profile.appearance}
        playerDisplayName={profile.displayName}
        playerPlotNumber={profile.assignedHomePlot}
        placedFurniture={baseFurniture}
        inventory={inventory}
        baseTier={profile.baseTier}
        keybinds={keybinds}
        isInputFocused={activeModal !== null}
        isTitleScreen={!inGame}
        spawnPosition={playerSpawnCoords}
        onZoneInteract={handleZoneInteract}
        onNearbyZoneChange={setNearbyZone}
        onNPCTalk={(npc) => {
          soundManager.playClick();
          setNpcDialog({ name: npc.name, text: npc.dialogue, role: npc.role });
          setTimeout(() => {
            setNpcDialog((curr) => (curr?.name === npc.name ? null : curr));
          }, 5000);
        }}
        activeEmote={activeEmote}
      />

      {/* NPC Speech Bubble Toast */}
      {npcDialog && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 z-30 pointer-events-auto bg-[#0a0e17]/95 border-2 border-[#38bdf8] shadow-[0_0_25px_rgba(56,189,248,0.3)] rounded-2xl px-5 py-3 max-w-md flex items-start gap-3 animate-fade-in font-sans">
          <div className="w-9 h-9 rounded-xl bg-[#38bdf8]/20 border border-[#38bdf8]/50 flex items-center justify-center text-lg shrink-0">
            🤖
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <span className="text-white font-bold text-sm">{npcDialog.name}</span>
              <span className="text-[10px] font-mono uppercase bg-[#38bdf8]/20 text-[#38bdf8] px-2 py-0.5 rounded font-bold">
                {npcDialog.role}
              </span>
            </div>
            <p className="text-xs text-[#cbd5e1] font-mono mt-1 leading-relaxed">
              "{npcDialog.text}"
            </p>
          </div>
          <button
            onClick={() => setNpcDialog(null)}
            className="text-[#64748b] hover:text-white text-xs ml-2 cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* Dynamic Market Price Alert Banner */}
      {marketAlertToast && (
        <div
          onClick={() => {
            soundManager.playClick();
            setActiveModal('dynamic_market');
            setMarketAlertToast(null);
          }}
          className="absolute top-20 right-6 z-40 pointer-events-auto bg-[#0a0e17]/95 border-2 border-[#10b981] shadow-[0_0_30px_rgba(16,185,129,0.4)] rounded-2xl p-4 max-w-sm flex items-center gap-3 cursor-pointer hover:scale-105 transition-transform font-sans"
        >
          <div className="w-10 h-10 rounded-xl bg-[#10b981]/20 border border-[#10b981] flex items-center justify-center text-xl shrink-0">
            🔔
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-white font-bold text-xs uppercase tracking-wide">
                PRICE ALERT TRIGGERED!
              </span>
            </div>
            <div className="text-xs text-[#e2e8f0] font-mono mt-0.5">
              <b className="text-[#38bdf8]">{marketAlertToast.alert.assetName}</b> hit{' '}
              <span className="text-[#10b981] font-bold">{marketAlertToast.price} VC</span>
            </div>
            <div className="text-[10px] text-[#94a3b8] font-mono mt-1 underline">
              Click to open Market Panel →
            </div>
          </div>
        </div>
      )}

      {/* Screen Routing: Home Screen / Main Menu vs In-Game HUD */}
      {!inGame ? (
        <TitleScreen
          playerProfile={profile}
          inventoryCount={inventory.length}
          onStartGame={handleStartGame}
          onEnterBaseDirectly={handleEnterBaseDirectly}
          onOpenCustomizer={() => setActiveModal('customizer')}
          onOpenMarketplace={() => setActiveModal('market')}
          onOpenInventory={() => setActiveModal('inventory')}
          onOpenSettings={() => setActiveModal('settings')}
        />
      ) : (
        <HUD
          profile={profile}
          currentView={currentView}
          nearbyZone={nearbyZone}
          onOpenMenu={(menu) => setActiveModal(menu)}
          onTriggerEmote={handleTriggerEmote}
          onSwitchView={() => {
            soundManager.playClick();
            if (currentView === 'base') {
              setCurrentView('city');
              setPlayerSpawnCoords({ x: -12, z: 45.0 });
            } else {
              setCurrentView('base');
              setPlayerSpawnCoords(null);
            }
          }}
        />
      )}

      {/* Cinematic Transition Overlay */}
      {isEnteringWorld && (
        <div className="absolute inset-0 z-50 bg-[#060a12]/95 backdrop-blur-md flex flex-col items-center justify-center animate-fade-in font-mono select-none">
          <div className="w-12 h-12 border-3 border-[#f59e0b] border-t-transparent rounded-full animate-spin mb-4 drop-shadow-[0_0_15px_rgba(245,158,11,0.5)]" />
          <div className="text-white font-black text-sm tracking-widest uppercase">
            ENTERING VAULTBOUND DISTRICT...
          </div>
          <div className="text-[#94a3b8] text-xs mt-1 font-mono">
            Plot #{profile.assignedHomePlot} Registered Residence
          </div>
        </div>
      )}

      {/* Modals & Sub-Screens */}
      {activeModal === 'auction' && (
        <GrandAuctionHouseModal
          auctions={auctions}
          inventory={inventory}
          userCoins={profile.vaultCoins}
          userName={profile.displayName}
          onPlaceBid={handlePlaceBid}
          onCreateAuction={handleCreateAuction}
          onClose={() => setActiveModal(null)}
        />
      )}

      {activeModal === 'market' && (
        <MarketplaceModal
          marketListings={marketListings}
          inventory={inventory}
          userCoins={profile.vaultCoins}
          userName={profile.displayName}
          onBuyItem={handleBuyMarketItem}
          onListItem={handleListMarketItem}
          onClose={() => setActiveModal(null)}
        />
      )}

      {activeModal === 'dynamic_market' && (
        <DynamicMarketModal
          userCoins={profile.vaultCoins}
          onUpdateCoins={(newCoins) => {
            const up = { ...profile, vaultCoins: newCoins };
            setProfile(up);
            saveProfile(up);
          }}
          onClose={() => setActiveModal(null)}
        />
      )}

      {activeModal === 'duel' && (
        <VaultDuelArenaModal
          playerMmr={profile.duelRating}
          playerCoins={profile.vaultCoins}
          onMatchComplete={handleDuelComplete}
          onClose={() => setActiveModal(null)}
        />
      )}

      {activeModal === 'heist' && (
        <HeistMissionModal
          onSuccess={handleHeistSuccess}
          onClose={() => setActiveModal(null)}
        />
      )}

      {activeModal === 'base' && (
        <PersonalBaseModal
          baseTier={profile.baseTier}
          placedFurniture={baseFurniture}
          inventory={inventory}
          userCoins={profile.vaultCoins}
          onUpgradeBase={handleUpgradeBase}
          onUpdateFurniture={handleUpdateFurniture}
          onClose={() => setActiveModal(null)}
        />
      )}

      {activeModal === 'inventory' && (
        <InventoryModal
          inventory={inventory}
          userCoins={profile.vaultCoins}
          onToggleProtect={handleToggleProtect}
          onEquipClothing={(item) => {
            if (item.category === 'clothing') {
              const updatedApp: CharacterAppearance = {
                ...profile.appearance,
                topColor: item.color,
                topStyle: item.name.toLowerCase().includes('bomber')
                  ? 'bomber_jacket'
                  : item.name.toLowerCase().includes('vest')
                  ? 'tactical_vest'
                  : 'hoodie',
              };
              handleSaveAppearance(updatedApp);
            } else if (item.category === 'accessory') {
              const updatedApp: CharacterAppearance = {
                ...profile.appearance,
                accessory: item.name.toLowerCase().includes('cap')
                  ? 'cap'
                  : item.name.toLowerCase().includes('visor')
                  ? 'cyber_visor'
                  : 'gold_chain',
              };
              handleSaveAppearance(updatedApp);
            }
          }}
          onGoToBase={() => {
            setCurrentView('base');
            setActiveModal('base');
          }}
          onClose={() => setActiveModal(null)}
        />
      )}

      {activeModal === 'event' && (
        <EventSquareModal
          userTokens={profile.eventTokens}
          onRedeemItem={handleRedeemEventItem}
          onClose={() => setActiveModal(null)}
        />
      )}

      {activeModal === 'battlepass' && (
        <BattlePassModal
          tiers={battlePass}
          missions={missions}
          currentXp={profile.xp}
          onClaimTier={handleClaimBattlePassTier}
          onClaimMission={handleClaimMission}
          onClose={() => setActiveModal(null)}
        />
      )}

      {activeModal === 'customizer' && (
        <CharacterCreatorModal
          currentAppearance={profile.appearance}
          playerNickname={profile.displayName}
          onSave={handleSaveAppearance}
          onClose={() => setActiveModal(null)}
        />
      )}

      {activeModal === 'profile' && (
        <ProfileModal
          profile={profile}
          inventory={inventory}
          onUpdateName={handleUpdateName}
          onClose={() => setActiveModal(null)}
        />
      )}

      {activeModal === 'settings' && (
        <PauseSettingsModal
          roomCode={profile.activeRoomCode}
          keybinds={keybinds}
          onUpdateKeybinds={handleUpdateKeybinds}
          onUpdateRoomCode={(newCode) => {
            const up = { ...profile, activeRoomCode: newCode };
            setProfile(up);
            saveProfile(up);
          }}
          onResume={() => setActiveModal(null)}
          onExitToTitle={() => {
            setActiveModal(null);
            setInGame(false);
          }}
          fromMainMenu={!inGame}
        />
      )}
    </div>
  );
};
