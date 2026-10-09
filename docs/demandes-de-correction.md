# Demandes de correction

Parcours où un élève demande de l'aide sur des exercices d'une épreuve du catalogue. La correction n'est jamais publiée avec l'épreuve. Tous les montants et quotas ci-dessous sont des valeurs par défaut : l'administration les change dans **Administration → Corrections → Réglages**, sans redéploiement.

## Valeurs par défaut

| Réglage | Défaut | Origine |
|---|---|---|
| Rémunération correcteur | 500 FCFA | Fixée par le fondateur, par correction validée |
| Forfait validateur | 200 FCFA | Fixé par le fondateur, par revue (y compris un rejet) |
| Réutilisation | Activée | Fixée par le fondateur |
| Rémunération de réutilisation | 100 FCFA | Fixée par le fondateur, versée au correcteur à chaque réutilisation |
| Nombre de validateurs | 1 | Fixé par le fondateur (plage admin : 1 à 5) |
| Réassignation automatique | 48 h | Fixée par le fondateur |
| Format envoyé à l'élève | `pedagogique` | Version commentée et pédagogique. Autre valeur : `pedagogique_courte` |
| Prix unitaire | 1 500 FCFA | Choix prudent, voir plus bas |
| Quota Pro | 1 demande par période | Choix prudent, voir plus bas |
| Seuil de retrait | 2 000 FCFA | Inchangé (`config.php`, contributeur). Quatre corrections validées, ou un mélange de corrections et de revues, permettent un retrait |

Justificatifs pour devenir correcteur : une pièce d'identité **et** une preuve d'enseignement. Les deux fichiers sont obligatoires (JPEG, PNG, WebP ou PDF, 8 Mo max).

### Pourquoi 1 500 FCFA et un quota de 1

Une demande traitée par un humain coûte 700 FCFA (500 au correcteur + 200 au validateur). À 1 500 FCFA, la marge couvre encore un second validateur (500 + 400 = 900) si l'administration monte `nombre_validateurs` à 2. L'abonnement Pro existant est à 1 000 FCFA pour 6 mois : inclure deux demandes humaines ferait perdre de l'argent sur l'abonnement seul (1 400 FCFA de versements). Le quota est donc de **1** demande par période d'abonnement. Une réutilisation ajoute 100 FCFA, toujours couverts par les 1 500. Le quota ou le prix unitaire est consommé aussi en cas de réutilisation : l'élève reçoit une correction.

Hors quota, la demande reste en `en_attente_reglement` (montant = prix unitaire) jusqu'à confirmation du paiement. Le triage ne démarre pas avant.

## Machine à états

États : `en_attente_reglement`, `recue`, `traitee_ia`, `en_attente_admin`, `confirmee_admin`, `assignee`, `en_revue`, `rejetee`, `livree`, `annulee`.

- `reglement_confirme` sort de l'attente de paiement.
- `triage` : compréhension → `traitee_ia` (guide filtré, jamais la réponse) ; humain → `en_attente_admin` ; réutilisation d'une correction déjà validée (même épreuve, même signature d'exercices) → `livree`, versement de réutilisation, livraison.
- L'administration confirme avant toute assignation. `assigner` est refusé depuis `en_attente_admin`.
- Le correcteur ne peut pas être l'élève. Le validateur ne peut pas être l'auteur de la correction, ni l'élève. Un validateur doit avoir un profil correcteur au statut `valide`.
- Une revue approuvée compte jusqu'à N. À N, la demande passe à `livree`, le correcteur est payé, l'élève reçoit la livraison.
- Un rejet renvoie au même correcteur (`renvoyer`) ou rend la demande à l'administration (`reassigner`). Le correcteur n'est pas payé.
- Le validateur est payé à chaque revue, rejet compris.
- Passé le délai (défaut 48 h) sur `assignee` ou `en_revue`, la demande revient à l'administration sans correcteur.

Chaque transition est journalisée. L'administration est notifiée à chaque triage, y compris quand l'IA traite seule la demande (insertion directe dans `notification_inbox`). Les règles `correction_triage` et `correction_candidature` sont semées inactives : ce sont des modèles, pas le canal d'envoi.

## Paiements

Table `correction_versements`, clé unique `idempotency_key` :

- `correcteur:{correctionId}`
- `validateur:{revueId}`
- `reutilisation:{demandeId}:{correctionId}`

Le crédit passe par `get_or_create_wallet` et `credit_wallet`. Un doublon SQL ne recrédite pas. Montant nul ou utilisateur vide : aucun versement.

Fiabilité du correcteur : départ à 50, +5 si la correction est validée (plafond 100), −8 si elle est rejetée (plancher 0). La suggestion d'assignation score la fiabilité, la matière, le niveau et la charge ouverte. L'administration peut choisir un autre correcteur.

## Ce que voit l'élève

Jamais le champ brut `correction.contenu`. Le guide IA est passé par `correction_assainir_guide` / `correction_filtrer_reponse_directe` (les phrases du type « la réponse est … » et l'index QCM interne sont retirés). Le QCM ne révèle pas la bonne réponse. Le chemin humain ou réutilisé envoie l'enveloppe `livraison` au format `pedagogique` ou `pedagogique_courte`.

## Dépôt d'épreuve

Seuls les types `devoir`, `composition` et `examen` peuvent recevoir une demande. Le produit « corrigé type » du catalogue reste un achat séparé et n'est pas un support de demande. À l'envoi d'une épreuve, la case d'attestation est obligatoire. Un heuristique (et `pdftotext` si `EZOATO_PDFTOTEXT` est défini) signale un fichier qui ressemble à un corrigé ; l'administration décide.

Le rôle `repetiteur` n'existe pas dans `profil_type`. La candidature correcteur porte la qualité `enseignant` ou `repetiteur`, quel que soit le profil d'inscription. L'administration valide les deux pièces.

## Audio

`correction_transcrire()` accepte un rappel injecté (`deps['transcribe']`). Sinon, Whisper Groq (`GROQ_API_KEY`, modèle `EZOATO_WHISPER_MODEL` ou `whisper-large-v3`). Le web enregistre via `MediaRecorder`. L'application Flutter joint un fichier (`m4a`, `mp3`, `aac`, `wav`, `webm`, `ogg`) via `file_picker`. Si l'audio existe mais la transcription échoue et qu'il n'y a pas de texte, la demande est acceptée et classée `humaine`.

Les fichiers audio et justificatifs ne sont pas servis à côté des PDF publics : `uploads/corrections-audio/` et `uploads/corrections-justificatifs/{userId}/`, lus par des routes authentifiées. Le disque Render est éphémère, comme les autres uploads.

## Branche tuteur

Ne pas modifier `lib/ai.php`, `ai-flows.php` ni `RevisionWorkspace`. Si `ezoato_tutor_guide(array $input): array` existe, le triage l'appelle. Forme attendue :

```text
classe: comprehension|humaine
explications: string
exemples: string[]
qcm: [{id, prompt, choices, correctIndex}]
```

Sans cette fonction, un guide local est utilisé. Dans les deux cas le filtre anti-réponse directe s'applique. Le classement par défaut est prudent : une demande de solution va en file humaine ; « je ne comprends pas / explique » va en compréhension ; le reste va en file humaine.

## Branche freemium / paiement

`correction_eleve_est_pro()` s'appuie sur `user_has_active_subscription`. Admin et gestionnaire comptent comme Pro pour les essais. `correction_periode_pro()` suit `date_debut` de l'abonnement, sinon un créneau calendaire de `subscription_duration_months` (6).

L'encaissement passe par `FournisseurPaiement` (le même que l'abonnement Pro). L'élève appelle `POST /corrections/demandes/{id}/payer` (Flooz ou T-Money, montant de la demande). La confirmation simulée, la vérification opérateur ou le webhook `POST /webhooks/paiement` présente `EZOATO_CORRECTIONS_REGLEMENT_SECRET` au contrôle `hash_equals` de `POST /corrections/demandes/{id}/reglement` (`X-Ezoato-Reglement`). Sans ce secret, le règlement système est refusé. L'administration peut aussi confirmer depuis l'écran de file.

## Installation

```bash
mysql -u root zovu < backend-php/migration-demandes-correction.sql
php backend-php/tests/test-demandes-correction.php
```

Cron horaire :

```bash
php backend-php/cron/corrections_reassigner.php
```

L'écran admin peut aussi lancer le rattrapage des demandes échues.

## Routes principales

Publique : `GET /corrections/reglages-publics`.

Élève : `GET /corrections/mes-demandes`, `POST /corrections/demandes`, `GET /corrections/demandes/{id}`, `POST .../qcm`, `GET .../audio`.

Correcteur : `POST /corrections/candidature`, `GET /corrections/correcteur/profil`, `GET /corrections/correcteur/demandes`, `POST .../correction`.

Validateur : `GET /corrections/validateur/file`, `POST /corrections/validateur/corrections/{id}/revue`.

Admin : file, suggestions, réglages, décision de candidature, justificatifs, confirmer, renvoyer à l'IA, assigner, réassigner, renvoyer au correcteur, échéances.

Web : `/corrections`, `/corrections/nouvelle`, `/corrections/$id`, `/corrections/candidature`, `/corrections/correcteur`, `/corrections/validateur`, `/admin/corrections`.

Flutter (élève) : `/corrections`, `/corrections/nouvelle`, `/corrections/:id`.

## Conflits attendus

`feat/freemium-paiement-mobile-money` et `feat/tuteur-ia-guide` n'étaient pas sur le dépôt distant au moment de ce travail. Le module est isolé dans `backend-php/lib/corrections/`, `corrections.php`, `src/lib/corrections-api.ts` et `mobile/lib/features/corrections/`.

Fichiers partagés, donc conflits probables :

- `src/lib/dashboard-nav.ts`, `src/lib/types.ts`, `src/routeTree.gen.ts`
- `src/routes/submit.tsx`, `src/routes/epreuves.$id.tsx`, `src/routes/admin.tsx`
- `backend-php/.htaccess`, `backend-php/helpers.php` (`map_soumission`), `backend-php/soumissions.php`, `backend-php/lib/notifications.php`
- `package.json` (script `test:corrections`)
- Flutter : `app_router.dart`, `api_client.dart`, `account_shell_screen.dart`, `submit_screen.dart`, `epreuve_detail_screen.dart`

Non touchés : `payments.php`, `abonnements.php`, `src/lib/pricing.ts`, `lib/ai.php`, `ai-flows.php`, `RevisionWorkspace`.

## Points ouverts

- Encaissement Mobile Money : branché sur `FournisseurPaiement`. Le secret `EZOATO_CORRECTIONS_REGLEMENT_SECRET` est obligatoire pour la confirmation système.
- `GROQ_API_KEY` requis pour la transcription réelle.
- Stockage local des uploads, éphémère sur Render.
- `dev` est en retard sur `master` : la revue cible `master` pour ne pas embarquer les commits déjà sur `master` et absents de `dev`.
- Le produit « corrigé type » du catalogue (200 FCFA) reste distinct.
- Monter N au-delà de 2 peut dépasser la marge du prix unitaire 1 500 ; l'admin ajuste le prix en même temps.
