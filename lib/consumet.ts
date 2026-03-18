// lib/consumet.ts — Client AniWatch API
// Les requêtes passent par nos routes proxy /api/anime/* qui lisent
// l'URL du serveur côté serveur (env var ANIWATCH_API_URL) ou, à défaut,
// utilisent l'instance Render publique.
//
// Côté client, l'URL configurée par l'utilisateur est passée en header
// X-Stream-Api pour que la route proxy l'utilise en priorité.

const LS_KEY = 'novaflix_stream_api_url'

function getApiUrl(): string {
  if (typeof window === 'undefined') return ''
  return localStorage.getItem(LS_KEY) ?? ''
}

function apiHeaders(): HeadersInit {
  const url = getApiUrl()
  return url ? { 'x-stream-api': url } : {}
}

// ── Types publics ──────────────────────────────────────────────────────

export interface ConsumetSearchResult {
  id: string
  title: string
  url: string
  image: string
  releaseDate: string
  subOrDub: 'sub' | 'dub'
}

export interface ConsumetEpisode {
  id: string
  number: number
  url: string
}

export interface ConsumetSource {
  url: string
  isM3U8: boolean
  quality: string
}

// ── Fonctions ──────────────────────────────────────────────────────────

export async function searchConsumetAnime(
  query: string
): Promise<ConsumetSearchResult[]> {
  try {
    const res = await fetch(
      `/api/anime/search?q=${encodeURIComponent(query)}`,
      { headers: apiHeaders() }
    )
    if (!res.ok) return []
    const data = await res.json()
    return data.results ?? []
  } catch {
    return []
  }
}

export async function getConsumetEpisodes(
  id: string
): Promise<ConsumetEpisode[]> {
  try {
    const res = await fetch(
      `/api/anime/episodes?id=${encodeURIComponent(id)}`,
      { headers: apiHeaders() }
    )
    if (!res.ok) return []
    const data = await res.json()
    return data.episodes ?? []
  } catch {
    return []
  }
}

export async function getConsumetStream(
  episodeId: string
): Promise<ConsumetSource | null> {
  try {
    const res = await fetch(
      `/api/anime/stream?episodeId=${encodeURIComponent(episodeId)}`,
      { headers: apiHeaders() }
    )
    if (!res.ok) return null
    const data = await res.json()
    const sources: ConsumetSource[] = data.sources ?? []
    const sorted = [...sources].sort((a, b) => {
      return (parseInt(b.quality) || 0) - (parseInt(a.quality) || 0)
    })
    return sorted[0] ?? null
  } catch {
    return null
  }
}
