import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { assertTransition, err, getSessionUser, notifyAdmins, notifyUser, requireRole } from "./lib";
import { ROLES } from "./schema";

const DAY = 86_400_000;

function startOfToday(): number {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

// ---------------------------------------------------------------------------
// Dashboard
// ---------------------------------------------------------------------------
export const dashboardStats = query({
  handler: async (ctx) => {
    const user = await getSessionUser(ctx);
    requireRole(user, ROLES.ADMIN);

    const todayStart = startOfToday();
    const orders = await ctx.db.query("orders").collect();
    const todayOrders = orders.filter((o) => o.createdAt >= todayStart);
    const todayRevenue = todayOrders
      .filter((o) => o.paymentStatus === "PAID" && o.orderStatus !== "CANCELLED")
      .reduce((s, o) => s + o.totalPaise, 0);

    const customers = await ctx.db
      .query("users")
      .withIndex("by_role", (q) => q.eq("role", ROLES.CUSTOMER))
      .collect();
    const deliveryPartners = await ctx.db
      .query("users")
      .withIndex("by_role", (q) => q.eq("role", ROLES.DELIVERY))
      .collect();
    const restaurants = await ctx.db
      .query("restaurants")
      .filter((q) => q.neq(q.field("isArchived"), true))
      .collect();

    return {
      todayOrders: todayOrders.length,
      todayRevenuePaise: todayRevenue,
      activeDeliveries: orders.filter((o) =>
        ["PICKED_UP", "OUT_FOR_DELIVERY"].includes(o.orderStatus),
      ).length,
      pendingOrders: orders.filter((o) => o.orderStatus === "PENDING").length,
      totalCustomers: customers.length,
      activeDeliveryPartners: deliveryPartners.filter((d) => d.status === "ACTIVE").length,
      activeRestaurants: restaurants.filter((r) => r.isOpen).length,
      totalRestaurants: restaurants.length,
    };
  },
});

export const listOrders = query({
  handler: async (ctx) => {
    const user = await getSessionUser(ctx);
    requireRole(user, ROLES.ADMIN);
    const orders = await ctx.db.query("orders").order("desc").take(200);
    return orders;
  },
});

// ---------------------------------------------------------------------------
// Order actions — every transition is validated by the state machine and
// broadcasts to customers (and admins) via notifications + reactive queries.
// ---------------------------------------------------------------------------
export const acceptOrder = mutation({
  args: { orderId: v.id("orders") },
  handler: async (ctx, args) => {
    const admin = await getSessionUser(ctx);
    requireRole(admin, ROLES.ADMIN);
    const order = await ctx.db.get(args.orderId);
    if (!order) throw err("NOT_FOUND", "Order not found");
    assertTransition(order.orderStatus, "ACCEPTED");
    const now = Date.now();
    await ctx.db.patch(order._id, {
      orderStatus: "ACCEPTED",
      statusHistory: [...order.statusHistory, { status: "ACCEPTED", at: now }],
    });
    await notifyUser(ctx, order.customerId, "order:accepted", `Your order at ${order.restaurantName} was accepted!`, order._id);
    return true;
  },
});

export const rejectOrder = mutation({
  args: { orderId: v.id("orders") },
  handler: async (ctx, args) => {
    const admin = await getSessionUser(ctx);
    requireRole(admin, ROLES.ADMIN);
    const order = await ctx.db.get(args.orderId);
    if (!order) throw err("NOT_FOUND", "Order not found");
    if (order.orderStatus !== "PENDING") {
      throw err("INVALID_STATUS", "Only pending orders can be rejected");
    }
    const now = Date.now();
    await ctx.db.patch(order._id, {
      orderStatus: "CANCELLED",
      statusHistory: [...order.statusHistory, { status: "CANCELLED", at: now }],
      cancelledAt: now,
      cancelledBy: "admin",
    });
    await notifyUser(ctx, order.customerId, "order:rejected", `We're sorry — ${order.restaurantName} couldn't take your order.`, order._id);
    await notifyAdmins(ctx, "order:rejected", `Order #${order._id.slice(-6).toUpperCase()} was rejected`, order._id);
    return true;
  },
});

export const setPreparing = mutation({
  args: { orderId: v.id("orders") },
  handler: async (ctx, args) => {
    const admin = await getSessionUser(ctx);
    requireRole(admin, ROLES.ADMIN);
    const order = await ctx.db.get(args.orderId);
    if (!order) throw err("NOT_FOUND", "Order not found");
    assertTransition(order.orderStatus, "PREPARING");
    const now = Date.now();
    await ctx.db.patch(order._id, {
      orderStatus: "PREPARING",
      statusHistory: [...order.statusHistory, { status: "PREPARING", at: now }],
    });
    await notifyUser(ctx, order.customerId, "order:status_update", "Your food is being prepared 👨‍🍳", order._id);
    return true;
  },
});

export const setReady = mutation({
  args: { orderId: v.id("orders") },
  handler: async (ctx, args) => {
    const admin = await getSessionUser(ctx);
    requireRole(admin, ROLES.ADMIN);
    const order = await ctx.db.get(args.orderId);
    if (!order) throw err("NOT_FOUND", "Order not found");
    assertTransition(order.orderStatus, "READY");
    const now = Date.now();
    await ctx.db.patch(order._id, {
      orderStatus: "READY",
      statusHistory: [...order.statusHistory, { status: "READY", at: now }],
    });
    await notifyUser(ctx, order.customerId, "order:status_update", "Your order is ready! Assigning a delivery partner…", order._id);
    return true;
  },
});

export const assignDeliveryPartner = mutation({
  args: { orderId: v.id("orders"), partnerId: v.id("users") },
  handler: async (ctx, args) => {
    const admin = await getSessionUser(ctx);
    requireRole(admin, ROLES.ADMIN);
    const order = await ctx.db.get(args.orderId);
    if (!order) throw err("NOT_FOUND", "Order not found");
    if (order.orderStatus !== "READY" && order.orderStatus !== "ACCEPTED" && order.orderStatus !== "PREPARING") {
      throw err("INVALID_STATUS", "Order must be READY (or in progress) before assigning delivery");
    }
    const partner = await ctx.db.get(args.partnerId);
    if (!partner || partner.role !== ROLES.DELIVERY || partner.status !== "ACTIVE") {
      throw err("VALIDATION", "Select an active delivery partner");
    }
    const now = Date.now();
    await ctx.db.patch(order._id, {
      orderStatus: "ASSIGNED",
      deliveryPartnerId: partner._id,
      deliveryPartnerName: partner.name ?? "Partner",
      statusHistory: [...order.statusHistory, { status: "ASSIGNED", at: now }],
    });
    await notifyUser(ctx, partner._id, "delivery:new_request", `New delivery request — ${order.restaurantName} → ${order.addressLabel}`, order._id);
    await notifyUser(ctx, order.customerId, "order:status_update", `A delivery partner has been assigned to your order`, order._id);
    await notifyAdmins(ctx, "order:assigned", `Order #${order._id.slice(-6).toUpperCase()} assigned to ${partner.name}`, order._id);
    return true;
  },
});

// ---------------------------------------------------------------------------
// Restaurants + menu CRUD
// ---------------------------------------------------------------------------
export const listRestaurantsAdmin = query({
  handler: async (ctx) => {
    const user = await getSessionUser(ctx);
    requireRole(user, ROLES.ADMIN);
    return await ctx.db.query("restaurants").order("desc").collect();
  },
});

export const createRestaurant = mutation({
  args: {
    name: v.string(),
    description: v.optional(v.string()),
    cuisines: v.array(v.string()),
    address: v.string(),
    latitude: v.number(),
    longitude: v.number(),
    imageUrl: v.optional(v.string()),
    deliveryTimeMins: v.number(),
    deliveryFeePaise: v.number(),
    isOpen: v.boolean(),
  },
  handler: async (ctx, args) => {
    const user = await getSessionUser(ctx);
    requireRole(user, ROLES.ADMIN);
    if (!args.name.trim() || !args.address.trim()) throw err("VALIDATION", "Name and address are required");
    return await ctx.db.insert("restaurants", {
      name: args.name.trim(),
      description: args.description,
      cuisines: args.cuisines,
      rating: 0,
      ratingCount: 0,
      address: args.address.trim(),
      latitude: args.latitude,
      longitude: args.longitude,
      imageUrl: args.imageUrl,
      deliveryTimeMins: args.deliveryTimeMins,
      deliveryFeePaise: args.deliveryFeePaise,
      isOpen: args.isOpen,
      isFeatured: false,
      isArchived: false,
      createdAt: Date.now(),
    });
  },
});

export const updateRestaurant = mutation({
  args: {
    restaurantId: v.id("restaurants"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    cuisines: v.optional(v.array(v.string())),
    address: v.optional(v.string()),
    latitude: v.optional(v.number()),
    longitude: v.optional(v.number()),
    imageUrl: v.optional(v.string()),
    deliveryTimeMins: v.optional(v.number()),
    deliveryFeePaise: v.optional(v.number()),
    isOpen: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const user = await getSessionUser(ctx);
    requireRole(user, ROLES.ADMIN);
    const restaurant = await ctx.db.get(args.restaurantId);
    if (!restaurant) throw err("NOT_FOUND", "Restaurant not found");
    const { restaurantId, ...patch } = args;
    await ctx.db.patch(restaurantId, patch);
    return restaurantId;
  },
});

export const archiveRestaurant = mutation({
  args: { restaurantId: v.id("restaurants") },
  handler: async (ctx, args) => {
    const user = await getSessionUser(ctx);
    requireRole(user, ROLES.ADMIN);
    const restaurant = await ctx.db.get(args.restaurantId);
    if (!restaurant) throw err("NOT_FOUND", "Restaurant not found");
    await ctx.db.patch(restaurant._id, { isArchived: true, isOpen: false });
    return true;
  },
});

export const listMenuItems = query({
  args: { restaurantId: v.id("restaurants") },
  handler: async (ctx, args) => {
    const user = await getSessionUser(ctx);
    requireRole(user, ROLES.ADMIN);
    return await ctx.db
      .query("menuItems")
      .withIndex("by_restaurant", (q) => q.eq("restaurantId", args.restaurantId))
      .collect();
  },
});

export const addMenuItem = mutation({
  args: {
    restaurantId: v.id("restaurants"),
    name: v.string(),
    description: v.optional(v.string()),
    category: v.string(),
    pricePaise: v.number(),
    isVeg: v.boolean(),
    isAvailable: v.boolean(),
    isPopular: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const user = await getSessionUser(ctx);
    requireRole(user, ROLES.ADMIN);
    if (!args.name.trim() || !args.category.trim() || args.pricePaise <= 0) {
      throw err("VALIDATION", "Name, category and a positive price are required");
    }
    return await ctx.db.insert("menuItems", {
      restaurantId: args.restaurantId,
      name: args.name.trim(),
      description: args.description,
      category: args.category.trim(),
      pricePaise: args.pricePaise,
      isVeg: args.isVeg,
      isAvailable: args.isAvailable,
      isPopular: args.isPopular,
      createdAt: Date.now(),
    });
  },
});

export const updateMenuItem = mutation({
  args: {
    itemId: v.id("menuItems"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    category: v.optional(v.string()),
    pricePaise: v.optional(v.number()),
    isVeg: v.optional(v.boolean()),
    isAvailable: v.optional(v.boolean()),
    isPopular: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const user = await getSessionUser(ctx);
    requireRole(user, ROLES.ADMIN);
    const item = await ctx.db.get(args.itemId);
    if (!item) throw err("NOT_FOUND", "Menu item not found");
    const { itemId, ...patch } = args;
    await ctx.db.patch(itemId, patch);
    return itemId;
  },
});

export const deleteMenuItem = mutation({
  args: { itemId: v.id("menuItems") },
  handler: async (ctx, args) => {
    const user = await getSessionUser(ctx);
    requireRole(user, ROLES.ADMIN);
    const item = await ctx.db.get(args.itemId);
    if (!item) throw err("NOT_FOUND", "Menu item not found");
    await ctx.db.delete(item._id);
    return true;
  },
});

// ---------------------------------------------------------------------------
// Customers + delivery partners
// ---------------------------------------------------------------------------
export const listCustomers = query({
  handler: async (ctx) => {
    const user = await getSessionUser(ctx);
    requireRole(user, ROLES.ADMIN);
    const customers = await ctx.db
      .query("users")
      .withIndex("by_role", (q) => q.eq("role", ROLES.CUSTOMER))
      .collect();
    const withOrders = await Promise.all(
      customers.map(async (c) => {
        const orders = await ctx.db
          .query("orders")
          .withIndex("by_customer", (q) => q.eq("customerId", c._id))
          .collect();
        return { ...c, orderCount: orders.length };
      }),
    );
    return withOrders.sort((a, b) => b.orderCount - a.orderCount);
  },
});

export const listDeliveryPartners = query({
  handler: async (ctx) => {
    const user = await getSessionUser(ctx);
    requireRole(user, ROLES.ADMIN);
    const partners = await ctx.db
      .query("users")
      .withIndex("by_role", (q) => q.eq("role", ROLES.DELIVERY))
      .collect();
    const invites = await ctx.db
      .query("pendingInvites")
      .filter((q) => q.eq(q.field("role"), "DELIVERY"))
      .collect();
    const withStats = await Promise.all(
      partners.map(async (p) => {
        const delivered = await ctx.db
          .query("orders")
          .withIndex("by_partner", (q) => q.eq("deliveryPartnerId", p._id))
          .filter((q) => q.eq(q.field("orderStatus"), "DELIVERED"))
          .collect();
        return {
          kind: "user" as const,
          ...p,
          deliveries: delivered.length,
          earningsPaise: delivered.reduce((s, o) => s + o.deliveryFeePaise, 0),
        };
      }),
    );
    return [
      ...withStats,
      ...invites.map((i) => ({
        kind: "invite" as const,
        _id: i._id,
        name: i.name,
        email: i.email,
        phone: i.phone,
        vehicleType: i.vehicleType,
        status: i.status,
        isAvailable: false,
        deliveries: 0,
        earningsPaise: 0,
      })),
    ];
  },
});

export const createDeliveryPartner = mutation({
  args: {
    email: v.string(),
    name: v.string(),
    phone: v.optional(v.string()),
    vehicleType: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const admin = await getSessionUser(ctx);
    requireRole(admin, ROLES.ADMIN);
    const email = args.email.toLowerCase().trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw err("VALIDATION", "Enter a valid email");
    if (!args.name.trim()) throw err("VALIDATION", "Name is required");

    const invite = await ctx.db
      .query("pendingInvites")
      .withIndex("by_email", (q) => q.eq("email", email))
      .first();
    if (invite) throw err("VALIDATION", "An invite for this email already exists");

    const existingUser = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", email))
      .first();
    if (existingUser?.role === ROLES.DELIVERY) throw err("VALIDATION", "This user is already a delivery partner");
    if (existingUser) {
      // Existing account (e.g. customer) gets promoted to PENDING delivery
      await ctx.db.patch(existingUser._id, {
        role: ROLES.DELIVERY,
        status: "PENDING",
        name: args.name.trim(),
        phone: args.phone || existingUser.phone,
        vehicleType: args.vehicleType,
        isAvailable: false,
      });
    } else {
      await ctx.db.insert("pendingInvites", {
        email,
        role: ROLES.DELIVERY,
        status: "PENDING",
        name: args.name.trim(),
        phone: args.phone,
        vehicleType: args.vehicleType,
        createdAt: Date.now(),
      });
    }
    return true;
  },
});

export const setDeliveryPartnerStatus = mutation({
  args: { partnerId: v.id("users"), status: v.union(v.literal("ACTIVE"), v.literal("INACTIVE")) },
  handler: async (ctx, args) => {
    const admin = await getSessionUser(ctx);
    requireRole(admin, ROLES.ADMIN);
    const partner = await ctx.db.get(args.partnerId);
    if (!partner || partner.role !== ROLES.DELIVERY) throw err("NOT_FOUND", "Partner not found");
    await ctx.db.patch(partner._id, { status: args.status });
    await notifyUser(
      ctx,
      partner._id,
      "account:status",
      args.status === "ACTIVE"
        ? "Your delivery partner account is now ACTIVE — you can start taking orders! 🛵"
        : "Your delivery partner account was deactivated",
    );
    return true;
  },
});

export const approveInvite = mutation({
  args: { inviteId: v.id("pendingInvites") },
  handler: async (ctx, args) => {
    const admin = await getSessionUser(ctx);
    requireRole(admin, ROLES.ADMIN);
    const invite = await ctx.db.get(args.inviteId);
    if (!invite) throw err("NOT_FOUND", "Invite not found");
    await ctx.db.patch(invite._id, { status: "ACTIVE" });
    return true;
  },
});

// ---------------------------------------------------------------------------
// Coupons
// ---------------------------------------------------------------------------
export const listCoupons = query({
  handler: async (ctx) => {
    const user = await getSessionUser(ctx);
    requireRole(user, ROLES.ADMIN);
    return await ctx.db.query("coupons").order("desc").collect();
  },
});

export const createCoupon = mutation({
  args: {
    code: v.string(),
    discountType: v.union(v.literal("PERCENT"), v.literal("FLAT")),
    discountValuePaise: v.number(),
    minOrderPaise: v.number(),
    maxDiscountPaise: v.optional(v.number()),
    expiresAt: v.optional(v.number()),
    isActive: v.boolean(),
  },
  handler: async (ctx, args) => {
    const user = await getSessionUser(ctx);
    requireRole(user, ROLES.ADMIN);
    const code = args.code.trim().toUpperCase();
    if (!/^[A-Z0-9_]{3,20}$/.test(code)) throw err("VALIDATION", "Code must be 3–20 letters, numbers or underscores");
    const existing = await ctx.db
      .query("coupons")
      .withIndex("by_code", (q) => q.eq("code", code))
      .first();
    if (existing) throw err("VALIDATION", "A coupon with this code already exists");
    return await ctx.db.insert("coupons", {
      code,
      discountType: args.discountType,
      discountValuePaise: args.discountValuePaise,
      minOrderPaise: args.minOrderPaise,
      maxDiscountPaise: args.maxDiscountPaise,
      expiresAt: args.expiresAt,
      isActive: args.isActive,
      createdAt: Date.now(),
    });
  },
});

export const updateCoupon = mutation({
  args: {
    couponId: v.id("coupons"),
    discountType: v.optional(v.union(v.literal("PERCENT"), v.literal("FLAT"))),
    discountValuePaise: v.optional(v.number()),
    minOrderPaise: v.optional(v.number()),
    maxDiscountPaise: v.optional(v.number()),
    expiresAt: v.optional(v.number()),
    isActive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const user = await getSessionUser(ctx);
    requireRole(user, ROLES.ADMIN);
    const coupon = await ctx.db.get(args.couponId);
    if (!coupon) throw err("NOT_FOUND", "Coupon not found");
    const { couponId, ...patch } = args;
    await ctx.db.patch(couponId, patch);
    return couponId;
  },
});

export const deleteCoupon = mutation({
  args: { couponId: v.id("coupons") },
  handler: async (ctx, args) => {
    const user = await getSessionUser(ctx);
    requireRole(user, ROLES.ADMIN);
    const coupon = await ctx.db.get(args.couponId);
    if (!coupon) throw err("NOT_FOUND", "Coupon not found");
    await ctx.db.delete(coupon._id);
    return true;
  },
});

// ---------------------------------------------------------------------------
// Analytics
// ---------------------------------------------------------------------------
export const analytics = query({
  handler: async (ctx) => {
    const user = await getSessionUser(ctx);
    requireRole(user, ROLES.ADMIN);
    const orders = await ctx.db.query("orders").collect();
    const now = Date.now();
    const DAY_MS = DAY;

    // last 14 days series
    const series: { day: string; label: string; orders: number; revenuePaise: number }[] = [];
    for (let d = 13; d >= 0; d--) {
      const start = now - d * DAY_MS - (now % DAY_MS);
      const end = start + DAY_MS;
      const dayOrders = orders.filter((o) => o.createdAt >= start && o.createdAt < end);
      series.push({
        day: new Date(start).toISOString().slice(0, 10),
        label: new Date(start).toLocaleDateString("en-IN", { day: "numeric", month: "short" }),
        orders: dayOrders.length,
        revenuePaise: dayOrders
          .filter((o) => o.paymentStatus === "PAID" && o.orderStatus !== "CANCELLED")
          .reduce((s, o) => s + o.totalPaise, 0),
      });
    }

    // status distribution
    const statusCounts = orders.reduce<Record<string, number>>((acc, o) => {
      acc[o.orderStatus] = (acc[o.orderStatus] ?? 0) + 1;
      return acc;
    }, {});

    // top restaurants by revenue
    const byRestaurant = orders
      .filter((o) => o.paymentStatus === "PAID" && o.orderStatus !== "CANCELLED")
      .reduce<Record<string, { name: string; revenuePaise: number; orders: number }>>((acc, o) => {
        const entry = (acc[o.restaurantName] ??= { name: o.restaurantName, revenuePaise: 0, orders: 0 });
        entry.revenuePaise += o.totalPaise;
        entry.orders += 1;
        return acc;
      }, {});
    const topRestaurants = Object.values(byRestaurant)
      .sort((a, b) => b.revenuePaise - a.revenuePaise)
      .slice(0, 6);

    const grossRevenuePaise = orders
      .filter((o) => o.paymentStatus === "PAID" && o.orderStatus !== "CANCELLED")
      .reduce((s, o) => s + o.totalPaise, 0);

    return { series, statusCounts, topRestaurants, grossRevenuePaise, totalOrders: orders.length };
  },
});
