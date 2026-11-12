import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { api } from '../services/api.ts';
import { User, Phone, MapPin, CheckCircle2, ShieldCheck, ArrowLeft } from 'lucide-react';

interface EditProfilePageProps {
  onNavigate: (path: string, params?: any) => void;
}

export const EditProfilePage: React.FC<EditProfilePageProps> = ({ onNavigate }) => {
  const { user, refreshUser } = useAuth();

  const [fullName, setFullName] = useState(user?.fullName || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [location, setLocation] = useState(user?.location || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [profileImage, setProfileImage] = useState(user?.profileImage || '');
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [verifying, setVerifying] = useState(false);

  if (!user) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center space-y-3">
        <h2 className="text-xl font-bold text-stone-900">Sign in to edit your profile</h2>
        <button onClick={() => onNavigate('/login')} className="px-4 py-2 bg-emerald-800 text-white rounded-lg text-xs font-semibold">
          Sign In
        </button>
      </div>
    );
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSavedSuccess(false);
    try {
      await api.updateProfile({
        fullName,
        phone,
        location,
        bio,
        profileImage
      });
      await refreshUser();
      setSavedSuccess(true);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleVerifyEmail = async () => {
    setVerifying(true);
    try {
      await api.verifyEmail();
      await refreshUser();
    } catch (err) {
      console.error(err);
    } finally {
      setVerifying(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10 space-y-6">
      <button
        onClick={() => onNavigate('/dashboard')}
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-stone-600 hover:text-stone-900 cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Dashboard</span>
      </button>

      <div>
        <h1 className="text-2xl font-extrabold text-stone-900 tracking-tight">
          Edit Member Profile
        </h1>
        <p className="text-xs text-stone-500 mt-1">
          Update your public contact info, neighborhood area, and avatar.
        </p>
      </div>

      {savedSuccess && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>Profile changes saved successfully!</span>
        </div>
      )}

      {/* Verification status card */}
      <div className="bg-white p-4 rounded-2xl border border-stone-200 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-stone-900">Email Verification</span>
            <span className="text-[10px] font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
              {user.verificationStatus === 'verified' ? 'Verified Member' : 'Pending Verification'}
            </span>
          </div>
          <p className="text-[11px] text-stone-500 mt-0.5">{user.email}</p>
        </div>

        {user.verificationStatus !== 'verified' && (
          <button
            onClick={handleVerifyEmail}
            disabled={verifying}
            className="px-3 py-1.5 bg-emerald-800 text-white text-xs font-semibold rounded-lg hover:bg-emerald-900"
          >
            {verifying ? 'Verifying...' : 'Verify Now'}
          </button>
        )}
      </div>

      <form onSubmit={handleSave} className="bg-white rounded-2xl border border-stone-200 p-6 space-y-4 shadow-xs">
        <div className="space-y-1">
          <label className="text-xs font-bold text-stone-800">Full Name</label>
          <input
            type="text"
            required
            value={fullName}
            onChange={e => setFullName(e.target.value)}
            className="w-full px-3 py-2 text-xs bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:border-emerald-600"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-xs font-bold text-stone-800">Phone</label>
            <input
              type="tel"
              value={phone}
              onChange={e => setPhone(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:border-emerald-600"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-stone-800">Neighborhood / District</label>
            <input
              type="text"
              value={location}
              onChange={e => setLocation(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:border-emerald-600"
            />
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-xs font-bold text-stone-800">Profile Photo URL</label>
          <input
            type="text"
            value={profileImage}
            onChange={e => setProfileImage(e.target.value)}
            placeholder="https://..."
            className="w-full px-3 py-2 text-xs bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:border-emerald-600"
          />
        </div>

        <div className="space-y-1">
          <label className="text-xs font-bold text-stone-800">About You & Equipment Interests</label>
          <textarea
            rows={4}
            value={bio}
            onChange={e => setBio(e.target.value)}
            placeholder="Tell neighbors what projects you are tackling, tools you often have available, or your DIY background..."
            className="w-full px-3 py-2 text-xs bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:border-emerald-600 resize-none"
          />
        </div>

        <div className="pt-2 flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2.5 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl text-xs font-bold cursor-pointer"
          >
            {saving ? 'Saving...' : 'Save Profile Changes'}
          </button>
        </div>
      </form>
    </div>
  );
};
