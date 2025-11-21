"use node";

import { v } from "convex/values";
import { action } from "./_generated/server";

export const getCurrentWeather = action({
  args: {
    city: v.string(),
    units: v.optional(v.union(v.literal("metric"), v.literal("imperial"))),
  },
  handler: async (ctx, { city, units = "metric" }) => {
    const apiKey = process.env.OPENWEATHER_API_KEY;
    if (!apiKey) {
      throw new Error("OPENWEATHER_API_KEY environment variable is not set");
    }

    const params = new URLSearchParams({
      q: city,
      appid: apiKey,
      units,
    });

    const response = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?${params.toString()}`,
    );

    if (!response.ok) {
      throw new Error("Failed to fetch weather data");
    }

    const data = await response.json();

    return {
      temperature: data.main.temp,
      feelsLike: data.main.feels_like,
      humidity: data.main.humidity,
      description: data.weather[0].description,
      icon: data.weather[0].icon,
      windSpeed: data.wind.speed,
      city: data.name,
      country: data.sys.country,
      pressure: data.main.pressure,
      visibility: data.visibility,
    };
  },
});

export const getForecast = action({
  args: {
    city: v.string(),
    units: v.optional(v.union(v.literal("metric"), v.literal("imperial"))),
  },
  handler: async (ctx, { city, units = "metric" }) => {
    const apiKey = process.env.OPENWEATHER_API_KEY;
    if (!apiKey) {
      throw new Error("OPENWEATHER_API_KEY environment variable is not set");
    }

    const params = new URLSearchParams({
      q: city,
      appid: apiKey,
      units,
    });

    const response = await fetch(
      `https://api.openweathermap.org/data/2.5/forecast?${params.toString()}`,
    );

    if (!response.ok) {
      throw new Error("Failed to fetch forecast data");
    }

    const data = await response.json();

    return {
      city: data.city.name,
      country: data.city.country,
      forecast: data.list.map((item: { dt: number; main: { temp: number; humidity: number }; weather: Array<{ description: string; icon: string }> }) => ({
        timestamp: item.dt,
        temperature: item.main.temp,
        description: item.weather[0].description,
        icon: item.weather[0].icon,
        humidity: item.main.humidity,
      })),
    };
  },
});
