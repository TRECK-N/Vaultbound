/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type ItemRarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary' | 'mythic';

export type ItemCategory = 'clothing' | 'accessory' | 'artifact' | 'statue' | 'furniture' | 'tool';

export interface CollectibleItem {
  id: string;
  name: string;
  category: ItemCategory;
  rarity: ItemRarity;
  description: string;
  estimatedValue: number;
  tradable: boolean;
  protected: boolean;
  serialNumber?: number;
  maxSupply?: number;
  modelType: 'cube_artifact' | 'chalice' | 'crown' | 'dragon_statue' | 'gem_core' | 'jacket' | 'pedestal' | 'sofa' | 'safe' | 'table' | 'plant' | 'rug';
  color: string;
  accentColor?: string;
  acquiredAt?: string;
  acquisitionSource: string;
  clothingSlot?: 'top' | 'pants' | 'shoes' | 'accessory';
}

export type RobotHeadChassis = 'capsule_dome' | 'cyber_cube' | 'retro_terminal' | 'aero_helm' | 'visor_unit';
export type RobotEyeDisplay = 'neon_reticles' | 'glow_visor' | 'pixel_smile' | 'stealth_slit' | 'matrix_dots';
export type RobotFrameMaterial = 'matte_stealth' | 'titanium_chrome' | 'white_ceramic' | 'obsidian_gold' | 'neon_circuit';
export type RobotCoreReactor = 'arc_pulse' | 'hazard_tri' | 'flux_battery' | 'golden_sigil';
export type RobotJacketStyle = 'none' | 'hoodie' | 'bomber_jacket' | 'tactical_vest' | 'cyber_blazer' | 'casual_tee';
export type RobotFootwear = 'magnetic_boots' | 'cyber_sneakers' | 'piston_striders';
export type RobotHeadAccessory = 'none' | 'antenna_comms' | 'halo_ring' | 'cyber_cap' | 'gold_chain' | 'tech_backpack';

export interface CharacterAppearance {
  // Mini-Robot Signature Anatomy
  headChassis: RobotHeadChassis;
  eyeDisplay: RobotEyeDisplay;
  eyeColor: string;
  chassisMaterial: RobotFrameMaterial;
  chassisColor: string;
  accentColor: string;
  coreReactor: RobotCoreReactor;
  coreColor: string;

  // Streetwear & Apparel adapted for robots
  topStyle: RobotJacketStyle;
  topColor: string;
  footwearStyle: RobotFootwear;
  footwearColor: string;
  headAccessory: RobotHeadAccessory;
  accessoryColor: string;

  // Backward-compatibility properties
  genderPreset?: 'athletic' | 'slim' | 'heavy';
  skinTone?: string;
  hairStyle?: 'fade' | 'messy' | 'mohawk' | 'dreads' | 'slick' | 'buzz' | string;
  hairColor?: string;
  facialPreset?: 'sharp' | 'soft' | 'cybernetic' | 'rugged' | string;
  pantsStyle?: 'cargo_joggers' | 'denim_jeans' | 'tactical_slacks' | 'biker_pants' | string;
  pantsColor?: string;
  shoesStyle?: 'street_sneakers' | 'combat_boots' | 'runner_trainers' | string;
  sneakersColor?: string;
  accessory?: 'none' | 'gold_chain' | 'cyber_visor' | 'tech_backpack' | 'cap' | 'tactical_mask' | 'designer_glasses' | string;
}

export interface PlayerProfile {
  id: string;
  displayName: string;
  vaultCoins: number;
  eventTokens: number;
  level: number;
  xp: number;
  duelRating: number;
  duelWins: number;
  duelLosses: number;
  heistsCompleted: number;
  baseTier: number;
  assignedHomePlot: number; // e.g. Plot 7 in Residential District
  appearance: CharacterAppearance;
  activeRoomCode: string;
  gameMode: 'solo' | 'friends' | 'public_lobby';
}

export interface LobbyInfo {
  id: string;
  name: string;
  hostName: string;
  playersCount: number;
  maxPlayers: number;
  isPrivate: boolean;
  roomCode: string;
  status: 'waiting' | 'in_progress';
  members: { id: string; name: string; isReady: boolean; isHost: boolean }[];
}

export interface AuctionListing {
  id: string;
  itemId: string;
  item: CollectibleItem;
  sellerName: string;
  currentBid: number;
  startingPrice: number;
  highestBidder: string;
  bidCount: number;
  endTime: number;
  isMysteryCrate?: boolean;
}

export interface MarketListing {
  id: string;
  itemId: string;
  item: CollectibleItem;
  sellerName: string;
  price: number;
  listedAt: number;
}

export interface PlacedFurniture {
  id: string;
  furnitureId: string;
  name: string;
  type: 'sofa' | 'pedestal' | 'safe' | 'plant' | 'neon_sign' | 'table' | 'rug';
  x: number;
  z: number;
  rotation: number;
  displayedItemId?: string;
}

export type DuelAction =
  | 'scout'
  | 'guard'
  | 'bluff'
  | 'swipe'
  | 'invest'
  | 'counter'
  | 'secure'
  | 'disrupt';

export interface DuelRoundResult {
  round: number;
  playerAction: DuelAction;
  opponentAction: DuelAction;
  summary: string;
  potEarned: number;
  playerHpChange: number;
  opponentHpChange: number;
}

export interface BattlePassTier {
  tier: number;
  requiredXp: number;
  rewardType: 'coins' | 'tokens' | 'item';
  rewardAmount?: number;
  rewardItem?: CollectibleItem;
  claimed: boolean;
}

export interface DailyMission {
  id: string;
  title: string;
  desc: string;
  rewardXp: number;
  rewardCoins: number;
  progress: number;
  goal: number;
  completed: boolean;
  claimed: boolean;
}

export interface OtherPlayer {
  id: string;
  name: string;
  x: number;
  z: number;
  rotation: number;
  appearance: CharacterAppearance;
  isMoving: boolean;
  activeEmote?: string;
  chatBubble?: string;
}
