import { pageHead } from "@/lib/seo";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { toast } from "sonner";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Eye,
  EyeOff,
  GraduationCap,
  Lock,
  Mail,
  MapPin,
  School,
  ShieldCheck,
  Smartphone,
  User,
  UserPlus,
} from "lucide-react";
import { emitMascot } from "@/components/auth/BirdMascot";
import { AUTH_FIELD, AuthSplitLayout } from "@/components/auth/AuthSplitLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/lib/auth";
import { api } from "@/lib/api";
import { isValidPhone, normalizePhone } from "@/lib/phone";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/auth/register")({
  head: () =>
    pageHead({
      path: "/auth/register",
      title: "Créer un compte EZOA-TO — 50 épreuves gratuites",
      description:
        "Inscris-toi gratuitement sur EZOA-TO et accède à 50 épreuves du Togo : devoirs, compositions, CEPD, BEPC, BAC, université et concours.",
    }),
  component: RegisterPage,
});

/** Profils acceptés par l'API (`profil_type`) ; tout compte peut ensuite contribuer. */
const PROFILS = [
  { id: "eleve", label: "Élève", hint: "Collège ou lycée" },
  { id: "etudiant", label: "Étudiant", hint: "Université" },
  { id: "concours", label: "Candidat concours", hint: "ENAM, ENI…" },
  { id: "enseignant", label: "Enseignant", hint: "Contributeur" },
  { id: "parent", label: "Parent", hint: "Suivi" },
  { id: "autre", label: "Autre", hint: "" },
] as const;
type ProfilId = (typeof PROFILS)[number]["id"];
const needsParcours = (p: ProfilId) => p === "eleve" || p === "etudiant" || p === "concours";

const STEPS = ["Infos personnelles", "Profil scolaire", "Sécurité"] as const;

function passwordStrength(pwd: string): { score: number; label: string; color: string } {
  if (!pwd) return { score: 0, label: "", color: "bg-muted" };
  let score = 0;
  if (pwd.length >= 8) score++;
  if (pwd.length >= 12) score++;
  if (/[A-Z]/.test(pwd) && /[a-z]/.test(pwd)) score++;
  if (/\d/.test(pwd)) score++;
  if (/[^A-Za-z0-9]/.test(pwd)) score++;
  if (score <= 2) return { score: 33, label: "Faible", color: "bg-[#D21034]" };
  if (score <= 3) return { score: 66, label: "Moyen", color: "bg-[#FFCE00]" };
  return { score: 100, label: "Fort", color: "bg-[#02A671]" };
}

type Errors = Partial<Record<string, string>>;

/** Indicateur de progression : cercles numérotés + ligne qui se remplit (charte vert/or). */
function StepperProgress({ step }: { step: number }) {
  return (
    <div className="mb-6" aria-label={`Étape ${step + 1} sur ${STEPS.length}`}>
      <div className="relative flex items-start justify-between">
        <div
          className="absolute left-[16%] right-[16%] top-4 h-1 rounded-full bg-muted"
          aria-hidden
        />
        <motion.div
          className="absolute left-[16%] top-4 h-1 rounded-full bg-gradient-to-r from-[#006A4E] to-[#02A671]"
          initial={false}
          animate={{ width: `${(step / (STEPS.length - 1)) * 68}%` }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          aria-hidden
        />
        {STEPS.map((label, i) => {
          const done = i < step;
          const active = i === step;
          return (
            <div
              key={label}
              className="relative z-10 flex w-1/3 flex-col items-center gap-1.5 text-center"
            >
              <motion.span
                initial={false}
                animate={{ scale: active ? 1.12 : 1 }}
                transition={{ type: "spring", stiffness: 380, damping: 24 }}
                className={cn(
                  "grid size-9 place-items-center rounded-full border-2 text-sm font-bold transition-colors",
                  done && "border-[#006A4E] bg-[#006A4E] text-white",
                  active &&
                    "border-[#006A4E] bg-white text-[#006A4E] shadow-md ring-4 ring-[#FFCE00]/40 dark:bg-[#0B1622] dark:text-[#02A671] dark:border-[#02A671]",
                  !done && !active && "border-border bg-card text-muted-foreground",
                )}
                aria-current={active ? "step" : undefined}
              >
                {done ? <Check className="size-4" /> : i + 1}
              </motion.span>
              <span
                className={cn(
                  "text-[11px] font-semibold leading-tight sm:text-xs",
                  active ? "text-foreground" : "text-muted-foreground",
                )}
              >
                {label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Field({
  id,
  label,
  icon: Icon,
  error,
  hint,
  children,
}: {
  id?: string;
  label: string;
  icon?: typeof User;
  error?: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id} className="text-sm font-medium">
        {label}
      </Label>
      <div className="relative">
        {Icon && (
          <Icon className="pointer-events-none absolute left-4 top-1/2 z-10 size-4 -translate-y-1/2 text-muted-foreground" />
        )}
        {children}
      </div>
      {error ? (
        <p role="alert" className="text-xs font-medium text-destructive">
          {error}
        </p>
      ) : (
        hint && <p className="text-xs text-muted-foreground">{hint}</p>
      )}
    </div>
  );
}

function RegisterPage() {
  const { register } = useAuth();
  const nav = useNavigate();
  const reduce = useReducedMotion();
  const { data: meta } = useQuery({ queryKey: ["meta"], queryFn: () => api.getMeta() });

  const [step, setStep] = useState(0);
  const [dir, setDir] = useState(1);
  const [errors, setErrors] = useState<Errors>({});
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");

  // Données conservées entre les étapes
  const [nom, setNom] = useState("");
  const [email, setEmail] = useState("");
  const [telephone, setTelephone] = useState("");
  const [profil, setProfil] = useState<ProfilId>("eleve");
  const [niveau, setNiveau] = useState<"college" | "lycee">("college");
  const [classe, setClasse] = useState("");
  const [etablissement, setEtablissement] = useState("");
  const [ville, setVille] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPwd, setConfirmPwd] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);

  const classOptions = useMemo(() => {
    if (profil === "eleve")
      return niveau === "college"
        ? (meta?.classes?.college ?? ["6e", "5e", "4e", "3e"])
        : (meta?.classes?.lycee ?? []);
    if (profil === "etudiant") return meta?.classes?.universite ?? [];
    if (profil === "concours") return meta?.classes?.concours ?? [];
    return [];
  }, [profil, niveau, meta]);
  const etabSuggestions = useMemo(
    () => [...new Set((meta?.etablissements ?? []).map((e) => e.nom).filter(Boolean))],
    [meta?.etablissements],
  );
  const villes = meta?.villes ?? [];
  const strength = useMemo(() => passwordStrength(password), [password]);

  function validate(s: number): Errors {
    const e: Errors = {};
    if (s === 0) {
      if (nom.trim().length < 2) e.nom = "Indique ton nom complet (2 caractères minimum).";
      if (!/^\S+@\S+\.\S+$/.test(email.trim())) e.email = "Adresse e-mail invalide.";
      if (!isValidPhone(telephone)) e.telephone = "Numéro invalide (8 chiffres minimum).";
    }
    if (s === 1 && needsParcours(profil)) {
      if (!classe)
        e.classe = profil === "concours" ? "Choisis le concours visé." : "Sélectionne ta classe.";
      if (profil !== "concours" && !etablissement.trim())
        e.etablissement = "Indique ton établissement.";
    }
    if (s === 2) {
      if (password.length < 8) e.password = "8 caractères minimum.";
      if (password !== confirmPwd) e.confirm = "Les mots de passe ne correspondent pas.";
      if (!acceptTerms) e.terms = "Accepte les conditions pour continuer.";
    }
    return e;
  }

  function fail(e: Errors) {
    setErrors(e);
    emitMascot("error");
    setStatus("error");
    window.setTimeout(() => setStatus("idle"), 900);
  }

  function goTo(next: number) {
    setDir(next > step ? 1 : -1);
    setStep(next);
  }

  function next() {
    const e = validate(step);
    if (Object.keys(e).length) return fail(e);
    setErrors({});
    goTo(step + 1);
  }

  /** Associe une erreur API à l'étape concernée. */
  function stepForApiError(msg: string): { step: number; field: string } {
    const m = msg.toLowerCase();
    if (m.includes("email")) return { step: 0, field: "email" };
    if (m.includes("téléphone") || m.includes("telephone")) return { step: 0, field: "telephone" };
    if (m.includes("nom")) return { step: 0, field: "nom" };
    if (m.includes("classe") || m.includes("profil") || m.includes("concours"))
      return { step: 1, field: "classe" };
    if (m.includes("établissement") || m.includes("etablissement"))
      return { step: 1, field: "etablissement" };
    return { step: 2, field: "password" };
  }

  async function submit() {
    for (const s of [0, 1, 2]) {
      const e = validate(s);
      if (Object.keys(e).length) {
        if (s !== step) goTo(s);
        return fail(e);
      }
    }
    setErrors({});
    setStatus("loading");
    try {
      await register(
        nom.trim(),
        email.trim(),
        normalizePhone(telephone),
        password,
        needsParcours(profil) ? classe : "",
        etablissement.trim(),
        { profilType: profil },
      );
      if (ville) {
        api
          .updateProfile({
            nom: nom.trim(),
            email: email.trim(),
            telephone: normalizePhone(telephone),
            ville,
          })
          .catch(() => undefined);
      }
      setStatus("success");
      emitMascot("happy");
      toast.success("Compte créé ! Bienvenue sur EZOA-TO.");
      await new Promise((r) => setTimeout(r, 900));
      nav({ to: "/account" });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Inscription impossible.";
      const target = stepForApiError(msg);
      if (target.step !== step) goTo(target.step);
      fail({ [target.field]: msg });
      toast.error(msg);
    }
  }

  const slide = reduce
    ? { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 } }
    : {
        initial: (d: number) => ({ opacity: 0, x: 48 * d }),
        animate: { opacity: 1, x: 0 },
        exit: (d: number) => ({ opacity: 0, x: -48 * d }),
      };

  return (
    <AuthSplitLayout
      variant="register"
      title="Créer un compte"
      subtitle="Compte gratuit en 3 étapes — accède aux archives et soumets des épreuves."
    >
      <StepperProgress step={step} />

      <form
        noValidate
        onSubmit={(e) => {
          e.preventDefault();
          if (step < 2) next();
          else void submit();
        }}
        className="space-y-5"
      >
        <div className="relative overflow-x-clip">
          <AnimatePresence mode="wait" custom={dir} initial={false}>
            <motion.div
              key={step}
              custom={dir}
              variants={slide as never}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              className="space-y-4 p-0.5"
            >
              {step === 0 && (
                <>
                  <Field id="nom" label="Nom complet" icon={User} error={errors.nom}>
                    <Input
                      id="nom"
                      value={nom}
                      onChange={(e) => setNom(e.target.value)}
                      placeholder="Ex. Afi Kouami"
                      autoComplete="name"
                      className={AUTH_FIELD}
                      aria-invalid={!!errors.nom}
                    />
                  </Field>
                  <Field id="email" label="Adresse e-mail" icon={Mail} error={errors.email}>
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="ton.email@exemple.tg"
                      autoComplete="email"
                      className={AUTH_FIELD}
                      aria-invalid={!!errors.email}
                    />
                  </Field>
                  <Field
                    id="telephone"
                    label="Numéro de téléphone"
                    icon={Smartphone}
                    error={errors.telephone}
                    hint="Connexion, paiements Mobile Money et retraits contributeur."
                  >
                    <Input
                      id="telephone"
                      type="tel"
                      inputMode="tel"
                      value={telephone}
                      onChange={(e) => setTelephone(e.target.value)}
                      placeholder="90 12 34 56"
                      autoComplete="tel"
                      className={AUTH_FIELD}
                      aria-invalid={!!errors.telephone}
                    />
                  </Field>
                </>
              )}

              {step === 1 && (
                <>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Je suis…</Label>
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3" role="radiogroup">
                      {PROFILS.map((p) => (
                        <button
                          key={p.id}
                          type="button"
                          role="radio"
                          aria-checked={profil === p.id}
                          onClick={() => {
                            setProfil(p.id);
                            setClasse("");
                          }}
                          className={cn(
                            "rounded-2xl border px-3 py-2.5 text-left text-sm transition-all active:scale-[0.97]",
                            profil === p.id
                              ? "border-[#006A4E] bg-[#006A4E]/10 font-semibold text-foreground ring-2 ring-[#006A4E]/30 dark:border-[#02A671]"
                              : "border-border bg-card text-muted-foreground hover:border-[#02A671]/50",
                          )}
                        >
                          {p.label}
                          {p.hint && (
                            <span className="block text-[11px] font-normal text-muted-foreground">
                              {p.hint}
                            </span>
                          )}
                        </button>
                      ))}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Tous les comptes peuvent soumettre des épreuves et devenir contributeurs.
                    </p>
                  </div>

                  {needsParcours(profil) && (
                    <div className="grid gap-4 sm:grid-cols-2">
                      {profil === "eleve" && (
                        <Field label="Niveau">
                          <Select
                            value={niveau}
                            onValueChange={(v) => {
                              setNiveau(v as "college" | "lycee");
                              setClasse("");
                            }}
                          >
                            <SelectTrigger className={cn(AUTH_FIELD, "pl-4")}>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="college">Collège</SelectItem>
                              <SelectItem value="lycee">Lycée</SelectItem>
                            </SelectContent>
                          </Select>
                        </Field>
                      )}
                      <Field
                        label={profil === "concours" ? "Concours visé" : "Classe / examen visé"}
                        icon={GraduationCap}
                        error={errors.classe}
                      >
                        <Select value={classe} onValueChange={setClasse}>
                          <SelectTrigger className={AUTH_FIELD} aria-invalid={!!errors.classe}>
                            <SelectValue
                              placeholder={profil === "concours" ? "Choisis" : "Ta classe"}
                            />
                          </SelectTrigger>
                          <SelectContent>
                            {classOptions.map((c) => (
                              <SelectItem key={c} value={c}>
                                {c}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </Field>
                    </div>
                  )}

                  {profil !== "concours" && (
                    <Field
                      id="etablissement"
                      label="Établissement"
                      icon={School}
                      error={errors.etablissement}
                      hint={needsParcours(profil) ? undefined : "Optionnel"}
                    >
                      <Input
                        id="etablissement"
                        list="register-etablissements"
                        value={etablissement}
                        onChange={(e) => setEtablissement(e.target.value)}
                        placeholder="Ex. Lycée de Tokoin"
                        autoComplete="organization"
                        className={AUTH_FIELD}
                        aria-invalid={!!errors.etablissement}
                      />
                      <datalist id="register-etablissements">
                        {etabSuggestions.map((e) => (
                          <option key={e} value={e} />
                        ))}
                      </datalist>
                    </Field>
                  )}

                  <Field
                    label="Ville / région"
                    icon={MapPin}
                    hint="Optionnel — pour les épreuves de ta zone."
                  >
                    <Select value={ville} onValueChange={setVille}>
                      <SelectTrigger className={AUTH_FIELD}>
                        <SelectValue placeholder="Ta ville" />
                      </SelectTrigger>
                      <SelectContent>
                        {villes.map((v) => (
                          <SelectItem key={v} value={v}>
                            {v}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </Field>
                </>
              )}

              {step === 2 && (
                <>
                  <Field id="password" label="Mot de passe" icon={Lock} error={errors.password}>
                    <Input
                      id="password"
                      type={showPwd ? "text" : "password"}
                      data-mascot="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="8 caractères minimum"
                      autoComplete="new-password"
                      className={cn(AUTH_FIELD, "pr-11")}
                      aria-invalid={!!errors.password}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPwd((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-muted-foreground hover:text-foreground"
                      aria-label={showPwd ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                    >
                      {showPwd ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                    </button>
                  </Field>
                  {password.length > 0 && (
                    <div className="-mt-2 space-y-1.5">
                      <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                        <motion.div
                          className={cn("h-full rounded-full", strength.color)}
                          initial={false}
                          animate={{ width: `${strength.score}%` }}
                          transition={{ duration: 0.35 }}
                        />
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Force :{" "}
                        <span className="font-medium text-foreground">{strength.label}</span>
                      </p>
                    </div>
                  )}
                  <Field
                    id="confirm"
                    label="Confirmer le mot de passe"
                    icon={Lock}
                    error={errors.confirm}
                  >
                    <Input
                      id="confirm"
                      type={showConfirm ? "text" : "password"}
                      data-mascot="password"
                      value={confirmPwd}
                      onChange={(e) => setConfirmPwd(e.target.value)}
                      placeholder="Répète ton mot de passe"
                      autoComplete="new-password"
                      className={cn(AUTH_FIELD, "pr-11")}
                      aria-invalid={!!errors.confirm}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-muted-foreground hover:text-foreground"
                      aria-label={
                        showConfirm ? "Masquer la confirmation" : "Afficher la confirmation"
                      }
                    >
                      {showConfirm ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                    </button>
                  </Field>
                  <div>
                    <label
                      className={cn(
                        "flex cursor-pointer items-start gap-3 rounded-xl border bg-muted/30 px-4 py-3 text-sm",
                        errors.terms ? "border-destructive" : "border-border/60",
                      )}
                    >
                      <input
                        type="checkbox"
                        checked={acceptTerms}
                        onChange={(e) => setAcceptTerms(e.target.checked)}
                        className="mt-0.5 size-4 shrink-0 accent-primary"
                      />
                      <span className="text-muted-foreground">
                        J&apos;accepte les{" "}
                        <Link to="/cgu" className="font-medium text-primary hover:underline">
                          conditions d&apos;utilisation
                        </Link>{" "}
                        et la{" "}
                        <Link
                          to="/confidentialite"
                          className="font-medium text-primary hover:underline"
                        >
                          politique de confidentialité
                        </Link>
                        , et j&apos;ai l&apos;accord de mes parents si j&apos;ai moins de 18 ans.
                      </span>
                    </label>
                    {errors.terms && (
                      <p role="alert" className="mt-1.5 text-xs font-medium text-destructive">
                        {errors.terms}
                      </p>
                    )}
                  </div>
                </>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="flex gap-3">
          {step > 0 && (
            <Button
              type="button"
              variant="outline"
              size="lg"
              className="h-12 shrink-0 rounded-xl px-4"
              onClick={() => {
                setErrors({});
                goTo(step - 1);
              }}
            >
              <ArrowLeft className="size-4" /> Précédent
            </Button>
          )}
          {step < 2 ? (
            <Button
              type="submit"
              size="lg"
              className="tea-water-fill-none h-12 min-w-0 flex-1 rounded-xl text-base font-semibold"
              status={status === "error" ? "error" : "idle"}
            >
              Suivant <ArrowRight className="size-4" />
            </Button>
          ) : (
            <Button
              type="submit"
              size="lg"
              className="tea-water-fill-none h-12 min-w-0 flex-1 rounded-xl text-base font-semibold"
              status={status}
              disabled={status === "loading" || status === "success"}
            >
              <UserPlus className="size-4 max-sm:hidden" />{" "}
              <span className="truncate">{status === "loading" ? "Création…" : "Créer mon compte"}</span>
            </Button>
          )}
        </div>

        <p className="pt-1 text-center text-sm text-muted-foreground">
          Déjà inscrit ?{" "}
          <Link to="/auth/login" className="font-semibold text-primary hover:underline">
            Se connecter
          </Link>
        </p>
      </form>

      <p className="mt-8 flex items-center gap-2 text-xs text-muted-foreground lg:hidden">
        <ShieldCheck className="size-3.5 shrink-0 text-primary/70" />
        Zone sécurisée — Tes données sont protégées
      </p>
    </AuthSplitLayout>
  );
}
