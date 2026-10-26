/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type DayNightPhase = 'dawn' | 'day' | 'sunset' | 'night';

export interface TimeOfDayInfo {
  hours: number;
  minutes: number;
  timeString: string;
  phase: DayNightPhase;
  phaseName: string;
  icon: string;
  // Dynamic Lighting parameters
  sunAltitude: number;       // radians above horizon
  sunAzimuth: number;        // radians around horizon
  sunColor: string;
  sunIntensity: number;
  ambientSkyColor: string;
  ambientGroundColor: string;
  ambientIntensity: number;
  fogColor: string;
  fogDensity: number;
  nightFactor: number;       // 0 = broad daylight, 1 = midnight
  starsOpacity: number;      // 0 = invisible, 1 = fully glowing
  windowGlowIntensity: number;
  streetlampGlowIntensity: number;
}

const STORAGE_KEY_TIME = 'vb_world_time_v1';

// Default full day length in real seconds: 20 minutes (1200 seconds)
export const DAY_CYCLE_CONFIG = {
  dayLengthSeconds: 1200,    // 20 real minutes = 24 in-game hours
  initialHour: 10.5,         // Starts at 10:30 AM bright morning
  // Phase thresholds in hours
  dawnStart: 5.0,
  dayStart: 7.5,
  sunsetStart: 17.0,
  nightStart: 20.0,
};

class DayNightManager {
  private currentHours: number = DAY_CYCLE_CONFIG.initialHour;
  private listeners: Set<(info: TimeOfDayInfo) => void> = new Set();
  private lastSaveTime: number = 0;

  constructor() {
    this.loadPersistedTime();
  }

  private loadPersistedTime() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_TIME);
      if (saved) {
        const val = parseFloat(saved);
        if (!isNaN(val) && val >= 0 && val < 24) {
          this.currentHours = val;
        }
      }
    } catch {
      // fallback
    }
  }

  public savePersistedTime() {
    try {
      localStorage.setItem(STORAGE_KEY_TIME, this.currentHours.toFixed(2));
    } catch {
      // ignore
    }
  }

  /**
   * Advances the world time by real-world delta seconds.
   */
  public advanceTime(dtSeconds: number): TimeOfDayInfo {
    // 24 hours per DAY_CYCLE_CONFIG.dayLengthSeconds
    const hoursPerSecond = 24 / DAY_CYCLE_CONFIG.dayLengthSeconds;
    this.currentHours = (this.currentHours + dtSeconds * hoursPerSecond) % 24;

    const now = Date.now();
    if (now - this.lastSaveTime > 10000) {
      this.lastSaveTime = now;
      this.savePersistedTime();
    }

    const info = this.getTimeInfo();
    this.listeners.forEach((listener) => listener(info));
    return info;
  }

  public setTime(hours: number) {
    this.currentHours = Math.max(0, Math.min(23.99, hours));
    this.savePersistedTime();
    const info = this.getTimeInfo();
    this.listeners.forEach((listener) => listener(info));
  }

  public subscribe(callback: (info: TimeOfDayInfo) => void): () => void {
    this.listeners.add(callback);
    callback(this.getTimeInfo());
    return () => {
      this.listeners.delete(callback);
    };
  }

  public getTimeInfo(): TimeOfDayInfo {
    const h = this.currentHours;
    const hourInt = Math.floor(h);
    const minuteInt = Math.floor((h - hourInt) * 60);

    // 12-hour AM/PM formatting
    const period = hourInt >= 12 ? 'PM' : 'AM';
    const displayHour = hourInt % 12 === 0 ? 12 : hourInt % 12;
    const padMin = minuteInt < 10 ? `0${minuteInt}` : `${minuteInt}`;
    const timeString = `${displayHour}:${padMin} ${period}`;

    let phase: DayNightPhase = 'day';
    let phaseName = 'Daytime';
    let icon = '☀️';

    // Linear interpolation helper
    const lerp = (a: number, b: number, t: number) => a + (b - a) * Math.max(0, Math.min(1, t));

    let sunAltitude = 0.8;
    let sunAzimuth = 0;
    let sunColor = '#fff7ed';
    let sunIntensity = 1.8;
    let ambientSkyColor = '#38bdf8';
    let ambientGroundColor = '#0f172a';
    let ambientIntensity = 0.85;
    let fogColor = '#0b1322';
    let fogDensity = 0.015;
    let nightFactor = 0;
    let starsOpacity = 0;
    let windowGlowIntensity = 0.15;
    let streetlampGlowIntensity = 0.0;

    if (h >= 5.0 && h < 7.5) {
      // DAWN / SUNRISE
      phase = 'dawn';
      phaseName = 'Dawn';
      icon = '🌅';
      const t = (h - 5.0) / 2.5; // 0 to 1
      nightFactor = lerp(0.85, 0.0, t);
      sunIntensity = lerp(0.4, 1.6, t);
      sunColor = '#fb923c'; // Warm peach/amber
      ambientSkyColor = '#f472b6'; // Morning rose-sky
      ambientGroundColor = '#1e1b4b';
      ambientIntensity = lerp(0.45, 0.8, t);
      fogColor = '#1e1b2e';
      starsOpacity = lerp(0.8, 0.0, t);
      streetlampGlowIntensity = lerp(1.0, 0.1, t);
      windowGlowIntensity = lerp(0.85, 0.2, t);
      sunAltitude = lerp(0.08, 0.65, t);
      sunAzimuth = lerp(-Math.PI * 0.45, -Math.PI * 0.1, t);
    } else if (h >= 7.5 && h < 17.0) {
      // DAYTIME
      phase = 'day';
      phaseName = h < 12.0 ? 'Morning' : 'Afternoon';
      icon = '☀️';
      const t = (h - 7.5) / 9.5; // 0 to 1
      nightFactor = 0.0;
      sunIntensity = 1.9;
      sunColor = '#fffbeb';
      ambientSkyColor = '#38bdf8';
      ambientGroundColor = '#0f172a';
      ambientIntensity = 0.9;
      fogColor = '#0a101d';
      starsOpacity = 0.0;
      streetlampGlowIntensity = 0.0;
      windowGlowIntensity = 0.15;
      sunAltitude = Math.sin(t * Math.PI) * 0.9 + 0.3;
      sunAzimuth = lerp(-Math.PI * 0.1, Math.PI * 0.2, t);
    } else if (h >= 17.0 && h < 20.0) {
      // SUNSET / GOLDEN HOUR
      phase = 'sunset';
      phaseName = 'Sunset';
      icon = '🌇';
      const t = (h - 17.0) / 3.0; // 0 to 1
      nightFactor = lerp(0.0, 0.9, t);
      sunIntensity = lerp(1.7, 0.5, t);
      sunColor = '#f97316'; // Vivid orange sunset
      ambientSkyColor = '#c2410c'; // Deep ember dusk sky
      ambientGroundColor = '#1f132b';
      ambientIntensity = lerp(0.85, 0.45, t);
      fogColor = '#1b1226';
      starsOpacity = lerp(0.0, 0.7, t);
      streetlampGlowIntensity = lerp(0.0, 1.1, t);
      windowGlowIntensity = lerp(0.2, 0.95, t);
      sunAltitude = lerp(0.45, 0.05, t);
      sunAzimuth = lerp(Math.PI * 0.2, Math.PI * 0.48, t);
    } else {
      // NIGHTTIME (20.0 to 5.0)
      phase = 'night';
      phaseName = 'Night';
      icon = '🌙';
      const nightProgress = h >= 20.0 ? (h - 20.0) / 9.0 : (h + 4.0) / 9.0;
      nightFactor = 1.0;
      // Moon replaces sun as the primary directional light source
      sunIntensity = 0.42;
      sunColor = '#7dd3fc'; // Cool moonlight
      ambientSkyColor = '#1e293b';
      ambientGroundColor = '#030712';
      ambientIntensity = 0.38;
      fogColor = '#050811';
      fogDensity = 0.018;
      starsOpacity = 0.95;
      streetlampGlowIntensity = 1.25;
      windowGlowIntensity = 1.0;
      // High lunar trajectory
      sunAltitude = Math.sin(nightProgress * Math.PI) * 0.65 + 0.35;
      sunAzimuth = lerp(Math.PI * 0.5, Math.PI * 1.4, nightProgress);
    }

    return {
      hours: h,
      minutes: minuteInt,
      timeString,
      phase,
      phaseName,
      icon,
      sunAltitude,
      sunAzimuth,
      sunColor,
      sunIntensity,
      ambientSkyColor,
      ambientGroundColor,
      ambientIntensity,
      fogColor,
      fogDensity,
      nightFactor,
      starsOpacity,
      windowGlowIntensity,
      streetlampGlowIntensity,
    };
  }
}

export const dayNightManager = new DayNightManager();
