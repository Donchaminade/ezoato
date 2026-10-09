import { useQuery } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, FileText, Lock } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { api } from "@/lib/api";
import { EpreuveReader } from "@/components/epreuves/EpreuveReader";
import { useAuth } from "@/lib/auth";
import { isProTier } from "@/lib/pricing";
import type { Epreuve } from "@/lib/types";

function PreviewPaywall({ message }: { epreuve: Epreuve; message?: string | null }) {
  const { user } = useAuth();

  return (
    <div className="grid min-h-[280px] place-items-center rounded-lg border border-dashed border-border bg-muted/40 p-8 text-center">
      <Lock className="size-10 text-muted-foreground opacity-70" />
      <p className="mt-3 font-medium">Aperçu verrouillé</p>
      <p className="mt-2 text-sm text-muted-foreground">
        {message ?? "L'abonnement Pro est nécessaire pour consulter cette épreuve."}
      </p>
      <Button asChild className="mt-4">
        <Link to={user ? "/account/abonnement" : "/auth/login"}>
          {user ? "Passer en Pro" : "Se connecter"}
        </Link>
      </Button>
    </div>
  );
}

export function EpreuvePreviewDialog({
  epreuve,
  open,
  onOpenChange,
}: {
  epreuve: Epreuve | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const { user } = useAuth();
  const isPaid = epreuve ? isProTier(epreuve) : false;

  const { data: access } = useQuery({
    queryKey: ["payment-access", epreuve?.id],
    queryFn: () => api.checkPaymentAccess(epreuve!.id),
    enabled: open && !!user && !!epreuve,
  });

  const locked = user ? (access ? !access.hasAccess : isPaid) : isPaid;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle className="font-display">{epreuve?.titre}</DialogTitle>
        </DialogHeader>
        {epreuve && (
          <div className="space-y-4">
            <dl className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm sm:grid-cols-3">
              <div><dt className="text-muted-foreground">Matière</dt><dd className="font-medium">{epreuve.matiere}</dd></div>
              <div><dt className="text-muted-foreground">Classe</dt><dd className="font-medium">{epreuve.classe}</dd></div>
              <div><dt className="text-muted-foreground">Année</dt><dd className="font-medium">{epreuve.annee}</dd></div>
              <div><dt className="text-muted-foreground">Type</dt><dd className="font-medium capitalize">{epreuve.type}</dd></div>
              <div><dt className="text-muted-foreground">Ville</dt><dd className="font-medium">{epreuve.ville}</dd></div>
              <div><dt className="text-muted-foreground">Lieu</dt><dd className="font-medium">{epreuve.etablissement ?? epreuve.examen ?? "—"}</dd></div>
            </dl>
            {locked ? (
              <PreviewPaywall epreuve={epreuve} message={access?.message} />
            ) : !user ? (
              <PreviewPaywall
                epreuve={epreuve}
                message="Connecte-toi pour consulter cette épreuve. Le quota gratuit est de 50 épreuves par compte."
              />
            ) : epreuve.thumbnailUrl ? (
              <EpreuveReader epreuve={epreuve} />
            ) : (
              <div className="grid h-72 place-items-center rounded-lg border border-dashed border-border bg-muted/40 text-muted-foreground">
                <div className="text-center">
                  <FileText className="mx-auto size-10 opacity-50" />
                  <p className="mt-2 text-sm">Aperçu — {epreuve.pages} pages</p>
                </div>
              </div>
            )}
            <div className="flex justify-end gap-2">
              <Button asChild>
                <Link to="/epreuves/$id" params={{ id: epreuve.id }}>
                  <Download className="size-4" /> {locked ? "Débloquer" : "Télécharger"}
                </Link>
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
