// components/AnimeModal.tsx
// Modal détail anime : trailer YouTube, synopsis, genres, infos

'use client'

import { useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FiX, FiStar, FiTv, FiCalendar, FiFilm } from 'react-icons/fi'
import type { Anime } from '@/lib/jikan'
import { getAnimeTitle, getAnimePoster } from '@/lib/jikan'

interface AnimeModalProps {
  anime: Anime | null
  onClose: () => void
}

export default function AnimeModal({ anime, onClose }: AnimeModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null)

  // Fermer avec Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  // Bloquer le scroll body
  useEffect(() => {
    document.body.style.overflow = anime ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [anime])

  if (!anime) return null

  const title       = getAnimeTitle(anime)
  const posterUrl   = getAnimePoster(anime)
  const trailerKey  = anime.trailer?.youtube_id
  const allGenres   = [...(anime.genres ?? []), ...(anime.themes ?? [])]
  const studio      = anime.studios?.[0]?.name

  const statusLabel: Record<string, string> = {
    'Finished Airing':    'Terminé',
    'Currently Airing':   'En cours',
    'Not yet aired':      'À venir',
  }

  return (
    <AnimatePresence>
      <motion.div
        ref={overlayRef}
        key="anime-modal-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-center justify-center p-4"
        style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)' }}
        onClick={(e) => { if (e.target === overlayRef.current) onClose() }}
      >
        <motion.div
          key="anime-modal-content"
          initial={{ opacity: 0, scale: 0.92, y: 24 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.92, y: 24 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
          className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-2xl glass-strong border border-nova-border shadow-nova"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Bouton fermer */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-10 w-9 h-9 rounded-full glass border border-nova-border flex items-center justify-center text-text-secondary hover:text-white hover:border-nova-primary/50 transition-all"
          >
            <FiX size={18} />
          </button>

          {/* ── Trailer ou bannière ── */}
          <div className="relative w-full bg-black" style={{ aspectRatio: '16/9' }}>
            {trailerKey ? (
              <iframe
                src={`https://www.youtube.com/embed/${trailerKey}?autoplay=1&mute=1&rel=0&modestbranding=1`}
                title={`Trailer — ${title}`}
                className="w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            ) : (
              /* Poster en bannière si pas de trailer */
              <div className="w-full h-full relative overflow-hidden">
                {posterUrl && (
                  <>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={posterUrl}
                      alt={title}
                      className="w-full h-full object-contain bg-black"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  </>
                )}
                <div className="absolute inset-0 flex items-center justify-center">
                  <p className="text-text-muted text-sm">Aucun trailer disponible</p>
                </div>
              </div>
            )}
          </div>

          {/* ── Contenu ── */}
          <div className="p-6">
            <div className="flex gap-5">
              {/* Poster miniature */}
              {posterUrl && (
                <div className="hidden sm:block flex-shrink-0">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={posterUrl}
                    alt={title}
                    className="w-24 rounded-lg shadow-lg"
                    style={{ aspectRatio: '2/3', objectFit: 'cover' }}
                  />
                </div>
              )}

              <div className="flex-1 min-w-0">
                {/* Titre */}
                <h2 className="text-xl sm:text-2xl font-black text-white leading-tight mb-1">
                  {title}
                </h2>
                {anime.title !== title && (
                  <p className="text-sm text-text-muted mb-3">{anime.title}</p>
                )}

                {/* Méta */}
                <div className="flex flex-wrap items-center gap-3 text-sm mb-4">
                  {anime.score != null && (
                    <span className="flex items-center gap-1 text-yellow-400 font-bold">
                      <FiStar size={14} className="fill-yellow-400" />
                      {anime.score.toFixed(2)}
                      {anime.scored_by && (
                        <span className="text-text-muted font-normal text-xs">
                          ({(anime.scored_by / 1000).toFixed(0)}k votes)
                        </span>
                      )}
                    </span>
                  )}
                  {anime.type && (
                    <span className="flex items-center gap-1 text-text-secondary">
                      <FiTv size={13} /> {anime.type}
                    </span>
                  )}
                  {anime.episodes && (
                    <span className="text-text-secondary">{anime.episodes} épisodes</span>
                  )}
                  {anime.year && (
                    <span className="flex items-center gap-1 text-text-secondary">
                      <FiCalendar size={13} /> {anime.year}
                    </span>
                  )}
                  {anime.season && (
                    <span className="capitalize text-text-secondary">{anime.season}</span>
                  )}
                  {anime.status && (
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      anime.airing
                        ? 'bg-green-500/20 text-green-400'
                        : 'bg-nova-primary/20 text-nova-secondary'
                    }`}>
                      {statusLabel[anime.status] ?? anime.status}
                    </span>
                  )}
                </div>

                {/* Studio */}
                {studio && (
                  <div className="flex items-center gap-1.5 text-sm text-text-muted mb-4">
                    <FiFilm size={13} />
                    <span>{studio}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Genres + thèmes */}
            {allGenres.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-4 mb-4">
                {allGenres.map((g) => (
                  <span
                    key={g.mal_id}
                    className="px-3 py-1 rounded-full text-xs font-medium glass border border-nova-border text-text-secondary"
                  >
                    {g.name}
                  </span>
                ))}
              </div>
            )}

            {/* Synopsis */}
            {anime.synopsis && (
              <div>
                <h3 className="text-sm font-semibold text-white mb-2">Synopsis</h3>
                <p className="text-sm text-text-secondary leading-relaxed">
                  {anime.synopsis}
                </p>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
