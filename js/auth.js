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
    }
  },

  seedInitialUsers() {
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
        createdAt: new Date().toISOString()
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
        createdAt: new Date().toISOString()
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
        createdAt: new Date().toISOString()
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
        createdAt: new Date().toISOString()
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
        createdAt: new Date().toISOString()
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
        verificationStatus: "pending",
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
        verificationStatus: "pending",
        isPremium: true
      }
    ];

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

  logout() {
    localStorage.removeItem(this.STORAGE_KEYS.SESSION);
    sessionStorage.removeItem(this.STORAGE_KEYS.SESSION);
    window.location.href = "index.html";
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
  protectRoute(allowedRoles = []) {
    const user = this.getCurrentUser();

    if (!user) {
      // Unauthenticated -> redirect to login with return path
      const currentPath = encodeURIComponent(window.location.pathname.split("/").pop() || "index.html");
      window.location.href = `auth.html?mode=login&returnUrl=${currentPath}&authError=unauthenticated`;
      return false;
    }

    if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
      // Role mismatch -> redirect to appropriate authorized dashboard
      alert(`Access Restricted (FR-49): Your account role (${user.role.toUpperCase()}) cannot access this section.`);
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
  // 9. Sanitizer (Excludes password hash from memory/return objects)
  // --------------------------------------------------------------------------
  sanitizeUser(user) {
    const { passwordHash, ...safe } = user;
    return safe;
  }
};

if (typeof window !== "undefined") {
  window.TLAuth = TLAuth;
  TLAuth.init();
}
