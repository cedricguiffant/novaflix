// app/series/page.tsx — Page Séries TV (Server Component)
// Récupère toutes les données côté serveur en parallèle
// puis passe au composant client BrowsePage

import BrowsePage from '@/components/BrowsePage'
import {
  getPopularTV,
  getTopRatedTV,
  getOnAirTV,
  getTVByGenre,
  TV_GENRE_IDS,
} from '@/lib/tmdb'

const safe = <T,>(p: Promise<T[]>): Promise<T[]> => p.catch(() => [])

// Genres à afficher sur la page séries
const TV_GENRES = [
  { id: TV_GENRE_IDS.ACTION_ADVENTURE, name: 'Action & Aventure' },
  { id: TV_GENRE_IDS.COMEDY,           name: 'Comédie' },
  { id: TV_GENRE_IDS.DRAMA,            name: 'Drame' },
  { id: TV_GENRE_IDS.CRIME,            name: 'Crime' },
  { id: TV_GENRE_IDS.SCIFI_FANTASY,    name: 'Sci-Fi & Fantastique' },
  { id: TV_GENRE_IDS.MYSTERY,          name: 'Mystère' },
  { id: TV_GENRE_IDS.ANIMATION,        name: 'Animation' },
  { id: TV_GENRE_IDS.DOCUMENTARY,      name: 'Documentaire' },
  { id: TV_GENRE_IDS.REALITY,          name: 'Téléréalité' },
  { id: TV_GENRE_IDS.KIDS,             name: 'Jeunesse' },
]

export default async function SeriesPage() {
  // Récupération parallèle de tout le contenu
  const [popular, topRated, onAir, ...genreResults] = await Promise.all([
    safe(getPopularTV()),
    safe(getTopRatedTV()),
    safe(getOnAirTV()),
    // Une requête par genre en parallèle
    ...TV_GENRES.map((g) => safe(getTVByGenre(g.id))),
  ])

  // Construction des sections par genre
  const genreSections = TV_GENRES.map((genre, i) => ({
    genre,
    movies: genreResults[i] ?? [],
  }))

  return (
    <BrowsePage
      type="series"
      featured={popular}
      popular={popular}
      topRated={topRated}
      recent={onAir}
      genreSections={genreSections}
    />
  )
}
