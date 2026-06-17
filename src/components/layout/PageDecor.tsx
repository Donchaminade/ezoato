import { WaveDivider } from "@/components/motion/WaveDivider";

/** Décor d'arrière-plan discret — halos et courbes wave */
export function PageDecor() {
  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden" aria-hidden>
      <div className="absolute -top-48 right-0 size-[32rem] rounded-full bg-primary/[0.04]" />
      <div className="absolute top-1/3 -left-24 size-64 rounded-full bg-accent/[0.05]" />
      <div className="absolute bottom-0 right-1/4 size-96 rounded-full bg-tg-green/[0.03]" />

      <div className="absolute inset-x-0 bottom-0 opacity-[0.06]">
        <WaveDivider className="text-primary" shape="organic" height="lg" layered />
      </div>
    </div>
  );
}
