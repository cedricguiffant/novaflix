// app/profile/page.tsx — Page de profil utilisateur NovaFlix
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { FiUser, FiMail, FiCalendar, FiShield, FiLogOut, FiEdit2 } from 'react-icons/fi'
import { HiOutlineFilm } from 'react-icons/hi'
import Header from '@/components/Header'
import Logo from '@/components/Logo'
import { auth, logout } from '@/lib/firebase'
import { onAuthStateChanged, type User } from 'firebase/auth'

/**
 * Page de profil utilisateur :
 * - Infos du compte (email, date d'inscription)
 * - Abonnement fictif NovaFlix Premium
 * - Statistiques fictives (films vus, heures)
 * - Bouton déconnexion
 */
export default function ProfilePage() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  // Redirige si non connecté
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      if (!u) {
        router.push('/login')
      } else {
        setUser(u)
        setLoading(false)
      }
    })
    return () => unsub()
  }, [router])

  const handleLogout = async () => {
    await logout()
    router.push('/login')
  }

  // Date d'inscription formatée
  const joinDate = user?.metadata.creationTime
    ? new Date(user.metadata.creationTime).toLocaleDateString('fr-FR', {
        year: 'numeric', month: 'long', day: 'numeric',
      })
    : '—'

  if (loading) {
    return (
      <div className="min-h-screen bg-nova-bg flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-nova-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-nova-bg">
      <Header />

      <main className="pt-24 pb-20 px-4 sm:px-8 max-w-3xl mx-auto">

        {/* ── En-tête profil ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row items-center sm:items-end gap-6 mb-10"
        >
          {/* Avatar grand format */}
          <div className="relative">
            <div className="w-24 h-24 rounded-2xl bg-nova-gradient flex items-center justify-center text-white text-4xl font-black shadow-nova-lg overflow-hidden">
              {user?.photoURL ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={user.photoURL} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <span>{user?.email?.[0]?.toUpperCase() ?? 'N'}</span>
              )}
            </div>
            {/* Badge premium */}
            <div className="absolute -bottom-2 -right-2 bg-nova-gradient text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-nova">
              PREMIUM
            </div>
          </div>

          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-white">
              {user?.displayName ?? 'Utilisateur NovaFlix'}
            </h1>
            <p className="text-text-secondary text-sm mt-1">
              Membre depuis le {joinDate}
            </p>
          </div>

          {/* Bouton modifier profil */}
          <button className="sm:ml-auto btn-ghost text-sm py-2 gap-2">
            <FiEdit2 size={14} /> Modifier
          </button>
        </motion.div>

        {/* Divider */}
        <div className="divider-nova mb-8" />

        {/* ── Grille d'infos ── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8"
        >
          {/* Email */}
          <InfoCard
            icon={<FiMail size={18} className="text-nova-secondary" />}
            label="Email"
            value={user?.email ?? '—'}
          />

          {/* Membre depuis */}
          <InfoCard
            icon={<FiCalendar size={18} className="text-nova-secondary" />}
            label="Membre depuis"
            value={joinDate}
          />

          {/* Abonnement */}
          <InfoCard
            icon={<FiShield size={18} className="text-nova-secondary" />}
            label="Abonnement"
            value="NovaFlix Premium"
            badge="Actif"
          />

          {/* Profils actifs */}
          <InfoCard
            icon={<FiUser size={18} className="text-nova-secondary" />}
            label="Type de compte"
            value={user?.providerData[0]?.providerId === 'google.com' ? 'Google' : 'Email / Mot de passe'}
          />
        </motion.div>

        {/* ── Statistiques fictives ── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass rounded-2xl p-6 mb-8"
        >
          <div className="flex items-center gap-2 mb-5">
            <HiOutlineFilm size={18} className="text-nova-primary" />
            <h2 className="text-base font-bold text-white">Votre activité</h2>
          </div>
          <div className="grid grid-cols-3 gap-4 text-center">
            {[
              { value: '47', label: 'Films vus' },
              { value: '12', label: 'Séries suivies' },
              { value: '238h', label: 'En streaming' },
            ].map((stat) => (
              <div key={stat.label}>
                <p className="text-2xl font-black gradient-text">{stat.value}</p>
                <p className="text-xs text-text-secondary mt-1">{stat.label}</p>
              </div>
            ))}
          </div>
        </motion.div>

        {/* ── Plan abonnement ── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="glass rounded-2xl p-6 mb-8 border border-nova-primary/20"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Logo size="sm" showText={false} />
              <div>
                <p className="text-sm font-bold text-white">NovaFlix Premium</p>
                <p className="text-xs text-text-secondary">Renouvellement le 17 Avril 2026</p>
              </div>
            </div>
            <span className="text-lg font-black gradient-text">13,99 €/mois</span>
          </div>
          <div className="flex gap-2 text-xs text-text-secondary flex-wrap">
            {['4K Ultra HD', 'Dolby Atmos', '4 écrans simultanés', 'Téléchargements illimités'].map((f) => (
              <span key={f} className="px-2 py-1 rounded-full glass border border-nova-border">{f}</span>
            ))}
          </div>
        </motion.div>

        {/* Bouton déconnexion */}
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl glass border border-red-500/20 text-red-400 hover:bg-red-500/10 hover:border-red-500/40 transition-all duration-200 text-sm font-medium"
        >
          <FiLogOut size={16} /> Se déconnecter
        </motion.button>
      </main>
    </div>
  )
}

// ── Composant carte d'info ──
function InfoCard({
  icon, label, value, badge,
}: {
  icon: React.ReactNode
  label: string
  value: string
  badge?: string
}) {
  return (
    <div className="glass rounded-xl p-4 flex items-start gap-3">
      <div className="mt-0.5">{icon}</div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-text-secondary mb-0.5">{label}</p>
        <p className="text-sm font-semibold text-white truncate">{value}</p>
      </div>
      {badge && (
        <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-green-500/20 text-green-400 border border-green-500/20 flex-shrink-0">
          {badge}
        </span>
      )}
    </div>
  )
}
