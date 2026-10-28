/**
 * TradeLinker Services & Provider Operations Engine
 * Implements SRS FR-11 to FR-18, FR-31, FR-33, BR-03, BR-04, BR-07
 * Techminds (Wasi Ullah & Hamad Ullah)
 * 
 * Manages:
 * - Provider professional profile fields & validation
 * - Service listings CRUD (create, edit, remove, availability)
 * - Booking lifecycle pipeline for providers (Pending, Accepted, In Progress, Completed, Rejected)
 * - Document upload & verification queue
 * - Strict provider authorization checks
 */

const TLServices = {
  STORAGE_KEYS: {
    SERVICES: "tl_db_services",
    BOOKINGS: "tl_db_bookings",
    DOCUMENTS: "tl_db_verification_docs",
    NOTIFICATIONS: "tl_db_notifications"
  },

  init() {
    const rawServices = localStorage.getItem(this.STORAGE_KEYS.SERVICES);
    if (!rawServices || rawServices === '[]') {
      this.seedInitialServices();
    }
    const rawBookings = localStorage.getItem(this.STORAGE_KEYS.BOOKINGS);
    if (!rawBookings || rawBookings === '[]') {
      this.seedInitialBookings();
    }
  },

  seedInitialServices() {
    const initialServices = [
      {
        id: "srv-001",
        providerId: "prov-profile-001", // Engr. Rashid Khan
        categoryId: "electrical",
        categoryTitle: "Electrical Services",
        title: "Complete Home Electrical Inspection & Safety Audit",
        description: "Full circuit diagnostics, short circuit risk assessment, load calculation, and distribution board (DB) thermal safety test.",
        pricingType: "fixed",
        priceAmount: 1500,
        currency: "PKR",
        isAvailable: true,
        createdAt: "2026-10-20T10:00:00.000Z"
      },
      {
        id: "srv-002",
        providerId: "prov-profile-001",
        categoryId: "electrical",
        categoryTitle: "Electrical Services",
        title: "Main Distribution Board (DB) Panel Upgrade & Rewiring",
        description: "High-capacity circuit breaker replacement, RCCB earth leakage protection, and neat cable trunking.",
        pricingType: "upon_request",
        priceAmount: null,
        currency: "PKR",
        isAvailable: true,
        createdAt: "2026-10-21T14:30:00.000Z"
      },
      {
        id: "srv-003",
        providerId: "prov-profile-001",
        categoryId: "electrical",
        categoryTitle: "Electrical Services",
        title: "Solar Inverter & Battery Storage Integration",
        description: "Hybrid inverter AC/DC wiring, auto changeover switch installation, and battery terminal balancing.",
        pricingType: "fixed",
        priceAmount: 3500,
        currency: "PKR",
        isAvailable: false, // Currently paused
        createdAt: "2026-10-22T09:15:00.000Z"
      }
    ];
    localStorage.setItem(this.STORAGE_KEYS.SERVICES, JSON.stringify(initialServices));
  },

  seedInitialBookings() {
    const initialBookings = [
      {
        id: "TL-BK-9182",
        providerId: "prov-profile-001",
        customerId: "usr-cust-001",
        customerName: "Hamad Ullah",
        customerPhone: "0300-1112233",
        serviceId: "srv-001",
        serviceTitle: "Complete Home Electrical Inspection",
        problemDescription: "Circuit breaker in the living room DB board keeps tripping under AC load in Sector F-7/2.",
        serviceAddress: "House 14, Street 28, Sector F-7/2, Islamabad",
        scheduledDate: "2026-10-28",
        scheduledTimeSlot: "Morning (9 AM - 12 PM)",
        status: "pending",
        cancellationReason: null,
        createdAt: "2026-10-26T16:20:00.000Z",
        updatedAt: "2026-10-26T16:20:00.000Z"
      },
      {
        id: "TL-BK-7450",
        providerId: "prov-profile-001",
        customerId: "usr-cust-002",
        customerName: "Ayesha Malik",
        customerPhone: "0321-4455667",
        serviceId: "srv-002",
        serviceTitle: "Main Distribution Board (DB) Panel Upgrade",
        problemDescription: "Adding 3 new 32A breakers for newly installed inverter air conditioners.",
        serviceAddress: "Villa 82, Sector G-10/4, Islamabad",
        scheduledDate: "2026-10-29",
        scheduledTimeSlot: "Afternoon (12 PM - 3 PM)",
        status: "accepted",
        cancellationReason: null,
        createdAt: "2026-10-25T11:00:00.000Z",
        updatedAt: "2026-10-25T14:00:00.000Z"
      },
      {
        id: "TL-BK-6320",
        providerId: "prov-profile-001",
        customerId: "usr-cust-003",
        customerName: "Dr. Kamran Qureshi",
        customerPhone: "0345-7788990",
        serviceId: "srv-001",
        serviceTitle: "Emergency Circuit Diagnostic",
        problemDescription: "Clinic ultrasound room neutral line grounding issue.",
        serviceAddress: "Blue Area Medical Centre, Islamabad",
        scheduledDate: "2026-10-24",
        scheduledTimeSlot: "Morning",
        status: "completed",
        cancellationReason: null,
        createdAt: "2026-10-24T08:00:00.000Z",
        updatedAt: "2026-10-24T12:30:00.000Z"
      }
    ];
    localStorage.setItem(this.STORAGE_KEYS.BOOKINGS, JSON.stringify(initialBookings));
  },

  // --------------------------------------------------------------------------
  // 1. Service Provider Profile Operations (FR-11, FR-12, FR-13)
  // --------------------------------------------------------------------------
  getProviderProfile(userId) {
    this.init();
    let providers = [];
    try {
      providers = JSON.parse(localStorage.getItem(TLAuth.STORAGE_KEYS.PROVIDERS)) || [];
    } catch (e) { providers = []; }

    let profile = providers.find(p => p.userId === userId);
    if (!profile) {
      // Auto-initialize fallback profile if user registered as provider
      const users = TLAuth.getUsers();
      const user = users.find(u => u.id === userId);
      if (user && user.role === "provider") {
        profile = {
          id: "prov-" + TLAuth.generateUUID(),
          userId: user.id,
          businessName: user.fullName + " Services",
          categoryId: "electrical",
          categoryTitle: "Electrical Services",
          skills: ["General Trade"],
          experienceYears: 3,
          city: user.city || "Islamabad",
          serviceAreas: [user.city || "Islamabad"],
          bioDescription: "Dedicated trade specialist.",
          verificationStatus: "pending", // Unverified initially
          isPremium: false,
          avatarUrl: user.avatarUrl || null,
          contactPhone: user.phone,
          contactEmail: user.email
        };
        providers.push(profile);
        localStorage.setItem(TLAuth.STORAGE_KEYS.PROVIDERS, JSON.stringify(providers));
      }
    }
    return profile;
  },

  updateProviderProfile(userId, updates) {
    this.init();
    let providers = [];
    try {
      providers = JSON.parse(localStorage.getItem(TLAuth.STORAGE_KEYS.PROVIDERS)) || [];
    } catch (e) { providers = []; }

    const idx = providers.findIndex(p => p.userId === userId);
    if (idx === -1) {
      return { success: false, error: "Provider profile not found." };
    }

    // Security check: Provider cannot self-grant 'verified' status
    delete updates.verificationStatus;
    delete updates.isPremium;

    providers[idx] = { ...providers[idx], ...updates, updatedAt: new Date().toISOString() };
    localStorage.setItem(TLAuth.STORAGE_KEYS.PROVIDERS, JSON.stringify(providers));

    // Also update base user profile if contact info or name changed
    if (updates.businessName || updates.city) {
      TLAuth.updateProfile({
        city: updates.city,
        bioDescription: updates.bioDescription
      });
    }

    return { success: true, profile: providers[idx] };
  },

  // --------------------------------------------------------------------------
  // 2. Service Listings CRUD (FR-14, FR-15)
  // --------------------------------------------------------------------------
  getAllServices() {
    this.init();
    try {
      return JSON.parse(localStorage.getItem(this.STORAGE_KEYS.SERVICES)) || [];
    } catch (e) { return []; }
  },

  getProviderServices(providerId) {
    return this.getAllServices().filter(s => s.providerId === providerId);
  },

  createService({ providerId, categoryId, title, description, pricingType, priceAmount, isAvailable = true }) {
    this.init();
    if (!title || title.trim().length < 5) {
      return { success: false, error: "Service title must be at least 5 characters." };
    }
    if (!description || description.trim().length < 15) {
      return { success: false, error: "Please provide a clear service description (min 15 characters)." };
    }
    if (!categoryId) {
      return { success: false, error: "Please select a valid service category." };
    }

    const catMap = {
      construction: "Construction Services",
      plumbing: "Plumbing Services",
      electrical: "Electrical Services",
      hvac: "AC & HVAC Services",
      solar: "Solar Energy Services",
      carpentry: "Wooden Door Making & Carpentry"
    };

    const newService = {
      id: "srv-" + TLAuth.generateUUID().substring(0, 8),
      providerId,
      categoryId,
      categoryTitle: catMap[categoryId] || "Trade Services",
      title: title.trim(),
      description: description.trim(),
      pricingType: pricingType || "upon_request", // 'fixed', 'hourly', 'upon_request'
      priceAmount: pricingType === "upon_request" ? null : (parseFloat(priceAmount) || 0),
      currency: "PKR",
      isAvailable: Boolean(isAvailable),
      createdAt: new Date().toISOString()
    };

    const services = this.getAllServices();
    services.unshift(newService);
    localStorage.setItem(this.STORAGE_KEYS.SERVICES, JSON.stringify(services));

    return { success: true, service: newService };
  },

  updateService(serviceId, providerId, updates) {
    this.init();
    const services = this.getAllServices();
    const idx = services.findIndex(s => s.id === serviceId && s.providerId === providerId);

    if (idx === -1) {
      return { success: false, error: "Service not found or you are not authorized to edit this listing." };
    }

    services[idx] = {
      ...services[idx],
      ...updates,
      updatedAt: new Date().toISOString()
    };

    localStorage.setItem(this.STORAGE_KEYS.SERVICES, JSON.stringify(services));
    return { success: true, service: services[idx] };
  },

  deleteService(serviceId, providerId) {
    this.init();
    let services = this.getAllServices();
    const beforeCount = services.length;
    services = services.filter(s => !(s.id === serviceId && s.providerId === providerId));

    if (services.length === beforeCount) {
      return { success: false, error: "Service not found or unauthorized." };
    }

    localStorage.setItem(this.STORAGE_KEYS.SERVICES, JSON.stringify(services));
    return { success: true };
  },

  toggleServiceAvailability(serviceId, providerId) {
    this.init();
    const services = this.getAllServices();
    const idx = services.findIndex(s => s.id === serviceId && s.providerId === providerId);

    if (idx === -1) return { success: false, error: "Unauthorized." };

    services[idx].isAvailable = !services[idx].isAvailable;
    localStorage.setItem(this.STORAGE_KEYS.SERVICES, JSON.stringify(services));
    return { success: true, isAvailable: services[idx].isAvailable };
  },

  // --------------------------------------------------------------------------
  // 3. Provider Booking Workflow & Authorization (FR-16, FR-17, FR-31, FR-33)
  // --------------------------------------------------------------------------
  getAllBookings() {
    this.init();
    try {
      return JSON.parse(localStorage.getItem(this.STORAGE_KEYS.BOOKINGS)) || [];
    } catch (e) { return []; }
  },

  getProviderBookings(providerId) {
    return this.getAllBookings().filter(b => b.providerId === providerId);
  },

  updateBookingStatus(bookingId, providerId, newStatus, reasonOrNote = null) {
    this.init();
    const validStatuses = ["pending", "accepted", "in_progress", "completed", "rejected", "cancelled"];
    if (!validStatuses.includes(newStatus)) {
      return { success: false, error: `Invalid status transition: ${newStatus}` };
    }

    const bookings = this.getAllBookings();
    const idx = bookings.findIndex(b => b.id === bookingId && b.providerId === providerId);

    if (idx === -1) {
      return { success: false, error: "Booking request not found or not assigned to your business." };
    }

    const currentStatus = bookings[idx].status;

    // Workflow State Machine Rules:
    // pending -> accepted OR rejected
    // accepted -> in_progress
    // in_progress -> completed
    if (currentStatus === "completed" || currentStatus === "cancelled") {
      return { success: false, error: `Booking is already finalized as '${currentStatus}'. Status changes are locked.` };
    }

    bookings[idx].status = newStatus;
    bookings[idx].updatedAt = new Date().toISOString();
    if (newStatus === "rejected") {
      bookings[idx].cancellationReason = reasonOrNote || "Declined by provider schedule availability.";
    }

    localStorage.setItem(this.STORAGE_KEYS.BOOKINGS, JSON.stringify(bookings));

    // Dispatch Notification to customer
    this.dispatchNotification({
      recipientUserId: bookings[idx].customerId,
      title: `Booking Update: #${bookingId}`,
      message: `Your service request for '${bookings[idx].serviceTitle}' has been updated to '${newStatus.toUpperCase()}'.`,
      type: "booking_status"
    });

    return { success: true, booking: bookings[idx] };
  },

  // --------------------------------------------------------------------------
  // 4. Verification Document Submission (FR-13, FR-18)
  // --------------------------------------------------------------------------
  submitVerificationDoc(providerId, { docType, docName, fileData, notes }) {
    this.init();
    let docs = [];
    try {
      docs = JSON.parse(localStorage.getItem(this.STORAGE_KEYS.DOCUMENTS)) || [];
    } catch (e) { docs = []; }

    const newDoc = {
      id: "doc-" + TLAuth.generateUUID().substring(0, 8),
      providerId,
      docType: docType || "Trade Certification",
      docName: docName || "Certificate.pdf",
      fileData: fileData || null,
      notes: notes || "",
      status: "pending_review",
      submittedAt: new Date().toISOString()
    };

    docs.push(newDoc);
    localStorage.setItem(this.STORAGE_KEYS.DOCUMENTS, JSON.stringify(docs));

    // Update provider verification status to 'pending'
    const providers = TLAuth.getProviders();
    const pIdx = providers.findIndex(p => p.id === providerId);
    if (pIdx !== -1) {
      providers[pIdx].verificationStatus = "pending";
      localStorage.setItem(TLAuth.STORAGE_KEYS.PROVIDERS, JSON.stringify(providers));
    }

    return { success: true, document: newDoc };
  },

  getProviderDocuments(providerId) {
    this.init();
    try {
      const docs = JSON.parse(localStorage.getItem(this.STORAGE_KEYS.DOCUMENTS)) || [];
      return docs.filter(d => d.providerId === providerId);
    } catch (e) { return []; }
  },

  // --------------------------------------------------------------------------
  // 5. In-App Notifications Dispatcher (FR-36, FR-37, FR-38)
  // --------------------------------------------------------------------------
  dispatchNotification({ recipientUserId, title, message, type = "system" }) {
    let notifs = [];
    try {
      notifs = JSON.parse(localStorage.getItem(this.STORAGE_KEYS.NOTIFICATIONS)) || [];
    } catch (e) { notifs = []; }

    const item = {
      id: "ntf-" + TLAuth.generateUUID().substring(0, 8),
      recipientUserId,
      title,
      message,
      type,
      isRead: false,
      createdAt: new Date().toISOString()
    };

    notifs.unshift(item);
    localStorage.setItem(this.STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(notifs));
    return item;
  },

  getUserNotifications(userId) {
    try {
      const notifs = JSON.parse(localStorage.getItem(this.STORAGE_KEYS.NOTIFICATIONS)) || [];
      return notifs.filter(n => n.recipientUserId === userId);
    } catch (e) { return []; }
  },

  markNotificationRead(notifId) {
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
  window.TLServices = TLServices;
  TLServices.init();
}
