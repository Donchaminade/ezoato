import { Alert, FlatList, RefreshControl, StyleSheet, Switch, Text, View } from "react-native";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/core/api/client";
import { colors, radius, spacing } from "@/core/theme";
import { EmptyState } from "@/shared/components/EmptyState";
import { Screen } from "@/shared/components/Screen";
import { Pressable } from "react-native";

export default function NotificationsScreen() {
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: ["notifications"],
    queryFn: () => api.getNotificationConfig(),
  });

  const config = query.data;

  async function togglePref(key: "soumissions" | "retraits" | "paiements" | "moderation" | "marketing" | "pushEnabled") {
    if (!config) return;
    try {
      await api.updateNotificationPreferences({ [key]: !config.preferences[key] });
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    } catch (e) {
      Alert.alert("Erreur", e instanceof Error ? e.message : "Échec");
    }
  }

  async function markRead(id: string) {
    await api.markNotificationsRead([id]);
    query.refetch();
  }

  return (
    <Screen loading={query.isLoading}>
      {config ? (
        <View style={styles.prefs}>
          <PrefRow
            label="Soumissions"
            value={config.preferences.soumissions}
            onToggle={() => togglePref("soumissions")}
          />
          <PrefRow
            label="Paiements"
            value={config.preferences.paiements}
            onToggle={() => togglePref("paiements")}
          />
          <PrefRow
            label="Retraits"
            value={config.preferences.retraits}
            onToggle={() => togglePref("retraits")}
          />
          <PrefRow
            label="Marketing"
            value={config.preferences.marketing}
            onToggle={() => togglePref("marketing")}
          />
        </View>
      ) : null}

      <Text style={styles.section}>
        Boîte de réception {config?.unreadCount ? `(${config.unreadCount})` : ""}
      </Text>

      <FlatList
        data={config?.inbox ?? []}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl
            refreshing={query.isRefetching}
            onRefresh={() => query.refetch()}
            colors={[colors.primary]}
          />
        }
        renderItem={({ item }) => (
          <Pressable
            style={[styles.notif, !item.lu && styles.notifUnread]}
            onPress={() => markRead(item.id)}
          >
            <Text style={styles.notifTitle} numberOfLines={1}>
              {item.titre}
            </Text>
            <Text style={styles.notifBody} numberOfLines={3}>
              {item.corps}
            </Text>
            <Text style={styles.notifDate}>
              {new Date(item.createdAt).toLocaleDateString("fr-FR")}
            </Text>
          </Pressable>
        )}
        ListEmptyComponent={<EmptyState title="Aucune notification" />}
      />
    </Screen>
  );
}

function PrefRow({
  label,
  value,
  onToggle,
}: {
  label: string;
  value: boolean;
  onToggle: () => void;
}) {
  return (
    <View style={styles.prefRow}>
      <Text style={styles.prefLabel}>{label}</Text>
      <Switch value={value} onValueChange={onToggle} trackColor={{ true: colors.primary }} />
    </View>
  );
}

const styles = StyleSheet.create({
  prefs: {
    backgroundColor: colors.surface,
    margin: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.sm,
  },
  prefRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
  },
  prefLabel: { fontSize: 15, color: colors.text, fontWeight: "600" },
  section: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.text,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.sm,
  },
  notif: {
    backgroundColor: colors.surface,
    marginHorizontal: spacing.md,
    marginBottom: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  notifUnread: { borderLeftWidth: 4, borderLeftColor: colors.accent },
  notifTitle: { fontSize: 15, fontWeight: "700", color: colors.text },
  notifBody: { fontSize: 14, color: colors.textMuted, marginTop: 4 },
  notifDate: { fontSize: 12, color: colors.textMuted, marginTop: spacing.xs },
});
