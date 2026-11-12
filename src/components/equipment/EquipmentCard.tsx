import React, { useState } from 'react';
import { Equipment } from '../../types/index.ts';
import { ImageWithFallback } from '../common/ImageWithFallback.tsx';
import { Heart, Bookmark, Star, MapPin, CheckCircle2 } from 'lucide-react';
import { api } from '../../services/api.ts';
import { useAuth } from '../../context/AuthContext.tsx';

interface EquipmentCardProps {
  equipment: Equipment;
  onNavigate: (path: string, params?: any) => void;
  isFavourited?: boolean;
  isWishlisted?: boolean;
  onWishlistChange?: () => void;
}

export const EquipmentCard: React.FC<EquipmentCardProps> = ({
  equipment,
  onNavigate,
  isFavourited: initialFav = false,
  isWishlisted: initialWish = false,
  onWishlistChange
}) => {
  const { user } = useAuth();
  const [favourited, setFavourited] = useState(initialFav);
  const [wishlisted, setWishlisted] = useState(initialWish);
  const [loadingAction, setLoadingAction] = useState(false);

  const handleToggleFav = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) {
      onNavigate('/login');
      return;
    }
    setLoadingAction(true);
    try {
      const res = await api.toggleFavourite(equipment.equipmentId);
      setFavourited(res.isFavourited);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingAction(false);
    }
  };

  const handleToggleWish = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) {
      onNavigate('/login');
      return;
    }
    setLoadingAction(true);
    try {
      const res = await api.toggleWishlist(equipment.equipmentId);
      setWishlisted(res.isWishlisted);
      if (onWishlistChange) onWishlistChange();
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingAction(false);
    }
  };

  const mainImage = equipment.images && equipment.images[0]
    ? equipment.images[0]
    : '/src/assets/images/hero_community_equipment_1794441755197.jpg';

  const isFree = equipment.isFree || equipment.pricePerDay === 0;

  return (
    <div
      onClick={() => onNavigate(`/equipment/${equipment.equipmentId}`)}
      className="group relative bg-white rounded-xl border border-stone-200 overflow-hidden hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 cursor-pointer flex flex-col h-full"
    >
      {/* Visual media container */}
      <div className="relative aspect-[4/3] bg-stone-100 overflow-hidden">
        <ImageWithFallback
          src={mainImage}
          alt={equipment.name}
          className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-300"
        />

        {/* Action icons (Zero-pill discipline: quiet floating action buttons with purpose) */}
        <div className="absolute top-2.5 right-2.5 flex items-center gap-1.5 z-10">
          <button
            onClick={handleToggleWish}
            title={wishlisted ? 'Remove from Wishlist' : 'Add to Wishlist & Alerts'}
            disabled={loadingAction}
            className={`p-2 rounded-lg backdrop-blur-md transition-colors cursor-pointer ${
              wishlisted
                ? 'bg-emerald-800 text-lime-accent shadow-xs'
                : 'bg-white/85 text-stone-700 hover:bg-white hover:text-stone-900 shadow-xs'
            }`}
          >
            <Bookmark className={`w-3.5 h-3.5 ${wishlisted ? 'fill-current' : ''}`} />
          </button>

          <button
            onClick={handleToggleFav}
            title={favourited ? 'Remove from Favourites' : 'Save to Favourites'}
            disabled={loadingAction}
            className={`p-2 rounded-lg backdrop-blur-md transition-colors cursor-pointer ${
              favourited
                ? 'bg-white text-rose-600 shadow-xs'
                : 'bg-white/85 text-stone-700 hover:bg-white hover:text-stone-900 shadow-xs'
            }`}
          >
            <Heart className={`w-3.5 h-3.5 ${favourited ? 'fill-current text-rose-500' : ''}`} />
          </button>
        </div>

        {/* Quiet availability flag if not Available */}
        {equipment.availability !== 'Available' && (
          <div className="absolute bottom-2.5 left-2.5 px-2 py-0.5 text-[11px] font-semibold bg-stone-900/80 backdrop-blur-md text-white rounded">
            {equipment.availability === 'Reserved' ? 'Currently Borrowed' : 'Temporarily Paused'}
          </div>
        )}
      </div>

      {/* Card Content: Zero-pill clean text hierarchy */}
      <div className="p-4 flex flex-col flex-1 justify-between">
        <div>
          {/* Metadata: Category & Brand separated cleanly */}
          <div className="flex items-center gap-1.5 text-xs text-stone-500 uppercase tracking-wider mb-1 font-medium">
            <span>{equipment.brand || 'Tool'}</span>
            <span aria-hidden="true">·</span>
            <span className="truncate">{equipment.condition}</span>
          </div>

          {/* Title */}
          <h3 className="text-sm font-semibold text-stone-900 line-clamp-1 group-hover:text-emerald-800 transition-colors">
            {equipment.name}
          </h3>

          {/* Location & Owner */}
          <div className="mt-2 flex items-center justify-between text-xs text-stone-500">
            <div className="flex items-center gap-1 truncate max-w-[170px]">
              <MapPin className="w-3.5 h-3.5 shrink-0 text-stone-400" />
              <span className="truncate">{equipment.location}</span>
            </div>
            {equipment.ownerRating && (
              <div className="flex items-center gap-0.5 text-stone-700 font-medium shrink-0">
                <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                <span className="tabular-nums">{equipment.ownerRating.toFixed(1)}</span>
              </div>
            )}
          </div>
        </div>

        {/* Pricing / Handover baseline */}
        <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between">
          <div>
            {isFree ? (
              <div className="flex items-baseline gap-1">
                <span className="text-sm font-bold text-emerald-800">Free</span>
                <span className="text-[11px] text-stone-500">Community Share</span>
              </div>
            ) : (
              <div className="flex items-baseline gap-1">
                <span className="text-base font-bold text-stone-900 tabular-nums">
                  ${equipment.pricePerDay}
                </span>
                <span className="text-xs text-stone-500">/ day</span>
              </div>
            )}
            {equipment.securityDeposit > 0 && (
              <p className="text-[10px] text-stone-500 tabular-nums">
                ${equipment.securityDeposit} refundable deposit
              </p>
            )}
          </div>

          <span className="text-xs font-semibold text-emerald-800 group-hover:underline">
            View Details →
          </span>
        </div>
      </div>
    </div>
  );
};
