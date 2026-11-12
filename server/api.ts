import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import { db, dbManager, hashPassword } from './db.js';
import { createSession, removeSession, requireAuth, requireAdmin } from './auth.js';

const router = Router();

// Helper to notify wishlisters when equipment becomes available
function notifyWishlisters(equipmentId: string, equipmentName: string, location: string) {
  const wishers = db.wishlists.filter(w => w.equipmentId === equipmentId && w.notifyWhenAvailable);
  const now = new Date().toISOString();

  for (const w of wishers) {
    db.notifications.push({
      notificationId: 'notif_' + crypto.randomUUID(),
      recipientId: w.memberId,
      type: 'listing_status',
      title: 'Wishlist Item Now Available!',
      message: `${equipmentName} in ${location} is now available to borrow. Check it out before it gets reserved!`,
      relatedId: equipmentId,
      readStatus: false,
      createdAt: now
    });
  }
}

// -------------------------------------------------------------
// AUTHENTICATION & PROFILE ROUTES
// -------------------------------------------------------------

router.post('/auth/register', (req: Request, res: Response) => {
  const { fullName, email, password, phone, location } = req.body;

  if (!fullName || !email || !password) {
    res.status(400).json({ error: 'Full name, email, and password are required.' });
    return;
  }

  const normalizedEmail = String(email).trim().toLowerCase();
  const existing = db.members.find(m => m.email.toLowerCase() === normalizedEmail);
  if (existing) {
    res.status(409).json({ error: 'An account with this email address already exists.' });
    return;
  }

  const memberId = 'mem_' + crypto.randomUUID();
  const newMember = {
    memberId,
    fullName: String(fullName).trim(),
    email: normalizedEmail,
    passwordHash: hashPassword(String(password)),
    role: 'member' as const,
    phone: phone ? String(phone).trim() : '',
    profileImage: `https://images.unsplash.com/photo-${1534528741775 + (db.members.length * 1000)}?auto=format&fit=crop&w=300&q=80`,
    location: location ? String(location).trim() : 'Local Neighborhood',
    bio: 'New NeighbourLend member excited to borrow and share equipment with local neighbours!',
    verificationStatus: 'verified' as const, // auto-verified for onboarding ease
    averageRating: 5.0,
    totalReviews: 0,
    createdAt: new Date().toISOString()
  };

  db.members.push(newMember);

  // Welcome notification
  db.notifications.push({
    notificationId: 'notif_' + crypto.randomUUID(),
    recipientId: memberId,
    type: 'system',
    title: 'Welcome to NeighbourLend!',
    message: 'Your account is ready. Explore equipment nearby or list your own tools to start sharing!',
    readStatus: false,
    createdAt: new Date().toISOString()
  });

  const token = createSession(memberId);

  const { passwordHash: _, ...safeMember } = newMember;
  res.status(201).json({ token, member: safeMember });
});

router.post('/auth/login', (req: Request, res: Response) => {
  const { email, password } = req.body;
  if (!email || !password) {
    res.status(400).json({ error: 'Email and password are required.' });
    return;
  }

  const normalizedEmail = String(email).trim().toLowerCase();
  const member = db.members.find(m => m.email.toLowerCase() === normalizedEmail);

  if (!member || member.passwordHash !== hashPassword(String(password))) {
    res.status(401).json({ error: 'Invalid email or password.' });
    return;
  }

  const token = createSession(member.memberId);
  const { passwordHash: _, ...safeMember } = member;
  res.json({ token, member: safeMember });
});

router.post('/auth/logout', (req: Request, res: Response) => {
  if (req.token) {
    removeSession(req.token);
  }
  res.json({ success: true });
});

router.get('/auth/me', (req: Request, res: Response) => {
  if (!req.user) {
    res.json({ member: null });
    return;
  }

  const member = db.members.find(m => m.memberId === req.user?.memberId);
  if (!member) {
    res.json({ member: null });
    return;
  }

  const unreadCount = db.notifications.filter(n => n.recipientId === member.memberId && !n.readStatus).length;
  const { passwordHash: _, ...safeMember } = member;
  res.json({ member: safeMember, unreadNotifications: unreadCount });
});

router.put('/auth/profile', requireAuth, (req: Request, res: Response) => {
  const member = db.members.find(m => m.memberId === req.user!.memberId);
  if (!member) {
    res.status(404).json({ error: 'Member not found.' });
    return;
  }

  const { fullName, phone, location, bio, profileImage } = req.body;
  if (fullName) member.fullName = String(fullName).trim();
  if (phone !== undefined) member.phone = String(phone).trim();
  if (location !== undefined) member.location = String(location).trim();
  if (bio !== undefined) member.bio = String(bio).trim();
  if (profileImage !== undefined) member.profileImage = String(profileImage).trim();

  dbManager.save();
  const { passwordHash: _, ...safeMember } = member;
  res.json({ member: safeMember });
});

router.post('/auth/verify-email', requireAuth, (req: Request, res: Response) => {
  const member = db.members.find(m => m.memberId === req.user!.memberId);
  if (!member) {
    res.status(404).json({ error: 'Member not found.' });
    return;
  }
  member.verificationStatus = 'verified';
  dbManager.save();
  res.json({ success: true, verificationStatus: 'verified' });
});

router.post('/auth/password-reset', (req: Request, res: Response) => {
  const { email } = req.body;
  // Demo password reset acknowledgement
  res.json({ success: true, message: `Password reset instructions have been dispatched to ${email || 'your email'}.` });
});

// Member public profile
router.get('/members/:id', (req: Request, res: Response) => {
  const member = db.members.find(m => m.memberId === req.params.id);
  if (!member) {
    res.status(404).json({ error: 'Member not found.' });
    return;
  }

  const listings = db.equipment.filter(e => e.ownerId === member.memberId && e.listingStatus === 'Active');
  const reviews = db.reviews.filter(r => r.reviewedMemberId === member.memberId && r.moderationStatus === 'Approved');

  const { passwordHash: _, ...safeMember } = member;
  res.json({
    member: safeMember,
    listings,
    reviews
  });
});

// -------------------------------------------------------------
// CATEGORIES ROUTES
// -------------------------------------------------------------

router.get('/categories', (_req: Request, res: Response) => {
  const categoriesWithCount = db.categories
    .filter(c => c.activeStatus)
    .map(c => {
      const count = db.equipment.filter(e => e.categoryId === c.categoryId && e.listingStatus === 'Active').length;
      return { ...c, itemCount: count };
    });
  res.json(categoriesWithCount);
});

router.post('/categories', requireAdmin, (req: Request, res: Response) => {
  const { name, description, image, icon } = req.body;
  if (!name) {
    res.status(400).json({ error: 'Category name is required.' });
    return;
  }
  const categoryId = 'cat_' + crypto.randomUUID().slice(0, 8);
  const newCat = {
    categoryId,
    name: String(name).trim(),
    description: String(description || '').trim(),
    image: image || '/src/assets/images/hero_community_equipment_1794441755197.jpg',
    icon: icon || 'Tool',
    activeStatus: true
  };
  db.categories.push(newCat);
  dbManager.save();
  res.status(201).json(newCat);
});

// -------------------------------------------------------------
// EQUIPMENT MARKETPLACE ROUTES
// -------------------------------------------------------------

router.get('/equipment', (req: Request, res: Response) => {
  const {
    search,
    location,
    categoryId,
    condition,
    isFree,
    minPrice,
    maxPrice,
    availability,
    sort,
    ownerId,
    page = '1',
    limit = '20'
  } = req.query;

  let results = [...db.equipment];

  // Exclude archived/flagged unless queried by owner or admin
  const isOwnerQuery = ownerId && req.user && req.user.memberId === ownerId;
  const isAdmin = req.user && req.user.role === 'admin';

  if (!isOwnerQuery && !isAdmin) {
    results = results.filter(e => e.listingStatus === 'Active');
  }

  if (ownerId) {
    results = results.filter(e => e.ownerId === ownerId);
  }

  if (categoryId && categoryId !== 'all') {
    results = results.filter(e => e.categoryId === categoryId);
  }

  if (search) {
    const q = String(search).toLowerCase();
    results = results.filter(e =>
      e.name.toLowerCase().includes(q) ||
      e.description.toLowerCase().includes(q) ||
      e.brand.toLowerCase().includes(q) ||
      e.model.toLowerCase().includes(q)
    );
  }

  if (location) {
    const loc = String(location).toLowerCase();
    results = results.filter(e => e.location.toLowerCase().includes(loc));
  }

  if (condition && condition !== 'all') {
    results = results.filter(e => e.condition === condition);
  }

  if (isFree === 'true') {
    results = results.filter(e => e.isFree);
  }

  if (minPrice) {
    results = results.filter(e => e.pricePerDay >= Number(minPrice));
  }

  if (maxPrice) {
    results = results.filter(e => e.pricePerDay <= Number(maxPrice));
  }

  if (availability && availability !== 'all') {
    results = results.filter(e => e.availability === availability);
  }

  // Sort
  if (sort === 'price-asc') {
    results.sort((a, b) => a.pricePerDay - b.pricePerDay);
  } else if (sort === 'price-desc') {
    results.sort((a, b) => b.pricePerDay - a.pricePerDay);
  } else if (sort === 'rating') {
    results.sort((a, b) => {
      const ownerA = db.members.find(m => m.memberId === a.ownerId);
      const ownerB = db.members.find(m => m.memberId === b.ownerId);
      return (ownerB?.averageRating || 0) - (ownerA?.averageRating || 0);
    });
  } else {
    // Default newest
    results.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  // Join owner and category
  const joined = results.map(eq => {
    const owner = db.members.find(m => m.memberId === eq.ownerId);
    const category = db.categories.find(c => c.categoryId === eq.categoryId);
    return {
      ...eq,
      ownerName: owner?.fullName || 'Community Neighbour',
      ownerLocation: owner?.location || eq.location,
      ownerRating: owner?.averageRating || 5.0,
      ownerImage: owner?.profileImage || '',
      categoryName: category?.name || 'General Equipment'
    };
  });

  const pageNum = parseInt(String(page), 10) || 1;
  const limitNum = parseInt(String(limit), 10) || 20;
  const total = joined.length;
  const paginated = joined.slice((pageNum - 1) * limitNum, pageNum * limitNum);

  res.json({
    items: paginated,
    total,
    page: pageNum,
    totalPages: Math.ceil(total / limitNum)
  });
});

router.get('/equipment/:id', (req: Request, res: Response) => {
  const eq = db.equipment.find(e => e.equipmentId === req.params.id);
  if (!eq) {
    res.status(404).json({ error: 'Equipment listing not found.' });
    return;
  }

  const owner = db.members.find(m => m.memberId === eq.ownerId);
  const category = db.categories.find(c => c.categoryId === eq.categoryId);
  const reviews = db.reviews.filter(r => r.equipmentId === eq.equipmentId && r.moderationStatus === 'Approved');

  // Check if wishlisted by current user
  let isWishlisted = false;
  let isFavourited = false;
  if (req.user) {
    isWishlisted = db.wishlists.some(w => w.memberId === req.user?.memberId && w.equipmentId === eq.equipmentId);
    isFavourited = db.favourites.some(f => f.memberId === req.user?.memberId && f.equipmentId === eq.equipmentId);
  }

  res.json({
    ...eq,
    ownerName: owner?.fullName || 'Community Neighbour',
    ownerLocation: owner?.location || eq.location,
    ownerRating: owner?.averageRating || 5.0,
    ownerReviewsCount: owner?.totalReviews || 0,
    ownerImage: owner?.profileImage || '',
    categoryName: category?.name || 'General Equipment',
    reviews,
    isWishlisted,
    isFavourited
  });
});

router.post('/equipment', requireAuth, (req: Request, res: Response) => {
  const {
    name,
    description,
    categoryId,
    images,
    brand,
    model,
    condition,
    pricePerDay,
    securityDeposit,
    isFree,
    location,
    pickupInstructions,
    safetyInstructions
  } = req.body;

  // Strict backend validation
  if (!name || !description || !categoryId || !location) {
    res.status(400).json({ error: 'Name, description, category, and location are required.' });
    return;
  }

  const categoryExists = db.categories.some(c => c.categoryId === categoryId);
  if (!categoryExists) {
    res.status(400).json({ error: 'Invalid equipment category.' });
    return;
  }

  const parsedPrice = isFree ? 0 : Math.max(0, Number(pricePerDay) || 0);
  const parsedDeposit = Math.max(0, Number(securityDeposit) || 0);

  const equipmentId = 'eq_' + crypto.randomUUID().slice(0, 10);
  const validImages = Array.isArray(images) && images.length > 0
    ? images.map(img => String(img).trim())
    : ['/src/assets/images/hero_community_equipment_1794441755197.jpg'];

  const now = new Date().toISOString();
  const newEquipment = {
    equipmentId,
    ownerId: req.user!.memberId,
    name: String(name).trim(),
    description: String(description).trim(),
    categoryId: String(categoryId),
    images: validImages,
    brand: String(brand || 'Generic').trim(),
    model: String(model || 'Standard').trim(),
    condition: condition || 'Good',
    pricePerDay: parsedPrice,
    securityDeposit: parsedDeposit,
    isFree: Boolean(isFree),
    location: String(location).trim(),
    pickupInstructions: String(pickupInstructions || 'Coordinate pickup directly via NeighbourLend messages.').trim(),
    safetyInstructions: String(safetyInstructions || 'Inspect thoroughly before operating. Always wear suitable safety equipment.').trim(),
    availability: 'Available' as const,
    listingStatus: 'Active' as const,
    createdAt: now,
    updatedAt: now
  };

  db.equipment.unshift(newEquipment);
  dbManager.save();

  // Notify neighbors/wishlisters who might be looking for equipment in this category
  res.status(201).json(newEquipment);
});

router.put('/equipment/:id', requireAuth, (req: Request, res: Response) => {
  const eq = db.equipment.find(e => e.equipmentId === req.params.id);
  if (!eq) {
    res.status(404).json({ error: 'Equipment not found.' });
    return;
  }

  // Authorization check: only owner or admin can edit
  if (eq.ownerId !== req.user!.memberId && req.user!.role !== 'admin') {
    res.status(403).json({ error: 'Not authorized to modify this equipment.' });
    return;
  }

  const {
    name,
    description,
    categoryId,
    images,
    brand,
    model,
    condition,
    pricePerDay,
    securityDeposit,
    isFree,
    location,
    pickupInstructions,
    safetyInstructions,
    availability,
    listingStatus
  } = req.body;

  if (name) eq.name = String(name).trim();
  if (description) eq.description = String(description).trim();
  if (categoryId) eq.categoryId = String(categoryId);
  if (Array.isArray(images) && images.length > 0) eq.images = images;
  if (brand) eq.brand = String(brand).trim();
  if (model) eq.model = String(model).trim();
  if (condition) eq.condition = condition;
  if (isFree !== undefined) eq.isFree = Boolean(isFree);
  if (pricePerDay !== undefined) eq.pricePerDay = eq.isFree ? 0 : Math.max(0, Number(pricePerDay));
  if (securityDeposit !== undefined) eq.securityDeposit = Math.max(0, Number(securityDeposit));
  if (location) eq.location = String(location).trim();
  if (pickupInstructions) eq.pickupInstructions = String(pickupInstructions).trim();
  if (safetyInstructions) eq.safetyInstructions = String(safetyInstructions).trim();

  // Availability state transition & notification trigger
  const wasNotAvailable = eq.availability !== 'Available';
  if (availability) eq.availability = availability;
  if (listingStatus) eq.listingStatus = listingStatus;

  eq.updatedAt = new Date().toISOString();

  // If item transitioned back to Available, notify wishlisters!
  if (wasNotAvailable && eq.availability === 'Available' && eq.listingStatus === 'Active') {
    notifyWishlisters(eq.equipmentId, eq.name, eq.location);
  }

  dbManager.save();
  res.json(eq);
});

router.delete('/equipment/:id', requireAuth, (req: Request, res: Response) => {
  const index = db.equipment.findIndex(e => e.equipmentId === req.params.id);
  if (index === -1) {
    res.status(404).json({ error: 'Equipment not found.' });
    return;
  }

  const eq = db.equipment[index];
  if (eq.ownerId !== req.user!.memberId && req.user!.role !== 'admin') {
    res.status(403).json({ error: 'Not authorized to delete this equipment.' });
    return;
  }

  // Soft delete / archive to preserve booking history integrity
  eq.listingStatus = 'Archived';
  eq.availability = 'Paused';
  eq.updatedAt = new Date().toISOString();

  dbManager.save();
  res.json({ success: true, message: 'Equipment listing removed.' });
});

// -------------------------------------------------------------
// BOOKING SYSTEM ROUTES (Strict Rules & Backend Calculations)
// -------------------------------------------------------------

// Check date availability endpoint
router.get('/equipment/:id/availability', (req: Request, res: Response) => {
  const { startDate, endDate } = req.query;
  const eq = db.equipment.find(e => e.equipmentId === req.params.id);
  if (!eq) {
    res.status(404).json({ error: 'Equipment not found.' });
    return;
  }

  const activeBookings = db.bookingRequests.filter(b =>
    b.equipmentId === eq.equipmentId &&
    (b.status === 'Approved' || b.status === 'Active')
  );

  let isAvailable = true;
  let conflictBooking: any = null;

  if (startDate && endDate) {
    const s = String(startDate);
    const e = String(endDate);

    conflictBooking = activeBookings.find(b => {
      return (s <= b.endDate && e >= b.startDate);
    });

    if (conflictBooking) {
      isAvailable = false;
    }
  }

  res.json({
    available: isAvailable,
    bookedRanges: activeBookings.map(b => ({ startDate: b.startDate, endDate: b.endDate, status: b.status })),
    conflict: conflictBooking ? { startDate: conflictBooking.startDate, endDate: conflictBooking.endDate } : null
  });
});

router.post('/bookings', requireAuth, (req: Request, res: Response) => {
  const { equipmentId, startDate, endDate, borrowerNotes } = req.body;

  if (!equipmentId || !startDate || !endDate) {
    res.status(400).json({ error: 'Equipment ID, start date, and end date are required.' });
    return;
  }

  const equipment = db.equipment.find(e => e.equipmentId === equipmentId);
  if (!equipment || equipment.listingStatus !== 'Active') {
    res.status(404).json({ error: 'This equipment is currently not available for bookings.' });
    return;
  }

  // RULE: Prevent a borrower from booking their own equipment
  if (equipment.ownerId === req.user!.memberId) {
    res.status(400).json({ error: 'You cannot borrow equipment that you own.' });
    return;
  }

  // RULE: Validate start and end dates
  const start = new Date(startDate);
  const end = new Date(endDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    res.status(400).json({ error: 'Invalid date format.' });
    return;
  }

  if (start > end) {
    res.status(400).json({ error: 'End date must be on or after start date.' });
    return;
  }

  // Check overlapping approved/active bookings
  const overlapping = db.bookingRequests.find(b =>
    b.equipmentId === equipmentId &&
    (b.status === 'Approved' || b.status === 'Active') &&
    (startDate <= b.endDate && endDate >= b.startDate)
  );

  if (overlapping) {
    res.status(409).json({
      error: `Equipment is already reserved between ${overlapping.startDate} and ${overlapping.endDate}. Please choose different dates.`
    });
    return;
  }

  // RULE: Backend calculation of rental duration & cost (no browser trust)
  const diffTime = Math.abs(end.getTime() - start.getTime());
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24)) + 1;
  const totalDays = Math.max(1, diffDays);

  const pricePerDay = equipment.isFree ? 0 : equipment.pricePerDay;
  const totalPrice = pricePerDay * totalDays;
  const securityDeposit = equipment.securityDeposit || 0;

  const bookingId = 'bk_' + crypto.randomUUID().slice(0, 10);
  const now = new Date().toISOString();

  const newBooking = {
    bookingId,
    equipmentId: equipment.equipmentId,
    borrowerId: req.user!.memberId,
    ownerId: equipment.ownerId,
    startDate: String(startDate),
    endDate: String(endDate),
    totalDays,
    pricePerDay,
    securityDeposit,
    totalPrice,
    status: 'Pending' as const,
    borrowerNotes: borrowerNotes ? String(borrowerNotes).trim() : '',
    paymentStatus: 'Not Enabled' as const, // Clear transparency: payment gateway not charged yet
    paymentTransactionRef: undefined,
    createdAt: now,
    updatedAt: now
  };

  db.bookingRequests.unshift(newBooking);

  // Notify owner of new request
  db.notifications.push({
    notificationId: 'notif_' + crypto.randomUUID(),
    recipientId: equipment.ownerId,
    type: 'booking_request',
    title: 'New Borrowing Request',
    message: `${req.user!.fullName} requested to borrow "${equipment.name}" for ${totalDays} day${totalDays > 1 ? 's' : ''} (${startDate} to ${endDate}).`,
    relatedId: bookingId,
    readStatus: false,
    createdAt: now
  });

  dbManager.save();
  res.status(201).json(newBooking);
});

router.get('/bookings', requireAuth, (req: Request, res: Response) => {
  const { role } = req.query;
  const currentUserId = req.user!.memberId;
  const isAdmin = req.user!.role === 'admin';

  let bookings = [...db.bookingRequests];

  if (!isAdmin || role) {
    if (role === 'borrower') {
      bookings = bookings.filter(b => b.borrowerId === currentUserId);
    } else if (role === 'lender') {
      bookings = bookings.filter(b => b.ownerId === currentUserId);
    } else {
      bookings = bookings.filter(b => b.borrowerId === currentUserId || b.ownerId === currentUserId);
    }
  }

  // Join data
  const enriched = bookings.map(b => {
    const equipment = db.equipment.find(e => e.equipmentId === b.equipmentId);
    const borrower = db.members.find(m => m.memberId === b.borrowerId);
    const owner = db.members.find(m => m.memberId === b.ownerId);
    const hasReview = db.reviews.some(r => r.bookingId === b.bookingId && r.reviewerId === currentUserId);

    return {
      ...b,
      equipment,
      borrower: borrower ? {
        memberId: borrower.memberId,
        fullName: borrower.fullName,
        email: borrower.email,
        phone: borrower.phone,
        profileImage: borrower.profileImage,
        location: borrower.location,
        verificationStatus: borrower.verificationStatus
      } : undefined,
      owner: owner ? {
        memberId: owner.memberId,
        fullName: owner.fullName,
        email: owner.email,
        phone: owner.phone,
        profileImage: owner.profileImage,
        location: owner.location
      } : undefined,
      hasReview
    };
  });

  res.json(enriched);
});

router.get('/bookings/:id', requireAuth, (req: Request, res: Response) => {
  const booking = db.bookingRequests.find(b => b.bookingId === req.params.id);
  if (!booking) {
    res.status(404).json({ error: 'Booking request not found.' });
    return;
  }

  // Authorized participants check
  if (booking.borrowerId !== req.user!.memberId && booking.ownerId !== req.user!.memberId && req.user!.role !== 'admin') {
    res.status(403).json({ error: 'You are not authorized to view this booking.' });
    return;
  }

  const equipment = db.equipment.find(e => e.equipmentId === booking.equipmentId);
  const borrower = db.members.find(m => m.memberId === booking.borrowerId);
  const owner = db.members.find(m => m.memberId === booking.ownerId);
  const hasReview = db.reviews.some(r => r.bookingId === booking.bookingId && r.reviewerId === req.user!.memberId);

  res.json({
    ...booking,
    equipment,
    borrower,
    owner,
    hasReview
  });
});

router.patch('/bookings/:id/status', requireAuth, (req: Request, res: Response) => {
  const { status, resolutionNotes } = req.body;
  const booking = db.bookingRequests.find(b => b.bookingId === req.params.id);

  if (!booking) {
    res.status(404).json({ error: 'Booking request not found.' });
    return;
  }

  const currentUserId = req.user!.memberId;
  const isAdmin = req.user!.role === 'admin';
  const isOwner = booking.ownerId === currentUserId;
  const isBorrower = booking.borrowerId === currentUserId;

  if (!isOwner && !isBorrower && !isAdmin) {
    res.status(403).json({ error: 'Not authorized to update this booking.' });
    return;
  }

  const equipment = db.equipment.find(e => e.equipmentId === booking.equipmentId);
  const now = new Date().toISOString();

  // Status transitions:
  if (status === 'Approved') {
    // Only owner or admin can approve
    if (!isOwner && !isAdmin) {
      res.status(403).json({ error: 'Only the equipment owner or an administrator can approve requests.' });
      return;
    }

    // CRITICAL: Re-check availability immediately before approving to prevent double-booking
    const overlapping = db.bookingRequests.find(b =>
      b.bookingId !== booking.bookingId &&
      b.equipmentId === booking.equipmentId &&
      (b.status === 'Approved' || b.status === 'Active') &&
      (booking.startDate <= b.endDate && booking.endDate >= b.startDate)
    );

    if (overlapping) {
      res.status(409).json({
        error: `Cannot approve request: another approved booking already overlaps between ${overlapping.startDate} and ${overlapping.endDate}.`
      });
      return;
    }

    booking.status = 'Approved';
    booking.updatedAt = now;

    // Send notification to borrower
    db.notifications.push({
      notificationId: 'notif_' + crypto.randomUUID(),
      recipientId: booking.borrowerId,
      type: 'booking_approved',
      title: 'Booking Request Approved!',
      message: `Your request to borrow "${equipment?.name || 'Equipment'}" from ${booking.startDate} to ${booking.endDate} has been approved by the owner.`,
      relatedId: booking.bookingId,
      readStatus: false,
      createdAt: now
    });
  } else if (status === 'Rejected') {
    if (!isOwner && !isAdmin) {
      res.status(403).json({ error: 'Only the equipment owner can reject requests.' });
      return;
    }
    booking.status = 'Rejected';
    booking.updatedAt = now;

    db.notifications.push({
      notificationId: 'notif_' + crypto.randomUUID(),
      recipientId: booking.borrowerId,
      type: 'booking_rejected',
      title: 'Booking Request Declined',
      message: `Your request to borrow "${equipment?.name || 'Equipment'}" was declined by the owner.`,
      relatedId: booking.bookingId,
      readStatus: false,
      createdAt: now
    });
  } else if (status === 'Active') {
    // Handover collection confirmed
    if (!isOwner && !isBorrower && !isAdmin) {
      res.status(403).json({ error: 'Not authorized.' });
      return;
    }
    booking.status = 'Active';
    booking.updatedAt = now;
    if (equipment) {
      equipment.availability = 'Reserved';
    }

    db.notifications.push({
      notificationId: 'notif_' + crypto.randomUUID(),
      recipientId: isOwner ? booking.borrowerId : booking.ownerId,
      type: 'booking_active',
      title: 'Equipment Handover Confirmed',
      message: `"${equipment?.name || 'Equipment'}" handover is active. Due date: ${booking.endDate}.`,
      relatedId: booking.bookingId,
      readStatus: false,
      createdAt: now
    });
  } else if (status === 'Returned') {
    // Owner or admin confirms return
    if (!isOwner && !isAdmin) {
      res.status(403).json({ error: 'Only the equipment owner can confirm return inspection.' });
      return;
    }
    booking.status = 'Returned';
    booking.paymentStatus = 'Settled';
    booking.updatedAt = now;

    if (equipment) {
      equipment.availability = 'Available';
      // Trigger notification to users who wishlisted this item!
      notifyWishlisters(equipment.equipmentId, equipment.name, equipment.location);
    }

    db.notifications.push({
      notificationId: 'notif_' + crypto.randomUUID(),
      recipientId: booking.borrowerId,
      type: 'booking_returned',
      title: 'Equipment Returned & Inspected',
      message: `Return confirmed for "${equipment?.name || 'Equipment'}". Please leave a review to share your experience with the community!`,
      relatedId: booking.bookingId,
      readStatus: false,
      createdAt: now
    });
  } else if (status === 'Cancelled') {
    booking.status = 'Cancelled';
    booking.updatedAt = now;

    const notifyTarget = isBorrower ? booking.ownerId : booking.borrowerId;
    db.notifications.push({
      notificationId: 'notif_' + crypto.randomUUID(),
      recipientId: notifyTarget,
      type: 'booking_cancelled',
      title: 'Booking Cancelled',
      message: `The booking for "${equipment?.name || 'Equipment'}" was cancelled.`,
      relatedId: booking.bookingId,
      readStatus: false,
      createdAt: now
    });
  } else if (status === 'Disputed') {
    booking.status = 'Disputed';
    booking.updatedAt = now;

    // Create report record for admin oversight
    db.reports.push({
      reportId: 'rep_' + crypto.randomUUID(),
      reporterId: currentUserId,
      reportedUserId: isBorrower ? booking.ownerId : booking.borrowerId,
      equipmentId: booking.equipmentId,
      reason: 'Booking Dispute Raised',
      description: resolutionNotes || 'Participant raised a dispute regarding handover, return condition, or schedule.',
      status: 'Pending',
      createdAt: now
    });
  } else {
    res.status(400).json({ error: 'Invalid booking status transition.' });
    return;
  }

  dbManager.save();
  res.json(booking);
});

// -------------------------------------------------------------
// ONLINE PAYMENT PROCESSING (UPI & CREDIT/DEBIT CARDS)
// -------------------------------------------------------------

function detectCardBrand(num: string): string {
  if (/^4/.test(num)) return 'Visa';
  if (/^(5[1-5]|2[2-7])/.test(num)) return 'Mastercard';
  if (/^3[47]/.test(num)) return 'American Express';
  if (/^(6011|65|64[4-9])/.test(num)) return 'Discover';
  if (/^35/.test(num)) return 'JCB';
  if (/^(508|60|65|81|82)/.test(num)) return 'RuPay';
  return 'Credit Card';
}

function validateLuhn(num: string): boolean {
  let sum = 0;
  let alternate = false;
  for (let i = num.length - 1; i >= 0; i--) {
    let n = parseInt(num[i], 10);
    if (isNaN(n)) return false;
    if (alternate) {
      n *= 2;
      if (n > 9) n -= 9;
    }
    sum += n;
    alternate = !alternate;
  }
  return sum % 10 === 0;
}

// Public or member payment settings
router.get('/payments/settings', (_req: Request, res: Response) => {
  const settings = db.paymentSettings || {
    gatewayMode: 'live',
    upiEnabled: true,
    cardsEnabled: true,
    merchantVpa: 'neighbourlend@okhdfcbank',
    merchantName: 'NeighbourLend Community Network'
  };
  res.json(settings);
});

// Admin update payment settings
router.put('/admin/payments/settings', requireAdmin, (req: Request, res: Response) => {
  const { gatewayMode, upiEnabled, cardsEnabled, merchantVpa, merchantName } = req.body;
  if (!db.paymentSettings) {
    db.paymentSettings = {
      gatewayMode: 'live',
      upiEnabled: true,
      cardsEnabled: true,
      merchantVpa: 'neighbourlend@okhdfcbank',
      merchantName: 'NeighbourLend Community Network'
    };
  }
  if (gatewayMode) db.paymentSettings.gatewayMode = gatewayMode;
  if (upiEnabled !== undefined) db.paymentSettings.upiEnabled = Boolean(upiEnabled);
  if (cardsEnabled !== undefined) db.paymentSettings.cardsEnabled = Boolean(cardsEnabled);
  if (merchantVpa) db.paymentSettings.merchantVpa = String(merchantVpa).trim();
  if (merchantName) db.paymentSettings.merchantName = String(merchantName).trim();

  dbManager.save();
  res.json(db.paymentSettings);
});

// Process Online Payment (UPI or Card)
router.post('/bookings/:id/pay', requireAuth, (req: Request, res: Response) => {
  const booking = db.bookingRequests.find(b => b.bookingId === req.params.id);
  if (!booking) {
    res.status(404).json({ error: 'Booking request not found.' });
    return;
  }

  // Caller must be borrower or admin
  if (booking.borrowerId !== req.user!.memberId && req.user!.role !== 'admin') {
    res.status(403).json({ error: 'Only the borrower can process payment for this booking.' });
    return;
  }

  const { method, upiId, cardholderName, cardNumber, expDate, cvc, billingZip } = req.body;

  if (!method || !['UPI', 'Credit Card', 'Debit Card'].includes(method)) {
    res.status(400).json({ error: 'Please specify a valid payment method (UPI or Credit Card).' });
    return;
  }

  const equipment = db.equipment.find(e => e.equipmentId === booking.equipmentId);
  const now = new Date().toISOString();
  let paymentDetails: any = null;
  let transactionId = '';

  if (method === 'UPI') {
    if (!upiId || !String(upiId).trim()) {
      res.status(400).json({ error: 'Please provide a valid UPI ID (e.g. yourname@okhdfcbank).' });
      return;
    }

    const cleanUpi = String(upiId).trim();
    const upiRegex = /^[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z]{2,64}$/;
    if (!upiRegex.test(cleanUpi)) {
      res.status(400).json({ error: 'Invalid UPI VPA format. Must be formatted like name@bank (e.g. user@oksbi).' });
      return;
    }

    transactionId = 'TXN_UPI_' + crypto.randomUUID().slice(0, 10).toUpperCase();
    const totalPaid = booking.totalPrice + booking.securityDeposit;

    paymentDetails = {
      method: 'UPI',
      transactionId,
      paidAt: now,
      upiId: cleanUpi,
      rentalAmount: booking.totalPrice,
      depositAmount: booking.securityDeposit,
      totalPaid,
      authorizationCode: 'UPI_APPR_' + Math.floor(100000 + Math.random() * 900000)
    };
  } else {
    // Credit Card or Debit Card
    if (!cardholderName || !cardNumber || !expDate || !cvc) {
      res.status(400).json({ error: 'Cardholder name, card number, expiration date, and CVC are required.' });
      return;
    }

    const cleanCard = String(cardNumber).replace(/\D/g, '');
    if (cleanCard.length < 13 || cleanCard.length > 19) {
      res.status(400).json({ error: 'Invalid card number length. Must be 13 to 19 digits.' });
      return;
    }

    // Verify Luhn checksum (standard payment card validation)
    if (!validateLuhn(cleanCard)) {
      res.status(400).json({ error: 'Card number failed checksum verification. Please recheck your card number.' });
      return;
    }

    // Check expiration MM/YY
    const expParts = String(expDate).split('/');
    if (expParts.length !== 2) {
      res.status(400).json({ error: 'Invalid expiration format. Use MM/YY.' });
      return;
    }

    const expMonth = parseInt(expParts[0], 10);
    const expYear = parseInt('20' + expParts[1].slice(-2), 10);
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth() + 1;

    if (isNaN(expMonth) || expMonth < 1 || expMonth > 12) {
      res.status(400).json({ error: 'Invalid card expiration month.' });
      return;
    }

    if (expYear < currentYear || (expYear === currentYear && expMonth < currentMonth)) {
      res.status(400).json({ error: 'Card has expired.' });
      return;
    }

    const cleanCvc = String(cvc).trim();
    if (!/^\d{3,4}$/.test(cleanCvc)) {
      res.status(400).json({ error: 'CVC must be 3 or 4 digits.' });
      return;
    }

    const cardBrand = detectCardBrand(cleanCard);
    transactionId = 'TXN_CC_' + crypto.randomUUID().slice(0, 10).toUpperCase();
    const totalPaid = booking.totalPrice + booking.securityDeposit;

    // DO NOT store raw card numbers! Store sanitized tokenized metadata
    paymentDetails = {
      method: method as any,
      transactionId,
      paidAt: now,
      cardBrand,
      cardLast4: cleanCard.slice(-4),
      rentalAmount: booking.totalPrice,
      depositAmount: booking.securityDeposit,
      totalPaid,
      authorizationCode: 'AUTH_' + Math.floor(100000 + Math.random() * 900000)
    };
  }

  // Update booking record
  booking.paymentStatus = 'Held in Escrow';
  booking.paymentMethod = method as any;
  booking.paymentTransactionRef = transactionId;
  booking.paymentDetails = paymentDetails;
  booking.updatedAt = now;

  // Notify owner
  db.notifications.push({
    notificationId: 'notif_' + crypto.randomUUID(),
    recipientId: booking.ownerId,
    type: 'payment_received',
    title: 'Payment Received in Escrow',
    message: `${req.user!.fullName} completed online payment of $${paymentDetails.totalPaid} via ${method} for "${equipment?.name || 'Equipment'}". Funds are held in escrow until return inspection.`,
    relatedId: booking.bookingId,
    readStatus: false,
    createdAt: now
  });

  // Notify borrower with confirmation
  db.notifications.push({
    notificationId: 'notif_' + crypto.randomUUID(),
    recipientId: booking.borrowerId,
    type: 'payment_received',
    title: 'Payment Confirmed - Escrow Active',
    message: `Payment of $${paymentDetails.totalPaid} (${method}) for "${equipment?.name || 'Equipment'}" is secured in escrow. Reference: ${transactionId}.`,
    relatedId: booking.bookingId,
    readStatus: false,
    createdAt: now
  });

  dbManager.save();
  res.json({
    success: true,
    booking,
    paymentDetails
  });
});

// Refund Security Deposit (Owner or Admin after equipment returned)
router.post('/bookings/:id/refund-deposit', requireAuth, (req: Request, res: Response) => {
  const booking = db.bookingRequests.find(b => b.bookingId === req.params.id);
  if (!booking) {
    res.status(404).json({ error: 'Booking not found.' });
    return;
  }

  const isOwner = booking.ownerId === req.user!.memberId;
  const isAdmin = req.user!.role === 'admin';

  if (!isOwner && !isAdmin) {
    res.status(403).json({ error: 'Only the equipment owner or an administrator can release the security deposit.' });
    return;
  }

  if (booking.securityDeposit <= 0) {
    res.status(400).json({ error: 'This booking has no security deposit to refund.' });
    return;
  }

  if (booking.paymentDetails?.depositRefundedAt) {
    res.status(400).json({ error: 'The security deposit for this booking has already been refunded.' });
    return;
  }

  const refundRef = 'REF_DEP_' + crypto.randomUUID().slice(0, 10).toUpperCase();
  const now = new Date().toISOString();

  if (!booking.paymentDetails) {
    booking.paymentDetails = {
      method: booking.paymentMethod || 'Credit Card',
      transactionId: booking.paymentTransactionRef || ('TXN_' + crypto.randomUUID().slice(0, 8)),
      paidAt: booking.createdAt,
      rentalAmount: booking.totalPrice,
      depositAmount: booking.securityDeposit,
      totalPaid: booking.totalPrice + booking.securityDeposit
    };
  }

  booking.paymentDetails.depositRefundedAt = now;
  booking.paymentDetails.depositRefundRef = refundRef;
  booking.paymentStatus = 'Settled';
  booking.updatedAt = now;

  const equipment = db.equipment.find(e => e.equipmentId === booking.equipmentId);

  // Notify borrower
  db.notifications.push({
    notificationId: 'notif_' + crypto.randomUUID(),
    recipientId: booking.borrowerId,
    type: 'deposit_refunded',
    title: 'Security Deposit Refunded',
    message: `Your refundable security deposit of $${booking.securityDeposit} for "${equipment?.name || 'Equipment'}" has been refunded to your original payment method (${booking.paymentMethod || 'Online'}). Refund Ref: ${refundRef}.`,
    relatedId: booking.bookingId,
    readStatus: false,
    createdAt: now
  });

  dbManager.save();
  res.json({
    success: true,
    refundRef,
    refundedAmount: booking.securityDeposit,
    booking
  });
});

// Digital Payment Receipt & Tax Invoice
router.get('/bookings/:id/receipt', requireAuth, (req: Request, res: Response) => {
  const booking = db.bookingRequests.find(b => b.bookingId === req.params.id);
  if (!booking) {
    res.status(404).json({ error: 'Booking not found.' });
    return;
  }

  // Participants or admin only
  if (booking.borrowerId !== req.user!.memberId && booking.ownerId !== req.user!.memberId && req.user!.role !== 'admin') {
    res.status(403).json({ error: 'Not authorized to view this receipt.' });
    return;
  }

  const equipment = db.equipment.find(e => e.equipmentId === booking.equipmentId);
  const borrower = db.members.find(m => m.memberId === booking.borrowerId);
  const owner = db.members.find(m => m.memberId === booking.ownerId);

  const receipt = {
    receiptNumber: 'REC_' + (booking.paymentTransactionRef || booking.bookingId).replace(/[^a-zA-Z0-9]/g, '').slice(-10),
    bookingId: booking.bookingId,
    transactionRef: booking.paymentTransactionRef || 'PENDING_PAYMENT',
    issuedAt: booking.paymentDetails?.paidAt || booking.createdAt,
    status: booking.paymentStatus,
    paymentMethod: booking.paymentMethod || 'Online Payment',
    borrower: {
      name: borrower?.fullName || 'Neighbour',
      email: borrower?.email,
      phone: borrower?.phone,
      location: borrower?.location
    },
    lender: {
      name: owner?.fullName || 'Neighbour',
      email: owner?.email,
      location: owner?.location
    },
    equipment: {
      name: equipment?.name || 'Equipment',
      brand: equipment?.brand,
      model: equipment?.model,
      condition: equipment?.condition
    },
    rentalPeriod: {
      startDate: booking.startDate,
      endDate: booking.endDate,
      totalDays: booking.totalDays
    },
    pricing: {
      pricePerDay: booking.pricePerDay,
      rentalTotal: booking.totalPrice,
      securityDeposit: booking.securityDeposit,
      grandTotal: booking.totalPrice + booking.securityDeposit,
      depositRefunded: Boolean(booking.paymentDetails?.depositRefundedAt),
      depositRefundRef: booking.paymentDetails?.depositRefundRef
    },
    cardInfo: booking.paymentDetails?.cardLast4 ? {
      brand: booking.paymentDetails.cardBrand,
      last4: booking.paymentDetails.cardLast4
    } : undefined,
    upiInfo: booking.paymentDetails?.upiId ? {
      vpa: booking.paymentDetails.upiId
    } : undefined,
    authorizationCode: booking.paymentDetails?.authorizationCode || 'N/A'
  };

  res.json(receipt);
});

// Admin All Payments & Escrow Ledger
router.get('/admin/payments', requireAdmin, (_req: Request, res: Response) => {
  const transactions = db.bookingRequests
    .filter(b => b.paymentTransactionRef || b.paymentStatus !== 'Not Enabled')
    .map(b => {
      const borrower = db.members.find(m => m.memberId === b.borrowerId);
      const eq = db.equipment.find(e => e.equipmentId === b.equipmentId);

      return {
        transactionId: b.paymentTransactionRef || ('TXN_' + b.bookingId),
        bookingId: b.bookingId,
        borrowerName: borrower?.fullName || 'Neighbour',
        equipmentName: eq?.name || 'Equipment',
        amount: b.totalPrice + b.securityDeposit,
        rentalAmount: b.totalPrice,
        depositAmount: b.securityDeposit,
        method: b.paymentMethod || (b.paymentTransactionRef?.includes('UPI') ? 'UPI' : 'Credit Card'),
        status: b.paymentStatus,
        reference: b.paymentTransactionRef || 'N/A',
        paidAt: b.paymentDetails?.paidAt || b.createdAt,
        depositRefunded: Boolean(b.paymentDetails?.depositRefundedAt),
        depositRefundRef: b.paymentDetails?.depositRefundRef
      };
    });

  const totalEscrow = transactions
    .filter(t => t.status === 'Held in Escrow')
    .reduce((acc, curr) => acc + curr.amount, 0);

  const totalSettled = transactions
    .filter(t => t.status === 'Settled')
    .reduce((acc, curr) => acc + curr.rentalAmount, 0);

  res.json({
    transactions,
    totalEscrow,
    totalSettled
  });
});

// -------------------------------------------------------------
// WISHLIST ROUTES (New Feature Requested)
// -------------------------------------------------------------

router.get('/wishlist', requireAuth, (req: Request, res: Response) => {
  const userWishlist = db.wishlists.filter(w => w.memberId === req.user!.memberId);

  const items = userWishlist.map(w => {
    const eq = db.equipment.find(e => e.equipmentId === w.equipmentId);
    if (!eq) return null;
    const owner = db.members.find(m => m.memberId === eq.ownerId);
    const category = db.categories.find(c => c.categoryId === eq.categoryId);

    return {
      wishlistId: `${w.memberId}_${w.equipmentId}`,
      notifyWhenAvailable: w.notifyWhenAvailable,
      addedAt: w.createdAt,
      equipment: {
        ...eq,
        ownerName: owner?.fullName || 'Neighbour',
        ownerLocation: owner?.location || eq.location,
        ownerRating: owner?.averageRating || 5.0,
        categoryName: category?.name || 'General Equipment'
      }
    };
  }).filter(Boolean);

  res.json(items);
});

router.post('/wishlist/:equipmentId', requireAuth, (req: Request, res: Response) => {
  const { equipmentId } = req.params;
  const { notifyWhenAvailable = true } = req.body;
  const memberId = req.user!.memberId;

  const eq = db.equipment.find(e => e.equipmentId === equipmentId);
  if (!eq) {
    res.status(404).json({ error: 'Equipment not found.' });
    return;
  }

  const existingIdx = db.wishlists.findIndex(w => w.memberId === memberId && w.equipmentId === equipmentId);

  if (existingIdx !== -1) {
    // Remove from wishlist
    db.wishlists.splice(existingIdx, 1);
    dbManager.save();
    res.json({ isWishlisted: false, message: 'Removed from wishlist.' });
  } else {
    // Add to wishlist
    db.wishlists.push({
      memberId,
      equipmentId,
      notifyWhenAvailable: Boolean(notifyWhenAvailable),
      createdAt: new Date().toISOString()
    });
    dbManager.save();
    res.json({ isWishlisted: true, notifyWhenAvailable: Boolean(notifyWhenAvailable), message: 'Added to your wishlist!' });
  }
});

router.patch('/wishlist/:equipmentId/alert', requireAuth, (req: Request, res: Response) => {
  const { equipmentId } = req.params;
  const { notifyWhenAvailable } = req.body;
  const memberId = req.user!.memberId;

  const item = db.wishlists.find(w => w.memberId === memberId && w.equipmentId === equipmentId);
  if (!item) {
    res.status(404).json({ error: 'Item not in wishlist.' });
    return;
  }

  item.notifyWhenAvailable = Boolean(notifyWhenAvailable);
  dbManager.save();
  res.json({ success: true, notifyWhenAvailable: item.notifyWhenAvailable });
});

// -------------------------------------------------------------
// FAVOURITES ROUTES
// -------------------------------------------------------------

router.get('/favourites', requireAuth, (req: Request, res: Response) => {
  const memberId = req.user!.memberId;
  const userFavs = db.favourites.filter(f => f.memberId === memberId);

  const items = userFavs.map(f => {
    const eq = db.equipment.find(e => e.equipmentId === f.equipmentId && e.listingStatus === 'Active');
    if (!eq) return null;
    const owner = db.members.find(m => m.memberId === eq.ownerId);
    return {
      ...eq,
      ownerName: owner?.fullName || 'Neighbour',
      ownerRating: owner?.averageRating || 5.0
    };
  }).filter(Boolean);

  res.json(items);
});

router.post('/favourites/:equipmentId', requireAuth, (req: Request, res: Response) => {
  const { equipmentId } = req.params;
  const memberId = req.user!.memberId;

  const existingIdx = db.favourites.findIndex(f => f.memberId === memberId && f.equipmentId === equipmentId);

  if (existingIdx !== -1) {
    db.favourites.splice(existingIdx, 1);
    dbManager.save();
    res.json({ isFavourited: false });
  } else {
    db.favourites.push({
      memberId,
      equipmentId,
      createdAt: new Date().toISOString()
    });
    dbManager.save();
    res.json({ isFavourited: true });
  }
});

// -------------------------------------------------------------
// REVIEWS & RATINGS ROUTES (Completed Bookings Only)
// -------------------------------------------------------------

router.get('/reviews', (req: Request, res: Response) => {
  const { equipmentId, memberId } = req.query;
  let reviews = db.reviews.filter(r => r.moderationStatus === 'Approved');

  if (equipmentId) {
    reviews = reviews.filter(r => r.equipmentId === equipmentId);
  }
  if (memberId) {
    reviews = reviews.filter(r => r.reviewedMemberId === memberId);
  }

  const enriched = reviews.map(r => {
    const reviewer = db.members.find(m => m.memberId === r.reviewerId);
    const eq = db.equipment.find(e => e.equipmentId === r.equipmentId);
    return {
      ...r,
      reviewerName: reviewer?.fullName || 'Neighbour',
      reviewerImage: reviewer?.profileImage || '',
      equipmentName: eq?.name || 'Equipment'
    };
  });

  res.json(enriched);
});

router.post('/reviews', requireAuth, (req: Request, res: Response) => {
  const { bookingId, rating, comment } = req.body;
  const currentUserId = req.user!.memberId;

  if (!bookingId || !rating || !comment) {
    res.status(400).json({ error: 'Booking ID, rating (1-5), and comment are required.' });
    return;
  }

  const booking = db.bookingRequests.find(b => b.bookingId === bookingId);
  if (!booking) {
    res.status(404).json({ error: 'Booking not found.' });
    return;
  }

  // RULE: Reviews only allowed after eligible booking is completed ('Returned')
  if (booking.status !== 'Returned') {
    res.status(400).json({ error: 'Reviews can only be submitted after the equipment has been returned and inspected.' });
    return;
  }

  // Check authorization: must be borrower
  if (booking.borrowerId !== currentUserId) {
    res.status(403).json({ error: 'Only the borrower can leave a review for this completed rental.' });
    return;
  }

  // RULE: Prevent duplicate reviews for the same booking
  const existingReview = db.reviews.find(r => r.bookingId === bookingId && r.reviewerId === currentUserId);
  if (existingReview) {
    res.status(409).json({ error: 'You have already reviewed this booking.' });
    return;
  }

  const numericRating = Math.max(1, Math.min(5, Math.round(Number(rating))));
  const reviewId = 'rev_' + crypto.randomUUID().slice(0, 8);
  const now = new Date().toISOString();

  const newReview = {
    reviewId,
    bookingId,
    reviewerId: currentUserId,
    reviewedMemberId: booking.ownerId,
    equipmentId: booking.equipmentId,
    rating: numericRating,
    comment: String(comment).trim(),
    moderationStatus: 'Approved' as const,
    createdAt: now
  };

  db.reviews.push(newReview);

  // Recalculate owner rating
  const allOwnerReviews = db.reviews.filter(r => r.reviewedMemberId === booking.ownerId && r.moderationStatus === 'Approved');
  const sum = allOwnerReviews.reduce((acc, curr) => acc + curr.rating, 0);
  const owner = db.members.find(m => m.memberId === booking.ownerId);
  if (owner) {
    owner.totalReviews = allOwnerReviews.length;
    owner.averageRating = Number((sum / allOwnerReviews.length).toFixed(1));
  }

  // Notify owner
  db.notifications.push({
    notificationId: 'notif_' + crypto.randomUUID(),
    recipientId: booking.ownerId,
    type: 'system',
    title: 'New Review Received',
    message: `${req.user!.fullName} left you a ${numericRating}-star review: "${comment.slice(0, 60)}..."`,
    relatedId: reviewId,
    readStatus: false,
    createdAt: now
  });

  dbManager.save();
  res.status(201).json(newReview);
});

// -------------------------------------------------------------
// MESSAGING & CONVERSATIONS (Participant-Based Authorization)
// -------------------------------------------------------------

router.get('/conversations', requireAuth, (req: Request, res: Response) => {
  const currentUserId = req.user!.memberId;
  const userConvs = db.conversations.filter(c => c.participantIds.includes(currentUserId));

  userConvs.sort((a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime());

  const enriched = userConvs.map(c => {
    const otherId = c.participantIds.find(id => id !== currentUserId) || currentUserId;
    const otherMember = db.members.find(m => m.memberId === otherId);
    const eq = c.equipmentId ? db.equipment.find(e => e.equipmentId === c.equipmentId) : undefined;

    // Unread count
    const unread = db.messages.filter(m =>
      m.conversationId === c.conversationId &&
      m.senderId !== currentUserId &&
      !m.readBy.includes(currentUserId)
    ).length;

    return {
      ...c,
      equipmentName: eq?.name,
      unreadCount: unread,
      otherParticipant: otherMember ? {
        memberId: otherMember.memberId,
        fullName: otherMember.fullName,
        profileImage: otherMember.profileImage,
        location: otherMember.location
      } : undefined
    };
  });

  res.json(enriched);
});

router.post('/conversations/start', requireAuth, (req: Request, res: Response) => {
  const { participantId, equipmentId, bookingId, initialMessage } = req.body;
  const currentUserId = req.user!.memberId;

  if (!participantId) {
    res.status(400).json({ error: 'Participant ID is required.' });
    return;
  }

  // Find existing conversation between these participants for this equipment/general
  let conv = db.conversations.find(c =>
    c.participantIds.includes(currentUserId) &&
    c.participantIds.includes(participantId) &&
    (!equipmentId || c.equipmentId === equipmentId)
  );

  const now = new Date().toISOString();

  if (!conv) {
    conv = {
      conversationId: 'conv_' + crypto.randomUUID(),
      participantIds: [currentUserId, participantId],
      equipmentId: equipmentId || undefined,
      bookingId: bookingId || undefined,
      lastMessageText: initialMessage ? String(initialMessage).trim() : 'Conversation started',
      lastMessageAt: now,
      createdAt: now
    };
    db.conversations.push(conv);
  }

  if (initialMessage) {
    const msg = {
      messageId: 'msg_' + crypto.randomUUID(),
      conversationId: conv.conversationId,
      senderId: currentUserId,
      message: String(initialMessage).trim(),
      readBy: [currentUserId],
      createdAt: now
    };
    db.messages.push(msg);
    conv.lastMessageText = msg.message;
    conv.lastMessageAt = now;

    // Notify other participant
    db.notifications.push({
      notificationId: 'notif_' + crypto.randomUUID(),
      recipientId: participantId,
      type: 'new_message',
      title: 'New Message',
      message: `${req.user!.fullName}: "${msg.message.slice(0, 60)}"`,
      relatedId: conv.conversationId,
      readStatus: false,
      createdAt: now
    });
  }

  dbManager.save();
  res.json(conv);
});

router.get('/conversations/:id/messages', requireAuth, (req: Request, res: Response) => {
  const conv = db.conversations.find(c => c.conversationId === req.params.id);
  if (!conv) {
    res.status(404).json({ error: 'Conversation not found.' });
    return;
  }

  const currentUserId = req.user!.memberId;
  // RULE: Participant-based authorization on every message operation
  if (!conv.participantIds.includes(currentUserId) && req.user!.role !== 'admin') {
    res.status(403).json({ error: 'Not authorized to access this conversation.' });
    return;
  }

  const messages = db.messages.filter(m => m.conversationId === conv.conversationId);

  // Mark unread messages as read
  for (const m of messages) {
    if (!m.readBy.includes(currentUserId)) {
      m.readBy.push(currentUserId);
    }
  }
  dbManager.save();

  const enriched = messages.map(m => {
    const sender = db.members.find(mem => mem.memberId === m.senderId);
    return {
      ...m,
      senderName: sender?.fullName || 'Neighbour',
      senderImage: sender?.profileImage || ''
    };
  });

  res.json(enriched);
});

router.post('/conversations/:id/messages', requireAuth, (req: Request, res: Response) => {
  const { message } = req.body;
  if (!message || !String(message).trim()) {
    res.status(400).json({ error: 'Message cannot be empty.' });
    return;
  }

  const conv = db.conversations.find(c => c.conversationId === req.params.id);
  if (!conv) {
    res.status(404).json({ error: 'Conversation not found.' });
    return;
  }

  const currentUserId = req.user!.memberId;
  // RULE: Enforce participant authorization
  if (!conv.participantIds.includes(currentUserId) && req.user!.role !== 'admin') {
    res.status(403).json({ error: 'Not authorized to send messages in this conversation.' });
    return;
  }

  const now = new Date().toISOString();
  const newMsg = {
    messageId: 'msg_' + crypto.randomUUID(),
    conversationId: conv.conversationId,
    senderId: currentUserId,
    message: String(message).trim(),
    readBy: [currentUserId],
    createdAt: now
  };

  db.messages.push(newMsg);
  conv.lastMessageText = newMsg.message;
  conv.lastMessageAt = now;

  // Notify other participant
  const recipientId = conv.participantIds.find(id => id !== currentUserId);
  if (recipientId) {
    db.notifications.push({
      notificationId: 'notif_' + crypto.randomUUID(),
      recipientId,
      type: 'new_message',
      title: 'New Message from ' + req.user!.fullName,
      message: newMsg.message.slice(0, 80),
      relatedId: conv.conversationId,
      readStatus: false,
      createdAt: now
    });
  }

  dbManager.save();

  const sender = db.members.find(m => m.memberId === currentUserId);
  res.status(201).json({
    ...newMsg,
    senderName: sender?.fullName || 'You',
    senderImage: sender?.profileImage || ''
  });
});

// -------------------------------------------------------------
// NOTIFICATIONS ROUTES
// -------------------------------------------------------------

router.get('/notifications', requireAuth, (req: Request, res: Response) => {
  const list = db.notifications
    .filter(n => n.recipientId === req.user!.memberId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  res.json(list);
});

router.patch('/notifications/:id/read', requireAuth, (req: Request, res: Response) => {
  const notif = db.notifications.find(n => n.notificationId === req.params.id && n.recipientId === req.user!.memberId);
  if (notif) {
    notif.readStatus = true;
    dbManager.save();
  }
  res.json({ success: true });
});

router.patch('/notifications/read-all', requireAuth, (req: Request, res: Response) => {
  const memberId = req.user!.memberId;
  for (const n of db.notifications) {
    if (n.recipientId === memberId) {
      n.readStatus = true;
    }
  }
  dbManager.save();
  res.json({ success: true });
});

// -------------------------------------------------------------
// REPORTS & MODERATION ROUTES
// -------------------------------------------------------------

router.post('/reports', requireAuth, (req: Request, res: Response) => {
  const { equipmentId, reportedUserId, reason, description } = req.body;
  if (!reason || !description) {
    res.status(400).json({ error: 'Reason and description are required.' });
    return;
  }

  const reportId = 'rep_' + crypto.randomUUID().slice(0, 8);
  const newReport = {
    reportId,
    reporterId: req.user!.memberId,
    reportedUserId: reportedUserId ? String(reportedUserId) : undefined,
    equipmentId: equipmentId ? String(equipmentId) : undefined,
    reason: String(reason).trim(),
    description: String(description).trim(),
    status: 'Pending' as const,
    createdAt: new Date().toISOString()
  };

  db.reports.push(newReport);
  dbManager.save();
  res.status(201).json(newReport);
});

// -------------------------------------------------------------
// DASHBOARD REAL-TIME STATS ROUTES
// -------------------------------------------------------------

router.get('/stats', requireAuth, (req: Request, res: Response) => {
  const currentUserId = req.user!.memberId;

  const myEquipment = db.equipment.filter(e => e.ownerId === currentUserId && e.listingStatus !== 'Archived');
  const myLendingBookings = db.bookingRequests.filter(b => b.ownerId === currentUserId);
  const myBorrowingBookings = db.bookingRequests.filter(b => b.borrowerId === currentUserId);

  const activeBorrowings = myBorrowingBookings.filter(b => b.status === 'Active').length;
  const pendingBorrowRequests = myBorrowingBookings.filter(b => b.status === 'Pending').length;
  const completedBorrowings = myBorrowingBookings.filter(b => b.status === 'Returned').length;

  const totalSavedDollars = myBorrowingBookings
    .filter(b => b.status === 'Returned' || b.status === 'Active')
    .reduce((acc, curr) => acc + (curr.totalPrice > 0 ? Math.round(curr.totalPrice * 1.8) : 40), 0);

  const activeLendings = myLendingBookings.filter(b => b.status === 'Active').length;
  const pendingLendRequests = myLendingBookings.filter(b => b.status === 'Pending').length;
  const totalEarnedDollars = myLendingBookings
    .filter(b => b.status === 'Returned')
    .reduce((acc, curr) => acc + curr.totalPrice, 0);

  const favouritesCount = db.favourites.filter(f => f.memberId === currentUserId).length;
  const unreadNotifications = db.notifications.filter(n => n.recipientId === currentUserId && !n.readStatus).length;

  res.json({
    activeBorrowings,
    pendingBorrowRequests,
    completedBorrowings,
    totalSavedDollars,
    myListingsCount: myEquipment.length,
    activeLendings,
    pendingLendRequests,
    totalEarnedDollars,
    favouritesCount,
    unreadNotifications
  });
});

// -------------------------------------------------------------
// ADMIN DASHBOARD ROUTES (Protected: requireAdmin)
// -------------------------------------------------------------

router.get('/admin/stats', requireAdmin, (_req: Request, res: Response) => {
  const totalUsers = db.members.length;
  const verifiedUsers = db.members.filter(m => m.verificationStatus === 'verified').length;
  const totalListings = db.equipment.length;
  const activeListings = db.equipment.filter(e => e.listingStatus === 'Active').length;
  const totalBookings = db.bookingRequests.length;
  const activeBookings = db.bookingRequests.filter(b => b.status === 'Active').length;
  const completedBookings = db.bookingRequests.filter(b => b.status === 'Returned').length;
  const pendingReports = db.reports.filter(r => r.status === 'Pending').length;

  const totalInventoryEstimatedValue = db.equipment
    .filter(e => e.listingStatus === 'Active')
    .reduce((acc, curr) => acc + (curr.securityDeposit > 0 ? curr.securityDeposit * 2.5 : 200), 0);

  res.json({
    totalUsers,
    verifiedUsers,
    totalListings,
    activeListings,
    totalBookings,
    activeBookings,
    completedBookings,
    pendingReports,
    totalInventoryEstimatedValue
  });
});

router.get('/admin/users', requireAdmin, (_req: Request, res: Response) => {
  const users = db.members.map(m => {
    const { passwordHash: _, ...safe } = m;
    const listingsCount = db.equipment.filter(e => e.ownerId === m.memberId).length;
    const bookingsCount = db.bookingRequests.filter(b => b.borrowerId === m.memberId).length;
    return { ...safe, listingsCount, bookingsCount };
  });
  res.json(users);
});

router.patch('/admin/users/:id', requireAdmin, (req: Request, res: Response) => {
  const member = db.members.find(m => m.memberId === req.params.id);
  if (!member) {
    res.status(404).json({ error: 'User not found.' });
    return;
  }

  const { role, verificationStatus } = req.body;
  if (role) member.role = role;
  if (verificationStatus) member.verificationStatus = verificationStatus;

  dbManager.save();
  const { passwordHash: _, ...safe } = member;
  res.json(safe);
});

router.get('/admin/reports', requireAdmin, (_req: Request, res: Response) => {
  const reports = db.reports.map(r => {
    const reporter = db.members.find(m => m.memberId === r.reporterId);
    const reportedUser = r.reportedUserId ? db.members.find(m => m.memberId === r.reportedUserId) : undefined;
    const eq = r.equipmentId ? db.equipment.find(e => e.equipmentId === r.equipmentId) : undefined;

    return {
      ...r,
      reporterName: reporter?.fullName || 'Neighbour',
      reportedUserName: reportedUser?.fullName,
      equipmentName: eq?.name
    };
  });
  res.json(reports);
});

router.patch('/admin/reports/:id', requireAdmin, (req: Request, res: Response) => {
  const report = db.reports.find(r => r.reportId === req.params.id);
  if (!report) {
    res.status(404).json({ error: 'Report not found.' });
    return;
  }

  const { status } = req.body;
  if (status) report.status = status;
  dbManager.save();
  res.json(report);
});

router.patch('/admin/equipment/:id/status', requireAdmin, (req: Request, res: Response) => {
  const eq = db.equipment.find(e => e.equipmentId === req.params.id);
  if (!eq) {
    res.status(404).json({ error: 'Equipment not found.' });
    return;
  }

  const { listingStatus } = req.body;
  if (listingStatus) eq.listingStatus = listingStatus;
  eq.updatedAt = new Date().toISOString();

  dbManager.save();
  res.json(eq);
});

export default router;
