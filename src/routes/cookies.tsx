import { createFileRoute } from "@tanstack/react-router";
import { LegalDocPage, legalHead } from "@/components/legal/LegalDocPage";

export const Route = createFileRoute("/cookies")({
  head: () => legalHead("cookies"),
  component: () => <LegalDocPage slug="cookies" />,
});
