/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        well: '#0B3142',
        river: '#1C6E8C',
        shallow: '#A6D8D4',
        drought: '#C1440E',
        paper: '#F4F6F5',
        ink: '#14211F',
      },
      fontFamily: {
        display: ['Space Grotesk', 'sans-serif'],
        serif: ['Source Serif 4', 'serif'],
        mono: ['IBM Plex Mono', 'monospace'],
      },
    },
  },
  plugins: [],
}
