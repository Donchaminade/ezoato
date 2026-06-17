import { useEffect, useState } from "react";
import { Alert, ScrollView, StyleSheet, Text, View } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/core/api/client";
import { Button } from "@/shared/components/Button";
import { Screen } from "@/shared/components/Screen";
import { colors, radius, spacing } from "@/core/theme";
import { useNetworkStatus } from "@/shared/hooks/useNetworkStatus";
import {
  getOfflineEpreuve,
  isOfflineAvailable,
  parseOfflineMetadata,
} from "@/features/epreuves/services/offlineStore";
import {
  downloadEpreuveForOffline,
  openOfflinePdf,
} from "@/features/epreuves/services/downloadService";
import type { Epreuve } from "@/shared/types";

export default function EpreuveDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { isOnline } = useNetworkStatus();
  const [offline, setOffline] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [offlineEpreuve, setOfflineEpreuve] = useState<Epreuve | null>(null);

  const query = useQuery({
    queryKey: ["epreuve", id],
    queryFn: () => api.getEpreuve(id!),
    enabled: !!id && isOnline,
  });

  useEffect(() => {
    if (!id) return;
    isOfflineAvailable(id).then(setOffline);
    getOfflineEpreuve(id).then((item) => {
      if (item) setOfflineEpreuve(parseOfflineMetadata(item));
    });
  }, [id, query.data]);

  const epreuve = isOnline ? query.data : offlineEpreuve;

  async function handleDownload() {
    if (!epreuve) return;
    setDownloading(true);
    try {
      await downloadEpreuveForOffline(epreuve);
      setOffline(true);
      Alert.alert("Succès", "Épreuve disponible hors ligne");
    } catch (e) {
      Alert.alert("Erreur", e instanceof Error ? e.message : "Échec");
    } finally {
      setDownloading(false);
    }
  }

  async function handleOpenOffline() {
    if (!id) return;
    try {
      await openOfflinePdf(id);
    } catch (e) {
      Alert.alert("Erreur", e instanceof Error ? e.message : "Ouverture impossible");
    }
  }

  if (!epreuve && query.isLoading) {
    return <Screen loading />;
  }

  if (!epreuve) {
    return (
      <Screen>
        <View style={styles.empty}>
          <Text style={styles.emptyText}>
            {isOnline ? "Épreuve introuvable" : "Non disponible hors ligne"}
          </Text>
        </View>
      </Screen>
    );
  }

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{epreuve.matiere}</Text>
        </View>
        <Text style={styles.titre}>{epreuve.titre}</Text>
        <Text style={styles.meta}>
          {epreuve.classe} · {epreuve.annee} · {epreuve.ville}
        </Text>
        <Text style={styles.meta}>
          {epreuve.type} · {epreuve.pages} pages · {epreuve.tailleKo} Ko
        </Text>
        {epreuve.requiresPayment ? (
          <View style={styles.payBox}>
            <Text style={styles.payText}>
              Épreuve payante — {epreuve.prixFcfa?.toLocaleString("fr-FR")} FCFA
            </Text>
            <Text style={styles.payHint}>Paiement mobile (Flooz/TMoney) — Phase 2</Text>
          </View>
        ) : null}

        <View style={styles.actions}>
          {isOnline ? (
            <Button
              title={offline ? "Déjà téléchargée" : "Télécharger hors ligne"}
              onPress={handleDownload}
              loading={downloading}
              disabled={offline}
            />
          ) : null}
          {offline ? (
            <Button title="Ouvrir PDF hors ligne" variant="secondary" onPress={handleOpenOffline} />
          ) : null}
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: { padding: spacing.lg },
  badge: {
    alignSelf: "flex-start",
    backgroundColor: colors.primary,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    marginBottom: spacing.sm,
  },
  badgeText: { color: colors.white, fontWeight: "700", fontSize: 12 },
  titre: { fontSize: 22, fontWeight: "800", color: colors.text, marginBottom: spacing.sm },
  meta: { fontSize: 14, color: colors.textMuted, marginBottom: 4 },
  payBox: {
    backgroundColor: colors.accent + "33",
    borderRadius: radius.md,
    padding: spacing.md,
    marginTop: spacing.md,
  },
  payText: { fontWeight: "700", color: colors.text },
  payHint: { fontSize: 12, color: colors.textMuted, marginTop: 4 },
  actions: { marginTop: spacing.lg, gap: spacing.sm },
  empty: { flex: 1, alignItems: "center", justifyContent: "center", padding: spacing.lg },
  emptyText: { fontSize: 16, color: colors.textMuted },
});
