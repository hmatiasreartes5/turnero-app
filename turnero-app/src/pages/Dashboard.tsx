import { useNavigate } from 'react-router-dom'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import TurnoCard from '@/components/TurnoCard'
import { useTurnosDelDia } from '@/hooks/useTurnosDelDia'

export default function Dashboard() {
  const navigate = useNavigate()
  const hoy = format(new Date(), 'yyyy-MM-dd')
  const turnos = useTurnosDelDia(hoy)

  const turnosActivos = turnos?.filter((t) => t.estado !== 'cancelado')
  const fechaDisplay = format(new Date(), "EEEE d 'de' MMMM", { locale: es })

  return (
    <div className="p-4">
      <div className="mb-4">
        <h1 className="text-2xl font-bold capitalize">{fechaDisplay}</h1>
        {turnosActivos && (
          <p className="text-sm text-muted-foreground">
            {turnosActivos.length === 0
              ? 'No tenés turnos para hoy'
              : `${turnosActivos.length} turno${turnosActivos.length !== 1 ? 's' : ''} hoy`}
          </p>
        )}
      </div>

      {!turnos ? (
        <div className="flex h-32 items-center justify-center">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      ) : turnosActivos && turnosActivos.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-12 text-center">
          <p className="text-muted-foreground">Tu agenda está libre</p>
          <Button onClick={() => navigate('/turnos/nuevo')}>Agendar turno</Button>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {turnos
            .filter((t) => t.estado !== 'cancelado')
            .map((turno) => (
              <TurnoCard key={turno.id} turno={turno} />
            ))}
        </div>
      )}

      {turnosActivos && turnosActivos.length > 0 && (
        <Button
          size="icon"
          className="fixed bottom-20 right-4 z-40 h-14 w-14 rounded-full shadow-lg"
          onClick={() => navigate('/turnos/nuevo')}
        >
          <Plus className="h-6 w-6" />
        </Button>
      )}
    </div>
  )
}
