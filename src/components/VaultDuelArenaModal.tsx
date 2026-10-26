/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { DuelAction, DuelRoundResult } from '../types/game';
import { soundManager } from '../audio/soundManager';

interface VaultDuelArenaModalProps {
  playerMmr: number;
  playerCoins: number;
  onMatchComplete: (won: boolean, mmrDelta: number, rewardCoins: number, rewardXp: number) => void;
  onClose: () => void;
}

interface ActionMeta {
  action: DuelAction;
  name: string;
  cost: number;
  icon: string;
  desc: string;
  counters: string;
}

const DUEL_ACTIONS: ActionMeta[] = [
  { action: 'swipe', name: 'Swipe', cost: 15, icon: '⚡', desc: 'Attempt to grab the round vault pot immediately.', counters: 'Invests & Scours' },
  { action: 'guard', name: 'Guard', cost: 10, icon: '🛡️', desc: 'Deploy kinetic barrier. Reflects incoming Swipes.', counters: 'Swipes' },
  { action: 'invest', name: 'Invest', cost: 20, icon: '📈', desc: 'Commit resources to double the round pot.', counters: 'Guards & Secures' },
  { action: 'counter', name: 'Counter', cost: 25, icon: '⚔️', desc: 'Trap predictable aggressive moves for massive damage.', counters: 'Swipes & Disrupts' },
  { action: 'bluff', name: 'Bluff', cost: 5, icon: '🎭', desc: 'Feint an action; generates +30 Energy and masks intent.', counters: 'Counters' },
  { action: 'secure', name: 'Secure', cost: 15, icon: '🔒', desc: 'Safely bank active pot into permanent victory score.', counters: 'Scouts' },
  { action: 'scout', name: 'Scout', cost: 10, icon: '👁️', desc: 'Expose opponent bluff and guarantee bonus tactical energy.', counters: 'Bluffs' },
  { action: 'disrupt', name: 'Disrupt', cost: 20, icon: '💥', desc: 'Shock opponent system, draining their tactical energy.', counters: 'Invests' },
];

export const VaultDuelArenaModal: React.FC<VaultDuelArenaModalProps> = ({
  playerMmr,
  onMatchComplete,
  onClose,
}) => {
  const [gameState, setGameState] = useState<'lobby' | 'playing' | 'revealing' | 'ended'>('lobby');
  const [matchType, setMatchType] = useState<'ranked' | 'casual'>('ranked');
  const [round, setRound] = useState(1);
  const [playerHp, setPlayerHp] = useState(1000);
  const [opponentHp, setOpponentHp] = useState(1000);
  const [playerEnergy, setPlayerEnergy] = useState(100);
  const [opponentEnergy, setOpponentEnergy] = useState(100);
  const [playerBankedScore, setPlayerBankedScore] = useState(0);
  const [opponentBankedScore, setOpponentBankedScore] = useState(0);
  const [currentPot, setCurrentPot] = useState(300);

  const [selectedAction, setSelectedAction] = useState<DuelAction | null>(null);
  const [revealedPlayerAction, setRevealedPlayerAction] = useState<DuelAction | null>(null);
  const [revealedOpponentAction, setRevealedOpponentAction] = useState<DuelAction | null>(null);
  const [roundOutcomeSummary, setRoundOutcomeSummary] = useState<string>('');
  const [history, setHistory] = useState<DuelRoundResult[]>([]);
  const [matchWon, setMatchWon] = useState<boolean>(false);

  // Opponent Identity
  const opponentName = matchType === 'ranked' ? 'GrandMaster_Vex (MMR ' + (playerMmr + 15) + ')' : 'Combat Drone MK-IV';

  const startMatch = () => {
    soundManager.playCardSlam();
    setRound(1);
    setPlayerHp(1000);
    setOpponentHp(1000);
    setPlayerEnergy(100);
    setOpponentEnergy(100);
    setPlayerBankedScore(0);
    setOpponentBankedScore(0);
    setCurrentPot(350);
    setHistory([]);
    setSelectedAction(null);
    setRevealedPlayerAction(null);
    setRevealedOpponentAction(null);
    setRoundOutcomeSummary('Round 1 beginning: Choose your secret tactical card.');
    setGameState('playing');
  };

  const handleActionSelect = (act: DuelAction) => {
    const meta = DUEL_ACTIONS.find((m) => m.action === act);
    if (!meta) return;
    if (playerEnergy < meta.cost) {
      soundManager.playAlarm();
      return;
    }
    soundManager.playClick();
    setSelectedAction(act);
  };

  const submitAction = () => {
    if (!selectedAction) return;
    soundManager.playCardSlam();
    setGameState('revealing');

    // Simulate opponent choice based on smart prediction AI
    const possibleOpponentActions: DuelAction[] = ['swipe', 'guard', 'invest', 'counter', 'bluff', 'secure', 'scout', 'disrupt'];
    // Weight opponent strategy based on current pot size
    let oppAction: DuelAction = 'swipe';
    if (currentPot > 600) {
      oppAction = Math.random() > 0.4 ? 'swipe' : Math.random() > 0.5 ? 'guard' : 'secure';
    } else {
      oppAction = possibleOpponentActions[Math.floor(Math.random() * possibleOpponentActions.length)];
    }

    setRevealedPlayerAction(selectedAction);
    setRevealedOpponentAction(oppAction);

    // Calculate simultaneous interactions
    let potEarned = 0;
    let pDmg = 0;
    let oDmg = 0;
    let newPot = currentPot + 150;
    let summaryText = '';

    // Action matrix resolution
    if (selectedAction === 'swipe' && oppAction === 'guard') {
      summaryText = 'You attempted a Swipe, but opponent deployed kinetic Guard! Swipe reflected for 200 damage.';
      pDmg = 200;
    } else if (selectedAction === 'guard' && oppAction === 'swipe') {
      summaryText = 'Opponent Swiped straight into your kinetic Guard! You absorbed the attack and reflected 200 damage!';
      oDmg = 200;
    } else if (selectedAction === 'swipe' && oppAction === 'invest') {
      summaryText = `BRILLIANT SWIPE! Opponent invested resources, exposing the pot. You stole the entire pot of ${currentPot} VC!`;
      potEarned = currentPot;
      newPot = 200;
      oDmg = 150;
    } else if (selectedAction === 'invest' && oppAction === 'swipe') {
      summaryText = `OPPONENT SWIPED YOUR INVEST! Opponent stole the active pot of ${currentPot} VC while you were investing.`;
      setOpponentBankedScore((prev) => prev + currentPot);
      newPot = 200;
      pDmg = 150;
    } else if (selectedAction === 'counter' && (oppAction === 'swipe' || oppAction === 'disrupt')) {
      summaryText = `PUNISHING COUNTER! You predicted opponent's aggressive ${oppAction.toUpperCase()} and dealt 350 critical counter damage!`;
      oDmg = 350;
    } else if (oppAction === 'counter' && (selectedAction === 'swipe' || selectedAction === 'disrupt')) {
      summaryText = `COUNTERED! Opponent foresaw your aggressive ${selectedAction.toUpperCase()} and dealt 350 counter damage to your shields.`;
      pDmg = 350;
    } else if (selectedAction === 'secure') {
      summaryText = `VAULT SECURED! You permanently banked ${Math.round(currentPot * 0.7)} points into your victory reserves.`;
      potEarned = Math.round(currentPot * 0.7);
      newPot = 200;
    } else if (selectedAction === 'bluff') {
      summaryText = 'TACTICAL FEINT! Your bluff deceived the opponent, replenishing +40 energy.';
      setPlayerEnergy((prev) => Math.min(100, prev + 40));
    } else if (selectedAction === 'invest') {
      summaryText = `DOUBLE INVESTMENT! You committed fuel to the round pot, multiplying it by 1.8x.`;
      newPot = Math.round(currentPot * 1.8);
    } else {
      summaryText = `Simultaneous clash: You played ${selectedAction.toUpperCase()} while opponent played ${oppAction.toUpperCase()}. Minor tactical engagement.`;
      oDmg = 80;
      pDmg = 80;
    }

    const nextPlayerHp = Math.max(0, playerHp - pDmg);
    const nextOpponentHp = Math.max(0, opponentHp - oDmg);
    const nextPlayerScore = playerBankedScore + potEarned;

    setPlayerHp(nextPlayerHp);
    setOpponentHp(nextOpponentHp);
    setPlayerBankedScore(nextPlayerScore);
    setCurrentPot(newPot);
    setRoundOutcomeSummary(summaryText);

    const roundRec: DuelRoundResult = {
      round,
      playerAction: selectedAction,
      opponentAction: oppAction,
      summary: summaryText,
      potEarned,
      playerHpChange: -pDmg,
      opponentHpChange: -oDmg,
    };
    setHistory((prev) => [...prev, roundRec]);

    // Check match completion
    setTimeout(() => {
      if (nextPlayerHp <= 0 || nextOpponentHp <= 0 || round >= 5) {
        const won = nextOpponentHp <= 0 || nextPlayerScore > opponentBankedScore || nextPlayerHp > nextPlayerHp;
        setMatchWon(won);
        setGameState('ended');
        if (won) {
          soundManager.playVictory();
          onMatchComplete(true, 28, 450, 250);
        } else {
          soundManager.playAlarm();
          onMatchComplete(false, -18, 100, 80);
        }
      } else {
        setRound((r) => r + 1);
        setGameState('playing');
        setSelectedAction(null);
        setRevealedPlayerAction(null);
        setRevealedOpponentAction(null);
      }
    }, 2800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 animate-fade-in font-sans">
      <div className="bg-[#0a0e17] border border-[#a855f7]/50 rounded-3xl w-full max-w-5xl h-[88vh] flex flex-col shadow-[0_0_60px_rgba(168,85,247,0.2)] overflow-hidden">
        {/* Arena Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#1e293b] bg-[#0e101f]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#7c3aed] to-[#c084fc] flex items-center justify-center text-[#0a0e17] text-xl font-black shadow-md">
              ⚔️
            </div>
            <div>
              <h2 className="text-white font-bold text-lg tracking-wide flex items-center gap-2">
                <span>VAULT DUEL ARENA</span>
                <span className="text-[10px] font-mono uppercase bg-[#a855f7]/20 text-[#c084fc] px-2 py-0.5 rounded border border-[#a855f7]/40 font-bold">
                  {matchType === 'ranked' ? 'RANKED COMPETITIVE' : 'CASUAL PRACTICE'}
                </span>
              </h2>
              <p className="text-xs text-[#94a3b8] font-mono">
                Simultaneous bluffing & tactical prediction · 5 rounds to glory
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

        {/* Game State Branches */}
        {gameState === 'lobby' ? (
          <div className="flex-1 p-8 flex flex-col items-center justify-center text-center max-w-2xl mx-auto space-y-6">
            <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-[#7c3aed] to-[#38bdf8] flex items-center justify-center text-4xl shadow-[0_0_40px_rgba(168,85,247,0.4)]">
              🛡️
            </div>
            <div>
              <h3 className="text-white font-extrabold text-2xl tracking-tight">Enter the Vault Duel</h3>
              <p className="text-xs text-[#94a3b8] font-mono mt-2 leading-relaxed">
                Vault Duel is the signature tactical bluffing game of Vaultbound. Predict opponent intentions, guard against swipes, time your investments, and bank the vault loot.
              </p>
            </div>

            <div className="flex items-center gap-4 w-full">
              <div
                onClick={() => setMatchType('ranked')}
                className={`flex-1 p-4 rounded-2xl border cursor-pointer transition-all ${
                  matchType === 'ranked'
                    ? 'bg-[#a855f7]/15 border-[#a855f7] shadow-[0_0_20px_rgba(168,85,247,0.25)]'
                    : 'bg-[#121824] border-[#1e293b]'
                }`}
              >
                <div className="text-sm font-bold text-white">Ranked Match</div>
                <div className="text-[11px] text-[#c084fc] font-mono mt-1">+28 MMR / -18 MMR · 450 VC Pot</div>
              </div>

              <div
                onClick={() => setMatchType('casual')}
                className={`flex-1 p-4 rounded-2xl border cursor-pointer transition-all ${
                  matchType === 'casual'
                    ? 'bg-[#38bdf8]/15 border-[#38bdf8] shadow-[0_0_20px_rgba(56,189,248,0.25)]'
                    : 'bg-[#121824] border-[#1e293b]'
                }`}
              >
                <div className="text-sm font-bold text-white">Casual Practice</div>
                <div className="text-[11px] text-[#38bdf8] font-mono mt-1">Zero risk · Skill training</div>
              </div>
            </div>

            <button
              onClick={startMatch}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-[#7c3aed] via-[#a855f7] to-[#38bdf8] hover:opacity-95 text-[#0a0e17] font-black text-base tracking-wider uppercase shadow-xl transition-all font-mono"
            >
              INITIATE VAULT DUEL
            </button>
          </div>
        ) : gameState === 'ended' ? (
          <div className="flex-1 p-8 flex flex-col items-center justify-center text-center max-w-xl mx-auto space-y-5">
            <div
              className={`w-24 h-24 rounded-3xl flex items-center justify-center text-5xl shadow-2xl ${
                matchWon
                  ? 'bg-gradient-to-tr from-[#10b981] to-[#34d399] text-[#0a0e17]'
                  : 'bg-gradient-to-tr from-[#ef4444] to-[#f87171] text-white'
              }`}
            >
              {matchWon ? '🏆' : '💀'}
            </div>

            <div>
              <h3 className="text-white font-extrabold text-2xl tracking-tight">
                {matchWon ? 'VICTORY ARCHITECT!' : 'VAULT DEFENSE BREACHED'}
              </h3>
              <p className="text-xs text-[#94a3b8] font-mono mt-1">
                {matchWon
                  ? 'Your strategic bluffing and calculated timings outperformed your rival.'
                  : 'Your opponent countered your tactical rhythm. Analyze your play and return stronger.'}
              </p>
            </div>

            <div className="grid grid-cols-3 gap-3 w-full font-mono text-xs">
              <div className="bg-[#121824] p-3 rounded-xl border border-[#1e293b]">
                <span className="text-[#64748b] block text-[10px]">MMR DELTA</span>
                <span className={`font-bold ${matchWon ? 'text-[#10b981]' : 'text-[#ef4444]'}`}>
                  {matchWon ? '+28 Rating' : '-18 Rating'}
                </span>
              </div>
              <div className="bg-[#121824] p-3 rounded-xl border border-[#1e293b]">
                <span className="text-[#64748b] block text-[10px]">VAULT COINS</span>
                <span className="text-[#f59e0b] font-bold">+{matchWon ? '450' : '100'} VC</span>
              </div>
              <div className="bg-[#121824] p-3 rounded-xl border border-[#1e293b]">
                <span className="text-[#64748b] block text-[10px]">BATTLE PASS XP</span>
                <span className="text-[#38bdf8] font-bold">+{matchWon ? '250' : '80'} XP</span>
              </div>
            </div>

            <button
              onClick={startMatch}
              className="w-full py-3.5 rounded-xl bg-[#a855f7] hover:bg-[#9333ea] text-white font-bold text-sm transition-all font-mono"
            >
              PLAY REMATCH
            </button>
          </div>
        ) : (
          <div className="flex-1 flex flex-col justify-between p-6 overflow-hidden">
            {/* Top Scoreboard: Opponent vs Player */}
            <div className="grid grid-cols-3 items-center gap-4 bg-[#0e1424] border border-[#1e293b] p-4 rounded-2xl">
              {/* Left: You */}
              <div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-[#10b981]" />
                  <span className="text-white font-bold text-sm">YOU</span>
                </div>
                <div className="mt-2 space-y-1 text-xs font-mono">
                  <div className="flex justify-between text-[#94a3b8]">
                    <span>Shield:</span>
                    <span className="text-white font-bold tabular-nums">{playerHp} / 1000</span>
                  </div>
                  <div className="w-full bg-[#1e293b] h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-emerald-500 h-full transition-all duration-300"
                      style={{ width: `${(playerHp / 1000) * 100}%` }}
                    />
                  </div>
                  <div className="text-[11px] text-[#38bdf8] font-bold">
                    Energy: {playerEnergy}/100 · Banked: {playerBankedScore} pts
                  </div>
                </div>
              </div>

              {/* Center: Round & Vault Pot */}
              <div className="text-center">
                <span className="text-[11px] font-mono uppercase bg-[#a855f7]/20 text-[#c084fc] px-2 py-0.5 rounded border border-[#a855f7]/40 font-bold">
                  ROUND {round} / 5
                </span>
                <div className="mt-2">
                  <div className="text-[10px] text-[#64748b] font-mono">ROUND ACTIVE POT</div>
                  <div className="text-2xl font-black font-mono text-[#f59e0b] tabular-nums tracking-wide">
                    {currentPot.toLocaleString()} <span className="text-sm">VC</span>
                  </div>
                </div>
              </div>

              {/* Right: Opponent */}
              <div className="text-right">
                <div className="flex items-center justify-end gap-2">
                  <span className="text-white font-bold text-sm">{opponentName}</span>
                  <span className="w-3 h-3 rounded-full bg-[#ef4444]" />
                </div>
                <div className="mt-2 space-y-1 text-xs font-mono">
                  <div className="flex justify-between text-[#94a3b8]">
                    <span className="text-white font-bold tabular-nums">{opponentHp} / 1000</span>
                    <span>Shield:</span>
                  </div>
                  <div className="w-full bg-[#1e293b] h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-rose-500 h-full ml-auto transition-all duration-300"
                      style={{ width: `${(opponentHp / 1000) * 100}%` }}
                    />
                  </div>
                  <div className="text-[11px] text-[#ef4444] font-bold">
                    Energy: {opponentEnergy}/100 · Banked: {opponentBankedScore} pts
                  </div>
                </div>
              </div>
            </div>

            {/* Center Duel Arena: Card Clash Visualizer */}
            <div className="my-auto flex flex-col items-center justify-center p-4">
              {gameState === 'revealing' ? (
                <div className="flex flex-col items-center gap-4 animate-scale-up">
                  <div className="flex items-center gap-8">
                    {/* Player Revealed Card */}
                    <div className="w-32 h-44 bg-gradient-to-b from-[#1e293b] to-[#0f172a] border-2 border-[#10b981] rounded-2xl flex flex-col items-center justify-center p-3 text-center shadow-2xl">
                      <span className="text-3xl mb-1">
                        {DUEL_ACTIONS.find((m) => m.action === revealedPlayerAction)?.icon}
                      </span>
                      <span className="text-white font-bold uppercase text-xs">
                        {revealedPlayerAction}
                      </span>
                      <span className="text-[9px] text-[#10b981] font-mono mt-1 font-bold">YOUR PLAY</span>
                    </div>

                    <div className="text-2xl font-black text-[#a855f7] animate-pulse">VS</div>

                    {/* Opponent Revealed Card */}
                    <div className="w-32 h-44 bg-gradient-to-b from-[#1e293b] to-[#0f172a] border-2 border-[#ef4444] rounded-2xl flex flex-col items-center justify-center p-3 text-center shadow-2xl">
                      <span className="text-3xl mb-1">
                        {DUEL_ACTIONS.find((m) => m.action === revealedOpponentAction)?.icon}
                      </span>
                      <span className="text-white font-bold uppercase text-xs">
                        {revealedOpponentAction}
                      </span>
                      <span className="text-[9px] text-[#ef4444] font-mono mt-1 font-bold">OPPONENT</span>
                    </div>
                  </div>

                  <div className="text-xs font-mono text-center text-[#e2e8f0] bg-[#121824] border border-[#a855f7]/40 px-6 py-2.5 rounded-xl max-w-xl">
                    {roundOutcomeSummary}
                  </div>
                </div>
              ) : (
                <div className="text-center space-y-2">
                  <div className="text-sm font-mono text-[#94a3b8]">
                    Select 1 of 8 tactical cards to play simultaneously against your opponent.
                  </div>
                  {roundOutcomeSummary && (
                    <div className="text-xs font-mono text-[#38bdf8] bg-[#0e1424] px-4 py-1.5 rounded-xl border border-[#1e293b] inline-block">
                      {roundOutcomeSummary}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Bottom Card Selection Deck */}
            <div>
              <div className="grid grid-cols-4 sm:grid-cols-8 gap-2 mb-3">
                {DUEL_ACTIONS.map((card) => {
                  const isSelected = selectedAction === card.action;
                  const canAfford = playerEnergy >= card.cost;

                  return (
                    <div
                      key={card.action}
                      onClick={() => handleActionSelect(card.action)}
                      className={`p-2.5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                        isSelected
                          ? 'bg-[#a855f7]/25 border-[#a855f7] -translate-y-2 shadow-[0_0_20px_rgba(168,85,247,0.3)]'
                          : canAfford
                          ? 'bg-[#0f172a] border-[#1e293b] hover:border-[#38bdf8]/60 hover:bg-[#121824]'
                          : 'opacity-40 bg-[#0a0e17] border-[#1e293b] cursor-not-allowed'
                      }`}
                    >
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-lg">{card.icon}</span>
                        <span className="text-[10px] font-mono text-[#f59e0b] font-bold">{card.cost}E</span>
                      </div>
                      <div className="my-1.5">
                        <div className="text-white font-bold text-xs">{card.name}</div>
                        <div className="text-[9px] text-[#94a3b8] leading-tight line-clamp-2 mt-0.5">
                          {card.desc}
                        </div>
                      </div>
                      <div className="text-[8px] font-mono text-[#38bdf8] truncate">
                        Vs: {card.counters}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Commit Action Button */}
              <button
                disabled={!selectedAction || gameState === 'revealing'}
                onClick={submitAction}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-[#7c3aed] to-[#a855f7] hover:from-[#6d28d9] hover:to-[#7c3aed] disabled:opacity-40 text-white font-black text-sm tracking-wider uppercase font-mono shadow-lg transition-all"
              >
                {selectedAction
                  ? `LOCK IN ${selectedAction.toUpperCase()} (REVEAL SIMULTANEOUSLY)`
                  : 'SELECT A TACTICAL CARD'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
