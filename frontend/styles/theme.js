// Theme configuration for BilBot application
// Centralized color definitions for consistent UI

const theme = {
  colors: {
    primary: {
      main: '#29ABE2',       // Azul principal
      light: '#5cc6ee',      // Azul claro (puedes ajustar)
      dark: '#1789b6',       // Azul oscuro (puedes ajustar)
      hover: '#1789b6',      // Hover azul oscuro
      contrast: '#FFFFFF'    // Blanco
    },
    secondary: {
      main: '#10B981',       // Emerald 500
      light: '#34D399',      // Emerald 400
      dark: '#059669',       // Emerald 600
      hover: '#047857',      // Emerald 700
      contrast: '#FFFFFF'    // White text on secondary
    },
    // UI colors
    background: {
      default: '#F3F4F6',    // Gray 100
      paper: '#FFFFFF',      // White
      card: '#FFFFFF',       // White
      sidebar: '#1E293B'     // Slate 800
    },
    text: {
      primary: '#1F2937',    // Gray 800
      secondary: '#6B7280',  // Gray 500
      disabled: '#9CA3AF',   // Gray 400
      hint: '#9CA3AF',       // Gray 400
      white: '#FFFFFF'       // White
    },
    // Status colors
    status: {
      success: '#10B981',    // Emerald 500
      error: '#EF4444',      // Red 500
      warning: '#F59E0B',    // Amber 500
      info: '#3B82F6'        // Blue 500
    },
    // Border colors
    border: {
      light: '#E5E7EB',      // Gray 200
      main: '#D1D5DB'        // Gray 300
    }
  },
  // Typography settings could be added here
  // Spacing, breakpoints and other theme properties could be added here
};

export default theme;
