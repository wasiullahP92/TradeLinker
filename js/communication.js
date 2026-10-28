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
    if (!rawCat || rawCat === '[]') this.seedInitialCategories();

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
      { id: "construction", title: "Construction Services", description: "Structural masonry, renovations, and plastering", isActive: true, icon: "construction" },
      { id: "plumbing", title: "Plumbing Services", description: "Pipework, water pumps, fixtures, and emergency drainage", isActive: true, icon: "plumbing" },
      { id: "electrical", title: "Electrical Services", description: "Wiring, circuit diagnostics, DB panels, and automation", isActive: true, icon: "electrical" },
      { id: "hvac", title: "AC and HVAC Services", description: "Inverter AC servicing, ducting, compressor repairs", isActive: true, icon: "hvac" },
      { id: "solar", title: "Solar Energy Services", description: "Solar panel arrays, inverters, net metering, battery setups", isActive: true, icon: "solar" },
      { id: "carpentry", title: "Wooden Door Making and Carpentry", description: "Solid wood doors, frames, cabinetry, polish, and repairs", isActive: true, icon: "carpentry" }
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
        targetId: "prov-profile-001",
        details: "Administrator verified PEC license and CNIC identity for Engr. Rashid Khan.",
        adminId: "usr-adm-001",
        timestamp: "2026-10-25T10:00:00.000Z"
      },
      {
        id: "aud-002",
        actionType: "DISPUTE_RESOLVED",
        targetType: "dispute",
        targetId: "DISP-101",
        details: "Dispute DISP-101 investigated and marked resolved with mutual schedule agreement.",
        adminId: "usr-adm-001",
        timestamp: "2026-10-26T18:30:00.000Z"
      }
    ];
    localStorage.setItem(this.STORAGE_KEYS.ADMIN_AUDIT, JSON.stringify(logs));
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
      return JSON.parse(localStorage.getItem(this.STORAGE_KEYS.CATEGORIES)) || [];
    } catch (e) { return []; }
  },

  getCategoryById(id) {
    const list = this.getAllCategories();
    return list.find(c => c.id === id) || null;
  },

  getCategoryUsage(categoryId) {
    const services = typeof TLServices !== "undefined" ? TLServices.getAllServices() : [];
    const bookings = typeof TLBookings !== "undefined" ? TLBookings.getAllBookings() : [];
    const providers = typeof TLAuth !== "undefined" ? TLAuth.getProviders() : [];

    const serviceCount = services.filter(s => s.categoryId === categoryId || s.category === categoryId).length;
    const bookingCount = bookings.filter(b => b.categoryId === categoryId || b.category === categoryId).length;
    const providerCount = providers.filter(p => p.categoryId === categoryId || p.categoryTitle === categoryId).length;

    return { serviceCount, bookingCount, providerCount, totalReferences: serviceCount + bookingCount };
  },

  addCategory({ id, title, description, icon = "tools", isActive = true, popularServices = [], adminId = "admin" }) {
    this.init();
    if (!title || title.trim().length < 3) {
      return { success: false, error: "Category title must be at least 3 characters long." };
    }

    const slug = (id && id.trim().length > 0)
      ? id.trim().toLowerCase().replace(/[^a-z0-9-_]/g, '-').replace(/-+/g, '-')
      : title.trim().toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-');

    if (!slug || slug.length < 2) {
      return { success: false, error: "Invalid category slug generated." };
    }

    const categories = this.getAllCategories();

    if (categories.some(c => c.id === slug)) {
      return { success: false, error: `A category with slug '${slug}' already exists. Please choose a unique name or slug.` };
    }
    if (categories.some(c => c.title.toLowerCase() === title.trim().toLowerCase())) {
      return { success: false, error: `A category named '${title.trim()}' already exists.` };
    }

    const newCategory = {
      id: slug,
      title: title.trim(),
      description: (description && description.trim()) || "Professional trade and technical service solutions across Pakistan.",
      icon: icon || "tools",
      isActive: Boolean(isActive),
      popularServices: Array.isArray(popularServices) ? popularServices : (popularServices ? popularServices.split(',').map(s => s.trim()).filter(Boolean) : []),
      createdAt: new Date().toISOString()
    };

    categories.push(newCategory);
    localStorage.setItem(this.STORAGE_KEYS.CATEGORIES, JSON.stringify(categories));

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
      targetId: newCategory.id,
      details: `New service category '${newCategory.title}' (${newCategory.id}) created with status ${newCategory.isActive ? 'ACTIVE' : 'INACTIVE'}.`,
      adminId
    });

    return { success: true, category: newCategory };
  },

  updateCategory(categoryId, { title, description, icon, isActive, newSlug, popularServices, adminId = "admin" }) {
    this.init();
    const categories = this.getAllCategories();
    const idx = categories.findIndex(c => c.id === categoryId);
    if (idx === -1) return { success: false, error: "Category not found." };

    const oldCat = categories[idx];

    if (title && title.trim().toLowerCase() !== oldCat.title.toLowerCase()) {
      if (categories.some((c, i) => i !== idx && c.title.toLowerCase() === title.trim().toLowerCase())) {
        return { success: false, error: `Another category is already named '${title.trim()}'.` };
      }
      oldCat.title = title.trim();
    }

    if (description !== undefined) {
      oldCat.description = description.trim();
    }

    if (icon) {
      oldCat.icon = icon.trim();
    }

    if (isActive !== undefined) {
      oldCat.isActive = Boolean(isActive);
    }

    if (popularServices !== undefined) {
      oldCat.popularServices = Array.isArray(popularServices) 
        ? popularServices 
        : popularServices.split(',').map(s => s.trim()).filter(Boolean);
    }

    if (newSlug && newSlug.trim() !== categoryId) {
      const cleanSlug = newSlug.trim().toLowerCase().replace(/[^a-z0-9-_]/g, '-').replace(/-+/g, '-');
      if (categories.some((c, i) => i !== idx && c.id === cleanSlug)) {
        return { success: false, error: `Slug '${cleanSlug}' is already in use by another category.` };
      }
      oldCat.id = cleanSlug;

      if (typeof TLServices !== "undefined") {
        const services = TLServices.getAllServices();
        let changed = false;
        services.forEach(s => {
          if (s.categoryId === categoryId) {
            s.categoryId = cleanSlug;
            s.categoryTitle = oldCat.title;
            changed = true;
          }
        });
        if (changed) {
          localStorage.setItem(TLServices.STORAGE_KEYS.SERVICES, JSON.stringify(services));
        }
      }
    }

    oldCat.updatedAt = new Date().toISOString();
    categories[idx] = oldCat;
    localStorage.setItem(this.STORAGE_KEYS.CATEGORIES, JSON.stringify(categories));

    this.logAdminAction({
      actionType: "CATEGORY_UPDATED",
      targetType: "category",
      targetId: oldCat.id,
      details: `Category '${oldCat.title}' was updated. Status: ${oldCat.isActive ? 'ACTIVE' : 'INACTIVE'}.`,
      adminId
    });

    return { success: true, category: oldCat };
  },

  deleteCategory(categoryId, { force = false, adminId = "admin" } = {}) {
    this.init();
    const categories = this.getAllCategories();
    const idx = categories.findIndex(c => c.id === categoryId);
    if (idx === -1) return { success: false, error: "Category not found." };

    const cat = categories[idx];
    const usage = this.getCategoryUsage(categoryId);

    if (usage.totalReferences > 0 && !force) {
      return {
        success: false,
        inUse: true,
        serviceCount: usage.serviceCount,
        bookingCount: usage.bookingCount,
        providerCount: usage.providerCount,
        error: `Category '${cat.title}' is actively referenced by ${usage.serviceCount} service(s) and ${usage.bookingCount} booking(s). Deactivate the category instead to avoid breaking existing customer and provider records.`
      };
    }

    categories.splice(idx, 1);
    localStorage.setItem(this.STORAGE_KEYS.CATEGORIES, JSON.stringify(categories));

    if (typeof window !== "undefined" && window.TLData && Array.isArray(window.TLData.categories)) {
      const dIdx = window.TLData.categories.findIndex(c => c.id === categoryId);
      if (dIdx !== -1) window.TLData.categories.splice(dIdx, 1);
    }

    this.logAdminAction({
      actionType: "CATEGORY_DELETED",
      targetType: "category",
      targetId: categoryId,
      details: `Category '${cat.title}' (${categoryId}) was deleted by administrator.`,
      adminId
    });

    return { success: true, deletedId: categoryId, title: cat.title };
  },

  toggleCategoryStatus(categoryId, adminId = "admin") {
    this.init();
    const categories = this.getAllCategories();
    const idx = categories.findIndex(c => c.id === categoryId);
    if (idx === -1) return { success: false, error: "Category not found." };

    categories[idx].isActive = !categories[idx].isActive;
    localStorage.setItem(this.STORAGE_KEYS.CATEGORIES, JSON.stringify(categories));

    this.logAdminAction({
      actionType: categories[idx].isActive ? "CATEGORY_ACTIVATED" : "CATEGORY_DEACTIVATED",
      targetType: "category",
      targetId: categoryId,
      details: `Category '${categories[idx].title}' status changed to: ${categories[idx].isActive ? 'ACTIVE' : 'INACTIVE'}.`,
      adminId
    });

    return { success: true, category: categories[idx] };
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

    if (action === "approve") {
      provider.verificationStatus = "verified";
    } else if (action === "reject") {
      provider.verificationStatus = "rejected";
    } else if (action === "request_info") {
      provider.verificationStatus = "info_requested";
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
  logAdminAction({ actionType, targetType, targetId, details, adminId = "admin" }) {
    let logs = [];
    try {
      logs = JSON.parse(localStorage.getItem(this.STORAGE_KEYS.ADMIN_AUDIT)) || [];
    } catch (e) { logs = []; }

    const entry = {
      id: "aud-" + Math.floor(1000 + Math.random() * 9000),
      actionType,
      targetType,
      targetId,
      details,
      adminId,
      timestamp: new Date().toISOString()
    };

    logs.unshift(entry);
    localStorage.setItem(this.STORAGE_KEYS.ADMIN_AUDIT, JSON.stringify(logs));
    return entry;
  },

  getAllAdminAuditLogs() {
    this.init();
    try {
      return JSON.parse(localStorage.getItem(this.STORAGE_KEYS.ADMIN_AUDIT)) || [];
    } catch (e) { return []; }
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
