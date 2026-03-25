# Spec Técnico: Turnero Offline — PWA

## 1. Stack Tecnológico

| Componente | Tecnología | Justificación |
|------------|-----------|---------------|
| Framework | React 19 con Vite 8 | Ecosistema maduro, gran comunidad, build rápido con Vite |
| Lenguaje | TypeScript (strict mode) | Type-safety en toda la app, previene errores en tiempo de compilación |
| Estilos | Tailwind CSS 4 | Utility-first, mobile-first por defecto, paleta teal personalizada via CSS variables oklch |
| UI Components | shadcn/ui | Componentes accesibles, customizables, no es dependencia (se copia al proyecto) |
| Base de datos | Dexie.js 4+ (wrapper IndexedDB) | API tipo ORM con promesas, reactive queries, soporte offline nativo |
| Routing | React Router v6 | SPA routing estándar en React |
| Estado global | Zustand | Ligero (~1KB), sin boilerplate, integración simple con React |
| PWA tooling | vite-plugin-pwa (Workbox) | Genera service worker, manifest, estrategias de cache automáticas |
| Calendario | react-day-picker + lista custom | Ligero (~10KB), accesible, customizable. Vista día con componente propio. |
| Formularios | React Hook Form + Zod | Validación type-safe, performance (uncontrolled inputs) |
| IDs | nanoid | Generación de IDs únicos sin servidor, ligero |
| Fechas | date-fns | Tree-shakeable, inmutable, sin dependencias |
| Testing | Vitest + Testing Library + Playwright | Unit/integration + E2E |
| Linting | ESLint + Prettier | Consistencia de código |
| Notificaciones | Notification API + Service Worker | Recordatorios locales sin servidor |
| Control de versiones | Git + GitHub | Estándar de la industria, integración con CI/CD y Vercel |

### Prerrequisitos del Entorno de Desarrollo

| Herramienta | Versión mínima | Verificar con | Instalación |
|-------------|---------------|--------------|-------------|
| Node.js | 18+ (recomendado 20 LTS) | `node --version` | [nodejs.org](https://nodejs.org) o `brew install node` |
| npm | 9+ (viene con Node) | `npm --version` | Se instala con Node.js |
| Git | 2.40+ | `git --version` | `brew install git` |
| GitHub CLI | 2.0+ (opcional, recomendado) | `gh --version` | `brew install gh` |
| Navegador | Chrome 120+ o Safari 16.4+ | — | Para testear PWA y DevTools |
| Editor | VS Code (recomendado) | — | [code.visualstudio.com](https://code.visualstudio.com) |

**Extensiones VS Code recomendadas:**
- Tailwind CSS IntelliSense
- ESLint
- Prettier
- TypeScript + JavaScript
- Dexie.js Snippets (si existe)

**Nota**: antes de iniciar la Fase 1, se debe verificar que todas las herramientas estén instaladas y en las versiones correctas. El script de setup (`npm install`) se encarga de las dependencias del proyecto.

---

## 2. Arquitectura

### 2.1 Estilo arquitectónico: Layered Architecture (Arquitectura en Capas)

Se utiliza una **Layered Architecture pragmática** — cada capa tiene una responsabilidad clara y solo se comunica con la capa inmediata inferior. No es Clean Architecture ni Hexagonal (sería overkill para una PWA offline de este tamaño), pero mantiene una separación de responsabilidades estricta.

**¿Por qué Layered Architecture?**
- Es simple de entender y mantener para un proyecto de este tamaño.
- Las capas se pueden testear de forma independiente (repos con fake-indexeddb, services con repos mockeados, UI con Testing Library).
- Si en el futuro se migra a React Native, las capas de Services y Repositories se reutilizan intactas — solo cambia la capa de UI y la de datos (IndexedDB → SQLite).

### 2.2 Capas del sistema

| Capa | Responsabilidad | Archivos | Regla |
|------|----------------|----------|-------|
| **UI (Presentación)** | Renderizar pantallas, manejar interacción del usuario | Pages, Components, shadcn/ui | Solo consume hooks y stores. Nunca accede a repos ni a Dexie directo. |
| **Hooks** | Conectar UI con datos reactivos de la DB | `useTurnosDelDia.ts`, `usePacienteSearch.ts` | Usan `useLiveQuery` de Dexie para datos reactivos. Pueden llamar repos y services. |
| **Stores (Estado UI)** | Estado efímero de UI (filtros, modales, navegación) | `app.store.ts` (Zustand) | NO duplica datos de IndexedDB. Solo estado UI que no se persiste. |
| **Services (Lógica de Negocio)** | Reglas de negocio, cálculos, operaciones complejas | `disponibilidad.ts`, `backup.ts`, `notifications.ts` | Combina múltiples repos, aplica validaciones. No sabe de UI. |
| **Repositories (Acceso a Datos)** | CRUD y queries sobre cada entidad | `turno.repo.ts`, `paciente.repo.ts`, `config.repo.ts` | Encapsula todas las operaciones de Dexie. No tiene lógica de negocio. |
| **Database** | Persistencia local | Dexie.js → IndexedDB | Schema, índices, migraciones. |
| **Service Worker** | Cache offline + notificaciones | Workbox (vite-plugin-pwa) | Opera de forma independiente al resto de la app. |

**Flujo de datos:**
```
UI (Pages/Components)  →  Hooks / Stores  →  Services  →  Repositories  →  Dexie  →  IndexedDB
```

> [Ver diagrama de componentes completo](./diagrams/component-diagram.md)

### 2.3 Patrones aplicados

| Patrón | Dónde se aplica | Qué resuelve |
|--------|----------------|-------------|
| **Repository Pattern** | `repositories/*.repo.ts` | Encapsula queries. La UI nunca toca Dexie directo. Facilita testing y migración futura. |
| **Service Layer** | `services/*.ts` | Lógica de negocio separada de UI y datos. Ej: calcular disponibilidad combina config + turnos. |
| **Reactive Queries** | `hooks/use*.ts` con `useLiveQuery` | Los datos se actualizan automáticamente en la UI cuando cambian en IndexedDB. Sin polling ni refresh manual. |
| **Singleton** | `Configuracion` (id=1) | Una sola configuración global para toda la app. |

### 2.4 Principios de arquitectura

- **Offline-first**: la app nunca asume conectividad. Todo opera contra IndexedDB local.
- **Separation of concerns**: UI no accede directamente a Dexie. Siempre pasa por repositorios y/o servicios.
- **Repository pattern**: cada entidad tiene un repositorio que encapsula todas las queries.
- **Service layer**: la lógica de negocio (ej: calcular disponibilidad) vive en servicios, no en componentes ni repositorios.
- **Single source of truth**: los datos viven en IndexedDB. Zustand solo maneja estado UI efímero (qué filtro está activo, qué modal está abierto).

---

## 3. Modelo de Datos

### 3.1 Entidades

#### Paciente

```typescript
interface Paciente {
  id: string;               // nanoid, PK
  nombre: string;           // requerido
  apellido: string;         // requerido
  dni: string;              // requerido, único
  telefono: string;         // requerido
  obraSocial?: string;
  numeroAfiliado?: string;  // número de afiliado de la obra social
  email?: string;
  notas?: string;           // notas clínicas generales
  createdAt: string;        // ISO 8601
  updatedAt: string;        // ISO 8601
}
```

#### Turno

```typescript
type EstadoTurno = 'confirmado' | 'completado' | 'cancelado' | 'no_asistio';

interface Turno {
  id: string;               // nanoid, PK
  pacienteId: string;       // FK → Paciente.id
  fecha: string;            // YYYY-MM-DD
  horaInicio: string;       // HH:mm (24h)
  horaFin: string;          // HH:mm (24h), calculado: horaInicio + duración
  duracionMinutos: number;  // snapshot de la config al momento de crear
  estado: EstadoTurno;
  notas?: string;
  turnoOrigenId?: string;   // si fue reprogramado, ref al turno original
  createdAt: string;
  updatedAt: string;
}
```

#### Configuracion

```typescript
interface HorarioBloque {
  desde: string;            // HH:mm
  hasta: string;            // HH:mm
}

interface HorarioDia {
  activo: boolean;
  bloques: HorarioBloque[]; // 0, 1 o 2 bloques (mañana/tarde)
}

interface Configuracion {
  id: number;               // siempre 1 (singleton)
  nombreProfesional: string;
  duracionTurnoMinutos: number;  // default: 30
  horarios: {
    lunes: HorarioDia;
    martes: HorarioDia;
    miercoles: HorarioDia;
    jueves: HorarioDia;
    viernes: HorarioDia;
    sabado: HorarioDia;
    domingo: HorarioDia;
  };
  diasBloqueados: string[];      // ["2026-03-25", "2026-05-01"]
  precios: Record<string, number>; // { "OSDE": 5000, "Particular": 8000 }
  ultimoBackup?: string;          // ISO 8601, para calcular recordatorio
  onboardingCompletado: boolean;
}
```

### 3.2 Diagrama Entidad-Relación

> [Ver diagrama ER](./diagrams/entity-relationship.md)

**Relaciones:**
- **Paciente → Turno**: 1 a muchos. Un paciente puede tener múltiples turnos.
- **Turno → Turno** (self-reference): opcional. Un turno reprogramado referencia al turno original via `turnoOrigenId`.
- **Configuración**: singleton (siempre id=1), sin relaciones.

### 3.3 Schema Dexie.js

```typescript
import Dexie, { type Table } from 'dexie';

class TurneroDB extends Dexie {
  pacientes!: Table<Paciente>;
  turnos!: Table<Turno>;
  configuracion!: Table<Configuracion>;

  constructor() {
    super('turnero-offline');
    this.version(1).stores({
      pacientes: 'id, dni, [apellido+nombre]',
      turnos: 'id, pacienteId, fecha, estado, [fecha+horaInicio]',
      configuracion: 'id'
    });
  }
}

export const db = new TurneroDB();
```

**Índices definidos:**
- `pacientes`: PK `id`, índice por `dni`, índice compuesto `[apellido+nombre]` para búsqueda.
- `turnos`: PK `id`, índice por `pacienteId` (historial del paciente), `fecha` (turnos del día), `estado` (filtros), compuesto `[fecha+horaInicio]` (ordenamiento y detección de colisiones).
- `configuracion`: PK `id` (singleton, siempre id=1).

### 3.3 Estrategia de migraciones

Dexie soporta migraciones incrementales por versión. Cada cambio de schema incrementa la versión:

```typescript
this.version(1).stores({
  pacientes: 'id, dni, [apellido+nombre]',
  turnos: 'id, pacienteId, fecha, estado, [fecha+horaInicio]',
  configuracion: 'id'
});

// Ejemplo: en v2 se agrega campo 'especialidad' a pacientes
this.version(2).stores({
  pacientes: 'id, dni, [apellido+nombre], especialidad'
}).upgrade(tx => {
  return tx.table('pacientes').toCollection().modify(paciente => {
    paciente.especialidad = 'kinesiología'; // default
  });
});
```

**Reglas:**
- Nunca se eliminan campos, solo se agregan.
- Las migraciones son automáticas al abrir la app con nueva versión.
- Cada migración se testea con datos reales del esquema anterior.

---

## 4. Estructura del Proyecto

```
turnero-pwa/
├── public/
│   ├── manifest.json                # PWA manifest
│   ├── icons/                       # Íconos 192x192, 512x512
│   └── favicon.ico
├── src/
│   ├── main.tsx                     # Entry point + registro service worker
│   ├── App.tsx                      # Router principal
│   │
│   ├── pages/                       # Páginas (1 por ruta)
│   │   ├── Dashboard.tsx
│   │   ├── Agenda.tsx
│   │   ├── NuevoTurno.tsx
│   │   ├── DetalleTurno.tsx
│   │   ├── Pacientes.tsx
│   │   ├── FichaPaciente.tsx
│   │   ├── Configuracion.tsx
│   │   └── Onboarding.tsx
│   │
│   ├── components/                  # Componentes reutilizables
│   │   ├── ui/                      # shadcn/ui (Button, Input, Card, Dialog, etc.)
│   │   ├── TurnoCard.tsx            # Card de turno con paciente, obra social y estado
│   │   ├── PacienteAutocomplete.tsx # Buscador con autocomplete y click-outside
│   │   ├── HorarioSelector.tsx      # Selector de slots disponibles
│   │   ├── BackupManager.tsx        # Export/import con diálogo de confirmación
│   │   ├── BackupReminder.tsx       # Banner de recordatorio de backup (7 días)
│   │   ├── InstallBanner.tsx        # Banner "Agregar a pantalla de inicio"
│   │   ├── UpdateToast.tsx          # Toast de actualización PWA disponible
│   │   ├── ErrorBoundary.tsx        # Error boundary global
│   │   └── Layout.tsx               # Layout con tab bar (Home, Agenda, Pacientes, Config)
│   │
│   ├── repositories/                # Capa de datos (Repository Pattern)
│   │   ├── database.ts              # Instancia Dexie + schema
│   │   ├── paciente.repo.ts
│   │   ├── turno.repo.ts
│   │   └── config.repo.ts
│   │
│   ├── services/                    # Lógica de negocio
│   │   ├── disponibilidad.ts        # Calcular slots libres
│   │   ├── backup.ts                # Export/import JSON
│   │   └── notifications.ts         # Programar notificaciones locales
│   │
│   ├── hooks/                       # Custom hooks
│   │   ├── useTurnosDelDia.ts
│   │   ├── usePacienteSearch.ts
│   │   └── useInstallPrompt.ts
│   │
│   ├── stores/                      # Zustand stores
│   │   └── app.store.ts
│   │
│   ├── types/                       # Tipos compartidos
│   │   └── index.ts
│   │
│   ├── utils/                       # Utilidades
│   │   ├── dates.ts                 # Helpers de fecha con date-fns
│   │   └── validators.ts            # Schemas Zod
│   │
│   └── styles/
│       └── globals.css              # Tailwind directives + variables CSS
│
├── e2e/                             # Tests E2E (Playwright)
│   └── turnos.spec.ts
├── index.html
├── vite.config.ts                   # Incluye vite-plugin-pwa
├── tailwind.config.ts
├── tsconfig.json
├── .eslintrc.cjs
├── .prettierrc
├── .gitignore
├── README.md
└── package.json
```

### README.md

El repositorio incluye un README profesional con las siguientes secciones:

1. **Header**: nombre del proyecto + badge de estado (CI, versión) + descripción de una línea.
2. **Screenshot / Demo**: captura de pantalla o GIF de la app funcionando en mobile.
3. **Features**: lista breve de funcionalidades principales con checkmarks.
4. **Tech Stack**: tabla o badges con las tecnologías usadas.
5. **Requisitos previos**: Node.js, npm, versiones mínimas.
6. **Instalación y desarrollo local**: paso a paso para clonar, instalar y levantar en local.
7. **Scripts disponibles**: tabla con `npm run dev`, `npm run build`, `npm run test`, etc.
8. **Estructura del proyecto**: árbol de carpetas resumido con descripción de cada capa.
9. **Cómo instalar la PWA**: instrucciones para el usuario final (iOS y Android).
10. **Backup y restauración**: cómo exportar/importar datos.
11. **Testing**: cómo correr tests unitarios y E2E.
12. **Deploy**: cómo deployar a Vercel/Netlify.
13. **Roadmap**: features planificadas a futuro (Should/Could Have).
14. **Licencia**: MIT o la que se defina.
15. **Autor / Contacto**: nombre y link.

### Convenciones de naming

| Elemento | Convención | Ejemplo |
|----------|-----------|---------|
| Archivos de componentes/pages | PascalCase | `TurnoCard.tsx` |
| Archivos de lógica/utils | camelCase | `disponibilidad.ts` |
| Archivos de repositorios | kebab + `.repo.ts` | `turno.repo.ts` |
| Interfaces/Types | PascalCase | `Paciente`, `EstadoTurno` |
| Funciones | camelCase | `getTurnosDelDia()` |
| Constantes | UPPER_SNAKE | `MAX_TURNOS_POR_DIA` |
| CSS classes | Tailwind utilities | `className="flex gap-2"` |

### Repositorio y Control de Versiones

**Repositorio GitHub**: `turnero-app`

**URL**: `github.com/<usuario>/turnero-app`

**Branching strategy**: GitHub Flow (simple, ideal para equipo pequeño / desarrollador solo).

| Branch | Propósito |
|--------|----------|
| `main` | Producción. Siempre deployable. Protegido (no push directo). |
| `feature/<nombre>` | Features nuevas. Se crean desde `main`, se mergean con PR. |
| `fix/<nombre>` | Bug fixes. Mismo flujo que features. |

**Flujo de trabajo**:
1. Crear branch `feature/nueva-pantalla-agenda` desde `main`.
2. Desarrollar + commits pequeños y frecuentes.
3. Push al remote.
4. Crear Pull Request → CI corre (lint, typecheck, tests, build).
5. Review (o auto-merge si pasa CI en proyecto solo).
6. Merge a `main` → deploy automático a Vercel.

**Convenciones de commits**: mensajes concisos en español, formato libre pero descriptivo.

```
feat: agregar pantalla de agenda con vista mensual
fix: corregir cálculo de slots disponibles en horario partido
chore: configurar vite-plugin-pwa
test: agregar tests de turno.repo
```

**`.gitignore`** (base):
```
node_modules/
dist/
.env
.env.local
*.local
.DS_Store
```

---

## 5. Patrones de Diseño

### 5.1 Repository Pattern

Cada entidad tiene un repositorio que encapsula **todas** las operaciones de datos:

```typescript
// turno.repo.ts
export const turnoRepo = {
  async getById(id: string): Promise<Turno | undefined> {
    return db.turnos.get(id);
  },

  async getByFecha(fecha: string): Promise<Turno[]> {
    return db.turnos.where('fecha').equals(fecha).sortBy('horaInicio');
  },

  async getByPaciente(pacienteId: string): Promise<Turno[]> {
    return db.turnos.where('pacienteId').equals(pacienteId)
      .reverse().sortBy('fecha');
  },

  async create(data: Omit<Turno, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const turno: Turno = {
      ...data,
      id: nanoid(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await db.turnos.add(turno);
    return turno.id;
  },

  async updateEstado(id: string, estado: EstadoTurno): Promise<void> {
    await db.turnos.update(id, {
      estado,
      updatedAt: new Date().toISOString(),
    });
  },

  // ... más operaciones
};
```

### 5.2 Service Layer

Los servicios contienen lógica de negocio que combina múltiples repositorios o aplica reglas:

```typescript
// disponibilidad.ts
export async function getSlotsDisponibles(fecha: string): Promise<string[]> {
  const config = await configRepo.get();
  const diaSemana = getDiaSemana(fecha); // 'lunes', 'martes', etc.
  const horarioDia = config.horarios[diaSemana];

  if (!horarioDia.activo || config.diasBloqueados.includes(fecha)) {
    return [];
  }

  const turnosExistentes = await turnoRepo.getByFecha(fecha);
  const turnosActivos = turnosExistentes.filter(t => t.estado !== 'cancelado');
  const horasOcupadas = new Set(turnosActivos.map(t => t.horaInicio));

  const slots: string[] = [];
  for (const bloque of horarioDia.bloques) {
    let hora = bloque.desde;
    while (hora < bloque.hasta) {
      if (!horasOcupadas.has(hora)) {
        slots.push(hora);
      }
      hora = addMinutes(hora, config.duracionTurnoMinutos);
    }
  }
  return slots;
}
```

### 5.3 Custom Hooks (Reactive Queries)

Dexie 4+ soporta `useLiveQuery` para queries reactivas que se actualizan automáticamente:

```typescript
// useTurnosDelDia.ts
import { useLiveQuery } from 'dexie-react-hooks';

export function useTurnosDelDia(fecha: string) {
  return useLiveQuery(
    () => turnoRepo.getByFecha(fecha),
    [fecha]
  );
}
```

---

## 6. Diagramas de Secuencia

| Caso de uso | User Story | Diagrama |
|------------|-----------|----------|
| Crear turno | US-02 | [Ver diagrama](./diagrams/sequence/crear-turno.md) |
| Completar turno | US-04 | [Ver diagrama](./diagrams/sequence/completar-turno.md) |
| Reprogramar turno | US-05 | [Ver diagrama](./diagrams/sequence/reprogramar-turno.md) |
| Exportar backup | US-24 | [Ver diagrama](./diagrams/sequence/exportar-backup.md) |
| Importar backup | US-25 | [Ver diagrama](./diagrams/sequence/importar-backup.md) |
| Buscar paciente | US-11 | [Ver diagrama](./diagrams/sequence/buscar-paciente.md) |
| Cargar dashboard | US-01 | [Ver diagrama](./diagrams/sequence/cargar-dashboard.md) |

---

## 7. Estrategia de Estado

| Tipo de estado | Dónde vive | Ejemplo |
|---------------|------------|---------|
| Datos persistentes | IndexedDB (via Dexie) | Pacientes, turnos, configuración |
| Datos reactivos de DB | useLiveQuery (Dexie hooks) | Lista de turnos del día, lista de pacientes |
| Estado UI global | Zustand | Fecha seleccionada en agenda, modal abierto |
| Estado UI local | useState / useReducer | Valor del input de búsqueda, form state |
| Estado de formulario | React Hook Form | Campos del formulario de nuevo turno |

**Regla clave**: Zustand NO duplica datos de IndexedDB. Si un dato está en la DB, se lee con `useLiveQuery`. Zustand solo maneja estado efímero de UI.

---

## 8. Service Worker y Caching

### 7.1 Configuración vite-plugin-pwa

```typescript
// vite.config.ts
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 },
            },
          },
        ],
      },
      manifest: {
        name: 'Turnero',
        short_name: 'Turnero',
        description: 'Gestión de turnos offline',
        theme_color: '#0f172a',
        background_color: '#ffffff',
        display: 'standalone',
        orientation: 'portrait',
        icons: [
          { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
        ],
      },
    }),
  ],
});
```

### 7.2 Estrategia de cache

| Recurso | Estrategia | Motivo |
|---------|-----------|--------|
| HTML, JS, CSS | Precache (build time) | Core de la app, debe funcionar offline |
| Íconos, imágenes | Precache | Assets estáticos de la app |
| Fonts (Google Fonts) | CacheFirst | Se cachean la primera vez, se usan offline después |

### 7.3 Actualización de la app

- `registerType: 'autoUpdate'` hace que cuando hay conexión y nueva versión, el service worker se actualiza en background.
- Al detectar nueva versión: mostrar toast "Hay una actualización disponible. Reiniciá la app para aplicarla."
- No forzar reload automático (puede interrumpir al usuario).

### 7.4 Persistencia de storage

Al iniciar la app, solicitar storage persistente:

```typescript
// En App.tsx o main.tsx, al montar
if (navigator.storage && navigator.storage.persist) {
  const granted = await navigator.storage.persist();
  if (!granted) {
    // Mostrar aviso: "Los datos podrían borrarse si no usás la app por un tiempo. Hacé backup regularmente."
  }
}
```

---

## 9. Testing

### 8.1 Estrategia general

| Tipo | Herramienta | Qué se testea | Cobertura objetivo |
|------|------------|---------------|-------------------|
| Unit | Vitest | Servicios, utilidades, lógica de negocio pura | Alta |
| Integration | Vitest + fake-indexeddb | Repositorios contra IndexedDB en memoria | Alta |
| Component | Vitest + Testing Library | Componentes con interacción usuario | Media (flujos críticos) |
| E2E | Playwright | Flujos completos: crear turno, buscar paciente, backup | Flujos críticos |

### 8.2 Testing de IndexedDB

Usar `fake-indexeddb` para testear repositorios sin navegador:

```typescript
import 'fake-indexeddb/auto';
import { db } from '../repositories/database';

beforeEach(async () => {
  await db.delete();
  await db.open();
});

test('crear turno y recuperarlo por fecha', async () => {
  await turnoRepo.create({
    pacienteId: 'pac-1',
    fecha: '2026-03-21',
    horaInicio: '09:00',
    horaFin: '09:30',
    duracionMinutos: 30,
    estado: 'confirmado',
  });

  const turnos = await turnoRepo.getByFecha('2026-03-21');
  expect(turnos).toHaveLength(1);
  expect(turnos[0].horaInicio).toBe('09:00');
});
```

### 8.3 Qué NO testear

- Componentes de shadcn/ui (ya están testeados por la librería).
- Funcionalidad de Dexie/IndexedDB (testeamos nuestros repos, no la librería).
- Estilos de Tailwind.

---

## 10. Manejo de Errores

### 9.1 Errores de IndexedDB

| Error | Causa | Acción |
|-------|-------|--------|
| `QuotaExceededError` | Almacenamiento lleno | Mostrar modal: "Sin espacio. Exportá tus datos y contactá soporte." |
| DB no se puede abrir | Corrupción, versión incompatible | Intentar recovery. Si falla: ofrecer importar backup. |
| Operación de escritura falla | Error inesperado | Retry 1 vez. Si falla: mostrar error y loguear en consola. |

### 9.2 Errores de UI

- Los formularios validan con Zod antes de enviar. No llegan datos inválidos a los repos.
- Errores inesperados en componentes: React Error Boundary que muestra "Algo salió mal. Recargá la app."
- Toda operación de datos (create, update, delete) se envuelve en try/catch en el service layer.

### 9.3 Error Boundary global

```typescript
// ErrorBoundary.tsx
class ErrorBoundary extends React.Component {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('Error capturado:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return <ErrorFallback onRetry={() => this.setState({ hasError: false })} />;
    }
    return this.props.children;
  }
}
```

---

## 11. Performance

### 10.1 Consideraciones

| Escenario | Problema potencial | Solución |
|-----------|-------------------|----------|
| Lista de pacientes con 1000+ registros | Render lento al scrollear | Virtualización con `react-window` o `@tanstack/virtual` |
| Calendario con muchos turnos | Queries lentas | Índice compuesto `[fecha+horaInicio]`, queries por rango de fecha |
| Búsqueda de pacientes | Lag en cada keystroke | Debounce de 300ms en input de búsqueda |
| Carga inicial | Tiempo de first paint | Code splitting por ruta con `React.lazy()` |
| Bundle size | App pesada en mobile | Tree-shaking, analizar con `vite-bundle-visualizer` |

### 10.2 Lazy loading por ruta

```typescript
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Agenda = lazy(() => import('./pages/Agenda'));
const NuevoTurno = lazy(() => import('./pages/NuevoTurno'));
// ...
```

### 10.3 Límites de datos

Para un uso típico (15 pacientes/día, 5 días/semana, 50 semanas/año):
- ~3750 turnos/año
- ~500 pacientes/año
- Incluso después de 10 años: ~37,500 turnos, ~2,000 pacientes → IndexedDB maneja esto sin problema.

---

## 12. Seguridad

### 11.1 Datos sensibles

- Los datos de pacientes (nombre, DNI, teléfono) son datos personales sensibles.
- IndexedDB no encripta por defecto. Los datos son accesibles desde DevTools.
- **Mitigación**: los datos solo viven en el dispositivo del profesional. No hay transmisión de red.
- **Futuro (opcional)**: encriptar la DB con `dexie-encrypted` si se requiere mayor seguridad.

### 11.2 Backup

- El archivo de backup es JSON plano sin encriptar.
- Se recomienda al usuario no compartir el backup por canales inseguros.
- **Futuro (opcional)**: backup encriptado con contraseña.

### 11.3 Validación

- Toda entrada del usuario se valida con Zod schemas antes de persistir.
- Sanitización de strings: prevenir XSS en campos de texto (notas, nombres) al renderizar.
- El archivo de import se valida contra el schema esperado antes de procesar.

---

## 13. Accesibilidad (a11y)

### 12.1 Baseline

- shadcn/ui ya incluye roles ARIA, keyboard navigation y focus management.
- Contraste de colores mínimo WCAG AA (4.5:1 para texto, 3:1 para componentes).
- Touch targets mínimo 44x44px (estándar Apple y Google para mobile).
- Labels en todos los inputs de formulario.
- Semantic HTML: `<main>`, `<nav>`, `<header>`, `<section>`.

### 12.2 Navegación

- Tab bar accesible con `role="navigation"`.
- Focus visible en todos los elementos interactivos.
- Skip links no son prioritarios en mobile (no hay teclado físico).

---

## 14. CI/CD y Deploy

### 13.1 Pipeline

```
Push a main → GitHub Actions:
  1. Install dependencies (npm ci)
  2. Lint (eslint)
  3. Type check (tsc --noEmit)
  4. Unit + integration tests (vitest)
  5. Build (vite build)
  6. Deploy a Vercel/Netlify (automático)
```

### 13.2 Hosting

| Opción | Costo | SSL | CDN | Deploy automático |
|--------|-------|-----|-----|-------------------|
| Vercel | Gratis (hobby) | Sí | Sí | Sí (GitHub integration) |
| Netlify | Gratis (starter) | Sí | Sí | Sí (GitHub integration) |
| GitHub Pages | Gratis | Sí | No | Con GitHub Actions |

**Recomendación**: Vercel por su integración nativa con Vite y previews por PR.

**Nota**: el hosting solo sirve para la **primera carga**. Después la app funciona desde el cache del service worker. El hosting puede estar caído y la app sigue funcionando.

---

## 15. Monitoreo

### 14.1 Errores en producción

- **Sentry** (plan gratuito): captura errores JS, stack traces, context del usuario.
- Se integra con `ErrorBoundary` para capturar errores de React.
- Solo envía datos cuando hay conexión (no bloquea offline).

### 14.2 Analytics (opcional)

- No es prioridad para MVP.
- Si se necesita: Plausible (privacy-friendly, ligero) o analytics de Vercel.

---

## 16. Versionado y Actualizaciones

### 15.1 Versionado semántico

- `package.json` version sigue semver: `MAJOR.MINOR.PATCH`.
- La versión se muestra en Configuración (footer).
- Cada release se tagea en Git.

### 15.2 Flujo de actualización

1. Se pushea nueva versión a main.
2. Vercel deploya automáticamente.
3. El service worker detecta nueva versión en background (cuando hay conexión).
4. Se muestra toast: "Nueva versión disponible. Tocá para actualizar."
5. Al tocar → `window.location.reload()`.

### 15.3 Compatibilidad de datos

- Las migraciones de Dexie aseguran que datos de v1 funcionen en v2, v3, etc.
- Nunca se borran datos en una migración.
- Los backups incluyen `version` para compatibilidad: un backup de v1 se puede importar en v2.

---

## 17. Fases de Desarrollo

### Fase 1 — Setup y Datos (estimación: fundacional)
- [ ] Init proyecto: React + Vite + TypeScript + Tailwind + shadcn/ui
- [ ] Configurar ESLint + Prettier
- [ ] Configurar Vitest + fake-indexeddb
- [ ] Schema Dexie.js completo (3 tablas)
- [ ] Repositorios: CRUD pacientes, turnos, configuración
- [ ] Servicio de disponibilidad horaria
- [ ] Tests de repos y servicio de disponibilidad
- [ ] Tipos TypeScript + schemas Zod

### Fase 2 — Pantallas Principales
- [ ] Layout con tab bar (mobile-first)
- [ ] Dashboard: turnos del día, estado vacío
- [ ] Agenda: calendario mes + timeline día
- [ ] Nuevo turno: formulario con búsqueda de paciente
- [ ] Detalle turno: datos + acciones de estado
- [ ] Lista de pacientes con búsqueda
- [ ] Ficha de paciente con historial de turnos
- [ ] Tests de componentes (flujos críticos)

### Fase 3 — PWA + Offline
- [ ] Configurar vite-plugin-pwa (manifest, service worker, cache)
- [ ] Banner de instalación
- [ ] Storage persistence API
- [ ] Testear offline: desconectar internet y verificar todo
- [ ] Toast de actualización disponible
- [ ] Probar en Safari iOS y Chrome Android

### Fase 4 — Configuración, Notificaciones y Backup
- [ ] Pantalla de configuración completa
- [ ] Onboarding (primer uso)
- [ ] Sistema de export/import (backup)
- [ ] Notificaciones locales (recordatorio de turno)
- [ ] Banner de recordatorio de backup
- [ ] Error boundary global
- [ ] Tests E2E con Playwright (flujos críticos)

### Fase 5 — Deploy y Distribución
- [ ] GitHub Actions pipeline (lint, test, build)
- [ ] Deploy en Vercel
- [ ] Integrar Sentry
- [ ] Testear en dispositivos reales (iPhone + Android)
- [ ] Guía de instalación para el usuario

---

## 18. ADRs (Architecture Decision Records)

### ADR-001: PWA sobre React Native
**Decisión**: Usar PWA en lugar de React Native para la versión offline.
**Contexto**: Se necesita una app que funcione en iOS y Android sin costo de distribución.
**Alternativa descartada**: React Native + Expo (requiere $99/año para iOS, más complejidad de build).
**Consecuencia**: Limitaciones en acceso a hardware nativo y UX no 100% nativa, pero costo $0 y distribución trivial.
**Reversibilidad**: Alta. La lógica de negocio y tipos se reutilizan en React Native si se migra.

### ADR-002: Dexie.js sobre IndexedDB directo
**Decisión**: Usar Dexie.js como wrapper de IndexedDB.
**Contexto**: IndexedDB tiene API verbosa, callback-based, y sin reactive queries.
**Alternativa descartada**: IndexedDB directo (más código, más bugs), localForage (no tiene queries).
**Consecuencia**: Dependencia adicional (~30KB), pero API limpia tipo ORM con migraciones y reactive hooks.

### ADR-003: Zustand sobre Context API / Redux
**Decisión**: Usar Zustand para estado global de UI.
**Contexto**: Se necesita estado global mínimo (la mayoría de datos vive en IndexedDB).
**Alternativa descartada**: Context API (re-renders innecesarios), Redux (overkill para estado UI mínimo).
**Consecuencia**: ~1KB de dependencia, API mínima, sin boilerplate.

### ADR-004: shadcn/ui sobre Material UI / Chakra
**Decisión**: Usar shadcn/ui como librería de componentes.
**Contexto**: Se necesitan componentes accesibles y customizables, con Tailwind.
**Alternativa descartada**: Material UI (pesado, estilo opinionado), Chakra UI (runtime CSS-in-JS).
**Consecuencia**: Los componentes se copian al proyecto (no es dependencia), full control sobre el código.

### ADR-005: react-day-picker sobre FullCalendar
**Decisión**: Usar react-day-picker (~10KB) para vista mes + componente custom para vista día.
**Contexto**: Se necesita calendario mes con indicadores y vista timeline por día en mobile.
**Alternativa descartada**: FullCalendar (~50KB, overkill para mobile), calendario custom desde cero (más tiempo, accesibilidad a cargo nuestro).
**Consecuencia**: Menos peso, más control en UX mobile. Futuro: reemplazar react-day-picker por calendario custom si se necesita más control.

### ADR-006: date-fns sobre dayjs / Luxon
**Decisión**: Usar date-fns para manejo de fechas.
**Contexto**: Se necesitan operaciones de fechas: comparar, formatear, sumar minutos.
**Alternativa descartada**: dayjs (no tree-shakeable de la misma forma), Luxon (más pesado).
**Consecuencia**: Imports granulares, solo se incluye lo que se usa.

---

## 19. Decisiones Técnicas Tomadas

> Puntos que fueron evaluados y resueltos durante la definición del spec.

| # | Pregunta | Decisión | Detalle |
|---|---------|----------|---------|
| 1 | ¿FullCalendar o alternativa ligera? | **react-day-picker + lista custom** | ~10KB vs ~50KB. Calendario mes con react-day-picker, vista día con componente propio. Calendario custom desde cero como futuro feature. |
| 2 | ¿Virtualización de listas desde el inicio? | **No (YAGNI)** | Con ~500 pacientes y ~15 turnos/día no hay problema. Se agrega `@tanstack/virtual` si se detecta lag real. |
| 3 | ¿Encriptar IndexedDB? | **No en MVP, Could Have** | Los datos solo viven en el dispositivo. `dexie-encrypted` se agrega si hay requisito legal/compliance. |
| 4 | ¿Sentry desde MVP? | **No** | Un solo usuario, comunicación directa. Se agrega cuando haya distribución a múltiples usuarios. |
| 5 | ¿Testing E2E en CI? | **Solo local en MVP** | CI corre lint + typecheck + unit/integration. Playwright local antes de pushear. E2E en CI cuando la app crezca. |
| 6 | ¿Soporte iOS < 16.4? | **Sí, sin notificaciones** | La app funciona en versiones anteriores pero se oculta la funcionalidad de notificaciones. Simple `if` al pedir permisos. |
| 7 | ¿Prefetch de rutas? | **Sí, en idle** | La PWA cachea todo con service worker. Prefetch de rutas en background para navegación instantánea. |
| 8 | ¿Backup automático? | **No** | Solo backup manual (export JSON) + recordatorio cada 7 días. IndexedDB no se corrompe fácilmente. |
| 9 | ¿Formato de hora? | **Solo 24h** | Argentina usa 24h. Hardcodeado, sin configuración. |
| 10 | ¿Dark mode? | **Sigue al sistema** | Resuelto en functional spec. Respeta `prefers-color-scheme`, sin selector manual. |
