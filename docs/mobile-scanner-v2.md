# Scanner soumission mobile — plan V2

Document de suivi après validation de la **V1** (flux Scanner + Importer PDF).

## Ce que la V1 livre

- Deux chemins dans `Soumettre` : **Scanner** et **Importer PDF**
- Capture caméra et/ou import galerie (multipages)
- Recadrage manuel (`image_cropper` / uCrop)
- Filtres : Original, Document (N&B contrasté), Contraste
- Réordonnancement et suppression des pages
- Assemblage client en **un PDF** (`pdf`) puis upload via `POST /soumissions` (champ `pdf`)
- Métadonnées inchangées (niveau, matière, type, etc.)
- Permissions Android : caméra + lecture images ; activité `UCropActivity`

Fichiers clés :

- `mobile/lib/features/submit/presentation/document_scanner_sheet.dart`
- `mobile/lib/features/submit/data/document_image_processor.dart`
- `mobile/lib/features/submit/data/document_pdf_builder.dart`
- `mobile/lib/features/submit/domain/scanned_page.dart`

## Objectifs V2

| Priorité | Objectif | Notes |
|----------|----------|--------|
| P0 | Détection automatique des bords (perspective) | Cadre document type CamScanner |
| P0 | Correction de perspective après détection | Homographie 4 points |
| P1 | Filtres « magic color » améliorés | Niveaux auto, ombres/blancs, désaturation sélective |
| P1 | Cadre live dans la caméra | Overlay rectangle / guides pendant la prise |
| P1 | Contrôles qualité | Flou, sous-exposition, page trop petite → avertissement |
| P2 | Prévisualisation PDF avant envoi | Aperçu page par page |
| P2 | Conservation / compression intelligente | Qualité vs taille upload (réseaux mobiles Togo) |
| P2 | Mode « lot » plus fluide | Ajouter plusieurs pages sans interrompre à chaque filtre |
| P3 | OCR / orientation auto | Nice-to-have, hors MVP scanner |

Approche technique probable (à confirmer après tests V1) :

- Plugin ML Kit Document Scanner **ou** OpenCV / `edge_detection` / pipeline custom
- Si plugin natif trop lourd / instable sur Samsung : garder le pipeline V1 et ajouter seulement edge+perspective en Dart/FFI
- Prévisualisation filtre en temps réel (thumbnails) avant validation

## Critères d’acceptation (après tests V1)

Cocher avant de démarrer le code V2 :

- [ ] V1 testée sur appareil Samsung (caméra + galerie)
- [ ] Recadrage uCrop stable (pas de crash / thème cassé Android 14/15)
- [ ] PDF multipage correctement reçu côté API (`pages`, `tailleKo`)
- [ ] Import PDF existant toujours OK (régression)
- [ ] Permissions refusées gérées sans écran bloqué
- [ ] Filtres Document / Contraste jugés « assez bons » pour des copies d’épreuves (papier, écriture manuscrite)
- [ ] Temps de traitement acceptable (< ~3–4 s / page sur milieu de gamme)
- [ ] Pas de fuite disque critique (fichiers temp) après une session normale
- [ ] Retours UX : libellés FR clairs, pas de conflit Scanner vs Importer PDF

## Hors scope / risques

**Hors scope V2 (sauf besoin explicite)**

- Édition texte / annotations sur le PDF
- Signature électronique
- Scan cloud / sync multi-appareils
- Remplacer entièrement le backend de conversion d’images (V1 envoie déjà un PDF)

**Risques**

- Plugins document-scanner souvent liés à Google Play Services / configs natives fragiles
- Qualité variable selon éclairage et papier (épreuves froissées, ombres)
- Taille des PDF multipages sur upload 3G
- Conflits de permissions / photo picker Android 13+
- Régression UX si on force trop d’étapes entre capture et envoi

## Décision go / no-go V2

Démarrer V2 seulement si la V1 est validée en conditions réelles (soumission réelle ou staging) **et** si le principal frein relevé est la détection de bords / qualité auto — pas un bug d’upload ou de métadonnées.
