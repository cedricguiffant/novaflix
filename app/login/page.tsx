// app/login/page.tsx
// CHANGEMENTS :
// - Détecte si Firebase est configuré (firebaseReady) et affiche un
//   message clair au lieu de crasher si les clés sont manquantes
// - Gestion d'erreur améliorée (code Firebase → message lisible)
// - Bouton "Retour à l'accueil" pour ne jamais bloquer l'utilisateur
// - onAuthChange sécurisé remplace onAuthStateChanged direct

'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { FiMail, FiLock, FiEye, FiEyeOff, FiAlertCircle, FiArrowLeft, FiKey } from 'react-icons/fi'
import { FcGoogle } from 'react-icons/fc'
import Logo from '@/components/Logo'
import {
  loginWithEmail,
  registerWithEmail,
  signInWithGoogle,
  onAuthChange,
  firebaseReady,
} from '@/lib/firebase'

type Mode = 'login' | 'register'

export default function LoginPage() {
  const router = useRouter()
  const [mode, setMode]         = useState<Mode>('login')
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState<string | null>(null)
  const [success, setSuccess]   = useState<string | null>(null)

  // Redirige si déjà connecté — sécurisé via onAuthChange
  useEffect(() => {
    const unsub = onAuthChange((user) => {
      if (user) router.push('/')
    })
    return () => unsub()
  }, [router])

  const parseError = (code: string): string => {
    const map: Record<string, string> = {
      'auth/user-not-found':       'Aucun compte trouvé avec cet email.',
      'auth/wrong-password':       'Mot de passe incorrect.',
      'auth/invalid-credential':   'Email ou mot de passe invalide.',
      'auth/email-already-in-use': 'Cet email est déjà utilisé.',
      'auth/weak-password':        'Le mot de passe doit contenir au moins 6 caractères.',
      'auth/invalid-email':        'Adresse email invalide.',
      'auth/too-many-requests':    'Trop de tentatives. Réessayez dans quelques minutes.',
      'auth/popup-closed-by-user': 'Fenêtre Google fermée. Réessayez.',
      'auth/network-request-failed': 'Erreur réseau. Vérifiez votre connexion.',
    }
    return map[code] ?? `Erreur inattendue (${code}). Réessayez.`
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)
    if (!email.trim() || !password) {
      setError('Veuillez remplir tous les champs.')
      return
    }
    setLoading(true)
    try {
      if (mode === 'login') {
        await loginWithEmail(email, password)
      } else {
        await registerWithEmail(email, password)
        setSuccess('Compte créé ! Redirection…')
      }
      router.push('/')
    } catch (err: unknown) {
      const code = (err as { code?: string }).code ?? ''
      // Cas spécial : Firebase non configuré (message envoyé par notre wrapper)
      if ((err as Error).message?.includes('non configuré')) {
        setError('Firebase non configuré. Consultez les instructions ci-dessous.')
      } else {
        setError(parseError(code))
      }
    } finally {
      setLoading(false)
    }
  }

  const handleGoogle = async () => {
    setError(null)
    setLoading(true)
    try {
      await signInWithGoogle()
      router.push('/')
    } catch (err: unknown) {
      const code = (err as { code?: string }).code ?? ''
      if ((err as Error).message?.includes('non configuré')) {
        setError('Firebase non configuré. Consultez les instructions ci-dessous.')
      } else {
        setError(parseError(code))
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative min-h-screen bg-nova-bg flex items-center justify-center overflow-hidden px-4 py-12">

      {/* Cercles décoratifs animés */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <motion.div
          animate={{ scale: [1, 1.15, 1], opacity: [0.15, 0.25, 0.15] }}
          transition={{ duration: 8, repeat: Infinity }}
          className="absolute -top-32 -left-32 w-96 h-96 rounded-full"
          style={{ background: 'radial-gradient(circle, #7C3AED 0%, transparent 70%)' }}
        />
        <motion.div
          animate={{ scale: [1, 1.2, 1], opacity: [0.1, 0.2, 0.1] }}
          transition={{ duration: 10, repeat: Infinity, delay: 2 }}
          className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full"
          style={{ background: 'radial-gradient(circle, #00F5FF 0%, transparent 70%)' }}
        />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative w-full max-w-md"
      >
        {/* Bouton retour */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-text-secondary hover:text-white transition-colors mb-6"
        >
          <FiArrowLeft size={15} /> Retour à l&apos;accueil
        </Link>

        <div className="glass-strong rounded-2xl p-8 shadow-nova-lg">
          {/* Logo */}
          <div className="flex justify-center mb-8">
            <Logo size="lg" />
          </div>

          {/* ── Écran Firebase non configuré ── */}
          {!firebaseReady ? (
            <FirebaseNotConfigured />
          ) : (
            <>
              {/* Onglets login / inscription */}
              <div className="flex rounded-xl bg-nova-card border border-nova-border mb-8 p-1">
                {(['login', 'register'] as Mode[]).map((m) => (
                  <button
                    key={m}
                    onClick={() => { setMode(m); setError(null) }}
                    className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all duration-200 ${
                      mode === m
                        ? 'bg-nova-gradient text-white shadow-nova'
                        : 'text-text-secondary hover:text-white'
                    }`}
                  >
                    {m === 'login' ? 'Connexion' : 'Inscription'}
                  </button>
                ))}
              </div>

              {/* Formulaire */}
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-text-secondary mb-1.5">Adresse email</label>
                  <div className="relative">
                    <FiMail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="vous@exemple.com"
                      autoComplete="email"
                      className="w-full bg-nova-card border border-nova-border text-white text-sm pl-10 pr-4 py-3 rounded-lg placeholder:text-text-muted transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-text-secondary mb-1.5">Mot de passe</label>
                  <div className="relative">
                    <FiLock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted" />
                    <input
                      type={showPass ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder={mode === 'register' ? 'Au moins 6 caractères' : '••••••••'}
                      autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                      className="w-full bg-nova-card border border-nova-border text-white text-sm pl-10 pr-12 py-3 rounded-lg placeholder:text-text-muted transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPass(!showPass)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-secondary transition-colors"
                    >
                      {showPass ? <FiEyeOff size={16} /> : <FiEye size={16} />}
                    </button>
                  </div>
                </div>

                <AnimatePresence>
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, y: -6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="flex items-start gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm"
                    >
                      <FiAlertCircle size={15} className="flex-shrink-0 mt-0.5" />
                      {error}
                    </motion.div>
                  )}
                  {success && (
                    <motion.div
                      initial={{ opacity: 0, y: -6 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-3 rounded-lg bg-green-500/10 border border-green-500/20 text-green-400 text-sm"
                    >
                      {success}
                    </motion.div>
                  )}
                </AnimatePresence>

                <button
                  type="submit"
                  disabled={loading}
                  className="btn-nova w-full justify-center py-3 text-sm font-semibold disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  <span className="flex items-center justify-center gap-2">
                    {loading && <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                    {mode === 'login' ? 'Se connecter' : 'Créer mon compte'}
                  </span>
                </button>
              </form>

              <div className="flex items-center gap-3 my-5">
                <div className="flex-1 h-px bg-nova-border" />
                <span className="text-xs text-text-muted">ou</span>
                <div className="flex-1 h-px bg-nova-border" />
              </div>

              <button
                onClick={handleGoogle}
                disabled={loading}
                className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-lg glass border border-nova-border text-sm font-medium text-white hover:bg-white/5 hover:border-nova-primary/30 transition-all disabled:opacity-60"
              >
                <FcGoogle size={20} /> Continuer avec Google
              </button>

              <p className="text-center text-xs text-text-secondary mt-6">
                {mode === 'login' ? 'Pas encore de compte ? ' : 'Déjà un compte ? '}
                <button
                  onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(null) }}
                  className="text-nova-secondary hover:text-nova-primary font-semibold transition-colors"
                >
                  {mode === 'login' ? 'Créer un compte' : 'Se connecter'}
                </button>
              </p>
            </>
          )}
        </div>
      </motion.div>
    </div>
  )
}

// ── Composant affiché si Firebase n'est pas configuré ──
function FirebaseNotConfigured() {
  return (
    <div className="text-center space-y-4">
      <div className="w-14 h-14 rounded-2xl bg-yellow-500/10 flex items-center justify-center mx-auto">
        <FiKey size={24} className="text-yellow-400" />
      </div>
      <h2 className="text-lg font-bold text-white">Firebase non configuré</h2>
      <p className="text-sm text-text-secondary leading-relaxed">
        L&apos;authentification nécessite des clés Firebase. Ajoutez ces variables dans
        <strong className="text-white"> Vercel → Settings → Environment Variables</strong> :
      </p>
      <div className="bg-nova-card border border-nova-border rounded-lg p-3 text-left text-xs text-nova-secondary space-y-1 font-mono">
        {[
          'NEXT_PUBLIC_FIREBASE_API_KEY',
          'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN',
          'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
          'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET',
          'NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
          'NEXT_PUBLIC_FIREBASE_APP_ID',
        ].map((v) => <div key={v}>{v}</div>)}
      </div>
      <Link
        href="/"
        className="inline-flex items-center gap-2 text-sm text-nova-secondary hover:text-white transition-colors mt-2"
      >
        <FiArrowLeft size={14} /> Retour à l&apos;accueil sans connexion
      </Link>
    </div>
  )
}
