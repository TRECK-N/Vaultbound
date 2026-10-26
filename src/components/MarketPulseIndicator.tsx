/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { dynamicMarketService, MarketAsset } from '../state/dynamicMarket';
import { soundManager } from '../audio/soundManager';

interface MarketPulseIndicatorProps {
  onOpenMarket: () => void;
}

export const MarketPulseIndicator: React.FC<MarketPulseIndicatorProps> = ({ onOpenMarket }) => {
  const [, setTick] = useState(0);

  useEffect(() => {
    const unsub = dynamicMarketService.subscribe(() => {
      setTick((t) => t + 1);
    });
    return unsub;
  }, []);

  const pulse = dynamicMarketService.getMarketPulse();
  const activeEvent = dynamicMarketService.getActiveEvent();

  const isBullish = pulse.marketTrend === 'bullish';
  const isBearish = pulse.marketTrend === 'bearish';

  return (
    <div
      onClick={() => {
        soundManager.playClick();
        onOpenMarket();
      }}
      className="group flex items-center gap-2.5 bg-[#0a0e17]/95 hover:bg-[#121927] border border-[#1e293b] hover:border-[#f59e0b]/70 px-3.5 py-1.5 rounded-2xl cursor-pointer shadow-xl transition-all pointer-events-auto select-none"
      title="Click to open Live Virtual Market & Portfolio [M]"
    >
      {/* Live Market Pulsing Dot */}
      <div className="flex items-center gap-1.5">
        <span
          className={`w-2 h-2 rounded-full ${
            isBullish ? 'bg-[#10b981]' : isBearish ? 'bg-[#ef4444]' : 'bg-[#f59e0b]'
          } animate-pulse`}
        />
        <span className="text-[11px] font-mono font-bold tracking-wider text-white group-hover:text-[#f59e0b] transition-colors">
          MARKET PULSE
        </span>
      </div>

      <div className="w-[1px] h-3.5 bg-[#1e293b]" />

      {/* Up / Down Stats */}
      <div className="flex items-center gap-2 text-[11px] font-mono">
        <span className="flex items-center text-[#10b981] font-bold">
          ↑ {pulse.risingCount}
        </span>
        <span className="flex items-center text-[#ef4444] font-bold">
          ↓ {pulse.fallingCount}
        </span>
      </div>

      {/* Mini Ticker Highlight */}
      {pulse.topGainer && (
        <div className="hidden md:flex items-center gap-2 text-[11px] font-mono border-l border-[#1e293b] pl-2.5">
          <span className="text-[#94a3b8] truncate max-w-[110px]">{pulse.topGainer.name}:</span>
          <span className="text-[#10b981] font-bold">
            +{pulse.topGainer.change24h}%
          </span>
        </div>
      )}

      {/* Active Event badge if running */}
      {activeEvent && (
        <span className="hidden lg:inline-block text-[9px] bg-[#f59e0b]/15 text-[#f59e0b] border border-[#f59e0b]/30 px-1.5 py-0.5 rounded font-mono font-bold uppercase truncate max-w-[130px]">
          {activeEvent.title}
        </span>
      )}

      <span className="text-[10px] text-[#64748b] group-hover:text-white transition-colors font-mono ml-0.5">
        [M]
      </span>
    </div>
  );
};
