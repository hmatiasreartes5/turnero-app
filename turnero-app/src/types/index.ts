// === Domain Types ===

export type EstadoTurno = 'confirmado' | 'completado' | 'cancelado' | 'no_asistio'

export type DiaSemana =
  | 'lunes'
  | 'martes'
  | 'miercoles'
  | 'jueves'
  | 'viernes'
  | 'sabado'
  | 'domingo'

export interface HorarioBloque {
  desde: string // HH:mm
  hasta: string // HH:mm
}

export interface HorarioDia {
  activo: boolean
  bloques: HorarioBloque[] // 0, 1 o 2 bloques (mañana/tarde)
}

export interface Paciente {
  id: string // nanoid, PK
  nombre: string
  apellido: string
  dni: string // único
  telefono: string
  obraSocial?: string
  numeroAfiliado?: string
  email?: string
  notas?: string
  createdAt: string // ISO 8601
  updatedAt: string // ISO 8601
}

export interface Turno {
  id: string // nanoid, PK
  pacienteId: string // FK → Paciente.id
  fecha: string // YYYY-MM-DD
  horaInicio: string // HH:mm (24h)
  horaFin: string // HH:mm (24h)
  duracionMinutos: number // snapshot de la config al crear
  estado: EstadoTurno
  notas?: string
  turnoOrigenId?: string // si fue reprogramado, ref al turno original
  createdAt: string
  updatedAt: string
}

export interface Configuracion {
  id: number // siempre 1 (singleton)
  nombreProfesional: string
  duracionTurnoMinutos: number // default: 30
  horarios: Record<DiaSemana, HorarioDia>
  diasBloqueados: string[] // ["2026-03-25", "2026-05-01"]
  precios: Record<string, number> // { "OSDE": 5000, "Particular": 8000 }
  ultimoBackup?: string // ISO 8601
  onboardingCompletado: boolean
}
