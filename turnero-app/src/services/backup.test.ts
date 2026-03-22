import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { db } from '@/repositories/database'
import { configRepo } from '@/repositories/config.repo'
import { pacienteRepo } from '@/repositories/paciente.repo'
import { turnoRepo } from '@/repositories/turno.repo'
import { exportarDatos, validarArchivo, importarDatos } from './backup'

beforeEach(async () => {
  await db.open()
  await configRepo.initDefaults()
})

afterEach(async () => {
  await db.delete()
})

describe('exportarDatos', () => {
  it('genera JSON con estructura correcta', async () => {
    await pacienteRepo.create({ nombre: 'Juan', apellido: 'Pérez', dni: '12345678', telefono: '1155667788' })

    const json = await exportarDatos()
    const parsed = JSON.parse(json)

    expect(parsed.version).toBe(1)
    expect(parsed.exportedAt).toBeDefined()
    expect(parsed.data.pacientes).toHaveLength(1)
    expect(parsed.data.turnos).toHaveLength(0)
    expect(parsed.data.configuracion.id).toBe(1)
  })

  it('actualiza fecha de último backup', async () => {
    await exportarDatos()
    const config = await configRepo.get()
    expect(config.ultimoBackup).toBeDefined()
  })
})

describe('validarArchivo', () => {
  it('acepta backup válido', async () => {
    await pacienteRepo.create({ nombre: 'Ana', apellido: 'López', dni: '87654321', telefono: '1122334455' })
    const json = await exportarDatos()
    const result = await validarArchivo(json)
    expect(result.valid).toBe(true)
    expect(result.data).toBeDefined()
  })

  it('rechaza JSON inválido', async () => {
    const result = await validarArchivo('no es json')
    expect(result.valid).toBe(false)
  })

  it('rechaza estructura incorrecta', async () => {
    const result = await validarArchivo('{"foo": "bar"}')
    expect(result.valid).toBe(false)
  })
})

describe('importarDatos', () => {
  it('importa datos completos', async () => {
    // Crear datos
    const paciente = await pacienteRepo.create({ nombre: 'Juan', apellido: 'Pérez', dni: '12345678', telefono: '1155667788' })
    await turnoRepo.create({
      pacienteId: paciente.id,
      fecha: '2026-03-25',
      horaInicio: '09:00',
      horaFin: '09:30',
      duracionMinutos: 30,
      estado: 'confirmado',
    })

    // Export
    const json = await exportarDatos()
    const { data } = await validarArchivo(json)

    // Clear and import
    await db.pacientes.clear()
    await db.turnos.clear()
    expect(await db.pacientes.count()).toBe(0)

    const result = await importarDatos(data!)
    expect(result.pacientes).toBe(1)
    expect(result.turnos).toBe(1)

    // Verify data is back
    expect(await db.pacientes.count()).toBe(1)
    expect(await db.turnos.count()).toBe(1)
  })

  it('reemplaza datos existentes', async () => {
    // Crear datos originales
    await pacienteRepo.create({ nombre: 'Original', apellido: 'Dato', dni: '11111111', telefono: '1155667788' })
    expect(await db.pacientes.count()).toBe(1)

    // Crear backup con otros datos
    await db.pacientes.clear()
    await pacienteRepo.create({ nombre: 'Nuevo1', apellido: 'A', dni: '22222222', telefono: '1122334455' })
    await pacienteRepo.create({ nombre: 'Nuevo2', apellido: 'B', dni: '33333333', telefono: '1199887766' })
    const json = await exportarDatos()
    const { data } = await validarArchivo(json)

    // Import reemplaza
    const result = await importarDatos(data!)
    expect(result.pacientes).toBe(2)
    expect(await db.pacientes.count()).toBe(2)
  })
})
