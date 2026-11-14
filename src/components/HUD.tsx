import React from 'react';
import { Volume2, VolumeX, Pause, Play, Globe, Zap, Shield, Sparkles, Award } from 'lucide-react';
import { Language, translations } from '../game/localization';
import { SquadId, GameWorld } from '../game/types';

interface HUDProps {
  lang: Language;
  onToggleLang: () => void;
  isMuted: boolean;
  onToggleMute: () => void;
  isPaused: boolean;
  onTogglePause: () => void;
  activeSquadId: SquadId;
  onSelectSquad: (squadId: SquadId) => void;
  currentWorld: GameWorld;
  currentStage: number;
  onNextStage: () => void;
  onPrevStage: () => void;
  coins: number;
  gems: number;
  ores: {
    coal: number;
    copper: number;
    iron: number;
    gold: number;
    amethyst: number;
    voidStone: number;
  };
  megaBombCooldownPct: number;
  megaBombReady: boolean;
  onTriggerMegaBomb: () => void;
  activeTab: 'mine' | 'squad' | 'forge' | 'skillTree' | 'market' | 'worldMap';
  onSelectTab: (tab: 'mine' | 'squad' | 'forge' | 'skillTree' | 'market' | 'worldMap') => void;
  skillPointsAvailable: number;
}

export const HUD: React.FC<HUDProps> = ({
  lang,
  onToggleLang,
  isMuted,
  onToggleMute,
  isPaused,
  onTogglePause,
  activeSquadId,
  onSelectSquad,
  currentWorld,
  currentStage,
  onNextStage,
  onPrevStage,
  coins,
  gems,
  ores,
  megaBombCooldownPct,
  megaBombReady,
  onTriggerMegaBomb,
  activeTab,
  onSelectTab,
  skillPointsAvailable,
}) => {
  const t = translations[lang];
  const isBossStage = currentStage % 20 === 0;

  return (
    <header className="w-full flex flex-col z-20 shrink-0 bg-[#0d1117] border-b border-slate-800 text-slate-200">
      {/* Zone 1: Main Header Ribbon */}
      <div className="flex items-center justify-between px-4 py-2 gap-4 border-b border-slate-800/80">
        {/* Brand & Stage Info */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => onSelectTab('mine')}
            className="flex items-center gap-2 group text-left cursor-pointer focus:outline-none"
          >
            <div className="w-8 h-8 rounded bg-gradient-to-br from-amber-500 to-red-600 flex items-center justify-center font-black text-black text-sm shadow-md shadow-red-500/20 group-hover:scale-105 transition-transform">
              💣
            </div>
            <div>
              <div className="text-sm font-black tracking-wider text-amber-400 font-display uppercase">
                {t.gameTitle}
              </div>
              <div className="text-[10px] text-slate-400 font-mono tracking-tight">
                v1.2 · {currentWorld.namePt}
              </div>
            </div>
          </button>

          {/* Stage Selector Pill */}
          <div className="flex items-center bg-slate-900 border border-slate-700/80 rounded px-2 py-1 gap-2 ml-2">
            <button
              onClick={onPrevStage}
              disabled={currentStage <= 1}
              className="text-slate-400 hover:text-white disabled:opacity-30 text-xs font-bold px-1"
            >
              ◀
            </button>
            <div className="text-xs font-mono tabular-nums text-center">
              <span className="text-slate-400 text-[10px] uppercase tracking-wider">{t.stage}:</span>{' '}
              <span className={`font-bold ${isBossStage ? 'text-rose-400' : 'text-amber-400'}`}>
                {currentStage}/600
              </span>
              {isBossStage && (
                <span className="ml-1 text-[10px] font-bold text-rose-500 animate-pulse">
                  [CHEFE]
                </span>
              )}
            </div>
            <button
              onClick={onNextStage}
              disabled={currentStage >= 600}
              className="text-slate-400 hover:text-white disabled:opacity-30 text-xs font-bold px-1"
            >
              ▶
            </button>
          </div>
        </div>

        {/* Zone 2: Mineral & Currency Counters */}
        <div className="hidden lg:flex items-center gap-4 text-xs font-mono tabular-nums">
          <div className="flex items-center gap-1.5 bg-slate-900/80 px-2 py-1 rounded border border-slate-800">
            <span className="w-2.5 h-2.5 rounded-full bg-stone-500 inline-block" title="Carvão" />
            <span className="text-slate-300">{ores.coal.toLocaleString()}</span>
          </div>
          <div className="flex items-center gap-1.5 bg-slate-900/80 px-2 py-1 rounded border border-slate-800">
            <span className="w-2.5 h-2.5 rounded-full bg-orange-400 inline-block" title="Cobre" />
            <span className="text-slate-300">{ores.copper.toLocaleString()}</span>
          </div>
          <div className="flex items-center gap-1.5 bg-slate-900/80 px-2 py-1 rounded border border-slate-800">
            <span className="w-2.5 h-2.5 rounded-full bg-slate-300 inline-block" title="Ferro" />
            <span className="text-slate-300">{ores.iron.toLocaleString()}</span>
          </div>
          <div className="flex items-center gap-1.5 bg-slate-900/80 px-2 py-1 rounded border border-slate-800">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 inline-block" title="Ouro" />
            <span className="text-amber-300 font-semibold">{ores.gold.toLocaleString()}</span>
          </div>
          <div className="flex items-center gap-1.5 bg-slate-900/80 px-2 py-1 rounded border border-slate-800">
            <span className="w-2.5 h-2.5 rounded-full bg-purple-400 inline-block" title="Ametista" />
            <span className="text-purple-300 font-semibold">{ores.amethyst.toLocaleString()}</span>
          </div>

          <div className="h-4 w-px bg-slate-700" />

          {/* Steam Coins */}
          <div className="flex items-center gap-1.5 bg-amber-950/40 border border-amber-500/30 px-2.5 py-1 rounded text-amber-300 font-bold">
            <span>🪙</span>
            <span>{coins.toLocaleString()}</span>
          </div>

          {/* Cosmic Gems */}
          <div className="flex items-center gap-1.5 bg-cyan-950/40 border border-cyan-500/30 px-2.5 py-1 rounded text-cyan-300 font-bold">
            <span>💎</span>
            <span>{gems.toLocaleString()}</span>
          </div>
        </div>

        {/* Zone 3: Controls & Utility Actions */}
        <div className="flex items-center gap-2">
          {/* Mega-Bomb Detonator Button */}
          <button
            onClick={onTriggerMegaBomb}
            disabled={!megaBombReady}
            title="Espaço para Mega-Bomba Sísmica"
            className={`relative flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-bold font-display uppercase tracking-wide transition-all border ${
              megaBombReady
                ? 'bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white border-rose-400 shadow-lg shadow-rose-600/30 animate-pulse cursor-pointer'
                : 'bg-slate-800/80 text-slate-500 border-slate-700 cursor-not-allowed'
            }`}
          >
            <Zap className={`w-3.5 h-3.5 ${megaBombReady ? 'text-amber-300' : 'text-slate-500'}`} />
            <span>{megaBombReady ? t.manualMegaBomb : `${t.cooldown} (${Math.round(megaBombCooldownPct)}%)`}</span>
          </button>

          {/* Language Toggle */}
          <button
            onClick={onToggleLang}
            className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-mono font-medium rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
            title="Alternar Idioma / Switch Language"
          >
            <Globe className="w-3.5 h-3.5 text-slate-400" />
            <span>{lang.toUpperCase()}</span>
          </button>

          {/* Audio Mute Toggle */}
          <button
            onClick={onToggleMute}
            className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
            title={isMuted ? t.unmute : t.mute}
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
          </button>

          {/* Pause Toggle */}
          <button
            onClick={onTogglePause}
            className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
            title={isPaused ? t.resume : t.pause}
          >
            {isPaused ? <Play className="w-4 h-4 text-amber-400" /> : <Pause className="w-4 h-4 text-slate-400" />}
          </button>
        </div>
      </div>

      {/* Navigation Tabs Strip & Squad Rotation */}
      <div className="flex items-center justify-between px-4 py-1.5 bg-[#12161f] text-xs">
        {/* Module Tabs */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => onSelectTab('mine')}
            className={`px-3 py-1 rounded font-medium transition-colors ${
              activeTab === 'mine'
                ? 'bg-amber-500 text-black font-bold shadow-xs'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            ⛏️ {t.tabMine}
          </button>
          <button
            onClick={() => onSelectTab('squad')}
            className={`px-3 py-1 rounded font-medium transition-colors ${
              activeTab === 'squad'
                ? 'bg-amber-500 text-black font-bold shadow-xs'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            🦸 {t.tabSquad}
          </button>
          <button
            onClick={() => onSelectTab('forge')}
            className={`px-3 py-1 rounded font-medium transition-colors ${
              activeTab === 'forge'
                ? 'bg-amber-500 text-black font-bold shadow-xs'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            ⚔️ {t.tabForge}
          </button>
          <button
            onClick={() => onSelectTab('skillTree')}
            className={`relative px-3 py-1 rounded font-medium transition-colors ${
              activeTab === 'skillTree'
                ? 'bg-amber-500 text-black font-bold shadow-xs'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            🌳 {t.tabSkillTree}
            {skillPointsAvailable > 0 && (
              <span className="ml-1 px-1.5 py-0.2 bg-rose-600 text-white rounded-full text-[10px] font-bold">
                {skillPointsAvailable}
              </span>
            )}
          </button>
          <button
            onClick={() => onSelectTab('market')}
            className={`px-3 py-1 rounded font-medium transition-colors ${
              activeTab === 'market'
                ? 'bg-amber-500 text-black font-bold shadow-xs'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            💰 {t.tabMarket}
          </button>
          <button
            onClick={() => onSelectTab('worldMap')}
            className={`px-3 py-1 rounded font-medium transition-colors ${
              activeTab === 'worldMap'
                ? 'bg-amber-500 text-black font-bold shadow-xs'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            🗺️ {t.tabWorldMap}
          </button>
        </div>

        {/* Squad Rotation Controls */}
        <div className="flex items-center gap-1.5 font-mono text-[11px]">
          <span className="text-slate-500 uppercase tracking-wider text-[10px] hidden sm:inline">Equipe Ativa:</span>
          {(['alpha', 'beta', 'gamma'] as SquadId[]).map((sId, index) => {
            const label = sId === 'alpha' ? 'Alfa [1]' : sId === 'beta' ? 'Beta [2]' : 'Gama [3]';
            const isActive = activeSquadId === sId;
            return (
              <button
                key={sId}
                onClick={() => onSelectSquad(sId)}
                className={`px-2.5 py-0.5 rounded transition-all font-semibold ${
                  isActive
                    ? 'bg-cyan-500 text-slate-950 ring-1 ring-cyan-300'
                    : 'bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-700/60'
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
};
