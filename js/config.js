/**
 * TradeLinker Global Configuration & Backend Integration Settings
 * Supports both Production (Supabase / Firebase) and Secure Local Sandbox Mode
 * Techminds (Wasi Ullah & Hamad Ullah) — SRS v1.0
 */

const TLConfig = {
  appName: "TradeLinker",
  tagline: "Connecting People with Trusted Professionals",
  version: "1.0.0",

  // Authentication Mode: 'local' (Client-side Cryptographic Vault) or 'supabase' (Production Backend)
  // Switch to 'supabase' by entering your Project URL and Public Anon Key below
  authProvider: "local",

  supabase: {
    url: "",      // e.g. "https://xyzcompany.supabase.co"
    anonKey: "",  // Public Anon Key (Never place service_role key here)
    isConfigured() {
      return Boolean(this.url && this.anonKey && this.url.startsWith("https://"));
    }
  },

  // Security Configuration
  security: {
    minPasswordLength: 8,
    sessionDurationHours: 24,
    tokenPrefix: "tl_sec_tkn_",
    saltSecret: "TL_TECHMINDS_SALT_2026_SECURE"
  },

  // Dashboards destination by role
  dashboardRoutes: {
    customer: "customer-dashboard.html",
    provider: "provider-dashboard.html",
    admin: "admin-dashboard.html"
  }
};

if (typeof window !== "undefined") {
  window.TLConfig = TLConfig;
}
