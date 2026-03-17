// app/HomeClient.tsx — Partie client de la page d'accueil NovaFlix
'use client'

import { useState } from 'react'
import Header from '@/components/Header'
import Hero from '@/components/Hero'
import Row from '@/components/Row'
import VideoModal from '@/components/VideoModal'
import type { Movie } from '@/lib/tmdb'

interface HomeClientProps {
  trending:     Movie[]
  topRated:     Movie[]
  action:       Movie[]
  comedy:       Movie[]
  documentary:  Movie[]
  originals:    Movie[]
  nowPlaying:   Movie[]
}

/**
 * Client Component : gère l'état du modal et l'interactivité de la page d'accueil
 */
export default function HomeClient({
  trending,
  topRated,
  action,
  comedy,
  documentary,
  originals,
  nowPlaying,
}: HomeClientProps) {
  // Film actuellement sélectionné pour le modal
  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null)

  return (
    <div className="min-h-screen bg-nova-bg">
      {/* Header fixe */}
      <Header />

      {/* Hero Banner — films tendance comme source */}
      <Hero movies={trending} onMovieSelect={setSelectedMovie} />

      {/* ── Grille de carrousels ── */}
      <main className="pb-20 space-y-2 -mt-4 relative z-10">

        {/* 1. Tendances */}
        <Row
          title="Tendances cette semaine"
          movies={trending}
          onMovieSelect={setSelectedMovie}
          accentColor="violet"
        />

        {/* 2. Top 10 France */}
        <Row
          title="Top 10 en France"
          movies={topRated}
          onMovieSelect={setSelectedMovie}
          showRank
          accentColor="cyan"
        />

        {/* 3. Sorties récentes */}
        <Row
          title="Sorties récentes"
          movies={nowPlaying}
          onMovieSelect={setSelectedMovie}
          accentColor="violet"
        />

        {/* 4. NovaFlix Originals */}
        <Row
          title="NovaFlix Originals"
          movies={originals}
          onMovieSelect={setSelectedMovie}
          accentColor="cyan"
        />

        {/* 5. Action & Aventure */}
        <Row
          title="Action & Aventure"
          movies={action}
          onMovieSelect={setSelectedMovie}
          accentColor="violet"
        />

        {/* 6. Comédie */}
        <Row
          title="Comédie"
          movies={comedy}
          onMovieSelect={setSelectedMovie}
          accentColor="cyan"
        />

        {/* 7. Documentaires */}
        <Row
          title="Documentaires"
          movies={documentary}
          onMovieSelect={setSelectedMovie}
          accentColor="violet"
        />
      </main>

      {/* Modal lecteur vidéo */}
      <VideoModal
        movie={selectedMovie}
        onClose={() => setSelectedMovie(null)}
        onMovieSelect={setSelectedMovie}
      />
    </div>
  )
}
