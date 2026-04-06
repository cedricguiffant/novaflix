// app/api/animesama/search/route.ts
// Proxy server-side vers anime-sama.pw/catalogue/?search=...
// Scrape HTML + extrait les entrées de catalogue (URL, nom, image, genres…)

import { NextResponse } from 'next/server'

const SITE = 'https://anime-sama.to'

const HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ' +
    '(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  Accept: 'text/html,application/xhtml+xml',
  'Accept-Language': 'fr-FR,fr;q=0.9,en;q=0.8',
  Referer: SITE + '/',
}

export interface AnimeSamaResult {
  url: string
  name: string
  image: string
  genres: string[]
  categories: string[]
  languages: string[]
}

export async function GET(request: Request) {
  const q = new URL(request.url).searchParams.get('q')?.trim()
  if (!q) return NextResponse.json([])

  try {
    const res = await fetch(
      `${SITE}/catalogue/?search=${encodeURIComponent(q)}`,
      { headers: HEADERS, next: { revalidate: 300 } }
    )
    if (!res.ok) return NextResponse.json([])

    const html = await res.text()
    const results = parseCatalogue(html)
    return NextResponse.json(results)
  } catch {
    return NextResponse.json([])
  }
}

// ── Parseur HTML ────────────────────────────────────────────────────────
// Structure HTML de anime-sama.to :
//   <a href="https://anime-sama.to/catalogue/{slug}/">
//     <img src=".../{slug}.jpg" alt="{name}">
//     <h2 class="card-title">{name}</h2>
//     <p class="alternate-titles">{alt}</p>
//     <div class="info-row"><span class="info-label">Genres</span>
//       <p class="info-value">{genres}</p>

function parseCatalogue(html: string): AnimeSamaResult[] {
  const results: AnimeSamaResult[] = []
  const seen = new Set<string>()

  // Capture: href, image src, card-title, alternate-titles, genres (info-value)
  const cardRx =
    /href="(https:\/\/anime-sama\.to\/catalogue\/[^"]+)"[\s\S]{1,600}?src="([^"]+)"[\s\S]{1,600}?<h2 class="card-title">([^<]+)<\/h2>[\s\S]{1,200}?<p class="alternate-titles">([^<]*)<\/p>[\s\S]{1,400}?<p class="info-value">([^<]*)<\/p>/g

  let m: RegExpExecArray | null
  while ((m = cardRx.exec(html)) !== null) {
    const [, rawUrl, image, rawName, rawAlt, rawGenres] = m
    const url = rawUrl.endsWith('/') ? rawUrl : rawUrl + '/'
    const name = decode(rawName.trim())
    if (!name || seen.has(url)) continue
    seen.add(url)

    results.push({
      url,
      name,
      image: image.trim(),
      genres: splitField(rawGenres),
      categories: [],
      languages: [],
    })
    // Évite les doublons dus à rawAlt non utilisé
    void rawAlt
  }

  return results
}

function splitField(raw: string): string[] {
  return raw
    .split(/[,\-–]/)
    .map((s) => decode(s.trim()))
    .filter(Boolean)
}

function decode(s: string): string {
  return s
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .trim()
}
