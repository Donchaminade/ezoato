import { ScrollView, StyleSheet, Text, View } from "react-native";
import { Screen } from "@/shared/components/Screen";
import { colors, radius, spacing } from "@/core/theme";

/**
 * Placeholder — soumission multipart (photos/PDF) à implémenter en Phase 2.
 * Endpoint: POST /soumissions (FormData) — voir web api.submitEpreuve
 */
export default function SubmitScreen() {
  return (
    <Screen title="Soumettre une épreuve">
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.card}>
          <Text style={styles.title}>Bientôt disponible</Text>
          <Text style={styles.body}>
            La soumission d'épreuves (photos ou PDF) est disponible sur le site web.
            Utilisez votre navigateur en attendant la version mobile.
          </Text>
          <Text style={styles.todo}>TODO Phase 2 : expo-image-picker + FormData multipart</Text>
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: { padding: spacing.lg },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  title: { fontSize: 20, fontWeight: "700", color: colors.text, marginBottom: spacing.sm },
  body: { fontSize: 15, color: colors.textMuted, lineHeight: 22 },
  todo: {
    marginTop: spacing.md,
    fontSize: 12,
    color: colors.primary,
    fontWeight: "600",
  },
});
