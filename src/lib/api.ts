/**
 * Client API EZOA-TO — toujours branché sur le backend PHP (VITE_API_URL).
 */
import type {
  AdminReferentielUpdate,
  AdminReferentiels,
  AdminRetrait,
  AdminStats,
  AdminUser,
  AdminUserDetail,
  AdminUserStats,
  AdminAbonnement,
  AdminAbonnementsPage,
  AdminAbonnementsStats,
  ArchiveBrowseResult,
  ContactInfo,
  ContributorWallet,
  DemandeEtablissement,
  DemandeSoutien,
  DownloadHistory,
  Epreuve,
  LibraryItem,
  NotificationConfig,
  NotificationPreferences,
  NotificationRule,
  NotificationRulesMeta,
  PaymentAccess,
  PaymentHistory,
  PaymentInit,
  FaqResponse,
  Partenaire,
  PlatformSettings,
  PublicMeta,
  Soumission,
  SoumissionDetail,
  SoumissionHistory,
  SoumissionSimilairesResponse,
  SubscriptionStatus,
  UpdateProfilePayload,
  User,
  UserFavoris,
  UserFavorisList,
  UserLibrary,
  UserProfile,
} from "./types";

const API_URL = (import.meta.env.VITE_API_URL as string | undefined) ?? "";

if (!API_URL && import.meta.env.DEV) {
  console.warn("[EZOA-TO] VITE_API_URL non défini — configurez .env pour pointer vers backend-php");
}

async function http<T>(path: string, init?: RequestInit): Promise<T> {
  if (!API_URL) throw new Error("Service temporairement indisponible");
  const token = typeof window !== "undefined" ? localStorage.getItem("ezoa_token") : null;
  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init?.headers ?? {}),
    },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { error?: string }).error ?? `API ${res.status}`);
  }
  return res.json();
}

export interface ListEpreuvesParams {
  q?: string;
  ville?: string;
  matiere?: string;
  niveau?: string;
  classe?: string;
  type?: string;
  annee?: number;
  examen?: string;
  page?: number;
  perPage?: number;
}

export interface PageResult<T> {
  items: T[];
  total: number;
  page: number;
  perPage: number;
}

export const api = {
  async getMeta(): Promise<PublicMeta> {
    return http("/meta");
  },

  async getContactInfo(): Promise<ContactInfo> {
    return http("/contact");
  },

  async getFaq(params: {
    q?: string;
    category?: string;
    limit?: number;
    voterId?: string;
  } = {}): Promise<FaqResponse> {
    const qs = new URLSearchParams();
    if (params.q) qs.set("q", params.q);
    if (params.category) qs.set("category", params.category);
    if (params.limit) qs.set("limit", String(params.limit));
    if (params.voterId) qs.set("voterId", params.voterId);
    const query = qs.toString();
    return http(`/faq${query ? `?${query}` : ""}`);
  },

  async voteFaq(data: {
    faqId: string;
    helpful: boolean;
    voterId: string;
  }): Promise<{ ok: boolean; helpfulYes: number; helpfulNo: number; yourVote: boolean }> {
    return http("/faq/vote", { method: "POST", body: JSON.stringify(data) });
  },

  async sendContactMessage(data: {
    nom: string;
    email: string;
    sujet: string;
    message: string;
  }): Promise<{ ok: boolean; message: string }> {
    return http("/contact", { method: "POST", body: JSON.stringify(data) });
  },

  async listPartenaires(): Promise<Partenaire[]> {
    return http("/partners");
  },

  async sendDemandeSoutien(data: {
    nom: string;
    email: string;
    telephone?: string;
    organisation?: string;
    type: DemandeSoutien["type"];
    message: string;
  }): Promise<{ ok: boolean; message: string }> {
    return http("/partners/soutien", { method: "POST", body: JSON.stringify(data) });
  },

  async sendDemandeEtablissement(data: {
    nomEtablissement: string;
    ville: string;
    nomContact: string;
    email: string;
    telephone?: string;
    fonction?: string;
    typeDemande: DemandeEtablissement["typeDemande"];
    message: string;
  }): Promise<{ ok: boolean; message: string }> {
    return http("/partners/etablissement", { method: "POST", body: JSON.stringify(data) });
  },

  async listEpreuves(p: ListEpreuvesParams = {}): Promise<PageResult<Epreuve>> {
    const qs = new URLSearchParams();
    Object.entries(p).forEach(([k, v]) => v != null && v !== "" && qs.set(k, String(v)));
    return http(`/epreuves?${qs.toString()}`);
  },

  async getEpreuve(id: string): Promise<Epreuve | null> {
    return http(`/epreuves/${id}`);
  },

  async checkPaymentAccess(epreuveId: string): Promise<PaymentAccess> {
    return http(`/paiements/acces/${epreuveId}`);
  },

  async initierPaiement(epreuveId: string, methode: "flooz" | "tmoney", telephone: string): Promise<PaymentInit> {
    return http("/paiements/initier", {
      method: "POST",
      body: JSON.stringify({ epreuveId, methode, telephone }),
    });
  },

  async confirmerPaiement(reference: string): Promise<{ ok: boolean; hasAccess: boolean }> {
    return http("/paiements/confirmer", { method: "POST", body: JSON.stringify({ reference }) });
  },

  async getSubscriptionStatus(): Promise<SubscriptionStatus> {
    return http("/account/abonnement/status");
  },

  async initierAbonnement(methode: "flooz" | "tmoney", telephone: string): Promise<PaymentInit> {
    return http("/account/abonnement/subscribe", {
      method: "POST",
      body: JSON.stringify({ methode, telephone }),
    });
  },

  async confirmerAbonnement(reference: string): Promise<SubscriptionStatus> {
    return http("/account/abonnement/subscribe", {
      method: "POST",
      body: JSON.stringify({ reference }),
    });
  },

  async downloadEpreuve(epreuveId: string): Promise<void> {
    const token = localStorage.getItem("ezoa_token");
    const res = await fetch(`${API_URL}/epreuves/${epreuveId}/download`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error((err as { error?: string }).error ?? "Échec du téléchargement");
    }
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `epreuve-${epreuveId}.pdf`;
    a.click();
    URL.revokeObjectURL(url);
  },

  async listSoumissions(): Promise<Soumission[]> {
    return http("/admin/soumissions");
  },

  async getSoumissionSimilaires(id: string): Promise<SoumissionSimilairesResponse> {
    return http(`/admin/soumissions/${id}/similaires`);
  },

  async validerSoumission(
    id: string,
    corrections?: { ville?: string; titre?: string },
  ): Promise<void> {
    await http(`/admin/soumissions/${id}/valider`, {
      method: "POST",
      body: JSON.stringify(corrections ?? {}),
    });
  },

  async rejeterSoumission(id: string, motif: string): Promise<void> {
    await http(`/admin/soumissions/${id}/rejeter`, { method: "POST", body: JSON.stringify({ motif }) });
  },

  async remplacerSoumission(
    id: string,
    doublonId: string,
    corrections?: { ville?: string; titre?: string },
  ): Promise<void> {
    await http(`/admin/soumissions/${id}/remplacer`, {
      method: "POST",
      body: JSON.stringify({ doublonId, ...corrections }),
    });
  },

  async archiverSoumission(id: string): Promise<void> {
    await http(`/admin/soumissions/${id}/archiver`, { method: "POST" });
  },

  async browseArchives(root: "epreuves" | "soumissions", path = ""): Promise<ArchiveBrowseResult> {
    const qs = new URLSearchParams({ root, ...(path ? { path } : {}) });
    return http(`/admin/archives?${qs}`);
  },

  async fetchArchiveFile(root: "epreuves" | "soumissions", path: string): Promise<Blob> {
    const token = localStorage.getItem("ezoa_token");
    const qs = new URLSearchParams({ root, path });
    const res = await fetch(`${API_URL}/admin/archives/file?${qs}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (!res.ok) throw new Error("Fichier introuvable");
    return res.blob();
  },

  async fetchAuthenticatedUrl(url: string): Promise<string> {
    const token = localStorage.getItem("ezoa_token");
    const res = await fetch(url, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (!res.ok) throw new Error("Ressource introuvable");
    const blob = await res.blob();
    return URL.createObjectURL(blob);
  },

  async getAdminStats(): Promise<AdminStats> {
    return http("/admin/stats");
  },

  async getAdminReferentiels(): Promise<AdminReferentiels> {
    return http("/admin/referentiels");
  },

  async updateAdminReferentiel(
    payload: AdminReferentielUpdate,
  ): Promise<AdminReferentiels & { ok: boolean }> {
    return http("/admin/referentiels", { method: "POST", body: JSON.stringify(payload) });
  },

  async getPlatformSettings(): Promise<{
    settings: PlatformSettings;
    dbReady: boolean;
    message?: string;
  }> {
    return http("/admin/settings");
  },

  async updatePlatformSettings(payload: {
    prixExamenNational: number;
    prixCorrigeType?: number | null;
    epreuvesParRecompense: number;
    montantRecompense: number;
    minRetrait: number;
    promo: PlatformSettings["promo"];
    contact: ContactInfo;
  }): Promise<{ ok: boolean; settings: PlatformSettings }> {
    return http("/admin/settings", { method: "POST", body: JSON.stringify(payload) });
  },

  async listAdminEpreuves(statut = "validee", q = ""): Promise<Epreuve[]> {
    const qs = new URLSearchParams({ statut, ...(q ? { q } : {}) });
    return http(`/admin/epreuves?${qs}`);
  },

  async archiverEpreuve(id: string): Promise<void> {
    await http(`/admin/epreuves/${id}/archiver`, { method: "POST" });
  },

  async supprimerEpreuve(id: string): Promise<void> {
    await http(`/admin/epreuves/${id}/supprimer`, { method: "POST" });
  },

  async uploadCorrigeType(parentId: string, file: File): Promise<{ ok: boolean; corrigeId: string }> {
    const token = localStorage.getItem("ezoa_token");
    const fd = new FormData();
    fd.append("pdf", file);
    const res = await fetch(`${API_URL}/admin/epreuves/${parentId}/corrige`, {
      method: "POST",
      body: fd,
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error((err as { error?: string }).error ?? "Échec upload corrigé");
    }
    return res.json();
  },

  async supprimerCorrigeType(parentId: string): Promise<void> {
    await http(`/admin/epreuves/${parentId}/corrige/supprimer`, { method: "POST" });
  },

  async listAdminUsers(): Promise<AdminUser[]> {
    return http("/admin/users");
  },

  async updateUserRole(id: string, role: AdminUser["role"]): Promise<void> {
    await http(`/admin/users/${id}/role`, { method: "POST", body: JSON.stringify({ role }) });
  },

  async createAdminUser(payload: {
    nom: string;
    email: string;
    telephone: string;
    password: string;
    role: AdminUser["role"];
    ville?: string;
  }): Promise<AdminUser> {
    const res = await http<{ ok: boolean; user: AdminUser }>("/admin/users/creer", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    return res.user;
  },

  async getAdminUser(id: string): Promise<AdminUserDetail> {
    return http(`/admin/users/${id}`);
  },

  async updateAdminUser(
    id: string,
    payload: {
      nom: string;
      email: string;
      telephone: string;
      role: AdminUser["role"];
      ville?: string;
      password?: string;
    },
  ): Promise<AdminUserDetail> {
    const res = await http<{ ok: boolean; user: AdminUserDetail }>(`/admin/users/${id}/modifier`, {
      method: "POST",
      body: JSON.stringify(payload),
    });
    return res.user;
  },

  async deleteAdminUser(id: string): Promise<void> {
    await http(`/admin/users/${id}/supprimer`, { method: "POST" });
  },

  async resetAdminUserPassword(
    id: string,
    adminPassword: string,
  ): Promise<{ temporaryPassword: string }> {
    const res = await http<{ ok: boolean; temporaryPassword: string }>(
      `/admin/users/${id}/reset-password`,
      { method: "POST", body: JSON.stringify({ adminPassword }) },
    );
    return { temporaryPassword: res.temporaryPassword };
  },

  async getAdminUserStats(id: string): Promise<AdminUserStats> {
    return http(`/admin/users/${id}/stats`);
  },

  async getMyDownloads(): Promise<DownloadHistory[]> {
    return http("/account/downloads");
  },

  async getMyLibrary(): Promise<UserLibrary> {
    return http("/account/library");
  },

  async getFavoris(): Promise<UserFavoris> {
    return http("/account/favoris");
  },

  async getFavorisEpreuves(): Promise<UserFavorisList> {
    return http("/account/favoris/list");
  },

  async addFavori(epreuveId: string): Promise<{ ok: boolean }> {
    return http("/account/favoris", {
      method: "POST",
      body: JSON.stringify({ epreuveId }),
    });
  },

  async removeFavori(epreuveId: string): Promise<{ ok: boolean }> {
    return http(`/account/favoris/${epreuveId}`, { method: "DELETE" });
  },

  async getMySoumissions(): Promise<SoumissionHistory[]> {
    return http("/account/soumissions");
  },

  async getMySoumission(id: string): Promise<SoumissionDetail | null> {
    return http(`/account/soumissions/${id}`);
  },

  async getWallet(): Promise<ContributorWallet> {
    return http("/wallet/portefeuille");
  },

  async getProfile(): Promise<{ user: UserProfile; notifications: NotificationPreferences }> {
    return http("/account/profile");
  },

  async updateProfile(payload: UpdateProfilePayload): Promise<{ ok: boolean; user: UserProfile }> {
    return http("/account/profile", { method: "POST", body: JSON.stringify(payload) });
  },

  async getNotificationConfig(): Promise<NotificationConfig> {
    return http("/account/notifications");
  },

  async updateNotificationPreferences(
    prefs: Partial<NotificationPreferences>,
  ): Promise<{ ok: boolean; preferences: NotificationPreferences }> {
    return http("/account/notifications", { method: "POST", body: JSON.stringify(prefs) });
  },

  async subscribePush(subscription: {
    endpoint: string;
    keys: { p256dh: string; auth: string };
  }): Promise<{ ok: boolean; preferences: NotificationPreferences }> {
    return http("/account/notifications/subscribe", {
      method: "POST",
      body: JSON.stringify(subscription),
    });
  },

  async unsubscribePush(endpoint?: string): Promise<{ ok: boolean; preferences: NotificationPreferences }> {
    return http("/account/notifications/unsubscribe", {
      method: "POST",
      body: JSON.stringify(endpoint ? { endpoint } : {}),
    });
  },

  async markNotificationsRead(ids?: string[]): Promise<{ ok: boolean; unreadCount: number }> {
    return http("/account/notifications/read", {
      method: "POST",
      body: JSON.stringify(ids ? { ids } : {}),
    });
  },

  async deleteNotification(id: string): Promise<{ ok: boolean; unreadCount: number }> {
    return http(`/account/notifications/${id}/supprimer`, { method: "POST" });
  },

  async getNotificationRules(): Promise<NotificationRulesMeta> {
    return http("/admin/notifications");
  },

  async createNotificationRule(payload: {
    libelle: string;
    description?: string;
    declencheur: string;
    canal: NotificationRule["canal"];
    destinataire: NotificationRule["destinataire"];
    titre: string;
    corps: string;
    active?: boolean;
  }): Promise<{ ok: boolean; rule: NotificationRule }> {
    return http("/admin/notifications/creer", { method: "POST", body: JSON.stringify(payload) });
  },

  async updateNotificationRule(
    id: string,
    payload: Partial<{
      libelle: string;
      description: string;
      declencheur: string;
      canal: NotificationRule["canal"];
      destinataire: NotificationRule["destinataire"];
      titre: string;
      corps: string;
      active: boolean;
    }>,
  ): Promise<{ ok: boolean; rule: NotificationRule }> {
    return http(`/admin/notifications/${id}/modifier`, { method: "POST", body: JSON.stringify(payload) });
  },

  async toggleNotificationRule(id: string): Promise<{ ok: boolean; rule: NotificationRule }> {
    return http(`/admin/notifications/${id}/toggle`, { method: "POST" });
  },

  async deleteNotificationRule(id: string): Promise<{ ok: boolean }> {
    return http(`/admin/notifications/${id}/supprimer`, { method: "POST" });
  },

  async listAdminAbonnements(params: {
    statut?: "all" | "actif" | "expire";
    page?: number;
    perPage?: number;
  } = {}): Promise<AdminAbonnementsPage> {
    const qs = new URLSearchParams();
    if (params.statut && params.statut !== "all") qs.set("statut", params.statut);
    if (params.page) qs.set("page", String(params.page));
    if (params.perPage) qs.set("perPage", String(params.perPage));
    const q = qs.toString();
    return http(`/admin/abonnements${q ? `?${q}` : ""}`);
  },

  async getAdminAbonnementsStats(): Promise<AdminAbonnementsStats> {
    return http("/admin/abonnements/stats");
  },

  async notifySubscribers(payload: {
    titre: string;
    message: string;
    type?: "info" | "push" | "all";
    url?: string;
  }): Promise<{ ok: boolean; envoyes: number }> {
    return http("/admin/notifications/subscribers", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  async prolongerAbonnement(id: string, jours: number): Promise<{ ok: boolean; abonnement: { id: string; dateFin: string; joursAjoutes: number } }> {
    return http(`/admin/abonnements/${id}/prolonger`, {
      method: "POST",
      body: JSON.stringify({ jours }),
    });
  },

  async demanderRetrait(montant: number, methode: "flooz" | "tmoney", telephone: string): Promise<{ ok: boolean; message: string }> {
    return http("/wallet/retrait", { method: "POST", body: JSON.stringify({ montant, methode, telephone }) });
  },

  async listAdminRetraits(): Promise<AdminRetrait[]> {
    return http("/admin/retraits");
  },

  async approuverRetrait(id: string): Promise<void> {
    await http(`/admin/retraits/${id}/approuver`, { method: "POST" });
  },

  async rejeterRetrait(id: string, motif: string): Promise<void> {
    await http(`/admin/retraits/${id}/rejeter`, { method: "POST", body: JSON.stringify({ motif }) });
  },

  async listAdminPartenaires(): Promise<Partenaire[]> {
    return http("/admin/partenaires");
  },

  async creerPartenaire(data: FormData): Promise<{ ok: boolean; id: string }> {
    const token = localStorage.getItem("ezoa_token");
    const res = await fetch(`${API_URL}/admin/partenaires/creer`, {
      method: "POST",
      body: data,
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error((err as { error?: string }).error ?? "Échec création partenaire");
    }
    return res.json();
  },

  async modifierPartenaire(id: string, data: FormData): Promise<void> {
    const token = localStorage.getItem("ezoa_token");
    const res = await fetch(`${API_URL}/admin/partenaires/${id}/modifier`, {
      method: "POST",
      body: data,
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error((err as { error?: string }).error ?? "Échec modification partenaire");
    }
  },

  async supprimerPartenaire(id: string): Promise<void> {
    await http(`/admin/partenaires/${id}/supprimer`, { method: "POST" });
  },

  async listDemandesSoutien(): Promise<DemandeSoutien[]> {
    return http("/admin/demandes-soutien");
  },

  async updateDemandeSoutienStatut(
    id: string,
    statut: DemandeSoutien["statut"],
    notesAdmin?: string,
  ): Promise<void> {
    await http(`/admin/demandes-soutien/${id}/statut`, {
      method: "POST",
      body: JSON.stringify({ statut, notesAdmin }),
    });
  },

  async listDemandesEtablissement(): Promise<DemandeEtablissement[]> {
    return http("/admin/demandes-etablissement");
  },

  async updateDemandeEtablissementStatut(
    id: string,
    statut: DemandeEtablissement["statut"],
    notesAdmin?: string,
  ): Promise<void> {
    await http(`/admin/demandes-etablissement/${id}/statut`, {
      method: "POST",
      body: JSON.stringify({ statut, notesAdmin }),
    });
  },

  async getMyPaiements(): Promise<PaymentHistory[]> {
    return http("/account/paiements");
  },

  async login(identifier: string, password: string): Promise<{ token: string; user: User }> {
    return http("/auth/login", {
      method: "POST",
      body: JSON.stringify({ identifier, password }),
    });
  },

  async register(
    nom: string,
    email: string,
    telephone: string,
    password: string,
    classe: string,
    etablissement: string,
  ): Promise<{ token: string; user: User }> {
    return http("/auth/register", {
      method: "POST",
      body: JSON.stringify({ nom, email, telephone, password, classe, etablissement }),
    });
  },

  async me(): Promise<User | null> {
    try {
      return await http("/auth/me");
    } catch {
      return null;
    }
  },

  async requestPasswordReset(email: string): Promise<{
    message: string;
    ok: boolean;
    resetUrl?: string;
    devNote?: string;
  }> {
    return http("/auth/forgot-password", {
      method: "POST",
      body: JSON.stringify({ email }),
    });
  },

  async verifyResetToken(token: string): Promise<{
    valid: boolean;
    email?: string;
    nom?: string;
    expiresAt?: string;
  }> {
    return http(`/auth/verify-reset?token=${encodeURIComponent(token)}`);
  },

  async resetPassword(token: string, password: string): Promise<{ ok: boolean; message: string }> {
    return http("/auth/reset-password", {
      method: "POST",
      body: JSON.stringify({ token, password }),
    });
  },

  async submitEpreuve(formData: FormData): Promise<{ id: string; pdfPreviewUrl: string }> {
    const token = localStorage.getItem("ezoa_token");
    const res = await fetch(`${API_URL}/soumissions`, {
      method: "POST",
      body: formData,
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error((err as { error?: string }).error ?? "Échec soumission");
    }
    return res.json();
  },
};
