# Turnero — Proyecto de Gestión de Turnos

## Visión

App offline para kinesiólogos independientes que gestiona turnos, pacientes y configuración. Funciona sin internet, sin hosting recurrente y sin costo de distribución.

## Público objetivo

Kinesiólogo independiente (28-45 años) que atiende 8-15 pacientes/día en consultorio propio. Usa iPhone como dispositivo principal.

## Enfoque técnico

- **PWA (Progressive Web App)** como enfoque principal — se instala desde un link, costo $0.
- **React Native + Expo** como alternativa futura si se necesitan features nativas.

## Metodología

Este proyecto sigue **Spec Driven Development (SDD)** inspirado en GitHub Spec Kit:
- Las specs son la fuente de verdad — el código sirve al spec, no al revés.
- Flujo: **Research → Spec → Plan → Tasks → Implement**
- Nunca se saltean fases. Cada fase tiene gates de entrada/salida.
- Las specs son documentos vivos que se actualizan conforme avanza el proyecto.

## Estructura del proyecto (SDD — Spec Kit)

```
turnero-app/
├── .specify/                              # SDD: specs, templates, constitución
│   ├── memory/
│   │   └── constitution.md                # Reglas no negociables del proyecto
│   ├── specs/
│   │   ├── 001-turnero-offline/           # Feature: app offline (PWA)
│   │   │   ├── functional-spec.md         # Qué hace la app
│   │   │   ├── technical-spec.md          # Cómo se construye
│   │   │   ├── research.md                # Investigación inicial
│   │   │   └── tasks.md                   # (Fase 2: pendiente)
│   │   └── 002-turnero-web/               # Feature: versión web (futuro)
│   │       └── functional-spec.md
│   └── templates/                         # Templates reutilizables
│       ├── functional-spec-template.md
│       ├── technical-spec-template.md
│       └── tasks-template.md
├── .claude/
│   └── commands/
│       └── sdd.md                         # Skill /sdd
├── CLAUDE.md                              # Este archivo
└── src/                                   # (código, cuando empiece implementación)
```

### Spec Funcional vs Técnico

- **Funcional**: describe QUÉ hace la app desde la perspectiva del usuario. User stories, pantallas, reglas de negocio, flujos de navegación, edge cases. Puede leerlo alguien no técnico.
- **Técnico**: describe CÓMO se construye. Stack, arquitectura, modelo de datos, patrones de diseño, testing, CI/CD, ADRs. Es para el desarrollador.

## Constitución

Definida en `.specify/memory/constitution.md`. Reglas no negociables:

1. **Offline-first**: la app nunca asume conectividad.
2. **Cero costo de distribución**: no se requiere cuenta de desarrollador Apple/Google.
3. **Privacidad**: los datos nunca salen del dispositivo salvo backup manual explícito.
4. **Simplicidad**: app para un kinesiólogo, no para un hospital.
5. **Spec como fuente de verdad**: si hay duda, se consulta el spec.
6. **No saltear fases SDD**: Research → Spec → Plan → Tasks → Implement.
7. **Tests acompañan al código**: no se considera completa una tarea sin sus tests.

## Stack principal (PWA)

| Componente | Tecnología |
|------------|-----------|
| Framework | React 18+ con Vite |
| Lenguaje | TypeScript (strict) |
| Estilos | Tailwind CSS |
| UI | shadcn/ui |
| DB local | Dexie.js (IndexedDB) |
| Routing | React Router v6 |
| Estado | Zustand |
| PWA | vite-plugin-pwa (Workbox) |
| Formularios | React Hook Form + Zod |
| Testing | Vitest + Testing Library + Playwright |
| Fechas | date-fns |
| IDs | nanoid |

## Comandos (se configurarán al iniciar el proyecto)

```bash
npm run dev          # Servidor de desarrollo
npm run build        # Build de producción
npm run test         # Tests unitarios + integración
npm run test:e2e     # Tests E2E con Playwright
npm run lint         # ESLint
npm run typecheck    # tsc --noEmit
```

## Convenciones

- Archivos de componentes/pages: PascalCase (`TurnoCard.tsx`)
- Archivos de lógica/utils: camelCase (`disponibilidad.ts`)
- Repositorios: kebab + `.repo.ts` (`turno.repo.ts`)
- Idioma del código: inglés para nombres de funciones/variables, español para textos de UI y specs
- Commits: mensajes concisos en español

## Estado actual del proyecto

- [x] Spec funcional v1 (puntos abiertos resueltos)
- [x] Spec técnico v1 (puntos abiertos resueltos)
- [x] Resolución de puntos abiertos de ambos specs
- [x] Task decomposition (36 tareas en 5 fases)
- [ ] Fase 1 — Setup y Datos (9 tareas)
- [ ] Fase 2 — Pantallas Principales (9 tareas)
- [ ] Fase 3 — PWA + Offline (5 tareas)
- [ ] Fase 4 — Config, Notificaciones y Backup (8 tareas)
- [ ] Fase 5 — Deploy y Distribución (5 tareas)

## Skills disponibles

- `/sdd` — Guía el proceso de Spec Driven Development paso a paso
