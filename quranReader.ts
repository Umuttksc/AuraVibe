"use node";

import { action } from "./_generated/server";
import { v } from "convex/values";

export const getSurahWithTranslation = action({
  args: { surahNumber: v.number() },
  handler: async (ctx, args) => {
    try {
      // Fetch Arabic text and Turkish translation in parallel
      const [arabicResponse, turkishResponse] = await Promise.all([
        fetch(`https://api.alquran.cloud/v1/surah/${args.surahNumber}`),
        fetch(`https://api.alquran.cloud/v1/surah/${args.surahNumber}/tr.diyanet`)
      ]);

      if (!arabicResponse.ok || !turkishResponse.ok) {
        throw new Error("Failed to fetch Quran data");
      }

      const arabicData = await arabicResponse.json();
      const turkishData = await turkishResponse.json();

      const surahInfo = {
        number: arabicData.data.number,
        name: arabicData.data.englishName,
        arabicName: arabicData.data.name,
        revelationType: arabicData.data.revelationType === "Meccan" ? "Mekki" : "Medeni",
        numberOfAyahs: arabicData.data.numberOfAyahs,
      };

      interface AyahResponse {
        numberInSurah: number;
        text: string;
      }

      const ayahs = (arabicData.data.ayahs as AyahResponse[]).map((ayah, index: number) => ({
        number: ayah.numberInSurah,
        arabicText: ayah.text,
        translation: (turkishData.data.ayahs as AyahResponse[])[index]?.text || "",
      }));

      return {
        surahInfo,
        ayahs,
      };
    } catch (error) {
      console.error("Error fetching Quran data:", error);
      throw error;
    }
  },
});
