import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { useMutation, useQuery } from "convex/react";
import { motion } from "framer-motion";
import { ArrowLeft, Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { VegDot } from "@/components/food";
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
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { inr } from "@/lib/format";
import { parseError } from "@/lib/parse";
import { toast } from "sonner";

interface ItemForm {
  name: string;
  description: string;
  category: string;
  priceRupees: number;
  isVeg: boolean;
  isAvailable: boolean;
  isPopular: boolean;
}

const EMPTY: ItemForm = {
  name: "",
  description: "",
  category: "Mains",
  priceRupees: 0,
  isVeg: true,
  isAvailable: true,
  isPopular: false,
};

export default function AdminRestaurantMenu() {
  const { id } = useParams<{ id: string }>();
  const restaurant = useQuery(api.customers.getRestaurant, { restaurantId: id! as Id<"restaurants"> });
  const items = useQuery(api.admin.listMenuItems, { restaurantId: id! as Id<"restaurants"> });
  const addMenuItem = useMutation(api.admin.addMenuItem);
  const updateMenuItem = useMutation(api.admin.updateMenuItem);
  const deleteMenuItem = useMutation(api.admin.deleteMenuItem);
  const navigate = useNavigate();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<ItemForm>(EMPTY);
  const [busy, setBusy] = useState(false);

  const grouped = useMemo(() => {
    const acc: Record<string, NonNullable<typeof items>> = {};
    (items ?? []).forEach((item) => {
      (acc[item.category] ??= []).push(item);
    });
    return acc;
  }, [items]);

  const openCreate = (category?: string) => {
    setEditingId(null);
    setForm({ ...EMPTY, category: category ?? "Mains" });
    setDialogOpen(true);
  };

  const openEdit = (item: NonNullable<typeof items>[number]) => {
    setEditingId(item._id);
    setForm({
      name: item.name,
      description: item.description ?? "",
      category: item.category,
      priceRupees: item.pricePaise / 100,
      isVeg: item.isVeg,
      isAvailable: item.isAvailable,
      isPopular: item.isPopular ?? false,
    });
    setDialogOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    setBusy(true);
    try {
      const payload = {
        name: form.name,
        description: form.description || undefined,
        category: form.category,
        pricePaise: Math.round(form.priceRupees * 100),
        isVeg: form.isVeg,
        isAvailable: form.isAvailable,
        isPopular: form.isPopular,
      };
      if (editingId) {
        await updateMenuItem({ itemId: editingId as Id<"menuItems">, ...payload });
        toast.success("Item updated");
      } else {
        await addMenuItem({ restaurantId: id as Id<"restaurants">, ...payload });
        toast.success("Item added");
      }
      setDialogOpen(false);
    } catch (err) {
      toast.error(parseError(err));
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async (itemId: Id<"menuItems">) => {
    try {
      await deleteMenuItem({ itemId });
      toast.success("Item removed");
    } catch (err) {
      toast.error(parseError(err));
    }
  };

  if (!restaurant || !items) {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton className="h-8 w-1/2" />
        <Skeleton className="h-64 rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <button onClick={() => navigate("/admin/restaurants")} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="size-4" /> Restaurants
          </button>
          <h2 className="font-display mt-1 text-xl font-bold tracking-tight">
            {restaurant.restaurant.name} — menu
          </h2>
        </div>
        <Button className="gap-1.5" onClick={() => openCreate()}>
          <Plus className="size-4" /> Add item
        </Button>
      </div>

      {Object.keys(grouped).length === 0 ? (
        <div className="rounded-2xl border border-dashed py-14 text-center">
          <p className="text-3xl">🍽️</p>
          <p className="mt-2 text-sm font-medium">No menu items yet</p>
          <p className="text-xs text-muted-foreground">Add the first item to this menu.</p>
        </div>
      ) : (
        Object.entries(grouped).map(([category, categoryItems]) => (
          <section key={category}>
            <div className="flex items-center gap-2">
              <h3 className="font-display font-bold">{category}</h3>
              <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                {categoryItems.length}
              </span>
              <button onClick={() => openCreate(category)} className="text-xs font-medium text-primary hover:underline">
                + add
              </button>
            </div>
            <div className="mt-3 flex flex-col divide-y rounded-2xl border bg-card">
              {categoryItems.map((item) => (
                <motion.div
                  key={item._id}
                  layout
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex items-center gap-3 p-3.5"
                >
                  <VegDot isVeg={item.isVeg} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className={`text-sm font-medium ${!item.isAvailable ? "text-muted-foreground line-through" : ""}`}>{item.name}</p>
                      {item.isPopular && <span className="rounded-full bg-accent/15 px-2 py-0.5 text-[10px] font-bold text-accent">Bestseller</span>}
                    </div>
                    <p className="text-xs text-muted-foreground">{inr(item.pricePaise)}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex flex-col items-center gap-0.5">
                      <Switch
                        checked={item.isAvailable}
                        onCheckedChange={(v) =>
                          updateMenuItem({ itemId: item._id, isAvailable: v }).catch((e) => toast.error(parseError(e)))
                        }
                      />
                      <span className="text-[10px] text-muted-foreground">{item.isAvailable ? "Live" : "Hidden"}</span>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => openEdit(item)} aria-label={`Edit ${item.name}`}>
                      <Pencil className="size-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => handleDelete(item._id)} aria-label={`Delete ${item.name}`}>
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </motion.div>
              ))}
            </div>
          </section>
        ))
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit item" : "Add menu item"}</DialogTitle>
            <DialogDescription>Prices are in ₹ (whole rupees).</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSave} className="flex flex-col gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="m-name">Name</Label>
              <Input id="m-name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="m-desc">Description</Label>
              <Textarea id="m-desc" rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="m-cat">Category</Label>
                <Input id="m-cat" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="m-price">Price (₹)</Label>
                <Input id="m-price" type="number" min={1} step="1" value={form.priceRupees} onChange={(e) => setForm({ ...form, priceRupees: Number(e.target.value) })} required />
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2">
                <Switch checked={form.isVeg} onCheckedChange={(v) => setForm({ ...form, isVeg: v })} />
                <span className="text-sm">Veg</span>
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={form.isPopular} onCheckedChange={(v) => setForm({ ...form, isPopular: v })} />
                <span className="text-sm">Bestseller</span>
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={form.isAvailable} onCheckedChange={(v) => setForm({ ...form, isAvailable: v })} />
                <span className="text-sm">Available</span>
              </div>
            </div>
            <DialogFooter>
              <Button type="submit" disabled={busy || !form.name.trim() || form.priceRupees <= 0}>
                {busy && <Loader2 className="size-4 animate-spin" />} Save
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
