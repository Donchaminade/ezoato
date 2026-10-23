import { createFileRoute } from "@tanstack/react-router";
import { LegalDocPage, legalHead } from "@/components/legal/LegalDocPage";

export const Route = createFileRoute("/charte-contributeurs")({
  head: () => legalHead("charte-contributeurs"),
  component: () => <LegalDocPage slug="charte-contributeurs" />,
});
