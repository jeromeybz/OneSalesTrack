/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{vue,js}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Geist"', '"DM Sans"', 'sans-serif'],
        mono: ['"DM Sans"', 'sans-serif'],
      },
      colors: {
        // Semantic tokens — map to CSS vars in main.css
        background:  'hsl(var(--background))',
        foreground:  'hsl(var(--foreground))',
        surface:     'hsl(var(--surface))',
        'surface-2': 'hsl(var(--surface-2))',
        border:      'hsl(var(--border))',
        'border-2':  'hsl(var(--border-2))',
        muted:       'hsl(var(--muted))',
        'muted-fg':  'hsl(var(--muted-fg))',
        primary:     'hsl(var(--primary))',
        'primary-fg':'hsl(var(--primary-fg))',

        // Status colors — same in both modes
        success: '#22c55e',
        danger:  '#ef4444',
        warning: '#f59e0b',
        info:    '#3b82f6',
      },
      borderRadius: {
        sm: '0.375rem',
        md: '0.5rem',
        lg: '0.75rem',
        xl: '1rem',
      },
      boxShadow: {
        sm:  '0 1px 2px 0 rgb(0 0 0 / 0.05)',
        md:  '0 4px 6px -1px rgb(0 0 0 / 0.1)',
        lg:  '0 10px 15px -3px rgb(0 0 0 / 0.1)',
        xl:  '0 20px 25px -5px rgb(0 0 0 / 0.15)',
      },
    },
  },
  plugins: [require('@tailwindcss/forms')],
}