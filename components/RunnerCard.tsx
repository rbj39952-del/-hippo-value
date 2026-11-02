"use client";
import { FACTORS, MALCHANCE_LEVELS, Runner } from "@/lib/types";

export function RunnerCard({
  r, index, score, onChange,
}: {
  r: Runner;
  index: number;
  score: number;
  onChange: (r: Runner) => void;
}) {
  return (
    <details className="card runner">
      <summary>
        <span className="num">{index + 1}</span>
        <span className="rname">{r.name || "Cheval"}</span>
        <span className="pill">{score.toFixed(1)} pts</span>
      </summary>

      <div className="grid">
        <label>Nom
          <input value={r.name} onChange={(e) => onChange({ ...r, name: e.target.value })} />
        </label>
        <label>Poids (kg)
          <input inputMode="decimal" value={r.weight} onChange={(e) => onChange({ ...r, weight: e.target.value })} />
        </label>
        <label className="full">Cote du marché (optionnel)
          <input
            inputMode="decimal" placeholder="ex. 6.5" value={r.marketOdds}
            onChange={(e) => onChange({ ...r, marketOdds: e.target.value })}
          />
        </label>
      </div>

      {FACTORS.map((f) => {
        const v = r.notes[f.key];
        return (
          <label key={f.key} className="slider">
            <span className="srow">
              {f.label}
              <b className={v > 0 ? "pos" : v < 0 ? "neg" : ""}>{v > 0 ? "+" : ""}{v}</b>
            </span>
            <input
              type="range" min={-5} max={5} step={1} value={v}
              onChange={(e) => onChange({ ...r, notes: { ...r.notes, [f.key]: Number(e.target.value) } })}
            />
          </label>
        );
      })}

      <div className="malchance">
        <div className="srow">Facteur malchance <small className="muted">bonus uniquement</small></div>
        <div className="seg" role="radiogroup">
          {MALCHANCE_LEVELS.map(({ v }) => (
            <button
              key={v} type="button" role="radio" aria-checked={r.malchance === v}
              className={r.malchance === v ? "on" : ""}
              onClick={() => onChange({ ...r, malchance: v })}
            >
              {v === 0 ? "0" : `+${v}`}
            </button>
          ))}
        </div>
        <small className="muted">{MALCHANCE_LEVELS[r.malchance].hint}</small>
      </div>
    </details>
  );
}
