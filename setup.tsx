import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import { useState } from "react";
import { Button } from "@/components/ui/button.tsx";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card.tsx";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert.tsx";
import { CheckCircle2, AlertTriangle, Shield, Lock, Crown } from "lucide-react";
import MainLayout from "@/components/layout/main-layout.tsx";
import { Authenticated, AuthLoading, Unauthenticated } from "convex/react";
import { SignInButton } from "@/components/ui/signin.tsx";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import MusicManagement from "./_components/music-management.tsx";

function AdminSetupInner() {
  const fixUsersWithoutRoles = useMutation(api.migrations.fixUsersWithoutRoles);
  const makeFirstUserSuperAdmin = useMutation(api.admin.makeFirstUserSuperAdmin);
  const canBecomeSuperAdmin = useQuery(api.admin.canBecomeSuperAdmin);
  const seedMusic = useMutation(api.music.seedMusic);
  const addAudioUrls = useMutation(api.music.addAudioUrlsToExistingMusic);
  const seedKnowledge = useMutation(api.dailyKnowledge.seedKnowledge);
  const [result, setResult] = useState<{ success: boolean; message: string; updated?: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [superAdminResult, setSuperAdminResult] = useState<{ success: boolean; message: string; alreadySuperAdmin?: boolean; madeSuperAdmin?: boolean; permanent?: boolean } | null>(null);
  const [superAdminError, setSuperAdminError] = useState<string | null>(null);
  const [isSuperAdminLoading, setIsSuperAdminLoading] = useState(false);
  const [musicResult, setMusicResult] = useState<{ message: string; count: number } | null>(null);
  const [musicError, setMusicError] = useState<string | null>(null);
  const [isMusicLoading, setIsMusicLoading] = useState(false);
  const [audioResult, setAudioResult] = useState<{ message: string; updated: number } | null>(null);
  const [audioError, setAudioError] = useState<string | null>(null);
  const [isAudioLoading, setIsAudioLoading] = useState(false);
  const [knowledgeResult, setKnowledgeResult] = useState<number | null>(null);
  const [knowledgeError, setKnowledgeError] = useState<string | null>(null);
  const [isKnowledgeLoading, setIsKnowledgeLoading] = useState(false);

  const handleSuperAdmin = async () => {
    setIsSuperAdminLoading(true);
    setSuperAdminError(null);
    setSuperAdminResult(null);
    
    try {
      const res = await makeFirstUserSuperAdmin();
      setSuperAdminResult(res);
      if (res.madeSuperAdmin) {
        // Reload after 2 seconds
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      }
    } catch (err) {
      setSuperAdminError(err instanceof Error ? err.message : "Bir hata oluştu");
    } finally {
      setIsSuperAdminLoading(false);
    }
  };

  const handleMigration = async () => {
    setIsLoading(true);
    setError(null);
    setResult(null);
    
    try {
      const res = await fixUsersWithoutRoles();
      setResult(res);
      if (res.success) {
        // Reload after 2 seconds
        setTimeout(() => {
          window.location.href = "/admin";
        }, 2000);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Bir hata oluştu");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSeedMusic = async (force = false) => {
    setIsMusicLoading(true);
    setMusicError(null);
    setMusicResult(null);
    
    try {
      const res = await seedMusic({ force });
      setMusicResult(res);
    } catch (err) {
      setMusicError(err instanceof Error ? err.message : "Bir hata oluştu");
    } finally {
      setIsMusicLoading(false);
    }
  };

  const handleAddAudioUrls = async () => {
    setIsAudioLoading(true);
    setAudioError(null);
    setAudioResult(null);
    
    try {
      const res = await addAudioUrls();
      setAudioResult(res);
    } catch (err) {
      setAudioError(err instanceof Error ? err.message : "Bir hata oluştu");
    } finally {
      setIsAudioLoading(false);
    }
  };

  const handleSeedKnowledge = async () => {
    setIsKnowledgeLoading(true);
    setKnowledgeError(null);
    setKnowledgeResult(null);
    
    try {
      const count = await seedKnowledge();
      setKnowledgeResult(count);
    } catch (err) {
      setKnowledgeError(err instanceof Error ? err.message : "Bir hata oluştu");
    } finally {
      setIsKnowledgeLoading(false);
    }
  };

  // Show different messages based on canBecomeSuperAdmin status
  const getSuperAdminCardContent = () => {
    if (!canBecomeSuperAdmin) {
      return null; // Loading
    }

    if (canBecomeSuperAdmin.reason === "already_super_admin") {
      return (
        <Alert className="border-green-500/50 bg-green-500/5">
          <Crown className="h-4 w-4 text-green-600" />
          <AlertTitle className="text-green-600">Kalıcı Süper Adminsiniz! 👑</AlertTitle>
          <AlertDescription>
            Siz bu uygulamanın <strong>tek ve kalıcı süper admini</strong>siniz. Binlerce kişi uygulamayı indirse bile, sadece siz süper admin olabilirsiniz.
          </AlertDescription>
        </Alert>
      );
    }

    if (canBecomeSuperAdmin.reason === "super_admin_already_set") {
      return (
        <Alert className="border-red-500/50 bg-red-500/5">
          <Lock className="h-4 w-4 text-red-600" />
          <AlertTitle className="text-red-600">Süper Admin Zaten Atanmış</AlertTitle>
          <AlertDescription>
            Bu uygulamanın süper admini zaten başka bir kullanıcı tarafından ayarlanmış. Sadece o kullanıcı süper admin olabilir.
          </AlertDescription>
        </Alert>
      );
    }

    // Can become super admin
    return (
      <>
        <Alert className="border-purple-500/30 bg-purple-500/5">
          <Shield className="h-4 w-4 text-purple-600" />
          <AlertTitle className="text-purple-600">🔒 Kalıcı Süper Admin Yetkisi</AlertTitle>
          <AlertDescription>
            <strong>ÖNEMLİ:</strong> Bu butona bastığınızda, hesabınız <strong>kalıcı olarak</strong> süper admin olarak kaydedilir. 
            <br />
            <br />
            Bundan sonra:
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>Binlerce kişi uygulamayı indirse bile</li>
              <li>Veritabanı sıfırlansa bile</li>
              <li>Yeni kullanıcılar kayıt olsa bile</li>
            </ul>
            <br />
            <strong>SADECE SİZ süper admin olabilirsiniz.</strong>
          </AlertDescription>
        </Alert>

        <Button 
          onClick={handleSuperAdmin} 
          disabled={isSuperAdminLoading || superAdminResult?.success}
          className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
          size="lg"
        >
          {isSuperAdminLoading ? "İşleniyor..." : superAdminResult?.success ? "✅ Tamamlandı!" : "🔒 Kalıcı Süper Admin Ol"}
        </Button>

        {superAdminResult && superAdminResult.success && (
          <Alert className="border-green-500/50 bg-green-500/5">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <AlertTitle className="text-green-600">🎉 Başarılı!</AlertTitle>
            <AlertDescription>
              {superAdminResult.message}
              {superAdminResult.madeSuperAdmin && (
                <>
                  <br />
                  <br />
                  <strong>Token'ınız sisteme kalıcı olarak kaydedildi.</strong>
                  <br />
                  <span className="text-xs">Sayfa yenileniyor...</span>
                </>
              )}
            </AlertDescription>
          </Alert>
        )}

        {superAdminError && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Hata</AlertTitle>
            <AlertDescription>
              {superAdminError}
            </AlertDescription>
          </Alert>
        )}
      </>
    );
  };

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-16 max-w-2xl">
        {/* Super Admin Kartı */}
        {canBecomeSuperAdmin && (
          <Card className="mb-6 border-purple-500/50 bg-gradient-to-br from-purple-500/5 to-pink-500/5">
            <CardHeader>
              <div className="flex items-center gap-2 mb-2">
                {canBecomeSuperAdmin.reason === "already_super_admin" ? (
                  <Crown className="h-6 w-6 text-purple-600" />
                ) : (
                  <Shield className="h-6 w-6 text-purple-600" />
                )}
                <CardTitle className="text-2xl">
                  {canBecomeSuperAdmin.reason === "already_super_admin" 
                    ? "Süper Admin Durumu" 
                    : "Kalıcı Süper Admin Ol"}
                </CardTitle>
              </div>
              <CardDescription>
                {canBecomeSuperAdmin.reason === "already_super_admin"
                  ? "Siz bu uygulamanın kalıcı süper adminisiniz."
                  : canBecomeSuperAdmin.reason === "super_admin_already_set"
                  ? "Süper admin yetkisi başka bir kullanıcıya ait."
                  : "Kendinizi kalıcı süper admin olarak kaydedin."}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {getSuperAdminCardContent()}
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2 mb-2">
              <Shield className="h-6 w-6 text-primary" />
              <CardTitle className="text-2xl">Admin Kurulumu</CardTitle>
            </div>
            <CardDescription>
              Hesabınıza admin yetkisi atamak için bu sayfayı kullanın.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Önemli</AlertTitle>
              <AlertDescription>
                Bu işlem, kayıtlı ilk kullanıcıya süper admin yetkisi verir ve tüm admin izinlerini (jeton yükleme, kullanıcı yönetimi, vb.) ekler. Diğer kullanıcılar normal kullanıcı olarak ayarlanır.
              </AlertDescription>
            </Alert>

            <Button 
              onClick={handleMigration} 
              disabled={isLoading || result?.success}
              className="w-full"
              size="lg"
            >
              {isLoading ? "İşleniyor..." : result?.success ? "Tamamlandı!" : "Rolleri ve İzinleri Düzelt"}
            </Button>

            {result && result.success && (
              <Alert>
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <AlertTitle className="text-green-600">Başarılı</AlertTitle>
                <AlertDescription>
                  {result.message}
                  <br />
                  <span className="text-xs">Admin paneline yönlendiriliyorsunuz...</span>
                </AlertDescription>
              </Alert>
            )}

            {error && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Hata</AlertTitle>
                <AlertDescription>
                  {error}
                </AlertDescription>
              </Alert>
            )}

            <div className="text-sm text-muted-foreground space-y-2 pt-4 border-t">
              <p><strong>Ne olacak?</strong></p>
              <ul className="list-disc list-inside space-y-1">
                <li>İlk kayıtlı kullanıcı süper admin olacak</li>
                <li>Tüm admin izinleri (jeton yükleme, kullanıcı yönetimi, içerik yönetimi) eklenecek</li>
                <li>Admin olan ama izinleri eksik kullanıcılara tam yetkiler verilecek</li>
                <li>Diğer kullanıcılar normal kullanıcı olacak</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-xl">Müzik Kütüphanesi Kurulumu</CardTitle>
            <CardDescription>
              Post ve story'lere eklenebilecek örnek müzikleri yükleyin.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Bilgi</AlertTitle>
              <AlertDescription>
                Bu işlem, müzik kütüphanesine 40+ örnek müzik ekler (tümü dinlenebilir).
              </AlertDescription>
            </Alert>

            <div className="flex gap-2">
              <Button 
                onClick={() => handleSeedMusic(false)} 
                disabled={isMusicLoading || !!musicResult}
                className="flex-1"
                variant="secondary"
              >
                {isMusicLoading ? "Ekleniyor..." : musicResult ? "Müzikler Eklendi!" : "Müzik Kütüphanesini Yükle"}
              </Button>
              
              <Button 
                onClick={() => handleSeedMusic(true)} 
                disabled={isMusicLoading}
                className="flex-1"
                variant="outline"
              >
                {isMusicLoading ? "Yenileniyor..." : "Yeniden Yükle"}
              </Button>
            </div>

            {musicResult && (
              <Alert>
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <AlertTitle className="text-green-600">Başarılı</AlertTitle>
                <AlertDescription>
                  {musicResult.message} ({musicResult.count} müzik)
                </AlertDescription>
              </Alert>
            )}

            {musicError && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Hata</AlertTitle>
                <AlertDescription>
                  {musicError}
                </AlertDescription>
              </Alert>
            )}

            <div className="pt-4 border-t space-y-4">
              <div className="text-sm font-medium">Müzikleri Dinlenebilir Hale Getir</div>
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Uyarı</AlertTitle>
                <AlertDescription>
                  Eğer müzik seçicide play (▶️) butonları görünmüyorsa, bu butona tıklayın. Tüm müziklere önizleme ses dosyaları eklenecek.
                </AlertDescription>
              </Alert>

              <Button 
                onClick={handleAddAudioUrls} 
                disabled={isAudioLoading || !!audioResult}
                className="w-full"
                variant="default"
              >
                {isAudioLoading ? "Ekleniyor..." : audioResult ? "Ses Dosyaları Eklendi!" : "Müziklere Ses Dosyası Ekle"}
              </Button>

              {audioResult && (
                <Alert>
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <AlertTitle className="text-green-600">Başarılı</AlertTitle>
                  <AlertDescription>
                    {audioResult.message}
                  </AlertDescription>
                </Alert>
              )}

              {audioError && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>Hata</AlertTitle>
                  <AlertDescription>
                    {audioError}
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-xl">İslami Bilgi Kütüphanesi</CardTitle>
            <CardDescription>
              Manevi sayfada günlük gösterilecek İslami bilgileri yükleyin.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Bilgi</AlertTitle>
              <AlertDescription>
                Bu işlem, 30 adet günlük İslami bilgi ekler (hadis, fıkıh, siyer, ahlak, ibadet konuları). Her gün farklı bir bilgi gösterilir.
              </AlertDescription>
            </Alert>

            <Button 
              onClick={handleSeedKnowledge} 
              disabled={isKnowledgeLoading || knowledgeResult !== null}
              className="w-full"
              variant="secondary"
            >
              {isKnowledgeLoading ? "Ekleniyor..." : knowledgeResult !== null ? "Bilgiler Eklendi!" : "İslami Bilgileri Yükle"}
            </Button>

            {knowledgeResult !== null && (
              <Alert>
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <AlertTitle className="text-green-600">Başarılı</AlertTitle>
                <AlertDescription>
                  {knowledgeResult} adet İslami bilgi başarıyla eklendi.
                </AlertDescription>
              </Alert>
            )}

            {knowledgeError && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Hata</AlertTitle>
                <AlertDescription>
                  {knowledgeError}
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* Music Management */}
        <div className="mt-6">
          <MusicManagement />
        </div>
      </div>
    </MainLayout>
  );
}

export default function AdminSetup() {
  return (
    <>
      <Unauthenticated>
        <MainLayout>
          <div className="container mx-auto px-4 py-16 max-w-md text-center">
            <Card>
              <CardHeader>
                <CardTitle>Giriş Yapın</CardTitle>
                <CardDescription>
                  Admin kurulumuna erişmek için lütfen giriş yapın
                </CardDescription>
              </CardHeader>
              <CardContent>
                <SignInButton className="w-full" />
              </CardContent>
            </Card>
          </div>
        </MainLayout>
      </Unauthenticated>
      
      <AuthLoading>
        <MainLayout>
          <div className="container mx-auto px-4 py-16 max-w-2xl">
            <Skeleton className="h-64 w-full" />
          </div>
        </MainLayout>
      </AuthLoading>
      
      <Authenticated>
        <AdminSetupInner />
      </Authenticated>
    </>
  );
}
