# Ezoato AI — révision interactive (MVP)

Couche IA **en plus** de la bibliothèque d’épreuves : QCM, explications pas-à-pas, indices après erreurs. Ce n’est **pas** une note officielle.

## Endpoints (backend PHP, JWT Bearer)

| Méthode | Chemin | Rôle |
| --- | --- | --- |
| `POST` | `/ai/quiz` | QCM à partir d’une épreuve validée et/ou d’un texte extrait |
| `POST` | `/ai/explain` | Explication étape par étape quand l’élève est bloqué |
| `POST` | `/ai/hints` | Indices de révision à partir des mauvaises réponses |
| `GET` | `/ai/pack?epreuveId=` | Stub de pack JSON hors-ligne |

AuthZ : utilisateur connecté. Pour un `epreuveId` payant, même règle que `GET /epreuves/{id}/download` (abonnement ou paiement).

## Configuration

Secrets **uniquement** en variables d’environnement (pas dans `config.php` ni le dépôt) :

```bash
OPENAI_API_KEY=sk-...
# optionnel
OPENAI_MODEL=gpt-4o-mini
OPENAI_BASE_URL=https://api.openai.com/v1
```

Sans clé :

- **CI / local** : `EZOATO_AI_ALLOW_MOCK=1` ou `EZOATO_AI_PROVIDER=mock`
- **Prod** : l’API répond `503` « Service IA temporairement indisponible » (pas de stack, pas de secret)

## Tests

```bash
php backend-php/tests/test-ai-security.php
```

Couvre : corps vide / trop gros / mauvais types, Content-Type, injection de prompt, IDOR (épreuve payante sans accès), rate-limit, messages d’erreur sûrs, chemin heureux avec fournisseur mock.

## UI

- Page `/reviser` : coller un extrait et générer un QCM
- Fiche épreuve : bloc « Réviser avec l’IA » (si connecté et accès au contenu)

## Hors-ligne

`includePack: true` sur `/ai/quiz` renvoie un JSON `revision-pack` téléchargeable. Les packs multimédia complets sont volontairement en stub.
