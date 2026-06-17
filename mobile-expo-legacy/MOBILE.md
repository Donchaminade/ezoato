# EZOA-TO Mobile

Application mobile Expo (React Native) pour consulter, télécharger et gérer les épreuves du Togo, avec support **hors ligne** pour les PDF téléchargés.

## Prérequis

- Node.js 20+
- npm ou yarn
- [Expo Go](https://expo.dev/go) (dev) ou EAS Build (production)
- Backend PHP EZOA-TO en cours d'exécution (XAMPP)

## Installation

```bash
cd mobile
cp .env.example .env
# Éditez EXPO_PUBLIC_API_URL selon votre environnement
npm install
npm start
```

> **Note** : un fichier `.npmrc` avec `legacy-peer-deps=true` est inclus pour résoudre les conflits de peer dependencies. Le projet cible **Expo SDK 54** (compatible Expo Go 54.x).

### URL API selon l'environnement

| Contexte | `EXPO_PUBLIC_API_URL` |
|----------|------------------------|
| Émulateur Android | `http://10.0.2.2/zovu-project/backend-php` |
| Simulateur iOS | `http://localhost/zovu-project/backend-php` |
| Appareil physique | `http://<IP-LAN>/zovu-project/backend-php` |

Depuis la racine du monorepo :

```bash
npm run mobile:dev
```

## Architecture

```
mobile/
├── app/                    # Expo Router (écrans)
│   ├── index.tsx           # Splash → auth ou tabs
│   ├── (auth)/             # Login, inscription
│   ├── (tabs)/             # Accueil, Archives, Soumettre, Compte
│   └── epreuve/[id].tsx    # Détail épreuve
├── src/
│   ├── core/               # API, config, thème, stockage
│   ├── features/           # Auth, épreuves, notifications
│   └── shared/             # Composants, hooks, types
├── load-tests/             # Scripts k6
├── MOBILE.md
└── SECURITY.md
```

**Clean architecture (Phase 1)**

| Couche | Rôle |
|--------|------|
| `app/` | Présentation — navigation, écrans, UI |
| `src/features/` | Domaine — auth, offline, push |
| `src/core/` | Données — client API, SQLite, SecureStore |
| `src/shared/` | UI réutilisable, types |

## Flux hors ligne

1. **En ligne** : l'utilisateur parcourt Archives et appuie sur « Télécharger ».
2. Le PDF est récupéré via `GET /epreuves/{id}/download` (JWT Bearer).
3. Fichier stocké dans `FileSystem.documentDirectory/offline-epreuves/`.
4. Métadonnées enregistrées dans SQLite (`offline_epreuves`).
5. **Hors ligne** : Accueil et « Ma bibliothèque hors ligne » listent les entrées SQLite.
6. Ouverture du PDF via `expo-sharing` (visionneuse système).
7. Bannière NetInfo indique le mode hors ligne.

TanStack Query persiste le cache API dans AsyncStorage pour un affichage dégradé en ligne.

## Écrans implémentés

| Écran | Statut |
|-------|--------|
| Splash | ✅ |
| Login / Inscription | ✅ |
| Accueil | ✅ |
| Archives + recherche | ✅ |
| Détail épreuve | ✅ |
| Téléchargement hors ligne | ✅ |
| Bibliothèque hors ligne | ✅ |
| Profil (Infos + Sécurité) | ✅ |
| Favoris | ✅ |
| Bibliothèque en ligne | ✅ |
| Portefeuille | ✅ |
| Notifications (inbox + prefs) | ✅ |
| Soumettre épreuve | ⏳ Placeholder Phase 2 |
| Paiement Flooz/TMoney | ⏳ Phase 2 |
| Messagerie | ❌ Non disponible côté backend |

## Notifications push

- `expo-notifications` configuré (permissions, canal Android).
- Le backend actuel attend un abonnement **Web Push VAPID** (`/account/notifications/subscribe`).
- Les tokens **Expo Push** nécessitent une adaptation serveur (envoi via [Expo Push API](https://docs.expo.dev/push-notifications/sending-notifications/) ou FCM/APNs natif).
- TODO : étendre `account.php` pour stocker `expo_push_token` et un worker d'envoi.

## Messagerie

Le backend PHP ne expose **aucun endpoint de chat/messagerie** entre utilisateurs. Fonctionnalité **non implémentée** — voir TODO ci-dessus.

## Tests

```bash
# Vérification TypeScript
npm run typecheck

# Test de charge API (k6 requis)
k6 run load-tests/api-load.js
```

## Variables d'environnement

| Variable | Description |
|----------|-------------|
| `EXPO_PUBLIC_API_URL` | URL base API PHP (sans slash final) |

## TODO Phase 2+

- [ ] Soumission multipart (`expo-image-picker` + `POST /soumissions`)
- [ ] Paiement mobile Flooz/TMoney
- [ ] Backend push Expo/FCM
- [ ] Cert pinning (production)
- [ ] EAS project ID réel dans `app.json`
- [ ] Messagerie (si spec backend ajoutée)
