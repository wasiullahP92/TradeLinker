/**
 * TradeLinker Communication, Disputes, Moderation & Admin Audit Engine
 * Techminds (Wasi Ullah & Hamad Ullah)
 * 
 * Manages:
 * 1. Booking-related messaging between customer and provider
 * 2. Complaints, issues, and platform dispute resolution
 * 3. Review & inappropriate content moderation
 * 4. Service category activation / deactivation controls
 * 5. Provider verification review workflows (Approve, Reject, Request Info)
 * 6. Immutable administrator audit logging
 */

const TLCommunication = {
  STORAGE_KEYS: {
    MESSAGES: "tl_db_messages",
    DISPUTES: "tl_db_disputes",
    REPORTS: "tl_db_reported_content",
    CATEGORIES: "tl_db_categories",
    ADMIN_AUDIT: "tl_db_admin_audit",
    ADMIN_NOTIFS: "tl_db_admin_notifications",
    SETTINGS: "tl_db_marketplace_settings"
  },

  // --------------------------------------------------------------------------
  // 1. Initialization & Seeding
  // --------------------------------------------------------------------------
  init() {
    const rawCat = localStorage.getItem(this.STORAGE_KEYS.CATEGORIES);
    if (!rawCat || rawCat === '[]') {
      this.seedInitialCategories();
    } else {
      // Normalize existing categories to make sure all 9 schema fields are always present
      try {
        const list = JSON.parse(rawCat);
        let modified = false;
        list.forEach((c, idx) => {
          if (!c.name) { c.name = c.title || "Category"; modified = true; }
          if (!c.title) { c.title = c.name; modified = true; }
          if (!c.slug) { c.slug = c.id || c.name.toLowerCase().replace(/[^a-z0-9]/g, '-'); modified = true; }
          if (!c.id) { c.id = c.slug; modified = true; }
          if (c.display_order === undefined) { c.display_order = c.displayOrder || idx + 1; modified = true; }
          if (c.displayOrder === undefined) { c.displayOrder = c.display_order; modified = true; }
          if (c.is_active === undefined) { c.is_active = c.isActive !== undefined ? c.isActive : true; modified = true; }
          if (c.isActive === undefined) { c.isActive = c.is_active; modified = true; }
          if (!c.image) {
            const defaultImages = {
              construction: "https://images.unsplash.com/photo-1541888946425-d0fbb186156a?w=400&auto=format&fit=crop",
              plumbing: "https://images.unsplash.com/photo-1585704032915-c3400ca199e7?w=400&auto=format&fit=crop",
              electrical: "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=400&auto=format&fit=crop",
              hvac: "https://images.unsplash.com/photo-1631545648834-58537b98bf95?w=400&auto=format&fit=crop",
              solar: "https://images.unsplash.com/photo-1509391365360-2e959784a276?w=400&auto=format&fit=crop",
              carpentry: "https://images.unsplash.com/photo-1538688525198-9b88f6f53126?w=400&auto=format&fit=crop"
            };
            c.image = defaultImages[c.slug || c.id] || "https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=400&auto=format&fit=crop";
            modified = true;
          }
          if (!c.created_at) { c.created_at = c.createdAt || new Date().toISOString(); modified = true; }
          if (!c.createdAt) { c.createdAt = c.created_at; modified = true; }
          if (!c.updated_at) { c.updated_at = c.updatedAt || new Date().toISOString(); modified = true; }
          if (!c.updatedAt) { c.updatedAt = c.updated_at; modified = true; }
        });
        if (modified) {
          localStorage.setItem(this.STORAGE_KEYS.CATEGORIES, JSON.stringify(list));
        }
      } catch (e) {}
    }

    const rawDisp = localStorage.getItem(this.STORAGE_KEYS.DISPUTES);
    if (!rawDisp || rawDisp === '[]') this.seedInitialDisputes();

    const rawRep = localStorage.getItem(this.STORAGE_KEYS.REPORTS);
    if (!rawRep || rawRep === '[]') this.seedInitialReports();

    const rawMsg = localStorage.getItem(this.STORAGE_KEYS.MESSAGES);
    if (!rawMsg || rawMsg === '[]') this.seedInitialMessages();

    const rawAudit = localStorage.getItem(this.STORAGE_KEYS.ADMIN_AUDIT);
    if (!rawAudit || rawAudit === '[]') this.seedInitialAuditLogs();
  },

  seedInitialCategories() {
    const categories = [
      {
        id: "construction",
        name: "Construction Services",
        title: "Construction Services",
        slug: "construction",
        description: "Civil engineers, grey structure masonry, structural renovations, and site supervision.",
        image: "https://images.unsplash.com/photo-1541888946425-d0fbb186156a?w=400&auto=format&fit=crop",
        icon: "construction",
        display_order: 1,
        displayOrder: 1,
        is_active: true,
        isActive: true,
        created_at: "2026-08-01T09:00:00.000Z",
        createdAt: "2026-08-01T09:00:00.000Z",
        updated_at: "2026-10-25T14:00:00.000Z",
        updatedAt: "2026-10-25T14:00:00.000Z"
      },
      {
        id: "plumbing",
        name: "Plumbing Services",
        title: "Plumbing Services",
        slug: "plumbing",
        description: "Pipe installation, acoustic leak detection, water tank fittings, and drainage unblocking.",
        image: "https://images.unsplash.com/photo-1585704032915-c3400ca199e7?w=400&auto=format&fit=crop",
        icon: "plumbing",
        display_order: 2,
        displayOrder: 2,
        is_active: true,
        isActive: true,
        created_at: "2026-08-02T10:00:00.000Z",
        createdAt: "2026-08-02T10:00:00.000Z",
        updated_at: "2026-10-25T14:00:00.000Z",
        updatedAt: "2026-10-25T14:00:00.000Z"
      },
      {
        id: "electrical",
        name: "Electrical Services",
        title: "Electrical Services",
        slug: "electrical",
        description: "Home electrical installation, distribution board (DB) upgrades, and short circuit repair.",
        image: "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=400&auto=format&fit=crop",
        icon: "electrical",
        display_order: 3,
        displayOrder: 3,
        is_active: true,
        isActive: true,
        created_at: "2026-08-03T11:00:00.000Z",
        createdAt: "2026-08-03T11:00:00.000Z",
        updated_at: "2026-10-25T14:00:00.000Z",
        updatedAt: "2026-10-25T14:00:00.000Z"
      },
      {
        id: "hvac",
        name: "AC and HVAC Services",
        title: "AC and HVAC Services",
        slug: "hvac",
        description: "DC inverter AC servicing, coil chemical jet cleaning, gas charging, and chiller maintenance.",
        image: "https://images.unsplash.com/photo-1631545648834-58537b98bf95?w=400&auto=format&fit=crop",
        icon: "hvac",
        display_order: 4,
        displayOrder: 4,
        is_active: true,
        isActive: true,
        created_at: "2026-08-04T12:00:00.000Z",
        createdAt: "2026-08-04T12:00:00.000Z",
        updated_at: "2026-10-25T14:00:00.000Z",
        updatedAt: "2026-10-25T14:00:00.000Z"
      },
      {
        id: "solar",
        name: "Solar Energy Services",
        title: "Solar Energy Services",
        slug: "solar",
        description: "Turnkey on-grid and hybrid solar installations, NEPRA net-metering, and battery backups.",
        image: "https://images.unsplash.com/photo-1509391365360-2e959784a276?w=400&auto=format&fit=crop",
        icon: "solar",
        display_order: 5,
        displayOrder: 5,
        is_active: true,
        isActive: true,
        created_at: "2026-08-05T13:00:00.000Z",
        createdAt: "2026-08-05T13:00:00.000Z",
        updated_at: "2026-10-25T14:00:00.000Z",
        updatedAt: "2026-10-25T14:00:00.000Z"
      },
      {
        id: "carpentry",
        name: "Wooden Door Making and Carpentry",
        title: "Wooden Door Making and Carpentry",
        slug: "carpentry",
        description: "Custom solid wood door crafting, architectural frames, precision lock fitting, and cabinetry.",
        image: "https://images.unsplash.com/photo-1538688525198-9b88f6f53126?w=400&auto=format&fit=crop",
        icon: "carpentry",
        display_order: 6,
        displayOrder: 6,
        is_active: true,
        isActive: true,
        created_at: "2026-08-06T14:00:00.000Z",
        createdAt: "2026-08-06T14:00:00.000Z",
        updated_at: "2026-10-25T14:00:00.000Z",
        updatedAt: "2026-10-25T14:00:00.000Z"
      }
    ];
    localStorage.setItem(this.STORAGE_KEYS.CATEGORIES, JSON.stringify(categories));
  },

  seedInitialDisputes() {
    const disputes = [
      {
        id: "DISP-102",
        bookingId: "TL-BK-7450",
        reporterId: "usr-cust-002",
        reporterRole: "customer",
        reporterName: "Ayesha Malik",
        targetProviderId: "prov-profile-001",
        targetProviderName: "Khan Electrical & Automation",
        subject: "Workmanship clarification on DB installation",
        description: "Customer requested clarification regarding warranty on the newly installed RCCB breaker.",
        priority: "High",
        status: "open",
        adminNotes: null,
        createdAt: "2026-10-27T10:00:00.000Z",
        resolvedAt: null
      },
      {
        id: "DISP-101",
        bookingId: "TL-BK-8841",
        reporterId: "usr-cust-001",
        reporterRole: "customer",
        reporterName: "Hamad Ullah",
        targetProviderId: "prov-profile-001",
        targetProviderName: "Khan Electrical & Automation",
        subject: "Delay in evening schedule confirmation",
        description: "Customer requested evening inspection but provider is only confirming morning slots.",
        priority: "Normal",
        status: "resolved",
        adminNotes: "Admin contacted provider to adjust availability calendar. Customer agreed to next morning slot.",
        createdAt: "2026-10-26T17:00:00.000Z",
        resolvedAt: "2026-10-26T18:30:00.000Z"
      }
    ];
    localStorage.setItem(this.STORAGE_KEYS.DISPUTES, JSON.stringify(disputes));
  },

  seedInitialReports() {
    const reports = [
      {
        id: "REP-201",
        reviewId: "rev-baseline-001",
        bookingId: "TL-BK-5190",
        reporterId: "usr-prov-001",
        reporterRole: "provider",
        reason: "Suspected off-topic review text.",
        status: "dismissed",
        adminNotes: "Reviewed text. Content relates directly to on-site DB diagnostic and meets platform guidelines.",
        createdAt: "2026-10-22T10:00:00.000Z",
        resolvedAt: "2026-10-22T11:00:00.000Z"
      }
    ];
    localStorage.setItem(this.STORAGE_KEYS.REPORTS, JSON.stringify(reports));
  },

  seedInitialMessages() {
    const messages = [
      {
        id: "msg-001",
        bookingId: "TL-BK-7450",
        senderId: "usr-cust-001",
        senderName: "Hamad Ullah",
        senderRole: "customer",
        messageText: "Hello Engineer Rashid, please note that the main gate has parking space for your tools vehicle.",
        timestamp: "2026-10-25T11:30:00.000Z"
      },
      {
        id: "msg-002",
        bookingId: "TL-BK-7450",
        senderId: "usr-prov-001",
        senderName: "Engr. Rashid Khan",
        senderRole: "provider",
        messageText: "Received! Thank you Hamad. I have packed the RCCB breaker and calibrated testing instruments for tomorrow.",
        timestamp: "2026-10-25T12:00:00.000Z"
      }
    ];
    localStorage.setItem(this.STORAGE_KEYS.MESSAGES, JSON.stringify(messages));
  },

  seedInitialAuditLogs() {
    const logs = [
      {
        id: "aud-001",
        actionType: "PROVIDER_VERIFIED",
        targetType: "provider",
        entityType: "provider",
        targetId: "prov-profile-001",
        entityId: "prov-profile-001",
        details: "Administrator verified PEC license and CNIC identity for Engr. Rashid Khan.",
        adminId: "usr-admin-001",
        adminName: "System Administrator",
        timestamp: "2026-10-25T10:00:00.000Z"
      },
      {
        id: "aud-002",
        actionType: "DISPUTE_RESOLVED",
        targetType: "dispute",
        entityType: "dispute",
        targetId: "DISP-101",
        entityId: "DISP-101",
        details: "Dispute DISP-101 investigated and marked resolved with mutual schedule agreement.",
        adminId: "usr-admin-001",
        adminName: "System Administrator",
        timestamp: "2026-10-26T18:30:00.000Z"
      },
      {
        id: "aud-003",
        actionType: "CATEGORY_CREATED",
        targetType: "category",
        entityType: "category",
        targetId: "cat-006",
        entityId: "cat-006",
        details: "Administrator created category 'Wooden Door Making & Carpentry' with display order 6.",
        adminId: "usr-admin-001",
        adminName: "System Administrator",
        timestamp: "2026-10-27T09:15:00.000Z"
      },
      {
        id: "aud-004",
        actionType: "USER_STATUS_UPDATED",
        targetType: "user",
        entityType: "user",
        targetId: "usr-cust-002",
        entityId: "usr-cust-002",
        details: "Administrator activated user account for Ayesha Malik (Customer).",
        adminId: "usr-admin-001",
        adminName: "System Administrator",
        timestamp: "2026-10-28T14:20:00.000Z"
      },
      {
        id: "aud-005",
        actionType: "BOOKING_STATUS_UPDATED",
        targetType: "booking",
        entityType: "booking",
        targetId: "bk-9001",
        entityId: "bk-9001",
        details: "Administrator approved Booking #bk-9001 and transitioned state to [ACCEPTED].",
        adminId: "usr-admin-001",
        adminName: "System Administrator",
        timestamp: "2026-10-29T11:45:00.000Z"
      },
      {
        id: "aud-006",
        actionType: "REVIEW_APPROVED",
        targetType: "review",
        entityType: "review",
        targetId: "rev-88410",
        entityId: "rev-88410",
        details: "Administrator verified and approved customer review #rev-88410 for Engr. Rashid Khan.",
        adminId: "usr-admin-001",
        adminName: "System Administrator",
        timestamp: "2026-10-30T16:10:00.000Z"
      },
      {
        id: "aud-007",
        actionType: "PLAN_CREATED",
        targetType: "subscription_plan",
        entityType: "subscription_plan",
        targetId: "plan-pro",
        entityId: "plan-pro",
        details: "Administrator published subscription tier [TradeLinker Pro] (PKR 3,500 / 30 Days).",
        adminId: "usr-admin-001",
        adminName: "System Administrator",
        timestamp: "2026-10-31T08:30:00.000Z"
      },
      {
        id: "aud-008",
        actionType: "SUBSCRIPTION_RENEWED",
        targetType: "subscription",
        entityType: "subscription",
        targetId: "SUB-801",
        entityId: "SUB-801",
        details: "Administrator renewed subscription #SUB-801 for Engr. Rashid Khan for 30 days.",
        adminId: "usr-admin-001",
        adminName: "System Administrator",
        timestamp: "2026-11-01T10:00:00.000Z"
      }
    ];
    localStorage.setItem(this.STORAGE_KEYS.ADMIN_AUDIT, JSON.stringify(logs));
    localStorage.setItem("admin_audit_logs", JSON.stringify(logs));
  },

  // --------------------------------------------------------------------------
  // 2. Booking-Related Messaging & Communication
  // --------------------------------------------------------------------------
  sendMessage({ bookingId, senderId, senderName, senderRole, messageText }) {
    this.init();
    if (!bookingId) return { success: false, error: "Booking ID is required." };
    if (!messageText || messageText.trim().length === 0) {
      return { success: false, error: "Message cannot be empty." };
    }

    const bookings = typeof TLBookings !== "undefined" ? TLBookings.getAllBookings() : [];
    const booking = bookings.find(b => b.id === bookingId);
    if (!booking) {
      return { success: false, error: `Booking #${bookingId} not found.` };
    }

    let messages = [];
    try {
      messages = JSON.parse(localStorage.getItem(this.STORAGE_KEYS.MESSAGES)) || [];
    } catch (e) { messages = []; }

    const newMsg = {
      id: "msg-" + Math.floor(10000 + Math.random() * 90000),
      bookingId,
      senderId,
      senderName: senderName || (senderRole === "customer" ? "Customer" : "Specialist"),
      senderRole, // "customer" | "provider" | "admin"
      messageText: messageText.trim(),
      timestamp: new Date().toISOString()
    };

    messages.push(newMsg);
    localStorage.setItem(this.STORAGE_KEYS.MESSAGES, JSON.stringify(messages));

    // Dispatch In-App Notification to the counterpart
    const recipientUserId = (senderRole === "customer") 
      ? this.resolveProviderUserId(booking.providerId)
      : booking.customerId;

    if (recipientUserId && typeof TLBookings !== "undefined") {
      TLBookings.dispatchNotification({
        recipientUserId,
        title: `Message from ${newMsg.senderName}`,
        message: `Booking #${bookingId}: "${newMsg.messageText.substring(0, 50)}..."`,
        type: "booking_message",
        bookingId
      });
    }

    return { success: true, message: newMsg };
  },

  getBookingMessages(bookingId) {
    this.init();
    try {
      const messages = JSON.parse(localStorage.getItem(this.STORAGE_KEYS.MESSAGES)) || [];
      return messages.filter(m => m.bookingId === bookingId).sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
    } catch (e) { return []; }
  },

  resolveProviderUserId(providerId) {
    if (typeof TLAuth === "undefined") return null;
    const providers = TLAuth.getProviders();
    const p = providers.find(x => x.id === providerId);
    return p ? p.userId : null;
  },

  // --------------------------------------------------------------------------
  // 3. Complaints & Dispute Investigation (FR-47, UC-05)
  // --------------------------------------------------------------------------
  fileComplaint({ bookingId, reporterId, reporterRole, reporterName, subject, description, priority = "Normal" }) {
    this.init();
    if (!subject || subject.trim().length < 5) {
      return { success: false, error: "Subject must be at least 5 characters." };
    }
    if (!description || description.trim().length < 10) {
      return { success: false, error: "Please describe the issue with at least 10 characters." };
    }

    const bookings = typeof TLBookings !== "undefined" ? TLBookings.getAllBookings() : [];
    const booking = bookings.find(b => b.id === bookingId);

    const disputeId = "DISP-" + Math.floor(100 + Math.random() * 900);
    const newDispute = {
      id: disputeId,
      bookingId: bookingId || "N/A",
      reporterId,
      reporterRole,
      reporterName: reporterName || "User",
      targetProviderId: booking ? booking.providerId : null,
      targetProviderName: booking ? (booking.providerBusinessName || booking.providerName) : "Trade Specialist",
      subject: subject.trim(),
      description: description.trim(),
      priority,
      status: "open", // "open" | "investigating" | "resolved"
      adminNotes: null,
      createdAt: new Date().toISOString(),
      resolvedAt: null
    };

    let disputes = this.getAllComplaints();
    disputes.unshift(newDispute);
    localStorage.setItem(this.STORAGE_KEYS.DISPUTES, JSON.stringify(disputes));

    return { success: true, dispute: newDispute };
  },

  getAllComplaints() {
    this.init();
    try {
      return JSON.parse(localStorage.getItem(this.STORAGE_KEYS.DISPUTES)) || [];
    } catch (e) { return []; }
  },

  updateComplaintStatus({ complaintId, status, adminNotes, adminId = "admin" }) {
    this.init();
    const disputes = this.getAllComplaints();
    const idx = disputes.findIndex(d => d.id === complaintId);
    if (idx === -1) return { success: false, error: "Complaint record not found." };

    disputes[idx].status = status;
    disputes[idx].adminNotes = adminNotes || disputes[idx].adminNotes;
    if (status === "resolved") {
      disputes[idx].resolvedAt = new Date().toISOString();
    }

    localStorage.setItem(this.STORAGE_KEYS.DISPUTES, JSON.stringify(disputes));

    // Log admin audit
    this.logAdminAction({
      actionType: status === "resolved" ? "DISPUTE_RESOLVED" : "DISPUTE_UPDATED",
      targetType: "dispute",
      targetId: complaintId,
      details: `Complaint ${complaintId} status changed to '${status}'. Note: ${adminNotes || 'None'}`,
      adminId
    });

    // Notify reporter
    if (typeof TLBookings !== "undefined" && disputes[idx].reporterId) {
      TLBookings.dispatchNotification({
        recipientUserId: disputes[idx].reporterId,
        title: `Complaint #${complaintId} Update: ${status.toUpperCase()}`,
        message: `Admin review update: ${adminNotes || 'Your report has been investigated by platform administrators.'}`,
        type: "complaint_update"
      });
    }

    return { success: true, dispute: disputes[idx] };
  },

  // --------------------------------------------------------------------------
  // 4. Content Moderation & Reported Reviews
  // --------------------------------------------------------------------------
  reportReview({ reviewId, bookingId, reporterId, reporterRole, reason }) {
    this.init();
    if (!reason || reason.trim().length < 5) {
      return { success: false, error: "Please enter a specific reason for reporting this review." };
    }

    let reports = this.getAllReportedContent();
    const reportId = "REP-" + Math.floor(100 + Math.random() * 900);
    const newReport = {
      id: reportId,
      reviewId,
      bookingId: bookingId || "N/A",
      reporterId,
      reporterRole: reporterRole || "user",
      reason: reason.trim(),
      status: "pending_review",
      createdAt: new Date().toISOString(),
      resolvedAt: null,
      adminNotes: null
    };

    reports.unshift(newReport);
    localStorage.setItem(this.STORAGE_KEYS.REPORTS, JSON.stringify(reports));

    return { success: true, report: newReport };
  },

  getAllReportedContent() {
    this.init();
    try {
      return JSON.parse(localStorage.getItem(this.STORAGE_KEYS.REPORTS)) || [];
    } catch (e) { return []; }
  },

  resolveReportedContent({ reportId, action, adminNotes, adminId = "admin" }) {
    this.init();
    const reports = this.getAllReportedContent();
    const idx = reports.findIndex(r => r.id === reportId);
    if (idx === -1) return { success: false, error: "Report item not found." };

    const report = reports[idx];
    report.resolvedAt = new Date().toISOString();
    report.adminNotes = adminNotes || "";

    if (action === "remove_review") {
      report.status = "review_removed";
      // Delete review from reviews database
      if (typeof TLBookings !== "undefined") {
        let reviews = TLBookings.getAllReviews();
        const revIdx = reviews.findIndex(r => r.id === report.reviewId);
        if (revIdx !== -1) {
          const removedReview = reviews[revIdx];
          reviews.splice(revIdx, 1);
          localStorage.setItem(TLBookings.STORAGE_KEYS.REVIEWS, JSON.stringify(reviews));
          // Recalculate provider rating
          TLBookings.recalculateProviderRating(removedReview.providerId);
        }
      }
    } else {
      report.status = "dismissed";
    }

    localStorage.setItem(this.STORAGE_KEYS.REPORTS, JSON.stringify(reports));

    this.logAdminAction({
      actionType: action === "remove_review" ? "REVIEW_REMOVED" : "REVIEW_REPORT_DISMISSED",
      targetType: "review",
      targetId: report.reviewId,
      details: `Report #${reportId} processed with action '${action}'. Note: ${adminNotes || 'None'}`,
      adminId
    });

    return { success: true, report };
  },

  // --------------------------------------------------------------------------
  // 5. Service Category Management
  // --------------------------------------------------------------------------
  getAllCategories() {
    this.init();
    try {
      const raw = localStorage.getItem(this.STORAGE_KEYS.CATEGORIES);
      const list = JSON.parse(raw) || [];
      return list.map((c, idx) => ({
        id: c.id || c.slug,
        name: c.name || c.title || "Category",
        title: c.title || c.name || "Category", // alias
        slug: c.slug || c.id || "",
        description: c.description || "",
        image: c.image || "",
        icon: c.icon || "tools",
        display_order: Number.isInteger(c.display_order) ? c.display_order : (Number.isInteger(c.displayOrder) ? c.displayOrder : idx + 1),
        displayOrder: Number.isInteger(c.display_order) ? c.display_order : (Number.isInteger(c.displayOrder) ? c.displayOrder : idx + 1),
        is_active: c.is_active !== undefined ? Boolean(c.is_active) : (c.isActive !== undefined ? Boolean(c.isActive) : true),
        isActive: c.isActive !== undefined ? Boolean(c.isActive) : (c.is_active !== undefined ? Boolean(c.is_active) : true),
        created_at: c.created_at || c.createdAt || new Date().toISOString(),
        createdAt: c.createdAt || c.created_at || new Date().toISOString(),
        updated_at: c.updated_at || c.updatedAt || new Date().toISOString(),
        updatedAt: c.updatedAt || c.updated_at || new Date().toISOString()
      }));
    } catch (e) {
      return [];
    }
  },

  getCategoryById(id) {
    if (!id) return null;
    const list = this.getAllCategories();
    const query = id.trim().toLowerCase();
    return list.find(c => (c.id && c.id.toLowerCase() === query) || (c.slug && c.slug.toLowerCase() === query)) || null;
  },

  getCategoryUsage(categoryId) {
    const services = typeof TLServices !== "undefined" ? TLServices.getAllServices() : [];
    const bookings = typeof TLBookings !== "undefined" ? TLBookings.getAllBookings() : [];
    const providers = typeof TLAuth !== "undefined" ? TLAuth.getProviders() : [];
    const cat = this.getCategoryById(categoryId);
    const catTitle = cat ? (cat.name || cat.title || "").toLowerCase() : "";
    const catSlug = cat ? (cat.slug || cat.id || "").toLowerCase() : (categoryId || "").toLowerCase();

    const matchedServices = services.filter(s => 
      (s.categoryId && s.categoryId.toLowerCase() === catSlug) ||
      (s.category && s.category.toLowerCase() === catSlug) ||
      (s.categoryTitle && s.categoryTitle.toLowerCase() === catTitle)
    );

    const matchedBookings = bookings.filter(b => 
      (b.categoryId && b.categoryId.toLowerCase() === catSlug) ||
      (b.category && b.category.toLowerCase() === catSlug) ||
      (b.categoryTitle && b.categoryTitle.toLowerCase() === catTitle)
    );

    const matchedProviders = providers.filter(p => 
      (p.categoryId && p.categoryId.toLowerCase() === catSlug) ||
      (p.categoryTitle && p.categoryTitle.toLowerCase() === catTitle)
    );

    return {
      serviceCount: matchedServices.length,
      bookingCount: matchedBookings.length,
      providerCount: matchedProviders.length,
      totalReferences: matchedServices.length + matchedBookings.length,
      services: matchedServices,
      bookings: matchedBookings
    };
  },

  addCategory({ id, name, title, slug, description, image, icon = "tools", display_order, displayOrder, is_active, isActive = true, popularServices = [], adminId = "admin" }) {
    this.init();
    const categoryName = (name || title || "").trim();
    if (!categoryName || categoryName.length < 3) {
      return { success: false, error: "Category name must be at least 3 characters long." };
    }

    // Slug generation & validation
    let categorySlug = (slug || id || "").trim().toLowerCase();
    if (!categorySlug) {
      categorySlug = categoryName.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
    } else {
      categorySlug = categorySlug.replace(/[^a-z0-9-_]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
    }

    if (!categorySlug || categorySlug.length < 2) {
      return { success: false, error: "Invalid category slug generated. Please enter a valid slug (alphanumeric and hyphens only)." };
    }

    const categories = this.getAllCategories();

    // Check duplicate name
    if (categories.some(c => (c.name || c.title || "").toLowerCase() === categoryName.toLowerCase())) {
      return { success: false, error: `A category named '${categoryName}' already exists. Category names must be unique.` };
    }

    // Check duplicate slug
    if (categories.some(c => (c.slug || c.id || "").toLowerCase() === categorySlug.toLowerCase())) {
      return { success: false, error: `A category with slug '${categorySlug}' already exists. Category slugs must be unique.` };
    }

    const activeStatus = is_active !== undefined ? Boolean(is_active) : Boolean(isActive);
    const orderNum = parseInt(display_order || displayOrder || (categories.length + 1), 10) || (categories.length + 1);

    const nowIso = new Date().toISOString();
    const newCategory = {
      id: categorySlug,
      name: categoryName,
      title: categoryName,
      slug: categorySlug,
      description: (description && description.trim()) || "Professional trade and technical service solutions across Pakistan.",
      image: image || "",
      icon: icon || "tools",
      display_order: orderNum,
      displayOrder: orderNum,
      is_active: activeStatus,
      isActive: activeStatus,
      popularServices: Array.isArray(popularServices) ? popularServices : (popularServices ? popularServices.split(',').map(s => s.trim()).filter(Boolean) : []),
      created_at: nowIso,
      createdAt: nowIso,
      updated_at: nowIso,
      updatedAt: nowIso
    };

    categories.push(newCategory);
    // Sort by display order
    categories.sort((a, b) => a.display_order - b.display_order);

    localStorage.setItem(this.STORAGE_KEYS.CATEGORIES, JSON.stringify(categories));

    // Keep TLData in sync if present
    if (typeof window !== "undefined" && window.TLData && Array.isArray(window.TLData.categories)) {
      if (!window.TLData.categories.some(c => c.id === newCategory.id)) {
        window.TLData.categories.push({
          id: newCategory.id,
          title: newCategory.title,
          tagline: newCategory.description,
          icon: newCategory.icon,
          activeCount: 1,
          popularServices: newCategory.popularServices
        });
      }
    }

    this.logAdminAction({
      actionType: "CATEGORY_CREATED",
      targetType: "category",
      targetId: newCategory.slug,
      details: `New service category '${newCategory.name}' (slug: ${newCategory.slug}, order: ${newCategory.display_order}) created with status ${newCategory.is_active ? 'ACTIVE' : 'INACTIVE'}.`,
      adminId
    });

    return { success: true, category: newCategory };
  },

  updateCategory(categoryId, { name, title, slug, newSlug, description, image, icon, display_order, displayOrder, is_active, isActive, popularServices, adminId = "admin" }) {
    this.init();
    const categories = this.getAllCategories();
    const idx = categories.findIndex(c => (c.id === categoryId || c.slug === categoryId));
    if (idx === -1) return { success: false, error: "Category not found." };

    const oldCat = categories[idx];
    const categoryName = (name !== undefined ? name : title);

    if (categoryName && categoryName.trim().toLowerCase() !== (oldCat.name || oldCat.title || "").toLowerCase()) {
      const cleanName = categoryName.trim();
      if (cleanName.length < 3) {
        return { success: false, error: "Category name must be at least 3 characters long." };
      }
      if (categories.some((c, i) => i !== idx && (c.name || c.title || "").toLowerCase() === cleanName.toLowerCase())) {
        return { success: false, error: `Another category is already named '${cleanName}'. Category names must be unique.` };
      }
      oldCat.name = cleanName;
      oldCat.title = cleanName;
    }

    const proposedSlug = (slug || newSlug);
    if (proposedSlug && proposedSlug.trim().toLowerCase() !== (oldCat.slug || oldCat.id || "").toLowerCase()) {
      const cleanSlug = proposedSlug.trim().toLowerCase().replace(/[^a-z0-9-_]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
      if (cleanSlug.length < 2) {
        return { success: false, error: "Invalid category slug." };
      }
      if (categories.some((c, i) => i !== idx && (c.slug || c.id || "").toLowerCase() === cleanSlug)) {
        return { success: false, error: `Slug '${cleanSlug}' is already in use by another category.` };
      }

      const prevSlug = oldCat.slug || oldCat.id;
      oldCat.slug = cleanSlug;
      oldCat.id = cleanSlug;

      // Update references in TLServices
      if (typeof TLServices !== "undefined") {
        const services = TLServices.getAllServices();
        let changed = false;
        services.forEach(s => {
          if (s.categoryId === prevSlug) {
            s.categoryId = cleanSlug;
            s.categoryTitle = oldCat.name;
            changed = true;
          }
        });
        if (changed) {
          localStorage.setItem(TLServices.STORAGE_KEYS.SERVICES, JSON.stringify(services));
        }
      }
    }

    if (description !== undefined) {
      oldCat.description = description.trim();
    }

    if (image !== undefined) {
      oldCat.image = image.trim();
    }

    if (icon !== undefined) {
      oldCat.icon = icon.trim();
    }

    if (display_order !== undefined || displayOrder !== undefined) {
      const ord = parseInt(display_order !== undefined ? display_order : displayOrder, 10);
      if (!isNaN(ord) && ord >= 0) {
        oldCat.display_order = ord;
        oldCat.displayOrder = ord;
      }
    }

    if (is_active !== undefined) {
      oldCat.is_active = Boolean(is_active);
      oldCat.isActive = Boolean(is_active);
    } else if (isActive !== undefined) {
      oldCat.is_active = Boolean(isActive);
      oldCat.isActive = Boolean(isActive);
    }

    if (popularServices !== undefined) {
      oldCat.popularServices = Array.isArray(popularServices) 
        ? popularServices 
        : popularServices.split(',').map(s => s.trim()).filter(Boolean);
    }

    oldCat.updated_at = new Date().toISOString();
    oldCat.updatedAt = oldCat.updated_at;

    categories[idx] = oldCat;
    // Sort by display order
    categories.sort((a, b) => a.display_order - b.display_order);

    localStorage.setItem(this.STORAGE_KEYS.CATEGORIES, JSON.stringify(categories));

    this.logAdminAction({
      actionType: "CATEGORY_UPDATED",
      targetType: "category",
      targetId: oldCat.slug || oldCat.id,
      details: `Category '${oldCat.name}' was updated. Status: ${oldCat.is_active ? 'ACTIVE' : 'INACTIVE'}, Display Order: ${oldCat.display_order}.`,
      adminId
    });

    return { success: true, category: oldCat };
  },

  deleteCategory(categoryId, { force = false, adminId = "admin" } = {}) {
    this.init();
    const categories = this.getAllCategories();
    const idx = categories.findIndex(c => (c.id === categoryId || c.slug === categoryId));
    if (idx === -1) return { success: false, error: "Category not found in database." };

    const cat = categories[idx];
    const usage = this.getCategoryUsage(categoryId);

    if (usage.totalReferences > 0 && !force) {
      return {
        success: false,
        inUse: true,
        serviceCount: usage.serviceCount,
        bookingCount: usage.bookingCount,
        providerCount: usage.providerCount,
        error: `Category '${cat.name || cat.title}' cannot be deleted because it is actively being used by ${usage.serviceCount} service listing(s) and ${usage.bookingCount} booking request(s). Deactivate this category instead to prevent breaking customer and professional records.`
      };
    }

    categories.splice(idx, 1);
    localStorage.setItem(this.STORAGE_KEYS.CATEGORIES, JSON.stringify(categories));

    if (typeof window !== "undefined" && window.TLData && Array.isArray(window.TLData.categories)) {
      const dIdx = window.TLData.categories.findIndex(c => c.id === categoryId || c.id === cat.slug);
      if (dIdx !== -1) window.TLData.categories.splice(dIdx, 1);
    }

    this.logAdminAction({
      actionType: "CATEGORY_DELETED",
      targetType: "category",
      targetId: categoryId,
      details: `Category '${cat.name || cat.title}' (${categoryId}) was deleted permanently by administrator.`,
      adminId
    });

    return { success: true, deletedId: categoryId, name: cat.name || cat.title };
  },

  toggleCategoryStatus(categoryId, adminId = "admin") {
    this.init();
    const categories = this.getAllCategories();
    const idx = categories.findIndex(c => (c.id === categoryId || c.slug === categoryId));
    if (idx === -1) return { success: false, error: "Category not found." };

    const newStatus = !(categories[idx].is_active !== undefined ? categories[idx].is_active : categories[idx].isActive);
    categories[idx].is_active = newStatus;
    categories[idx].isActive = newStatus;
    categories[idx].updated_at = new Date().toISOString();
    categories[idx].updatedAt = categories[idx].updated_at;

    localStorage.setItem(this.STORAGE_KEYS.CATEGORIES, JSON.stringify(categories));

    this.logAdminAction({
      actionType: newStatus ? "CATEGORY_ACTIVATED" : "CATEGORY_DEACTIVATED",
      targetType: "category",
      targetId: categoryId,
      details: `Category '${categories[idx].name || categories[idx].title}' status set to: ${newStatus ? 'ACTIVE' : 'INACTIVE'}.`,
      adminId
    });

    return { success: true, is_active: newStatus, category: categories[idx] };
  },

  // --------------------------------------------------------------------------
  // 6. Provider Verification Review (UC-04, FR-45)
  // --------------------------------------------------------------------------
  reviewVerification({ providerId, action, reasonNote, adminId = "admin" }) {
    if (typeof TLAuth === "undefined") return { success: false, error: "TLAuth not initialized." };

    const providers = TLAuth.getProviders();
    const idx = providers.findIndex(p => p.id === providerId);
    if (idx === -1) return { success: false, error: "Provider profile not found." };

    const provider = providers[idx];

    if (action === "approve" || action === "verified") {
      provider.verificationStatus = "verified";
    } else if (action === "reject" || action === "rejected") {
      provider.verificationStatus = "rejected";
    } else if (action === "request_info" || action === "pending" || action === "info_requested") {
      provider.verificationStatus = "pending";
    } else {
      return { success: false, error: `Invalid verification action: ${action}` };
    }

    localStorage.setItem(TLAuth.STORAGE_KEYS.PROVIDERS, JSON.stringify(providers));

    // Log admin audit
    this.logAdminAction({
      actionType: `PROVIDER_VERIF_${action.toUpperCase()}`,
      targetType: "provider",
      targetId: providerId,
      details: `Verification review action: '${action}'. Note: ${reasonNote || 'None'}`,
      adminId
    });

    // Notify provider
    if (typeof TLBookings !== "undefined" && provider.userId) {
      const titles = {
        approve: "Verification Approved: Verified Badge Awarded!",
        reject: "Verification Application Declined",
        request_info: "Additional Verification Information Required"
      };
      const msgs = {
        approve: "Congratulations! Your TradeLinker trade credentials have been approved by the platform administration.",
        reject: `Your verification submission was not approved. Reason: ${reasonNote || 'Documentation incomplete.'}`,
        request_info: `Action required: Please provide additional documentation. Instructions: ${reasonNote || 'Please re-upload a clear copy of your trade registration certificate.'}`
      };

      TLBookings.dispatchNotification({
        recipientUserId: provider.userId,
        title: titles[action] || "Verification Status Update",
        message: msgs[action],
        type: "verification_update"
      });
    }

    return { success: true, provider };
  },

  // --------------------------------------------------------------------------
  // 7. Administrator Audit Logging (FR-44, FR-48)
  // --------------------------------------------------------------------------
  logAdminAction({
    actionType,
    targetType,
    targetId,
    entityType,
    entityId,
    details,
    adminId = "usr-admin-001",
    adminName
  }) {
    let logs = [];
    try {
      const raw = localStorage.getItem(this.STORAGE_KEYS.ADMIN_AUDIT) || localStorage.getItem("admin_audit_logs");
      logs = raw ? JSON.parse(raw) : [];
    } catch (e) {
      logs = [];
    }

    const finalEntityType = (entityType || targetType || "system").toLowerCase();
    const finalEntityId = entityId || targetId || "-";

    let resolvedName = adminName;
    if (!resolvedName && typeof TLAuth !== "undefined" && TLAuth.getUsers) {
      const u = (TLAuth.getUsers() || []).find(x => x.id === adminId);
      resolvedName = u ? (u.fullName || u.name) : "System Administrator";
    }
    if (!resolvedName) resolvedName = "System Administrator";

    const entry = {
      id: "aud-" + Math.floor(1000 + Math.random() * 9000),
      actionType: actionType || "ADMIN_ACTION",
      targetType: finalEntityType,
      entityType: finalEntityType,
      targetId: finalEntityId,
      entityId: finalEntityId,
      details: details || "Administrative action executed.",
      adminId: adminId || "usr-admin-001",
      adminName: resolvedName,
      timestamp: new Date().toISOString()
    };

    logs.unshift(entry);
    localStorage.setItem(this.STORAGE_KEYS.ADMIN_AUDIT, JSON.stringify(logs));
    localStorage.setItem("admin_audit_logs", JSON.stringify(logs));
    return entry;
  },

  getAllAdminAuditLogs() {
    this.init();
    try {
      const raw = localStorage.getItem(this.STORAGE_KEYS.ADMIN_AUDIT) || localStorage.getItem("admin_audit_logs");
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      return [];
    }
  },

  getAuditLogById(logId) {
    if (!logId) return null;
    return this.getAllAdminAuditLogs().find(l => l.id === logId) || null;
  },

  getAdminAuditTrail() {
    return this.getAllAdminAuditLogs();
  },

  filterAdminAuditLogs({ search = "", entityType = "all", actionType = "all", adminId = "all", timeRange = "all" }) {
    let list = this.getAllAdminAuditLogs();
    const q = (search || "").toLowerCase().trim();

    if (q) {
      list = list.filter(l =>
        (l.id || "").toLowerCase().includes(q) ||
        (l.actionType || "").toLowerCase().includes(q) ||
        (l.entityType || l.targetType || "").toLowerCase().includes(q) ||
        (l.entityId || l.targetId || "").toLowerCase().includes(q) ||
        (l.details || "").toLowerCase().includes(q) ||
        (l.adminName || "").toLowerCase().includes(q) ||
        (l.adminId || "").toLowerCase().includes(q)
      );
    }

    if (entityType && entityType !== "all") {
      list = list.filter(l => (l.entityType || l.targetType || "").toLowerCase() === entityType.toLowerCase());
    }

    if (actionType && actionType !== "all") {
      list = list.filter(l => (l.actionType || "").toUpperCase() === actionType.toUpperCase());
    }

    if (adminId && adminId !== "all") {
      list = list.filter(l => l.adminId === adminId);
    }

    if (timeRange && timeRange !== "all") {
      const now = Date.now();
      list = list.filter(l => {
        const t = new Date(l.timestamp).getTime();
        if (isNaN(t)) return true;
        const diffHours = (now - t) / (1000 * 60 * 60);
        if (timeRange === "today") return diffHours <= 24;
        if (timeRange === "7days") return diffHours <= 24 * 7;
        if (timeRange === "30days") return diffHours <= 24 * 30;
        return true;
      });
    }

    return list;
  },

  // --------------------------------------------------------------------------
  // 8. Admin Notifications & Platform Settings
  // --------------------------------------------------------------------------
  getAllAdminNotifications() {
    this.init();
    try {
      let notifs = JSON.parse(localStorage.getItem(this.STORAGE_KEYS.ADMIN_NOTIFS));
      if (!notifs) {
        notifs = [
          {
            id: "notif-adm-01",
            title: "New Verification Submission",
            message: "Engr. Rashid Khan submitted PEC License credentials for review.",
            type: "verification",
            timestamp: new Date(Date.now() - 3600000).toISOString(),
            isRead: false,
            linkTab: "verif"
          },
          {
            id: "notif-adm-02",
            title: "Dispute Opened (DISP-101)",
            message: "Booking #TL-BK-8841 customer reported scheduling friction.",
            type: "dispute",
            timestamp: new Date(Date.now() - 7200000).toISOString(),
            isRead: false,
            linkTab: "complaints"
          },
          {
            id: "notif-adm-03",
            title: "Booking Completed",
            message: "Booking #TL-BK-5190 completed successfully in Islamabad.",
            type: "booking",
            timestamp: new Date(Date.now() - 86400000).toISOString(),
            isRead: true,
            linkTab: "bookings"
          }
        ];
        localStorage.setItem(this.STORAGE_KEYS.ADMIN_NOTIFS, JSON.stringify(notifs));
      }
      return notifs;
    } catch (e) { return []; }
  },

  markNotificationRead(id) {
    const notifs = this.getAllAdminNotifications();
    const n = notifs.find(x => x.id === id);
    if (n) {
      n.isRead = true;
      localStorage.setItem(this.STORAGE_KEYS.ADMIN_NOTIFS, JSON.stringify(notifs));
    }
    return { success: true };
  },

  markAllNotificationsRead() {
    const notifs = this.getAllAdminNotifications();
    notifs.forEach(n => n.isRead = true);
    localStorage.setItem(this.STORAGE_KEYS.ADMIN_NOTIFS, JSON.stringify(notifs));
    return { success: true };
  },

  getMarketplaceSettings() {
    this.init();
    try {
      let s = JSON.parse(localStorage.getItem(this.STORAGE_KEYS.SETTINGS));
      if (!s) {
        s = {
          platformFeePercent: 5,
          disputeResolutionDays: 3,
          supportEmail: "support@tradelinker.pk",
          supportPhone: "+92 51 884 1000",
          maintenanceMode: false,
          autoApproveVerifiedBadges: false,
          enableSmsAlerts: true
        };
        localStorage.setItem(this.STORAGE_KEYS.SETTINGS, JSON.stringify(s));
      }
      return s;
    } catch (e) { return {}; }
  },

  updateMarketplaceSettings(newSettings, adminId = "admin") {
    const s = { ...this.getMarketplaceSettings(), ...newSettings };
    localStorage.setItem(this.STORAGE_KEYS.SETTINGS, JSON.stringify(s));
    this.logAdminAction({
      actionType: "SETTINGS_UPDATED",
      targetType: "system",
      targetId: "marketplace_config",
      details: "Marketplace administrative parameters updated.",
      adminId
    });
    return { success: true, settings: s };
  }
};

if (typeof window !== "undefined") {
  window.TLCommunication = TLCommunication;
  TLCommunication.init();
}
