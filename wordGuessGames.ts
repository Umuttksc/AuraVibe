import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { ConvexError } from "convex/values";

// Turkish 5-letter words list with hints
const TURKISH_WORDS: Array<{ word: string; hint: string }> = [
  // Vehicles
  { word: "araba", hint: "Taşıt" },
  { word: "uçak", hint: "Taşıt" },
  { word: "vagon", hint: "Taşıt" },
  
  // Animals
  { word: "köpek", hint: "Hayvan" },
  { word: "balık", hint: "Hayvan" },
  { word: "inek", hint: "Hayvan" },
  
  // Nature
  { word: "deniz", hint: "Doğa" },
  { word: "orman", hint: "Doğa" },
  { word: "sahil", hint: "Doğa" },
  { word: "ağaç", hint: "Doğa" },
  { word: "çiçek", hint: "Doğa" },
  { word: "nehir", hint: "Doğa" },
  { word: "toprak", hint: "Doğa" },
  { word: "fidan", hint: "Doğa" },
  { word: "vadi", hint: "Doğa" },
  { word: "lale", hint: "Doğa" },
  
  // Food & Drink
  { word: "meyve", hint: "Yiyecek" },
  { word: "limon", hint: "Yiyecek" },
  { word: "üzüm", hint: "Yiyecek" },
  { word: "tatlı", hint: "Yiyecek" },
  { word: "lokma", hint: "Yiyecek" },
  { word: "ekmek", hint: "Yiyecek" },
  { word: "yemek", hint: "Yiyecek" },
  { word: "gazoz", hint: "Yiyecek" },
  { word: "sebze", hint: "Yiyecek" },
  { word: "zeytin", hint: "Yiyecek" },
  { word: "ekşi", hint: "Yiyecek" },
  
  // Objects
  { word: "kitap", hint: "Eşya" },
  { word: "gözlük", hint: "Eşya" },
  { word: "tabak", hint: "Eşya" },
  { word: "paket", hint: "Eşya" },
  { word: "elmas", hint: "Eşya" },
  { word: "fener", hint: "Eşya" },
  { word: "kalem", hint: "Eşya" },
  { word: "masa", hint: "Eşya" },
  { word: "çatal", hint: "Eşya" },
  { word: "bıçak", hint: "Eşya" },
  { word: "çanta", hint: "Eşya" },
  { word: "jilet", hint: "Eşya" },
  { word: "radyo", hint: "Eşya" },
  { word: "perde", hint: "Eşya" },
  
  // Clothing
  { word: "gömlek", hint: "Giysi" },
  { word: "kuşak", hint: "Giysi" },
  
  // People & Family
  { word: "bebek", hint: "İnsan" },
  { word: "çocuk", hint: "İnsan" },
  { word: "gelin", hint: "İnsan" },
  { word: "oğul", hint: "İnsan" },
  
  // Places
  { word: "bahçe", hint: "Yer" },
  { word: "cadde", hint: "Yer" },
  { word: "şehir", hint: "Yer" },
  { word: "pazar", hint: "Yer" },
  { word: "liman", hint: "Yer" },
  { word: "okul", hint: "Yer" },
  { word: "park", hint: "Yer" },
  { word: "iskele", hint: "Yer" },
  { word: "fırın", hint: "Yer" },
  { word: "piknik", hint: "Yer" },
  
  // Sky & Space
  { word: "dünya", hint: "Uzay" },
  { word: "evren", hint: "Uzay" },
  { word: "güneş", hint: "Uzay" },
  { word: "yıldız", hint: "Uzay" },
  
  // Concepts
  { word: "değer", hint: "Kavram" },
  { word: "haber", hint: "Kavram" },
  { word: "kalp", hint: "Kavram" },
  { word: "masal", hint: "Kavram" },
  { word: "renk", hint: "Kavram" },
  { word: "vatan", hint: "Kavram" },
  { word: "huzur", hint: "Kavram" },
  { word: "umut", hint: "Kavram" },
  { word: "anlam", hint: "Kavram" },
  { word: "dilek", hint: "Kavram" },
  { word: "neden", hint: "Kavram" },
  { word: "sebep", hint: "Kavram" },
  { word: "oyun", hint: "Kavram" },
  
  // Time
  { word: "zaman", hint: "Zaman" },
  { word: "gece", hint: "Zaman" },
  { word: "hafta", hint: "Zaman" },
  { word: "akşam", hint: "Zaman" },
  { word: "nisan", hint: "Zaman" },
  { word: "sabah", hint: "Zaman" },
  
  // Materials
  { word: "yaprak", hint: "Malzeme" },
  { word: "maden", hint: "Malzeme" },
  { word: "çelik", hint: "Malzeme" },
  { word: "damla", hint: "Malzeme" },
  
  // Other
  { word: "ışık", hint: "Diğer" },
  { word: "zalim", hint: "Diğer" },
  { word: "açık", hint: "Diğer" },
  { word: "bayrak", hint: "Diğer" },
  { word: "cesur", hint: "Diğer" },
  { word: "engin", hint: "Diğer" },
  { word: "ilkay", hint: "Diğer" },
  { word: "kanat", hint: "Diğer" },
  { word: "rüya", hint: "Diğer" },
  { word: "sözlük", hint: "Diğer" },
  { word: "zirve", hint: "Diğer" },
  { word: "harika", hint: "Diğer" },
  { word: "tane", hint: "Diğer" },
  { word: "yazı", hint: "Diğer" },
  { word: "zemin", hint: "Diğer" },
  { word: "beyaz", hint: "Diğer" },
  { word: "raf", hint: "Diğer" },
  { word: "tavan", hint: "Diğer" },
  { word: "uzun", hint: "Diğer" },
  { word: "viraj", hint: "Diğer" },
  { word: "yağmur", hint: "Diğer" },
  { word: "kırmızı", hint: "Diğer" },
  { word: "milli", hint: "Diğer" },
];

// Get a random word
function getRandomWord(): { word: string; hint: string } {
  return TURKISH_WORDS[Math.floor(Math.random() * TURKISH_WORDS.length)];
}

// Check if a word is valid
function isValidWord(word: string): boolean {
  return TURKISH_WORDS.some(w => w.word === word.toLowerCase());
}

// Compare guess with the target word
function checkGuess(guess: string, target: string): Array<"correct" | "present" | "absent"> {
  const result: Array<"correct" | "present" | "absent"> = [];
  const targetLetters = target.split("");
  const guessLetters = guess.split("");
  
  // Track which letters have been matched
  const matched = new Array(5).fill(false);
  
  // First pass: mark correct positions
  for (let i = 0; i < 5; i++) {
    if (guessLetters[i] === targetLetters[i]) {
      result[i] = "correct";
      matched[i] = true;
    }
  }
  
  // Second pass: mark present letters
  for (let i = 0; i < 5; i++) {
    if (result[i] === "correct") continue;
    
    let found = false;
    for (let j = 0; j < 5; j++) {
      if (!matched[j] && guessLetters[i] === targetLetters[j]) {
        result[i] = "present";
        matched[j] = true;
        found = true;
        break;
      }
    }
    
    if (!found) {
      result[i] = "absent";
    }
  }
  
  return result;
}

// Get today's date key (YYYY-MM-DD)
function getTodayDateKey(): string {
  const now = new Date();
  return now.toISOString().split("T")[0];
}

// Create a new game
export const createGame = mutation({
  args: {},
  handler: async (ctx) => {
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

    const dateKey = getTodayDateKey();

    // Check if user already has a game for today
    const existingGame = await ctx.db
      .query("wordGuessGames")
      .withIndex("by_player_and_date", (q) => 
        q.eq("playerId", user._id).eq("dateKey", dateKey)
      )
      .first();

    if (existingGame) {
      throw new ConvexError({
        message: "Bugün için zaten bir oyununuz var",
        code: "BAD_REQUEST",
      });
    }

    // Create new game with random word
    const wordData = getRandomWord();
    const gameId = await ctx.db.insert("wordGuessGames", {
      playerId: user._id,
      word: wordData.word,
      guesses: [],
      maxGuesses: 6,
      dateKey,
      status: "in_progress",
    });

    return { gameId, hint: wordData.hint };
  },
});

// Make a guess
export const makeGuess = mutation({
  args: {
    gameId: v.id("wordGuessGames"),
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

    if (game.playerId !== user._id) {
      throw new ConvexError({
        message: "Bu oyunu oynayamazsınız",
        code: "FORBIDDEN",
      });
    }

    if (game.status !== "in_progress") {
      throw new ConvexError({
        message: "Oyun bitti",
        code: "BAD_REQUEST",
      });
    }

    // Validate guess
    const guessLower = args.guess.toLowerCase();
    if (guessLower.length !== 5) {
      throw new ConvexError({
        message: "Tahmin 5 harfli olmalı",
        code: "BAD_REQUEST",
      });
    }

    if (!isValidWord(guessLower)) {
      throw new ConvexError({
        message: "Geçerli bir kelime değil",
        code: "BAD_REQUEST",
      });
    }

    // Check guess against target word
    const result = checkGuess(guessLower, game.word);
    
    // Add guess to game
    const newGuesses = [...game.guesses, { word: guessLower, result }];
    
    // Check if won
    const isWon = result.every(r => r === "correct");
    
    // Check if lost (used all guesses)
    const isLost = !isWon && newGuesses.length >= game.maxGuesses;
    
    // Update game status
    let status: "in_progress" | "won" | "lost" = game.status;
    let completedAt: number | undefined;
    
    if (isWon) {
      status = "won";
      completedAt = Date.now();
    } else if (isLost) {
      status = "lost";
      completedAt = Date.now();
    }

    await ctx.db.patch(args.gameId, {
      guesses: newGuesses,
      status,
      ...(completedAt && { completedAt }),
    });

    return {
      result,
      isWon,
      isLost,
      word: isWon || isLost ? game.word : undefined,
    };
  },
});

// Get game by ID
export const getGame = query({
  args: { gameId: v.id("wordGuessGames") },
  handler: async (ctx, args) => {
    const game = await ctx.db.get(args.gameId);
    if (!game) {
      return null;
    }

    const player = await ctx.db.get(game.playerId);
    const wordData = TURKISH_WORDS.find(w => w.word === game.word);

    return {
      ...game,
      hint: wordData?.hint || "Genel",
      // Only show word if game is completed
      word: game.status !== "in_progress" ? game.word : undefined,
      player: player ? {
        _id: player._id,
        name: player.name,
        username: player.username,
      } : null,
    };
  },
});

// Get today's game for current user
export const getTodaysGame = query({
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

    const dateKey = getTodayDateKey();

    const game = await ctx.db
      .query("wordGuessGames")
      .withIndex("by_player_and_date", (q) => 
        q.eq("playerId", user._id).eq("dateKey", dateKey)
      )
      .first();

    if (!game) {
      return null;
    }

    // Find hint for the word
    const wordData = TURKISH_WORDS.find(w => w.word === game.word);
    const hint = wordData?.hint || "Genel";

    return {
      ...game,
      hint,
      // Only show word if game is completed
      word: game.status !== "in_progress" ? game.word : undefined,
    };
  },
});

// Get player statistics
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

    const games = await ctx.db
      .query("wordGuessGames")
      .withIndex("by_player", (q) => q.eq("playerId", user._id))
      .collect();

    const totalGames = games.filter(g => g.status !== "in_progress").length;
    const wonGames = games.filter(g => g.status === "won").length;
    const lostGames = games.filter(g => g.status === "lost").length;
    
    // Calculate win streak
    let currentStreak = 0;
    let maxStreak = 0;
    const sortedGames = games
      .filter(g => g.status !== "in_progress")
      .sort((a, b) => b._creationTime - a._creationTime);

    for (const game of sortedGames) {
      if (game.status === "won") {
        currentStreak++;
        maxStreak = Math.max(maxStreak, currentStreak);
      } else {
        break;
      }
    }

    // Guess distribution
    const guessDistribution: Record<number, number> = {
      1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0,
    };

    for (const game of games) {
      if (game.status === "won") {
        const guessCount = game.guesses.length;
        if (guessCount >= 1 && guessCount <= 6) {
          guessDistribution[guessCount]++;
        }
      }
    }

    return {
      totalGames,
      wonGames,
      lostGames,
      winRate: totalGames > 0 ? Math.round((wonGames / totalGames) * 100) : 0,
      currentStreak,
      maxStreak,
      guessDistribution,
    };
  },
});
