import { api } from "@/convex/_generated/api";
import { useMutation, useQuery } from "convex/react";
import { motion } from "framer-motion";
import { Bike, Check, Clock3, IndianRupee, Loader2, MapPin, ReceiptText, Store, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router";
import { CountUp } from "@/components/CountUp";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { inr, shortId } from "@/lib/format";
import { parseError } from "@/lib/parse";
import { toast } from "sonner";

const REQUEST_WINDOW_S = 30;

export default function DeliveryDashboard() {
  const earnings = useQuery(api.delivery.earnings);
  const requests = useQuery(api.delivery.myRequests);
  const activeOrder = useQuery(api.delivery.myActiveOrder);
  const { isAvailable } = useQuery(api.users.currentUser) ?? {};
  const setAvailability = useMutation(api.provisioning.setAvailability);
  const acceptRequest = useMutation(api.delivery.acceptRequest);
  const rejectRequest = useMutation(api.delivery.rejectRequest);
  const navigate = useNavigate();

  const [remaining, setRemaining] = useState(REQUEST_WINDOW_S);
  const [busy, setBusy] = useState<string | null>(null);
  const requestIdRef = useRef<string | null>(null);

  const request = requests?.[0] ?? null;

  // Countdown for the incoming request — auto-reject when it expires
  useEffect(() => {
    if (!request) {
      setRemaining(REQUEST_WINDOW_S);
      return;
    }
    if (requestIdRef.current !== request._id) {
      requestIdRef.current = request._id;
      setRemaining(REQUEST_WINDOW_S);
    }
    if (remaining <= 0) {
      rejectRequest({ orderId: request._id }).catch(() => undefined);
      toast("Request expired", { description: "Auto-declined — order returned to the queue" });
      setRemaining(REQUEST_WINDOW_S);
      return;
    }
    const t = window.setTimeout(() => setRemaining((r) => r - 1), 1000);
    return () => window.clearTimeout(t);
  }, [request, remaining, rejectRequest]);

  const circumference = 2 * Math.PI * 26;
  const progress = remaining / REQUEST_WINDOW_S;

  const handleAccept = async () => {
    if (!request) return;
    setBusy("accept");
    try {
      await acceptRequest({ orderId: request._id });
      toast.success("Request accepted — head to the restaurant!");
      navigate("/delivery/active-order");
    } catch (e) {
      toast.error(parseError(e));
    } finally {
      setBusy(null);
    }
  };

  const handleReject = async () => {
    if (!request) return;
    setBusy("reject");
    try {
      await rejectRequest({ orderId: request._id });
      toast("Request declined");
    } catch (e) {
      toast.error(parseError(e));
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Availability */}
      <div className="flex items-center justify-between rounded-2xl border bg-card p-4">
        <div className="flex items-center gap-3">
          <div className={`relative flex size-10 items-center justify-center rounded-xl ${isAvailable ? "bg-green-600/10 text-green-600" : "bg-muted text-muted-foreground"}`}>
            {isAvailable ? (
              <>
                <Bike className="size-5" />
                <span className="absolute -right-0.5 -top-0.5 size-2.5 rounded-full bg-green-500 ring-2 ring-card" />
              </>
            ) : (
              <Bike className="size-5" />
            )}
          </div>
          <div>
            <p className="text-sm font-semibold">{isAvailable ? "Available for deliveries" : "Offline"}</p>
            <p className="text-xs text-muted-foreground">
              {isAvailable ? "New requests will reach you instantly" : "Toggle on to start receiving requests"}
            </p>
          </div>
        </div>
        <Switch
          checked={isAvailable ?? false}
          onCheckedChange={(v) =>
            setAvailability({ isAvailable: v })
              .then(() => toast.success(v ? "You're online! 🟢" : "You're offline"))
              .catch((e) => toast.error(parseError(e)))
          }
        />
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { label: "Today's deliveries", icon: ReceiptText, value: earnings?.todayDeliveries ?? 0, to: "/delivery/history" },
          { label: "Today's earnings", icon: IndianRupee, value: earnings?.todayEarningsPaise ?? 0, prefix: "₹", to: "/delivery/earnings" },
          { label: "This week", icon: Clock3, value: earnings?.weekEarningsPaise ?? 0, prefix: "₹", to: "/delivery/earnings" },
        ].map((c, i) => (
          <motion.button
            key={c.label}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            whileHover={{ y: -3 }}
            onClick={() => navigate(c.to)}
            className="rounded-2xl border bg-card p-5 text-left shadow-sm transition-shadow hover:shadow-md"
          >
            <div className="flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <c.icon className="size-4" />
            </div>
            <p className="font-display mt-3 text-2xl font-extrabold tabular-nums">
              {earnings ? <CountUp value={c.value} prefix={c.prefix ?? ""} /> : <Skeleton className="h-7 w-16" />}
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground">{c.label}</p>
          </motion.button>
        ))}
      </div>

      {/* Incoming request */}
      {request ? (
        <motion.section
          key={request._id}
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 260, damping: 24 }}
          className="relative overflow-hidden rounded-2xl border-2 border-primary/30 bg-card p-5 shadow-lg shadow-primary/5"
        >
          <div className="flex items-start gap-4">
            {/* Countdown ring */}
            <div className="relative size-16 shrink-0">
              <svg viewBox="0 0 64 64" className="size-16 -rotate-90">
                <circle cx="32" cy="32" r="26" fill="none" stroke="var(--border)" strokeWidth="5" />
                <motion.circle
                  cx="32"
                  cy="32"
                  r="26"
                  fill="none"
                  stroke="var(--primary)"
                  strokeWidth="5"
                  strokeLinecap="round"
                  strokeDasharray={circumference}
                  animate={{ strokeDashoffset: circumference * (1 - progress) }}
                  transition={{ duration: 1, ease: "linear" }}
                />
              </svg>
              <span className="absolute inset-0 flex items-center justify-center text-sm font-bold tabular-nums">
                {remaining}s
              </span>
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-accent/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-accent">
                  New delivery request
                </span>
                <span className="text-xs text-muted-foreground">{shortId(request._id)}</span>
              </div>
              <p className="font-display mt-1.5 text-lg font-bold">{request.restaurantName}</p>
              <div className="mt-2 flex flex-col gap-1 text-xs text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <Store className="size-3.5 text-primary" /> Pickup: {request.restaurantLat.toFixed(4)}, {request.restaurantLng.toFixed(4)}
                </span>
                <span className="flex items-center gap-1.5">
                  <MapPin className="size-3.5 text-destructive" /> Drop: {request.addressLabel} — {request.addressFull}
                </span>
              </div>
              <p className="mt-2 flex items-center gap-1.5 text-sm font-semibold text-green-600 dark:text-green-400">
                <IndianRupee className="size-4" /> Earn {inr(request.deliveryFeePaise)}
              </p>
            </div>
          </div>

          <div className="mt-4 flex gap-2">
            <Button className="flex-1 gap-1.5" onClick={handleAccept} disabled={busy !== null}>
              {busy === "accept" ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />}
              Accept
            </Button>
            <Button variant="outline" className="flex-1 gap-1.5 text-destructive hover:text-destructive" onClick={handleReject} disabled={busy !== null}>
              {busy === "reject" ? <Loader2 className="size-4 animate-spin" /> : <X className="size-4" />}
              Decline
            </Button>
          </div>
        </motion.section>
      ) : activeOrder ? (
        <motion.button
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          onClick={() => navigate("/delivery/active-order")}
          className="flex items-center gap-4 rounded-2xl border border-primary/25 bg-primary/[0.04] p-5 text-left transition-shadow hover:shadow-md"
        >
          <div className="flex size-11 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <Bike className="size-5" />
          </div>
          <div className="flex-1">
            <p className="font-semibold">Active delivery in progress</p>
            <p className="text-xs text-muted-foreground">
              {activeOrder.restaurantName} → {activeOrder.addressLabel} · {inr(activeOrder.totalPaise)}
            </p>
          </div>
          <span className="text-sm font-semibold text-primary">Open →</span>
        </motion.button>
      ) : null}
    </div>
  );
}
