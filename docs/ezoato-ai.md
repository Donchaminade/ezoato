# Ezoato AI — révision interactive (MVP)

Couche **premium** (abonnement Pro : Flooz / T-Money) en plus de la bibliothèque d’épreuves. Ce n’est **pas** la correction officielle du jury.

## Modes

| Mode | Usage |
| --- | --- |
| **A — Rédaction** | L’élève lit l’épreuve et écrit dans l’app. L’IA renvoie plan, arguments, style, manques. Réécriture guidée d’un paragraphe (optionnel). |
| **B — Calcul / sciences** | Maths, physique-chimie, SVT. L’IA **n’est pas un solveur** : méthode, formules, exemple **similaire**. L’élève travaille **sur papier**, puis soumet sa réponse (texte et/ou photo). Verdict `correct` / `incorrect` / `partial`. Si faux : autre explication + nouvel exemple (révélation progressive). |
| **QCM** | Question → réponse → feedback → explication si faux → suivante. Progression persistée (session). |

## Premium

Tous les endpoints `/ai/*` exigent un JWT **et** un abonnement Pro actif (`user_has_active_subscription`). Les rôles `admin` / `gestionnaire` passent pour la QA.

Si un `epreuveId` payant est fourni, l’accès épreuve (paiement unitaire ou Pro) reste exigé — même règle que le téléchargement.

`GET /ai/entitlement` → `{ premium, paywall: "abonnement", message }`.

## Endpoints

| Méthode | Chemin | Rôle |
| --- | --- | --- |
| `GET` | `/ai/entitlement` | Flag Pro |
| `POST` | `/ai/session` | Démarre une session (`mode`: `redaction` \| `calcul` \| `quiz`) |
| `GET` | `/ai/session/{id}` | Reprend la progression |
| `POST` | `/ai/essay` | Feedback de copie |
| `POST` | `/ai/coach` | Méthode / formules / exemple voisin |
| `POST` | `/ai/judge` | Verdict + nouvel indice (JSON ou `multipart` + `image`) |
| `POST` | `/ai/quiz` | Démarre un QCM (sans bonnes réponses côté client) |
| `POST` | `/ai/quiz/answer` | Répond à une question, persiste |
| `POST` | `/ai/explain` | Explication (utilisée par la boucle QCM) |
| `POST` | `/ai/hints` | Indices après erreurs |
| `GET` | `/ai/pack` | Stub pack hors-ligne |

### Images (mode B)

- JPG / PNG / WebP uniquement
- 2 Mo max
- Champ `image` en multipart, ou `imageBase64` + `imageMime` en JSON
- Pas d’OCR complète en MVP : la photo est acceptée et signalée au juge

Les sessions sont des fichiers JSON (répertoire temporaire). Pas encore de table MySQL.

## Configuration

```bash
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4o-mini
OPENAI_BASE_URL=https://api.openai.com/v1
EZOATO_AI_ALLOW_MOCK=1   # local / CI sans clé
```

Prod sans clé : `503` générique.

## Tests

```bash
php backend-php/tests/test-ai-security.php
# ou : npm run test:ai
```

## UI

- `/reviser` et fiche épreuve : choix de mode + paywall Pro
- Garde-fou affiché en permanence
