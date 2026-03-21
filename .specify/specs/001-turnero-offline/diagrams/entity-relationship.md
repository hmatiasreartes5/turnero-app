# Diagrama Entidad-Relación

```mermaid
erDiagram
    PACIENTE {
        string id PK "nanoid"
        string nombre "requerido"
        string apellido "requerido"
        string dni UK "requerido, único"
        string telefono "requerido"
        string email "opcional"
        string obraSocial "opcional"
        string notas "opcional"
        string createdAt "ISO 8601"
        string updatedAt "ISO 8601"
    }

    TURNO {
        string id PK "nanoid"
        string pacienteId FK "→ Paciente.id"
        string fecha "YYYY-MM-DD"
        string horaInicio "HH:mm"
        string horaFin "HH:mm"
        number duracionMinutos "15/30/45/60"
        string estado "confirmado|completado|cancelado|no_asistio"
        string notas "opcional"
        string turnoOrigenId FK "→ Turno.id, opcional"
        string createdAt "ISO 8601"
        string updatedAt "ISO 8601"
    }

    CONFIGURACION {
        number id PK "siempre 1 (singleton)"
        string nombreProfesional ""
        number duracionTurnoMinutos "default: 30"
        json horarios "por día de semana"
        json diasBloqueados "array de fechas"
        json precios "obra social → precio"
        string ultimoBackup "ISO 8601, opcional"
        boolean onboardingCompletado ""
    }

    PACIENTE ||--o{ TURNO : "tiene"
    TURNO ||--o| TURNO : "reprogramado desde"
```

**Relaciones:**
- **Paciente → Turno**: 1 a muchos. Un paciente puede tener múltiples turnos.
- **Turno → Turno** (self-reference): opcional. Un turno reprogramado referencia al turno original via `turnoOrigenId`.
- **Configuración**: singleton (siempre id=1), sin relaciones.
