// Types métier EZOA-TO — parité avec mobile-expo-legacy/src/shared/types

typedef Ville = String;
typedef Niveau = String; // college | lycee
typedef TypeEpreuve = String; // devoir | composition | examen | corrige
typedef ExamenNational = String; // CEPD | BEPC | BAC1 | BAC2
typedef StatutEpreuve = String;
typedef Role = String;

/// Rôles backend (`users.role`) — voir `backend-php/admin.php`.
const Role kRoleUtilisateur = 'utilisateur';
const Role kRoleGestionnaire = 'gestionnaire';
const Role kRoleAdmin = 'admin';

const String kMobileAccessDeniedMessage =
    "L'application mobile est réservée aux utilisateurs. Les administrateurs doivent utiliser la version web.";

/// Rôles interdits sur l'app mobile (réservée aux comptes `utilisateur`).
bool isMobileAccessDeniedRole(String role) =>
    role == kRoleAdmin || role == kRoleGestionnaire;

class Epreuve {
  const Epreuve({
    required this.id,
    required this.titre,
    required this.matiere,
    required this.niveau,
    required this.classe,
    required this.annee,
    required this.type,
    required this.ville,
    required this.pdfUrl,
    required this.pages,
    required this.tailleKo,
    required this.telechargements,
    required this.soumisPar,
    required this.soumisLe,
    required this.statut,
    this.examen,
    this.etablissement,
    this.pdfPreviewUrl,
    this.thumbnailUrl,
    this.requiresPayment,
    this.prixFcfa,
  });

  factory Epreuve.fromJson(Map<String, dynamic> json) {
    return Epreuve(
      id: json['id'] as String,
      titre: json['titre'] as String,
      matiere: json['matiere'] as String,
      niveau: json['niveau'] as String,
      classe: json['classe'] as String,
      annee: (json['annee'] as num).toInt(),
      type: json['type'] as String,
      ville: json['ville'] as String,
      pdfUrl: json['pdfUrl'] as String,
      pages: (json['pages'] as num).toInt(),
      tailleKo: (json['tailleKo'] as num).toInt(),
      telechargements: (json['telechargements'] as num?)?.toInt() ?? 0,
      soumisPar: json['soumisPar'] as String,
      soumisLe: json['soumisLe'] as String,
      statut: json['statut'] as String,
      examen: json['examen'] as String?,
      etablissement: json['etablissement'] as String?,
      pdfPreviewUrl: json['pdfPreviewUrl'] as String?,
      thumbnailUrl: json['thumbnailUrl'] as String?,
      requiresPayment: json['requiresPayment'] as bool?,
      prixFcfa: (json['prixFcfa'] as num?)?.toInt(),
    );
  }

  final String id;
  final String titre;
  final String matiere;
  final String niveau;
  final String classe;
  final int annee;
  final String type;
  final String? examen;
  final String? etablissement;
  final String ville;
  final String pdfUrl;
  final String? pdfPreviewUrl;
  final String? thumbnailUrl;
  final int pages;
  final int tailleKo;
  final int telechargements;
  final String soumisPar;
  final String soumisLe;
  final String statut;
  final bool? requiresPayment;
  final int? prixFcfa;
}

class User {
  const User({
    required this.id,
    required this.nom,
    required this.email,
    required this.role,
    this.telephone,
    this.ville,
    this.createdAt,
  });

  factory User.fromJson(Map<String, dynamic> json) {
    return User(
      id: json['id'] as String,
      nom: json['nom'] as String,
      email: json['email'] as String,
      role: json['role'] as String,
      telephone: json['telephone'] as String?,
      ville: json['ville'] as String?,
      createdAt: json['createdAt'] as String?,
    );
  }

  final String id;
  final String nom;
  final String email;
  final String? telephone;
  final String role;
  final String? ville;
  final String? createdAt;
}

class UserProfile extends User {
  const UserProfile({
    required super.id,
    required super.nom,
    required super.email,
    required super.role,
    required this.createdAtProfile,
    super.telephone,
    super.ville,
    super.createdAt,
  });

  factory UserProfile.fromJson(Map<String, dynamic> json) {
    final created = json['createdAt'] as String;
    return UserProfile(
      id: json['id'] as String,
      nom: json['nom'] as String,
      email: json['email'] as String,
      role: json['role'] as String,
      telephone: json['telephone'] as String?,
      ville: json['ville'] as String?,
      createdAt: created,
      createdAtProfile: created,
    );
  }

  final String createdAtProfile;
}

class NotificationPreferences {
  const NotificationPreferences({
    this.userId,
    this.soumissions = true,
    this.retraits = true,
    this.paiements = true,
    this.moderation = true,
    this.marketing = false,
    this.pushEnabled = false,
  });

  factory NotificationPreferences.fromJson(Map<String, dynamic> json) {
    return NotificationPreferences(
      userId: json['userId'] as String?,
      soumissions: json['soumissions'] as bool? ?? true,
      retraits: json['retraits'] as bool? ?? true,
      paiements: json['paiements'] as bool? ?? true,
      moderation: json['moderation'] as bool? ?? true,
      marketing: json['marketing'] as bool? ?? false,
      pushEnabled: json['pushEnabled'] as bool? ?? false,
    );
  }

  final String? userId;
  final bool soumissions;
  final bool retraits;
  final bool paiements;
  final bool moderation;
  final bool marketing;
  final bool pushEnabled;

  Map<String, dynamic> toJson() => {
        if (userId != null) 'userId': userId,
        'soumissions': soumissions,
        'retraits': retraits,
        'paiements': paiements,
        'moderation': moderation,
        'marketing': marketing,
        'pushEnabled': pushEnabled,
      };
}

class InboxNotification {
  const InboxNotification({
    required this.id,
    required this.titre,
    required this.corps,
    required this.lu,
    required this.createdAt,
    this.url,
  });

  factory InboxNotification.fromJson(Map<String, dynamic> json) {
    return InboxNotification(
      id: json['id'] as String,
      titre: json['titre'] as String,
      corps: json['corps'] as String,
      url: json['url'] as String?,
      lu: json['lu'] as bool,
      createdAt: json['createdAt'] as String,
    );
  }

  final String id;
  final String titre;
  final String corps;
  final String? url;
  final bool lu;
  final String createdAt;
}

class NotificationConfig {
  const NotificationConfig({
    required this.preferences,
    required this.inbox,
    required this.unreadCount,
    required this.pushSupported,
    required this.rulesReady,
    this.vapidPublicKey,
  });

  factory NotificationConfig.fromJson(Map<String, dynamic> json) {
    return NotificationConfig(
      preferences: NotificationPreferences.fromJson(
        json['preferences'] as Map<String, dynamic>,
      ),
      vapidPublicKey: json['vapidPublicKey'] as String?,
      pushSupported: json['pushSupported'] as bool? ?? false,
      inbox: (json['inbox'] as List<dynamic>? ?? [])
          .map((e) => InboxNotification.fromJson(e as Map<String, dynamic>))
          .toList(),
      unreadCount: (json['unreadCount'] as num?)?.toInt() ?? 0,
      rulesReady: json['rulesReady'] as bool? ?? false,
    );
  }

  final NotificationPreferences preferences;
  final String? vapidPublicKey;
  final bool pushSupported;
  final List<InboxNotification> inbox;
  final int unreadCount;
  final bool rulesReady;
}

class LibraryItem {
  const LibraryItem({
    required this.id,
    required this.titre,
    required this.matiere,
    required this.classe,
    required this.annee,
    required this.type,
    required this.ville,
    required this.pages,
    required this.tailleKo,
    this.telechargements = 0,
    this.examen,
    this.telechargeLe,
    this.acheteLe,
    this.source,
  });

  factory LibraryItem.fromJson(Map<String, dynamic> json) {
    return LibraryItem(
      id: json['id'] as String,
      titre: json['titre'] as String,
      matiere: json['matiere'] as String,
      classe: json['classe'] as String,
      annee: (json['annee'] as num).toInt(),
      type: json['type'] as String,
      examen: json['examen'] as String?,
      ville: json['ville'] as String,
      pages: (json['pages'] as num).toInt(),
      tailleKo: (json['tailleKo'] as num).toInt(),
      telechargements: (json['telechargements'] as num?)?.toInt() ?? 0,
      telechargeLe: json['telechargeLe'] as String?,
      acheteLe: json['acheteLe'] as String?,
      source: json['source'] as String?,
    );
  }

  final String id;
  final String titre;
  final String matiere;
  final String classe;
  final int annee;
  final String type;
  final String? examen;
  final String ville;
  final int pages;
  final int tailleKo;
  final int telechargements;
  final String? telechargeLe;
  final String? acheteLe;
  final String? source;
}

class UserLibrary {
  const UserLibrary({required this.paid, required this.free});

  factory UserLibrary.fromJson(Map<String, dynamic> json) {
    return UserLibrary(
      paid: (json['paid'] as List<dynamic>? ?? [])
          .map((e) => LibraryItem.fromJson(e as Map<String, dynamic>))
          .toList(),
      free: (json['free'] as List<dynamic>? ?? [])
          .map((e) => LibraryItem.fromJson(e as Map<String, dynamic>))
          .toList(),
    );
  }

  final List<LibraryItem> paid;
  final List<LibraryItem> free;
}

class ContributorWallet {
  const ContributorWallet({
    required this.solde,
    required this.epreuvesValidees,
    required this.paliersVerses,
    required this.prochainPalier,
    required this.progressionPalier,
    required this.epreuvesParRecompense,
    required this.montantRecompense,
    required this.minRetrait,
    required this.peutRetirer,
    required this.transactions,
    required this.retraits,
  });

  factory ContributorWallet.fromJson(Map<String, dynamic> json) {
    return ContributorWallet(
      solde: (json['solde'] as num).toDouble(),
      epreuvesValidees: (json['epreuvesValidees'] as num).toInt(),
      paliersVerses: (json['paliersVerses'] as num).toInt(),
      prochainPalier: (json['prochainPalier'] as num).toInt(),
      progressionPalier: (json['progressionPalier'] as num).toInt(),
      epreuvesParRecompense: (json['epreuvesParRecompense'] as num).toInt(),
      montantRecompense: (json['montantRecompense'] as num).toInt(),
      minRetrait: (json['minRetrait'] as num).toInt(),
      peutRetirer: json['peutRetirer'] as bool,
      transactions: (json['transactions'] as List<dynamic>? ?? [])
          .map((e) => WalletTransaction.fromJson(e as Map<String, dynamic>))
          .toList(),
      retraits: (json['retraits'] as List<dynamic>? ?? [])
          .map((e) => WalletRetrait.fromJson(e as Map<String, dynamic>))
          .toList(),
    );
  }

  final double solde;
  final int epreuvesValidees;
  final int paliersVerses;
  final int prochainPalier;
  final int progressionPalier;
  final int epreuvesParRecompense;
  final int montantRecompense;
  final int minRetrait;
  final bool peutRetirer;
  final List<WalletTransaction> transactions;
  final List<WalletRetrait> retraits;
}

class WalletTransaction {
  const WalletTransaction({
    required this.id,
    required this.type,
    required this.montant,
    required this.description,
    required this.creeLe,
  });

  factory WalletTransaction.fromJson(Map<String, dynamic> json) {
    return WalletTransaction(
      id: json['id'] as String,
      type: json['type'] as String,
      montant: (json['montant'] as num).toInt(),
      description: json['description'] as String,
      creeLe: json['creeLe'] as String,
    );
  }

  final String id;
  final String type;
  final int montant;
  final String description;
  final String creeLe;
}

class WalletRetrait {
  const WalletRetrait({
    required this.id,
    required this.montant,
    required this.methode,
    required this.statut,
    required this.creeLe,
  });

  factory WalletRetrait.fromJson(Map<String, dynamic> json) {
    return WalletRetrait(
      id: json['id'] as String,
      montant: (json['montant'] as num).toInt(),
      methode: json['methode'] as String,
      statut: json['statut'] as String,
      creeLe: json['creeLe'] as String,
    );
  }

  final String id;
  final int montant;
  final String methode;
  final String statut;
  final String creeLe;
}

class PublicMeta {
  const PublicMeta({
    required this.villes,
    required this.matieres,
    required this.stats,
    this.classes = const MetaClasses(),
    this.types = kDefaultTypes,
    this.periodes = kDefaultPeriodes,
    this.examens = kDefaultExamens,
  });

  /// Replis si l'API ne renvoie pas (encore) ces référentiels.
  static const kDefaultTypes = ['devoir', 'composition', 'examen'];
  static const kDefaultPeriodes = ['T1', 'T2', 'T3', 'S1', 'S2'];
  static const kDefaultExamens = ['CEPD', 'BEPC', 'BAC1', 'BAC2'];

  factory PublicMeta.fromJson(Map<String, dynamic> json) {
    List<String> strings(String key, List<String> fallback) {
      final raw = json[key];
      if (raw is! List || raw.isEmpty) return fallback;
      return raw.map((e) => e as String).toList();
    }

    return PublicMeta(
      villes: (json['villes'] as List<dynamic>).map((e) => e as String).toList(),
      matieres: (json['matieres'] as List<dynamic>).map((e) => e as String).toList(),
      stats: PublicStats.fromJson(json['stats'] as Map<String, dynamic>),
      classes: json['classes'] is Map<String, dynamic>
          ? MetaClasses.fromJson(json['classes'] as Map<String, dynamic>)
          : const MetaClasses(),
      types: strings('types', kDefaultTypes),
      periodes: strings('periodes', kDefaultPeriodes),
      examens: strings('examens', kDefaultExamens),
    );
  }

  final List<String> villes;
  final List<String> matieres;
  final PublicStats stats;
  final MetaClasses classes;

  /// Référentiels du formulaire de soumission (`GET /meta`).
  final List<String> types;
  final List<String> periodes;
  final List<String> examens;
}

/// Classes par niveau renvoyées par `GET /meta` (`classes.college` / `classes.lycee`).
class MetaClasses {
  const MetaClasses({this.college = const [], this.lycee = const []});

  factory MetaClasses.fromJson(Map<String, dynamic> json) {
    return MetaClasses(
      college: (json['college'] as List<dynamic>? ?? []).map((e) => e as String).toList(),
      lycee: (json['lycee'] as List<dynamic>? ?? []).map((e) => e as String).toList(),
    );
  }

  final List<String> college;
  final List<String> lycee;

  List<String> forNiveau(String niveau) => niveau == 'lycee' ? lycee : college;
}

class PublicStats {
  const PublicStats({
    required this.epreuvesValidees,
    required this.etablissements,
    required this.telechargements,
    required this.contributeurs,
  });

  factory PublicStats.fromJson(Map<String, dynamic> json) {
    return PublicStats(
      epreuvesValidees: (json['epreuvesValidees'] as num).toInt(),
      etablissements: (json['etablissements'] as num).toInt(),
      telechargements: (json['telechargements'] as num).toInt(),
      contributeurs: (json['contributeurs'] as num).toInt(),
    );
  }

  final int epreuvesValidees;
  final int etablissements;
  final int telechargements;
  final int contributeurs;
}

class PageResult<T> {
  const PageResult({
    required this.items,
    required this.total,
    required this.page,
    required this.perPage,
  });

  factory PageResult.fromJson(
    Map<String, dynamic> json,
    T Function(Map<String, dynamic>) fromJsonT,
  ) {
    return PageResult(
      items: (json['items'] as List<dynamic>)
          .map((e) => fromJsonT(e as Map<String, dynamic>))
          .toList(),
      total: (json['total'] as num).toInt(),
      page: (json['page'] as num).toInt(),
      perPage: (json['perPage'] as num).toInt(),
    );
  }

  final List<T> items;
  final int total;
  final int page;
  final int perPage;

  /// Pages suivantes disponibles (calculé côté client : pas de champ `hasMore` API).
  bool get hasMore => page * perPage < total;
}

class ListEpreuvesParams {
  const ListEpreuvesParams({
    this.q,
    this.ville,
    this.matiere,
    this.niveau,
    this.classe,
    this.type,
    this.annee,
    this.examen,
    this.page,
    this.perPage,
  });

  final String? q;
  final String? ville;
  final String? matiere;
  final String? niveau;
  final String? classe;
  final String? type;
  final int? annee;
  final String? examen;
  final int? page;
  final int? perPage;

  Map<String, String> toQuery() {
    final map = <String, String>{};
    if (q != null && q!.isNotEmpty) map['q'] = q!;
    if (ville != null && ville!.isNotEmpty) map['ville'] = ville!;
    if (matiere != null && matiere!.isNotEmpty) map['matiere'] = matiere!;
    if (niveau != null && niveau!.isNotEmpty) map['niveau'] = niveau!;
    if (classe != null && classe!.isNotEmpty) map['classe'] = classe!;
    if (type != null && type!.isNotEmpty) map['type'] = type!;
    if (annee != null) map['annee'] = annee.toString();
    if (examen != null && examen!.isNotEmpty) map['examen'] = examen!;
    if (page != null) map['page'] = page.toString();
    if (perPage != null) map['perPage'] = perPage.toString();
    return map;
  }
}

class OfflineEpreuve {
  const OfflineEpreuve({
    required this.id,
    required this.titre,
    required this.matiere,
    required this.metadata,
    required this.localPdfPath,
    required this.downloadedAt,
  });

  final String id;
  final String titre;
  final String matiere;
  final String metadata;
  final String localPdfPath;
  final String downloadedAt;
}

/// Instructions USSD renvoyées par `POST /paiements/initier`.
class PaymentInstructions {
  const PaymentInstructions({
    required this.titre,
    required this.etapes,
    required this.ussd,
  });

  factory PaymentInstructions.fromJson(Map<String, dynamic> json) {
    return PaymentInstructions(
      titre: json['titre'] as String,
      etapes: (json['etapes'] as List<dynamic>? ?? []).map((e) => e as String).toList(),
      ussd: json['ussd'] as String? ?? '',
    );
  }

  final String titre;
  final List<String> etapes;
  final String ussd;
}

/// Réponse de `POST /paiements/initier`.
class PaymentInit {
  const PaymentInit({
    this.id,
    this.reference,
    this.montant,
    this.methode,
    this.instructions,
    this.alreadyPaid = false,
  });

  factory PaymentInit.fromJson(Map<String, dynamic> json) {
    return PaymentInit(
      id: json['id'] as String?,
      reference: json['reference'] as String?,
      montant: (json['montant'] as num?)?.toInt(),
      methode: json['methode'] as String?,
      instructions: json['instructions'] is Map<String, dynamic>
          ? PaymentInstructions.fromJson(json['instructions'] as Map<String, dynamic>)
          : null,
      alreadyPaid: json['alreadyPaid'] as bool? ?? false,
    );
  }

  final String? id;
  final String? reference;
  final int? montant;
  final String? methode;
  final PaymentInstructions? instructions;
  final bool alreadyPaid;
}

/// Réponse de `POST /soumissions`.
class SoumissionResult {
  const SoumissionResult({
    required this.id,
    required this.pages,
    required this.tailleKo,
    this.doublonsPotentiels = const [],
  });

  factory SoumissionResult.fromJson(Map<String, dynamic> json) {
    return SoumissionResult(
      id: json['id'] as String,
      pages: (json['pages'] as num?)?.toInt() ?? 0,
      tailleKo: (json['tailleKo'] as num?)?.toInt() ?? 0,
      doublonsPotentiels: (json['doublonsPotentiels'] as List<dynamic>? ?? [])
          .map((e) => e as String)
          .toList(),
    );
  }

  final String id;
  final int pages;
  final int tailleKo;
  final List<String> doublonsPotentiels;
}

/// Élément de `GET /account/soumissions` (liste « Mes soumissions »).
class SoumissionHistory {
  const SoumissionHistory({
    required this.id,
    required this.titre,
    required this.matiere,
    required this.classe,
    required this.annee,
    required this.type,
    required this.ville,
    required this.statut,
    required this.soumisLe,
    this.examen,
    this.etablissement,
    this.motifRejet,
    this.epreuveId,
  });

  factory SoumissionHistory.fromJson(Map<String, dynamic> json) {
    return SoumissionHistory(
      id: json['id'] as String,
      titre: json['titre'] as String? ?? '',
      matiere: json['matiere'] as String? ?? '',
      classe: json['classe'] as String? ?? '',
      annee: (json['annee'] as num?)?.toInt() ?? 0,
      type: json['type'] as String? ?? '',
      examen: json['examen'] as String?,
      etablissement: json['etablissement'] as String?,
      ville: json['ville'] as String? ?? '',
      statut: json['statut'] as String? ?? 'en_attente',
      motifRejet: json['motifRejet'] as String?,
      soumisLe: json['soumisLe'] as String? ?? '',
      epreuveId: json['epreuveId'] as String?,
    );
  }

  final String id;
  final String titre;
  final String matiere;
  final String classe;
  final int annee;
  final String type;
  final String? examen;
  final String? etablissement;
  final String ville;
  final String statut; // en_attente | validee | rejetee
  final String? motifRejet;
  final String soumisLe;
  final String? epreuveId;
}

/// Détail de `GET /account/soumissions/{id}` (champs supplémentaires).
class SoumissionDetail extends SoumissionHistory {
  const SoumissionDetail({
    required super.id,
    required super.titre,
    required super.matiere,
    required super.classe,
    required super.annee,
    required super.type,
    required super.ville,
    required super.statut,
    required super.soumisLe,
    required this.niveau,
    super.examen,
    super.etablissement,
    super.motifRejet,
    super.epreuveId,
    this.periode,
    this.pdfPreviewUrl,
    this.pages,
    this.doublonsPotentiels = const [],
  });

  factory SoumissionDetail.fromJson(Map<String, dynamic> json) {
    return SoumissionDetail(
      id: json['id'] as String,
      titre: json['titre'] as String? ?? '',
      matiere: json['matiere'] as String? ?? '',
      classe: json['classe'] as String? ?? '',
      annee: (json['annee'] as num?)?.toInt() ?? 0,
      type: json['type'] as String? ?? '',
      examen: json['examen'] as String?,
      etablissement: json['etablissement'] as String?,
      ville: json['ville'] as String? ?? '',
      statut: json['statut'] as String? ?? 'en_attente',
      motifRejet: json['motifRejet'] as String?,
      soumisLe: json['soumisLe'] as String? ?? '',
      epreuveId: json['epreuveId'] as String?,
      niveau: json['niveau'] as String? ?? '',
      periode: json['periode'] as String?,
      pdfPreviewUrl: json['pdfPreviewUrl'] as String?,
      pages: (json['pages'] as num?)?.toInt(),
      doublonsPotentiels: (json['doublonsPotentiels'] as List<dynamic>? ?? [])
          .map((e) => e as String)
          .toList(),
    );
  }

  final String niveau;
  final String? periode;
  final String? pdfPreviewUrl;
  final int? pages;
  final List<String> doublonsPotentiels;
}

/// Élément de `GET /account/paiements` (historique des paiements).
class PaymentHistory {
  const PaymentHistory({
    required this.id,
    required this.montant,
    required this.methode,
    required this.reference,
    required this.statut,
    required this.creeLe,
    required this.epreuveId,
    required this.epreuveTitre,
    required this.epreuveMatiere,
    this.confirmeLe,
    this.epreuveExamen,
  });

  factory PaymentHistory.fromJson(Map<String, dynamic> json) {
    final epreuve = json['epreuve'] as Map<String, dynamic>? ?? const {};
    return PaymentHistory(
      id: json['id'] as String,
      montant: (json['montant'] as num?)?.toInt() ?? 0,
      methode: json['methode'] as String? ?? '',
      reference: json['reference'] as String? ?? '',
      statut: json['statut'] as String? ?? 'en_attente',
      creeLe: json['creeLe'] as String? ?? '',
      confirmeLe: json['confirmeLe'] as String?,
      epreuveId: epreuve['id'] as String? ?? '',
      epreuveTitre: epreuve['titre'] as String? ?? '',
      epreuveMatiere: epreuve['matiere'] as String? ?? '',
      epreuveExamen: epreuve['examen'] as String?,
    );
  }

  final String id;
  final int montant;
  final String methode; // flooz | tmoney
  final String reference;
  final String statut; // en_attente | confirme | echec | expire
  final String creeLe;
  final String? confirmeLe;
  final String epreuveId;
  final String epreuveTitre;
  final String epreuveMatiere;
  final String? epreuveExamen;
}

/// Élément de `GET /account/downloads` (historique des téléchargements).
class DownloadHistoryItem {
  const DownloadHistoryItem({
    required this.id,
    required this.titre,
    required this.matiere,
    required this.classe,
    required this.annee,
    required this.type,
    required this.ville,
    required this.pages,
    required this.tailleKo,
    required this.telechargeLe,
    this.examen,
  });

  factory DownloadHistoryItem.fromJson(Map<String, dynamic> json) {
    return DownloadHistoryItem(
      id: json['id'] as String,
      titre: json['titre'] as String? ?? '',
      matiere: json['matiere'] as String? ?? '',
      classe: json['classe'] as String? ?? '',
      annee: (json['annee'] as num?)?.toInt() ?? 0,
      type: json['type'] as String? ?? '',
      examen: json['examen'] as String?,
      ville: json['ville'] as String? ?? '',
      pages: (json['pages'] as num?)?.toInt() ?? 0,
      tailleKo: (json['tailleKo'] as num?)?.toInt() ?? 0,
      telechargeLe: json['telechargeLe'] as String? ?? '',
    );
  }

  final String id;
  final String titre;
  final String matiere;
  final String classe;
  final int annee;
  final String type;
  final String? examen;
  final String ville;
  final int pages;
  final int tailleKo;
  final String telechargeLe;
}

class PaymentAccess {
  const PaymentAccess({
    required this.requiresPayment,
    required this.hasAccess,
    required this.montant,
    this.devise,
    this.expiresAt,
    this.hasSubscription = false,
  });

  factory PaymentAccess.fromJson(Map<String, dynamic> json) {
    return PaymentAccess(
      requiresPayment: json['requiresPayment'] as bool,
      hasAccess: json['hasAccess'] as bool,
      montant: (json['montant'] as num).toInt(),
      devise: json['devise'] as String?,
      expiresAt: json['expiresAt'] as String?,
      hasSubscription: json['hasSubscription'] as bool? ?? false,
    );
  }

  final bool requiresPayment;
  final bool hasAccess;
  final int montant;
  final String? devise;
  final String? expiresAt;
  final bool hasSubscription;
}

/// Statut abonnement plateforme (`GET /account/abonnement/status`).
class SubscriptionStatus {
  const SubscriptionStatus({
    required this.actif,
    this.dateDebut,
    this.dateFin,
    required this.joursRestants,
    required this.montant,
    required this.dureeMois,
  });

  factory SubscriptionStatus.fromJson(Map<String, dynamic> json) {
    return SubscriptionStatus(
      actif: json['actif'] as bool? ?? false,
      dateDebut: json['dateDebut'] as String?,
      dateFin: json['dateFin'] as String?,
      joursRestants: (json['joursRestants'] as num?)?.toInt() ?? 0,
      montant: (json['montant'] as num?)?.toInt() ?? 1000,
      dureeMois: (json['dureeMois'] as num?)?.toInt() ?? 6,
    );
  }

  final bool actif;
  final String? dateDebut;
  final String? dateFin;
  final int joursRestants;
  final int montant;
  final int dureeMois;
}
