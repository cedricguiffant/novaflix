// components/Hero.tsx — Hero Banner dynamique NovaFlix
'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import { FiPlay, FiInfo, FiStar, FiCalendar } from 'react-icons/fi'
import { HiOutlineVolumeUp, HiOutlineVolumeOff } from 'react-icons/hi'
import type { Movie } from '@/lib/tmdb'
import { TMDB_IMAGE } from '@/lib/tmdb'

interface HeroProps {
  movies: Movie[]
  onMovieSelect: (movie: Movie) => void
}

/**
 * Hero Banner : affiche un film featured avec rotation automatique toutes les 8s
 * Design premium : dégradé sombre, badge score, boutons Play/Plus d'infos
 */
export default function Hero({ movies, onMovieSelect }: HeroProps) {
  const [currentIndex, setCurrentIndex]   = useState(0)
  const [isMuted, setIsMuted]             = useState(true)
  const [isAutoPlay, setIsAutoPlay]       = useState(true)

  // Rotation automatique des films en Hero
  useEffect(() => {
    if (!isAutoPlay || movies.length === 0) return
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % Math.min(movies.length, 5))
    }, 8000)
    return () => clearInterval(timer)
  }, [isAutoPlay, movies.length])

  if (!movies.length) return <HeroSkeleton />

  const movie = movies[currentIndex]
  const title = movie.title ?? movie.name ?? 'Sans titre'
  const backdrop = movie.backdrop_path
    ? TMDB_IMAGE.original(movie.backdrop_path)
    : null
  const year = (movie.release_date ?? movie.first_air_date ?? '').slice(0, 4)
  const score = movie.vote_average.toFixed(1)
  // Tronque la description à 200 caractères
  const description =
    movie.overview.length > 200
      ? movie.overview.slice(0, 200) + '…'
      : movie.overview

  return (
    <section className="relative w-full h-[85vh] min-h-[500px] overflow-hidden">

      {/* ── Image de fond avec AnimatePresence ── */}
      <AnimatePresence mode="wait">
        <motion.div
          key={movie.id}
          initial={{ opacity: 0, scale: 1.05 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className="absolute inset-0"
        >
          {backdrop ? (
            <Image
              src={backdrop}
              alt={title}
              fill
              priority
              className="object-cover object-center"
              sizes="100vw"
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-nova-primary/30 to-nova-bg" />
          )}

          {/* Overlays de dégradé pour la lisibilité */}
          <div className="absolute inset-0 img-overlay" />
          {/* Dégradé additionnel côté gauche */}
          <div className="absolute inset-0 bg-gradient-to-r from-nova-bg via-nova-bg/60 to-transparent" />
        </motion.div>
      </AnimatePresence>

      {/* ── Contenu du Hero ── */}
      <div className="relative z-10 h-full flex items-end pb-24 px-6 sm:px-12 lg:px-20 max-w-[1800px] mx-auto">
        <AnimatePresence mode="wait">
          <motion.div
            key={`content-${movie.id}`}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="max-w-2xl"
          >
            {/* Badge "NovaFlix Original" ou genre */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
              className="flex items-center gap-2 mb-3"
            >
              <span className="px-2.5 py-1 text-xs font-bold rounded-md bg-nova-gradient text-white tracking-wider uppercase">
                NovaFlix
              </span>
              {year && (
                <span className="flex items-center gap-1 text-xs text-text-secondary">
                  <FiCalendar size={11} /> {year}
                </span>
              )}
              <span className="flex items-center gap-1 text-xs font-semibold text-yellow-400">
                <FiStar size={11} /> {score}
              </span>
            </motion.div>

            {/* Titre */}
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.45 }}
              className="text-4xl sm:text-5xl lg:text-6xl font-black leading-tight text-white drop-shadow-2xl mb-4"
            >
              {title}
            </motion.h1>

            {/* Description */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.55 }}
              className="text-sm sm:text-base text-text-secondary leading-relaxed mb-8 max-w-lg"
            >
              {description}
            </motion.p>

            {/* Boutons d'action */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.65 }}
              className="flex items-center gap-3 flex-wrap"
            >
              {/* Bouton Play */}
              <button
                onClick={() => onMovieSelect(movie)}
                className="btn-nova group"
              >
                <span className="flex items-center gap-2">
                  <FiPlay size={18} className="fill-current" />
                  <span>Regarder</span>
                </span>
              </button>

              {/* Bouton Plus d'infos */}
              <button
                onClick={() => onMovieSelect(movie)}
                className="btn-ghost"
              >
                <FiInfo size={18} />
                <span>Plus d&apos;infos</span>
              </button>
            </motion.div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* ── Indicateurs de pagination (dots) ── */}
      <div className="absolute bottom-8 right-8 z-20 flex items-center gap-2">
        {movies.slice(0, 5).map((_, i) => (
          <button
            key={i}
            onClick={() => {
              setCurrentIndex(i)
              setIsAutoPlay(false)
            }}
            className={`rounded-full transition-all duration-300 ${
              i === currentIndex
                ? 'w-6 h-2 bg-nova-secondary'
                : 'w-2 h-2 bg-white/30 hover:bg-white/60'
            }`}
            aria-label={`Film ${i + 1}`}
          />
        ))}
      </div>

      {/* ── Bouton son ── */}
      <button
        onClick={() => setIsMuted(!isMuted)}
        className="absolute bottom-8 left-6 sm:left-12 lg:left-20 z-20 p-2 glass rounded-full text-text-secondary hover:text-white transition-colors"
        aria-label={isMuted ? 'Activer le son' : 'Couper le son'}
      >
        {isMuted ? <HiOutlineVolumeOff size={18} /> : <HiOutlineVolumeUp size={18} />}
      </button>

      {/* ── Dégradé bas de page vers fond noir ── */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-nova-bg to-transparent pointer-events-none" />
    </section>
  )
}

// ── Skeleton loader du Hero ──
function HeroSkeleton() {
  return (
    <div className="relative w-full h-[85vh] min-h-[500px] bg-nova-card animate-pulse">
      <div className="absolute bottom-24 left-6 sm:left-12 lg:left-20 space-y-4 max-w-2xl">
        <div className="h-4 w-32 bg-white/10 rounded" />
        <div className="h-12 w-80 bg-white/10 rounded" />
        <div className="h-4 w-96 bg-white/10 rounded" />
        <div className="h-4 w-72 bg-white/10 rounded" />
        <div className="flex gap-3 mt-6">
          <div className="h-12 w-32 bg-white/10 rounded-lg" />
          <div className="h-12 w-36 bg-white/10 rounded-lg" />
        </div>
      </div>
    </div>
  )
}
