import { useEffect, useRef, useState } from "react";
import { Check, Loader2, Send } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { api } from "@/lib/api";
import type { AiGuideCandidate, AiGuidePhase, AiGuideTurn } from "@/lib/types";

type Bubble = { role: "tutor" | "eleve"; text: string };

const PHASE_LABEL: Record<AiGuidePhase, string> = {
  identify: "Choisir l'épreuve",
  confirm: "Confirmer l'épreuve",
  exercise: "Choisir l'exercice",
  guide: "Exercice guidé",
  remediate: "Notion du cours",
};

const INTRO =
  "Indique l'épreuve : son nom, l'examen, l'année, l'établissement, ou colle un lien du catalogue. Je la cherche dans Ezoato, puis tu confirmes. Je ne donnerai pas le corrigé.";

function candidateLine(card: AiGuideCandidate): string {
  const bits = [card.examen, card.annee, card.etablissement, card.matiere, card.classe]
    .filter((v) => v !== null && v !== undefined && v !== "")
    .map(String);
  return bits.length ? `${card.titre} — ${bits.join(", ")}` : card.titre;
}

export function GuideTutorPanel({ epreuveId }: { epreuveId?: string }) {
  const [sessionId, setSessionId] = useState<string | undefined>();
  const [phase, setPhase] = useState<AiGuidePhase>("identify");
  const [candidates, setCandidates] = useState<AiGuideCandidate[]>([]);
  const [epreuve, setEpreuve] = useState<AiGuideCandidate | null>(null);
  const [exercise, setExercise] = useState<string | null>(null);
  const [bubbles, setBubbles] = useState<Bubble[]>([{ role: "tutor", text: INTRO }]);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const started = useRef(false);
  const scroller = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scroller.current?.scrollTo({ top: scroller.current.scrollHeight });
  }, [bubbles, candidates, busy]);

  useEffect(() => {
    if (!epreuveId || started.current) return;
    started.current = true;
    void send({ epreuveId, silent: true });
    // Première confirmation à partir de la fiche déjà ouverte.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [epreuveId]);

  async function send(opts: { message?: string; epreuveId?: string; candidateId?: string; silent?: boolean }) {
    const message = opts.message?.trim() ?? "";
    if (!opts.silent && !opts.candidateId && !opts.epreuveId && message === "") return;
    if (!opts.silent && message) {
      setBubbles((prev) => [...prev, { role: "eleve", text: message }]);
      setDraft("");
    }
    setBusy(true);
    try {
      const turn = await api.guideAiTurn({
        sessionId,
        message: message || undefined,
        epreuveId: opts.epreuveId,
        candidateId: opts.candidateId,
      });
      applyTurn(turn);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Tuteur indisponible");
    } finally {
      setBusy(false);
    }
  }

  function applyTurn(turn: AiGuideTurn) {
    setSessionId(turn.sessionId);
    setPhase(turn.phase);
    setCandidates(turn.candidates ?? []);
    setEpreuve(turn.epreuve ?? null);
    setExercise(turn.exercise ?? null);
    setBubbles((prev) => {
      const withoutIntro = prev.length === 1 && prev[0]?.text === INTRO ? [] : prev;
      return [...withoutIntro, { role: "tutor", text: turn.reply }];
    });
  }

  const placeholder =
    phase === "confirm"
      ? "Oui, non, ou le numéro de l'épreuve…"
      : phase === "exercise"
        ? "Numéro ou énoncé de la question…"
        : phase === "remediate"
          ? "Ce que tu as compris de la notion…"
          : phase === "guide"
            ? "Où tu en es, une étape…"
            : "Nom, examen, année, établissement ou lien…";

  return (
    <div className="mt-5 space-y-3">
      <p className="text-sm text-muted-foreground">
        Le tuteur t&apos;aide à chercher toi-même. Il ne donne ni la réponse finale ni le corrigé.
      </p>
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <span className="rounded-full bg-primary/10 px-2.5 py-1 font-medium text-primary">
          {PHASE_LABEL[phase]}
        </span>
        {epreuve && (
          <span className="rounded-full border border-border px-2.5 py-1 text-muted-foreground">
            {epreuve.titre}
          </span>
        )}
        {exercise && phase !== "exercise" && (
          <span className="rounded-full border border-border px-2.5 py-1 text-muted-foreground">
            Exercice en cours
          </span>
        )}
      </div>
      <div
        ref={scroller}
        className="max-h-80 space-y-2 overflow-y-auto rounded-xl border border-border bg-muted/20 p-3"
      >
        {bubbles.map((b, i) => (
          <p
            key={`${b.role}-${i}`}
            className={
              b.role === "eleve"
                ? "ml-8 whitespace-pre-wrap rounded-xl bg-primary/10 px-3 py-2 text-sm"
                : "mr-8 whitespace-pre-wrap rounded-xl bg-card px-3 py-2 text-sm shadow-sm"
            }
          >
            {b.text}
          </p>
        ))}
        {busy && (
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" />
            Le tuteur réfléchit…
          </p>
        )}
      </div>
      {phase === "confirm" && candidates.length > 0 && (
        <div className="space-y-2">
          {candidates.map((card, index) => (
            <Button
              key={card.id}
              type="button"
              variant="outline"
              className="h-auto w-full justify-start whitespace-normal py-2 text-left"
              disabled={busy}
              onClick={() =>
                void send({
                  candidateId: card.id,
                  message: `C'est celle-ci : ${card.titre}`,
                })
              }
            >
              <Check className="size-4 shrink-0" />
              <span>
                {index + 1}. {candidateLine(card)}
              </span>
            </Button>
          ))}
        </div>
      )}
      <Textarea
        value={draft}
        maxLength={2000}
        onChange={(e) => setDraft(e.target.value)}
        placeholder={placeholder}
        className="min-h-20"
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            void send({ message: draft });
          }
        }}
      />
      <Button type="button" disabled={busy || draft.trim() === ""} onClick={() => void send({ message: draft })}>
        {busy ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
        Envoyer
      </Button>
    </div>
  );
}
