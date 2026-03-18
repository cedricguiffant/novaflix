// components/HlsPlayer.tsx
// Lecteur vidéo universel : HLS (m3u8) via hls.js + fallback MP4 natif
// hls.js est chargé dynamiquement (import()) → pas de SSR issue

'use client'

import { useEffect, useRef } from 'react'

interface HlsPlayerProps {
  src: string
  isM3U8: boolean
  className?: string
}

export default function HlsPlayer({
  src,
  isM3U8,
  className = '',
}: HlsPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  // Stocker l'instance HLS pour pouvoir la détruire proprement
  const hlsRef = useRef<{ destroy(): void } | null>(null)

  useEffect(() => {
    const video = videoRef.current
    if (!video || !src) return

    // Nettoyer l'instance HLS précédente
    hlsRef.current?.destroy()
    hlsRef.current = null

    // ── MP4 ou autre format non-HLS ──
    if (!isM3U8) {
      video.src = src
      video.play().catch(() => {})
      return
    }

    // ── HLS natif (Safari / iOS) ──
    if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = src
      video.play().catch(() => {})
      return
    }

    // ── HLS.js pour Chrome / Firefox / Edge ──
    import('hls.js').then(({ default: Hls }) => {
      if (!Hls.isSupported() || !videoRef.current) return

      const hls = new Hls({ enableWorker: true })
      hlsRef.current = hls
      hls.loadSource(src)
      hls.attachMedia(videoRef.current)
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        videoRef.current?.play().catch(() => {})
      })
    })

    return () => {
      hlsRef.current?.destroy()
      hlsRef.current = null
    }
  }, [src, isM3U8])

  return (
    <video
      ref={videoRef}
      className={className}
      controls
      playsInline
      style={{ width: '100%', height: '100%', background: '#000' }}
    />
  )
}
