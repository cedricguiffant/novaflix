// lib/tmdb.ts — Fonctions d'appel à l'API TMDB pour NovaFlix
import axios from 'axios'

// ── Types TypeScript stricts ──

export interface Movie {
  id: number
  title?: string
  name?: string          // pour les séries TV
  original_title?: string
  overview: string
  poster_path: string | null
  backdrop_path: string | null
  vote_average: number
  vote_count: number
  release_date?: string
  first_air_date?: string
  genre_ids: number[]
  media_type?: 'movie' | 'tv' | 'person'
  popularity: number
  adult: boolean
  original_language: string
}

export interface MovieDetails extends Movie {
  genres: { id: number; name: string }[]
  runtime?: number
  number_of_seasons?: number
  tagline?: string
  status: string
  production_companies: { id: number; name: string; logo_path: string | null }[]
}

export interface Video {
  id: string
  key: string
  name: string
  site: string
  type: string
  official: boolean
}

export interface TMDBResponse<T> {
  page: number
  results: T[]
  total_pages: number
  total_results: number
}

// ── Configuration de base ──
const API_KEY  = process.env.NEXT_PUBLIC_TMDB_API_KEY
const BASE_URL = 'https://api.themoviedb.org/3'
const LANG     = 'fr-FR'

// Instance Axios préconfigurée
const tmdb = axios.create({
  baseURL: BASE_URL,
  params: {
    api_key: API_KEY,
    language: LANG,
  },
})

// URLs des images TMDB
export const TMDB_IMAGE = {
  original: (path: string) => `https://image.tmdb.org/t/p/original${path}`,
  w500:     (path: string) => `https://image.tmdb.org/t/p/w500${path}`,
  w300:     (path: string) => `https://image.tmdb.org/t/p/w300${path}`,
  w200:     (path: string) => `https://image.tmdb.org/t/p/w200${path}`,
}

// ── IDs des genres TMDB ──
export const GENRE_IDS = {
  // Films
  ACTION:        28,
  ADVENTURE:     12,
  ANIMATION:     16,
  COMEDY:        35,
  CRIME:         80,
  DOCUMENTARY:   99,
  DRAMA:         18,
  FANTASY:       14,
  HORROR:        27,
  ROMANCE:       10749,
  SCIFI:         878,
  THRILLER:      53,
}

// ── IDs des genres TV ──
export const TV_GENRE_IDS = {
  ACTION_ADVENTURE: 10759,
  ANIMATION:        16,
  COMEDY:           35,
  CRIME:            80,
  DOCUMENTARY:      99,
  DRAMA:            18,
  KIDS:             10762,
  MYSTERY:          9648,
  SCIFI_FANTASY:    10765,
  REALITY:          10764,
  SOAP:             10766,
  WESTERN:          37,
}

export interface Genre {
  id: number
  name: string
}

// ── Fonctions de récupération ──

/**
 * Récupère les films/séries tendance (semaine)
 * Utilisé pour le Hero Banner et le carrousel "Tendances"
 */
export async function getTrending(): Promise<Movie[]> {
  const { data } = await tmdb.get<TMDBResponse<Movie>>('/trending/all/week')
  return data.results
}

/**
 * Récupère les films les mieux notés
 * Utilisé pour "Top 10 France"
 */
export async function getTopRated(): Promise<Movie[]> {
  const { data } = await tmdb.get<TMDBResponse<Movie>>('/movie/top_rated', {
    params: { region: 'FR' },
  })
  return data.results
}

/**
 * Récupère les films populaires du moment
 */
export async function getNowPlaying(): Promise<Movie[]> {
  const { data } = await tmdb.get<TMDBResponse<Movie>>('/movie/now_playing', {
    params: { region: 'FR' },
  })
  return data.results
}

/**
 * Récupère les films par genre
 * @param genreId — ID de genre TMDB (cf. GENRE_IDS)
 */
export async function getByGenre(genreId: number): Promise<Movie[]> {
  const { data } = await tmdb.get<TMDBResponse<Movie>>('/discover/movie', {
    params: {
      with_genres: genreId,
      sort_by: 'popularity.desc',
    },
  })
  return data.results
}

/**
 * Récupère les séries Netflix Originals (réseau Netflix = id 213)
 */
export async function getNetflixOriginals(): Promise<Movie[]> {
  const { data } = await tmdb.get<TMDBResponse<Movie>>('/discover/tv', {
    params: {
      with_networks: 213,
      sort_by: 'popularity.desc',
    },
  })
  return data.results
}

/**
 * Récupère la bande-annonce YouTube d'un film ou d'une série
 * Priorise : Trailer officiel > Teaser > première vidéo disponible
 * @param id        — ID TMDB du contenu
 * @param mediaType — 'movie' ou 'tv'
 */
export async function getTrailer(
  id: number,
  mediaType: 'movie' | 'tv' = 'movie'
): Promise<string | null> {
  try {
    const { data } = await tmdb.get<{ results: Video[] }>(
      `/${mediaType}/${id}/videos`,
      { params: { language: 'fr-FR' } }
    )

    let trailer = data.results.find(
      (v) => v.type === 'Trailer' && v.site === 'YouTube' && v.official
    )

    // Fallback : trailer non officiel
    if (!trailer) {
      trailer = data.results.find(
        (v) => v.type === 'Trailer' && v.site === 'YouTube'
      )
    }

    // Fallback anglais si pas de trailer en français
    if (!trailer) {
      const { data: enData } = await tmdb.get<{ results: Video[] }>(
        `/${mediaType}/${id}/videos`,
        { params: { language: 'en-US' } }
      )
      trailer = enData.results.find(
        (v) => v.type === 'Trailer' && v.site === 'YouTube'
      ) ?? enData.results.find((v) => v.site === 'YouTube')
    }

    return trailer?.key ?? null
  } catch {
    return null
  }
}

/**
 * Récupère les détails complets d'un film ou d'une série
 */
export async function getDetails(
  id: number,
  mediaType: 'movie' | 'tv' = 'movie'
): Promise<MovieDetails> {
  const { data } = await tmdb.get<MovieDetails>(`/${mediaType}/${id}`)
  return data
}

/**
 * Recherche multi-médias (films + séries + personnes)
 */
export async function searchMulti(query: string): Promise<Movie[]> {
  if (!query.trim()) return []
  const { data } = await tmdb.get<TMDBResponse<Movie>>('/search/multi', {
    params: { query },
  })
  return data.results.filter((r) => r.media_type !== 'person')
}

/**
 * Films populaires du moment
 */
export async function getPopularMovies(): Promise<Movie[]> {
  const { data } = await tmdb.get<TMDBResponse<Movie>>('/movie/popular')
  return data.results
}

/**
 * Séries TV populaires
 */
export async function getPopularTV(): Promise<Movie[]> {
  const { data } = await tmdb.get<TMDBResponse<Movie>>('/tv/popular')
  return data.results
}

/**
 * Séries TV les mieux notées
 */
export async function getTopRatedTV(): Promise<Movie[]> {
  const { data } = await tmdb.get<TMDBResponse<Movie>>('/tv/top_rated')
  return data.results
}

/**
 * Séries TV en cours de diffusion
 */
export async function getOnAirTV(): Promise<Movie[]> {
  const { data } = await tmdb.get<TMDBResponse<Movie>>('/tv/on_the_air')
  return data.results
}

/**
 * Séries TV par genre
 */
export async function getTVByGenre(genreId: number): Promise<Movie[]> {
  const { data } = await tmdb.get<TMDBResponse<Movie>>('/discover/tv', {
    params: { with_genres: genreId, sort_by: 'popularity.desc' },
  })
  return data.results
}

/**
 * Films par page (pour la pagination)
 */
export async function getMoviesByPage(page = 1): Promise<Movie[]> {
  const { data } = await tmdb.get<TMDBResponse<Movie>>('/movie/popular', {
    params: { page },
  })
  return data.results
}

/**
 * Liste des genres disponibles (films)
 */
export async function getMovieGenres(): Promise<Genre[]> {
  const { data } = await tmdb.get<{ genres: Genre[] }>('/genre/movie/list')
  return data.genres
}

/**
 * Liste des genres disponibles (séries)
 */
export async function getTVGenres(): Promise<Genre[]> {
  const { data } = await tmdb.get<{ genres: Genre[] }>('/genre/tv/list')
  return data.genres
}

/**
 * Récupère les films similaires à un contenu donné
 */
export async function getSimilar(
  id: number,
  mediaType: 'movie' | 'tv' = 'movie'
): Promise<Movie[]> {
  const { data } = await tmdb.get<TMDBResponse<Movie>>(
    `/${mediaType}/${id}/similar`
  )
  return data.results
}
