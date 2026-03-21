import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { turnoRepo } from './turno.repo'
import { db } from './database'

beforeEach(async () => {
  await db.open()
})

afterEach(async () => {
  await db.delete()
})

const baseTurno = {
  pacienteId: 'p1',
  fecha: '2026-03-25',
  horaInicio: '09:00',
  horaFin: '09:30',
  duracionMinutos: 30,
  estado: 'confirmado' as const,
}

describe('turnoRepo', () => {
  it('crea un turno con id y timestamps', async () => {
    const turno = await turnoRepo.create(baseTurno)

    expect(turno.id).toBeDefined()
    expect(turno.createdAt).toBeDefined()
    expect(turno.estado).toBe('confirmado')
  })

  it('obtiene turno por id', async () => {
    const turno = await turnoRepo.create(baseTurno)
    const found = await turnoRepo.getById(turno.id)

    expect(found?.pacienteId).toBe('p1')
  })

  it('obtiene turnos por fecha ordenados por hora', async () => {
    await turnoRepo.create({ ...baseTurno, horaInicio: '10:00', horaFin: '10:30' })
    await turnoRepo.create({ ...baseTurno, horaInicio: '09:00', horaFin: '09:30' })
    await turnoRepo.create({ ...baseTurno, fecha: '2026-03-26', horaInicio: '08:00', horaFin: '08:30' })

    const turnos = await turnoRepo.getByFecha('2026-03-25')
    expect(turnos).toHaveLength(2)
    expect(turnos[0].horaInicio).toBe('09:00')
    expect(turnos[1].horaInicio).toBe('10:00')
  })

  it('obtiene turnos por paciente', async () => {
    await turnoRepo.create(baseTurno)
    await turnoRepo.create({ ...baseTurno, pacienteId: 'p2' })

    const turnos = await turnoRepo.getByPaciente('p1')
    expect(turnos).toHaveLength(1)
  })

  it('obtiene turnos por rango de fechas', async () => {
    await turnoRepo.create({ ...baseTurno, fecha: '2026-03-24' })
    await turnoRepo.create({ ...baseTurno, fecha: '2026-03-25' })
    await turnoRepo.create({ ...baseTurno, fecha: '2026-03-26' })
    await turnoRepo.create({ ...baseTurno, fecha: '2026-03-27' })

    const turnos = await turnoRepo.getByRangoFechas('2026-03-25', '2026-03-26')
    expect(turnos).toHaveLength(2)
  })

  it('actualiza estado de turno', async () => {
    const turno = await turnoRepo.create(baseTurno)
    await turnoRepo.updateEstado(turno.id, 'completado')

    const updated = await turnoRepo.getById(turno.id)
    expect(updated?.estado).toBe('completado')
  })

  it('actualiza turno con datos parciales', async () => {
    const turno = await turnoRepo.create(baseTurno)
    await turnoRepo.update(turno.id, { notas: 'Dolor lumbar' })

    const updated = await turnoRepo.getById(turno.id)
    expect(updated?.notas).toBe('Dolor lumbar')
  })

  it('soporta trazabilidad con turnoOrigenId (RN-17)', async () => {
    const original = await turnoRepo.create(baseTurno)
    const reprogramado = await turnoRepo.create({
      ...baseTurno,
      fecha: '2026-03-26',
      turnoOrigenId: original.id,
    })

    const found = await turnoRepo.getById(reprogramado.id)
    expect(found?.turnoOrigenId).toBe(original.id)
  })
})
