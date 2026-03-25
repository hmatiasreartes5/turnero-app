import { useNavigate } from 'react-router-dom'
import { Search, Plus } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { usePacienteSearch } from '@/hooks/usePacienteSearch'

export default function Pacientes() {
  const navigate = useNavigate()
  const { query, setQuery, pacientes } = usePacienteSearch()

  return (
    <div className="p-4">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-6 w-1 rounded-full bg-primary" />
          <div>
            <h1 className="text-2xl font-bold leading-tight">Pacientes</h1>
            <p className="text-xs text-muted-foreground">Listado y fichas</p>
          </div>
        </div>
        <Button size="sm" onClick={() => navigate('/turnos/nuevo')}>
          <Plus className="mr-1 h-4 w-4" />
          Agregar paciente
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
        <div className="flex flex-col gap-2">
          {pacientes.map((p) => (
            <Card
              key={p.id}
              className="cursor-pointer transition-shadow hover:shadow-md"
              onClick={() => navigate(`/pacientes/${p.id}`)}
            >
              <CardContent className="flex items-center gap-3 p-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-medium text-primary">
                  {p.apellido[0]}{p.nombre[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="truncate font-medium">{p.apellido}, {p.nombre}</p>
                  <p className="text-xs text-muted-foreground">
                    DNI {p.dni}{p.obraSocial ? ` · ${p.obraSocial}` : ''}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
