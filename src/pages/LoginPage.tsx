import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { api } from '../services/api.ts';
import { Wrench, Shield, Lock, Mail, ArrowRight, CheckCircle2, User } from 'lucide-react';

interface LoginPageProps {
  onNavigate: (path: string, params?: any) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onNavigate }) => {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Forgot password state
  const [forgotModal, setForgotModal] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetStatus, setResetStatus] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    setLoading(true);
    setErrorMsg(null);
    try {
      await login(email, password);
      onNavigate('/dashboard');
    } catch (err: any) {
      setErrorMsg(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async (demoEmail: string) => {
    setLoading(true);
    setErrorMsg(null);
    try {
      await login(demoEmail, 'password123');
      onNavigate('/dashboard');
    } catch (err: any) {
      setErrorMsg(err.message || 'Demo login failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.requestPasswordReset(resetEmail);
      setResetStatus(res.message);
    } catch {
      setResetStatus('Password reset link sent to your email.');
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-16 space-y-6">
      <div className="text-center space-y-2">
        <div className="w-10 h-10 rounded-xl bg-emerald-800 text-lime-accent flex items-center justify-center mx-auto shadow-xs">
          <Wrench className="w-5 h-5" />
        </div>
        <h1 className="text-2xl font-extrabold text-stone-900 tracking-tight">
          Sign In to NeighbourLend
        </h1>
        <p className="text-xs text-stone-500">
          Enter your member credentials or choose a pre-configured demo account.
        </p>
      </div>

      {errorMsg && (
        <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl">
          {errorMsg}
        </div>
      )}

      {/* Demo Quick Logins */}
      <div className="bg-emerald-50/60 p-3.5 rounded-2xl border border-emerald-200/80 space-y-2">
        <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-950 flex items-center gap-1.5">
          <User className="w-3.5 h-3.5 text-emerald-700" />
          <span>Quick 1-Click Demo Profiles</span>
        </p>
        <div className="grid grid-cols-2 gap-1.5 text-xs">
          <button
            type="button"
            onClick={() => handleDemoLogin('admin@neighbourlend.org')}
            className="p-2 bg-white hover:bg-emerald-100 rounded-lg border border-emerald-200 text-left cursor-pointer transition-colors"
          >
            <p className="font-bold text-stone-900 text-[11px]">Eleanor (Admin)</p>
            <p className="text-[10px] text-stone-500">Full platform oversight</p>
          </button>
          <button
            type="button"
            onClick={() => handleDemoLogin('marcus.chen@example.com')}
            className="p-2 bg-white hover:bg-emerald-100 rounded-lg border border-emerald-200 text-left cursor-pointer transition-colors"
          >
            <p className="font-bold text-stone-900 text-[11px]">Marcus (Lender)</p>
            <p className="text-[10px] text-stone-500">Mower & washer owner</p>
          </button>
          <button
            type="button"
            onClick={() => handleDemoLogin('sarah.jenkins@example.com')}
            className="p-2 bg-white hover:bg-emerald-100 rounded-lg border border-emerald-200 text-left cursor-pointer transition-colors"
          >
            <p className="font-bold text-stone-900 text-[11px]">Sarah (Borrower)</p>
            <p className="text-[10px] text-stone-500">Active rental history</p>
          </button>
          <button
            type="button"
            onClick={() => handleDemoLogin('david.miller@example.com')}
            className="p-2 bg-white hover:bg-emerald-100 rounded-lg border border-emerald-200 text-left cursor-pointer transition-colors"
          >
            <p className="font-bold text-stone-900 text-[11px]">David (Member)</p>
            <p className="text-[10px] text-stone-500">Drill set & active user</p>
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-stone-200 p-6 space-y-4 shadow-xs">
        <div className="space-y-1">
          <label className="text-xs font-bold text-stone-800">Email Address</label>
          <div className="relative">
            <Mail className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-3" />
            <input
              type="email"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full pl-8 pr-3 py-2 text-xs bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:border-emerald-600"
            />
          </div>
        </div>

        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-stone-800">Password</label>
            <button
              type="button"
              onClick={() => { setResetEmail(email); setForgotModal(true); }}
              className="text-[11px] text-emerald-800 hover:underline"
            >
              Forgot password?
            </button>
          </div>
          <div className="relative">
            <Lock className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-3" />
            <input
              type="password"
              required
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full pl-8 pr-3 py-2 text-xs bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:border-emerald-600"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-2.5 bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-bold rounded-xl transition-colors shadow-xs flex items-center justify-center gap-2 cursor-pointer mt-2"
        >
          {loading ? 'Signing in...' : 'Sign In'}
          <ArrowRight className="w-3.5 h-3.5" />
        </button>

        <div className="text-center pt-2">
          <p className="text-xs text-stone-500">
            Don't have an account yet?{' '}
            <button
              type="button"
              onClick={() => onNavigate('/register')}
              className="font-bold text-emerald-800 hover:underline"
            >
              Register here
            </button>
          </p>
        </div>
      </form>

      {/* Forgot Password Modal */}
      {forgotModal && (
        <div className="fixed inset-0 z-50 bg-stone-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 space-y-4 shadow-xl">
            <h3 className="text-sm font-bold text-stone-900">Reset Member Password</h3>
            {resetStatus ? (
              <div className="space-y-3 text-center py-2">
                <CheckCircle2 className="w-8 h-8 text-emerald-700 mx-auto" />
                <p className="text-xs text-stone-600">{resetStatus}</p>
                <button
                  type="button"
                  onClick={() => { setForgotModal(false); setResetStatus(null); }}
                  className="px-4 py-2 bg-stone-800 text-white rounded-lg text-xs font-semibold"
                >
                  Close
                </button>
              </div>
            ) : (
              <form onSubmit={handleResetSubmit} className="space-y-3">
                <p className="text-xs text-stone-500">
                  Enter your registered email address and we will dispatch password recovery instructions.
                </p>
                <input
                  type="email"
                  required
                  value={resetEmail}
                  onChange={e => setResetEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full p-2 bg-stone-50 border border-stone-200 rounded-lg text-xs"
                />
                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setForgotModal(false)}
                    className="px-3 py-1.5 text-xs text-stone-600"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 bg-emerald-800 text-white rounded-lg text-xs font-bold"
                  >
                    Send Reset Link
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
