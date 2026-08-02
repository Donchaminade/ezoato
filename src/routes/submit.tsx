import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { GraduationCap, Landmark, School, Trophy, Upload, X } from "lucide-react";
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
import type { ExamenNational, Niveau, Periode } from "@/lib/types";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/submit")({
  head: () => ({ meta: [{ title: "Soumettre une épreuve — EZOA-TO" }] }),
  component: SubmitPage,
});

const MATIERE_AUTRE = "__autre__";

const NIVEAU_CARDS: {
  id: Niveau;
  label: string;
  description: string;
  icon: typeof School;
}[] = [
  { id: "college", label: "Collège", description: "6e à 3e · CEPD / BEPC", icon: School },
  { id: "lycee", label: "Lycée", description: "2nde à Tle · BAC I / II", icon: GraduationCap },
  { id: "universite", label: "Université", description: "L1–M2 · filières", icon: Landmark },
  { id: "concours", label: "Concours", description: "ENAM, Police, Douanes…", icon: Trophy },
];

function isPdfFile(file: File): boolean {
  return file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
}

function SubmitPage() {
  const { user } = useAuth();
  const nav = useNavigate();
  const [step, setStep] = useState<1 | 2>(1);
  const [files, setFiles] = useState<File[]>([]);
  const [titre, setTitre] = useState("");
  const [matiereChoice, setMatiereChoice] = useState("");
  const [matiereAutre, setMatiereAutre] = useState("");
  const [annee, setAnnee] = useState(String(new Date().getFullYear()));
  const [niveau, setNiveau] = useState<Niveau | "">("");
  const [classe, setClasse] = useState("");
  const [type, setType] = useState<"devoir" | "composition" | "examen">("composition");
  const [etablissement, setEtablissement] = useState("");
  const [periode, setPeriode] = useState<Periode | "">("");
  const [examen, setExamen] = useState<ExamenNational | "">("");
  const [ville, setVille] = useState("");
  // Université
  const [filiere, setFiliere] = useState("");
  const [anneeEtude, setAnneeEtude] = useState("");
  const [universite, setUniversite] = useState("");
  const [sessionUniv, setSessionUniv] = useState("");
  // Concours
  const [concours, setConcours] = useState("");
  const [sessionConcours, setSessionConcours] = useState(String(new Date().getFullYear()));
  const [nomEpreuve, setNomEpreuve] = useState("");
  const [organisme, setOrganisme] = useState("");
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
  ];
  const FILIERES = meta?.filieres ?? ["Droit", "Économie", "Gestion", "Informatique", "Autre filière"];
  const ANNEES_ETUDE = meta?.anneesEtude ?? meta?.classes?.universite ?? ["L1", "L2", "L3", "M1", "M2", "Doctorat"];
  const CONCOURS_LIST = meta?.concours ?? ["ENAM", "Police nationale", "Autre concours"];
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

  function pickNiveau(n: Niveau) {
    setNiveau(n);
    setClasse("");
    setType(n === "concours" ? "examen" : "composition");
    setExamen("");
    setPeriode("");
    setStep(2);
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!niveau) return toast.error("Choisis un niveau.");
    if (files.length === 0) return toast.error("Ajoute au moins une image ou un fichier PDF.");
    if (files.some(isPdfFile) && files.length > 1) {
      return toast.error("Un seul fichier PDF à la fois.");
    }

    if (niveau === "college" || niveau === "lycee") {
      if (!matiereEffective || !classe || !ville) return toast.error("Remplis tous les champs obligatoires.");
      if (matiereChoice === MATIERE_AUTRE && matiereAutre.trim().length < 2) {
        return toast.error("Précise la matière (2 caractères minimum).");
      }
      if (type !== "examen" && !periode) {
        return toast.error("Période requise pour ce type.");
      }
      if (type === "devoir" && !etablissement.trim()) {
        return toast.error("Établissement requis pour un devoir.");
      }
      if (type === "examen" && !examen) return toast.error("Choisis l'examen national.");
    } else if (niveau === "universite") {
      if (!titre.trim() || !matiereEffective || !filiere || !anneeEtude || !universite.trim() || !ville) {
        return toast.error("Remplis tous les champs universitaires obligatoires.");
      }
    } else if (niveau === "concours") {
      if (!concours || !sessionConcours.trim() || !nomEpreuve.trim()) {
        return toast.error("Concours, session et nom de l'épreuve sont requis.");
      }
    }

    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append("niveau", niveau);
      fd.append("annee", annee);
      fd.append("ville", ville || (niveau === "concours" ? "Togo" : ""));

      if (niveau === "college" || niveau === "lycee") {
        fd.append("titre", titre);
        fd.append("matiere", matiereEffective);
        fd.append("classe", classe);
        fd.append("type", type);
        if (type !== "examen") {
          if (etablissement.trim()) fd.append("etablissement", etablissement.trim());
          fd.append("periode", periode);
        } else {
          fd.append("examen", examen);
        }
      } else if (niveau === "universite") {
        fd.append("titre", titre);
        fd.append("matiere", matiereEffective);
        fd.append("type", type);
        fd.append("filiere", filiere);
        fd.append("anneeEtude", anneeEtude);
        fd.append("universite", universite.trim());
        if (sessionUniv) fd.append("session", sessionUniv);
        fd.append(
          "meta_niveau",
          JSON.stringify({
            filiere,
            anneeEtude,
            universite: universite.trim(),
            session: sessionUniv || undefined,
          }),
        );
      } else {
        fd.append("titre", titre.trim() || nomEpreuve.trim());
        fd.append("matiere", matiereEffective || nomEpreuve.trim());
        fd.append("concours", concours);
        fd.append("session", sessionConcours.trim());
        fd.append("nomEpreuve", nomEpreuve.trim());
        if (organisme.trim()) fd.append("organisme", organisme.trim());
        fd.append(
          "meta_niveau",
          JSON.stringify({
            concours,
            session: sessionConcours.trim(),
            nomEpreuve: nomEpreuve.trim(),
            organisme: organisme.trim() || undefined,
          }),
        );
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
        description="Choisis le niveau, puis renseigne les champs adaptés. Les photos sont converties en PDF A4 pour validation."
        primaryImage="group"
        compact
      />

      <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6 sm:py-12">
        <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 text-sm">
          <p className="font-semibold text-primary">Programme récompense contributeur</p>
          <p className="mt-1 text-muted-foreground">
            Chaque palier de <strong>{meta?.pricing.epreuvesParRecompense ?? 50} épreuves validées</strong> te rapporte{" "}
            <strong>{meta?.pricing.montantRecompense?.toLocaleString("fr-FR") ?? "1 000"} FCFA</strong> sur ton portefeuille EZOA-TO.
          </p>
        </div>

        {step === 1 && (
          <div className="mt-8 space-y-4">
            <h2 className="font-display text-xl font-bold">1. Choisis le niveau</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {NIVEAU_CARDS.map((card) => {
                const Icon = card.icon;
                return (
                  <button
                    key={card.id}
                    type="button"
                    onClick={() => pickNiveau(card.id)}
                    className={cn(
                      "flex items-start gap-3 rounded-2xl border border-border bg-card p-4 text-left transition-colors",
                      "hover:border-primary/40 hover:bg-primary/5",
                    )}
                  >
                    <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
                      <Icon className="size-5" />
                    </span>
                    <span>
                      <span className="block font-semibold">{card.label}</span>
                      <span className="mt-0.5 block text-sm text-muted-foreground">{card.description}</span>
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {step === 2 && niveau && (
          <form onSubmit={onSubmit} className="mt-8 space-y-6 rounded-2xl border border-border bg-card p-6 sm:p-8">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Étape 2</p>
                <h2 className="font-display text-xl font-bold">
                  {NIVEAU_CARDS.find((c) => c.id === niveau)?.label}
                </h2>
              </div>
              <Button type="button" variant="ghost" size="sm" onClick={() => setStep(1)}>
                Changer de niveau
              </Button>
            </div>

            <div>
              <Label>Fichiers de l&apos;épreuve</Label>
              <label className="mt-1.5 grid cursor-pointer place-items-center rounded-xl border-2 border-dashed border-border bg-background px-4 py-10 text-center hover:border-primary/40">
                <Upload className="size-6 text-muted-foreground" />
                <span className="mt-2 text-sm font-medium">Ajouter des images (JPG, PNG, WebP) ou un PDF</span>
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
                      <button type="button" aria-label={`Retirer ${f.name}`} onClick={() => setFiles(files.filter((_, j) => j !== i))}>
                        <X className="size-4 text-muted-foreground hover:text-destructive" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              {(niveau === "college" || niveau === "lycee") && (
                <>
                  <FormField label="Titre" htmlFor="titre">
                    <Input id="titre" className={formInputClass} required placeholder="Ex: Composition de Maths" value={titre} onChange={(e) => setTitre(e.target.value)} />
                  </FormField>
                  <FormField label="Matière" className={matiereChoice === MATIERE_AUTRE ? "sm:col-span-2" : undefined}>
                    <Select value={matiereChoice} onValueChange={setMatiereChoice}>
                      <SelectTrigger className={formSelectClass}><SelectValue placeholder="Choisir" /></SelectTrigger>
                      <SelectContent>
                        {MATIERES.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                        <SelectItem value={MATIERE_AUTRE}>Autre (saisir)</SelectItem>
                      </SelectContent>
                    </Select>
                    {matiereChoice === MATIERE_AUTRE && (
                      <Input className={`${formInputClass} mt-2`} value={matiereAutre} onChange={(e) => setMatiereAutre(e.target.value)} placeholder="Ex. Informatique…" required minLength={2} />
                    )}
                  </FormField>
                  <FormField label="Année" htmlFor="annee">
                    <Input id="annee" className={formInputClass} type="number" min={2000} max={2035} required value={annee} onChange={(e) => setAnnee(e.target.value)} />
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
                    <Select
                      value={type}
                      onValueChange={(v) => {
                        const next = v as typeof type;
                        setType(next);
                        if (next !== "devoir") setEtablissement("");
                        if (next !== "examen") setExamen("");
                      }}
                    >
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
                      {type === "devoir" && (
                        <FormField label="Établissement" className="sm:col-span-2">
                          <Input list="submit-etablissements" className={formInputClass} value={etablissement} onChange={(e) => setEtablissement(e.target.value)} required />
                          {etablissementSuggestions.length > 0 && (
                            <datalist id="submit-etablissements">
                              {etablissementSuggestions.map((e) => <option key={e} value={e} />)}
                            </datalist>
                          )}
                        </FormField>
                      )}
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
                </>
              )}

              {niveau === "universite" && (
                <>
                  <FormField label="Titre" htmlFor="titre-univ" className="sm:col-span-2">
                    <Input id="titre-univ" className={formInputClass} required placeholder="Ex: Examen de Droit civil" value={titre} onChange={(e) => setTitre(e.target.value)} />
                  </FormField>
                  <FormField label="Filière">
                    <Select value={filiere} onValueChange={setFiliere} required>
                      <SelectTrigger className={formSelectClass}><SelectValue placeholder="Choisir" /></SelectTrigger>
                      <SelectContent>
                        {FILIERES.map((f) => <SelectItem key={f} value={f}>{f}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </FormField>
                  <FormField label="Année d'études">
                    <Select value={anneeEtude} onValueChange={setAnneeEtude} required>
                      <SelectTrigger className={formSelectClass}><SelectValue placeholder="L1…" /></SelectTrigger>
                      <SelectContent>
                        {ANNEES_ETUDE.map((a) => <SelectItem key={a} value={a}>{a}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </FormField>
                  <FormField label="Matière / module" className="sm:col-span-2">
                    <Select value={matiereChoice} onValueChange={setMatiereChoice}>
                      <SelectTrigger className={formSelectClass}><SelectValue placeholder="Choisir ou Autre" /></SelectTrigger>
                      <SelectContent>
                        {MATIERES.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                        <SelectItem value={MATIERE_AUTRE}>Autre (saisir)</SelectItem>
                      </SelectContent>
                    </Select>
                    {matiereChoice === MATIERE_AUTRE && (
                      <Input className={`${formInputClass} mt-2`} value={matiereAutre} onChange={(e) => setMatiereAutre(e.target.value)} required minLength={2} />
                    )}
                  </FormField>
                  <FormField label="Université / établissement" className="sm:col-span-2">
                    <Input className={formInputClass} required value={universite} onChange={(e) => setUniversite(e.target.value)} placeholder="Ex. Université de Lomé" />
                  </FormField>
                  <FormField label="Année civile">
                    <Input className={formInputClass} type="number" min={2000} max={2035} required value={annee} onChange={(e) => setAnnee(e.target.value)} />
                  </FormField>
                  <FormField label="Session / semestre">
                    <Input className={formInputClass} value={sessionUniv} onChange={(e) => setSessionUniv(e.target.value)} placeholder="Ex. S1, session juin…" />
                  </FormField>
                  <FormField label="Type">
                    <Select value={type} onValueChange={(v) => setType(v as typeof type)}>
                      <SelectTrigger className={formSelectClass}><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="devoir">Devoir</SelectItem>
                        <SelectItem value="composition">Composition</SelectItem>
                        <SelectItem value="examen">Examen</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormField>
                </>
              )}

              {niveau === "concours" && (
                <>
                  <FormField label="Nom du concours" className="sm:col-span-2">
                    <Select value={concours} onValueChange={setConcours} required>
                      <SelectTrigger className={formSelectClass}><SelectValue placeholder="ENAM, Police…" /></SelectTrigger>
                      <SelectContent>
                        {CONCOURS_LIST.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </FormField>
                  <FormField label="Année / session">
                    <Input className={formInputClass} required value={sessionConcours} onChange={(e) => setSessionConcours(e.target.value)} placeholder="2024" />
                  </FormField>
                  <FormField label="Année (catalogue)">
                    <Input className={formInputClass} type="number" min={2000} max={2035} required value={annee} onChange={(e) => setAnnee(e.target.value)} />
                  </FormField>
                  <FormField label="Nom de l'épreuve" className="sm:col-span-2">
                    <Input className={formInputClass} required value={nomEpreuve} onChange={(e) => setNomEpreuve(e.target.value)} placeholder="Ex. Culture générale" />
                  </FormField>
                  <FormField label="Titre (optionnel)" className="sm:col-span-2">
                    <Input className={formInputClass} value={titre} onChange={(e) => setTitre(e.target.value)} placeholder="Laisse vide pour utiliser le nom de l'épreuve" />
                  </FormField>
                  <FormField label="Matière (optionnel)">
                    <Input className={formInputClass} value={matiereChoice === MATIERE_AUTRE ? matiereAutre : matiereChoice} onChange={(e) => { setMatiereChoice(MATIERE_AUTRE); setMatiereAutre(e.target.value); }} placeholder="Si différente du nom d'épreuve" />
                  </FormField>
                  <FormField label="Organisme (optionnel)">
                    <Input className={formInputClass} value={organisme} onChange={(e) => setOrganisme(e.target.value)} />
                  </FormField>
                </>
              )}

              <FormField label="Ville" className="sm:col-span-2">
                <CityInput
                  id="submit-ville"
                  listId="submit-villes"
                  value={ville}
                  onChange={setVille}
                  suggestions={VILLES}
                  required={niveau !== "concours"}
                  className={formInputClass}
                  placeholder={niveau === "concours" ? "Togo (défaut) ou ville du centre…" : "Ex. Lomé, Kara…"}
                />
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
        )}
      </div>
    </PublicLayout>
  );
}
