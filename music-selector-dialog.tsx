import { useState, useEffect, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog.tsx";
import { Button } from "@/components/ui/button.tsx";
import { ScrollArea } from "@/components/ui/scroll-area.tsx";
import { Slider } from "@/components/ui/slider.tsx";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs.tsx";
import { Input } from "@/components/ui/input.tsx";
import { Music, Play, Pause, Search, Heart, Loader2 } from "lucide-react";
import { useQuery, useMutation, useAction } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import type { Id } from "@/convex/_generated/dataModel.d.ts";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import { toast } from "sonner";
import { useDebounce } from "@/hooks/use-debounce.ts";

// Icon wrappers
function PlayIcon() {
  return <Play className="h-4 w-4" />;
}

function PauseIcon() {
  return <Pause className="h-4 w-4" />;
}

interface Music {
  _id: Id<"music">;
  title: string;
  artist: string;
  albumArt?: string;
  duration?: number;
  genre?: string;
  popularity: number;
  audioUrl?: string;
}

interface MusicSelectorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (music: Music, startTime?: number) => void;
  selectedMusicId?: Id<"music">;
}

export default function MusicSelectorDialog({
  open,
  onOpenChange,
  onSelect,
  selectedMusicId,
}: MusicSelectorDialogProps) {
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeTab, setActiveTab] = useState<"uploaded" | "search" | "library">("uploaded");
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch] = useDebounce(searchQuery, 500);
  
  type PixabayMusic = {
    pixabayId: string;
    title: string;
    artist: string;
    genre: string;
    duration: number;
    audioUrl: string;
    albumArt: string;
    popularity: number;
    source: string;
  };
  
  type SavedMusic = {
    _id: Id<"savedMusic">;
    userId: Id<"users">;
    title: string;
    artist: string;
    albumArt?: string;
    duration?: number;
    genre?: string;
    audioUrl: string;
    source: string;
    sourceId?: string;
  };
  
  // Type guards
  const isPixabayMusic = (music: Music | PixabayMusic | SavedMusic): music is PixabayMusic => {
    return "pixabayId" in music;
  };
  
  const isSavedMusic = (music: Music | PixabayMusic | SavedMusic): music is SavedMusic => {
    return "_id" in music && "__tableName" in music._id && music._id.__tableName === "savedMusic";
  };
  
  const [pixabayResults, setPixabayResults] = useState<Array<PixabayMusic> | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  
  // Audio player state
  const [playingMusicId, setPlayingMusicId] = useState<Id<"music"> | string | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Queries
  const userMusic = useQuery(api.music.getUserMusic, {});
  const savedMusic = useQuery(api.savedMusic.getSavedMusic, {});

  // Actions
  const searchPixabay = useAction(api.pixabayMusic.searchPixabayMusic);

  // Mutations for upload
  const generateUploadUrl = useMutation(api.music.generateAudioUploadUrl);
  const saveUploadedMusic = useMutation(api.music.saveUploadedMusic);
  const saveToLibrary = useMutation(api.savedMusic.saveToLibrary);
  const removeFromLibrary = useMutation(api.savedMusic.removeFromLibrary);

  // Cleanup audio on unmount or close
  useEffect(() => {
    if (!open) {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      setPlayingMusicId(null);
      setCurrentTime(0);
      setDuration(0);
      setSearchQuery("");
      setPixabayResults(null);
    }
  }, [open]);

  // Search Pixabay when debounced search changes
  useEffect(() => {
    if (debouncedSearch && activeTab === "search") {
      setIsSearching(true);
      searchPixabay({ query: debouncedSearch })
        .then((result) => {
          setPixabayResults(result.music);
        })
        .catch((error) => {
          console.error("Search error:", error);
          toast.error("Arama sırasında bir hata oluştu");
        })
        .finally(() => {
          setIsSearching(false);
        });
    } else if (!debouncedSearch && activeTab === "search") {
      setPixabayResults(null);
    }
  }, [debouncedSearch, activeTab, searchPixabay]);

  const handleMusicSelect = (music: Music | PixabayMusic | SavedMusic) => {
    // Pass the current playback time if this music is playing
    const musicId = isPixabayMusic(music) ? music.pixabayId : (isSavedMusic(music) ? music._id : music._id);
    const startTime = playingMusicId === musicId ? currentTime : 0;
    
    // Convert to Music format
    const musicData: Music = {
      _id: ("_id" in music && "__tableName" in music._id && music._id.__tableName === "music") 
        ? music._id 
        : ("temp_" + Date.now()) as Id<"music">,
      title: music.title,
      artist: music.artist,
      albumArt: music.albumArt,
      duration: music.duration,
      genre: music.genre,
      popularity: "popularity" in music ? music.popularity : 80,
      audioUrl: music.audioUrl,
    };
    
    onSelect(musicData, startTime);
    onOpenChange(false);
  };

  const handleSaveToLibrary = async (music: PixabayMusic) => {
    try {
      await saveToLibrary({
        title: music.title,
        artist: music.artist,
        audioUrl: music.audioUrl,
        albumArt: music.albumArt,
        duration: music.duration,
        genre: music.genre,
        source: music.source,
        sourceId: music.pixabayId,
      });
      toast.success("Müzik kütüphaneye eklendi!");
    } catch (error) {
      if (error instanceof Error) {
        toast.error(error.message);
      }
    }
  };

  const handleRemoveFromLibrary = async (musicId: Id<"savedMusic">) => {
    try {
      await removeFromLibrary({ musicId });
      toast.success("Müzik kütüphaneden kaldırıldı");
    } catch (error) {
      if (error instanceof Error) {
        toast.error(error.message);
      }
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('audio/')) {
      toast.error("Lütfen geçerli bir ses dosyası seçin");
      return;
    }

    // Validate file size (max 50MB)
    const maxSize = 50 * 1024 * 1024;
    if (file.size > maxSize) {
      toast.error("Dosya boyutu 50MB'dan küçük olmalıdır");
      return;
    }

    setIsUploading(true);

    try {
      // Get upload URL
      const postUrl = await generateUploadUrl();

      // Upload file
      const result = await fetch(postUrl, {
        method: "POST",
        headers: { "Content-Type": file.type },
        body: file,
      });

      if (!result.ok) {
        throw new Error("Dosya yüklenemedi");
      }

      const { storageId } = await result.json();

      // Get file name without extension as title
      const fileName = file.name.replace(/\.[^/.]+$/, "");

      // Get audio duration
      const audio = new Audio(URL.createObjectURL(file));
      await new Promise((resolve) => {
        audio.onloadedmetadata = () => {
          resolve(null);
        };
      });
      const duration = Math.floor(audio.duration);

      // Save music to database
      const musicId = await saveUploadedMusic({
        storageId,
        title: fileName,
        duration,
      });

      toast.success("Müzik başarıyla yüklendi");

      // Clear file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Müzik yüklenirken bir hata oluştu");
    } finally {
      setIsUploading(false);
    }
  };

  const handlePlayPause = (music: Music | PixabayMusic | SavedMusic) => {
    if (!music.audioUrl) {
      toast.error("Bu müzik için ses dosyası mevcut değil");
      return;
    }

    const musicId = isPixabayMusic(music) 
      ? music.pixabayId 
      : (isSavedMusic(music) ? music._id : music._id);
    
    // If this music is already playing, pause it
    if (playingMusicId === musicId && audioRef.current) {
      audioRef.current.pause();
      setPlayingMusicId(null);
      return;
    }

    // Stop current audio if any
    if (audioRef.current) {
      audioRef.current.pause();
    }

    // Create and play new audio
    const audio = new Audio(music.audioUrl);
    audioRef.current = audio;
    setPlayingMusicId(musicId);
    setCurrentTime(0);
    setDuration(0);

    // Set up event listeners
    audio.ontimeupdate = () => {
      setCurrentTime(audio.currentTime);
    };

    audio.onloadedmetadata = () => {
      setDuration(audio.duration);
    };

    audio.onended = () => {
      setPlayingMusicId(null);
      setCurrentTime(0);
    };

    audio.play().catch((error) => {
      toast.error("Müzik çalınamadı");
      console.error(error);
      setPlayingMusicId(null);
    });
  };

  const handleSeek = (value: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = value;
      setCurrentTime(value);
    }
  };

  const formatDuration = (seconds?: number) => {
    if (!seconds) return "";
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const MusicList = ({ 
    music, 
    showSaveButton = false,
    showRemoveButton = false 
  }: { 
    music: Array<Music | PixabayMusic | SavedMusic> | undefined; 
    showSaveButton?: boolean;
    showRemoveButton?: boolean;
  }) => {
    if (!music) {
      return (
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      );
    }

    if (music.length === 0) {
      return (
        <div className="text-center py-8 text-muted-foreground">
          <Music className="h-12 w-12 mx-auto mb-2 opacity-50" />
          <p>Henüz müzik yok</p>
        </div>
      );
    }

    return (
      <div className="space-y-2">
        {music.map((item) => {
          const musicId = isPixabayMusic(item) 
            ? item.pixabayId 
            : (isSavedMusic(item) ? item._id : item._id);
          const isPlaying = playingMusicId === musicId;
          
          return (
            <div
              key={musicId}
              className="w-full rounded-lg hover:bg-accent transition-colors"
            >
              <div className="flex items-center gap-3 p-3">
                {/* Play/Pause Button */}
                {item.audioUrl && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="flex-shrink-0"
                    onClick={(e) => {
                      e.stopPropagation();
                      handlePlayPause(item);
                    }}
                  >
                    {isPlaying ? <PauseIcon /> : <PlayIcon />}
                  </Button>
                )}
                
                {/* Album Art */}
                <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-primary/20 to-accent rounded-lg flex items-center justify-center text-2xl">
                  {item.albumArt || "🎵"}
                </div>
                
                {/* Music Info - Clickable */}
                <button
                  onClick={() => handleMusicSelect(item)}
                  className="flex-1 min-w-0 text-left"
                >
                  <div className="font-medium truncate">{item.title}</div>
                  <div className="text-sm text-muted-foreground truncate">
                    {item.artist}
                    {item.duration && ` • ${formatDuration(item.duration)}`}
                  </div>
                </button>
                
                {/* Save to Library Button */}
                {showSaveButton && isPixabayMusic(item) && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSaveToLibrary(item);
                    }}
                  >
                    <Heart className="h-4 w-4" />
                  </Button>
                )}

                {/* Remove from Library Button */}
                {showRemoveButton && isSavedMusic(item) && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemoveFromLibrary(item._id);
                    }}
                  >
                    <Heart className="h-4 w-4 fill-red-500 text-red-500" />
                  </Button>
                )}
                
                {/* Genre Badge */}
                {item.genre && (
                  <div className="text-xs text-muted-foreground px-2 py-1 bg-muted rounded">
                    {item.genre}
                  </div>
                )}
              </div>

              {/* Progress Bar - Only show for playing music */}
              {isPlaying && duration > 0 && (
                <div className="px-3 pb-3 space-y-1">
                  <Slider
                    value={[currentTime]}
                    max={duration}
                    step={0.01}
                    onValueChange={([value]) => handleSeek(value)}
                    className="cursor-pointer"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>{formatDuration(Math.floor(currentTime))}</span>
                    <span>{formatDuration(Math.floor(duration))}</span>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col z-[10000]">
        <DialogHeader>
          <DialogTitle>Müzik Ekle</DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)} className="flex-1 flex flex-col mt-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="uploaded">Yüklenenler</TabsTrigger>
            <TabsTrigger value="search">Ara</TabsTrigger>
            <TabsTrigger value="library">Kütüphanem</TabsTrigger>
          </TabsList>

          {/* Uploaded Music Tab */}
          <TabsContent value="uploaded" className="flex-1 flex flex-col space-y-4 mt-4">
            {/* Upload Section */}
            <div className="flex flex-col items-center justify-center gap-4 py-6 border-2 border-dashed rounded-lg">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary/20 to-accent flex items-center justify-center">
                <Music className="h-10 w-10 text-primary" />
              </div>
              <div className="text-center space-y-2">
                <h3 className="font-semibold">Kendi müziğini yükle</h3>
                <p className="text-xs text-muted-foreground max-w-sm">
                  Telefonundan veya bilgisayarından müzik dosyası seçerek gönderilerine müzik ekleyebilirsin
                </p>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="audio/*"
                onChange={handleFileSelect}
                className="hidden"
              />
              <Button
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500 hover:from-purple-600 hover:via-pink-600 hover:to-orange-600"
              >
                {isUploading ? "Yükleniyor..." : "Müzik Seç"}
              </Button>
              <p className="text-xs text-muted-foreground">
                MP3, WAV, M4A (Max 50MB)
              </p>
            </div>

            {/* Show user's uploaded music */}
            {userMusic && userMusic.length > 0 && (
              <div className="space-y-3 flex-1 min-h-0">
                <h4 className="text-sm font-semibold px-1">Yüklediğin Müzikler</h4>
                <ScrollArea className="h-full max-h-[35vh]">
                  <MusicList music={userMusic} />
                </ScrollArea>
              </div>
            )}
          </TabsContent>

          {/* Search Tab */}
          <TabsContent value="search" className="flex-1 flex flex-col space-y-4 mt-4">
            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Müzik ara... (örn: jazz, rock, calm)"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
              {isSearching && (
                <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
              )}
            </div>

            {/* Search Results */}
            <div className="flex-1 min-h-0">
              {!searchQuery && (
                <div className="text-center py-12 text-muted-foreground">
                  <Search className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p className="text-sm">Müzik aramak için yukarıdaki kutucuğa yazın</p>
                  <p className="text-xs mt-1">Binlerce ücretsiz müzik arasından seçin</p>
                </div>
              )}
              
              {searchQuery && isSearching && (
                <div className="space-y-2">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              )}

              {searchQuery && !isSearching && pixabayResults && (
                <ScrollArea className="h-full max-h-[45vh]">
                  <MusicList music={pixabayResults} showSaveButton />
                </ScrollArea>
              )}

              {searchQuery && !isSearching && pixabayResults && pixabayResults.length === 0 && (
                <div className="text-center py-12 text-muted-foreground">
                  <Music className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p className="text-sm">Sonuç bulunamadı</p>
                  <p className="text-xs mt-1">Farklı anahtar kelimeler deneyin</p>
                </div>
              )}
            </div>
          </TabsContent>

          {/* Library Tab */}
          <TabsContent value="library" className="flex-1 flex flex-col space-y-4 mt-4">
            <div className="text-sm text-muted-foreground px-1">
              Kaydedilen müzikleriniz
            </div>
            <div className="flex-1 min-h-0">
              <ScrollArea className="h-full max-h-[50vh]">
                <MusicList music={savedMusic} showRemoveButton />
              </ScrollArea>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
