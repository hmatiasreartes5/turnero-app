import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useInstallPrompt } from '@/hooks/useInstallPrompt'

export default function InstallBanner() {
  const { showBanner, isIOS, canPrompt, install, dismiss } = useInstallPrompt()

  if (!showBanner) return null

  return (
    <div className="fixed bottom-16 left-2 right-2 z-50 rounded-lg border bg-card p-4 shadow-lg">
      <button onClick={dismiss} className="absolute right-2 top-2 text-muted-foreground">
        <X className="h-4 w-4" />
      </button>

      <p className="mb-2 font-medium">Instalar Turnero</p>

      {canPrompt ? (
        <>
          <p className="mb-3 text-sm text-muted-foreground">
            Instalá la app para acceso rápido y uso offline.
          </p>
          <Button size="sm" onClick={install}>
            Instalar
          </Button>
        </>
      ) : isIOS ? (
        <p className="text-sm text-muted-foreground">
          Tocá el botón compartir{' '}
          <span className="inline-block text-base">&#x2BAD;</span> y luego
          "Agregar a pantalla de inicio".
        </p>
      ) : (
        <p className="text-sm text-muted-foreground">
          Abrí el menú del navegador y seleccioná "Instalar app" o
          "Agregar a pantalla de inicio".
        </p>
      )}
    </div>
  )
}
