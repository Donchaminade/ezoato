import { useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  AlertTriangle,
  Brain,
  CheckCircle2,
  Download,
  Lightbulb,
  Loader2,
  Lock,
  RotateCcw,
  Sparkles,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import type { AiExplanation, AiHints, AiQuiz, AiQuizQuestion } from "@/lib/types";
import { cn } from "@/lib/utils";

const SOURCE_MAX = 12000;

type Props = {
  epreuveId?: string;
  epreuveTitle?: string;
  /** Accès au contenu (épreuve gratuite, payée, ou texte collé). */
  hasContentAccess?: boolean;
  lockedReason?: "login" | "pay";
};

export function RevisionWorkspace({
  epreuveId,
  epreuveTitle,
  hasContentAccess = true,
  lockedReason,
}: Props) {
  const { user } = useAuth();
  const [sourceText, setSourceText] = useState("");
  const [questionCount, setQuestionCount] = useState(5);
  const [quiz, setQuiz] = useState<AiQuiz | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [revealed, setRevealed] = useState(false);
  const [busy, setBusy] = useState<"quiz" | "explain" | "hints" | null>(null);
  const [explainFor, setExplainFor] = useState<string | null>(null);
  const [explanation, setExplanation] = useState<AiExplanation | null>(null);
  const [hints, setHints] = useState<AiHints | null>(null);

  const canGenerate = !!user && hasContentAccess && (!!epreuveId || sourceText.trim().length >= 20);

  const wrong = useMemo(() => {
    if (!quiz || !revealed) return [];
    return quiz.questions.filter((q) => answers[q.id] && answers[q.id] !== q.correctChoiceId);
  }, [quiz, answers, revealed]);

  const score = useMemo(() => {
    if (!quiz || !revealed) return null;
    const ok = quiz.questions.filter((q) => answers[q.id] === q.correctChoiceId).length;
    return { ok, total: quiz.questions.length };
  }, [quiz, answers, revealed]);

  async function generate() {
    if (!user) {
      toast.error("Connecte-toi pour réviser avec l'IA");
      return;
    }
    if (!hasContentAccess) {
      toast.error("Accès à l'épreuve requis");
      return;
    }
    setBusy("quiz");
    setExplanation(null);
    setHints(null);
    setRevealed(false);
    setAnswers({});
    try {
      const res = await api.generateAiQuiz({
        epreuveId,
        sourceText: sourceText.trim() || undefined,
        questionCount,
        includePack: true,
      });
      setQuiz(res);
      toast.success("QCM généré — ce n'est pas une note officielle");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Impossible de générer le QCM");
    } finally {
      setBusy(null);
    }
  }

  function downloadPack() {
    if (!quiz?.pack) return;
    const blob = new Blob([JSON.stringify(quiz.pack, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `ezoato-revision-${quiz.quizId}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function askExplain(q: AiQuizQuestion) {
    setBusy("explain");
    setExplainFor(q.id);
    try {
      const res = await api.explainAiQuestion({
        question: q.prompt,
        choices: q.choices.map((c) => `${c.id}. ${c.text}`),
        studentAnswer: answers[q.id],
        sourceText: sourceText.trim() || undefined,
        epreuveId,
      });
      setExplanation(res);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Explication indisponible");
    } finally {
      setBusy(null);
    }
  }

  async function askHints() {
    if (wrong.length === 0) return;
    setBusy("hints");
    try {
      const res = await api.getAiRevisionHints({
        wrongAnswers: wrong.map((q) => ({
          question: q.prompt,
          chosen: q.choices.find((c) => c.id === answers[q.id])?.text ?? answers[q.id],
          correct: q.choices.find((c) => c.id === q.correctChoiceId)?.text,
        })),
      });
      setHints(res);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Indices indisponibles");
    } finally {
      setBusy(null);
    }
  }

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
              ? `QCM d'entraînement à partir de « ${epreuveTitle} » ou d'un extrait collé.`
              : "Colle un extrait d'épreuve pour générer un QCM d'entraînement."}
          </p>
        </div>
        <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2.5 py-1 text-xs font-medium text-amber-800 dark:text-amber-200">
          <AlertTriangle className="size-3.5" />
          Pas une note officielle
        </span>
      </div>

      <Alert className="mt-4 border-amber-500/30 bg-amber-500/5">
        <AlertTriangle className="size-4" />
        <AlertTitle>Garde-fou</AlertTitle>
        <AlertDescription>
          L'IA n'est pas un correcteur officiel. Vérifie toujours avec ton enseignant ou le corrigé
          de l'épreuve. Les réponses peuvent être inexactes.
        </AlertDescription>
      </Alert>

      {!user && (
        <div className="mt-4 rounded-xl border border-border bg-muted/30 p-4 text-sm">
          <p className="font-medium">Connexion requise</p>
          <p className="mt-1 text-muted-foreground">
            Les endpoints IA sont réservés aux comptes EZOA-TO.
          </p>
          <Button asChild className="mt-3" size="sm">
            <Link to="/auth/login">Se connecter</Link>
          </Button>
        </div>
      )}

      {user && !hasContentAccess && (
        <div className="mt-4 rounded-xl border border-border bg-muted/30 p-4 text-sm">
          <p className="flex items-center gap-2 font-medium">
            <Lock className="size-4" />
            {lockedReason === "pay" ? "Épreuve payante" : "Accès requis"}
          </p>
          <p className="mt-1 text-muted-foreground">
            Débloque l'épreuve (paiement ou abonnement) pour générer un QCM à partir de cette fiche.
            Tu peux aussi coller un extrait que tu as déjà sur{" "}
            <Link to="/reviser" className="text-primary underline-offset-2 hover:underline">
              /reviser
            </Link>
            .
          </p>
        </div>
      )}

      {(!user || hasContentAccess) && (
        <div className="mt-5 space-y-3">
          <label className="block text-sm font-medium" htmlFor="ai-source">
            Extrait (optionnel si une épreuve est liée)
          </label>
          <Textarea
            id="ai-source"
            value={sourceText}
            maxLength={SOURCE_MAX}
            onChange={(e) => setSourceText(e.target.value)}
            placeholder="Colle ici le texte extrait de l'épreuve (12 000 caractères max)…"
            className="min-h-28"
          />
          <p className="text-xs text-muted-foreground">
            {sourceText.length.toLocaleString("fr-FR")} / {SOURCE_MAX.toLocaleString("fr-FR")}
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <label className="text-sm" htmlFor="ai-count">
              Questions
            </label>
            <select
              id="ai-count"
              className="h-10 rounded-md border border-input bg-background px-3 text-sm"
              value={questionCount}
              onChange={(e) => setQuestionCount(Number(e.target.value))}
            >
              {[3, 4, 5, 6, 7, 8].map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
            <Button onClick={generate} disabled={!canGenerate || busy !== null}>
              {busy === "quiz" ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Brain className="size-4" />
              )}
              Générer le QCM
            </Button>
            {quiz?.pack && (
              <Button variant="outline" onClick={downloadPack}>
                <Download className="size-4" />
                Pack hors-ligne (JSON)
              </Button>
            )}
          </div>
        </div>
      )}

      {quiz && (
        <div className="mt-6 space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="font-display font-semibold">{quiz.title}</h3>
            {score && (
              <p className="text-sm text-muted-foreground">
                Score d'entraînement : {score.ok}/{score.total} — à confirmer en classe
              </p>
            )}
          </div>

          {quiz.questions.map((q, idx) => {
            const chosen = answers[q.id];
            const isWrong = revealed && chosen && chosen !== q.correctChoiceId;
            const isRight = revealed && chosen === q.correctChoiceId;
            return (
              <div key={q.id} className="rounded-xl border border-border p-4">
                <p className="font-medium">
                  {idx + 1}. {q.prompt}
                </p>
                <ul className="mt-3 space-y-2">
                  {q.choices.map((c) => (
                    <li key={c.id}>
                      <button
                        type="button"
                        disabled={revealed}
                        onClick={() => setAnswers((prev) => ({ ...prev, [q.id]: c.id }))}
                        className={cn(
                          "flex w-full items-start gap-2 rounded-lg border px-3 py-2 text-left text-sm transition-colors",
                          chosen === c.id
                            ? "border-primary bg-primary/10"
                            : "border-border hover:bg-muted/40",
                          revealed &&
                            c.id === q.correctChoiceId &&
                            "border-emerald-500/50 bg-emerald-500/10",
                          revealed &&
                            chosen === c.id &&
                            c.id !== q.correctChoiceId &&
                            "border-destructive/40 bg-destructive/5",
                        )}
                      >
                        <span className="font-semibold">{c.id}.</span>
                        <span>{c.text}</span>
                        {revealed && c.id === q.correctChoiceId && (
                          <CheckCircle2 className="ml-auto size-4 text-emerald-600" />
                        )}
                        {revealed && chosen === c.id && c.id !== q.correctChoiceId && (
                          <XCircle className="ml-auto size-4 text-destructive" />
                        )}
                      </button>
                    </li>
                  ))}
                </ul>
                {(isWrong || isRight) && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="mt-2"
                    disabled={busy !== null}
                    onClick={() => askExplain(q)}
                  >
                    {busy === "explain" && explainFor === q.id ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <Lightbulb className="size-4" />
                    )}
                    Je suis bloqué — expliquer
                  </Button>
                )}
              </div>
            );
          })}

          <div className="flex flex-wrap gap-2">
            {!revealed ? (
              <Button
                onClick={() => setRevealed(true)}
                disabled={quiz.questions.some((q) => !answers[q.id])}
              >
                Voir les réponses d'entraînement
              </Button>
            ) : (
              <>
                <Button
                  variant="outline"
                  onClick={() => {
                    setRevealed(false);
                    setAnswers({});
                    setHints(null);
                    setExplanation(null);
                  }}
                >
                  <RotateCcw className="size-4" />
                  Recommencer
                </Button>
                {wrong.length > 0 && (
                  <Button variant="secondary" onClick={askHints} disabled={busy !== null}>
                    {busy === "hints" ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <Lightbulb className="size-4" />
                    )}
                    Indices de révision
                  </Button>
                )}
              </>
            )}
          </div>

          {explanation && (
            <div className="rounded-xl border border-primary/25 bg-primary/5 p-4 text-sm">
              <p className="font-semibold">Explication pas-à-pas</p>
              <ol className="mt-2 list-decimal space-y-1 pl-5">
                {explanation.steps.map((s) => (
                  <li key={s}>{s}</li>
                ))}
              </ol>
              <p className="mt-3 text-muted-foreground">{explanation.summary}</p>
              <p className="mt-2 text-xs">{explanation.disclaimer}</p>
            </div>
          )}

          {hints && (
            <div className="rounded-xl border border-border bg-muted/30 p-4 text-sm">
              <p className="font-semibold">Tes indices personnels</p>
              <ul className="mt-2 list-disc space-y-1 pl-5">
                {hints.hints.map((h) => (
                  <li key={h}>{h}</li>
                ))}
              </ul>
              <p className="mt-3 text-xs text-muted-foreground">{hints.disclaimer}</p>
            </div>
          )}

          <p className="text-xs text-muted-foreground">{quiz.disclaimer}</p>
        </div>
      )}
    </section>
  );
}
