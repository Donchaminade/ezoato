# Audit de sécurité Ezoato — 9 octobre 2026

Audit autorisé par le propriétaire du dépôt. Périmètre : code de la branche `feat/freemium-paiement-mobile-money`, plus lecture seule de `feat/tuteur-ia-guide` (`5311280`) et `feat/demandes-de-correction` (`67928d0`). Ces deux branches ne sont pas fusionnées.

Revue de code (API PHP, web React, app Flutter, admin) et tests PHP locaux. Aucune requête vers ezoato.com, Hostinger, Render, Flooz, T-Money, PayGate ou FedaPay. L’environnement d’audit n’avait pas MySQL ni Apache : les preuves HTTP de bout en bout (403 sur `/uploads/`, 429 au login) n’ont pas été rejouées sur un serveur. Les contrôles purs sont couverts par `backend-php/tests/test-security-audit.php` (40 assertions).

## Résumé

| Gravité | Trouvées | Corrigées ici | Laissées documentées |
|---|---:|---:|---:|
| Critique | 3 | 3 | résidus locaux volontaires (voir chaque fiche) |
| Élevé | 13 | 10 | 3 |
| Moyen | 12 | 4 | 8 |
| Faible | 7 | 1 | 6 |
| **Total** | **35** | **18** | **17** |

Les trois critiques permettaient, sur un hôte public qui déployait le code tel quel, de forger une session admin, de télécharger les PDF payants sans payer, et d’activer l’abonnement Pro sans paiement réel. Elles sont fermées dès que `EZOATO_ENV=production` (ou dès que l’hôte HTTP n’est plus local) et qu’Apache applique les `.htaccess`.

À faire au déploiement, sinon une partie des correctifs reste inactive :

1. Exécuter `backend-php/migration-session-version.sql` (sinon les JWT ne sont pas révoqués après un changement de mot de passe).
2. Poser un `jwt_secret` long et aléatoire dans `backend-php/config.local.php` (fichier ignoré par git).
3. `EZOATO_ENV=production`. Ne pas définir `EZOATO_ALLOW_SIMULATED_PAYMENTS`, `EZOATO_ALLOW_INSECURE_JWT` ni `EZOATO_ALLOW_TEST_ACCOUNTS`.
4. Vérifier qu’Apache autorise `AllowOverride` pour `backend-php/.htaccess` et `backend-php/uploads/.htaccess`.

Le serveur PHP intégré (`php -S`) ignore `.htaccess` : ne pas l’utiliser pour exposer l’API.

## Tableau

| ID | Gravité | Sujet | Statut |
|---|---|---|---|
| C1 | Critique | JWT signé avec le secret public du dépôt + comptes seed | Corrigé (local conservé) |
| C2 | Critique | PDF sous `/uploads/` accessibles sans paywall | Corrigé (Apache) |
| C3 | Critique | Pro et paiement unitaire activés sans opérateur | Corrigé (local conservé pour le bouton simulé) |
| E1 | Élevé | Course sur le quota gratuit de 50 | Corrigé |
| E2 | Élevé | Débit de portefeuille et retraits concurrents | Corrigé |
| E3 | Élevé | Double crédit au rejet d’un retrait | Corrigé |
| E4 | Élevé | Double versement d’un palier contributeur | Corrigé |
| E5 | Élevé | Validateur rémunéré pour sa propre soumission | Corrigé |
| E6 | Élevé | Approbation de son propre retrait | Corrigé |
| E7 | Élevé | Aperçu payant mis en cache public | Corrigé |
| E8 | Élevé | `pdf_path` ou archive hors du dossier uploads | Corrigé |
| E9 | Élevé | Force brute login, inscription, mot de passe oublié | Corrigé |
| E10 | Élevé | JWT valable 30 jours, non révocable | Corrigé après migration SQL |
| E11 | Élevé | Tuteur IA : filtres regex contournables | Documenté, branche non fusionnée |
| E12 | Élevé | Réassignation vers un correcteur non validé | Documenté, branche non fusionnée |
| E13 | Élevé | `seroval` ≤ 1.6.2 (npm audit) et 14 avis high | Documenté, bump non appliqué |
| M1 | Moyen | Signature FedaPay ignorée si l’en-tête est absent | Corrigé |
| M2 | Moyen | Webhook acceptait un montant différent | Corrigé |
| M3 | Moyen | Redirection ouverte via une notification | Corrigé |
| M4 | Moyen | Contrôle de préfixe sur les archives | Corrigé |
| M5 | Moyen | Miniature page 1 hors quota | Documenté (choix produit) |
| M6 | Moyen | Rejeu du quota via plusieurs comptes | Partiel (plafond d’inscriptions) |
| M7 | Moyen | CORS vers le réseau local si l’API est en localhost | Documenté (app mobile) |
| M8 | Moyen | Jeton de reset dans l’URL | Documenté |
| M9 | Moyen | Filtre anti-injection du tuteur actuel, début de ligne seulement | Documenté |
| M10 | Moyen | Montants de correction pris dans le payload | Documenté, branche non fusionnée |
| M11 | Moyen | `php -S` n’applique pas le blocage de `/uploads/` | Documenté |
| M12 | Moyen | Un gestionnaire peut prolonger un Pro | Documenté (rôle support) |
| F1 | Faible | Pas de CSP ni HSTS côté front | Documenté |
| F2 | Faible | Le dernier admin peut être rétrogradé | Documenté |
| F3 | Faible | Formulaire de contact sans plafond | Documenté |
| F4 | Faible | PDF accepté sur l’en-tête `%PDF-` seulement | Documenté |
| F5 | Faible | Durée de session 30 jours | Documenté (produit mobile) |
| F6 | Faible | Mot de passe temporaire dans la réponse admin | Documenté |
| F7 | Faible | Listing de répertoires Apache | Corrigé |

Contrôles relus sans faille exploitable retenue : requêtes SQL utilisateur en requêtes préparées (pas de `unserialize`), clés LLM absentes du bundle (`VITE_*` ne porte pas de secret), jeton Flutter dans `FlutterSecureStorage`, pas de cookie de session (CSRF classique limité car le JWT voyage dans `Authorization`), assignation d’un correcteur déjà refusée si le profil n’est pas `valide` sur la branche corrections, auto-validation d’une correction déjà refusée sur cette même branche.

---

## Critique

### C1 — Secret JWT public et comptes de démonstration

**Où.** `backend-php/config.php` ligne 16 (`jwt_secret` = `CHANGE_ME_LONG_RANDOM_STRING`). `backend-php/seed-users.php` lignes 6, 10 et 30 : mot de passe commun `Tea2026!` et admin `a0000001-0000-4000-8000-000000000001` (`admin@tea.test`). Avant correctif, l’émission et la vérification des JWT lisaient `config.php` directement et ignoraient `config.local.php`.

**Reproduction locale.** Avec le secret du fichier versionné, construire un JWT HS256 `{"sub":"a0000001-0000-4000-8000-000000000001","exp":<maintenant+3600>}` et l’envoyer en `Authorization: Bearer`. Si le seed a été importé, la requête est admin. Sinon le même secret signe un jeton pour n’importe quel `sub` connu.

**Impact.** Prise de contrôle admin, lecture des portefeuilles, validation de soumissions, prolongation d’abonnements.

**Correctif.** `jwt_signing_secret()` (`backend-php/helpers.php` lignes 630-656) passe par `load_config()` puis `jwt_secret_effectif()` (`backend-php/lib/security.php` lignes 33-45). L’algorithme doit être HS256 (`jwt_entete_accepte`, lignes 47-52). Le placeholder est refusé (réponse 503 à l’émission, jeton rejeté à la lecture) dès que l’hôte n’est pas local ou que `EZOATO_ENV=production`. Les comptes `@tea.test` listés sont refusés au login dans les mêmes conditions (`backend-php/auth.php` lignes 100-102, `compte_test_interdit` lignes 63-69). En local, le placeholder et les comptes de test restent utilisables pour ne pas casser le développement. `EZOATO_ALLOW_INSECURE_JWT=1` et `EZOATO_ALLOW_TEST_ACCOUNTS=1` sont des opt-in explicites.

Le secret de production ne doit pas être commité : un nouveau secret dans git resterait public. Il vit dans `config.local.php`.

### C2 — Les énoncés sont servis en direct, sans paywall

**Où.** Les PDF validés sont sous `backend-php/uploads/`, dans la racine web. Le nom se reconstruit (type, id public, année). `backend-php/downloads.php` contrôle l’accès, mais un GET direct sur le fichier ne passait par aucun script.

**Reproduction locale.** Déposer un PDF dans `uploads/`, puis le demander par son URL. Apache le renvoyait avec le type PDF, sans JWT et sans quota.

**Impact.** Contournement du quota 50, du paywall concours et de l’abonnement Pro. Tout le catalogue publié est lisible.

**Correctif.** `backend-php/.htaccess` lignes 7-9 : `RewriteRule ^uploads/ - [F,L]`. `backend-php/uploads/.htaccess` : `Require all denied` (le dossier `uploads/` est ignoré, le fichier `.htaccess` est l’exception dans `backend-php/.gitignore`). Les scripts qui lisent un PDF vérifient en plus que le chemin réel reste dans `uploads` (`fichier_dans_uploads`, `backend-php/lib/security.php` lignes 107-112 ; `downloads.php` ligne 23).

**Résidu.** `php -S` n’honore pas `.htaccess` (M11). Le blocage dépend d’Apache (ou équivalent) avec `AllowOverride`.

### C3 — Abonnement Pro et paiement unitaire sans encaissement

**Où.** Tant que `PAYGATE_AUTH_TOKEN` et `FEDAPAY_SECRET_KEY` sont vides, `FournisseurSimule::verifierNotification` (`backend-php/lib/paiement-fournisseur.php` lignes 111-123) traite `{"reference","paye":true}` comme un paiement réussi. Le webhook `backend-php/webhooks-paiement.php` activait alors le Pro. `POST /account/abonnement/subscribe` avec la référence, et `payments.php` action `confirmer`, faisaient de même côté client.

**Reproduction locale.** Créer un abonnement `en_attente`, puis `POST /webhooks/paiement` avec le JSON ci-dessus, sans secret. Le statut passait à `actif` pour 6 mois. Le même corps, rejoué, ne doit créditer qu’une fois (idempotence déjà présente) mais la première activation était gratuite.

**Impact.** Pro illimité, accès aux concours payants, et confirmation d’un achat unitaire encore `en_attente`.

**Correctif.**

- Webhook simulé : refusé tant que `EZOATO_PAYMENT_WEBHOOK_SECRET` ne correspond pas à l’en-tête `X-Ezoato-Webhook-Secret` (`webhooks-paiement.php` lignes 21-26, `webhook_secret_correspond` lignes 82-93). Ce refus vaut aussi en local.
- Confirmation client d’un fournisseur simulé : `confirmation_client_peut_activer` (`lib/freemium.php` lignes 311-316) ne renvoie vrai que si `simulation_paiement_cliente_autorisee()` (`lib/security.php` lignes 71-79). Faux en production et sur un hôte public. Vrai en local, pour garder le bouton de paiement simulé du développement.
- `payments.php` lignes 51-54 et `abonnements.php` lignes 39-42 appliquent cette barrière avant d’écrire `confirme` / `actif`.

---

## Élevé

### E1 — Course sur le quota de 50

**Où.** `evaluer_acces_epreuve` lisait `acces_gratuits` puis insérait, sans verrou.

**Reproduction.** Deux consultations simultanées d’épreuves distinctes, quota déjà à 49 : les deux voyaient `used < 50` et inséraient.

**Impact.** Dépassement du gratuit, surtout sur devoirs et compositions.

**Correctif.** `backend-php/lib/acces-epreuve.php` lignes 111-136 : transaction, `SELECT id FROM users WHERE id=? FOR UPDATE`, recomptage, `INSERT` seulement si `used < limit`.

### E2 — Solde débité deux fois

**Où.** `debit_wallet` vérifiait le solde puis faisait `solde = solde - ?` sans condition. `wallet.php` action `retrait` n’enchaînait pas le contrôle, le débit et l’insert dans une transaction verrouillée.

**Reproduction.** Deux `POST` retrait concurrents pour le même solde : les deux passaient le test, le solde pouvait devenir négatif ou deux retraits partaient.

**Impact.** Sortie d’argent supérieure au solde.

**Correctif.** `helpers.php` lignes 1248-1269 : `UPDATE ... AND solde >= ?`, échec si `rowCount !== 1`. `wallet.php` lignes 57-84 : transaction, `SELECT solde ... FOR UPDATE`, un seul retrait `en_attente`, puis débit.

### E3 — Rejet de retrait crédité deux fois

**Où.** `admin.php` action `rejeter_retrait` passait le statut à `rejete` puis recrédite le portefeuille, sans lier les deux écritures.

**Reproduction.** Deux rejets concurrents du même id `en_attente` : deux crédits.

**Correctif.** `admin.php` lignes 120-128 : transaction, `UPDATE ... AND statut='en_attente'`, rollback si aucune ligne, crédit ensuite.

### E4 — Palier contributeur versé deux fois

**Où.** `reward_contributor` lisait `paliers_verses` puis créditait, sans compare-and-swap.

**Reproduction.** Deux validations simultanées qui franchissent le même palier de 50 épreuves.

**Correctif.** `helpers.php` lignes 1272-1308 : `SELECT ... FOR UPDATE` sur le portefeuille, puis `UPDATE paliers_verses ... WHERE paliers_verses = ?`. Le crédit n’a lieu que si une ligne a changé.

### E5 — Un validateur se récompense lui-même

**Où.** Valider sa propre soumission appelait `reward_contributor` comme pour un tiers.

**Impact.** Un compte admin/gestionnaire qui soumet et valide avance ses paliers (1 000 FCFA / 50 épreuves).

**Correctif.** `admin.php` lignes 1279-1282 : si le validateur est l’auteur et que la colonne existe, `recompense_eligible=0` avant `reward_contributor`. Le remplacement d’une soumission met déjà cette colonne à 0 dans `publier_et_valider_soumission`. `soumission_recompense_pour_validateur` (`lib/security.php` lignes 122-124).

### E6 — Un gestionnaire approuve son propre retrait

**Où.** `approuver_retrait` exigeait le rôle gestionnaire ou admin, pas un bénéficiaire différent.

**Impact.** Le bénéficiaire marque le retrait `paye` sans second regard. Le débit a déjà eu lieu à la demande ; le risque est un paiement opérateur déclenché sans contrôle.

**Correctif.** `admin.php` lignes 98-100, `retrait_approuve_par_tiers` (`lib/security.php` lignes 126-128). L’`UPDATE` exige encore `statut='en_attente'` (lignes 101-103).

### E7 — Cache public sur un PDF payant

**Où.** L’aperçu complet et le téléchargement envoyaient `Cache-Control: public`.

**Impact.** Un proxy ou un CDN peut resservir le PDF à un autre client après qu’un abonné l’a ouvert.

**Correctif.** Consultation et téléchargement : `private, no-store` (`epreuves-preview.php` lignes 31 et 39, `downloads.php` ligne 37), plus `X-Content-Type-Options: nosniff`. La miniature publique (page 1, pas une consultation) reste `public, max-age=3600` : voir M5.

### E8 — Chemin de fichier hors uploads

**Où.** Un `pdf_path` en base (ou un chemin d’archive) pouvait pointer vers un fichier du disque. `archives_resolve_path` utilisait `str_starts_with` sans séparateur : `epreuves` acceptait `epreuves-secret`.

**Impact.** Lecture de fichiers locaux si un admin ou une écriture SQL contrôle le chemin. Publication d’un PDF pris hors du dépôt d’uploads.

**Correctif.** `path_is_within` (`lib/security.php` lignes 100-105) exige le préfixe `base/` . `archives_resolve_path` (`lib/storage-paths.php` ligne 102) et `publish_soumission_to_epreuve` (ligne 113) s’en servent. Aperçu admin, image de soumission, logo partenaire et aperçu compte passent par `fichier_dans_uploads`.

### E9 — Force brute

**Où.** `auth.php` login, inscription et mot de passe oublié : aucun plafond. Mots de passe seed connus (C1) et identifiants e-mail devinables.

**Correctif.** Fichier temporaire `ezoa-auth-rl`, verrou `flock` (`lib/security.php` lignes 148-175). Login : 8 essais / 15 min / IP + identifiant, compteur remis à zéro si le mot de passe est bon (`auth.php` lignes 83-103). Inscription : 20 / heure / IP (ligne 45). Mot de passe oublié : 10 / heure / IP (ligne 118). Réponse 429.

**Résidu.** Le plafond est par IP, en fichiers locaux (perdus au redémarrage, contournables par plusieurs IP). Il limite le bruit ; il ne remplace pas une vérification d’e-mail (M6).

### E10 — Session non révocable

**Où.** `issue_auth_token` posait `exp` à 30 jours. Changer le mot de passe ne invalidait pas les JWT déjà émis. Pas de liste de révocation.

**Impact.** Vol de `localStorage` (`src/lib/auth.tsx`) : l’attaquant reste connecté après un reset.

**Correctif.** Claim `sv` et colonne `users.session_version` (`helpers.php` lignes 659-673 et 712-721, `schema.sql` ligne 11, `migration-session-version.sql`). Incrément au changement de mot de passe (`account.php` lignes 341-343), au reset admin (`admin.php` ligne 434) et au reset par lien (`auth.php` ligne 198). `session_version_accepte` (`lib/security.php` lignes 54-57) refuse un `sv` différent.

**Résidu.** Sans la migration, `column_exists` est faux et l’ancien comportement continue. La durée reste 30 jours (F5), choix produit mobile.

### E11 — Tuteur guidé : le filtre ne tient pas la réponse

**Branche.** `origin/feat/tuteur-ia-guide` @ `5311280`, non fusionnée. `backend-php/lib/ai-guide.php` lignes 395 (`ai_guide_leaks_answer`) et 491 (`ai_guide_seeks_answer`).

**Reproduction (lecture de code).** Les garde-fous sont des expressions régulières sur le texte plié. Une réponse chiffrée en toutes lettres (« x vaut douze »), une périphrase (« le nombre cherché correspond à 12 ») ou une demande qui ne contient pas les mots listés (`donne ... reponse`, `jailbreak`, `base64`) ne matchent pas. `ai_guide_solve_linear` ne couvre que les équations linéaires à une variable : le modèle peut donner la valeur d’un autre exercice sans déclencher le filtre lié.

**Impact.** Le tuteur fournit la solution malgré la consigne produit. Pas de fuite de clé API dans cette branche (les clés restent serveur) ; le risque est le contournement pédagogique et, si le modèle est naïf, l’exfiltration du prompt par une formulation hors liste.

**Correctif recommandé, à appliquer au moment du merge.** Ne pas se fier au regex comme barrière unique. Imposer un schéma de sortie (étape, indice, question) sans champ « réponse », relire la sortie par un classifieur ou un second appel borné, et refuser toute valeur numérique qui résout l’équation détectée, y compris en lettres. Tenir l’exercice hors du message système, comme le fait déjà `lib/ai.php` sur la branche courante.

### E12 — Réassigner un correcteur non validé

**Branche.** `origin/feat/demandes-de-correction` @ `67928d0`, non fusionnée.

`correction_service_assigner` (`lib/corrections/service.php` lignes 533-536) exige `statut = valide`. `admin_reassigner` (`corrections.php` lignes 293-297) appelle `correction_service_appliquer(..., 'reassigner')`. Le cas `reassigner` (`lib/corrections/machine.php` lignes 273-296) accepte n’importe quel `correcteur_id` distinct de l’élève, sans lire `correcteur_profils`.

La revue refuse déjà qu’un correcteur valide sa propre copie et que le demandeur valide (lignes 184-191). Ce point-là est sain.

**Impact.** Un gestionnaire (ou un admin) assigne la copie à un compte non validé, qui peut ensuite être payé au moment de la livraison (`payer_correcteur`, montant dans le payload : M10).

**Correctif recommandé au merge.** Dans le cas `reassigner`, même contrôle que `correction_service_assigner` : profil existant et `statut = valide`. Refuser l’auteur de la demande et le correcteur sortant s’il est aussi validateur.

### E13 — Dépendances npm

`npm audit` sur le lockfile (sans `node_modules`) : 1 avis critical, `seroval` ≤ 1.6.2 (`GHSA-p6vx-979v-rg4c`, `fromJSON`), et 14 high, surtout du déni de service sur la chaîne de build (`brace-expansion`, `postcss`, `browserslist`, `tailwind`, `js-yaml`). Le lockfile demande `seroval` `^1.5.4` (plusieurs occurrences). Pas de `composer.json`.

**Impact.** L’avis seroval est critical en amont (désérialisation). Cet audit n’a pas montré un chemin où une charge contrôlée par l’attaquant atteint `fromJSON` sur une action privilégiée : TanStack Start s’en sert pour la sérialisation SSR. Les high sont en majorité des outils de dev. D’où le classement Élevé, pas Critique, tant que le puits n’est pas confirmé.

**Correctif recommandé.** Après `npm ci`, monter `seroval` vers une version corrigée, relancer `npm audit` et la suite front. Non fait ici : pas de `node_modules` dans l’environnement, et un bump de lockfile non testé peut casser le build.

---

## Moyen

### M1 — Signature FedaPay absente = acceptée

**Où.** `FournisseurFedapay::verifierNotification` sautait le HMAC si `X-Fedapay-Signature` était vide, puis interrogeait l’API. L’impact réel était limité par ce second appel, qui n’a pas été testé contre FedaPay (hors périmètre).

**Correctif.** `lib/paiement-fournisseur.php` lignes 301-306 : si le secret est non vide, signature absente ou fausse = refus. Le statut est encore relu chez l’opérateur ensuite.

### M2 — Montant du webhook non comparé

**Où.** Une notification pouvait porter un montant autre que celui de la ligne `abonnements`. L’activation ne recopiait pas ce montant sur la ligne, donc l’encaissement comptable pouvait diverger de l’opérateur.

**Correctif.** `webhooks-paiement.php` lignes 42-47 et `montant_notification_compatible` (`lib/security.php` lignes 95-98). Un montant absent reste accepté (certains callbacks ne le renvoient pas) ; un montant présent doit être égal.

### M3 — Redirection ouverte

**Où.** `NotificationsInboxSheet` faisait `window.location.assign` pour toute URL `http(s)`. L’admin `notifier_abonnes` enregistrait l’URL telle quelle.

**Reproduction.** Notification `url = https://exemple-adverse.tld` : le clic quittait le site, jeton toujours en `localStorage` sur l’origine Ezoato, mais phishing crédible.

**Correctif.** `src/components/dashboard/NotificationsInboxSheet.tsx` lignes 19-32 : refus de `//`, des blancs, et de toute origine différente ; une URL absolue de la même origine est réduite au chemin. `admin.php` ligne 1433 : `url_interne_sure` (`lib/security.php` lignes 114-120) ou repli `/account/notifications`.

### M4 — Préfixe d’archive

Voir E8. Le cas du répertoire frère est le même correctif `path_is_within`.

### M5 — Miniature de la page 1

**Où.** `visionneuse_requiert_acces` (`lib/freemium.php` lignes 72-75) ne compte pas la page 1 hors mode lecture, sauf si le palier est `pro` ou si le PDF complet est demandé. `epreuves-preview.php` lignes 22-31 sert alors l’image sans quota, en cache public.

**Impact.** La première page d’un devoir ou d’une composition est lisible sans compte. Les concours (`tier = pro`) restent couverts. Choix produit assumé : non modifié.

**Recommandation.** Si la page 1 contient l’énoncé utile, exiger au moins une session, ou une image réellement tronquée.

### M6 — Plusieurs comptes, quota rejoué

L’inscription crée un utilisateur et un JWT sans vérification d’e-mail. Chaque compte a son quota de 50. E9 plafonne à 20 inscriptions par heure et par IP.

**Recommandation.** Confirmation d’e-mail avant de consommer le quota, et quota lié au numéro de téléphone déjà unique.

### M7 — CORS réseau local

**Où.** `helpers.php` lignes 533-540 : si `api_base_url` est localhost, une origine `http://10.x` / `192.168.x` / `172.16-31.x` est reflétée avec `Allow-Credentials`.

**Impact.** Sur un poste de dev, un site ouvert dans le navigateur du LAN peut appeler l’API. Le JWT n’est pas un cookie, donc le navigateur ne l’attache pas seul. Volontaire pour l’app mobile sur le LAN : non retiré.

**Recommandation.** Désactiver ce reflet dès que `EZOATO_ENV=production`.

### M8 — Jeton de réinitialisation dans l’URL

**Où.** `auth.php` lignes 130-140. Jeton aléatoire de 32 octets, stocké hashé, valable 1 heure, usage unique. `expose_reset_links` est faux par défaut : le lien n’est pas dans le JSON.

**Risque résiduel.** Le jeton passe dans la query du front. Un Referer vers un tiers, ou un journal de proxy, le capture. L’API envoie maintenant `Referrer-Policy: no-referrer` (`helpers.php` ligne 527) ; le document HTML du front ne le fait pas.

**Recommandation.** Fragment (`#`) plutôt que query, ou écran qui retire le jeton de l’historique.

### M9 — Injection de prompt sur le tuteur déjà en branche

**Où.** `lib/ai.php` lignes 162-191 : `ai_strip_instruction_overrides` ne retire que les lignes qui *commencent* par `ignore`, `jailbreak`, etc. Une consigne au milieu d’un paragraphe reste. Le texte élève est hors du prompt système et enveloppé dans `UNTRUSTED_DATA` (lignes 195-214). Les clés ne sortent pas dans les erreurs. Les tests `test-ai-security.php` couvrent ce contrat.

**Recommandation.** Compléter au merge du tuteur guidé (E11). Ne pas élargir le regex tout seul : il se contourne.

### M10 — Montants de rémunération dans le payload

**Branche.** `67928d0`, `correction_service_appliquer` (`service.php` lignes 182-184) : `remuneration_correcteur`, `forfait_validateur` et `montant_reutilisation` du payload écrasent les réglages. La revue HTTP actuelle ne transmet pas ces champs. Un appel interne ou un futur client qui les envoie fixe le gain, dans la borne 0–100 000 des réglages.

**Recommandation au merge.** Ignorer ces clés si l’acteur n’est pas un admin, et toujours relire le barème en base au moment de `payer_correcteur` / `payer_validateur`.

### M11 — Serveur PHP intégré

`php -S` ne lit pas `.htaccess`. C2 est alors inopérant. Réserver `php -S` au développement, avec des PDF factices.

### M12 — Prolongation Pro par un gestionnaire

**Où.** `admin.php` lignes 1453-1458, `prolonger_abonnement` (`lib/abonnement-rappels.php` ligne 56). Rôle gestionnaire ou admin, 1 à 365 jours, sans paiement.

**Impact.** Abus interne : Pro offert. Fonction de support conservée.

**Recommandation.** Réserver au rôle `admin`, journaliser (montant équivalent, motif) et plafonner plus bas par défaut. Sur la branche corrections, `confirmer_reglement` accepte aussi le gestionnaire, ou l’en-tête `X-Ezoato-Reglement` si le secret correspond (`corrections.php` lignes 89-96) : même réserve au merge.

---

## Faible

### F1 — En-têtes navigateur

L’API envoie `nosniff`, `DENY`, `Referrer-Policy`, `Permissions-Policy` (`helpers.php` lignes 525-529). Le front n’envoie pas de Content-Security-Policy ni de HSTS. HSTS se pose au reverse proxy HTTPS.

### F2 — Dernier administrateur

La suppression du dernier admin est refusée (`admin.php` lignes 456-458). `modifier_user` (ligne 346) peut passer son rôle à `utilisateur` sans ce contrôle. Un admin authentifié peut ainsi verrouiller l’admin.

**Recommandation.** Même garde que la suppression, et interdire de se retirer le rôle admin s’il est seul.

### F3 — Contact

`contact.php` n’a pas de plafond. Usage : spam du destinataire `contact@`. Pas d’injection SQL repérée (requêtes préparées).

### F4 — PDF polyglot

`validate_uploaded_pdf` (`lib/image-pdf.php` lignes 144-153) exige `%PDF-` et un MIME qui contient `pdf` ou un nom en `.pdf`. Un polyglot peut passer. L’exécution PHP est empêchée si Apache n’interprète pas les PDF et si C2 bloque `/uploads/`. Les justificatifs de la branche corrections mappent l’extension sur le MIME annoncé : même réserve, pas d’exécution PHP directe.

### F5 — JWT 30 jours

`helpers.php` ligne 662. Accepté pour le mobile. E10 limite la fenêtre après un changement de mot de passe, une fois la migration appliquée.

### F6 — Mot de passe temporaire dans le JSON

`admin.php` ligne 443 : `temporaryPassword` dans la réponse, après vérification du mot de passe admin. Nécessaire pour le remettre à l’utilisateur. Ne pas journaliser ce champ. La session précédente est invalidée (E10).

### F7 — Index de répertoires

`backend-php/.htaccess` ligne 5 : `Options -Indexes`.

---

## Correctifs livrés

| Fichier | Rôle |
|---|---|
| `backend-php/lib/security.php` | Secret JWT, webhook, chemins, throttle, règles métier pures |
| `backend-php/helpers.php` | JWT, en-têtes, débit conditionnel, palier verrouillé, claim `sv` |
| `backend-php/auth.php` | Plafonds, comptes seed, révocation au reset |
| `backend-php/payments.php`, `abonnements.php`, `webhooks-paiement.php`, `lib/freemium.php`, `lib/paiement-fournisseur.php` | Paiement simulé, montant, signature FedaPay |
| `backend-php/wallet.php`, `admin.php`, `lib/acces-epreuve.php` | Retraits, auto-récompense, quota |
| `backend-php/downloads.php`, `epreuves-preview.php`, `account.php`, `partners.php`, `lib/storage-paths.php` | Fichiers sous `uploads/`, cache privé |
| `backend-php/.htaccess`, `backend-php/uploads/.htaccess` | Blocage HTTP du dépôt |
| `backend-php/migration-session-version.sql`, `schema.sql` | Colonne `session_version` |
| `src/components/dashboard/NotificationsInboxSheet.tsx` | URL de notification interne |
| `.env.example` | Variables `EZOATO_ENV` et secrets de contournement |
| `backend-php/tests/test-security-audit.php` | Non-régression des règles pures |

Tests relancés dans l’environnement d’audit : `test-security-audit.php` (40), `test-freemium.php` (62), `test-ai-security.php` (201, 1 skip HTTP), `test-niveau.php` (12), `test-security-soumissions.php` (5, 1 skip HTTP). Pas de serveur Apache ni de base MySQL : les parcours HTTP authentifiés n’ont pas été rejoués.
