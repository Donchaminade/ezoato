/**
 * Client du module demandes de correction.
 * Isolé de src/lib/api.ts pour limiter les conflits avec les autres branches.
 */

const API_URL = (import.meta.env.VITE_API_URL as string | undefined) ?? "";

async function http<T>(path: string, init?: RequestInit): Promise<T> {
  if (!API_URL) throw new Error("Service temporairement indisponible");
  const token = typeof window !== "undefined" ? localStorage.getItem("ezoa_token") : null;
  const headers = new Headers(init?.headers);
  if (token) headers.set("Authorization", `Bearer ${token}`);
  if (init?.body && !(init.body instanceof FormData) && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  const res = await fetch(`${API_URL}${path}`, { ...init, headers });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { error?: string }).error ?? `API ${res.status}`);
  }
  return res.json();
}

export type PaiementCorrection = {
  id: string;
  reference: string;
  montant: number;
  methode: "flooz" | "tmoney";
  provider?: string;
  simulated?: boolean;
  redirectUrl?: string | null;
  instructions: { titre: string; etapes: string[]; ussd: string };
};

export type StatutDemande =
  | "en_attente_reglement"
  | "recue"
  | "traitee_ia"
  | "en_attente_admin"
  | "confirmee_admin"
  | "assignee"
  | "en_revue"
  | "rejetee"
  | "livree"
  | "annulee";

export type QcmGuide = { id: string; prompt: string; choices: string[] };

export type DemandeCorrection = {
  id: string;
  epreuveId: string;
  epreuveTitre: string;
  matiere: string;
  niveau: string;
  exercices: string[];
  blocageTexte?: string | null;
  transcription?: string | null;
  aUnAudio?: boolean;
  statut: StatutDemande;
  origine?: string;
  classeIa?: string | null;
  reglementMode?: string;
  reglementStatut?: string;
  montant?: number;
  formatEleve?: string;
  echeanceLe?: string | null;
  creeLe?: string;
  adminNotifie?: boolean;
  correcteurId?: string | null;
  eleveId?: string;
  confirmee?: boolean;
  guide?: {
    explications: string;
    exemples: string[];
    qcm: QcmGuide[];
    donneReponseDirecte: boolean;
  } | null;
  livraison?: { format: string; contenu: string } | null;
  correction?: { id: string; contenu?: string; statut?: string; correcteurId?: string } | null;
  comparaison?: string[];
  divergence?: { signalee: boolean; note?: string | null };
};

export type ReglagesCorrection = {
  remuneration_correcteur: number;
  forfait_validateur: number;
  prix_unitaire: number;
  quota_pro: number;
  nombre_validateurs: number;
  delai_reassignation_heures: number;
  reutilisation_active: number;
  remuneration_reutilisation: number;
  format_eleve: string;
};

export type ReglagesPublics = {
  prixUnitaire: number;
  quotaPro: number;
  nombreValidateurs: number;
  delaiReassignationHeures: number;
  reutilisationActive: boolean;
  formatEleve: string;
  formatEleveLabel: string;
  minRetrait: number;
};

export type ProfilCorrecteur = {
  id: string;
  userId: string;
  qualite: string;
  statut: string;
  matieres: string[];
  niveaux: string[];
  fiabilite: number;
  motif?: string | null;
};

export type SuggestionCorrecteur = {
  userId: string;
  qualite: string;
  fiabilite: number;
  matieres: string[];
  niveaux: string[];
  charge: number;
  score: number;
};

export const STATUT_LABEL: Record<string, string> = {
  en_attente_reglement: "En attente de règlement",
  recue: "Reçue",
  traitee_ia: "Aide de l'IA",
  en_attente_admin: "Chez l'administration",
  confirmee_admin: "Confirmée, à assigner",
  assignee: "Chez le correcteur",
  en_revue: "En revue",
  rejetee: "Revue rejetée",
  livree: "Livrée",
  annulee: "Annulée",
};

export const correctionsApi = {
  reglagesPublics: () => http<ReglagesPublics>("/corrections/reglages-publics"),
  mesDemandes: () => http<DemandeCorrection[]>("/corrections/mes-demandes"),
  demande: (id: string) => http<DemandeCorrection>(`/corrections/demandes/${id}`),
  creer: (body: FormData) => http<DemandeCorrection>("/corrections/demandes", { method: "POST", body }),
  qcm: (id: string, questionId: string, choice: number) =>
    http<{ ok: boolean; feedback: string }>(`/corrections/demandes/${id}/qcm`, {
      method: "POST",
      body: JSON.stringify({ questionId, choice }),
    }),
  profil: () => http<{ profil: ProfilCorrecteur | null }>("/corrections/correcteur/profil"),
  candidater: (body: FormData) => http<ProfilCorrecteur>("/corrections/candidature", { method: "POST", body }),
  correcteurDemandes: () => http<DemandeCorrection[]>("/corrections/correcteur/demandes"),
  deposer: (id: string, contenu: string) =>
    http<DemandeCorrection>(`/corrections/correcteur/demandes/${id}/correction`, {
      method: "POST",
      body: JSON.stringify({ contenu }),
    }),
  fileValidateur: () => http<DemandeCorrection[]>("/corrections/validateur/file"),
  revue: (correctionId: string, decision: "approuvee" | "rejetee", commentaire: string, suite: string) =>
    http<DemandeCorrection>(`/corrections/validateur/corrections/${correctionId}/revue`, {
      method: "POST",
      body: JSON.stringify({ decision, commentaire, suite }),
    }),
  fileAdmin: () => http<DemandeCorrection[]>("/corrections/admin/file"),
  suggestions: (id: string) => http<SuggestionCorrecteur[]>(`/corrections/admin/suggestions?id=${id}`),
  lireReglages: () => http<ReglagesCorrection>("/corrections/admin/reglages"),
  ecrireReglages: (body: ReglagesCorrection) =>
    http<ReglagesCorrection>("/corrections/admin/reglages", { method: "POST", body: JSON.stringify(body) }),
  correcteurs: () => http<ProfilCorrecteur[]>("/corrections/admin/correcteurs"),
  deciderCorrecteur: (id: string, decision: string, motif: string) =>
    http<{ ok: boolean }>(`/corrections/admin/correcteurs/${id}/decision`, {
      method: "POST",
      body: JSON.stringify({ decision, motif }),
    }),
  confirmer: (id: string) => http<DemandeCorrection>(`/corrections/admin/demandes/${id}/confirmer`, { method: "POST", body: "{}" }),
  renvoyerIa: (id: string) => http<DemandeCorrection>(`/corrections/admin/demandes/${id}/ia`, { method: "POST", body: "{}" }),
  assigner: (id: string, correcteurId: string) =>
    http<DemandeCorrection>(`/corrections/admin/demandes/${id}/assigner`, {
      method: "POST",
      body: JSON.stringify({ correcteurId }),
    }),
  reassigner: (id: string, correcteurId = "") =>
    http<DemandeCorrection>(`/corrections/admin/demandes/${id}/reassigner`, {
      method: "POST",
      body: JSON.stringify({ correcteurId }),
    }),
  confirmerReglement: (id: string, reference: string) =>
    http<DemandeCorrection>(`/corrections/demandes/${id}/reglement`, {
      method: "POST",
      body: JSON.stringify({ reference }),
    }),
  initierPaiement: (id: string, methode: "flooz" | "tmoney", telephone: string) =>
    http<PaiementCorrection>(`/corrections/demandes/${id}/payer`, {
      method: "POST",
      body: JSON.stringify({ methode, telephone }),
    }),
  confirmerPaiement: (id: string, reference: string) =>
    http<DemandeCorrection>(`/corrections/demandes/${id}/payer`, {
      method: "POST",
      body: JSON.stringify({ reference }),
    }),
  echues: () => http<{ reassignees: string[] }>("/corrections/admin/echues", { method: "POST", body: "{}" }),
  audioUrl: (id: string) => `${API_URL}/corrections/demandes/${id}/audio`,
};
