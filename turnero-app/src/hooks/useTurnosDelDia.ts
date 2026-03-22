import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/repositories/database'
import type { Turno } from '@/types'

export function useTurnosDelDia(fecha: string): Turno[] | undefined {
  return useLiveQuery(
    () => db.turnos.where('fecha').equals(fecha).sortBy('horaInicio'),
    [fecha],
  )
}
