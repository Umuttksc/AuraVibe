import { Authenticated, Unauthenticated, AuthLoading } from "convex/react";
import MainLayout from "@/components/layout/main-layout.tsx";
import { SignInButton } from "@/components/ui/signin.tsx";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Input } from "@/components/ui/input.tsx";
import { Label } from "@/components/ui/label.tsx";
import { toast } from "sonner";
import { useState, useEffect } from "react";
import { Coffee, Sparkles, Hand, Star, Eye } from "lucide-react";

function FortuneSettingsContent() {
  const currentUser = useQuery(api.users.getCurrentUser);
  const fortunePricing = useQuery(api.admin.fortuneSettings.getFortunePricing);
  const updatePricing = useMutation(api.admin.fortuneSettings.updateFortunePricing);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    coffeeFortunePricePerFortune: 1000,
    tarotFortunePricePerFortune: 1500,
    palmFortunePricePerFortune: 2000,
    birthchartFortunePricePerFortune: 2500,
    auraFortunePricePerFortune: 2000,
    dailyFreeCoffee: 1,
    dailyFreeTarot: 1,
    dailyFreePalm: 0,
    dailyFreeBirthchart: 0,
    dailyFreeAura: 0,
  });

  useEffect(() => {
    if (fortunePricing) {
      setFormData({
        coffeeFortunePricePerFortune: fortunePricing.coffeeFortunePricePerFortune,
        tarotFortunePricePerFortune: fortunePricing.tarotFortunePricePerFortune,
        palmFortunePricePerFortune: fortunePricing.palmFortunePricePerFortune ?? 2000,
        birthchartFortunePricePerFortune: fortunePricing.birthchartFortunePricePerFortune ?? 2500,
        auraFortunePricePerFortune: fortunePricing.auraFortunePricePerFortune ?? 2000,
        dailyFreeCoffee: fortunePricing.dailyFreeCoffee,
        dailyFreeTarot: fortunePricing.dailyFreeTarot,
        dailyFreePalm: fortunePricing.dailyFreePalm ?? 0,
        dailyFreeBirthchart: fortunePricing.dailyFreeBirthchart ?? 0,
        dailyFreeAura: fortunePricing.dailyFreeAura ?? 0,
      });
    }
  }, [fortunePricing]);

  if (!currentUser) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-[50vh]">
          <Skeleton className="h-20 w-20 rounded-full" />
        </div>
      </MainLayout>
    );
  }

  if (currentUser.role !== "admin" && !currentUser.isSuperAdmin) {
    return (
      <MainLayout>
        <div className="max-w-2xl mx-auto p-4">
          <Card>
            <CardContent className="pt-6">
              <p className="text-center text-muted-foreground">
                Bu sayfaya erişim yetkiniz yok.
              </p>
            </CardContent>
          </Card>
        </div>
      </MainLayout>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await updatePricing(formData);
      toast.success("Fal ayarları güncellendi");
    } catch (error) {
      toast.error("Ayarlar güncellenirken hata oluştu");
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto p-4 space-y-6">
        <div>
          <h1 className="text-2xl font-bold mb-2">Fal Ayarları</h1>
          <p className="text-muted-foreground">
            Fal fiyatlarını ve günlük ücretsiz limitleri yönetin
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Coffee Fortune */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Coffee className="h-5 w-5" />
                Kahve Falı
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="coffeeFortunePricePerFortune">
                    Fiyat (Kuruş)
                  </Label>
                  <Input
                    id="coffeeFortunePricePerFortune"
                    type="number"
                    value={formData.coffeeFortunePricePerFortune}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        coffeeFortunePricePerFortune: parseInt(e.target.value),
                      })
                    }
                    min="0"
                  />
                  <p className="text-xs text-muted-foreground">
                    {(formData.coffeeFortunePricePerFortune / 100).toFixed(2)} TL
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dailyFreeCoffee">Günlük Ücretsiz Limit</Label>
                  <Input
                    id="dailyFreeCoffee"
                    type="number"
                    value={formData.dailyFreeCoffee}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        dailyFreeCoffee: parseInt(e.target.value),
                      })
                    }
                    min="0"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tarot */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5" />
                Tarot
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="tarotFortunePricePerFortune">
                    Fiyat (Kuruş)
                  </Label>
                  <Input
                    id="tarotFortunePricePerFortune"
                    type="number"
                    value={formData.tarotFortunePricePerFortune}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        tarotFortunePricePerFortune: parseInt(e.target.value),
                      })
                    }
                    min="0"
                  />
                  <p className="text-xs text-muted-foreground">
                    {(formData.tarotFortunePricePerFortune / 100).toFixed(2)} TL
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dailyFreeTarot">Günlük Ücretsiz Limit</Label>
                  <Input
                    id="dailyFreeTarot"
                    type="number"
                    value={formData.dailyFreeTarot}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        dailyFreeTarot: parseInt(e.target.value),
                      })
                    }
                    min="0"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Palm Reading */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Hand className="h-5 w-5" />
                El Falı
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="palmFortunePricePerFortune">
                    Fiyat (Kuruş)
                  </Label>
                  <Input
                    id="palmFortunePricePerFortune"
                    type="number"
                    value={formData.palmFortunePricePerFortune}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        palmFortunePricePerFortune: parseInt(e.target.value),
                      })
                    }
                    min="0"
                  />
                  <p className="text-xs text-muted-foreground">
                    {(formData.palmFortunePricePerFortune / 100).toFixed(2)} TL
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dailyFreePalm">Günlük Ücretsiz Limit</Label>
                  <Input
                    id="dailyFreePalm"
                    type="number"
                    value={formData.dailyFreePalm}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        dailyFreePalm: parseInt(e.target.value),
                      })
                    }
                    min="0"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Birth Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Star className="h-5 w-5" />
                Doğum Haritası
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="birthchartFortunePricePerFortune">
                    Fiyat (Kuruş)
                  </Label>
                  <Input
                    id="birthchartFortunePricePerFortune"
                    type="number"
                    value={formData.birthchartFortunePricePerFortune}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        birthchartFortunePricePerFortune: parseInt(e.target.value),
                      })
                    }
                    min="0"
                  />
                  <p className="text-xs text-muted-foreground">
                    {(formData.birthchartFortunePricePerFortune / 100).toFixed(2)} TL
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dailyFreeBirthchart">Günlük Ücretsiz Limit</Label>
                  <Input
                    id="dailyFreeBirthchart"
                    type="number"
                    value={formData.dailyFreeBirthchart}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        dailyFreeBirthchart: parseInt(e.target.value),
                      })
                    }
                    min="0"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Aura Reading */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5" />
                Aura Okuma
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="auraFortunePricePerFortune">
                    Fiyat (Kuruş)
                  </Label>
                  <Input
                    id="auraFortunePricePerFortune"
                    type="number"
                    value={formData.auraFortunePricePerFortune}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        auraFortunePricePerFortune: parseInt(e.target.value),
                      })
                    }
                    min="0"
                  />
                  <p className="text-xs text-muted-foreground">
                    {(formData.auraFortunePricePerFortune / 100).toFixed(2)} TL
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dailyFreeAura">Günlük Ücretsiz Limit</Label>
                  <Input
                    id="dailyFreeAura"
                    type="number"
                    value={formData.dailyFreeAura}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        dailyFreeAura: parseInt(e.target.value),
                      })
                    }
                    min="0"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Button type="submit" disabled={isSubmitting} className="w-full">
            {isSubmitting ? "Kaydediliyor..." : "Ayarları Kaydet"}
          </Button>
        </form>
      </div>
    </MainLayout>
  );
}

export default function FortuneSettingsPage() {
  return (
    <>
      <Unauthenticated>
        <div className="min-h-screen flex items-center justify-center p-4">
          <div className="text-center space-y-4">
            <p className="text-muted-foreground">
              Bu sayfayı görüntülemek için giriş yapın
            </p>
            <SignInButton />
          </div>
        </div>
      </Unauthenticated>
      <AuthLoading>
        <div className="min-h-screen flex items-center justify-center">
          <Skeleton className="h-20 w-20 rounded-full" />
        </div>
      </AuthLoading>
      <Authenticated>
        <FortuneSettingsContent />
      </Authenticated>
    </>
  );
}
