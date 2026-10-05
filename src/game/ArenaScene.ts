import Phaser from "phaser";

/**
 * Pinball-roguelike core loop: launcher at the BOTTOM, you drag-aim and
 * fire the ball upward into the peg field, gravity pulls it back down,
 * and if it falls past the launcher you lose that ball (no floor — the
 * bottom of the world is an open drain, not a wall). Score comes from
 * hits; the run ends when you're out of balls. Placeholder shapes still
 * — roguelike powers (split ball, homing, etc.) come after this core
 * loop is confirmed to feel right.
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
const SETTLE_SPEED = 0.15;
const SETTLE_FRAMES = 40;
const HIT_SCORE = 10;
const DESTROY_BONUS = 40;
const CLEAR_BONUS = 300;

interface Peg {
  body: MatterJS.BodyType;
  gfx: Phaser.GameObjects.Arc;
  hp: number;
  maxHp: number;
}

export class ArenaScene extends Phaser.Scene {
  private pegs: Peg[] = [];
  private ball: MatterJS.BodyType | null = null;
  private ballGfx!: Phaser.GameObjects.Arc;
  private aimLine!: Phaser.GameObjects.Graphics;

  private aiming = false;
  private settleCounter = 0;

  private ballsLeft = START_BALLS;
  private score = 0;
  private hudBalls!: Phaser.GameObjects.Text;
  private hudScore!: Phaser.GameObjects.Text;
  private hudHits!: Phaser.GameObjects.Text;
  private hudMessage!: Phaser.GameObjects.Text;
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
    this.ballsLeft = START_BALLS;
    this.score = 0;
    this.shotHits = 0;
    this.gameEnded = false;

    // No bottom wall: the ball falls out of the world if it drains past the
    // launcher, which is exactly the "lose this ball" signal we want.
    this.matter.world.setBounds(0, 0, WIDTH, HEIGHT, 32, true, true, true, false);
    this.cameras.main.setBackgroundColor("#161a2e");

    this.buildPegs();
    this.drawLauncher();

    this.aimLine = this.add.graphics();

    this.hudScore = this.add.text(16, 14, "Pontos: 0", {
      fontFamily: "system-ui, sans-serif",
      fontSize: "22px",
      color: "#f3f7ff",
      fontStyle: "800",
    });
    this.hudBalls = this.add.text(16, 44, `Bolas: ${this.ballsLeft}`, {
      fontFamily: "system-ui, sans-serif",
      fontSize: "15px",
      color: "#6ee7ff",
      fontStyle: "700",
    });
    this.hudHits = this.add.text(16, 68, "", {
      fontFamily: "system-ui, sans-serif",
      fontSize: "14px",
      color: "#9fe0a8",
      fontStyle: "700",
    });
    this.hudMessage = this.add
      .text(WIDTH / 2, HEIGHT / 2, "", {
        fontFamily: "system-ui, sans-serif",
        fontSize: "30px",
        color: "#ffffff",
        fontStyle: "800",
        align: "center",
      })
      .setOrigin(0.5)
      .setDepth(20)
      .setShadow(0, 2, "#000", 6, true, true);

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

  private drawLauncher(): void {
    this.add.circle(LAUNCHER.x, LAUNCHER.y, 14, 0xffd76a);
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
      const gfx = this.add.circle(spot.x, spot.y, radius, this.colorForHp(spot.hp, spot.hp));
      gfx.setStrokeStyle(2, 0xffffff, 0.5);
      this.pegs.push({ body, gfx, hp: spot.hp, maxHp: spot.hp });
    }
  }

  private colorForHp(hp: number, maxHp: number): number {
    if (hp <= 0) return 0x333333;
    const ratio = hp / maxHp;
    if (ratio > 0.66) return 0xef4444;
    if (ratio > 0.33) return 0xf59e0b;
    return 0xfacc15;
  }

  private startAim(): void {
    if (this.ball || this.ballsLeft <= 0 || this.gameEnded) return;
    this.aiming = true;
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

    this.aimLine.lineStyle(3, 0xffd76a, 0.8);
    this.aimLine.lineBetween(LAUNCHER.x, LAUNCHER.y, tx, ty);
    this.aimLine.fillStyle(0xffd76a, 0.9);
    this.aimLine.fillCircle(tx, ty, 5);
  }

  private releaseAim(p: Phaser.Input.Pointer): void {
    if (!this.aiming) return;
    this.aiming = false;
    this.aimLine.clear();

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
      restitution: 0.88,
      friction: 0.01,
      frictionAir: 0.0008,
      label: "ball",
    });
    this.matter.body.setVelocity(body, { x: Math.cos(angle) * power, y: Math.sin(angle) * power });
    this.ball = body;
    this.ballGfx = this.add.circle(LAUNCHER.x, LAUNCHER.y, BALL_RADIUS, 0x6ee7ff);
    this.settleCounter = 0;

    this.ballsLeft -= 1;
    this.shotHits = 0;
    this.hudBalls.setText(`Bolas: ${this.ballsLeft}`);
    this.hudHits.setText("");
  }

  private handleCollision(a: MatterJS.BodyType, b: MatterJS.BodyType): void {
    if (a.label !== "ball" || b.label !== "peg") return;
    const peg = this.pegs.find((pg) => pg.body === b);
    if (!peg || peg.hp <= 0) return;

    peg.hp -= 1;
    this.shotHits += 1;
    this.score += HIT_SCORE;

    if (peg.hp <= 0) {
      this.score += DESTROY_BONUS;
      this.matter.world.remove(peg.body);
      this.tweens.add({
        targets: peg.gfx,
        alpha: 0,
        scale: 1.4,
        duration: 180,
        onComplete: () => peg.gfx.destroy(),
      });
    } else {
      peg.gfx.setFillStyle(this.colorForHp(peg.hp, peg.maxHp));
      this.tweens.add({ targets: peg.gfx, scale: 1.15, duration: 60, yoyo: true });
    }

    this.hudScore.setText(`Pontos: ${this.score}`);
    this.hudHits.setText(this.shotHits > 1 ? `Combo: ${this.shotHits}x` : "");
  }

  update(): void {
    if (this.gameEnded) return;

    if (this.ball) {
      this.ballGfx.setPosition(this.ball.position.x, this.ball.position.y);

      const speed = Math.hypot(this.ball.velocity.x, this.ball.velocity.y);
      const drained = this.ball.position.y > HEIGHT + 40;
      if (drained) {
        this.removeBall();
      } else if (speed < SETTLE_SPEED) {
        this.settleCounter += 1;
        if (this.settleCounter > SETTLE_FRAMES) this.removeBall();
      } else {
        this.settleCounter = 0;
      }
    }

    const pegsLeft = this.pegs.filter((pg) => pg.hp > 0).length;
    if (!this.ball && !this.gameEnded) {
      if (pegsLeft === 0) {
        this.score += CLEAR_BONUS;
        this.hudScore.setText(`Pontos: ${this.score}`);
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
    this.ball = null;
  }

  private endGame(message: string): void {
    this.gameEnded = true;
    this.hudMessage.setText(`${message}\n\ntoque para reiniciar`);
    this.input.once("pointerdown", () => this.scene.restart());
  }
}
