import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.jsx'
import { AuthProvider } from './context/AuthContext.jsx'
import { TicketCatalogProvider } from './context/TicketCatalogContext.jsx'
import { TransactionProvider } from './context/TransactionContext.jsx'
import './index.css'
import { ToastProvider } from './context/ToastContext.jsx'
import {ConfirmProvider} from "./context/ConfirmContext.jsx";

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <ToastProvider>
        <ConfirmProvider>
          <AuthProvider>
            <TicketCatalogProvider>
              <TransactionProvider>
                <App />
              </TransactionProvider>
            </TicketCatalogProvider>
          </AuthProvider>
        </ConfirmProvider>
      </ToastProvider>
    </BrowserRouter>
  </React.StrictMode>
)
