import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import { useAuth } from "@/features/auth/AuthContext";
import { Screen } from "@/shared/components/Screen";
import { Button } from "@/shared/components/Button";
import { colors, radius, spacing } from "@/core/theme";

const MENU = [
  { label: "Profil", desc: "Informations & sécurité", href: "/(tabs)/account/profile" as const },
  { label: "Favoris", desc: "Épreuves enregistrées", href: "/(tabs)/account/favoris" as const },
  { label: "Bibliothèque", desc: "Achats et téléchargements", href: "/(tabs)/account/bibliotheque" as const },
  { label: "Hors ligne", desc: "PDF téléchargés localement", href: "/(tabs)/account/offline" as const },
  { label: "Portefeuille", desc: "Gains contributeur", href: "/(tabs)/account/portefeuille" as const },
  { label: "Notifications", desc: "Alertes et messages", href: "/(tabs)/account/notifications" as const },
];

export default function AccountScreen() {
  const { user, logout } = useAuth();

  return (
    <Screen showOfflineBanner>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.header}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{user?.nom?.charAt(0)?.toUpperCase() ?? "?"}</Text>
          </View>
          <Text style={styles.name}>{user?.nom ?? "Utilisateur"}</Text>
          <Text style={styles.email}>{user?.email}</Text>
        </View>

        {MENU.map((item) => (
          <Pressable
            key={item.href}
            style={styles.menuItem}
            onPress={() => router.push(item.href)}
          >
            <View>
              <Text style={styles.menuLabel}>{item.label}</Text>
              <Text style={styles.menuDesc}>{item.desc}</Text>
            </View>
            <Text style={styles.chevron}>›</Text>
          </Pressable>
        ))}

        <Button
          title="Se déconnecter"
          variant="outline"
          onPress={async () => {
            await logout();
            router.replace("/(auth)/login");
          }}
          style={styles.logout}
        />
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: { padding: spacing.md, paddingBottom: spacing.xl },
  header: { alignItems: "center", marginBottom: spacing.lg },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.sm,
  },
  avatarText: { fontSize: 28, fontWeight: "800", color: colors.white },
  name: { fontSize: 20, fontWeight: "700", color: colors.text },
  email: { fontSize: 14, color: colors.textMuted, marginTop: 2 },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  menuLabel: { fontSize: 16, fontWeight: "700", color: colors.text },
  menuDesc: { fontSize: 13, color: colors.textMuted, marginTop: 2 },
  chevron: { fontSize: 24, color: colors.textMuted },
  logout: { marginTop: spacing.lg },
});
