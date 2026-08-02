# Notes orateur — Pitch EZOA-TO

Durée indicative : **10–14 minutes** (14 slides). Une idée par slide.  
Tous les chiffres marché et revenus ci-dessous sont des **estimations / projections indicatives** ; jamais des résultats réalisés.

**Contact deck :** infoezoato@gmail.com · https://github.com/Donchaminade  
**Équipe :** Chaminade Dondah Adjolou (Fondateur principal · CEO & CTO · Développeur) · Divine HIBA (PM & BA)

---

## Glossaire (à verbaliser si besoin)

| Abréviation | Forme complète | Note orale |
|-------------|----------------|------------|
| **MM** | Mobile Money | Flooz / T-Money au Togo |
| **MEN** | Ministère de l’Éducation nationale (et de la Formation) | Source effectifs élèves |
| **Pro** | Abonnement Pro EZOA-TO | 1 000 FCFA / 6 mois |
| **1ers Pro** | Premiers abonnements Pro payants | Preuve de monétisation |
| **TAM** | Total Addressable Market — marché total adressable | ~10 M élèves secondaire AO francophone |
| **SAM** | Serviceable Available Market — marché accessible | ~370 k (Togo × smartphone / internet utile) |
| **SOM** | Serviceable Obtainable Market — marché obtenable | 3–8 k Pro payants à 18–24 mois |
| **AO** | Afrique de l’Ouest | Zone d’expansion francophone |
| **CEPD / BEPC / BAC** | Certificat d’études du premier degré / Brevet d’études du premier cycle / Baccalauréat | Socle secondaire général |
| **CAP / BT / BTS** | Certificat d’aptitude professionnelle / Brevet de technicien / Brevet de technicien supérieur | Filières professionnelles & post-secondaire |
| **Concours** | Concours nationaux (écoles, accès sélectif ; upside fonction publique) | Demande forte, propension à payer plus haute |
| **MAU** | Monthly Active Users — utilisateurs actifs mensuels | **Ne pas inventer** de MAU |

Sur les slides, les abréviations sont développées ou glossées à la **première occurrence**.

---

## 1. Couverture

- Se présenter : **Chaminade Dondah Adjolou**, fondateur principal, CEO & CTO et développeur d’**EZOA-TO** ; présenter **Divine HIBA**, Project Manager & Business Analyst.
- Slogan : *Archive. Révise. Excelle.* — promesse claire pour élèves et parents.
- Adapter l’accroche : investisseurs (opportunité + ask 25 M) / partenaires / chefs d’établissement (accès & qualité).
- Contact : `infoezoato@gmail.com` + GitHub du fondateur.

---

## 2. Problème

- Au Togo, les sujets circulent encore surtout via WhatsApp, photocopies, groupes Facebook et PDF épars.
- Pas d’endroit unique, fiable, filtrable par classe / matière / examen national (CEPD, BEPC, BAC — puis CAP, BT, BTS, concours).
- Inégalité d’accès à la révision → impact sur les résultats — le réseau social décide, pas le mérite.

---

## 3. Solution

- EZOA-TO = bibliothèque nationale d’épreuves (web + mobile).
- Socle examens : **CEPD, BEPC, BAC** + devoirs / compositions.
- **Fonctionnalité livrée (PR #8)** : **4 niveaux** — collège, lycée, université, concours — avec formulaires de soumission adaptatifs et filtres archives. Pas seulement une roadmap 12–18 mois.
- Contenu catalogue CAP / BT / BTS / concours = **prochaine expansion** (remplir les rayons), pas la capacité produit.
- Chercher, consulter, télécharger ; favoris et hors ligne pour le terrain (3G, lycée).
- Qualité : soumissions communautaires + **validation humaine** avant publication.

---

## 4. Produit / démo

- Montrer 30–60 s : Archives (filtre **niveau**) → fiche PDF → compte (favoris / bibliothèque / Pro).
- **4 niveaux livrés** + formulaires adaptatifs (collège / lycée / univ. / concours) — plateforme multi-niveaux, pas uniquement BAC.
- Flux contributeur : photo → PDF → admin → récompense portefeuille → retrait Mobile Money.
- Stack crédible : Flutter, React, PHP/MySQL — **produit opérationnel**, pas une maquette.

---

## 5. Marché — chiffres & méthodologie

### Chiffres affichés sur la slide

| Couche | Chiffre slide | Logique |
|--------|---------------|---------|
| **TAM** (marché total adressable) | ~10 M élèves | Secondaire Afrique de l’Ouest francophone (éducation digitale / annales) |
| **SAM** (marché accessible) | ~370 k | Élèves secondaire Togo × accès smartphone / internet |
| **SOM** (marché obtenable) | 3–8 k | Abonnés Pro payants à 18–24 mois |

### Base Togo (effectif réel)

- **~912 400** élèves du secondaire général en 2024-2025 :
  - 697 532 premier cycle (collège)
  - 214 868 second cycle (lycée)
- Source : Ministère de l’Éducation nationale / DPSSE — plateforme planification éducation Togo  
  https://planifeducation.gouv.tg/dpsse/
- Contexte historique UIS / Banque mondiale : ~711 k élèves secondaire général (2018) — la tendance est à la hausse ; le chiffre MEN 2024-25 est la référence opérationnelle.  
  https://www.indexmundi.com/facts/togo/indicator/SE.SEC.ENRL.GC  
  (indicateur UNESCO UIS `SE.SEC.ENRL.GC`)

### SAM — méthodologie

- Population secondaire Togo ≈ **912 k**.
- Pénétration internet nationale début 2024 : **37,6 %** (3,44 M utilisateurs) — DataReportal *Digital 2024: Togo*  
  https://datareportal.com/reports/digital-2024-togo
- Connexions mobiles : **6,91 M** (~75,5 % de la population) — même source / GSMA Intelligence.
- Hypothèse SAM : **~40 %** des élèves du secondaire ont un accès utile smartphone + internet (proche de la pénétration internet nationale ; biais jeunesse / urbain légèrement favorable).  
  → 912 k × 0,40 ≈ **365–370 k**.
- Fourchette crédible à verbaliser : **300–450 k** selon hypothèse 33–50 %.

### TAM — méthodologie

- Marché adressable : élèves du **secondaire en Afrique de l’Ouest francophone** (UEMOA + pays proches) pour contenus digitaux d’examens / annales.
- Pas de total officiel unique UIS pour la zone ; estimation **8–12 M** d’élèves inscrits, point médian **~10 M**.
- Ancrages :
  - Populations d’âge scolaire secondaire (UIS country profiles) très élevées (ex. Sénégal ~2,9 M âge scolaire secondaire ; Burkina ~3,8 M) — l’effectif *inscrit* est inférieur mais agrégé multi-pays reste multi-millions.  
    https://download.uis.unesco.org/SDG4/SDG4-Profile-Senegal.pdf  
    https://download.uis.unesco.org/SDG4/SDG4-Profile-Burkina%20Faso.pdf  
  - Navigateur UIS : https://databrowser.uis.unesco.org/
- Contexte marché EdTech :
  - Afrique EdTech ~ **0,6–1 Md USD** (estimations croisées UEMOA / Injini / EdTech Hub, rapport UNDP mapping)  
    https://www.undp.org/sites/g/files/zskgke326/files/2026-07/strategic_mapping_of_the_edtech-eng.pdf
  - Online education Afrique de l’Ouest : ~**891 M USD** (2025), CAGR élevé (~22 %) — IMARC  
    https://www.imarcgroup.com/west-africa-online-education-market
  - WAEMU EdTech ecosystem overview :  
    https://cdn.buttercms.com/JVVOJPXzTGuQb7cRC0FL

### SOM — méthodologie

- Objectif **pre-traction → early traction** : **3 000–8 000** abonnés Pro à 18–24 mois.
- Logique : **~1–2 %** du SAM (~370 k) = 3,7–7,4 k — cohérent avec un pilote lycées puis couverture nationale progressive.
- **Ne pas présenter comme engagement contractuel** — objectif de pilotage (voir aussi slide 13 projections).

### Upside filières pro & concours (oral)

- Le SAM slide (~370 k) est ancré sur le **secondaire général**. Au Togo, **CAP / BT** (enseignement technique & professionnel) et **BTS** (post-bac court) élargissent l’adresseable sans changer le modèle produit.
- Les **concours** (écoles sélectives, formations, et plus tard concours administratifs) ont souvent une **propension à payer plus élevée** que la révision scolaire de base — packs / Pro plus faciles à justifier pour candidats motivés.
- À l’oral : « Le tableau de base reste secondaire ; CAP / BTS / concours = **upside de volume et d’ARPU**, pas encore dans le SOM chiffré. »

### Mobile Money (facilitateur de monétisation)

- **3,55 M** utilisateurs Mobile Money (mars 2024) — TMoney ~2,16 M, Flooz ~1,4 M — ARCEP / Togo First  
  https://www.togofirst.com/en/itc/0210-14907-as-of-march-2024-togo-had-7-3-million-mobile-users-including-3-55-million-mobile-money-users
- Pénétration MM citée ~**45,4 %** (mi-2024)  
  https://www.togofirst.com/en/telecom/2810-15076-togocom-launches-new-subsidiary-to-manage-mobile-money-segment
- 7,3 M abonnés mobiles (mars 2024) — même dossier ARCEP.

---

## 6. Business model

- Freemium : devoirs / compositions gratuits ; examens nationaux monétisés.
- **Pro 1 000 FCFA / 6 mois** (~167 FCFA/mois) + achat à l’unité (~100–200 FCFA).
- Contributeurs ~1 000 FCFA / soumission validée — croissance du catalogue alignée sur l’usage.
- Mobile Money : Flooz / T-Money.

### Justification prix 1 000 FCFA / 6 mois

- Ordre de grandeur d’une **petite liasse de photocopies** ou d’un forfait data court — friction d’achat faible via MM.
- ARPU annuel Pro ≈ **2 000 FCFA** (~3 USD) — micropaiement mass-market, pas tutoring premium.
- Comparables régionaux (ordres de grandeur, modèles différents) :
  - **Eneza Education** : abonnements journaliers / hebdo / mensuels via airtime ; package corporate ~**26 USD / utilisateur / an**  
    https://education-au.org/139-survey-1/lms-platforms/422-eneza-education-cote-d-ivoire-ghana-kenya
  - **EduMali** (cours + mentorat BAC) : forfaits annuels sujets **65–85 k FCFA** — bien au-dessus ; EZOA se positionne archive / accès sujets, pas cours live.  
    https://liners.com/edumali
  - Bibliothèques d’annales / packs révision Afrique de l’Est (ex. CBCEduKenya) : abonnements quelques dollars via M-Pesa — même logique micropaiement.  
    https://cbcedukenya.com/membership
  - Tendance Afrique : monétisation via **mobile money + micropaiements** (IMARC e-learning Africa)  
    https://www.imarcgroup.com/africa-e-learning-market
- Pitch verbal : « Moins cher qu’un cours de soutien d’une heure ; plus fiable qu’un groupe WhatsApp. »

---

## 7. Traction

- **Honnêteté** : produit opérationnel / prêt pilote — **pas** de MAU ni de revenus inventés.
- Vrai aujourd’hui : parcours bout en bout (archives, soumission, admin, Pro, paiements MM), stack mobile + web + API, itération GitHub.
- **Fonctionnalité livrée** : 4 niveaux + **détection de doublons admin** (similarité / split UI) — livré sur branche, en cours d’intégration (PR #8 → `dev`), pas encore forcément en prod `master`.
- Prochaines preuves à collecter (et à mettre à jour dans le deck) : n° d’épreuves validées, lycées pilotes signés, premiers paiements Pro, taux de rétention 6 mois.
- Formulation investisseur : *le risque est l’exécution go-to-market, pas l’existence du produit.*

---

## 8. Concurrence / positionnement (tableau)

- Concurrent réel = **chaos informel** : WhatsApp, photocopies, Facebook, PDF dispersés.
- Tableau slide : Fiabilité · Recherche · Hors ligne · Paiement · Validation — EZOA-TO en ligne mise en avant.
- Apps francophones de révision (ex. Nomad Education, OkpaBac) = plutôt cours / quiz / annales multi-pays — **peu d’archive nationale togolaise + validation + Flooz/T-Money + contributeurs rémunérés**.  
  https://www.nomadeducation.fr/nos-engagements/afrique  
  https://okpabac.com/
- Différenciateurs EZOA : focus Togo, validation humaine, Mobile Money local, offline, portefeuille contributeur.
- Ne pas dénigrer ; montrer le passage du « bricolage » à une **archive de confiance**.

---

## 9. Go-to-market

- **Pilotes** : 3–5 lycées (Lomé + 1–2 régions) — accès Pro découverte pour mesurer conversion.
- Ambassadeurs élèves / profs contributeurs récompensés.
- Campagnes WhatsApp / Facebook calées sur calendrier CEPD / BEPC / BAC (puis sessions CAP / BT / BTS / concours).
- **B2B écoles** (indicatif) : licence annuelle établissement = accès classes + canal de dépôt de sujets ; prix à co-construire (ex. forfait selon effectif).
- Notifications ciblées par classe = rappel utile, pas spam.

---

## 10. Équipe

- **Chaminade Dondah Adjolou** — Fondateur principal · CEO & CTO · Développeur : vision, architecture et développement produit (mobile, web, backend, paiements).
- **Divine HIBA** — Project Manager & Business Analyst : pilotage, besoins métier, coordination terrain / écoles.
- Rôles ouverts (**recrutement prévu**) : ops contenu / validation, partenariats établissements, growth.
- Ne pas inventer d’autres membres.

---

## 11. Roadmap 6 / 12 / 18 mois

- **Livré (PR #8)** : modèle **4 niveaux** + formulaires adaptatifs + anti-doublons admin — en déploiement / intégration `dev`.
- **6 mois** : 3–5 lycées pilotes, catalogue examens clés, Mobile Money stable, Play Store, premiers Pro + KPIs.
- **12 mois** : **expansion contenu** — couverture nationale CEPD / BEPC / BAC, puis volumes CAP / BT / BTS et concours (catalogue ciblé, contributeurs filières) ; licence établissements ; rétention Pro.
- **18 mois** : 1er pays voisin Afrique de l’Ouest francophone, corrigés / parcours, dialogue Ministère de l’Éducation / partenaires éducation.

---

## 12. Financement — ask verrouillé 25 M FCFA

### Ticket

| Élément | Valeur |
|---------|--------|
| **Ask** | **25 M FCFA** (fixe, pas une fourchette) |
| **Équivalent indicatif** | ≈ **~38 k USD** (taux ~650–660 FCFA / USD — arrondir à l’oral) |
| **Stade** | Ticket **seed / pré-amorçage** — adapté pré-seed / MVP opérationnel |
| **Pourquoi 25 M est raisonnable** | Runway lean pour pilotes + contenu + stores + Mobile Money, sans sur-levier avant traction |

### Allocation des fonds (somme = 25 M FCFA)

| Poste | % | Montant FCFA | Usage |
|-------|---|--------------|--------|
| Produit & infra | **35 %** | **8,75 M** | Stores, perf, offline, fiabilité API, UX paiement |
| Contenu & validation | **25 %** | **6,25 M** | Catalogue exams, ops validation, récompenses contributeurs |
| Acquisition & écoles | **25 %** | **6,25 M** | Pilotes lycées, ambassadeurs, campagnes examens |
| Ops & conformité | **15 %** | **3,75 M** | Flooz/T-Money, support, légal / conformité |
| **Total** | **100 %** | **25 M** | |

### Jalons débloqués avec 25 M

- Publication stores + Mobile Money stable en production  
- 3–5 lycées pilotes + premiers abonnements Pro  
- Couverture catalogue examens nationaux prioritaires  
- Base contributeurs / validation opérationnelle  
- KPIs mesurables pour une prochaine round éventuellement

### Alternatives soft

- Partenariats écoles, incubateurs, mécénat éducation — sans equity si préféré.

---

## 13. Projections & unit economics (confiance investisseur)

**Label obligatoire à l’oral et sur la slide :** *projections indicatives — pas des résultats réalisés.*

### Unit economics

| Métrique | Valeur |
|----------|--------|
| Prix Pro | **1 000 FCFA / 6 mois** |
| ARPU annuel (si renouvellement) | **~2 000 FCFA / abonné / an** |
| Achat à l’unité | 100–200 FCFA / examen (complément, non modélisé ici) |

### Hypothèses de projection (conservateur / médian / ambitieux)

- Revenu annuel approximatif = **nb d’abonnés Pro × 2 000 FCFA** (renouvellement annuel implicit).
- Pas de revenus B2B écoles dans le tableau (upside non compté).
- **Upside CAP / BT / BTS / concours non inclus** dans le tableau Pro de base : plus d’élèves / candidats adressables + propension à payer souvent plus haute sur les concours (packs ou Pro ciblés). À verbaliser comme **projection d’expansion**, pas comme revenu déjà modélisé.
- Pas de churn / saisonnalité examens modélisés finement — scénarios d’ordre de grandeur.
- Cohérence SOM : médian 24 mois ≈ **5 000 Pro** ; ambitieux ≈ **8 000 Pro** (haut de fourchette SOM).

| Horizon | Conservateur | Médian | Ambitieux |
|---------|--------------|--------|-----------|
| **12 mois** | 800 Pro · ~**1,6 M** FCFA/an | 2 000 Pro · ~**4 M** | 4 000 Pro · ~**8 M** |
| **24 mois** | 2 500 Pro · ~**5 M** FCFA/an | 5 000 Pro · ~**10 M** | 8 000 Pro · ~**16 M** |

### Break-even (narrative)

- Ops lean post-pilote : ordre de grandeur **~5–7 M FCFA / an** (petite équipe + infra + validation).
- Seuil : **5–7 M ÷ 2 000 ≈ 2 500–3 500 abonnés Pro** pour couvrir ces ops (hors croissance agressive).
- Le ticket 25 M finance la **phase d’acquisition** jusqu’à ce seuil ; la rentabilité n’est pas promise à 12 mois (scénario médian 12 mois ≈ 4 M < ops).

### Pourquoi 25 M suffit (rappel)

- Assez pour exécuter GTM + contenu sans dilution massive pré-traction.
- Trop peu pour « scale pan-africain » — assumer : c’est un **ticket de validation**, pas un Series A.

---

## 14. Merci / prochaines étapes

- Clôturer : *le passé scolaire du Togo, au service de l’avenir des élèves.*
- Proposer clairement : **démo** → **cadre pilote lycée** → **call diligence / term sheet**.
- Laisser contact visible : `infoezoato@gmail.com` · GitHub fondateur.
- Ne pas improviser de traction chiffrée en réponse aux questions — renvoyer aux preuves à venir.

---

## Liste sources (URLs)

1. MEN-Togo / DPSSE effectifs 2024-25 — https://planifeducation.gouv.tg/dpsse/
2. UNESCO UIS / historique élèves secondaire Togo — https://www.indexmundi.com/facts/togo/indicator/SE.SEC.ENRL.GC
3. UNESCO UIS Data Browser — https://databrowser.uis.unesco.org/
4. UIS profil Sénégal (âge scolaire secondaire) — https://download.uis.unesco.org/SDG4/SDG4-Profile-Senegal.pdf
5. UIS profil Burkina Faso — https://download.uis.unesco.org/SDG4/SDG4-Profile-Burkina%20Faso.pdf
6. DataReportal Digital 2024 Togo (internet / mobile) — https://datareportal.com/reports/digital-2024-togo
7. ARCEP / Togo First — mobiles & Mobile Money mars 2024 — https://www.togofirst.com/en/itc/0210-14907-as-of-march-2024-togo-had-7-3-million-mobile-users-including-3-55-million-mobile-money-users
8. Togo First — pénétration MM / Tmoney S.A. — https://www.togofirst.com/en/telecom/2810-15076-togocom-launches-new-subsidiary-to-manage-mobile-money-segment
9. UNDP — Strategic mapping of EdTech (Afrique / UEMOA) — https://www.undp.org/sites/g/files/zskgke326/files/2026-07/strategic_mapping_of_the_edtech-eng.pdf
10. IMARC — West Africa online education market — https://www.imarcgroup.com/west-africa-online-education-market
11. IMARC — Africa e-learning market — https://www.imarcgroup.com/africa-e-learning-market
12. WAEMU EdTech ecosystem (ButterCMS / mapping) — https://cdn.buttercms.com/JVVOJPXzTGuQb7cRC0FL
13. Eneza Education (pricing / modèle) — https://education-au.org/139-survey-1/lms-platforms/422-eneza-education-cote-d-ivoire-ghana-kenya
14. EduMali (comparaison prix tutoring) — https://liners.com/edumali
15. Nomad Education Afrique — https://www.nomadeducation.fr/nos-engagements/afrique
16. OkpaBac — https://okpabac.com/
17. Dépôt GitHub fondateur — https://github.com/Donchaminade
18. Remote projet — https://github.com/Donchaminade/ezoa.git
