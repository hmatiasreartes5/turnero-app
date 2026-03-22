import { useNavigate } from 'react-router-dom'
import { Search, Plus } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { usePacienteSearch } from '@/hooks/usePacienteSearch'

export default function Pacientes() {
  const navigate = useNavigate()
  const { query, setQuery, pacientes } = usePacienteSearch()

  return (
    <div className="p-4">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Pacientes</h1>
        <Button size="icon" variant="outline" onClick={() => navigate('/turnos/nuevo')}>
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Buscar por nombre o DNI..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="pl-9"
        />
      </div>

      {!pacientes ? (
        <div className="flex h-32 items-center justify-center">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      ) : pacientes.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-12 text-center">
          <p className="text-muted-foreground">
            {query ? 'Sin resultados' : 'No hay pacientes registrados'}
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-1">
          {pacientes.map((p) => (
            <button
              key={p.id}
              onClick={() => navigate(`/pacientes/${p.id}`)}
              className="flex items-center gap-3 rounded-lg p-3 text-left transition-colors hover:bg-accent"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-sm font-medium text-primary">
                {p.apellido[0]}{p.nombre[0]}
              </div>
              <div className="flex-1 min-w-0">
                <p className="truncate font-medium">{p.apellido}, {p.nombre}</p>
                <p className="text-xs text-muted-foreground">
                  DNI {p.dni}{p.obraSocial ? ` · ${p.obraSocial}` : ''}
                </p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
