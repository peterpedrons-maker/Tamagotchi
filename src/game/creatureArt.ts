import Phaser from "phaser";
import type { Mood, Stage } from "./Pet";

const MOOD_COLORS: Record<Mood, number> = {
  great: 0x7ee787,
  good: 0xffd166,
  poor: 0xff6b6b,
};

const STAGE_RADIUS: Record<Stage, number> = {
  egg: 46,
  baby: 50,
  child: 60,
  teen: 72,
  adult: 84,
};

function textureKey(stage: Stage, mood: Mood, sick: boolean, sleeping: boolean): string {
  return `pet-${stage}-${mood}-${sick ? "sick" : "ok"}-${sleeping ? "sleep" : "awake"}`;
}

/** Procedurally draws (and caches) a texture for the given creature state. */
export function ensureCreatureTexture(
  scene: Phaser.Scene,
  stage: Stage,
  mood: Mood,
  sick: boolean,
  sleeping: boolean
): string {
  const key = textureKey(stage, mood, sick, sleeping);
  if (scene.textures.exists(key)) return key;

  const size = 220;
  const cx = size / 2;
  const cy = size / 2;
  const g = scene.add.graphics();

  const bodyColor = sick ? 0x9aa5b1 : MOOD_COLORS[mood];
  const radius = STAGE_RADIUS[stage];

  if (stage === "egg") {
    g.fillStyle(0xf5f0e6, 1);
    g.fillEllipse(cx, cy, radius * 1.5, radius * 1.9);
    g.lineStyle(4, 0xd8cfb8, 1);
    g.strokeEllipse(cx, cy, radius * 1.5, radius * 1.9);
    g.fillStyle(bodyColor, 0.5);
    g.fillEllipse(cx, cy + 10, radius * 0.9, radius * 1.1);
    g.lineStyle(3, 0x333333, 1);
    g.beginPath();
    g.moveTo(cx - 10, cy - 20);
    g.lineTo(cx + 5, cy - 5);
    g.lineTo(cx - 5, cy + 5);
    g.lineTo(cx + 12, cy + 22);
    g.strokePath();
  } else {
    // Body
    g.fillStyle(bodyColor, 1);
    g.fillCircle(cx, cy, radius);
    g.lineStyle(4, 0x1f2937, 0.5);
    g.strokeCircle(cx, cy, radius);

    // Ears/antenna for later stages
    if (stage === "teen" || stage === "adult") {
      g.fillStyle(bodyColor, 1);
      g.fillCircle(cx - radius * 0.6, cy - radius * 0.85, radius * 0.22);
      g.fillCircle(cx + radius * 0.6, cy - radius * 0.85, radius * 0.22);
    }
    if (stage === "adult") {
      g.fillStyle(0xffffff, 1);
      g.fillCircle(cx, cy - radius - 6, 6);
      g.lineStyle(3, 0x1f2937, 1);
      g.beginPath();
      g.moveTo(cx, cy - radius);
      g.lineTo(cx, cy - radius - 6);
      g.strokePath();
    }

    // Eyes
    const eyeOffsetX = radius * 0.38;
    const eyeOffsetY = -radius * 0.1;
    if (sleeping) {
      g.lineStyle(3, 0x1f2937, 1);
      g.beginPath();
      g.moveTo(cx - eyeOffsetX - 8, cy + eyeOffsetY);
      g.lineTo(cx - eyeOffsetX + 8, cy + eyeOffsetY);
      g.moveTo(cx + eyeOffsetX - 8, cy + eyeOffsetY);
      g.lineTo(cx + eyeOffsetX + 8, cy + eyeOffsetY);
      g.strokePath();
    } else {
      g.fillStyle(0x1f2937, 1);
      g.fillCircle(cx - eyeOffsetX, cy + eyeOffsetY, sick ? 5 : 7);
      g.fillCircle(cx + eyeOffsetX, cy + eyeOffsetY, sick ? 5 : 7);
    }

    // Mouth
    g.lineStyle(3, 0x1f2937, 1);
    g.beginPath();
    if (sick && !sleeping) {
      g.moveTo(cx - 12, cy + radius * 0.35 + 6);
      g.lineTo(cx + 12, cy + radius * 0.35 - 6);
    } else if (mood === "great" && !sleeping) {
      g.arc(cx, cy + radius * 0.25, radius * 0.3, 0, Math.PI, false);
    } else {
      g.moveTo(cx - 10, cy + radius * 0.35);
      g.lineTo(cx + 10, cy + radius * 0.35);
    }
    g.strokePath();

    if (sick && !sleeping) {
      // small sweat drop
      g.fillStyle(0x60a5fa, 1);
      g.fillCircle(cx + radius * 0.7, cy - radius * 0.4, 6);
    }
  }

  g.generateTexture(key, size, size);
  g.destroy();
  return key;
}
