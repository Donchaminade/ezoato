import { useRef, useState } from "react";
import { Mic, Square } from "lucide-react";
import { Button } from "@/components/ui/button";

export function AudioBlocage({ onBlob }: { onBlob: (blob: Blob | null) => void }) {
  const [recording, setRecording] = useState(false);
  const [label, setLabel] = useState<string | null>(null);
  const recRef = useRef<MediaRecorder | null>(null);

  async function start() {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const preferred = "audio/webm";
    const rec = new MediaRecorder(
      stream,
      MediaRecorder.isTypeSupported(preferred) ? { mimeType: preferred } : undefined,
    );
    const chunks: Blob[] = [];
    rec.ondataavailable = (event) => {
      if (event.data.size > 0) chunks.push(event.data);
    };
    rec.onstop = () => {
      const blob = new Blob(chunks, { type: rec.mimeType || "audio/webm" });
      onBlob(blob);
      setLabel("Audio enregistré");
      stream.getTracks().forEach((track) => track.stop());
    };
    rec.start();
    recRef.current = rec;
    setRecording(true);
  }

  function stop() {
    recRef.current?.stop();
    setRecording(false);
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      {recording ? (
        <Button type="button" variant="destructive" onClick={stop}>
          <Square className="size-4" /> Arrêter
        </Button>
      ) : (
        <Button type="button" variant="outline" onClick={() => start().catch(() => setLabel("Micro indisponible"))}>
          <Mic className="size-4" /> Enregistrer un audio
        </Button>
      )}
      {label && <span className="text-sm text-muted-foreground">{label}</span>}
    </div>
  );
}
