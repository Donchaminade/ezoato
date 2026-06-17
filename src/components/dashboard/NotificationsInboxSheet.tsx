import { Bell, CheckCheck, ExternalLink, Loader2, Trash2 } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useNotifications } from "@/hooks/useNotifications";
import { cn } from "@/lib/utils";

const PREVIEW_LEN = 120;

function openNotificationUrl(url: string, navigate: ReturnType<typeof useNavigate>, onClose: () => void) {
  onClose();
  if (/^https?:\/\//i.test(url)) {
    window.location.assign(url);
    return;
  }
  const q = url.indexOf("?");
  if (q !== -1) {
    const pathname = url.slice(0, q);
    const search = Object.fromEntries(new URLSearchParams(url.slice(q + 1)));
    void navigate({ to: pathname, search });
    return;
  }
  const soumission = url.match(/^\/account\/soumissions\/([^/?#]+)$/);
  if (soumission) {
    void navigate({ to: "/account/soumissions/$id", params: { id: soumission[1] } });
    return;
  }
  const epreuve = url.match(/^\/epreuves\/([^/?#]+)$/);
  if (epreuve) {
    void navigate({ to: "/epreuves/$id", params: { id: epreuve[1] } });
    return;
  }
  void navigate({ to: url });
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleString("fr-FR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function NotificationsInboxSheet({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const {
    inbox,
    unreadCount,
    rulesReady,
    isLoading,
    markRead,
    markAllRead,
    deleteNotification,
    isMarkingRead,
    isDeleting,
  } = useNotifications();
  const navigate = useNavigate();

  const [expandedIds, setExpandedIds] = useState<Set<string>>(() => new Set());

  function toggleExpanded(id: string) {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="flex w-full flex-col gap-0 p-0 sm:max-w-md"
      >
        <SheetHeader className="shrink-0 border-b border-border px-4 py-4 text-left sm:px-6">
          <div className="flex items-start justify-between gap-3 pr-8">
            <div>
              <SheetTitle className="flex items-center gap-2">
                <Bell className="size-5 text-primary" />
                Notifications
              </SheetTitle>
              <SheetDescription>
                {unreadCount > 0
                  ? `${unreadCount} non lue${unreadCount > 1 ? "s" : ""}`
                  : "Confirmations et alertes récentes"}
              </SheetDescription>
            </div>
            {unreadCount > 0 && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="shrink-0 rounded-lg"
                disabled={isMarkingRead}
                onClick={() => markAllRead()}
              >
                <CheckCheck className="size-4" />
                Tout lu
              </Button>
            )}
          </div>
        </SheetHeader>

        <ScrollArea className="min-h-0 flex-1">
          <div className="px-4 py-3 sm:px-6">
            {isLoading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="size-6 animate-spin text-muted-foreground" />
              </div>
            ) : !rulesReady ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                Le système de notifications n&apos;est pas encore activé sur le serveur.
              </p>
            ) : inbox.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-16 text-center">
                <Bell className="size-10 text-muted-foreground/40" />
                <p className="text-sm text-muted-foreground">Aucune notification pour le moment.</p>
              </div>
            ) : (
              <ul className="divide-y divide-border">
                {inbox.map((n) => {
                  const expanded = expandedIds.has(n.id);
                  const isLong = n.corps.length > PREVIEW_LEN;
                  const preview = isLong && !expanded
                    ? `${n.corps.slice(0, PREVIEW_LEN).trimEnd()}…`
                    : n.corps;

                  return (
                  <li
                    key={n.id}
                    className={cn(
                      "py-3 first:pt-0 last:pb-0",
                      !n.lu && "rounded-lg bg-primary/5 -mx-2 px-2",
                    )}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-sm font-medium">{n.titre}</p>
                          {!n.lu && (
                            <Badge variant="secondary" className="h-5 text-[10px]">
                              Nouveau
                            </Badge>
                          )}
                        </div>
                        <p className="mt-0.5 whitespace-pre-wrap text-sm text-muted-foreground">
                          {preview}
                        </p>
                        <p className="mt-2 text-xs text-muted-foreground">{fmtDate(n.createdAt)}</p>
                      </div>
                    </div>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      {isLong && (
                        <Button
                          type="button"
                          variant="link"
                          size="sm"
                          className="h-auto p-0 text-xs"
                          onClick={() => {
                            toggleExpanded(n.id);
                            if (!expanded && !n.lu) markRead([n.id]);
                          }}
                        >
                          {expanded ? "Réduire" : "Voir"}
                        </Button>
                      )}
                      {n.url && (
                        <Button
                          type="button"
                          variant="link"
                          size="sm"
                          className="h-auto gap-1 p-0 text-xs"
                          onClick={() => {
                            if (!n.lu) markRead([n.id]);
                            openNotificationUrl(n.url!, navigate, () => onOpenChange(false));
                          }}
                        >
                          <ExternalLink className="size-3" />
                          Ouvrir
                        </Button>
                      )}
                      {!n.lu && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-7 rounded-lg px-2 text-xs"
                          disabled={isMarkingRead}
                          onClick={() => markRead([n.id])}
                        >
                          Marquer lu
                        </Button>
                      )}
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-7 rounded-lg px-2 text-xs text-muted-foreground hover:text-destructive"
                        disabled={isDeleting}
                        onClick={() => deleteNotification(n.id)}
                      >
                        <Trash2 className="size-3.5" />
                        Supprimer
                      </Button>
                    </div>
                  </li>
                  );
                })}
              </ul>
            )}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
