import React, { useState } from 'react';
import { Equipment } from '../game/types';
import { Language, translations } from '../game/localization';
import { soundEngine } from '../game/audio';
import { Sparkles, Hammer, ShieldAlert, Star, RotateCcw } from 'lucide-react';

interface ForgeModalProps {
  lang: Language;
  inventory: Equipment[];
  coins: number;
  gems: number;
  onUpgradeItem: (itemId: string, success: boolean, newLevel: number) => void;
  onFuseStars: (itemId: string) => void;
  onRerollAffixes: (itemId: string, newAffixes: Equipment['affixes']) => void;
  onConsumeCurrency: (coins: number, gems: number) => void;
}

export const ForgeModal: React.FC<ForgeModalProps> = ({
  lang,
  inventory,
  coins,
  gems,
  onUpgradeItem,
  onFuseStars,
  onRerollAffixes,
  onConsumeCurrency,
}) => {
  const t = translations[lang];
  const [selectedItemId, setSelectedItemId] = useState<string>(inventory[0]?.id || '');
  const [isForging, setIsForging] = useState<boolean>(false);
  const [forgeResult, setForgeResult] = useState<{ success: boolean; msg: string } | null>(null);

  const selectedItem = inventory.find((i) => i.id === selectedItemId) || inventory[0];

  // Calculate success probability and cost based on level
  const getSuccessRate = (level: number) => {
    if (level < 3) return 1.0;
    if (level < 6) return 0.85;
    if (level < 9) return 0.65;
    if (level < 12) return 0.45;
    return 0.3; // +12 to +15
  };

  const getUpgradeCost = (level: number) => {
    return Math.floor(100 * Math.pow(1.35, level));
  };

  const handleUpgrade = () => {
    if (!selectedItem || isForging) return;
    if (selectedItem.upgradeLevel >= 15) return;

    const cost = getUpgradeCost(selectedItem.upgradeLevel);
    if (coins < cost) return;

    setIsForging(true);
    setForgeResult(null);
    onConsumeCurrency(cost, 0);

    setTimeout(() => {
      const rate = getSuccessRate(selectedItem.upgradeLevel);
      const isSuccess = Math.random() < rate;

      soundEngine.playForgeClink(isSuccess);
      setIsForging(false);

      if (isSuccess) {
        const nextLevel = selectedItem.upgradeLevel + 1;
        setForgeResult({ success: true, msg: `${t.forgeSuccess} (+${nextLevel})` });
        onUpgradeItem(selectedItem.id, true, nextLevel);
      } else {
        setForgeResult({ success: false, msg: t.forgeFailure });
        onUpgradeItem(selectedItem.id, false, selectedItem.upgradeLevel);
      }
    }, 700);
  };

  const handleFuseStar = () => {
    if (!selectedItem || selectedItem.stars >= 5) return;
    const starCost = (selectedItem.stars + 1) * 300;
    if (coins < starCost) return;

    soundEngine.playForgeClink(true);
    onConsumeCurrency(starCost, 0);
    onFuseStars(selectedItem.id);
    setForgeResult({ success: true, msg: `Estrela Fundida com Sucesso! (★${selectedItem.stars + 1})` });
  };

  const handleReroll = () => {
    if (!selectedItem || gems < 15) return;
    soundEngine.playFanfare();
    onConsumeCurrency(0, 15);

    const possibleStats = [
      { stat: 'Dano de Explosão', min: 10, max: 35, unit: '%' },
      { stat: 'Raio de Demolição', min: 0.2, max: 0.8, unit: ' tiles' },
      { stat: 'Chance de Crítico', min: 4, max: 15, unit: '%' },
      { stat: 'Rendimento de Moedas', min: 15, max: 50, unit: '%' },
      { stat: 'Velocidade da Equipe', min: 8, max: 20, unit: '%' },
      { stat: 'Sorte de Loot Raro', min: 10, max: 40, unit: '%' },
    ];

    const count = 2 + (selectedItem.stars > 2 ? 1 : 0);
    const shuffled = [...possibleStats].sort(() => 0.5 - Math.random()).slice(0, count);
    const newAffixes = shuffled.map((s) => ({
      stat: s.stat,
      value: Math.round(s.min + Math.random() * (s.max - s.min)),
      unit: s.unit,
    }));

    onRerollAffixes(selectedItem.id, newAffixes);
    setForgeResult({ success: true, msg: 'Novos Atributos Concedidos!' });
  };

  return (
    <div className="w-full h-full p-4 lg:p-6 overflow-y-auto bg-[#0d1117] text-slate-100 flex flex-col gap-6">
      {/* Header */}
      <div className="border-b border-slate-800 pb-4">
        <h2 className="text-xl font-black font-display tracking-wide text-amber-400 uppercase">
          ⚔️ {t.forgeTitle} (+0 ao +15)
        </h2>
        <p className="text-xs text-slate-400 font-mono mt-0.5">
          {t.forgeSubtitle}. Seus itens nunca quebram nem são destruídos em caso de falha.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1">
        {/* Left Column: Inventory Items (5 cols) */}
        <div className="lg:col-span-5 flex flex-col gap-2.5">
          <div className="text-xs font-mono text-slate-400 uppercase tracking-wider mb-1">
            Equipamentos no Inventário ({inventory.length})
          </div>
          <div className="flex flex-col gap-2 overflow-y-auto max-h-[60vh] pr-1">
            {inventory.map((item) => {
              const isSelected = item.id === selectedItemId;
              return (
                <div
                  key={item.id}
                  onClick={() => setSelectedItemId(item.id)}
                  className={`p-3 rounded-lg border cursor-pointer transition-all flex items-center justify-between ${
                    isSelected
                      ? 'bg-slate-800/90 border-amber-500 shadow-md ring-1 ring-amber-500/50'
                      : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-slate-200">
                        {lang === 'pt' ? item.namePt : item.nameEn}
                      </span>
                      <span className="text-xs font-bold font-mono text-amber-400">
                        +{item.upgradeLevel}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-slate-400 font-mono mt-0.5">
                      <span className="text-amber-300 font-semibold">{'★'.repeat(item.stars)}</span>
                      <span>·</span>
                      <span className="capitalize">{item.slot}</span>
                      <span>·</span>
                      <span className="capitalize text-slate-300">{item.rarity}</span>
                    </div>
                  </div>

                  <div className="text-right font-mono text-xs">
                    <span className="text-rose-400 font-bold">+{item.basePower} Poder</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: The Anvil & Forge Actions (7 cols) */}
        {selectedItem && (
          <div className="lg:col-span-7 bg-slate-900/70 border border-slate-800 rounded-xl p-5 flex flex-col gap-6">
            {/* Anvil Centerpiece */}
            <div className="relative p-6 rounded-xl bg-gradient-to-b from-slate-950 to-slate-900 border border-slate-800 text-center flex flex-col items-center justify-center overflow-hidden">
              {/* Molten Glow background */}
              <div className="absolute inset-0 bg-radial from-amber-500/10 via-transparent to-transparent pointer-events-none" />

              <div
                className={`w-20 h-20 rounded-2xl bg-slate-800 border-2 border-amber-500/60 flex items-center justify-center text-3xl shadow-xl transition-transform ${
                  isForging ? 'animate-bounce scale-110' : ''
                }`}
              >
                ⚔️
              </div>

              <h3 className="text-lg font-black text-white mt-3">
                {lang === 'pt' ? selectedItem.namePt : selectedItem.nameEn}{' '}
                <span className="text-amber-400 font-mono">+{selectedItem.upgradeLevel}</span>
              </h3>

              <div className="flex items-center gap-2 text-xs text-slate-400 font-mono mt-1">
                <span className="text-amber-300">{'★'.repeat(selectedItem.stars)}</span>
                <span>·</span>
                <span className="text-rose-400 font-bold">Poder Base: +{selectedItem.basePower}</span>
              </div>

              {/* Forge Result Notification Banner */}
              {forgeResult && (
                <div
                  className={`mt-4 px-4 py-2 rounded-lg text-xs font-bold font-mono tracking-wide border ${
                    forgeResult.success
                      ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500/60 shadow-lg shadow-emerald-500/20'
                      : 'bg-rose-950/80 text-rose-300 border-rose-500/60'
                  }`}
                >
                  {forgeResult.msg}
                </div>
              )}
            </div>

            {/* Current Affixes */}
            <div className="bg-slate-950/60 p-4 rounded-lg border border-slate-800/80">
              <div className="flex items-center justify-between text-xs font-mono text-slate-400 uppercase tracking-wider mb-2">
                <span>{t.affixes}</span>
                <button
                  onClick={handleReroll}
                  disabled={gems < 15}
                  className="text-cyan-400 hover:text-cyan-300 disabled:opacity-30 font-semibold flex items-center gap-1 cursor-pointer"
                  title="Custa 15 Gemas Cósmicas"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Rolar Atributos (15 💎)</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {selectedItem.affixes.map((aff, i) => (
                  <div key={i} className="p-2 bg-slate-900 rounded border border-slate-800 text-xs font-mono flex justify-between">
                    <span className="text-slate-300">{aff.stat}</span>
                    <span className="text-emerald-400 font-bold">
                      +{aff.value}
                      {aff.unit}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Action Buttons: Upgrade (+1) and Fuse Star */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Upgrade Button Card */}
              <div className="p-4 bg-slate-950/80 rounded-xl border border-slate-800 flex flex-col justify-between gap-3">
                <div>
                  <div className="text-xs font-mono text-slate-400 uppercase tracking-wider">Aprimoramento (+1)</div>
                  <div className="flex items-center justify-between mt-1 text-xs font-mono">
                    <span className="text-slate-400">Sucesso:</span>
                    <span className="text-amber-400 font-bold">
                      {Math.round(getSuccessRate(selectedItem.upgradeLevel) * 100)}%
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-slate-400">Custo:</span>
                    <span className="text-amber-400 font-bold">
                      {getUpgradeCost(selectedItem.upgradeLevel)} 🪙
                    </span>
                  </div>
                </div>

                <button
                  onClick={handleUpgrade}
                  disabled={
                    isForging ||
                    selectedItem.upgradeLevel >= 15 ||
                    coins < getUpgradeCost(selectedItem.upgradeLevel)
                  }
                  className={`w-full py-2.5 rounded-lg text-xs font-bold font-display uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${
                    selectedItem.upgradeLevel >= 15
                      ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                      : coins >= getUpgradeCost(selectedItem.upgradeLevel)
                      ? 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black shadow-lg shadow-amber-500/20 cursor-pointer'
                      : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                  }`}
                >
                  <Hammer className="w-4 h-4" />
                  <span>
                    {selectedItem.upgradeLevel >= 15 ? 'NÍVEL MÁXIMO (+15)' : t.upgradeItem}
                  </span>
                </button>
              </div>

              {/* Fuse Star Button Card */}
              <div className="p-4 bg-slate-950/80 rounded-xl border border-slate-800 flex flex-col justify-between gap-3">
                <div>
                  <div className="text-xs font-mono text-slate-400 uppercase tracking-wider">Fundir Estrelas (★)</div>
                  <div className="flex items-center justify-between mt-1 text-xs font-mono">
                    <span className="text-slate-400">Estrelas:</span>
                    <span className="text-amber-300 font-bold">{selectedItem.stars}/5</span>
                  </div>
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-slate-400">Custo:</span>
                    <span className="text-amber-400 font-bold">
                      {(selectedItem.stars + 1) * 300} 🪙
                    </span>
                  </div>
                </div>

                <button
                  onClick={handleFuseStar}
                  disabled={selectedItem.stars >= 5 || coins < (selectedItem.stars + 1) * 300}
                  className={`w-full py-2.5 rounded-lg text-xs font-bold font-display uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${
                    selectedItem.stars >= 5
                      ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                      : coins >= (selectedItem.stars + 1) * 300
                      ? 'bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold shadow-lg shadow-cyan-500/20 cursor-pointer'
                      : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                  }`}
                >
                  <Star className="w-4 h-4 text-amber-300" />
                  <span>{selectedItem.stars >= 5 ? 'ESTRELAS MÁXIMAS' : t.fuseDuplicate}</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
