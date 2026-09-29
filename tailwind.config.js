/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        serif: ['"Fraunces"', 'Georgia', 'serif'],
        sans: ['"Plus Jakarta Sans"', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      colors: {
        parchment: {
          DEFAULT: '#F4EFE6',
          deep: '#EAE2D3',
          card: '#FAF7F2',
          border: '#D5CBB8',
        },
        ink: {
          DEFAULT: '#1C1916',
          muted: '#575047',
          faint: '#8A8175',
        },
        terracotta: {
          DEFAULT: '#B84A27',
          dark: '#93381B',
          light: '#F5E1DA',
        },
        cypress: {
          DEFAULT: '#284634',
          light: '#E2ECE5',
        },
        brass: {
          DEFAULT: '#947134',
          light: '#F4ECD9',
        }
      },
    },
  },
  plugins: [],
};
