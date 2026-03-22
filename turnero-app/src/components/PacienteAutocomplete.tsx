import { useState, useEffect } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { Search } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { db } from '@/repositories/database'
import type { Paciente } from '@/types'

interface PacienteAutocompleteProps {
  value: string | null // pacienteId
  onChange: (pacienteId: string | null, paciente: Paciente | null) => void
}

export default function PacienteAutocomplete({ value, onChange }: PacienteAutocompleteProps) {
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)

  const paciente = useLiveQuery(
    () => (value ? db.pacientes.get(value) : undefined),
    [value],
  )

  const allPacientes = useLiveQuery(
    () => db.pacientes.orderBy('[apellido+nombre]').toArray(),
    [],
  )

  const [filtered, setFiltered] = useState<Paciente[]>([])

  useEffect(() => {
    if (!allPacientes) return
    if (!query.trim()) {
      setFiltered(allPacientes.slice(0, 10))
      return
    }
    const q = query.toLowerCase().trim()
    setFiltered(
      allPacientes
        .filter(
          (p) =>
            p.nombre.toLowerCase().includes(q) ||
            p.apellido.toLowerCase().includes(q) ||
            p.dni.includes(q),
        )
        .slice(0, 10),
    )
  }, [query, allPacientes])

  if (value && paciente) {
    return (
      <div className="flex items-center justify-between rounded-md border p-3">
        <div>
          <p className="font-medium">{paciente.apellido}, {paciente.nombre}</p>
          <p className="text-xs text-muted-foreground">DNI {paciente.dni}</p>
        </div>
        <button
          type="button"
          onClick={() => {
            onChange(null, null)
            setQuery('')
          }}
          className="text-sm text-destructive hover:underline"
        >
          Cambiar
        </button>
      </div>
    )
  }

  return (
    <div className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Buscar paciente por nombre o DNI..."
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            setOpen(true)
          }}
          onFocus={() => setOpen(true)}
          className="pl-9"
        />
      </div>

      {open && (
        <div className="absolute left-0 right-0 z-10 mt-1 max-h-48 overflow-y-auto rounded-md border bg-popover shadow-md">
          {filtered.length === 0 ? (
            <p className="p-3 text-sm text-muted-foreground">
              {query ? 'Sin resultados' : 'No hay pacientes'}
            </p>
          ) : (
            filtered.map((p) => (
              <button
                key={p.id}
                type="button"
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-accent"
                onClick={() => {
                  onChange(p.id, p)
                  setOpen(false)
                  setQuery('')
                }}
              >
                <span className="font-medium">{p.apellido}, {p.nombre}</span>
                <span className="text-muted-foreground">DNI {p.dni}</span>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  )
}
