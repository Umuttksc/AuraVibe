import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { ConvexError } from "convex/values";

// Doğrulama başvurusu oluştur
export const createRequest = mutation({
  args: {
    reason: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError({
        message: "Giriş yapmalısınız",
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
        message: "Kullanıcı bulunamadı",
        code: "NOT_FOUND",
      });
    }

    // Zaten doğrulanmış mı kontrol et
    if (user.isVerified) {
      throw new ConvexError({
        message: "Hesabınız zaten doğrulanmış",
        code: "BAD_REQUEST",
      });
    }

    // Bekleyen başvuru var mı kontrol et
    const existingRequest = await ctx.db
      .query("verificationRequests")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .filter((q) => q.eq(q.field("status"), "pending"))
      .first();

    if (existingRequest) {
      throw new ConvexError({
        message: "Zaten beklemede olan bir başvurunuz var",
        code: "BAD_REQUEST",
      });
    }

    // Yeni başvuru oluştur
    const requestId = await ctx.db.insert("verificationRequests", {
      userId: user._id,
      reason: args.reason,
      status: "pending",
      paymentStatus: "pending",
    });

    return requestId;
  },
});

// Kullanıcının başvuru durumunu getir
export const getMyRequest = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return null;
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier)
      )
      .unique();

    if (!user) {
      return null;
    }

    const request = await ctx.db
      .query("verificationRequests")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .order("desc")
      .first();

    return request;
  },
});

// Ödeme durumunu güncelle (kullanıcı)
export const confirmPayment = mutation({
  args: {
    requestId: v.id("verificationRequests"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError({
        message: "Giriş yapmalısınız",
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
        message: "Kullanıcı bulunamadı",
        code: "NOT_FOUND",
      });
    }

    const request = await ctx.db.get(args.requestId);
    if (!request) {
      throw new ConvexError({
        message: "Başvuru bulunamadı",
        code: "NOT_FOUND",
      });
    }

    if (request.userId !== user._id) {
      throw new ConvexError({
        message: "Bu başvuruya erişim yetkiniz yok",
        code: "FORBIDDEN",
      });
    }

    await ctx.db.patch(args.requestId, {
      paymentStatus: "completed",
    });
  },
});

// Tüm başvuruları listele (admin)
export const listRequests = query({
  args: {
    status: v.optional(v.union(v.literal("pending"), v.literal("approved"), v.literal("rejected"))),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError({
        message: "Giriş yapmalısınız",
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
        message: "Yetkiniz yok",
        code: "FORBIDDEN",
      });
    }

    let requests;

    if (args.status) {
      const statusValue = args.status;
      requests = await ctx.db
        .query("verificationRequests")
        .withIndex("by_status", (q) => q.eq("status", statusValue))
        .order("desc")
        .collect();
    } else {
      requests = await ctx.db
        .query("verificationRequests")
        .order("desc")
        .collect();
    }

    // Kullanıcı bilgilerini ekle
    const requestsWithUsers = await Promise.all(
      requests.map(async (request) => {
        const requestUser = await ctx.db.get(request.userId);
        return {
          ...request,
          user: requestUser,
        };
      })
    );

    return requestsWithUsers;
  },
});

// Başvuruyu onayla (admin)
export const approveRequest = mutation({
  args: {
    requestId: v.id("verificationRequests"),
    adminNotes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError({
        message: "Giriş yapmalısınız",
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
        message: "Yetkiniz yok",
        code: "FORBIDDEN",
      });
    }

    const request = await ctx.db.get(args.requestId);
    if (!request) {
      throw new ConvexError({
        message: "Başvuru bulunamadı",
        code: "NOT_FOUND",
      });
    }

    // Başvuruyu onayla
    await ctx.db.patch(args.requestId, {
      status: "approved",
      adminNotes: args.adminNotes,
    });

    // Kullanıcıyı doğrula
    await ctx.db.patch(request.userId, {
      isVerified: true,
    });
  },
});

// Başvuruyu reddet (admin)
export const rejectRequest = mutation({
  args: {
    requestId: v.id("verificationRequests"),
    rejectionReason: v.string(),
    adminNotes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError({
        message: "Giriş yapmalısınız",
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
        message: "Yetkiniz yok",
        code: "FORBIDDEN",
      });
    }

    const request = await ctx.db.get(args.requestId);
    if (!request) {
      throw new ConvexError({
        message: "Başvuru bulunamadı",
        code: "NOT_FOUND",
      });
    }

    // Başvuruyu reddet
    await ctx.db.patch(args.requestId, {
      status: "rejected",
      rejectionReason: args.rejectionReason,
      adminNotes: args.adminNotes,
    });
  },
});
