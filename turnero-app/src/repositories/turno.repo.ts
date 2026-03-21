import { nanoid } from 'nanoid'
import { db } from './database'
import type { Turno, EstadoTurno } from '@/types'

export const turnoRepo = {
  async getById(id: string): Promise<Turno | undefined> {
    return db.turnos.get(id)
  },

  async getByFecha(fecha: string): Promise<Turno[]> {
    return db.turnos.where('fecha').equals(fecha).sortBy('horaInicio')
  },

  async getByPaciente(pacienteId: string): Promise<Turno[]> {
    return db.turnos.where('pacienteId').equals(pacienteId).sortBy('fecha')
  },

  async getByRangoFechas(desde: string, hasta: string): Promise<Turno[]> {
    return db.turnos.where('fecha').between(desde, hasta, true, true).sortBy('fecha')
  },

  async create(data: Omit<Turno, 'id' | 'createdAt' | 'updatedAt'>): Promise<Turno> {
    const now = new Date().toISOString()
    const turno: Turno = {
      ...data,
      id: nanoid(),
      createdAt: now,
      updatedAt: now,
    }
    await db.turnos.add(turno)
    return turno
  },

  async updateEstado(id: string, estado: EstadoTurno): Promise<void> {
    await db.turnos.update(id, {
      estado,
      updatedAt: new Date().toISOString(),
    })
  },

  async update(id: string, data: Partial<Omit<Turno, 'id' | 'createdAt'>>): Promise<void> {
    await db.turnos.update(id, {
      ...data,
      updatedAt: new Date().toISOString(),
    })
  },
}
