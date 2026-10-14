/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#FAF8FA',  // Soft silk paper canvas
          100: '#F4EFF5', // Light card tint
          200: '#E8E1EA', // Hairline borders
          300: '#D5C9D8', // Input borders & soft dividers
          400: '#9F8FA3', // Muted secondary text
          500: '#6E5D73', // Rich velvet slate
          600: '#534757', // Interactive button hover
          700: '#463C4A', // Elevated dark surface
          800: '#39333B', // Exact user-requested hero color
          900: '#2A252C', // Deep executive sidebar & card
          950: '#1D191E', // Darkest obsidian anchor
        },
        champagne: {
          50: '#FAF7F2',
          100: '#F3ECE1',
          400: '#D4AF37',
          500: '#C5A880',
          600: '#A98960',
        }
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'Inter', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      }
    },
  },
  plugins: [],
}
