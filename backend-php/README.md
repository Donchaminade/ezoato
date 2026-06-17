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

## Sécurité
- Toujours valider les inputs (type, longueur, MIME des images)
- Rate-limit côté serveur web (mod_evasive / nginx)
- HTTPS obligatoire en prod
