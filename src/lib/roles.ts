import type { Role } from "@/lib/types";

export const ROLE_LABELS: Record<Role, string> = {
  visiteur: "Visiteur",
  utilisateur: "Contributeur",
  gestionnaire: "Gestionnaire",
  admin: "Administrateur",
};

export function roleLabel(role: Role): string {
  return ROLE_LABELS[role] ?? role;
}
