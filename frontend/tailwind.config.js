module.exports = {
  content: [
    './src/templates/**/*.html',
    './src/locales/**/*.json',
    './src/js/**/*.js'
  ],
  theme: {
    extend: {
      fontFamily: {
        display: ['"Instrument Sans"', 'sans-serif'],
        sans: ['"Instrument Sans"', 'sans-serif']
      },
      boxShadow: {
        soft: '0 24px 60px rgba(15, 15, 17, 0.08)',
        crisp: '0 12px 28px rgba(15, 15, 17, 0.06)'
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translate3d(0, 0, 0) scale(1)' },
          '50%': { transform: 'translate3d(0, -10px, 0) scale(1.015)' }
        },
        rise: {
          '0%': { opacity: '0', transform: 'translate3d(0, 20px, 0)' },
          '100%': { opacity: '1', transform: 'translate3d(0, 0, 0)' }
        },
        breathe: {
          '0%, 100%': { opacity: '0.55', transform: 'scale(1)' },
          '50%': { opacity: '0.82', transform: 'scale(1.04)' }
        }
      },
      animation: {
        float: 'float 12s ease-in-out infinite',
        rise: 'rise 900ms cubic-bezier(0.2, 0.8, 0.2, 1) both',
        breathe: 'breathe 9s ease-in-out infinite'
      }
    }
  },
  plugins: []
};
