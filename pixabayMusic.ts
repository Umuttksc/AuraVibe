"use node";

import { action } from "./_generated/server";
import { v } from "convex/values";

export const searchPixabayMusic = action({
  args: {
    query: v.string(),
    page: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const apiKey = process.env.PIXABAY_API_KEY;
    
    if (!apiKey) {
      throw new Error("PIXABAY_API_KEY environment variable is not set");
    }

    const page = args.page ?? 1;
    const perPage = 20;

    try {
      const url = `https://pixabay.com/api/?key=${apiKey}&q=${encodeURIComponent(args.query)}&audio_type=music&per_page=${perPage}&page=${page}`;
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`Pixabay API error: ${response.status}`);
      }

      const data = await response.json();

      // Transform Pixabay results to our music format
      const music = data.hits.map((hit: {
        id: number;
        user: string;
        tags: string;
        duration: number;
        audio: string;
        picture_id: string;
        pageURL: string;
      }) => ({
        pixabayId: hit.id.toString(),
        title: hit.tags.split(",")[0]?.trim() || "Untitled",
        artist: hit.user,
        genre: hit.tags.split(",")[1]?.trim() || "Music",
        duration: Math.floor(hit.duration),
        audioUrl: hit.audio,
        albumArt: "🎵",
        popularity: 80,
        source: "pixabay",
      }));

      return {
        music,
        total: data.total,
        totalHits: data.totalHits,
      };
    } catch (error) {
      console.error("Pixabay music search error:", error);
      throw new Error("Müzik araması başarısız oldu");
    }
  },
});

export const getTrendingPixabayMusic = action({
  args: {},
  handler: async (ctx) => {
    const apiKey = process.env.PIXABAY_API_KEY;
    
    if (!apiKey) {
      throw new Error("PIXABAY_API_KEY environment variable is not set");
    }

    try {
      // Get popular/trending music - use popular search terms
      const queries = ["popular", "trending", "upbeat", "chill"];
      const randomQuery = queries[Math.floor(Math.random() * queries.length)];
      
      const url = `https://pixabay.com/api/?key=${apiKey}&q=${randomQuery}&audio_type=music&per_page=20&order=popular`;
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`Pixabay API error: ${response.status}`);
      }

      const data = await response.json();

      const music = data.hits.map((hit: {
        id: number;
        user: string;
        tags: string;
        duration: number;
        audio: string;
      }) => ({
        pixabayId: hit.id.toString(),
        title: hit.tags.split(",")[0]?.trim() || "Untitled",
        artist: hit.user,
        genre: hit.tags.split(",")[1]?.trim() || "Music",
        duration: Math.floor(hit.duration),
        audioUrl: hit.audio,
        albumArt: "🎵",
        popularity: 90,
        source: "pixabay",
      }));

      return music;
    } catch (error) {
      console.error("Pixabay trending music error:", error);
      throw new Error("Popüler müzikler yüklenemedi");
    }
  },
});
