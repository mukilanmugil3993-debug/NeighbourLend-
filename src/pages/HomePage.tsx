import React, { useState, useEffect } from 'react';
import { api } from '../services/api.ts';
import { Equipment, Category } from '../types/index.ts';
import { EquipmentCard } from '../components/equipment/EquipmentCard.tsx';
import { ImageWithFallback } from '../components/common/ImageWithFallback.tsx';
import {
  Search,
  MapPin,
  Tag,
  ShieldCheck,
  RefreshCw,
  Coins,
  Users,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  HeartHandshake,
  AlertCircle
} from 'lucide-react';

interface HomePageProps {
  onNavigate: (path: string, params?: any) => void;
}

export const HomePage: React.FC<HomePageProps> = ({ onNavigate }) => {
  const [featuredEquipment, setFeaturedEquipment] = useState<Equipment[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  // Search form state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [locationQuery, setLocationQuery] = useState('');

  useEffect(() => {
    async function loadData() {
      try {
        const [equipRes, catRes] = await Promise.all([
          api.getEquipmentList({ limit: 6, availability: 'Available' }),
          api.getCategories()
        ]);
        setFeaturedEquipment(equipRes.items);
        setCategories(catRes.slice(0, 6));
      } catch (err) {
        console.error('Failed to load homepage data:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onNavigate('/explore', {
      search: searchQuery,
      categoryId: selectedCategory,
      location: locationQuery
    });
  };

  return (
    <div className="space-y-16 lg:space-y-24">
      {/* Hero Section */}
      <section className="relative pt-6 pb-12 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Left Column: Mission & Search */}
            <div className="lg:col-span-7 space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-50 text-emerald-800 text-xs font-semibold rounded-full border border-emerald-200">
                <Sparkles className="w-3.5 h-3.5 text-lime-600" />
                <span>Verified Local Tool & Equipment Sharing</span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-stone-900 tracking-tight leading-[1.1] text-balance">
                Share More. <span className="text-emerald-800">Spend Less.</span> Build Community.
              </h1>

              <p className="text-base sm:text-lg text-stone-600 max-w-xl leading-relaxed">
                Borrow quality lawn mowers, pressure washers, power drills, and camping tents from neighbours right down your street. Safe, insured, and verified.
              </p>

              {/* Integrated Search Box */}
              <form
                onSubmit={handleSearchSubmit}
                className="bg-white p-3 sm:p-4 rounded-2xl shadow-lg border border-stone-200 max-w-2xl space-y-3 sm:space-y-0 sm:grid sm:grid-cols-12 sm:gap-2"
              >
                <div className="sm:col-span-5 relative">
                  <Search className="w-4 h-4 text-stone-400 absolute left-3 top-3.5" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder="Search equipment, brand, tools..."
                    className="w-full pl-9 pr-3 py-2 text-sm text-stone-800 bg-stone-50 rounded-xl border border-stone-200 focus:outline-none focus:border-emerald-600"
                  />
                </div>

                <div className="sm:col-span-4 relative">
                  <MapPin className="w-4 h-4 text-stone-400 absolute left-3 top-3.5" />
                  <input
                    type="text"
                    value={locationQuery}
                    onChange={e => setLocationQuery(e.target.value)}
                    placeholder="Neighborhood or town..."
                    className="w-full pl-9 pr-3 py-2 text-sm text-stone-800 bg-stone-50 rounded-xl border border-stone-200 focus:outline-none focus:border-emerald-600"
                  />
                </div>

                <div className="sm:col-span-3">
                  <button
                    type="submit"
                    className="w-full py-2 px-4 bg-emerald-800 hover:bg-emerald-900 text-white text-sm font-semibold rounded-xl transition-colors shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <span>Find Gear</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </form>

              {/* Quick search tags */}
              <div className="flex items-center gap-2 text-xs text-stone-500 pt-1 flex-wrap">
                <span className="font-medium text-stone-700">Popular:</span>
                <button
                  type="button"
                  onClick={() => onNavigate('/explore', { search: 'mower' })}
                  className="hover:text-emerald-800 cursor-pointer"
                >
                  Electric Mowers
                </button>
                <span>·</span>
                <button
                  type="button"
                  onClick={() => onNavigate('/explore', { search: 'pressure washer' })}
                  className="hover:text-emerald-800 cursor-pointer"
                >
                  Pressure Washers
                </button>
                <span>·</span>
                <button
                  type="button"
                  onClick={() => onNavigate('/explore', { search: 'drill' })}
                  className="hover:text-emerald-800 cursor-pointer"
                >
                  Hammer Drills
                </button>
                <span>·</span>
                <button
                  type="button"
                  onClick={() => onNavigate('/explore', { isFree: 'true' })}
                  className="text-emerald-800 font-semibold hover:underline cursor-pointer"
                >
                  Free Community Gear
                </button>
              </div>
            </div>

            {/* Right Column: Hero Visual Asset */}
            <div className="lg:col-span-5 relative">
              <div className="relative rounded-2xl overflow-hidden border border-stone-200 shadow-xl aspect-[4/3] lg:aspect-[5/4] bg-stone-100">
                <ImageWithFallback
                  src="/src/assets/images/hero_community_equipment_1794441755197.jpg"
                  alt="Neighbourhood tool lending library"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-stone-900/60 via-transparent to-transparent flex items-end p-6">
                  <div className="text-white space-y-1">
                    <p className="text-xs uppercase tracking-wider font-semibold text-lime-300">
                      Neighborhood Tool Sharing Hub
                    </p>
                    <p className="text-sm font-medium">
                      Over 850 active tools in Oakridge & Maplewood districts.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4-Column KPI Trust Strip */}
      <section className="border-y border-stone-200 bg-white py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <div className="space-y-1">
              <p className="text-3xl font-extrabold text-emerald-800 tabular-nums">1,420+</p>
              <p className="text-xs font-medium text-stone-500 uppercase tracking-wide">Community Borrows</p>
            </div>
            <div className="space-y-1">
              <p className="text-3xl font-extrabold text-stone-900 tabular-nums">$38,500+</p>
              <p className="text-xs font-medium text-stone-500 uppercase tracking-wide">Household Savings</p>
            </div>
            <div className="space-y-1">
              <p className="text-3xl font-extrabold text-emerald-800 tabular-nums">100%</p>
              <p className="text-xs font-medium text-stone-500 uppercase tracking-wide">ID Verified Neighbors</p>
            </div>
            <div className="space-y-1">
              <p className="text-3xl font-extrabold text-stone-900 tabular-nums">14 Tons</p>
              <p className="text-xs font-medium text-stone-500 uppercase tracking-wide">E-Waste & CO2 Diverted</p>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Equipment Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
          <div>
            <h2 className="text-2xl font-bold text-stone-900 tracking-tight">
              Featured Equipment Available Near You
            </h2>
            <p className="text-sm text-stone-500 mt-1">
              Inspected tools, outdoor gear, and machinery ready for local pickup.
            </p>
          </div>
          <button
            onClick={() => onNavigate('/explore')}
            className="text-xs font-semibold text-emerald-800 hover:text-emerald-900 flex items-center gap-1 group cursor-pointer shrink-0"
          >
            <span>Browse All Equipment</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map(n => (
              <div key={n} className="h-72 bg-stone-100 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredEquipment.map(eq => (
              <EquipmentCard
                key={eq.equipmentId}
                equipment={eq}
                onNavigate={onNavigate}
              />
            ))}
          </div>
        )}
      </section>

      {/* Explore by Category */}
      <section className="bg-stone-100/70 py-16 border-y border-stone-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-xl mx-auto mb-10 space-y-2">
            <h2 className="text-2xl sm:text-3xl font-bold text-stone-900">
              Browse by Equipment Category
            </h2>
            <p className="text-sm text-stone-600">
              From weekend garden landscaping to heavy moving and camping expeditions.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {categories.map(cat => (
              <button
                key={cat.categoryId}
                onClick={() => onNavigate('/explore', { categoryId: cat.categoryId })}
                className="bg-white p-4 rounded-xl border border-stone-200 hover:border-emerald-700 hover:shadow-sm transition-all group text-left cursor-pointer flex flex-col justify-between h-36"
              >
                <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-800 flex items-center justify-center font-bold group-hover:bg-emerald-800 group-hover:text-white transition-colors">
                  <Tag className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-stone-900 group-hover:text-emerald-800 line-clamp-1">
                    {cat.name}
                  </h3>
                  <p className="text-[11px] text-stone-500 tabular-nums mt-0.5">
                    {cat.itemCount || 0} listings
                  </p>
                </div>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* How NeighbourLend Works (3 Clear Steps) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-xl mx-auto mb-12 space-y-2">
          <h2 className="text-2xl sm:text-3xl font-bold text-stone-900">
            How Community Lending Works
          </h2>
          <p className="text-sm text-stone-600">
            A simple, secure cycle designed for mutual neighborly trust.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white p-6 rounded-xl border border-stone-200 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-800 flex items-center justify-center font-bold text-sm">
              01
            </div>
            <h3 className="text-base font-semibold text-stone-900">Discover Local Equipment</h3>
            <p className="text-xs text-stone-600 leading-relaxed">
              Find tools, machinery, and camping gear near you. Check live calendar dates, condition photos, and reviews from fellow neighbors.
            </p>
          </div>

          <div className="bg-white p-6 rounded-xl border border-stone-200 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-800 flex items-center justify-center font-bold text-sm">
              02
            </div>
            <h3 className="text-base font-semibold text-stone-900">Request & Owner Approval</h3>
            <p className="text-xs text-stone-600 leading-relaxed">
              Pick your rental dates. The owner reviews the request, verifies availability, and coordinates collection instructions in secure messaging.
            </p>
          </div>

          <div className="bg-white p-6 rounded-xl border border-stone-200 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-800 flex items-center justify-center font-bold text-sm">
              03
            </div>
            <h3 className="text-base font-semibold text-stone-900">Collect, Use & Return</h3>
            <p className="text-xs text-stone-600 leading-relaxed">
              Meet your neighbor, inspect the equipment together, complete your project, and return it cleaned. Leave a review to build community trust!
            </p>
          </div>
        </div>
      </section>

      {/* Community Lending Call To Action Banner */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-forest-900 text-white rounded-3xl p-8 sm:p-12 relative overflow-hidden">
          <div className="max-w-2xl space-y-5 relative z-10">
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
              Have tools sitting idle in your garage?
            </h2>
            <p className="text-stone-300 text-sm sm:text-base leading-relaxed">
              The average power drill is used for only 13 minutes in its entire lifespan. Put your tools to work, earn extra household income or share freely with neighbors, while building local resilience.
            </p>
            <div className="flex flex-wrap gap-3 pt-2">
              <button
                onClick={() => onNavigate('/list-equipment')}
                className="px-6 py-3 bg-lime-accent text-forest-900 font-bold text-xs sm:text-sm rounded-xl hover:bg-lime-glow transition-colors cursor-pointer shadow-md"
              >
                List Your Equipment Now
              </button>
              <button
                onClick={() => onNavigate('/safety')}
                className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white font-medium text-xs sm:text-sm rounded-xl transition-colors cursor-pointer"
              >
                Read Safety & Deposit Protections
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
