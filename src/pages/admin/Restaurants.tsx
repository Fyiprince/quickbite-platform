import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { useMutation, useQuery } from "convex/react";
import { motion } from "framer-motion";
import { Archive, Loader2, Pencil, Plus, Store, UtensilsCrossed } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router";
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
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { inr } from "@/lib/format";
import { parseError } from "@/lib/parse";
import { toast } from "sonner";

interface RestaurantForm {
  name: string;
  description: string;
  cuisines: string;
  address: string;
  deliveryTimeMins: number;
  deliveryFeePaise: number;
  imageUrl: string;
  isOpen: boolean;
}

const EMPTY: RestaurantForm = {
  name: "",
  description: "",
  cuisines: "",
  address: "",
  deliveryTimeMins: 30,
  deliveryFeePaise: 2900,
  imageUrl: "",
  isOpen: true,
};

export default function AdminRestaurants() {
  const restaurants = useQuery(api.admin.listRestaurantsAdmin);
  const createRestaurant = useMutation(api.admin.createRestaurant);
  const updateRestaurant = useMutation(api.admin.updateRestaurant);
  const archiveRestaurant = useMutation(api.admin.archiveRestaurant);
  const navigate = useNavigate();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<RestaurantForm>(EMPTY);
  const [busy, setBusy] = useState(false);

  const openCreate = () => {
    setEditingId(null);
    setForm(EMPTY);
    setDialogOpen(true);
  };

  const openEdit = (r: NonNullable<typeof restaurants>[number]) => {
    setEditingId(r._id);
    setForm({
      name: r.name,
      description: r.description ?? "",
      cuisines: r.cuisines.join(", "),
      address: r.address,
      deliveryTimeMins: r.deliveryTimeMins,
      deliveryFeePaise: r.deliveryFeePaise,
      imageUrl: r.imageUrl ?? "",
      isOpen: r.isOpen,
    });
    setDialogOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      const payload = {
        name: form.name,
        description: form.description || undefined,
        cuisines: form.cuisines.split(",").map((c) => c.trim()).filter(Boolean),
        address: form.address,
        deliveryTimeMins: form.deliveryTimeMins,
        deliveryFeePaise: form.deliveryFeePaise,
        imageUrl: form.imageUrl || undefined,
        isOpen: form.isOpen,
      };
      if (editingId) {
        await updateRestaurant({ restaurantId: editingId, ...payload });
        toast.success("Restaurant updated");
      } else {
        await createRestaurant({ latitude: 12.9716, longitude: 77.5946, ...payload });
        toast.success("Restaurant added");
      }
      setDialogOpen(false);
    } catch (err) {
      toast.error(parseError(err));
    } finally {
      setBusy(false);
    }
  };

  const handleArchive = async (id: Id<"restaurants">, name: string) => {
    try {
      await archiveRestaurant({ restaurantId: id });
      toast.success(`${name} archived`);
    } catch (err) {
      toast.error(parseError(err));
    }
  };

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {restaurants?.filter((r) => !r.isArchived).length ?? "…"} live restaurants
        </p>
        <Button className="gap-1.5" onClick={openCreate}>
          <Plus className="size-4" /> Add restaurant
        </Button>
      </div>

      {!restaurants ? (
        <div className="grid gap-3 sm:grid-cols-2">
          <Skeleton className="h-32 rounded-2xl" />
          <Skeleton className="h-32 rounded-2xl" />
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {restaurants.map((r, i) => (
            <motion.div
              key={r._id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(i * 0.04, 0.3) }}
              className={`rounded-2xl border bg-card p-4 shadow-sm ${r.isArchived ? "opacity-60" : ""}`}
            >
              <div className="flex gap-3">
                <div className="relative h-20 w-28 shrink-0 overflow-hidden rounded-xl bg-muted">
                  {r.imageUrl ? (
                    <img src={r.imageUrl} alt={r.name} referrerPolicy="no-referrer" className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center">
                      <Store className="size-6 text-muted-foreground/50" />
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate font-semibold">{r.name}</p>
                    {r.isArchived && <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">Archived</span>}
                  </div>
                  <p className="mt-0.5 truncate text-xs text-muted-foreground">{r.cuisines.join(" · ")}</p>
                  <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <UtensilsCrossed className="size-3" /> {r.deliveryTimeMins} min
                    </span>
                    <span>{inr(r.deliveryFeePaise)} fee</span>
                    <span className="flex items-center gap-1">
                      ★ {r.rating.toFixed(1)}
                    </span>
                  </div>
                </div>
              </div>
              <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t pt-3">
                <div className="flex items-center gap-2">
                  <Switch
                    checked={r.isOpen && !r.isArchived}
                    disabled={r.isArchived}
                    onCheckedChange={(v) =>
                      updateRestaurant({ restaurantId: r._id, isOpen: v }).catch((e) => toast.error(parseError(e)))
                    }
                  />
                  <span className="text-xs text-muted-foreground">{r.isOpen ? "Open" : "Closed"}</span>
                </div>
                <div className="flex gap-1.5">
                  <Button variant="outline" size="sm" onClick={() => navigate(`/admin/restaurants/${r._id}/menu`)}>
                    Menu
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => openEdit(r)} aria-label={`Edit ${r.name}`}>
                    <Pencil className="size-4" />
                  </Button>
                  {!r.isArchived && (
                    <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => handleArchive(r._id, r.name)} aria-label={`Archive ${r.name}`}>
                      <Archive className="size-4" />
                    </Button>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit restaurant" : "Add restaurant"}</DialogTitle>
            <DialogDescription>
              New restaurants appear to customers immediately.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSave} className="flex flex-col gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="r-name">Name</Label>
              <Input id="r-name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="r-desc">Description</Label>
              <Input id="r-desc" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="r-cuisines">Cuisines (comma separated)</Label>
                <Input id="r-cuisines" value={form.cuisines} onChange={(e) => setForm({ ...form, cuisines: e.target.value })} placeholder="Biryani, Mughlai" />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="r-addr">Address</Label>
                <Input id="r-addr" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} required />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="r-time">Delivery (min)</Label>
                <Input id="r-time" type="number" min={10} max={120} value={form.deliveryTimeMins} onChange={(e) => setForm({ ...form, deliveryTimeMins: Number(e.target.value) })} />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="r-fee">Fee (₹)</Label>
                <Input id="r-fee" type="number" min={0} value={form.deliveryFeePaise / 100} onChange={(e) => setForm({ ...form, deliveryFeePaise: Math.round(Number(e.target.value) * 100) })} />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="r-img">Image URL</Label>
                <Input id="r-img" value={form.imageUrl} onChange={(e) => setForm({ ...form, imageUrl: e.target.value })} placeholder="https://…" />
              </div>
            </div>
            <div className="flex items-center gap-2 pt-1">
              <Switch checked={form.isOpen} onCheckedChange={(v) => setForm({ ...form, isOpen: v })} />
              <span className="text-sm">Open for orders</span>
            </div>
            <DialogFooter>
              <Button type="submit" disabled={busy || !form.name.trim()}>
                {busy && <Loader2 className="size-4 animate-spin" />} Save
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
