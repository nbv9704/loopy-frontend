import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './i18n/config'
import { captureLoadingMotion } from './features/interface-preparation/loadingMotion'

captureLoadingMotion(document.querySelector<HTMLElement>('.loopy-loading-screen'))

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
