import React, { useEffect } from 'react';
import { soundEngine } from '../game/audio';
import { Language, translations } from '../game/localization';
import { Play, Globe, Volume2, VolumeX } from 'lucide-react';

interface TitleScreenProps {
  lang: Language;
  onToggleLang: () => void;
  isMuted: boolean;
  onToggleMute: () => void;
  onStartGame: () => void;
}

export const TitleScreen: React.FC<TitleScreenProps> = ({
  lang,
  onToggleLang,
  isMuted,
  onToggleMute,
  onStartGame,
}) => {
  const t = translations[lang];

  // Enter or Space key to start game
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Enter' || e.code === 'Space') {
        e.preventDefault();
        soundEngine.playFanfare();
        onStartGame();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onStartGame]);

  return (
    <div className="relative w-screen h-screen flex flex-col items-center justify-between p-8 bg-[#0a0d14] overflow-hidden select-none">
      {/* Dynamic Subterranean Pixel Cave Backdrop */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#07090e] via-[#0d121c] to-[#120a1c] pointer-events-none" />

      {/* Floating Sparkle Embers */}
      <div className="absolute inset-0 pointer-events-none opacity-40">
        <div className="absolute top-1/4 left-1/6 w-2 h-2 rounded-full bg-amber-400 blur-xs animate-ping" />
        <div className="absolute top-2/3 right-1/5 w-2 h-2 rounded-full bg-rose-500 blur-xs animate-pulse" />
        <div className="absolute top-1/2 left-2/3 w-3 h-3 rounded-full bg-purple-400 blur-xs animate-bounce" />
      </div>

      {/* Top Utility Bar (Minimalist) */}
      <div className="relative z-10 w-full flex items-center justify-between max-w-5xl">
        <div className="flex items-center gap-2 text-xs font-mono text-slate-400 tracking-wider">
          <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
          <span>STREAM ON STUDIOS · 2026</span>
        </div>

        <div className="flex items-center gap-2">
          {/* Language Switch */}
          <button
            onClick={onToggleLang}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-xs font-mono text-slate-300 border border-slate-700 transition-colors cursor-pointer"
          >
            <Globe className="w-3.5 h-3.5 text-slate-400" />
            <span>{lang.toUpperCase()}</span>
          </button>

          {/* Sound Toggle */}
          <button
            onClick={onToggleMute}
            className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 transition-colors cursor-pointer"
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
          </button>
        </div>
      </div>

      {/* Hero Centerpiece: Bespoke SVG Title Lockup */}
      <div className="relative z-10 flex flex-col items-center text-center max-w-3xl my-auto">
        {/* Animated Bomb Mascot SVG */}
        <div className="mb-4 relative group">
          <svg className="w-24 h-24 drop-shadow-2xl animate-bounce" viewBox="0 0 100 100" fill="none">
            {/* Spark fuse */}
            <path d="M50 30 C50 15 65 18 70 8" stroke="#f59e0b" strokeWidth="4" strokeLinecap="round" />
            <circle cx="70" cy="8" r="6" fill="#ef4444" className="animate-ping" />
            {/* Cap */}
            <rect x="42" y="26" width="16" height="8" rx="2" fill="#78716c" />
            {/* Bomb Sphere */}
            <circle cx="50" cy="58" r="32" fill="#1e293b" stroke="#f59e0b" strokeWidth="3" />
            {/* Specular Highlight */}
            <ellipse cx="40" cy="48" rx="8" ry="5" fill="#475569" transform="rotate(-30 40 48)" />
            {/* Glowing Face */}
            <circle cx="42" cy="58" r="3" fill="#facc15" />
            <circle cx="58" cy="58" r="3" fill="#facc15" />
            <path d="M44 68 Q50 74 56 68" stroke="#facc15" strokeWidth="2.5" strokeLinecap="round" />
          </svg>
        </div>

        {/* Bespoke Title Lockup */}
        <h1 className="text-5xl sm:text-7xl font-black font-display tracking-tight text-transparent bg-clip-text bg-gradient-to-b from-amber-300 via-amber-500 to-red-600 drop-shadow-lg">
          BOMB FARM
        </h1>

        <p className="text-sm sm:text-base text-slate-300 font-sans max-w-xl mt-3 font-medium tracking-wide">
          {lang === 'pt'
            ? 'Um RPG idle onde seu esquadrão de bombardeiros farma por você. Exploda rochas, forje equipamentos lendários até +15 e domine 600 fases!'
            : 'An idle mining RPG where your demolition squad blasts minerals for you. Hunt rare drops, forge +15 relics, and master 600 stages!'}
        </p>

        {/* Primary Start CTA Button */}
        <button
          onClick={() => {
            soundEngine.playFanfare();
            onStartGame();
          }}
          className="mt-8 px-10 py-4 rounded-xl text-base sm:text-lg font-black font-display uppercase tracking-widest text-slate-950 bg-gradient-to-r from-amber-400 via-amber-500 to-red-500 hover:from-amber-300 hover:to-red-400 shadow-2xl shadow-amber-500/30 hover:scale-105 active:scale-95 transition-all duration-200 cursor-pointer flex items-center gap-3"
        >
          <Play className="w-5 h-5 fill-current" />
          <span>{t.play}</span>
        </button>

        <div className="mt-4 text-xs font-mono text-slate-400">
          Pressione <kbd className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-amber-400">Enter</kbd> ou <kbd className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-amber-400">Espaço</kbd> para começar
        </div>
      </div>

      {/* Bottom Flat Control Hint Line */}
      <div className="relative z-10 w-full text-center text-xs font-mono text-slate-400 tracking-tight pb-2">
        {t.controlsHint}
      </div>
    </div>
  );
};
