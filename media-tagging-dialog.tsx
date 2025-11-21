import { useState, useRef, useEffect } from "react";
import { X, Search, Check } from "lucide-react";
import { Button } from "@/components/ui/button.tsx";
import { Input } from "@/components/ui/input.tsx";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog.tsx";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar.tsx";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import type { Id } from "@/convex/_generated/dataModel.d.ts";
import type { MediaTag } from "./multi-media-selector.tsx";
import { toast } from "sonner";
import { useAuth } from "@/hooks/use-auth.ts";

interface MediaTaggingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mediaPreview: string;
  existingTags: MediaTag[];
  onSaveTags: (tags: MediaTag[]) => void;
}

interface ClickPosition {
  x: number;
  y: number;
}

export default function MediaTaggingDialog({
  open,
  onOpenChange,
  mediaPreview,
  existingTags,
  onSaveTags,
}: MediaTaggingDialogProps) {
  const [tags, setTags] = useState<MediaTag[]>(existingTags);
  const [searchQuery, setSearchQuery] = useState("");
  const [clickPosition, setClickPosition] = useState<ClickPosition | null>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const { user } = useAuth();

  const currentUser = useQuery(
    api.users.getCurrentUser,
    user ? {} : "skip"
  );
  
  const followedUsers = useQuery(
    api.follows.getFollowing,
    currentUser ? { userId: currentUser._id } : "skip"
  );

  useEffect(() => {
    if (open) {
      setTags(existingTags);
      setSearchQuery("");
      setClickPosition(null);
    }
  }, [open, existingTags]);

  const handleImageClick = (e: React.MouseEvent<HTMLImageElement>) => {
    if (!imageRef.current) return;

    const rect = imageRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    setClickPosition({ x, y });
  };

  const handleSelectUser = (userId: Id<"users">, username: string) => {
    if (!clickPosition) {
      toast.error("Önce fotoğraf üzerinde bir noktaya tıklayın");
      return;
    }

    const alreadyTagged = tags.some((tag) => tag.userId === userId);
    if (alreadyTagged) {
      toast.error("Bu kullanıcı zaten etiketlendi");
      return;
    }

    if (tags.length >= 20) {
      toast.error("Maksimum 20 kişi etiketleyebilirsiniz");
      return;
    }

    const newTag: MediaTag = {
      userId,
      username,
      x: clickPosition.x,
      y: clickPosition.y,
    };

    setTags([...tags, newTag]);
    setClickPosition(null);
    setSearchQuery("");
    toast.success(`${username} etiketlendi`);
  };

  const handleRemoveTag = (userId: Id<"users">) => {
    setTags(tags.filter((tag) => tag.userId !== userId));
  };

  const handleSave = () => {
    onSaveTags(tags);
    onOpenChange(false);
    toast.success(`${tags.length} kişi etiketlendi`);
  };

  const filteredUsers = followedUsers?.filter((user) =>
    user.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.name?.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Kişi Etiketle</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col md:flex-row gap-4 flex-1 overflow-hidden">
          {/* Media Preview with Tags */}
          <div className="flex-1 relative">
            <div className="relative rounded-lg overflow-hidden bg-black/5 border">
              <img
                ref={imageRef}
                src={mediaPreview}
                alt="Media"
                className="w-full h-auto max-h-[60vh] object-contain cursor-crosshair"
                onClick={handleImageClick}
              />

              {/* Click Position Indicator */}
              {clickPosition && (
                <div
                  className="absolute w-6 h-6 border-2 border-blue-500 bg-blue-500/20 rounded-full transform -translate-x-1/2 -translate-y-1/2 animate-pulse"
                  style={{
                    left: `${clickPosition.x}%`,
                    top: `${clickPosition.y}%`,
                  }}
                />
              )}

              {/* Existing Tags */}
              {tags.map((tag, index) => (
                <div
                  key={index}
                  className="absolute group"
                  style={{
                    left: `${tag.x}%`,
                    top: `${tag.y}%`,
                    transform: "translate(-50%, -50%)",
                  }}
                >
                  <div className="relative">
                    <div className="w-6 h-6 border-2 border-white bg-blue-600 rounded-full shadow-lg" />
                    <div className="absolute top-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                      <div className="px-3 py-1.5 bg-black/90 text-white text-sm rounded-lg">
                        @{tag.username}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <p className="text-xs text-muted-foreground mt-2 text-center">
              💡 Fotoğraf üzerinde bir noktaya tıklayın, ardından kişi seçin
            </p>
          </div>

          {/* User Search & Selection */}
          <div className="w-full md:w-80 flex flex-col max-h-[60vh]">
            {/* Search */}
            <div className="relative mb-3">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Ara..."
                className="pl-9"
              />
            </div>

            {/* Current Tags */}
            {tags.length > 0 && (
              <div className="mb-3 pb-3 border-b">
                <p className="text-sm font-medium mb-2">Etiketlenenler ({tags.length})</p>
                <div className="space-y-1 max-h-32 overflow-y-auto">
                  {tags.map((tag) => (
                    <div
                      key={tag.userId}
                      className="flex items-center justify-between p-2 bg-muted rounded-lg"
                    >
                      <span className="text-sm">@{tag.username}</span>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-6 w-6"
                        onClick={() => handleRemoveTag(tag.userId)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* User List */}
            <div className="flex-1 overflow-y-auto space-y-1">
              {filteredUsers.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  {searchQuery ? "Kullanıcı bulunamadı" : "Takip ettiğiniz kullanıcılar burada görünecek"}
                </p>
              ) : (
                filteredUsers.map((user) => {
                  const isTagged = tags.some((tag) => tag.userId === user._id);
                  return (
                    <button
                      key={user._id}
                      onClick={() => handleSelectUser(user._id, user.username || "user")}
                      disabled={isTagged}
                      className={`w-full flex items-center gap-3 p-2 rounded-lg transition-colors ${
                        isTagged
                          ? "bg-green-100 dark:bg-green-900/20 cursor-not-allowed"
                          : "hover:bg-muted"
                      }`}
                    >
                      <Avatar className="h-10 w-10">
                        {user.profilePictureUrl && (
                          <AvatarImage src={user.profilePictureUrl} />
                        )}
                        <AvatarFallback>
                          {user.name?.[0] || user.username?.[0] || "U"}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 text-left">
                        <p className="text-sm font-medium">{user.name}</p>
                        <p className="text-xs text-muted-foreground">
                          @{user.username}
                        </p>
                      </div>
                      {isTagged && (
                        <Check className="h-5 w-5 text-green-600 dark:text-green-400" />
                      )}
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
          >
            İptal
          </Button>
          <Button onClick={handleSave}>
            Kaydet ({tags.length})
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
