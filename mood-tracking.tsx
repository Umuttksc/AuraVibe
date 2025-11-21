import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
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

const MOOD_OPTIONS = [
  { value: "very_happy", label: "Çok Mutlu", emoji: "😄", color: "text-green-500" },
  { value: "happy", label: "Mutlu", emoji: "😊", color: "text-green-400" },
  { value: "neutral", label: "Nötr", emoji: "😐", color: "text-gray-400" },
  { value: "sad", label: "Üzgün", emoji: "😔", color: "text-blue-400" },
  { value: "very_sad", label: "Çok Üzgün", emoji: "😢", color: "text-blue-500" },
  { value: "anxious", label: "Kaygılı", emoji: "😰", color: "text-yellow-500" },
  { value: "stressed", label: "Stresli", emoji: "😫", color: "text-orange-500" },
  { value: "calm", label: "Sakin", emoji: "😌", color: "text-teal-400" },
  { value: "energetic", label: "Enerjik", emoji: "⚡", color: "text-purple-400" },
  { value: "tired", label: "Yorgun", emoji: "😴", color: "text-indigo-400" },
];

export default function MoodTrackingView() {
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedMood, setSelectedMood] = useState<string>("neutral");
  const [intensity, setIntensity] = useState([5]);
  const [triggers, setTriggers] = useState<string>("");
  const [activities, setActivities] = useState<string>("");
  const [notes, setNotes] = useState("");

  const today = new Date();
  const thirtyDaysAgo = new Date(today);
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const startDate = thirtyDaysAgo.toISOString().split("T")[0];
  const endDate = today.toISOString().split("T")[0];

  const moodLogs = useQuery(api.wellnessMood.getMoodLogs, {
    startDate,
    endDate,
  });

  const moodStats = useQuery(api.wellnessMood.getMoodStats, {
    startDate,
    endDate,
  });

  const logMood = useMutation(api.wellnessMood.logMood);
  const deleteMoodLog = useMutation(api.wellnessMood.deleteMoodLog);

  const handleLogMood = async () => {
    try {
      await logMood({
        date: selectedDate,
        mood: selectedMood as "very_happy" | "happy" | "neutral" | "sad" | "very_sad" | "anxious" | "stressed" | "calm" | "energetic" | "tired",
        intensity: intensity[0],
        triggers: triggers ? triggers.split(",").map((t) => t.trim()) : undefined,
        activities: activities ? activities.split(",").map((a) => a.trim()) : undefined,
        notes: notes || undefined,
      });
      toast.success("Ruh hali kaydedildi");
      setDialogOpen(false);
      // Reset form
      setSelectedMood("neutral");
      setIntensity([5]);
      setTriggers("");
      setActivities("");
      setNotes("");
    } catch (error) {
      toast.error("Kayıt başarısız");
    }
  };

  const handleDelete = async (logId: Id<"moodTracking">) => {
    try {
      await deleteMoodLog({ logId });
      toast.success("Kayıt silindi");
    } catch (error) {
      toast.error("Silme başarısız");
    }
  };

  if (!moodLogs || !moodStats) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Ruh Hali Takibi</h2>
          <p className="text-muted-foreground">
            Duygusal durumunuzu günlük olarak kaydedin
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Ruh Hali Kaydet
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Ruh Halini Kaydet</DialogTitle>
              <DialogDescription>
                Bugünkü ruh halinizi ve yoğunluğunu belirleyin
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

              <div className="space-y-2">
                <Label>Ruh Hali</Label>
                <div className="grid grid-cols-2 gap-2">
                  {MOOD_OPTIONS.map((mood) => (
                    <Button
                      key={mood.value}
                      variant={selectedMood === mood.value ? "default" : "outline"}
                      className="justify-start"
                      onClick={() => setSelectedMood(mood.value)}
                    >
                      <span className="text-2xl mr-2">{mood.emoji}</span>
                      {mood.label}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Yoğunluk: {intensity[0]}/10</Label>
                <Slider
                  value={intensity}
                  onValueChange={setIntensity}
                  min={1}
                  max={10}
                  step={1}
                />
              </div>

              <div className="space-y-2">
                <Label>Tetikleyiciler (virgülle ayırın)</Label>
                <Input
                  value={triggers}
                  onChange={(e) => setTriggers(e.target.value)}
                  placeholder="örn: iş, aile, hava durumu"
                />
              </div>

              <div className="space-y-2">
                <Label>Aktiviteler (virgülle ayırın)</Label>
                <Input
                  value={activities}
                  onChange={(e) => setActivities(e.target.value)}
                  placeholder="örn: spor, müzik dinlemek, arkadaşlarla görüşmek"
                />
              </div>

              <div className="space-y-2">
                <Label>Notlar</Label>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Bugün hakkında notlar..."
                  rows={3}
                />
              </div>

              <Button onClick={handleLogMood} className="w-full">
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
            <div className="text-3xl font-bold">{moodStats.totalLogs}</div>
            <p className="text-xs text-muted-foreground mt-1">Son 30 gün</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Ortalama Yoğunluk</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {moodStats.averageIntensity.toFixed(1)}/10
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Duygusal yoğunluk
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">En Sık Ruh Hali</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {MOOD_OPTIONS.find((m) => m.value === moodStats.mostCommonMood)
                ?.emoji || "—"}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {MOOD_OPTIONS.find((m) => m.value === moodStats.mostCommonMood)
                ?.label || "Henüz kayıt yok"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Mood Distribution */}
      {moodStats.moodDistribution && Object.keys(moodStats.moodDistribution).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Ruh Hali Dağılımı</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {Object.entries(moodStats.moodDistribution)
              .sort(([, a], [, b]) => (b as number) - (a as number))
              .map(([mood, count]) => {
                const moodOption = MOOD_OPTIONS.find((m) => m.value === mood);
                return (
                  <div key={mood} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{moodOption?.emoji}</span>
                      <span className="font-medium">{moodOption?.label}</span>
                    </div>
                    <Badge variant="secondary">{count} gün</Badge>
                  </div>
                );
              })}
          </CardContent>
        </Card>
      )}

      {/* Mood Logs */}
      <Card>
        <CardHeader>
          <CardTitle>Ruh Hali Geçmişi</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {moodLogs.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Henüz ruh hali kaydı yok
            </div>
          ) : (
            moodLogs.map((log) => {
              const moodOption = MOOD_OPTIONS.find((m) => m.value === log.mood);
              return (
                <div
                  key={log._id}
                  className="border rounded-lg p-4 space-y-3 hover:bg-muted/50 transition"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-4xl">{moodOption?.emoji}</span>
                      <div>
                        <div className="font-semibold">{moodOption?.label}</div>
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
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">Yoğunluk: {log.intensity}/10</Badge>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(log._id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {log.triggers && log.triggers.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      <span className="text-sm font-medium">Tetikleyiciler:</span>
                      {log.triggers.map((trigger, idx) => (
                        <Badge key={idx} variant="secondary">
                          {trigger}
                        </Badge>
                      ))}
                    </div>
                  )}

                  {log.activities && log.activities.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      <span className="text-sm font-medium">Aktiviteler:</span>
                      {log.activities.map((activity, idx) => (
                        <Badge key={idx} variant="outline">
                          {activity}
                        </Badge>
                      ))}
                    </div>
                  )}

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
