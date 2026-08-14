import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { useMutation, useQuery } from "convex/react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Bike,
  ChefHat,
  Check,
  ClipboardList,
  CookingPot,
  Loader2,
  PackageCheck,
  ShoppingBag,
  X,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { BillSummary, OrderItemsList } from "@/components/food";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDateTime, inr, shortId, statusChip } from "@/lib/format";
import { parseError } from "@/lib/parse";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

type Filter = "ALL" | string;

export default function AdminOrders() {
  const orders = useQuery(api.admin.listOrders);
  const partners = useQuery(api.admin.listDeliveryPartners);
  const acceptOrder = useMutation(api.admin.acceptOrder);
  const rejectOrder = useMutation(api.admin.rejectOrder);
  const setPreparing = useMutation(api.admin.setPreparing);
  const setReady = useMutation(api.admin.setReady);
  const assignDeliveryPartner = useMutation(api.admin.assignDeliveryPartner);

  const [filter, setFilter] = useState<Filter>("ALL");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [assignPartnerId, setAssignPartnerId] = useState<string>("");
  const [busyAction, setBusyAction] = useState<string | null>(null);
  const [flashId, setFlashId] = useState<string | null>(null);
  const knownIds = useRef<Set<string>>(new Set());

  // Real-time: flash + toast when a brand-new order arrives
  useEffect(() => {
    if (!orders) return;
    const ids = new Set(orders.map((o) => o._id));
    for (const o of orders) {
      if (o.orderStatus === "PENDING" && !knownIds.current.has(o._id)) {
        setFlashId(o._id);
        toast(`${o.restaurantName} — new order ${inr(o.totalPaise)}`, {
          description: `${shortId(o._id)} from ${o.customerName}`,
          duration: 4000,
        });
        window.setTimeout(() => setFlashId(null), 4000);
        break;
      }
    }
    knownIds.current = ids;
  }, [orders]);

  const counts = useMemo(() => {
    const acc: Record<string, number> = { ALL: orders?.length ?? 0 };
    orders?.forEach((o) => {
      acc[o.orderStatus] = (acc[o.orderStatus] ?? 0) + 1;
    });
    return acc;
  }, [orders]);

  const filtered = useMemo(
    () => (orders ?? []).filter((o) => filter === "ALL" || o.orderStatus === filter),
    [orders, filter],
  );

  const selected = orders?.find((o) => o._id === selectedId) ?? null;
  const activePartners = partners?.filter((p) => p.status === "ACTIVE" && p.kind === "user") ?? [];

  const runAction = async (fn: () => Promise<unknown>, successMsg: string, key: string) => {
    setBusyAction(key);
    try {
      await fn();
      toast.success(successMsg);
    } catch (e) {
      toast.error(parseError(e));
    } finally {
      setBusyAction(null);
    }
  };

  const handleAssign = async () => {
    if (!selected || !assignPartnerId) return;
    await runAction(
      () => assignDeliveryPartner({ orderId: selected._id, partnerId: assignPartnerId as Id<"users"> }),
      "Delivery partner assigned — they've been notified",
      "assign",
    );
    setAssignPartnerId("");
  };


  return (
    <div className="flex flex-col gap-5">
      {/* Filters */}
      <div className="no-scrollbar -mx-1 flex gap-2 overflow-x-auto px-1">
        {Object.entries(counts).map(([status, count]) => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={cn(
              "shrink-0 rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors",
              filter === status
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-card text-muted-foreground hover:text-foreground",
            )}
          >
            {status === "ALL" ? "All" : status.replace(/_/g, " ")}
            <span className={cn("ml-1.5", filter === status ? "text-primary-foreground/70" : "text-muted-foreground/60")}>
              {count}
            </span>
          </button>
        ))}
      </div>

      {/* List */}
      {!orders ? (
        <div className="space-y-3">
          <Skeleton className="h-24 rounded-2xl" />
          <Skeleton className="h-24 rounded-2xl" />
          <Skeleton className="h-24 rounded-2xl" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed py-14 text-center">
          <ClipboardList className="size-8 text-muted-foreground/50" />
          <p className="text-sm font-medium">No orders here</p>
          <p className="text-xs text-muted-foreground">Orders will appear instantly when customers place them.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          <AnimatePresence>
            {filtered.map((o) => (
              <motion.button
                key={o._id}
                layout
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                onClick={() => setSelectedId(o._id)}
                className={cn(
                  "relative overflow-hidden rounded-2xl border bg-card p-4 text-left shadow-sm transition-all hover:shadow-md",
                  flashId === o._id && "ring-2 ring-accent",
                )}
              >
                {flashId === o._id && (
                  <motion.span
                    initial={{ opacity: 0.35 }}
                    animate={{ opacity: 0 }}
                    transition={{ duration: 2.5, ease: "easeOut" }}
                    className="pointer-events-none absolute inset-0 bg-accent"
                  />
                )}
                <div className="relative flex items-start gap-4">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <ShoppingBag className="size-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold">{shortId(o._id)}</p>
                      <span className="text-sm font-medium text-foreground/80">{o.restaurantName}</span>
                      {o.orderStatus === "PENDING" && (
                        <span className="flex items-center gap-1 rounded-full bg-accent/15 px-2 py-0.5 text-[10px] font-bold uppercase text-accent">
                          <span className="size-1.5 animate-pulse rounded-full bg-accent" /> New
                        </span>
                      )}
                    </div>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {o.customerName} · {o.items.reduce((s, i) => s + i.quantity, 0)} items · {formatDateTime(o.createdAt)}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {o.deliveryPartnerName ? `Partner: ${o.deliveryPartnerName}` : "No partner assigned"}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1.5">
                    <span className={statusChip(o.orderStatus)}>{o.orderStatus.replace(/_/g, " ")}</span>
                    <span className="font-display text-sm font-bold tabular-nums">{inr(o.totalPaise)}</span>
                  </div>
                </div>
              </motion.button>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Detail sheet */}
      <Sheet open={!!selected} onOpenChange={(open) => { if (!open) setSelectedId(null); }}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-md">
          {selected && (
            <>
              <SheetHeader>
                <SheetTitle className="flex items-center gap-2">
                  Order {shortId(selected._id)}
                  <span className={statusChip(selected.orderStatus)}>{selected.orderStatus.replace(/_/g, " ")}</span>
                </SheetTitle>
                <SheetDescription>
                  {selected.restaurantName} · {formatDateTime(selected.createdAt)} · {selected.customerName}
                </SheetDescription>
              </SheetHeader>

              <div className="flex flex-col gap-5">
                <div className="rounded-xl border p-4">
                  <OrderItemsList items={selected.items} />
                </div>

                <div className="rounded-xl border p-4">
                  <BillSummary
                    subtotalPaise={selected.subtotalPaise}
                    deliveryFeePaise={selected.deliveryFeePaise}
                    discountPaise={selected.discountPaise}
                    totalPaise={selected.totalPaise}
                    couponCode={selected.couponCode}
                  />
                </div>

                <div className="rounded-xl border p-4 text-sm">
                  <p className="font-semibold">Deliver to</p>
                  <p className="mt-1 text-xs leading-5 text-muted-foreground">
                    {selected.addressLabel} — {selected.addressFull}
                  </p>
                  <p className="mt-3 font-semibold">Payment</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {selected.paymentMethod ?? "UPI"} · {selected.paymentStatus}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex flex-col gap-2.5">
                  {selected.orderStatus === "PENDING" && (
                    <div className="flex gap-2">
                      <Button
                        className="flex-1 gap-1.5"
                        onClick={() => runAction(() => acceptOrder({ orderId: selected._id }), "Order accepted — customer notified", "accept")}
                        disabled={busyAction === "accept"}
                      >
                        {busyAction === "accept" ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />}
                        Accept
                      </Button>
                      <Button
                        variant="outline"
                        className="flex-1 gap-1.5 text-destructive hover:text-destructive"
                        onClick={() => runAction(() => rejectOrder({ orderId: selected._id }), "Order rejected", "reject")}
                        disabled={busyAction === "reject"}
                      >
                        {busyAction === "reject" ? <Loader2 className="size-4 animate-spin" /> : <X className="size-4" />}
                        Reject
                      </Button>
                    </div>
                  )}

                  {selected.orderStatus === "ACCEPTED" && (
                    <Button
                      className="gap-1.5"
                      onClick={() => runAction(() => setPreparing({ orderId: selected._id }), "Kitchen notified — preparing", "prep")}
                      disabled={busyAction === "prep"}
                    >
                      {busyAction === "prep" ? <Loader2 className="size-4 animate-spin" /> : <ChefHat className="size-4" />}
                      Mark as preparing
                    </Button>
                  )}

                  {selected.orderStatus === "PREPARING" && (
                    <Button
                      className="gap-1.5"
                      onClick={() => runAction(() => setReady({ orderId: selected._id }), "Order is ready for pickup", "ready")}
                      disabled={busyAction === "ready"}
                    >
                      {busyAction === "ready" ? <Loader2 className="size-4 animate-spin" /> : <PackageCheck className="size-4" />}
                      Mark as ready
                    </Button>
                  )}

                  {selected.orderStatus === "READY" && (
                    <div className="flex flex-col gap-2">
                      <p className="flex items-center gap-1.5 text-sm font-semibold">
                        <Bike className="size-4 text-primary" /> Assign delivery partner
                      </p>
                      <div className="flex gap-2">
                        <Select value={assignPartnerId} onValueChange={setAssignPartnerId}>
                          <SelectTrigger className="flex-1">
                            <SelectValue placeholder={activePartners.length ? "Choose a partner" : "No active partners"} />
                          </SelectTrigger>
                          <SelectContent>
                            {activePartners.map((p) => (
                              <SelectItem key={p._id} value={p._id}>
                                {p.name} {p.isAvailable ? "· available" : ""}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Button
                          onClick={handleAssign}
                          disabled={!assignPartnerId || busyAction === "assign"}
                        >
                          {busyAction === "assign" ? <Loader2 className="size-4 animate-spin" /> : <Bike className="size-4" />}
                          Assign
                        </Button>
                      </div>
                    </div>
                  )}

                  {selected.orderStatus === "ASSIGNED" && (
                    <div className="rounded-xl border border-primary/25 bg-primary/[0.04] p-3 text-sm">
                      <p className="font-medium">{selected.deliveryPartnerName ?? "Partner"} is handling this delivery</p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        Waiting for pickup confirmation — the partner updates the status live.
                      </p>
                    </div>
                  )}

                  {(selected.orderStatus === "PICKED_UP" || selected.orderStatus === "OUT_FOR_DELIVERY") && (
                    <div className="flex items-center gap-2 rounded-xl border bg-card p-3 text-sm">
                      <CookingPot className="size-4 text-primary" />
                      <span>In transit with {selected.deliveryPartnerName ?? "partner"}</span>
                    </div>
                  )}

                  {selected.orderStatus === "DELIVERED" && (
                    <div className="rounded-xl border border-green-200 bg-green-50 p-3 text-sm text-green-700 dark:border-green-500/30 dark:bg-green-500/10 dark:text-green-400">
                      Delivered successfully 🎉
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
