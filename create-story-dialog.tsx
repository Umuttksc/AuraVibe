import { useState, useRef } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog.tsx";
import { Button } from "@/components/ui/button.tsx";
import { ImageIcon, X, Wand2, ImageIcon as Gallery } from "lucide-react";
import { toast } from "sonner";
import { Spinner } from "@/components/ui/spinner.tsx";
import AdvancedPhotoEditor from "./advanced-photo-editor.tsx";
import VideoTrimmer from "./video-trimmer.tsx";
import type { Id } from "@/convex/_generated/dataModel.d.ts";

// Icon wrapper components to prevent DataCloneError
function ImageIconWrapper({ className }: { className?: string }) {
  return <ImageIcon className={className} />;
}

function XIcon({ className }: { className?: string }) {
  return <X className={className} />;
}

function Wand2Icon({ className }: { className?: string }) {
  return <Wand2 className={className} />;
}

function GalleryIcon({ className }: { className?: string }) {
  return <Gallery className={className} />;
}

interface CreateStoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function CreateStoryDialog({
  open,
  onOpenChange,
}: CreateStoryDialogProps) {
  const [selectedMedia, setSelectedMedia] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<"image" | "video" | null>(null);
  const [videoDuration, setVideoDuration] = useState<number | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isTrimming, setIsTrimming] = useState(false);
  const [videoToTrim, setVideoToTrim] = useState<string | null>(null);
  const [selectedMusicId, setSelectedMusicId] = useState<Id<"music"> | undefined>(undefined);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const generateUploadUrl = useMutation(api.stories.generateUploadUrl);
  const createStory = useMutation(api.stories.createStory);

  const handleMediaSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const maxSize = file.type.startsWith("video/") ? 50 * 1024 * 1024 : 10 * 1024 * 1024;
      if (file.size > maxSize) {
        toast.error(`Dosya boyutu ${file.type.startsWith("video/") ? "50MB" : "10MB"}'dan küçük olmalıdır`);
        return;
      }
      
      const type = file.type.startsWith("video/") ? "video" : "image";
      setMediaType(type);
      
      if (type === "video") {
        // Video için trim ekranına yönlendir
        const url = URL.createObjectURL(file);
        setVideoToTrim(url);
        setIsTrimming(true);
      } else {
        // Image için normal flow
        setSelectedMedia(file);
        const url = URL.createObjectURL(file);
        setPreviewUrl(url);
        setIsEditing(true);
      }
    }
  };

  const handleRemoveMedia = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setSelectedMedia(null);
    setPreviewUrl(null);
    setMediaType(null);
    setVideoDuration(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleEditPhoto = () => {
    if (mediaType === "image" && previewUrl) {
      setIsEditing(true);
    }
  };

  const handleSaveEditedPhoto = (editedBlob: Blob) => {
    // Convert blob to file
    const file = new File([editedBlob], "edited-story.jpg", { type: "image/jpeg" });
    setSelectedMedia(file);

    // Update preview
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    const url = URL.createObjectURL(editedBlob);
    setPreviewUrl(url);

    setIsEditing(false);
    toast.success("Fotoğraf düzenlendi");
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
  };

  const handleSaveTrimmedVideo = (trimmedBlob: Blob, duration: number) => {
    // Convert blob to file
    const file = new File([trimmedBlob], "trimmed-story.mp4", { type: "video/mp4" });
    setSelectedMedia(file);
    
    // Create preview
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    
    // Store video duration
    setVideoDuration(duration);
    
    // Clean up
    if (videoToTrim) {
      URL.revokeObjectURL(videoToTrim);
    }
    
    setIsTrimming(false);
    setVideoToTrim(null);
    
    toast.success(`Video kırpıldı (${duration.toFixed(1)}s)`);
  };

  const handleCancelTrim = () => {
    // Clean up
    if (videoToTrim) {
      URL.revokeObjectURL(videoToTrim);
    }
    
    setIsTrimming(false);
    setVideoToTrim(null);
    setMediaType(null);
  };

  const handleSubmit = async () => {
    if (!selectedMedia || !mediaType) {
      toast.error("Lütfen bir medya seçin");
      return;
    }

    try {
      setIsUploading(true);

      // Step 1: Get upload URL
      const uploadUrl = await generateUploadUrl();

      // Step 2: Upload media
      const result = await fetch(uploadUrl, {
        method: "POST",
        headers: { "Content-Type": selectedMedia.type },
        body: selectedMedia,
      });

      if (!result.ok) {
        throw new Error("Medya yüklenemedi");
      }

      const { storageId } = await result.json();

      // Step 3: Create story
      await createStory({ 
        imageId: storageId,
        mediaType: mediaType || "image",
        videoDuration: videoDuration || undefined,
        musicId: selectedMusicId,
      });

      toast.success("Hikaye paylaşıldı!");
      handleRemoveMedia();
      setSelectedMusicId(undefined);
      onOpenChange(false);
    } catch (error) {
      console.error("Story creation error:", error);
      toast.error("Hikaye paylaşılırken bir hata oluştu");
    } finally {
      setIsUploading(false);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    // Eğer editing veya trimming mode'da isek dialog'u kapatmaya izin verme
    if (!newOpen && (isEditing || isTrimming)) {
      return;
    }
    onOpenChange(newOpen);
  };

  return (
    <>
      {isEditing && previewUrl && (
        <AdvancedPhotoEditor
          imageUrl={previewUrl}
          onSave={handleSaveEditedPhoto}
          onCancel={handleCancelEdit}
          selectedMusicId={selectedMusicId}
          onMusicSelect={setSelectedMusicId}
        />
      )}
      {isTrimming && videoToTrim && (
        <VideoTrimmer
          videoUrl={videoToTrim}
          onSave={handleSaveTrimmedVideo}
          onCancel={handleCancelTrim}
        />
      )}
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className={`sm:max-w-md ${isEditing || isTrimming ? 'hidden' : ''}`}>
          <DialogHeader>
            <DialogTitle>Hikaye Oluştur</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {!previewUrl ? (
              <div className="space-y-3">
                <label className="flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-lg cursor-pointer bg-muted/50 hover:bg-muted transition-colors">
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <ImageIconWrapper className="h-12 w-12 text-muted-foreground mb-3" />
                    <p className="text-sm text-muted-foreground text-center px-4">
                      Fotoğraf veya video seçin
                    </p>
                    <p className="text-xs text-muted-foreground mt-2">
                      Fotoğraf: 10MB, Video: 50MB
                    </p>
                  </div>
                  {/* Galeri input */}
                  <input
                    ref={fileInputRef}
                    type="file"
                    className="hidden"
                    accept="image/*,video/*"
                    onChange={handleMediaSelect}
                    disabled={isUploading}
                  />
                </label>
                
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                >
                  <GalleryIcon className="h-4 w-4 mr-2" />
                  Fotoğraf veya Video Seç
                </Button>
              </div>
            ) : (
              <>
                <div className="relative w-full h-64 rounded-lg overflow-hidden">
                  {mediaType === "video" ? (
                    <video
                      src={previewUrl}
                      controls
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <img
                      src={previewUrl}
                      alt="Story preview"
                      className="w-full h-full object-cover"
                    />
                  )}
                  <div className="absolute top-2 right-2 flex gap-2">
                    {mediaType === "image" && (
                      <button
                        onClick={handleEditPhoto}
                        className="p-1 rounded-full bg-black/50 hover:bg-black/70 transition-colors"
                        disabled={isUploading}
                        title="Düzenle"
                      >
                        <Wand2Icon className="h-5 w-5 text-white" />
                      </button>
                    )}
                    <button
                      onClick={handleRemoveMedia}
                      className="p-1 rounded-full bg-black/50 hover:bg-black/70 transition-colors"
                      disabled={isUploading}
                    >
                      <XIcon className="h-5 w-5 text-white" />
                    </button>
                  </div>
                </div>
              </>
            )}

            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isUploading}
              >
                İptal
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={!selectedMedia || isUploading}
              >
                {isUploading ? (
                  <>
                    <Spinner className="h-4 w-4 mr-2" />
                    Paylaşılıyor...
                  </>
                ) : (
                  "Paylaş"
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
