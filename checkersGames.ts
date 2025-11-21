import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { ConvexError } from "convex/values";
import type { Id } from "./_generated/dataModel.d.ts";

type Piece = {
  player: "player1" | "player2";
  isKing: boolean;
} | null;

type Board = Piece[][];

// Initialize checkers board (8x8)
function initializeBoard(): Board {
  const board: Board = Array(8).fill(null).map(() => Array(8).fill(null));
  
  // Place player 1 pieces (top, rows 0-2)
  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 8; col++) {
      if ((row + col) % 2 === 1) {
        board[row][col] = { player: "player1", isKing: false };
      }
    }
  }
  
  // Place player 2 pieces (bottom, rows 5-7)
  for (let row = 5; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      if ((row + col) % 2 === 1) {
        board[row][col] = { player: "player2", isKing: false };
      }
    }
  }
  
  return board;
}

// Check if a move is valid
function isValidMove(
  board: Board,
  fromRow: number,
  fromCol: number,
  toRow: number,
  toCol: number,
  player: "player1" | "player2"
): { valid: boolean; isCapture: boolean; capturedRow?: number; capturedCol?: number } {
  // Check bounds
  if (toRow < 0 || toRow >= 8 || toCol < 0 || toCol >= 8) {
    return { valid: false, isCapture: false };
  }
  
  // Check if destination is empty
  if (board[toRow][toCol] !== null) {
    return { valid: false, isCapture: false };
  }
  
  const piece = board[fromRow][fromCol];
  if (!piece || piece.player !== player) {
    return { valid: false, isCapture: false };
  }
  
  const rowDiff = toRow - fromRow;
  const colDiff = Math.abs(toCol - fromCol);
  
  // Normal move (1 diagonal)
  if (Math.abs(rowDiff) === 1 && colDiff === 1) {
    // Check direction based on player and king status
    if (piece.isKing) {
      return { valid: true, isCapture: false };
    } else if (player === "player1" && rowDiff > 0) {
      return { valid: true, isCapture: false };
    } else if (player === "player2" && rowDiff < 0) {
      return { valid: true, isCapture: false };
    }
    return { valid: false, isCapture: false };
  }
  
  // Capture move (2 diagonals, jumping over opponent)
  if (Math.abs(rowDiff) === 2 && colDiff === 2) {
    const midRow = (fromRow + toRow) / 2;
    const midCol = (fromCol + toCol) / 2;
    const middlePiece = board[midRow][midCol];
    
    if (middlePiece && middlePiece.player !== player) {
      // Check direction for non-kings
      if (piece.isKing) {
        return { valid: true, isCapture: true, capturedRow: midRow, capturedCol: midCol };
      } else if (player === "player1" && rowDiff > 0) {
        return { valid: true, isCapture: true, capturedRow: midRow, capturedCol: midCol };
      } else if (player === "player2" && rowDiff < 0) {
        return { valid: true, isCapture: true, capturedRow: midRow, capturedCol: midCol };
      }
    }
  }
  
  return { valid: false, isCapture: false };
}

// Check if there are any capture moves available
function hasCaptureAvailable(board: Board, player: "player1" | "player2"): boolean {
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const piece = board[row][col];
      if (piece && piece.player === player) {
        // Check all possible capture directions
        const directions = [
          [2, 2], [2, -2], [-2, 2], [-2, -2]
        ];
        
        for (const [dRow, dCol] of directions) {
          const newRow = row + dRow;
          const newCol = col + dCol;
          const moveCheck = isValidMove(board, row, col, newRow, newCol, player);
          if (moveCheck.valid && moveCheck.isCapture) {
            return true;
          }
        }
      }
    }
  }
  return false;
}

// Check if game is over
function checkGameOver(board: Board): { isOver: boolean; winner?: "player1" | "player2" } {
  let player1Count = 0;
  let player2Count = 0;
  
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const piece = board[row][col];
      if (piece) {
        if (piece.player === "player1") player1Count++;
        else player2Count++;
      }
    }
  }
  
  if (player1Count === 0) {
    return { isOver: true, winner: "player2" };
  }
  if (player2Count === 0) {
    return { isOver: true, winner: "player1" };
  }
  
  return { isOver: false };
}

// Create a new checkers game
export const createGame = mutation({
  args: {
    invitedUserId: v.optional(v.id("users")),
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

    const gameId = await ctx.db.insert("checkersGames", {
      player1Id: user._id,
      invitedUserId: args.invitedUserId,
      currentTurn: "player1",
      board: initializeBoard(),
      status: args.invitedUserId ? "waiting" : "waiting",
      timeStarted: Date.now(),
    });

    // Send notification if invited
    if (args.invitedUserId) {
      await ctx.db.insert("notifications", {
        userId: args.invitedUserId,
        type: "game_invite",
        actorId: user._id,
        message: `${user.name || user.username || "Bir kullanıcı"} seni Dama oyununa davet etti!`,
        isRead: false,
      });
    }

    return gameId;
  },
});

// Join a game
export const joinGame = mutation({
  args: {
    gameId: v.id("checkersGames"),
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

    if (game.status !== "waiting") {
      throw new ConvexError({
        message: "Bu oyuna katılamazsınız",
        code: "BAD_REQUEST",
      });
    }

    if (game.player1Id === user._id) {
      throw new ConvexError({
        message: "Kendi oyununuza katılamazsınız",
        code: "BAD_REQUEST",
      });
    }

    // Check if game has invited user restriction
    if (game.invitedUserId && game.invitedUserId !== user._id) {
      throw new ConvexError({
        message: "Bu oyun sadece davet edilen kullanıcı içindir",
        code: "FORBIDDEN",
      });
    }

    await ctx.db.patch(args.gameId, {
      player2Id: user._id,
      status: "in_progress",
    });

    return { success: true };
  },
});

// Make a move
export const makeMove = mutation({
  args: {
    gameId: v.id("checkersGames"),
    fromRow: v.number(),
    fromCol: v.number(),
    toRow: v.number(),
    toCol: v.number(),
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

    if (game.status !== "in_progress") {
      throw new ConvexError({
        message: "Oyun devam etmiyor",
        code: "BAD_REQUEST",
      });
    }

    // Determine current player
    const currentPlayer = game.player1Id === user._id ? "player1" : 
                         game.player2Id === user._id ? "player2" : null;

    if (!currentPlayer) {
      throw new ConvexError({
        message: "Bu oyunda değilsiniz",
        code: "FORBIDDEN",
      });
    }

    if (game.currentTurn !== currentPlayer) {
      throw new ConvexError({
        message: "Şu an sizin sıranız değil",
        code: "BAD_REQUEST",
      });
    }

    // Validate and execute move
    const moveResult = isValidMove(
      game.board,
      args.fromRow,
      args.fromCol,
      args.toRow,
      args.toCol,
      currentPlayer
    );

    if (!moveResult.valid) {
      throw new ConvexError({
        message: "Geçersiz hamle",
        code: "BAD_REQUEST",
      });
    }

    // Check if capture is mandatory
    const captureAvailable = hasCaptureAvailable(game.board, currentPlayer);
    if (captureAvailable && !moveResult.isCapture) {
      throw new ConvexError({
        message: "Zorunlu yeme hamlesi var",
        code: "BAD_REQUEST",
      });
    }

    // Make the move
    const newBoard: Board = game.board.map(row => [...row]);
    const piece = newBoard[args.fromRow][args.fromCol];
    
    if (!piece) {
      throw new ConvexError({
        message: "Seçilen pozisyonda taş yok",
        code: "BAD_REQUEST",
      });
    }

    // Move piece
    newBoard[args.toRow][args.toCol] = { ...piece };
    newBoard[args.fromRow][args.fromCol] = null;

    // Remove captured piece
    if (moveResult.isCapture && moveResult.capturedRow !== undefined && moveResult.capturedCol !== undefined) {
      newBoard[moveResult.capturedRow][moveResult.capturedCol] = null;
    }

    // Promote to king if reached opposite end
    if ((currentPlayer === "player1" && args.toRow === 7) ||
        (currentPlayer === "player2" && args.toRow === 0)) {
      newBoard[args.toRow][args.toCol] = { ...piece, isKing: true };
    }

    // Check if game is over
    const gameOverResult = checkGameOver(newBoard);

    const updates: {
      board: Board;
      currentTurn: "player1" | "player2";
      status?: "completed";
      winnerId?: Id<"users">;
      timeCompleted?: number;
    } = {
      board: newBoard,
      currentTurn: currentPlayer === "player1" ? "player2" : "player1",
    };

    if (gameOverResult.isOver) {
      updates.status = "completed";
      updates.winnerId = gameOverResult.winner === "player1" ? game.player1Id : game.player2Id;
      updates.timeCompleted = Date.now();
    }

    await ctx.db.patch(args.gameId, updates);

    return {
      success: true,
      isGameOver: gameOverResult.isOver,
      winner: gameOverResult.winner,
    };
  },
});

// Get game
export const getGame = query({
  args: { gameId: v.id("checkersGames") },
  handler: async (ctx, args) => {
    const game = await ctx.db.get(args.gameId);
    if (!game) {
      return null;
    }

    const player1 = await ctx.db.get(game.player1Id);
    const player2 = game.player2Id ? await ctx.db.get(game.player2Id) : null;

    return {
      ...game,
      player1: player1 ? {
        _id: player1._id,
        name: player1.name,
        username: player1.username,
        profilePicture: player1.profilePicture,
      } : null,
      player2: player2 ? {
        _id: player2._id,
        name: player2.name,
        username: player2.username,
        profilePicture: player2.profilePicture,
      } : null,
    };
  },
});

// Get available games (waiting for players)
export const getAvailableGames = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return [];
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
      .unique();

    if (!user) {
      return [];
    }

    const games = await ctx.db
      .query("checkersGames")
      .withIndex("by_status", (q) => q.eq("status", "waiting"))
      .order("desc")
      .take(50);

    const gamesWithPlayers = await Promise.all(
      games.map(async (game) => {
        const player1 = await ctx.db.get(game.player1Id);
        
        // Only show invited games if user is invited, or public games
        if (game.invitedUserId && game.invitedUserId !== user._id) {
          return null;
        }

        return {
          ...game,
          player1: player1 ? {
            _id: player1._id,
            name: player1.name,
            username: player1.username,
            profilePicture: player1.profilePicture,
          } : null,
          isInvited: game.invitedUserId === user._id,
        };
      })
    );

    return gamesWithPlayers.filter(g => g !== null);
  },
});

// Get player's games
export const getPlayerGames = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return { asPlayer1: [], asPlayer2: [] };
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
      .unique();

    if (!user) {
      return { asPlayer1: [], asPlayer2: [] };
    }

    const asPlayer1 = await ctx.db
      .query("checkersGames")
      .withIndex("by_player1", (q) => q.eq("player1Id", user._id))
      .order("desc")
      .take(50);

    const asPlayer2 = await ctx.db
      .query("checkersGames")
      .withIndex("by_player2", (q) => q.eq("player2Id", user._id))
      .order("desc")
      .take(50);

    return { asPlayer1, asPlayer2 };
  },
});

// Cancel game
export const cancelGame = mutation({
  args: {
    gameId: v.id("checkersGames"),
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

    if (game.player1Id !== user._id) {
      throw new ConvexError({
        message: "Sadece oyunu oluşturan oyuncu iptal edebilir",
        code: "FORBIDDEN",
      });
    }

    if (game.status !== "waiting") {
      throw new ConvexError({
        message: "Sadece beklemede olan oyunlar iptal edilebilir",
        code: "BAD_REQUEST",
      });
    }

    await ctx.db.patch(args.gameId, {
      status: "cancelled",
    });

    return { success: true };
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

    const asPlayer1 = await ctx.db
      .query("checkersGames")
      .withIndex("by_player1", (q) => q.eq("player1Id", user._id))
      .collect();

    const asPlayer2 = await ctx.db
      .query("checkersGames")
      .withIndex("by_player2", (q) => q.eq("player2Id", user._id))
      .collect();

    const allGames = [...asPlayer1, ...asPlayer2];
    const completedGames = allGames.filter(g => g.status === "completed");
    const wins = completedGames.filter(g => g.winnerId === user._id).length;

    return {
      totalGames: completedGames.length,
      wins,
      losses: completedGames.length - wins,
      winRate: completedGames.length > 0 ? Math.round((wins / completedGames.length) * 100) : 0,
    };
  },
});
