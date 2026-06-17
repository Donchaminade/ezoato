import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  Inbox,
  BookOpen,
  Banknote,
  BarChart3,
  Building2,
  Handshake,
  School,
  Users,
  Upload,
  Library,
  Bookmark,
  Wallet,
  Settings,
  FolderTree,
  UserCircle,
  Bell,
} from "lucide-react";
import type { Role } from "@/lib/types";

export type AdminSection =
  | "overview"
  | "soumissions"
  | "epreuves"
  | "archives"
  | "retraits"
  | "stats"
  | "partenaires"
  | "soutien"
  | "etablissements"
  | "users"
  | "settings"
  | "notifications";

export type UserSection =
  | "overview"
  | "soumissions"
  | "bibliotheque"
  | "favoris"
  | "portefeuille"
  | "profil"
  | "submit";

export type DashboardNavItem = {
  id: string;
  label: string;
  /** Libellé court pour la barre mobile */
  shortLabel?: string;
  icon: LucideIcon;
  to: string;
  search?: Record<string, string>;
  badge?: number;
  adminOnly?: boolean;
  exact?: boolean;
};

export type DashboardNavGroup = {
  title: string;
  items: DashboardNavItem[];
};

export function getAdminNavGroups(isAdmin: boolean, badges?: {
  soumissions?: number;
  retraits?: number;
  soutien?: number;
  etablissements?: number;
}): DashboardNavGroup[] {
  const section = (id: AdminSection) => ({ section: id });

  return [
    {
      title: "Principal",
      items: [
        {
          id: "overview",
          label: "Vue d'ensemble",
          shortLabel: "Accueil",
          icon: LayoutDashboard,
          to: "/admin",
          search: section("overview"),
          exact: true,
        },
      ],
    },
    {
      title: "Modération",
      items: [
        {
          id: "soumissions",
          label: "Soumissions",
          shortLabel: "Soumissions",
          icon: Inbox,
          to: "/admin",
          search: section("soumissions"),
          badge: badges?.soumissions,
        },
        {
          id: "epreuves",
          label: "Épreuves",
          shortLabel: "Épreuves",
          icon: BookOpen,
          to: "/admin",
          search: section("epreuves"),
        },
        {
          id: "archives",
          label: "Archives",
          shortLabel: "Archives",
          icon: FolderTree,
          to: "/admin",
          search: section("archives"),
        },
        {
          id: "retraits",
          label: "Retraits",
          shortLabel: "Retraits",
          icon: Banknote,
          to: "/admin",
          search: section("retraits"),
          badge: badges?.retraits,
        },
      ],
    },
    {
      title: "Partenariat",
      items: [
        {
          id: "partenaires",
          label: "Partenaires",
          icon: Building2,
          to: "/admin",
          search: section("partenaires"),
        },
        {
          id: "soutien",
          label: "Demandes soutien",
          icon: Handshake,
          to: "/admin",
          search: section("soutien"),
          badge: badges?.soutien,
        },
        {
          id: "etablissements",
          label: "Établissements",
          icon: School,
          to: "/admin",
          search: section("etablissements"),
          badge: badges?.etablissements,
        },
      ],
    },
    {
      title: isAdmin ? "Administration" : "Analyse",
      items: [
        ...(isAdmin
          ? [
              {
                id: "users",
                label: "Utilisateurs",
                icon: Users,
                to: "/admin",
                search: section("users"),
                adminOnly: true,
              } satisfies DashboardNavItem,
            ]
          : []),
        {
          id: "stats",
          label: "Statistiques",
          icon: BarChart3,
          to: "/admin",
          search: section("stats"),
        },
        {
          id: "notifications",
          label: "Notifications",
          icon: Bell,
          to: "/admin",
          search: section("notifications"),
          adminOnly: true,
        },
        {
          id: "settings",
          label: "Paramètres",
          icon: Settings,
          to: "/admin",
          search: section("settings"),
          adminOnly: true,
        },
        {
          id: "profil",
          label: "Mon profil",
          shortLabel: "Profil",
          icon: UserCircle,
          to: "/account/profil",
          exact: true,
        },
      ],
    },
  ];
}

export const USER_DASHBOARD_PATHS = {
  overview: "/account",
  soumissions: "/account/soumissions",
  bibliotheque: "/account/bibliotheque",
  favoris: "/account/favoris",
  portefeuille: "/account/portefeuille",
  profil: "/account/profil",
  submit: "/submit",
} as const satisfies Record<UserSection, string>;

/** Déduit la section active depuis l'URL (source de vérité). */
export function resolveUserActiveSection(pathname: string, explicit?: UserSection): UserSection {
  if (pathname.startsWith("/account/soumissions")) return "soumissions";
  if (pathname.startsWith("/account/bibliotheque")) return "bibliotheque";
  if (pathname.startsWith("/account/favoris")) return "favoris";
  if (pathname.startsWith("/account/portefeuille") || pathname === "/contributor") return "portefeuille";
  if (pathname.startsWith("/account/profil")) return "profil";
  if (pathname === "/submit") return "submit";
  if (pathname === "/account" || pathname === "/account/") return "overview";
  return explicit ?? "overview";
}

export function isContributorDashboard(pathname: string): boolean {
  return pathname.startsWith("/account") || pathname === "/contributor" || pathname === "/submit";
}

/** Contributeur : une seule section active (par id), sans matching par préfixe d'URL. */
export function isContributorNavItemActive(item: DashboardNavItem, activeSection: UserSection): boolean {
  return item.id === activeSection;
}

/** Admin : tous les liens pointent vers /admin — on compare uniquement l'id de section. */
export function isAdminNavItemActive(item: DashboardNavItem, activeSection: string): boolean {
  return item.id === activeSection;
}

/** @deprecated Utiliser isContributorNavItemActive */
export function isUserNavItemActive(
  item: DashboardNavItem,
  _pathname: string,
  activeSection: UserSection,
): boolean {
  return isContributorNavItemActive(item, activeSection);
}

export function userSectionLabel(section: UserSection): string {
  const labels: Record<UserSection, string> = {
    overview: "Vue d'ensemble",
    soumissions: "Mes soumissions",
    bibliotheque: "Ma bibliothèque",
    favoris: "Mes favoris",
    portefeuille: "Mon portefeuille",
    profil: "Mon profil",
    submit: "Soumettre une épreuve",
  };
  return labels[section];
}

export function getUserNavGroups(badges?: {
  soumissions?: number;
}): DashboardNavGroup[] {
  return [
    {
      title: "Mon espace",
      items: [
        {
          id: "overview",
          label: "Vue d'ensemble",
          shortLabel: "Accueil",
          icon: LayoutDashboard,
          to: USER_DASHBOARD_PATHS.overview,
          exact: true,
        },
        {
          id: "soumissions",
          label: "Mes soumissions",
          shortLabel: "Soumissions",
          icon: Inbox,
          to: USER_DASHBOARD_PATHS.soumissions,
          badge: badges?.soumissions,
        },
        {
          id: "bibliotheque",
          label: "Ma bibliothèque",
          shortLabel: "Bibliothèque",
          icon: Library,
          to: USER_DASHBOARD_PATHS.bibliotheque,
        },
        {
          id: "favoris",
          label: "Mes favoris",
          shortLabel: "Favoris",
          icon: Bookmark,
          to: USER_DASHBOARD_PATHS.favoris,
        },
        {
          id: "portefeuille",
          label: "Mon portefeuille",
          shortLabel: "Portefeuille",
          icon: Wallet,
          to: USER_DASHBOARD_PATHS.portefeuille,
        },
        {
          id: "profil",
          label: "Mon profil",
          shortLabel: "Profil",
          icon: UserCircle,
          to: USER_DASHBOARD_PATHS.profil,
          exact: true,
        },
      ],
    },
    {
      title: "Contribution",
      items: [
        {
          id: "submit",
          label: "Soumettre une épreuve",
          shortLabel: "Soumettre",
          icon: Upload,
          to: "/submit",
        },
      ],
    },
  ];
}

export function dashboardHomeForRole(role: Role): string {
  if (role === "admin" || role === "gestionnaire") return "/admin";
  return "/account";
}

export function adminSectionLabel(section: AdminSection): string {
  const labels: Record<AdminSection, string> = {
    overview: "Vue d'ensemble",
    soumissions: "Soumissions",
    epreuves: "Épreuves",
    archives: "Archives fichiers",
    retraits: "Retraits",
    stats: "Statistiques",
    partenaires: "Partenaires",
    soutien: "Demandes soutien",
    etablissements: "Établissements",
    users: "Utilisateurs",
    notifications: "Notifications",
    settings: "Paramètres",
  };
  return labels[section];
}

export const ADMIN_SETTINGS_ICON = Settings;
