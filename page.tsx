import { Authenticated, Unauthenticated, AuthLoading } from "convex/react";
import MainLayout from "@/components/layout/main-layout.tsx";
import { SignInButton } from "@/components/ui/signin.tsx";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card.tsx";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs.tsx";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import { 
  Activity, 
  Smile, 
  Moon, 
  CheckSquare, 
  Pill, 
  Stethoscope, 
  Target,
  TrendingUp,
  Calendar,
  BarChart3
} from "lucide-react";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge.tsx";
import { Progress } from "@/components/ui/progress.tsx";

function WellnessTrackingContent() {
  const today = new Date();
  const thirtyDaysAgo = new Date(today);
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const startDate = thirtyDaysAgo.toISOString().split("T")[0];
  const endDate = today.toISOString().split("T")[0];

  const dashboardData = useQuery(api.wellnessDashboard.getDashboardData, {
    startDate,
    endDate,
  });

  if (!dashboardData) {
    return (
      <MainLayout>
        <div className="max-w-7xl mx-auto p-4 space-y-6">
          <Skeleton className="h-64 w-full" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Skeleton key={i} className="h-48 w-full" />
            ))}
          </div>
        </div>
      </MainLayout>
    );
  }

  const trackingSections = [
    {
      id: "mood",
      title: "Ruh Hali Takibi",
      description: "Duygusal durumunuzu günlük takip edin",
      icon: Smile,
      color: "from-yellow-500 to-orange-500",
      link: "/wellness-tracking/mood",
      stats: {
        value: dashboardData.mood.totalLogs,
        label: "kayıt",
      },
    },
    {
      id: "sleep",
      title: "Uyku Takibi",
      description: "Uyku kaliteni ve sürenizi izleyin",
      icon: Moon,
      color: "from-blue-500 to-purple-500",
      link: "/wellness-tracking/sleep",
      stats: {
        value: `${Math.round(dashboardData.sleep.averageDuration / 60)}h`,
        label: "ortalama",
      },
    },
    {
      id: "habits",
      title: "Alışkanlık Takibi",
      description: "Sağlıklı alışkanlıklar oluşturun",
      icon: CheckSquare,
      color: "from-green-500 to-emerald-500",
      link: "/wellness-tracking/habits",
      stats: {
        value: dashboardData.habits.activeHabits,
        label: "alışkanlık",
      },
    },
    {
      id: "medications",
      title: "İlaç Hatırlatıcı",
      description: "İlaçlarınızı zamanında alın",
      icon: Pill,
      color: "from-pink-500 to-rose-500",
      link: "/wellness-tracking/medications",
      stats: {
        value: `${Math.round(dashboardData.medications.adherenceRate)}%`,
        label: "uyum",
      },
    },
    {
      id: "symptoms",
      title: "Semptom Takibi",
      description: "Belirtilerinizi kaydedin",
      icon: Stethoscope,
      color: "from-red-500 to-orange-500",
      link: "/wellness-tracking/symptoms",
      stats: {
        value: dashboardData.symptoms.totalSymptoms,
        label: "semptom",
      },
    },
    {
      id: "goals",
      title: "Wellness Hedefleri",
      description: "Sağlık hedeflerinize ulaşın",
      icon: Target,
      color: "from-purple-500 to-pink-500",
      link: "/wellness-tracking/goals",
      stats: {
        value: dashboardData.goals.activeGoals,
        label: "hedef",
      },
    },
  ];

  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto p-4 space-y-6">
        {/* Header with Back Button */}
        <div className="space-y-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => window.history.back()}
            className="gap-2 -ml-2"
          >
            ← Kişisel Alan'a Dön
          </Button>
          
          <div className="space-y-2">
            <h1 className="text-3xl font-bold">Gelişim Takip</h1>
            <p className="text-muted-foreground">
              Sağlığınızı ve refahınızı kapsamlı şekilde izleyin
            </p>
          </div>
        </div>

        {/* Wellness Score Card */}
        <Card className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 border-purple-200">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Wellness Skorunuz</CardTitle>
                <CardDescription>Son 30 günlük performansınız</CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Activity className="h-8 w-8 text-purple-500" />
                <span className="text-4xl font-bold text-purple-600">
                  {dashboardData.summary.wellnessScore}
                </span>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <Progress value={dashboardData.summary.wellnessScore} className="h-3" />
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold">{dashboardData.summary.activeDays}</div>
                <div className="text-sm text-muted-foreground">Aktif Gün</div>
              </div>
              <div>
                <div className="text-2xl font-bold">{dashboardData.summary.totalActivities}</div>
                <div className="text-sm text-muted-foreground">Toplam Aktivite</div>
              </div>
              <div>
                <div className="text-2xl font-bold">{dashboardData.goals.activeGoals}</div>
                <div className="text-sm text-muted-foreground">Aktif Hedef</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Insights */}
        {dashboardData.insights.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Öneriler & İçgörüler
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {dashboardData.insights.map((insight, idx) => (
                <div
                  key={idx}
                  className={`p-3 rounded-lg border-l-4 ${
                    insight.priority === "high"
                      ? "bg-red-50 border-red-500"
                      : insight.priority === "positive"
                      ? "bg-green-50 border-green-500"
                      : "bg-blue-50 border-blue-500"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <p className="text-sm">{insight.message}</p>
                    <Badge
                      variant={
                        insight.priority === "high"
                          ? "destructive"
                          : insight.priority === "positive"
                          ? "default"
                          : "secondary"
                      }
                    >
                      {insight.type}
                    </Badge>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Tracking Sections Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {trackingSections.map((section) => (
            <Link key={section.id} to={section.link}>
              <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer group">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div
                      className={`p-3 rounded-xl bg-gradient-to-br ${section.color} text-white`}
                    >
                      <section.icon className="h-6 w-6" />
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold">{section.stats.value}</div>
                      <div className="text-xs text-muted-foreground">
                        {section.stats.label}
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  <CardTitle className="text-lg group-hover:text-primary transition-colors">
                    {section.title}
                  </CardTitle>
                  <CardDescription>{section.description}</CardDescription>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Smile className="h-4 w-4 text-yellow-500" />
                Ruh Hali
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {dashboardData.mood.mostCommonMood || "—"}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Ortalama yoğunluk: {dashboardData.mood.averageIntensity.toFixed(1)}/10
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Moon className="h-4 w-4 text-blue-500" />
                Uyku
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {Math.round(dashboardData.sleep.averageDuration / 60)}h {Math.round(dashboardData.sleep.averageDuration % 60)}dk
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Kalite: {dashboardData.sleep.averageQuality.toFixed(1)}/5
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <CheckSquare className="h-4 w-4 text-green-500" />
                Alışkanlıklar
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                %{Math.round(dashboardData.habits.completionRate)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Tamamlanma oranı
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Pill className="h-4 w-4 text-pink-500" />
                İlaç Uyumu
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                %{Math.round(dashboardData.medications.adherenceRate)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {dashboardData.medications.takenCount}/{dashboardData.medications.totalScheduled} alındı
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
}

export default function WellnessTrackingPage() {
  return (
    <>
      <Authenticated>
        <WellnessTrackingContent />
      </Authenticated>
      <Unauthenticated>
        <MainLayout>
          <div className="max-w-md mx-auto mt-20 text-center space-y-6 p-4">
            <div className="space-y-2">
              <h2 className="text-2xl font-bold">Wellness Takip</h2>
              <p className="text-muted-foreground">
                Sağlığınızı takip etmek için lütfen giriş yapın
              </p>
            </div>
            <SignInButton />
          </div>
        </MainLayout>
      </Unauthenticated>
      <AuthLoading>
        <MainLayout>
          <div className="max-w-7xl mx-auto p-4 space-y-6">
            <Skeleton className="h-64 w-full" />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-48 w-full" />
              ))}
            </div>
          </div>
        </MainLayout>
      </AuthLoading>
    </>
  );
}
