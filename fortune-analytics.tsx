import { Authenticated, Unauthenticated, AuthLoading } from "convex/react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import { useNavigate } from "react-router-dom";
import MainLayout from "@/components/layout/main-layout.tsx";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card.tsx";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import { Button } from "@/components/ui/button.tsx";
import { ArrowLeft, TrendingUp, Users, DollarSign, Coffee, Sparkles, Heart, Eye, Star, Share2 } from "lucide-react";
import { SignInButton } from "@/components/ui/signin.tsx";



function FortuneAnalyticsContent() {
  const currentUser = useQuery(api.users.getCurrentUser);
  const stats = useQuery(api.admin.fortuneAnalytics.getFortuneStats);
  const recentFortunes = useQuery(api.admin.fortuneAnalytics.getRecentFortunes);
  const navigate = useNavigate();

  if (!currentUser) {
    return (
      <MainLayout>
        <div className="space-y-4">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-32 w-full" />
        </div>
      </MainLayout>
    );
  }

  if (currentUser.role !== "admin") {
    return (
      <MainLayout>
        <Card>
          <CardHeader>
            <CardTitle>Yetkisiz Erişim</CardTitle>
            <CardDescription>Bu sayfaya erişim yetkiniz yok</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate("/")}>Ana Sayfaya Dön</Button>
          </CardContent>
        </Card>
      </MainLayout>
    );
  }

  const categoryLabels: Record<string, string> = {
    love: "Aşk",
    general: "Genel",
    career: "Kariyer",
    health: "Sağlık",
    money: "Para",
  };

  return (
    <MainLayout>
      <div className="container mx-auto px-2 sm:px-4 py-4 sm:py-8 max-w-6xl space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/admin")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Fal İstatistikleri</h1>
            <p className="text-muted-foreground">AuraFal kullanım ve gelir analizi</p>
          </div>
        </div>

        {stats ? (
          <>
            {/* Overview Stats */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Toplam Fal</CardTitle>
                  <Sparkles className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.totalFortunes}</div>
                  <p className="text-xs text-muted-foreground">
                    ☕ {stats.coffeeFortunesCount} • 🔮 {stats.tarotFortunesCount} • 🤚 {stats.palmFortunesCount}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    ⭐ {stats.birthchartFortunesCount} • ✨ {stats.auraFortunesCount}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Kullanıcılar</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.uniqueUsers}</div>
                  <p className="text-xs text-muted-foreground">Fal baktıran kullanıcı</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Toplam Gelir</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">₺{stats.revenue.total.toFixed(2)}</div>
                  <p className="text-xs text-muted-foreground">
                    ₺{stats.revenue.premium.toFixed(2)} premium
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Yorumlanan</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.interpretedCount}</div>
                  <p className="text-xs text-muted-foreground">
                    %{((stats.interpretedCount / stats.totalFortunes) * 100).toFixed(0)} oran
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Category Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle>Kategori Dağılımı</CardTitle>
                <CardDescription>Fal kategorilerine göre dağılım</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Object.entries(stats.byCategory).map(([category, count]) => (
                    <div key={category} className="flex items-center">
                      <div className="w-32 text-sm font-medium">{categoryLabels[category]}</div>
                      <div className="flex-1">
                        <div className="h-8 bg-muted rounded-lg overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-end px-2"
                            style={{
                              width: `${(count / stats.totalFortunes) * 100}%`,
                            }}
                          >
                            <span className="text-xs font-semibold text-white">{count}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Engagement Stats */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Favoriler</CardTitle>
                  <Star className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.favoritesCount}</div>
                  <p className="text-xs text-muted-foreground">Favori olarak işaretlendi</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Paylaşılan</CardTitle>
                  <Share2 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.sharedCount}</div>
                  <p className="text-xs text-muted-foreground">Post olarak paylaşıldı</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Herkese Açık</CardTitle>
                  <Eye className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.publicCount}</div>
                  <p className="text-xs text-muted-foreground">
                    {stats.privateCount} özel
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Aktif Premium</CardTitle>
                  <Heart className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.subscriptions.active}</div>
                  <p className="text-xs text-muted-foreground">Premium abonelik</p>
                </CardContent>
              </Card>
            </div>

            {/* Revenue Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle>Gelir Dağılımı</CardTitle>
                <CardDescription>Fal tiplerine göre gelir analizi</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">☕</span>
                      <span className="font-medium">Kahve Falı</span>
                    </div>
                    <span className="text-lg font-bold">₺{stats.revenue.coffee.toFixed(2)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">🔮</span>
                      <span className="font-medium">Tarot</span>
                    </div>
                    <span className="text-lg font-bold">₺{stats.revenue.tarot.toFixed(2)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">🤚</span>
                      <span className="font-medium">El Falı</span>
                    </div>
                    <span className="text-lg font-bold">₺{stats.revenue.palm.toFixed(2)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">⭐</span>
                      <span className="font-medium">Doğum Haritası</span>
                    </div>
                    <span className="text-lg font-bold">₺{stats.revenue.birthchart.toFixed(2)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">✨</span>
                      <span className="font-medium">Aura Okuma</span>
                    </div>
                    <span className="text-lg font-bold">₺{stats.revenue.aura.toFixed(2)}</span>
                  </div>
                  <div className="flex items-center justify-between border-t pt-3 mt-3">
                    <div className="flex items-center gap-2">
                      <Heart className="h-4 w-4" />
                      <span className="font-medium">Premium Abonelik</span>
                    </div>
                    <span className="text-lg font-bold">₺{stats.revenue.premium.toFixed(2)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Payment Stats */}
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Ödemeler</CardTitle>
                  <CardDescription>Ödeme durumları</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Toplam</span>
                      <span className="font-medium">{stats.payments.total}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Tamamlandı</span>
                      <span className="font-medium text-green-600">{stats.payments.completed}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Bekliyor</span>
                      <span className="font-medium text-yellow-600">{stats.payments.pending}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Başarısız</span>
                      <span className="font-medium text-red-600">{stats.payments.failed}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Abonelikler</CardTitle>
                  <CardDescription>Premium abonelik durumları</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Toplam</span>
                      <span className="font-medium">{stats.subscriptions.total}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Aktif</span>
                      <span className="font-medium text-green-600">{stats.subscriptions.active}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">İptal Edildi</span>
                      <span className="font-medium text-yellow-600">{stats.subscriptions.cancelled}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Süresi Doldu</span>
                      <span className="font-medium text-red-600">{stats.subscriptions.expired}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Recent Fortunes */}
            <Card>
              <CardHeader>
                <CardTitle>Son Fallar</CardTitle>
                <CardDescription>En son baktırılan 20 fal</CardDescription>
              </CardHeader>
              <CardContent>
                {recentFortunes && recentFortunes.length > 0 ? (
                  <div className="space-y-3">
                    {recentFortunes.map((fortune) => (
                      <div
                        key={fortune._id}
                        className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <div className="text-2xl">
                            {fortune.fortuneType === "coffee" ? "☕" : 
                             fortune.fortuneType === "tarot" ? "🔮" :
                             fortune.fortuneType === "palm" ? "🤚" :
                             fortune.fortuneType === "birthchart" ? "⭐" :
                             "✨"}
                          </div>
                          <div>
                            <p className="font-medium">
                              {fortune.user?.name || "Anonim"} (@{fortune.user?.username || "unknown"})
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {categoryLabels[fortune.category]} • {fortune.date}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {fortune.isInterpreted && (
                            <span className="text-xs bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300 px-2 py-1 rounded">
                              Yorumlandı
                            </span>
                          )}
                          {fortune.isFavorite && <Star className="h-4 w-4" />}
                          {fortune.isPublic && <Eye className="h-4 w-4" />}
                          {fortune.sharedPostId && <Share2 className="h-4 w-4" />}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground py-8">Henüz fal yok</p>
                )}
              </CardContent>
            </Card>
          </>
        ) : (
          <div className="space-y-4">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
        )}
      </div>
    </MainLayout>
  );
}

export default function FortuneAnalyticsPage() {
  return (
    <>
      <Unauthenticated>
        <div className="flex min-h-screen items-center justify-center">
          <SignInButton />
        </div>
      </Unauthenticated>
      <AuthLoading>
        <div className="flex min-h-screen items-center justify-center">
          <Skeleton className="h-32 w-96" />
        </div>
      </AuthLoading>
      <Authenticated>
        <FortuneAnalyticsContent />
      </Authenticated>
    </>
  );
}
