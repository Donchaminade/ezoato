import { Link } from "@tanstack/react-router";
import { Flag } from "lucide-react";
import { EzoaLogo } from "@/components/branding/EzoaLogo";
import { EZOA_BRAND } from "@/lib/branding";
import { PITCH_DECK_HREF } from "@/lib/pitch";

export function PublicFooter() {
  return (
    <footer className="border-t border-border bg-card">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-4">
        <div className="md:col-span-2">
          <EzoaLogo />
          <p className="mt-3 font-display text-sm font-semibold text-primary">{EZOA_BRAND.slogan}</p>
          <p className="mt-2 max-w-sm text-sm text-muted-foreground">
            {EZOA_BRAND.tagline} Les épreuves sont validées par des gestionnaires bénévoles.
          </p>
        </div>
        <div>
          <h4 className="mb-3 text-sm font-semibold text-foreground">Navigation</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li><Link to="/" className="hover:text-foreground">Accueil</Link></li>
            <li><Link to="/docs" className="hover:text-foreground">Archives</Link></li>
            <li><Link to="/submit" className="hover:text-foreground">Soumettre</Link></li>
            <li><Link to="/about" className="hover:text-foreground">À propos</Link></li>
            <li><Link to="/partenariat" className="hover:text-foreground">Partenariat</Link></li>
            <li><Link to="/faq" className="hover:text-foreground">FAQ</Link></li>
            <li>
              <a
                href={PITCH_DECK_HREF}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-foreground"
                title="Pitch investisseur"
              >
                Sponsoriser
              </a>
            </li>
          </ul>
        </div>
        <div>
          <h4 className="mb-3 text-sm font-semibold text-foreground">Légal</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li><Link to="/conditions" className="hover:text-foreground">Conditions d&apos;utilisation</Link></li>
            <li><Link to="/conditions#donnees-personnelles" className="hover:text-foreground">Confidentialité</Link></li>
            <li><Link to="/about" className="hover:text-foreground">À propos</Link></li>
            <li><Link to="/contact" className="hover:text-foreground">Contact</Link></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-border">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-2 px-4 py-5 sm:flex-row sm:px-6">
          <p className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
            <span>© {new Date().getFullYear()} EZOA-TO</span>
            <Flag className="size-3 shrink-0 text-primary" aria-hidden />
          </p>
          <p className="text-xs text-muted-foreground">Propulsé par la communauté éducative togolaise</p>
        </div>
      </div>
    </footer>
  );
}
