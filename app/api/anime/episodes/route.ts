// app/api/anime/episodes/route.ts — Proxy AniWatch API (liste épisodes)

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
  const id = req.nextUrl.searchParams.get('id')
  if (!id) return NextResponse.json({ episodes: [] })

  for (const base of getCandidates(req)) {
    try {
      const res = await fetch(
        `${base}/anime/episodes/${encodeURIComponent(id)}`,
        { cache: 'no-store', signal: AbortSignal.timeout(10_000) }
      )
      if (!res.ok) continue
      const data = await res.json()
      const eps: AniWatchEpisode[] = data?.data?.episodes ?? []
      if (eps.length > 0) {
        return NextResponse.json({
          episodes: eps.map((e) => ({
            id: e.episodeId,
            number: e.number,
            url: '',
          })),
        })
      }
    } catch (e) {
      console.warn(`[AniWatch/episodes] ${base}:`, e instanceof Error ? e.message : e)
    }
  }

  return NextResponse.json({ episodes: [] })
}

interface AniWatchEpisode {
  episodeId: string
  number: number
  title: string | null
  isFiller: boolean
}
