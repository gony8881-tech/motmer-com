import type { Session, User } from "@supabase/supabase-js";
import type { Profile } from "@/types";

export interface LoginFormValues {
  email: string;
  password: string;
}

export const EMPTY_LOGIN_FORM: LoginFormValues = { email: "", password: "" };

export type LoginFormErrors = Partial<Record<keyof LoginFormValues, string>>;

export interface RegisterFormValues {
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export const EMPTY_REGISTER_FORM: RegisterFormValues = {
  fullName: "",
  email: "",
  password: "",
  confirmPassword: "",
};

export type RegisterFormErrors = Partial<Record<keyof RegisterFormValues, string>>;

export interface AuthState {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  isAuthenticated: boolean;
}
