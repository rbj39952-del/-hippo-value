import type { Race, Runner, AiResult } from "./types";

export async function analyzeRunner(r: Runner, race: Race, count: number): Promise<AiResult> {
  const res = await fetch("/api/analyze", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ sheet: r.sheet, name: r.name, weight: r.weight, race, count }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Erreur ${res.status}`);
  return data as AiResult;
}
