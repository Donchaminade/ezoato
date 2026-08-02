# Pitch deck EZOA-TO

Présentation professionnelle pour investisseurs, partenaires et établissements scolaires.

## Fichiers

| Fichier | Rôle |
|---------|------|
| [`ezoa-to-pitch-deck.html`](./ezoa-to-pitch-deck.html) | Deck principal (**14 slides**), HTML/CSS/JS — texte FR + PNG intégrés |
| [`SPEAKER-NOTES.md`](./SPEAKER-NOTES.md) | Notes orateur, glossaire, projections, sources marché |
| [`assets/`](./assets/) (`slide-01-cover.png` … `slide-12-ask.png`) | Visuels PNG (slides 13–14 réutilisent des assets existants) |
| `public/pitch/` (copie servie) | Même deck en production : `/pitch/ezoa-to-pitch-deck.html` (CTA **Sponsoriser**) |

Chaque slide (hors couverture) est en **deux colonnes** : titre + puces orales à gauche/droite, PNG illustratif en face. Les puces sont des *talking cues* — l’orateur développe à l’oral (voir `SPEAKER-NOTES.md`). Les PNG restent aussi utilisables seuls pour partage / export.

## Checklist envoi investisseur

Avant d’envoyer le pack :

- [ ] Ouvrir le HTML dans Chrome/Edge et parcourir les **14 slides** (plein écran **F**)
- [ ] Vérifier logo + capture (`mobile/assets/images/logo-ezoa.png`, `mobile/flutter_02.png`) — ouvrir depuis la racine du dépôt
- [ ] Confirmer l’**email de contact** (`contact@ezoa.tg` dans le deck — remplacer si boîte réelle différente)
- [ ] Relire la slide **Traction** : aucun MAU / revenu inventé ; statut « produit opérationnel / prêt pilote »
- [ ] Relire **Financement** : ask fixe **25 M FCFA** + tableau d’allocation ; slide **Projections** labellisée *projections indicatives*
- [ ] Joindre ou tenir prêt `SPEAKER-NOTES.md` (glossaire + sources) pour questions diligence
- [ ] Exporter un **PDF paysage** (voir ci-dessous) + éventuellement lien GitHub du produit
- [ ] Message d’accompagnement court : problème → solution → stade produit → ask → prochain call / démo
- [ ] Ne pas joindre secrets (`.env`, clés API, credentials Mobile Money)

### Pack recommandé

1. `ezoa-to-pitch-deck.pdf` (export print)
2. Lien vers le HTML ou dépôt si l’investisseur préfère le format interactif
3. Optionnel : 3–5 captures produit récentes + lien démo privée

## Présenter (écran / projecteur)

1. Ouvrir `ezoa-to-pitch-deck.html` dans Chrome ou Edge (depuis le dépôt).
2. **F** pour le plein écran (ou F11).
3. Naviguer :
   - **→** / **Espace** / **Page Down** — suivante  
   - **←** / **Page Up** — précédente  
   - **Home** / **End** — première / dernière  
   - Points en bas · swipe tactile  
4. Garder `SPEAKER-NOTES.md` sur un second écran.

## Exporter en PDF

1. Ouvrir le HTML dans Chrome ou Edge.
2. **Ctrl+P** → **Enregistrer au format PDF**.
3. Mise en page : **Paysage** · marges **Aucune**.
4. Cocher **Graphiques d’arrière-plan**.
5. Une page PDF par slide (`@media print`).

## Chiffres clés du deck (rappel)

| Élément | Valeur |
|---------|--------|
| Secondaire Togo (MEN 2024-25) | ~912 k élèves |
| TAM (marché total adressable) | ~10 M élèves Afrique de l’Ouest francophone |
| SAM (marché accessible) | ~370 k (Togo × accès digital) |
| SOM (marché obtenable) | 3–8 k abonnés Pro (18–24 mois) |
| Prix Pro | 1 000 FCFA / 6 mois (~2 000 FCFA / an) |
| Ask | **25 M FCFA** (ticket seed / pré-amorçage ; ≈ ~38 k USD) |

Détail, fourchettes et **URLs sources** : [`SPEAKER-NOTES.md`](./SPEAKER-NOTES.md).

## Identité visuelle

- Vert marque : `#006A4E` · or : `#FFCE00`
- Slogan : *Archive. Révise. Excelle.*
- Intégrité : pas de vanity metrics inventées — estimations marché labellisées.
