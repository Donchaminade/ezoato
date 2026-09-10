# Ezoato AI — tuteur ancré sur les épreuves

Couche **premium** (abonnement Pro : Flooz / T-Money) en plus de la bibliothèque d’épreuves. Ce n’est **pas** la correction officielle du jury.

Le modèle n’est **pas** fine-tuné. Quand l’élève révise une épreuve, le backend charge le contenu déjà stocké (métadonnées + extraits PDF / sidecar) et l’injecte uniquement dans des blocs **UNTRUSTED_DATA** du message utilisateur. Les nouvelles épreuves de la bibliothèque deviennent automatiquement du contexte tuteur — pas de pipeline d’entraînement séparé.

## Modes

| Mode | Usage |
| --- | --- |
| **A — Rédaction** | L’élève lit l’épreuve et écrit dans l’app. L’IA renvoie plan, arguments, style, manques. Réécriture guidée d’un paragraphe (optionnel). Jamais une note de jury. |
| **B — Calcul / sciences** | Maths, physique-chimie, SVT. L’IA **n’est pas un solveur** : méthode, formules, exemple **similaire**. L’élève travaille **sur papier**, puis soumet sa réponse (texte et/ou photo). Verdict `correct` / `incorrect` / `partial`. Si faux : autre explication + nouvel exemple (révélation progressive, pas la solution complète). |
| **QCM** | Question → réponse → feedback → explication si faux → suivante. Progression persistée (session MySQL). |

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

## Sessions MySQL

Les sessions quiz / rédaction / calcul et les compteurs de rate-limit sont stockés en **MySQL** (`ai_sessions`, `ai_rate_limits`). Voir `backend-php/migration-ai-sessions.sql`.

En production, `ai.php` injecte `db()` : aucun fichier JSON de session n’est utilisé. Les tests unitaires peuvent encore passer un `sessionDir` / `rateLimitDir` (fichiers temporaires) ou un PDO SQLite.

IDOR : `GET /ai/session/{id}` et les écritures ne voient que les sessions du JWT courant (404 sinon).

## Ancrage épreuve (RAG / contexte)

Pour chaque appel avec `epreuveId` :

1. Chargement de la ligne `epreuves` (titre, matière, classe, niveau, année, type, examen, ville, établissement, pages).
2. Extrait de fichier si disponible : `extrait.txt` / `document.txt` / `ocr.txt` à côté du PDF, sinon `pdftotext` (4 premières pages) si le binaire est présent.
3. Injection **uniquement** dans le message utilisateur, balises `<UNTRUSTED_DATA>`. Jamais dans le system prompt.

Les épreuves ajoutées plus tard sont donc utilisables tout de suite, sans fine-tuning.

## Images (mode B) — vision / OCR

- JPG / PNG / WebP uniquement
- 2 Mo max
- Champ `image` en multipart, ou `imageBase64` + `imageMime` en JSON
- Les octets image ne sont **jamais** interprétés comme instructions (system prompt OCR + blocs non fiables)
- Chemin réel : **Google multimodal** (Gemini) extrait le texte manuscrit / dactylographié, puis le juge s’appuie sur ce texte (+ l’image). Sinon **OpenRouter** (VL OpenAI-compatible) si `OPENROUTER_API_KEY`, sinon OpenAI vision. **Groq ne fait pas de vision** : photo sans Google / OpenRouter / OpenAI → erreur claire (`Analyse photo indisponible`), jamais un OCR inventé. Mode mock (CI) : texte d’entraînement déterministe
- Réponse juge : `extractedText`, `visionUsed`, `imageReceived`

## Configuration

Clés **uniquement** côté serveur PHP (jamais `VITE_*`).

```bash
# auto (défaut) | groq | google | openrouter | openai | mock
EZOATO_AI_PROVIDER=auto

# Texte — Groq (OpenAI-compatible : https://api.groq.com/openai/v1/chat/completions)
GROQ_API_KEY=...
EZOATO_AI_GROQ_MODEL=openai/gpt-oss-20b
# Llama 3.1 / 3.3 sur Groq = offre Enterprise uniquement (août 2026+) :
# EZOATO_AI_GROQ_MODEL=llama-3.3-70b-versatile
# EZOATO_AI_GROQ_MODEL=llama-3.1-8b-instant

# Google — Gemini *et* Gemma (Generative Language API)
GEMINI_API_KEY=...
# ou
GOOGLE_API_KEY=...
EZOATO_AI_GOOGLE_MODEL=gemini-2.0-flash
# Exemples d’IDs exposés par l’API (à vérifier si Google les retire) :
# EZOATO_AI_GOOGLE_MODEL=gemma-3-27b-it
# EZOATO_AI_GOOGLE_MODEL=gemma-4-26b-a4b-it
EZOATO_AI_GOOGLE_VISION_MODEL=gemini-2.0-flash

# OpenRouter — vision Mode B + repli texte optionnel
# OpenAI-compatible : https://openrouter.ai/api/v1/chat/completions
OPENROUTER_API_KEY=...
# VL gratuit listé sur GET https://openrouter.ai/api/v1/models (sept. 2026) :
# input_modalities = image+text, pricing 0. Ne pas inventer d’IDs morts.
EZOATO_AI_OPENROUTER_MODEL=google/gemma-4-26b-a4b-it:free
# Autres VL gratuits listés au même moment : google/gemma-4-31b-it:free,
# inclusionai/ling-3.0-flash-vl:free, ou le routeur openrouter/free.
# google/gemini-2.0-flash-exp:free n’est plus exposé par l’API.

# Repli optionnel
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4o-mini
OPENAI_BASE_URL=https://api.openai.com/v1

# Local / CI sans clé
EZOATO_AI_ALLOW_MOCK=1
EZOATO_AI_PROVIDER=mock                # force le mock

# Optionnel
EZOATO_PDFTOTEXT=pdftotext
```

**Production / `dev` déployé** : au moins `GROQ_API_KEY` et/ou `GEMINI_API_KEY` (ou `GOOGLE_API_KEY`) et/ou `OPENROUTER_API_KEY` et **`EZOATO_AI_ALLOW_MOCK=0`** (ou omettre la variable). Le mock ne doit pas servir de repli silencieux en prod. Aucune clé n’est jamais commitée.

Prod sans clé : `503` générique. Photo sans fournisseur vision : `503` explicite (pas d’OCR fictif).

### Ordre de sélection

`EZOATO_AI_PROVIDER` (défaut `auto`) :

| Préférence | Texte (essai, coach, QCM, indices, juge-texte) | Vision / photo |
| --- | --- | --- |
| `auto` | Groq si `GROQ_API_KEY` → Google si `GEMINI_API_KEY` / `GOOGLE_API_KEY` → OpenRouter si `OPENROUTER_API_KEY` → OpenAI → mock si `EZOATO_AI_ALLOW_MOCK=1` → `none` | Google multimodal → OpenRouter → OpenAI vision → mock si autorisé → `none` |
| `groq` | Groq uniquement (sinon mock/`none`) | Google → OpenRouter → OpenAI ( Groq n’est pas utilisé ) |
| `google` (alias `gemini`) | Google uniquement | Google, sinon OpenRouter, sinon OpenAI |
| `openrouter` | OpenRouter uniquement | OpenRouter, sinon Google, sinon OpenAI |
| `openai` | OpenAI uniquement | OpenAI, sinon Google, sinon OpenRouter |
| `mock` | générateur déterministe | texte OCR d’entraînement |

Le **texte reste Groq-first** : OpenRouter n’est qu’un repli après Groq puis Google. La **vision** est le cas d’usage principal d’OpenRouter (photo Mode B / OCR).

Forcer un fournisseur **sans** sa clé ne bascule pas silencieusement vers un autre pour le texte.

## Tests

```bash
php backend-php/tests/test-ai-security.php
# ou : npm run test:ai
```

Couvre validation, injection, IDOR épreuve + session (fichiers et SQL), premium, modes A/B/QCM, sélection Groq/Google/OpenRouter/OpenAI, payload Gemini/Gemma, ancrage, vision/OCR, rate-limit.

## UI

### Web

- `/reviser` et fiche épreuve : choix de mode + paywall Pro
- Garde-fou affiché en permanence

### Flutter

Écran dédié (mêmes endpoints `/ai/*`) :

- `/reviser` — depuis Compte → « Réviser avec l’IA »
- `/epreuve/:id/reviser` — bouton « Réviser avec l’IA » sur la fiche épreuve

Modes A / B / QCM, paywall Pro (Flooz / T-Money), photo de copie en mode B, disclaimer jury.
