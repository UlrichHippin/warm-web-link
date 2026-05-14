import { useEffect, useState } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export interface AuthState {
  session: Session | null;
  user: User | null;
  isAdmin: boolean;
  isOperator: boolean;
  hasDashboardAccess: boolean;
  loading: boolean;
}

export function useAuth(): AuthState {
  const [session, setSession] = useState<Session | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isOperator, setIsOperator] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const refreshAdmin = async (uid: string | undefined) => {
      if (!uid) {
        if (mounted) {
          setIsAdmin(false);
          setIsOperator(false);
        }
        return;
      }
      const { data } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", uid);
      if (mounted) {
        const roles = (data ?? []).map((r) => r.role as string);
        setIsAdmin(roles.includes("admin"));
        setIsOperator(roles.includes("operator"));
      }
    };

    const { data: sub } = supabase.auth.onAuthStateChange((_evt, s) => {
      setSession(s);
      // Defer Supabase calls to avoid deadlocks inside the listener
      setTimeout(() => refreshAdmin(s?.user?.id), 0);
    });

    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      refreshAdmin(data.session?.user?.id).finally(() => {
        if (mounted) setLoading(false);
      });
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  return {
    session,
    user: session?.user ?? null,
    isAdmin,
    isOperator,
    hasDashboardAccess: isAdmin || isOperator,
    loading,
  };
}
