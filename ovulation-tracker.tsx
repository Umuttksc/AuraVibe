import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import { Card } from "@/components/ui/card.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Calendar, Plus, Droplet, Thermometer, TestTube, Edit, Trash2, Sun, AlertCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog.tsx";
import { Input } from "@/components/ui/input.tsx";
import { Label } from "@/components/ui/label.tsx";
import { Textarea } from "@/components/ui/textarea.tsx";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select.tsx";
import { toast } from "sonner";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { ConvexError } from "convex/values";

const cervicalMucusOptions = [
  { value: "dry", label: "Kuru", icon: "🏜️" },
  { value: "sticky", label: "Yapışkan", icon: "🟤" },
  { value: "creamy", label: "Kremsi", icon: "🤍" },
  { value: "watery", label: "Sulu", icon: "💧" },
  { value: "egg_white", label: "Yumurta Akı (En Verimli)", icon: "🥚" },
];

export default function OvulationTracker() {
  const currentDate = new Date();
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth() + 1);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(format(currentDate, "yyyy-MM-dd"));
  const [cervicalMucus, setCervicalMucus] = useState<
    "dry" | "sticky" | "creamy" | "watery" | "egg_white" | ""
  >("");
  const [temperature, setTemperature] = useState<string>("");
  const [testResult, setTestResult] = useState<"negative" | "positive" | "">("");
  const [notes, setNotes] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const ovulationData = useQuery(api.ovulationTracking.getOvulationData, {
    year: selectedYear,
    month: selectedMonth,
  });
  const fertilityPrediction = useQuery(api.ovulationTracking.getFertilityPrediction);
  const addOrUpdateEntry = useMutation(api.ovulationTracking.addOrUpdateEntry);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await addOrUpdateEntry({
        date: selectedDate,
        cervicalMucus: cervicalMucus || undefined,
        basalBodyTemperature: temperature ? parseFloat(temperature) : undefined,
        ovulationTestResult: testResult || undefined,
        notes: notes || undefined,
      });
      toast.success("Kayıt eklendi");
      setDialogOpen(false);
      resetForm();
    } catch (error) {
      if (error instanceof ConvexError) {
        const { message } = error.data as { code: string; message: string };
        toast.error(message);
      } else {
        toast.error("Bir hata oluştu");
      }
    } finally {
      setIsSaving(false);
    }
  };

  const resetForm = () => {
    setSelectedDate(format(currentDate, "yyyy-MM-dd"));
    setCervicalMucus("");
    setTemperature("");
    setTestResult("");
    setNotes("");
  };

  const openDialog = (date?: string) => {
    if (date) {
      setSelectedDate(date);
      const existingEntry = ovulationData?.find((e) => e.date === date);
      if (existingEntry) {
        setCervicalMucus(existingEntry.cervicalMucus || "");
        setTemperature(
          existingEntry.basalBodyTemperature
            ? existingEntry.basalBodyTemperature.toString()
            : ""
        );
        setTestResult(existingEntry.ovulationTestResult || "");
        setNotes(existingEntry.notes || "");
      }
    }
    setDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <Card className="overflow-hidden">
        <div className="bg-gradient-to-r from-purple-500 via-pink-500 to-rose-500 p-6 text-white">
          <div className="flex items-start gap-4">
            <div className="h-12 w-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center flex-shrink-0">
              <span className="text-2xl">🌸</span>
            </div>
            <div>
              <h2 className="text-xl font-semibold mb-2">Yumurtlama Takibi</h2>
              <p className="text-white/90 text-sm">
                Doğurganlık pencereni belirle, yumurtlama dönemini takip et. Bazal vücut ısısı, 
                servikal mukus ve yumurtlama testleri ile en doğru tahminleri al.
              </p>
            </div>
          </div>
        </div>
      </Card>

      {/* Fertility Prediction Card */}
      {fertilityPrediction && (
        <Card className="p-6 bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50 dark:from-pink-950/20 dark:via-purple-950/20 dark:to-blue-950/20 border-pink-200 dark:border-pink-900">
          <div className="flex items-start gap-4">
            <div className="h-12 w-12 rounded-full bg-gradient-to-br from-pink-500 to-purple-500 flex items-center justify-center flex-shrink-0">
              <Sun className="h-6 w-6 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-lg mb-2">Doğurganlık Tahmini</h3>
              {fertilityPrediction.isCurrentlyFertile ? (
                <div className="space-y-2">
                  <p className="text-sm font-medium text-green-700 dark:text-green-300">
                    ✨ Şu anda doğurgan dönemdesiniz!
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Verimli dönem: {format(new Date(fertilityPrediction.fertileWindowStart), "d MMMM", { locale: tr })} -{" "}
                    {format(new Date(fertilityPrediction.fertileWindowEnd), "d MMMM", { locale: tr })}
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">
                    Tahmini yumurtlama: {format(new Date(fertilityPrediction.estimatedOvulationDate), "d MMMM yyyy", { locale: tr })}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {fertilityPrediction.daysUntilOvulation > 0
                      ? `${fertilityPrediction.daysUntilOvulation} gün sonra`
                      : "Yumurtlama geçti"}
                  </p>
                </div>
              )}
            </div>
          </div>
        </Card>
      )}

      {/* Info Cards Grid */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* How to Track Card */}
        <Card className="p-6 bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
            <div className="text-sm space-y-2">
              <p className="font-semibold text-blue-900 dark:text-blue-100">
                📝 Nasıl Takip Edilir?
              </p>
              <ul className="text-blue-700 dark:text-blue-300 space-y-1.5 text-xs">
                <li>• Her sabah aynı saatte vücut ısınızı ölçün</li>
                <li>• Servikal mukusu gözlemleyin</li>
                <li>• Yumurtlama testi sonuçlarını kaydedin</li>
                <li>• Düzenli takip yapın</li>
              </ul>
            </div>
          </div>
        </Card>

        {/* Benefits Card */}
        <Card className="p-6 bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900">
          <div className="flex items-start gap-3">
            <Sun className="h-5 w-5 text-emerald-600 dark:text-emerald-400 mt-0.5 flex-shrink-0" />
            <div className="text-sm space-y-2">
              <p className="font-semibold text-emerald-900 dark:text-emerald-100">
                ✨ Faydaları
              </p>
              <ul className="text-emerald-700 dark:text-emerald-300 space-y-1.5 text-xs">
                <li>• Doğurganlık pencerenizi belirleyin</li>
                <li>• Hamilelik planlaması yapın</li>
                <li>• Döngünüzü daha iyi tanıyın</li>
                <li>• Sağlık durumunuzu izleyin</li>
              </ul>
            </div>
          </div>
        </Card>
      </div>

      {/* Entries List */}
      <div className="space-y-3">
        <h3 className="font-semibold">
          {format(new Date(selectedYear, selectedMonth - 1), "MMMM yyyy", { locale: tr })}
        </h3>

        {ovulationData === undefined ? (
          <Card className="p-8 text-center">
            <p className="text-muted-foreground">Yükleniyor...</p>
          </Card>
        ) : ovulationData.length === 0 ? (
          <Card className="p-10 text-center bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20 border-purple-200 dark:border-purple-800">
            <div className="flex flex-col items-center gap-4">
              <div className="h-16 w-16 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                <Calendar className="h-8 w-8 text-white" />
              </div>
              <div className="space-y-2">
                <h3 className="font-semibold text-lg">Henüz Kayıt Yok</h3>
                <p className="text-sm text-muted-foreground max-w-md">
                  İlk yumurtlama kaydını ekleyerek takibe başlayın. Düzenli kayıt tutarak 
                  doğurganlık pencerenizi daha doğru tahmin edebilirsiniz.
                </p>
              </div>
              <Button onClick={() => openDialog()} className="mt-2" size="lg">
                <Plus className="h-5 w-5 mr-2" />
                İlk Kaydı Ekle
              </Button>
            </div>
          </Card>
        ) : (
          <div className="space-y-2">
            {ovulationData.map((entry) => (
              <Card
                key={entry._id}
                className="p-4 hover:shadow-md transition-all cursor-pointer"
                onClick={() => openDialog(entry.date)}
              >
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <div className="font-medium">
                      {format(new Date(entry.date), "d MMMM yyyy, EEEE", { locale: tr })}
                    </div>
                    <div className="flex flex-wrap gap-2 text-sm">
                      {entry.cervicalMucus && (
                        <span className="flex items-center gap-1 px-2 py-1 bg-muted rounded-md">
                          <Droplet className="h-3 w-3" />
                          {cervicalMucusOptions.find((o) => o.value === entry.cervicalMucus)?.label}
                        </span>
                      )}
                      {entry.basalBodyTemperature && (
                        <span className="flex items-center gap-1 px-2 py-1 bg-muted rounded-md">
                          <Thermometer className="h-3 w-3" />
                          {entry.basalBodyTemperature.toFixed(1)}°C
                        </span>
                      )}
                      {entry.ovulationTestResult && (
                        <span
                          className={`flex items-center gap-1 px-2 py-1 rounded-md ${
                            entry.ovulationTestResult === "positive"
                              ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
                              : "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300"
                          }`}
                        >
                          <TestTube className="h-3 w-3" />
                          {entry.ovulationTestResult === "positive" ? "Pozitif" : "Negatif"}
                        </span>
                      )}
                    </div>
                    {entry.notes && (
                      <p className="text-sm text-muted-foreground">{entry.notes}</p>
                    )}
                  </div>
                  <Edit className="h-4 w-4 text-muted-foreground" />
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Entry Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Yumurtlama Kaydı</DialogTitle>
            <DialogDescription>
              {format(new Date(selectedDate), "d MMMM yyyy, EEEE", { locale: tr })}
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
              <Label>Servikal Mukus</Label>
              <Select
                value={cervicalMucus}
                onValueChange={(value) =>
                  setCervicalMucus(
                    value as "dry" | "sticky" | "creamy" | "watery" | "egg_white" | ""
                  )
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seçin" />
                </SelectTrigger>
                <SelectContent>
                  {cervicalMucusOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.icon} {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Bazal Vücut Isısı (°C)</Label>
              <Input
                type="number"
                step="0.1"
                placeholder="36.5"
                value={temperature}
                onChange={(e) => setTemperature(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Yumurtlama Testi</Label>
              <Select
                value={testResult}
                onValueChange={(value) =>
                  setTestResult(value as "negative" | "positive" | "")
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seçin" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="negative">Negatif</SelectItem>
                  <SelectItem value="positive">Pozitif</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Notlar</Label>
              <Textarea
                placeholder="Ek notlar..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              İptal
            </Button>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? "Kaydediliyor..." : "Kaydet"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
