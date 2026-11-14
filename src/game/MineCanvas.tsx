import React, { useEffect, useRef, useCallback } from 'react';
import { Hero, MineRock, ActiveBomb, Particle, FloatingText, MineralType, GameWorld } from './types';
import { soundEngine } from './audio';

interface MineCanvasProps {
  currentWorld: GameWorld;
  currentStage: number;
  activeHeroes: Hero[];
  passiveBonuses: {
    blastDamagePct: number;
    blastRadiusBonus: number;
    oreYieldPct: number;
    squadSpeedPct: number;
    critChancePct: number;
    megaCooldownReductionPct: number;
    rareLootChancePct: number;
  };
  onMineLoot: (mineral: MineralType, amount: number, coins: number, isBoss: boolean) => void;
  onHeroGainExp: (heroId: string, exp: number) => void;
  onStageClear: () => void;
  megaBombReady: boolean;
  onUseMegaBomb: () => void;
}

const GRID_COLS = 11;
const GRID_ROWS = 8;

export const MineCanvas: React.FC<MineCanvasProps> = ({
  currentWorld,
  currentStage,
  activeHeroes,
  passiveBonuses,
  onMineLoot,
  onHeroGainExp,
  onStageClear,
  megaBombReady,
  onUseMegaBomb,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // References for mutable simulation state to keep 60fps decoupled from React state updates
  const rocksRef = useRef<MineRock[]>([]);
  const bombsRef = useRef<ActiveBomb[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const floatingTextsRef = useRef<FloatingText[]>([]);
  const screenShakeRef = useRef<number>(0);
  const heroesSimRef = useRef<Hero[]>([]);
  const activeWorldRef = useRef<GameWorld>(currentWorld);
  const currentStageRef = useRef<number>(currentStage);
  const passiveBonusesRef = useRef(passiveBonuses);
  const megaReadyRef = useRef<boolean>(megaBombReady);

  // Sync refs
  useEffect(() => {
    activeWorldRef.current = currentWorld;
  }, [currentWorld]);

  useEffect(() => {
    currentStageRef.current = currentStage;
    generateStageRocks(currentStage, currentWorld);
  }, [currentStage, currentWorld]);

  useEffect(() => {
    passiveBonusesRef.current = passiveBonuses;
  }, [passiveBonuses]);

  useEffect(() => {
    megaReadyRef.current = megaBombReady;
  }, [megaBombReady]);

  // Sync hero positions while keeping local animation coordinates
  useEffect(() => {
    const existing = new Map(heroesSimRef.current.map((h) => [h.id, h]));
    heroesSimRef.current = activeHeroes.map((h, idx) => {
      const prev = existing.get(h.id);
      if (prev) {
        return {
          ...h,
          x: prev.x,
          y: prev.y,
          targetX: prev.targetX,
          targetY: prev.targetY,
          lastPlantTime: prev.lastPlantTime,
          state: prev.state,
        };
      }
      return {
        ...h,
        x: 2 + (idx % 4) * 2,
        y: 2 + Math.floor(idx / 4) * 2,
        targetX: 2 + (idx % 4) * 2,
        targetY: 2 + Math.floor(idx / 4) * 2,
        lastPlantTime: 0,
        state: 'walking',
      };
    });
  }, [activeHeroes]);

  // Generate destructible minerals based on stage and world
  const generateStageRocks = useCallback((stage: number, world: GameWorld) => {
    const newRocks: MineRock[] = [];
    const isBossStage = stage % 20 === 0;

    const baseHp = 100 * Math.pow(1.08, stage - 1);

    for (let c = 1; c < GRID_COLS - 1; c++) {
      for (let r = 1; r < GRID_ROWS - 1; r++) {
        // Leave center open or boss monolith
        const isCenter = (c === 5 || c === 6) && (r === 3 || r === 4);

        if (isBossStage && isCenter) {
          if (c === 5 && r === 3) {
            newRocks.push({
              id: `boss_${stage}`,
              gridX: 5.5,
              gridY: 3.5,
              type: 'bossCore',
              maxHp: Math.floor(baseHp * 8),
              currentHp: Math.floor(baseHp * 8),
              dropValue: 250 * stage,
              color: '#f43f5e',
              crackLevel: 0,
              isBoss: true,
            });
          }
          continue;
        }

        // Random chance to spawn a rock (75% density)
        if (Math.random() < 0.72) {
          // Determine mineral type
          let minType: MineralType = 'coal';
          const roll = Math.random();
          if (world.id >= 4 && roll < 0.15) {
            minType = 'voidStone';
          } else if (world.id >= 3 && roll < 0.3) {
            minType = 'amethyst';
          } else if (world.id >= 2 && roll < 0.45) {
            minType = 'gold';
          } else if (roll < 0.6) {
            minType = 'iron';
          } else if (roll < 0.8) {
            minType = 'copper';
          } else {
            minType = 'coal';
          }

          let color = '#78716c';
          let hpMultiplier = 1;
          if (minType === 'copper') {
            color = '#fb923c';
            hpMultiplier = 1.3;
          } else if (minType === 'iron') {
            color = '#94a3b8';
            hpMultiplier = 1.8;
          } else if (minType === 'gold') {
            color = '#eab308';
            hpMultiplier = 2.5;
          } else if (minType === 'amethyst') {
            color = '#c084fc';
            hpMultiplier = 3.5;
          } else if (minType === 'voidStone') {
            color = '#a855f7';
            hpMultiplier = 5;
          }

          const rockHp = Math.floor(baseHp * hpMultiplier);
          newRocks.push({
            id: `rock_${c}_${r}_${stage}`,
            gridX: c,
            gridY: r,
            type: minType,
            maxHp: rockHp,
            currentHp: rockHp,
            dropValue: Math.floor(10 * stage * hpMultiplier),
            color,
            crackLevel: 0,
          });
        }
      }
    }

    rocksRef.current = newRocks;
  }, []);

  // Spawn manual seismic mega-bomb
  const spawnMegaBomb = useCallback((targetX: number, targetY: number) => {
    if (!megaReadyRef.current) return;
    onUseMegaBomb();

    soundEngine.playFuseSound();
    const blastDmgMultiplier = 1 + (passiveBonusesRef.current.blastDamagePct || 0) / 100;
    const avgHeroPower = heroesSimRef.current.reduce((acc, h) => acc + h.baseDamage, 50);

    bombsRef.current.push({
      id: `mega_${Date.now()}`,
      x: targetX,
      y: targetY,
      fuseTimer: 1.2,
      maxFuse: 1.2,
      radius: 4.5 + (passiveBonusesRef.current.blastRadiusBonus || 0),
      damage: Math.floor(avgHeroPower * 12 * blastDmgMultiplier),
      crit: true,
      element: 'void',
      isMega: true,
      color: '#ec4899',
    });

    floatingTextsRef.current.push({
      id: `txt_${Date.now()}`,
      x: targetX,
      y: targetY - 0.5,
      text: 'MEGA BOMBA!',
      color: '#f43f5e',
      life: 1.2,
      maxLife: 1.2,
      isCrit: true,
    });
  }, [onUseMegaBomb]);

  // Handle canvas click to detonate or plant manual mega bomb
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const clientX = e.clientX - rect.left;
    const clientY = e.clientY - rect.top;

    const tileW = canvas.width / GRID_COLS;
    const tileH = canvas.height / GRID_ROWS;

    const gridX = clientX / tileW;
    const gridY = clientY / tileH;

    if (megaReadyRef.current) {
      spawnMegaBomb(gridX, gridY);
    } else {
      // Manual tap drops mini dynamite charge
      soundEngine.playFuseSound();
      const avgHeroPower = heroesSimRef.current.reduce((acc, h) => acc + h.baseDamage, 40) / Math.max(1, heroesSimRef.current.length);
      const blastDmg = Math.floor(avgHeroPower * 1.5 * (1 + (passiveBonusesRef.current.blastDamagePct || 0) / 100));

      bombsRef.current.push({
        id: `tap_bomb_${Date.now()}_${Math.random()}`,
        x: gridX,
        y: gridY,
        fuseTimer: 1.0,
        maxFuse: 1.0,
        radius: 1.8 + (passiveBonusesRef.current.blastRadiusBonus || 0),
        damage: blastDmg,
        crit: Math.random() < (0.15 + (passiveBonusesRef.current.critChancePct || 0) / 100),
        element: 'fire',
        color: '#f97316',
      });
    }
  };

  // Keyboard shortcut listener for spacebar mega-bomb
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && megaReadyRef.current) {
        e.preventDefault();
        // Drop in middle of rocks
        spawnMegaBomb(GRID_COLS / 2, GRID_ROWS / 2);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [spawnMegaBomb]);

  // Main 60fps simulation loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let lastTime = performance.now();

    const loop = (currentTime: number) => {
      const rawDt = (currentTime - lastTime) / 1000;
      lastTime = currentTime;
      const dt = Math.min(rawDt, 0.05); // Clamp frame delta time

      // Canvas dimensions
      const width = canvas.width;
      const height = canvas.height;
      const tileW = width / GRID_COLS;
      const tileH = height / GRID_ROWS;

      // 1. UPDATE SIMULATION
      // A. Screen shake decay
      if (screenShakeRef.current > 0) {
        screenShakeRef.current = Math.max(0, screenShakeRef.current - dt * 25);
      }

      // B. Update heroes AI and bomb planting
      const speedMult = 1 + (passiveBonusesRef.current.squadSpeedPct || 0) / 100;
      heroesSimRef.current.forEach((hero) => {
        // Move towards target
        const dx = hero.targetX - hero.x;
        const dy = hero.targetY - hero.y;
        const dist = Math.hypot(dx, dy);

        if (dist > 0.08) {
          const moveDist = hero.moveSpeed * speedMult * dt;
          hero.x += (dx / dist) * Math.min(dist, moveDist);
          hero.y += (dy / dist) * Math.min(dist, moveDist);
        } else {
          // Arrived: Pick a new target near a rock or random tile
          if (rocksRef.current.length > 0 && Math.random() < 0.7) {
            const nearestRock = rocksRef.current[Math.floor(Math.random() * rocksRef.current.length)];
            // Stand slightly adjacent to rock
            const offsetX = (Math.random() - 0.5) * 1.5;
            const offsetY = (Math.random() - 0.5) * 1.5;
            hero.targetX = Math.max(0.8, Math.min(GRID_COLS - 1.8, nearestRock.gridX + offsetX));
            hero.targetY = Math.max(0.8, Math.min(GRID_ROWS - 1.8, nearestRock.gridY + offsetY));
          } else {
            hero.targetX = 1 + Math.random() * (GRID_COLS - 2);
            hero.targetY = 1 + Math.random() * (GRID_ROWS - 2);
          }

          // Auto-plant bomb if cooldown ready
          hero.lastPlantTime += dt;
          if (hero.lastPlantTime >= hero.plantCooldown) {
            hero.lastPlantTime = 0;
            soundEngine.playFuseSound();

            const isCrit = Math.random() < hero.critChance + (passiveBonusesRef.current.critChancePct || 0) / 100;
            const damageMult = (1 + (passiveBonusesRef.current.blastDamagePct || 0) / 100) * (isCrit ? 2.2 : 1.0);
            const calcDamage = Math.floor(hero.baseDamage * damageMult);

            let bombColor = '#ef4444';
            if (hero.element === 'frost') bombColor = '#38bdf8';
            if (hero.element === 'void') bombColor = '#a855f7';
            if (hero.element === 'fire') bombColor = '#f97316';

            bombsRef.current.push({
              id: `bomb_${Date.now()}_${Math.random()}`,
              x: hero.x,
              y: hero.y,
              fuseTimer: 1.5,
              maxFuse: 1.5,
              radius: hero.bombRadius + (passiveBonusesRef.current.blastRadiusBonus || 0),
              damage: calcDamage,
              crit: isCrit,
              element: hero.element,
              color: bombColor,
            });
          }
        }
      });

      // C. Update active bombs
      for (let i = bombsRef.current.length - 1; i >= 0; i--) {
        const bomb = bombsRef.current[i];
        bomb.fuseTimer -= dt;

        // Spark particles during fuse
        if (Math.random() < 0.6) {
          particlesRef.current.push({
            x: bomb.x * tileW,
            y: bomb.y * tileH - 12,
            vx: (Math.random() - 0.5) * 60,
            vy: -40 - Math.random() * 40,
            size: 2.5 + Math.random() * 2,
            color: '#fbbf24',
            life: 0.25,
            maxLife: 0.25,
            alpha: 1,
            type: 'spark',
          });
        }

        // Explode!
        if (bomb.fuseTimer <= 0) {
          soundEngine.playExplosion(bomb.crit, bomb.isMega);
          screenShakeRef.current = bomb.isMega ? 14 : bomb.crit ? 7 : 4;

          // Explosion blast ring particles
          const particleCount = bomb.isMega ? 40 : bomb.crit ? 24 : 14;
          for (let p = 0; p < particleCount; p++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 80 + Math.random() * (bomb.isMega ? 220 : 130);
            particlesRef.current.push({
              x: bomb.x * tileW,
              y: bomb.y * tileH,
              vx: Math.cos(angle) * speed,
              vy: Math.sin(angle) * speed,
              size: 3 + Math.random() * 4,
              color: bomb.color,
              life: 0.4 + Math.random() * 0.3,
              maxLife: 0.7,
              alpha: 1,
              type: 'spark',
            });
          }

          // Damage rocks in radius
          for (let r = rocksRef.current.length - 1; r >= 0; r--) {
            const rock = rocksRef.current[r];
            const dist = Math.hypot(rock.gridX - bomb.x, rock.gridY - bomb.y);

            if (dist <= bomb.radius) {
              soundEngine.playRockCrack();
              rock.currentHp -= bomb.damage;
              rock.crackLevel = Math.min(3, Math.floor(((rock.maxHp - rock.currentHp) / rock.maxHp) * 3));

              // Floating damage text
              floatingTextsRef.current.push({
                id: `dmg_${Date.now()}_${Math.random()}`,
                x: rock.gridX,
                y: rock.gridY - 0.2,
                text: `${bomb.damage}`,
                color: bomb.crit ? '#facc15' : '#ffffff',
                life: 0.8,
                maxLife: 0.8,
                isCrit: bomb.crit,
              });

              // If rock shattered
              if (rock.currentHp <= 0) {
                const isBoss = !!rock.isBoss;
                const yieldMultiplier = 1 + (passiveBonusesRef.current.oreYieldPct || 0) / 100;
                const coinsGained = Math.floor(rock.dropValue * yieldMultiplier);

                soundEngine.playGemPickup(rock.type === 'gold' ? 3 : rock.type === 'amethyst' ? 4 : 2);
                onMineLoot(rock.type, Math.floor(1 * yieldMultiplier), coinsGained, isBoss);

                // Give experience to squad
                heroesSimRef.current.forEach((h) => {
                  onHeroGainExp(h.id, Math.floor(15 * (isBoss ? 8 : 1)));
                });

                // Spawn floating loot particles
                for (let g = 0; g < (isBoss ? 20 : 6); g++) {
                  particlesRef.current.push({
                    x: rock.gridX * tileW,
                    y: rock.gridY * tileH,
                    vx: (Math.random() - 0.5) * 120,
                    vy: -100 - Math.random() * 80,
                    size: 4 + Math.random() * 3,
                    color: rock.color,
                    life: 0.7,
                    maxLife: 0.7,
                    alpha: 1,
                    type: 'lootGem',
                  });
                }

                rocksRef.current.splice(r, 1);
              }
            }
          }

          bombsRef.current.splice(i, 1);
        }
      }

      // Check if all rocks cleared -> advance stage
      if (rocksRef.current.length === 0) {
        onStageClear();
      }

      // D. Update particles
      for (let i = particlesRef.current.length - 1; i >= 0; i--) {
        const p = particlesRef.current[i];
        p.life -= dt;
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.alpha = Math.max(0, p.life / p.maxLife);
        if (p.type === 'lootGem') {
          p.vy += 240 * dt; // Gravity
        }
        if (p.life <= 0) {
          particlesRef.current.splice(i, 1);
        }
      }

      // E. Update floating damage texts
      for (let i = floatingTextsRef.current.length - 1; i >= 0; i--) {
        const t = floatingTextsRef.current[i];
        t.life -= dt;
        t.y -= 0.6 * dt; // drift upward
        if (t.life <= 0) {
          floatingTextsRef.current.splice(i, 1);
        }
      }

      // 2. RENDER VIEWPORT
      ctx.save();
      // Apply screen shake
      if (screenShakeRef.current > 0) {
        const shakeX = (Math.random() - 0.5) * screenShakeRef.current;
        const shakeY = (Math.random() - 0.5) * screenShakeRef.current;
        ctx.translate(shakeX, shakeY);
      }

      // A. Mine Cavern Floor
      ctx.fillStyle = activeWorldRef.current.groundHex || '#1e242d';
      ctx.fillRect(0, 0, width, height);

      // Grid tile lines
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.18)';
      ctx.lineWidth = 1;
      for (let c = 0; c <= GRID_COLS; c++) {
        ctx.beginPath();
        ctx.moveTo(c * tileW, 0);
        ctx.lineTo(c * tileW, height);
        ctx.stroke();
      }
      for (let r = 0; r <= GRID_ROWS; r++) {
        ctx.beginPath();
        ctx.moveTo(0, r * tileH);
        ctx.lineTo(width, r * tileH);
        ctx.stroke();
      }

      // B. Render Destructible Rocks
      rocksRef.current.forEach((rock) => {
        const rx = rock.gridX * tileW;
        const ry = rock.gridY * tileH;
        const pad = rock.isBoss ? 8 : 4;
        const rw = (rock.isBoss ? tileW * 2 : tileW) - pad * 2;
        const rh = (rock.isBoss ? tileH * 2 : tileH) - pad * 2;

        // Rock body
        ctx.fillStyle = rock.color;
        ctx.beginPath();
        ctx.roundRect(rx + pad, ry + pad, rw, rh, rock.isBoss ? 12 : 6);
        ctx.fill();

        // 3D Bevel Edge
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Cracks
        if (rock.crackLevel > 0) {
          ctx.strokeStyle = '#0b0e14';
          ctx.lineWidth = rock.crackLevel * 1.5;
          ctx.beginPath();
          ctx.moveTo(rx + pad + rw * 0.2, ry + pad + rh * 0.2);
          ctx.lineTo(rx + pad + rw * 0.5, ry + pad + rh * 0.5);
          ctx.lineTo(rx + pad + rw * 0.8, ry + pad + rh * 0.3);
          if (rock.crackLevel >= 2) {
            ctx.moveTo(rx + pad + rw * 0.5, ry + pad + rh * 0.5);
            ctx.lineTo(rx + pad + rw * 0.4, ry + pad + rh * 0.8);
          }
          ctx.stroke();
        }

        // Mineral Specular Glint
        ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.beginPath();
        ctx.arc(rx + pad + rw * 0.3, ry + pad + rh * 0.3, rock.isBoss ? 6 : 3, 0, Math.PI * 2);
        ctx.fill();

        // Health bar
        const hpPct = Math.max(0, rock.currentHp / rock.maxHp);
        const barW = rw;
        const barH = rock.isBoss ? 8 : 4;
        ctx.fillStyle = 'rgba(15, 23, 42, 0.8)';
        ctx.fillRect(rx + pad, ry + pad + rh - barH, barW, barH);
        ctx.fillStyle = hpPct > 0.5 ? '#10b981' : hpPct > 0.2 ? '#f59e0b' : '#ef4444';
        ctx.fillRect(rx + pad, ry + pad + rh - barH, barW * hpPct, barH);

        // Boss Tag
        if (rock.isBoss) {
          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 12px "Outfit", sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText('MONÓLITO CHEFE', rx + pad + rw / 2, ry + pad + rh / 2);
        }
      });

      // C. Render Active Bombs
      bombsRef.current.forEach((bomb) => {
        const bx = bomb.x * tileW;
        const by = bomb.y * tileH;
        const bombSize = bomb.isMega ? 22 : 14;

        // Blast radius indicator circle
        const radiusPx = bomb.radius * tileW;
        ctx.strokeStyle = bomb.color + '44';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(bx, by, radiusPx, 0, Math.PI * 2);
        ctx.stroke();

        // Bomb shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
        ctx.beginPath();
        ctx.ellipse(bx, by + 6, bombSize, bombSize * 0.5, 0, 0, Math.PI * 2);
        ctx.fill();

        // Bomb spherical body
        const grad = ctx.createRadialGradient(bx - 3, by - 3, 2, bx, by, bombSize);
        grad.addColorStop(0, '#475569');
        grad.addColorStop(1, '#0f172a');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(bx, by, bombSize, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = bomb.color;
        ctx.lineWidth = 2;
        ctx.stroke();

        // Bomb cap & burning fuse
        ctx.fillStyle = '#78716c';
        ctx.fillRect(bx - 3, by - bombSize - 4, 6, 4);

        // Glowing fuse spark
        const fusePct = bomb.fuseTimer / bomb.maxFuse;
        ctx.fillStyle = '#f59e0b';
        ctx.beginPath();
        ctx.arc(bx, by - bombSize - 6, 3 + Math.sin(currentTime * 0.03) * 1.5, 0, Math.PI * 2);
        ctx.fill();

        // Fuse ring countdown
        ctx.strokeStyle = '#ef4444';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.arc(bx, by, bombSize + 4, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * fusePct);
        ctx.stroke();
      });

      // D. Render Squad Heroes
      heroesSimRef.current.forEach((hero) => {
        const hx = hero.x * tileW;
        const hy = hero.y * tileH;
        const heroSize = 13;

        // Dynamic light ring under feet
        const lightGrad = ctx.createRadialGradient(hx, hy, 4, hx, hy, 45);
        lightGrad.addColorStop(0, 'rgba(251, 191, 36, 0.18)');
        lightGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = lightGrad;
        ctx.beginPath();
        ctx.arc(hx, hy, 45, 0, Math.PI * 2);
        ctx.fill();

        // Shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
        ctx.beginPath();
        ctx.ellipse(hx, hy + heroSize - 2, heroSize * 0.9, heroSize * 0.4, 0, 0, Math.PI * 2);
        ctx.fill();

        // Body suit (Role specific colors)
        let roleColor = '#ef4444'; // Striker
        if (hero.role === 'support') roleColor = '#10b981';
        if (hero.role === 'harvester') roleColor = '#eab308';
        if (hero.role === 'specialist') roleColor = '#a855f7';

        // Bomber torso
        ctx.fillStyle = roleColor;
        ctx.beginPath();
        ctx.roundRect(hx - 8, hy - 4, 16, 14, 4);
        ctx.fill();

        // Bomber helmet / head
        ctx.fillStyle = '#f8fafc';
        ctx.beginPath();
        ctx.arc(hx, hy - 8, 8, 0, Math.PI * 2);
        ctx.fill();

        // Visor / Goggles
        ctx.fillStyle = '#0284c7';
        ctx.fillRect(hx - 5, hy - 10, 10, 4);

        // Name tag & Level
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 9px "Plus Jakarta Sans", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(`${hero.name} (Lv.${hero.level})`, hx, hy - 20);
      });

      // E. Render Particles
      particlesRef.current.forEach((p) => {
        ctx.save();
        ctx.globalAlpha = p.alpha;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });

      // F. Render Floating Damage Numbers
      floatingTextsRef.current.forEach((t) => {
        const tx = t.x * tileW;
        const ty = t.y * tileH;
        ctx.save();
        ctx.fillStyle = t.color;
        ctx.font = t.isCrit ? '900 15px "Outfit", sans-serif' : '700 12px "Outfit", sans-serif';
        ctx.textAlign = 'center';
        ctx.shadowColor = 'rgba(0,0,0,0.8)';
        ctx.shadowBlur = 4;
        ctx.fillText(t.text, tx, ty);
        ctx.restore();
      });

      ctx.restore();
      animationFrameId = requestAnimationFrame(loop);
    };

    animationFrameId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animationFrameId);
  }, [onMineLoot, onHeroGainExp, onStageClear]);

  return (
    <div className="relative w-full h-full flex items-center justify-center overflow-hidden bg-[#0c0f14] select-none">
      <canvas
        ref={canvasRef}
        width={990}
        height={640}
        onClick={handleCanvasClick}
        className="w-full h-full max-h-[85vh] object-contain cursor-crosshair border border-slate-800 shadow-2xl rounded-lg bg-[#14171d]"
      />

      {/* Touch / Click Hint Overlay */}
      <div className="absolute bottom-2 left-4 pointer-events-none text-xs text-slate-400 font-mono tracking-tight bg-slate-950/75 px-3 py-1 rounded border border-slate-800 backdrop-blur-xs">
        Clique na mina para detonar dinamite manual · Espaço Mega-Bomba
      </div>
    </div>
  );
};
