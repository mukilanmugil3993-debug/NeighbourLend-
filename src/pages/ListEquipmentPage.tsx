import React, { useState, useEffect } from 'react';
import { api } from '../services/api.ts';
import { Category, EquipmentCondition } from '../types/index.ts';
import { useAuth } from '../context/AuthContext.tsx';
import {
  PlusCircle,
  Image,
  DollarSign,
  Shield,
  MapPin,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  ArrowRight
} from 'lucide-react';

interface ListEquipmentPageProps {
  onNavigate: (path: string, params?: any) => void;
}

export const ListEquipmentPage: React.FC<ListEquipmentPageProps> = ({ onNavigate }) => {
  const { user } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [successId, setSuccessId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Form Fields
  const [name, setName] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [brand, setBrand] = useState('');
  const [model, setModel] = useState('');
  const [condition, setCondition] = useState<EquipmentCondition>('Excellent');
  const [description, setDescription] = useState('');
  const [isFree, setIsFree] = useState(false);
  const [pricePerDay, setPricePerDay] = useState('20');
  const [securityDeposit, setSecurityDeposit] = useState('50');
  const [location, setLocation] = useState(user?.location || '');
  const [pickupInstructions, setPickupInstructions] = useState('Available for pickup on weekdays after 5 PM or weekends anytime.');
  const [safetyInstructions, setSafetyInstructions] = useState('Always wear appropriate safety glasses and gloves when operating this tool.');
  const [imageUrl, setImageUrl] = useState('/src/assets/images/hero_community_equipment_1794441755197.jpg');

  // Quick preset sample photos for easy selection
  const samplePhotos = [
    { label: 'General / Tool Shed', url: '/src/assets/images/hero_community_equipment_1794441755197.jpg' },
    { label: 'Pressure Washer', url: '/src/assets/images/equip_pressure_washer_1794441755362.jpg' },
    { label: 'Cordless Drill Kit', url: '/src/assets/images/equip_cordless_drill_set_1794441755739.jpg' },
    { label: 'Electric Lawn Mower', url: '/src/assets/images/equip_lawn_mower_1794441756586.jpg' },
    { label: '4-Person Camping Tent', url: '/src/assets/images/equip_camping_tent_1794441756299.jpg' }
  ];

  useEffect(() => {
    api.getCategories().then(cats => {
      setCategories(cats);
      if (cats.length > 0) setCategoryId(cats[0].categoryId);
    }).catch(console.error);
  }, []);

  if (!user) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center space-y-4">
        <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-800 flex items-center justify-center mx-auto">
          <Shield className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-bold text-stone-900">Member Sign In Required</h2>
        <p className="text-xs text-stone-500">
          Only verified community members can list equipment on NeighbourLend.
        </p>
        <button
          onClick={() => onNavigate('/login')}
          className="px-5 py-2.5 bg-emerald-800 text-white rounded-xl text-xs font-semibold cursor-pointer shadow-xs"
        >
          Sign In or Register
        </button>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !categoryId || !description.trim() || !location.trim()) {
      setErrorMsg('Please complete all required fields.');
      return;
    }

    setSubmitting(true);
    setErrorMsg(null);

    try {
      const created = await api.createEquipment({
        name,
        categoryId,
        brand,
        model,
        condition,
        description,
        isFree,
        pricePerDay: isFree ? 0 : Number(pricePerDay) || 0,
        securityDeposit: Number(securityDeposit) || 0,
        location,
        pickupInstructions,
        safetyInstructions,
        images: [imageUrl]
      });

      setSuccessId(created.equipmentId);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to publish equipment listing.');
    } finally {
      setSubmitting(false);
    }
  };

  if (successId) {
    return (
      <div className="max-w-lg mx-auto px-4 py-16 text-center space-y-5">
        <div className="w-16 h-16 bg-emerald-50 text-emerald-700 rounded-full flex items-center justify-center mx-auto">
          <CheckCircle2 className="w-10 h-10" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-stone-900">Equipment Successfully Listed!</h2>
          <p className="text-xs text-stone-500 max-w-sm mx-auto leading-relaxed">
            Your listing is now live in the community marketplace. Neighbours searching in {location} can view details and submit borrow requests.
          </p>
        </div>
        <div className="flex justify-center gap-3 pt-2">
          <button
            onClick={() => onNavigate(`/equipment/${successId}`)}
            className="px-4 py-2 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl text-xs font-semibold cursor-pointer shadow-xs"
          >
            View Live Listing
          </button>
          <button
            onClick={() => onNavigate('/dashboard', { tab: 'listings' })}
            className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-xl text-xs font-semibold cursor-pointer"
          >
            Go to My Equipment
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10 space-y-8">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-stone-900 tracking-tight">
          List Equipment to Share or Rent
        </h1>
        <p className="text-xs sm:text-sm text-stone-500 mt-1">
          Publish your idle tools, machinery, or gear to earn supplemental income or share freely with local neighbors.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-stone-200 p-6 sm:p-8 space-y-6 shadow-xs">
        {errorMsg && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Basic Info */}
        <div className="space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-stone-500 border-b border-stone-100 pb-2">
            1. Equipment Overview
          </h3>

          <div className="space-y-1">
            <label className="text-xs font-bold text-stone-800">
              Listing Title *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. DeWalt 20V Cordless Hammer Drill Kit"
              className="w-full px-3 py-2 text-xs bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:border-emerald-600"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-bold text-stone-800">
                Category *
              </label>
              <select
                required
                value={categoryId}
                onChange={e => setCategoryId(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:border-emerald-600"
              >
                {categories.map(c => (
                  <option key={c.categoryId} value={c.categoryId}>{c.name}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-stone-800">Brand</label>
              <input
                type="text"
                value={brand}
                onChange={e => setBrand(e.target.value)}
                placeholder="e.g. Makita, EGO, Honda"
                className="w-full px-3 py-2 text-xs bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:border-emerald-600"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-stone-800">Model</label>
              <input
                type="text"
                value={model}
                onChange={e => setModel(e.target.value)}
                placeholder="e.g. XR Brushless"
                className="w-full px-3 py-2 text-xs bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:border-emerald-600"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-bold text-stone-800">Condition</label>
              <select
                value={condition}
                onChange={e => setCondition(e.target.value as any)}
                className="w-full px-3 py-2 text-xs bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:border-emerald-600"
              >
                <option value="Like New">Like New (flawless, barely used)</option>
                <option value="Excellent">Excellent (minor cosmetic wear)</option>
                <option value="Good">Good (fully functional, normal wear)</option>
                <option value="Fair">Fair (older but reliable)</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-stone-800">Location / Neighborhood *</label>
              <input
                type="text"
                required
                value={location}
                onChange={e => setLocation(e.target.value)}
                placeholder="e.g. Maplewood District"
                className="w-full px-3 py-2 text-xs bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:border-emerald-600"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-stone-800">Description *</label>
            <textarea
              required
              rows={4}
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Detail specifications, what accessories are included (bits, battery, chargers, fuel type), and maintenance condition..."
              className="w-full px-3 py-2 text-xs bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:border-emerald-600 resize-none"
            />
          </div>
        </div>

        {/* Pricing & Free Sharing */}
        <div className="space-y-4 pt-4 border-t border-stone-100">
          <h3 className="text-xs font-bold uppercase tracking-wider text-stone-500 pb-2">
            2. Lending Terms & Pricing
          </h3>

          <div className="p-3.5 bg-emerald-50 rounded-xl border border-emerald-200 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-emerald-900">Offer as Free Community Sharing</p>
              <p className="text-[11px] text-emerald-700">Lend to neighbours for $0/day to support zero-waste mutual aid.</p>
            </div>
            <input
              type="checkbox"
              checked={isFree}
              onChange={e => setIsFree(e.target.checked)}
              className="w-5 h-5 accent-emerald-700 cursor-pointer"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {!isFree && (
              <div className="space-y-1">
                <label className="text-xs font-bold text-stone-800">Price per Day ($ USD)</label>
                <input
                  type="number"
                  min="1"
                  max="1000"
                  value={pricePerDay}
                  onChange={e => setPricePerDay(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:border-emerald-600 tabular-nums"
                />
              </div>
            )}

            <div className="space-y-1">
              <label className="text-xs font-bold text-stone-800">Refundable Security Deposit ($ USD)</label>
              <input
                type="number"
                min="0"
                max="2000"
                value={securityDeposit}
                onChange={e => setSecurityDeposit(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:border-emerald-600 tabular-nums"
              />
              <p className="text-[10px] text-stone-500">Held in escrow to protect against damage or loss.</p>
            </div>
          </div>
        </div>

        {/* Photographs */}
        <div className="space-y-4 pt-4 border-t border-stone-100">
          <h3 className="text-xs font-bold uppercase tracking-wider text-stone-500 pb-2">
            3. Equipment Photograph
          </h3>

          <div className="space-y-2">
            <label className="text-xs font-bold text-stone-800">Select or Enter Photo URL</label>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {samplePhotos.map((p, idx) => (
                <button
                  type="button"
                  key={idx}
                  onClick={() => setImageUrl(p.url)}
                  className={`p-1.5 rounded-xl border text-left cursor-pointer transition-all ${
                    imageUrl === p.url ? 'border-emerald-700 bg-emerald-50 ring-1 ring-emerald-700' : 'border-stone-200 hover:border-stone-300'
                  }`}
                >
                  <img src={p.url} alt="" className="w-full h-14 object-cover rounded-lg mb-1" />
                  <p className="text-[10px] font-semibold text-stone-700 truncate">{p.label}</p>
                </button>
              ))}
            </div>

            <input
              type="text"
              value={imageUrl}
              onChange={e => setImageUrl(e.target.value)}
              placeholder="Or enter custom image URL (https://...)"
              className="w-full px-3 py-2 text-xs bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:border-emerald-600 mt-2"
            />
          </div>
        </div>

        {/* Instructions */}
        <div className="space-y-4 pt-4 border-t border-stone-100">
          <h3 className="text-xs font-bold uppercase tracking-wider text-stone-500 pb-2">
            4. Handover & Safety Guidelines
          </h3>

          <div className="space-y-1">
            <label className="text-xs font-bold text-stone-800">Pickup & Return Instructions</label>
            <input
              type="text"
              value={pickupInstructions}
              onChange={e => setPickupInstructions(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:border-emerald-600"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-stone-800">Safety & Operation Precautions</label>
            <input
              type="text"
              value={safetyInstructions}
              onChange={e => setSafetyInstructions(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:border-emerald-600"
            />
          </div>
        </div>

        {/* Submit */}
        <div className="pt-4 border-t border-stone-100 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={() => onNavigate('/dashboard')}
            className="px-4 py-2 text-xs font-semibold text-stone-600 hover:text-stone-900 cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="px-6 py-2.5 bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-bold rounded-xl transition-colors shadow-xs flex items-center gap-2 cursor-pointer"
          >
            {submitting ? 'Publishing...' : 'Publish Equipment Listing'}
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </form>
    </div>
  );
};
