/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        /* BunkBuddies-inspired light theme */
        bb: {
          bg: '#FDEBD3',
          green: '#00D09C',
          purple: '#B794F6',
          coral: '#FF6B6B',
          orange: '#FB923C',
          text: '#111111',
          'text-light': '#555555',
          border: '#111111',
        },
        /* Dark theme (Connect page) */
        brand: {
          bg: '#080D19',
          card: '#0F1629',
          chat: '#0A1020',
          elevated: '#141B2D',
          border: '#1C2A3A',
          'border-hover': '#2A3A4A',
          accent: '#00D09C',
          'accent-hover': '#00E6AC',
          'accent-dim': '#00A87D',
          red: '#FF3B3B',
          'red-hover': '#FF5252',
          success: '#00D09C',
          warning: '#FFB020',
          danger: '#FF4757',
          'text-primary': '#FFFFFF',
          'text-secondary': '#8B9DC3',
          'text-muted': '#4A5F80',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'bounce-slow': 'bounce 2s infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
        'slide-up': 'slideUp 0.3s ease-out',
        'slide-down': 'slideDown 0.3s ease-out',
        'fade-in': 'fadeIn 0.5s ease-out',
        'scroll-x': 'scroll-x 25s linear infinite',
      },
      keyframes: {
        glow: {
          '0%': { boxShadow: '0 0 5px rgba(0, 208, 156, 0.4)' },
          '100%': { boxShadow: '0 0 20px rgba(0, 208, 156, 0.7)' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideDown: {
          '0%': { transform: 'translateY(-10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'scroll-x': {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-50%)' },
        },
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
      },
    },
  },
  plugins: [],
};
