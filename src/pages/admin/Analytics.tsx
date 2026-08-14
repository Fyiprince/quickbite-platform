import { api } from "@/convex/_generated/api";
import { useQuery } from "convex/react";
import { motion } from "framer-motion";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { CountUp } from "@/components/CountUp";
import { Skeleton } from "@/components/ui/skeleton";
import { inr } from "@/lib/format";

const STATUS_COLORS: Record<string, string> = {
  PENDING: "#f59e0b",
  ACCEPTED: "#0ea5e9",
  PREPARING: "#8b5cf6",
  READY: "#14b8a6",
  ASSIGNED: "#6366f1",
  PICKED_UP: "#2563eb",
  OUT_FOR_DELIVERY: "#16a34a",
  DELIVERED: "#22c55e",
  CANCELLED: "#ef4444",
};

export default function AdminAnalytics() {
  const data = useQuery(api.admin.analytics);

  if (!data) {
    return (
      <div className="flex flex-col gap-5">
        <Skeleton className="h-40 rounded-2xl" />
        <Skeleton className="h-72 rounded-2xl" />
      </div>
    );
  }

  const statusData = Object.entries(data.statusCounts).map(([name, value]) => ({
    name: name.replace(/_/g, " "),
    value,
    color: STATUS_COLORS[name] ?? "#888",
  }));

  return (
    <div className="flex flex-col gap-6">
      {/* KPI row */}
      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { label: "Gross revenue (all time)", value: data.grossRevenuePaise, prefix: "₹" },
          { label: "Total orders", value: data.totalOrders },
          { label: "Avg order value", value: data.totalOrders ? Math.round(data.grossRevenuePaise / data.totalOrders) : 0, prefix: "₹" },
        ].map((k) => (
          <div key={k.label} className="rounded-2xl border bg-card p-5">
            <p className="text-sm text-muted-foreground">{k.label}</p>
            <p className="font-display mt-1.5 text-2xl font-extrabold tabular-nums">
              <CountUp value={k.value} prefix={k.prefix ?? ""} />
            </p>
          </div>
        ))}
      </div>

      {/* Revenue + orders over time */}
      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl border bg-card p-5"
      >
        <h3 className="font-semibold">Orders & revenue — last 14 days</h3>
        <p className="mb-4 text-xs text-muted-foreground">Computed live from the order ledger.</p>
        <ResponsiveContainer width="100%" height={280}>
          <AreaChart data={data.series} margin={{ left: 0, right: 8, top: 8 }}>
            <defs>
              <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#f97316" stopOpacity={0.35} />
                <stop offset="100%" stopColor="#f97316" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
            <XAxis dataKey="label" tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} />
            <YAxis
              yAxisId="rev"
              tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v: number) => `₹${v >= 1000 ? `${Math.round(v / 1000)}k` : v}`}
            />
            <YAxis yAxisId="orders" orientation="right" hide />
            <Tooltip
              formatter={(value: number, name: string) =>
                name === "revenuePaise" ? [inr(value), "Revenue"] : [value, "Orders"]
              }
              contentStyle={{ borderRadius: 12, border: "1px solid var(--border)", background: "var(--popover)", color: "var(--popover-foreground)" }}
            />
            <Area
              yAxisId="rev"
              type="monotone"
              dataKey="revenuePaise"
              stroke="#f97316"
              strokeWidth={2.5}
              fill="url(#rev)"
            />
            <Area
              yAxisId="orders"
              type="monotone"
              dataKey="orders"
              stroke="#16a34a"
              strokeWidth={2}
              fill="transparent"
              dot={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </motion.section>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Top restaurants */}
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08 }}
          className="rounded-2xl border bg-card p-5"
        >
          <h3 className="font-semibold">Top restaurants by revenue</h3>
          <p className="mb-4 text-xs text-muted-foreground">Paid, non-cancelled orders only.</p>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={data.topRestaurants} layout="vertical" margin={{ left: 8, right: 24 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
              <XAxis type="number" hide tickFormatter={(v: number) => `₹${v >= 1000 ? `${Math.round(v / 1000)}k` : v}`} />
              <YAxis
                type="category"
                dataKey="name"
                width={110}
                tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                formatter={(value: number) => [inr(value), "Revenue"]}
                contentStyle={{ borderRadius: 12, border: "1px solid var(--border)", background: "var(--popover)", color: "var(--popover-foreground)" }}
              />
              <Bar dataKey="revenuePaise" radius={[0, 8, 8, 0]} fill="#16a34a" barSize={20} />
            </BarChart>
          </ResponsiveContainer>
        </motion.section>

        {/* Status distribution */}
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.12 }}
          className="rounded-2xl border bg-card p-5"
        >
          <h3 className="font-semibold">Order status distribution</h3>
          <p className="mb-4 text-xs text-muted-foreground">Current snapshot of all orders.</p>
          {statusData.length === 0 ? (
            <div className="flex h-64 items-center justify-center text-sm text-muted-foreground">No orders yet</div>
          ) : (
            <div className="flex flex-col items-center gap-4 sm:flex-row">
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={statusData} dataKey="value" nameKey="name" innerRadius={55} outerRadius={85} paddingAngle={3} strokeWidth={0}>
                    {statusData.map((s) => (
                      <Cell key={s.name} fill={s.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: number, name: string) => [value, name]}
                    contentStyle={{ borderRadius: 12, border: "1px solid var(--border)", background: "var(--popover)", color: "var(--popover-foreground)" }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <ul className="flex w-full flex-col gap-1.5 sm:w-40">
                {statusData.map((s) => (
                  <li key={s.name} className="flex items-center justify-between gap-2 text-xs">
                    <span className="flex items-center gap-2">
                      <span className="size-2.5 rounded-full" style={{ background: s.color }} />
                      {s.name}
                    </span>
                    <span className="font-semibold tabular-nums">{s.value}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </motion.section>
      </div>
    </div>
  );
}
