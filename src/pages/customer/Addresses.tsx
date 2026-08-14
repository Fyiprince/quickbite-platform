import { api } from "@/convex/_generated/api";
import { useMutation, useQuery } from "convex/react";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, MapPin, Pencil, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { parseError } from "@/lib/parse";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function Addresses() {
  const addresses = useQuery(api.customers.listMyAddresses);
  const addAddress = useMutation(api.customers.addAddress);
  const updateAddress = useMutation(api.customers.updateAddress);
  const deleteAddress = useMutation(api.customers.deleteAddress);

  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ label: "Home", fullAddress: "" });
  const [busy, setBusy] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.fullAddress.trim()) return;
    setBusy(true);
    try {
      await addAddress({ ...form, isDefault: (addresses?.length ?? 0) === 0 });
      setForm({ label: "Home", fullAddress: "" });
      setAdding(false);
      toast.success("Address saved");
    } catch (err) {
      toast.error(parseError(err));
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async (id: import("@/convex/_generated/dataModel").Id<"addresses">) => {
    setDeleting(id);
    try {
      await deleteAddress({ addressId: id });
      toast.success("Address removed");
    } catch (err) {
      toast.error(parseError(err));
    } finally {
      setDeleting(null);
    }
  };

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-extrabold tracking-tight">Saved addresses</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">Where should we drop your food?</p>
        </div>
        <Button className="gap-1.5" onClick={() => setAdding((v) => !v)}>
          <Plus className="size-4" /> {adding ? "Close" : "Add"}
        </Button>
      </div>

      {adding && (
        <motion.form
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          onSubmit={handleAdd}
          className="overflow-hidden rounded-2xl border bg-card"
        >
          <div className="flex flex-col gap-4 p-5">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="a-label">Label</Label>
              <div className="flex gap-2">
                {["Home", "Work", "Other"].map((l) => (
                  <button
                    key={l}
                    type="button"
                    onClick={() => setForm({ ...form, label: l })}
                    className={cn(
                      "rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors",
                      form.label === l ? "border-primary bg-primary text-primary-foreground" : "border-border text-muted-foreground hover:text-foreground",
                    )}
                  >
                    {l}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="a-full">Full address</Label>
              <Textarea id="a-full" rows={2} value={form.fullAddress} onChange={(e) => setForm({ ...form, fullAddress: e.target.value })} placeholder="House / flat, street, area, city, PIN" required />
            </div>
            <Button type="submit" disabled={busy || !form.fullAddress.trim()}>
              {busy && <Loader2 className="size-4 animate-spin" />} Save address
            </Button>
          </div>
        </motion.form>
      )}

      {!addresses ? (
        <div className="space-y-3">
          <div className="h-20 animate-pulse rounded-2xl bg-muted" />
          <div className="h-20 animate-pulse rounded-2xl bg-muted" />
        </div>
      ) : addresses.length === 0 && !adding ? (
        <div className="flex flex-col items-center gap-3 rounded-3xl border border-dashed py-16 text-center">
          <div className="flex size-14 items-center justify-center rounded-2xl bg-muted">
            <MapPin className="size-7 text-muted-foreground" />
          </div>
          <p className="font-display text-lg font-bold">No saved addresses</p>
          <p className="max-w-xs text-sm text-muted-foreground">Add your first address to start ordering.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          <AnimatePresence>
            {addresses.map((a) => (
              <motion.div
                key={a._id}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -30 }}
              >
                <Card>
                  <CardContent className="flex items-start gap-4 p-5">
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <MapPin className="size-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold">{a.label}</p>
                        {a.isDefault && (
                          <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">Default</span>
                        )}
                      </div>
                      <p className="mt-0.5 text-sm leading-5 text-muted-foreground">{a.fullAddress}</p>
                    </div>
                    <div className="flex shrink-0 flex-col gap-1">
                      {!a.isDefault && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="gap-1 text-muted-foreground"
                          onClick={async () => {
                            try {
                              await updateAddress({ addressId: a._id, label: a.label, fullAddress: a.fullAddress, isDefault: true });
                              toast.success(`${a.label} is now your default`);
                            } catch (err) {
                              toast.error(parseError(err));
                            }
                          }}
                        >
                          <Pencil className="size-3.5" /> Make default
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="gap-1 text-destructive hover:text-destructive"
                        onClick={() => handleDelete(a._id)}
                        disabled={deleting === a._id}
                      >
                        {deleting === a._id ? <Loader2 className="size-3.5 animate-spin" /> : <Trash2 className="size-3.5" />} Remove
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
