# Notes orateur — Pitch EZOA-TO

Durée indicative : **8–12 minutes**. Une idée par slide.  
Tous les chiffres marché ci-dessous sont des **estimations** ; les slides portent la mention « estimations / sources ».

**Contact deck :** contact@ezoa.tg · https://github.com/Donchaminade  
**Équipe :** Chaminade Dondah Adjolou (CEO & CTO) · Divine HIBA (PM & BA)

---

## 1. Couverture

- Se présenter : **Chaminade Dondah Adjolou**, CEO & CTO d’**EZOA-TO** ; présenter **Divine HIBA**, Project Manager & Business Analyst.
- Slogan : *Archive. Révise. Excelle.* — promesse claire pour élèves et parents.
- Adapter l’accroche : investisseurs (opportunité + ask) / partenaires / chefs d’établissement (accès & qualité).
- Contact : `contact@ezoa.tg` (à confirmer / rediriger vers boîte réelle) + GitHub du fondateur.

---

## 2. Problème

- Au Togo, les sujets circulent encore surtout via WhatsApp, photocopies, groupes Facebook et PDF épars.
- Pas d’endroit unique, fiable, filtrable par classe / matière / examen national (CEPD, BEPC, BAC).
- Inégalité d’accès à la révision → impact sur les résultats — le réseau social décide, pas le mérite.

---

## 3. Solution

- EZOA-TO = bibliothèque nationale d’épreuves (web + mobile).
- Chercher, consulter, télécharger ; favoris et hors ligne pour le terrain (3G, lycée).
- Qualité : soumissions communautaires + **validation humaine** avant publication.

---

## 4. Produit / démo

- Montrer 30–60 s : Archives → fiche PDF → compte (favoris / bibliothèque / Pro).
- Flux contributeur : photo → PDF → admin → récompense portefeuille → retrait Mobile Money.
- Stack crédible : Flutter, React, PHP/MySQL — **produit opérationnel**, pas une maquette.

---

## 5. Marché — chiffres & méthodologie

### Chiffres affichés sur la slide

| Couche | Chiffre slide | Logique |
|--------|---------------|---------|
| **TAM** | ~10 M élèves | Secondaire AO francophone (éducation digitale / annales) |
| **SAM** | ~370 k | Élèves secondaire Togo × accès smartphone / internet |
| **SOM** | 3–8 k | Abonnés Pro payants à 18–24 mois |

### Base Togo (effectif réel)

- **~912 400** élèves du secondaire général en 2024-2025 :
  - 697 532 premier cycle (collège)
  - 214 868 second cycle (lycée)
- Source : Ministère / DPSSE — plateforme planification éducation Togo  
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
- Revenu indicatif à 5 000 Pro × 2 000 FCFA/an (1 000 FCFA / 6 mois) ≈ **10 M FCFA / an** — ordre de grandeur early-stage, pas une projection garantie.
- **Ne pas présenter comme engagement contractuel** — objectif de pilotage.

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
- Prochaines preuves à collecter (et à mettre à jour dans le deck) : n° d’épreuves validées, lycées pilotes signés, 1ers paiements Pro, taux de rétention 6 mois.
- Formulation investisseur : *le risque est l’exécution go-to-market, pas l’existence du produit.*

---

## 8. Concurrence / positionnement

- Concurrent réel = **chaos informel** : WhatsApp, photocopies, Facebook, PDF dispersés.
- Apps francophones de révision (ex. Nomad Education, OkpaBac) = plutôt cours / quiz / annales multi-pays — **peu d’archive nationale togolais + validation + Flooz/T-Money + contributeurs rémunérés**.  
  https://www.nomadeducation.fr/nos-engagements/afrique  
  https://okpabac.com/
- Différenciateurs EZOA : focus Togo, validation humaine, MM local, offline, portefeuille contributeur.
- Ne pas dénigrer ; montrer le passage du « bricolage » à une **archive de confiance**.

---

## 9. Go-to-market

- **Pilotes** : 3–5 lycées (Lomé + 1–2 régions) — accès Pro découverte pour mesurer conversion.
- Ambassadeurs élèves / profs contributeurs récompensés.
- Campagnes WhatsApp / Facebook calées sur calendrier CEPD / BEPC / BAC.
- **B2B écoles** (indicatif) : licence annuelle établissement = accès classes + canal de dépôt de sujets ; prix à co-construire (ex. forfait selon effectif).
- Notifications ciblées par classe = rappel utile, pas spam.

---

## 10. Équipe

- **Chaminade Dondah Adjolou** — CEO & CTO : vision, produit, tech (mobile, web, backend, paiements).
- **Divine HIBA** — Project Manager & Business Analyst : pilotage, besoins métier, coordination terrain / écoles.
- Rôles ouverts (**recrutement prévu**) : ops contenu / validation, partenariats établissements, growth.
- Ne pas inventer d’autres membres.

---

## 11. Roadmap 6 / 12 / 18 mois

- **6 mois** : 3–5 lycées pilotes, catalogue examens clés, MM stable, Play Store, premiers Pro + KPIs.
- **12 mois** : couverture nationale CEPD / BEPC / BAC, offre licence établissements, rétention Pro, réseau contributeurs.
- **18 mois** : 1er pays voisin AO francophone, corrigés / parcours, dialogue MEN / partenaires éducation.

---

## 12. Besoin / levée

### Proposition indicative

| Élément | Valeur |
|---------|--------|
| **Fourchette** | **25–50 M FCFA** (~38–76 kUSD) |
| **Ticket central proposé** | **35 M FCFA** (~53 kEUR / ~58 kUSD) |
| **Stade** | Pre-seed / seed early |

*Taux indicatif : ~655 FCFA pour 1 EUR et ~600 FCFA pour 1 USD — arrondir à l’oral.*

### Allocation des fonds (sur ticket type 35 M)

| Poste | % | Usage |
|-------|---|--------|
| Produit & infra | **35 %** | Stores, perf, offline, fiabilité API, UX paiement |
| Contenu & validation | **25 %** | Catalogue exams, ops validation, récompenses contributeurs |
| Acquisition & écoles | **25 %** | Pilotes lycées, ambassadeurs, campagnes examens |
| Ops & conformité paiements | **15 %** | Intégrations Flooz/T-Money, support, légal / conformité |

### Alternatives soft

- Partenariats écoles, incubateurs, mécénat éducation — sans equity si préféré.
- Clôturer : *le passé scolaire du Togo, au service de l’avenir des élèves.*

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
