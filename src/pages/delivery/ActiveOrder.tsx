import { api } from "@/convex/_generated/api";
import { useMutation, useQuery } from "convex/react";
import { motion } from "framer-motion";
import {
  Bike,
  CheckCircle2,
  Loader2,
  MapPin,
  Navigation,
  PackageCheck,
  Store,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { RouteMap } from "@/components/RouteMap";
import { BillSummary, OrderItemsList } from "@/components/food";
import { Button } from "@/components/ui/button";
import { inr, shortId } from "@/lib/format";
import { parseError } from "@/lib/parse";
import { toast } from "sonner";

export default function DeliveryActiveOrder() {
  const order = useQuery(api.delivery.myActiveOrder);
  const updateLocation = useMutation(api.delivery.updateLocation);
  const updateOrderStatus = useMutation(api.delivery.updateOrderStatus);

  const [busy, setBusy] = useState<string | null>(null);
  const [simulating, setSimulating] = useState(false);
  const simRef = useRef<number | null>(null);
  const progressRef = useRef(0);

  // Broadcast location every ~5s: real GPS when available, otherwise a demo
  // simulation that rides along the pickup→drop line (sandboxed previews
  // often block geolocation).
  useEffect(() => {
    if (!order || !["PICKED_UP", "OUT_FOR_DELIVERY"].includes(order.orderStatus)) {
      setSimulating(false);
      if (simRef.current) {
        window.clearInterval(simRef.current);
        simRef.current = null;
      }
      return;
    }

    let watchId: number | null = null;
    let gpsWorking = false;

    const pushLocation = (lat: number, lng: number) => {
      updateLocation({ lat, lng }).catch(() => undefined);
    };

    if (navigator.geolocation) {
      watchId = navigator.geolocation.watchPosition(
        (pos) => {
          gpsWorking = true;
          setSimulating(false);
          pushLocation(pos.coords.latitude, pos.coords.longitude);
        },
        () => {
          /* permission denied / unavailable → simulation below */
        },
        { enableHighAccuracy: true, maximumAge: 4000, timeout: 8000 },
      );
    }

    // Start the simulation immediately too (cheap, and covers the no-GPS case)
    setSimulating(true);
    const startLat = order.restaurantLat;
    const startLng = order.restaurantLng;
    const endLat = order.addressLat;
    const endLng = order.addressLng;
    simRef.current = window.setInterval(() => {
      if (gpsWorking) return; // real GPS is authoritative
      progressRef.current = Math.min(1, progressRef.current + 0.028);
      const t = progressRef.current;
      const lat = startLat + (endLat - startLat) * t;
      const lng = startLng + (endLng - startLng) * t;
      pushLocation(lat, lng);
    }, 2500);

    return () => {
      if (watchId !== null) navigator.geolocation.clearWatch(watchId);
      if (simRef.current) window.clearInterval(simRef.current);
      simRef.current = null;
    };
  }, [order?._id, order?.orderStatus, updateLocation]);

  if (!order) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-3xl border border-dashed py-20 text-center">
        <div className="flex size-14 items-center justify-center rounded-2xl bg-muted">
          <Bike className="size-7 text-muted-foreground" />
        </div>
        <p className="font-display text-lg font-bold">No active delivery</p>
        <p className="max-w-sm text-sm text-muted-foreground">
          Accept a delivery request from your dashboard and it will show up here.
        </p>
      </div>
    );
  }

  const steps = [
    { key: "PICKED_UP", label: "Picked Up", desc: "Confirm you have the order from the restaurant", icon: Store },
    { key: "OUT_FOR_DELIVERY", label: "Out for Delivery", desc: "You're on the road — customer sees you live", icon: Navigation },
    { key: "DELIVERED", label: "Delivered", desc: "Handed over to the customer. Cash in!", icon: PackageCheck },
  ] as const;

  const currentStepIndex = steps.findIndex((s) => s.key === order.orderStatus);

  const handleStatus = async (status: "PICKED_UP" | "OUT_FOR_DELIVERY" | "DELIVERED") => {
    setBusy(status);
    try {
      await updateOrderStatus({ orderId: order._id, status });
      toast.success(status === "DELIVERED" ? "Delivered! 🎉 Earnings updated" : `Order marked as ${status.replace(/_/g, " ")}`);
    } catch (e) {
      toast.error(parseError(e));
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Route preview */}
      <RouteMap
        from={{ lat: order.restaurantLat, lng: order.restaurantLng }}
        to={{ lat: order.addressLat, lng: order.addressLng }}
        partner={null}
      />

      {/* Steps */}
      <div className="flex flex-col gap-3">
        {steps.map((step, i) => {
          const done = i < currentStepIndex;
          const current = i === currentStepIndex;
          return (
            <motion.div
              key={step.key}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
              className={`rounded-2xl border p-4 ${done ? "border-green-200 bg-green-50/60 dark:border-green-500/25 dark:bg-green-500/5" : current ? "border-primary/40 bg-card shadow-md" : "border bg-card opacity-60"}`}
            >
              <div className="flex items-center gap-3">
                <div className={`flex size-10 shrink-0 items-center justify-center rounded-xl ${done ? "bg-green-600 text-white" : current ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
                  {done ? <CheckCircle2 className="size-5" /> : <step.icon className="size-5" />}
                </div>
                <div className="flex-1">
                  <p className="font-semibold">{step.label}</p>
                  <p className="text-xs text-muted-foreground">{step.desc}</p>
                </div>
                {current && (
                  <Button
                    size="lg"
                    className="gap-2 rounded-xl"
                    disabled={busy !== null}
                    onClick={() => handleStatus(step.key)}
                  >
                    {busy === step.key ? <Loader2 className="size-5 animate-spin" /> : <step.icon className="size-5" />}
                    {step.key === "PICKED_UP" ? "Confirm pickup" : step.key === "OUT_FOR_DELIVERY" ? "Start delivery" : "Mark delivered"}
                  </Button>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>

      {simulating && (
        <div className="flex items-center gap-2 rounded-xl border border-dashed px-4 py-2.5 text-xs text-muted-foreground">
          <span className="relative flex size-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-60" />
            <span className="relative inline-flex size-2 rounded-full bg-primary" />
          </span>
          Demo mode: broadcasting simulated GPS — real location will be used automatically if available.
        </div>
      )}

      {/* Order details */}
      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border bg-card p-4">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            <Store className="size-3.5" /> Pickup
          </div>
          <p className="mt-1.5 font-semibold">{order.restaurantName}</p>
          <p className="text-xs text-muted-foreground">{shortId(order._id)} · {inr(order.totalPaise)}</p>
        </div>
        <div className="rounded-2xl border bg-card p-4">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            <MapPin className="size-3.5" /> Deliver to
          </div>
          <p className="mt-1.5 font-semibold">{order.addressLabel}</p>
          <p className="text-xs leading-5 text-muted-foreground">{order.addressFull}</p>
        </div>
      </div>

      {/* Items + bill */}
      <div className="rounded-2xl border bg-card p-5">
        <h3 className="mb-4 font-semibold">Order contents</h3>
        <OrderItemsList items={order.items} />
        <div className="mt-4 border-t pt-4">
          <BillSummary
            subtotalPaise={order.subtotalPaise}
            deliveryFeePaise={order.deliveryFeePaise}
            discountPaise={order.discountPaise}
            totalPaise={order.totalPaise}
          />
        </div>
      </div>
    </div>
  );
}
