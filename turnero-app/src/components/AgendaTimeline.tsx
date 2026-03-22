import { useNavigate } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { Plus } from 'lucide-react'
import TurnoCard from '@/components/TurnoCard'
import { db } from '@/repositories/database'
import { getSlotsDisponibles } from '@/services/disponibilidad'
import type { Turno } from '@/types'
import type { Slot } from '@/services/disponibilidad'
import { useEffect, useState } from 'react'

interface AgendaTimelineProps {
  fecha: string
}

interface TimelineEntry {
  type: 'turno' | 'slot'
  horaInicio: string
  horaFin: string
  turno?: Turno
}

export default function AgendaTimeline({ fecha }: AgendaTimelineProps) {
  const navigate = useNavigate()
  const [slots, setSlots] = useState<Slot[]>([])

  const turnos = useLiveQuery(
    () => db.turnos.where('fecha').equals(fecha).sortBy('horaInicio'),
    [fecha],
  )

  useEffect(() => {
    getSlotsDisponibles(fecha).then(setSlots)
  }, [fecha, turnos])

  if (!turnos) {
    return (
      <div className="flex h-20 items-center justify-center">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    )
  }

  const turnosActivos = turnos.filter((t) => t.estado !== 'cancelado')

  // Merge turnos and slots into a single timeline sorted by hora
  const entries: TimelineEntry[] = [
    ...turnosActivos.map((t) => ({
      type: 'turno' as const,
      horaInicio: t.horaInicio,
      horaFin: t.horaFin,
      turno: t,
    })),
    ...slots.map((s) => ({
      type: 'slot' as const,
      horaInicio: s.horaInicio,
      horaFin: s.horaFin,
    })),
  ].sort((a, b) => a.horaInicio.localeCompare(b.horaInicio))

  if (entries.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        No hay horarios disponibles este día
      </p>
    )
  }

  return (
    <div className="flex flex-col gap-1">
      {entries.map((entry) =>
        entry.type === 'turno' && entry.turno ? (
          <TurnoCard key={entry.turno.id} turno={entry.turno} />
        ) : (
          <button
            key={`slot-${entry.horaInicio}`}
            onClick={() =>
              navigate(`/turnos/nuevo?fecha=${fecha}&hora=${entry.horaInicio}`)
            }
            className="flex items-center gap-3 rounded-lg border border-dashed border-border p-3 text-sm text-muted-foreground transition-colors hover:border-primary hover:text-primary"
          >
            <span className="font-medium">{entry.horaInicio}</span>
            <span className="text-xs">— {entry.horaFin}</span>
            <Plus className="ml-auto h-4 w-4" />
          </button>
        ),
      )}
    </div>
  )
}
