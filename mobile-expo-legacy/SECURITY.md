# Checklist sécurité — EZOA-TO Mobile

## Authentification

- [x] JWT stocké dans **Expo SecureStore** (pas AsyncStorage)
- [x] Token transmis en `Authorization: Bearer` sur chaque requête API
- [x] Déconnexion efface le token SecureStore
- [ ] Rotation / refresh token (non supporté par le backend actuel)
- [ ] Biométrie optionnelle (Phase 2)

## Stockage local

- [x] PDF hors ligne dans le répertoire privé de l'app (`documentDirectory`)
- [x] Métadonnées SQLite locale (pas de secrets)
- [ ] Chiffrement au repos des PDF sensibles (Phase 2 — `expo-crypto` + clé device)

## Réseau

- [x] HTTPS recommandé en production (configurer reverse proxy)
- [ ] **Certificate pinning** — non implémenté ; recommandé pour builds production
- [x] Pas de secrets hardcodés dans le code source
- [ ] Validation stricte des certificats self-signed en dev uniquement

## API

- [x] Erreurs API sans fuite de stack trace côté client
- [x] Timeouts implicites fetch (à renforcer en Phase 2)
- [ ] Rate limiting côté client (backoff)

## Notifications

- [x] Permissions demandées à l'utilisateur
- [ ] Ne pas logger les tokens push en production
- [ ] Backend : valider format des abonnements push

## Build & déploiement

- [ ] ProGuard / R8 (Android) — activer en release EAS
- [ ] Désactiver le debug en production
- [ ] `eas.json` avec profils preview/production séparés
- [ ] Revue des permissions Android/iOS (minimales)

## Conformité

- [ ] Politique de confidentialité (données locales + API)
- [ ] Suppression compte / données RGPD (endpoint backend requis)

## Revue périodique

| Fréquence | Action |
|-----------|--------|
| Chaque release | `npm audit`, mise à jour Expo SDK |
| Trimestriel | Revue checklist + test intrusion API |
| Avant prod | Pentest ciblé auth + stockage offline |
