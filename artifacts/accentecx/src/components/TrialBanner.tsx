import { useState } from "react";
import { X, Clock, AlertTriangle, CreditCard, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface TrialBannerProps {
  subscriptionStatus?: string;
  trialExpiresAt?: string | null;
  inTrial?: boolean;
  trialDaysLeft?: number;
  onUpgrade?: () => void;
}

export function TrialBanner({ subscriptionStatus, trialExpiresAt, inTrial, trialDaysLeft, onUpgrade }: TrialBannerProps) {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  if (subscriptionStatus === "suspended") {
    return (
      <div className="w-full bg-red-600 text-white px-4 py-2.5 flex items-center justify-between gap-4 text-sm">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <span className="font-medium">Account Suspended.</span>
          <span className="opacity-90">Contact your administrator to reactivate your account.</span>
        </div>
        <button onClick={() => setDismissed(true)} className="opacity-70 hover:opacity-100 shrink-0">
          <X className="h-4 w-4" />
        </button>
      </div>
    );
  }

  if (subscriptionStatus === "pending_verification") {
    return (
      <div className="w-full bg-amber-500 text-white px-4 py-2.5 flex items-center justify-between gap-4 text-sm">
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 shrink-0" />
          <span className="font-medium">Payment Under Review.</span>
          <span className="opacity-90">Your plan will be activated within 24 hours after admin verification.</span>
        </div>
        <button onClick={() => setDismissed(true)} className="opacity-70 hover:opacity-100 shrink-0">
          <X className="h-4 w-4" />
        </button>
      </div>
    );
  }

  if (inTrial && trialDaysLeft !== undefined && trialDaysLeft > 0) {
    const urgency = trialDaysLeft <= 3 ? "bg-red-600" : trialDaysLeft <= 7 ? "bg-amber-500" : "bg-[#0038A8]";
    return (
      <div className={`w-full ${urgency} text-white px-4 py-2.5 flex items-center justify-between gap-4 text-sm`}>
        <div className="flex items-center gap-3">
          <Clock className="h-4 w-4 shrink-0" />
          <span>
            <span className="font-semibold">14-Day Free Trial</span>
            <span className="opacity-90 mx-1">·</span>
            <span className="font-bold">{trialDaysLeft} day{trialDaysLeft !== 1 ? "s" : ""} remaining</span>
            <span className="opacity-90 ml-2 hidden sm:inline">
              {trialDaysLeft <= 3 ? "⚠️ Trial expiring soon! Upgrade to keep access." : "Explore all features. Upgrade anytime to continue."}
            </span>
          </span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {onUpgrade && (
            <Button
              size="sm"
              variant="secondary"
              className="h-7 text-xs bg-white text-[#0038A8] hover:bg-white/90 font-semibold"
              onClick={onUpgrade}
            >
              <CreditCard className="h-3 w-3 mr-1" />
              Upgrade Now
            </Button>
          )}
          <button onClick={() => setDismissed(true)} className="opacity-70 hover:opacity-100">
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    );
  }

  if (trialExpiresAt && !inTrial && (subscriptionStatus === "active" || !subscriptionStatus)) {
    const expiredDate = new Date(trialExpiresAt);
    const wasExpired = expiredDate < new Date();
    if (!wasExpired) return null;

    return (
      <div className="w-full bg-gray-700 text-white px-4 py-2.5 flex items-center justify-between gap-4 text-sm">
        <div className="flex items-center gap-2">
          <CheckCircle className="h-4 w-4 shrink-0 opacity-70" />
          <span className="opacity-90">Your 14-day trial has ended.</span>
          <span className="font-medium">You are now on the Free plan.</span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {onUpgrade && (
            <Button
              size="sm"
              variant="secondary"
              className="h-7 text-xs bg-white text-gray-900 hover:bg-white/90 font-semibold"
              onClick={onUpgrade}
            >
              Upgrade Plan
            </Button>
          )}
          <button onClick={() => setDismissed(true)} className="opacity-70 hover:opacity-100">
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    );
  }

  return null;
}
