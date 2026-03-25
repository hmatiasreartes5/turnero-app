import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { format } from 'date-fns'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { configRepo } from '@/repositories/config.repo'
import BackupManager from '@/components/BackupManager'
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
  const [nuevoDiaBloqueado, setNuevoDiaBloqueado] = useState('')
  const [nuevoPrecioNombre, setNuevoPrecioNombre] = useState('')
  const [nuevoPrecioValor, setNuevoPrecioValor] = useState('')

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

  const agregarDiaBloqueado = async () => {
    if (!nuevoDiaBloqueado) return
    const dias = [...config.diasBloqueados, nuevoDiaBloqueado].sort()
    await configRepo.update({ diasBloqueados: dias })
    setNuevoDiaBloqueado('')
  }

  const quitarDiaBloqueado = async (fecha: string) => {
    await configRepo.update({
      diasBloqueados: config.diasBloqueados.filter((d) => d !== fecha),
    })
  }

  const agregarPrecio = async () => {
    if (!nuevoPrecioNombre || !nuevoPrecioValor) return
    const valor = Number(nuevoPrecioValor)
    if (valor < 0) return
    const precios = { ...config.precios, [nuevoPrecioNombre]: valor }
    await configRepo.update({ precios })
    setNuevoPrecioNombre('')
    setNuevoPrecioValor('')
  }

  const quitarPrecio = async (nombre: string) => {
    const precios = { ...config.precios }
    delete precios[nombre]
    await configRepo.update({ precios })
  }

  return (
    <div className="p-4 pb-24">
      <div className="mb-6 flex items-center gap-2">
        <div className="h-6 w-1 rounded-full bg-primary" />
        <div>
          <h1 className="text-2xl font-bold leading-tight">Configuración</h1>
          <p className="text-xs text-muted-foreground">Ajustes del consultorio</p>
        </div>
      </div>

      {/* Fila 1: Nombre + Duración */}
      <div className="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Card>
          <CardContent className="p-4">
            <label className="mb-2 block text-sm font-semibold">Nombre del profesional</label>
            <Input
              value={config.nombreProfesional}
              onChange={(e) => handleNombre(e.target.value)}
              placeholder="Ej: Dr. Juan Pérez"
            />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <label className="mb-2 block text-sm font-semibold">Duración por defecto</label>
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
          </CardContent>
        </Card>
      </div>

      {/* Fila 2: Días de atención + Días bloqueados */}
      <div className="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Card>
          <CardContent className="p-4">
            <label className="mb-2 block text-sm font-semibold">Días de atención</label>
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
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <label className="mb-2 block text-sm font-semibold">Días bloqueados</label>
            <p className="mb-2 text-xs text-muted-foreground">Feriados, vacaciones, etc.</p>
            <div className="flex gap-2">
              <Input
                type="date"
                value={nuevoDiaBloqueado}
                onChange={(e) => setNuevoDiaBloqueado(e.target.value)}
                className="flex-1"
              />
              <Button size="sm" onClick={agregarDiaBloqueado}>Agregar</Button>
            </div>
            {config.diasBloqueados.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1">
                {config.diasBloqueados.map((fecha) => (
                  <span
                    key={fecha}
                    className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-xs"
                  >
                    {format(new Date(fecha + 'T12:00:00'), 'dd/MM/yyyy')}
                    <button onClick={() => quitarDiaBloqueado(fecha)} className="text-destructive hover:text-destructive/80">
                      &times;
                    </button>
                  </span>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Fila 3: Precios + Backup */}
      <div className="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Card>
          <CardContent className="p-4">
            <label className="mb-2 block text-sm font-semibold">Precios por cobertura</label>
            <div className="flex gap-2">
              <Input
                placeholder="Ej: OSDE"
                value={nuevoPrecioNombre}
                onChange={(e) => setNuevoPrecioNombre(e.target.value)}
                className="flex-1"
              />
              <Input
                type="number"
                min="0"
                placeholder="$"
                value={nuevoPrecioValor}
                onChange={(e) => setNuevoPrecioValor(e.target.value)}
                className="w-24"
              />
              <Button size="sm" onClick={agregarPrecio}>Agregar</Button>
            </div>
            {Object.entries(config.precios).length > 0 && (
              <div className="mt-3 flex flex-col gap-1">
                {Object.entries(config.precios).map(([nombre, valor]) => (
                  <div key={nombre} className="flex items-center justify-between rounded-md border px-3 py-2 text-sm">
                    <span>{nombre}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">${valor.toLocaleString()}</span>
                      <button onClick={() => quitarPrecio(nombre)} className="text-destructive hover:text-destructive/80">
                        &times;
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <BackupManager />
          </CardContent>
        </Card>
      </div>

      {/* Versión */}
      <p className="text-center text-xs text-muted-foreground">
        Turnero v0.1.0
      </p>
    </div>
  )
}
