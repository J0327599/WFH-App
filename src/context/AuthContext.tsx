import React, { createContext, useContext, useState, useEffect } from 'react';
import { db } from '../lib/db';

interface User {
  igg: string;
  fullName: string;
  jobTitle: string;
  area: string;
  email: string;
  reportsTo: string;
}

interface AuthContextType {
  user: User | null;
  session: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, metadata: Omit<User, 'email'>) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const useAuth = () => {
  return useContext(AuthContext);
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);

  // Check for stored session on mount
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      const userData = await db.signIn(email, password);
      setUser(userData);
      localStorage.setItem('user', JSON.stringify(userData));
    } catch (error) {
      console.error('Sign in error:', error);
      throw error;
    }
  };

  const signUp = async (email: string, password: string, metadata: Omit<User, 'email'>) => {
    try {
      const userData = await db.signUp({ email, password, ...metadata });
      setUser(userData);
      localStorage.setItem('user', JSON.stringify(userData));
    } catch (error) {
      console.error('Sign up error:', error);
      throw error;
    }
  };

  const signOut = async () => {
    setUser(null);
    localStorage.removeItem('user');
  };

  return (
    <AuthContext.Provider value={{ user, session: !!user, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};