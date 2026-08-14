import { api } from "@/convex/_generated/api";
import { useMutation, useQuery } from "convex/react";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Bike,
  ChefHat,
  CreditCard,
  LayoutDashboard,
  MapPin,
  ReceiptText,
  Search,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Star,
  Timer,
  UtensilsCrossed,
  X,
} from "lucide-react";
import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { QuickBiteLogo, QuickBiteWordmark } from "@/components/Brand";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";
import { ROLE_HOME } from "@/lib/roles";

const fadeUp = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-80px" },
  transition: { duration: 0.55, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] },
};

const CUISINES = [
  { emoji: "🍛", label: "Biryani" },
  { emoji: "🥘", label: "South Indian" },
  { emoji: "🍕", label: "Pizza" },
  { emoji: "🍜", label: "Asian" },
  { emoji: "🍔", label: "Burgers" },
  { emoji: "🥗", label: "Healthy" },
  { emoji: "🥟", label: "Momos" },
  { emoji: "🍰", label: "Desserts" },
];

export default function Landing() {
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const needsBootstrap = useQuery(api.provisioning.needsBootstrap);
  const bootstrap = useMutation(api.provisioning.bootstrapFirstAdmin);
  const seedDemoData = useMutation(api.seed.seedDemoData);
  const [bootstrapOpen, setBootstrapOpen] = useState(false);
  const [adminEmail, setAdminEmail] = useState("");
  const [adminName, setAdminName] = useState("");
  const [bootstrapBusy, setBootstrapBusy] = useState(false);

  const homePath = user?.role ? ROLE_HOME[user.role as keyof typeof ROLE_HOME] : "/auth";

  const handleBootstrap = async (e: React.FormEvent) => {
    e.preventDefault();
    setBootstrapBusy(true);
    try {
      await bootstrap({ email: adminEmail, name: adminName });
      toast.success("Admin account reserved — sign in with that email to continue");
      setBootstrapOpen(false);
      navigate("/auth");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not create admin");
    } finally {
      setBootstrapBusy(false);
    }
  };

  const handleSeed = async () => {
    try {
      const res = await seedDemoData();
      toast.success(res.seeded ? res.message : "Marketplace already has data");
    } catch {
      toast.error("Could not seed data");
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* ---------- Nav ---------- */}
      <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link to="/" className="flex items-center gap-2">
            <QuickBiteLogo />
            <QuickBiteWordmark />
          </Link>
          <nav className="hidden items-center gap-6 text-sm font-medium text-muted-foreground md:flex">
            <a href="#how" className="transition-colors hover:text-foreground">How it works</a>
            <a href="#roles" className="transition-colors hover:text-foreground">Who it's for</a>
            <a href="#features" className="transition-colors hover:text-foreground">Features</a>
          </nav>
          <div className="flex items-center gap-2">
            {isAuthenticated && user?.role ? (
              <Button onClick={() => navigate(homePath)}>
                Go to your space <ArrowRight className="size-4" />
              </Button>
            ) : (
              <Button onClick={() => navigate("/auth")}>
                Sign in <ArrowRight className="size-4" />
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* ---------- Hero ---------- */}
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -top-32 right-[-10%] size-[480px] rounded-full bg-accent/15 blur-3xl" />
          <div className="absolute bottom-[-20%] left-[-8%] size-[420px] rounded-full bg-primary/10 blur-3xl" />
        </div>

        <div className="mx-auto grid w-full max-w-6xl items-center gap-12 px-4 pb-16 pt-14 sm:px-6 lg:grid-cols-2 lg:pt-20">
          <div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 rounded-full border bg-card px-3 py-1 text-xs font-medium text-muted-foreground"
            >
              <Sparkles className="size-3.5 text-accent" />
              India&apos;s freshest food-tech playground
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.05 }}
              className="font-display mt-5 text-4xl font-extrabold leading-[1.08] tracking-tight text-balance sm:text-5xl lg:text-6xl"
            >
              Great food,{" "}
              <span className="text-primary">delivered</span> in a{" "}
              <span className="relative whitespace-nowrap text-accent">
                heartbeat
                <svg viewBox="0 0 200 12" className="absolute -bottom-1 left-0 w-full text-accent/40" preserveAspectRatio="none">
                  <path d="M2 8 Q 50 2 100 6 T 198 5" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
                </svg>
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.12 }}
              className="mt-5 max-w-lg text-base leading-7 text-muted-foreground sm:text-lg"
            >
              Browse hand-picked restaurants, order in seconds, and watch your
              delivery partner approach — live. One platform for customers,
              restaurants and riders.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.18 }}
              className="mt-8 flex flex-wrap items-center gap-3"
            >
              <Button size="lg" className="gap-2 rounded-full px-7" onClick={() => navigate("/auth")}>
                <ShoppingBag className="size-4" />
                Order now
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="gap-2 rounded-full px-7"
                onClick={() => navigate("/auth")}
              >
                Continue as guest
              </Button>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.7, delay: 0.3 }}
              className="mt-10 flex flex-wrap items-center gap-x-8 gap-y-4"
            >
              {[
                { icon: Timer, value: "25 min", label: "avg delivery" },
                { icon: Star, value: "4.4★", label: "partner rating" },
                { icon: MapPin, value: "9 cities", label: "and counting" },
              ].map((s) => (
                <div key={s.label} className="flex items-center gap-2.5">
                  <div className="flex size-10 items-center justify-center rounded-xl bg-card text-primary shadow-sm ring-1 ring-border">
                    <s.icon className="size-5" />
                  </div>
                  <div>
                    <p className="font-display text-lg font-bold leading-none">{s.value}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">{s.label}</p>
                  </div>
                </div>
              ))}
            </motion.div>
          </div>

          {/* Hero visual */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            className="relative hidden lg:block"
          >
            <div className="relative aspect-[4/3] overflow-hidden rounded-[2rem] shadow-2xl ring-1 ring-border">
              <img
                src="https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=1100&q=70"
                alt="Delicious food spread"
                className="h-full w-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />

              {/* floating order card */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5, duration: 0.6 }}
                className="absolute bottom-4 left-4 right-4 rounded-2xl bg-white/95 p-4 shadow-xl backdrop-blur dark:bg-zinc-900/95"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-display text-sm font-bold">Biryani Blues</p>
                    <p className="text-xs text-muted-foreground">Hyderabadi Chicken Dum Biryani × 2</p>
                  </div>
                  <div className="flex items-center gap-1 rounded-full bg-green-100 px-2.5 py-1 text-xs font-semibold text-green-700">
                    <Bike className="size-3.5" /> 8 min away
                  </div>
                </div>
                <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-muted">
                  <motion.div
                    initial={{ width: "0%" }}
                    animate={{ width: "72%" }}
                    transition={{ delay: 0.9, duration: 1.2, ease: "easeOut" }}
                    className="h-full rounded-full bg-primary"
                  />
                </div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ---------- First-run admin setup ---------- */}
      {needsBootstrap && (
        <section className="mx-auto w-full max-w-6xl px-4 pb-4 sm:px-6">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-start justify-between gap-4 rounded-2xl border-2 border-dashed border-primary/40 bg-primary/[0.04] p-5 sm:flex-row sm:items-center"
          >
            <div className="flex items-start gap-3">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                <ShieldCheck className="size-5" />
              </div>
              <div>
                <p className="font-display font-bold">Set up QuickBite</p>
                <p className="mt-0.5 text-sm text-muted-foreground">
                  No admin exists yet. Create the first admin account — admins
                  provision restaurants, partners &amp; coupons.
                </p>
              </div>
            </div>
            <Button className="gap-2" onClick={() => setBootstrapOpen(true)}>
              Create first admin <ArrowRight className="size-4" />
            </Button>
          </motion.div>
        </section>
      )}

      {bootstrapOpen && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm" onClick={() => setBootstrapOpen(false)}>
          <motion.form
            initial={{ opacity: 0, scale: 0.95, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            onSubmit={handleBootstrap}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-2xl bg-card p-6 shadow-2xl"
          >
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-display text-lg font-bold">Bootstrap the first admin</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Enter the email you&apos;ll sign in with. One-time setup — admins
                  can&apos;t be created through public signup.
                </p>
              </div>
              <button type="button" onClick={() => setBootstrapOpen(false)} className="rounded-full p-1 text-muted-foreground hover:bg-muted">
                <X className="size-4" />
              </button>
            </div>
            <div className="mt-5 flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="admin-name">Full name</Label>
                <Input id="admin-name" value={adminName} onChange={(e) => setAdminName(e.target.value)} placeholder="e.g. Aisha Khan" required />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="admin-email">Email</Label>
                <Input id="admin-email" type="email" value={adminEmail} onChange={(e) => setAdminEmail(e.target.value)} placeholder="you@company.com" required />
              </div>
              <Button type="submit" disabled={bootstrapBusy} className="w-full">
                {bootstrapBusy ? "Reserving…" : "Reserve admin account"}
              </Button>
              <p className="text-xs text-muted-foreground">
                Next: sign in with this email via the one-time code and you&apos;ll land in
                the admin panel.
              </p>
            </div>
          </motion.form>
        </div>
      )}

      {/* ---------- Role selection ---------- */}
      <section id="roles" className="mx-auto w-full max-w-6xl px-4 py-20 sm:px-6">
        <motion.div {...fadeUp} className="text-center">
          <p className="text-xs font-semibold uppercase tracking-widest text-accent">One platform, three roles</p>
          <h2 className="font-display mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl">
            Pick your seat at the table
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-sm text-muted-foreground sm:text-base">
            Customers, restaurants and riders share one backend and one database —
            each with their own dedicated, role-locked experience.
          </p>
        </motion.div>

        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {[
            {
              icon: ShoppingBag,
              title: "For food lovers",
              desc: "Browse restaurants, order in seconds, and track your delivery partner live on the map from kitchen to doorstep.",
              points: ["Search & cuisine filters", "Live order tracking", "Coupons & secure checkout"],
              to: "/auth",
              cta: "Start ordering",
              accent: "text-accent bg-accent/10",
            },
            {
              icon: LayoutDashboard,
              title: "For admins",
              desc: "Run the whole marketplace: approve orders, manage restaurants & menus, activate riders, and watch analytics.",
              points: ["Order acceptance & dispatch", "Restaurant + menu CRUD", "Revenue analytics"],
              to: "/auth",
              cta: "Open admin console",
              accent: "text-primary bg-primary/10",
            },
            {
              icon: Bike,
              title: "For delivery partners",
              desc: "Get delivery requests in real time, ride pickup → drop, and track every rupee you earn.",
              points: ["Live request cards", "One-tap status updates", "Earnings dashboard"],
              to: "/auth",
              cta: "Start delivering",
              accent: "text-violet-600 bg-violet-500/10 dark:text-violet-400",
            },
          ].map((role, i) => (
            <motion.div
              key={role.title}
              initial={{ opacity: 0, y: 28 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.5, delay: i * 0.08, ease: [0.16, 1, 0.3, 1] }}
              whileHover={{ y: -6 }}
              className="group relative flex flex-col rounded-2xl border bg-card p-6 shadow-sm transition-shadow hover:shadow-xl"
            >
              <div className={`flex size-12 items-center justify-center rounded-xl ${role.accent}`}>
                <role.icon className="size-6" />
              </div>
              <h3 className="font-display mt-4 text-lg font-bold">{role.title}</h3>
              <p className="mt-2 flex-1 text-sm leading-6 text-muted-foreground">{role.desc}</p>
              <ul className="mt-4 flex flex-col gap-1.5">
                {role.points.map((p) => (
                  <li key={p} className="flex items-center gap-2 text-sm">
                    <span className="size-1.5 rounded-full bg-primary" />
                    {p}
                  </li>
                ))}
              </ul>
              <Button
                variant="ghost"
                className="mt-6 w-full justify-between border"
                onClick={() => navigate(role.to)}
              >
                {role.cta} <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
              </Button>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ---------- How it works ---------- */}
      <section id="how" className="border-y bg-muted/40">
        <div className="mx-auto w-full max-w-6xl px-4 py-20 sm:px-6">
          <motion.div {...fadeUp} className="text-center">
            <p className="text-xs font-semibold uppercase tracking-widest text-accent">How it works</p>
            <h2 className="font-display mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl">
              From craving to doorstep in four steps
            </h2>
          </motion.div>
          <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { icon: Search, step: "01", title: "Discover", desc: "Search restaurants, filter by cuisine, and compare ratings, fees and delivery times." },
              { icon: ReceiptText, step: "02", title: "Order", desc: "Build your cart, apply a coupon and pay in a couple of taps." },
              { icon: ChefHat, step: "03", title: "We cook & pack", desc: "The kitchen accepts your order and preps it fresh — you watch every status change." },
              { icon: Bike, step: "04", title: "Track live", desc: "A rider picks up your food and you watch them approach in real time." },
            ].map((s, i) => (
              <motion.div
                key={s.title}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.5, delay: i * 0.08 }}
                className="relative"
              >
                <span className="font-display absolute -top-6 right-0 text-6xl font-extrabold text-foreground/[0.06]">{s.step}</span>
                <div className="flex size-11 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
                  <s.icon className="size-5" />
                </div>
                <h3 className="font-display mt-4 font-bold">{s.title}</h3>
                <p className="mt-1.5 text-sm leading-6 text-muted-foreground">{s.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ---------- Cuisine strip ---------- */}
      <section className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-2xl font-extrabold tracking-tight">What are you craving?</h2>
          <Button variant="ghost" className="hidden gap-1 sm:flex" onClick={() => navigate("/auth")}>
            Browse all restaurants <ArrowRight className="size-4" />
          </Button>
        </div>
        <div className="mt-6 grid grid-cols-4 gap-3 sm:grid-cols-8">
          {CUISINES.map((c, i) => (
            <motion.button
              key={c.label}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.04, duration: 0.35 }}
              whileHover={{ y: -4 }}
              onClick={() => navigate("/auth")}
              className="flex flex-col items-center gap-1.5 rounded-2xl border bg-card p-3 transition-shadow hover:shadow-md"
            >
              <span className="text-2xl">{c.emoji}</span>
              <span className="text-xs font-medium">{c.label}</span>
            </motion.button>
          ))}
        </div>
      </section>

      {/* ---------- Features ---------- */}
      <section id="features" className="border-y bg-muted/40">
        <div className="mx-auto w-full max-w-6xl px-4 py-20 sm:px-6">
          <motion.div {...fadeUp} className="text-center">
            <p className="text-xs font-semibold uppercase tracking-widest text-accent">Built to be lived in</p>
            <h2 className="font-display mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl">
              Real-time, end to end
            </h2>
          </motion.div>
          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { icon: MapPin, title: "Live delivery tracking", desc: "Every GPS ping from the rider moves the marker on your order screen — no refresh needed." },
              { icon: ShieldCheck, title: "Role-locked access", desc: "Customers, admins and riders get hard 403s outside their panel. No hiding buttons — real enforcement." },
              { icon: CreditCard, title: "Payments you can trust", desc: "Checkout is verified server-side before an order is confirmed. Razorpay-ready architecture." },
              { icon: Timer, title: "Coupons that just work", desc: "Flat and percentage discounts, minimum-order rules and expiry — applied automatically." },
              { icon: LayoutDashboard, title: "Admin analytics", desc: "Orders and revenue over time, top restaurants, status distribution — live from the database." },
              { icon: Sparkles, title: "Delight in the details", desc: "Animated steppers, confetti on delivery, count-up stats, request countdown rings." },
            ].map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.45, delay: (i % 3) * 0.07 }}
                className="rounded-2xl border bg-card p-6 shadow-sm"
              >
                <div className="flex size-10 items-center justify-center rounded-xl bg-accent/10 text-accent">
                  <f.icon className="size-5" />
                </div>
                <h3 className="mt-4 font-semibold">{f.title}</h3>
                <p className="mt-1.5 text-sm leading-6 text-muted-foreground">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ---------- CTA ---------- */}
      <section className="mx-auto w-full max-w-6xl px-4 py-20 sm:px-6">
        <motion.div
          {...fadeUp}
          className="relative overflow-hidden rounded-3xl bg-primary px-6 py-14 text-center text-primary-foreground sm:px-12"
        >
          <div className="pointer-events-none absolute inset-0 opacity-20">
            <div className="absolute -left-16 top-[-40%] size-72 rounded-full bg-accent blur-3xl" />
            <div className="absolute bottom-[-50%] right-[-10%] size-80 rounded-full bg-accent blur-3xl" />
          </div>
          <div className="relative">
            <h2 className="font-display text-3xl font-extrabold tracking-tight text-balance sm:text-4xl">
              Hungry? Your next meal is minutes away.
            </h2>
            <p className="mx-auto mt-3 max-w-md text-sm text-primary-foreground/80 sm:text-base">
              Sign in as a customer, admin or rider — the marketplace seeds itself
              with real restaurants and menus.
            </p>
            <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
              <Button
                size="lg"
                className="gap-2 rounded-full bg-accent text-accent-foreground hover:bg-accent/90"
                onClick={() => navigate("/auth")}
              >
                Get started <ArrowRight className="size-4" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="gap-2 rounded-full border-primary-foreground/30 bg-transparent text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground"
                onClick={handleSeed}
              >
                Seed demo data
              </Button>
            </div>
          </div>
        </motion.div>
      </section>

      {/* ---------- Footer ---------- */}
      <footer className="border-t bg-muted/40">
        <div className="mx-auto flex w-full max-w-6xl flex-col items-center justify-between gap-4 px-4 py-8 sm:flex-row sm:px-6">
          <div className="flex items-center gap-2">
            <QuickBiteLogo className="size-7" />
            <QuickBiteWordmark />
          </div>
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} QuickBite. Built for the love of good food. 🍜
          </p>
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <a href="#roles" className="hover:text-foreground">Roles</a>
            <a href="#how" className="hover:text-foreground">How it works</a>
            <Link to="/auth" className="hover:text-foreground">Sign in</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
