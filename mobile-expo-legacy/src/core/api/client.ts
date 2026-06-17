/**
 * Client API EZOA-TO mobile — miroir des méthodes clés du web (src/lib/api.ts)
 */
import { assertApiUrl } from "@/core/config/env";
import { getToken } from "@/core/storage/secureToken";
import type {
  ContributorWallet,
  Epreuve,
  ListEpreuvesParams,
  NotificationConfig,
  NotificationPreferences,
  PageResult,
  PaymentAccess,
  PublicMeta,
  UpdateProfilePayload,
  User,
  UserFavoris,
  UserFavorisList,
  UserLibrary,
  UserProfile,
} from "@/shared/types";

async function http<T>(path: string, init?: RequestInit): Promise<T> {
  const base = assertApiUrl();
  const token = await getToken();
  const res = await fetch(`${base}${path}`, {
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

export const api = {
  async getMeta(): Promise<PublicMeta> {
    return http("/meta");
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

  async downloadEpreuveBlob(epreuveId: string): Promise<ArrayBuffer> {
    const base = assertApiUrl();
    const token = await getToken();
    const res = await fetch(`${base}/epreuves/${epreuveId}/download`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error((err as { error?: string }).error ?? "Échec du téléchargement");
    }
    return res.arrayBuffer();
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

  async markNotificationsRead(ids?: string[]): Promise<{ ok: boolean; unreadCount: number }> {
    return http("/account/notifications/read", {
      method: "POST",
      body: JSON.stringify(ids ? { ids } : {}),
    });
  },

  async deleteNotification(id: string): Promise<{ ok: boolean; unreadCount: number }> {
    return http(`/account/notifications/${id}/supprimer`, { method: "POST" });
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
  ): Promise<{ token: string; user: User }> {
    return http("/auth/register", {
      method: "POST",
      body: JSON.stringify({ nom, email, telephone, password }),
    });
  },

  async me(): Promise<User | null> {
    try {
      return await http("/auth/me");
    } catch {
      return null;
    }
  },
};
