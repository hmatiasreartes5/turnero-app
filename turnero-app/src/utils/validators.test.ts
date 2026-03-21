import { describe, it, expect } from 'vitest'
import {
  pacienteSchema,
  turnoSchema,
  configuracionSchema,
  pacienteFormSchema,
  backupSchema,
  horarioBloqueSchema,
} from './validators'

const now = new Date().toISOString()

const validPaciente = {
  id: 'abc123',
  nombre: 'Juan',
  apellido: 'Pérez',
  dni: '12345678',
  telefono: '1155667788',
  createdAt: now,
  updatedAt: now,
}

const validTurno = {
  id: 'turno1',
  pacienteId: 'abc123',
  fecha: '2026-03-25',
  horaInicio: '09:00',
  horaFin: '09:30',
  duracionMinutos: 30,
  estado: 'confirmado' as const,
  createdAt: now,
  updatedAt: now,
}

const diaInactivo = { activo: false, bloques: [] }
const diaActivo = { activo: true, bloques: [{ desde: '08:00', hasta: '12:00' }] }

const validConfig = {
  id: 1 as const,
  nombreProfesional: 'Dra. Ana López',
  duracionTurnoMinutos: 30,
  horarios: {
    lunes: diaActivo,
    martes: diaActivo,
    miercoles: diaActivo,
    jueves: diaActivo,
    viernes: diaActivo,
    sabado: diaInactivo,
    domingo: diaInactivo,
  },
  diasBloqueados: ['2026-05-01'],
  precios: { Particular: 8000, OSDE: 5000 },
  onboardingCompletado: true,
}

describe('pacienteSchema', () => {
  it('valida paciente correcto', () => {
    expect(pacienteSchema.safeParse(validPaciente).success).toBe(true)
  })

  it('valida paciente con campos opcionales', () => {
    const paciente = { ...validPaciente, obraSocial: 'OSDE', email: 'juan@test.com', notas: 'Nota' }
    expect(pacienteSchema.safeParse(paciente).success).toBe(true)
  })

  it('rechaza DNI inválido', () => {
    const result = pacienteSchema.safeParse({ ...validPaciente, dni: '123' })
    expect(result.success).toBe(false)
  })

  it('rechaza nombre vacío', () => {
    const result = pacienteSchema.safeParse({ ...validPaciente, nombre: '' })
    expect(result.success).toBe(false)
  })

  it('rechaza email inválido', () => {
    const result = pacienteSchema.safeParse({ ...validPaciente, email: 'no-email' })
    expect(result.success).toBe(false)
  })

  it('acepta email vacío', () => {
    const result = pacienteSchema.safeParse({ ...validPaciente, email: '' })
    expect(result.success).toBe(true)
  })
})

describe('pacienteFormSchema', () => {
  it('no requiere id, createdAt, updatedAt', () => {
    const { id: _id, createdAt: _c, updatedAt: _u, ...form } = validPaciente
    expect(pacienteFormSchema.safeParse(form).success).toBe(true)
  })
})

describe('turnoSchema', () => {
  it('valida turno correcto', () => {
    expect(turnoSchema.safeParse(validTurno).success).toBe(true)
  })

  it('rechaza estado inválido', () => {
    const result = turnoSchema.safeParse({ ...validTurno, estado: 'pendiente' })
    expect(result.success).toBe(false)
  })

  it('rechaza fecha inválida', () => {
    const result = turnoSchema.safeParse({ ...validTurno, fecha: '25-03-2026' })
    expect(result.success).toBe(false)
  })

  it('rechaza hora inválida', () => {
    const result = turnoSchema.safeParse({ ...validTurno, horaInicio: '25:00' })
    expect(result.success).toBe(false)
  })

  it('valida turno con campos opcionales', () => {
    const turno = { ...validTurno, notas: 'Dolor lumbar', turnoOrigenId: 'turno0' }
    expect(turnoSchema.safeParse(turno).success).toBe(true)
  })
})

describe('configuracionSchema', () => {
  it('valida configuración correcta', () => {
    expect(configuracionSchema.safeParse(validConfig).success).toBe(true)
  })

  it('rechaza id != 1', () => {
    const result = configuracionSchema.safeParse({ ...validConfig, id: 2 })
    expect(result.success).toBe(false)
  })

  it('rechaza duración < 5', () => {
    const result = configuracionSchema.safeParse({ ...validConfig, duracionTurnoMinutos: 3 })
    expect(result.success).toBe(false)
  })
})

describe('horarioBloqueSchema', () => {
  it('valida bloque correcto', () => {
    expect(horarioBloqueSchema.safeParse({ desde: '08:00', hasta: '12:00' }).success).toBe(true)
  })

  it('rechaza formato inválido', () => {
    expect(horarioBloqueSchema.safeParse({ desde: '8:00', hasta: '12:00' }).success).toBe(false)
  })
})

describe('backupSchema', () => {
  it('valida backup completo', () => {
    const backup = {
      version: 1,
      exportedAt: now,
      data: {
        pacientes: [validPaciente],
        turnos: [validTurno],
        configuracion: validConfig,
      },
    }
    expect(backupSchema.safeParse(backup).success).toBe(true)
  })

  it('rechaza backup sin versión', () => {
    const backup = {
      exportedAt: now,
      data: { pacientes: [], turnos: [], configuracion: validConfig },
    }
    expect(backupSchema.safeParse(backup).success).toBe(false)
  })
})
