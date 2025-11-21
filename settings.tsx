import { Authenticated, Unauthenticated, AuthLoading } from "convex/react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import MainLayout from "@/components/layout/main-layout.tsx";
import { SignInButton } from "@/components/ui/signin.tsx";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card.tsx";
import { Settings, Save, ArrowLeft } from "lucide-react";
import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input.tsx";
import { Label } from "@/components/ui/label.tsx";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

function AdminSettingsContent() {
  const verificationPrice = useQuery(api.settings.getVerificationPrice, {});
  const updateSetting = useMutation(api.settings.updateSetting);
  const navigate = useNavigate();

  const [price, setPrice] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (verificationPrice) {
      setPrice(verificationPrice);
    }
  }, [verificationPrice]);

  const handleSave = async () => {
    if (!price || isNaN(Number(price)) || Number(price) < 0) {
      toast.error("Lütfen geçerli bir fiyat girin");
      return;
    }

    setIsSaving(true);
    try {
      await updateSetting({
        key: "verification_price",
        value: price,
      });
      toast.success("Ayarlar kaydedildi");
    } catch (error) {
      const err = error as Error;
      toast.error(err.message || "Kaydetme başarısız");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-2">
            <Settings className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold">Doğrulama Ayarları</h1>
          </div>
          <Button
            variant="ghost"
            onClick={() => navigate("/admin")}
          >
            <ArrowLeft className="h-4 w-4" />
            Geri Dön
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Doğrulama Ücreti Ayarları</CardTitle>
            <CardDescription>
              Hesap doğrulama başvurusu için ücret belirleyin
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="price">Doğrulama Ücreti (TL)</Label>
              <Input
                id="price"
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Kullanıcıların kırmızı rozet başvurusu için ödeyeceği tutar
              </p>
            </div>

            <Button 
              onClick={handleSave} 
              disabled={isSaving}
              className="w-full sm:w-auto"
            >
              <Save className="h-4 w-4 mr-2" />
              {isSaving ? "Kaydediliyor..." : "Kaydet"}
            </Button>

            <div className="pt-4 border-t">
              <h3 className="font-semibold mb-2">Bilgi</h3>
              <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                <li>Ünlüler ve kamu figürleri manuel olarak ücretsiz doğrulanabilir</li>
                <li>Ücret 0 olarak ayarlanırsa başvurular ücretsiz olur</li>
                <li>Değişiklikler anında uygulanır</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}

export default function AdminSettingsPage() {
  return (
    <>
      <Unauthenticated>
        <div className="min-h-screen flex items-center justify-center p-4">
          <div className="text-center space-y-4">
            <p className="text-muted-foreground">Admin girişi yapın</p>
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
        <AdminSettingsContent />
      </Authenticated>
    </>
  );
}
