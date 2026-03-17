// components/Logo.tsx — Logo SVG vectoriel NovaFlix
'use client'

import Link from 'next/link'

interface LogoProps {
  variant?: 'color' | 'white'
  size?: 'sm' | 'md' | 'lg'
  showText?: boolean
}

/**
 * Logo NovaFlix — Icône SVG minimaliste (caméra cinéma fusionnée avec "N")
 * + texte "NovaFlix" avec dégradé violet→cyan
 */
export default function Logo({
  variant = 'color',
  size = 'md',
  showText = true,
}: LogoProps) {
  // Dimensions selon la taille
  const iconSize = { sm: 28, md: 36, lg: 48 }[size]
  const textClass = {
    sm: 'text-xl',
    md: 'text-2xl',
    lg: 'text-3xl',
  }[size]

  return (
    <Link href="/" className="flex items-center gap-2 group select-none">
      {/* ── Icône SVG : caméra cinéma stylisée avec N ── */}
      <svg
        width={iconSize}
        height={iconSize}
        viewBox="0 0 48 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="transition-transform duration-300 group-hover:scale-110"
      >
        <defs>
          <linearGradient id="nova-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#7C3AED" />
            <stop offset="100%" stopColor="#00F5FF" />
          </linearGradient>
          <linearGradient id="nova-grad-white" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="100%" stopColor="#E0E0E0" />
          </linearGradient>
        </defs>

        {/* Corps de la caméra */}
        <rect
          x="4" y="12" width="32" height="24"
          rx="4"
          fill={variant === 'color' ? 'url(#nova-grad)' : 'url(#nova-grad-white)'}
        />

        {/* Viseur droit (triangles latéraux de caméra) */}
        <polygon
          points="36,18 44,14 44,22"
          fill={variant === 'color' ? '#00F5FF' : '#CCCCCC'}
          opacity="0.9"
        />
        <polygon
          points="36,30 44,26 44,34"
          fill={variant === 'color' ? '#00F5FF' : '#CCCCCC'}
          opacity="0.9"
        />

        {/* Lettre N stylisée à l'intérieur */}
        <text
          x="10" y="31"
          fontFamily="Inter, sans-serif"
          fontWeight="900"
          fontSize="18"
          fill="white"
          opacity="0.95"
        >
          N
        </text>

        {/* Point de focus (cercle en haut gauche du corps) */}
        <circle
          cx="10" cy="17"
          r="2"
          fill="white"
          opacity="0.6"
        />
      </svg>

      {/* ── Texte "NovaFlix" ── */}
      {showText && (
        <span
          className={`font-black tracking-tight ${textClass} ${
            variant === 'color' ? 'gradient-text' : 'text-white'
          }`}
        >
          NovaFlix
        </span>
      )}
    </Link>
  )
}
