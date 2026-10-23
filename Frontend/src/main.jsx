import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { BrowserRouter } from 'react-router-dom'
import { createBrowserRouter } from "react-router-dom";


import { initServiceWorker } from './lib/deviceNotification.js';

// Register Service Worker for device notification support
initServiceWorker();

createRoot(document.getElementById('root')).render(
 <BrowserRouter>
 <App />
 </BrowserRouter>
)
