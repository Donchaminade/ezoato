import { createFileRoute } from "@tanstack/react-router";
import { LegalDocPage, legalHead } from "@/components/legal/LegalDocPage";

export const Route = createFileRoute("/mentions-legales")({
  head: () => legalHead("mentions-legales"),
  component: () => <LegalDocPage slug="mentions-legales" />,
});
