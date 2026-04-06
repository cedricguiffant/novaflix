// lib/animesama.ts — Helpers client-side pour les routes API anime-sama

// ── Types (miroir des routes API) ──────────────────────────────────────

export interface AnimeSamaResult {
  url: string
  name: string
  image: string
  genres: string[]
  categories: string[]
  languages: string[]
}

export interface AnimeSamaSeason {
  name: string
  url: string
  lang: 'vf' | 'vostfr'
}

export interface AnimeSamaEpisode {
  index: number
  name: string
  players: string[]
}

// ── Fonctions ───────────────────────────────────────────────────────────

export async function searchAnimeSama(q: string): Promise<AnimeSamaResult[]> {
  try {
    const res = await fetch(`/api/animesama/search?q=${encodeURIComponent(q)}`)
    return res.ok ? res.json() : []
  } catch {
    return []
  }
}

export async function getAnimeSamaSeasons(
  catalogueUrl: string
): Promise<AnimeSamaSeason[]> {
  try {
    const res = await fetch(
      `/api/animesama/seasons?url=${encodeURIComponent(catalogueUrl)}`
    )
    return res.ok ? res.json() : []
  } catch {
    return []
  }
}

export async function getAnimeSamaEpisodes(
  seasonUrl: string
): Promise<AnimeSamaEpisode[]> {
  try {
    const res = await fetch(
      `/api/animesama/episodes?url=${encodeURIComponent(seasonUrl)}`
    )
    return res.ok ? res.json() : []
  } catch {
    return []
  }
}

// ── Utilitaires ─────────────────────────────────────────────────────────

/** Label affiché pour une langue */
export function langLabel(lang: 'vf' | 'vostfr'): string {
  return lang === 'vf' ? '🇫🇷 VF' : '🈳 VOSTFR'
}

/** Trouve la meilleure correspondance parmi les résultats de recherche */
export function bestMatch(
  results: AnimeSamaResult[],
  titleEn: string | null,
  titleJa: string
): AnimeSamaResult | null {
  if (!results.length) return null

  const normalize = (s: string) =>
    s
      .toLowerCase()
      .replace(/[^a-z0-9]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()

  const targets = [titleEn, titleJa]
    .filter(Boolean)
    .map((t) => normalize(t!))

  for (const target of targets) {
    const exact = results.find((r) => normalize(r.name) === target)
    if (exact) return exact
  }

  // Correspondance partielle
  for (const target of targets) {
    const partial = results.find(
      (r) =>
        normalize(r.name).includes(target) ||
        target.includes(normalize(r.name))
    )
    if (partial) return partial
  }

  return results[0]
}
