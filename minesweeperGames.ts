import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { ConvexError } from "convex/values";

type Cell = {
  isMine: boolean;
  isRevealed: boolean;
  isFlagged: boolean;
  adjacentMines: number;
};

// Generate a Minesweeper board
function generateBoard(rows: number, cols: number, mineCount: number): Cell[][] {
  const board: Cell[][] = Array(rows)
    .fill(null)
    .map(() =>
      Array(cols)
        .fill(null)
        .map(() => ({
          isMine: false,
          isRevealed: false,
          isFlagged: false,
          adjacentMines: 0,
        }))
    );

  // Place mines randomly
  let minesPlaced = 0;
  while (minesPlaced < mineCount) {
    const row = Math.floor(Math.random() * rows);
    const col = Math.floor(Math.random() * cols);
    if (!board[row][col].isMine) {
      board[row][col].isMine = true;
      minesPlaced++;
    }
  }

  // Calculate adjacent mines
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      if (!board[row][col].isMine) {
        board[row][col].adjacentMines = countAdjacentMines(board, row, col);
      }
    }
  }

  return board;
}

function countAdjacentMines(board: Cell[][], row: number, col: number): number {
  let count = 0;
  const rows = board.length;
  const cols = board[0].length;

  for (let dr = -1; dr <= 1; dr++) {
    for (let dc = -1; dc <= 1; dc++) {
      if (dr === 0 && dc === 0) continue;
      const newRow = row + dr;
      const newCol = col + dc;
      if (newRow >= 0 && newRow < rows && newCol >= 0 && newCol < cols) {
        if (board[newRow][newCol].isMine) count++;
      }
    }
  }

  return count;
}

// Create a new Minesweeper game
export const createGame = mutation({
  args: {
    difficulty: v.union(v.literal("easy"), v.literal("medium"), v.literal("hard")),
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

    // Determine board size based on difficulty
    const config =
      args.difficulty === "easy"
        ? { rows: 9, cols: 9, mines: 10 }
        : args.difficulty === "medium"
        ? { rows: 16, cols: 16, mines: 40 }
        : { rows: 16, cols: 30, mines: 99 };

    const board = generateBoard(config.rows, config.cols, config.mines);

    const gameId = await ctx.db.insert("minesweeperGames", {
      playerId: user._id,
      difficulty: args.difficulty,
      rows: config.rows,
      cols: config.cols,
      mineCount: config.mines,
      board,
      timeStarted: Date.now(),
      status: "in_progress",
    });

    return gameId;
  },
});

// Reveal a cell
export const revealCell = mutation({
  args: {
    gameId: v.id("minesweeperGames"),
    row: v.number(),
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

    const newBoard = game.board.map(row => row.map(cell => ({ ...cell })));
    const cell = newBoard[args.row][args.col];

    if (cell.isRevealed || cell.isFlagged) {
      throw new ConvexError({
        message: "Bu hücre zaten açık veya işaretli",
        code: "BAD_REQUEST",
      });
    }

    // Reveal the cell
    revealCellRecursive(newBoard, args.row, args.col);

    // Check if hit a mine
    if (cell.isMine) {
      // Game over - reveal all mines
      for (let r = 0; r < game.rows; r++) {
        for (let c = 0; c < game.cols; c++) {
          if (newBoard[r][c].isMine) {
            newBoard[r][c].isRevealed = true;
          }
        }
      }

      await ctx.db.patch(args.gameId, {
        board: newBoard,
        status: "failed",
        timeCompleted: Date.now(),
      });

      return { hitMine: true, isCompleted: false };
    }

    // Check if won
    const isCompleted = checkWin(newBoard, game.mineCount);

    const updates: {
      board: Cell[][];
      status?: "completed";
      timeCompleted?: number;
    } = {
      board: newBoard,
    };

    if (isCompleted) {
      updates.status = "completed";
      updates.timeCompleted = Date.now();
    }

    await ctx.db.patch(args.gameId, updates);

    return { hitMine: false, isCompleted };
  },
});

function revealCellRecursive(board: Cell[][], row: number, col: number) {
  const rows = board.length;
  const cols = board[0].length;

  if (row < 0 || row >= rows || col < 0 || col >= cols) return;
  if (board[row][col].isRevealed || board[row][col].isFlagged || board[row][col].isMine) return;

  board[row][col].isRevealed = true;

  // If no adjacent mines, reveal neighbors recursively
  if (board[row][col].adjacentMines === 0) {
    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        if (dr === 0 && dc === 0) continue;
        revealCellRecursive(board, row + dr, col + dc);
      }
    }
  }
}

function checkWin(board: Cell[][], mineCount: number): boolean {
  let revealedCount = 0;
  const totalCells = board.length * board[0].length;

  for (const row of board) {
    for (const cell of row) {
      if (cell.isRevealed) revealedCount++;
    }
  }

  return revealedCount === totalCells - mineCount;
}

// Toggle flag on a cell
export const toggleFlag = mutation({
  args: {
    gameId: v.id("minesweeperGames"),
    row: v.number(),
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

    const newBoard = game.board.map(row => row.map(cell => ({ ...cell })));

    if (newBoard[args.row][args.col].isRevealed) {
      throw new ConvexError({
        message: "Bu hücre zaten açık",
        code: "BAD_REQUEST",
      });
    }

    newBoard[args.row][args.col].isFlagged = !newBoard[args.row][args.col].isFlagged;

    await ctx.db.patch(args.gameId, {
      board: newBoard,
    });
  },
});

// Get current game
export const getGame = query({
  args: { gameId: v.id("minesweeperGames") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.gameId);
  },
});

// Get active game
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

    return await ctx.db
      .query("minesweeperGames")
      .withIndex("by_player", (q) => q.eq("playerId", user._id))
      .filter((q) => q.eq(q.field("status"), "in_progress"))
      .first();
  },
});

// Get player stats
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
      .query("minesweeperGames")
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

    const getBestTime = (games: typeof completedGames) => {
      if (games.length === 0) return null;
      const times = games
        .filter(g => g.timeCompleted)
        .map(g => (g.timeCompleted! - g.timeStarted) / 1000);
      return times.length > 0 ? Math.min(...times) : null;
    };

    return {
      totalGames: completedGames.length,
      bestTimeEasy: getBestTime(completedGames.filter(g => g.difficulty === "easy")),
      bestTimeMedium: getBestTime(completedGames.filter(g => g.difficulty === "medium")),
      bestTimeHard: getBestTime(completedGames.filter(g => g.difficulty === "hard")),
    };
  },
});
