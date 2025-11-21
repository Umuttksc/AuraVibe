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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select.tsx";
import { Switch } from "@/components/ui/switch.tsx";
import { toast } from "sonner";
import { useState } from "react";
import type { Id } from "@/convex/_generated/dataModel.d.ts";

interface CreateAdDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function CreateAdDialog({ open, onOpenChange }: CreateAdDialogProps) {
  const createAd = useMutation(api.admin.createAd);
  const generateUploadUrl = useMutation(api.admin.generateAdUploadUrl);
  
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const [placement, setPlacement] = useState<"home_feed" | "profile_top" | "explore_top" | "story">("home_feed");
  const [isActive, setIsActive] = useState(true);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim()) {
      toast.error("Başlık gerekli");
      return;
    }

    setIsSubmitting(true);
    
    try {
      let imageId: Id<"_storage"> | undefined;
      
      if (imageFile) {
        const uploadUrl = await generateUploadUrl();
        const result = await fetch(uploadUrl, {
          method: "POST",
          headers: { "Content-Type": imageFile.type },
          body: imageFile,
        });
        const { storageId } = await result.json();
        imageId = storageId;
      }

      await createAd({
        title,
        description: description || undefined,
        linkUrl: linkUrl || undefined,
        imageId,
        placement,
        isActive,
      });

      toast.success("Reklam oluşturuldu");
      onOpenChange(false);
      
      // Reset form
      setTitle("");
      setDescription("");
      setLinkUrl("");
      setPlacement("home_feed");
      setIsActive(true);
      setImageFile(null);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Reklam oluşturulurken hata oluştu";
      toast.error(errorMessage);
      console.error("Create ad error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Yeni Reklam Oluştur</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="title">Başlık *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Reklam başlığı"
            />
          </div>

          <div>
            <Label htmlFor="description">Açıklama</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Reklam açıklaması"
              rows={3}
            />
          </div>

          <div>
            <Label htmlFor="linkUrl">Link URL</Label>
            <Input
              id="linkUrl"
              type="url"
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              placeholder="https://example.com"
            />
          </div>

          <div>
            <Label htmlFor="placement">Yerleşim</Label>
            <Select value={placement} onValueChange={(value: typeof placement) => setPlacement(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="home_feed">Ana Sayfa Feed</SelectItem>
                <SelectItem value="profile_top">Profil Üstü</SelectItem>
                <SelectItem value="explore_top">Keşfet Üstü</SelectItem>
                <SelectItem value="story">Story</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="image">Görsel</Label>
            <Input
              id="image"
              type="file"
              accept="image/*"
              onChange={(e) => setImageFile(e.target.files?.[0] || null)}
            />
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="active"
              checked={isActive}
              onCheckedChange={setIsActive}
            />
            <Label htmlFor="active">Aktif</Label>
          </div>

          <div className="flex justify-end gap-2">
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
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
