import { motion } from "framer-motion";
import { Bike, Clock, Star, Store } from "lucide-react";
import { Link } from "react-router";
import { cn } from "@/lib/utils";
import { inr, STATUS_META, type OrderStatus } from "@/lib/format";
import type { Doc } from "@/convex/_generated/dataModel";

export function VegDot({ isVeg, className }: { isVeg: boolean; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex size-4 shrink-0 items-center justify-center rounded-[3px] border-2",
        isVeg ? "border-green-600" : "border-red-600",
        className,
      )}
      title={isVeg ? "Vegetarian" : "Non-vegetarian"}
    >
      <span
        className={cn(
          "size-2 rounded-full",
          isVeg ? "bg-green-600" : "bg-red-600",
        )}
      />
    </span>
  );
}

type Restaurant = Doc<"restaurants"> & { menuCount?: number };

export function RestaurantCard({
  restaurant,
  index = 0,
}: {
  restaurant: Restaurant;
  index?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.4, delay: Math.min(index * 0.05, 0.3), ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }}
      whileHover={{ y: -5 }}
      className="group"
    >
      <Link
        to={`/customer/restaurant/${restaurant._id}`}
        className="block overflow-hidden rounded-2xl border bg-card shadow-sm transition-shadow duration-300 group-hover:shadow-xl"
      >
        <div className="relative aspect-[16/10] overflow-hidden bg-muted">
          {restaurant.imageUrl ? (
            <img
              src={restaurant.imageUrl}
              alt={restaurant.name}
              referrerPolicy="no-referrer"
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary/20 to-accent/20">
              <Store className="size-10 text-primary/40" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
          {!restaurant.isOpen && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-[2px]">
              <span className="rounded-full bg-white/90 px-3 py-1 text-xs font-bold text-foreground">
                Closed right now
              </span>
            </div>
          )}
          {restaurant.isFeatured && (
            <span className="absolute left-3 top-3 rounded-full bg-accent px-2.5 py-1 text-[11px] font-bold text-accent-foreground shadow">
              Featured
            </span>
          )}
          <span className="absolute bottom-3 left-3 flex items-center gap-1 rounded-full bg-white/95 px-2 py-0.5 text-xs font-bold text-foreground shadow dark:bg-zinc-900/95">
            <Star className="size-3 fill-amber-400 text-amber-400" />
            {restaurant.rating.toFixed(1)}
            <span className="font-normal text-muted-foreground">
              ({restaurant.ratingCount.toLocaleString("en-IN")})
            </span>
          </span>
        </div>
        <div className="p-4">
          <h3 className="font-display font-bold tracking-tight">{restaurant.name}</h3>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {restaurant.cuisines.join(" · ")}
          </p>
          <div className="mt-3 flex items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Clock className="size-3.5" /> {restaurant.deliveryTimeMins} min
            </span>
            <span className="flex items-center gap-1">
              <Bike className="size-3.5" /> {inr(restaurant.deliveryFeePaise)}
            </span>
            {typeof restaurant.menuCount === "number" && (
              <span className="ml-auto rounded-full bg-muted px-2 py-0.5 font-medium">
                {restaurant.menuCount} items
              </span>
            )}
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

export function BillSummary({
  subtotalPaise,
  deliveryFeePaise,
  discountPaise,
  totalPaise,
  couponCode,
}: {
  subtotalPaise: number;
  deliveryFeePaise: number;
  discountPaise: number;
  totalPaise: number;
  couponCode?: string | null;
}) {
  return (
    <div className="flex flex-col gap-2 text-sm">
      <div className="flex justify-between text-muted-foreground">
        <span>Item total</span>
        <span>{inr(subtotalPaise)}</span>
      </div>
      <div className="flex justify-between text-muted-foreground">
        <span>Delivery fee</span>
        <span>{deliveryFeePaise === 0 ? "Free" : inr(deliveryFeePaise)}</span>
      </div>
      {discountPaise > 0 && (
        <div className="flex justify-between font-medium text-green-600 dark:text-green-400">
          <span>Coupon {couponCode ? `(${couponCode})` : ""}</span>
          <span>−{inr(discountPaise)}</span>
        </div>
      )}
      <div className="mt-1 flex items-center justify-between border-t pt-2">
        <span className="font-semibold">To pay</span>
        <span className="font-display text-lg font-bold">{inr(totalPaise)}</span>
      </div>
    </div>
  );
}

export function OrderItemsList({
  items,
  status,
}: {
  items: { name: string; quantity: number; pricePaise: number; isVeg: boolean }[];
  status?: OrderStatus;
}) {
  return (
    <ul className="flex flex-col gap-3">
      {items.map((item, i) => (
        <li key={i} className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <VegDot isVeg={item.isVeg} />
            <div>
              <p className="text-sm font-medium">{item.name}</p>
              <p className="text-xs text-muted-foreground">
                × {item.quantity} · {inr(item.pricePaise)}
              </p>
            </div>
          </div>
          <span className="text-sm font-medium tabular-nums">
            {inr(item.pricePaise * item.quantity)}
          </span>
        </li>
      ))}
      {status && (
        <li className="flex items-center justify-between border-t pt-2 text-xs text-muted-foreground">
          <span>Status</span>
          <span className="font-medium text-foreground">{STATUS_META[status].label}</span>
        </li>
      )}
    </ul>
  );
}
