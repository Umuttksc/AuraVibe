import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { ConvexError } from "convex/values";
import type { Id } from "./_generated/dataModel.d.ts";

// Helper function to check if there's a winner
function checkWinner(board: string[][]): "red" | "yellow" | "draw" | null {
  const ROWS = 6;
  const COLS = 7;

  // Check horizontal
  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < COLS - 3; col++) {
      if (
        board[row][col] &&
        board[row][col] === board[row][col + 1] &&
        board[row][col] === board[row][col + 2] &&
        board[row][col] === board[row][col + 3]
      ) {
        return board[row][col] as "red" | "yellow";
      }
    }
  }

  // Check vertical
  for (let col = 0; col < COLS; col++) {
    for (let row = 0; row < ROWS - 3; row++) {
      if (
        board[row][col] &&
        board[row][col] === board[row + 1][col] &&
        board[row][col] === board[row + 2][col] &&
        board[row][col] === board[row + 3][col]
      ) {
        return board[row][col] as "red" | "yellow";
      }
    }
  }

  // Check diagonal (down-right)
  for (let row = 0; row < ROWS - 3; row++) {
    for (let col = 0; col < COLS - 3; col++) {
      if (
        board[row][col] &&
        board[row][col] === board[row + 1][col + 1] &&
        board[row][col] === board[row + 2][col + 2] &&
        board[row][col] === board[row + 3][col + 3]
      ) {
        return board[row][col] as "red" | "yellow";
      }
    }
  }

  // Check diagonal (up-right)
  for (let row = 3; row < ROWS; row++) {
    for (let col = 0; col < COLS - 3; col++) {
      if (
        board[row][col] &&
        board[row][col] === board[row - 1][col + 1] &&
        board[row][col] === board[row - 2][col + 2] &&
        board[row][col] === board[row - 3][col + 3]
      ) {
        return board[row][col] as "red" | "yellow";
      }
    }
  }

  // Check for draw (board is full)
  const isFull = board.every(row => row.every(cell => cell !== ""));
  if (isFull) {
    return "draw";
  }

  return null;
}

// Create a new game
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

    // Create empty 6x7 board
    const emptyBoard: ("" | "red" | "yellow")[][] = Array(6)
      .fill(null)
      .map(() => Array(7).fill(""));

    const gameId = await ctx.db.insert("connectFourGames", {
      player1Id: user._id,
      invitedUserId: args.invitedUserId,
      currentTurn: "red",
      board: emptyBoard,
      status: "waiting",
    });

    // Send notification if a specific user was invited
    if (args.invitedUserId) {
      const invitedUser = args.invitedUserId;
      const existingNotification = await ctx.db
        .query("notifications")
        .withIndex("by_user", (q) => q.eq("userId", invitedUser))
        .filter((q) => q.eq(q.field("type"), "game_invite"))
        .collect();

      if (!existingNotification.length) {
        await ctx.db.insert("notifications", {
          userId: invitedUser,
          type: "game_invite",
          actorId: user._id,
          isRead: false,
        });
      }
    }

    return gameId;
  },
});

// Join an existing game
export const joinGame = mutation({
  args: { gameId: v.id("connectFourGames") },
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
        message: "Bu oyun dolu",
        code: "BAD_REQUEST",
      });
    }

    if (game.player1Id === user._id) {
      throw new ConvexError({
        message: "Kendi oyununuza katılamazsınız",
        code: "BAD_REQUEST",
      });
    }

    // Check if game is invite-only and user is not the invited one
    if (game.invitedUserId && game.invitedUserId !== user._id) {
      throw new ConvexError({
        message: "Bu oyuna sadece davet edilen oyuncu katılabilir",
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

// Make a move (drop a disc in a column)
export const makeMove = mutation({
  args: {
    gameId: v.id("connectFourGames"),
    col: v.number(),
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
    const isPlayer1 = game.player1Id === user._id;
    const isPlayer2 = game.player2Id === user._id;

    if (!isPlayer1 && !isPlayer2) {
      throw new ConvexError({
        message: "Bu oyunda değilsiniz",
        code: "FORBIDDEN",
      });
    }

    const playerColor = isPlayer1 ? "red" : "yellow";
    if (game.currentTurn !== playerColor) {
      throw new ConvexError({
        message: "Sıra sizde değil",
        code: "BAD_REQUEST",
      });
    }

    // Check if column is valid
    if (args.col < 0 || args.col >= 7) {
      throw new ConvexError({
        message: "Geçersiz sütun",
        code: "BAD_REQUEST",
      });
    }

    // Find the lowest empty row in the column
    let targetRow = -1;
    for (let row = 5; row >= 0; row--) {
      if (game.board[row][args.col] === "") {
        targetRow = row;
        break;
      }
    }

    if (targetRow === -1) {
      throw new ConvexError({
        message: "Bu sütun dolu",
        code: "BAD_REQUEST",
      });
    }

    // Make the move
    const newBoard: ("" | "red" | "yellow")[][] = game.board.map(row => [...row]);
    newBoard[targetRow][args.col] = playerColor;

    // Check for winner
    const result = checkWinner(newBoard);

    let updates: {
      board: ("" | "red" | "yellow")[][];
      currentTurn?: "red" | "yellow";
      status?: "in_progress" | "completed";
      winnerId?: Id<"users">;
      isDraw?: boolean;
    } = {
      board: newBoard,
    };

    if (result === "draw") {
      updates.status = "completed";
      updates.isDraw = true;
    } else if (result === "red" || result === "yellow") {
      updates.status = "completed";
      updates.winnerId = result === "red" ? game.player1Id : game.player2Id!;
    } else {
      // Continue game, switch turn
      updates.currentTurn = playerColor === "red" ? "yellow" : "red";
    }

    await ctx.db.patch(args.gameId, updates);

    return { result, row: targetRow };
  },
});

// Get a specific game
export const getGame = query({
  args: { gameId: v.id("connectFourGames") },
  handler: async (ctx, args) => {
    const game = await ctx.db.get(args.gameId);
    if (!game) {
      return null;
    }

    const player1 = await ctx.db.get(game.player1Id);
    const player2 = game.player2Id ? await ctx.db.get(game.player2Id) : null;

    return {
      ...game,
      player1: player1
        ? {
            _id: player1._id,
            name: player1.name,
            username: player1.username,
            profilePictureUrl: player1.profilePicture
              ? await ctx.storage.getUrl(player1.profilePicture)
              : null,
          }
        : null,
      player2: player2
        ? {
            _id: player2._id,
            name: player2.name,
            username: player2.username,
            profilePictureUrl: player2.profilePicture
              ? await ctx.storage.getUrl(player2.profilePicture)
              : null,
          }
        : null,
    };
  },
});

// Get available games (waiting for player 2)
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

    // Get games where user is specifically invited
    const invitedGames = await ctx.db
      .query("connectFourGames")
      .withIndex("by_invited_user", (q) => q.eq("invitedUserId", user._id))
      .filter((q) => q.eq(q.field("status"), "waiting"))
      .take(50);

    // Get public games (no specific invitee)
    const publicGames = await ctx.db
      .query("connectFourGames")
      .withIndex("by_status", (q) => q.eq("status", "waiting"))
      .filter((q) =>
        q.and(q.neq(q.field("player1Id"), user._id), q.eq(q.field("invitedUserId"), undefined))
      )
      .take(50);

    const allGames = [...invitedGames, ...publicGames];

    const gamesWithPlayers = await Promise.all(
      allGames.map(async game => {
        const player1 = await ctx.db.get(game.player1Id);

        return {
          ...game,
          player1: player1
            ? {
                _id: player1._id,
                name: player1.name,
                username: player1.username,
                profilePictureUrl: player1.profilePicture
                  ? await ctx.storage.getUrl(player1.profilePicture)
                  : null,
              }
            : null,
        };
      })
    );

    return gamesWithPlayers;
  },
});

// Get user's active games
export const getMyGames = query({
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

    // Get games where user is player 1
    const gamesAsPlayer1 = await ctx.db
      .query("connectFourGames")
      .withIndex("by_player1", (q) => q.eq("player1Id", user._id))
      .filter((q) =>
        q.or(q.eq(q.field("status"), "waiting"), q.eq(q.field("status"), "in_progress"))
      )
      .order("desc")
      .take(50);

    // Get games where user is player 2
    const gamesAsPlayer2 = await ctx.db
      .query("connectFourGames")
      .withIndex("by_player2", (q) => q.eq("player2Id", user._id))
      .filter((q) => q.eq(q.field("status"), "in_progress"))
      .order("desc")
      .take(50);

    const allGames = [...gamesAsPlayer1, ...gamesAsPlayer2];

    const gamesWithPlayers = await Promise.all(
      allGames.map(async game => {
        const player1 = await ctx.db.get(game.player1Id);
        const player2 = game.player2Id ? await ctx.db.get(game.player2Id) : null;

        return {
          ...game,
          player1: player1
            ? {
                _id: player1._id,
                name: player1.name,
                username: player1.username,
                profilePictureUrl: player1.profilePicture
                  ? await ctx.storage.getUrl(player1.profilePicture)
                  : null,
              }
            : null,
          player2: player2
            ? {
                _id: player2._id,
                name: player2.name,
                username: player2.username,
                profilePictureUrl: player2.profilePicture
                  ? await ctx.storage.getUrl(player2.profilePicture)
                  : null,
              }
            : null,
        };
      })
    );

    return gamesWithPlayers;
  },
});

// Cancel a game (only if waiting for player)
export const cancelGame = mutation({
  args: { gameId: v.id("connectFourGames") },
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
        message: "Bu oyunu iptal edemezsiniz",
        code: "FORBIDDEN",
      });
    }

    if (game.status !== "waiting") {
      throw new ConvexError({
        message: "Sadece bekleyen oyunlar iptal edilebilir",
        code: "BAD_REQUEST",
      });
    }

    await ctx.db.patch(args.gameId, {
      status: "cancelled",
    });
  },
});
