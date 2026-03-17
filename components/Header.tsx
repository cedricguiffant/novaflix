// components/Header.tsx
// CHANGEMENTS :
// - onAuthChange remplace onAuthStateChanged direct → plus de crash si auth=null
// - Bouton "Se connecter" affiché quand l'utilisateur n'est pas connecté
// - firebaseReady utilisé pour masquer les éléments inutiles sans Firebase
// - Dropdown avatar gardé intact pour les users connectés

'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { FiSearch, FiBell, FiChevronDown, FiUser, FiLogOut, FiSettings } from 'react-icons/fi'
import { HiOutlineViewGrid } from 'react-icons/hi'
import Logo from './Logo'
import { onAuthChange, logout, firebaseReady } from '@/lib/firebase'
import type { User } from 'firebase/auth'

const NAV_LINKS = [
  { label: 'Accueil',    href: '/' },
  { label: 'Séries',     href: '/series' },
  { label: 'Films',      href: '/films' },
  { label: 'Anime',      href: '/anime' },
  { label: 'Nouveautés', href: '/new' },
  { label: 'Ma liste',   href: '/watchlist' },
]

export default function Header() {
  const router = useRouter()
  const [user, setUser]                   = useState<User | null>(null)
  const [authLoading, setAuthLoading]     = useState(true)
  const [scrolled, setScrolled]           = useState(false)
  const [searchOpen, setSearchOpen]       = useState(false)
  const [searchQuery, setSearchQuery]     = useState('')
  const [menuOpen, setMenuOpen]           = useState(false)
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const searchRef = useRef<HTMLInputElement>(null)
  const menuRef   = useRef<HTMLDivElement>(null)

  // ── Auth observer — sécurisé via onAuthChange ──
  // onAuthChange appelle immédiatement callback(null) si Firebase n'est pas configuré
  useEffect(() => {
    const unsub = onAuthChange((u) => {
      setUser(u)
      setAuthLoading(false)
    })
    return () => unsub()
  }, [])

  // ── Scroll opacity ──
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // ── Focus champ de recherche ──
  useEffect(() => {
    if (searchOpen) setTimeout(() => searchRef.current?.focus(), 100)
  }, [searchOpen])

  // ── Fermer menu au clic extérieur ──
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`)
      setSearchOpen(false)
      setSearchQuery('')
    }
  }

  const handleLogout = async () => {
    await logout()
    setMenuOpen(false)
    router.push('/')
  }

  return (
    <motion.header
      initial={{ y: -80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled
          ? 'glass-strong border-b border-nova-border'
          : 'bg-gradient-to-b from-black/80 to-transparent'
      }`}
    >
      <div className="max-w-[1800px] mx-auto px-4 sm:px-8 h-16 flex items-center justify-between gap-4">

        {/* ── Logo + Nav ── */}
        <div className="flex items-center gap-8">
          <Logo size="md" />
          <nav className="hidden lg:flex items-center gap-1">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="relative px-3 py-2 text-sm font-medium text-text-secondary hover:text-white transition-colors duration-200 group"
              >
                {link.label}
                <span className="absolute bottom-0 left-3 right-3 h-0.5 bg-nova-gradient scale-x-0 group-hover:scale-x-100 transition-transform duration-300 rounded-full" />
              </Link>
            ))}
          </nav>
        </div>

        {/* ── Actions droite ── */}
        <div className="flex items-center gap-2 sm:gap-3">

          {/* Burger mobile */}
          <button
            className="lg:hidden p-2 text-text-secondary hover:text-white"
            onClick={() => setMobileNavOpen(!mobileNavOpen)}
          >
            <HiOutlineViewGrid size={20} />
          </button>

          {/* ── Recherche ── */}
          <div className="flex items-center">
            <AnimatePresence>
              {searchOpen && (
                <motion.form
                  key="search"
                  initial={{ width: 0, opacity: 0 }}
                  animate={{ width: 220, opacity: 1 }}
                  exit={{ width: 0, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  onSubmit={handleSearch}
                  className="overflow-hidden"
                >
                  <input
                    ref={searchRef}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Titre, acteur, genre…"
                    className="w-full bg-black/60 border border-nova-primary/40 text-white text-sm px-4 py-1.5 rounded-l-md focus:outline-none focus:border-nova-primary placeholder:text-text-muted"
                    onKeyDown={(e) => e.key === 'Escape' && setSearchOpen(false)}
                  />
                </motion.form>
              )}
            </AnimatePresence>
            <button
              onClick={() => setSearchOpen(!searchOpen)}
              className={`p-2 transition-colors duration-200 ${
                searchOpen
                  ? 'text-nova-secondary bg-nova-primary/20 rounded-r-md'
                  : 'text-text-secondary hover:text-white'
              }`}
            >
              <FiSearch size={18} />
            </button>
          </div>

          {/* ── Zone utilisateur ── */}
          {authLoading ? (
            /* Skeleton pendant le chargement */
            <div className="w-8 h-8 rounded-full bg-white/10 animate-pulse" />
          ) : user ? (
            <>
              {/* Cloche notifs */}
              <button className="relative p-2 text-text-secondary hover:text-white transition-colors hidden sm:block">
                <FiBell size={18} />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-nova-primary rounded-full" />
              </button>

              {/* Avatar + dropdown */}
              <div className="relative" ref={menuRef}>
                <button
                  onClick={() => setMenuOpen(!menuOpen)}
                  className="flex items-center gap-1.5"
                >
                  <div className="w-8 h-8 rounded-full bg-nova-gradient flex items-center justify-center text-white text-sm font-bold shadow-nova overflow-hidden">
                    {user.photoURL ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={user.photoURL} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                      <span>{user.email?.[0]?.toUpperCase() ?? 'N'}</span>
                    )}
                  </div>
                  <FiChevronDown
                    size={14}
                    className={`text-text-secondary transition-transform duration-200 ${menuOpen ? 'rotate-180' : ''}`}
                  />
                </button>

                <AnimatePresence>
                  {menuOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -8, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -8, scale: 0.95 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 top-full mt-2 w-52 glass-strong rounded-xl overflow-hidden shadow-nova z-50"
                    >
                      <div className="px-4 py-3 border-b border-nova-border">
                        <p className="text-sm font-semibold text-white truncate">
                          {user.displayName ?? 'Utilisateur'}
                        </p>
                        <p className="text-xs text-text-secondary truncate">{user.email}</p>
                      </div>
                      <div className="py-1">
                        <Link
                          href="/profile"
                          className="flex items-center gap-3 px-4 py-2.5 text-sm text-text-secondary hover:text-white hover:bg-nova-primary/10 transition-colors"
                          onClick={() => setMenuOpen(false)}
                        >
                          <FiUser size={15} /> Mon profil
                        </Link>
                        <Link
                          href="/settings"
                          className="flex items-center gap-3 px-4 py-2.5 text-sm text-text-secondary hover:text-white hover:bg-nova-primary/10 transition-colors"
                          onClick={() => setMenuOpen(false)}
                        >
                          <FiSettings size={15} /> Paramètres
                        </Link>
                      </div>
                      <div className="border-t border-nova-border py-1">
                        <button
                          onClick={handleLogout}
                          className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors"
                        >
                          <FiLogOut size={15} /> Se déconnecter
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </>
          ) : (
            /* ── Boutons Se connecter + S'inscrire ── */
            <div className="flex items-center gap-2">
              <Link
                href="/login"
                className="btn-ghost py-2 px-4 text-sm hidden sm:inline-flex"
              >
                Se connecter
              </Link>
              <Link
                href="/register"
                className="btn-nova py-2 px-4 text-sm"
              >
                <span>S&apos;inscrire</span>
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* ── Nav mobile ── */}
      <AnimatePresence>
        {mobileNavOpen && (
          <motion.nav
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="lg:hidden glass-strong border-t border-nova-border overflow-hidden"
          >
            <div className="px-4 py-3 flex flex-col gap-1">
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="px-3 py-2.5 text-sm font-medium text-text-secondary hover:text-white hover:bg-nova-primary/10 rounded-lg transition-colors"
                  onClick={() => setMobileNavOpen(false)}
                >
                  {link.label}
                </Link>
              ))}
              {!user && (
                <div className="flex flex-col gap-2 mt-2">
                  <Link
                    href="/login"
                    className="btn-ghost py-2 px-4 text-sm justify-center"
                    onClick={() => setMobileNavOpen(false)}
                  >
                    Se connecter
                  </Link>
                  <Link
                    href="/register"
                    className="btn-nova py-2 px-4 text-sm justify-center"
                    onClick={() => setMobileNavOpen(false)}
                  >
                    <span>S&apos;inscrire</span>
                  </Link>
                </div>
              )}
            </div>
          </motion.nav>
        )}
      </AnimatePresence>

      {/* ── Bannière si Firebase non configuré (dev only) ── */}
      {!firebaseReady && process.env.NODE_ENV === 'development' && (
        <div className="bg-yellow-500/10 border-b border-yellow-500/20 px-4 py-1.5 text-center">
          <p className="text-xs text-yellow-400">
            Firebase non configuré — ajoutez vos clés <code className="bg-yellow-500/20 px-1 rounded">NEXT_PUBLIC_FIREBASE_*</code> dans <code className="bg-yellow-500/20 px-1 rounded">.env.local</code>
          </p>
        </div>
      )}
    </motion.header>
  )
}
