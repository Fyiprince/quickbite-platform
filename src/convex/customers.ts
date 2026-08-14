import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";
import { err, getSessionUser, notifyAdmins, notifyUser, requireRole } from "./lib";
import { ROLES } from "./schema";

// ---------------------------------------------------------------------------
// Browsing
// ---------------------------------------------------------------------------
export const listRestaurants = query({
  handler: async (ctx) => {
    const restaurants = await ctx.db
      .query("restaurants")
      .filter((q) => q.neq(q.field("isArchived"), true))
      .collect();
    const withCounts = await Promise.all(
      restaurants.map(async (r) => {
        const menuItems = await ctx.db
          .query("menuItems")
          .withIndex("by_restaurant", (q) => q.eq("restaurantId", r._id))
          .filter((q) => q.eq(q.field("isAvailable"), true))
          .collect();
        const menuCount = menuItems.length;
        return { ...r, menuCount };
      }),
    );
    return withCounts.sort((a, b) => (b.isFeatured ? 1 : 0) - (a.isFeatured ? 1 : 0) || b.rating - a.rating);
  },
});

export const getRestaurant = query({
  args: { restaurantId: v.id("restaurants") },
  handler: async (ctx, args) => {
    const restaurant = await ctx.db.get(args.restaurantId);
    if (!restaurant || restaurant.isArchived) throw err("NOT_FOUND", "Restaurant not found");
    const menu = await ctx.db
      .query("menuItems")
      .withIndex("by_restaurant", (q) => q.eq("restaurantId", args.restaurantId))
      .collect();
    const grouped = menu.reduce<Record<string, typeof menu>>((acc, item) => {
      (acc[item.category] ??= []).push(item);
      return acc;
    }, {});
    return { restaurant, menu, grouped };
  },
});

// ---------------------------------------------------------------------------
// Addresses
// ---------------------------------------------------------------------------
export const listMyAddresses = query({
  handler: async (ctx) => {
    const user = await getSessionUser(ctx);
    requireRole(user, ROLES.CUSTOMER);
    const addresses = await ctx.db
      .query("addresses")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();
    return addresses.sort((a, b) => Number(b.isDefault) - Number(a.isDefault));
  },
});

export const addAddress = mutation({
  args: {
    label: v.string(),
    fullAddress: v.string(),
    latitude: v.optional(v.number()),
    longitude: v.optional(v.number()),
    isDefault: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const user = await getSessionUser(ctx);
    requireRole(user, ROLES.CUSTOMER);
    if (!args.label.trim() || !args.fullAddress.trim()) {
      throw err("VALIDATION", "Label and address are required");
    }
    const existing = await ctx.db
      .query("addresses")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();
    const makeDefault = args.isDefault ?? existing.length === 0;
    if (makeDefault) {
      for (const a of existing) {
        if (a.isDefault) await ctx.db.patch(a._id, { isDefault: false });
      }
    }
    return await ctx.db.insert("addresses", {
      userId: user._id,
      label: args.label.trim(),
      fullAddress: args.fullAddress.trim(),
      latitude: args.latitude ?? 12.9716,
      longitude: args.longitude ?? 77.5946,
      isDefault: makeDefault,
      createdAt: Date.now(),
    });
  },
});

export const updateAddress = mutation({
  args: {
    addressId: v.id("addresses"),
    label: v.string(),
    fullAddress: v.string(),
    isDefault: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const user = await getSessionUser(ctx);
    requireRole(user, ROLES.CUSTOMER);
    const address = await ctx.db.get(args.addressId);
    if (!address || address.userId !== user._id) throw err("FORBIDDEN", "Address not found");
    if (args.isDefault) {
      const others = await ctx.db
        .query("addresses")
        .withIndex("by_user", (q) => q.eq("userId", user._id))
        .collect();
      for (const a of others) {
        if (a.isDefault && a._id !== address._id) await ctx.db.patch(a._id, { isDefault: false });
      }
    }
    await ctx.db.patch(address._id, {
      label: args.label.trim() || address.label,
      fullAddress: args.fullAddress.trim() || address.fullAddress,
      isDefault: args.isDefault ?? address.isDefault,
    });
    return address._id;
  },
});

export const deleteAddress = mutation({
  args: { addressId: v.id("addresses") },
  handler: async (ctx, args) => {
    const user = await getSessionUser(ctx);
    requireRole(user, ROLES.CUSTOMER);
    const address = await ctx.db.get(args.addressId);
    if (!address || address.userId !== user._id) throw err("FORBIDDEN", "Address not found");
    await ctx.db.delete(address._id);
    return true;
  },
});

// ---------------------------------------------------------------------------
// Coupons
// ---------------------------------------------------------------------------
export const previewCoupon = query({
  args: { code: v.string(), subtotalPaise: v.number() },
  handler: async (ctx, args) => {
    const code = args.code.trim().toUpperCase();
    if (!code) return null;
    const coupon = await ctx.db
      .query("coupons")
      .withIndex("by_code", (q) => q.eq("code", code))
      .first();
    if (!coupon || !coupon.isActive) {
      throw err("INVALID_COUPON", "This coupon code is not valid");
    }
    if (coupon.expiresAt && coupon.expiresAt < Date.now()) {
      throw err("INVALID_COUPON", "This coupon has expired");
    }
    if (args.subtotalPaise < coupon.minOrderPaise) {
      throw err(
        "INVALID_COUPON",
        `Add items worth ${"₹" + (coupon.minOrderPaise / 100).toLocaleString("en-IN")} more to use this coupon`,
      );
    }
    const discount =
      coupon.discountType === "FLAT"
        ? Math.min(coupon.discountValuePaise, args.subtotalPaise)
        : Math.min(
            Math.round((args.subtotalPaise * coupon.discountValuePaise) / 100),
            coupon.maxDiscountPaise ?? Number.MAX_SAFE_INTEGER,
          );
    return { couponId: coupon._id, code: coupon.code, discountPaise: discount };
  },
});

// ---------------------------------------------------------------------------
// Orders — total is ALWAYS recomputed server-side from stored menu prices.
// The client cart is only for display; nothing client-sent is trusted.
// ---------------------------------------------------------------------------
export const placeOrder = mutation({
  args: {
    restaurantId: v.id("restaurants"),
    addressId: v.id("addresses"),
    couponCode: v.optional(v.string()),
    items: v.array(v.object({ menuItemId: v.id("menuItems"), quantity: v.number() })),
    paymentMethod: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await getSessionUser(ctx);
    requireRole(user, ROLES.CUSTOMER);

    if (args.items.length === 0) throw err("VALIDATION", "Your cart is empty");
    if (args.items.some((i) => i.quantity < 1 || i.quantity > 50)) {
      throw err("VALIDATION", "Invalid quantity");
    }

    const restaurant = await ctx.db.get(args.restaurantId);
    if (!restaurant || restaurant.isArchived) throw err("NOT_FOUND", "Restaurant not found");
    if (!restaurant.isOpen) throw err("CLOSED", `${restaurant.name} is currently closed`);

    const address = await ctx.db.get(args.addressId);
    if (!address || address.userId !== user._id) throw err("FORBIDDEN", "Address not found");

    // Server-side price lookup — never trust client prices
    const lineItems = [];
    let subtotalPaise = 0;
    for (const line of args.items) {
      const menuItem = await ctx.db.get(line.menuItemId);
      if (!menuItem || menuItem.restaurantId !== restaurant._id) {
        throw err("VALIDATION", `"${menuItem?.name ?? "Item"}" is not on this restaurant's menu`);
      }
      if (!menuItem.isAvailable) throw err("VALIDATION", `${menuItem.name} is no longer available`);
      lineItems.push({
        menuItemId: menuItem._id,
        name: menuItem.name,
        quantity: line.quantity,
        pricePaise: menuItem.pricePaise,
        isVeg: menuItem.isVeg,
      });
      subtotalPaise += menuItem.pricePaise * line.quantity;
    }

    let discountPaise = 0;
    let couponId: Id<"coupons"> | undefined = undefined;
    if (args.couponCode?.trim()) {
      const coupon = await ctx.db
        .query("coupons")
        .withIndex("by_code", (q) => q.eq("code", args.couponCode!.trim().toUpperCase()))
        .first();
      if (!coupon || !coupon.isActive) throw err("INVALID_COUPON", "This coupon code is not valid");
      if (coupon.expiresAt && coupon.expiresAt < Date.now()) throw err("INVALID_COUPON", "This coupon has expired");
      if (subtotalPaise < coupon.minOrderPaise) {
        throw err("INVALID_COUPON", "This coupon does not apply to your order total");
      }
      discountPaise =
        coupon.discountType === "FLAT"
          ? Math.min(coupon.discountValuePaise, subtotalPaise)
          : Math.min(
              Math.round((subtotalPaise * coupon.discountValuePaise) / 100),
              coupon.maxDiscountPaise ?? Number.MAX_SAFE_INTEGER,
            );
      couponId = coupon._id;
    }

    const totalPaise = subtotalPaise + restaurant.deliveryFeePaise - discountPaise;
    const now = Date.now();

    const orderId = await ctx.db.insert("orders", {
      customerId: user._id,
      customerName: user.name ?? "Customer",
      restaurantId: restaurant._id,
      restaurantName: restaurant.name,
      restaurantLat: restaurant.latitude,
      restaurantLng: restaurant.longitude,
      addressId: address._id,
      addressLabel: address.label,
      addressFull: address.fullAddress,
      addressLat: address.latitude,
      addressLng: address.longitude,
      couponId,
      couponCode: args.couponCode?.trim().toUpperCase(),
      items: lineItems,
      subtotalPaise,
      deliveryFeePaise: restaurant.deliveryFeePaise,
      discountPaise,
      totalPaise,
      paymentStatus: "PAID",
      paymentMethod: args.paymentMethod,
      orderStatus: "PENDING",
      statusHistory: [{ status: "PENDING", at: now }],
      createdAt: now,
    });

    await notifyAdmins(
      ctx,
      "order:new",
      `New order #${orderId.slice(-6).toUpperCase()} from ${restaurant.name} — ${"₹" + (totalPaise / 100).toLocaleString("en-IN")}`,
      orderId,
    );
    await notifyUser(
      ctx,
      user._id,
      "order:placed",
      `Order placed at ${restaurant.name}. We'll keep you posted!`,
      orderId,
    );

    return { orderId };
  },
});

export const myOrders = query({
  handler: async (ctx) => {
    const user = await getSessionUser(ctx);
    requireRole(user, ROLES.CUSTOMER);
    const orders = await ctx.db
      .query("orders")
      .withIndex("by_customer", (q) => q.eq("customerId", user._id))
      .order("desc")
      .take(60);
    return orders;
  },
});

export const getOrder = query({
  args: { orderId: v.id("orders") },
  handler: async (ctx, args) => {
    const user = await getSessionUser(ctx);
    if (!user) throw err("UNAUTHENTICATED", "Please sign in to continue");
    const order = await ctx.db.get(args.orderId);
    if (!order) throw err("NOT_FOUND", "Order not found");
    // Ownership check (spec: shared route does its own ownership check)
    const isOwner =
      order.customerId === user._id ||
      user.role === ROLES.ADMIN ||
      order.deliveryPartnerId === user._id;
    if (!isOwner) throw err("FORBIDDEN", "You don't have access to this order");

    let deliveryPartner = null;
    if (order.deliveryPartnerId) {
      const partner = await ctx.db.get(order.deliveryPartnerId);
      deliveryPartner = partner
        ? {
            name: partner.name,
            phone: partner.phone,
            vehicleType: partner.vehicleType,
            currentLat: partner.currentLat,
            currentLng: partner.currentLng,
            isAvailable: partner.isAvailable,
          }
        : null;
    }
    return { order, deliveryPartner };
  },
});

export const cancelOrder = mutation({
  args: { orderId: v.id("orders") },
  handler: async (ctx, args) => {
    const user = await getSessionUser(ctx);
    requireRole(user, ROLES.CUSTOMER);
    const order = await ctx.db.get(args.orderId);
    if (!order || order.customerId !== user._id) throw err("FORBIDDEN", "Order not found");
    if (order.orderStatus !== "PENDING" && order.orderStatus !== "ACCEPTED") {
      throw err("INVALID_STATUS", "This order can no longer be cancelled");
    }
    const now = Date.now();
    await ctx.db.patch(order._id, {
      orderStatus: "CANCELLED",
      statusHistory: [...order.statusHistory, { status: "CANCELLED", at: now }],
      cancelledAt: now,
      cancelledBy: "customer",
    });
    await notifyAdmins(ctx, "order:cancelled", `Order #${order._id.slice(-6).toUpperCase()} was cancelled by the customer`, order._id);
    return true;
  },
});

