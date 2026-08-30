import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

let notificationHandlerConfigured = false;

function ensureNotificationHandlerConfigured() {
  if (notificationHandlerConfigured || Platform.OS === 'web') {
    return;
  }

  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldPlaySound: true,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });

  notificationHandlerConfigured = true;
}

export async function sendLocalNotification(title: string, body: string): Promise<boolean> {
  if (Platform.OS === 'web') {
    return false;
  }

  ensureNotificationHandlerConfigured();

  const currentPermissions = await Notifications.getPermissionsAsync();
  let status = currentPermissions.status;

  if (status !== 'granted') {
    const nextPermissions = await Notifications.requestPermissionsAsync();
    status = nextPermissions.status;
  }

  if (status !== 'granted') {
    return false;
  }

  await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      sound: 'default',
    },
    trigger: null,
  });

  return true;
}
