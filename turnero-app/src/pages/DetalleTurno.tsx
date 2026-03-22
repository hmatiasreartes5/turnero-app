import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { db } from '@/repositories/database'
import { turnoRepo } from '@/repositories/turno.repo'
import type { EstadoTurno } from '@/types'

const estadoLabels: Record<EstadoTurno, string> = {
  confirmado: 'Confirmado',
  completado: 'Completado',
  cancelado: 'Cancelado',
  no_asistio: 'No asistió',
}

const estadoColors: Record<EstadoTurno, string> = {
  confirmado: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  completado: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  cancelado: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  no_asistio: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200',
}

export default function DetalleTurno() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [confirmAction, setConfirmAction] = useState<EstadoTurno | null>(null)
  const [editingNotas, setEditingNotas] = useState(false)
  const [notas, setNotas] = useState('')

  const turno = useLiveQuery(() => (id ? db.turnos.get(id) : undefined), [id])
  const paciente = useLiveQuery(
    () => (turno?.pacienteId ? db.pacientes.get(turno.pacienteId) : undefined),
    [turno?.pacienteId],
  )

  if (!turno) {
    return (
      <div className="flex h-dvh items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    )
  }

  const fechaDisplay = format(
    new Date(turno.fecha + 'T12:00:00'),
    "EEEE d 'de' MMMM yyyy",
    { locale: es },
  )

  const handleEstado = async (estado: EstadoTurno) => {
    await turnoRepo.updateEstado(turno.id, estado)
    setConfirmAction(null)
  }

  const handleSaveNotas = async () => {
    await turnoRepo.update(turno.id, { notas })
    setEditingNotas(false)
  }

  const handleReprogramar = () => {
    navigate(`/turnos/nuevo?pacienteId=${turno.pacienteId}&origenId=${turno.id}`)
  }

  const isReadOnly = turno.estado === 'completado' || turno.estado === 'cancelado'

  return (
    <div className="min-h-dvh bg-background">
      <header className="sticky top-0 z-10 flex items-center gap-3 border-b bg-background/95 p-4 backdrop-blur-sm">
        <button onClick={() => navigate(-1)}>
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="text-lg font-bold">Detalle del turno</h1>
      </header>

      <div className="flex flex-col gap-5 p-4">
        {/* Estado */}
        <div className="flex items-center gap-2">
          <span className={`rounded-full px-3 py-1 text-sm font-medium ${estadoColors[turno.estado]}`}>
            {estadoLabels[turno.estado]}
          </span>
        </div>

        {/* Fecha y hora */}
        <div className="rounded-lg border p-4">
          <p className="text-sm text-muted-foreground">Fecha y hora</p>
          <p className="text-lg font-semibold capitalize">{fechaDisplay}</p>
          <p className="text-lg">
            {turno.horaInicio} — {turno.horaFin}
            <span className="ml-2 text-sm text-muted-foreground">({turno.duracionMinutos} min)</span>
          </p>
        </div>

        {/* Paciente */}
        {paciente && (
          <button
            onClick={() => navigate(`/pacientes/${paciente.id}`)}
            className="rounded-lg border p-4 text-left transition-colors hover:bg-accent"
          >
            <p className="text-sm text-muted-foreground">Paciente</p>
            <p className="text-lg font-semibold">{paciente.apellido}, {paciente.nombre}</p>
            <p className="text-sm text-muted-foreground">
              DNI {paciente.dni}{paciente.obraSocial ? ` · ${paciente.obraSocial}` : ''}
            </p>
          </button>
        )}

        {/* Notas */}
        <div className="rounded-lg border p-4">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-sm text-muted-foreground">Notas</p>
            {!isReadOnly && !editingNotas && (
              <button
                onClick={() => {
                  setNotas(turno.notas || '')
                  setEditingNotas(true)
                }}
                className="text-sm text-primary hover:underline"
              >
                Editar
              </button>
            )}
          </div>
          {editingNotas ? (
            <div className="flex flex-col gap-2">
              <Input value={notas} onChange={(e) => setNotas(e.target.value)} placeholder="Agregar notas..." />
              <div className="flex gap-2">
                <Button size="sm" onClick={handleSaveNotas}>Guardar</Button>
                <Button size="sm" variant="outline" onClick={() => setEditingNotas(false)}>Cancelar</Button>
              </div>
            </div>
          ) : (
            <p className={turno.notas ? '' : 'text-sm text-muted-foreground'}>
              {turno.notas || 'Sin notas'}
            </p>
          )}
        </div>

        {/* Acciones */}
        {!isReadOnly && (
          <div className="flex flex-col gap-2">
            {turno.estado === 'confirmado' && (
              <>
                <Button onClick={() => setConfirmAction('completado')} className="w-full">
                  Marcar como completado
                </Button>
                <Button variant="outline" onClick={handleReprogramar} className="w-full">
                  Reprogramar
                </Button>
                <Button variant="outline" onClick={() => setConfirmAction('no_asistio')} className="w-full">
                  No asistió
                </Button>
                <Button variant="destructive" onClick={() => setConfirmAction('cancelado')} className="w-full">
                  Cancelar turno
                </Button>
              </>
            )}
            {turno.estado === 'no_asistio' && (
              <Button variant="outline" onClick={handleReprogramar} className="w-full">
                Reprogramar
              </Button>
            )}
          </div>
        )}

        {/* Trazabilidad */}
        {turno.turnoOrigenId && (
          <button
            onClick={() => navigate(`/turnos/${turno.turnoOrigenId}`)}
            className="text-sm text-primary hover:underline"
          >
            Ver turno original
          </button>
        )}
      </div>

      {/* Dialog confirmación */}
      <Dialog open={!!confirmAction} onOpenChange={() => setConfirmAction(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {confirmAction === 'completado' && 'Completar turno'}
              {confirmAction === 'cancelado' && 'Cancelar turno'}
              {confirmAction === 'no_asistio' && 'Marcar como no asistió'}
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            {confirmAction === 'cancelado'
              ? 'Esta acción no se puede deshacer.'
              : 'Se actualizará el estado del turno.'}
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmAction(null)}>
              Volver
            </Button>
            <Button
              variant={confirmAction === 'cancelado' ? 'destructive' : 'default'}
              onClick={() => confirmAction && handleEstado(confirmAction)}
            >
              Confirmar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
