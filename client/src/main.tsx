import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'
import { injectThemeVars } from './lib/theme'

injectThemeVars()

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
