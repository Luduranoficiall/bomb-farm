import React from 'react';
import { GameWorld } from '../game/types';
import { Language, translations } from '../game/localization';
import { soundEngine } from '../game/audio';
import { Globe, Lock, ShieldAlert, Award } from 'lucide-react';

interface WorldMapModalProps {
  lang: Language;
  worlds: GameWorld[];
  currentWorld: GameWorld;
  currentStage: number;
  highestStageUnlocked: number;
  onSelectStage: (stage: number) => void;
}

export const WorldMapModal: React.FC<WorldMapModalProps> = ({
  lang,
  worlds,
  currentWorld,
  currentStage,
  highestStageUnlocked,
  onSelectStage,
}) => {
  const t = translations[lang];

  return (
    <div className="w-full h-full p-4 lg:p-6 overflow-y-auto bg-[#0c0f17] text-slate-100 flex flex-col gap-6">
      {/* Header */}
      <div className="border-b border-slate-800 pb-4">
        <h2 className="text-xl font-black font-display tracking-wide text-amber-400 uppercase">
          🗺️ {t.tabWorldMap} & Profundezas (600 Fases)
        </h2>
        <p className="text-xs text-slate-400 font-mono mt-0.5">
          Cinco mundos e 600 fases com chefes monolíticos a cada 20 fases.
        </p>
      </div>

      {/* Worlds List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {worlds.map((world) => {
          const isCurrent = world.id === currentWorld.id;
          const isUnlocked = highestStageUnlocked >= world.minStage;
          const stagesCompleted = Math.max(
            0,
            Math.min(world.maxStage - world.minStage + 1, highestStageUnlocked - world.minStage + 1)
          );
          const totalInWorld = world.maxStage - world.minStage + 1;

          return (
            <div
              key={world.id}
              className={`p-5 rounded-xl border flex flex-col justify-between gap-4 transition-all ${
                isCurrent
                  ? 'bg-slate-900 border-amber-500/80 shadow-lg ring-1 ring-amber-500/50'
                  : isUnlocked
                  ? 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                  : 'bg-slate-950/40 border-slate-900 opacity-60'
              }`}
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono uppercase tracking-wider text-slate-400">
                    Mundo {world.id}
                  </span>
                  {isCurrent && (
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500 text-slate-950">
                      Mundo Atual
                    </span>
                  )}
                  {!isUnlocked && (
                    <span className="text-slate-500 flex items-center gap-1 text-xs font-mono">
                      <Lock className="w-3.5 h-3.5" /> Bloqueado
                    </span>
                  )}
                </div>

                <h3 className="text-base font-bold text-white mt-1">
                  {lang === 'pt' ? world.namePt : world.nameEn}
                </h3>

                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  {lang === 'pt' ? world.descriptionPt : world.descriptionEn}
                </p>

                <div className="mt-3 flex items-center gap-2 text-xs font-mono text-slate-400">
                  <span>Fases:</span>
                  <span className="text-amber-400 font-bold">
                    {world.minStage} - {world.maxStage}
                  </span>
                </div>

                <div className="mt-2 w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-800">
                  <div
                    style={{ width: `${(stagesCompleted / totalInWorld) * 100}%` }}
                    className="h-full bg-gradient-to-r from-amber-500 to-amber-600 rounded-full"
                  />
                </div>
                <div className="text-[10px] font-mono text-slate-400 text-right mt-1">
                  {stagesCompleted}/{totalInWorld} Concluídas
                </div>
              </div>

              {/* Jump to Starting Stage or Boss */}
              {isUnlocked && (
                <div className="flex items-center gap-2 pt-2 border-t border-slate-800">
                  <button
                    onClick={() => {
                      soundEngine.playFanfare();
                      onSelectStage(world.minStage);
                    }}
                    className="flex-1 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-xs font-mono font-semibold text-slate-200 transition-colors"
                  >
                    Fase {world.minStage}
                  </button>

                  <button
                    onClick={() => {
                      soundEngine.playFanfare();
                      const targetStage = Math.min(highestStageUnlocked, world.maxStage);
                      onSelectStage(targetStage);
                    }}
                    className="flex-1 py-1.5 rounded bg-amber-500 hover:bg-amber-400 text-xs font-mono font-bold text-slate-950 transition-colors"
                  >
                    Progresso Máx.
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
