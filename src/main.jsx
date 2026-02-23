import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { ClerkProvider } from '@clerk/clerk-react'
import './index.css'
import App from './App.jsx'

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY

if (!PUBLISHABLE_KEY) {
  throw new Error('Missing VITE_CLERK_PUBLISHABLE_KEY in environment variables')
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ClerkProvider
      publishableKey={PUBLISHABLE_KEY}
      appearance={{
        variables: {
          colorBackground: '#141210',
          colorText: '#e8e4dd',
          colorPrimary: '#b5a898',
          colorInputBackground: '#1e1b18',
          colorInputText: '#e8e4dd',
        },
      }}
    >
      <App />
    </ClerkProvider>
  </StrictMode>,
)
