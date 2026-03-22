import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import Layout from '@/components/Layout'
import ErrorBoundary from '@/components/ErrorBoundary'
import { configRepo } from '@/repositories/config.repo'

const Dashboard = lazy(() => import('@/pages/Dashboard'))
const Agenda = lazy(() => import('@/pages/Agenda'))
const Pacientes = lazy(() => import('@/pages/Pacientes'))
const Configuracion = lazy(() => import('@/pages/Configuracion'))
const NuevoTurno = lazy(() => import('@/pages/NuevoTurno'))
const DetalleTurno = lazy(() => import('@/pages/DetalleTurno'))
const FichaPaciente = lazy(() => import('@/pages/FichaPaciente'))
const Onboarding = lazy(() => import('@/pages/Onboarding'))

function Loading() {
  return (
    <div className="flex h-32 items-center justify-center">
      <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
    </div>
  )
}

function OnboardingGuard({ children }: { children: React.ReactNode }) {
  const config = useLiveQuery(() => configRepo.get(), [])

  if (!config) return <Loading />
  if (!config.onboardingCompletado) return <Navigate to="/onboarding" replace />

  return <>{children}</>
}

export default function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <Suspense fallback={<Loading />}>
          <Routes>
            <Route path="onboarding" element={<Onboarding />} />
            <Route element={<OnboardingGuard><Layout /></OnboardingGuard>}>
              <Route index element={<Dashboard />} />
              <Route path="agenda" element={<Agenda />} />
              <Route path="pacientes" element={<Pacientes />} />
              <Route path="config" element={<Configuracion />} />
            </Route>
            <Route path="turnos/nuevo" element={<OnboardingGuard><NuevoTurno /></OnboardingGuard>} />
            <Route path="turnos/:id" element={<OnboardingGuard><DetalleTurno /></OnboardingGuard>} />
            <Route path="pacientes/:id" element={<OnboardingGuard><FichaPaciente /></OnboardingGuard>} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </ErrorBoundary>
  )
}
