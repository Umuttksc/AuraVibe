import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import type { Id } from "@/convex/_generated/dataModel.d.ts";
import { Card } from "@/components/ui/card.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Textarea } from "@/components/ui/textarea.tsx";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar.tsx";
import { MessageCircle, Heart, Send, User, CheckCircle, Trash2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import { toast } from "sonner";
import { ConvexError } from "convex/values";
import { useAuth } from "@/hooks/use-auth.ts";

function MessageCircleIcon({ className }: { className?: string }) {
  return <MessageCircle className={className} />;
}

function HeartIcon({ className }: { className?: string }) {
  return <Heart className={className} />;
}

function SendIcon({ className }: { className?: string }) {
  return <Send className={className} />;
}

function UserIcon({ className }: { className?: string }) {
  return <User className={className} />;
}

function CheckCircleIcon({ className }: { className?: string }) {
  return <CheckCircle className={className} />;
}

function Trash2Icon({ className }: { className?: string }) {
  return <Trash2 className={className} />;
}

export default function IslamicDiscussionCompact() {
  const [newQuestion, setNewQuestion] = useState("");
  const [expandedDiscussion, setExpandedDiscussion] = useState<Id<"islamicDiscussions"> | null>(null);
  const [replyContent, setReplyContent] = useState("");

  const { user } = useAuth();
  const currentUserId = user?.profile?.sub;

  const discussions = useQuery(api.islamicDiscussions.getDiscussions, { limit: 10 });
  const replies = useQuery(
    api.islamicDiscussions.getReplies,
    expandedDiscussion ? { discussionId: expandedDiscussion } : "skip"
  );

  const createDiscussion = useMutation(api.islamicDiscussions.createDiscussion);
  const createReply = useMutation(api.islamicDiscussions.createReply);
  const toggleLike = useMutation(api.islamicDiscussions.toggleLike);
  const deleteDiscussion = useMutation(api.islamicDiscussions.deleteDiscussion);
  const deleteReply = useMutation(api.islamicDiscussions.deleteReply);

  const handleCreateDiscussion = async () => {
    if (!newQuestion.trim()) {
      toast.error("Lütfen bir soru yazın");
      return;
    }

    try {
      await createDiscussion({ question: newQuestion });
      setNewQuestion("");
      toast.success("Sorunuz paylaşıldı");
    } catch (error) {
      if (error instanceof ConvexError) {
        const { message } = error.data as { code: string; message: string };
        toast.error(message);
      } else {
        toast.error("Bir hata oluştu");
      }
    }
  };

  const handleCreateReply = async () => {
    if (!replyContent.trim() || !expandedDiscussion) return;

    try {
      await createReply({
        discussionId: expandedDiscussion,
        content: replyContent,
      });
      setReplyContent("");
      toast.success("Cevabınız gönderildi");
    } catch (error) {
      if (error instanceof ConvexError) {
        const { message } = error.data as { code: string; message: string };
        toast.error(message);
      } else {
        toast.error("Bir hata oluştu");
      }
    }
  };

  const handleToggleLike = async (discussionId?: Id<"islamicDiscussions">, replyId?: Id<"islamicDiscussionReplies">) => {
    try {
      await toggleLike({ discussionId, replyId });
    } catch (error) {
      if (error instanceof ConvexError) {
        const { message } = error.data as { code: string; message: string };
        toast.error(message);
      }
    }
  };

  const handleDeleteDiscussion = async (discussionId: Id<"islamicDiscussions">) => {
    if (!confirm("Bu soruyu silmek istediğinizden emin misiniz? Tüm cevaplar da silinecektir.")) {
      return;
    }

    try {
      await deleteDiscussion({ discussionId });
      toast.success("Soru silindi");
      if (expandedDiscussion === discussionId) {
        setExpandedDiscussion(null);
      }
    } catch (error) {
      if (error instanceof ConvexError) {
        const { message } = error.data as { code: string; message: string };
        toast.error(message);
      } else {
        toast.error("Bir hata oluştu");
      }
    }
  };

  const handleDeleteReply = async (replyId: Id<"islamicDiscussionReplies">) => {
    if (!confirm("Bu cevabı silmek istediğinizden emin misiniz?")) {
      return;
    }

    try {
      await deleteReply({ replyId });
      toast.success("Cevap silindi");
    } catch (error) {
      if (error instanceof ConvexError) {
        const { message } = error.data as { code: string; message: string };
        toast.error(message);
      } else {
        toast.error("Bir hata oluştu");
      }
    }
  };

  return (
    <Card className="overflow-hidden bg-gradient-to-br from-purple-50 via-indigo-50 to-purple-50 dark:from-purple-950/20 dark:via-indigo-950/20 dark:to-purple-950/20 border-purple-200 dark:border-purple-900">
      <div className="p-6 space-y-4">
        <div className="flex items-center gap-2">
          <span className="text-2xl">💬</span>
          <h3 className="font-semibold text-lg sm:text-xl text-purple-900 dark:text-purple-100">
            İslami Sohbet
          </h3>
        </div>

        {/* Yeni soru sorma */}
        <Card className="p-4 bg-background/50 border-purple-200 dark:border-purple-800">
          <div className="space-y-3">
            <Textarea
              placeholder="İslam dini, ibadetler, ahlak ile ilgili sorularınızı sorun..."
              value={newQuestion}
              onChange={(e) => setNewQuestion(e.target.value)}
              rows={3}
              className="resize-none"
            />
            <Button onClick={handleCreateDiscussion} className="w-full" size="sm">
              <span className="mr-2">📨</span>
              Soruyu Paylaş
            </Button>
          </div>
        </Card>

        {/* Sorular listesi */}
        <div className="space-y-3">
          {discussions === undefined ? (
            <div className="space-y-3">
              {Array.from({ length: 2 }).map((_, i) => (
                <Skeleton key={i} className="h-24 w-full" />
              ))}
            </div>
          ) : discussions.length === 0 ? (
            <Card className="p-6 text-center">
              <span className="text-5xl block mb-2">💭</span>
              <p className="text-sm text-muted-foreground">
                Henüz soru yok. İlk soruyu siz sorun!
              </p>
            </Card>
          ) : (
            discussions.map((discussion) => {
              const isOwner = currentUserId && discussion.user?._id === currentUserId;
              
              return (
                <Card
                  key={discussion._id}
                  className="p-4 space-y-3 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start gap-3">
                    <Avatar className="h-8 w-8">
                      {discussion.user?.profilePicture ? (
                        <AvatarImage src={discussion.user.profilePicture} />
                      ) : (
                        <AvatarFallback>
                          <UserIcon className="h-4 w-4" />
                        </AvatarFallback>
                      )}
                    </Avatar>
                    <div className="flex-1 space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium text-sm">
                            {discussion.user?.name || "Anonim"}
                          </span>
                          {discussion.user?.isVerified && (
                            <CheckCircleIcon className="h-3 w-3 text-blue-500" />
                          )}
                        </div>
                        {isOwner && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteDiscussion(discussion._id)}
                            className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                          >
                            <span>🗑️</span>
                          </Button>
                        )}
                      </div>
                      <p className="text-sm">{discussion.question}</p>

                      <div className="flex items-center gap-2 pt-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleToggleLike(discussion._id, undefined)}
                          className="gap-1 h-7 px-2"
                        >
                          <span>❤️</span>
                          <span className="text-xs">{discussion.likeCount}</span>
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            setExpandedDiscussion(
                              expandedDiscussion === discussion._id ? null : discussion._id
                            )
                          }
                          className="gap-1 h-7 px-2"
                        >
                          <span>💬</span>
                          <span className="text-xs">{discussion.replyCount} cevap</span>
                        </Button>
                      </div>

                      {/* Cevaplar */}
                      {expandedDiscussion === discussion._id && (
                        <div className="mt-3 space-y-3 pl-3 border-l-2 border-purple-200 dark:border-purple-800">
                          {replies === undefined ? (
                            <Skeleton className="h-16 w-full" />
                          ) : replies.length === 0 ? (
                            <p className="text-xs text-muted-foreground">
                              Henüz cevap yok.
                            </p>
                          ) : (
                            replies.map((reply) => {
                              const isReplyOwner = currentUserId && reply.user?._id === currentUserId;
                              
                              return (
                                <Card key={reply._id} className="p-3 bg-background/50">
                                  <div className="flex items-start gap-2">
                                    <Avatar className="h-6 w-6">
                                      {reply.user?.profilePicture ? (
                                        <AvatarImage src={reply.user.profilePicture} />
                                      ) : (
                                        <AvatarFallback>
                                          <UserIcon className="h-3 w-3" />
                                        </AvatarFallback>
                                      )}
                                    </Avatar>
                                    <div className="flex-1 space-y-1">
                                      <div className="flex items-start justify-between gap-2">
                                        <div className="flex items-center gap-1.5">
                                          <span className="font-medium text-xs">
                                            {reply.user?.name || "Anonim"}
                                          </span>
                                          {reply.user?.isVerified && (
                                            <CheckCircleIcon className="h-3 w-3 text-blue-500" />
                                          )}
                                        </div>
                                        {isReplyOwner && (
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => handleDeleteReply(reply._id)}
                                            className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                                          >
                                            <span>🗑️</span>
                                          </Button>
                                        )}
                                      </div>
                                      <p className="text-xs">{reply.content}</p>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleToggleLike(undefined, reply._id)}
                                        className="gap-1 h-6 px-1.5"
                                      >
                                        <span>❤️</span>
                                        <span className="text-xs">{reply.likeCount}</span>
                                      </Button>
                                    </div>
                                  </div>
                                </Card>
                              );
                            })
                          )}

                          {/* Cevap yazma */}
                          <div className="space-y-2">
                            <Textarea
                              placeholder="Cevabınızı yazın..."
                              value={replyContent}
                              onChange={(e) => setReplyContent(e.target.value)}
                              rows={2}
                              className="text-sm resize-none"
                            />
                            <Button
                              onClick={handleCreateReply}
                              size="sm"
                              className="w-full"
                            >
                              <span className="mr-2">📨</span>
                              Cevap Gönder
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              );
            })
          )}
        </div>
      </div>
    </Card>
  );
}
