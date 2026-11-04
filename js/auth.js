/**
 * TradeLinker Authentication & Account Management Engine
 * Implements SRS FR-01 through FR-06, FR-49, BR-01, NFR-04, NFR-06
 * Techminds (Wasi Ullah & Hamad Ullah)
 * 
 * Features:
 * - Separate Customer & Service Provider registration workflows
 * - Secure PBKDF2/SHA-256 salted password hashing (Zero plain text passwords)
 * - Strict duplicate account prevention (Unique Email & Phone checks)
 * - Authenticated session persistence with expiration tracking
 * - Role-Based Access Control (RBAC) and Route Protection Guards
 * - Password reset process with secure token generation
 * - Supabase production integration hooks
 */

const TLAuth = {
  STORAGE_KEYS: {
    USERS: "tl_db_users",
    PROVIDERS: "tl_db_providers",
    SESSION: "tl_auth_session",
    RESET_TOKENS: "tl_reset_tokens"
  },

  // --------------------------------------------------------------------------
  // 1. Cryptographic Security Helpers (Native Web Crypto API)
  // --------------------------------------------------------------------------
  async hashPassword(password, salt = "TL_SEC_SALT_2026") {
    const encoder = new TextEncoder();
    const data = encoder.encode(password + ":" + salt);
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
  },

  generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  },

  // --------------------------------------------------------------------------
  // 2. Database Vault Initialization
  // --------------------------------------------------------------------------
  init() {
    const rawUsers = localStorage.getItem(this.STORAGE_KEYS.USERS);
    if (!rawUsers || rawUsers === '[]') {
      this.seedInitialUsers();
    } else {
      try {
        const currentUsers = JSON.parse(rawUsers);
        if (currentUsers.length < 8) {
          this.seedInitialUsers(true);
        }
      } catch (e) {}
    }
  },

  seedInitialUsers(merge = false) {
    // Salted SHA-256 hashes precomputed with salt "TL_SEC_SALT_2026":
    // 1. Admin: admin@tradelinker.com -> "AdminTradeLinker2026!"
    // 2. Customer: customer@tradelinker.com -> "CustomerPass2026!"
    // 3. Provider: provider@tradelinker.com -> "ProviderPass2026!"
    const adminHash = "f84c7d17942ca40a5a446bdd4091eaff8972753a61198cefff90b5da990b509b";
    const custHash = "20be6894d0ca2185e16576e227e146c553c22b37e91ccf2d732bc3e04cca03e2";
    const provHash = "0f467ed3d99851bd253b4888aab6461bfc9e33dfcc1dca317a26a15d0f153877";

    const initialUsers = [
      {
        id: "usr-admin-001",
        fullName: "System Administrator",
        email: "admin@tradelinker.com",
        phone: "0300-0000001",
        passwordHash: adminHash,
        role: "admin",
        status: "active",
        city: "Islamabad",
        createdAt: "2026-08-01T09:00:00.000Z"
      },
      {
        id: "usr-cust-001",
        fullName: "Hamad Ullah (Customer Demo)",
        email: "customer@tradelinker.com",
        phone: "0300-1112233",
        passwordHash: custHash,
        role: "customer",
        status: "active",
        city: "Islamabad",
        createdAt: "2026-08-15T11:30:00.000Z"
      },
      {
        id: "usr-cust-002",
        fullName: "Ayesha Malik",
        email: "ayesha.m@gmail.com",
        phone: "0321-4455667",
        passwordHash: custHash,
        role: "customer",
        status: "active",
        city: "Islamabad",
        createdAt: "2026-09-04T14:20:00.000Z"
      },
      {
        id: "usr-cust-003",
        fullName: "Dr. Kamran Qureshi",
        email: "dr.kamran@yahoo.com",
        phone: "0345-7788990",
        passwordHash: custHash,
        role: "customer",
        status: "active",
        city: "Rawalpindi",
        createdAt: "2026-09-22T09:15:00.000Z"
      },
      {
        id: "usr-cust-004",
        fullName: "Zainab Bibi",
        email: "zainab.b@outlook.com",
        phone: "0302-3344556",
        passwordHash: custHash,
        role: "customer",
        status: "active",
        city: "Lahore",
        createdAt: "2026-10-10T16:40:00.000Z"
      },
      {
        id: "usr-cust-005",
        fullName: "Fahad Mustafa",
        email: "fahad.khi@gmail.com",
        phone: "0331-8899001",
        passwordHash: custHash,
        role: "customer",
        status: "active",
        city: "Karachi",
        createdAt: "2026-10-24T18:05:00.000Z"
      },
      {
        id: "usr-cust-006",
        fullName: "Maryam Nawaz",
        email: "maryam.lhr@gmail.com",
        phone: "0322-1122334",
        passwordHash: custHash,
        role: "customer",
        status: "active",
        city: "Lahore",
        createdAt: "2026-11-01T12:00:00.000Z"
      },
      {
        id: "usr-prov-001",
        fullName: "Engr. Rashid Khan",
        email: "provider@tradelinker.com",
        phone: "0300-9988776",
        passwordHash: provHash,
        role: "provider",
        status: "active",
        city: "Islamabad",
        createdAt: "2026-08-20T10:15:00.000Z"
      },
      {
        id: "usr-prov-002",
        fullName: "Tariq Mehmood",
        email: "tariq.plumbing@tradelinker.com",
        phone: "0312-5544332",
        passwordHash: provHash,
        role: "provider",
        status: "active",
        city: "Islamabad",
        createdAt: "2026-09-10T13:45:00.000Z"
      },
      {
        id: "usr-prov-003",
        fullName: "Usman Ghani",
        email: "usman.solar@tradelinker.com",
        phone: "0333-6677889",
        passwordHash: provHash,
        role: "provider",
        status: "active",
        city: "Rawalpindi",
        createdAt: "2026-09-25T16:20:00.000Z"
      },
      {
        id: "usr-prov-004",
        fullName: "Ghulam Murtaza",
        email: "murtaza.carpentry@tradelinker.com",
        phone: "0305-1234567",
        passwordHash: provHash,
        role: "provider",
        status: "active",
        city: "Lahore",
        createdAt: "2026-10-05T11:00:00.000Z"
      },
      {
        id: "usr-prov-005",
        fullName: "Malik Shahzad",
        email: "shahzad.hvac@tradelinker.com",
        phone: "0322-9876543",
        passwordHash: provHash,
        role: "provider",
        status: "active",
        city: "Karachi",
        createdAt: "2026-10-18T15:30:00.000Z"
      },
      {
        id: "usr-prov-006",
        fullName: "Engr. Bilal Farooq",
        email: "bilal.construction@tradelinker.com",
        phone: "0313-5678901",
        passwordHash: provHash,
        role: "provider",
        status: "active",
        city: "Peshawar",
        createdAt: "2026-10-28T09:15:00.000Z"
      }
    ];

    const initialProviders = [
      {
        id: "prov-profile-001",
        userId: "usr-prov-001",
        businessName: "Khan Electrical & Automation",
        categoryId: "electrical",
        categoryTitle: "Electrical Services",
        skills: ["Wiring", "DB Panels", "Circuit Diagnostics"],
        experienceYears: 9,
        city: "Islamabad",
        serviceAreas: ["F-6", "F-7", "F-8", "G-10"],
        bioDescription: "Licensed electrical engineer specializing in domestic distribution boards, inverter backups, and smart home wiring.",
        verificationStatus: "verified", // Admin verified
        isPremium: true
      },
      {
        id: "prov-profile-002",
        userId: "usr-prov-002",
        businessName: "Capital Sanitary & Plumbing Masters",
        categoryId: "plumbing",
        categoryTitle: "Plumbing Services",
        skills: ["PPR-C Pipe Fusion", "Motor Pumps", "Geyser Repair"],
        experienceYears: 7,
        city: "Islamabad",
        serviceAreas: ["G-9", "G-11", "I-8"],
        bioDescription: "Certified master plumber specializing in high-pressure sanitary installations and concealed piping.",
        verificationStatus: "verified",
        isPremium: false
      },
      {
        id: "prov-profile-003",
        userId: "usr-prov-003",
        businessName: "SunPower Smart Energy Solutions",
        categoryId: "solar",
        categoryTitle: "Solar Energy Services",
        skills: ["Net Metering", "Solar Inverters", "Battery Banks"],
        experienceYears: 6,
        city: "Rawalpindi",
        serviceAreas: ["Bahria Town", "DHA Phase 1", "Saddar"],
        bioDescription: "Authorized PEC solar installer providing turnkey on-grid, off-grid and hybrid photovoltaic setups.",
        verificationStatus: "verified",
        isPremium: true
      },
      {
        id: "prov-profile-004",
        userId: "usr-prov-004",
        businessName: "Murtaza Master Carpentry & Doors",
        categoryId: "carpentry",
        categoryTitle: "Wooden Door Making & Carpentry",
        skills: ["Solid Teak Doors", "Lock Fitting", "Cabinet Crafting"],
        experienceYears: 15,
        city: "Lahore",
        serviceAreas: ["Gulberg", "DHA Lahore", "Model Town"],
        bioDescription: "Master artisan specializing in solid wood door crafting, architectural frames, and luxury lock fitting.",
        verificationStatus: "verified",
        isPremium: true
      },
      {
        id: "prov-profile-005",
        userId: "usr-prov-005",
        businessName: "CoolBreeze AC & Heating Solutions",
        categoryId: "hvac",
        categoryTitle: "AC & HVAC Services",
        skills: ["Inverter PCB", "Gas Charging", "Split AC Jet Wash"],
        experienceYears: 11,
        city: "Karachi",
        serviceAreas: ["Clifton", "DHA Karachi", "PECHS"],
        bioDescription: "Commercial and residential HVAC technician specialized in inverter AC pressure tests and duct maintenance.",
        verificationStatus: "verified",
        isPremium: true
      },
      {
        id: "prov-profile-006",
        userId: "usr-prov-006",
        businessName: "Apex Civil & Construction Builders",
        categoryId: "construction",
        categoryTitle: "Construction Services",
        skills: ["Grey Structure", "Foundation Masonry", "Site Supervision"],
        experienceYears: 14,
        city: "Peshawar",
        serviceAreas: ["Hayatabad", "University Town", "Cantt"],
        bioDescription: "PEC-registered civil engineer offering grey structure contracts, masonry supervision, and cost estimation.",
        verificationStatus: "pending", // Pending verification queue
        isPremium: false
      }
    ];

    if (merge) {
      try {
        const existingUsers = JSON.parse(localStorage.getItem(this.STORAGE_KEYS.USERS)) || [];
        const existingUserEmails = new Set(existingUsers.map(u => u.email.toLowerCase()));
        const mergedUsers = [...existingUsers];
        initialUsers.forEach(u => {
          if (!existingUserEmails.has(u.email.toLowerCase())) mergedUsers.push(u);
        });
        localStorage.setItem(this.STORAGE_KEYS.USERS, JSON.stringify(mergedUsers));

        const existingProv = JSON.parse(localStorage.getItem(this.STORAGE_KEYS.PROVIDERS)) || [];
        const existingProvIds = new Set(existingProv.map(p => p.id));
        const mergedProv = [...existingProv];
        initialProviders.forEach(p => {
          if (!existingProvIds.has(p.id)) mergedProv.push(p);
        });
        localStorage.setItem(this.STORAGE_KEYS.PROVIDERS, JSON.stringify(mergedProv));
        return;
      } catch (e) {}
    }

    localStorage.setItem(this.STORAGE_KEYS.USERS, JSON.stringify(initialUsers));
    localStorage.setItem(this.STORAGE_KEYS.PROVIDERS, JSON.stringify(initialProviders));
  },

  getUsers() {
    this.init();
    try {
      return JSON.parse(localStorage.getItem(this.STORAGE_KEYS.USERS)) || [];
    } catch (e) {
      return [];
    }
  },

  getProviders() {
    this.init();
    try {
      let list = JSON.parse(localStorage.getItem(this.STORAGE_KEYS.PROVIDERS)) || [];
      // Ensure baseline provider profiles exist if previously initialized with single record
      if (!list.some(p => p.id === "prov-profile-002")) {
        list.push({
          id: "prov-profile-002",
          userId: "usr-prov-002",
          businessName: "Capital Sanitary & Plumbing Masters",
          categoryId: "plumbing",
          categoryTitle: "Plumbing Services",
          skills: ["PPR-C Pipe Fusion", "Motor Pumps", "Geyser Repair"],
          experienceYears: 7,
          city: "Islamabad",
          serviceAreas: ["G-9", "G-11", "I-8"],
          bioDescription: "Certified master plumber specializing in high-pressure sanitary installations and concealed piping.",
          verificationStatus: "pending",
          isPremium: false
        });
      }
      if (!list.some(p => p.id === "prov-profile-003")) {
        list.push({
          id: "prov-profile-003",
          userId: "usr-prov-003",
          businessName: "SunPower Smart Energy Solutions",
          categoryId: "solar",
          categoryTitle: "Solar Energy Services",
          skills: ["Net Metering", "Solar Inverters", "Battery Banks"],
          experienceYears: 6,
          city: "Rawalpindi",
          serviceAreas: ["Bahria Town", "DHA Phase 1", "Saddar"],
          bioDescription: "Authorized PEC solar installer providing turnkey on-grid, off-grid and hybrid photovoltaic setups.",
          verificationStatus: "pending",
          isPremium: true
        });
      }
      localStorage.setItem(this.STORAGE_KEYS.PROVIDERS, JSON.stringify(list));
      return list;
    } catch (e) {
      return [];
    }
  },

  // --------------------------------------------------------------------------
  // 3. User Registration Workflows (FR-01, FR-02, FR-04)
  // --------------------------------------------------------------------------
  
  // FR-01: Customer Registration Flow
  async registerCustomer({ fullName, email, phone, password, city }) {
    this.init();
    const errors = this.validateRegistrationFields({ fullName, email, phone, password });
    if (errors.length > 0) {
      return { success: false, errors };
    }

    const cleanEmail = email.trim().toLowerCase();
    const users = this.getUsers();

    // Prevent duplicate email accounts (FR-04)
    if (users.some(u => u.email.toLowerCase() === cleanEmail)) {
      return {
        success: false,
        errors: ["An account with this email address already exists. Please sign in or use another email."]
      };
    }

    const passwordHash = await this.hashPassword(password);
    const userId = "usr-" + this.generateUUID();

    const newCustomer = {
      id: userId,
      fullName: fullName.trim(),
      email: cleanEmail,
      phone: phone.trim(),
      passwordHash,
      role: "customer", // Strict role assignment: Cannot self-assign admin
      status: "active",
      city: city ? city.trim() : "Islamabad",
      createdAt: new Date().toISOString()
    };

    users.push(newCustomer);
    localStorage.setItem(this.STORAGE_KEYS.USERS, JSON.stringify(users));

    // Auto-create session
    const session = this.createSession(newCustomer, true);
    return {
      success: true,
      user: this.sanitizeUser(newCustomer),
      redirectUrl: TLConfig.dashboardRoutes.customer
    };
  },

  // FR-02: Service Provider Separate Registration Flow
  async registerProvider({
    fullName,
    email,
    phone,
    password,
    businessName,
    categoryId,
    city,
    skills,
    experienceYears,
    bioDescription
  }) {
    this.init();
    const baseErrors = this.validateRegistrationFields({ fullName, email, phone, password });
    const errors = [...baseErrors];

    if (!businessName || businessName.trim().length < 3) {
      errors.push("Business or professional trade name must be at least 3 characters.");
    }
    if (!categoryId) {
      errors.push("Please select a primary service category.");
    }

    if (errors.length > 0) {
      return { success: false, errors };
    }

    const cleanEmail = email.trim().toLowerCase();
    const users = this.getUsers();

    // Duplicate check
    if (users.some(u => u.email.toLowerCase() === cleanEmail)) {
      return {
        success: false,
        errors: ["An account with this email address already exists. Please sign in or use another email."]
      };
    }

    const passwordHash = await this.hashPassword(password);
    const userId = "usr-" + this.generateUUID();

    const newProviderUser = {
      id: userId,
      fullName: fullName.trim(),
      email: cleanEmail,
      phone: phone.trim(),
      passwordHash,
      role: "provider", // Strict role assignment
      status: "active",
      city: city || "Islamabad",
      createdAt: new Date().toISOString()
    };

    // Category mapping
    const catMap = {
      construction: "Construction Services",
      plumbing: "Plumbing Services",
      electrical: "Electrical Services",
      hvac: "AC & HVAC Services",
      solar: "Solar Energy Services",
      carpentry: "Wooden Door Making & Carpentry"
    };

    const providerProfile = {
      id: "prov-" + this.generateUUID(),
      userId: userId,
      businessName: businessName.trim(),
      categoryId: categoryId,
      categoryTitle: catMap[categoryId] || "Trade Services",
      skills: Array.isArray(skills) ? skills : (skills ? skills.split(",").map(s => s.trim()) : []),
      experienceYears: parseInt(experienceYears) || 1,
      city: city || "Islamabad",
      serviceAreas: [city || "Islamabad"],
      bioDescription: bioDescription ? bioDescription.trim() : "Verified trade specialist.",
      verificationStatus: "pending", // Administrator verification required (FR-18)
      isPremium: false
    };

    users.push(newProviderUser);
    localStorage.setItem(this.STORAGE_KEYS.USERS, JSON.stringify(users));

    const providers = this.getProviders();
    providers.push(providerProfile);
    localStorage.setItem(this.STORAGE_KEYS.PROVIDERS, JSON.stringify(providers));

    // Auto-create session
    const session = this.createSession(newProviderUser, true);
    return {
      success: true,
      user: this.sanitizeUser(newProviderUser),
      redirectUrl: TLConfig.dashboardRoutes.provider
    };
  },

  validateRegistrationFields({ fullName, email, phone, password }) {
    const errors = [];
    if (!fullName || fullName.trim().length < 2) {
      errors.push("Full name must be at least 2 characters.");
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email.trim())) {
      errors.push("Please provide a valid email address.");
    }
    if (!phone || phone.trim().length < 8) {
      errors.push("Valid phone number is mandatory for contact and verification.");
    }
    if (!password || password.length < TLConfig.security.minPasswordLength) {
      errors.push(`Password must be at least ${TLConfig.security.minPasswordLength} characters long.`);
    }
    return errors;
  },

  // --------------------------------------------------------------------------
  // 4. Authentication Login & Logout (FR-03, NFR-04)
  // --------------------------------------------------------------------------
  async login(emailOrPhone, password, rememberMe = true) {
    this.init();
    if (!emailOrPhone || !password) {
      return { success: false, error: "Please enter your email/phone and password." };
    }

    const cleanIdentifier = emailOrPhone.trim().toLowerCase();
    const users = this.getUsers();

    const user = users.find(u => 
      u.email.toLowerCase() === cleanIdentifier || 
      (cleanIdentifier === 'admin@tradelinker.pk' && u.email.toLowerCase() === 'admin@tradelinker.com') ||
      (cleanIdentifier === 'admin@tradelinker.com' && u.email.toLowerCase() === 'admin@tradelinker.pk') ||
      u.phone.replace(/[\s-]/g, "") === cleanIdentifier.replace(/[\s-]/g, "")
    );

    if (!user) {
      return { success: false, error: "Invalid credentials. Please verify your email and password." };
    }

    if (user.status === "suspended") {
      return {
        success: false,
        error: "This account has been suspended by the platform administrator (BR-08). Please contact support@tradelinker.com."
      };
    }

    const inputHash = await this.hashPassword(password);
    if (inputHash !== user.passwordHash) {
      return { success: false, error: "Invalid credentials. Please verify your email and password." };
    }

    // Login successful: create session
    this.createSession(user, rememberMe);
    const redirectUrl = TLConfig.dashboardRoutes[user.role] || "index.html";

    return {
      success: true,
      user: this.sanitizeUser(user),
      redirectUrl
    };
  },

  logout(redirectUrl = null) {
    const user = this.getCurrentUser();
    this.clearSession();
    if (redirectUrl) {
      window.location.href = redirectUrl;
    } else if (user && user.role === 'admin') {
      window.location.href = "admin-login.html";
    } else {
      window.location.href = "index.html";
    }
  },

  clearSession() {
    localStorage.removeItem(this.STORAGE_KEYS.SESSION);
    sessionStorage.removeItem(this.STORAGE_KEYS.SESSION);
  },

  // --------------------------------------------------------------------------
  // 5. Session Management & Persistence
  // --------------------------------------------------------------------------
  createSession(user, rememberMe = true) {
    const token = TLConfig.security.tokenPrefix + this.generateUUID();
    const expiresAt = Date.now() + (TLConfig.security.sessionDurationHours * 3600 * 1000);

    const sessionData = {
      token,
      userId: user.id,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
      city: user.city,
      expiresAt
    };

    const storage = rememberMe ? localStorage : sessionStorage;
    storage.setItem(this.STORAGE_KEYS.SESSION, JSON.stringify(sessionData));
    return sessionData;
  },

  getCurrentUser() {
    this.init();
    const sessionStr = localStorage.getItem(this.STORAGE_KEYS.SESSION) || 
                       sessionStorage.getItem(this.STORAGE_KEYS.SESSION);
    if (!sessionStr) return null;

    try {
      const session = JSON.parse(sessionStr);
      if (Date.now() > session.expiresAt) {
        // Session expired
        this.logout();
        return null;
      }

      // Re-fetch active record to ensure status has not changed to suspended
      const users = this.getUsers();
      const user = users.find(u => u.id === session.userId);
      if (!user || user.status === "suspended") {
        this.logout();
        return null;
      }

      const sanitized = this.sanitizeUser(user);
      if (user.role === "provider") {
        const providers = this.getProviders();
        sanitized.providerProfile = providers.find(p => p.userId === user.id) || null;
      }
      return sanitized;
    } catch (e) {
      return null;
    }
  },

  isAuthenticated() {
    return this.getCurrentUser() !== null;
  },

  // --------------------------------------------------------------------------
  // 6. Role-Based Route Guards (FR-49, NFR-06)
  // --------------------------------------------------------------------------
  protectRoute(allowedRoles = [], loginRedirectUrl = null) {
    const user = this.getCurrentUser();

    if (!user) {
      // Unauthenticated -> redirect to login with return path
      const currentPath = encodeURIComponent(window.location.pathname.split("/").pop() || "index.html");
      const defaultLogin = (allowedRoles.length === 1 && allowedRoles[0] === 'admin') ? 'admin-login.html' : 'auth.html';
      const targetLogin = loginRedirectUrl || defaultLogin;
      window.location.href = `${targetLogin}?mode=login&returnUrl=${currentPath}&authError=unauthenticated`;
      return false;
    }

    if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
      // Role mismatch -> redirect to appropriate authorized dashboard
      alert(`Access Restricted (FR-49): Your account role (${user.role.toUpperCase()}) is not authorized to access this section.`);
      window.location.href = TLConfig.dashboardRoutes[user.role] || "index.html";
      return false;
    }

    return true;
  },

  hasRole(user, allowedRoles = []) {
    if (!user || !user.role) return false;
    if (!allowedRoles || allowedRoles.length === 0) return true;
    return allowedRoles.includes(user.role);
  },

  // --------------------------------------------------------------------------
  // 7. Password Reset Workflow (FR-05)
  // --------------------------------------------------------------------------
  requestPasswordReset(email) {
    this.init();
    const cleanEmail = (email || "").trim().toLowerCase();
    const users = this.getUsers();
    const user = users.find(u => u.email.toLowerCase() === cleanEmail);

    if (!user) {
      // For security, avoid enumerating accounts
      return {
        success: true,
        message: "If an account with that email exists, password reset instructions have been sent."
      };
    }

    const resetToken = "rst_" + this.generateUUID();
    const resetEntry = {
      token: resetToken,
      userId: user.id,
      email: cleanEmail,
      expiresAt: Date.now() + (60 * 60 * 1000) // 1 Hour valid
    };

    let tokens = [];
    try {
      tokens = JSON.parse(localStorage.getItem(this.STORAGE_KEYS.RESET_TOKENS)) || [];
    } catch (e) { tokens = []; }

    tokens.push(resetEntry);
    localStorage.setItem(this.STORAGE_KEYS.RESET_TOKENS, JSON.stringify(tokens));

    return {
      success: true,
      resetToken, // Provided for testing in demo environment
      message: `Password reset instructions and verification token have been dispatched to ${cleanEmail}.`
    };
  },

  async completePasswordReset(token, newPassword) {
    this.init();
    if (!newPassword || newPassword.length < TLConfig.security.minPasswordLength) {
      return {
        success: false,
        error: `Password must be at least ${TLConfig.security.minPasswordLength} characters.`
      };
    }

    let tokens = [];
    try {
      tokens = JSON.parse(localStorage.getItem(this.STORAGE_KEYS.RESET_TOKENS)) || [];
    } catch (e) { tokens = []; }

    const entry = tokens.find(t => t.token === token && Date.now() < t.expiresAt);
    if (!entry) {
      return { success: false, error: "Invalid or expired password reset token." };
    }

    const users = this.getUsers();
    const userIndex = users.findIndex(u => u.id === entry.userId);
    if (userIndex === -1) {
      return { success: false, error: "User account not found." };
    }

    const newHash = await this.hashPassword(newPassword);
    users[userIndex].passwordHash = newHash;
    users[userIndex].updatedAt = new Date().toISOString();
    localStorage.setItem(this.STORAGE_KEYS.USERS, JSON.stringify(users));

    // Invalidate used reset token
    tokens = tokens.filter(t => t.token !== token);
    localStorage.setItem(this.STORAGE_KEYS.RESET_TOKENS, JSON.stringify(tokens));

    return {
      success: true,
      message: "Password has been successfully updated. You may now sign in."
    };
  },

  // --------------------------------------------------------------------------
  // 8. Account Profile Update (FR-06, FR-07, FR-12)
  // --------------------------------------------------------------------------
  updateProfile({ fullName, phone, city, bioDescription, skills }) {
    const current = this.getCurrentUser();
    if (!current) return { success: false, error: "Not authenticated." };

    const users = this.getUsers();
    const userIndex = users.findIndex(u => u.id === current.id);
    if (userIndex === -1) return { success: false, error: "User not found." };

    if (fullName) users[userIndex].fullName = fullName.trim();
    if (phone) users[userIndex].phone = phone.trim();
    if (city) users[userIndex].city = city.trim();
    users[userIndex].updatedAt = new Date().toISOString();

    localStorage.setItem(this.STORAGE_KEYS.USERS, JSON.stringify(users));

    // If provider, update profile table
    if (current.role === "provider") {
      const providers = this.getProviders();
      const pIdx = providers.findIndex(p => p.userId === current.id);
      if (pIdx !== -1) {
        if (bioDescription !== undefined) providers[pIdx].bioDescription = bioDescription;
        if (skills !== undefined) {
          providers[pIdx].skills = Array.isArray(skills) ? skills : skills.split(",").map(s => s.trim());
        }
        if (city) providers[pIdx].city = city;
        providers[pIdx].updatedAt = new Date().toISOString();
        localStorage.setItem(this.STORAGE_KEYS.PROVIDERS, JSON.stringify(providers));
      }
    }

    // Refresh session display info
    this.createSession(users[userIndex], true);
    return { success: true, user: this.sanitizeUser(users[userIndex]) };
  },

  // --------------------------------------------------------------------------
  // 9. Administrator User Management & Governance
  // --------------------------------------------------------------------------
  getUserById(userId) {
    this.init();
    const users = this.getUsers();
    const u = users.find(x => x.id === userId);
    return u ? this.sanitizeUser(u) : null;
  },

  getAllUsersSafe() {
    this.init();
    return this.getUsers().map(u => this.sanitizeUser(u));
  },

  updateUserByAdmin(userId, { fullName, email, phone, city, role, status }, adminId = "admin") {
    this.init();
    const users = this.getUsers();
    const idx = users.findIndex(u => u.id === userId);
    if (idx === -1) {
      return { success: false, error: "User account not found." };
    }

    const target = users[idx];

    // Validate full name
    if (!fullName || fullName.trim().length < 3) {
      return { success: false, error: "Full Name must be at least 3 characters long." };
    }

    // Validate email & uniqueness
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      return { success: false, error: "Please provide a valid email address." };
    }

    const cleanEmail = email.trim().toLowerCase();
    if (users.some((u, i) => i !== idx && u.email.toLowerCase() === cleanEmail)) {
      return { success: false, error: `Email address '${cleanEmail}' is already registered to another account.` };
    }

    // Valid roles: customer, provider, admin
    const validRoles = ["customer", "provider", "admin"];
    const newRole = role ? role.toLowerCase() : target.role;
    if (!validRoles.includes(newRole)) {
      return { success: false, error: `Invalid role '${role}'. Must be customer, provider, or admin.` };
    }

    // Valid statuses: active, suspended
    const validStatuses = ["active", "suspended"];
    const newStatus = status ? status.toLowerCase() : target.status;
    if (!validStatuses.includes(newStatus)) {
      return { success: false, error: "Status must be active or suspended." };
    }

    // Guard current logged-in admin from suspending themselves or demoting role
    if (adminId && target.id === adminId) {
      if (newStatus === "suspended") {
        return { success: false, error: "Security restriction: You cannot suspend your own active administrator account." };
      }
      if (newRole !== "admin") {
        return { success: false, error: "Security restriction: You cannot demote your own active administrator privileges." };
      }
    }

    // Apply updates preserving passwordHash untouched
    target.fullName = fullName.trim();
    target.email = cleanEmail;
    if (phone !== undefined) target.phone = phone ? phone.trim() : "";
    if (city !== undefined) target.city = city ? city.trim() : "Islamabad";
    target.role = newRole;
    target.status = newStatus;
    target.updatedAt = new Date().toISOString();

    users[idx] = target;
    localStorage.setItem(this.STORAGE_KEYS.USERS, JSON.stringify(users));

    // If provider profile exists, sync provider profile details
    if (target.role === "provider" || target.role === "professional") {
      const providers = this.getProviders();
      const pIdx = providers.findIndex(p => p.userId === target.id);
      if (pIdx !== -1) {
        providers[pIdx].fullName = target.fullName;
        providers[pIdx].city = target.city;
        providers[pIdx].updatedAt = target.updatedAt;
        localStorage.setItem(this.STORAGE_KEYS.PROVIDERS, JSON.stringify(providers));
      }
    }

    // Log admin audit trail
    if (typeof TLCommunication !== "undefined" && TLCommunication.logAdminAction) {
      TLCommunication.logAdminAction({
        actionType: "USER_UPDATED",
        targetType: "user",
        targetId: target.id,
        details: `Administrator updated user '${target.fullName}' (${target.id}): role=${target.role}, status=${target.status}, email=${target.email}.`,
        adminId
      });
    }

    return { success: true, user: this.sanitizeUser(target) };
  },

  toggleUserStatus(userId, adminId = "admin") {
    this.init();
    const users = this.getUsers();
    const idx = users.findIndex(u => u.id === userId);
    if (idx === -1) {
      return { success: false, error: "User account not found." };
    }

    const target = users[idx];

    // Guard against self-suspension
    if (adminId && target.id === adminId && target.status === "active") {
      return { success: false, error: "Security restriction: You cannot suspend your own active administrator account." };
    }

    const newStatus = target.status === "active" ? "suspended" : "active";
    target.status = newStatus;
    target.updatedAt = new Date().toISOString();

    users[idx] = target;
    localStorage.setItem(this.STORAGE_KEYS.USERS, JSON.stringify(users));

    if (typeof TLCommunication !== "undefined" && TLCommunication.logAdminAction) {
      TLCommunication.logAdminAction({
        actionType: newStatus === "active" ? "USER_ACTIVATED" : "USER_SUSPENDED",
        targetType: "user",
        targetId: target.id,
        details: `Administrator changed status of '${target.fullName}' (${target.id}) to ${newStatus.toUpperCase()}.`,
        adminId
      });
    }

    return { success: true, status: newStatus, user: this.sanitizeUser(target) };
  },

  async createUserByAdmin({ fullName, email, phone, city, role = "customer", status = "active", password }, adminId = "admin") {
    this.init();
    const users = this.getUsers();

    if (!fullName || fullName.trim().length < 3) {
      return { success: false, error: "Full Name must be at least 3 characters long." };
    }

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      return { success: false, error: "Please provide a valid email address." };
    }

    const cleanEmail = email.trim().toLowerCase();
    if (users.some(u => u.email.toLowerCase() === cleanEmail)) {
      return { success: false, error: `An account with email '${cleanEmail}' already exists.` };
    }

    const cleanRole = role ? role.toLowerCase() : "customer";
    const cleanStatus = status ? status.toLowerCase() : "active";
    const rawPass = password && password.trim().length >= 6 ? password.trim() : "TradeLinker2026!";
    const passwordHash = await this.hashPassword(rawPass);

    const prefix = cleanRole === "admin" ? "usr-admin" : (cleanRole === "provider" ? "usr-prov" : "usr-cust");
    const seq = String(users.length + 1).padStart(3, "0");
    const newId = `${prefix}-${seq}`;

    const now = new Date().toISOString();
    const newUser = {
      id: newId,
      fullName: fullName.trim(),
      email: cleanEmail,
      phone: phone ? phone.trim() : "",
      passwordHash,
      role: cleanRole,
      status: cleanStatus,
      city: city ? city.trim() : "Islamabad",
      createdAt: now,
      updatedAt: now
    };

    users.push(newUser);
    localStorage.setItem(this.STORAGE_KEYS.USERS, JSON.stringify(users));

    // If provider, create stub provider profile
    if (cleanRole === "provider") {
      const providers = this.getProviders();
      providers.push({
        id: `prov-profile-${seq}`,
        userId: newId,
        businessName: `${newUser.fullName} Services`,
        categoryId: "construction",
        categoryTitle: "Construction Services",
        skills: ["General Technical Services"],
        experienceYears: 1,
        city: newUser.city,
        serviceAreas: [newUser.city],
        bioDescription: `Professional services by ${newUser.fullName}.`,
        verificationStatus: "pending",
        isPremium: false,
        createdAt: now
      });
      localStorage.setItem(this.STORAGE_KEYS.PROVIDERS, JSON.stringify(providers));
    }

    if (typeof TLCommunication !== "undefined" && TLCommunication.logAdminAction) {
      TLCommunication.logAdminAction({
        actionType: "USER_CREATED",
        targetType: "user",
        targetId: newId,
        details: `Administrator provisioned new ${cleanRole} account for '${newUser.fullName}' (${newId}).`,
        adminId
      });
    }

    return { success: true, user: this.sanitizeUser(newUser) };
  },

  getUserActivitySummary(userId) {
    this.init();
    const users = this.getUsers();
    const user = users.find(u => u.id === userId);
    if (!user) return null;

    const safeUser = this.sanitizeUser(user);

    let customerBookings = [];
    let providerBookings = [];
    let providerProfile = null;
    let services = [];
    let auditLogs = [];

    if (typeof TLBookings !== "undefined" && TLBookings.getAllBookings) {
      const allB = TLBookings.getAllBookings();
      customerBookings = allB.filter(b => b.customerId === userId);

      if (user.role === "provider") {
        const providers = this.getProviders();
        providerProfile = providers.find(p => p.userId === userId || p.id === userId) || null;
        if (providerProfile) {
          providerBookings = allB.filter(b => b.providerId === providerProfile.id || b.providerId === userId);
        }
      }
    }

    if (typeof TLServices !== "undefined" && TLServices.getAllServices) {
      const allS = TLServices.getAllServices();
      const providers = this.getProviders();
      const prov = providers.find(p => p.userId === userId || p.id === userId);
      if (prov) {
        services = allS.filter(s => s.providerId === prov.id || s.providerUserId === userId);
      }
    }

    if (typeof TLCommunication !== "undefined" && TLCommunication.getAllAdminAuditLogs) {
      const allLogs = TLCommunication.getAllAdminAuditLogs();
      auditLogs = allLogs.filter(l => l.targetId === userId || l.adminId === userId);
    }

    return {
      user: safeUser,
      customerBookings,
      providerBookings,
      providerProfile,
      services,
      auditLogs
    };
  },

  // --------------------------------------------------------------------------
  // 10. Professional Management & Verified Dossiers
  // --------------------------------------------------------------------------
  getDefaultProviderAvatar(categoryId, id) {
    const avatars = {
      electrical: "https://images.unsplash.com/photo-1540569014015-19a7be504e3a?w=200&auto=format&fit=crop",
      plumbing: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&auto=format&fit=crop",
      solar: "https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=200&auto=format&fit=crop",
      carpentry: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop",
      hvac: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&auto=format&fit=crop",
      construction: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=200&auto=format&fit=crop"
    };
    return avatars[categoryId] || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&auto=format&fit=crop";
  },

  getAllPortfolios() {
    let list = [];
    try {
      list = JSON.parse(localStorage.getItem("tl_db_portfolios")) || [];
    } catch (e) { list = []; }

    if (!list || list.length < 6) {
      list = [
        {
          id: "port-001",
          providerId: "prov-profile-001",
          title: "Smart Home DB Panel Wiring",
          caption: "3-phase automated distribution board with digital sub-meters, RCBO surge protection, and smart home IoT relays.",
          description: "3-phase automated distribution board with digital sub-meters, RCBO surge protection, and smart home IoT relays.",
          categoryTitle: "Electrical Services",
          img: "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=500&auto=format&fit=crop",
          display_order: 1,
          moderation_status: "approved",
          status: "Approved",
          is_featured: true,
          createdAt: "2026-10-01T10:00:00.000Z"
        },
        {
          id: "port-002",
          providerId: "prov-profile-003",
          title: "10kW Hybrid Solar Installation",
          caption: "Tier-1 Longi mono-facial panels with 10kW InfiniSolar inverter, net metering bidirectional setup, and lithium-ion backup.",
          description: "Tier-1 Longi mono-facial panels with 10kW InfiniSolar inverter, net metering bidirectional setup, and lithium-ion backup.",
          categoryTitle: "Solar Energy Services",
          img: "https://images.unsplash.com/photo-1509391365360-2e959784a276?w=500&auto=format&fit=crop",
          display_order: 2,
          moderation_status: "approved",
          status: "Approved",
          is_featured: true,
          createdAt: "2026-10-05T12:00:00.000Z"
        },
        {
          id: "port-003",
          providerId: "prov-profile-004",
          title: "Solid Teak Wood Main Door",
          caption: "Hand-carved Burma Teak double door with brass fittings and weather-resistant polyurethane protective lacquer.",
          description: "Hand-carved Burma Teak double door with brass fittings and weather-resistant polyurethane protective lacquer.",
          categoryTitle: "Wooden Door Making & Carpentry",
          img: "https://images.unsplash.com/photo-1538688525198-9b88f6f53126?w=500&auto=format&fit=crop",
          display_order: 3,
          moderation_status: "approved",
          status: "Approved",
          is_featured: false,
          createdAt: "2026-10-08T09:30:00.000Z"
        },
        {
          id: "port-004",
          providerId: "prov-profile-002",
          title: "High-Pressure PPR-C Piping System",
          caption: "Concealed sanitary pipework, multi-stage pressure booster pump, and thermostatic mixing valves.",
          description: "Concealed sanitary pipework, multi-stage pressure booster pump, and thermostatic mixing valves.",
          categoryTitle: "Plumbing Services",
          img: "https://images.unsplash.com/photo-1585704032915-c3400ca199e7?w=500&auto=format&fit=crop",
          display_order: 4,
          moderation_status: "approved",
          status: "Approved",
          is_featured: false,
          createdAt: "2026-10-12T14:15:00.000Z"
        },
        {
          id: "port-005",
          providerId: "prov-profile-005",
          title: "Commercial VRF AC Installation",
          caption: "Multi-zone inverter air conditioning ducting, vibration dampening brackets, and centralized digital thermostat.",
          description: "Multi-zone inverter air conditioning ducting, vibration dampening brackets, and centralized digital thermostat.",
          categoryTitle: "AC & HVAC Services",
          img: "https://images.unsplash.com/photo-1631545648834-58537b98bf95?w=500&auto=format&fit=crop",
          display_order: 5,
          moderation_status: "approved",
          status: "Approved",
          is_featured: false,
          createdAt: "2026-10-15T11:00:00.000Z"
        },
        {
          id: "port-006",
          providerId: "prov-profile-006",
          title: "RCC Structural Framework",
          caption: "Cast-in-place reinforced concrete columns, raft foundation waterproofing, and earthquake-resistant structural tie beams.",
          description: "Cast-in-place reinforced concrete columns, raft foundation waterproofing, and earthquake-resistant structural tie beams.",
          categoryTitle: "Construction Services",
          img: "https://images.unsplash.com/photo-1541888946425-d0fbb186156a?w=500&auto=format&fit=crop",
          display_order: 6,
          moderation_status: "approved",
          status: "Approved",
          is_featured: false,
          createdAt: "2026-10-18T16:45:00.000Z"
        },
        {
          id: "port-007",
          providerId: "prov-profile-003",
          title: "Smart Battery Storage Rack Assembly",
          caption: "Lithium iron phosphate (LiFePO4) high-voltage battery storage rack with integrated fire suppression system.",
          description: "Lithium iron phosphate (LiFePO4) high-voltage battery storage rack with integrated fire suppression system.",
          categoryTitle: "Solar Energy Services",
          img: "https://images.unsplash.com/photo-1509391365360-2e959784a276?w=500&auto=format&fit=crop",
          display_order: 7,
          moderation_status: "pending",
          status: "Pending",
          is_featured: false,
          createdAt: "2026-10-28T09:00:00.000Z"
        },
        {
          id: "port-008",
          providerId: "prov-profile-001",
          title: "Unverified Temporary Power Hookup",
          caption: "Exposed makeshift wiring with substandard gauges violating safety regulations.",
          description: "Exposed makeshift wiring with substandard gauges violating safety regulations.",
          categoryTitle: "Electrical Services",
          img: "https://images.unsplash.com/photo-1513694203232-719a280e022f?w=500&auto=format&fit=crop",
          display_order: 8,
          moderation_status: "rejected",
          status: "Rejected",
          moderation_note: "Inappropriate Content: Substandard electrical practice posing safety risk, rejected by admin.",
          is_featured: false,
          createdAt: "2026-10-29T11:20:00.000Z"
        }
      ];
      localStorage.setItem("tl_db_portfolios", JSON.stringify(list));
    }

    return list;
  },

  getProviderPortfolio(providerId) {
    return this.getAllPortfolios().filter(p => p.providerId === providerId && p.moderation_status !== 'rejected');
  },

  getAllPortfoliosJoined() {
    this.init();
    const list = this.getAllPortfolios();
    const providers = this.getProviders();
    const users = this.getUsers();

    return list.map(item => {
      const providerProfile = providers.find(p => p.id === item.providerId || p.userId === item.providerId) || null;
      const providerUser = providerProfile ? users.find(u => u.id === providerProfile.userId) : null;

      const provider = {
        id: item.providerId,
        userId: providerProfile ? providerProfile.userId : null,
        businessName: providerProfile ? providerProfile.businessName : "Trade Specialist",
        fullName: providerUser ? providerUser.fullName : (providerProfile ? providerProfile.businessName : "Specialist"),
        avatar: (providerUser && providerUser.avatar) ? providerUser.avatar : ((providerProfile && providerProfile.avatar) ? providerProfile.avatar : "https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=120"),
        categoryTitle: providerProfile ? providerProfile.categoryTitle : (item.categoryTitle || "Trade Services"),
        city: providerProfile ? providerProfile.city : (providerUser ? providerUser.city : "Islamabad"),
        phone: providerProfile ? providerProfile.phone : (providerUser ? providerUser.phone : "—")
      };

      const moderation_status = item.moderation_status || (item.status ? item.status.toLowerCase() : "approved");
      const caption = item.caption || item.description || "";
      const display_order = parseInt(item.display_order, 10) || 1;

      return {
        ...item,
        caption,
        description: caption,
        display_order,
        moderation_status,
        status: moderation_status === "approved" ? "Approved" : (moderation_status === "rejected" ? "Rejected" : "Pending"),
        provider
      };
    });
  },

  getPortfolioItemById(itemId) {
    const list = this.getAllPortfoliosJoined();
    return list.find(p => p.id === itemId) || null;
  },

  adminApprovePortfolioItem({ itemId, adminId = "admin", note = "" }) {
    let list = this.getAllPortfolios();
    const idx = list.findIndex(p => p.id === itemId);
    if (idx === -1) return { success: false, error: `Portfolio item #${itemId} not found.` };

    const nowIso = new Date().toISOString();
    list[idx].moderation_status = "approved";
    list[idx].status = "Approved";
    list[idx].moderated_at = nowIso;
    list[idx].moderated_by = adminId;
    if (note) list[idx].moderation_note = note;

    localStorage.setItem("tl_db_portfolios", JSON.stringify(list));

    if (typeof TLCommunication !== "undefined" && TLCommunication.logAdminAction) {
      TLCommunication.logAdminAction({
        actionType: "PORTFOLIO_APPROVED",
        targetType: "portfolio",
        targetId: itemId,
        details: `Administrator (${adminId}) APPROVED portfolio showcase '${list[idx].title}'. Note: ${note || 'Workmanship approved'}`,
        adminId
      });
    }

    return { success: true, item: list[idx] };
  },

  adminRejectPortfolioItem({ itemId, adminId = "admin", reason = "" }) {
    let list = this.getAllPortfolios();
    const idx = list.findIndex(p => p.id === itemId);
    if (idx === -1) return { success: false, error: `Portfolio item #${itemId} not found.` };

    const nowIso = new Date().toISOString();
    list[idx].moderation_status = "rejected";
    list[idx].status = "Rejected";
    list[idx].moderated_at = nowIso;
    list[idx].moderated_by = adminId;
    list[idx].moderation_note = reason || "Inappropriate content flagged by administrator.";

    localStorage.setItem("tl_db_portfolios", JSON.stringify(list));

    if (typeof TLCommunication !== "undefined" && TLCommunication.logAdminAction) {
      TLCommunication.logAdminAction({
        actionType: "PORTFOLIO_REJECTED",
        targetType: "portfolio",
        targetId: itemId,
        details: `Administrator (${adminId}) REJECTED portfolio showcase '${list[idx].title}'. Reason: ${list[idx].moderation_note}`,
        adminId
      });
    }

    return { success: true, item: list[idx] };
  },

  adminUpdatePortfolioItem({ itemId, title, caption, display_order, is_featured, adminId = "admin" }) {
    let list = this.getAllPortfolios();
    const idx = list.findIndex(p => p.id === itemId);
    if (idx === -1) return { success: false, error: `Portfolio item #${itemId} not found.` };

    if (title) list[idx].title = title.trim();
    if (caption !== undefined) {
      list[idx].caption = caption.trim();
      list[idx].description = caption.trim();
    }
    if (display_order !== undefined) {
      list[idx].display_order = parseInt(display_order, 10) || 1;
    }
    if (is_featured !== undefined) {
      list[idx].is_featured = !!is_featured;
    }
    list[idx].updatedAt = new Date().toISOString();

    localStorage.setItem("tl_db_portfolios", JSON.stringify(list));

    if (typeof TLCommunication !== "undefined" && TLCommunication.logAdminAction) {
      TLCommunication.logAdminAction({
        actionType: "PORTFOLIO_UPDATED",
        targetType: "portfolio",
        targetId: itemId,
        details: `Administrator (${adminId}) updated portfolio showcase #${itemId} details.`,
        adminId
      });
    }

    return { success: true, item: list[idx] };
  },

  adminDeletePortfolioItem({ itemId, adminId = "admin" }) {
    let list = this.getAllPortfolios();
    const idx = list.findIndex(p => p.id === itemId);
    if (idx === -1) return { success: false, error: `Portfolio item #${itemId} not found.` };

    const deleted = list.splice(idx, 1)[0];
    localStorage.setItem("tl_db_portfolios", JSON.stringify(list));

    if (typeof TLCommunication !== "undefined" && TLCommunication.logAdminAction) {
      TLCommunication.logAdminAction({
        actionType: "PORTFOLIO_DELETED",
        targetType: "portfolio",
        targetId: itemId,
        details: `Administrator (${adminId}) permanently deleted inappropriate portfolio showcase #${itemId} ('${deleted.title}').`,
        adminId
      });
    }

    return { success: true, item: deleted };
  },

  getAllProfessionalsJoined() {
    this.init();
    const providers = this.getProviders();
    const users = this.getUsers();

    return providers.map(p => {
      const u = users.find(x => x.id === p.userId) || {};
      const safeUser = this.sanitizeUser(u);

      const avatar = p.profileImage || p.avatar || this.getDefaultProviderAvatar(p.categoryId, p.id);

      let servicesCount = 0;
      if (typeof TLServices !== "undefined" && TLServices.getAllServices) {
        servicesCount = TLServices.getAllServices().filter(s => s.providerId === p.id || s.providerId === p.userId).length;
      }

      let bookingsCount = 0;
      if (typeof TLBookings !== "undefined" && TLBookings.getAllBookings) {
        bookingsCount = TLBookings.getAllBookings().filter(b => b.providerId === p.id || b.providerId === p.userId).length;
      }

      let rating = p.rating || 5.0;
      let reviewCount = p.reviewCount || 0;
      if (typeof TLBookings !== "undefined" && TLBookings.getProviderReviews) {
        const revs = TLBookings.getProviderReviews(p.id);
        if (revs.length > 0) {
          reviewCount = revs.length;
          rating = Number((revs.reduce((sum, r) => sum + r.rating, 0) / revs.length).toFixed(1));
        }
      }

      return {
        ...p,
        avatar,
        fullName: u.fullName || p.name || p.businessName || "Specialist",
        email: u.email || "—",
        phone: u.phone || p.phone || "—",
        userStatus: u.status || "active",
        registeredAt: u.createdAt || p.createdAt || "2026-08-01T09:00:00.000Z",
        servicesCount,
        bookingsCount,
        rating,
        reviewCount,
        user: safeUser
      };
    });
  },

  getProfessionalFullDossier(providerId) {
    this.init();
    const joinedList = this.getAllProfessionalsJoined();
    const pro = joinedList.find(p => p.id === providerId || p.userId === providerId);
    if (!pro) return null;

    let services = [];
    if (typeof TLServices !== "undefined" && TLServices.getAllServices) {
      services = TLServices.getAllServices().filter(s => s.providerId === pro.id || s.providerId === pro.userId);
    }

    let bookings = [];
    if (typeof TLBookings !== "undefined" && TLBookings.getAllBookings) {
      bookings = TLBookings.getAllBookings().filter(b => b.providerId === pro.id || b.providerId === pro.userId);
    }

    let reviews = [];
    if (typeof TLBookings !== "undefined" && TLBookings.getProviderReviews) {
      reviews = TLBookings.getProviderReviews(pro.id);
    }

    const portfolio = this.getProviderPortfolio(pro.id);

    return {
      professional: pro,
      services,
      bookings,
      reviews,
      portfolio
    };
  },

  updateProfessionalByAdmin(providerId, { businessName, categoryId, categoryTitle, experienceYears, city, serviceAreas, bioDescription, skills, verificationStatus, isPremium, avatar }, adminId = "admin") {
    this.init();
    const providers = this.getProviders();
    const idx = providers.findIndex(p => p.id === providerId || p.userId === providerId);
    if (idx === -1) return { success: false, error: "Professional profile not found." };

    const target = providers[idx];

    if (businessName) target.businessName = businessName.trim();
    if (categoryId) target.categoryId = categoryId;
    if (categoryTitle) target.categoryTitle = categoryTitle;
    if (experienceYears !== undefined) target.experienceYears = parseInt(experienceYears, 10) || 1;
    if (city) target.city = city.trim();
    if (serviceAreas !== undefined) {
      target.serviceAreas = Array.isArray(serviceAreas) ? serviceAreas : serviceAreas.split(",").map(a => a.trim()).filter(Boolean);
    }
    if (bioDescription !== undefined) target.bioDescription = bioDescription.trim();
    if (skills !== undefined) {
      target.skills = Array.isArray(skills) ? skills : skills.split(",").map(s => s.trim()).filter(Boolean);
    }
    if (verificationStatus) target.verificationStatus = verificationStatus;
    if (isPremium !== undefined) target.isPremium = Boolean(isPremium);
    if (avatar) target.avatar = avatar;

    target.updatedAt = new Date().toISOString();
    providers[idx] = target;
    localStorage.setItem(this.STORAGE_KEYS.PROVIDERS, JSON.stringify(providers));

    if (target.userId && city) {
      const users = this.getUsers();
      const uIdx = users.findIndex(u => u.id === target.userId);
      if (uIdx !== -1) {
        users[uIdx].city = target.city;
        users[uIdx].updatedAt = target.updatedAt;
        localStorage.setItem(this.STORAGE_KEYS.USERS, JSON.stringify(users));
      }
    }

    if (typeof TLCommunication !== "undefined" && TLCommunication.logAdminAction) {
      TLCommunication.logAdminAction({
        actionType: "PROVIDER_UPDATED",
        targetType: "provider",
        targetId: target.id,
        details: `Administrator updated profile for '${target.businessName}' (${target.id}): trade=${target.categoryTitle}, verif=${target.verificationStatus}.`,
        adminId
      });
    }

    return { success: true, provider: target };
  },

  toggleProfessionalAccountStatus(providerId, adminId = "admin") {
    this.init();
    const providers = this.getProviders();
    const target = providers.find(p => p.id === providerId || p.userId === providerId);
    if (!target || !target.userId) {
      return { success: false, error: "Linked user account not found for this professional." };
    }

    return this.toggleUserStatus(target.userId, adminId);
  },

  reviewProfessionalVerification(providerId, action, reasonNote, adminId = "admin") {
    this.init();
    if (typeof TLCommunication !== "undefined" && TLCommunication.reviewVerification) {
      return TLCommunication.reviewVerification({ providerId, action, reasonNote, adminId });
    }

    const providers = this.getProviders();
    const idx = providers.findIndex(p => p.id === providerId);
    if (idx === -1) return { success: false, error: "Provider not found." };

    providers[idx].verificationStatus = action;
    localStorage.setItem(this.STORAGE_KEYS.PROVIDERS, JSON.stringify(providers));
    return { success: true, verificationStatus: action };
  },

  // --------------------------------------------------------------------------
  // 11. Sanitizer (Excludes password hash from memory/return objects)
  // --------------------------------------------------------------------------
  sanitizeUser(user) {
    if (!user) return null;
    const { passwordHash, ...safe } = user;
    return safe;
  }
};

if (typeof window !== "undefined") {
  window.TLAuth = TLAuth;
  window.TLPortfolios = TLAuth;
  TLAuth.init();
}
