import React from 'react';
import { Leaf, HeartHandshake, MapPin, Users, Sparkles, ArrowRight, ShieldCheck } from 'lucide-react';
import { ImageWithFallback } from '../components/common/ImageWithFallback.tsx';

interface CommunityPageProps {
  onNavigate: (path: string, params?: any) => void;
}

export const CommunityPage: React.FC<CommunityPageProps> = ({ onNavigate }) => {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-16">
      {/* Hero */}
      <div className="text-center max-w-2xl mx-auto space-y-4">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-800 text-xs font-semibold rounded-full border border-emerald-200">
          <Leaf className="w-3.5 h-3.5 text-lime-600" />
          <span>Local Mutual Aid & Sustainability</span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-extrabold text-stone-900 tracking-tight">
          Community Sharing at NeighbourLend
        </h1>
        <p className="text-sm sm:text-base text-stone-600 leading-relaxed">
          When we share high-utility equipment locally, we unlock thousands of dollars in household savings, reduce consumer overproduction, and create genuine neighborhood bonds.
        </p>
      </div>

      {/* 3 Pillar Impact Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-stone-200 space-y-3 shadow-xs">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-800 flex items-center justify-center">
            <Leaf className="w-5 h-5 text-emerald-700" />
          </div>
          <h3 className="text-base font-bold text-stone-900">Zero-Waste & Circular Economy</h3>
          <p className="text-xs text-stone-600 leading-relaxed">
            Manufacturing a single cordless lawn mower generates over 75kg of CO2. By sharing one mower across 5 families, we slash neighborhood embodied carbon by 80%.
          </p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-stone-200 space-y-3 shadow-xs">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-800 flex items-center justify-center">
            <HeartHandshake className="w-5 h-5 text-emerald-700" />
          </div>
          <h3 className="text-base font-bold text-stone-900">Free Equipment Sharing Tier</h3>
          <p className="text-xs text-stone-600 leading-relaxed">
            Many members list dollies, hedge trimmers, ladders, and camping accessories for $0/day. Mutual aid keeps community projects affordable for all neighbors.
          </p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-stone-200 space-y-3 shadow-xs">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-800 flex items-center justify-center">
            <ShieldCheck className="w-5 h-5 text-emerald-700" />
          </div>
          <h3 className="text-base font-bold text-stone-900">Trust & Identity Verification</h3>
          <p className="text-xs text-stone-600 leading-relaxed">
            Every lender and borrower completes identity verification. Refundable security deposits and condition checks protect equipment at every handover.
          </p>
        </div>
      </div>

      {/* Community Tool Library Spotlight */}
      <div className="bg-stone-900 text-white rounded-3xl p-8 sm:p-12 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        <div className="lg:col-span-7 space-y-4">
          <span className="text-xs font-bold uppercase tracking-wider text-lime-accent">Local Hub Spotlight</span>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Oakridge Green Neighborhood Tool Shed
          </h2>
          <p className="text-stone-300 text-xs sm:text-sm leading-relaxed">
            Coordinated by Trustee Eleanor Vance, the Oakridge Green shed holds communal appliance dollies, pressure washers, and garden aerators available for weekend loans.
          </p>
          <div className="pt-2 flex gap-3">
            <button
              onClick={() => onNavigate('/explore', { isFree: 'true' })}
              className="px-5 py-2.5 bg-lime-accent text-stone-900 font-bold rounded-xl text-xs hover:bg-lime-glow cursor-pointer"
            >
              Browse Free Community Items
            </button>
            <button
              onClick={() => onNavigate('/list-equipment')}
              className="px-5 py-2.5 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-xl text-xs cursor-pointer"
            >
              Contribute a Tool
            </button>
          </div>
        </div>

        <div className="lg:col-span-5 aspect-[4/3] rounded-2xl overflow-hidden border border-stone-800">
          <ImageWithFallback
            src="/src/assets/images/hero_community_equipment_1794441755197.jpg"
            alt="Oakridge Green Community Shed"
            className="w-full h-full object-cover"
          />
        </div>
      </div>
    </div>
  );
};
