import { createFileRoute } from "@tanstack/react-router";
import { LegalDocPage, legalHead } from "@/components/legal/LegalDocPage";

export const Route = createFileRoute("/confidentialite")({
  head: () => legalHead("confidentialite"),
  component: () => <LegalDocPage slug="confidentialite" />,
});
