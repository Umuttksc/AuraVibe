import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { ConvexError } from "convex/values";
import type { Id } from "./_generated/dataModel.d.ts";

// Turkish words to draw (easy to medium difficulty)
const DRAW_WORDS = [
  // Animals
  "kedi", "köpek", "kuş", "balık", "fil", "aslan", "tavşan", "kaplumbağa",
  // Objects
  "ev", "araba", "uçak", "güneş", "ay", "yıldız", "ağaç", "çiçek",
  "masa", "sandalye", "kalem", "kitap", "saat", "telefon", "bilgisayar",
  // Food
  "elma", "muz", "portakal", "üzüm", "ekmek", "su", "çay", "kahve",
  // Activities/Concepts  
  "koşmak", "yüzmek", "dans", "müzik", "futbol", "basketbol", "okul",
  // Weather/Nature
  "yağmur", "kar", "bulut", "gökkuşağı", "deniz", "dağ", "nehir",
];

// Generate random room code
function generateRoomCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

// Get random words for choosing
function getRandomWords(count: number): string[] {
  const shuffled = [...DRAW_WORDS].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

// Calculate points based on how fast the guess was made
function calculatePoints(roundStartTime: number, guessTime: number, roundDuration: number): number {
  const elapsedSeconds = (guessTime - roundStartTime) / 1000;
  const percentageRemaining = Math.max(0, (roundDuration - elapsedSeconds) / roundDuration);
  
  // Base points: 100 for correct guess
  // Time bonus: up to 50 points for guessing quickly
  return Math.round(100 + (50 * percentageRemaining));
}

export const createRoom = mutation({
  args: {
    totalRounds: v.optional(v.number()),
    roundDuration: v.optional(v.number()),
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

    // Generate unique room code
    let roomCode = generateRoomCode();
    let existingRoom = await ctx.db
      .query("quickDrawGames")
      .withIndex("by_room_code", (q) => q.eq("roomCode", roomCode))
      .first();
    
    while (existingRoom) {
      roomCode = generateRoomCode();
      existingRoom = await ctx.db
        .query("quickDrawGames")
        .withIndex("by_room_code", (q) => q.eq("roomCode", roomCode))
        .first();
    }

    const gameId = await ctx.db.insert("quickDrawGames", {
      roomCode,
      hostId: user._id,
      players: [{
        userId: user._id,
        score: 0,
      }],
      currentRound: 0,
      totalRounds: args.totalRounds || 3,
      guesses: [],
      roundDuration: args.roundDuration || 80,
      status: "waiting",
      timeStarted: Date.now(),
    });

    return { gameId, roomCode };
  },
});

export const joinRoom = mutation({
  args: {
    roomCode: v.string(),
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

    const game = await ctx.db
      .query("quickDrawGames")
      .withIndex("by_room_code", (q) => q.eq("roomCode", args.roomCode.toUpperCase()))
      .first();

    if (!game) {
      throw new ConvexError({
        message: "Oda bulunamadı",
        code: "NOT_FOUND",
      });
    }

    if (game.status !== "waiting") {
      throw new ConvexError({
        message: "Oyun zaten başladı",
        code: "BAD_REQUEST",
      });
    }

    // Check if already in game
    if (game.players.some(p => p.userId === user._id)) {
      return { gameId: game._id };
    }

    // Max 8 players
    if (game.players.length >= 8) {
      throw new ConvexError({
        message: "Oda dolu (maksimum 8 oyuncu)",
        code: "BAD_REQUEST",
      });
    }

    await ctx.db.patch(game._id, {
      players: [...game.players, { userId: user._id, score: 0 }],
    });

    return { gameId: game._id };
  },
});

export const startGame = mutation({
  args: {
    gameId: v.id("quickDrawGames"),
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

    if (game.hostId !== user._id) {
      throw new ConvexError({
        message: "Sadece oda sahibi oyunu başlatabilir",
        code: "FORBIDDEN",
      });
    }

    if (game.players.length < 2) {
      throw new ConvexError({
        message: "En az 2 oyuncu gerekli",
        code: "BAD_REQUEST",
      });
    }

    // Start first round
    const firstDrawer = game.players[0].userId;
    const wordOptions = getRandomWords(3);

    await ctx.db.patch(args.gameId, {
      status: "choosing_word",
      currentRound: 1,
      currentDrawerId: firstDrawer,
      wordOptions,
      guesses: [],
    });
  },
});

export const chooseWord = mutation({
  args: {
    gameId: v.id("quickDrawGames"),
    word: v.string(),
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

    if (game.currentDrawerId !== user._id) {
      throw new ConvexError({
        message: "Sadece çizen oyuncu kelime seçebilir",
        code: "FORBIDDEN",
      });
    }

    if (game.status !== "choosing_word") {
      throw new ConvexError({
        message: "Şu anda kelime seçme zamanı değil",
        code: "BAD_REQUEST",
      });
    }

    await ctx.db.patch(args.gameId, {
      status: "drawing",
      currentWord: args.word,
      wordOptions: undefined,
      roundStartTime: Date.now(),
      drawingData: undefined, // Clear previous drawing
      guesses: [],
    });
  },
});

export const updateDrawing = mutation({
  args: {
    gameId: v.id("quickDrawGames"),
    drawingData: v.string(),
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

    if (game.currentDrawerId !== user._id) {
      throw new ConvexError({
        message: "Sadece çizen oyuncu çizim yapabilir",
        code: "FORBIDDEN",
      });
    }

    await ctx.db.patch(args.gameId, {
      drawingData: args.drawingData,
    });
  },
});

export const makeGuess = mutation({
  args: {
    gameId: v.id("quickDrawGames"),
    guess: v.string(),
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

    if (game.status !== "drawing") {
      throw new ConvexError({
        message: "Şu anda tahmin zamanı değil",
        code: "BAD_REQUEST",
      });
    }

    if (game.currentDrawerId === user._id) {
      throw new ConvexError({
        message: "Çizen oyuncu tahmin yapamaz",
        code: "FORBIDDEN",
      });
    }

    // Check if already guessed correctly
    if (game.guesses.some(g => g.userId === user._id && g.isCorrect)) {
      throw new ConvexError({
        message: "Zaten doğru tahmin yaptınız",
        code: "BAD_REQUEST",
      });
    }

    const guessLower = args.guess.toLowerCase().trim();
    const isCorrect = guessLower === game.currentWord?.toLowerCase();
    
    const points = isCorrect && game.roundStartTime
      ? calculatePoints(game.roundStartTime, Date.now(), game.roundDuration)
      : 0;

    const newGuess = {
      userId: user._id,
      guess: args.guess,
      isCorrect,
      timestamp: Date.now(),
      points,
    };

    const updatedGuesses = [...game.guesses, newGuess];

    // Update player score if correct
    let updatedPlayers = game.players;
    if (isCorrect) {
      updatedPlayers = game.players.map(p =>
        p.userId === user._id
          ? { ...p, score: p.score + points }
          : p
      );
    }

    await ctx.db.patch(args.gameId, {
      guesses: updatedGuesses,
      players: updatedPlayers,
    });

    return { isCorrect, points };
  },
});

export const endRound = mutation({
  args: {
    gameId: v.id("quickDrawGames"),
  },
  handler: async (ctx, args) => {
    const game = await ctx.db.get(args.gameId);
    if (!game) {
      throw new ConvexError({
        message: "Oyun bulunamadı",
        code: "NOT_FOUND",
      });
    }

    if (game.status !== "drawing") {
      return; // Already ended
    }

    // Check if all players (except drawer) have guessed correctly
    const guessingPlayers = game.players.filter(p => p.userId !== game.currentDrawerId);
    const correctGuesses = game.guesses.filter(g => g.isCorrect);
    const allGuessedCorrectly = guessingPlayers.length > 0 && 
      correctGuesses.length >= guessingPlayers.length;

    // Check if time is up
    const timeUp = game.roundStartTime && 
      (Date.now() - game.roundStartTime) / 1000 >= game.roundDuration;

    if (allGuessedCorrectly || timeUp) {
      // Move to next round or end game
      if (game.currentRound >= game.totalRounds) {
        // Game complete
        const winner = game.players.reduce((max, player) =>
          player.score > max.score ? player : max
        );

        await ctx.db.patch(args.gameId, {
          status: "completed",
          winnerId: winner.userId,
          timeCompleted: Date.now(),
        });
      } else {
        // Next round
        const currentDrawerIndex = game.players.findIndex(
          p => p.userId === game.currentDrawerId
        );
        const nextDrawerIndex = (currentDrawerIndex + 1) % game.players.length;
        const nextDrawer = game.players[nextDrawerIndex].userId;
        const wordOptions = getRandomWords(3);

        await ctx.db.patch(args.gameId, {
          status: "choosing_word",
          currentRound: game.currentRound + 1,
          currentDrawerId: nextDrawer,
          wordOptions,
          guesses: [],
          drawingData: undefined,
        });
      }
    }
  },
});

export const getGame = query({
  args: { gameId: v.id("quickDrawGames") },
  handler: async (ctx, args) => {
    const game = await ctx.db.get(args.gameId);
    if (!game) return null;

    const identity = await ctx.auth.getUserIdentity();
    const user = identity
      ? await ctx.db
          .query("users")
          .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
          .unique()
      : null;

    // Get player details
    const playersWithDetails = await Promise.all(
      game.players.map(async (player) => {
        const playerUser = await ctx.db.get(player.userId);
        return {
          ...player,
          user: playerUser ? {
            _id: playerUser._id,
            name: playerUser.name,
            username: playerUser.username,
            profilePicture: playerUser.profilePicture,
          } : null,
        };
      })
    );

    // Hide word from guessers
    const isDrawer = user && game.currentDrawerId === user._id;
    const showWord = isDrawer || game.status === "round_end" || game.status === "completed";

    return {
      ...game,
      players: playersWithDetails,
      currentWord: showWord ? game.currentWord : undefined,
    };
  },
});

export const getActiveRooms = query({
  args: {},
  handler: async (ctx) => {
    const games = await ctx.db
      .query("quickDrawGames")
      .withIndex("by_status", (q) => q.eq("status", "waiting"))
      .order("desc")
      .take(20);

    const gamesWithDetails = await Promise.all(
      games.map(async (game) => {
        const host = await ctx.db.get(game.hostId);
        return {
          ...game,
          host,
        };
      })
    );

    return gamesWithDetails;
  },
});
