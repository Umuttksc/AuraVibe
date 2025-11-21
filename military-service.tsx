import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import { Button } from "@/components/ui/button.tsx";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card.tsx";
import { Input } from "@/components/ui/input.tsx";
import { Label } from "@/components/ui/label.tsx";
import { Textarea } from "@/components/ui/textarea.tsx";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog.tsx";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select.tsx";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import { Badge } from "@/components/ui/badge.tsx";
import { 
  Calendar, 
  Clock, 
  Shield, 
  Trash2, 
  Plus, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  Plane,
  Bed,
  AlertTriangle,
  Gavel
} from "lucide-react";
import { toast } from "sonner";
import { format, differenceInDays, parseISO, addDays } from "date-fns";
import { tr } from "date-fns/locale";
import type { Id } from "@/convex/_generated/dataModel.d.ts";

export default function MilitaryService() {
  const militaryService = useQuery(api.militaryService.getMilitaryService);
  const events = useQuery(api.militaryService.getEvents);
  const saveMilitaryService = useMutation(api.militaryService.saveMilitaryService);
  const deleteMilitaryService = useMutation(api.militaryService.deleteMilitaryService);
  const addEvent = useMutation(api.militaryService.addEvent);
  const deleteEvent = useMutation(api.militaryService.deleteEvent);

  const [setupDialogOpen, setSetupDialogOpen] = useState(false);
  const [eventDialogOpen, setEventDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Setup form state
  const [startDate, setStartDate] = useState("");
  const [durationDays, setDurationDays] = useState("180");
  const [unit, setUnit] = useState("");
  const [branch, setBranch] = useState("");
  const [rank, setRank] = useState("");
  const [notes, setNotes] = useState("");
  const [totalRoadRights, setTotalRoadRights] = useState("2");
  const [initialRestDays, setInitialRestDays] = useState("0");
  const [initialDesertion, setInitialDesertion] = useState("0");
  const [initialPunishment, setInitialPunishment] = useState("0");

  // Event form state
  const [eventDate, setEventDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [eventType, setEventType] = useState<"leave" | "road" | "rest" | "desertion" | "punishment" | "rollcall">("rollcall");
  const [eventDays, setEventDays] = useState("1");
  const [rollcallType, setRollcallType] = useState<"morning" | "evening" | "special">("morning");
  const [rollcallStatus, setRollcallStatus] = useState<"present" | "absent" | "late" | "excused">("present");
  const [eventNotes, setEventNotes] = useState("");

  // Moral kartları
  const moralCards = [
    "💪 Her geçen gün, terhise bir adım daha yaklaşıyorsun!",
    "🌟 Vatan borcu ödeniyor, onur dolu günler geride kalıyor!",
    "🎖️ Gurur duyduğun bu günleri asla unutmayacaksın!",
    "🔥 Sen bir savaşçısın! Her zorluğun üstesinden geliyorsun!",
    "⭐ Aileni tekrar göreceğin gün çok yakında!",
    "🏆 Bu tecrübe seni daha güçlü yapıyor!",
    "💯 Askerlik hayata yeni bir bakış açısı kazandırıyor!",
    "🎯 Her yoklama, hedefe bir adım daha!",
    "🌅 Terhis günü güneşi doğacak ve sen özgür olacaksın!",
    "✨ Bu günlerin hatıraları bir ömür boyu kalacak!",
  ];

  const [currentMoralCard, setCurrentMoralCard] = useState(
    moralCards[Math.floor(Math.random() * moralCards.length)]
  );

  const handleSave = async () => {
    if (!startDate || !durationDays) {
      toast.error("Başlangıç tarihi ve süre gerekli");
      return;
    }

    try {
      setIsSubmitting(true);
      await saveMilitaryService({
        startDate,
        durationDays: parseInt(durationDays),
        unit: unit || undefined,
        branch: branch || undefined,
        rank: rank || undefined,
        notes: notes || undefined,
        totalRoadRights: parseInt(totalRoadRights),
        initialRestDays: parseInt(initialRestDays) || undefined,
        initialDesertion: parseInt(initialDesertion) || undefined,
        initialPunishment: parseInt(initialPunishment) || undefined,
      });
      toast.success("Askerlik bilgileri kaydedildi");
      setSetupDialogOpen(false);
    } catch (error) {
      toast.error("Kayıt başarısız: " + (error as Error).message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Askerlik kaydınızı silmek istediğinize emin misiniz?")) return;

    try {
      await deleteMilitaryService({});
      toast.success("Askerlik kaydı silindi");
    } catch (error) {
      toast.error("Silme başarısız: " + (error as Error).message);
    }
  };

  const handleAddEvent = async () => {
    if (!eventDate) {
      toast.error("Tarih gerekli");
      return;
    }

    try {
      setIsSubmitting(true);
      await addEvent({
        date: eventDate,
        type: eventType,
        days: eventType !== "rollcall" ? parseInt(eventDays) : undefined,
        rollcallType: eventType === "rollcall" ? rollcallType : undefined,
        rollcallStatus: eventType === "rollcall" ? rollcallStatus : undefined,
        notes: eventNotes || undefined,
      });
      toast.success("Kayıt eklendi");
      setEventDialogOpen(false);
      setEventNotes("");
      setEventDays("1");
    } catch (error) {
      toast.error("Kayıt başarısız: " + (error as Error).message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteEvent = async (eventId: Id<"militaryEvents">) => {
    if (!confirm("Bu kaydı silmek istediğinize emin misiniz?")) return;

    try {
      await deleteEvent({ eventId });
      toast.success("Kayıt silindi");
    } catch (error) {
      toast.error("Silme başarısız: " + (error as Error).message);
    }
  };

  const openEditDialog = () => {
    if (militaryService) {
      setStartDate(militaryService.startDate);
      setDurationDays(militaryService.durationDays.toString());
      setUnit(militaryService.unit || "");
      setBranch(militaryService.branch || "");
      setRank(militaryService.rank || "");
      setNotes(militaryService.notes || "");
      setTotalRoadRights(militaryService.totalRoadRights.toString());
      setInitialRestDays(militaryService.usedRestDays.toString());
      setInitialDesertion(militaryService.totalDesertion.toString());
      setInitialPunishment(militaryService.totalPunishment.toString());
    }
    setSetupDialogOpen(true);
  };

  if (militaryService === undefined || events === undefined) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  // Calculate dates
  let tmiDate: Date | null = null; // T.M.İ (Terhis Mükellefiyet İkmal) - Discharge date with all adjustments
  let daysCompleted = 0;
  let daysRemaining = 0;
  let progressPercent = 0;

  if (militaryService) {
    const start = parseISO(militaryService.startDate);
    const today = new Date();
    
    // Calculate adjustments - SADECE DÜŞEN GÜNLER
    // İzin/yol tecavüzleri (hakkı aşan günler)
    const leaveExcess = Math.max(0, militaryService.usedLeaveDays - militaryService.totalLeaveRights);
    const roadExcess = Math.max(0, militaryService.usedRoadDays - militaryService.totalRoadRights);
    
    // İstirahat: ilk 6 gün bedava, fazlası terhise eklenir
    const extraRestDays = Math.max(0, militaryService.usedRestDays - militaryService.totalRestRights);
    
    // Toplam düşen günler = tecavüzler + fazla istirahat + firar + ceza
    const adjustmentDays = leaveExcess + roadExcess + extraRestDays + militaryService.totalDesertion + militaryService.totalPunishment;
    
    // T.M.İ = Kullanıcının girdiği süre + düşen günler
    tmiDate = addDays(start, militaryService.durationDays + adjustmentDays);
    
    // Calculate completed and remaining days
    if (today >= tmiDate) {
      // Terhis olmuş - toplam askerlik süresini göster
      daysCompleted = differenceInDays(tmiDate, start);
      daysRemaining = 0;
    } else {
      // Hala askerlik yapıyor
      daysCompleted = Math.max(0, differenceInDays(today, start));
      daysRemaining = Math.max(0, differenceInDays(tmiDate, today));
    }
    
    // Progress calculation
    const totalServiceDays = militaryService.durationDays + adjustmentDays;
    progressPercent = Math.min(100, (daysCompleted / totalServiceDays) * 100);
  }

  const eventTypeLabels = {
    leave: "İzin",
    road: "Yol",
    rest: "İstirahat",
    desertion: "Firar",
    punishment: "Ceza",
    rollcall: "Yoklama",
  };

  const eventTypeIcons = {
    leave: <Plane className="h-4 w-4 text-blue-500" />,
    road: <Plane className="h-4 w-4 text-cyan-500" />,
    rest: <Bed className="h-4 w-4 text-purple-500" />,
    desertion: <AlertTriangle className="h-4 w-4 text-red-500" />,
    punishment: <Gavel className="h-4 w-4 text-orange-500" />,
    rollcall: <Clock className="h-4 w-4 text-gray-500" />,
  };

  const rollcallTypeLabels = {
    morning: "Sabah",
    evening: "Akşam",
    special: "Özel",
  };

  const rollcallStatusLabels = {
    present: "Mevcut",
    absent: "Yok",
    late: "Geç",
    excused: "Mazeret",
  };

  const rollcallStatusIcons = {
    present: <CheckCircle className="h-4 w-4 text-green-500" />,
    absent: <XCircle className="h-4 w-4 text-red-500" />,
    late: <AlertCircle className="h-4 w-4 text-orange-500" />,
    excused: <Clock className="h-4 w-4 text-blue-500" />,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-2 pb-4">
        <h1 className="text-3xl font-bold">🪖 T.M.İ / Terhis Hesaplayıcı</h1>
        <p className="text-base text-muted-foreground">Askerlik süreni net olarak hesapla</p>
        <div className="h-px bg-border mx-auto max-w-md" />
      </div>

      {/* Şafak Sayar - Only show if military service exists and not discharged */}
      {militaryService && daysRemaining > 0 && (
        <Card className="border-orange-200 dark:border-orange-800 bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-950/20 dark:to-amber-950/20">
          <CardContent className="pt-6">
            <div className="text-center space-y-3">
              <div className="text-6xl">🌅</div>
              <h2 className="text-2xl font-bold">Şafak Sayar</h2>
              <div className="space-y-1">
                <p className="text-5xl font-bold text-orange-600 dark:text-orange-400">
                  {daysRemaining}
                </p>
                <p className="text-lg text-muted-foreground">
                  şafak daha göreceksin
                </p>
              </div>
              <p className="text-sm text-muted-foreground italic">
                Her şafak terhise bir adım daha yaklaştırıyor!
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Moral Kartı - Askerlik Devam Ediyorsa */}
      {militaryService && daysRemaining > 0 && (
        <Card className="border-green-200 dark:border-green-800 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20">
          <CardContent className="pt-6">
            <div className="text-center space-y-3">
              <h3 className="text-lg font-bold">💚 Günün Moral Mesajı</h3>
              <p className="text-xl font-semibold text-green-700 dark:text-green-400">
                {currentMoralCard}
              </p>
              <Button
                size="sm"
                variant="ghost"
                onClick={() =>
                  setCurrentMoralCard(
                    moralCards[Math.floor(Math.random() * moralCards.length)]
                  )
                }
                className="text-xs"
              >
                🔄 Yeni Mesaj Al
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Terhis Kutlama Kartı - Terhis Olmuşsa */}
      {militaryService && daysRemaining === 0 && (
        <Card className="border-yellow-200 dark:border-yellow-800 bg-gradient-to-br from-yellow-50 to-amber-50 dark:from-yellow-950/20 dark:to-amber-950/20">
          <CardContent className="pt-6">
            <div className="text-center space-y-3">
              <div className="text-6xl">🎉</div>
              <h2 className="text-3xl font-bold text-yellow-700 dark:text-yellow-400">
                Tebrikler!
              </h2>
              <p className="text-xl font-semibold">
                Askerlik görevini başarıyla tamamladın!
              </p>
              <p className="text-lg text-muted-foreground">
                Vatan borcu ödendi, hayırlı siviller! 🎖️
              </p>
              <p className="text-sm italic text-muted-foreground mt-4">
                Bu gurur verici günleri asla unutma!
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Setup Card */}
      {!militaryService ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-xl font-bold">📋 Bilgilerini Gir</CardTitle>
            <p className="text-sm text-muted-foreground">Aşağıdaki alanları eksiksiz doldur:</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button onClick={() => setSetupDialogOpen(true)} className="w-full">
              <Plus className="h-4 w-4 mr-2" />
              Askerlik Bilgilerini Ekle
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Progress Card */}
          <Card className="border-primary/20 shadow-md">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl font-bold">📅 Terhis Sonuçların</CardTitle>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={openEditDialog}>
                    Düzenle
                  </Button>
                  <Button size="sm" variant="destructive" onClick={handleDelete}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Basic Info */}
              <div className="space-y-3 p-4 bg-muted/50 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="font-semibold">Katılış Tarihin:</span>
                  <span className="text-base">{format(parseISO(militaryService.startDate), "d MMMM yyyy", { locale: tr })}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-semibold">Askerlik Süresi:</span>
                  <span className="text-base">{militaryService.durationDays} gün</span>
                </div>
              </div>

              <div className="h-px bg-border" />

              {/* Düşen Günler */}
              {(() => {
                const leaveExcess = Math.max(0, militaryService.usedLeaveDays - militaryService.totalLeaveRights);
                const roadExcess = Math.max(0, militaryService.usedRoadDays - militaryService.totalRoadRights);
                const extraRestDays = Math.max(0, militaryService.usedRestDays - militaryService.totalRestRights);
                const totalDeducted = leaveExcess + roadExcess + extraRestDays + militaryService.totalDesertion + militaryService.totalPunishment;
                
                if (totalDeducted > 0) {
                  return (
                    <>
                      <div className="space-y-3">
                        <h3 className="text-lg font-bold">❗ Terhise Eklenen Günler</h3>
                        <div className="p-4 bg-red-50 dark:bg-red-950/20 rounded-lg border border-red-200 dark:border-red-800">
                          <p className="font-semibold text-base mb-3">Toplam: <span className="text-red-600 dark:text-red-400">{totalDeducted} gün</span></p>
                          <ul className="space-y-2 text-sm">
                            {militaryService.totalPunishment > 0 && (
                              <li className="flex justify-between">
                                <span>• Ceza:</span>
                                <span className="font-semibold">{militaryService.totalPunishment} gün</span>
                              </li>
                            )}
                            {militaryService.totalDesertion > 0 && (
                              <li className="flex justify-between">
                                <span>• Firar:</span>
                                <span className="font-semibold">{militaryService.totalDesertion} gün</span>
                              </li>
                            )}
                            {extraRestDays > 0 && (
                              <li className="flex justify-between">
                                <span>• Fazla İstirahat (6 günü geçen):</span>
                                <span className="font-semibold">{extraRestDays} gün</span>
                              </li>
                            )}
                            {leaveExcess > 0 && (
                              <li className="flex justify-between">
                                <span>• İzin Tecavüz:</span>
                                <span className="font-semibold">{leaveExcess} gün</span>
                              </li>
                            )}
                            {roadExcess > 0 && (
                              <li className="flex justify-between">
                                <span>• Yol Tecavüz:</span>
                                <span className="font-semibold">{roadExcess} gün</span>
                              </li>
                            )}
                          </ul>
                        </div>
                      </div>
                      <div className="h-px bg-border" />
                    </>
                  );
                }
                return null;
              })()}

              {/* Net Hizmet Günü */}
              <div className="space-y-2 p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <h3 className="text-lg font-bold">🎯 Net Hizmet Günün</h3>
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {militaryService.durationDays} gün
                </p>
              </div>

              {/* Terhis / T.M.İ Tarihi */}
              <div className="space-y-2 p-4 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-800">
                <h3 className="text-lg font-bold">🎖 Terhis / T.M.İ Tarihin</h3>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {tmiDate && format(tmiDate, "d MMMM yyyy", { locale: tr })}
                </p>
              </div>

              {/* Kalan Gün */}
              <div className="space-y-2 p-4 bg-orange-50 dark:bg-orange-950/20 rounded-lg border border-orange-200 dark:border-orange-800">
                <h3 className="text-lg font-bold">⏳ Kalan Gün</h3>
                <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                  {daysRemaining} gün
                </p>
                {daysRemaining > 0 && (
                  <div className="mt-3">
                    <div className="h-3 bg-secondary rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-orange-500 to-green-500 transition-all duration-500"
                        style={{ width: `${progressPercent}%` }}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground mt-1 text-center">
                      %{progressPercent.toFixed(1)} tamamlandı
                    </p>
                  </div>
                )}
              </div>

              <div className="h-px bg-border" />

              {/* Rights Overview - Compact */}
              <div className="space-y-2">
                <h3 className="text-base font-semibold">📊 Hak Kullanımı</h3>
                <div className="grid grid-cols-3 gap-2 text-sm">
                  <div className="p-2 bg-muted rounded text-center">
                    <p className="text-xs text-muted-foreground">İzin</p>
                    <p className="font-semibold">{militaryService.usedLeaveDays}/{militaryService.totalLeaveRights}</p>
                  </div>
                  <div className="p-2 bg-muted rounded text-center">
                    <p className="text-xs text-muted-foreground">Yol</p>
                    <p className="font-semibold">{militaryService.usedRoadDays}/{militaryService.totalRoadRights}</p>
                  </div>
                  <div className="p-2 bg-muted rounded text-center">
                    <p className="text-xs text-muted-foreground">İstirahat</p>
                    <p className="font-semibold">{militaryService.usedRestDays} gün</p>
                  </div>
                </div>
              </div>

              {/* Unit Details */}
              {(militaryService.branch || militaryService.rank) && (
                <div className="space-y-2 p-4 bg-secondary rounded-lg">
                  {militaryService.branch && (
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">Kuvvet:</span>
                      <span className="text-sm font-medium">{militaryService.branch}</span>
                    </div>
                  )}
                  {militaryService.rank && (
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">Rütbe:</span>
                      <span className="text-sm font-medium">{militaryService.rank}</span>
                    </div>
                  )}
                </div>
              )}

              {militaryService.notes && (
                <div className="space-y-2">
                  <Label className="text-sm text-muted-foreground">Notlar</Label>
                  <p className="text-sm p-3 bg-secondary rounded-lg">{militaryService.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Events Card */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-lg font-bold">
                  <Clock className="h-5 w-5" />
                  📝 Kayıtlar
                </CardTitle>
                <Button size="sm" onClick={() => setEventDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Yeni Kayıt
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {events && events.length > 0 ? (
                <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
                  {events.map((event) => (
                    <div
                      key={event._id}
                      className="flex items-center justify-between p-4 bg-secondary rounded-lg"
                    >
                      <div className="flex items-center gap-3 flex-1">
                        {event.type === "rollcall" && event.rollcallStatus
                          ? rollcallStatusIcons[event.rollcallStatus]
                          : eventTypeIcons[event.type]}
                        <div className="flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-medium">
                              {format(parseISO(event.date), "d MMM yyyy", { locale: tr })}
                            </span>
                            <Badge variant="outline" className="text-xs">
                              {eventTypeLabels[event.type]}
                            </Badge>
                            {event.type === "rollcall" && event.rollcallType && (
                              <Badge variant="secondary" className="text-xs">
                                {rollcallTypeLabels[event.rollcallType]}
                              </Badge>
                            )}
                            {event.days && event.days > 0 && (
                              <Badge variant="secondary" className="text-xs">
                                {event.days} gün
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-2 mt-1 flex-wrap">
                            {event.type === "rollcall" && event.rollcallStatus && (
                              <span className="text-sm text-muted-foreground">
                                {rollcallStatusLabels[event.rollcallStatus]}
                              </span>
                            )}
                            {event.notes && (
                              <span className="text-xs text-muted-foreground">
                                {event.type === "rollcall" && event.rollcallStatus ? "•" : ""} {event.notes}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDeleteEvent(event._id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-8">
                  Henüz kayıt yok. İlk kaydınızı ekleyin.
                </p>
              )}
            </CardContent>
          </Card>
        </>
      )}

      {/* Footer */}
      <div className="text-center py-4">
        <p className="text-xs text-muted-foreground">
          Bu hesaplayıcı resmî değildir. Bilgilendirme amaçlıdır.
        </p>
      </div>

      {/* Setup/Edit Dialog */}
      <Dialog open={setupDialogOpen} onOpenChange={setSetupDialogOpen}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">
              {militaryService ? "✏️ Bilgilerini Düzenle" : "📋 Bilgilerini Gir"}
            </DialogTitle>
            <DialogDescription>
              Aşağıdaki alanları eksiksiz doldur:
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="startDate" className="font-bold text-base">Katılış Tarihi *</Label>
              <Input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="durationDays" className="font-bold text-base">Askerlik Süresi (Gün) *</Label>
              <Input
                id="durationDays"
                type="number"
                value={durationDays}
                onChange={(e) => setDurationDays(e.target.value)}
                placeholder="180"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="branch" className="font-bold text-base">Kuvvet</Label>
              <Input
                id="branch"
                value={branch}
                onChange={(e) => setBranch(e.target.value)}
                placeholder="Örn: Kara Kuvvetleri, Deniz Kuvvetleri, Hava Kuvvetleri"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="rank" className="font-bold text-base">Rütbe</Label>
              <Input
                id="rank"
                value={rank}
                onChange={(e) => setRank(e.target.value)}
                placeholder="Örn: Er"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="totalRoadRights" className="font-bold text-base">Yol Hakkı (Gün) *</Label>
              <Input
                id="totalRoadRights"
                type="number"
                value={totalRoadRights}
                onChange={(e) => setTotalRoadRights(e.target.value)}
                placeholder="Duruma göre 1 veya 2"
              />
              <p className="text-xs text-muted-foreground">
                Duruma göre 1 veya 2 gün olabilir
              </p>
            </div>

            <div className="space-y-3 p-4 bg-muted rounded-lg">
              <Label className="font-bold text-base">Başlangıçtaki Kayıtlar (Opsiyonel)</Label>
              <p className="text-xs text-muted-foreground mb-3">
                Eğer askerliğe başlamadan önce zaten var olan kayıtlarınız varsa girin
              </p>
              
              <div className="space-y-2">
                <Label htmlFor="initialRestDays" className="font-semibold">İstirahat (Gün)</Label>
                <Input
                  id="initialRestDays"
                  type="number"
                  value={initialRestDays}
                  onChange={(e) => setInitialRestDays(e.target.value)}
                  placeholder="0"
                  min="0"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="initialDesertion" className="font-semibold">Firar (Gün)</Label>
                <Input
                  id="initialDesertion"
                  type="number"
                  value={initialDesertion}
                  onChange={(e) => setInitialDesertion(e.target.value)}
                  placeholder="0"
                  min="0"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="initialPunishment" className="font-semibold">Ceza (Gün)</Label>
                <Input
                  id="initialPunishment"
                  type="number"
                  value={initialPunishment}
                  onChange={(e) => setInitialPunishment(e.target.value)}
                  placeholder="0"
                  min="0"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes" className="font-bold text-base">Notlar</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Eklemek istediğiniz notlar"
                rows={3}
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={handleSave} disabled={isSubmitting} className="flex-1">
                {isSubmitting ? "Kaydediliyor..." : "Kaydet"}
              </Button>
              <Button
                variant="outline"
                onClick={() => setSetupDialogOpen(false)}
                disabled={isSubmitting}
              >
                İptal
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Event Dialog */}
      <Dialog open={eventDialogOpen} onOpenChange={setEventDialogOpen}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">➕ Yeni Kayıt Ekle</DialogTitle>
            <DialogDescription>İzin, yol, istirahat, firar, ceza veya yoklama kaydı ekleyin.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="eventDate" className="font-bold text-base">Tarih *</Label>
              <Input
                id="eventDate"
                type="date"
                value={eventDate}
                onChange={(e) => setEventDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="eventType" className="font-bold text-base">Kayıt Tipi *</Label>
              <Select value={eventType} onValueChange={(value: typeof eventType) => setEventType(value)}>
                <SelectTrigger id="eventType">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="rollcall">Yoklama</SelectItem>
                  <SelectItem value="leave">İzin (duruma göre 1-2 gün)</SelectItem>
                  <SelectItem value="road">Yol (duruma göre 1-2 gün)</SelectItem>
                  <SelectItem value="rest">İstirahat (6 günü geçerse terhise eklenir)</SelectItem>
                  <SelectItem value="desertion">Firar (terhise eklenir)</SelectItem>
                  <SelectItem value="punishment">Ceza (terhise eklenir)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {eventType !== "rollcall" && (
              <div className="space-y-2">
                <Label htmlFor="eventDays" className="font-bold text-base">Gün Sayısı *</Label>
                <Input
                  id="eventDays"
                  type="number"
                  value={eventDays}
                  onChange={(e) => setEventDays(e.target.value)}
                  placeholder="1"
                  min="1"
                />
              </div>
            )}

            {eventType === "rollcall" && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="rollcallType" className="font-bold text-base">Yoklama Tipi *</Label>
                  <Select value={rollcallType} onValueChange={(value: typeof rollcallType) => setRollcallType(value)}>
                    <SelectTrigger id="rollcallType">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="morning">Sabah</SelectItem>
                      <SelectItem value="evening">Akşam</SelectItem>
                      <SelectItem value="special">Özel</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="rollcallStatus" className="font-bold text-base">Durum *</Label>
                  <Select
                    value={rollcallStatus}
                    onValueChange={(value: typeof rollcallStatus) => setRollcallStatus(value)}
                  >
                    <SelectTrigger id="rollcallStatus">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="present">Mevcut</SelectItem>
                      <SelectItem value="absent">Yok</SelectItem>
                      <SelectItem value="late">Geç Geldi</SelectItem>
                      <SelectItem value="excused">Mazeret</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}

            <div className="space-y-2">
              <Label htmlFor="eventNotes" className="font-bold text-base">Notlar</Label>
              <Textarea
                id="eventNotes"
                value={eventNotes}
                onChange={(e) => setEventNotes(e.target.value)}
                placeholder="Varsa açıklama ekleyin"
                rows={2}
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={handleAddEvent} disabled={isSubmitting} className="flex-1">
                {isSubmitting ? "Ekleniyor..." : "Ekle"}
              </Button>
              <Button
                variant="outline"
                onClick={() => setEventDialogOpen(false)}
                disabled={isSubmitting}
              >
                İptal
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
