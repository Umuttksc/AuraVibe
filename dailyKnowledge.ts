import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { ConvexError } from "convex/values";

// Get daily Islamic knowledge based on day of year
export const getDailyKnowledge = query({
  args: {},
  handler: async (ctx) => {
    // Get all knowledge entries
    const allKnowledge = await ctx.db
      .query("dailyIslamicKnowledge")
      .collect();

    if (allKnowledge.length === 0) {
      return null;
    }

    // Get day of year (1-365/366)
    const now = new Date();
    const start = new Date(now.getFullYear(), 0, 0);
    const diff = now.getTime() - start.getTime();
    const oneDay = 1000 * 60 * 60 * 24;
    const dayOfYear = Math.floor(diff / oneDay);

    // Use modulo to cycle through available knowledge
    const index = dayOfYear % allKnowledge.length;
    const sortedKnowledge = allKnowledge.sort((a, b) => a.order - b.order);

    return sortedKnowledge[index];
  },
});

// Add new Islamic knowledge (admin only)
export const addKnowledge = mutation({
  args: {
    title: v.string(),
    content: v.string(),
    category: v.union(
      v.literal("hadis"),
      v.literal("fıkıh"),
      v.literal("siyer"),
      v.literal("ahlak"),
      v.literal("ibadet"),
      v.literal("tarih"),
      v.literal("genel"),
    ),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError({
        message: "User not logged in",
        code: "UNAUTHENTICATED",
      });
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier),
      )
      .unique();

    if (!user) {
      throw new ConvexError({
        message: "User not found",
        code: "NOT_FOUND",
      });
    }

    // Check if user is admin or super admin
    if (user.role !== "admin" && !user.isSuperAdmin) {
      throw new ConvexError({
        message: "You must be an admin to add knowledge",
        code: "FORBIDDEN",
      });
    }

    // Get the next order number
    const allKnowledge = await ctx.db.query("dailyIslamicKnowledge").collect();
    const maxOrder = allKnowledge.reduce(
      (max, k) => Math.max(max, k.order),
      0,
    );

    const knowledgeId = await ctx.db.insert("dailyIslamicKnowledge", {
      title: args.title,
      content: args.content,
      category: args.category,
      order: maxOrder + 1,
    });

    return knowledgeId;
  },
});

// Get all knowledge entries (admin only)
export const getAllKnowledge = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError({
        message: "User not logged in",
        code: "UNAUTHENTICATED",
      });
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier),
      )
      .unique();

    if (!user) {
      throw new ConvexError({
        message: "User not found",
        code: "NOT_FOUND",
      });
    }

    if (user.role !== "admin" && !user.isSuperAdmin) {
      throw new ConvexError({
        message: "You must be an admin to view all knowledge",
        code: "FORBIDDEN",
      });
    }

    const knowledge = await ctx.db
      .query("dailyIslamicKnowledge")
      .collect();

    return knowledge.sort((a, b) => a.order - b.order);
  },
});

// Seed initial Islamic knowledge (auto-runs if database is empty)
export const seedKnowledge = mutation({
  args: {},
  handler: async (ctx) => {
    // Check if already seeded
    const existing = await ctx.db.query("dailyIslamicKnowledge").first();
    if (existing) {
      // Already seeded, return count
      const all = await ctx.db.query("dailyIslamicKnowledge").collect();
      return all.length;
    }

    const knowledgeEntries: Array<{
      title: string;
      content: string;
      category: "hadis" | "fıkıh" | "siyer" | "ahlak" | "ibadet" | "tarih" | "genel";
      order: number;
    }> = [
      {
        title: "Namaz - İslamın Direği",
        content: "Hz. Peygamber (s.a.v) buyurdu: 'Namaz, dinin direğidir. Kim namazı ikame ederse dini ikame etmiş, kim namazı terk ederse dini yıkmış olur.' Namaz, Allah ile kul arasında günde beş defa gerçekleşen manevi bir buluşmadır ve Müslümanın ruhsal gelişimi için vazgeçilmezdir.",
        category: "ibadet",
        order: 1,
      },
      {
        title: "Gıybet - Büyük Günah",
        content: "Allah Teâlâ Kuran-ı Kerim'de buyurur: 'Ey iman edenler! Zannın çoğundan sakının. Çünkü zannın bir kısmı günahtır. Birbirinizin kusurunu araştırmayın. Biriniz diğerinizi arkasından çekiştirmesin. Biriniz ölü kardeşinin etini yemekten hoşlanır mı?' (Hucurat, 12) Gıybet, arkadaşlıkları bozar ve toplumda fitneye sebep olur.",
        category: "ahlak",
        order: 2,
      },
      {
        title: "Sadaka - Malın Bereketi",
        content: "Hz. Peygamber (s.a.v) şöyle buyurmuştur: 'Sadaka malı eksiltmez. Affeden kulun Allah katındaki şerefi artar. Kim Allah için tevazu gösterirse, Allah onu yüceltir.' Sadaka vermek, malın bereketidir ve verilen sadakanın karşılığı katlanarak döner.",
        category: "hadis",
        order: 3,
      },
      {
        title: "Abdest - Taharetin Temeli",
        content: "Hz. Peygamber (s.a.v) buyurdu: 'İman abdest üzeredir.' Abdest, sadece fiziksel temizlik değil, aynı zamanda ruhsal bir arınmadır. Abdestli olmak, meleklerin rahmetine vesile olur ve günah kirlerinden arınmaya yardımcı olur.",
        category: "ibadet",
        order: 4,
      },
      {
        title: "Anne ve Baba Hakkı",
        content: "Allah Teâlâ Kuran-ı Kerim'de buyurur: 'Rabbin, yalnız kendisine kulluk etmenizi ve anne babaya ihsan etmenizi kesin bir şekilde emretti.' (İsra, 23) Anne babaya hürmet, Cennet'e giden yolların en kısasıdır. Özellikle annelere gösterilen sevgi ve saygı, Allah'ın rızasını kazandırır.",
        category: "ahlak",
        order: 5,
      },
      {
        title: "Oruç - Takva Kalkanı",
        content: "Hz. Peygamber (s.a.v) buyurdu: 'Oruç bir kalkandır. Orucunu tutan kişi kötü söz söylemesin ve cahilce hareket etmesin.' Oruç, nefsi terbiye eder, sabır öğretir ve Allah'a yakınlaşmanın önemli bir yoludur. Ramazan ayında tutulan oruç, özellikle değerlidir.",
        category: "ibadet",
        order: 6,
      },
      {
        title: "Hz. Muhammed'in (s.a.v) Doğumu",
        content: "Hz. Muhammed (s.a.v), Miladi 571 yılında Mekke'de, Rebiülevvel ayının 12. gününde Pazartesi günü doğdu. Babası Abdullah, annesi Amine'dir. Küçük yaşta yetim kaldı ve dedesi Abdülmuttalib tarafından büyütüldü. Peygamberliği 40 yaşında Hira Mağarası'nda vahiy almasıyla başladı.",
        category: "siyer",
        order: 7,
      },
      {
        title: "Temizlik İmandandır",
        content: "Hz. Peygamber (s.a.v) buyurdu: 'Temizlik imandandır.' İslam dini, hem bedensel hem de çevresel temizliğe büyük önem verir. Temiz olmak, ibadetlerin kabul şartlarından biridir. Mü'min, her zaman temiz olmaya, güzel kokmaya ve çevresini temiz tutmaya özen göstermelidir.",
        category: "genel",
        order: 8,
      },
      {
        title: "Cuma Namazı - Haftanın Bayramı",
        content: "Allah Teâlâ buyurur: 'Ey iman edenler! Cuma günü namaz için çağrı yapıldığı zaman, hemen Allah'ı anmaya koşun ve alışverişi bırakın.' (Cuma, 9) Cuma namazı erkekler için farzdır ve haftanın en mübarek günüdür. Bu günde dua kabul edilme vakti vardır.",
        category: "ibadet",
        order: 9,
      },
      {
        title: "Güzel Ahlak",
        content: "Hz. Peygamber (s.a.v) buyurdu: 'En hayırlınız, ahlakı en güzel olanınızdır.' İslam'ın temel hedeflerinden biri güzel ahlak sahibi insanlar yetiştirmektir. Güler yüzlü olmak, doğru konuşmak, emanete riayet etmek ve komşulara iyi davranmak güzel ahlakın göstergelerindendir.",
        category: "ahlak",
        order: 10,
      },
      {
        title: "Zekât - Malın Hakkı",
        content: "Zekât, İslam'ın beş şartından biridir. Belirli miktarda mal biriktiren her Müslümanın, yılda bir kez malının %2.5'ini fakirlere vermesi farzdır. Zekât, toplumda sosyal adaleti sağlar, zengin ile fakir arasındaki uçurumu azaltır ve malın bereketini artırır.",
        category: "ibadet",
        order: 11,
      },
      {
        title: "Sabır - Mü'minin Süsü",
        content: "Allah Teâlâ buyurur: 'Ey iman edenler! Sabır ve namazla Allah'tan yardım dileyin. Şüphesiz Allah sabredenlerle beraberdir.' (Bakara, 153) Sabır, zorluklara göğüs germek ve Allah'ın takdirine razı olmaktır. Sabırlı olanlar, dünyada huzur, ahirette ise sonsuz mükâfat bulurlar.",
        category: "ahlak",
        order: 12,
      },
      {
        title: "Kabe'nin İnşası",
        content: "Kabe, Hz. İbrahim (a.s) ve oğlu Hz. İsmail (a.s) tarafından Allah'ın emriyle inşa edilmiştir. Kabe, dünyanın ilk mabedidir ve Müslümanların kıblesidir. Hz. Muhammed (s.a.v) zamanında Kabe'nin etrafındaki putlar kırılmış ve tevhid merkezi haline getirilmiştir.",
        category: "tarih",
        order: 13,
      },
      {
        title: "Dua - İbadetin Özü",
        content: "Hz. Peygamber (s.a.v) buyurdu: 'Dua ibadetin özüdür.' Dua, kulun Allah'a yönelmesi ve O'ndan yardım istemesidir. En makbul dualar, ezanla kamet arası, secde halinde ve yatsı namazı sonrasındadır. Dua ederken samimi olmak ve Allah'tan başkasına sığınmamak gerekir.",
        category: "ibadet",
        order: 14,
      },
      {
        title: "İlim Öğrenmek",
        content: "Hz. Peygamber (s.a.v) buyurdu: 'İlim öğrenmek her Müslüman'a farzdır.' İslam, ilme ve öğrenmeye büyük değer verir. Kuran-ı Kerim'in ilk emri 'Oku'dur. Müslüman, hayatı boyunca öğrenmeye devam etmeli, hem dini hem de dünyevi ilimlerde kendini geliştirmelidir.",
        category: "genel",
        order: 15,
      },
      {
        title: "Hicret - İslam Tarihinin Dönüm Noktası",
        content: "Hz. Peygamber (s.a.v), Mekke'deki baskılardan dolayı 622 yılında Medine'ye hicret etti. Bu olay İslam tarihinin en önemli dönüm noktalarından biridir ve Hicri takvimin başlangıcıdır. Hicret, zorluklar karşısında sebat etmeyi ve Allah'a güvenmeyi öğretir.",
        category: "siyer",
        order: 16,
      },
      {
        title: "Komşu Hakkı",
        content: "Hz. Peygamber (s.a.v) buyurdu: 'Cebrail bana komşu hakkını öyle çok tavsiye etti ki, neredeyse komşuyu varis yapacak sandım.' Komşuya iyi davranmak, onun huzurunu gözetmek ve ihtiyacında yardım etmek Müslümanlığın gereğidir. Komşusu aç iken tok yatan, gerçek mü'min sayılmaz.",
        category: "ahlak",
        order: 17,
      },
      {
        title: "Tevekkül - Allah'a Güven",
        content: "Allah Teâlâ buyurur: 'Kim Allah'a tevekkül ederse, O ona yeter.' (Talak, 3) Tevekkül, elinden geleni yapıp sonucu Allah'a bırakmaktır. Tembellik değil, çalışıp gayret ettikten sonra Allah'ın takdirine razı olmaktır. Hz. Peygamber (s.a.v), 'Deveni bağla, sonra tevekkül et' buyurmuştur.",
        category: "genel",
        order: 18,
      },
      {
        title: "Miraç - Göklere Yükseliş",
        content: "Hz. Peygamber (s.a.v), Recep ayının 27. gecesinde Miraç mucizesini yaşadı. Bu gece Mekke'den Kudüs'e, oradan da göklere yükseldi ve Allah ile konuştu. Bu gece beş vakit namaz farz kılındı. Miraç, Hz. Peygamber'in (s.a.v) üstünlüğünün ve Allah'a yakınlığının göstergesidir.",
        category: "siyer",
        order: 19,
      },
      {
        title: "Şükür - Nimetlerin Artışı",
        content: "Allah Teâlâ buyurur: 'Andolsun, eğer şükrederseniz elbette size nimetimi artırırım.' (İbrahim, 7) Şükür, Allah'ın verdiği nimetlere karşı minnettar olmak ve bunları doğru yerlerde kullanmaktır. Şükreden kulun nimetleri artar, nankörlük eden kulun ise nimetleri eksilir.",
        category: "ahlak",
        order: 20,
      },
      {
        title: "Hayâ - İmanın Şubesi",
        content: "Hz. Peygamber (s.a.v) buyurdu: 'Hayâ imandandır.' Hayâ, utanma duygusu ve edep sahibi olmaktır. Hayâlı insan, hem Allah'tan hem de insanlardan utanarak kötülüklerden uzak durur. Hayâ, tüm güzellikleri beraberinde getirir ve Müslümanın süsüdür.",
        category: "ahlak",
        order: 21,
      },
      {
        title: "Kur'an-ı Kerim'in İnişi",
        content: "Kur'an-ı Kerim, Ramazan ayının Kadir Gecesi'nde Hz. Muhammed'e (s.a.v) indirilmeye başlandı. 23 yıl boyunca parça parça nazil oldu. Kur'an, insanlığın hidayet rehberidir ve her türlü sorunun çözümünü içerir. Her Müslüman'ın Kur'an okumayı öğrenmesi ve onunla amel etmesi gerekir.",
        category: "tarih",
        order: 22,
      },
      {
        title: "İstiğfar - Tövbe ve Bağışlanma",
        content: "Hz. Peygamber (s.a.v) buyurdu: 'Kim istiğfar etmeyi çokça yaparsa, Allah ona her sıkıntıdan çıkış yolu verir, her üzüntüden kurtulma yolu gösterir ve umulmadık yerden rızık verir.' İstiğfar, günahlardan pişmanlık duyup Allah'tan bağışlanma dilemektir.",
        category: "ibadet",
        order: 23,
      },
      {
        title: "Adalet - İslam'ın Temeli",
        content: "Allah Teâlâ buyurur: 'Ey iman edenler! Allah için, hakkı ayakta tutan şahitler olarak adaleti yerine getirin.' (Nisa, 135) Adalet, hak edene hakkını vermek ve kimseye zulmetmemektir. Müslüman, ister kendisine ister başkasına karşı olsun, her zaman adaletten yana olmalıdır.",
        category: "ahlak",
        order: 24,
      },
      {
        title: "Kurban - Takva ve Fedakârlık",
        content: "Kurban, Hz. İbrahim'in (a.s) oğlu Hz. İsmail'i (a.s) Allah rızası için kurban etmeye hazır oluşunun hatırasıdır. Kurban Bayramı'nda kesilen kurban, Allah'a yakınlaşma ve maldan fedakârlık yapmanın sembolüdür. Allah Teâlâ buyurur: 'Onların ne etleri ne de kanları Allah'a ulaşır, ancak sizin takvanız ulaşır.' (Hac, 37)",
        category: "ibadet",
        order: 25,
      },
      {
        title: "Bedir Savaşı - İlk Büyük Zafer",
        content: "Bedir Savaşı, Hicretin 2. yılında (624) Müslümanlar ile Mekke müşrikleri arasında yapıldı. 313 Müslüman, 1000 kişilik müşrik ordusuna karşı Allah'ın yardımıyla zafer kazandı. Bu zafer, İslam'ın yayılmasında önemli bir dönüm noktası oldu ve Müslümanlara moral verdi.",
        category: "tarih",
        order: 26,
      },
      {
        title: "Tevhid - İslam'ın Esası",
        content: "Tevhid, Allah'ın birliğine inanmak ve O'na hiçbir şeyi ortak koşmamaktır. 'Lâ ilâhe illallah' (Allah'tan başka ilah yoktur) sözü, İslam'ın temel prensibidir. Tevhid inancı, tüm ibadetlerin yalnızca Allah için yapılmasını gerektirir.",
        category: "genel",
        order: 27,
      },
      {
        title: "Gece İbadeti - Teheccüd",
        content: "Teheccüd namazı, gece kalkıp Allah'a ibadet etmektir. Hz. Peygamber (s.a.v) buyurdu: 'Gece namazına devam edin. Çünkü o, sizden önceki salih kulların âdetidir, Rabbinize yaklaşma vesilesidir, günahları örten, kötülüklerden alıkoyan bir ameldir.'",
        category: "ibadet",
        order: 28,
      },
      {
        title: "Af ve Müsamaha",
        content: "Hz. Peygamber (s.a.v) buyurdu: 'Mü'min için en güzel huy, affetmektir.' Mekke'nin fethinde bile, kendisine yıllarca işkence edenleri affeden Hz. Peygamber (s.a.v), af ve hoşgörünün en büyük örneğidir. Allah affedenleri sever ve onların derecelerini yükseltir.",
        category: "ahlak",
        order: 29,
      },
      {
        title: "Hac - İslam'ın Direği",
        content: "Hac, İslam'ın beş şartından biridir. Maddi ve bedeni gücü yeten her Müslüman'ın ömründe bir kez Kabe'yi ziyaret etmesi ve hac ibadetini yerine getirmesi farzdır. Hac, tevhid inancının ve Müslümanların birliğinin sembolüdür.",
        category: "ibadet",
        order: 30,
      },
    ];

    for (const entry of knowledgeEntries) {
      await ctx.db.insert("dailyIslamicKnowledge", entry);
    }

    return knowledgeEntries.length;
  },
});
