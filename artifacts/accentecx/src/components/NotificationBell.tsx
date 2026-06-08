import { useState, useEffect, useRef } from "react";
import { Bell, X, Check, CheckCheck, Trash2, ExternalLink } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";

interface Notification {
  id: number;
  type: string;
  title: string;
  message: string;
  icon?: string | null;
  actionUrl?: string | null;
  actionLabel?: string | null;
  isRead: boolean;
  readAt?: string | null;
  priority: string;
  createdAt: string;
}

const API_BASE = "/api";

const TYPE_COLORS: Record<string, string> = {
  alert: "text-red-500 bg-red-50",
  appointment: "text-blue-500 bg-blue-50",
  screening: "text-purple-500 bg-purple-50",
  report: "text-green-500 bg-green-50",
  therapy: "text-teal-500 bg-teal-50",
  system: "text-gray-500 bg-gray-50",
  general: "text-primary bg-primary/10",
};

const TYPE_ICONS: Record<string, string> = {
  alert: "🚨",
  appointment: "📅",
  screening: "📋",
  report: "📊",
  therapy: "💙",
  system: "⚙️",
  general: "🔔",
};

export function NotificationBell() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  const fetchNotifications = async () => {
    if (!user?.id) return;
    try {
      const res = await fetch(`${API_BASE}/notifications?limit=20`, {
        headers: { Authorization: `Bearer ${user.id}` },
      });
      if (!res.ok) return;
      const data = await res.json() as { notifications: Notification[]; unreadCount: number };
      setNotifications(data.notifications);
      setUnreadCount(data.unreadCount);
    } catch {}
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [user?.id]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    if (open) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  const markRead = async (id: number) => {
    if (!user?.id) return;
    try {
      await fetch(`${API_BASE}/notifications/${id}/read`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${user.id}` },
      });
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch {}
  };

  const markAllRead = async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      await fetch(`${API_BASE}/notifications/read-all`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${user.id}` },
      });
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch {} finally {
      setLoading(false);
    }
  };

  const deleteNotification = async (id: number) => {
    if (!user?.id) return;
    try {
      await fetch(`${API_BASE}/notifications/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${user.id}` },
      });
      setNotifications(prev => prev.filter(n => n.id !== id));
    } catch {}
  };

  const formatTime = (iso: string) => {
    const diff = Date.now() - new Date(iso).getTime();
    const m = Math.floor(diff / 60000);
    if (m < 1) return "just now";
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h ago`;
    return `${Math.floor(h / 24)}d ago`;
  };

  return (
    <div className="relative" ref={panelRef}>
      <button
        onClick={() => { setOpen(!open); if (!open) fetchNotifications(); }}
        className="relative h-8 w-8 flex items-center justify-center rounded-full hover:bg-sidebar-accent/40 transition-colors"
        aria-label="Notifications"
      >
        <Bell className="h-4 w-4 text-sidebar-foreground/70" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] text-white font-bold">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.96 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-10 w-80 bg-background border rounded-2xl shadow-xl z-50 overflow-hidden"
          >
            <div className="flex items-center justify-between px-4 py-3 border-b bg-muted/30">
              <div className="flex items-center gap-2">
                <Bell className="h-4 w-4 text-primary" />
                <span className="font-semibold text-sm">Notifications</span>
                {unreadCount > 0 && (
                  <Badge className="bg-red-500 text-white text-xs px-1.5 py-0 border-0">{unreadCount}</Badge>
                )}
              </div>
              <div className="flex items-center gap-1">
                {unreadCount > 0 && (
                  <button onClick={markAllRead} disabled={loading} className="text-xs text-primary hover:underline px-1">
                    <CheckCheck className="h-3.5 w-3.5" />
                  </button>
                )}
                <button onClick={() => setOpen(false)} className="text-muted-foreground hover:text-foreground">
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="max-h-96 overflow-auto divide-y">
              {notifications.length === 0 ? (
                <div className="flex flex-col items-center gap-2 py-10 text-center">
                  <span className="text-3xl">🔔</span>
                  <p className="text-sm text-muted-foreground">No notifications yet</p>
                </div>
              ) : (
                notifications.map(n => (
                  <div
                    key={n.id}
                    className={cn(
                      "flex gap-3 px-4 py-3 hover:bg-muted/30 transition-colors group",
                      !n.isRead && "bg-primary/5"
                    )}
                  >
                    <div className={cn("h-8 w-8 rounded-full flex items-center justify-center text-sm shrink-0", TYPE_COLORS[n.type] ?? TYPE_COLORS.general)}>
                      {n.icon ?? TYPE_ICONS[n.type] ?? "🔔"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-1">
                        <p className={cn("text-xs font-semibold leading-snug", n.priority === "high" && "text-red-600")}>
                          {n.title}
                        </p>
                        <span className="text-[10px] text-muted-foreground shrink-0">{formatTime(n.createdAt)}</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5 leading-snug">{n.message}</p>
                      {n.actionUrl && (
                        <a href={n.actionUrl} className="inline-flex items-center gap-1 text-[10px] text-primary font-medium mt-1 hover:underline">
                          {n.actionLabel ?? "View"} <ExternalLink className="h-2.5 w-2.5" />
                        </a>
                      )}
                    </div>
                    <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      {!n.isRead && (
                        <button onClick={() => markRead(n.id)} className="text-primary hover:text-primary/70">
                          <Check className="h-3.5 w-3.5" />
                        </button>
                      )}
                      <button onClick={() => deleteNotification(n.id)} className="text-muted-foreground hover:text-destructive">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
