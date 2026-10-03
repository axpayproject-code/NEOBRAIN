import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { workflowApi } from "./api";
export function WorkflowNotificationBell() {
  const [open, setOpen] = useState(false);
  const me = useQuery({
    queryKey: ["workflow", "/me"],
    queryFn: () => workflowApi("/me"),
  });
  const notifications = useQuery<any[]>({
    queryKey: ["workflow", "/notifications"],
    queryFn: () => workflowApi("/notifications"),
    enabled: Boolean(me.data?.onboarding?.emailVerifiedAt),
  });
  return (
    <div className="relative">
      <Button
        size="icon"
        variant="ghost"
        aria-label="Notifications"
        onClick={() => setOpen(!open)}
      >
        <Bell className="h-5 w-5" />
      </Button>
      {open && (
        <div className="absolute right-0 top-12 z-50 w-72 rounded-xl border bg-background shadow-lg p-4 max-h-80 overflow-auto">
          <p className="font-semibold mb-3">Notifications</p>
          {notifications.isError ? (
            <p role="alert">Could not load notifications.</p>
          ) : notifications.data?.length ? (
            notifications.data.map((n) => (
              <p key={n.id} className="text-sm border-t py-3">
                {n.message}
              </p>
            ))
          ) : (
            <p className="text-sm text-muted-foreground">
              No notifications yet.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
