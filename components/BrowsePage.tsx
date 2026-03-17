// components/BrowsePage.tsx
// Composant client réutilisable pour les pages /films et /series
// - Hero avec backdrop du premier contenu
// - Onglets de filtre par genre
// - Grille responsive de cartes avec hover
// - Modal vidéo intégré

'use client'

import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FiFilm, FiTv, FiFilter } from 'react-icons/fi'
import Header from '@/components/Header'
import Hero from '@/components/Hero'
import MovieCard from '@/components/MovieCard'
import VideoModal from '@/components/VideoModal'
import type { Movie, Genre } from '@/lib/tmdb'

// ── Types ──────────────────────────────────────────────────────────────
interface GenreSection {
  genre: Genre
  movies: Movie[]
}

interface BrowsePageProps {
  type:          'films' | 'series'
  featured:      Movie[]           // pour le Hero Banner
  popular:       Movie[]           // section "Populaires"
  topRated:      Movie[]           // section "Top noté"
  recent:        Movie[]           // section "Récents / En cours"
  genreSections: GenreSection[]    // sections par genre
}

// ── Composant ──────────────────────────────────────────────────────────
export default function BrowsePage({
  type,
  featured,
  popular,
  topRated,
  recent,
  genreSections,
}: BrowsePageProps) {
  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null)
  const [activeGenre, setActiveGenre]     = useState<number | null>(null) // null = Tous
  const [viewMode, setViewMode]           = useState<'rows' | 'grid'>('rows')

  const isFilms = type === 'films'
  const icon    = isFilms ? <FiFilm size={16} /> : <FiTv size={16} />
  const label   = isFilms ? 'Films' : 'Séries'

  // Genres disponibles (avec contenu)
  const availableGenres = useMemo(
    () => genreSections.filter((s) => s.movies.length > 0).map((s) => s.genre),
    [genreSections]
  )

  // Contenu filtré par genre
  const filteredSections = useMemo(() => {
    if (activeGenre === null) return genreSections.filter((s) => s.movies.length > 0)
    return genreSections.filter((s) => s.genre.id === activeGenre && s.movies.length > 0)
  }, [activeGenre, genreSections])

  // Tous les films du genre sélectionné (mode grille)
  const gridMovies = useMemo(() => {
    if (activeGenre === null) return popular
    return filteredSections.flatMap((s) => s.movies)
  }, [activeGenre, filteredSections, popular])

  const hasContent = popular.length > 0 || featured.length > 0

  return (
    <div className="min-h-screen bg-nova-bg">
      <Header />

      {hasContent ? (
        <>
          {/* ── Hero Banner ── */}
          <Hero movies={featured.slice(0, 5)} onMovieSelect={setSelectedMovie} />

          {/* ── Contrôles : titre + filtres genres + toggle vue ── */}
          <div className="relative z-10 -mt-2 px-6 sm:px-8 lg:px-12 pb-4">

            {/* Titre de la section */}
            <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
              <div className="flex items-center gap-3">
                <div className="w-1 h-7 rounded-full bg-nova-gradient shadow-nova" />
                <div className="flex items-center gap-2">
                  <span className="text-nova-secondary">{icon}</span>
                  <h1 className="text-xl sm:text-2xl font-black text-white">{label}</h1>
                </div>
              </div>

              {/* Toggle Rangées / Grille */}
              <div className="flex items-center gap-1 glass rounded-lg p-1">
                <button
                  onClick={() => setViewMode('rows')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                    viewMode === 'rows'
                      ? 'bg-nova-primary text-white shadow-nova'
                      : 'text-text-secondary hover:text-white'
                  }`}
                >
                  Rangées
                </button>
                <button
                  onClick={() => setViewMode('grid')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                    viewMode === 'grid'
                      ? 'bg-nova-primary text-white shadow-nova'
                      : 'text-text-secondary hover:text-white'
                  }`}
                >
                  <FiFilter size={11} /> Grille
                </button>
              </div>
            </div>

            {/* ── Filtres genres (scroll horizontal) ── */}
            {availableGenres.length > 0 && (
              <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-2">
                {/* Bouton "Tous" */}
                <button
                  onClick={() => setActiveGenre(null)}
                  className={`flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-200 ${
                    activeGenre === null
                      ? 'bg-nova-gradient text-white shadow-nova'
                      : 'glass border border-nova-border text-text-secondary hover:text-white hover:border-nova-primary/40'
                  }`}
                >
                  Tous
                </button>

                {availableGenres.map((genre) => (
                  <button
                    key={genre.id}
                    onClick={() => setActiveGenre(genre.id === activeGenre ? null : genre.id)}
                    className={`flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-200 ${
                      activeGenre === genre.id
                        ? 'bg-nova-gradient text-white shadow-nova'
                        : 'glass border border-nova-border text-text-secondary hover:text-white hover:border-nova-primary/40'
                    }`}
                  >
                    {genre.name}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* ── Contenu principal ── */}
          <main className="pb-24 space-y-10 relative z-10">

            <AnimatePresence mode="wait">
              {viewMode === 'rows' ? (
                /* ── Vue rangées ── */
                <motion.div
                  key="rows"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="space-y-8"
                >
                  {/* Sections fixes si filtre "Tous" */}
                  {activeGenre === null && (
                    <>
                      <RowSection title={`${label} populaires`} movies={popular} accentColor="violet" onSelect={setSelectedMovie} />
                      <RowSection title="Les mieux notés" movies={topRated} accentColor="cyan" onSelect={setSelectedMovie} showRank />
                      <RowSection title={isFilms ? 'Sorties récentes' : 'En cours de diffusion'} movies={recent} accentColor="violet" onSelect={setSelectedMovie} />
                    </>
                  )}

                  {/* Sections par genre */}
                  {filteredSections.map((section, i) => (
                    <RowSection
                      key={section.genre.id}
                      title={section.genre.name}
                      movies={section.movies}
                      accentColor={i % 2 === 0 ? 'cyan' : 'violet'}
                      onSelect={setSelectedMovie}
                    />
                  ))}
                </motion.div>
              ) : (
                /* ── Vue grille ── */
                <motion.div
                  key="grid"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="px-6 sm:px-8 lg:px-12"
                >
                  <p className="text-xs text-text-muted mb-4">
                    {gridMovies.length} titre{gridMovies.length !== 1 ? 's' : ''}
                  </p>
                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-7 xl:grid-cols-9 gap-3">
                    {gridMovies.map((movie, i) => (
                      <MovieCard
                        key={movie.id}
                        movie={movie}
                        onSelect={setSelectedMovie}
                        index={i}
                      />
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </main>
        </>
      ) : (
        <EmptyState type={type} />
      )}

      <VideoModal
        movie={selectedMovie}
        onClose={() => setSelectedMovie(null)}
        onMovieSelect={setSelectedMovie}
      />
    </div>
  )
}

// ── Sous-composant rangée ──────────────────────────────────────────────
function RowSection({
  title, movies, accentColor, onSelect, showRank = false,
}: {
  title: string
  movies: Movie[]
  accentColor: 'violet' | 'cyan'
  onSelect: (m: Movie) => void
  showRank?: boolean
}) {
  if (!movies.length) return null

  return (
    <section className="space-y-3">
      <div className="flex items-center gap-3 px-6 sm:px-8 lg:px-12">
        <div className={`w-1 h-5 rounded-full ${
          accentColor === 'cyan' ? 'bg-nova-secondary shadow-cyan' : 'bg-nova-primary shadow-nova'
        }`} />
        <h2 className="text-base font-bold text-white">{title}</h2>
        <div className="flex-1 h-px bg-gradient-to-r from-nova-border to-transparent ml-2" />
      </div>

      <div className="flex gap-3 overflow-x-auto scrollbar-hide px-6 sm:px-8 lg:px-12 pb-2">
        {movies.map((movie, i) => (
          <div key={movie.id} className="flex-shrink-0">
            <MovieCard movie={movie} onSelect={onSelect} index={i} showRank={showRank} />
          </div>
        ))}
      </div>
    </section>
  )
}

// ── État vide ─────────────────────────────────────────────────────────
function EmptyState({ type }: { type: 'films' | 'series' }) {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center space-y-3">
        <div className="w-16 h-16 rounded-2xl bg-nova-primary/10 flex items-center justify-center mx-auto">
          {type === 'films' ? <FiFilm size={28} className="text-nova-primary" /> : <FiTv size={28} className="text-nova-primary" />}
        </div>
        <p className="text-white font-bold">Aucun contenu disponible</p>
        <p className="text-sm text-text-secondary">Vérifiez votre clé TMDB dans .env.local</p>
      </div>
    </div>
  )
}
