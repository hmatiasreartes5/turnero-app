import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { ArrowLeft, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { db } from '@/repositories/database'
import { pacienteRepo } from '@/repositories/paciente.repo'
import type { EstadoTurno } from '@/types'

const estadoLabels: Record<EstadoTurno, string> = {
  confirmado: 'Confirmado',
  completado: 'Completado',
  cancelado: 'Cancelado',
  no_asistio: 'No asistió',
}

export default function FichaPaciente() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [editing, setEditing] = useState(false)
  const [error, setError] = useState('')

  const paciente = useLiveQuery(() => (id ? db.pacientes.get(id) : undefined), [id])
  const turnos = useLiveQuery(
    () => (id ? db.turnos.where('pacienteId').equals(id).reverse().sortBy('fecha') : []),
    [id],
  )

  const [form, setForm] = useState({
    nombre: '',
    apellido: '',
    dni: '',
    telefono: '',
    email: '',
    obraSocial: '',
    numeroAfiliado: '',
    notas: '',
  })

  const startEdit = () => {
    if (!paciente) return
    setForm({
      nombre: paciente.nombre,
      apellido: paciente.apellido,
      dni: paciente.dni,
      telefono: paciente.telefono,
      email: paciente.email || '',
      obraSocial: paciente.obraSocial || '',
      numeroAfiliado: paciente.numeroAfiliado || '',
      notas: paciente.notas || '',
    })
    setEditing(true)
    setError('')
  }

  const handleSave = async () => {
    if (!id || !paciente) return
    setError('')

    if (!form.nombre || !form.apellido || !form.dni || !form.telefono) {
      setError('Nombre, apellido, DNI y teléfono son obligatorios')
      return
    }

    if (form.dni !== paciente.dni) {
      const exists = await pacienteRepo.existeDni(form.dni, id)
      if (exists) {
        setError('Ya existe un paciente con ese DNI')
        return
      }
    }

    await pacienteRepo.update(id, {
      nombre: form.nombre,
      apellido: form.apellido,
      dni: form.dni,
      telefono: form.telefono,
      email: form.email || undefined,
      obraSocial: form.obraSocial || undefined,
      numeroAfiliado: form.numeroAfiliado || undefined,
      notas: form.notas || undefined,
    })
    setEditing(false)
  }

  if (!paciente) {
    return (
      <div className="flex h-dvh items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="min-h-dvh bg-background">
      <header className="sticky top-0 z-10 flex items-center gap-3 border-b bg-background/95 p-4 backdrop-blur-sm">
        <button onClick={() => navigate(-1)}>
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="text-lg font-bold">Ficha del paciente</h1>
      </header>

      <div className="flex flex-col gap-5 p-4">
        {/* Datos */}
        {editing ? (
          <div className="flex flex-col gap-3 rounded-lg border p-4">
            <Input placeholder="Nombre *" value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} />
            <Input placeholder="Apellido *" value={form.apellido} onChange={(e) => setForm({ ...form, apellido: e.target.value })} />
            <Input placeholder="DNI *" value={form.dni} onChange={(e) => setForm({ ...form, dni: e.target.value })} />
            <Input placeholder="Teléfono *" value={form.telefono} onChange={(e) => setForm({ ...form, telefono: e.target.value })} />
            <Input placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            <Input placeholder="Obra social" value={form.obraSocial} onChange={(e) => setForm({ ...form, obraSocial: e.target.value })} />
            <Input placeholder="N° de afiliado" value={form.numeroAfiliado} onChange={(e) => setForm({ ...form, numeroAfiliado: e.target.value })} />
            <Input placeholder="Notas clínicas" value={form.notas} onChange={(e) => setForm({ ...form, notas: e.target.value })} />
            {error && <p className="text-sm text-destructive">{error}</p>}
            <div className="flex gap-2">
              <Button onClick={handleSave}>Guardar</Button>
              <Button variant="outline" onClick={() => setEditing(false)}>Cancelar</Button>
            </div>
          </div>
        ) : (
          <div className="rounded-lg border p-4">
            <div className="mb-3 flex items-start justify-between">
              <div>
                <h2 className="text-xl font-bold">{paciente.apellido}, {paciente.nombre}</h2>
                <p className="text-sm text-muted-foreground">DNI {paciente.dni}</p>
              </div>
              <Button size="sm" variant="outline" onClick={startEdit}>Editar</Button>
            </div>
            <div className="flex flex-col gap-1 text-sm">
              <p>Tel: {paciente.telefono}</p>
              {paciente.email && <p>Email: {paciente.email}</p>}
              {paciente.obraSocial && <p>Obra social: {paciente.obraSocial}{paciente.numeroAfiliado ? ` (${paciente.numeroAfiliado})` : ''}</p>}
              {paciente.notas && (
                <p className="mt-2 text-muted-foreground">Notas: {paciente.notas}</p>
              )}
            </div>
          </div>
        )}

        {/* Acción rápida */}
        <Button onClick={() => navigate(`/turnos/nuevo?pacienteId=${id}`)} className="w-full">
          <Plus className="mr-2 h-4 w-4" />
          Agendar turno
        </Button>

        {/* Historial */}
        <div>
          <h3 className="mb-3 text-lg font-semibold">Historial de turnos</h3>
          {!turnos ? (
            <div className="flex h-20 items-center justify-center">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            </div>
          ) : turnos.length === 0 ? (
            <p className="text-sm text-muted-foreground">Sin turnos registrados</p>
          ) : (
            <div className="flex flex-col gap-2">
              {turnos.map((t) => (
                <Card
                  key={t.id}
                  className="cursor-pointer transition-shadow hover:shadow-md"
                  onClick={() => navigate(`/turnos/${t.id}`)}
                >
                  <CardContent className="flex items-center justify-between p-3">
                    <div>
                      <p className="text-sm font-medium capitalize">
                        {format(new Date(t.fecha + 'T12:00:00'), "EEE d MMM yyyy", { locale: es })}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {t.horaInicio} — {t.horaFin}
                      </p>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {estadoLabels[t.estado]}
                    </span>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
