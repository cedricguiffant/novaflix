// lib/firebase.ts — Configuration et initialisation Firebase pour NovaFlix
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

// ── Configuration Firebase depuis les variables d'environnement ──
const firebaseConfig = {
  apiKey:            process.env.NEXT_PUBLIC_FIREBASE_API_KEY ?? '',
  authDomain:        process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ?? '',
  projectId:         process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? '',
  storageBucket:     process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ?? '',
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?? '',
  appId:             process.env.NEXT_PUBLIC_FIREBASE_APP_ID ?? '',
}

// ── Initialisation défensive de Firebase ──
let app: FirebaseApp | null = null
let authInstance: Auth | null = null

try {
  if (!getApps().length) {
    app = initializeApp(firebaseConfig)
  } else {
    app = getApps()[0]
  }
  authInstance = getAuth(app)
} catch {
  // Firebase non configuré — les fonctions d'auth retourneront des rejets silencieux
  console.warn('[NovaFlix] Firebase non configuré. Ajoutez vos clés dans .env.local')
}

export const googleProvider = new GoogleAuthProvider()
googleProvider.setCustomParameters({ prompt: 'select_account' })

// ── Auth exporté (peut être null si Firebase n'est pas configuré) ──
// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
export const auth = authInstance!

// ── Fonctions d'authentification (résistantes si Firebase absent) ──

const notConfigured = () => Promise.reject(new Error('Firebase non configuré. Ajoutez vos clés dans .env.local'))

export const signInWithGoogle = () =>
  authInstance ? signInWithPopup(authInstance, googleProvider) : notConfigured()

export const loginWithEmail = (email: string, password: string) =>
  authInstance ? signInWithEmailAndPassword(authInstance, email, password) : notConfigured()

export const registerWithEmail = (email: string, password: string) =>
  authInstance ? createUserWithEmailAndPassword(authInstance, email, password) : notConfigured()

export const logout = () =>
  authInstance ? signOut(authInstance) : notConfigured()

export const onAuthChange = (callback: (user: User | null) => void) => {
  if (!authInstance) { callback(null); return () => {} }
  return onAuthStateChanged(authInstance, callback)
}

export default app
