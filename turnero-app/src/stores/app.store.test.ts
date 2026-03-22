import { describe, it, expect, beforeEach } from 'vitest'
import { useAppStore } from './app.store'

beforeEach(() => {
  useAppStore.setState({
    fechaSeleccionada: '2026-03-25',
    modalAbierto: null,
  })
})

describe('useAppStore', () => {
  it('tiene fecha seleccionada', () => {
    expect(useAppStore.getState().fechaSeleccionada).toBe('2026-03-25')
  })

  it('actualiza fecha seleccionada', () => {
    useAppStore.getState().setFechaSeleccionada('2026-04-01')
    expect(useAppStore.getState().fechaSeleccionada).toBe('2026-04-01')
  })

  it('abre y cierra modal', () => {
    useAppStore.getState().abrirModal('confirmar-cancelar')
    expect(useAppStore.getState().modalAbierto).toBe('confirmar-cancelar')

    useAppStore.getState().cerrarModal()
    expect(useAppStore.getState().modalAbierto).toBeNull()
  })
})
