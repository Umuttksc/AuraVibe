import { Heart, MessageCircle, Trash2, MoreVertical, Bookmark, Flag, UserX, Edit, History, Send } from "lucide-react";
import { Button } from "@/components/ui/button.tsx";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import type { Id } from "@/convex/_generated/dataModel.d.ts";
import { toast } from "sonner";
import { formatDistanceToNow, format } from "date-fns";
import { tr } from "date-fns/locale";
import { useState, useRef } from "react";
import { motion } from "motion/react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu.tsx";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog.tsx";
import { Textarea } from "@/components/ui/textarea.tsx";
import { Link, useNavigate } from "react-router-dom";
import HashtagText from "@/components/ui/hashtag-text.tsx";
import ReportDialog from "@/components/ui/report-dialog.tsx";
import VerificationBadge from "@/components/ui/verification-badge.tsx";
import { ConvexError } from "convex/values";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar.tsx";
import { useTranslation } from "react-i18next";

// Icon wrapper components to prevent DataCloneError
function HeartIcon({ className, strokeWidth }: { className?: string; strokeWidth?: number }) {
  return <Heart className={className} strokeWidth={strokeWidth} />;
}

function MessageCircleIcon({ className, strokeWidth }: { className?: string; strokeWidth?: number }) {
  return <MessageCircle className={className} strokeWidth={strokeWidth} />;
}

function BookmarkIcon({ className, strokeWidth }: { className?: string; strokeWidth?: number }) {
  return <Bookmark className={className} strokeWidth={strokeWidth} />;
}

function MoreVerticalIcon({ className }: { className?: string }) {
  return <MoreVertical className={className} />;
}

function Trash2Icon({ className }: { className?: string }) {
  return <Trash2 className={className} />;
}

function FlagIcon({ className }: { className?: string }) {
  return <Flag className={className} />;
}

function UserXIcon({ className }: { className?: string }) {
  return <UserX className={className} />;
}

function EditIcon({ className }: { className?: string }) {
  return <Edit className={className} />;
}

function HistoryIcon({ className }: { className?: string }) {
  return <History className={className} />;
}

interface PostCardProps {
  post: {
    _id: Id<"posts">;
    content: string;
    imageId?: Id<"_storage">;
    mediaType?: "image" | "video";
    musicId?: Id<"music">;
    likeCount: number;
    commentCount: number;
    isLikedByCurrentUser: boolean;
    createdAt: string;
    isEdited?: boolean;
    lastEditedAt?: number;
    author: {
      _id: Id<"users">;
      name?: string;
      username?: string;
      profilePicture?: Id<"_storage">;
      profilePictureUrl?: string | null;
      isVerified?: boolean;
      giftLevel?: number;
      showGiftLevel?: boolean;
    } | null;
    music?: {
      _id: Id<"music">;
      title: string;
      artist: string;
      albumArt?: string;
    } | null;
  };
  currentUserId?: Id<"users">;
  onCommentClick: () => void;
}

export default function PostCard({ post, currentUserId, onCommentClick }: PostCardProps) {
  const navigate = useNavigate();
  const { i18n } = useTranslation();
  const toggleLike = useMutation(api.posts.toggleLike);
  const deletePost = useMutation(api.posts.deletePost);
  const toggleSavePost = useMutation(api.savedPosts.toggleSavePost);
  const blockUser = useMutation(api.blocks.blockUser);
  const isSaved = useQuery(api.savedPosts.isPostSaved, { postId: post._id });
  const [isDeleting, setIsDeleting] = useState(false);
  const [reportDialogOpen, setReportDialogOpen] = useState(false);
  const [historyDialogOpen, setHistoryDialogOpen] = useState(false);
  
  const editHistory = useQuery(
    api.posts.getPostEditHistory,
    historyDialogOpen ? { postId: post._id } : "skip"
  );

  // Get storage URL for image
  const imageUrl = useQuery(
    api.users.getStorageUrl,
    post.imageId ? { storageId: post.imageId } : "skip"
  );

  const handleLike = async () => {
    try {
      await toggleLike({ postId: post._id });
    } catch (error) {
      if (error instanceof Error) {
        toast.error(error.message);
      }
    }
  };

  const handleSave = async () => {
    try {
      const result = await toggleSavePost({ postId: post._id });
      if (result.saved) {
        toast.success("Gönderi kaydedildi");
      } else {
        toast.success("Kayıt kaldırıldı");
      }
    } catch (error) {
      if (error instanceof Error) {
        toast.error(error.message);
      }
    }
  };

  const handleDelete = async () => {
    if (!confirm("Bu gönderiyi silmek istediğinizden emin misiniz?")) {
      return;
    }

    setIsDeleting(true);
    try {
      await deletePost({ postId: post._id });
      toast.success("Gönderi silindi");
    } catch (error) {
      if (error instanceof Error) {
        toast.error(error.message);
      }
      setIsDeleting(false);
    }
  };

  const handleBlock = async () => {
    if (!post.author?._id) return;
    
    if (!confirm(`${post.author.name || "Bu kullanıcı"}yı engellemek istediğinizden emin misiniz?`)) {
      return;
    }

    try {
      await blockUser({ blockedId: post.author._id });
      toast.success("Kullanıcı engellendi");
    } catch (error) {
      if (error instanceof Error) {
        toast.error(error.message);
      }
    }
  };

  const handleEditClick = () => {
    navigate(`/${i18n.language}/edit-post/${post._id}`);
  };

  const timeAgo = formatDistanceToNow(new Date(post.createdAt), {
    addSuffix: true,
    locale: tr,
  });

  const isOwnPost = currentUserId && post.author && currentUserId === post.author._id;

  const [isLiking, setIsLiking] = useState(false);
  const [showHeartAnimation, setShowHeartAnimation] = useState(false);
  const lastTap = useRef(0);
  
  const handleLikeWithAnimation = async () => {
    setIsLiking(true);
    await handleLike();
    setTimeout(() => setIsLiking(false), 600);
  };

  const handleDoubleTap = () => {
    const now = Date.now();
    const DOUBLE_TAP_DELAY = 300;
    
    if (now - lastTap.current < DOUBLE_TAP_DELAY) {
      // Double tap detected
      if (!post.isLikedByCurrentUser) {
        handleLike();
      }
      setShowHeartAnimation(true);
      setTimeout(() => setShowHeartAnimation(false), 1000);
    }
    
    lastTap.current = now;
  };

  return (
    <motion.div 
      className="bg-card border-b overflow-hidden"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-3">
          {post.author?._id ? (
            <Link to={`/profile?userId=${post.author._id}`}>
              <Avatar className="h-9 w-9 cursor-pointer hover:opacity-80 transition-opacity ring-0">
                {post.author?.profilePictureUrl && (
                  <AvatarImage src={post.author.profilePictureUrl} alt={post.author.name || ""} />
                )}
                <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-500 text-white font-semibold text-xs">
                  {post.author?.name?.[0] || "U"}
                </AvatarFallback>
              </Avatar>
            </Link>
          ) : (
            <Avatar className="h-9 w-9 ring-0">
              <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-500 text-white font-semibold text-xs">
                U
              </AvatarFallback>
            </Avatar>
          )}
          <div className="min-w-0">
            <div className="flex items-center gap-1">
              {post.author?._id ? (
                <Link to={`/profile?userId=${post.author._id}`} className="font-semibold text-sm hover:opacity-60 transition-opacity truncate">
                  {post.author?.name || "Kullanıcı"}
                </Link>
              ) : (
                <span className="font-semibold text-sm truncate">Kullanıcı</span>
              )}
              {post.author?.isVerified && (
                <span className="relative -top-2">
                  <VerificationBadge size="sm" />
                </span>
              )}
            </div>
            <div className="flex items-center gap-1">
              <p className="text-xs text-muted-foreground">{timeAgo}</p>
              {post.isEdited && (
                <span className="text-xs text-muted-foreground">· düzenlendi</span>
              )}
            </div>
          </div>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8" disabled={isDeleting}>
              <MoreVerticalIcon className="h-5 w-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {isOwnPost ? (
              <>
                <DropdownMenuItem onClick={handleEditClick}>
                  <EditIcon className="h-4 w-4 mr-2" />
                  Düzenle
                </DropdownMenuItem>
                {post.isEdited && (
                  <DropdownMenuItem onClick={() => setHistoryDialogOpen(true)}>
                    <HistoryIcon className="h-4 w-4 mr-2" />
                    Düzenleme Geçmişi
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleDelete} className="text-destructive">
                  <Trash2Icon className="h-4 w-4 mr-2" />
                  Sil
                </DropdownMenuItem>
              </>
            ) : (
              <>
                <DropdownMenuItem onClick={() => setReportDialogOpen(true)}>
                  <FlagIcon className="h-4 w-4 mr-2" />
                  Rapor Et
                </DropdownMenuItem>
                {post.author && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleBlock} className="text-destructive">
                      <UserXIcon className="h-4 w-4 mr-2" />
                      Kullanıcıyı Engelle
                    </DropdownMenuItem>
                  </>
                )}
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Media */}
      {post.imageId && imageUrl && (
        <div className="relative select-none" onClick={handleDoubleTap}>
          {post.mediaType === "video" ? (
            <video
              src={imageUrl}
              controls
              className="w-full aspect-square object-cover"
            />
          ) : (
            <img
              src={imageUrl}
              alt="Post"
              className="w-full aspect-square object-cover"
              draggable={false}
            />
          )}
          
          {/* Double-tap heart animation */}
          {showHeartAnimation && (
            <motion.div
              className="absolute inset-0 flex items-center justify-center pointer-events-none"
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1.2 }}
              exit={{ opacity: 0, scale: 1.5 }}
              transition={{ duration: 0.4 }}
            >
              <motion.div
                initial={{ opacity: 1 }}
                animate={{ opacity: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
              >
                <Heart className="h-24 w-24 fill-white text-white drop-shadow-2xl" />
              </motion.div>
            </motion.div>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="px-4 py-2.5">
        <div className="flex items-center justify-between mb-2.5">
          <div className="flex items-center gap-5">
            <motion.button
              onClick={handleLikeWithAnimation}
              className="relative -ml-1"
              whileTap={{ scale: 0.85 }}
            >
              <HeartIcon
                className={`h-[26px] w-[26px] transition-colors ${
                  post.isLikedByCurrentUser 
                    ? "fill-red-500 text-red-500" 
                    : "text-foreground hover:text-muted-foreground"
                }`}
                strokeWidth={1.75}
              />
              {isLiking && (
                <motion.div
                  className="absolute inset-0"
                  initial={{ scale: 1, opacity: 1 }}
                  animate={{ scale: 2, opacity: 0 }}
                  transition={{ duration: 0.6 }}
                >
                  <HeartIcon className="h-[26px] w-[26px] fill-red-500 text-red-500" />
                </motion.div>
              )}
            </motion.button>
            
            <motion.button
              onClick={onCommentClick}
              whileTap={{ scale: 0.85 }}
              className="-ml-0.5"
            >
              <MessageCircleIcon 
                className="h-[26px] w-[26px] text-foreground hover:text-muted-foreground transition-colors" 
                strokeWidth={1.75}
              />
            </motion.button>
            
            <motion.button whileTap={{ scale: 0.85 }} className="-ml-0.5">
              <Send className="h-[26px] w-[26px] text-foreground hover:text-muted-foreground transition-colors" strokeWidth={1.75} />
            </motion.button>
          </div>
          
          <motion.button
            onClick={handleSave}
            whileTap={{ scale: 0.85 }}
            className="-mr-1"
          >
            <BookmarkIcon
              className={`h-[26px] w-[26px] transition-colors ${
                isSaved 
                  ? "fill-foreground text-foreground" 
                  : "text-foreground hover:text-muted-foreground"
              }`}
              strokeWidth={1.75}
            />
          </motion.button>
        </div>
        
        {/* Like count */}
        {post.likeCount > 0 && (
          <p className="text-sm font-semibold mb-1 bg-gradient-to-r from-pink-600 to-rose-600 bg-clip-text text-transparent">
            {post.likeCount.toLocaleString('tr-TR')} beğeni
          </p>
        )}
        
        {/* Content */}
        {post.content && (
          <div className="text-sm">
            <span className="font-semibold mr-1.5">
              {post.author?.name || "Kullanıcı"}
            </span>
            <span className="whitespace-pre-wrap">
              <HashtagText text={post.content} />
            </span>
          </div>
        )}
        
        {/* View comments */}
        {post.commentCount > 0 && (
          <button
            onClick={onCommentClick}
            className="text-sm text-muted-foreground hover:bg-gradient-to-r hover:from-blue-600 hover:to-cyan-600 hover:bg-clip-text hover:text-transparent transition-all mt-1 font-medium"
          >
            {post.commentCount} yorumun tümünü gör
          </button>
        )}
      </div>
      <ReportDialog
        open={reportDialogOpen}
        onOpenChange={setReportDialogOpen}
        postId={post._id}
        type="post"
      />

      {/* History Dialog */}
      <Dialog open={historyDialogOpen} onOpenChange={setHistoryDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Düzenleme Geçmişi</DialogTitle>
            <DialogDescription>
              Bu gönderinin tüm düzenleme geçmişini görüntüleyin.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {/* Current version */}
            <div className="border rounded-lg p-4 bg-muted/30">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-semibold text-primary">Güncel Versiyon</span>
                {post.lastEditedAt && (
                  <span className="text-xs text-muted-foreground">
                    {format(new Date(post.lastEditedAt), "PPp", { locale: tr })}
                  </span>
                )}
              </div>
              <p className="text-sm whitespace-pre-wrap">
                <HashtagText text={post.content} />
              </p>
            </div>

            {/* Previous versions */}
            {editHistory && editHistory.length > 0 ? (
              editHistory.map((edit, index) => (
                <div key={edit._id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-semibold">
                      Versiyon {editHistory.length - index}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {format(new Date(edit.editedAt), "PPp", { locale: tr })}
                    </span>
                  </div>
                  <p className="text-sm whitespace-pre-wrap text-muted-foreground">
                    <HashtagText text={edit.previousContent} />
                  </p>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">
                Henüz düzenleme geçmişi yok
              </p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
