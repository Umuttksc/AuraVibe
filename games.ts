import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import type { Id } from "./_generated/dataModel.d.ts";

// Helper function to check if there's a winner
function checkWinner(board: string[][]): "X" | "O" | "draw" | null {
  // Check rows
  for (let i = 0; i < 3; i++) {
    if (board[i][0] && board[i][0] === board[i][1] && board[i][1] === board[i][2]) {
      return board[i][0] as "X" | "O";
    }
  }
  
  // Check columns
  for (let i = 0; i < 3; i++) {
    if (board[0][i] && board[0][i] === board[1][i] && board[1][i] === board[2][i]) {
      return board[0][i] as "X" | "O";
    }
  }
  
  // Check diagonals
  if (board[0][0] && board[0][0] === board[1][1] && board[1][1] === board[2][2]) {
    return board[0][0] as "X" | "O";
  }
  if (board[0][2] && board[0][2] === board[1][1] && board[1][1] === board[2][0]) {
    return board[0][2] as "X" | "O";
  }
  
  // Check for draw
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
      throw new Error("Giriş yapmalısınız");
    }
    
    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
      .unique();
    
    if (!user) {
      throw new Error("Kullanıcı bulunamadı");
    }
    
    // Create empty 3x3 board
    const emptyBoard: ("" | "X" | "O")[][] = [
      ["", "", ""],
      ["", "", ""],
      ["", "", ""]
    ];
    
    const gameId = await ctx.db.insert("games", {
      gameType: "tictactoe",
      player1Id: user._id,
      invitedUserId: args.invitedUserId,
      currentTurn: "X",
      board: emptyBoard,
      status: "waiting",
    });
    
    // Send notification if a specific user was invited
    if (args.invitedUserId) {
      const invitedUser = args.invitedUserId;
      // Check if notification for this game already exists
      const existingNotification = await ctx.db
        .query("notifications")
        .withIndex("by_user", (q) => q.eq("userId", invitedUser))
        .filter((q) => q.eq(q.field("type"), "game_invite"))
        .collect();
      
      // Only create notification if one doesn't exist for this invite
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
  args: { gameId: v.id("games") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Giriş yapmalısınız");
    }
    
    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
      .unique();
    
    if (!user) {
      throw new Error("Kullanıcı bulunamadı");
    }
    
    const game = await ctx.db.get(args.gameId);
    if (!game) {
      throw new Error("Oyun bulunamadı");
    }
    
    if (game.status !== "waiting") {
      throw new Error("Bu oyun dolu");
    }
    
    if (game.player1Id === user._id) {
      throw new Error("Kendi oyununuza katılamazsınız");
    }
    
    // Check if game is invite-only and user is not the invited one
    if (game.invitedUserId && game.invitedUserId !== user._id) {
      throw new Error("Bu oyuna sadece davet edilen oyuncu katılabilir");
    }
    
    await ctx.db.patch(args.gameId, {
      player2Id: user._id,
      status: "in_progress",
    });
    
    return args.gameId;
  },
});

// Make a move
export const makeMove = mutation({
  args: {
    gameId: v.id("games"),
    row: v.number(),
    col: v.number(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Giriş yapmalısınız");
    }
    
    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
      .unique();
    
    if (!user) {
      throw new Error("Kullanıcı bulunamadı");
    }
    
    const game = await ctx.db.get(args.gameId);
    if (!game) {
      throw new Error("Oyun bulunamadı");
    }
    
    if (game.status !== "in_progress") {
      throw new Error("Oyun devam etmiyor");
    }
    
    // Check if it's player's turn
    const isPlayer1 = game.player1Id === user._id;
    const isPlayer2 = game.player2Id === user._id;
    
    if (!isPlayer1 && !isPlayer2) {
      throw new Error("Bu oyunda değilsiniz");
    }
    
    const playerSymbol = isPlayer1 ? "X" : "O";
    if (game.currentTurn !== playerSymbol) {
      throw new Error("Sıra sizde değil");
    }
    
    // Check if cell is empty
    if (game.board[args.row][args.col] !== "") {
      throw new Error("Bu hücre dolu");
    }
    
    // Make the move
    const newBoard: ("" | "X" | "O")[][] = game.board.map(row => [...row]);
    newBoard[args.row][args.col] = playerSymbol;
    
    // Check for winner
    const result = checkWinner(newBoard);
    
    let updates: {
      board: ("" | "X" | "O")[][];
      currentTurn?: "X" | "O";
      status?: "in_progress" | "completed";
      winnerId?: Id<"users">;
      isDraw?: boolean;
    } = {
      board: newBoard,
    };
    
    if (result === "draw") {
      updates.status = "completed";
      updates.isDraw = true;
    } else if (result === "X" || result === "O") {
      updates.status = "completed";
      updates.winnerId = result === "X" ? game.player1Id : game.player2Id!;
    } else {
      // Continue game, switch turn
      updates.currentTurn = playerSymbol === "X" ? "O" : "X";
    }
    
    await ctx.db.patch(args.gameId, updates);
    
    return { result };
  },
});

// Get a specific game
export const getGame = query({
  args: { gameId: v.id("games") },
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
        profilePictureUrl: player1.profilePicture 
          ? await ctx.storage.getUrl(player1.profilePicture)
          : null,
      } : null,
      player2: player2 ? {
        _id: player2._id,
        name: player2.name,
        username: player2.username,
        profilePictureUrl: player2.profilePicture 
          ? await ctx.storage.getUrl(player2.profilePicture)
          : null,
      } : null,
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
      .query("games")
      .withIndex("by_invited_user", (q) => q.eq("invitedUserId", user._id))
      .filter((q) => q.eq(q.field("status"), "waiting"))
      .take(50);
    
    // Get public games (no specific invitee)
    const publicGames = await ctx.db
      .query("games")
      .withIndex("by_status", (q) => q.eq("status", "waiting"))
      .filter((q) => q.and(
        q.neq(q.field("player1Id"), user._id),
        q.eq(q.field("invitedUserId"), undefined)
      ))
      .take(50);
    
    const allGames = [...invitedGames, ...publicGames];
    
    const gamesWithPlayers = await Promise.all(
      allGames.map(async (game) => {
        const player1 = await ctx.db.get(game.player1Id);
        
        return {
          ...game,
          player1: player1 ? {
            _id: player1._id,
            name: player1.name,
            username: player1.username,
            profilePictureUrl: player1.profilePicture 
              ? await ctx.storage.getUrl(player1.profilePicture)
              : null,
          } : null,
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
      .query("games")
      .withIndex("by_player1", (q) => q.eq("player1Id", user._id))
      .filter((q) => q.or(
        q.eq(q.field("status"), "waiting"),
        q.eq(q.field("status"), "in_progress")
      ))
      .order("desc")
      .take(50);
    
    // Get games where user is player 2
    const gamesAsPlayer2 = await ctx.db
      .query("games")
      .withIndex("by_player2", (q) => q.eq("player2Id", user._id))
      .filter((q) => q.eq(q.field("status"), "in_progress"))
      .order("desc")
      .take(50);
    
    const allGames = [...gamesAsPlayer1, ...gamesAsPlayer2];
    
    const gamesWithPlayers = await Promise.all(
      allGames.map(async (game) => {
        const player1 = await ctx.db.get(game.player1Id);
        const player2 = game.player2Id ? await ctx.db.get(game.player2Id) : null;
        
        return {
          ...game,
          player1: player1 ? {
            _id: player1._id,
            name: player1.name,
            username: player1.username,
            profilePictureUrl: player1.profilePicture 
              ? await ctx.storage.getUrl(player1.profilePicture)
              : null,
          } : null,
          player2: player2 ? {
            _id: player2._id,
            name: player2.name,
            username: player2.username,
            profilePictureUrl: player2.profilePicture 
              ? await ctx.storage.getUrl(player2.profilePicture)
              : null,
          } : null,
        };
      })
    );
    
    return gamesWithPlayers;
  },
});

// Cancel a game (only if waiting for player)
export const cancelGame = mutation({
  args: { gameId: v.id("games") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Giriş yapmalısınız");
    }
    
    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
      .unique();
    
    if (!user) {
      throw new Error("Kullanıcı bulunamadı");
    }
    
    const game = await ctx.db.get(args.gameId);
    if (!game) {
      throw new Error("Oyun bulunamadı");
    }
    
    if (game.player1Id !== user._id) {
      throw new Error("Bu oyunu iptal edemezsiniz");
    }
    
    if (game.status !== "waiting") {
      throw new Error("Sadece bekleyen oyunlar iptal edilebilir");
    }
    
    await ctx.db.patch(args.gameId, {
      status: "cancelled",
    });
  },
});
