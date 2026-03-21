# Spec Funcional: Turnero Offline — App Móvil

## 1. Visión del Producto

### Problema
Los kinesiólogos independientes gestionan sus turnos con métodos informales (agenda de papel, WhatsApp, notas en el celular). Esto genera turnos olvidados, superposiciones, falta de historial de pacientes y ningún recordatorio automático.

### Solución
Una aplicación móvil que funciona **100% sin internet** para gestionar agenda de turnos, pacientes y configuración. Se instala desde un link, no requiere cuentas, no tiene costo y los datos quedan en el dispositivo del profesional.

### Propuesta de valor
- **Cero fricción**: no necesita cuenta, no necesita internet, no necesita App Store.
- **Cero costo**: ni para el profesional ni para el desarrollador (sin hosting, sin licencias).
- **Privacidad total**: los datos nunca salen del dispositivo (salvo backup manual).

---

## 2. Público Objetivo

### Persona primaria: Kinesiólogo independiente

| Atributo | Detalle |
|----------|---------|
| Nombre ficticio | Martín |
| Edad | 28-45 años |
| Perfil | Kinesiólogo que atiende en consultorio propio o alquilado |
| Volumen | 8-15 pacientes por día |
| Tecnología | Usa iPhone o Android, maneja WhatsApp y apps básicas |
| Dolor actual | Agenda en papel o en la cabeza, olvida turnos, no tiene historial organizado |
| Motivación | Quiere algo simple, rápido, que no le cueste plata ni tiempo de setup |

### Contexto de uso
- Consulta la app **entre pacientes** (sesiones de 30-60 min).
- Agenda turnos mientras habla por teléfono o WhatsApp con el paciente.
- Revisa la agenda a la noche para preparar el día siguiente.
- Usa el celular como dispositivo principal (no PC).

---

## 3. Plataformas

| Plataforma | Soporte | Enfoque |
|------------|---------|---------|
| iOS (Safari) | Principal | PWA instalada desde el navegador |
| Android (Chrome) | Secundario | PWA instalada desde el navegador |
| Desktop (navegador) | Bonus | Funciona pero no es prioridad de diseño |

**Enfoque PWA**: la app se distribuye como un link. El usuario abre el link, toca "Agregar a pantalla de inicio" y listo. Funciona offline después de la primera carga.

---

## 4. User Stories

### 4.1 Gestión de Turnos

| ID | User Story | Prioridad |
|----|-----------|-----------|
| US-01 | Como kinesiólogo quiero ver los turnos de hoy al abrir la app para organizarme rápidamente | Must |
| US-02 | Como kinesiólogo quiero crear un turno nuevo seleccionando fecha, hora, duración y paciente | Must |
| US-03 | Como kinesiólogo quiero que al crear un turno solo me muestre los horarios disponibles para evitar superposiciones | Must |
| US-04 | Como kinesiólogo quiero marcar un turno como completado, cancelado o no asistió para llevar registro | Must |
| US-05 | Como kinesiólogo quiero reprogramar un turno cambiando fecha y/u hora | Must |
| US-06 | Como kinesiólogo quiero ver la agenda semanal/mensual para tener visión general | Must |
| US-07 | Como kinesiólogo quiero tocar un día del calendario y ver los turnos de ese día | Must |
| US-08 | Como kinesiólogo quiero tocar un slot vacío en el calendario y crear un turno precargado con esa fecha/hora | Should |
| US-09 | Como kinesiólogo quiero agregar notas a un turno para recordar observaciones del paciente | Should |
| US-10 | Como kinesiólogo quiero ver turnos pasados para consultar historial | Should |
| US-29 | Como kinesiólogo quiero elegir la duración de cada turno al crearlo (con default configurable) | Must |
| US-30 | Como kinesiólogo quiero crear turnos recurrentes (ej: repetir semanalmente por X semanas) | Should |

### 4.2 Gestión de Pacientes

| ID | User Story | Prioridad |
|----|-----------|-----------|
| US-11 | Como kinesiólogo quiero buscar un paciente por nombre, apellido o DNI | Must |
| US-12 | Como kinesiólogo quiero crear un paciente nuevo al momento de agendar un turno si no existe | Must |
| US-13 | Como kinesiólogo quiero ver la ficha de un paciente con sus datos y su historial de turnos | Must |
| US-14 | Como kinesiólogo quiero editar los datos de un paciente | Must |
| US-15 | Como kinesiólogo quiero ver qué obra social tiene cada paciente | Should |
| US-16 | Como kinesiólogo quiero agregar notas clínicas a la ficha del paciente | Could |

### 4.3 Configuración

| ID | User Story | Prioridad |
|----|-----------|-----------|
| US-17 | Como kinesiólogo quiero configurar mis horarios de atención por día de la semana | Must |
| US-18 | Como kinesiólogo quiero configurar la duración estándar de un turno | Must |
| US-19 | Como kinesiólogo quiero bloquear días específicos (vacaciones, feriados) | Must |
| US-20 | Como kinesiólogo quiero configurar precios por obra social/particular | Should |
| US-21 | Como kinesiólogo quiero definir mi nombre profesional para que aparezca en la app | Should |

### 4.4 Notificaciones

| ID | User Story | Prioridad |
|----|-----------|-----------|
| US-22 | Como kinesiólogo quiero recibir un recordatorio 30 minutos antes de cada turno | Should |
| US-23 | Como kinesiólogo quiero recibir un resumen la noche anterior con los turnos del día siguiente | Could |

### 4.5 Backup y Datos

| ID | User Story | Prioridad |
|----|-----------|-----------|
| US-24 | Como kinesiólogo quiero exportar todos mis datos como backup para no perderlos | Must |
| US-25 | Como kinesiólogo quiero importar un backup para restaurar mis datos (cambio de celular, pérdida de datos) | Must |
| US-26 | Como kinesiólogo quiero que la app me recuerde hacer backup periódicamente | Should |

### 4.6 Instalación y Primer Uso

| ID | User Story | Prioridad |
|----|-----------|-----------|
| US-27 | Como kinesiólogo quiero instalar la app desde un link sin pasar por App Store | Must |
| US-28 | Como kinesiólogo quiero un onboarding mínimo que me pida solo lo esencial para empezar | Should |

---

## 5. Pantallas y Flujos de Navegación

### 5.1 Mapa de navegación

```
┌─────────────────────────────────────────────────────┐
│                   Tab Bar (inferior)                │
│                                                     │
│   [Home]     [Agenda]    [Pacientes]    [Config]    │
└────┬────────────┬────────────┬────────────┬─────────┘
     │            │            │            │
     ▼            ▼            ▼            ▼
  Dashboard    Calendario   Lista       Configuración
     │            │        Pacientes        │
     │            │            │            │
     │            ▼            ▼            ▼
     │        Vista día    Ficha        Backup
     │            │        Paciente    (Export/Import)
     │            │            │
     ▼            ▼            │
  Detalle    Nuevo Turno ◄─────┘
  Turno      (modal/page)
     │
     ▼
  Acciones
  (completar, cancelar,
   reprogramar)
```

### 5.2 Pantallas

#### Home / Dashboard
- **Qué ve el usuario**: fecha de hoy, cantidad de turnos, lista de turnos como cards ordenados por hora.
- **Cada card muestra**: hora, nombre del paciente, obra social, estado (color).
- **Acciones**: tocar card → detalle del turno. Botón "+" flotante → nuevo turno.
- **Estado vacío**: mensaje "No tenés turnos para hoy" con botón para crear uno.

#### Agenda (Calendario)
- **Vista mes**: calendario con indicadores (puntos o números) en días con turnos.
- **Tocar un día**: muestra timeline/lista del día con turnos y slots vacíos.
- **Tocar slot vacío**: abre formulario de nuevo turno precargado con fecha y hora.
- **Navegación**: flechas para mes anterior/siguiente.

#### Nuevo Turno
- **Campos**: fecha (selector), hora de inicio (solo horarios disponibles), duración (selector con default de configuración), paciente (buscador).
- **Duración**: selector con opciones predefinidas (15, 30, 45, 60 min). El default viene de Configuración pero se puede cambiar por turno.
- **Búsqueda de paciente**: campo con autocomplete por nombre/apellido/DNI.
  - Si encuentra: muestra nombre y datos resumidos.
  - Si no encuentra: muestra opción "Crear paciente nuevo" que expande formulario inline (nombre, apellido, DNI y teléfono obligatorios).
- **Campos opcionales**: notas.
- **Validaciones**: no permitir turno en slot ocupado, no permitir turno fuera de horario de atención, no permitir turno en día bloqueado, no permitir turno en el pasado.
- **Acción**: botón "Confirmar turno".

#### Detalle del Turno
- **Qué ve el usuario**: fecha, hora, duración, paciente (nombre + datos), obra social, estado, notas.
- **Acciones disponibles según estado**:
  - Confirmado → Completar, Cancelar, Marcar no asistió, Reprogramar, Editar notas.
  - Completado → Solo lectura + editar notas.
  - Cancelado → Solo lectura.
  - No asistió → Solo lectura + reprogramar.
- **Link**: tocar nombre del paciente → ficha del paciente.

#### Pacientes (lista)
- **Barra de búsqueda** prominente arriba.
- **Lista scrollable** ordenada alfabéticamente (apellido, nombre).
- **Cada item**: nombre completo, DNI, obra social.
- **Tocar item** → ficha del paciente.
- **Estado vacío**: "No tenés pacientes cargados. Se crean automáticamente al agendar turnos."

#### Ficha del Paciente
- **Datos personales** (editables): nombre*, apellido*, DNI*, teléfono*, email, obra social, notas. (*obligatorios)
- **Historial de turnos**: lista cronológica (más recientes primero) con fecha, hora, estado.
- **Acciones**: editar datos, agendar turno para este paciente.

#### Configuración
- **Secciones**:
  - Nombre del profesional.
  - Duración estándar del turno (ej: 30 min, 45 min, 60 min).
  - Horarios de atención por día (ej: Lunes 8:00-12:00 y 14:00-18:00).
  - Días bloqueados (selector de fechas, con opción de agregar/quitar).
  - Precios por cobertura (lista editable: obra social → precio).
  - Backup: botones "Exportar datos" e "Importar datos".

---

## 6. Reglas de Negocio

### 6.1 Turnos

| Regla | Descripción |
|-------|-------------|
| RN-01 | No se pueden crear dos turnos en el mismo horario (superposición). Un turno ocupa un bloque completo según la duración configurada. |
| RN-02 | Solo se pueden crear turnos dentro del horario de atención configurado para ese día. |
| RN-03 | No se pueden crear turnos en días bloqueados. |
| RN-04 | No se pueden crear turnos en el pasado. |
| RN-05 | Todo turno debe tener un paciente asociado. |
| RN-06 | Los turnos cancelados liberan el horario (se puede agendar otro en ese slot). |
| RN-07 | La duración de cada turno se elige al crearlo (15, 30, 45, 60 min). La configuración global define el default. |

### 6.2 Estados de un turno

> [Ver diagrama de estados del turno](./diagrams/state-turno.md)

**Transiciones permitidas:**
- Confirmado → Completado
- Confirmado → Cancelado
- Confirmado → No asistió
- No asistió → Reprogramar (crea un turno nuevo, el original queda como "no asistió")

**Transiciones NO permitidas:**
- Completado → cualquier otro estado
- Cancelado → cualquier otro estado (se debe crear turno nuevo)

### 6.3 Pacientes

| Regla | Descripción |
|-------|-------------|
| RN-08 | Nombre, apellido, DNI y teléfono son obligatorios. Email y obra social son opcionales. |
| RN-09 | El DNI debe ser único. No pueden existir dos pacientes con el mismo DNI. |
| RN-10 | No se puede eliminar un paciente que tiene turnos asociados. |
| RN-11 | Un paciente se puede crear de forma standalone o durante la creación de un turno. |

### 6.4 Configuración y Horarios

| Regla | Descripción |
|-------|-------------|
| RN-12 | Cada día de la semana puede tener cero, uno o dos bloques de atención (ej: mañana y tarde). |
| RN-13 | Un día sin bloques configurados se considera no laborable. |
| RN-14 | Los días bloqueados sobreescriben la configuración semanal (ej: un lunes feriado). |
| RN-15 | Cambiar la duración default del turno NO afecta turnos ya creados, solo el default para nuevos. |
| RN-16 | Cambiar horarios de atención NO cancela turnos existentes fuera del nuevo rango. |

### 6.5 Backup

| Regla | Descripción |
|-------|-------------|
| RN-17 | Al reprogramar un turno, el turno nuevo guarda referencia al turno original (trazabilidad básica). |
| RN-18 | El export genera un archivo JSON con todos los datos (pacientes, turnos, configuración). |
| RN-19 | El import reemplaza todos los datos actuales (no hace merge). Se pide confirmación explícita. |
| RN-20 | Antes de importar se muestra resumen: "Se importarán X pacientes y Y turnos. Los datos actuales serán reemplazados. ¿Continuar?" |
| RN-21 | Si el archivo de import es inválido o corrupto, se muestra error y no se modifican los datos actuales. |

---

## 7. Notificaciones

| Notificación | Cuándo | Mensaje |
|-------------|--------|---------|
| Recordatorio de turno | 30 minutos antes del turno | "En 30 min: turno con [nombre paciente]" |
| Resumen diario | 21:00 del día anterior (si hay turnos) | "Mañana tenés X turnos. El primero es a las HH:MM" |
| Recordatorio de backup | Cada 7 días si no se hizo backup | "Hace más de una semana que no hacés backup. Tus datos están solo en este dispositivo." |

**Requisito**: el usuario debe dar permiso explícito para notificaciones. La app muestra un prompt claro la primera vez explicando para qué se usan.

---

## 8. Distribución e Instalación

### Flujo de instalación

1. El profesional recibe un **link por WhatsApp**.
2. Abre el link en Safari (iOS) o Chrome (Android).
3. La app carga y muestra un **banner de instalación**: "Instalá Turnero en tu celular para usarlo sin internet".
4. Toca "Agregar a pantalla de inicio" (instrucciones guiadas según plataforma).
5. La app aparece como ícono en el home screen.
6. A partir de ahí funciona **100% offline**.

### Primer uso (onboarding)

1. Pantalla de bienvenida: "Configurá tu consultorio en 1 minuto".
2. Nombre del profesional.
3. Duración default de turno (default: 30 min).
4. Horarios de atención (template precargado: L-V 8:00-12:00 y 14:00-18:00, editable).
5. Listo — lleva al Dashboard.

**Skipeable**: botón "Configurar después" disponible en todo momento. Se aplican defaults razonables (30 min, L-V 8:00-18:00) y se puede ajustar desde Configuración.

---

## 9. Priorización MoSCoW

### Must Have (MVP)
- Dashboard con turnos del día
- Crear, ver y gestionar turnos (completar, cancelar, no asistió)
- Duración variable por turno (con default configurable)
- Gestión de pacientes (CRUD + búsqueda, DNI y teléfono obligatorios)
- Calendario mensual con vista de día
- Configuración de horarios y duración default de turno
- Validación de disponibilidad (sin superposiciones)
- Funcionalidad offline completa
- Export/Import de datos (backup)
- Instalable como PWA
- Tema claro/oscuro según preferencia del sistema

### Should Have
- Reprogramar turnos (con trazabilidad al turno original)
- Turnos recurrentes (repetir semanalmente por X semanas)
- Notificaciones locales (recordatorio de turno)
- Precios por obra social
- Onboarding guiado (skipeable, con defaults razonables)
- Recordatorio de backup
- Notas en turnos

### Could Have
- Resumen nocturno de turnos del día siguiente (breve: cantidad + hora del primero)
- Notas clínicas en ficha de paciente
- Estadísticas básicas (turnos por mes, ausentismo, ingresos)
- Búsqueda global (buscar en toda la app)

### Won't Have (por ahora)
- Multiusuario / compartir agenda
- Sincronización entre dispositivos
- Múltiples consultorios
- Facturación / cobros
- Integración con obras sociales
- Recordatorios al paciente (SMS/WhatsApp)
- Multi-idioma (solo español)
- Archivado/purga de turnos viejos
- Resumen nocturno con lista completa de turnos
- Estadísticas avanzadas (reportes detallados, exportables)

---

## 10. Edge Cases

| Caso | Comportamiento esperado |
|------|------------------------|
| No hay turnos para hoy | Dashboard muestra estado vacío con invitación a crear turno |
| Se intenta crear turno en horario ocupado | Mensaje de error: "Este horario ya está ocupado por [paciente]" |
| Se intenta crear turno fuera del horario de atención | El horario no aparece como opción en el selector |
| Se intenta crear turno en día bloqueado | Mensaje: "Este día está bloqueado. Podés desbloquearlo en Configuración" |
| Se busca paciente que no existe | Se ofrece opción "Crear nuevo paciente" |
| Se intenta importar archivo corrupto/inválido | Error: "El archivo no es un backup válido. Verificá que sea el archivo correcto." Los datos actuales no se modifican. |
| Se intenta importar con datos existentes | Advertencia: "Se reemplazarán los datos actuales. ¿Querés continuar?" |
| Paciente sin DNI | No se permite, DNI es obligatorio. Se muestra error de validación. |
| Dos pacientes con mismo nombre | Se distinguen por DNI o por datos adicionales (obra social, teléfono) |
| El almacenamiento del dispositivo está lleno | Mensaje: "No hay espacio en el dispositivo. Liberá espacio o hacé backup y eliminá turnos antiguos." |
| El usuario no da permiso de notificaciones | La app funciona igual, sin recordatorios. Se muestra opción de activarlas en Configuración. |
| Se cambia la duración del turno con turnos futuros | Los turnos existentes mantienen su duración original. Solo los nuevos usan la nueva duración. |
| Se elimina un horario de atención con turnos existentes en ese rango | Los turnos existentes se mantienen. Se advierte: "Tenés X turnos fuera del nuevo horario." |

---

## 11. Flowcharts (Flujos de Decisión)

| Flujo | Diagrama |
|-------|----------|
| Crear turno | [Ver diagrama](./diagrams/flowcharts/crear-turno.md) |
| Importar backup | [Ver diagrama](./diagrams/flowcharts/importar-backup.md) |
| Onboarding (primer uso) | [Ver diagrama](./diagrams/flowcharts/onboarding.md) |
| Reprogramar turno | [Ver diagrama](./diagrams/flowcharts/reprogramar-turno.md) |

---

## 12. User Flows (Caminos del Usuario)

| Flujo | Diagrama |
|-------|----------|
| Agendar turno desde el calendario | [Ver diagrama](./diagrams/user-flows/agendar-desde-calendario.md) |
| Atender paciente (flujo del día) | [Ver diagrama](./diagrams/user-flows/atender-paciente.md) |
| Paciente nuevo por teléfono | [Ver diagrama](./diagrams/user-flows/paciente-nuevo.md) |
| Hacer backup | [Ver diagrama](./diagrams/user-flows/hacer-backup.md) |
| Consultar historial de paciente | [Ver diagrama](./diagrams/user-flows/consultar-historial.md) |

---

## 13. Decisiones Tomadas

> Puntos que fueron evaluados y resueltos durante la definición del spec.

| # | Pregunta | Decisión | Detalle |
|---|---------|----------|---------|
| 1 | ¿Se puede eliminar un paciente? | **No si tiene turnos** | RN-10: se bloquea la eliminación. No hay razón real para borrar pacientes. |
| 2 | ¿Turnos de duración variable? | **Sí, por turno** | Duración elegible al crear (15/30/45/60 min). Config global define el default. Must Have. |
| 3 | ¿Turnos recurrentes? | **Should Have** | Post-MVP. Repetir semanalmente por X semanas. Es un flujo muy común en kinesiología. |
| 4 | ¿Datos obligatorios del paciente? | **Nombre, apellido, DNI, teléfono** | Email y obra social opcionales. DNI único obligatorio. |
| 5 | ¿Historial de cambios en turnos? | **Trazabilidad básica** | `turnoOrigenId` vincula turno reprogramado al original. Sin log completo (futuro feature). |
| 6 | ¿Múltiples consultorios? | **Uno solo en MVP** | Múltiples consultorios como futuro feature. Won't Have por ahora. |
| 7 | ¿Archivar turnos viejos? | **No** | ~20MB en 10 años. No hay problema real de espacio ni performance. |
| 8 | ¿Info en resumen nocturno? | **Breve** | "Mañana tenés X turnos. El primero es a las HH:MM". Lista completa como futuro feature. |
| 9 | ¿Onboarding skipeable? | **Sí** | Botón "Configurar después" con defaults razonables (30 min, L-V 8-18). |
| 10 | ¿Estadísticas/reportes? | **Could Have** | Estadísticas básicas post-MVP. Avanzadas como futuro feature. |
| 11 | ¿Tema claro/oscuro? | **Sigue al sistema** | Respeta `prefers-color-scheme` del dispositivo. Sin selector manual. |
| 12 | ¿Idioma? | **Solo español** | Sin i18n. Se migra si algún día se necesita. |
