/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        cyber: {
          primary: '#00D9FF',
          success: '#00FF85',
          danger: '#FF006E',
          background: '#0A0E1A',
          panel: '#111827',
          border: '#1E3A5F',
        },
      },
      fontFamily: {
        heading: ['Orbitron', 'sans-serif'],
        code: ['Fira Code', 'monospace'],
        body: ['Inter', 'sans-serif'],
      },
      boxShadow: {
        glow: '0 0 10px rgba(0, 217, 255, 0.5)',
        'glow-green': '0 0 10px rgba(0, 255, 133, 0.5)',
        'glow-pink': '0 0 10px rgba(255, 0, 110, 0.5)',
      },
    },
  },
  plugins: [],
};
