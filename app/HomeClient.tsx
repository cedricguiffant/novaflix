// app/HomeClient.tsx
// CHANGEMENTS :
// - Accepte `hasContent` pour afficher un écran de configuration si TMDB absent
// - Plus aucune dépendance à Firebase (auth gérée dans Header)
// - Écran "Configurez vos clés API" affiché proprement si pas de contenu

'use client'

import { useState } from 'react'
import Link from 'next/link'
import { FiKey, FiExternalLink } from 'react-icons/fi'
import Header from '@/components/Header'
import Hero from '@/components/Hero'
import Row from '@/components/Row'
import VideoModal from '@/components/VideoModal'
import type { Movie } from '@/lib/tmdb'

interface HomeClientProps {
  trending:    Movie[]
  topRated:    Movie[]
  action:      Movie[]
  comedy:      Movie[]
  documentary: Movie[]
  originals:   Movie[]
  nowPlaying:  Movie[]
  hasContent:  boolean
}

export default function HomeClient({
  trending,
  topRated,
  action,
  comedy,
  documentary,
  originals,
  nowPlaying,
  hasContent,
}: HomeClientProps) {
  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null)

  return (
    <div className="min-h-screen bg-nova-bg">
      <Header />

      {hasContent ? (
        <>
          <Hero movies={trending} onMovieSelect={setSelectedMovie} />

          <main className="pb-20 space-y-2 -mt-4 relative z-10">
            <Row title="Tendances cette semaine" movies={trending}    onMovieSelect={setSelectedMovie} accentColor="violet" />
            <Row title="Top 10 en France"        movies={topRated}    onMovieSelect={setSelectedMovie} showRank accentColor="cyan" />
            <Row title="Sorties récentes"        movies={nowPlaying}  onMovieSelect={setSelectedMovie} accentColor="violet" />
            <Row title="NovaFlix Originals"      movies={originals}   onMovieSelect={setSelectedMovie} accentColor="cyan" />
            <Row title="Action & Aventure"       movies={action}      onMovieSelect={setSelectedMovie} accentColor="violet" />
            <Row title="Comédie"                 movies={comedy}      onMovieSelect={setSelectedMovie} accentColor="cyan" />
            <Row title="Documentaires"           movies={documentary} onMovieSelect={setSelectedMovie} accentColor="violet" />
          </main>
        </>
      ) : (
        /* ── Écran de configuration propre quand TMDB n'est pas configuré ── */
        <SetupScreen />
      )}

      <VideoModal
        movie={selectedMovie}
        onClose={() => setSelectedMovie(null)}
        onMovieSelect={setSelectedMovie}
      />
    </div>
  )
}

function SetupScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 pt-16">
      <div className="max-w-lg w-full glass-strong rounded-2xl p-8 border border-nova-primary/20 shadow-nova-lg text-center">

        {/* Icône */}
        <div className="w-16 h-16 rounded-2xl bg-nova-primary/10 flex items-center justify-center mx-auto mb-6">
          <FiKey size={28} className="text-nova-primary" />
        </div>

        <h1 className="text-2xl font-black text-white mb-2">
          Configuration requise
        </h1>
        <p className="text-text-secondary text-sm mb-8 leading-relaxed">
          Ajoutez votre clé API TMDB pour charger les films et séries.
          L&apos;application est prête — il manque juste les variables d&apos;environnement.
        </p>

        {/* Étapes */}
        <div className="text-left space-y-3 mb-8">
          {[
            { step: '1', text: 'Obtenez votre clé sur themoviedb.org', href: 'https://www.themoviedb.org/settings/api' },
            { step: '2', text: 'Ajoutez NEXT_PUBLIC_TMDB_API_KEY dans Vercel → Settings → Environment Variables', href: null },
            { step: '3', text: 'Redéployez l\'application (Vercel → Deployments → Redeploy)', href: null },
          ].map(({ step, text, href }) => (
            <div key={step} className="flex items-start gap-3">
              <span className="w-6 h-6 rounded-full bg-nova-gradient flex items-center justify-center text-white text-xs font-bold flex-shrink-0 mt-0.5">
                {step}
              </span>
              <p className="text-sm text-text-secondary">
                {text}
                {href && (
                  <a href={href} target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-nova-secondary hover:underline ml-1">
                    <FiExternalLink size={11} />
                  </a>
                )}
              </p>
            </div>
          ))}
        </div>

        {/* Variable à copier */}
        <div className="bg-nova-card border border-nova-border rounded-lg p-3 text-left mb-6">
          <p className="text-xs text-text-muted mb-1 font-medium">Variable requise</p>
          <code className="text-xs text-nova-secondary">
            NEXT_PUBLIC_TMDB_API_KEY=votre_clé_ici
          </code>
        </div>

        <Link
          href="/login"
          className="btn-ghost text-sm justify-center w-full"
        >
          Se connecter quand même
        </Link>
      </div>
    </div>
  )
}
