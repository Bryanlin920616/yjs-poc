import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  // <StrictMode> // https://github.com/fabricjs/fabric.js/issues/10136
    <App />
  // </StrictMode>,
)
