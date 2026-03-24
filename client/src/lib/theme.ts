import type { CSSProperties } from 'react'

interface GlassTokens {
  blur: number
  panelBg: string
  buttonBg: string
  borderColor: string
}

interface NodeTokens {
  accentBlue: string
  accentPurple: string
  accentIndigo: string
  fillOpacity: number
  borderOpacity: number
  selectedFillOpacity: number
  selectedBorderOpacity: number
}

interface TextTokens {
  primary: string
  secondary: string
  muted: string
  dimmed: string
  shadow: string
  shadowLight: string
}

interface CanvasTokens {
  background: string
  gridColor: string
}

interface MinimapTokens {
  maskColor: string
}

export interface Theme {
  glass: GlassTokens
  node: NodeTokens
  text: TextTokens
  canvas: CanvasTokens
  minimap: MinimapTokens
}

const theme: Theme = {
  glass: {
    blur: 6,
    panelBg: 'rgba(15,15,20,0.4)',
    buttonBg: 'rgba(255,255,255,0.06)',
    borderColor: 'rgba(255,255,255,0.08)',
  },

  node: {
    accentBlue: '59,130,246',
    accentPurple: '168,85,247',
    accentIndigo: '99,102,241',
    fillOpacity: 0.18,
    borderOpacity: 0.35,
    selectedFillOpacity: 0.35,
    selectedBorderOpacity: 0.7,
  },

  text: {
    primary: '#fff',
    secondary: 'rgba(255,255,255,0.8)',
    muted: 'rgba(255,255,255,0.55)',
    dimmed: 'rgba(255,255,255,0.35)',
    shadow: '0 1px 3px rgba(0,0,0,0.5)',
    shadowLight: '0 1px 2px rgba(0,0,0,0.3)',
  },

  canvas: {
    background: '#0f0f14',
    gridColor: 'rgba(255,255,255,0.03)',
  },

  minimap: {
    maskColor: 'rgba(0,0,0,0.6)',
  },
}

export function glassBlur(): CSSProperties {
  return {
    backdropFilter: `blur(${theme.glass.blur}px)`,
    WebkitBackdropFilter: `blur(${theme.glass.blur}px)`,
  }
}

export function panelStyle(): CSSProperties {
  return {
    background: theme.glass.panelBg,
    ...glassBlur(),
    border: `1px solid ${theme.glass.borderColor}`,
  }
}

export function buttonStyle(): CSSProperties {
  return {
    background: theme.glass.buttonBg,
    ...glassBlur(),
    border: `1px solid ${theme.glass.borderColor}`,
    color: theme.text.secondary,
  }
}

export function injectThemeVars(): void {
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
