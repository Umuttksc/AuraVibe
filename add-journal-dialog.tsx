import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Input } from "@/components/ui/input.tsx";
import { Label } from "@/components/ui/label.tsx";
import { Textarea } from "@/components/ui/textarea.tsx";
import { Checkbox } from "@/components/ui/checkbox.tsx";
import { toast } from "sonner";

interface AddJournalDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const MOODS = [
  { value: "happy", label: "Mutlu", emoji: "😊" },
  { value: "sad", label: "Üzgün", emoji: "😢" },
  { value: "anxious", label: "Endişeli", emoji: "😰" },
  { value: "calm", label: "Sakin", emoji: "😌" },
  { value: "energetic", label: "Enerjik", emoji: "⚡" },
  { value: "tired", label: "Yorgun", emoji: "😴" },
];

const COMMON_ACTIVITIES = [
  "Egzersiz",
  "Yoga",
  "Meditasyon",
  "Okuma",
  "Müzik dinleme",
  "Arkadaşlarla zaman geçirme",
  "İş",
  "Hobiler",
];

export default function AddJournalDialog({ open, onOpenChange }: AddJournalDialogProps) {
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [content, setContent] = useState("");
  const [mood, setMood] = useState<string | undefined>();
  const [selectedActivities, setSelectedActivities] = useState<string[]>([]);
  const [isPrivate, setIsPrivate] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const createEntry = useMutation(api.journal.createEntry);

  const toggleActivity = (activity: string) => {
    setSelectedActivities((prev) =>
      prev.includes(activity)
        ? prev.filter((a) => a !== activity)
        : [...prev, activity]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!content.trim()) {
      toast.error("Lütfen günlük içeriği girin");
      return;
    }

    setIsSubmitting(true);
    try {
      await createEntry({
        date,
        content: content.trim(),
        mood: mood as "happy" | "sad" | "anxious" | "calm" | "energetic" | "tired" | undefined,
        activities: selectedActivities.length > 0 ? selectedActivities : undefined,
        isPrivate,
      });

      toast.success("Günlük kaydedildi");
      setDate(new Date().toISOString().split("T")[0]);
      setContent("");
      setMood(undefined);
      setSelectedActivities([]);
      setIsPrivate(true);
      onOpenChange(false);
    } catch (error) {
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error("Günlük kaydedilemedi");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Yeni Günlük Kaydı</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="date">Tarih *</Label>
            <Input
              id="date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              max={new Date().toISOString().split("T")[0]}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="content">Günlük *</Label>
            <Textarea
              id="content"
              placeholder="Bugün neler oldu? Nasıl hissediyorsun?"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={6}
              required
            />
          </div>

          <div className="space-y-2">
            <Label>Ruh Halim</Label>
            <div className="grid grid-cols-3 gap-2">
              {MOODS.map((m) => (
                <Button
                  key={m.value}
                  type="button"
                  variant={mood === m.value ? "default" : "outline"}
                  size="sm"
                  onClick={() => setMood(m.value)}
                  className="flex items-center gap-2"
                >
                  <span>{m.emoji}</span>
                  <span>{m.label}</span>
                </Button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Aktiviteler</Label>
            <div className="flex flex-wrap gap-2">
              {COMMON_ACTIVITIES.map((activity) => (
                <Button
                  key={activity}
                  type="button"
                  variant={selectedActivities.includes(activity) ? "default" : "outline"}
                  size="sm"
                  onClick={() => toggleActivity(activity)}
                >
                  {activity}
                </Button>
              ))}
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="private"
              checked={isPrivate}
              onCheckedChange={(checked) => setIsPrivate(checked as boolean)}
            />
            <Label htmlFor="private" className="cursor-pointer">
              🔒 Gizli tut (sadece ben görebilirim)
            </Label>
          </div>

          <div className="flex gap-2 justify-end">
            <Button
              type="button"
              variant="secondary"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              İptal
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Kaydediliyor..." : "Kaydet"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
