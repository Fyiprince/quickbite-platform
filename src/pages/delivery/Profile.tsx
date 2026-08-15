import { api } from "@/convex/_generated/api";
import { useMutation, useQuery } from "convex/react";
import { motion } from "framer-motion";
import { Bike, Loader2, Mail, MapPin, Phone, User } from "lucide-react";
import { useEffect, useState } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { parseError } from "@/lib/parse";
import { toast } from "sonner";

const VEHICLES = ["Bike", "Scooter", "Bicycle", "Car"];

export default function DeliveryProfile() {
  const user = useQuery(api.users.currentUser);
  const updateProfile = useMutation(api.provisioning.updateDeliveryProfile);
  const setAvailability = useMutation(api.provisioning.setAvailability);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [vehicleType, setVehicleType] = useState("Bike");
  const [busy, setBusy] = useState(false);
  const [availBusy, setAvailBusy] = useState(false);

  // Seed the form once user data arrives
  useEffect(() => {
    if (!user) return;
    setName(user.name ?? "");
    setPhone(user.phone ?? "");
    setVehicleType(user.vehicleType ?? "Bike");
  }, [user]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Name is required");
      return;
    }
    setBusy(true);
    try {
      await updateProfile({
        name: name.trim(),
        phone: phone.trim() || undefined,
        vehicleType,
      });
      toast.success("Profile updated");
    } catch (err) {
      toast.error(parseError(err));
    } finally {
      setBusy(false);
    }
  };

  const handleAvailability = async (v: boolean) => {
    setAvailBusy(true);
    try {
      await setAvailability({ isAvailable: v });
      toast.success(v ? "You're online! 🟢" : "You're offline");
    } catch (err) {
      toast.error(parseError(err));
    } finally {
      setAvailBusy(false);
    }
  };

  if (!user) {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton className="h-28 rounded-2xl" />
        <Skeleton className="h-64 rounded-2xl" />
      </div>
    );
  }

  const initials = (user.name ?? "?")
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className="flex flex-col gap-6">
      {/* Identity card */}
      <motion.section
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col gap-4 rounded-2xl border bg-card p-5 sm:flex-row sm:items-center"
      >
        <Avatar className="size-16 border bg-primary/10 text-primary">
          <AvatarFallback className="text-lg font-bold">{initials}</AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-display text-lg font-bold">{user.name ?? "Delivery partner"}</p>
            <Badge variant="secondary" className="text-[10px]">
              {user.status ?? "PENDING"}
            </Badge>
            {user.isAvailable && (
              <Badge className="bg-green-100 text-green-700 ring-1 ring-green-200 dark:bg-green-500/10 dark:text-green-400 dark:ring-green-500/30">
                Online
              </Badge>
            )}
          </div>
          <div className="mt-1.5 flex flex-col gap-1 text-xs text-muted-foreground sm:flex-row sm:flex-wrap sm:gap-x-4">
            <span className="flex items-center gap-1.5">
              <Mail className="size-3.5" /> {user.email ?? "no email"}
            </span>
            <span className="flex items-center gap-1.5">
              <Phone className="size-3.5" /> {user.phone ?? "no phone"}
            </span>
            <span className="flex items-center gap-1.5">
              <Bike className="size-3.5" /> {user.vehicleType ?? "—"}
            </span>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-3 rounded-xl border px-4 py-3">
          <div className="flex flex-col">
            <p className="text-xs font-semibold">{user.isAvailable ? "Available" : "Offline"}</p>
            <p className="text-[10px] text-muted-foreground">
              {user.isAvailable ? "Receiving requests" : "Toggle to go online"}
            </p>
          </div>
          <Switch
            checked={user.isAvailable ?? false}
            disabled={availBusy}
            onCheckedChange={handleAvailability}
          />
        </div>
      </motion.section>

      {/* Edit form */}
      <motion.section
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="rounded-2xl border bg-card p-5"
      >
        <h2 className="font-semibold">Edit profile</h2>
        <p className="mt-0.5 text-xs text-muted-foreground">
          Name, phone and vehicle are visible to admins and customers on your deliveries.
        </p>
        <form onSubmit={handleSave} className="mt-4 flex flex-col gap-4">
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="dp-name">Full name</Label>
              <div className="relative">
                <User className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
                <Input
                  id="dp-name"
                  className="pl-9"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="dp-phone">Phone</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
                <Input
                  id="dp-phone"
                  className="pl-9"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91 …"
                />
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="dp-vehicle">Vehicle</Label>
              <div className="relative">
                <MapPin className="pointer-events-none absolute left-3 top-2.5 z-10 size-4 text-muted-foreground" />
                <Select value={vehicleType} onValueChange={setVehicleType}>
                  <SelectTrigger className="pl-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {VEHICLES.map((v) => (
                      <SelectItem key={v} value={v}>
                        {v}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <div>
            <Button type="submit" disabled={busy || !name.trim()}>
              {busy && <Loader2 className="size-4 animate-spin" />} Save changes
            </Button>
          </div>
        </form>
      </motion.section>
    </div>
  );
}
