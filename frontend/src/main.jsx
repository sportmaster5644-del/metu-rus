import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import './styles.css'

createRoot(document.getElementById('root')).render(<React.StrictMode><App /></React.StrictMode>)

if ('serviceWorker' in navigator && import.meta.env.PROD) {
  const swUrl = `${import.meta.env.BASE_URL}sw.js`
  navigator.serviceWorker.register(swUrl, { scope: import.meta.env.BASE_URL }).catch(() => {})
}
