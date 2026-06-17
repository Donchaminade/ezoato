import type { ReactNode } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/lib/auth";

/** Redirige admin / gestionnaire vers l'espace administration. */
export function ContributorStaffRedirect({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && user && (user.role === "admin" || user.role === "gestionnaire")) {
      navigate({ to: "/admin", search: { section: "overview" }, replace: true });
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (user && (user.role === "admin" || user.role === "gestionnaire")) {
    return null;
  }

  return <>{children}</>;
}
