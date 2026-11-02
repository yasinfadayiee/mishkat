import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@fontsource/vazirmatn/arabic-400.css'
import '@fontsource/vazirmatn/arabic-600.css'
import '@fontsource/vazirmatn/arabic-700.css'
import '@fontsource/vazirmatn/arabic-800.css'
import '@fontsource/vazirmatn/arabic-900.css'
import '@fontsource/vazirmatn/latin-400.css'
import '@fontsource/amiri-quran/arabic-400.css'
import '@fontsource/amiri/arabic-400.css'
import './styles.css'
import './styles-v2.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
