import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { ConvexError } from "convex/values";

// Generate a Sudoku puzzle
function generateSudoku(difficulty: "easy" | "medium" | "hard"): {
  puzzle: number[][];
  solution: number[][];
} {
  // Create a completed valid Sudoku board
  const solution = createCompletedBoard();
  
  // Remove numbers based on difficulty
  const cellsToRemove = difficulty === "easy" ? 35 : difficulty === "medium" ? 45 : 55;
  const puzzle = removeNumbers(solution, cellsToRemove);
  
  return { puzzle, solution };
}

function createCompletedBoard(): number[][] {
  const board: number[][] = Array(9).fill(null).map(() => Array(9).fill(0));
  fillBoard(board);
  return board;
}

function fillBoard(board: number[][]): boolean {
  for (let row = 0; row < 9; row++) {
    for (let col = 0; col < 9; col++) {
      if (board[row][col] === 0) {
        const numbers = shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9]);
        for (const num of numbers) {
          if (isValidPlacement(board, row, col, num)) {
            board[row][col] = num;
            if (fillBoard(board)) {
              return true;
            }
            board[row][col] = 0;
          }
        }
        return false;
      }
    }
  }
  return true;
}

function isValidPlacement(board: number[][], row: number, col: number, num: number): boolean {
  // Check row
  for (let i = 0; i < 9; i++) {
    if (board[row][i] === num) return false;
  }
  
  // Check column
  for (let i = 0; i < 9; i++) {
    if (board[i][col] === num) return false;
  }
  
  // Check 3x3 box
  const boxRow = Math.floor(row / 3) * 3;
  const boxCol = Math.floor(col / 3) * 3;
  for (let i = 0; i < 3; i++) {
    for (let j = 0; j < 3; j++) {
      if (board[boxRow + i][boxCol + j] === num) return false;
    }
  }
  
  return true;
}

function removeNumbers(board: number[][], count: number): number[][] {
  const puzzle = board.map(row => [...row]);
  let removed = 0;
  
  while (removed < count) {
    const row = Math.floor(Math.random() * 9);
    const col = Math.floor(Math.random() * 9);
    if (puzzle[row][col] !== 0) {
      puzzle[row][col] = 0;
      removed++;
    }
  }
  
  return puzzle;
}

function shuffle<T>(array: T[]): T[] {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
}

// Create a new Sudoku game
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

    const { puzzle, solution } = generateSudoku(args.difficulty);

    const gameId = await ctx.db.insert("sudokuGames", {
      playerId: user._id,
      difficulty: args.difficulty,
      puzzle,
      solution,
      userBoard: puzzle.map(row => [...row]),
      mistakes: 0,
      timeStarted: Date.now(),
      status: "in_progress",
    });

    return gameId;
  },
});

// Update a cell
export const updateCell = mutation({
  args: {
    gameId: v.id("sudokuGames"),
    row: v.number(),
    col: v.number(),
    value: v.number(),
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

    // Check if it's a fixed cell
    if (game.puzzle[args.row][args.col] !== 0) {
      throw new ConvexError({
        message: "Bu hücre değiştirilemez",
        code: "BAD_REQUEST",
      });
    }

    // Update the board
    const newUserBoard = game.userBoard.map(row => [...row]);
    newUserBoard[args.row][args.col] = args.value;

    // Check if it's correct
    let newMistakes = game.mistakes;
    if (args.value !== 0 && args.value !== game.solution[args.row][args.col]) {
      newMistakes++;
    }

    // Check if completed
    const isCompleted = newUserBoard.every((row, r) =>
      row.every((cell, c) => cell === game.solution[r][c])
    );

    const updates: {
      userBoard: number[][];
      mistakes: number;
      status?: "completed";
      timeCompleted?: number;
    } = {
      userBoard: newUserBoard,
      mistakes: newMistakes,
    };

    if (isCompleted) {
      updates.status = "completed";
      updates.timeCompleted = Date.now();
    }

    await ctx.db.patch(args.gameId, updates);

    return { isCorrect: args.value === 0 || args.value === game.solution[args.row][args.col], isCompleted };
  },
});

// Get current game
export const getGame = query({
  args: { gameId: v.id("sudokuGames") },
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
      .query("sudokuGames")
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
      .query("sudokuGames")
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
