/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, createContext, useContext } from 'react';
import { auth, signInWithGoogle, logoutUser, onAuthStateChanged, FirebaseUser } from '../services/firebase';
import { LogIn, LogOut, User as UserIcon, Shield } from 'lucide-react';

interface AuthContextType {
  user: FirebaseUser | null;
  loading: boolean;
  signIn: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  signIn: async () => {},
  logout: async () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const signIn = async () => {
    try {
      await signInWithGoogle();
    } catch (e) {
      console.error('Sign in failed:', e);
    }
  };

  const logout = async () => {
    try {
      await logoutUser();
    } catch (e) {
      console.error('Logout failed:', e);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, signIn, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

export const AuthStatusBadge: React.FC = () => {
  const { user, loading, signIn, logout } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-400">
        <div className="w-3 h-3 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
        <span>Authenticating...</span>
      </div>
    );
  }

  if (!user) {
    return (
      <button
        onClick={signIn}
        className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md transition-all neon-border"
      >
        <LogIn className="w-3.5 h-3.5" />
        <span>Sign in with Google</span>
      </button>
    );
  }

  return (
    <div className="flex items-center gap-3 bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 shadow-sm">
      {user.photoURL ? (
        <img src={user.photoURL} alt={user.displayName || 'User'} className="w-6 h-6 rounded-full border border-indigo-500/50" />
      ) : (
        <div className="w-6 h-6 rounded-full bg-indigo-600/30 text-indigo-300 flex items-center justify-center text-xs font-bold">
          {user.displayName?.[0] || 'U'}
        </div>
      )}
      <div className="hidden sm:block text-left">
        <div className="text-xs font-semibold text-slate-200 truncate max-w-[120px]">{user.displayName || 'Developer'}</div>
        <div className="text-[10px] font-mono text-emerald-400 flex items-center gap-1">
          <Shield className="w-2.5 h-2.5" /> Secure Session
        </div>
      </div>
      <button
        onClick={logout}
        title="Sign out"
        className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-rose-400 transition-colors ml-1"
      >
        <LogOut className="w-4 h-4" />
      </button>
    </div>
  );
};
