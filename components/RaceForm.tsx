"use client";
import type { Race } from "@/lib/types";

export function RaceForm({
  race, onChange, count, onCount,
}: {
  race: Race;
  onChange: (r: Race) => void;
  count: number;
  onCount: (n: number) => void;
}) {
  const set = <K extends keyof Race>(k: K, v: Race[K]) => onChange({ ...race, [k]: v });
  return (
    <section className="card">
      <h2>Course</h2>
      <div className="grid">
        <label>Nom<input value={race.name} onChange={(e) => set("name", e.target.value)} /></label>
        <label>Hippodrome<input value={race.track} onChange={(e) => set("track", e.target.value)} /></label>
        <label>Distance (m)
          <input inputMode="numeric" value={race.distance} onChange={(e) => set("distance", e.target.value)} />
        </label>
        <label>Discipline
          <select value={race.discipline} onChange={(e) => set("discipline", e.target.value as Race["discipline"])}>
            <option>Plat</option>
            <option>Obstacles</option>
          </select>
        </label>
        <label>Terrain (ex. Très souple 3.8)
          <input value={race.going} onChange={(e) => set("going", e.target.value)} />
        </label>
        <label>Partants (3 à 20)
          <input
            type="number" min={3} max={20} value={count}
            onChange={(e) => onCount(Math.min(20, Math.max(3, Number(e.target.value) || 3)))}
          />
        </label>
      </div>
    </section>
  );
}
