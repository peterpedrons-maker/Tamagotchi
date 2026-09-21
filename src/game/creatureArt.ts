import Phaser from "phaser";
import type { Mood, Stage } from "./Pet";
import type { CreatureType } from "./CreatureType";

// Placeholder procedural body colors per type — swapped out once real PNG art lands.
const TYPE_COLORS: Record<CreatureType, number> = {
  fera: 0xef6b4a,
  dragao: 0x2f9e6b,
  fada: 0xf19bd8,
  anjo: 0xf5eecb,
  primitivo: 0xa9793f,
  fantasma: 0x9fd6e8,
  demonio: 0x8b3fa8,
  celestial: 0xf3c94d,
};

const STAGE_RADIUS: Record<Stage, number> = {
  egg: 46,
  baby: 50,
  child: 60,
  teen: 72,
  adult: 84,
};

function textureKey(stage: Stage, type: CreatureType, mood: Mood, sick: boolean, sleeping: boolean): string {
  return `pet-${stage}-${type}-${mood}-${sick ? "sick" : "ok"}-${sleeping ? "sleep" : "awake"}`;
}

const FULL_SIZE = 220;
// Chunky, low-res pixel grid the smooth drawing gets downsampled to — combined with
// the game's pixelArt render mode, this gives the blocky 16-bit look without hand
// placing pixels. Swap this whole module out once real PNG art lands.
export const CREATURE_PIXEL_SIZE = 44;
const PIXEL_SCALE = FULL_SIZE / CREATURE_PIXEL_SIZE;

/** Procedurally draws (and caches) a texture for the given creature state. */
export function ensureCreatureTexture(
  scene: Phaser.Scene,
  stage: Stage,
  type: CreatureType,
  mood: Mood,
  sick: boolean,
  sleeping: boolean
): string {
  const key = textureKey(stage, type, mood, sick, sleeping);
  if (scene.textures.exists(key)) return key;

  const size = FULL_SIZE;
  const cx = size / 2;
  const cy = size / 2;
  const g = scene.add.graphics();

  const bodyColor = sick ? 0x9aa5b1 : TYPE_COLORS[type];
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

    // Mouth (mood still shows through the expression, even though color now follows type)
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

  const fullKey = `${key}-full`;
  g.generateTexture(fullKey, size, size);
  g.destroy();

  // Downsample the smooth drawing onto a small pixel grid, then let the game's
  // pixelArt (nearest-neighbor) scaling blow it back up crisp and blocky.
  const image = scene.add.image(0, 0, fullKey).setOrigin(0).setScale(1 / PIXEL_SCALE);
  const rt = scene.add.renderTexture(0, 0, CREATURE_PIXEL_SIZE, CREATURE_PIXEL_SIZE);
  rt.draw(image, 0, 0);
  rt.saveTexture(key);
  rt.destroy();
  image.destroy();
  scene.textures.remove(fullKey);

  return key;
}
