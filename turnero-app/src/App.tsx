import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Layout from '@/components/Layout'

const Dashboard = lazy(() => import('@/pages/Dashboard'))
const Agenda = lazy(() => import('@/pages/Agenda'))
const Pacientes = lazy(() => import('@/pages/Pacientes'))
const Configuracion = lazy(() => import('@/pages/Configuracion'))
const NuevoTurno = lazy(() => import('@/pages/NuevoTurno'))
const DetalleTurno = lazy(() => import('@/pages/DetalleTurno'))
const FichaPaciente = lazy(() => import('@/pages/FichaPaciente'))

function Loading() {
  return (
    <div className="flex h-32 items-center justify-center">
      <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<Loading />}>
        <Routes>
          <Route element={<Layout />}>
            <Route index element={<Dashboard />} />
            <Route path="agenda" element={<Agenda />} />
            <Route path="pacientes" element={<Pacientes />} />
            <Route path="config" element={<Configuracion />} />
          </Route>
          <Route path="turnos/nuevo" element={<NuevoTurno />} />
          <Route path="turnos/:id" element={<DetalleTurno />} />
          <Route path="pacientes/:id" element={<FichaPaciente />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  )
}
