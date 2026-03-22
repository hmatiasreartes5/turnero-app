import { useLiveQuery } from 'dexie-react-hooks'
import { Input } from '@/components/ui/input'
import { configRepo } from '@/repositories/config.repo'
import type { DiaSemana } from '@/types'

const DIAS: { key: DiaSemana; label: string }[] = [
  { key: 'lunes', label: 'Lunes' },
  { key: 'martes', label: 'Martes' },
  { key: 'miercoles', label: 'Miércoles' },
  { key: 'jueves', label: 'Jueves' },
  { key: 'viernes', label: 'Viernes' },
  { key: 'sabado', label: 'Sábado' },
  { key: 'domingo', label: 'Domingo' },
]

const DURACIONES = [15, 30, 45, 60]

export default function Configuracion() {
  const config = useLiveQuery(() => configRepo.get(), [])

  if (!config) {
    return (
      <div className="flex h-32 items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    )
  }

  const handleNombre = async (nombre: string) => {
    await configRepo.update({ nombreProfesional: nombre })
  }

  const handleDuracion = async (duracion: number) => {
    await configRepo.update({ duracionTurnoMinutos: duracion })
  }

  const toggleDia = async (dia: DiaSemana) => {
    const horarios = { ...config.horarios }
    horarios[dia] = {
      ...horarios[dia],
      activo: !horarios[dia].activo,
      bloques: !horarios[dia].activo
        ? [{ desde: '08:00', hasta: '12:00' }, { desde: '14:00', hasta: '18:00' }]
        : [],
    }
    await configRepo.update({ horarios })
  }

  return (
    <div className="p-4">
      <h1 className="mb-6 text-2xl font-bold">Configuración</h1>

      <div className="flex flex-col gap-6">
        {/* Nombre */}
        <div>
          <label className="mb-1 block text-sm font-medium">Nombre del profesional</label>
          <Input
            value={config.nombreProfesional}
            onChange={(e) => handleNombre(e.target.value)}
            placeholder="Ej: Dr. Juan Pérez"
          />
        </div>

        {/* Duración default */}
        <div>
          <label className="mb-1 block text-sm font-medium">Duración por defecto</label>
          <div className="flex gap-2">
            {DURACIONES.map((d) => (
              <button
                key={d}
                onClick={() => handleDuracion(d)}
                className={`flex-1 rounded-md border px-2 py-1.5 text-sm transition-colors ${
                  config.duracionTurnoMinutos === d
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-border hover:border-primary'
                }`}
              >
                {d} min
              </button>
            ))}
          </div>
        </div>

        {/* Días laborables */}
        <div>
          <label className="mb-2 block text-sm font-medium">Días de atención</label>
          <div className="flex flex-col gap-1">
            {DIAS.map(({ key, label }) => (
              <button
                key={key}
                onClick={() => toggleDia(key)}
                className={`flex items-center justify-between rounded-md border px-3 py-2 text-sm transition-colors ${
                  config.horarios[key].activo
                    ? 'border-primary bg-primary/5'
                    : 'border-border text-muted-foreground'
                }`}
              >
                <span>{label}</span>
                {config.horarios[key].activo && (
                  <span className="text-xs text-muted-foreground">
                    {config.horarios[key].bloques
                      .map((b) => `${b.desde}-${b.hasta}`)
                      .join(', ')}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>


      </div>
    </div>
  )
}
