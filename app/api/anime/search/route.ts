// app/api/anime/search/route.ts — Proxy AniWatch API (recherche)
// Priorité URL : header x-stream-api > ANIWATCH_API_URL env > instance Render

import { NextRequest, NextResponse } from 'next/server'

function getCandidates(req: NextRequest): string[] {
  const candidates = [
    req.headers.get('x-stream-api'),
    process.env.ANIWATCH_API_URL,
    'https://api-aniwatch.onrender.com',
  ]
  return [...new Set(candidates.filter(Boolean))] as string[]
}

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get('q')
  if (!q) return NextResponse.json({ results: [] })

  for (const base of getCandidates(req)) {
    try {
      const res = await fetch(
        `${base}/anime/search?q=${encodeURIComponent(q)}&page=1`,
        { cache: 'no-store', signal: AbortSignal.timeout(10_000) }
      )
      if (!res.ok) { console.warn(`[AniWatch] ${base} → ${res.status}`); continue }
      const data = await res.json()
      const animes: AniWatchAnime[] = data?.data?.animes ?? []
      if (animes.length > 0) {
        return NextResponse.json({
          results: animes.map((a) => ({
            id: a.id,
            title: a.name,
            image: a.poster,
            subOrDub: 'sub' as const,
            releaseDate: String(a.episodes?.sub ?? ''),
          })),
        })
      }
    } catch (e) {
      console.warn(`[AniWatch/search] ${base}:`, e instanceof Error ? e.message : e)
    }
  }

  return NextResponse.json({ results: [] })
}

interface AniWatchAnime {
  id: string
  name: string
  poster: string
  type: string
  episodes: { sub: number; dub: number } | null
}
