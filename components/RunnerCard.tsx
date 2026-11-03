"use client";
import { FACTORS, MALCHANCE_LEVELS, Runner } from "@/lib/types";

const fmt = (n: number) => (n > 0 ? `+${n}` : `${n}`);

export function RunnerCard({
  r, index, score, busy, error, onChange, onAnalyze,
}: {
  r: Runner;
  index: number;
  score: number;
  busy: boolean;
  error?: string;
  onChange: (r: Runner) => void;
  onAnalyze: () => void;
}) {
  const reason = (k: keyof NonNullable<Runner["ai"]>, current: number) => {
    const a = r.ai?.[k];
    if (!a) return null;
    return (
      <p className="reason">
        {a.reason || "—"}
        {a.note !== current && <em> · IA : {fmt(a.note)}</em>}
      </p>
    );
  };

  return (
    <details className="card runner">
      <summary>
        <span className="num">{index + 1}</span>
        <span className="rname">{r.name || "Cheval"}</span>
        {r.ai && <span className="pill ai">IA ✓</span>}
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

      <div className="sheetbox">
        <label>Fiche Equidia (collez le texte brut)
          <textarea
            rows={5}
            placeholder="Historique des courses, commentaires, poids, terrain…"
            value={r.sheet}
            onChange={(e) => onChange({ ...r, sheet: e.target.value })}
          />
        </label>
        <button type="button" className="aibtn" onClick={onAnalyze} disabled={busy || r.sheet.trim().length < 20}>
          {busy ? <><span className="spin" /> Analyse en cours…</> : "✨ Analyser avec l'IA"}
        </button>
        {error && <p className="err">{error}</p>}
        {r.ai && !busy && <small className="muted">Notes remplies par l'IA. Vous pouvez tout modifier ci-dessous.</small>}
      </div>

      {FACTORS.map((f) => {
        const v = r.notes[f.key];
        return (
          <div key={f.key} className="slider">
            <label>
              <span className="srow">
                {f.label}
                <b className={v > 0 ? "pos" : v < 0 ? "neg" : ""}>{fmt(v)}</b>
              </span>
              <input
                type="range" min={-5} max={5} step={1} value={v}
                onChange={(e) => onChange({ ...r, notes: { ...r.notes, [f.key]: Number(e.target.value) } })}
              />
            </label>
            {reason(f.key, v)}
          </div>
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
        {reason("malchance", r.malchance)}
      </div>
    </details>
  );
}
