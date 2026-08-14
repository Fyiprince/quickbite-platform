export function inr(paise: number): string {
  const rupees = paise / 100;
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: rupees % 1 === 0 ? 0 : 2,
  }).format(rupees);
}

export function timeAgo(ts: number): string {
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "yesterday";
  return `${days}d ago`;
}

export function formatTime(ts: number): string {
  return new Date(ts).toLocaleTimeString("en-IN", {
    hour: "numeric",
    minute: "2-digit",
  });
}

export function formatDateTime(ts: number): string {
  return new Date(ts).toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  });
}

export type OrderStatus =
  | "PENDING"
  | "ACCEPTED"
  | "PREPARING"
  | "READY"
  | "ASSIGNED"
  | "PICKED_UP"
  | "OUT_FOR_DELIVERY"
  | "DELIVERED"
  | "CANCELLED";

/** The happy-path steps shown in the customer tracking stepper. */
export const STEPS: OrderStatus[] = [
  "PENDING",
  "ACCEPTED",
  "PREPARING",
  "READY",
  "ASSIGNED",
  "PICKED_UP",
  "OUT_FOR_DELIVERY",
  "DELIVERED",
];

export const STATUS_META: Record<OrderStatus, { label: string; dot: string; chip: string }> = {
  PENDING: {
    label: "Pending",
    dot: "bg-amber-500",
    chip: "bg-amber-50 text-amber-700 ring-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:ring-amber-500/30",
  },
  ACCEPTED: {
    label: "Accepted",
    dot: "bg-sky-500",
    chip: "bg-sky-50 text-sky-700 ring-sky-200 dark:bg-sky-500/10 dark:text-sky-400 dark:ring-sky-500/30",
  },
  PREPARING: {
    label: "Preparing",
    dot: "bg-violet-500",
    chip: "bg-violet-50 text-violet-700 ring-violet-200 dark:bg-violet-500/10 dark:text-violet-400 dark:ring-violet-500/30",
  },
  READY: {
    label: "Ready",
    dot: "bg-teal-500",
    chip: "bg-teal-50 text-teal-700 ring-teal-200 dark:bg-teal-500/10 dark:text-teal-400 dark:ring-teal-500/30",
  },
  ASSIGNED: {
    label: "Delivery assigned",
    dot: "bg-indigo-500",
    chip: "bg-indigo-50 text-indigo-700 ring-indigo-200 dark:bg-indigo-500/10 dark:text-indigo-400 dark:ring-indigo-500/30",
  },
  PICKED_UP: {
    label: "Picked up",
    dot: "bg-blue-600",
    chip: "bg-blue-50 text-blue-700 ring-blue-200 dark:bg-blue-500/10 dark:text-blue-400 dark:ring-blue-500/30",
  },
  OUT_FOR_DELIVERY: {
    label: "Out for delivery",
    dot: "bg-primary",
    chip: "bg-primary/10 text-primary ring-primary/30 dark:bg-primary/15 dark:text-primary dark:ring-primary/30",
  },
  DELIVERED: {
    label: "Delivered",
    dot: "bg-green-600",
    chip: "bg-green-50 text-green-700 ring-green-200 dark:bg-green-500/10 dark:text-green-400 dark:ring-green-500/30",
  },
  CANCELLED: {
    label: "Cancelled",
    dot: "bg-destructive",
    chip: "bg-destructive/10 text-destructive ring-destructive/30",
  },
};

export function statusChip(status: OrderStatus): string {
  return `inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${STATUS_META[status].chip}`;
}

export function shortId(id: string): string {
  return `#${id.slice(-6).toUpperCase()}`;
}
