import { motion } from "framer-motion";
import { Check, ChefHat, CookingPot, Bike, MapPin, Package, PackageCheck, PartyPopper, ShoppingBag, X } from "lucide-react";
import { STEPS, STATUS_META, type OrderStatus } from "@/lib/format";
import { cn } from "@/lib/utils";

const STEP_ICONS: Record<string, typeof Check> = {
  PENDING: ShoppingBag,
  ACCEPTED: Check,
  PREPARING: ChefHat,
  READY: CookingPot,
  ASSIGNED: Bike,
  PICKED_UP: Package,
  OUT_FOR_DELIVERY: MapPin,
  DELIVERED: PartyPopper,
};

export function StatusStepper({
  status,
  statusHistory,
}: {
  status: OrderStatus;
  statusHistory: { status: OrderStatus; at: number }[];
}) {
  if (status === "CANCELLED") {
    return (
      <div className="flex items-start gap-3 rounded-xl border border-destructive/30 bg-destructive/5 p-4">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-destructive text-destructive-foreground">
          <X className="size-4" />
        </div>
        <div>
          <p className="font-semibold">Order cancelled</p>
          <p className="text-sm text-muted-foreground">
            {statusHistory.find((h) => h.status === "CANCELLED")?.at
              ? new Date(
                  statusHistory.find((h) => h.status === "CANCELLED")!.at,
                ).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" })
              : "This order was cancelled"}
          </p>
        </div>
      </div>
    );
  }

  const currentIndex = STEPS.indexOf(status);
  const times = Object.fromEntries(statusHistory.map((h) => [h.status, h.at]));

  return (
    <ol className="relative">
      {STEPS.map((step, i) => {
        const done = i < currentIndex;
        const current = i === currentIndex;
        const reached = i <= currentIndex;
        const Icon = STEP_ICONS[step];
        const at = times[step];

        return (
          <li key={step} className="relative flex gap-3 pb-6 last:pb-0">
            {/* rail */}
            {i < STEPS.length - 1 && (
              <div className="absolute left-[15px] top-8 h-[calc(100%-20px)] w-0.5 overflow-hidden rounded bg-muted">
                <motion.div
                  className="w-full bg-primary"
                  initial={false}
                  animate={{ height: done ? "100%" : "0%" }}
                  transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                />
              </div>
            )}

            {/* node */}
            <div className="relative z-10 mt-0.5">
              {done || reached ? (
                <motion.div
                  initial={{ scale: 0.6, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: "spring", stiffness: 400, damping: 22 }}
                  className={cn(
                    "flex size-8 items-center justify-center rounded-full",
                    done
                      ? "bg-primary text-primary-foreground"
                      : "bg-primary text-primary-foreground shadow-[0_0_0_5px] shadow-primary/20",
                  )}
                >
                  <Icon className="size-4" />
                </motion.div>
              ) : (
                <div className="flex size-8 items-center justify-center rounded-full border-2 border-muted bg-card">
                  <Icon className="size-4 text-muted-foreground/50" />
                </div>
              )}
              {current && (
                <motion.span
                  layoutId="pulse-ring"
                  className="absolute inset-0 rounded-full ring-2 ring-primary/40"
                  animate={{ scale: [1, 1.35], opacity: [0.8, 0] }}
                  transition={{ duration: 1.4, repeat: Infinity, ease: "easeOut" }}
                />
              )}
            </div>

            {/* label */}
            <div className="flex-1 pt-1">
              <div className="flex items-center justify-between gap-2">
                <p
                  className={cn(
                    "text-sm font-medium",
                    reached ? "text-foreground" : "text-muted-foreground",
                  )}
                >
                  {STATUS_META[step].label}
                </p>
                {at && (
                  <span className="text-xs tabular-nums text-muted-foreground">
                    {new Date(at).toLocaleTimeString("en-IN", {
                      hour: "numeric",
                      minute: "2-digit",
                    })}
                  </span>
                )}
              </div>
              {!reached && (
                <p className="text-xs text-muted-foreground/70">Waiting…</p>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
