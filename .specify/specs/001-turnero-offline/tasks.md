# Tasks: Turnero Offline — PWA

> Descomposición de los specs funcional y técnico en tareas pequeñas, independientes y testeables.
> Cada tarea apunta a < 300 líneas de diff. Las marcadas con [P] pueden ejecutarse en paralelo.

---

## Fase 1 — Setup y Datos

### Tarea 1.1 — Init proyecto y tooling
- **User Story**: —
- **Descripción**: Verificar prerrequisitos del entorno (Node.js 18+, npm 9+, Git 2.40+). Instalar extensiones de VS Code (Tailwind CSS IntelliSense, ESLint, Prettier, Markdown Preview Mermaid). Crear proyecto React + Vite + TypeScript (strict). Instalar y configurar Tailwind CSS. Instalar shadcn/ui (init + componentes base: Button, Input, Dialog, Card, Sheet). Configurar ESLint + Prettier.
- **Archivos**: `package.json`, `vite.config.ts`, `tailwind.config.ts`, `tsconfig.json`, `.eslintrc.cjs`, `.prettierrc`, `src/main.tsx`, `src/App.tsx`, `index.html`, `src/styles/globals.css`, `.gitignore`
- **Tests**: —
- **Criterio de completitud**: Prerrequisitos verificados, extensiones VS Code instaladas, `npm run dev` levanta sin errores, Tailwind funciona, shadcn/ui renderiza un botón, lint pasa.
- **Dependencias**: Ninguna.
- **Paralelizable**: —

### Tarea 1.2 — Configurar repositorio Git + GitHub
- **User Story**: —
- **Descripción**: Inicializar repo git, crear repo `turnero-app` en GitHub, push inicial. Configurar branch protection en `main`.
- **Archivos**: `.gitignore`, `README.md` (placeholder)
- **Tests**: —
- **Criterio de completitud**: Repo en GitHub con primer commit. Branch `main` protegido.
- **Dependencias**: 1.1
- **Paralelizable**: —

### Tarea 1.3 — Tipos TypeScript y schemas Zod
- **User Story**: —
- **Descripción**: Definir interfaces `Paciente`, `Turno`, `Configuracion`, `HorarioDia`, `HorarioBloque`, `EstadoTurno`. Crear schemas Zod para validación de formularios y backup import.
- **Archivos**: `src/types/index.ts`, `src/utils/validators.ts`
- **Tests**: Tests de schemas Zod (validar datos correctos e incorrectos).
- **Criterio de completitud**: Tipos exportados, schemas Zod validan correctamente, tests pasan.
- **Dependencias**: 1.1
- **Paralelizable**: [P] con 1.4

### Tarea 1.4 — Configurar Vitest + fake-indexeddb
- **User Story**: —
- **Descripción**: Instalar Vitest, @testing-library/react, fake-indexeddb. Configurar en `vite.config.ts`. Crear test de ejemplo para validar setup.
- **Archivos**: `vite.config.ts` (actualizar), `src/__tests__/setup.test.ts`
- **Tests**: Test de ejemplo que crea y lee un registro en fake-indexeddb.
- **Criterio de completitud**: `npm run test` ejecuta y pasa.
- **Dependencias**: 1.1
- **Paralelizable**: [P] con 1.3

### Tarea 1.5 — Schema Dexie.js y conexión
- **User Story**: —
- **Descripción**: Instalar Dexie.js + dexie-react-hooks. Crear clase `TurneroDB` con schema v1 (3 tablas: pacientes, turnos, configuracion). Definir índices.
- **Archivos**: `src/repositories/database.ts`
- **Tests**: Test que abre la DB, verifica que las 3 tablas existen.
- **Criterio de completitud**: DB se abre sin errores, tablas e índices creados correctamente.
- **Dependencias**: 1.3, 1.4
- **Paralelizable**: —

### Tarea 1.6 — Repository: Pacientes
- **User Story**: US-11, US-12, US-14
- **Descripción**: Implementar `pacienteRepo` con operaciones: `getAll`, `getById`, `searchByNombreOrDni`, `create`, `update`, `delete` (con validación de turnos asociados, RN-10), `existeDni`.
- **Archivos**: `src/repositories/paciente.repo.ts`
- **Tests**: Tests de cada operación, incluyendo: crear paciente, buscar por nombre, buscar por DNI, DNI duplicado falla (RN-09), no se puede eliminar con turnos (RN-10).
- **Criterio de completitud**: Todos los tests pasan, CRUD completo funcionando.
- **Dependencias**: 1.5
- **Paralelizable**: [P] con 1.7, 1.8

### Tarea 1.7 — Repository: Turnos
- **User Story**: US-02, US-04, US-05
- **Descripción**: Implementar `turnoRepo` con operaciones: `getById`, `getByFecha`, `getByPaciente`, `create`, `updateEstado`, `update`, `getByRangoFechas`. Incluir `turnoOrigenId` para trazabilidad (RN-17).
- **Archivos**: `src/repositories/turno.repo.ts`
- **Tests**: Tests de cada operación, incluyendo: crear turno, buscar por fecha, buscar por paciente, cambiar estado, trazabilidad con turnoOrigenId.
- **Criterio de completitud**: Todos los tests pasan, CRUD completo funcionando.
- **Dependencias**: 1.5
- **Paralelizable**: [P] con 1.6, 1.8

### Tarea 1.8 — Repository: Configuración
- **User Story**: US-17, US-18, US-19
- **Descripción**: Implementar `configRepo` con operaciones: `get` (singleton), `update`, `initDefaults` (crear configuración default si no existe). Incluir horarios por día, duración default, días bloqueados, precios.
- **Archivos**: `src/repositories/config.repo.ts`
- **Tests**: Tests: inicializar defaults, leer config, actualizar horarios, actualizar duración, agregar/quitar días bloqueados.
- **Criterio de completitud**: Todos los tests pasan, singleton funciona correctamente.
- **Dependencias**: 1.5
- **Paralelizable**: [P] con 1.6, 1.7

### Tarea 1.9 — Servicio de disponibilidad horaria
- **User Story**: US-03, US-29
- **Descripción**: Implementar `disponibilidad.ts` con funciones: `getSlotsDisponibles(fecha, duracion?)` que devuelve horarios libres considerando: horarios de atención del día, turnos existentes activos (no cancelados), días bloqueados, duración variable por turno. También `validarDisponibilidad(fecha, hora, duracion)` para validación al confirmar.
- **Archivos**: `src/services/disponibilidad.ts`, `src/utils/dates.ts` (helpers de fecha con date-fns)
- **Tests**: Tests: día normal con slots libres, día con turnos que ocupan slots, día bloqueado (0 slots), día no laborable (0 slots), turnos de diferente duración, validación de superposición.
- **Criterio de completitud**: Todos los tests pasan, cálculo correcto de disponibilidad con duración variable.
- **Dependencias**: 1.7, 1.8
- **Paralelizable**: —

---

## Fase 2 — Pantallas Principales

### Tarea 2.1 — Layout con tab bar y routing
- **User Story**: —
- **Descripción**: Instalar React Router v6. Crear `Layout.tsx` con tab bar inferior (Home, Agenda, Pacientes, Config). Configurar rutas en `App.tsx` con lazy loading y prefetch en idle. Dark mode siguiendo preferencia del sistema.
- **Archivos**: `src/App.tsx`, `src/components/Layout.tsx`, `src/pages/` (archivos placeholder)
- **Tests**: —
- **Criterio de completitud**: Navegación entre tabs funciona, lazy loading activo, dark mode responde a `prefers-color-scheme`.
- **Dependencias**: 1.1
- **Paralelizable**: —

### Tarea 2.2 — Zustand store
- **User Story**: —
- **Descripción**: Instalar Zustand. Crear `app.store.ts` con estado UI: fecha seleccionada en agenda, modal abierto, etc.
- **Archivos**: `src/stores/app.store.ts`
- **Tests**: Test del store: set/get fecha seleccionada.
- **Criterio de completitud**: Store funciona, test pasa.
- **Dependencias**: 1.1
- **Paralelizable**: [P] con 2.1

### Tarea 2.3 — Dashboard (turnos del día)
- **User Story**: US-01
- **Descripción**: Crear página Dashboard que muestra: fecha de hoy, cantidad de turnos, lista de TurnoCards ordenados por hora. Implementar `useTurnosDelDia` hook con `useLiveQuery`. Estado vacío: "No tenés turnos para hoy". Botón FAB "+" para nuevo turno.
- **Archivos**: `src/pages/Dashboard.tsx`, `src/components/TurnoCard.tsx`, `src/hooks/useTurnosDelDia.ts`
- **Tests**: Test del hook `useTurnosDelDia`. Test de componente: renderiza turnos, muestra estado vacío.
- **Criterio de completitud**: Dashboard muestra turnos del día reactivamente, estado vacío funciona, FAB navega a nuevo turno.
- **Dependencias**: 2.1, 1.7
- **Paralelizable**: [P] con 2.4, 2.6

### Tarea 2.4 — Agenda: calendario mes
- **User Story**: US-06, US-07
- **Descripción**: Instalar react-day-picker. Crear página Agenda con vista mes que muestra indicadores en días con turnos. Tap en día → muestra turnos de ese día debajo del calendario. Navegación mes anterior/siguiente.
- **Archivos**: `src/pages/Agenda.tsx`
- **Tests**: Test de componente: renderiza calendario, muestra indicadores en días con turnos.
- **Criterio de completitud**: Calendario mes visible, indicadores en días con turnos, tap en día muestra lista del día.
- **Dependencias**: 2.1, 1.7
- **Paralelizable**: [P] con 2.3, 2.6

### Tarea 2.5 — Agenda: timeline del día
- **User Story**: US-07, US-08
- **Descripción**: Crear componente `AgendaTimeline` que muestra turnos del día seleccionado como lista con slots vacíos visibles. Tap en slot vacío → navega a nuevo turno precargado con fecha/hora.
- **Archivos**: `src/components/AgendaTimeline.tsx`
- **Tests**: Test de componente: renderiza turnos y slots vacíos, tap en slot genera navegación con params correctos.
- **Criterio de completitud**: Timeline muestra turnos y slots, interacción con slots funciona.
- **Dependencias**: 2.4, 1.9
- **Paralelizable**: —

### Tarea 2.6 — Lista de pacientes con búsqueda
- **User Story**: US-11
- **Descripción**: Crear página Pacientes con barra de búsqueda prominente y lista scrollable ordenada alfabéticamente. Implementar `usePacienteSearch` hook con debounce 300ms. Cada item muestra nombre, DNI, obra social. Tap → ficha. Estado vacío.
- **Archivos**: `src/pages/Pacientes.tsx`, `src/components/PacienteSearch.tsx`, `src/hooks/usePacienteSearch.ts`
- **Tests**: Test del hook con debounce. Test de componente: renderiza lista, búsqueda filtra, estado vacío.
- **Criterio de completitud**: Búsqueda funciona con debounce, lista renderiza correctamente.
- **Dependencias**: 2.1, 1.6
- **Paralelizable**: [P] con 2.3, 2.4

### Tarea 2.7 — Formulario nuevo turno
- **User Story**: US-02, US-03, US-12, US-29
- **Descripción**: Instalar React Hook Form. Crear página NuevoTurno con: selector fecha, selector hora (solo disponibles), selector duración (15/30/45/60 min, default de config), buscador de paciente (autocomplete). Si paciente no existe → formulario inline crear paciente (nombre, apellido, DNI, teléfono obligatorios). Validaciones: slot ocupado, fuera de horario, día bloqueado, pasado. Botón confirmar.
- **Archivos**: `src/pages/NuevoTurno.tsx`, `src/components/HorarioSelector.tsx`
- **Tests**: Test de componente: formulario renderiza, validaciones bloquean submit, crear turno con paciente existente, crear turno con paciente nuevo.
- **Criterio de completitud**: Formulario completo, validaciones funcionan, crea turno + paciente si es nuevo.
- **Dependencias**: 2.1, 1.6, 1.7, 1.9
- **Paralelizable**: —

### Tarea 2.8 — Detalle del turno
- **User Story**: US-04, US-05, US-09
- **Descripción**: Crear página DetalleTurno que muestra datos completos del turno y paciente. Acciones según estado: confirmado → completar/cancelar/no asistió/reprogramar/editar notas. Completado/cancelado → solo lectura. No asistió → reprogramar. Link al paciente.
- **Archivos**: `src/pages/DetalleTurno.tsx`
- **Tests**: Test de componente: muestra datos, acciones correctas por estado, cambio de estado funciona.
- **Criterio de completitud**: Todas las acciones de estado funcionan, navegación a reprogramar y a ficha paciente.
- **Dependencias**: 2.1, 1.7
- **Paralelizable**: [P] con 2.7

### Tarea 2.9 — Ficha del paciente
- **User Story**: US-13, US-14
- **Descripción**: Crear página FichaPaciente con datos editables (nombre, apellido, DNI, teléfono, email, obra social, notas) e historial de turnos (cronológico, más recientes primero). Botón editar datos, botón agendar turno para este paciente.
- **Archivos**: `src/pages/FichaPaciente.tsx`
- **Tests**: Test de componente: muestra datos, historial de turnos, edición funciona.
- **Criterio de completitud**: Datos editables, historial visible, navegación a nuevo turno precargado con paciente.
- **Dependencias**: 2.1, 1.6, 1.7
- **Paralelizable**: [P] con 2.8

---

## Fase 3 — PWA + Offline

### Tarea 3.1 — Configurar vite-plugin-pwa
- **User Story**: US-27
- **Descripción**: Instalar vite-plugin-pwa. Configurar manifest.json (nombre, iconos, colores, display: standalone, orientation: portrait). Configurar Workbox con precache de assets y runtime caching de fonts. registerType: autoUpdate.
- **Archivos**: `vite.config.ts`, `public/manifest.json`, `public/icons/` (icon-192.png, icon-512.png)
- **Tests**: —
- **Criterio de completitud**: Build genera service worker, manifest correcto, app instalable en Chrome.
- **Dependencias**: 2.1
- **Paralelizable**: [P] con 3.2

### Tarea 3.2 — Storage persistence API
- **User Story**: —
- **Descripción**: Al iniciar la app, solicitar `navigator.storage.persist()`. Si no se concede, mostrar aviso recomendando backup regular.
- **Archivos**: `src/main.tsx` o `src/App.tsx`
- **Tests**: —
- **Criterio de completitud**: Persistence solicitada al iniciar, aviso mostrado si se deniega.
- **Dependencias**: 2.1
- **Paralelizable**: [P] con 3.1

### Tarea 3.3 — Banner de instalación PWA
- **User Story**: US-27
- **Descripción**: Crear componente `InstallBanner` que detecta si la app no está instalada y muestra instrucciones para "Agregar a pantalla de inicio". Implementar `useInstallPrompt` hook. Instrucciones diferenciadas por plataforma (iOS Safari vs Android Chrome).
- **Archivos**: `src/components/InstallBanner.tsx`, `src/hooks/useInstallPrompt.ts`
- **Tests**: —
- **Criterio de completitud**: Banner aparece cuando la app no está instalada, se puede cerrar, no reaparece después.
- **Dependencias**: 3.1
- **Paralelizable**: —

### Tarea 3.4 — Toast de actualización disponible
- **User Story**: —
- **Descripción**: Cuando el service worker detecta nueva versión, mostrar toast: "Nueva versión disponible. Tocá para actualizar." Al tocar → reload.
- **Archivos**: `src/App.tsx` o componente dedicado
- **Tests**: —
- **Criterio de completitud**: Toast aparece cuando hay nueva versión, reload funciona.
- **Dependencias**: 3.1
- **Paralelizable**: —

### Tarea 3.5 — Testing offline manual
- **User Story**: —
- **Descripción**: Testear toda la app desconectando internet. Verificar: dashboard carga, crear turno funciona, buscar paciente funciona, calendario funciona, configuración funciona. Documentar resultados.
- **Archivos**: — (solo testing manual)
- **Tests**: Checklist manual de verificación offline.
- **Criterio de completitud**: Todas las funcionalidades core funcionan sin conexión.
- **Dependencias**: 3.1, 3.2, 3.3, 3.4
- **Paralelizable**: —

---

## Fase 4 — Configuración, Notificaciones y Backup

### Tarea 4.1 — Pantalla de configuración
- **User Story**: US-17, US-18, US-19, US-20, US-21
- **Descripción**: Crear página Configuración con secciones: nombre profesional, duración default de turno (selector), horarios de atención por día (componente editable con bloques mañana/tarde), días bloqueados (selector de fechas), precios por cobertura (lista editable). Versión de la app en footer.
- **Archivos**: `src/pages/Configuracion.tsx`, `src/components/HorarioSelector.tsx` (reutilizar/extender)
- **Tests**: Test de componente: editar nombre guarda, cambiar duración guarda, editar horarios funciona.
- **Criterio de completitud**: Todas las secciones editables y persistentes en IndexedDB.
- **Dependencias**: 2.1, 1.8
- **Paralelizable**: [P] con 4.2

### Tarea 4.2 — Onboarding (primer uso)
- **User Story**: US-28
- **Descripción**: Crear página Onboarding con 3 pasos: nombre, duración default, horarios. Botón "Configurar después" disponible en todo momento (aplica defaults: 30 min, L-V 8:00-18:00). Al completar, marca `onboardingCompletado: true` en config. App redirige a onboarding si no está completado.
- **Archivos**: `src/pages/Onboarding.tsx`, `src/App.tsx` (lógica de redirección)
- **Tests**: Test: onboarding se muestra si no completado, se salta si ya completado, "Configurar después" aplica defaults.
- **Criterio de completitud**: Flujo completo funciona, skipeable, defaults correctos.
- **Dependencias**: 2.1, 1.8
- **Paralelizable**: [P] con 4.1

### Tarea 4.3 — Export de backup
- **User Story**: US-24
- **Descripción**: Implementar servicio `backup.ts` función `exportarDatos()` que genera JSON con versión, fecha, pacientes, turnos, configuración. Botón en Configuración que genera el archivo y abre menú compartir del sistema. Actualiza `ultimoBackup` en config.
- **Archivos**: `src/services/backup.ts`, `src/components/BackupManager.tsx`, `src/pages/Configuracion.tsx` (integrar)
- **Tests**: Test del servicio: genera JSON con estructura correcta, incluye todos los datos, actualiza fecha de backup.
- **Criterio de completitud**: Export genera archivo válido, menú compartir se abre, fecha de backup actualizada.
- **Dependencias**: 4.1, 1.6, 1.7, 1.8
- **Paralelizable**: [P] con 4.4

### Tarea 4.4 — Import de backup
- **User Story**: US-25
- **Descripción**: Implementar función `importarDatos(archivo)` en `backup.ts`. Validar archivo con schema Zod. Mostrar resumen antes de confirmar. Advertencia de reemplazo de datos. Importar en transacción (todo o nada). Si archivo inválido → error sin modificar datos (RN-21).
- **Archivos**: `src/services/backup.ts` (extender), `src/components/BackupManager.tsx` (extender)
- **Tests**: Tests: importar backup válido, rechazar archivo inválido (datos intactos), resumen muestra cantidades correctas.
- **Criterio de completitud**: Import funciona end-to-end, validación robusta, rollback si falla.
- **Dependencias**: 4.1, 4.3
- **Paralelizable**: [P] con 4.3

### Tarea 4.5 — Recordatorio de backup
- **User Story**: US-26
- **Descripción**: Crear banner que aparece si `ultimoBackup` tiene más de 7 días (o es null). Mensaje: "Hace más de una semana que no hacés backup. Tus datos están solo en este dispositivo." Botón para ir a backup, botón para cerrar.
- **Archivos**: `src/components/BackupReminder.tsx`, `src/pages/Dashboard.tsx` (integrar)
- **Tests**: Test: banner aparece si backup viejo, no aparece si backup reciente, cerrar funciona.
- **Criterio de completitud**: Banner aparece condicionalmente, acciones funcionan.
- **Dependencias**: 4.3
- **Paralelizable**: —

### Tarea 4.6 — Notificaciones locales
- **User Story**: US-22
- **Descripción**: Implementar servicio `notifications.ts`. Al crear/modificar turno, programar notificación 30 min antes via Service Worker + Notification API. Pedir permiso la primera vez con explicación clara. Detectar iOS < 16.4 y ocultar funcionalidad (no bloquear app). Al cancelar turno, cancelar notificación.
- **Archivos**: `src/services/notifications.ts`
- **Tests**: Test del servicio: programar notificación, cancelar notificación, detección de soporte.
- **Criterio de completitud**: Notificaciones se programan al crear turno, se cancelan al cancelar turno, permiso solicitado correctamente.
- **Dependencias**: 3.1
- **Paralelizable**: [P] con 4.1

### Tarea 4.7 — Error Boundary global
- **User Story**: —
- **Descripción**: Crear `ErrorBoundary` que captura errores de React y muestra pantalla de fallback con botón "Recargar app". Loguear error en consola.
- **Archivos**: `src/components/ErrorBoundary.tsx`, `src/App.tsx` (envolver)
- **Tests**: Test: componente que tira error muestra fallback, botón recarga.
- **Criterio de completitud**: Errores no rompen la app, fallback funcional.
- **Dependencias**: 2.1
- **Paralelizable**: [P] con cualquier tarea de Fase 4

### Tarea 4.8 — Tests E2E (flujos críticos)
- **User Story**: —
- **Descripción**: Instalar Playwright. Escribir tests E2E para flujos críticos: crear turno completo (con paciente nuevo), completar turno, exportar backup, importar backup.
- **Archivos**: `e2e/turnos.spec.ts`, `e2e/backup.spec.ts`, `playwright.config.ts`
- **Tests**: 4 tests E2E mínimos.
- **Criterio de completitud**: Playwright configurado, 4 tests pasan localmente.
- **Dependencias**: Todas las tareas de Fase 2 y 4.
- **Paralelizable**: —

---

## Fase 5 — Deploy y Distribución

### Tarea 5.1 — GitHub Actions pipeline
- **User Story**: —
- **Descripción**: Crear workflow de CI: on push a main → install → lint → typecheck → unit/integration tests → build. Sin E2E en CI (decisión técnica #5).
- **Archivos**: `.github/workflows/ci.yml`
- **Tests**: —
- **Criterio de completitud**: Pipeline corre en GitHub Actions y pasa en verde.
- **Dependencias**: 1.2
- **Paralelizable**: [P] con 5.2

### Tarea 5.2 — Deploy en Vercel
- **User Story**: —
- **Descripción**: Conectar repo GitHub con Vercel. Configurar build command (`npm run build`), output directory (`dist`). Verificar que deploy automático funciona al pushear a main. Verificar que PWA se instala correctamente desde la URL de Vercel.
- **Archivos**: — (configuración en Vercel)
- **Tests**: —
- **Criterio de completitud**: App deployada, accesible por URL, instalable como PWA.
- **Dependencias**: 1.2, 3.1
- **Paralelizable**: [P] con 5.1

### Tarea 5.3 — Testing en dispositivos reales
- **User Story**: —
- **Descripción**: Testear la app en iPhone (Safari) y Android (Chrome). Verificar: instalación PWA, funcionamiento offline, notificaciones, performance de UI, dark mode. Documentar bugs encontrados.
- **Archivos**: —
- **Tests**: Checklist manual de verificación en dispositivos reales.
- **Criterio de completitud**: App funciona correctamente en ambas plataformas, bugs documentados y priorizados.
- **Dependencias**: 5.2
- **Paralelizable**: —

### Tarea 5.4 — README completo
- **User Story**: —
- **Descripción**: Completar README.md con las 15 secciones definidas en el spec técnico: header con badges, screenshot, features, tech stack, requisitos, instalación, scripts, estructura, instalación PWA, backup, testing, deploy, roadmap, licencia, autor.
- **Archivos**: `README.md`
- **Tests**: —
- **Criterio de completitud**: README completo, badges funcionando, screenshot incluido.
- **Dependencias**: 5.2
- **Paralelizable**: [P] con 5.3

### Tarea 5.5 — Guía de instalación para el usuario
- **User Story**: —
- **Descripción**: Crear guía visual simple (dentro del README o como sección en la app) con instrucciones paso a paso para instalar la PWA en iOS y Android. Con capturas de pantalla si es posible.
- **Archivos**: `README.md` (sección) o página interna de la app
- **Tests**: —
- **Criterio de completitud**: Guía clara para usuario no técnico.
- **Dependencias**: 5.3
- **Paralelizable**: —

---

## Resumen de tareas por fase

| Fase | Tareas | Paralelizables |
|------|--------|---------------|
| 1 — Setup y Datos | 9 tareas | 1.3+1.4, 1.6+1.7+1.8 |
| 2 — Pantallas | 9 tareas | 2.3+2.4+2.6, 2.8+2.9 |
| 3 — PWA + Offline | 5 tareas | 3.1+3.2 |
| 4 — Config, Notif, Backup | 8 tareas | 4.1+4.2, 4.3+4.4, 4.6+4.7 |
| 5 — Deploy | 5 tareas | 5.1+5.2, 5.3+5.4 |
| **Total** | **36 tareas** | |

## Grafo de dependencias (simplificado)

```
Fase 1: 1.1 → 1.2
              1.1 → 1.3 ─┐
              1.1 → 1.4 ─┤→ 1.5 → 1.6 ─┐
                          │       1.7 ─┤→ 1.9
                          │       1.8 ─┘
                          │
Fase 2:       1.1 → 2.1 → 2.3 ──┐
                     2.1 → 2.4 → 2.5
                     2.1 → 2.6   │
                     1.9 → 2.7 ──┤
                           2.8 ──┤
                           2.9 ──┘
                                 │
Fase 3:       2.1 → 3.1 → 3.3 → 3.4 → 3.5
              2.1 → 3.2 ────────────────┘
                                         │
Fase 4:       2.1 → 4.1 → 4.3 → 4.4 → 4.5
              2.1 → 4.2            │
              3.1 → 4.6      4.7   4.8
                                   │
Fase 5:       1.2 → 5.1           │
              3.1 → 5.2 → 5.3 → 5.5
                           5.4
```
