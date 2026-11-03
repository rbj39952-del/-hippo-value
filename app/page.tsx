"use client";
import { useMemo, useRef, useState } from "react";
import { RaceForm } from "@/components/RaceForm";
import { RunnerCard } from "@/components/RunnerCard";
import { Report } from "@/components/Report";
import { useSimulation } from "@/hooks/useSimulation";
import { analyzeRunner } from "@/lib/analyze";
import { buildReport, weightedScore } from "@/lib/engine";
import { Coefficients, DEFAULT_COEFFS, FACTORS, Race, Runner, RunnerResult } from "@/lib/types";

const RUNS = 5000;

const newRunner = (i: number): Runner => ({
  id: crypto.randomUUID(),
  name: `Cheval ${i + 1}`,
  weight: "",
  marketOdds: "",
  sheet: "",
  malchance: 0,
  notes: { categorie: 0, poids: 0, corde: 0, distance: 0, terrain: 0, forme: 0, chrono: 0 },
});

export default function Page() {
  const [race, setRace] = useState<Race>({ name: "", track: "", distance: "", discipline: "Plat", going: "" });
  const [runners, setRunners] = useState<Runner[]>(() => Array.from({ length: 8 }, (_, i) => newRunner(i)));
  const [coeffs, setCoeffs] = useState<Coefficients>(DEFAULT_COEFFS);
  const [sigma, setSigma] = useState(8);
  const [rows, setRows] = useState<RunnerResult[] | null>(null);
  const [busy, setBusy] = useState<Record<string, boolean>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { run, running } = useSimulation();

  const runnersRef = useRef(runners);
  runnersRef.current = runners;
  const raceRef = useRef(race);
  raceRef.current = race;

  const scores = useMemo(() => runners.map((r) => weightedScore(r, coeffs)), [runners, coeffs]);

  const setCount = (n: number) =>
    setRunners((prev) =>
      n > prev.length
        ? [...prev, ...Array.from({ length: n - prev.length }, (_, i) => newRunner(prev.length + i))]
        : prev.slice(0, n)
    );

  const analyzeOne = async (id: string) => {
    const r = runnersRef.current.find((x) => x.id === id);
    if (!r || r.sheet.trim().length < 20) return;
    setBusy((b) => ({ ...b, [id]: true }));
    setErrors((e) => ({ ...e, [id]: "" }));
    try {
      const ai = await analyzeRunner(r, raceRef.current, runnersRef.current.length);
      setRunners((p) =>
        p.map((x) =>
          x.id === id
            ? {
                ...x,
                ai,
                malchance: ai.malchance.note,
                notes: {
                  categorie: ai.categorie.note,
                  poids: ai.poids.note,
                  corde: ai.corde.note,
                  distance: ai.distance.note,
                  terrain: ai.terrain.note,
                  forme: ai.forme.note,
                  chrono: ai.chrono.note,
                },
              }
            : x
        )
      );
    } catch (err) {
      setErrors((e) => ({ ...e, [id]: err instanceof Error ? err.message : "Erreur inconnue" }));
    } finally {
      setBusy((b) => ({ ...b, [id]: false }));
    }
  };

  // Analyse tous les partants qui ont une fiche, 3 à la fois
  const analyzeAll = async () => {
    const todo = runnersRef.current.filter((r) => r.sheet.trim().length >= 20).map((r) => r.id);
    let i = 0;
    const worker = async () => {
      while (i < todo.length) await analyzeOne(todo[i++]);
    };
    await Promise.all([worker(), worker(), worker()]);
  };

  const anyBusy = Object.values(busy).some(Boolean);
  const withSheet = runners.filter((r) => r.sheet.trim().length >= 20).length;

  const launch = async () => {
    const out = await run(scores, RUNS, sigma);
    setRows(buildReport(runners, scores, out));
    setTimeout(() => window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" }), 50);
  };

  return (
    <main>
      <header className="hero">
        <h1>🏇 Hippo Value</h1>
        <p>{race.name || "Nouvelle course"}{race.track ? ` · ${race.track}` : ""}</p>
      </header>

      <RaceForm race={race} onChange={setRace} count={runners.length} onCount={setCount} />

      <details className="card">
        <summary><span className="rname">⚙️ Coefficients et variance</span></summary>
        <div className="grid">
          {FACTORS.map((f) => (
            <label key={f.key}>{f.label} ×
              <input
                type="number" step="0.1" min={0} value={coeffs[f.key]}
                onChange={(e) => setCoeffs({ ...coeffs, [f.key]: Number(e.target.value) || 0 })}
              />
            </label>
          ))}
          <label>Variance σ (aléa)
            <input type="number" step="0.5" min={0} value={sigma} onChange={(e) => setSigma(Number(e.target.value) || 0)} />
          </label>
        </div>
        <small className="muted">Malchance : bonus de 0 à +5 ajouté directement au score, sans coefficient.</small>
      </details>

      <h2 className="rtitle">Partants</h2>
      <button className="aibtn all" onClick={analyzeAll} disabled={anyBusy || withSheet === 0}>
        {anyBusy ? <><span className="spin" /> Analyse en cours…</> : `✨ Analyser tous les partants (${withSheet} fiche${withSheet > 1 ? "s" : ""})`}
      </button>

      {runners.map((r, i) => (
        <RunnerCard
          key={r.id} r={r} index={i} score={scores[i]}
          busy={!!busy[r.id]} error={errors[r.id]}
          onAnalyze={() => analyzeOne(r.id)}
          onChange={(nr) => setRunners((p) => p.map((x) => (x.id === nr.id ? nr : x)))}
        />
      ))}

      {rows && <Report rows={rows} runs={RUNS} />}

      <button className="cta" onClick={launch} disabled={running}>
        {running ? "Simulation en cours…" : `Lancer ${RUNS.toLocaleString("fr-FR")} simulations`}
      </button>
    </main>
  );
}
