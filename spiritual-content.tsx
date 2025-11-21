import { useState, useEffect } from "react";
import { useAction, useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import { Card } from "@/components/ui/card.tsx";
import { Label } from "@/components/ui/label.tsx";
import { Clock, MapPin, BookOpen, Lightbulb, Sparkles, Droplet, Waves, Hash, CheckSquare, Heart, Moon, MessageCircle, Calculator, Hand, Compass, ScrollText, Star, Scroll, Calendar, Volume2 } from "lucide-react";
import ZakatCalculator from "./zakat-calculator.tsx";
import DhikrCounter from "./dhikr-counter.tsx";
import QiblaFinder from "./qibla-finder.tsx";
import QuranReader from "./quran-reader.tsx";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge.tsx";
import { Button } from "@/components/ui/button.tsx";

// Icon wrapper components to prevent DataCloneError
function ClockIcon({ className }: { className?: string }) {
  return <Clock className={className} />;
}

function MapPinIcon({ className }: { className?: string }) {
  return <MapPin className={className} />;
}

function BookOpenIcon({ className }: { className?: string }) {
  return <BookOpen className={className} />;
}

function LightbulbIcon({ className }: { className?: string }) {
  return <Lightbulb className={className} />;
}

function SparklesIcon({ className }: { className?: string }) {
  return <Sparkles className={className} />;
}

function DropletIcon({ className }: { className?: string }) {
  return <Droplet className={className} />;
}

function WavesIcon({ className }: { className?: string }) {
  return <Waves className={className} />;
}

function HashIcon({ className }: { className?: string }) {
  return <Hash className={className} />;
}

function CheckSquareIcon({ className }: { className?: string }) {
  return <CheckSquare className={className} />;
}

function HeartIcon({ className }: { className?: string }) {
  return <Heart className={className} />;
}

function MoonIcon({ className }: { className?: string }) {
  return <Moon className={className} />;
}

function MessageCircleIcon({ className }: { className?: string }) {
  return <MessageCircle className={className} />;
}

function CalculatorIcon({ className }: { className?: string }) {
  return <Calculator className={className} />;
}

function HandIcon({ className }: { className?: string }) {
  return <Hand className={className} />;
}

function CompassIcon({ className }: { className?: string }) {
  return <Compass className={className} />;
}

function ScrollTextIcon({ className }: { className?: string }) {
  return <ScrollText className={className} />;
}

function StarIcon({ className }: { className?: string }) {
  return <Star className={className} />;
}

function ScrollIcon({ className }: { className?: string }) {
  return <Scroll className={className} />;
}

function CalendarIcon({ className }: { className?: string }) {
  return <Calendar className={className} />;
}

function Volume2ComponentIcon({ className }: { className?: string }) {
  return <Volume2 className={className} />;
}

interface PrayerTimesData {
  date: string;
  hijriDate: string;
  timings: {
    fajr: string;
    dhuhr: string;
    asr: string;
    maghrib: string;
    isha: string;
    sunrise: string;
  };
  city: string;
  country: string;
}

interface VerseData {
  arabicText: string;
  text: string;
  surah: string;
  surahNumber: number;
  numberInSurah: number;
  ayahNumber: number;
  revelationPlace: string;
  explanation: string;
  contextOfRevelation: string;
}

type ContentSection = "prayer" | "verse" | "knowledge" | "abdest" | "gusul" | "rakah" | "prayerConditions" | "faith" | "fasting" | "prayers" | "zakat" | "dhikr" | "qibla" | "siyer" | "esmaulhusna" | "stories" | "religiousDays" | "quran" | null;

export default function SpiritualContent() {
  const currentUser = useQuery(api.users.getCurrentUser);
  const dailyKnowledge = useQuery(api.dailyKnowledge.getDailyKnowledge);
  const abdestGuide = useQuery(api.islamicGuides.getAbdestGuide);
  const gusulGuide = useQuery(api.islamicGuides.getGusulGuide);
  const rakahGuide = useQuery(api.islamicGuides.getPrayerRakahGuide);
  const prayerConditionsData = useQuery(api.islamicGuides.getPrayerConditions);
  const faithPillars = useQuery(api.islamicGuides.getFaithPillars);
  const fastingGuide = useQuery(api.islamicGuides.getFastingGuide);
  const prayersAndDhikr = useQuery(api.islamicGuides.getPrayersAndDhikr);
  const siyer = useQuery(api.islamicGuides.getSiyer);
  const esmaulHusna = useQuery(api.islamicGuides.getEsmaulHusna);
  const islamicStories = useQuery(api.islamicGuides.getIslamicStories);
  const storyHistory = useQuery(api.islamicGuides.getStoryHistory);
  const recordStoryReading = useMutation(api.islamicGuides.recordStoryReading);
  const [selectedHistoryIndex, setSelectedHistoryIndex] = useState<number | null>(null);
  const religiousDays = useQuery(api.islamicGuides.getReligiousDays);

  const [prayerTimes, setPrayerTimes] = useState<PrayerTimesData | null>(null);
  const [verse, setVerse] = useState<VerseData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSeeding, setIsSeeding] = useState(false);
  const [activeSection, setActiveSection] = useState<ContentSection>(null);

  // Hikaye okumayı kaydet
  useEffect(() => {
    if (activeSection === "stories" && islamicStories && currentUser) {
      recordStoryReading({
        storyIndex: islamicStories.storyIndex,
        storyTitle: islamicStories.story.title,
        dayOfMonth: islamicStories.currentDay,
      }).catch(console.error);
    }
  }, [activeSection, islamicStories, currentUser, recordStoryReading]);

  const getPrayerTimes = useAction(api.prayer.getPrayerTimes);
  const getDailyVerse = useAction(api.quran.getDailyVerse);
  const seedKnowledge = useMutation(api.dailyKnowledge.seedKnowledge);

  // Auto-seed Islamic knowledge if database is empty
  useEffect(() => {
    const autoSeed = async () => {
      if (dailyKnowledge === null && !isSeeding) {
        setIsSeeding(true);
        try {
          await seedKnowledge();
        } catch (error) {
          console.error("Auto-seed error:", error);
        } finally {
          setIsSeeding(false);
        }
      }
    };

    autoSeed();
  }, [dailyKnowledge, seedKnowledge, isSeeding]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const city = currentUser?.city || "Istanbul";
        const country = currentUser?.country || "Turkey";
        
        const [prayerData, verseData] = await Promise.all([
          getPrayerTimes({ city, country }),
          getDailyVerse(),
        ]);
        setPrayerTimes(prayerData);
        setVerse(verseData);
        console.log("Verse data:", verseData);
      } catch (error) {
        console.error("Spiritual content fetch error:", error);
      } finally {
        setIsLoading(false);
      }
    };

    if (currentUser) {
      fetchData();
    }
  }, [getPrayerTimes, getDailyVerse, currentUser]);

  const getCurrentPrayer = () => {
    if (!prayerTimes) return null;
    
    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();
    
    const prayers = [
      { name: "İmsak", time: prayerTimes.timings.fajr },
      { name: "Güneş", time: prayerTimes.timings.sunrise },
      { name: "Öğle", time: prayerTimes.timings.dhuhr },
      { name: "İkindi", time: prayerTimes.timings.asr },
      { name: "Akşam", time: prayerTimes.timings.maghrib },
      { name: "Yatsı", time: prayerTimes.timings.isha },
    ];

    for (let i = 0; i < prayers.length; i++) {
      const [hours, minutes] = prayers[i].time.split(':').map(Number);
      const prayerTime = hours * 60 + minutes;
      
      if (currentTime < prayerTime) {
        return prayers[i];
      }
    }
    
    return prayers[0];
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-3 gap-2">
          <Skeleton className="h-16 sm:h-20 w-full" />
          <Skeleton className="h-16 sm:h-20 w-full" />
          <Skeleton className="h-16 sm:h-20 w-full" />
        </div>
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  const nextPrayer = getCurrentPrayer();

  return (
    <div className="space-y-4">
      {/* İslami Sohbet - Ayrı Kart */}
      <Link to="/islamic-chat" className="block">
        <Card className="overflow-hidden bg-gradient-to-br from-purple-50 via-indigo-50 to-purple-50 dark:from-purple-950/20 dark:via-indigo-950/20 dark:to-purple-950/20 border-purple-200 dark:border-purple-900 hover:shadow-lg transition-all cursor-pointer">
          <div className="p-6 text-center space-y-3">
            <span className="text-5xl block">💬</span>
            <div>
              <h3 className="font-bold text-xl text-purple-900 dark:text-purple-100 mb-1">
                İslami Sohbet
              </h3>
              <p className="text-sm text-muted-foreground">
                İslam dini, ibadetler ve ahlak ile ilgili sorularınızı sorun
              </p>
            </div>
            <Button className="w-full" size="lg">
              <span className="mr-2">💬</span>
              Sohbete Katıl
            </Button>
          </div>
        </Card>
      </Link>

      {/* Section Selection Buttons */}
      <div className="grid grid-cols-3 gap-2">
        <Button
          variant={activeSection === "prayer" ? "default" : "outline"}
          onClick={() => setActiveSection(activeSection === "prayer" ? null : "prayer")}
          className="h-auto py-3 sm:py-4 flex flex-col items-center gap-1 sm:gap-2"
        >
          <span className="text-lg sm:text-xl">🕌</span>
          <span className="text-[10px] sm:text-xs md:text-sm font-medium leading-tight text-center">Namaz Vakitleri</span>
        </Button>
        
        <Button
          variant={activeSection === "verse" ? "default" : "outline"}
          onClick={() => setActiveSection(activeSection === "verse" ? null : "verse")}
          className="h-auto py-3 sm:py-4 flex flex-col items-center gap-1 sm:gap-2"
        >
          <span className="text-lg sm:text-xl">📖</span>
          <span className="text-[10px] sm:text-xs md:text-sm font-medium leading-tight text-center">Günün Ayeti</span>
        </Button>
        
        <Button
          variant={activeSection === "knowledge" ? "default" : "outline"}
          onClick={() => setActiveSection(activeSection === "knowledge" ? null : "knowledge")}
          className="h-auto py-3 sm:py-4 flex flex-col items-center gap-1 sm:gap-2"
        >
          <span className="text-lg sm:text-xl">💡</span>
          <span className="text-[10px] sm:text-xs md:text-sm font-medium leading-tight text-center">İslami Bilgi</span>
        </Button>

        <Button
          variant={activeSection === "abdest" ? "default" : "outline"}
          onClick={() => setActiveSection(activeSection === "abdest" ? null : "abdest")}
          className="h-auto py-3 sm:py-4 flex flex-col items-center gap-1 sm:gap-2"
        >
          <span className="text-lg sm:text-xl">💧</span>
          <span className="text-[10px] sm:text-xs md:text-sm font-medium leading-tight text-center">Abdest</span>
        </Button>

        <Button
          variant={activeSection === "gusul" ? "default" : "outline"}
          onClick={() => setActiveSection(activeSection === "gusul" ? null : "gusul")}
          className="h-auto py-3 sm:py-4 flex flex-col items-center gap-1 sm:gap-2"
        >
          <span className="text-lg sm:text-xl">🚿</span>
          <span className="text-[10px] sm:text-xs md:text-sm font-medium leading-tight text-center">Gusül</span>
        </Button>

        <Button
          variant={activeSection === "rakah" ? "default" : "outline"}
          onClick={() => setActiveSection(activeSection === "rakah" ? null : "rakah")}
          className="h-auto py-3 sm:py-4 flex flex-col items-center gap-1 sm:gap-2"
        >
          <span className="text-lg sm:text-xl">🔢</span>
          <span className="text-[10px] sm:text-xs md:text-sm font-medium leading-tight text-center">Rekat Sayıları</span>
        </Button>

        <Button
          variant={activeSection === "prayerConditions" ? "default" : "outline"}
          onClick={() => setActiveSection(activeSection === "prayerConditions" ? null : "prayerConditions")}
          className="h-auto py-3 sm:py-4 flex flex-col items-center gap-1 sm:gap-2"
        >
          <span className="text-lg sm:text-xl">✅</span>
          <span className="text-[10px] sm:text-xs md:text-sm font-medium leading-tight text-center">Namazın Şartları</span>
        </Button>

        <Button
          variant={activeSection === "faith" ? "default" : "outline"}
          onClick={() => setActiveSection(activeSection === "faith" ? null : "faith")}
          className="h-auto py-3 sm:py-4 flex flex-col items-center gap-1 sm:gap-2"
        >
          <span className="text-lg sm:text-xl">❤️</span>
          <span className="text-[10px] sm:text-xs md:text-sm font-medium leading-tight text-center">İmanın Şartları</span>
        </Button>

        <Button
          variant={activeSection === "fasting" ? "default" : "outline"}
          onClick={() => setActiveSection(activeSection === "fasting" ? null : "fasting")}
          className="h-auto py-3 sm:py-4 flex flex-col items-center gap-1 sm:gap-2"
        >
          <span className="text-lg sm:text-xl">🌙</span>
          <span className="text-[10px] sm:text-xs md:text-sm font-medium leading-tight text-center">Oruç Rehberi</span>
        </Button>

        <Button
          variant={activeSection === "prayers" ? "default" : "outline"}
          onClick={() => setActiveSection(activeSection === "prayers" ? null : "prayers")}
          className="h-auto py-3 sm:py-4 flex flex-col items-center gap-1 sm:gap-2"
        >
          <span className="text-lg sm:text-xl">🤲</span>
          <span className="text-[10px] sm:text-xs md:text-sm font-medium leading-tight text-center">Dualar & Zikirler</span>
        </Button>

        <Button
          variant={activeSection === "zakat" ? "default" : "outline"}
          onClick={() => setActiveSection(activeSection === "zakat" ? null : "zakat")}
          className="h-auto py-3 sm:py-4 flex flex-col items-center gap-1 sm:gap-2"
        >
          <span className="text-lg sm:text-xl">🧮</span>
          <span className="text-[10px] sm:text-xs md:text-sm font-medium leading-tight text-center">Zekat Hesaplama</span>
        </Button>

        <Button
          variant={activeSection === "dhikr" ? "default" : "outline"}
          onClick={() => setActiveSection(activeSection === "dhikr" ? null : "dhikr")}
          className="h-auto py-3 sm:py-4 flex flex-col items-center gap-1 sm:gap-2"
        >
          <span className="text-lg sm:text-xl">📿</span>
          <span className="text-[10px] sm:text-xs md:text-sm font-medium leading-tight text-center">Zikirmatik</span>
        </Button>

        <Button
          variant={activeSection === "qibla" ? "default" : "outline"}
          onClick={() => setActiveSection(activeSection === "qibla" ? null : "qibla")}
          className="h-auto py-3 sm:py-4 flex flex-col items-center gap-1 sm:gap-2"
        >
          <span className="text-lg sm:text-xl">🧭</span>
          <span className="text-[10px] sm:text-xs md:text-sm font-medium leading-tight text-center">Kıble Bulucu</span>
        </Button>

        <Button
          variant={activeSection === "siyer" ? "default" : "outline"}
          onClick={() => setActiveSection(activeSection === "siyer" ? null : "siyer")}
          className="h-auto py-3 sm:py-4 flex flex-col items-center gap-1 sm:gap-2"
        >
          <span className="text-lg sm:text-xl">📜</span>
          <span className="text-[10px] sm:text-xs md:text-sm font-medium leading-tight text-center">Siyer</span>
        </Button>

        <Button
          variant={activeSection === "esmaulhusna" ? "default" : "outline"}
          onClick={() => setActiveSection(activeSection === "esmaulhusna" ? null : "esmaulhusna")}
          className="h-auto py-3 sm:py-4 flex flex-col items-center gap-1 sm:gap-2"
        >
          <span className="text-lg sm:text-xl">⭐</span>
          <span className="text-[10px] sm:text-xs md:text-sm font-medium leading-tight text-center">Esmaül Hüsna</span>
        </Button>

        <Button
          variant={activeSection === "stories" ? "default" : "outline"}
          onClick={() => setActiveSection(activeSection === "stories" ? null : "stories")}
          className="h-auto py-3 sm:py-4 flex flex-col items-center gap-1 sm:gap-2"
        >
          <span className="text-lg sm:text-xl">📚</span>
          <span className="text-[10px] sm:text-xs md:text-sm font-medium leading-tight text-center">İslami Hikayeler</span>
        </Button>

        <Button
          variant={activeSection === "religiousDays" ? "default" : "outline"}
          onClick={() => setActiveSection(activeSection === "religiousDays" ? null : "religiousDays")}
          className="h-auto py-3 sm:py-4 flex flex-col items-center gap-1 sm:gap-2"
        >
          <span className="text-lg sm:text-xl">📅</span>
          <span className="text-[10px] sm:text-xs md:text-sm font-medium leading-tight text-center">Dini Günler</span>
        </Button>

        <Button
          variant={activeSection === "quran" ? "default" : "outline"}
          onClick={() => setActiveSection(activeSection === "quran" ? null : "quran")}
          className="h-auto py-3 sm:py-4 flex flex-col items-center gap-1 sm:gap-2"
        >
          <span className="text-lg sm:text-xl">📗</span>
          <span className="text-[10px] sm:text-xs md:text-sm font-medium leading-tight text-center">Kur'an-ı Kerim</span>
        </Button>
      </div>

      {/* Content Display Area */}
      {activeSection === null && (
        <Card className="p-8 text-center">
          <div className="flex flex-col items-center gap-3 text-muted-foreground">
            <SparklesIcon className="h-12 w-12 opacity-50" />
            <p className="text-sm">Görüntülemek istediğiniz manevi içeriği seçin</p>
          </div>
        </Card>
      )}

      {/* Prayer Times Card */}
      {activeSection === "prayer" && prayerTimes && (
        <Card className="overflow-hidden bg-gradient-to-br from-emerald-50 via-teal-50 to-emerald-50 dark:from-emerald-950/20 dark:via-teal-950/20 dark:to-emerald-950/20 border-emerald-200 dark:border-emerald-900">
          <div className="p-4 sm:p-6">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <ClockIcon className="h-5 w-5 text-emerald-700 dark:text-emerald-300" />
                <h3 className="font-semibold text-lg sm:text-xl text-emerald-900 dark:text-emerald-100">
                  Namaz Vakitleri
                </h3>
              </div>
              <Link 
                to="/profile" 
                className="text-xs text-primary hover:underline whitespace-nowrap"
              >
                Konumu Değiştir
              </Link>
            </div>

            <div className="flex items-center gap-1 text-xs text-muted-foreground mb-3">
              <MapPinIcon className="h-3 w-3" />
              <span>{prayerTimes.city}, {prayerTimes.country}</span>
              <span className="mx-1">•</span>
              <span>{prayerTimes.date}</span>
            </div>

            {nextPrayer && (
              <div className="mb-4 p-3 rounded-lg bg-emerald-200/50 dark:bg-emerald-800/30 border border-emerald-300 dark:border-emerald-700">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-emerald-900 dark:text-emerald-100">
                    Sıradaki: {nextPrayer.name}
                  </span>
                  <span className="font-bold text-2xl text-emerald-900 dark:text-emerald-100">
                    {nextPrayer.time}
                  </span>
                </div>
              </div>
            )}

            <div className="grid grid-cols-3 gap-2 sm:gap-3">
              <div className="text-center p-2 sm:p-3 rounded-lg bg-background/50 border border-emerald-200/50 dark:border-emerald-800/50">
                <div className="text-xs text-muted-foreground mb-1">İmsak</div>
                <div className="font-bold text-base sm:text-lg text-emerald-900 dark:text-emerald-100">{prayerTimes.timings.fajr}</div>
              </div>
              <div className="text-center p-2 sm:p-3 rounded-lg bg-background/50 border border-emerald-200/50 dark:border-emerald-800/50">
                <div className="text-xs text-muted-foreground mb-1">Güneş</div>
                <div className="font-bold text-base sm:text-lg text-emerald-900 dark:text-emerald-100">{prayerTimes.timings.sunrise}</div>
              </div>
              <div className="text-center p-2 sm:p-3 rounded-lg bg-background/50 border border-emerald-200/50 dark:border-emerald-800/50">
                <div className="text-xs text-muted-foreground mb-1">Öğle</div>
                <div className="font-bold text-base sm:text-lg text-emerald-900 dark:text-emerald-100">{prayerTimes.timings.dhuhr}</div>
              </div>
              <div className="text-center p-2 sm:p-3 rounded-lg bg-background/50 border border-emerald-200/50 dark:border-emerald-800/50">
                <div className="text-xs text-muted-foreground mb-1">İkindi</div>
                <div className="font-bold text-base sm:text-lg text-emerald-900 dark:text-emerald-100">{prayerTimes.timings.asr}</div>
              </div>
              <div className="text-center p-2 sm:p-3 rounded-lg bg-background/50 border border-emerald-200/50 dark:border-emerald-800/50">
                <div className="text-xs text-muted-foreground mb-1">Akşam</div>
                <div className="font-bold text-base sm:text-lg text-emerald-900 dark:text-emerald-100">{prayerTimes.timings.maghrib}</div>
              </div>
              <div className="text-center p-2 sm:p-3 rounded-lg bg-background/50 border border-emerald-200/50 dark:border-emerald-800/50">
                <div className="text-xs text-muted-foreground mb-1">Yatsı</div>
                <div className="font-bold text-base sm:text-lg text-emerald-900 dark:text-emerald-100">{prayerTimes.timings.isha}</div>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Daily Verse Card */}
      {activeSection === "verse" && verse && (
        <Card className="overflow-hidden bg-gradient-to-br from-amber-50 via-orange-50 to-amber-50 dark:from-amber-950/20 dark:via-orange-950/20 dark:to-amber-950/20 border-amber-200 dark:border-amber-900">
          <div className="p-4 sm:p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <BookOpenIcon className="h-5 w-5 text-amber-700 dark:text-amber-300" />
                <h3 className="font-semibold text-lg sm:text-xl text-amber-900 dark:text-amber-100">
                  Günün Ayeti
                </h3>
              </div>
              <Badge variant="secondary" className="text-xs shrink-0">
                {verse.revelationPlace}
              </Badge>
            </div>
            
            {/* Arabic Text */}
            <div className="mb-4 p-3 sm:p-4 rounded-lg bg-amber-100/50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
              <p className="text-right text-lg sm:text-xl leading-loose font-arabic text-amber-950 dark:text-amber-50">
                {verse.arabicText}
              </p>
            </div>

            {/* Turkish Translation (Meal) */}
            <div className="mb-4">
              <h4 className="text-sm font-semibold text-amber-900 dark:text-amber-100 mb-2">
                Meal (Türkçe Anlamı):
              </h4>
              <p className="text-base leading-relaxed text-foreground">
                {verse.text}
              </p>
            </div>

            {/* Explanation */}
            {verse.explanation && (
              <div className="mb-4">
                <h4 className="text-sm font-semibold text-amber-900 dark:text-amber-100 mb-2">
                  Açıklama:
                </h4>
                <p className="text-sm leading-relaxed text-foreground">
                  {verse.explanation}
                </p>
              </div>
            )}

            {/* Context of Revelation */}
            {verse.contextOfRevelation && (
              <div className="mb-4 p-3 rounded-lg bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800">
                <h4 className="text-sm font-semibold text-amber-900 dark:text-amber-100 mb-2">
                  Sebeb-i Nüzul (İniş Sebebi):
                </h4>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {verse.contextOfRevelation}
                </p>
              </div>
            )}
            
            <div className="pt-4 border-t border-amber-200 dark:border-amber-800">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium text-amber-900 dark:text-amber-100">
                    {verse.surah} Suresi
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {verse.surahNumber}. Sure, {verse.numberInSurah}. Ayet
                  </div>
                </div>
                <div className="text-xs text-muted-foreground text-right">
                  <div className="flex items-center gap-1">
                    <MapPinIcon className="h-3 w-3" />
                    {verse.revelationPlace}'de nazil oldu
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Daily Islamic Knowledge Card */}
      {activeSection === "knowledge" && dailyKnowledge && (
        <Card className="overflow-hidden bg-gradient-to-br from-purple-50 via-indigo-50 to-purple-50 dark:from-purple-950/20 dark:via-indigo-950/20 dark:to-purple-950/20 border-purple-200 dark:border-purple-900">
          <div className="p-4 sm:p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <LightbulbIcon className="h-5 w-5 text-purple-700 dark:text-purple-300" />
                <h3 className="font-semibold text-lg sm:text-xl text-purple-900 dark:text-purple-100">
                  Günün İslami Bilgisi
                </h3>
              </div>
              <Badge variant="secondary" className="text-xs shrink-0">
                {dailyKnowledge.category === "hadis" && "Hadis"}
                {dailyKnowledge.category === "fıkıh" && "Fıkıh"}
                {dailyKnowledge.category === "siyer" && "Siyer"}
                {dailyKnowledge.category === "ahlak" && "Ahlak"}
                {dailyKnowledge.category === "ibadet" && "İbadet"}
                {dailyKnowledge.category === "tarih" && "Tarih"}
                {dailyKnowledge.category === "genel" && "Genel"}
              </Badge>
            </div>
            
            <h4 className="font-semibold text-lg mb-3 text-purple-900 dark:text-purple-100">
              {dailyKnowledge.title}
            </h4>
            
            <p className="text-base leading-relaxed text-foreground">
              {dailyKnowledge.content}
            </p>
          </div>
        </Card>
      )}

      {/* Abdest Guide Card */}
      {activeSection === "abdest" && abdestGuide && (
        <Card className="overflow-hidden bg-gradient-to-br from-blue-50 via-cyan-50 to-blue-50 dark:from-blue-950/20 dark:via-cyan-950/20 dark:to-blue-950/20 border-blue-200 dark:border-blue-900">
          <div className="p-4 sm:p-6 space-y-4">
            <div className="flex items-center gap-2">
              <DropletIcon className="h-5 w-5 text-blue-700 dark:text-blue-300" />
              <h3 className="font-semibold text-lg sm:text-xl text-blue-900 dark:text-blue-100">
                {abdestGuide.title}
              </h3>
            </div>

            <div>
              <h4 className="font-semibold text-base mb-3 text-blue-900 dark:text-blue-100">Farzlar:</h4>
              <div className="space-y-3">
                {abdestGuide.farzSteps.map((step, idx) => (
                  <div key={idx} className="p-3 rounded-lg bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800">
                    <h5 className="font-medium text-sm mb-1 text-blue-900 dark:text-blue-100">{step.title}</h5>
                    <p className="text-sm text-foreground">{step.description}</p>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h4 className="font-semibold text-base mb-3 text-blue-900 dark:text-blue-100">Sünnetler:</h4>
              <ul className="space-y-2">
                {abdestGuide.sunnetSteps.map((step, idx) => (
                  <li key={idx} className="flex gap-2 text-sm text-foreground">
                    <span className="text-blue-600 dark:text-blue-400">•</span>
                    <span>{step}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="pt-3 border-t border-blue-200 dark:border-blue-800">
              <h4 className="font-semibold text-sm mb-2 text-blue-900 dark:text-blue-100">Önemli Notlar:</h4>
              <ul className="space-y-1">
                {abdestGuide.notes.map((note, idx) => (
                  <li key={idx} className="text-xs text-muted-foreground flex gap-2">
                    <span>•</span>
                    <span>{note}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </Card>
      )}

      {/* Gusul Guide Card */}
      {activeSection === "gusul" && gusulGuide && (
        <Card className="overflow-hidden bg-gradient-to-br from-sky-50 via-blue-50 to-sky-50 dark:from-sky-950/20 dark:via-blue-950/20 dark:to-sky-950/20 border-sky-200 dark:border-sky-900">
          <div className="p-4 sm:p-6 space-y-4">
            <div className="flex items-center gap-2">
              <WavesIcon className="h-5 w-5 text-sky-700 dark:text-sky-300" />
              <h3 className="font-semibold text-lg sm:text-xl text-sky-900 dark:text-sky-100">
                {gusulGuide.title}
              </h3>
            </div>

            <div>
              <h4 className="font-semibold text-base mb-3 text-sky-900 dark:text-sky-100">Farzlar:</h4>
              <div className="space-y-3">
                {gusulGuide.farzSteps.map((step, idx) => (
                  <div key={idx} className="p-3 rounded-lg bg-sky-50 dark:bg-sky-900/10 border border-sky-200 dark:border-sky-800">
                    <h5 className="font-medium text-sm mb-1 text-sky-900 dark:text-sky-100">{step.title}</h5>
                    <p className="text-sm text-foreground">{step.description}</p>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h4 className="font-semibold text-base mb-3 text-sky-900 dark:text-sky-100">Sünnetler:</h4>
              <ul className="space-y-2">
                {gusulGuide.sunnetSteps.map((step, idx) => (
                  <li key={idx} className="flex gap-2 text-sm text-foreground">
                    <span className="text-sky-600 dark:text-sky-400">•</span>
                    <span>{step}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-base mb-3 text-sky-900 dark:text-sky-100">Gusül Gerektiren Durumlar:</h4>
              <ul className="space-y-2">
                {gusulGuide.mustStates.map((state, idx) => (
                  <li key={idx} className="flex gap-2 text-sm text-foreground">
                    <span className="text-sky-600 dark:text-sky-400">•</span>
                    <span>{state}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="pt-3 border-t border-sky-200 dark:border-sky-800">
              <h4 className="font-semibold text-sm mb-2 text-sky-900 dark:text-sky-100">Önemli Notlar:</h4>
              <ul className="space-y-1">
                {gusulGuide.notes.map((note, idx) => (
                  <li key={idx} className="text-xs text-muted-foreground flex gap-2">
                    <span>•</span>
                    <span>{note}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </Card>
      )}

      {/* Prayer Rakah Guide Card */}
      {activeSection === "rakah" && rakahGuide && (
        <Card className="overflow-hidden bg-gradient-to-br from-green-50 via-emerald-50 to-green-50 dark:from-green-950/20 dark:via-emerald-950/20 dark:to-green-950/20 border-green-200 dark:border-green-900">
          <div className="p-4 sm:p-6 space-y-4">
            <div className="flex items-center gap-2">
              <HashIcon className="h-5 w-5 text-green-700 dark:text-green-300" />
              <h3 className="font-semibold text-lg sm:text-xl text-green-900 dark:text-green-100">
                {rakahGuide.title}
              </h3>
            </div>

            <div>
              <h4 className="font-semibold text-base mb-3 text-green-900 dark:text-green-100">Günlük Namazlar:</h4>
              <div className="space-y-3">
                {rakahGuide.dailyPrayers.map((prayer, idx) => (
                  <div key={idx} className="p-3 rounded-lg bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-800">
                    <div className="flex items-center justify-between mb-2">
                      <h5 className="font-semibold text-sm text-green-900 dark:text-green-100">{prayer.name}</h5>
                      <Badge variant="secondary" className="text-xs">{prayer.total}</Badge>
                    </div>
                    <div className="space-y-1 text-xs text-foreground">
                      <p><span className="font-medium">Sünnet:</span> {prayer.sunnah}</p>
                      <p><span className="font-medium">Farz:</span> {prayer.farz}</p>
                      {prayer.vitir && <p><span className="font-medium">Vitir:</span> {prayer.vitir}</p>}
                      <p className="text-muted-foreground italic mt-2">{prayer.note}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h4 className="font-semibold text-base mb-3 text-green-900 dark:text-green-100">Özel Namazlar:</h4>
              <div className="space-y-2">
                {rakahGuide.specialPrayers.map((prayer, idx) => (
                  <div key={idx} className="p-2 rounded-lg bg-background/50 border border-green-200 dark:border-green-800">
                    <p className="font-medium text-sm text-green-900 dark:text-green-100">{prayer.name}</p>
                    <p className="text-xs text-foreground">{prayer.description}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-3 border-t border-green-200 dark:border-green-800">
              <ul className="space-y-1">
                {rakahGuide.notes.map((note, idx) => (
                  <li key={idx} className="text-xs text-muted-foreground flex gap-2">
                    <span>•</span>
                    <span>{note}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </Card>
      )}

      {/* Prayer Conditions Card */}
      {activeSection === "prayerConditions" && prayerConditionsData && (
        <Card className="overflow-hidden bg-gradient-to-br from-orange-50 via-amber-50 to-orange-50 dark:from-orange-950/20 dark:via-amber-950/20 dark:to-orange-950/20 border-orange-200 dark:border-orange-900">
          <div className="p-4 sm:p-6 space-y-4">
            <div className="flex items-center gap-2">
              <CheckSquareIcon className="h-5 w-5 text-orange-700 dark:text-orange-300" />
              <h3 className="font-semibold text-lg sm:text-xl text-orange-900 dark:text-orange-100">
                {prayerConditionsData.title}
              </h3>
            </div>

            <div>
              <h4 className="font-semibold text-base mb-3 text-orange-900 dark:text-orange-100">Namazın Şartları:</h4>
              <div className="space-y-2">
                {prayerConditionsData.conditions.map((condition, idx) => (
                  <div key={idx} className="p-2 rounded-lg bg-orange-50 dark:bg-orange-900/10 border border-orange-200 dark:border-orange-800">
                    <p className="font-medium text-sm text-orange-900 dark:text-orange-100">{condition.title}</p>
                    <p className="text-xs text-foreground">{condition.description}</p>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h4 className="font-semibold text-base mb-3 text-orange-900 dark:text-orange-100">Namaz İçindeki Farzlar:</h4>
              <div className="space-y-2">
                {prayerConditionsData.farzActions.map((action, idx) => (
                  <div key={idx} className="p-2 rounded-lg bg-background/50 border border-orange-200 dark:border-orange-800">
                    <p className="font-medium text-sm text-orange-900 dark:text-orange-100">{action.title}</p>
                    <p className="text-xs text-foreground">{action.description}</p>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h4 className="font-semibold text-base mb-3 text-orange-900 dark:text-orange-100">Namazın Vacipleri:</h4>
              <ul className="space-y-1">
                {prayerConditionsData.vacipActions.map((action, idx) => (
                  <li key={idx} className="flex gap-2 text-sm text-foreground">
                    <span className="text-orange-600 dark:text-orange-400">•</span>
                    <span>{action}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-base mb-3 text-orange-900 dark:text-orange-100">Namazın Sünnetleri:</h4>
              <ul className="space-y-1">
                {prayerConditionsData.sunnetActions.map((action, idx) => (
                  <li key={idx} className="flex gap-2 text-sm text-foreground">
                    <span className="text-orange-600 dark:text-orange-400">•</span>
                    <span>{action}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </Card>
      )}

      {/* Faith Pillars Card */}
      {activeSection === "faith" && faithPillars && (
        <Card className="overflow-hidden bg-gradient-to-br from-rose-50 via-pink-50 to-rose-50 dark:from-rose-950/20 dark:via-pink-950/20 dark:to-rose-950/20 border-rose-200 dark:border-rose-900">
          <div className="p-4 sm:p-6 space-y-4">
            <div className="flex items-center gap-2">
              <HeartIcon className="h-5 w-5 text-rose-700 dark:text-rose-300" />
              <h3 className="font-semibold text-lg sm:text-xl text-rose-900 dark:text-rose-100">
                {faithPillars.title}
              </h3>
            </div>

            <div className="space-y-4">
              {faithPillars.pillars.map((pillar) => (
                <div key={pillar.number} className="p-3 rounded-lg bg-rose-50 dark:bg-rose-900/10 border border-rose-200 dark:border-rose-800">
                  <div className="flex items-start gap-3 mb-2">
                    <Badge variant="secondary" className="shrink-0">{pillar.number}</Badge>
                    <div>
                      <h5 className="font-semibold text-sm text-rose-900 dark:text-rose-100 mb-1">{pillar.title}</h5>
                      <p className="text-xs text-foreground mb-2">{pillar.description}</p>
                      <ul className="space-y-1">
                        {pillar.details.map((detail, idx) => (
                          <li key={idx} className="flex gap-2 text-xs text-muted-foreground">
                            <span className="text-rose-600 dark:text-rose-400">•</span>
                            <span>{detail}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-4 border-t border-rose-200 dark:border-rose-800">
              <h4 className="font-semibold text-sm mb-2 text-rose-900 dark:text-rose-100">Âmentü Duası:</h4>
              <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-900/10 border border-rose-200 dark:border-rose-800 space-y-2">
                <p className="text-xs font-arabic text-right leading-relaxed text-foreground">{faithPillars.amintuFormula}</p>
                <p className="text-xs text-muted-foreground">{faithPillars.amintuTranslation}</p>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Fasting Guide Card */}
      {activeSection === "fasting" && fastingGuide && (
        <Card className="overflow-hidden bg-gradient-to-br from-indigo-50 via-violet-50 to-indigo-50 dark:from-indigo-950/20 dark:via-violet-950/20 dark:to-indigo-950/20 border-indigo-200 dark:border-indigo-900">
          <div className="p-4 sm:p-6 space-y-4">
            <div className="flex items-center gap-2">
              <MoonIcon className="h-5 w-5 text-indigo-700 dark:text-indigo-300" />
              <h3 className="font-semibold text-lg sm:text-xl text-indigo-900 dark:text-indigo-100">
                {fastingGuide.title}
              </h3>
            </div>

            <p className="text-sm text-foreground">{fastingGuide.introduction}</p>

            <div>
              <h4 className="font-semibold text-base mb-3 text-indigo-900 dark:text-indigo-100">Oruç Farz Olma Şartları:</h4>
              <ul className="space-y-1">
                {fastingGuide.farzConditions.map((condition, idx) => (
                  <li key={idx} className="flex gap-2 text-sm text-foreground">
                    <span className="text-indigo-600 dark:text-indigo-400">•</span>
                    <span>{condition}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-base mb-3 text-indigo-900 dark:text-indigo-100">Orucun Rükünleri:</h4>
              <div className="space-y-2">
                {fastingGuide.pillars.map((pillar, idx) => (
                  <div key={idx} className="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-900/10 border border-indigo-200 dark:border-indigo-800">
                    <p className="font-medium text-sm text-indigo-900 dark:text-indigo-100">{pillar.title}</p>
                    <p className="text-xs text-foreground">{pillar.description}</p>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h4 className="font-semibold text-base mb-3 text-indigo-900 dark:text-indigo-100">Orucu Bozan Durumlar:</h4>
              <div className="space-y-2">
                {fastingGuide.breakingFast.map((item, idx) => (
                  <div key={idx} className="p-3 rounded-lg bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <p className="font-medium text-sm text-red-900 dark:text-red-100">{item.title}</p>
                      <Badge variant="destructive" className="text-[10px] shrink-0">{item.ruling}</Badge>
                    </div>
                    <p className="text-xs text-foreground">{item.description}</p>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h4 className="font-semibold text-base mb-3 text-indigo-900 dark:text-indigo-100">Orucu Bozmayan Durumlar:</h4>
              <div className="space-y-2">
                {fastingGuide.notBreakingFast.map((item, idx) => (
                  <div key={idx} className="p-2 rounded-lg bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-800">
                    <p className="font-medium text-sm text-green-900 dark:text-green-100 mb-1">{item.title}</p>
                    <p className="text-xs text-foreground">{item.description}</p>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h4 className="font-semibold text-base mb-3 text-indigo-900 dark:text-indigo-100">Oruç Tutmaktan Özürlü Olanlar:</h4>
              <div className="space-y-2">
                {fastingGuide.excusedGroups.map((group, idx) => (
                  <div key={idx} className="p-2 rounded-lg bg-background/50 border border-indigo-200 dark:border-indigo-800">
                    <p className="font-medium text-sm text-indigo-900 dark:text-indigo-100">{group.title}</p>
                    <p className="text-xs text-foreground">{group.description}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800">
                <h4 className="font-semibold text-sm mb-2 text-blue-900 dark:text-blue-100">Sahur Tavsiyeleri:</h4>
                <ul className="space-y-1">
                  {fastingGuide.suhoorAdvice.map((advice, idx) => (
                    <li key={idx} className="flex gap-2 text-xs text-foreground">
                      <span className="text-blue-600 dark:text-blue-400">✓</span>
                      <span>{advice}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800">
                <h4 className="font-semibold text-sm mb-2 text-amber-900 dark:text-amber-100">İftar Tavsiyeleri:</h4>
                <ul className="space-y-1">
                  {fastingGuide.iftarAdvice.map((advice, idx) => (
                    <li key={idx} className="flex gap-2 text-xs text-foreground">
                      <span className="text-amber-600 dark:text-amber-400">✓</span>
                      <span>{advice}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Prayers and Dhikr Card */}
      {activeSection === "prayers" && prayersAndDhikr && (
        <Card className="overflow-hidden bg-gradient-to-br from-violet-50 via-purple-50 to-violet-50 dark:from-violet-950/20 dark:via-purple-950/20 dark:to-violet-950/20 border-violet-200 dark:border-violet-900">
          <div className="p-4 sm:p-6 space-y-4">
            <div className="flex items-center gap-2">
              <MessageCircleIcon className="h-5 w-5 text-violet-700 dark:text-violet-300" />
              <h3 className="font-semibold text-lg sm:text-xl text-violet-900 dark:text-violet-100">
                {prayersAndDhikr.title}
              </h3>
            </div>

            {prayersAndDhikr.categories.map((category, catIdx) => (
              <div key={catIdx} className="space-y-3">
                <h4 className="font-semibold text-base text-violet-900 dark:text-violet-100">{category.name}</h4>
                <div className="space-y-2">
                  {category.prayers.map((prayer, prayIdx) => (
                    <div key={prayIdx} className="p-3 rounded-lg bg-violet-50 dark:bg-violet-900/10 border border-violet-200 dark:border-violet-800">
                      <p className="font-medium text-sm text-violet-900 dark:text-violet-100 mb-2">{prayer.title}</p>
                      <p className="font-arabic text-right text-base mb-2 text-foreground">{prayer.arabic}</p>
                      <p className="text-xs text-muted-foreground">{prayer.turkish}</p>
                    </div>
                  ))}
                </div>
              </div>
            ))}

            <div className="pt-4 border-t border-violet-200 dark:border-violet-800">
              <h4 className="font-semibold text-base mb-3 text-violet-900 dark:text-violet-100">Sık Zikirler:</h4>
              <div className="space-y-2">
                {prayersAndDhikr.commonDhikr.map((dhikr, idx) => (
                  <div key={idx} className="p-2 rounded-lg bg-background/50 border border-violet-200 dark:border-violet-800">
                    <p className="font-arabic text-right text-base mb-1 text-foreground">{dhikr.text}</p>
                    <p className="text-xs text-muted-foreground">{dhikr.meaning}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Zakat Calculator */}
      {activeSection === "zakat" && <ZakatCalculator />}

      {/* Dhikr Counter */}
      {activeSection === "dhikr" && <DhikrCounter />}

      {/* Qibla Finder */}
      {activeSection === "qibla" && <QiblaFinder />}

      {/* Siyer */}
      {activeSection === "siyer" && siyer && (
        <Card className="overflow-hidden bg-gradient-to-br from-slate-50 via-gray-50 to-slate-50 dark:from-slate-950/20 dark:via-gray-950/20 dark:to-slate-950/20 border-slate-200 dark:border-slate-900">
          <div className="p-4 sm:p-6 space-y-4">
            <div className="flex items-center gap-2">
              <ScrollTextIcon className="h-5 w-5 text-slate-700 dark:text-slate-300" />
              <h3 className="font-semibold text-lg sm:text-xl text-slate-900 dark:text-slate-100">
                {siyer.title}
              </h3>
            </div>

            <div className="space-y-4">
              {siyer.periods.map((period, idx) => (
                <div key={idx} className="p-3 rounded-lg bg-slate-50 dark:bg-slate-900/10 border border-slate-200 dark:border-slate-800">
                  <h4 className="font-semibold text-base mb-2 text-slate-900 dark:text-slate-100">{period.title}</h4>
                  <ul className="space-y-1">
                    {period.events.map((event, eventIdx) => (
                      <li key={eventIdx} className="flex gap-2 text-sm text-foreground">
                        <span className="text-slate-600 dark:text-slate-400">•</span>
                        <span>{event}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>

            <div className="pt-4 border-t border-slate-200 dark:border-slate-800">
              <h4 className="font-semibold text-base mb-3 text-slate-900 dark:text-slate-100">Peygamberimizin Özellikleri:</h4>
              <ul className="space-y-1">
                {siyer.traits.map((trait, idx) => (
                  <li key={idx} className="flex gap-2 text-sm text-foreground">
                    <span className="text-slate-600 dark:text-slate-400">✓</span>
                    <span>{trait}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </Card>
      )}

      {/* Esmaul Husna */}
      {activeSection === "esmaulhusna" && esmaulHusna && (
        <Card className="overflow-hidden bg-gradient-to-br from-yellow-50 via-amber-50 to-yellow-50 dark:from-yellow-950/20 dark:via-amber-950/20 dark:to-yellow-950/20 border-yellow-200 dark:border-yellow-900">
          <div className="p-4 sm:p-6 space-y-4">
            <div className="flex items-center gap-2">
              <StarIcon className="h-5 w-5 text-yellow-700 dark:text-yellow-300" />
              <h3 className="font-semibold text-lg sm:text-xl text-yellow-900 dark:text-yellow-100">
                {esmaulHusna.title}
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
              {esmaulHusna.names.map((name, idx) => (
                <div key={idx} className="p-2 rounded-lg bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-200 dark:border-yellow-800">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <Badge variant="secondary" className="text-xs">{idx + 1}</Badge>
                    <p className="font-arabic text-right text-base text-foreground">{name.arabic}</p>
                  </div>
                  <p className="font-semibold text-sm text-yellow-900 dark:text-yellow-100">{name.turkish}</p>
                  <p className="text-xs text-muted-foreground">{name.meaning}</p>
                </div>
              ))}
            </div>
          </div>
        </Card>
      )}

      {/* Islamic Stories */}
      {activeSection === "stories" && islamicStories && (
        <Card className="overflow-hidden bg-gradient-to-br from-fuchsia-50 via-pink-50 to-fuchsia-50 dark:from-fuchsia-950/20 dark:via-pink-950/20 dark:to-fuchsia-950/20 border-fuchsia-200 dark:border-fuchsia-900">
          <div className="p-4 sm:p-6 space-y-4">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <ScrollIcon className="h-5 w-5 text-fuchsia-700 dark:text-fuchsia-300" />
                <h3 className="font-semibold text-lg sm:text-xl text-fuchsia-900 dark:text-fuchsia-100">
                  {islamicStories.title}
                </h3>
              </div>
              <Badge variant="secondary" className="text-xs">
                {islamicStories.currentDay}. Gün
              </Badge>
            </div>

            <p className="text-xs text-muted-foreground">
              Her gün yeni bir İslami hikaye • Toplam {islamicStories.totalStories} hikaye
            </p>

            {/* Hikaye Geçmişi */}
            {storyHistory && storyHistory.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                  <Label className="text-xs font-medium">Geçmiş Hikayeler (Son 30 Gün)</Label>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  <Button
                    variant={selectedHistoryIndex === null ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedHistoryIndex(null)}
                    className="text-xs justify-start"
                  >
                    <CalendarIcon className="h-3 w-3 mr-1" />
                    Bugün ({islamicStories.currentDay}. Gün)
                  </Button>
                  {storyHistory.slice(0, 29).map((record, idx) => (
                    <Button
                      key={record._id}
                      variant={selectedHistoryIndex === idx ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSelectedHistoryIndex(idx)}
                      className="text-xs justify-start"
                    >
                      {record.dayOfMonth}. Gün
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {/* Hikaye İçeriği */}
            <div className="p-4 rounded-lg bg-fuchsia-50 dark:bg-fuchsia-900/10 border border-fuchsia-200 dark:border-fuchsia-800 space-y-3">
              {(() => {
                const displayStory = selectedHistoryIndex === null || !storyHistory 
                  ? islamicStories.story 
                  : islamicStories.allStories[storyHistory[selectedHistoryIndex].storyIndex];
                
                return (
                  <>
                    <h4 className="font-semibold text-base text-fuchsia-900 dark:text-fuchsia-100">
                      {displayStory.title}
                    </h4>
                    <p className="text-xs text-muted-foreground italic">
                      {displayStory.summary}
                    </p>
                    <p className="text-sm text-foreground leading-relaxed">
                      {displayStory.story}
                    </p>
                    <div className="pt-3 border-t border-fuchsia-200 dark:border-fuchsia-800">
                      <p className="text-xs font-medium text-fuchsia-900 dark:text-fuchsia-100 mb-1.5">
                        📖 Öğretici Ders:
                      </p>
                      <p className="text-xs text-foreground italic leading-relaxed">
                        {displayStory.lesson}
                      </p>
                    </div>
                  </>
                );
              })()}
            </div>

            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <CalendarIcon className="h-3.5 w-3.5" />
              <span>Hikaye her gün otomatik olarak değişir</span>
            </div>
          </div>
        </Card>
      )}

      {/* Religious Days */}
      {activeSection === "religiousDays" && religiousDays && (
        <Card className="overflow-hidden bg-gradient-to-br from-lime-50 via-green-50 to-lime-50 dark:from-lime-950/20 dark:via-green-950/20 dark:to-lime-950/20 border-lime-200 dark:border-lime-900">
          <div className="p-4 sm:p-6 space-y-4">
            <div className="flex items-center gap-2">
              <CalendarIcon className="h-5 w-5 text-lime-700 dark:text-lime-300" />
              <h3 className="font-semibold text-lg sm:text-xl text-lime-900 dark:text-lime-100">
                {religiousDays.title}
              </h3>
            </div>

            <div className="space-y-4">
              {religiousDays.religiousDays.map((day, idx) => (
                <div key={idx} className="p-4 rounded-lg bg-lime-50 dark:bg-lime-900/10 border border-lime-200 dark:border-lime-800">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h4 className="font-semibold text-base text-lime-900 dark:text-lime-100">{day.name}</h4>
                    <Badge variant="secondary" className="text-xs shrink-0">{day.hijriDate}</Badge>
                  </div>
                  <p className="text-sm text-foreground mb-2">{day.description}</p>
                  <div className="space-y-2">
                    <div className="p-2 rounded bg-background/50">
                      <p className="text-xs font-medium text-lime-900 dark:text-lime-100 mb-1">Önemi:</p>
                      <p className="text-xs text-foreground">{day.significance}</p>
                    </div>
                    {'worship' in day && day.worship && (
                      <div className="p-2 rounded bg-background/50">
                        <p className="text-xs font-medium text-lime-900 dark:text-lime-100 mb-1">İbadetler:</p>
                        <ul className="space-y-0.5">
                          {day.worship.map((w, wIdx) => (
                            <li key={wIdx} className="text-xs text-foreground flex gap-1">
                              <span>•</span>
                              <span>{w}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {'traditions' in day && day.traditions && (
                      <div className="p-2 rounded bg-background/50">
                        <p className="text-xs font-medium text-lime-900 dark:text-lime-100 mb-1">Gelenekler:</p>
                        <ul className="space-y-0.5">
                          {day.traditions.map((t, tIdx) => (
                            <li key={tIdx} className="text-xs text-foreground flex gap-1">
                              <span>•</span>
                              <span>{t}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-4 border-t border-lime-200 dark:border-lime-800">
              <h4 className="font-semibold text-sm mb-2 text-lime-900 dark:text-lime-100">Önemli Notlar:</h4>
              <ul className="space-y-1">
                {religiousDays.notes.map((note, idx) => (
                  <li key={idx} className="text-xs text-foreground flex gap-2">
                    <span className="text-lime-600 dark:text-lime-400">•</span>
                    <span>{note}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </Card>
      )}

      {/* Quran Reader */}
      {activeSection === "quran" && <QuranReader />}
    </div>
  );
}
