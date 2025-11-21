import { query } from "./_generated/server";

export const getFirstAidGuides = query({
  args: {},
  handler: async () => {
    return {
      emergencyNumbers: {
        title: "Acil Durum Numaraları",
        numbers: [
          { name: "Acil Sağlık", number: "112", description: "Ambulans ve acil sağlık hizmetleri" },
          { name: "İtfaiye", number: "110", description: "Yangın ve kurtarma" },
          { name: "Polis", number: "155", description: "Güvenlik ve asayiş" },
          { name: "Jandarma", number: "156", description: "Kırsal alan güvenliği" },
          { name: "AFAD", number: "122", description: "Afet ve acil durum yönetimi" },
          { name: "Zehir Danışma", number: "114", description: "Zehirlenme vakaları" }
        ]
      },
      situations: [
        {
          id: "cpr",
          title: "Temel Yaşam Desteği (CPR)",
          icon: "heart",
          color: "red",
          urgency: "critical",
          steps: [
            {
              title: "1. Durumu Değerlendirin",
              description: "Kişinin bilinci ve solunumu olup olmadığını kontrol edin. Yanıt yoksa hemen 112'yi arayın."
            },
            {
              title: "2. Göğüs Kompresyonları",
              description: "Kişiyi sert bir zemine sırtüstü yatırın. İki elinizi göğüs kemiğinin ortasına yerleştirin. Dakikada 100-120 tempoda, 5-6 cm derinliğinde bastırın."
            },
            {
              title: "3. Solunum Desteği",
              description: "30 göğüs kompresyonundan sonra 2 kez yapay solunum yapın. Kişinin başını geriye yatırın, çenesini kaldırın ve burnunu kapatarak ağzından nefes verin."
            },
            {
              title: "4. Tekrarlayın",
              description: "Ambulans gelene veya kişi kendine gelene kadar 30 kompresyon + 2 solunum döngüsünü tekrarlayın."
            }
          ],
          warnings: [
            "CPR sırasında kaburgalar kırılabilir, ancak bu yaşamsal önemdedir.",
            "Çocuklarda tek elle, bebeklerde iki parmakla kompresyon yapın.",
            "Mümkünse AED (otomatik kalp şok cihazı) kullanın."
          ]
        },
        {
          id: "bleeding",
          title: "Kanama",
          icon: "droplet",
          color: "red",
          urgency: "high",
          steps: [
            {
              title: "1. Baskı Uygulayın",
              description: "Temiz bir bez veya gazlı bez ile kanayan bölgeye doğrudan baskı uygulayın. Baskıyı en az 10 dakika sürdürün."
            },
            {
              title: "2. Yarayı Yükseltin",
              description: "Mümkünse kanayan bölgeyi kalp seviyesinin üstüne kaldırın. Bu kan akışını yavaşlatır."
            },
            {
              title: "3. Basınç Noktaları",
              description: "Kol veya bacakta şiddetli kanama varsa, damarın üstündeki basınç noktasına basın."
            },
            {
              title: "4. Turnike (Son Çare)",
              description: "Çok şiddetli kanama durumunda, kol veya bacağın yaranın üstüne sıkıca turnike bağlayın ve saati not edin."
            }
          ],
          warnings: [
            "Yaranın içindeki cismi çıkarmayın, çevresine basınç uygulayın.",
            "Turnike yalnızca hayatı tehdit eden kanamalarda kullanılmalıdır.",
            "Kan donmuyorsa veya kanama durmuyorsa 112'yi arayın."
          ]
        },
        {
          id: "burn",
          title: "Yanık",
          icon: "flame",
          color: "orange",
          urgency: "medium",
          steps: [
            {
              title: "1. Yanma Kaynağını Uzaklaştırın",
              description: "Kişiyi ateş, sıcak su, elektrik vb. yanma kaynağından hemen uzaklaştırın."
            },
            {
              title: "2. Soğuk Su ile Soğutun",
              description: "Yanık bölgeyi akan soğuk su altında 10-20 dakika tutun. Buz veya çok soğuk su kullanmayın."
            },
            {
              title: "3. Yanık Bölgeyi Örtün",
              description: "Temiz, nemli bir bezle yanık bölgeyi örtün. Pamuk kullanmayın."
            },
            {
              title: "4. Ağrı Kesici",
              description: "Gerekirse ağrı kesici ilaç verin. Ciddi yanıklarda mutlaka hastaneye başvurun."
            }
          ],
          warnings: [
            "Yanık bölgeye diş macunu, yoğurt, yumurta gibi şeyler sürmeyin.",
            "Kabarcıkları patlatmayın.",
            "Elektrik yanığında önce elektriği kesin.",
            "Yüzde, ellerde veya genital bölgede yanık varsa hemen hastaneye gidin."
          ]
        },
        {
          id: "fracture",
          title: "Kırık / Çıkık",
          icon: "bone",
          color: "gray",
          urgency: "medium",
          steps: [
            {
              title: "1. Hareketsiz Tutun",
              description: "Yaralı bölgeyi hareket ettirmeyin. Mümkün olduğunca kişiyi bulunduğu yerde tutun."
            },
            {
              title: "2. Atel Yapın",
              description: "Sert bir cisim (tahta, karton) kullanarak kırık bölgeyi sabitleyin. Atel eklem üstü ve altını kaplamalıdır."
            },
            {
              title: "3. Soğuk Uygulama",
              description: "Şişmeyi azaltmak için buz torbası veya soğuk kompres uygulayın (bezle sarılı)."
            },
            {
              title: "4. Yüksekte Tutun",
              description: "Mümkünse yaralı bölgeyi kalp seviyesinin üstünde tutun."
            }
          ],
          warnings: [
            "Kırık veya çıkmış kemiği yerine koymaya çalışmayın.",
            "Boyun veya sırt yaralanması şüphesi varsa kesinlikle hareket ettirmeyin.",
            "Açık kırıklarda (kemik dışarı çıkmışsa) yaraya dokunmayın, üzerini temiz bezle örtün."
          ]
        },
        {
          id: "fainting",
          title: "Bayılma",
          icon: "user-x",
          color: "purple",
          urgency: "medium",
          steps: [
            {
              title: "1. Yere Yatırın",
              description: "Kişiyi düz bir yere sırtüstü yatırın. Bacaklarını 20-30 cm kaldırın (şok pozisyonu)."
            },
            {
              title: "2. Havayı Açın",
              description: "Sıkı giysileri gevşetin. Hava akışını sağlayın."
            },
            {
              title: "3. Yan Yatırın",
              description: "Kişi kusmaya başlarsa veya bilinci kapalıysa kurtarma pozisyonuna (yan yatar) getirin."
            },
            {
              title: "4. Bekleyin",
              description: "Kişi 1-2 dakika içinde kendine gelmezse 112'yi arayın."
            }
          ],
          warnings: [
            "Bayılan kişiye su veya yiyecek vermeyin.",
            "Tokatlama, sallama gibi davranışlardan kaçının.",
            "Hamile, yaşlı veya kalp hastası kişilerde mutlaka doktora başvurun."
          ]
        },
        {
          id: "choking",
          title: "Boğulma (Nefes Tıkanması)",
          icon: "wind",
          color: "blue",
          urgency: "critical",
          steps: [
            {
              title: "1. Öksürmeye Teşvik Edin",
              description: "Kişi öksürüyorsa müdahale etmeyin, öksürmesine izin verin."
            },
            {
              title: "2. Sırt Darbeleri",
              description: "Kişi öksüremiyorsa, vücudunu öne eğin ve kürek kemikleri arasına 5 kez sert vurun."
            },
            {
              title: "3. Heimlich Manevrası",
              description: "Arkadan sarılın. Göbek ile göğüs kafesi arasına yumruğunuzu yerleştirin. 5 kez içe ve yukarı doğru sert bastırın."
            },
            {
              title: "4. Tekrarlayın",
              description: "Cisim çıkana kadar 5 sırt darbesi + 5 Heimlich manevrası döngüsünü tekrarlayın."
            }
          ],
          warnings: [
            "Hamile ve obez kişilerde göğüs bölgesine bastırın.",
            "Bebeklerde Heimlich yapılmaz, sırt darbeleri ve göğüs bastırması yapılır.",
            "Kişi bilincini kaybederse CPR uygulayın."
          ]
        },
        {
          id: "poisoning",
          title: "Zehirlenme",
          icon: "alert-triangle",
          color: "green",
          urgency: "high",
          steps: [
            {
              title: "1. Zehir Kaynağını Belirleyin",
              description: "Kişinin ne içtiğini veya yediğini öğrenin. İlaç kutusunu, bitkiyi veya ürün etiketini yanınıza alın."
            },
            {
              title: "2. 114'ü Arayın",
              description: "Zehir Danışma Merkezi'ni (114) veya 112'yi hemen arayın. Uzman yönlendirmesini bekleyin."
            },
            {
              title: "3. Ağzı Çalkalayın",
              description: "Kişinin bilinci açıksa ağzını su ile çalkalayın. Yutmasına izin vermeyin."
            },
            {
              title: "4. Kusturma Yapmayın",
              description: "Uzman tavsiyesi olmadan kusturmaya çalışmayın. Bu durumu daha kötü hale getirebilir."
            }
          ],
          warnings: [
            "Temizlik maddeleri, yakıt, asit-baz maddelerinde asla kusturmayın.",
            "Süt, zeytinyağı gibi evde bulunan 'panzehir' vermeyin.",
            "Bilinci kapalı kişiye ağızdan hiçbir şey vermeyin.",
            "Kişinin solunum durumunu sürekli kontrol edin."
          ]
        },
        {
          id: "shock",
          title: "Elektrik Çarpması",
          icon: "zap",
          color: "yellow",
          urgency: "critical",
          steps: [
            {
              title: "1. Elektriği Kesin",
              description: "Önce elektrik kaynağını kapatın veya prizden çekin. Kişiye dokunmayın!"
            },
            {
              title: "2. Güvenli Şekilde Ayırın",
              description: "Kuru tahta veya plastik gibi iletken olmayan bir cisimle kişiyi elektrikten ayırın."
            },
            {
              title: "3. 112'yi Arayın",
              description: "Hemen 112'yi arayın. Yüksek voltaj durumunda kesinlikle yaklaşmayın."
            },
            {
              title: "4. İlk Yardım Uygulayın",
              description: "Kişinin bilinci ve solunumu varsa yanık bölgeleri kontrol edin. Yoksa CPR başlatın."
            }
          ],
          warnings: [
            "Elektrik hala aktifken kişiye dokunmayın, siz de şok olabilirsiniz.",
            "Islak eller veya su birikintisindeyken elektrikli cihazlara dokunmayın.",
            "Görünürde yaralanma olmasa bile mutlaka hastaneye götürün.",
            "Yüksek voltaj hatlarına minimum 10 metre uzaktan yaklaşmayın."
          ]
        }
      ],
      firstAidKit: {
        title: "İlk Yardım Çantasında Bulunması Gerekenler",
        items: [
          { category: "Yara Bakımı", items: ["Steril gazlı bez", "Yara bandı (çeşitli boyutlarda)", "Antiseptik solüsyon", "Elastik sargı", "Yara temizleme mendili", "Makas ve cımbız"] },
          { category: "İlaçlar", items: ["Ağrı kesici (parasetamol)", "Ateş düşürücü", "Antihistaminik (alerji için)", "Yanık merhemi", "Göz damlası"] },
          { category: "Ekipmanlar", items: ["Dijital termometre", "Tek kullanımlık eldiven", "Güvenlik iğnesi", "Pinset", "El feneri", "Acil telefon numaraları listesi"] },
          { category: "Özel Durumlar", items: ["CPR yüz maskesi", "Soğuk-sıcak kompres", "Turnike veya basınç bandajı", "Koruyucu maske"] }
        ],
        notes: [
          "İlk yardım çantanızı herkesin görebileceği, ulaşılabilir bir yerde saklayın.",
          "Son kullanma tarihlerini düzenli kontrol edin.",
          "Arabanızda ve evinizde ayrı birer ilk yardım çantası bulundurun.",
          "Çocukların ulaşamayacağı bir yerde muhafaza edin."
        ]
      },
      generalRules: {
        title: "İlk Yardımda Genel Kurallar",
        dos: [
          "Sakin kalın ve durumu değerlendirin",
          "Önce kendi güvenliğinizi sağlayın",
          "Gerekirse hemen 112'yi arayın",
          "Kişiyi rahatlatın ve teselli edin",
          "Yapabildiğiniz kadarını yapın, müdahale etmekten korkmayın",
          "Kişinin durumunu sürekli kontrol edin",
          "Mümkünse başka birine yardım çağırmasını söyleyin"
        ],
        donts: [
          "Emin olmadığınız müdahaleleri yapmayın",
          "Kişiyi gereksiz yere hareket ettirmeyin",
          "Yaralıya yiyecek veya içecek vermeyin (bilinç açık olmadıkça)",
          "Yaralara ilaç veya merhem sürmeyin (yanık hariç)",
          "Kırık kemikleri düzeltmeye çalışmayın",
          "Panik yapmayın ve stres yaratmayın",
          "Yalnız başınıza ağır müdahaleler yapmayın"
        ]
      }
    };
  },
});
