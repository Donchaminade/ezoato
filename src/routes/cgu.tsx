import { createFileRoute } from "@tanstack/react-router";
import { LegalDocPage, legalHead } from "@/components/legal/LegalDocPage";

export const Route = createFileRoute("/cgu")({
  head: () => legalHead("cgu"),
  component: () => <LegalDocPage slug="cgu" />,
});
