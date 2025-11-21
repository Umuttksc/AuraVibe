import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/use-auth.ts";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import { Button } from "@/components/ui/button.tsx";
import { SignInButton } from "@/components/ui/signin.tsx";
import { 
  MessageCircle, 
  Heart, 
  Calendar, 
  Sparkles, 
  Users, 
  TrendingUp,
  BookOpen,
  Music,
  BarChart3
} from "lucide-react";
import { Card } from "@/components/ui/card.tsx";

// Icon wrapper components
function MessageCircleIcon({ className }: { className?: string }) {
  return <MessageCircle className={className} />;
}

function HeartIcon({ className }: { className?: string }) {
  return <Heart className={className} />;
}

function CalendarIcon({ className }: { className?: string }) {
  return <Calendar className={className} />;
}

function SparklesIcon({ className }: { className?: string }) {
  return <Sparkles className={className} />;
}

function UsersIcon({ className }: { className?: string }) {
  return <Users className={className} />;
}

function TrendingUpIcon({ className }: { className?: string }) {
  return <TrendingUp className={className} />;
}

function BookOpenIcon({ className }: { className?: string }) {
  return <BookOpen className={className} />;
}

function MusicIcon({ className }: { className?: string }) {
  return <Music className={className} />;
}

function BarChart3Icon({ className }: { className?: string }) {
  return <BarChart3 className={className} />;
}

export default function Index() {
  const navigate = useNavigate();
  const { user, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && user) {
      navigate("/home");
    }
  }, [user, isLoading, navigate]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Skeleton className="h-20 w-20 rounded-full" />
      </div>
    );
  }

  if (user) {
    return null;
  }

  const features = [
    {
      icon: "message",
      title: "Sosyal Bağlantı",
      description: "Arkadaşlarınla paylaş, mesajlaş ve hikayeler oluştur"
    },
    {
      icon: "heart",
      title: "Sağlık Takibi",
      description: "Regl döngüsü ve günlük sağlık takibi"
    },
    {
      icon: "sparkles",
      title: "Manevi İçerik",
      description: "Namaz vakitleri, günün ayeti ve İslami bilgiler"
    },
    {
      icon: "users",
      title: "Topluluklar",
      description: "İlgi alanlarına göre grup sohbetleri ve topluluklar"
    },
    {
      icon: "trending",
      title: "Keşfet",
      description: "Trending konular ve popüler içerikler"
    },
    {
      icon: "music",
      title: "Müzik",
      description: "Gönderilerine ve hikayelerine müzik ekle"
    }
  ];

  const getIcon = (iconName: string) => {
    switch (iconName) {
      case "message":
        return <MessageCircleIcon className="h-6 w-6" />;
      case "heart":
        return <HeartIcon className="h-6 w-6" />;
      case "calendar":
        return <CalendarIcon className="h-6 w-6" />;
      case "sparkles":
        return <SparklesIcon className="h-6 w-6" />;
      case "users":
        return <UsersIcon className="h-6 w-6" />;
      case "trending":
        return <TrendingUpIcon className="h-6 w-6" />;
      case "bookopen":
        return <BookOpenIcon className="h-6 w-6" />;
      case "music":
        return <MusicIcon className="h-6 w-6" />;
      case "chart":
        return <BarChart3Icon className="h-6 w-6" />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50 dark:from-gray-900 dark:via-purple-900/20 dark:to-gray-900">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img src="/icon.png" alt="AuraVibe" className="h-8 w-8" />
            <span className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              AuraVibe
            </span>
          </div>
          <SignInButton signInText="Giriş Yap / Kaydol" />
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4">
        <div className="container mx-auto text-center max-w-4xl">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 text-sm font-medium mb-6">
            <SparklesIcon className="h-4 w-4" />
            <span>Hayatını Dengeye Getir</span>
          </div>
          
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold mb-6 leading-tight">
            Sosyal Medya,{" "}
            <span className="bg-gradient-to-r from-purple-600 via-pink-600 to-orange-600 bg-clip-text text-transparent">
              Sağlık ve Maneviyat
            </span>{" "}
            Bir Arada
          </h1>
          
          <p className="text-lg sm:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            AuraVibe ile arkadaşlarınla bağlantıda kal, sağlığını takip et ve manevi yolculuğunu sürdür. 
            Her şey tek bir yerde!
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <SignInButton size="lg" signInText="Ücretsiz Kaydol / Giriş Yap" />
            <Button variant="outline" size="lg" asChild>
              <a href="#features">Özellikleri Keşfet</a>
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-4 bg-background/50 backdrop-blur-sm">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              Neler Sunuyoruz?
            </h2>
            <p className="text-muted-foreground text-lg">
              Modern sosyal medya deneyimini, kişisel gelişim araçlarıyla birleştirdik
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <Card key={index} className="p-6 hover:shadow-lg transition-shadow">
                <div className="inline-flex p-3 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 text-white mb-4">
                  {getIcon(feature.icon)}
                </div>
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-4xl text-center">
          <div className="bg-gradient-to-br from-purple-600 via-pink-600 to-orange-600 rounded-3xl p-12 text-white">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              Hemen Başla!
            </h2>
            <p className="text-lg mb-8 opacity-90">
              Ücretsiz kaydol ve AuraVibe topluluğuna katıl. 
              Binlerce kullanıcı zaten deneyimliyor.
            </p>
            <SignInButton size="lg" signInText="Hemen Kaydol" />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 border-t bg-background/80 backdrop-blur-md">
        <div className="container mx-auto text-center text-muted-foreground">
          <p>&copy; 2024 AuraVibe. Tüm hakları saklıdır.</p>
        </div>
      </footer>
    </div>
  );
}
