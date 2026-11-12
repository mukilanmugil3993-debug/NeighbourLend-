import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { Wrench, ShieldCheck, Mail, Lock, User, Phone, MapPin, ArrowRight } from 'lucide-react';

interface RegisterPageProps {
  onNavigate: (path: string, params?: any) => void;
}

export const RegisterPage: React.FC<RegisterPageProps> = ({ onNavigate }) => {
  const { register } = useAuth();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [location, setLocation] = useState('Maplewood District');
  const [agreed, setAgreed] = useState(true);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!agreed) {
      setErrorMsg('Please accept the Community Sharing Safety Guidelines.');
      return;
    }

    setLoading(true);
    setErrorMsg(null);
    try {
      await register({
        fullName,
        email,
        password,
        phone,
        location
      });
      onNavigate('/dashboard');
    } catch (err: any) {
      setErrorMsg(err.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-14 space-y-6">
      <div className="text-center space-y-2">
        <div className="w-10 h-10 rounded-xl bg-emerald-800 text-lime-accent flex items-center justify-center mx-auto shadow-xs">
          <Wrench className="w-5 h-5" />
        </div>
        <h1 className="text-2xl font-extrabold text-stone-900 tracking-tight">
          Join NeighbourLend
        </h1>
        <p className="text-xs text-stone-500">
          Connect with trusted neighbors to borrow, share, and lend equipment locally.
        </p>
      </div>

      {errorMsg && (
        <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl">
          {errorMsg}
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-stone-200 p-6 space-y-4 shadow-xs">
        <div className="space-y-1">
          <label className="text-xs font-bold text-stone-800">Full Name *</label>
          <div className="relative">
            <User className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-3" />
            <input
              type="text"
              required
              value={fullName}
              onChange={e => setFullName(e.target.value)}
              placeholder="e.g. Jordan Bennett"
              className="w-full pl-8 pr-3 py-2 text-xs bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:border-emerald-600"
            />
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-xs font-bold text-stone-800">Email Address *</label>
          <div className="relative">
            <Mail className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-3" />
            <input
              type="email"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="jordan@example.com"
              className="w-full pl-8 pr-3 py-2 text-xs bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:border-emerald-600"
            />
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-xs font-bold text-stone-800">Password *</label>
          <div className="relative">
            <Lock className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-3" />
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="At least 6 characters"
              className="w-full pl-8 pr-3 py-2 text-xs bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:border-emerald-600"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-xs font-bold text-stone-800">Phone</label>
            <div className="relative">
              <Phone className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-3" />
              <input
                type="tel"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                placeholder="+1 (555) 000-0000"
                className="w-full pl-8 pr-3 py-2 text-xs bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:border-emerald-600"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-stone-800">Neighborhood *</label>
            <div className="relative">
              <MapPin className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-3" />
              <input
                type="text"
                required
                value={location}
                onChange={e => setLocation(e.target.value)}
                placeholder="District or town"
                className="w-full pl-8 pr-3 py-2 text-xs bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:border-emerald-600"
              />
            </div>
          </div>
        </div>

        <div className="pt-2">
          <label className="flex items-start gap-2 text-xs text-stone-600 cursor-pointer">
            <input
              type="checkbox"
              checked={agreed}
              onChange={e => setAgreed(e.target.checked)}
              className="w-4 h-4 mt-0.5 accent-emerald-700 rounded"
            />
            <span>
              I agree to the <button type="button" onClick={() => onNavigate('/safety')} className="text-emerald-800 font-semibold underline">Safety Guidelines</button> and <button type="button" onClick={() => onNavigate('/terms')} className="text-emerald-800 font-semibold underline">Terms & Conditions</button>.
            </span>
          </label>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-2.5 bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-bold rounded-xl transition-colors shadow-xs flex items-center justify-center gap-2 cursor-pointer mt-2"
        >
          {loading ? 'Creating Member Account...' : 'Register & Join Network'}
          <ArrowRight className="w-3.5 h-3.5" />
        </button>

        <div className="text-center pt-2">
          <p className="text-xs text-stone-500">
            Already registered?{' '}
            <button
              type="button"
              onClick={() => onNavigate('/login')}
              className="font-bold text-emerald-800 hover:underline"
            >
              Sign in
            </button>
          </p>
        </div>
      </form>
    </div>
  );
};
