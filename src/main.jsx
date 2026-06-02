import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import './styles/globals.css'

const rootElement = document.getElementById('root')

if (!rootElement.__heroIndexRoot) {
  rootElement.__heroIndexRoot = createRoot(rootElement)
}

rootElement.__heroIndexRoot.render(

  <StrictMode>
    <App />
  </StrictMode>,
)
