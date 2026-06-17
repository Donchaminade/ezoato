import { FlatList, RefreshControl } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { router } from "expo-router";
import { api } from "@/core/api/client";
import { colors } from "@/core/theme";
import { EpreuveCard } from "@/shared/components/EpreuveCard";
import { EmptyState } from "@/shared/components/EmptyState";
import { Screen } from "@/shared/components/Screen";

export default function FavorisScreen() {
  const query = useQuery({
    queryKey: ["favoris"],
    queryFn: () => api.getFavorisEpreuves(),
  });

  return (
    <Screen loading={query.isLoading}>
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
            isFavorite
            onPress={() => router.push(`/epreuve/${item.id}`)}
          />
        )}
        ListEmptyComponent={
          <EmptyState title="Aucun favori" message="Ajoutez des épreuves depuis Archives" />
        }
      />
    </Screen>
  );
}
