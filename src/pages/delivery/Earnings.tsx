import { api } from "@/convex/_generated/api";
import { useQuery } from "convex/react";
import { motion } from "framer-motion";
import { Bike, CalendarDays, IndianRupee, ReceiptText, TrendingUp } from "lucide-react";
import { CountUp } from "@/components/CountUp";
import { Skeleton } from "@/components/ui/skeleton";
import { inr } from "@/lib/format";

export default function DeliveryEarnings() {
  const earnings = useQuery(api.delivery.earnings);

  const cards = [
    {
      label: "Today's earnings",
      value: earnings?.todayEarningsPaise ?? 0,
      icon: IndianRupee,
      tone: "bg-primary/10 text-primary",
      sub: `${earnings?.todayDeliveries ?? 0} deliveries today`,
    },
    {
      label: "This week",
      value: earnings?.weekEarningsPaise ?? 0,
      icon: CalendarDays,
      tone: "bg-violet-500/10 text-violet-600 dark:text-violet-400",
      sub: "Rolling 7-day total",
    },
    {
      label: "All time",
      value: earnings?.totalEarningsPaise ?? 0,
      icon: TrendingUp,
      tone: "bg-green-600/10 text-green-600",
      sub: `${earnings?.totalDeliveries ?? 0} completed deliveries`,
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-4 sm:grid-cols-3">
        {cards.map((c, i) => (
          <motion.div
            key={c.label}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="rounded-2xl border bg-card p-5"
          >
            <div className={`flex size-9 items-center justify-center rounded-xl ${c.tone}`}>
              <c.icon className="size-4" />
            </div>
            <p className="font-display mt-3 text-2xl font-extrabold tabular-nums">
              {earnings ? <CountUp value={c.value} prefix="₹" /> : <Skeleton className="h-7 w-16" />}
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground">{c.label}</p>
            <p className="mt-1 text-[11px] text-muted-foreground/70">{c.sub}</p>
          </motion.div>
        ))}
      </div>

      {/* Delivery fee explainer */}
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="flex items-start gap-4 rounded-2xl border bg-card p-5"
      >
        <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Bike className="size-5" />
        </div>
        <div className="flex-1">
          <p className="font-semibold">How you earn</p>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">
            You keep the full delivery fee on every order you complete — typically{" "}
            {earnings && earnings.totalDeliveries > 0 ? inr(earnings.totalEarningsPaise / earnings.totalDeliveries) : inr(2900)}{" "}
            per delivery. Earnings are credited the moment an order is marked delivered.
          </p>
        </div>
        <ReceiptText className="hidden size-5 text-muted-foreground/40 sm:block" />
      </motion.div>
    </div>
  );
}
