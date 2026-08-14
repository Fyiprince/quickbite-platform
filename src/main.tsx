import "@vly-ai/integrations";
import { Toaster } from "@/components/ui/sonner";
import { RequireRole } from "@/components/RequireAuth";
import { VlyToolbar } from "../vly-toolbar-readonly.tsx";
import { ConvexAuthProvider } from "@convex-dev/auth/react";
import { ConvexReactClient } from "convex/react";
import React, { StrictMode, useEffect, lazy, Suspense } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Navigate, Route, Routes, useLocation } from "react-router";
import { CartProvider } from "@/store/cart";
import { AppShell } from "@/components/AppShell";
import { CustomerShell } from "@/components/CustomerShell";
import {
  BarChart3,
  Bike,
  ClipboardList,
  LayoutDashboard,
  ReceiptText,
  Settings,
  ShoppingBag,
  Tag,
  Users,
  UtensilsCrossed,
  Wallet,
  History,
  Store,
} from "lucide-react";
import "./index.css";

// Lazy load route components for better code splitting
const Landing = lazy(() => import("./pages/Landing.tsx"));
const AuthPage = lazy(() => import("./pages/Auth.tsx"));
const NotFound = lazy(() => import("./pages/NotFound.tsx"));

// Customer pages
const CustomerHome = lazy(() => import("./pages/customer/Home.tsx"));
const RestaurantDetail = lazy(() => import("./pages/customer/RestaurantDetail.tsx"));
const CartPage = lazy(() => import("./pages/customer/CartPage.tsx"));
const Checkout = lazy(() => import("./pages/customer/Checkout.tsx"));
const Orders = lazy(() => import("./pages/customer/Orders.tsx"));
const OrderDetail = lazy(() => import("./pages/customer/OrderDetail.tsx"));
const Profile = lazy(() => import("./pages/customer/Profile.tsx"));
const Addresses = lazy(() => import("./pages/customer/Addresses.tsx"));

// Admin pages
const AdminDashboard = lazy(() => import("./pages/admin/Dashboard.tsx"));
const AdminOrders = lazy(() => import("./pages/admin/Orders.tsx"));
const AdminRestaurants = lazy(() => import("./pages/admin/Restaurants.tsx"));
const AdminRestaurantMenu = lazy(() => import("./pages/admin/RestaurantMenu.tsx"));
const AdminCustomers = lazy(() => import("./pages/admin/Customers.tsx"));
const AdminDeliveryPartners = lazy(() => import("./pages/admin/DeliveryPartners.tsx"));
const AdminCoupons = lazy(() => import("./pages/admin/Coupons.tsx"));
const AdminAnalytics = lazy(() => import("./pages/admin/Analytics.tsx"));
const AdminSettings = lazy(() => import("./pages/admin/Settings.tsx"));

// Delivery pages
const DeliveryDashboard = lazy(() => import("./pages/delivery/Dashboard.tsx"));
const DeliveryActiveOrder = lazy(() => import("./pages/delivery/ActiveOrder.tsx"));
const DeliveryHistory = lazy(() => import("./pages/delivery/History.tsx"));
const DeliveryEarnings = lazy(() => import("./pages/delivery/Earnings.tsx"));
const DeliveryProfile = lazy(() => import("./pages/delivery/Profile.tsx"));

function RouteLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-pulse text-muted-foreground">Loading…</div>
    </div>
  );
}

/** Silent error boundary — if VlyToolbar crashes it renders nothing instead of
 *  crashing the whole app (e.g. hook errors in WebContainer environment). */
class ToolbarErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean }
> {
  state = { hasError: false };
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch(err: Error) {
    console.warn("[VlyToolbar] Caught error, toolbar disabled:", err.message);
  }
  render() {
    return this.state.hasError ? null : this.props.children;
  }
}

/** Hard guard so runtime errors never leave the preview as a blank page. */
class RootErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; message: string; stack: string }
> {
  state = { hasError: false, message: "", stack: "" };
  static getDerivedStateFromError(error: Error) {
    return {
      hasError: true,
      message: error.message || "Unknown runtime error",
      stack: error.stack || "",
    };
  }
  componentDidCatch(err: Error) {
    console.error("[WebContainer preview] Root crash:", err);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-background text-foreground p-6">
          <div className="max-w-lg text-center">
            <p className="text-sm font-semibold">Preview runtime error</p>
            <p className="mt-2 text-xs text-muted-foreground break-words">
              {this.state.message}
            </p>
            {this.state.stack && (
              <pre className="mt-3 text-left text-[10px] leading-4 text-muted-foreground/80 max-h-40 overflow-auto rounded border border-border/60 p-2">
                {this.state.stack}
              </pre>
            )}
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

const convex = new ConvexReactClient(import.meta.env.VITE_CONVEX_URL as string);

function RouteSyncer() {
  const location = useLocation();
  useEffect(() => {
    window.parent.postMessage(
      { type: "iframe-route-change", path: location.pathname },
      "*",
    );
  }, [location.pathname]);

  useEffect(() => {
    function handleMessage(event: MessageEvent) {
      if (event.data?.type === "navigate") {
        if (event.data.direction === "back") window.history.back();
        if (event.data.direction === "forward") window.history.forward();
      }
    }
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  return null;
}

const adminNav = [
  { to: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/admin/orders", label: "Orders", icon: ClipboardList },
  { to: "/admin/restaurants", label: "Restaurants", icon: Store },
  { to: "/admin/customers", label: "Customers", icon: Users },
  { to: "/admin/delivery-partners", label: "Delivery Partners", icon: Bike },
  { to: "/admin/coupons", label: "Coupons", icon: Tag },
  { to: "/admin/analytics", label: "Analytics", icon: BarChart3 },
  { to: "/admin/settings", label: "Settings", icon: Settings },
];

const deliveryNav = [
  { to: "/delivery/dashboard", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/delivery/active-order", label: "Active Order", icon: ShoppingBag },
  { to: "/delivery/history", label: "History", icon: History },
  { to: "/delivery/earnings", label: "Earnings", icon: Wallet },
  { to: "/delivery/profile", label: "Profile", icon: Users },
];

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <RootErrorBoundary>
      <ToolbarErrorBoundary>
        <VlyToolbar />
      </ToolbarErrorBoundary>
      <ConvexAuthProvider client={convex}>
        <BrowserRouter>
          <RouteSyncer />
          <CartProvider>
            <Suspense fallback={<RouteLoading />}>
              <Routes>
                <Route path="/" element={<Landing />} />
                <Route path="/auth" element={<AuthPage />} />

                {/* ---------- CUSTOMER PANEL ---------- */}
                <Route
                  path="/customer"
                  element={
                    <RequireRole role="CUSTOMER">
                      <CustomerShell />
                    </RequireRole>
                  }
                >
                  <Route index element={<Navigate to="/customer/home" replace />} />
                  <Route path="home" element={<CustomerHome />} />
                  <Route path="restaurant/:id" element={<RestaurantDetail />} />
                  <Route path="cart" element={<CartPage />} />
                  <Route path="checkout" element={<Checkout />} />
                  <Route path="orders" element={<Orders />} />
                  <Route path="orders/:id" element={<OrderDetail />} />
                  <Route path="profile" element={<Profile />} />
                  <Route path="addresses" element={<Addresses />} />
                </Route>

                {/* ---------- ADMIN PANEL ---------- */}
                <Route
                  path="/admin"
                  element={
                    <RequireRole role="ADMIN">
                      <AppShell nav={adminNav} title="Admin" subtitle="Marketplace control center" />
                    </RequireRole>
                  }
                >
                  <Route index element={<Navigate to="/admin/dashboard" replace />} />
                  <Route path="dashboard" element={<AdminDashboard />} />
                  <Route path="orders" element={<AdminOrders />} />
                  <Route path="restaurants" element={<AdminRestaurants />} />
                  <Route path="restaurants/:id/menu" element={<AdminRestaurantMenu />} />
                  <Route path="customers" element={<AdminCustomers />} />
                  <Route path="delivery-partners" element={<AdminDeliveryPartners />} />
                  <Route path="coupons" element={<AdminCoupons />} />
                  <Route path="analytics" element={<AdminAnalytics />} />
                  <Route path="settings" element={<AdminSettings />} />
                </Route>

                {/* ---------- DELIVERY PANEL ---------- */}
                <Route
                  path="/delivery"
                  element={
                    <RequireRole role="DELIVERY">
                      <AppShell nav={deliveryNav} title="Partner" subtitle="Ride. Deliver. Earn." />
                    </RequireRole>
                  }
                >
                  <Route index element={<Navigate to="/delivery/dashboard" replace />} />
                  <Route path="dashboard" element={<DeliveryDashboard />} />
                  <Route path="active-order" element={<DeliveryActiveOrder />} />
                  <Route path="history" element={<DeliveryHistory />} />
                  <Route path="earnings" element={<DeliveryEarnings />} />
                  <Route path="profile" element={<DeliveryProfile />} />
                </Route>

                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </CartProvider>
          <Toaster />
        </BrowserRouter>
      </ConvexAuthProvider>
    </RootErrorBoundary>
  </StrictMode>,
);
