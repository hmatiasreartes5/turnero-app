import { z } from 'zod'

// === Regex patterns ===

const HORA_REGEX = /^([01]\d|2[0-3]):[0-5]\d$/
const FECHA_REGEX = /^\d{4}-\d{2}-\d{2}$/
const DNI_REGEX = /^\d{7,8}$/
const TELEFONO_REGEX = /^[\d\s\-+()]{7,20}$/

// === Schemas base ===

export const horarioBloqueSchema = z.object({
  desde: z.string().regex(HORA_REGEX, 'Formato HH:mm requerido'),
  hasta: z.string().regex(HORA_REGEX, 'Formato HH:mm requerido'),
})

export const horarioDiaSchema = z.object({
  activo: z.boolean(),
  bloques: z.array(horarioBloqueSchema).max(2),
})

export const estadoTurnoSchema = z.enum(['confirmado', 'completado', 'cancelado', 'no_asistio'])

export const diaSemanaSchema = z.enum([
  'lunes',
  'martes',
  'miercoles',
  'jueves',
  'viernes',
  'sabado',
  'domingo',
])

// === Entity schemas ===

export const pacienteSchema = z.object({
  id: z.string().min(1),
  nombre: z.string().min(1, 'Nombre requerido').max(100),
  apellido: z.string().min(1, 'Apellido requerido').max(100),
  dni: z.string().regex(DNI_REGEX, 'DNI debe tener 7 u 8 dígitos'),
  telefono: z.string().regex(TELEFONO_REGEX, 'Teléfono inválido'),
  obraSocial: z.string().optional(),
  numeroAfiliado: z.string().optional(),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  notas: z.string().optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
})

export const turnoSchema = z.object({
  id: z.string().min(1),
  pacienteId: z.string().min(1),
  fecha: z.string().regex(FECHA_REGEX, 'Formato YYYY-MM-DD requerido'),
  horaInicio: z.string().regex(HORA_REGEX, 'Formato HH:mm requerido'),
  horaFin: z.string().regex(HORA_REGEX, 'Formato HH:mm requerido'),
  duracionMinutos: z.number().int().min(5).max(480),
  estado: estadoTurnoSchema,
  notas: z.string().optional(),
  turnoOrigenId: z.string().optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
})

const horariosSchema = z.object({
  lunes: horarioDiaSchema,
  martes: horarioDiaSchema,
  miercoles: horarioDiaSchema,
  jueves: horarioDiaSchema,
  viernes: horarioDiaSchema,
  sabado: horarioDiaSchema,
  domingo: horarioDiaSchema,
})

export const configuracionSchema = z.object({
  id: z.literal(1),
  nombreProfesional: z.string(),
  duracionTurnoMinutos: z.number().int().min(5).max(480),
  horarios: horariosSchema,
  diasBloqueados: z.array(z.string().regex(FECHA_REGEX)),
  precios: z.record(z.string(), z.number().min(0)),
  ultimoBackup: z.string().datetime().optional(),
  onboardingCompletado: z.boolean(),
})

// === Form schemas (sin id, createdAt, updatedAt) ===

export const pacienteFormSchema = pacienteSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
})

export const turnoFormSchema = turnoSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  horaFin: true, // se calcula
})

// === Backup schema ===

export const backupSchema = z.object({
  version: z.number(),
  exportedAt: z.string().datetime(),
  data: z.object({
    pacientes: z.array(pacienteSchema),
    turnos: z.array(turnoSchema),
    configuracion: configuracionSchema,
  }),
})

// === Inferred types ===

export type PacienteForm = z.infer<typeof pacienteFormSchema>
export type TurnoForm = z.infer<typeof turnoFormSchema>
export type BackupData = z.infer<typeof backupSchema>
