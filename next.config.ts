// next.config.ts — Configuration Next.js pour NovaFlix
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  images: {
    domains: [
      'image.tmdb.org',
      'lh3.googleusercontent.com', // avatars Google
    ],
  },
}

export default nextConfig
