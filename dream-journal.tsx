import { useQuery, useMutation, useAction } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import { Button } from "@/components/ui/button.tsx";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card.tsx";
import { Input } from "@/components/ui/input.tsx";
import { Label } from "@/components/ui/label.tsx";
import { Textarea } from "@/components/ui/textarea.tsx";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select.tsx";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog.tsx";
import { Plus, Trash2, Sparkles, Moon } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import type { Id } from "@/convex/_generated/dataModel.d.ts";

function PlusIconWrapper() {
  return <Plus className="h-4 w-4" />;
}

function Trash2IconWrapper() {
  return <Trash2 className="h-4 w-4" />;
}

function SparklesIconWrapper() {
  return <Sparkles className="h-4 w-4" />;
}

function MoonIconWrapper() {
  return <Moon className="h-4 w-4" />;
}

const moodLabels: Record<string, string> = {
  peaceful: "Huzurlu",
  scary: "Korkutucu",
  confusing: "Kafa Karıştırıcı",
  happy: "Mutlu",
  sad: "Üzücü",
  exciting: "Heyecan Verici",
};

const moodEmojis: Record<string, string> = {
  peaceful: "😌",
  scary: "😱",
  confusing: "😕",
  happy: "😊",
  sad: "😢",
  exciting: "🤩",
};

type DreamMood = "peaceful" | "scary" | "confusing" | "happy" | "sad" | "exciting";

export default function DreamJournal() {
  const dreams = useQuery(api.dreams.getDreams);
  const addDream = useMutation(api.dreams.addDream);
  const deleteDream = useMutation(api.dreams.deleteDream);
  const interpretDream = useAction(api.dreamInterpretation.interpretDream);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [interpretingId, setInterpretingId] = useState<Id<"dreams"> | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    date: new Date().toISOString().split("T")[0],
    mood: "peaceful" as DreamMood,
  });

  const resetForm = () => {
    setFormData({
      title: "",
      content: "",
      date: new Date().toISOString().split("T")[0],
      mood: "peaceful",
    });
  };

  const handleAddDream = async () => {
    if (!formData.title.trim() || !formData.content.trim()) {
      toast.error("Rüya başlığı ve içeriği gerekli");
      return;
    }

    try {
      await addDream({
        title: formData.title.trim(),
        content: formData.content.trim(),
        date: formData.date,
        mood: formData.mood,
      });
      toast.success("Rüya kaydedildi!");
      resetForm();
      setIsDialogOpen(false);
    } catch (error) {
      toast.error("Rüya kaydedilirken hata oluştu");
    }
  };

  const handleDeleteDream = async (dreamId: Id<"dreams">) => {
    try {
      await deleteDream({ dreamId });
      toast.success("Rüya silindi");
    } catch (error) {
      toast.error("Rüya silinirken hata oluştu");
    }
  };

  const handleInterpretDream = async (dreamId: Id<"dreams">, content: string) => {
    setInterpretingId(dreamId);
    try {
      await interpretDream({ dreamId, dreamContent: content });
      toast.success("Rüya yorumlandı!");
    } catch (error) {
      toast.error("Rüya yorumlanırken hata oluştu. Groq API anahtarınızı kontrol edin.");
    } finally {
      setInterpretingId(null);
    }
  };

  const totalDreams = dreams?.length || 0;
  const interpretedDreams = dreams?.filter((d) => d.isInterpreted).length || 0;

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 gap-3">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-purple-600">{totalDreams}</div>
            <div className="text-xs text-muted-foreground">Kayıtlı Rüya</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">{interpretedDreams}</div>
            <div className="text-xs text-muted-foreground">Yorumlandı</div>
          </CardContent>
        </Card>
      </div>

      {/* Add Dream Button */}
      <Dialog open={isDialogOpen} onOpenChange={(open) => {
        setIsDialogOpen(open);
        if (!open) resetForm();
      }}>
        <DialogTrigger asChild>
          <Button className="w-full gap-2">
            <PlusIconWrapper />
            Yeni Rüya Ekle
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>🌙 Yeni Rüya Ekle</DialogTitle>
            <DialogDescription>
              Gördüğün rüyayı kaydet ve AI ile yorumlat
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Rüya Başlığı *</Label>
              <Input
                placeholder="Örn: Uçma Rüyası"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label>Rüya İçeriği *</Label>
              <Textarea
                placeholder="Rüyanda ne gördün? Detaylı anlat..."
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                rows={8}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Tarih</Label>
                <Input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Rüya Hissi</Label>
                <Select value={formData.mood} onValueChange={(val) => setFormData({ ...formData, mood: val as DreamMood })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="peaceful">{moodEmojis.peaceful} Huzurlu</SelectItem>
                    <SelectItem value="happy">{moodEmojis.happy} Mutlu</SelectItem>
                    <SelectItem value="exciting">{moodEmojis.exciting} Heyecan Verici</SelectItem>
                    <SelectItem value="confusing">{moodEmojis.confusing} Kafa Karıştırıcı</SelectItem>
                    <SelectItem value="sad">{moodEmojis.sad} Üzücü</SelectItem>
                    <SelectItem value="scary">{moodEmojis.scary} Korkutucu</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Button onClick={handleAddDream} className="w-full">
              Kaydet
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dreams List */}
      <Card>
        <CardHeader>
          <CardTitle>🌙 Rüya Günlüğüm</CardTitle>
          <CardDescription>Rüyalarını kaydet ve yorumlat</CardDescription>
        </CardHeader>
        <CardContent>
          {dreams && dreams.length > 0 ? (
            <div className="space-y-4">
              {dreams.map((dream) => (
                <Card key={dream._id} className="overflow-hidden">
                  <CardContent className="p-0">
                    {/* Header */}
                    <div className="p-4 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-950/20 dark:to-blue-950/20 border-b">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h4 className="font-bold text-lg">{dream.title}</h4>
                            {dream.mood && (
                              <span className="text-xl">{moodEmojis[dream.mood]}</span>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">
                            {new Date(dream.date).toLocaleDateString("tr-TR", {
                              day: "numeric",
                              month: "long",
                              year: "numeric",
                            })}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteDream(dream._id)}
                        >
                          <Trash2IconWrapper />
                        </Button>
                      </div>
                    </div>

                    {/* Content */}
                    <div className="p-4 space-y-4">
                      <div>
                        <h5 className="text-sm font-semibold mb-2">Rüya İçeriği</h5>
                        <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                          {dream.content}
                        </p>
                      </div>

                      {/* Interpretation */}
                      {dream.isInterpreted && dream.interpretation ? (
                        <div className="bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-950/20 dark:to-blue-950/20 p-4 rounded-lg">
                          <h5 className="text-sm font-semibold mb-2 flex items-center gap-2">
                            <SparklesIconWrapper />
                            AI Yorumu
                          </h5>
                          <p className="text-sm whitespace-pre-wrap leading-relaxed">
                            {dream.interpretation}
                          </p>
                        </div>
                      ) : (
                        <Button
                          onClick={() => handleInterpretDream(dream._id, dream.content)}
                          disabled={interpretingId === dream._id}
                          className="w-full gap-2"
                          variant="outline"
                        >
                          <SparklesIconWrapper />
                          {interpretingId === dream._id ? "Yorumlanıyor..." : "AI ile Yorumla"}
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <MoonIconWrapper />
              <p className="mt-2">Henüz rüya kaydetmedin</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
