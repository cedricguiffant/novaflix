// app/api/anime/stream/route.ts — Proxy AniWatch API (sources stream)
// cache: no-store car les URLs HLS expirent rapidement

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
  const episodeId = req.nextUrl.searchParams.get('episodeId')
  if (!episodeId) return NextResponse.json({ sources: [] })

  for (const base of getCandidates(req)) {
    try {
      const url =
        `${base}/anime/episode-sources` +
        `?id=${encodeURIComponent(episodeId)}` +
        `&server=vidstreaming&category=sub`

      const res = await fetch(url, {
        cache: 'no-store',
        signal: AbortSignal.timeout(12_000),
      })
      if (!res.ok) continue
      const data = await res.json()
      const sources: AniWatchSource[] = data?.data?.sources ?? []
      if (sources.length > 0) return NextResponse.json({ sources })
    } catch (e) {
      console.warn(`[AniWatch/stream] ${base}:`, e instanceof Error ? e.message : e)
    }
  }

  return NextResponse.json({ sources: [] })
}

interface AniWatchSource {
  url: string
  isM3U8: boolean
  quality: string
}
