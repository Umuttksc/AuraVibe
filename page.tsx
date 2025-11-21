import { useState } from "react";
import { useAction } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import { Button } from "@/components/ui/button.tsx";
import { Input } from "@/components/ui/input.tsx";
import { Card } from "@/components/ui/card.tsx";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs.tsx";
import { 
  Cloud, 
  CloudRain, 
  Sun, 
  Wind, 
  Droplets, 
  Eye, 
  Gauge,
  MapPin,
  Loader2,
  Sunrise as SunriseIcon,
  Sunset as SunsetIcon
} from "lucide-react";
import { toast } from "sonner";
import { Authenticated, Unauthenticated, AuthLoading } from "convex/react";
import { SignInButton } from "@/components/ui/signin.tsx";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import { format } from "date-fns";
import { tr } from "date-fns/locale";

interface WeatherData {
  temperature: number;
  feelsLike: number;
  humidity: number;
  description: string;
  icon: string;
  windSpeed: number;
  city: string;
  country: string;
  pressure: number;
  visibility: number;
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

function WeatherContent() {
  const [city, setCity] = useState("");
  const [country, setCountry] = useState("Turkey");
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [prayerTimes, setPrayerTimes] = useState<PrayerTimesData | null>(null);
  const [isLoadingWeather, setIsLoadingWeather] = useState(false);
  const [isLoadingPrayer, setIsLoadingPrayer] = useState(false);

  const getCurrentWeather = useAction(api.weather.getCurrentWeather);
  const getPrayerTimes = useAction(api.prayer.getPrayerTimes);

  const handleWeatherSearch = async () => {
    if (!city.trim()) {
      toast.error("Lütfen bir şehir adı girin");
      return;
    }

    setIsLoadingWeather(true);
    try {
      const data = await getCurrentWeather({ city: city.trim(), units: "metric" });
      setWeather(data);
      toast.success("Hava durumu güncellendi");
    } catch (error) {
      toast.error("Hava durumu alınamadı");
      console.error(error);
    } finally {
      setIsLoadingWeather(false);
    }
  };

  const handlePrayerSearch = async () => {
    if (!city.trim()) {
      toast.error("Lütfen bir şehir adı girin");
      return;
    }

    setIsLoadingPrayer(true);
    try {
      const data = await getPrayerTimes({ 
        city: city.trim(), 
        country: country.trim() 
      });
      setPrayerTimes(data);
      toast.success("Ezan vakitleri güncellendi");
    } catch (error) {
      toast.error("Ezan vakitleri alınamadı");
      console.error(error);
    } finally {
      setIsLoadingPrayer(false);
    }
  };

  const handleSearchBoth = async () => {
    if (!city.trim()) {
      toast.error("Lütfen bir şehir adı girin");
      return;
    }

    await Promise.all([handleWeatherSearch(), handlePrayerSearch()]);
  };

  return (
    <div className="container mx-auto max-w-4xl p-4 space-y-6">
      <div className="flex flex-col gap-4">
        <h1 className="text-3xl font-bold">Hava Durumu ve Ezan Vakitleri</h1>
        
        <Card className="p-4">
          <div className="space-y-4">
            <div className="flex gap-2">
              <div className="flex-1">
                <Input
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="Şehir adı (örn: Istanbul)"
                  onKeyDown={(e) => e.key === "Enter" && handleSearchBoth()}
                />
              </div>
              <div className="w-40">
                <Input
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  placeholder="Ülke"
                  onKeyDown={(e) => e.key === "Enter" && handleSearchBoth()}
                />
              </div>
            </div>
            <Button 
              onClick={handleSearchBoth} 
              className="w-full"
              disabled={isLoadingWeather || isLoadingPrayer}
            >
              {(isLoadingWeather || isLoadingPrayer) ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Yükleniyor...
                </>
              ) : (
                <>
                  <MapPin className="h-4 w-4 mr-2" />
                  Ara
                </>
              )}
            </Button>
          </div>
        </Card>
      </div>

      <Tabs defaultValue="weather" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="weather">Hava Durumu</TabsTrigger>
          <TabsTrigger value="prayer">Ezan Vakitleri</TabsTrigger>
        </TabsList>

        <TabsContent value="weather" className="space-y-4">
          {weather ? (
            <>
              <Card className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h2 className="text-2xl font-bold flex items-center gap-2">
                      <MapPin className="h-5 w-5" />
                      {weather.city}, {weather.country}
                    </h2>
                    <p className="text-muted-foreground capitalize">
                      {weather.description}
                    </p>
                  </div>
                  <img
                    src={`https://openweathermap.org/img/wn/${weather.icon}@2x.png`}
                    alt={weather.description}
                    className="h-20 w-20"
                  />
                </div>
                
                <div className="text-5xl font-bold mb-6">
                  {Math.round(weather.temperature)}°C
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  <Card className="p-4">
                    <div className="flex items-center gap-2 text-muted-foreground mb-1">
                      <Cloud className="h-4 w-4" />
                      <span className="text-sm">Hissedilen</span>
                    </div>
                    <div className="text-xl font-semibold">
                      {Math.round(weather.feelsLike)}°C
                    </div>
                  </Card>

                  <Card className="p-4">
                    <div className="flex items-center gap-2 text-muted-foreground mb-1">
                      <Droplets className="h-4 w-4" />
                      <span className="text-sm">Nem</span>
                    </div>
                    <div className="text-xl font-semibold">
                      {weather.humidity}%
                    </div>
                  </Card>

                  <Card className="p-4">
                    <div className="flex items-center gap-2 text-muted-foreground mb-1">
                      <Wind className="h-4 w-4" />
                      <span className="text-sm">Rüzgar</span>
                    </div>
                    <div className="text-xl font-semibold">
                      {weather.windSpeed} m/s
                    </div>
                  </Card>

                  <Card className="p-4">
                    <div className="flex items-center gap-2 text-muted-foreground mb-1">
                      <Gauge className="h-4 w-4" />
                      <span className="text-sm">Basınç</span>
                    </div>
                    <div className="text-xl font-semibold">
                      {weather.pressure} hPa
                    </div>
                  </Card>

                  <Card className="p-4">
                    <div className="flex items-center gap-2 text-muted-foreground mb-1">
                      <Eye className="h-4 w-4" />
                      <span className="text-sm">Görüş</span>
                    </div>
                    <div className="text-xl font-semibold">
                      {(weather.visibility / 1000).toFixed(1)} km
                    </div>
                  </Card>
                </div>
              </Card>
            </>
          ) : (
            <Card className="p-12">
              <div className="flex flex-col items-center justify-center text-center">
                <Cloud className="h-16 w-16 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">
                  Hava durumunu görmek için yukarıdan bir şehir arayın
                </p>
              </div>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="prayer" className="space-y-4">
          {prayerTimes ? (
            <Card className="p-6">
              <div className="mb-6">
                <h2 className="text-2xl font-bold flex items-center gap-2 mb-2">
                  <MapPin className="h-5 w-5" />
                  {prayerTimes.city}, {prayerTimes.country}
                </h2>
                <p className="text-muted-foreground">
                  {prayerTimes.date}
                </p>
                <p className="text-sm text-muted-foreground">
                  Hicri: {prayerTimes.hijriDate}
                </p>
              </div>

              <div className="grid gap-3">
                <Card className="p-4 bg-gradient-to-r from-indigo-500/10 to-purple-500/10">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-indigo-500/20 flex items-center justify-center">
                        <SunriseIcon className="h-5 w-5 text-indigo-600" />
                      </div>
                      <span className="font-semibold">İmsak</span>
                    </div>
                    <span className="text-2xl font-bold">{prayerTimes.timings.fajr}</span>
                  </div>
                </Card>

                <Card className="p-4 bg-gradient-to-r from-amber-500/10 to-orange-500/10">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-amber-500/20 flex items-center justify-center">
                        <Sun className="h-5 w-5 text-amber-600" />
                      </div>
                      <span className="font-semibold">Güneş</span>
                    </div>
                    <span className="text-2xl font-bold">{prayerTimes.timings.sunrise}</span>
                  </div>
                </Card>

                <Card className="p-4 bg-gradient-to-r from-yellow-500/10 to-amber-500/10">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-yellow-500/20 flex items-center justify-center">
                        <Sun className="h-5 w-5 text-yellow-600" />
                      </div>
                      <span className="font-semibold">Öğle</span>
                    </div>
                    <span className="text-2xl font-bold">{prayerTimes.timings.dhuhr}</span>
                  </div>
                </Card>

                <Card className="p-4 bg-gradient-to-r from-orange-500/10 to-red-500/10">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-orange-500/20 flex items-center justify-center">
                        <Sun className="h-5 w-5 text-orange-600" />
                      </div>
                      <span className="font-semibold">İkindi</span>
                    </div>
                    <span className="text-2xl font-bold">{prayerTimes.timings.asr}</span>
                  </div>
                </Card>

                <Card className="p-4 bg-gradient-to-r from-red-500/10 to-pink-500/10">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-red-500/20 flex items-center justify-center">
                        <SunsetIcon className="h-5 w-5 text-red-600" />
                      </div>
                      <span className="font-semibold">Akşam</span>
                    </div>
                    <span className="text-2xl font-bold">{prayerTimes.timings.maghrib}</span>
                  </div>
                </Card>

                <Card className="p-4 bg-gradient-to-r from-purple-500/10 to-indigo-500/10">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-purple-500/20 flex items-center justify-center">
                        <Cloud className="h-5 w-5 text-purple-600" />
                      </div>
                      <span className="font-semibold">Yatsı</span>
                    </div>
                    <span className="text-2xl font-bold">{prayerTimes.timings.isha}</span>
                  </div>
                </Card>
              </div>
            </Card>
          ) : (
            <Card className="p-12">
              <div className="flex flex-col items-center justify-center text-center">
                <Cloud className="h-16 w-16 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">
                  Ezan vakitlerini görmek için yukarıdan bir şehir arayın
                </p>
              </div>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default function WeatherPage() {
  return (
    <>
      <Unauthenticated>
        <div className="flex items-center justify-center min-h-screen p-4">
          <Card className="p-8 max-w-md w-full text-center">
            <h2 className="text-2xl font-bold mb-4">Giriş Yapın</h2>
            <p className="text-muted-foreground mb-6">
              Hava durumu ve ezan vakitlerini görmek için giriş yapmalısınız
            </p>
            <SignInButton />
          </Card>
        </div>
      </Unauthenticated>
      <AuthLoading>
        <div className="container mx-auto max-w-4xl p-4 space-y-6">
          <Skeleton className="h-12 w-64" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-96 w-full" />
        </div>
      </AuthLoading>
      <Authenticated>
        <WeatherContent />
      </Authenticated>
    </>
  );
}
