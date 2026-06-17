import { Stack } from "expo-router";
import { colors } from "@/core/theme";

export default function AccountLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.primary },
        headerTintColor: colors.white,
        headerTitleStyle: { fontWeight: "700" },
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      <Stack.Screen name="index" options={{ title: "Mon compte" }} />
      <Stack.Screen name="profile" options={{ title: "Profil" }} />
      <Stack.Screen name="favoris" options={{ title: "Favoris" }} />
      <Stack.Screen name="bibliotheque" options={{ title: "Bibliothèque" }} />
      <Stack.Screen name="offline" options={{ title: "Hors ligne" }} />
      <Stack.Screen name="portefeuille" options={{ title: "Portefeuille" }} />
      <Stack.Screen name="notifications" options={{ title: "Notifications" }} />
    </Stack>
  );
}
