// app/search/page.tsx — Page de recherche NovaFlix
'use client'

import { useState, useEffect, useCallback, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { FiSearch, FiX, FiFilm } from 'react-icons/fi'
import Header from '@/components/Header'
import MovieCard from '@/components/MovieCard'
import VideoModal from '@/components/VideoModal'
import { searchMulti } from '@/lib/tmdb'
import type { Movie } from '@/lib/tmdb'

/**
 * Page de recherche avec debounce 400ms
 * Affiche les résultats en grille responsive avec animations
 */
function SearchContent() {
  const searchParams     = useSearchParams()
  const initialQuery     = searchParams.get('q') ?? ''

  const [query, setQuery]                   = useState(initialQuery)
  const [results, setResults]               = useState<Movie[]>([])
  const [loading, setLoading]               = useState(false)
  const [selectedMovie, setSelectedMovie]   = useState<Movie | null>(null)
  const [hasSearched, setHasSearched]       = useState(false)

  // Fonction de recherche avec debounce
  const doSearch = useCallback(async (q: string) => {
    if (!q.trim()) {
      setResults([])
      setHasSearched(false)
      return
    }
    setLoading(true)
    setHasSearched(true)
    try {
      const data = await searchMulti(q)
      setResults(data)
    } catch {
      setResults([])
    } finally {
      setLoading(false)
    }
  }, [])

  // Debounce 400ms sur la saisie
  useEffect(() => {
    const timer = setTimeout(() => doSearch(query), 400)
    return () => clearTimeout(timer)
  }, [query, doSearch])

  // Lance la recherche initiale si paramètre URL présent
  useEffect(() => {
    if (initialQuery) doSearch(initialQuery)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="min-h-screen bg-nova-bg">
      <Header />

      <main className="pt-24 pb-20 px-6 sm:px-12 max-w-[1400px] mx-auto">

        {/* ── Barre de recherche ── */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-2xl mx-auto mb-12"
        >
          <div className="relative">
            <FiSearch
              size={20}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-nova-secondary"
            />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Rechercher un film, une série, un acteur…"
              autoFocus
              className="w-full bg-nova-card border border-nova-border text-white text-base pl-12 pr-12 py-4 rounded-2xl placeholder:text-text-muted transition-all focus:border-nova-primary focus:shadow-nova"
            />
            {query && (
              <button
                onClick={() => { setQuery(''); setResults([]); setHasSearched(false) }}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-text-secondary hover:text-white transition-colors"
              >
                <FiX size={18} />
              </button>
            )}
          </div>
        </motion.div>

        {/* ── Titre des résultats ── */}
        {hasSearched && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mb-6 flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <div className="w-1 h-6 rounded-full bg-nova-primary shadow-nova" />
              <h1 className="text-lg font-bold text-white">
                {loading
                  ? 'Recherche en cours…'
                  : `${results.length} résultat${results.length !== 1 ? 's' : ''} pour "${query}"`
                }
              </h1>
            </div>
          </motion.div>
        )}

        {/* ── Loader ── */}
        <AnimatePresence>
          {loading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex justify-center py-20"
            >
              <div className="flex flex-col items-center gap-3">
                <div className="w-10 h-10 border-2 border-nova-primary border-t-transparent rounded-full animate-spin" />
                <p className="text-text-secondary text-sm">Recherche…</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Grille de résultats ── */}
        {!loading && results.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-7 xl:grid-cols-8 gap-4"
          >
            {results.map((movie, i) => (
              <MovieCard
                key={movie.id}
                movie={movie}
                onSelect={setSelectedMovie}
                index={i}
              />
            ))}
          </motion.div>
        )}

        {/* ── Aucun résultat ── */}
        {!loading && hasSearched && results.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-24 text-center"
          >
            <div className="w-20 h-20 rounded-full bg-nova-primary/10 flex items-center justify-center mb-4">
              <FiFilm size={32} className="text-nova-primary opacity-60" />
            </div>
            <h2 className="text-xl font-bold text-white mb-2">
              Aucun résultat pour &ldquo;{query}&rdquo;
            </h2>
            <p className="text-text-secondary text-sm max-w-xs">
              Essayez avec un titre différent, un acteur ou un genre.
            </p>
          </motion.div>
        )}

        {/* ── État initial (pas encore cherché) ── */}
        {!hasSearched && !loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center py-24 text-center"
          >
            <div className="w-20 h-20 rounded-full bg-nova-secondary/10 flex items-center justify-center mb-4">
              <FiSearch size={32} className="text-nova-secondary opacity-60" />
            </div>
            <h2 className="text-xl font-bold text-white mb-2">
              Que souhaitez-vous regarder ?
            </h2>
            <p className="text-text-secondary text-sm max-w-xs">
              Tapez le nom d&apos;un film, d&apos;une série, d&apos;un acteur ou d&apos;un genre.
            </p>
          </motion.div>
        )}
      </main>

      {/* Modal */}
      <VideoModal
        movie={selectedMovie}
        onClose={() => setSelectedMovie(null)}
        onMovieSelect={setSelectedMovie}
      />
    </div>
  )
}

export default function SearchPage() {
  return (
    <Suspense>
      <SearchContent />
    </Suspense>
  )
}
