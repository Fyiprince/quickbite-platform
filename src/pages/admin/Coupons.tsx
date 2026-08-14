import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { useMutation, useQuery } from "convex/react";
import { motion } from "framer-motion";
import { Loader2, Plus, Tag, Trash2 } from "lucide-react";
import { useState } from "react";
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
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { inr } from "@/lib/format";
import { parseError } from "@/lib/parse";
import { toast } from "sonner";

interface CouponForm {
  code: string;
  discountType: "PERCENT" | "FLAT";
  discountValue: number; // percent or rupees
  minOrderRupees: number;
  maxDiscountRupees: number;
  isActive: boolean;
}

const EMPTY: CouponForm = {
  code: "",
  discountType: "FLAT",
  discountValue: 50,
  minOrderRupees: 199,
  maxDiscountRupees: 0,
  isActive: true,
};

export default function AdminCoupons() {
  const coupons = useQuery(api.admin.listCoupons);
  const createCoupon = useMutation(api.admin.createCoupon);
  const updateCoupon = useMutation(api.admin.updateCoupon);
  const deleteCoupon = useMutation(api.admin.deleteCoupon);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState<CouponForm>(EMPTY);
  const [busy, setBusy] = useState(false);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      await createCoupon({
        code: form.code,
        discountType: form.discountType,
        discountValuePaise:
          form.discountType === "PERCENT" ? Math.round(form.discountValue * 100) : Math.round(form.discountValue * 100),
        minOrderPaise: Math.round(form.minOrderRupees * 100),
        maxDiscountPaise: form.discountType === "PERCENT" && form.maxDiscountRupees > 0 ? Math.round(form.maxDiscountRupees * 100) : undefined,
        isActive: form.isActive,
      });
      toast.success(`Coupon ${form.code.toUpperCase()} created`);
      setDialogOpen(false);
      setForm(EMPTY);
    } catch (err) {
      toast.error(parseError(err));
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async (id: Id<"coupons">, code: string) => {
    try {
      await deleteCoupon({ couponId: id });
      toast.success(`${code} deleted`);
    } catch (err) {
      toast.error(parseError(err));
    }
  };

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{coupons?.length ?? "…"} coupons</p>
        <Button className="gap-1.5" onClick={() => setDialogOpen(true)}>
          <Plus className="size-4" /> New coupon
        </Button>
      </div>

      {!coupons ? (
        <div className="grid gap-3 sm:grid-cols-2">
          <Skeleton className="h-24 rounded-2xl" />
          <Skeleton className="h-24 rounded-2xl" />
        </div>
      ) : coupons.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed py-14 text-center">
          <Tag className="size-8 text-muted-foreground/50" />
          <p className="text-sm font-medium">No coupons yet</p>
          <p className="text-xs text-muted-foreground">Create your first promo code.</p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {coupons.map((c, i) => (
            <motion.div
              key={c._id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(i * 0.04, 0.3) }}
              className="flex items-center gap-4 rounded-2xl border bg-card p-4"
            >
              <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-accent/10 text-accent">
                <Tag className="size-5" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-display font-bold tracking-wide">{c.code}</p>
                  <Badge variant={c.discountType === "FLAT" ? "default" : "secondary"}>
                    {c.discountType === "FLAT"
                      ? `₹${(c.discountValuePaise / 100).toFixed(0)} off`
                      : `${c.discountValuePaise / 100}% off`}
                  </Badge>
                </div>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Min order {inr(c.minOrderPaise)}
                  {c.maxDiscountPaise ? ` · cap ${inr(c.maxDiscountPaise)}` : ""}
                  {c.expiresAt ? ` · expires ${new Date(c.expiresAt).toLocaleDateString("en-IN")}` : " · no expiry"}
                </p>
              </div>
              <div className="flex shrink-0 flex-col items-end gap-2">
                <div className="flex items-center gap-2">
                  <Switch
                    checked={c.isActive}
                    onCheckedChange={(v) =>
                      updateCoupon({ couponId: c._id, isActive: v }).catch((e) => toast.error(parseError(e)))
                    }
                  />
                  <span className="text-xs text-muted-foreground">{c.isActive ? "Active" : "Paused"}</span>
                </div>
                <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => handleDelete(c._id, c.code)} aria-label={`Delete ${c.code}`}>
                  <Trash2 className="size-4" />
                </Button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New coupon</DialogTitle>
            <DialogDescription>Customers enter the code at checkout.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreate} className="flex flex-col gap-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="c-code">Code</Label>
                <Input id="c-code" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} placeholder="SAVE20" required />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>Type</Label>
                <Select value={form.discountType} onValueChange={(v) => setForm({ ...form, discountType: v as "PERCENT" | "FLAT" })}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="FLAT">Flat (₹)</SelectItem>
                    <SelectItem value="PERCENT">Percent (%)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="c-value">{form.discountType === "FLAT" ? "Discount (₹)" : "Percent (%)"}</Label>
                <Input id="c-value" type="number" min={1} value={form.discountValue} onChange={(e) => setForm({ ...form, discountValue: Number(e.target.value) })} />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="c-min">Min order (₹)</Label>
                <Input id="c-min" type="number" min={0} value={form.minOrderRupees} onChange={(e) => setForm({ ...form, minOrderRupees: Number(e.target.value) })} />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="c-cap">Max discount (₹)</Label>
                <Input id="c-cap" type="number" min={0} value={form.maxDiscountRupees} onChange={(e) => setForm({ ...form, maxDiscountRupees: Number(e.target.value) })} placeholder="0 = none" />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={form.isActive} onCheckedChange={(v) => setForm({ ...form, isActive: v })} />
              <span className="text-sm">Active immediately</span>
            </div>
            <DialogFooter>
              <Button type="submit" disabled={busy || !form.code.trim() || form.discountValue <= 0}>
                {busy && <Loader2 className="size-4 animate-spin" />} Create coupon
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
