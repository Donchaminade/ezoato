import { useCallback, useEffect, useState } from "react";
import { Alert, FlatList, RefreshControl, StyleSheet, TextInput, View } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { router } from "expo-router";
import { api } from "@/core/api/client";
import { colors, radius, spacing } from "@/core/theme";
import { EpreuveCard } from "@/shared/components/EpreuveCard";
import { EmptyState } from "@/shared/components/EmptyState";
import { Screen } from "@/shared/components/Screen";
import { useNetworkStatus } from "@/shared/hooks/useNetworkStatus";
import { downloadEpreuveForOffline } from "@/features/epreuves/services/downloadService";
import { isOfflineAvailable } from "@/features/epreuves/services/offlineStore";
import type { Epreuve } from "@/shared/types";

export default function ArchivesScreen() {
  const { isOnline } = useNetworkStatus();
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [offlineIds, setOfflineIds] = useState<Set<string>>(new Set());
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 400);
    return () => clearTimeout(t);
  }, [search]);

  const query = useQuery({
    queryKey: ["epreuves", "archives", debouncedSearch],
    queryFn: () => api.listEpreuves({ q: debouncedSearch || undefined, page: 1, perPage: 30 }),
    enabled: isOnline,
  });

  const refreshOfflineStatus = useCallback(async (items: Epreuve[]) => {
    const ids = new Set<string>();
    await Promise.all(
      items.map(async (e) => {
        if (await isOfflineAvailable(e.id)) ids.add(e.id);
      }),
    );
    setOfflineIds(ids);
  }, []);

  useEffect(() => {
    if (query.data?.items) refreshOfflineStatus(query.data.items);
  }, [query.data?.items, refreshOfflineStatus]);

  async function handleDownload(epreuve: Epreuve) {
    if (!isOnline) {
      Alert.alert("Hors ligne", "Connectez-vous pour télécharger");
      return;
    }
    setDownloadingId(epreuve.id);
    try {
      await downloadEpreuveForOffline(epreuve);
      setOfflineIds((prev) => new Set(prev).add(epreuve.id));
      Alert.alert("Téléchargé", "Épreuve disponible hors ligne");
    } catch (e) {
      Alert.alert("Erreur", e instanceof Error ? e.message : "Téléchargement échoué");
    } finally {
      setDownloadingId(null);
    }
  }

  return (
    <Screen title="Archives">
      <View style={styles.searchWrap}>
        <TextInput
          style={styles.search}
          placeholder="Rechercher une épreuve…"
          placeholderTextColor={colors.textMuted}
          value={search}
          onChangeText={setSearch}
          editable={isOnline}
        />
      </View>

      {!isOnline ? (
        <EmptyState
          title="Archives indisponibles hors ligne"
          message="Consultez Accueil ou Ma bibliothèque hors ligne"
        />
      ) : (
        <FlatList
          data={query.data?.items ?? []}
          keyExtractor={(item) => item.id}
          refreshControl={
            <RefreshControl
              refreshing={query.isRefetching}
              onRefresh={() => query.refetch()}
              colors={[colors.primary]}
            />
          }
          renderItem={({ item }) => (
            <EpreuveCard
              epreuve={item}
              isOffline={offlineIds.has(item.id)}
              downloading={downloadingId === item.id}
              onPress={() => router.push(`/epreuve/${item.id}`)}
              onDownload={() => handleDownload(item)}
            />
          )}
          ListEmptyComponent={
            query.isLoading ? null : (
              <EmptyState title="Aucun résultat" message="Modifiez votre recherche" />
            )
          }
          contentContainerStyle={(query.data?.items?.length ?? 0) === 0 ? styles.emptyList : undefined}
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  searchWrap: { paddingHorizontal: spacing.md, marginBottom: spacing.sm },
  search: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    fontSize: 15,
    color: colors.text,
  },
  emptyList: { flexGrow: 1 },
});
