"use client";

import React, { createContext, useContext, useEffect, useState, useMemo, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";

export interface SessionUser {
  id: string;
  email: string;
  name: string;
  role: string;
  image?: string | null;
}

export interface AuthContextType {
  user: SessionUser | null;
  supabaseUser: User | null;
  status: "loading" | "authenticated" | "unauthenticated";
  signOut: (options?: { callbackUrl?: string }) => Promise<void>;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  supabaseUser: null,
  status: "loading",
  signOut: async () => {},
  refresh: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [supabaseUser, setSupabaseUser] = useState<User | null>(null);
  const [user, setUser] = useState<SessionUser | null>(null);
  const [status, setStatus] = useState<"loading" | "authenticated" | "unauthenticated">("loading");

  const supabase = useMemo(() => createClient(), []);

  const syncProfile = useCallback(async (sbUser: User | null) => {
    if (!sbUser) {
      setUser(null);
      setSupabaseUser(null);
      setStatus("unauthenticated");
      return;
    }

    setSupabaseUser(sbUser);
    const meta = sbUser.user_metadata || {};
    const firstName = meta.firstName || meta.first_name || "";
    const lastName = meta.lastName || meta.last_name || "";
    const fullName = `${firstName} ${lastName}`.trim() || meta.name || sbUser.email?.split("@")[0] || "User";
    const role = (meta.role as string) || "STUDENT";

    setUser({
      id: sbUser.id,
      email: sbUser.email || "",
      name: fullName,
      role: role,
      image: meta.avatar_url || meta.avatar || null,
    });
    setStatus("authenticated");

    try {
      const res = await fetch("/api/user/profile");
      if (res.ok) {
        const data = await res.json();
        if (data.user) {
          setUser({
            id: data.user.id || sbUser.id,
            email: data.user.email || sbUser.email || "",
            name: data.user.profile
              ? `${data.user.profile.firstName} ${data.user.profile.lastName}`.trim()
              : fullName,
            role: data.user.role || role,
            image: data.user.profile?.avatar || meta.avatar_url || null,
          });
        }
      }
    } catch {
      // Background sync non-critical failure
    }
  }, []);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      syncProfile(user);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      syncProfile(session?.user ?? null);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase, syncProfile]);

  const signOut = async (options?: { callbackUrl?: string }) => {
    await supabase.auth.signOut();
    setUser(null);
    setSupabaseUser(null);
    setStatus("unauthenticated");
    window.location.href = options?.callbackUrl || "/";
  };

  const refresh = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    await syncProfile(user);
  };

  return (
    <AuthContext.Provider value={{ user, supabaseUser, status, signOut, refresh }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}

export async function signOut(options?: { callbackUrl?: string }) {
  const supabase = createClient();
  await supabase.auth.signOut();
  window.location.href = options?.callbackUrl || "/";
}

// Full compatibility hook with NextAuth signature
export function useSession() {
  const { user, status } = useAuth();
  return {
    data: user ? { user } : null,
    status,
  };
}
