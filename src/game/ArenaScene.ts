import Phaser from "phaser";

/**
 * First physics slice: a static level with a launcher, drag-to-aim
 * slingshot-style shot, a ball that bounces for real (Matter.js, bundled
 * with Phaser) off walls and pegs, and a turn counter. Everything is
 * placeholder shapes — the point here is proving the bounce feels good
 * before any art or scoring/combo systems go on top.
 */

const WIDTH = 480;
const HEIGHT = 800;
const LAUNCHER = { x: WIDTH / 2, y: 70 };
const BALL_RADIUS = 10;
const MAX_TURNS = 15;
const MIN_DRAG = 20;
const MAX_DRAG = 140;
const MIN_SPEED = 6;
const MAX_SPEED = 20;
const SETTLE_SPEED = 0.15;
const SETTLE_FRAMES = 40;

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
  private aimStart = new Phaser.Math.Vector2();
  private settleCounter = 0;

  private turnsLeft = MAX_TURNS;
  private hudTurns!: Phaser.GameObjects.Text;
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
    this.turnsLeft = MAX_TURNS;
    this.shotHits = 0;
    this.gameEnded = false;

    this.matter.world.setBounds(0, 0, WIDTH, HEIGHT, 32);
    this.cameras.main.setBackgroundColor("#161a2e");

    this.buildPegs();

    this.add.circle(LAUNCHER.x, LAUNCHER.y, 14, 0xffd76a);
    this.aimLine = this.add.graphics();

    this.hudTurns = this.add.text(16, 14, `Tiros: ${this.turnsLeft}`, {
      fontFamily: "system-ui, sans-serif",
      fontSize: "20px",
      color: "#f3f7ff",
      fontStyle: "800",
    });
    this.hudHits = this.add.text(16, 42, "", {
      fontFamily: "system-ui, sans-serif",
      fontSize: "14px",
      color: "#9fe0a8",
      fontStyle: "700",
    });
    this.hudMessage = this.add
      .text(WIDTH / 2, HEIGHT / 2, "", {
        fontFamily: "system-ui, sans-serif",
        fontSize: "32px",
        color: "#ffffff",
        fontStyle: "800",
        align: "center",
      })
      .setOrigin(0.5)
      .setDepth(20)
      .setShadow(0, 2, "#000", 6, true, true);

    this.input.on("pointerdown", (p: Phaser.Input.Pointer) => this.startAim(p));
    this.input.on("pointermove", (p: Phaser.Input.Pointer) => this.updateAim(p));
    this.input.on("pointerup", (p: Phaser.Input.Pointer) => this.releaseAim(p));

    this.matter.world.on("collisionstart", (event: Phaser.Physics.Matter.Events.CollisionStartEvent) => {
      for (const pair of event.pairs) {
        this.handleCollision(pair.bodyA, pair.bodyB);
        this.handleCollision(pair.bodyB, pair.bodyA);
      }
    });
  }

  private buildPegs(): void {
    const layout: Array<{ x: number; y: number; hp: number }> = [
      { x: 120, y: 220, hp: 1 },
      { x: 240, y: 180, hp: 1 },
      { x: 360, y: 220, hp: 1 },
      { x: 90, y: 320, hp: 1 },
      { x: 390, y: 320, hp: 1 },
      { x: 180, y: 340, hp: 2 },
      { x: 300, y: 340, hp: 2 },
      { x: 240, y: 420, hp: 3 },
      { x: 150, y: 460, hp: 1 },
      { x: 330, y: 460, hp: 1 },
      { x: 240, y: 550, hp: 2 },
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

  private startAim(p: Phaser.Input.Pointer): void {
    if (this.ball || this.turnsLeft <= 0 || this.gameEnded) return;
    this.aiming = true;
    this.aimStart.set(p.x, p.y);
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

    this.turnsLeft -= 1;
    this.shotHits = 0;
    this.hudTurns.setText(`Tiros: ${this.turnsLeft}`);
    this.hudHits.setText("");
  }

  private handleCollision(a: MatterJS.BodyType, b: MatterJS.BodyType): void {
    if (a.label !== "ball" || b.label !== "peg") return;
    const peg = this.pegs.find((pg) => pg.body === b);
    if (!peg || peg.hp <= 0) return;

    peg.hp -= 1;
    this.shotHits += 1;
    this.hudHits.setText(`Acertos neste tiro: ${this.shotHits}`);

    if (peg.hp <= 0) {
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
  }

  update(): void {
    if (this.gameEnded) return;

    if (this.ball) {
      this.ballGfx.setPosition(this.ball.position.x, this.ball.position.y);

      const speed = Math.hypot(this.ball.velocity.x, this.ball.velocity.y);
      const outOfBounds = this.ball.position.y > HEIGHT + 40;
      if (outOfBounds) {
        this.removeBall();
      } else if (speed < SETTLE_SPEED) {
        this.settleCounter += 1;
        if (this.settleCounter > SETTLE_FRAMES) this.removeBall();
      } else {
        this.settleCounter = 0;
      }
    }

    const pegsLeft = this.pegs.filter((pg) => pg.hp > 0).length;
    if (!this.ball && pegsLeft === 0) {
      this.endGame("Fase completa!");
    } else if (!this.ball && this.turnsLeft <= 0 && pegsLeft > 0) {
      this.endGame("Sem tiros — tente de novo");
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
