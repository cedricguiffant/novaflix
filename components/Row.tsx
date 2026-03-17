// components/Row.tsx — Carrousel horizontal de films/séries NovaFlix
'use client'

import { useRef, useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import { FiChevronLeft, FiChevronRight } from 'react-icons/fi'
import MovieCard from './MovieCard'
import type { Movie } from '@/lib/tmdb'

interface RowProps {
  title: string
  movies: Movie[]
  onMovieSelect: (movie: Movie) => void
  showRank?: boolean         // affiche les badges "Top N"
  accentColor?: 'violet' | 'cyan'  // couleur du titre
}

/**
 * Row carrousel :
 * - Scroll horizontal fluide avec boutons flèche
 * - Fade sur les bords (gauche/droite)
 * - Titre de section avec ligne décorative NovaFlix
 */
export default function Row({
  title,
  movies,
  onMovieSelect,
  showRank = false,
  accentColor = 'violet',
}: RowProps) {
  const rowRef = useRef<HTMLDivElement>(null)
  const [showLeftArrow, setShowLeftArrow]   = useState(false)
  const [showRightArrow, setShowRightArrow] = useState(true)

  // Met à jour la visibilité des flèches selon la position du scroll
  const updateArrows = useCallback(() => {
    const el = rowRef.current
    if (!el) return
    setShowLeftArrow(el.scrollLeft > 10)
    setShowRightArrow(el.scrollLeft < el.scrollWidth - el.clientWidth - 10)
  }, [])

  // Scroll d'une "page" (80% de la largeur visible)
  const scroll = (direction: 'left' | 'right') => {
    const el = rowRef.current
    if (!el) return
    const distance = el.clientWidth * 0.8
    el.scrollBy({ left: direction === 'left' ? -distance : distance, behavior: 'smooth' })
    setTimeout(updateArrows, 400)
  }

  if (!movies.length) return null

  return (
    <section className="mb-10 relative group/row">
      {/* ── En-tête de section ── */}
      <div className="flex items-center gap-3 mb-4 px-6 sm:px-8 lg:px-12">
        {/* Trait de couleur accent */}
        <div
          className={`w-1 h-6 rounded-full ${
            accentColor === 'cyan'
              ? 'bg-nova-secondary shadow-cyan'
              : 'bg-nova-primary shadow-nova'
          }`}
        />
        <h2 className="text-base sm:text-lg font-bold text-white tracking-wide">
          {title}
        </h2>
        {/* Ligne décorative fine */}
        <div className="flex-1 h-px bg-gradient-to-r from-nova-border to-transparent ml-2" />
        {/* Indicateur de nombre */}
        <span className="text-xs text-text-muted font-medium hidden sm:block">
          {movies.length} titres
        </span>
      </div>

      {/* ── Zone de scroll ── */}
      <div className="relative">
        {/* Fade gauche */}
        {showLeftArrow && (
          <div className="absolute left-0 top-0 bottom-0 w-16 bg-gradient-to-r from-nova-bg to-transparent z-10 pointer-events-none" />
        )}
        {/* Fade droit */}
        {showRightArrow && (
          <div className="absolute right-0 top-0 bottom-0 w-16 bg-gradient-to-l from-nova-bg to-transparent z-10 pointer-events-none" />
        )}

        {/* ── Bouton flèche gauche ── */}
        {showLeftArrow && (
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => scroll('left')}
            className="absolute left-2 top-1/2 -translate-y-6 z-20 w-9 h-9 glass rounded-full flex items-center justify-center text-white hover:bg-nova-primary/30 hover:shadow-nova hover:border-nova-primary/40 transition-all duration-200 shadow-card"
            aria-label="Défiler à gauche"
          >
            <FiChevronLeft size={18} />
          </motion.button>
        )}

        {/* ── Bouton flèche droite ── */}
        {showRightArrow && (
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            onClick={() => scroll('right')}
            className="absolute right-2 top-1/2 -translate-y-6 z-20 w-9 h-9 glass rounded-full flex items-center justify-center text-white hover:bg-nova-primary/30 hover:shadow-nova hover:border-nova-primary/40 transition-all duration-200 shadow-card"
            aria-label="Défiler à droite"
          >
            <FiChevronRight size={18} />
          </motion.button>
        )}

        {/* ── Conteneur scroll ── */}
        <div
          ref={rowRef}
          onScroll={updateArrows}
          className="flex gap-3 overflow-x-auto scrollbar-hide px-6 sm:px-8 lg:px-12 pb-2"
          style={{ scrollSnapType: 'x mandatory' }}
        >
          {movies.map((movie, i) => (
            <div key={movie.id} style={{ scrollSnapAlign: 'start' }}>
              <MovieCard
                movie={movie}
                onSelect={onMovieSelect}
                index={i}
                showRank={showRank}
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
