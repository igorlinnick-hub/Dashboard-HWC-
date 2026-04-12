import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        surface: {
          DEFAULT: 'var(--surface)',
          card:    'var(--surface-card)',
          hover:   'var(--surface-hover)',
          border:  'var(--surface-border)',
          subtle:  'var(--surface-subtle)',
        },
        accent: {
          DEFAULT: 'var(--accent)',
          hover:   'var(--accent-hover)',
          muted:   'var(--accent-muted)',
          glow:    'var(--accent-glow)',
        },
        text: {
          primary:   'var(--text-primary)',
          secondary: 'var(--text-secondary)',
          muted:     'var(--text-muted)',
        },
      },
      keyframes: {
        shimmer: {
          '0%':   { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        'fade-in': {
          '0%':   { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'slide-up': {
          '0%':   { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        shake: {
          '0%, 100%': { transform: 'rotate(0deg)' },
          '15%':      { transform: 'rotate(-12deg)' },
          '30%':      { transform: 'rotate(12deg)' },
          '45%':      { transform: 'rotate(-8deg)' },
          '60%':      { transform: 'rotate(8deg)' },
          '75%':      { transform: 'rotate(-4deg)' },
          '90%':      { transform: 'rotate(4deg)' },
        },
      },
      animation: {
        shimmer:    'shimmer 2s infinite linear',
        'fade-in':  'fade-in 0.4s ease-out forwards',
        'slide-up': 'slide-up 0.3s ease-out forwards',
        shake:      'shake 0.6s ease-in-out',
      },
    },
  },
  plugins: [],
};

export default config;
