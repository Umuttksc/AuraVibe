import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import MainLayout from "@/components/layout/main-layout.tsx";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs.tsx";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card.tsx";
import { Users, FileText, MessageSquare, TrendingUp, Shield, Activity, Download, Settings } from "lucide-react";
import UsersManagement from "./_components/users-management.tsx";
import ActivityFeed from "./_components/activity-feed.tsx";
import AdsManagement from "./_components/ads-management.tsx";
import DataExport from "./_components/data-export.tsx";
import SystemManagement from "./_components/system-management.tsx";

export default function AdminPage() {
  const isAdmin = useQuery(api.admin.isAdmin);
  const isSuperAdmin = useQuery(api.admin.isSuperAdmin);
  const stats = useQuery(api.admin.getStats, isAdmin === true ? {} : "skip");
  const navigate = useNavigate();

  useEffect(() => {
    if (isAdmin === false) {
      navigate("/admin/setup");
    }
  }, [isAdmin, navigate]);

  if (isAdmin === undefined) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Skeleton className="h-20 w-20 rounded-full" />
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <MainLayout>
      <div className="container mx-auto px-2 sm:px-4 py-4 sm:py-8 max-w-6xl">
        <div className="space-y-6 mb-6">
          <div className="flex items-center gap-2 sm:gap-3">
            <Shield className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
            <h1 className="text-2xl sm:text-3xl font-bold">Admin Dashboard</h1>
          </div>
          
          {/* Admin Actions Grid - 3 columns */}
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => navigate("/admin/verification")}
              className="px-3 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors text-xs sm:text-sm"
            >
              Başvurular
            </button>
            <button
              onClick={() => navigate("/admin/fortune-settings")}
              className="px-3 py-2 bg-amber-600 text-white rounded-md hover:bg-amber-700 transition-colors text-xs sm:text-sm"
            >
              ☕🔮 Fal
            </button>
            <button
              onClick={() => navigate("/admin/fortune-analytics")}
              className="px-3 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 transition-colors text-xs sm:text-sm"
            >
              📊 Fal İstatistik
            </button>
            <button
              onClick={() => navigate("/admin/premium-settings")}
              className="px-3 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors text-xs sm:text-sm"
            >
              ⭐ Premium
            </button>
            <button
              onClick={() => navigate("/admin/gifts")}
              className="px-3 py-2 bg-pink-600 text-white rounded-md hover:bg-pink-700 transition-colors text-xs sm:text-sm"
            >
              🎁 Hediyeler
            </button>
            <button
              onClick={() => navigate("/admin/gift-settings")}
              className="px-3 py-2 bg-rose-600 text-white rounded-md hover:bg-rose-700 transition-colors text-xs sm:text-sm"
            >
              💰 Gelir
            </button>
            <button
              onClick={() => navigate("/admin/wallet-settings")}
              className="px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors text-xs sm:text-sm"
            >
              💳 Cüzdan
            </button>
            <button
              onClick={() => navigate("/admin/token-settings")}
              className="px-3 py-2 bg-amber-600 text-white rounded-md hover:bg-amber-700 transition-colors text-xs sm:text-sm"
            >
              🎟️ Jetonlar
            </button>
            <button
              onClick={() => navigate("/admin/permissions")}
              className="px-3 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors text-xs sm:text-sm"
            >
              🛡️ Yetkiler
            </button>
            <button
              onClick={() => navigate("/admin/content-moderation")}
              className="px-3 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors text-xs sm:text-sm"
            >
              🚫 Moderasyon
            </button>
            <button
              onClick={() => navigate("/admin/settings")}
              className="px-3 py-2 bg-teal-600 text-white rounded-md hover:bg-teal-700 transition-colors text-xs sm:text-sm"
            >
              ⚙️ Doğrulama
            </button>
            <button
              onClick={() => navigate("/admin/reports")}
              className="px-3 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors text-xs sm:text-sm"
            >
              📋 Raporlar
            </button>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid gap-3 grid-cols-2 lg:grid-cols-4 mb-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium">
                Kullanıcı
              </CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-xl sm:text-2xl font-bold">{stats?.totalUsers ?? 0}</div>
              <p className="text-xs text-muted-foreground mt-1">
                +{stats?.newUsersThisWeek ?? 0} hafta
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium">
                Gönderi
              </CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-xl sm:text-2xl font-bold">{stats?.totalPosts ?? 0}</div>
              <p className="text-xs text-muted-foreground mt-1">
                +{stats?.newPostsThisWeek ?? 0} hafta
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium">
                Mesaj
              </CardTitle>
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-xl sm:text-2xl font-bold">{stats?.totalMessages ?? 0}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {stats?.totalConversations ?? 0} konuşma
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium">
                Aktif
              </CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-xl sm:text-2xl font-bold text-green-600">
                {stats?.activeUsers ?? 0}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {stats?.blockedUsers ?? 0} engelli
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="users" className="space-y-4">
          <div className="overflow-x-auto pb-2 -mx-2 px-2">
            <TabsList className="inline-flex min-w-full w-auto h-auto flex-nowrap gap-1 p-1">
              <TabsTrigger value="users" className="text-xs sm:text-sm whitespace-nowrap">
                Kullanıcılar
              </TabsTrigger>
              {isSuperAdmin && (
                <TabsTrigger value="export" className="text-xs sm:text-sm whitespace-nowrap">
                  Veri Çıktısı
                </TabsTrigger>
              )}
              <TabsTrigger value="ads" className="text-xs sm:text-sm whitespace-nowrap">
                Reklamlar
              </TabsTrigger>
              <TabsTrigger value="activity" className="text-xs sm:text-sm whitespace-nowrap">
                Aktiviteler
              </TabsTrigger>
              {isSuperAdmin && (
                <TabsTrigger value="system" className="text-xs sm:text-sm whitespace-nowrap flex items-center gap-1">
                  <Settings className="h-4 w-4" />
                  Sistem
                </TabsTrigger>
              )}
            </TabsList>
          </div>

          <TabsContent value="users">
            <UsersManagement />
          </TabsContent>

          {isSuperAdmin && (
            <TabsContent value="export">
              <DataExport />
            </TabsContent>
          )}

          <TabsContent value="ads">
            <AdsManagement />
          </TabsContent>

          <TabsContent value="activity">
            <ActivityFeed />
          </TabsContent>

          {isSuperAdmin && (
            <TabsContent value="system">
              <SystemManagement />
            </TabsContent>
          )}
        </Tabs>
      </div>
    </MainLayout>
  );
}
