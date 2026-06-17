import { useQuery } from "@tanstack/react-query";
import { FlatList, RefreshControl, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import { api } from "@/core/api/client";
import { colors, spacing } from "@/core/theme";
import { EpreuveCard } from "@/shared/components/EpreuveCard";
import { EmptyState } from "@/shared/components/EmptyState";
import { Screen } from "@/shared/components/Screen";
import { useNetworkStatus } from "@/shared/hooks/useNetworkStatus";
import { listOfflineEpreuves, parseOfflineMetadata } from "@/features/epreuves/services/offlineStore";
import { useEffect, useState } from "react";
import type { Epreuve } from "@/shared/types";

export default function HomeScreen() {
  const { isOnline } = useNetworkStatus();
  const [offlineItems, setOfflineItems] = useState<Epreuve[]>([]);

  const metaQuery = useQuery({
    queryKey: ["meta"],
    queryFn: () => api.getMeta(),
    enabled: isOnline,
  });

  const epreuvesQuery = useQuery({
    queryKey: ["epreuves", "recent"],
    queryFn: () => api.listEpreuves({ page: 1, perPage: 10 }),
    enabled: isOnline,
  });

  useEffect(() => {
    listOfflineEpreuves().then((items) => {
      setOfflineItems(
        items.map(parseOfflineMetadata).filter((e): e is Epreuve => e != null),
      );
    });
  }, [epreuvesQuery.dataUpdatedAt]);

  const items = isOnline ? (epreuvesQuery.data?.items ?? []) : offlineItems;

  return (
    <Screen title="Accueil">
      {isOnline && metaQuery.data ? (
        <View style={styles.stats}>
          <Stat label="Épreuves" value={metaQuery.data.stats.epreuvesValidees} />
          <Stat label="Téléchargements" value={metaQuery.data.stats.telechargements} />
          <Stat label="Contributeurs" value={metaQuery.data.stats.contributeurs} />
        </View>
      ) : null}

      <Text style={styles.section}>
        {isOnline ? "Dernières épreuves" : "Ma bibliothèque hors ligne"}
      </Text>

      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        refreshControl={
          isOnline ? (
            <RefreshControl
              refreshing={epreuvesQuery.isRefetching}
              onRefresh={() => epreuvesQuery.refetch()}
              colors={[colors.primary]}
            />
          ) : undefined
        }
        renderItem={({ item }) => (
          <EpreuveCard
            epreuve={item}
            isOffline={!isOnline}
            onPress={() => router.push(`/epreuve/${item.id}`)}
          />
        )}
        ListEmptyComponent={
          <EmptyState
            title={isOnline ? "Aucune épreuve" : "Rien en hors ligne"}
            message={
              isOnline
                ? "Les épreuves apparaîtront ici"
                : "Téléchargez des épreuves depuis Archives"
            }
          />
        }
        contentContainerStyle={items.length === 0 ? styles.emptyList : undefined}
      />
    </Screen>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statValue}>{value.toLocaleString("fr-FR")}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  stats: {
    flexDirection: "row",
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  stat: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: spacing.sm,
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.border,
  },
  statValue: { fontSize: 18, fontWeight: "800", color: colors.primary },
  statLabel: { fontSize: 11, color: colors.textMuted, marginTop: 2 },
  section: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.text,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.sm,
  },
  emptyList: { flexGrow: 1 },
});
