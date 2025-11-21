import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import type { Id } from "@/convex/_generated/dataModel.d.ts";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Textarea } from "@/components/ui/textarea.tsx";
import { Label } from "@/components/ui/label.tsx";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select.tsx";

interface ReportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  reportedUserId?: Id<"users">;
  postId?: Id<"posts">;
  commentId?: Id<"comments">;
  type: "user" | "post" | "comment";
}

const reasons = [
  { value: "spam", label: "Spam" },
  { value: "harassment", label: "Taciz" },
  { value: "hate_speech", label: "Nefret Söylemi" },
  { value: "violence", label: "Şiddet" },
  { value: "inappropriate", label: "Uygunsuz İçerik" },
  { value: "other", label: "Diğer" },
];

export default function ReportDialog({
  open,
  onOpenChange,
  reportedUserId,
  postId,
  commentId,
  type,
}: ReportDialogProps) {
  const [reason, setReason] = useState<string>("");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const createReport = useMutation(api.reports.createReport);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!reason) {
      toast.error("Lütfen bir sebep seçin");
      return;
    }

    setIsSubmitting(true);

    try {
      await createReport({
        reportedUserId,
        postId,
        commentId,
        reason: reason as "spam" | "harassment" | "hate_speech" | "violence" | "inappropriate" | "other",
        description: description.trim() || undefined,
      });

      toast.success("Rapor gönderildi. İncelenecektir.");
      setReason("");
      setDescription("");
      onOpenChange(false);
    } catch (error) {
      if (error instanceof Error) {
        toast.error(error.message);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const getTitle = () => {
    switch (type) {
      case "user":
        return "Kullanıcıyı Bildir";
      case "post":
        return "Gönderiyi Bildir";
      case "comment":
        return "Yorumu Bildir";
      default:
        return "Bildir";
    }
  };

  const getDescription = () => {
    switch (type) {
      case "user":
        return "Bu kullanıcının davranışını bildirin";
      case "post":
        return "Bu gönderi topluluk kurallarını ihlal ediyor mu?";
      case "comment":
        return "Bu yorum topluluk kurallarını ihlal ediyor mu?";
      default:
        return "İçeriği bildirin";
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{getTitle()}</DialogTitle>
          <DialogDescription>{getDescription()}</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="reason">Sebep</Label>
            <Select value={reason} onValueChange={setReason}>
              <SelectTrigger id="reason">
                <SelectValue placeholder="Bir sebep seçin" />
              </SelectTrigger>
              <SelectContent>
                {reasons.map((r) => (
                  <SelectItem key={r.value} value={r.value}>
                    {r.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Açıklama (İsteğe bağlı)</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ek detaylar ekleyin..."
              rows={4}
              maxLength={500}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              İptal
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Gönderiliyor..." : "Gönder"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
