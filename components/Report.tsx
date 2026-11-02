import type { RunnerResult } from "@/lib/types";

const fmtOdds = (o: number) => (Number.isFinite(o) ? (o >= 100 ? o.toFixed(0) : o.toFixed(2)) : "∞");

export function Report({ rows, runs }: { rows: RunnerResult[]; runs: number }) {
  const max = Math.max(...rows.map((r) => r.winPct), 1);
  return (
    <section>
      <h2 className="rtitle">
        Rapport <span className="muted">· {runs.toLocaleString("fr-FR")} simulations</span>
      </h2>

      {rows.map((r, i) => (
        <article key={r.id} className={"card res" + (r.isValue ? " value" : "")}>
          <header>
            <span className="num">{i + 1}</span>
            <span className="rname">{r.name}</span>
            {r.isValue && <span className="badge">🔥 VALUE</span>}
          </header>

          <div className="bar"><i style={{ width: `${(r.winPct / max) * 100}%` }} /></div>

          <div className="stats">
            <div><small>Victoire</small><b>{r.winPct.toFixed(1)}%</b></div>
            <div><small>Top 3</small><b>{r.top3Pct.toFixed(1)}%</b></div>
            <div><small>Cote juste</small><b>{fmtOdds(r.fairOdds)}</b></div>
            <div><small>Score</small><b>{r.score.toFixed(1)}</b></div>
          </div>

          {r.marketOdds && (
            <footer className={r.isValue ? "pos" : "neg"}>
              Marché {r.marketOdds} · espérance {(r.edgePct ?? 0) > 0 ? "+" : ""}{(r.edgePct ?? 0).toFixed(0)}%
            </footer>
          )}
        </article>
      ))}

      <p className="muted note">Value Bet = cote du marché supérieure à la cote juste (espérance = probabilité × cote − 1).</p>
    </section>
  );
}
