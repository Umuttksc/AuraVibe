import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api.js";
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
import { Input } from "@/components/ui/input.tsx";
import { Label } from "@/components/ui/label.tsx";
import { X, Plus } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select.tsx";

function XIcon({ className }: { className?: string }) {
  return <X className={className} />;
}

function PlusIcon({ className }: { className?: string }) {
  return <Plus className={className} />;
}

interface CreatePollDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPollCreated?: (pollId: string) => void;
}

export default function CreatePollDialog({
  open,
  onOpenChange,
  onPollCreated,
}: CreatePollDialogProps) {
  const [question, setQuestion] = useState("");
  const [options, setOptions] = useState(["", ""]);
  const [expiresInHours, setExpiresInHours] = useState<string>("24");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const createPoll = useMutation(api.polls.createPoll);

  const handleAddOption = () => {
    if (options.length < 10) {
      setOptions([...options, ""]);
    }
  };

  const handleRemoveOption = (index: number) => {
    if (options.length > 2) {
      setOptions(options.filter((_, i) => i !== index));
    }
  };

  const handleOptionChange = (index: number, value: string) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!question.trim()) {
      toast.error("Lütfen bir soru girin");
      return;
    }

    const validOptions = options.filter((opt) => opt.trim());
    if (validOptions.length < 2) {
      toast.error("En az 2 seçenek girmelisiniz");
      return;
    }

    setIsSubmitting(true);

    try {
      const pollId = await createPoll({
        question: question.trim(),
        options: validOptions.map((opt) => opt.trim()),
        expiresInHours: expiresInHours === "never" ? undefined : parseInt(expiresInHours),
      });

      toast.success("Anket oluşturuldu!");
      onOpenChange(false);

      // Reset form
      setQuestion("");
      setOptions(["", ""]);
      setExpiresInHours("24");

      if (onPollCreated) {
        onPollCreated(pollId);
      }
    } catch (error) {
      if (error instanceof Error) {
        toast.error(error.message);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Anket Oluştur</DialogTitle>
          <DialogDescription>
            Bir soru sorun ve seçenekler ekleyin
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Question */}
          <div className="space-y-2">
            <Label htmlFor="question">Soru</Label>
            <Input
              id="question"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Sorunuzu yazın..."
              maxLength={200}
              required
            />
          </div>

          {/* Options */}
          <div className="space-y-2">
            <Label>Seçenekler</Label>
            <div className="space-y-2">
              {options.map((option, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    value={option}
                    onChange={(e) => handleOptionChange(index, e.target.value)}
                    placeholder={`Seçenek ${index + 1}`}
                    maxLength={100}
                  />
                  {options.length > 2 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveOption(index)}
                    >
                      <XIcon className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
            {options.length < 10 && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddOption}
                className="w-full"
              >
                <PlusIcon className="h-4 w-4 mr-2" />
                Seçenek Ekle
              </Button>
            )}
          </div>

          {/* Duration */}
          <div className="space-y-2">
            <Label htmlFor="duration">Süre</Label>
            <Select value={expiresInHours} onValueChange={setExpiresInHours}>
              <SelectTrigger id="duration">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">1 saat</SelectItem>
                <SelectItem value="6">6 saat</SelectItem>
                <SelectItem value="12">12 saat</SelectItem>
                <SelectItem value="24">1 gün</SelectItem>
                <SelectItem value="72">3 gün</SelectItem>
                <SelectItem value="168">1 hafta</SelectItem>
                <SelectItem value="never">Süresiz</SelectItem>
              </SelectContent>
            </Select>
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
              {isSubmitting ? "Oluşturuluyor..." : "Oluştur"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
