import { useState, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Textarea } from "@/components/ui/textarea.tsx";
import { Image, X, BarChart3, Plus, Wand2, ImageIcon as Gallery } from "lucide-react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import { toast } from "sonner";
import type { Id } from "@/convex/_generated/dataModel.d.ts";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs.tsx";
import { Input } from "@/components/ui/input.tsx";
import { Label } from "@/components/ui/label.tsx";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select.tsx";
import AdvancedPhotoEditor from "./advanced-photo-editor.tsx";
import VideoTrimmer from "./video-trimmer.tsx";

// Icon wrapper components to prevent DataCloneError
function XIcon({ className }: { className?: string }) {
  return <X className={className} />;
}

function ImageIcon({ className }: { className?: string }) {
  return <Image className={className} />;
}

function Wand2Icon({ className }: { className?: string }) {
  return <Wand2 className={className} />;
}

function PlusIcon({ className }: { className?: string }) {
  return <Plus className={className} />;
}

function GalleryIcon({ className }: { className?: string }) {
  return <Gallery className={className} />;
}

interface CreatePostDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface MediaItem {
  file: File;
  preview: string;
  type: "image" | "video";
}

export default function CreatePostDialog({ open, onOpenChange }: CreatePostDialogProps) {
  const [content, setContent] = useState("");
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [currentEditIndex, setCurrentEditIndex] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isTrimming, setIsTrimming] = useState(false);
  const [videoToTrim, setVideoToTrim] = useState<string | null>(null);
  const [selectedMusicId, setSelectedMusicId] = useState<Id<"music"> | undefined>(undefined);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Poll states
  const [activeTab, setActiveTab] = useState<"post" | "poll">("post");
  const [pollQuestion, setPollQuestion] = useState("");
  const [pollOptions, setPollOptions] = useState(["", ""]);
  const [pollDuration, setPollDuration] = useState<string>("24");

  const createPost = useMutation(api.posts.createPost);
  const generateUploadUrl = useMutation(api.users.generateUploadUrl);
  const createPoll = useMutation(api.polls.createPoll);

  const handleMediaSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    // Max 10 media items
    if (mediaItems.length >= 10) {
      toast.error("En fazla 10 medya ekleyebilirsiniz");
      return;
    }

    Array.from(files).forEach(file => {
      // 50MB limit for videos, 10MB for images
      const maxSize = file.type.startsWith("video/") ? 50 * 1024 * 1024 : 10 * 1024 * 1024;
      if (file.size > maxSize) {
        toast.error(`Dosya boyutu ${file.type.startsWith("video/") ? "50MB" : "10MB"}'dan küçük olmalıdır`);
        return;
      }
      
      const type = file.type.startsWith("video/") ? "video" : "image";
      
      if (type === "video") {
        // Video için trim ekranına yönlendir
        const videoUrl = URL.createObjectURL(file);
        setVideoToTrim(videoUrl);
        setIsTrimming(true);
      } else {
        // Image için normal flow
        const reader = new FileReader();
        reader.onloadend = () => {
          const newItem: MediaItem = {
            file,
            preview: reader.result as string,
            type,
          };
          setMediaItems(prev => [...prev, newItem]);
          // Auto-open editor for first image
          if (mediaItems.length === 0) {
            setCurrentEditIndex(mediaItems.length);
            setIsEditing(true);
          }
        };
        reader.readAsDataURL(file);
      }
    });

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleRemoveMedia = (index: number) => {
    setMediaItems(prev => prev.filter((_, i) => i !== index));
  };

  const handleEditPhoto = (index: number) => {
    setCurrentEditIndex(index);
    setIsEditing(true);
  };

  const handleSaveEditedPhoto = (editedBlob: Blob) => {
    if (currentEditIndex === null) return;
    
    // Convert blob to file
    const file = new File([editedBlob], "edited-photo.jpg", { type: "image/jpeg" });

    // Update preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setMediaItems(prev => {
        const newItems = [...prev];
        newItems[currentEditIndex] = {
          ...newItems[currentEditIndex],
          file,
          preview: reader.result as string,
        };
        return newItems;
      });
    };
    reader.readAsDataURL(editedBlob);

    setIsEditing(false);
    setCurrentEditIndex(null);
    toast.success("Fotoğraf düzenlendi");
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setCurrentEditIndex(null);
  };

  const handleSaveTrimmedVideo = (trimmedBlob: Blob, startTime: number, endTime: number) => {
    // Convert blob to file
    const file = new File([trimmedBlob], "trimmed-video.mp4", { type: "video/mp4" });
    
    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      const newItem: MediaItem = {
        file,
        preview: reader.result as string,
        type: "video",
      };
      setMediaItems(prev => [...prev, newItem]);
    };
    reader.readAsDataURL(trimmedBlob);
    
    setIsTrimming(false);
    // Cleanup old URL
    if (videoToTrim) {
      URL.revokeObjectURL(videoToTrim);
    }
    setVideoToTrim(null);
    
    const duration = endTime - startTime;
    toast.success(`Video kırpıldı (${duration.toFixed(1)}s)`);
  };

  const handleCancelTrim = () => {
    setIsTrimming(false);
    // Cleanup old URL
    if (videoToTrim) {
      URL.revokeObjectURL(videoToTrim);
    }
    setVideoToTrim(null);
  };

  const handleAddPollOption = () => {
    if (pollOptions.length < 10) {
      setPollOptions([...pollOptions, ""]);
    }
  };

  const handleRemovePollOption = (index: number) => {
    if (pollOptions.length > 2) {
      setPollOptions(pollOptions.filter((_, i) => i !== index));
    }
  };

  const handlePollOptionChange = (index: number, value: string) => {
    const newOptions = [...pollOptions];
    newOptions[index] = value;
    setPollOptions(newOptions);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (activeTab === "poll") {
      // Submit poll
      if (!pollQuestion.trim()) {
        toast.error("Lütfen bir soru girin");
        return;
      }

      const validOptions = pollOptions.filter((opt) => opt.trim());
      if (validOptions.length < 2) {
        toast.error("En az 2 seçenek girmelisiniz");
        return;
      }

      setIsSubmitting(true);
      try {
        const pollId = await createPoll({
          question: pollQuestion.trim(),
          options: validOptions.map((opt) => opt.trim()),
          expiresInHours: pollDuration === "never" ? undefined : parseInt(pollDuration),
        });

        // Create a post with the poll
        await createPost({
          content: pollQuestion.trim(),
          imageId: undefined,
          mediaType: undefined,
        });

        toast.success("Anket paylaşıldı");
        setPollQuestion("");
        setPollOptions(["", ""]);
        setPollDuration("24");
        onOpenChange(false);
      } catch (error) {
        if (error instanceof Error) {
          toast.error(error.message);
        }
      } finally {
        setIsSubmitting(false);
      }
    } else {
      // Submit regular post
      if (!content.trim() && mediaItems.length === 0) {
        toast.error("Lütfen bir içerik veya medya ekleyin");
        return;
      }

      setIsSubmitting(true);
      try {
        // Upload all media items
        const mediaUrls: Array<{ storageId: Id<"_storage">; type: "image" | "video" }> = [];
        
        for (const item of mediaItems) {
          const uploadUrl = await generateUploadUrl();
          const result = await fetch(uploadUrl, {
            method: "POST",
            headers: { "Content-Type": item.file.type },
            body: item.file,
          });
          const { storageId } = await result.json();
          mediaUrls.push({ storageId, type: item.type });
        }

        // Use legacy single media if only one item, otherwise use new media array
        if (mediaUrls.length === 1) {
          await createPost({
            content: content.trim(),
            imageId: mediaUrls[0].storageId,
            mediaType: mediaUrls[0].type,
            musicId: selectedMusicId,
          });
        } else if (mediaUrls.length > 1) {
          await createPost({
            content: content.trim(),
            imageId: undefined,
            mediaType: undefined,
            musicId: selectedMusicId,
            media: mediaUrls,
          });
        } else {
          await createPost({
            content: content.trim(),
            imageId: undefined,
            mediaType: undefined,
            musicId: selectedMusicId,
          });
        }

        toast.success("Gönderi paylaşıldı");
        setContent("");
        setMediaItems([]);
        setSelectedMusicId(undefined);
        onOpenChange(false);
      } catch (error) {
        if (error instanceof Error) {
          toast.error(error.message);
        } else {
          toast.error("Gönderi paylaşılamadı");
        }
      } finally {
        setIsSubmitting(false);
      }
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
      {isEditing && currentEditIndex !== null && mediaItems[currentEditIndex] && (
        <AdvancedPhotoEditor
          imageUrl={mediaItems[currentEditIndex].preview}
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
        <DialogContent className={`max-w-lg max-h-[90vh] overflow-y-auto ${isEditing || isTrimming ? 'hidden' : ''}`}>
          <DialogHeader>
            <DialogTitle>Yeni Paylaşım</DialogTitle>
          </DialogHeader>
        
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "post" | "poll")}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="post">Gönderi</TabsTrigger>
            <TabsTrigger value="poll">Anket</TabsTrigger>
          </TabsList>

          <form onSubmit={handleSubmit} className="space-y-4 mt-4">
            <TabsContent value="post" className="space-y-4 mt-0">
              <Textarea
                placeholder="Ne düşünüyorsun?"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={4}
                className="resize-none"
              />

              {mediaItems.length > 0 && (
                <div className={`grid gap-2 ${
                  mediaItems.length === 1 ? 'grid-cols-1' :
                  mediaItems.length === 2 ? 'grid-cols-2' :
                  mediaItems.length === 3 ? 'grid-cols-3' :
                  'grid-cols-2'
                }`}>
                  {mediaItems.map((item, index) => (
                    <div key={index} className="relative">
                      {item.type === "video" ? (
                        <video
                          src={item.preview}
                          className="w-full rounded-lg aspect-square object-cover"
                        />
                      ) : (
                        <img
                          src={item.preview}
                          alt={`Preview ${index + 1}`}
                          className="w-full rounded-lg aspect-square object-cover"
                        />
                      )}
                      <div className="absolute top-2 right-2 flex gap-1 z-10">
                        {item.type === "image" && (
                          <Button
                            type="button"
                            variant="secondary"
                            size="icon"
                            className="h-7 w-7 shadow-lg"
                            onClick={() => handleEditPhoto(index)}
                            title="Düzenle"
                          >
                            <Wand2Icon className="h-3 w-3" />
                          </Button>
                        )}
                        <Button
                          type="button"
                          variant="destructive"
                          size="icon"
                          className="h-7 w-7 shadow-lg"
                          onClick={() => handleRemoveMedia(index)}
                        >
                          <XIcon className="h-3 w-3" />
                        </Button>
                      </div>
                      <div className="absolute top-2 left-2 bg-black/60 text-white text-xs px-2 py-1 rounded">
                        {index + 1}/{mediaItems.length}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex gap-2 flex-wrap">
                {/* Galeri input */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,video/*"
                  multiple
                  className="hidden"
                  onChange={handleMediaSelect}
                />
                
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isSubmitting || mediaItems.length >= 10}
                  className="flex-1 sm:flex-none"
                >
                  {mediaItems.length > 0 ? (
                    <>
                      <PlusIcon className="h-4 w-4 mr-2" />
                      Daha Fazla ({mediaItems.length}/10)
                    </>
                  ) : (
                    <>
                      <GalleryIcon className="h-4 w-4 mr-2" />
                      Fotoğraf/Video Ekle
                    </>
                  )}
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="poll" className="space-y-4 mt-0">
              <div className="space-y-2">
                <Label htmlFor="poll-question">Soru</Label>
                <Input
                  id="poll-question"
                  value={pollQuestion}
                  onChange={(e) => setPollQuestion(e.target.value)}
                  placeholder="Sorunuzu yazın..."
                  maxLength={200}
                />
              </div>

              <div className="space-y-2">
                <Label>Seçenekler</Label>
                <div className="space-y-2">
                  {pollOptions.map((option, index) => (
                    <div key={index} className="flex gap-2">
                      <Input
                        value={option}
                        onChange={(e) => handlePollOptionChange(index, e.target.value)}
                        placeholder={`Seçenek ${index + 1}`}
                        maxLength={100}
                      />
                      {pollOptions.length > 2 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemovePollOption(index)}
                        >
                          <XIcon className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
                {pollOptions.length < 10 && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleAddPollOption}
                    className="w-full"
                  >
                    <PlusIcon className="h-4 w-4 mr-2" />
                    Seçenek Ekle
                  </Button>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="poll-duration">Süre</Label>
                <Select value={pollDuration} onValueChange={setPollDuration}>
                  <SelectTrigger id="poll-duration">
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
            </TabsContent>

            <div className="flex gap-2 justify-end pt-4">
              <Button
                type="button"
                variant="secondary"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                İptal
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Paylaşılıyor..." : "Paylaş"}
              </Button>
            </div>
          </form>
        </Tabs>
      </DialogContent>
    </Dialog>
    </>
  );
}
