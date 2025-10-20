/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{html,ts}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: { 
          50: "#E5F1FF", 
          100: "#C7E1FF", 
          200: "#9ECBFF", 
          300: "#75B5FF", 
          400: "#4D9FFF", 
          500: "#2489FF", 
          600: "#0073FA", 
          700: "#0055B8", 
          800: "#00428F", 
          900: "#002F66", 
          950: "#001C3D" 
        },
        secondary: { 
          50: "#FFF3E5", 
          100: "#FFE5C7", 
          200: "#FFD29E", 
          300: "#FFBF75", 
          400: "#FFAD4D", 
          500: "#FF9A24", 
          600: "#FA8600", 
          700: "#D17100", 
          800: "#A85B00", 
          900: "#804500", 
          950: "#472700" 
        },
        gray: { 
          50: "#F9FAFB", 
          100: "#F3F4F6", 
          200: "#E5E7EB", 
          300: "#D1D5DB", 
          400: "#9CA3AF", 
          500: "#6B7280", 
          600: "#4B5563", 
          700: "#374151", 
          800: "#1F2937", 
          900: "#111827", 
          950: "#030712" 
        },
        green: { 
          50: "#F0FDF4", 
          100: "#DCFCE7", 
          200: "#bbf7d0", 
          300: "#86efac", 
          400: "#4ade80", 
          500: "#22c55e", 
          600: "#16a34a", 
          700: "#15803d", 
          800: "#166534", 
          900: "#14532d", 
          950: "#052E16" 
        },
        sky: { 
          50: "#F0F9FF", 
          100: "#E0F2FE", 
          200: "#BAE6FD", 
          300: "#7DD3FC", 
          400: "#38BDF8", 
          500: "#0EA5E9", 
          600: "#0284C7", 
          700: "#0369A1", 
          800: "#075985", 
          900: "#0C4A6E", 
          950: "#082F49" 
        },
        yellow: { 
          50: "#FEFCE8", 
          100: "#FEF9C3", 
          200: "#FEF08A", 
          300: "#FDE047", 
          400: "#FACC15", 
          500: "#EAB308", 
          600: "#CA8A04", 
          700: "#A16207", 
          800: "#854D0E", 
          900: "#713F12", 
          950: "#422006" 
        },
        red: { 
          50: "#FEF2F2", 
          100: "#FEE2E2", 
          200: "#FECACA", 
          300: "#FCA5A5", 
          400: "#F87171", 
          500: "#EF4444", 
          600: "#DC2626", 
          700: "#B91C1C", 
          800: "#991B1B", 
          900: "#7F1D1D", 
          950: "#450A0A" 
        },
        indigo: { 
          50: "#EEF2FF", 
          100: "#E0E7FF", 
          200: "#C7D2FE", 
          300: "#A5B4FC", 
          400: "#818CF8", 
          500: "#6366F1", 
          600: "#4F46E5", 
          700: "#4338CA", 
          800: "#3730A3", 
          900: "#312E81", 
          950: "#1E1B4B" 
        },
        bgligth: "#F3EDE5",
        bgdark: "#2A2826",
        bgbluegray: '#E2E8F0',
        bgZinc: '#34C0C8',
        bgDarkZinc: '#1a848a',

        // Colores personalizados
        'dark-blue-bg': '#0A192F',
        'medium-blue-bg': '#102A43',
        'light-blue-bg': '#334E68',
        'purple-start': '#667eea',
        'purple-end': '#764ba2',
        'pink-end': '#EE99C2',
        'fuchsia-end': '#f093fb',
        'gray-text-dark': '#333',
        'gray-text-medium': '#666',
      },
      fontFamily: {
        inter: ['Inter', 'Arial', 'sans-serif'],
        montserrat: ['Montserrat', 'sans-serif'],
      },
      spacing: {
        '15': '3.75rem', 
        '20': '5rem', 
        '30': '7.5rem', 
        '40': '10rem', 
        '50': '12.5rem',
        '60': '15rem', 
        '80': '20rem', 
        '100': '25rem', 
        '150': '37.5rem', 
        '200': '50rem',
      },
      screens: {
        'sm': '640px',
        'md': '769px',
        'lg': '1024px',
        'xl': '1201px',
        '2xl': '1536px',
      },
      gridTemplateColumns: {
        'auto-fit-minmax-280': 'repeat(auto-fit, minmax(280px, 1fr))',
        'auto-fit-minmax-220': 'repeat(auto-fit, minmax(220px, 1fr))',
        'auto-fit-minmax-250': 'repeat(auto-fit, minmax(250px, 1fr))',
        'auto-fit-minmax-300': 'repeat(auto-fit, minmax(300px, 1fr))',
      },
      keyframes: {
        "fade-in": { 
          "0%": { opacity: 0 }, 
          "100%": { opacity: 1 } 
        },
        "fade-out": { 
          "0%": { opacity: 1 }, 
          "100%": { opacity: 0 } 
        },
        "fade-in-up": {
          "0%": { opacity: 0, transform: "translateY(20px)" },
          "100%": { opacity: 1, transform: "translateY(0)" }
        },
        "fade-in-down": {
          "0%": { opacity: 0, transform: "translateY(-20px)" },
          "100%": { opacity: 1, transform: "translateY(0)" }
        },
        "zoom-in": {
          "0%": { opacity: 0, transform: "scale(0.5)" },
          "100%": { opacity: 1, transform: "scale(1)" }
        },
        flip: { 
          "0%": { transform: "rotateY(0deg)" }, 
          "100%": { transform: "rotateY(360deg)" } 
        },
        "flip-back": { 
          "0%": { transform: "rotateY(180deg)" }, 
          "100%": { transform: "rotateY(0deg)" } 
        },
        'slide-in-right': { 
          '0%': { transform: 'translateX(100%)', opacity: 0 }, 
          '100%': { transform: 'translateX(0)', opacity: 1 } 
        },
        'slide-out-left': { 
          '0%': { transform: 'translateX(0)', opacity: 1 }, 
          '100%': { transform: 'translateX(-100%)', opacity: 0 } 
        },
        'slide-in-left': { 
          '0%': { transform: 'translateX(-100%)', opacity: 0 }, 
          '100%': { transform: 'translateX(0)', opacity: 1 } 
        },
        'slide-out-right': { 
          '0%': { transform: 'translateX(0)', opacity: 1 }, 
          '100%': { transform: 'translateX(100%)', opacity: 0 } 
        },
        'bounce-in': {
          '0%': { transform: 'scale(0.3)', opacity: 0 },
          '50%': { transform: 'scale(1.05)', opacity: 0.8 },
          '100%': { transform: 'scale(1)', opacity: 1 }
        },
        'pulse-soft': {
          '0%, 100%': { opacity: 1 },
          '50%': { opacity: 0.7 }
        }
      },
      animation: {
        "fade-in": "fade-in 0.5s ease-in-out",
        "fade-out": "fade-out 0.5s ease-in-out",
        "fade-in-up": "fade-in-up 0.6s ease-out",
        "fade-in-down": "fade-in-down 0.6s ease-out",
        "zoom-in": "zoom-in 0.4s ease-out",
        "flip": "flip 0.6s ease-in-out forwards",
        "flip-back": "flip-back 0.6s ease-in-out forwards",
        'slide-in-right': 'slide-in-right 0.6s ease-in-out forwards',
        'slide-out-left': 'slide-out-left 0.6s ease-in-out forwards',
        'slide-in-left': 'slide-in-left 0.6s ease-in-out forwards',
        'slide-out-right': 'slide-out-right 0.6s ease-in-out forwards',
        'bounce-in': 'bounce-in 0.8s ease-out',
        'pulse-soft': 'pulse-soft 2s infinite',
      },
      boxShadow: {
        'sm': '0 1px 2px 0 rgb(0 0 0 / 0.05)',
        'DEFAULT': '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
        'md': '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
        'lg': '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
        'xl': '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
        '2xl': '0 25px 50px -12px rgb(0 0 0 / 0.25)',
        'inner': 'inset 0 2px 4px 0 rgb(0 0 0 / 0.05)',
        '2xl-purple': '0 20px 40px rgba(102, 126, 234, 0.3)',
        '2xl-blue': '0 20px 40px rgba(37, 99, 235, 0.3)',
        '3xl': '0 35px 60px -15px rgba(0, 0, 0, 0.3)',
        'active-link-shadow': '0 4px 10px rgba(0, 0, 0, 0.2)',
        'glass': '0 8px 32px 0 rgba(31, 38, 135, 0.37)',
        'neumorphism': '5px 5px 10px #d1d9e6, -5px -5px 10px #ffffff',
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
        'services-title-gradient': 'linear-gradient(to right, var(--tw-gradient-stops))',
        'purple-pink-gradient': 'linear-gradient(to right, #667eea, #ee99c2)',
        'blue-gradient': 'linear-gradient(to right, #2489FF, #0073FA)',
        'dark-gradient': 'linear-gradient(to right, #0A192F, #334E68)',
      },
      backdropBlur: {
        'xs': '2px',
      },
      transitionProperty: {
        'height': 'height',
        'spacing': 'margin, padding',
        'transform': 'transform',
      },
      zIndex: {
        '60': '60',
        '70': '70',
        '80': '80',
        '90': '90',
        '100': '100',
      },
    },
  },
  plugins: [
    function({ addUtilities, theme }) {
      addUtilities({
        // Para el gradiente del nombre de la compañía
        '.company-name-gradient': {
          'background-image': 'linear-gradient(to right, ' + theme('colors.purple-start') + ', ' + theme('colors.pink-end') + ')',
          '-webkit-background-clip': 'text',
          '-webkit-text-fill-color': 'transparent',
          'background-clip': 'text',
          'color': 'transparent',
        },
        // Para el título de servicios
        '.services-title-gradient-text': {
          'background-image': 'linear-gradient(to right, ' + theme('colors.purple.500') + ', ' + theme('colors.pink.500') + ')',
          '-webkit-background-clip': 'text',
          '-webkit-text-fill-color': 'transparent',
          'background-clip': 'text',
          'color': 'transparent',
        },
        // Clases para el active-link
        '.active-link-style': {
          'color': theme('colors.white') + ' !important',
          'border': '1px solid ' + theme('colors.purple-start') + ' !important',
          'background-color': theme('colors.purple-start') + ' !important',
          'transform': 'translateY(-0.125rem)',
          'box-shadow': theme('boxShadow.active-link-shadow'),
        },
        // Overlay de fondo radial
        '.radial-gradient-overlay': {
          'background': 'radial-gradient(circle at top right, rgba(102, 126, 234, 0.1), transparent 50%), radial-gradient(circle at bottom left, rgba(238, 153, 194, 0.1), transparent 50%)',
        },
        // Utilidades específicas para el carousel
        '.carousel-image-contain': {
          'object-fit': 'contain !important',
          'width': 'auto !important',
          'height': 'auto !important',
          'max-width': '100%',
          'max-height': '100%',
        },
        // Efectos glassmorphism
        '.backdrop-blur-glass': {
          'backdrop-filter': 'blur(10px)',
          'background': 'rgba(255, 255, 255, 0.1)',
        },
        '.backdrop-blur-dark': {
          'backdrop-filter': 'blur(10px)',
          'background': 'rgba(0, 0, 0, 0.2)',
        },
        // Utilidades de texto
        '.text-shadow-sm': {
          'text-shadow': '0 1px 2px rgba(0, 0, 0, 0.1)',
        },
        '.text-shadow-md': {
          'text-shadow': '0 2px 4px rgba(0, 0, 0, 0.1)',
        },
        '.text-shadow-lg': {
          'text-shadow': '0 4px 8px rgba(0, 0, 0, 0.12)',
        },
        '.text-shadow-none': {
          'text-shadow': 'none',
        },
        // Utilidades de scroll
        '.scrollbar-hide': {
          '-ms-overflow-style': 'none',
          'scrollbar-width': 'none',
          '&::-webkit-scrollbar': {
            display: 'none',
          },
        },
        '.scrollbar-thin': {
          'scrollbar-width': 'thin',
          'scrollbar-color': theme('colors.primary.400') + ' transparent',
          '&::-webkit-scrollbar': {
            width: '8px',
          },
          '&::-webkit-scrollbar-track': {
            background: 'transparent',
          },
          '&::-webkit-scrollbar-thumb': {
            backgroundColor: theme('colors.primary.400'),
            borderRadius: '20px',
          },
        },
        // Utilidades de transform
        '.preserve-3d': {
          'transform-style': 'preserve-3d',
        },
        '.backface-hidden': {
          'backface-visibility': 'hidden',
        },
        // Utilidades de selección
        '.selection-primary': {
          '&::selection': {
            'background-color': theme('colors.primary.200'),
            'color': theme('colors.primary.900'),
          },
        },
        // Utilidades de focus
        '.focus-ring-primary': {
          '&:focus': {
            'outline': '2px solid ' + theme('colors.primary.500'),
            'outline-offset': '2px',
          },
        },
      }, ['responsive', 'hover', 'focus', 'active']);
    }
  ],
};