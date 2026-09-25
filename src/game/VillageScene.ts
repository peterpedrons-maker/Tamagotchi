import Phaser from "phaser";

/**
 * First pass at the Zelda-style top-down village: a walkable map with
 * simple collidable buildings/trees, a placeholder hero (no real art yet),
 * camera follow, and both keyboard (desktop) and a virtual joystick
 * (touch) for movement.
 */

const TILE = 32;
const MAP_W = 40;
const MAP_H = 28;
const WORLD_W = MAP_W * TILE;
const WORLD_H = MAP_H * TILE;

const PLAYER_SPEED = 160;

interface Building {
  x: number;
  y: number;
  w: number;
  h: number;
  roof: number;
  wall: number;
}

interface Tree {
  x: number;
  y: number;
  r: number;
}

const BUILDINGS: Building[] = [
  { x: 180, y: 220, w: 140, h: 110, wall: 0xb5793a, roof: 0x7a3b2e },
  { x: 900, y: 200, w: 160, h: 120, wall: 0xa8703a, roof: 0x6b3a2a },
  { x: 220, y: 560, w: 150, h: 110, wall: 0xb5793a, roof: 0x7a3b2e },
  { x: 860, y: 600, w: 140, h: 110, wall: 0xa8703a, roof: 0x6b3a2a },
  { x: 540, y: 120, w: 170, h: 120, wall: 0x9a6a3a, roof: 0x5c3324 },
];

function randInt(min: number, max: number): number {
  return Math.floor(min + Math.random() * (max - min + 1));
}

const TREES: Tree[] = (() => {
  const list: Tree[] = [];
  for (let i = 0; i < 42; i++) {
    const x = randInt(40, WORLD_W - 40);
    const y = randInt(40, WORLD_H - 40);
    // keep trees out of the central plaza and off the buildings
    const dCenter = Math.hypot(x - WORLD_W / 2, y - WORLD_H / 2);
    if (dCenter < 260) continue;
    const overlapsBuilding = BUILDINGS.some((b) => x > b.x - 40 && x < b.x + b.w + 40 && y > b.y - 40 && y < b.y + b.h + 40);
    if (overlapsBuilding) continue;
    list.push({ x, y, r: randInt(14, 20) });
  }
  return list;
})();

export class VillageScene extends Phaser.Scene {
  private player!: Phaser.Physics.Arcade.Sprite;
  private obstacles!: Phaser.Physics.Arcade.StaticGroup;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private keysWASD!: { w: Phaser.Input.Keyboard.Key; a: Phaser.Input.Keyboard.Key; s: Phaser.Input.Keyboard.Key; d: Phaser.Input.Keyboard.Key };
  private facing: "up" | "down" | "left" | "right" = "down";

  private joystickBase!: Phaser.GameObjects.Arc;
  private joystickKnob!: Phaser.GameObjects.Arc;
  private joystickPointerId: number | null = null;
  private joystickVector = new Phaser.Math.Vector2(0, 0);
  private readonly joystickRadius = 46;
  private joystickOrigin = new Phaser.Math.Vector2(0, 0);

  constructor() {
    super("village");
  }

  create(): void {
    this.buildGround();
    this.buildDecor();
    this.buildPlayer();
    this.buildJoystick();

    this.cameras.main.setBounds(0, 0, WORLD_W, WORLD_H);
    this.cameras.main.startFollow(this.player, true, 0.12, 0.12);
    this.physics.world.setBounds(0, 0, WORLD_W, WORLD_H);

    this.cursors = this.input.keyboard!.createCursorKeys();
    this.keysWASD = this.input.keyboard!.addKeys("w,a,s,d") as typeof this.keysWASD;
  }

  private buildGround(): void {
    const g = this.add.graphics();
    // base grass
    g.fillStyle(0x2f5c31, 1);
    g.fillRect(0, 0, WORLD_W, WORLD_H);

    // subtle grass texture speckles
    g.fillStyle(0x376b3a, 1);
    for (let i = 0; i < 900; i++) {
      g.fillRect(randInt(0, WORLD_W), randInt(0, WORLD_H), 3, 3);
    }

    // dirt plaza + paths connecting to each building
    g.fillStyle(0xa98457, 1);
    g.fillCircle(WORLD_W / 2, WORLD_H / 2, 150);
    for (const b of BUILDINGS) {
      const doorX = b.x + b.w / 2;
      const doorY = b.y + b.h;
      g.beginPath();
      const points = this.pathQuad(doorX, doorY, WORLD_W / 2, WORLD_H / 2, 22);
      g.fillPoints(points, true);
    }

    // world border (just visual, matches physics bounds)
    g.lineStyle(4, 0x14301a, 1);
    g.strokeRect(2, 2, WORLD_W - 4, WORLD_H - 4);
  }

  /** A simple straight quad "road" between two points with the given half-width, for the dirt paths. */
  private pathQuad(x1: number, y1: number, x2: number, y2: number, halfWidth: number): Phaser.Geom.Point[] {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const len = Math.hypot(dx, dy) || 1;
    const nx = (-dy / len) * halfWidth;
    const ny = (dx / len) * halfWidth;
    return [
      new Phaser.Geom.Point(x1 + nx, y1 + ny),
      new Phaser.Geom.Point(x2 + nx, y2 + ny),
      new Phaser.Geom.Point(x2 - nx, y2 - ny),
      new Phaser.Geom.Point(x1 - nx, y1 - ny),
    ];
  }

  private buildDecor(): void {
    this.obstacles = this.physics.add.staticGroup();
    const g = this.add.graphics();

    for (const t of TREES) {
      g.fillStyle(0x1d3d1f, 1);
      g.fillCircle(t.x, t.y + 4, t.r * 0.55);
      g.fillStyle(0x2f6b34, 1);
      g.fillCircle(t.x, t.y - 6, t.r);
      g.fillStyle(0x4c3423, 1);
      g.fillRect(t.x - 3, t.y + 2, 6, 14);

      const zone = this.add.zone(t.x, t.y + 6, t.r * 1.1, t.r * 0.9);
      this.physics.add.existing(zone, true);
      this.obstacles.add(zone);
    }

    for (const b of BUILDINGS) {
      g.fillStyle(b.wall, 1);
      g.fillRect(b.x, b.y + 30, b.w, b.h - 30);
      g.fillStyle(b.roof, 1);
      g.fillTriangle(b.x - 10, b.y + 34, b.x + b.w + 10, b.y + 34, b.x + b.w / 2, b.y - 20);
      g.fillStyle(0x3a2418, 1);
      g.fillRect(b.x + b.w / 2 - 14, b.y + b.h - 34, 28, 34);
      g.fillStyle(0xf2d98a, 1);
      g.fillRect(b.x + 16, b.y + 50, 16, 16);
      g.fillRect(b.x + b.w - 32, b.y + 50, 16, 16);

      const zone = this.add.zone(b.x + b.w / 2, b.y + 30 + (b.h - 30) / 2, b.w, b.h - 30);
      this.physics.add.existing(zone, true);
      this.obstacles.add(zone);
    }

    // well in the plaza
    g.fillStyle(0x6b6b6b, 1);
    g.fillCircle(WORLD_W / 2, WORLD_H / 2, 26);
    g.fillStyle(0x2a4d78, 1);
    g.fillCircle(WORLD_W / 2, WORLD_H / 2, 19);
    g.lineStyle(4, 0x4a4a4a, 1);
    g.strokeCircle(WORLD_W / 2, WORLD_H / 2, 26);
    const wellZone = this.add.zone(WORLD_W / 2, WORLD_H / 2, 46, 46);
    this.physics.add.existing(wellZone, true);
    this.obstacles.add(wellZone);
  }

  private buildPlayer(): void {
    this.drawHeroTexture();
    this.player = this.physics.add.sprite(WORLD_W / 2, WORLD_H / 2 + 80, "hero-down");
    this.player.setSize(18, 14).setOffset(15, 28);
    this.player.setDepth(3);
    this.physics.add.collider(this.player, this.obstacles);
  }

  /** Draws a simple placeholder hero (no real art yet) as 4 directional textures. */
  private drawHeroTexture(): void {
    const dirs: Array<{ key: string; facing: "down" | "up" | "left" | "right" }> = [
      { key: "hero-down", facing: "down" },
      { key: "hero-up", facing: "up" },
      { key: "hero-left", facing: "left" },
      { key: "hero-right", facing: "right" },
    ];
    for (const { key, facing } of dirs) {
      const g = this.make.graphics({ x: 0, y: 0 }, false);
      g.fillStyle(0x000000, 0.25);
      g.fillEllipse(24, 42, 22, 8);
      g.fillStyle(0x3f6fb0, 1);
      g.fillRoundedRect(12, 18, 24, 22, 6);
      g.fillStyle(0xffd7ae, 1);
      g.fillCircle(24, 14, 11);
      g.fillStyle(0x6b4324, 1);
      g.fillRect(13, 5, 22, 8);

      g.fillStyle(0x1c1c1c, 1);
      if (facing === "down") {
        g.fillCircle(19, 14, 1.6);
        g.fillCircle(29, 14, 1.6);
      } else if (facing === "up") {
        g.fillStyle(0x6b4324, 1);
        g.fillRect(13, 5, 22, 14);
      } else if (facing === "left") {
        g.fillCircle(18, 14, 1.6);
      } else {
        g.fillCircle(30, 14, 1.6);
      }

      g.generateTexture(key, 48, 48);
      g.destroy();
    }
  }

  private buildJoystick(): void {
    const margin = 90;
    this.joystickOrigin.set(margin, this.scale.height - margin);

    this.joystickBase = this.add.circle(this.joystickOrigin.x, this.joystickOrigin.y, this.joystickRadius, 0xffffff, 0.12);
    this.joystickBase.setScrollFactor(0).setDepth(20).setStrokeStyle(2, 0xffffff, 0.35);
    this.joystickKnob = this.add.circle(this.joystickOrigin.x, this.joystickOrigin.y, 22, 0xffffff, 0.28);
    this.joystickKnob.setScrollFactor(0).setDepth(21);

    this.input.on("pointerdown", (p: Phaser.Input.Pointer) => {
      if (this.joystickPointerId !== null) return;
      if (p.x > this.scale.width * 0.55) return; // reserve right side for future actions (attack, etc.)
      this.joystickPointerId = p.id;
      this.joystickOrigin.set(p.x, p.y);
      this.joystickBase.setPosition(p.x, p.y);
      this.joystickKnob.setPosition(p.x, p.y);
    });

    this.input.on("pointermove", (p: Phaser.Input.Pointer) => {
      if (p.id !== this.joystickPointerId) return;
      const dx = p.x - this.joystickOrigin.x;
      const dy = p.y - this.joystickOrigin.y;
      const dist = Math.min(this.joystickRadius, Math.hypot(dx, dy));
      const angle = Math.atan2(dy, dx);
      const kx = this.joystickOrigin.x + Math.cos(angle) * dist;
      const ky = this.joystickOrigin.y + Math.sin(angle) * dist;
      this.joystickKnob.setPosition(kx, ky);
      this.joystickVector.set(Math.cos(angle) * (dist / this.joystickRadius), Math.sin(angle) * (dist / this.joystickRadius));
    });

    const release = (p: Phaser.Input.Pointer) => {
      if (p.id !== this.joystickPointerId) return;
      this.joystickPointerId = null;
      this.joystickVector.set(0, 0);
      this.joystickKnob.setPosition(this.joystickOrigin.x, this.joystickOrigin.y);
    };
    this.input.on("pointerup", release);
    this.input.on("pointerupoutside", release);
  }

  update(): void {
    const move = new Phaser.Math.Vector2(0, 0);

    if (this.cursors.left.isDown || this.keysWASD.a.isDown) move.x -= 1;
    if (this.cursors.right.isDown || this.keysWASD.d.isDown) move.x += 1;
    if (this.cursors.up.isDown || this.keysWASD.w.isDown) move.y -= 1;
    if (this.cursors.down.isDown || this.keysWASD.s.isDown) move.y += 1;

    if (move.lengthSq() === 0 && this.joystickVector.lengthSq() > 0.01) {
      move.set(this.joystickVector.x, this.joystickVector.y);
    } else if (move.lengthSq() > 0) {
      move.normalize();
    }

    this.player.setVelocity(move.x * PLAYER_SPEED, move.y * PLAYER_SPEED);

    if (move.lengthSq() > 0.01) {
      if (Math.abs(move.x) > Math.abs(move.y)) this.facing = move.x > 0 ? "right" : "left";
      else this.facing = move.y > 0 ? "down" : "up";
    }
    this.player.setTexture(`hero-${this.facing}`);
  }
}
