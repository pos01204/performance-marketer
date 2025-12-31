/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./App.tsx",
    "./index.tsx",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./store/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class', // 다크 모드 클래스 기반 전환
  theme: {
    extend: {
      fontFamily: {
        'suite': ['SUITE Variable', 'Pretendard', '-apple-system', 'BlinkMacSystemFont', 'system-ui', 'sans-serif'],
      },
      colors: {
        // idus 브랜드 컬러
        brand: {
          orange: '#FF6B35',
          'orange-light': '#FF8C5A',
          'orange-dark': '#E55A2B',
          black: '#1A1A1A',
        },
        // 라이트 모드 배경 (기본)
        surface: {
          DEFAULT: '#FAFBFC',
          raised: '#FFFFFF',
          overlay: '#F3F4F6',
          card: '#FFFFFF',
        },
        // 라이트 모드 테두리
        border: {
          DEFAULT: 'rgba(0, 0, 0, 0.08)',
          hover: 'rgba(0, 0, 0, 0.15)',
          active: 'rgba(255, 107, 53, 0.5)',
        },
        // 라이트 모드 텍스트
        text: {
          primary: '#111827',
          secondary: '#6B7280',
          muted: '#9CA3AF',
          disabled: '#D1D5DB',
        },
        // 다크 모드 전용 컬러
        dark: {
          surface: '#0A0E17',
          'surface-raised': '#111827',
          'surface-overlay': '#1F2937',
          'surface-card': '#161B26',
          border: 'rgba(255, 255, 255, 0.08)',
          'border-hover': 'rgba(255, 255, 255, 0.15)',
          'text-primary': '#FFFFFF',
          'text-secondary': '#9CA3AF',
          'text-muted': '#6B7280',
        },
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-out',
        'fade-in-up': 'fadeInUp 0.4s ease-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'slide-down': 'slideDown 0.3s ease-out',
        'scale-in': 'scaleIn 0.2s ease-out',
        'pulse-soft': 'pulseSoft 2s ease-in-out infinite',
        'shimmer': 'shimmer 2s linear infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideDown: {
          '0%': { transform: 'translateY(-10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        pulseSoft: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.7' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'shimmer': 'linear-gradient(90deg, transparent, rgba(0,0,0,0.04), transparent)',
        'shimmer-dark': 'linear-gradient(90deg, transparent, rgba(255,255,255,0.08), transparent)',
      },
      boxShadow: {
        'soft': '0 2px 8px rgba(0, 0, 0, 0.04), 0 4px 16px rgba(0, 0, 0, 0.04)',
        'medium': '0 4px 12px rgba(0, 0, 0, 0.08), 0 8px 24px rgba(0, 0, 0, 0.06)',
        'brand': '0 4px 14px rgba(255, 107, 53, 0.25)',
      },
    },
  },
  plugins: [],
}
