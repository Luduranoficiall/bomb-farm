import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { TitleScreen } from './components/TitleScreen';
import { HUD } from './components/HUD';
import { MineCanvas } from './game/MineCanvas';
import { SquadModal } from './components/SquadModal';
import { ForgeModal } from './components/ForgeModal';
import { SkillTreeModal } from './components/SkillTreeModal';
import { MarketModal } from './components/MarketModal';
import { WorldMapModal } from './components/WorldMapModal';
import { OfflineModal } from './components/OfflineModal';
import { soundEngine } from './game/audio';
import { Language } from './game/localization';
import { Hero, SquadId, Equipment, PassiveNode, MarketItem, GameWorld, MineralType } from './game/types';
import {
  INITIAL_HEROES,
  INITIAL_EQUIPMENT,
  INITIAL_PASSIVE_NODES,
  INITIAL_MARKET_ITEMS,
  GAME_WORLDS,
} from './game/initialData';

export default function App() {
  // Game State Machine
  const [gameState, setGameState] = useState<'TITLE' | 'PLAYING' | 'PAUSED'>('TITLE');
  const [lang, setLang] = useState<Language>('pt');
  const [isMuted, setIsMuted] = useState<boolean>(soundEngine.isMuted);
  const [activeTab, setActiveTab] = useState<'mine' | 'squad' | 'forge' | 'skillTree' | 'market' | 'worldMap'>('mine');

  // Progression & Currencies
  const [currentStage, setCurrentStage] = useState<number>(1);
  const [highestStageUnlocked, setHighestStageUnlocked] = useState<number>(1);
  const [coins, setCoins] = useState<number>(350);
  const [gems, setGems] = useState<number>(30);
  const [ores, setOres] = useState({
    coal: 85,
    copper: 35,
    iron: 18,
    gold: 6,
    amethyst: 2,
    voidStone: 0,
  });

  // Heroes & Squads
  const [heroes, setHeroes] = useState<Hero[]>(INITIAL_HEROES);
  const [activeSquadId, setActiveSquadId] = useState<SquadId>('alpha');
  const [squadAssignments, setSquadAssignments] = useState<Record<SquadId, string[]>>({
    alpha: ['hero_pete', 'hero_lin', 'hero_dave', 'hero_vesper'],
    beta: ['hero_bruno', 'hero_gideon', 'hero_maya', 'hero_blizzard'],
    gamma: ['hero_valkyrie', 'hero_lin', 'hero_dave', 'hero_bruno'],
  });

  // Equipment & Inventory
  const [inventory, setInventory] = useState<Equipment[]>(INITIAL_EQUIPMENT);

  // Passive Skill Tree
  const [passiveNodes, setPassiveNodes] = useState<PassiveNode[]>(INITIAL_PASSIVE_NODES);
  const [skillPointsAvailable, setSkillPointsAvailable] = useState<number>(3);

  // Market Items
  const [marketItems, setMarketItems] = useState<MarketItem[]>(INITIAL_MARKET_ITEMS);

  // Mega-Bomb Detonator Cooldown
  const [megaCooldownTimer, setMegaCooldownTimer] = useState<number>(0);
  const [maxMegaCooldown] = useState<number>(12); // in seconds

  // Offline idle calculation state
  const [offlineData, setOfflineData] = useState<{
    seconds: number;
    coins: number;
    ores: number;
  } | null>(null);

  // Load saved state from localStorage upon first mount
  useEffect(() => {
    try {
      const savedSave = localStorage.getItem('bomb_farm_save_v1');
      if (savedSave) {
        const parsed = JSON.parse(savedSave);
        if (parsed.currentStage) setCurrentStage(parsed.currentStage);
        if (parsed.highestStageUnlocked) setHighestStageUnlocked(parsed.highestStageUnlocked);
        if (parsed.coins !== undefined) setCoins(parsed.coins);
        if (parsed.gems !== undefined) setGems(parsed.gems);
        if (parsed.ores) setOres(parsed.ores);
        if (parsed.heroes) setHeroes(parsed.heroes);
        if (parsed.inventory) setInventory(parsed.inventory);
        if (parsed.passiveNodes) setPassiveNodes(parsed.passiveNodes);
        if (parsed.skillPointsAvailable !== undefined) setSkillPointsAvailable(parsed.skillPointsAvailable);
        if (parsed.squadAssignments) setSquadAssignments(parsed.squadAssignments);

        // Check offline elapsed time
        if (parsed.lastSaved) {
          const elapsedSecs = Math.floor((Date.now() - parsed.lastSaved) / 1000);
          if (elapsedSecs > 45) {
            const cappedSecs = Math.min(elapsedSecs, 12 * 3600); // Max 12 hours
            const earnedCoins = Math.floor(cappedSecs * 3.5);
            const earnedOres = Math.floor(cappedSecs * 1.8);
            setOfflineData({
              seconds: cappedSecs,
              coins: earnedCoins,
              ores: earnedOres,
            });
          }
        }
      }
    } catch {}
  }, []);

  // Auto-save state every 6 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      try {
        const payload = {
          currentStage,
          highestStageUnlocked,
          coins,
          gems,
          ores,
          heroes,
          inventory,
          passiveNodes,
          skillPointsAvailable,
          squadAssignments,
          lastSaved: Date.now(),
        };
        localStorage.setItem('bomb_farm_save_v1', JSON.stringify(payload));
      } catch {}
    }, 6000);
    return () => clearInterval(interval);
  }, [
    currentStage,
    highestStageUnlocked,
    coins,
    gems,
    ores,
    heroes,
    inventory,
    passiveNodes,
    skillPointsAvailable,
    squadAssignments,
  ]);

  // Current Game World calculation
  const currentWorld = useMemo(() => {
    return (
      GAME_WORLDS.find((w) => currentStage >= w.minStage && currentStage <= w.maxStage) ||
      GAME_WORLDS[0]
    );
  }, [currentStage]);

  // Active Heroes in the current squad
  const activeHeroes = useMemo(() => {
    const assignedIds = squadAssignments[activeSquadId] || [];
    return heroes.filter((h) => assignedIds.includes(h.id));
  }, [heroes, squadAssignments, activeSquadId]);

  // Aggregate Passive Skill Tree bonuses
  const passiveBonuses = useMemo(() => {
    let blastDamagePct = 0;
    let blastRadiusBonus = 0;
    let oreYieldPct = 0;
    let squadSpeedPct = 0;
    let critChancePct = 0;
    let megaCooldownReductionPct = 0;
    let rareLootChancePct = 0;

    passiveNodes.forEach((node) => {
      if (!node.allocated) return;
      if (node.bonusType === 'blastDamage') blastDamagePct += node.bonusValue;
      if (node.bonusType === 'blastRadius') blastRadiusBonus += node.bonusValue;
      if (node.bonusType === 'oreYield') oreYieldPct += node.bonusValue;
      if (node.bonusType === 'squadSpeed') squadSpeedPct += node.bonusValue;
      if (node.bonusType === 'critChance') critChancePct += node.bonusValue;
      if (node.bonusType === 'megaCooldown') megaCooldownReductionPct += node.bonusValue;
      if (node.bonusType === 'rareLootChance') rareLootChancePct += node.bonusValue;
    });

    return {
      blastDamagePct,
      blastRadiusBonus,
      oreYieldPct,
      squadSpeedPct,
      critChancePct,
      megaCooldownReductionPct,
      rareLootChancePct,
    };
  }, [passiveNodes]);

  // Mega-Bomb Cooldown Timer tick
  useEffect(() => {
    if (gameState !== 'PLAYING') return;
    const interval = setInterval(() => {
      setMegaCooldownTimer((prev) => {
        if (prev <= 0) return 0;
        return Math.max(0, prev - 0.2);
      });
    }, 200);
    return () => clearInterval(interval);
  }, [gameState]);

  const megaBombReady = megaCooldownTimer <= 0;
  const effectiveMaxCooldown = Math.max(
    4,
    maxMegaCooldown * (1 - (passiveBonuses.megaCooldownReductionPct || 0) / 100)
  );
  const megaBombCooldownPct = ((effectiveMaxCooldown - megaCooldownTimer) / effectiveMaxCooldown) * 100;

  // Global Keyboard shortcuts (1, 2, 3 to swap squads; Esc to pause)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (gameState === 'PLAYING') {
        if (e.key === '1') {
          setActiveSquadId('alpha');
          soundEngine.playFanfare();
        } else if (e.key === '2') {
          setActiveSquadId('beta');
          soundEngine.playFanfare();
        } else if (e.key === '3') {
          setActiveSquadId('gamma');
          soundEngine.playFanfare();
        } else if (e.key === 'Escape') {
          if (activeTab !== 'mine') {
            setActiveTab('mine');
          } else {
            setGameState((prev) => (prev === 'PLAYING' ? 'PAUSED' : 'PLAYING'));
          }
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameState, activeTab]);

  // Handlers
  const handleToggleLang = useCallback(() => {
    setLang((prev) => (prev === 'pt' ? 'en' : 'pt'));
  }, []);

  const handleToggleMute = useCallback(() => {
    const muted = soundEngine.toggleMute();
    setIsMuted(muted);
  }, []);

  const handleTogglePause = useCallback(() => {
    setGameState((prev) => (prev === 'PLAYING' ? 'PAUSED' : 'PLAYING'));
  }, []);

  const handleMineLoot = useCallback(
    (mineral: MineralType, amount: number, lootCoins: number, isBoss: boolean) => {
      setCoins((prev) => prev + lootCoins);
      setOres((prev) => {
        const next = { ...prev };
        if (mineral === 'coal') next.coal += amount;
        else if (mineral === 'copper') next.copper += amount;
        else if (mineral === 'iron') next.iron += amount;
        else if (mineral === 'gold') next.gold += amount;
        else if (mineral === 'amethyst') next.amethyst += amount;
        else if (mineral === 'voidStone') next.voidStone += amount;
        return next;
      });

      // Bonus Cosmic Gems or Relic drop on boss clear
      if (isBoss) {
        setGems((prev) => prev + 5);
        soundEngine.playFanfare();
      }
    },
    []
  );

  const handleHeroGainExp = useCallback((heroId: string, exp: number) => {
    setHeroes((prev) =>
      prev.map((hero) => {
        if (hero.id !== heroId) return hero;
        const newExp = hero.experience + exp;
        if (newExp >= hero.maxExperience) {
          return {
            ...hero,
            level: hero.level + 1,
            experience: newExp - hero.maxExperience,
            maxExperience: Math.floor(hero.maxExperience * 1.35),
            baseDamage: Math.floor(hero.baseDamage * 1.15),
          };
        }
        return { ...hero, experience: newExp };
      })
    );
  }, []);

  const handleStageClear = useCallback(() => {
    soundEngine.playFanfare();
    setCurrentStage((prev) => {
      const nextStage = Math.min(600, prev + 1);
      setHighestStageUnlocked((h) => Math.max(h, nextStage));
      // Award skill point every 5 stages cleared
      if (nextStage % 5 === 0) {
        setSkillPointsAvailable((pts) => pts + 1);
      }
      return nextStage;
    });
  }, []);

  const handleTriggerMegaBomb = useCallback(() => {
    if (!megaBombReady) return;
    setMegaCooldownTimer(effectiveMaxCooldown);
  }, [megaBombReady, effectiveMaxCooldown]);

  const handleAllocateNode = useCallback((nodeId: string) => {
    setPassiveNodes((prev) =>
      prev.map((n) => (n.id === nodeId ? { ...n, allocated: true } : n))
    );
    setSkillPointsAvailable((prev) => Math.max(0, prev - 1));
  }, []);

  const handleResetSkillTree = useCallback(() => {
    const allocatedCount = passiveNodes.filter((n) => n.allocated && n.id !== 'p_core').length;
    setPassiveNodes(INITIAL_PASSIVE_NODES);
    setSkillPointsAvailable((prev) => prev + allocatedCount);
  }, [passiveNodes]);

  const handleUpgradeItem = useCallback((itemId: string, success: boolean, newLevel: number) => {
    if (success) {
      setInventory((prev) =>
        prev.map((item) =>
          item.id === itemId
            ? {
                ...item,
                upgradeLevel: newLevel,
                basePower: Math.floor(item.basePower * 1.25),
              }
            : item
        )
      );
    }
  }, []);

  const handleFuseStars = useCallback((itemId: string) => {
    setInventory((prev) =>
      prev.map((item) =>
        item.id === itemId
          ? {
              ...item,
              stars: Math.min(5, item.stars + 1),
              basePower: Math.floor(item.basePower * 1.35),
            }
          : item
      )
    );
  }, []);

  const handleRerollAffixes = useCallback((itemId: string, newAffixes: Equipment['affixes']) => {
    setInventory((prev) =>
      prev.map((item) => (item.id === itemId ? { ...item, affixes: newAffixes } : item))
    );
  }, []);

  const handleUpgradeSkill = useCallback((heroId: string, skillId: string) => {
    setHeroes((prev) =>
      prev.map((hero) => {
        if (hero.id !== heroId) return hero;
        const updatedSkills = hero.skills.map((s) =>
          s.id === skillId ? { ...s, level: Math.min(s.maxLevel, s.level + 1) } : s
        );
        const cost = (hero.skills.find((s) => s.id === skillId)?.level || 1) * 150;
        setCoins((c) => Math.max(0, c - cost));
        return {
          ...hero,
          baseDamage: Math.floor(hero.baseDamage * 1.1),
          skills: updatedSkills,
        };
      })
    );
  }, []);

  const handleBuyMarketItem = useCallback((itemId: string, qty: number, totalCost: number) => {
    setCoins((c) => Math.max(0, c - totalCost));
    setOres((prev) => {
      const next = { ...prev };
      if (itemId === 'mkt_coal') next.coal += qty;
      if (itemId === 'mkt_copper') next.copper += qty;
      if (itemId === 'mkt_iron') next.iron += qty;
      if (itemId === 'mkt_gold') next.gold += qty;
      if (itemId === 'mkt_amethyst') next.amethyst += qty;
      if (itemId === 'mkt_void_core') next.voidStone += qty;
      return next;
    });
  }, []);

  const handleSellMarketItem = useCallback((itemId: string, qty: number, totalRevenue: number) => {
    setCoins((c) => c + totalRevenue);
    setOres((prev) => {
      const next = { ...prev };
      if (itemId === 'mkt_coal') next.coal = Math.max(0, next.coal - qty);
      if (itemId === 'mkt_copper') next.copper = Math.max(0, next.copper - qty);
      if (itemId === 'mkt_iron') next.iron = Math.max(0, next.iron - qty);
      if (itemId === 'mkt_gold') next.gold = Math.max(0, next.gold - qty);
      if (itemId === 'mkt_amethyst') next.amethyst = Math.max(0, next.amethyst - qty);
      if (itemId === 'mkt_void_core') next.voidStone = Math.max(0, next.voidStone - qty);
      return next;
    });
  }, []);

  const handleEquipItem = useCallback((heroId: string, item: Equipment) => {
    setHeroes((prev) =>
      prev.map((h) => {
        if (h.id !== heroId) return h;
        return {
          ...h,
          equipped: {
            ...h.equipped,
            [item.slot]: item,
          },
          baseDamage: h.baseDamage + item.basePower,
        };
      })
    );
  }, []);

  const handleUnequipItem = useCallback((heroId: string, slot: 'weapon' | 'armor' | 'charm') => {
    setHeroes((prev) =>
      prev.map((h) => {
        if (h.id !== heroId) return h;
        const currentItem = h.equipped[slot];
        const powerToDeduct = currentItem ? currentItem.basePower : 0;
        return {
          ...h,
          equipped: {
            ...h.equipped,
            [slot]: null,
          },
          baseDamage: Math.max(10, h.baseDamage - powerToDeduct),
        };
      })
    );
  }, []);

  return (
    <div className="relative w-screen h-screen overflow-hidden flex flex-col bg-[#0b0e14] text-slate-100 font-sans select-none">
      {/* View 1: Title Screen */}
      {gameState === 'TITLE' && (
        <TitleScreen
          lang={lang}
          onToggleLang={handleToggleLang}
          isMuted={isMuted}
          onToggleMute={handleToggleMute}
          onStartGame={() => setGameState('PLAYING')}
        />
      )}

      {/* View 2: Active Game Shell */}
      {gameState !== 'TITLE' && (
        <>
          <HUD
            lang={lang}
            onToggleLang={handleToggleLang}
            isMuted={isMuted}
            onToggleMute={handleToggleMute}
            isPaused={gameState === 'PAUSED'}
            onTogglePause={handleTogglePause}
            activeSquadId={activeSquadId}
            onSelectSquad={(sId) => {
              soundEngine.playFanfare();
              setActiveSquadId(sId);
            }}
            currentWorld={currentWorld}
            currentStage={currentStage}
            onNextStage={() => {
              if (currentStage < highestStageUnlocked) {
                setCurrentStage((s) => s + 1);
              }
            }}
            onPrevStage={() => {
              if (currentStage > 1) {
                setCurrentStage((s) => s - 1);
              }
            }}
            coins={coins}
            gems={gems}
            ores={ores}
            megaBombCooldownPct={megaBombCooldownPct}
            megaBombReady={megaBombReady}
            onTriggerMegaBomb={handleTriggerMegaBomb}
            activeTab={activeTab}
            onSelectTab={(tab) => {
              soundEngine.playFuseSound();
              setActiveTab(tab);
            }}
            skillPointsAvailable={skillPointsAvailable}
          />

          {/* Main Playfield / Overlay Container */}
          <main className="relative flex-1 w-full h-full overflow-hidden">
            {/* 60fps Mine Canvas (Always running underneath so idle progression and blasting continues) */}
            <div className={`w-full h-full ${activeTab !== 'mine' ? 'hidden' : 'block'}`}>
              <MineCanvas
                currentWorld={currentWorld}
                currentStage={currentStage}
                activeHeroes={activeHeroes}
                passiveBonuses={passiveBonuses}
                onMineLoot={handleMineLoot}
                onHeroGainExp={handleHeroGainExp}
                onStageClear={handleStageClear}
                megaBombReady={megaBombReady}
                onUseMegaBomb={handleTriggerMegaBomb}
              />
            </div>

            {/* Overlays (Zero occlusion when closed, clean tabs) */}
            {activeTab === 'squad' && (
              <SquadModal
                lang={lang}
                heroes={heroes}
                activeSquadId={activeSquadId}
                squadAssignments={squadAssignments}
                onAssignHeroToSquad={(squadId, heroId, slotIndex) => {
                  setSquadAssignments((prev) => {
                    const currentList = [...prev[squadId]];
                    currentList[slotIndex] = heroId;
                    return { ...prev, [squadId]: currentList };
                  });
                }}
                onUpgradeSkill={handleUpgradeSkill}
                coins={coins}
                inventory={inventory}
                onEquipItem={handleEquipItem}
                onUnequipItem={handleUnequipItem}
              />
            )}

            {activeTab === 'forge' && (
              <ForgeModal
                lang={lang}
                inventory={inventory}
                coins={coins}
                gems={gems}
                onUpgradeItem={handleUpgradeItem}
                onFuseStars={handleFuseStars}
                onRerollAffixes={handleRerollAffixes}
                onConsumeCurrency={(c, g) => {
                  setCoins((prev) => Math.max(0, prev - c));
                  setGems((prev) => Math.max(0, prev - g));
                }}
              />
            )}

            {activeTab === 'skillTree' && (
              <SkillTreeModal
                lang={lang}
                skillNodes={passiveNodes}
                skillPointsAvailable={skillPointsAvailable}
                onAllocateNode={handleAllocateNode}
                onResetSkillTree={handleResetSkillTree}
              />
            )}

            {activeTab === 'market' && (
              <MarketModal
                lang={lang}
                items={marketItems}
                coins={coins}
                ores={ores}
                onBuyItem={handleBuyMarketItem}
                onSellItem={handleSellMarketItem}
              />
            )}

            {activeTab === 'worldMap' && (
              <WorldMapModal
                lang={lang}
                worlds={GAME_WORLDS}
                currentWorld={currentWorld}
                currentStage={currentStage}
                highestStageUnlocked={highestStageUnlocked}
                onSelectStage={(stage) => {
                  setCurrentStage(stage);
                  setActiveTab('mine');
                }}
              />
            )}

            {/* Pause Modal */}
            {gameState === 'PAUSED' && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4">
                <div className="bg-slate-900 border border-slate-700 p-6 rounded-2xl max-w-sm w-full text-center flex flex-col gap-4 shadow-2xl">
                  <h3 className="text-xl font-black font-display text-amber-400 uppercase tracking-wider">
                    JOGO PAUSADO
                  </h3>
                  <p className="text-xs text-slate-400 font-mono">
                    A mineração automática foi interrompida temporariamente.
                  </p>
                  <button
                    onClick={() => setGameState('PLAYING')}
                    className="w-full py-2.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-black font-display uppercase tracking-wider text-xs transition-colors cursor-pointer"
                  >
                    CONTINUAR
                  </button>
                  <button
                    onClick={() => setGameState('TITLE')}
                    className="w-full py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium text-xs transition-colors cursor-pointer"
                  >
                    VOLTAR AO MENU INICIAL
                  </button>
                </div>
              </div>
            )}

            {/* Offline Progress Modal (Welcome Back) */}
            {offlineData && (
              <OfflineModal
                lang={lang}
                offlineSeconds={offlineData.seconds}
                offlineCoins={offlineData.coins}
                offlineOres={offlineData.ores}
                onClaim={() => {
                  soundEngine.playFanfare();
                  setCoins((c) => c + offlineData.coins);
                  setOres((o) => ({
                    ...o,
                    coal: o.coal + Math.floor(offlineData.ores * 0.5),
                    copper: o.copper + Math.floor(offlineData.ores * 0.3),
                    iron: o.iron + Math.floor(offlineData.ores * 0.2),
                  }));
                  setOfflineData(null);
                }}
              />
            )}
          </main>
        </>
      )}
    </div>
  );
}
