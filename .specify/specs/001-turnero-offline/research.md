# Especificación: Turnero Offline — App Móvil Multiplataforma

## Resumen

Aplicación offline que se instala en el celular del kinesiólogo (iOS y Android) para gestionar agenda de turnos, pacientes y configuración. Funciona sin internet, sin hosting y sin costo de distribución.

**Enfoque principal**: PWA (Progressive Web App) — cero costo, funciona en ambas plataformas, se instala desde el navegador.

**Alternativa futura**: React Native + Expo — para evolucionar a app nativa si se necesitan features que la PWA no cubra.

---

## ENFOQUE PRINCIPAL: PWA (Progressive Web App)

### ¿Qué es?

Una PWA es una aplicación web que se comporta como app nativa. El kinesiólogo abre una URL en Safari (iOS) o Chrome (Android), toca "Agregar a pantalla de inicio", y listo: ícono en el home screen, pantalla completa, funciona offline.

### ¿Por qué PWA como principal?

| Criterio                        | PWA          | React Native    |
|---------------------------------|:------------:|:---------------:|
| Costo distribución iOS          | $0           | $99/año         |
| Costo distribución Android      | $0           | $0 (APK)        |
| Funciona offline                | Sí           | Sí              |
| Instala como app                | Sí (A2HS)   | Sí (nativo)     |
| Notificaciones locales          | Sí (iOS 16.4+) | Sí           |
| Almacenamiento local            | Sí (IndexedDB) | Sí (SQLite)  |
| Acceso a cámara/sensores        | Limitado     | Completo        |
| Reutiliza código con spec web   | 95%+         | ~50% (lógica)   |
| Complejidad de build/deploy     | Baja         | Media           |
| Performance UI                  | Buena        | Muy buena       |
| Necesita Xcode / Android Studio | No           | Sí (para builds nativos) |

**Ventaja clave**: el frontend React + Vite + Tailwind del spec web se reutiliza casi completo. Solo cambiás la capa de datos (de API REST → IndexedDB local). Mismo código, dos modos de uso.

---

### Arquitectura PWA

```
┌──────────────────────────────────────────────┐
│           Celular del kinesiólogo            │
│                                              │
│  ┌────────────────────────────────────────┐  │
│  │         PWA (Turnero)                  │  │
│  │                                        │  │
│  │  ┌──────────┐    ┌─────────────────┐   │  │
│  │  │   React  │    │  Service Worker  │   │  │
│  │  │   (UI)   │    │  (cache offline) │   │  │
│  │  └────┬─────┘    └─────────────────┘   │  │
│  │       │                                │  │
│  │  ┌────▼──────────────┐                 │  │
│  │  │  Capa de Datos    │                 │  │
│  │  │  (Dexie.js)       │                 │  │
│  │  └────┬──────────────┘                 │  │
│  │       │                                │  │
│  │  ┌────▼──────────────┐                 │  │
│  │  │   IndexedDB       │                 │  │
│  │  │   (navegador)     │                 │  │
│  │  └───────────────────┘                 │  │
│  └────────────────────────────────────────┘  │
│                                              │
│  Sin internet requerido después de instalar  │
└──────────────────────────────────────────────┘
```

### Stack Tecnológico — PWA

| Componente          | Tecnología                    | Justificación                                     |
|---------------------|-------------------------------|----------------------------------------------------|
| Framework           | React 18+ con Vite            | Mismo que el spec web, máxima reutilización        |
| Lenguaje            | TypeScript                    | Type-safety, consistencia con spec web             |
| Estilos             | Tailwind CSS                  | Mismo que spec web                                 |
| Base de datos local | Dexie.js (wrapper IndexedDB)  | API limpia, reactive queries, soporte offline nativo |
| Routing             | React Router v6               | SPA routing, mismo que spec web                    |
| Estado              | Zustand                       | Estado global ligero                               |
| PWA tooling         | vite-plugin-pwa (Workbox)     | Genera service worker, manifest, cache automático  |
| Calendario          | FullCalendar (React)          | Mismo componente que spec web                      |
| UI Components       | shadcn/ui                     | Mismo que spec web                                 |
| Formularios         | React Hook Form + Zod         | Validación type-safe                               |
| Notificaciones      | Notification API + Service Worker | Recordatorios locales programados               |
| Backup              | File System Access API o descarga directa | Export/import de datos como JSON       |

### Base de datos: Dexie.js + IndexedDB

**¿Por qué Dexie.js y no IndexedDB directo?** IndexedDB tiene una API verbosa y callback-based. Dexie la envuelve con una interfaz tipo ORM con promesas, índices declarativos y reactive queries.

```typescript
// Ejemplo de schema en Dexie
import Dexie, { type Table } from 'dexie';

interface Paciente {
  id: string;
  nombre: string;
  apellido: string;
  dni: string;
  obraSocial: string;
  telefono: string;
  email?: string;
  notas?: string;
  createdAt: string;
  updatedAt: string;
}

interface Turno {
  id: string;
  pacienteId: string;
  fecha: string;        // YYYY-MM-DD
  horaInicio: string;   // HH:MM
  horaFin: string;
  estado: 'confirmado' | 'cancelado' | 'completado' | 'no_asistio';
  notas?: string;
  createdAt: string;
  updatedAt: string;
}

interface Configuracion {
  id: number;           // siempre 1 (singleton)
  nombreProfesional: string;
  duracionTurnoMinutos: number;
  horariosAtencion: Record<string, HorarioDia | null>;
  diasBloqueados: string[];
  precios: Record<string, number>;
}

class TurneroDB extends Dexie {
  pacientes!: Table<Paciente>;
  turnos!: Table<Turno>;
  configuracion!: Table<Configuracion>;

  constructor() {
    super('turnero');
    this.version(1).stores({
      pacientes: 'id, dni, [apellido+nombre]',
      turnos: 'id, pacienteId, fecha, [fecha+horaInicio]',
      configuracion: 'id'
    });
  }
}

export const db = new TurneroDB();
```

### Capacidad de almacenamiento

| Plataforma    | Límite IndexedDB                              |
|---------------|------------------------------------------------|
| Chrome/Android | Hasta 80% del espacio libre del dispositivo   |
| Safari/iOS    | ~1GB (puede pedir más al usuario)              |

Para un turnero con miles de pacientes y turnos, el almacenamiento es más que suficiente.

### Consideración importante: persistencia en iOS

Safari puede borrar datos de IndexedDB si el usuario no usa la app por varias semanas y el dispositivo necesita espacio. Esto se mitiga de tres formas:

1. **Instalar como PWA** (agregar a home screen): una vez instalada, iOS trata los datos con más persistencia que una pestaña de Safari.
2. **Storage persistence API**: al iniciar la app, solicitar `navigator.storage.persist()` para indicar al navegador que no borre los datos.
3. **Backups regulares**: el sistema de export/import que ya incluimos.

---

### Pantallas de la App (PWA)

Son las mismas del spec web, con adaptaciones para UX móvil.

#### 1. Home / Dashboard
- Fecha del día.
- Resumen: "Hoy tenés X turnos".
- Lista de turnos del día como cards (hora, nombre paciente, estado).
- Botón "+" flotante para crear turno.
- Tap en turno → detalle.
- Layout responsive: en celular es una sola columna, en PC se expande.

#### 2. Agenda (Calendario)
- Vista mes con indicadores en días con turnos.
- Tap en día → timeline con turnos de ese día.
- Tap en slot vacío → nuevo turno pre-cargado con esa fecha/hora.
- Alternativa a FullCalendar para mobile: vista tipo lista agrupada por día (más simple y performante en móvil).

#### 3. Nuevo Turno
- Selector de fecha.
- Selector de hora (solo horarios disponibles).
- Buscador de paciente por DNI (campo con autocomplete).
  - Si existe: muestra nombre y datos.
  - Si no existe: expande formulario inline para crearlo.
- Notas opcionales.
- Botón "Confirmar turno".

#### 4. Detalle del Turno
- Datos completos: fecha, hora, paciente, obra social, estado.
- Acciones: marcar completado, marcar no asistió, reprogramar, cancelar.
- Link a ficha del paciente.

#### 5. Pacientes
- Barra de búsqueda (nombre, apellido, DNI).
- Lista scrollable.
- Tap → ficha del paciente.

#### 6. Ficha del Paciente
- Datos personales (editables).
- Historial de turnos (más recientes primero).
- Botón "Agendar turno para este paciente".

#### 7. Configuración
- Nombre del profesional.
- Duración del turno.
- Horarios de atención por día.
- Precios por cobertura.
- Días bloqueados.
- Sección backup: botones "Exportar datos" / "Importar datos".

---

### Notificaciones Locales

Las PWAs en iOS 16.4+ soportan notificaciones push cuando están instaladas como app. Se programan desde el Service Worker.

| Recordatorio                          | Cuándo se dispara                              |
|---------------------------------------|-------------------------------------------------|
| "Mañana tenés X turnos"              | Cada día a las 21:00, si hay turnos al día siguiente |
| "En 30 min: turno con [nombre]"      | 30 minutos antes de cada turno                  |

**Cómo funciona**: al crear/modificar un turno, la app programa las notificaciones en el Service Worker. Se disparan localmente, sin servidor.

**Limitación iOS**: el usuario debe dar permiso explícito para notificaciones la primera vez. La app debe mostrar un prompt claro explicando por qué.

---

### Backup y Seguridad de Datos

#### Export

Botón "Exportar datos" en Configuración genera un archivo JSON con toda la información y ofrece compartirlo (WhatsApp, mail, Drive, etc.).

```json
{
  "version": "1.0",
  "exportedAt": "2026-03-21T10:30:00",
  "pacientes": [...],
  "turnos": [...],
  "configuracion": {...}
}
```

#### Import

Botón "Importar datos" permite seleccionar un archivo JSON de backup y restaurar los datos. Muestra un resumen antes de confirmar ("Se importarán X pacientes y Y turnos. ¿Continuar?").

#### Recomendación al usuario

La app muestra un banner periódico (ej: cada 7 días) recordando hacer backup si no se hizo recientemente.

---

### Distribución de la PWA

| Paso | Acción |
|------|--------|
| 1    | Deployar la PWA en cualquier hosting estático gratuito (Vercel, Netlify, GitHub Pages) |
| 2    | Enviar el link al kinesiólogo por WhatsApp |
| 3    | Él abre el link en Safari (iOS) o Chrome (Android) |
| 4    | Toca "Compartir" → "Agregar a pantalla de inicio" |
| 5    | La app aparece como ícono, se abre en pantalla completa, funciona offline |

**Costo total: $0**

**Nota**: la PWA necesita internet solo la primera vez para cargar. Después funciona 100% offline. Las actualizaciones se descargan automáticamente en background cuando hay conexión.

---

### Estructura del Proyecto PWA

```
turnero-pwa/
├── public/
│   ├── manifest.json              # PWA manifest (nombre, ícono, colores)
│   └── icons/                     # Íconos para home screen
├── src/
│   ├── main.tsx                   # Entry point
│   ├── App.tsx                    # Router principal
│   ├── pages/
│   │   ├── Dashboard.tsx
│   │   ├── Agenda.tsx
│   │   ├── NuevoTurno.tsx
│   │   ├── DetalleTurno.tsx
│   │   ├── Pacientes.tsx
│   │   ├── FichaPaciente.tsx
│   │   └── Configuracion.tsx
│   ├── components/
│   │   ├── TurnoCard.tsx
│   │   ├── PacienteSearch.tsx
│   │   ├── HorarioSelector.tsx
│   │   ├── AgendaTimeline.tsx
│   │   ├── BackupManager.tsx
│   │   └── Layout.tsx
│   ├── db/
│   │   ├── database.ts            # Dexie schema y conexión
│   │   ├── paciente.repo.ts       # Queries de pacientes
│   │   ├── turno.repo.ts          # Queries de turnos
│   │   └── config.repo.ts         # Queries de configuración
│   ├── services/
│   │   ├── disponibilidad.ts      # Lógica de horarios libres
│   │   ├── backup.ts              # Export/import JSON
│   │   └── notifications.ts       # Programar recordatorios
│   ├── stores/
│   │   └── app.store.ts           # Zustand
│   ├── types/
│   │   └── index.ts
│   └── utils/
│       └── dates.ts
├── index.html
├── vite.config.ts                 # Incluye vite-plugin-pwa
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```

### Fases de Desarrollo — PWA

#### Fase 1 — Setup y datos
- Proyecto React + Vite + TypeScript + Tailwind.
- Configurar Dexie.js con schema completo.
- Repos: CRUD pacientes, turnos, configuración.
- Servicio de disponibilidad horaria.

#### Fase 2 — Pantallas principales
- Dashboard con turnos del día.
- Calendario con vista mes + timeline día.
- Formulario nuevo turno con búsqueda de paciente.
- Lista y ficha de pacientes.

#### Fase 3 — PWA + Offline
- Configurar vite-plugin-pwa (manifest, service worker, cache).
- Testear offline: desconectar internet y verificar que todo funcione.
- Agregar banner de instalación ("Agregar a pantalla de inicio").
- Storage persistence API.

#### Fase 4 — Config, notificaciones y backup
- Pantalla de configuración completa.
- Notificaciones locales programadas.
- Sistema de export/import de datos.
- Banner de recordatorio de backup.

#### Fase 5 — Deploy y distribución
- Deploy en Vercel o Netlify (gratis).
- Enviar link al kinesiólogo.
- Guía rápida de instalación como PWA.

---

## ALTERNATIVA FUTURA: React Native + Expo

### ¿Cuándo considerar migrar a React Native?

Migrar a app nativa tiene sentido solo si se necesitan features que la PWA no soporta:

| Feature                              | PWA  | React Native |
|--------------------------------------|:----:|:------------:|
| Acceso a contactos del teléfono      | No   | Sí           |
| Bluetooth / NFC                      | Limitado | Sí       |
| Background tasks avanzados           | Limitado | Sí       |
| Widgets en home screen               | No   | Sí           |
| Integración profunda con OS          | No   | Sí           |
| Presencia en App Store / Play Store  | No   | Sí           |
| UX 100% nativa (transiciones, haptics) | No | Sí          |

Para un turnero, ninguno de estos es crítico. La PWA cubre todo lo necesario.

### Stack React Native (referencia)

| Componente        | Tecnología                     |
|-------------------|--------------------------------|
| Framework         | React Native + Expo SDK 52+    |
| Lenguaje          | TypeScript                     |
| Base de datos     | expo-sqlite + Drizzle ORM      |
| Navegación        | Expo Router                    |
| Estado            | Zustand                        |
| UI                | React Native Paper o Tamagui   |
| Calendario        | react-native-calendars         |
| Notificaciones    | expo-notifications              |
| Backup            | expo-file-system + expo-sharing |
| Build             | EAS Build                      |

### Costo de distribución React Native

| Plataforma | Método            | Costo       |
|------------|-------------------|-------------|
| Android    | APK directo       | $0          |
| Android    | Play Store        | $25 (único) |
| iOS        | TestFlight        | $99/año     |
| iOS        | App Store         | $99/año     |

### Reutilización de código PWA → React Native

Si se migra en el futuro, se reutiliza:

- **100%**: tipos TypeScript, lógica de negocio (servicios), validaciones Zod, store Zustand.
- **~70%**: estructura de pantallas y componentes (adaptar de HTML/Tailwind a React Native views).
- **0%**: capa de datos (IndexedDB/Dexie → SQLite/Drizzle), estilos (Tailwind → StyleSheet/Paper), service worker.

La migración es viable pero no trivial. Solo hacerla si hay una razón concreta.

---

## Comparativa Final

| Criterio                     | PWA (principal)        | React Native (futuro)     |
|------------------------------|:----------------------:|:-------------------------:|
| Costo total                  | $0                     | $0 Android / $99 iOS      |
| Funciona en iOS              | Sí                     | Sí (con Developer Account)|
| Funciona en Android          | Sí                     | Sí                        |
| Offline completo             | Sí                     | Sí                        |
| Notificaciones               | Sí (iOS 16.4+)        | Sí                        |
| Reutiliza código del spec web | 95%                   | ~50%                      |
| Tiempo de desarrollo         | Menor                  | Mayor                     |
| Complejidad de distribución  | Nula (es un link)      | Media (builds, signing)   |
| Riesgo pérdida de datos      | Medio (mitigado con backup) | Bajo (SQLite en disco) |
| Experiencia de usuario       | Muy buena              | Excelente                 |