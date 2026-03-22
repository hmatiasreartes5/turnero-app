import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { configRepo } from '@/repositories/config.repo'
import type { DiaSemana } from '@/types'

const DURACIONES = [15, 30, 45, 60]

const DIAS: { key: DiaSemana; label: string }[] = [
  { key: 'lunes', label: 'Lun' },
  { key: 'martes', label: 'Mar' },
  { key: 'miercoles', label: 'Mié' },
  { key: 'jueves', label: 'Jue' },
  { key: 'viernes', label: 'Vie' },
  { key: 'sabado', label: 'Sáb' },
  { key: 'domingo', label: 'Dom' },
]

export default function Onboarding() {
  const navigate = useNavigate()
  const [step, setStep] = useState(0)
  const [nombre, setNombre] = useState('')
  const [duracion, setDuracion] = useState(30)
  const [diasActivos, setDiasActivos] = useState<Set<DiaSemana>>(
    new Set(['lunes', 'martes', 'miercoles', 'jueves', 'viernes']),
  )

  const toggleDia = (dia: DiaSemana) => {
    const next = new Set(diasActivos)
    if (next.has(dia)) next.delete(dia)
    else next.add(dia)
    setDiasActivos(next)
  }

  const skip = async () => {
    await configRepo.update({ onboardingCompletado: true })
    navigate('/', { replace: true })
  }

  const finish = async () => {
    const config = await configRepo.get()
    const horarios = { ...config.horarios }
    for (const dia of DIAS) {
      horarios[dia.key] = {
        activo: diasActivos.has(dia.key),
        bloques: diasActivos.has(dia.key)
          ? [{ desde: '08:00', hasta: '12:00' }, { desde: '14:00', hasta: '18:00' }]
          : [],
      }
    }
    await configRepo.update({
      nombreProfesional: nombre,
      duracionTurnoMinutos: duracion,
      horarios,
      onboardingCompletado: true,
    })
    navigate('/', { replace: true })
  }

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center p-6">
      <div className="w-full max-w-sm">
        {/* Progress */}
        <div className="mb-8 flex gap-1">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className={`h-1 flex-1 rounded-full ${i <= step ? 'bg-primary' : 'bg-muted'}`}
            />
          ))}
        </div>

        {step === 0 && (
          <div className="flex flex-col gap-4">
            <h1 className="text-2xl font-bold">Bienvenido a Turnero</h1>
            <p className="text-muted-foreground">Tu nombre aparecerá en la app.</p>
            <Input
              placeholder="Ej: Lic. Ana López"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              autoFocus
            />
            <Button onClick={() => setStep(1)} disabled={!nombre.trim()}>
              Siguiente
            </Button>
          </div>
        )}

        {step === 1 && (
          <div className="flex flex-col gap-4">
            <h1 className="text-2xl font-bold">Duración de turnos</h1>
            <p className="text-muted-foreground">Podés cambiarlo después en cada turno.</p>
            <div className="flex gap-2">
              {DURACIONES.map((d) => (
                <button
                  key={d}
                  onClick={() => setDuracion(d)}
                  className={`flex-1 rounded-md border px-2 py-3 text-sm font-medium transition-colors ${
                    duracion === d
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'border-border hover:border-primary'
                  }`}
                >
                  {d} min
                </button>
              ))}
            </div>
            <Button onClick={() => setStep(2)}>Siguiente</Button>
          </div>
        )}

        {step === 2 && (
          <div className="flex flex-col gap-4">
            <h1 className="text-2xl font-bold">Días de atención</h1>
            <p className="text-muted-foreground">Seleccioná los días que atendés.</p>
            <div className="flex gap-1">
              {DIAS.map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => toggleDia(key)}
                  className={`flex-1 rounded-md border py-3 text-xs font-medium transition-colors ${
                    diasActivos.has(key)
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'border-border text-muted-foreground'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
            <Button onClick={finish}>Empezar</Button>
          </div>
        )}

        <button onClick={skip} className="mt-4 w-full text-center text-sm text-muted-foreground hover:underline">
          Configurar después
        </button>
      </div>
    </div>
  )
}
