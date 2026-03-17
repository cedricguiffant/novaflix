// components/RegisterForm.tsx
// Formulaire d'inscription réutilisable — style NovaFlix violet/cyan
// Champs : email, mot de passe, confirmation
// Validation locale avant envoi à Firebase

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import {
  FiMail, FiLock, FiEye, FiEyeOff,
  FiAlertCircle, FiCheckCircle, FiArrowLeft,
} from 'react-icons/fi'
import { registerWithEmail, firebaseReady } from '@/lib/firebase'
import { FiKey } from 'react-icons/fi'

// ── Types ──────────────────────────────────────────────────────────────
interface RegisterFormProps {
  /** Callback appelé après inscription réussie (optionnel) */
  onSuccess?: () => void
}

interface FieldError {
  email?: string
  password?: string
  confirm?: string
}

// ── Traduction des codes d'erreur Firebase ─────────────────────────────
function parseFirebaseError(code: string): string {
  const map: Record<string, string> = {
    'auth/email-already-in-use':
      'Un compte existe déjà avec cet email. Connectez-vous.',
    'auth/invalid-email':
      'Adresse email invalide.',
    'auth/weak-password':
      'Mot de passe trop faible. Choisissez au moins 6 caractères.',
    'auth/operation-not-allowed':
      'Inscription désactivée. Contactez l\'administrateur.',
    'auth/network-request-failed':
      'Erreur réseau. Vérifiez votre connexion.',
    'auth/too-many-requests':
      'Trop de tentatives. Attendez quelques minutes.',
  }
  return map[code] ?? `Erreur inattendue (${code}). Réessayez.`
}

// ── Composant ──────────────────────────────────────────────────────────
export default function RegisterForm({ onSuccess }: RegisterFormProps) {
  const router = useRouter()

  const [email, setEmail]         = useState('')
  const [password, setPassword]   = useState('')
  const [confirm, setConfirm]     = useState('')
  const [showPass, setShowPass]   = useState(false)
  const [showConf, setShowConf]   = useState(false)
  const [loading, setLoading]     = useState(false)
  const [error, setError]         = useState<string | null>(null)
  const [success, setSuccess]     = useState(false)
  const [fieldErrors, setFieldErrors] = useState<FieldError>({})

  // ── Force du mot de passe (0-4) ──────────────────────────────────────
  const getStrength = (p: string): number => {
    let score = 0
    if (p.length >= 6)  score++
    if (p.length >= 10) score++
    if (/[A-Z]/.test(p)) score++
    if (/[0-9!@#$%^&*]/.test(p)) score++
    return score
  }
  const strength = getStrength(password)
  const strengthLabel = ['', 'Faible', 'Moyen', 'Bon', 'Fort'][strength]
  const strengthColor = ['', 'bg-red-500', 'bg-yellow-500', 'bg-blue-500', 'bg-green-500'][strength]

  // ── Validation locale ────────────────────────────────────────────────
  const validate = (): boolean => {
    const errs: FieldError = {}
    if (!email.trim())         errs.email = 'L\'email est requis.'
    else if (!/\S+@\S+\.\S+/.test(email)) errs.email = 'Email invalide.'

    if (!password)             errs.password = 'Le mot de passe est requis.'
    else if (password.length < 6) errs.password = 'Minimum 6 caractères.'

    if (!confirm)              errs.confirm = 'Confirmez votre mot de passe.'
    else if (confirm !== password) errs.confirm = 'Les mots de passe ne correspondent pas.'

    setFieldErrors(errs)
    return Object.keys(errs).length === 0
  }

  // ── Soumission ───────────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (!validate()) return

    setLoading(true)
    try {
      await registerWithEmail(email, password)
      setSuccess(true)
      onSuccess?.()
      // Redirection après 1.2s pour que l'utilisateur voie le message de succès
      setTimeout(() => router.push('/'), 1200)
    } catch (err: unknown) {
      const code = (err as { code?: string }).code ?? ''
      if ((err as Error).message?.includes('non configuré')) {
        setError('Firebase non configuré. Ajoutez vos clés NEXT_PUBLIC_FIREBASE_* sur Vercel.')
      } else {
        setError(parseFirebaseError(code))
      }
    } finally {
      setLoading(false)
    }
  }

  // ── Firebase non configuré ───────────────────────────────────────────
  if (!firebaseReady) {
    return (
      <div className="text-center space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-yellow-500/10 flex items-center justify-center mx-auto">
          <FiKey size={24} className="text-yellow-400" />
        </div>
        <h2 className="text-lg font-bold text-white">Firebase non configuré</h2>
        <p className="text-sm text-text-secondary">
          L&apos;inscription nécessite les variables <code className="text-nova-secondary">NEXT_PUBLIC_FIREBASE_*</code> sur Vercel.
        </p>
        <Link href="/" className="inline-flex items-center gap-2 text-sm text-nova-secondary hover:text-white transition-colors">
          <FiArrowLeft size={14} /> Retour à l&apos;accueil
        </Link>
      </div>
    )
  }

  // ── État succès ──────────────────────────────────────────────────────
  if (success) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center space-y-4 py-4"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 200, delay: 0.1 }}
          className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto"
        >
          <FiCheckCircle size={32} className="text-green-400" />
        </motion.div>
        <h2 className="text-xl font-black text-white">Compte créé !</h2>
        <p className="text-sm text-text-secondary">
          Bienvenue sur NovaFlix. Redirection en cours…
        </p>
        <div className="w-32 h-1 bg-nova-border rounded-full mx-auto overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: '100%' }}
            transition={{ duration: 1.2, ease: 'linear' }}
            className="h-full bg-nova-gradient rounded-full"
          />
        </div>
      </motion.div>
    )
  }

  // ── Formulaire ───────────────────────────────────────────────────────
  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>

      {/* Email */}
      <div>
        <label className="block text-xs font-medium text-text-secondary mb-1.5">
          Adresse email
        </label>
        <div className="relative">
          <FiMail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted" />
          <input
            type="email"
            value={email}
            onChange={(e) => { setEmail(e.target.value); setFieldErrors(f => ({ ...f, email: undefined })) }}
            placeholder="vous@exemple.com"
            autoComplete="email"
            className={`w-full bg-nova-card border text-white text-sm pl-10 pr-4 py-3 rounded-lg placeholder:text-text-muted transition-all ${
              fieldErrors.email
                ? 'border-red-500/60 focus:border-red-500'
                : 'border-nova-border focus:border-nova-primary'
            }`}
          />
        </div>
        <AnimatePresence>
          {fieldErrors.email && (
            <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="mt-1 text-xs text-red-400 flex items-center gap-1">
              <FiAlertCircle size={11} /> {fieldErrors.email}
            </motion.p>
          )}
        </AnimatePresence>
      </div>

      {/* Mot de passe */}
      <div>
        <label className="block text-xs font-medium text-text-secondary mb-1.5">
          Mot de passe
        </label>
        <div className="relative">
          <FiLock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted" />
          <input
            type={showPass ? 'text' : 'password'}
            value={password}
            onChange={(e) => { setPassword(e.target.value); setFieldErrors(f => ({ ...f, password: undefined })) }}
            placeholder="Minimum 6 caractères"
            autoComplete="new-password"
            className={`w-full bg-nova-card border text-white text-sm pl-10 pr-12 py-3 rounded-lg placeholder:text-text-muted transition-all ${
              fieldErrors.password
                ? 'border-red-500/60 focus:border-red-500'
                : 'border-nova-border focus:border-nova-primary'
            }`}
          />
          <button type="button" onClick={() => setShowPass(!showPass)}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-secondary transition-colors">
            {showPass ? <FiEyeOff size={15} /> : <FiEye size={15} />}
          </button>
        </div>

        {/* Barre de force */}
        {password.length > 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-2 space-y-1">
            <div className="flex gap-1">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                  i <= strength ? strengthColor : 'bg-nova-border'
                }`} />
              ))}
            </div>
            {strengthLabel && (
              <p className={`text-xs ${
                strength <= 1 ? 'text-red-400' : strength === 2 ? 'text-yellow-400' : strength === 3 ? 'text-blue-400' : 'text-green-400'
              }`}>
                Force : {strengthLabel}
              </p>
            )}
          </motion.div>
        )}

        <AnimatePresence>
          {fieldErrors.password && (
            <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="mt-1 text-xs text-red-400 flex items-center gap-1">
              <FiAlertCircle size={11} /> {fieldErrors.password}
            </motion.p>
          )}
        </AnimatePresence>
      </div>

      {/* Confirmation */}
      <div>
        <label className="block text-xs font-medium text-text-secondary mb-1.5">
          Confirmer le mot de passe
        </label>
        <div className="relative">
          <FiLock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted" />
          <input
            type={showConf ? 'text' : 'password'}
            value={confirm}
            onChange={(e) => { setConfirm(e.target.value); setFieldErrors(f => ({ ...f, confirm: undefined })) }}
            placeholder="Répétez votre mot de passe"
            autoComplete="new-password"
            className={`w-full bg-nova-card border text-white text-sm pl-10 pr-12 py-3 rounded-lg placeholder:text-text-muted transition-all ${
              fieldErrors.confirm
                ? 'border-red-500/60 focus:border-red-500'
                : confirm && confirm === password
                  ? 'border-green-500/50 focus:border-green-500'
                  : 'border-nova-border focus:border-nova-primary'
            }`}
          />
          <button type="button" onClick={() => setShowConf(!showConf)}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-secondary transition-colors">
            {showConf ? <FiEyeOff size={15} /> : <FiEye size={15} />}
          </button>
          {/* Icône check si les mots de passe correspondent */}
          {confirm && confirm === password && (
            <FiCheckCircle size={15} className="absolute right-10 top-1/2 -translate-y-1/2 text-green-400" />
          )}
        </div>
        <AnimatePresence>
          {fieldErrors.confirm && (
            <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="mt-1 text-xs text-red-400 flex items-center gap-1">
              <FiAlertCircle size={11} /> {fieldErrors.confirm}
            </motion.p>
          )}
        </AnimatePresence>
      </div>

      {/* Erreur Firebase globale */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="flex items-start gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm"
          >
            <FiAlertCircle size={15} className="flex-shrink-0 mt-0.5" />
            {error}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bouton Créer le compte */}
      <button
        type="submit"
        disabled={loading}
        className="btn-nova w-full justify-center py-3 text-sm font-semibold disabled:opacity-60 disabled:cursor-not-allowed mt-2"
      >
        <span className="flex items-center justify-center gap-2">
          {loading && (
            <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          )}
          {loading ? 'Création en cours…' : 'Créer mon compte'}
        </span>
      </button>

      {/* Lien login */}
      <p className="text-center text-xs text-text-secondary pt-1">
        Déjà un compte ?{' '}
        <Link href="/login" className="text-nova-secondary hover:text-nova-primary font-semibold transition-colors">
          Se connecter
        </Link>
      </p>
    </form>
  )
}
