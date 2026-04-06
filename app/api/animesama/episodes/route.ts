// app/api/animesama/episodes/route.ts
// 1. Scrape la page d'une saison pour trouver l'URL de episodes.js
// 2. Parse episodes.js : eps1 = ['url1', 'url2', ...], eps2 = [...], ...
// Logique portée depuis season.py de anime-sama_api (Python → TypeScript)

import { NextResponse } from 'next/server'

const HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ' +
    '(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  Accept: '*/*',
  'Accept-Language': 'fr-FR,fr;q=0.9,en;q=0.8',
}

export interface AnimeSamaEpisode {
  index: number       // 1-based
  name: string        // "Épisode 1" (ou nom réel si parsé)
  players: string[]   // URLs des players (iframes)
}

export async function GET(request: Request) {
  const seasonUrl = new URL(request.url).searchParams.get('url')
  if (!seasonUrl) return NextResponse.json([])
  if (!seasonUrl.includes('anime-sama')) return NextResponse.json([])

  try {
    // ── Étape 1 : page de la saison → trouver episodes.js ───────────────
    const pageRes = await fetch(seasonUrl, {
      headers: HEADERS,
      cache: 'no-store',
    })
    if (!pageRes.ok) return NextResponse.json([])
    const html = await pageRes.text()

    const jsMatch = html.match(/episodes\.js\?filever=\d+/)
    if (!jsMatch) return NextResponse.json([])

    const jsUrl = seasonUrl.replace(/\/?$/, '/') + jsMatch[0]

    // ── Étape 2 : episodes.js → parser les arrays eps{N} ────────────────
    const jsRes = await fetch(jsUrl, {
      headers: { ...HEADERS, Referer: seasonUrl },
      cache: 'no-store',
    })
    if (!jsRes.ok) return NextResponse.json([])
    const js = await jsRes.text()

    const episodes = parseEpisodesJs(js)
    return NextResponse.json(episodes)
  } catch {
    return NextResponse.json([])
  }
}

// ── Parseur episodes.js ──────────────────────────────────────────────────
// Format attendu :
//   var eps1 = ['https://vidmoly.net/...', 'https://sendvid.com/...'];
//   var eps2 = ['https://vidmoly.net/...'];
// Parfois sans "var" ou avec guillemets doubles.

function parseEpisodesJs(js: string): AnimeSamaEpisode[] {
  const episodes: AnimeSamaEpisode[] = []

  // Extrait tous les blocs eps{N} = [...]
  const epsRx = /eps(\d+)\s*=\s*\[([^\]]*)\]/g
  let m: RegExpExecArray | null

  while ((m = epsRx.exec(js)) !== null) {
    const [, indexStr, playersRaw] = m
    const index = parseInt(indexStr, 10)

    // Extrait chaque URL entre guillemets simples ou doubles
    const players: string[] = []
    const urlRx = /['"]([^'"]+)['"]/g
    let um: RegExpExecArray | null
    while ((um = urlRx.exec(playersRaw)) !== null) {
      const url = um[1].trim()
      if (url.startsWith('http')) players.push(url)
    }

    if (players.length > 0) {
      episodes.push({
        index,
        name: `Épisode ${index}`,
        players,
      })
    }
  }

  // Trier par index croissant
  episodes.sort((a, b) => a.index - b.index)
  return episodes
}
