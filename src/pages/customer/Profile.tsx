import { api } from "@/convex/_generated/api";
import { useMutation } from "convex/react";
import { Loader2, LogOut, UserRound } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";

export default function Profile() {
  const { user, signOut } = useAuth();
  const completeProfile = useMutation(api.provisioning.completeProfile);
  const navigate = useNavigate();
  const [name, setName] = useState(user?.name ?? "");
  const [phone, setPhone] = useState(user?.phone ?? "");
  const [busy, setBusy] = useState(false);

  const initials = (user?.name ?? "?").split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase();

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      await completeProfile({ name, phone });
      toast.success("Profile updated");
    } catch {
      toast.error("Could not update profile");
    } finally {
      setBusy(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <h1 className="font-display text-2xl font-extrabold tracking-tight">Profile</h1>

      <Card className="flex items-center gap-4 p-6">
        <Avatar className="size-16 border bg-primary/10 text-primary">
          <AvatarFallback className="text-xl font-bold">{initials}</AvatarFallback>
        </Avatar>
        <div className="min-w-0">
          <p className="font-display text-lg font-bold">{user?.name ?? "Guest"}</p>
          <p className="truncate text-sm text-muted-foreground">{user?.email ?? "No email on file"}</p>
          <span className="mt-1 inline-block rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
            Customer
          </span>
        </div>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <UserRound className="size-4 text-primary" /> Personal details
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSave} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="name">Full name</Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="phone">Phone</Label>
              <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+91 …" />
            </div>
            <Button type="submit" className="self-start" disabled={busy || !name.trim()}>
              {busy && <Loader2 className="size-4 animate-spin" />} Save changes
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="flex items-center justify-between p-6">
          <div>
            <p className="font-semibold">Sign out</p>
            <p className="text-sm text-muted-foreground">Return to the landing page</p>
          </div>
          <Button variant="outline" onClick={handleSignOut} className="gap-2 text-destructive hover:text-destructive">
            <LogOut className="size-4" /> Sign out
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
