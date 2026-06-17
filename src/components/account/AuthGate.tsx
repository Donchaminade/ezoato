import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { PageHero } from "@/components/layout/PageHero";
import { PageHeroBadge } from "@/components/layout/PageHeroBadge";
import { PublicLayout } from "@/components/layout/PublicLayout";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";

type AuthGateProps = {
  badge: ReactNode;
  title: string;
  description: string;
  children: ReactNode;
};

export function AuthGate({ badge, title, description, children }: AuthGateProps) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <PublicLayout>
        <div className="flex min-h-[50vh] items-center justify-center">
          <Loader2 className="size-8 animate-spin text-primary" aria-label="Chargement" />
        </div>
      </PublicLayout>
    );
  }

  if (!user) {
    return (
      <PublicLayout>
        <PageHero badge={badge} title={title} description={description} primaryImage="group" compact>
          <div className="flex flex-wrap justify-center gap-3">
            <Button asChild size="lg" className="tea-hero-auth-primary rounded-xl">
              <Link to="/auth/register">Créer un compte</Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="tea-hero-auth-light rounded-xl">
              <Link to="/auth/login">Connexion</Link>
            </Button>
          </div>
        </PageHero>
      </PublicLayout>
    );
  }

  return <>{children}</>;
}
