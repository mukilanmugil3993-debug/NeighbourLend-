import React, { useState, useEffect } from 'react';
import { api } from '../services/api.ts';
import { BookingRequest, Equipment, UserStats, Review } from '../types/index.ts';
import { useAuth } from '../context/AuthContext.tsx';
import { ImageWithFallback } from '../components/common/ImageWithFallback.tsx';
import {
  LayoutDashboard,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Wrench,
  Bookmark,
  Heart,
  Bell,
  Star,
  MapPin,
  Calendar,
  DollarSign,
  PlusCircle,
  MessageSquare,
  ShieldCheck,
  Eye,
  Trash2,
  RefreshCw,
  SlidersHorizontal,
  ChevronRight,
  CreditCard,
  QrCode,
  Receipt,
  FileText
} from 'lucide-react';
import { PaymentModal } from '../components/payment/PaymentModal.tsx';
import { ReceiptModal } from '../components/payment/ReceiptModal.tsx';

interface MemberDashboardPageProps {
  initialTab?: string;
  onNavigate: (path: string, params?: any) => void;
}

export const MemberDashboardPage: React.FC<MemberDashboardPageProps> = ({
  initialTab = 'overview',
  onNavigate
}) => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState(initialTab);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [borrowBookings, setBorrowBookings] = useState<BookingRequest[]>([]);
  const [lendBookings, setLendBookings] = useState<BookingRequest[]>([]);
  const [myListings, setMyListings] = useState<Equipment[]>([]);
  const [wishlistItems, setWishlistItems] = useState<any[]>([]);
  const [favourites, setFavourites] = useState<Equipment[]>([]);
  const [loading, setLoading] = useState(true);

  // Review modal
  const [reviewModalBooking, setReviewModalBooking] = useState<BookingRequest | null>(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  // Payment & Receipt modals
  const [paymentModalBooking, setPaymentModalBooking] = useState<BookingRequest | null>(null);
  const [selectedReceipt, setSelectedReceipt] = useState<any | null>(null);
  const [refundingDepositId, setRefundingDepositId] = useState<string | null>(null);

  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const handleViewReceipt = async (bookingId: string) => {
    setActionError(null);
    try {
      const receipt = await api.getReceipt(bookingId);
      setSelectedReceipt(receipt);
    } catch (err: any) {
      setActionError(err.message || 'Failed to fetch payment receipt.');
    }
  };

  const handleRefundDeposit = async (bookingId: string) => {
    if (!confirm('Confirm refund of the security deposit back to the borrower?')) return;
    setRefundingDepositId(bookingId);
    setActionError(null);
    try {
      const res = await api.refundDeposit(bookingId);
      setActionSuccess(`Deposit of $${res.refundedAmount} refunded successfully (Ref: ${res.refundRef}).`);
      await loadDashboardData();
    } catch (err: any) {
      setActionError(err.message || 'Failed to refund security deposit.');
    } finally {
      setRefundingDepositId(null);
    }
  };

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  const loadDashboardData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [statsRes, borrowsRes, lendsRes, listingsRes, wishRes, favRes] = await Promise.all([
        api.getUserStats(),
        api.getBookings('borrower'),
        api.getBookings('lender'),
        api.getEquipmentList({ ownerId: user.memberId }),
        api.getWishlist(),
        api.getFavourites()
      ]);
      setStats(statsRes);
      setBorrowBookings(borrowsRes);
      setLendBookings(lendsRes);
      setMyListings(listingsRes.items);
      setWishlistItems(wishRes);
      setFavourites(favRes);
    } catch (err) {
      console.error('Failed to load dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, [user]);

  if (!user) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center space-y-4">
        <h2 className="text-xl font-bold text-stone-900">Sign in to view your dashboard</h2>
        <p className="text-xs text-stone-500">Access your equipment bookings, listings, and wishlist.</p>
        <button
          onClick={() => onNavigate('/login')}
          className="px-5 py-2.5 bg-emerald-800 text-white rounded-xl text-xs font-semibold cursor-pointer"
        >
          Sign In
        </button>
      </div>
    );
  }

  // Handle Owner or Admin actions on a booking
  const handleBookingStatusChange = async (bookingId: string, status: string) => {
    setActionError(null);
    setActionSuccess(null);
    try {
      await api.updateBookingStatus(bookingId, status);
      setActionSuccess(`Booking updated to ${status}.`);
      await loadDashboardData();
    } catch (err: any) {
      setActionError(err.message || 'Action could not be completed.');
    }
  };

  // Toggle equipment listing paused / available
  const handleToggleListingStatus = async (eq: Equipment) => {
    try {
      const newAvailability = eq.availability === 'Available' ? 'Paused' : 'Available';
      await api.updateEquipment(eq.equipmentId, { availability: newAvailability });
      await loadDashboardData();
    } catch (err: any) {
      setActionError(err.message || 'Failed to update equipment availability.');
    }
  };

  // Delete listing
  const handleDeleteListing = async (equipmentId: string) => {
    if (!confirm('Are you sure you want to remove this equipment listing?')) return;
    try {
      await api.deleteEquipment(equipmentId);
      await loadDashboardData();
    } catch (err: any) {
      setActionError(err.message || 'Failed to delete listing.');
    }
  };

  // Toggle wishlist alert notification
  const handleToggleWishAlert = async (equipmentId: string, currentVal: boolean) => {
    try {
      await api.updateWishlistAlert(equipmentId, !currentVal);
      await loadDashboardData();
    } catch (err) {
      console.error(err);
    }
  };

  // Remove from wishlist
  const handleRemoveWishlist = async (equipmentId: string) => {
    try {
      await api.toggleWishlist(equipmentId);
      await loadDashboardData();
    } catch (err) {
      console.error(err);
    }
  };

  // Submit review
  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewModalBooking) return;
    setSubmittingReview(true);
    setActionError(null);
    try {
      await api.createReview({
        bookingId: reviewModalBooking.bookingId,
        rating: reviewRating,
        comment: reviewComment
      });
      setReviewModalBooking(null);
      setReviewComment('');
      setActionSuccess('Thank you! Your verified community review has been submitted.');
      await loadDashboardData();
    } catch (err: any) {
      setActionError(err.message || 'Failed to submit review.');
    } finally {
      setSubmittingReview(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Pending':
        return <span className="text-[11px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">Pending Approval</span>;
      case 'Approved':
        return <span className="text-[11px] font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">Approved</span>;
      case 'Active':
        return <span className="text-[11px] font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">Active Handover</span>;
      case 'Returned':
        return <span className="text-[11px] font-semibold text-stone-700 bg-stone-100 px-2 py-0.5 rounded border border-stone-200">Returned & Completed</span>;
      case 'Rejected':
        return <span className="text-[11px] font-semibold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">Declined</span>;
      case 'Cancelled':
        return <span className="text-[11px] font-semibold text-stone-500 bg-stone-50 px-2 py-0.5 rounded">Cancelled</span>;
      default:
        return <span className="text-[11px] text-stone-600">{status}</span>;
    }
  };

  const getPaymentBadge = (booking: BookingRequest) => {
    if (booking.equipment?.isFree || booking.totalPrice === 0) {
      return (
        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
          Community Free Share
        </span>
      );
    }
    const payStatus = booking.paymentStatus || 'Pending';
    switch (payStatus) {
      case 'Held in Escrow':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
            <ShieldCheck className="w-3 h-3 text-emerald-700" />
            Paid · Held in Escrow
          </span>
        );
      case 'Settled':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-stone-700 bg-stone-100 px-2 py-0.5 rounded border border-stone-200">
            <CheckCircle2 className="w-3 h-3 text-stone-600" />
            Settled & Refunded
          </span>
        );
      case 'Pending':
      default:
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
            <CreditCard className="w-3 h-3 text-amber-700" />
            Payment Pending
          </span>
        );
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Top Welcome Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-200 pb-5">
        <div className="flex items-center gap-3">
          <img
            src={user.profileImage || 'https://images.unsplash.com/photo-1534528741775?auto=format&fit=crop&w=150&q=80'}
            alt=""
            className="w-12 h-12 rounded-full object-cover border border-emerald-700/30"
          />
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-bold text-stone-900">{user.fullName}</h1>
              <span className="text-[11px] font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                Verified Neighbor
              </span>
            </div>
            <p className="text-xs text-stone-500">{user.location} · Member since {new Date(user.createdAt).getFullYear()}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onNavigate('/list-equipment')}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-emerald-800 hover:bg-emerald-900 rounded-xl transition-colors shadow-xs cursor-pointer"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>List Equipment</span>
          </button>
          <button
            onClick={() => onNavigate('/profile/edit')}
            className="px-3.5 py-2 text-xs font-medium text-stone-700 bg-white border border-stone-300 hover:bg-stone-50 rounded-xl transition-colors cursor-pointer"
          >
            Edit Profile
          </button>
        </div>
      </div>

      {actionError && (
        <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center justify-between">
          <span>{actionError}</span>
          <button onClick={() => setActionError(null)} className="text-rose-500 font-bold ml-2">✕</button>
        </div>
      )}

      {actionSuccess && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center justify-between">
          <span>{actionSuccess}</span>
          <button onClick={() => setActionSuccess(null)} className="text-emerald-600 font-bold ml-2">✕</button>
        </div>
      )}

      {/* Navigation Tabs (Functional segmented tabs) */}
      <div className="flex items-center gap-1.5 border-b border-stone-200 overflow-x-auto pb-1 text-xs font-semibold">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-3 py-2 rounded-lg cursor-pointer whitespace-nowrap transition-colors ${
            activeTab === 'overview' ? 'bg-emerald-800 text-white shadow-xs' : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
          }`}
        >
          Overview
        </button>
        <button
          onClick={() => setActiveTab('borrows')}
          className={`px-3 py-2 rounded-lg cursor-pointer whitespace-nowrap transition-colors flex items-center gap-1.5 ${
            activeTab === 'borrows' ? 'bg-emerald-800 text-white shadow-xs' : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
          }`}
        >
          <span>My Borrow Requests</span>
          {stats?.pendingBorrowRequests ? (
            <span className="w-4 h-4 rounded-full bg-amber-400 text-stone-900 text-[10px] flex items-center justify-center font-bold">
              {stats.pendingBorrowRequests}
            </span>
          ) : null}
        </button>
        <button
          onClick={() => setActiveTab('lends')}
          className={`px-3 py-2 rounded-lg cursor-pointer whitespace-nowrap transition-colors flex items-center gap-1.5 ${
            activeTab === 'lends' ? 'bg-emerald-800 text-white shadow-xs' : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
          }`}
        >
          <span>My Lending Requests</span>
          {stats?.pendingLendRequests ? (
            <span className="w-4 h-4 rounded-full bg-lime-400 text-stone-900 text-[10px] flex items-center justify-center font-bold">
              {stats.pendingLendRequests}
            </span>
          ) : null}
        </button>
        <button
          onClick={() => setActiveTab('listings')}
          className={`px-3 py-2 rounded-lg cursor-pointer whitespace-nowrap transition-colors ${
            activeTab === 'listings' ? 'bg-emerald-800 text-white shadow-xs' : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
          }`}
        >
          My Equipment ({myListings.length})
        </button>
        <button
          onClick={() => setActiveTab('wishlist')}
          className={`px-3 py-2 rounded-lg cursor-pointer whitespace-nowrap transition-colors flex items-center gap-1.5 ${
            activeTab === 'wishlist' ? 'bg-emerald-800 text-white shadow-xs' : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
          }`}
        >
          <Bookmark className="w-3.5 h-3.5" />
          <span>Wishlist & Alerts ({wishlistItems.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('favourites')}
          className={`px-3 py-2 rounded-lg cursor-pointer whitespace-nowrap transition-colors flex items-center gap-1.5 ${
            activeTab === 'favourites' ? 'bg-emerald-800 text-white shadow-xs' : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
          }`}
        >
          <Heart className="w-3.5 h-3.5" />
          <span>Favourites ({favourites.length})</span>
        </button>
      </div>

      {/* TAB CONTENT */}

      {/* 1. OVERVIEW TAB */}
      {activeTab === 'overview' && (
        <div className="space-y-8">
          {/* Real stats strip */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-stone-200 space-y-1">
              <p className="text-xs font-semibold uppercase tracking-wider text-stone-500">Active Borrowing</p>
              <p className="text-2xl font-extrabold text-stone-900 tabular-nums">{stats?.activeBorrowings || 0}</p>
              <p className="text-[11px] text-stone-400">Equipment in your custody</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-stone-200 space-y-1">
              <p className="text-xs font-semibold uppercase tracking-wider text-stone-500">Active Lending</p>
              <p className="text-2xl font-extrabold text-emerald-800 tabular-nums">{stats?.activeLendings || 0}</p>
              <p className="text-[11px] text-stone-400">Tools currently with neighbours</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-stone-200 space-y-1">
              <p className="text-xs font-semibold uppercase tracking-wider text-stone-500">Estimated Savings</p>
              <p className="text-2xl font-extrabold text-stone-900 tabular-nums">${stats?.totalSavedDollars || 0}</p>
              <p className="text-[11px] text-stone-400">Saved by borrowing vs buying</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-stone-200 space-y-1">
              <p className="text-xs font-semibold uppercase tracking-wider text-stone-500">Community Earnings</p>
              <p className="text-2xl font-extrabold text-emerald-800 tabular-nums">${stats?.totalEarnedDollars || 0}</p>
              <p className="text-[11px] text-stone-400">Earned from equipment rentals</p>
            </div>
          </div>

          {/* Pending Action Alerts */}
          {(stats?.pendingLendRequests || 0) > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-200 text-amber-900 flex items-center justify-center font-bold">
                  !
                </div>
                <div>
                  <h4 className="text-sm font-bold text-amber-950">
                    You have {stats?.pendingLendRequests} pending lending request{stats?.pendingLendRequests === 1 ? '' : 's'} awaiting your approval!
                  </h4>
                  <p className="text-xs text-amber-800">
                    Neighbours are waiting to confirm their project dates. Please accept or decline.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setActiveTab('lends')}
                className="px-4 py-2 bg-amber-800 hover:bg-amber-900 text-white text-xs font-bold rounded-xl cursor-pointer"
              >
                Review Requests
              </button>
            </div>
          )}

          {/* Quick summary grids */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Recent Borrow Requests */}
            <div className="bg-white rounded-2xl border border-stone-200 p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-stone-900">Recent Equipment Borrows</h3>
                <button
                  onClick={() => setActiveTab('borrows')}
                  className="text-xs text-emerald-800 font-semibold hover:underline"
                >
                  View All
                </button>
              </div>

              {borrowBookings.length === 0 ? (
                <p className="text-xs text-stone-500 italic py-4 text-center">No borrowing requests yet.</p>
              ) : (
                <div className="space-y-3">
                  {borrowBookings.slice(0, 3).map(b => (
                    <div key={b.bookingId} className="flex items-center justify-between p-3 bg-stone-50 rounded-xl border border-stone-100">
                      <div>
                        <h4 className="text-xs font-bold text-stone-900">{b.equipment?.name || 'Equipment'}</h4>
                        <p className="text-[11px] text-stone-500 tabular-nums">{b.startDate} to {b.endDate} ({b.totalDays} days)</p>
                      </div>
                      <div className="text-right">
                        {getStatusBadge(b.status)}
                        <p className="text-[11px] font-bold text-stone-800 tabular-nums mt-1">${b.totalPrice}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* My Equipment Quick List */}
            <div className="bg-white rounded-2xl border border-stone-200 p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-stone-900">My Equipment Inventory</h3>
                <button
                  onClick={() => setActiveTab('listings')}
                  className="text-xs text-emerald-800 font-semibold hover:underline"
                >
                  Manage ({myListings.length})
                </button>
              </div>

              {myListings.length === 0 ? (
                <div className="text-center py-6 space-y-2">
                  <p className="text-xs text-stone-500">You haven't listed any equipment yet.</p>
                  <button
                    onClick={() => onNavigate('/list-equipment')}
                    className="px-3 py-1.5 bg-emerald-800 text-white text-xs font-semibold rounded-lg"
                  >
                    List Your First Item
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {myListings.slice(0, 3).map(item => (
                    <div key={item.equipmentId} className="flex items-center justify-between p-3 bg-stone-50 rounded-xl border border-stone-100">
                      <div className="flex items-center gap-2.5">
                        <img
                          src={item.images[0] || '/src/assets/images/hero_community_equipment_1794441755197.jpg'}
                          alt=""
                          className="w-10 h-10 rounded-lg object-cover"
                        />
                        <div>
                          <h4 className="text-xs font-bold text-stone-900 line-clamp-1">{item.name}</h4>
                          <span className={`text-[10px] font-medium ${item.availability === 'Available' ? 'text-emerald-700' : 'text-amber-700'}`}>
                            {item.availability}
                          </span>
                        </div>
                      </div>
                      <span className="text-xs font-bold text-stone-900 tabular-nums">
                        {item.isFree ? 'Free' : `$${item.pricePerDay}/d`}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 2. MY BORROW REQUESTS TAB */}
      {activeTab === 'borrows' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-stone-900">My Equipment Borrow Requests</h2>
            <button
              onClick={() => onNavigate('/explore')}
              className="text-xs font-semibold text-emerald-800 hover:underline"
            >
              + Find More Gear
            </button>
          </div>

          {borrowBookings.length === 0 ? (
            <div className="bg-white p-12 text-center rounded-2xl border border-stone-200 space-y-3">
              <Wrench className="w-10 h-10 text-stone-300 mx-auto" />
              <h3 className="text-sm font-bold text-stone-900">No borrowing requests found</h3>
              <p className="text-xs text-stone-500">Need tools for an upcoming project? Browse our community marketplace.</p>
              <button
                onClick={() => onNavigate('/explore')}
                className="px-4 py-2 bg-emerald-800 text-white rounded-xl text-xs font-semibold"
              >
                Explore Equipment
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {borrowBookings.map(b => (
                <div key={b.bookingId} className="bg-white p-5 rounded-2xl border border-stone-200 space-y-4 shadow-xs">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-100 pb-3">
                    <div className="flex items-center gap-3">
                      <img
                        src={b.equipment?.images?.[0] || '/src/assets/images/hero_community_equipment_1794441755197.jpg'}
                        alt=""
                        className="w-12 h-12 rounded-xl object-cover shrink-0"
                      />
                      <div>
                        <h4 className="text-sm font-bold text-stone-900">{b.equipment?.name || 'Equipment'}</h4>
                        <div className="flex items-center gap-2 text-xs text-stone-500 mt-0.5">
                          <span>Owner: {b.owner?.fullName || 'Neighbour'}</span>
                          <span>·</span>
                          <span className="tabular-nums">{b.startDate} to {b.endDate}</span>
                          <span>·</span>
                          <span>{b.totalDays} day{b.totalDays > 1 ? 's' : ''}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right space-y-1">
                        <div className="flex items-center justify-end gap-1.5">
                          {getStatusBadge(b.status)}
                          {getPaymentBadge(b)}
                        </div>
                        <p className="text-xs font-bold text-stone-900 tabular-nums">
                          Total: ${b.totalPrice}
                          {b.securityDeposit > 0 && (
                            <span className="text-[10px] text-stone-500 font-normal ml-1">
                              (+${b.securityDeposit} deposit)
                            </span>
                          )}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-stone-600">
                    <div>
                      <p><span className="font-semibold text-stone-700">Pickup Location:</span> {b.equipment?.location}</p>
                      {b.paymentDetails && (
                        <p className="text-[11px] text-emerald-800 font-medium mt-0.5">
                          Paid via {b.paymentDetails.method === 'UPI' ? `UPI (${b.paymentDetails.upiId})` : `Card (•••• ${b.paymentDetails.cardLast4})`} · Ref: {b.paymentDetails.transactionId}
                        </p>
                      )}
                      {b.borrowerNotes && (
                        <p className="text-stone-500 italic mt-0.5">" {b.borrowerNotes} "</p>
                      )}
                    </div>

                    {/* Actions for Borrower */}
                    <div className="flex flex-wrap items-center gap-2">
                      {/* Online Payment Button (UPI / Card) */}
                      {!b.equipment?.isFree && b.totalPrice > 0 && (b.paymentStatus === 'Pending' || !b.paymentStatus) && b.status !== 'Cancelled' && b.status !== 'Rejected' && (
                        <button
                          onClick={() => setPaymentModalBooking(b)}
                          className="px-3 py-1.5 bg-emerald-800 hover:bg-emerald-900 text-white rounded-lg text-xs font-bold cursor-pointer inline-flex items-center gap-1.5 shadow-xs"
                        >
                          <CreditCard className="w-3.5 h-3.5" />
                          <span>Pay Online (UPI / Card)</span>
                        </button>
                      )}

                      {/* View Receipt Button */}
                      {(b.paymentStatus === 'Held in Escrow' || b.paymentStatus === 'Settled' || b.paymentDetails) && (
                        <button
                          onClick={() => handleViewReceipt(b.bookingId)}
                          className="px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-lg text-xs font-semibold cursor-pointer inline-flex items-center gap-1.5"
                        >
                          <Receipt className="w-3.5 h-3.5 text-stone-600" />
                          <span>View Tax Invoice</span>
                        </button>
                      )}

                      <button
                        onClick={() => onNavigate('/messages')}
                        className="px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-lg font-medium cursor-pointer"
                      >
                        Message Owner
                      </button>

                      {b.status === 'Pending' && (
                        <button
                          onClick={() => handleBookingStatusChange(b.bookingId, 'Cancelled')}
                          className="px-3 py-1.5 bg-rose-50 text-rose-700 hover:bg-rose-100 rounded-lg font-medium cursor-pointer"
                        >
                          Cancel Request
                        </button>
                      )}

                      {b.status === 'Approved' && (
                        <button
                          onClick={() => handleBookingStatusChange(b.bookingId, 'Active')}
                          className="px-3 py-1.5 bg-emerald-800 text-white rounded-lg font-semibold hover:bg-emerald-900 cursor-pointer"
                        >
                          Confirm Handover Collected
                        </button>
                      )}

                      {b.status === 'Returned' && !b.hasReview && (
                        <button
                          onClick={() => { setReviewModalBooking(b); setReviewRating(5); setReviewComment(''); }}
                          className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-lg font-semibold cursor-pointer flex items-center gap-1"
                        >
                          <Star className="w-3.5 h-3.5 fill-white" />
                          <span>Leave Review</span>
                        </button>
                      )}

                      {b.status === 'Returned' && b.hasReview && (
                        <span className="text-[11px] font-medium text-emerald-800 flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Reviewed
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 3. MY LENDING REQUESTS TAB (Owner Approval) */}
      {activeTab === 'lends' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-stone-900">Incoming Lending Requests</h2>
              <p className="text-xs text-stone-500">Approve or coordinate equipment sharing with neighbours.</p>
            </div>
          </div>

          {lendBookings.length === 0 ? (
            <div className="bg-white p-12 text-center rounded-2xl border border-stone-200 space-y-2">
              <Clock className="w-10 h-10 text-stone-300 mx-auto" />
              <h3 className="text-sm font-bold text-stone-900">No lending requests</h3>
              <p className="text-xs text-stone-500">When neighbors request your tools, they will appear here for your approval.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {lendBookings.map(b => (
                <div key={b.bookingId} className="bg-white p-5 rounded-2xl border border-stone-200 space-y-4 shadow-xs">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-100 pb-3">
                    <div className="flex items-center gap-3">
                      <img
                        src={b.borrower?.profileImage || 'https://images.unsplash.com/photo-1534528741775?auto=format&fit=crop&w=150&q=80'}
                        alt=""
                        className="w-12 h-12 rounded-full object-cover shrink-0 border border-emerald-600/30"
                      />
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-bold text-stone-900">{b.borrower?.fullName || 'Neighbour'}</h4>
                          <span className="text-[10px] bg-emerald-50 text-emerald-800 font-semibold px-2 py-0.5 rounded">
                            Verified
                          </span>
                        </div>
                        <p className="text-xs text-stone-500">
                          Wants to borrow: <span className="font-semibold text-stone-800">{b.equipment?.name}</span>
                        </p>
                        <p className="text-[11px] text-stone-500 tabular-nums">
                          {b.startDate} to {b.endDate} ({b.totalDays} day{b.totalDays > 1 ? 's' : ''}) · Fee: ${b.totalPrice} + ${b.securityDeposit} deposit
                        </p>
                      </div>
                    </div>

                    <div className="text-right space-y-1">
                      <div className="flex items-center justify-end gap-1.5">
                        {getStatusBadge(b.status)}
                        {getPaymentBadge(b)}
                      </div>
                      <p className="text-xs font-bold text-stone-900 tabular-nums">
                        Fee: ${b.totalPrice} {b.securityDeposit > 0 && `(+$${b.securityDeposit} deposit)`}
                      </p>
                    </div>
                  </div>

                  {b.paymentDetails && (
                    <div className="bg-emerald-50/50 p-2.5 rounded-xl border border-emerald-100 flex flex-wrap items-center justify-between gap-2 text-xs text-stone-700">
                      <div>
                        <span className="font-semibold text-emerald-950">Payment Escrow:</span>{' '}
                        <span>
                          ${b.paymentDetails.totalPaid} paid via {b.paymentDetails.method.toUpperCase()}
                          {b.paymentDetails.depositAmount > 0 && ` (includes $${b.paymentDetails.depositAmount} deposit)`}
                        </span>
                        {b.paymentDetails.depositRefundedAt && (
                          <span className="text-emerald-700 font-bold ml-2">✓ Deposit Refunded</span>
                        )}
                      </div>
                      <button
                        onClick={() => handleViewReceipt(b.bookingId)}
                        className="text-[11px] font-semibold text-emerald-800 hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <Receipt className="w-3.5 h-3.5" />
                        <span>View Statement</span>
                      </button>
                    </div>
                  )}

                  {b.borrowerNotes && (
                    <div className="bg-stone-50 p-3 rounded-xl border border-stone-100 text-xs text-stone-700">
                      <span className="font-semibold text-stone-800">Borrower note:</span> "{b.borrowerNotes}"
                    </div>
                  )}

                  {/* Owner Action Buttons with Strict Validation */}
                  <div className="flex flex-wrap items-center justify-end gap-2 pt-2">
                    {/* Security Deposit Release Button */}
                    {b.status === 'Returned' && b.securityDeposit > 0 && b.paymentDetails && !b.paymentDetails.depositRefundedAt && (
                      <button
                        onClick={() => handleRefundDeposit(b.bookingId)}
                        disabled={refundingDepositId === b.bookingId}
                        className="px-3.5 py-1.5 bg-emerald-800 hover:bg-emerald-900 disabled:opacity-50 text-white rounded-lg text-xs font-bold cursor-pointer inline-flex items-center gap-1.5 shadow-xs"
                      >
                        <ShieldCheck className="w-3.5 h-3.5" />
                        <span>{refundingDepositId === b.bookingId ? 'Refunding...' : `Release Deposit Refund ($${b.securityDeposit})`}</span>
                      </button>
                    )}

                    <button
                      onClick={() => onNavigate('/messages')}
                      className="px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-lg text-xs font-semibold cursor-pointer"
                    >
                      Message Borrower
                    </button>

                    {b.status === 'Pending' && (
                      <>
                        <button
                          onClick={() => handleBookingStatusChange(b.bookingId, 'Rejected')}
                          className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg text-xs font-semibold cursor-pointer"
                        >
                          Decline
                        </button>
                        <button
                          onClick={() => handleBookingStatusChange(b.bookingId, 'Approved')}
                          className="px-4 py-1.5 bg-emerald-800 hover:bg-emerald-900 text-white rounded-lg text-xs font-bold cursor-pointer shadow-xs"
                        >
                          Approve Request
                        </button>
                      </>
                    )}

                    {b.status === 'Approved' && (
                      <button
                        onClick={() => handleBookingStatusChange(b.bookingId, 'Active')}
                        className="px-4 py-1.5 bg-blue-700 hover:bg-blue-800 text-white rounded-lg text-xs font-bold cursor-pointer"
                      >
                        Confirm Equipment Handed Over
                      </button>
                    )}

                    {b.status === 'Active' && (
                      <button
                        onClick={() => handleBookingStatusChange(b.bookingId, 'Returned')}
                        className="px-4 py-1.5 bg-emerald-800 hover:bg-emerald-900 text-white rounded-lg text-xs font-bold cursor-pointer"
                      >
                        Confirm Returned & Inspected
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 4. MY EQUIPMENT LISTINGS TAB */}
      {activeTab === 'listings' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-stone-900">My Listed Equipment</h2>
              <p className="text-xs text-stone-500">Manage availability, edit details, or pause items.</p>
            </div>
            <button
              onClick={() => onNavigate('/list-equipment')}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-emerald-800 hover:bg-emerald-900 rounded-xl transition-colors cursor-pointer"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              Add Equipment
            </button>
          </div>

          {myListings.length === 0 ? (
            <div className="bg-white p-12 text-center rounded-2xl border border-stone-200 space-y-3">
              <Wrench className="w-10 h-10 text-stone-300 mx-auto" />
              <h3 className="text-sm font-bold text-stone-900">No equipment listed</h3>
              <p className="text-xs text-stone-500">List items from your shed or garage to share with neighbors.</p>
              <button
                onClick={() => onNavigate('/list-equipment')}
                className="px-4 py-2 bg-emerald-800 text-white rounded-xl text-xs font-semibold"
              >
                List Your First Item
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {myListings.map(eq => (
                <div key={eq.equipmentId} className="bg-white p-4 rounded-2xl border border-stone-200 flex gap-4 justify-between">
                  <div className="flex gap-3">
                    <img
                      src={eq.images[0] || '/src/assets/images/hero_community_equipment_1794441755197.jpg'}
                      alt=""
                      className="w-20 h-20 rounded-xl object-cover shrink-0"
                    />
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-stone-500">
                        {eq.condition} · {eq.brand}
                      </span>
                      <h4 className="text-xs font-bold text-stone-900 line-clamp-1">{eq.name}</h4>
                      <p className="text-xs font-bold text-emerald-800 tabular-nums">
                        {eq.isFree ? 'Free Sharing' : `$${eq.pricePerDay} / day`}
                      </p>
                      <span className={`inline-block text-[10px] font-semibold px-2 py-0.5 rounded ${
                        eq.availability === 'Available' ? 'bg-emerald-50 text-emerald-800' : 'bg-amber-50 text-amber-800'
                      }`}>
                        {eq.availability}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col justify-between items-end">
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => onNavigate(`/equipment/${eq.equipmentId}`)}
                        title="View Live"
                        className="p-1.5 text-stone-600 hover:text-stone-900 bg-stone-50 rounded-lg hover:bg-stone-100"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteListing(eq.equipmentId)}
                        title="Delete listing"
                        className="p-1.5 text-rose-600 hover:text-rose-700 bg-rose-50 rounded-lg hover:bg-rose-100"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <button
                      onClick={() => handleToggleListingStatus(eq)}
                      className="text-[11px] font-semibold text-stone-700 hover:text-stone-900 underline"
                    >
                      {eq.availability === 'Available' ? 'Pause Listing' : 'Resume Available'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 5. WISHLIST & AVAILABILITY ALERTS TAB (User-Requested Feature) */}
      {activeTab === 'wishlist' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-stone-900">Wishlist & Availability Alerts</h2>
              <p className="text-xs text-stone-500">
                Equipment you have saved for upcoming projects. When a wishlisted item becomes available or is returned, you will receive an automatic notification.
              </p>
            </div>
          </div>

          {wishlistItems.length === 0 ? (
            <div className="bg-white p-12 text-center rounded-2xl border border-stone-200 space-y-3">
              <Bookmark className="w-10 h-10 text-stone-300 mx-auto" />
              <h3 className="text-sm font-bold text-stone-900">Your wishlist is currently empty</h3>
              <p className="text-xs text-stone-500 max-w-sm mx-auto">
                Explore the marketplace and click "Add to Wishlist" on equipment you'd like to borrow in the future.
              </p>
              <button
                onClick={() => onNavigate('/explore')}
                className="px-4 py-2 bg-emerald-800 text-white rounded-xl text-xs font-semibold"
              >
                Explore Marketplace
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {wishlistItems.map((item: any) => {
                const eq = item.equipment;
                const isAvailable = eq.availability === 'Available';

                return (
                  <div key={item.wishlistId} className="bg-white p-5 rounded-2xl border border-stone-200 space-y-4 shadow-xs">
                    <div className="flex gap-4">
                      <img
                        src={eq.images?.[0] || '/src/assets/images/hero_community_equipment_1794441755197.jpg'}
                        alt=""
                        className="w-20 h-20 rounded-xl object-cover shrink-0"
                      />
                      <div className="space-y-1 flex-1">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-stone-500">
                            {eq.brand} · {eq.condition}
                          </span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                            isAvailable ? 'bg-emerald-100 text-emerald-900' : 'bg-amber-100 text-amber-900'
                          }`}>
                            {isAvailable ? 'Available Now' : 'Currently Reserved'}
                          </span>
                        </div>
                        <h4 className="text-xs font-bold text-stone-900 line-clamp-1">{eq.name}</h4>
                        <p className="text-xs text-stone-500">{eq.location}</p>
                        <p className="text-xs font-bold text-emerald-800 tabular-nums">
                          {eq.isFree ? 'Free Community Share' : `$${eq.pricePerDay} / day`}
                        </p>
                      </div>
                    </div>

                    <div className="border-t border-stone-100 pt-3 flex items-center justify-between">
                      {/* Notification Alert Toggle */}
                      <label className="flex items-center gap-2 text-xs text-stone-700 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={item.notifyWhenAvailable}
                          onChange={() => handleToggleWishAlert(eq.equipmentId, item.notifyWhenAvailable)}
                          className="w-3.5 h-3.5 accent-emerald-700 rounded cursor-pointer"
                        />
                        <span className="text-[11px] font-medium flex items-center gap-1">
                          <Bell className="w-3 h-3 text-stone-400" />
                          Notify me when available
                        </span>
                      </label>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleRemoveWishlist(eq.equipmentId)}
                          className="text-xs text-stone-400 hover:text-stone-700 font-medium cursor-pointer"
                        >
                          Remove
                        </button>
                        <button
                          onClick={() => onNavigate(`/equipment/${eq.equipmentId}`)}
                          className="px-3 py-1.5 bg-emerald-800 hover:bg-emerald-900 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer"
                        >
                          {isAvailable ? 'Borrow Now' : 'View Schedule'}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* 6. FAVOURITES TAB */}
      {activeTab === 'favourites' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-stone-900">Saved Favourites</h2>
          </div>

          {favourites.length === 0 ? (
            <div className="bg-white p-12 text-center rounded-2xl border border-stone-200 space-y-3">
              <Heart className="w-10 h-10 text-stone-300 mx-auto" />
              <h3 className="text-sm font-bold text-stone-900">No favourites saved yet</h3>
              <p className="text-xs text-stone-500">Click the heart icon on any equipment to save it here for quick access.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {favourites.map(eq => (
                <div
                  key={eq.equipmentId}
                  onClick={() => onNavigate(`/equipment/${eq.equipmentId}`)}
                  className="bg-white p-4 rounded-2xl border border-stone-200 hover:shadow-sm cursor-pointer space-y-3"
                >
                  <img
                    src={eq.images[0] || '/src/assets/images/hero_community_equipment_1794441755197.jpg'}
                    alt=""
                    className="w-full h-36 rounded-xl object-cover"
                  />
                  <div>
                    <h4 className="text-xs font-bold text-stone-900 line-clamp-1">{eq.name}</h4>
                    <p className="text-[11px] text-stone-500">{eq.location}</p>
                    <p className="text-xs font-bold text-emerald-800 tabular-nums mt-1">
                      {eq.isFree ? 'Free' : `$${eq.pricePerDay} / day`}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* REVIEW SUBMISSION MODAL */}
      {reviewModalBooking && (
        <div className="fixed inset-0 z-50 bg-stone-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl">
            <h3 className="text-base font-bold text-stone-900">
              Review Your Rental Experience
            </h3>
            <p className="text-xs text-stone-500">
              For: <span className="font-semibold text-stone-800">{reviewModalBooking.equipment?.name}</span> lent by {reviewModalBooking.owner?.fullName}.
            </p>

            <form onSubmit={handleReviewSubmit} className="space-y-4">
              <div className="space-y-1 text-center py-2">
                <label className="text-xs font-bold text-stone-700">Rating</label>
                <div className="flex justify-center gap-2 pt-1">
                  {[1, 2, 3, 4, 5].map(star => (
                    <button
                      type="button"
                      key={star}
                      onClick={() => setReviewRating(star)}
                      className="p-1 cursor-pointer focus:outline-none"
                    >
                      <Star
                        className={`w-7 h-7 ${star <= reviewRating ? 'text-amber-500 fill-amber-500' : 'text-stone-300'}`}
                      />
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-stone-700">Your Feedback</label>
                <textarea
                  rows={4}
                  required
                  value={reviewComment}
                  onChange={e => setReviewComment(e.target.value)}
                  placeholder="How was the equipment condition? Did the lender explain operation clearly?"
                  className="w-full p-3 bg-stone-50 border border-stone-200 rounded-xl text-xs focus:outline-none focus:border-emerald-600 resize-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setReviewModalBooking(null)}
                  className="px-3 py-1.5 text-xs text-stone-600 hover:text-stone-900 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingReview}
                  className="px-5 py-2 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl text-xs font-bold cursor-pointer"
                >
                  {submittingReview ? 'Submitting...' : 'Post Verified Review'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PAYMENT MODAL */}
      {paymentModalBooking && (
        <PaymentModal
          booking={paymentModalBooking}
          onSuccess={() => {
            setPaymentModalBooking(null);
            setActionSuccess('Payment confirmed! Funds are held safely in NeighborLend Escrow until equipment return.');
            loadDashboardData();
          }}
          onClose={() => setPaymentModalBooking(null)}
        />
      )}

      {/* RECEIPT / INVOICE MODAL */}
      {selectedReceipt && (
        <ReceiptModal
          receipt={selectedReceipt}
          onClose={() => setSelectedReceipt(null)}
        />
      )}
    </div>
  );
};
