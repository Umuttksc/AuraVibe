"use node";

import { action } from "./_generated/server";

// Turkish names of Quran Surahs
const SURAH_NAMES_TR: Record<number, string> = {
  1: "Fâtiha",
  2: "Bakara",
  3: "Âl-i İmrân",
  4: "Nisâ",
  5: "Mâide",
  6: "En'âm",
  7: "A'râf",
  8: "Enfâl",
  9: "Tevbe",
  10: "Yûnus",
  11: "Hûd",
  12: "Yûsuf",
  13: "Ra'd",
  14: "İbrâhîm",
  15: "Hicr",
  16: "Nahl",
  17: "İsrâ",
  18: "Kehf",
  19: "Meryem",
  20: "Tâhâ",
  21: "Enbiyâ",
  22: "Hacc",
  23: "Mü'minûn",
  24: "Nûr",
  25: "Furkān",
  26: "Şuarâ",
  27: "Neml",
  28: "Kasas",
  29: "Ankebût",
  30: "Rûm",
  31: "Lokmân",
  32: "Secde",
  33: "Ahzâb",
  34: "Sebe'",
  35: "Fâtır",
  36: "Yâsîn",
  37: "Sâffât",
  38: "Sâd",
  39: "Zümer",
  40: "Mü'min",
  41: "Fussilet",
  42: "Şûrâ",
  43: "Zuhruf",
  44: "Duhân",
  45: "Câsiye",
  46: "Ahkāf",
  47: "Muhammed",
  48: "Fetih",
  49: "Hucurât",
  50: "Kāf",
  51: "Zâriyât",
  52: "Tûr",
  53: "Necm",
  54: "Kamer",
  55: "Rahmân",
  56: "Vâkıa",
  57: "Hadîd",
  58: "Mücâdele",
  59: "Haşr",
  60: "Mümtehine",
  61: "Saff",
  62: "Cuma",
  63: "Münâfıkūn",
  64: "Teğâbün",
  65: "Talâk",
  66: "Tahrîm",
  67: "Mülk",
  68: "Kalem",
  69: "Hâkka",
  70: "Meâric",
  71: "Nûh",
  72: "Cin",
  73: "Müzzemmil",
  74: "Müddessir",
  75: "Kıyâme",
  76: "İnsan",
  77: "Mürselât",
  78: "Nebe'",
  79: "Nâziât",
  80: "Abese",
  81: "Tekvîr",
  82: "İnfitār",
  83: "Mutaffifîn",
  84: "İnşikāk",
  85: "Burûc",
  86: "Târık",
  87: "A'lâ",
  88: "Ğāşiye",
  89: "Fecr",
  90: "Beled",
  91: "Şems",
  92: "Leyl",
  93: "Duhâ",
  94: "İnşirâh",
  95: "Tîn",
  96: "Alak",
  97: "Kadir",
  98: "Beyyine",
  99: "Zilzâl",
  100: "Âdiyât",
  101: "Kāria",
  102: "Tekâsür",
  103: "Asr",
  104: "Hümeze",
  105: "Fîl",
  106: "Kureyş",
  107: "Mâûn",
  108: "Kevser",
  109: "Kâfirûn",
  110: "Nasr",
  111: "Tebbet",
  112: "İhlâs",
  113: "Felak",
  114: "Nâs",
};

export const getDailyVerse = action({
  args: {},
  handler: async () => {
    // Get a random verse (there are 6236 verses in the Quran)
    const today = new Date();
    const dayOfYear = Math.floor((today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) / 1000 / 60 / 60 / 24);
    const verseNumber = (dayOfYear % 6236) + 1;

    // Fetch verse with multiple translations (Arabic original and Turkish translation)
    const [arabicResponse, turkishResponse] = await Promise.all([
      fetch(`https://api.alquran.cloud/v1/ayah/${verseNumber}/ar.alafasy`),
      fetch(`https://api.alquran.cloud/v1/ayah/${verseNumber}/tr.diyanet`),
    ]);

    if (!arabicResponse.ok || !turkishResponse.ok) {
      throw new Error("Failed to fetch Quran verse");
    }

    const arabicData = await arabicResponse.json();
    const turkishData = await turkishResponse.json();
    const surahNumber = arabicData.data.surah.number;
    const revelationType = arabicData.data.surah.revelationType; // "Meccan" or "Medinan"

    // Map revelation type to Turkish
    const revelationPlace = revelationType === "Meccan" ? "Mekke" : "Medine";

    // Generate explanation using AI
    let explanation = "Bu ayet, Allah'ın kullarına verdiği öğütler ve hikmetler arasındadır. Kuran'ın evrensel mesajlarından birini içermektedir.";
    let contextOfRevelation = "Bu ayetin özel bir iniş sebebi bilinmemektedir. Genel bir öğüt ve rehberlik mesajı içermektedir.";

    try {
      const openaiApiKey = process.env.OPENAI_API_KEY;
      if (openaiApiKey) {
        const response = await fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${openaiApiKey}`,
          },
          body: JSON.stringify({
            model: "gpt-4o-mini",
            messages: [
              {
                role: "system",
                content: "Sen İslami bir bilgin ve tefsir uzmanısın. Kur'an ayetlerini açıklıyorsun."
              },
              {
                role: "user",
                content: `Aşağıdaki Kur'an ayeti hakkında kısa ve öz bir açıklama yaz. Açıklama 2-3 cümle olsun ve ayetin ana mesajını anlat. Ayrıca bu ayetin iniş sebebini (sebeb-i nüzul) kısaca açıkla. Eğer belirli bir iniş sebebi yoksa "Bu ayet genel bir öğüt/hüküm içermektedir" gibi ifade kullan.

Ayet: ${turkishData.data.text}
Sure: ${SURAH_NAMES_TR[surahNumber]} Suresi, ${arabicData.data.numberInSurah}. Ayet

Cevabını şu formatta ver:
AÇIKLAMA: [2-3 cümlelik açıklama]
İNİŞ SEBEBİ: [Sebeb-i nüzul açıklaması]`
              }
            ],
            temperature: 0.7,
            max_tokens: 300,
          }),
        });

        if (response.ok) {
          const data = await response.json();
          const content = data.choices[0]?.message?.content || "";
          
          // Parse the response
          const explanationMatch = content.match(/AÇIKLAMA:\s*(.+?)(?=İNİŞ SEBEBİ:|$)/s);
          const contextMatch = content.match(/İNİŞ SEBEBİ:\s*(.+?)$/s);
          
          if (explanationMatch && explanationMatch[1].trim()) {
            explanation = explanationMatch[1].trim();
          }
          if (contextMatch && contextMatch[1].trim()) {
            contextOfRevelation = contextMatch[1].trim();
          }
        }
      }
    } catch (error) {
      console.error("Failed to generate explanation:", error);
    }

    return {
      arabicText: arabicData.data.text,
      text: turkishData.data.text, // Turkish translation/meal
      surah: SURAH_NAMES_TR[surahNumber] || arabicData.data.surah.name,
      surahNumber: surahNumber,
      numberInSurah: arabicData.data.numberInSurah,
      ayahNumber: arabicData.data.number,
      revelationPlace: revelationPlace,
      explanation: explanation,
      contextOfRevelation: contextOfRevelation,
    };
  },
});
