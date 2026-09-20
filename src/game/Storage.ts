import type { PetState } from "./Pet";
import { rollCreatureType } from "./CreatureType";

const STORAGE_KEY = "tamagotchi-save-v1";

export function loadPet(): PetState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<PetState>;
    return { coins: 50, type: rollCreatureType(), ...parsed } as PetState;
  } catch {
    return null;
  }
}

export function savePet(state: PetState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Storage unavailable (private mode, quota, etc.) — ignore, game still works in-session.
  }
}

export function clearPet(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}
