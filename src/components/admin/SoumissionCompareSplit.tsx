import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AuthenticatedPdf } from "@/components/admin/AuthenticatedMedia";
import type { Epreuve, MetaNiveau, Soumission } from "@/lib/types";
import { Check, Columns2, X } from "lucide-react";

function niveauLabel(n: string): string {
  const map: Record<string, string> = {
    college: "Collège",
    lycee: "Lycée",
    universite: "Université",
    concours: "Concours",
  };
  return map[n] ?? n;
}

function metaLines(meta?: MetaNiveau | null): string[] {
  if (!meta) return [];
  const lines: string[] = [];
  if (meta.concours) lines.push(`Concours : ${meta.concours}`);
  if (meta.session) lines.push(`Session : ${meta.session}`);
  if (meta.nomEpreuve) lines.push(`Épreuve : ${meta.nomEpreuve}`);
  if (meta.filiere) lines.push(`Filière : ${meta.filiere}`);
  if (meta.anneeEtude) lines.push(`Année : ${meta.anneeEtude}`);
  if (meta.universite) lines.push(`Université : ${meta.universite}`);
  if (meta.organisme) lines.push(`Organisme : ${meta.organisme}`);
  return lines;
}

function MetaBlock({
  titre,
  matiere,
  classe,
  annee,
  niveau,
  type,
  examen,
  etablissement,
  ville,
  meta,
}: {
  titre: string;
  matiere: string;
  classe: string;
  annee: number;
  niveau: string;
  type: string;
  examen?: string | null;
  etablissement?: string | null;
  ville: string;
  meta?: MetaNiveau | null;
}) {
  return (
    <div className="space-y-1 text-sm">
      <p className="font-display text-base font-bold leading-snug">{titre}</p>
      <p className="text-muted-foreground">
        {niveauLabel(niveau)} · {matiere} · {classe} · {annee}
        {examen ? ` · ${examen}` : ""}
      </p>
      <p className="text-xs text-muted-foreground capitalize">
        {type}
        {etablissement ? ` · ${etablissement}` : ""} · {ville}
      </p>
      {metaLines(meta).map((line) => (
        <p key={line} className="text-xs text-muted-foreground">{line}</p>
      ))}
    </div>
  );
}

export function SoumissionCompareSplit({
  soumission,
  existing,
  score,
  onClose,
  onValider,
  onRejeter,
  onRemplacer,
}: {
  soumission: Soumission;
  existing: Epreuve;
  score?: number;
  onClose: () => void;
  onValider: () => void;
  onRejeter: () => void;
  onRemplacer: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-background/95 backdrop-blur-sm">
      <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
        <div className="flex items-center gap-2">
          <Columns2 className="size-5 text-primary" />
          <h2 className="font-display text-lg font-bold">Comparaison</h2>
          {typeof score === "number" && (
            <Badge variant="outline">Similarité {score}%</Badge>
          )}
        </div>
        <Button variant="ghost" size="sm" onClick={onClose}>
          Fermer
        </Button>
      </div>

      <div className="grid min-h-0 flex-1 grid-cols-1 divide-y divide-border lg:grid-cols-2 lg:divide-x lg:divide-y-0">
        <section className="flex min-h-0 flex-col overflow-auto p-4">
          <div className="mb-3 flex items-center gap-2">
            <Badge className="border-0 bg-muted text-foreground">Existant</Badge>
            <span className="text-xs text-muted-foreground">Déjà en base</span>
          </div>
          <MetaBlock
            titre={existing.titre}
            matiere={existing.matiere}
            classe={existing.classe}
            annee={existing.annee}
            niveau={existing.niveau}
            type={existing.type}
            examen={existing.examen}
            etablissement={existing.etablissement}
            ville={existing.ville}
            meta={existing.metaNiveau}
          />
          <div className="mt-4 min-h-[320px] flex-1 overflow-hidden rounded-xl border border-border bg-muted/30">
            {existing.pdfPreviewUrl ? (
              <AuthenticatedPdf url={existing.pdfPreviewUrl} />
            ) : (
              <p className="grid h-full place-items-center text-sm text-muted-foreground">Aperçu indisponible</p>
            )}
          </div>
        </section>

        <section className="flex min-h-0 flex-col overflow-auto p-4">
          <div className="mb-3 flex items-center gap-2">
            <Badge className="border-0 bg-primary/15 text-primary">Soumission</Badge>
            <span className="text-xs text-muted-foreground">À valider</span>
          </div>
          <MetaBlock
            titre={soumission.titre}
            matiere={soumission.matiere}
            classe={soumission.classe}
            annee={soumission.annee}
            niveau={soumission.niveau}
            type={soumission.type}
            examen={soumission.examen}
            etablissement={soumission.etablissement}
            ville={soumission.ville}
            meta={soumission.metaNiveau}
          />
          <div className="mt-4 min-h-[320px] flex-1 overflow-hidden rounded-xl border border-border bg-muted/30">
            {soumission.pdfPreviewUrl ? (
              <AuthenticatedPdf url={soumission.pdfPreviewUrl} />
            ) : (
              <p className="grid h-full place-items-center text-sm text-muted-foreground">Aperçu indisponible</p>
            )}
          </div>
        </section>
      </div>

      <div className="flex flex-wrap items-center justify-end gap-2 border-t border-border px-4 py-3">
        <Button variant="outline" onClick={onRemplacer}>
          Remplacer l&apos;existant
        </Button>
        <Button variant="destructive" onClick={onRejeter}>
          <X className="size-4" /> Rejeter
        </Button>
        <Button onClick={onValider}>
          <Check className="size-4" /> Valider & publier
        </Button>
      </div>
    </div>
  );
}
