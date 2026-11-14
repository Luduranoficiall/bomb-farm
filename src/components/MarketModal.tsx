import React, { useState, useEffect } from 'react';
import { MarketItem } from '../game/types';
import { Language, translations } from '../game/localization';
import { soundEngine } from '../game/audio';
import { TrendingUp, TrendingDown, DollarSign, ShoppingCart, ArrowDownRight, ArrowUpRight } from 'lucide-react';

interface MarketModalProps {
  lang: Language;
  items: MarketItem[];
  coins: number;
  ores: {
    coal: number;
    copper: number;
    iron: number;
    gold: number;
    amethyst: number;
    voidStone: number;
  };
  onBuyItem: (itemId: string, quantity: number, totalCost: number) => void;
  onSellItem: (itemId: string, quantity: number, totalRevenue: number) => void;
}

export const MarketModal: React.FC<MarketModalProps> = ({
  lang,
  items,
  coins,
  ores,
  onBuyItem,
  onSellItem,
}) => {
  const t = translations[lang];
  const [selectedItemId, setSelectedItemId] = useState<string>(items[0]?.id || '');
  const [tradeQuantity, setTradeQuantity] = useState<number>(10);
  const [liveTrades, setLiveTrades] = useState<{ id: string; text: string; time: string }[]>([]);

  const selectedItem = items.find((i) => i.id === selectedItemId) || items[0];

  // Helper to get actual player stock for the item
  const getPlayerStock = (item: MarketItem) => {
    if (item.id === 'mkt_coal') return ores.coal;
    if (item.id === 'mkt_copper') return ores.copper;
    if (item.id === 'mkt_iron') return ores.iron;
    if (item.id === 'mkt_gold') return ores.gold;
    if (item.id === 'mkt_amethyst') return ores.amethyst;
    if (item.id === 'mkt_void_core') return ores.voidStone;
    return item.userOwned;
  };

  // Generate simulated live trades in the background
  useEffect(() => {
    const fakeUsers = ['BlastMaster_BR', 'SteamPro99', 'GamerX_2026', 'OreCrusher', 'NitroQueen', 'CavernDigger', 'PixelMiner'];
    const fakeActions = ['comprou', 'vendeu'];

    const interval = setInterval(() => {
      const randomUser = fakeUsers[Math.floor(Math.random() * fakeUsers.length)];
      const randomAction = fakeActions[Math.floor(Math.random() * fakeActions.length)];
      const randomItem = items[Math.floor(Math.random() * items.length)];
      const qty = Math.floor(1 + Math.random() * 25);
      const total = qty * randomItem.currentPrice;

      const newTrade = {
        id: `trade_${Date.now()}`,
        text: `${randomUser} ${randomAction} ${qty}x ${lang === 'pt' ? randomItem.namePt : randomItem.nameEn} por ${total.toLocaleString()} 🪙`,
        time: 'Agora',
      };

      setLiveTrades((prev) => [newTrade, ...prev.slice(0, 7)]);
    }, 4500);

    return () => clearInterval(interval);
  }, [items, lang]);

  const stock = selectedItem ? getPlayerStock(selectedItem) : 0;
  const totalCost = selectedItem ? selectedItem.currentPrice * tradeQuantity : 0;
  const canAffordBuy = coins >= totalCost;
  const canAffordSell = stock >= tradeQuantity;

  return (
    <div className="w-full h-full p-4 lg:p-6 overflow-y-auto bg-[#0c0f17] text-slate-100 flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h2 className="text-xl font-black font-display tracking-wide text-amber-400 uppercase">
            💰 {t.marketTitle}
          </h2>
          <p className="text-xs text-slate-400 font-mono mt-0.5">
            {t.marketSubtitle}.
          </p>
        </div>

        {/* Player Wallet Badge */}
        <div className="flex items-center gap-2 bg-slate-900 px-4 py-2 rounded-xl border border-amber-500/30 shadow-md">
          <span className="text-sm">🪙</span>
          <div className="text-xs font-mono">
            <span className="text-slate-400 uppercase tracking-wider">{t.marketWallet}:</span>{' '}
            <span className="text-amber-400 font-bold text-base tabular-nums">
              {coins.toLocaleString()} Moedas
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1">
        {/* Left Column: Market Commodities List (5 cols) */}
        <div className="lg:col-span-5 flex flex-col gap-2.5">
          <div className="text-xs font-mono text-slate-400 uppercase tracking-wider mb-1">
            Itens Listados no Mercado
          </div>
          <div className="flex flex-col gap-2 overflow-y-auto max-h-[60vh] pr-1">
            {items.map((item) => {
              const isSelected = item.id === selectedItemId;
              const userStock = getPlayerStock(item);

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
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-sm font-bold text-amber-400">
                      {item.category === 'mineral' ? '💎' : '📜'}
                    </div>
                    <div>
                      <div className="text-sm font-bold text-slate-200">
                        {lang === 'pt' ? item.namePt : item.nameEn}
                      </div>
                      <div className="text-xs text-slate-400 font-mono">
                        Seu Estoque: <span className="text-slate-200 font-semibold">{userStock}</span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right font-mono">
                    <div className="text-sm font-bold text-amber-400 tabular-nums">
                      {item.currentPrice} 🪙
                    </div>
                    <div className="flex items-center justify-end text-[11px] gap-0.5">
                      {item.trend === 'up' ? (
                        <span className="text-emerald-400 flex items-center">
                          <ArrowUpRight className="w-3 h-3" /> Alta
                        </span>
                      ) : item.trend === 'down' ? (
                        <span className="text-rose-400 flex items-center">
                          <ArrowDownRight className="w-3 h-3" /> Baixa
                        </span>
                      ) : (
                        <span className="text-slate-400">Estável</span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Price Trend Sparkline & Trading Terminal (7 cols) */}
        {selectedItem && (
          <div className="lg:col-span-7 bg-slate-900/70 border border-slate-800 rounded-xl p-5 flex flex-col gap-6">
            {/* Item Title & Price Sparkline Graph */}
            <div>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-black text-white font-display">
                    {lang === 'pt' ? selectedItem.namePt : selectedItem.nameEn}
                  </h3>
                  <div className="text-xs text-slate-400 font-mono mt-0.5">
                    {lang === 'pt' ? selectedItem.descriptionPt : selectedItem.descriptionEn}
                  </div>
                </div>

                <div className="text-right font-mono">
                  <div className="text-xs text-slate-400 uppercase">Preço de Mercado</div>
                  <div className="text-xl font-black text-amber-400 tabular-nums">
                    {selectedItem.currentPrice} 🪙
                  </div>
                </div>
              </div>

              {/* Price History Sparkline (SVG Chart) */}
              <div className="mt-4 p-3 bg-slate-950/80 rounded-lg border border-slate-800">
                <div className="text-[10px] font-mono uppercase text-slate-500 mb-1">
                  Gráfico de Histórico de Preços (Últimas Variações)
                </div>
                <div className="h-20 w-full flex items-end gap-1.5 pt-2">
                  {selectedItem.priceHistory.map((price, idx) => {
                    const min = Math.min(...selectedItem.priceHistory) * 0.9;
                    const max = Math.max(...selectedItem.priceHistory) * 1.1;
                    const heightPct = Math.max(15, Math.min(100, ((price - min) / (max - min)) * 100));

                    return (
                      <div key={idx} className="flex-1 flex flex-col items-center gap-1 group relative">
                        <div
                          style={{ height: `${heightPct}%` }}
                          className="w-full bg-amber-500/70 rounded-xs group-hover:bg-amber-400 transition-all"
                        />
                        <div className="opacity-0 group-hover:opacity-100 absolute -top-7 bg-slate-900 border border-slate-700 text-[9px] font-mono px-1.5 py-0.5 rounded text-amber-300 pointer-events-none transition-opacity">
                          {price}🪙
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Trade Controls (Quantity Slider & Buttons) */}
            <div className="bg-slate-950/70 p-4 rounded-xl border border-slate-800 flex flex-col gap-4">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-slate-400 uppercase">Quantidade a Negociar:</span>
                <span className="text-amber-400 font-bold text-base tabular-nums">
                  {tradeQuantity} unidades
                </span>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="range"
                  min="1"
                  max="100"
                  value={tradeQuantity}
                  onChange={(e) => setTradeQuantity(Number(e.target.value))}
                  className="w-full accent-amber-500 cursor-pointer"
                />
                <button
                  onClick={() => setTradeQuantity(stock > 0 ? stock : 1)}
                  className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-[10px] font-mono text-slate-300 whitespace-nowrap"
                >
                  Máx ({stock})
                </button>
              </div>

              <div className="flex justify-between items-center text-xs font-mono border-t border-slate-800/80 pt-3">
                <span className="text-slate-400">Total da Ordem:</span>
                <span className="text-amber-300 font-bold text-lg tabular-nums">
                  {totalCost.toLocaleString()} 🪙
                </span>
              </div>

              {/* Buy and Sell Action Buttons */}
              <div className="grid grid-cols-2 gap-3 pt-1">
                <button
                  onClick={() => {
                    if (canAffordBuy) {
                      soundEngine.playMarketCash();
                      onBuyItem(selectedItem.id, tradeQuantity, totalCost);
                    }
                  }}
                  disabled={!canAffordBuy}
                  className={`py-2.5 rounded-lg text-xs font-bold font-display uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 ${
                    canAffordBuy
                      ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-600/20 cursor-pointer'
                      : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                  }`}
                >
                  <ShoppingCart className="w-3.5 h-3.5" />
                  <span>Comprar ({tradeQuantity}x)</span>
                </button>

                <button
                  onClick={() => {
                    if (canAffordSell) {
                      soundEngine.playMarketCash();
                      onSellItem(selectedItem.id, tradeQuantity, totalCost);
                    }
                  }}
                  disabled={!canAffordSell}
                  className={`py-2.5 rounded-lg text-xs font-bold font-display uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 ${
                    canAffordSell
                      ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 font-black shadow-md shadow-amber-500/20 cursor-pointer'
                      : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                  }`}
                >
                  <DollarSign className="w-3.5 h-3.5" />
                  <span>Vender ({tradeQuantity}x)</span>
                </button>
              </div>
            </div>

            {/* Live Community Feed */}
            <div>
              <div className="text-[10px] font-mono uppercase text-slate-400 mb-2 tracking-wider">
                Atividade Recente no Mercado Steam (Simulada)
              </div>
              <div className="flex flex-col gap-1.5 font-mono text-xs">
                {liveTrades.length > 0 ? (
                  liveTrades.map((t) => (
                    <div
                      key={t.id}
                      className="p-2 bg-slate-950/50 rounded border border-slate-800/60 text-slate-300 flex justify-between items-center text-[11px]"
                    >
                      <span>{t.text}</span>
                      <span className="text-slate-500 text-[10px]">{t.time}</span>
                    </div>
                  ))
                ) : (
                  <div className="text-slate-500 italic text-[11px]">
                    Aguardando ordens de outros jogadores...
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
