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

function Gate({
  children,
  allow,
  roleLabel,
}: {
  children: React.ReactNode;
  allow: (a: ReturnType<typeof useAuth>) => boolean;
  roleLabel: string;
}) {
  const auth = useAuth();
  const { loading, session } = auth;
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
  if (!allow(auth)) {
    return (
      <div className="grid min-h-screen place-items-center px-4">
        <div className="max-w-sm space-y-2 text-center">
          <h2 className="text-xl font-semibold">Not authorised</h2>
          <p className="text-sm text-muted-foreground">
            Your account is signed in but does not have the {roleLabel} role.
            Ask the project owner to add it in <code>user_roles</code>.
          </p>
        </div>
      </div>
    );
  }
  return <>{children}</>;
}

export function RequireAdmin({ children }: { children: React.ReactNode }) {
  return (
    <Gate allow={(a) => a.isAdmin} roleLabel="admin">
      {children}
    </Gate>
  );
}

export function RequireDashboardAccess({ children }: { children: React.ReactNode }) {
  return (
    <Gate allow={(a) => a.hasDashboardAccess} roleLabel="admin or operator">
      {children}
    </Gate>
  );
}
