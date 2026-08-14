import { api } from "@/convex/_generated/api";
import { useMutation, useQuery } from "convex/react";
import { motion } from "framer-motion";
import { Bell } from "lucide-react";
import { useEffect, useRef } from "react";
import { useNavigate } from "react-router";
import { useAuth } from "@/hooks/use-auth";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { timeAgo } from "@/lib/format";

export function NotificationBell() {
  const unread = useQuery(api.notifications.unreadCount) ?? 0;
  const notifications = useQuery(api.notifications.listMyNotifications);
  const markAllRead = useMutation(api.notifications.markAllRead);
  const { user } = useAuth();
  const navigate = useNavigate();
  const prevUnread = useRef(unread);

  useEffect(() => {
    prevUnread.current = unread;
  }, [unread]);

  const newArrived = unread > prevUnread.current;

  return (
    <DropdownMenu
      onOpenChange={(open) => {
        if (open && unread > 0) markAllRead().catch(() => undefined);
      }}
    >
      <DropdownMenuTrigger asChild>
        <motion.div
          key={newArrived ? `shake-${unread}` : "idle"}
          initial={newArrived ? { rotate: 0 } : false}
          animate={newArrived ? { rotate: [0, -14, 12, -8, 6, 0] } : {}}
          transition={{ duration: 0.45, ease: "easeInOut" }}
        >
          <Button variant="ghost" size="icon" className="relative" aria-label="Notifications">
            <Bell className="size-5" />
            {unread > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex size-4 items-center justify-center rounded-full bg-accent text-[10px] font-bold text-accent-foreground ring-2 ring-background">
                {unread > 9 ? "9+" : unread}
              </span>
            )}
          </Button>
        </motion.div>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>Notifications</span>
          {unread > 0 && (
            <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary">
              {unread} new
            </span>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <div className="max-h-80 overflow-y-auto">
          {!notifications || notifications.length === 0 ? (
            <div className="px-4 py-10 text-center text-sm text-muted-foreground">
              You&apos;re all caught up ✨
            </div>
          ) : (
            notifications.map((n) => (
              <button
                key={n._id}
                onClick={() => {
                  if (!n.orderId) return;
                  if (user?.role === "ADMIN") navigate("/admin/orders");
                  else if (user?.role === "DELIVERY") navigate("/delivery/active-order");
                  else navigate(`/customer/orders/${n.orderId}`);
                }}
                className={`flex w-full flex-col gap-0.5 px-4 py-3 text-left transition-colors hover:bg-muted ${
                  !n.isRead ? "bg-primary/[0.04]" : ""
                }`}
              >
                <div className="flex items-start gap-2">
                  {!n.isRead && <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-primary" />}
                  <span className="text-sm leading-snug text-foreground">{n.message}</span>
                </div>
                <span className="pl-3.5 text-xs text-muted-foreground">
                  {timeAgo(n.createdAt)}
                </span>
              </button>
            ))
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
