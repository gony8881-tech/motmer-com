import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type PropsWithChildren,
} from "react";
import type { Session, User } from "@supabase/supabase-js";
import { requireSupabase, isSupabaseConfigured } from "@/lib/supabase/client";
import { getProfile, signIn as signInService, signOut as signOutService, signUp as signUpService } from "@/features/auth/services/authService";
import type { Profile, Role } from "@/types";

interface AuthContextValue {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  role: Role | null;
  loading: boolean;
  isAuthenticated: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (fullName: string, email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: PropsWithChildren) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const mountedRef = useRef(true);

  const applySession = useCallback(async (nextSession: Session | null) => {
    setSession(nextSession);
    setUser(nextSession?.user ?? null);

    if (!nextSession?.user) {
      setProfile(null);
      return;
    }

    try {
      const nextProfile = await getProfile(nextSession.user.id);
      if (mountedRef.current) setProfile(nextProfile);
    } catch {
      if (mountedRef.current) setProfile(null);
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;

    if (!isSupabaseConfigured) {
      setLoading(false);
      return;
    }

    const client = requireSupabase();
    let initialCheckDone = false;

    client.auth
      .getSession()
      .then(async ({ data }) => {
        await applySession(data.session);
      })
      .finally(() => {
        initialCheckDone = true;
        if (mountedRef.current) setLoading(false);
      });

    const {
      data: { subscription },
    } = client.auth.onAuthStateChange((_event, nextSession) => {
      // نتجاهل الاستدعاء الأول من onAuthStateChange إن كان getSession لم ينته
      // بعد (لتفادي معالجة نفس الجلسة مرتين ووميض في حالة loading)؛ أي تغيّر
      // لاحق (تسجيل دخول/خروج فعلي) يُعالَج بشكل طبيعي.
      if (!initialCheckDone) return;
      setLoading(true);
      applySession(nextSession).finally(() => {
        if (mountedRef.current) setLoading(false);
      });
    });

    return () => {
      mountedRef.current = false;
      subscription.unsubscribe();
    };
  }, [applySession]);

  const refreshProfile = useCallback(async () => {
    if (!user) return;
    try {
      const nextProfile = await getProfile(user.id);
      if (mountedRef.current) setProfile(nextProfile);
    } catch {
      // نتجاهل الخطأ هنا: refreshProfile تُستخدم كتحديث اختياري وليست حرجة لعرض الواجهة
    }
  }, [user]);

  const value: AuthContextValue = {
    user,
    session,
    profile,
    role: profile?.role ?? null,
    loading,
    isAuthenticated: Boolean(user),
    signIn: signInService,
    signUp: signUpService,
    signOut: signOutService,
    refreshProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth يجب أن يُستخدم داخل AuthProvider.");
  }
  return ctx;
}
