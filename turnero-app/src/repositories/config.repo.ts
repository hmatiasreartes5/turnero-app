import { db } from './database'
import type { Configuracion, HorarioDia } from '@/types'

const diaInactivo: HorarioDia = { activo: false, bloques: [] }
const diaActivo: HorarioDia = {
  activo: true,
  bloques: [{ desde: '08:00', hasta: '12:00' }, { desde: '14:00', hasta: '18:00' }],
}

const DEFAULT_CONFIG: Configuracion = {
  id: 1,
  nombreProfesional: '',
  duracionTurnoMinutos: 30,
  horarios: {
    lunes: diaActivo,
    martes: diaActivo,
    miercoles: diaActivo,
    jueves: diaActivo,
    viernes: diaActivo,
    sabado: diaInactivo,
    domingo: diaInactivo,
  },
  diasBloqueados: [],
  precios: {},
  onboardingCompletado: false,
}

export const configRepo = {
  async get(): Promise<Configuracion> {
    const config = await db.configuracion.get(1)
    if (!config) {
      return this.initDefaults()
    }
    return config
  },

  async update(data: Partial<Omit<Configuracion, 'id'>>): Promise<void> {
    const exists = await db.configuracion.get(1)
    if (!exists) {
      await this.initDefaults()
    }
    await db.configuracion.update(1, data)
  },

  async initDefaults(): Promise<Configuracion> {
    await db.configuracion.put(DEFAULT_CONFIG)
    return DEFAULT_CONFIG
  },
}
