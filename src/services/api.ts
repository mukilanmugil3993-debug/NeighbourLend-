import {
  Member,
  Equipment,
  Category,
  BookingRequest,
  Review,
  Conversation,
  Message,
  Notification,
  Report,
  UserStats,
  AdminStats
} from '../types/index.ts';

const TOKEN_KEY = 'neighbourlend_token';

export function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setStoredToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearStoredToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getStoredToken();
  const headers = new Headers(options.headers || {});

  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const res = await fetch(`/api${endpoint}`, {
    ...options,
    headers
  });

  if (!res.ok) {
    let errorMsg = 'An unexpected error occurred.';
    try {
      const data = await res.json();
      errorMsg = data.error || errorMsg;
    } catch {
      errorMsg = `${res.status} ${res.statusText}`;
    }
    throw new Error(errorMsg);
  }

  return res.json() as Promise<T>;
}

export const api = {
  // Auth
  register: (data: { fullName: string; email: string; password: string; phone?: string; location?: string }) =>
    request<{ token: string; member: Member }>('/auth/register', { method: 'POST', body: JSON.stringify(data) }),

  login: (data: { email: string; password: string }) =>
    request<{ token: string; member: Member }>('/auth/login', { method: 'POST', body: JSON.stringify(data) }),

  logout: () =>
    request<{ success: boolean }>('/auth/logout', { method: 'POST' }),

  getCurrentUser: () =>
    request<{ member: Member | null; unreadNotifications?: number }>('/auth/me'),

  updateProfile: (data: Partial<Member>) =>
    request<{ member: Member }>('/auth/profile', { method: 'PUT', body: JSON.stringify(data) }),

  verifyEmail: () =>
    request<{ success: boolean; verificationStatus: string }>('/auth/verify-email', { method: 'POST' }),

  requestPasswordReset: (email: string) =>
    request<{ success: boolean; message: string }>('/auth/password-reset', { method: 'POST', body: JSON.stringify({ email }) }),

  getMemberProfile: (memberId: string) =>
    request<{ member: Member; listings: Equipment[]; reviews: Review[] }>(`/members/${memberId}`),

  // Categories
  getCategories: () =>
    request<Category[]>('/categories'),

  createCategory: (data: { name: string; description: string; image?: string; icon?: string }) =>
    request<Category>('/categories', { method: 'POST', body: JSON.stringify(data) }),

  // Equipment
  getEquipmentList: (params: Record<string, any> = {}) => {
    const query = new URLSearchParams();
    for (const [key, val] of Object.entries(params)) {
      if (val !== undefined && val !== null && val !== '') {
        query.set(key, String(val));
      }
    }
    return request<{ items: Equipment[]; total: number; page: number; totalPages: number }>(`/equipment?${query.toString()}`);
  },

  getEquipmentDetails: (id: string) =>
    request<Equipment & { reviews: Review[]; isWishlisted?: boolean; isFavourited?: boolean; ownerReviewsCount?: number }>(`/equipment/${id}`),

  createEquipment: (data: any) =>
    request<Equipment>('/equipment', { method: 'POST', body: JSON.stringify(data) }),

  updateEquipment: (id: string, data: any) =>
    request<Equipment>(`/equipment/${id}`, { method: 'PUT', body: JSON.stringify(data) }),

  deleteEquipment: (id: string) =>
    request<{ success: boolean; message: string }>(`/equipment/${id}`, { method: 'DELETE' }),

  checkAvailability: (id: string, startDate: string, endDate: string) =>
    request<{ available: boolean; bookedRanges: any[]; conflict: any }>(`/equipment/${id}/availability?startDate=${startDate}&endDate=${endDate}`),

  // Bookings
  createBooking: (data: { equipmentId: string; startDate: string; endDate: string; borrowerNotes?: string }) =>
    request<BookingRequest>('/bookings', { method: 'POST', body: JSON.stringify(data) }),

  getBookings: (role?: 'borrower' | 'lender') =>
    request<BookingRequest[]>(`/bookings${role ? `?role=${role}` : ''}`),

  getBookingDetails: (id: string) =>
    request<BookingRequest>(`/bookings/${id}`),

  updateBookingStatus: (id: string, status: string, resolutionNotes?: string) =>
    request<BookingRequest>(`/bookings/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status, resolutionNotes }) }),

  // Payments (UPI & Credit/Debit Cards)
  payBooking: (bookingId: string, paymentData: {
    method: 'UPI' | 'Credit Card' | 'Debit Card';
    upiId?: string;
    cardholderName?: string;
    cardNumber?: string;
    expDate?: string;
    cvc?: string;
    billingZip?: string;
  }) =>
    request<{ success: boolean; booking: BookingRequest; paymentDetails: any }>(`/bookings/${bookingId}/pay`, {
      method: 'POST',
      body: JSON.stringify(paymentData)
    }),

  refundDeposit: (bookingId: string) =>
    request<{ success: boolean; refundRef: string; refundedAmount: number; booking: BookingRequest }>(`/bookings/${bookingId}/refund-deposit`, {
      method: 'POST'
    }),

  getReceipt: (bookingId: string) =>
    request<any>(`/bookings/${bookingId}/receipt`),

  getPaymentSettings: () =>
    request<any>('/payments/settings'),

  updatePaymentSettings: (data: any) =>
    request<any>('/admin/payments/settings', {
      method: 'PUT',
      body: JSON.stringify(data)
    }),

  getAdminPayments: () =>
    request<{ transactions: any[]; totalEscrow: number; totalSettled: number }>('/admin/payments'),

  // Wishlist
  getWishlist: () =>
    request<Array<{ wishlistId: string; notifyWhenAvailable: boolean; addedAt: string; equipment: Equipment }>>('/wishlist'),

  toggleWishlist: (equipmentId: string, notifyWhenAvailable = true) =>
    request<{ isWishlisted: boolean; notifyWhenAvailable?: boolean; message: string }>(`/wishlist/${equipmentId}`, {
      method: 'POST',
      body: JSON.stringify({ notifyWhenAvailable })
    }),

  updateWishlistAlert: (equipmentId: string, notifyWhenAvailable: boolean) =>
    request<{ success: boolean; notifyWhenAvailable: boolean }>(`/wishlist/${equipmentId}/alert`, {
      method: 'PATCH',
      body: JSON.stringify({ notifyWhenAvailable })
    }),

  // Favourites
  getFavourites: () =>
    request<Equipment[]>('/favourites'),

  toggleFavourite: (equipmentId: string) =>
    request<{ isFavourited: boolean }>(`/favourites/${equipmentId}`, { method: 'POST' }),

  // Reviews
  getReviews: (params: { equipmentId?: string; memberId?: string } = {}) => {
    const query = new URLSearchParams();
    if (params.equipmentId) query.set('equipmentId', params.equipmentId);
    if (params.memberId) query.set('memberId', params.memberId);
    return request<Review[]>(`/reviews?${query.toString()}`);
  },

  createReview: (data: { bookingId: string; rating: number; comment: string }) =>
    request<Review>('/reviews', { method: 'POST', body: JSON.stringify(data) }),

  // Messaging
  getConversations: () =>
    request<Conversation[]>('/conversations'),

  startConversation: (data: { participantId: string; equipmentId?: string; bookingId?: string; initialMessage?: string }) =>
    request<Conversation>('/conversations/start', { method: 'POST', body: JSON.stringify(data) }),

  getMessages: (conversationId: string) =>
    request<Message[]>(`/conversations/${conversationId}/messages`),

  sendMessage: (conversationId: string, message: string) =>
    request<Message>(`/conversations/${conversationId}/messages`, { method: 'POST', body: JSON.stringify({ message }) }),

  // Notifications
  getNotifications: () =>
    request<Notification[]>('/notifications'),

  markNotificationRead: (id: string) =>
    request<{ success: boolean }>(`/notifications/${id}/read`, { method: 'PATCH' }),

  markAllNotificationsRead: () =>
    request<{ success: boolean }>('/notifications/read-all', { method: 'PATCH' }),

  // Reports
  createReport: (data: { equipmentId?: string; reportedUserId?: string; reason: string; description: string }) =>
    request<Report>('/reports', { method: 'POST', body: JSON.stringify(data) }),

  // Stats
  getUserStats: () =>
    request<UserStats>('/stats'),

  // Admin
  getAdminStats: () =>
    request<AdminStats>('/admin/stats'),

  getAdminUsers: () =>
    request<Array<Member & { listingsCount: number; bookingsCount: number }>>('/admin/users'),

  updateAdminUser: (id: string, data: { role?: string; verificationStatus?: string }) =>
    request<Member>(`/admin/users/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),

  getAdminReports: () =>
    request<Report[]>('/admin/reports'),

  updateAdminReport: (id: string, status: string) =>
    request<Report>(`/admin/reports/${id}`, { method: 'PATCH', body: JSON.stringify({ status }) }),

  updateAdminEquipmentStatus: (id: string, listingStatus: string) =>
    request<Equipment>(`/admin/equipment/${id}/status`, { method: 'PATCH', body: JSON.stringify({ listingStatus }) })
};
