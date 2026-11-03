import { NextResponse } from "next/server";

export const maxDuration = 60;

const KEYS = ["categorie", "poids", "corde", "distance", "terrain", "forme", "chrono", "malchance"] as const;

const SYSTEM = `Tu es un handicapeur hippique professionnel (Plat et Obstacles). Tu lis la fiche brute d'un cheval et tu évalues globalement son profil pour la course décrite, sans te fier à des mots-clés isolés.

Tu notes 8 facteurs. Une note positive = favorable au cheval dans CETTE course, négative = défavorable.
- categorie : changement de catégorie / niveau (descend = positif, monte = négatif). -5 à +5
- poids : évolution de la charge / valeur handicap. -5 à +5
- corde : piège de la stalle ou de la corde. -5 à +5
- distance : aptitude à la distance du jour. -5 à +5
- terrain : aptitude à l'état du terrain du jour. -5 à +5
- forme : forme récente / musique. -5 à +5
- chrono : chronos et vitesses de référence. -5 à +5
- malchance : STRICTEMENT ASYMÉTRIQUE, bonus uniquement, de 0 à +5, jamais négatif.
  0 = parcours normal, sans incident (aucun malus possible).
  +1 à +2 = incident léger (effort ponctuel, léger écart).
  +3 = effort superflu avéré (3e épaisseur, nez au vent).
  +4 à +5 = malchance majeure (gêné, enfermé, victime d'une chute devant lui, effort violent).

Règles : notes entières. Si la fiche ne permet pas de juger un facteur (ex. aucune info sur la corde), mets 0 et dis-le dans la raison. Chaque raison = UNE seule ligne en français, 120 caractères maximum, qui justifie la note (pourquoi ce chiffre et pas un autre).

Réponds UNIQUEMENT avec un objet JSON valide, sans texte autour, sans balises markdown, de la forme :
{"categorie":{"note":0,"raison":"..."},"poids":{...},"corde":{...},"distance":{...},"terrain":{...},"forme":{...},"chrono":{...},"malchance":{...}}`;

const clamp = (x: number, a: number, b: number) => Math.min(b, Math.max(a, x));

export async function POST(req: Request) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "Clé ANTHROPIC_API_KEY manquante dans Vercel." }, { status: 500 });
  }

  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Requête invalide." }, { status: 400 });
  }

  const sheet = String(body.sheet || "").trim().slice(0, 12000);
  if (sheet.length < 20) {
    return NextResponse.json({ error: "Collez d'abord la fiche du cheval." }, { status: 400 });
  }

  const race = body.race || {};
  const userMsg = `COURSE : ${race.name || "?"} à ${race.track || "?"} | ${race.discipline || "?"} | ${race.distance || "?"} m | terrain : ${race.going || "?"} | ${body.count || "?"} partants
CHEVAL : ${body.name || "?"} | poids du jour : ${body.weight || "?"} kg

FICHE BRUTE :
${sheet}`;

  const r = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: process.env.ANTHROPIC_MODEL || "claude-sonnet-5-5",
      max_tokens: 1500,
      system: SYSTEM,
      messages: [{ role: "user", content: userMsg }],
    }),
  });

  if (!r.ok) {
    const txt = await r.text();
    return NextResponse.json({ error: `Erreur API (${r.status}). ${txt.slice(0, 200)}` }, { status: 502 });
  }

  const data = await r.json();
  const text: string = (data.content || []).map((b: any) => (b.type === "text" ? b.text : "")).join("");
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) {
    return NextResponse.json({ error: "Réponse de l'IA illisible. Réessayez." }, { status: 502 });
  }

  let parsed: any;
  try {
    parsed = JSON.parse(match[0]);
  } catch {
    return NextResponse.json({ error: "Réponse de l'IA mal formée. Réessayez." }, { status: 502 });
  }

  // Normalisation : entiers, bornes, malchance 0..5 uniquement
  const out: Record<string, { note: number; reason: string }> = {};
  for (const k of KEYS) {
    const raw = Math.round(Number(parsed?.[k]?.note) || 0);
    const note = k === "malchance" ? clamp(raw, 0, 5) : clamp(raw, -5, 5);
    out[k] = { note, reason: String(parsed?.[k]?.raison || "").slice(0, 160) };
  }
  return NextResponse.json(out);
}
