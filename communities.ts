import { ConvexError, v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { paginationOptsValidator } from "convex/server";
import type { Doc, Id } from "./_generated/dataModel.d.ts";

export const createCommunity = mutation({
  args: {
    name: v.string(),
    description: v.string(),
    imageId: v.optional(v.id("_storage")),
    isPrivate: v.boolean(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError({
        code: "UNAUTHENTICATED",
        message: "User not logged in",
      });
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier)
      )
      .unique();

    if (!user) {
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "User not found",
      });
    }

    // Create community
    const communityId = await ctx.db.insert("communities", {
      name: args.name,
      description: args.description,
      imageId: args.imageId,
      creatorId: user._id,
      isPrivate: args.isPrivate,
      memberCount: 1,
    });

    // Add creator as admin member
    await ctx.db.insert("communityMembers", {
      communityId,
      userId: user._id,
      role: "admin",
      joinedAt: Date.now(),
    });

    return communityId;
  },
});

export const getCommunities = query({
  args: { paginationOpts: paginationOptsValidator, searchQuery: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    let currentUser: Doc<"users"> | null = null;
    
    if (identity) {
      currentUser = await ctx.db
        .query("users")
        .withIndex("by_token", (q) =>
          q.eq("tokenIdentifier", identity.tokenIdentifier)
        )
        .unique();
    }

    const allCommunities = await ctx.db.query("communities").collect();
    
    // Filter by search query if provided
    let filteredCommunities = allCommunities;
    if (args.searchQuery && args.searchQuery.trim()) {
      const query = args.searchQuery.toLowerCase();
      filteredCommunities = allCommunities.filter(
        (community) =>
          community.name.toLowerCase().includes(query) ||
          community.description.toLowerCase().includes(query)
      );
    }

    // Filter out private communities user is not a member of
    if (currentUser) {
      const userMemberships = await ctx.db
        .query("communityMembers")
        .withIndex("by_user", (q) => q.eq("userId", currentUser._id))
        .collect();
      
      const memberCommunityIds = new Set(
        userMemberships.map((m) => m.communityId)
      );

      filteredCommunities = filteredCommunities.filter(
        (community) =>
          !community.isPrivate || memberCommunityIds.has(community._id)
      );
    } else {
      // Not logged in, only show public communities
      filteredCommunities = filteredCommunities.filter(
        (community) => !community.isPrivate
      );
    }

    // Sort by member count (most popular first)
    const sortedCommunities = filteredCommunities.sort(
      (a, b) => b.memberCount - a.memberCount
    );

    // Manual pagination
    const startIndex = args.paginationOpts.cursor
      ? parseInt(args.paginationOpts.cursor)
      : 0;
    const endIndex = startIndex + args.paginationOpts.numItems;
    const paginatedCommunities = sortedCommunities.slice(startIndex, endIndex);

    const communitiesWithDetails = await Promise.all(
      paginatedCommunities.map(async (community) => {
        const creator = await ctx.db.get(community.creatorId);
        
        let isMember = false;
        let isAdmin = false;
        if (currentUser) {
          const membership = await ctx.db
            .query("communityMembers")
            .withIndex("by_community_and_user", (q) =>
              q.eq("communityId", community._id).eq("userId", currentUser._id)
            )
            .unique();
          
          if (membership) {
            isMember = true;
            isAdmin = membership.role === "admin";
          }
        }

        return {
          ...community,
          creator,
          isMember,
          isAdmin,
          createdAt: new Date(community._creationTime).toISOString(),
        };
      })
    );

    return {
      page: communitiesWithDetails,
      isDone: endIndex >= sortedCommunities.length,
      continueCursor:
        endIndex >= sortedCommunities.length ? "" : endIndex.toString(),
    };
  },
});

export const getCommunityById = query({
  args: { communityId: v.id("communities") },
  handler: async (ctx, args) => {
    const community = await ctx.db.get(args.communityId);
    if (!community) {
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "Community not found",
      });
    }

    const identity = await ctx.auth.getUserIdentity();
    let currentUser: Doc<"users"> | null = null;
    let isMember = false;
    let isAdmin = false;

    if (identity) {
      currentUser = await ctx.db
        .query("users")
        .withIndex("by_token", (q) =>
          q.eq("tokenIdentifier", identity.tokenIdentifier)
        )
        .unique();

      if (currentUser) {
        const membership = await ctx.db
          .query("communityMembers")
          .withIndex("by_community_and_user", (q) =>
            q.eq("communityId", args.communityId).eq("userId", currentUser!._id)
          )
          .unique();

        if (membership) {
          isMember = true;
          isAdmin = membership.role === "admin";
        }
      }
    }

    // If private and user is not a member, deny access
    if (community.isPrivate && !isMember) {
      throw new ConvexError({
        code: "FORBIDDEN",
        message: "This community is private",
      });
    }

    const creator = await ctx.db.get(community.creatorId);

    return {
      ...community,
      creator,
      isMember,
      isAdmin,
      createdAt: new Date(community._creationTime).toISOString(),
    };
  },
});

export const getUserCommunities = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return [];
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier)
      )
      .unique();

    if (!user) {
      return [];
    }

    const memberships = await ctx.db
      .query("communityMembers")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();

    const communities = await Promise.all(
      memberships.map(async (membership) => {
        const community = await ctx.db.get(membership.communityId);
        if (!community) return null;

        const creator = await ctx.db.get(community.creatorId);

        return {
          ...community,
          creator,
          isMember: true,
          isAdmin: membership.role === "admin",
          joinedAt: new Date(membership.joinedAt).toISOString(),
          createdAt: new Date(community._creationTime).toISOString(),
        };
      })
    );

    return communities.filter((c) => c !== null);
  },
});

export const joinCommunity = mutation({
  args: { communityId: v.id("communities") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError({
        code: "UNAUTHENTICATED",
        message: "User not logged in",
      });
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier)
      )
      .unique();

    if (!user) {
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "User not found",
      });
    }

    const community = await ctx.db.get(args.communityId);
    if (!community) {
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "Community not found",
      });
    }

    // Check if already a member
    const existingMembership = await ctx.db
      .query("communityMembers")
      .withIndex("by_community_and_user", (q) =>
        q.eq("communityId", args.communityId).eq("userId", user._id)
      )
      .unique();

    if (existingMembership) {
      throw new ConvexError({
        code: "CONFLICT",
        message: "Already a member",
      });
    }

    // Add member
    await ctx.db.insert("communityMembers", {
      communityId: args.communityId,
      userId: user._id,
      role: "member",
      joinedAt: Date.now(),
    });

    // Update member count
    await ctx.db.patch(args.communityId, {
      memberCount: community.memberCount + 1,
    });
  },
});

export const leaveCommunity = mutation({
  args: { communityId: v.id("communities") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError({
        code: "UNAUTHENTICATED",
        message: "User not logged in",
      });
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier)
      )
      .unique();

    if (!user) {
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "User not found",
      });
    }

    const community = await ctx.db.get(args.communityId);
    if (!community) {
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "Community not found",
      });
    }

    const membership = await ctx.db
      .query("communityMembers")
      .withIndex("by_community_and_user", (q) =>
        q.eq("communityId", args.communityId).eq("userId", user._id)
      )
      .unique();

    if (!membership) {
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "Not a member",
      });
    }

    // Don't allow creator to leave
    if (community.creatorId === user._id) {
      throw new ConvexError({
        code: "FORBIDDEN",
        message: "Community creator cannot leave",
      });
    }

    // Remove member
    await ctx.db.delete(membership._id);

    // Update member count
    await ctx.db.patch(args.communityId, {
      memberCount: Math.max(0, community.memberCount - 1),
    });
  },
});

export const updateCommunitySettings = mutation({
  args: {
    communityId: v.id("communities"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    imageId: v.optional(v.id("_storage")),
    isPrivate: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError({
        code: "UNAUTHENTICATED",
        message: "User not logged in",
      });
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier)
      )
      .unique();

    if (!user) {
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "User not found",
      });
    }

    // Check if user is admin
    const membership = await ctx.db
      .query("communityMembers")
      .withIndex("by_community_and_user", (q) =>
        q.eq("communityId", args.communityId).eq("userId", user._id)
      )
      .unique();

    if (membership?.role !== "admin") {
      throw new ConvexError({
        code: "FORBIDDEN",
        message: "Only admins can update settings",
      });
    }

    const updates: {
      name?: string;
      description?: string;
      imageId?: Id<"_storage">;
      isPrivate?: boolean;
    } = {};

    if (args.name !== undefined) updates.name = args.name;
    if (args.description !== undefined) updates.description = args.description;
    if (args.imageId !== undefined) updates.imageId = args.imageId;
    if (args.isPrivate !== undefined) updates.isPrivate = args.isPrivate;

    await ctx.db.patch(args.communityId, updates);
  },
});

export const getCommunityMembers = query({
  args: { communityId: v.id("communities"), paginationOpts: paginationOptsValidator },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError({
        code: "UNAUTHENTICATED",
        message: "User not logged in",
      });
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier)
      )
      .unique();

    if (!user) {
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "User not found",
      });
    }

    // Check if user is a member
    const membership = await ctx.db
      .query("communityMembers")
      .withIndex("by_community_and_user", (q) =>
        q.eq("communityId", args.communityId).eq("userId", user._id)
      )
      .unique();

    if (!membership) {
      throw new ConvexError({
        code: "FORBIDDEN",
        message: "Must be a member to view members",
      });
    }

    const members = await ctx.db
      .query("communityMembers")
      .withIndex("by_community", (q) => q.eq("communityId", args.communityId))
      .order("desc")
      .paginate(args.paginationOpts);

    const membersWithDetails = await Promise.all(
      members.page.map(async (member) => {
        const memberUser = await ctx.db.get(member.userId);
        return {
          ...member,
          user: memberUser,
          joinedAt: new Date(member.joinedAt).toISOString(),
        };
      })
    );

    return {
      ...members,
      page: membersWithDetails,
    };
  },
});

export const removeMember = mutation({
  args: {
    communityId: v.id("communities"),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError({
        code: "UNAUTHENTICATED",
        message: "User not logged in",
      });
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier)
      )
      .unique();

    if (!user) {
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "User not found",
      });
    }

    const community = await ctx.db.get(args.communityId);
    if (!community) {
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "Community not found",
      });
    }

    // Check if user is admin
    const adminMembership = await ctx.db
      .query("communityMembers")
      .withIndex("by_community_and_user", (q) =>
        q.eq("communityId", args.communityId).eq("userId", user._id)
      )
      .unique();

    if (adminMembership?.role !== "admin") {
      throw new ConvexError({
        code: "FORBIDDEN",
        message: "Only admins can remove members",
      });
    }

    // Don't allow removing the creator
    if (args.userId === community.creatorId) {
      throw new ConvexError({
        code: "FORBIDDEN",
        message: "Cannot remove community creator",
      });
    }

    // Find and delete membership
    const targetMembership = await ctx.db
      .query("communityMembers")
      .withIndex("by_community_and_user", (q) =>
        q.eq("communityId", args.communityId).eq("userId", args.userId)
      )
      .unique();

    if (!targetMembership) {
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "Member not found",
      });
    }

    await ctx.db.delete(targetMembership._id);

    // Update member count
    await ctx.db.patch(args.communityId, {
      memberCount: Math.max(0, community.memberCount - 1),
    });
  },
});

export const promoteMember = mutation({
  args: {
    communityId: v.id("communities"),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError({
        code: "UNAUTHENTICATED",
        message: "User not logged in",
      });
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier)
      )
      .unique();

    if (!user) {
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "User not found",
      });
    }

    // Check if user is admin
    const adminMembership = await ctx.db
      .query("communityMembers")
      .withIndex("by_community_and_user", (q) =>
        q.eq("communityId", args.communityId).eq("userId", user._id)
      )
      .unique();

    if (adminMembership?.role !== "admin") {
      throw new ConvexError({
        code: "FORBIDDEN",
        message: "Only admins can promote members",
      });
    }

    // Find target membership
    const targetMembership = await ctx.db
      .query("communityMembers")
      .withIndex("by_community_and_user", (q) =>
        q.eq("communityId", args.communityId).eq("userId", args.userId)
      )
      .unique();

    if (!targetMembership) {
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "Member not found",
      });
    }

    await ctx.db.patch(targetMembership._id, {
      role: "admin",
    });
  },
});

export const demoteMember = mutation({
  args: {
    communityId: v.id("communities"),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError({
        code: "UNAUTHENTICATED",
        message: "User not logged in",
      });
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier)
      )
      .unique();

    if (!user) {
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "User not found",
      });
    }

    const community = await ctx.db.get(args.communityId);
    if (!community) {
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "Community not found",
      });
    }

    // Don't allow demoting the creator
    if (args.userId === community.creatorId) {
      throw new ConvexError({
        code: "FORBIDDEN",
        message: "Cannot demote community creator",
      });
    }

    // Check if user is admin
    const adminMembership = await ctx.db
      .query("communityMembers")
      .withIndex("by_community_and_user", (q) =>
        q.eq("communityId", args.communityId).eq("userId", user._id)
      )
      .unique();

    if (adminMembership?.role !== "admin") {
      throw new ConvexError({
        code: "FORBIDDEN",
        message: "Only admins can demote members",
      });
    }

    // Find target membership
    const targetMembership = await ctx.db
      .query("communityMembers")
      .withIndex("by_community_and_user", (q) =>
        q.eq("communityId", args.communityId).eq("userId", args.userId)
      )
      .unique();

    if (!targetMembership) {
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "Member not found",
      });
    }

    await ctx.db.patch(targetMembership._id, {
      role: "member",
    });
  },
});

export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError({
        code: "UNAUTHENTICATED",
        message: "User not logged in",
      });
    }

    return await ctx.storage.generateUploadUrl();
  },
});
