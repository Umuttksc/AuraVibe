import { ConvexError } from "convex/values";
import type { MutationCtx, QueryCtx } from "./_generated/server";
import type { Id } from "./_generated/dataModel.d.ts";

export async function getCurrentUser(ctx: QueryCtx | MutationCtx) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) {
    throw new ConvexError({
      message: "User not logged in",
      code: "UNAUTHENTICATED",
    });
  }

  const user = await ctx.db
    .query("users")
    .withIndex("by_token", (q) =>
      q.eq("tokenIdentifier", identity.tokenIdentifier),
    )
    .unique();

  if (!user) {
    throw new ConvexError({
      message: "User not found",
      code: "NOT_FOUND",
    });
  }

  return user;
}

export async function requireAdmin(ctx: QueryCtx | MutationCtx) {
  const user = await getCurrentUser(ctx);

  if (!user.role || user.role !== "admin") {
    throw new ConvexError({
      message: "Admin access required",
      code: "FORBIDDEN",
    });
  }

  return user;
}

export async function requireSuperAdmin(ctx: QueryCtx | MutationCtx) {
  const user = await getCurrentUser(ctx);

  if (!user.isSuperAdmin) {
    throw new ConvexError({
      message: "Super admin access required",
      code: "FORBIDDEN",
    });
  }

  return user;
}

// Check if admin has specific permission
export async function checkAdminPermission(
  ctx: QueryCtx | MutationCtx,
  permission: "canManageUsers" | "canGrantTokens" | "canManageReports" | "canManageContent"
) {
  const user = await requireAdmin(ctx);
  
  // Super admin has all permissions
  if (user.isSuperAdmin) {
    return user;
  }
  
  // Check if regular admin has the specific permission
  if (!user.adminPermissions || !user.adminPermissions[permission]) {
    throw new ConvexError({
      message: "Bu işlem için yetkiniz yok",
      code: "FORBIDDEN",
    });
  }
  
  return user;
}

// Check if there's a block relationship between two users (either direction)
export async function isBlocked(
  ctx: QueryCtx | MutationCtx,
  userId1: Id<"users">,
  userId2: Id<"users">
): Promise<boolean> {
  // Check if userId1 blocked userId2
  const block1 = await ctx.db
    .query("blocks")
    .withIndex("by_blocker_and_blocked", (q) =>
      q.eq("blockerId", userId1).eq("blockedId", userId2)
    )
    .unique();

  if (block1) return true;

  // Check if userId2 blocked userId1
  const block2 = await ctx.db
    .query("blocks")
    .withIndex("by_blocker_and_blocked", (q) =>
      q.eq("blockerId", userId2).eq("blockedId", userId1)
    )
    .unique();

  return !!block2;
}

// Check if currentUser has muted targetUser
export async function isMuted(
  ctx: QueryCtx | MutationCtx,
  currentUserId: Id<"users">,
  targetUserId: Id<"users">
): Promise<boolean> {
  const mute = await ctx.db
    .query("mutes")
    .withIndex("by_muter_and_muted", (q) =>
      q.eq("muterId", currentUserId).eq("mutedId", targetUserId)
    )
    .unique();

  return !!mute;
}

// Get list of user IDs that current user has blocked or been blocked by
export async function getBlockedUserIds(
  ctx: QueryCtx | MutationCtx,
  userId: Id<"users">
): Promise<Id<"users">[]> {
  const [blockedByMe, blockedMe] = await Promise.all([
    ctx.db
      .query("blocks")
      .withIndex("by_blocker", (q) => q.eq("blockerId", userId))
      .collect(),
    ctx.db
      .query("blocks")
      .withIndex("by_blocked", (q) => q.eq("blockedId", userId))
      .collect(),
  ]);

  const blockedIds = new Set<Id<"users">>();
  blockedByMe.forEach((b) => blockedIds.add(b.blockedId));
  blockedMe.forEach((b) => blockedIds.add(b.blockerId));

  return Array.from(blockedIds);
}

// Get list of user IDs that current user has muted
export async function getMutedUserIds(
  ctx: QueryCtx | MutationCtx,
  userId: Id<"users">
): Promise<Id<"users">[]> {
  const mutes = await ctx.db
    .query("mutes")
    .withIndex("by_muter", (q) => q.eq("muterId", userId))
    .collect();

  return mutes.map((m) => m.mutedId);
}
