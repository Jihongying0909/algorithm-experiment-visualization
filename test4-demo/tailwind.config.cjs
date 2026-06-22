module.exports = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        page: '#F5F7FB',
        card: '#FFFFFF',
        borderSoft: '#E2E8F0',
        textMain: '#0F172A',
        textSub: '#64748B',
        brand: '#06B6D4',
      },
      boxShadow: {
        soft: '0 12px 30px rgba(15,23,42,0.06)',
      },
      borderRadius: {
        '2xl': '1rem',
      },
    },
  },
  plugins: [],
};
