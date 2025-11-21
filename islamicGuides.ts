import { query, mutation } from "./_generated/server";
import { ConvexError } from "convex/values";
import { v } from "convex/values";

export const getAbdestGuide = query({
  args: {},
  handler: async () => {
    return {
      title: "Abdest Nasıl Alınır?",
      farzSteps: [
        {
          title: "1. Yüzü Yıkamak",
          description: "Yüzün tamamını, alından saçın bittiği yerden çeneye, bir kulaktan diğer kulağa kadar olan kısmı yıkamak farzdır."
        },
        {
          title: "2. Elleri Yıkamak",
          description: "Her iki eli dirseklerle birlikte yıkamak farzdır. Dirsekler de yıkanacak kısma dahildir."
        },
        {
          title: "3. Başın Dörtte Birini Mesh Etmek",
          description: "Başın en az dörtte birine ıslak el ile mesh etmek (sürtmek) farzdır."
        },
        {
          title: "4. Ayakları Yıkamak",
          description: "Her iki ayağı, topuklarla birlikte yıkamak farzdır. Topuklar da yıkanacak kısma dahildir."
        }
      ],
      sunnetSteps: [
        "Niyet etmek ve Besmele çekmek",
        "Elleri bileğe kadar üç kez yıkamak",
        "Misvak kullanmak veya dişleri fırçalamak",
        "Ağza üç kez su almak (mazmaza)",
        "Burna üç kez su çekmek (istinşak)",
        "Başın tamamını mesh etmek",
        "Kulakların içini ve arkasını mesh etmek",
        "Boynu mesh etmek",
        "Organları sırasıyla ve aralıksız yıkamak"
      ],
      notes: [
        "Abdest alırken su israfından kaçınılmalıdır.",
        "Ciltte su geçirmeyecek şeyler (makyaj, oje vb.) olmamalıdır.",
        "Abdestin bozulma sebepleri: küçük ve büyük abdest, bilinç kaybı, uyumak (yaslanmadan), fazla gülmek vb."
      ]
    };
  },
});

export const getGusulGuide = query({
  args: {},
  handler: async () => {
    return {
      title: "Gusül Nasıl Alınır?",
      farzSteps: [
        {
          title: "1. Ağza Su Vermek",
          description: "Ağzın her tarafına su ulaştırmak farzdır. Su boğaza kadar gitmelidir."
        },
        {
          title: "2. Burna Su Çekmek",
          description: "Burnun yumuşak kısmının başına kadar su çekmek farzdır."
        },
        {
          title: "3. Bütün Vücudu Yıkamak",
          description: "Saç diplerine ve vücudun her tarafına su ulaştırmak farzdır. Göbek deliği, kulak delikleri, saç ve sakal altları dahil."
        }
      ],
      sunnetSteps: [
        "Niyet etmek ve Besmele çekmek",
        "Elleri bileğe kadar yıkamak",
        "Avret mahallini yıkamak",
        "Vücuttaki kirleri temizlemek",
        "Namaz abdesti gibi abdest almak",
        "Önce başa, sonra sağ omuza, sonra sol omuza üç kez su dökmek",
        "Bütün vücudu ovmak"
      ],
      mustStates: [
        "Cünüplükten sonra (cinsel ilişki)",
        "İhtilamdan sonra (rüyada meninin gelmesi)",
        "Hayızdan sonra (kadınlar için)",
        "Nifastan sonra (lohusalık, kadınlar için)"
      ],
      notes: [
        "Gusül abdesti tam abdest yerine geçer.",
        "Saçlı deriye su ulaştırmak için saçların iyice ıslatılması gerekir.",
        "Gusül için akan su şart değildir, leğen veya küvette de alınabilir."
      ]
    };
  },
});

export const getPrayerRakahGuide = query({
  args: {},
  handler: async () => {
    return {
      title: "Namazlar Kaç Rekattır?",
      dailyPrayers: [
        {
          name: "Sabah (İmsak) Namazı",
          sunnah: "2 rekat sünnet",
          farz: "2 rekat farz",
          total: "4 rekat",
          note: "Sabah namazının sünneti kaza edilir ve çok önemlidir."
        },
        {
          name: "Öğle Namazı",
          sunnah: "4 rekat ilk sünnet + 2 rekat son sünnet",
          farz: "4 rekat farz",
          total: "10 rekat",
          note: "İlk sünnet kaza edilmez, son sünnet kaza edilir."
        },
        {
          name: "İkindi Namazı",
          sunnah: "4 rekat sünnet",
          farz: "4 rekat farz",
          total: "8 rekat",
          note: "Sünneti kaza edilmez."
        },
        {
          name: "Akşam Namazı",
          sunnah: "2 rekat son sünnet",
          farz: "3 rekat farz",
          total: "5 rekat",
          note: "Akşam namazından sonraki sünnet kaza edilir."
        },
        {
          name: "Yatsı Namazı",
          sunnah: "4 rekat ilk sünnet + 2 rekat son sünnet",
          farz: "4 rekat farz",
          vitir: "3 rekat vitir (vacip)",
          total: "13 rekat",
          note: "Vitir namazı vaciptir ve kaza edilir."
        }
      ],
      specialPrayers: [
        {
          name: "Cuma Namazı",
          description: "4 rekat ilk sünnet + 2 rekat farz + 4 rekat son sünnet + 2 rekat son sünnet = 12 rekat"
        },
        {
          name: "Bayram Namazı",
          description: "2 rekat farz (6 tekbir ile)"
        },
        {
          name: "Teravih Namazı",
          description: "20 rekat sünnet (Ramazan ayında)"
        },
        {
          name: "Cenaze Namazı",
          description: "4 tekbir ile kılınır, rükü ve secde yoktur"
        }
      ],
      notes: [
        "Farz namazlar mutlaka kılınmalı ve kaza edilmelidir.",
        "Sünnet ve nafile namazlar sevaptır, kaza edilmeyenler olabilir.",
        "Vitir namazı vaciptir ve kaza edilir."
      ]
    };
  },
});

export const getPrayerConditions = query({
  args: {},
  handler: async () => {
    return {
      title: "Namazın Farzları ve Şartları",
      conditions: [
        {
          title: "1. Müslüman Olmak",
          description: "Namaz kılabilmek için öncelikle Müslüman olmak gerekir."
        },
        {
          title: "2. Akıllı Olmak",
          description: "Akıl hastası olmamalıdır."
        },
        {
          title: "3. Buluğ Çağına Erişmek",
          description: "Ergenlik çağına gelmiş olmak gerekir. Küçük çocuklara namaz öğretilir."
        },
        {
          title: "4. Temiz Olmak",
          description: "Abdestli veya gusüllü olmak gerekir."
        },
        {
          title: "5. Elbise ve Bedeni Temiz Olmak",
          description: "Üzerindeki elbise ve bedeni necasetten temiz olmalıdır."
        },
        {
          title: "6. Avret Yerlerini Örtmek",
          description: "Erkeklerde göbek ile diz arası, kadınlarda el, ayak ve yüz dışında tüm vücut örtülmelidir."
        },
        {
          title: "7. Namaz Vaktine Riayet Etmek",
          description: "Her namaz kendi vaktinde kılınmalıdır."
        },
        {
          title: "8. Kıbleye Dönmek",
          description: "Namaz kılarken Kabe yönüne (kıbleye) dönülmelidir."
        }
      ],
      farzActions: [
        {
          title: "1. İftitah Tekbiri (Tekbiratu'l-İhram)",
          description: "Namaza 'Allahu Ekber' diyerek başlamak"
        },
        {
          title: "2. Kıyam (Ayakta Durmak)",
          description: "Gücü yeten herkes namazda ayakta durmalıdır"
        },
        {
          title: "3. Kıraat (Kur'an Okumak)",
          description: "Fatiha suresini ve bir sure daha okumak"
        },
        {
          title: "4. Rükû (Eğilmek)",
          description: "Elleri dizlere koyacak şekilde eğilmek"
        },
        {
          title: "5. Secde (Yere Kapanmak)",
          description: "Her rekatta iki defa secde etmek"
        },
        {
          title: "6. Ka'de-i Ahire (Son Oturuş)",
          description: "Namazın son rekatında Ettehiyyatü okumak için oturmak"
        }
      ],
      vacipActions: [
        "Her rekatta Fatiha suresi okumak",
        "Fatiha'dan sonra zamm-ı sure (bir sure veya 3 kısa ayet) okumak",
        "Rükû ve secdede tesbih getirmek",
        "İlk iki rekattan sonra ka'de-i ula (ara oturuş) yapmak",
        "İki secde arasında oturmak",
        "Namazı selam vererek bitirmek"
      ],
      sunnetActions: [
        "Tekbir alırken elleri kaldırmak",
        "Kıyamda sağ eli sol elin üzerine koymak",
        "Subhaneke duasını okumak",
        "Rükûda elleri dizlere koymak",
        "İmamın arkasında 'Amin' demek"
      ]
    };
  },
});

export const getFaithPillars = query({
  args: {},
  handler: async () => {
    return {
      title: "İmanın Şartları",
      pillars: [
        {
          number: 1,
          title: "Allah'a İman",
          description: "Allah'ın varlığına ve birliğine inanmak. O'nun hiçbir ortağı olmadığına, yaratıcı ve yönetici olduğuna, her şeye gücünün yettiğine iman etmek.",
          details: [
            "Allah'ın varlığını kabul etmek",
            "Allah'ın birliğine (tevhid) inanmak",
            "Allah'ın sıfatlarına inanmak",
            "Allah'tan başka ilah olmadığını bilmek"
          ]
        },
        {
          number: 2,
          title: "Meleklere İman",
          description: "Allah'ın nurdan yarattığı, günah işlemeyen, sadece Allah'ın emrini yerine getiren varlıklar olan meleklere inanmak.",
          details: [
            "Cebrail (Vahiy melеği)",
            "Mikail (Rızık melеği)",
            "İsrafil (Sur'a üfleyecek melek)",
            "Azrail (Ölüm melеği)",
            "Kiramen Katibin (Amel defterini yazan melekler)",
            "Münker ve Nekir (Kabir melekleri)"
          ]
        },
        {
          number: 3,
          title: "Kitaplara İman",
          description: "Allah'ın peygamberlerine indirdiği kutsal kitaplara inanmak.",
          details: [
            "Tevrat (Hz. Musa'ya)",
            "Zebur (Hz. Davud'a)",
            "İncil (Hz. İsa'ya)",
            "Kuran-ı Kerim (Hz. Muhammed'e - son ve değişmemiş kitap)"
          ]
        },
        {
          number: 4,
          title: "Peygamberlere İman",
          description: "Allah'ın insanlara doğru yolu göstermek için gönderdiği elçilere inanmak.",
          details: [
            "İlk peygamber: Hz. Adem",
            "Son peygamber: Hz. Muhammed (SAV)",
            "Ulü'l-Azm peygamberler: Hz. Nuh, Hz. İbrahim, Hz. Musa, Hz. İsa, Hz. Muhammed",
            "124.000 peygamber gönderildiğine inanılır"
          ]
        },
        {
          number: 5,
          title: "Ahiret Gününe İman",
          description: "Ölümden sonra dirilişe, hesap gününe, cennet ve cehenneme inanmak.",
          details: [
            "Kabir hayatına inanmak",
            "Kıyamet gününe inanmak",
            "Mahşer ve hesap gününe inanmak",
            "Cennet ve cehennemin varlığına inanmak",
            "Sırat köprüsüne ve mizana inanmak"
          ]
        },
        {
          number: 6,
          title: "Kadere İman",
          description: "İyisiyle kötüsüyle her şeyin Allah'ın bilgisi, dilemesi ve yaratmasıyla olduğuna inanmak.",
          details: [
            "Allah'ın her şeyi bildiğine inanmak",
            "Allah'ın her şeyi yazdığına (Levh-i Mahfuz) inanmak",
            "Allah'ın her şeyi dilediğine inanmak",
            "Allah'ın her şeyi yarattığına inanmak",
            "İnsanın irade hürriyeti olduğunu bilmek"
          ]
        }
      ],
      amintuFormula: "Âmentü billâhi ve melâiketihî ve kütübihî ve rusülihî ve'l-yevmi'l-âhiri ve bi'l-kaderi hayrihî ve şerrihî minallâhi teâlâ ve'l-ba'sü ba'de'l-mevti hakkun eşhedü en lâ ilâhe illallâhu ve eşhedü enne Muhammeden abdühû ve rasûlühü.",
      amintuTranslation: "Allah'a, meleklerine, kitaplarına, peygamberlerine, ahiret gününe, kadere, hayrın ve şerrin Allah'tan geldiğine ve ölümden sonra dirilmeye iman ettim. Şehadet ederim ki Allah'tan başka ilah yoktur ve şehadet ederim ki Muhammed O'nun kulu ve elçisidir."
    };
  },
});

export const getFastingGuide = query({
  args: {},
  handler: async () => {
    return {
      title: "Oruç Rehberi",
      introduction: "Oruç, İslam'ın beş şartından biridir. Ramazan ayında farz olan oruç, Allah rızası için imsak vaktinden akşam ezanına kadar yemek, içmek ve cinsel ilişkiden uzak durmaktır.",
      farzConditions: [
        "Müslüman olmak",
        "Akıllı olmak",
        "Buluğ çağına ermiş olmak",
        "Mukim olmak (yolcu değil)",
        "Gücü yetmek (sağlıklı olmak)",
        "Kadınlar için hayız ve nifas halinde olmamak"
      ],
      pillars: [
        {
          title: "Niyet",
          description: "Her gün için ayrı niyet edilir. Niyet kalple olur, dille söylemek şart değildir. İmsak vaktinden önce niyet edilmelidir."
        },
        {
          title: "Tutmak",
          description: "İmsak vaktinden (sabah namazı vakti) akşam ezanına kadar orucu bozan şeylerden sakınmak."
        }
      ],
      breakingFast: [
        {
          title: "Kasıtlı Yemek veya İçmek",
          description: "Bilerek ve isteyerek ağızdan bir şey yemek veya içmek orucu bozar. Unutarak yiyip içenin orucu bozulmaz.",
          ruling: "Kaza ve kefaret gerekir"
        },
        {
          title: "Cinsel İlişki",
          description: "Oruçlu iken cinsel ilişkide bulunmak orucu bozar ve en ağır durumdur.",
          ruling: "Kaza ve kefaret (60 gün kesintisiz oruç veya 60 fakiri doyurmak) gerekir"
        },
        {
          title: "Kasıtlı Kusma",
          description: "Bilerek ve isteyerek kusmak orucu bozar. Kendiliğinden veya isteği dışında kusanın orucu bozulmaz.",
          ruling: "Sadece kaza gerekir"
        },
        {
          title: "Hayız ve Nifas",
          description: "Kadınların hayız (adet) veya nifas (lohusalık) halinde olması orucu bozar. Bu durumda oruç tutulmaz.",
          ruling: "Ramazan'dan sonra kaza edilir"
        },
        {
          title: "Ağız veya Burundan Bir Şey Yutmak",
          description: "Ağız veya burun yoluyla ilaç, serum, damla gibi herhangi bir şeyin vücuda alınması orucu bozar.",
          ruling: "Kaza gerekir"
        },
        {
          title: "Sigara, Nargile vb.",
          description: "Sigara, nargile veya benzeri şeyleri içmek orucu bozar.",
          ruling: "Kaza gerekir"
        },
        {
          title: "Cünüplük Hali",
          description: "Gece cünüp olan kişi sabaha kadar gusletmese bile orucu tutabilir. Ancak sabah namazı için gusletmek farzdır.",
          ruling: "Oruç geçerlidir, fakat gusül alınmalı"
        }
      ],
      notBreakingFast: [
        {
          title: "Unutarak Yemek veya İçmek",
          description: "Unutarak yiyip içen kişinin orucu bozulmaz. Hatırladığı anda orucuna devam eder."
        },
        {
          title: "İstemsiz Kusma",
          description: "Kendi isteği olmadan kusan kişinin orucu bozulmaz."
        },
        {
          title: "Rüyada Bir Şey Görmek",
          description: "Rüyada yemek, içmek veya başka bir şey görmek orucu bozmaz. Cünüp olmak da orucu bozmaz (gusletmek gerekir)."
        },
        {
          title: "İğne Olmak",
          description: "Kas içi veya damar içi iğne olmak orucu bozmaz. Ancak besleyici serum almak tartışmalıdır, mümkünse kaçınılmalıdır."
        },
        {
          title: "Diş Çektirmek veya Tedavi",
          description: "Diş çektirmek, kan aldırmak veya kan vermek orucu bozmaz. Ancak bir şey yutmamaya dikkat edilmelidir."
        },
        {
          title: "Gözden Damla veya Sürmek",
          description: "Göze damla damlatmak veya sürme çekmek orucu bozmaz. Tadı boğaza gelse bile sorun olmaz."
        },
        {
          title: "Misvak veya Diş Fırçası",
          description: "Misvak kullanmak veya diş fırçalamak (macun yutmamak şartıyla) orucu bozmaz. Ağız kokusu için fırçalanabilir."
        },
        {
          title: "Su ile Serinlemek",
          description: "Sıcaktan bunalma veya temizlik için yıkanmak, duş almak orucu bozmaz."
        },
        {
          title: "Mazmaza ve İstinşak",
          description: "Abdest alırken ağza ve burna aşırı olmadan su vermek orucu bozmaz."
        },
        {
          title: "Tükürük Yutmak",
          description: "Kendi tükürüğünü yutmak orucu bozmaz."
        }
      ],
      excusedGroups: [
        {
          title: "Yolcular",
          description: "Yolculukta olanlar orucu bozabilir, sonra kaza eder."
        },
        {
          title: "Hastalar",
          description: "Oruç tutmakla hastalığı ağırlaşacak veya iyileşmesi gecikecek olanlar orucu bozabilir, sonra kaza eder."
        },
        {
          title: "Hamileler ve Emzirenler",
          description: "Kendilerine veya bebeklerine zarar geleceğinden korkanlar orucu bozabilir, sonra kaza eder veya fidye verir."
        },
        {
          title: "Yaşlılar",
          description: "Sürekli hasta olan veya yaşlılık sebebiyle oruç tutamayan kişiler her gün için bir fidye (fakir yemek yedirmek) verir."
        }
      ],
      suhoorAdvice: [
        "Sahura kalkmak sünnettir",
        "İmsak vaktinden 5-10 dakika önce sahur yapılmalı",
        "Hafif ve tok tutan yiyecekler tercih edilmeli",
        "Bol su içilmeli",
        "Tatlı ve çok tuzlu yiyeceklerden kaçınılmalı"
      ],
      iftarAdvice: [
        "Akşam ezanı okunduğunda hemen iftar edilmeli",
        "Hurma veya su ile iftar etmek sünnettir",
        "Aşırı tok yemekten kaçınılmalı",
        "İftar duası: 'Allahümme leke sumtü ve bike âmentü ve aleyke tevekkeltü ve alâ rızkıke eftartü'"
      ]
    };
  },
});

export const getPrayersAndDhikr = query({
  args: {},
  handler: async () => {
    return {
      title: "Dualar ve Zikirler",
      categories: [
        {
          name: "Sabah-Akşam Duaları",
          prayers: [
            {
              title: "Ayetel Kürsi",
              arabic: "اللَّهُ لاَ إِلَهَ إِلاَّ هُوَ الْحَيُّ الْقَيُّومُ لاَ تَأْخُذُهُ سِنَةٌ وَلاَ نَوْمٌ لَهُ مَا فِي السَّمَاوَاتِ وَمَا فِي الأَرْضِ...",
              turkish: "Allah ki, O'ndan başka ilah yoktur. Diridir, Kayyûm'dur. O'nu ne uyuklama tutabilir ne de uyku..."
            },
            {
              title: "Tesbih",
              arabic: "سُبْحَانَ اللهِ",
              turkish: "Sübhanallah (Allah'ı tesbih ederim) - 33 kez"
            },
            {
              title: "Tahmid",
              arabic: "الْحَمْدُ لِلّهِ",
              turkish: "Elhamdülillah (Hamd Allah'a mahsustur) - 33 kez"
            },
            {
              title: "Tekbir",
              arabic: "اللهُ أَكْبَرُ",
              turkish: "Allahu Ekber (Allah en büyüktür) - 34 kez"
            }
          ]
        },
        {
          name: "Günlük Dualar",
          prayers: [
            {
              title: "Yemek Öncesi",
              arabic: "بِسْمِ اللهِ وَعَلَى بَرَكَةِ اللهِ",
              turkish: "Bismillahi ve alâ bereketi'llah"
            },
            {
              title: "Yemek Sonrası",
              arabic: "الْحَمْدُ لِلّهِ الَّذِي أَطْعَمَنَا وَسَقَانَا وَجَعَلَنَا مُسْلِمِينَ",
              turkish: "Elhamdülillahillezi et'amena ve sekana ve cealena müslimin"
            },
            {
              title: "Yola Çıkarken",
              arabic: "بِسْمِ اللهِ تَوَكَّلْتُ عَلَى اللهِ لاَ حَوْلَ وَلاَ قُوَّةَ إِلاَّ بِاللهِ",
              turkish: "Bismillahi tevekkeltü alellahi la havle vela kuvvete illa billah"
            },
            {
              title: "Eve Girerken",
              arabic: "بِسْمِ اللهِ وَلَجْنَا، وَبِسْمِ اللهِ خَرَجْنَا، وَعَلَى رَبِّنَا تَوَكَّلْنَا",
              turkish: "Bismillahi velejna ve bismillahi harec na ve ala rabbina tevekkelnâ"
            },
            {
              title: "Uyku Öncesi",
              arabic: "بِاسْمِكَ اللَّهُمَّ أَمُوتُ وَأَحْيَا",
              turkish: "Bismike Allahumme emutu ve ehya"
            },
            {
              title: "Uyanınca",
              arabic: "الْحَمْدُ لِلّهِ الَّذِي أَحْيَانَا بَعْدَ مَا أَمَاتَنَا وَإِلَيْهِ النُّشُورُ",
              turkish: "Elhamdülillahillezi ahyana ba'de ma ematena ve ileyhin-nüşur"
            }
          ]
        },
        {
          name: "Özel Durumlar",
          prayers: [
            {
              title: "Sıkıntıda",
              arabic: "لاَ إِلَهَ إِلاَّ أَنْتَ سُبْحَانَكَ إِنِّي كُنْتُ مِنَ الظَّالِمِينَ",
              turkish: "La ilahe illa ente sübhaneke inni küntü minez-zalimin"
            },
            {
              title: "İstiğfar",
              arabic: "أَسْتَغْفِرُ اللهَ الْعَظِيمَ الَّذِي لاَ إِلَهَ إِلاَّ هُوَ الْحَيُّ الْقَيُّومُ وَأَتُوبُ إِلَيْهِ",
              turkish: "Estağfirullahel-azim ellezi la ilahe illa hüvel hayyel kayyume ve etubü ileyh"
            },
            {
              title: "Hasta Ziyareti",
              arabic: "لاَ بَأْسَ طَهُورٌ إِنْ شَاءَ اللهُ",
              turkish: "La be'se tahûrun inşaallah (Zarar yoktur, Allah'ın izniyle temizliktir)"
            }
          ]
        }
      ],
      commonDhikr: [
        {
          text: "سُبْحَانَ اللهِ",
          meaning: "Sübhanallah - Allah noksan sıfatlardan münezzehtir"
        },
        {
          text: "الْحَمْدُ لِلّهِ",
          meaning: "Elhamdülillah - Hamd Allah'a mahsustur"
        },
        {
          text: "اللهُ أَكْبَرُ",
          meaning: "Allahu Ekber - Allah en büyüktür"
        },
        {
          text: "لاَ إِلَهَ إِلاَّ اللهُ",
          meaning: "La ilahe illallah - Allah'tan başka ilah yoktur"
        },
        {
          text: "أَسْتَغْفِرُ اللهَ",
          meaning: "Estağfirullah - Allah'tan bağışlanma dilerim"
        },
        {
          text: "لاَ حَوْلَ وَلاَ قُوَّةَ إِلاَّ بِاللهِ",
          meaning: "La havle vela kuvvete illa billah - Güç ve kuvvet ancak Allah'tandır"
        }
      ]
    };
  },
});

export const getSiyer = query({
  args: {},
  handler: async () => {
    return {
      title: "Hz. Muhammed'in Hayatı (Siyer)",
      periods: [
        {
          title: "Doğum ve Çocukluk (571-583)",
          events: [
            "Mekke'de Rebiyülevvel ayının 12. günü (M.S. 571) Fil Yılı'nda doğdu",
            "Babası Abdullah, doğumundan önce vefat etti",
            "Annesi Amine ile birkaç yıl yaşadı, 6 yaşında annesi vefat etti",
            "Dedesi Abdülmuttalib'in yanında kaldı, 8 yaşında dedesinin vefatı üzerine amcası Ebu Talib'in himayesine girdi",
            "Çocukluğu sırasında çobanlık yaptı"
          ]
        },
        {
          title: "Gençlik ve Evlilik (583-610)",
          events: [
            "Genç yaşta ticaretle uğraşmaya başladı, dürüstlüğüyle 'Muhammed el-Emin' (güvenilir) lakabını aldı",
            "25 yaşındayken Hz. Hatice ile evlendi (Hz. Hatice 40 yaşındaydı)",
            "Mekke'de huzursuzluk ve adaletsizliğe şahit oldu",
            "Hira Mağarası'nda tefekkür ve ibadet etmeye başladı",
            "Kabe'nin Hacer-i Esved taşının yerine konulması olayında adil hakemlik yaptı"
          ]
        },
        {
          title: "Peygamberlik Öncesi Son Yıllar (605-610)",
          events: [
            "Her Ramazan ayında Hira Mağarası'nda inzivaya çekilirdi",
            "Toplumun durumunu düşünür, çözüm arayışlarında bulunurdu",
            "Mekke toplumunun putperestliği onu üzerdi",
            "İbrahim (AS)'ın hanif dinine göre Allah'a ibadet ederdi"
          ]
        },
        {
          title: "Peygamberliğin İlanı (610)",
          events: [
            "40 yaşındayken Hira Mağarası'nda ilk vahiy geldi",
            "Cebrail (AS), 'İkra' (Oku!) emriyle Alak Suresi'nin ilk ayetlerini getirdi",
            "Hz. Hatice ilk müslüman kadın oldu",
            "Hz. Ebu Bekir, Hz. Ali, Hz. Zeyd ilk müslümanlar arasında",
            "Üç yıl gizli davet dönemi başladı"
          ]
        },
        {
          title: "Açık Davet Dönemi (613-619)",
          events: [
            "Mekkelilere açık şekilde İslam'ı tebliğ etmeye başladı",
            "Kureyş'in şiddetli tepkisi ve müşriklerin eziyet ve işkenceleri",
            "Müslümanların bir kısmının Habeşistan'a hicret etmesi",
            "Haşimoğulları ve Mutaliboğulları'nın boykota alınması (3 yıl sürdü)",
            "Hüzün Yılı: Hz. Hatice ve amcası Ebu Talib'in vefatı (619)"
          ]
        },
        {
          title: "Taif Yolculuğu ve Miraç (619-620)",
          events: [
            "Mekke'deki baskılar nedeniyle Taif'e gitti, taşlanarak kovuldu",
            "İsra ve Miraç mucizesi: Mescid-i Haram'dan Mescid-i Aksa'ya ve oradan 7 kat göğe yükseldi",
            "5 vakit namaz farz kılındı",
            "Medine'den gelen hacılara İslam'ı anlattı"
          ]
        },
        {
          title: "Medine'ye Hicret (622)",
          events: [
            "Akabe Biatları ile Medinelilerle anlaşma yapıldı",
            "Müslümanların Medine'ye göç etmeye başlaması",
            "Hz. Muhammed ve Hz. Ebu Bekir'in Mekke'den Medine'ye hicreti",
            "Sevr Mağarası'nda 3 gün saklanma",
            "Medine'ye varış ve ilk mescidi (Mescid-i Nebevi) inşası",
            "Hicret, İslam takviminin başlangıcı oldu"
          ]
        },
        {
          title: "Medine Dönemi (622-632)",
          events: [
            "Müslümanlar ile Medineli Yahudiler arasında Medine Vesikası (ilk yazılı anayasa)",
            "Muhacir ve Ensar arasında kardeşlik tesis edilmesi",
            "Bedir Savaşı (624) - İlk büyük zafer",
            "Uhud Savaşı (625) - Zor bir imtihan",
            "Hendek Savaşı (627) - Hendek kazarak savunma",
            "Hudeybiye Barış Antlaşması (628)",
            "Hayber'in fethi (628)",
            "Mekke'nin Fethi (630) - Kansız fetih",
            "Huneyn, Tebük seferleri",
            "Veda Haccı (632) - Son hutbe"
          ]
        },
        {
          title: "Vefat (632)",
          events: [
            "63 yaşında, Medine'de, Hz. Aişe'nin evinde vefat etti",
            "Mescid-i Nebevi'de Hz. Ebu Bekir ve Hz. Ömer'in yanına defnedildi",
            "Vefatı sırasında 'Namaza riayet edin, ellerinizin altındakilere iyi davranın' dedi",
            "Son sözü: 'Refik-i A'la' (En yüce dost - Allah katı) oldu"
          ]
        }
      ],
      traits: [
        "El-Emin (Güvenilir) - Dürüstlüğü ve güvenilirliğiyle tanınırdı",
        "Tevazu - Alçak gönüllü ve mütevazı bir yaşam sürdü",
        "Merhamet - İnsanlara, hayvanlara ve tüm yaratılmışlara karşı merhametliydi",
        "Adalet - Adil davranır, kimseyi kayırmazdı",
        "Cesaret - Zorluklarla karşı karşıya kalmaktan korkmaz, hakkı savunurdu",
        "Sabır - Karşılaştığı zorluklara karşı sabırlıydı"
      ]
    };
  },
});

export const getEsmaulHusna = query({
  args: {},
  handler: async () => {
    return {
      title: "Esma-ül Hüsna (Allah'ın 99 İsmi)",
      names: [
        { arabic: "اَلرَّحْمٰنُ", turkish: "Er-Rahman", meaning: "Sonsuz merhamet sahibi" },
        { arabic: "اَلرَّحِيمُ", turkish: "Er-Rahim", meaning: "Çok merhametli, bağışlayıcı" },
        { arabic: "اَلْمَلِكُ", turkish: "El-Melik", meaning: "Herşeyin gerçek sahibi" },
        { arabic: "اَلْقُدُّوسُ", turkish: "El-Kuddüs", meaning: "Eksikliklerden uzak" },
        { arabic: "اَلسَّلَامُ", turkish: "Es-Selam", meaning: "Esenlik veren" },
        { arabic: "اَلْمُؤْمِنُ", turkish: "El-Mü'min", meaning: "Güven veren" },
        { arabic: "اَلْمُهَيْمِنُ", turkish: "El-Müheymin", meaning: "Koruyup kollayan" },
        { arabic: "اَلْعَزِيزُ", turkish: "El-Aziz", meaning: "Mutlak güç sahibi" },
        { arabic: "اَلْجَبَّارُ", turkish: "El-Cebbar", meaning: "İstediğini yaptıran" },
        { arabic: "اَلْمُتَكَبِّرُ", turkish: "El-Mütekebbir", meaning: "Büyüklükte eşsiz" },
        { arabic: "اَلْخَالِقُ", turkish: "El-Halik", meaning: "Yaratan" },
        { arabic: "اَلْبَارِئُ", turkish: "El-Bari", meaning: "Yoktan var eden" },
        { arabic: "اَلْمُصَوِّرُ", turkish: "El-Musavvir", meaning: "Şekil veren" },
        { arabic: "اَلْغَفَّارُ", turkish: "El-Gaffar", meaning: "Çok bağışlayan" },
        { arabic: "اَلْقَهَّارُ", turkish: "El-Kahhar", meaning: "Mutlak hüküm sahibi" },
        { arabic: "اَلْوَهَّابُ", turkish: "El-Vehhab", meaning: "Çok bahşeden" },
        { arabic: "اَلرَّزَّاقُ", turkish: "Er-Rezzak", meaning: "Rızık veren" },
        { arabic: "اَلْفَتَّاحُ", turkish: "El-Fettah", meaning: "Açan, fetheden" },
        { arabic: "اَلْعَلِيمُ", turkish: "El-Alim", meaning: "Her şeyi bilen" },
        { arabic: "اَلْقَابِضُ", turkish: "El-Kabız", meaning: "Daraltan" },
        { arabic: "اَلْبَاسِطُ", turkish: "El-Basıt", meaning: "Genişleten" },
        { arabic: "اَلْخَافِضُ", turkish: "El-Hafız", meaning: "Alçaltan" },
        { arabic: "اَلرَّافِعُ", turkish: "Er-Rafi", meaning: "Yükselten" },
        { arabic: "اَلْمُعِزُّ", turkish: "El-Muiz", meaning: "İzzet veren" },
        { arabic: "اَلْمُذِلُّ", turkish: "El-Müzil", meaning: "Zillete düşüren" },
        { arabic: "اَلسَّمِيعُ", turkish: "Es-Semi", meaning: "Her şeyi işiten" },
        { arabic: "اَلْبَصِيرُ", turkish: "El-Basir", meaning: "Her şeyi gören" },
        { arabic: "اَلْحَكَمُ", turkish: "El-Hakem", meaning: "Hüküm veren" },
        { arabic: "اَلْعَدْلُ", turkish: "El-Adl", meaning: "Adil olan" },
        { arabic: "اَللَّطِيفُ", turkish: "El-Latif", meaning: "Lütuf sahibi" },
        { arabic: "اَلْخَبِيرُ", turkish: "El-Habir", meaning: "Her şeyden haberdar" },
        { arabic: "اَلْحَلِيمُ", turkish: "El-Halim", meaning: "Yumuşak davranan" },
        { arabic: "اَلْعَظِيمُ", turkish: "El-Azim", meaning: "Pek büyük" },
        { arabic: "اَلْغَفُورُ", turkish: "El-Gafur", meaning: "Bağışlayan" },
        { arabic: "اَلشَّكُورُ", turkish: "Eş-Şekur", meaning: "Şükredenin karşılığını veren" },
        { arabic: "اَلْعَلِيُّ", turkish: "El-Aliy", meaning: "Yüce" },
        { arabic: "اَلْكَبِيرُ", turkish: "El-Kebir", meaning: "Çok büyük" },
        { arabic: "اَلْحَفِيظُ", turkish: "El-Hafiz", meaning: "Koruyan" },
        { arabic: "اَلْمُقِيتُ", turkish: "El-Mukit", meaning: "Rızık veren" },
        { arabic: "اَلْحَسِيبُ", turkish: "El-Hasib", meaning: "Hesap gören" },
        { arabic: "اَلْجَلِيلُ", turkish: "El-Celil", meaning: "Ululuk sahibi" },
        { arabic: "اَلْكَرِيمُ", turkish: "El-Kerim", meaning: "Çok cömert" },
        { arabic: "اَلرَّقِيبُ", turkish: "Er-Rakib", meaning: "Her şeyi gözeten" },
        { arabic: "اَلْمُجِيبُ", turkish: "El-Mucib", meaning: "Duayı kabul eden" },
        { arabic: "اَلْوَاسِعُ", turkish: "El-Vasi", meaning: "Geniş olan" },
        { arabic: "اَلْحَكِيمُ", turkish: "El-Hakim", meaning: "Hüküm ve hikmet sahibi" },
        { arabic: "اَلْوَدُودُ", turkish: "El-Vedud", meaning: "Çok seven" },
        { arabic: "اَلْمَجِيدُ", turkish: "El-Mecid", meaning: "Şeref sahibi" },
        { arabic: "اَلْبَاعِثُ", turkish: "El-Bais", meaning: "Yeniden dirilten" },
        { arabic: "اَلشَّهِيدُ", turkish: "Eş-Şehid", meaning: "Şahit olan" },
        { arabic: "اَلْحَقُّ", turkish: "El-Hakk", meaning: "Hak olan" },
        { arabic: "اَلْوَكِيلُ", turkish: "El-Vekil", meaning: "İşleri yürüten" },
        { arabic: "اَلْقَوِيُّ", turkish: "El-Kaviy", meaning: "Çok güçlü" },
        { arabic: "اَلْمَتِينُ", turkish: "El-Metin", meaning: "Sağlam" },
        { arabic: "اَلْوَلِيُّ", turkish: "El-Veliy", meaning: "Dost" },
        { arabic: "اَلْحَمِيدُ", turkish: "El-Hamid", meaning: "Övülmeye layık" },
        { arabic: "اَلْمُحْصِى", turkish: "El-Muhsi", meaning: "Her şeyi sayan" },
        { arabic: "اَلْمُبْدِئُ", turkish: "El-Mubdi", meaning: "Başlatan" },
        { arabic: "اَلْمُعِيدُ", turkish: "El-Muid", meaning: "Yeniden var eden" },
        { arabic: "اَلْمُحْيِى", turkish: "El-Muhyi", meaning: "Dirilten" },
        { arabic: "اَلْمُمِيتُ", turkish: "El-Mumit", meaning: "Öldüren" },
        { arabic: "اَلْحَىُّ", turkish: "El-Hayy", meaning: "Diri olan" },
        { arabic: "اَلْقَيُّومُ", turkish: "El-Kayyum", meaning: "Kendi kendine var olan" },
        { arabic: "اَلْوَاجِدُ", turkish: "El-Vacid", meaning: "Bulup bulan" },
        { arabic: "اَلْمَاجِدُ", turkish: "El-Macid", meaning: "Şan ve şeref sahibi" },
        { arabic: "اَلْوَاحِدُ", turkish: "El-Vahid", meaning: "Bir olan" },
        { arabic: "اَلصَّمَدُ", turkish: "Es-Samed", meaning: "Hiçbir şeye muhtaç olmayan" },
        { arabic: "اَلْقَادِرُ", turkish: "El-Kadir", meaning: "Güç yetiren" },
        { arabic: "اَلْمُقْتَدِرُ", turkish: "El-Muktedir", meaning: "Tam güç sahibi" },
        { arabic: "اَلْمُقَدِّمُ", turkish: "El-Mukaddim", meaning: "Öne alan" },
        { arabic: "اَلْمُؤَخِّرُ", turkish: "El-Muahhir", meaning: "Geriye bırakan" },
        { arabic: "اَلأَوَّلُ", turkish: "El-Evvel", meaning: "İlk olan" },
        { arabic: "اَلآخِرُ", turkish: "El-Ahır", meaning: "Son olan" },
        { arabic: "اَلظَّاهِرُ", turkish: "Ez-Zahir", meaning: "Açık olan" },
        { arabic: "اَلْبَاطِنُ", turkish: "El-Batın", meaning: "Gizli olan" },
        { arabic: "اَلْوَالِى", turkish: "El-Vali", meaning: "Yöneten" },
        { arabic: "اَلْمُتَعَالِى", turkish: "El-Müteali", meaning: "Yüksek" },
        { arabic: "اَلْبَرُّ", turkish: "El-Berr", meaning: "İyilik eden" },
        { arabic: "اَلتَّوَّابُ", turkish: "Et-Tevvab", meaning: "Tevbeleri kabul eden" },
        { arabic: "اَلْمُنْتَقِمُ", turkish: "El-Müntakim", meaning: "İntikam alan" },
        { arabic: "اَلْعَفُوُّ", turkish: "El-Afüvv", meaning: "Affeden" },
        { arabic: "اَلرَّؤُفُ", turkish: "Er-Rauf", meaning: "Şefkatli" },
        { arabic: "مَالِكُ الْمُلْكِ", turkish: "Malik-ül Mülk", meaning: "Mülkün sahibi" },
        { arabic: "ذُو الْجَلَالِ وَالْإِكْرَامِ", turkish: "Zül-Celali vel-İkram", meaning: "Celal ve ikram sahibi" },
        { arabic: "اَلْمُقْسِطُ", turkish: "El-Muksıt", meaning: "Adil davranan" },
        { arabic: "اَلْجَامِعُ", turkish: "El-Cami", meaning: "Bir araya getiren" },
        { arabic: "اَلْغَنِىُّ", turkish: "El-Ganiy", meaning: "Zengin, muhtaç olmayan" },
        { arabic: "اَلْمُغْنِى", turkish: "El-Muğni", meaning: "Zenginleştiren" },
        { arabic: "اَلْمَانِعُ", turkish: "El-Mani", meaning: "Engelleyen" },
        { arabic: "اَلضَّارُّ", turkish: "Ed-Darr", meaning: "Zarar veren" },
        { arabic: "اَلنَّافِعُ", turkish: "En-Nafi", meaning: "Fayda veren" },
        { arabic: "اَلنُّورُ", turkish: "En-Nur", meaning: "Nur" },
        { arabic: "اَلْهَادِى", turkish: "El-Hadi", meaning: "Doğru yolu gösteren" },
        { arabic: "اَلْبَدِيعُ", turkish: "El-Bedi", meaning: "Eşsiz yaratan" },
        { arabic: "اَلْبَاقِى", turkish: "El-Baki", meaning: "Ebedi" },
        { arabic: "اَلْوَارِثُ", turkish: "El-Varis", meaning: "Varis olan" },
        { arabic: "اَلرَّشِيدُ", turkish: "Er-Reşid", meaning: "Doğru yol gösteren" },
        { arabic: "اَلصَّبُورُ", turkish: "Es-Sabur", meaning: "Sabreden" }
      ]
    };
  },
});

export const getIslamicStories = query({
  args: {},
  handler: async () => {
    // Tüm hikayeler
    const allStories = [
      {
        title: "Güvercin ve Örümcek",
        summary: "Hz. Muhammed'in hicret sırasında Sevr Mağarası'nda nasıl korunduğu",
        story: "Hz. Muhammed ve Hz. Ebu Bekir, Mekke'den Medine'ye hicret ederlerken kendilerini takip edenlerden kaçarak Sevr Mağarası'na sığındılar. Müşrikler mağaranın girişine kadar geldi. Ancak Allah'ın hikmeti ile mağaranın girişinde bir örümcek ağ örmüş, bir güvercin de yuva yapıp yumurtlamıştı. Müşrikler 'Burada kimse olmaz, çünkü örümcek ağı ve kuş yuvası bozulmamış' diyerek geçip gittiler. Bu olay, Allah'ın Peygamberini nasıl koruduğunun en güzel örneklerindendir.",
        lesson: "Allah, kullarını en beklenmedik şekillerde korur. O'na güvenmek ve tevekkül etmek gerekir."
      },
      {
        title: "Hz. Ömer'in Adaleti",
        summary: "Hz. Ömer'in valilik yaptığı dönemde gösterdiği adalet örneği",
        story: "Hz. Ömer, Mısır valisi Amr ibn As'ın oğlu ile bir Kıpti (Mısırlı Hristiyan) arasında yaşanan bir olayda adaleti sağlamıştır. Vali oğlu, yarışta kendisini geçen Kıpti'yi dövmüştü. Kıpti, Hz. Ömer'e şikayet edince, Hz. Ömer vali oğlunu Medine'ye getirtti ve Kıpti'nin yanında 'Vur azadın oğluna!' diyerek adaleti sağladı. Sonra meşhur sözünü söyledi: 'Ne zamandan beri insanları kul ediniyorsunuz, oysa onlar hür doğmuşlardır!'",
        lesson: "İslam'da herkes eşittir. Zengin-fakir, güçlü-güçsüz fark etmez. Adalet herkes için geçerlidir."
      },
      {
        title: "Hz. Ebu Hureyre'nin İlim Aşkı",
        summary: "Hz. Ebu Hureyre'nin ilim öğrenmek için nasıl fedakarlık yaptığı",
        story: "Hz. Ebu Hureyre, Hz. Peygamber'in yanında uzun süre kalıp hadisleri ezberlemeye çalışırdı. O kadar fakir bir yaşam sürüyordu ki, bazen açlıktan yere düşerdi. Bir gün Hz. Peygamber ona cübbesini sererken 'Bu cübbeyi sana veriyorum, ama içine yerleştirdiğim ilmi asla kaybetmeyeceksin' buyurmuştu. Hz. Ebu Hureyre bu sözden sonra hiç unutmaz olmuş ve 5374 hadis rivayet etmiştir.",
        lesson: "İlim öğrenmek için fedakarlık yapmak gerekir. İlim en değerli hazinedir."
      },
      {
        title: "Kabe'nin Taşının Yerine Konması",
        summary: "Hz. Muhammed'in peygamberlik öncesi hakemliği",
        story: "Kabe yeniden inşa edilirken, Hacer-i Esved'in (Kabe'nin köşe taşı) yerine kim koyacak tartışması çıktı. Her kabile bu şerefi kendisi için istiyordu ve kavga çıkmak üzereydi. Aralarında anlaşarak 'Yarın sabah ilk gelen kişi hakem olsun' dediler. İlk gelen Hz. Muhammed oldu. O, bir çarşaf getirip taşı ortasına koydu ve her kabileden bir temsilcinin çarşafın bir ucundan tutmasını istedi. Birlikte taşı kaldırıp yerine yaklaştırdılar, son dokunuşu Hz. Muhammed yaptı. Böylece büyük bir kan dökülmesi önlendi.",
        lesson: "Anlaşmazlıklarda akıllıca çözümler bulmak, herkesin mutlu olmasını sağlar."
      },
      {
        title: "Ashab-ı Kehf (Mağara Arkadaşları)",
        summary: "İmanlarını korumak için mağaraya sığınan gençler",
        story: "Zulüm döneminde yaşayan bir grup genç mümin, putlara tapmayı reddettiler. Kral onları öldürmek isteyince, Allah'a sığınarak bir mağaraya saklandılar. Allah onları derin bir uykuya yatırdı. 309 yıl uyuduktan sonra uyandıklarında, şehir değişmiş, herkes mümin olmuştu. Onların hikayesi Kehf Suresi'nde anlatılır.",
        lesson: "İman için fedakarlık yapmak gerekir. Allah müminleri korur ve zaferle mükafatlandırır."
      },
      {
        title: "Hz. Yusuf ve Sabır",
        summary: "Hz. Yusuf'un kardeşlerinin kıskançlığı ve sabırla zafer kazanması",
        story: "Hz. Yusuf, kardeşleri tarafından kuyuya atıldı, köle olarak satıldı, haksız yere hapse girdi. Ama sabrettı ve Allah'a güvendi. Sonunda Mısır'ın hazinedarı oldu. Kardeşleri açlıktan yardım istemeye geldiğinde onları affetti ve 'Bugün size kınama yok, Allah sizi bağışlasın' dedi.",
        lesson: "Sabır ve Allah'a tevekkül, zaferin anahtarıdır. Bağışlamak, intikam almaktan daha değerlidir."
      },
      {
        title: "Hz. İbrahim'in İmtihanı",
        summary: "Hz. İbrahim'in oğlu Hz. İsmail'i kurban etme emrini alması",
        story: "Hz. İbrahim rüyasında oğlu İsmail'i kurban etmesi emrini aldı. Rüyalar peygamberler için vahiydir. Hz. İbrahim bu zor emri yerine getirmek için oğluna durumu anlattı. Hz. İsmail 'Babacığım, emredileni yap, inşallah beni sabredenlerden bulacaksın' dedi. İkisi de Allah'ın emrine teslim oldular. Tam kurban edecekken Allah, Hz. İbrahim'in sadakatini gördü ve onun yerine bir koç gönderdi. Bu olay, Kurban Bayramı'nın temelini oluşturur.",
        lesson: "Allah'ın emirlerine tam teslimiyet ve güven göstermek en yüce imandır."
      },
      {
        title: "Hz. Musa ve Sabırlı Köle",
        summary: "Hz. Musa'nın Hızır ile yolculuğu ve sabır dersi",
        story: "Hz. Musa, kendisine Allah'tan özel bilgi verilmiş Hızır (Hızır) ile yolculuğa çıktı. Yolculukta Hızır üç garip davranış sergiledi: Gemiye zarar verdi, masum bir çocuğu öldürdü ve misafir olmadıkları bir köyde duvarı onardı. Hz. Musa her seferinde sabırsızlık gösterdi. Sonunda Hızır açıkladı: Gemiyi zayıflatarak zalim kraldan korudu, çocuğun yerine salih bir çocuk gelecekti, duvarın altında yetim çocuklara ait hazine vardı. Hz. Musa, görünenin ardındaki hikmeyi görerek sabır dersini aldı.",
        lesson: "Allah'ın hikmetini anlayamayabiliriz, ama O her şeyi en iyi bilendir. Sabırlı olmak gerekir."
      },
      {
        title: "Ashab-ı Suffe'nin Fedakarlığı",
        summary: "Mescid-i Nebevi'de yaşayan fakir sahabeler",
        story: "Ashab-ı Suffe, Medine'de hiçbir malları olmayan, Mescid-i Nebevi'nin bir köşesinde yaşayan fakirlerdi. Gündüzleri ilim öğrenir, geceleri ibadet ederlerdi. Hz. Peygamber onlara özel ilgi gösterir, sahabelerin getirdiği yiyecekleri önce onlara verirdi. Bir gün Hz. Peygamber elinde bir tas süt getirdi ve Hz. Ebu Hureyre'ye 'Git, Ashab-ı Suffe'yi çağır' dedi. Hz. Ebu Hureyre çok açtı ama önce herkese ikram etti, en son kendisi içti. Herkes doydu ve tas hala doluydu.",
        lesson: "Başkalarını kendinden önce düşünmek (isar) en yüce ahlaktır. Allah cömertleri sever."
      },
      {
        title: "Hz. Eyyub'un Sabrı",
        summary: "Hz. Eyyub'un hastalığa karşı gösterdiği sabır",
        story: "Hz. Eyyub, zengin ve sağlıklı bir peygamberdi. Allah onu imtihan etti: Çocukları öldü, malları yok oldu, vücudu hastalıklara tutuldu. Yıllarca acı çekti, herkes ondan uzaklaştı. Ama Hz. Eyyub hiç şikayet etmedi, sadece Allah'a dua etti: 'Rabbim, bana zarar dokundu, Sen merhametlilerin en merhametlisisin.' Allah duasını kabul etti, sağlığını, malını, çocuklarını iki katına çıkardı. Hz. Eyyub'un sabır ve tevekkülü Kuran'da örnek gösterilir.",
        lesson: "Zorluklarda sabır ve Allah'a dua etmek, kurtuluşun anahtarıdır."
      },
      {
        title: "Bilal-i Habeşi'nin İmanı",
        summary: "Hz. Bilal'in işkenceye rağmen imanını koruyuşu",
        story: "Hz. Bilal, Mekke'de köle olarak yaşayan Habeşli bir Müslümandı. Efendisi Ümeyye bin Halef, onun müslüman olduğunu öğrenince dehşetli işkenceler yaptı. Sıcak çölde sırtına büyük taşlar koydu, 'Muhammed'in dininden vazgeç!' diye bağırdı. Hz. Bilal sadece 'Ehad, Ehad!' (Allah bir, Allah bir!) diyordu. Hz. Ebu Bekir onu satın alarak azat etti. Hz. Bilal, İslam'ın ilk müezzini oldu ve Kabe'nin çatısında ilk ezanı okudu.",
        lesson: "İman için her türlü zorluğa katlanmak, gerçek sadakatin göstergesidir."
      },
      {
        title: "Hz. Hatice'nin Desteği",
        summary: "Hz. Hatice'nin Hz. Peygamber'e olan desteği",
        story: "Hz. Muhammed ilk vahyi aldığında korkmuş ve titreyen bedeniyle eve döndü. Hz. Hatice onu sarıp 'Üzülme, Allah seni asla utandırmaz. Çünkü sen akrabana iyilik eder, doğru söyler, emanete hıyanet etmez, zayıfları korur, misafire ikram eder, zorluklara karşı insanlara yardım edersin' dedi. Sonra onu Varaka bin Nevfel'e götürdü. Varaka 'O peygamberdir, ona vahiy gelmiştir' dedi. Hz. Hatice, İslam'ın ilk müslüman kadını ve Hz. Peygamber'in en büyük destekçisi oldu.",
        lesson: "Eşlerin birbirine destek olması, hayatın her zorluğunu aşmanın yoludur."
      },
      {
        title: "Eshab-ı Kiram'ın Bedir Zaferi",
        summary: "Bedir Savaşı'nda az sayıda müslümanın kazandığı zafer",
        story: "Bedir Savaşı'nda 313 müslüman, 1000 kişilik müşrik ordusuna karşı çıktı. Müslümanlar zayıf, açlık ve yoksulluk içindeydi. Hz. Peygamber geceleyin uzun uzun dua etti: 'Allah'ım! Bu küçük topluluk helak olursa, Sana kulluk eden kimse kalmaz!' Allah meleklerle yardım etti. Savaş müslümanların zaferiyle sonuçlandı. Müşriklerden 70 kişi öldü, 70 kişi esir alındı. Bu zafer, müslümanların gücünü gösterdi ve İslam'ın yayılmasında dönüm noktası oldu.",
        lesson: "Allah'a güvenen ve doğruluk yolunda olanlar, sayıca az da olsalar zafere ulaşır."
      },
      {
        title: "Hz. Osman'ın Cömertliği",
        summary: "Hz. Osman'ın Tebük Seferi için yaptığı büyük yardım",
        story: "Tebük Seferi için ordu hazırlanırken Müslümanlar çok yoksuldu. Hz. Peygamber 'Bu orduya yardım eden için cennet vardır' dedi. Hz. Osman, 950 deve, 50 at ve büyük miktarda altın bağışladı. Hz. Peygamber çok sevindi ve 'Osman'a bundan sonra yaptığı hiçbir şey zarar vermez!' buyurdu. Hz. Osman'ın bu cömertliği ve fedakarlığı, onun 'Zünnureyn' (İki Nur Sahibi) lakabını almasına vesile oldu.",
        lesson: "Allah yolunda cömertlik göstermek, en değerli yatırımdır."
      },
      {
        title: "Uhud'da Hz. Hamza'nın Şehitliği",
        summary: "Hz. Hamza'nın Uhud'da şehit oluşu ve Hz. Peygamber'in üzüntüsü",
        story: "Uhud Savaşı'nda Hz. Peygamber'in amcası Hz. Hamza, İslam'ın en büyük savaşçılarından biriydi. Vahşi adlı bir köle, Hz. Hamza'yı mızrakla vurarak şehit etti. Savaş sonrası Hz. Peygamber şehitleri ziyaret etti. Hz. Hamza'nın cesedinin parçalandığını görünce çok üzüldü ve 'Allah'ın melekleri seni göğe götürüyor' diye dua etti. Hz. Hamza'yı 'Şehitlerin Efendisi' olarak andı.",
        lesson: "Allah yolunda canını veren şehitler, en yüce makamdadır."
      },
      {
        title: "Hz. Ali'nin Cesareti",
        summary: "Hz. Ali'nin Hayber kalesinin kapısını sökmesi",
        story: "Hayber kalesi müslümanların önünde sağlam bir engeldi. Hz. Peygamber 'Yarın bayrağı, Allah ve Resulünü seven, Allah ve Resulü'nün de sevdiği bir kimseye vereceğim' buyurdu. Ertesi gün bayrağı Hz. Ali'ye verdi. Hz. Ali, savaşta öyle cesaret gösterdi ki, Hayber kalesinin kapısını söküp bir kalkan gibi kullandı. Savaş müslümanların zaferiyle sonuçlandı. Hz. Ali'nin cesareti ve sadakati hep örnek gösterildi.",
        lesson: "Cesaret ve sadakat, Allah'ın sevgisini kazanmanın yoludur."
      },
      {
        title: "Hz. Fatıma'nın Tevazusu",
        summary: "Hz. Fatıma'nın zorluklara rağmen şikayet etmeyişi",
        story: "Hz. Fatıma, Hz. Peygamber'in sevgili kızıydı. Hz. Ali ile evlendikten sonra çok zorlu bir hayat yaşadılar. Hz. Fatıma eliyle değirmen çeker, su taşır, yemek yapardı. Elleri su toplamıştı. Bir gün Hz. Peygamber'e 'Esir geldi, bana bir cariye verir misin?' diye sordu. Hz. Peygamber 'Sana daha hayırlı bir şey öğreteyim mi? Yatarken 33 Sübhanallah, 33 Elhamdülillah, 34 Allahu Ekber de' buyurdu. Hz. Fatıma bunu hiç aksatmadı.",
        lesson: "Zikir ve sabır, dünya zorluklarını aşmanın en güzel yoludur."
      },
      {
        title: "Hz. Zeyd'in Fedakarlığı",
        summary: "Hz. Zeyd'in özgürlüğü seçmeyip Hz. Peygamber'in yanında kalması",
        story: "Hz. Zeyd, çocukken köle olarak satılmış ve Hz. Hatice tarafından Hz. Peygamber'e hediye edilmişti. Yıllar sonra babası ve amcası onu aramaya geldi ve 'Oğlum gel, seninle beraber döneceğiz' dedi. Hz. Peygamber 'Zeyd'e sorun, isterse gitsin' dedi. Hz. Zeyd 'Ben sizden ayrılmam, siz benim babam ve annemsiniz' diyerek Hz. Peygamber'in yanında kalmayı seçti. Hz. Peygamber onu evlat edindi.",
        lesson: "Gerçek sevgi ve bağlılık, her şeyden üstündür."
      },
      {
        title: "Hz. Ömer'in Halka Hizmeti",
        summary: "Hz. Ömer'in gece vakti halkın durumunu kontrol etmesi",
        story: "Halife Hz. Ömer, gece vakitlerinde kılık değiştirerek şehri gezerdi. Bir gece fakir bir kadının çadırından ağlama sesi duydu. İçeri girdi, kadın 'Çocuklarım aç, su kaynatıyorum ki uyusunlar' dedi. Hz. Ömer hemen saraydan un ve yiyecek getirdi, kendi elleriyle yemek pişirdi ve çocukları doyurdu. Sabaha kadar çocuklarla oynadı. Kadın sonradan 'Halife bizim için neler yaptı!' diye ağladı.",
        lesson: "Liderler, halka hizmet etmek için vardır. Tevazu ve merhamet en büyük güçtür."
      },
      {
        title: "Hz. Aişe'nin İlmi",
        summary: "Hz. Aişe'nin ilim öğrenmesi ve öğretmesi",
        story: "Hz. Aişe, Hz. Peygamber'in eşi ve en bilgili sahabelerdendi. Genç yaşta Hz. Peygamber'le evlendi ve ondan çok şey öğrendi. Hz. Peygamber vefat ettikten sonra 2210 hadis rivayet etti. Sahabe ve tabiun ondan fetvalar alırdı. Bir keresinde 'Resulullah'ın ahlakı Kuran'dı' diyerek Hz. Peygamber'in karakterini özetledi. Hz. Aişe, İslam tarihinin en büyük ilim kadınlarından biridir.",
        lesson: "İlim öğrenmek ve öğretmek, kadın-erkek herkesin görevidir."
      },
      {
        title: "Ashab-ı Bedir'in Vaadi",
        summary: "Bedir gazilerinin Allah katındaki özel yeri",
        story: "Bedir Savaşı'nda savaşan 313 müslüman özel bir makamdaydı. Hz. Peygamber 'Allah Bedir ehline baktı ve 'Dilediğinizi yapın, sizi bağışladım' buyurdu' dedi. Bir gün Hz. Hatıb'ın mektubu Kureyş'e sızdı, sahabe çok kızdı. Hz. Peygamber 'Hatıb Bedir'de savaştı, belki Allah Bedir ehline baktı ve bağışladı' dedi. Bedir gazilerinin günahları affedilmişti.",
        lesson: "Allah yolunda yapılan fedakarlıklar, Allah katında asla unutulmaz."
      },
      {
        title: "Vefadar Köpek Kıssası",
        summary: "Ashab-ı Kehf'in köpeğinin sadakati",
        story: "Ashab-ı Kehf'in yedi genci iman ettiklerinde yanlarında bir de köpekleri vardı. Mağaraya girerlerken köpek de onları takip etti. Gençler 'Bu köpek bizi ele verebilir' diye düşündüler. Ama köpek ısrarla peşlerinden geldi ve mağaranın girişinde bekledi. Allah, o köpeği de 309 yıl uyuttu. Kuran'da onun adı bile (Kıtmir) anılır. Bu köpek, sadakat ve bağlılığın simgesidir.",
        lesson: "Sadakat ve vefa, Allah'ın sevdiği sıfatlardır. Hayvanlar bile bu erdemle ödüllendirilir."
      },
      {
        title: "Hz. Salih'in Devesi",
        summary: "Semud kavminin deveden mucizenin ardından isyan etmesi",
        story: "Hz. Salih, Semud kavmine peygamber olarak gönderildi. Kavim 'Taştan deve çıkar, inanırız' dedi. Allah mucize olarak taştan gebe bir deve çıkardı. Hz. Salih 'Bu deve size Allah'ın ayetidir, ona zarar vermeyin' dedi. Ama Semud kavmi deveyi kestiler. Hz. Salih 'Üç gün sonra azap gelecek' diye uyardı. Üçüncü günün sabahı korkunç bir ses ile kavim helak oldu.",
        lesson: "Allah'ın ayetlerine karşı gelmek, helak olmayı getirir. Azgınlık ve kibir yıkıma yol açar."
      },
      {
        title: "Hz. Süleyman ve Karınca",
        summary: "Hz. Süleyman'ın karıncaların dilini anlaması",
        story: "Hz. Süleyman, ordusuyla yürürken bir karınca vadisine yaklaştılar. Karıncaların kraliçesi 'Ey karıncalar, yuvalarınıza girin, Süleyman ve ordusu sizi fark etmeden ezmesin!' dedi. Hz. Süleyman bu sesi duydu ve gülümsedi. Allah'a şükretti: 'Rabbim, bana ve aileme verdiğin nimetlere şükretmemi nasip et.' Hz. Süleyman, en küçük yaratıkları bile önemsedi.",
        lesson: "Tevazu ve şükür, gerçek büyüklüğün işaretidir. En küçük canlıya bile değer vermek gerekir."
      },
      {
        title: "Hz. Nuh'un Tufanı",
        summary: "Hz. Nuh'un kavmini 950 yıl davet etmesi ve tufan",
        story: "Hz. Nuh, 950 yıl kavmine Allah'a iman etmeyi teklif etti. Kavmi onu deli saydı, taşladı, alay etti. Ama Hz. Nuh sabırla devam etti. Allah 'Artık kimse iman etmeyecek' diye vahyedince Hz. Nuh'a gemi yapmasını emretti. Gemi tamamlandı, iman edenler gemiye bindi. Tufan başladı, sadece gemidekilər kurtuldu. Hz. Nuh'un oğlu bile iman etmedi ve boğuldu. Hz. Nuh çok üzüldü ama Allah'ın hikmetine teslim oldu.",
        lesson: "Sabırla davette bulunmak ve Allah'ın hikmetine teslim olmak peygamberlerin yoludur."
      },
      {
        title: "Hz. Yakub'un Sabrı",
        summary: "Hz. Yakub'un oğlu Yusuf'a kavuşmak için gösterdiği sabır",
        story: "Hz. Yakub, oğlu Yusuf'u kaybettikten sonra yıllarca ağladı. Gözleri görmez oldu. Ama Allah'a olan inancını hiç kaybetmedi. Oğullarına 'Yusuf'u ve kardeşini aramaya gidin, Allah'ın rahmetinden ümit kesmeyin' dedi. Yıllar sonra oğlu Yusuf'un gömleğini aldı, yüzüne sürdü ve tekrar görmeye başladı. Mısır'a gidip Yusuf'a kavuştu. Allah sabrını ödüllendirdi.",
        lesson: "Allah'a ümitle bağlanmak ve sabretmek, her zorluğun çaresidir."
      },
      {
        title: "Hz. Hud ve Ad Kavmi",
        summary: "Ad kavminin azgınlığı ve Hz. Hud'un uyarıları",
        story: "Ad kavmi güçlü ve zengin bir kavimdi. Büyük binalar yaptılar, putlara taptılar, zayıfları ezdiler. Hz. Hud onları uyardı: 'Allah'a kulluk edin, kibirlenmekten ve zulümden vazgeçin!' Ama kavim dinlemedi, Hz. Hud'a saldırdı. Allah onlara kuraklık gönderdi, sonra korkunç bir fırtınayla 7 gün 7 gece kavmi yerle bir etti. Sadece Hz. Hud ve iman edenler kurtuldu.",
        lesson: "Kibir ve azgınlık, helakın sebebidir. Allah'ın uyarılarını dinlemek şarttır."
      },
      {
        title: "Hz. Yunus ve Balık",
        summary: "Hz. Yunus'un balığın karnında tevbe etmesi",
        story: "Hz. Yunus, kavmine İslam'ı tebliğ etti ama kimse inanmadı. Kızarak şehri terk etti. Bir gemiye bindi, fırtına çıkınca kura çekildi ve Hz. Yunus denize atıldı. Büyük bir balık onu yuttu. Balığın karnında karanlıkta Allah'a yalvardı: 'La ilahe illa ente sübhaneke inni küntü minezzalimin' (Senden başka ilah yoktur, Sen münezzehsin, ben zalimlerden oldum). Allah onu bağışladı, balık onu karaya çıkardı.",
        lesson: "Tevbe kapısı her zaman açıktır. Allah'a samimi yönelenleri bağışlar."
      },
      {
        title: "Hz. İsa'nın Mucizeleri",
        summary: "Hz. İsa'nın Allah'ın izniyle gösterdiği mucizeler",
        story: "Hz. İsa, Allah'ın izniyle birçok mucize gösterdi: Ölüleri diriltir, körlerin gözlerini açar, cüzamlıları iyileştirirdi. Çamurdan kuş şeklini yapıp üflediğinde kuş uçardı. Bir gün havariler 'Rabbinden bize sofra indirmesini iste' dediler. Allah gökten sofralar indirdi. Hz. İsa 'Ben Allah'ın kuludur, bana kulluk etmeyin' diyordu. Ama insanlar onu tanrılaştırdı. Hz. İsa'yı öldürmek istediler, Allah onu göğe yükseltti.",
        lesson: "Mucizeler Allah'ın kudretindendir. Hiçbir peygamber Allah'ın ortağı değildir."
      },
      {
        title: "Mekke'nin Fethi ve Af",
        summary: "Hz. Peygamber'in Mekke'yi fethedip herkesi affetmesi",
        story: "Mekke 20 yıl boyunca müslümanlara zulüm yapmıştı. Hz. Peygamber 10.000 kişilik orduyla Mekke'yi fethetti. Kureyşliler korkuyla beklerken Hz. Peygamber Kabe'nin kapısında durdu ve sordu: 'Size ne yapacağımı sanıyorsunuz?' Onlar 'Kerim kardeş, kerim kardeşin oğlusun' dediler. Hz. Peygamber 'Bugün size kınama yok, gidin hepiniz özgürsünüz!' dedi. Düşmanlarını affetti, kimseye zarar vermedi.",
        lesson: "Af ve merhamet, en büyük zaferdir. İntikam almak yerine bağışlamak asil davranıştır."
      },
      {
        title: "Vedâ Hutbesi",
        summary: "Hz. Peygamber'in son hutbesi ve evrensel mesajı",
        story: "Hz. Peygamber, son haccında Arafat'ta 124.000 sahabe önünde hutbe okudu: 'Ey insanlar! Kan ve mal dokunulmazdır. Arap'ın Arap olmayana, beyazın siyaha üstünlüğü yoktur, üstünlük ancak takvadadır. Size iki şey bırakıyorum: Kuran ve Sünnetim. Bugün dininiz kemale erdi. Allah'a hesap vereceksiniz, burada olanlar olmayanlar ulaştırsın!' Sonra sordu: 'Tebliğ ettim mi?' Sahabe 'Evet!' diye bağırdı.",
        lesson: "İslam'ın temel ilkeleri: Adalet, eşitlik, kardeşlik ve hesap günü sorumluluğu."
      }
    ];

    // Günün tarihine göre hikaye seçimi
    const today = new Date();
    const dayOfMonth = today.getDate(); // 1-31 arası
    const storyIndex = (dayOfMonth - 1) % allStories.length;
    const dailyStory = allStories[storyIndex];

    return {
      title: "Günün İslami Hikayesi",
      story: dailyStory,
      storyIndex,
      totalStories: allStories.length,
      currentDay: dayOfMonth,
      allStories
    };
  },
});

export const recordStoryReading = mutation({
  args: {
    storyIndex: v.number(),
    storyTitle: v.string(),
    dayOfMonth: v.number(),
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
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
      .unique();

    if (!user) {
      throw new ConvexError({
        message: "User not found",
        code: "NOT_FOUND",
      });
    }

    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

    // Bugün için kayıt var mı kontrol et
    const existingRecord = await ctx.db
      .query("islamicStoryHistory")
      .withIndex("by_user_and_date", (q) => 
        q.eq("userId", user._id).eq("date", today)
      )
      .unique();

    if (!existingRecord) {
      await ctx.db.insert("islamicStoryHistory", {
        userId: user._id,
        storyIndex: args.storyIndex,
        storyTitle: args.storyTitle,
        date: today,
        dayOfMonth: args.dayOfMonth,
      });
    }

    return { success: true };
  },
});

export const getStoryHistory = query({
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

    // Son 30 gün
    const history = await ctx.db
      .query("islamicStoryHistory")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .order("desc")
      .take(30);

    return history;
  },
});

export const getReligiousDays = query({
  args: {},
  handler: async () => {
    return {
      title: "Dini Günler ve Kandiller",
      religiousDays: [
        {
          name: "Regaib Kandili",
          hijriDate: "Recep ayının ilk Cuma gecesi",
          description: "Recep ayının ilk Cuma gecesidir. Hz. Muhammed'in anne ve babasının evlenmesi ve Hz. Muhammed'in nuru yaratılışı bu geceye denk gelir.",
          significance: "İbadet, dua ve istiğfar gecesidir.",
          worship: ["Namaz kılmak", "Kuran okumak", "Dua etmek", "İstiğfar etmek"]
        },
        {
          name: "Miraç Kandili",
          hijriDate: "Recep ayının 27. gecesi",
          description: "Hz. Muhammed'in Miraç mucizesinin yaşandığı gecedir. Bu gece Peygamberimiz Mescid-i Haram'dan Mescid-i Aksa'ya, oradan da 7 kat göğe yükselmiştir.",
          significance: "5 vakit namaz bu gece farz kılınmıştır.",
          worship: ["Namaz kılmak", "Kuran okumak", "Dua etmek", "Salavat getirmek"]
        },
        {
          name: "Berat Kandili",
          hijriDate: "Şaban ayının 14-15 arası gece",
          description: "Şaban ayının 14. gününü 15. gününe bağlayan gecedir. Bu gece insanların bir yıllık rızık ve ecellerinin yazıldığına inanılır.",
          significance: "Bağışlanma ve af gecesidir.",
          worship: ["Namaz kılmak", "Kuran okumak", "Dua etmek", "İstiğfar etmek", "Kabir ziyareti"]
        },
        {
          name: "Kadir Gecesi",
          hijriDate: "Ramazan'ın son 10 gününde (genellikle 27. gece)",
          description: "Kuran-ı Kerim'in indirilmeye başlandığı gecedir. Bu gece 1000 aydan daha hayırlıdır.",
          significance: "Yılın en değerli gecesidir. Bu gecede yapılan ibadetler 1000 aydan daha değerlidir.",
          worship: ["Gece ibadeti", "Kuran okumak", "Dua etmek", "Tefekkür etmek", "Sadaka vermek"]
        },
        {
          name: "Ramazan Bayramı (Şeker Bayramı)",
          hijriDate: "Şevval ayının 1-3. günleri",
          description: "Ramazan ayı orucundan sonra kutlanan 3 günlük bayramdır.",
          significance: "Oruç ibadetinin tamamlanması ve şükür.",
          traditions: ["Bayram namazı", "Ziyaretleşme", "Sadaka ve fıtır vermek", "Helalleşme"]
        },
        {
          name: "Kurban Bayramı (Arefe Günü)",
          hijriDate: "Zilhicce ayının 9-13. günleri",
          description: "Hac ibadeti ve Hz. İbrahim'in kurban kesme kıssasını anma günleridir. Arefe günü haccın en önemli günüdür.",
          significance: "İbadet, kurban kesme ve paylaşma.",
          traditions: ["Bayram namazı", "Kurban kesmek", "Sadaka", "Ziyaretleşme", "Arefe günü oruç"]
        },
        {
          name: "Aşure Günü",
          hijriDate: "Muharrem ayının 10. günü",
          description: "Hz. Nuh'un gemisinin karaya oturduğu, Hz. Musa'nın kavmini Firavun'dan kurtardığı, Hz. Hüseyin'in şehit edildiği gündür.",
          significance: "Şükür, dua ve oruç günüdür.",
          traditions: ["Oruç tutmak", "Aşure tatlısı yapmak ve dağıtmak", "Sadaka vermek"]
        },
        {
          name: "Hicri Yılbaşı",
          hijriDate: "Muharrem ayının 1. günü",
          description: "Hz. Muhammed'in Mekke'den Medine'ye hicretinin anısına İslam takviminin başlangıcıdır.",
          significance: "Yeni yıl, yeni başlangıç.",
          worship: ["Dua etmek", "Geçmiş yılı değerlendirmek", "Yeni yıl niyetleri"]
        },
        {
          name: "Mevlid Kandili",
          hijriDate: "Rebiyülevvel ayının 12. gecesi",
          description: "Hz. Muhammed'in doğum günüdür.",
          significance: "Peygamberimizi anma ve saygı gösterme gecesidir.",
          worship: ["Mevlit okumak", "Salavat getirmek", "Siyer okumak", "Hayır yapmak"]
        }
      ],
      notes: [
        "Kandil geceleri ibadet, dua ve istiğfar gecesidir",
        "Bu gecelerde gece ibadeti yapılır, Kuran okunur",
        "Kandil günleri oruç tutmak sünnettir",
        "Kabir ziyareti ve sadaka vermek bu günlerde tavsiye edilir"
      ]
    };
  },
});
