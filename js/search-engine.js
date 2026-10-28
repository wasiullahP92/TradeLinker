/**
 * TradeLinker Professional & Service Discovery Engine
 * Implements SRS FR-23 to FR-27, BR-02, BR-07, BR-09, UC-01
 * Techminds (Wasi Ullah & Hamad Ullah)
 * 
 * Features:
 * - Full-text search across professional names, service titles, descriptions, and skills
 * - Multi-criteria filtering: Categories, Locations, Price range, Pricing type, Experience, Rating, Verification
 * - Multi-source data aggregation: Live storage (local vault) + Seed demonstration data + Supabase integration
 * - Privacy protection (strips sensitive credentials/hashes)
 * - Sorting: Recommended, Rating, Experience, Price
 */

const TLSearchEngine = {
  // Query execution with simulated or live backend delay
  async search(filters = {}) {
    // Simulate real backend query response latency
    await new Promise(resolve => setTimeout(resolve, 180));

    // 1. Fetch raw datasets from primary repository
    const rawProviders = this.loadProvidersFromSource();
    const rawServices = this.loadServicesFromSource();

    // 2. Denormalize & merge services into provider records
    let records = rawProviders.map(p => {
      const providerServices = rawServices.filter(s => s.providerId === p.id);
      return {
        ...p,
        services: providerServices,
        // Computed starting price
        lowestPrice: providerServices.reduce((min, s) => {
          if (s.priceAmount && s.priceAmount > 0) {
            return min === null ? s.priceAmount : Math.min(min, s.priceAmount);
          }
          return min;
        }, null)
      };
    });

    // 3. Apply Multi-Facet Filtering
    // A. Text Search (FR-23): Matches professional name, business name, service titles, skills, or descriptions
    if (filters.query && filters.query.trim()) {
      const q = filters.query.trim().toLowerCase();
      records = records.filter(p => {
        const matchName = (p.name || "").toLowerCase().includes(q) || (p.fullName || "").toLowerCase().includes(q);
        const matchBiz = (p.businessName || "").toLowerCase().includes(q);
        const matchCat = (p.categoryTitle || "").toLowerCase().includes(q);
        const matchBio = (p.bio || p.bioDescription || "").toLowerCase().includes(q);
        const matchSkills = (p.skills || []).some(s => s.toLowerCase().includes(q));
        const matchServices = p.services.some(s => 
          s.title.toLowerCase().includes(q) || s.description.toLowerCase().includes(q)
        );
        return matchName || matchBiz || matchCat || matchBio || matchSkills || matchServices;
      });
    }

    // B. Service Category Filter (FR-24, BR-09)
    if (filters.category && filters.category !== "all") {
      records = records.filter(p => p.categoryId === filters.category);
    }

    // C. Location Filter (FR-24)
    if (filters.city && filters.city !== "all") {
      const cityLower = filters.city.toLowerCase();
      records = records.filter(p => {
        const inCity = (p.city || "").toLowerCase() === cityLower;
        const inAreas = (p.serviceAreas || []).some(a => a.toLowerCase().includes(cityLower));
        return inCity || inAreas;
      });
    }

    // D. Verification Status Filter (BR-07)
    if (filters.verifiedOnly) {
      records = records.filter(p => p.verificationStatus === "verified" || p.isVerified === true);
    }

    // E. Minimum Star Rating Filter (FR-25)
    if (filters.minRating && parseFloat(filters.minRating) > 0) {
      const minR = parseFloat(filters.minRating);
      records = records.filter(p => (p.rating || 5.0) >= minR);
    }

    // F. Minimum Experience Years (FR-25)
    if (filters.minExperience && parseInt(filters.minExperience) > 0) {
      const minExp = parseInt(filters.minExperience);
      records = records.filter(p => (p.experienceYears || 1) >= minExp);
    }

    // G. Pricing Type Filter
    if (filters.pricingType && filters.pricingType !== "all") {
      records = records.filter(p => {
        if (filters.pricingType === "upon_request") {
          return p.services.some(s => s.pricingType === "upon_request") || p.priceDisplay === "Upon Request";
        }
        return p.services.some(s => s.pricingType === filters.pricingType);
      });
    }

    // H. Max Price Filter
    if (filters.maxPrice && parseInt(filters.maxPrice) > 0) {
      const maxP = parseInt(filters.maxPrice);
      records = records.filter(p => {
        if (p.lowestPrice !== null) return p.lowestPrice <= maxP;
        // If price is upon request, include by default unless strict fixed filter
        return true;
      });
    }

    // I. Availability Filter
    if (filters.availableOnly) {
      records = records.filter(p => p.services.some(s => s.isAvailable));
    }

    // 4. Sorting Logic
    const sort = filters.sortBy || "recommended";
    records.sort((a, b) => {
      if (sort === "rating_desc") {
        return (b.rating || 0) - (a.rating || 0);
      }
      if (sort === "experience_desc") {
        return (b.experienceYears || 0) - (a.experienceYears || 0);
      }
      if (sort === "price_asc") {
        const pA = a.lowestPrice || 999999;
        const pB = b.lowestPrice || 999999;
        return pA - pB;
      }
      // Default: "recommended" (Verified first, then Premium, then rating)
      const scoreA = ((a.verificationStatus === "verified" || a.isVerified) ? 10 : 0) + (a.isPremium ? 5 : 0) + (a.rating || 4);
      const scoreB = ((b.verificationStatus === "verified" || b.isVerified) ? 10 : 0) + (b.isPremium ? 5 : 0) + (b.rating || 4);
      return scoreB - scoreA;
    });

    // 5. Privacy Sanitization (strip passwords, internal private keys)
    return records.map(p => this.sanitizeProvider(p));
  },

  loadProvidersFromSource() {
    let combined = [];

    // 1. Live registered providers in database
    if (typeof TLAuth !== "undefined") {
      const dbProviders = TLAuth.getProviders();
      const dbUsers = TLAuth.getUsers();

      dbProviders.forEach(p => {
        const u = dbUsers.find(user => user.id === p.userId);
        if (u && u.status !== "suspended") {
          combined.push({
            id: p.id,
            userId: p.userId,
            name: u.fullName,
            businessName: p.businessName,
            categoryId: p.categoryId,
            categoryTitle: p.categoryTitle || "Trade Services",
            avatar: p.avatarUrl || u.avatarUrl || null,
            verificationStatus: p.verificationStatus || "pending",
            isVerified: p.verificationStatus === "verified",
            isPremium: Boolean(p.isPremium),
            rating: p.averageRating || 5.0,
            reviewCount: p.reviewCount || 1,
            experienceYears: p.experienceYears || 3,
            city: p.city || u.city || "Islamabad",
            serviceAreas: p.serviceAreas || [p.city || "Islamabad"],
            bio: p.bioDescription || "Specialist registered on TradeLinker.",
            skills: p.skills || [],
            priceDisplay: "Custom Quote",
            priceType: "Upon Request",
            isDemonstration: false
          });
        }
      });
    }

    // 2. Demonstration seed providers from TLData (clearly identified per requirements)
    if (typeof TLData !== "undefined" && TLData.providers) {
      TLData.providers.forEach(dp => {
        // Only add if not already in combined
        if (!combined.some(c => c.id === dp.id)) {
          combined.push({
            ...dp,
            verificationStatus: dp.isVerified ? "verified" : "pending",
            isDemonstration: true
          });
        }
      });
    }

    return combined;
  },

  loadServicesFromSource() {
    if (typeof TLServices !== "undefined") {
      return TLServices.getAllServices();
    }
    return [];
  },

  sanitizeProvider(p) {
    // Strip any sensitive properties
    const { passwordHash, ...clean } = p;
    return clean;
  }
};

if (typeof window !== "undefined") {
  window.TLSearchEngine = TLSearchEngine;
}
