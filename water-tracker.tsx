import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import { Button } from "@/components/ui/button.tsx";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card.tsx";
import { Input } from "@/components/ui/input.tsx";
import { Label } from "@/components/ui/label.tsx";
import { Progress } from "@/components/ui/progress.tsx";
import { Droplet, Plus, RefreshCw, Target } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

function DropletIconWrapper() {
  return <Droplet className="h-4 w-4" />;
}

function PlusIconWrapper() {
  return <Plus className="h-4 w-4" />;
}

function RefreshCwIconWrapper() {
  return <RefreshCw className="h-4 w-4" />;
}

function TargetIconWrapper() {
  return <Target className="h-4 w-4" />;
}

export default function WaterTracker() {
  const todayIntake = useQuery(api.water.getTodayIntake);
  const weeklyHistory = useQuery(api.water.getWeeklyHistory);
  const addWater = useMutation(api.water.addWater);
  const updateGoal = useMutation(api.water.updateGoal);
  const resetToday = useMutation(api.water.resetToday);

  const [customAmount, setCustomAmount] = useState("");
  const [customGoal, setCustomGoal] = useState("");
  const [showGoalInput, setShowGoalInput] = useState(false);

  const currentAmount = todayIntake?.amount || 0;
  const currentGoal = todayIntake?.goal || 2000;
  const percentage = Math.min((currentAmount / currentGoal) * 100, 100);

  const quickAmounts = [250, 500, 750, 1000];

  const handleAddWater = async (amount: number) => {
    try {
      await addWater({ amount });
      toast.success(`${amount} ml su eklendi!`);
      setCustomAmount("");
    } catch (error) {
      toast.error("Su eklenirken hata oluştu");
    }
  };

  const handleUpdateGoal = async () => {
    const goal = parseInt(customGoal);
    if (isNaN(goal) || goal <= 0) {
      toast.error("Geçerli bir hedef girin");
      return;
    }
    try {
      await updateGoal({ goal });
      toast.success("Günlük hedef güncellendi!");
      setCustomGoal("");
      setShowGoalInput(false);
    } catch (error) {
      toast.error("Hedef güncellenirken hata oluştu");
    }
  };

  const handleReset = async () => {
    try {
      await resetToday();
      toast.success("Günlük takip sıfırlandı");
    } catch (error) {
      toast.error("Sıfırlanırken hata oluştu");
    }
  };

  return (
    <div className="space-y-6">
      {/* Today's Progress */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            💧 Bugünkü Su Tüketimi
          </CardTitle>
          <CardDescription>
            Günlük su hedefine ulaşmak için takip et
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Progress Circle Visual */}
          <div className="flex flex-col items-center justify-center py-4">
            <div className="relative w-48 h-48 flex items-center justify-center">
              <div className="absolute inset-0 rounded-full border-8 border-muted" />
              <div
                className="absolute inset-0 rounded-full border-8 border-blue-500 transition-all duration-500"
                style={{
                  clipPath: `inset(${100 - percentage}% 0 0 0)`,
                }}
              />
              <div className="text-center z-10">
                <div className="text-4xl font-bold">{currentAmount} ml</div>
                <div className="text-sm text-muted-foreground">/ {currentGoal} ml</div>
                <div className="text-xs text-muted-foreground mt-1">
                  {Math.round(percentage)}%
                </div>
              </div>
            </div>
          </div>

          <Progress value={percentage} className="h-3" />

          {/* Quick Add Buttons */}
          <div className="space-y-3">
            <Label>Hızlı Ekle</Label>
            <div className="grid grid-cols-4 gap-2">
              {quickAmounts.map((amount) => (
                <Button
                  key={amount}
                  variant="outline"
                  size="sm"
                  onClick={() => handleAddWater(amount)}
                  className="flex items-center gap-1"
                >
                  <PlusIconWrapper />
                  {amount}ml
                </Button>
              ))}
            </div>
          </div>

          {/* Custom Amount */}
          <div className="space-y-2">
            <Label>Özel Miktar (ml)</Label>
            <div className="flex gap-2">
              <Input
                type="number"
                placeholder="Miktar girin..."
                value={customAmount}
                onChange={(e) => setCustomAmount(e.target.value)}
              />
              <Button
                onClick={() => {
                  const amount = parseInt(customAmount);
                  if (!isNaN(amount) && amount > 0) {
                    handleAddWater(amount);
                  } else {
                    toast.error("Geçerli bir miktar girin");
                  }
                }}
                disabled={!customAmount}
              >
                <PlusIconWrapper />
              </Button>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowGoalInput(!showGoalInput)}
              className="gap-2"
            >
              <TargetIconWrapper />
              Hedefi Değiştir
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleReset}
              className="gap-2"
            >
              <RefreshCwIconWrapper />
              Sıfırla
            </Button>
          </div>

          {showGoalInput && (
            <div className="space-y-2 p-4 bg-muted rounded-lg">
              <Label>Yeni Günlük Hedef (ml)</Label>
              <div className="flex gap-2">
                <Input
                  type="number"
                  placeholder="Örn: 2000"
                  value={customGoal}
                  onChange={(e) => setCustomGoal(e.target.value)}
                />
                <Button onClick={handleUpdateGoal}>Kaydet</Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Weekly History */}
      <Card>
        <CardHeader>
          <CardTitle>📊 Son 7 Gün</CardTitle>
          <CardDescription>Haftalık su tüketim geçmişin</CardDescription>
        </CardHeader>
        <CardContent>
          {weeklyHistory && weeklyHistory.length > 0 ? (
            <div className="space-y-3">
              {weeklyHistory.map((intake) => {
                const date = new Date(intake.date);
                const dayName = date.toLocaleDateString("tr-TR", { weekday: "short" });
                const dayNum = date.toLocaleDateString("tr-TR", { day: "numeric", month: "short" });
                const dayPercentage = Math.min((intake.amount / intake.goal) * 100, 100);
                
                return (
                  <div key={intake._id} className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="font-medium">{dayName}, {dayNum}</span>
                      <span className="text-muted-foreground">
                        {intake.amount} / {intake.goal} ml
                      </span>
                    </div>
                    <Progress value={dayPercentage} className="h-2" />
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              Henüz veri yok
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
