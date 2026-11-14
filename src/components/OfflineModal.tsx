import React from 'react';
import { Language, translations } from '../game/localization';
import { Sparkles, Check } from 'lucide-react';

interface OfflineModalProps {
  lang: Language;
  offlineSeconds: number;
  offlineCoins: number;
  offlineOres: number;
  onClaim: () => void;
}

export const OfflineModal: React.FC<OfflineModalProps> = ({
  lang,
  offlineSeconds,
  offlineCoins,
  offlineOres,
  onClaim,
}) => {
  const t = translations[lang];

  const formatTime = (secs: number) => {
    const hours = Math.floor(secs / 3600);
    const minutes = Math.floor((secs % 3600) / 60);
    if (hours > 0) return `${hours}h ${minutes}min`;
    return `${minutes} minutos`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4">
      <div className="w-full max-w-md bg-slate-900 border border-amber-500/60 rounded-2xl p-6 shadow-2xl flex flex-col items-center text-center gap-4">
        <div className="w-14 h-14 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-2xl">
          ⛏️
        </div>

        <div>
          <h2 className="text-xl font-black font-display text-amber-400 uppercase tracking-wide">
            {t.welcomeBack}
          </h2>
          <p className="text-xs text-slate-300 font-mono mt-1">
            {t.offlineSummary}
          </p>
        </div>

        <div className="w-full bg-slate-950 p-4 rounded-xl border border-slate-800 flex flex-col gap-2.5 text-xs font-mono">
          <div className="flex justify-between items-center text-slate-400">
            <span>{t.timePassed}:</span>
            <span className="text-slate-200 font-bold">{formatTime(offlineSeconds)}</span>
          </div>
          <div className="flex justify-between items-center text-slate-400">
            <span>{t.coinsEarned}:</span>
            <span className="text-amber-400 font-bold text-sm tabular-nums">+{offlineCoins.toLocaleString()} 🪙</span>
          </div>
          <div className="flex justify-between items-center text-slate-400">
            <span>{t.oresFarmed}:</span>
            <span className="text-emerald-400 font-bold text-sm tabular-nums">+{offlineOres.toLocaleString()} Minérios</span>
          </div>
        </div>

        <button
          onClick={onClaim}
          className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black font-display uppercase tracking-wider text-sm shadow-lg shadow-amber-500/30 transition-all flex items-center justify-center gap-2 cursor-pointer"
        >
          <Check className="w-4 h-4" />
          <span>{t.claimRewards}</span>
        </button>
      </div>
    </div>
  );
};
