import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { GraduationCap, Loader2, Plus, Trash2, BookOpen, MapPin } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { DashboardSectionCard } from "@/components/dashboard/DashboardSectionCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { api } from "@/lib/api";
import type { Niveau, ReferentielItem } from "@/lib/types";

function ReferentielList({
  items,
  onRemove,
  removing,
}: {
  items: ReferentielItem[];
  onRemove: (item: ReferentielItem) => void;
  removing?: string | null;
}) {
  if (!items.length) {
    return <p className="text-sm text-muted-foreground">Aucune entrée pour l&apos;instant.</p>;
  }
  return (
    <ul className="flex flex-wrap gap-2">
      {items.map((item) => (
        <li
          key={item.key}
          className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-muted/30 px-2.5 py-1.5 text-sm"
        >
          <span>{item.label}</span>
          <button
            type="button"
            className="rounded p-0.5 text-muted-foreground transition hover:bg-destructive/10 hover:text-destructive"
            title="Supprimer"
            disabled={removing === item.key}
            onClick={() => onRemove(item)}
          >
            {removing === item.key ? <Loader2 className="size-3.5 animate-spin" /> : <Trash2 className="size-3.5" />}
          </button>
        </li>
      ))}
    </ul>
  );
}

export function AdminReferentielsSection() {
  const qc = useQueryClient();
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["admin-referentiels"],
    queryFn: () => api.getAdminReferentiels(),
  });

  const [classeNom, setClasseNom] = useState("");
  const [classeNiveau, setClasseNiveau] = useState<Niveau>("college");
  const [matiereNom, setMatiereNom] = useState("");
  const [villeNom, setVilleNom] = useState("");
  const [removingKey, setRemovingKey] = useState<string | null>(null);

  const mutate = useMutation({
    mutationFn: api.updateAdminReferentiel,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-referentiels"] });
      qc.invalidateQueries({ queryKey: ["meta"] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Échec"),
  });

  async function run(
    payload: Parameters<typeof api.updateAdminReferentiel>[0],
    successMsg: string,
    clear?: () => void,
  ) {
    try {
      await mutate.mutateAsync(payload);
      toast.success(successMsg);
      clear?.();
    } catch {
      /* toast via onError */
    }
  }

  async function removeItem(
    payload: Parameters<typeof api.updateAdminReferentiel>[0],
    key: string,
  ) {
    setRemovingKey(key);
    try {
      await mutate.mutateAsync(payload);
      toast.success("Entrée supprimée");
      qc.invalidateQueries({ queryKey: ["admin-referentiels"] });
      qc.invalidateQueries({ queryKey: ["meta"] });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Échec");
    } finally {
      setRemovingKey(null);
    }
  }

  if (isLoading) {
    return <div className="h-40 animate-pulse rounded-xl bg-muted" />;
  }

  if (isError) {
    return (
      <div className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
        Impossible de charger les référentiels : {error instanceof Error ? error.message : "erreur inconnue"}
      </div>
    );
  }

  const classes = data?.classes ?? { college: [], lycee: [] };

  return (
    <div className="space-y-6">
      {data && !data.dbReady && (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-900 dark:text-amber-200">
          Exécutez <code className="text-xs">migration-classes.sql</code> pour activer la gestion des classes en base.
        </div>
      )}

      <DashboardSectionCard
        title="Classes"
        subtitle="Listes proposées aux contributeurs (soumission d'épreuve)"
      >
        <Tabs
          value={classeNiveau}
          onValueChange={(v) => setClasseNiveau(v as Niveau)}
        >
          <TabsList className="mb-4 grid w-full max-w-xs grid-cols-2">
            <TabsTrigger value="college">Collège ({classes.college.length})</TabsTrigger>
            <TabsTrigger value="lycee">Lycée ({classes.lycee.length})</TabsTrigger>
          </TabsList>
          {(["college", "lycee"] as const).map((niv) => (
            <TabsContent key={niv} value={niv} className="space-y-4">
              <ReferentielList
                items={classes[niv]}
                removing={removingKey?.startsWith(`${niv}-`) ? removingKey.slice(niv.length + 1) : null}
                onRemove={(item) =>
                  removeItem({ op: "remove", type: "classe", nom: item.key, niveau: niv }, `${niv}-${item.key}`)
                }
              />
              <div className="flex flex-wrap items-end gap-2">
                <div className="min-w-[12rem] flex-1 space-y-1.5">
                  <Label htmlFor={`classe-${niv}`}>Nouvelle classe</Label>
                  <Input
                    id={`classe-${niv}`}
                    value={classeNiveau === niv ? classeNom : ""}
                    onChange={(e) => {
                      setClasseNiveau(niv);
                      setClasseNom(e.target.value);
                    }}
                    placeholder={niv === "college" ? "Ex. 3e" : "Ex. 1ère C"}
                  />
                </div>
                <Button
                  type="button"
                  className="rounded-xl"
                  disabled={!classeNom.trim() || classeNiveau !== niv || mutate.isPending}
                  onClick={() =>
                    run(
                      { op: "add", type: "classe", nom: classeNom.trim(), niveau: niv },
                      "Classe ajoutée",
                      () => setClasseNom(""),
                    )
                  }
                >
                  <Plus className="size-4" /> Ajouter
                </Button>
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </DashboardSectionCard>

      <div className="grid gap-6 lg:grid-cols-2">
        <DashboardSectionCard title="Matières" subtitle="Liste du formulaire de soumission">
          <div className="mb-4 flex items-center gap-2 text-muted-foreground">
            <BookOpen className="size-4 text-primary" />
            <span className="text-xs">{data?.matieres.length ?? 0} matière(s)</span>
          </div>
          <ReferentielList
            items={data?.matieres ?? []}
            removing={removingKey?.startsWith("matiere-") ? removingKey.slice(8) : null}
            onRemove={(item) =>
              removeItem({ op: "remove", type: "matiere", nom: item.key }, `matiere-${item.key}`)
            }
          />
          <div className="mt-4 flex flex-wrap items-end gap-2">
            <div className="min-w-[12rem] flex-1 space-y-1.5">
              <Label htmlFor="matiere-add">Nouvelle matière</Label>
              <Input
                id="matiere-add"
                value={matiereNom}
                onChange={(e) => setMatiereNom(e.target.value)}
                placeholder="Ex. ECM, Physique-Chimie…"
              />
            </div>
            <Button
              type="button"
              className="rounded-xl"
              disabled={!matiereNom.trim() || mutate.isPending}
              onClick={() =>
                run(
                  { op: "add", type: "matiere", nom: matiereNom.trim() },
                  "Matière ajoutée",
                  () => setMatiereNom(""),
                )
              }
            >
              <Plus className="size-4" /> Ajouter
            </Button>
          </div>
        </DashboardSectionCard>

        <DashboardSectionCard title="Villes" subtitle="Suggestions pour les formulaires">
          <div className="mb-4 flex items-center gap-2 text-muted-foreground">
            <MapPin className="size-4 text-primary" />
            <span className="text-xs">{data?.villes.length ?? 0} ville(s)</span>
          </div>
          <ReferentielList
            items={data?.villes ?? []}
            removing={removingKey}
            onRemove={(item) =>
              removeItem({ op: "remove", type: "ville", nom: item.key }, item.key)
            }
          />
          <div className="mt-4 flex flex-wrap items-end gap-2">
            <div className="min-w-[12rem] flex-1 space-y-1.5">
              <Label htmlFor="ville-add">Nouvelle ville</Label>
              <Input
                id="ville-add"
                value={villeNom}
                onChange={(e) => setVilleNom(e.target.value)}
                placeholder="Ex. Lomé, Kara…"
              />
            </div>
            <Button
              type="button"
              className="rounded-xl"
              disabled={!villeNom.trim() || mutate.isPending}
              onClick={() =>
                run(
                  { op: "add", type: "ville", nom: villeNom.trim() },
                  "Ville ajoutée",
                  () => setVilleNom(""),
                )
              }
            >
              <Plus className="size-4" /> Ajouter
            </Button>
          </div>
        </DashboardSectionCard>
      </div>

      <p className="flex items-center gap-2 text-xs text-muted-foreground">
        <GraduationCap className="size-3.5" />
        Les listes sont exposées via <code>/meta</code> — rechargement automatique après chaque modification.
      </p>
    </div>
  );
}
