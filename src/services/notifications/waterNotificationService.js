import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

// Configurar cómo se presentan las notificaciones cuando la app está en primer plano
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

const NOTIFICATION_CHANNEL_ID = 'water-reminders';
const WATER_NOTIFICATION_CATEGORY = 'ZENIT_WATER_REMINDER';

// Mensajes rotativos inspiradores para los recordatorios de hidratación
const WATER_REMINDER_MESSAGES = [
  {
    title: '💧 Momento de hidratarte',
    body: 'Tomá un buen vaso de agua (250ml) para mantener tu energía y foco al 100%.',
  },
  {
    title: '🥤 Tu cuerpo te pide agua',
    body: 'Un vaso de agua ahora mejora tu digestión, metabolismo y rendimiento físico.',
  },
  {
    title: '💧 ¡Cuidá tu hidratación!',
    body: 'Sumá 250ml a tu registro diario en Zenit y alcanzá tu meta de hoy.',
  },
  {
    title: '🧉 Pausa de agua fresca',
    body: 'Mantenerte hidratado previene la fatiga muscular y los dolores de cabeza.',
  },
];

/**
 * Solicitar permisos de notificaciones locales al usuario
 */
export async function requestNotificationPermission() {
  try {
    const settings = await Notifications.getPermissionsAsync();
    let granted = settings.granted || settings.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL;

    if (!granted) {
      const request = await Notifications.requestPermissionsAsync({
        ios: {
          allowAlert: true,
          allowBadge: true,
          allowSound: true,
        },
      });
      granted = request.granted || request.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL;
    }

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync(NOTIFICATION_CHANNEL_ID, {
        name: 'Recordatorios de Agua',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#0284C7',
        sound: 'default',
      });
    }

    return granted;
  } catch (error) {
    console.error('Error al solicitar permisos de notificación:', error);
    return false;
  }
}

/**
 * Cancelar todos los recordatorios de agua programados previamente
 */
export async function cancelWaterReminders() {
  try {
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    const waterNotifications = scheduled.filter(
      (n) => n.content?.data?.type === WATER_NOTIFICATION_CATEGORY
    );

    for (const notif of waterNotifications) {
      await Notifications.cancelScheduledNotificationAsync(notif.identifier);
    }
  } catch (error) {
    console.error('Error al cancelar recordatorios de agua:', error);
  }
}

/**
 * Programar recordatorio de agua recurrente según el intervalo configurado
 * @param {number} intervalMinutes - Minutos entre recordatorios (ej: 60, 90, 120)
 * @param {boolean} enabled - Si los recordatorios están activados
 */
export async function syncWaterReminders(intervalMinutes = 90, enabled = true) {
  try {
    // 1. Cancelar recordatorios previos para no duplicar
    await cancelWaterReminders();

    if (!enabled) {
      return { success: true, enabled: false };
    }

    // 2. Verificar permisos
    const hasPermission = await requestNotificationPermission();
    if (!hasPermission) {
      return { success: false, error: 'permission_denied' };
    }

    // 3. Programar notificación recurrente en segundos
    const seconds = Math.max(60, intervalMinutes * 60);
    const randomMessage = WATER_REMINDER_MESSAGES[Math.floor(Math.random() * WATER_REMINDER_MESSAGES.length)];

    await Notifications.scheduleNotificationAsync({
      content: {
        title: randomMessage.title,
        body: randomMessage.body,
        sound: true,
        data: { type: WATER_NOTIFICATION_CATEGORY },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds,
        repeats: true,
      },
    });

    return { success: true, enabled: true, intervalMinutes };
  } catch (error) {
    console.error('Error al programar recordatorio de agua:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Enviar una notificación de prueba instantánea (para verificar sonido y diseño)
 */
export async function sendInstantTestNotification() {
  try {
    const hasPermission = await requestNotificationPermission();
    if (!hasPermission) {
      return { success: false, error: 'permission_denied' };
    }

    await Notifications.scheduleNotificationAsync({
      content: {
        title: '💧 ¡Prueba de Recordatorio Zenit!',
        body: 'Las notificaciones de hidratación están funcionando perfectamente.',
        sound: true,
        data: { type: WATER_NOTIFICATION_CATEGORY, isTest: true },
      },
      trigger: null, // trigger null = disparo inmediato
    });

    return { success: true };
  } catch (error) {
    console.error('Error al enviar notificación de prueba:', error);
    return { success: false, error: error.message };
  }
}

