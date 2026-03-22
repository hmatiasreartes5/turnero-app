import { useEffect, useState } from 'react'
import { getSlotsDisponibles, type Slot } from '@/services/disponibilidad'

interface HorarioSelectorProps {
  fecha: string
  duracion: number
  value: string
  onChange: (hora: string) => void
}

export default function HorarioSelector({ fecha, duracion, value, onChange }: HorarioSelectorProps) {
  const [slots, setSlots] = useState<Slot[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    getSlotsDisponibles(fecha, duracion).then((s) => {
      setSlots(s)
      setLoading(false)
    })
  }, [fecha, duracion])

  if (loading) {
    return <p className="text-sm text-muted-foreground">Cargando horarios...</p>
  }

  if (slots.length === 0) {
    return <p className="text-sm text-destructive">No hay horarios disponibles para este día</p>
  }

  return (
    <div className="grid grid-cols-4 gap-2">
      {slots.map((slot) => (
        <button
          key={slot.horaInicio}
          type="button"
          onClick={() => onChange(slot.horaInicio)}
          className={`rounded-md border px-2 py-1.5 text-sm transition-colors ${
            value === slot.horaInicio
              ? 'border-primary bg-primary text-primary-foreground'
              : 'border-border hover:border-primary'
          }`}
        >
          {slot.horaInicio}
        </button>
      ))}
    </div>
  )
}
