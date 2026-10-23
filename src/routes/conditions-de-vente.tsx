import { createFileRoute } from "@tanstack/react-router";
import { LegalDocPage, legalHead } from "@/components/legal/LegalDocPage";

export const Route = createFileRoute("/conditions-de-vente")({
  head: () => legalHead("conditions-de-vente"),
  component: () => <LegalDocPage slug="conditions-de-vente" />,
});
