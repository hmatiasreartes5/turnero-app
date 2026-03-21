import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { TurneroDB } from './database'

let db: TurneroDB

beforeEach(async () => {
  db = new TurneroDB()
  await db.open()
})

afterEach(async () => {
  await db.delete()
})

describe('TurneroDB', () => {
  it('abre la base de datos correctamente', () => {
    expect(db.isOpen()).toBe(true)
  })

  it('tiene las 3 tablas', () => {
    const tableNames = db.tables.map((t) => t.name).sort()
    expect(tableNames).toEqual(['configuracion', 'pacientes', 'turnos'])
  })

  it('puede insertar y leer un paciente', async () => {
    const now = new Date().toISOString()
    await db.pacientes.add({
      id: 'p1',
      nombre: 'Juan',
      apellido: 'Pérez',
      dni: '12345678',
      telefono: '1155667788',
      createdAt: now,
      updatedAt: now,
    })

    const paciente = await db.pacientes.get('p1')
    expect(paciente?.nombre).toBe('Juan')
    expect(paciente?.dni).toBe('12345678')
  })

  it('puede insertar y leer un turno', async () => {
    const now = new Date().toISOString()
    await db.turnos.add({
      id: 't1',
      pacienteId: 'p1',
      fecha: '2026-03-25',
      horaInicio: '09:00',
      horaFin: '09:30',
      duracionMinutos: 30,
      estado: 'confirmado',
      createdAt: now,
      updatedAt: now,
    })

    const turno = await db.turnos.get('t1')
    expect(turno?.estado).toBe('confirmado')
    expect(turno?.fecha).toBe('2026-03-25')
  })

  it('puede buscar turnos por fecha', async () => {
    const now = new Date().toISOString()
    await db.turnos.bulkAdd([
      {
        id: 't1',
        pacienteId: 'p1',
        fecha: '2026-03-25',
        horaInicio: '09:00',
        horaFin: '09:30',
        duracionMinutos: 30,
        estado: 'confirmado',
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 't2',
        pacienteId: 'p1',
        fecha: '2026-03-26',
        horaInicio: '10:00',
        horaFin: '10:30',
        duracionMinutos: 30,
        estado: 'confirmado',
        createdAt: now,
        updatedAt: now,
      },
    ])

    const turnos = await db.turnos.where('fecha').equals('2026-03-25').toArray()
    expect(turnos).toHaveLength(1)
    expect(turnos[0].id).toBe('t1')
  })

  it('puede buscar paciente por DNI', async () => {
    const now = new Date().toISOString()
    await db.pacientes.add({
      id: 'p1',
      nombre: 'Ana',
      apellido: 'López',
      dni: '87654321',
      telefono: '1144332211',
      createdAt: now,
      updatedAt: now,
    })

    const paciente = await db.pacientes.where('dni').equals('87654321').first()
    expect(paciente?.nombre).toBe('Ana')
  })
})
