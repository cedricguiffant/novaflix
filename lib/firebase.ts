// lib/firebase.ts
// CHANGEMENTS : Réécriture complète.
// - Vérification stricte de chaque variable NEXT_PUBLIC_ avant init
// - Initialisation 100% conditionnelle (jamais d'exception au module-load)
// - Export d'un booléen `firebaseReady` pour que les composants sachent
//   si Firebase est dispo sans tester `auth !== null`
// - Toutes les fonctions auth vérifient `auth` avant d'appeler Firebase

import { initializeApp, getApps, type FirebaseApp } from 'firebase/app'
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  type Auth,
  type User,
} from 'firebase/auth'

// ─────────────────────────────────────────────
// 1. Lecture des variables d'environnement
//    Toutes doivent commencer par NEXT_PUBLIC_
//    pour être accessibles côté client sur Vercel
// ─────────────────────────────────────────────
const env = {
  apiKey:            process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain:        process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId:         process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket:     process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId:             process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
}

// ─────────────────────────────────────────────
// 2. Validation : toutes les clés doivent être
//    présentes ET non-vides ET l'apiKey doit
//    ressembler à une vraie clé Firebase (AIzaSy…)
// ─────────────────────────────────────────────
const isValidConfig =
  !!env.apiKey &&
  env.apiKey.startsWith('AIzaSy') &&
  !!env.authDomain &&
  !!env.projectId &&
  !!env.appId

if (!isValidConfig) {
  console.warn(
    '[NovaFlix] Firebase non configuré.\n' +
    'Ajoutez ces variables dans Vercel → Settings → Environment Variables :\n' +
    '  NEXT_PUBLIC_FIREBASE_API_KEY\n' +
    '  NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN\n' +
    '  NEXT_PUBLIC_FIREBASE_PROJECT_ID\n' +
    '  NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET\n' +
    '  NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID\n' +
    '  NEXT_PUBLIC_FIREBASE_APP_ID\n' +
    'L\'application fonctionne sans auth — connectez-vous après config.'
  )
}

// ─────────────────────────────────────────────
// 3. Initialisation conditionnelle
//    getApps() évite la double-init en dev (HMR)
// ─────────────────────────────────────────────
let app:  FirebaseApp | null = null
let auth: Auth | null        = null

if (isValidConfig) {
  try {
    app  = getApps().length ? getApps()[0] : initializeApp(env as Required<typeof env>)
    auth = getAuth(app)
  } catch (err) {
    console.error('[NovaFlix] Erreur init Firebase :', err)
    app  = null
    auth = null
  }
}

// ─────────────────────────────────────────────
// 4. Exports
// ─────────────────────────────────────────────

/** `true` uniquement si Firebase est prêt à l'emploi */
export const firebaseReady = auth !== null

export { auth }
export const googleProvider = new GoogleAuthProvider()
googleProvider.setCustomParameters({ prompt: 'select_account' })

// ─────────────────────────────────────────────
// 5. Fonctions d'auth — toutes résistantes si
//    Firebase n'est pas configuré
// ─────────────────────────────────────────────

const ERR_NOT_CONFIGURED = 'Firebase non configuré. Ajoutez vos variables NEXT_PUBLIC_FIREBASE_* sur Vercel.'

export const signInWithGoogle = () => {
  if (!auth) return Promise.reject(new Error(ERR_NOT_CONFIGURED))
  return signInWithPopup(auth, googleProvider)
}

export const loginWithEmail = (email: string, password: string) => {
  if (!auth) return Promise.reject(new Error(ERR_NOT_CONFIGURED))
  return signInWithEmailAndPassword(auth, email, password)
}

export const registerWithEmail = (email: string, password: string) => {
  if (!auth) return Promise.reject(new Error(ERR_NOT_CONFIGURED))
  return createUserWithEmailAndPassword(auth, email, password)
}

export const logout = () => {
  if (!auth) return Promise.resolve()
  return signOut(auth)
}

/**
 * Observer sécurisé.
 * Si Firebase n'est pas configuré, appelle immédiatement callback(null)
 * et retourne une fonction de désinscription vide.
 */
export const onAuthChange = (callback: (user: User | null) => void): (() => void) => {
  if (!auth) {
    callback(null)
    return () => {}
  }
  return onAuthStateChanged(auth, callback)
}

export default app
