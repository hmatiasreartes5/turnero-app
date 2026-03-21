import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { pacienteRepo } from './paciente.repo'
import { db } from './database'

beforeEach(async () => {
  await db.open()
})

afterEach(async () => {
  await db.delete()
})

describe('pacienteRepo', () => {
  it('crea un paciente con id y timestamps', async () => {
    const paciente = await pacienteRepo.create({
      nombre: 'Juan',
      apellido: 'Pérez',
      dni: '12345678',
      telefono: '1155667788',
    })

    expect(paciente.id).toBeDefined()
    expect(paciente.createdAt).toBeDefined()
    expect(paciente.nombre).toBe('Juan')
  })

  it('obtiene todos los pacientes ordenados por apellido+nombre', async () => {
    await pacienteRepo.create({ nombre: 'Zara', apellido: 'López', dni: '11111111', telefono: '111' })
    await pacienteRepo.create({ nombre: 'Ana', apellido: 'García', dni: '22222222', telefono: '222' })

    const todos = await pacienteRepo.getAll()
    expect(todos).toHaveLength(2)
    expect(todos[0].apellido).toBe('García')
    expect(todos[1].apellido).toBe('López')
  })

  it('busca por nombre', async () => {
    await pacienteRepo.create({ nombre: 'Juan', apellido: 'Pérez', dni: '11111111', telefono: '111' })
    await pacienteRepo.create({ nombre: 'Ana', apellido: 'García', dni: '22222222', telefono: '222' })

    const results = await pacienteRepo.searchByNombreOrDni('juan')
    expect(results).toHaveLength(1)
    expect(results[0].nombre).toBe('Juan')
  })

  it('busca por DNI', async () => {
    await pacienteRepo.create({ nombre: 'Juan', apellido: 'Pérez', dni: '12345678', telefono: '111' })

    const results = await pacienteRepo.searchByNombreOrDni('12345678')
    expect(results).toHaveLength(1)
  })

  it('verifica DNI existente', async () => {
    await pacienteRepo.create({ nombre: 'Juan', apellido: 'Pérez', dni: '12345678', telefono: '111' })

    expect(await pacienteRepo.existeDni('12345678')).toBe(true)
    expect(await pacienteRepo.existeDni('99999999')).toBe(false)
  })

  it('excluye id al verificar DNI duplicado', async () => {
    const paciente = await pacienteRepo.create({ nombre: 'Juan', apellido: 'Pérez', dni: '12345678', telefono: '111' })

    expect(await pacienteRepo.existeDni('12345678', paciente.id)).toBe(false)
  })

  it('actualiza un paciente', async () => {
    const paciente = await pacienteRepo.create({ nombre: 'Juan', apellido: 'Pérez', dni: '12345678', telefono: '111' })
    await pacienteRepo.update(paciente.id, { nombre: 'Carlos' })

    const updated = await pacienteRepo.getById(paciente.id)
    expect(updated?.nombre).toBe('Carlos')
    expect(updated?.updatedAt).not.toBe(paciente.updatedAt)
  })

  it('no elimina paciente con turnos (RN-10)', async () => {
    const paciente = await pacienteRepo.create({ nombre: 'Juan', apellido: 'Pérez', dni: '12345678', telefono: '111' })
    const now = new Date().toISOString()
    await db.turnos.add({
      id: 't1',
      pacienteId: paciente.id,
      fecha: '2026-03-25',
      horaInicio: '09:00',
      horaFin: '09:30',
      duracionMinutos: 30,
      estado: 'confirmado',
      createdAt: now,
      updatedAt: now,
    })

    await expect(pacienteRepo.delete(paciente.id)).rejects.toThrow('turnos asociados')
  })

  it('elimina paciente sin turnos', async () => {
    const paciente = await pacienteRepo.create({ nombre: 'Juan', apellido: 'Pérez', dni: '12345678', telefono: '111' })
    await pacienteRepo.delete(paciente.id)

    expect(await pacienteRepo.getById(paciente.id)).toBeUndefined()
  })
})
