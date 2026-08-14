import { api } from "@/convex/_generated/api";
import { useQuery } from "convex/react";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Bike,
  ClipboardList,
  IndianRupee,
  ReceiptText,
  Store,
  Users,
  UtensilsCrossed,
} from "lucide-react";
import { useNavigate } from "react-router";
import { CountUp } from "@/components/CountUp";
import { Skeleton } from "@/components/ui/skeleton";
import { inr, shortId, statusChip, timeAgo } from "@/lib/format";

export default function AdminDashboard() {
  const stats = useQuery(api.admin.dashboardStats);
  const orders = useQuery(api.admin.listOrders);
  const navigate = useNavigate();

  const pending = (orders ?? []).filter((o) => o.orderStatus === "PENDING").slice(0, 5);

  const cards = [
    { label: "Today's orders", icon: ReceiptText, value: stats?.todayOrders ?? 0, suffix: "", to: "/admin/orders", accent: "bg-accent/10 text-accent" },
    { label: "Today's revenue", icon: IndianRupee, value: stats?.todayRevenuePaise ?? 0, prefix: "₹", to: "/admin/analytics", accent: "bg-green-600/10 text-green-600 dark:text-green-400" },
    { label: "Active deliveries", icon: Bike, value: stats?.activeDeliveries ?? 0, suffix: "", to: "/admin/orders", accent: "bg-blue-500/10 text-blue-500" },
    { label: "Total customers", icon: Users, value: stats?.totalCustomers ?? 0, suffix: "", to: "/admin/customers", accent: "bg-violet-500/10 text-violet-500" },
    { label: "Active partners", icon: UtensilsCrossed, value: stats?.activeDeliveryPartners ?? 0, suffix: "", to: "/admin/delivery-partners", accent: "bg-amber-500/10 text-amber-500" },
    { label: "Active restaurants", icon: Store, value: stats?.activeRestaurants ?? 0, suffix: "", to: "/admin/restaurants", accent: "bg-primary/10 text-primary" },
  ];

  return (
    <div className="flex flex-col gap-8">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {cards.map((c, i) => (
          <motion.button
            key={c.label}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05, duration: 0.4 }}
            whileHover={{ y: -3 }}
            onClick={() => navigate(c.to)}
            className="group rounded-2xl border bg-card p-5 text-left shadow-sm transition-shadow hover:shadow-lg"
          >
            <div className="flex items-center justify-between">
              <div className={`flex size-10 items-center justify-center rounded-xl ${c.accent}`}>
                <c.icon className="size-5" />
              </div>
              <ArrowRight className="size-4 text-muted-foreground/40 transition-all group-hover:translate-x-0.5 group-hover:text-foreground" />
            </div>
            <p className="font-display mt-4 text-3xl font-extrabold tracking-tight tabular-nums">
              {stats ? (
                <CountUp
                  value={c.value}
                  prefix={c.prefix ?? ""}
                  suffix={c.suffix ?? ""}
                />
              ) : (
                <Skeleton className="h-8 w-20" />
              )}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">{c.label}</p>
          </motion.button>
        ))}
      </div>

      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-lg font-bold tracking-tight">Pending orders</h2>
          {stats && stats.pendingOrders > 0 && (
            <span className="rounded-full bg-accent/15 px-2.5 py-0.5 text-xs font-bold text-accent">
              {stats.pendingOrders} need attention
            </span>
          )}
          <button onClick={() => navigate("/admin/orders")} className="flex items-center gap-1 text-sm font-medium text-primary hover:underline">
            View all <ArrowRight className="size-3.5" />
          </button>
        </div>

        {!orders ? (
          <div className="space-y-3">
            <Skeleton className="h-20 rounded-2xl" />
            <Skeleton className="h-20 rounded-2xl" />
          </div>
        ) : pending.length === 0 ? (
          <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed py-10 text-center">
            <ClipboardList className="size-8 text-muted-foreground/50" />
            <p className="text-sm font-medium">All caught up</p>
            <p className="text-xs text-muted-foreground">New orders will appear here in real time.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {pending.map((o, i) => (
              <motion.button
                key={o._id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                onClick={() => navigate("/admin/orders")}
                className="flex items-center gap-4 rounded-2xl border bg-card p-4 text-left shadow-sm transition-shadow hover:shadow-md"
              >
                <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <ReceiptText className="size-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">
                    {shortId(o._id)} · {o.restaurantName}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {o.customerName} · {inr(o.totalPaise)} · {timeAgo(o.createdAt)}
                  </p>
                </div>
                <span className={statusChip(o.orderStatus)}>{o.orderStatus}</span>
              </motion.button>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
