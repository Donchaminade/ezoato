import { createFileRoute, Link } from "@tanstack/react-router";
import { FileText, Mail } from "lucide-react";
import { LegalList, LegalSection } from "@/components/legal/LegalSection";
import { PageHero } from "@/components/layout/PageHero";
import { PageHeroBadge } from "@/components/layout/PageHeroBadge";
import { PublicLayout } from "@/components/layout/PublicLayout";
import { ScrollReveal } from "@/components/motion/ScrollReveal";
import { Button } from "@/components/ui/button";
import { EZOA_BRAND } from "@/lib/branding";
import {
  EPREUVES_PAR_RECOMPENSE,
  formatFcfa,
  MIN_RETRAIT,
  MONTANT_RECOMPENSE,
  PRIX_CORRIGE_TYPE,
  PRIX_EXAMEN_NATIONAL,
} from "@/lib/pricing";

const LAST_UPDATED = "10 juin 2026";

const TOC = [
  { id: "objet", label: "1. Objet et acceptation" },
  { id: "definitions", label: "2. Définitions" },
  { id: "acces", label: "3. Accès et compte" },
  { id: "archives", label: "4. Consultation des archives" },
  { id: "contributions", label: "5. Soumissions et contributions" },
  { id: "paiements", label: "6. Paiements et tarifs" },
  { id: "contributeur", label: "7. Espace contributeur" },
  { id: "propriete", label: "8. Propriété intellectuelle" },
  { id: "conduite", label: "9. Comportements interdits" },
  { id: "suspension", label: "10. Suspension et résiliation" },
  { id: "responsabilite", label: "11. Responsabilité" },
  { id: "donnees-personnelles", label: "12. Données personnelles" },
  { id: "modifications", label: "13. Modifications" },
  { id: "contact", label: "14. Contact" },
] as const;

export const Route = createFileRoute("/conditions")({
  head: () => ({
    meta: [
      { title: "Conditions d'utilisation — EZOA-TO" },
      {
        name: "description",
        content:
          "Conditions générales d'utilisation de EZOA-TO : comptes, archives, soumissions, paiements et espace contributeur.",
      },
    ],
  }),
  component: ConditionsPage,
});

function ConditionsPage() {
  return (
    <PublicLayout>
      <PageHero
        badge={<PageHeroBadge icon={FileText}>Légal</PageHeroBadge>}
        title="Conditions d'utilisation"
        description={`Règles d'usage de ${EZOA_BRAND.fullName} (${EZOA_BRAND.name}). En créant un compte ou en utilisant la plateforme, tu acceptes ces conditions.`}
        primaryImage="group"
        compact
      />

      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
        <ScrollReveal offsetY={24}>
          <p className="rounded-xl border border-border bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
            <span className="font-medium text-foreground">Dernière mise à jour :</span> {LAST_UPDATED}
          </p>
        </ScrollReveal>

        <ScrollReveal offsetY={24} className="mt-8">
          <nav
            aria-label="Sommaire des conditions"
            className="rounded-2xl border border-border bg-card p-5 sm:p-6"
          >
            <h2 className="font-display text-lg font-semibold">Sommaire</h2>
            <ol className="mt-4 grid gap-2 text-sm sm:grid-cols-2">
              {TOC.map((item) => (
                <li key={item.id}>
                  <a
                    href={`#${item.id}`}
                    className="text-muted-foreground transition hover:text-primary hover:underline"
                  >
                    {item.label}
                  </a>
                </li>
              ))}
            </ol>
          </nav>
        </ScrollReveal>

        <div className="mt-12 space-y-12">
          <ScrollReveal offsetY={32}>
            <LegalSection id="objet" title="1. Objet et acceptation">
              <p>
                Les présentes conditions générales d&apos;utilisation (ci-après « CGU ») régissent
                l&apos;accès et l&apos;usage de la plateforme {EZOA_BRAND.fullName} ({EZOA_BRAND.name}),
                service numérique de consultation, de téléchargement et de partage d&apos;épreuves
                scolaires au Togo.
              </p>
              <p>
                En naviguant sur le site, en créant un compte ou en soumettant du contenu, tu
                reconnais avoir lu, compris et accepté l&apos;intégralité des présentes CGU. Si tu
                n&apos;acceptes pas ces conditions, tu ne dois pas utiliser {EZOA_BRAND.name}.
              </p>
            </LegalSection>
          </ScrollReveal>

          <ScrollReveal offsetY={32}>
            <LegalSection id="definitions" title="2. Définitions">
              <LegalList
                items={[
                  `« Plateforme » : le site web et les services associés exploités sous la marque ${EZOA_BRAND.name}.`,
                  "« Utilisateur » : toute personne consultant les archives, avec ou sans compte.",
                  "« Contributeur » : utilisateur inscrit qui soumet des épreuves à validation.",
                  "« Épreuve » : document scolaire (devoir, composition, examen, corrigé) publié ou soumis sur la plateforme.",
                  "« Gestionnaire » : membre de l'équipe EZOA-TO chargé de la modération et de la validation des contenus.",
                  "« Contenu utilisateur » : tout fichier, texte ou métadonnée transmis par un contributeur.",
                ]}
              />
            </LegalSection>
          </ScrollReveal>

          <ScrollReveal offsetY={32}>
            <LegalSection id="acces" title="3. Accès et compte utilisateur">
              <p>
                L&apos;inscription est gratuite et ouverte aux personnes majeures ou aux mineurs
                disposant de l&apos;autorisation d&apos;un représentant légal. Tu t&apos;engages à
                fournir des informations exactes et à les maintenir à jour.
              </p>
              <p>
                Tu es responsable de la confidentialité de tes identifiants. Toute activité réalisée
                depuis ton compte est réputée effectuée par toi. En cas de suspicion d&apos;usage
                frauduleux, contacte immédiatement le support EZOA-TO.
              </p>
              <p>
                {EZOA_BRAND.name} se réserve le droit de refuser l&apos;ouverture d&apos;un compte ou
                de limiter l&apos;accès en cas de violation des présentes CGU.
              </p>
            </LegalSection>
          </ScrollReveal>

          <ScrollReveal offsetY={32}>
            <LegalSection id="archives" title="4. Consultation et téléchargement des archives">
              <p>
                Les épreuves disponibles sur {EZOA_BRAND.name} sont destinées à un usage personnel,
                éducatif et non commercial : révision, entraînement et préparation aux examens.
              </p>
              <p>
                Certains contenus sont gratuits ; d&apos;autres (notamment examens nationaux et
                corrigés types) peuvent être payants selon la grille tarifaire en vigueur. Après
                achat, l&apos;accès au fichier acheté reste disponible depuis ton espace
                bibliothèque.
              </p>
              <p>
                Tu ne peux pas revendre, redistribuer massivement ou republier les fichiers
                téléchargés en dehors d&apos;un cadre strictement personnel ou pédagogique autorisé
                par l&apos;établissement concerné.
              </p>
            </LegalSection>
          </ScrollReveal>

          <ScrollReveal offsetY={32}>
            <LegalSection id="contributions" title="5. Soumissions et contributions">
              <p>
                En soumettant une épreuve, tu déclares disposer des droits nécessaires pour la
                partager (auteur, établissement, ou autorisation explicite) et que le document ne
                contient pas de données personnelles identifiables de tiers sans consentement.
              </p>
              <p>
                Chaque soumission est examinée par un gestionnaire. {EZOA_BRAND.name} peut accepter,
                rejeter ou demander une correction sans obligation de motivation détaillée. Les
                critères incluent notamment la lisibilité, l&apos;exactitude des métadonnées et la
                conformité aux règles éditoriales.
              </p>
              <p>
                Tu accordes à {EZOA_BRAND.name} une licence non exclusive, gratuite et mondiale pour
                héberger, afficher, indexer et distribuer le contenu validé au sein de la
                plateforme, aux fins éducatives.
              </p>
            </LegalSection>
          </ScrollReveal>

          <ScrollReveal offsetY={32}>
            <LegalSection id="paiements" title="6. Paiements et tarifs">
              <p>
                Les tarifs indicatifs actuellement appliqués sont les suivants (susceptibles
                d&apos;évolution, la version en ligne faisant foi) :
              </p>
              <LegalList
                items={[
                  `Examen national : ${formatFcfa(PRIX_EXAMEN_NATIONAL)} par téléchargement`,
                  `Corrigé type : ${formatFcfa(PRIX_CORRIGE_TYPE)} par téléchargement`,
                  "Devoirs et compositions : gratuits sauf mention contraire",
                ]}
              />
              <p>
                Les paiements s&apos;effectuent via les moyens proposés sur la plateforme (Mobile
                Money : Flooz, T-Money, selon disponibilité). Les transactions sont traitées par
                des prestataires tiers ; {EZOA_BRAND.name} n&apos;est pas responsable des
                indisponibilités temporaires de ces services.
              </p>
              <p>
                Sauf obligation légale ou erreur avérée imputable à {EZOA_BRAND.name}, les achats de
                contenus numériques ne donnent pas lieu à remboursement une fois le fichier rendu
                accessible.
              </p>
            </LegalSection>
          </ScrollReveal>

          <ScrollReveal offsetY={32}>
            <LegalSection id="contributeur" title="7. Espace contributeur et récompenses">
              <p>
                Le programme contributeur récompense les épreuves validées selon les règles affichées
                sur la plateforme. À titre indicatif :{" "}
                <strong className="text-foreground">
                  {EPREUVES_PAR_RECOMPENSE} épreuves validées = {formatFcfa(MONTANT_RECOMPENSE)}
                </strong>
                , avec un seuil minimum de retrait de {formatFcfa(MIN_RETRAIT)}.
              </p>
              <p>
                Les récompenses ne constituent pas un salaire ni un contrat de travail.{" "}
                {EZOA_BRAND.name} peut ajuster les barèmes, suspendre le programme ou refuser un
                retrait en cas de fraude, de soumissions multiples du même document ou de violation
                des CGU.
              </p>
              <p>
                Les retraits sont effectués vers les coordonnées Mobile Money enregistrées sur ton
                compte, sous réserve de vérification d&apos;identité si nécessaire.
              </p>
            </LegalSection>
          </ScrollReveal>

          <ScrollReveal offsetY={32}>
            <LegalSection id="propriete" title="8. Propriété intellectuelle">
              <p>
                La marque {EZOA_BRAND.name}, le logo, l&apos;interface et les éléments graphiques de
                la plateforme sont protégés. Toute reproduction non autorisée est interdite.
              </p>
              <p>
                Les épreuves publiées demeurent la propriété de leurs auteurs ou établissements
                d&apos;origine. {EZOA_BRAND.name} agit comme intermédiaire technique et éditorial
                pour faciliter l&apos;accès pédagogique, dans le respect du droit applicable au
                Togo.
              </p>
              <p>
                Si tu estimes qu&apos;un contenu porte atteinte à tes droits, contacte-nous avec
                les éléments de preuve (voir section Contact).
              </p>
            </LegalSection>
          </ScrollReveal>

          <ScrollReveal offsetY={32}>
            <LegalSection id="conduite" title="9. Comportements interdits">
              <p>Il est notamment interdit de :</p>
              <LegalList
                items={[
                  "Publier ou tenter de publier des contenus falsifiés, illisibles ou trompeurs",
                  "Contourner les mesures de paiement ou télécharger massivement des fichiers payants",
                  "Utiliser des robots, scripts ou outils automatisés non autorisés",
                  "Harceler d'autres utilisateurs ou l'équipe de modération",
                  "Usurper l'identité d'un établissement, d'un enseignant ou d'un élève",
                  "Introduire des virus, malwares ou tout code malveillant",
                  "Exploiter la plateforme à des fins commerciales non approuvées par EZOA-TO",
                ]}
              />
            </LegalSection>
          </ScrollReveal>

          <ScrollReveal offsetY={32}>
            <LegalSection id="suspension" title="10. Suspension et résiliation">
              <p>
                {EZOA_BRAND.name} peut suspendre ou supprimer un compte, retirer un contenu ou
                limiter l&apos;accès à la plateforme en cas de violation des CGU, sans préavis en
                situation urgente (fraude, sécurité, demande légale).
              </p>
              <p>
                Tu peux demander la suppression de ton compte à tout moment via le support. La
                suppression n&apos;efface pas les obligations nées avant la clôture (paiements,
                litiges, contenus déjà validés et intégrés aux archives).
              </p>
            </LegalSection>
          </ScrollReveal>

          <ScrollReveal offsetY={32}>
            <LegalSection id="responsabilite" title="11. Limitation de responsabilité">
              <p>
                {EZOA_BRAND.name} met en œuvre des moyens raisonnables pour assurer la disponibilité
                et la qualité des contenus, sans garantir l&apos;absence totale d&apos;erreurs,
                d&apos;interruptions ou d&apos;informations obsolètes.
              </p>
              <p>
                Les épreuves sont fournies « en l&apos;état » à titre d&apos;aide à la révision.{" "}
                {EZOA_BRAND.name} ne saurait être tenu responsable des résultats scolaires, des
                décisions prises sur la base des documents consultés, ni des dommages indirects liés
                à l&apos;usage du service.
              </p>
              <p>
                Dans les limites autorisées par la loi togolaise, la responsabilité totale de{" "}
                {EZOA_BRAND.name} est limitée au montant effectivement payé par l&apos;utilisateur
                pour le contenu concerné au cours des douze (12) mois précédant le litige.
              </p>
            </LegalSection>
          </ScrollReveal>

          <ScrollReveal offsetY={32}>
            <LegalSection id="donnees-personnelles" title="12. Données personnelles">
              <p>
                Dans le cadre de l&apos;utilisation de {EZOA_BRAND.name}, nous collectons les
                données nécessaires au fonctionnement du service : identité, email, ville,
                historique de téléchargements, soumissions et, le cas échéant, coordonnées de
                paiement Mobile Money pour les retraits contributeur.
              </p>
              <p>
                Ces données sont utilisées pour gérer ton compte, sécuriser les accès, traiter les
                paiements, valider les contributions et répondre au support. Elles ne sont pas
                vendues à des tiers. Elles peuvent être partagées avec des prestataires techniques
                (hébergement, paiement) strictement pour l&apos;exécution du service.
              </p>
              <p>
                Tu disposes d&apos;un droit d&apos;accès, de rectification et de suppression de tes
                données, sous réserve des obligations légales de conservation. Pour exercer ces
                droits, écris-nous via la page{" "}
                <Link to="/contact" className="font-medium text-primary hover:underline">
                  Contact
                </Link>
                .
              </p>
              <p>
                Les cookies et préférences locales (thème clair/sombre, session) peuvent être
                enregistrés sur ton appareil pour améliorer ton expérience.
              </p>
            </LegalSection>
          </ScrollReveal>

          <ScrollReveal offsetY={32}>
            <LegalSection id="modifications" title="13. Modifications des CGU">
              <p>
                {EZOA_BRAND.name} peut modifier les présentes CGU pour refléter l&apos;évolution du
                service, des tarifs ou du cadre légal. La date de dernière mise à jour est indiquée
                en haut de cette page.
              </p>
              <p>
                En cas de modification substantielle, nous t&apos;en informerons par email ou via
                une notification sur la plateforme. La poursuite de l&apos;utilisation après entrée
                en vigueur vaut acceptation des nouvelles conditions.
              </p>
              <p>
                Le droit applicable est celui de la République togolaise. En cas de litige, les
                parties s&apos;efforceront de trouver une solution amiable avant toute action
                judiciaire compétente au Togo.
              </p>
            </LegalSection>
          </ScrollReveal>

          <ScrollReveal offsetY={32}>
            <LegalSection id="contact" title="14. Contact">
              <p>
                Pour toute question relative aux présentes conditions, à un contenu publié ou à tes
                données personnelles :
              </p>
              <Button asChild className="mt-2 rounded-xl">
                <Link to="/contact">
                  <Mail className="size-4" /> Contacter le support EZOA-TO
                </Link>
              </Button>
            </LegalSection>
          </ScrollReveal>
        </div>
      </div>
    </PublicLayout>
  );
}
