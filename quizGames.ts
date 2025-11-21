import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { ConvexError } from "convex/values";
import type { Id } from "./_generated/dataModel.d.ts";

// Question pool organized by category and difficulty
const QUESTIONS = {
  general: {
    easy: [
      { q: "Türkiye'nin başkenti neresidir?", o: ["İstanbul", "Ankara", "İzmir", "Bursa"], a: 1 },
      { q: "Bir yılda kaç ay vardır?", o: ["10", "11", "12", "13"], a: 2 },
      { q: "Güneş hangi yönden doğar?", o: ["Batı", "Kuzey", "Doğu", "Güney"], a: 2 },
      { q: "Bir haftada kaç gün vardır?", o: ["5", "6", "7", "8"], a: 2 },
      { q: "Türk bayrağında kaç yıldız vardır?", o: ["0", "1", "2", "3"], a: 1 },
    ],
    medium: [
      { q: "Mona Lisa tablosunu kim yapmıştır?", o: ["Picasso", "Van Gogh", "Leonardo da Vinci", "Michelangelo"], a: 2 },
      { q: "Dünyanın en büyük okyanusu hangisidir?", o: ["Atlas", "Hint", "Pasifik", "Arktik"], a: 2 },
      { q: "İlk insanın Ay'a ayak basması hangi yıldır?", o: ["1965", "1967", "1969", "1971"], a: 2 },
      { q: "Beethoven kaç senfoni bestelemiştir?", o: ["7", "8", "9", "10"], a: 2 },
      { q: "Olimpiyat oyunları kaç yılda bir düzenlenir?", o: ["2", "3", "4", "5"], a: 2 },
    ],
    hard: [
      { q: "Avogadro sayısı yaklaşık kaçtır?", o: ["6.02 x 10^22", "6.02 x 10^23", "6.02 x 10^24", "6.02 x 10^25"], a: 1 },
      { q: "Kütahya Porselen hangi yıl kurulmuştur?", o: ["1968", "1970", "1973", "1975"], a: 1 },
      { q: "Dünya'nın çekirdeğinin ana bileşeni nedir?", o: ["Silisyum", "Oksijen", "Demir", "Nikel"], a: 2 },
    ],
  },
  science: {
    easy: [
      { q: "Suyun kimyasal formülü nedir?", o: ["H2O", "CO2", "O2", "H2O2"], a: 0 },
      { q: "Güneş sisteminde kaç gezegen vardır?", o: ["7", "8", "9", "10"], a: 1 },
      { q: "İnsanın kaç duyusu vardır?", o: ["4", "5", "6", "7"], a: 1 },
      { q: "Hangi element altının sembolüdür?", o: ["Ag", "Au", "Al", "Ar"], a: 1 },
      { q: "Işık hızı yaklaşık kaç km/s'dir?", o: ["100,000", "200,000", "300,000", "400,000"], a: 2 },
    ],
    medium: [
      { q: "DNA'nın açılımı nedir?", o: ["Deoksiribonükleik Asit", "Diribonükleik Asit", "Deoksiriboz Asit", "Dioksiribonükleik Asit"], a: 0 },
      { q: "Newton'un kaç hareket yasası vardır?", o: ["2", "3", "4", "5"], a: 1 },
      { q: "Periyodik tabloda kaç element vardır?", o: ["100", "108", "118", "128"], a: 2 },
      { q: "Karbondioksitin kimyasal formülü nedir?", o: ["CO", "CO2", "C2O", "C2O2"], a: 1 },
      { q: "Güneş'in yüzey sıcaklığı yaklaşık kaç °C'dir?", o: ["3,500", "4,500", "5,500", "6,500"], a: 2 },
    ],
    hard: [
      { q: "Schrödinger denklemini kim bulmuştur?", o: ["Heisenberg", "Bohr", "Schrödinger", "Einstein"], a: 2 },
      { q: "Bir fotonun kütlesi kaçtır?", o: ["0", "10^-30 kg", "10^-35 kg", "Değişken"], a: 0 },
      { q: "Planck sabiti kaçtır?", o: ["6.62 x 10^-34", "6.62 x 10^-33", "6.62 x 10^-32", "6.62 x 10^-31"], a: 0 },
    ],
  },
  history: {
    easy: [
      { q: "Türkiye Cumhuriyeti hangi yıl kuruldu?", o: ["1920", "1921", "1922", "1923"], a: 3 },
      { q: "İstanbul'un fethi hangi yıldır?", o: ["1451", "1453", "1455", "1457"], a: 1 },
      { q: "Cumhuriyet'in kurucusu kimdir?", o: ["İsmet İnönü", "Mustafa Kemal Atatürk", "Fevzi Çakmak", "Kazım Karabekir"], a: 1 },
      { q: "1. Dünya Savaşı hangi yıl başladı?", o: ["1912", "1913", "1914", "1915"], a: 2 },
      { q: "Osmanlı İmparatorluğu hangi yıl kuruldu?", o: ["1299", "1326", "1389", "1453"], a: 0 },
    ],
    medium: [
      { q: "Kurtuluş Savaşı kaç yıl sürdü?", o: ["2", "3", "4", "5"], a: 2 },
      { q: "Lozan Antlaşması hangi yıl imzalandı?", o: ["1921", "1922", "1923", "1924"], a: 2 },
      { q: "İlk Türk devleti hangisidir?", o: ["Hun", "Göktürk", "Uygur", "Karahanlı"], a: 0 },
      { q: "2. Dünya Savaşı hangi yıl bitti?", o: ["1943", "1944", "1945", "1946"], a: 2 },
      { q: "Çanakkale Savaşı hangi yıldır?", o: ["1913", "1914", "1915", "1916"], a: 2 },
    ],
    hard: [
      { q: "Magna Carta hangi yıl imzalandı?", o: ["1205", "1215", "1225", "1235"], a: 1 },
      { q: "Rönesans hangi yüzyılda başladı?", o: ["13.", "14.", "15.", "16."], a: 1 },
      { q: "Sanayi Devrimi hangi ülkede başladı?", o: ["Fransa", "Almanya", "İngiltere", "ABD"], a: 2 },
    ],
  },
  geography: {
    easy: [
      { q: "Dünyanın en büyük ülkesi hangisidir?", o: ["Çin", "Kanada", "ABD", "Rusya"], a: 3 },
      { q: "Türkiye kaç ile ayrılır?", o: ["79", "80", "81", "82"], a: 2 },
      { q: "Dünyanın en yüksek dağı hangisidir?", o: ["K2", "Everest", "Kangchenjunga", "Lhotse"], a: 1 },
      { q: "Ege Denizi hangi iki ülke arasındadır?", o: ["Türkiye-İtalya", "Türkiye-Yunanistan", "Yunanistan-İtalya", "Türkiye-Bulgaristan"], a: 1 },
      { q: "Kıbrıs hangi denizde yer alır?", o: ["Ege", "Akdeniz", "Karadeniz", "Marmara"], a: 1 },
    ],
    medium: [
      { q: "Türkiye'nin en uzun nehri hangisidir?", o: ["Fırat", "Dicle", "Kızılırmak", "Sakarya"], a: 2 },
      { q: "Van Gölü'nün yüzölçümü yaklaşık kaç km²'dir?", o: ["2,400", "3,400", "4,400", "5,400"], a: 1 },
      { q: "Karadeniz'in ortalama derinliği kaç metredir?", o: ["1,200", "1,500", "1,800", "2,100"], a: 0 },
      { q: "Dünya'nın en uzun nehri hangisidir?", o: ["Amazon", "Nil", "Yangtze", "Mississippi"], a: 1 },
      { q: "Avrupa'nın en kalabalık şehri hangisidir?", o: ["Paris", "Londra", "İstanbul", "Moskova"], a: 2 },
    ],
    hard: [
      { q: "Mariana Çukuru'nun derinliği kaç metredir?", o: ["10,000", "10,500", "11,000", "11,500"], a: 2 },
      { q: "Sahara Çölü'nün yüzölçümü kaç milyon km²'dir?", o: ["7", "8", "9", "10"], a: 2 },
      { q: "Amazon Ormanları dünyanın oksijeninin yüzde kaçını üretir?", o: ["15", "20", "25", "30"], a: 1 },
    ],
  },
  sports: {
    easy: [
      { q: "Futbolda bir takımda kaç oyuncu oynar?", o: ["9", "10", "11", "12"], a: 2 },
      { q: "Basketbol topu hangi renkdedir?", o: ["Turuncu", "Sarı", "Kırmızı", "Kahverengi"], a: 0 },
      { q: "Olimpiyatların sembolü kaç halkadan oluşur?", o: ["3", "4", "5", "6"], a: 2 },
      { q: "Tenis kortunda kaç oyuncu oynar?", o: ["1 veya 2", "2 veya 4", "3 veya 6", "4 veya 8"], a: 1 },
      { q: "Formula 1'de bir yarış kaç turdan oluşur?", o: ["Değişken", "50", "100", "150"], a: 0 },
    ],
    medium: [
      { q: "Galatasaray hangi yıl kuruldu?", o: ["1903", "1905", "1907", "1909"], a: 1 },
      { q: "Dünya Kupası ilk kez hangi yıl düzenlendi?", o: ["1928", "1930", "1932", "1934"], a: 1 },
      { q: "NBA'de bir maç kaç periyottan oluşur?", o: ["2", "3", "4", "5"], a: 2 },
      { q: "Fenerbahçe'nin kuruluş yılı nedir?", o: ["1905", "1907", "1909", "1911"], a: 1 },
      { q: "Voleybol takımında kaç oyuncu oynar?", o: ["5", "6", "7", "8"], a: 1 },
    ],
    hard: [
      { q: "Türkiye Milli Takımı ilk maçını hangi yıl oynadı?", o: ["1920", "1921", "1922", "1923"], a: 3 },
      { q: "Beşiktaş kaç kez Süper Lig şampiyonu oldu? (2023 itibarıyla)", o: ["15", "16", "17", "18"], a: 1 },
      { q: "Hakan Şükür milli takımda kaç gol attı?", o: ["49", "51", "53", "55"], a: 1 },
    ],
  },
  culture: {
    easy: [
      { q: "Türk kahvesi hangi ülkenin kültürüne aittir?", o: ["Yunanistan", "Türkiye", "Arap", "İran"], a: 1 },
      { q: "Ramazan ayı kaç gün sürer?", o: ["28", "29 veya 30", "30", "31"], a: 1 },
      { q: "Ebru sanatı nedir?", o: ["Heykel", "Su üzerine resim", "Seramik", "Halı"], a: 1 },
      { q: "Türk müziğinde kaç makam vardır?", o: ["7", "12", "24", "Çok fazla"], a: 3 },
      { q: "Nevruz ne zaman kutlanır?", o: ["21 Mart", "23 Nisan", "19 Mayıs", "29 Ekim"], a: 0 },
    ],
    medium: [
      { q: "Yunus Emre hangi yüzyılda yaşadı?", o: ["12.", "13.", "14.", "15."], a: 1 },
      { q: "Mevlana'nın türbesi hangi şehirdedir?", o: ["Ankara", "Konya", "İstanbul", "Bursa"], a: 1 },
      { q: "İlk Türk romanı hangisidir?", o: ["Araba Sevdası", "İntibah", "Sergüzeşt", "Taaşşuk-u Talat ve Fitnat"], a: 3 },
      { q: "Nasreddin Hoca hangi şehirle özdeşleşmiştir?", o: ["Afyon", "Akşehir", "Kırşehir", "Eskişehir"], a: 1 },
      { q: "Orhan Pamuk hangi romanıyla Nobel ödülü aldı?", o: ["Benim Adım Kırmızı", "Kar", "Masumiyet Müzesi", "Ödül eseri yok"], a: 3 },
    ],
    hard: [
      { q: "Divan Edebiyatı'nın ilk şairi kimdir?", o: ["Fuzuli", "Baki", "Yunus Emre", "Keşfî"], a: 3 },
      { q: "Selimiye Camii'nin mimarı kimdir?", o: ["Mimar Sinan", "Sedefkar Mehmet Ağa", "Kasım Ağa", "Davut Ağa"], a: 0 },
      { q: "İstiklal Marşı kaç kıtadan oluşur?", o: ["10", "12", "14", "16"], a: 1 },
    ],
  },
};

// Generate random questions based on category and difficulty
function generateQuestions(
  category: keyof typeof QUESTIONS,
  difficulty: "easy" | "medium" | "hard",
  count: number
): Array<{ question: string; options: string[]; correctAnswer: number; category: string }> {
  const pool = QUESTIONS[category][difficulty];
  const shuffled = [...pool].sort(() => Math.random() - 0.5);
  const selected = shuffled.slice(0, Math.min(count, pool.length));

  return selected.map(q => ({
    question: q.q,
    options: q.o,
    correctAnswer: q.a,
    category: category,
  }));
}

// Create a new quiz game
export const createGame = mutation({
  args: {
    category: v.union(
      v.literal("general"),
      v.literal("science"),
      v.literal("history"),
      v.literal("geography"),
      v.literal("sports"),
      v.literal("culture")
    ),
    difficulty: v.union(v.literal("easy"), v.literal("medium"), v.literal("hard")),
    mode: v.union(v.literal("single"), v.literal("multiplayer")),
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

    // Generate 10 questions
    const questions = generateQuestions(args.category, args.difficulty, 10);

    const gameId = await ctx.db.insert("quizGames", {
      player1Id: user._id,
      player2Id: undefined,
      invitedUserId: args.invitedUserId,
      category: args.category,
      difficulty: args.difficulty,
      mode: args.mode,
      questions,
      player1Answers: [],
      player2Answers: undefined,
      currentQuestionIndex: 0,
      player1Score: 0,
      player2Score: undefined,
      timeStarted: Date.now(),
      status: args.mode === "single" ? "in_progress" : "waiting",
    });

    // Send notification if invited
    if (args.invitedUserId && args.mode === "multiplayer") {
      await ctx.db.insert("notifications", {
        userId: args.invitedUserId,
        type: "game_invite",
        actorId: user._id,
        isRead: false,
        message: `${user.name || user.username || "Bir kullanıcı"} sizi bilgi yarışmasına davet etti!`,
      });
    }

    return gameId;
  },
});

// Join a multiplayer game
export const joinGame = mutation({
  args: {
    gameId: v.id("quizGames"),
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

    if (game.status !== "waiting") {
      throw new ConvexError({
        message: "Oyun zaten başladı",
        code: "BAD_REQUEST",
      });
    }

    if (game.player1Id === user._id) {
      throw new ConvexError({
        message: "Kendi oyununuza katılamazsınız",
        code: "BAD_REQUEST",
      });
    }

    // Check if game has invited user restriction
    if (game.invitedUserId && game.invitedUserId !== user._id) {
      throw new ConvexError({
        message: "Bu oyuna sadece davet edilen kullanıcı katılabilir",
        code: "FORBIDDEN",
      });
    }

    await ctx.db.patch(args.gameId, {
      player2Id: user._id,
      player2Answers: [],
      player2Score: 0,
      status: "in_progress",
    });

    return { success: true };
  },
});

// Submit an answer
export const submitAnswer = mutation({
  args: {
    gameId: v.id("quizGames"),
    questionIndex: v.number(),
    selectedAnswer: v.number(),
    timeSpent: v.number(),
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

    const isPlayer1 = game.player1Id === user._id;
    const isPlayer2 = game.player2Id === user._id;

    if (!isPlayer1 && !isPlayer2) {
      throw new ConvexError({
        message: "Bu oyunu oynayamazsınız",
        code: "FORBIDDEN",
      });
    }

    const question = game.questions[args.questionIndex];
    const isCorrect = question.correctAnswer === args.selectedAnswer;

    const answer = {
      questionIndex: args.questionIndex,
      selectedAnswer: args.selectedAnswer,
      isCorrect,
      timeSpent: args.timeSpent,
    };

    // Calculate score (correct answer + time bonus)
    const score = isCorrect ? 100 + Math.max(0, 50 - Math.floor(args.timeSpent / 1000)) : 0;

    if (isPlayer1) {
      const newAnswers = [...game.player1Answers, answer];
      const newScore = game.player1Score + score;

      await ctx.db.patch(args.gameId, {
        player1Answers: newAnswers,
        player1Score: newScore,
      });
    } else {
      const newAnswers = [...(game.player2Answers || []), answer];
      const newScore = (game.player2Score || 0) + score;

      await ctx.db.patch(args.gameId, {
        player2Answers: newAnswers,
        player2Score: newScore,
      });
    }

    // Check if game is completed
    const totalQuestions = game.questions.length;
    const player1Done = (isPlayer1 ? game.player1Answers.length + 1 : game.player1Answers.length) === totalQuestions;
    const player2Done = game.mode === "single" ? true : (isPlayer2 ? (game.player2Answers?.length || 0) + 1 : game.player2Answers?.length || 0) === totalQuestions;

    if (player1Done && player2Done) {
      const updatedGame = await ctx.db.get(args.gameId);
      if (!updatedGame) return { isCorrect, score };

      const finalPlayer1Score = isPlayer1 ? updatedGame.player1Score + score : updatedGame.player1Score;
      const finalPlayer2Score = isPlayer2 ? (updatedGame.player2Score || 0) + score : updatedGame.player2Score || 0;

      let winnerId: Id<"users"> | undefined;
      if (game.mode === "multiplayer") {
        winnerId = finalPlayer1Score > finalPlayer2Score ? updatedGame.player1Id : 
                   finalPlayer2Score > finalPlayer1Score ? updatedGame.player2Id : 
                   undefined;
      }

      await ctx.db.patch(args.gameId, {
        status: "completed",
        timeCompleted: Date.now(),
        winnerId,
      });
    }

    return { isCorrect, score };
  },
});

// Get game by ID
export const getGame = query({
  args: { gameId: v.id("quizGames") },
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
        profilePicture: player1.profilePicture,
      } : null,
      player2: player2 ? {
        _id: player2._id,
        name: player2.name,
        username: player2.username,
        profilePicture: player2.profilePicture,
      } : null,
    };
  },
});

// Get available games to join
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

    const waitingGames = await ctx.db
      .query("quizGames")
      .withIndex("by_status", (q) => q.eq("status", "waiting"))
      .order("desc")
      .take(20);

    // Filter games where user is invited or game is public
    const availableGames = waitingGames.filter(
      game => game.player1Id !== user._id && (!game.invitedUserId || game.invitedUserId === user._id)
    );

    const gamesWithPlayers = await Promise.all(
      availableGames.map(async (game) => {
        const player1 = await ctx.db.get(game.player1Id);
        return {
          ...game,
          player1: player1 ? {
            _id: player1._id,
            name: player1.name,
            username: player1.username,
            profilePicture: player1.profilePicture,
          } : null,
        };
      })
    );

    return gamesWithPlayers;
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

    const games = await ctx.db
      .query("quizGames")
      .collect();

    const playerGames = games.filter(
      g => (g.player1Id === user._id || g.player2Id === user._id) && g.status === "completed"
    );

    const totalGames = playerGames.length;
    const wonGames = playerGames.filter(g => g.winnerId === user._id).length;
    const totalScore = playerGames.reduce((sum, g) => {
      return sum + (g.player1Id === user._id ? g.player1Score : g.player2Score || 0);
    }, 0);

    return {
      totalGames,
      wonGames,
      totalScore,
      averageScore: totalGames > 0 ? Math.round(totalScore / totalGames) : 0,
      winRate: totalGames > 0 ? Math.round((wonGames / totalGames) * 100) : 0,
    };
  },
});

// Cancel game (only if waiting)
export const cancelGame = mutation({
  args: {
    gameId: v.id("quizGames"),
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

    if (game.player1Id !== user._id) {
      throw new ConvexError({
        message: "Sadece oyunu başlatan kişi iptal edebilir",
        code: "FORBIDDEN",
      });
    }

    if (game.status !== "waiting") {
      throw new ConvexError({
        message: "Devam eden oyun iptal edilemez",
        code: "BAD_REQUEST",
      });
    }

    await ctx.db.patch(args.gameId, {
      status: "cancelled",
    });

    return { success: true };
  },
});
