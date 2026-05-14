import { createFileRoute, Outlet, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

export const Route = createFileRoute("/admin")({
  component: AdminLayout,
});

function AdminLayout() {
  return <Outlet />;
}

export function RequireAdmin({ children }: { children: React.ReactNode }) {
  const { loading, session, isAdmin } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (loading) return;
    if (!session) {
      navigate({ to: "/admin/login", replace: true });
    }
  }, [loading, session, navigate]);

  if (loading) {
    return (
      <div className="grid min-h-screen place-items-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }
  if (!session) return null;
  if (!isAdmin) {
    return (
      <div className="grid min-h-screen place-items-center px-4">
        <div className="max-w-sm space-y-2 text-center">
          <h2 className="text-xl font-semibold">Not authorised</h2>
          <p className="text-sm text-muted-foreground">
            Your account is signed in but does not have the <code>admin</code> role.
            Ask the project owner to add it in <code>user_roles</code>.
          </p>
        </div>
      </div>
    );
  }
  return <>{children}</>;
}
