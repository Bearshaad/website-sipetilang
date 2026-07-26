import { createContext, useCallback, useContext, useState } from 'react'
import { AlertTriangle } from 'lucide-react'
import Popup from '../components/ui/Popup'

const ConfirmContext = createContext(null)

export function ConfirmProvider({ children }) {
  const [state, setState] = useState(null)

  const confirm = useCallback(({ title, description, details }) => {
    return new Promise((resolve) => {
      setState({ title, description, details, resolve })
    })
  }, [])

  function handleAnswer(result) {
    state?.resolve(result)
    setState(null)
  }

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}

      <Popup isOpen={!!state} onClose={() => handleAnswer(false)}>
        <div className="text-center">
          <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-red-600">
            <AlertTriangle size={22} />
          </span>
          <h3 className="mt-4 text-base font-bold text-slate-900">{state?.title}</h3>
          {state?.description && (
            <p className="mt-1 text-sm text-slate-500">{state.description}</p>
          )}
          {state?.details && <div className="mt-4 text-left">{state.details}</div>}
          <div className="mt-6 flex justify-center gap-3">
            <button type="button" onClick={() => handleAnswer(false)} className="btn-outline-danger">
              Batal
            </button>
            <button type="button" onClick={() => handleAnswer(true)} className="btn-primary">
              Ya, Lanjutkan
            </button>
          </div>
        </div>
      </Popup>
    </ConfirmContext.Provider>
  )
}

export function useConfirm() {
  const ctx = useContext(ConfirmContext)
  if (!ctx) throw new Error('useConfirm harus dipakai di dalam <ConfirmProvider>')
  return ctx
}