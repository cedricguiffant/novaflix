// lib/jikan.ts — Jikan API v4 (MyAnimeList)
// API REST gratuite, sans clé, revalidation 1h via Next.js cache

const BASE = 'https://api.jikan.moe/v4'

// ── Types ──────────────────────────────────────────────────────────────

export interface AnimeGenre {
  mal_id: number
  type: string
  name: string
  url: string
}

export interface AnimeTrailer {
  youtube_id: string | null
  url: string | null
  embed_url: string | null
  images: {
    image_url: string | null
    small_image_url: string | null
    medium_image_url: string | null
    large_image_url: string | null
    maximum_image_url: string | null
  }
}

export interface AnimeImages {
  jpg: {
    image_url: string
    small_image_url: string
    large_image_url: string
  }
  webp: {
    image_url: string
    small_image_url: string
    large_image_url: string
  }
}

export interface Anime {
  mal_id: number
  url: string
  images: AnimeImages
  trailer: AnimeTrailer
  title: string
  title_english: string | null
  title_japanese: string | null
  type: string | null        // "TV", "Movie", "OVA", "Special", "ONA", "Music"
  source: string | null
  episodes: number | null
  status: string | null      // "Finished Airing", "Currently Airing", "Not yet aired"
  airing: boolean
  score: number | null
  scored_by: number | null
  rank: number | null
  popularity: number
  members: number
  synopsis: string | null
  season: string | null      // "spring", "summer", "fall", "winter"
  year: number | null
  genres: AnimeGenre[]
  themes: AnimeGenre[]
  demographics: AnimeGenre[]
  studios: { mal_id: number; name: string }[]
}

interface JikanPaged<T> {
  data: T[]
  pagination: {
    last_visible_page: number
    has_next_page: boolean
    current_page: number
    items: { count: number; total: number; per_page: number }
  }
}

// ── IDs genres MAL (pour le filtrage) ──────────────────────────────────

export const ANIME_GENRE_IDS = {
  ACTION:        1,
  ADVENTURE:     2,
  COMEDY:        4,
  DRAMA:         8,
  FANTASY:       10,
  HORROR:        14,
  MYSTERY:       7,
  ROMANCE:       22,
  SCIFI:         24,
  SLICE_OF_LIFE: 36,
  SPORTS:        30,
  SUPERNATURAL:  37,
  THRILLER:      41,
  MECHA:         18,
  SHOUNEN:       27,    // demographic
  SEINEN:        42,    // demographic
} as const

// ── Fetch helper avec cache Next.js ────────────────────────────────────

async function jikanGet<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    next: { revalidate: 3600 },
    headers: { Accept: 'application/json' },
  })
  if (!res.ok) throw new Error(`Jikan ${res.status}: ${path}`)
  return res.json() as Promise<T>
}

// ── Fonctions publiques ────────────────────────────────────────────────

/** Top anime (populaires / bien notés) */
export async function getTopAnime(): Promise<Anime[]> {
  const d = await jikanGet<JikanPaged<Anime>>('/top/anime?limit=25&type=tv')
  return d.data
}

/** Anime de la saison en cours */
export async function getCurrentSeasonAnime(): Promise<Anime[]> {
  const d = await jikanGet<JikanPaged<Anime>>('/seasons/now?limit=25')
  return d.data
}

/** Anime populaires (tous types) */
export async function getPopularAnime(): Promise<Anime[]> {
  const d = await jikanGet<JikanPaged<Anime>>(
    '/anime?order_by=popularity&sort=asc&limit=25&type=tv'
  )
  return d.data
}

/** Anime par genre */
export async function getAnimeByGenre(genreId: number): Promise<Anime[]> {
  const d = await jikanGet<JikanPaged<Anime>>(
    `/anime?genres=${genreId}&order_by=popularity&sort=asc&limit=20&type=tv`
  )
  return d.data
}

/** Films d'animation */
export async function getAnimeMovies(): Promise<Anime[]> {
  const d = await jikanGet<JikanPaged<Anime>>(
    '/top/anime?limit=20&type=movie'
  )
  return d.data
}

/** Liste des genres disponibles */
export async function getAnimeGenreList(): Promise<AnimeGenre[]> {
  const d = await jikanGet<{ data: AnimeGenre[] }>('/genres/anime?filter=genres')
  return d.data
}

/** Recherche d'anime */
export async function searchAnime(query: string): Promise<Anime[]> {
  if (!query.trim()) return []
  const d = await jikanGet<JikanPaged<Anime>>(
    `/anime?q=${encodeURIComponent(query)}&limit=20`
  )
  return d.data
}

/** Titres populaires — helper titre affiché */
export function getAnimeTitle(anime: Anime): string {
  return anime.title_english || anime.title
}

/** URL de l'image poster (webp > jpg, large > normal) */
export function getAnimePoster(anime: Anime): string {
  return (
    anime.images.webp?.large_image_url ||
    anime.images.webp?.image_url ||
    anime.images.jpg?.large_image_url ||
    anime.images.jpg?.image_url ||
    ''
  )
}
