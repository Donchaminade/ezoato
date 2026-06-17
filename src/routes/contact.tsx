import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Mail, Phone, MapPin, Clock, Send, Loader2, MessageCircle } from "lucide-react";
import { PageHero } from "@/components/layout/PageHero";
import { PageHeroBadge } from "@/components/layout/PageHeroBadge";
import { PublicLayout } from "@/components/layout/PublicLayout";
import { ScrollReveal } from "@/components/motion/ScrollReveal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/contact")({
  validateSearch: (search: Record<string, unknown>) => ({
    sujet: typeof search.sujet === "string" ? search.sujet : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Contact — EZOA-TO" },
      { name: "description", content: "Contactez l'équipe EZOA-TO pour toute question sur les épreuves, les paiements ou les contributions." },
    ],
  }),
  component: ContactPage,
});

function ContactPage() {
  const { user } = useAuth();
  const { sujet: sujetInitial } = Route.useSearch();
  const { data: info, isLoading } = useQuery({
    queryKey: ["contact-info"],
    queryFn: () => api.getContactInfo(),
  });
  const [sending, setSending] = useState(false);
  const [nom, setNom] = useState(user?.nom ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [sujet, setSujet] = useState(sujetInitial ?? "");
  const [message, setMessage] = useState("");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSending(true);
    try {
      const res = await api.sendContactMessage({ nom, email, sujet, message });
      toast.success(res.message);
      setSujet("");
      setMessage("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Échec de l'envoi");
    } finally {
      setSending(false);
    }
  }

  return (
    <PublicLayout>
      <PageHero
        badge={<PageHeroBadge icon={MessageCircle}>Support</PageHeroBadge>}
        title="Contactez-nous"
        description="Une question sur un téléchargement, un paiement ou une soumission ? Notre équipe répond sous 48 h."
        primaryImage="group"
      />

      <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 sm:py-16">
        <div className="grid gap-8 lg:grid-cols-[1fr_1.2fr]">
          <ScrollReveal offsetY={40} className="space-y-4">
            {isLoading ? (
              <div className="h-48 animate-pulse rounded-xl bg-muted" />
            ) : (
              <>
                {info?.email && (
                  <a href={`mailto:${info.email}`} className="flex items-start gap-4 rounded-xl border border-border bg-card p-5 transition hover:border-primary/30">
                    <Mail className="mt-0.5 size-5 shrink-0 text-primary" />
                    <div>
                      <p className="font-medium">Email</p>
                      <p className="text-sm text-muted-foreground">{info.email}</p>
                    </div>
                  </a>
                )}
                {info?.telephone && (
                  <a href={`tel:${info.telephone.replace(/\s/g, "")}`} className="flex items-start gap-4 rounded-xl border border-border bg-card p-5 transition hover:border-primary/30">
                    <Phone className="mt-0.5 size-5 shrink-0 text-primary" />
                    <div>
                      <p className="font-medium">Téléphone</p>
                      <p className="text-sm text-muted-foreground">{info.telephone}</p>
                    </div>
                  </a>
                )}
                {info?.whatsapp && (
                  <a
                    href={`https://wa.me/${info.whatsapp.replace(/\D/g, "")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-start gap-4 rounded-xl border border-border bg-card p-5 transition hover:border-primary/30"
                  >
                    <MessageCircle className="mt-0.5 size-5 shrink-0 text-green-600" />
                    <div>
                      <p className="font-medium">WhatsApp</p>
                      <p className="text-sm text-muted-foreground">{info.whatsapp}</p>
                    </div>
                  </a>
                )}
                {info?.adresse && (
                  <div className="flex items-start gap-4 rounded-xl border border-border bg-card p-5">
                    <MapPin className="mt-0.5 size-5 shrink-0 text-primary" />
                    <div>
                      <p className="font-medium">Adresse</p>
                      <p className="text-sm text-muted-foreground">{info.adresse}</p>
                    </div>
                  </div>
                )}
                {info?.horaires && (
                  <div className="flex items-start gap-4 rounded-xl border border-border bg-card p-5">
                    <Clock className="mt-0.5 size-5 shrink-0 text-primary" />
                    <div>
                      <p className="font-medium">Horaires</p>
                      <p className="text-sm text-muted-foreground">{info.horaires}</p>
                    </div>
                  </div>
                )}
              </>
            )}
            <p className="text-xs text-muted-foreground">
              Tu veux contribuer ? <Link to="/submit" className="text-primary hover:underline">Soumets une épreuve</Link> ou consulte l'<Link to="/contributor" className="text-primary hover:underline">espace contributeur</Link>.
            </p>
          </ScrollReveal>

          <ScrollReveal delay={0.12} offsetY={40}>
          <form onSubmit={onSubmit} className="rounded-2xl border border-border bg-card p-6 space-y-4">
            <h2 className="font-display text-xl font-semibold">Envoyer un message</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="nom">Nom</Label>
                <Input id="nom" value={nom} onChange={(e) => setNom(e.target.value)} required />
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
              </div>
            </div>
            <div>
              <Label htmlFor="sujet">Sujet</Label>
              <Input id="sujet" value={sujet} onChange={(e) => setSujet(e.target.value)} required placeholder="Ex: Problème de paiement" />
            </div>
            <div>
              <Label htmlFor="message">Message</Label>
              <Textarea id="message" value={message} onChange={(e) => setMessage(e.target.value)} required rows={6} placeholder="Décrivez votre demande…" />
            </div>
            <Button type="submit" className="w-full" disabled={sending}>
              {sending ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
              Envoyer
            </Button>
          </form>
          </ScrollReveal>
        </div>
      </div>
    </PublicLayout>
  );
}
