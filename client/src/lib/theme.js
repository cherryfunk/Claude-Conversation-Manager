// Global design tokens - SINGLE source of truth for all visual parameters
// These values are injected as CSS variables on :root (see injectThemeVars)
// and used by all components via the theme object.

const theme = {
  // Glass effect (applies to ALL panels, buttons, controls, nodes)
  glass: {
    blur: 4,                              // px - backdrop blur
    panelBg: 'rgba(15,15,20,0.3)',        // panel/sidebar background
    buttonBg: 'rgba(255,255,255,0.06)',   // button background
    borderColor: 'rgba(255,255,255,0.08)', // shared border color
  },

  // Conversation node bars
  node: {
    accentBlue: '59,130,246',
    accentPurple: '168,85,247',
    accentIndigo: '99,102,241',
    fillOpacity: 0.18,
    borderOpacity: 0.35,
    selectedFillOpacity: 0.35,
    selectedBorderOpacity: 0.7,
  },

  // Text
  text: {
    primary: '#fff',
    secondary: 'rgba(255,255,255,0.8)',
    muted: 'rgba(255,255,255,0.55)',
    dimmed: 'rgba(255,255,255,0.35)',
    shadow: '0 1px 3px rgba(0,0,0,0.5)',
    shadowLight: '0 1px 2px rgba(0,0,0,0.3)',
  },

  // Canvas
  canvas: {
    background: '#0f0f14',
    gridColor: 'rgba(255,255,255,0.03)',
  },

  // Minimap
  minimap: {
    maskColor: 'rgba(0,0,0,0.6)',
  },
}

// Helper: backdrop-filter style object
export function glassBlur() {
  return {
    backdropFilter: `blur(${theme.glass.blur}px)`,
    WebkitBackdropFilter: `blur(${theme.glass.blur}px)`,
  }
}

// Helper: full panel glass style
export function panelStyle() {
  return {
    background: theme.glass.panelBg,
    ...glassBlur(),
    border: `1px solid ${theme.glass.borderColor}`,
  }
}

// Helper: button glass style
export function buttonStyle() {
  return {
    background: theme.glass.buttonBg,
    ...glassBlur(),
    border: `1px solid ${theme.glass.borderColor}`,
    color: theme.text.secondary,
  }
}

// Inject CSS variables onto :root so CSS (index.css) uses the same values.
// Call this once at app startup.
export function injectThemeVars() {
  const root = document.documentElement
  root.style.setProperty('--glass-blur', `blur(${theme.glass.blur}px)`)
  root.style.setProperty('--glass-panel-bg', theme.glass.panelBg)
  root.style.setProperty('--glass-button-bg', theme.glass.buttonBg)
  root.style.setProperty('--glass-border', theme.glass.borderColor)
  root.style.setProperty('--text-secondary', theme.text.secondary)
  root.style.setProperty('--minimap-bg', theme.glass.panelBg)
  root.style.setProperty('--minimap-mask', theme.minimap.maskColor)
  root.style.setProperty('--canvas-bg', theme.canvas.background)
}

export default theme
