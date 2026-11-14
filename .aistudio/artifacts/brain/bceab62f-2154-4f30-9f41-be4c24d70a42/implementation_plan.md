# Bomb Farm - Idle Mining RPG & Squad Detonator

Bomb Farm is a high-octane idle mining RPG where automated bomber squads blast mineral blocks, unearth rare ores and sealed relics, forge gear up to +15, advance across a massive Path of Exile-inspired passive skill web, and trade items in a simulated Steam Community Market.

---

### User Review & Critical Decisions

> [!IMPORTANT]
> The following directions were confirmed during interactive clarification and form the foundation of the architecture:

- **Confirmed Visual Direction**: Top-down 2D pixel-art grid rendering on a high-performance 60fps HTML5 Canvas with dynamic light blooms, screen shake, floating numeric damage/loot popups, and layered blast particles.
- **Confirmed Language & UI**: Portuguese (Brasil) as primary interface with full English localization toggle, styled with dark industrial Steam-like overlays, low-occlusion perimeter HUD, and custom SVG iconography.
- **Confirmed Gameplay Pacing**: Hybrid idle and active loop—autonomous bomber squad AI auto-targets ore clusters, while the player actively triggers manual seismic bombs, combo detonators, squad swaps (Teams A, B, C), and instant abilities.

---

### 1. Overview & Core Concept

- **What It Does**: Simulates deep underground mining across 5 worlds and 600 stages. Squad members (Strikers, Harvesters, Supports, Specialists) pathfind and plant bombs with distinct blast radii, fuse timers, and damage archetypes. Players collect raw ores (Coal, Copper, Iron, Gold, Amethyst, Void Shards), discover sealed drops, forge equipment with random affixes, unlock nodes in an expansive passive constellation tree, and trade with simulated players on the Steam Market.
- **Target Audience / Persona**: Fans of idle incrementals (e.g. *Cookie Clicker*, *Melvor Idle*, *Bombcrypto*, *Path of Exile* skill trees) who love satisfying explosion physics, incremental growth, loot hunting, and economic progression.
- **Key Value**: Delivers the tactile joy of chain explosions and tactile blasting paired with deep mathematical RPG progression (forge chances, duplicate fusing, role synergy, market arbitrage).

---

### 2. User Experience & Visual Design

#### Key User Flows
1. **Game Shell & Title Screen**:
   - Atmospheric subterranean cavern showcase with flickering torch glow and floating embers.
   - Bespoke inline SVG Bomb Farm logo, "Jogar / Start" primary CTA (`Enter` / `Space`), and control bar (`WASD / Setas Move · Espaço Detonar · 1-3 Trocar Esquadrão · Esc Pausa`).
2. **Mine Operation (Active & Idle View)**:
   - Top-down canvas occupying over 85% of viewport width.
   - Bombers roam the rock grid, automatically dropping bombs.
   - Rocks crack with dynamic hit flashes, crumbling into gems and ores that magnetize toward the squad.
   - Manual detonator button & right-click/space action to drop Mega-Bombs or cluster mines.
   - Squad Switcher bar (Team Alpha, Beta, Gamma) allowing stamina/role rotation.
3. **Steam Overlay Modals (Zero Occlusion of Main Viewport when closed)**:
   - **Esquadrão / Squad**: Inspect heroes, assign roles (Atacante, Suporte, Coletor, Especialista), level up skills (1 to 10), and equip weapons/armor.
   - **Forja / Forge**: Upgrade items from +0 to +15 with forge success rates, luck charms, duplicate fusion for star stars (★1 to ★5), and affix rerolling.
   - **Árvore de Talentos / Passive Skill Tree**: PoE-inspired multi-cluster passive tree with zoom/pan, branching nodes for Blast Radius, Critical Blast, Drop Rarity, Squad Speed, and Elemental Fire/Frost/Void Bombs.
   - **Mercado Steam / Market**: Live simulated community market with buy/sell listings, price history graph, order books, and price fluctuation engine.
   - **Mundos & Fases / World Map**: 5 distinct biomes (Minas de Carvão, Caverna de Cristais, Profundezas de Gelo, Núcleo Vulcânico, Abismo Cósmico) with boss monoliths every 20 stages.

#### Visual Identity & Theme
- **Aesthetic Direction**: Subterranean industrial pixel-art with crisp modern UI overlays reminiscent of Steam Deck & tactical PC RPGs.
- **Color Palette & Mood**:
  - Background: Deep mine slate & obsidian (`#0c0f14`, `#161b22`).
  - Structural Panels: Coal charcoal (`#1f242d`) with hairline borders (`#2d3544`).
  - Blast & Accent: Molten sulfur amber (`#f59e0b`), plasma cyan (`#06b6d4`), critical ruby (`#ef4444`), legendary violet (`#a855f7`).
- **Typography & Hierarchy**:
  - Primary Display: *Outfit* / *Plus Jakarta Sans* bold title lockups.
  - Telemetry & Data: `font-mono tabular-nums` for rock health, damage floats, ore counts, and coin balances.
- **Audio Feedback (Web Audio API Synthesizer)**:
  - Procedural 8-bit/16-bit sound generator: fuse sizzle, blast thuds, rock shattering crumbles, gem pickup pings, forge clinks, and level-up fanfares (with a 1-click global mute toggle).

---

### 3. Key Product Decisions & Trade-Offs

- **Decision 1: Canvas Game Engine vs DOM Rendering**
  - *Chosen Approach*: Isolated HTML5 2D Canvas with requestAnimationFrame 60fps loop, clamped delta time (`Math.min(dt, 0.05)`), and particle pooling.
  - *Why*: Smooth rendering of 50+ concurrent explosions, 200+ particle shards, animated bombers, and floating damage numbers without React DOM re-render overhead.
- **Decision 2: Progression & Offline Simulation**
  - *Chosen Approach*: Deterministic offline progress calculation via `localStorage` timestamp comparisons upon load (up to 12 hours of idle offline mining gains).
  - *Why*: Delivers a genuine idle RPG loop without requiring an external backend server.
- **Decision 3: Simulated Steam Market Economy**
  - *Chosen Approach*: Algorithmic market engine with dynamic bid/ask order book, fluctuating commodity rates (Coal, Gold, Rare Blueprints, Legendary Cores), and simulated player purchases.
  - *Why*: Fulfills the Steam page feature promise ("negocie itens com outros jogadores no Mercado Steam") offline and instantly responsive.

---

### 4. Technical Architecture & Data Strategy

```
┌────────────────────────────────────────────────────────┐
│                      Game Shell                        │
│  (Title Screen ──▶ Playing ──▶ Pause / World Victory)  │
└───────────────────────────┬────────────────────────────┘
                            │
        ┌───────────────────┴───────────────────┐
        ▼                                       ▼
┌───────────────────────────────┐   ┌───────────────────────────────┐
│       Canvas Viewport         │   │      React UI Overlays        │
│  • 60fps Game Loop            │   │  • HUD (Ores, Stage, Health)  │
│  • Grid Physics & Rocks       │   │  • Squad Manager (3 Teams)    │
│  • Bomber AI Pathfinding      │   │  • PoE Passive Skill Tree     │
│  • Web Audio Procedural Synth │   │  • Forge (+0 to +15)          │
│  • Particle & Lighting Engine │   │  • Simulated Steam Market     │
└───────────────┬───────────────┘   └───────────────┬───────────────┘
                │                                   │
                └───────────────────┬───────────────┘
                                    ▼
                ┌───────────────────────────────────────┐
                │          Game State Manager           │
                │  • Inventory, Currencies & Equipment  │
                │  • Skill Tree Allocations             │
                │  • World & Stage Progress (1-600)     │
                │  • LocalStorage Auto-Save & Idle Tick │
                └───────────────────────────────────────┘
```

#### Key State Entities
- **Squad & Heroes**: 12 collectible bombers across 4 archetypes (Striker, Support, Harvester, Specialist), with level, experience, 20 upgradable skills (1-10), and equipment slots (Weapon, Armor, Charm).
- **Mine Grid**: Multi-layer procedural destructible grid (Normal stone, Rich copper, Gold veins, Obsidian bedrock, Boss monoliths) with health and blast radius interactions.
- **Forge System**: +0 to +15 upgrade roll tables with destruction protection, socket fusing for stars, and rollable affix stats (+Explosion Range, +Drop Rate, +Bomb Damage).
- **Skill Tree**: 40+ interconnected passive nodes granting team-wide enhancements.
- **Market System**: 8 tradeable items with moving price averages, market orders, and simulated NPC transactions.
