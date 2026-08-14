import { api } from "@/convex/_generated/api";
import { useMutation, useQuery } from "convex/react";
import { motion } from "framer-motion";
import {
  ArrowRight,
  ChefHat,
  Loader2,
  Search,
  SlidersHorizontal,
  UserRound,
} from "lucide-react";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { RestaurantCard } from "@/components/food";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";

const CUISINE_EMOJIS: Record<string, string> = {
  Biryani: "🍛", "South Indian": "🥘", Italian: "🍕", Chinese: "🍜", Asian: "🍜",
  Burgers: "🍔", "Fast Food": "🍔", "North Indian": "🍛", Mughlai: "🍛", Kebabs: "🍢",
  Salads: "🥗", Healthy: "🥗", Bowls: "🥗", Momos: "🥟", Nepali: "🥟", Tibetan: "🥟",
  Desserts: "🍰", Bakery: "🥐", Shakes: "🥤", "Dosa": "🫓", Coffee: "☕", Pizza: "🍕", Pasta: "🍝", Curry: "🍛", Tandoori: "🍢",
};

export default function CustomerHome() {
  const { user } = useAuth();
  const restaurants = useQuery(api.customers.listRestaurants);
  const completeProfile = useMutation(api.provisioning.completeProfile);
  const navigate = useNavigate();

  const [search, setSearch] = useState("");
  const [activeCuisine, setActiveCuisine] = useState<string | null>(null);
  const [sort, setSort] = useState<"rating" | "time" | "fee">("rating");
  const [profileBusy, setProfileBusy] = useState(false);
  const [nameDraft, setNameDraft] = useState("");
  const [phoneDraft, setPhoneDraft] = useState("");

  const needsProfile = !!user && !user.isAnonymous && !user.name;

  const allCuisines = useMemo(() => {
    const set = new Set<string>();
    restaurants?.forEach((r) => r.cuisines.forEach((c) => set.add(c)));
    return Array.from(set).sort();
  }, [restaurants]);

  const filtered = useMemo(() => {
    if (!restaurants) return [];
    let list = restaurants.filter(
      (r) =>
        (!search.trim() ||
          r.name.toLowerCase().includes(search.toLowerCase()) ||
          r.cuisines.some((c) => c.toLowerCase().includes(search.toLowerCase()))) &&
        (!activeCuisine || r.cuisines.includes(activeCuisine)),
    );
    if (sort === "rating") list = [...list].sort((a, b) => b.rating - a.rating);
    if (sort === "time") list = [...list].sort((a, b) => a.deliveryTimeMins - b.deliveryTimeMins);
    if (sort === "fee") list = [...list].sort((a, b) => a.deliveryFeePaise - b.deliveryFeePaise);
    return list;
  }, [restaurants, search, activeCuisine, sort]);

  const featured = restaurants?.filter((r) => r.isFeatured) ?? [];

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileBusy(true);
    try {
      await completeProfile({ name: nameDraft, phone: phoneDraft });
    } finally {
      setProfileBusy(false);
    }
  };

  return (
    <div className="flex flex-col gap-8">
      {/* Profile completion */}
      {needsProfile && (
        <motion.form
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          onSubmit={handleSaveProfile}
          className="flex flex-col gap-3 rounded-2xl border border-primary/25 bg-primary/[0.05] p-4 sm:flex-row sm:items-center"
        >
          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <UserRound className="size-5" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold">Tell us who&apos;s ordering</p>
            <p className="text-xs text-muted-foreground">
              Add your name so restaurants and riders can find you.
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Input
              placeholder="Your name"
              value={nameDraft}
              onChange={(e) => setNameDraft(e.target.value)}
              className="sm:w-44"
            />
            <Input
              placeholder="Phone (optional)"
              value={phoneDraft}
              onChange={(e) => setPhoneDraft(e.target.value)}
              className="sm:w-40"
            />
            <Button type="submit" disabled={profileBusy || !nameDraft.trim()}>
              {profileBusy && <Loader2 className="size-4 animate-spin" />}
              Save
            </Button>
          </div>
        </motion.form>
      )}

      {/* Hero search */}
      <section className="relative overflow-hidden rounded-3xl bg-primary px-6 py-10 text-primary-foreground sm:px-10">
        <div className="pointer-events-none absolute inset-0 opacity-15">
          <div className="absolute -right-10 -top-16 size-64 rounded-full bg-accent blur-3xl" />
          <div className="absolute -bottom-20 left-1/3 size-56 rounded-full bg-accent blur-3xl" />
        </div>
        <div className="relative">
          <h1 className="font-display text-2xl font-extrabold tracking-tight sm:text-3xl">
            What are you hungry for, {user?.name ? user.name.split(" ")[0] : "today"}?
          </h1>
          <p className="mt-1 max-w-md text-sm text-primary-foreground/80">
            {featured.length} featured kitchens · average delivery under 30 minutes
          </p>
          <div className="mt-5 flex max-w-lg items-center gap-2 rounded-2xl bg-white p-2 shadow-lg">
            <Search className="ml-2 size-4 shrink-0 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search restaurants or cuisines…"
              className="w-full bg-transparent py-1.5 text-sm text-foreground outline-none placeholder:text-muted-foreground"
            />
            <Button
              size="sm"
              className="shrink-0 rounded-xl"
              onClick={() =>
                document.getElementById("explore")?.scrollIntoView({ behavior: "smooth" })
              }
            >
              <ArrowRight className="size-4" />
            </Button>
          </div>
        </div>
      </section>

      {/* Featured */}
      {featured.length > 0 && (
        <section>
          <div className="flex items-center justify-between">
            <h2 className="font-display text-lg font-bold tracking-tight">Trending now</h2>
            <span className="flex items-center gap-1 text-xs font-medium text-accent">
              <ChefHat className="size-3.5" /> Hand-picked by QuickBite
            </span>
          </div>
          <div className="no-scrollbar -mx-4 mt-4 flex snap-x gap-4 overflow-x-auto px-4 pb-1">
            {featured.map((r, i) => (
              <div key={r._id} className="w-[300px] shrink-0 snap-start">
                <RestaurantCard restaurant={r} index={i} />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Explore */}
      <section id="explore">
        <h2 className="font-display text-lg font-bold tracking-tight">Explore restaurants</h2>

        {/* Filters */}
        <div className="sticky top-16 z-30 -mx-4 mt-4 space-y-3 border-b bg-background/95 px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6">
          <div className="no-scrollbar flex gap-2 overflow-x-auto">
            <button
              onClick={() => setActiveCuisine(null)}
              className={cn(
                "shrink-0 rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors",
                !activeCuisine
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-card text-muted-foreground hover:text-foreground",
              )}
            >
              All
            </button>
            {allCuisines.map((c) => (
              <button
                key={c}
                onClick={() => setActiveCuisine(activeCuisine === c ? null : c)}
                className={cn(
                  "shrink-0 rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors",
                  activeCuisine === c
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-card text-muted-foreground hover:text-foreground",
                )}
              >
                {CUISINE_EMOJIS[c] ?? "🍽️"} {c}
              </button>
            ))}
          </div>
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">
              {restaurants ? `${filtered.length} restaurant${filtered.length === 1 ? "" : "s"}` : "…"}
            </p>
            <Select value={sort} onValueChange={(v) => setSort(v as typeof sort)}>
              <SelectTrigger size="sm" className="h-8 gap-2 pr-2 text-xs">
                <SlidersHorizontal className="size-3.5" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="rating">Top rated</SelectItem>
                <SelectItem value="time">Fastest delivery</SelectItem>
                <SelectItem value="fee">Lowest fee</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Grid */}
        {!restaurants ? (
          <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="overflow-hidden rounded-2xl border">
                <Skeleton className="aspect-[16/10] rounded-none" />
                <div className="space-y-2 p-4">
                  <Skeleton className="h-4 w-2/3" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="mt-10 flex flex-col items-center gap-2 rounded-2xl border border-dashed py-14 text-center">
            <span className="text-4xl">🍽️</span>
            <p className="font-medium">No restaurants match that craving</p>
            <p className="text-sm text-muted-foreground">Try a different search or clear the filters.</p>
            <Button variant="outline" size="sm" className="mt-2" onClick={() => { setSearch(""); setActiveCuisine(null); }}>
              Clear filters
            </Button>
          </div>
        ) : (
          <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((r, i) => (
              <RestaurantCard key={r._id} restaurant={r} index={i} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
