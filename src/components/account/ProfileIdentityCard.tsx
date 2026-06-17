import { Link } from "@tanstack/react-router";
import { Calendar, GraduationCap, Mail, MapPin, School, Shield, Smartphone } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatPhoneDisplay } from "@/lib/phone";
import { roleLabel } from "@/lib/roles";
import { dashboardHomeForRole } from "@/lib/dashboard-nav";
import type { User, UserProfile } from "@/lib/types";

function initials(nom: string): string {
  const parts = nom.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  return nom.slice(0, 2).toUpperCase();
}

export function ProfileIdentityCard({ user }: { user: User | UserProfile }) {
  const home = dashboardHomeForRole(user.role);

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
      <div className="h-20 bg-gradient-to-r from-primary/20 via-primary/10 to-transparent sm:h-24" />
      <div className="relative px-4 pb-5 sm:px-6">
        <div className="-mt-10 mb-4 flex flex-col gap-4 sm:-mt-12 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex items-end gap-4">
            <div
              className="grid size-20 shrink-0 place-items-center rounded-2xl border-4 border-card bg-primary font-display text-2xl font-bold text-primary-foreground shadow-md sm:size-24 sm:text-3xl"
              aria-hidden
            >
              {initials(user.nom)}
            </div>
            <div className="min-w-0 pb-1">
              <h2 className="truncate font-display text-xl font-bold tracking-tight sm:text-2xl">
                {user.nom}
              </h2>
              <div className="mt-1.5 flex flex-wrap items-center gap-2">
                <Badge variant="secondary" className="text-[10px] uppercase tracking-wide">
                  {roleLabel(user.role)}
                </Badge>
                {"createdAt" in user && user.createdAt && (
                  <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                    <Calendar className="size-3.5" />
                    Membre depuis {new Date(user.createdAt).toLocaleDateString("fr-FR")}
                  </span>
                )}
              </div>
            </div>
          </div>
          <Button asChild variant="outline" size="sm" className="shrink-0 rounded-xl">
            <Link to={home}>
              {user.role === "admin" || user.role === "gestionnaire" ? "Tableau de bord" : "Mon espace"}
            </Link>
          </Button>
        </div>

        <dl className="grid gap-2 text-sm sm:grid-cols-2">
          <div className="flex items-center gap-2 rounded-xl bg-muted/40 px-3 py-2.5">
            <Mail className="size-4 shrink-0 text-muted-foreground" />
            <div className="min-w-0">
              <dt className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">Email</dt>
              <dd className="truncate font-medium">{user.email}</dd>
            </div>
          </div>
          {user.telephone && (
            <div className="flex items-center gap-2 rounded-xl bg-muted/40 px-3 py-2.5">
              <Smartphone className="size-4 shrink-0 text-muted-foreground" />
              <div>
                <dt className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">Téléphone</dt>
                <dd className="font-medium">{formatPhoneDisplay(user.telephone)}</dd>
              </div>
            </div>
          )}
          {user.ville && (
            <div className="flex items-center gap-2 rounded-xl bg-muted/40 px-3 py-2.5">
              <MapPin className="size-4 shrink-0 text-muted-foreground" />
              <div>
                <dt className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">Ville</dt>
                <dd className="font-medium">{user.ville}</dd>
              </div>
            </div>
          )}
          {user.classe && (
            <div className="flex items-center gap-2 rounded-xl bg-muted/40 px-3 py-2.5">
              <GraduationCap className="size-4 shrink-0 text-muted-foreground" />
              <div>
                <dt className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">Classe</dt>
                <dd className="font-medium">{user.classe}</dd>
              </div>
            </div>
          )}
          {user.etablissement && (
            <div className="flex items-center gap-2 rounded-xl bg-muted/40 px-3 py-2.5">
              <School className="size-4 shrink-0 text-muted-foreground" />
              <div>
                <dt className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">Établissement</dt>
                <dd className="font-medium">{user.etablissement}</dd>
              </div>
            </div>
          )}
          <div className="flex items-center gap-2 rounded-xl bg-muted/40 px-3 py-2.5">
            <Shield className="size-4 shrink-0 text-muted-foreground" />
            <div>
              <dt className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">Compte</dt>
              <dd className="font-medium">Sécurisé · EZOA-TO</dd>
            </div>
          </div>
        </dl>
      </div>
    </div>
  );
}
