// components/AnimeBrowsePage.tsx
// Page anime : Hero rotatif, filtres genre, vue rangées / grille, modal

'use client'

import { useState, useMemo, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FiFilter, FiPlay, FiPlus, FiStar, FiTv, FiChevronLeft, FiChevronRight } from 'react-icons/fi'
import Header from '@/components/Header'
import AnimeCard from '@/components/AnimeCard'
import AnimeModal from '@/components/AnimeModal'
import type { Anime, AnimeGenre } from '@/lib/jikan'
import { getAnimeTitle, getAnimePoster } from '@/lib/jikan'

// ── Types ──────────────────────────────────────────────────────────────

interface AnimeSection {
  genre: AnimeGenre
  animes: Anime[]
}

interface AnimeBrowsePageProps {
  featured:      Anime[]
  topAnime:      Anime[]
  currentSeason: Anime[]
  movies:        Anime[]
  genreSections: AnimeSection[]
}

// ── Hero Anime ─────────────────────────────────────────────────────────

function AnimeHero({
  animes,
  onSelect,
}: {
  animes: Anime[]
  onSelect: (a: Anime) => void
}) {
  const [current, setCurrent] = useState(0)

  // Rotation automatique toutes les 8 secondes
  useEffect(() => {
    if (animes.length <= 1) return
    const id = setInterval(() => setCurrent((i) => (i + 1) % animes.length), 8000)
    return () => clearInterval(id)
  }, [animes.length])

  if (!animes.length) return null

  const anime   = animes[current]
  const title   = getAnimeTitle(anime)
  const poster  = getAnimePoster(anime)

  return (
    <div className="relative h-[70vh] min-h-[500px] max-h-[750px] overflow-hidden">
      {/* Background flou du poster */}
      <AnimatePresence mode="wait">
        <motion.div
          key={anime.mal_id}
          initial={{ opacity: 0, scale: 1.05 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8 }}
          className="absolute inset-0"
        >
          {poster && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={poster}
              alt=""
              className="w-full h-full object-cover object-top"
              style={{ filter: 'blur(2px) brightness(0.35)' }}
            />
          )}
          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-r from-nova-bg via-nova-bg/70 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-nova-bg via-transparent to-nova-bg/30" />
        </motion.div>
      </AnimatePresence>

      {/* Contenu */}
      <div className="relative z-10 h-full flex items-center px-6 sm:px-8 lg:px-12">
        <div className="flex gap-10 items-center w-full max-w-5xl">

          {/* Infos gauche */}
          <AnimatePresence mode="wait">
            <motion.div
              key={anime.mal_id + '-info'}
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.5 }}
              className="flex-1 space-y-4"
            >
              {/* Badge */}
              <div className="flex items-center gap-2">
                <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-nova-primary/20 border border-nova-primary/30 text-nova-secondary text-xs font-semibold">
                  <FiTv size={11} /> Anime
                </span>
                {anime.score != null && (
                  <span className="flex items-center gap-1 text-yellow-400 text-sm font-bold">
                    <FiStar size={13} className="fill-yellow-400" />
                    {anime.score.toFixed(1)}
                  </span>
                )}
                {anime.year && (
                  <span className="text-text-muted text-sm">{anime.year}</span>
                )}
              </div>

              {/* Titre */}
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white leading-tight max-w-lg">
                {title}
              </h1>

              {/* Meta */}
              <div className="flex flex-wrap items-center gap-2 text-sm text-text-secondary">
                {anime.type && <span>{anime.type}</span>}
                {anime.episodes && <span>• {anime.episodes} épisodes</span>}
                {anime.season && <span className="capitalize">• {anime.season}</span>}
                {anime.status && (
                  <span className={`px-2 py-0.5 rounded-full text-xs ${
                    anime.airing ? 'bg-green-500/20 text-green-400' : 'bg-nova-primary/20 text-nova-secondary'
                  }`}>
                    {anime.airing ? 'En cours' : 'Terminé'}
                  </span>
                )}
              </div>

              {/* Synopsis */}
              {anime.synopsis && (
                <p className="text-sm text-text-secondary leading-relaxed line-clamp-3 max-w-md">
                  {anime.synopsis}
                </p>
              )}

              {/* Genres */}
              {anime.genres?.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {anime.genres.slice(0, 4).map((g) => (
                    <span
                      key={g.mal_id}
                      className="px-2.5 py-0.5 rounded-full text-xs glass border border-nova-border text-text-secondary"
                    >
                      {g.name}
                    </span>
                  ))}
                </div>
              )}

              {/* Boutons */}
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => onSelect(anime)}
                  className="btn-nova py-2.5 px-6 text-sm"
                >
                  <FiPlay size={15} /> Voir la fiche
                </button>
                <button className="btn-ghost py-2.5 px-5 text-sm">
                  <FiPlus size={15} /> Ma liste
                </button>
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Poster droit */}
          <AnimatePresence mode="wait">
            <motion.div
              key={anime.mal_id + '-poster'}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.5 }}
              className="hidden lg:block flex-shrink-0"
            >
              {poster && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={poster}
                  alt={title}
                  className="w-52 xl:w-64 rounded-xl shadow-nova"
                  style={{ aspectRatio: '2/3', objectFit: 'cover' }}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Pagination dots + flèches */}
      {animes.length > 1 && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 flex items-center gap-3">
          <button
            onClick={() => setCurrent((i) => (i - 1 + animes.length) % animes.length)}
            className="p-1 text-text-muted hover:text-white transition-colors"
          >
            <FiChevronLeft size={16} />
          </button>
          {animes.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              className={`transition-all duration-300 rounded-full ${
                i === current
                  ? 'w-6 h-2 bg-nova-secondary'
                  : 'w-2 h-2 bg-white/30 hover:bg-white/60'
              }`}
            />
          ))}
          <button
            onClick={() => setCurrent((i) => (i + 1) % animes.length)}
            className="p-1 text-text-muted hover:text-white transition-colors"
          >
            <FiChevronRight size={16} />
          </button>
        </div>
      )}
    </div>
  )
}

// ── Rangée d'anime ─────────────────────────────────────────────────────

function AnimeRow({
  title,
  animes,
  accentColor,
  onSelect,
  showRank = false,
}: {
  title: string
  animes: Anime[]
  accentColor: 'violet' | 'cyan'
  onSelect: (a: Anime) => void
  showRank?: boolean
}) {
  const rowRef = useRef<HTMLDivElement>(null)
  const [showLeft, setShowLeft]   = useState(false)
  const [showRight, setShowRight] = useState(true)

  const updateArrows = useCallback(() => {
    const el = rowRef.current
    if (!el) return
    setShowLeft(el.scrollLeft > 10)
    setShowRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 10)
  }, [])

  const scroll = useCallback((dir: 'left' | 'right') => {
    const el = rowRef.current
    if (!el) return
    el.scrollBy({ left: dir === 'right' ? el.clientWidth * 0.8 : -el.clientWidth * 0.8, behavior: 'smooth' })
    setTimeout(updateArrows, 400)
  }, [updateArrows])

  if (!animes.length) return null

  return (
    <section className="space-y-3">
      {/* En-tête */}
      <div className="flex items-center gap-3 px-6 sm:px-8 lg:px-12">
        <div className={`w-1 h-5 rounded-full ${
          accentColor === 'cyan' ? 'bg-nova-secondary shadow-cyan' : 'bg-nova-primary shadow-nova'
        }`} />
        <h2 className="text-base font-bold text-white">{title}</h2>
        <div className="flex-1 h-px bg-gradient-to-r from-nova-border to-transparent ml-2" />
        <span className="text-xs text-text-muted font-medium hidden sm:block">{animes.length} titres</span>
      </div>

      {/* Zone scroll */}
      <div className="relative">
        {/* Fades bords */}
        {showLeft  && <div className="absolute left-0  top-0 bottom-0 w-16 bg-gradient-to-r from-nova-bg to-transparent z-10 pointer-events-none" />}
        {showRight && <div className="absolute right-0 top-0 bottom-0 w-16 bg-gradient-to-l from-nova-bg to-transparent z-10 pointer-events-none" />}

        {/* Flèche gauche */}
        {showLeft && (
          <motion.button
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => scroll('left')}
            className="absolute left-2 top-1/2 -translate-y-6 z-20 w-9 h-9 glass rounded-full flex items-center justify-center text-white hover:bg-nova-primary/30 hover:border-nova-primary/40 transition-all duration-200 shadow-card"
            aria-label="Défiler à gauche"
          >
            <FiChevronLeft size={18} />
          </motion.button>
        )}

        {/* Flèche droite */}
        {showRight && (
          <motion.button
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            onClick={() => scroll('right')}
            className="absolute right-2 top-1/2 -translate-y-6 z-20 w-9 h-9 glass rounded-full flex items-center justify-center text-white hover:bg-nova-primary/30 hover:border-nova-primary/40 transition-all duration-200 shadow-card"
            aria-label="Défiler à droite"
          >
            <FiChevronRight size={18} />
          </motion.button>
        )}

        {/* Conteneur scroll */}
        <div
          ref={rowRef}
          onScroll={updateArrows}
          className="flex gap-3 overflow-x-auto scrollbar-hide px-6 sm:px-8 lg:px-12 pb-2"
          style={{ scrollSnapType: 'x mandatory' }}
        >
          {animes.map((anime, i) => (
            <div key={`${title}-${i}-${anime.mal_id}`} style={{ scrollSnapAlign: 'start' }}>
              <AnimeCard anime={anime} onSelect={onSelect} index={i} showRank={showRank} />
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ── Composant principal ────────────────────────────────────────────────

export default function AnimeBrowsePage({
  featured,
  topAnime,
  currentSeason,
  movies,
  genreSections,
}: AnimeBrowsePageProps) {
  const [selectedAnime, setSelectedAnime] = useState<Anime | null>(null)
  const [activeGenre, setActiveGenre]     = useState<number | null>(null)
  const [viewMode, setViewMode]           = useState<'rows' | 'grid'>('rows')

  // Scroll horizontal du menu genres
  const genreScrollRef = useRef<HTMLDivElement>(null)
  const [canScrollLeft, setCanScrollLeft]   = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(false)

  const updateScrollState = useCallback(() => {
    const el = genreScrollRef.current
    if (!el) return
    setCanScrollLeft(el.scrollLeft > 8)
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 8)
  }, [])

  useEffect(() => {
    const el = genreScrollRef.current
    if (!el) return
    updateScrollState()
    el.addEventListener('scroll', updateScrollState, { passive: true })
    window.addEventListener('resize', updateScrollState)
    return () => {
      el.removeEventListener('scroll', updateScrollState)
      window.removeEventListener('resize', updateScrollState)
    }
  }, [updateScrollState])

  const scrollGenres = useCallback((dir: 'left' | 'right') => {
    const el = genreScrollRef.current
    if (!el) return
    el.scrollBy({ left: dir === 'right' ? 200 : -200, behavior: 'smooth' })
  }, [])

  // Genres disponibles (avec contenu)
  const availableGenres = useMemo(
    () => genreSections.filter((s) => s.animes.length > 0).map((s) => s.genre),
    [genreSections]
  )

  // Sections filtrées
  const filteredSections = useMemo(() => {
    if (activeGenre === null) return genreSections.filter((s) => s.animes.length > 0)
    return genreSections.filter((s) => s.genre.mal_id === activeGenre && s.animes.length > 0)
  }, [activeGenre, genreSections])

  // Anime pour la grille
  const gridAnimes = useMemo(() => {
    if (activeGenre === null) return topAnime
    return filteredSections.flatMap((s) => s.animes)
  }, [activeGenre, filteredSections, topAnime])

  const hasContent = topAnime.length > 0 || featured.length > 0

  return (
    <div className="min-h-screen bg-nova-bg">
      <Header />

      {hasContent ? (
        <>
          {/* Hero */}
          <AnimeHero animes={featured.slice(0, 5)} onSelect={setSelectedAnime} />

          {/* Contrôles */}
          <div className="relative z-10 -mt-2 px-6 sm:px-8 lg:px-12 pb-4">
            <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
              <div className="flex items-center gap-3">
                <div className="w-1 h-7 rounded-full bg-nova-gradient shadow-nova" />
                <div className="flex items-center gap-2">
                  <span className="text-nova-secondary"><FiTv size={16} /></span>
                  <h1 className="text-xl sm:text-2xl font-black text-white">Anime</h1>
                </div>
              </div>

              {/* Toggle vue */}
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

            {/* Filtres genres avec défilement horizontal */}
            {availableGenres.length > 0 && (
              <div className="relative">
                {/* Flèche gauche */}
                <AnimatePresence>
                  {canScrollLeft && (
                    <motion.button
                      key="scroll-left"
                      initial={{ opacity: 0, x: -6 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -6 }}
                      transition={{ duration: 0.15 }}
                      onClick={() => scrollGenres('left')}
                      className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full glass border border-nova-border flex items-center justify-center text-text-secondary hover:text-white hover:border-nova-primary/60 transition-colors shadow-lg"
                      style={{ marginTop: '-4px' }}
                    >
                      <FiChevronLeft size={16} />
                    </motion.button>
                  )}
                </AnimatePresence>

                {/* Flèche droite */}
                <AnimatePresence>
                  {canScrollRight && (
                    <motion.button
                      key="scroll-right"
                      initial={{ opacity: 0, x: 6 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 6 }}
                      transition={{ duration: 0.15 }}
                      onClick={() => scrollGenres('right')}
                      className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full glass border border-nova-border flex items-center justify-center text-text-secondary hover:text-white hover:border-nova-primary/60 transition-colors shadow-lg"
                      style={{ marginTop: '-4px' }}
                    >
                      <FiChevronRight size={16} />
                    </motion.button>
                  )}
                </AnimatePresence>

                {/* Dégradés de fondu sur les bords */}
                {canScrollLeft && (
                  <div className="absolute left-0 top-0 h-full w-12 bg-gradient-to-r from-nova-bg to-transparent pointer-events-none z-[5]" />
                )}
                {canScrollRight && (
                  <div className="absolute right-0 top-0 h-full w-12 bg-gradient-to-l from-nova-bg to-transparent pointer-events-none z-[5]" />
                )}

                {/* Barre de pills */}
                <div
                  ref={genreScrollRef}
                  className="flex gap-2 overflow-x-auto scrollbar-hide pb-2 px-1"
                >
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
                      key={genre.mal_id}
                      onClick={() => setActiveGenre(genre.mal_id === activeGenre ? null : genre.mal_id)}
                      className={`flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-200 ${
                        activeGenre === genre.mal_id
                          ? 'bg-nova-gradient text-white shadow-nova'
                          : 'glass border border-nova-border text-text-secondary hover:text-white hover:border-nova-primary/40'
                      }`}
                    >
                      {genre.name}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Contenu */}
          <main className="pb-24 space-y-10 relative z-10">
            <AnimatePresence mode="wait">
              {viewMode === 'rows' ? (
                <motion.div
                  key="rows"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="space-y-8"
                >
                  {activeGenre === null && (
                    <>
                      <AnimeRow title="Top Anime" animes={topAnime} accentColor="violet" onSelect={setSelectedAnime} showRank />
                      <AnimeRow title="Saison en cours" animes={currentSeason} accentColor="cyan" onSelect={setSelectedAnime} />
                      {movies.length > 0 && (
                        <AnimeRow title="Films d'animation" animes={movies} accentColor="violet" onSelect={setSelectedAnime} />
                      )}
                    </>
                  )}
                  {filteredSections.map((section, i) => (
                    <AnimeRow
                      key={section.genre.mal_id}
                      title={section.genre.name}
                      animes={section.animes}
                      accentColor={i % 2 === 0 ? 'cyan' : 'violet'}
                      onSelect={setSelectedAnime}
                    />
                  ))}
                </motion.div>
              ) : (
                <motion.div
                  key="grid"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="px-6 sm:px-8 lg:px-12"
                >
                  <p className="text-xs text-text-muted mb-4">
                    {gridAnimes.length} titre{gridAnimes.length !== 1 ? 's' : ''}
                  </p>
                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-7 xl:grid-cols-9 gap-3">
                    {gridAnimes.map((anime, i) => (
                      <AnimeCard
                        key={`grid-${i}-${anime.mal_id}`}
                        anime={anime}
                        onSelect={setSelectedAnime}
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
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center space-y-3">
            <div className="w-16 h-16 rounded-2xl bg-nova-primary/10 flex items-center justify-center mx-auto">
              <FiTv size={28} className="text-nova-primary" />
            </div>
            <p className="text-white font-bold">Aucun anime disponible</p>
            <p className="text-sm text-text-secondary">Vérifiez votre connexion internet</p>
          </div>
        </div>
      )}

      <AnimeModal anime={selectedAnime} onClose={() => setSelectedAnime(null)} />
    </div>
  )
}
