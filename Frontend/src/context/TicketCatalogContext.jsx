import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import {useAuth} from "./AuthContext.jsx";
import {
  getTickets,
  createTicket,
  updateTicket,
  deleteTicket,
} from '../services/ticketService'

const TicketCatalogContext = createContext(null)

export function TicketCatalogProvider({ children }) {
    const { isAuthenticated } = useAuth()
    const [tickets, setTickets] = useState([])
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        if (!isAuthenticated) {
            setIsLoading(false)
            return
        }
        getTickets().then((data) => {
            setTickets(data)
            setIsLoading(false)
        })
    }, [isAuthenticated])

  const addTicket = useCallback(async (data) => {
    const newTicket = await createTicket(data)
    setTickets((prev) => [newTicket, ...prev])
    return newTicket
  }, [])

  const editTicket = useCallback(async (id, data) => {
    const updated = await updateTicket(id, data)
    setTickets((prev) => prev.map((t) => (t.id === id ? updated : t)))
    return updated
  }, [])

  const removeTicket = useCallback(async (id) => {
    await deleteTicket(id)
    setTickets((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const value = {
    tickets,
    activeTickets: tickets.filter((t) => t.status === 'active'),
    isLoading,
    addTicket,
    editTicket,
    removeTicket,
  }

  return (
    <TicketCatalogContext.Provider value={value}>
      {children}
    </TicketCatalogContext.Provider>
  )
}

export function useTicketCatalog() {
  const ctx = useContext(TicketCatalogContext)
  if (!ctx) throw new Error('useTicketCatalog harus dipakai di dalam <TicketCatalogProvider>')
  return ctx
}
