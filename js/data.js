/**
 * TradeLinker Platform Data Service & Demonstrative Seed Data
 * Based on SRS v1.0 specifications and initial 6 service categories.
 * All demonstration records are clearly marked for development and testing.
 */

const TLData = {
  // 6 Core Initial Categories (SRS Section 3.4 & BR-09)
  categories: [
    {
      id: "construction",
      title: "Construction Services",
      tagline: "Construction workers, contractors, civil engineers, and related professionals.",
      icon: "construction",
      activeCount: 18,
      popularServices: ["Civil Construction", "Structure Masonry", "Renovation & Remodeling", "Site Supervision"]
    },
    {
      id: "plumbing",
      title: "Plumbing Services",
      tagline: "Pipe installation, water supply systems, drainage, and plumbing repairs.",
      icon: "plumbing",
      activeCount: 32,
      popularServices: ["Leak Detection & Repair", "Water Tank Installation", "Drainage Unblocking", "Bathroom Fixtures"]
    },
    {
      id: "electrical",
      title: "Electrical Services",
      tagline: "Electrical installation, maintenance, wiring, and troubleshooting.",
      icon: "electrical",
      activeCount: 41,
      popularServices: ["Full House Wiring", "Distribution Board (DB) Setup", "Generator & UPS Wiring", "Short Circuit Repair"]
    },
    {
      id: "hvac",
      title: "AC & HVAC Services",
      tagline: "Air conditioning installation, maintenance, repair, and ventilation services.",
      icon: "hvac",
      activeCount: 24,
      popularServices: ["Split AC Installation", "AC Gas Refill & Servicing", "Duct & Chiller Repair", "Inverter AC Diagnostics"]
    },
    {
      id: "solar",
      title: "Solar Energy Services",
      tagline: "Solar panel installation, maintenance, and related system services.",
      icon: "solar",
      activeCount: 27,
      popularServices: ["On-Grid Solar Setup", "Hybrid Lithium Battery Backup", "Net Metering Approvals", "Solar Panel Cleaning"]
    },
    {
      id: "carpentry",
      title: "Wooden Door Making & Carpentry",
      tagline: "Wooden door manufacturing, fitting, repairs, and carpentry work.",
      icon: "carpentry",
      activeCount: 21,
      popularServices: ["Solid Wood Door Crafting", "Door Frame Installation", "Wardrobe & Cabinet Making", "Lock Fitting & Repairs"]
    }
  ],

  // Demonstration Service Providers (Clearly identified as demonstration data)
  providers: [
    {
      id: "prov-001",
      name: "Engr. Rashid Khan",
      businessName: "Khan Electrical & Automation",
      categoryId: "electrical",
      categoryTitle: "Electrical Services",
      avatar: "https://images.unsplash.com/photo-1540569014015-19a7be504e3a?w=200&auto=format&fit=crop",
      isVerified: true,
      isPremium: true,
      rating: 4.9,
      reviewCount: 46,
      experienceYears: 9,
      city: "Islamabad",
      serviceAreas: ["F-6", "F-7", "F-8", "G-10", "DHA Phase 2"],
      priceDisplay: "PKR 1,500",
      priceType: "Starting inspection fee",
      bio: "Certified electrical contractor specializing in residential wiring, short-circuit troubleshooting, DB panel upgrades, and smart home inverter automation.",
      skills: ["Wiring", "DB Panels", "Circuit Diagnostics", "Safety Inspection"],
      isDemonstration: true
    },
    {
      id: "prov-002",
      name: "Tariq Mahmood",
      businessName: "Indus Solar & Energy Solutions",
      categoryId: "solar",
      categoryTitle: "Solar Energy Services",
      avatar: "https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=200&auto=format&fit=crop",
      isVerified: true,
      isPremium: true,
      rating: 5.0,
      reviewCount: 62,
      experienceYears: 12,
      city: "Rawalpindi",
      serviceAreas: ["Bahria Town", "Saddar", "Chaklala", "Askari 14"],
      priceDisplay: "Upon Request",
      priceType: "Free Site Assessment",
      bio: "Turnkey solar system engineer delivering tier-1 on-grid and hybrid solar installations with NEPRA net-metering approvals and battery backup systems.",
      skills: ["Solar EPC", "Net Metering", "Inverter Calibration", "Load Audits"],
      isDemonstration: true
    },
    {
      id: "prov-003",
      name: "Ustad Ghulam Murtaza",
      businessName: "Murtaza Master Carpentry & Doors",
      categoryId: "carpentry",
      categoryTitle: "Wooden Door Making & Carpentry",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop",
      isVerified: true,
      isPremium: false,
      rating: 4.8,
      reviewCount: 38,
      experienceYears: 15,
      city: "Lahore",
      serviceAreas: ["Gulberg", "DHA Lahore", "Model Town", "Johar Town"],
      priceDisplay: "PKR 2,200",
      priceType: "Per fitting / custom quote",
      bio: "Master artisan specializing in pure solid teak, deodar, and ash wood door crafting, custom lock installation, and architectural wood fitting.",
      skills: ["Solid Doors", "Wood Carving", "Frame Mounting", "Lock Fitting"],
      isDemonstration: true
    },
    {
      id: "prov-004",
      name: "Kashif Ali & Sons",
      businessName: "QuickFlow Plumbing Specialists",
      categoryId: "plumbing",
      categoryTitle: "Plumbing Services",
      avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&auto=format&fit=crop",
      isVerified: true,
      isPremium: false,
      rating: 4.7,
      reviewCount: 54,
      experienceYears: 8,
      city: "Islamabad",
      serviceAreas: ["I-8", "I-9", "G-11", "Bahria Enclave"],
      priceDisplay: "PKR 1,200",
      priceType: "Visit & Basic Fix",
      bio: "Emergency and scheduled plumbing services including thermal leak detection, sanitary sewer line unclogging, water pump and geyser fitting.",
      skills: ["Leak Detection", "Geyser Repair", "Sanitary Lines", "Pressure Pumps"],
      isDemonstration: true
    },
    {
      id: "prov-005",
      name: "Malik Shahzad",
      businessName: "CoolBreeze AC & Heating Solutions",
      categoryId: "hvac",
      categoryTitle: "AC & HVAC Services",
      avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&auto=format&fit=crop",
      isVerified: true,
      isPremium: true,
      rating: 4.9,
      reviewCount: 71,
      experienceYears: 11,
      city: "Karachi",
      serviceAreas: ["Clifton", "DHA Karachi", "Gulshan-e-Iqbal", "PECHS"],
      priceDisplay: "PKR 2,500",
      priceType: "Full Unit Master Servicing",
      bio: "Commercial and residential HVAC technicians specialized in DC inverter AC repair, pressure testing, coil chemical washing, and chiller maintenance.",
      skills: ["Inverter PCB", "Gas Charging", "Split Installation", "HVAC Ducts"],
      isDemonstration: true
    },
    {
      id: "prov-006",
      name: "Engr. Bilal Farooq",
      businessName: "Apex Civil & Construction Builders",
      categoryId: "construction",
      categoryTitle: "Construction Services",
      avatar: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=200&auto=format&fit=crop",
      isVerified: true,
      isPremium: false,
      rating: 4.9,
      reviewCount: 29,
      experienceYears: 14,
      city: "Peshawar",
      serviceAreas: ["Hayatabad", "University Town", "Cantt", "Warsak Road"],
      priceDisplay: "Upon Request",
      priceType: "Free Milestone Estimate",
      bio: "PEC-registered civil engineer offering structural construction, Grey structure contracts, renovation supervision, and quality material sourcing.",
      skills: ["Grey Structure", "Foundation Masonry", "Cost Estimation", "Site Supervision"],
      isDemonstration: true
    }
  ],

  // Platform Metrics for Proof & Trust (Based on Infographic & SRS)
  metrics: {
    verifiedProviders: 163,
    jobsCompleted: 1420,
    averageRating: "4.85 / 5.0",
    activeCities: ["Islamabad", "Rawalpindi", "Lahore", "Karachi", "Peshawar"]
  },

  // Helper: Query categories
  getCategories() {
    return this.categories;
  },

  // Helper: Query providers with filters
  searchProviders(query = "", category = "", city = "") {
    let list = [...this.providers];
    const q = query.trim().toLowerCase();

    if (q) {
      list = list.filter(p => 
        p.name.toLowerCase().includes(q) ||
        p.businessName.toLowerCase().includes(q) ||
        p.categoryTitle.toLowerCase().includes(q) ||
        p.bio.toLowerCase().includes(q) ||
        p.skills.some(s => s.toLowerCase().includes(q))
      );
    }

    if (category && category !== "all") {
      list = list.filter(p => p.categoryId === category);
    }

    if (city && city !== "all") {
      list = list.filter(p => p.city.toLowerCase() === city.toLowerCase() || p.serviceAreas.some(a => a.toLowerCase().includes(city.toLowerCase())));
    }

    return list;
  }
};

if (typeof window !== "undefined") {
  window.TLData = TLData;
}
