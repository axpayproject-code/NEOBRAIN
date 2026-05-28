export interface PlanFeatures {
  maxChildren: number;
  screeningsPerYear: number;
  videoAnalysis: boolean;
  videoPerMonth: number;
  therapyTracking: boolean;
  specialistMessaging: boolean;
  priorityAI: boolean;
  fullAIReports: boolean;
  upgradeLabel: string;
  planName: string;
}

const PLANS: Record<string, PlanFeatures> = {
  "free": {
    maxChildren: 1,
    screeningsPerYear: 1,
    videoAnalysis: false,
    videoPerMonth: 0,
    therapyTracking: false,
    specialistMessaging: false,
    priorityAI: false,
    fullAIReports: false,
    upgradeLabel: "Upgrade to Starter Care (₱200/mo)",
    planName: "Free",
  },
  "starter-care": {
    maxChildren: 1,
    screeningsPerYear: 2,
    videoAnalysis: false,
    videoPerMonth: 0,
    therapyTracking: false,
    specialistMessaging: false,
    priorityAI: false,
    fullAIReports: false,
    upgradeLabel: "Upgrade to Care Plus (₱799/mo)",
    planName: "Starter Care",
  },
  "care-plus": {
    maxChildren: 4,
    screeningsPerYear: Infinity,
    videoAnalysis: true,
    videoPerMonth: 3,
    therapyTracking: true,
    specialistMessaging: true,
    priorityAI: false,
    fullAIReports: true,
    upgradeLabel: "Upgrade to Care Family Pro (₱1,999/mo)",
    planName: "Care Plus",
  },
  "care-family-pro": {
    maxChildren: 6,
    screeningsPerYear: Infinity,
    videoAnalysis: true,
    videoPerMonth: Infinity,
    therapyTracking: true,
    specialistMessaging: true,
    priorityAI: true,
    fullAIReports: true,
    upgradeLabel: "You're on the top plan",
    planName: "Care Family Pro",
  },
};

const TIER_MAP: Record<string, string> = {
  // DB keys (from subscriptionTier column)
  "free": "free",
  "starter-care": "starter-care",
  "care-plus": "care-plus",
  "care-family-pro": "care-family-pro",
  // Legacy / alternate keys
  "starter_care": "starter-care",
  "care_plus": "care-plus",
  "care_family_pro": "care-family-pro",
  // Human-readable names (from pricing page)
  "starter care": "starter-care",
  "care plus": "care-plus",
  "care family pro": "care-family-pro",
  // Onboarding plan slugs
  "starter": "starter-care",
  "plus": "care-plus",
  "pro": "care-family-pro",
};

export function getPlanFeatures(tier?: string): PlanFeatures {
  if (!tier) return PLANS["free"];
  const key = TIER_MAP[tier.toLowerCase()] ?? "free";
  return PLANS[key] ?? PLANS["free"];
}
