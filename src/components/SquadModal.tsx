import React, { useState } from 'react';
import { Hero, SquadId, Equipment } from '../game/types';
import { Language, translations } from '../game/localization';
import { soundEngine } from '../game/audio';
import { Shield, Zap, Sparkles, Crosshair, ArrowUpCircle } from 'lucide-react';

interface SquadModalProps {
  lang: Language;
  heroes: Hero[];
  activeSquadId: SquadId;
  squadAssignments: Record<SquadId, string[]>;
  onAssignHeroToSquad: (squadId: SquadId, heroId: string, slotIndex: number) => void;
  onUpgradeSkill: (heroId: string, skillId: string) => void;
  coins: number;
  inventory: Equipment[];
  onEquipItem: (heroId: string, item: Equipment) => void;
  onUnequipItem: (heroId: string, slot: 'weapon' | 'armor' | 'charm') => void;
}

export const SquadModal: React.FC<SquadModalProps> = ({
  lang,
  heroes,
  activeSquadId,
  squadAssignments,
  onAssignHeroToSquad,
  onUpgradeSkill,
  coins,
  inventory,
  onEquipItem,
  onUnequipItem,
}) => {
  const t = translations[lang];
  const [selectedHeroId, setSelectedHeroId] = useState<string>(heroes[0]?.id || '');
  const [selectedSquadTab, setSelectedSquadTab] = useState<SquadId>(activeSquadId);

  const selectedHero = heroes.find((h) => h.id === selectedHeroId) || heroes[0];

  const getRoleBadge = (role: Hero['role']) => {
    switch (role) {
      case 'striker':
        return <span className="text-red-400 font-bold flex items-center gap-1"><Crosshair className="w-3.5 h-3.5" /> {t.roles.striker}</span>;
      case 'support':
        return <span className="text-emerald-400 font-bold flex items-center gap-1"><Shield className="w-3.5 h-3.5" /> {t.roles.support}</span>;
      case 'harvester':
        return <span className="text-amber-400 font-bold flex items-center gap-1"><Sparkles className="w-3.5 h-3.5" /> {t.roles.harvester}</span>;
      case 'specialist':
        return <span className="text-purple-400 font-bold flex items-center gap-1"><Zap className="w-3.5 h-3.5" /> {t.roles.specialist}</span>;
    }
  };

  return (
    <div className="w-full h-full p-4 lg:p-6 overflow-y-auto bg-[#0d1117] text-slate-100 flex flex-col gap-6">
      {/* Top Section: Squad Selector & Roster Overview */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h2 className="text-xl font-black font-display tracking-wide text-amber-400 uppercase">
            🦸 {t.squads} & {t.roles.specialist}
          </h2>
          <p className="text-xs text-slate-400 font-mono mt-0.5">
            Alterne entre os 3 esquadrões táticos (Alfa, Beta, Gama) para manter a mina operando a 100%.
          </p>
        </div>

        {/* Squad Selection Switcher */}
        <div className="flex items-center gap-2 bg-slate-900 p-1 rounded-lg border border-slate-800">
          {(['alpha', 'beta', 'gamma'] as SquadId[]).map((sId) => {
            const isTabActive = selectedSquadTab === sId;
            const label = sId === 'alpha' ? t.squadAlpha : sId === 'beta' ? t.squadBeta : t.squadGamma;
            return (
              <button
                key={sId}
                onClick={() => setSelectedSquadTab(sId)}
                className={`px-3 py-1.5 rounded text-xs font-bold transition-all ${
                  isTabActive
                    ? 'bg-amber-500 text-slate-950 shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Grid: Heroes List on Left, Hero Details & Skill Upgrades on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1">
        {/* Left Column: Heroes Roster (4 columns) */}
        <div className="lg:col-span-4 flex flex-col gap-2.5">
          <div className="text-xs font-mono text-slate-400 uppercase tracking-wider mb-1">
            Membros da Equipe ({selectedSquadTab.toUpperCase()})
          </div>
          <div className="flex flex-col gap-2 overflow-y-auto max-h-[60vh] pr-1">
            {heroes.map((hero) => {
              const isSelected = hero.id === selectedHeroId;
              const isAssignedToThisSquad = squadAssignments[selectedSquadTab]?.includes(hero.id);

              return (
                <div
                  key={hero.id}
                  onClick={() => setSelectedHeroId(hero.id)}
                  className={`p-3 rounded-lg border cursor-pointer transition-all flex items-center justify-between ${
                    isSelected
                      ? 'bg-slate-800/90 border-amber-500/80 shadow-md ring-1 ring-amber-500/50'
                      : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-lg font-black font-display text-amber-400 shadow-inner">
                      {hero.name.charAt(0)}
                    </div>
                    <div>
                      <div className="text-sm font-bold text-slate-200">{hero.name}</div>
                      <div className="text-xs">{getRoleBadge(hero.role)}</div>
                    </div>
                  </div>

                  <div className="text-right font-mono text-xs">
                    <div className="text-amber-400 font-bold">Nv. {hero.level}</div>
                    <div className="text-[10px] text-slate-400">{hero.baseDamage} DPS</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Hero Detailed Sheet (8 columns) */}
        {selectedHero && (
          <div className="lg:col-span-8 bg-slate-900/70 border border-slate-800 rounded-xl p-5 flex flex-col gap-6">
            {/* Hero Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-amber-600/40 to-slate-800 border border-amber-500/40 flex items-center justify-center text-2xl font-black text-amber-300">
                  {selectedHero.name.charAt(0)}
                </div>
                <div>
                  <h3 className="text-lg font-black text-white">{selectedHero.name}</h3>
                  <div className="flex items-center gap-2 text-xs text-slate-400 font-mono mt-0.5">
                    {getRoleBadge(selectedHero.role)}
                    <span>·</span>
                    <span>{lang === 'pt' ? selectedHero.titlePt : selectedHero.titleEn}</span>
                    <span>·</span>
                    <span className="uppercase text-amber-400">Elem: {selectedHero.element}</span>
                  </div>
                </div>
              </div>

              {/* Level & XP */}
              <div className="text-right font-mono">
                <div className="text-sm font-bold text-amber-400">
                  {t.heroLevel} {selectedHero.level}
                </div>
                <div className="text-xs text-slate-400">
                  XP: {selectedHero.experience}/{selectedHero.maxExperience}
                </div>
              </div>
            </div>

            {/* Core Stats Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 bg-slate-950/60 rounded-lg border border-slate-800/80">
                <div className="text-[10px] uppercase font-mono text-slate-400">{t.heroPower}</div>
                <div className="text-base font-bold font-mono text-rose-400 mt-0.5">
                  {selectedHero.baseDamage} DPS
                </div>
              </div>
              <div className="p-3 bg-slate-950/60 rounded-lg border border-slate-800/80">
                <div className="text-[10px] uppercase font-mono text-slate-400">Raio da Bomba</div>
                <div className="text-base font-bold font-mono text-amber-400 mt-0.5">
                  {selectedHero.bombRadius} tiles
                </div>
              </div>
              <div className="p-3 bg-slate-950/60 rounded-lg border border-slate-800/80">
                <div className="text-[10px] uppercase font-mono text-slate-400">Tempo de Recarga</div>
                <div className="text-base font-bold font-mono text-cyan-400 mt-0.5">
                  {selectedHero.plantCooldown}s
                </div>
              </div>
              <div className="p-3 bg-slate-950/60 rounded-lg border border-slate-800/80">
                <div className="text-[10px] uppercase font-mono text-slate-400">Chance de Crítico</div>
                <div className="text-base font-bold font-mono text-emerald-400 mt-0.5">
                  {Math.round(selectedHero.critChance * 100)}%
                </div>
              </div>
            </div>

            {/* Equipped Items Slots */}
            <div>
              <h4 className="text-xs font-mono uppercase text-slate-400 tracking-wider mb-2">
                Equipamentos Forjados
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {(['weapon', 'armor', 'charm'] as const).map((slot) => {
                  const item = selectedHero.equipped[slot];
                  const slotLabel = slot === 'weapon' ? 'Arma' : slot === 'armor' ? 'Armadura' : 'Amuleto';

                  return (
                    <div
                      key={slot}
                      className="p-3 rounded-lg border border-slate-800 bg-slate-950/70 flex flex-col justify-between min-h-[90px]"
                    >
                      <div className="flex items-center justify-between text-xs text-slate-400">
                        <span className="font-mono text-[10px] uppercase">{slotLabel}</span>
                        {item && <span className="text-amber-400 font-bold">+{item.upgradeLevel}</span>}
                      </div>

                      {item ? (
                        <div className="mt-1">
                          <div className="text-xs font-bold text-slate-200 truncate">
                            {lang === 'pt' ? item.namePt : item.nameEn}
                          </div>
                          <div className="text-[10px] text-amber-400 font-mono">
                            ★{item.stars} · +{item.basePower} Poder
                          </div>
                          <button
                            onClick={() => onUnequipItem(selectedHero.id, slot)}
                            className="mt-2 text-[10px] text-rose-400 hover:text-rose-300 font-mono underline"
                          >
                            Desequipar
                          </button>
                        </div>
                      ) : (
                        <div className="text-xs text-slate-500 italic mt-2">
                          Slot Vazio
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Upgradable Hero Skills (Levels 1 to 10) */}
            <div>
              <h4 className="text-xs font-mono uppercase text-slate-400 tracking-wider mb-2">
                Habilidades Especiais (Nv. 1 ao 10)
              </h4>
              <div className="flex flex-col gap-2.5">
                {selectedHero.skills.map((skill) => {
                  const upgradeCost = skill.level * 150;
                  const canAfford = coins >= upgradeCost;
                  const isMax = skill.level >= skill.maxLevel;

                  return (
                    <div
                      key={skill.id}
                      className="p-3 bg-slate-950/80 border border-slate-800 rounded-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-amber-400">
                            {lang === 'pt' ? skill.namePt : skill.nameEn}
                          </span>
                          <span className="text-xs font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
                            Nv. {skill.level}/{skill.maxLevel}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 mt-0.5">
                          {lang === 'pt' ? skill.descriptionPt : skill.descriptionEn}
                        </p>
                        <div className="text-[11px] font-mono text-emerald-400 mt-1">
                          Bônus: {skill.statBonus}
                        </div>
                      </div>

                      <button
                        onClick={() => {
                          if (canAfford && !isMax) {
                            soundEngine.playFanfare();
                            onUpgradeSkill(selectedHero.id, skill.id);
                          }
                        }}
                        disabled={!canAfford || isMax}
                        className={`px-3 py-1.5 rounded text-xs font-bold font-mono transition-all flex items-center gap-1.5 whitespace-nowrap ${
                          isMax
                            ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                            : canAfford
                            ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 cursor-pointer shadow-md'
                            : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                        }`}
                      >
                        <ArrowUpCircle className="w-3.5 h-3.5" />
                        <span>
                          {isMax ? t.maxLevel : `${t.upgradeSkill} (${upgradeCost} 🪙)`}
                        </span>
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
