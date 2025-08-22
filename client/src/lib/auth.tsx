import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { authAPI } from "./supabase";
import { User } from "@shared/schema";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, role: string, name: string, rank?: string, specialization?: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    try {
      const { user } = await authAPI.getUser();
      setUser(user);
    } catch (error) {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    const { user } = await authAPI.signIn(email, password);
    setUser(user);
  };

  const signUp = async (email: string, password: string, role: string, name: string, rank?: string, specialization?: string) => {
    const { user } = await authAPI.signUp(email, password, role, name, rank, specialization);
    setUser(user);
  };

  const signOut = async () => {
    await authAPI.signOut();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
