import { useNavigate } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { Card, CardContent } from '@/components/ui/card'
import { db } from '@/repositories/database'
import type { Turno, EstadoTurno } from '@/types'

const estadoStyles: Record<EstadoTurno, { bg: string; label: string }> = {
  confirmado: { bg: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200', label: 'Confirmado' },
  completado: { bg: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200', label: 'Completado' },
  cancelado: { bg: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200', label: 'Cancelado' },
  no_asistio: { bg: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200', label: 'No asistió' },
}

interface TurnoCardProps {
  turno: Turno
}

export default function TurnoCard({ turno }: TurnoCardProps) {
  const navigate = useNavigate()
  const paciente = useLiveQuery(() => db.pacientes.get(turno.pacienteId), [turno.pacienteId])

  const estado = estadoStyles[turno.estado]

  return (
    <Card
      className="cursor-pointer transition-shadow hover:shadow-md"
      onClick={() => navigate(`/turnos/${turno.id}`)}
    >
      <CardContent className="flex items-center gap-3 p-3">
        <div className="flex flex-col items-center text-sm font-medium">
          <span>{turno.horaInicio}</span>
          <span className="text-xs text-muted-foreground">{turno.horaFin}</span>
        </div>

        <div className="h-10 w-px bg-border" />

        <div className="flex-1 min-w-0">
          <p className="truncate font-medium">
            {paciente ? `${paciente.apellido}, ${paciente.nombre}` : 'Cargando...'}
          </p>
          {turno.notas && (
            <p className="truncate text-xs text-muted-foreground">{turno.notas}</p>
          )}
        </div>

        <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${estado.bg}`}>
          {estado.label}
        </span>
      </CardContent>
    </Card>
  )
}
