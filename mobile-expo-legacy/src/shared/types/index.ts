/**
 * Types métier EZOA-TO — sous-ensemble partagé avec le web
 */

export type Ville = string;
export type Niveau = "college" | "lycee";
export type TypeEpreuve = "devoir" | "composition" | "examen" | "corrige";
export type ExamenNational = "CEPD" | "BEPC" | "BAC1" | "BAC2";
export type StatutEpreuve = "en_attente" | "validee" | "rejetee" | "archivee";
export type Role = "visiteur" | "utilisateur" | "gestionnaire" | "admin";

export interface Epreuve {
  id: string;
  titre: string;
  matiere: string;
  niveau: Niveau;
  classe: string;
  annee: number;
  type: TypeEpreuve;
  examen?: ExamenNational;
  etablissement?: string;
  ville: Ville;
  pdfUrl: string;
  pdfPreviewUrl?: string;
  thumbnailUrl?: string;
  pages: number;
  tailleKo: number;
  telechargements: number;
  soumisPar: string;
  soumisLe: string;
  statut: StatutEpreuve;
  requiresPayment?: boolean;
  prixFcfa?: number;
}

export interface User {
  id: string;
  nom: string;
  email: string;
  telephone?: string;
  role: Role;
  ville?: Ville;
  createdAt?: string;
}

export interface UserProfile extends User {
  createdAt: string;
}

export interface UpdateProfilePayload {
  nom: string;
  email: string;
  telephone: string;
  ville?: string | null;
  currentPassword?: string;
  password?: string;
}

export interface NotificationPreferences {
  userId?: string;
  soumissions: boolean;
  retraits: boolean;
  paiements: boolean;
  moderation: boolean;
  marketing: boolean;
  pushEnabled: boolean;
}

export interface InboxNotification {
  id: string;
  titre: string;
  corps: string;
  url: string | null;
  lu: boolean;
  createdAt: string;
}

export interface NotificationConfig {
  preferences: NotificationPreferences;
  vapidPublicKey: string | null;
  pushSupported: boolean;
  inbox: InboxNotification[];
  unreadCount: number;
  rulesReady: boolean;
}

export interface UserFavoris {
  ids: string[];
}

export interface UserFavorisList {
  items: Epreuve[];
}

export interface LibraryItem {
  id: string;
  titre: string;
  matiere: string;
  classe: string;
  annee: number;
  type: TypeEpreuve;
  examen?: ExamenNational;
  ville: Ville;
  pages: number;
  tailleKo: number;
  telechargeLe?: string | null;
  acheteLe?: string;
  source?: "achat" | "gratuit";
}

export interface UserLibrary {
  paid: LibraryItem[];
  free: LibraryItem[];
}

export interface ContributorWallet {
  solde: number;
  epreuvesValidees: number;
  paliersVerses: number;
  prochainPalier: number;
  progressionPalier: number;
  epreuvesParRecompense: number;
  montantRecompense: number;
  minRetrait: number;
  peutRetirer: boolean;
  transactions: {
    id: string;
    type: "credit" | "debit";
    montant: number;
    description: string;
    creeLe: string;
  }[];
  retraits: {
    id: string;
    montant: number;
    methode: "flooz" | "tmoney";
    statut: string;
    creeLe: string;
  }[];
}

export interface PublicMeta {
  villes: Ville[];
  matieres: string[];
  stats: {
    epreuvesValidees: number;
    etablissements: number;
    telechargements: number;
    contributeurs: number;
  };
}

export interface PageResult<T> {
  items: T[];
  total: number;
  page: number;
  perPage: number;
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

export interface OfflineEpreuve {
  id: string;
  titre: string;
  matiere: string;
  metadata: string;
  localPdfPath: string;
  downloadedAt: string;
}

export interface PaymentAccess {
  requiresPayment: boolean;
  hasAccess: boolean;
  montant: number;
  devise?: string;
}
