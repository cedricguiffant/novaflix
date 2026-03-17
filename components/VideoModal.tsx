// components/VideoModal.tsx — Modal lecteur vidéo + infos film NovaFlix
'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  FiX, FiPlay, FiPlus, FiThumbsUp, FiThumbsDown,
  FiStar, FiCalendar, FiClock, FiShare2, FiCheck,
} from 'react-icons/fi'
import type { Movie, MovieDetails } from '@/lib/tmdb'
import { TMDB_IMAGE, getTrailer, getDetails, getSimilar } from '@/lib/tmdb'
import MovieCard from './MovieCard'

interface VideoModalProps {
  movie: Movie | null
  onClose: () => void
  onMovieSelect: (movie: Movie) => void
}

/**
 * Modal plein-écran avec :
 * - Lecteur YouTube (bande-annonce)
 * - Boutons like / dislike / ajouter à la liste
 * - Détails complets du film
 * - Films similaires
 * - Design glassmorphism premium
 */
export default function VideoModal({ movie, onClose, onMovieSelect }: VideoModalProps) {
  const [trailerKey, setTrailerKey]     = useState<string | null>(null)
  const [details, setDetails]           = useState<MovieDetails | null>(null)
  const [similar, setSimilar]           = useState<Movie[]>([])
  const [isLoading, setIsLoading]       = useState(false)
  const [liked, setLiked]               = useState<boolean | null>(null)
  const [inWatchlist, setInWatchlist]   = useState(false)
  const [showShareMsg, setShowShareMsg] = useState(false)

  const mediaType = movie?.media_type === 'tv' ? 'tv' : 'movie'

  // Chargement des données du film sélectionné
  useEffect(() => {
    if (!movie) return
    setIsLoading(true)
    setTrailerKey(null)
    setDetails(null)
    setSimilar([])
    setLiked(null)
    setInWatchlist(false)

    Promise.all([
      getTrailer(movie.id, mediaType),
      getDetails(movie.id, mediaType),
      getSimilar(movie.id, mediaType),
    ]).then(([key, det, sim]) => {
      setTrailerKey(key)
      setDetails(det)
      setSimilar(sim.slice(0, 12))
    }).finally(() => setIsLoading(false))
  }, [movie, mediaType])

  // Fermeture avec Escape
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() },
    [onClose]
  )
  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = 'unset'
    }
  }, [handleKeyDown])

  // Partage
  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href)
    setShowShareMsg(true)
    setTimeout(() => setShowShareMsg(false), 2000)
  }

  if (!movie) return null

  const title     = movie.title ?? movie.name ?? 'Sans titre'
  const backdrop  = movie.backdrop_path ? TMDB_IMAGE.original(movie.backdrop_path) : null
  const year      = (movie.release_date ?? movie.first_air_date ?? '').slice(0, 4)
  const score     = movie.vote_average.toFixed(1)
  const runtime   = details?.runtime
  const genres    = details?.genres ?? []
  const tagline   = details?.tagline

  return (
    <AnimatePresence>
      {movie && (
        <>
          {/* ── Backdrop cliquable ── */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* ── Modal principale ── */}
          <motion.div
            key="modal"
            initial={{ opacity: 0, y: 60, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 40, scale: 0.97 }}
            transition={{ duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="fixed inset-x-4 top-6 bottom-4 z-50 md:inset-x-auto md:left-1/2 md:-translate-x-1/2 md:w-full md:max-w-4xl overflow-y-auto rounded-2xl glass-strong border border-nova-primary/20 shadow-nova-lg scrollbar-hide"
          >
            {/* ── Bouton fermer ── */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 z-50 w-10 h-10 glass rounded-full flex items-center justify-center text-white hover:bg-nova-primary/20 hover:shadow-nova transition-all"
              aria-label="Fermer"
            >
              <FiX size={18} />
            </button>

            {/* ── Zone vidéo / image ── */}
            <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
              {isLoading ? (
                <div className="absolute inset-0 bg-nova-card flex items-center justify-center rounded-t-2xl">
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-10 h-10 border-2 border-nova-primary border-t-transparent rounded-full animate-spin" />
                    <p className="text-sm text-text-secondary">Chargement…</p>
                  </div>
                </div>
              ) : trailerKey ? (
                <iframe
                  className="absolute inset-0 w-full h-full rounded-t-2xl"
                  src={`https://www.youtube.com/embed/${trailerKey}?autoplay=1&mute=1&controls=1&modestbranding=1&rel=0`}
                  title={`Bande-annonce ${title}`}
                  allow="autoplay; encrypted-media"
                  allowFullScreen
                />
              ) : backdrop ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={backdrop}
                  alt={title}
                  className="absolute inset-0 w-full h-full object-cover rounded-t-2xl"
                />
              ) : (
                <div className="absolute inset-0 bg-gradient-to-br from-nova-primary/20 to-nova-bg rounded-t-2xl flex items-center justify-center">
                  <FiPlay size={48} className="text-nova-secondary opacity-50" />
                </div>
              )}

              {/* Overlay bas sur la vidéo */}
              <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-[#141414] to-transparent rounded-b pointer-events-none" />
            </div>

            {/* ── Contenu info ── */}
            <div className="px-6 py-5 space-y-5">

              {/* Titre + actions */}
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div className="space-y-1">
                  <h2 className="text-2xl sm:text-3xl font-black text-white">{title}</h2>
                  {tagline && (
                    <p className="text-sm italic text-nova-secondary opacity-80">{tagline}</p>
                  )}
                </div>

                {/* Boutons actions */}
                <div className="flex items-center gap-2 flex-wrap">
                  {/* Play */}
                  <button className="btn-nova py-2 px-4 text-sm">
                    <span className="flex items-center gap-1.5">
                      <FiPlay size={15} className="fill-current" /> Regarder
                    </span>
                  </button>

                  {/* Ma liste */}
                  <button
                    onClick={() => setInWatchlist(!inWatchlist)}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                      inWatchlist
                        ? 'bg-nova-primary/30 text-nova-secondary border border-nova-primary/40'
                        : 'glass text-text-secondary hover:text-white hover:border-nova-primary/30'
                    }`}
                    title={inWatchlist ? 'Retirer de ma liste' : 'Ajouter à ma liste'}
                  >
                    {inWatchlist ? <FiCheck size={15} /> : <FiPlus size={15} />}
                    <span className="hidden sm:inline">Ma liste</span>
                  </button>

                  {/* Like */}
                  <button
                    onClick={() => setLiked(liked === true ? null : true)}
                    className={`p-2 rounded-lg transition-all duration-200 ${
                      liked === true
                        ? 'bg-green-500/20 text-green-400'
                        : 'glass text-text-secondary hover:text-green-400'
                    }`}
                    title="J'aime"
                  >
                    <FiThumbsUp size={17} />
                  </button>

                  {/* Dislike */}
                  <button
                    onClick={() => setLiked(liked === false ? null : false)}
                    className={`p-2 rounded-lg transition-all duration-200 ${
                      liked === false
                        ? 'bg-red-500/20 text-red-400'
                        : 'glass text-text-secondary hover:text-red-400'
                    }`}
                    title="Je n'aime pas"
                  >
                    <FiThumbsDown size={17} />
                  </button>

                  {/* Partager */}
                  <button
                    onClick={handleShare}
                    className="relative p-2 rounded-lg glass text-text-secondary hover:text-nova-secondary transition-colors"
                    title="Partager"
                  >
                    <FiShare2 size={17} />
                    <AnimatePresence>
                      {showShareMsg && (
                        <motion.span
                          initial={{ opacity: 0, y: 4 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0 }}
                          className="absolute -top-8 left-1/2 -translate-x-1/2 text-[10px] bg-nova-card border border-nova-border px-2 py-1 rounded whitespace-nowrap text-white"
                        >
                          Copié !
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </button>
                </div>
              </div>

              {/* Méta-données */}
              <div className="flex items-center gap-4 flex-wrap">
                {year && (
                  <span className="flex items-center gap-1.5 text-sm text-text-secondary">
                    <FiCalendar size={13} className="text-nova-secondary" /> {year}
                  </span>
                )}
                {runtime && (
                  <span className="flex items-center gap-1.5 text-sm text-text-secondary">
                    <FiClock size={13} className="text-nova-secondary" />
                    {Math.floor(runtime / 60)}h{String(runtime % 60).padStart(2, '0')}
                  </span>
                )}
                <span className="flex items-center gap-1.5 text-sm font-semibold text-yellow-400">
                  <FiStar size={13} /> {score} / 10
                  <span className="text-text-muted font-normal text-xs">
                    ({movie.vote_count.toLocaleString()} votes)
                  </span>
                </span>
              </div>

              {/* Genres */}
              {genres.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {genres.map((g) => (
                    <span
                      key={g.id}
                      className="px-3 py-1 text-xs font-medium rounded-full glass border border-nova-primary/20 text-text-secondary"
                    >
                      {g.name}
                    </span>
                  ))}
                </div>
              )}

              {/* Synopsis */}
              {movie.overview && (
                <div>
                  <h3 className="text-sm font-bold text-white mb-2">Synopsis</h3>
                  <p className="text-sm text-text-secondary leading-relaxed">
                    {movie.overview}
                  </p>
                </div>
              )}

              {/* Divider */}
              <div className="divider-nova" />

              {/* ── Films similaires ── */}
              {similar.length > 0 && (
                <div>
                  <h3 className="text-sm font-bold text-white mb-4">
                    Titres similaires
                  </h3>
                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
                    {similar.slice(0, 6).map((m, i) => (
                      <MovieCard
                        key={m.id}
                        movie={m}
                        onSelect={(selected) => {
                          onMovieSelect(selected)
                          window.scrollTo({ top: 0, behavior: 'smooth' })
                        }}
                        index={i}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
