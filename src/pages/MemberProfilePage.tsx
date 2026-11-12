import React, { useState, useEffect } from 'react';
import { api } from '../services/api.ts';
import { Member, Equipment, Review } from '../types/index.ts';
import { EquipmentCard } from '../components/equipment/EquipmentCard.tsx';
import { useAuth } from '../context/AuthContext.tsx';
import {
  ShieldCheck,
  Star,
  MapPin,
  Calendar,
  MessageSquare,
  Wrench,
  ArrowLeft,
  CheckCircle2
} from 'lucide-react';

interface MemberProfilePageProps {
  memberId: string;
  onNavigate: (path: string, params?: any) => void;
}

export const MemberProfilePage: React.FC<MemberProfilePageProps> = ({ memberId, onNavigate }) => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<{ member: Member; listings: Equipment[]; reviews: Review[] } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getMemberProfile(memberId)
      .then(setProfile)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [memberId]);

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-12">
        <div className="h-64 bg-stone-100 rounded-2xl animate-pulse" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center space-y-3">
        <h2 className="text-xl font-bold text-stone-900">Member not found</h2>
        <button
          onClick={() => onNavigate('/explore')}
          className="px-4 py-2 bg-emerald-800 text-white rounded-xl text-xs font-semibold"
        >
          Return to Marketplace
        </button>
      </div>
    );
  }

  const { member, listings, reviews } = profile;
  const isMe = user && user.memberId === member.memberId;

  const handleMessage = async () => {
    if (!user) {
      onNavigate('/login');
      return;
    }
    try {
      const conv = await api.startConversation({
        participantId: member.memberId,
        initialMessage: `Hi ${member.fullName}, reaching out via NeighbourLend!`
      });
      onNavigate('/messages', { conversationId: conv.conversationId });
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <button
        onClick={() => onNavigate('/explore')}
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-stone-600 hover:text-stone-900 cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back</span>
      </button>

      {/* Member Header Profile Box */}
      <div className="bg-white rounded-3xl border border-stone-200 p-6 sm:p-8 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <img
              src={member.profileImage || 'https://images.unsplash.com/photo-1534528741775?auto=format&fit=crop&w=200&q=80'}
              alt={member.fullName}
              className="w-20 h-20 sm:w-24 sm:h-24 rounded-full object-cover border-2 border-emerald-700/30 shadow-xs"
              referrerPolicy="no-referrer"
            />
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-extrabold text-stone-900">{member.fullName}</h1>
                <span title="Verified Member">
                  <ShieldCheck className="w-5 h-5 text-emerald-600" />
                </span>
              </div>

              <div className="flex items-center gap-4 text-xs text-stone-500 flex-wrap">
                <div className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-stone-400" />
                  <span>{member.location}</span>
                </div>
                <span>·</span>
                <div className="flex items-center gap-1 text-stone-700 font-semibold">
                  <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                  <span className="tabular-nums">{member.averageRating.toFixed(1)}</span>
                  <span className="text-stone-400 font-normal">({reviews.length} reviews)</span>
                </div>
                <span>·</span>
                <span>Member since {new Date(member.createdAt).getFullYear()}</span>
              </div>

              {member.bio && (
                <p className="text-xs text-stone-600 max-w-xl pt-1 leading-relaxed">
                  {member.bio}
                </p>
              )}
            </div>
          </div>

          <div>
            {isMe ? (
              <button
                onClick={() => onNavigate('/profile/edit')}
                className="px-4 py-2 text-xs font-semibold bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-xl"
              >
                Edit Your Profile
              </button>
            ) : (
              <button
                onClick={handleMessage}
                className="px-5 py-2.5 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-2 shadow-xs cursor-pointer"
              >
                <MessageSquare className="w-4 h-4" />
                <span>Message Neighbor</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Equipment Listed by this member */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-stone-900">
          Equipment Shared by {member.fullName.split(' ')[0]} ({listings.length})
        </h2>

        {listings.length === 0 ? (
          <p className="text-xs text-stone-500 italic">This neighbor has no active listings at the moment.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {listings.map(eq => (
              <EquipmentCard
                key={eq.equipmentId}
                equipment={eq}
                onNavigate={onNavigate}
              />
            ))}
          </div>
        )}
      </div>

      {/* Reviews Received */}
      <div className="space-y-4 pt-6 border-t border-stone-200">
        <h2 className="text-lg font-bold text-stone-900">
          Community Reviews ({reviews.length})
        </h2>

        {reviews.length === 0 ? (
          <p className="text-xs text-stone-500 italic">No reviews recorded yet for this member.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {reviews.map(rev => (
              <div key={rev.reviewId} className="bg-white p-4 rounded-xl border border-stone-200 space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-stone-900">{rev.reviewerName}</h4>
                    <p className="text-[11px] text-stone-400">For {rev.equipmentName}</p>
                  </div>
                  <div className="flex items-center gap-0.5">
                    {[1, 2, 3, 4, 5].map(s => (
                      <Star key={s} className={`w-3 h-3 ${s <= rev.rating ? 'text-amber-500 fill-amber-500' : 'text-stone-300'}`} />
                    ))}
                  </div>
                </div>
                <p className="text-xs text-stone-600 leading-relaxed">{rev.comment}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
