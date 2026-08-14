import { mutation, query } from "./_generated/server";
import { err, getSessionUser } from "./lib";

export const listMyNotifications = query({
  handler: async (ctx) => {
    const user = await getSessionUser(ctx);
    if (!user) throw err("UNAUTHENTICATED", "Please sign in to continue");
    const notifications = await ctx.db
      .query("notifications")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .order("desc")
      .take(50);
    return notifications;
  },
});

export const unreadCount = query({
  handler: async (ctx) => {
    const user = await getSessionUser(ctx);
    if (!user) return 0;
    const notifications = await ctx.db
      .query("notifications")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();
    return notifications.filter((n) => !n.isRead).length;
  },
});

export const markAllRead = mutation({
  handler: async (ctx) => {
    const user = await getSessionUser(ctx);
    if (!user) return;
    const notifications = await ctx.db
      .query("notifications")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();
    for (const n of notifications) {
      if (!n.isRead) await ctx.db.patch(n._id, { isRead: true });
    }
  },
});
