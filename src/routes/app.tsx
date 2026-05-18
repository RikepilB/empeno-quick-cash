import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { getCurrentUser } from "@/services/auth";

const PUBLIC_APP_PATHS = new Set(["/app/login", "/app/register"]);

export const Route = createFileRoute("/app")({
  beforeLoad: async ({ location }) => {
    if (PUBLIC_APP_PATHS.has(location.pathname)) return;

    const session = await getCurrentUser();
    if (!session) {
      throw redirect({ to: "/app/login", search: { redirect: location.href } });
    }
    if (session.profile.role !== "client") {
      throw redirect({ to: "/negocio/dashboard" });
    }
  },
  component: () => <Outlet />,
});
