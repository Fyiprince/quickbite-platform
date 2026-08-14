import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, ShoppingCart, Trash2, UtensilsCrossed } from "lucide-react";
import { useNavigate } from "react-router";
import { BillSummary, VegDot } from "@/components/food";
import { QuantityStepper } from "@/components/QuantityStepper";
import { Button } from "@/components/ui/button";
import { useCart } from "@/store/cart";
import { inr } from "@/lib/format";
import { toast } from "sonner";

export default function CartPage() {
  const { items, restaurantName, restaurantId, subtotalPaise, setQuantity, removeItem, clear } = useCart();
  const navigate = useNavigate();

  const deliveryFeePaise = 0; // real fee comes from the restaurant at checkout
  const totalPaise = subtotalPaise + deliveryFeePaise;

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-3xl border border-dashed py-20 text-center">
        <div className="flex size-16 items-center justify-center rounded-2xl bg-muted">
          <ShoppingCart className="size-8 text-muted-foreground" />
        </div>
        <p className="font-display text-lg font-bold">Your cart is empty</p>
        <p className="max-w-xs text-sm text-muted-foreground">
          Hungry? Browse the restaurants and add something delicious.
        </p>
        <Button className="mt-2" onClick={() => navigate("/customer/home")}>
          Explore restaurants <ArrowRight className="size-4" />
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-extrabold tracking-tight">Your cart</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            From <span className="font-medium text-foreground">{restaurantName}</span>
          </p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="text-destructive hover:text-destructive"
          onClick={() => {
            clear();
            toast("Cart cleared");
          }}
        >
          <Trash2 className="size-4" /> Clear
        </Button>
      </div>

      <div className="overflow-hidden rounded-2xl border bg-card">
        <AnimatePresence mode="popLayout">
          {items.map((item) => (
            <motion.div
              key={item.menuItemId}
              layout
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: -24 }}
              className="flex items-center gap-4 border-b p-4 last:border-b-0"
            >
              <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-muted">
                <UtensilsCrossed className="size-5 text-muted-foreground" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <VegDot isVeg={item.isVeg} />
                  <p className="truncate text-sm font-medium">{item.name}</p>
                </div>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {inr(item.pricePaise)} each
                </p>
              </div>
              <QuantityStepper quantity={item.quantity} onChange={(q) => setQuantity(item.menuItemId, q)} />
              <span className="w-16 text-right text-sm font-semibold tabular-nums">
                {inr(item.pricePaise * item.quantity)}
              </span>
              <button
                onClick={() => removeItem(item.menuItemId)}
                className="text-muted-foreground transition-colors hover:text-destructive"
                aria-label={`Remove ${item.name}`}
              >
                <Trash2 className="size-4" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <div className="rounded-2xl border bg-card p-5">
        <BillSummary
          subtotalPaise={subtotalPaise}
          deliveryFeePaise={deliveryFeePaise}
          discountPaise={0}
          totalPaise={totalPaise}
        />
        <p className="mt-2 text-xs text-muted-foreground">
          Delivery fee &amp; coupons are applied at checkout.
        </p>
        <Button
          size="lg"
          className="mt-4 w-full gap-2 rounded-xl"
          onClick={() => navigate("/customer/checkout")}
          disabled={!restaurantId}
        >
          Proceed to checkout <ArrowRight className="size-4" />
        </Button>
      </div>
    </div>
  );
}
