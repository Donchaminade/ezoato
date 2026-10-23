import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/conditions")({
  beforeLoad: () => {
    throw redirect({ to: "/cgu", statusCode: 301 });
  },
});
