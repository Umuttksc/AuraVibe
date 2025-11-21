import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    tokenIdentifier: v.string(),
    name: v.optional(v.string()),
    email: v.optional(v.string()),
    username: v.optional(v.string()),
    bio: v.optional(v.string()),
    profilePicture: v.optional(v.id("_storage")),
    coverPhoto: v.optional(v.id("_storage")),
    gender: v.optional(v.union(v.literal("female"), v.literal("male"), v.literal("other"))),
    location: v.optional(v.string()),
    city: v.optional(v.string()),
    country: v.optional(v.string()),
    birthDate: v.optional(v.string()),
    website: v.optional(v.string()),
    maritalStatus: v.optional(v.union(
      v.literal("single"),
      v.literal("in_relationship"),
      v.literal("married"),
      v.literal("divorced"),
      v.literal("widowed")
    )),
    showMaritalStatus: v.optional(v.boolean()), // Show marital status on profile (default true)
    isPrivate: v.optional(v.boolean()),
    allowBookQuestions: v.optional(v.boolean()), // Allow others to ask about books
    role: v.optional(v.union(v.literal("admin"), v.literal("user"))),
    isSuperAdmin: v.optional(v.boolean()),
    isBlocked: v.optional(v.boolean()),
    isVerified: v.optional(v.boolean()),
    // Premium subscription
    isPremium: v.optional(v.boolean()),
    premiumExpiresAt: v.optional(v.string()), // ISO date string
    // Fortune usage tracking (for non-premium users)
    dailyCoffeeUsed: v.optional(v.number()),
    dailyTarotUsed: v.optional(v.number()),
    dailyPalmUsed: v.optional(v.number()),
    dailyBirthchartUsed: v.optional(v.number()),
    dailyAuraUsed: v.optional(v.number()),
    lastFortuneResetDate: v.optional(v.string()),
    lastFortuneTime: v.optional(v.number()), // Timestamp of last fortune request (for rate limiting)
    stripeCustomerId: v.optional(v.string()),
    // Gift level system
    giftLevel: v.optional(v.number()), // 0-100
    totalGiftSpent: v.optional(v.number()), // Total spent on gifts in kuruş
    showGiftLevel: v.optional(v.boolean()), // Show gift level on profile (default true)
    // Gift tokens system
    giftTokens: v.optional(v.number()), // Paid tokens purchased by user
    bonusTokens: v.optional(v.number()), // Free tokens granted by admin (no revenue for recipients)
    showGiftTokens: v.optional(v.boolean()), // Show token balance on profile (default false, only visible to self and super admin)
    // Admin permissions (only for regular admins, super admin has all permissions)
    adminPermissions: v.optional(v.object({
      canManageUsers: v.boolean(), // Can block/verify/delete users
      canGrantTokens: v.boolean(), // Can grant tokens to users
      canManageReports: v.boolean(), // Can manage reports
      canManageContent: v.boolean(), // Can manage posts/comments
    })),
  })
    .index("by_token", ["tokenIdentifier"])
    .index("by_username", ["username"]),

  posts: defineTable({
    authorId: v.id("users"),
    content: v.string(),
    imageId: v.optional(v.id("_storage")), // Legacy single media support
    mediaType: v.optional(v.union(v.literal("image"), v.literal("video"))), // Legacy single media type
    // New multi-media support
    media: v.optional(v.array(v.object({
      storageId: v.id("_storage"),
      type: v.union(v.literal("image"), v.literal("video")),
      taggedUsers: v.optional(v.array(v.object({
        userId: v.id("users"),
        x: v.number(), // Position X percentage (0-100)
        y: v.number(), // Position Y percentage (0-100)
      }))),
    }))),
    musicId: v.optional(v.id("music")),
    musicStartTime: v.optional(v.number()),
    likeCount: v.number(),
    commentCount: v.number(),
    isEdited: v.optional(v.boolean()),
    lastEditedAt: v.optional(v.number()),
    isPinned: v.optional(v.boolean()),
    pinnedAt: v.optional(v.number()),
  })
    .index("by_author", ["authorId"])
    .index("by_author_and_pinned", ["authorId", "isPinned"]),

  postEditHistory: defineTable({
    postId: v.id("posts"),
    previousContent: v.string(),
    editedAt: v.number(),
  }).index("by_post", ["postId"]),

  likes: defineTable({
    postId: v.id("posts"),
    userId: v.id("users"),
  })
    .index("by_post", ["postId"])
    .index("by_user", ["userId"])
    .index("by_post_and_user", ["postId", "userId"]),

  comments: defineTable({
    postId: v.id("posts"),
    authorId: v.id("users"),
    content: v.string(),
    likeCount: v.optional(v.number()),
  })
    .index("by_post", ["postId"])
    .index("by_author", ["authorId"]),

  commentLikes: defineTable({
    commentId: v.id("comments"),
    userId: v.id("users"),
  })
    .index("by_comment", ["commentId"])
    .index("by_user", ["userId"])
    .index("by_comment_and_user", ["commentId", "userId"]),

  bannedWords: defineTable({
    word: v.string(),
    isActive: v.boolean(),
  }),

  savedPosts: defineTable({
    userId: v.id("users"),
    postId: v.id("posts"),
  })
    .index("by_user", ["userId"])
    .index("by_post", ["postId"])
    .index("by_user_and_post", ["userId", "postId"]),

  stories: defineTable({
    authorId: v.id("users"),
    imageId: v.optional(v.id("_storage")), // Legacy single media support
    mediaType: v.optional(v.union(v.literal("image"), v.literal("video"))),
    // New multi-media support  
    media: v.optional(v.array(v.object({
      storageId: v.id("_storage"),
      type: v.union(v.literal("image"), v.literal("video")),
      taggedUsers: v.optional(v.array(v.object({
        userId: v.id("users"),
        x: v.number(), // Position X percentage (0-100)
        y: v.number(), // Position Y percentage (0-100)
      }))),
    }))),
    musicId: v.optional(v.id("music")),
    musicStartTime: v.optional(v.number()),
    videoDuration: v.optional(v.number()),
    viewCount: v.number(),
    replyCount: v.optional(v.number()),
    reactionCount: v.optional(v.number()),
    expiresAt: v.number(),
  }).index("by_author", ["authorId"]),

  storyViews: defineTable({
    storyId: v.id("stories"),
    viewerId: v.id("users"),
  })
    .index("by_story", ["storyId"])
    .index("by_viewer", ["viewerId"])
    .index("by_story_and_viewer", ["storyId", "viewerId"]),

  storyReplies: defineTable({
    storyId: v.id("stories"),
    senderId: v.id("users"),
    content: v.string(),
  })
    .index("by_story", ["storyId"])
    .index("by_sender", ["senderId"]),

  storyReactions: defineTable({
    storyId: v.id("stories"),
    userId: v.id("users"),
    emoji: v.string(),
  })
    .index("by_story", ["storyId"])
    .index("by_user", ["userId"])
    .index("by_story_and_user", ["storyId", "userId"]),

  conversations: defineTable({
    participant1Id: v.id("users"),
    participant2Id: v.id("users"),
    lastMessageContent: v.optional(v.string()),
    lastMessageAt: v.optional(v.number()),
    lastMessageSenderId: v.optional(v.id("users")),
  })
    .index("by_participant1", ["participant1Id"])
    .index("by_participant2", ["participant2Id"]),

  messages: defineTable({
    conversationId: v.id("conversations"),
    senderId: v.id("users"),
    content: v.string(),
    isRead: v.boolean(),
    imageId: v.optional(v.id("_storage")),
    mediaType: v.optional(v.union(v.literal("image"), v.literal("video"), v.literal("audio"))),
    audioId: v.optional(v.id("_storage")), // Voice message
    audioDuration: v.optional(v.number()), // Duration in seconds
    isAnonymous: v.optional(v.boolean()),
    giftId: v.optional(v.id("gifts")),
  })
    .index("by_conversation", ["conversationId"])
    .index("by_sender", ["senderId"]),

  videoCalls: defineTable({
    callerId: v.id("users"),
    receiverId: v.id("users"),
    conversationId: v.id("conversations"),
    status: v.union(
      v.literal("calling"), // Caller initiated call
      v.literal("ringing"), // Receiver notified
      v.literal("accepted"), // Call in progress
      v.literal("rejected"), // Receiver rejected
      v.literal("missed"), // No answer
      v.literal("ended") // Call completed
    ),
    startedAt: v.optional(v.number()),
    endedAt: v.optional(v.number()),
    duration: v.optional(v.number()), // Duration in seconds
    // WebRTC signaling data
    offer: v.optional(v.string()), // SDP offer from caller (JSON stringified)
    answer: v.optional(v.string()), // SDP answer from receiver (JSON stringified)
    callerIceCandidates: v.optional(v.array(v.string())), // ICE candidates from caller (JSON stringified)
    receiverIceCandidates: v.optional(v.array(v.string())), // ICE candidates from receiver (JSON stringified)
  })
    .index("by_caller", ["callerId"])
    .index("by_receiver", ["receiverId"])
    .index("by_conversation", ["conversationId"]),

  follows: defineTable({
    followerId: v.id("users"),
    followingId: v.id("users"),
  })
    .index("by_follower", ["followerId"])
    .index("by_following", ["followingId"])
    .index("by_follower_and_following", ["followerId", "followingId"]),

  unfollows: defineTable({
    followerId: v.id("users"), // Person who was following
    unfollowedId: v.id("users"), // Person who unfollowed
    unfollowedAt: v.number(), // Timestamp of unfollow
  })
    .index("by_unfollowed", ["unfollowedId"])
    .index("by_follower", ["followerId"])
    .index("by_unfollowed_and_follower", ["unfollowedId", "followerId"]),

  followRequests: defineTable({
    requesterId: v.id("users"),
    targetId: v.id("users"),
    status: v.union(
      v.literal("pending"),
      v.literal("accepted"),
      v.literal("rejected")
    ),
  })
    .index("by_requester", ["requesterId"])
    .index("by_target", ["targetId"])
    .index("by_requester_and_target", ["requesterId", "targetId"])
    .index("by_target_and_status", ["targetId", "status"]),

  notifications: defineTable({
    userId: v.id("users"),
    type: v.union(
      v.literal("like"),
      v.literal("comment"),
      v.literal("follow"),
      v.literal("follow_request"),
      v.literal("mention"),
      v.literal("token_grant"),
      v.literal("game_invite")
    ),
    actorId: v.id("users"),
    postId: v.optional(v.id("posts")),
    commentId: v.optional(v.id("comments")),
    followRequestId: v.optional(v.id("followRequests")),
    message: v.optional(v.string()), // Custom message for token grants
    isRead: v.boolean(),
  }).index("by_user", ["userId"]),

  menstrualCycles: defineTable({
    userId: v.id("users"),
    startDate: v.string(),
    endDate: v.optional(v.string()),
    periodLength: v.optional(v.number()),
    cycleLength: v.optional(v.number()),
    symptoms: v.optional(v.array(v.string())),
    flow: v.optional(v.union(v.literal("light"), v.literal("medium"), v.literal("heavy"))),
    notes: v.optional(v.string()),
  })
    .index("by_user", ["userId"])
    .index("by_user_and_date", ["userId", "startDate"]),

  journalEntries: defineTable({
    userId: v.id("users"),
    date: v.string(),
    content: v.string(),
    mood: v.optional(v.union(
      v.literal("happy"),
      v.literal("sad"),
      v.literal("anxious"),
      v.literal("calm"),
      v.literal("energetic"),
      v.literal("tired")
    )),
    activities: v.optional(v.array(v.string())),
    isPrivate: v.boolean(),
  })
    .index("by_user", ["userId"])
    .index("by_user_and_date", ["userId", "date"]),

  chatMessages: defineTable({
    userId: v.id("users"),
    role: v.union(v.literal("user"), v.literal("assistant")),
    content: v.string(),
  }).index("by_user", ["userId"]),

  notes: defineTable({
    userId: v.id("users"),
    title: v.string(),
    content: v.string(),
    color: v.string(),
    isPinned: v.boolean(),
  }).index("by_user", ["userId"]),

  ads: defineTable({
    title: v.string(),
    description: v.optional(v.string()),
    imageId: v.optional(v.id("_storage")),
    linkUrl: v.optional(v.string()),
    placement: v.union(
      v.literal("home_feed"),
      v.literal("profile_top"),
      v.literal("explore_top"),
      v.literal("story"),
    ),
    isActive: v.boolean(),
    impressions: v.number(),
    clicks: v.number(),
  }).index("by_active", ["isActive"]),

  hashtags: defineTable({
    tag: v.string(),
    postCount: v.number(),
    lastUsedAt: v.number(),
  }).index("by_tag", ["tag"]),

  postHashtags: defineTable({
    postId: v.id("posts"),
    hashtagId: v.id("hashtags"),
  })
    .index("by_post", ["postId"])
    .index("by_hashtag", ["hashtagId"])
    .index("by_post_and_hashtag", ["postId", "hashtagId"]),

  communities: defineTable({
    name: v.string(),
    description: v.string(),
    imageId: v.optional(v.id("_storage")),
    creatorId: v.id("users"),
    isPrivate: v.boolean(),
    memberCount: v.number(),
  }).index("by_creator", ["creatorId"]),

  communityMembers: defineTable({
    communityId: v.id("communities"),
    userId: v.id("users"),
    role: v.union(v.literal("admin"), v.literal("member")),
    joinedAt: v.number(),
  })
    .index("by_community", ["communityId"])
    .index("by_user", ["userId"])
    .index("by_community_and_user", ["communityId", "userId"]),

  groupMessages: defineTable({
    communityId: v.id("communities"),
    senderId: v.id("users"),
    content: v.string(),
    imageId: v.optional(v.id("_storage")),
    mediaType: v.optional(v.union(v.literal("image"), v.literal("video"))),
    replyToId: v.optional(v.id("groupMessages")),
    isDeleted: v.optional(v.boolean()),
    isPinned: v.optional(v.boolean()),
  })
    .index("by_community", ["communityId"])
    .index("by_sender", ["senderId"])
    .index("by_reply", ["replyToId"]),

  groupMessageReactions: defineTable({
    messageId: v.id("groupMessages"),
    userId: v.id("users"),
    reaction: v.union(
      v.literal("like"),
      v.literal("love"),
      v.literal("laugh"),
      v.literal("wow"),
      v.literal("sad"),
      v.literal("angry")
    ),
  })
    .index("by_message", ["messageId"])
    .index("by_user", ["userId"])
    .index("by_message_and_user", ["messageId", "userId"]),

  groupMessageReads: defineTable({
    messageId: v.id("groupMessages"),
    userId: v.id("users"),
    communityId: v.id("communities"),
  })
    .index("by_message", ["messageId"])
    .index("by_user", ["userId"])
    .index("by_community_and_user", ["communityId", "userId"])
    .index("by_message_and_user", ["messageId", "userId"]),

  typingIndicators: defineTable({
    communityId: v.id("communities"),
    userId: v.id("users"),
    expiresAt: v.number(),
  })
    .index("by_community", ["communityId"])
    .index("by_user", ["userId"])
    .index("by_community_and_user", ["communityId", "userId"]),

  polls: defineTable({
    question: v.string(),
    creatorId: v.id("users"),
    postId: v.optional(v.id("posts")),
    communityId: v.optional(v.id("communities")),
    expiresAt: v.optional(v.number()),
    totalVotes: v.number(),
  })
    .index("by_creator", ["creatorId"])
    .index("by_post", ["postId"])
    .index("by_community", ["communityId"]),

  pollOptions: defineTable({
    pollId: v.id("polls"),
    text: v.string(),
    voteCount: v.number(),
    order: v.number(),
  }).index("by_poll", ["pollId"]),

  pollVotes: defineTable({
    pollId: v.id("polls"),
    optionId: v.id("pollOptions"),
    userId: v.id("users"),
  })
    .index("by_poll", ["pollId"])
    .index("by_user", ["userId"])
    .index("by_poll_and_user", ["pollId", "userId"]),

  reports: defineTable({
    reporterId: v.id("users"),
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
    status: v.union(
      v.literal("pending"),
      v.literal("reviewed"),
      v.literal("resolved"),
      v.literal("dismissed")
    ),
  })
    .index("by_reporter", ["reporterId"])
    .index("by_reported_user", ["reportedUserId"])
    .index("by_post", ["postId"])
    .index("by_status", ["status"]),

  blocks: defineTable({
    blockerId: v.id("users"),
    blockedId: v.id("users"),
  })
    .index("by_blocker", ["blockerId"])
    .index("by_blocked", ["blockedId"])
    .index("by_blocker_and_blocked", ["blockerId", "blockedId"]),

  mutes: defineTable({
    muterId: v.id("users"),
    mutedId: v.id("users"),
  })
    .index("by_muter", ["muterId"])
    .index("by_muted", ["mutedId"])
    .index("by_muter_and_muted", ["muterId", "mutedId"]),

  music: defineTable({
    title: v.string(),
    artist: v.string(),
    albumArt: v.optional(v.string()),
    duration: v.optional(v.number()),
    genre: v.optional(v.string()),
    popularity: v.number(),
    audioUrl: v.optional(v.string()),
    storageId: v.optional(v.id("_storage")), // For user-uploaded music
    userId: v.optional(v.id("users")), // Owner of uploaded music
  })
    .index("by_title", ["title"])
    .index("by_artist", ["artist"])
    .index("by_user", ["userId"]),

  savedMusic: defineTable({
    userId: v.id("users"),
    // Music info from external sources (like Pixabay)
    title: v.string(),
    artist: v.string(),
    albumArt: v.optional(v.string()),
    duration: v.optional(v.number()),
    genre: v.optional(v.string()),
    audioUrl: v.string(),
    source: v.string(), // "pixabay", "uploaded", etc.
    sourceId: v.optional(v.string()), // External ID (e.g., pixabayId)
  })
    .index("by_user", ["userId"])
    .index("by_user_and_source_id", ["userId", "sourceId"]),

  notificationPreferences: defineTable({
    userId: v.id("users"),
    // Individual notification type preferences
    likes: v.boolean(),
    comments: v.boolean(),
    follows: v.boolean(),
    mentions: v.boolean(),
    messages: v.boolean(),
    stories: v.boolean(),
    polls: v.boolean(),
    communities: v.boolean(),
    // Global settings
    pauseAll: v.boolean(),
    emailNotifications: v.boolean(),
  }).index("by_user", ["userId"]),

  dailyIslamicKnowledge: defineTable({
    title: v.string(),
    content: v.string(),
    category: v.union(
      v.literal("hadis"),
      v.literal("fıkıh"),
      v.literal("siyer"),
      v.literal("ahlak"),
      v.literal("ibadet"),
      v.literal("tarih"),
      v.literal("genel"),
    ),
    order: v.number(),
  }),

  verificationRequests: defineTable({
    userId: v.id("users"),
    reason: v.string(),
    status: v.union(
      v.literal("pending"),
      v.literal("approved"),
      v.literal("rejected")
    ),
    paymentStatus: v.union(
      v.literal("pending"),
      v.literal("completed")
    ),
    adminNotes: v.optional(v.string()),
    rejectionReason: v.optional(v.string()),
  })
    .index("by_user", ["userId"])
    .index("by_status", ["status"]),

  settings: defineTable({
    key: v.string(),
    value: v.string(),
  }).index("by_key", ["key"]),

  islamicStoryHistory: defineTable({
    userId: v.id("users"),
    storyIndex: v.number(),
    storyTitle: v.string(),
    date: v.string(),
    dayOfMonth: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_user_and_date", ["userId", "date"]),

  islamicDiscussions: defineTable({
    userId: v.id("users"),
    question: v.string(),
    likeCount: v.number(),
    replyCount: v.number(),
  }).index("by_user", ["userId"]),

  islamicDiscussionReplies: defineTable({
    discussionId: v.id("islamicDiscussions"),
    userId: v.id("users"),
    content: v.string(),
    likeCount: v.number(),
  }).index("by_discussion", ["discussionId"]),

  islamicDiscussionLikes: defineTable({
    discussionId: v.optional(v.id("islamicDiscussions")),
    replyId: v.optional(v.id("islamicDiscussionReplies")),
    userId: v.id("users"),
  })
    .index("by_discussion", ["discussionId"])
    .index("by_reply", ["replyId"])
    .index("by_user", ["userId"]),

  waterIntake: defineTable({
    userId: v.id("users"),
    date: v.string(),
    amount: v.number(), // in ml
    goal: v.number(), // daily goal in ml
  })
    .index("by_user", ["userId"])
    .index("by_user_and_date", ["userId", "date"]),

  exercises: defineTable({
    userId: v.id("users"),
    name: v.string(),
    description: v.optional(v.string()),
    duration: v.number(), // in minutes
    category: v.union(
      v.literal("cardio"),
      v.literal("strength"),
      v.literal("flexibility"),
      v.literal("balance"),
      v.literal("other")
    ),
    isCompleted: v.boolean(),
    date: v.string(),
  })
    .index("by_user", ["userId"])
    .index("by_user_and_date", ["userId", "date"]),

  books: defineTable({
    userId: v.id("users"),
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
    rating: v.optional(v.number()), // 1-5
    startDate: v.optional(v.string()),
    finishDate: v.optional(v.string()),
    notes: v.optional(v.string()),
  })
    .index("by_user", ["userId"])
    .index("by_user_and_status", ["userId", "status"]),

  dreams: defineTable({
    userId: v.id("users"),
    title: v.string(),
    content: v.string(),
    date: v.string(),
    interpretation: v.optional(v.string()),
    mood: v.optional(v.union(
      v.literal("peaceful"),
      v.literal("scary"),
      v.literal("confusing"),
      v.literal("happy"),
      v.literal("sad"),
      v.literal("exciting")
    )),
    isInterpreted: v.boolean(),
  })
    .index("by_user", ["userId"])
    .index("by_user_and_date", ["userId", "date"]),

  fortunes: defineTable({
    userId: v.id("users"),
    fortuneType: v.union(
      v.literal("coffee"), 
      v.literal("tarot"), 
      v.literal("palm"),  // El falı
      v.literal("birthchart"),  // Doğum haritası
      v.literal("aura")  // Aura okuma
    ),
    imageId: v.optional(v.id("_storage")), // for coffee, palm, and aura fortunes
    category: v.union(
      v.literal("love"),
      v.literal("general"),
      v.literal("career"),
      v.literal("health"),
      v.literal("money")
    ),
    interpretation: v.optional(v.string()),
    date: v.string(),
    isInterpreted: v.boolean(),
    // Tarot-specific fields
    tarotCards: v.optional(v.array(v.string())), // array of card names for tarot readings
    // Birth chart-specific fields
    birthDate: v.optional(v.string()), // Birth date for birth chart
    birthTime: v.optional(v.string()), // Birth time for birth chart
    birthPlace: v.optional(v.string()), // Birth place for birth chart
    // Social features
    isPublic: v.optional(v.boolean()), // Whether fortune is visible to others (default false)
    isHidden: v.optional(v.boolean()), // User can hide fortune from their profile (default false)
    publicSince: v.optional(v.number()), // Timestamp when made public (for 24h expiry)
    isFavorite: v.optional(v.boolean()), // Mark as favorite (default false)
    sharedPostId: v.optional(v.id("posts")), // Link to post if fortune was shared
    notes: v.optional(v.string()), // Personal notes about the fortune
    // Engagement counts
    likeCount: v.optional(v.number()),
    commentCount: v.optional(v.number()),
    viewCount: v.optional(v.number()),
    reactionCount: v.optional(v.number()),
  })
    .index("by_user", ["userId"])
    .index("by_user_and_date", ["userId", "date"])
    .index("by_user_and_favorite", ["userId", "isFavorite"]),

  fortuneLikes: defineTable({
    fortuneId: v.id("fortunes"),
    userId: v.id("users"),
  })
    .index("by_fortune", ["fortuneId"])
    .index("by_user", ["userId"])
    .index("by_fortune_and_user", ["fortuneId", "userId"]),

  fortuneReactions: defineTable({
    fortuneId: v.id("fortunes"),
    userId: v.id("users"),
    emoji: v.string(), // The emoji reaction
  })
    .index("by_fortune", ["fortuneId"])
    .index("by_user", ["userId"])
    .index("by_fortune_and_user", ["fortuneId", "userId"]),

  fortuneViews: defineTable({
    fortuneId: v.id("fortunes"),
    viewerId: v.id("users"),
  })
    .index("by_fortune", ["fortuneId"])
    .index("by_viewer", ["viewerId"])
    .index("by_fortune_and_viewer", ["fortuneId", "viewerId"]),

  fortuneComments: defineTable({
    fortuneId: v.id("fortunes"),
    authorId: v.id("users"),
    content: v.string(),
    likeCount: v.optional(v.number()),
  })
    .index("by_fortune", ["fortuneId"])
    .index("by_author", ["authorId"]),

  fortuneCommentLikes: defineTable({
    commentId: v.id("fortuneComments"),
    userId: v.id("users"),
  })
    .index("by_comment", ["commentId"])
    .index("by_user", ["userId"])
    .index("by_comment_and_user", ["commentId", "userId"]),

  // Fortune pricing settings (admin configurable)
  fortunePricing: defineTable({
    coffeeFortunePricePerFortune: v.number(), // Price in kuruş (cents) for 1 single coffee fortune
    tarotFortunePricePerFortune: v.number(), // Price in kuruş for 1 single tarot reading
    palmFortunePricePerFortune: v.optional(v.number()), // Price in kuruş for 1 single palm reading
    birthchartFortunePricePerFortune: v.optional(v.number()), // Price in kuruş for 1 single birth chart
    auraFortunePricePerFortune: v.optional(v.number()), // Price in kuruş for 1 single aura reading
    dailyFreeCoffee: v.number(), // Daily free coffee fortunes
    dailyFreeTarot: v.number(), // Daily free tarot readings
    dailyFreePalm: v.optional(v.number()), // Daily free palm readings
    dailyFreeBirthchart: v.optional(v.number()), // Daily free birth chart readings
    dailyFreeAura: v.optional(v.number()), // Daily free aura readings
  }),

  // Premium subscription settings (admin configurable)
  premiumSettings: defineTable({
    monthlyPrice: v.number(), // Monthly subscription price in kuruş
    unlimitedFortunes: v.boolean(), // Premium users get unlimited fortunes
    // Add more premium features as needed
  }),

  // Fortune purchase history (per-fortune payments)
  fortunePayments: defineTable({
    userId: v.id("users"),
    fortuneType: v.union(
      v.literal("coffee"), 
      v.literal("tarot"), 
      v.literal("palm"), 
      v.literal("birthchart"), 
      v.literal("aura")
    ),
    fortuneId: v.optional(v.id("fortunes")), // Link to the fortune that was purchased
    amount: v.number(), // Amount in kuruş
    stripeSessionId: v.optional(v.string()),
    playBillingOrderId: v.optional(v.string()),
    playBillingPurchaseToken: v.optional(v.string()),
    playBillingProductId: v.optional(v.string()),
    status: v.union(
      v.literal("pending"),
      v.literal("completed"),
      v.literal("failed")
    ),
  })
    .index("by_user", ["userId"])
    .index("by_stripe_session", ["stripeSessionId"]),

  // Premium subscription history
  premiumSubscriptions: defineTable({
    userId: v.id("users"),
    amount: v.number(), // Amount in kuruş
    stripeSubscriptionId: v.optional(v.string()),
    stripeSessionId: v.optional(v.string()),
    playBillingOrderId: v.optional(v.string()),
    playBillingPurchaseToken: v.optional(v.string()),
    playBillingProductId: v.optional(v.string()),
    status: v.union(
      v.literal("active"),
      v.literal("cancelled"),
      v.literal("expired")
    ),
    startDate: v.string(), // ISO date
    endDate: v.string(), // ISO date
  })
    .index("by_user", ["userId"])
    .index("by_stripe_subscription", ["stripeSubscriptionId"])
    .index("by_stripe_session", ["stripeSessionId"]),

  // Gift/Sticker system
  gifts: defineTable({
    name: v.string(),
    description: v.optional(v.string()),
    price: v.number(), // Price in kuruş
    imageUrl: v.string(), // URL to animated sticker/gift image
    category: v.string(), // Category like "love", "celebration", "funny", "premium", etc
    isActive: v.boolean(), // Whether gift is available for purchase
    isDeleted: v.optional(v.boolean()), // Soft delete flag
    isPremium: v.optional(v.boolean()), // Premium gifts with full-screen effects
    animationType: v.optional(v.union(
      v.literal("confetti"),
      v.literal("fireworks"),
      v.literal("hearts"),
      v.literal("stars"),
      v.literal("diamonds"),
      v.literal("coins"),
      v.literal("fire"),
      v.literal("snow"),
      v.literal("crown"),
      v.literal("sparkle")
    )), // Full-screen animation type for premium gifts
  }),

  // Gift settings (admin configurable)
  giftSettings: defineTable({
    platformSharePercentage: v.number(), // Platform's share (default 70)
    creatorSharePercentage: v.number(), // Creator's share (default 30)
  }),

  // Gift transactions (when users send gifts)
  giftTransactions: defineTable({
    senderId: v.id("users"),
    recipientId: v.id("users"),
    giftId: v.id("gifts"),
    conversationId: v.id("conversations"),
    messageId: v.optional(v.id("messages")),
    amount: v.number(), // Total amount paid in kuruş
    quantity: v.optional(v.number()), // Number of gifts sent
    platformShare: v.number(), // Platform's share in kuruş
    recipientShare: v.number(), // Recipient's share in kuruş
    stripeSessionId: v.optional(v.string()),
    status: v.union(
      v.literal("pending"),
      v.literal("completed"),
      v.literal("failed")
    ),
  })
    .index("by_sender", ["senderId"])
    .index("by_recipient", ["recipientId"])
    .index("by_conversation", ["conversationId"])
    .index("by_stripe_session", ["stripeSessionId"]),

  // User wallets
  userWallets: defineTable({
    userId: v.id("users"),
    balance: v.number(), // Current balance in kuruş
    totalEarned: v.number(), // Total earned from gifts in kuruş
    totalWithdrawn: v.number(), // Total withdrawn in kuruş
  }).index("by_user", ["userId"]),

  // Wallet transactions
  walletTransactions: defineTable({
    userId: v.id("users"),
    type: v.union(
      v.literal("gift_received"), // Money from receiving a gift
      v.literal("withdrawal"), // Money withdrawn
      v.literal("withdrawal_failed"), // Withdrawal that failed
      v.literal("refund"), // Refund for some reason
      v.literal("bonus") // Bonus/reward from admin
    ),
    amount: v.number(), // Amount in kuruş (positive for credit, negative for debit)
    balanceBefore: v.number(), // Balance before transaction
    balanceAfter: v.number(), // Balance after transaction
    giftTransactionId: v.optional(v.id("giftTransactions")),
    withdrawalRequestId: v.optional(v.id("withdrawalRequests")), // Link to withdrawal request
    notes: v.optional(v.string()),
    status: v.union(
      v.literal("completed"),
      v.literal("pending"),
      v.literal("failed")
    ),
  }).index("by_user", ["userId"]),

  // Wallet settings (admin configurable)
  walletSettings: defineTable({
    minWithdrawalAmount: v.number(), // Minimum withdrawal amount in kuruş (default 25000 = 250 TL)
    levelThreshold: v.number(), // Amount per level in kuruş (default 1000000 = 10,000 TL)
    maxLevel: v.number(), // Maximum level (default 100)
    level50PlusDiscount: v.number(), // Discount percentage for level 50+ (default 25)
    recipientSharePercent: v.optional(v.number()), // Recipient's share percentage from gifts (default 50)
  }),

  // App settings (system-wide settings)
  appSettings: defineTable({
    key: v.string(), // Setting key (e.g., "superAdminToken")
    value: v.string(), // Setting value
  }).index("by_key", ["key"]),

  // Gift token purchases
  tokenPurchases: defineTable({
    userId: v.id("users"),
    tokens: v.number(), // Number of tokens purchased
    price: v.number(), // Price paid in kuruş
    stripeSessionId: v.string(),
    status: v.union(
      v.literal("pending"),
      v.literal("completed"),
      v.literal("failed")
    ),
  })
    .index("by_user", ["userId"])
    .index("by_stripe_session", ["stripeSessionId"]),

  // Token pricing settings (admin configurable)
  tokenSettings: defineTable({
    packages: v.array(v.object({
      tokens: v.number(), // Number of tokens in package
      price: v.number(), // Price in kuruş
      bonus: v.optional(v.number()), // Bonus tokens (e.g., buy 100 get 10 free)
    })),
    tokenValue: v.number(), // How much 1 token is worth in kuruş (for display purposes)
  }),

  // Sexual health education articles
  sexualHealthArticles: defineTable({
    title: v.string(),
    content: v.string(),
    category: v.union(
      v.literal("general"), // For all users
      v.literal("contraception"), // Contraception methods
      v.literal("sti_prevention"), // STI prevention
      v.literal("reproductive_health"), // Female only
      v.literal("fertility"), // Female only
      v.literal("pregnancy"), // Female only
      v.literal("menopause"), // Female only
      v.literal("hygiene"), // Personal hygiene
      v.literal("relationships") // Healthy relationships
    ),
    targetGender: v.union(
      v.literal("all"),
      v.literal("female"),
      v.literal("male")
    ),
    order: v.number(), // Display order
    isPublished: v.boolean(),
  }),

  // Ovulation and fertility tracking (female only)
  ovulationTracking: defineTable({
    userId: v.id("users"),
    date: v.string(),
    cervicalMucus: v.optional(v.union(
      v.literal("dry"),
      v.literal("sticky"),
      v.literal("creamy"),
      v.literal("watery"),
      v.literal("egg_white")
    )),
    basalBodyTemperature: v.optional(v.number()), // in Celsius
    ovulationTestResult: v.optional(v.union(
      v.literal("negative"),
      v.literal("positive")
    )),
    notes: v.optional(v.string()),
  })
    .index("by_user", ["userId"])
    .index("by_user_and_date", ["userId", "date"]),

  // Sexual health checkup reminders
  healthCheckupReminders: defineTable({
    userId: v.id("users"),
    checkupType: v.union(
      v.literal("gynecology"), // Female only
      v.literal("sti_screening"), // All
      v.literal("breast_exam"), // Female only
      v.literal("general_health") // All
    ),
    lastCheckupDate: v.optional(v.string()),
    nextCheckupDate: v.optional(v.string()),
    reminderEnabled: v.boolean(),
  })
    .index("by_user", ["userId"])
    .index("by_user_and_type", ["userId", "checkupType"]),

  // Profile Analytics
  profileViews: defineTable({
    profileUserId: v.id("users"), // The user whose profile was viewed
    viewerUserId: v.optional(v.id("users")), // The user who viewed (null if unauthenticated)
    date: v.string(), // Date in YYYY-MM-DD format for daily aggregation
  })
    .index("by_profile", ["profileUserId"])
    .index("by_profile_and_date", ["profileUserId", "date"])
    .index("by_viewer", ["viewerUserId"]),

  postViews: defineTable({
    postId: v.id("posts"),
    viewerUserId: v.optional(v.id("users")), // null if unauthenticated
  })
    .index("by_post", ["postId"])
    .index("by_viewer", ["viewerUserId"])
    .index("by_post_and_viewer", ["postId", "viewerUserId"]),

  // Achievements system
  achievements: defineTable({
    userId: v.id("users"),
    achievementId: v.string(), // e.g., "first_post", "followers_100"
  })
    .index("by_user", ["userId"])
    .index("by_user_and_achievement", ["userId", "achievementId"]),

  // Mood Tracking
  moodTracking: defineTable({
    userId: v.id("users"),
    date: v.string(), // YYYY-MM-DD format
    mood: v.union(
      v.literal("very_happy"),
      v.literal("happy"),
      v.literal("neutral"),
      v.literal("sad"),
      v.literal("very_sad"),
      v.literal("anxious"),
      v.literal("stressed"),
      v.literal("calm"),
      v.literal("energetic"),
      v.literal("tired")
    ),
    intensity: v.number(), // 1-10 scale
    triggers: v.optional(v.array(v.string())), // What affected the mood
    activities: v.optional(v.array(v.string())), // Activities done that day
    notes: v.optional(v.string()),
  })
    .index("by_user", ["userId"])
    .index("by_user_and_date", ["userId", "date"]),

  // Sleep Tracking
  sleepTracking: defineTable({
    userId: v.id("users"),
    date: v.string(), // YYYY-MM-DD format (date of waking up)
    bedTime: v.string(), // HH:MM format
    wakeTime: v.string(), // HH:MM format
    duration: v.number(), // Total sleep in minutes
    quality: v.number(), // 1-5 star rating
    notes: v.optional(v.string()),
    feelingOnWaking: v.optional(v.union(
      v.literal("refreshed"),
      v.literal("tired"),
      v.literal("groggy"),
      v.literal("energetic")
    )),
  })
    .index("by_user", ["userId"])
    .index("by_user_and_date", ["userId", "date"]),

  // Habit Tracking
  habits: defineTable({
    userId: v.id("users"),
    name: v.string(),
    description: v.optional(v.string()),
    category: v.union(
      v.literal("health"),
      v.literal("fitness"),
      v.literal("mindfulness"),
      v.literal("productivity"),
      v.literal("social"),
      v.literal("learning"),
      v.literal("other")
    ),
    frequency: v.union(
      v.literal("daily"),
      v.literal("weekly"),
      v.literal("custom")
    ),
    targetDays: v.optional(v.array(v.number())), // 0=Sunday, 6=Saturday (for weekly)
    reminderTime: v.optional(v.string()), // HH:MM format
    isActive: v.boolean(),
    currentStreak: v.number(),
    longestStreak: v.number(),
  }).index("by_user", ["userId"]),

  habitLogs: defineTable({
    userId: v.id("users"),
    habitId: v.id("habits"),
    date: v.string(), // YYYY-MM-DD format
    completed: v.boolean(),
    notes: v.optional(v.string()),
  })
    .index("by_user", ["userId"])
    .index("by_habit", ["habitId"])
    .index("by_habit_and_date", ["habitId", "date"]),

  // Medication Reminders
  medications: defineTable({
    userId: v.id("users"),
    name: v.string(),
    dosage: v.string(), // e.g., "500mg", "2 tablets"
    frequency: v.string(), // e.g., "Twice daily", "Every 8 hours"
    times: v.array(v.string()), // Array of times in HH:MM format
    startDate: v.string(),
    endDate: v.optional(v.string()),
    notes: v.optional(v.string()),
    isActive: v.boolean(),
  }).index("by_user", ["userId"]),

  medicationLogs: defineTable({
    userId: v.id("users"),
    medicationId: v.id("medications"),
    scheduledTime: v.string(), // HH:MM format
    takenAt: v.optional(v.number()), // Timestamp when taken
    date: v.string(), // YYYY-MM-DD format
    status: v.union(
      v.literal("taken"),
      v.literal("missed"),
      v.literal("skipped")
    ),
    notes: v.optional(v.string()),
  })
    .index("by_user", ["userId"])
    .index("by_medication", ["medicationId"])
    .index("by_user_and_date", ["userId", "date"]),

  // Symptom Tracking
  symptoms: defineTable({
    userId: v.id("users"),
    date: v.string(), // YYYY-MM-DD format
    symptomName: v.string(),
    severity: v.number(), // 1-10 scale
    bodyPart: v.optional(v.string()),
    triggers: v.optional(v.array(v.string())),
    duration: v.optional(v.string()), // e.g., "2 hours", "all day"
    notes: v.optional(v.string()),
  })
    .index("by_user", ["userId"])
    .index("by_user_and_date", ["userId", "date"]),

  // Wellness Goals
  wellnessGoals: defineTable({
    userId: v.id("users"),
    title: v.string(),
    description: v.optional(v.string()),
    category: v.union(
      v.literal("fitness"),
      v.literal("mental_health"),
      v.literal("nutrition"),
      v.literal("sleep"),
      v.literal("habits"),
      v.literal("other")
    ),
    targetValue: v.number(), // Target number (e.g., 10000 steps, 8 hours sleep)
    currentValue: v.number(),
    unit: v.string(), // e.g., "steps", "hours", "times per week"
    startDate: v.string(),
    targetDate: v.string(),
    isCompleted: v.boolean(),
    milestones: v.optional(v.array(v.object({
      value: v.number(),
      label: v.string(),
      completed: v.boolean(),
    }))),
  })
    .index("by_user", ["userId"])
    .index("by_user_and_category", ["userId", "category"]),

  wellnessGoalProgress: defineTable({
    userId: v.id("users"),
    goalId: v.id("wellnessGoals"),
    date: v.string(), // YYYY-MM-DD format
    value: v.number(),
    notes: v.optional(v.string()),
  })
    .index("by_user", ["userId"])
    .index("by_goal", ["goalId"])
    .index("by_goal_and_date", ["goalId", "date"]),

  // Bank Accounts for withdrawal
  bankAccounts: defineTable({
    userId: v.id("users"),
    bankName: v.string(),
    accountHolderName: v.string(),
    iban: v.string(), // Turkish IBAN format (TR + 24 digits)
    isDefault: v.boolean(),
    isVerified: v.optional(v.boolean()), // Verified by admin
  })
    .index("by_user", ["userId"])
    .index("by_iban", ["iban"]),

  // Withdrawal requests
  withdrawalRequests: defineTable({
    userId: v.id("users"),
    bankAccountId: v.id("bankAccounts"),
    amount: v.number(), // Amount in kuruş
    status: v.union(
      v.literal("pending"),
      v.literal("processing"),
      v.literal("completed"),
      v.literal("rejected"),
      v.literal("cancelled")
    ),
    notes: v.optional(v.string()), // User notes
    adminNotes: v.optional(v.string()), // Admin rejection reason
    processedBy: v.optional(v.id("users")), // Admin who processed
    processedAt: v.optional(v.number()), // Timestamp when processed
  })
    .index("by_user", ["userId"])
    .index("by_status", ["status"])
    .index("by_user_and_status", ["userId", "status"]),

  // Games (XOX, etc)
  games: defineTable({
    gameType: v.union(v.literal("tictactoe")), // Can add more game types later
    player1Id: v.id("users"),
    player2Id: v.optional(v.id("users")), // null if waiting for opponent
    invitedUserId: v.optional(v.id("users")), // Specific user invited to join
    currentTurn: v.union(v.literal("X"), v.literal("O")), // X always starts
    board: v.array(v.array(v.union(v.literal("X"), v.literal("O"), v.literal("")))), // 3x3 grid
    status: v.union(
      v.literal("waiting"), // Waiting for player 2
      v.literal("in_progress"),
      v.literal("completed"),
      v.literal("cancelled")
    ),
    winnerId: v.optional(v.id("users")), // null if draw or in progress
    isDraw: v.optional(v.boolean()),
  })
    .index("by_player1", ["player1Id"])
    .index("by_player2", ["player2Id"])
    .index("by_status", ["status"])
    .index("by_invited_user", ["invitedUserId"]),

  memoryGames: defineTable({
    playerId: v.id("users"),
    level: v.union(v.literal("easy"), v.literal("medium"), v.literal("hard")), // 4x4, 6x6, 8x8
    cards: v.array(v.object({
      id: v.string(),
      icon: v.string(), // emoji or icon name
      isFlipped: v.boolean(),
      isMatched: v.boolean(),
    })),
    moves: v.number(),
    matchedPairs: v.number(),
    timeStarted: v.number(), // timestamp
    timeCompleted: v.optional(v.number()), // timestamp
    status: v.union(
      v.literal("in_progress"),
      v.literal("completed")
    ),
    bestTime: v.optional(v.number()), // Best completion time in seconds
  })
    .index("by_player", ["playerId"])
    .index("by_status", ["status"]),

  connectFourGames: defineTable({
    player1Id: v.id("users"),
    player2Id: v.optional(v.id("users")), // null if waiting for opponent
    invitedUserId: v.optional(v.id("users")), // Specific user invited to join
    currentTurn: v.union(v.literal("red"), v.literal("yellow")), // red always starts
    board: v.array(v.array(v.union(v.literal("red"), v.literal("yellow"), v.literal("")))), // 6 rows x 7 cols
    status: v.union(
      v.literal("waiting"), // Waiting for player 2
      v.literal("in_progress"),
      v.literal("completed"),
      v.literal("cancelled")
    ),
    winnerId: v.optional(v.id("users")), // null if draw or in progress
    isDraw: v.optional(v.boolean()),
  })
    .index("by_player1", ["player1Id"])
    .index("by_player2", ["player2Id"])
    .index("by_status", ["status"])
    .index("by_invited_user", ["invitedUserId"]),

  sudokuGames: defineTable({
    playerId: v.id("users"),
    difficulty: v.union(v.literal("easy"), v.literal("medium"), v.literal("hard")),
    puzzle: v.array(v.array(v.number())), // 9x9 grid, 0 = empty
    solution: v.array(v.array(v.number())), // 9x9 grid with complete solution
    userBoard: v.array(v.array(v.number())), // 9x9 grid with user's progress
    mistakes: v.number(),
    timeStarted: v.number(), // timestamp
    timeCompleted: v.optional(v.number()), // timestamp
    status: v.union(
      v.literal("in_progress"),
      v.literal("completed")
    ),
  })
    .index("by_player", ["playerId"])
    .index("by_status", ["status"]),

  minesweeperGames: defineTable({
    playerId: v.id("users"),
    difficulty: v.union(v.literal("easy"), v.literal("medium"), v.literal("hard")),
    rows: v.number(),
    cols: v.number(),
    mineCount: v.number(),
    board: v.array(v.array(v.object({
      isMine: v.boolean(),
      isRevealed: v.boolean(),
      isFlagged: v.boolean(),
      adjacentMines: v.number(),
    }))),
    timeStarted: v.number(),
    timeCompleted: v.optional(v.number()),
    status: v.union(
      v.literal("in_progress"),
      v.literal("completed"),
      v.literal("failed")
    ),
  })
    .index("by_player", ["playerId"])
    .index("by_status", ["status"]),

  wordGuessGames: defineTable({
    playerId: v.id("users"),
    word: v.string(), // The secret word (5 letters)
    guesses: v.array(v.object({
      word: v.string(),
      result: v.array(v.union(
        v.literal("correct"),   // Green - correct letter in correct position
        v.literal("present"),   // Yellow - correct letter in wrong position
        v.literal("absent")     // Gray - letter not in word
      )),
    })),
    maxGuesses: v.number(), // Usually 6
    dateKey: v.string(), // YYYY-MM-DD format for daily game
    status: v.union(
      v.literal("in_progress"),
      v.literal("won"),
      v.literal("lost")
    ),
    completedAt: v.optional(v.number()), // timestamp when completed
  })
    .index("by_player", ["playerId"])
    .index("by_player_and_date", ["playerId", "dateKey"])
    .index("by_status", ["status"]),

  quizGames: defineTable({
    player1Id: v.id("users"),
    player2Id: v.optional(v.id("users")), // null if single player or waiting
    invitedUserId: v.optional(v.id("users")), // Specific user invited to join
    category: v.union(
      v.literal("general"),
      v.literal("science"),
      v.literal("history"),
      v.literal("geography"),
      v.literal("sports"),
      v.literal("culture")
    ),
    difficulty: v.union(v.literal("easy"), v.literal("medium"), v.literal("hard")),
    mode: v.union(v.literal("single"), v.literal("multiplayer")),
    questions: v.array(v.object({
      question: v.string(),
      options: v.array(v.string()), // 4 options
      correctAnswer: v.number(), // Index of correct option (0-3)
      category: v.string(),
    })),
    player1Answers: v.array(v.object({
      questionIndex: v.number(),
      selectedAnswer: v.number(), // Index of selected option
      isCorrect: v.boolean(),
      timeSpent: v.number(), // milliseconds
    })),
    player2Answers: v.optional(v.array(v.object({
      questionIndex: v.number(),
      selectedAnswer: v.number(),
      isCorrect: v.boolean(),
      timeSpent: v.number(),
    }))),
    currentQuestionIndex: v.number(),
    player1Score: v.number(),
    player2Score: v.optional(v.number()),
    timeStarted: v.number(),
    timeCompleted: v.optional(v.number()),
    status: v.union(
      v.literal("waiting"), // Waiting for player 2 (multiplayer)
      v.literal("in_progress"),
      v.literal("completed"),
      v.literal("cancelled")
    ),
    winnerId: v.optional(v.id("users")),
  })
    .index("by_player1", ["player1Id"])
    .index("by_player2", ["player2Id"])
    .index("by_status", ["status"])
    .index("by_invited_user", ["invitedUserId"]),

  // Checkers Games (Dama)
  checkersGames: defineTable({
    player1Id: v.id("users"),
    player2Id: v.optional(v.id("users")),
    invitedUserId: v.optional(v.id("users")),
    currentTurn: v.union(v.literal("player1"), v.literal("player2")),
    board: v.array(v.array(v.union(
      v.null(),
      v.object({
        player: v.union(v.literal("player1"), v.literal("player2")),
        isKing: v.boolean(),
      })
    ))),
    status: v.union(
      v.literal("waiting"),
      v.literal("in_progress"),
      v.literal("completed"),
      v.literal("cancelled")
    ),
    winnerId: v.optional(v.id("users")),
    timeStarted: v.number(),
    timeCompleted: v.optional(v.number()),
  })
    .index("by_player1", ["player1Id"])
    .index("by_player2", ["player2Id"])
    .index("by_status", ["status"])
    .index("by_invited_user", ["invitedUserId"]),

  // Chess Games (Satranç)
  chessGames: defineTable({
    player1Id: v.id("users"), // White player
    player2Id: v.optional(v.id("users")), // Black player
    invitedUserId: v.optional(v.id("users")),
    currentTurn: v.union(v.literal("white"), v.literal("black")), // white always starts
    board: v.array(v.array(v.union(
      v.null(),
      v.object({
        type: v.union(
          v.literal("pawn"),   // Piyon
          v.literal("rook"),   // Kale
          v.literal("knight"), // At
          v.literal("bishop"), // Fil
          v.literal("queen"),  // Vezir
          v.literal("king")    // Şah
        ),
        color: v.union(v.literal("white"), v.literal("black")),
        hasMoved: v.boolean(), // Track if piece has moved (for castling, en passant)
      })
    ))),
    moveHistory: v.array(v.object({
      from: v.object({ row: v.number(), col: v.number() }),
      to: v.object({ row: v.number(), col: v.number() }),
      piece: v.string(),
      captured: v.optional(v.string()),
      isCheck: v.optional(v.boolean()),
      isCheckmate: v.optional(v.boolean()),
    })),
    isCheck: v.boolean(),
    isCheckmate: v.boolean(),
    status: v.union(
      v.literal("waiting"),
      v.literal("in_progress"),
      v.literal("completed"),
      v.literal("cancelled")
    ),
    winnerId: v.optional(v.id("users")),
    isDraw: v.optional(v.boolean()),
    timeStarted: v.number(),
    timeCompleted: v.optional(v.number()),
  })
    .index("by_player1", ["player1Id"])
    .index("by_player2", ["player2Id"])
    .index("by_status", ["status"])
    .index("by_invited_user", ["invitedUserId"]),

  // Quick Draw Games (Hızlı Çizim)
  quickDrawGames: defineTable({
    roomCode: v.string(), // Unique room code for joining
    hostId: v.id("users"),
    players: v.array(v.object({
      userId: v.id("users"),
      score: v.number(),
    })),
    currentRound: v.number(),
    totalRounds: v.number(), // Default 3
    currentDrawerId: v.optional(v.id("users")),
    currentWord: v.optional(v.string()),
    wordOptions: v.optional(v.array(v.string())), // 3 word choices for drawer
    drawingData: v.optional(v.string()), // Serialized drawing data (JSON)
    guesses: v.array(v.object({
      userId: v.id("users"),
      guess: v.string(),
      isCorrect: v.boolean(),
      timestamp: v.number(),
      points: v.number(),
    })),
    roundStartTime: v.optional(v.number()),
    roundDuration: v.number(), // seconds, default 80
    status: v.union(
      v.literal("waiting"), // Waiting for players
      v.literal("choosing_word"), // Drawer is choosing word
      v.literal("drawing"), // Drawing in progress
      v.literal("round_end"), // Round ended, showing results
      v.literal("completed") // All rounds completed
    ),
    winnerId: v.optional(v.id("users")),
    timeStarted: v.number(),
    timeCompleted: v.optional(v.number()),
  })
    .index("by_host", ["hostId"])
    .index("by_room_code", ["roomCode"])
    .index("by_status", ["status"]),

  // Military Service Tracking (male users only)
  militaryService: defineTable({
    userId: v.id("users"),
    startDate: v.string(), // ISO date string
    durationDays: v.number(), // Base military service duration in days (default 180)
    unit: v.optional(v.string()), // Military unit name (optional, kept for backward compatibility)
    branch: v.optional(v.string()), // Kuvvet: Kara, Deniz, Hava Kuvvetleri, etc.
    rank: v.optional(v.string()), // Current rank
    notes: v.optional(v.string()),
    // Leave rights (İzin ve Yol Hakları)
    totalLeaveRights: v.number(), // Total leave days right (6 days)
    totalRoadRights: v.number(), // Total road days based on distance (varies)
    totalRestRights: v.number(), // Total rest days right (6 days, first 6 don't affect discharge)
    // Used days
    usedLeaveDays: v.number(), // Used leave days
    usedRoadDays: v.number(), // Used road days
    usedRestDays: v.number(), // Used rest days
    totalDesertion: v.number(), // Total desertion days (firar)
    totalPunishment: v.number(), // Total punishment days (ceza)
  }).index("by_user", ["userId"]),

  militaryEvents: defineTable({
    militaryServiceId: v.id("militaryService"),
    userId: v.id("users"),
    date: v.string(), // ISO date string
    type: v.union(
      v.literal("leave"), // İzin (duruma göre 1-2 gün kullanılır)
      v.literal("road"), // Yol (duruma göre 1-2 gün kullanılır)
      v.literal("rest"), // İstirahat (ilk 6 gün terhisi etkilemez)
      v.literal("desertion"), // Firar (kaçma - terhise eklenir)
      v.literal("punishment"), // Ceza (terhise eklenir)
      v.literal("rollcall") // Yoklama
    ),
    // For leave, road, rest
    days: v.optional(v.number()), // Number of days (1 or 2 for leave/road, any for rest/desertion/punishment)
    // For rollcall
    rollcallType: v.optional(v.union(v.literal("morning"), v.literal("evening"), v.literal("special"))),
    rollcallStatus: v.optional(v.union(
      v.literal("present"),
      v.literal("absent"),
      v.literal("late"),
      v.literal("excused")
    )),
    notes: v.optional(v.string()),
  })
    .index("by_military_service", ["militaryServiceId"])
    .index("by_user", ["userId"])
    .index("by_date", ["date"]),

  puzzleGames: defineTable({
    creatorId: v.id("users"),
    opponentId: v.optional(v.id("users")),
    status: v.union(
      v.literal("waiting"),
      v.literal("active"),
      v.literal("completed")
    ),
    difficulty: v.union(
      v.literal("easy"),
      v.literal("medium"),
      v.literal("hard")
    ),
    gridSize: v.number(), // 3x3=9, 4x4=16, 5x5=25
    imageUrl: v.string(),
    pieces: v.array(v.object({
      id: v.number(),
      currentPosition: v.number(),
      correctPosition: v.number(),
    })),
    creatorMoves: v.number(),
    opponentMoves: v.optional(v.number()),
    creatorCompleted: v.optional(v.boolean()),
    opponentCompleted: v.optional(v.boolean()),
    winnerId: v.optional(v.id("users")),
    completedAt: v.optional(v.number()),
  })
    .index("by_creator", ["creatorId"])
    .index("by_status", ["status"]),
});
