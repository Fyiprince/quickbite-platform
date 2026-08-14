import { api } from "@/convex/_generated/api";
import { useQuery } from "convex/react";
import { motion } from "framer-motion";
import { ArrowRight, Bike, ReceiptText, Store } from "lucide-react";
import { useNavigate } from "react-router";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDateTime, inr, shortId, statusChip } from "@/lib/format";

export default function Orders() {
  const orders = useQuery(api.customers.myOrders);
  const navigate = useNavigate();

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <div>
        <h1 className="font-display text-2xl font-extrabold tracking-tight">Your orders</h1>
        <p className="mt-0.5 text-sm text-muted-foreground">
          Live updates stream in automatically — no refresh needed.
        </p>
      </div>

      {!orders ? (
        <div className="flex flex-col gap-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-28 animate-pulse rounded-2xl border bg-muted" />
          ))}
        </div>
      ) : orders.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-3xl border border-dashed py-16 text-center">
          <div className="flex size-14 items-center justify-center rounded-2xl bg-muted">
            <ReceiptText className="size-7 text-muted-foreground" />
          </div>
          <p className="font-display text-lg font-bold">No orders yet</p>
          <p className="max-w-xs text-sm text-muted-foreground">
            Your cravings are waiting. Order something delicious!
          </p>
          <Button className="mt-2" onClick={() => navigate("/customer/home")}>
            Browse restaurants <ArrowRight className="size-4" />
          </Button>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {orders.map((order, i) => (
            <motion.button
              key={order._id}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(i * 0.04, 0.3), duration: 0.35 }}
              whileHover={{ y: -2 }}
              onClick={() => navigate(`/customer/orders/${order._id}`)}
              className="group rounded-2xl border bg-card p-4 text-left shadow-sm transition-shadow hover:shadow-lg"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Store className="size-5" />
                  </div>
                  <div>
                    <p className="font-semibold">{order.restaurantName}</p>
                    <p className="text-xs text-muted-foreground">
                      {shortId(order._id)} · {formatDateTime(order.createdAt)}
                    </p>
                  </div>
                </div>
                <span className={statusChip(order.orderStatus)}>
                  {order.orderStatus.replace(/_/g, " ")}
                </span>
              </div>
              <div className="mt-3 flex items-center justify-between border-t pt-3 text-sm">
                <span className="text-muted-foreground">
                  {order.items.length} item{order.items.length > 1 ? "s" : ""}
                </span>
                <span className="flex items-center gap-3 font-semibold tabular-nums">
                  {inr(order.totalPaise)}
                  <Bike className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                </span>
              </div>
            </motion.button>
          ))}
        </div>
      )}
    </div>
  );
}
