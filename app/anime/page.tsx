// app/anime/page.tsx — Page Anime (Server Component)
// Jikan API (MyAnimeList) — requêtes en lots pour respecter le rate limit (3 req/s)
// Next.js met en cache chaque fetch 1h (revalidate: 3600) → rapide après la 1ère visite

import AnimeBrowsePage from '@/components/AnimeBrowsePage'
import {
  getTopAnime,
  getCurrentSeasonAnime,
  getPopularAnime,
  getAnimeByGenre,
  getAnimeMovies,
  ANIME_GENRE_IDS,
} from '@/lib/jikan'
import type { AnimeGenre } from '@/lib/jikan'

const safe = <T,>(p: Promise<T[]>): Promise<T[]> => p.catch(() => [])
const delay = (ms: number) => new Promise<void>((r) => setTimeout(r, ms))

// Genres à afficher
const GENRES: AnimeGenre[] = [
  { mal_id: ANIME_GENRE_IDS.ACTION,        name: 'Action',       type: 'genre', url: '' },
  { mal_id: ANIME_GENRE_IDS.ROMANCE,       name: 'Romance',      type: 'genre', url: '' },
  { mal_id: ANIME_GENRE_IDS.COMEDY,        name: 'Comédie',      type: 'genre', url: '' },
  { mal_id: ANIME_GENRE_IDS.FANTASY,       name: 'Fantaisie',    type: 'genre', url: '' },
  { mal_id: ANIME_GENRE_IDS.DRAMA,         name: 'Drame',        type: 'genre', url: '' },
  { mal_id: ANIME_GENRE_IDS.SCIFI,         name: 'Sci-Fi',       type: 'genre', url: '' },
  { mal_id: ANIME_GENRE_IDS.SUPERNATURAL,  name: 'Surnaturel',   type: 'genre', url: '' },
  { mal_id: ANIME_GENRE_IDS.MYSTERY,       name: 'Mystère',      type: 'genre', url: '' },
  { mal_id: ANIME_GENRE_IDS.SLICE_OF_LIFE, name: 'Slice of Life',type: 'genre', url: '' },
  { mal_id: ANIME_GENRE_IDS.HORROR,        name: 'Horreur',      type: 'genre', url: '' },
  { mal_id: ANIME_GENRE_IDS.MECHA,         name: 'Mecha',        type: 'genre', url: '' },
  { mal_id: ANIME_GENRE_IDS.SPORTS,        name: 'Sports',       type: 'genre', url: '' },
]

export default async function AnimePage() {
  // ── Lot 1 : données principales ──────────────────────────────────────
  const [topAnime, currentSeason, popular, movies] = await Promise.all([
    safe(getTopAnime()),
    safe(getCurrentSeasonAnime()),
    safe(getPopularAnime()),
    safe(getAnimeMovies()),
  ])

  // Délai pour respecter le rate limit Jikan (3 req/s)
  await delay(400)

  // ── Lot 2 : genres 1-4 ──────────────────────────────────────────────
  const genreResults1 = await Promise.all(
    GENRES.slice(0, 4).map((g) => safe(getAnimeByGenre(g.mal_id)))
  )

  await delay(400)

  // ── Lot 3 : genres 5-8 ──────────────────────────────────────────────
  const genreResults2 = await Promise.all(
    GENRES.slice(4, 8).map((g) => safe(getAnimeByGenre(g.mal_id)))
  )

  await delay(400)

  // ── Lot 4 : genres 9-12 ─────────────────────────────────────────────
  const genreResults3 = await Promise.all(
    GENRES.slice(8, 12).map((g) => safe(getAnimeByGenre(g.mal_id)))
  )

  const allGenreResults = [...genreResults1, ...genreResults2, ...genreResults3]

  // Construction des sections par genre
  const genreSections = GENRES.map((genre, i) => ({
    genre,
    animes: allGenreResults[i] ?? [],
  }))

  return (
    <AnimeBrowsePage
      featured={topAnime.slice(0, 8)}
      topAnime={topAnime}
      currentSeason={currentSeason}
      movies={movies}
      genreSections={genreSections}
    />
  )
}
