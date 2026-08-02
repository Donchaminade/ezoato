import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import {
  Download, ArrowLeft, FileText, Lock, CreditCard, Loader2,
  MapPin, Calendar, Building2, Share2, Eye, CheckCircle2, ClipboardCheck, Crown,
} from "lucide-react";
import { toast } from "sonner";
import { PageHero } from "@/components/layout/PageHero";
import { PageHeroBadge } from "@/components/layout/PageHeroBadge";
import { PublicLayout } from "@/components/layout/PublicLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AuthenticatedImage,
  AuthenticatedPdf,
  PORTRAIT_PREVIEW_FRAME,
} from "@/components/admin/AuthenticatedMedia";
import { PaymentDialog } from "@/components/payments/PaymentDialog";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { shareEpreuve } from "@/lib/epreuve-share";
import { formatFcfa, getPrixFcfa, requiresPayment, typeLabel } from "@/lib/pricing";
import { subscriptionProCtaLabel } from "@/components/subscription/SubscriptionProBanner";

export const Route = createFileRoute("/epreuves/$id")({
  head: () => ({
    meta: [{ title: "Épreuve — EZOA-TO" }],
  }),
  component: EpreuveDetail,
});

function EpreuveDetail() {
  const { id } = Route.useParams();
  const { user } = useAuth();
  const qc = useQueryClient();
  const [payOpen, setPayOpen] = useState(false);
  const [payCorrigeOpen, setPayCorrigeOpen] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [downloadingCorrige, setDownloadingCorrige] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["epreuve", id],
    queryFn: () => api.getEpreuve(id),
  });

  const corrigeId = data?.corrigeType?.id;
  const isCorrigePage = data?.type === "corrige";

  const { data: access, refetch: refetchAccess } = useQuery({
    queryKey: ["payment-access", id],
    queryFn: () => api.checkPaymentAccess(id),
    enabled: !!user && !!data && requiresPayment(data),
  });

  const { data: corrigeAccess, refetch: refetchCorrigeAccess } = useQuery({
    queryKey: ["payment-access", corrigeId],
    queryFn: () => api.checkPaymentAccess(corrigeId!),
    enabled: !!user && !!corrigeId,
  });

  const isPaid = data ? requiresPayment(data) : false;
  const hasAccess = !isPaid || access?.hasAccess;
  const corrigeHasAccess = corrigeAccess?.hasAccess ?? false;

  async function handleDownload(epreuveId: string, setLoading: (v: boolean) => void) {
    setLoading(true);
    try {
      await api.downloadEpreuve(epreuveId);
      toast.success("Téléchargement lancé");
      qc.invalidateQueries({ queryKey: ["epreuve", id] });
      qc.invalidateQueries({ queryKey: ["my-library"] });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Échec du téléchargement");
    } finally {
      setLoading(false);
    }
  }

  async function handleShare() {
    if (!data) return;
    try {
      const result = await shareEpreuve(data);
      if (result === "copied") {
        toast.success("Lien copié");
      }
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
      toast.error("Impossible de partager cette épreuve");
    }
  }

  const HeroIcon = isCorrigePage ? ClipboardCheck : FileText;

  return (
    <PublicLayout>
      {isLoading && (
        <div className="mx-auto max-w-5xl px-4 py-10">
          <div className="h-48 animate-pulse rounded-2xl bg-muted" />
        </div>
      )}

      {!isLoading && !data && (
        <PageHero
          badge={<PageHeroBadge icon={FileText}>Épreuve</PageHeroBadge>}
          title="Épreuve introuvable"
          description="Cette épreuve n'existe pas ou a été archivée."
          primaryImage="hero"
          compact
        >
          <Button asChild><Link to="/docs">Retour aux archives</Link></Button>
        </PageHero>
      )}

      {data && (
        <>
          <PageHero
            badge={<PageHeroBadge icon={HeroIcon}>{typeLabel(data.type)}</PageHeroBadge>}
            title={data.titre}
            titleUppercase={false}
            description={
              <span className="inline-flex flex-wrap items-center justify-center gap-x-4 gap-y-1">
                <span className="inline-flex items-center gap-1.5"><MapPin className="size-4" />{data.ville}</span>
                <span className="inline-flex items-center gap-1.5"><Building2 className="size-4" />{data.etablissement ?? data.examen ?? "—"}</span>
                <span className="inline-flex items-center gap-1.5"><Calendar className="size-4" />{data.annee}</span>
                <span>{data.matiere} · {data.classe}</span>
              </span>
            }
            primaryImage={isCorrigePage ? "hero" : "group"}
          >
            {data.epreuveParent && (
              <Button asChild variant="link" className="mb-2 h-auto p-0 text-primary">
                <Link to="/epreuves/$id" params={{ id: data.epreuveParent.id }}>
                  <ArrowLeft className="size-4" /> Sujet : {data.epreuveParent.titre}
                </Link>
              </Button>
            )}
            <div className="flex flex-wrap items-center gap-2">
              {data.examen && <Badge variant="outline">{data.examen}</Badge>}
              {isPaid ? (
                <Badge variant="secondary"><Lock className="size-3" /> {formatFcfa(getPrixFcfa(data))}</Badge>
              ) : (
                <Badge className="border-0 bg-success/15 text-success">Gratuit</Badge>
              )}
            </div>
            <div className="mt-4 flex flex-wrap gap-3">
              <Button asChild variant="outline" size="sm">
                <Link to="/docs"><ArrowLeft className="size-4" /> Archives</Link>
              </Button>
              {!user ? (
                <Button asChild size="lg">
                  <Link to="/auth/login">Se connecter pour télécharger</Link>
                </Button>
              ) : hasAccess ? (
                <Button size="lg" onClick={() => handleDownload(data.id, setDownloading)} disabled={downloading}>
                  {downloading ? <Loader2 className="size-4 animate-spin" /> : <Download className="size-4" />}
                  Télécharger le PDF
                </Button>
              ) : (
                <>
                  <Button size="lg" asChild>
                    <Link to="/account/abonnement">
                      <Crown className="size-4" />
                      {subscriptionProCtaLabel()}
                    </Link>
                  </Button>
                  <Button size="lg" variant="outline" onClick={() => setPayOpen(true)}>
                    <CreditCard className="size-4" />
                    Payer {formatFcfa(getPrixFcfa(data))} et télécharger
                  </Button>
                </>
              )}
              <Button size="lg" variant="outline" onClick={handleShare}>
                <Share2 className="size-4" /> Partager
              </Button>
            </div>
          </PageHero>

          <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
            <div className="grid gap-8 lg:grid-cols-[1fr_280px]">
              <div className="space-y-6">
                <div>
                  <h2 className="flex items-center gap-2 font-display text-lg font-semibold">
                    <Eye className="size-5" /> Aperçu
                  </h2>
                  <div className="mt-4 overflow-hidden rounded-2xl border border-border bg-card shadow-soft">
                    {isPaid && !hasAccess ? (
                      <div className="grid min-h-[320px] place-items-center bg-muted/30 p-8 text-center text-muted-foreground">
                        <Lock className="mx-auto size-12 text-gold opacity-80" />
                        <p className="mt-4 font-medium text-foreground">Aperçu verrouillé</p>
                        <p className="mt-2 text-sm">
                          Cette épreuve compte {data.pages} pages. Payez {formatFcfa(getPrixFcfa(data))} pour débloquer
                          l&apos;aperçu et le téléchargement (accès 6 mois).
                        </p>
                        {user ? (
                          <div className="mt-5 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
                            <Button asChild>
                              <Link to="/account/abonnement">
                                <Crown className="size-4" />
                                Passer en abonnement Pro
                              </Link>
                            </Button>
                            <Button variant="outline" onClick={() => setPayOpen(true)}>
                              <CreditCard className="size-4" />
                              Débloquer — {formatFcfa(getPrixFcfa(data))}
                            </Button>
                          </div>
                        ) : (
                          <Button asChild className="mt-5">
                            <Link to="/auth/login">Se connecter pour payer</Link>
                          </Button>
                        )}
                      </div>
                    ) : data.thumbnailUrl ? (
                      <AuthenticatedImage
                        url={data.thumbnailUrl}
                        alt={`Aperçu — ${data.titre}`}
                        className={PORTRAIT_PREVIEW_FRAME}
                        imgClassName="absolute inset-0 h-full w-full object-contain"
                      />
                    ) : user && hasAccess && data.pdfPreviewUrl ? (
                      <AuthenticatedPdf url={data.pdfPreviewUrl} />
                    ) : (
                      <div className="grid min-h-[420px] place-items-center bg-muted/30 text-muted-foreground">
                        <div className="p-8 text-center">
                          <FileText className="mx-auto size-16 opacity-40" />
                          <p className="mt-3 font-medium">{data.pages} pages · {data.tailleKo} Ko</p>
                          <p className="mt-1 text-sm">Aperçu visuel indisponible pour cette épreuve</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {data.corrigeType && (
                  <div className="rounded-2xl border border-primary/25 bg-primary/5 p-6">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div>
                        <h2 className="flex items-center gap-2 font-display text-lg font-semibold">
                          <ClipboardCheck className="size-5 text-primary" />
                          Corrigé type disponible
                        </h2>
                        <p className="mt-2 text-sm text-muted-foreground">
                          {data.corrigeType.pages} pages · Accès 6 mois après achat ·{" "}
                          {formatFcfa(data.corrigeType.prixFcfa)}
                        </p>
                      </div>
                      <Badge variant="outline" className="border-primary/40">
                        <Lock className="size-3" /> {formatFcfa(data.corrigeType.prixFcfa)}
                      </Badge>
                    </div>
                    <div className="mt-4 flex flex-wrap gap-3">
                      {!user ? (
                        <Button asChild>
                          <Link to="/auth/login">Se connecter pour accéder</Link>
                        </Button>
                      ) : corrigeHasAccess ? (
                        <>
                          <Button onClick={() => handleDownload(data.corrigeType!.id, setDownloadingCorrige)} disabled={downloadingCorrige}>
                            {downloadingCorrige ? <Loader2 className="size-4 animate-spin" /> : <Download className="size-4" />}
                            Télécharger le corrigé
                          </Button>
                          <Button asChild variant="outline">
                            <Link to="/account/bibliotheque">Voir dans ma bibliothèque</Link>
                          </Button>
                        </>
                      ) : (
                        <Button onClick={() => setPayCorrigeOpen(true)}>
                          <CreditCard className="size-4" />
                          Acheter le corrigé — {formatFcfa(data.corrigeType.prixFcfa)}
                        </Button>
                      )}
                      <Button asChild variant="ghost">
                        <Link to="/epreuves/$id" params={{ id: data.corrigeType.id }}>
                          Voir la fiche corrigé
                        </Link>
                      </Button>
                    </div>
                    {corrigeHasAccess && (
                      <p className="mt-3 flex items-center gap-1.5 text-xs text-primary">
                        <CheckCircle2 className="size-3.5" />
                        Corrigé acheté — accès 6 mois depuis ton espace
                      </p>
                    )}
                  </div>
                )}
              </div>

              <aside className="space-y-4">
                <div className="rounded-xl border border-border bg-card p-5">
                  <h3 className="font-display font-semibold">Informations</h3>
                  <dl className="mt-4 space-y-3 text-sm">
                    <div><dt className="text-muted-foreground">Matière</dt><dd className="font-medium">{data.matiere}</dd></div>
                    <div><dt className="text-muted-foreground">Niveau</dt><dd className="font-medium capitalize">{data.niveau}</dd></div>
                    <div><dt className="text-muted-foreground">Classe</dt><dd className="font-medium">{data.classe}</dd></div>
                    {data.periode && <div><dt className="text-muted-foreground">Période</dt><dd className="font-medium">{data.periode}</dd></div>}
                    <div><dt className="text-muted-foreground">Téléchargements</dt><dd className="font-medium tabular-nums">{data.telechargements}</dd></div>
                  </dl>
                </div>

                {isPaid && hasAccess && access?.expiresAt && (
                  <div className="rounded-xl border border-primary/25 bg-primary/5 p-5 text-sm">
                    <p className="font-semibold text-primary">Accès actif</p>
                    <p className="mt-1 text-muted-foreground">
                      Valide jusqu&apos;au {new Date(access.expiresAt).toLocaleDateString("fr-FR")}
                    </p>
                  </div>
                )}

                {isPaid && !hasAccess && user && (
                  <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-5 text-sm">
                    <p className="font-semibold">Contenu payant</p>
                    <p className="mt-1 text-muted-foreground">
                      Paiement unique de {formatFcfa(getPrixFcfa(data))} via Flooz ou T-Money, ou abonnement Pro pour tout débloquer.
                    </p>
                    <Button className="mt-3 w-full" size="sm" asChild>
                      <Link to="/account/abonnement">
                        <Crown className="size-4" /> {subscriptionProCtaLabel()}
                      </Link>
                    </Button>
                    <Button className="mt-2 w-full" size="sm" variant="outline" onClick={() => setPayOpen(true)}>
                      <CreditCard className="size-4" /> Payer cette épreuve
                    </Button>
                  </div>
                )}

                {!isCorrigePage && (
                  <div className="rounded-xl border border-border bg-card p-5 text-sm">
                    <p className="font-semibold">Tu as cette épreuve ?</p>
                    <p className="mt-1 text-muted-foreground">Contribue à la bibliothèque et gagne de l&apos;argent.</p>
                    <Button
                      asChild
                      variant="outline"
                      size="sm"
                      className="tea-water-fill-none mt-3 w-full border-primary/45 bg-transparent text-primary hover:border-primary/55 hover:bg-primary/20 hover:!text-primary dark:border-primary/50 dark:text-white dark:hover:!text-white"
                    >
                      <Link to="/submit">
                        <span className="tea-water-content">Soumettre une épreuve</span>
                      </Link>
                    </Button>
                  </div>
                )}
              </aside>
            </div>
          </div>
        </>
      )}

      {data && (
        <>
          <PaymentDialog epreuve={data} open={payOpen} onOpenChange={setPayOpen} onSuccess={() => { refetchAccess(); setPayOpen(false); }} />
          {data.corrigeType && (
            <PaymentDialog
              epreuve={{
                ...data,
                id: data.corrigeType.id,
                titre: data.corrigeType.titre,
                type: "corrige",
                prixFcfa: data.corrigeType.prixFcfa,
                requiresPayment: true,
              }}
              open={payCorrigeOpen}
              onOpenChange={setPayCorrigeOpen}
              onSuccess={() => { refetchCorrigeAccess(); setPayCorrigeOpen(false); }}
            />
          )}
        </>
      )}
    </PublicLayout>
  );
}
