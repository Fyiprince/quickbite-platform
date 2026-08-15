import { api } from "@/convex/_generated/api";
import { useQuery } from "convex/react";
import { motion } from "framer-motion";
import { Bike, Clock3, MapPin, ReceiptText, Store } from "lucide-react";
import { CountUp } from "@/components/CountUp";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDateTime, inr, shortId } from "@/lib/format";

export default function DeliveryHistory() {
  const orders = useQuery(api.delivery.myDeliveredOrders);

  const totalEarned = (orders ?? []).reduce((s, o) => s + o.deliveryFeePaise, 0);
  const totalOrders = (orders ?? []).length;

  return (
    <div className="flex flex-col gap-6">
      {/* Summary */}
      <div className="grid gap-4 sm:grid-cols-2">
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border bg-card p-5"
        >
          <div className="flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <ReceiptText className="size-4" />
          </div>
          <p className="font-display mt-3 text-2xl font-extrabold tabular-nums">
            {orders ? <CountUp value={totalOrders} /> : <Skeleton className="h-7 w-14" />}
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">Deliveries completed</p>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="rounded-2xl border bg-card p-5"
        >
          <div className="flex size-9 items-center justify-center rounded-xl bg-green-600/10 text-green-600">
            <Bike className="size-4" />
          </div>
          <p className="font-display mt-3 text-2xl font-extrabold tabular-nums">
            {orders ? <CountUp value={totalEarned} prefix="₹" /> : <Skeleton className="h-7 w-16" />}
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">Total earned</p>
        </motion.div>
      </div>

      {/* Orders */}
      {!orders ? (
        <div className="flex flex-col gap-3">
          <Skeleton className="h-20 rounded-2xl" />
          <Skeleton className="h-20 rounded-2xl" />
        </div>
      ) : orders.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed py-16 text-center">
          <Bike className="size-8 text-muted-foreground/50" />
          <p className="text-sm font-medium">No completed deliveries yet</p>
          <p className="text-xs text-muted-foreground">
            Accept a request and ride it to the door — your history shows up here.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {orders.map((o, i) => (
            <motion.div
              key={o._id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(i * 0.04, 0.3) }}
              className="flex items-center gap-4 rounded-2xl border bg-card p-4"
            >
              <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-green-600/10 text-green-600">
                <Bike className="size-5" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-semibold">{o.restaurantName}</p>
                  <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                    {shortId(o._id)}
                  </span>
                </div>
                <p className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Store className="size-3" /> {o.restaurantName}
                  </span>
                  <span className="flex items-center gap-1">
                    <MapPin className="size-3" /> {o.addressLabel}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock3 className="size-3" /> {formatDateTime(o.deliveredAt ?? o.createdAt)}
                  </span>
                </p>
              </div>
              <div className="shrink-0 text-right">
                <p className="font-display text-sm font-bold text-green-600 dark:text-green-400">
                  +{inr(o.deliveryFeePaise)}
                </p>
                <p className="text-[10px] text-muted-foreground">{inr(o.totalPaise)} order</p>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
