import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import type { UserFavoris } from "@/lib/types";

export function useFavoris() {
  const { user } = useAuth();
  const qc = useQueryClient();

  const { data } = useQuery({
    queryKey: ["favoris"],
    queryFn: () => api.getFavoris(),
    enabled: !!user,
  });

  const ids = data?.ids ?? [];

  const addMutation = useMutation({
    mutationFn: (epreuveId: string) => api.addFavori(epreuveId),
    onMutate: async (epreuveId) => {
      await qc.cancelQueries({ queryKey: ["favoris"] });
      const prev = qc.getQueryData<UserFavoris>(["favoris"]);
      qc.setQueryData<UserFavoris>(["favoris"], {
        ids: [...(prev?.ids ?? []), epreuveId],
      });
      return { prev };
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["favoris-epreuves"] });
      toast.success("Ajouté aux favoris");
    },
    onError: (e, _id, ctx) => {
      if (ctx?.prev) qc.setQueryData(["favoris"], ctx.prev);
      toast.error(e instanceof Error ? e.message : "Impossible d'ajouter aux favoris");
    },
  });

  const removeMutation = useMutation({
    mutationFn: (epreuveId: string) => api.removeFavori(epreuveId),
    onMutate: async (epreuveId) => {
      await qc.cancelQueries({ queryKey: ["favoris"] });
      const prev = qc.getQueryData<UserFavoris>(["favoris"]);
      qc.setQueryData<UserFavoris>(["favoris"], {
        ids: (prev?.ids ?? []).filter((id) => id !== epreuveId),
      });
      return { prev };
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["favoris-epreuves"] });
      toast.success("Retiré des favoris");
    },
    onError: (e, _id, ctx) => {
      if (ctx?.prev) qc.setQueryData(["favoris"], ctx.prev);
      toast.error(e instanceof Error ? e.message : "Impossible de retirer des favoris");
    },
  });

  const isFavorited = (epreuveId: string) => ids.includes(epreuveId);

  const toggleFavori = (epreuveId: string) => {
    if (!user) {
      toast.error("Connecte-toi pour enregistrer tes favoris");
      return;
    }
    if (isFavorited(epreuveId)) {
      removeMutation.mutate(epreuveId);
    } else {
      addMutation.mutate(epreuveId);
    }
  };

  return {
    ids,
    isFavorited,
    toggleFavori,
    isPending: addMutation.isPending || removeMutation.isPending,
  };
}
