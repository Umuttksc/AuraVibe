"use node";

import { v } from "convex/values";
import { action } from "./_generated/server";

export const getPrayerTimes = action({
  args: {
    city: v.string(),
    country: v.string(),
  },
  handler: async (ctx, { city, country }) => {
    const today = new Date();
    const day = today.getDate();
    const month = today.getMonth() + 1;
    const year = today.getFullYear();

    const response = await fetch(
      `https://api.aladhan.com/v1/timingsByCity/${day}-${month}-${year}?city=${encodeURIComponent(city)}&country=${encodeURIComponent(country)}&method=13`,
    );

    if (!response.ok) {
      throw new Error("Failed to fetch prayer times");
    }

    const data = await response.json();

    if (data.code !== 200) {
      throw new Error("Invalid prayer times response");
    }

    const timings = data.data.timings;

    return {
      date: data.data.date.readable,
      hijriDate: data.data.date.hijri.date,
      timings: {
        fajr: timings.Fajr,
        dhuhr: timings.Dhuhr,
        asr: timings.Asr,
        maghrib: timings.Maghrib,
        isha: timings.Isha,
        sunrise: timings.Sunrise,
      },
      city,
      country,
    };
  },
});

export const getPrayerTimesByCoordinates = action({
  args: {
    latitude: v.number(),
    longitude: v.number(),
  },
  handler: async (ctx, { latitude, longitude }) => {
    const today = new Date();
    const day = today.getDate();
    const month = today.getMonth() + 1;
    const year = today.getFullYear();

    const response = await fetch(
      `https://api.aladhan.com/v1/timings/${day}-${month}-${year}?latitude=${latitude}&longitude=${longitude}&method=13`,
    );

    if (!response.ok) {
      throw new Error("Failed to fetch prayer times");
    }

    const data = await response.json();

    if (data.code !== 200) {
      throw new Error("Invalid prayer times response");
    }

    const timings = data.data.timings;

    return {
      date: data.data.date.readable,
      hijriDate: data.data.date.hijri.date,
      timings: {
        fajr: timings.Fajr,
        dhuhr: timings.Dhuhr,
        asr: timings.Asr,
        maghrib: timings.Maghrib,
        isha: timings.Isha,
        sunrise: timings.Sunrise,
      },
    };
  },
});
