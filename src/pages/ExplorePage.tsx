import React, { useState, useEffect } from 'react';
import { api } from '../services/api.ts';
import { Equipment, Category } from '../types/index.ts';
import { EquipmentCard } from '../components/equipment/EquipmentCard.tsx';
import {
  Search,
  Filter,
  SlidersHorizontal,
  RotateCcw,
  Tag,
  MapPin,
  Check,
  ChevronDown
} from 'lucide-react';

interface ExplorePageProps {
  initialFilters?: {
    search?: string;
    categoryId?: string;
    location?: string;
    isFree?: string;
  };
  onNavigate: (path: string, params?: any) => void;
}

export const ExplorePage: React.FC<ExplorePageProps> = ({ initialFilters = {}, onNavigate }) => {
  const [equipmentList, setEquipmentList] = useState<Equipment[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);

  // Filters
  const [search, setSearch] = useState(initialFilters.search || '');
  const [categoryId, setCategoryId] = useState(initialFilters.categoryId || 'all');
  const [location, setLocation] = useState(initialFilters.location || '');
  const [isFree, setIsFree] = useState(initialFilters.isFree === 'true');
  const [condition, setCondition] = useState('all');
  const [availability, setAvailability] = useState('all');
  const [maxPrice, setMaxPrice] = useState<number>(100);
  const [sort, setSort] = useState<'newest' | 'price-asc' | 'price-desc' | 'rating'>('newest');
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  // Load categories
  useEffect(() => {
    api.getCategories().then(setCategories).catch(console.error);
  }, []);

  // Fetch equipment whenever filters change
  useEffect(() => {
    async function fetchGear() {
      setLoading(true);
      try {
        const res = await api.getEquipmentList({
          search: search || undefined,
          categoryId: categoryId !== 'all' ? categoryId : undefined,
          location: location || undefined,
          isFree: isFree ? 'true' : undefined,
          condition: condition !== 'all' ? condition : undefined,
          availability: availability !== 'all' ? availability : undefined,
          maxPrice: !isFree && maxPrice < 100 ? maxPrice : undefined,
          sort
        });
        setEquipmentList(res.items);
        setTotalCount(res.total);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchGear();
  }, [search, categoryId, location, isFree, condition, availability, maxPrice, sort]);

  const resetFilters = () => {
    setSearch('');
    setCategoryId('all');
    setLocation('');
    setIsFree(false);
    setCondition('all');
    setAvailability('all');
    setMaxPrice(100);
    setSort('newest');
  };

  const hasActiveFilters = Boolean(
    search ||
    categoryId !== 'all' ||
    location ||
    isFree ||
    condition !== 'all' ||
    availability !== 'all' ||
    maxPrice < 100
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Title & Filter Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-200 pb-5">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-stone-900 tracking-tight">
            Explore Community Equipment
          </h1>
          <p className="text-xs sm:text-sm text-stone-500 mt-1">
            Browse available tools, garden machinery, and outdoor gear in your area ({totalCount} items).
          </p>
        </div>

        {/* Sort & Mobile filter button */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setMobileFilterOpen(!mobileFilterOpen)}
            className="md:hidden flex items-center gap-1.5 px-3 py-2 text-xs font-semibold bg-white border border-stone-300 rounded-lg text-stone-700"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            Filters
          </button>

          <div className="flex items-center gap-2 text-xs">
            <span className="text-stone-500 font-medium hidden sm:inline">Sort by:</span>
            <select
              value={sort}
              onChange={e => setSort(e.target.value as any)}
              className="bg-white border border-stone-300 rounded-lg px-2.5 py-1.5 text-xs text-stone-800 font-medium focus:outline-none focus:border-emerald-600"
            >
              <option value="newest">Newest First</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
              <option value="rating">Top Rated Lenders</option>
            </select>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-8 items-start">
        {/* Sidebar Filters */}
        <aside
          className={`space-y-6 md:block ${
            mobileFilterOpen ? 'block fixed inset-0 z-50 bg-white p-6 overflow-y-auto' : 'hidden'
          }`}
        >
          {mobileFilterOpen && (
            <div className="flex items-center justify-between pb-4 border-b border-stone-200">
              <h3 className="font-bold text-stone-900">Filters</h3>
              <button
                onClick={() => setMobileFilterOpen(false)}
                className="text-xs font-semibold text-emerald-800"
              >
                Done
              </button>
            </div>
          )}

          {/* Search bar */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-stone-600">
              Keyword
            </label>
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-3" />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search tools, model..."
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:border-emerald-600"
              />
            </div>
          </div>

          {/* Category Filter */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-stone-600">
              Category
            </label>
            <select
              value={categoryId}
              onChange={e => setCategoryId(e.target.value)}
              className="w-full bg-stone-50 border border-stone-200 rounded-lg px-2.5 py-2 text-xs text-stone-800 font-medium focus:outline-none focus:border-emerald-600"
            >
              <option value="all">All Categories</option>
              {categories.map(c => (
                <option key={c.categoryId} value={c.categoryId}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Location filter */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-stone-600">
              Location / Area
            </label>
            <div className="relative">
              <MapPin className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-3" />
              <input
                type="text"
                value={location}
                onChange={e => setLocation(e.target.value)}
                placeholder="e.g. Maplewood, Cedar..."
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:border-emerald-600"
              />
            </div>
          </div>

          {/* Free sharing filter */}
          <div className="pt-2 border-t border-stone-200">
            <label className="flex items-center gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={isFree}
                onChange={e => setIsFree(e.target.checked)}
                className="w-4 h-4 rounded text-emerald-700 accent-emerald-700"
              />
              <span className="text-xs font-semibold text-stone-800">
                Free Community Sharing Only ($0)
              </span>
            </label>
          </div>

          {/* Price Range Slider (if not free) */}
          {!isFree && (
            <div className="space-y-2 pt-2 border-t border-stone-200">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold uppercase tracking-wider text-stone-600">
                  Max Daily Price
                </span>
                <span className="font-bold text-stone-900 tabular-nums">
                  {maxPrice >= 100 ? 'Any' : `$${maxPrice}/day`}
                </span>
              </div>
              <input
                type="range"
                min="5"
                max="100"
                step="5"
                value={maxPrice}
                onChange={e => setMaxPrice(Number(e.target.value))}
                className="w-full accent-emerald-700"
              />
            </div>
          )}

          {/* Condition Filter */}
          <div className="space-y-1.5 pt-2 border-t border-stone-200">
            <label className="text-xs font-semibold uppercase tracking-wider text-stone-600">
              Equipment Condition
            </label>
            <select
              value={condition}
              onChange={e => setCondition(e.target.value)}
              className="w-full bg-stone-50 border border-stone-200 rounded-lg px-2.5 py-2 text-xs text-stone-800 font-medium focus:outline-none focus:border-emerald-600"
            >
              <option value="all">Any Condition</option>
              <option value="Like New">Like New</option>
              <option value="Excellent">Excellent</option>
              <option value="Good">Good</option>
              <option value="Fair">Fair</option>
            </select>
          </div>

          {/* Availability Status */}
          <div className="space-y-1.5 pt-2 border-t border-stone-200">
            <label className="text-xs font-semibold uppercase tracking-wider text-stone-600">
              Availability
            </label>
            <select
              value={availability}
              onChange={e => setAvailability(e.target.value)}
              className="w-full bg-stone-50 border border-stone-200 rounded-lg px-2.5 py-2 text-xs text-stone-800 font-medium focus:outline-none focus:border-emerald-600"
            >
              <option value="all">All Items</option>
              <option value="Available">Available Now</option>
              <option value="Reserved">Currently Borrowed</option>
            </select>
          </div>

          {/* Reset Filters CTA */}
          {hasActiveFilters && (
            <div className="pt-2">
              <button
                type="button"
                onClick={resetFilters}
                className="w-full py-2 px-3 text-xs font-semibold text-stone-600 hover:text-stone-900 bg-stone-100 hover:bg-stone-200 rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Reset All Filters
              </button>
            </div>
          )}
        </aside>

        {/* Equipment Grid Content */}
        <main className="md:col-span-3">
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map(n => (
                <div key={n} className="h-72 bg-stone-100 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : equipmentList.length === 0 ? (
            <div className="bg-white rounded-2xl border border-stone-200 p-12 text-center space-y-4">
              <div className="w-12 h-12 rounded-full bg-stone-100 text-stone-400 flex items-center justify-center mx-auto">
                <Search className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-stone-900">No equipment found</h3>
                <p className="text-xs text-stone-500 max-w-sm mx-auto">
                  Try adjusting your search terms, expanding your location, or removing price filters.
                </p>
              </div>
              <button
                onClick={resetFilters}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-emerald-800 hover:bg-emerald-900 rounded-lg transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Clear All Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {equipmentList.map(eq => (
                <EquipmentCard
                  key={eq.equipmentId}
                  equipment={eq}
                  onNavigate={onNavigate}
                />
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
};
