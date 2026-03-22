import { create } from 'zustand'
import { format } from 'date-fns'

interface AppStore {
  fechaSeleccionada: string // YYYY-MM-DD
  setFechaSeleccionada: (fecha: string) => void
  modalAbierto: string | null
  abrirModal: (id: string) => void
  cerrarModal: () => void
}

export const useAppStore = create<AppStore>((set) => ({
  fechaSeleccionada: format(new Date(), 'yyyy-MM-dd'),
  setFechaSeleccionada: (fecha) => set({ fechaSeleccionada: fecha }),
  modalAbierto: null,
  abrirModal: (id) => set({ modalAbierto: id }),
  cerrarModal: () => set({ modalAbierto: null }),
}))
