import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { ConvexError } from "convex/values";
import type { Doc, Id } from "./_generated/dataModel.d.ts";

// Helper function to shuffle array
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

// Helper function to check if puzzle is solvable
function isSolvable(pieces: number[], gridSize: number): boolean {
  let inversions = 0;
  const filtered = pieces.filter(n => n !== 0); // Remove empty space
  
  for (let i = 0; i < filtered.length; i++) {
    for (let j = i + 1; j < filtered.length; j++) {
      if (filtered[i] > filtered[j]) {
        inversions++;
      }
    }
  }
  
  // For odd grid sizes, puzzle is solvable if inversions is even
  if (gridSize % 2 === 1) {
    return inversions % 2 === 0;
  }
  
  // For even grid sizes, more complex rules apply
  const emptyRowFromBottom = gridSize - Math.floor(pieces.indexOf(0) / gridSize);
  return (inversions + emptyRowFromBottom) % 2 === 0;
}

// Helper function to create shuffled puzzle
function createShuffledPuzzle(gridSize: number): number[] {
  const size = gridSize * gridSize;
  const pieces = Array.from({ length: size }, (_, i) => i);
  
  // Shuffle until we get a solvable configuration
  let shuffled: number[];
  do {
    shuffled = shuffleArray(pieces);
  } while (!isSolvable(shuffled, gridSize) || shuffled.every((p, i) => p === i));
  
  return shuffled;
}

// Helper: Get puzzle images
function getPuzzleImages(): string[] {
  return [
    "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800", // Mountain landscape
    "https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=800", // Nature
    "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=800", // Forest
    "https://images.unsplash.com/photo-1475924156734-496f6cac6ec1?w=800", // Sunset
    "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=800", // Mountains
    "https://images.unsplash.com/photo-1472214103451-9374bd1c798e?w=800", // Landscape
    "https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=800", // Lake
    "https://images.unsplash.com/photo-1426604966848-d7adac402bff?w=800", // Forest path
  ];
}

// Create a new puzzle game
export const createGame = mutation({
  args: {
    difficulty: v.union(v.literal("easy"), v.literal("medium"), v.literal("hard")),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError({
        message: "Oturum açmanız gerekiyor",
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

    // Determine grid size based on difficulty
    const gridSizeMap = {
      easy: 3,
      medium: 4,
      hard: 5,
    };
    const gridSize = gridSizeMap[args.difficulty];

    // Create shuffled puzzle
    const shuffled = createShuffledPuzzle(gridSize);
    
    // Create pieces array
    const pieces = shuffled.map((id, index) => ({
      id,
      currentPosition: index,
      correctPosition: id,
    }));

    // Get random puzzle image
    const images = getPuzzleImages();
    const imageUrl = images[Math.floor(Math.random() * images.length)];

    const gameId = await ctx.db.insert("puzzleGames", {
      creatorId: user._id,
      status: "waiting",
      difficulty: args.difficulty,
      gridSize: gridSize * gridSize,
      imageUrl,
      pieces,
      creatorMoves: 0,
    });

    return { gameId };
  },
});

// Join an existing puzzle game
export const joinGame = mutation({
  args: {
    gameId: v.id("puzzleGames"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError({
        message: "Oturum açmanız gerekiyor",
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

    if (game.status !== "waiting") {
      throw new ConvexError({
        message: "Bu oyun zaten başlamış",
        code: "BAD_REQUEST",
      });
    }

    if (game.creatorId === user._id) {
      throw new ConvexError({
        message: "Kendi oyununuza katılamazsınız",
        code: "BAD_REQUEST",
      });
    }

    if (game.opponentId) {
      throw new ConvexError({
        message: "Oyun zaten dolu",
        code: "BAD_REQUEST",
      });
    }

    await ctx.db.patch(args.gameId, {
      opponentId: user._id,
      opponentMoves: 0,
      status: "active",
    });

    return { gameId: args.gameId };
  },
});

// Make a move (swap piece with empty space)
export const makeMove = mutation({
  args: {
    gameId: v.id("puzzleGames"),
    pieceIndex: v.number(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError({
        message: "Oturum açmanız gerekiyor",
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

    const isCreator = game.creatorId === user._id;
    const isOpponent = game.opponentId === user._id;

    if (!isCreator && !isOpponent) {
      throw new ConvexError({
        message: "Bu oyunun oyuncusu değilsiniz",
        code: "FORBIDDEN",
      });
    }

    // Check if player already completed
    if (
      (isCreator && game.creatorCompleted) ||
      (isOpponent && game.opponentCompleted)
    ) {
      throw new ConvexError({
        message: "Zaten tamamladınız",
        code: "BAD_REQUEST",
      });
    }

    // Find empty space (piece with id 0)
    const emptyIndex = game.pieces.findIndex((p) => p.id === 0);
    const gridDimension = Math.sqrt(game.gridSize);

    // Check if move is valid (adjacent to empty space)
    const emptyRow = Math.floor(emptyIndex / gridDimension);
    const emptyCol = emptyIndex % gridDimension;
    const pieceRow = Math.floor(args.pieceIndex / gridDimension);
    const pieceCol = args.pieceIndex % gridDimension;

    const isAdjacent =
      (Math.abs(emptyRow - pieceRow) === 1 && emptyCol === pieceCol) ||
      (Math.abs(emptyCol - pieceCol) === 1 && emptyRow === pieceRow);

    if (!isAdjacent) {
      throw new ConvexError({
        message: "Geçersiz hamle",
        code: "BAD_REQUEST",
      });
    }

    // Swap pieces
    const newPieces = [...game.pieces];
    [newPieces[emptyIndex], newPieces[args.pieceIndex]] = [
      newPieces[args.pieceIndex],
      newPieces[emptyIndex],
    ];

    // Update positions
    newPieces.forEach((piece, index) => {
      piece.currentPosition = index;
    });

    // Increment move count
    const newMoves = isCreator
      ? game.creatorMoves + 1
      : (game.opponentMoves || 0) + 1;

    // Check if puzzle is solved
    const isSolved = newPieces.every((piece) => piece.id === piece.currentPosition);

    const updates: Partial<Doc<"puzzleGames">> = {
      pieces: newPieces,
    };

    if (isCreator) {
      updates.creatorMoves = newMoves;
      if (isSolved) {
        updates.creatorCompleted = true;
      }
    } else {
      updates.opponentMoves = newMoves;
      if (isSolved) {
        updates.opponentCompleted = true;
      }
    }

    // Check if game is completed (both players done or single player done)
    if (isSolved) {
      if (!game.opponentId || (game.creatorCompleted && isOpponent) || (game.opponentCompleted && isCreator)) {
        updates.status = "completed";
        updates.completedAt = Date.now();
        
        // Determine winner (fewest moves)
        if (game.opponentId) {
          const creatorMoves = isCreator ? newMoves : game.creatorMoves;
          const opponentMoves = isOpponent ? newMoves : (game.opponentMoves || 0);
          
          if (game.creatorCompleted || isCreator) {
            if (game.opponentCompleted || isOpponent) {
              updates.winnerId = creatorMoves < opponentMoves ? game.creatorId : game.opponentId;
            }
          }
        } else {
          updates.winnerId = user._id;
        }
      }
    }

    await ctx.db.patch(args.gameId, updates);

    return { isSolved };
  },
});

// Get game data
export const getGame = query({
  args: { gameId: v.id("puzzleGames") },
  handler: async (ctx, args) => {
    const game = await ctx.db.get(args.gameId);
    if (!game) {
      return null;
    }

    const creator = await ctx.db.get(game.creatorId);
    const opponent = game.opponentId ? await ctx.db.get(game.opponentId) : null;
    const winner = game.winnerId ? await ctx.db.get(game.winnerId) : null;

    return {
      ...game,
      creator: creator
        ? {
            _id: creator._id,
            name: creator.name || creator.username,
            username: creator.username,
            profilePicture: creator.profilePicture,
          }
        : null,
      opponent: opponent
        ? {
            _id: opponent._id,
            name: opponent.name || opponent.username,
            username: opponent.username,
            profilePicture: opponent.profilePicture,
          }
        : null,
      winner: winner
        ? {
            _id: winner._id,
            name: winner.name || winner.username,
            username: winner.username,
          }
        : null,
    };
  },
});

// Get available games to join
export const getAvailableGames = query({
  args: {},
  handler: async (ctx) => {
    const games = await ctx.db
      .query("puzzleGames")
      .withIndex("by_status", (q) => q.eq("status", "waiting"))
      .order("desc")
      .take(20);

    const gamesWithCreators = await Promise.all(
      games.map(async (game) => {
        const creator = await ctx.db.get(game.creatorId);
        return {
          ...game,
          creator: creator
            ? {
                _id: creator._id,
                name: creator.name || creator.username,
                username: creator.username,
                profilePicture: creator.profilePicture,
              }
            : null,
        };
      })
    );

    return gamesWithCreators;
  },
});
