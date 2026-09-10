# EZOA-TO — Backend PHP/PDO

API REST minimale pour EZOA-TO, à uploader sur un hébergeur PHP 8.1+ (OVH, Hostinger, Infomaniak…).
Définis `VITE_API_URL` côté front pour pointer vers cette API (ex: `https://api.zovu.tg`).

## Stack
- PHP 8.1+ avec PDO MySQL
- Authentification JWT (lib firebase/php-jwt à installer via Composer, ou utilise l'implémentation maison)
- Conversion images → PDF via **FPDF** (https://www.fpdf.org/) — image entière centrée sur A4 (sans rognage, style CamScanner)

## Installation
1. Crée la base MySQL et importe `schema.sql`
2. Copie tous les fichiers `.php` à la racine de l'API (ex: `/api/`)
3. Configure `config.php` (DB, JWT secret, dossier uploads)
4. Active l'extension PHP **GD** (conversion images → PDF A4)
5. Les dossiers `uploads/soumissions/` et `uploads/epreuves/` sont créés automatiquement (chmod 775 sur `uploads/`)
6. FPDF est inclus dans `lib/fpdf.php` (assemblage PDF multi-pages)
6. Configure CORS si l'API est sur un domaine différent du front

## Endpoints
- `POST /auth/register` — { nom, email, password }
- `POST /auth/login` — { email, password } → { token, user }
- `GET  /auth/me` — (Bearer) → user
- `GET  /epreuves?q&ville&matiere&niveau&classe&type&annee&examen&page&perPage`
- `GET  /epreuves/{id}`
- `POST /soumissions` — multipart: champs + images[] → génère PDF preview, détecte doublons
- `GET  /admin/soumissions` — (gestionnaire/admin)
- `POST /admin/soumissions/{id}/valider` — copie le PDF en publié
- `POST /admin/soumissions/{id}/rejeter` — { motif }

### Ezoato AI (premium — JWT + abonnement Pro)

Voir `docs/ezoato-ai.md`. Tuteur **ancré sur l’épreuve** (métadonnées + extraits), pas un chat générique ni un fine-tuning. Modes : rédaction, calcul/sciences (pas un solveur), QCM persisté.

- `GET  /ai/entitlement`
- `POST /ai/session` — `{ mode, epreuveId?, question?, sourceText?, matiere? }`
- `GET  /ai/session/{id}`
- `POST /ai/essay` — feedback de copie (pas une note de jury)
- `POST /ai/coach` — méthode + formules + exemple similaire
- `POST /ai/judge` — verdict ; `multipart` + `image` (JPG/PNG/WebP, 2 Mo) + vision/OCR
- `POST /ai/quiz` / `POST /ai/quiz/answer`
- `POST /ai/explain` · `POST /ai/hints` · `GET /ai/pack`

Sessions et rate-limit : tables MySQL `ai_sessions` / `ai_rate_limits` (`migration-ai-sessions.sql`).
Limiteur : 20 requêtes / utilisateur / heure / action.
Sans Pro : `402`. Épreuve payante : même règle que le téléchargement.

#### Variables d'environnement (jamais dans git)

```
GEMINI_API_KEY=...             # ou GOOGLE_API_KEY — fournisseur primaire
GEMINI_MODEL=gemini-2.0-flash  # optionnel
OPENAI_API_KEY=sk-...          # repli optionnel
OPENAI_MODEL=gpt-4o-mini
OPENAI_BASE_URL=https://api.openai.com/v1
EZOATO_AI_ALLOW_MOCK=1         # local/CI sans clé uniquement
EZOATO_AI_PROVIDER=mock        # force le mock
```

En **production / `dev` déployé** : `GEMINI_API_KEY` (ou `GOOGLE_API_KEY`) + `EZOATO_AI_ALLOW_MOCK=0`. Ne jamais committer la clé.

Tests : `php tests/test-ai-security.php` (sans clé ni serveur).

## Cron — rappels abonnement

Script CLI-only : `cron/abonnement_rappels.php` (refus HTTP 403).

```powershell
# Test manuel
C:\xampp\php\php.exe C:\xampp\htdocs\zovu-project\backend-php\cron\abonnement_rappels.php

# Installer la tâche Windows (quotidien 08:00)
cd backend-php\cron
.\install-abonnement-rappels-task.ps1
```

Voir aussi le commentaire en tête de `cron/abonnement_rappels.php` (crontab Linux).

## Sécurité
- Toujours valider les inputs (type, longueur, MIME des images)
- Rate-limit côté serveur web (mod_evasive / nginx) + limiteur applicatif sur `/ai/*`
- HTTPS obligatoire en prod
- Les scripts `cron/*` doivent rester CLI-only (pas d’exposition HTTP)
- Clés LLM uniquement via env (`GEMINI_API_KEY` / `GOOGLE_API_KEY`, repli `OPENAI_API_KEY`) — jamais dans `config.php` / git
- Le texte élève ou d'épreuve n'est jamais exécuté comme instruction système
- Les réponses IA portent un avertissement : ce n'est pas une note officielle
