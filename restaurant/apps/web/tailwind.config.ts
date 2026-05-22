import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/**/*.{ts,tsx,js,jsx,mdx}',
    './messages/**/*.json',
  ],
  theme: {
    extend: {
      colors: {
        // Brand: deep burgundy red
        brand: {
          50: '#FCF4F4',
          100: '#F9E5E5',
          200: '#F3C7C7',
          300: '#E89898',
          400: '#DA6868',
          500: '#C8102E',
          600: '#A50B26',
          700: '#7E0A1F',
          800: '#5C0A18',
          900: '#3D0710',
          DEFAULT: '#C8102E',
        },
        // Warm amber/saffron accent
        accent: {
          50: '#FEF8EC',
          100: '#FCEEC9',
          200: '#F9DA8E',
          300: '#F5BF52',
          400: '#F4A623',
          500: '#E08A10',
          600: '#BB6A0C',
          700: '#95500E',
          800: '#763F11',
          900: '#5F3411',
          DEFAULT: '#F4A623',
        },
        cream: {
          50: '#FFFCF8',
          100: '#FAF6F1',
          200: '#F2EBE0',
          300: '#E6DAC7',
          400: '#D2BFA3',
          DEFAULT: '#FAF6F1',
        },
        charcoal: {
          50: '#F4F2F0',
          100: '#E2DDD8',
          300: '#9F968D',
          500: '#5E544A',
          700: '#3A332C',
          900: '#1A1612',
          DEFAULT: '#1A1612',
        },
      },
      fontFamily: {
        display: ['var(--font-display)', 'Georgia', 'serif'],
        sans: ['var(--font-body)', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        '4xl': '2rem',
      },
      boxShadow: {
        'soft': '0 10px 40px -10px rgba(58, 51, 44, 0.15)',
        'card': '0 4px 24px -8px rgba(58, 51, 44, 0.12)',
        'glow': '0 0 0 1px rgba(200, 16, 46, 0.15), 0 12px 36px -12px rgba(200, 16, 46, 0.35)',
      },
      backgroundImage: {
        'grain': "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' /%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.4'/%3E%3C/svg%3E\")",
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-out',
        'fade-in-up': 'fadeInUp 0.6s ease-out',
        'scale-in': 'scaleIn 0.3s ease-out',
      },
      keyframes: {
        fadeIn: {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        fadeInUp: {
          from: { opacity: '0', transform: 'translateY(20px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        scaleIn: {
          from: { opacity: '0', transform: 'scale(0.95)' },
          to: { opacity: '1', transform: 'scale(1)' },
        },
      },
    },
  },
  plugins: [],
};

export default config;
