import Dexie, { type Table } from 'dexie'
import type { Paciente, Turno, Configuracion } from '@/types'

export class TurneroDB extends Dexie {
  pacientes!: Table<Paciente>
  turnos!: Table<Turno>
  configuracion!: Table<Configuracion>

  constructor() {
    super('turnero-offline')
    this.version(1).stores({
      pacientes: 'id, dni, [apellido+nombre]',
      turnos: 'id, pacienteId, fecha, estado, [fecha+horaInicio]',
      configuracion: 'id',
    })
  }
}

export const db = new TurneroDB()
