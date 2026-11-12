import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

export interface CMSDatabase {
  members: Array<{
    memberId: string;
    fullName: string;
    email: string;
    passwordHash: string;
    role: 'member' | 'admin';
    phone: string;
    profileImage: string;
    location: string;
    bio: string;
    verificationStatus: 'verified' | 'unverified' | 'pending';
    averageRating: number;
    totalReviews: number;
    createdAt: string;
  }>;
  categories: Array<{
    categoryId: string;
    name: string;
    description: string;
    image: string;
    icon: string;
    activeStatus: boolean;
  }>;
  equipment: Array<{
    equipmentId: string;
    ownerId: string;
    name: string;
    description: string;
    categoryId: string;
    images: string[];
    brand: string;
    model: string;
    condition: 'Like New' | 'Excellent' | 'Good' | 'Fair';
    pricePerDay: number;
    securityDeposit: number;
    isFree: boolean;
    location: string;
    pickupInstructions: string;
    safetyInstructions: string;
    availability: 'Available' | 'Reserved' | 'Paused';
    listingStatus: 'Active' | 'Paused' | 'Archived' | 'Flagged';
    createdAt: string;
    updatedAt: string;
  }>;
  bookingRequests: Array<{
    bookingId: string;
    equipmentId: string;
    borrowerId: string;
    ownerId: string;
    startDate: string;
    endDate: string;
    totalDays: number;
    pricePerDay: number;
    securityDeposit: number;
    totalPrice: number;
    status: 'Pending' | 'Approved' | 'Rejected' | 'Active' | 'Returned' | 'Cancelled' | 'Disputed';
    borrowerNotes?: string;
    paymentStatus: 'Not Enabled' | 'Pending' | 'Held in Escrow' | 'Settled' | 'Refunded';
    paymentMethod?: 'UPI' | 'Credit Card' | 'Debit Card';
    paymentTransactionRef?: string;
    paymentDetails?: {
      method: 'UPI' | 'Credit Card' | 'Debit Card';
      transactionId: string;
      paidAt: string;
      cardBrand?: string;
      cardLast4?: string;
      upiId?: string;
      rentalAmount: number;
      depositAmount: number;
      totalPaid: number;
      depositRefundedAt?: string;
      depositRefundRef?: string;
      authorizationCode?: string;
    };
    createdAt: string;
    updatedAt: string;
  }>;
  paymentSettings: {
    gatewayMode: 'sandbox' | 'live';
    upiEnabled: boolean;
    cardsEnabled: boolean;
    merchantVpa: string;
    merchantName: string;
  };
  reviews: Array<{
    reviewId: string;
    bookingId: string;
    reviewerId: string;
    reviewedMemberId: string;
    equipmentId: string;
    rating: number;
    comment: string;
    moderationStatus: 'Approved' | 'Pending' | 'Hidden';
    createdAt: string;
  }>;
  favourites: Array<{
    memberId: string;
    equipmentId: string;
    createdAt: string;
  }>;
  wishlists: Array<{
    memberId: string;
    equipmentId: string;
    notifyWhenAvailable: boolean;
    createdAt: string;
  }>;
  conversations: Array<{
    conversationId: string;
    participantIds: string[];
    equipmentId?: string;
    bookingId?: string;
    lastMessageText: string;
    lastMessageAt: string;
    createdAt: string;
  }>;
  messages: Array<{
    messageId: string;
    conversationId: string;
    senderId: string;
    message: string;
    readBy: string[];
    createdAt: string;
  }>;
  notifications: Array<{
    notificationId: string;
    recipientId: string;
    type: 'booking_request' | 'booking_approved' | 'booking_rejected' | 'booking_cancelled' | 'booking_active' | 'booking_returned' | 'new_message' | 'listing_status' | 'system' | 'payment_received' | 'deposit_refunded';
    title: string;
    message: string;
    relatedId?: string;
    readStatus: boolean;
    createdAt: string;
  }>;
  reports: Array<{
    reportId: string;
    reporterId: string;
    reportedUserId?: string;
    equipmentId?: string;
    reason: string;
    description: string;
    status: 'Pending' | 'Investigating' | 'Resolved' | 'Dismissed';
    createdAt: string;
  }>;
  sessions: Record<string, { memberId: string; expiresAt: number }>;
}

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'neighbourlend_db.json');

export function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password + 'neighbourlend_salt_2026').digest('hex');
}

function getInitialSeedData(): CMSDatabase {
  const adminId = 'mem_admin_001';
  const marcusId = 'mem_marcus_002';
  const sarahId = 'mem_sarah_003';
  const davidId = 'mem_david_004';

  const defaultPassword = hashPassword('password123');

  const members: CMSDatabase['members'] = [
    {
      memberId: adminId,
      fullName: 'Eleanor Vance',
      email: 'admin@neighbourlend.org',
      passwordHash: defaultPassword,
      role: 'admin',
      phone: '+1 (555) 234-5678',
      profileImage: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=300&q=80',
      location: 'Oakridge Green, Sector 4',
      bio: 'Community Tool Library Trustee and NeighbourLend Admin. Passionate about zero-waste neighborhood initiatives and shared stewardship.',
      verificationStatus: 'verified',
      averageRating: 5.0,
      totalReviews: 14,
      createdAt: '2026-01-10T09:00:00.000Z'
    },
    {
      memberId: marcusId,
      fullName: 'Marcus Chen',
      email: 'marcus.chen@example.com',
      passwordHash: defaultPassword,
      role: 'member',
      phone: '+1 (555) 345-6789',
      profileImage: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80',
      location: 'Maplewood District',
      bio: 'Weekend woodworker and garden hobbyist. Happy to lend high-quality power tools and yard gear to respectful neighbours!',
      verificationStatus: 'verified',
      averageRating: 4.9,
      totalReviews: 22,
      createdAt: '2026-01-15T11:30:00.000Z'
    },
    {
      memberId: sarahId,
      fullName: 'Sarah Jenkins',
      email: 'sarah.jenkins@example.com',
      passwordHash: defaultPassword,
      role: 'member',
      phone: '+1 (555) 456-7890',
      profileImage: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=300&q=80',
      location: 'Cedar Heights',
      bio: 'Outdoor lover and camping enthusiast. Lending outdoor expedition tents, hiking gear, and carpet extractors.',
      verificationStatus: 'verified',
      averageRating: 5.0,
      totalReviews: 18,
      createdAt: '2026-02-01T14:15:00.000Z'
    },
    {
      memberId: davidId,
      fullName: 'David Miller',
      email: 'david.miller@example.com',
      passwordHash: defaultPassword,
      role: 'member',
      phone: '+1 (555) 567-8901',
      profileImage: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=300&q=80',
      location: 'Riverbend Valley',
      bio: 'DIY enthusiast and mechanic. Always up for tool exchanges and helping neighbours with heavy home tasks.',
      verificationStatus: 'verified',
      averageRating: 4.8,
      totalReviews: 11,
      createdAt: '2026-02-12T16:45:00.000Z'
    }
  ];

  const categories: CMSDatabase['categories'] = [
    {
      categoryId: 'cat_gardening',
      name: 'Gardening & Landscaping',
      description: 'Lawn mowers, leaf blowers, hedge trimmers, rototillers, and aerators.',
      image: '/src/assets/images/equip_lawn_mower_1794441756586.jpg',
      icon: 'Shovel',
      activeStatus: true
    },
    {
      categoryId: 'cat_powertools',
      name: 'Power Tools & Workshop',
      description: 'Cordless drill kits, circular saws, miter saws, rotary hammers, and sanders.',
      image: '/src/assets/images/equip_cordless_drill_set_1794441755739.jpg',
      icon: 'Wrench',
      activeStatus: true
    },
    {
      categoryId: 'cat_cleaning',
      name: 'Pressure Washers & Cleaning',
      description: 'Commercial pressure washers, carpet extractors, wallpaper steamers, and shop vacs.',
      image: '/src/assets/images/equip_pressure_washer_1794441755362.jpg',
      icon: 'Sparkles',
      activeStatus: true
    },
    {
      categoryId: 'cat_outdoors',
      name: 'Camping & Outdoors',
      description: 'Expedition tents, camp kitchens, portable power stations, roof boxes, and kayaks.',
      image: '/src/assets/images/equip_camping_tent_1794441756299.jpg',
      icon: 'Tent',
      activeStatus: true
    },
    {
      categoryId: 'cat_moving',
      name: 'Moving & Transport',
      description: 'Appliance hand trucks, folding furniture dollies, loading ramps, and trailer hitches.',
      image: '/src/assets/images/hero_community_equipment_1794441755197.jpg',
      icon: 'Truck',
      activeStatus: true
    },
    {
      categoryId: 'cat_av_events',
      name: 'Audio/Visual & Events',
      description: 'Outdoor movie projectors, PA sound systems, marquee party canopies, and lighting.',
      image: '/src/assets/images/hero_community_equipment_1794441755197.jpg',
      icon: 'Volume2',
      activeStatus: true
    }
  ];

  const equipment: CMSDatabase['equipment'] = [
    {
      equipmentId: 'eq_lawnmower_001',
      ownerId: marcusId,
      name: 'EGO Power+ 21" Cordless Self-Propelled Electric Mower',
      description: 'High-torque brushless electric lawn mower with dual 56V 5.0Ah ARC Lithium batteries and rapid charger. Effortless push-button start, 6-position height adjustment, and grass collection bag. Zero emissions and whisper-quiet operation.',
      categoryId: 'cat_gardening',
      images: [
        '/src/assets/images/equip_lawn_mower_1794441756586.jpg',
        '/src/assets/images/hero_community_equipment_1794441755197.jpg'
      ],
      brand: 'EGO Power+',
      model: 'LM2135SP Select Cut',
      condition: 'Like New',
      pricePerDay: 24,
      securityDeposit: 100,
      isFree: false,
      location: 'Maplewood District (Near Maple Park)',
      pickupInstructions: 'Pick up from front garage side gate. Please return with deck cleaned of damp grass cuttings.',
      safetyInstructions: 'Always remove battery key before clearing chute. Safety eye protection and sturdy boots required.',
      availability: 'Available',
      listingStatus: 'Active',
      createdAt: '2026-02-10T10:00:00.000Z',
      updatedAt: '2026-02-10T10:00:00.000Z'
    },
    {
      equipmentId: 'eq_pressurewasher_002',
      ownerId: marcusId,
      name: 'Simpson PowerShot 4200 PSI Pro Gas Pressure Washer',
      description: 'Industrial-strength commercial pressure washer with Honda GX390 engine and AAA industrial triplex plunger pump. Includes 50ft steel-braided hose, quick-connect nozzles (0°, 15°, 25°, 40°, soap), and surface cleaner disc.',
      categoryId: 'cat_cleaning',
      images: [
        '/src/assets/images/equip_pressure_washer_1794441755362.jpg'
      ],
      brand: 'Simpson',
      model: 'PS4240 4.0 GPM',
      condition: 'Excellent',
      pricePerDay: 35,
      securityDeposit: 150,
      isFree: false,
      location: 'Maplewood District',
      pickupInstructions: 'Owner will demonstrate starting procedure and hose attachment on collection. Fuel must be regular unleaded.',
      safetyInstructions: 'Never point high-pressure stream at people, pets, or electrical boxes. Wear safety goggles and hearing protection.',
      availability: 'Available',
      listingStatus: 'Active',
      createdAt: '2026-02-12T11:00:00.000Z',
      updatedAt: '2026-02-12T11:00:00.000Z'
    },
    {
      equipmentId: 'eq_drillset_003',
      ownerId: davidId,
      name: 'DeWalt 20V MAX XR Brushless Hammer Drill & Impact Driver Combo',
      description: 'Heavy-duty 2-tool combo kit with 3-speed hammer drill, high-torque impact driver, two 5.0Ah batteries, fast charger, and 30-piece drill/driver bit set in TSTAK hard case. Ideal for masonry drilling, framing, and deck builds.',
      categoryId: 'cat_powertools',
      images: [
        '/src/assets/images/equip_cordless_drill_set_1794441755739.jpg'
      ],
      brand: 'DeWalt',
      model: 'DCK299P2 XR',
      condition: 'Like New',
      pricePerDay: 15,
      securityDeposit: 80,
      isFree: false,
      location: 'Riverbend Valley',
      pickupInstructions: 'Available for evening or weekend pickup from covered porch lockbox (code provided upon booking approval).',
      safetyInstructions: 'Clamp workpieces securely. Do not exceed recommended torque for small fasteners.',
      availability: 'Available',
      listingStatus: 'Active',
      createdAt: '2026-02-15T09:30:00.000Z',
      updatedAt: '2026-02-15T09:30:00.000Z'
    },
    {
      equipmentId: 'eq_tent_004',
      ownerId: sarahId,
      name: 'North Face Mountain 25 Geodesic 4-Person 4-Season Tent',
      description: 'Bombproof 4-season all-weather expedition tent with lightweight aluminum DAC poles, dual doors, fully taped waterproof rainfly, interior gear loft, and snow stakes. Kept in pristine condition, dried and aired after every trip.',
      categoryId: 'cat_outdoors',
      images: [
        '/src/assets/images/equip_camping_tent_1794441756299.jpg'
      ],
      brand: 'The North Face',
      model: 'Mountain 25 Summit Series',
      condition: 'Excellent',
      pricePerDay: 28,
      securityDeposit: 120,
      isFree: false,
      location: 'Cedar Heights',
      pickupInstructions: 'Pick up anytime between 8 AM and 7 PM. Includes footprint ground tarp and stake puller.',
      safetyInstructions: 'Never cook or operate open flames inside the tent. Ensure tent is fully dry before returning.',
      availability: 'Available',
      listingStatus: 'Active',
      createdAt: '2026-02-18T13:00:00.000Z',
      updatedAt: '2026-02-18T13:00:00.000Z'
    },
    {
      equipmentId: 'eq_dolly_005',
      ownerId: adminId,
      name: 'Harper Heavy-Duty 800lb Convertible Appliance Dolly & Hand Truck',
      description: 'Community sharing item provided free to local neighbours for weekend moves! Converts easily from 2-wheel upright hand truck to 4-wheel platform cart with pneumatic tires and stair-climber glides. Solid steel construction.',
      categoryId: 'cat_moving',
      images: [
        '/src/assets/images/hero_community_equipment_1794441755197.jpg'
      ],
      brand: 'Harper Trucks',
      model: '800# Steel Convertible',
      condition: 'Good',
      pricePerDay: 0,
      securityDeposit: 25,
      isFree: true,
      location: 'Oakridge Green, Sector 4',
      pickupInstructions: 'Community equipment shed beside Sector 4 community center. Access code sent on confirmed booking.',
      safetyInstructions: 'Secure heavy appliances with ratchet straps (straps provided in bottom pouch). Do not overload above 800 lbs.',
      availability: 'Available',
      listingStatus: 'Active',
      createdAt: '2026-01-20T08:00:00.000Z',
      updatedAt: '2026-01-20T08:00:00.000Z'
    },
    {
      equipmentId: 'eq_hedgetrimmer_006',
      ownerId: sarahId,
      name: 'Stihl Cordless 24" Dual-Action Hedge Trimmer',
      description: 'Free neighbor-shared 36V hedge trimmer. Diamond-ground blades slice cleanly through branches up to 3/4 inch. Light, well-balanced, and zero fumes. Comes with blade guard, battery, and safety glasses.',
      categoryId: 'cat_gardening',
      images: [
        '/src/assets/images/equip_lawn_mower_1794441756586.jpg'
      ],
      brand: 'Stihl',
      model: 'HSA 66 Cordless',
      condition: 'Good',
      pricePerDay: 0,
      securityDeposit: 30,
      isFree: true,
      location: 'Cedar Heights',
      pickupInstructions: 'Collect from Sarah at Cedar Heights. Happy to provide a quick 2-minute safety walk-through.',
      safetyInstructions: 'Two-handed grip required at all times. Keep hands away from blade teeth even when halted.',
      availability: 'Available',
      listingStatus: 'Active',
      createdAt: '2026-02-22T10:00:00.000Z',
      updatedAt: '2026-02-22T10:00:00.000Z'
    }
  ];

  const bookingRequests: CMSDatabase['bookingRequests'] = [
    {
      bookingId: 'bk_demo_completed_001',
      equipmentId: 'eq_drillset_003',
      borrowerId: sarahId,
      ownerId: davidId,
      startDate: '2026-02-20',
      endDate: '2026-02-22',
      totalDays: 3,
      pricePerDay: 15,
      securityDeposit: 80,
      totalPrice: 45,
      status: 'Returned',
      borrowerNotes: 'Needed to install shelving in the basement. Handled with care!',
      paymentStatus: 'Settled',
      paymentMethod: 'Credit Card',
      paymentTransactionRef: 'TX_CC_8849201',
      paymentDetails: {
        method: 'Credit Card',
        transactionId: 'TX_CC_8849201',
        paidAt: '2026-02-18T14:02:00.000Z',
        cardBrand: 'Visa',
        cardLast4: '4242',
        rentalAmount: 45,
        depositAmount: 80,
        totalPaid: 125,
        depositRefundedAt: '2026-02-22T18:05:00.000Z',
        depositRefundRef: 'REF_DEP_77201',
        authorizationCode: 'AUTH_99214'
      },
      createdAt: '2026-02-18T14:00:00.000Z',
      updatedAt: '2026-02-22T18:00:00.000Z'
    },
    {
      bookingId: 'bk_demo_active_002',
      equipmentId: 'eq_lawnmower_001',
      borrowerId: davidId,
      ownerId: marcusId,
      startDate: '2026-03-01',
      endDate: '2026-03-03',
      totalDays: 3,
      pricePerDay: 24,
      securityDeposit: 100,
      totalPrice: 72,
      status: 'Active',
      borrowerNotes: 'First spring grass cut for our front and rear lawns.',
      paymentStatus: 'Held in Escrow',
      paymentMethod: 'UPI',
      paymentTransactionRef: 'TX_UPI_9104822',
      paymentDetails: {
        method: 'UPI',
        transactionId: 'TX_UPI_9104822',
        paidAt: '2026-02-28T09:05:00.000Z',
        upiId: 'david.miller@oksbi',
        rentalAmount: 72,
        depositAmount: 100,
        totalPaid: 172,
        authorizationCode: 'UPI_REF_399104'
      },
      createdAt: '2026-02-28T09:00:00.000Z',
      updatedAt: '2026-03-01T10:00:00.000Z'
    },
    {
      bookingId: 'bk_demo_pending_003',
      equipmentId: 'eq_pressurewasher_002',
      borrowerId: sarahId,
      ownerId: marcusId,
      startDate: '2026-03-10',
      endDate: '2026-03-11',
      totalDays: 2,
      pricePerDay: 35,
      securityDeposit: 150,
      totalPrice: 70,
      status: 'Pending',
      borrowerNotes: 'Hi Marcus! Would love to borrow your pressure washer to clean our cedar deck before staining.',
      paymentStatus: 'Pending',
      createdAt: '2026-03-02T11:20:00.000Z',
      updatedAt: '2026-03-02T11:20:00.000Z'
    }
  ];

  const reviews: CMSDatabase['reviews'] = [
    {
      reviewId: 'rev_001',
      bookingId: 'bk_demo_completed_001',
      reviewerId: sarahId,
      reviewedMemberId: davidId,
      equipmentId: 'eq_drillset_003',
      rating: 5,
      comment: 'David is a fantastic lender! The DeWalt drill set was fully charged with extra bits, neatly stored, and performed like a dream. Highly recommend borrowing from him!',
      moderationStatus: 'Approved',
      createdAt: '2026-02-23T10:00:00.000Z'
    }
  ];

  const favourites: CMSDatabase['favourites'] = [
    { memberId: marcusId, equipmentId: 'eq_tent_004', createdAt: '2026-02-20T10:00:00.000Z' },
    { memberId: sarahId, equipmentId: 'eq_pressurewasher_002', createdAt: '2026-02-21T11:00:00.000Z' },
    { memberId: davidId, equipmentId: 'eq_dolly_005', createdAt: '2026-02-22T12:00:00.000Z' }
  ];

  const wishlists: CMSDatabase['wishlists'] = [
    { memberId: davidId, equipmentId: 'eq_lawnmower_001', notifyWhenAvailable: true, createdAt: '2026-02-22T12:00:00.000Z' },
    { memberId: sarahId, equipmentId: 'eq_drillset_003', notifyWhenAvailable: true, createdAt: '2026-02-23T14:00:00.000Z' }
  ];

  const conversationId1 = 'conv_sarah_marcus_001';
  const conversations: CMSDatabase['conversations'] = [
    {
      conversationId: conversationId1,
      participantIds: [sarahId, marcusId],
      equipmentId: 'eq_pressurewasher_002',
      bookingId: 'bk_demo_pending_003',
      lastMessageText: 'Sounds great! I will have the nozzle attachments and hose ready on the porch.',
      lastMessageAt: '2026-03-02T11:35:00.000Z',
      createdAt: '2026-03-02T11:20:00.000Z'
    }
  ];

  const messages: CMSDatabase['messages'] = [
    {
      messageId: 'msg_001',
      conversationId: conversationId1,
      senderId: sarahId,
      message: 'Hi Marcus, just requested your Simpson Pressure Washer for next weekend! Let me know if that works.',
      readBy: [sarahId, marcusId],
      createdAt: '2026-03-02T11:22:00.000Z'
    },
    {
      messageId: 'msg_002',
      conversationId: conversationId1,
      senderId: marcusId,
      message: 'Sounds great! I will have the nozzle attachments and hose ready on the porch.',
      readBy: [marcusId],
      createdAt: '2026-03-02T11:35:00.000Z'
    }
  ];

  const notifications: CMSDatabase['notifications'] = [
    {
      notificationId: 'notif_001',
      recipientId: marcusId,
      type: 'booking_request',
      title: 'New Booking Request',
      message: 'Sarah Jenkins requested to borrow your Simpson Pressure Washer for 2 days ($70).',
      relatedId: 'bk_demo_pending_003',
      readStatus: false,
      createdAt: '2026-03-02T11:20:00.000Z'
    },
    {
      notificationId: 'notif_002',
      recipientId: davidId,
      type: 'booking_approved',
      title: 'Lawn Mower Handover Active',
      message: 'Marcus Chen confirmed equipment collection. Please return on March 3rd.',
      relatedId: 'bk_demo_active_002',
      readStatus: true,
      createdAt: '2026-03-01T10:00:00.000Z'
    }
  ];

  const reports: CMSDatabase['reports'] = [
    {
      reportId: 'rep_001',
      reporterId: davidId,
      reportedUserId: undefined,
      equipmentId: 'eq_lawnmower_001',
      reason: 'Inaccurate Category Spec',
      description: 'Minor listing feedback: noted deck width is 21" instead of 20", verified accurate now.',
      status: 'Resolved',
      createdAt: '2026-02-15T09:00:00.000Z'
    }
  ];

  return {
    members,
    categories,
    equipment,
    bookingRequests,
    reviews,
    favourites,
    wishlists,
    conversations,
    messages,
    notifications,
    reports,
    paymentSettings: {
      gatewayMode: 'live',
      upiEnabled: true,
      cardsEnabled: true,
      merchantVpa: 'neighbourlend@okhdfcbank',
      merchantName: 'NeighbourLend Community Network'
    },
    sessions: {}
  };
}

class DBManager {
  private db: CMSDatabase;

  constructor() {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }

    if (fs.existsSync(DB_FILE)) {
      try {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        this.db = JSON.parse(raw);
        // Ensure all collections exist
        if (!this.db.members || !this.db.equipment) {
          this.db = getInitialSeedData();
          this.save();
        }
        if (!this.db.wishlists) {
          this.db.wishlists = [];
          this.save();
        }
        if (!this.db.paymentSettings) {
          this.db.paymentSettings = {
            gatewayMode: 'live',
            upiEnabled: true,
            cardsEnabled: true,
            merchantVpa: 'neighbourlend@okhdfcbank',
            merchantName: 'NeighbourLend Community Network'
          };
          this.save();
        }
      } catch {
        this.db = getInitialSeedData();
        this.save();
      }
    } else {
      this.db = getInitialSeedData();
      this.save();
    }
  }

  public get data(): CMSDatabase {
    return this.db;
  }

  public save(): void {
    try {
      const tempPath = DB_FILE + '.tmp';
      fs.writeFileSync(tempPath, JSON.stringify(this.db, null, 2), 'utf-8');
      fs.renameSync(tempPath, DB_FILE);
    } catch (err) {
      console.error('Failed to save DB:', err);
    }
  }
}

export const dbManager = new DBManager();
export const db = dbManager.data;
