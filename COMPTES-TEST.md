# Comptes de test EZOA-TO

Mot de passe commun pour tous les comptes : **`Tea2026!`**

| Rôle | Email | Téléphone | Nom | Usage |
|------|-------|-----------|-----|-------|
| **Admin** | `admin@tea.test` | `90000001` | Admin EZOA-TO | Tout l'espace admin + gestion utilisateurs |
| **Gestionnaire** | `gestion@tea.test` | `90000002` | Gestionnaire EZOA-TO | Soumissions, épreuves, retraits, partenaires |
| **Contributeur** | `afi@tea.test` | `90123456` | Afi Kouami | Compte utilisateur, solde 2 500 FCFA |
| **Contributeur** | `kodjo@tea.test` | `90765432` | Kodjo Mensah | Compte utilisateur, solde 500 FCFA |

Connexion possible avec **email ou numéro** + mot de passe.

## Installation des comptes

1. Importer le schéma si ce n'est pas fait : `backend-php/schema.sql`
2. Exécuter le script :

```bash
cd backend-php
php seed-users.php
```

3. Se connecter sur `/auth/login`

## Réinitialisation mot de passe

1. Aller sur `/auth/forgot-password`
2. Saisir un email de test (ex. `afi@tea.test`)
3. En local, le **lien de reset** s'affiche à l'écran (mode dev)
4. Définir un nouveau mot de passe sur `/auth/reset-password?token=…`

Migrations SQL (une fois) :
```bash
Get-Content backend-php/migration-password-reset.sql | mysql -u root zovu
Get-Content backend-php/migration-user-telephone.sql | mysql -u root zovu
```

## Pages à tester

- `/account` — Vue d'ensemble compte
- `/account/soumissions` — Suivi des soumissions
- `/account/bibliotheque` — Achats et téléchargements
- `/contributor` — Portefeuille et retraits
- `/submit` — Soumettre une épreuve
- `/admin` — Espace administration (admin + gestionnaire)
