import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { useMutation, useQuery } from "convex/react";
import { motion } from "framer-motion";
import { Bike, Loader2, Plus, UserCheck } from "lucide-react";
import { useState } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { inr, timeAgo } from "@/lib/format";
import { parseError } from "@/lib/parse";
import { toast } from "sonner";

export default function AdminDeliveryPartners() {
  const partners = useQuery(api.admin.listDeliveryPartners);
  const createDeliveryPartner = useMutation(api.admin.createDeliveryPartner);
  const setDeliveryPartnerStatus = useMutation(api.admin.setDeliveryPartnerStatus);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", phone: "", vehicleType: "Bike" });
  const [busy, setBusy] = useState(false);
  const [toggling, setToggling] = useState<string | null>(null);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      await createDeliveryPartner({ ...form });
      toast.success(`Invite sent to ${form.email} — they'll be PENDING until you activate them`);
      setDialogOpen(false);
      setForm({ name: "", email: "", phone: "", vehicleType: "Bike" });
    } catch (err) {
      toast.error(parseError(err));
    } finally {
      setBusy(false);
    }
  };

  const handleToggle = async (id: Id<"users">, name: string, current: string) => {
    setToggling(id);
    try {
      const next = current === "ACTIVE" ? "INACTIVE" : "ACTIVE";
      await setDeliveryPartnerStatus({ partnerId: id, status: next });
      toast.success(`${name} is now ${next.toLowerCase()}`);
    } catch (err) {
      toast.error(parseError(err));
    } finally {
      setToggling(null);
    }
  };

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {partners?.filter((p) => p.status === "ACTIVE").length ?? "…"} active partners
        </p>
        <Button className="gap-1.5" onClick={() => setDialogOpen(true)}>
          <Plus className="size-4" /> Invite partner
        </Button>
      </div>

      {!partners ? (
        <div className="space-y-3">
          <Skeleton className="h-20 rounded-2xl" />
          <Skeleton className="h-20 rounded-2xl" />
        </div>
      ) : partners.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed py-14 text-center">
          <Bike className="size-8 text-muted-foreground/50" />
          <p className="text-sm font-medium">No delivery partners yet</p>
          <p className="text-xs text-muted-foreground">
            Invite partners by email — they join as PENDING and you activate them here.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {partners.map((p, i) => (
            <motion.div
              key={p._id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(i * 0.04, 0.3) }}
              className="flex items-center gap-4 rounded-2xl border bg-card p-4"
            >
              <Avatar className="size-11 border bg-primary/10 text-primary">
                <AvatarFallback className="text-xs font-semibold">
                  {(p.name ?? "?").split(" ").map((x) => x[0]).slice(0, 2).join("").toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-semibold">{p.name}</p>
                  {p.kind === "invite" && (
                    <Badge variant="secondary" className="text-[10px]">Invited, hasn't signed up</Badge>
                  )}
                </div>
                <p className="truncate text-xs text-muted-foreground">
                  {p.email ?? "no email"} · {p.vehicleType ?? "—"} · {p.phone ?? "no phone"}
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {p.deliveries} deliveries · {inr(p.earningsPaise)} earned
                  {p.isAvailable ? " · 🟢 available" : ""}
                </p>
              </div>
              <div className="flex shrink-0 flex-col items-end gap-2">
                <Badge
                  className={
                    p.status === "ACTIVE"
                      ? "bg-green-100 text-green-700 ring-1 ring-green-200 dark:bg-green-500/10 dark:text-green-400 dark:ring-green-500/30"
                      : p.status === "PENDING"
                        ? "bg-amber-100 text-amber-700 ring-1 ring-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:ring-amber-500/30"
                        : "bg-muted text-muted-foreground ring-1 ring-border"
                  }
                >
                  {p.status}
                </Badge>
                {p.kind === "user" && (
                  <Button
                    variant={p.status === "ACTIVE" ? "outline" : "default"}
                    size="sm"
                    className="gap-1.5"
                    disabled={toggling === p._id}
                    onClick={() => handleToggle(p._id, p.name ?? "Partner", p.status)}
                  >
                    {toggling === p._id ? (
                      <Loader2 className="size-3.5 animate-spin" />
                    ) : p.status === "ACTIVE" ? (
                      <UserCheck className="size-3.5" />
                    ) : (
                      <UserCheck className="size-3.5" />
                    )}
                    {p.status === "ACTIVE" ? "Deactivate" : "Activate"}
                  </Button>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Invite a delivery partner</DialogTitle>
            <DialogDescription>
              No public signup — partners join by email invite and start as PENDING.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreate} className="flex flex-col gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="dp-name">Full name</Label>
              <Input id="dp-name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="dp-email">Email</Label>
              <Input id="dp-email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="rider@example.com" required />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="dp-phone">Phone</Label>
                <Input id="dp-phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+91 …" />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>Vehicle</Label>
                <Select value={form.vehicleType} onValueChange={(v) => setForm({ ...form, vehicleType: v })}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {["Bike", "Scooter", "Bicycle", "Car"].map((v) => (
                      <SelectItem key={v} value={v}>{v}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button type="submit" disabled={busy || !form.name.trim() || !form.email.trim()}>
                {busy && <Loader2 className="size-4 animate-spin" />} Send invite
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
