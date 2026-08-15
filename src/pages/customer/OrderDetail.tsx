import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { useMutation, useQuery } from "convex/react";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Bike,
  CalendarClock,
  MapPin,
  Phone,
  Store,
  XCircle,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { ConfettiBurst } from "@/components/Confetti";
import { RouteMap } from "@/components/RouteMap";
import { StatusStepper } from "@/components/StatusStepper";
import { BillSummary, OrderItemsList } from "@/components/food";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDateTime, inr, shortId, STATUS_META, statusChip, type OrderStatus } from "@/lib/format";
import { parseError } from "@/lib/parse";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const STATUS_TOASTS: Partial<Record<OrderStatus, string>> = {
  ACCEPTED: "Your order was accepted! The kitchen is on it 🍳",
  PREPARING: "Your food is being prepared 👨‍🍳",
  READY: "Your order is packed and ready 📦",
  ASSIGNED: "A delivery partner has been assigned 🛵",
  PICKED_UP: "Your order has been picked up from the restaurant",
  OUT_FOR_DELIVERY: "Your partner is on the way — track them live 📍",
  DELIVERED: "Delivered! Enjoy your meal 🎉",
};

export default function OrderDetail() {
  const { id } = useParams<{ id: string }>();
  const data = useQuery(api.customers.getOrder, { orderId: id! as Id<"orders"> });
  const cancelOrder = useMutation(api.customers.cancelOrder);
  const navigate = useNavigate();

  const [celebrated, setCelebrated] = useState(false);
  const prevStatus = useRef<OrderStatus | null>(null);
  const [cancelling, setCancelling] = useState(false);

  const order = data?.order;
  const status = order?.orderStatus as OrderStatus | undefined;

  useEffect(() => {
    if (!status) return;
    if (prevStatus.current && prevStatus.current !== status) {
      const msg = STATUS_TOASTS[status];
      if (msg) toast.success(msg);
      if (status === "DELIVERED" && !celebrated) setCelebrated(true);
    }
    prevStatus.current = status;
  }, [status, celebrated]);

  const handleCancel = async () => {
    if (!order) return;
    setCancelling(true);
    try {
      await cancelOrder({ orderId: order._id });
      toast.success("Order cancelled");
    } catch (e) {
      toast.error(parseError(e));
    } finally {
      setCancelling(false);
    }
  };

  if (!order) {
    return (
      <div className="mx-auto flex max-w-3xl flex-col gap-6">
        <Skeleton className="h-8 w-1/2" />
        <Skeleton className="h-64 rounded-2xl" />
        <Skeleton className="h-48 rounded-2xl" />
      </div>
    );
  }

  const partner = data?.deliveryPartner;
  const showMap =
    ["ASSIGNED", "PICKED_UP", "OUT_FOR_DELIVERY", "DELIVERED"].includes(order.orderStatus) &&
    !!order.deliveryPartnerId;

  // progress along the pickup→drop axis (0 = at restaurant, 1 = at door)
  let progress = 0;
  if (partner?.currentLat != null && partner.currentLng != null) {
    const dlng = order.addressLng - order.restaurantLng;
    const dlat = order.addressLat - order.restaurantLat;
    const lenSq = dlng * dlng + dlat * dlat || 1;
    progress = Math.max(
      0,
      Math.min(1, ((partner.currentLng - order.restaurantLng) * dlng + (partner.currentLat - order.restaurantLat) * dlat) / lenSq),
    );
  }
  const etaMins = status === "OUT_FOR_DELIVERY" || status === "PICKED_UP" ? Math.max(1, Math.round((1 - progress) * 22)) : undefined;

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      {celebrated && <ConfettiBurst />}

      {/* Header */}
      <div>
        <button
          onClick={() => navigate("/customer/orders")}
          className="flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-4" /> All orders
        </button>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="font-display text-2xl font-extrabold tracking-tight">
              {order.restaurantName}
            </h1>
            <p className="mt-0.5 flex items-center gap-2 text-sm text-muted-foreground">
              {shortId(order._id)}
              <span className="size-1 rounded-full bg-muted-foreground/40" />
              {formatDateTime(order.createdAt)}
            </p>
          </div>
          <motion.span
            key={status}
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className={cn(statusChip(order.orderStatus), "px-3 py-1 text-sm")}
          >
            {STATUS_META[order.orderStatus].label}
          </motion.span>
        </div>
      </div>

      {/* ETA banner */}
      {status === "OUT_FOR_DELIVERY" && etaMins !== undefined && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3 rounded-2xl bg-primary px-5 py-4 text-primary-foreground"
        >
          <div className="flex size-10 items-center justify-center rounded-xl bg-primary-foreground/15">
            <Bike className="size-5" />
          </div>
          <div className="flex-1">
            <p className="font-display font-bold">{etaMins <= 1 ? "Arriving now" : `Arriving in ~${etaMins} min`}</p>
            <p className="text-xs text-primary-foreground/80">Live — updates every few seconds</p>
          </div>
        </motion.div>
      )}

      {/* Live map */}
      {showMap && (
        <RouteMap
          from={{ lat: order.restaurantLat, lng: order.restaurantLng }}
          to={{ lat: order.addressLat, lng: order.addressLng }}
          partner={
            partner?.currentLat != null && partner.currentLng != null
              ? { lat: partner.currentLat, lng: partner.currentLng }
              : null
          }
          etaMins={etaMins}
        />
      )}

      {/* Stepper */}
      <section className="rounded-2xl border bg-card p-5">
        <h2 className="mb-5 font-semibold">Order progress</h2>
        <StatusStepper status={order.orderStatus} statusHistory={order.statusHistory} />
        {["PENDING", "ACCEPTED"].includes(order.orderStatus) && (
          <Button
            variant="outline"
            size="sm"
            className="mt-5 gap-1.5 text-destructive hover:text-destructive"
            onClick={handleCancel}
            disabled={cancelling}
          >
            <XCircle className="size-4" /> Cancel order
          </Button>
        )}
      </section>

      {/* Partner card */}
      {partner && status !== "CANCELLED" && (
        <section className="flex items-center gap-4 rounded-2xl border bg-card p-5">
          <div className="flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Bike className="size-6" />
          </div>
          <div className="flex-1">
            <p className="font-semibold">{partner.name ?? "Delivery partner"}</p>
            <p className="text-xs text-muted-foreground">
              {partner.vehicleType ? `${partner.vehicleType} · ` : ""}
              {order.restaurantName} → {order.addressLabel}
            </p>
          </div>
          {partner.phone && (
            <Button variant="outline" size="icon" asChild>
              <a href={`tel:${partner.phone}`} aria-label="Call delivery partner">
                <Phone className="size-4" />
              </a>
            </Button>
          )}
        </section>
      )}

      {/* Delivery info */}
      <section className="grid gap-3 sm:grid-cols-2">
        <div className="flex items-start gap-3 rounded-2xl border bg-card p-4">
          <Store className="mt-0.5 size-4 shrink-0 text-primary" />
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Pickup</p>
            <p className="mt-0.5 text-sm font-medium">{order.restaurantName}</p>
            <p className="mt-0.5 text-xs text-muted-foreground">{order.restaurantLat.toFixed(4)}, {order.restaurantLng.toFixed(4)}</p>
          </div>
        </div>
        <div className="flex items-start gap-3 rounded-2xl border bg-card p-4">
          <MapPin className="mt-0.5 size-4 shrink-0 text-primary" />
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Deliver to</p>
            <p className="mt-0.5 text-sm font-medium">{order.addressLabel}</p>
            <p className="mt-0.5 text-xs leading-5 text-muted-foreground">{order.addressFull}</p>
          </div>
        </div>
      </section>

      {/* Items + bill */}
      <section className="rounded-2xl border bg-card p-5">
        <h2 className="mb-4 font-semibold">Order summary</h2>
        <OrderItemsList items={order.items} />
        <div className="mt-4 border-t pt-4">
          <BillSummary
            subtotalPaise={order.subtotalPaise}
            deliveryFeePaise={order.deliveryFeePaise}
            discountPaise={order.discountPaise}
            totalPaise={order.totalPaise}
            couponCode={order.couponCode}
          />
        </div>
        <div className="mt-3 flex items-center gap-2 border-t pt-3 text-xs text-muted-foreground">
          <CalendarClock className="size-3.5" />
          Paid via {order.paymentMethod ?? "UPI"} · {order.paymentStatus}
        </div>
      </section>
    </div>
  );
}
