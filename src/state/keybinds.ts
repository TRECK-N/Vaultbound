/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type KeyAction =
  | 'moveForward'
  | 'moveBackward'
  | 'moveLeft'
  | 'moveRight'
  | 'sprint'
  | 'jump'
  | 'interact'
  | 'inventory'
  | 'map'
  | 'pause';

export interface KeybindConfig {
  action: KeyAction;
  label: string;
  defaultKey: string;
  assignedKey: string;
  category: 'movement' | 'interaction' | 'interface';
}

export const DEFAULT_KEYBINDS: Record<KeyAction, string> = {
  moveForward: 'w',
  moveBackward: 's',
  moveLeft: 'a',
  moveRight: 'd',
  sprint: 'shift',
  jump: 'space',
  interact: 'e',
  inventory: 'i',
  map: 'm',
  pause: 'escape',
};

export const KEYBIND_METADATA: { action: KeyAction; label: string; category: 'movement' | 'interaction' | 'interface' }[] = [
  { action: 'moveForward', label: 'Move Forward', category: 'movement' },
  { action: 'moveBackward', label: 'Move Backward', category: 'movement' },
  { action: 'moveLeft', label: 'Move Left', category: 'movement' },
  { action: 'moveRight', label: 'Move Right', category: 'movement' },
  { action: 'sprint', label: 'Sprint', category: 'movement' },
  { action: 'jump', label: 'Jump', category: 'movement' },
  { action: 'interact', label: 'Interact / Enter', category: 'interaction' },
  { action: 'inventory', label: 'Open Inventory', category: 'interface' },
  { action: 'map', label: 'Open Map / District Overview', category: 'interface' },
  { action: 'pause', label: 'Pause / Close Menu', category: 'interface' },
];

const STORAGE_KEY = 'vb_keybinds_v2';

export function loadKeybinds(): Record<KeyAction, string> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return { ...DEFAULT_KEYBINDS, ...parsed };
    }
  } catch (e) {
    console.warn('Failed to load keybinds', e);
  }
  return { ...DEFAULT_KEYBINDS };
}

export function saveKeybinds(binds: Record<KeyAction, string>) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(binds));
  } catch (e) {
    console.error('Failed to save keybinds', e);
  }
}

export function normalizeKey(e: KeyboardEvent): string {
  if (e.code === 'Space') return 'space';
  if (e.key === 'Escape') return 'escape';
  if (e.key === 'Shift') return 'shift';
  if (e.key === 'Control') return 'control';
  if (e.key === 'Alt') return 'alt';
  if (e.key === 'Tab') return 'tab';
  if (e.key === 'Enter') return 'enter';
  if (e.key === 'ArrowUp') return 'arrowup';
  if (e.key === 'ArrowDown') return 'arrowdown';
  if (e.key === 'ArrowLeft') return 'arrowleft';
  if (e.key === 'ArrowRight') return 'arrowright';
  return e.key.toLowerCase();
}

export function formatKeyDisplay(keyStr: string): string {
  const k = keyStr.toLowerCase();
  if (k === 'space') return 'Space';
  if (k === 'escape') return 'Esc';
  if (k === 'shift') return 'Shift';
  if (k === 'arrowup') return '↑';
  if (k === 'arrowdown') return '↓';
  if (k === 'arrowleft') return '←';
  if (k === 'arrowright') return '→';
  return k.toUpperCase();
}
