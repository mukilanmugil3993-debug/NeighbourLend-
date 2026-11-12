import React, { useState, useEffect } from 'react';
import { api } from '../services/api.ts';
import { AdminStats, Member, Equipment, Report, Category, PaymentSettings } from '../types/index.ts';
import { useAuth } from '../context/AuthContext.tsx';
import {
  ShieldCheck,
  Users,
  Wrench,
  AlertTriangle,
  FolderPlus,
  Calendar,
  CheckCircle2,
  XCircle,
  Eye,
  SlidersHorizontal,
  DollarSign,
  CreditCard,
  QrCode,
  Lock,
  Receipt,
  FileText
} from 'lucide-react';
import { ReceiptModal } from '../components/payment/ReceiptModal.tsx';

interface AdminDashboardPageProps {
  onNavigate: (path: string, params?: any) => void;
}

export const AdminDashboardPage: React.FC<AdminDashboardPageProps> = ({ onNavigate }) => {
  const { user } = useAuth();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [activeTab, setActiveTab] = useState<'users' | 'equipment' | 'reports' | 'categories' | 'payments'>('users');
  const [usersList, setUsersList] = useState<any[]>([]);
  const [equipmentList, setEquipmentList] = useState<Equipment[]>([]);
  const [reportsList, setReportsList] = useState<Report[]>([]);
  const [categoriesList, setCategoriesList] = useState<Category[]>([]);
  const [paymentsLedger, setPaymentsLedger] = useState<any[]>([]);
  const [paymentSettings, setPaymentSettings] = useState<PaymentSettings | null>(null);
  const [selectedReceipt, setSelectedReceipt] = useState<any | null>(null);
  const [savingSettings, setSavingSettings] = useState(false);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // New Category form state
  const [newCatName, setNewCatName] = useState('');
  const [newCatDesc, setNewCatDesc] = useState('');
  const [creatingCat, setCreatingCat] = useState(false);

  const loadAdminData = async () => {
    if (!user || user.role !== 'admin') return;
    setLoading(true);
    try {
      const [statsRes, usersRes, equipRes, reportsRes, catsRes, ledgerRes, settingsRes] = await Promise.all([
        api.getAdminStats(),
        api.getAdminUsers(),
        api.getEquipmentList({ limit: 50 }),
        api.getAdminReports(),
        api.getCategories(),
        api.getAdminPayments(),
        api.getPaymentSettings()
      ]);
      setStats(statsRes);
      setUsersList(usersRes);
      setEquipmentList(equipRes.items);
      setReportsList(reportsRes);
      setCategoriesList(catsRes);
      setPaymentsLedger(ledgerRes.transactions || []);
      setPaymentSettings(settingsRes);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to load administrative data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAdminData();
  }, [user]);

  if (!user || user.role !== 'admin') {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center space-y-4">
        <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
          <AlertTriangle className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-bold text-stone-900">Access Restricted</h2>
        <p className="text-xs text-stone-500">
          This portal requires administrative authorization. Please sign in as an administrator (e.g. Eleanor Vance: admin@neighbourlend.org).
        </p>
        <button
          onClick={() => onNavigate('/login')}
          className="px-4 py-2 bg-emerald-800 text-white rounded-lg text-xs font-semibold cursor-pointer"
        >
          Sign In as Admin
        </button>
      </div>
    );
  }

  const handleToggleUserVerification = async (targetId: string, currentStatus: string) => {
    try {
      const nextStatus = currentStatus === 'verified' ? 'unverified' : 'verified';
      await api.updateAdminUser(targetId, { verificationStatus: nextStatus });
      await loadAdminData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleListingStatus = async (equipmentId: string, currentStatus: string) => {
    try {
      const nextStatus = currentStatus === 'Active' ? 'Paused' : 'Active';
      await api.updateAdminEquipmentStatus(equipmentId, nextStatus);
      await loadAdminData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleResolveReport = async (reportId: string, status: string) => {
    try {
      await api.updateAdminReport(reportId, status);
      await loadAdminData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;
    setCreatingCat(true);
    try {
      await api.createCategory({
        name: newCatName.trim(),
        description: newCatDesc.trim(),
        image: '/src/assets/images/hero_community_equipment_1794441755197.jpg'
      });
      setNewCatName('');
      setNewCatDesc('');
      await loadAdminData();
    } catch (err) {
      console.error(err);
    } finally {
      setCreatingCat(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Admin Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-200 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-600" />
            <h1 className="text-2xl font-extrabold text-stone-900 tracking-tight">
              NeighbourLend Administrator Console
            </h1>
          </div>
          <p className="text-xs text-stone-500 mt-1">
            System management, equipment moderation, community dispute oversight, and catalog controls.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="px-3 py-1.5 bg-emerald-100 text-emerald-900 font-bold rounded-lg flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-700" />
            Logged in as Eleanor Vance (SuperAdmin)
          </span>
        </div>
      </div>

      {errorMsg && (
        <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl">
          {errorMsg}
        </div>
      )}

      {/* High-Level System Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        <div className="bg-white p-4 rounded-xl border border-stone-200 space-y-1">
          <p className="text-xs text-stone-500 font-semibold uppercase">Total Users</p>
          <p className="text-2xl font-bold text-stone-900 tabular-nums">{stats?.totalUsers || 0}</p>
          <p className="text-[10px] text-emerald-700 font-medium">{stats?.verifiedUsers || 0} verified</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-stone-200 space-y-1">
          <p className="text-xs text-stone-500 font-semibold uppercase">Total Listings</p>
          <p className="text-2xl font-bold text-stone-900 tabular-nums">{stats?.totalListings || 0}</p>
          <p className="text-[10px] text-stone-500 font-medium">{stats?.activeListings || 0} active</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-stone-200 space-y-1">
          <p className="text-xs text-stone-500 font-semibold uppercase">Total Bookings</p>
          <p className="text-2xl font-bold text-emerald-800 tabular-nums">{stats?.totalBookings || 0}</p>
          <p className="text-[10px] text-stone-500 font-medium">{stats?.activeBookings || 0} active right now</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-stone-200 space-y-1">
          <p className="text-xs text-stone-500 font-semibold uppercase">Escrow Held</p>
          <p className="text-2xl font-bold text-emerald-800 tabular-nums">${stats?.totalEscrowHeld ?? 0}</p>
          <p className="text-[10px] text-stone-500 font-medium">${stats?.totalSettledVolume ?? 0} settled total</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-stone-200 space-y-1">
          <p className="text-xs text-stone-500 font-semibold uppercase">Reports / Disputes</p>
          <p className="text-2xl font-bold text-amber-700 tabular-nums">{stats?.pendingReports || 0}</p>
          <p className="text-[10px] text-stone-500 font-medium">pending resolution</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-stone-200 space-y-1">
          <p className="text-xs text-stone-500 font-semibold uppercase">Inventory Value</p>
          <p className="text-2xl font-bold text-stone-900 tabular-nums">${stats?.totalInventoryEstimatedValue || 0}</p>
          <p className="text-[10px] text-stone-500 font-medium">shared community value</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-stone-200 text-xs font-semibold overflow-x-auto">
        <button
          onClick={() => setActiveTab('users')}
          className={`px-3 py-2 rounded-lg cursor-pointer whitespace-nowrap ${
            activeTab === 'users' ? 'bg-emerald-800 text-white' : 'text-stone-600 hover:text-stone-900'
          }`}
        >
          User Management ({usersList.length})
        </button>
        <button
          onClick={() => setActiveTab('equipment')}
          className={`px-3 py-2 rounded-lg cursor-pointer whitespace-nowrap ${
            activeTab === 'equipment' ? 'bg-emerald-800 text-white' : 'text-stone-600 hover:text-stone-900'
          }`}
        >
          Equipment Moderation ({equipmentList.length})
        </button>
        <button
          onClick={() => setActiveTab('payments')}
          className={`px-3 py-2 rounded-lg cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
            activeTab === 'payments' ? 'bg-emerald-800 text-white' : 'text-stone-600 hover:text-stone-900'
          }`}
        >
          <CreditCard className="w-3.5 h-3.5" />
          <span>Payments & Escrow Ledger ({paymentsLedger.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('reports')}
          className={`px-3 py-2 rounded-lg cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
            activeTab === 'reports' ? 'bg-emerald-800 text-white' : 'text-stone-600 hover:text-stone-900'
          }`}
        >
          <span>Reports & Disputes</span>
          {reportsList.filter(r => r.status === 'Pending').length > 0 && (
            <span className="w-4 h-4 bg-amber-500 text-stone-900 text-[10px] rounded-full flex items-center justify-center font-bold">
              {reportsList.filter(r => r.status === 'Pending').length}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('categories')}
          className={`px-3 py-2 rounded-lg cursor-pointer whitespace-nowrap ${
            activeTab === 'categories' ? 'bg-emerald-800 text-white' : 'text-stone-600 hover:text-stone-900'
          }`}
        >
          Categories ({categoriesList.length})
        </button>
      </div>

      {/* TAB 1: USERS */}
      {activeTab === 'users' && (
        <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-stone-50 border-b border-stone-200 text-stone-500 font-bold uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3">Member</th>
                  <th className="px-4 py-3">Role</th>
                  <th className="px-4 py-3">Location</th>
                  <th className="px-4 py-3">Listings</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {usersList.map(u => (
                  <tr key={u.memberId} className="hover:bg-stone-50/50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <img
                          src={u.profileImage || 'https://images.unsplash.com/photo-1534528741775?auto=format&fit=crop&w=100&q=80'}
                          alt=""
                          className="w-8 h-8 rounded-full object-cover"
                        />
                        <div>
                          <p className="font-bold text-stone-900">{u.fullName}</p>
                          <p className="text-[11px] text-stone-500">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 font-semibold uppercase text-[10px] text-stone-700">
                      {u.role}
                    </td>
                    <td className="px-4 py-3 text-stone-600">{u.location}</td>
                    <td className="px-4 py-3 tabular-nums font-semibold">{u.listingsCount || 0}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        u.verificationStatus === 'verified' ? 'bg-emerald-50 text-emerald-800' : 'bg-amber-50 text-amber-800'
                      }`}>
                        {u.verificationStatus}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => handleToggleUserVerification(u.memberId, u.verificationStatus)}
                        className="text-xs font-semibold text-emerald-800 hover:underline cursor-pointer"
                      >
                        {u.verificationStatus === 'verified' ? 'Revoke Verification' : 'Verify Member'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: EQUIPMENT MODERATION */}
      {activeTab === 'equipment' && (
        <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-stone-50 border-b border-stone-200 text-stone-500 font-bold uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3">Equipment</th>
                  <th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3">Price</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Moderation Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {equipmentList.map(eq => (
                  <tr key={eq.equipmentId} className="hover:bg-stone-50/50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <img
                          src={eq.images[0] || '/src/assets/images/hero_community_equipment_1794441755197.jpg'}
                          alt=""
                          className="w-10 h-10 rounded-lg object-cover"
                        />
                        <div>
                          <p className="font-bold text-stone-900 line-clamp-1">{eq.name}</p>
                          <p className="text-[11px] text-stone-500">{eq.brand} · {eq.condition}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-stone-600">{eq.categoryName || eq.categoryId}</td>
                    <td className="px-4 py-3 tabular-nums font-semibold">
                      {eq.isFree ? 'Free' : `$${eq.pricePerDay}/d`}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        eq.listingStatus === 'Active' ? 'bg-emerald-50 text-emerald-800' : 'bg-stone-100 text-stone-600'
                      }`}>
                        {eq.listingStatus}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right space-x-2">
                      <button
                        onClick={() => onNavigate(`/equipment/${eq.equipmentId}`)}
                        className="text-stone-600 hover:text-stone-900 font-medium"
                      >
                        Inspect
                      </button>
                      <button
                        onClick={() => handleToggleListingStatus(eq.equipmentId, eq.listingStatus)}
                        className={`font-semibold cursor-pointer ${
                          eq.listingStatus === 'Active' ? 'text-amber-700 hover:underline' : 'text-emerald-800 hover:underline'
                        }`}
                      >
                        {eq.listingStatus === 'Active' ? 'Pause' : 'Activate'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: REPORTS & DISPUTES */}
      {activeTab === 'reports' && (
        <div className="space-y-4">
          {reportsList.length === 0 ? (
            <div className="bg-white p-8 text-center rounded-2xl border border-stone-200">
              <p className="text-xs text-stone-500">No open incident reports or community disputes.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {reportsList.map(rep => (
                <div key={rep.reportId} className="bg-white p-5 rounded-2xl border border-stone-200 space-y-3 shadow-xs">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs text-stone-900">{rep.reason}</span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        rep.status === 'Resolved' ? 'bg-emerald-50 text-emerald-800' : 'bg-amber-50 text-amber-800'
                      }`}>
                        {rep.status}
                      </span>
                    </div>
                    <span className="text-[10px] text-stone-400 tabular-nums">
                      {new Date(rep.createdAt).toLocaleDateString()}
                    </span>
                  </div>

                  <p className="text-xs text-stone-600 leading-relaxed bg-stone-50 p-3 rounded-xl border border-stone-100">
                    "{rep.description}"
                  </p>

                  <div className="flex items-center justify-between text-xs text-stone-500 pt-1">
                    <div>
                      <span>Reported by: <strong className="text-stone-700">{rep.reporterName}</strong></span>
                      {rep.equipmentName && (
                        <span> · On Item: <strong className="text-stone-700">{rep.equipmentName}</strong></span>
                      )}
                    </div>

                    {rep.status !== 'Resolved' && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleResolveReport(rep.reportId, 'Dismissed')}
                          className="px-3 py-1 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-lg font-medium cursor-pointer"
                        >
                          Dismiss
                        </button>
                        <button
                          onClick={() => handleResolveReport(rep.reportId, 'Resolved')}
                          className="px-3 py-1 bg-emerald-800 hover:bg-emerald-900 text-white rounded-lg font-bold cursor-pointer"
                        >
                          Mark Resolved
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 4: CATEGORIES */}
      {activeTab === 'categories' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
          <div className="md:col-span-1 bg-white p-5 rounded-2xl border border-stone-200 space-y-4">
            <h3 className="text-sm font-bold text-stone-900 flex items-center gap-1.5">
              <FolderPlus className="w-4 h-4 text-emerald-700" />
              <span>Add New Equipment Category</span>
            </h3>

            <form onSubmit={handleCreateCategory} className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs font-bold text-stone-800">Category Name</label>
                <input
                  type="text"
                  required
                  value={newCatName}
                  onChange={e => setNewCatName(e.target.value)}
                  placeholder="e.g. Woodworking & Saws"
                  className="w-full p-2 bg-stone-50 border border-stone-200 rounded-lg text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-stone-800">Description</label>
                <textarea
                  rows={3}
                  value={newCatDesc}
                  onChange={e => setNewCatDesc(e.target.value)}
                  placeholder="Items included in this group..."
                  className="w-full p-2 bg-stone-50 border border-stone-200 rounded-lg text-xs resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={creatingCat}
                className="w-full py-2 bg-emerald-800 text-white text-xs font-bold rounded-xl cursor-pointer hover:bg-emerald-900"
              >
                {creatingCat ? 'Creating...' : 'Create Category'}
              </button>
            </form>
          </div>

          <div className="md:col-span-2 space-y-3">
            <h3 className="text-sm font-bold text-stone-900">Current Marketplace Categories</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {categoriesList.map(c => (
                <div key={c.categoryId} className="bg-white p-4 rounded-xl border border-stone-200 space-y-1">
                  <h4 className="text-xs font-bold text-stone-900">{c.name}</h4>
                  <p className="text-[11px] text-stone-500 line-clamp-2">{c.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: PAYMENTS & ESCROW LEDGER */}
      {activeTab === 'payments' && (
        <div className="space-y-6">
          {/* Payment Gateway Configuration Panel */}
          {paymentSettings && (
            <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-100 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-800 flex items-center justify-center">
                    <SlidersHorizontal className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-stone-900">Payment Gateway Controls & Methods</h3>
                    <p className="text-[11px] text-stone-500">Configure enabled payment channels and community platform fees.</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${
                    paymentSettings.gatewayMode === 'live' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                  }`}>
                    Mode: {paymentSettings.gatewayMode.toUpperCase()}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                {/* UPI Toggle */}
                <div className="p-3 bg-stone-50 rounded-xl border border-stone-200/80 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <QrCode className="w-4 h-4 text-emerald-700" />
                    <div>
                      <p className="font-bold text-stone-800">UPI Payments</p>
                      <p className="text-[10px] text-stone-500">VPA & Dynamic QR</p>
                    </div>
                  </div>
                  <button
                    onClick={async () => {
                      if (!paymentSettings) return;
                      const updated = await api.updatePaymentSettings({ upiEnabled: !paymentSettings.upiEnabled });
                      setPaymentSettings(updated);
                    }}
                    className={`px-2.5 py-1 text-[11px] font-bold rounded-lg cursor-pointer ${
                      paymentSettings.upiEnabled ? 'bg-emerald-800 text-white' : 'bg-stone-200 text-stone-700'
                    }`}
                  >
                    {paymentSettings.upiEnabled ? 'Active' : 'Disabled'}
                  </button>
                </div>

                {/* Cards Toggle */}
                <div className="p-3 bg-stone-50 rounded-xl border border-stone-200/80 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-blue-700" />
                    <div>
                      <p className="font-bold text-stone-800">Credit / Debit Cards</p>
                      <p className="text-[10px] text-stone-500">Visa, Mastercard, Amex</p>
                    </div>
                  </div>
                  <button
                    onClick={async () => {
                      if (!paymentSettings) return;
                      const updated = await api.updatePaymentSettings({ cardsEnabled: !paymentSettings.cardsEnabled });
                      setPaymentSettings(updated);
                    }}
                    className={`px-2.5 py-1 text-[11px] font-bold rounded-lg cursor-pointer ${
                      paymentSettings.cardsEnabled ? 'bg-emerald-800 text-white' : 'bg-stone-200 text-stone-700'
                    }`}
                  >
                    {paymentSettings.cardsEnabled ? 'Active' : 'Disabled'}
                  </button>
                </div>

                {/* Platform Fee */}
                <div className="p-3 bg-stone-50 rounded-xl border border-stone-200/80">
                  <p className="font-bold text-stone-800">Platform Service Fee</p>
                  <p className="text-sm font-bold text-emerald-800 tabular-nums mt-0.5">{paymentSettings.platformFeePercent}%</p>
                  <p className="text-[10px] text-stone-500">Deducted from rental for insurance fund</p>
                </div>

                {/* Merchant VPA */}
                <div className="p-3 bg-stone-50 rounded-xl border border-stone-200/80">
                  <p className="font-bold text-stone-800">Merchant Escrow VPA</p>
                  <p className="text-xs font-mono font-medium text-stone-700 truncate mt-0.5">{paymentSettings.merchantVpa}</p>
                  <p className="text-[10px] text-stone-500">Escrow settlement node</p>
                </div>
              </div>
            </div>
          )}

          {/* Ledger Table */}
          <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-xs">
            <div className="p-4 border-b border-stone-100 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-stone-900">Live Escrow & Payment Transactions</h3>
                <p className="text-xs text-stone-500">All member rental payments, escrow deposits, and release receipts.</p>
              </div>
              <span className="text-xs font-semibold text-stone-500">
                {paymentsLedger.length} Transaction{paymentsLedger.length !== 1 ? 's' : ''}
              </span>
            </div>

            {paymentsLedger.length === 0 ? (
              <div className="p-8 text-center text-xs text-stone-500">
                No payment transactions recorded yet.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-stone-50 border-b border-stone-200 text-stone-500 font-bold uppercase tracking-wider">
                    <tr>
                      <th className="px-4 py-3">Reference / Date</th>
                      <th className="px-4 py-3">Item & Members</th>
                      <th className="px-4 py-3">Method</th>
                      <th className="px-4 py-3">Rental Fee</th>
                      <th className="px-4 py-3">Security Deposit</th>
                      <th className="px-4 py-3">Total Paid</th>
                      <th className="px-4 py-3">Escrow Status</th>
                      <th className="px-4 py-3 text-right">Invoice</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {paymentsLedger.map(item => (
                      <tr key={item.bookingId} className="hover:bg-stone-50/50">
                        <td className="px-4 py-3">
                          <p className="font-mono text-[11px] font-bold text-stone-900">
                            {item.paymentDetails?.transactionRef || item.bookingId}
                          </p>
                          <p className="text-[10px] text-stone-400">
                            {item.paymentDetails?.paidAt ? new Date(item.paymentDetails.paidAt).toLocaleDateString() : item.createdAt}
                          </p>
                        </td>
                        <td className="px-4 py-3">
                          <p className="font-bold text-stone-900">{item.equipmentName}</p>
                          <p className="text-[10px] text-stone-500">
                            {item.borrowerName} → {item.ownerName}
                          </p>
                        </td>
                        <td className="px-4 py-3">
                          {item.paymentDetails?.method === 'upi' ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded">
                              <QrCode className="w-3 h-3" />
                              UPI ({item.paymentDetails.upiId})
                            </span>
                          ) : item.paymentDetails?.method === 'card' ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-stone-700 bg-stone-100 px-2 py-0.5 rounded">
                              <CreditCard className="w-3 h-3" />
                              {item.paymentDetails.cardBrand || 'Card'} •••• {item.paymentDetails.cardLast4}
                            </span>
                          ) : (
                            <span className="text-stone-400">Unpaid / Cash</span>
                          )}
                        </td>
                        <td className="px-4 py-3 tabular-nums font-medium text-stone-900">
                          ${item.totalPrice}
                        </td>
                        <td className="px-4 py-3 tabular-nums text-stone-600">
                          ${item.securityDeposit}
                          {item.paymentDetails?.depositRefundedAt && (
                            <span className="block text-[9px] text-emerald-700 font-bold">✓ Refunded</span>
                          )}
                        </td>
                        <td className="px-4 py-3 tabular-nums font-bold text-emerald-800">
                          ${item.paymentDetails?.totalAmount || item.totalPrice + item.securityDeposit}
                        </td>
                        <td className="px-4 py-3">
                          {item.paymentStatus === 'Held in Escrow' ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                              <ShieldCheck className="w-3 h-3 text-emerald-700" />
                              Held in Escrow
                            </span>
                          ) : item.paymentStatus === 'Settled' ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-stone-700 bg-stone-100 px-2 py-0.5 rounded border border-stone-200">
                              <CheckCircle2 className="w-3 h-3 text-stone-600" />
                              Settled
                            </span>
                          ) : (
                            <span className="text-[10px] text-amber-700 font-medium">Pending</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button
                            onClick={async () => {
                              try {
                                const receipt = await api.getReceipt(item.bookingId);
                                setSelectedReceipt(receipt);
                              } catch (err: any) {
                                setErrorMsg(err.message || 'Failed to fetch invoice');
                              }
                            }}
                            className="px-2.5 py-1 text-[11px] font-semibold text-emerald-800 hover:bg-emerald-50 rounded-lg inline-flex items-center gap-1 cursor-pointer"
                          >
                            <FileText className="w-3.5 h-3.5" />
                            <span>Invoice</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
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
