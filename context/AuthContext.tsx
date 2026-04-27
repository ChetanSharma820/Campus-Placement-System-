import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User, UserRole } from '../types';
import { supabase } from '../services/supabase';

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  updateUser: (updates: Partial<User>) => void;
  isAuthenticated: boolean;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Build User object from Supabase session — reads from user_metadata, optionally enhances from public.users
const buildUserFromSession = async (sbUser: any): Promise<User | null> => {
  if (!sbUser) return null;

  const meta = sbUser.user_metadata || {};
  const rawRole = (meta.role || 'student').toUpperCase() as UserRole;

  // Base user from auth metadata (always works even if DB tables missing)
  const baseUser: User = {
    id: sbUser.id,
    email: sbUser.email || '',
    name: meta.name || sbUser.email?.split('@')[0] || 'User',
    role: rawRole,
    rollNumber: meta.roll_number,
    department: meta.department,
    academicYear: meta.academic_year,
    section: meta.section,
    avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(meta.name || 'User')}&background=random`,
  };

  // parallelize DB calls to speed up initial load
  try {
    const [userResult, profileResult] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', sbUser.id).single().catch(() => ({ data: null })),
      rawRole === UserRole.STUDENT 
        ? supabase.from('student_profiles').select('*').eq('user_id', sbUser.id).single().catch(() => ({ data: null }))
        : Promise.resolve({ data: null })
    ]);

    if (userResult?.data) {
      baseUser.name = userResult.data.name || baseUser.name;
      baseUser.role = (userResult.data.role?.toUpperCase() as UserRole) || baseUser.role;
    }

    if (profileResult?.data) {
      const profile = profileResult.data;
      baseUser.rollNumber = profile.roll_number || baseUser.rollNumber;
      baseUser.department = profile.department || baseUser.department;
      baseUser.academicYear = profile.academic_year || baseUser.academicYear;
      baseUser.section = profile.section || baseUser.section;
      baseUser.cgpa = profile.cgpa ? parseFloat(profile.cgpa) : baseUser.cgpa;
    }
  } catch (e) {
    console.warn("Profile enhancement failed, using metadata only:", e);
  }

  return baseUser;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const loadUser = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const appUser = await buildUserFromSession(session.user);
        setUser(appUser);
      } else {
        setUser(null);
      }
    } catch (err) {
      console.error('Error loading user session:', err);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        const appUser = await buildUserFromSession(session?.user);
        setUser(appUser);
        setLoading(false);
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, [loadUser]);

  const login = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    if (!data.user) throw new Error('No user returned');
    const appUser = await buildUserFromSession(data.user);
    setUser(appUser);
  };

  const logout = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
    window.location.href = '/';
  }, []);

  const updateUser = (updates: Partial<User>) => {
    setUser(prev => prev ? { ...prev, ...updates } : null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, updateUser, isAuthenticated: !!user, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
