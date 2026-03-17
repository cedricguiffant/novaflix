// app/page.tsx — Page d'accueil NovaFlix (Server Component + Client hydration)
import { Suspense } from 'react'
import HomeClient from './HomeClient'
import {
  getTrending,
  getTopRated,
  getByGenre,
  getNetflixOriginals,
  getNowPlaying,
  GENRE_IDS,
} from '@/lib/tmdb'

/**
 * Server Component : récupère toutes les données en parallèle côté serveur
 * puis passe les résultats au composant client pour les interactions
 */
export default async function HomePage() {
  // Récupération parallèle — les erreurs (clé manquante, réseau) retournent []
  const safe = <T,>(p: Promise<T[]>): Promise<T[]> => p.catch(() => [])

  const [
    trending,
    topRated,
    action,
    comedy,
    documentary,
    originals,
    nowPlaying,
  ] = await Promise.all([
    safe(getTrending()),
    safe(getTopRated()),
    safe(getByGenre(GENRE_IDS.ACTION)),
    safe(getByGenre(GENRE_IDS.COMEDY)),
    safe(getByGenre(GENRE_IDS.DOCUMENTARY)),
    safe(getNetflixOriginals()),
    safe(getNowPlaying()),
  ])

  return (
    <Suspense fallback={<LoadingFallback />}>
      <HomeClient
        trending={trending}
        topRated={topRated}
        action={action}
        comedy={comedy}
        documentary={documentary}
        originals={originals}
        nowPlaying={nowPlaying}
      />
    </Suspense>
  )
}

function LoadingFallback() {
  return (
    <div className="min-h-screen bg-nova-bg flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-2 border-nova-primary border-t-transparent rounded-full animate-spin" />
        <p className="text-text-secondary text-sm">Chargement NovaFlix…</p>
      </div>
    </div>
  )
}
