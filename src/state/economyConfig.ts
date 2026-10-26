/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export const ECONOMY_CONFIG = {
  CURRENCY_NAME: 'Vault Coins',
  CURRENCY_TICKER: 'VC',
  TOKEN_NAME: 'Event Tokens',
  TOKEN_TICKER: 'ET',
  STARTING_COINS: 3500,
  STARTING_TOKENS: 250,
  MARKETPLACE_FEE_PERCENT: 0.05, // 5% listing fee
  MIN_MARKET_PRICE: 50,
  AUCTION_MIN_START_PRICE: 100,
  AUCTION_ANTI_SNIPE_WINDOW_MS: 30000, // 30s
  AUCTION_ANTI_SNIPE_EXTENSION_MS: 30000,
  BASE_UPGRADE_COSTS: {
    TIER_2: 3500, // Sky Loft -> Executive Penthouse
    TIER_3: 8000, // Executive Penthouse -> Sovereign Citadel
  },
  DUEL_REWARDS: {
    WIN_COINS: 450,
    WIN_XP: 250,
    WIN_MMR: 28,
    LOSS_COINS: 100,
    LOSS_XP: 80,
    LOSS_MMR: -18,
  },
  HEIST_REWARDS: {
    COINS: 850,
    TOKENS: 60,
    XP: 350,
  },
};

export function formatCoins(amount: number): string {
  return `${amount.toLocaleString()} ${ECONOMY_CONFIG.CURRENCY_TICKER}`;
}

export function formatTokens(amount: number): string {
  return `${amount.toLocaleString()} ${ECONOMY_CONFIG.TOKEN_TICKER}`;
}
