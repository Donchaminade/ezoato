import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import type { NotificationConfig } from "@/lib/types";

export const NOTIFICATIONS_QUERY_KEY = ["notification-config"] as const;

export function useNotifications() {
  const { user } = useAuth();
  const qc = useQueryClient();

  const { data, isLoading, isFetching } = useQuery({
    queryKey: NOTIFICATIONS_QUERY_KEY,
    queryFn: () => api.getNotificationConfig(),
    enabled: !!user,
    refetchInterval: 60_000,
  });

  const readMutation = useMutation({
    mutationFn: (ids?: string[]) => api.markNotificationsRead(ids),
    onSuccess: (res, ids) => {
      qc.setQueryData<NotificationConfig>(NOTIFICATIONS_QUERY_KEY, (prev) =>
        prev
          ? {
              ...prev,
              unreadCount: res.unreadCount,
              inbox: prev.inbox.map((n) =>
                !idsProvided(ids) || ids.includes(n.id) ? { ...n, lu: true } : n,
              ),
            }
          : prev,
      );
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Échec"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.deleteNotification(id),
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: NOTIFICATIONS_QUERY_KEY });
      const prev = qc.getQueryData<NotificationConfig>(NOTIFICATIONS_QUERY_KEY);
      if (prev) {
        const removed = prev.inbox.find((n) => n.id === id);
        qc.setQueryData<NotificationConfig>(NOTIFICATIONS_QUERY_KEY, {
          ...prev,
          inbox: prev.inbox.filter((n) => n.id !== id),
          unreadCount: removed && !removed.lu ? Math.max(0, prev.unreadCount - 1) : prev.unreadCount,
        });
      }
      return { prev };
    },
    onSuccess: (res) => {
      qc.setQueryData<NotificationConfig>(NOTIFICATIONS_QUERY_KEY, (prev) =>
        prev ? { ...prev, unreadCount: res.unreadCount } : prev,
      );
      toast.success("Notification supprimée");
    },
    onError: (e, _id, ctx) => {
      if (ctx?.prev) qc.setQueryData(NOTIFICATIONS_QUERY_KEY, ctx.prev);
      toast.error(e instanceof Error ? e.message : "Suppression impossible");
    },
  });

  return {
    inbox: data?.inbox ?? [],
    unreadCount: data?.unreadCount ?? 0,
    rulesReady: data?.rulesReady ?? false,
    isLoading,
    isFetching,
    markRead: readMutation.mutate,
    markAllRead: () => readMutation.mutate(undefined),
    deleteNotification: deleteMutation.mutate,
    isMarkingRead: readMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}

function idsProvided(ids?: string[]): ids is string[] {
  return Array.isArray(ids) && ids.length > 0;
}
