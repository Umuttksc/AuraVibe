import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import { useState } from "react";
import { Plus, Trash2, Moon } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog.tsx";
import { Input } from "@/components/ui/input.tsx";
import { Textarea } from "@/components/ui/textarea.tsx";
import { Label } from "@/components/ui/label.tsx";
import { Slider } from "@/components/ui/slider.tsx";
import { Badge } from "@/components/ui/badge.tsx";
import { toast } from "sonner";
import type { Id } from "@/convex/_generated/dataModel.d.ts";

export default function SleepTrackingView() {
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [dialogOpen, setDialogOpen] = useState(false);
  const [bedtime, setBedtime] = useState("22:00");
  const [wakeTime, setWakeTime] = useState("07:00");
  const [quality, setQuality] = useState([3]);
  const [notes, setNotes] = useState("");

  const today = new Date();
  const thirtyDaysAgo = new Date(today);
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const startDate = thirtyDaysAgo.toISOString().split("T")[0];
  const endDate = today.toISOString().split("T")[0];

  const sleepLogs = useQuery(api.wellnessSleep.getSleepLogs, {
    startDate,
    endDate,
  });

  const sleepStats = useQuery(api.wellnessSleep.getSleepStats, {
    startDate,
    endDate,
  });

  const logSleep = useMutation(api.wellnessSleep.logSleep);
  const deleteSleepLog = useMutation(api.wellnessSleep.deleteSleepLog);

  const calculateDuration = (start: string, end: string) => {
    const [startHour, startMin] = start.split(":").map(Number);
    const [endHour, endMin] = end.split(":").map(Number);
    
    let duration = (endHour * 60 + endMin) - (startHour * 60 + startMin);
    if (duration < 0) duration += 24 * 60; // Next day
    
    return duration;
  };

  const handleLogSleep = async () => {
    const duration = calculateDuration(bedtime, wakeTime);
    
    try {
      await logSleep({
        date: selectedDate,
        bedTime: bedtime,
        wakeTime,
        duration,
        quality: quality[0],
        notes: notes || undefined,
      });
      toast.success("Uyku kaydedildi");
      setDialogOpen(false);
      // Reset form
      setBedtime("22:00");
      setWakeTime("07:00");
      setQuality([3]);
      setNotes("");
    } catch (error) {
      toast.error("Kayıt başarısız");
    }
  };

  const handleDelete = async (logId: Id<"sleepTracking">) => {
    try {
      await deleteSleepLog({ logId });
      toast.success("Kayıt silindi");
    } catch (error) {
      toast.error("Silme başarısız");
    }
  };

  if (!sleepLogs || !sleepStats) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  const qualityLabels = ["Çok Kötü", "Kötü", "Orta", "İyi", "Mükemmel"];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Uyku Takibi</h2>
          <p className="text-muted-foreground">
            Uyku kaliteni ve sürenizi izleyin
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Uyku Kaydet
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Uyku Kaydı</DialogTitle>
              <DialogDescription>
                Uykunuzu kaydedin ve takip edin
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Tarih</Label>
                <Input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Yatış Saati</Label>
                  <Input
                    type="time"
                    value={bedtime}
                    onChange={(e) => setBedtime(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Kalkış Saati</Label>
                  <Input
                    type="time"
                    value={wakeTime}
                    onChange={(e) => setWakeTime(e.target.value)}
                  />
                </div>
              </div>

              <div className="p-3 bg-muted rounded-lg">
                <p className="text-sm font-medium">
                  Uyku Süresi: {Math.floor(calculateDuration(bedtime, wakeTime) / 60)} saat {calculateDuration(bedtime, wakeTime) % 60} dakika
                </p>
              </div>

              <div className="space-y-2">
                <Label>Uyku Kalitesi: {qualityLabels[quality[0] - 1]}</Label>
                <Slider
                  value={quality}
                  onValueChange={setQuality}
                  min={1}
                  max={5}
                  step={1}
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Çok Kötü</span>
                  <span>Mükemmel</span>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Notlar (Opsiyonel)</Label>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Uykunuz hakkında notlar..."
                  rows={3}
                />
              </div>

              <Button onClick={handleLogSleep} className="w-full">
                Kaydet
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Toplam Kayıt</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{sleepStats.totalLogs}</div>
            <p className="text-xs text-muted-foreground mt-1">Son 30 gün</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Ortalama Süre</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {Math.floor(sleepStats.averageDuration / 60)}h {Math.round(sleepStats.averageDuration % 60)}dk
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Günlük ortalama
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Ortalama Kalite</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {sleepStats.averageQuality.toFixed(1)}/5
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {qualityLabels[Math.round(sleepStats.averageQuality) - 1] || "—"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Sleep Logs */}
      <Card>
        <CardHeader>
          <CardTitle>Uyku Geçmişi</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {sleepLogs.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Henüz uyku kaydı yok
            </div>
          ) : (
            sleepLogs.map((log) => {
              const hours = Math.floor(log.duration / 60);
              const minutes = log.duration % 60;
              return (
                <div
                  key={log._id}
                  className="border rounded-lg p-4 space-y-3 hover:bg-muted/50 transition"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                        <Moon className="h-6 w-6 text-blue-600" />
                      </div>
                      <div>
                        <div className="font-semibold">
                          {hours}h {minutes}dk uyku
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {new Date(log.date).toLocaleDateString("tr-TR", {
                            weekday: "long",
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          })}
                        </div>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(log._id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Yatış: </span>
                      <span className="font-medium">{log.bedTime}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Kalkış: </span>
                      <span className="font-medium">{log.wakeTime}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Badge variant="outline">
                      Kalite: {qualityLabels[log.quality - 1]}
                    </Badge>
                  </div>

                  {log.notes && (
                    <div className="text-sm text-muted-foreground bg-muted p-3 rounded">
                      {log.notes}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </CardContent>
      </Card>
    </div>
  );
}
