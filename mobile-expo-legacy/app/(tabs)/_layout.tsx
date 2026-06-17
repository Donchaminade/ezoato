import { Tabs } from "expo-router";
import { colors } from "@/core/theme";

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: { borderTopColor: colors.border },
        headerStyle: { backgroundColor: colors.primary },
        headerTintColor: colors.white,
        headerTitleStyle: { fontWeight: "700" },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{ title: "Accueil", tabBarLabel: "Accueil" }}
      />
      <Tabs.Screen
        name="archives"
        options={{ title: "Archives", tabBarLabel: "Archives" }}
      />
      <Tabs.Screen
        name="submit"
        options={{ title: "Soumettre", tabBarLabel: "Soumettre" }}
      />
      <Tabs.Screen
        name="account"
        options={{ title: "Compte", tabBarLabel: "Compte", headerShown: false }}
      />
    </Tabs>
  );
}
