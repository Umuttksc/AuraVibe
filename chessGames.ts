import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { ConvexError } from "convex/values";
import type { Id } from "./_generated/dataModel.d.ts";

// Helper function to initialize chess board
function initializeChessBoard() {
  const board: Array<Array<null | {
    type: "pawn" | "rook" | "knight" | "bishop" | "queen" | "king";
    color: "white" | "black";
    hasMoved: boolean;
  }>> = Array(8).fill(null).map(() => Array(8).fill(null));

  // Black pieces (top)
  board[0][0] = { type: "rook", color: "black", hasMoved: false };
  board[0][1] = { type: "knight", color: "black", hasMoved: false };
  board[0][2] = { type: "bishop", color: "black", hasMoved: false };
  board[0][3] = { type: "queen", color: "black", hasMoved: false };
  board[0][4] = { type: "king", color: "black", hasMoved: false };
  board[0][5] = { type: "bishop", color: "black", hasMoved: false };
  board[0][6] = { type: "knight", color: "black", hasMoved: false };
  board[0][7] = { type: "rook", color: "black", hasMoved: false };
  
  // Black pawns
  for (let col = 0; col < 8; col++) {
    board[1][col] = { type: "pawn", color: "black", hasMoved: false };
  }

  // White pawns
  for (let col = 0; col < 8; col++) {
    board[6][col] = { type: "pawn", color: "white", hasMoved: false };
  }

  // White pieces (bottom)
  board[7][0] = { type: "rook", color: "white", hasMoved: false };
  board[7][1] = { type: "knight", color: "white", hasMoved: false };
  board[7][2] = { type: "bishop", color: "white", hasMoved: false };
  board[7][3] = { type: "queen", color: "white", hasMoved: false };
  board[7][4] = { type: "king", color: "white", hasMoved: false };
  board[7][5] = { type: "bishop", color: "white", hasMoved: false };
  board[7][6] = { type: "knight", color: "white", hasMoved: false };
  board[7][7] = { type: "rook", color: "white", hasMoved: false };

  return board;
}

// Check if a move is valid for a piece
function isValidMove(
  board: Array<Array<null | { type: string; color: string; hasMoved: boolean }>>,
  fromRow: number,
  fromCol: number,
  toRow: number,
  toCol: number
): boolean {
  const piece = board[fromRow][fromCol];
  if (!piece) return false;

  const targetPiece = board[toRow][toCol];
  
  // Can't capture own piece
  if (targetPiece && targetPiece.color === piece.color) return false;

  const rowDiff = toRow - fromRow;
  const colDiff = toCol - fromCol;
  const absRowDiff = Math.abs(rowDiff);
  const absColDiff = Math.abs(colDiff);

  switch (piece.type) {
    case "pawn": {
      const direction = piece.color === "white" ? -1 : 1;
      
      // Forward move
      if (colDiff === 0 && !targetPiece) {
        if (rowDiff === direction) return true;
        // Double move from start
        if (!piece.hasMoved && rowDiff === 2 * direction) {
          const middleRow = fromRow + direction;
          if (!board[middleRow][fromCol]) return true;
        }
      }
      
      // Diagonal capture
      if (absColDiff === 1 && rowDiff === direction && targetPiece) {
        return true;
      }
      return false;
    }

    case "rook":
      if (rowDiff === 0 || colDiff === 0) {
        return isPathClear(board, fromRow, fromCol, toRow, toCol);
      }
      return false;

    case "knight":
      return (absRowDiff === 2 && absColDiff === 1) || (absRowDiff === 1 && absColDiff === 2);

    case "bishop":
      if (absRowDiff === absColDiff) {
        return isPathClear(board, fromRow, fromCol, toRow, toCol);
      }
      return false;

    case "queen":
      if (rowDiff === 0 || colDiff === 0 || absRowDiff === absColDiff) {
        return isPathClear(board, fromRow, fromCol, toRow, toCol);
      }
      return false;

    case "king":
      return absRowDiff <= 1 && absColDiff <= 1;

    default:
      return false;
  }
}

// Check if path is clear between two points (for rook, bishop, queen)
function isPathClear(
  board: Array<Array<null | { type: string; color: string; hasMoved: boolean }>>,
  fromRow: number,
  fromCol: number,
  toRow: number,
  toCol: number
): boolean {
  const rowStep = toRow > fromRow ? 1 : toRow < fromRow ? -1 : 0;
  const colStep = toCol > fromCol ? 1 : toCol < fromCol ? -1 : 0;

  let currentRow = fromRow + rowStep;
  let currentCol = fromCol + colStep;

  while (currentRow !== toRow || currentCol !== toCol) {
    if (board[currentRow][currentCol] !== null) return false;
    currentRow += rowStep;
    currentCol += colStep;
  }

  return true;
}

// Find king position
function findKing(
  board: Array<Array<null | { type: string; color: string; hasMoved: boolean }>>,
  color: "white" | "black"
): { row: number; col: number } | null {
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const piece = board[row][col];
      if (piece && piece.type === "king" && piece.color === color) {
        return { row, col };
      }
    }
  }
  return null;
}

// Check if a position is under attack
function isUnderAttack(
  board: Array<Array<null | { type: string; color: string; hasMoved: boolean }>>,
  row: number,
  col: number,
  byColor: "white" | "black"
): boolean {
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const piece = board[r][c];
      if (piece && piece.color === byColor) {
        if (isValidMove(board, r, c, row, col)) {
          return true;
        }
      }
    }
  }
  return false;
}

// Check if king is in check
function isInCheck(
  board: Array<Array<null | { type: string; color: string; hasMoved: boolean }>>,
  color: "white" | "black"
): boolean {
  const kingPos = findKing(board, color);
  if (!kingPos) return false;
  
  const opponentColor = color === "white" ? "black" : "white";
  return isUnderAttack(board, kingPos.row, kingPos.col, opponentColor);
}

// Check if it's checkmate
function isCheckmatePosition(
  board: Array<Array<null | { type: string; color: string; hasMoved: boolean }>>,
  color: "white" | "black"
): boolean {
  if (!isInCheck(board, color)) return false;

  // Try all possible moves to see if king can escape
  for (let fromRow = 0; fromRow < 8; fromRow++) {
    for (let fromCol = 0; fromCol < 8; fromCol++) {
      const piece = board[fromRow][fromCol];
      if (!piece || piece.color !== color) continue;

      for (let toRow = 0; toRow < 8; toRow++) {
        for (let toCol = 0; toCol < 8; toCol++) {
          if (isValidMove(board, fromRow, fromCol, toRow, toCol)) {
            // Simulate move
            const targetPiece = board[toRow][toCol];
            board[toRow][toCol] = piece;
            board[fromRow][fromCol] = null;

            const stillInCheck = isInCheck(board, color);

            // Undo move
            board[fromRow][fromCol] = piece;
            board[toRow][toCol] = targetPiece;

            if (!stillInCheck) return false;
          }
        }
      }
    }
  }

  return true;
}

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

    const gameId = await ctx.db.insert("chessGames", {
      player1Id: user._id,
      player2Id: undefined,
      invitedUserId: args.invitedUserId,
      currentTurn: "white",
      board: initializeChessBoard(),
      moveHistory: [],
      isCheck: false,
      isCheckmate: false,
      status: "waiting",
      timeStarted: Date.now(),
    });

    // Send notification if specific user invited
    if (args.invitedUserId) {
      await ctx.db.insert("notifications", {
        userId: args.invitedUserId,
        type: "game_invite",
        actorId: user._id,
        isRead: false,
        message: `${user.name || user.username || "Bir kullanıcı"} sizi satranç oyununa davet etti`,
      });
    }

    return gameId;
  },
});

export const joinGame = mutation({
  args: {
    gameId: v.id("chessGames"),
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
        message: "Bu oyun zaten başladı",
        code: "BAD_REQUEST",
      });
    }

    if (game.player1Id === user._id) {
      throw new ConvexError({
        message: "Kendi oyununuza katılamazsınız",
        code: "BAD_REQUEST",
      });
    }

    // Check if game is invite-only and user is not invited
    if (game.invitedUserId && game.invitedUserId !== user._id) {
      throw new ConvexError({
        message: "Bu oyuna sadece davetli kullanıcılar katılabilir",
        code: "FORBIDDEN",
      });
    }

    await ctx.db.patch(args.gameId, {
      player2Id: user._id,
      status: "in_progress",
    });

    return args.gameId;
  },
});

export const makeMove = mutation({
  args: {
    gameId: v.id("chessGames"),
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

    // Check if it's player's turn
    const isPlayer1 = user._id === game.player1Id;
    const isPlayer2 = user._id === game.player2Id;
    
    if (!isPlayer1 && !isPlayer2) {
      throw new ConvexError({
        message: "Bu oyunda oynamamaktasınız",
        code: "FORBIDDEN",
      });
    }

    const playerColor = isPlayer1 ? "white" : "black";
    if (game.currentTurn !== playerColor) {
      throw new ConvexError({
        message: "Sizin sıranız değil",
        code: "BAD_REQUEST",
      });
    }

    // Validate move
    const board = game.board;
    const piece = board[args.fromRow][args.fromCol];
    
    if (!piece) {
      throw new ConvexError({
        message: "Bu konumda taş yok",
        code: "BAD_REQUEST",
      });
    }

    if (piece.color !== playerColor) {
      throw new ConvexError({
        message: "Bu taş size ait değil",
        code: "BAD_REQUEST",
      });
    }

    if (!isValidMove(board, args.fromRow, args.fromCol, args.toRow, args.toCol)) {
      throw new ConvexError({
        message: "Geçersiz hamle",
        code: "BAD_REQUEST",
      });
    }

    // Make the move
    const capturedPiece = board[args.toRow][args.toCol];
    board[args.toRow][args.toCol] = { ...piece, hasMoved: true };
    board[args.fromRow][args.fromCol] = null;

    // Check if move puts own king in check (illegal)
    if (isInCheck(board, playerColor)) {
      throw new ConvexError({
        message: "Bu hamle şahınızı tehlikeye atıyor",
        code: "BAD_REQUEST",
      });
    }

    const opponentColor = playerColor === "white" ? "black" : "white";
    const isCheck = isInCheck(board, opponentColor);
    const isCheckmate = isCheck && isCheckmatePosition(board, opponentColor);

    // Add to move history
    const moveHistory = [...game.moveHistory, {
      from: { row: args.fromRow, col: args.fromCol },
      to: { row: args.toRow, col: args.toCol },
      piece: piece.type,
      captured: capturedPiece ? capturedPiece.type : undefined,
      isCheck,
      isCheckmate,
    }];

    // Update game
    const updates: Record<string, unknown> = {
      board,
      moveHistory,
      currentTurn: opponentColor,
      isCheck,
      isCheckmate,
    };

    if (isCheckmate) {
      updates.status = "completed";
      updates.winnerId = user._id;
      updates.timeCompleted = Date.now();
    }

    await ctx.db.patch(args.gameId, updates);

    return { isCheck, isCheckmate };
  },
});

export const getGame = query({
  args: { gameId: v.id("chessGames") },
  handler: async (ctx, args) => {
    const game = await ctx.db.get(args.gameId);
    if (!game) return null;

    const player1 = await ctx.db.get(game.player1Id);
    const player2 = game.player2Id ? await ctx.db.get(game.player2Id) : null;

    return {
      ...game,
      player1,
      player2,
    };
  },
});

export const getActiveGames = query({
  args: {},
  handler: async (ctx) => {
    const games = await ctx.db
      .query("chessGames")
      .withIndex("by_status", (q) => q.eq("status", "waiting"))
      .order("desc")
      .take(50);

    const gamesWithPlayers = await Promise.all(
      games.map(async (game) => {
        const player1 = await ctx.db.get(game.player1Id);
        
        return {
          ...game,
          player1,
        };
      })
    );

    return gamesWithPlayers;
  },
});

export const getMyGames = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
      .unique();

    if (!user) return [];

    const asPlayer1 = await ctx.db
      .query("chessGames")
      .withIndex("by_player1", (q) => q.eq("player1Id", user._id))
      .order("desc")
      .take(25);

    const asPlayer2 = await ctx.db
      .query("chessGames")
      .withIndex("by_player2", (q) => q.eq("player2Id", user._id))
      .order("desc")
      .take(25);

    const allGames = [...asPlayer1, ...asPlayer2].sort(
      (a, b) => b._creationTime - a._creationTime
    );

    const gamesWithPlayers = await Promise.all(
      allGames.slice(0, 50).map(async (game) => {
        const player1 = await ctx.db.get(game.player1Id);
        const player2 = game.player2Id ? await ctx.db.get(game.player2Id) : null;

        return {
          ...game,
          player1,
          player2,
        };
      })
    );

    return gamesWithPlayers;
  },
});

export const cancelGame = mutation({
  args: { gameId: v.id("chessGames") },
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

    if (game.player1Id !== user._id && game.player2Id !== user._id) {
      throw new ConvexError({
        message: "Bu oyunu iptal etme yetkiniz yok",
        code: "FORBIDDEN",
      });
    }

    await ctx.db.patch(args.gameId, {
      status: "cancelled",
      timeCompleted: Date.now(),
    });
  },
});
