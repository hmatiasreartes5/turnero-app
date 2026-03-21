import { format, getDay } from 'date-fns'
import type { DiaSemana } from '@/types'

const DIAS_MAP: Record<number, DiaSemana> = {
  0: 'domingo',
  1: 'lunes',
  2: 'martes',
  3: 'miercoles',
  4: 'jueves',
  5: 'viernes',
  6: 'sabado',
}

export function getDiaSemana(fecha: string): DiaSemana {
  const date = new Date(fecha + 'T12:00:00')
  return DIAS_MAP[getDay(date)]
}

export function formatFecha(fecha: string): string {
  return format(new Date(fecha + 'T12:00:00'), 'dd/MM/yyyy')
}

export function horaToMinutos(hora: string): number {
  const [h, m] = hora.split(':').map(Number)
  return h * 60 + m
}

export function minutosToHora(minutos: number): string {
  const h = Math.floor(minutos / 60)
  const m = minutos % 60
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`
}
