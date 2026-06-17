import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import {
  Building2,
  Handshake,
  Heart,
  Loader2,
  Send,
  School,
} from "lucide-react";
import { PageHero } from "@/components/layout/PageHero";
import { PageHeroBadge } from "@/components/layout/PageHeroBadge";
import { PublicLayout } from "@/components/layout/PublicLayout";
import { PartnersSection } from "@/components/marketing/PartnersSection";
import { ScrollReveal } from "@/components/motion/ScrollReveal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { cn } from "@/lib/utils";
import type { DemandeEtablissementType, DemandeSoutienType } from "@/lib/types";

const FIELD_CLASS =
  "h-12 rounded-xl border-input px-4 text-base shadow-sm md:text-base";
const SELECT_CLASS = "h-12 rounded-xl px-4 text-base";
const TEXTAREA_CLASS = "min-h-[9rem] rounded-xl px-4 py-3.5 text-base md:text-base";
const FORM_FIELD = "space-y-2";

export const Route = createFileRoute("/partenariat")({
  head: () => ({
    meta: [
      { title: "Partenariat & soutien — EZOA-TO" },
      {
        name: "description",
        content: "Soutenez EZOA-TO par un partenariat, un sponsoring ou un don. Les établissements peuvent aussi nous contacter pour toute demande.",
      },
    ],
  }),
  component: PartenariatPage,
});

const SOUTIEN_TYPES: { value: DemandeSoutienType; label: string }[] = [
  { value: "partenariat", label: "Partenariat" },
  { value: "sponsor", label: "Sponsoring" },
  { value: "don", label: "Don" },
  { value: "mecenat", label: "Mécénat" },
  { value: "autre", label: "Autre forme de soutien" },
];

const ETAB_TYPES: { value: DemandeEtablissementType; label: string }[] = [
  { value: "collaboration", label: "Collaboration / partenariat" },
  { value: "modification", label: "Correction d'informations" },
  { value: "retrait", label: "Retrait de contenus" },
  { value: "autre", label: "Autre demande" },
];

function PartenariatPage() {
  const { user } = useAuth();
  const { data: meta } = useQuery({
    queryKey: ["meta"],
    queryFn: () => api.getMeta(),
  });

  return (
    <PublicLayout>
      <PageHero
        badge={<PageHeroBadge icon={Handshake}>Partenariat</PageHeroBadge>}
        title="Soutenez EZOA-TO"
        description="Partenariats, sponsoring, dons ou collaboration avec les établissements — rejoignez la mission éducative de EZOA-TO au Togo."
        primaryImage="group"
      />

      <PartnersSection />

      <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 sm:py-16">
        <ScrollReveal offsetY={30}>
          <Tabs defaultValue="soutien" className="w-full">
            <TabsList className="mb-1 grid h-auto w-full grid-cols-2 gap-1.5 rounded-xl border border-border bg-muted/40 p-1.5">
              <TabsTrigger
                value="soutien"
                className={cn(
                  "tea-water-fill-none flex h-12 min-h-12 items-center justify-center gap-2.5 rounded-lg border border-transparent px-4 text-sm font-semibold transition-all duration-300 sm:h-[3.25rem] sm:text-base",
                  "data-[state=inactive]:bg-transparent data-[state=inactive]:text-muted-foreground data-[state=inactive]:shadow-none",
                  "data-[state=inactive]:hover:bg-muted/60 data-[state=inactive]:hover:text-foreground",
                  "data-[state=active]:!border-primary/45 data-[state=active]:!bg-primary/15 data-[state=active]:!text-primary data-[state=active]:shadow-sm data-[state=active]:shadow-primary/10",
                )}
              >
                <Heart className="size-5 shrink-0" /> Nous soutenir
              </TabsTrigger>
              <TabsTrigger
                value="etablissement"
                className={cn(
                  "tea-water-fill-none flex h-12 min-h-12 items-center justify-center gap-2.5 rounded-lg border border-transparent px-4 text-sm font-semibold transition-all duration-300 sm:h-[3.25rem] sm:text-base",
                  "data-[state=inactive]:bg-transparent data-[state=inactive]:text-muted-foreground data-[state=inactive]:shadow-none",
                  "data-[state=inactive]:hover:bg-muted/60 data-[state=inactive]:hover:text-foreground",
                  "data-[state=active]:!border-destructive/45 data-[state=active]:!bg-destructive/15 data-[state=active]:!text-destructive data-[state=active]:shadow-sm data-[state=active]:shadow-destructive/10",
                )}
              >
                <School className="size-5 shrink-0" /> Établissement
              </TabsTrigger>
            </TabsList>

            <TabsContent value="soutien" className="mt-6">
              <SoutienForm userNom={user?.nom} userEmail={user?.email} />
            </TabsContent>
            <TabsContent value="etablissement" className="mt-6">
              <EtablissementForm
                userNom={user?.nom}
                userEmail={user?.email}
                villes={meta?.villes ?? []}
              />
            </TabsContent>
          </Tabs>
        </ScrollReveal>
      </div>
    </PublicLayout>
  );
}

function SoutienForm({ userNom, userEmail }: { userNom?: string; userEmail?: string }) {
  const [sending, setSending] = useState(false);
  const [nom, setNom] = useState(userNom ?? "");
  const [email, setEmail] = useState(userEmail ?? "");
  const [telephone, setTelephone] = useState("");
  const [organisation, setOrganisation] = useState("");
  const [type, setType] = useState<DemandeSoutienType>("partenariat");
  const [message, setMessage] = useState("");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSending(true);
    try {
      const res = await api.sendDemandeSoutien({
        nom,
        email,
        telephone: telephone || undefined,
        organisation: organisation || undefined,
        type,
        message,
      });
      toast.success(res.message);
      setMessage("");
      setOrganisation("");
      setTelephone("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Impossible d'envoyer la demande");
    } finally {
      setSending(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5 rounded-2xl border border-border bg-card p-6 sm:space-y-6 sm:p-8">
      <div className="flex items-start gap-3">
        <Heart className="mt-0.5 size-5 shrink-0 text-primary" />
        <div>
          <h2 className="font-display text-xl font-semibold">Proposer votre soutien</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Partenariat, sponsoring, don ou mécénat — décrivez votre projet et nous vous recontacterons.
          </p>
        </div>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div className={FORM_FIELD}>
          <Label htmlFor="s-nom">Nom complet</Label>
          <Input id="s-nom" className={FIELD_CLASS} value={nom} onChange={(e) => setNom(e.target.value)} required />
        </div>
        <div className={FORM_FIELD}>
          <Label htmlFor="s-email">Email</Label>
          <Input id="s-email" type="email" className={FIELD_CLASS} value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div className={FORM_FIELD}>
          <Label htmlFor="s-tel">Téléphone (optionnel)</Label>
          <Input id="s-tel" className={FIELD_CLASS} value={telephone} onChange={(e) => setTelephone(e.target.value)} placeholder="+228 …" />
        </div>
        <div className={FORM_FIELD}>
          <Label htmlFor="s-org">Organisation (optionnel)</Label>
          <Input id="s-org" className={FIELD_CLASS} value={organisation} onChange={(e) => setOrganisation(e.target.value)} placeholder="Entreprise, association…" />
        </div>
      </div>

      <div className={FORM_FIELD}>
        <Label>Type de soutien</Label>
        <Select value={type} onValueChange={(v) => setType(v as DemandeSoutienType)}>
          <SelectTrigger className={SELECT_CLASS}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {SOUTIEN_TYPES.map((t) => (
              <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className={FORM_FIELD}>
        <Label htmlFor="s-msg">Votre message</Label>
        <Textarea
          id="s-msg"
          className={TEXTAREA_CLASS}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          required
          rows={5}
          placeholder="Décrivez comment vous souhaitez soutenir EZOA-TO…"
        />
      </div>

      <Button type="submit" size="lg" className="h-12 w-full rounded-xl text-base" disabled={sending}>
        {sending ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
        Envoyer ma demande
      </Button>
    </form>
  );
}

function EtablissementForm({
  userNom,
  userEmail,
  villes,
}: {
  userNom?: string;
  userEmail?: string;
  villes: string[];
}) {
  const [sending, setSending] = useState(false);
  const [nomEtablissement, setNomEtablissement] = useState("");
  const [ville, setVille] = useState("");
  const [nomContact, setNomContact] = useState(userNom ?? "");
  const [email, setEmail] = useState(userEmail ?? "");
  const [telephone, setTelephone] = useState("");
  const [fonction, setFonction] = useState("");
  const [typeDemande, setTypeDemande] = useState<DemandeEtablissementType>("collaboration");
  const [message, setMessage] = useState("");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!ville) {
      toast.error("Veuillez sélectionner une ville");
      return;
    }
    setSending(true);
    try {
      const res = await api.sendDemandeEtablissement({
        nomEtablissement,
        ville,
        nomContact,
        email,
        telephone: telephone || undefined,
        fonction: fonction || undefined,
        typeDemande,
        message,
      });
      toast.success(res.message);
      setMessage("");
      setNomEtablissement("");
      setFonction("");
      setTelephone("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Impossible d'envoyer la demande");
    } finally {
      setSending(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5 rounded-2xl border border-border bg-card p-6 sm:space-y-6 sm:p-8">
      <div className="flex items-start gap-3">
        <Building2 className="mt-0.5 size-5 shrink-0 text-destructive" />
        <div>
          <h2 className="font-display text-xl font-semibold">Demande établissement</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Collaboration, correction d'informations, retrait de contenus ou toute autre demande liée à votre établissement.
          </p>
        </div>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div className={FORM_FIELD}>
          <Label htmlFor="e-etab">Nom de l'établissement</Label>
          <Input id="e-etab" className={FIELD_CLASS} value={nomEtablissement} onChange={(e) => setNomEtablissement(e.target.value)} required />
        </div>
        <div className={FORM_FIELD}>
          <Label htmlFor="e-ville">Ville</Label>
          {villes.length > 0 ? (
            <Select value={ville} onValueChange={setVille} required>
              <SelectTrigger id="e-ville" className={SELECT_CLASS}>
                <SelectValue placeholder="Choisir une ville" />
              </SelectTrigger>
              <SelectContent>
                {villes.map((v) => (
                  <SelectItem key={v} value={v}>{v}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <Input id="e-ville" className={FIELD_CLASS} value={ville} onChange={(e) => setVille(e.target.value)} required />
          )}
        </div>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div className={FORM_FIELD}>
          <Label htmlFor="e-contact">Nom du contact</Label>
          <Input id="e-contact" className={FIELD_CLASS} value={nomContact} onChange={(e) => setNomContact(e.target.value)} required />
        </div>
        <div className={FORM_FIELD}>
          <Label htmlFor="e-email">Email</Label>
          <Input id="e-email" type="email" className={FIELD_CLASS} value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div className={FORM_FIELD}>
          <Label htmlFor="e-tel">Téléphone (optionnel)</Label>
          <Input id="e-tel" className={FIELD_CLASS} value={telephone} onChange={(e) => setTelephone(e.target.value)} placeholder="+228 …" />
        </div>
        <div className={FORM_FIELD}>
          <Label htmlFor="e-fonction">Fonction (optionnel)</Label>
          <Input id="e-fonction" className={FIELD_CLASS} value={fonction} onChange={(e) => setFonction(e.target.value)} placeholder="Directeur, professeur…" />
        </div>
      </div>

      <div className={FORM_FIELD}>
        <Label>Type de demande</Label>
        <Select value={typeDemande} onValueChange={(v) => setTypeDemande(v as DemandeEtablissementType)}>
          <SelectTrigger className={SELECT_CLASS}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {ETAB_TYPES.map((t) => (
              <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className={FORM_FIELD}>
        <Label htmlFor="e-msg">Votre message</Label>
        <Textarea
          id="e-msg"
          className={TEXTAREA_CLASS}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          required
          rows={5}
          placeholder="Décrivez votre demande en détail…"
        />
      </div>

      <Button
        type="submit"
        size="lg"
        className="h-12 w-full rounded-xl bg-destructive text-base text-destructive-foreground hover:bg-destructive/90"
        disabled={sending}
      >
        {sending ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
        Envoyer la demande
      </Button>
    </form>
  );
}
