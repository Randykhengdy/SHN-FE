import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'
import '@/styles/global.css'
import '@/styles/jenisBarang.css'
import errorHandler from '@/lib/errorHandler';

// HashRouter dipindahkan ke dalam TabLayout agar bisa menggunakan
// MemoryRouter per-tab tanpa error nesting Router
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
