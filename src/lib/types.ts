/**
 * EZOA-TO — types métier partagés
 */

/** Ville du Togo — saisie libre, suggestions via /meta */
export type Ville = string;

export type Niveau = "college" | "lycee";

export type Classe =
  // collège
  | "6e" | "5e" | "4e" | "3e"
  // lycée — général
  | "2nde A" | "2nde C"
  | "1ère A" | "1ère C" | "1ère D"
  | "Tle A1" | "Tle A2" | "Tle C" | "Tle D"
  // lycée — technique
  | "2nde E" | "1ère E" | "Tle E"
  | "2nde F1" | "1ère F1" | "Tle F1"
  | "2nde F2" | "1ère F2" | "Tle F2"
  | "2nde F3" | "1ère F3" | "Tle F3"
  | "2nde F4" | "1ère F4" | "Tle F4"
  | "2nde H" | "1ère H" | "Tle H"
  | "2nde TI" | "1ère TI" | "Tle TI"
  | "2nde G1" | "1ère G1" | "Tle G1"
  | "2nde G2" | "1ère G2" | "Tle G2"
  | "2nde G3" | "1ère G3" | "Tle G3";

export type TypeEpreuve = "devoir" | "composition" | "examen" | "corrige";

export type Periode =
  | "T1" | "T2" | "T3"   // trimestre (collège)
  | "S1" | "S2";         // semestre (lycée)

export type ExamenNational = "CEPD" | "BEPC" | "BAC1" | "BAC2";

export type StatutEpreuve = "en_attente" | "validee" | "rejetee" | "archivee";

export interface Epreuve {
  id: string;
  titre: string;
  matiere: string;
  niveau: Niveau;
  classe: Classe;
  annee: number;
  type: TypeEpreuve;
  periode?: Periode;
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
  soumisLe: string; // ISO
  valideLe?: string;
  statut: StatutEpreuve;
  requiresPayment?: boolean;
  prixFcfa?: number;
  epreuveParentId?: string;
  epreuveParent?: { id: string; titre: string };
  corrigeType?: CorrigeTypeSummary;
  corrigeTypeId?: string | null;
  hasCorrigeType?: boolean;
}

export interface CorrigeTypeSummary {
  id: string;
  titre: string;
  pages: number;
  tailleKo: number;
  prixFcfa: number;
  requiresPayment: boolean;
  telechargements: number;
}

export interface PaymentAccess {
  requiresPayment: boolean;
  hasAccess: boolean;
  montant: number;
  devise?: string;
  expiresAt?: string | null;
}

export interface PaymentInit {
  id: string;
  reference: string;
  montant: number;
  methode: "flooz" | "tmoney";
  instructions: {
    titre: string;
    etapes: string[];
    ussd: string;
  };
  alreadyPaid?: boolean;
}

export interface AdminStats {
  epreuvesValidees: number;
  corrigesTypes: number;
  epreuvesArchivees: number;
  soumissionsEnAttente: number;
  utilisateurs: number;
  telechargements: number;
  telechargementsCorriges: number;
  paiementsConfirmes: number;
  revenusFcfa: number;
  revenusExamensFcfa: number;
  revenusCorrigesFcfa: number;
  etablissements: number;
  parType: { type: string; count: number }[];
  parExamen: { examen: string; count: number }[];
  recentDownloads: number;
  retraitsEnAttente: number;
  demandesSoutienNouvelles?: number;
  demandesEtablissementNouvelles?: number;
  portefeuilleSoldeTotal?: number;
  retraitsMontantEnAttente?: number;
  retraitsPayesMontant?: number;
  downloadsByDay: { jour: string; count: number }[];
  paymentsByDay: { jour: string; count: number; revenus: number }[];
  revenusParType: { type: string; paiements: number; revenus: number }[];
  parMethode: { methode: string; count: number; revenus: number }[];
  topMatieres: { matiere: string; count: number }[];
}

export interface DownloadHistory {
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
  epreuveParentId?: string | null;
  telechargeLe: string;
}

export interface LibraryItem extends DownloadHistory {
  acheteLe?: string;
  source?: "achat" | "gratuit";
}

export interface UserLibrary {
  paid: LibraryItem[];
  free: LibraryItem[];
}

export interface UserFavoris {
  ids: string[];
}

export interface UserFavorisList {
  items: Epreuve[];
}

export interface SoumissionHistory {
  id: string;
  titre: string;
  matiere: string;
  classe: string;
  annee: number;
  type: TypeEpreuve;
  examen?: ExamenNational;
  etablissement?: string;
  ville: Ville;
  statut: "en_attente" | "validee" | "rejetee";
  motifRejet?: string;
  soumisLe: string;
  epreuveId?: string | null;
}

export interface SoumissionDetail extends SoumissionHistory {
  niveau: Niveau;
  periode?: Periode;
  pdfPreviewUrl: string;
  pages?: number | null;
  doublonsPotentiels?: string[];
}

export interface WalletTransaction {
  id: string;
  type: "credit" | "debit";
  montant: number;
  description: string;
  reference?: string | null;
  creeLe: string;
}

export interface RetraitRequest {
  id: string;
  montant: number;
  methode: "flooz" | "tmoney";
  telephone: string;
  statut: "en_attente" | "approuve" | "rejete" | "paye";
  motifRejet?: string | null;
  creeLe: string;
  traiteLe?: string | null;
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
  transactions: WalletTransaction[];
  retraits: RetraitRequest[];
}

export interface AdminRetrait extends RetraitRequest {
  user: { id: string; nom: string; email: string };
}

export interface PaymentHistory {
  id: string;
  montant: number;
  methode: "flooz" | "tmoney";
  reference: string;
  statut: "en_attente" | "confirme" | "echec" | "expire";
  creeLe: string;
  confirmeLe?: string;
  epreuve: { id: string; titre: string; matiere: string; examen?: ExamenNational };
}

export interface AdminUser {
  id: string;
  nom: string;
  email: string;
  role: Role;
  ville?: string;
  createdAt: string;
}

export interface AdminUserDetail extends AdminUser {
  telephone?: string | null;
}

export interface AdminUserEvent {
  type: "soumission" | "portefeuille" | "retrait" | "telechargement";
  date: string;
  label: string;
  detail: string;
  statut?: string | null;
}

export interface AdminUserStats {
  userId: string;
  nom: string;
  soumissions: {
    total: number;
    enAttente: number;
    validees: number;
    rejetees: number;
  };
  portefeuille: ContributorWallet;
  telechargements: number;
  paiements: { total: number; confirmes: number; enAttente: number };
  retraits: { total: number; enAttente: number; payes: number; rejetes: number };
  epreuvesPubliees: number;
  evenements: AdminUserEvent[];
}

export interface Soumission {
  id: string;
  titre: string;
  matiere: string;
  niveau: Niveau;
  classe: Classe;
  annee: number;
  type: TypeEpreuve;
  periode?: Periode;
  examen?: ExamenNational;
  etablissement?: string;
  ville: Ville;
  images: string[];
  pages?: number | null;
  storagePath?: string;
  pdfPreviewUrl: string;
  soumisPar: string;
  soumisLe: string;
  statut: "en_attente" | "validee" | "rejetee";
  motifRejet?: string;
  doublonsPotentiels?: string[];
}

export interface ArchiveBrowseResult {
  root: "epreuves" | "soumissions";
  path: string;
  breadcrumbs: { label: string; path: string }[];
  folders: { name: string; label: string; path: string }[];
  files: {
    name: string;
    path: string;
    relPath: string;
    type: "pdf" | "image" | "file";
    size: number;
    url: string;
  }[];
}

export interface FaqCategory {
  slug: string;
  label: string;
  count: number;
}

export interface FaqItem {
  id: string;
  category: string;
  categoryLabel: string;
  question: string;
  answer: string;
  helpfulYes: number;
  helpfulNo: number;
  yourVote: boolean | null;
}

export interface FaqResponse {
  categories: FaqCategory[];
  items: FaqItem[];
  total: number;
  totalAll: number;
}

export interface ContactInfo {
  email: string;
  telephone: string;
  adresse: string;
  horaires: string;
  whatsapp?: string;
}

export type PartenaireType = "etablissement" | "entreprise" | "association" | "autre";

export interface Partenaire {
  id: string;
  nom: string;
  ville?: string | null;
  type: PartenaireType;
  siteWeb?: string | null;
  logoUrl?: string | null;
  ordre: number;
  visible?: boolean;
  creeLe?: string;
}

export type DemandeSoutienType = "partenariat" | "sponsor" | "don" | "mecenat" | "autre";
export type DemandeSoutienStatut = "nouvelle" | "en_cours" | "acceptee" | "refusee" | "archivee";

export interface DemandeSoutien {
  id: string;
  nom: string;
  email: string;
  telephone?: string | null;
  organisation?: string | null;
  type: DemandeSoutienType;
  message: string;
  statut: DemandeSoutienStatut;
  lu: boolean;
  notesAdmin?: string | null;
  creeLe: string;
  traiteLe?: string | null;
}

export type DemandeEtablissementType = "collaboration" | "modification" | "retrait" | "autre";
export type DemandeEtablissementStatut = "nouvelle" | "en_cours" | "traitee" | "archivee";

export interface DemandeEtablissement {
  id: string;
  nomEtablissement: string;
  ville: string;
  nomContact: string;
  email: string;
  telephone?: string | null;
  fonction?: string | null;
  typeDemande: DemandeEtablissementType;
  message: string;
  statut: DemandeEtablissementStatut;
  lu: boolean;
  notesAdmin?: string | null;
  creeLe: string;
  traiteLe?: string | null;
}

export interface MetaClasses {
  college: string[];
  lycee: string[];
}

export interface ReferentielItem {
  key: string;
  label: string;
}

export interface AdminReferentielClasses {
  college: ReferentielItem[];
  lycee: ReferentielItem[];
}

export interface AdminReferentiels {
  villes: ReferentielItem[];
  matieres: ReferentielItem[];
  classes: AdminReferentielClasses;
  dbReady: boolean;
}

export interface AdminReferentielUpdate {
  op: "add" | "remove";
  type: "classe" | "matiere" | "ville";
  nom: string;
  niveau?: Niveau;
  ordre?: number;
}

export interface PublicMeta {
  villes: Ville[];
  matieres: string[];
  classes: MetaClasses;
  etablissements: { nom: string; ville: string; niveau: Niveau | "mixte" }[];
  stats: {
    epreuvesValidees: number;
    etablissements: number;
    telechargements: number;
    contributeurs: number;
  };
  pricing: PublicPricing;
}

export interface PricingPromo {
  active: boolean;
  label: string | null;
  pourcentage: number | null;
  prixFixe: number | null;
  fin: string | null;
  appliqueExamens?: boolean;
  appliqueCorriges?: boolean;
}

export interface PublicPricing {
  prixExamenNational: number;
  prixCorrigeType: number;
  prixExamenEffectif: number;
  prixCorrigeEffectif: number;
  promo: PricingPromo | null;
  epreuvesParRecompense: number;
  montantRecompense: number;
  minRetrait: number;
}

export interface PlatformSettings {
  prixExamenNational: number;
  prixCorrigeType: number;
  epreuvesParRecompense: number;
  montantRecompense: number;
  minRetrait: number;
  promo: {
    active: boolean;
    label: string | null;
    pourcentage: number | null;
    prixFixe: number | null;
    debut: string | null;
    fin: string | null;
    appliqueExamens: boolean;
    appliqueCorriges: boolean;
  };
  contact: ContactInfo;
  pricingEffectif: PublicPricing;
  updatedAt: string | null;
}

export type Role = "visiteur" | "utilisateur" | "gestionnaire" | "admin";

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

export interface NotificationRule {
  id: string;
  code: string;
  libelle: string;
  description: string | null;
  declencheur: string;
  declencheurLabel: string;
  canal: "in_app" | "push" | "email";
  destinataire: "utilisateur" | "gestionnaire" | "admin";
  titre: string;
  corps: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface NotificationConfig {
  preferences: NotificationPreferences;
  vapidPublicKey: string | null;
  pushSupported: boolean;
  inbox: InboxNotification[];
  unreadCount: number;
  rulesReady: boolean;
}

export interface NotificationRulesMeta {
  rules: NotificationRule[];
  declencheurs: Record<string, string>;
  canaux: string[];
  destinataires: string[];
  dbReady: boolean;
  message?: string;
}

export interface UpdateProfilePayload {
  nom: string;
  email: string;
  telephone: string;
  ville?: string | null;
  currentPassword?: string;
  password?: string;
}
