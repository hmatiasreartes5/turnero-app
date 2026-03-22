import { db } from '@/repositories/database'
import { configRepo } from '@/repositories/config.repo'
import { backupSchema } from '@/utils/validators'
import type { BackupData } from '@/utils/validators'

const BACKUP_VERSION = 1

export async function exportarDatos(): Promise<string> {
  const pacientes = await db.pacientes.toArray()
  const turnos = await db.turnos.toArray()
  const configuracion = await configRepo.get()

  const backup: BackupData = {
    version: BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
    data: { pacientes, turnos, configuracion: { ...configuracion, id: 1 as const } },
  }

  // Actualizar fecha de último backup
  await configRepo.update({ ultimoBackup: backup.exportedAt })

  return JSON.stringify(backup, null, 2)
}

export async function compartirBackup(): Promise<void> {
  const json = await exportarDatos()
  const fecha = new Date().toISOString().slice(0, 10)
  const filename = `turnero-backup-${fecha}.json`
  const blob = new Blob([json], { type: 'application/json' })

  // Intentar usar Web Share API (móvil)
  if (navigator.share && typeof navigator.canShare === 'function') {
    const file = new File([blob], filename, { type: 'application/json' })
    try {
      await navigator.share({ files: [file], title: 'Backup Turnero' })
      return
    } catch {
      // Si cancela o falla, caer en download
    }
  }

  // Fallback: descarga directa
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export interface ImportResult {
  pacientes: number
  turnos: number
}

export async function validarArchivo(json: string): Promise<{ valid: boolean; error?: string; data?: BackupData }> {
  try {
    const parsed = JSON.parse(json)
    const result = backupSchema.safeParse(parsed)
    if (!result.success) {
      return { valid: false, error: 'Archivo de backup inválido' }
    }
    return { valid: true, data: result.data as BackupData }
  } catch {
    return { valid: false, error: 'El archivo no es JSON válido' }
  }
}

export async function importarDatos(data: BackupData): Promise<ImportResult> {
  // Transacción: todo o nada
  await db.transaction('rw', [db.pacientes, db.turnos, db.configuracion], async () => {
    // Limpiar datos existentes
    await db.pacientes.clear()
    await db.turnos.clear()
    await db.configuracion.clear()

    // Importar
    await db.pacientes.bulkAdd(data.data.pacientes)
    await db.turnos.bulkAdd(data.data.turnos)
    await db.configuracion.put(data.data.configuracion)
  })

  return {
    pacientes: data.data.pacientes.length,
    turnos: data.data.turnos.length,
  }
}
