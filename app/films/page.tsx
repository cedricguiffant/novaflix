// app/films/page.tsx — Page Films (Server Component)
// Récupère toutes les données côté serveur en parallèle
// puis passe au composant client BrowsePage

import BrowsePage from '@/components/BrowsePage'
import {
  getPopularMovies,
  getTopRated,
  getNowPlaying,
  getByGenre,
  getMovieGenres,
  GENRE_IDS,
} from '@/lib/tmdb'

const safe = <T,>(p: Promise<T[]>): Promise<T[]> => p.catch(() => [])

// Genres à afficher sur la page films
const FILM_GENRES = [
  { id: GENRE_IDS.ACTION,      name: 'Action' },
  { id: GENRE_IDS.COMEDY,      name: 'Comédie' },
  { id: GENRE_IDS.THRILLER,    name: 'Thriller' },
  { id: GENRE_IDS.HORROR,      name: 'Horreur' },
  { id: GENRE_IDS.SCIFI,       name: 'Science-Fiction' },
  { id: GENRE_IDS.DRAMA,       name: 'Drame' },
  { id: GENRE_IDS.ROMANCE,     name: 'Romance' },
  { id: GENRE_IDS.ANIMATION,   name: 'Animation' },
  { id: GENRE_IDS.DOCUMENTARY, name: 'Documentaire' },
  { id: GENRE_IDS.ADVENTURE,   name: 'Aventure' },
  { id: GENRE_IDS.CRIME,       name: 'Crime' },
]

export default async function FilmsPage() {
  // Récupération parallèle de tout le contenu
  const [popular, topRated, recent, ...genreResults] = await Promise.all([
    safe(getPopularMovies()),
    safe(getTopRated()),
    safe(getNowPlaying()),
    // Une requête par genre en parallèle
    ...FILM_GENRES.map((g) => safe(getByGenre(g.id))),
  ])

  // Construction des sections par genre
  const genreSections = FILM_GENRES.map((genre, i) => ({
    genre,
    movies: genreResults[i] ?? [],
  }))

  return (
    <BrowsePage
      type="films"
      featured={popular}
      popular={popular}
      topRated={topRated}
      recent={recent}
      genreSections={genreSections}
    />
  )
}
