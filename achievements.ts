import { v } from "convex/values";
import { mutation, query, internalMutation } from "./_generated/server";
import type { Id } from "./_generated/dataModel.d.ts";

// Achievement definitions
export const ACHIEVEMENTS = {
  // Social Achievements
  first_post: {
    id: "first_post",
    title: "İlk Adım",
    description: "İlk gönderini paylaştın",
    icon: "📝",
    category: "social",
    requirement: 1,
    reward: { type: "none" as const },
  },
  post_10: {
    id: "post_10",
    title: "Aktif Üye",
    description: "10 gönderi paylaştın",
    icon: "📱",
    category: "social",
    requirement: 10,
    reward: { type: "none" as const },
  },
  post_50: {
    id: "post_50",
    title: "İçerik Üreticisi",
    description: "50 gönderi paylaştın",
    icon: "✨",
    category: "social",
    requirement: 50,
    reward: { type: "tokens" as const, amount: 10 },
  },
  post_100: {
    id: "post_100",
    title: "Sosyal Yıldız",
    description: "100 gönderi paylaştın",
    icon: "⭐",
    category: "social",
    requirement: 100,
    reward: { type: "tokens" as const, amount: 25 },
  },
  post_500: {
    id: "post_500",
    title: "İçerik Kralı",
    description: "500 gönderi paylaştın",
    icon: "👑",
    category: "social",
    requirement: 500,
    reward: { type: "tokens" as const, amount: 50 },
  },
  
  // Follower Achievements
  first_follower: {
    id: "first_follower",
    title: "Takipçi Kazandın",
    description: "İlk takipçini kazandın",
    icon: "👤",
    category: "social",
    requirement: 1,
    reward: { type: "none" as const },
  },
  followers_10: {
    id: "followers_10",
    title: "Küçük Topluluk",
    description: "10 takipçiye ulaştın",
    icon: "👥",
    category: "social",
    requirement: 10,
    reward: { type: "none" as const },
  },
  followers_50: {
    id: "followers_50",
    title: "Popüler",
    description: "50 takipçiye ulaştın",
    icon: "🌟",
    category: "social",
    requirement: 50,
    reward: { type: "tokens" as const, amount: 15 },
  },
  followers_100: {
    id: "followers_100",
    title: "İnfluencer",
    description: "100 takipçiye ulaştın",
    icon: "💫",
    category: "social",
    requirement: 100,
    reward: { type: "tokens" as const, amount: 30 },
  },
  followers_500: {
    id: "followers_500",
    title: "Mikro İnfluencer",
    description: "500 takipçiye ulaştın",
    icon: "🎯",
    category: "social",
    requirement: 500,
    reward: { type: "tokens" as const, amount: 75 },
  },
  followers_1000: {
    id: "followers_1000",
    title: "Süper Star",
    description: "1000 takipçiye ulaştın",
    icon: "🏆",
    category: "social",
    requirement: 1000,
    reward: { type: "tokens" as const, amount: 150 },
  },

  // Engagement Achievements
  first_like: {
    id: "first_like",
    title: "İlk Beğeni",
    description: "İlk beğenini aldın",
    icon: "❤️",
    category: "engagement",
    requirement: 1,
    reward: { type: "none" as const },
  },
  likes_100: {
    id: "likes_100",
    title: "Sevilen İçerik",
    description: "Toplamda 100 beğeni aldın",
    icon: "💕",
    category: "engagement",
    requirement: 100,
    reward: { type: "none" as const },
  },
  likes_500: {
    id: "likes_500",
    title: "Popüler İçerik",
    description: "Toplamda 500 beğeni aldın",
    icon: "💖",
    category: "engagement",
    requirement: 500,
    reward: { type: "tokens" as const, amount: 20 },
  },
  likes_1000: {
    id: "likes_1000",
    title: "Viral İçerik",
    description: "Toplamda 1000 beğeni aldın",
    icon: "💝",
    category: "engagement",
    requirement: 1000,
    reward: { type: "tokens" as const, amount: 50 },
  },

  // Community Achievements
  first_community: {
    id: "first_community",
    title: "Topluluk Kurucusu",
    description: "İlk topluluğunu oluşturdun",
    icon: "🏘️",
    category: "community",
    requirement: 1,
    reward: { type: "tokens" as const, amount: 10 },
  },
  join_3_communities: {
    id: "join_3_communities",
    title: "Sosyal Kelebek",
    description: "3 topluluğa katıldın",
    icon: "🦋",
    category: "community",
    requirement: 3,
    reward: { type: "none" as const },
  },
  join_10_communities: {
    id: "join_10_communities",
    title: "Topluluk Aşığı",
    description: "10 topluluğa katıldın",
    icon: "🎪",
    category: "community",
    requirement: 10,
    reward: { type: "tokens" as const, amount: 15 },
  },

  // Wellness Achievements
  first_journal: {
    id: "first_journal",
    title: "Günlük Tutuyorum",
    description: "İlk günlük kaydını oluşturdun",
    icon: "📔",
    category: "wellness",
    requirement: 1,
    reward: { type: "none" as const },
  },
  journal_streak_7: {
    id: "journal_streak_7",
    title: "Disiplinli",
    description: "7 gün üst üste günlük tuttun",
    icon: "🔥",
    category: "wellness",
    requirement: 7,
    reward: { type: "tokens" as const, amount: 10 },
  },
  journal_streak_30: {
    id: "journal_streak_30",
    title: "Azimli",
    description: "30 gün üst üste günlük tuttun",
    icon: "💪",
    category: "wellness",
    requirement: 30,
    reward: { type: "tokens" as const, amount: 50 },
  },
  first_fortune: {
    id: "first_fortune",
    title: "Fal Meraklısı",
    description: "İlk falına baktın",
    icon: "🔮",
    category: "wellness",
    requirement: 1,
    reward: { type: "none" as const },
  },
  fortune_10: {
    id: "fortune_10",
    title: "Fal Tutkunu",
    description: "10 fal baktırdın",
    icon: "✨",
    category: "wellness",
    requirement: 10,
    reward: { type: "tokens" as const, amount: 20 },
  },
  water_streak_7: {
    id: "water_streak_7",
    title: "Su İçmeyi Seviyorum",
    description: "7 gün üst üste su kaydı tuttun",
    icon: "💧",
    category: "wellness",
    requirement: 7,
    reward: { type: "none" as const },
  },
  water_streak_30: {
    id: "water_streak_30",
    title: "Hidrasyon Şampiyonu",
    description: "30 gün üst üste su kaydı tuttun",
    icon: "💦",
    category: "wellness",
    requirement: 30,
    reward: { type: "tokens" as const, amount: 30 },
  },

  // Special Achievements
  verified: {
    id: "verified",
    title: "Doğrulanmış Hesap",
    description: "Hesap doğrulaması aldın",
    icon: "✓",
    category: "special",
    requirement: 1,
    reward: { type: "tokens" as const, amount: 50 },
  },
  level_50: {
    id: "level_50",
    title: "Seviye Ustası",
    description: "50. seviyeye ulaştın",
    icon: "🎖️",
    category: "special",
    requirement: 50,
    reward: { type: "tokens" as const, amount: 100 },
  },
  first_premium_gift: {
    id: "first_premium_gift",
    title: "Cömert Ruh",
    description: "İlk premium hediyeni gönderdin",
    icon: "🎁",
    category: "special",
    requirement: 1,
    reward: { type: "none" as const },
  },
  level_100: {
    id: "level_100",
    title: "Efsane",
    description: "100. seviyeye ulaştın",
    icon: "🌟",
    category: "special",
    requirement: 100,
    reward: { type: "tokens" as const, amount: 250 },
  },
} as const;

export type AchievementId = keyof typeof ACHIEVEMENTS;

// Get user's achievements with progress
export const getUserAchievements = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
      .unique();
    
    if (!user) return null;

    // Get unlocked achievements
    const unlocked = await ctx.db
      .query("achievements")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();

    const unlockedIds = new Set(unlocked.map(a => a.achievementId));

    // Calculate progress for each achievement
    const achievementsWithProgress = await Promise.all(
      Object.values(ACHIEVEMENTS).map(async (achievement) => {
        const isUnlocked = unlockedIds.has(achievement.id);
        const unlockedData = unlocked.find(a => a.achievementId === achievement.id);
        
        let progress = 0;
        
        if (!isUnlocked) {
          // Calculate current progress
          progress = await calculateProgress(ctx, user._id, achievement.id);
        } else {
          progress = achievement.requirement;
        }

        return {
          ...achievement,
          isUnlocked,
          progress,
          unlockedAt: unlockedData?._creationTime,
        };
      })
    );

    return achievementsWithProgress;
  },
});

// Check and award achievements (internal)
export const checkAndAwardAchievements = internalMutation({
  args: { 
    userId: v.id("users"),
    type: v.union(
      v.literal("post"),
      v.literal("follower"),
      v.literal("like"),
      v.literal("community_create"),
      v.literal("community_join"),
      v.literal("journal"),
      v.literal("fortune"),
      v.literal("water"),
      v.literal("verified"),
      v.literal("level"),
      v.literal("premium_gift")
    ),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) return [];

    const newAchievements: AchievementId[] = [];

    // Check each achievement based on type
    for (const [id, achievement] of Object.entries(ACHIEVEMENTS)) {
      // Skip if already unlocked
      const existing = await ctx.db
        .query("achievements")
        .withIndex("by_user_and_achievement", (q) => 
          q.eq("userId", args.userId).eq("achievementId", id)
        )
        .unique();
      
      if (existing) continue;

      // Check if requirements are met
      const progress = await calculateProgress(ctx, args.userId, id as AchievementId);
      
      if (progress >= achievement.requirement) {
        // Award achievement
        await ctx.db.insert("achievements", {
          userId: args.userId,
          achievementId: id as AchievementId,
        });

        // Award rewards
        if (achievement.reward.type === "tokens") {
          const currentUser = await ctx.db.get(args.userId);
          if (currentUser) {
            await ctx.db.patch(args.userId, {
              giftTokens: (currentUser.giftTokens || 0) + achievement.reward.amount,
            });
          }
        }

        newAchievements.push(id as AchievementId);

        // Create notification
        await ctx.db.insert("notifications", {
          userId: args.userId,
          actorId: args.userId,
          type: "token_grant",
          message: `🏆 Başarı kazandın: ${achievement.title}`,
          isRead: false,
        });
      }
    }

    return newAchievements;
  },
});

// Helper function to calculate progress
async function calculateProgress(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ctx: any,
  userId: Id<"users">,
  achievementId: AchievementId
): Promise<number> {
  const user = await ctx.db.get(userId);
  if (!user) return 0;

  switch (achievementId) {
    // Post achievements
    case "first_post":
    case "post_10":
    case "post_50":
    case "post_100":
    case "post_500": {
      const posts = await ctx.db
        .query("posts")
        .withIndex("by_author", (q: { eq: (field: string, value: unknown) => unknown }) => q.eq("authorId", userId))
        .collect();
      return posts.length;
    }

    // Follower achievements
    case "first_follower":
    case "followers_10":
    case "followers_50":
    case "followers_100":
    case "followers_500":
    case "followers_1000": {
      const followers = await ctx.db
        .query("follows")
        .withIndex("by_following", (q: { eq: (field: string, value: unknown) => unknown }) => q.eq("followingId", userId))
        .collect();
      return followers.length;
    }

    // Like achievements
    case "first_like":
    case "likes_100":
    case "likes_500":
    case "likes_1000": {
      const posts = await ctx.db
        .query("posts")
        .withIndex("by_author", (q: { eq: (field: string, value: unknown) => unknown }) => q.eq("authorId", userId))
        .collect();
      return (posts as { likeCount: number }[]).reduce((sum: number, post: { likeCount: number }) => sum + post.likeCount, 0);
    }

    // Community achievements
    case "first_community": {
      const communities = await ctx.db
        .query("communities")
        .withIndex("by_creator", (q: { eq: (field: string, value: unknown) => unknown }) => q.eq("creatorId", userId))
        .collect();
      return communities.length;
    }
    case "join_3_communities":
    case "join_10_communities": {
      const memberships = await ctx.db
        .query("communityMembers")
        .withIndex("by_user", (q: { eq: (field: string, value: unknown) => unknown }) => q.eq("userId", userId))
        .collect();
      return memberships.length;
    }

    // Journal achievements
    case "first_journal":
    case "journal_streak_7":
    case "journal_streak_30": {
      const journals = await ctx.db
        .query("journalEntries")
        .withIndex("by_user", (q: { eq: (field: string, value: unknown) => unknown }) => q.eq("userId", userId))
        .order("desc")
        .collect();
      
      if (achievementId === "first_journal") {
        return journals.length;
      }
      
      // Calculate streak
      let streak = 0;
      const now = Date.now();
      const oneDayMs = 24 * 60 * 60 * 1000;
      
      for (let i = 0; i < journals.length; i++) {
        const expectedDate = now - (i * oneDayMs);
        const journalDate = (journals[i] as { _creationTime: number })._creationTime;
        const dayDiff = Math.floor((expectedDate - journalDate) / oneDayMs);
        
        if (dayDiff === 0) {
          streak++;
        } else {
          break;
        }
      }
      
      return streak;
    }

    // Fortune achievements
    case "first_fortune":
    case "fortune_10": {
      const fortunes = await ctx.db
        .query("fortunes")
        .withIndex("by_user", (q: { eq: (field: string, value: unknown) => unknown }) => q.eq("userId", userId))
        .collect();
      return fortunes.length;
    }

    // Water achievements
    case "water_streak_7":
    case "water_streak_30": {
      const waterLogs = await ctx.db
        .query("waterIntake")
        .withIndex("by_user", (q: { eq: (field: string, value: unknown) => unknown }) => q.eq("userId", userId))
        .order("desc")
        .collect();
      
      // Calculate streak
      let streak = 0;
      const now = Date.now();
      const oneDayMs = 24 * 60 * 60 * 1000;
      
      for (let i = 0; i < waterLogs.length; i++) {
        const expectedDate = now - (i * oneDayMs);
        const logDate = (waterLogs[i] as { _creationTime: number })._creationTime;
        const dayDiff = Math.floor((expectedDate - logDate) / oneDayMs);
        
        if (dayDiff === 0) {
          streak++;
        } else {
          break;
        }
      }
      
      return streak;
    }

    // Special achievements
    case "verified":
      return (user as { isVerified?: boolean }).isVerified ? 1 : 0;
    
    case "level_50":
    case "level_100":
      return (user as { giftLevel?: number }).giftLevel || 0;
    
    case "first_premium_gift": {
      const gifts = await ctx.db
        .query("giftTransactions")
        .withIndex("by_sender", (q: { eq: (field: string, value: unknown) => unknown }) => q.eq("senderId", userId))
        .collect();
      
      let premiumCount = 0;
      for (const gift of gifts as { giftId: Id<"gifts"> }[]) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const giftData = await (ctx.db.get as any)(gift.giftId) as { isPremium?: boolean } | null;
        if (giftData?.isPremium) {
          premiumCount++;
        }
      }
      
      return premiumCount;
    }

    default:
      return 0;
  }
}
