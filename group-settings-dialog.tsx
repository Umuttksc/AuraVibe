import { useState, useRef } from "react";
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
import { Switch } from "@/components/ui/switch.tsx";
import { Upload, X } from "lucide-react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import { toast } from "sonner";
import type { Id } from "@/convex/_generated/dataModel.d.ts";

interface GroupSettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  community: {
    _id: Id<"communities">;
    name: string;
    description: string;
    imageId?: Id<"_storage">;
    isPrivate: boolean;
  };
}

function UploadIcon({ className }: { className?: string }) {
  return <Upload className={className} />;
}

function XIcon({ className }: { className?: string }) {
  return <X className={className} />;
}

export default function GroupSettingsDialog({
  open,
  onOpenChange,
  community,
}: GroupSettingsDialogProps) {
  const [name, setName] = useState(community.name);
  const [description, setDescription] = useState(community.description);
  const [isPrivate, setIsPrivate] = useState(community.isPrivate);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const updateSettings = useMutation(api.communities.updateCommunitySettings);
  const generateUploadUrl = useMutation(api.communities.generateUploadUrl);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Dosya boyutu 5MB'dan küçük olmalıdır");
        return;
      }
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error("Grup adı gerekli");
      return;
    }

    setIsSaving(true);
    try {
      let imageId = community.imageId;

      // Upload new image if selected
      if (selectedImage) {
        const uploadUrl = await generateUploadUrl();
        const uploadResult = await fetch(uploadUrl, {
          method: "POST",
          headers: { "Content-Type": selectedImage.type },
          body: selectedImage,
        });
        const { storageId } = await uploadResult.json();
        imageId = storageId;
      }

      await updateSettings({
        communityId: community._id,
        name: name.trim(),
        description: description.trim(),
        imageId,
        isPrivate,
      });

      toast.success("Ayarlar kaydedildi");
      onOpenChange(false);
    } catch (error) {
      if (error instanceof Error) {
        toast.error(error.message);
      }
    } finally {
      setIsSaving(false);
    }
  };

  const currentImageUrl = imagePreview ||
    (community.imageId
      ? `${import.meta.env.VITE_CONVEX_URL}/api/storage/${community.imageId}`
      : null);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Grup Ayarları</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Group Image */}
          <div className="space-y-2">
            <Label>Grup Resmi</Label>
            <div className="flex items-center gap-4">
              {currentImageUrl && (
                <div className="relative">
                  <img
                    src={currentImageUrl}
                    alt="Group"
                    className="h-20 w-20 rounded-lg object-cover"
                  />
                  {imagePreview && (
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="absolute -top-2 -right-2 h-6 w-6"
                      onClick={() => {
                        setSelectedImage(null);
                        setImagePreview(null);
                        if (fileInputRef.current) {
                          fileInputRef.current.value = "";
                        }
                      }}
                    >
                      <XIcon className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageSelect}
                className="hidden"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={isSaving}
              >
                <UploadIcon className="h-4 w-4 mr-2" />
                {currentImageUrl ? "Değiştir" : "Yükle"}
              </Button>
            </div>
          </div>

          {/* Group Name */}
          <div className="space-y-2">
            <Label htmlFor="name">Grup Adı</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Grup adı..."
              maxLength={100}
              disabled={isSaving}
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Açıklama</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Grup açıklaması..."
              rows={3}
              maxLength={500}
              disabled={isSaving}
            />
          </div>

          {/* Privacy */}
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="privacy">Özel Grup</Label>
              <p className="text-sm text-muted-foreground">
                Sadece üyeler mesajları görüntüleyebilir
              </p>
            </div>
            <Switch
              id="privacy"
              checked={isPrivate}
              onCheckedChange={setIsPrivate}
              disabled={isSaving}
            />
          </div>

          {/* Actions */}
          <div className="flex gap-2 justify-end pt-4">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSaving}
            >
              İptal
            </Button>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? "Kaydediliyor..." : "Kaydet"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
