import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { supabase, type User } from "./supabase";

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
    // Initial session check and profile fetch
    checkUser();

    // Listen for auth changes; only update from session and let checkUser handle profile fetch
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!session?.user) {
        setUser(null);
        setLoading(false);
        return;
      }
      // Minimal optimistic update: keep current user if same id; otherwise re-check profile
      if (!user || user.id !== session.user.id) {
        await checkUser();
      } else {
        setLoading(false);
      }
    });

    // Safety net: if something stalls, clear loading after 5 seconds
    const timeoutId = setTimeout(() => {
      setLoading(false);
    }, 5000);

    return () => {
      clearTimeout(timeoutId);
      subscription.unsubscribe();
    };
  }, []);

  const checkUser = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const { data: profile, error } = await supabase
          .from('users')
          .select('*')
          .eq('id', session.user.id)
          .single();
        
        if (error) {
          // If profile is missing, try to create it on-the-fly (first login)
          const fallbackName = (session.user.user_metadata?.full_name as string | undefined)
            || (session.user.email?.split('@')[0] ?? 'User');
          const { error: insertError, data: inserted } = await supabase
            .from('users')
            .insert({
              id: session.user.id,
              name: fallbackName,
              email: session.user.email,
              role: 'User',
            })
            .select('*')
            .single();
          if (!insertError && inserted) {
            setUser(inserted as any);
          } else {
            // Surface but don't block UI
            console.error('Error creating missing profile:', insertError || error);
            setUser(null);
          }
        } else if (profile) {
          setUser(profile);
        }
      }
    } catch (error) {
      console.error('Error checking user:', error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    if (error) {
      throw error;
    }
    // Ensure profile exists after sign-in
    await checkUser();
  };

  const signUp = async (email: string, password: string, role: string, name: string, rank?: string, specialization?: string) => {
    // First, create the user in Supabase Auth
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });
    
    if (error) {
      // Provide a clearer message for common duplicate-email case
      if ((error as any).status === 400) {
        throw new Error('This email is already registered. Try signing in.');
      }
      throw error;
    }

    if (data.user) {
      // Create user profile in our users table
      const { error: profileError } = await supabase
        .from('users')
        .insert({
          id: data.user.id,
          name,
          email,
          role,
          rank,
          specialization,
        });
      
      if (profileError) {
        throw new Error(profileError.message || 'Failed to create user profile.');
      }
    }
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      throw error;
    }
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
