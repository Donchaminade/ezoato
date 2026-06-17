import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors, radius, spacing } from "@/core/theme";
import type { Epreuve } from "@/shared/types";

interface EpreuveCardProps {
  epreuve: Epreuve;
  onPress: () => void;
  onDownload?: () => void;
  isOffline?: boolean;
  isFavorite?: boolean;
  downloading?: boolean;
}

export function EpreuveCard({
  epreuve,
  onPress,
  onDownload,
  isOffline,
  isFavorite,
  downloading,
}: EpreuveCardProps) {
  return (
    <Pressable style={styles.card} onPress={onPress}>
      <View style={styles.header}>
        <Text style={styles.matiere} numberOfLines={1}>
          {epreuve.matiere}
        </Text>
        <View style={styles.badges}>
          {isOffline ? (
            <View style={[styles.badge, styles.badgeOffline]}>
              <Text style={styles.badgeText}>Hors ligne</Text>
            </View>
          ) : null}
          {isFavorite ? (
            <View style={[styles.badge, styles.badgeFav]}>
              <Text style={styles.badgeText}>★</Text>
            </View>
          ) : null}
        </View>
      </View>
      <Text style={styles.titre} numberOfLines={2}>
        {epreuve.titre}
      </Text>
      <Text style={styles.meta} numberOfLines={1}>
        {epreuve.classe} · {epreuve.annee} · {epreuve.ville}
      </Text>
      <View style={styles.footer}>
        <Text style={styles.pages}>{epreuve.pages} p. · {epreuve.tailleKo} Ko</Text>
        {onDownload ? (
          <Pressable
            style={styles.downloadBtn}
            onPress={(e) => {
              e.stopPropagation?.();
              onDownload();
            }}
            disabled={downloading || isOffline}
          >
            <Text style={styles.downloadText}>
              {downloading ? "…" : isOffline ? "Téléchargé" : "Télécharger"}
            </Text>
          </Pressable>
        ) : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginHorizontal: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.xs,
  },
  matiere: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.primary,
    flex: 1,
    marginRight: spacing.sm,
  },
  badges: { flexDirection: "row", gap: spacing.xs },
  badge: {
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  badgeOffline: { backgroundColor: colors.offline },
  badgeFav: { backgroundColor: colors.accent },
  badgeText: { color: colors.white, fontSize: 11, fontWeight: "700" },
  titre: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.text,
    marginBottom: spacing.xs,
  },
  meta: { fontSize: 13, color: colors.textMuted, marginBottom: spacing.sm },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  pages: { fontSize: 12, color: colors.textMuted },
  downloadBtn: {
    backgroundColor: colors.primary,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  downloadText: { color: colors.white, fontSize: 12, fontWeight: "700" },
});
