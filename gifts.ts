import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { ConvexError } from "convex/values";

// Get all gifts (excluding deleted ones by default)
export const getAllGifts = query({
  args: {},
  handler: async (ctx) => {
    const gifts = await ctx.db
      .query("gifts")
      .filter((q) => q.neq(q.field("isDeleted"), true))
      .collect();
    return gifts;
  },
});

// Get active gifts (available for purchase)
export const getActiveGifts = query({
  args: {},
  handler: async (ctx) => {
    const gifts = await ctx.db
      .query("gifts")
      .filter((q) =>
        q.and(
          q.eq(q.field("isActive"), true),
          q.neq(q.field("isDeleted"), true)
        )
      )
      .collect();
    return gifts;
  },
});

// Get gifts by category
export const getGiftsByCategory = query({
  args: { category: v.string() },
  handler: async (ctx, args) => {
    const gifts = await ctx.db
      .query("gifts")
      .filter((q) =>
        q.and(
          q.eq(q.field("category"), args.category),
          q.eq(q.field("isActive"), true),
          q.neq(q.field("isDeleted"), true)
        )
      )
      .collect();
    return gifts;
  },
});

// Admin: Create gift
export const createGift = mutation({
  args: {
    name: v.string(),
    description: v.optional(v.string()),
    price: v.number(),
    imageUrl: v.string(),
    category: v.string(),
    isActive: v.boolean(),
  },
  handler: async (ctx, args) => {
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
        q.eq("tokenIdentifier", identity.tokenIdentifier)
      )
      .unique();

    if (!user || user.role !== "admin") {
      throw new ConvexError({
        message: "Unauthorized - Admin only",
        code: "FORBIDDEN",
      });
    }

    // Check for duplicate gift name (case-insensitive)
    const existingGifts = await ctx.db.query("gifts").collect();
    const duplicate = existingGifts.find(
      (g) => g.name.toLowerCase() === args.name.toLowerCase() && !g.isDeleted
    );

    if (duplicate) {
      throw new ConvexError({
        message: `Bu isimde bir hediye zaten mevcut: ${duplicate.name}`,
        code: "CONFLICT",
      });
    }

    const giftId = await ctx.db.insert("gifts", {
      ...args,
      isDeleted: false,
    });
    return giftId;
  },
});

// Admin: Update gift
export const updateGift = mutation({
  args: {
    giftId: v.id("gifts"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    price: v.optional(v.number()),
    imageUrl: v.optional(v.string()),
    category: v.optional(v.string()),
    isActive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
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
        q.eq("tokenIdentifier", identity.tokenIdentifier)
      )
      .unique();

    if (!user || user.role !== "admin") {
      throw new ConvexError({
        message: "Unauthorized - Admin only",
        code: "FORBIDDEN",
      });
    }

    // Check for duplicate gift name if name is being updated
    if (args.name) {
      const existingGifts = await ctx.db.query("gifts").collect();
      const duplicate = existingGifts.find(
        (g) => 
          g._id !== args.giftId && 
          g.name.toLowerCase() === args.name!.toLowerCase() && 
          !g.isDeleted
      );

      if (duplicate) {
        throw new ConvexError({
          message: `Bu isimde bir hediye zaten mevcut: ${duplicate.name}`,
          code: "CONFLICT",
        });
      }
    }

    const { giftId, ...updates } = args;
    await ctx.db.patch(giftId, updates);
    return { success: true };
  },
});

// Admin: Soft delete gift
export const deleteGift = mutation({
  args: {
    giftId: v.id("gifts"),
  },
  handler: async (ctx, args) => {
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
        q.eq("tokenIdentifier", identity.tokenIdentifier)
      )
      .unique();

    if (!user || user.role !== "admin") {
      throw new ConvexError({
        message: "Unauthorized - Admin only",
        code: "FORBIDDEN",
      });
    }

    await ctx.db.patch(args.giftId, { isDeleted: true });
    return { success: true };
  },
});

// Get gift by ID
export const getGift = query({
  args: { giftId: v.id("gifts") },
  handler: async (ctx, args) => {
    const gift = await ctx.db.get(args.giftId);
    return gift;
  },
});

// Admin: Get deleted gifts
export const getDeletedGifts = query({
  args: {},
  handler: async (ctx) => {
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
        q.eq("tokenIdentifier", identity.tokenIdentifier)
      )
      .unique();

    if (!user || user.role !== "admin") {
      throw new ConvexError({
        message: "Unauthorized - Admin only",
        code: "FORBIDDEN",
      });
    }

    const deletedGifts = await ctx.db
      .query("gifts")
      .filter((q) => q.eq(q.field("isDeleted"), true))
      .collect();
    return deletedGifts;
  },
});

// Admin: Restore deleted gift
export const restoreGift = mutation({
  args: {
    giftId: v.id("gifts"),
  },
  handler: async (ctx, args) => {
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
        q.eq("tokenIdentifier", identity.tokenIdentifier)
      )
      .unique();

    if (!user || user.role !== "admin") {
      throw new ConvexError({
        message: "Unauthorized - Admin only",
        code: "FORBIDDEN",
      });
    }

    await ctx.db.patch(args.giftId, { isDeleted: false });
    return { success: true };
  },
});

// Admin: Permanently delete gift
export const permanentlyDeleteGift = mutation({
  args: {
    giftId: v.id("gifts"),
  },
  handler: async (ctx, args) => {
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
        q.eq("tokenIdentifier", identity.tokenIdentifier)
      )
      .unique();

    if (!user || user.role !== "admin") {
      throw new ConvexError({
        message: "Unauthorized - Admin only",
        code: "FORBIDDEN",
      });
    }

    await ctx.db.delete(args.giftId);
    return { success: true };
  },
});

// Admin: Check for duplicate gifts
export const checkDuplicateGifts = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return { hasDuplicates: false, duplicateCount: 0, duplicateGroups: [] };

    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier)
      )
      .unique();

    if (!user || (user.role !== "admin" && !user.isSuperAdmin)) {
      return { hasDuplicates: false, duplicateCount: 0, duplicateGroups: [] };
    }

    // Get all non-deleted gifts
    const allGifts = await ctx.db
      .query("gifts")
      .filter((q) => q.neq(q.field("isDeleted"), true))
      .collect();

    // Group by name (case-insensitive)
    const giftsByName = new Map<string, typeof allGifts>();
    for (const gift of allGifts) {
      const normalizedName = gift.name.toLowerCase();
      const existing = giftsByName.get(normalizedName) || [];
      existing.push(gift);
      giftsByName.set(normalizedName, existing);
    }

    // Find duplicates
    const duplicateGroups: { name: string; count: number }[] = [];
    let totalDuplicateCount = 0;

    for (const [name, gifts] of giftsByName.entries()) {
      if (gifts.length > 1) {
        duplicateGroups.push({ name: gifts[0].name, count: gifts.length });
        totalDuplicateCount += gifts.length - 1; // Count extras, not the one we'll keep
      }
    }

    return {
      hasDuplicates: duplicateGroups.length > 0,
      duplicateCount: totalDuplicateCount,
      duplicateGroups: duplicateGroups.sort((a, b) => b.count - a.count),
    };
  },
});

// Admin: Remove duplicate gifts (keep oldest, delete newer duplicates)
export const removeDuplicateGifts = mutation({
  args: {},
  handler: async (ctx) => {
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
        q.eq("tokenIdentifier", identity.tokenIdentifier)
      )
      .unique();

    if (!user || (user.role !== "admin" && !user.isSuperAdmin)) {
      throw new ConvexError({
        message: "Unauthorized - Admin only",
        code: "FORBIDDEN",
      });
    }

    // Get all non-deleted gifts
    const allGifts = await ctx.db
      .query("gifts")
      .filter((q) => q.neq(q.field("isDeleted"), true))
      .collect();

    // Group by name (case-insensitive)
    const giftsByName = new Map<string, typeof allGifts>();
    for (const gift of allGifts) {
      const normalizedName = gift.name.toLowerCase();
      const existing = giftsByName.get(normalizedName) || [];
      existing.push(gift);
      giftsByName.set(normalizedName, existing);
    }

    let deletedCount = 0;

    // For each group with duplicates, keep the oldest (lowest _creationTime)
    for (const [name, gifts] of giftsByName.entries()) {
      if (gifts.length > 1) {
        // Sort by creation time (oldest first)
        gifts.sort((a, b) => a._creationTime - b._creationTime);

        // Delete all but the first (oldest)
        for (let i = 1; i < gifts.length; i++) {
          await ctx.db.delete(gifts[i]._id);
          deletedCount++;
        }
      }
    }

    return { success: true, deletedCount };
  },
});

// Admin: Generate upload URL for gift images
export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
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
        q.eq("tokenIdentifier", identity.tokenIdentifier)
      )
      .unique();

    if (!user || user.role !== "admin") {
      throw new ConvexError({
        message: "Unauthorized - Admin only",
        code: "FORBIDDEN",
      });
    }

    return await ctx.storage.generateUploadUrl();
  },
});
