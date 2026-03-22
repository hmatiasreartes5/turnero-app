const NOTIFICATION_SUPPORTED =
  'Notification' in window && 'serviceWorker' in navigator

export function isNotificationSupported(): boolean {
  return NOTIFICATION_SUPPORTED
}

export async function requestPermission(): Promise<boolean> {
  if (!NOTIFICATION_SUPPORTED) return false
  const result = await Notification.requestPermission()
  return result === 'granted'
}

export function hasPermission(): boolean {
  if (!NOTIFICATION_SUPPORTED) return false
  return Notification.permission === 'granted'
}

// Map turnoId -> timeoutId for cancellation
const scheduledNotifications = new Map<string, ReturnType<typeof setTimeout>>()

export function scheduleNotification(
  turnoId: string,
  pacienteNombre: string,
  fecha: string,
  horaInicio: string,
  minutesBefore: number = 30,
): void {
  if (!hasPermission()) return

  // Parse target time
  const [h, m] = horaInicio.split(':').map(Number)
  const target = new Date(fecha + 'T00:00:00')
  target.setHours(h, m - minutesBefore, 0, 0)

  const delay = target.getTime() - Date.now()
  if (delay <= 0) return // Already passed

  // Cancel existing notification for this turno
  cancelNotification(turnoId)

  const timeoutId = setTimeout(() => {
    new Notification('Turnero - Recordatorio', {
      body: `Turno con ${pacienteNombre} a las ${horaInicio}`,
      icon: '/icons/icon-192.svg',
      tag: `turno-${turnoId}`,
    })
    scheduledNotifications.delete(turnoId)
  }, delay)

  scheduledNotifications.set(turnoId, timeoutId)
}

export function cancelNotification(turnoId: string): void {
  const timeoutId = scheduledNotifications.get(turnoId)
  if (timeoutId) {
    clearTimeout(timeoutId)
    scheduledNotifications.delete(turnoId)
  }
}
