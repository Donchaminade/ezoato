# EZOA-TO Mobile (Flutter)

Application mobile **Flutter** pour consulter, télécharger et gérer les épreuves scolaires du Togo, avec support **hors ligne** pour les PDF téléchargés.

> L'ancienne app **Expo** est archivée dans `mobile-expo-legacy/`.

## Prérequis

- [Flutter SDK](https://docs.flutter.dev/get-started/install) 3.x (Dart 3.10+)
- Android Studio / Xcode (émulateurs) ou appareil physique
- Backend PHP EZOA-TO en cours d'exécution (XAMPP)

### Installation Flutter (si absent)

```bash
# Windows — via winget ou téléchargement manuel
winget install Google.Flutter

# Vérifier
flutter doctor
```

## Installation

```bash
cd mobile
# .env.example = référence des dart-define (non chargé automatiquement)
flutter pub get
dart run flutter_launcher_icons
dart run flutter_native_splash:create
flutter run
```

Depuis la racine du monorepo :

```bash
npm run mobile:flutter
npm run mobile:flutter:analyze
```

### Comptes de test

Mot de passe commun : **`Tea2026!`**

| Rôle | Email | Accès mobile |
|------|-------|--------------|
| Contributeur (`utilisateur`) | `afi@tea.test` | ✅ Autorisé |
| Admin (`admin`) | `admin@tea.test` | ❌ Refusé — utiliser la version web |
| Gestionnaire (`gestionnaire`) | `gestion@tea.test` | ❌ Refusé — utiliser la version web |

Voir aussi `COMPTES-TEST.md` à la racine du monorepo.

### Restriction d'accès (Phase 1)

L'application mobile est **réservée aux comptes `utilisateur`** (contributeurs). Les rôles **`admin`** et **`gestionnaire`** sont refusés :

- à la **connexion** : le JWT n'est pas conservé, message en français, écran login ;
- au **redémarrage** (splash / restauration du token) : token effacé, redirection login avec le même message.

Contrôle **côté app uniquement** en Phase 1 (pas de garde dédiée sur les endpoints backend). Un renforcement serveur pourra être ajouté en Phase 2 si nécessaire.

## URL API

Configurez l'URL via `--dart-define` (recommandé) :

| Contexte | Commande |
|----------|----------|
| Émulateur Android | `flutter run --dart-define=USE_EMULATOR_HOST=true` |
| Émulateur Android (alt.) | `flutter run --dart-define=API_URL=http://10.0.2.2/zovu-project/backend-php` |
| Simulateur iOS / Windows | `flutter run --dart-define=API_URL=http://localhost/zovu-project/backend-php` |
| Appareil physique | `flutter run --dart-define=DEV_LAN_HOST=<IP-LAN>` |
| URL web (contact, reset) | `flutter run --dart-define=WEB_URL=http://localhost:5173` |

`WEB_URL` alimente `Env.webUrl` / `Env.contactUrl` (liens support, e-mails de reset).
Sans surcharge, l’app déduit l’hôte depuis `API_URL` et utilise le port Vite `5173`.

Sans `--dart-define`, l'app utilise par défaut sur Android l'**IP LAN du PC**
(`DEV_LAN_HOST`, défaut `10.14.202.205` dans `lib/core/config/env.dart`) et
`localhost` sur les autres plateformes. L'**émulateur Android** ne joint pas
l'IP LAN du PC : utilisez `USE_EMULATOR_HOST=true` ou `API_URL` avec
`10.0.2.2`. L'appareil physique doit être sur le **même réseau Wi-Fi** que le
PC, et XAMPP/Apache doit être démarré.

### Dépannage « Impossible de joindre l'API »

1. **XAMPP** : panneau de contrôle → Apache **Running**.
2. **IP du PC** : `ipconfig` → adresse **IPv4** du Wi-Fi (ex. `10.14.202.205`).
3. **Test navigateur** (sur le téléphone) :
   `http://<IP-LAN>/zovu-project/backend-php/meta` → doit renvoyer du JSON.
4. **Pare-feu Windows** : autoriser Apache (`httpd.exe`) sur le réseau privé.
5. **Relancer l'app** après changement d'IP :
   `flutter run --dart-define=DEV_LAN_HOST=<IP-LAN>`.

> Le fichier `.env` n'est **pas** lu automatiquement par Flutter : utilisez
> `--dart-define` (voir `.env.example` comme référence).

## Architecture

```
mobile/
├── lib/
│   ├── main.dart
│   ├── app.dart
│   ├── core/
│   │   ├── config/env.dart
│   │   ├── network/api_client.dart
│   │   ├── network/connectivity_service.dart
│   │   ├── storage/secure_storage.dart
│   │   ├── theme/ezoa_theme.dart
│   │   └── router/app_router.dart
│   ├── features/
│   │   ├── auth/
│   │   ├── epreuves/
│   │   ├── offline/
│   │   ├── favorites/
│   │   ├── account/
│   │   └── submit/
│   └── shared/
│       ├── widgets/
│       │   ├── ezoa_glass_card.dart
│       │   ├── ezoa_glass_header.dart
│       │   ├── ezoa_gradient_background.dart
│       │   ├── ezoa_wave_footer.dart
│       │   ├── ezoa_scroll_reveal.dart
│       │   └── ezoa_widgets.dart
│       └── models/
├── assets/images/
├── pubspec.yaml
├── .env.example
└── MOBILE.md
```

| Couche | Rôle |
|--------|------|
| `presentation/` | Écrans, widgets UI |
| `data/` | Repositories, SQLite, téléchargements |
| `core/` | API Dio, thème, routing go_router |
| `shared/` | Modèles et composants réutilisables |

## Stack technique

- **go_router** — navigation (splash → auth → shell bottom nav)
- **flutter_riverpod** — état global
- **dio** — HTTP + intercepteur JWT Bearer
- **flutter_secure_storage** — token JWT
- **sqflite** — métadonnées hors ligne
- **path_provider** + **open_filex** — stockage et ouverture PDF
- **connectivity_plus** — bannière hors ligne
- **image_picker** + **file_picker** — soumission d'épreuves (photos/PDF multipart)
- **crypto** — cert pinning (empreinte SHA-256 du certificat TLS)
- **google_fonts** — typographie (Space Grotesk, Inter, JetBrains Mono)
- **flutter_animate** + **visibility_detector** — animations scroll reveal
- **lucide_icons** — iconographie premium

## Design — Glassmorphism Premium (sombre + clair)

Thème **glassmorphism premium** sur toute l'app, en deux modes : **sombre (défaut)** et **clair**. La bascule se fait via la tuile « Apparence » du menu Compte ou l'icône soleil/lune du header de l'accueil ; la préférence est persistée (`flutter_secure_storage`) et restaurée au démarrage (`themeModeProvider` Riverpod + `EzoaTheme.light`/`EzoaTheme.dark` dans `MaterialApp.router`). Les couleurs s'adaptent via `EzoaPalette` (`EzoaColors.of(context)`), résolue selon la brightness — la charte (vert EZOA, indigo, emerald, typos) reste identique.

| Élément | Détail |
|---------|--------|
| Fond (sombre) | Dégradé zinc-950 → cobalt night (#181E30 / #1E2436) + grille 40 px (opacity ~0.02) + halos indigo/émeraude + courbes fluides discrètes |
| Fond (clair) | Dégradé zinc-50 / blanc cassé → bleu très pâle (#E3ECF8), même grille/halos/courbes adaptés (traits noirs très translucides) |
| Panneaux | `BackdropFilter` blur ; sombre : bordure white/5–10 %, ombre douce ; clair : fill blanc/70, bordures black/8–12 %, textes zinc-900/600 |
| Accent | Indigo (#A5B4FC sombre, #4F46E5 clair), vert EZOA (#006A4E) pour actions primaires, emerald pour positif |
| Typo | Space Grotesk (titres), Inter light (corps), JetBrains Mono (badges/dates) |
| Topbar | `EzoaTopBar` : bandeau glass **permanent** sur les 4 onglets du shell (logo + titre + sous-titre + action), inset barre de statut géré, contenu borné 760 px |
| Animations | Scroll reveal opacity + y 50→0 (35 petits composants), 700 ms easeOut, re-joue dans les deux sens ; shine « glossy » 1 s au press/hover sur cartes ; scale 0.97–0.98 au press (boutons/cartes) |
| Nav bottom | Capsule glass **flottante** (rayon 28, blur 24, ombre, max 560 px) |
| Vagues | `EzoaWaveFooter` (3 couches + crête indigo) **hors onglets shell uniquement** : auth et pages de détail. Sur les 4 onglets (`EzoaScreen`, `showWaveFooter: false` par défaut), la vague passerait derrière la capsule de navigation |
| Responsive | Contenu centré et borné (`EzoaContentWidth` 760 px ; auth 480 px) — téléphone, tablette, paysage, desktop |
| Auth | Formulaire centré dans carte glass + logo EZOA + vagues décoratives |

### Accueil enrichi

- **Carte portefeuille** en tête de page (en ligne uniquement ; masquée hors
  ligne ou en erreur, placeholder discret au chargement) : solde FCFA et
  barre de progression vers la prochaine récompense — données du
  `walletProvider` partagé (`features/account/data/wallet_providers.dart`),
  ombre noire marquée + lueur verte subtile, tap → `/account/portefeuille`.
- **Actions rapides** : 5 tuiles glass (Soumettre, Archives, Bibliothèque,
  Favoris, Hors ligne) avec reveal animé — `context.go` pour les branches du
  shell, `context.push` pour les pages compte ; deux lignes (3 + 2) sur écran
  étroit.
- **Mon activité** : stats de l'utilisateur connecté (soumissions validées /
  en attente, téléchargements, favoris) via `homeUserStatsProvider` qui agrège
  `mesSoumissionsProvider`, `mesDownloadsProvider` et `favorisIdsProvider` ;
  grille 2×2 sur écran étroit, repli sur les stats publiques (`metaProvider`)
  en cas d'erreur.
- **Topbar accueil** : cloche de notifications (→ `/account/notifications`) à
  côté du toggle thème.

### Bibliothèque en catalogue

`/account/bibliotheque` affiche un **catalogue produit en grille** (2 colonnes
sur téléphone, jusqu'à 3–4 sur grands écrans via
`SliverGridDelegateWithMaxCrossAxisExtent`) : zone visuelle dégradée par
matière, titre 2 lignes, badges matière/classe/année, indicateur PAYÉ/GRATUIT,
sections Achats / Gratuits conservées avec RefreshIndicator.

### Widgets réutilisables (`lib/shared/widgets/`)

- `ezoa_glass_card.dart` — carte glass avec shine au press + `EzoaGlassStat` (sans `Expanded` : le parent décide du flex)
- `ezoa_glass_header.dart` — `EzoaTopBar` (topbar permanent des onglets) + `EzoaGlassAppBar` (pages de détail)
- `ezoa_gradient_background.dart` — fond dégradé + grille + `EzoaScaffold`
- `ezoa_wave_footer.dart` — vagues décoratives en bas de page
- `ezoa_scroll_reveal.dart` — wrapper animation scroll-in
- `ezoa_theme_toggle.dart` — bascule sombre/clair (IconButton header + tuile « Apparence »)
- `ezoa_widgets.dart` — composants métier (boutons, champs, cartes épreuve, etc.)

### Assets

- `assets/images/logo-ezoa.png` — splash, login, register, headers
- `assets/images/icon-ezoa.png` — app bar compact, favicon-like


## Flux hors ligne

1. En ligne : Archives ou Détail épreuve → « Télécharger »
2. PDF via `GET /epreuves/{id}/download` (JWT)
3. Fichier dans `documents/offline-epreuves/{id}.pdf`
4. Métadonnées SQLite (`offline_epreuves`)
5. Hors ligne : Accueil et « Ma bibliothèque hors ligne » listent les entrées locales
6. Ouverture via visionneuse système (`open_filex`)

## Écrans

| Écran | Statut |
|-------|--------|
| Splash → routage auth | ✅ |
| Login / Inscription | ✅ |
| Accueil (carte portefeuille + actions rapides + stats + récentes) | ✅ |
| Archives + recherche | ✅ |
| Détail épreuve + download + favori + paiement | ✅ |
| Bibliothèque hors ligne | ✅ |
| Profil (infos + mot de passe) | ✅ |
| Favoris (liste + toggle depuis détail) | ✅ |
| Bibliothèque en ligne (catalogue en grille 2–4 colonnes, sections Achats/Gratuits) | ✅ |
| Portefeuille & gains (solde, règle de récompense, progression, retrait Flooz/TMoney) | ✅ |
| Mes soumissions (liste + statuts + détail avec motif de rejet) | ✅ |
| Historique des paiements (`GET /account/paiements`) | ✅ |
| Historique des téléchargements (`GET /account/downloads`) | ✅ |
| Notifications (inbox + prefs + toggle push) | ✅ |
| Soumettre épreuve (multipart photos/PDF) | ✅ |

## Paiement Flooz/TMoney

Le détail d'une épreuve payante affiche le prix (`GET /paiements/acces/{id}`) et un
bouton « Payer avec Flooz / T-Money » :

1. Choix de la méthode (`flooz` / `tmoney`) + numéro de téléphone
2. `POST /paiements/initier` → référence + instructions USSD affichées étape par étape
3. L'utilisateur paie sur son téléphone puis appuie sur « J'ai payé — Confirmer »
4. `POST /paiements/confirmer` → accès débloqué, téléchargement disponible

> Le backend simule la confirmation (pas d'API opérateur). Le retrait contributeur
> (`POST /wallet/retrait`) suit le même choix Flooz/TMoney depuis le portefeuille.

## Soumission d'épreuve

Onglet « Soumettre » : formulaire complet (titre, niveau, classe, matière, ville,
type, année, examen national, période, établissement) + fichiers :

- **Photos** (galerie via `image_picker.pickMultiImage` ou caméra) — converties en PDF côté backend
- **PDF** unique (via `file_picker`)

Envoi `multipart/form-data` sur `POST /soumissions` (champ `pdf` ou `images[]`,
exclusifs). La réponse signale les doublons potentiels.

## Cert pinning (production)

En production HTTPS, épinglez le certificat serveur via `--dart-define` :

```bash
flutter build apk --dart-define=API_URL=https://api.ezoa.example \
  --dart-define=CERT_PINS=<sha256-hex-du-certificat-leaf>
```

`CERT_PINS` accepte plusieurs empreintes SHA-256 (hex, séparées par des virgules,
`:` tolérés). Obtenir l'empreinte :

```bash
openssl s_client -connect api.ezoa.example:443 < /dev/null 2>/dev/null \
  | openssl x509 -outform DER | openssl dgst -sha256
```

Sans `CERT_PINS`, la validation TLS standard s'applique (dev HTTP local inchangé).

## Qualité

```bash
flutter pub get
flutter analyze
flutter test
```

## TODO Phase 2+

- [x] Soumission multipart (`image_picker`/`file_picker` + `POST /soumissions`)
- [x] Paiement mobile Flooz/TMoney (accès + initier + confirmer + retrait wallet)
- [x] Cert pinning (production, via `--dart-define=CERT_PINS`)
- [x] Favoris toggle depuis détail épreuve
- [x] Préférence push (`pushEnabled`) dans Notifications
- [ ] Push natif FCM/APNs — **non implémenté** (hors scope Phase 1). Aujourd’hui :
      - Web : Web Push VAPID (`/account/notifications/subscribe`)
      - Mobile : notifications **in-app** uniquement (`/account/notifications`)
      - Les rappels d’abonnement (`cron/abonnement_rappels.php`) créent des
        notifications en base visibles dans l’app ; pas de push device.
      - Stub futur : enregistrer un token FCM après login et exposer
        `POST /account/notifications/fcm` côté backend (à ajouter).
      - Ne pas ajouter `firebase_messaging` tant que l’endpoint serveur n’existe pas.
- [ ] Messagerie (si spec backend ajoutée — seul `POST /contact` existe)

## Legacy Expo

L'app Expo d'origine est dans `mobile-expo-legacy/`. Pour la lancer :

```bash
npm run mobile:dev
```
