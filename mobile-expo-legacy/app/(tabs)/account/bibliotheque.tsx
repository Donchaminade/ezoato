import { FlatList, RefreshControl, StyleSheet, Text, View } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { router } from "expo-router";
import { api } from "@/core/api/client";
import { colors, radius, spacing } from "@/core/theme";
import { EmptyState } from "@/shared/components/EmptyState";
import { Screen } from "@/shared/components/Screen";
import type { LibraryItem } from "@/shared/types";
import { Pressable } from "react-native";

export default function BibliothequeScreen() {
  const query = useQuery({
    queryKey: ["library"],
    queryFn: () => api.getMyLibrary(),
  });

  const allItems: (LibraryItem & { section: string })[] = [
    ...(query.data?.paid ?? []).map((i) => ({ ...i, section: "Achats" })),
    ...(query.data?.free ?? []).map((i) => ({ ...i, section: "Gratuits" })),
  ];

  return (
    <Screen loading={query.isLoading}>
      <FlatList
        data={allItems}
        keyExtractor={(item) => `${item.section}-${item.id}`}
        refreshControl={
          <RefreshControl
            refreshing={query.isRefetching}
            onRefresh={() => query.refetch()}
            colors={[colors.primary]}
          />
        }
        renderItem={({ item }) => (
          <Pressable style={styles.card} onPress={() => router.push(`/epreuve/${item.id}`)}>
            <Text style={styles.section}>{item.section}</Text>
            <Text style={styles.titre} numberOfLines={2}>
              {item.titre}
            </Text>
            <Text style={styles.meta} numberOfLines={1}>
              {item.matiere} · {item.classe} · {item.annee}
            </Text>
          </Pressable>
        )}
        ListEmptyComponent={
          <EmptyState title="Bibliothèque vide" message="Téléchargez ou achetez des épreuves" />
        }
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    marginHorizontal: spacing.md,
    marginBottom: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  section: { fontSize: 11, fontWeight: "700", color: colors.primary, marginBottom: 4 },
  titre: { fontSize: 16, fontWeight: "600", color: colors.text },
  meta: { fontSize: 13, color: colors.textMuted, marginTop: 4 },
});
