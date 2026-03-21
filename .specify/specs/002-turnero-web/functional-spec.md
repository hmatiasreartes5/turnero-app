# Especificación: Turnero Web — Consultorio de Kinesiología

## Resumen

Aplicación web monolítica para gestión de turnos de un consultorio de kinesiología. El kinesiólogo accede desde cualquier navegador (PC o celular) para administrar su agenda, pacientes y configuración.

---

## Arquitectura

### Tipo: Monolito

El frontend y el backend conviven en el mismo binario/proceso. Go sirve la API REST y también sirve los archivos estáticos del frontend React (build compilado).

```
┌─────────────────────────────────────────┐
│              Binario Go                 │
│                                         │
│  ┌──────────────┐  ┌────────────────┐   │
│  │  API REST     │  │ Static Files   │   │
│  │  /api/*       │  │ React Build    │   │
│  │               │  │ /*             │   │
│  └──────┬───────┘  └────────────────┘   │
│         │                               │
│  ┌──────▼───────┐                       │
│  │  Services     │                       │
│  │  (lógica de   │                       │
│  │   negocio)    │                       │
│  └──────┬───────┘                       │
│         │                               │
│  ┌──────▼───────┐                       │
│  │  Repository   │                       │
│  │  (acceso DB)  │                       │
│  └──────┬───────┘                       │
└─────────┼───────────────────────────────┘
          │
   ┌──────▼───────┐
   │  PostgreSQL   │
   └──────────────┘
```

### Estructura del proyecto

```
turnero/
├── cmd/
│   └── server/
│       └── main.go              # Entrypoint
├── internal/
│   ├── config/
│   │   └── config.go            # Env vars, configuración
│   ├── models/
│   │   ├── paciente.go
│   │   ├── turno.go
│   │   └── configuracion.go
│   ├── repository/
│   │   ├── paciente_repo.go
│   │   ├── turno_repo.go
│   │   └── config_repo.go
│   ├── services/
│   │   ├── paciente_svc.go
│   │   ├── turno_svc.go
│   │   └── disponibilidad_svc.go
│   ├── handlers/
│   │   ├── paciente_handler.go
│   │   ├── turno_handler.go
│   │   └── config_handler.go
│   ├── middleware/
│   │   ├── auth.go
│   │   └── cors.go
│   └── database/
│       ├── connection.go
│       └── migrations/
├── web/                          # Frontend React
│   ├── src/
│   ├── package.json
│   └── dist/                     # Build compilado (embebido en Go)
├── go.mod
├── go.sum
├── Makefile
└── .env
```

---

## Stack Tecnológico

### Backend — Go

| Componente     | Tecnología                   | Justificación                                      |
|----------------|------------------------------|-----------------------------------------------------|
| Router HTTP    | Chi (go-chi/chi)             | Ligero, idiomático, middleware composable, estándar en la comunidad Go |
| Base de datos  | PostgreSQL                   | Ver sección de análisis de DB abajo                 |
| Driver DB      | pgx (jackc/pgx)              | Driver nativo de PostgreSQL para Go, alto rendimiento, soporte completo de tipos |
| Query builder  | sqlc                         | Genera código Go type-safe a partir de queries SQL. Sin magia ORM, control total |
| Migraciones    | golang-migrate               | Migraciones versionadas en SQL puro                 |
| Auth           | JWT (golang-jwt)             | Sesiones stateless, simple para un solo usuario     |
| Validación     | go-playground/validator      | Validación de structs con tags                      |
| Config         | envconfig o viper             | Carga de variables de entorno                       |
| Embed frontend | Go embed (//go:embed)        | El build de React se embebe en el binario Go, un solo archivo desplegable |

**¿Por qué Chi y no Gin/Fiber/Echo?** Chi sigue la interfaz estándar de `net/http`, no agrega abstracciones propias. Esto significa que cualquier middleware del ecosistema estándar de Go funciona directamente. Para un proyecto de este tamaño es la opción más limpia.

**¿Por qué sqlc y no GORM?** GORM es un ORM completo que abstrae SQL. Para un turnero simple, sqlc te da type-safety sin magia: escribís SQL real y sqlc genera las funciones Go. Tenés control total de las queries y el rendimiento es predecible. Si preferís más productividad a costa de menos control, GORM es válido también.

### Base de datos — Análisis

| DB          | Pros                                        | Contras                                    | Veredicto       |
|-------------|---------------------------------------------|--------------------------------------------|-----------------|
| PostgreSQL  | Tipo JSON nativo (para horarios/config), soporte excelente en Go con pgx, robusto, extensible, free tier en Supabase/Neon/Railway | Necesita un servidor corriendo             | **Recomendada** |
| SQLite      | Archivo único, cero config, ideal para monolito simple | Concurrencia limitada, sin JSON nativo rico, complicado para deploy en cloud | Buena para dev/offline |
| MySQL       | Muy difundido, buen soporte en Go           | Menos features que PostgreSQL, tipos JSON menos maduros | Viable pero sin ventaja |

**Recomendación: PostgreSQL** con Supabase free tier (500MB, más que suficiente) o Neon free tier. Si en algún momento se quiere ir full offline/self-contained, SQLite como alternativa embebida.

### Frontend — React

| Componente      | Tecnología                  | Justificación                                    |
|-----------------|-----------------------------|--------------------------------------------------|
| Framework       | React 18+ con Vite          | Build rápido, ecosystem maduro, te sentís cómodo |
| Estilos         | Tailwind CSS                | Utility-first, rápido para prototipar, consistente |
| Routing         | React Router v6             | Estándar para SPAs React                         |
| Estado          | Zustand o React Query       | Zustand para estado local, React Query para cache de API |
| HTTP client     | fetch nativo o Axios        | fetch alcanza para este proyecto                 |
| Calendario      | FullCalendar (React wrapper) | Componente de calendario interactivo maduro, tiene vista día/semana/mes |
| UI Components   | shadcn/ui                   | Componentes accesibles, customizables, basados en Radix |
| Build           | Vite → dist/ → embebido en Go | El build se genera como archivos estáticos que Go sirve |

**¿Por qué React y no Next.js?** En un monolito Go, Next.js no tiene sentido porque su valor principal (SSR, API routes, routing filesystem) lo maneja Go. React puro con Vite genera un build estático que Go embebe con `//go:embed`. Más simple, menos dependencias.

---

## Modelo de Datos

### Tabla: pacientes

| Columna        | Tipo                  | Restricciones              |
|----------------|-----------------------|----------------------------|
| id             | UUID                  | PK, default gen_random_uuid() |
| nombre         | VARCHAR(100)          | NOT NULL                   |
| apellido       | VARCHAR(100)          | NOT NULL                   |
| dni            | VARCHAR(20)           | NOT NULL, UNIQUE           |
| obra_social    | VARCHAR(100)          | NOT NULL                   |
| telefono       | VARCHAR(20)           | NOT NULL                   |
| email          | VARCHAR(150)          | NULL                       |
| notas          | TEXT                  | NULL                       |
| created_at     | TIMESTAMPTZ           | NOT NULL, default now()    |
| updated_at     | TIMESTAMPTZ           | NOT NULL, default now()    |

### Tabla: turnos

| Columna        | Tipo                  | Restricciones              |
|----------------|-----------------------|----------------------------|
| id             | UUID                  | PK                         |
| paciente_id    | UUID                  | FK → pacientes(id)         |
| fecha          | DATE                  | NOT NULL                   |
| hora_inicio    | TIME                  | NOT NULL                   |
| hora_fin       | TIME                  | NOT NULL                   |
| estado         | VARCHAR(20)           | NOT NULL, default 'confirmado' |
| origen         | VARCHAR(10)           | NOT NULL, default 'manual' |
| notas          | TEXT                  | NULL                       |
| created_at     | TIMESTAMPTZ           | NOT NULL, default now()    |
| updated_at     | TIMESTAMPTZ           | NOT NULL, default now()    |

**Constraint**: UNIQUE(fecha, hora_inicio) — no se superponen turnos.

**Valores de estado**: 'confirmado', 'cancelado', 'completado', 'no_asistio'

**Valores de origen**: 'manual', 'bot'

### Tabla: configuracion

| Columna                 | Tipo      | Restricciones          |
|-------------------------|-----------|------------------------|
| id                      | INT       | PK, default 1 (singleton) |
| nombre_profesional      | VARCHAR(100) | NOT NULL            |
| duracion_turno_minutos  | INT       | NOT NULL, default 45   |
| horarios_atencion       | JSONB     | NOT NULL               |
| dias_bloqueados         | JSONB     | NOT NULL, default '[]' |
| precios                 | JSONB     | NOT NULL               |

**Ejemplo horarios_atencion (JSONB):**
```json
{
  "lunes":    { "inicio": "08:00", "fin": "17:00", "pausas": [{"inicio": "12:00", "fin": "13:00"}] },
  "martes":   { "inicio": "08:00", "fin": "17:00", "pausas": [] },
  "miercoles": { "inicio": "08:00", "fin": "12:00", "pausas": [] },
  "jueves":   { "inicio": "08:00", "fin": "17:00", "pausas": [] },
  "viernes":  { "inicio": "08:00", "fin": "12:00", "pausas": [] },
  "sabado":   null,
  "domingo":  null
}
```

**Ejemplo precios (JSONB):**
```json
{
  "particular": 15000,
  "osde": 5000,
  "swiss_medical": 4500,
  "obra_social_general": 3000
}
```

---

## API REST

### Autenticación

| Endpoint         | Método | Descripción              |
|------------------|--------|--------------------------|
| /api/auth/login  | POST   | Login → devuelve JWT     |
| /api/auth/me     | GET    | Info del usuario logueado |

### Pacientes

| Endpoint                  | Método | Descripción                  |
|---------------------------|--------|------------------------------|
| /api/pacientes            | GET    | Listar (con búsqueda ?q=)   |
| /api/pacientes            | POST   | Crear paciente               |
| /api/pacientes/:id        | GET    | Detalle + historial de turnos |
| /api/pacientes/:id        | PUT    | Actualizar datos             |
| /api/pacientes/:id        | DELETE | Eliminar (soft delete)       |

### Turnos

| Endpoint                      | Método | Descripción                       |
|-------------------------------|--------|-----------------------------------|
| /api/turnos                   | GET    | Listar por rango de fechas (?desde=&hasta=) |
| /api/turnos                   | POST   | Crear turno (valida disponibilidad) |
| /api/turnos/:id               | GET    | Detalle del turno                 |
| /api/turnos/:id               | PUT    | Actualizar (fecha, hora, estado)  |
| /api/turnos/:id               | DELETE | Cancelar turno                    |
| /api/turnos/disponibilidad    | GET    | Horarios libres para una fecha (?fecha=) |

### Configuración

| Endpoint            | Método | Descripción               |
|---------------------|--------|---------------------------|
| /api/config         | GET    | Obtener configuración      |
| /api/config         | PUT    | Actualizar configuración   |

---

## Pantallas del Frontend

### 1. Login
Formulario simple de usuario/contraseña. Para el MVP puede ser un solo usuario hardcodeado en config o en la DB.

### 2. Dashboard (Home)
- Resumen del día: cantidad de turnos, próximo turno, turnos sin confirmar.
- Lista de turnos del día con hora, paciente y estado.
- Acceso rápido a "Nuevo turno".

### 3. Agenda (Calendario)
- Vista día y semana (FullCalendar).
- Turnos como bloques de color según estado.
- Click en un slot vacío → abre formulario de nuevo turno con hora pre-cargada.
- Click en un turno → abre detalle/edición.

### 4. Nuevo turno / Editar turno
- Selector de fecha y hora (solo muestra horarios disponibles).
- Buscador de paciente por DNI. Si no existe, formulario inline para crear uno.
- Campo de notas.
- Botón confirmar / cancelar.

### 5. Pacientes
- Lista paginada con búsqueda por nombre, apellido o DNI.
- Click en paciente → ficha con datos personales + historial de turnos.

### 6. Configuración
- Horarios de atención por día (con pausas).
- Duración estándar del turno.
- Precios por tipo de cobertura.
- Días bloqueados (calendario para marcar).

---

## Reglas de Negocio

1. No se pueden crear turnos superpuestos (mismo horario).
2. Solo se permiten turnos dentro de los horarios de atención configurados.
3. Días bloqueados rechazan cualquier turno.
4. Un paciente no puede tener dos turnos el mismo día (configurable).
5. Al cancelar un turno, el horario queda disponible nuevamente.
6. El DNI es identificador único del paciente.

---

## Deploy — Opciones gratuitas

### Opción recomendada: Fly.io free tier + Supabase free tier

| Servicio   | Free tier                          | Uso                     |
|------------|-------------------------------------|-------------------------|
| Fly.io     | 3 VMs shared, 256MB RAM            | Corre el binario Go     |
| Supabase   | 500MB PostgreSQL, 50K rows         | Base de datos           |

**Deploy**: se compila un binario Go con el frontend embebido → se mete en un Dockerfile → se deploya a Fly.io. Un solo artefacto.

### Alternativa: Railway free tier o Render free tier

Ambos ofrecen hosting gratuito para apps con Dockerfile. Render tiene cold starts en free tier (tarda ~30s en levantar si estuvo inactivo).

### Alternativa self-hosted: cualquier PC/VPS

Como es un solo binario Go, se puede correr en cualquier máquina. Si tu amigo tiene una PC en el consultorio siempre encendida, se corre ahí y se accede por IP local.

---

## Fases de desarrollo

### Fase 1 — Backend base
- Setup proyecto Go con Chi.
- Conexión a PostgreSQL con pgx.
- Migraciones con golang-migrate.
- CRUD pacientes + turnos con sqlc.
- Servicio de disponibilidad.
- Auth básico con JWT.

### Fase 2 — Frontend
- Setup React + Vite + Tailwind.
- Pantallas: Login, Dashboard, Agenda (FullCalendar), Pacientes, Config.
- Integración con la API.
- Build embebido en Go con //go:embed.

### Fase 3 — Deploy
- Dockerfile multi-stage (build React + build Go).
- Deploy a Fly.io o Railway.
- Conectar a Supabase PostgreSQL.

### Fase 4 (futura) — Bot WhatsApp
- Se agrega como servicio dentro del mismo binario Go o como proceso separado.
- Usa la misma DB y lógica de servicios.
- Requiere VPS con proceso persistente (el free tier de Fly.io puede servir).