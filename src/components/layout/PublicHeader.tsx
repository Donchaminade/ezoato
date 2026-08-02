import { useId, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { Handshake, LogIn, LogOut, Menu, Upload, X } from "lucide-react";
import { EzoaLogo } from "@/components/branding/EzoaLogo";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useAuth } from "@/lib/auth";
import { dashboardHomeForRole } from "@/lib/dashboard-nav";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/", label: "Accueil" },
  { to: "/docs", label: "Archives" },
  { to: "/faq", label: "FAQ" },
  { to: "/about", label: "À propos" },
  { to: "/partenariat", label: "Partenariat" },
  { to: "/contact", label: "Contact" },
] as const;

const NAV_LINK_BASE =
  "rounded-lg px-2.5 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-primary hover:bg-primary/5";

const NAV_LINK_ACTIVE = "rounded-lg bg-primary/10 px-2.5 py-1.5 text-xs font-medium text-primary";

const NAV_BTN = "tea-water-fill-none h-8 rounded-full px-3 text-xs font-medium";

const MOBILE_LINK =
  "flex items-center rounded-xl px-3 py-3 text-sm font-medium text-foreground transition-colors hover:bg-primary/8 hover:text-primary";

const MOBILE_LINK_ACTIVE = "bg-primary/10 text-primary";

export function PublicHeader() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuId = useId();

  const closeMenu = () => setMenuOpen(false);

  return (
    <>
      <div className="h-[4.5rem] md:h-[5.25rem]" aria-hidden />

      <header
        className={cn(
          "fixed top-3 left-0 right-0 px-4 md:top-4 md:px-6 lg:px-8",
          menuOpen ? "z-40" : "z-50",
        )}
      >
        <div className="flag-stripe-top relative mx-auto grid h-14 max-w-7xl grid-cols-[auto_1fr_auto] items-center gap-4 rounded-2xl border border-border/50 bg-background/92 px-4 shadow-2xl shadow-black/10 backdrop-blur-xl sm:gap-6 sm:px-6 md:h-16 md:rounded-full md:px-8 lg:gap-8">
          <Link to="/" className="shrink-0">
            <EzoaLogo className="h-8 sm:h-9" />
          </Link>

          <nav
            className="hidden items-center justify-center gap-1.5 lg:flex xl:gap-2"
            aria-label="Navigation principale"
          >
            {NAV.map((n) => (
              <Link
                key={n.to}
                to={n.to}
                className={NAV_LINK_BASE}
                activeProps={{ className: NAV_LINK_ACTIVE }}
                activeOptions={{ exact: n.to === "/" }}
              >
                {n.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center justify-end gap-2.5 sm:gap-3 md:gap-3.5">
            <ThemeToggle className="hidden sm:inline-flex" />
            <Button
              asChild
              variant="ghost"
              className={`${NAV_BTN} hidden hover:bg-primary/12 hover:!text-primary dark:hover:!text-white md:inline-flex`}
            >
              <Link to="/submit">
                <Upload className="size-3.5" /> Soumettre
              </Link>
            </Button>
            {user && user.role === "utilisateur" && (
              <Button
                asChild
                variant="ghost"
                className={`${NAV_BTN} hidden hover:bg-primary/12 hover:!text-primary dark:hover:!text-white lg:inline-flex`}
              >
                <Link to="/account">Mon espace</Link>
              </Button>
            )}
            {user ? (
              <>
                <Button
                  asChild
                  variant={
                    user.role === "admin" || user.role === "gestionnaire" ? "secondary" : "ghost"
                  }
                  className={
                    user.role === "admin" || user.role === "gestionnaire"
                      ? `${NAV_BTN} hidden bg-secondary text-secondary-foreground transition-colors duration-300 hover:bg-primary hover:!text-primary-foreground sm:inline-flex`
                      : `${NAV_BTN} hidden hover:bg-primary/12 hover:!text-primary dark:hover:!text-white sm:inline-flex`
                  }
                >
                  <Link
                    to={
                      user.role === "admin" || user.role === "gestionnaire"
                        ? dashboardHomeForRole(user.role)
                        : "/account/profil"
                    }
                  >
                    {user.role === "admin" || user.role === "gestionnaire"
                      ? "Administration"
                      : user.nom}
                  </Link>
                </Button>
                <Button
                  asChild
                  variant="ghost"
                  className={`${NAV_BTN} hidden hover:bg-primary/12 hover:!text-primary dark:hover:!text-white lg:inline-flex`}
                >
                  <Link to="/account/profil">Mon profil</Link>
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => {
                    logout();
                    navigate({ to: "/auth/login", search: { logout: "1" } });
                  }}
                  className={`${NAV_BTN} hidden hover:bg-destructive/12 hover:text-destructive sm:inline-flex`}
                >
                  <LogOut className="size-3.5" /> Déconnexion
                </Button>
              </>
            ) : (
              <Button
                asChild
                className={`${NAV_BTN} bg-primary px-4 text-primary-foreground transition-colors hover:bg-primary/90 hover:!text-primary-foreground`}
              >
                <Link to="/auth/login">
                  <LogIn className="size-3.5" /> Connexion
                </Link>
              </Button>
            )}
            <ThemeToggle className="sm:hidden" />

            <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="tea-water-fill-none size-9 shrink-0 rounded-full text-foreground hover:bg-primary/12 hover:text-primary lg:hidden"
                aria-expanded={menuOpen}
                aria-controls={menuId}
                aria-haspopup="dialog"
                aria-label={menuOpen ? "Fermer le menu" : "Ouvrir le menu"}
                onClick={() => setMenuOpen((open) => !open)}
              >
                {menuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
              </Button>

              <SheetContent
                id={menuId}
                side="right"
                className="z-[60] flex w-[min(100vw-2rem,20rem)] flex-col gap-0 border-border/60 bg-background p-0 sm:max-w-sm"
              >
                <SheetHeader className="flag-stripe-top border-b border-border/50 px-5 py-5 text-left">
                  <SheetTitle className="font-display text-base text-foreground">Menu</SheetTitle>
                  <SheetDescription className="text-xs text-muted-foreground">
                    Navigation EZOA-TO
                  </SheetDescription>
                </SheetHeader>

                <nav
                  className="flex flex-1 flex-col gap-0.5 overflow-y-auto px-3 py-4"
                  aria-label="Navigation mobile"
                >
                  {NAV.map((n) => (
                    <Link
                      key={n.to}
                      to={n.to}
                      onClick={closeMenu}
                      className={MOBILE_LINK}
                      activeProps={{ className: cn(MOBILE_LINK, MOBILE_LINK_ACTIVE) }}
                      activeOptions={{ exact: n.to === "/" }}
                    >
                      {n.label}
                    </Link>
                  ))}
                </nav>

                <div className="mt-auto space-y-2 border-t border-border/50 bg-surface/80 px-4 py-4">
                  <Button
                    asChild
                    variant="ghost"
                    className="tea-water-fill-none h-11 w-full justify-start rounded-xl px-3 text-sm font-medium hover:bg-primary/12 hover:text-primary"
                  >
                    <Link to="/submit" onClick={closeMenu}>
                      <Upload className="size-4" /> Soumettre une épreuve
                    </Link>
                  </Button>
                  <Button
                    asChild
                    variant="ghost"
                    className="tea-water-fill-none h-11 w-full justify-start rounded-xl px-3 text-sm font-medium hover:bg-primary/12 hover:text-primary"
                  >
                    <Link to="/partenariat" onClick={closeMenu}>
                      <Handshake className="size-4" /> Sponsoriser / Partenariat
                    </Link>
                  </Button>

                  {user && user.role === "utilisateur" && (
                    <Button
                      asChild
                      variant="ghost"
                      className="tea-water-fill-none h-11 w-full justify-start rounded-xl px-3 text-sm font-medium hover:bg-primary/12 hover:text-primary"
                    >
                      <Link to="/account" onClick={closeMenu}>
                        Mon espace
                      </Link>
                    </Button>
                  )}

                  {user ? (
                    <>
                      <Button
                        asChild
                        variant={
                          user.role === "admin" || user.role === "gestionnaire"
                            ? "secondary"
                            : "ghost"
                        }
                        className={
                          user.role === "admin" || user.role === "gestionnaire"
                            ? "tea-water-fill-none h-11 w-full justify-start rounded-xl px-3 text-sm font-medium"
                            : "tea-water-fill-none h-11 w-full justify-start rounded-xl px-3 text-sm font-medium hover:bg-primary/12 hover:text-primary"
                        }
                      >
                        <Link
                          to={
                            user.role === "admin" || user.role === "gestionnaire"
                              ? dashboardHomeForRole(user.role)
                              : "/account/profil"
                          }
                          onClick={closeMenu}
                        >
                          {user.role === "admin" || user.role === "gestionnaire"
                            ? "Administration"
                            : user.nom}
                        </Link>
                      </Button>
                      <Button
                        asChild
                        variant="ghost"
                        className="tea-water-fill-none h-11 w-full justify-start rounded-xl px-3 text-sm font-medium hover:bg-primary/12 hover:text-primary"
                      >
                        <Link to="/account/profil" onClick={closeMenu}>
                          Mon profil
                        </Link>
                      </Button>
                      <Button
                        variant="ghost"
                        onClick={() => {
                          closeMenu();
                          logout();
                          navigate({ to: "/auth/login", search: { logout: "1" } });
                        }}
                        className="tea-water-fill-none h-11 w-full justify-start rounded-xl px-3 text-sm font-medium hover:bg-destructive/12 hover:text-destructive"
                      >
                        <LogOut className="size-4" /> Déconnexion
                      </Button>
                    </>
                  ) : (
                    <Button
                      asChild
                      className="tea-water-fill-none h-11 w-full rounded-xl bg-primary text-sm font-semibold text-primary-foreground hover:bg-primary/90 hover:!text-primary-foreground"
                    >
                      <Link to="/auth/login" onClick={closeMenu}>
                        <LogIn className="size-4" /> Connexion
                      </Link>
                    </Button>
                  )}
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>
    </>
  );
}
