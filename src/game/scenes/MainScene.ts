import Phaser from "phaser";
import { STAGE_ORDER, type Mood, type Stage } from "../Pet";
import type { CreatureType } from "../CreatureType";
import { ensureCreatureTexture } from "../creatureArt";

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
    const scale = visual.stage === "egg" ? 0.75 : 0.6 + STAGE_ORDER.indexOf(visual.stage) * 0.12;
    this.sprite.setScale(scale);
  }
}
