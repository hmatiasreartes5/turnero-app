import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { configRepo } from './config.repo'
import { db } from './database'

beforeEach(async () => {
  await db.open()
})

afterEach(async () => {
  await db.delete()
})

describe('configRepo', () => {
  it('inicializa defaults cuando no existe', async () => {
    const config = await configRepo.get()

    expect(config.id).toBe(1)
    expect(config.duracionTurnoMinutos).toBe(30)
    expect(config.onboardingCompletado).toBe(false)
    expect(config.nombreProfesional).toBe('')
  })

  it('retorna la misma config en llamadas sucesivas', async () => {
    const config1 = await configRepo.get()
    const config2 = await configRepo.get()

    expect(config1.id).toBe(config2.id)
  })

  it('tiene horarios de lunes a viernes activos por default', async () => {
    const config = await configRepo.get()

    expect(config.horarios.lunes.activo).toBe(true)
    expect(config.horarios.viernes.activo).toBe(true)
    expect(config.horarios.sabado.activo).toBe(false)
    expect(config.horarios.domingo.activo).toBe(false)
  })

  it('actualiza la duración del turno', async () => {
    await configRepo.initDefaults()
    await configRepo.update({ duracionTurnoMinutos: 45 })

    const config = await configRepo.get()
    expect(config.duracionTurnoMinutos).toBe(45)
  })

  it('actualiza horarios', async () => {
    await configRepo.initDefaults()
    await configRepo.update({
      horarios: {
        ...(await configRepo.get()).horarios,
        sabado: { activo: true, bloques: [{ desde: '09:00', hasta: '13:00' }] },
      },
    })

    const config = await configRepo.get()
    expect(config.horarios.sabado.activo).toBe(true)
    expect(config.horarios.sabado.bloques[0].desde).toBe('09:00')
  })

  it('agrega días bloqueados', async () => {
    await configRepo.initDefaults()
    await configRepo.update({ diasBloqueados: ['2026-05-01', '2026-12-25'] })

    const config = await configRepo.get()
    expect(config.diasBloqueados).toHaveLength(2)
    expect(config.diasBloqueados).toContain('2026-05-01')
  })

  it('actualiza precios', async () => {
    await configRepo.initDefaults()
    await configRepo.update({ precios: { OSDE: 5000, Particular: 8000 } })

    const config = await configRepo.get()
    expect(config.precios['OSDE']).toBe(5000)
    expect(config.precios['Particular']).toBe(8000)
  })
})
