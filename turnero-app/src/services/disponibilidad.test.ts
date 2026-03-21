import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { db } from '@/repositories/database'
import { configRepo } from '@/repositories/config.repo'
import { turnoRepo } from '@/repositories/turno.repo'
import { getSlotsDisponibles, validarDisponibilidad } from './disponibilidad'

beforeEach(async () => {
  await db.open()
  await configRepo.initDefaults()
})

afterEach(async () => {
  await db.delete()
})

// 2026-03-25 es miércoles
const MIERCOLES = '2026-03-25'
// 2026-03-28 es sábado
const SABADO = '2026-03-28'

describe('getSlotsDisponibles', () => {
  it('retorna slots de un día normal (lun-vie)', async () => {
    const slots = await getSlotsDisponibles(MIERCOLES)

    // Default: 08:00-12:00 y 14:00-18:00, duración 30min
    // Mañana: 8 slots, Tarde: 8 slots = 16 total
    expect(slots).toHaveLength(16)
    expect(slots[0]).toEqual({ horaInicio: '08:00', horaFin: '08:30' })
    expect(slots[slots.length - 1]).toEqual({ horaInicio: '17:30', horaFin: '18:00' })
  })

  it('retorna 0 slots para día no laborable', async () => {
    const slots = await getSlotsDisponibles(SABADO)
    expect(slots).toHaveLength(0)
  })

  it('retorna 0 slots para día bloqueado', async () => {
    await configRepo.update({ diasBloqueados: [MIERCOLES] })
    const slots = await getSlotsDisponibles(MIERCOLES)
    expect(slots).toHaveLength(0)
  })

  it('excluye slots ocupados por turnos activos', async () => {
    await turnoRepo.create({
      pacienteId: 'p1',
      fecha: MIERCOLES,
      horaInicio: '09:00',
      horaFin: '09:30',
      duracionMinutos: 30,
      estado: 'confirmado',
    })

    const slots = await getSlotsDisponibles(MIERCOLES)
    expect(slots).toHaveLength(15) // 16 - 1
    expect(slots.find((s) => s.horaInicio === '09:00')).toBeUndefined()
  })

  it('no excluye slots de turnos cancelados', async () => {
    await turnoRepo.create({
      pacienteId: 'p1',
      fecha: MIERCOLES,
      horaInicio: '09:00',
      horaFin: '09:30',
      duracionMinutos: 30,
      estado: 'cancelado',
    })

    const slots = await getSlotsDisponibles(MIERCOLES)
    expect(slots).toHaveLength(16)
  })

  it('soporta duración variable', async () => {
    const slots = await getSlotsDisponibles(MIERCOLES, 60)

    // Mañana 08:00-12:00 = 4 slots de 60min, Tarde 14:00-18:00 = 4 slots = 8 total
    expect(slots).toHaveLength(8)
    expect(slots[0]).toEqual({ horaInicio: '08:00', horaFin: '09:00' })
  })

  it('maneja correctamente superposición con turnos de diferente duración', async () => {
    // Turno de 60min que ocupa 2 slots de 30min
    await turnoRepo.create({
      pacienteId: 'p1',
      fecha: MIERCOLES,
      horaInicio: '09:00',
      horaFin: '10:00',
      duracionMinutos: 60,
      estado: 'confirmado',
    })

    const slots = await getSlotsDisponibles(MIERCOLES)
    // Debe excluir tanto 09:00 como 09:30
    expect(slots.find((s) => s.horaInicio === '09:00')).toBeUndefined()
    expect(slots.find((s) => s.horaInicio === '09:30')).toBeUndefined()
    expect(slots).toHaveLength(14) // 16 - 2
  })
})

describe('validarDisponibilidad', () => {
  it('retorna disponible para slot libre', async () => {
    const result = await validarDisponibilidad(MIERCOLES, '09:00', 30)
    expect(result.disponible).toBe(true)
  })

  it('rechaza día bloqueado', async () => {
    await configRepo.update({ diasBloqueados: [MIERCOLES] })
    const result = await validarDisponibilidad(MIERCOLES, '09:00', 30)
    expect(result.disponible).toBe(false)
    expect(result.motivo).toBe('Día bloqueado')
  })

  it('rechaza día no laborable', async () => {
    const result = await validarDisponibilidad(SABADO, '09:00', 30)
    expect(result.disponible).toBe(false)
    expect(result.motivo).toBe('Día no laborable')
  })

  it('rechaza fuera de horario', async () => {
    const result = await validarDisponibilidad(MIERCOLES, '13:00', 30)
    expect(result.disponible).toBe(false)
    expect(result.motivo).toBe('Fuera del horario de atención')
  })

  it('rechaza slot superpuesto', async () => {
    await turnoRepo.create({
      pacienteId: 'p1',
      fecha: MIERCOLES,
      horaInicio: '09:00',
      horaFin: '09:30',
      duracionMinutos: 30,
      estado: 'confirmado',
    })

    const result = await validarDisponibilidad(MIERCOLES, '09:00', 30)
    expect(result.disponible).toBe(false)
    expect(result.motivo).toBe('Horario ocupado por otro turno')
  })
})
