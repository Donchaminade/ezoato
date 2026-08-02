# Smoke — niveaux + similarité

## Prérequis
- XAMPP MySQL + Apache
- Base `zovu` à jour

## Migration
```powershell
cd backend-php
.\migrate-all.ps1
# ou uniquement :
Get-Content migration-niveaux-concours.sql -Raw -Encoding UTF8 | C:\xampp\mysql\bin\mysql.exe -u root zovu
```

## Tests automatisés
```powershell
cd backend-php
php tests/test-niveau-similarite.php
php tests/test-security-soumissions.php
```

## Smoke manuel
1. `GET /meta` → `niveaux`, `concours`, `filieres`, `anneesEtude` présents
2. Web `/submit` → 4 cartes niveau → formulaire adapté
3. Soumettre un concours (ENAM) → toast succès
4. Compte admin/gestionnaire → inbox notification « Nouvelle soumission »
5. Admin → Soumissions → badge « N similaire(s) » si match → vue 50/50 → Valider / Rejeter
6. Archives `/docs` → filtre Université / Concours

## Mobile
```powershell
cd mobile
flutter analyze lib/features/submit lib/shared/models/models.dart
```
