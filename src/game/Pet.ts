export type Stage = "egg" | "baby" | "child" | "teen" | "adult";
export type Mood = "great" | "good" | "poor";

export interface PetState {
  name: string;
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
}

export const STAGE_ORDER: Stage[] = ["egg", "baby", "child", "teen", "adult"];

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

export function createNewPet(name: string): PetState {
  const now = Date.now();
  return {
    name,
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
  return { ...state, hunger: clamp(state.hunger + 25) };
}

export function play(state: PetState): PetState {
  if (state.isDead || state.isSleeping) return state;
  return {
    ...state,
    happiness: clamp(state.happiness + 20),
    energy: clamp(state.energy - 8),
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

export function getMood(state: PetState): Mood {
  const avg = state.careSamples > 0 ? state.careSum / state.careSamples : (state.hunger + state.happiness + state.health) / 3;
  if (avg >= 66) return "great";
  if (avg >= 33) return "good";
  return "poor";
}
