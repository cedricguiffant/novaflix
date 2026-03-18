// components/AnimeModal.tsx
// Modal détail anime : trailer YouTube + player épisodes (AniWatch API configurable)

'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  FiX, FiStar, FiTv, FiCalendar, FiFilm,
  FiAlertCircle, FiSettings, FiExternalLink, FiCheck,
} from 'react-icons/fi'
import type { Anime } from '@/lib/jikan'
import { getAnimeTitle, getAnimePoster } from '@/lib/jikan'
import {
  searchConsumetAnime,
  getConsumetEpisodes,
  getConsumetStream,
} from '@/lib/consumet'
import type { ConsumetEpisode } from '@/lib/consumet'
import HlsPlayer from './HlsPlayer'

// ── Clé localStorage pour l'URL du serveur stream ─────────────────────
const LS_KEY = 'novaflix_stream_api_url'

function getStoredApiUrl(): string {
  if (typeof window === 'undefined') return ''
  return localStorage.getItem(LS_KEY) ?? ''
}
function setStoredApiUrl(url: string) {
  if (url.trim()) localStorage.setItem(LS_KEY, url.trim())
  else localStorage.removeItem(LS_KEY)
}

// ── Types ──────────────────────────────────────────────────────────────
type Tab = 'info' | 'episodes'
interface StreamInfo { url: string; isM3U8: boolean }
interface AnimeModalProps { anime: Anime | null; onClose: () => void }

// ── Panel de configuration du serveur stream ───────────────────────────
function StreamSetupPanel({ onSaved }: { onSaved: () => void }) {
  const [url, setUrl] = useState(() => getStoredApiUrl())
  const [saved, setSaved] = useState(false)

  const handleSave = () => {
    setStoredApiUrl(url)
    setSaved(true)
    setTimeout(() => { setSaved(false); onSaved() }, 800)
  }

  return (
    <div className="py-6 px-2">
      {/* Titre */}
      <div className="flex items-center gap-2 mb-4">
        <FiSettings size={18} className="text-nova-primary" />
        <h3 className="text-sm font-bold text-white">Configurer le serveur de stream</h3>
      </div>

      {/* Explication */}
      <p className="text-xs text-text-muted mb-4 leading-relaxed">
        NovaFlix utilise <span className="text-nova-secondary font-semibold">AniWatch API</span> pour
        diffuser les épisodes. Déployez votre propre instance gratuitement sur Vercel en 5 minutes,
        puis collez l&apos;URL ci-dessous.
      </p>

      {/* Étapes */}
      <ol className="space-y-3 mb-5">
        {[
          {
            n: '1',
            text: 'Forkez le repo AniWatch API',
            link: 'https://github.com/ghoshRitesh12/aniwatch-api',
            label: 'Voir sur GitHub',
          },
          {
            n: '2',
            text: 'Déployez sur Vercel (bouton "Deploy to Vercel" dans le README)',
            link: 'https://github.com/ghoshRitesh12/aniwatch-api#deploy',
            label: 'Déployer →',
          },
          {
            n: '3',
            text: 'Copiez votre URL Vercel (ex: mon-api.vercel.app) et collez-la ici',
          },
        ].map(({ n, text, link, label }) => (
          <li key={n} className="flex items-start gap-3">
            <span className="w-6 h-6 rounded-full bg-nova-primary/20 border border-nova-primary/40 text-nova-secondary text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
              {n}
            </span>
            <div className="flex-1">
              <p className="text-xs text-text-secondary">{text}</p>
              {link && (
                <a
                  href={link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-nova-primary hover:text-nova-secondary mt-1 transition-colors"
                >
                  {label} <FiExternalLink size={11} />
                </a>
              )}
            </div>
          </li>
        ))}
      </ol>

      {/* Champ URL */}
      <div className="space-y-2">
        <label className="text-xs font-semibold text-text-secondary">
          URL de votre API AniWatch
        </label>
        <div className="flex gap-2">
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://mon-api.vercel.app"
            className="flex-1 bg-nova-card border border-nova-border rounded-lg px-3 py-2 text-sm text-white placeholder-text-muted focus:outline-none focus:border-nova-primary transition-colors"
          />
          <button
            onClick={handleSave}
            disabled={!url.trim()}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
              saved
                ? 'bg-green-600 text-white'
                : 'bg-nova-primary hover:bg-nova-primary/80 text-white disabled:opacity-40 disabled:cursor-not-allowed'
            }`}
          >
            {saved ? <FiCheck size={16} /> : 'Sauver'}
          </button>
        </div>
        {url && (
          <p className="text-xs text-text-muted">
            Les requêtes iront vers : <span className="text-nova-secondary">{url}/anime/search?q=...</span>
          </p>
        )}
      </div>
    </div>
  )
}

// ── Composant principal ────────────────────────────────────────────────
export default function AnimeModal({ anime, onClose }: AnimeModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null)

  const [activeTab, setActiveTab] = useState<Tab>('info')
  const [showSetup, setShowSetup] = useState(false)
  const [episodes, setEpisodes] = useState<ConsumetEpisode[]>([])
  const [selectedEp, setSelectedEp] = useState<ConsumetEpisode | null>(null)
  const [streamInfo, setStreamInfo] = useState<StreamInfo | null>(null)
  const [loadingEps, setLoadingEps] = useState(false)
  const [loadingStream, setLoadingStream] = useState(false)
  const [epsError, setEpsError] = useState(false)
  const [streamError, setStreamError] = useState(false)

  // Reset à chaque changement d'anime
  useEffect(() => {
    setActiveTab('info')
    setShowSetup(false)
    setEpisodes([])
    setSelectedEp(null)
    setStreamInfo(null)
    setLoadingEps(false)
    setLoadingStream(false)
    setEpsError(false)
    setStreamError(false)
  }, [anime?.mal_id])

  // Fermer avec Échap
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

  // Charger les épisodes
  const loadEpisodes = useCallback(async () => {
    if (!anime) return
    // Vérifier qu'une URL est configurée
    const apiUrl = getStoredApiUrl()
    if (!apiUrl) { setShowSetup(true); return }

    setLoadingEps(true)
    setEpsError(false)
    setShowSetup(false)

    try {
      const title = getAnimeTitle(anime)
      let results = await searchConsumetAnime(title)
      if (!results.length && anime.title !== title) {
        results = await searchConsumetAnime(anime.title)
      }
      if (!results.length) { setEpsError(true); return }

      const match = results.find((r) => r.subOrDub === 'sub') ?? results[0]
      const eps = await getConsumetEpisodes(match.id)

      if (!eps.length) { setEpsError(true); return }
      setEpisodes(eps)
    } catch {
      setEpsError(true)
    } finally {
      setLoadingEps(false)
    }
  }, [anime])

  // Sélectionner un épisode
  const handleSelectEpisode = useCallback(async (ep: ConsumetEpisode) => {
    if (selectedEp?.id === ep.id) return
    setSelectedEp(ep)
    setStreamInfo(null)
    setStreamError(false)
    setLoadingStream(true)
    try {
      const src = await getConsumetStream(ep.id)
      if (src) setStreamInfo({ url: src.url, isM3U8: src.isM3U8 })
      else setStreamError(true)
    } catch {
      setStreamError(true)
    } finally {
      setLoadingStream(false)
    }
  }, [selectedEp])

  const handleTabChange = useCallback((tab: Tab) => {
    setActiveTab(tab)
    if (tab === 'episodes' && !episodes.length && !loadingEps && !epsError && !showSetup) {
      loadEpisodes()
    }
  }, [episodes.length, loadingEps, epsError, showSetup, loadEpisodes])

  if (!anime) return null

  const title     = getAnimeTitle(anime)
  const posterUrl = getAnimePoster(anime)
  const trailerKey = anime.trailer?.youtube_id
  const allGenres = [...(anime.genres ?? []), ...(anime.themes ?? [])]
  const studio    = anime.studios?.[0]?.name

  const statusLabel: Record<string, string> = {
    'Finished Airing': 'Terminé',
    'Currently Airing': 'En cours',
    'Not yet aired': 'À venir',
  }

  const showStream  = activeTab === 'episodes' && selectedEp && streamInfo
  const showTrailer = !showStream && trailerKey

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

          {/* ══ Zone vidéo ══ */}
          <div className="relative w-full bg-black" style={{ aspectRatio: '16/9' }}>
            {/* Stream épisode */}
            {showStream && (
              <HlsPlayer src={streamInfo.url} isM3U8={streamInfo.isM3U8} className="w-full h-full" />
            )}
            {/* Chargement stream */}
            {activeTab === 'episodes' && loadingStream && !showStream && (
              <div className="w-full h-full flex flex-col items-center justify-center gap-3">
                <div className="w-10 h-10 border-2 border-nova-primary border-t-transparent rounded-full animate-spin" />
                <span className="text-text-muted text-sm">Chargement du stream…</span>
              </div>
            )}
            {/* Erreur stream */}
            {activeTab === 'episodes' && streamError && !loadingStream && !showStream && (
              <div className="w-full h-full flex flex-col items-center justify-center gap-2 px-8 text-center">
                <FiAlertCircle size={32} className="text-red-400" />
                <p className="text-text-muted text-sm">Stream indisponible pour cet épisode</p>
              </div>
            )}
            {/* Trailer YouTube */}
            {showTrailer && !loadingStream && !streamError && (
              <iframe
                src={`https://www.youtube.com/embed/${trailerKey}?autoplay=1&mute=1&rel=0&modestbranding=1`}
                title={`Trailer — ${title}`}
                className="w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            )}
            {/* Poster fallback */}
            {!showStream && !showTrailer && !loadingStream && !streamError && (
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
            {/* Bouton config (onglet Épisodes actif) */}
            {activeTab === 'episodes' && (
              <button
                onClick={() => setShowSetup((v) => !v)}
                className={`ml-auto flex items-center gap-1.5 px-3 py-3 text-xs transition-colors ${
                  showSetup ? 'text-nova-primary' : 'text-text-muted hover:text-text-secondary'
                }`}
                title="Configurer le serveur stream"
              >
                <FiSettings size={13} />
                {getStoredApiUrl() ? (
                  <span className="hidden sm:inline text-green-400 text-xs">Configuré</span>
                ) : (
                  <span className="hidden sm:inline">Configurer</span>
                )}
              </button>
            )}
          </div>

          {/* ══ Contenu ══ */}
          <div className="p-6">
            {/* ── Tab Infos ── */}
            {activeTab === 'info' && (
              <div className="flex gap-5">
                {posterUrl && (
                  <div className="hidden sm:block flex-shrink-0">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={posterUrl} alt={title} className="w-24 rounded-lg shadow-lg" style={{ aspectRatio: '2/3', objectFit: 'cover' }} />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <h2 className="text-xl sm:text-2xl font-black text-white leading-tight mb-1">{title}</h2>
                  {anime.title !== title && <p className="text-sm text-text-muted mb-3">{anime.title}</p>}

                  <div className="flex flex-wrap items-center gap-3 text-sm mb-4">
                    {anime.score != null && (
                      <span className="flex items-center gap-1 text-yellow-400 font-bold">
                        <FiStar size={14} className="fill-yellow-400" />
                        {anime.score.toFixed(2)}
                        {anime.scored_by && (
                          <span className="text-text-muted font-normal text-xs">({(anime.scored_by / 1000).toFixed(0)}k votes)</span>
                        )}
                      </span>
                    )}
                    {anime.type && <span className="flex items-center gap-1 text-text-secondary"><FiTv size={13} /> {anime.type}</span>}
                    {anime.episodes && <span className="text-text-secondary">{anime.episodes} épisodes</span>}
                    {anime.year && <span className="flex items-center gap-1 text-text-secondary"><FiCalendar size={13} /> {anime.year}</span>}
                    {anime.season && <span className="capitalize text-text-secondary">{anime.season}</span>}
                    {anime.status && (
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${anime.airing ? 'bg-green-500/20 text-green-400' : 'bg-nova-primary/20 text-nova-secondary'}`}>
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
                        <span key={g.mal_id} className="px-3 py-1 rounded-full text-xs font-medium glass border border-nova-border text-text-secondary">
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
              <div>
                {/* Panel de configuration */}
                {showSetup && (
                  <StreamSetupPanel
                    onSaved={() => {
                      setShowSetup(false)
                      setEpsError(false)
                      setEpisodes([])
                      loadEpisodes()
                    }}
                  />
                )}

                {/* Pas d'URL configurée */}
                {!showSetup && !loadingEps && episodes.length === 0 && !epsError && (
                  <div className="text-center py-12">
                    <FiSettings size={36} className="text-text-muted mx-auto mb-3" />
                    <p className="text-white text-sm font-semibold mb-1">Serveur stream non configuré</p>
                    <p className="text-text-muted text-xs mb-4">
                      Déployez AniWatch API sur Vercel et collez votre URL.
                    </p>
                    <button
                      onClick={() => setShowSetup(true)}
                      className="btn-nova text-sm px-5 py-2"
                    >
                      Configurer maintenant
                    </button>
                  </div>
                )}

                {/* Chargement */}
                {loadingEps && (
                  <div className="flex items-center justify-center py-14 gap-3">
                    <div className="w-6 h-6 border-2 border-nova-primary border-t-transparent rounded-full animate-spin" />
                    <span className="text-text-muted text-sm">Recherche des épisodes…</span>
                  </div>
                )}

                {/* Erreur */}
                {!loadingEps && epsError && !showSetup && (
                  <div className="text-center py-12">
                    <FiAlertCircle size={32} className="text-text-muted mx-auto mb-3" />
                    <p className="text-text-secondary text-sm font-medium">Non disponible sur cette source</p>
                    <p className="text-text-muted text-xs mt-1 mb-4">Cet anime n&apos;a pas été trouvé</p>
                    <button onClick={() => setShowSetup(true)} className="btn-ghost text-xs px-4 py-2">
                      <FiSettings size={12} className="mr-1" /> Changer de serveur
                    </button>
                  </div>
                )}

                {/* Liste épisodes */}
                {!loadingEps && !epsError && !showSetup && episodes.length > 0 && (
                  <>
                    {selectedEp && (
                      <div className="flex items-center gap-2 mb-4 text-sm">
                        <span className="w-2 h-2 rounded-full bg-nova-primary animate-pulse" />
                        <span className="text-nova-secondary font-semibold">Épisode {selectedEp.number}</span>
                        {loadingStream && <span className="text-text-muted">— chargement…</span>}
                      </div>
                    )}
                    <p className="text-text-muted text-xs mb-3">
                      {episodes.length} épisode{episodes.length > 1 ? 's' : ''} · VOSTFR/SUB
                    </p>
                    <div
                      className="grid gap-2 overflow-y-auto pr-1"
                      style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(48px, 1fr))', maxHeight: 240 }}
                    >
                      {episodes.map((ep) => {
                        const isSelected = selectedEp?.id === ep.id
                        return (
                          <button
                            key={ep.id}
                            onClick={() => handleSelectEpisode(ep)}
                            disabled={loadingStream}
                            className={`h-11 rounded-lg text-xs font-bold transition-all flex items-center justify-center ${
                              isSelected
                                ? 'bg-gradient-to-br from-nova-primary to-nova-secondary text-white shadow-lg scale-105'
                                : 'glass border border-nova-border text-text-secondary hover:border-nova-primary/60 hover:text-white hover:scale-105 disabled:opacity-50 disabled:cursor-wait'
                            }`}
                          >
                            {ep.number}
                          </button>
                        )
                      })}
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
