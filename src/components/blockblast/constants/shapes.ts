import { BlockShape, ColorScheme } from '../types';

export const GRID_SIZE = 8;

export const COLOR_CLASSES: Record<ColorScheme, {
  bg: string;
  border: string;
  glow: string;
  gradient: string;
  previewBg: string;
}> = {
  blue: {
    bg: 'bg-blue-500',
    border: 'border-blue-300',
    glow: 'shadow-blue-500/50',
    gradient: 'from-blue-400 to-blue-600',
    previewBg: '#3b82f6',
  },
  purple: {
    bg: 'bg-purple-500',
    border: 'border-purple-300',
    glow: 'shadow-purple-500/50',
    gradient: 'from-purple-400 to-purple-600',
    previewBg: '#a855f7',
  },
  green: {
    bg: 'bg-emerald-500',
    border: 'border-emerald-300',
    glow: 'shadow-emerald-500/50',
    gradient: 'from-emerald-400 to-emerald-600',
    previewBg: '#10b981',
  },
  orange: {
    bg: 'bg-orange-500',
    border: 'border-orange-300',
    glow: 'shadow-orange-500/50',
    gradient: 'from-orange-400 to-orange-600',
    previewBg: '#f97316',
  },
  red: {
    bg: 'bg-rose-500',
    border: 'border-rose-300',
    glow: 'shadow-rose-500/50',
    gradient: 'from-rose-400 to-rose-600',
    previewBg: '#f43f5e',
  },
  cyan: {
    bg: 'bg-cyan-500',
    border: 'border-cyan-300',
    glow: 'shadow-cyan-500/50',
    gradient: 'from-cyan-400 to-cyan-600',
    previewBg: '#06b6d4',
  },
  yellow: {
    bg: 'bg-amber-400',
    border: 'border-amber-200',
    glow: 'shadow-amber-400/50',
    gradient: 'from-amber-300 to-amber-500',
    previewBg: '#f59e0b',
  },
  pink: {
    bg: 'bg-pink-500',
    border: 'border-pink-300',
    glow: 'shadow-pink-500/50',
    gradient: 'from-pink-400 to-pink-600',
    previewBg: '#ec4899',
  },
};

const SHAPE_TEMPLATES: { matrix: number[][]; defaultColor: ColorScheme }[] = [
  // Single block
  { matrix: [[1]], defaultColor: 'yellow' },

  // Lines 2
  { matrix: [[1, 1]], defaultColor: 'cyan' },
  { matrix: [[1], [1]], defaultColor: 'cyan' },

  // Lines 3
  { matrix: [[1, 1, 1]], defaultColor: 'green' },
  { matrix: [[1], [1], [1]], defaultColor: 'green' },

  // Lines 4
  { matrix: [[1, 1, 1, 1]], defaultColor: 'blue' },
  { matrix: [[1], [1], [1], [1]], defaultColor: 'blue' },

  // Lines 5
  { matrix: [[1, 1, 1, 1, 1]], defaultColor: 'purple' },
  { matrix: [[1], [1], [1], [1], [1]], defaultColor: 'purple' },

  // Squares
  {
    matrix: [
      [1, 1],
      [1, 1],
    ],
    defaultColor: 'orange',
  },
  {
    matrix: [
      [1, 1, 1],
      [1, 1, 1],
      [1, 1, 1],
    ],
    defaultColor: 'red',
  },

  // Small L-shapes (2x2 minus 1)
  {
    matrix: [
      [1, 0],
      [1, 1],
    ],
    defaultColor: 'pink',
  },
  {
    matrix: [
      [0, 1],
      [1, 1],
    ],
    defaultColor: 'pink',
  },
  {
    matrix: [
      [1, 1],
      [1, 0],
    ],
    defaultColor: 'pink',
  },
  {
    matrix: [
      [1, 1],
      [0, 1],
    ],
    defaultColor: 'pink',
  },

  // Medium L-shapes (3x2 L)
  {
    matrix: [
      [1, 0],
      [1, 0],
      [1, 1],
    ],
    defaultColor: 'purple',
  },
  {
    matrix: [
      [0, 1],
      [0, 1],
      [1, 1],
    ],
    defaultColor: 'purple',
  },
  {
    matrix: [
      [1, 1, 1],
      [1, 0, 0],
    ],
    defaultColor: 'purple',
  },
  {
    matrix: [
      [1, 1, 1],
      [0, 0, 1],
    ],
    defaultColor: 'purple',
  },

  // 3x3 Large L-shapes
  {
    matrix: [
      [1, 0, 0],
      [1, 0, 0],
      [1, 1, 1],
    ],
    defaultColor: 'blue',
  },
  {
    matrix: [
      [0, 0, 1],
      [0, 0, 1],
      [1, 1, 1],
    ],
    defaultColor: 'blue',
  },

  // T-shapes
  {
    matrix: [
      [1, 1, 1],
      [0, 1, 0],
    ],
    defaultColor: 'cyan',
  },
  {
    matrix: [
      [0, 1, 0],
      [1, 1, 1],
    ],
    defaultColor: 'cyan',
  },
  {
    matrix: [
      [1, 0],
      [1, 1],
      [1, 0],
    ],
    defaultColor: 'cyan',
  },
  {
    matrix: [
      [0, 1],
      [1, 1],
      [0, 1],
    ],
    defaultColor: 'cyan',
  },

  // Z and S shapes
  {
    matrix: [
      [1, 1, 0],
      [0, 1, 1],
    ],
    defaultColor: 'green',
  },
  {
    matrix: [
      [0, 1, 1],
      [1, 1, 0],
    ],
    defaultColor: 'green',
  },
  {
    matrix: [
      [1, 0],
      [1, 1],
      [0, 1],
    ],
    defaultColor: 'green',
  },
  {
    matrix: [
      [0, 1],
      [1, 1],
      [1, 0],
    ],
    defaultColor: 'green',
  },

  // Plus / Cross shape
  {
    matrix: [
      [0, 1, 0],
      [1, 1, 1],
      [0, 1, 0],
    ],
    defaultColor: 'yellow',
  },
];

const COLORS: ColorScheme[] = ['blue', 'purple', 'green', 'orange', 'red', 'cyan', 'yellow', 'pink'];

export function getRandomShape(idPrefix: string = ''): BlockShape {
  const randomIndex = Math.floor(Math.random() * SHAPE_TEMPLATES.length);
  const template = SHAPE_TEMPLATES[randomIndex];
  
  // Random color assignment for extra variety, or use template color with 50% chance
  const color = Math.random() < 0.4 
    ? template.defaultColor 
    : COLORS[Math.floor(Math.random() * COLORS.length)];

  const matrix = template.matrix;
  const height = matrix.length;
  const width = matrix[0].length;

  return {
    id: `${idPrefix}-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
    matrix,
    color,
    width,
    height,
  };
}

export function generateHand(): (BlockShape | null)[] {
  return [
    getRandomShape('p1'),
    getRandomShape('p2'),
    getRandomShape('p3'),
  ];
}
