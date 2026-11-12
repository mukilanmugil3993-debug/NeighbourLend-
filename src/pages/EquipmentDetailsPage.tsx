import React, { useState, useEffect } from 'react';
import { api } from '../services/api.ts';
import { Equipment, Review } from '../types/index.ts';
import { useAuth } from '../context/AuthContext.tsx';
import { ImageWithFallback } from '../components/common/ImageWithFallback.tsx';
import {
  Star,
  MapPin,
  Calendar,
  ShieldCheck,
  Heart,
  Bookmark,
  Bell,
  MessageSquare,
  AlertTriangle,
  CheckCircle2,
  Lock,
  ArrowLeft,
  Share2,
  Clock,
  Info,
  ChevronRight,
  CreditCard,
  QrCode
} from 'lucide-react';
import { PaymentModal } from '../components/payment/PaymentModal.tsx';

interface EquipmentDetailsPageProps {
  equipmentId: string;
  onNavigate: (path: string, params?: any) => void;
}

export const EquipmentDetailsPage: React.FC<EquipmentDetailsPageProps> = ({
  equipmentId,
  onNavigate
}) => {
  const { user } = useAuth();
  const [equipment, setEquipment] = useState<(Equipment & { reviews: Review[]; isWishlisted?: boolean; isFavourited?: boolean; ownerReviewsCount?: number }) | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  // Booking form state
  const todayStr = new Date().toISOString().split('T')[0];
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 2);
  const defaultEndStr = tomorrow.toISOString().split('T')[0];

  const [startDate, setStartDate] = useState(todayStr);
  const [endDate, setEndDate] = useState(defaultEndStr);
  const [borrowerNotes, setBorrowerNotes] = useState('');
  const [submittingBooking, setSubmittingBooking] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState<string | null>(null);
  const [createdBooking, setCreatedBooking] = useState<any | null>(null);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [bookingError, setBookingError] = useState<string | null>(null);

  // Wishlist and favourite states
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [wishlistAlert, setWishlistAlert] = useState(true);
  const [isFavourited, setIsFavourited] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // Report Modal
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [reportReason, setReportReason] = useState('Safety Concern');
  const [reportDesc, setReportDesc] = useState('');
  const [reportSent, setReportSent] = useState(false);

  useEffect(() => {
    async function loadItem() {
      setLoading(true);
      setError(null);
      try {
        const data = await api.getEquipmentDetails(equipmentId);
        setEquipment(data);
        setIsWishlisted(Boolean(data.isWishlisted));
        setIsFavourited(Boolean(data.isFavourited));
      } catch (err: any) {
        setError(err.message || 'Equipment listing could not be loaded.');
      } finally {
        setLoading(false);
      }
    }
    loadItem();
  }, [equipmentId]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="h-96 bg-stone-100 rounded-2xl animate-pulse" />
      </div>
    );
  }

  if (error || !equipment) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center space-y-4">
        <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center mx-auto">
          <AlertTriangle className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-bold text-stone-900">Listing Not Found</h2>
        <p className="text-sm text-stone-500">{error || 'This equipment may have been archived.'}</p>
        <button
          onClick={() => onNavigate('/explore')}
          className="px-4 py-2 bg-emerald-800 text-white rounded-lg text-xs font-semibold cursor-pointer"
        >
          Return to Marketplace
        </button>
      </div>
    );
  }

  // Calculate rental duration & cost breakdown
  const startD = new Date(startDate);
  const endD = new Date(endDate);
  const validDates = !isNaN(startD.getTime()) && !isNaN(endD.getTime()) && startD <= endD;
  const daysDiff = validDates
    ? Math.max(1, Math.round(Math.abs(endD.getTime() - startD.getTime()) / (1000 * 3600 * 24)) + 1)
    : 1;

  const dailyRate = equipment.isFree ? 0 : equipment.pricePerDay;
  const totalRentalFee = dailyRate * daysDiff;
  const depositHold = equipment.securityDeposit || 0;

  const isOwner = user && user.memberId === equipment.ownerId;

  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      onNavigate('/login');
      return;
    }
    if (isOwner) {
      setBookingError('You cannot borrow equipment that you own.');
      return;
    }

    setSubmittingBooking(true);
    setBookingError(null);

    try {
      const res = await api.createBooking({
        equipmentId: equipment.equipmentId,
        startDate,
        endDate,
        borrowerNotes
      });
      setCreatedBooking(res);
      setBookingSuccess(res.bookingId);
    } catch (err: any) {
      setBookingError(err.message || 'Unable to complete request.');
    } finally {
      setSubmittingBooking(false);
    }
  };

  const handleToggleWishlist = async () => {
    if (!user) {
      onNavigate('/login');
      return;
    }
    setActionLoading(true);
    try {
      const res = await api.toggleWishlist(equipment.equipmentId, wishlistAlert);
      setIsWishlisted(res.isWishlisted);
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleFavourite = async () => {
    if (!user) {
      onNavigate('/login');
      return;
    }
    setActionLoading(true);
    try {
      const res = await api.toggleFavourite(equipment.equipmentId);
      setIsFavourited(res.isFavourited);
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleStartMessage = async () => {
    if (!user) {
      onNavigate('/login');
      return;
    }
    try {
      const conv = await api.startConversation({
        participantId: equipment.ownerId,
        equipmentId: equipment.equipmentId,
        initialMessage: `Hi ${equipment.ownerName}, I am interested in borrowing your "${equipment.name}".`
      });
      onNavigate('/messages', { conversationId: conv.conversationId });
    } catch (err) {
      console.error(err);
    }
  };

  const handleReportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      onNavigate('/login');
      return;
    }
    try {
      await api.createReport({
        equipmentId: equipment.equipmentId,
        reportedUserId: equipment.ownerId,
        reason: reportReason,
        description: reportDesc
      });
      setReportSent(true);
    } catch (err) {
      console.error(err);
    }
  };

  const images = equipment.images && equipment.images.length > 0
    ? equipment.images
    : ['/src/assets/images/hero_community_equipment_1794441755197.jpg'];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Back button breadcrumb */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => onNavigate('/explore')}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-stone-600 hover:text-stone-900 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Marketplace</span>
        </button>

        <div className="flex items-center gap-2">
          {/* Wishlist button */}
          <button
            onClick={handleToggleWishlist}
            disabled={actionLoading}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors cursor-pointer ${
              isWishlisted
                ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                : 'bg-white text-stone-700 border-stone-200 hover:bg-stone-50'
            }`}
          >
            <Bookmark className={`w-3.5 h-3.5 ${isWishlisted ? 'fill-current' : ''}`} />
            <span>{isWishlisted ? 'In Wishlist' : 'Add to Wishlist'}</span>
          </button>

          {/* Favourite button */}
          <button
            onClick={handleToggleFavourite}
            disabled={actionLoading}
            className={`p-2 rounded-lg border transition-colors cursor-pointer ${
              isFavourited
                ? 'bg-rose-50 text-rose-600 border-rose-200'
                : 'bg-white text-stone-600 border-stone-200 hover:bg-stone-50'
            }`}
          >
            <Heart className={`w-4 h-4 ${isFavourited ? 'fill-current' : ''}`} />
          </button>
        </div>
      </div>

      {/* Main 2-Column Split: Gallery Left, Contiguous Borrow Module Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
        {/* Left Column: Photos & Details (7 cols) */}
        <div className="lg:col-span-7 space-y-8">
          {/* Gallery */}
          <div className="space-y-3">
            <div className="relative aspect-[4/3] rounded-2xl overflow-hidden bg-stone-100 border border-stone-200">
              <ImageWithFallback
                src={images[activeImageIndex]}
                alt={equipment.name}
                className="w-full h-full object-cover"
              />
              {equipment.availability !== 'Available' && (
                <div className="absolute top-4 left-4 px-3 py-1 bg-stone-900/85 backdrop-blur-md text-white text-xs font-semibold rounded-lg">
                  {equipment.availability === 'Reserved' ? 'Currently Borrowed' : 'Temporarily Paused'}
                </div>
              )}
            </div>

            {images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-1">
                {images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveImageIndex(idx)}
                    className={`relative w-20 h-16 rounded-lg overflow-hidden border-2 transition-all shrink-0 cursor-pointer ${
                      activeImageIndex === idx ? 'border-emerald-700 shadow-xs' : 'border-transparent opacity-70 hover:opacity-100'
                    }`}
                  >
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Specification & Descriptions */}
          <div className="space-y-6">
            <div>
              {/* Unboxed clean metadata (Zero-pill discipline) */}
              <div className="flex items-center gap-2 text-xs text-stone-500 uppercase tracking-wider mb-2 font-medium">
                <span>{equipment.categoryName}</span>
                <span aria-hidden="true">·</span>
                <span>{equipment.brand}</span>
                <span aria-hidden="true">·</span>
                <span>Model: {equipment.model}</span>
                <span aria-hidden="true">·</span>
                <span className="text-emerald-800 font-bold">{equipment.condition} Condition</span>
              </div>

              <h1 className="text-2xl sm:text-3xl font-extrabold text-stone-900 tracking-tight">
                {equipment.name}
              </h1>

              <div className="mt-2 flex items-center gap-4 text-xs text-stone-500">
                <div className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-stone-400" />
                  <span>{equipment.location}</span>
                </div>
                <span>·</span>
                <div className="flex items-center gap-1 text-stone-700 font-semibold">
                  <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                  <span className="tabular-nums">{equipment.ownerRating?.toFixed(1) || '5.0'}</span>
                  <span className="text-stone-400 font-normal">({equipment.ownerReviewsCount || 0} reviews)</span>
                </div>
              </div>
            </div>

            {/* Description Body */}
            <div className="space-y-2 border-t border-stone-200 pt-6">
              <h3 className="text-sm font-bold uppercase tracking-wider text-stone-700">About this Equipment</h3>
              <p className="text-sm text-stone-700 leading-relaxed whitespace-pre-line">
                {equipment.description}
              </p>
            </div>

            {/* Safety & Pickup Instructions */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-stone-200 pt-6">
              <div className="bg-stone-50 p-4 rounded-xl border border-stone-200 space-y-1.5">
                <div className="flex items-center gap-2 text-emerald-800 font-bold text-xs uppercase tracking-wide">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Pickup & Return Handover</span>
                </div>
                <p className="text-xs text-stone-600 leading-relaxed">
                  {equipment.pickupInstructions}
                </p>
              </div>

              <div className="bg-stone-50 p-4 rounded-xl border border-stone-200 space-y-1.5">
                <div className="flex items-center gap-2 text-stone-800 font-bold text-xs uppercase tracking-wide">
                  <ShieldCheck className="w-4 h-4 text-emerald-700" />
                  <span>Operation & Safety Rules</span>
                </div>
                <p className="text-xs text-stone-600 leading-relaxed">
                  {equipment.safetyInstructions}
                </p>
              </div>
            </div>

            {/* Owner Profile Card */}
            <div className="bg-white p-5 rounded-2xl border border-stone-200 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <img
                  src={equipment.ownerImage || 'https://images.unsplash.com/photo-1534528741775?auto=format&fit=crop&w=150&q=80'}
                  alt={equipment.ownerName}
                  className="w-12 h-12 rounded-full object-cover border border-emerald-700/30"
                  referrerPolicy="no-referrer"
                />
                <div>
                  <div className="flex items-center gap-1.5">
                    <h4 className="text-sm font-bold text-stone-900">{equipment.ownerName}</h4>
                    <span title="Verified Neighbour">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                    </span>
                  </div>
                  <p className="text-xs text-stone-500">{equipment.ownerLocation}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleStartMessage}
                  className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors cursor-pointer"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>Message Owner</span>
                </button>
                <button
                  type="button"
                  onClick={() => onNavigate(`/members/${equipment.ownerId}`)}
                  className="px-3 py-2 text-xs font-medium text-stone-600 hover:text-stone-900 transition-colors cursor-pointer"
                >
                  View Profile
                </button>
              </div>
            </div>

            {/* Community Reviews Section */}
            <div className="border-t border-stone-200 pt-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold uppercase tracking-wider text-stone-800">
                  Community Reviews ({equipment.reviews?.length || 0})
                </h3>
              </div>

              {equipment.reviews && equipment.reviews.length > 0 ? (
                <div className="space-y-3">
                  {equipment.reviews.map(rev => (
                    <div key={rev.reviewId} className="bg-white p-4 rounded-xl border border-stone-200 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-stone-900">{rev.reviewerName}</span>
                          <span className="text-[11px] text-stone-400">· Verified Borrower</span>
                        </div>
                        <div className="flex items-center gap-0.5">
                          {[1, 2, 3, 4, 5].map(star => (
                            <Star
                              key={star}
                              className={`w-3 h-3 ${star <= rev.rating ? 'text-amber-500 fill-amber-500' : 'text-stone-300'}`}
                            />
                          ))}
                        </div>
                      </div>
                      <p className="text-xs text-stone-600 leading-relaxed">{rev.comment}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-stone-500 italic">
                  No borrowing reviews recorded yet for this piece of equipment. Be the first neighbor to borrow!
                </p>
              )}
            </div>

            {/* Report listing trigger */}
            <div className="pt-2 text-right">
              <button
                onClick={() => setReportModalOpen(true)}
                className="text-[11px] text-stone-400 hover:text-stone-700 underline cursor-pointer"
              >
                Report this listing to moderators
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Contiguous Purchase / Borrow Module (5 cols sticky) */}
        <div className="lg:col-span-5 sticky top-24">
          <div className="bg-white rounded-2xl border border-stone-200 shadow-md p-6 space-y-5">
            {/* Header: Price or Free */}
            <div className="flex items-baseline justify-between border-b border-stone-100 pb-4">
              <div>
                {equipment.isFree ? (
                  <div>
                    <span className="text-2xl font-extrabold text-emerald-800">Free</span>
                    <span className="text-xs text-stone-500 ml-1.5 font-medium">Community Equipment Share</span>
                  </div>
                ) : (
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-extrabold text-stone-900 tabular-nums">
                      ${equipment.pricePerDay}
                    </span>
                    <span className="text-xs font-medium text-stone-500">/ day</span>
                  </div>
                )}
              </div>
              <div className="text-right">
                <span className={`text-xs font-semibold ${equipment.availability === 'Available' ? 'text-emerald-700' : 'text-amber-700'}`}>
                  {equipment.availability === 'Available' ? '● Ready for Borrowing' : '● Currently Reserved'}
                </span>
              </div>
            </div>

            {/* Booking Form */}
            {bookingSuccess ? (
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-5 text-center space-y-3">
                <CheckCircle2 className="w-10 h-10 text-emerald-700 mx-auto" />
                <h4 className="text-base font-bold text-emerald-950">Borrow Request Dispatched!</h4>
                <p className="text-xs text-emerald-800 leading-relaxed">
                  Booking ID: <span className="font-mono font-semibold">{bookingSuccess}</span>. The owner has been notified and will approve or coordinate collection with you.
                </p>
                <div className="pt-2 flex flex-col gap-2">
                  <button
                    type="button"
                    onClick={() => setPaymentModalOpen(true)}
                    className="w-full py-2.5 bg-emerald-800 text-white rounded-xl text-xs font-bold hover:bg-emerald-900 transition-colors cursor-pointer shadow-xs flex items-center justify-center gap-2"
                  >
                    <CreditCard className="w-4 h-4 text-lime-300" />
                    <span>Pay Online Now (UPI / Card)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => onNavigate('/dashboard', { tab: 'borrows' })}
                    className="w-full py-2 bg-white text-stone-700 border border-stone-200 rounded-xl text-xs font-semibold hover:bg-stone-50 transition-colors cursor-pointer"
                  >
                    View in My Borrow Requests
                  </button>
                  <button
                    type="button"
                    onClick={() => setBookingSuccess(null)}
                    className="text-xs text-emerald-800 font-medium hover:underline pt-1"
                  >
                    Make another request
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleBookingSubmit} className="space-y-4">
                {/* Date selection */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-stone-600">
                      Start Date
                    </label>
                    <input
                      type="date"
                      min={todayStr}
                      value={startDate}
                      onChange={e => setStartDate(e.target.value)}
                      className="w-full px-2.5 py-2 text-xs bg-stone-50 border border-stone-200 rounded-lg text-stone-800 font-medium focus:outline-none focus:border-emerald-600 tabular-nums"
                      required
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-stone-600">
                      End Date
                    </label>
                    <input
                      type="date"
                      min={startDate}
                      value={endDate}
                      onChange={e => setEndDate(e.target.value)}
                      className="w-full px-2.5 py-2 text-xs bg-stone-50 border border-stone-200 rounded-lg text-stone-800 font-medium focus:outline-none focus:border-emerald-600 tabular-nums"
                      required
                    />
                  </div>
                </div>

                {/* Borrower Notes */}
                <div className="space-y-1">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-stone-600">
                    Message to Owner (Optional)
                  </label>
                  <textarea
                    rows={2}
                    value={borrowerNotes}
                    onChange={e => setBorrowerNotes(e.target.value)}
                    placeholder="Briefly mention your project and preferred pickup time..."
                    className="w-full px-3 py-2 text-xs bg-stone-50 border border-stone-200 rounded-lg text-stone-800 focus:outline-none focus:border-emerald-600 resize-none"
                  />
                </div>

                {/* Pricing / Cost summary calculated on backend rules */}
                <div className="bg-stone-50 rounded-xl p-3.5 space-y-2 border border-stone-200 text-xs">
                  <div className="flex items-center justify-between text-stone-600">
                    <span>
                      {equipment.isFree ? 'Community Duration' : `$${equipment.pricePerDay} × ${daysDiff} day${daysDiff > 1 ? 's' : ''}`}
                    </span>
                    <span className="font-semibold text-stone-900 tabular-nums">
                      ${totalRentalFee}
                    </span>
                  </div>

                  {depositHold > 0 && (
                    <div className="flex items-center justify-between text-stone-600">
                      <span className="flex items-center gap-1">
                        <span>Refundable Security Deposit</span>
                        <span title="Held in escrow and released upon undamaged return">
                          <Info className="w-3 h-3 text-stone-400" />
                        </span>
                      </span>
                      <span className="font-semibold text-stone-900 tabular-nums">
                        ${depositHold}
                      </span>
                    </div>
                  )}

                  <div className="border-t border-stone-200 pt-2 flex items-center justify-between font-bold text-stone-900 text-sm">
                    <span>Total Estimate</span>
                    <span className="text-emerald-800 tabular-nums">
                      ${totalRentalFee + depositHold}
                    </span>
                  </div>

                  <p className="text-[10px] text-stone-500 pt-1 leading-tight">
                    * Direct community handover. Payment gateway integration is currently in preview (no card is billed until you coordinate with the owner).
                  </p>
                </div>

                {bookingError && (
                  <div className="p-3 bg-rose-50 text-rose-700 text-xs rounded-lg border border-rose-200">
                    {bookingError}
                  </div>
                )}

                {/* Submit Request Button */}
                {isOwner ? (
                  <div className="p-3 bg-stone-100 text-stone-600 text-xs text-center rounded-lg font-medium">
                    You are the owner of this equipment.
                  </div>
                ) : (
                  <button
                    type="submit"
                    disabled={submittingBooking || equipment.availability !== 'Available'}
                    className="w-full py-3 px-4 bg-emerald-800 hover:bg-emerald-900 disabled:bg-stone-300 disabled:cursor-not-allowed text-white text-xs font-bold rounded-xl transition-colors shadow-xs flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {submittingBooking ? (
                      <span>Submitting Request...</span>
                    ) : equipment.availability !== 'Available' ? (
                      <span>Equipment Currently Reserved</span>
                    ) : (
                      <>
                        <span>Submit Borrow Request</span>
                        <ChevronRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                )}
              </form>
            )}

            {/* Wishlist Feature Card (Explicitly requested by user) */}
            <div className="border-t border-stone-100 pt-4 space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Bookmark className="w-4 h-4 text-emerald-800" />
                  <span className="text-xs font-bold text-stone-800">
                    Wishlist & Availability Alerts
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleToggleWishlist}
                  disabled={actionLoading}
                  className={`text-xs font-semibold cursor-pointer ${
                    isWishlisted ? 'text-rose-600 hover:text-rose-700' : 'text-emerald-800 hover:underline'
                  }`}
                >
                  {isWishlisted ? 'Remove from Wishlist' : 'Add to Wishlist'}
                </button>
              </div>

              <p className="text-[11px] text-stone-500 leading-normal">
                Save this equipment to your personal Wishlist. When an item is marked returned or becomes available in your neighborhood, you will receive an automatic notification.
              </p>

              {isWishlisted && (
                <label className="flex items-center gap-2 text-xs text-stone-700 font-medium cursor-pointer pt-1">
                  <input
                    type="checkbox"
                    checked={wishlistAlert}
                    onChange={e => setWishlistAlert(e.target.checked)}
                    className="w-3.5 h-3.5 rounded text-emerald-700 accent-emerald-700"
                  />
                  <span>Send me a notification when this gear is free to borrow</span>
                </label>
              )}
            </div>

            {/* Safe Community Guarantee */}
            <div className="bg-emerald-50/60 rounded-xl p-3 border border-emerald-100 space-y-1 text-xs text-emerald-900">
              <div className="flex items-center gap-1.5 font-bold">
                <ShieldCheck className="w-4 h-4 text-emerald-700" />
                <span>NeighbourLend Protection</span>
              </div>
              <p className="text-[11px] text-emerald-800 leading-tight">
                All borrowers must show physical ID on pickup. Security deposits are returned in full after prompt return and inspection.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Payment Checkout Modal */}
      {paymentModalOpen && createdBooking && (
        <PaymentModal
          booking={{
            ...createdBooking,
            equipment
          }}
          onSuccess={(updated) => {
            setCreatedBooking(updated);
            setBookingSuccess(updated.bookingId);
          }}
          onClose={() => setPaymentModalOpen(false)}
        />
      )}
      {reportModalOpen && (
        <div className="fixed inset-0 z-50 bg-stone-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl">
            <h3 className="text-base font-bold text-stone-900">Report Equipment Listing</h3>
            {reportSent ? (
              <div className="space-y-3 text-center py-4">
                <CheckCircle2 className="w-10 h-10 text-emerald-700 mx-auto" />
                <p className="text-xs text-stone-600">
                  Thank you. Your report has been submitted to NeighbourLend administrators for review.
                </p>
                <button
                  onClick={() => { setReportModalOpen(false); setReportSent(false); }}
                  className="px-4 py-2 bg-stone-800 text-white rounded-lg text-xs font-semibold"
                >
                  Close
                </button>
              </div>
            ) : (
              <form onSubmit={handleReportSubmit} className="space-y-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-stone-700">Reason</label>
                  <select
                    value={reportReason}
                    onChange={e => setReportReason(e.target.value)}
                    className="w-full p-2 bg-stone-50 border border-stone-200 rounded-lg text-xs"
                  >
                    <option value="Safety Concern">Safety Concern / Defective Tool</option>
                    <option value="Inaccurate Information">Inaccurate Information or Specs</option>
                    <option value="Prohibited Item">Prohibited Item</option>
                    <option value="Unresponsive Owner">Unresponsive Owner</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-stone-700">Description</label>
                  <textarea
                    rows={3}
                    value={reportDesc}
                    onChange={e => setReportDesc(e.target.value)}
                    placeholder="Provide details about the issue..."
                    className="w-full p-2 bg-stone-50 border border-stone-200 rounded-lg text-xs resize-none"
                    required
                  />
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setReportModalOpen(false)}
                    className="px-3 py-1.5 text-xs text-stone-600 hover:text-stone-900 font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold"
                  >
                    Submit Report
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
