import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Clock, Loader2, Mail, MapPin, MessageCircle, Percent, Phone, Tag } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { DashboardSectionCard } from "@/components/dashboard/DashboardSectionCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { AdminReferentielsSection } from "@/components/admin/AdminReferentielsSection";
import { api } from "@/lib/api";
import { formatFcfa } from "@/lib/pricing";
import { examenPriceDisplay } from "@/lib/pricing-meta";
function toDatetimeLocal(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function AdminSettingsTab() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["platform-settings"],
    queryFn: () => api.getPlatformSettings(),
  });

  const [form, setForm] = useState({
    prixExamenNational: "100",
    prixCorrigeType: "200",
    epreuvesParRecompense: "50",
    montantRecompense: "1000",
    minRetrait: "2000",
    promoActive: false,
    promoLabel: "",
    promoPourcentage: "",
    promoPrixFixe: "",
    promoDebut: "",
    promoFin: "",
    promoExamens: true,
    promoCorriges: false,
    contactEmail: "",
    contactTelephone: "",
    contactWhatsapp: "",
    contactAdresse: "",
    contactHoraires: "",
  });

  useEffect(() => {
    if (!data?.settings) return;
    const s = data.settings;
    setForm({
      prixExamenNational: String(s.prixExamenNational),
      prixCorrigeType: String(s.prixCorrigeType),
      epreuvesParRecompense: String(s.epreuvesParRecompense),
      montantRecompense: String(s.montantRecompense),
      minRetrait: String(s.minRetrait),
      promoActive: s.promo.active,
      promoLabel: s.promo.label ?? "",
      promoPourcentage: s.promo.pourcentage != null ? String(s.promo.pourcentage) : "",
      promoPrixFixe: s.promo.prixFixe != null ? String(s.promo.prixFixe) : "",
      promoDebut: toDatetimeLocal(s.promo.debut),
      promoFin: toDatetimeLocal(s.promo.fin),
      promoExamens: s.promo.appliqueExamens,
      promoCorriges: s.promo.appliqueCorriges,
      contactEmail: s.contact?.email ?? "",
      contactTelephone: s.contact?.telephone ?? "",
      contactWhatsapp: s.contact?.whatsapp ?? "",
      contactAdresse: s.contact?.adresse ?? "",
      contactHoraires: s.contact?.horaires ?? "",
    });
  }, [data?.settings]);

  const saveMutation = useMutation({
    mutationFn: () =>
      api.updatePlatformSettings({
        prixExamenNational: Number(form.prixExamenNational),
        prixCorrigeType: form.prixCorrigeType ? Number(form.prixCorrigeType) : null,
        epreuvesParRecompense: Number(form.epreuvesParRecompense),
        montantRecompense: Number(form.montantRecompense),
        minRetrait: Number(form.minRetrait),
        promo: {
          active: form.promoActive,
          label: form.promoLabel || null,
          pourcentage: form.promoPourcentage ? Number(form.promoPourcentage) : null,
          prixFixe: form.promoPrixFixe ? Number(form.promoPrixFixe) : null,
          debut: form.promoDebut ? new Date(form.promoDebut).toISOString() : null,
          fin: form.promoFin ? new Date(form.promoFin).toISOString() : null,
          appliqueExamens: form.promoExamens,
          appliqueCorriges: form.promoCorriges,
        },
        contact: {
          email: form.contactEmail.trim(),
          telephone: form.contactTelephone.trim(),
          whatsapp: form.contactWhatsapp.trim(),
          adresse: form.contactAdresse.trim(),
          horaires: form.contactHoraires.trim(),
        },
      }),
    onSuccess: () => {
      toast.success("Paramètres enregistrés");
      qc.invalidateQueries({ queryKey: ["platform-settings"] });
      qc.invalidateQueries({ queryKey: ["meta"] });
      qc.invalidateQueries({ queryKey: ["contact-info"] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Échec"),
  });

  if (isLoading) {
    return <div className="h-64 animate-pulse rounded-xl bg-muted" />;
  }

  const previewMeta = data?.settings
    ? {
        pricing: data.settings.pricingEffectif,
        stats: { epreuvesValidees: 0, etablissements: 0, telechargements: 0, contributeurs: 0 },
        villes: [],
        matieres: [],
        etablissements: [],
      }
    : undefined;
  const pricePreview = examenPriceDisplay(previewMeta);

  return (
    <div className="space-y-6">
      {!data?.dbReady && (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-900 dark:text-amber-200">
          {data?.message ?? "Migration SQL requise pour persister les paramètres."}
        </div>
      )}

      <DashboardSectionCard title="Tarifs de téléchargement" subtitle="Prix affichés sur le site et appliqués aux paiements">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="prix-examen">Prix examen national (FCFA)</Label>
            <Input
              id="prix-examen"
              type="number"
              min={1}
              value={form.prixExamenNational}
              onChange={(e) => setForm((f) => ({ ...f, prixExamenNational: e.target.value }))}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="prix-corrige">Prix corrigé type (FCFA)</Label>
            <Input
              id="prix-corrige"
              type="number"
              min={1}
              value={form.prixCorrigeType}
              onChange={(e) => setForm((f) => ({ ...f, prixCorrigeType: e.target.value }))}
            />
          </div>
        </div>
        <p className="mt-3 text-xs text-muted-foreground">
          Aperçu public : <strong>{pricePreview.effectif}</strong>
          {pricePreview.barre && (
            <>
              {" "}
              <span className="line-through">{pricePreview.barre}</span>
            </>
          )}
        </p>
      </DashboardSectionCard>

      <DashboardSectionCard
        title="Récompenses contributeurs"
        subtitle="Palier de validation et retraits"
      >
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-1.5">
            <Label>Épreuves / palier</Label>
            <Input
              type="number"
              min={1}
              value={form.epreuvesParRecompense}
              onChange={(e) => setForm((f) => ({ ...f, epreuvesParRecompense: e.target.value }))}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Montant palier (FCFA)</Label>
            <Input
              type="number"
              min={0}
              value={form.montantRecompense}
              onChange={(e) => setForm((f) => ({ ...f, montantRecompense: e.target.value }))}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Retrait minimum (FCFA)</Label>
            <Input
              type="number"
              min={0}
              value={form.minRetrait}
              onChange={(e) => setForm((f) => ({ ...f, minRetrait: e.target.value }))}
            />
          </div>
        </div>
        <p className="mt-3 text-xs text-muted-foreground">
          {form.epreuvesParRecompense} validées = {formatFcfa(Number(form.montantRecompense) || 0)} · retrait dès{" "}
          {formatFcfa(Number(form.minRetrait) || 0)}
        </p>
      </DashboardSectionCard>

      <DashboardSectionCard
        title="Promotion période d'examens"
        subtitle="Réduction temporaire sur les téléchargements payants"
      >
        <div className="flex items-center justify-between gap-3 rounded-xl border border-border bg-muted/30 px-3 py-3">
          <div className="flex items-center gap-2">
            <Tag className="size-4 text-primary" />
            <div>
              <p className="text-sm font-medium">Activer la promo</p>
              <p className="text-xs text-muted-foreground">Visible sur l&apos;accueil et appliquée aux paiements</p>
            </div>
          </div>
          <Switch
            checked={form.promoActive}
            onCheckedChange={(v) => setForm((f) => ({ ...f, promoActive: v }))}
          />
        </div>

        {form.promoActive && (
          <div className="mt-4 space-y-4">
            <div className="space-y-1.5">
              <Label>Libellé promo (ex. « Promo BAC 2026 »)</Label>
              <Input
                value={form.promoLabel}
                onChange={(e) => setForm((f) => ({ ...f, promoLabel: e.target.value }))}
                placeholder="Promo période examens"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label className="flex items-center gap-1">
                  <Percent className="size-3.5" /> Réduction (%)
                </Label>
                <Input
                  type="number"
                  min={1}
                  max={99}
                  placeholder="ex. 25"
                  value={form.promoPourcentage}
                  onChange={(e) => setForm((f) => ({ ...f, promoPourcentage: e.target.value, promoPrixFixe: "" }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label>ou prix fixe (FCFA)</Label>
                <Input
                  type="number"
                  min={1}
                  placeholder="ex. 75"
                  value={form.promoPrixFixe}
                  onChange={(e) => setForm((f) => ({ ...f, promoPrixFixe: e.target.value, promoPourcentage: "" }))}
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Début (optionnel)</Label>
                <Input
                  type="datetime-local"
                  value={form.promoDebut}
                  onChange={(e) => setForm((f) => ({ ...f, promoDebut: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Fin (optionnel)</Label>
                <Input
                  type="datetime-local"
                  value={form.promoFin}
                  onChange={(e) => setForm((f) => ({ ...f, promoFin: e.target.value }))}
                />
              </div>
            </div>

            <div className="flex flex-wrap gap-6">
              <label className="flex items-center gap-2 text-sm">
                <Switch
                  checked={form.promoExamens}
                  onCheckedChange={(v) => setForm((f) => ({ ...f, promoExamens: v }))}
                />
                Examens nationaux
              </label>
              <label className="flex items-center gap-2 text-sm">
                <Switch
                  checked={form.promoCorriges}
                  onCheckedChange={(v) => setForm((f) => ({ ...f, promoCorriges: v }))}
                />
                Corrigés type
              </label>
            </div>
          </div>
        )}
      </DashboardSectionCard>

      <AdminReferentielsSection />

      <DashboardSectionCard
        title="Informations de contact"
        subtitle="Affichées sur la page Contact du site public"
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="contact-email" className="flex items-center gap-1.5">
              <Mail className="size-3.5" /> Email
            </Label>
            <Input
              id="contact-email"
              type="email"
              value={form.contactEmail}
              onChange={(e) => setForm((f) => ({ ...f, contactEmail: e.target.value }))}
              placeholder="contact@ezoa-to.tg"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="contact-tel" className="flex items-center gap-1.5">
              <Phone className="size-3.5" /> Téléphone
            </Label>
            <Input
              id="contact-tel"
              value={form.contactTelephone}
              onChange={(e) => setForm((f) => ({ ...f, contactTelephone: e.target.value }))}
              placeholder="+228 90 00 00 00"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="contact-wa" className="flex items-center gap-1.5">
              <MessageCircle className="size-3.5" /> WhatsApp
            </Label>
            <Input
              id="contact-wa"
              value={form.contactWhatsapp}
              onChange={(e) => setForm((f) => ({ ...f, contactWhatsapp: e.target.value }))}
              placeholder="+22890000000"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="contact-adresse" className="flex items-center gap-1.5">
              <MapPin className="size-3.5" /> Adresse
            </Label>
            <Input
              id="contact-adresse"
              value={form.contactAdresse}
              onChange={(e) => setForm((f) => ({ ...f, contactAdresse: e.target.value }))}
              placeholder="Lomé, Togo"
            />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="contact-horaires" className="flex items-center gap-1.5">
              <Clock className="size-3.5" /> Horaires
            </Label>
            <Input
              id="contact-horaires"
              value={form.contactHoraires}
              onChange={(e) => setForm((f) => ({ ...f, contactHoraires: e.target.value }))}
              placeholder="Lun–Ven, 8h–18h (GMT)"
            />
          </div>
        </div>
        <p className="mt-3 text-xs text-muted-foreground">
          Laissez un champ vide pour ne pas l&apos;afficher sur la page Contact.
        </p>
      </DashboardSectionCard>

      <Button
        className="rounded-xl"
        disabled={saveMutation.isPending}
        onClick={() => saveMutation.mutate()}
      >
        {saveMutation.isPending && <Loader2 className="size-4 animate-spin" />}
        Enregistrer les paramètres
      </Button>

      {data?.settings?.updatedAt && (
        <p className="text-xs text-muted-foreground">
          Dernière mise à jour : {new Date(data.settings.updatedAt).toLocaleString("fr-FR")}
        </p>
      )}
    </div>
  );
}
