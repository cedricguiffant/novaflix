// app/api/animesama/seasons/route.ts
// Scrape la page d'un anime sur anime-sama.to
// Extrait les saisons via les appels JS panneauAnime("Saison 1", "saison1/vostfr")

import { NextResponse } from 'next/server'

const HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ' +
    '(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  Accept: 'text/html,application/xhtml+xml',
  'Accept-Language': 'fr-FR,fr;q=0.9,en;q=0.8',
}

export interface AnimeSamaSeason {
  name: string       // ex: "Saison 1"
  url: string        // ex: https://anime-sama.pw/catalogue/naruto/saison1/vostfr/
  lang: 'vf' | 'vostfr'
}

export async function GET(request: Request) {
  const catalogueUrl = new URL(request.url).searchParams.get('url')
  if (!catalogueUrl) return NextResponse.json([])

  // Sécurité : n'autoriser que les URLs anime-sama
  if (!catalogueUrl.includes('anime-sama')) return NextResponse.json([])

  try {
    const res = await fetch(catalogueUrl, {
      headers: HEADERS,
      next: { revalidate: 300 },
    })
    if (!res.ok) return NextResponse.json([])

    const html = await res.text()
    const seasons = parseSeasons(html, catalogueUrl)
    return NextResponse.json(seasons)
  } catch {
    return NextResponse.json([])
  }
}

// ── Parseur ─────────────────────────────────────────────────────────────
// Sur anime-sama.to, le HTML d'une page anime (/catalogue/naruto/) contient :
//   panneauAnime("Avec Fillers", "saison1/vostfr");
//   panneauAnime("Film", "film/vostfr");
// Les URLs sont RELATIVES au catalogue (pas absolues comme dans l'ancienne version).

function parseSeasons(html: string, baseUrl: string): AnimeSamaSeason[] {
  const seasons: AnimeSamaSeason[] = []
  const seen = new Set<string>()

  const base = baseUrl.endsWith('/') ? baseUrl : baseUrl + '/'

  const rx = /panneauAnime\(\s*["']([^"']+)["']\s*,\s*["']([^"']+)["']\s*\)/g
  let m: RegExpExecArray | null

  while ((m = rx.exec(html)) !== null) {
    const [, name, relPath] = m

    // Détermine la langue à partir du suffixe du chemin
    const lang: 'vf' | 'vostfr' | null = relPath.endsWith('vostfr')
      ? 'vostfr'
      : relPath.endsWith('vf')
        ? 'vf'
        : null
    if (!lang) continue

    // URL absolue = base du catalogue + chemin relatif + /
    const url = base + relPath.replace(/^\//, '') + '/'

    if (!seen.has(url)) {
      seen.add(url)
      seasons.push({ name: name.trim(), url, lang })
    }
  }

  // Trier : VOSTFR d'abord, puis VF ; puis par nom
  seasons.sort((a, b) => {
    if (a.lang !== b.lang) return a.lang === 'vostfr' ? -1 : 1
    return a.name.localeCompare(b.name)
  })

  return seasons
}
