import { type CreatureType, type StatKey, TYPE_INFO, rollCreatureType } from "./CreatureType";

export type Stage = "egg" | "baby" | "child" | "teen" | "adult";
export type Mood = "great" | "good" | "poor";

export interface PetState {
  name: string;
  type: CreatureType;
  stage: Stage;
  birthTime: number;
  lastUpdate: number;
  hunger: number;
  happiness: number;
  health: number;
  energy: number;
  isSleeping: boolean;
  isSick: boolean;
  careSum: number;
  careSamples: number;
  isDead: boolean;
  coins: number;
}

export interface Attributes {
  attack: number;
  defense: number;
  speed: number;
  intelligence: number;
}

export const STAGE_ORDER: Stage[] = ["egg", "baby", "child", "teen", "adult"];

export const STAGE_LABEL: Record<Stage, string> = {
  egg: "Ovo",
  baby: "Bebê",
  child: "Criança",
  teen: "Adolescente",
  adult: "Adulto",
};

// Duration (ms) a pet stays in each stage before advancing to the next one.
export const STAGE_DURATIONS: Record<Stage, number> = {
  egg: 60_000, // 1 min
  baby: 3 * 60_000, // 3 min
  child: 5 * 60_000, // 5 min
  teen: 8 * 60_000, // 8 min
  adult: Number.POSITIVE_INFINITY,
};

// Decay rates: points lost per millisecond while awake.
const HUNGER_DECAY_PER_MS = 1 / 18_000; // -1 every 18s
const HAPPINESS_DECAY_PER_MS = 1 / 22_000; // -1 every 22s
const ENERGY_DECAY_PER_MS = 1 / 28_000; // -1 every 28s while awake
const ENERGY_RECOVER_PER_MS_SLEEPING = 1 / 9_000; // +1 every 9s while asleep

const GIFT_COST = 15;

export function createNewPet(name: string): PetState {
  const now = Date.now();
  return {
    name,
    type: rollCreatureType(),
    stage: "egg",
    birthTime: now,
    lastUpdate: now,
    hunger: 100,
    happiness: 100,
    health: 100,
    energy: 100,
    isSleeping: false,
    isSick: false,
    careSum: 0,
    careSamples: 0,
    isDead: false,
    coins: 50,
  };
}

function clamp(value: number, min = 0, max = 100): number {
  return Math.max(min, Math.min(max, value));
}

/** Advances the pet's simulation by the elapsed time (ms), including offline time. */
export function tick(state: PetState, now: number): PetState {
  if (state.isDead) return state;

  const elapsed = Math.max(0, now - state.lastUpdate);
  if (elapsed === 0) return state;

  let { hunger, happiness, health, energy } = state;

  if (state.isSleeping) {
    energy = clamp(energy + elapsed * ENERGY_RECOVER_PER_MS_SLEEPING);
    // Hunger/happiness decay slower while sleeping.
    hunger = clamp(hunger - elapsed * HUNGER_DECAY_PER_MS * 0.3);
    happiness = clamp(happiness - elapsed * HAPPINESS_DECAY_PER_MS * 0.2);
  } else {
    hunger = clamp(hunger - elapsed * HUNGER_DECAY_PER_MS);
    happiness = clamp(happiness - elapsed * HAPPINESS_DECAY_PER_MS);
    energy = clamp(energy - elapsed * ENERGY_DECAY_PER_MS);
  }

  // Health suffers when hunger, happiness or energy bottom out.
  const neglectPenalty =
    (hunger <= 0 ? 1 : 0) + (happiness <= 0 ? 1 : 0) + (energy <= 0 ? 1 : 0);
  if (neglectPenalty > 0) {
    health = clamp(health - elapsed * (1 / 15_000) * neglectPenalty);
  } else if (hunger > 50 && happiness > 50 && energy > 20) {
    health = clamp(health + elapsed * (1 / 40_000));
  }

  const isSick = health < 30;

  // Sample care quality periodically to influence evolution appearance.
  const careScoreNow = (hunger + happiness + health) / 3;
  const careSum = state.careSum + careScoreNow * elapsed;
  const careSamples = state.careSamples + elapsed;

  const isDead = health <= 0;

  let stage = state.stage;
  const age = now - state.birthTime;
  const idx = STAGE_ORDER.indexOf(stage);
  if (idx < STAGE_ORDER.length - 1) {
    let cumulative = 0;
    for (let i = 0; i <= idx; i++) {
      cumulative += STAGE_DURATIONS[STAGE_ORDER[i]];
    }
    if (age >= cumulative) {
      stage = STAGE_ORDER[idx + 1];
    }
  }

  return {
    ...state,
    hunger,
    happiness,
    health,
    energy,
    isSick,
    careSum,
    careSamples,
    isDead,
    stage,
    lastUpdate: now,
  };
}

export function feed(state: PetState): PetState {
  if (state.isDead || state.isSleeping) return state;
  return { ...state, hunger: clamp(state.hunger + 25), coins: state.coins + 2 };
}

export function play(state: PetState): PetState {
  if (state.isDead || state.isSleeping) return state;
  return {
    ...state,
    happiness: clamp(state.happiness + 20),
    energy: clamp(state.energy - 8),
    coins: state.coins + 3,
  };
}

export function toggleSleep(state: PetState): PetState {
  if (state.isDead) return state;
  return { ...state, isSleeping: !state.isSleeping };
}

export function heal(state: PetState): PetState {
  if (state.isDead) return state;
  return { ...state, health: clamp(state.health + 30), isSick: state.health + 30 < 30 };
}

/** Cleans the pet, giving a small happiness/health boost. */
export function clean(state: PetState): PetState {
  if (state.isDead) return state;
  return {
    ...state,
    happiness: clamp(state.happiness + 8),
    health: clamp(state.health + 10),
  };
}

/** Spends coins on a gift for a bigger happiness boost. Returns state unchanged if too poor. */
export function gift(state: PetState): PetState {
  if (state.isDead || state.coins < GIFT_COST) return state;
  return {
    ...state,
    happiness: clamp(state.happiness + 30),
    coins: state.coins - GIFT_COST,
  };
}

export function getMood(state: PetState): Mood {
  const avg = state.careSamples > 0 ? state.careSum / state.careSamples : (state.hunger + state.happiness + state.health) / 3;
  if (avg >= 66) return "great";
  if (avg >= 33) return "good";
  return "poor";
}

/** Pet level: 1 per stage reached, plus progress within the current (non-adult) stage. */
export function getLevel(state: PetState): number {
  const stageIdx = STAGE_ORDER.indexOf(state.stage);
  return stageIdx * 2 + 1;
}

/** Progress (0-1) and duration (ms) of the current stage, for an XP-style bar. */
export function getStageProgress(state: PetState, now: number): { current: number; total: number } {
  const stageIdx = STAGE_ORDER.indexOf(state.stage);
  const total = STAGE_DURATIONS[state.stage];
  if (!Number.isFinite(total)) {
    return { current: 1, total: 1 };
  }
  let cumulative = 0;
  for (let i = 0; i < stageIdx; i++) {
    cumulative += STAGE_DURATIONS[STAGE_ORDER[i]];
  }
  const age = now - state.birthTime;
  const current = clamp(age - cumulative, 0, total);
  return { current, total };
}

const TYPE_FOCUS_BONUS = 1.35;

/** Cosmetic attributes derived from stage + care quality + the creature's fixed type focus. */
export function getAttributes(state: PetState): Attributes {
  const stageIdx = STAGE_ORDER.indexOf(state.stage);
  const base = 10 + stageIdx * 8;
  const careFactor = state.careSamples > 0 ? state.careSum / state.careSamples / 100 : 1;
  const focus = TYPE_INFO[state.type].focus;
  const bonus = (key: StatKey) => (focus.includes(key) ? TYPE_FOCUS_BONUS : 1);

  return {
    attack: Math.round(base * (0.9 + careFactor * 0.3) * bonus("attack")),
    defense: Math.round(base * 0.85 * (0.9 + careFactor * 0.3) * bonus("defense")),
    speed: Math.round((base * 0.7 + state.energy * 0.15) * bonus("speed")),
    intelligence: Math.round((base * 0.6 + state.happiness * 0.1) * bonus("intelligence")),
  };
}

export const GIFT_COST_VALUE = GIFT_COST;
