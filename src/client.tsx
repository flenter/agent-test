import React from 'react'
import ReactDOM from 'react-dom/client'
import { App } from './components';
import './main.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <div
      className="bg-background text-foreground text-sm min-h-dvh flex items-center justify-center"
    >
      <App />
    </div>
  </React.StrictMode>,
)
