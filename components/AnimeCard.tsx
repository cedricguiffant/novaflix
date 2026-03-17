// components/AnimeCard.tsx
// Carte anime utilisant les URLs d'images Jikan (pas TMDB)

'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { FiPlay, FiPlus, FiStar } from 'react-icons/fi'
import type { Anime } from '@/lib/jikan'
import { getAnimeTitle, getAnimePoster } from '@/lib/jikan'

interface AnimeCardProps {
  anime: Anime
  onSelect: (a: Anime) => void
  index?: number
  showRank?: boolean
}

export default function AnimeCard({
  anime,
  onSelect,
  index = 0,
  showRank = false,
}: AnimeCardProps) {
  const [imgError, setImgError] = useState(false)
  const title  = getAnimeTitle(anime)
  const imgUrl = getAnimePoster(anime)

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.04, 0.6), duration: 0.4 }}
      className="relative group cursor-pointer w-[130px] sm:w-[140px] flex-shrink-0"
      onClick={() => onSelect(anime)}
    >
      {/* Rank badge */}
      {showRank && (
        <div className="absolute -left-2 -top-2 z-10 w-7 h-7 rounded-full bg-nova-gradient flex items-center justify-center text-xs font-black text-white shadow-nova">
          {index + 1}
        </div>
      )}

      {/* Poster */}
      <div className="relative overflow-hidden rounded-lg bg-nova-card" style={{ aspectRatio: '2/3' }}>
        {!imgError && imgUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={imgUrl}
            alt={title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
            onError={() => setImgError(true)}
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center p-2">
            <span className="text-text-muted text-xs text-center leading-tight">{title}</span>
          </div>
        )}

        {/* Overlay hover */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/60 transition-all duration-300 flex flex-col items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
          <button
            onClick={(e) => { e.stopPropagation(); onSelect(anime) }}
            className="w-10 h-10 rounded-full bg-white flex items-center justify-center hover:scale-110 transition-transform shadow-lg"
            aria-label="Voir l'anime"
          >
            <FiPlay size={16} className="text-black ml-0.5" />
          </button>
          <button
            onClick={(e) => e.stopPropagation()}
            className="w-8 h-8 rounded-full glass border border-nova-border flex items-center justify-center hover:border-nova-primary/60 transition-colors"
            aria-label="Ajouter à ma liste"
          >
            <FiPlus size={14} className="text-white" />
          </button>
        </div>

        {/* Score badge */}
        {anime.score != null && (
          <div className="absolute top-1.5 right-1.5 flex items-center gap-0.5 bg-black/70 backdrop-blur-sm rounded px-1.5 py-0.5">
            <FiStar size={9} className="text-yellow-400 fill-yellow-400" />
            <span className="text-[10px] font-bold text-white">{anime.score.toFixed(1)}</span>
          </div>
        )}

        {/* Type badge (TV / Movie / OVA…) */}
        {anime.type && anime.type !== 'TV' && (
          <div className="absolute top-1.5 left-1.5 bg-nova-primary/80 backdrop-blur-sm rounded px-1.5 py-0.5">
            <span className="text-[9px] font-bold text-white uppercase">{anime.type}</span>
          </div>
        )}
      </div>

      {/* Titre */}
      <p className="mt-1.5 text-xs font-medium text-text-secondary group-hover:text-white transition-colors line-clamp-2 leading-tight">
        {title}
      </p>

      {/* Episodes */}
      {anime.episodes && (
        <p className="text-[10px] text-text-muted">{anime.episodes} ép.</p>
      )}
    </motion.div>
  )
}
