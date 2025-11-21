import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Compass, MapPin, Navigation } from "lucide-react";
import { toast } from "sonner";

function CompassIcon({ className }: { className?: string }) {
  return <Compass className={className} />;
}

function MapPinIcon() {
  return <MapPin className="h-5 w-5" />;
}

function NavigationIcon() {
  return <Navigation className="h-4 w-4" />;
}

export default function QiblaFinder() {
  const [qiblaDirection, setQiblaDirection] = useState<number | null>(null);
  const [deviceHeading, setDeviceHeading] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Calculate Qibla direction from current location
  const calculateQibla = (lat: number, lng: number) => {
    // Kaaba coordinates
    const kaabaLat = 21.4225;
    const kaabaLng = 39.8262;

    // Convert to radians
    const φ1 = lat * Math.PI / 180;
    const φ2 = kaabaLat * Math.PI / 180;
    const Δλ = (kaabaLng - lng) * Math.PI / 180;

    // Calculate bearing
    const y = Math.sin(Δλ) * Math.cos(φ2);
    const x = Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);
    const θ = Math.atan2(y, x);
    const bearing = (θ * 180 / Math.PI + 360) % 360;

    return bearing;
  };

  const findQibla = () => {
    setLoading(true);
    setError(null);

    if (!navigator.geolocation) {
      setError("Tarayıcınız konum özelliğini desteklemiyor.");
      setLoading(false);
      toast.error("Konum özelliği desteklenmiyor");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const direction = calculateQibla(latitude, longitude);
        setQiblaDirection(direction);
        setLoading(false);
        toast.success("Kıble yönü bulundu");
      },
      (err) => {
        setError("Konum erişimi reddedildi. Lütfen konum izni verin.");
        setLoading(false);
        toast.error("Konum erişimi reddedildi");
      }
    );
  };

  // Get device orientation
  useEffect(() => {
    const handleOrientation = (event: DeviceOrientationEvent) => {
      if (event.alpha !== null) {
        setDeviceHeading(360 - event.alpha); // Reverse for correct direction
      }
    };

    if (typeof DeviceOrientationEvent !== 'undefined' && 'addEventListener' in window) {
      window.addEventListener('deviceorientation', handleOrientation);
      return () => {
        window.removeEventListener('deviceorientation', handleOrientation);
      };
    }
  }, []);

  const getRelativeDirection = () => {
    if (qiblaDirection === null || deviceHeading === null) return null;
    return (qiblaDirection - deviceHeading + 360) % 360;
  };

  const relativeDirection = getRelativeDirection();

  return (
    <Card className="overflow-hidden bg-gradient-to-br from-green-50 via-emerald-50 to-green-50 dark:from-green-950/20 dark:via-emerald-950/20 dark:to-green-950/20 border-green-200 dark:border-green-900">
      <div className="p-4 sm:p-6 space-y-6">
        <div className="flex items-center gap-2">
          <MapPinIcon />
          <h3 className="font-semibold text-lg sm:text-xl text-green-900 dark:text-green-100">
            Kıble Bulucu
          </h3>
        </div>

        {!qiblaDirection ? (
          <div className="space-y-4">
            <div className="text-center py-8">
              <CompassIcon className="h-24 w-24 mx-auto mb-4 text-green-700 dark:text-green-300 opacity-50" />
              <p className="text-sm text-muted-foreground mb-4">
                Konumunuza göre Kabe yönünü bulmak için konumunuza erişim iznine ihtiyacımız var.
              </p>
              <Button onClick={findQibla} disabled={loading} size="lg">
                <NavigationIcon />
                {loading ? "Bulunuyor..." : "Kıble Yönünü Bul"}
              </Button>
            </div>

            {error && (
              <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                <p className="text-sm text-red-900 dark:text-red-100">{error}</p>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {/* Compass Display */}
            <div className="relative w-64 h-64 mx-auto">
              {/* Compass circle */}
              <div className="absolute inset-0 rounded-full border-4 border-green-200 dark:border-green-800 bg-white dark:bg-gray-900 shadow-lg">
                {/* Cardinal directions */}
                <div className="absolute top-2 left-1/2 -translate-x-1/2 text-sm font-bold text-green-900 dark:text-green-100">
                  K
                </div>
                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 text-sm font-bold text-muted-foreground">
                  G
                </div>
                <div className="absolute left-2 top-1/2 -translate-y-1/2 text-sm font-bold text-muted-foreground">
                  B
                </div>
                <div className="absolute right-2 top-1/2 -translate-y-1/2 text-sm font-bold text-muted-foreground">
                  D
                </div>

                {/* Qibla indicator */}
                {relativeDirection !== null && (
                  <div
                    className="absolute top-1/2 left-1/2 w-1 h-24 -mt-24 -ml-0.5 origin-bottom transition-transform duration-300"
                    style={{ transform: `rotate(${relativeDirection}deg)` }}
                  >
                    <div className="w-full h-full bg-gradient-to-t from-green-600 to-green-400 rounded-full shadow-lg">
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[12px] border-l-transparent border-r-[12px] border-r-transparent border-b-[16px] border-b-green-600" />
                    </div>
                  </div>
                )}

                {/* Center dot */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-green-600 border-2 border-white shadow-lg" />
              </div>
            </div>

            {/* Direction Info */}
            <div className="text-center space-y-2">
              <div className="p-4 rounded-lg bg-green-100 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
                <p className="text-sm text-muted-foreground mb-1">Kıble Yönü</p>
                <p className="text-3xl font-bold text-green-900 dark:text-green-100">
                  {qiblaDirection.toFixed(1)}°
                </p>
              </div>

              {deviceHeading !== null && relativeDirection !== null && (
                <div className="text-sm text-muted-foreground">
                  <p>Yeşil ok Kabe yönünü gösteriyor</p>
                  <p className="mt-1">
                    {Math.abs(relativeDirection) < 10 || Math.abs(relativeDirection) > 350
                      ? "✓ Doğru yöne bakıyorsunuz"
                      : `${relativeDirection < 180 ? "Sağa" : "Sola"} dönün`}
                  </p>
                </div>
              )}

              {deviceHeading === null && (
                <p className="text-xs text-muted-foreground italic">
                  Not: Cihazınız yön sensörünü desteklemiyorsa sadece derece bilgisini kullanabilirsiniz.
                </p>
              )}
            </div>

            <Button variant="outline" onClick={() => setQiblaDirection(null)} className="w-full">
              Yeniden Bul
            </Button>
          </div>
        )}

        <div className="pt-4 border-t border-green-200 dark:border-green-800">
          <h4 className="font-semibold text-sm mb-2 text-green-900 dark:text-green-100">Bilgi:</h4>
          <ul className="space-y-1 text-xs text-muted-foreground">
            <li>• Kıble yönü, bulunduğunuz konumdan Kabe'ye olan yöndür</li>
            <li>• En doğru sonuç için açık alanda kullanın</li>
            <li>• Pusula manyetik alanlardan etkilenebilir</li>
          </ul>
        </div>
      </div>
    </Card>
  );
}
