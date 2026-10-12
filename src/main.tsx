import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'
import { initStore } from './data/store'
import { applyTheme, bootTheme, registerServiceWorker } from './services/platform'

bootTheme()
const root = ReactDOM.createRoot(document.getElementById('root')!)
initStore().finally(() => {
  applyTheme()
  root.render(<React.StrictMode><App /></React.StrictMode>)
  registerServiceWorker()
})
