import { authTables } from "@convex-dev/auth/server";
import { defineSchema, defineTable } from "convex/server";
import { Infer, v } from "convex/values";

// ---------------------------------------------------------------------------
// Role / status unions — the backbone of QuickBite's RBAC
// ---------------------------------------------------------------------------
export const ROLES = {
  CUSTOMER: "CUSTOMER",
  ADMIN: "ADMIN",
  DELIVERY: "DELIVERY",
} as const;

export const roleValidator = v.union(
  v.literal(ROLES.CUSTOMER),
  v.literal(ROLES.ADMIN),
  v.literal(ROLES.DELIVERY),
);
export type Role = Infer<typeof roleValidator>;

export const accountStatusValidator = v.union(
  v.literal("ACTIVE"),
  v.literal("INACTIVE"),
  v.literal("PENDING"),
);
export type AccountStatus = Infer<typeof accountStatusValidator>;

// ---------------------------------------------------------------------------
// Order state machine (Section 7 of the spec)
// ---------------------------------------------------------------------------
export const ORDER_STATUSES = [
  "PENDING",
  "ACCEPTED",
  "PREPARING",
  "READY",
  "ASSIGNED",
  "PICKED_UP",
  "OUT_FOR_DELIVERY",
  "DELIVERED",
  "CANCELLED",
] as const;

export const orderStatusValidator = v.union(
  ...ORDER_STATUSES.map((s) => v.literal(s)),
);
export type OrderStatus = Infer<typeof orderStatusValidator>;

export const paymentStatusValidator = v.union(
  v.literal("PENDING"),
  v.literal("PAID"),
  v.literal("FAILED"),
  v.literal("REFUNDED"),
);
export type PaymentStatus = Infer<typeof paymentStatusValidator>;

const schema = defineSchema(
  {
    // default auth tables using convex auth. do not remove or modify
    ...authTables,

    // users: the auth users table extended with QuickBite RBAC + delivery fields
    users: defineTable({
      name: v.optional(v.string()), // do not remove
      image: v.optional(v.string()), // do not remove
      email: v.optional(v.string()), // do not remove
      emailVerificationTime: v.optional(v.number()), // do not remove
      isAnonymous: v.optional(v.boolean()), // do not remove

      role: v.optional(roleValidator),
      status: v.optional(accountStatusValidator),
      phone: v.optional(v.string()),

      // delivery partner profile
      vehicleType: v.optional(v.string()),
      isAvailable: v.optional(v.boolean()),
      currentLat: v.optional(v.number()),
      currentLng: v.optional(v.number()),
    })
      .index("email", ["email"])
      .index("by_role", ["role"]),

    // Accounts provisioned by an admin that haven't signed up yet
    // (admin-created admins + delivery partners start here, per the spec)
    pendingInvites: defineTable({
      email: v.string(),
      role: roleValidator,
      status: accountStatusValidator,
      name: v.string(),
      phone: v.optional(v.string()),
      vehicleType: v.optional(v.string()),
      note: v.optional(v.string()),
      createdAt: v.number(),
    }).index("by_email", ["email"]),

    restaurants: defineTable({
      name: v.string(),
      description: v.optional(v.string()),
      cuisines: v.array(v.string()),
      rating: v.number(),
      ratingCount: v.number(),
      address: v.string(),
      latitude: v.number(),
      longitude: v.number(),
      isOpen: v.boolean(),
      imageUrl: v.optional(v.string()),
      deliveryTimeMins: v.number(),
      deliveryFeePaise: v.number(),
      isFeatured: v.optional(v.boolean()),
      isArchived: v.optional(v.boolean()),
      createdAt: v.number(),
    }).index("by_name", ["name"]),

    menuItems: defineTable({
      restaurantId: v.id("restaurants"),
      name: v.string(),
      description: v.optional(v.string()),
      category: v.string(),
      pricePaise: v.number(),
      isVeg: v.boolean(),
      isAvailable: v.boolean(),
      isPopular: v.optional(v.boolean()),
      createdAt: v.number(),
    }).index("by_restaurant", ["restaurantId"]),

    addresses: defineTable({
      userId: v.id("users"),
      label: v.string(),
      fullAddress: v.string(),
      latitude: v.number(),
      longitude: v.number(),
      isDefault: v.boolean(),
      createdAt: v.number(),
    }).index("by_user", ["userId"]),

    coupons: defineTable({
      code: v.string(),
      discountType: v.union(v.literal("PERCENT"), v.literal("FLAT")),
      discountValuePaise: v.number(),
      minOrderPaise: v.number(),
      maxDiscountPaise: v.optional(v.number()),
      expiresAt: v.optional(v.number()),
      isActive: v.boolean(),
      createdAt: v.number(),
    }).index("by_code", ["code"]),

    orders: defineTable({
      customerId: v.id("users"),
      customerName: v.string(),
      restaurantId: v.id("restaurants"),
      restaurantName: v.string(),
      restaurantLat: v.number(),
      restaurantLng: v.number(),
      deliveryPartnerId: v.optional(v.id("users")),
      deliveryPartnerName: v.optional(v.string()),
      addressId: v.id("addresses"),
      addressLabel: v.string(),
      addressFull: v.string(),
      addressLat: v.number(),
      addressLng: v.number(),
      couponId: v.optional(v.id("coupons")),
      couponCode: v.optional(v.string()),
      items: v.array(
        v.object({
          menuItemId: v.id("menuItems"),
          name: v.string(),
          quantity: v.number(),
          pricePaise: v.number(),
          isVeg: v.boolean(),
        }),
      ),
      subtotalPaise: v.number(),
      deliveryFeePaise: v.number(),
      discountPaise: v.number(),
      totalPaise: v.number(),
      paymentStatus: paymentStatusValidator,
      paymentMethod: v.optional(v.string()),
      orderStatus: orderStatusValidator,
      statusHistory: v.array(
        v.object({ status: orderStatusValidator, at: v.number() }),
      ),
      deliveryAcceptedAt: v.optional(v.number()),
      deliveredAt: v.optional(v.number()),
      cancelledAt: v.optional(v.number()),
      cancelledBy: v.optional(v.string()),
      createdAt: v.number(),
    })
      .index("by_customer", ["customerId"])
      .index("by_restaurant", ["restaurantId"])
      .index("by_partner", ["deliveryPartnerId"])
      .index("by_status", ["orderStatus"]),

    notifications: defineTable({
      userId: v.id("users"),
      type: v.string(),
      message: v.string(),
      orderId: v.optional(v.id("orders")),
      isRead: v.boolean(),
      createdAt: v.number(),
    }).index("by_user", ["userId"]),
  },
  {
    schemaValidation: false,
  },
);

export default schema;
