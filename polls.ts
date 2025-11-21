import { ConvexError, v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const createPoll = mutation({
  args: {
    question: v.string(),
    options: v.array(v.string()),
    postId: v.optional(v.id("posts")),
    communityId: v.optional(v.id("communities")),
    expiresInHours: v.optional(v.number()),
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

    // Validate options
    if (args.options.length < 2) {
      throw new ConvexError({
        code: "BAD_REQUEST",
        message: "Poll must have at least 2 options",
      });
    }

    if (args.options.length > 10) {
      throw new ConvexError({
        code: "BAD_REQUEST",
        message: "Poll cannot have more than 10 options",
      });
    }

    // Calculate expiration
    let expiresAt = undefined;
    if (args.expiresInHours && args.expiresInHours > 0) {
      expiresAt = Date.now() + args.expiresInHours * 60 * 60 * 1000;
    }

    // Create poll
    const pollId = await ctx.db.insert("polls", {
      question: args.question,
      creatorId: user._id,
      postId: args.postId,
      communityId: args.communityId,
      expiresAt,
      totalVotes: 0,
    });

    // Create poll options
    await Promise.all(
      args.options.map(async (option, index) => {
        await ctx.db.insert("pollOptions", {
          pollId,
          text: option,
          voteCount: 0,
          order: index,
        });
      })
    );

    return pollId;
  },
});

export const getPollById = query({
  args: { pollId: v.id("polls") },
  handler: async (ctx, args) => {
    const poll = await ctx.db.get(args.pollId);
    if (!poll) {
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "Poll not found",
      });
    }

    const creator = await ctx.db.get(poll.creatorId);
    
    // Get options
    const options = await ctx.db
      .query("pollOptions")
      .withIndex("by_poll", (q) => q.eq("pollId", args.pollId))
      .collect();

    // Sort by order
    const sortedOptions = options.sort((a, b) => a.order - b.order);

    // Check if current user has voted
    const identity = await ctx.auth.getUserIdentity();
    let userVote = null;
    
    if (identity) {
      const user = await ctx.db
        .query("users")
        .withIndex("by_token", (q) =>
          q.eq("tokenIdentifier", identity.tokenIdentifier)
        )
        .unique();

      if (user) {
        const vote = await ctx.db
          .query("pollVotes")
          .withIndex("by_poll_and_user", (q) =>
            q.eq("pollId", args.pollId).eq("userId", user._id)
          )
          .unique();

        if (vote) {
          userVote = vote.optionId;
        }
      }
    }

    // Check if poll has expired
    const isExpired = poll.expiresAt ? Date.now() > poll.expiresAt : false;

    return {
      ...poll,
      creator,
      options: sortedOptions,
      userVote,
      isExpired,
      createdAt: new Date(poll._creationTime).toISOString(),
    };
  },
});

export const getPollsByPost = query({
  args: { postId: v.id("posts") },
  handler: async (ctx, args) => {
    const polls = await ctx.db
      .query("polls")
      .withIndex("by_post", (q) => q.eq("postId", args.postId))
      .collect();

    const pollsWithDetails = await Promise.all(
      polls.map(async (poll) => {
        const creator = await ctx.db.get(poll.creatorId);
        
        // Get options
        const options = await ctx.db
          .query("pollOptions")
          .withIndex("by_poll", (q) => q.eq("pollId", poll._id))
          .collect();

        // Sort by order
        const sortedOptions = options.sort((a, b) => a.order - b.order);

        // Check if current user has voted
        const identity = await ctx.auth.getUserIdentity();
        let userVote = null;
        
        if (identity) {
          const user = await ctx.db
            .query("users")
            .withIndex("by_token", (q) =>
              q.eq("tokenIdentifier", identity.tokenIdentifier)
            )
            .unique();

          if (user) {
            const vote = await ctx.db
              .query("pollVotes")
              .withIndex("by_poll_and_user", (q) =>
                q.eq("pollId", poll._id).eq("userId", user._id)
              )
              .unique();

            if (vote) {
              userVote = vote.optionId;
            }
          }
        }

        // Check if poll has expired
        const isExpired = poll.expiresAt ? Date.now() > poll.expiresAt : false;

        return {
          ...poll,
          creator,
          options: sortedOptions,
          userVote,
          isExpired,
          createdAt: new Date(poll._creationTime).toISOString(),
        };
      })
    );

    return pollsWithDetails;
  },
});

export const vote = mutation({
  args: {
    pollId: v.id("polls"),
    optionId: v.id("pollOptions"),
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

    const poll = await ctx.db.get(args.pollId);
    if (!poll) {
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "Poll not found",
      });
    }

    // Check if poll has expired
    if (poll.expiresAt && Date.now() > poll.expiresAt) {
      throw new ConvexError({
        code: "BAD_REQUEST",
        message: "Poll has expired",
      });
    }

    const option = await ctx.db.get(args.optionId);
    if (!option || option.pollId !== args.pollId) {
      throw new ConvexError({
        code: "BAD_REQUEST",
        message: "Invalid option",
      });
    }

    // Check if user has already voted
    const existingVote = await ctx.db
      .query("pollVotes")
      .withIndex("by_poll_and_user", (q) =>
        q.eq("pollId", args.pollId).eq("userId", user._id)
      )
      .unique();

    if (existingVote) {
      // Change vote
      const oldOption = await ctx.db.get(existingVote.optionId);
      if (oldOption) {
        await ctx.db.patch(oldOption._id, {
          voteCount: Math.max(0, oldOption.voteCount - 1),
        });
      }

      await ctx.db.patch(existingVote._id, {
        optionId: args.optionId,
      });

      await ctx.db.patch(args.optionId, {
        voteCount: option.voteCount + 1,
      });
    } else {
      // New vote
      await ctx.db.insert("pollVotes", {
        pollId: args.pollId,
        optionId: args.optionId,
        userId: user._id,
      });

      await ctx.db.patch(args.optionId, {
        voteCount: option.voteCount + 1,
      });

      await ctx.db.patch(args.pollId, {
        totalVotes: poll.totalVotes + 1,
      });
    }
  },
});

export const deletePoll = mutation({
  args: { pollId: v.id("polls") },
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

    const poll = await ctx.db.get(args.pollId);
    if (!poll) {
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "Poll not found",
      });
    }

    // Only creator can delete
    if (poll.creatorId !== user._id) {
      throw new ConvexError({
        code: "FORBIDDEN",
        message: "Only poll creator can delete",
      });
    }

    // Delete all votes
    const votes = await ctx.db
      .query("pollVotes")
      .withIndex("by_poll", (q) => q.eq("pollId", args.pollId))
      .collect();

    for (const vote of votes) {
      await ctx.db.delete(vote._id);
    }

    // Delete all options
    const options = await ctx.db
      .query("pollOptions")
      .withIndex("by_poll", (q) => q.eq("pollId", args.pollId))
      .collect();

    for (const option of options) {
      await ctx.db.delete(option._id);
    }

    // Delete poll
    await ctx.db.delete(args.pollId);
  },
});
