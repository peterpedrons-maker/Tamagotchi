import Phaser from "phaser";

/**
 * Pseudo-3D lane runner: everything is 2D, but obstacles/decor scale and
 * converge toward a horizon point as they approach, which reads as a
 * downhill 3rd-person track (Subway-Surfers/Sled-Surfers style) without an
 * actual 3D engine.
 */

const LANES = [-1, 0, 1] as const;
type Lane = (typeof LANES)[number];

const PLAYER_T = 0.86;
const HORIZON_RATIO = 0.3;
const BASE_RATIO = 0.94;
const TOP_HALF_WIDTH = 6;
const BASE_HALF_WIDTH = 150;
const GROUND_OVERHANG = 90;

interface Biome {
  name: string;
  skyTop: number;
  skyBottom: number;
  ground: number;
  track: number;
  decor: number;
}

const BIOMES: Biome[] = [
  { name: "Floresta", skyTop: 0x1b2a4a, skyBottom: 0x4a6fa5, ground: 0x24522f, track: 0x3a3226, decor: 0x1d3d24 },
  { name: "Caverna de cristal", skyTop: 0x120a24, skyBottom: 0x3a1d5c, ground: 0x241238, track: 0x2c1840, decor: 0x7b4fd6 },
  { name: "Deserto", skyTop: 0xff8a3d, skyBottom: 0xffd27a, ground: 0xd99a4e, track: 0xc4813a, decor: 0x8a5a2a },
  { name: "Geleira", skyTop: 0x0b2540, skyBottom: 0x8fd7ea, ground: 0xdff3fb, track: 0xb9e3f0, decor: 0x6fb9d6 },
];
const BIOME_DISTANCE = 450;

type EntityKind = "obstacle" | "coin" | "decor";
interface Entity {
  kind: EntityKind;
  t: number;
  lane: Lane;
  side?: -1 | 1;
  passed?: boolean;
}

export class RunnerScene extends Phaser.Scene {
  private skyGfx!: Phaser.GameObjects.Graphics;
  private worldGfx!: Phaser.GameObjects.Graphics;
  private hudDistance!: Phaser.GameObjects.Text;
  private hudCoins!: Phaser.GameObjects.Text;
  private hint!: Phaser.GameObjects.Text;

  private laneIndex: Lane = 0;
  private playerX = 0;
  private playerTilt = 0;

  private entities: Entity[] = [];
  private nextObstacleIn = 1;
  private nextDecorIn = 0.3;
  private dashOffset = 0;

  private distance = 0;
  private coins = 0;
  private elapsed = 0;
  private speed = 0.24;
  private biomeIndex = -1;
  private gameOver = false;

  private onGameOver?: (distance: number) => void;

  constructor() {
    super("runner");
  }

  init(data: { onGameOver?: (distance: number) => void }) {
    this.onGameOver = data.onGameOver;
  }

  create(): void {
    this.skyGfx = this.add.graphics();
    this.worldGfx = this.add.graphics();

    this.hudDistance = this.add
      .text(18, 14, "0 m", { fontFamily: "system-ui, sans-serif", fontSize: "26px", color: "#f3f7ff", fontStyle: "800" })
      .setShadow(0, 2, "#000", 4, true, true)
      .setDepth(10);
    this.hudCoins = this.add
      .text(18, 48, "0 moedas", { fontFamily: "system-ui, sans-serif", fontSize: "14px", color: "#ffd76a", fontStyle: "700" })
      .setShadow(0, 1, "#000", 3, true, true)
      .setDepth(10);
    this.hint = this.add
      .text(this.scale.width / 2, this.scale.height - 22, "toque na esquerda / direita para desviar", {
        fontFamily: "system-ui, sans-serif",
        fontSize: "13px",
        color: "#cdd8ee",
      })
      .setOrigin(0.5, 1)
      .setAlpha(0.8)
      .setDepth(10);

    this.input.on("pointerdown", (p: Phaser.Input.Pointer) => this.handleTap(p.x));
    this.input.keyboard?.on("keydown-LEFT", () => this.changeLane(-1));
    this.input.keyboard?.on("keydown-RIGHT", () => this.changeLane(1));
    this.input.keyboard?.on("keydown-A", () => this.changeLane(-1));
    this.input.keyboard?.on("keydown-D", () => this.changeLane(1));

    this.startRun();
  }

  startRun(): void {
    this.laneIndex = 0;
    this.playerX = this.laneX(0, PLAYER_T);
    this.playerTilt = 0;
    this.entities = [];
    this.nextObstacleIn = 1;
    this.nextDecorIn = 0.2;
    this.dashOffset = 0;
    this.distance = 0;
    this.coins = 0;
    this.elapsed = 0;
    this.speed = 0.24;
    this.biomeIndex = -1;
    this.gameOver = false;
    this.applyBiome(0);
    this.hint.setAlpha(0.8);
  }

  private handleTap(x: number): void {
    if (this.gameOver) return;
    this.changeLane(x < this.scale.width / 2 ? -1 : 1);
  }

  private changeLane(dir: -1 | 1): void {
    if (this.gameOver) return;
    const idx = LANES.indexOf(this.laneIndex) + dir;
    this.laneIndex = LANES[Phaser.Math.Clamp(idx, 0, LANES.length - 1)];
    this.playerTilt = dir * 12;
    if (this.hint.alpha > 0) this.tweens.add({ targets: this.hint, alpha: 0, duration: 400 });
  }

  private horizonY(): number {
    return this.scale.height * HORIZON_RATIO;
  }
  private baseY(): number {
    return this.scale.height * BASE_RATIO;
  }
  private ease(t: number): number {
    return Math.pow(Phaser.Math.Clamp(t, 0, 1.1), 1.6);
  }
  private screenY(t: number): number {
    return Phaser.Math.Linear(this.horizonY(), this.baseY(), this.ease(t));
  }
  private halfWidth(t: number): number {
    return Phaser.Math.Linear(TOP_HALF_WIDTH, BASE_HALF_WIDTH, this.ease(t));
  }
  private laneX(lane: number, t: number): number {
    return this.scale.width / 2 + lane * this.halfWidth(t);
  }
  private scaleAt(t: number): number {
    return Phaser.Math.Linear(0.12, 1, this.ease(t));
  }

  private applyBiome(index: number): void {
    const biome = BIOMES[index % BIOMES.length];
    this.biomeIndex = index;
    const w = this.scale.width;
    this.skyGfx.clear();
    this.skyGfx.fillGradientStyle(biome.skyTop, biome.skyTop, biome.skyBottom, biome.skyBottom, 1);
    this.skyGfx.fillRect(0, 0, w, this.horizonY() + 2);
  }

  private currentBiome(): Biome {
    return BIOMES[Math.max(this.biomeIndex, 0) % BIOMES.length];
  }

  update(_time: number, deltaMs: number): void {
    if (this.gameOver) return;
    const dt = Math.min(deltaMs / 1000, 0.05);
    this.elapsed += dt;

    this.speed = Math.min(0.5, 0.24 + this.elapsed * 0.006);
    const metersPerSec = Math.min(24, 9 + this.elapsed * 0.35);
    this.distance += metersPerSec * dt;
    this.dashOffset = (this.dashOffset + this.speed * dt * 3) % 1;

    const biomeIdx = Math.floor(this.distance / BIOME_DISTANCE);
    if (biomeIdx !== this.biomeIndex) this.applyBiome(biomeIdx);

    const targetX = this.laneX(this.laneIndex, PLAYER_T);
    this.playerX = Phaser.Math.Linear(this.playerX, targetX, Math.min(1, dt * 12));
    this.playerTilt = Phaser.Math.Linear(this.playerTilt, 0, Math.min(1, dt * 6));

    this.nextObstacleIn -= dt;
    if (this.nextObstacleIn <= 0) {
      this.spawnObstacle();
      const difficulty = Math.min(0.55, this.elapsed * 0.01);
      this.nextObstacleIn = Phaser.Math.FloatBetween(0.75, 1.3) - difficulty;
      this.nextObstacleIn = Math.max(0.5, this.nextObstacleIn);
    }
    this.nextDecorIn -= dt;
    if (this.nextDecorIn <= 0) {
      this.spawnDecor();
      this.nextDecorIn = Phaser.Math.FloatBetween(0.22, 0.4);
    }
    if (Phaser.Math.Between(0, 100) === 0) this.spawnCoinRun();

    for (const e of this.entities) e.t += this.speed * dt;

    for (const e of this.entities) {
      if (e.kind === "obstacle" && !e.passed && e.t > PLAYER_T - 0.045 && e.t < PLAYER_T + 0.045) {
        e.passed = true;
        if (e.lane === this.laneIndex) {
          this.triggerGameOver();
          return;
        }
      }
      if (e.kind === "coin" && !e.passed && e.t > PLAYER_T - 0.05 && e.t < PLAYER_T + 0.05 && e.lane === this.laneIndex) {
        e.passed = true;
        this.coins += 1;
      }
    }
    this.entities = this.entities.filter((e) => e.t <= 1.1 && !(e.kind === "coin" && e.passed));

    this.draw();
    this.hudDistance.setText(`${Math.floor(this.distance)} m`);
    this.hudCoins.setText(`${this.coins} moedas`);
  }

  private spawnObstacle(): void {
    const wide = this.elapsed > 18 && Math.random() < 0.4;
    const blocked = new Set<Lane>();
    if (wide) {
      const pick = Phaser.Math.RND.pick([
        [-1, 0],
        [0, 1],
        [-1, 1],
      ]) as Lane[];
      pick.forEach((l) => blocked.add(l));
    } else {
      blocked.add(Phaser.Math.RND.pick(LANES as unknown as Lane[]));
    }
    for (const lane of blocked) this.entities.push({ kind: "obstacle", t: 0, lane });
  }

  private spawnCoinRun(): void {
    const lane = Phaser.Math.RND.pick(LANES as unknown as Lane[]);
    for (let i = 0; i < 4; i++) {
      this.entities.push({ kind: "coin", t: -i * 0.06, lane });
    }
  }

  private spawnDecor(): void {
    const side = Math.random() < 0.5 ? -1 : 1;
    this.entities.push({ kind: "decor", t: 0, lane: 0, side: side as -1 | 1 });
  }

  private triggerGameOver(): void {
    this.gameOver = true;
    this.cameras.main.shake(180, 0.01);
    this.cameras.main.flash(120, 255, 80, 80);
    this.onGameOver?.(Math.floor(this.distance));
  }

  private draw(): void {
    const g = this.worldGfx;
    const w = this.scale.width;
    const biome = this.currentBiome();
    g.clear();

    // ground
    const hy = this.horizonY();
    const by = this.baseY();
    g.fillStyle(biome.ground, 1);
    g.beginPath();
    g.moveTo(w / 2 - TOP_HALF_WIDTH - 20, hy);
    g.lineTo(w / 2 + TOP_HALF_WIDTH + 20, hy);
    g.lineTo(w / 2 + BASE_HALF_WIDTH + GROUND_OVERHANG, this.scale.height);
    g.lineTo(w / 2 - BASE_HALF_WIDTH - GROUND_OVERHANG, this.scale.height);
    g.closePath();
    g.fillPath();

    // track
    g.fillStyle(biome.track, 1);
    g.beginPath();
    g.moveTo(w / 2 - TOP_HALF_WIDTH, hy);
    g.lineTo(w / 2 + TOP_HALF_WIDTH, hy);
    g.lineTo(w / 2 + BASE_HALF_WIDTH, by);
    g.lineTo(w / 2 - BASE_HALF_WIDTH, by);
    g.closePath();
    g.fillPath();

    // lane divider dashes
    g.fillStyle(0xffffff, 0.35);
    for (const laneEdge of [-0.5, 0.5]) {
      const steps = 14;
      for (let i = 0; i < steps; i++) {
        let t = i / steps + this.dashOffset / steps;
        t = t % 1;
        if (t % (2 / steps) > 1 / steps) continue;
        const x = this.laneX(laneEdge * 2, t);
        const y = this.screenY(t);
        const s = this.scaleAt(t);
        g.fillRect(x - 1.5 * s, y, 3 * s, 14 * s);
      }
    }

    const ordered = [...this.entities].sort((a, b) => a.t - b.t);
    for (const e of ordered) {
      if (e.t < -0.05 || e.t > 1.08) continue;
      const y = this.screenY(Math.max(e.t, 0));
      const s = this.scaleAt(Math.max(e.t, 0));
      if (e.kind === "decor") {
        const x = this.laneX((BASE_HALF_WIDTH + GROUND_OVERHANG * 0.55) / this.halfWidth(1) * (e.side ?? 1), Math.max(e.t, 0));
        g.fillStyle(biome.decor, 1);
        g.fillTriangle(x, y - 26 * s, x - 14 * s, y + 6 * s, x + 14 * s, y + 6 * s);
        g.fillStyle(0x2b1d12, 1);
        g.fillRect(x - 3 * s, y + 4 * s, 6 * s, 10 * s);
      } else if (e.kind === "coin") {
        const x = this.laneX(e.lane, e.t);
        g.fillStyle(0xffd23f, 1);
        g.fillCircle(x, y - 10 * s, 8 * s);
        g.lineStyle(2 * s, 0xb8860b, 1);
        g.strokeCircle(x, y - 10 * s, 8 * s);
      } else {
        const x = this.laneX(e.lane, e.t);
        const w2 = this.halfWidth(e.t) * 0.62;
        g.fillStyle(0xd23c3c, 1);
        g.fillRoundedRect(x - w2, y - 30 * s, w2 * 2, 30 * s, 6 * s);
        g.fillStyle(0xffe27a, 1);
        g.fillRect(x - w2 * 0.7, y - 22 * s, w2 * 1.4, 5 * s);
      }
    }

    // player
    const px = this.playerX;
    const py = this.screenY(PLAYER_T);
    const ps = this.scaleAt(PLAYER_T);
    g.save();
    g.translateCanvas(px, py);
    g.rotateCanvas(Phaser.Math.DegToRad(this.playerTilt));
    g.fillStyle(0x1c1c22, 1);
    g.fillEllipse(0, 4 * ps, 46 * ps, 16 * ps);
    g.fillStyle(0x2f7cff, 1);
    g.fillRoundedRect(-16 * ps, -34 * ps, 32 * ps, 34 * ps, 10 * ps);
    g.fillStyle(0xffd7b3, 1);
    g.fillCircle(0, -40 * ps, 12 * ps);
    g.restore();
  }
}
