// app/layout.tsx — Layout racine de NovaFlix
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

// Chargement de la police Inter via next/font/google
const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  weight: ['300', '400', '500', '600', '700', '800', '900'],
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'NovaFlix — Streaming Premium',
  description: 'Films, séries et documentaires en streaming illimité. Découvrez l\'univers NovaFlix.',
  keywords: ['streaming', 'films', 'séries', 'NovaFlix', 'vidéo'],
  authors: [{ name: 'NovaFlix' }],
  icons: {
    icon: '/favicon.ico',
  },
  openGraph: {
    title: 'NovaFlix — Streaming Premium',
    description: 'Films, séries et documentaires en streaming illimité.',
    type: 'website',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="fr" className={inter.variable}>
      <body className="bg-nova-bg text-text-primary font-sans antialiased">
        {children}
      </body>
    </html>
  )
}
