import { getAuthUserId } from "@convex-dev/auth/server";
import { ConvexError, v } from "convex/values";
import { Doc, Id } from "./_generated/dataModel";
import { MutationCtx, QueryCtx } from "./_generated/server";
import {
  ORDER_STATUSES,
  OrderStatus,
  Role,
  roleValidator,
} from "./schema";

// ---------------------------------------------------------------------------
// Error helpers — every mutation throws structured errors that the client
// surfaces as toasts. This is the "consistent { error, code } shape" of the
// spec, adapted to Convex.
// ---------------------------------------------------------------------------
export function err(code: string, message: string): ConvexError<string> {
  return new ConvexError(JSON.stringify({ code, message }));
}

export function parseError(error: unknown): string {
  if (error instanceof ConvexError) {
    try {
      const data = JSON.parse(String(error.data));
      if (data && typeof data.message === "string") return data.message;
    } catch {
      /* fall through */
    }
    return String(error.data ?? error);
  }
  return error instanceof Error ? error.message : "Something went wrong";
}

// ---------------------------------------------------------------------------
// Session + RBAC (middleware chain: requireAuth → requireActive → requireRole)
// ---------------------------------------------------------------------------
export async function getSessionUser(ctx: QueryCtx | MutationCtx) {
  const userId = await getAuthUserId(ctx);
  if (userId === null) return null;
  return await ctx.db.get(userId);
}

export function requireAuth(user: Doc<"users"> | null): asserts user is Doc<"users"> {
  if (!user) throw err("UNAUTHENTICATED", "Please sign in to continue");
}

export function requireActive(user: Doc<"users">) {
  if (user.status !== "ACTIVE") {
    throw err(
      "FORBIDDEN",
      user.role === "DELIVERY" && user.status === "PENDING"
        ? "Your delivery partner account is pending approval by an admin"
        : "Your account is not active yet",
    );
  }
}

export function requireRole(user: Doc<"users"> | null, role: Role): asserts user is Doc<"users"> {
  requireAuth(user);
  requireActive(user);
  if (user.role !== role) {
    throw err(
      "FORBIDDEN",
      `You do not have permission to access this area (required role: ${role})`,
    );
  }
}

export const roleArg = {
  user: v.union(
    v.object({ role: roleValidator, status: v.optional(v.string()) }),
    v.null(),
  ),
};

// ---------------------------------------------------------------------------
// Order state machine — forward-only, enforced server-side (Section 7)
// ---------------------------------------------------------------------------
export function canTransition(from: OrderStatus, to: OrderStatus): boolean {
  if (from === to) return false;
  if (to === "CANCELLED") return from === "PENDING" || from === "ACCEPTED";
  const i = ORDER_STATUSES.indexOf(from);
  const j = ORDER_STATUSES.indexOf(to);
  // exactly one step forward through the happy path
  return i >= 0 && j === i + 1;
}

export function assertTransition(from: OrderStatus, to: OrderStatus) {
  if (!canTransition(from, to)) {
    throw err(
      "INVALID_STATUS",
      `Order cannot move from ${from} to ${to}`,
    );
  }
}

// ---------------------------------------------------------------------------
// Notifications — the reactive stand-in for the Socket.IO event bus.
// Every status change writes a notification; frontends subscribe via reactive
// queries, so admins/customers/partners see updates in real time.
// ---------------------------------------------------------------------------
export async function notifyUser(
  ctx: MutationCtx,
  userId: Id<"users">,
  type: string,
  message: string,
  orderId?: Id<"orders">,
) {
  await ctx.db.insert("notifications", {
    userId,
    type,
    message,
    orderId,
    isRead: false,
    createdAt: Date.now(),
  });
}

export async function notifyAdmins(
  ctx: MutationCtx,
  type: string,
  message: string,
  orderId?: Id<"orders">,
) {
  const admins = await ctx.db
    .query("users")
    .withIndex("by_role", (q) => q.eq("role", "ADMIN"))
    .collect();
  for (const admin of admins) {
    await notifyUser(ctx, admin._id, type, message, orderId);
  }
}

// ---------------------------------------------------------------------------
// Money — everything is integer paise to avoid float drift
// ---------------------------------------------------------------------------
export function formatINR(paise: number): string {
  const rupees = paise / 100;
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: rupees % 1 === 0 ? 0 : 2,
  }).format(rupees);
}
