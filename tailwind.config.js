/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        paper: { DEFAULT: '#FAF9F6', 2: '#F3F1EB', 3: '#ECE9E1' },
        night: { DEFAULT: '#0D0D11', 2: '#14141A', 3: '#1C1C24' },
        ink: { 900: '#1A1A1F', 600: '#55555F', 400: '#8A8A93' },
        accent: { DEFAULT: '#C2553B', soft: '#E9B9AA' },
        rule: 'rgb(26 26 31 / 0.09)',
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
        serif: ['"Instrument Serif"', 'ui-serif', 'Georgia', 'serif'],
      },
      keyframes: {
        pop: {
          '0%': { transform: 'scale(0)' },
          '70%': { transform: 'scale(1.25)' },
          '100%': { transform: 'scale(1)' },
        },
        fade: { from: { opacity: '0' }, to: { opacity: '1' } },
        rise: {
          from: { opacity: '0', transform: 'translateY(10px) scale(0.99)' },
          to: { opacity: '1', transform: 'none' },
        },
        slide: { from: { transform: 'translateX(100%)' }, to: { transform: 'none' } },
        flash: {
          '0%, 100%': { backgroundColor: 'transparent' },
          '25%': { backgroundColor: 'rgb(194 85 59 / 0.16)' },
        },
      },
      animation: {
        pop: 'pop 0.28s cubic-bezier(0.2, 0.8, 0.2, 1)',
        fade: 'fade 0.18s ease-out',
        rise: 'rise 0.24s cubic-bezier(0.2, 0.8, 0.2, 1)',
        slide: 'slide 0.28s cubic-bezier(0.2, 0.8, 0.2, 1)',
        flash: 'flash 1.8s ease-in-out',
      },
    },
  },
  plugins: [],
};
