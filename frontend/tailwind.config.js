export default {content: [
  './index.html',
  './src/**/*.{js,ts,jsx,tsx}'
],
  theme: {
    extend: {
      fontFamily: {
        sans: ['DM Sans', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        editorial: ['Newsreader', 'ui-serif', 'Georgia', 'serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      colors: {
        brand: {
          50: '#f7f3e8',
          100: '#f4d85a',
          200: '#e9a9c8',
          300: '#c9b9e8',
          400: '#a9c4d8',
          500: '#aeb77a',
          600: '#7f8950',
          700: '#5d6539',
          800: '#30331f',
          900: '#151515',
          950: '#0c0c0c',
        },
        ink: {
          DEFAULT: '#151515',
          muted: '#6f6b63',
          soft: '#98938a',
        },
        line: {
          DEFAULT: '#dfd9cb',
          strong: '#c9c1b1',
        },
        canvas: '#f7f3e8',
        pastel: {
          yellow: '#f4d85a',
          pink: '#e9a9c8',
          lavender: '#c9b9e8',
          olive: '#aeb77a',
          blue: '#a9c4d8',
        },
        status: {
          ok: '#166534',
          okbg: '#e8f3ec',
          warn: '#92500e',
          warnbg: '#fbf1e3',
          bad: '#9a2222',
          badbg: '#fbeceb',
          info: '#1d4e78',
          infobg: '#e9f1f8',
        },
      },
      borderRadius: {
        DEFAULT: '4px',
        md: '5px',
        lg: '6px',
        xl: '8px',
      },
      boxShadow: {
        panel: '0 1px 2px rgba(21, 21, 21, 0.05)',
        pop: '0 8px 24px rgba(21, 21, 21, 0.10)',
      },
      fontSize: {
        '2xs': ['11px', '15px'],
      },
    },
  },
}
