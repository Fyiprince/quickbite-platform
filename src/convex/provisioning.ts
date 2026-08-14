import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { err, getSessionUser, requireRole } from "./lib";
import { ROLES } from "./schema";

/**
 * RBAC provisioning — QuickBite's equivalent of the spec's account rules:
 * - Customers: open self-signup (default role on first sign-in).
 * - Admins / Delivery partners: NO public registration. They are invited by
 *   an admin (or bootstrapped for the very first admin). The invite is keyed
 *   by email; when that person signs in, provisioning adopts the invite.
 *
 * Runs after every successful sign-in, idempotently.
 */
export const provisionProfile = mutation({
  handler: async (ctx) => {
    const user = await getSessionUser(ctx);
    if (!user) throw err("UNAUTHENTICATED", "Please sign in to continue");

    // Already provisioned?
    if (user.role && user.status) {
      return { role: user.role, status: user.status };
    }

    const email = (user.email ?? "").toLowerCase().trim();
    const invite = email
      ? await ctx.db
          .query("pendingInvites")
          .withIndex("by_email", (q) => q.eq("email", email))
          .first()
      : null;

    if (invite) {
      await ctx.db.patch(user._id, {
        role: invite.role,
        status: invite.status,
        name: user.name ?? invite.name,
        phone: invite.phone,
        vehicleType: invite.vehicleType,
      });
      await ctx.db.delete(invite._id);
      return { role: invite.role, status: invite.status };
    }

    // Fresh self-signup → customer
    const fallbackName = user.name ?? (user.isAnonymous ? "Guest" : user.email?.split("@")[0] ?? "Customer");
    await ctx.db.patch(user._id, {
      role: ROLES.CUSTOMER,
      status: "ACTIVE",
      name: user.name ?? fallbackName,
    });
    return { role: ROLES.CUSTOMER, status: "ACTIVE" };
  },
});

/**
 * One-time bootstrap for the very first admin. Only works while no admin
 * exists (equivalent of prisma/seed.ts creating the first ACTIVE admin).
 * The email used here is the account that becomes admin on sign-in.
 */
export const bootstrapFirstAdmin = mutation({
  args: { email: v.string(), name: v.string() },
  handler: async (ctx, args) => {
    const email = args.email.toLowerCase().trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw err("VALIDATION", "Enter a valid email address");
    }
    if (!args.name.trim()) throw err("VALIDATION", "Enter a name");

    const existingAdmins = await ctx.db
      .query("users")
      .withIndex("by_role", (q) => q.eq("role", "ADMIN"))
      .collect();
    const adminInvites = await ctx.db
      .query("pendingInvites")
      .withIndex("by_email", (q) => q.eq("email", email))
      .filter((q) => q.eq(q.field("role"), "ADMIN"))
      .collect();
    if (existingAdmins.length > 0 || adminInvites.length > 0) {
      throw err("FORBIDDEN", "An admin account already exists");
    }

    // If this email already signed up as a customer, upgrade them directly.
    const existingUser = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", email))
      .first();
    if (existingUser) {
      await ctx.db.patch(existingUser._id, {
        role: ROLES.ADMIN,
        status: "ACTIVE",
        name: args.name.trim(),
      });
    } else {
      await ctx.db.insert("pendingInvites", {
        email,
        role: ROLES.ADMIN,
        status: "ACTIVE",
        name: args.name.trim(),
        createdAt: Date.now(),
      });
    }
    return { email };
  },
});

/** Admin → create another admin (invite, no public route). */
export const createAdmin = mutation({
  args: { email: v.string(), name: v.string() },
  handler: async (ctx, args) => {
    const user = await getSessionUser(ctx);
    requireRole(user, ROLES.ADMIN);

    const email = args.email.toLowerCase().trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw err("VALIDATION", "Enter a valid email address");
    }

    const existing = await ctx.db
      .query("pendingInvites")
      .withIndex("by_email", (q) => q.eq("email", email))
      .first();
    if (existing) throw err("VALIDATION", "An invite for this email already exists");

    const existingUser = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", email))
      .first();
    if (existingUser && existingUser.role === ROLES.ADMIN) {
      throw err("VALIDATION", "This user is already an admin");
    }
    if (existingUser) {
      await ctx.db.patch(existingUser._id, {
        role: ROLES.ADMIN,
        status: "ACTIVE",
        name: args.name.trim() || existingUser.name,
      });
    } else {
      await ctx.db.insert("pendingInvites", {
        email,
        role: ROLES.ADMIN,
        status: "ACTIVE",
        name: args.name.trim(),
        createdAt: Date.now(),
      });
    }
    return { email };
  },
});

/** Customers can complete their profile (name/phone) after signing up. */
export const completeProfile = mutation({
  args: { name: v.string(), phone: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const user = await getSessionUser(ctx);
    requireRole(user, ROLES.CUSTOMER);
    if (!args.name.trim()) throw err("VALIDATION", "Name is required");
    await ctx.db.patch(user._id, {
      name: args.name.trim(),
      phone: args.phone?.trim() || user.phone,
    });
    return true;
  },
});

/** Delivery partners toggle availability (shown on their dashboard). */
export const setAvailability = mutation({
  args: { isAvailable: v.boolean() },
  handler: async (ctx, args) => {
    const user = await getSessionUser(ctx);
    requireRole(user, ROLES.DELIVERY);
    await ctx.db.patch(user._id, { isAvailable: args.isAvailable });
    return args.isAvailable;
  },
});

/** Whether the first admin still needs to be bootstrapped (shown on landing). */
export const needsBootstrap = query({
  handler: async (ctx) => {
    const admins = await ctx.db
      .query("users")
      .withIndex("by_role", (q) => q.eq("role", "ADMIN"))
      .collect();
    if (admins.length > 0) return false;
    const invites = await ctx.db.query("pendingInvites").collect();
    return !invites.some((i) => i.role === "ADMIN");
  },
});
