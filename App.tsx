import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { AddExpense } from './pages/AddExpense';
import { Settlement } from './pages/Settlement';
import { AllExpenses } from './pages/AllExpenses';
import { Personal } from './pages/Personal';
import { BulkAdd } from './pages/BulkAdd';
import { Recurring } from './pages/Recurring';
import { UserProfile } from './pages/UserProfile';
import { User } from './types';
import { USERS } from './constants';
import { Button } from './components/ui/Button';
import { supabase, isSupabaseConfigured } from './services/supabase';
import { Lock, Loader2, AlertTriangle } from 'lucide-react';
import { Toaster } from 'react-hot-toast';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Login Form State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);
  const [signingIn, setSigningIn] = useState(false);

  useEffect(() => {
    // 0. If no config, stop loading immediately (UI will handle it)
    if (!isSupabaseConfigured()) {
      setLoading(false);
      return;
    }

    // 1. Check active session on load
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user?.email) {
        mapUser(session.user.email);
      }
      setLoading(false);
    };

    checkSession();

    // 2. Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user?.email) {
        mapUser(session.user.email);
      } else {
        setCurrentUser(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Helper to map Supabase Email -> Brother User
  const mapUser = (email: string) => {
    const appUser = USERS.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (appUser) {
      setCurrentUser(appUser);
      setAuthError(null);
    } else {
      setAuthError("Email not recognized as a registered brother.");
      supabase.auth.signOut();
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setSigningIn(true);
    setAuthError(null);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setAuthError(error.message);
    }
    setSigningIn(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setCurrentUser(null);
  };

  // 1. Missing Configuration Screen
  if (!isSupabaseConfigured()) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="w-full max-w-sm bg-white p-8 rounded-2xl shadow-xl border border-rose-100 text-center animate-fade-in">
          <div className="w-12 h-12 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertTriangle size={24} />
          </div>
          <h2 className="text-xl font-bold text-slate-800 mb-2">Setup Required</h2>
          <p className="text-sm text-slate-500 mb-6">
            Supabase credentials are missing. Please add the following to your environment variables:
          </p>
          <div className="bg-slate-900 text-slate-300 text-xs text-left p-4 rounded-lg font-mono mb-6 overflow-x-auto whitespace-pre">
            VITE_SUPABASE_URL=...{'\n'}
            VITE_SUPABASE_ANON_KEY=...
          </div>
          <p className="text-[10px] text-slate-400">
            The app cannot authenticate without these.
          </p>
        </div>
      </div>
    );
  }

  // 2. Loading Screen
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="animate-spin text-slate-400" size={32} />
      </div>
    );
  }

  // 3. Login Screen (If not authenticated)
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-sm bg-white p-8 rounded-2xl shadow-xl border border-slate-100 animate-fade-in">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-slate-800 mb-2">Brotherhood</h1>
            <p className="text-slate-500 text-sm">Private Family Access</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase mb-2">Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 text-sm focus:outline-none focus:border-slate-800"
                placeholder="brother@family.app"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase mb-2">Password</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 text-sm focus:outline-none focus:border-slate-800"
                placeholder="••••••••"
                required
              />
            </div>

            {authError && (
              <div className="p-3 bg-rose-50 text-rose-600 text-xs rounded-lg flex items-start gap-2">
                <Lock size={14} className="shrink-0 mt-0.5" />
                <span>{authError}</span>
              </div>
            )}

            <Button type="submit" fullWidth disabled={signingIn}>
              {signingIn ? 'Verifying...' : 'Unlock App'}
            </Button>
          </form>

          <p className="text-center text-[10px] text-slate-300 mt-6">
            Powered by Supabase Auth
          </p>
        </div>
      </div>
    );
  }

  // 4. Authenticated App
  return (
    <>
      <Toaster
        position="top-center"
        toastOptions={{
          duration: 3000,
          style: {
            background: '#1e293b',
            color: '#fff',
            borderRadius: '12px',
            padding: '12px 16px',
          },
          success: {
            iconTheme: {
              primary: '#10b981',
              secondary: '#fff',
            },
          },
          error: {
            iconTheme: {
              primary: '#ef4444',
              secondary: '#fff',
            },
          },
        }}
      />
      <HashRouter>
        <Routes>
          <Route path="/" element={<Layout currentUser={currentUser} onChangeUser={handleLogout} />}>
            <Route index element={<Dashboard currentUser={currentUser.id} />} />
            <Route path="add" element={<AddExpense currentUser={currentUser.id} />} />
            <Route path="settlement" element={<Settlement />} />
            <Route path="expenses" element={<AllExpenses currentUser={currentUser.id} />} />
            <Route path="personal" element={<Personal currentUser={currentUser.id} />} />
            <Route path="bulk-add" element={<BulkAdd currentUser={currentUser.id} />} />
            <Route path="recurring" element={<Recurring currentUser={currentUser.id} />} />
            <Route path="profile" element={<UserProfile currentUser={currentUser.id} />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </HashRouter>
    </>
  );
};

export default App;