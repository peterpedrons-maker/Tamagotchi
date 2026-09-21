import Phaser from "phaser";
import { STAGE_ORDER, type Mood, type Stage } from "../Pet";
import type { CreatureType } from "../CreatureType";
import { ensureCreatureTexture, CREATURE_PIXEL_SIZE } from "../creatureArt";

// The creature texture is baked at CREATURE_PIXEL_SIZE (a small pixel grid) so it
// renders crisp and blocky with the game's pixelArt mode; scale up to compensate.
const DISPLAY_SCALE = 220 / CREATURE_PIXEL_SIZE;

export interface PetVisual {
  stage: Stage;
  type: CreatureType;
  mood: Mood;
  isSick: boolean;
  isSleeping: boolean;
}

export class MainScene extends Phaser.Scene {
  private sprite!: Phaser.GameObjects.Image;
  private pending: PetVisual | null = null;

  constructor() {
    super("MainScene");
  }

  create(): void {
    const defaultKey = ensureCreatureTexture(this, "egg", "fera", "good", false, false);
    this.sprite = this.add.image(150, 160, defaultKey).setOrigin(0.5);
    this.tweens.add({
      targets: this.sprite,
      y: "+=8",
      duration: 1400,
      yoyo: true,
      repeat: -1,
      ease: "sine.inOut",
    });

    if (this.pending) {
      this.applyVisual(this.pending);
    }
  }

  /** Called from outside the scene whenever the pet's visual state changes. */
  setVisual(visual: PetVisual): void {
    if (!this.sprite) {
      this.pending = visual;
      return;
    }
    this.applyVisual(visual);
  }

  private applyVisual(visual: PetVisual): void {
    const key = ensureCreatureTexture(this, visual.stage, visual.type, visual.mood, visual.isSick, visual.isSleeping);
    this.sprite.setTexture(key);
    const baseScale = visual.stage === "egg" ? 0.75 : 0.6 + STAGE_ORDER.indexOf(visual.stage) * 0.12;
    this.sprite.setScale(baseScale * DISPLAY_SCALE);
  }
}
