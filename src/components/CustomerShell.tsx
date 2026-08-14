import { motion } from "framer-motion";
import { MapPin, ReceiptText, ShoppingCart, UtensilsCrossed } from "lucide-react";
import { NavLink, Outlet, useNavigate } from "react-router";
import { QuickBiteLogo, QuickBiteWordmark } from "@/components/Brand";
import { NotificationBell } from "@/components/NotificationBell";
import { UserMenu } from "@/components/UserMenu";
import { useCart } from "@/store/cart";
import { cn } from "@/lib/utils";
import { inr } from "@/lib/format";

const NAV = [
  { to: "/customer/home", label: "Home", icon: UtensilsCrossed, end: true },
  { to: "/customer/orders", label: "Orders", icon: ReceiptText, end: false },
  { to: "/customer/addresses", label: "Addresses", icon: MapPin, end: false },
];

export function CustomerShell() {
  const { count, subtotalPaise, bump } = useCart();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b bg-background/90 backdrop-blur">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-3 px-4 sm:px-6">
          <NavLink to="/customer/home" className="flex items-center gap-2">
            <QuickBiteLogo />
            <QuickBiteWordmark />
          </NavLink>

          <nav className="hidden items-center gap-1 md:flex">
            {NAV.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  cn(
                    "flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground",
                  )
                }
              >
                <item.icon className="size-4" />
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="flex items-center gap-1">
            <NotificationBell />
            <motion.button
              key={bump}
              initial={bump > 0 ? { scale: 1 } : false}
              animate={bump > 0 ? { scale: [1, 1.25, 1] } : {}}
              transition={{ duration: 0.35, ease: "easeOut" }}
              onClick={() => navigate("/customer/cart")}
              className="relative flex size-10 items-center justify-center rounded-full text-foreground transition-colors hover:bg-muted"
              aria-label={`Cart with ${count} items`}
            >
              <ShoppingCart className="size-5" />
              {count > 0 && (
                <motion.span
                  key={`badge-${count}`}
                  initial={{ scale: 0.4 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 500, damping: 18 }}
                  className="absolute -right-0.5 -top-0.5 flex size-4 min-w-4 items-center justify-center rounded-full bg-accent px-0.5 text-[10px] font-bold text-accent-foreground ring-2 ring-background"
                >
                  {count}
                </motion.span>
              )}
            </motion.button>
            <UserMenu />
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="mx-auto w-full max-w-6xl px-4 pb-28 pt-6 sm:px-6 md:pt-8">
        <Outlet />
      </main>

      {/* Mobile cart bar */}
      {count > 0 && (
        <motion.div
          initial={{ y: 80 }}
          animate={{ y: 0 }}
          transition={{ type: "spring", stiffness: 320, damping: 30 }}
          className="fixed inset-x-0 bottom-0 z-40 p-3 md:hidden"
        >
          <button
            onClick={() => navigate("/customer/cart")}
            className="flex w-full items-center justify-between rounded-2xl bg-primary px-5 py-3.5 text-primary-foreground shadow-xl shadow-primary/25"
          >
            <span className="flex items-center gap-2 text-sm font-semibold">
              <ShoppingCart className="size-4" />
              {count} item{count > 1 ? "s" : ""}
            </span>
            <span className="text-sm font-bold">View cart · {inr(subtotalPaise)}</span>
          </button>
        </motion.div>
      )}
    </div>
  );
}
