// app/register/page.tsx
// Page d'inscription NovaFlix
// - Redirige vers / si déjà connecté
// - Fond animé violet/cyan identique à /login
// - Utilise le composant RegisterForm réutilisable

'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { FiArrowLeft } from 'react-icons/fi'
import Logo from '@/components/Logo'
import RegisterForm from '@/components/RegisterForm'
import { onAuthChange } from '@/lib/firebase'

export default function RegisterPage() {
  const router = useRouter()

  // Redirige immédiatement si déjà connecté
  useEffect(() => {
    const unsub = onAuthChange((user) => {
      if (user) router.replace('/')
    })
    return () => unsub()
  }, [router])

  return (
    <div className="relative min-h-screen bg-nova-bg flex items-center justify-center overflow-hidden px-4 py-12">

      {/* ── Halos décoratifs animés (même style que /login) ── */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <motion.div
          animate={{ scale: [1, 1.15, 1], opacity: [0.15, 0.25, 0.15] }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute -top-32 -right-32 w-96 h-96 rounded-full"
          style={{ background: 'radial-gradient(circle, #7C3AED 0%, transparent 70%)' }}
        />
        <motion.div
          animate={{ scale: [1, 1.2, 1], opacity: [0.1, 0.2, 0.1] }}
          transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
          className="absolute -bottom-32 -left-32 w-96 h-96 rounded-full"
          style={{ background: 'radial-gradient(circle, #00F5FF 0%, transparent 70%)' }}
        />
        {/* Halo central subtil */}
        <motion.div
          animate={{ opacity: [0.05, 0.12, 0.05] }}
          transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full"
          style={{ background: 'radial-gradient(circle, #7C3AED 0%, transparent 60%)' }}
        />
      </div>

      {/* ── Carte formulaire ── */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="relative w-full max-w-md"
      >
        {/* Lien retour */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-text-secondary hover:text-white transition-colors mb-6 group"
        >
          <FiArrowLeft size={15} className="group-hover:-translate-x-0.5 transition-transform" />
          Retour à l&apos;accueil
        </Link>

        <div className="glass-strong rounded-2xl p-8 shadow-nova-lg">

          {/* Logo */}
          <div className="flex justify-center mb-6">
            <Logo size="lg" />
          </div>

          {/* Titre */}
          <div className="text-center mb-8">
            <h1 className="text-2xl font-black text-white">Créer un compte</h1>
            <p className="text-sm text-text-secondary mt-1">
              Rejoignez NovaFlix et accédez à des milliers de contenus
            </p>
          </div>

          {/* Formulaire d'inscription */}
          <RegisterForm />
        </div>

        {/* Lien CGU discret */}
        <p className="text-center text-xs text-text-muted mt-4 px-4">
          En créant un compte, vous acceptez nos{' '}
          <span className="text-text-secondary hover:text-nova-secondary cursor-pointer transition-colors">
            Conditions d&apos;utilisation
          </span>{' '}
          et notre{' '}
          <span className="text-text-secondary hover:text-nova-secondary cursor-pointer transition-colors">
            Politique de confidentialité
          </span>.
        </p>
      </motion.div>
    </div>
  )
}
