import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { assertTransition, err, getSessionUser, notifyAdmins, notifyUser, requireRole } from "./lib";
import { ROLES } from "./schema";

const DAY = 86_400_000;

// ---------------------------------------------------------------------------
// Requests — orders assigned to me by an admin that I haven't accepted yet
// ---------------------------------------------------------------------------
export const myRequests = query({
  handler: async (ctx) => {
    const user = await getSessionUser(ctx);
    requireRole(user, ROLES.DELIVERY);
    const requests = await ctx.db
      .query("orders")
      .withIndex("by_partner", (q) => q.eq("deliveryPartnerId", user._id))
      .filter((q) =>
        q.and(
          q.eq(q.field("orderStatus"), "ASSIGNED"),
          q.eq(q.field("deliveryAcceptedAt"), undefined),
        ),
      )
      .order("desc")
      .take(20);
    return requests;
  },
});

export const acceptRequest = mutation({
  args: { orderId: v.id("orders") },
  handler: async (ctx, args) => {
    const partner = await getSessionUser(ctx);
    requireRole(partner, ROLES.DELIVERY);
    const order = await ctx.db.get(args.orderId);
    if (!order) throw err("NOT_FOUND", "Order not found");
    if (order.deliveryPartnerId !== partner._id) throw err("FORBIDDEN", "This request is not assigned to you");
    if (order.orderStatus !== "ASSIGNED") throw err("INVALID_STATUS", "This request is no longer available");
    if (order.deliveryAcceptedAt) throw err("INVALID_STATUS", "Request already accepted");

    const now = Date.now();
    await ctx.db.patch(order._id, {
      deliveryAcceptedAt: now,
      deliveryPartnerName: partner.name ?? "Partner",
    });
    await notifyUser(
      ctx,
      order.customerId,
      "delivery:accepted",
      `${partner.name ?? "Your delivery partner"} is heading to ${order.restaurantName}!`,
      order._id,
    );
    await notifyAdmins(ctx, "delivery:accepted", `${partner.name} accepted order #${order._id.slice(-6).toUpperCase()}`, order._id);
    return true;
  },
});

export const rejectRequest = mutation({
  args: { orderId: v.id("orders") },
  handler: async (ctx, args) => {
    const partner = await getSessionUser(ctx);
    requireRole(partner, ROLES.DELIVERY);
    const order = await ctx.db.get(args.orderId);
    if (!order) throw err("NOT_FOUND", "Order not found");
    if (order.deliveryPartnerId !== partner._id) throw err("FORBIDDEN", "This request is not assigned to you");
    if (order.orderStatus !== "ASSIGNED" || order.deliveryAcceptedAt) {
      throw err("INVALID_STATUS", "This request can no longer be rejected");
    }
    const now = Date.now();
    await ctx.db.patch(order._id, {
      orderStatus: "READY",
      deliveryPartnerId: undefined,
      deliveryPartnerName: undefined,
      statusHistory: [...order.statusHistory, { status: "READY", at: now }],
    });
    await notifyAdmins(ctx, "delivery:rejected", `${partner.name} declined order #${order._id.slice(-6).toUpperCase()} — reassign needed`, order._id);
    return true;
  },
});

// ---------------------------------------------------------------------------
// Active order + status progression (PICKED_UP → OUT_FOR_DELIVERY → DELIVERED)
// ---------------------------------------------------------------------------
export const myActiveOrder = query({
  handler: async (ctx) => {
    const user = await getSessionUser(ctx);
    requireRole(user, ROLES.DELIVERY);
    const order = await ctx.db
      .query("orders")
      .withIndex("by_partner", (q) => q.eq("deliveryPartnerId", user._id))
      .filter((q) =>
        q.or(
          q.and(
            q.eq(q.field("orderStatus"), "ASSIGNED"),
            q.neq(q.field("deliveryAcceptedAt"), undefined),
          ),
          q.eq(q.field("orderStatus"), "PICKED_UP"),
          q.eq(q.field("orderStatus"), "OUT_FOR_DELIVERY"),
        ),
      )
      .order("desc")
      .first();
    return order ?? null;
  },
});

export const updateOrderStatus = mutation({
  args: {
    orderId: v.id("orders"),
    status: v.union(
      v.literal("PICKED_UP"),
      v.literal("OUT_FOR_DELIVERY"),
      v.literal("DELIVERED"),
    ),
  },
  handler: async (ctx, args) => {
    const partner = await getSessionUser(ctx);
    requireRole(partner, ROLES.DELIVERY);
    const order = await ctx.db.get(args.orderId);
    if (!order) throw err("NOT_FOUND", "Order not found");
    if (order.deliveryPartnerId !== partner._id) throw err("FORBIDDEN", "This order is not assigned to you");
    assertTransition(order.orderStatus, args.status);

    const now = Date.now();
    const patch: Record<string, unknown> = {
      orderStatus: args.status,
      statusHistory: [...order.statusHistory, { status: args.status, at: now }],
    };
    if (args.status === "DELIVERED") {
      patch.deliveredAt = now;
      patch.paymentStatus = "PAID";
    }
    await ctx.db.patch(order._id, patch);

    const messages: Record<string, string> = {
      PICKED_UP: "Your order has been picked up from the restaurant 🛵",
      OUT_FOR_DELIVERY: "Your delivery partner is on the way! Track them live 📍",
      DELIVERED: "Your order has been delivered. Enjoy your meal! 🎉",
    };
    await notifyUser(ctx, order.customerId, "order:status_update", messages[args.status], order._id);
    await notifyAdmins(ctx, "order:status_update", `Order #${order._id.slice(-6).toUpperCase()} → ${args.status.replace("_", " ")}`, order._id);
    return true;
  },
});

// ---------------------------------------------------------------------------
// GPS ping — throttled client-side to ~1/5s; the customer's tracking page
// subscribes reactively, so the marker moves without sockets.
// ---------------------------------------------------------------------------
export const updateLocation = mutation({
  args: { lat: v.number(), lng: v.number() },
  handler: async (ctx, args) => {
    const user = await getSessionUser(ctx);
    requireRole(user, ROLES.DELIVERY);
    if (args.lat < -90 || args.lat > 90 || args.lng < -180 || args.lng > 180) {
      throw err("VALIDATION", "Invalid coordinates");
    }
    await ctx.db.patch(user._id, { currentLat: args.lat, currentLng: args.lng });
    return true;
  },
});

// ---------------------------------------------------------------------------
// History + earnings
// ---------------------------------------------------------------------------
export const myDeliveredOrders = query({
  handler: async (ctx) => {
    const user = await getSessionUser(ctx);
    requireRole(user, ROLES.DELIVERY);
    const delivered = await ctx.db
      .query("orders")
      .withIndex("by_partner", (q) => q.eq("deliveryPartnerId", user._id))
      .filter((q) => q.eq(q.field("orderStatus"), "DELIVERED"))
      .order("desc")
      .take(100);
    return delivered;
  },
});

export const earnings = query({
  handler: async (ctx) => {
    const user = await getSessionUser(ctx);
    requireRole(user, ROLES.DELIVERY);
    const delivered = await ctx.db
      .query("orders")
      .withIndex("by_partner", (q) => q.eq("deliveryPartnerId", user._id))
      .filter((q) => q.eq(q.field("orderStatus"), "DELIVERED"))
      .collect();

    const now = Date.now();
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const startOfWeek = startOfToday.getTime() - ((startOfToday.getDay() + 6) % 7) * DAY;

    const paid = delivered.filter((o) => o.paymentStatus === "PAID");
    const today = paid.filter((o) => (o.deliveredAt ?? o.createdAt) >= startOfToday.getTime());
    const week = paid.filter((o) => (o.deliveredAt ?? o.createdAt) >= startOfWeek);

    return {
      totalDeliveries: paid.length,
      totalEarningsPaise: paid.reduce((s, o) => s + o.deliveryFeePaise, 0),
      todayDeliveries: today.length,
      todayEarningsPaise: today.reduce((s, o) => s + o.deliveryFeePaise, 0),
      weekEarningsPaise: week.reduce((s, o) => s + o.deliveryFeePaise, 0),
    };
  },
});
