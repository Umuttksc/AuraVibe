import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { ConvexError } from "convex/values";

export const getBooks = query({
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

    if (!user) {
      throw new ConvexError({
        message: "User not found",
        code: "NOT_FOUND",
      });
    }

    const books = await ctx.db
      .query("books")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .order("desc")
      .collect();

    return books;
  },
});

export const getBooksByStatus = query({
  args: {
    status: v.union(
      v.literal("reading"),
      v.literal("completed"),
      v.literal("want_to_read")
    ),
    userId: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    let userId = args.userId;

    if (!userId) {
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

      if (!user) {
        throw new ConvexError({
          message: "User not found",
          code: "NOT_FOUND",
        });
      }

      userId = user._id;
    }

    const books = await ctx.db
      .query("books")
      .withIndex("by_user_and_status", (q) =>
        q.eq("userId", userId).eq("status", args.status)
      )
      .order("desc")
      .collect();

    return books;
  },
});

export const getCompletedBooksCount = query({
  args: { userId: v.optional(v.id("users")) },
  handler: async (ctx, args) => {
    let userId = args.userId;

    if (!userId) {
      const identity = await ctx.auth.getUserIdentity();
      if (!identity) {
        return 0;
      }

      const user = await ctx.db
        .query("users")
        .withIndex("by_token", (q) =>
          q.eq("tokenIdentifier", identity.tokenIdentifier)
        )
        .unique();

      if (!user) {
        return 0;
      }

      userId = user._id;
    }

    const books = await ctx.db
      .query("books")
      .withIndex("by_user_and_status", (q) =>
        q.eq("userId", userId).eq("status", "completed")
      )
      .collect();

    return books.length;
  },
});

export const addBook = mutation({
  args: {
    title: v.string(),
    author: v.string(),
    coverImage: v.optional(v.string()),
    pageCount: v.optional(v.number()),
    currentPage: v.optional(v.number()),
    status: v.union(
      v.literal("reading"),
      v.literal("completed"),
      v.literal("want_to_read")
    ),
    rating: v.optional(v.number()),
    startDate: v.optional(v.string()),
    finishDate: v.optional(v.string()),
    notes: v.optional(v.string()),
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

    if (!user) {
      throw new ConvexError({
        message: "User not found",
        code: "NOT_FOUND",
      });
    }

    const id = await ctx.db.insert("books", {
      userId: user._id,
      title: args.title,
      author: args.author,
      coverImage: args.coverImage,
      pageCount: args.pageCount,
      currentPage: args.currentPage,
      status: args.status,
      rating: args.rating,
      startDate: args.startDate,
      finishDate: args.finishDate,
      notes: args.notes,
    });

    return id;
  },
});

export const updateBook = mutation({
  args: {
    bookId: v.id("books"),
    title: v.optional(v.string()),
    author: v.optional(v.string()),
    coverImage: v.optional(v.string()),
    pageCount: v.optional(v.number()),
    currentPage: v.optional(v.number()),
    status: v.optional(
      v.union(
        v.literal("reading"),
        v.literal("completed"),
        v.literal("want_to_read")
      )
    ),
    rating: v.optional(v.number()),
    startDate: v.optional(v.string()),
    finishDate: v.optional(v.string()),
    notes: v.optional(v.string()),
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

    if (!user) {
      throw new ConvexError({
        message: "User not found",
        code: "NOT_FOUND",
      });
    }

    const book = await ctx.db.get(args.bookId);
    if (!book) {
      throw new ConvexError({
        message: "Book not found",
        code: "NOT_FOUND",
      });
    }

    if (book.userId !== user._id) {
      throw new ConvexError({
        message: "Unauthorized",
        code: "FORBIDDEN",
      });
    }

    const { bookId, ...updates } = args;
    await ctx.db.patch(bookId, updates);
  },
});

export const deleteBook = mutation({
  args: { bookId: v.id("books") },
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

    if (!user) {
      throw new ConvexError({
        message: "User not found",
        code: "NOT_FOUND",
      });
    }

    const book = await ctx.db.get(args.bookId);
    if (!book) {
      throw new ConvexError({
        message: "Book not found",
        code: "NOT_FOUND",
      });
    }

    if (book.userId !== user._id) {
      throw new ConvexError({
        message: "Unauthorized",
        code: "FORBIDDEN",
      });
    }

    await ctx.db.delete(args.bookId);
  },
});
