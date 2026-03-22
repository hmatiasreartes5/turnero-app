import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { differenceInDays } from 'date-fns'
import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { configRepo } from '@/repositories/config.repo'

export default function BackupReminder() {
  const navigate = useNavigate()
  const config = useLiveQuery(() => configRepo.get(), [])
  const [dismissed, setDismissed] = useState(false)

  if (dismissed || !config) return null

  const needsBackup = !config.ultimoBackup ||
    differenceInDays(new Date(), new Date(config.ultimoBackup)) >= 7

  if (!needsBackup) return null

  return (
    <div className="relative mb-4 rounded-lg border border-amber-200 bg-amber-50 p-3 dark:border-amber-800 dark:bg-amber-950">
      <button
        onClick={() => setDismissed(true)}
        className="absolute right-2 top-2 text-amber-600 dark:text-amber-400"
      >
        <X className="h-4 w-4" />
      </button>
      <p className="mb-2 text-sm font-medium text-amber-800 dark:text-amber-200">
        {config.ultimoBackup
          ? 'Hace más de una semana que no hacés backup'
          : 'Nunca hiciste un backup'}
      </p>
      <p className="mb-3 text-xs text-amber-700 dark:text-amber-300">
        Tus datos están solo en este dispositivo.
      </p>
      <Button size="sm" variant="outline" onClick={() => navigate('/config')}>
        Ir a backup
      </Button>
    </div>
  )
}
