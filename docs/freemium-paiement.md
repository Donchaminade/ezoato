# Freemium et paiement Pro

Modèle validé : 50 épreuves gratuites, puis l'abonnement Pro à **1 000 FCFA pour 6 mois** (Flooz ou T-Money). Les examens officiels et les concours sont Pro dès la première épreuve.

## Quota gratuit

Par défaut, devoirs et compositions partagent **un seul quota de 50** consultations ou téléchargements par compte. Une épreuve déjà comptée pour l'utilisateur ne consomme pas une deuxième fois. La miniature de catalogue (page 1, sans `lire=1`) ne consomme pas le quota. Ouvrir la visionneuse (`lire=1`), tourner les pages, le PDF complet et le téléchargement le consomment. Les concours (ENAM, fonction publique, etc.) sont dans la même catégorie `officiel` que le CEPD, le BEPC et le BAC : Pro dès la première page, même déduplication (sans établissement), même barème de contribution.

Les chemins `/annales` et `/annale` répondent en 301 vers `/docs`. Les URL `/docs` et `/epreuves/{id}` ne changent pas.

| Variable | Défaut | Rôle |
|----------|--------|------|
| `EZOATO_FREEMIUM_QUOTA` | `50` | Plafond du quota commun |
| `EZOATO_FREEMIUM_QUOTA_MODE` | `shared` | `shared` ou `separate` |
| `EZOATO_FREEMIUM_QUOTA_DEVOIR` | valeur de `EZOATO_FREEMIUM_QUOTA` | Plafond devoirs si `separate` |
| `EZOATO_FREEMIUM_QUOTA_COMPOSITION` | valeur de `EZOATO_FREEMIUM_QUOTA` | Plafond compositions si `separate` |

Pour passer en quotas séparés (50 devoirs **et** 50 compositions) :

```
EZOATO_FREEMIUM_QUOTA_MODE=separate
EZOATO_FREEMIUM_QUOTA_DEVOIR=50
EZOATO_FREEMIUM_QUOTA_COMPOSITION=50
```

En mode `separate`, les examens universitaires qui ne sont pas des examens officiels utilisent le quota commun (`EZOATO_FREEMIUM_QUOTA`). Les noms sont aussi dans `.env.example`. Aucune de ces valeurs n'est un secret.

Un compte Pro ne consomme pas le quota. Un achat unitaire déjà confirmé avant ce modèle continue d'ouvrir l'épreuve concernée jusqu'à son échéance.

## Ce qui est Pro dès la première épreuve

- Type `corrige`
- Niveau `concours`
- Type `examen` avec examen `CEPD`, `BEPC`, `BAC1` ou `BAC2`

Les devoirs, les compositions et les examens universitaires hors liste officielle suivent le quota.

## Paiement

Le code parle à une interface `FournisseurPaiement`. Le fournisseur effectif se résout ainsi :

| `EZOATO_PAYMENT_PROVIDER` | Comportement |
|---------------------------|--------------|
| `auto` (défaut) | PayGate si `PAYGATE_AUTH_TOKEN`, sinon FedaPay si `FEDAPAY_SECRET_KEY`, sinon simulé |
| `simulated` | Confirmation simulée, même si une clé est présente |
| `paygate` ou `fedapay` | Adaptateur forcé ; sans la clé correspondante, repli sur le simulé |

Tant qu'aucune clé n'est renseignée, **dev et prod restent simulés**. Le bouton client est alors libellé comme une simulation : il active le Pro tout de suite, sans débit réel. Avec un vrai fournisseur, la confirmation client interroge le statut ; seul un paiement vérifié active le Pro pour 6 mois.

### Variables (jamais dans le code)

```
PAYGATE_AUTH_TOKEN=
PAYGATE_API_BASE=https://paygateglobal.com/api/v1
FEDAPAY_SECRET_KEY=
FEDAPAY_ENVIRONMENT=sandbox
FEDAPAY_WEBHOOK_SECRET=
FEDAPAY_API_BASE=
EZOATO_PAYMENT_CALLBACK_URL=
```

`EZOATO_PAYMENT_CALLBACK_URL` est l'URL appelée par l'opérateur. Sinon l'API utilise `{api_base_url}/webhooks/paiement`.

PayGate Global est l'adaptateur prioritaire (réseaux `FLOOZ` et `TMONEY`, initiation `POST /pay`, statut `POST /status`). FedaPay est l'option (transaction + jeton, signature `X-FEDAPAY-SIGNATURE`, relecture de la transaction). CinetPay n'est pas branché.

Le webhook `POST /webhooks/paiement` vérifie l'événement chez le fournisseur, enregistre l'identifiant d'événement (table `paiement_evenements`) et active le Pro. Un même événement, ou un nouvel événement sur un abonnement déjà actif, ne prolonge pas `date_fin`.

## Contributions

Barème inchangé, lu depuis les réglages plateforme (défauts : **50 épreuves validées = 1 000 FCFA**, retrait dès **2 000 FCFA**). Seules les soumissions `validee` et `recompense_eligible = 1` comptent. La première validation d'une épreuve remporte la récompense ; les soumissions suivantes de la même épreuve sont refusées avec :

> Cette épreuve a déjà été validée. Seule la première soumission validée est rémunérée — la prochaine fois, envoie-la plus vite.

- **Devoir** : établissement obligatoire. La clé de doublon inclut l'établissement.
- **Composition collège ou lycée** : pas d'établissement (forcée à vide). La clé ne l'inclut pas, car le sujet est le même sur tout le territoire.
- **Université** : l'université reste dans la clé, pour ne pas fusionner deux établissements.
- Un remplacement admin archive l'ancienne épreuve et ne crée pas une seconde récompense.

Les doublons déjà validés avant cette règle ne sont pas révoqués.

## Migration

`backend-php/migration-freemium-paiement.sql` est idempotente. Elle ajoute colonnes et tables (`acces_gratuits`, `epreuve_dedup_verrous`, `paiement_evenements`) sans modifier le statut des abonnements existants : un utilisateur Pro reste Pro.

Tant que la table `acces_gratuits` n'existe pas, les épreuves sous quota restent ouvertes (comportement d'avant migration). Le palier Pro (examens officiels, concours, corrigés) est appliqué dès le déploiement du code.
