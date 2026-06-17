import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import Constants from "expo-constants";
import { Platform } from "react-native";
import { api } from "@/core/api/client";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function registerForPushNotifications(): Promise<string | null> {
  if (!Device.isDevice) return null;

  const { status: existing } = await Notifications.getPermissionsAsync();
  let finalStatus = existing;
  if (existing !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  if (finalStatus !== "granted") return null;

  const projectId =
    Constants.expoConfig?.extra?.eas?.projectId ??
    Constants.easConfig?.projectId;

  const tokenData = await Notifications.getExpoPushTokenAsync(
    projectId ? { projectId } : undefined,
  );

  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "EZOA-TO Notifications",
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#006A4E",
    });
  }

  return tokenData.data;
}

/**
 * Le backend actuel attend un abonnement Web Push (VAPID).
 * Les tokens Expo Push nécessitent une adaptation serveur.
 * Voir MOBILE.md — section Notifications push.
 */
export async function syncPushWithBackend(expoPushToken: string): Promise<void> {
  try {
    await api.subscribePush({
      endpoint: `expo:${expoPushToken}`,
      keys: { p256dh: "expo-mobile", auth: "expo-mobile" },
    });
  } catch {
    // Backend non adapté aux tokens Expo — ignoré en Phase 1
  }
}
