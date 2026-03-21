import { nanoid } from 'nanoid'
import { db } from './database'
import type { Paciente } from '@/types'

export const pacienteRepo = {
  async getAll(): Promise<Paciente[]> {
    return db.pacientes.orderBy('[apellido+nombre]').toArray()
  },

  async getById(id: string): Promise<Paciente | undefined> {
    return db.pacientes.get(id)
  },

  async searchByNombreOrDni(query: string): Promise<Paciente[]> {
    const q = query.toLowerCase().trim()
    if (!q) return this.getAll()

    return db.pacientes
      .filter(
        (p) =>
          p.nombre.toLowerCase().includes(q) ||
          p.apellido.toLowerCase().includes(q) ||
          p.dni.includes(q),
      )
      .toArray()
  },

  async existeDni(dni: string, excludeId?: string): Promise<boolean> {
    const paciente = await db.pacientes.where('dni').equals(dni).first()
    if (!paciente) return false
    return excludeId ? paciente.id !== excludeId : true
  },

  async create(data: Omit<Paciente, 'id' | 'createdAt' | 'updatedAt'>): Promise<Paciente> {
    const now = new Date().toISOString()
    const paciente: Paciente = {
      ...data,
      id: nanoid(),
      createdAt: now,
      updatedAt: now,
    }
    await db.pacientes.add(paciente)
    return paciente
  },

  async update(id: string, data: Partial<Omit<Paciente, 'id' | 'createdAt'>>): Promise<void> {
    await db.pacientes.update(id, {
      ...data,
      updatedAt: new Date().toISOString(),
    })
  },

  async delete(id: string): Promise<void> {
    // RN-10: no se puede eliminar si tiene turnos asociados
    const turnosCount = await db.turnos.where('pacienteId').equals(id).count()
    if (turnosCount > 0) {
      throw new Error('No se puede eliminar un paciente con turnos asociados')
    }
    await db.pacientes.delete(id)
  },
}
