import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Input } from "@/components/ui/input.tsx";
import { Label } from "@/components/ui/label.tsx";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog.tsx";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert.tsx";
import { AlertTriangle, Database, Trash2, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

export default function SystemManagement() {
  const resetAllData = useMutation(api.admin.resetAllData);
  const [showResetDialog, setShowResetDialog] = useState(false);
  const [confirmationCode, setConfirmationCode] = useState("");
  const [isResetting, setIsResetting] = useState(false);
  const [resetResult, setResetResult] = useState<{
    success: boolean;
    totalDeleted: number;
    deletedCounts: Record<string, number>;
  } | null>(null);

  const handleReset = async () => {
    if (confirmationCode !== "RESET_ALL_DATA") {
      toast.error("Onay kodu yanlış");
      return;
    }

    setIsResetting(true);
    try {
      const result = await resetAllData({ confirmationCode });
      setResetResult(result);
      toast.success("Tüm veriler başarıyla sıfırlandı!");
      setShowResetDialog(false);
      setConfirmationCode("");
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Warning Alert */}
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Tehlikeli Bölge</AlertTitle>
        <AlertDescription>
          Bu bölümdeki işlemler geri alınamaz. Lütfen dikkatli olun.
        </AlertDescription>
      </Alert>

      {/* Reset Results */}
      {resetResult && (
        <Alert className="border-green-500 bg-green-500/10">
          <CheckCircle2 className="h-4 w-4 text-green-500" />
          <AlertTitle className="text-green-500">Sıfırlama Tamamlandı</AlertTitle>
          <AlertDescription>
            <div className="mt-2 space-y-1 text-sm">
              <div>Toplam {resetResult.totalDeleted} kayıt silindi</div>
              <div className="text-xs text-muted-foreground">
                Kullanıcı hesapları korundu, sadece içerik ve istatistikler sıfırlandı.
              </div>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Reset All Data Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Database className="h-5 w-5" />
            Tüm Verileri Sıfırla
          </CardTitle>
          <CardDescription>
            Uygulamayı Play Store'a yüklemeden önce test verilerini temizleyin
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Bu işlem:</AlertTitle>
            <AlertDescription>
              <ul className="mt-2 space-y-1 list-disc list-inside text-sm">
                <li>Tüm gönderileri, hikayeleri ve yorumları silecek</li>
                <li>Tüm mesajları ve takip ilişkilerini silecek</li>
                <li>Tüm oyun verilerini ve istatistikleri silecek</li>
                <li>Tüm fal, rüya ve wellness kayıtlarını silecek</li>
                <li>Tüm bildirim ve aktiviteleri silecek</li>
                <li className="font-semibold text-primary">Kullanıcı hesaplarını koruyacak (admin girişi korunur)</li>
                <li className="font-semibold text-primary">Kullanıcı istatistiklerini sıfırlayacak</li>
              </ul>
            </AlertDescription>
          </Alert>

          <div className="space-y-2">
            <div className="text-sm font-medium">Onay Gereklilikleri:</div>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>✓ Sadece süper admin bu işlemi yapabilir</li>
              <li>✓ Doğru onay kodunu girmelisiniz</li>
              <li>✓ İşlem geri alınamaz</li>
            </ul>
          </div>

          <Button
            variant="destructive"
            onClick={() => setShowResetDialog(true)}
            className="w-full"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Tüm Verileri Sıfırla
          </Button>
        </CardContent>
      </Card>

      {/* Reset Confirmation Dialog */}
      <Dialog open={showResetDialog} onOpenChange={setShowResetDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Tüm Verileri Sıfırla
            </DialogTitle>
            <DialogDescription className="space-y-3">
              <p className="font-semibold">
                Bu işlem GERİ ALINAMAZ!
              </p>
              <p>
                Tüm içerik verileri silinecek ancak kullanıcı hesapları korunacak.
              </p>
              <p className="text-xs">
                Devam etmek için <code className="px-1 py-0.5 bg-muted rounded">RESET_ALL_DATA</code> yazın:
              </p>
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="confirmation">Onay Kodu</Label>
              <Input
                id="confirmation"
                placeholder="RESET_ALL_DATA"
                value={confirmationCode}
                onChange={(e) => setConfirmationCode(e.target.value)}
                disabled={isResetting}
              />
            </div>
            
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription className="text-xs">
                Bu işlem birkaç dakika sürebilir ve geri alınamaz
              </AlertDescription>
            </Alert>
          </div>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setShowResetDialog(false);
                setConfirmationCode("");
              }}
              disabled={isResetting}
            >
              İptal
            </Button>
            <Button
              variant="destructive"
              onClick={handleReset}
              disabled={confirmationCode !== "RESET_ALL_DATA" || isResetting}
            >
              {isResetting ? (
                <>
                  <div className="h-4 w-4 mr-2 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Sıfırlanıyor...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Sıfırla
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
