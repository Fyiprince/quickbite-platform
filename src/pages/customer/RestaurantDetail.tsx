import { api } from "@/convex/_generated/api";
import { useQuery } from "convex/react";
import { motion } from "framer-motion";
import { ArrowLeft, Bike, Clock, ShoppingCart, Star, Store } from "lucide-react";
import { useState } from "react";
import { useNavigate, useParams } from "react-router";
import { VegDot } from "@/components/food";
import { QuantityStepper } from "@/components/QuantityStepper";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { useCart } from "@/store/cart";
import { inr } from "@/lib/format";

export default function RestaurantDetail() {
  const { id } = useParams<{ id: string }>();
  const data = useQuery(api.customers.getRestaurant, { restaurantId: id! });
  const { addItem, setQuantity, items, count, subtotalPaise, restaurantId } = useCart();
  const navigate = useNavigate();
  const [fly, setFly] = useState<{ x: number; y: number } | null>(null);

  if (!data) {
    return (
      <div className="flex flex-col gap-6">
        <Skeleton className="h-56 rounded-3xl" />
        <Skeleton className="h-8 w-1/2" />
        <Skeleton className="h-40 rounded-2xl" />
      </div>
    );
  }

  const { restaurant, grouped } = data;
  const categories = Object.keys(grouped);

  const handleAdd = (e: React.MouseEvent, menuItemId: string) => {
    const item = grouped
      .values()
      .flat()
      .find((i) => i._id === menuItemId);
    if (!item || !item.isAvailable) return;

    addItem(
      {
        menuItemId: item._id,
        name: item.name,
        pricePaise: item.pricePaise,
        isVeg: item.isVeg,
      },
      { id: restaurant._id, name: restaurant.name },
    );

    // fly-to-cart
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    setFly({ x: rect.left + rect.width / 2, y: rect.top });
    window.setTimeout(() => setFly(null), 700);
    toast(`${item.name} added to cart`, { duration: 1200 });
  };

  const cartForThisRestaurant = restaurantId === restaurant._id;

  return (
    <div className="flex flex-col gap-8">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-3xl">
        <div className="relative aspect-[21/9] min-h-52 w-full bg-muted sm:aspect-[3/1]">
          {restaurant.imageUrl ? (
            <img
              src={restaurant.imageUrl}
              alt={restaurant.name}
              referrerPolicy="no-referrer"
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary/25 to-accent/25">
              <Store className="size-14 text-primary/40" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
          <button
            onClick={() => navigate(-1)}
            className="absolute left-4 top-4 flex size-9 items-center justify-center rounded-full bg-white/90 text-foreground shadow backdrop-blur transition-transform hover:scale-105"
            aria-label="Back"
          >
            <ArrowLeft className="size-4" />
          </button>
          {!restaurant.isOpen && (
            <span className="absolute right-4 top-4 rounded-full bg-destructive px-3 py-1 text-xs font-bold text-white">
              Closed
            </span>
          )}
          <div className="absolute bottom-4 left-4 right-4 sm:bottom-6 sm:left-6">
            <div className="flex flex-wrap items-center gap-2">
              {restaurant.cuisines.map((c) => (
                <span key={c} className="rounded-full bg-white/15 px-2.5 py-0.5 text-[11px] font-medium text-white backdrop-blur">
                  {c}
                </span>
              ))}
            </div>
            <h1 className="font-display mt-2 text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
              {restaurant.name}
            </h1>
            <p className="mt-1 line-clamp-1 max-w-2xl text-xs text-white/80 sm:text-sm">
              {restaurant.description}
            </p>
            <div className="mt-2.5 flex flex-wrap items-center gap-3 text-xs font-medium text-white">
              <span className="flex items-center gap-1 rounded-full bg-white/15 px-2 py-0.5 backdrop-blur">
                <Star className="size-3 fill-amber-400 text-amber-400" />
                {restaurant.rating.toFixed(1)} ({restaurant.ratingCount.toLocaleString("en-IN")})
              </span>
              <span className="flex items-center gap-1">
                <Clock className="size-3.5" /> {restaurant.deliveryTimeMins} min
              </span>
              <span className="flex items-center gap-1">
                <Bike className="size-3.5" /> {inr(restaurant.deliveryFeePaise)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Menu */}
      <div className="flex flex-col gap-10">
        {categories.map((category) => (
          <section key={category}>
            <h2 className="font-display flex items-center gap-3 text-lg font-bold tracking-tight">
              {category}
              <span className="h-px flex-1 bg-border" />
            </h2>
            <ul className="mt-4 flex flex-col divide-y">
              {grouped[category].map((item) => {
                const inCart = cartForThisRestaurant
                  ? items.find((i) => i.menuItemId === item._id)?.quantity ?? 0
                  : 0;
                return (
                  <motion.li
                    key={item._id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-4 py-4"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <VegDot isVeg={item.isVeg} />
                        {item.isPopular && (
                          <span className="rounded-full bg-accent/15 px-2 py-0.5 text-[10px] font-bold text-accent">
                            Bestseller
                          </span>
                        )}
                        {!item.isAvailable && (
                          <span className="text-[10px] font-semibold uppercase text-muted-foreground">
                            Sold out
                          </span>
                        )}
                      </div>
                      <p className="mt-1 font-medium">{item.name}</p>
                      {item.description && (
                        <p className="mt-0.5 text-xs leading-5 text-muted-foreground">
                          {item.description}
                        </p>
                      )}
                      <p className="mt-1 text-sm font-semibold tabular-nums">
                        {inr(item.pricePaise)}
                      </p>
                    </div>
                    {item.isAvailable && (
                      <div className="shrink-0">
                        {inCart === 0 ? (
                          <motion.button
                            whileTap={{ scale: 0.9 }}
                            onClick={(e) => handleAdd(e, item._id)}
                            className="flex h-9 items-center gap-1.5 rounded-full border-2 border-primary bg-primary/5 px-4 text-sm font-bold text-primary transition-colors hover:bg-primary hover:text-primary-foreground"
                          >
                            ADD
                          </motion.button>
                        ) : (
                          <QuantityStepper
                            quantity={inCart}
                            onChange={(q) => setQuantity(item._id, q)}
                          />
                        )}
                      </div>
                    )}
                  </motion.li>
                );
              })}
            </ul>
          </section>
        ))}
      </div>

      {/* Sticky cart bar */}
      {cartForThisRestaurant && count > 0 && (
        <div className="fixed inset-x-0 bottom-0 z-40 p-3">
          <motion.button
            initial={{ y: 80 }}
            animate={{ y: 0 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate("/customer/cart")}
            className="mx-auto flex w-full max-w-xl items-center justify-between rounded-2xl bg-primary px-6 py-4 text-primary-foreground shadow-xl shadow-primary/30"
          >
            <span className="flex items-center gap-2 text-sm font-semibold">
              <ShoppingCart className="size-4" />
              {count} item{count > 1 ? "s" : ""}
            </span>
            <span className="font-display font-bold">View cart · {inr(subtotalPaise)}</span>
          </motion.button>
        </div>
      )}

      {/* Fly animation dot */}
      {fly && (
        <motion.div
          initial={{ x: fly.x, y: fly.y, scale: 1, opacity: 1 }}
          animate={{
            x: window.innerWidth - 44,
            y: 24,
            scale: 0.4,
            opacity: 0.9,
          }}
          transition={{ duration: 0.55, ease: [0.3, 0.7, 0.4, 1] }}
          className="pointer-events-none fixed z-[90] size-5 rounded-full bg-primary"
          style={{ left: 0, top: 0 }}
        />
      )}
    </div>
  );
}
