import { useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  AlertTriangle,
  Brain,
  CheckCircle2,
  Crown,
  FilePenLine,
  FlaskConical,
  Lightbulb,
  Loader2,
  Lock,
  PenLine,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { subscriptionProCtaLabel } from "@/components/subscription/SubscriptionProBanner";
import type {
  AiCoach,
  AiEssayFeedback,
  AiExplanation,
  AiJudge,
  AiMode,
  AiProgress,
  AiQuizQuestion,
} from "@/lib/types";
import { cn } from "@/lib/utils";

const SOURCE_MAX = 12000;
const ESSAY_MAX = 8000;

type Props = {
  epreuveId?: string;
  epreuveTitle?: string;
  matiere?: string;
  hasContentAccess?: boolean;
  lockedReason?: "login" | "pay";
};

export function RevisionWorkspace({
  epreuveId,
  epreuveTitle,
  matiere,
  hasContentAccess = true,
  lockedReason,
}: Props) {
  const { user } = useAuth();
  const defaultMode = useMemo(() => inferMode(matiere), [matiere]);
  const [mode, setMode] = useState<AiMode>(defaultMode);

  const { data: sub } = useQuery({
    queryKey: ["subscription-status"],
    queryFn: () => api.getSubscriptionStatus(),
    enabled: !!user,
  });
  const premium = !!sub?.actif;

  return (
    <section className="rounded-2xl border border-primary/20 bg-card p-5 shadow-soft sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 font-display text-lg font-semibold">
            <Sparkles className="size-5 text-primary" />
            Réviser avec l'IA
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {epreuveTitle
              ? `Entraînement à partir de « ${epreuveTitle} ».`
              : "Rédaction, sciences ou QCM — ce n'est pas la correction du jury."}
          </p>
        </div>
        <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2.5 py-1 text-xs font-medium text-amber-800 dark:text-amber-200">
          <AlertTriangle className="size-3.5" />
          Pas la correction du jury
        </span>
      </div>

      <Alert className="mt-4 border-amber-500/30 bg-amber-500/5">
        <AlertTriangle className="size-4" />
        <AlertTitle>Garde-fou</AlertTitle>
        <AlertDescription>
          Ceci n&apos;est pas la correction officielle du jury. Vérifie toujours avec ton
          enseignant. En sciences, l&apos;IA explique la méthode : tu travailles au brouillon.
        </AlertDescription>
      </Alert>

      <div className="mt-4 flex flex-wrap gap-2">
        {(
          [
            ["redaction", "Rédaction", FilePenLine],
            ["calcul", "Maths / sciences", FlaskConical],
            ["quiz", "QCM", Brain],
          ] as const
        ).map(([id, label, Icon]) => (
          <Button
            key={id}
            type="button"
            size="sm"
            variant={mode === id ? "default" : "outline"}
            onClick={() => setMode(id)}
          >
            <Icon className="size-4" />
            {label}
          </Button>
        ))}
      </div>

      {!user && (
        <LockBox
          title="Connexion requise"
          body="Ezoato AI est réservé aux comptes connectés, puis à l'abonnement Pro."
          to="/auth/login"
          cta="Se connecter"
        />
      )}

      {user && !premium && (
        <LockBox
          title="Fonctionnalité Pro"
          body="Les modes rédaction, sciences et QCM IA sont inclus dans l'abonnement Pro (Flooz ou T-Money)."
          to="/account/abonnement"
          cta={subscriptionProCtaLabel()}
          icon="crown"
        />
      )}

      {user && premium && !hasContentAccess && (
        <LockBox
          title={lockedReason === "pay" ? "Épreuve payante" : "Accès requis"}
          body="Débloque cette épreuve pour l'utiliser comme support, ou colle un extrait sur /reviser."
          to="/account/abonnement"
          cta="Voir l'accès"
        />
      )}

      {user && premium && hasContentAccess && mode === "redaction" && (
        <EssayPanel epreuveId={epreuveId} matiere={matiere} />
      )}
      {user && premium && hasContentAccess && mode === "calcul" && (
        <CalculPanel epreuveId={epreuveId} matiere={matiere} />
      )}
      {user && premium && hasContentAccess && mode === "quiz" && (
        <QuizPanel epreuveId={epreuveId} />
      )}
    </section>
  );
}

function inferMode(matiere?: string): AiMode {
  const m = (matiere ?? "").toLowerCase();
  if (/math|physique|chimie|svt|biologie|science/.test(m)) return "calcul";
  if (/fran|philo|histoire|géo|geo|lettre|anglais|dissert/.test(m)) return "redaction";
  return "quiz";
}

function LockBox({
  title,
  body,
  to,
  cta,
  icon,
}: {
  title: string;
  body: string;
  to: "/auth/login" | "/account/abonnement";
  cta: string;
  icon?: "crown";
}) {
  return (
    <div className="mt-4 rounded-xl border border-border bg-muted/30 p-4 text-sm">
      <p className="flex items-center gap-2 font-medium">
        {icon === "crown" ? <Crown className="size-4" /> : <Lock className="size-4" />}
        {title}
      </p>
      <p className="mt-1 text-muted-foreground">{body}</p>
      <Button asChild className="mt-3" size="sm">
        <Link to={to}>
          {icon === "crown" && <Crown className="size-4" />}
          {cta}
        </Link>
      </Button>
    </div>
  );
}

function EssayPanel({ epreuveId, matiere }: { epreuveId?: string; matiere?: string }) {
  const [question, setQuestion] = useState("");
  const [essay, setEssay] = useState("");
  const [rewrite, setRewrite] = useState("");
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState<AiEssayFeedback | null>(null);

  async function submit() {
    if (essay.trim().length < 40) {
      toast.error("Écris d'abord ta copie dans l'éditeur (40 caractères min.)");
      return;
    }
    setBusy(true);
    try {
      const res = await api.submitAiEssay({
        epreuveId,
        question: question.trim() || `Sujet ${matiere ?? "de rédaction"}`,
        essay: essay.trim(),
        rewriteParagraph: rewrite.trim() || undefined,
      });
      setFeedback(res);
      toast.success("Feedback d'entraînement — à confirmer en classe");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Feedback indisponible");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mt-5 space-y-3">
      <p className="text-sm text-muted-foreground">
        Lis l&apos;épreuve, rédige ici, puis envoie. L&apos;IA commente le plan, les arguments et le
        style — elle ne note pas.
      </p>
      <label className="block text-sm font-medium" htmlFor="ai-sujet">
        Sujet / consigne
      </label>
      <Textarea
        id="ai-sujet"
        value={question}
        maxLength={2000}
        onChange={(e) => setQuestion(e.target.value)}
        placeholder="Colle le sujet de dissertation, commentaire ou philosophie…"
        className="min-h-20"
      />
      <label className="block text-sm font-medium" htmlFor="ai-essay">
        Ta copie
      </label>
      <Textarea
        id="ai-essay"
        value={essay}
        maxLength={ESSAY_MAX}
        onChange={(e) => setEssay(e.target.value)}
        placeholder="Écris ta réponse directement dans l'application…"
        className="min-h-40"
      />
      <p className="text-xs text-muted-foreground">
        {essay.length.toLocaleString("fr-FR")} / {ESSAY_MAX.toLocaleString("fr-FR")}
      </p>
      <label className="block text-sm font-medium" htmlFor="ai-rewrite">
        Paragraphe à améliorer (optionnel)
      </label>
      <Textarea
        id="ai-rewrite"
        value={rewrite}
        maxLength={1200}
        onChange={(e) => setRewrite(e.target.value)}
        placeholder="Un paragraphe pour une réécriture guidée…"
        className="min-h-20"
      />
      <Button onClick={submit} disabled={busy}>
        {busy ? <Loader2 className="size-4 animate-spin" /> : <PenLine className="size-4" />}
        Envoyer pour un feedback
      </Button>
      {feedback && (
        <div className="space-y-3 rounded-xl border border-primary/25 bg-primary/5 p-4 text-sm">
          <Block title="Plan" items={feedback.outline} />
          <Block title="Arguments" items={feedback.arguments} />
          <p>
            <span className="font-semibold">Style — </span>
            {feedback.style}
          </p>
          <Block title="Manques" items={feedback.gaps} />
          {feedback.rewrite && (
            <div>
              <p className="font-semibold">Réécriture guidée</p>
              <p className="mt-1">{feedback.rewrite.guided}</p>
              <ul className="mt-2 list-disc pl-5">
                {feedback.rewrite.tips.map((t) => (
                  <li key={t}>{t}</li>
                ))}
              </ul>
            </div>
          )}
          <p className="text-xs text-muted-foreground">{feedback.disclaimer}</p>
        </div>
      )}
    </div>
  );
}

function CalculPanel({ epreuveId, matiere }: { epreuveId?: string; matiere?: string }) {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [sessionId, setSessionId] = useState<string | undefined>();
  const [coach, setCoach] = useState<AiCoach | null>(null);
  const [judge, setJudge] = useState<AiJudge | null>(null);
  const [busy, setBusy] = useState<"coach" | "judge" | null>(null);

  async function startCoach() {
    if (question.trim().length < 8) {
      toast.error("Colle d'abord l'énoncé (tu calcules ensuite sur papier).");
      return;
    }
    setBusy("coach");
    setJudge(null);
    try {
      const started = await api.startAiSession({
        mode: "calcul",
        epreuveId,
        question: question.trim(),
        matiere,
      });
      setSessionId(started.sessionId);
      setCoach(
        started.coach ??
          (await api.getAiCoach({ question: question.trim(), sessionId: started.sessionId })),
      );
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Méthode indisponible");
    } finally {
      setBusy(null);
    }
  }

  async function submitAnswer() {
    if (!answer.trim() && !image) {
      toast.error("Saisis ta réponse finale ou ajoute une photo de copie.");
      return;
    }
    setBusy("judge");
    try {
      const res = await api.judgeAiAnswer({
        sessionId,
        question: question.trim(),
        studentAnswer: answer.trim() || undefined,
        image,
      });
      setJudge(res);
      if (res.coach) setCoach(res.coach);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Jugement indisponible");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="mt-5 space-y-3">
      <p className="text-sm text-muted-foreground">
        L&apos;IA n&apos;est pas un solveur : elle rappelle la méthode et un exemple voisin. Tu
        travailles <strong>sur papier</strong>, puis tu soumets ta réponse finale.
      </p>
      <label className="block text-sm font-medium" htmlFor="ai-exo">
        Énoncé
      </label>
      <Textarea
        id="ai-exo"
        value={question}
        maxLength={SOURCE_MAX}
        onChange={(e) => setQuestion(e.target.value)}
        placeholder="Colle l'exercice (maths, physique-chimie, SVT)…"
        className="min-h-24"
      />
      <Button onClick={startCoach} disabled={busy !== null}>
        {busy === "coach" ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          <Lightbulb className="size-4" />
        )}
        Voir la méthode (sans la solution)
      </Button>
      {coach && (
        <div className="rounded-xl border border-border bg-muted/30 p-4 text-sm">
          <p className="font-semibold">Méthode</p>
          <p className="mt-1">{coach.method}</p>
          {coach.formulas.length > 0 && (
            <ul className="mt-2 list-disc pl-5">
              {coach.formulas.map((f) => (
                <li key={f}>{f}</li>
              ))}
            </ul>
          )}
          <p className="mt-3 font-semibold">Exemple similaire (pas ton exercice)</p>
          <p className="mt-1">{coach.example.prompt}</p>
          <ol className="mt-1 list-decimal pl-5">
            {coach.example.steps.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ol>
          <p className="mt-2 text-xs text-muted-foreground">{coach.disclaimer}</p>
        </div>
      )}
      <label className="block text-sm font-medium" htmlFor="ai-final">
        Ta réponse finale
      </label>
      <Textarea
        id="ai-final"
        value={answer}
        maxLength={800}
        onChange={(e) => setAnswer(e.target.value)}
        placeholder="Résultat ou conclusion après ton brouillon…"
        className="min-h-20"
      />
      <label className="block text-sm font-medium" htmlFor="ai-photo">
        Photo de copie (JPG, PNG, WebP — 2 Mo max)
      </label>
      <input
        id="ai-photo"
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="block w-full text-sm"
        onChange={(e) => setImage(e.target.files?.[0] ?? null)}
      />
      <Button variant="secondary" onClick={submitAnswer} disabled={busy !== null || !coach}>
        {busy === "judge" ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          <CheckCircle2 className="size-4" />
        )}
        Soumettre pour un avis
      </Button>
      {judge && (
        <div className="rounded-xl border border-primary/25 bg-primary/5 p-4 text-sm">
          <p className="font-semibold capitalize">Avis : {verdictLabel(judge.verdict)}</p>
          <p className="mt-1">{judge.feedback}</p>
          {judge.hint && <p className="mt-2">{judge.hint}</p>}
          <p className="mt-3 text-xs text-muted-foreground">{judge.disclaimer}</p>
        </div>
      )}
    </div>
  );
}

function QuizPanel({ epreuveId }: { epreuveId?: string }) {
  const [sourceText, setSourceText] = useState("");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [question, setQuestion] = useState<AiQuizQuestion | null>(null);
  const [progress, setProgress] = useState<AiProgress | null>(null);
  const [choice, setChoice] = useState<string | null>(null);
  const [last, setLast] = useState<{ correct: boolean; explanation?: AiExplanation | null } | null>(
    null,
  );
  const [nextQ, setNextQ] = useState<AiQuizQuestion | null>(null);
  const [done, setDone] = useState(false);
  const [disclaimer, setDisclaimer] = useState("");
  const [busy, setBusy] = useState(false);

  async function start() {
    if (!epreuveId && sourceText.trim().length < 20) {
      toast.error("Colle un extrait d'épreuve (20 caractères min.)");
      return;
    }
    setBusy(true);
    setLast(null);
    setDone(false);
    setChoice(null);
    try {
      const res = await api.generateAiQuiz({
        epreuveId,
        sourceText: sourceText.trim() || undefined,
        questionCount: 5,
      });
      setSessionId(res.sessionId ?? null);
      setQuestion(res.currentQuestion ?? res.questions[0] ?? null);
      setProgress(res.progress ?? null);
      setDisclaimer(res.disclaimer);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "QCM indisponible");
    } finally {
      setBusy(false);
    }
  }

  async function answer() {
    if (!sessionId || !question || !choice) return;
    setBusy(true);
    try {
      const res = await api.answerAiQuiz({
        sessionId,
        questionId: question.id,
        choiceId: choice,
      });
      setLast({ correct: res.correct, explanation: res.explanation });
      setProgress(res.progress);
      setNextQ(res.nextQuestion ?? null);
      setDone(res.done);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Réponse non enregistrée");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mt-5 space-y-3">
      <label className="block text-sm font-medium" htmlFor="ai-qcm-src">
        Extrait (optionnel si une épreuve est liée)
      </label>
      <Textarea
        id="ai-qcm-src"
        value={sourceText}
        maxLength={SOURCE_MAX}
        onChange={(e) => setSourceText(e.target.value)}
        placeholder="Texte extrait pour générer le QCM…"
        className="min-h-24"
      />
      <Button onClick={start} disabled={busy}>
        {busy && !question ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          <Brain className="size-4" />
        )}
        Lancer le QCM
      </Button>
      {progress && (
        <p className="text-sm text-muted-foreground">
          Question {Math.min(progress.index + 1, progress.total)} / {progress.total} ·{" "}
          {progress.correct} juste(s) — score d&apos;entraînement seulement
        </p>
      )}
      {question && (!done || last) && (
        <div className="rounded-xl border border-border p-4">
          <p className="font-medium">{question.prompt}</p>
          <ul className="mt-3 space-y-2">
            {question.choices.map((c) => (
              <li key={c.id}>
                <button
                  type="button"
                  disabled={busy || !!last}
                  onClick={() => setChoice(c.id)}
                  className={cn(
                    "flex w-full items-start gap-2 rounded-lg border px-3 py-2 text-left text-sm",
                    choice === c.id
                      ? "border-primary bg-primary/10"
                      : "border-border hover:bg-muted/40",
                  )}
                >
                  <span className="font-semibold">{c.id}.</span>
                  <span>{c.text}</span>
                </button>
              </li>
            ))}
          </ul>
          {!last ? (
            <Button className="mt-3" onClick={answer} disabled={!choice || busy}>
              Valider
            </Button>
          ) : (
            <div className="mt-3 space-y-2 text-sm">
              <p className={last.correct ? "text-emerald-700" : "text-destructive"}>
                {last.correct
                  ? "Correct (entraînement)."
                  : "Pas encore — lis l'explication puis continue."}
              </p>
              {last.explanation && (
                <ol className="list-decimal pl-5">
                  {last.explanation.steps.map((s) => (
                    <li key={s}>{s}</li>
                  ))}
                </ol>
              )}
              <Button
                size="sm"
                onClick={() => {
                  if (nextQ) setQuestion(nextQ);
                  setNextQ(null);
                  setLast(null);
                  setChoice(null);
                }}
                disabled={!nextQ && !done}
              >
                {done ? "Terminé" : "Question suivante"}
              </Button>
            </div>
          )}
        </div>
      )}
      {done && (
        <p className="text-sm">
          Série terminée. {progress?.correct}/{progress?.total} — confirme avec ton enseignant.
        </p>
      )}
      {disclaimer && <p className="text-xs text-muted-foreground">{disclaimer}</p>}
    </div>
  );
}

function Block({ title, items }: { title: string; items: string[] }) {
  if (!items.length) return null;
  return (
    <div>
      <p className="font-semibold">{title}</p>
      <ul className="mt-1 list-disc pl-5">
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </div>
  );
}

function verdictLabel(v: AiJudge["verdict"]): string {
  if (v === "correct") return "plutôt juste";
  if (v === "partial") return "partiel";
  return "à revoir";
}
