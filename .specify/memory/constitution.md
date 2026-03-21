# Constitución del Proyecto — Turnero

Reglas no negociables que aplican a todo el proyecto. Ningún spec, task o implementación puede violar estos principios.

## Principios

1. **Offline-first**: la app nunca asume conectividad. Todo opera contra almacenamiento local.
2. **Cero costo de distribución**: no se requiere cuenta de desarrollador de Apple/Google.
3. **Privacidad**: los datos nunca salen del dispositivo salvo backup manual explícito del usuario.
4. **Simplicidad**: esta app es para un kinesiólogo independiente, no para un hospital. No sobrediseñar.
5. **Spec como fuente de verdad**: antes de implementar, el spec debe estar aprobado. Si hay duda, se consulta el spec. Si el spec está desactualizado, se actualiza primero.
6. **No saltear fases SDD**: Research → Spec → Plan → Tasks → Implement. Cada fase tiene gates.
7. **Tests acompañan al código**: no se considera completa una tarea sin sus tests correspondientes.
