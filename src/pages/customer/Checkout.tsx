import { api } from "@/convex/_generated/api";
import { useConvex, useMutation, useQuery } from "convex/react";
import type { Id } from "@/convex/_generated/dataModel";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  Banknote,
  CheckCircle2,
  CreditCard,
  Loader2,
  MapPin,
  Plus,
  Smartphone,
  Tag,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { BillSummary } from "@/components/food";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useCart } from "@/store/cart";
import { inr, parseError } from "@/lib/parse";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const PAYMENT_METHODS = [
  { id: "UPI", label: "UPI", icon: Smartphone, desc: "GPay, PhonePe, Paytm" },
  { id: "CARD", label: "Card", icon: CreditCard, desc: "Credit / Debit" },
  { id: "CASH", label: "Cash on delivery", icon: Banknote, desc: "Pay at your door" },
];

export default function Checkout() {
  const { items, restaurantId, restaurantName, subtotalPaise, clear } = useCart();
  const navigate = useNavigate();

  const convex = useConvex();
  const addresses = useQuery(api.customers.listMyAddresses);
  const addAddress = useMutation(api.customers.addAddress);
  const placeOrder = useMutation(api.customers.placeOrder);

  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [addingAddress, setAddingAddress] = useState(false);
  const [newAddress, setNewAddress] = useState({ label: "Home", fullAddress: "" });
  const [addressBusy, setAddressBusy] = useState(false);

  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<{ code: string; discountPaise: number } | null>(null);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [couponBusy, setCouponBusy] = useState(false);

  const [paymentMethod, setPaymentMethod] = useState("UPI");
  const [payStep, setPayStep] = useState<"idle" | "processing" | "success">("idle");
  const [placing, setPlacing] = useState(false);

  const restaurant = useQuery(api.customers.listRestaurants)?.find((r) => r._id === restaurantId);
  const deliveryFeePaise = restaurant?.deliveryFeePaise ?? 0;
  const discountPaise = appliedCoupon?.discountPaise ?? 0;
  const totalPaise = Math.max(0, subtotalPaise + deliveryFeePaise - discountPaise);

  useEffect(() => {
    if (addresses && addresses.length > 0 && !selectedAddressId) {
      setSelectedAddressId(addresses.find((a) => a.isDefault)?.id ?? addresses[0].id);
    }
  }, [addresses, selectedAddressId]);

  const selectedAddress = addresses?.find((a) => a._id === selectedAddressId);

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;
    setCouponBusy(true);
    setCouponError(null);
    try {
      const result = await convex.query(api.customers.previewCoupon, {
        code: couponCode,
        subtotalPaise,
      });
      if (!result) {
        setCouponError("This coupon code is not valid");
      } else {
        setAppliedCoupon({ code: result.code, discountPaise: result.discountPaise });
        setCouponCode("");
        toast.success(`Coupon ${result.code} applied — you save ${inr(result.discountPaise)}`);
      }
    } catch (e) {
      setCouponError(parseError(e));
      setAppliedCoupon(null);
    } finally {
      setCouponBusy(false);
    }
  };

  const handleAddAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAddress.fullAddress.trim()) return;
    setAddressBusy(true);
    try {
      const id = await addAddress({ ...newAddress, isDefault: addresses?.length === 0 });
      setSelectedAddressId(id);
      setAddingAddress(false);
      setNewAddress({ label: "Home", fullAddress: "" });
      toast.success("Address added");
    } catch (e) {
      toast.error(parseError(e));
    } finally {
      setAddressBusy(false);
    }
  };

  const handlePay = async () => {
    if (!selectedAddressId) {
      toast.error("Select a delivery address");
      return;
    }
    if (paymentMethod !== "CASH") {
      setPayStep("processing");
      await new Promise((r) => setTimeout(r, 1600));
      setPayStep("success");
      await new Promise((r) => setTimeout(r, 900));
    }
    setPayStep("idle");
    await placeOrderNow();
  };

  const placeOrderNow = async () => {
    if (!restaurantId) return;
    setPlacing(true);
    try {
      const { orderId } = await placeOrder({
        restaurantId,
        addressId: selectedAddressId!,
        couponCode: appliedCoupon?.code,
        items: items.map((i) => ({ menuItemId: i.menuItemId as Id<"menuItems">, quantity: i.quantity })),
        paymentMethod,
      });
      clear();
      toast.success("Order placed! 🎉");
      navigate(`/customer/orders/${orderId}`);
    } catch (e) {
      setPayStep("idle");
      toast.error(parseError(e));
      setPlacing(false);
    }
  };

  if (items.length === 0 && !placing) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-3xl border border-dashed py-20 text-center">
        <p className="text-4xl">🛒</p>
        <p className="font-display text-lg font-bold">Nothing to check out</p>
        <p className="text-sm text-muted-foreground">Your cart is empty. Add some food first!</p>
        <Button className="mt-2" onClick={() => navigate("/customer/home")}>Browse restaurants</Button>
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6">
      <button onClick={() => navigate("/customer/cart")} className="flex w-fit items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground">
        <ArrowLeft className="size-4" /> Back to cart
      </button>
      <h1 className="font-display text-2xl font-extrabold tracking-tight">Checkout</h1>

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="flex flex-col gap-6">
          {/* Address */}
          <section className="rounded-2xl border bg-card p-5">
            <div className="flex items-center justify-between">
              <h2 className="flex items-center gap-2 font-semibold">
                <MapPin className="size-4 text-primary" /> Delivery address
              </h2>
              <Button variant="ghost" size="sm" className="gap-1 text-primary" onClick={() => setAddingAddress((v) => !v)}>
                <Plus className="size-4" /> {addingAddress ? "Close" : "Add new"}
              </Button>
            </div>

            {addingAddress && (
              <motion.form
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                onSubmit={handleAddAddress}
                className="mt-4 flex flex-col gap-3"
              >
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="addr-label">Label</Label>
                    <Input id="addr-label" value={newAddress.label} onChange={(e) => setNewAddress({ ...newAddress, label: e.target.value })} />
                  </div>
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="addr-full">Full address</Label>
                  <Textarea id="addr-full" rows={2} value={newAddress.fullAddress} onChange={(e) => setNewAddress({ ...newAddress, fullAddress: e.target.value })} placeholder="House / flat, street, area, city, PIN" required />
                </div>
                <Button type="submit" size="sm" className="self-start" disabled={addressBusy || !newAddress.fullAddress.trim()}>
                  {addressBusy && <Loader2 className="size-4 animate-spin" />} Save address
                </Button>
              </motion.form>
            )}

            {!addresses ? (
              <div className="mt-4 space-y-2">
                <div className="h-16 animate-pulse rounded-xl bg-muted" />
                <div className="h-16 animate-pulse rounded-xl bg-muted" />
              </div>
            ) : addresses.length === 0 && !addingAddress ? (
              <div className="mt-4 rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">
                No saved addresses yet. Add one to continue.
              </div>
            ) : (
              <div className="mt-4 flex flex-col gap-2">
                {addresses.map((a) => (
                  <button
                    key={a._id}
                    onClick={() => setSelectedAddressId(a._id)}
                    className={cn(
                      "flex items-start gap-3 rounded-xl border p-3.5 text-left transition-colors",
                      selectedAddressId === a._id
                        ? "border-primary bg-primary/[0.04] ring-1 ring-primary"
                        : "border-border hover:border-primary/40",
                    )}
                  >
                    <span className={cn("mt-0.5 size-4 shrink-0 rounded-full border-2", selectedAddressId === a._id ? "border-primary bg-primary" : "border-muted-foreground/40")} />
                    <span className="min-w-0">
                      <span className="flex items-center gap-2 text-sm font-medium">
                        {a.label}
                        {a.isDefault && <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">Default</span>}
                      </span>
                      <span className="mt-0.5 block text-xs leading-5 text-muted-foreground">{a.fullAddress}</span>
                    </span>
                  </button>
                ))}
              </div>
            )}
          </section>

          {/* Coupon */}
          <section className="rounded-2xl border bg-card p-5">
            <h2 className="flex items-center gap-2 font-semibold">
              <Tag className="size-4 text-primary" /> Coupon
            </h2>
            {appliedCoupon ? (
              <div className="mt-3 flex items-center justify-between rounded-xl border border-green-200 bg-green-50 px-4 py-3 dark:border-green-500/30 dark:bg-green-500/10">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="size-4 text-green-600" />
                  <span className="text-sm font-semibold">{appliedCoupon.code}</span>
                  <span className="text-xs text-green-700 dark:text-green-400">You save {inr(appliedCoupon.discountPaise)}</span>
                </div>
                <button onClick={() => setAppliedCoupon(null)} className="text-muted-foreground hover:text-foreground" aria-label="Remove coupon">
                  <X className="size-4" />
                </button>
              </div>
            ) : (
              <div className="mt-3 flex gap-2">
                <Input placeholder="Enter code (try WELCOME50, SAVE20…)" value={couponCode} onChange={(e) => setCouponCode(e.target.value.toUpperCase())} />
                <Button variant="outline" onClick={handleApplyCoupon} disabled={couponBusy || !couponCode.trim()}>
                  {couponBusy ? <Loader2 className="size-4 animate-spin" /> : "Apply"}
                </Button>
              </div>
            )}
            {couponError && <p className="mt-2 text-xs text-destructive">{couponError}</p>}
          </section>

          {/* Payment */}
          <section className="rounded-2xl border bg-card p-5">
            <h2 className="flex items-center gap-2 font-semibold">
              <CreditCard className="size-4 text-primary" /> Payment method
            </h2>
            <div className="mt-3 grid gap-2 sm:grid-cols-3">
              {PAYMENT_METHODS.map((m) => (
                <button
                  key={m.id}
                  onClick={() => setPaymentMethod(m.id)}
                  className={cn(
                    "flex flex-col items-center gap-1.5 rounded-xl border p-4 text-center transition-colors",
                    paymentMethod === m.id ? "border-primary bg-primary/[0.04] ring-1 ring-primary" : "border-border hover:border-primary/40",
                  )}
                >
                  <m.icon className={cn("size-5", paymentMethod === m.id ? "text-primary" : "text-muted-foreground")} />
                  <span className="text-xs font-semibold">{m.label}</span>
                  <span className="text-[10px] text-muted-foreground">{m.desc}</span>
                </button>
              ))}
            </div>
            <p className="mt-3 text-xs text-muted-foreground">
              Demo checkout — payment is simulated and verified server-side before the order is created.
            </p>
          </section>
        </div>

        {/* Summary */}
        <div className="lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-2xl border bg-card p-5">
            <h2 className="font-semibold">Bill details</h2>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {restaurantName} · {items.reduce((s, i) => s + i.quantity, 0)} items
            </p>
            <div className="mt-4">
              <BillSummary
                subtotalPaise={subtotalPaise}
                deliveryFeePaise={deliveryFeePaise}
                discountPaise={discountPaise}
                totalPaise={totalPaise}
                couponCode={appliedCoupon?.code}
              />
            </div>
            <Button
              size="lg"
              className="mt-5 w-full gap-2 rounded-xl"
              onClick={handlePay}
              disabled={placing || !selectedAddressId}
            >
              {placing ? <Loader2 className="size-4 animate-spin" /> : paymentMethod === "CASH" ? "Place order" : `Pay ${inr(totalPaise)}`}
            </Button>
            {!selectedAddressId && (
              <p className="mt-2 text-center text-xs text-destructive">Select a delivery address to continue</p>
            )}
          </div>
        </div>
      </div>

      {/* Payment modal */}
      <AnimatePresence>
        {payStep !== "idle" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[90] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.92, y: 16, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.92, opacity: 0 }}
              className="w-full max-w-sm rounded-3xl bg-card p-8 text-center shadow-2xl"
            >
              {payStep === "processing" ? (
                <>
                  <div className="relative mx-auto size-16">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }}
                      className="size-16 rounded-full border-4 border-muted border-t-primary"
                    />
                    <Smartphone className="absolute inset-0 m-auto size-6 text-primary" />
                  </div>
                  <h3 className="font-display mt-5 text-lg font-bold">Contacting your bank…</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Processing {inr(totalPaise)} via {paymentMethod}
                  </p>
                </>
              ) : (
                <>
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 300, damping: 18 }}
                    className="mx-auto flex size-16 items-center justify-center rounded-full bg-green-100 text-green-600 dark:bg-green-500/15"
                  >
                    <CheckCircle2 className="size-8" />
                  </motion.div>
                  <h3 className="font-display mt-5 text-lg font-bold">Payment successful</h3>
                  <p className="mt-1 text-sm text-muted-foreground">Placing your order…</p>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
