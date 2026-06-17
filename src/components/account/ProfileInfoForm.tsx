import { useMutation, useQuery } from "@tanstack/react-query";
import { GraduationCap, Loader2, Mail, School, Smartphone, User } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CityInput } from "@/components/forms/CityInput";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { isValidPhone, normalizePhone } from "@/lib/phone";

export function ProfileInfoForm({ onSaved }: { onSaved?: () => void }) {
  const { setUserFromProfile } = useAuth();
  const [nom, setNom] = useState("");
  const [email, setEmail] = useState("");
  const [telephone, setTelephone] = useState("");
  const [ville, setVille] = useState<string>("");
  const [niveau, setNiveau] = useState<"college" | "lycee">("college");
  const [classe, setClasse] = useState("");
  const [etablissement, setEtablissement] = useState("");

  const { data: meta } = useQuery({ queryKey: ["meta"], queryFn: () => api.getMeta() });
  const CLASSES_COLLEGE = meta?.classes?.college ?? ["6e", "5e", "4e", "3e"];
  const CLASSES_LYCEE = meta?.classes?.lycee ?? [];
  const etablissementSuggestions = useMemo(
    () => [...new Set((meta?.etablissements ?? []).map((e) => e.nom).filter(Boolean))],
    [meta?.etablissements],
  );

  const { data, isLoading } = useQuery({
    queryKey: ["profile"],
    queryFn: () => api.getProfile(),
  });

  useEffect(() => {
    if (!data?.user) return;
    setNom(data.user.nom);
    setEmail(data.user.email);
    setTelephone(data.user.telephone ?? "");
    setVille(data.user.ville ?? "");
    setClasse(data.user.classe ?? "");
    setEtablissement(data.user.etablissement ?? "");
    const allClasses = [...CLASSES_COLLEGE, ...CLASSES_LYCEE];
    if (data.user.classe && CLASSES_LYCEE.includes(data.user.classe)) {
      setNiveau("lycee");
    } else if (data.user.classe && CLASSES_COLLEGE.includes(data.user.classe)) {
      setNiveau("college");
    } else if (data.user.classe && !allClasses.includes(data.user.classe)) {
      setNiveau("lycee");
    }
  }, [data?.user, CLASSES_COLLEGE, CLASSES_LYCEE]);

  const saveMutation = useMutation({
    mutationFn: () => {
      if (!isValidPhone(telephone)) throw new Error("Numéro de téléphone invalide");
      return api.updateProfile({
        nom: nom.trim(),
        email: email.trim(),
        telephone: normalizePhone(telephone),
        ville: ville || null,
        classe: classe || null,
        etablissement: etablissement.trim() || null,
      });
    },
    onSuccess: (res) => {
      setUserFromProfile(res.user);
      toast.success("Informations enregistrées");
      onSaved?.();
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Échec"),
  });

  if (isLoading) {
    return <div className="h-48 animate-pulse rounded-xl bg-muted" />;
  }

  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        saveMutation.mutate();
      }}
    >
      {!classe && (
        <div className="rounded-xl border border-amber-200/80 bg-amber-50 px-4 py-3 text-sm text-amber-950 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-100">
          Complète ta <strong>classe</strong> pour recevoir les notifications quand une nouvelle épreuve est publiée pour ton niveau.
        </div>
      )}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="profil-nom">Nom complet</Label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="profil-nom"
              className="pl-9"
              value={nom}
              onChange={(e) => setNom(e.target.value)}
              required
              minLength={2}
            />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="profil-email">Email</Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="profil-email"
              type="email"
              className="pl-9"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="profil-tel">Téléphone</Label>
          <div className="relative">
            <Smartphone className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="profil-tel"
              className="pl-9"
              placeholder="90 XX XX XX"
              value={telephone}
              onChange={(e) => setTelephone(e.target.value)}
              required
            />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label>Ville</Label>
          <CityInput
            id="profile-ville"
            listId="profile-villes"
            value={ville}
            onChange={setVille}
            suggestions={meta?.villes ?? []}
            placeholder="Ta ville (saisie libre)"
          />
        </div>
        <div className="space-y-1.5">
          <Label>Niveau</Label>
          <Select
            value={niveau}
            onValueChange={(v) => {
              setNiveau(v as "college" | "lycee");
              setClasse("");
            }}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="college">Collège</SelectItem>
              <SelectItem value="lycee">Lycée</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Classe</Label>
          <Select value={classe} onValueChange={setClasse}>
            <SelectTrigger>
              <GraduationCap className="mr-2 size-4 text-muted-foreground" />
              <SelectValue placeholder="Sélectionner ta classe" />
            </SelectTrigger>
            <SelectContent>
              {(niveau === "college" ? CLASSES_COLLEGE : CLASSES_LYCEE).map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor="profil-etablissement">Établissement</Label>
          <div className="relative">
            <School className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="profil-etablissement"
              list="profile-etablissements"
              className="pl-9"
              value={etablissement}
              onChange={(e) => setEtablissement(e.target.value)}
              placeholder="Ton collège ou lycée"
            />
            {etablissementSuggestions.length > 0 && (
              <datalist id="profile-etablissements">
                {etablissementSuggestions.map((e) => (
                  <option key={e} value={e} />
                ))}
              </datalist>
            )}
          </div>
        </div>
      </div>

      <Button type="submit" className="rounded-xl" disabled={saveMutation.isPending}>
        {saveMutation.isPending && <Loader2 className="size-4 animate-spin" />}
        Enregistrer les modifications
      </Button>
    </form>
  );
}
