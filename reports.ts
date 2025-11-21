import { ConvexError, v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { paginationOptsValidator } from "convex/server";

export const createReport = mutation({
  args: {
    reportedUserId: v.optional(v.id("users")),
    postId: v.optional(v.id("posts")),
    commentId: v.optional(v.id("comments")),
    reason: v.union(
      v.literal("spam"),
      v.literal("harassment"),
      v.literal("hate_speech"),
      v.literal("violence"),
      v.literal("inappropriate"),
      v.literal("other")
    ),
    description: v.optional(v.string()),
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

    // Validate that at least one target is provided
    if (!args.reportedUserId && !args.postId && !args.commentId) {
      throw new ConvexError({
        code: "BAD_REQUEST",
        message: "Must report a user, post, or comment",
      });
    }

    // Create report
    const reportId = await ctx.db.insert("reports", {
      reporterId: user._id,
      reportedUserId: args.reportedUserId,
      postId: args.postId,
      commentId: args.commentId,
      reason: args.reason,
      description: args.description,
      status: "pending",
    });

    return reportId;
  },
});

export const getReports = query({
  args: { paginationOpts: paginationOptsValidator },
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

    // Only admins can view reports
    if (!user.isSuperAdmin && user.role !== "admin") {
      throw new ConvexError({
        code: "FORBIDDEN",
        message: "Only admins can view reports",
      });
    }

    const reports = await ctx.db
      .query("reports")
      .order("desc")
      .paginate(args.paginationOpts);

    const reportsWithDetails = await Promise.all(
      reports.page.map(async (report) => {
        const reporter = await ctx.db.get(report.reporterId);
        
        let reportedUser = null;
        if (report.reportedUserId) {
          reportedUser = await ctx.db.get(report.reportedUserId);
        }

        let post = null;
        if (report.postId) {
          post = await ctx.db.get(report.postId);
        }

        let comment = null;
        if (report.commentId) {
          comment = await ctx.db.get(report.commentId);
        }

        return {
          ...report,
          reporter,
          reportedUser,
          post,
          comment,
          createdAt: new Date(report._creationTime).toISOString(),
        };
      })
    );

    return {
      ...reports,
      page: reportsWithDetails,
    };
  },
});

export const updateReportStatus = mutation({
  args: {
    reportId: v.id("reports"),
    status: v.union(
      v.literal("pending"),
      v.literal("reviewed"),
      v.literal("resolved"),
      v.literal("dismissed")
    ),
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

    // Only admins can update reports
    if (!user.isSuperAdmin && user.role !== "admin") {
      throw new ConvexError({
        code: "FORBIDDEN",
        message: "Only admins can update reports",
      });
    }

    const report = await ctx.db.get(args.reportId);
    if (!report) {
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "Report not found",
      });
    }

    await ctx.db.patch(args.reportId, {
      status: args.status,
    });
  },
});
