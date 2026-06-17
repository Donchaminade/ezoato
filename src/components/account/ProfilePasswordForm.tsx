import { useMutation } from "@tanstack/react-query";
import { Eye, EyeOff, Loader2, Lock } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";

export function ProfilePasswordForm() {
  const { user, setUserFromProfile } = useAuth();
  const [showPwd, setShowPwd] = useState(false);
  const [showNewPwd, setShowNewPwd] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPwd, setConfirmPwd] = useState("");

  const saveMutation = useMutation({
    mutationFn: () => {
      if (!user) throw new Error("Non connecté");
      if (password.length < 8) throw new Error("Le mot de passe doit faire au moins 8 caractères");
      if (password !== confirmPwd) throw new Error("Les mots de passe ne correspondent pas");
      return api.updateProfile({
        nom: user.nom,
        email: user.email,
        telephone: user.telephone ?? "",
        ville: user.ville ?? null,
        currentPassword,
        password,
      });
    },
    onSuccess: (res) => {
      setUserFromProfile(res.user);
      setCurrentPassword("");
      setPassword("");
      setConfirmPwd("");
      toast.success("Mot de passe mis à jour");
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Échec"),
  });

  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        saveMutation.mutate();
      }}
    >
      <p className="text-sm text-muted-foreground">
        Pour changer ton mot de passe, saisis d&apos;abord ton mot de passe actuel.
      </p>

      <div className="grid gap-4 sm:max-w-lg">
        <div className="space-y-1.5">
          <Label htmlFor="profil-current-pwd">Mot de passe actuel</Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="profil-current-pwd"
              type={showPwd ? "text" : "password"}
              className="pl-9 pr-10"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              autoComplete="current-password"
              required
            />
            <button
              type="button"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              onClick={() => setShowPwd((v) => !v)}
              aria-label={showPwd ? "Masquer" : "Afficher"}
            >
              {showPwd ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          </div>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="profil-new-pwd">Nouveau mot de passe</Label>
          <div className="relative">
            <Input
              id="profil-new-pwd"
              type={showNewPwd ? "text" : "password"}
              className="pr-10"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              minLength={8}
              autoComplete="new-password"
              required
            />
            <button
              type="button"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              onClick={() => setShowNewPwd((v) => !v)}
            >
              {showNewPwd ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          </div>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="profil-confirm-pwd">Confirmer le nouveau mot de passe</Label>
          <Input
            id="profil-confirm-pwd"
            type="password"
            value={confirmPwd}
            onChange={(e) => setConfirmPwd(e.target.value)}
            autoComplete="new-password"
            required
          />
        </div>
      </div>

      <Button type="submit" className="rounded-xl" disabled={saveMutation.isPending}>
        {saveMutation.isPending && <Loader2 className="size-4 animate-spin" />}
        Mettre à jour le mot de passe
      </Button>
    </form>
  );
}
