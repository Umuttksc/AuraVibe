import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

// Müzik arama
export const searchMusic = query({
  args: {
    query: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 20;
    
    // Türkçe karakter desteği için toLocaleLowerCase kullan
    const searchQuery = args.query.toLocaleLowerCase('tr-TR').trim();
    
    // Boş arama ise popüler müzikleri döndür
    if (!searchQuery) {
      return await ctx.db
        .query("music")
        .order("desc")
        .take(limit);
    }

    // Başlık, sanatçı veya türe göre arama
    const allMusic = await ctx.db.query("music").collect();

    const filtered = allMusic
      .filter(
        (music) =>
          music.title.toLocaleLowerCase('tr-TR').includes(searchQuery) ||
          music.artist.toLocaleLowerCase('tr-TR').includes(searchQuery) ||
          (music.genre && music.genre.toLocaleLowerCase('tr-TR').includes(searchQuery))
      )
      .slice(0, limit);

    return filtered;
  },
});

// Popüler müzikleri getir
export const getTrendingMusic = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 20;

    const music = await ctx.db
      .query("music")
      .order("desc")
      .take(limit);

    // Popularity'ye göre sıralama
    return music.sort((a, b) => b.popularity - a.popularity);
  },
});

// ID ile müzik detayı
export const getMusicById = query({
  args: {
    musicId: v.id("music"),
  },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.musicId);
  },
});

// Kategori/tür bazlı müzik getir
export const getMusicByGenre = query({
  args: {
    genre: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 20;

    const allMusic = await ctx.db.query("music").collect();

    const filtered = allMusic
      .filter((music) => music.genre === args.genre)
      .slice(0, limit);

    return filtered;
  },
});

// Mevcut müziklere audio URL ekle
export const addAudioUrlsToExistingMusic = mutation({
  args: {},
  handler: async (ctx) => {
    const allMusic = await ctx.db.query("music").collect();
    
    // Sample audio URLs (demo amaçlı - gerçek uygulamada gerçek müzik URL'leri kullanılır)
    const sampleUrls = [
      "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
      "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3",
      "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3",
      "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3",
      "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3",
      "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-6.mp3",
      "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-7.mp3",
      "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3",
      "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-9.mp3",
      "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-10.mp3",
      "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-11.mp3",
      "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-12.mp3",
      "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-13.mp3",
      "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-14.mp3",
      "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-15.mp3",
      "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-16.mp3",
    ];
    
    let updated = 0;
    for (let i = 0; i < allMusic.length; i++) {
      const music = allMusic[i];
      if (!music.audioUrl) {
        const audioUrl = sampleUrls[i % sampleUrls.length];
        await ctx.db.patch(music._id, { audioUrl });
        updated++;
      }
    }
    
    return { message: `${updated} müzik güncellendi`, updated };
  },
});

// Tüm türleri getir
export const getAllGenres = query({
  args: {},
  handler: async (ctx) => {
    const allMusic = await ctx.db.query("music").collect();
    const genres = [...new Set(allMusic.map((m) => m.genre).filter(Boolean))];
    return genres;
  },
});

// Tüm müzikleri getir (admin için)
export const getAllMusic = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("music").order("desc").collect();
  },
});

// Generate upload URL for music audio files
export const generateAudioUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    return await ctx.storage.generateUploadUrl();
  },
});

// Save uploaded music
export const saveUploadedMusic = mutation({
  args: {
    storageId: v.id("_storage"),
    title: v.string(),
    artist: v.optional(v.string()),
    duration: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Müzik yüklemek için giriş yapmalısınız");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
      .unique();

    if (!user) {
      throw new Error("Kullanıcı bulunamadı");
    }

    const musicId = await ctx.db.insert("music", {
      title: args.title,
      artist: args.artist || "Bilinmeyen Sanatçı",
      storageId: args.storageId,
      duration: args.duration,
      popularity: 50,
      userId: user._id,
    });

    return musicId;
  },
});

// Get user's uploaded music
export const getUserMusic = query({
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

    const userMusic = await ctx.db
      .query("music")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();

    // Add storage URLs to user music
    const musicWithUrls = await Promise.all(
      userMusic.map(async (music) => {
        if (music.storageId) {
          const audioUrl = await ctx.storage.getUrl(music.storageId);
          return { ...music, audioUrl: audioUrl ?? undefined };
        }
        return music;
      })
    );

    return musicWithUrls;
  },
});

// Müziğin ses dosyasını güncelle
export const updateMusicAudio = mutation({
  args: {
    musicId: v.id("music"),
    audioUrl: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.musicId, {
      audioUrl: args.audioUrl,
    });
    return { success: true };
  },
});

// Örnek müzik verileri eklemek için (sadece ilk kurulumda çağrılır)
export const seedMusic = mutation({
  args: {
    force: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    // Force=true ise mevcut müzikleri sil
    if (args.force) {
      const allMusic = await ctx.db.query("music").collect();
      for (const music of allMusic) {
        await ctx.db.delete(music._id);
      }
    } else {
      // Mevcut müzikleri kontrol et
      const existing = await ctx.db.query("music").first();
      if (existing) {
        return { message: "Müzikler zaten mevcut", count: 0 };
      }
    }

    const sampleMusic = [
      // Pop - Demo amaçlı sample audio URL'leri
      { title: "Blinding Lights", artist: "The Weeknd", genre: "Pop", popularity: 98, duration: 200, albumArt: "🌟", audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3" },
      { title: "Levitating", artist: "Dua Lipa", genre: "Pop", popularity: 95, duration: 203, albumArt: "✨", audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3" },
      { title: "Peaches", artist: "Justin Bieber", genre: "Pop", popularity: 92, duration: 198, albumArt: "🍑", audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3" },
      { title: "Stay", artist: "The Kid LAROI", genre: "Pop", popularity: 94, duration: 141, albumArt: "💫", audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3" },
      { title: "As It Was", artist: "Harry Styles", genre: "Pop", popularity: 96, duration: 167, albumArt: "🎵", audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3" },
      
      // Turkish Pop
      { title: "Belalım", artist: "Murat Boz", genre: "Turkish Pop", popularity: 88, duration: 214, albumArt: "🇹🇷", audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-6.mp3" },
      { title: "Aşk Laftan Anlamaz", artist: "Buray", genre: "Turkish Pop", popularity: 85, duration: 234, albumArt: "❤️", audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-7.mp3" },
      { title: "İkimiz", artist: "Simge", genre: "Turkish Pop", popularity: 83, duration: 187, albumArt: "💕", audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3" },
      { title: "Sevdim", artist: "Gökhan Özen", genre: "Turkish Pop", popularity: 80, duration: 245, albumArt: "💘", audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-9.mp3" },
      { title: "Yüz Bin Kez", artist: "Murat Boz", genre: "Turkish Pop", popularity: 87, duration: 223, albumArt: "🎤", audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-10.mp3" },
      { title: "Vazgeçilmezim", artist: "Tarkan", genre: "Turkish Pop", popularity: 92, duration: 256, albumArt: "⭐", audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3" },
      { title: "Şımarık", artist: "Tarkan", genre: "Turkish Pop", popularity: 95, duration: 245, albumArt: "💋", audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3" },
      { title: "Kuzu Kuzu", artist: "Tarkan", genre: "Turkish Pop", popularity: 89, duration: 234, albumArt: "🐑", audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3" },
      { title: "Kedi Gibi", artist: "Işın Karaca", genre: "Turkish Pop", popularity: 84, duration: 198, albumArt: "🐱", audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3" },
      { title: "Yalnızlık Paylaşılmaz", artist: "Mustafa Sandal", genre: "Turkish Pop", popularity: 86, duration: 267, albumArt: "🎭", audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3" },
      { title: "Akılsız", artist: "Ajda Pekkan", genre: "Turkish Pop", popularity: 82, duration: 278, albumArt: "👑", audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-6.mp3" },
      { title: "Unutama Beni", artist: "Hadise", genre: "Turkish Pop", popularity: 87, duration: 189, albumArt: "💫", audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-7.mp3" },
      { title: "Düm Tek Tek", artist: "Hadise", genre: "Turkish Pop", popularity: 90, duration: 176, albumArt: "🎵", audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3" },
      { title: "Yolla", artist: "Tarkan", genre: "Turkish Pop", popularity: 88, duration: 243, albumArt: "🌟", audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-9.mp3" },
      { title: "Aşkın Nur Yengi", artist: "Aşkın Nur Yengi", genre: "Turkish Pop", popularity: 81, duration: 223, albumArt: "✨", audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-10.mp3" },
      { title: "Canımsın", artist: "Demet Akalın", genre: "Turkish Pop", popularity: 85, duration: 212, albumArt: "💖", audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-11.mp3" },
      { title: "Afedersin", artist: "Demet Akalın", genre: "Turkish Pop", popularity: 83, duration: 201, albumArt: "😊", audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-12.mp3" },
      { title: "Aşk", artist: "Sertab Erener", genre: "Turkish Pop", popularity: 88, duration: 234, albumArt: "❤️", audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-13.mp3" },
      { title: "Everyway That I Can", artist: "Sertab Erener", genre: "Turkish Pop", popularity: 91, duration: 187, albumArt: "🏆", audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-14.mp3" },
      { title: "Romantik", artist: "Koray Avcı", genre: "Turkish Pop", popularity: 86, duration: 198, albumArt: "🌹", audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-15.mp3" },
      { title: "Senin Yolların", artist: "Koray Avcı", genre: "Turkish Pop", popularity: 84, duration: 213, albumArt: "🛤️", audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-16.mp3" },

      // Hip-Hop/Rap
      { title: "ROCKSTAR", artist: "DaBaby", genre: "Hip-Hop", popularity: 91, duration: 181, albumArt: "🎸", audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-11.mp3" },
      { title: "Savage Love", artist: "Jawsh 685", genre: "Hip-Hop", popularity: 89, duration: 170, albumArt: "💔", audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-12.mp3" },
      { title: "Mood", artist: "24kGoldn", genre: "Hip-Hop", popularity: 90, duration: 140, albumArt: "😎", audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-13.mp3" },
      
      // Turkish Rap
      { title: "Susamam", artist: "Sagopa Kajmer", genre: "Turkish Rap", popularity: 84, duration: 256, albumArt: "🎭", audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-14.mp3" },
      { title: "Gel", artist: "Ezhel", genre: "Turkish Rap", popularity: 86, duration: 189, albumArt: "🔥", audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-15.mp3" },
      { title: "Benim Ol", artist: "Ceza", genre: "Turkish Rap", popularity: 82, duration: 198, albumArt: "👑", audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-16.mp3" },
      { title: "Aylardır", artist: "Ezhel", genre: "Turkish Rap", popularity: 88, duration: 176, albumArt: "🌙", audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3" },
      { title: "Geceler", artist: "Ezhel", genre: "Turkish Rap", popularity: 87, duration: 193, albumArt: "🌃", audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3" },
      { title: "Felaket", artist: "Ezhel", genre: "Turkish Rap", popularity: 85, duration: 201, albumArt: "⚡", audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3" },
      { title: "Holocaust", artist: "Ceza", genre: "Turkish Rap", popularity: 90, duration: 287, albumArt: "🔥", audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3" },
      { title: "Suspus", artist: "Ceza", genre: "Turkish Rap", popularity: 89, duration: 234, albumArt: "🤫", audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3" },
      { title: "Med Cezir", artist: "Ceza", genre: "Turkish Rap", popularity: 83, duration: 267, albumArt: "🌊", audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-6.mp3" },
      { title: "366. Gün", artist: "Sagopa Kajmer", genre: "Turkish Rap", popularity: 86, duration: 298, albumArt: "📅", audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-7.mp3" },
      { title: "Galiba", artist: "Sagopa Kajmer", genre: "Turkish Rap", popularity: 85, duration: 245, albumArt: "🤔", audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3" },
      { title: "Bir Pesimistin Gözyaşları", artist: "Sagopa Kajmer", genre: "Turkish Rap", popularity: 84, duration: 312, albumArt: "😢", audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-9.mp3" },
      { title: "Allame", artist: "Allame", genre: "Turkish Rap", popularity: 81, duration: 223, albumArt: "💎", audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-10.mp3" },
      { title: "Farketmez", artist: "Norm Ender", genre: "Turkish Rap", popularity: 87, duration: 198, albumArt: "🎤", audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-11.mp3" },
      { title: "Kaktüs", artist: "Norm Ender", genre: "Turkish Rap", popularity: 86, duration: 212, albumArt: "🌵", audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-12.mp3" },
      { title: "Mekanın Sahibi", artist: "Norm Ender", genre: "Turkish Rap", popularity: 85, duration: 234, albumArt: "🏠", audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-13.mp3" },
      { title: "Panik Atak", artist: "Şanışer", genre: "Turkish Rap", popularity: 83, duration: 189, albumArt: "😰", audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-14.mp3" },
      { title: "Suç Benim", artist: "Şanışer", genre: "Turkish Rap", popularity: 82, duration: 205, albumArt: "⚖️", audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-15.mp3" },
      { title: "Yalan", artist: "Contra", genre: "Turkish Rap", popularity: 84, duration: 197, albumArt: "🎭", audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-16.mp3" },

      // R&B/Soul
      { title: "Positions", artist: "Ariana Grande", genre: "R&B", popularity: 93, duration: 172, albumArt: "💋", audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3" },
      { title: "Good Days", artist: "SZA", genre: "R&B", popularity: 88, duration: 279, albumArt: "☀️", audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3" },
      { title: "Leave The Door Open", artist: "Bruno Mars", genre: "R&B", popularity: 91, duration: 242, albumArt: "🚪", audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3" },

      // Electronic/Dance
      { title: "Roses", artist: "SAINt JHN", genre: "Electronic", popularity: 87, duration: 166, albumArt: "🌹", audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3" },
      { title: "Head & Heart", artist: "Joel Corry", genre: "Electronic", popularity: 85, duration: 162, albumArt: "💓", audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3" },
      { title: "Breaking Me", artist: "Topic", genre: "Electronic", popularity: 83, duration: 155, albumArt: "💥", audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-6.mp3" },

      // Turkish Arabesque/Folk
      { title: "Ayrılık Vakti", artist: "İbrahim Tatlıses", genre: "Turkish Arabesque", popularity: 79, duration: 267, albumArt: "🎻", audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-7.mp3" },
      { title: "Yıldızların Altında", artist: "Müslüm Gürses", genre: "Turkish Arabesque", popularity: 81, duration: 289, albumArt: "⭐", audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3" },
      { title: "Pencereden", artist: "Orhan Gencebay", genre: "Turkish Folk", popularity: 77, duration: 312, albumArt: "🪕", audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-9.mp3" },
      { title: "Neden", artist: "Müslüm Gürses", genre: "Turkish Arabesque", popularity: 83, duration: 276, albumArt: "💔", audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-10.mp3" },
      { title: "İtirazım Var", artist: "Müslüm Gürses", genre: "Turkish Arabesque", popularity: 82, duration: 298, albumArt: "✊", audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-11.mp3" },
      { title: "Haydar Haydar", artist: "İbrahim Tatlıses", genre: "Turkish Folk", popularity: 85, duration: 234, albumArt: "🎵", audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-12.mp3" },
      { title: "Leylim Ley", artist: "İbrahim Tatlıses", genre: "Turkish Arabesque", popularity: 80, duration: 256, albumArt: "🌙", audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-13.mp3" },
      { title: "Batsın Bu Dünya", artist: "Orhan Gencebay", genre: "Turkish Arabesque", popularity: 84, duration: 298, albumArt: "🌍", audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-14.mp3" },
      { title: "Dil Yarası", artist: "Orhan Gencebay", genre: "Turkish Arabesque", popularity: 81, duration: 287, albumArt: "💬", audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-15.mp3" },
      { title: "Bir Teselli Ver", artist: "Orhan Gencebay", genre: "Turkish Arabesque", popularity: 78, duration: 301, albumArt: "🙏", audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-16.mp3" },
      { title: "Yakarım Canını", artist: "Ferdi Tayfur", genre: "Turkish Arabesque", popularity: 80, duration: 245, albumArt: "🔥", audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3" },
      { title: "Emmoğlu", artist: "Ferdi Tayfur", genre: "Turkish Arabesque", popularity: 79, duration: 267, albumArt: "😢", audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3" },
      { title: "Çeşme", artist: "Bergen", genre: "Turkish Arabesque", popularity: 82, duration: 234, albumArt: "⛲", audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3" },
      { title: "Acıların Kadını", artist: "Bergen", genre: "Turkish Arabesque", popularity: 83, duration: 256, albumArt: "👩", audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3" },
      { title: "Sev Kardeşim", artist: "Selda Bağcan", genre: "Turkish Folk", popularity: 81, duration: 289, albumArt: "✌️", audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3" },
      { title: "İnce İnce Bir Kar Yağar", artist: "Selda Bağcan", genre: "Turkish Folk", popularity: 80, duration: 298, albumArt: "❄️", audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-6.mp3" },

      // Turkish Rock/Alternative
      { title: "Yana Yana", artist: "Duman", genre: "Turkish Rock", popularity: 88, duration: 267, albumArt: "🎸", audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-7.mp3" },
      { title: "Her Şeyi Yak", artist: "Duman", genre: "Turkish Rock", popularity: 87, duration: 234, albumArt: "🔥", audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3" },
      { title: "Haberin Yok Ölüyorum", artist: "Teoman", genre: "Turkish Rock", popularity: 89, duration: 289, albumArt: "💔", audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-9.mp3" },
      { title: "İstanbul İstanbul Olalı", artist: "Teoman", genre: "Turkish Rock", popularity: 86, duration: 298, albumArt: "🏙️", audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-10.mp3" },
      { title: "Gel Ey Seher", artist: "Şebnem Ferah", genre: "Turkish Rock", popularity: 85, duration: 276, albumArt: "🌅", audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-11.mp3" },
      { title: "Sil Baştan", artist: "Şebnem Ferah", genre: "Turkish Rock", popularity: 84, duration: 245, albumArt: "🔄", audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-12.mp3" },
      { title: "Lambaya Püf De", artist: "maNga", genre: "Turkish Rock", popularity: 87, duration: 223, albumArt: "💨", audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-13.mp3" },
      { title: "Cevapsız Sorular", artist: "maNga", genre: "Turkish Rock", popularity: 83, duration: 256, albumArt: "❓", audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-14.mp3" },
      { title: "Alışırım Gözlerimi Kapamaya", artist: "Mor ve Ötesi", genre: "Turkish Rock", popularity: 86, duration: 234, albumArt: "👁️", audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-15.mp3" },
      { title: "Bir Derdim Var", artist: "Mor ve Ötesi", genre: "Turkish Rock", popularity: 85, duration: 267, albumArt: "😔", audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-16.mp3" },

      // Rock/Pop International
      { title: "drivers license", artist: "Olivia Rodrigo", genre: "Rock", popularity: 94, duration: 242, albumArt: "🚗", audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3" },
      { title: "good 4 u", artist: "Olivia Rodrigo", genre: "Rock", popularity: 92, duration: 178, albumArt: "😤", audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3" },

      // Turkish Alternative/Indie
      { title: "Şahane Bir Şey Yaşamak", artist: "Athena", genre: "Turkish Alternative", popularity: 82, duration: 234, albumArt: "✨", audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3" },
      { title: "Yalan Olmasın", artist: "Gece Yolcuları", genre: "Turkish Alternative", popularity: 81, duration: 267, albumArt: "🌙", audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3" },
      { title: "Aşk", artist: "Gülşen", genre: "Turkish Pop", popularity: 87, duration: 198, albumArt: "💕", audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3" },
      { title: "Bangır Bangır", artist: "Gülşen", genre: "Turkish Pop", popularity: 88, duration: 212, albumArt: "🎉", audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-6.mp3" },
      { title: "Sorma Kalbim", artist: "Yıldız Tilbe", genre: "Turkish Pop", popularity: 83, duration: 245, albumArt: "💗", audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-7.mp3" },
      { title: "Delikanlım", artist: "Yıldız Tilbe", genre: "Turkish Pop", popularity: 82, duration: 234, albumArt: "👦", audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3" },
      { title: "Gel", artist: "Barış Manço", genre: "Turkish Rock", popularity: 90, duration: 298, albumArt: "🎭", audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-9.mp3" },
      { title: "Gülpembe", artist: "Barış Manço", genre: "Turkish Rock", popularity: 91, duration: 267, albumArt: "🌸", audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-10.mp3" },
      { title: "Unutamadım", artist: "Aleyna Tilki", genre: "Turkish Pop", popularity: 85, duration: 189, albumArt: "💫", audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-11.mp3" },
      { title: "Cevapsız Çınlama", artist: "Aleyna Tilki", genre: "Turkish Pop", popularity: 84, duration: 176, albumArt: "📱", audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-12.mp3" },
      { title: "Sor", artist: "Edis", genre: "Turkish Pop", popularity: 83, duration: 203, albumArt: "❓", audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-13.mp3" },
      { title: "Çok Çok", artist: "Edis", genre: "Turkish Pop", popularity: 82, duration: 198, albumArt: "💯", audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-14.mp3" },
      { title: "Yar Ağlama", artist: "Kenan Doğulu", genre: "Turkish Pop", popularity: 86, duration: 234, albumArt: "😢", audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-15.mp3" },
      { title: "Başka Bir Yerdeyim", artist: "Kenan Doğulu", genre: "Turkish Pop", popularity: 85, duration: 223, albumArt: "🌍", audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-16.mp3" },

      // International
      { title: "Baila Baila Baila", artist: "Ozuna", genre: "Latin", popularity: 86, duration: 192, albumArt: "💃", audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3" },
      { title: "Dakiti", artist: "Bad Bunny", genre: "Latin", popularity: 88, duration: 205, albumArt: "🔊", audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3" },
      { title: "Heat Waves", artist: "Glass Animals", genre: "Indie", popularity: 89, duration: 239, albumArt: "🌊", audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3" },
      { title: "Therefore I Am", artist: "Billie Eilish", genre: "Alternative", popularity: 90, duration: 174, albumArt: "👁️", audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3" },

      // Classical/Instrumental
      { title: "Moonlight Sonata", artist: "Beethoven", genre: "Classical", popularity: 75, duration: 324, albumArt: "🎹", audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3" },
      { title: "Canon in D", artist: "Pachelbel", genre: "Classical", popularity: 73, duration: 298, albumArt: "🎼", audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-6.mp3" },
      { title: "Üsküdar'a Gider İken", artist: "Geleneksel", genre: "Turkish Folk", popularity: 78, duration: 234, albumArt: "🚣", audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-7.mp3" },
      { title: "Kâtibim", artist: "Geleneksel", genre: "Turkish Folk", popularity: 77, duration: 256, albumArt: "✍️", audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3" },
    ];

    let count = 0;
    for (const music of sampleMusic) {
      await ctx.db.insert("music", music);
      count++;
    }

    return { message: "Müzikler başarıyla eklendi", count };
  },
});
