import { Outlet, NavLink } from 'react-router-dom'
import { Home, Calendar, Users, Settings } from 'lucide-react'
import InstallBanner from '@/components/InstallBanner'
import UpdateToast from '@/components/UpdateToast'

const tabs = [
  { to: '/', icon: Home, label: 'Inicio' },
  { to: '/agenda', icon: Calendar, label: 'Agenda' },
  { to: '/pacientes', icon: Users, label: 'Pacientes' },
  { to: '/config', icon: Settings, label: 'Config' },
]

export default function Layout() {
  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <main className="flex-1 overflow-y-auto pb-20">
        <Outlet />
      </main>

      <InstallBanner />
      <UpdateToast />

      <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background/95 backdrop-blur-sm">
        <div className="mx-auto flex max-w-md justify-around">
          {tabs.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                `flex flex-col items-center gap-0.5 px-3 py-2 text-xs transition-colors ${
                  isActive
                    ? 'text-primary'
                    : 'text-muted-foreground hover:text-foreground'
                }`
              }
            >
              <Icon className="h-5 w-5" />
              <span>{label}</span>
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  )
}
