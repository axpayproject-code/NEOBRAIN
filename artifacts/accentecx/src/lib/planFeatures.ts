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
  "starter-care": {
    maxChildren: 1,
    screeningsPerYear: 2,
    videoAnalysis: false,
    videoPerMonth: 0,
    therapyTracking: false,
    specialistMessaging: false,
    priorityAI: false,
    fullAIReports: false,
    upgradeLabel: "Upgrade to Care Plus",
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
    upgradeLabel: "Upgrade to Care Family Pro",
    planName: "Care Plus",
  },
  "care-family-pro": {
    maxChildren: Infinity,
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
  "starter care": "starter-care",
  "care plus": "care-plus",
  "care family pro": "care-family-pro",
  "starter-care": "starter-care",
  "care-plus": "care-plus",
  "care-family-pro": "care-family-pro",
};

export function getPlanFeatures(tier?: string): PlanFeatures {
  if (!tier) return PLANS["care-plus"];
  const key = TIER_MAP[tier.toLowerCase()] ?? "care-plus";
  return PLANS[key] ?? PLANS["care-plus"];
}
