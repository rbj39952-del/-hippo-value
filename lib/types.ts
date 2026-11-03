export type FactorKey = "categorie" | "poids" | "corde" | "distance" | "terrain" | "forme" | "chrono";
export type Coefficients = Record<FactorKey, number>;

export const FACTORS: { key: FactorKey; label: string }[] = [
  { key: "categorie", label: "Changement de catégorie" },
  { key: "poids", label: "Poids / Valeur" },
  { key: "corde", label: "Facteur corde" },
  { key: "distance", label: "Aptitude distance" },
  { key: "terrain", label: "Aptitude terrain" },
  { key: "forme", label: "Forme / Musique" },
  { key: "chrono", label: "Chronos / Vitesses" },
];

export const DEFAULT_COEFFS: Coefficients = {
  categorie: 2, poids: 1.5, corde: 1, distance: 1.5, terrain: 2, forme: 1.5, chrono: 1.5,
};

// Malchance : bonus 0..+5 uniquement, ajouté directement au score (aucun malus)
export const MALCHANCE_LEVELS = [
  { v: 0, hint: "Parcours normal, sans incident" },
  { v: 1, hint: "Incident léger (effort ponctuel, léger écart)" },
  { v: 2, hint: "Incident léger (effort ponctuel, léger écart)" },
  { v: 3, hint: "Effort superflu avéré (3e épaisseur, nez au vent)" },
  { v: 4, hint: "Malchance majeure (gêné, enfermé, chute devant)" },
  { v: 5, hint: "Malchance majeure (gêné, enfermé, chute devant)" },
] as const;

/** Résultat de l'analyse IA : note + justification d'une ligne, par facteur. */
export type AiResult = Record<FactorKey | "malchance", { note: number; reason: string }>;

export interface Runner {
  id: string;
  name: string;
  weight: string;
  marketOdds: string;
  sheet: string; // fiche Equidia collée
  ai?: AiResult; // dernière analyse IA (les curseurs restent modifiables)
  notes: Record<FactorKey, number>;
  malchance: number;
}

export interface Race {
  name: string;
  track: string;
  distance: string;
  discipline: "Plat" | "Obstacles";
  going: string;
}

export interface RunnerResult {
  id: string;
  name: string;
  score: number;
  winPct: number;
  top3Pct: number;
  fairOdds: number;
  marketOdds?: number;
  edgePct?: number;
  isValue: boolean;
}
