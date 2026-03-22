import { Component, type ReactNode } from 'react'
import { Button } from '@/components/ui/button'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('Error capturado por ErrorBoundary:', error, info.componentStack)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-dvh flex-col items-center justify-center gap-4 p-6 text-center">
          <h1 className="text-xl font-bold">Algo salió mal</h1>
          <p className="text-sm text-muted-foreground">
            Ocurrió un error inesperado. Tus datos están seguros.
          </p>
          <Button onClick={() => window.location.reload()}>Recargar app</Button>
        </div>
      )
    }

    return this.props.children
  }
}
