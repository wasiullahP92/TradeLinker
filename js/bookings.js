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
    NOTIFICATIONS: "tl_db_notifications",
    REVIEWS: "tl_db_reviews"
  },

  // --------------------------------------------------------------------------
  // 1. Initialization
  // --------------------------------------------------------------------------
  init() {
    const raw = localStorage.getItem(this.STORAGE_KEYS.BOOKINGS);
    if (!raw || raw === '[]') {
      this.seedInitialBookings();
    } else {
      try {
        const parsed = JSON.parse(raw);
        if (parsed.length < 5) {
          this.seedInitialBookings(true);
        }
      } catch (e) {}
    }
    this.seedInitialReviews();
  },

  seedInitialReviews(force = false) {
    const raw = localStorage.getItem(this.STORAGE_KEYS.REVIEWS);
    let shouldSeed = !raw || raw === '[]' || force;
    if (!shouldSeed) {
      try {
        const parsed = JSON.parse(raw);
        if (parsed.length < 5) shouldSeed = true;
      } catch (e) { shouldSeed = true; }
    }

    if (shouldSeed) {
      const seedReviews = [
        {
          id: "rev-88410",
          bookingId: "TL-BK-5190",
          customerId: "usr-cust-001",
          customerName: "Hamad Ullah",
          providerId: "prov-profile-001",
          serviceTitle: "Emergency Circuit Diagnostic",
          rating: 5,
          comment: "Outstanding emergency response! Engr. Rashid Khan diagnosed the tripped DB panel quickly and secured the entire house electrical wiring. Highly recommended!",
          moderation_status: "approved",
          createdAt: "2026-10-20T12:30:00.000Z"
        },
        {
          id: "rev-74500",
          bookingId: "TL-BK-2850",
          customerId: "usr-cust-005",
          customerName: "Fahad Mustafa",
          providerId: "prov-005",
          serviceTitle: "DC Inverter AC Deep Chemical Servicing & Gas Charging",
          rating: 5,
          comment: "Thorough chemical servicing with indoor and outdoor unit pressure washing. The cooling performance has improved dramatically. Very tidy and polite technician.",
          moderation_status: "approved",
          createdAt: "2026-10-22T18:15:00.000Z"
        },
        {
          id: "rev-51200",
          bookingId: "TL-BK-4210",
          customerId: "usr-cust-003",
          customerName: "Dr. Kamran Qureshi",
          providerId: "prov-profile-002",
          serviceTitle: "Thermal Leak Detection & Water Line Unclogging",
          rating: 4,
          comment: "Very accurate acoustic sensor leak detection. Wall seepage stopped completely after new PPR-C pipe joint was welded.",
          moderation_status: "approved",
          createdAt: "2026-10-28T16:00:00.000Z"
        },
        {
          id: "rev-39210",
          bookingId: "TL-BK-3390",
          customerId: "usr-cust-004",
          customerName: "Zainab Bibi",
          providerId: "prov-profile-003",
          serviceTitle: "Turnkey On-Grid Solar EPC & Net-Metering Setup",
          rating: 5,
          comment: "Preliminary survey was conducted on time with comprehensive shadow analysis and generation forecast. Awaiting net metering inspection.",
          moderation_status: "pending",
          createdAt: "2026-10-31T10:00:00.000Z"
        },
        {
          id: "rev-19400",
          bookingId: "TL-BK-1940",
          customerId: "usr-cust-006",
          customerName: "Maryam Nawaz",
          providerId: "prov-003",
          serviceTitle: "Pure Solid Teak & Deodar Wooden Door Manufacturing",
          rating: 2,
          comment: "Door delivery was delayed by three days. Workmanship on frame was fine but communication was lacking.",
          moderation_status: "pending",
          createdAt: "2026-10-18T14:00:00.000Z"
        },
        {
          id: "rev-90120",
          bookingId: "TL-BK-1120",
          customerId: "usr-cust-001",
          customerName: "Hamad Ullah",
          providerId: "prov-006",
          serviceTitle: "Grey Structure Masonry & Civil Supervision",
          rating: 1,
          comment: "Unsolicited spam: Visit http://untrusted-commercial-promo.example to get 50% discount vouchers!",
          moderation_status: "rejected",
          moderation_note: "Inappropriate Content: Contains prohibited external advertising URL and commercial spam.",
          moderated_at: "2026-10-25T09:00:00.000Z",
          moderated_by: "usr-admin-001",
          createdAt: "2026-10-24T08:00:00.000Z"
        }
      ];
      localStorage.setItem(this.STORAGE_KEYS.REVIEWS, JSON.stringify(seedReviews));
    }
  },

  seedInitialBookings(merge = false) {
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
        customerId: "usr-cust-002",
        customerName: "Ayesha Malik",
        customerPhone: "0321-4455667",
        providerId: "prov-profile-001",
        providerName: "Engr. Rashid Khan",
        providerBusinessName: "Khan Electrical & Automation",
        serviceId: "srv-002",
        serviceTitle: "Main Distribution Board (DB) Panel Upgrade",
        categoryTitle: "Electrical Services",
        problemDescription: "Installation of RCCB residual current breaker and 3 new 32A breakers.",
        serviceAddress: "Villa 82, Sector G-10/4, Islamabad",
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
            changedByUserId: "usr-cust-002",
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
        scheduledTimeSlot: "Morning (9 AM - 12 PM)",
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
      },
      {
        id: "TL-BK-4210",
        customerId: "usr-cust-003",
        customerName: "Dr. Kamran Qureshi",
        customerPhone: "0345-7788990",
        providerId: "prov-profile-002",
        providerName: "Tariq Mehmood",
        providerBusinessName: "Capital Sanitary & Plumbing Masters",
        serviceId: "srv-003",
        serviceTitle: "Thermal Leak Detection & Water Line Unclogging",
        categoryTitle: "Plumbing Services",
        problemDescription: "Concealed wall water seepage in the 1st floor bathroom.",
        serviceAddress: "Street 5, Sector F-10/3, Islamabad",
        city: "Islamabad",
        scheduledDate: "2026-10-30",
        scheduledTimeSlot: "Afternoon (12 PM - 3 PM)",
        status: "in_progress",
        cancellationReason: null,
        statusHistory: [
          {
            timestamp: "2026-10-27T09:00:00.000Z",
            fromStatus: null,
            toStatus: "pending",
            changedByRole: "customer",
            changedByUserId: "usr-cust-003",
            note: "Booking submitted."
          },
          {
            timestamp: "2026-10-27T10:30:00.000Z",
            fromStatus: "pending",
            toStatus: "accepted",
            changedByRole: "provider",
            changedByUserId: "usr-prov-002",
            note: "Confirmed by plumber."
          },
          {
            timestamp: "2026-10-28T09:00:00.000Z",
            fromStatus: "accepted",
            toStatus: "in_progress",
            changedByRole: "provider",
            changedByUserId: "usr-prov-002",
            note: "Acoustic sensor inspection underway."
          }
        ],
        createdAt: "2026-10-27T09:00:00.000Z",
        updatedAt: "2026-10-28T09:00:00.000Z"
      },
      {
        id: "TL-BK-3390",
        customerId: "usr-cust-004",
        customerName: "Zainab Bibi",
        customerPhone: "0302-3344556",
        providerId: "prov-profile-003",
        providerName: "Usman Ghani",
        providerBusinessName: "SunPower Smart Energy Solutions",
        serviceId: "srv-004",
        serviceTitle: "Turnkey On-Grid Solar EPC & Net-Metering Setup",
        categoryTitle: "Solar Energy Services",
        problemDescription: "Site survey for 10kW hybrid solar system and net-metering feasibility.",
        serviceAddress: "House 29-A, DHA Phase 5, Lahore",
        city: "Lahore",
        scheduledDate: "2026-11-04",
        scheduledTimeSlot: "Morning (10 AM - 1 PM)",
        status: "pending",
        cancellationReason: null,
        statusHistory: [
          {
            timestamp: "2026-10-29T14:10:00.000Z",
            fromStatus: null,
            toStatus: "pending",
            changedByRole: "customer",
            changedByUserId: "usr-cust-004",
            note: "Requested solar survey."
          }
        ],
        createdAt: "2026-10-29T14:10:00.000Z",
        updatedAt: "2026-10-29T14:10:00.000Z"
      },
      {
        id: "TL-BK-2850",
        customerId: "usr-cust-005",
        customerName: "Fahad Mustafa",
        customerPhone: "0331-8899001",
        providerId: "prov-005",
        providerName: "Malik Shahzad",
        providerBusinessName: "CoolBreeze AC & Heating Solutions",
        serviceId: "srv-005",
        serviceTitle: "DC Inverter AC Deep Chemical Servicing & Gas Charging",
        categoryTitle: "AC & HVAC Services",
        problemDescription: "Master servicing of 2 split AC units and coil pressure washing.",
        serviceAddress: "Flat 402, Block 7, Clifton, Karachi",
        city: "Karachi",
        scheduledDate: "2026-10-22",
        scheduledTimeSlot: "Evening (3 PM - 6 PM)",
        status: "completed",
        cancellationReason: null,
        statusHistory: [
          {
            timestamp: "2026-10-21T11:00:00.000Z",
            fromStatus: null,
            toStatus: "pending",
            changedByRole: "customer",
            changedByUserId: "usr-cust-005",
            note: "Requested servicing."
          },
          {
            timestamp: "2026-10-22T17:00:00.000Z",
            fromStatus: "in_progress",
            toStatus: "completed",
            changedByRole: "provider",
            changedByUserId: "usr-prov-005",
            note: "Chemical servicing verified."
          }
        ],
        createdAt: "2026-10-21T11:00:00.000Z",
        updatedAt: "2026-10-22T17:00:00.000Z"
      },
      {
        id: "TL-BK-1940",
        customerId: "usr-cust-006",
        customerName: "Maryam Nawaz",
        customerPhone: "0322-1122334",
        providerId: "prov-003",
        providerName: "Ghulam Murtaza",
        providerBusinessName: "Murtaza Master Carpentry & Doors",
        serviceId: "srv-006",
        serviceTitle: "Pure Solid Teak & Deodar Wooden Door Manufacturing",
        categoryTitle: "Wooden Door Making & Carpentry",
        problemDescription: "Custom door measurement and architectural arch frame fitting.",
        serviceAddress: "Sector Y, Phase 3, DHA Lahore",
        city: "Lahore",
        scheduledDate: "2026-10-18",
        scheduledTimeSlot: "Morning (9 AM - 12 PM)",
        status: "cancelled",
        cancellationReason: "Customer rescheduled building schedule.",
        statusHistory: [
          {
            timestamp: "2026-10-16T10:00:00.000Z",
            fromStatus: null,
            toStatus: "pending",
            changedByRole: "customer",
            changedByUserId: "usr-cust-006",
            note: "Request initiated."
          },
          {
            timestamp: "2026-10-17T12:00:00.000Z",
            fromStatus: "pending",
            toStatus: "cancelled",
            changedByRole: "customer",
            changedByUserId: "usr-cust-006",
            note: "Cancelled before provider dispatch."
          }
        ],
        createdAt: "2026-10-16T10:00:00.000Z",
        updatedAt: "2026-10-17T12:00:00.000Z"
      },
      {
        id: "TL-BK-1120",
        customerId: "usr-cust-001",
        customerName: "Hamad Ullah",
        customerPhone: "0300-1112233",
        providerId: "prov-006",
        providerName: "Engr. Bilal Farooq",
        providerBusinessName: "Apex Civil & Construction Builders",
        serviceId: "srv-007",
        serviceTitle: "Grey Structure Masonry & Civil Supervision",
        categoryTitle: "Construction Services",
        problemDescription: "Milestone foundation inspection for commercial plaza.",
        serviceAddress: "Plot 18, Commercial Area, Peshawar Cantt",
        city: "Peshawar",
        scheduledDate: "2026-10-15",
        scheduledTimeSlot: "Morning (9 AM - 1 PM)",
        status: "rejected",
        cancellationReason: "Provider outside designated service radius.",
        statusHistory: [
          {
            timestamp: "2026-10-14T08:00:00.000Z",
            fromStatus: null,
            toStatus: "pending",
            changedByRole: "customer",
            changedByUserId: "usr-cust-001",
            note: "Request initiated."
          },
          {
            timestamp: "2026-10-14T11:00:00.000Z",
            fromStatus: "pending",
            toStatus: "rejected",
            changedByRole: "provider",
            changedByUserId: "usr-prov-006",
            note: "Location beyond current logistics scope."
          }
        ],
        createdAt: "2026-10-14T08:00:00.000Z",
        updatedAt: "2026-10-14T11:00:00.000Z"
      }
    ];

    if (merge) {
      try {
        const existing = JSON.parse(localStorage.getItem(this.STORAGE_KEYS.BOOKINGS)) || [];
        const existingIds = new Set(existing.map(b => b.id));
        const merged = [...existing];
        seed.forEach(b => {
          if (!existingIds.has(b.id)) merged.push(b);
        });
        localStorage.setItem(this.STORAGE_KEYS.BOOKINGS, JSON.stringify(merged));
        return;
      } catch (e) {}
    }

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

    const pReviews = this.getProviderReviews(providerId).filter(r => r.moderation_status !== "rejected");
    if (pReviews.length === 0) {
      providers[pIdx].rating = 5.0;
      providers[pIdx].reviewCount = 0;
      localStorage.setItem(TLAuth.STORAGE_KEYS.PROVIDERS, JSON.stringify(providers));
      return;
    }

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
  },

  // --------------------------------------------------------------------------
  // 6. Administrator Oversight & Cross-Entity Federation
  // --------------------------------------------------------------------------
  getAllBookingsJoined() {
    this.init();
    const bookings = this.getAllBookings();
    const users = (typeof TLAuth !== "undefined") ? TLAuth.getUsers() : [];
    const providers = (typeof TLAuth !== "undefined") ? TLAuth.getProviders() : [];
    const services = (typeof TLServices !== "undefined" && TLServices.getAllServices) 
      ? TLServices.getAllServices() 
      : [];
    const reviews = this.getAllReviews ? this.getAllReviews() : [];

    return bookings.map(b => {
      // 1. Resolve Customer User Account
      const customerUser = users.find(u => u.id === b.customerId) || null;
      const customer = {
        id: b.customerId,
        fullName: b.customerName || (customerUser ? customerUser.fullName : "Verified Customer"),
        email: customerUser ? customerUser.email : "",
        phone: b.customerPhone || (customerUser ? customerUser.phone : ""),
        city: customerUser ? (customerUser.city || b.city) : (b.city || "Islamabad"),
        address: b.serviceAddress || (customerUser ? customerUser.address : ""),
        avatar: (customerUser && customerUser.avatar) ? customerUser.avatar : "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100",
        status: customerUser ? (customerUser.status || "active") : "active"
      };

      // 2. Resolve Specialist / Provider Profile and Account
      const providerProfile = providers.find(p => p.id === b.providerId || p.userId === b.providerId) || null;
      const providerUser = providerProfile ? users.find(u => u.id === providerProfile.userId) : null;
      const provider = {
        id: b.providerId,
        userId: providerProfile ? providerProfile.userId : null,
        businessName: b.providerBusinessName || (providerProfile ? providerProfile.businessName : (b.providerName || "Trade Specialist")),
        fullName: b.providerName || (providerUser ? providerUser.fullName : (providerProfile ? providerProfile.businessName : "Trade Specialist")),
        email: providerUser ? providerUser.email : "",
        phone: (providerProfile && providerProfile.phone) ? providerProfile.phone : (providerUser ? providerUser.phone : ""),
        city: (providerProfile && providerProfile.city) ? providerProfile.city : (providerUser ? providerUser.city : (b.city || "Islamabad")),
        avatar: (providerUser && providerUser.avatar) ? providerUser.avatar : ((providerProfile && providerProfile.avatar) ? providerProfile.avatar : "https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=120"),
        rating: (providerProfile && providerProfile.rating !== undefined) ? providerProfile.rating : 5.0,
        reviewCount: (providerProfile && providerProfile.reviewCount !== undefined) ? providerProfile.reviewCount : 0,
        verificationStatus: providerProfile ? (providerProfile.verificationStatus || "verified") : "verified",
        categoryTitle: b.categoryTitle || (providerProfile ? providerProfile.categoryTitle : "Trade Services")
      };

      // 3. Resolve Service Listing Record
      const serviceRecord = services.find(s => s.id === b.serviceId) || null;
      const service = {
        id: b.serviceId || "srv-general",
        title: b.serviceTitle || (serviceRecord ? serviceRecord.title : "Trade Consultation & Service"),
        categoryTitle: b.categoryTitle || (serviceRecord ? serviceRecord.categoryTitle : "Trade Services"),
        priceAmount: serviceRecord ? serviceRecord.priceAmount : null,
        priceType: serviceRecord ? serviceRecord.pricingType : "upon_request",
        priceUnit: serviceRecord ? serviceRecord.priceUnit : "job",
        duration: serviceRecord ? (serviceRecord.duration || serviceRecord.estimatedDuration) : null,
        description: serviceRecord ? serviceRecord.description : ""
      };

      // 4. Resolve Verified Customer Review
      const review = reviews.find(r => r.bookingId === b.id) || null;

      // 5. Ensure Immutable Status History is always populated
      const statusHistory = (Array.isArray(b.statusHistory) && b.statusHistory.length > 0)
        ? b.statusHistory
        : [
            {
              timestamp: b.createdAt || new Date().toISOString(),
              fromStatus: null,
              toStatus: b.status || "pending",
              changedByRole: "customer",
              changedByUserId: b.customerId || "customer",
              note: "Booking request submitted."
            }
          ];

      return {
        ...b,
        statusHistory,
        customer,
        provider,
        service,
        review
      };
    });
  },

  getBookingFullDossier(bookingId) {
    const list = this.getAllBookingsJoined();
    const item = list.find(b => b.id === bookingId);
    if (!item) {
      return { success: false, error: `Booking #${bookingId} not found.` };
    }
    return {
      success: true,
      booking: item
    };
  },

  adminUpdateBookingStatus({ bookingId, targetStatus, reasonNote, adminId = "admin" }) {
    this.init();
    const validStatuses = ["pending", "accepted", "in_progress", "completed", "cancelled", "rejected"];
    if (!validStatuses.includes(targetStatus)) {
      return { success: false, error: `Invalid status: '${targetStatus}'` };
    }

    const bookings = this.getAllBookings();
    const idx = bookings.findIndex(b => b.id === bookingId);
    if (idx === -1) {
      return { success: false, error: `Booking #${bookingId} not found.` };
    }

    const booking = bookings[idx];
    const previousStatus = booking.status;
    const nowIso = new Date().toISOString();

    booking.status = targetStatus;
    booking.updatedAt = nowIso;
    if (targetStatus === "cancelled" || targetStatus === "rejected") {
      booking.cancellationReason = reasonNote || `Marked as ${targetStatus} by administrator.`;
    }

    if (!booking.statusHistory) booking.statusHistory = [];
    booking.statusHistory.push({
      timestamp: nowIso,
      fromStatus: previousStatus,
      toStatus: targetStatus,
      changedByRole: "admin",
      changedByUserId: adminId,
      note: reasonNote || `Administrator updated status from '${previousStatus.toUpperCase()}' to '${targetStatus.toUpperCase()}'.`
    });

    localStorage.setItem(this.STORAGE_KEYS.BOOKINGS, JSON.stringify(bookings));

    // Send notifications to customer & provider
    this.sendTransitionNotifications(booking, previousStatus, targetStatus, reasonNote || `Administrator updated status to ${targetStatus}`);

    // Audit Logging
    const auditDetails = `Administrator (${adminId}) changed Booking #${bookingId} status from [${previousStatus}] to [${targetStatus}]. Note: ${reasonNote || 'N/A'}`;
    if (typeof TLCommunication !== "undefined" && TLCommunication.logAdminAction) {
      TLCommunication.logAdminAction({
        actionType: "BOOKING_STATUS_UPDATED",
        targetType: "booking",
        targetId: bookingId,
        details: auditDetails,
        adminId
      });
    } else {
      try {
        const rawAudit = localStorage.getItem("tl_db_admin_audit");
        const auditLogs = rawAudit ? JSON.parse(rawAudit) : [];
        auditLogs.unshift({
          id: "aud-" + Math.floor(1000 + Math.random() * 9000),
          actionType: "BOOKING_STATUS_UPDATED",
          targetType: "booking",
          targetId: bookingId,
          details: auditDetails,
          adminId,
          timestamp: nowIso
        });
        localStorage.setItem("tl_db_admin_audit", JSON.stringify(auditLogs));
      } catch (e) {}
    }

    return { success: true, booking };
  },

  // --------------------------------------------------------------------------
  // 7. Reviews and Ratings Moderation Operations
  // --------------------------------------------------------------------------
  getAllReviewsJoined() {
    this.init();
    const reviews = this.getAllReviews();
    const bookings = this.getAllBookings();
    const users = (typeof TLAuth !== "undefined") ? TLAuth.getUsers() : [];
    const providers = (typeof TLAuth !== "undefined") ? TLAuth.getProviders() : [];
    const services = (typeof TLServices !== "undefined" && TLServices.getAllServices)
      ? TLServices.getAllServices()
      : [];

    return reviews.map(r => {
      // 1. Resolve Associated Booking
      const booking = bookings.find(b => b.id === r.bookingId) || null;

      // 2. Resolve Reviewer / Customer
      const customerUser = users.find(u => u.id === r.customerId) || null;
      const customer = {
        id: r.customerId,
        fullName: r.customerName || (customerUser ? customerUser.fullName : "Verified Customer"),
        email: customerUser ? customerUser.email : "",
        phone: customerUser ? customerUser.phone : "",
        city: customerUser ? (customerUser.city || (booking ? booking.city : "Islamabad")) : (booking ? booking.city : "Islamabad"),
        avatar: (customerUser && customerUser.avatar) ? customerUser.avatar : "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100"
      };

      // 3. Resolve Associated Specialist
      const providerProfile = providers.find(p => p.id === r.providerId || p.userId === r.providerId) || null;
      const providerUser = providerProfile ? users.find(u => u.id === providerProfile.userId) : null;
      const provider = {
        id: r.providerId,
        userId: providerProfile ? providerProfile.userId : null,
        businessName: providerProfile ? providerProfile.businessName : (booking ? booking.providerBusinessName : "Trade Specialist"),
        fullName: providerUser ? providerUser.fullName : (providerProfile ? providerProfile.businessName : (booking ? booking.providerName : "Specialist")),
        avatar: (providerUser && providerUser.avatar) ? providerUser.avatar : ((providerProfile && providerProfile.avatar) ? providerProfile.avatar : "https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=120"),
        rating: (providerProfile && providerProfile.rating !== undefined) ? providerProfile.rating : 5.0,
        reviewCount: (providerProfile && providerProfile.reviewCount !== undefined) ? providerProfile.reviewCount : 0,
        categoryTitle: providerProfile ? providerProfile.categoryTitle : (booking ? booking.categoryTitle : "Trade Services"),
        city: providerProfile ? providerProfile.city : (providerUser ? providerUser.city : "Islamabad")
      };

      // 4. Resolve Associated Service Offering
      const serviceRecord = services.find(s => s.id === (booking ? booking.serviceId : null)) || null;
      const service = {
        id: booking ? booking.serviceId : "srv-general",
        title: r.serviceTitle || (booking ? booking.serviceTitle : (serviceRecord ? serviceRecord.title : "Trade Service")),
        categoryTitle: (booking ? booking.categoryTitle : null) || (serviceRecord ? serviceRecord.categoryTitle : provider.categoryTitle)
      };

      // 5. Moderation Status Normalization
      const moderation_status = r.moderation_status || "approved";

      return {
        ...r,
        moderation_status,
        customer,
        provider,
        booking,
        service
      };
    });
  },

  getReviewFullDossier(reviewId) {
    const list = this.getAllReviewsJoined();
    const item = list.find(r => r.id === reviewId);
    if (!item) {
      return { success: false, error: `Review #${reviewId} not found.` };
    }
    return { success: true, review: item };
  },

  adminApproveReview({ reviewId, adminId = "admin", note = "" }) {
    this.init();
    const reviews = this.getAllReviews();
    const idx = reviews.findIndex(r => r.id === reviewId);
    if (idx === -1) {
      return { success: false, error: `Review #${reviewId} not found.` };
    }

    const nowIso = new Date().toISOString();
    reviews[idx].moderation_status = "approved";
    reviews[idx].moderated_at = nowIso;
    reviews[idx].moderated_by = adminId;
    if (note) reviews[idx].moderation_note = note;

    localStorage.setItem(this.STORAGE_KEYS.REVIEWS, JSON.stringify(reviews));

    // Recalculate Provider Rating
    if (reviews[idx].providerId) {
      this.recalculateProviderRating(reviews[idx].providerId);
    }

    // Audit Logging
    const auditDetails = `Administrator (${adminId}) APPROVED Review #${reviewId} for Provider ${reviews[idx].providerId}. Note: ${note || 'Verified review approved'}`;
    if (typeof TLCommunication !== "undefined" && TLCommunication.logAdminAction) {
      TLCommunication.logAdminAction({
        actionType: "REVIEW_APPROVED",
        targetType: "review",
        targetId: reviewId,
        details: auditDetails,
        adminId
      });
    }

    return { success: true, review: reviews[idx] };
  },

  adminRejectReview({ reviewId, adminId = "admin", reason = "" }) {
    this.init();
    const reviews = this.getAllReviews();
    const idx = reviews.findIndex(r => r.id === reviewId);
    if (idx === -1) {
      return { success: false, error: `Review #${reviewId} not found.` };
    }

    const nowIso = new Date().toISOString();
    reviews[idx].moderation_status = "rejected";
    reviews[idx].moderated_at = nowIso;
    reviews[idx].moderated_by = adminId;
    reviews[idx].moderation_note = reason || "Review flagged as inappropriate by administrator.";

    localStorage.setItem(this.STORAGE_KEYS.REVIEWS, JSON.stringify(reviews));

    // Recalculate Provider Rating excluding rejected review
    if (reviews[idx].providerId) {
      this.recalculateProviderRating(reviews[idx].providerId);
    }

    // Audit Logging
    const auditDetails = `Administrator (${adminId}) REJECTED Review #${reviewId} for Provider ${reviews[idx].providerId}. Reason: ${reviews[idx].moderation_note}`;
    if (typeof TLCommunication !== "undefined" && TLCommunication.logAdminAction) {
      TLCommunication.logAdminAction({
        actionType: "REVIEW_REJECTED",
        targetType: "review",
        targetId: reviewId,
        details: auditDetails,
        adminId
      });
    }

    // Dispatch notification to customer
    if (reviews[idx].customerId) {
      this.dispatchNotification({
        recipientUserId: reviews[idx].customerId,
        title: `Review Moderation Notice`,
        message: `Your review for '${reviews[idx].serviceTitle || 'Service'}' has been moderated and removed from public display. Reason: ${reviews[idx].moderation_note}`,
        type: "review_moderated",
        bookingId: reviews[idx].bookingId
      });
    }

    return { success: true, review: reviews[idx] };
  },

  adminDeleteReview({ reviewId, adminId = "admin" }) {
    this.init();
    const reviews = this.getAllReviews();
    const idx = reviews.findIndex(r => r.id === reviewId);
    if (idx === -1) {
      return { success: false, error: `Review #${reviewId} not found.` };
    }

    const deleted = reviews.splice(idx, 1)[0];
    localStorage.setItem(this.STORAGE_KEYS.REVIEWS, JSON.stringify(reviews));

    if (deleted.providerId) {
      this.recalculateProviderRating(deleted.providerId);
    }

    if (typeof TLCommunication !== "undefined" && TLCommunication.logAdminAction) {
      TLCommunication.logAdminAction({
        actionType: "REVIEW_DELETED",
        targetType: "review",
        targetId: reviewId,
        details: `Administrator (${adminId}) permanently deleted Review #${reviewId}.`,
        adminId
      });
    }

    return { success: true, review: deleted };
  }
};

if (typeof window !== "undefined") {
  window.TLBookings = TLBookings;
  window.TLReviews = TLBookings;
  TLBookings.init();
}
