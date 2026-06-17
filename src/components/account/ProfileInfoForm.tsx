import { useMutation, useQuery } from "@tanstack/react-query";
import { Loader2, Mail, Smartphone, User } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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

  const { data: meta } = useQuery({ queryKey: ["meta"], queryFn: () => api.getMeta() });

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
  }, [data?.user]);

  const saveMutation = useMutation({
    mutationFn: () => {
      if (!isValidPhone(telephone)) throw new Error("Numéro de téléphone invalide");
      return api.updateProfile({
        nom: nom.trim(),
        email: email.trim(),
        telephone: normalizePhone(telephone),
        ville: ville || null,
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
      </div>

      <Button type="submit" className="rounded-xl" disabled={saveMutation.isPending}>
        {saveMutation.isPending && <Loader2 className="size-4 animate-spin" />}
        Enregistrer les modifications
      </Button>
    </form>
  );
}
