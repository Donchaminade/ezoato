import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ListChecks, Loader2, Lock } from "lucide-react";
import { toast } from "sonner";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { PageHero } from "@/components/layout/PageHero";
import { PageHeroBadge } from "@/components/layout/PageHeroBadge";
import { PublicLayout } from "@/components/layout/PublicLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getAdminNavGroups } from "@/lib/dashboard-nav";
import { correctionsApi, STATUT_LABEL, type ReglagesCorrection } from "@/lib/corrections-api";
import { useAuth } from "@/lib/auth";
import { formatFcfa } from "@/lib/pricing";

export const Route = createFileRoute("/admin_/corrections")({
  head: () => ({ meta: [{ title: "Demandes de correction — Administration" }] }),
  component: Page,
});

function Page() {
  const { user, loading } = useAuth();
  if (loading) {
    return <div className="flex min-h-svh items-center justify-center"><Loader2 className="size-8 animate-spin" /></div>;
  }
  if (!user || (user.role !== "admin" && user.role !== "gestionnaire")) {
    return (
      <PublicLayout>
        <PageHero badge={<PageHeroBadge icon={Lock}>Admin</PageHeroBadge>} title="Accès réservé" description="Cette file est réservée à l'administration." compact>
          <Button asChild><Link to="/">Retour à l'accueil</Link></Button>
        </PageHero>
      </PublicLayout>
    );
  }
  return <Panneau isAdmin={user.role === "admin"} />;
}

function Panneau({ isAdmin }: { isAdmin: boolean }) {
  const qc = useQueryClient();
  const [onglet, setOnglet] = useState<"file" | "correcteurs" | "reglages">("file");
  const file = useQuery({ queryKey: ["admin-corrections"], queryFn: () => correctionsApi.fileAdmin() });
  const correcteurs = useQuery({ queryKey: ["admin-correcteurs"], queryFn: () => correctionsApi.correcteurs(), enabled: onglet === "correcteurs" });
  const reglages = useQuery({ queryKey: ["admin-reglages-correction"], queryFn: () => correctionsApi.lireReglages(), enabled: isAdmin && onglet === "reglages" });

  async function agir(label: string, job: () => Promise<unknown>) {
    try {
      await job();
      toast.success(label);
      qc.invalidateQueries({ queryKey: ["admin-corrections"] });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Action impossible");
    }
  }

  return (
    <DashboardLayout
      title="Demandes de correction"
      subtitle="File, assignation et réglages"
      groups={getAdminNavGroups(isAdmin)}
      activeSection="corrections"
      onRefresh={() => { file.refetch(); correcteurs.refetch(); reglages.refetch(); }}
    >
      <div className="mb-4 flex flex-wrap gap-2">
        <Button variant={onglet === "file" ? "default" : "outline"} onClick={() => setOnglet("file")}>File</Button>
        <Button variant={onglet === "correcteurs" ? "default" : "outline"} onClick={() => setOnglet("correcteurs")}>Correcteurs</Button>
        {isAdmin && <Button variant={onglet === "reglages" ? "default" : "outline"} onClick={() => setOnglet("reglages")}>Réglages</Button>}
        <Button variant="ghost" onClick={() => agir("Échéances traitées", () => correctionsApi.echues())}>Réassigner les échéances</Button>
      </div>

      {onglet === "file" && (
        <ul className="space-y-4">
          {(file.data ?? []).map((demande) => (
            <DemandeAdmin key={demande.id} demande={demande} onAgir={agir} />
          ))}
          {(file.data ?? []).length === 0 && <li className="text-sm text-muted-foreground">File vide.</li>}
        </ul>
      )}

      {onglet === "correcteurs" && (
        <ul className="space-y-3">
          {(correcteurs.data ?? []).map((profil) => (
            <li key={profil.id} className="rounded-2xl border border-border bg-card p-4">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-medium">{profil.qualite}</span>
                <Badge variant="secondary">{profil.statut}</Badge>
                <span className="text-sm text-muted-foreground">fiabilité {profil.fiabilite}</span>
              </div>
              <p className="mt-1 text-sm">{profil.matieres.join(", ")} · {profil.niveaux.join(", ")}</p>
              {isAdmin && profil.statut === "en_attente" && (
                <div className="mt-3 flex gap-2">
                  <Button onClick={() => agir("Correcteur validé", () => correctionsApi.deciderCorrecteur(profil.id, "valide", ""))}>Valider</Button>
                  <Button variant="outline" onClick={() => agir("Candidature rejetée", () => correctionsApi.deciderCorrecteur(profil.id, "rejete", "Justificatifs insuffisants"))}>Rejeter</Button>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}

      {onglet === "reglages" && isAdmin && reglages.data && (
        <ReglagesForm initial={reglages.data} onSave={(body) => agir("Réglages enregistrés", () => correctionsApi.ecrireReglages(body))} />
      )}
    </DashboardLayout>
  );
}

function DemandeAdmin({
  demande,
  onAgir,
}: {
  demande: Awaited<ReturnType<typeof correctionsApi.fileAdmin>>[number];
  onAgir: (label: string, job: () => Promise<unknown>) => Promise<void>;
}) {
  const suggestions = useQuery({
    queryKey: ["suggestions", demande.id],
    queryFn: () => correctionsApi.suggestions(demande.id),
    enabled: demande.statut === "confirmee_admin" || demande.statut === "en_attente_admin" || demande.statut === "rejetee",
  });
  const [correcteurId, setCorrecteurId] = useState("");
  return (
    <li className="rounded-2xl border border-border bg-card p-4">
      <div className="flex flex-wrap items-center gap-2">
        <h2 className="font-display font-semibold">{demande.epreuveTitre}</h2>
        <Badge>{STATUT_LABEL[demande.statut] ?? demande.statut}</Badge>
        {demande.adminNotifie && <Badge variant="outline">Admin notifié</Badge>}
      </div>
      <p className="mt-1 text-sm text-muted-foreground">
        {demande.matiere} · {demande.niveau} · {demande.exercices.join(", ")} · {demande.classeIa || "sans classe IA"}
      </p>
      {demande.blocageTexte && <p className="mt-2 whitespace-pre-wrap text-sm">{demande.blocageTexte}</p>}
      {demande.correction?.contenu && (
        <pre className="mt-3 whitespace-pre-wrap rounded-xl bg-muted/40 p-3 text-sm">{demande.correction.contenu}</pre>
      )}
      <div className="mt-3 flex flex-wrap gap-2">
        {demande.statut === "en_attente_reglement" && (
          <Button onClick={() => onAgir("Règlement confirmé", () => correctionsApi.confirmerReglement(demande.id, "admin"))}>
            Confirmer le règlement {demande.montant ? formatFcfa(demande.montant) : ""}
          </Button>
        )}
        {demande.statut === "en_attente_admin" && (
          <Button onClick={() => onAgir("Demande confirmée", () => correctionsApi.confirmer(demande.id))}>Confirmer</Button>
        )}
        {demande.statut === "confirmee_admin" && (
          <Button variant="outline" onClick={() => onAgir("Renvoyée à l'IA", () => correctionsApi.renvoyerIa(demande.id))}>Rendre à l'IA</Button>
        )}
        {(demande.statut === "confirmee_admin" || demande.statut === "rejetee") && (
          <>
            <select className="rounded-xl border border-border bg-background px-3 py-2 text-sm" value={correcteurId} onChange={(e) => setCorrecteurId(e.target.value)}>
              <option value="">Suggestion de correcteur</option>
              {(suggestions.data ?? []).map((s) => (
                <option key={s.userId} value={s.userId}>
                  {s.qualite} · score {s.score} · fiabilité {s.fiabilite} · charge {s.charge}
                </option>
              ))}
            </select>
            <Button disabled={!correcteurId} onClick={() => onAgir("Correcteur assigné", () => correctionsApi.assigner(demande.id, correcteurId))}>Assigner</Button>
          </>
        )}
      </div>
    </li>
  );
}

function ReglagesForm({ initial, onSave }: { initial: ReglagesCorrection; onSave: (body: ReglagesCorrection) => void }) {
  const [form, setForm] = useState(initial);
  function setNum(key: keyof ReglagesCorrection, value: string) {
    setForm((prev) => ({ ...prev, [key]: Number(value) }));
  }
  const champs: { key: keyof ReglagesCorrection; label: string; aide: string }[] = [
    { key: "remuneration_correcteur", label: "Correcteur (FCFA)", aide: "Versé seulement si la correction est validée. Défaut 500." },
    { key: "forfait_validateur", label: "Validateur (FCFA)", aide: "Forfait par revue, même en cas de rejet. Défaut 200." },
    { key: "remuneration_reutilisation", label: "Réutilisation (FCFA)", aide: "Versé au correcteur d'origine. Défaut 100." },
    { key: "prix_unitaire", label: "Prix élève (FCFA)", aide: "Défaut prudent 1 500 : couvre 500 + 200, et encore un second validateur." },
    { key: "quota_pro", label: "Quota Pro", aide: "Demandes incluses par période d'abonnement. Défaut 1." },
    { key: "nombre_validateurs", label: "Nombre de validateurs", aide: "Défaut 1. Personne ne valide sa propre correction." },
    { key: "delai_reassignation_heures", label: "Délai (heures)", aide: "Réassignation automatique. Défaut 48." },
  ];
  return (
    <form
      className="max-w-xl space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        onSave(form);
      }}
    >
      {champs.map((champ) => (
        <label key={champ.key} className="block text-sm">
          <span className="font-medium">{champ.label}</span>
          <Input className="mt-1" type="number" value={String(form[champ.key] ?? "")} onChange={(e) => setNum(champ.key, e.target.value)} />
          <span className="mt-1 block text-muted-foreground">{champ.aide}</span>
        </label>
      ))}
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={!!form.reutilisation_active} onChange={(e) => setForm((p) => ({ ...p, reutilisation_active: e.target.checked ? 1 : 0 }))} />
        Réutiliser les corrections déjà validées pour le même exercice
      </label>
      <label className="block text-sm">
        Format envoyé à l'élève
        <select className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2" value={form.format_eleve} onChange={(e) => setForm((p) => ({ ...p, format_eleve: e.target.value }))}>
          <option value="pedagogique">Correction commentée et pédagogique</option>
          <option value="pedagogique_courte">Correction commentée, version courte</option>
        </select>
      </label>
      <p className="text-sm text-muted-foreground">
        Le seuil de retrait reste celui du portefeuille (2 000 FCFA). Ces valeurs s'appliquent sans redéploiement.
      </p>
      <Button type="submit">Enregistrer</Button>
    </form>
  );
}
