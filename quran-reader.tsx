import { useState } from "react";
import { useAction } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import { Card } from "@/components/ui/card.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select.tsx";
import { BookOpen, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge.tsx";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import { toast } from "sonner";

function BookOpenIcon({ className }: { className?: string }) {
  return <BookOpen className={className} />;
}

function Loader2Icon({ className }: { className?: string }) {
  return <Loader2 className={className} />;
}

interface Ayah {
  number: number;
  arabicText: string;
  translation: string;
}

interface SurahInfo {
  number: number;
  name: string;
  arabicName: string;
  revelationType: string;
  numberOfAyahs: number;
}

interface SurahData {
  surahInfo: SurahInfo;
  ayahs: Ayah[];
}

// Tüm sureler listesi
const surahs = [
  { number: 1, name: "Fatiha", arabicName: "الفاتحة", ayahCount: 7, revelationType: "Mekki" },
  { number: 2, name: "Bakara", arabicName: "البقرة", ayahCount: 286, revelationType: "Medeni" },
  { number: 3, name: "Al-i İmran", arabicName: "آل عمران", ayahCount: 200, revelationType: "Medeni" },
  { number: 4, name: "Nisa", arabicName: "النساء", ayahCount: 176, revelationType: "Medeni" },
  { number: 5, name: "Maide", arabicName: "المائدة", ayahCount: 120, revelationType: "Medeni" },
  { number: 6, name: "En'am", arabicName: "الأنعام", ayahCount: 165, revelationType: "Mekki" },
  { number: 7, name: "A'raf", arabicName: "الأعراف", ayahCount: 206, revelationType: "Mekki" },
  { number: 8, name: "Enfal", arabicName: "الأنفال", ayahCount: 75, revelationType: "Medeni" },
  { number: 9, name: "Tevbe", arabicName: "التوبة", ayahCount: 129, revelationType: "Medeni" },
  { number: 10, name: "Yunus", arabicName: "يونس", ayahCount: 109, revelationType: "Mekki" },
  { number: 11, name: "Hud", arabicName: "هود", ayahCount: 123, revelationType: "Mekki" },
  { number: 12, name: "Yusuf", arabicName: "يوسف", ayahCount: 111, revelationType: "Mekki" },
  { number: 13, name: "Ra'd", arabicName: "الرعد", ayahCount: 43, revelationType: "Medeni" },
  { number: 14, name: "İbrahim", arabicName: "ابراهيم", ayahCount: 52, revelationType: "Mekki" },
  { number: 15, name: "Hicr", arabicName: "الحجر", ayahCount: 99, revelationType: "Mekki" },
  { number: 16, name: "Nahl", arabicName: "النحل", ayahCount: 128, revelationType: "Mekki" },
  { number: 17, name: "İsra", arabicName: "الإسراء", ayahCount: 111, revelationType: "Mekki" },
  { number: 18, name: "Kehf", arabicName: "الكهف", ayahCount: 110, revelationType: "Mekki" },
  { number: 19, name: "Meryem", arabicName: "مريم", ayahCount: 98, revelationType: "Mekki" },
  { number: 20, name: "Taha", arabicName: "طه", ayahCount: 135, revelationType: "Mekki" },
  { number: 21, name: "Enbiya", arabicName: "الأنبياء", ayahCount: 112, revelationType: "Mekki" },
  { number: 22, name: "Hacc", arabicName: "الحج", ayahCount: 78, revelationType: "Medeni" },
  { number: 23, name: "Müminun", arabicName: "المؤمنون", ayahCount: 118, revelationType: "Mekki" },
  { number: 24, name: "Nur", arabicName: "النور", ayahCount: 64, revelationType: "Medeni" },
  { number: 25, name: "Furkan", arabicName: "الفرقان", ayahCount: 77, revelationType: "Mekki" },
  { number: 26, name: "Şuara", arabicName: "الشعراء", ayahCount: 227, revelationType: "Mekki" },
  { number: 27, name: "Neml", arabicName: "النمل", ayahCount: 93, revelationType: "Mekki" },
  { number: 28, name: "Kasas", arabicName: "القصص", ayahCount: 88, revelationType: "Mekki" },
  { number: 29, name: "Ankebut", arabicName: "العنكبوت", ayahCount: 69, revelationType: "Mekki" },
  { number: 30, name: "Rum", arabicName: "الروم", ayahCount: 60, revelationType: "Mekki" },
  { number: 31, name: "Lokman", arabicName: "لقمان", ayahCount: 34, revelationType: "Mekki" },
  { number: 32, name: "Secde", arabicName: "السجدة", ayahCount: 30, revelationType: "Mekki" },
  { number: 33, name: "Ahzab", arabicName: "الأحزاب", ayahCount: 73, revelationType: "Medeni" },
  { number: 34, name: "Sebe", arabicName: "سبإ", ayahCount: 54, revelationType: "Mekki" },
  { number: 35, name: "Fatır", arabicName: "فاطر", ayahCount: 45, revelationType: "Mekki" },
  { number: 36, name: "Yasin", arabicName: "يس", ayahCount: 83, revelationType: "Mekki" },
  { number: 37, name: "Saffat", arabicName: "الصافات", ayahCount: 182, revelationType: "Mekki" },
  { number: 38, name: "Sad", arabicName: "ص", ayahCount: 88, revelationType: "Mekki" },
  { number: 39, name: "Zümer", arabicName: "الزمر", ayahCount: 75, revelationType: "Mekki" },
  { number: 40, name: "Mümin", arabicName: "غافر", ayahCount: 85, revelationType: "Mekki" },
  { number: 41, name: "Fussilet", arabicName: "فصلت", ayahCount: 54, revelationType: "Mekki" },
  { number: 42, name: "Şura", arabicName: "الشورى", ayahCount: 53, revelationType: "Mekki" },
  { number: 43, name: "Zuhruf", arabicName: "الزخرف", ayahCount: 89, revelationType: "Mekki" },
  { number: 44, name: "Duhan", arabicName: "الدخان", ayahCount: 59, revelationType: "Mekki" },
  { number: 45, name: "Casiye", arabicName: "الجاثية", ayahCount: 37, revelationType: "Mekki" },
  { number: 46, name: "Ahkaf", arabicName: "الأحقاف", ayahCount: 35, revelationType: "Mekki" },
  { number: 47, name: "Muhammed", arabicName: "محمد", ayahCount: 38, revelationType: "Medeni" },
  { number: 48, name: "Fetih", arabicName: "الفتح", ayahCount: 29, revelationType: "Medeni" },
  { number: 49, name: "Hucurat", arabicName: "الحجرات", ayahCount: 18, revelationType: "Medeni" },
  { number: 50, name: "Kaf", arabicName: "ق", ayahCount: 45, revelationType: "Mekki" },
  { number: 51, name: "Zariyat", arabicName: "الذاريات", ayahCount: 60, revelationType: "Mekki" },
  { number: 52, name: "Tur", arabicName: "الطور", ayahCount: 49, revelationType: "Mekki" },
  { number: 53, name: "Necm", arabicName: "النجم", ayahCount: 62, revelationType: "Mekki" },
  { number: 54, name: "Kamer", arabicName: "القمر", ayahCount: 55, revelationType: "Mekki" },
  { number: 55, name: "Rahman", arabicName: "الرحمن", ayahCount: 78, revelationType: "Medeni" },
  { number: 56, name: "Vakıa", arabicName: "الواقعة", ayahCount: 96, revelationType: "Mekki" },
  { number: 57, name: "Hadid", arabicName: "الحديد", ayahCount: 29, revelationType: "Medeni" },
  { number: 58, name: "Mücadele", arabicName: "المجادلة", ayahCount: 22, revelationType: "Medeni" },
  { number: 59, name: "Haşr", arabicName: "الحشر", ayahCount: 24, revelationType: "Medeni" },
  { number: 60, name: "Mümtehine", arabicName: "الممتحنة", ayahCount: 13, revelationType: "Medeni" },
  { number: 61, name: "Saff", arabicName: "الصف", ayahCount: 14, revelationType: "Medeni" },
  { number: 62, name: "Cuma", arabicName: "الجمعة", ayahCount: 11, revelationType: "Medeni" },
  { number: 63, name: "Münafikun", arabicName: "المنافقون", ayahCount: 11, revelationType: "Medeni" },
  { number: 64, name: "Teğabun", arabicName: "التغابن", ayahCount: 18, revelationType: "Medeni" },
  { number: 65, name: "Talak", arabicName: "الطلاق", ayahCount: 12, revelationType: "Medeni" },
  { number: 66, name: "Tahrim", arabicName: "التحريم", ayahCount: 12, revelationType: "Medeni" },
  { number: 67, name: "Mülk", arabicName: "الملك", ayahCount: 30, revelationType: "Mekki" },
  { number: 68, name: "Kalem", arabicName: "القلم", ayahCount: 52, revelationType: "Mekki" },
  { number: 69, name: "Hakka", arabicName: "الحاقة", ayahCount: 52, revelationType: "Mekki" },
  { number: 70, name: "Mearic", arabicName: "المعارج", ayahCount: 44, revelationType: "Mekki" },
  { number: 71, name: "Nuh", arabicName: "نوح", ayahCount: 28, revelationType: "Mekki" },
  { number: 72, name: "Cin", arabicName: "الجن", ayahCount: 28, revelationType: "Mekki" },
  { number: 73, name: "Müzzemmil", arabicName: "المزمل", ayahCount: 20, revelationType: "Mekki" },
  { number: 74, name: "Müddessir", arabicName: "المدثر", ayahCount: 56, revelationType: "Mekki" },
  { number: 75, name: "Kıyame", arabicName: "القيامة", ayahCount: 40, revelationType: "Mekki" },
  { number: 76, name: "İnsan", arabicName: "الانسان", ayahCount: 31, revelationType: "Medeni" },
  { number: 77, name: "Mürselat", arabicName: "المرسلات", ayahCount: 50, revelationType: "Mekki" },
  { number: 78, name: "Nebe", arabicName: "النبإ", ayahCount: 40, revelationType: "Mekki" },
  { number: 79, name: "Naziat", arabicName: "النازعات", ayahCount: 46, revelationType: "Mekki" },
  { number: 80, name: "Abese", arabicName: "عبس", ayahCount: 42, revelationType: "Mekki" },
  { number: 81, name: "Tekvir", arabicName: "التكوير", ayahCount: 29, revelationType: "Mekki" },
  { number: 82, name: "İnfitar", arabicName: "الإنفطار", ayahCount: 19, revelationType: "Mekki" },
  { number: 83, name: "Mutaffifin", arabicName: "المطففين", ayahCount: 36, revelationType: "Mekki" },
  { number: 84, name: "İnşikak", arabicName: "الإنشقاق", ayahCount: 25, revelationType: "Mekki" },
  { number: 85, name: "Buruc", arabicName: "البروج", ayahCount: 22, revelationType: "Mekki" },
  { number: 86, name: "Tarık", arabicName: "الطارق", ayahCount: 17, revelationType: "Mekki" },
  { number: 87, name: "A'la", arabicName: "الأعلى", ayahCount: 19, revelationType: "Mekki" },
  { number: 88, name: "Gaşiye", arabicName: "الغاشية", ayahCount: 26, revelationType: "Mekki" },
  { number: 89, name: "Fecr", arabicName: "الفجر", ayahCount: 30, revelationType: "Mekki" },
  { number: 90, name: "Beled", arabicName: "البلد", ayahCount: 20, revelationType: "Mekki" },
  { number: 91, name: "Şems", arabicName: "الشمس", ayahCount: 15, revelationType: "Mekki" },
  { number: 92, name: "Leyl", arabicName: "الليل", ayahCount: 21, revelationType: "Mekki" },
  { number: 93, name: "Duha", arabicName: "الضحى", ayahCount: 11, revelationType: "Mekki" },
  { number: 94, name: "İnşirah", arabicName: "الشرح", ayahCount: 8, revelationType: "Mekki" },
  { number: 95, name: "Tin", arabicName: "التين", ayahCount: 8, revelationType: "Mekki" },
  { number: 96, name: "Alak", arabicName: "العلق", ayahCount: 19, revelationType: "Mekki" },
  { number: 97, name: "Kadir", arabicName: "القدر", ayahCount: 5, revelationType: "Mekki" },
  { number: 98, name: "Beyyine", arabicName: "البينة", ayahCount: 8, revelationType: "Medeni" },
  { number: 99, name: "Zelzele", arabicName: "الزلزلة", ayahCount: 8, revelationType: "Medeni" },
  { number: 100, name: "Adiyat", arabicName: "العاديات", ayahCount: 11, revelationType: "Mekki" },
  { number: 101, name: "Karia", arabicName: "القارعة", ayahCount: 11, revelationType: "Mekki" },
  { number: 102, name: "Tekasür", arabicName: "التكاثر", ayahCount: 8, revelationType: "Mekki" },
  { number: 103, name: "Asr", arabicName: "العصر", ayahCount: 3, revelationType: "Mekki" },
  { number: 104, name: "Hümeze", arabicName: "الهمزة", ayahCount: 9, revelationType: "Mekki" },
  { number: 105, name: "Fil", arabicName: "الفيل", ayahCount: 5, revelationType: "Mekki" },
  { number: 106, name: "Kureyş", arabicName: "قريش", ayahCount: 4, revelationType: "Mekki" },
  { number: 107, name: "Maun", arabicName: "الماعون", ayahCount: 7, revelationType: "Mekki" },
  { number: 108, name: "Kevser", arabicName: "الكوثر", ayahCount: 3, revelationType: "Mekki" },
  { number: 109, name: "Kafirun", arabicName: "الكافرون", ayahCount: 6, revelationType: "Mekki" },
  { number: 110, name: "Nasr", arabicName: "النصر", ayahCount: 3, revelationType: "Medeni" },
  { number: 111, name: "Tebbet", arabicName: "المسد", ayahCount: 5, revelationType: "Mekki" },
  { number: 112, name: "İhlas", arabicName: "الإخلاص", ayahCount: 4, revelationType: "Mekki" },
  { number: 113, name: "Felak", arabicName: "الفلق", ayahCount: 5, revelationType: "Mekki" },
  { number: 114, name: "Nas", arabicName: "الناس", ayahCount: 6, revelationType: "Mekki" },
];

export default function QuranReader() {
  const [selectedSurah, setSelectedSurah] = useState<number>(1);
  const [surahData, setSurahData] = useState<SurahData | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const getSurahWithTranslation = useAction(api.quranReader.getSurahWithTranslation);

  const currentSurah = surahs.find((s) => s.number === selectedSurah);

  const handleLoadSurah = async () => {
    setIsLoading(true);
    try {
      const data = await getSurahWithTranslation({ surahNumber: selectedSurah });
      setSurahData(data);
    } catch (error) {
      toast.error("Sure yüklenirken bir hata oluştu");
      console.error("Error loading surah:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="overflow-hidden bg-gradient-to-br from-emerald-50 via-teal-50 to-emerald-50 dark:from-emerald-950/20 dark:via-teal-950/20 dark:to-emerald-950/20 border-emerald-200 dark:border-emerald-900">
      <div className="p-6 space-y-6">
        <div className="flex items-center gap-2">
          <BookOpenIcon className="h-5 w-5 text-emerald-700 dark:text-emerald-300" />
          <h3 className="font-semibold text-lg sm:text-xl text-emerald-900 dark:text-emerald-100">
            Kur'an-ı Kerim Oku
          </h3>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Sure Seçin</label>
            <Select
              value={selectedSurah.toString()}
              onValueChange={(value) => setSelectedSurah(Number(value))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="max-h-[400px]">
                {surahs.map((surah) => (
                  <SelectItem key={surah.number} value={surah.number.toString()}>
                    {surah.number}. {surah.name} - {surah.arabicName} ({surah.ayahCount} ayet)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {currentSurah && (
            <Card className="p-4 bg-background/50 border-emerald-200 dark:border-emerald-800">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-semibold text-emerald-900 dark:text-emerald-100">
                      {currentSurah.name} Suresi
                    </h4>
                    <p className="text-2xl font-arabic text-emerald-700 dark:text-emerald-300 mt-1">
                      {currentSurah.arabicName}
                    </p>
                  </div>
                  <Badge
                    variant={currentSurah.revelationType === "Mekki" ? "default" : "secondary"}
                    className="h-fit"
                  >
                    {currentSurah.revelationType}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  {currentSurah.ayahCount} ayet içermektedir
                </p>
              </div>
            </Card>
          )}

          <Button
            onClick={handleLoadSurah}
            className="w-full"
            size="lg"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2Icon className="h-4 w-4 mr-2 animate-spin" />
                Yükleniyor...
              </>
            ) : (
              <>
                <BookOpenIcon className="h-4 w-4 mr-2" />
                Sureyi Göster
              </>
            )}
          </Button>
        </div>

        {/* Ayetler */}
        {isLoading && (
          <div className="space-y-3 mt-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-24 w-full" />
            ))}
          </div>
        )}

        {surahData && !isLoading && (
          <div className="space-y-4 mt-4">
            <div className="flex items-center justify-between pb-2 border-b border-emerald-200 dark:border-emerald-800">
              <h4 className="font-semibold text-emerald-900 dark:text-emerald-100">
                {surahData.surahInfo.name} Suresi
              </h4>
              <Badge variant={surahData.surahInfo.revelationType === "Mekki" ? "default" : "secondary"}>
                {surahData.surahInfo.revelationType}
              </Badge>
            </div>

            {surahData.ayahs.map((ayah) => (
              <Card
                key={ayah.number}
                className="p-4 space-y-3 bg-background/50 border-emerald-200 dark:border-emerald-800"
              >
                <div className="flex items-center justify-between">
                  <Badge variant="outline" className="text-xs">
                    Ayet {ayah.number}
                  </Badge>
                </div>
                <p className="text-right text-2xl leading-loose font-arabic text-emerald-900 dark:text-emerald-100">
                  {ayah.arabicText}
                </p>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {ayah.translation}
                </p>
              </Card>
            ))}
          </div>
        )}
      </div>
    </Card>
  );
}
