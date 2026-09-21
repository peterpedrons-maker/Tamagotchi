export type StatKey = "attack" | "defense" | "speed" | "intelligence";

export type CreatureType =
  | "fera"
  | "dragao"
  | "fada"
  | "anjo"
  | "primitivo"
  | "fantasma"
  | "demonio"
  | "celestial";

export type Rarity = "comum" | "raro";

export interface TypeInfo {
  label: string;
  rarity: Rarity;
  /** Attribute(s) this type gets a growth bonus on. Fixed for the creature's whole life. */
  focus: StatKey[];
  /** Relative weight used when rolling a type for a new egg. */
  weight: number;
}

export const STAT_LABEL: Record<StatKey, string> = {
  attack: "Ataque",
  defense: "Defesa",
  speed: "Velocidade",
  intelligence: "Inteligência",
};

export const TYPE_INFO: Record<CreatureType, TypeInfo> = {
  // Comuns — saem com mais frequência no sorteio do ovo, focam em 1 atributo.
  fera: { label: "Fera", rarity: "comum", focus: ["attack"], weight: 20 },
  dragao: { label: "Dragão", rarity: "comum", focus: ["defense"], weight: 20 },
  fada: { label: "Fada", rarity: "comum", focus: ["speed"], weight: 20 },
  anjo: { label: "Anjo", rarity: "comum", focus: ["intelligence"], weight: 20 },

  // Raros — chance bem menor, focam em 2 atributos.
  primitivo: { label: "Primitivo", rarity: "raro", focus: ["attack", "defense"], weight: 5 },
  fantasma: { label: "Fantasma", rarity: "raro", focus: ["defense", "speed"], weight: 5 },
  demonio: { label: "Demônio", rarity: "raro", focus: ["speed", "attack"], weight: 5 },
  celestial: { label: "Celestial", rarity: "raro", focus: ["intelligence", "defense"], weight: 5 },
};

export const CREATURE_TYPES = Object.keys(TYPE_INFO) as CreatureType[];
export const COMMON_CREATURE_TYPES = CREATURE_TYPES.filter((type) => TYPE_INFO[type].rarity === "comum");

/**
 * Rolls a random type for a newly created egg. The standard "new pet" flow (starting
 * out, or getting a new egg after your pet dies) only ever rolls a common type — rare
 * types have to be obtained some other way (not built yet), so pass `includeRare` only
 * from that future acquisition path.
 */
export function rollCreatureType(includeRare = false): CreatureType {
  const pool = includeRare ? CREATURE_TYPES : COMMON_CREATURE_TYPES;
  const total = pool.reduce((sum, type) => sum + TYPE_INFO[type].weight, 0);
  let roll = Math.random() * total;
  for (const type of pool) {
    const weight = TYPE_INFO[type].weight;
    if (roll < weight) return type;
    roll -= weight;
  }
  return pool[0];
}
