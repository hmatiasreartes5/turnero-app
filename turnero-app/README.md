# Turnero

[![CI](https://github.com/hmatiasreartes5/turnero-app/actions/workflows/ci.yml/badge.svg)](https://github.com/hmatiasreartes5/turnero-app/actions/workflows/ci.yml)

App offline para kinesiólogos independientes. Gestiona turnos, pacientes y configuración desde el celular, sin internet y sin costo.

## Features

- **Agenda visual** — Calendario mensual con indicadores de turnos por día
- **Gestión de turnos** — Crear, completar, cancelar, reprogramar con un tap
- **Pacientes** — Ficha con datos, obra social e historial de turnos
- **Disponibilidad automática** — Calcula horarios libres según tu configuración
- **Backup manual** — Exportar/importar datos en JSON desde el menú compartir
- **100% offline** — Todo funciona sin conexión, datos en el dispositivo
- **Instalable** — Se instala como app nativa desde el navegador (PWA)
- **Dark mode** — Sigue la preferencia del sistema

## Stack

| | Tecnología |
|---|---|
| Framework | React 19 + Vite 8 |
| Lenguaje | TypeScript (strict) |
| Estilos | Tailwind CSS 4 |
| UI | shadcn/ui |
| DB local | Dexie.js (IndexedDB) |
| Routing | React Router v6 |
| Estado | Zustand |
| PWA | vite-plugin-pwa (Workbox) |
| Formularios | React Hook Form + Zod |
| Testing | Vitest + Testing Library |

## Requisitos

- Node.js 18+ (recomendado 20)
- npm 9+

## Instalación

```bash
git clone https://github.com/hmatiasreartes5/turnero-app.git
cd turnero-app/turnero-app
npm install
npm run dev
```

## Scripts

```bash
npm run dev        # Servidor de desarrollo
npm run build      # Build de producción
npm run test       # Tests unitarios + integración
npm run test:watch # Tests en modo watch
npm run lint       # ESLint
npm run preview    # Preview del build
```

## Estructura

```
src/
├── components/    # Componentes reutilizables (Layout, TurnoCard, etc.)
├── hooks/         # Custom hooks (useTurnosDelDia, usePacienteSearch)
├── pages/         # Páginas (Dashboard, Agenda, Pacientes, Config, etc.)
├── repositories/  # Acceso a datos (paciente.repo, turno.repo, config.repo)
├── services/      # Lógica de negocio (disponibilidad, backup, notifications)
├── stores/        # Zustand stores (estado UI)
├── types/         # Interfaces TypeScript
└── utils/         # Helpers (validators, dates)
```

## Instalar como PWA

### iPhone (Safari)
1. Abrí la app en Safari
2. Tocá el botón compartir (cuadrado con flecha)
3. Seleccioná "Agregar a pantalla de inicio"

### Android (Chrome)
1. Abrí la app en Chrome
2. Tocá el menú (tres puntos)
3. Seleccioná "Instalar app"

## Backup

Los datos se almacenan localmente en IndexedDB. Para resguardarlos:

1. Ir a **Config** > **Exportar datos**
2. Se genera un archivo JSON que podés compartir o guardar
3. Para restaurar: **Config** > **Importar datos** > seleccionar el archivo

## Licencia

MIT
