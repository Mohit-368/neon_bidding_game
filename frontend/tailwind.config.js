/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['Space Grotesk', 'sans-serif'],
        sans: ['Inter', 'sans-serif']
      },
      colors: {
        ink: '#070a12',
        panel: '#0d1422',
        line: '#1c2a3d',
        cyan: '#59e4f4',
        violet: '#a78bfa',
        amber: '#f6bd60'
      },
      boxShadow: {
        glow: '0 0 32px rgba(89, 228, 244, .12)',
        violetGlow: '0 0 36px rgba(167, 139, 250, .15)'
      }
    }
  },
  plugins: []
};
