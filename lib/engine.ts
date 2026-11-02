import { Coefficients, FACTORS, Runner, RunnerResult } from "./types";

export const clamp = (x: number, a: number, b: number) => Math.min(b, Math.max(a, x));

/** Score = Σ(note × coef) + bonus malchance (0..5, direct, jamais négatif). */
export function weightedScore(r: Runner, c: Coefficients): number {
  const base = FACTORS.reduce((s, f) => s + clamp(r.notes[f.key], -5, 5) * c[f.key], 0);
  return base + clamp(Math.round(r.malchance), 0, 5);
}

export function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Bruit gaussien N(0,1) (Box-Muller). */
export function gaussian(rnd: () => number) {
  const u = Math.max(rnd(), 1e-12);
  const v = rnd();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

export interface SimOutput {
  wins: number[];
  top3: number[];
  runs: number;
}

/** Monte Carlo : perf = score + σ·N(0,1), classement, comptage victoires et Top 3. */
export function simulate(scores: number[], runs = 5000, sigma = 8, seed?: number): SimOutput {
  const n = scores.length;
  const rnd = seed === undefined ? Math.random : mulberry32(seed);
  const wins = new Array(n).fill(0);
  const top3 = new Array(n).fill(0);
  const podium = Math.min(3, n);
  const idx = Array.from({ length: n }, (_, i) => i);
  const perf = new Array(n).fill(0);
  for (let k = 0; k < runs; k++) {
    for (let i = 0; i < n; i++) perf[i] = scores[i] + sigma * gaussian(rnd);
    idx.sort((a, b) => perf[b] - perf[a]);
    wins[idx[0]]++;
    for (let p = 0; p < podium; p++) top3[idx[p]]++;
  }
  return { wins, top3, runs };
}

export function buildReport(runners: Runner[], scores: number[], out: SimOutput): RunnerResult[] {
  return runners
    .map((r, i): RunnerResult => {
      const winPct = (out.wins[i] / out.runs) * 100;
      const top3Pct = (out.top3[i] / out.runs) * 100;
      const fairOdds = winPct > 0 ? 100 / winPct : Infinity;
      const market = parseFloat(r.marketOdds.replace(",", "."));
      const hasMarket = Number.isFinite(market) && market > 1;
      const edgePct = hasMarket ? ((winPct / 100) * market - 1) * 100 : undefined;
      return {
        id: r.id,
        name: r.name || "Cheval",
        score: scores[i],
        winPct,
        top3Pct,
        fairOdds,
        marketOdds: hasMarket ? market : undefined,
        edgePct,
        isValue: hasMarket && winPct > 0 && market > fairOdds,
      };
    })
    .sort((a, b) => b.winPct - a.winPct);
}
