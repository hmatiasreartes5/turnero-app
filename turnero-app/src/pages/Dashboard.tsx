import { useMemo, useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  format,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  differenceInMinutes,
  addDays,
  eachDayOfInterval,
} from 'date-fns'
import { es } from 'date-fns/locale'
import { useLiveQuery } from 'dexie-react-hooks'
import {
  Plus,
  CalendarDays,
  Users,
  Clock,
  TrendingUp,
  PieChart,
  XCircle,
  BarChart3,
  DollarSign,
  CalendarCheck,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import TurnoCard from '@/components/TurnoCard'
import BackupReminder from '@/components/BackupReminder'
import { useTurnosDelDia } from '@/hooks/useTurnosDelDia'
import { db } from '@/repositories/database'
import { configRepo } from '@/repositories/config.repo'
import { getSlotsDisponibles } from '@/services/disponibilidad'
import { getDiaSemana } from '@/utils/dates'
import type { DiaSemana } from '@/types'

const DIA_LABELS: Record<DiaSemana, string> = {
  lunes: 'Lunes',
  martes: 'Martes',
  miercoles: 'Miércoles',
  jueves: 'Jueves',
  viernes: 'Viernes',
  sabado: 'Sábado',
  domingo: 'Domingo',
}

export default function Dashboard() {
  const navigate = useNavigate()
  const ahora = new Date()
  const hoy = format(ahora, 'yyyy-MM-dd')
  const turnos = useTurnosDelDia(hoy)
  const config = useLiveQuery(() => configRepo.get(), [])

  // Turnos de la semana
  const inicioSemana = format(startOfWeek(ahora, { weekStartsOn: 1 }), 'yyyy-MM-dd')
  const finSemana = format(endOfWeek(ahora, { weekStartsOn: 1 }), 'yyyy-MM-dd')
  const turnosSemana = useLiveQuery(
    () => db.turnos.where('fecha').between(inicioSemana, finSemana, true, true).toArray(),
    [inicioSemana, finSemana],
  )

  // Turnos del mes
  const inicioMes = format(startOfMonth(ahora), 'yyyy-MM-dd')
  const finMes = format(endOfMonth(ahora), 'yyyy-MM-dd')
  const turnosMes = useLiveQuery(
    () => db.turnos.where('fecha').between(inicioMes, finMes, true, true).toArray(),
    [inicioMes, finMes],
  )

  // Todos los turnos (para día más demandado)
  const todosTurnos = useLiveQuery(() => db.turnos.toArray(), [])

  // Todos los pacientes (para obra social)
  const todosPacientes = useLiveQuery(() => db.pacientes.toArray(), [])

  // Total pacientes
  const totalPacientes = useLiveQuery(() => db.pacientes.count(), [])

  const turnosActivos = turnos?.filter((t) => t.estado !== 'cancelado')
  const fechaDisplay = format(ahora, "EEEE d 'de' MMMM", { locale: es })

  // Próximo turno
  const proximoTurno = useMemo(() => {
    if (!turnosActivos) return null
    const horaActual = format(ahora, 'HH:mm')
    return turnosActivos.find((t) => t.horaInicio > horaActual && t.estado === 'confirmado') || null
  }, [turnosActivos, ahora])

  const minutosParaProximo = useMemo(() => {
    if (!proximoTurno) return null
    const [h, m] = proximoTurno.horaInicio.split(':').map(Number)
    const turnoDate = new Date(ahora)
    turnoDate.setHours(h, m, 0, 0)
    return differenceInMinutes(turnoDate, ahora)
  }, [proximoTurno, ahora])

  // Stats semana
  const statsSemana = useMemo(() => {
    if (!turnosSemana) return null
    const completados = turnosSemana.filter((t) => t.estado === 'completado').length
    const noAsistio = turnosSemana.filter((t) => t.estado === 'no_asistio').length
    const total = completados + noAsistio
    const asistencia = total > 0 ? Math.round((completados / total) * 100) : null
    return {
      total: turnosSemana.filter((t) => t.estado !== 'cancelado').length,
      completados,
      asistencia,
    }
  }, [turnosSemana])

  // === NUEVAS STATS ===

  // 1. Ocupación semanal
  const [ocupacionSemana, setOcupacionSemana] = useState<number | null>(null)
  useEffect(() => {
    if (!config || !turnosSemana) return
    const calcular = async () => {
      const dias = eachDayOfInterval({
        start: startOfWeek(ahora, { weekStartsOn: 1 }),
        end: endOfWeek(ahora, { weekStartsOn: 1 }),
      })
      let totalSlots = 0
      for (const dia of dias) {
        const fecha = format(dia, 'yyyy-MM-dd')
        const diaKey = getDiaSemana(fecha)
        const horario = config.horarios[diaKey]
        if (!horario.activo || config.diasBloqueados.includes(fecha)) continue
        for (const bloque of horario.bloques) {
          const desde = parseInt(bloque.desde.split(':')[0]) * 60 + parseInt(bloque.desde.split(':')[1])
          const hasta = parseInt(bloque.hasta.split(':')[0]) * 60 + parseInt(bloque.hasta.split(':')[1])
          totalSlots += Math.floor((hasta - desde) / config.duracionTurnoMinutos)
        }
      }
      const turnosActivosSemana = turnosSemana.filter((t) => t.estado !== 'cancelado').length
      setOcupacionSemana(totalSlots > 0 ? Math.round((turnosActivosSemana / totalSlots) * 100) : null)
    }
    calcular()
  }, [config, turnosSemana])

  // 2. Distribución por obra social (mes)
  const distribucionOS = useMemo(() => {
    if (!turnosMes || !todosPacientes) return null
    const pacientesMap = new Map(todosPacientes.map((p) => [p.id, p]))
    const conteo: Record<string, number> = {}
    const activosMes = turnosMes.filter((t) => t.estado !== 'cancelado')
    for (const t of activosMes) {
      const pac = pacientesMap.get(t.pacienteId)
      const os = pac?.obraSocial || 'Particular'
      conteo[os] = (conteo[os] || 0) + 1
    }
    const total = activosMes.length
    if (total === 0) return null
    return Object.entries(conteo)
      .sort((a, b) => b[1] - a[1])
      .map(([nombre, cantidad]) => ({
        nombre,
        cantidad,
        porcentaje: Math.round((cantidad / total) * 100),
      }))
  }, [turnosMes, todosPacientes])

  // 3. Próximos turnos libres
  const [proximosLibres, setProximosLibres] = useState<{ fecha: string; hora: string }[]>([])
  useEffect(() => {
    if (!config) return
    const buscar = async () => {
      const libres: { fecha: string; hora: string }[] = []
      let dia = new Date(ahora)
      const horaActual = format(ahora, 'HH:mm')
      for (let i = 0; i < 14 && libres.length < 3; i++) {
        const fecha = format(dia, 'yyyy-MM-dd')
        const slots = await getSlotsDisponibles(fecha)
        for (const slot of slots) {
          if (fecha === hoy && slot.horaInicio <= horaActual) continue
          libres.push({ fecha, hora: slot.horaInicio })
          if (libres.length >= 3) break
        }
        dia = addDays(dia, 1)
      }
      setProximosLibres(libres)
    }
    buscar()
  }, [config, turnos])

  // 4. Tasa de cancelación (mes)
  const tasaCancelacion = useMemo(() => {
    if (!turnosMes) return null
    const cancelados = turnosMes.filter((t) => t.estado === 'cancelado').length
    const noAsistio = turnosMes.filter((t) => t.estado === 'no_asistio').length
    const total = turnosMes.length
    if (total === 0) return null
    return Math.round(((cancelados + noAsistio) / total) * 100)
  }, [turnosMes])

  // 5. Día más demandado
  const diaMasDemandado = useMemo(() => {
    if (!todosTurnos || todosTurnos.length === 0) return null
    const conteo: Record<DiaSemana, number> = {
      lunes: 0, martes: 0, miercoles: 0, jueves: 0, viernes: 0, sabado: 0, domingo: 0,
    }
    for (const t of todosTurnos) {
      if (t.estado === 'cancelado') continue
      const dia = getDiaSemana(t.fecha)
      conteo[dia]++
    }
    const max = Object.entries(conteo).sort((a, b) => b[1] - a[1])[0]
    return max[1] > 0 ? { dia: DIA_LABELS[max[0] as DiaSemana], cantidad: max[1] } : null
  }, [todosTurnos])

  // 6. Facturación estimada del mes
  const facturacionMes = useMemo(() => {
    if (!turnosMes || !todosPacientes || !config) return null
    const pacientesMap = new Map(todosPacientes.map((p) => [p.id, p]))
    let total = 0
    const completados = turnosMes.filter((t) => t.estado === 'completado')
    for (const t of completados) {
      const pac = pacientesMap.get(t.pacienteId)
      const os = pac?.obraSocial || 'Particular'
      const precio = config.precios[os] ?? 0
      total += precio
    }
    return total
  }, [turnosMes, todosPacientes, config])

  return (
    <div className="p-4 pb-24">
      <BackupReminder />

      {/* Saludo + fecha */}
      <div className="mb-5">
        {config?.nombreProfesional && (
          <p className="text-sm text-muted-foreground">
            Hola, {config.nombreProfesional}
          </p>
        )}
        <h1 className="text-2xl font-bold capitalize">{fechaDisplay}</h1>
      </div>

      {/* Próximo turno destacado */}
      {proximoTurno && minutosParaProximo !== null && minutosParaProximo > 0 && (
        <Card
          className="mb-5 cursor-pointer border-primary/30 bg-primary/5"
          onClick={() => navigate(`/turnos/${proximoTurno.id}`)}
        >
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
              <Clock className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-primary">Próximo turno</p>
              <p className="truncate font-semibold">{proximoTurno.horaInicio} hs</p>
              <p className="text-xs text-muted-foreground">
                en {minutosParaProximo < 60
                  ? `${minutosParaProximo} min`
                  : `${Math.floor(minutosParaProximo / 60)}h ${minutosParaProximo % 60}min`}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Turnos del día */}
      <div className="mb-5">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-5 w-1 rounded-full bg-primary" />
            <div>
              <h2 className="text-lg font-semibold leading-tight">Hoy</h2>
              <p className="text-xs text-muted-foreground">Tu agenda del día</p>
            </div>
          </div>
          {turnosActivos && (
            <span className="text-sm text-muted-foreground">
              {turnosActivos.length} turno{turnosActivos.length !== 1 ? 's' : ''}
            </span>
          )}
        </div>

        {!turnos ? (
          <div className="flex h-32 items-center justify-center">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        ) : turnosActivos && turnosActivos.length === 0 ? (
          <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed py-8 text-center">
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
      </div>

      {/* Stats rápidas de la semana */}
      <div className="mb-5">
        <div className="mb-3 flex items-center gap-2">
          <div className="h-5 w-1 rounded-full bg-primary" />
          <div>
            <h2 className="text-lg font-semibold leading-tight">Esta semana</h2>
            <p className="text-xs text-muted-foreground">Resumen de actividad</p>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <Card>
            <CardContent className="flex flex-col items-center p-3">
              <CalendarDays className="mb-1 h-5 w-5 text-muted-foreground" />
              <span className="text-xl font-bold">{statsSemana?.total ?? '-'}</span>
              <span className="text-[11px] text-muted-foreground">Turnos</span>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex flex-col items-center p-3">
              <Users className="mb-1 h-5 w-5 text-muted-foreground" />
              <span className="text-xl font-bold">{totalPacientes ?? '-'}</span>
              <span className="text-[11px] text-muted-foreground">Pacientes</span>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex flex-col items-center p-3">
              <TrendingUp className="mb-1 h-5 w-5 text-muted-foreground" />
              <span className="text-xl font-bold">
                {statsSemana?.asistencia !== null && statsSemana?.asistencia !== undefined
                  ? `${statsSemana.asistencia}%`
                  : '-'}
              </span>
              <span className="text-[11px] text-muted-foreground">Asistencia</span>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Stats detalladas */}
      <div className="mb-5">
        <div className="mb-3 flex items-center gap-2">
          <div className="h-5 w-1 rounded-full bg-primary" />
          <div>
            <h2 className="text-lg font-semibold leading-tight">Estadísticas</h2>
            <p className="text-xs text-muted-foreground">Métricas de tu consultorio</p>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">

          {/* Ocupación semanal */}
          <Card>
            <CardContent className="p-4">
              <div className="mb-2 flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-primary" />
                <span className="text-sm font-semibold">Ocupación semanal</span>
              </div>
              {ocupacionSemana !== null ? (
                <>
                  <div className="mb-1 flex items-end gap-1">
                    <span className="text-3xl font-bold">{ocupacionSemana}%</span>
                    <span className="mb-1 text-xs text-muted-foreground">de tu agenda</span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-primary transition-all"
                      style={{ width: `${Math.min(ocupacionSemana, 100)}%` }}
                    />
                  </div>
                </>
              ) : (
                <p className="text-sm text-muted-foreground">Sin datos</p>
              )}
            </CardContent>
          </Card>

          {/* Tasa de cancelación (mes) */}
          <Card>
            <CardContent className="p-4">
              <div className="mb-2 flex items-center gap-2">
                <XCircle className="h-4 w-4 text-destructive" />
                <span className="text-sm font-semibold">Cancelaciones del mes</span>
              </div>
              {tasaCancelacion !== null ? (
                <>
                  <div className="mb-1 flex items-end gap-1">
                    <span className="text-3xl font-bold">{tasaCancelacion}%</span>
                    <span className="mb-1 text-xs text-muted-foreground">cancelados + ausencias</span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-destructive/70 transition-all"
                      style={{ width: `${Math.min(tasaCancelacion, 100)}%` }}
                    />
                  </div>
                </>
              ) : (
                <p className="text-sm text-muted-foreground">Sin datos este mes</p>
              )}
            </CardContent>
          </Card>

          {/* Próximos turnos libres */}
          <Card>
            <CardContent className="p-4">
              <div className="mb-2 flex items-center gap-2">
                <CalendarCheck className="h-4 w-4 text-primary" />
                <span className="text-sm font-semibold">Próximos libres</span>
              </div>
              {proximosLibres.length > 0 ? (
                <div className="flex flex-col gap-1.5">
                  {proximosLibres.map((slot, i) => (
                    <button
                      key={i}
                      onClick={() => navigate(`/turnos/nuevo?fecha=${slot.fecha}&hora=${slot.hora}`)}
                      className="flex items-center justify-between rounded-md border px-3 py-1.5 text-sm transition-colors hover:border-primary hover:bg-primary/5"
                    >
                      <span className="capitalize">
                        {slot.fecha === hoy
                          ? 'Hoy'
                          : format(new Date(slot.fecha + 'T12:00:00'), "EEE d MMM", { locale: es })}
                      </span>
                      <span className="font-medium">{slot.hora} hs</span>
                    </button>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No hay slots disponibles próximamente</p>
              )}
            </CardContent>
          </Card>

          {/* Día más demandado */}
          <Card>
            <CardContent className="p-4">
              <div className="mb-2 flex items-center gap-2">
                <PieChart className="h-4 w-4 text-primary" />
                <span className="text-sm font-semibold">Día más demandado</span>
              </div>
              {diaMasDemandado ? (
                <div className="flex items-end gap-1">
                  <span className="text-3xl font-bold">{diaMasDemandado.dia}</span>
                  <span className="mb-1 text-xs text-muted-foreground">{diaMasDemandado.cantidad} turnos</span>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Sin datos</p>
              )}
            </CardContent>
          </Card>

          {/* Distribución por obra social */}
          <Card>
            <CardContent className="p-4">
              <div className="mb-2 flex items-center gap-2">
                <PieChart className="h-4 w-4 text-primary" />
                <span className="text-sm font-semibold">Obras sociales (mes)</span>
              </div>
              {distribucionOS ? (
                <div className="flex flex-col gap-1.5">
                  {distribucionOS.map((os) => (
                    <div key={os.nombre}>
                      <div className="flex items-center justify-between text-sm">
                        <span>{os.nombre}</span>
                        <span className="text-muted-foreground">{os.porcentaje}%</span>
                      </div>
                      <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full rounded-full bg-primary/60 transition-all"
                          style={{ width: `${os.porcentaje}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Sin datos este mes</p>
              )}
            </CardContent>
          </Card>

          {/* Facturación estimada */}
          <Card>
            <CardContent className="p-4">
              <div className="mb-2 flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-primary" />
                <span className="text-sm font-semibold">Facturación del mes</span>
              </div>
              {facturacionMes !== null ? (
                <div className="flex items-end gap-1">
                  <span className="text-3xl font-bold">
                    ${facturacionMes.toLocaleString('es-AR')}
                  </span>
                  <span className="mb-1 text-xs text-muted-foreground">
                    estimado ({turnosMes?.filter((t) => t.estado === 'completado').length} completados)
                  </span>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Sin datos este mes</p>
              )}
            </CardContent>
          </Card>

        </div>
      </div>

      {/* FAB */}
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
