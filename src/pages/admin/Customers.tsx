import { api } from "@/convex/_generated/api";
import { useQuery } from "convex/react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { timeAgo } from "@/lib/format";

export default function AdminCustomers() {
  const customers = useQuery(api.admin.listCustomers);

  return (
    <div className="overflow-hidden rounded-2xl border bg-card">
      {!customers ? (
        <div className="space-y-3 p-5">
          <Skeleton className="h-10 rounded-xl" />
          <Skeleton className="h-10 rounded-xl" />
          <Skeleton className="h-10 rounded-xl" />
        </div>
      ) : (
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b bg-muted/50 text-xs uppercase tracking-wide text-muted-foreground">
              <th className="px-5 py-3 font-medium">Customer</th>
              <th className="hidden px-5 py-3 font-medium sm:table-cell">Contact</th>
              <th className="px-5 py-3 font-medium">Orders</th>
              <th className="px-5 py-3 font-medium">Joined</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {customers.map((c) => (
                <tr key={c._id} className="transition-colors hover:bg-muted/40">
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <Avatar className="size-9 border bg-primary/10 text-primary">
                        <AvatarFallback className="text-xs font-semibold">
                          {(c.name ?? "?").split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{c.name ?? "Guest"}</p>
                        <p className="text-xs text-muted-foreground">{c.email ?? "no email"}</p>
                      </div>
                    </div>
                  </td>
                  <td className="hidden px-5 py-3.5 text-muted-foreground sm:table-cell">
                    {c.phone ?? "—"}
                  </td>
                  <td className="px-5 py-3.5">
                    <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-semibold">{c.orderCount}</span>
                  </td>
                  <td className="px-5 py-3.5 text-muted-foreground">{timeAgo(c._creationTime)}</td>
                </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
