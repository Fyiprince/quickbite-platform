import { api } from "@/convex/_generated/api";
import { useMutation, useQuery } from "convex/react";
import { DatabaseZap, Loader2, ShieldCheck, Sparkles } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { parseError } from "@/lib/parse";
import { toast } from "sonner";

export default function AdminSettings() {
  const createAdmin = useMutation(api.provisioning.createAdmin);
  const seed = useMutation(api.seed.seedDemoData);
  const stats = useQuery(api.admin.dashboardStats);

  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [seeding, setSeeding] = useState(false);

  const handleCreateAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      await createAdmin({ email, name });
      toast.success(`Admin invite reserved for ${email}`);
      setEmail("");
      setName("");
    } catch (err) {
      toast.error(parseError(err));
    } finally {
      setBusy(false);
    }
  };

  const handleSeed = async () => {
    setSeeding(true);
    try {
      const res = await seed();
      toast.success(res.seeded ? `${res.message} (${res.restaurants} restaurants, ${res.orders} orders)` : "Marketplace already has data");
    } catch (err) {
      toast.error(parseError(err));
    } finally {
      setSeeding(false);
    }
  };

  return (
    <div className="flex max-w-2xl flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <ShieldCheck className="size-4 text-primary" /> Create an admin
          </CardTitle>
          <CardDescription>
            Admins are invite-only — there is no public admin registration. Enter the
            email the new admin will sign in with.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreateAdmin} className="flex flex-col gap-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="a-name">Full name</Label>
                <Input id="a-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Priya Nair" required />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="a-email">Email</Label>
                <Input id="a-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="newadmin@company.com" required />
              </div>
            </div>
            <Button type="submit" className="self-start" disabled={busy || !email.trim() || !name.trim()}>
              {busy && <Loader2 className="size-4 animate-spin" />} Send admin invite
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <DatabaseZap className="size-4 text-primary" /> Marketplace data
          </CardTitle>
          <CardDescription>
            Seed the marketplace with restaurants, menus, coupons and 14 days of
            demo orders for analytics. Idempotent — safe to run again.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">
            {stats ? `${stats.totalRestaurants} restaurants · ${stats.totalCustomers} customers` : "Loading…"}
          </p>
          <Button variant="outline" className="gap-1.5" onClick={handleSeed} disabled={seeding}>
            {seeding ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
            {seeding ? "Seeding…" : "Seed demo data"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
