// app/page.tsx
// CHANGEMENTS :
// - Plus aucune redirection vers /login si non connecté
// - Auth totalement optionnelle : tout le monde peut naviguer
// - Récupération TMDB avec fallback vide (pas de 500 en prod)
// - Suspense boundary pour le loading state

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

// Toujours retourner [] en cas d'échec (clé absente, réseau, etc.)
const safe = <T,>(p: Promise<T[]>): Promise<T[]> => p.catch(() => [])

export default async function HomePage() {
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

  // Si aucune donnée n'a pu être chargée, on affiche quand même
  // l'UI avec un message de configuration plutôt qu'un crash
  const hasContent = trending.length > 0 || topRated.length > 0

  return (
    <Suspense fallback={<LoadingScreen />}>
      <HomeClient
        trending={trending}
        topRated={topRated}
        action={action}
        comedy={comedy}
        documentary={documentary}
        originals={originals}
        nowPlaying={nowPlaying}
        hasContent={hasContent}
      />
    </Suspense>
  )
}

function LoadingScreen() {
  return (
    <div className="min-h-screen bg-nova-bg flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-2 border-nova-primary border-t-transparent rounded-full animate-spin" />
        <p className="text-text-secondary text-sm">Chargement NovaFlix…</p>
      </div>
    </div>
  )
}
