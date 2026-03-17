// components/MovieCard.tsx — Carte film/série avec hover premium NovaFlix
'use client'

import { useState } from 'react'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import { FiPlay, FiPlus, FiThumbsUp, FiStar, FiCalendar } from 'react-icons/fi'
import type { Movie } from '@/lib/tmdb'
import { TMDB_IMAGE } from '@/lib/tmdb'

interface MovieCardProps {
  movie: Movie
  onSelect: (movie: Movie) => void
  index?: number
  showRank?: boolean   // affiche "Top N" si true
}

/**
 * Carte film/série :
 * - État normal  : poster + barre de hover subtile
 * - État hover   : scale + overlay avec infos + boutons
 * - Glassmorphism sur les infos au hover
 */
export default function MovieCard({
  movie,
  onSelect,
  index = 0,
  showRank = false,
}: MovieCardProps) {
  const [isHovered, setIsHovered] = useState(false)
  const [imgError, setImgError]   = useState(false)

  const title     = movie.title ?? movie.name ?? 'Sans titre'
  const poster    = movie.poster_path && !imgError
    ? TMDB_IMAGE.w300(movie.poster_path)
    : null
  const year      = (movie.release_date ?? movie.first_air_date ?? '').slice(0, 4)
  const score     = movie.vote_average.toFixed(1)
  const isGoodScore = movie.vote_average >= 7

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.05 }}
      className="relative flex-shrink-0 w-36 sm:w-44 cursor-pointer"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => onSelect(movie)}
    >
      {/* ── Conteneur principal avec l'effet de zoom ── */}
      <motion.div
        animate={{
          scale: isHovered ? 1.08 : 1,
          zIndex: isHovered ? 20 : 0,
        }}
        transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
        className="relative rounded-xl overflow-hidden bg-nova-card shadow-card"
        style={{ aspectRatio: '2/3' }}
      >
        {/* Image poster */}
        {poster ? (
          <Image
            src={poster}
            alt={title}
            fill
            className="object-cover"
            sizes="(max-width: 640px) 144px, 176px"
            onError={() => setImgError(true)}
          />
        ) : (
          /* Placeholder si pas d'image */
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-nova-primary/30 to-nova-bg gap-2 p-3">
            <div className="w-12 h-12 rounded-full bg-nova-primary/20 flex items-center justify-center">
              <FiPlay size={20} className="text-nova-secondary ml-0.5" />
            </div>
            <p className="text-xs text-center text-text-secondary font-medium leading-tight">
              {title}
            </p>
          </div>
        )}

        {/* Badge "Top N" */}
        {showRank && index < 10 && (
          <div className="absolute top-2 left-2 z-10">
            <span className="px-2 py-0.5 text-xs font-black rounded-md bg-nova-gradient text-white shadow-nova">
              #{index + 1}
            </span>
          </div>
        )}

        {/* ── Overlay au hover ── */}
        <AnimatePresence>
          {isHovered && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="absolute inset-0 flex flex-col justify-end"
            >
              {/* Dégradé sombre */}
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent" />

              {/* Bord lumineux violet */}
              <div
                className="absolute inset-0 rounded-xl pointer-events-none"
                style={{ boxShadow: 'inset 0 0 0 1.5px rgba(124,58,237,0.6)' }}
              />

              {/* Infos en bas */}
              <div className="relative z-10 p-3 space-y-2">
                {/* Titre */}
                <p className="text-xs font-bold text-white leading-tight line-clamp-2">
                  {title}
                </p>

                {/* Méta : année + score */}
                <div className="flex items-center justify-between">
                  {year && (
                    <span className="flex items-center gap-1 text-[10px] text-text-secondary">
                      <FiCalendar size={9} /> {year}
                    </span>
                  )}
                  <span
                    className={`flex items-center gap-1 text-[10px] font-semibold ${
                      isGoodScore ? 'text-green-400' : 'text-yellow-400'
                    }`}
                  >
                    <FiStar size={9} /> {score}
                  </span>
                </div>

                {/* Boutons d'action */}
                <div className="flex items-center gap-1.5 pt-1">
                  {/* Play */}
                  <button
                    onClick={(e) => { e.stopPropagation(); onSelect(movie) }}
                    className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-md bg-nova-gradient text-white text-[10px] font-semibold hover:opacity-90 transition-opacity"
                  >
                    <FiPlay size={11} className="fill-current" /> Voir
                  </button>

                  {/* Ajouter à la liste */}
                  <button
                    onClick={(e) => e.stopPropagation()}
                    className="p-1.5 rounded-md glass text-text-secondary hover:text-nova-secondary hover:border-nova-secondary/40 transition-colors"
                    title="Ajouter à ma liste"
                  >
                    <FiPlus size={12} />
                  </button>

                  {/* Like */}
                  <button
                    onClick={(e) => e.stopPropagation()}
                    className="p-1.5 rounded-md glass text-text-secondary hover:text-green-400 transition-colors"
                    title="J'aime"
                  >
                    <FiThumbsUp size={12} />
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Titre affiché sous la carte (non hover) */}
      <p className="mt-1.5 text-xs text-text-secondary text-center truncate px-1 transition-colors duration-200 group-hover:text-white">
        {title}
      </p>
    </motion.div>
  )
}
