import { StyleSheet, Text, View } from "react-native";
import { useNetworkStatus } from "@/shared/hooks/useNetworkStatus";
import { colors, spacing } from "@/core/theme";

export function OfflineBanner() {
  const { isOnline, isChecking } = useNetworkStatus();
  if (isChecking || isOnline) return null;

  return (
    <View style={styles.banner}>
      <Text style={styles.text}>Mode hors ligne — contenu téléchargé disponible</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    backgroundColor: colors.offline,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  text: {
    color: colors.white,
    fontSize: 13,
    fontWeight: "600",
    textAlign: "center",
  },
});
