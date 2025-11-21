import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import { Button } from "@/components/ui/button.tsx";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card.tsx";
import { Input } from "@/components/ui/input.tsx";
import { Label } from "@/components/ui/label.tsx";
import { Textarea } from "@/components/ui/textarea.tsx";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select.tsx";
import { Checkbox } from "@/components/ui/checkbox.tsx";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog.tsx";
import { Plus, Trash2, Check, Clock } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import type { Id } from "@/convex/_generated/dataModel.d.ts";

function PlusIconWrapper() {
  return <Plus className="h-4 w-4" />;
}

function Trash2IconWrapper() {
  return <Trash2 className="h-4 w-4" />;
}

function CheckIconWrapper() {
  return <Check className="h-4 w-4" />;
}

function ClockIconWrapper() {
  return <Clock className="h-4 w-4" />;
}

const categoryLabels: Record<string, string> = {
  cardio: "Kardiyo",
  strength: "Güç",
  flexibility: "Esneklik",
  balance: "Denge",
  other: "Diğer",
};

const categoryEmojis: Record<string, string> = {
  cardio: "🏃",
  strength: "💪",
  flexibility: "🧘",
  balance: "⚖️",
  other: "🏋️",
};

export default function ExercisePlanner() {
  const todayExercises = useQuery(api.exercises.getTodayExercises);
  const allExercises = useQuery(api.exercises.getAllExercises);
  const addExercise = useMutation(api.exercises.addExercise);
  const toggleComplete = useMutation(api.exercises.toggleComplete);
  const deleteExercise = useMutation(api.exercises.deleteExercise);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [duration, setDuration] = useState("");
  const [category, setCategory] = useState<"cardio" | "strength" | "flexibility" | "balance" | "other">("cardio");

  const handleAddExercise = async () => {
    if (!name.trim()) {
      toast.error("Egzersiz adı gerekli");
      return;
    }
    const durationNum = parseInt(duration);
    if (isNaN(durationNum) || durationNum <= 0) {
      toast.error("Geçerli bir süre girin");
      return;
    }

    try {
      await addExercise({
        name: name.trim(),
        description: description.trim() || undefined,
        duration: durationNum,
        category,
      });
      toast.success("Egzersiz eklendi!");
      setName("");
      setDescription("");
      setDuration("");
      setCategory("cardio");
      setIsDialogOpen(false);
    } catch (error) {
      toast.error("Egzersiz eklenirken hata oluştu");
    }
  };

  const handleToggleComplete = async (exerciseId: Id<"exercises">) => {
    try {
      await toggleComplete({ exerciseId });
    } catch (error) {
      toast.error("Durum güncellenirken hata oluştu");
    }
  };

  const handleDeleteExercise = async (exerciseId: Id<"exercises">) => {
    try {
      await deleteExercise({ exerciseId });
      toast.success("Egzersiz silindi");
    } catch (error) {
      toast.error("Egzersiz silinirken hata oluştu");
    }
  };

  const completedToday = todayExercises?.filter((ex) => ex.isCompleted).length || 0;
  const totalToday = todayExercises?.length || 0;
  const totalMinutesToday = todayExercises?.filter((ex) => ex.isCompleted).reduce((sum, ex) => sum + ex.duration, 0) || 0;

  return (
    <div className="space-y-6">
      {/* Stats Card */}
      <Card>
        <CardHeader>
          <CardTitle>🏋️ Bugünkü Egzersizler</CardTitle>
          <CardDescription>
            {completedToday} / {totalToday} egzersiz tamamlandı • {totalMinutesToday} dakika
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="w-full gap-2">
                <PlusIconWrapper />
                Yeni Egzersiz Ekle
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Yeni Egzersiz Ekle</DialogTitle>
                <DialogDescription>
                  Bugünkü egzersiz planına yeni bir aktivite ekle
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Egzersiz Adı *</Label>
                  <Input
                    placeholder="Örn: Koşu"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Açıklama</Label>
                  <Textarea
                    placeholder="Detaylar (opsiyonel)"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={3}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Süre (dakika) *</Label>
                  <Input
                    type="number"
                    placeholder="Örn: 30"
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Kategori</Label>
                  <Select value={category} onValueChange={(val) => setCategory(val as typeof category)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cardio">🏃 Kardiyo</SelectItem>
                      <SelectItem value="strength">💪 Güç</SelectItem>
                      <SelectItem value="flexibility">🧘 Esneklik</SelectItem>
                      <SelectItem value="balance">⚖️ Denge</SelectItem>
                      <SelectItem value="other">🏋️ Diğer</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={handleAddExercise} className="w-full">
                  Ekle
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          {todayExercises && todayExercises.length > 0 ? (
            <div className="space-y-3">
              {todayExercises.map((exercise) => (
                <Card key={exercise._id} className={exercise.isCompleted ? "bg-muted/50" : ""}>
                  <CardContent className="p-4 flex items-start gap-3">
                    <Checkbox
                      checked={exercise.isCompleted}
                      onCheckedChange={() => handleToggleComplete(exercise._id)}
                      className="mt-1"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span>{categoryEmojis[exercise.category]}</span>
                        <h4 className={`font-semibold ${exercise.isCompleted ? "line-through text-muted-foreground" : ""}`}>
                          {exercise.name}
                        </h4>
                      </div>
                      {exercise.description && (
                        <p className="text-sm text-muted-foreground mt-1">
                          {exercise.description}
                        </p>
                      )}
                      <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <ClockIconWrapper />
                          {exercise.duration} dakika
                        </span>
                        <span>{categoryLabels[exercise.category]}</span>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteExercise(exercise._id)}
                      className="shrink-0"
                    >
                      <Trash2IconWrapper />
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              Henüz bugün için egzersiz eklemedin
            </div>
          )}
        </CardContent>
      </Card>

      {/* All Exercises History */}
      <Card>
        <CardHeader>
          <CardTitle>📅 Geçmiş Egzersizler</CardTitle>
          <CardDescription>Tüm egzersiz geçmişin</CardDescription>
        </CardHeader>
        <CardContent>
          {allExercises && allExercises.length > 0 ? (
            <div className="space-y-3">
              {allExercises.slice(0, 10).map((exercise) => {
                const date = new Date(exercise.date);
                const dateStr = date.toLocaleDateString("tr-TR", { day: "numeric", month: "short", year: "numeric" });
                
                return (
                  <div key={exercise._id} className="flex items-center justify-between p-3 rounded-lg border">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{categoryEmojis[exercise.category]}</span>
                      <div>
                        <div className="font-medium flex items-center gap-2">
                          {exercise.name}
                          {exercise.isCompleted && (
                            <span className="inline-flex items-center gap-1 text-xs text-green-600 dark:text-green-400">
                              <CheckIconWrapper />
                              Tamamlandı
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {dateStr} • {exercise.duration} dakika
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              Henüz egzersiz geçmişin yok
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
