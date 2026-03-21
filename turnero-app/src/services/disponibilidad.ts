import { configRepo } from '@/repositories/config.repo'
import { turnoRepo } from '@/repositories/turno.repo'
import { getDiaSemana, horaToMinutos, minutosToHora } from '@/utils/dates'

export interface Slot {
  horaInicio: string // HH:mm
  horaFin: string // HH:mm
}

export async function getSlotsDisponibles(
  fecha: string,
  duracionOverride?: number,
): Promise<Slot[]> {
  const config = await configRepo.get()
  const duracion = duracionOverride ?? config.duracionTurnoMinutos

  // Día bloqueado → 0 slots
  if (config.diasBloqueados.includes(fecha)) return []

  // Día no laborable → 0 slots
  const dia = getDiaSemana(fecha)
  const horarioDia = config.horarios[dia]
  if (!horarioDia.activo) return []

  // Obtener turnos activos del día (no cancelados)
  const turnosDelDia = await turnoRepo.getByFecha(fecha)
  const turnosActivos = turnosDelDia.filter((t) => t.estado !== 'cancelado')

  // Generar slots para cada bloque horario
  const slots: Slot[] = []

  for (const bloque of horarioDia.bloques) {
    const bloqueDesde = horaToMinutos(bloque.desde)
    const bloqueHasta = horaToMinutos(bloque.hasta)

    for (let inicio = bloqueDesde; inicio + duracion <= bloqueHasta; inicio += duracion) {
      const fin = inicio + duracion
      const horaInicio = minutosToHora(inicio)
      const horaFin = minutosToHora(fin)

      // Verificar que no se superpone con ningún turno activo
      const ocupado = turnosActivos.some((t) => {
        const tInicio = horaToMinutos(t.horaInicio)
        const tFin = horaToMinutos(t.horaFin)
        return inicio < tFin && fin > tInicio
      })

      if (!ocupado) {
        slots.push({ horaInicio, horaFin })
      }
    }
  }

  return slots
}

export async function validarDisponibilidad(
  fecha: string,
  horaInicio: string,
  duracion: number,
): Promise<{ disponible: boolean; motivo?: string }> {
  const config = await configRepo.get()

  if (config.diasBloqueados.includes(fecha)) {
    return { disponible: false, motivo: 'Día bloqueado' }
  }

  const dia = getDiaSemana(fecha)
  const horarioDia = config.horarios[dia]
  if (!horarioDia.activo) {
    return { disponible: false, motivo: 'Día no laborable' }
  }

  const inicio = horaToMinutos(horaInicio)
  const fin = inicio + duracion

  // Verificar que el slot está dentro de algún bloque horario
  const dentroDeBloque = horarioDia.bloques.some((b) => {
    return inicio >= horaToMinutos(b.desde) && fin <= horaToMinutos(b.hasta)
  })

  if (!dentroDeBloque) {
    return { disponible: false, motivo: 'Fuera del horario de atención' }
  }

  // Verificar superposición con turnos activos
  const turnosDelDia = await turnoRepo.getByFecha(fecha)
  const turnosActivos = turnosDelDia.filter((t) => t.estado !== 'cancelado')

  const superpuesto = turnosActivos.some((t) => {
    const tInicio = horaToMinutos(t.horaInicio)
    const tFin = horaToMinutos(t.horaFin)
    return inicio < tFin && fin > tInicio
  })

  if (superpuesto) {
    return { disponible: false, motivo: 'Horario ocupado por otro turno' }
  }

  return { disponible: true }
}
