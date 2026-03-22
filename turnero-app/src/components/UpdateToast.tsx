import { useRegisterSW } from 'virtual:pwa-register/react'
import { Button } from '@/components/ui/button'

export default function UpdateToast() {
  const {
    needRefresh: [needRefresh],
    updateServiceWorker,
  } = useRegisterSW()

  if (!needRefresh) return null

  return (
    <div className="fixed bottom-20 left-2 right-2 z-50 flex items-center justify-between rounded-lg border bg-card p-4 shadow-lg">
      <p className="text-sm">Nueva versión disponible</p>
      <Button size="sm" onClick={() => updateServiceWorker(true)}>
        Actualizar
      </Button>
    </div>
  )
}
