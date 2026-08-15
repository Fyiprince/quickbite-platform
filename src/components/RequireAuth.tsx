import { useAuth } from "@/hooks/use-auth";
import { api } from "@/convex/_generated/api";
import { useMutation } from "convex/react";
import { Loader2, ShieldAlert } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { Navigate, useLocation, useNavigate } from "react-router";
import { Button } from "@/components/ui/button";
import type { Role } from "@/lib/roles";

function FullScreenLoader({ label = "Loading…" }: { label?: string }) {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-3 bg-background">
      <Loader2 className="size-6 animate-spin text-primary" />
      <p className="text-sm text-muted-foreground">{label}</p>
    </main>
  );
}

/**
 * Ensures the signed-in user has a role assigned (runs RBAC provisioning).
 * Renders children once provisioning has run; the user query then reactively
 * picks up the new role.
 */
function EnsureProvisioned({ children }: { children: ReactNode }) {
  const { isAuthenticated, user } = useAuth();
  const provision = useMutation(api.provisioning.provisionProfile);
  const [attempted, setAttempted] = useState(false);

  useEffect(() => {
    if (isAuthenticated && user && !user.role && !attempted) {
      setAttempted(true);
      provision().catch((e) => {
        console.warn("Provisioning failed", e);
      });
    }
  }, [isAuthenticated, user, provision, attempted]);

  if (isAuthenticated && user && !user.role && !attempted) {
    return <FullScreenLoader label="Setting up your account…" />;
  }
  return <>{children}</>;
}

export function ForbiddenPage() {
  const navigate = useNavigate();
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background px-6 text-center">
      <div className="flex size-16 items-center justify-center rounded-2xl bg-destructive/10 text-destructive">
        <ShieldAlert className="size-8" />
      </div>
      <div>
        <h1 className="font-display text-2xl font-bold">403 — Access denied</h1>
        <p className="mt-2 max-w-sm text-sm text-muted-foreground">
          Your account doesn&apos;t have permission to view this area. Role-based
          access is enforced on the server, not just hidden in the UI.
        </p>
      </div>
      <div className="flex gap-2">
        <Button variant="outline" onClick={() => navigate(-1)}>
          Go back
        </Button>
        <Button onClick={() => navigate("/")}>Go to home</Button>
      </div>
    </main>
  );
}

/**
 * Role guard — the frontend mirror of backend requireRole. Unauthenticated
 * users are sent to /auth with their intended path; role mismatches get a
 * dedicated 403 page (never just a hidden nav link).
 */
export function RequireRole({
  role,
  children,
}: {
  role: Role;
  children: ReactNode;
}) {
  const { isLoading, isAuthenticated, user } = useAuth();
  const location = useLocation();

  if (isLoading) return <FullScreenLoader />;

  if (!isAuthenticated) {
    const returnTo = `${location.pathname}${location.search}`;
    return (
      <Navigate to={`/auth?returnTo=${encodeURIComponent(returnTo)}`} replace />
    );
  }

  if (user && !user.role) {
    return (
      <EnsureProvisioned>
        <RequireRole role={role}>{children}</RequireRole>
      </EnsureProvisioned>
    );
  }

  if (user?.role !== role) return <ForbiddenPage />;

  return <>{children}</>;
}
