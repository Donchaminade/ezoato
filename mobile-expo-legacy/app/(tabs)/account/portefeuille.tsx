import { FlatList, RefreshControl, StyleSheet, Text, View } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/core/api/client";
import { colors, radius, spacing } from "@/core/theme";
import { EmptyState } from "@/shared/components/EmptyState";
import { Screen } from "@/shared/components/Screen";

export default function PortefeuilleScreen() {
  const query = useQuery({
    queryKey: ["wallet"],
    queryFn: () => api.getWallet(),
  });

  const wallet = query.data;

  return (
    <Screen loading={query.isLoading}>
      {wallet ? (
        <View style={styles.summary}>
          <Text style={styles.soldeLabel}>Solde disponible</Text>
          <Text style={styles.solde}>{wallet.solde.toLocaleString("fr-FR")} FCFA</Text>
          <Text style={styles.meta}>
            {wallet.epreuvesValidees} épreuves validées · Palier {wallet.progressionPalier}/
            {wallet.prochainPalier}
          </Text>
        </View>
      ) : null}

      <Text style={styles.section}>Transactions récentes</Text>
      <FlatList
        data={wallet?.transactions ?? []}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl
            refreshing={query.isRefetching}
            onRefresh={() => query.refetch()}
            colors={[colors.primary]}
          />
        }
        renderItem={({ item }) => (
          <View style={styles.tx}>
            <View style={styles.txLeft}>
              <Text style={styles.txDesc} numberOfLines={2}>
                {item.description}
              </Text>
              <Text style={styles.txDate}>
                {new Date(item.creeLe).toLocaleDateString("fr-FR")}
              </Text>
            </View>
            <Text
              style={[
                styles.txAmount,
                item.type === "credit" ? styles.credit : styles.debit,
              ]}
            >
              {item.type === "credit" ? "+" : "-"}
              {item.montant.toLocaleString("fr-FR")}
            </Text>
          </View>
        )}
        ListEmptyComponent={<EmptyState title="Aucune transaction" />}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  summary: {
    backgroundColor: colors.primary,
    margin: spacing.md,
    padding: spacing.lg,
    borderRadius: radius.lg,
  },
  soldeLabel: { color: colors.accent, fontSize: 13, fontWeight: "600" },
  solde: { color: colors.white, fontSize: 32, fontWeight: "800", marginTop: 4 },
  meta: { color: "rgba(255,255,255,0.8)", fontSize: 13, marginTop: spacing.sm },
  section: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.text,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.sm,
  },
  tx: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: colors.surface,
    marginHorizontal: spacing.md,
    marginBottom: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  txLeft: { flex: 1, marginRight: spacing.sm },
  txDesc: { fontSize: 14, fontWeight: "600", color: colors.text },
  txDate: { fontSize: 12, color: colors.textMuted, marginTop: 4 },
  txAmount: { fontSize: 16, fontWeight: "800" },
  credit: { color: colors.success },
  debit: { color: colors.error },
});
