import { useEffect, useState, useRef } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import { Dialog, DialogContent } from "@/components/ui/dialog.tsx";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar.tsx";
import { Button } from "@/components/ui/button.tsx";
import { X, ChevronLeft, ChevronRight, Eye, Trash2, Heart, Send, Smile } from "lucide-react";
import { Spinner } from "@/components/ui/spinner.tsx";
import { toast } from "sonner";
import type { Id } from "@/convex/_generated/dataModel.d.ts";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu.tsx";
import { MoreVertical } from "lucide-react";
import { Input } from "@/components/ui/input.tsx";

interface StoryViewerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string | null;
  storyIndex: number;
}

function SendIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m22 2-7 20-4-9-9-4Z" />
      <path d="M22 2 11 13" />
    </svg>
  );
}

function HeartIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
    </svg>
  );
}

function SmileIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <path d="M8 14s1.5 2 4 2 4-2 4-2" />
      <line x1="9" x2="9.01" y1="9" y2="9" />
      <line x1="15" x2="15.01" y1="9" y2="9" />
    </svg>
  );
}

export default function StoryViewer({
  open,
  onOpenChange,
  userId,
  storyIndex,
}: StoryViewerProps) {
  const [currentStoryIndex, setCurrentStoryIndex] = useState(storyIndex);
  const [progress, setProgress] = useState(0);
  const [showViewers, setShowViewers] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [showReactionPicker, setShowReactionPicker] = useState(false);

  const stories = useQuery(api.stories.getActiveStories, {});
  const markAsViewed = useMutation(api.stories.markAsViewed);
  const deleteStory = useMutation(api.stories.deleteStory);
  const sendReply = useMutation(api.storyReplies.sendReply);
  const addReaction = useMutation(api.storyReplies.addReaction);

  const currentUserStories = stories?.find((s) => s.userId === userId);
  const currentStory = currentUserStories?.stories[currentStoryIndex];

  const reactions = useQuery(
    api.storyReplies.getReactions,
    currentStory ? { storyId: currentStory.storyId } : "skip"
  );
  const userReaction = useQuery(
    api.storyReplies.hasReacted,
    currentStory ? { storyId: currentStory.storyId } : "skip"
  );

  const storyQuery = useQuery(
    api.stories.getStory,
    currentStory ? { storyId: currentStory.storyId } : "skip",
  );

  const viewersQuery = useQuery(
    api.stories.getStoryViewers,
    currentStory ? { storyId: currentStory.storyId } : "skip",
  );

  // Mark as viewed
  useEffect(() => {
    if (currentStory && open) {
      markAsViewed({ storyId: currentStory.storyId }).catch(() => {});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentStory?.storyId, open]);

  // Progress bar timer
  useEffect(() => {
    if (!open || !currentStory || isPaused) {
      return;
    }

    // Use video duration if available, otherwise default to 5 seconds
    const duration = storyQuery?.mediaType === "video" && storyQuery?.videoDuration 
      ? storyQuery.videoDuration * 1000 
      : 5000;
    const increment = 100 / (duration / 50);

    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          handleNext();
          return 0;
        }
        return prev + increment;
      });
    }, 50);

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, currentStory?.storyId, isPaused, storyQuery?.videoDuration]);

  // Reset progress when story changes
  useEffect(() => {
    setProgress(0);
  }, [currentStory?.storyId]);

  const handleNext = () => {
    if (!currentUserStories) return;

    if (currentStoryIndex < currentUserStories.stories.length - 1) {
      setCurrentStoryIndex((prev) => prev + 1);
    } else {
      // Find next user with stories
      const currentIndex = stories?.findIndex((s) => s.userId === userId) ?? -1;
      if (currentIndex !== -1 && stories && currentIndex < stories.length - 1) {
        const nextUser = stories[currentIndex + 1];
        onOpenChange(false);
        setTimeout(() => {
          // This would need to be handled by parent component
          // For now, just close
          onOpenChange(false);
        }, 100);
      } else {
        onOpenChange(false);
      }
    }
  };

  const handlePrevious = () => {
    if (currentStoryIndex > 0) {
      setCurrentStoryIndex((prev) => prev - 1);
    } else {
      // Find previous user with stories
      const currentIndex = stories?.findIndex((s) => s.userId === userId) ?? -1;
      if (currentIndex > 0 && stories) {
        const prevUser = stories[currentIndex - 1];
        onOpenChange(false);
        setTimeout(() => {
          // This would need to be handled by parent component
          onOpenChange(false);
        }, 100);
      }
    }
  };

  const handleDelete = async () => {
    if (!currentStory) return;

    try {
      await deleteStory({ storyId: currentStory.storyId });
      toast.success("Hikaye silindi");
      
      // Move to next story or close
      if (currentUserStories && currentUserStories.stories.length > 1) {
        if (currentStoryIndex < currentUserStories.stories.length - 1) {
          setCurrentStoryIndex(currentStoryIndex);
        } else {
          setCurrentStoryIndex(Math.max(0, currentStoryIndex - 1));
        }
      } else {
        onOpenChange(false);
      }
    } catch (error) {
      toast.error("Hikaye silinirken bir hata oluştu");
    }
  };

  const handleSendReply = async () => {
    if (!currentStory || !replyText.trim()) return;

    try {
      await sendReply({
        storyId: currentStory.storyId,
        content: replyText.trim(),
      });
      toast.success("Yanıt gönderildi");
      setReplyText("");
    } catch (error) {
      toast.error("Yanıt gönderilirken bir hata oluştu");
    }
  };

  const handleReaction = async (emoji: string) => {
    if (!currentStory) return;

    try {
      await addReaction({
        storyId: currentStory.storyId,
        emoji,
      });
      setShowReactionPicker(false);
    } catch (error) {
      toast.error("Tepki eklenirken bir hata oluştu");
    }
  };

  if (!stories || !currentUserStories || !currentStory || !storyQuery) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md h-[80vh] flex items-center justify-center bg-black/95 border-none" showCloseButton={false}>
          <Spinner className="h-8 w-8 text-white" />
        </DialogContent>
      </Dialog>
    );
  }

  const isOwnStory = storyQuery.author._id === userId;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md h-[80vh] p-0 bg-black/95 border-none overflow-hidden" showCloseButton={false}>
        {/* Progress bars */}
        <div className="absolute top-0 left-0 right-0 z-50 flex gap-1 p-2">
          {currentUserStories.stories.map((_, index) => (
            <div key={index} className="flex-1 h-1 bg-white/30 rounded-full overflow-hidden">
              <div
                className="h-full bg-white transition-all duration-100"
                style={{
                  width:
                    index < currentStoryIndex
                      ? "100%"
                      : index === currentStoryIndex
                        ? `${progress}%`
                        : "0%",
                }}
              />
            </div>
          ))}
        </div>

        {/* Header */}
        <div className="absolute top-4 left-0 right-0 z-40 flex items-center justify-between px-4 mt-3">
          <div className="flex items-center gap-2">
            <Avatar className="h-8 w-8 border-2 border-white">
              <AvatarImage
                src={storyQuery.author.profilePictureUrl || undefined}
                alt={storyQuery.author.username}
              />
              <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                {storyQuery.author.username[0]?.toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <span className="text-white text-sm font-medium">
              {storyQuery.author.username}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {isOwnStory && (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-white hover:bg-white/20"
                  onClick={() => setShowViewers(!showViewers)}
                >
                  <Eye className="h-5 w-5" />
                </Button>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-white hover:bg-white/20"
                    >
                      <MoreVertical className="h-5 w-5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      onClick={handleDelete}
                      className="text-destructive"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Sil
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            )}

            <Button
              variant="ghost"
              size="icon"
              onClick={() => onOpenChange(false)}
              className="text-white hover:bg-white/20"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Story Media */}
        <div className="relative w-full h-full flex items-center justify-center">
          {storyQuery.mediaType === "video" ? (
            <video
              src={storyQuery.imageUrl || undefined}
              autoPlay
              muted
              playsInline
              className="w-full h-full object-contain"
              onEnded={handleNext}
            />
          ) : (
            <img
              src={storyQuery.imageUrl || undefined}
              alt="Story"
              className="w-full h-full object-contain"
            />
          )}

          {/* Navigation areas */}
          <button
            onClick={handlePrevious}
            onMouseDown={() => setIsPaused(true)}
            onMouseUp={() => setIsPaused(false)}
            onMouseLeave={() => setIsPaused(false)}
            onTouchStart={() => setIsPaused(true)}
            onTouchEnd={() => setIsPaused(false)}
            className="absolute left-0 top-0 bottom-0 w-1/3 flex items-center justify-start pl-4 hover:bg-gradient-to-r hover:from-black/20 transition-colors"
            disabled={currentStoryIndex === 0}
          >
            {currentStoryIndex > 0 && (
              <ChevronLeft className="h-8 w-8 text-white opacity-0 hover:opacity-100 transition-opacity" />
            )}
          </button>
          
          {/* Center pause area */}
          <div
            onMouseDown={() => setIsPaused(true)}
            onMouseUp={() => setIsPaused(false)}
            onMouseLeave={() => setIsPaused(false)}
            onTouchStart={() => setIsPaused(true)}
            onTouchEnd={() => setIsPaused(false)}
            className="absolute left-1/3 top-0 bottom-0 w-1/3 flex items-center justify-center cursor-pointer"
          >
            {isPaused && (
              <div className="bg-black/50 rounded-full p-3 animate-fade-in">
                <div className="flex gap-1">
                  <div className="w-1 h-6 bg-white rounded-full" />
                  <div className="w-1 h-6 bg-white rounded-full" />
                </div>
              </div>
            )}
          </div>

          <button
            onClick={handleNext}
            onMouseDown={() => setIsPaused(true)}
            onMouseUp={() => setIsPaused(false)}
            onMouseLeave={() => setIsPaused(false)}
            onTouchStart={() => setIsPaused(true)}
            onTouchEnd={() => setIsPaused(false)}
            className="absolute right-0 top-0 bottom-0 w-1/3 flex items-center justify-end pr-4 hover:bg-gradient-to-l hover:from-black/20 transition-colors"
          >
            <ChevronRight className="h-8 w-8 text-white opacity-0 hover:opacity-100 transition-opacity" />
          </button>
        </div>

        {/* Reply input (for others' stories) */}
        {!isOwnStory && (
          <div className="absolute bottom-4 left-4 right-4 z-40">
            <div className="flex items-center gap-2 bg-background/95 backdrop-blur-sm rounded-full px-4 py-2">
              <Button
                variant="ghost"
                size="icon"
                className="rounded-full"
                onClick={() => setShowReactionPicker(!showReactionPicker)}
              >
                <SmileIcon />
              </Button>
              
              <Input
                placeholder="Yanıt gönderin..."
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleSendReply();
                  }
                }}
                className="flex-1 border-none bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0"
              />

              {userReaction ? (
                <div className="text-2xl">{userReaction}</div>
              ) : (
                <Button
                  variant="ghost"
                  size="icon"
                  className="rounded-full"
                  onClick={() => handleReaction("❤️")}
                >
                  <HeartIcon />
                </Button>
              )}

              <Button
                variant="ghost"
                size="icon"
                className="rounded-full"
                onClick={handleSendReply}
                disabled={!replyText.trim()}
              >
                <SendIcon />
              </Button>
            </div>

            {/* Reaction picker */}
            {showReactionPicker && (
              <div className="mt-2 bg-background/95 backdrop-blur-sm rounded-2xl px-4 py-3 flex gap-2">
                {["❤️", "😂", "😮", "😢", "😍", "🔥", "👏", "🎉"].map((emoji) => (
                  <button
                    key={emoji}
                    onClick={() => handleReaction(emoji)}
                    className="text-2xl hover:scale-125 transition-transform"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            )}

            {/* Show reactions */}
            {reactions && reactions.length > 0 && (
              <div className="mt-2 bg-background/95 backdrop-blur-sm rounded-full px-4 py-2 flex gap-3 items-center">
                {reactions.slice(0, 3).map((reaction, index) => (
                  <div key={index} className="flex items-center gap-1">
                    <span className="text-lg">{reaction.emoji}</span>
                    <span className="text-xs text-muted-foreground">
                      {reaction.count}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Viewers panel */}
        {isOwnStory && showViewers && viewersQuery && (
          <div className="absolute bottom-0 left-0 right-0 bg-background rounded-t-xl p-4 max-h-[40vh] overflow-y-auto z-50">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">
                Görüntüleyenler ({storyQuery.viewCount})
              </h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowViewers(false)}
              >
                Kapat
              </Button>
            </div>
            <div className="space-y-3">
              {viewersQuery.map((viewer) => (
                <div key={viewer._id} className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage
                      src={viewer.profilePictureUrl || undefined}
                      alt={viewer.username}
                    />
                    <AvatarFallback>
                      {viewer.username[0]?.toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-medium">{viewer.username}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
