// tailwind.config.ts — Configuration Tailwind CSS pour NovaFlix
import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Palette NovaFlix
        nova: {
          bg:        '#0A0A0A',  // fond principal noir profond
          primary:   '#7C3AED',  // violet néon
          secondary: '#00F5FF',  // cyan néon
          card:      '#141414',  // fond des cartes
          border:    '#1F1F1F',  // bordures subtiles
        },
        text: {
          primary:   '#FFFFFF',
          secondary: '#A1A1AA',
          muted:     '#52525B',
        },
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'Inter', 'system-ui', 'sans-serif'],
      },
      backgroundImage: {
        // Dégradé signature NovaFlix
        'nova-gradient': 'linear-gradient(135deg, #7C3AED 0%, #00F5FF 100%)',
        'nova-gradient-text': 'linear-gradient(90deg, #7C3AED, #00F5FF)',
        // Dégradés de fondu pour les carousels
        'fade-left': 'linear-gradient(to right, #0A0A0A 0%, transparent 100%)',
        'fade-right': 'linear-gradient(to left, #0A0A0A 0%, transparent 100%)',
        'fade-bottom': 'linear-gradient(to top, #0A0A0A 0%, transparent 60%)',
        'fade-hero': 'linear-gradient(to right, #0A0A0A 30%, transparent 100%), linear-gradient(to top, #0A0A0A 0%, transparent 60%)',
      },
      boxShadow: {
        'nova': '0 0 20px rgba(124, 58, 237, 0.4)',
        'nova-lg': '0 0 40px rgba(124, 58, 237, 0.6)',
        'cyan': '0 0 20px rgba(0, 245, 255, 0.3)',
        'card': '0 8px 32px rgba(0, 0, 0, 0.8)',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.4s ease-out',
        'glow-pulse': 'glowPulse 2s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        glowPulse: {
          '0%, 100%': { boxShadow: '0 0 20px rgba(124, 58, 237, 0.4)' },
          '50%': { boxShadow: '0 0 40px rgba(124, 58, 237, 0.8)' },
        },
      },
      backdropBlur: {
        xs: '2px',
      },
    },
  },
  plugins: [],
}

export default config
