import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { getCurrentUser } from "@/services/auth";

const PUBLIC_NEGOCIO_PATHS = new Set([
  "/negocio/login",
  "/negocio/register",
  "/negocio/forgot-password",
]);

export const Route = createFileRoute("/negocio")({
  beforeLoad: async ({ location }) => {
    if (PUBLIC_NEGOCIO_PATHS.has(location.pathname)) return;

    const session = await getCurrentUser();
    if (!session) {
      throw redirect({ to: "/negocio/login", search: { redirect: location.href } });
    }
    if (session.profile.role !== "business") {
      throw redirect({ to: "/app/dashboard" });
    }
  },
  component: () => <Outlet />,
});
