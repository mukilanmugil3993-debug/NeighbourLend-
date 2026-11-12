export type MemberRole = 'member' | 'admin';
export type VerificationStatus = 'verified' | 'unverified' | 'pending';
export type EquipmentCondition = 'Like New' | 'Excellent' | 'Good' | 'Fair';
export type EquipmentAvailability = 'Available' | 'Reserved' | 'Paused';
export type ListingStatus = 'Active' | 'Paused' | 'Archived' | 'Flagged';
export type BookingStatus = 'Pending' | 'Approved' | 'Rejected' | 'Active' | 'Returned' | 'Cancelled' | 'Disputed';
export type PaymentStatus = 'Not Enabled' | 'Pending' | 'Held in Escrow' | 'Settled' | 'Refunded';
export type PaymentMethod = 'UPI' | 'Credit Card' | 'Debit Card';
export type ReportStatus = 'Pending' | 'Investigating' | 'Resolved' | 'Dismissed';

export interface PaymentDetails {
  method: PaymentMethod;
  transactionId: string;
  paidAt: string;
  cardBrand?: string;
  cardLast4?: string;
  upiId?: string;
  rentalAmount: number;
  depositAmount: number;
  totalPaid: number;
  totalAmount?: number;
  transactionRef?: string;
  depositRefundedAt?: string;
  depositRefundRef?: string;
  authorizationCode?: string;
}

export interface PaymentSettings {
  gatewayMode: 'sandbox' | 'live';
  upiEnabled: boolean;
  cardsEnabled: boolean;
  merchantVpa: string;
  merchantName: string;
  platformFeePercent?: number;
}

export interface PaymentTransaction {
  transactionId: string;
  bookingId: string;
  borrowerName: string;
  equipmentName: string;
  amount: number;
  method: PaymentMethod;
  status: PaymentStatus;
  reference: string;
  paidAt: string;
  depositRefunded?: boolean;
  depositRefundRef?: string;
}

export interface Member {
  memberId: string;
  fullName: string;
  email: string;
  role: MemberRole;
  phone?: string;
  profileImage?: string;
  location: string;
  bio?: string;
  verificationStatus: VerificationStatus;
  averageRating: number;
  totalReviews?: number;
  createdAt: string;
}

export interface Equipment {
  equipmentId: string;
  ownerId: string;
  ownerName?: string;
  ownerLocation?: string;
  ownerRating?: number;
  ownerImage?: string;
  name: string;
  description: string;
  categoryId: string;
  categoryName?: string;
  images: string[];
  brand: string;
  model: string;
  condition: EquipmentCondition;
  pricePerDay: number;
  securityDeposit: number;
  isFree: boolean;
  location: string;
  pickupInstructions: string;
  safetyInstructions: string;
  availability: EquipmentAvailability;
  listingStatus: ListingStatus;
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  categoryId: string;
  name: string;
  description: string;
  image: string;
  icon?: string;
  activeStatus: boolean;
  itemCount?: number;
}

export interface BookingRequest {
  bookingId: string;
  equipmentId: string;
  borrowerId: string;
  ownerId: string;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  totalDays: number;
  pricePerDay: number;
  securityDeposit: number;
  totalPrice: number;
  status: BookingStatus;
  borrowerNotes?: string;
  paymentStatus: PaymentStatus;
  paymentMethod?: PaymentMethod;
  paymentTransactionRef?: string;
  paymentDetails?: PaymentDetails;
  createdAt: string;
  updatedAt: string;

  // Joined presentation data
  equipment?: Equipment;
  borrower?: Pick<Member, 'memberId' | 'fullName' | 'email' | 'phone' | 'profileImage' | 'location' | 'verificationStatus'>;
  owner?: Pick<Member, 'memberId' | 'fullName' | 'email' | 'phone' | 'profileImage' | 'location'>;
  hasReview?: boolean;
}

export interface Review {
  reviewId: string;
  bookingId: string;
  reviewerId: string;
  reviewerName?: string;
  reviewerImage?: string;
  reviewedMemberId: string;
  equipmentId: string;
  equipmentName?: string;
  rating: number; // 1 to 5
  comment: string;
  moderationStatus: 'Approved' | 'Pending' | 'Hidden';
  createdAt: string;
}

export interface Favourite {
  memberId: string;
  equipmentId: string;
  createdAt: string;
}

export interface Conversation {
  conversationId: string;
  participantIds: string[];
  equipmentId?: string;
  equipmentName?: string;
  bookingId?: string;
  lastMessageText: string;
  lastMessageAt: string;
  createdAt: string;
  otherParticipant?: Pick<Member, 'memberId' | 'fullName' | 'profileImage' | 'location'>;
  unreadCount?: number;
}

export interface Message {
  messageId: string;
  conversationId: string;
  senderId: string;
  senderName?: string;
  senderImage?: string;
  message: string;
  readBy: string[];
  createdAt: string;
}

export interface Notification {
  notificationId: string;
  recipientId: string;
  type: 'booking_request' | 'booking_approved' | 'booking_rejected' | 'booking_cancelled' | 'booking_active' | 'booking_returned' | 'new_message' | 'listing_status' | 'system' | 'payment_received' | 'deposit_refunded';
  title: string;
  message: string;
  relatedId?: string;
  readStatus: boolean;
  createdAt: string;
}

export interface Report {
  reportId: string;
  reporterId: string;
  reporterName?: string;
  reportedUserId?: string;
  reportedUserName?: string;
  equipmentId?: string;
  equipmentName?: string;
  reason: string;
  description: string;
  status: ReportStatus;
  createdAt: string;
}

export interface UserStats {
  activeBorrowings: number;
  pendingBorrowRequests: number;
  completedBorrowings: number;
  totalSavedDollars: number;
  myListingsCount: number;
  activeLendings: number;
  pendingLendRequests: number;
  totalEarnedDollars: number;
  favouritesCount: number;
  unreadNotifications: number;
  fundsInEscrow?: number;
}

export interface AdminStats {
  totalUsers: number;
  verifiedUsers: number;
  totalListings: number;
  activeListings: number;
  totalBookings: number;
  activeBookings: number;
  completedBookings: number;
  pendingReports: number;
  totalInventoryEstimatedValue: number;
  totalEscrowHeld?: number;
  totalSettledPayments?: number;
  totalSettledVolume?: number;
}
