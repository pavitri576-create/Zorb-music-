import { ThemeOption } from '../types/zorb';

export const THEME_OPTIONS: ThemeOption[] = [
  // Available initially from Day 0
  {
    id: 'isagi-blue',
    name: 'Isagi Blue',
    hex: '#00A3FF',
    rgb: '0, 163, 255',
    unlockDay: 0,
  },
  {
    id: 'neon-green',
    name: 'Neon Green',
    hex: '#00E676',
    rgb: '0, 230, 118',
    unlockDay: 0,
  },
  {
    id: 'royal-purple',
    name: 'Purple',
    hex: '#A855F7',
    rgb: '168, 85, 247',
    unlockDay: 0,
  },
  {
    id: 'crimson-red',
    name: 'Red',
    hex: '#FF2E54',
    rgb: '255, 46, 84',
    unlockDay: 0,
  },
  {
    id: 'solar-orange',
    name: 'Orange',
    hex: '#FF7A00',
    rgb: '255, 122, 0',
    unlockDay: 0,
  },

  // Red Overdrive default active theme
  {
    id: 'red-ego',
    name: 'Red Overdrive',
    hex: '#FF1744',
    rgb: '255, 23, 68',
    unlockDay: 0,
    badgeLabel: 'Default Theme',
  },
  {
    id: 'purple-vision',
    name: 'Purple Vision',
    hex: '#9333EA',
    rgb: '147, 51, 234',
    unlockDay: 6,
    badgeLabel: 'Day 6 Theme',
  },
  {
    id: 'neon-flow',
    name: 'Neon Flow',
    hex: '#10FF88',
    rgb: '16, 255, 136',
    unlockDay: 9,
    badgeLabel: 'Day 9 Theme',
  },
  {
    id: 'blaze-orange',
    name: 'Blaze Core',
    hex: '#FF5E1A',
    rgb: '255, 94, 26',
    unlockDay: 12,
    badgeLabel: 'Day 12 Theme',
  },
  {
    id: 'arctic-cyan',
    name: 'Arctic Cyan',
    hex: '#00F0FF',
    rgb: '0, 240, 255',
    unlockDay: 18,
    badgeLabel: 'Day 18 Theme',
  },
  {
    id: 'hyper-magenta',
    name: 'Hyper Magenta',
    hex: '#FF2ED1',
    rgb: '255, 46, 209',
    unlockDay: 21,
    badgeLabel: 'Day 21 Theme',
  },
  {
    id: 'cobalt-stealth',
    name: 'Cobalt Stealth',
    hex: '#3B82F6',
    rgb: '59, 130, 246',
    unlockDay: 24,
    badgeLabel: 'Day 24 Theme',
  },
  {
    id: 'titanium-ice',
    name: 'Titanium Ice',
    hex: '#7DD3FC',
    rgb: '125, 211, 252',
    unlockDay: 27,
    badgeLabel: 'Day 27 Theme',
  },
  {
    id: 'golden-emperor',
    name: 'Golden Emperor',
    hex: '#FFB800',
    rgb: '255, 184, 0',
    unlockDay: 50,
    badgeLabel: 'Day 50 Golden Theme',
  },
  {
    id: 'zorb-aura',
    name: 'ZORB Legend Aura',
    hex: '#38BDF8',
    rgb: '56, 189, 248',
    unlockDay: 200,
    badgeLabel: 'Day 200 Exclusive',
  },
];

export function getThemeById(id: string): ThemeOption {
  return THEME_OPTIONS.find((t) => t.id === id) || THEME_OPTIONS[0];
}
