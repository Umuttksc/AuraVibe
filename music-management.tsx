import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import { useState, useRef } from "react";
import { Button } from "@/components/ui/button.tsx";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card.tsx";
import { Input } from "@/components/ui/input.tsx";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import { toast } from "sonner";
import { Upload, Music, CheckCircle, Search } from "lucide-react";
import type { Id } from "@/convex/_generated/dataModel.d.ts";
import { ScrollArea } from "@/components/ui/scroll-area.tsx";
import { Badge } from "@/components/ui/badge.tsx";

// Icon wrappers
function UploadIcon({ className }: { className?: string }) {
  return <Upload className={className} />;
}

function MusicIcon({ className }: { className?: string }) {
  return <Music className={className} />;
}

function CheckCircleIcon({ className }: { className?: string }) {
  return <CheckCircle className={className} />;
}

function SearchIcon({ className }: { className?: string }) {
  return <Search className={className} />;
}

export default function MusicManagement() {
  const allMusic = useQuery(api.music.getAllMusic, {});
  const generateUploadUrl = useMutation(api.music.generateAudioUploadUrl);
  const updateMusicAudio = useMutation(api.music.updateMusicAudio);
  
  const [uploadingIds, setUploadingIds] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState("");
  const fileInputRefs = useRef<{ [key: string]: HTMLInputElement | null }>({});

  const handleFileSelect = async (musicId: Id<"music">, file: File) => {
    if (!file.type.startsWith("audio/")) {
      toast.error("Lütfen bir ses dosyası seçin");
      return;
    }

    // 50MB limit
    if (file.size > 50 * 1024 * 1024) {
      toast.error("Dosya boyutu 50MB'dan küçük olmalıdır");
      return;
    }

    setUploadingIds((prev) => new Set(prev).add(musicId));

    try {
      // Step 1: Get upload URL
      const uploadUrl = await generateUploadUrl();

      // Step 2: Upload file
      const result = await fetch(uploadUrl, {
        method: "POST",
        headers: { "Content-Type": file.type },
        body: file,
      });

      if (!result.ok) {
        throw new Error("Dosya yüklenemedi");
      }

      const { storageId } = await result.json();
      const audioUrl = `${import.meta.env.VITE_CONVEX_URL}/api/storage/${storageId}`;

      // Step 3: Update music with audio URL
      await updateMusicAudio({
        musicId,
        audioUrl,
      });

      toast.success("Ses dosyası başarıyla yüklendi");
      
      // Clear file input
      if (fileInputRefs.current[musicId]) {
        fileInputRefs.current[musicId]!.value = "";
      }
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Ses dosyası yüklenirken hata oluştu");
    } finally {
      setUploadingIds((prev) => {
        const newSet = new Set(prev);
        newSet.delete(musicId);
        return newSet;
      });
    }
  };

  const filteredMusic = allMusic?.filter((music) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLocaleLowerCase('tr-TR');
    return (
      music.title.toLocaleLowerCase('tr-TR').includes(query) ||
      music.artist.toLocaleLowerCase('tr-TR').includes(query) ||
      (music.genre && music.genre.toLocaleLowerCase('tr-TR').includes(query))
    );
  });

  if (allMusic === undefined) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-20 w-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MusicIcon className="h-5 w-5" />
            Müzik Kütüphanesi Yönetimi
          </CardTitle>
          <CardDescription>
            Her müzik için gerçek ses dosyası yükleyin. Toplam {allMusic.length} müzik bulunuyor.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search */}
          <div className="relative">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Müzik veya sanatçı ara..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Stats */}
          <div className="flex gap-4 text-sm">
            <div className="flex items-center gap-2">
              <Badge variant="secondary">
                {allMusic.filter((m) => m.audioUrl).length} Ses Dosyası Mevcut
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline">
                {allMusic.filter((m) => !m.audioUrl).length} Eksik
              </Badge>
            </div>
          </div>

          {/* Music List */}
          <ScrollArea className="h-[600px] pr-4">
            <div className="space-y-3">
              {filteredMusic?.map((music) => {
                const isUploading = uploadingIds.has(music._id);
                const hasAudio = !!music.audioUrl;

                return (
                  <Card key={music._id} className={hasAudio ? "border-green-200 dark:border-green-900" : ""}>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-4">
                        {/* Album Art */}
                        <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-primary/20 to-accent rounded-lg flex items-center justify-center text-2xl">
                          {music.albumArt || "🎵"}
                        </div>

                        {/* Music Info */}
                        <div className="flex-1 min-w-0">
                          <div className="font-medium truncate">{music.title}</div>
                          <div className="text-sm text-muted-foreground truncate">
                            {music.artist} {music.genre && `• ${music.genre}`}
                          </div>
                        </div>

                        {/* Status & Upload */}
                        <div className="flex items-center gap-2">
                          {hasAudio ? (
                            <div className="flex items-center gap-2 text-green-600">
                              <CheckCircleIcon className="h-5 w-5" />
                              <span className="text-sm font-medium">Yüklendi</span>
                            </div>
                          ) : (
                            <Badge variant="outline">Eksik</Badge>
                          )}

                          <input
                            ref={(el) => {
                              fileInputRefs.current[music._id] = el;
                            }}
                            type="file"
                            accept="audio/*"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                handleFileSelect(music._id, file);
                              }
                            }}
                          />

                          <Button
                            size="sm"
                            variant={hasAudio ? "outline" : "default"}
                            onClick={() => fileInputRefs.current[music._id]?.click()}
                            disabled={isUploading}
                          >
                            <UploadIcon className="h-4 w-4 mr-1" />
                            {isUploading ? "Yükleniyor..." : hasAudio ? "Değiştir" : "Yükle"}
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </ScrollArea>

          {filteredMusic && filteredMusic.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <MusicIcon className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>Arama sonucu bulunamadı</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
