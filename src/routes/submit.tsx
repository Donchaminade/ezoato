import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Upload, X } from "lucide-react";
import { toast } from "sonner";
import { PageHero } from "@/components/layout/PageHero";
import { PageHeroBadge } from "@/components/layout/PageHeroBadge";
import { PublicLayout } from "@/components/layout/PublicLayout";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formInputClass, formSelectClass } from "@/lib/form-styles";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/lib/auth";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { CityInput } from "@/components/forms/CityInput";
import type { ExamenNational, Periode } from "@/lib/types";

export const Route = createFileRoute("/submit")({
  head: () => ({ meta: [{ title: "Soumettre une épreuve — EZOA-TO" }] }),
  component: SubmitPage,
});

const MATIERE_AUTRE = "__autre__";

function isPdfFile(file: File): boolean {
  return file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
}

function SubmitPage() {
  const { user } = useAuth();
  const nav = useNavigate();
  const [files, setFiles] = useState<File[]>([]);
  const [titre, setTitre] = useState("");
  const [matiereChoice, setMatiereChoice] = useState("");
  const [matiereAutre, setMatiereAutre] = useState("");
  const [annee, setAnnee] = useState(String(new Date().getFullYear()));
  const [niveau, setNiveau] = useState<"college" | "lycee">("lycee");
  const [classe, setClasse] = useState("");
  const [type, setType] = useState<"devoir" | "composition" | "examen">("composition");
  const [etablissement, setEtablissement] = useState("");
  const [periode, setPeriode] = useState<Periode | "">("");
  const [examen, setExamen] = useState<ExamenNational | "">("");
  const [ville, setVille] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { data: meta } = useQuery({
    queryKey: ["meta"],
    queryFn: () => api.getMeta(),
  });
  const VILLES = meta?.villes ?? [];
  const MATIERES = meta?.matieres ?? [];
  const CLASSES_COLLEGE = meta?.classes?.college ?? ["6e", "5e", "4e", "3e"];
  const CLASSES_LYCEE = meta?.classes?.lycee ?? [
    "2nde A", "2nde C", "1ère A", "1ère C", "1ère D", "Tle A1", "Tle A2", "Tle C", "Tle D",
    "2nde E", "1ère E", "Tle E",
    "2nde F1", "1ère F1", "Tle F1",
    "2nde F2", "1ère F2", "Tle F2",
    "2nde F3", "1ère F3", "Tle F3",
    "2nde F4", "1ère F4", "Tle F4",
    "2nde H", "1ère H", "Tle H",
    "2nde TI", "1ère TI", "Tle TI",
    "2nde G1", "1ère G1", "Tle G1",
    "2nde G2", "1ère G2", "Tle G2",
    "2nde G3", "1ère G3", "Tle G3",
  ];
  const etablissementSuggestions = [
    ...new Set((meta?.etablissements ?? []).map((e) => e.nom).filter(Boolean)),
  ];
  const matiereEffective =
    matiereChoice === MATIERE_AUTRE ? matiereAutre.trim() : matiereChoice;
  const pdfFile = files.length === 1 && isPdfFile(files[0]) ? files[0] : null;
  const imageFiles = pdfFile ? [] : files;

  if (!user) {
    return (
      <PublicLayout>
        <PageHero
          badge={<PageHeroBadge icon={Upload}>Contribution</PageHeroBadge>}
          title="Soumettre une épreuve"
          description="Crée un compte gratuit pour partager des épreuves et aider toute la communauté scolaire togolaise."
          primaryImage="group"
        >
          <div className="flex flex-wrap justify-center gap-3">
            <Button asChild size="lg" className="tea-hero-auth-primary h-12 min-h-12 rounded-xl px-8 text-base font-semibold">
              <Link to="/auth/login">Connexion</Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="tea-hero-auth-light h-12 min-h-12 rounded-xl px-8 text-base font-semibold"
            >
              <Link to="/auth/register">Créer un compte</Link>
            </Button>
          </div>
        </PageHero>
      </PublicLayout>
    );
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (files.length === 0) return toast.error("Ajoute au moins une image ou un fichier PDF.");
    if (files.some(isPdfFile) && files.length > 1) {
      return toast.error("Un seul fichier PDF à la fois.");
    }
    if (!matiereEffective || !classe || !ville) return toast.error("Remplis tous les champs obligatoires.");
    if (matiereChoice === MATIERE_AUTRE && matiereAutre.trim().length < 2) {
      return toast.error("Précise la matière (2 caractères minimum).");
    }
    if (type !== "examen" && (!etablissement.trim() || !periode)) {
      return toast.error("Établissement et période requis pour ce type.");
    }
    if (type === "examen" && !examen) return toast.error("Choisis l'examen national.");

    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append("titre", titre);
      fd.append("matiere", matiereEffective);
      fd.append("annee", annee);
      fd.append("niveau", niveau);
      fd.append("classe", classe);
      fd.append("type", type);
      fd.append("ville", ville);
      if (type !== "examen") {
        fd.append("etablissement", etablissement.trim());
        fd.append("periode", periode);
      } else {
        fd.append("examen", examen);
      }
      if (pdfFile) {
        fd.append("pdf", pdfFile);
      } else {
        imageFiles.forEach((f) => fd.append("images[]", f));
      }
      await api.submitEpreuve(fd);
      toast.success(
        pdfFile
          ? "Soumission envoyée. Ton PDF a été enregistré pour validation."
          : "Soumission envoyée. Un PDF A4 a été généré pour validation.",
      );
      nav({ to: "/account/soumissions" });
    } catch {
      toast.error("Échec de la soumission.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <PublicLayout>
      <PageHero
        badge={<PageHeroBadge icon={Upload}>Contribution</PageHeroBadge>}
        title="Soumettre une épreuve"
        description="Photographie chaque page ou importe un PDF existant. Plusieurs images = plusieurs pages. Les photos sont converties en PDF A4 centré (image entière, sans rognage)."
        primaryImage="group"
        compact
      />

      <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6 sm:py-12">
        <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 text-sm">
          <p className="font-semibold text-primary">Programme récompense contributeur</p>
          <p className="mt-1 text-muted-foreground">
            Chaque palier de <strong>{meta?.pricing.epreuvesParRecompense ?? 50} épreuves validées</strong> te rapporte{" "}
            <strong>{meta?.pricing.montantRecompense?.toLocaleString("fr-FR") ?? "1 000"} FCFA</strong> sur ton portefeuille EZOA-TO.
            Retrait possible dès <strong>{meta?.pricing.minRetrait?.toLocaleString("fr-FR") ?? "2 000"} FCFA</strong>.
          </p>
          <Button asChild variant="link" size="sm" className="mt-1 h-auto p-0">
            <Link to="/account/portefeuille">Voir mon portefeuille →</Link>
          </Button>
        </div>

        <form onSubmit={onSubmit} className="mt-8 space-y-6 rounded-2xl border border-border bg-card p-6 sm:p-8">
          <div>
            <Label>Fichiers de l&apos;épreuve</Label>
            <label className="mt-1.5 grid cursor-pointer place-items-center rounded-xl border-2 border-dashed border-border bg-background px-4 py-10 text-center hover:border-primary/40">
              <Upload className="size-6 text-muted-foreground" />
              <span className="mt-2 text-sm font-medium">Ajouter des images (JPG, PNG, WebP) ou un PDF</span>
              <span className="text-xs text-muted-foreground">
                {pdfFile
                  ? "PDF sélectionné — remplace-le pour en choisir un autre"
                  : "Images : 1 fichier = 1 page · PDF : 1 fichier max · pas de mélange"}
              </span>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp,application/pdf,.pdf"
                multiple={!pdfFile}
                className="hidden"
                onChange={(e) => {
                  const picked = Array.from(e.target.files ?? []);
                  e.target.value = "";
                  if (picked.length === 0) return;
                  const pdfs = picked.filter(isPdfFile);
                  const imgs = picked.filter((f) => !isPdfFile(f));
                  if (pdfs.length > 0 && imgs.length > 0) {
                    toast.error("Envoie soit un PDF, soit des images, pas les deux.");
                    return;
                  }
                  if (pdfs.length > 1) {
                    toast.error("Un seul fichier PDF à la fois.");
                    return;
                  }
                  if (pdfs.length === 1) {
                    setFiles([pdfs[0]]);
                    return;
                  }
                  setFiles([...files, ...imgs]);
                }}
              />
            </label>
            {files.length > 0 && (
              <ul className="mt-3 space-y-1.5">
                {files.map((f, i) => (
                  <li key={`${f.name}-${i}`} className="flex items-center justify-between rounded-md border border-border bg-background px-3 py-2 text-xs">
                    <span className="truncate">
                      {pdfFile ? "PDF" : `Page ${i + 1}`} — {f.name}
                    </span>
                    <button type="button" aria-label={`Retirer ${f.name}`} title={`Retirer ${f.name}`} onClick={() => setFiles(files.filter((_, j) => j !== i))}>
                      <X className="size-4 text-muted-foreground hover:text-destructive" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <FormField label="Titre" htmlFor="titre">
              <Input id="titre" className={formInputClass} required placeholder="Ex: Composition de Maths" value={titre} onChange={(e) => setTitre(e.target.value)} />
            </FormField>
            <FormField label="Matière" className={matiereChoice === MATIERE_AUTRE ? "sm:col-span-2" : undefined}>
              <Select
                value={matiereChoice}
                onValueChange={setMatiereChoice}
                required={matiereChoice !== MATIERE_AUTRE}
              >
                <SelectTrigger className={formSelectClass}><SelectValue placeholder="Choisir" /></SelectTrigger>
                <SelectContent>
                  {MATIERES.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                  <SelectItem value={MATIERE_AUTRE}>Autre (saisir)</SelectItem>
                </SelectContent>
              </Select>
              {matiereChoice === MATIERE_AUTRE && (
                <Input
                  className={`${formInputClass} mt-2`}
                  value={matiereAutre}
                  onChange={(e) => setMatiereAutre(e.target.value)}
                  placeholder="Ex. Informatique, Arts plastiques…"
                  required
                  minLength={2}
                />
              )}
            </FormField>
            <FormField label="Année" htmlFor="annee">
              <Input id="annee" className={formInputClass} type="number" min={2000} max={2030} required value={annee} onChange={(e) => setAnnee(e.target.value)} />
            </FormField>
            <FormField label="Niveau">
              <Select value={niveau} onValueChange={(v) => { setNiveau(v as "college" | "lycee"); setClasse(""); }}>
                <SelectTrigger className={formSelectClass}><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="college">Collège</SelectItem>
                  <SelectItem value="lycee">Lycée</SelectItem>
                </SelectContent>
              </Select>
            </FormField>
            <FormField label="Classe">
              <Select value={classe} onValueChange={setClasse} required>
                <SelectTrigger className={formSelectClass}><SelectValue placeholder="Classe" /></SelectTrigger>
                <SelectContent>
                  {(niveau === "college" ? CLASSES_COLLEGE : CLASSES_LYCEE).map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>
            <FormField label="Type">
              <Select value={type} onValueChange={(v) => setType(v as typeof type)}>
                <SelectTrigger className={formSelectClass}><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="devoir">Devoir</SelectItem>
                  <SelectItem value="composition">Composition</SelectItem>
                  <SelectItem value="examen">Examen national</SelectItem>
                </SelectContent>
              </Select>
            </FormField>

            {type !== "examen" && (
              <>
                <FormField label="Établissement" className="sm:col-span-2">
                  <Input
                    id="submit-etablissement"
                    list="submit-etablissements"
                    className={formInputClass}
                    value={etablissement}
                    onChange={(e) => setEtablissement(e.target.value)}
                    placeholder="Ex. Collège Saint-Joseph, Lycée 2 Février…"
                    required
                    autoComplete="organization"
                  />
                  {etablissementSuggestions.length > 0 && (
                    <datalist id="submit-etablissements">
                      {etablissementSuggestions.map((e) => (
                        <option key={e} value={e} />
                      ))}
                    </datalist>
                  )}
                  <p className="mt-1 text-xs text-muted-foreground">
                    Saisie libre — un gestionnaire pourra corriger le nom à la validation.
                  </p>
                </FormField>
                <FormField label={niveau === "lycee" ? "Semestre" : "Trimestre"} className="sm:col-span-2">
                  <Select value={periode} onValueChange={(v) => setPeriode(v as Periode)} required>
                    <SelectTrigger className={formSelectClass}><SelectValue placeholder="Choisir" /></SelectTrigger>
                    <SelectContent>
                      {niveau === "lycee"
                        ? [{ v: "S1", l: "Semestre 1" }, { v: "S2", l: "Semestre 2" }].map((p) => <SelectItem key={p.v} value={p.v}>{p.l}</SelectItem>)
                        : [{ v: "T1", l: "Trimestre 1" }, { v: "T2", l: "Trimestre 2" }, { v: "T3", l: "Trimestre 3" }].map((p) => <SelectItem key={p.v} value={p.v}>{p.l}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </FormField>
              </>
            )}

            {type === "examen" && (
              <FormField label="Examen national" className="sm:col-span-2">
                <Select value={examen} onValueChange={(v) => setExamen(v as ExamenNational)} required>
                  <SelectTrigger className={formSelectClass}><SelectValue placeholder="Choisir" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CEPD">CEPD</SelectItem>
                    <SelectItem value="BEPC">BEPC</SelectItem>
                    <SelectItem value="BAC1">BAC I</SelectItem>
                    <SelectItem value="BAC2">BAC II</SelectItem>
                  </SelectContent>
                </Select>
              </FormField>
            )}

            <FormField label="Ville" className="sm:col-span-2">
              <CityInput
                id="submit-ville"
                listId="submit-villes"
                value={ville}
                onChange={setVille}
                suggestions={VILLES}
                required
                className={formInputClass}
                placeholder="Ex. Lomé, Kara, Sokodé…"
              />
              <p className="mt-1 text-xs text-muted-foreground">
                Saisie libre — un gestionnaire pourra corriger l&apos;orthographe à la validation.
              </p>
            </FormField>
          </div>

          <Button type="submit" size="lg" className="h-12 w-full rounded-xl text-base" disabled={submitting}>
            {submitting
              ? pdfFile ? "Envoi du PDF…" : "Conversion en PDF…"
              : pdfFile
                ? "Envoyer le PDF"
                : `Envoyer ${files.length || ""} page${files.length > 1 ? "s" : ""}`}
          </Button>
        </form>
      </div>
    </PublicLayout>
  );
}
