import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { DayPicker } from 'react-day-picker'
import { es } from 'date-fns/locale'
import { format, parse, startOfMonth, endOfMonth } from 'date-fns'
import { Plus } from 'lucide-react'
import { useLiveQuery } from 'dexie-react-hooks'
import { Button } from '@/components/ui/button'
import TurnoCard from '@/components/TurnoCard'
import { db } from '@/repositories/database'
import { useAppStore } from '@/stores/app.store'

import 'react-day-picker/style.css'

export default function Agenda() {
  const navigate = useNavigate()
  const fechaSeleccionada = useAppStore((s) => s.fechaSeleccionada)
  const setFechaSeleccionada = useAppStore((s) => s.setFechaSeleccionada)

  const selectedDate = parse(fechaSeleccionada, 'yyyy-MM-dd', new Date())
  const monthStart = format(startOfMonth(selectedDate), 'yyyy-MM-dd')
  const monthEnd = format(endOfMonth(selectedDate), 'yyyy-MM-dd')

  // Turnos del mes para indicadores
  const turnosDelMes = useLiveQuery(
    () => db.turnos.where('fecha').between(monthStart, monthEnd, true, true).toArray(),
    [monthStart, monthEnd],
  )

  // Turnos del día seleccionado
  const turnosDelDia = useLiveQuery(
    () => db.turnos.where('fecha').equals(fechaSeleccionada).sortBy('horaInicio'),
    [fechaSeleccionada],
  )

  // Días con turnos activos para mostrar indicador
  const diasConTurnos = useMemo(() => {
    if (!turnosDelMes) return new Set<string>()
    const dias = new Set<string>()
    for (const t of turnosDelMes) {
      if (t.estado !== 'cancelado') dias.add(t.fecha)
    }
    return dias
  }, [turnosDelMes])

  const turnosActivos = turnosDelDia?.filter((t) => t.estado !== 'cancelado')
  const fechaDisplay = format(selectedDate, "EEEE d 'de' MMMM", { locale: es })

  return (
    <div className="p-4">
      <div className="mb-4 flex items-center gap-2">
        <div className="h-6 w-1 rounded-full bg-primary" />
        <div>
          <h1 className="text-2xl font-bold leading-tight">Agenda</h1>
          <p className="text-xs text-muted-foreground">Calendario y turnos</p>
        </div>
      </div>

      <div className="mb-4 flex justify-center">
        <DayPicker
          mode="single"
          locale={es}
          selected={selectedDate}
          onSelect={(date) => {
            if (date) setFechaSeleccionada(format(date, 'yyyy-MM-dd'))
          }}
          modifiers={{
            conTurnos: (date) => diasConTurnos.has(format(date, 'yyyy-MM-dd')),
          }}
          modifiersClassNames={{
            conTurnos: 'font-bold underline decoration-primary decoration-2 underline-offset-4',
          }}
          onMonthChange={(month) => {
            setFechaSeleccionada(format(month, 'yyyy-MM-dd'))
          }}
        />
      </div>

      <div className="mb-3 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold capitalize">{fechaDisplay}</h2>
          {turnosActivos && (
            <p className="text-xs text-muted-foreground">
              {turnosActivos.length === 0
                ? 'Sin turnos'
                : `${turnosActivos.length} turno${turnosActivos.length !== 1 ? 's' : ''}`}
            </p>
          )}
        </div>
        <Button
          size="sm"
          onClick={() => navigate(`/turnos/nuevo?fecha=${fechaSeleccionada}`)}
        >
          <Plus className="mr-1 h-4 w-4" />
          Turno
        </Button>
      </div>

      {!turnosDelDia ? (
        <div className="flex h-20 items-center justify-center">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      ) : turnosActivos && turnosActivos.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">
          No hay turnos para este día
        </p>
      ) : (
        <div className="flex flex-col gap-2">
          {turnosDelDia
            .filter((t) => t.estado !== 'cancelado')
            .map((turno) => (
              <TurnoCard key={turno.id} turno={turno} />
            ))}
        </div>
      )}
    </div>
  )
}
