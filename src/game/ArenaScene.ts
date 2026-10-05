import Phaser from "phaser";

/**
 * Pinball-roguelike core loop: launcher at the BOTTOM, you drag-aim and
 * fire the ball upward into the peg field, gravity pulls it back down.
 * There's no drain — the floor is solid, so the ball just loses energy
 * (air + ground friction) on every bounce and naturally comes to rest.
 * Once it's fully stopped, that shot is over and you launch again. Score
 * comes from hits; the run ends when you're out of shots.
 *
 * Still no external art — this pass is about making the procedural look
 * (glowing orbs, particles, a cabinet-style frame) read as a real game
 * instead of flat debug circles, before roguelike powers go on top.
 */

const WIDTH = 480;
const HEIGHT = 800;
const LAUNCHER = { x: WIDTH / 2, y: HEIGHT - 60 };
const BALL_RADIUS = 10;
const START_BALLS = 5;
const MIN_DRAG = 20;
const MAX_DRAG = 160;
const MIN_SPEED = 8;
const MAX_SPEED = 24;
const SETTLE_SPEED = 0.35;
const SETTLE_FRAMES = 30;
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
  private settleCounter = 0;
  private shotElapsedMs = 0;

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
    this.settleCounter = 0;
    this.shotElapsedMs = 0;
    this.ballsLeft = START_BALLS;
    this.score = 0;
    this.shotHits = 0;
    this.gameEnded = false;
    this.hudBallIcons = [];

    this.bakeTextures();

    this.matter.world.setBounds(0, 0, WIDTH, HEIGHT, 32);

    this.buildBackdrop();
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

  /** Draws a glossy glowing orb (glow halo + base fill + highlight + rim) once onto a reusable texture. */
  private bakeOrbTexture(key: string, radius: number, core: number, glow: number): void {
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

    g.generateTexture(key, size, size);
    g.destroy();
  }

  private bakeTextures(): void {
    for (const tier of PEG_TIERS) this.bakeOrbTexture(tier.key, 20, tier.core, tier.glow);
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

  private buildBackdrop(): void {
    const bg = this.add.graphics().setDepth(-10);
    bg.fillGradientStyle(0x0c1024, 0x0c1024, 0x1c1138, 0x1c1138, 1);
    bg.fillRect(0, 0, WIDTH, HEIGHT);

    // faint dot grid for texture
    bg.fillStyle(0xffffff, 0.035);
    for (let x = 20; x < WIDTH; x += 28) {
      for (let y = 20; y < HEIGHT; y += 28) {
        bg.fillCircle(x, y, 1.4);
      }
    }

    // soft vignette via corner glows
    bg.fillStyle(0x000000, 0.35);
    bg.fillRect(0, 0, WIDTH, 90);
    bg.fillRect(0, HEIGHT - 140, WIDTH, 140);

    // cabinet-style frame
    const frame = this.add.graphics().setDepth(5);
    frame.lineStyle(6, 0x241a3d, 1);
    frame.strokeRoundedRect(6, 6, WIDTH - 12, HEIGHT - 12, 18);
    frame.lineStyle(2, ACCENT, 0.5);
    frame.strokeRoundedRect(10, 10, WIDTH - 20, HEIGHT - 20, 16);
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
    const layout: Array<{ x: number; y: number; hp: number }> = [
      { x: 120, y: 160, hp: 1 },
      { x: 240, y: 120, hp: 1 },
      { x: 360, y: 160, hp: 1 },
      { x: 90, y: 260, hp: 1 },
      { x: 390, y: 260, hp: 1 },
      { x: 180, y: 280, hp: 2 },
      { x: 300, y: 280, hp: 2 },
      { x: 240, y: 360, hp: 3 },
      { x: 150, y: 400, hp: 1 },
      { x: 330, y: 400, hp: 1 },
      { x: 240, y: 480, hp: 2 },
      { x: 110, y: 500, hp: 1 },
      { x: 370, y: 500, hp: 1 },
    ];

    for (const spot of layout) {
      const radius = 16 + spot.hp * 2;
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
      this.aimLine.lineStyle(4, color, 0.25 + 0.55 * t0);
      this.aimLine.lineBetween(
        Phaser.Math.Linear(LAUNCHER.x, tx, t0),
        Phaser.Math.Linear(LAUNCHER.y, ty, t0),
        Phaser.Math.Linear(LAUNCHER.x, tx, t1),
        Phaser.Math.Linear(LAUNCHER.y, ty, t1)
      );
    }
    this.aimReticle.setPosition(tx, ty).setFillStyle(color, 0.95);
  }

  private releaseAim(p: Phaser.Input.Pointer): void {
    if (!this.aiming) return;
    this.aiming = false;
    this.aimLine.clear();
    this.aimReticle.setVisible(false);

    const dx = p.x - LAUNCHER.x;
    const dy = p.y - LAUNCHER.y;
    const dist = Math.hypot(dx, dy);
    if (dist < MIN_DRAG) return;

    const angle = Math.atan2(dy, dx);
    const power = Phaser.Math.Linear(MIN_SPEED, MAX_SPEED, Phaser.Math.Clamp((dist - MIN_DRAG) / (MAX_DRAG - MIN_DRAG), 0, 1));

    this.fireBall(angle, power);
  }

  private fireBall(angle: number, power: number): void {
    const body = this.matter.add.circle(LAUNCHER.x, LAUNCHER.y, BALL_RADIUS, {
      restitution: 0.55,
      friction: 0.08,
      frictionAir: 0.006,
      label: "ball",
    });
    this.matter.body.setVelocity(body, { x: Math.cos(angle) * power, y: Math.sin(angle) * power });
    this.ball = body;
    this.ballGfx = this.add.image(LAUNCHER.x, LAUNCHER.y, "ball").setDepth(7);
    this.settleCounter = 0;
    this.shotElapsedMs = 0;
    this.ballTrail.start();

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

    this.hitSparks.setParticleTint(this.tierForHp(peg.hp + 1, peg.maxHp).core);
    this.hitSparks.explode(10, peg.body.position.x, peg.body.position.y);
    this.cameras.main.shake(40, 0.002);
    this.spawnScorePopup(peg.body.position.x, peg.body.position.y - peg.radius, HIT_SCORE);

    if (peg.hp <= 0) {
      this.score += DESTROY_BONUS;
      this.spawnScorePopup(peg.body.position.x, peg.body.position.y - peg.radius - 16, DESTROY_BONUS, true);
      this.hitSparks.explode(22, peg.body.position.x, peg.body.position.y);
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
    this.hudHits.setText(this.shotHits > 1 ? `COMBO ${this.shotHits}x` : "");
    if (this.shotHits > 1) {
      this.tweens.add({ targets: this.hudHits, scale: 1.3, duration: 90, yoyo: true });
    }
  }

  update(_time: number, deltaMs: number): void {
    if (this.gameEnded) return;

    if (this.ball) {
      this.ballGfx.setPosition(this.ball.position.x, this.ball.position.y);
      this.ballTrail.setPosition(this.ball.position.x, this.ball.position.y);

      this.shotElapsedMs += deltaMs;
      const speed = Math.hypot(this.ball.velocity.x, this.ball.velocity.y);
      if (speed < SETTLE_SPEED) {
        this.settleCounter += 1;
        if (this.settleCounter > SETTLE_FRAMES) this.removeBall();
      } else {
        this.settleCounter = 0;
      }
      // Safety net: restitution + gravity can leave a ball doing endless
      // tiny micro-bounces against the floor that never quite read as
      // "stopped" — never let the player get stuck waiting on that.
      if (this.shotElapsedMs > MAX_SHOT_MS) this.removeBall();
    }

    const pegsLeft = this.pegs.filter((pg) => pg.hp > 0).length;
    if (!this.ball && !this.gameEnded) {
      if (pegsLeft === 0) {
        this.score += CLEAR_BONUS;
        this.hudScore.setText(`${this.score}`);
        this.endGame(`Campo limpo! +${CLEAR_BONUS}\nPontuação final: ${this.score}`);
      } else if (this.ballsLeft <= 0) {
        this.endGame(`Fim de jogo\nPontuação final: ${this.score}`);
      }
    }
  }

  private removeBall(): void {
    if (!this.ball) return;
    this.matter.world.remove(this.ball);
    this.ballGfx.destroy();
    this.ballTrail.stop();
    this.ball = null;
  }

  private endGame(message: string): void {
    this.gameEnded = true;
    this.hudMessagePanel.clear().setVisible(true);
    this.hudMessagePanel.fillStyle(0x0b0f22, 0.85);
    this.hudMessagePanel.fillRoundedRect(WIDTH / 2 - 180, HEIGHT / 2 - 110, 360, 220, 18);
    this.hudMessagePanel.lineStyle(2, ACCENT, 0.6);
    this.hudMessagePanel.strokeRoundedRect(WIDTH / 2 - 180, HEIGHT / 2 - 110, 360, 220, 18);
    this.hudMessage.setText(`${message}\n\ntoque para reiniciar`);
    this.input.once("pointerdown", () => this.scene.restart());
  }
}
