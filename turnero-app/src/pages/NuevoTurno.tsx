import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { format } from 'date-fns'
import { ArrowLeft, UserPlus } from 'lucide-react'
import { useLiveQuery } from 'dexie-react-hooks'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import HorarioSelector from '@/components/HorarioSelector'
import PacienteAutocomplete from '@/components/PacienteAutocomplete'
import { turnoRepo } from '@/repositories/turno.repo'
import { pacienteRepo } from '@/repositories/paciente.repo'
import { configRepo } from '@/repositories/config.repo'
import { minutosToHora, horaToMinutos } from '@/utils/dates'

const DURACIONES = [15, 30, 45, 60]

export default function NuevoTurno() {
  const navigate = useNavigate()
  const [params] = useSearchParams()

  const config = useLiveQuery(() => configRepo.get(), [])

  const [fecha, setFecha] = useState(params.get('fecha') || format(new Date(), 'yyyy-MM-dd'))
  const [horaInicio, setHoraInicio] = useState(params.get('hora') || '')
  const [duracion, setDuracion] = useState(config?.duracionTurnoMinutos || 30)
  const [pacienteId, setPacienteId] = useState<string | null>(params.get('pacienteId'))
  const [mostrarNuevoPaciente, setMostrarNuevoPaciente] = useState(false)
  const [notas, setNotas] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  // Nuevo paciente inline
  const [npNombre, setNpNombre] = useState('')
  const [npApellido, setNpApellido] = useState('')
  const [npDni, setNpDni] = useState('')
  const [npTelefono, setNpTelefono] = useState('')
  const [npObraSocial, setNpObraSocial] = useState('')

  const handleSubmit = async () => {
    setError('')

    if (!fecha || !horaInicio) {
      setError('Seleccioná fecha y horario')
      return
    }

    let finalPacienteId = pacienteId

    if (!finalPacienteId && !mostrarNuevoPaciente) {
      setError('Seleccioná un paciente o creá uno nuevo')
      return
    }

    setSaving(true)

    try {
      // Crear paciente nuevo si es necesario
      if (!finalPacienteId && mostrarNuevoPaciente) {
        if (!npNombre || !npApellido || !npDni || !npTelefono) {
          setError('Completá todos los campos del paciente')
          setSaving(false)
          return
        }

        const dniExiste = await pacienteRepo.existeDni(npDni)
        if (dniExiste) {
          setError('Ya existe un paciente con ese DNI')
          setSaving(false)
          return
        }

        const nuevoPaciente = await pacienteRepo.create({
          nombre: npNombre,
          apellido: npApellido,
          dni: npDni,
          telefono: npTelefono,
          obraSocial: npObraSocial || undefined,
        })
        finalPacienteId = nuevoPaciente.id
      }

      const horaFin = minutosToHora(horaToMinutos(horaInicio) + duracion)

      await turnoRepo.create({
        pacienteId: finalPacienteId!,
        fecha,
        horaInicio,
        horaFin,
        duracionMinutos: duracion,
        estado: 'confirmado',
        notas: notas || undefined,
      })

      navigate(-1)
    } catch (err) {
      setError('Error al crear el turno')
      setSaving(false)
    }
  }

  return (
    <div className="min-h-dvh bg-background">
      <header className="sticky top-0 z-10 flex items-center gap-3 border-b bg-background/95 p-4 backdrop-blur-sm">
        <button onClick={() => navigate(-1)}>
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div className="flex items-center gap-2">
          <div className="h-5 w-1 rounded-full bg-primary" />
          <div>
            <h1 className="text-lg font-bold leading-tight">Nuevo turno</h1>
            <p className="text-[11px] text-muted-foreground">Agendar cita</p>
          </div>
        </div>
      </header>

      <div className="flex flex-col gap-4 p-4 pb-24">
        {/* Fila 1: Fecha + Duración */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Card>
            <CardContent className="p-4">
              <label className="mb-2 block text-sm font-semibold">Fecha</label>
              <Input
                type="date"
                value={fecha}
                onChange={(e) => {
                  setFecha(e.target.value)
                  setHoraInicio('')
                }}
              />
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <label className="mb-2 block text-sm font-semibold">Duración</label>
              <div className="flex gap-2">
                {DURACIONES.map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => {
                      setDuracion(d)
                      setHoraInicio('')
                    }}
                    className={`flex-1 rounded-md border px-2 py-1.5 text-sm transition-colors ${
                      duracion === d
                        ? 'border-primary bg-primary text-primary-foreground'
                        : 'border-border hover:border-primary'
                    }`}
                  >
                    {d} min
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Horario */}
        <Card>
          <CardContent className="p-4">
            <label className="mb-2 block text-sm font-semibold">Horario</label>
            {fecha ? (
              <HorarioSelector
                fecha={fecha}
                duracion={duracion}
                value={horaInicio}
                onChange={setHoraInicio}
              />
            ) : (
              <p className="text-sm text-muted-foreground">Seleccioná una fecha primero</p>
            )}
          </CardContent>
        </Card>

        {/* Fila 3: Paciente + Notas */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Card className="overflow-visible">
            <CardContent className="p-4">
              <label className="mb-2 block text-sm font-semibold">Paciente</label>

              {/* Botón crear paciente primero, bien visible */}
              {!pacienteId && !mostrarNuevoPaciente && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setMostrarNuevoPaciente(true)}
                  className="mb-3 w-full border-primary text-primary hover:bg-primary/10"
                >
                  <UserPlus className="mr-2 h-4 w-4" />
                  Crear paciente nuevo
                </Button>
              )}

              {/* Buscador */}
              {!mostrarNuevoPaciente && (
                <PacienteAutocomplete
                  value={pacienteId}
                  onChange={(id) => {
                    setPacienteId(id)
                    setMostrarNuevoPaciente(false)
                  }}
                />
              )}

              {/* Formulario nuevo paciente inline */}
              {mostrarNuevoPaciente && !pacienteId && (
                <div className="rounded-lg border border-primary/30 bg-primary/5 p-3">
                  <div className="mb-3 flex items-center justify-between">
                    <p className="text-sm font-semibold">Nuevo paciente</p>
                    <button
                      type="button"
                      onClick={() => setMostrarNuevoPaciente(false)}
                      className="text-xs text-muted-foreground hover:underline"
                    >
                      Cancelar
                    </button>
                  </div>
                  <div className="flex flex-col gap-2">
                    <Input placeholder="Nombre *" value={npNombre} onChange={(e) => setNpNombre(e.target.value)} />
                    <Input placeholder="Apellido *" value={npApellido} onChange={(e) => setNpApellido(e.target.value)} />
                    <Input placeholder="DNI *" value={npDni} onChange={(e) => setNpDni(e.target.value)} />
                    <Input placeholder="Teléfono *" value={npTelefono} onChange={(e) => setNpTelefono(e.target.value)} />
                    <Input placeholder="Obra social (opcional)" value={npObraSocial} onChange={(e) => setNpObraSocial(e.target.value)} />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <label className="mb-2 block text-sm font-semibold">Notas (opcional)</label>
              <Input
                placeholder="Ej: dolor lumbar, primera sesión..."
                value={notas}
                onChange={(e) => setNotas(e.target.value)}
              />
            </CardContent>
          </Card>
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}
      </div>

      {/* Footer fijo */}
      <div className="fixed bottom-0 left-0 right-0 z-40 flex justify-center border-t bg-background/95 p-4 backdrop-blur-sm">
        <Button onClick={handleSubmit} disabled={saving} className="w-full max-w-xs">
          {saving ? 'Guardando...' : 'Confirmar turno'}
        </Button>
      </div>
    </div>
  )
}
