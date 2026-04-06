// components/AnimeModal.tsx
// Modal détail anime : trailer YouTube + player épisodes via anime-sama.pw
// Logique de scraping portée depuis Sky-NiniKo/anime-sama_api (Python)

'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  FiX, FiStar, FiTv, FiCalendar, FiFilm,
  FiAlertCircle, FiChevronLeft, FiRefreshCw,
} from 'react-icons/fi'
import type { Anime } from '@/lib/jikan'
import { getAnimeTitle, getAnimePoster } from '@/lib/jikan'
import {
  searchAnimeSama, getAnimeSamaSeasons, getAnimeSamaEpisodes,
  bestMatch, langLabel,
} from '@/lib/animesama'
import type { AnimeSamaResult, AnimeSamaSeason, AnimeSamaEpisode } from '@/lib/animesama'

// ── Types ──────────────────────────────────────────────────────────────
type Tab = 'info' | 'episodes'

type EpState =
  | { step: 'idle' }
  | { step: 'searching' }
  | { step: 'not_found' }
  | { step: 'error' }
  | { step: 'seasons'; result: AnimeSamaResult; seasons: AnimeSamaSeason[] }
  | { step: 'loading_eps'; season: AnimeSamaSeason }
  | { step: 'episodes'; season: AnimeSamaSeason; episodes: AnimeSamaEpisode[] }

interface AnimeModalProps { anime: Anime | null; onClose: () => void }

// ── Composant principal ────────────────────────────────────────────────
export default function AnimeModal({ anime, onClose }: AnimeModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null)

  const [activeTab, setActiveTab] = useState<Tab>('info')
  const [epState, setEpState] = useState<EpState>({ step: 'idle' })
  const [selectedEp, setSelectedEp] = useState<AnimeSamaEpisode | null>(null)
  const [playerIdx, setPlayerIdx] = useState(0)   // index dans ep.players[]

  // Reset à chaque anime
  useEffect(() => {
    setActiveTab('info')
    setEpState({ step: 'idle' })
    setSelectedEp(null)
    setPlayerIdx(0)
  }, [anime?.mal_id])

  // Touche Échap
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [onClose])

  // Scroll lock
  useEffect(() => {
    document.body.style.overflow = anime ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [anime])

  // ── Recherche anime-sama ─────────────────────────────────────────────
  const startSearch = useCallback(async () => {
    if (!anime) return
    setEpState({ step: 'searching' })
    setSelectedEp(null)
    setPlayerIdx(0)

    try {
      const title = getAnimeTitle(anime)
      let results = await searchAnimeSama(title)

      // Fallback sur le titre japonais
      if (!results.length && anime.title !== title) {
        results = await searchAnimeSama(anime.title)
      }

      if (!results.length) {
        setEpState({ step: 'not_found' })
        return
      }

      const match = bestMatch(results, anime.title_english, anime.title)
      if (!match) { setEpState({ step: 'not_found' }); return }

      const seasons = await getAnimeSamaSeasons(match.url)
      if (!seasons.length) { setEpState({ step: 'not_found' }); return }

      setEpState({ step: 'seasons', result: match, seasons })
    } catch {
      setEpState({ step: 'error' })
    }
  }, [anime])

  // Démarrer la recherche quand on bascule sur l'onglet épisodes
  const handleTabChange = useCallback(
    (tab: Tab) => {
      setActiveTab(tab)
      if (tab === 'episodes' && epState.step === 'idle') startSearch()
    },
    [epState.step, startSearch]
  )

  // ── Sélection d'une saison ───────────────────────────────────────────
  const handleSeasonSelect = useCallback(async (season: AnimeSamaSeason) => {
    setEpState({ step: 'loading_eps', season })
    setSelectedEp(null)
    setPlayerIdx(0)
    try {
      const eps = await getAnimeSamaEpisodes(season.url)
      if (!eps.length) {
        setEpState((prev) =>
          prev.step === 'loading_eps'
            ? { step: 'not_found' }
            : prev
        )
        return
      }
      setEpState({ step: 'episodes', season, episodes: eps })
    } catch {
      setEpState({ step: 'error' })
    }
  }, [])

  if (!anime) return null

  const title      = getAnimeTitle(anime)
  const posterUrl  = getAnimePoster(anime)
  const trailerKey = anime.trailer?.youtube_id
  const allGenres  = [...(anime.genres ?? []), ...(anime.themes ?? [])]
  const studio     = anime.studios?.[0]?.name

  const statusLabel: Record<string, string> = {
    'Finished Airing': 'Terminé',
    'Currently Airing': 'En cours',
    'Not yet aired': 'À venir',
  }

  // ── Zone vidéo ────────────────────────────────────────────────────────
  const playerUrl =
    activeTab === 'episodes' && selectedEp
      ? (selectedEp.players[playerIdx] ?? null)
      : null

  const showPlayer  = !!playerUrl
  const showTrailer = !showPlayer && !!trailerKey

  return (
    <AnimatePresence>
      <motion.div
        ref={overlayRef}
        key="anime-modal-overlay"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-center justify-center p-4"
        style={{ background: 'rgba(0,0,0,0.88)', backdropFilter: 'blur(8px)' }}
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
          {/* Fermer */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-20 w-9 h-9 rounded-full glass border border-nova-border flex items-center justify-center text-text-secondary hover:text-white hover:border-nova-primary/50 transition-all"
          >
            <FiX size={18} />
          </button>

          {/* ══ Zone vidéo 16/9 ══ */}
          <div className="relative w-full bg-black" style={{ aspectRatio: '16/9' }}>
            {/* Player iframe anime-sama */}
            {showPlayer && (
              <iframe
                key={playerUrl}
                src={playerUrl}
                title={selectedEp?.name ?? 'Épisode'}
                className="w-full h-full border-0"
                allow="autoplay; fullscreen; encrypted-media"
                allowFullScreen
              />
            )}
            {/* Trailer YouTube */}
            {showTrailer && (
              <iframe
                src={`https://www.youtube.com/embed/${trailerKey}?autoplay=1&mute=1&rel=0&modestbranding=1`}
                title={`Trailer — ${title}`}
                className="w-full h-full border-0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            )}
            {/* Poster fallback */}
            {!showPlayer && !showTrailer && (
              <div className="w-full h-full relative overflow-hidden">
                {posterUrl ? (
                  <>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={posterUrl} alt={title} className="w-full h-full object-contain bg-black" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  </>
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <p className="text-text-muted text-sm">Aucun trailer disponible</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ══ Sélecteur de sources alternatives ══ */}
          {showPlayer && selectedEp && selectedEp.players.length > 1 && (
            <div className="flex items-center gap-2 px-4 py-2 border-b border-nova-border bg-nova-card/40">
              <span className="text-xs text-text-muted mr-1">Source :</span>
              {selectedEp.players.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setPlayerIdx(i)}
                  className={`px-3 py-1 rounded text-xs font-semibold transition-all ${
                    i === playerIdx
                      ? 'bg-nova-primary text-white'
                      : 'glass border border-nova-border text-text-secondary hover:text-white'
                  }`}
                >
                  #{i + 1}
                </button>
              ))}
            </div>
          )}

          {/* ══ Onglets ══ */}
          <div className="flex border-b border-nova-border px-6">
            {(['info', 'episodes'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => handleTabChange(tab)}
                className={`px-5 py-3 text-sm font-semibold transition-all border-b-2 -mb-px ${
                  activeTab === tab
                    ? 'border-nova-primary text-white'
                    : 'border-transparent text-text-muted hover:text-text-secondary'
                }`}
              >
                {tab === 'info' ? '✦ Infos' : '▶ Épisodes'}
              </button>
            ))}
          </div>

          {/* ══ Contenu ══ */}
          <div className="p-6">

            {/* ── Tab Infos ── */}
            {activeTab === 'info' && (
              <div className="flex gap-5">
                {posterUrl && (
                  <div className="hidden sm:block flex-shrink-0">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={posterUrl} alt={title}
                      className="w-24 rounded-lg shadow-lg"
                      style={{ aspectRatio: '2/3', objectFit: 'cover' }}
                    />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <h2 className="text-xl sm:text-2xl font-black text-white leading-tight mb-1">{title}</h2>
                  {anime.title !== title && (
                    <p className="text-sm text-text-muted mb-3">{anime.title}</p>
                  )}

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

                  {studio && (
                    <div className="flex items-center gap-1.5 text-sm text-text-muted mb-4">
                      <FiFilm size={13} /><span>{studio}</span>
                    </div>
                  )}

                  {allGenres.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-4">
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

                  {anime.synopsis && (
                    <div>
                      <h3 className="text-sm font-semibold text-white mb-2">Synopsis</h3>
                      <p className="text-sm text-text-secondary leading-relaxed">{anime.synopsis}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ── Tab Épisodes ── */}
            {activeTab === 'episodes' && (
              <EpisodesTab
                epState={epState}
                selectedEp={selectedEp}
                onSeasonSelect={handleSeasonSelect}
                onEpisodeSelect={(ep) => { setSelectedEp(ep); setPlayerIdx(0) }}
                onRetry={startSearch}
                onBack={() => {
                  if (
                    epState.step === 'episodes' ||
                    epState.step === 'loading_eps'
                  ) {
                    // Revenir à la liste des saisons
                    if (epState.step === 'episodes' || epState.step === 'loading_eps') {
                      // On re-fetch les saisons depuis le résultat déjà connu
                      // Pour simplifier on relance startSearch
                      startSearch()
                    }
                  }
                }}
              />
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

// ── Sous-composant onglet Épisodes ─────────────────────────────────────
interface EpisodesTabProps {
  epState: EpState
  selectedEp: AnimeSamaEpisode | null
  onSeasonSelect: (s: AnimeSamaSeason) => void
  onEpisodeSelect: (ep: AnimeSamaEpisode) => void
  onRetry: () => void
  onBack: () => void
}

function EpisodesTab({
  epState, selectedEp, onSeasonSelect, onEpisodeSelect, onRetry, onBack,
}: EpisodesTabProps) {

  // ── Chargement ────────────────────────────────────────────────────────
  if (epState.step === 'searching' || epState.step === 'loading_eps') {
    return (
      <div className="flex flex-col items-center justify-center py-14 gap-3">
        <div className="w-8 h-8 border-2 border-nova-primary border-t-transparent rounded-full animate-spin" />
        <span className="text-text-muted text-sm">
          {epState.step === 'searching' ? 'Recherche sur anime-sama…' : 'Chargement des épisodes…'}
        </span>
      </div>
    )
  }

  // ── Non trouvé ────────────────────────────────────────────────────────
  if (epState.step === 'not_found') {
    return (
      <div className="text-center py-12">
        <FiAlertCircle size={32} className="text-text-muted mx-auto mb-3" />
        <p className="text-text-secondary text-sm font-medium mb-1">Non disponible</p>
        <p className="text-text-muted text-xs mb-4">
          Cet anime n&apos;a pas été trouvé sur anime-sama.to
        </p>
        <button onClick={onRetry} className="btn-ghost text-xs px-4 py-2 flex items-center gap-1.5 mx-auto">
          <FiRefreshCw size={12} /> Réessayer
        </button>
      </div>
    )
  }

  // ── Erreur ────────────────────────────────────────────────────────────
  if (epState.step === 'error') {
    return (
      <div className="text-center py-12">
        <FiAlertCircle size={32} className="text-red-400 mx-auto mb-3" />
        <p className="text-text-secondary text-sm font-medium mb-1">Erreur de connexion</p>
        <p className="text-text-muted text-xs mb-4">Impossible de contacter anime-sama.pw</p>
        <button onClick={onRetry} className="btn-nova text-xs px-5 py-2">
          <FiRefreshCw size={12} className="mr-1.5" /> Réessayer
        </button>
      </div>
    )
  }

  // ── Sélecteur de saisons ──────────────────────────────────────────────
  if (epState.step === 'seasons') {
    const { result, seasons } = epState

    // Grouper par nom de saison
    const grouped = seasons.reduce<Record<string, AnimeSamaSeason[]>>((acc, s) => {
      ;(acc[s.name] = acc[s.name] ?? []).push(s)
      return acc
    }, {})

    return (
      <div>
        <div className="flex items-center gap-2 mb-4">
          <span className="text-xs font-semibold text-nova-secondary bg-nova-primary/10 border border-nova-primary/30 px-2 py-0.5 rounded-full">
            anime-sama.pw
          </span>
          <span className="text-sm font-bold text-white truncate">{result.name}</span>
        </div>

        <p className="text-text-muted text-xs mb-4">
          {seasons.length} saison{seasons.length > 1 ? 's' : ''} disponible{seasons.length > 1 ? 's' : ''}
        </p>

        <div className="space-y-2">
          {Object.entries(grouped).map(([name, variants]) => (
            <div key={name}>
              <p className="text-xs text-text-muted mb-1.5 font-medium">{name}</p>
              <div className="flex gap-2 flex-wrap">
                {variants.map((s) => (
                  <button
                    key={s.url}
                    onClick={() => onSeasonSelect(s)}
                    className="px-4 py-2 rounded-lg glass border border-nova-border text-sm font-semibold text-text-secondary hover:border-nova-primary/60 hover:text-white transition-all"
                  >
                    {langLabel(s.lang)}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  // ── Liste épisodes ────────────────────────────────────────────────────
  if (epState.step === 'episodes') {
    const { season, episodes } = epState

    return (
      <div>
        {/* En-tête avec bouton retour */}
        <div className="flex items-center gap-2 mb-4">
          <button
            onClick={onBack}
            className="w-7 h-7 rounded-full glass border border-nova-border flex items-center justify-center text-text-muted hover:text-white transition-colors"
          >
            <FiChevronLeft size={14} />
          </button>
          <span className="text-xs font-semibold text-nova-secondary bg-nova-primary/10 border border-nova-primary/30 px-2 py-0.5 rounded-full">
            {langLabel(season.lang)}
          </span>
          <span className="text-sm text-text-secondary font-medium">{season.name}</span>
          {selectedEp && (
            <>
              <span className="text-text-muted">·</span>
              <span className="text-sm font-bold text-nova-secondary">
                Ép. {selectedEp.index}
              </span>
            </>
          )}
        </div>

        <p className="text-text-muted text-xs mb-3">
          {episodes.length} épisode{episodes.length > 1 ? 's' : ''}
        </p>

        {/* Grille numéros d'épisodes */}
        <div
          className="grid gap-2 overflow-y-auto pr-1"
          style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(52px, 1fr))', maxHeight: 260 }}
        >
          {episodes.map((ep) => {
            const isSelected = selectedEp?.index === ep.index
            return (
              <button
                key={ep.index}
                onClick={() => onEpisodeSelect(ep)}
                className={`h-11 rounded-lg text-xs font-bold transition-all flex items-center justify-center ${
                  isSelected
                    ? 'bg-gradient-to-br from-nova-primary to-nova-secondary text-white shadow-lg scale-105'
                    : 'glass border border-nova-border text-text-secondary hover:border-nova-primary/60 hover:text-white hover:scale-105'
                }`}
              >
                {ep.index}
              </button>
            )
          })}
        </div>
      </div>
    )
  }

  // idle — ne devrait pas apparaître (l'onglet démarre immédiatement la recherche)
  return null
}
