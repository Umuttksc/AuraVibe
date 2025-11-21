import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Input } from "@/components/ui/input.tsx";
import { Send, Trash2, Heart, MessageCircle, Share2, Bookmark } from "lucide-react";
import { useMutation, usePaginatedQuery, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import { toast } from "sonner";
import type { Id } from "@/convex/_generated/dataModel.d.ts";
import { formatDistanceToNow } from "date-fns";
import { tr } from "date-fns/locale";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import { Link } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar.tsx";

// Icon wrapper components to prevent DataCloneError
function SendIcon({ className }: { className?: string }) {
  return <Send className={className} />;
}

function Trash2Icon({ className }: { className?: string }) {
  return <Trash2 className={className} />;
}

function CommentCard({
  comment,
  currentUserId,
  onDelete,
  onLike,
  onCloseDialog,
}: {
  comment: {
    _id: Id<"comments">;
    authorId: Id<"users">;
    content: string;
    likeCount?: number;
    createdAt: string;
    author?: {
      _id: Id<"users">;
      name?: string;
      profilePictureUrl?: string | null;
    } | null;
  };
  currentUserId?: Id<"users">;
  onDelete: (id: Id<"comments">) => void;
  onLike: (id: Id<"comments">) => void;
  onCloseDialog: () => void;
}) {
  const commentLikes = useQuery(api.comments.getCommentLikes, { commentId: comment._id });
  const isLiked = commentLikes?.some(like => like.userId === currentUserId);
  const isOwnComment = currentUserId && comment.author && currentUserId === comment.author._id;
  const timeAgo = formatDistanceToNow(new Date(comment.createdAt), {
    addSuffix: true,
    locale: tr,
  });

  return (
    <div className="flex gap-3 py-2">
      <Link to={`/profile?userId=${comment.authorId}`} className="flex-shrink-0" onClick={onCloseDialog}>
        <Avatar className="h-8 w-8 cursor-pointer hover:opacity-80 transition-opacity">
          {comment.author?.profilePictureUrl && (
            <AvatarImage src={comment.author.profilePictureUrl} alt={comment.author.name || ""} />
          )}
          <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-500 text-white font-semibold text-xs">
            {comment.author?.name?.[0] || "U"}
          </AvatarFallback>
        </Avatar>
      </Link>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-baseline gap-2">
              <Link 
                to={`/profile?userId=${comment.authorId}`}
                className="font-semibold text-sm hover:opacity-70 transition-opacity"
                onClick={onCloseDialog}
              >
                {comment.author?.name || "Kullanıcı"}
              </Link>
              <span className="text-sm break-words">{comment.content}</span>
            </div>
            <div className="flex items-center gap-4 mt-1.5">
              <span className="text-xs text-muted-foreground">{timeAgo}</span>
              {comment.likeCount && comment.likeCount > 0 ? (
                <span className="text-xs text-muted-foreground font-medium">
                  {comment.likeCount} beğeni
                </span>
              ) : null}
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={() => onLike(comment._id)}
              className="transition-colors"
            >
              <Heart className={`h-3 w-3 ${isLiked ? "fill-red-500 text-red-500" : "text-muted-foreground hover:text-foreground"}`} />
            </button>
            {isOwnComment && (
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={() => onDelete(comment._id)}
              >
                <Trash2Icon className="h-3 w-3" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

interface CommentsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  postId: Id<"posts"> | null;
  currentUserId?: Id<"users">;
}

export default function CommentsDialog({
  open,
  onOpenChange,
  postId,
  currentUserId,
}: CommentsDialogProps) {
  const [commentText, setCommentText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const addComment = useMutation(api.comments.addComment);
  const deleteComment = useMutation(api.comments.deleteComment);
  const toggleCommentLike = useMutation(api.comments.toggleCommentLike);
  const toggleLike = useMutation(api.posts.toggleLike);
  const toggleSave = useMutation(api.savedPosts.toggleSavePost);

  const post = useQuery(api.posts.getPostById, postId ? { postId } : "skip");
  const isPostSaved = useQuery(api.savedPosts.isPostSaved, postId ? { postId } : "skip");

  const { results: comments, status, loadMore } = usePaginatedQuery(
    api.comments.getComments,
    postId ? { postId } : "skip",
    { initialNumItems: 20 },
  );

  const isLiked = post?.isLikedByCurrentUser || false;
  const isSaved = isPostSaved || false;

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();

    if (!postId) {
      toast.error("Gönderi bulunamadı");
      return;
    }
    
    if (!commentText.trim()) {
      return;
    }
    
    if (isSubmitting) {
      return;
    }

    setIsSubmitting(true);
    try {
      await addComment({
        postId,
        content: commentText.trim(),
      });
      setCommentText("");
      toast.success("Yorum eklendi");
    } catch (error) {
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error("Yorum eklenemedi");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (commentId: Id<"comments">) => {
    try {
      await deleteComment({ commentId });
      toast.success("Yorum silindi");
    } catch (error) {
      if (error instanceof Error) {
        toast.error(error.message);
      }
    }
  };

  const handleLike = async (commentId: Id<"comments">) => {
    try {
      await toggleCommentLike({ commentId });
    } catch (error) {
      toast.error("Beğeni işlemi başarısız");
    }
  };

  const handlePostLike = async () => {
    if (!postId) return;
    try {
      await toggleLike({ postId });
    } catch (error) {
      toast.error("Beğeni işlemi başarısız");
    }
  };

  const handleSave = async () => {
    if (!postId) return;
    try {
      await toggleSave({ postId });
      toast.success(isSaved ? "Kayıtlardan kaldırıldı" : "Kaydedildi");
    } catch (error) {
      toast.error("Kaydetme işlemi başarısız");
    }
  };

  const handleShare = async () => {
    if (!post) return;
    try {
      const url = `${window.location.origin}/profile?userId=${post.author?._id}`;
      await navigator.share({
        title: `${post.author?.name || "Kullanıcı"}'nın gönderisi`,
        text: post.content || "Gönderiyi gör",
        url: url,
      });
    } catch (error) {
      // User cancelled or share not supported
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(window.location.href);
        toast.success("Bağlantı kopyalandı");
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl h-[100dvh] md:h-[90vh] max-h-[100dvh] md:max-h-[90vh] flex flex-col p-0 gap-0">
        <div className="flex flex-col md:flex-row h-full">
          {/* Post Media Section - Left Side on Desktop */}
          {post && (
            <div className="hidden md:flex md:w-1/2 bg-black items-center justify-center">
              {post.media && post.media.length > 0 ? (
                post.media[0].type === "video" ? (
                  <video
                    src={post.media[0].url || undefined}
                    controls
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <img
                    src={post.media[0].url || undefined}
                    alt="Post"
                    className="w-full h-full object-contain"
                  />
                )
              ) : post.imageUrl ? (
                post.mediaType === "video" ? (
                  <video
                    src={post.imageUrl}
                    controls
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <img
                    src={post.imageUrl}
                    alt="Post"
                    className="w-full h-full object-contain"
                  />
                )
              ) : (
                <div className="flex items-center justify-center p-8 text-muted-foreground">
                  <p className="text-center">{post.content}</p>
                </div>
              )}
            </div>
          )}

          {/* Comments Section - Full width on Mobile, Right Side on Desktop */}
          <div className="w-full md:w-1/2 flex flex-col bg-background h-full overflow-hidden">
            <DialogHeader className="px-4 py-3 border-b flex-shrink-0">
              <DialogTitle className="text-center font-semibold">Yorumlar</DialogTitle>
            </DialogHeader>
            
            {/* Mobile: Post Preview - Scrollable area starts here */}
            <div className="flex-1 min-h-0 overflow-y-auto">
              {post && (
                <div className="md:hidden">
                  {/* Post Media */}
                  {(post.media && post.media.length > 0) || post.imageUrl ? (
                    <div className="w-full bg-black flex items-center justify-center">
                      {post.media && post.media.length > 0 ? (
                        post.media[0].type === "video" ? (
                          <video
                            src={post.media[0].url || undefined}
                            controls
                            className="w-full max-h-[50vh] object-contain"
                          />
                        ) : (
                          <img
                            src={post.media[0].url || undefined}
                            alt="Post"
                            className="w-full max-h-[50vh] object-contain"
                          />
                        )
                      ) : post.imageUrl ? (
                        post.mediaType === "video" ? (
                          <video
                            src={post.imageUrl}
                            controls
                            className="w-full max-h-[50vh] object-contain"
                          />
                        ) : (
                          <img
                            src={post.imageUrl}
                            alt="Post"
                            className="w-full max-h-[50vh] object-contain"
                          />
                        )
                      ) : null}
                    </div>
                  ) : null}
                </div>
              )}

              {/* Post Content Header */}
              {post && (
                <>
                  <div className="px-4 py-3 border-b flex-shrink-0">
                    <div className="flex items-start gap-3">
                      <Link to={`/profile?userId=${post.author?._id}`} onClick={() => onOpenChange(false)}>
                        <Avatar className="h-8 w-8 cursor-pointer hover:opacity-80 transition-opacity">
                          {post.author?.profilePictureUrl && (
                            <AvatarImage src={post.author.profilePictureUrl} alt={post.author.name || ""} />
                          )}
                          <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-500 text-white font-semibold text-xs">
                            {post.author?.name?.[0] || "U"}
                          </AvatarFallback>
                        </Avatar>
                      </Link>
                      <div className="flex-1 min-w-0">
                        <Link 
                          to={`/profile?userId=${post.author?._id}`}
                          className="font-semibold text-sm hover:opacity-70 transition-opacity"
                          onClick={() => onOpenChange(false)}
                        >
                          {post.author?.name || "Kullanıcı"}
                        </Link>
                        {post.content && (
                          <p className="text-sm mt-1 whitespace-pre-wrap break-words">{post.content}</p>
                        )}
                        <p className="text-xs text-muted-foreground mt-1">
                          {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true, locale: tr })}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="px-4 py-2 border-b flex-shrink-0">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <button
                          onClick={handlePostLike}
                          className="transition-colors hover:opacity-70"
                        >
                          <Heart className={`h-6 w-6 ${isLiked ? "fill-red-500 text-red-500" : "text-foreground"}`} />
                        </button>
                        <button className="transition-colors hover:opacity-70">
                          <MessageCircle className="h-6 w-6 text-foreground" />
                        </button>
                        <button
                          onClick={handleShare}
                          className="transition-colors hover:opacity-70"
                        >
                          <Share2 className="h-6 w-6 text-foreground" />
                        </button>
                      </div>
                      <button
                        onClick={handleSave}
                        className="transition-colors hover:opacity-70"
                      >
                        <Bookmark className={`h-6 w-6 ${isSaved ? "fill-current text-foreground" : "text-foreground"}`} />
                      </button>
                    </div>

                    {/* Like count */}
                    {post.likeCount && post.likeCount > 0 ? (
                      <p className="text-sm font-semibold mt-2">
                        {post.likeCount} beğeni
                      </p>
                    ) : null}
                  </div>
                </>
              )}

              {/* Comments List */}
              <div className="px-4 pb-2">
                {status === "LoadingFirstPage" && (
                  <>
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="flex gap-3 py-3">
                        <Skeleton className="h-8 w-8 rounded-full flex-shrink-0" />
                        <div className="flex-1 space-y-2">
                          <Skeleton className="h-4 w-32" />
                          <Skeleton className="h-10 w-full" />
                        </div>
                      </div>
                    ))}
                  </>
                )}

                {comments && comments.length === 0 && (
                  <div className="text-center py-12 text-muted-foreground">
                    <p className="font-medium mb-1">Henüz yorum yok</p>
                    <p className="text-sm">İlk yorumu siz yapın!</p>
                  </div>
                )}

                {comments?.map((comment) => (
                  <CommentCard
                    key={comment._id}
                    comment={comment}
                    currentUserId={currentUserId}
                    onDelete={handleDelete}
                    onLike={handleLike}
                    onCloseDialog={() => onOpenChange(false)}
                  />
                ))}

                {status === "CanLoadMore" && (
                  <div className="py-3">
                    <Button variant="ghost" size="sm" className="w-full text-muted-foreground" onClick={() => loadMore(20)}>
                      Daha fazla yorum göster
                    </Button>
                  </div>
                )}
              </div>
            </div>

            {/* Comment Input - Fixed at bottom */}
            <div className="flex-shrink-0 border-t bg-background px-4 py-3 safe-area-bottom">
              <form 
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSubmit();
                }}
                className="flex gap-3 items-center"
              >
                <Input
                  placeholder="Yorum ekle..."
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  disabled={isSubmitting}
                  className="border-0 bg-muted/50 focus-visible:ring-1 focus-visible:ring-primary focus-visible:ring-offset-0 px-3 py-2 flex-1 rounded-full"
                  autoComplete="off"
                />
                <Button
                  type="submit"
                  disabled={isSubmitting || !commentText.trim()}
                  size="sm"
                  className={`rounded-full px-4 font-semibold whitespace-nowrap ${
                    isSubmitting || !commentText.trim()
                      ? 'bg-muted text-muted-foreground'
                      : 'bg-primary text-primary-foreground'
                  }`}
                >
                  {isSubmitting ? 'Gönderiliyor...' : 'Paylaş'}
                </Button>
              </form>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
