import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

// Add fallback for no JS
const root = document.getElementById('root')
if (!root) {
  document.body.innerHTML = '<div style="color:white;padding:20px;font-family:sans-serif;"><h1>🤖 Model Usage Dashboard</h1><p>Loading...</p></div>'
} else {
  ReactDOM.createRoot(root).render(
    <React.Fragment>
      <App />
    </React.Fragment>
  )
}
