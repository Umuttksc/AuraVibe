import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { ConvexError } from "convex/values";

// Emoji/icon list for cards
const CARD_ICONS = [
  "🍎", "🍊", "🍋", "🍌", "🍉", "🍇", "🍓", "🫐",
  "🍒", "🍑", "🥭", "🍍", "🥥", "🥝", "🍅", "🥑",
  "🌺", "🌸", "🌼", "🌻", "🌹", "🌷", "🌲", "🌳",
  "⭐", "✨", "💫", "🌟", "🔥", "💧", "⚡", "🌈"
];

// Create a new memory game
export const createGame = mutation({
  args: {
    level: v.union(v.literal("easy"), v.literal("medium"), v.literal("hard")),
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
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
      .unique();

    if (!user) {
      throw new ConvexError({
        message: "Kullanıcı bulunamadı",
        code: "NOT_FOUND",
      });
    }

    // Determine grid size based on level
    const gridSize = args.level === "easy" ? 4 : args.level === "medium" ? 6 : 8;
    const pairCount = (gridSize * gridSize) / 2;

    // Select random icons
    const selectedIcons = CARD_ICONS.slice(0, pairCount);
    
    // Create pairs and shuffle
    const cardPairs = [...selectedIcons, ...selectedIcons];
    const shuffledCards = cardPairs
      .map((icon, index) => ({
        id: `card-${index}`,
        icon,
        isFlipped: false,
        isMatched: false,
      }))
      .sort(() => Math.random() - 0.5);

    const gameId = await ctx.db.insert("memoryGames", {
      playerId: user._id,
      level: args.level,
      cards: shuffledCards,
      moves: 0,
      matchedPairs: 0,
      timeStarted: Date.now(),
      status: "in_progress",
    });

    return gameId;
  },
});

// Flip a card
export const flipCard = mutation({
  args: {
    gameId: v.id("memoryGames"),
    cardId: v.string(),
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
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
      .unique();

    if (!user) {
      throw new ConvexError({
        message: "Kullanıcı bulunamadı",
        code: "NOT_FOUND",
      });
    }

    const game = await ctx.db.get(args.gameId);
    if (!game) {
      throw new ConvexError({
        message: "Oyun bulunamadı",
        code: "NOT_FOUND",
      });
    }

    if (game.playerId !== user._id) {
      throw new ConvexError({
        message: "Bu oyunu oynayamazsınız",
        code: "FORBIDDEN",
      });
    }

    if (game.status !== "in_progress") {
      throw new ConvexError({
        message: "Oyun devam etmiyor",
        code: "BAD_REQUEST",
      });
    }

    // Find the card
    const cardIndex = game.cards.findIndex(card => card.id === args.cardId);
    if (cardIndex === -1) {
      throw new ConvexError({
        message: "Kart bulunamadı",
        code: "NOT_FOUND",
      });
    }

    const card = game.cards[cardIndex];
    
    // Can't flip if already flipped or matched
    if (card.isFlipped || card.isMatched) {
      throw new ConvexError({
        message: "Bu kart zaten açık",
        code: "BAD_REQUEST",
      });
    }

    // Check how many cards are currently flipped
    const flippedCards = game.cards.filter(c => c.isFlipped && !c.isMatched);
    if (flippedCards.length >= 2) {
      throw new ConvexError({
        message: "Önce açık kartları kapatın",
        code: "BAD_REQUEST",
      });
    }

    // Flip the card
    const newCards = [...game.cards];
    newCards[cardIndex] = { ...card, isFlipped: true };

    // Increment moves if this is the first card of a pair
    const newMoves = flippedCards.length === 0 ? game.moves + 1 : game.moves;

    await ctx.db.patch(args.gameId, {
      cards: newCards,
      moves: newMoves,
    });

    return { flippedCount: flippedCards.length + 1 };
  },
});

// Check for match and update game state
export const checkMatch = mutation({
  args: {
    gameId: v.id("memoryGames"),
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
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
      .unique();

    if (!user) {
      throw new ConvexError({
        message: "Kullanıcı bulunamadı",
        code: "NOT_FOUND",
      });
    }

    const game = await ctx.db.get(args.gameId);
    if (!game) {
      throw new ConvexError({
        message: "Oyun bulunamadı",
        code: "NOT_FOUND",
      });
    }

    if (game.playerId !== user._id) {
      throw new ConvexError({
        message: "Bu oyunu oynayamazsınız",
        code: "FORBIDDEN",
      });
    }

    // Get flipped cards
    const flippedCards = game.cards.filter(c => c.isFlipped && !c.isMatched);
    if (flippedCards.length !== 2) {
      throw new ConvexError({
        message: "İki kart açık değil",
        code: "BAD_REQUEST",
      });
    }

    const [card1, card2] = flippedCards;
    const isMatch = card1.icon === card2.icon;

    let newCards = [...game.cards];
    let newMatchedPairs = game.matchedPairs;

    if (isMatch) {
      // Mark as matched
      newCards = newCards.map(card => {
        if (card.id === card1.id || card.id === card2.id) {
          return { ...card, isMatched: true };
        }
        return card;
      });
      newMatchedPairs += 1;
    } else {
      // Unflip both cards
      newCards = newCards.map(card => {
        if (card.id === card1.id || card.id === card2.id) {
          return { ...card, isFlipped: false };
        }
        return card;
      });
    }

    // Check if game is completed
    const gridSize = game.level === "easy" ? 4 : game.level === "medium" ? 6 : 8;
    const totalPairs = (gridSize * gridSize) / 2;
    const isCompleted = newMatchedPairs === totalPairs;

    const updates: {
      cards: typeof newCards;
      matchedPairs: number;
      status?: "completed";
      timeCompleted?: number;
    } = {
      cards: newCards,
      matchedPairs: newMatchedPairs,
    };

    if (isCompleted) {
      updates.status = "completed";
      updates.timeCompleted = Date.now();
    }

    await ctx.db.patch(args.gameId, updates);

    return { isMatch, isCompleted };
  },
});

// Get current game
export const getGame = query({
  args: { gameId: v.id("memoryGames") },
  handler: async (ctx, args) => {
    const game = await ctx.db.get(args.gameId);
    if (!game) {
      return null;
    }

    const player = await ctx.db.get(game.playerId);

    return {
      ...game,
      player: player ? {
        _id: player._id,
        name: player.name,
        username: player.username,
      } : null,
    };
  },
});

// Get player's active game
export const getActiveGame = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return null;
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
      .unique();

    if (!user) {
      return null;
    }

    const game = await ctx.db
      .query("memoryGames")
      .withIndex("by_player", (q) => q.eq("playerId", user._id))
      .filter((q) => q.eq(q.field("status"), "in_progress"))
      .first();

    if (!game) {
      return null;
    }

    return {
      ...game,
      player: {
        _id: user._id,
        name: user.name,
        username: user.username,
      },
    };
  },
});

// Get player's completed games (stats)
export const getPlayerStats = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return null;
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
      .unique();

    if (!user) {
      return null;
    }

    const completedGames = await ctx.db
      .query("memoryGames")
      .withIndex("by_player", (q) => q.eq("playerId", user._id))
      .filter((q) => q.eq(q.field("status"), "completed"))
      .collect();

    if (completedGames.length === 0) {
      return {
        totalGames: 0,
        bestTimeEasy: null,
        bestTimeMedium: null,
        bestTimeHard: null,
      };
    }

    const easyGames = completedGames.filter(g => g.level === "easy");
    const mediumGames = completedGames.filter(g => g.level === "medium");
    const hardGames = completedGames.filter(g => g.level === "hard");

    const getBestTime = (games: typeof completedGames) => {
      if (games.length === 0) return null;
      const times = games
        .filter(g => g.timeCompleted)
        .map(g => (g.timeCompleted! - g.timeStarted) / 1000);
      return times.length > 0 ? Math.min(...times) : null;
    };

    return {
      totalGames: completedGames.length,
      bestTimeEasy: getBestTime(easyGames),
      bestTimeMedium: getBestTime(mediumGames),
      bestTimeHard: getBestTime(hardGames),
    };
  },
});
