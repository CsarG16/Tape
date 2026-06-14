/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx,html}",
  ],
  theme: {
    extend: {
      colors: {
        'palo-rosa': {
          50:  '#FEFDFE',
          100: '#FCF1F2',
          200: '#FDE5E6',
          300: '#F9DADD',
          400: '#EEB6BB',
          500: '#CA7C83',
          600: '#B56A72',
          700: '#9E5960',
          800: '#7C474E',
        },
        'neutral-soft': {
          100: '#F5F5F5',
          300: '#D9D9D9',
          500: '#ADADAD',
          700: '#6B6B6B',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        handwritten: ['Dancing Script', 'cursive'],
        handwritten2: ['Caveat', 'cursive'],
      },
      animation: {
        'spin-slow': 'spin 20s linear infinite',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      }
    },
  },
  plugins: [],
}


