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
    } else {
      try {
        const parsed = JSON.parse(rawServices);
        if (parsed.length < 5) {
          this.seedInitialServices(true);
        }
      } catch (e) { }
    }
    const rawBookings = localStorage.getItem(this.STORAGE_KEYS.BOOKINGS);
    if (!rawBookings || rawBookings === '[]') {
      if (typeof TLBookings !== "undefined" && TLBookings.seedInitialBookings) {
        TLBookings.seedInitialBookings();
      } else {
        this.seedInitialBookings();
      }
    }
  },

  seedInitialServices(merge = false) {
    const defaultServices = [
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
        providerId: "prov-profile-002", // Tariq Mehmood
        categoryId: "plumbing",
        categoryTitle: "Plumbing Services",
        title: "Thermal Leak Detection & Water Line Unclogging",
        description: "Acoustic and thermal wall leak inspection, PPRC pipe fusion, and high-pressure sewer unclogging.",
        pricingType: "fixed",
        priceAmount: 2000,
        currency: "PKR",
        isAvailable: true,
        createdAt: "2026-10-22T11:00:00.000Z"
      },
      {
        id: "srv-004",
        providerId: "prov-profile-003", // Usman Ghani
        categoryId: "solar",
        categoryTitle: "Solar Energy Services",
        title: "Turnkey On-Grid Solar EPC & Net-Metering Setup",
        description: "Tier-1 solar PV panel installation, 3-phase hybrid inverter calibration, and NEPRA net-metering facilitation.",
        pricingType: "upon_request",
        priceAmount: null,
        currency: "PKR",
        isAvailable: true,
        createdAt: "2026-10-23T15:20:00.000Z"
      },
      {
        id: "srv-005",
        providerId: "prov-005", // Malik Shahzad
        categoryId: "hvac",
        categoryTitle: "AC & HVAC Services",
        title: "DC Inverter AC Deep Chemical Servicing & Gas Charging",
        description: "Pressure washer jet cleaning of indoor and outdoor coils, PCB error diagnostics, and R410A gas top-up.",
        pricingType: "fixed",
        priceAmount: 2500,
        currency: "PKR",
        isAvailable: true,
        createdAt: "2026-10-24T09:45:00.000Z"
      },
      {
        id: "srv-006",
        providerId: "prov-003", // Ghulam Murtaza
        categoryId: "carpentry",
        categoryTitle: "Wooden Door Making & Carpentry",
        title: "Pure Solid Teak & Deodar Wooden Door Manufacturing",
        description: "Handcrafted architectural entry doors, seasoned wood moisture proofing, frame mounting, and Italian lock fitting.",
        pricingType: "fixed",
        priceAmount: 8500,
        currency: "PKR",
        isAvailable: true,
        createdAt: "2026-10-25T13:10:00.000Z"
      },
      {
        id: "srv-007",
        providerId: "prov-006", // Engr. Bilal Farooq
        categoryId: "construction",
        categoryTitle: "Construction Services",
        title: "Grey Structure Masonry & Civil Supervision",
        description: "Earthquake-resistant RCC foundation, grey structure construction milestones, and structural concrete testing.",
        pricingType: "upon_request",
        priceAmount: null,
        currency: "PKR",
        isAvailable: true,
        createdAt: "2026-10-26T16:30:00.000Z"
      }
    ];

    if (merge) {
      try {
        const existing = JSON.parse(localStorage.getItem(this.STORAGE_KEYS.SERVICES)) || [];
        const existingIds = new Set(existing.map(s => s.id));
        const merged = [...existing];
        defaultServices.forEach(s => {
          if (!existingIds.has(s.id)) merged.push(s);
        });
        localStorage.setItem(this.STORAGE_KEYS.SERVICES, JSON.stringify(merged));
        return;
      } catch (e) { }
    }

    localStorage.setItem(this.STORAGE_KEYS.SERVICES, JSON.stringify(defaultServices));
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

  getCategoryTitle(categoryId) {
    if (!categoryId) return "Trade Services";
    if (typeof TLCommunication !== "undefined" && TLCommunication.getAllCategories) {
      const cat = TLCommunication.getAllCategories().find(c => (c.id && c.id.toLowerCase() === categoryId.toLowerCase()) || (c.slug && c.slug.toLowerCase() === categoryId.toLowerCase()));
      if (cat) return cat.name || cat.title || "Trade Services";
    }
    try {
      const raw = localStorage.getItem("tl_db_categories");
      if (raw) {
        const cats = JSON.parse(raw);
        const cat = cats.find(c => (c.id && c.id.toLowerCase() === categoryId.toLowerCase()) || (c.slug && c.slug.toLowerCase() === categoryId.toLowerCase()));
        if (cat) return cat.name || cat.title || "Trade Services";
      }
    } catch (e) { }
    const catMap = {
      construction: "Construction Services",
      plumbing: "Plumbing Services",
      electrical: "Electrical Services",
      hvac: "AC & HVAC Services",
      solar: "Solar Energy Services",
      carpentry: "Wooden Door Making & Carpentry"
    };
    return catMap[categoryId] || "Trade Services";
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

    const categoryTitle = this.getCategoryTitle(categoryId);

    const newService = {
      id: "srv-" + TLAuth.generateUUID().substring(0, 8),
      providerId,
      categoryId,
      categoryTitle,
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

    if (updates.categoryId && !updates.categoryTitle) {
      updates.categoryTitle = this.getCategoryTitle(updates.categoryId);
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
  // Administrator Service Management Engine (FR-14, FR-15, FR-44, BR-07)
  // --------------------------------------------------------------------------
  getAllServicesJoined() {
    this.init();
    const services = this.getAllServices();
    let providers = [];
    if (typeof TLAuth !== "undefined" && TLAuth.getProviders) {
      providers = TLAuth.getProviders();
    }
    let users = [];
    if (typeof TLAuth !== "undefined" && TLAuth.getUsers) {
      users = TLAuth.getUsers();
    }
    let bookings = [];
    if (typeof TLBookings !== "undefined" && TLBookings.getAllBookings) {
      bookings = TLBookings.getAllBookings();
    } else {
      try {
        bookings = JSON.parse(localStorage.getItem(this.STORAGE_KEYS.BOOKINGS)) || [];
      } catch (e) { }
    }

    return services.map(s => {
      // Find provider profile
      const pro = providers.find(p => p.id === s.providerId || p.userId === s.providerId) || {};
      // Find linked user
      const user = users.find(u => u.id === pro.userId || u.id === s.providerId) || {};
      const safeUser = (typeof TLAuth !== "undefined" && TLAuth.sanitizeUser) ? TLAuth.sanitizeUser(user) : user;

      // Dynamic Category Resolution
      const catTitle = s.categoryTitle || this.getCategoryTitle(s.categoryId);

      // Avatar
      const proAvatar = pro.avatar || pro.profileImage || (typeof TLAuth !== "undefined" && TLAuth.getDefaultProviderAvatar ? TLAuth.getDefaultProviderAvatar(s.categoryId, s.providerId) : "https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=120");

      // Booking telemetry
      const matchedBookings = bookings.filter(b => b.serviceId === s.id);
      const activeBookings = matchedBookings.filter(b => ["pending", "accepted", "in_progress"].includes(b.status));
      const completedBookings = matchedBookings.filter(b => b.status === "completed");

      // Compute provider rating
      let rating = pro.rating || 5.0;
      let reviewCount = pro.reviewCount || 0;
      if (typeof TLBookings !== "undefined" && TLBookings.getProviderReviews && pro.id) {
        const revs = TLBookings.getProviderReviews(pro.id);
        if (revs.length > 0) {
          reviewCount = revs.length;
          rating = Number((revs.reduce((sum, r) => sum + r.rating, 0) / revs.length).toFixed(1));
        }
      }

      return {
        ...s,
        categoryTitle: catTitle,
        isAvailable: s.isAvailable !== false,
        pricingType: s.pricingType || "fixed",
        priceAmount: s.priceAmount !== undefined ? s.priceAmount : null,
        priceUnit: s.priceUnit || "job",
        providerName: pro.businessName || user.fullName || "Independent Specialist",
        providerLegalName: user.fullName || pro.name || "Specialist",
        providerAvatar: proAvatar,
        providerCity: pro.city || user.city || "Islamabad",
        providerPhone: user.phone || pro.contactPhone || "—",
        providerEmail: user.email || pro.contactEmail || "—",
        providerRating: rating,
        providerReviewCount: reviewCount,
        provider: pro,
        user: safeUser,
        totalBookingsCount: matchedBookings.length,
        activeBookingsCount: activeBookings.length,
        completedBookingsCount: completedBookings.length
      };
    });
  },

  getServiceFullDossier(serviceId) {
    this.init();
    const joined = this.getAllServicesJoined();
    const service = joined.find(s => s.id === serviceId);
    if (!service) return null;

    let bookings = [];
    if (typeof TLBookings !== "undefined" && TLBookings.getAllBookings) {
      bookings = TLBookings.getAllBookings().filter(b => b.serviceId === serviceId);
    } else {
      try {
        const raw = JSON.parse(localStorage.getItem(this.STORAGE_KEYS.BOOKINGS)) || [];
        bookings = raw.filter(b => b.serviceId === serviceId);
      } catch (e) { }
    }

    return {
      service,
      bookings
    };
  },

  adminCreateService({ title, categoryId, providerId, pricingType = "fixed", priceAmount, priceUnit = "job", description, isAvailable = true }, adminId = "admin") {
    this.init();
    if (!title || title.trim().length < 5) {
      return { success: false, error: "Service title must be at least 5 characters long." };
    }
    if (!description || description.trim().length < 15) {
      return { success: false, error: "Please provide a detailed service description (min 15 characters)." };
    }
    if (!categoryId) {
      return { success: false, error: "Please select a valid service trade category." };
    }
    if (!providerId) {
      return { success: false, error: "Please associate the service with an active registered professional." };
    }

    const categoryTitle = this.getCategoryTitle(categoryId);
    const parsedAmount = (pricingType === "upon_request") ? null : (parseFloat(priceAmount) || 0);

    const newService = {
      id: "srv-" + (typeof TLAuth !== "undefined" ? TLAuth.generateUUID().substring(0, 8) : Math.random().toString(36).substring(2, 10)),
      providerId,
      categoryId,
      categoryTitle,
      title: title.trim(),
      description: description.trim(),
      pricingType: pricingType || "fixed",
      priceAmount: parsedAmount,
      priceUnit: priceUnit || "job",
      currency: "PKR",
      isAvailable: Boolean(isAvailable),
      createdAt: new Date().toISOString()
    };

    const services = this.getAllServices();
    services.unshift(newService);
    localStorage.setItem(this.STORAGE_KEYS.SERVICES, JSON.stringify(services));

    if (typeof TLCommunication !== "undefined" && TLCommunication.logAdminAction) {
      TLCommunication.logAdminAction({
        actionType: "SERVICE_CREATED",
        targetType: "service",
        targetId: newService.id,
        details: `Administrator created service '${newService.title}' (${newService.id}) under category '${categoryTitle}' for provider '${providerId}'.`,
        adminId
      });
    }

    return { success: true, service: newService };
  },

  adminUpdateService(serviceId, updates, adminId = "admin") {
    this.init();
    const services = this.getAllServices();
    const idx = services.findIndex(s => s.id === serviceId);

    if (idx === -1) {
      return { success: false, error: "Service listing not found." };
    }

    const current = services[idx];
    if (updates.title !== undefined) {
      if (!updates.title || updates.title.trim().length < 5) {
        return { success: false, error: "Service title must be at least 5 characters long." };
      }
      current.title = updates.title.trim();
    }

    if (updates.description !== undefined) {
      if (!updates.description || updates.description.trim().length < 15) {
        return { success: false, error: "Please provide a detailed service description (min 15 characters)." };
      }
      current.description = updates.description.trim();
    }

    if (updates.categoryId) {
      current.categoryId = updates.categoryId;
      current.categoryTitle = this.getCategoryTitle(updates.categoryId);
    }

    if (updates.providerId) {
      current.providerId = updates.providerId;
    }

    if (updates.pricingType !== undefined) {
      current.pricingType = updates.pricingType;
      if (updates.pricingType === "upon_request") {
        current.priceAmount = null;
      } else if (updates.priceAmount !== undefined) {
        current.priceAmount = parseFloat(updates.priceAmount) || 0;
      }
    } else if (updates.priceAmount !== undefined) {
      current.priceAmount = parseFloat(updates.priceAmount) || 0;
    }

    if (updates.priceUnit !== undefined) {
      current.priceUnit = updates.priceUnit.trim();
    }

    if (updates.isAvailable !== undefined) {
      current.isAvailable = Boolean(updates.isAvailable);
    }

    current.updatedAt = new Date().toISOString();
    services[idx] = current;
    localStorage.setItem(this.STORAGE_KEYS.SERVICES, JSON.stringify(services));

    if (typeof TLCommunication !== "undefined" && TLCommunication.logAdminAction) {
      TLCommunication.logAdminAction({
        actionType: "SERVICE_UPDATED",
        targetType: "service",
        targetId: serviceId,
        details: `Administrator updated service '${current.title}' (${serviceId}): category=${current.categoryTitle}, available=${current.isAvailable}.`,
        adminId
      });
    }

    return { success: true, service: current };
  },

  adminToggleServiceAvailability(serviceId, adminId = "admin") {
    this.init();
    const services = this.getAllServices();
    const idx = services.findIndex(s => s.id === serviceId);

    if (idx === -1) {
      return { success: false, error: "Service listing not found." };
    }

    services[idx].isAvailable = !services[idx].isAvailable;
    services[idx].updatedAt = new Date().toISOString();
    localStorage.setItem(this.STORAGE_KEYS.SERVICES, JSON.stringify(services));

    if (typeof TLCommunication !== "undefined" && TLCommunication.logAdminAction) {
      TLCommunication.logAdminAction({
        actionType: "SERVICE_AVAILABILITY_TOGGLED",
        targetType: "service",
        targetId: serviceId,
        details: `Administrator toggled availability for '${services[idx].title}' (${serviceId}) to ${services[idx].isAvailable ? 'AVAILABLE' : 'PAUSED'}.`,
        adminId
      });
    }

    return { success: true, isAvailable: services[idx].isAvailable, service: services[idx] };
  },

  adminDeleteService(serviceId, adminId = "admin") {
    this.init();
    const services = this.getAllServices();
    const idx = services.findIndex(s => s.id === serviceId);

    if (idx === -1) {
      return { success: false, error: "Service listing not found." };
    }

    const serviceToDelete = services[idx];

    // Referential integrity check (BR-07): Cannot delete if active bookings exist
    let bookings = [];
    if (typeof TLBookings !== "undefined" && TLBookings.getAllBookings) {
      bookings = TLBookings.getAllBookings();
    } else {
      try {
        bookings = JSON.parse(localStorage.getItem(this.STORAGE_KEYS.BOOKINGS)) || [];
      } catch (e) { }
    }

    const activeBookings = bookings.filter(b => b.serviceId === serviceId && ["pending", "accepted", "in_progress"].includes(b.status));
    if (activeBookings.length > 0) {
      const ids = activeBookings.map(b => b.id).join(", ");
      return {
        success: false,
        error: `Cannot delete service '${serviceToDelete.title}' because it has ${activeBookings.length} active client booking request(s) (${ids}). Please finalize or cancel ongoing bookings, or pause service availability instead.`
      };
    }

    services.splice(idx, 1);
    localStorage.setItem(this.STORAGE_KEYS.SERVICES, JSON.stringify(services));

    if (typeof TLCommunication !== "undefined" && TLCommunication.logAdminAction) {
      TLCommunication.logAdminAction({
        actionType: "SERVICE_DELETED",
        targetType: "service",
        targetId: serviceId,
        details: `Administrator deleted service listing '${serviceToDelete.title}' (${serviceId}) under category '${serviceToDelete.categoryTitle}'.`,
        adminId
      });
    }

    return { success: true, deletedService: serviceToDelete };
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
    } catch (e) { }
  }
};

/**
 * TradeLinker Subscriptions & Plans Management Engine
 * Manages subscription tiers, provider active plans, renewals, and platform monetization records.
 * Directly connected to localStorage ("tl_db_subscriptions", "tl_db_subscription_plans").
 */
const TLSubscriptions = {
  STORAGE_KEYS: {
    SUBSCRIPTIONS: "tl_db_subscriptions",
    PLANS: "tl_db_subscription_plans",
    SUBSCRIPTIONS_ALT: "subscriptions",
    PLANS_ALT: "subscription_plans"
  },

  init() {
    const rawPlans = localStorage.getItem(this.STORAGE_KEYS.PLANS) || localStorage.getItem(this.STORAGE_KEYS.PLANS_ALT);
    if (!rawPlans || rawPlans === "[]") {
      this.seedInitialPlans();
    } else {
      // Ensure existing plans have durationDays & is_active
      try {
        const parsed = JSON.parse(rawPlans);
        let updated = false;
        parsed.forEach(p => {
          if (typeof p.durationDays === "undefined") {
            p.durationDays = p.id === "plan-starter" ? 365 : (p.id === "plan-enterprise" ? 90 : 30);
            updated = true;
          }
          if (typeof p.is_active === "undefined") {
            p.is_active = true;
            updated = true;
          }
          if (!p.createdAt) {
            p.createdAt = new Date().toISOString();
            updated = true;
          }
        });
        if (updated) {
          localStorage.setItem(this.STORAGE_KEYS.PLANS, JSON.stringify(parsed));
          localStorage.setItem(this.STORAGE_KEYS.PLANS_ALT, JSON.stringify(parsed));
        }
      } catch (e) {}
    }

    const rawSubs = localStorage.getItem(this.STORAGE_KEYS.SUBSCRIPTIONS) || localStorage.getItem(this.STORAGE_KEYS.SUBSCRIPTIONS_ALT);
    if (!rawSubs || rawSubs === "[]") {
      this.seedInitialSubscriptions();
    } else {
      // Ensure existing subscriptions have expirationDate & renewalDate
      try {
        const parsed = JSON.parse(rawSubs);
        let updated = false;
        parsed.forEach(s => {
          if (!s.expirationDate && s.renewalDate) {
            s.expirationDate = s.renewalDate;
            updated = true;
          }
          if (!s.renewalDate && s.expirationDate) {
            s.renewalDate = s.expirationDate;
            updated = true;
          }
        });
        if (updated) {
          localStorage.setItem(this.STORAGE_KEYS.SUBSCRIPTIONS, JSON.stringify(parsed));
          localStorage.setItem(this.STORAGE_KEYS.SUBSCRIPTIONS_ALT, JSON.stringify(parsed));
        }
      } catch (e) {}
    }
  },

  seedInitialPlans() {
    const plans = [
      {
        id: "plan-starter",
        name: "Starter Professional",
        slug: "starter-professional",
        price: 0,
        priceDisplay: "Free",
        period: "Forever",
        durationDays: 365,
        commission: "7% Fee",
        badge: "Standard",
        badgeClass: "tl-badge-accepted",
        isPopular: false,
        is_active: true,
        prosCount: "4 Active Pros",
        description: "Essential listing presence for entry-level trade specialists.",
        features: [
          "Standard category placement in search",
          "Up to 3 active service listings",
          "Direct client messaging & quoting",
          "Standard customer review badge"
        ],
        createdAt: "2026-09-01T00:00:00.000Z",
        updatedAt: "2026-09-01T00:00:00.000Z"
      },
      {
        id: "plan-pro",
        name: "TradeLinker Pro",
        slug: "tradelinker-pro",
        price: 3500,
        priceDisplay: "PKR 3,500",
        period: "/month",
        durationDays: 30,
        commission: "4% Fee",
        badge: "Verified Pro",
        badgeClass: "tl-badge-completed",
        isPopular: true,
        is_active: true,
        prosCount: "12 Active Pros",
        description: "Priority search visibility and lower fees for certified professionals.",
        features: [
          "Priority category placement in search results",
          "Unlimited active service listings",
          "Verified Specialist trust badge on profile",
          "Direct customer phone quoting & lead alerts",
          "Dedicated priority support channel"
        ],
        createdAt: "2026-09-01T00:00:00.000Z",
        updatedAt: "2026-09-01T00:00:00.000Z"
      },
      {
        id: "plan-enterprise",
        name: "Enterprise Contractor",
        slug: "enterprise-contractor",
        price: 9000,
        priceDisplay: "PKR 9,000",
        period: "/quarter",
        durationDays: 90,
        commission: "2.5% Fee",
        badge: "Top Tier",
        badgeClass: "tl-badge-premium",
        isPopular: false,
        is_active: true,
        prosCount: "5 Active Pros",
        description: "Turnkey multi-crew construction & technical engineering contractors.",
        features: [
          "Featured top-of-category hero badge",
          "Multi-team booking management",
          "Lowest platform commission tier (2.5%)",
          "VIP 24/7 dedicated account manager",
          "Commercial enterprise bidding priority"
        ],
        createdAt: "2026-09-01T00:00:00.000Z",
        updatedAt: "2026-09-01T00:00:00.000Z"
      },
      {
        id: "plan-annual-elite",
        name: "Annual Elite Pro",
        slug: "annual-elite-pro",
        price: 36000,
        priceDisplay: "PKR 36,000",
        period: "/year",
        durationDays: 365,
        commission: "3% Fee",
        badge: "Annual Elite",
        badgeClass: "tl-badge-in-progress",
        isPopular: false,
        is_active: false,
        prosCount: "0 Active Pros",
        description: "Discounted 1-year prepaid membership with dedicated marketing push.",
        features: [
          "Permanent verified featured placement for 12 months",
          "Zero renewal overhead for 365 days",
          "Custom video portfolio showcase inclusion",
          "Quarterly business review with platform directors"
        ],
        createdAt: "2026-09-10T00:00:00.000Z",
        updatedAt: "2026-09-10T00:00:00.000Z"
      }
    ];
    localStorage.setItem(this.STORAGE_KEYS.PLANS, JSON.stringify(plans));
    localStorage.setItem(this.STORAGE_KEYS.PLANS_ALT, JSON.stringify(plans));
  },

  seedInitialSubscriptions() {
    const subs = [
      {
        id: "SUB-801",
        providerId: "prov-profile-001",
        providerName: "Engr. Rashid Khan",
        businessName: "Khan Electrical & Automation",
        categoryTitle: "Electrical Services",
        planId: "plan-pro",
        planName: "TradeLinker Pro",
        billingCycle: "Monthly",
        amount: 3500,
        startDate: "2026-10-01",
        expirationDate: "2026-11-01",
        renewalDate: "2026-11-01",
        status: "active",
        paymentMethod: "JazzCash / Bank Transfer",
        autoRenew: true,
        createdAt: "2026-10-01T08:00:00.000Z"
      },
      {
        id: "SUB-802",
        providerId: "prov-profile-002",
        providerName: "Tariq Mehmood",
        businessName: "Capital Sanitary & Plumbing Masters",
        categoryTitle: "Plumbing Services",
        planId: "plan-starter",
        planName: "Starter Professional",
        billingCycle: "Forever",
        amount: 0,
        startDate: "2026-09-15",
        expirationDate: "2027-09-15",
        renewalDate: "2027-09-15",
        status: "active",
        paymentMethod: "Free Tier",
        autoRenew: false,
        createdAt: "2026-09-15T09:30:00.000Z"
      },
      {
        id: "SUB-803",
        providerId: "prov-profile-003",
        providerName: "Usman Ghani",
        businessName: "SunPower Smart Energy Solutions",
        categoryTitle: "Solar Energy Services",
        planId: "plan-enterprise",
        planName: "Enterprise Contractor",
        billingCycle: "Quarterly",
        amount: 27000,
        startDate: "2026-09-01",
        expirationDate: "2026-12-01",
        renewalDate: "2026-12-01",
        status: "active",
        paymentMethod: "Direct IBFT (Habib Bank)",
        autoRenew: true,
        createdAt: "2026-09-01T11:00:00.000Z"
      },
      {
        id: "SUB-804",
        providerId: "prov-005",
        providerName: "Malik Shahzad",
        businessName: "CoolBreeze AC & Heating Solutions",
        categoryTitle: "AC & HVAC Services",
        planId: "plan-pro",
        planName: "TradeLinker Pro",
        billingCycle: "Monthly",
        amount: 3500,
        startDate: "2026-10-10",
        expirationDate: "2026-11-10",
        renewalDate: "2026-11-10",
        status: "expiring",
        paymentMethod: "EasyPaisa",
        autoRenew: true,
        createdAt: "2026-10-10T14:15:00.000Z"
      },
      {
        id: "SUB-805",
        providerId: "prov-006",
        providerName: "Engr. Bilal Farooq",
        businessName: "Apex Civil & Construction Builders",
        categoryTitle: "Construction Services",
        planId: "plan-enterprise",
        planName: "Enterprise Contractor",
        billingCycle: "Monthly",
        amount: 9000,
        startDate: "2026-10-15",
        expirationDate: "2026-11-15",
        renewalDate: "2026-11-15",
        status: "active",
        paymentMethod: "Meezan Bank Raast",
        autoRenew: true,
        createdAt: "2026-10-15T16:00:00.000Z"
      },
      {
        id: "SUB-806",
        providerId: "prov-003",
        providerName: "Ghulam Murtaza",
        businessName: "Murtaza Master Carpentry & Doors",
        categoryTitle: "Wooden Door Making & Carpentry",
        planId: "plan-pro",
        planName: "TradeLinker Pro",
        billingCycle: "Monthly",
        amount: 3500,
        startDate: "2026-10-05",
        expirationDate: "2026-11-05",
        renewalDate: "2026-11-05",
        status: "active",
        paymentMethod: "Bank Al Habib",
        autoRenew: true,
        createdAt: "2026-10-05T12:00:00.000Z"
      },
      {
        id: "SUB-807",
        providerId: "prov-004",
        providerName: "Nasir Iqbal",
        businessName: "Rawal Master Plumbing Services",
        categoryTitle: "Plumbing Services",
        planId: "plan-pro",
        planName: "TradeLinker Pro",
        billingCycle: "Monthly",
        amount: 3500,
        startDate: "2026-08-01",
        expirationDate: "2026-09-01",
        renewalDate: "2026-09-01",
        status: "expired",
        paymentMethod: "JazzCash",
        autoRenew: false,
        createdAt: "2026-08-01T10:00:00.000Z"
      },
      {
        id: "SUB-808",
        providerId: "prov-007",
        providerName: "Zeeshan Akram",
        businessName: "Speedy Moving & Freight Logistics",
        categoryTitle: "Home Relocation & Cargo",
        planId: "plan-starter",
        planName: "Starter Professional",
        billingCycle: "Forever",
        amount: 0,
        startDate: "2026-07-01",
        expirationDate: "2026-08-01",
        renewalDate: "2026-08-01",
        status: "cancelled",
        paymentMethod: "None",
        autoRenew: false,
        createdAt: "2026-07-01T09:00:00.000Z"
      }
    ];
    localStorage.setItem(this.STORAGE_KEYS.SUBSCRIPTIONS, JSON.stringify(subs));
    localStorage.setItem(this.STORAGE_KEYS.SUBSCRIPTIONS_ALT, JSON.stringify(subs));
  },

  getPlans() {
    this.init();
    try {
      const raw = localStorage.getItem(this.STORAGE_KEYS.PLANS) || localStorage.getItem(this.STORAGE_KEYS.PLANS_ALT);
      return JSON.parse(raw) || [];
    } catch (e) {
      return [];
    }
  },

  getAllPlans() {
    return this.getPlans();
  },

  getPlanById(planId) {
    if (!planId) return null;
    return this.getPlans().find(p => p.id === planId) || null;
  },

  adminCreatePlan({
    name,
    description,
    price = 0,
    durationDays = 30,
    features = [],
    commission = "5% Fee",
    badge = "Pro",
    isPopular = false,
    isActive = true,
    adminId = "usr-admin-001"
  }) {
    this.init();
    if (!name || !name.trim() || name.trim().length < 3) {
      return { success: false, error: "Plan name must be at least 3 characters long." };
    }
    const plans = this.getPlans();
    const cleanName = name.trim();
    if (plans.some(p => p.name.toLowerCase() === cleanName.toLowerCase())) {
      return { success: false, error: `A subscription plan named '${cleanName}' already exists.` };
    }
    const numPrice = Number(price);
    if (isNaN(numPrice) || numPrice < 0) {
      return { success: false, error: "Plan price must be a valid non-negative number." };
    }
    const numDays = parseInt(durationDays, 10);
    if (isNaN(numDays) || numDays <= 0) {
      return { success: false, error: "Duration in days must be a positive integer greater than zero." };
    }

    const slug = cleanName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    let newId = `plan-${slug}`;
    if (plans.some(p => p.id === newId)) {
      newId = `plan-${slug}-${Math.floor(100 + Math.random() * 900)}`;
    }

    const featArr = Array.isArray(features)
      ? features
      : (typeof features === "string" ? features.split('\n').map(s => s.trim()).filter(Boolean) : []);

    const newPlan = {
      id: newId,
      name: cleanName,
      slug,
      description: description ? description.trim() : "Custom subscription plan for verified professionals.",
      price: numPrice,
      priceDisplay: numPrice === 0 ? "Free" : `PKR ${numPrice.toLocaleString()}`,
      durationDays: numDays,
      period: numDays >= 365 ? "Forever / 365 Days" : `/${numDays} Days`,
      commission: commission ? commission.trim() : "5% Fee",
      badge: badge ? badge.trim() : "Pro",
      badgeClass: isPopular ? "tl-badge-completed" : "tl-badge-accepted",
      isPopular: !!isPopular,
      is_active: isActive !== false,
      prosCount: "0 Active Pros",
      features: featArr.length > 0 ? featArr : ["Standard search placement", "Direct client contact"],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    plans.push(newPlan);
    localStorage.setItem(this.STORAGE_KEYS.PLANS, JSON.stringify(plans));
    localStorage.setItem(this.STORAGE_KEYS.PLANS_ALT, JSON.stringify(plans));

    // Audit Logging
    if (typeof TLCommunication !== "undefined" && TLCommunication.logAdminAction) {
      TLCommunication.logAdminAction({
        actionType: "PLAN_CREATED",
        entityType: "subscription_plan",
        entityId: newPlan.id,
        targetType: "subscription_plan",
        targetId: newPlan.id,
        details: `Administrator (${adminId}) created Subscription Plan [${newPlan.name}] (Price: PKR ${newPlan.price}, Duration: ${newPlan.durationDays} days).`,
        adminId
      });
    }

    return { success: true, plan: newPlan };
  },

  adminUpdatePlan({
    planId,
    name,
    description,
    price,
    durationDays,
    features,
    commission,
    badge,
    isPopular,
    isActive,
    adminId = "usr-admin-001"
  }) {
    this.init();
    if (!planId) return { success: false, error: "Plan ID is required." };
    const plans = this.getPlans();
    const idx = plans.findIndex(p => p.id === planId);
    if (idx === -1) return { success: false, error: `Plan #${planId} not found.` };

    const plan = plans[idx];

    if (name && name.trim()) {
      const cleanName = name.trim();
      const duplicate = plans.find(p => p.id !== planId && p.name.toLowerCase() === cleanName.toLowerCase());
      if (duplicate) return { success: false, error: `Another plan named '${cleanName}' already exists.` };
      plan.name = cleanName;
      plan.slug = cleanName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    }

    if (typeof price !== "undefined") {
      const numPrice = Number(price);
      if (isNaN(numPrice) || numPrice < 0) return { success: false, error: "Price must be non-negative." };
      plan.price = numPrice;
      plan.priceDisplay = numPrice === 0 ? "Free" : `PKR ${numPrice.toLocaleString()}`;
    }

    if (typeof durationDays !== "undefined") {
      const numDays = parseInt(durationDays, 10);
      if (isNaN(numDays) || numDays <= 0) return { success: false, error: "Duration in days must be greater than zero." };
      plan.durationDays = numDays;
      plan.period = numDays >= 365 ? "Forever / 365 Days" : `/${numDays} Days`;
    }

    if (typeof description !== "undefined") plan.description = description.trim();
    if (typeof commission !== "undefined") plan.commission = commission.trim();
    if (typeof badge !== "undefined") plan.badge = badge.trim();
    if (typeof isPopular !== "undefined") {
      plan.isPopular = !!isPopular;
      plan.badgeClass = plan.isPopular ? "tl-badge-completed" : "tl-badge-accepted";
    }
    if (typeof isActive !== "undefined") plan.is_active = !!isActive;
    if (features) {
      plan.features = Array.isArray(features)
        ? features
        : (typeof features === "string" ? features.split('\n').map(s => s.trim()).filter(Boolean) : plan.features);
    }

    plan.updatedAt = new Date().toISOString();
    plans[idx] = plan;

    localStorage.setItem(this.STORAGE_KEYS.PLANS, JSON.stringify(plans));
    localStorage.setItem(this.STORAGE_KEYS.PLANS_ALT, JSON.stringify(plans));

    // Audit Logging
    if (typeof TLCommunication !== "undefined" && TLCommunication.logAdminAction) {
      TLCommunication.logAdminAction({
        actionType: "PLAN_UPDATED",
        entityType: "subscription_plan",
        entityId: plan.id,
        targetType: "subscription_plan",
        targetId: plan.id,
        details: `Administrator (${adminId}) updated Subscription Plan [${plan.name}] (PKR ${plan.price}, ${plan.durationDays} days).`,
        adminId
      });
    }

    return { success: true, plan };
  },

  adminTogglePlanStatus({ planId, adminId = "usr-admin-001" }) {
    this.init();
    if (!planId) return { success: false, error: "Plan ID is required." };
    const plans = this.getPlans();
    const plan = plans.find(p => p.id === planId);
    if (!plan) return { success: false, error: `Plan #${planId} not found.` };

    plan.is_active = !plan.is_active;
    plan.updatedAt = new Date().toISOString();

    localStorage.setItem(this.STORAGE_KEYS.PLANS, JSON.stringify(plans));
    localStorage.setItem(this.STORAGE_KEYS.PLANS_ALT, JSON.stringify(plans));

    // Audit Logging
    if (typeof TLCommunication !== "undefined" && TLCommunication.logAdminAction) {
      TLCommunication.logAdminAction({
        actionType: plan.is_active ? "PLAN_ACTIVATED" : "PLAN_DEACTIVATED",
        entityType: "subscription_plan",
        entityId: plan.id,
        targetType: "subscription_plan",
        targetId: plan.id,
        details: `Administrator (${adminId}) ${plan.is_active ? "ACTIVATED" : "DEACTIVATED"} Subscription Plan [${plan.name}] (${plan.id}).`,
        adminId
      });
    }

    return { success: true, is_active: plan.is_active, plan };
  },

  adminDeletePlan({ planId, adminId = "usr-admin-001" }) {
    this.init();
    if (!planId) return { success: false, error: "Plan ID is required." };
    const plans = this.getPlans();
    const plan = plans.find(p => p.id === planId);
    if (!plan) return { success: false, error: `Plan #${planId} not found.` };

    // Prevent deletion if active subscriptions are attached
    const subs = this.getAllSubscriptions();
    const activeAttached = subs.filter(s => s.planId === planId && s.status === "active");
    if (activeAttached.length > 0) {
      return {
        success: false,
        error: `Cannot delete plan '${plan.name}': ${activeAttached.length} active professional subscription(s) are currently attached to it. Please reassign those subscriptions first.`
      };
    }

    const remaining = plans.filter(p => p.id !== planId);
    localStorage.setItem(this.STORAGE_KEYS.PLANS, JSON.stringify(remaining));
    localStorage.setItem(this.STORAGE_KEYS.PLANS_ALT, JSON.stringify(remaining));

    // Audit Logging
    if (typeof TLCommunication !== "undefined" && TLCommunication.logAdminAction) {
      TLCommunication.logAdminAction({
        actionType: "PLAN_DELETED",
        entityType: "subscription_plan",
        entityId: planId,
        targetType: "subscription_plan",
        targetId: planId,
        details: `Administrator (${adminId}) deleted Subscription Plan [${plan.name}] (${planId}).`,
        adminId
      });
    }

    return { success: true };
  },

  // --------------------------------------------------------------------------
  // Professional Subscriptions
  // --------------------------------------------------------------------------
  getAllSubscriptions() {
    this.init();
    try {
      const raw = localStorage.getItem(this.STORAGE_KEYS.SUBSCRIPTIONS) || localStorage.getItem(this.STORAGE_KEYS.SUBSCRIPTIONS_ALT);
      return JSON.parse(raw) || [];
    } catch (e) {
      return [];
    }
  },

  getActiveSubscriptions() {
    return this.getAllSubscriptions().filter(s => s.status === "active");
  },

  getAllSubscriptionsJoined() {
    const rawSubs = this.getAllSubscriptions();
    const plans = this.getPlans();
    const providers = (typeof TLAuth !== "undefined" && TLAuth.getProviders) ? TLAuth.getProviders() : [];
    const users = (typeof TLAuth !== "undefined" && TLAuth.getUsers) ? TLAuth.getUsers() : [];

    return rawSubs.map(s => {
      const plan = plans.find(p => p.id === s.planId) || {
        id: s.planId,
        name: s.planName || "Custom Plan",
        price: s.amount || 0,
        durationDays: 30,
        badge: "Pro",
        commission: "5% Fee"
      };

      const provider = providers.find(p => p.id === s.providerId || p.userId === s.providerId) || null;
      const user = users.find(u => u.id === s.providerId || (provider && u.id === provider.userId)) || null;

      const expDate = s.expirationDate || s.renewalDate || "";
      const rewDate = s.renewalDate || s.expirationDate || "";

      return {
        ...s,
        expirationDate: expDate,
        renewalDate: rewDate,
        plan,
        provider: provider ? {
          id: provider.id,
          businessName: provider.businessName || s.businessName || s.providerName,
          fullName: user?.fullName || provider.businessName || s.providerName,
          phone: user?.phoneNumber || provider.phone || "N/A",
          email: user?.email || provider.email || "N/A",
          avatar: provider.avatar || user?.avatar || "assets/images/specialists/default-avatar.png",
          verificationStatus: provider.verificationStatus || "verified",
          rating: provider.rating || 5.0
        } : {
          id: s.providerId,
          businessName: s.businessName || s.providerName,
          fullName: s.providerName,
          phone: "N/A",
          email: "N/A",
          avatar: "assets/images/specialists/default-avatar.png",
          verificationStatus: "verified",
          rating: 5.0
        }
      };
    });
  },

  getSubscriptionById(subId) {
    if (!subId) return null;
    return this.getAllSubscriptionsJoined().find(s => s.id === subId) || null;
  },

  adminUpdateSubscriptionStatus({ subId, status, notes = "", adminId = "usr-admin-001" }) {
    this.init();
    if (!subId) return { success: false, error: "Subscription ID is required." };
    const validStatuses = ["active", "expiring", "expired", "cancelled"];
    if (!validStatuses.includes(status)) {
      return { success: false, error: `Invalid status: '${status}'. Allowed: ${validStatuses.join(", ")}` };
    }

    const subs = this.getAllSubscriptions();
    const idx = subs.findIndex(s => s.id === subId);
    if (idx === -1) return { success: false, error: `Subscription #${subId} not found.` };

    const oldStatus = subs[idx].status;
    subs[idx].status = status;
    if (notes) subs[idx].notes = notes.trim();
    subs[idx].updatedAt = new Date().toISOString();

    localStorage.setItem(this.STORAGE_KEYS.SUBSCRIPTIONS, JSON.stringify(subs));
    localStorage.setItem(this.STORAGE_KEYS.SUBSCRIPTIONS_ALT, JSON.stringify(subs));

    // Audit Logging
    if (typeof TLCommunication !== "undefined" && TLCommunication.logAdminAction) {
      TLCommunication.logAdminAction({
        actionType: "SUBSCRIPTION_STATUS_UPDATED",
        entityType: "subscription",
        entityId: subId,
        targetType: "subscription",
        targetId: subId,
        details: `Administrator (${adminId}) changed Subscription #${subId} status from [${oldStatus.toUpperCase()}] to [${status.toUpperCase()}]. Note: ${notes || 'N/A'}`,
        adminId
      });
    }

    return { success: true, subscription: subs[idx] };
  },

  adminRenewSubscription({ subId, durationDays, paymentMethod, adminId = "usr-admin-001" }) {
    this.init();
    if (!subId) return { success: false, error: "Subscription ID is required." };
    const subs = this.getAllSubscriptions();
    const idx = subs.findIndex(s => s.id === subId);
    if (idx === -1) return { success: false, error: `Subscription #${subId} not found.` };

    const sub = subs[idx];
    const plan = this.getPlanById(sub.planId);
    const daysToAdd = parseInt(durationDays, 10) || plan?.durationDays || 30;

    // Calculate new expiration date
    let baseDate = new Date();
    const currentExp = new Date(sub.expirationDate || sub.renewalDate || 0);
    if (!isNaN(currentExp.getTime()) && currentExp > baseDate) {
      baseDate = currentExp;
    }
    const newExp = new Date(baseDate.getTime() + daysToAdd * 24 * 60 * 60 * 1000);
    const newExpStr = newExp.toISOString().split('T')[0];

    sub.expirationDate = newExpStr;
    sub.renewalDate = newExpStr;
    sub.status = "active";
    if (paymentMethod) sub.paymentMethod = paymentMethod;
    sub.updatedAt = new Date().toISOString();

    subs[idx] = sub;
    localStorage.setItem(this.STORAGE_KEYS.SUBSCRIPTIONS, JSON.stringify(subs));
    localStorage.setItem(this.STORAGE_KEYS.SUBSCRIPTIONS_ALT, JSON.stringify(subs));

    // Audit Logging
    if (typeof TLCommunication !== "undefined" && TLCommunication.logAdminAction) {
      TLCommunication.logAdminAction({
        actionType: "SUBSCRIPTION_RENEWED",
        entityType: "subscription",
        entityId: subId,
        targetType: "subscription",
        targetId: subId,
        details: `Administrator (${adminId}) renewed Subscription #${subId} for ${daysToAdd} days until ${newExpStr}. Method: ${paymentMethod || sub.paymentMethod}.`,
        adminId
      });
    }

    return { success: true, subscription: sub, newExpirationDate: newExpStr };
  },

  adminAssignSubscription({
    providerId,
    planId,
    billingCycle = "Monthly",
    paymentMethod = "Manual Admin Grant",
    startDate,
    durationDays,
    adminId = "usr-admin-001"
  }) {
    this.init();
    if (!providerId) return { success: false, error: "Provider ID is required." };
    if (!planId) return { success: false, error: "Plan ID is required." };

    const plans = this.getPlans();
    const plan = plans.find(p => p.id === planId);
    if (!plan) return { success: false, error: `Plan #${planId} not found.` };

    const providers = (typeof TLAuth !== "undefined" && TLAuth.getProviders) ? TLAuth.getProviders() : [];
    const provider = providers.find(p => p.id === providerId || p.userId === providerId);
    const providerName = provider?.businessName || provider?.fullName || providerId;

    const startStr = startDate || new Date().toISOString().split('T')[0];
    const days = parseInt(durationDays, 10) || plan.durationDays || 30;
    const expDate = new Date(new Date(startStr).getTime() + days * 24 * 60 * 60 * 1000);
    const expStr = expDate.toISOString().split('T')[0];

    const subs = this.getAllSubscriptions();
    const newSub = {
      id: "SUB-" + Math.floor(810 + Math.random() * 190),
      providerId,
      providerName,
      businessName: provider?.businessName || providerName,
      categoryTitle: provider?.categoryTitle || "Specialist Service",
      planId: plan.id,
      planName: plan.name,
      billingCycle,
      amount: plan.price,
      startDate: startStr,
      expirationDate: expStr,
      renewalDate: expStr,
      status: "active",
      paymentMethod,
      autoRenew: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    subs.unshift(newSub);
    localStorage.setItem(this.STORAGE_KEYS.SUBSCRIPTIONS, JSON.stringify(subs));
    localStorage.setItem(this.STORAGE_KEYS.SUBSCRIPTIONS_ALT, JSON.stringify(subs));

    // Audit Logging
    if (typeof TLCommunication !== "undefined" && TLCommunication.logAdminAction) {
      TLCommunication.logAdminAction({
        actionType: "SUBSCRIPTION_ASSIGNED",
        entityType: "subscription",
        entityId: newSub.id,
        targetType: "subscription",
        targetId: newSub.id,
        details: `Administrator (${adminId}) assigned Plan [${plan.name}] to Professional ${providerName} (Subscription #${newSub.id}, valid until ${expStr}).`,
        adminId
      });
    }

    return { success: true, subscription: newSub };
  }
};

if (typeof window !== "undefined") {
  window.TLServices = TLServices;
  window.TLSubscriptions = TLSubscriptions;
  TLServices.init();
  TLSubscriptions.init();
}
