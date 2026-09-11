/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Design Tokens
        themeApp: 'rgb(var(--token-bg-app) / <alpha-value>)',
        themePanel: 'rgb(var(--token-bg-panel) / <alpha-value>)',
        themeCard: 'rgb(var(--token-bg-card) / <alpha-value>)',
        themeBtn: 'rgb(var(--token-bg-btn) / <alpha-value>)',
        themeBtnHover: 'rgb(var(--token-bg-btn-hover) / <alpha-value>)',
        themeBtnActive: 'rgb(var(--token-bg-btn-active) / <alpha-value>)',
        themeText: 'rgb(var(--token-text-primary) / <alpha-value>)',
        themeMuted: 'rgb(var(--token-text-muted) / <alpha-value>)',
        themeDim: 'rgb(var(--token-text-dim) / <alpha-value>)',
        themeActive: 'rgb(var(--token-text-active) / <alpha-value>)',
        themeBorder: 'rgb(var(--token-border) / <alpha-value>)',
        themeBorderHover: 'rgb(var(--token-border-hover) / <alpha-value>)',
        themeBorderActive: 'rgb(var(--token-border-active) / <alpha-value>)',

        // 兼容原有的类名映射，平滑过渡并完整保留透明度支持
        border: 'rgb(var(--token-border) / <alpha-value>)',
        panel: 'rgb(var(--token-bg-panel) / <alpha-value>)',
        panelSub: 'rgb(var(--token-bg-card) / <alpha-value>)',
        surface: 'rgb(var(--token-bg-app) / <alpha-value>)',
        surfaceElevated: 'rgb(var(--token-bg-card) / <alpha-value>)',
        accent: '#3b82f6',
      },
      fontFamily: {
        sans: [
          '-apple-system',
          'BlinkMacSystemFont',
          '"PingFang SC"',
          '"Hiragino Sans GB"',
          '"Microsoft YaHei"',
          'sans-serif',
        ],
      },
    },
  },
  plugins: [],
};
