import { useCallback, useState } from "react";
import { Alert, FlatList, RefreshControl, StyleSheet, Text, View } from "react-native";
import { useFocusEffect } from "expo-router";
import { colors, radius, spacing } from "@/core/theme";
import { Button } from "@/shared/components/Button";
import { EmptyState } from "@/shared/components/EmptyState";
import { Screen } from "@/shared/components/Screen";
import { listOfflineEpreuves, parseOfflineMetadata } from "@/features/epreuves/services/offlineStore";
import type { OfflineEpreuve } from "@/shared/types";
import {
  openOfflinePdf,
  removeOfflineDownload,
} from "@/features/epreuves/services/downloadService";
import { Pressable } from "react-native";

export default function OfflineLibraryScreen() {
  const [items, setItems] = useState<OfflineEpreuve[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    setRefreshing(true);
    try {
      setItems(await listOfflineEpreuves());
    } finally {
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  async function handleOpen(id: string) {
    try {
      await openOfflinePdf(id);
    } catch (e) {
      Alert.alert("Erreur", e instanceof Error ? e.message : "Ouverture impossible");
    }
  }

  async function handleDelete(id: string, titre: string) {
    Alert.alert("Supprimer", `Retirer « ${titre} » du stockage local ?`, [
      { text: "Annuler", style: "cancel" },
      {
        text: "Supprimer",
        style: "destructive",
        onPress: async () => {
          await removeOfflineDownload(id);
          load();
        },
      },
    ]);
  }

  return (
    <Screen title="Ma bibliothèque hors ligne" showOfflineBanner={false}>
      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={load} colors={[colors.primary]} />
        }
        renderItem={({ item }) => {
          const meta = parseOfflineMetadata(item);
          return (
            <View style={styles.card}>
              <Text style={styles.matiere} numberOfLines={1}>
                {item.matiere}
              </Text>
              <Text style={styles.titre} numberOfLines={2}>
                {item.titre}
              </Text>
              {meta ? (
                <Text style={styles.meta} numberOfLines={1}>
                  {meta.classe} · {meta.annee}
                </Text>
              ) : null}
              <Text style={styles.date}>
                Téléchargé le {new Date(item.downloadedAt).toLocaleDateString("fr-FR")}
              </Text>
              <View style={styles.actions}>
                <Button title="Ouvrir PDF" onPress={() => handleOpen(item.id)} style={styles.btn} />
                <Pressable onPress={() => handleDelete(item.id, item.titre)}>
                  <Text style={styles.delete}>Supprimer</Text>
                </Pressable>
              </View>
            </View>
          );
        }}
        ListEmptyComponent={
          <EmptyState
            title="Aucun téléchargement local"
            message="Téléchargez des épreuves depuis Archives pour les consulter hors ligne"
          />
        }
        contentContainerStyle={items.length === 0 ? styles.empty : undefined}
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
  matiere: { fontSize: 13, fontWeight: "700", color: colors.primary },
  titre: { fontSize: 16, fontWeight: "600", color: colors.text, marginTop: 4 },
  meta: { fontSize: 13, color: colors.textMuted, marginTop: 4 },
  date: { fontSize: 12, color: colors.textMuted, marginTop: spacing.xs },
  actions: { marginTop: spacing.md, gap: spacing.sm },
  btn: { flex: 0 },
  delete: { color: colors.error, fontWeight: "600", textAlign: "center", marginTop: spacing.sm },
  empty: { flexGrow: 1 },
});
