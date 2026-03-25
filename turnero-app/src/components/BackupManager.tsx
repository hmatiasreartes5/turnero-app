import { useState, useRef } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { format } from 'date-fns'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { configRepo } from '@/repositories/config.repo'
import { compartirBackup, validarArchivo, importarDatos } from '@/services/backup'
import type { BackupData } from '@/utils/validators'

export default function BackupManager() {
  const config = useLiveQuery(() => configRepo.get(), [])
  const fileRef = useRef<HTMLInputElement>(null)

  const [exporting, setExporting] = useState(false)
  const [importDialog, setImportDialog] = useState(false)
  const [importData, setImportData] = useState<BackupData | null>(null)
  const [importError, setImportError] = useState('')
  const [importing, setImporting] = useState(false)
  const [importResult, setImportResult] = useState<{ pacientes: number; turnos: number } | null>(null)

  const handleExport = async () => {
    setExporting(true)
    try {
      await compartirBackup()
    } finally {
      setExporting(false)
    }
  }

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const text = await file.text()
    const result = await validarArchivo(text)

    if (!result.valid || !result.data) {
      setImportError(result.error || 'Archivo inválido')
      setImportData(null)
    } else {
      setImportError('')
      setImportData(result.data)
    }

    setImportDialog(true)
    if (fileRef.current) fileRef.current.value = ''
  }

  const handleImport = async () => {
    if (!importData) return
    setImporting(true)
    try {
      const result = await importarDatos(importData)
      setImportResult(result)
      setImportData(null)
    } catch {
      setImportError('Error al importar los datos')
    } finally {
      setImporting(false)
    }
  }

  const closeDialog = () => {
    setImportDialog(false)
    setImportData(null)
    setImportError('')
    setImportResult(null)
  }

  return (
    <div>
      <label className="mb-2 block text-sm font-semibold">Backup</label>

      {config?.ultimoBackup && (
        <p className="mb-2 text-xs text-muted-foreground">
          Último backup: {format(new Date(config.ultimoBackup), 'dd/MM/yyyy HH:mm')}
        </p>
      )}

      <div className="flex gap-2">
        <Button variant="outline" onClick={handleExport} disabled={exporting} className="flex-1">
          {exporting ? 'Exportando...' : 'Exportar datos'}
        </Button>
        <Button
          variant="outline"
          onClick={() => fileRef.current?.click()}
          className="flex-1"
        >
          Importar datos
        </Button>
        <input
          ref={fileRef}
          type="file"
          accept=".json"
          onChange={handleFileSelect}
          className="hidden"
        />
      </div>

      <Dialog open={importDialog} onOpenChange={closeDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {importResult ? 'Importación completa' : importError ? 'Error' : 'Confirmar importación'}
            </DialogTitle>
          </DialogHeader>

          {importResult ? (
            <p className="text-sm">
              Se importaron {importResult.pacientes} pacientes y {importResult.turnos} turnos.
            </p>
          ) : importError ? (
            <p className="text-sm text-destructive">{importError}</p>
          ) : importData ? (
            <div className="text-sm">
              <p className="mb-2 font-medium text-destructive">
                Esto reemplazará todos los datos actuales.
              </p>
              <p>Pacientes: {importData.data.pacientes.length}</p>
              <p>Turnos: {importData.data.turnos.length}</p>
              <p className="text-xs text-muted-foreground mt-1">
                Exportado el {format(new Date(importData.exportedAt), 'dd/MM/yyyy HH:mm')}
              </p>
            </div>
          ) : null}

          <DialogFooter>
            {importData && !importResult ? (
              <>
                <Button variant="outline" onClick={closeDialog}>Cancelar</Button>
                <Button variant="destructive" onClick={handleImport} disabled={importing}>
                  {importing ? 'Importando...' : 'Reemplazar datos'}
                </Button>
              </>
            ) : (
              <Button onClick={closeDialog}>Cerrar</Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
