import React, { useState } from 'react';
import { GameModal } from './GameModal';

export interface ArcadeGame {
  id: string;
  title: string;
  emoji: string;
  description: string;
  /** Path under /public, e.g. "/games/2048/index.html" */
  src: string;
  /** Optional: aspect ratio hint so the modal sizes nicely before load */
  aspect?: 'square' | 'portrait' | 'wide';
}

export const ARCADE_GAMES: ArcadeGame[] = [
  {
    id: '2048',
    title: '2048',
    emoji: '🔢',
    description: 'Puzzle geser angka, santai buat ngisi waktu luang.',
    src: '/games/2048/index.html',
    aspect: 'square',
  },
  {
    id: 'match3',
    title: 'Emoji Crush',
    emoji: '🌈',
    description: 'Cocokin 3 permata warna-warni, mirip candy crush.',
    src: '/games/match3/index.html',
    aspect: 'square',
  },
  {
    id: 'spacehunter',
    title: 'Space Hunter',
    emoji: '🚀',
    description: 'Tembak asteroid, kumpulin senjata, neon arcade vibes.',
    src: '/games/spacehunter/index.html',
    aspect: 'wide',
  },
  {
    id: 'doodlejump',
    title: 'Doodle Jump',
    emoji: '🐸',
    description: 'Lompat platform setinggi-tingginya, jangan sampai jatuh.',
    src: '/games/doodlejump/index.html',
    aspect: 'portrait',
  },
  {
    id: 'dino',
    title: 'Dino Runner',
    emoji: '🦖',
    description: 'Klasik ala Chrome offline, lompatin kaktus makin lama makin cepat.',
    src: '/games/dino/index.html',
    aspect: 'wide',
  },
  {
    id: 'brickbreaker',
    title: 'Brick Breaker',
    emoji: '🧱',
    description: 'Pantulin bola, pecahin semua bata, kejar combo tertinggi.',
    src: '/games/brickbreaker/index.html',
    aspect: 'square',
  },
  {
    id: 'uno',
    title: 'UNO',
    emoji: '🃏',
    description: 'Lawan bot, 2-6 pemain, lengkap sama kartu wild & skip.',
    src: '/games/uno/index.html',
    aspect: 'wide',
  },
  {
    id: 'pacman',
    title: 'PacMan',
    emoji: '👻',
    description: 'Makan semua titik, hindari hantu. Geser layar buat gerak.',
    src: '/games/pacman/index.html',
    aspect: 'square',
  },
  {
    id: 'snake',
    title: 'Ular-ularan',
    emoji: '🐍',
    description: 'Klasik, makan terus makin panjang, jangan nabrak diri sendiri.',
    src: '/games/snake/index.html',
    aspect: 'square',
  },
  {
    id: 'ulartangga',
    title: 'Ular Tangga',
    emoji: '🎲',
    description: 'Main sendiri lawan bot atau rame-rame, lempar dadu sampai finish.',
    src: '/games/ular-tangga/index.html',
    aspect: 'portrait',
  },
  {
    id: 'burgerbuilder',
    title: 'Burger Kitchen',
    emoji: '🍔',
    description: 'Susun burger sesuai pesanan, 9 level makin lama makin ribet.',
    src: '/games/burger-builder/index.html',
    aspect: 'portrait',
  },
];

export const ArcadeView: React.FC = () => {
  const [activeGame, setActiveGame] = useState<ArcadeGame | null>(null);

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-zinc-900/60 rounded-3xl p-6 border border-slate-200 dark:border-zinc-800">
        <h1 className="text-2xl font-bold text-slate-800 dark:text-zinc-100">
          🎮 mbud Arcade
        </h1>
        <p className="text-sm text-slate-500 dark:text-zinc-400 mt-1">
          Kill time bentar? Pilih salah satu game di bawah ini.
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {ARCADE_GAMES.map((game) => (
          <button
            key={game.id}
            onClick={() => setActiveGame(game)}
            className="group text-left bg-white dark:bg-zinc-900/60 rounded-3xl p-5 border border-slate-200 dark:border-zinc-800 hover:border-blue-400 dark:hover:border-blue-500 transition-colors duration-200 flex flex-col gap-2"
          >
            <span className="text-4xl">{game.emoji}</span>
            <span className="font-semibold text-slate-800 dark:text-zinc-100">
              {game.title}
            </span>
            <span className="text-xs text-slate-500 dark:text-zinc-400 leading-relaxed">
              {game.description}
            </span>
          </button>
        ))}
      </div>

      <GameModal game={activeGame} onClose={() => setActiveGame(null)} />
    </div>
  );
};
