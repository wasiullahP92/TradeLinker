/**
 * TradeLinker Booking Lifecycle & State Machine Engine
 * Implements SRS FR-10, FR-28 to FR-34, BR-04, BR-05, BR-06, UC-02, UC-03
 * Techminds (Wasi Ullah & Hamad Ullah)
 * 
 * Manages:
 * - Unique Booking ID generation (TL-BK-XXXXX)
 * - Strict 6-status lifecycle: Pending, Accepted, Rejected, In Progress, Completed, Cancelled
 * - Backend status transition validations & permission guards
 * - Immutable status change audit history log (FR-34)
 * - Customer cancellation eligibility rules (FR-10)
 * - Duplicate request submission prevention
 * - In-app notification triggers for all lifecycle events
 */

const TLBookings = {
  STORAGE_KEYS: {
    BOOKINGS: "tl_db_bookings",
    NOTIFICATIONS: "tl_db_notifications"
  },

  // --------------------------------------------------------------------------
  // 1. Initialization
  // --------------------------------------------------------------------------
  init() {
    const raw = localStorage.getItem(this.STORAGE_KEYS.BOOKINGS);
    if (!raw || raw === '[]') {
      this.seedInitialBookings();
    }
  },

  seedInitialBookings() {
    const seed = [
      {
        id: "TL-BK-8841",
        customerId: "usr-cust-001",
        customerName: "Hamad Ullah",
        customerPhone: "0300-1112233",
        providerId: "prov-profile-001",
        providerName: "Engr. Rashid Khan",
        providerBusinessName: "Khan Electrical & Automation",
        serviceId: "srv-001",
        serviceTitle: "Complete Home Electrical Inspection & Safety Audit",
        categoryTitle: "Electrical Services",
        problemDescription: "Circuit breaker in the living room DB panel keeps tripping during evening peak load.",
        serviceAddress: "House 14, Street 28, Sector F-7/2, Islamabad",
        city: "Islamabad",
        scheduledDate: "2026-10-28",
        scheduledTimeSlot: "Morning (9 AM - 12 PM)",
        status: "pending",
        cancellationReason: null,
        statusHistory: [
          {
            timestamp: "2026-10-26T16:20:00.000Z",
            fromStatus: null,
            toStatus: "pending",
            changedByRole: "customer",
            changedByUserId: "usr-cust-001",
            note: "Booking request submitted by customer."
          }
        ],
        createdAt: "2026-10-26T16:20:00.000Z",
        updatedAt: "2026-10-26T16:20:00.000Z"
      },
      {
        id: "TL-BK-7450",
        customerId: "usr-cust-001",
        customerName: "Hamad Ullah",
        customerPhone: "0300-1112233",
        providerId: "prov-profile-001",
        providerName: "Engr. Rashid Khan",
        providerBusinessName: "Khan Electrical & Automation",
        serviceId: "srv-002",
        serviceTitle: "Main Distribution Board (DB) Panel Upgrade",
        categoryTitle: "Electrical Services",
        problemDescription: "Installation of RCCB residual current breaker and 3 new 32A breakers.",
        serviceAddress: "House 14, Street 28, Sector F-7/2, Islamabad",
        city: "Islamabad",
        scheduledDate: "2026-10-29",
        scheduledTimeSlot: "Afternoon (12 PM - 3 PM)",
        status: "accepted",
        cancellationReason: null,
        statusHistory: [
          {
            timestamp: "2026-10-25T11:00:00.000Z",
            fromStatus: null,
            toStatus: "pending",
            changedByRole: "customer",
            changedByUserId: "usr-cust-001",
            note: "Request created."
          },
          {
            timestamp: "2026-10-25T14:00:00.000Z",
            fromStatus: "pending",
            toStatus: "accepted",
            changedByRole: "provider",
            changedByUserId: "usr-prov-001",
            note: "Schedule confirmed by engineer."
          }
        ],
        createdAt: "2026-10-25T11:00:00.000Z",
        updatedAt: "2026-10-25T14:00:00.000Z"
      },
      {
        id: "TL-BK-5190",
        customerId: "usr-cust-001",
        customerName: "Hamad Ullah",
        customerPhone: "0300-1112233",
        providerId: "prov-profile-001",
        providerName: "Engr. Rashid Khan",
        providerBusinessName: "Khan Electrical & Automation",
        serviceId: "srv-001",
        serviceTitle: "Emergency Circuit Diagnostic",
        categoryTitle: "Electrical Services",
        problemDescription: "Short-circuit repair after heavy rainfall.",
        serviceAddress: "House 14, Street 28, Sector F-7/2, Islamabad",
        city: "Islamabad",
        scheduledDate: "2026-10-20",
        scheduledTimeSlot: "Morning",
        status: "completed",
        cancellationReason: null,
        statusHistory: [
          {
            timestamp: "2026-10-20T08:00:00.000Z",
            fromStatus: null,
            toStatus: "pending",
            changedByRole: "customer",
            changedByUserId: "usr-cust-001",
            note: "Emergency request."
          },
          {
            timestamp: "2026-10-20T08:30:00.000Z",
            fromStatus: "pending",
            toStatus: "accepted",
            changedByRole: "provider",
            changedByUserId: "usr-prov-001",
            note: "Accepted."
          },
          {
            timestamp: "2026-10-20T09:15:00.000Z",
            fromStatus: "accepted",
            toStatus: "in_progress",
            changedByRole: "provider",
            changedByUserId: "usr-prov-001",
            note: "On-site troubleshooting."
          },
          {
            timestamp: "2026-10-20T11:00:00.000Z",
            fromStatus: "in_progress",
            toStatus: "completed",
            changedByRole: "provider",
            changedByUserId: "usr-prov-001",
            note: "Work tested and finished."
          }
        ],
        createdAt: "2026-10-20T08:00:00.000Z",
        updatedAt: "2026-10-20T11:00:00.000Z"
      }
    ];
    localStorage.setItem(this.STORAGE_KEYS.BOOKINGS, JSON.stringify(seed));
  },

  getAllBookings() {
    this.init();
    try {
      return JSON.parse(localStorage.getItem(this.STORAGE_KEYS.BOOKINGS)) || [];
    } catch (e) {
      return [];
    }
  },

  getBookingById(id) {
    return this.getAllBookings().find(b => b.id === id) || null;
  },

  getCustomerBookings(customerId) {
    return this.getAllBookings().filter(b => b.customerId === customerId);
  },

  getProviderBookings(providerId) {
    return this.getAllBookings().filter(b => b.providerId === providerId);
  },

  // --------------------------------------------------------------------------
  // 2. Customer Booking Request Submission (FR-28 to FR-30, UC-02)
  // --------------------------------------------------------------------------
  createBooking({
    customerId,
    providerId,
    serviceId,
    serviceTitle,
    categoryTitle,
    problemDescription,
    serviceAddress,
    city,
    scheduledDate,
    scheduledTimeSlot
  }) {
    this.init();

    // 1. Mandatory Fields Validation (FR-29)
    if (!customerId) return { success: false, error: "Customer authentication is required to book a service." };
    if (!providerId) return { success: false, error: "Valid service provider must be selected." };
    if (!problemDescription || problemDescription.trim().length < 10) {
      return { success: false, error: "Please provide a problem description of at least 10 characters." };
    }
    if (!serviceAddress || serviceAddress.trim().length < 5) {
      return { success: false, error: "Valid service address and location are required." };
    }
    if (!scheduledDate) {
      return { success: false, error: "Please select a preferred service appointment date." };
    }

    const bookings = this.getAllBookings();

    // 2. Prevent Duplicate Submissions within 5 minutes
    const fiveMinutesAgo = Date.now() - (5 * 60 * 1000);
    const isDuplicate = bookings.some(b => 
      b.customerId === customerId &&
      b.providerId === providerId &&
      b.problemDescription.trim().toLowerCase() === problemDescription.trim().toLowerCase() &&
      new Date(b.createdAt).getTime() > fiveMinutesAgo
    );

    if (isDuplicate) {
      return {
        success: false,
        error: "A duplicate booking request was already submitted a moment ago. Please check your dashboard."
      };
    }

    // 3. Resolve Customer & Provider Details
    const users = typeof TLAuth !== "undefined" ? TLAuth.getUsers() : [];
    const customer = users.find(u => u.id === customerId);
    const providers = typeof TLAuth !== "undefined" ? TLAuth.getProviders() : [];
    const provider = providers.find(p => p.id === providerId);
    const providerUser = provider ? users.find(u => u.id === provider.userId) : null;

    // 4. Generate Unique Booking Identifier (FR-30, e.g. TL-BK-XXXXX)
    const randomDigits = Math.floor(10000 + Math.random() * 90000);
    const bookingId = `TL-BK-${randomDigits}`;
    const nowIso = new Date().toISOString();

    const newBooking = {
      id: bookingId,
      customerId,
      customerName: customer ? customer.fullName : "Customer",
      customerPhone: customer ? customer.phone : "",
      providerId,
      providerName: providerUser ? providerUser.fullName : (provider ? provider.businessName : "Provider"),
      providerBusinessName: provider ? provider.businessName : "Trade Professional",
      serviceId: serviceId || "srv-general",
      serviceTitle: serviceTitle || "Trade Consultation & Service",
      categoryTitle: categoryTitle || (provider ? provider.categoryTitle : "Trade Services"),
      problemDescription: problemDescription.trim(),
      serviceAddress: serviceAddress.trim(),
      city: city || (customer ? customer.city : "Islamabad"),
      scheduledDate,
      scheduledTimeSlot: scheduledTimeSlot || "Morning (9 AM - 12 PM)",
      status: "pending", // Initial status (FR-33)
      cancellationReason: null,
      statusHistory: [
        {
          timestamp: nowIso,
          fromStatus: null,
          toStatus: "pending",
          changedByRole: "customer",
          changedByUserId: customerId,
          note: "Booking request submitted by customer."
        }
      ],
      createdAt: nowIso,
      updatedAt: nowIso
    };

    bookings.unshift(newBooking);
    localStorage.setItem(this.STORAGE_KEYS.BOOKINGS, JSON.stringify(bookings));

    // 5. In-App Notification to Provider (FR-36, FR-37)
    if (provider && provider.userId) {
      this.dispatchNotification({
        recipientUserId: provider.userId,
        title: `New Booking Request: #${bookingId}`,
        message: `${newBooking.customerName} submitted a booking request for ${newBooking.serviceTitle} on ${scheduledDate}.`,
        type: "booking_request",
        bookingId
      });
    }

    return { success: true, booking: newBooking };
  },

  // --------------------------------------------------------------------------
  // 3. State Machine & Status Transitions (FR-17, FR-31, FR-33, BR-05)
  // --------------------------------------------------------------------------
  transitionStatus({ bookingId, targetStatus, actorRole, actorUserId, reasonNote }) {
    this.init();
    const validStatuses = ["pending", "accepted", "rejected", "in_progress", "completed", "cancelled"];
    if (!validStatuses.includes(targetStatus)) {
      return { success: false, error: `Invalid status: '${targetStatus}'` };
    }

    const bookings = this.getAllBookings();
    const idx = bookings.findIndex(b => b.id === bookingId);
    if (idx === -1) {
      return { success: false, error: `Booking #${bookingId} not found.` };
    }

    const booking = bookings[idx];
    const currentStatus = booking.status;

    // Terminal State Check: Completed, Cancelled, and Rejected bookings are locked
    if (["completed", "cancelled", "rejected"].includes(currentStatus)) {
      return {
        success: false,
        error: `Booking #${bookingId} is already finalized as '${currentStatus.toUpperCase()}'. Status changes are locked.`
      };
    }

    // Role-Based Transition Permissions (BR-05)
    // ------------------------------------------------------------------------
    // CASE A: Customer Cancellation Rules (FR-10)
    if (targetStatus === "cancelled") {
      if (actorRole !== "customer" && actorRole !== "admin") {
        return { success: false, error: "Only the customer or administrator can cancel this request." };
      }
      if (booking.customerId !== actorUserId && actorRole !== "admin") {
        return { success: false, error: "Unauthorized: You can only cancel your own booking." };
      }
      // FR-10 Cancellation Rule: Permitted only when 'pending' or 'accepted'
      if (!["pending", "accepted"].includes(currentStatus)) {
        return {
          success: false,
          error: `Cancellation not permitted: Service is already '${currentStatus.toUpperCase()}'. Please contact the specialist or support directly.`
        };
      }
    }

    // CASE B: Provider Accept / Reject (FR-31)
    if (targetStatus === "accepted" || targetStatus === "rejected") {
      if (actorRole !== "provider" && actorRole !== "admin") {
        return { success: false, error: "Only the assigned service provider can accept or reject this request." };
      }
      if (currentStatus !== "pending") {
        return { success: false, error: `Cannot ${targetStatus} booking because it is already '${currentStatus}'.` };
      }
    }

    // CASE C: Provider Work Execution ('in_progress')
    if (targetStatus === "in_progress") {
      if (actorRole !== "provider" && actorRole !== "admin") {
        return { success: false, error: "Only the assigned provider can start this job." };
      }
      if (currentStatus !== "accepted") {
        return { success: false, error: "Booking must be 'accepted' before it can be marked 'in_progress'." };
      }
    }

    // CASE D: Provider Completion ('completed')
    if (targetStatus === "completed") {
      if (actorRole !== "provider" && actorRole !== "admin") {
        return { success: false, error: "Only the assigned provider can mark this service completed." };
      }
      if (currentStatus !== "in_progress") {
        return { success: false, error: "Job must be marked 'in_progress' before marking 'completed'." };
      }
    }

    // Apply Transition
    const nowIso = new Date().toISOString();
    const previousStatus = booking.status;
    booking.status = targetStatus;
    booking.updatedAt = nowIso;
    if (targetStatus === "cancelled" || targetStatus === "rejected") {
      booking.cancellationReason = reasonNote || "No specific reason provided.";
    }

    // Record Immutable Audit Log (FR-34)
    if (!booking.statusHistory) booking.statusHistory = [];
    booking.statusHistory.push({
      timestamp: nowIso,
      fromStatus: previousStatus,
      toStatus: targetStatus,
      changedByRole: actorRole,
      changedByUserId: actorUserId,
      note: reasonNote || `Status changed from ${previousStatus} to ${targetStatus}.`
    });

    localStorage.setItem(this.STORAGE_KEYS.BOOKINGS, JSON.stringify(bookings));

    // Dispatch Notifications (FR-36, FR-37)
    this.sendTransitionNotifications(booking, previousStatus, targetStatus, reasonNote);

    return { success: true, booking };
  },

  // --------------------------------------------------------------------------
  // 4. In-App Notifications (FR-36, FR-37, FR-38)
  // --------------------------------------------------------------------------
  sendTransitionNotifications(booking, fromStatus, toStatus, note) {
    const statusLabels = {
      accepted: "Accepted by Specialist",
      rejected: "Declined by Specialist",
      in_progress: "In Progress (Work Commenced)",
      completed: "Completed Successfully",
      cancelled: "Cancelled"
    };

    // 1. Notify Customer of Status Change
    this.dispatchNotification({
      recipientUserId: booking.customerId,
      title: `Booking #${booking.id}: ${statusLabels[toStatus] || toStatus}`,
      message: `Your booking for '${booking.serviceTitle}' has been updated to '${toStatus.toUpperCase()}'. ${note ? '(' + note + ')' : ''}`,
      type: "booking_status",
      bookingId: booking.id
    });

    // 2. If Customer Cancelled, Notify Provider
    if (toStatus === "cancelled") {
      const providers = typeof TLAuth !== "undefined" ? TLAuth.getProviders() : [];
      const prov = providers.find(p => p.id === booking.providerId);
      if (prov && prov.userId) {
        this.dispatchNotification({
          recipientUserId: prov.userId,
          title: `Booking #${booking.id} Cancelled by Customer`,
          message: `${booking.customerName} cancelled their service request for '${booking.serviceTitle}'. Reason: ${note || 'Customer cancellation'}`,
          type: "booking_cancellation",
          bookingId: booking.id
        });
      }
    }
  },

  dispatchNotification({ recipientUserId, title, message, type = "system", bookingId = null }) {
    let notifs = [];
    try {
      notifs = JSON.parse(localStorage.getItem(this.STORAGE_KEYS.NOTIFICATIONS)) || [];
    } catch (e) { notifs = []; }

    const item = {
      id: "ntf-" + Math.floor(10000 + Math.random() * 90000),
      recipientUserId,
      title,
      message,
      type,
      bookingId,
      isRead: false,
      createdAt: new Date().toISOString()
    };

    notifs.unshift(item);
    localStorage.setItem(this.STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(notifs));
    return item;
  },

  // --------------------------------------------------------------------------
  // 5. Customer Rating & Review System (BR-06, FR-39, FR-40)
  // --------------------------------------------------------------------------
  STORAGE_KEYS: {
    BOOKINGS: "tl_db_bookings",
    NOTIFICATIONS: "tl_db_notifications",
    REVIEWS: "tl_db_reviews"
  },

  getAllReviews() {
    try {
      return JSON.parse(localStorage.getItem(this.STORAGE_KEYS.REVIEWS)) || [];
    } catch (e) { return []; }
  },

  getProviderReviews(providerId) {
    return this.getAllReviews().filter(r => r.providerId === providerId);
  },

  isBookingReviewed(bookingId) {
    return this.getAllReviews().some(r => r.bookingId === bookingId);
  },

  submitReview({ bookingId, customerId, rating, comment }) {
    this.init();
    const bookings = this.getAllBookings();
    const booking = bookings.find(b => b.id === bookingId);

    if (!booking) {
      return { success: false, error: `Booking #${bookingId} not found.` };
    }

    // BR-06 Rule: Customer can ONLY submit rating and review after booking is 'completed'
    if (booking.status !== "completed") {
      return {
        success: false,
        error: `Reviews are restricted: Booking #${bookingId} is currently '${booking.status}'. You can only review completed service jobs.`
      };
    }

    // Authorization check
    if (booking.customerId !== customerId) {
      return {
        success: false,
        error: "Unauthorized: You can only submit a review for your own completed booking."
      };
    }

    // BR-06 Rule: Customer cannot review the same booking more than once
    if (this.isBookingReviewed(bookingId)) {
      return {
        success: false,
        error: `A review has already been submitted for booking #${bookingId}. Duplicate reviews are not permitted.`
      };
    }

    const numRating = parseInt(rating, 10);
    if (isNaN(numRating) || numRating < 1 || numRating > 5) {
      return { success: false, error: "Please provide a valid rating between 1 and 5 stars." };
    }

    if (!comment || comment.trim().length < 5) {
      return { success: false, error: "Please provide review feedback of at least 5 characters." };
    }

    const users = typeof TLAuth !== "undefined" ? TLAuth.getUsers() : [];
    const customer = users.find(u => u.id === customerId);

    const newReview = {
      id: "rev-" + Math.floor(10000 + Math.random() * 90000),
      bookingId,
      customerId,
      customerName: customer ? customer.fullName : "Verified Customer",
      providerId: booking.providerId,
      serviceTitle: booking.serviceTitle,
      rating: numRating,
      comment: comment.trim(),
      createdAt: new Date().toISOString()
    };

    const reviews = this.getAllReviews();
    reviews.unshift(newReview);
    localStorage.setItem(this.STORAGE_KEYS.REVIEWS, JSON.stringify(reviews));

    // Update Provider Average Rating & Review Count (FR-40)
    this.recalculateProviderRating(booking.providerId);

    // Notify Provider
    const providers = typeof TLAuth !== "undefined" ? TLAuth.getProviders() : [];
    const prov = providers.find(p => p.id === booking.providerId);
    if (prov && prov.userId) {
      this.dispatchNotification({
        recipientUserId: prov.userId,
        title: `New Verified Review: ${numRating} ★`,
        message: `${newReview.customerName} left a ${numRating}-star rating for '${booking.serviceTitle}': "${newReview.comment.substring(0, 60)}..."`,
        type: "review_received",
        bookingId
      });
    }

    return { success: true, review: newReview };
  },

  recalculateProviderRating(providerId) {
    if (typeof TLAuth === "undefined") return;
    const providers = TLAuth.getProviders();
    const pIdx = providers.findIndex(p => p.id === providerId);
    if (pIdx === -1) return;

    const pReviews = this.getProviderReviews(providerId);
    if (pReviews.length === 0) return;

    const totalStars = pReviews.reduce((sum, r) => sum + r.rating, 0);
    const avg = Math.round((totalStars / pReviews.length) * 10) / 10;

    providers[pIdx].rating = avg;
    providers[pIdx].reviewCount = pReviews.length;
    localStorage.setItem(TLAuth.STORAGE_KEYS.PROVIDERS, JSON.stringify(providers));
  },

  getUserNotifications(userId) {
    this.init();
    try {
      const notifs = JSON.parse(localStorage.getItem(this.STORAGE_KEYS.NOTIFICATIONS)) || [];
      return notifs.filter(n => n.recipientUserId === userId);
    } catch (e) { return []; }
  },

  markNotificationAsRead(notifId) {
    try {
      let notifs = JSON.parse(localStorage.getItem(this.STORAGE_KEYS.NOTIFICATIONS)) || [];
      const idx = notifs.findIndex(n => n.id === notifId);
      if (idx !== -1) {
        notifs[idx].isRead = true;
        localStorage.setItem(this.STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(notifs));
      }
    } catch (e) {}
  }
};

if (typeof window !== "undefined") {
  window.TLBookings = TLBookings;
  TLBookings.init();
}
