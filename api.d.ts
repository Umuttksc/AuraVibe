/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as achievements from "../achievements.js";
import type * as admin_fortuneAnalytics from "../admin/fortuneAnalytics.js";
import type * as admin_fortuneSettings from "../admin/fortuneSettings.js";
import type * as admin from "../admin.js";
import type * as analytics from "../analytics.js";
import type * as blocks from "../blocks.js";
import type * as books from "../books.js";
import type * as chatbot from "../chatbot.js";
import type * as chatbotQueries from "../chatbotQueries.js";
import type * as checkersGames from "../checkersGames.js";
import type * as chessGames from "../chessGames.js";
import type * as comments from "../comments.js";
import type * as communities from "../communities.js";
import type * as connectFourGames from "../connectFourGames.js";
import type * as dailyKnowledge from "../dailyKnowledge.js";
import type * as dreamInterpretation from "../dreamInterpretation.js";
import type * as dreams from "../dreams.js";
import type * as exercises from "../exercises.js";
import type * as firstAid from "../firstAid.js";
import type * as followRequests from "../followRequests.js";
import type * as follows from "../follows.js";
import type * as fortuneInterpretation from "../fortuneInterpretation.js";
import type * as fortunePayments from "../fortunePayments.js";
import type * as fortuneUsage from "../fortuneUsage.js";
import type * as fortunes from "../fortunes.js";
import type * as games from "../games.js";
import type * as giftPayments from "../giftPayments.js";
import type * as giftSettings from "../giftSettings.js";
import type * as giftTransactions from "../giftTransactions.js";
import type * as gifts from "../gifts.js";
import type * as groupMessages from "../groupMessages.js";
import type * as hashtags from "../hashtags.js";
import type * as helpers from "../helpers.js";
import type * as http from "../http.js";
import type * as islamicDiscussions from "../islamicDiscussions.js";
import type * as islamicGuides from "../islamicGuides.js";
import type * as journal from "../journal.js";
import type * as memoryGames from "../memoryGames.js";
import type * as menstrual from "../menstrual.js";
import type * as messages from "../messages.js";
import type * as migrations from "../migrations.js";
import type * as militaryService from "../militaryService.js";
import type * as minesweeperGames from "../minesweeperGames.js";
import type * as music from "../music.js";
import type * as mutes from "../mutes.js";
import type * as notes from "../notes.js";
import type * as notificationPreferences from "../notificationPreferences.js";
import type * as notifications from "../notifications.js";
import type * as ovulationTracking from "../ovulationTracking.js";
import type * as pixabayMusic from "../pixabayMusic.js";
import type * as polls from "../polls.js";
import type * as posts from "../posts.js";
import type * as prayer from "../prayer.js";
import type * as puzzleGames from "../puzzleGames.js";
import type * as quickDrawGames from "../quickDrawGames.js";
import type * as quizGames from "../quizGames.js";
import type * as quran from "../quran.js";
import type * as quranReader from "../quranReader.js";
import type * as reports from "../reports.js";
import type * as savedMusic from "../savedMusic.js";
import type * as savedPosts from "../savedPosts.js";
import type * as search from "../search.js";
import type * as seedGifts from "../seedGifts.js";
import type * as seedPremiumGifts from "../seedPremiumGifts.js";
import type * as seedTeamGifts from "../seedTeamGifts.js";
import type * as settings from "../settings.js";
import type * as sexualHealth from "../sexualHealth.js";
import type * as stories from "../stories.js";
import type * as storyReplies from "../storyReplies.js";
import type * as sudokuGames from "../sudokuGames.js";
import type * as tarotInterpretation from "../tarotInterpretation.js";
import type * as tokenPayments from "../tokenPayments.js";
import type * as tokens from "../tokens.js";
import type * as users from "../users.js";
import type * as verificationRequests from "../verificationRequests.js";
import type * as videoCalls from "../videoCalls.js";
import type * as walletSettings from "../walletSettings.js";
import type * as wallets from "../wallets.js";
import type * as water from "../water.js";
import type * as weather from "../weather.js";
import type * as wellnessDashboard from "../wellnessDashboard.js";
import type * as wellnessGoals from "../wellnessGoals.js";
import type * as wellnessHabits from "../wellnessHabits.js";
import type * as wellnessMedications from "../wellnessMedications.js";
import type * as wellnessMood from "../wellnessMood.js";
import type * as wellnessSleep from "../wellnessSleep.js";
import type * as wellnessSymptoms from "../wellnessSymptoms.js";
import type * as wordGuessGames from "../wordGuessGames.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

/**
 * A utility for referencing Convex functions in your app's API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
declare const fullApi: ApiFromModules<{
  achievements: typeof achievements;
  "admin/fortuneAnalytics": typeof admin_fortuneAnalytics;
  "admin/fortuneSettings": typeof admin_fortuneSettings;
  admin: typeof admin;
  analytics: typeof analytics;
  blocks: typeof blocks;
  books: typeof books;
  chatbot: typeof chatbot;
  chatbotQueries: typeof chatbotQueries;
  checkersGames: typeof checkersGames;
  chessGames: typeof chessGames;
  comments: typeof comments;
  communities: typeof communities;
  connectFourGames: typeof connectFourGames;
  dailyKnowledge: typeof dailyKnowledge;
  dreamInterpretation: typeof dreamInterpretation;
  dreams: typeof dreams;
  exercises: typeof exercises;
  firstAid: typeof firstAid;
  followRequests: typeof followRequests;
  follows: typeof follows;
  fortuneInterpretation: typeof fortuneInterpretation;
  fortunePayments: typeof fortunePayments;
  fortuneUsage: typeof fortuneUsage;
  fortunes: typeof fortunes;
  games: typeof games;
  giftPayments: typeof giftPayments;
  giftSettings: typeof giftSettings;
  giftTransactions: typeof giftTransactions;
  gifts: typeof gifts;
  groupMessages: typeof groupMessages;
  hashtags: typeof hashtags;
  helpers: typeof helpers;
  http: typeof http;
  islamicDiscussions: typeof islamicDiscussions;
  islamicGuides: typeof islamicGuides;
  journal: typeof journal;
  memoryGames: typeof memoryGames;
  menstrual: typeof menstrual;
  messages: typeof messages;
  migrations: typeof migrations;
  militaryService: typeof militaryService;
  minesweeperGames: typeof minesweeperGames;
  music: typeof music;
  mutes: typeof mutes;
  notes: typeof notes;
  notificationPreferences: typeof notificationPreferences;
  notifications: typeof notifications;
  ovulationTracking: typeof ovulationTracking;
  pixabayMusic: typeof pixabayMusic;
  polls: typeof polls;
  posts: typeof posts;
  prayer: typeof prayer;
  puzzleGames: typeof puzzleGames;
  quickDrawGames: typeof quickDrawGames;
  quizGames: typeof quizGames;
  quran: typeof quran;
  quranReader: typeof quranReader;
  reports: typeof reports;
  savedMusic: typeof savedMusic;
  savedPosts: typeof savedPosts;
  search: typeof search;
  seedGifts: typeof seedGifts;
  seedPremiumGifts: typeof seedPremiumGifts;
  seedTeamGifts: typeof seedTeamGifts;
  settings: typeof settings;
  sexualHealth: typeof sexualHealth;
  stories: typeof stories;
  storyReplies: typeof storyReplies;
  sudokuGames: typeof sudokuGames;
  tarotInterpretation: typeof tarotInterpretation;
  tokenPayments: typeof tokenPayments;
  tokens: typeof tokens;
  users: typeof users;
  verificationRequests: typeof verificationRequests;
  videoCalls: typeof videoCalls;
  walletSettings: typeof walletSettings;
  wallets: typeof wallets;
  water: typeof water;
  weather: typeof weather;
  wellnessDashboard: typeof wellnessDashboard;
  wellnessGoals: typeof wellnessGoals;
  wellnessHabits: typeof wellnessHabits;
  wellnessMedications: typeof wellnessMedications;
  wellnessMood: typeof wellnessMood;
  wellnessSleep: typeof wellnessSleep;
  wellnessSymptoms: typeof wellnessSymptoms;
  wordGuessGames: typeof wordGuessGames;
}>;
declare const fullApiWithMounts: typeof fullApi;

export declare const api: FilterApi<
  typeof fullApiWithMounts,
  FunctionReference<any, "public">
>;
export declare const internal: FilterApi<
  typeof fullApiWithMounts,
  FunctionReference<any, "internal">
>;

export declare const components: {};
