// components/Header.tsx — Header principal NovaFlix
'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { FiSearch, FiBell, FiChevronDown, FiUser, FiLogOut, FiSettings } from 'react-icons/fi'
import { HiOutlineViewGrid } from 'react-icons/hi'
import Logo from './Logo'
import { auth, logout } from '@/lib/firebase'
import { onAuthStateChanged, type User } from 'firebase/auth'

// ── Liens de navigation ──
const NAV_LINKS = [
  { label: 'Accueil',         href: '/' },
  { label: 'Séries',          href: '/series' },
  { label: 'Films',           href: '/films' },
  { label: 'Nouveautés',      href: '/new' },
  { label: 'Ma liste',        href: '/watchlist' },
]

export default function Header() {
  const router = useRouter()
  const [user, setUser]               = useState<User | null>(null)
  const [scrolled, setScrolled]       = useState(false)
  const [searchOpen, setSearchOpen]   = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [menuOpen, setMenuOpen]       = useState(false)
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const searchRef = useRef<HTMLInputElement>(null)
  const menuRef   = useRef<HTMLDivElement>(null)

  // Écoute l'état d'auth Firebase
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, setUser)
    return () => unsub()
  }, [])

  // Scroll : rend le header opaque après 60px
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Focus sur le champ de recherche à l'ouverture
  useEffect(() => {
    if (searchOpen) setTimeout(() => searchRef.current?.focus(), 100)
  }, [searchOpen])

  // Ferme le menu avatar au clic extérieur
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  // Soumission de la recherche
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`)
      setSearchOpen(false)
      setSearchQuery('')
    }
  }

  // Déconnexion
  const handleLogout = async () => {
    await logout()
    router.push('/login')
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

        {/* ── Logo ── */}
        <div className="flex items-center gap-8">
          <Logo size="md" />

          {/* Navigation desktop */}
          <nav className="hidden lg:flex items-center gap-1">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="relative px-3 py-2 text-sm font-medium text-text-secondary hover:text-white transition-colors duration-200 group"
              >
                {link.label}
                {/* Trait animé au hover */}
                <span className="absolute bottom-0 left-3 right-3 h-0.5 bg-nova-gradient scale-x-0 group-hover:scale-x-100 transition-transform duration-300 rounded-full" />
              </Link>
            ))}
          </nav>
        </div>

        {/* ── Actions droite ── */}
        <div className="flex items-center gap-2 sm:gap-3">

          {/* Bouton burger mobile */}
          <button
            className="lg:hidden p-2 text-text-secondary hover:text-white"
            onClick={() => setMobileNavOpen(!mobileNavOpen)}
            aria-label="Menu"
          >
            <HiOutlineViewGrid size={20} />
          </button>

          {/* ── Recherche ── */}
          <div className="flex items-center">
            <AnimatePresence>
              {searchOpen && (
                <motion.form
                  key="search-form"
                  initial={{ width: 0, opacity: 0 }}
                  animate={{ width: 220, opacity: 1 }}
                  exit={{ width: 0, opacity: 0 }}
                  transition={{ duration: 0.3, ease: 'easeInOut' }}
                  onSubmit={handleSearch}
                  className="overflow-hidden"
                >
                  <input
                    ref={searchRef}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Titre, acteur, genre..."
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
              aria-label="Rechercher"
            >
              <FiSearch size={18} />
            </button>
          </div>

          {/* Notifications */}
          <button className="relative p-2 text-text-secondary hover:text-white transition-colors duration-200 hidden sm:block">
            <FiBell size={18} />
            {/* Badge rouge */}
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-nova-primary rounded-full" />
          </button>

          {/* ── Avatar + dropdown ── */}
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="flex items-center gap-1.5 group"
              aria-label="Menu utilisateur"
            >
              {/* Avatar */}
              <div className="w-8 h-8 rounded-full bg-nova-gradient flex items-center justify-center text-white text-sm font-bold shadow-nova overflow-hidden">
                {user?.photoURL ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={user.photoURL} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <span>{user?.email?.[0]?.toUpperCase() ?? 'N'}</span>
                )}
              </div>
              <FiChevronDown
                size={14}
                className={`text-text-secondary transition-transform duration-200 ${
                  menuOpen ? 'rotate-180' : ''
                }`}
              />
            </button>

            {/* Dropdown menu */}
            <AnimatePresence>
              {menuOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -8, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -8, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 top-full mt-2 w-52 glass-strong rounded-xl overflow-hidden shadow-nova z-50"
                >
                  {/* Infos utilisateur */}
                  <div className="px-4 py-3 border-b border-nova-border">
                    <p className="text-sm font-semibold text-white truncate">
                      {user?.displayName ?? 'Utilisateur'}
                    </p>
                    <p className="text-xs text-text-secondary truncate">{user?.email}</p>
                  </div>

                  {/* Options */}
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

                  {/* Déconnexion */}
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
        </div>
      </div>

      {/* ── Navigation mobile (drawer) ── */}
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
            </div>
          </motion.nav>
        )}
      </AnimatePresence>
    </motion.header>
  )
}
