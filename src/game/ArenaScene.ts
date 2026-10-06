import Phaser from "phaser";
import { Sfx } from "./sfx";

/**
 * Pinball-roguelike core loop: no gravity, no friction at all — the
 * launcher is a slingshot (pull back to charge power, release to fire)
 * and the ball keeps that exact speed the whole shot, bouncing
 * perfectly elastically. No gradual decay-to-a-crawl: a shot either
 * stays fast the entire time, or it's over (MAX_SHOT_MS cuts it off
 * cleanly). Score comes from hits; the run ends when you're out of shots.
 *
 * Still no external art — this pass ("revamp") layers juice on top of
 * the procedural look: combo-scaled particles/shake/haptics, a rising-
 * pitch hit sound (more dopamine per streak), and a twinkling backdrop.
 */

const WIDTH = 480;
const HEIGHT = 1120;
const LAUNCHER = { x: WIDTH / 2, y: HEIGHT - 60 };
const BALL_RADIUS = 10;
// How far in from the canvas edge the ball is actually stopped — must match
// where the frame is drawn (buildBackdrop), or the ball visibly pokes past
// the border before the safety clamp catches it.
const ARENA_MARGIN = 18;
const START_BALLS = 5;
const MIN_DRAG = 20;
const MAX_DRAG = 160;
const MIN_SPEED = 26;
const MAX_SPEED = 70;
const MAX_SHOT_MS = 9000;
const HIT_SCORE = 10;
const DESTROY_BONUS = 40;
const CLEAR_BONUS = 300;

const PEG_TIERS = [
  { key: "peg-1", core: 0xffe14d, glow: 0xfff3b0 }, // low hp, about to break
  { key: "peg-2", core: 0xff8a1e, glow: 0xffc27a },
  { key: "peg-3", core: 0xff2d75, glow: 0xff8ab3 }, // full/high hp
] as const;
const BALL_CORE = 0x6ee7ff;
const BALL_GLOW = 0x38bdf8;
const LAUNCHER_CORE = 0xffd76a;
const LAUNCHER_GLOW = 0xffecb3;
const ACCENT = 0x6ee7ff;

interface Peg {
  body: MatterJS.BodyType;
  gfx: Phaser.GameObjects.Image;
  hp: number;
  maxHp: number;
  radius: number;
}

export class ArenaScene extends Phaser.Scene {
  private pegs: Peg[] = [];
  private ball: MatterJS.BodyType | null = null;
  private ballGfx!: Phaser.GameObjects.Image;
  private ballTrail!: Phaser.GameObjects.Particles.ParticleEmitter;
  private hitSparks!: Phaser.GameObjects.Particles.ParticleEmitter;
  private aimLine!: Phaser.GameObjects.Graphics;
  private aimReticle!: Phaser.GameObjects.Arc;

  private aiming = false;
  private shotElapsedMs = 0;
  private sfx = new Sfx();

  private ballsLeft = START_BALLS;
  private score = 0;
  private hudScore!: Phaser.GameObjects.Text;
  private hudBallIcons: Phaser.GameObjects.Image[] = [];
  private hudHits!: Phaser.GameObjects.Text;
  private hudMessage!: Phaser.GameObjects.Text;
  private hudMessagePanel!: Phaser.GameObjects.Graphics;
  private shotHits = 0;
  private gameEnded = false;

  constructor() {
    super("arena");
  }

  create(): void {
    this.pegs = [];
    this.ball = null;
    this.aiming = false;
    this.shotElapsedMs = 0;
    this.ballsLeft = START_BALLS;
    this.score = 0;
    this.shotHits = 0;
    this.gameEnded = false;
    this.hudBallIcons = [];

    this.bakeTextures();

    this.matter.world.setBounds(0, 0, WIDTH, HEIGHT, ARENA_MARGIN);

    this.buildBackdrop();
    this.buildStars();
    this.buildProps();
    this.buildPegs();
    this.buildLauncher();
    this.buildParticles();

    this.aimLine = this.add.graphics().setDepth(6);
    this.aimReticle = this.add.circle(0, 0, 7, 0xffffff, 0.9).setVisible(false).setDepth(6);

    this.buildHud();

    this.input.on("pointerdown", () => this.startAim());
    this.input.on("pointermove", (p: Phaser.Input.Pointer) => this.updateAim(p));
    this.input.on("pointerup", (p: Phaser.Input.Pointer) => this.releaseAim(p));

    this.matter.world.on("collisionstart", (event: Phaser.Physics.Matter.Events.CollisionStartEvent) => {
      for (const pair of event.pairs) {
        this.handleCollision(pair.bodyA, pair.bodyB);
        this.handleCollision(pair.bodyB, pair.bodyA);
      }
    });
  }

  // ---------- procedural art (no external assets yet) ----------

  /** Draws a glossy glowing orb (glow halo + base fill + highlight + rim), optionally with a little slime face, onto a reusable texture. */
  private bakeOrbTexture(key: string, radius: number, core: number, glow: number, face = false): void {
    if (this.textures.exists(key)) return;
    const pad = Math.round(radius * 0.9);
    const size = (radius + pad) * 2;
    const c = size / 2;
    const g = this.make.graphics({ x: 0, y: 0 }, false);

    for (let i = 4; i >= 1; i--) {
      g.fillStyle(glow, 0.07 * i);
      g.fillCircle(c, c, radius + (pad * i) / 4);
    }
    g.fillStyle(core, 1);
    g.fillCircle(c, c, radius);
    g.fillStyle(0xffffff, 0.3);
    g.fillEllipse(c - radius * 0.32, c - radius * 0.38, radius * 0.75, radius * 0.5);
    g.lineStyle(Math.max(1.5, radius * 0.08), 0xffffff, 0.55);
    g.strokeCircle(c, c, radius - 1);

    if (face) {
      const eyeX = radius * 0.34;
      const eyeY = radius * 0.08;
      const eyeR = radius * 0.22;
      for (const side of [-1, 1]) {
        g.fillStyle(0xffffff, 0.95);
        g.fillCircle(c + side * eyeX, c + eyeY, eyeR);
        g.fillStyle(0x1a1a1a, 1);
        g.fillCircle(c + side * eyeX + side * eyeR * 0.25, c + eyeY + eyeR * 0.15, eyeR * 0.5);
      }
      // a small grumpy mouth line
      g.lineStyle(Math.max(1.2, radius * 0.07), 0x1a1a1a, 0.6);
      g.beginPath();
      g.arc(c, c + radius * 0.5, radius * 0.3, Phaser.Math.DegToRad(20), Phaser.Math.DegToRad(160));
      g.strokePath();
    }

    g.generateTexture(key, size, size);
    g.destroy();
  }

  private bakeTextures(): void {
    for (const tier of PEG_TIERS) this.bakeOrbTexture(tier.key, 20, tier.core, tier.glow, true);
    this.bakeOrbTexture("ball", BALL_RADIUS, BALL_CORE, BALL_GLOW);
    this.bakeOrbTexture("launcher", 14, LAUNCHER_CORE, LAUNCHER_GLOW);

    if (!this.textures.exists("spark")) {
      const g = this.make.graphics({ x: 0, y: 0 }, false);
      g.fillStyle(0xffffff, 1);
      g.fillCircle(4, 4, 4);
      g.generateTexture("spark", 8, 8);
      g.destroy();
    }
  }

  /** A mossy stone cave: blocky stonework, cracks, moss patches, rubble — instead of a flat gradient. */
  private buildBackdrop(): void {
    const bg = this.add.graphics().setDepth(-10);
    bg.fillGradientStyle(0x1b2420, 0x1b2420, 0x0e1613, 0x0e1613, 1);
    bg.fillRect(0, 0, WIDTH, HEIGHT);

    // irregular stone block courses
    const rng = Phaser.Math.RND;
    const blockH = 46;
    let row = 0;
    for (let y = -10; y < HEIGHT; y += blockH) {
      const offset = row % 2 === 0 ? 0 : 34;
      let x = -offset;
      while (x < WIDTH) {
        const w = rng.between(52, 78);
        const shade = rng.between(-10, 14);
        const base = Phaser.Display.Color.ValueToColor(0x273830);
        const tint = Phaser.Display.Color.GetColor(
          Phaser.Math.Clamp(base.red + shade, 20, 70),
          Phaser.Math.Clamp(base.green + shade + 6, 30, 85),
          Phaser.Math.Clamp(base.blue + shade, 20, 70)
        );
        bg.fillStyle(tint, 1);
        bg.fillRoundedRect(x, y, w - 4, blockH - 5, 3);
        x += w;
      }
      row++;
    }
    // mortar shadow lines on top of the blocks for depth
    bg.fillStyle(0x070b09, 0.25);
    for (let y = -10; y < HEIGHT; y += blockH) bg.fillRect(0, y + blockH - 5, WIDTH, 3);

    // moss patches, mostly clinging to the edges
    for (let i = 0; i < 34; i++) {
      const edge = rng.between(0, 3);
      const x = edge < 2 ? rng.between(0, 70) + (edge === 1 ? WIDTH - 70 : 0) : rng.between(0, WIDTH);
      const y = edge >= 2 ? rng.between(0, 70) + (edge === 3 ? HEIGHT - 70 : 0) : rng.between(0, HEIGHT);
      const r = rng.between(8, 22);
      bg.fillStyle(0x3d6b3a, rng.realInRange(0.08, 0.22));
      bg.fillCircle(x, y, r);
    }

    // scattered pebbles/rubble for texture
    bg.fillStyle(0x0a1210, 0.4);
    for (let i = 0; i < 60; i++) {
      bg.fillCircle(rng.between(0, WIDTH), rng.between(0, HEIGHT), rng.realInRange(0.8, 2.2));
    }

    // soft vignette top/bottom so the HUD and launcher read clearly
    bg.fillStyle(0x000000, 0.4);
    bg.fillRect(0, 0, WIDTH, 90);
    bg.fillRect(0, HEIGHT - 140, WIDTH, 140);

    // cabinet-style frame (mossy stone trim) — drawn exactly at ARENA_MARGIN
    // so the ball's hard stop lines up with what the player actually sees.
    const frame = this.add.graphics().setDepth(5);
    const m = ARENA_MARGIN;
    frame.lineStyle(7, 0x1a2420, 1);
    frame.strokeRoundedRect(m - 4, m - 4, WIDTH - (m - 4) * 2, HEIGHT - (m - 4) * 2, 18);
    frame.lineStyle(2, 0x5a8a52, 0.55);
    frame.strokeRoundedRect(m, m, WIDTH - m * 2, HEIGHT - m * 2, 16);
  }

  /** Cave dressing: flickering wall torches, a treasure chest, scattered bones — no two runs look quite as sterile. */
  private buildProps(): void {
    this.buildTorch(36, 210);
    this.buildTorch(WIDTH - 36, 210);
    this.buildTorch(36, 607);
    this.buildTorch(WIDTH - 36, 607);
    this.buildChest(70, HEIGHT - 150);
    this.buildBones(WIDTH - 90, HEIGHT - 140);
    this.buildBones(60, HEIGHT - 240, true);
  }

  private buildTorch(x: number, y: number): void {
    const g = this.add.graphics().setDepth(1);
    g.fillStyle(0x4a3826, 1);
    g.fillRect(x - 3, y - 2, 6, 22);
    g.fillStyle(0x2a1d12, 1);
    g.fillRect(x - 5, y - 6, 10, 6);

    const glow = this.add.circle(x, y - 16, 26, 0xffa84a, 0.18).setDepth(0);
    const flame = this.add.ellipse(x, y - 16, 10, 16, 0xffb347, 0.95).setDepth(1);
    const flameCore = this.add.ellipse(x, y - 14, 5, 9, 0xfff1c2, 0.95).setDepth(1);

    this.tweens.add({
      targets: flame,
      scaleX: { from: 0.85, to: 1.15 },
      scaleY: { from: 0.9, to: 1.2 },
      duration: 260,
      yoyo: true,
      repeat: -1,
      ease: "Sine.InOut",
    });
    this.tweens.add({
      targets: glow,
      alpha: { from: 0.12, to: 0.24 },
      scale: { from: 0.9, to: 1.1 },
      duration: 420,
      yoyo: true,
      repeat: -1,
      ease: "Sine.InOut",
      delay: 80,
    });
    this.tweens.add({
      targets: flameCore,
      y: y - 14 - 2,
      duration: 200,
      yoyo: true,
      repeat: -1,
      ease: "Sine.InOut",
    });
  }

  private buildChest(x: number, y: number): void {
    const g = this.add.graphics().setDepth(1);
    g.fillStyle(0x5a3d22, 1);
    g.fillRoundedRect(x - 20, y, 40, 24, 4);
    g.fillStyle(0x3d2815, 1);
    g.fillRoundedRect(x - 20, y - 12, 40, 16, { tl: 10, tr: 10, bl: 0, br: 0 });
    g.fillStyle(0xd4af37, 1);
    g.fillRect(x - 16, y + 6, 32, 3);
    g.fillCircle(x, y + 8, 4);
    g.lineStyle(1.5, 0x241709, 0.6);
    g.strokeRoundedRect(x - 20, y, 40, 24, 4);
    g.strokeRoundedRect(x - 20, y - 12, 40, 16, { tl: 10, tr: 10, bl: 0, br: 0 });
  }

  private buildBones(x: number, y: number, skull = false): void {
    const g = this.add.graphics().setDepth(1);
    g.fillStyle(0xe8e2d0, 0.85);
    if (skull) {
      g.fillCircle(x, y, 9);
      g.fillStyle(0x1b2420, 0.9);
      g.fillCircle(x - 3, y - 1, 2);
      g.fillCircle(x + 3, y - 1, 2);
      g.fillStyle(0xe8e2d0, 0.85);
      g.fillTriangle(x - 7, y + 7, x + 7, y + 7, x, y + 14);
    } else {
      for (const angle of [-0.3, 0.4]) {
        g.save();
        g.translateCanvas(x, y);
        g.rotateCanvas(angle);
        g.fillRoundedRect(-18, -2.5, 36, 5, 2.5);
        g.fillCircle(-18, 0, 4);
        g.fillCircle(18, 0, 4);
        g.restore();
      }
    }
  }

  /** A handful of softly twinkling motes (fireflies/dust) — cheap ambient motion. */
  private buildStars(): void {
    for (let i = 0; i < 22; i++) {
      const x = Phaser.Math.Between(20, WIDTH - 20);
      const y = Phaser.Math.Between(100, HEIGHT - 100);
      const r = Phaser.Math.FloatBetween(0.8, 1.8);
      const star = this.add.circle(x, y, r, 0xcdeab0, Phaser.Math.FloatBetween(0.15, 0.4)).setDepth(-9);
      this.tweens.add({
        targets: star,
        alpha: { from: star.alpha, to: 0.05 },
        duration: Phaser.Math.Between(1400, 3200),
        yoyo: true,
        repeat: -1,
        delay: Phaser.Math.Between(0, 2000),
        ease: "Sine.InOut",
      });
    }
  }

  private buildParticles(): void {
    this.hitSparks = this.add.particles(0, 0, "spark", {
      lifespan: 360,
      speed: { min: 60, max: 180 },
      scale: { start: 1.4, end: 0 },
      alpha: { start: 1, end: 0 },
      blendMode: "ADD",
      emitting: false,
    });
    this.hitSparks.setDepth(8);

    this.ballTrail = this.add.particles(0, 0, "spark", {
      lifespan: 260,
      speed: 0,
      scale: { start: 1.1, end: 0 },
      alpha: { start: 0.5, end: 0 },
      tint: BALL_GLOW,
      blendMode: "ADD",
      frequency: 18,
    });
    this.ballTrail.setDepth(3);
    this.ballTrail.stop();
  }

  private buildHud(): void {
    const panel = this.add.graphics().setDepth(9);
    panel.fillStyle(0x0b0f22, 0.6);
    panel.fillRoundedRect(10, 10, WIDTH - 20, 56, 14);
    panel.lineStyle(1.5, ACCENT, 0.35);
    panel.strokeRoundedRect(10, 10, WIDTH - 20, 56, 14);

    this.add.star(34, 38, 5, 7, 14, 0xffd76a).setDepth(10).setStrokeStyle(1, 0xffffff, 0.6);
    this.hudScore = this.add
      .text(52, 38, "0", {
        fontFamily: "system-ui, sans-serif",
        fontSize: "26px",
        color: "#f3f7ff",
        fontStyle: "800",
      })
      .setOrigin(0, 0.5)
      .setDepth(10);

    for (let i = 0; i < START_BALLS; i++) {
      const icon = this.add.image(WIDTH - 26 - i * 24, 38, "ball").setScale(0.5).setDepth(10);
      this.hudBallIcons.push(icon);
    }

    this.hudHits = this.add
      .text(WIDTH / 2, 76, "", {
        fontFamily: "system-ui, sans-serif",
        fontSize: "16px",
        color: "#9fe0a8",
        fontStyle: "800",
      })
      .setOrigin(0.5, 0)
      .setDepth(10)
      .setShadow(0, 1, "#000", 4, true, true);

    this.hudMessagePanel = this.add.graphics().setDepth(19).setVisible(false);
    this.hudMessage = this.add
      .text(WIDTH / 2, HEIGHT / 2, "", {
        fontFamily: "system-ui, sans-serif",
        fontSize: "28px",
        color: "#ffffff",
        fontStyle: "800",
        align: "center",
      })
      .setOrigin(0.5)
      .setDepth(20)
      .setShadow(0, 2, "#000", 6, true, true);
  }

  private updateBallIcons(): void {
    this.hudBallIcons.forEach((icon, i) => {
      const used = i >= this.ballsLeft;
      icon.setAlpha(used ? 0.2 : 1).setScale(used ? 0.36 : 0.5);
    });
  }

  private spawnScorePopup(x: number, y: number, amount: number, big = false): void {
    const text = this.add
      .text(x, y, `+${amount}`, {
        fontFamily: "system-ui, sans-serif",
        fontSize: big ? "22px" : "15px",
        color: big ? "#ffd76a" : "#9fe0a8",
        fontStyle: "800",
      })
      .setOrigin(0.5)
      .setDepth(15)
      .setShadow(0, 1, "#000", 3, true, true);

    this.tweens.add({
      targets: text,
      y: y - 46,
      alpha: 0,
      duration: 650,
      ease: "Cubic.Out",
      onComplete: () => text.destroy(),
    });
  }

  // ---------- gameplay (unchanged logic) ----------

  private buildLauncher(): void {
    this.add.image(LAUNCHER.x, LAUNCHER.y, "launcher").setDepth(2);
    const ring = this.add.circle(LAUNCHER.x, LAUNCHER.y, 22, 0xffffff, 0).setStrokeStyle(2, LAUNCHER_GLOW, 0.5).setDepth(2);
    this.tweens.add({ targets: ring, scale: 1.3, alpha: 0, duration: 1100, repeat: -1, ease: "Sine.Out" });
  }

  private buildPegs(): void {
    // Spread across the taller arena (and a notch smaller than before) so
    // there's visibly more open space for the ball to travel through,
    // rather than a dense cluster filling most of the screen.
    const layout: Array<{ x: number; y: number; hp: number }> = [
      { x: 120, y: 220, hp: 1 },
      { x: 240, y: 163, hp: 1 },
      { x: 360, y: 220, hp: 1 },
      { x: 90, y: 362, hp: 1 },
      { x: 390, y: 362, hp: 1 },
      { x: 180, y: 391, hp: 2 },
      { x: 300, y: 391, hp: 2 },
      { x: 240, y: 502, hp: 3 },
      { x: 150, y: 560, hp: 1 },
      { x: 330, y: 560, hp: 1 },
      { x: 240, y: 671, hp: 2 },
      { x: 110, y: 700, hp: 1 },
      { x: 370, y: 700, hp: 1 },
    ];

    for (const spot of layout) {
      const radius = 13 + spot.hp * 1.6;
      const body = this.matter.add.circle(spot.x, spot.y, radius, {
        isStatic: true,
        restitution: 1,
        label: "peg",
      });
      const gfx = this.add.image(spot.x, spot.y, this.tierForHp(spot.hp, spot.hp).key).setDepth(4);
      gfx.setScale(radius / 20);
      this.pegs.push({ body, gfx, hp: spot.hp, maxHp: spot.hp, radius });
    }
  }

  private tierForHp(hp: number, maxHp: number): (typeof PEG_TIERS)[number] {
    if (hp <= 0) return PEG_TIERS[0];
    const ratio = hp / maxHp;
    if (ratio > 0.66) return PEG_TIERS[2];
    if (ratio > 0.33) return PEG_TIERS[1];
    return PEG_TIERS[0];
  }

  private startAim(): void {
    if (this.ball || this.ballsLeft <= 0 || this.gameEnded) return;
    this.aiming = true;
    this.aimReticle.setVisible(true);
  }

  private updateAim(p: Phaser.Input.Pointer): void {
    if (!this.aiming) return;
    this.aimLine.clear();

    const dx = p.x - LAUNCHER.x;
    const dy = p.y - LAUNCHER.y;
    const dist = Phaser.Math.Clamp(Math.hypot(dx, dy), 0, MAX_DRAG);
    const angle = Math.atan2(dy, dx);
    const tx = LAUNCHER.x + Math.cos(angle) * dist;
    const ty = LAUNCHER.y + Math.sin(angle) * dist;

    // Pull back like a slingshot: drag distance charges the power, shown
    // as the aim line shifting from cool (weak) to hot (max impulse).
    const powerRatio = Phaser.Math.Clamp((dist - MIN_DRAG) / (MAX_DRAG - MIN_DRAG), 0, 1);
    const lineColor = Phaser.Display.Color.Interpolate.ColorWithColor(
      Phaser.Display.Color.ValueToColor(0x6ee7ff),
      Phaser.Display.Color.ValueToColor(0xff4d6a),
      100,
      Math.round(powerRatio * 100)
    );
    const color = Phaser.Display.Color.GetColor(lineColor.r, lineColor.g, lineColor.b);

    const steps = 10;
    for (let i = 0; i < steps; i++) {
      const t0 = i / steps;
      const t1 = (i + 0.6) / steps;
      this.aimLine.lineStyle(4 + powerRatio * 2, color, 0.25 + 0.55 * t0);
      this.aimLine.lineBetween(
        Phaser.Math.Linear(LAUNCHER.x, tx, t0),
        Phaser.Math.Linear(LAUNCHER.y, ty, t0),
        Phaser.Math.Linear(LAUNCHER.x, tx, t1),
        Phaser.Math.Linear(LAUNCHER.y, ty, t1)
      );
    }
    this.aimReticle.setPosition(tx, ty).setFillStyle(color, 0.95).setScale(1 + powerRatio * 0.6);
  }

  private releaseAim(p: Phaser.Input.Pointer): void {
    if (!this.aiming) return;
    this.aiming = false;
    this.aimLine.clear();
    this.aimReticle.setVisible(false).setScale(1);

    const dx = p.x - LAUNCHER.x;
    const dy = p.y - LAUNCHER.y;
    const dist = Math.hypot(dx, dy);
    if (dist < MIN_DRAG) return;

    const angle = Math.atan2(dy, dx);
    const powerRatio = Phaser.Math.Clamp((dist - MIN_DRAG) / (MAX_DRAG - MIN_DRAG), 0, 1);
    const speed = Phaser.Math.Linear(MIN_SPEED, MAX_SPEED, powerRatio);
    this.fireBall(angle, speed);
  }

  private fireBall(angle: number, speed: number): void {
    const body = this.matter.add.circle(LAUNCHER.x, LAUNCHER.y, BALL_RADIUS, {
      // No gravity and no friction at all — the ball keeps the exact
      // speed it launched with for the whole shot. No decay-to-a-crawl;
      // it's either fast or the shot is over (MAX_SHOT_MS cuts it off).
      restitution: 1,
      friction: 0,
      frictionAir: 0,
      frictionStatic: 0,
      label: "ball",
    });
    this.matter.body.setVelocity(body, { x: Math.cos(angle) * speed, y: Math.sin(angle) * speed });
    this.ball = body;
    this.ballGfx = this.add.image(LAUNCHER.x, LAUNCHER.y, "ball").setDepth(7);
    this.shotElapsedMs = 0;
    this.ballTrail.start();
    this.sfx.launch();

    this.ballsLeft -= 1;
    this.shotHits = 0;
    this.updateBallIcons();
    this.hudHits.setText("");
  }

  private handleCollision(a: MatterJS.BodyType, b: MatterJS.BodyType): void {
    if (a.label !== "ball" || b.label !== "peg") return;
    const peg = this.pegs.find((pg) => pg.body === b);
    if (!peg || peg.hp <= 0) return;

    peg.hp -= 1;
    this.shotHits += 1;
    this.score += HIT_SCORE;

    // Everything below scales up with the combo streak — more sparks, a
    // bigger shake, a stronger buzz — so the hit really does feel bigger
    // the longer the chain runs, on top of the rising-pitch sound.
    const comboScale = Math.min(1 + (this.shotHits - 1) * 0.16, 2.4);
    this.sfx.hit(this.shotHits);
    this.hitSparks.setParticleTint(this.tierForHp(peg.hp + 1, peg.maxHp).core);
    this.hitSparks.explode(Math.round(10 * comboScale), peg.body.position.x, peg.body.position.y);
    this.cameras.main.shake(40 + this.shotHits * 4, 0.0018 + this.shotHits * 0.00025);
    this.vibrate(10);
    this.spawnScorePopup(peg.body.position.x, peg.body.position.y - peg.radius, HIT_SCORE);

    if (peg.hp <= 0) {
      this.score += DESTROY_BONUS;
      this.sfx.destroy(this.shotHits);
      this.spawnScorePopup(peg.body.position.x, peg.body.position.y - peg.radius - 16, DESTROY_BONUS, true);
      this.hitSparks.explode(Math.round(22 * comboScale), peg.body.position.x, peg.body.position.y);
      this.vibrate([12, 20, 12]);
      this.matter.world.remove(peg.body);
      this.tweens.add({
        targets: peg.gfx,
        alpha: 0,
        scale: peg.gfx.scale * 1.6,
        duration: 180,
        onComplete: () => peg.gfx.destroy(),
      });
    } else {
      peg.gfx.setTexture(this.tierForHp(peg.hp, peg.maxHp).key);
      this.tweens.add({ targets: peg.gfx, scale: peg.gfx.scale * 1.25, duration: 70, yoyo: true });
    }

    this.hudScore.setText(`${this.score}`);
    if (this.shotHits > 1) {
      this.hudHits.setText(`COMBO ${this.shotHits}x`);
      this.hudHits.setColor(this.comboColor(this.shotHits));
      this.tweens.add({ targets: this.hudHits, scale: 1.15 + Math.min(this.shotHits * 0.05, 0.6), duration: 90, yoyo: true });
    } else {
      this.hudHits.setText("");
    }
  }

  private comboColor(combo: number): string {
    if (combo >= 8) return "#ff4d6a";
    if (combo >= 5) return "#ffd76a";
    return "#9fe0a8";
  }

  private vibrate(pattern: number | number[]): void {
    try {
      navigator.vibrate?.(pattern);
    } catch {
      // haptics aren't available everywhere — never let this break a hit
    }
  }

  update(_time: number, deltaMs: number): void {
    if (this.gameEnded) return;

    if (this.ball) {
      this.clampBallToArena();
      this.ballGfx.setPosition(this.ball.position.x, this.ball.position.y);
      this.ballTrail.setPosition(this.ball.position.x, this.ball.position.y);

      // No gravity/friction means the ball never slows down or settles on
      // its own, so a shot just runs for a fixed amount of time.
      this.shotElapsedMs += deltaMs;
      if (this.shotElapsedMs > MAX_SHOT_MS) this.removeBall();
    }

    const pegsLeft = this.pegs.filter((pg) => pg.hp > 0).length;
    if (!this.ball && !this.gameEnded) {
      if (pegsLeft === 0) {
        this.score += CLEAR_BONUS;
        this.hudScore.setText(`${this.score}`);
        this.endGame(`Campo limpo! +${CLEAR_BONUS}\nPontuação final: ${this.score}`, true);
      } else if (this.ballsLeft <= 0) {
        this.endGame(`Fim de jogo\nPontuação final: ${this.score}`, false);
      }
    }
  }

  /**
   * Safety net against tunneling: at the high speeds a fully-charged shot
   * can reach, Matter can let the ball cross the thin wall boundary within
   * a single physics step and escape the arena entirely (it would then fly
   * off-screen forever, invisible, until the shot timeout). This clamps
   * the ball back inside — at the same ARENA_MARGIN the frame is drawn at,
   * so it never visibly pokes past the border — and reflects the
   * offending velocity component, regardless of what Matter's own wall
   * collision did.
   */
  private clampBallToArena(): void {
    if (!this.ball) return;
    const r = BALL_RADIUS;
    const minX = ARENA_MARGIN + r;
    const maxX = WIDTH - ARENA_MARGIN - r;
    const minY = ARENA_MARGIN + r;
    const maxY = HEIGHT - ARENA_MARGIN - r;
    const pos = this.ball.position;
    const vel = this.ball.velocity;
    let x = pos.x;
    let y = pos.y;
    let vx = vel.x;
    let vy = vel.y;
    let hit = false;

    if (x < minX) {
      x = minX;
      vx = Math.abs(vx);
      hit = true;
    } else if (x > maxX) {
      x = maxX;
      vx = -Math.abs(vx);
      hit = true;
    }
    if (y < minY) {
      y = minY;
      vy = Math.abs(vy);
      hit = true;
    } else if (y > maxY) {
      y = maxY;
      vy = -Math.abs(vy);
      hit = true;
    }

    if (hit) {
      this.matter.body.setPosition(this.ball, { x, y });
      this.matter.body.setVelocity(this.ball, { x: vx, y: vy });
    }
  }

  private removeBall(): void {
    if (!this.ball) return;
    this.matter.world.remove(this.ball);
    this.ballGfx.destroy();
    this.ballTrail.stop();
    this.ball = null;
  }

  private endGame(message: string, won: boolean): void {
    this.gameEnded = true;
    this.sfx.gameOver(won);
    this.hudMessagePanel.clear().setVisible(true);
    this.hudMessagePanel.fillStyle(0x0b0f22, 0.85);
    this.hudMessagePanel.fillRoundedRect(WIDTH / 2 - 180, HEIGHT / 2 - 110, 360, 220, 18);
    this.hudMessagePanel.lineStyle(2, ACCENT, 0.6);
    this.hudMessagePanel.strokeRoundedRect(WIDTH / 2 - 180, HEIGHT / 2 - 110, 360, 220, 18);
    this.hudMessage.setText(`${message}\n\ntoque para reiniciar`);
    this.input.once("pointerdown", () => this.scene.restart());
  }
}
