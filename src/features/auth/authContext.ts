import { createContext, useContext } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabaseClient";

export type AuthCtx = {
  user: User | null;
  userId: string | null;
  session: Session | null;
  authReady: boolean;
  loading: boolean;
  signOut: () => Promise<void>;
};

export const AuthContext = createContext<AuthCtx>({
  user: null,
  userId: null,
  session: null,
  authReady: false,
  loading: true,
  signOut: async () => {
    await supabase.auth.signOut();
  },
});

export function useAuth() {
  return useContext(AuthContext);
}
