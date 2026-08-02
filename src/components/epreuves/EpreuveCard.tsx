import { Link } from "@tanstack/react-router";
import {
  Bookmark,
  ChevronDown,
  Download,
  Eye,
  FileText,
  FileType,
  Lock,
  MapPin,
  Share2,
} from "lucide-react";
import { toast } from "sonner";
import type { Epreuve } from "@/lib/types";
import { typeLabel, requiresPayment, formatFcfa, getPrixFcfa } from "@/lib/pricing";
import { shareEpreuve } from "@/lib/epreuve-share";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useFavoris } from "@/hooks/useFavoris";

const typeTone: Record<Epreuve["type"], string> = {
  devoir: "bg-secondary text-secondary-foreground",
  composition: "bg-accent/40 text-accent-foreground dark:bg-accent/30",
  examen: "bg-destructive/10 text-destructive",
  corrige: "bg-primary/10 text-primary",
};

function documentKindLabel(epreuve: Epreuve): string {
  if (epreuve.type === "corrige") return "Corrigé type";
  if (epreuve.niveau === "concours") return "Concours";
  if (epreuve.niveau === "universite") return "Université";
  if (epreuve.type === "examen" && epreuve.examen) return "Examen national";
  return "Sujet d'examen";
}

function niveauShort(niveau: Epreuve["niveau"]): string {
  const map = { college: "Collège", lycee: "Lycée", universite: "Université", concours: "Concours" } as const;
  return map[niveau] ?? niveau;
}

function secondaryLine(epreuve: Epreuve): string {
  if (epreuve.niveau === "concours") {
    const c = epreuve.metaNiveau?.concours ?? epreuve.classe;
    const ep = epreuve.metaNiveau?.nomEpreuve ?? epreuve.matiere;
    return `${c} · ${ep}`;
  }
  if (epreuve.niveau === "universite") {
    const f = epreuve.metaNiveau?.filiere;
    return [epreuve.matiere, epreuve.classe, f].filter(Boolean).join(" · ");
  }
  return `${epreuve.matiere} · ${epreuve.classe}`;
}

function lieuLine(epreuve: Epreuve): string {
  if (epreuve.niveau === "concours") {
    return epreuve.metaNiveau?.session
      ? `Session ${epreuve.metaNiveau.session}`
      : (epreuve.metaNiveau?.organisme ?? "Concours");
  }
  if (epreuve.niveau === "universite") {
    return epreuve.metaNiveau?.universite ?? epreuve.etablissement ?? "—";
  }
  return epreuve.etablissement ?? epreuve.examen ?? "—";
}

function formatTaille(ko: number): string {
  return `${Math.round(ko).toLocaleString("fr-FR")} Ko`;
}

export function EpreuveCard({
  epreuve,
  onPreview,
}: {
  epreuve: Epreuve;
  onPreview?: (e: Epreuve) => void;
}) {
  const { isFavorited, toggleFavori, isPending } = useFavoris();
  const favorited = isFavorited(epreuve.id);
  const lieu = lieuLine(epreuve);
  const taille = formatTaille(epreuve.tailleKo);

  async function handleShare() {
    try {
      const result = await shareEpreuve(epreuve);
      if (result === "copied") {
        toast.success("Lien copié");
      }
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
      toast.error("Impossible de partager cette épreuve");
    }
  }

  return (
    <article className="card-elevated group flex flex-col p-5">
      <div className="flex items-center justify-between gap-3">
        <span
          className={cn(
            "inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold",
            typeTone[epreuve.type],
          )}
        >
          {typeLabel(epreuve.type)}
        </span>
        <div className="flex items-center gap-1.5 text-muted-foreground">
          <FileType className="size-3.5 shrink-0" aria-hidden />
          <span className="text-xs font-medium tabular-nums">{epreuve.annee}</span>
        </div>
      </div>

      <div className="mt-4 space-y-2">
        <h3 className="font-display text-lg font-bold leading-tight">
          <Link
            to="/epreuves/$id"
            params={{ id: epreuve.id }}
            className="text-foreground transition-colors hover:text-primary"
          >
            {epreuve.titre}
          </Link>
        </h3>
        <p className="text-sm text-muted-foreground">
          {secondaryLine(epreuve)}
        </p>
        <p className="text-sm text-muted-foreground">
          {niveauShort(epreuve.niveau)} ·{" "}
          <span className="font-medium text-foreground">{documentKindLabel(epreuve)}</span>
        </p>
        <p className="flex items-start gap-1.5 text-sm text-muted-foreground">
          <MapPin className="mt-0.5 size-3.5 shrink-0" aria-hidden />
          <span>
            {epreuve.ville} · {lieu}
          </span>
        </p>
      </div>

      <hr className="my-4 border-border" />

      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-0.5">
          <p className="inline-flex items-center gap-1.5 text-sm font-medium text-foreground">
            <FileText className="size-3.5 text-muted-foreground" aria-hidden />
            {epreuve.pages} p · {taille}
          </p>
          <p className="text-xs text-muted-foreground">Taille : {taille}</p>
        </div>

        <div className="flex flex-wrap items-center justify-end gap-2">
          {requiresPayment(epreuve) && (
            <span className="inline-flex w-full items-center justify-center gap-1 rounded-full border border-amber-500/40 bg-amber-500/10 px-2.5 py-1 text-xs font-medium text-amber-700 sm:mr-auto sm:w-auto dark:text-amber-400">
              <Lock className="size-3" aria-hidden />
              {formatFcfa(getPrixFcfa(epreuve))}
            </span>
          )}
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="rounded-full"
            onClick={() => onPreview?.(epreuve)}
          >
            <Eye className="size-3.5" />
            Aperçu
          </Button>
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="size-9 shrink-0 rounded-full"
            aria-label="Partager"
            onClick={handleShare}
          >
            <Share2 className="size-4" />
          </Button>
          <Button asChild size="sm" className="rounded-lg">
            <Link to="/epreuves/$id" params={{ id: epreuve.id }}>
              <Download className="size-3.5" />
              Télécharger
              <ChevronDown className="size-3.5 opacity-70" aria-hidden />
            </Link>
          </Button>
          <Button
            type="button"
            variant="outline"
            size="icon"
            className={cn(
              "size-9 shrink-0 rounded-full",
              favorited && "border-primary/40 text-primary",
            )}
            aria-label={favorited ? "Retirer des favoris" : "Ajouter aux favoris"}
            aria-pressed={favorited}
            disabled={isPending}
            onClick={() => toggleFavori(epreuve.id)}
          >
            <Bookmark className={cn("size-4", favorited && "fill-current")} />
          </Button>
        </div>
      </div>
    </article>
  );
}
