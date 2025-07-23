/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{html,ts}"],
  theme: {
    extend: {
      colors: {
        // Colores que ya tenías definidos
        primary: {
          50: "#E5F1FF", 100: "#C7E1FF", 200: "#9ECBFF", 300: "#75B5FF",
          400: "#4D9FFF", 500: "#2489FF", 600: "#0073FA", 700: "#0055B8",
          800: "#00428F", 900: "#002F66", 950: "#001C3D",
        },
        secondary: {
          50: "#FFF3E5", 100: "#FFE5C7", 200: "#FFD29E", 300: "#FFBF75",
          400: "#FFAD4D", 500: "#FF9A24", 600: "#FA8600", 700: "#D17100",
          800: "#A85B00", 900: "#804500", 950: "#472700",
        },
        gray: {
          50: "#F9FAFB", 100: "#F3F4F6", 200: "#E5E7EB", 300: "#D1D5DB",
          400: "#9CA3AF", 500: "#6B7280", 600: "#4B5563", 700: "#374151",
          800: "#1F2937", 900: "#111827", 950: "#030712",
        },
        green: {
          50: "#F0FDF4", 100: "#DCFCE7", 200: "#bbf7d0", 300: "#86efac",
          400: "#4ade80", 500: "#22c55e", 600: "#16a34a", 700: "#15803d",
          800: "#166534", 900: "#14532d", 950: "#052E16",
        },
        sky: {
          50: "#F0F9FF", 100: "#E0F2FE", 200: "#BAE6FD", 300: "#7DD3FC",
          400: "#38BDF8", 500: "#0EA5E9", 600: "#0284C7", 700: "#0369A1",
          800: "#075985", 900: "#0C4A6E", 950: "#082F49",
        },
        yellow: {
          50: "#FEFCE8", 100: "#FEF9C3", 200: "#FEF08A", 300: "#FDE047",
          400: "#FACC15", 500: "#EAB308", 600: "#CA8A04", 700: "#A16207",
          800: "#854D0E", 900: "#713F12", 950: "#422006",
        },
        red: {
          50: "#FEF2F2", 100: "#FEE2E2", 200: "#FECACA", 300: "#FCA5A5",
          400: "#F87171", 500: "#EF4444", 600: "#DC2626", 700: "#B91C1C",
          800: "#991B1B", 900: "#7F1D1D", 950: "#450A0A",
        },
        indigo: {
          50: "#EEF2FF", 100: "#E0E7FF", 200: "#C7D2FE", 300: "#A5B4FC",
          400: "#818CF8", 500: "#6366F1", 600: "#4F46E5", 700: "#4338CA",
          800: "#3730A3", 900: "#312E81", 950: "#1E1B4B",
        },
        bgligth: "#F3EDE5",
        bgdark: "#2A2826",
        bgbluegray: '#E2E8F0',
        bgZinc: '#34C0C8',
        bgDarkZinc: '#1a848a',

        // **Nuevos colores personalizados de la migración anterior**
        'dark-blue-bg': '#0f0f23',
        'medium-blue-bg': '#1a1a2e',
        'light-blue-bg': '#16213e',
        'purple-start': '#667eea',
        'purple-end': '#764ba2',
        'pink-end': '#ff4ba2',
        'fuchsia-end': '#f093fb',
        'gray-text-dark': '#333',
        'gray-text-medium': '#666',
        'dark-blue-bg': '#0A192F', // Asegúrate de definir tus colores personalizados
        'medium-blue-bg': '#102A43',
        'light-blue-bg': '#334E68',
        'purple-start': '#667eea',
        'purple-end': '#764ba2',
        'pink-end': '#EE99C2', // Si usas pink-end en algún lugar
        'gray-text-dark': '#333',
        'gray-text-medium': '#666',
      },
      fontFamily: {
        // **Nuevas fuentes personalizadas**
        inter: ['Inter', 'Arial', 'sans-serif'],
        montserrat: ['Montserrat', 'sans-serif'],
      },
      spacing: {
        // **Nuevos espaciados personalizados**
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
        // **Nuevos breakpoints personalizados (o sobrescritos)**
        // Tus breakpoints: mobile: 768px, tablet: 1200px
        // Mantendré los de Tailwind y agregaré el `xl` como tu "tablet-breakpoint" si no existe.
        // Si ya tienes 'md' y 'lg' definidos, no los sobrescribiremos a menos que los tuyos sean diferentes.
        // Tailwind defaults: sm: 640px, md: 768px, lg: 1024px, xl: 1280px, 2xl: 1536px
        // Vamos a usar 'md' para tu $mobile-breakpoint (768px)
        // y 'xl' para tu $tablet-breakpoint (1200px)
        'md': '768px',  // Sobrescribe el 'md' de Tailwind para que coincida con tu $mobile-breakpoint
        'xl': '1200px', // Agrega tu $tablet-breakpoint como 'xl' (si no existe o es diferente)
        // Puedes dejar los demás (sm, lg, 2xl) si quieres los valores por defecto de Tailwind.
      },
      gridTemplateColumns: {
        // **Nuevos grids personalizados**
        'auto-fit-minmax-280': 'repeat(auto-fit, minmax(280px, 1fr))',
        'auto-fit-minmax-220': 'repeat(auto-fit, minmax(220px, 1fr))',
      },
      keyframes: {
        // **Keyframes existentes**
        "fade-in": {
          "0%": { opacity: 0 },
          "100%": { opacity: 1 },
        },
        flip: {
          "0%": { transform: "rotateY(0deg)" },
          "100%": { transform: "rotateY(360deg)" },
        },
        "flip-back": {
          "0%": { transform: "rotateY(180deg)" },
          "100%": { transform: "rotateY(0deg)" },
        },
        'slide-in-right': {
          '0%': { transform: 'translateX(100%)', opacity: 0 },
          '100%': { transform: 'translateX(0)', opacity: 1 },
        },
        'slide-out-left': {
          '0%': { transform: 'translateX(0)', opacity: 1 },
          '100%': { transform: 'translateX(-100%)', opacity: 0 },
        },
      },
      animation: {
        // **Animaciones existentes**
        "fade-in": "fade-in 0.5s ease-in-out",
        flip: "flip 0.6s ease-in-out forwards",
        "flip-back": "flip-back 0.6s ease-in-out forwards",
        'slide-in-right': 'slide-in-right 0.6s ease-in-out forwards',
        'slide-out-left': 'slide-out-left 0.6s ease-in-out forwards',
      },
      screens: {
        'md': '769px', // Tu $mobile-breakpoint + 1px
        'xl': '1201px', // Tu $tablet-breakpoint + 1px (para que se apliquen los estilos por encima de 1200px)
        // Puedes añadir un breakpoint 'lg' si necesitas algo entre md y xl
        // 'lg': '1024px', // Ejemplo
      },
      boxShadow: {
        '2xl-purple': '0 20px 40px rgba(102, 126, 234, 0.3)', // Para el hover del cta-button
      },
    },
  },
  plugins: [],
  darkMode: ["class"],
}