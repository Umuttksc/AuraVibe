import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import type { Id } from "@/convex/_generated/dataModel.d.ts";
import { Authenticated, Unauthenticated, AuthLoading } from "convex/react";
import AppLayout from "@/components/layout/AppLayout.tsx";
import { Card } from "@/components/ui/card.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Textarea } from "@/components/ui/textarea.tsx";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar.tsx";
import { SignInButton } from "@/components/ui/signin.tsx";
import { User, CheckCircle, MessageSquare, UserCircle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import { toast } from "sonner";
import { ConvexError } from "convex/values";
import { useAuth } from "@/hooks/use-auth.ts";
import { useNavigate } from "react-router-dom";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu.tsx";

function UserIcon({ className }: { className?: string }) {
  return <User className={className} />;
}

function CheckCircleIcon({ className }: { className?: string }) {
  return <CheckCircle className={className} />;
}

function MessageSquareIcon({ className }: { className?: string }) {
  return <MessageSquare className={className} />;
}

function UserCircleIcon({ className }: { className?: string }) {
  return <UserCircle className={className} />;
}

function IslamicChatContent() {
  const [newQuestion, setNewQuestion] = useState("");
  const [expandedDiscussion, setExpandedDiscussion] = useState<Id<"islamicDiscussions"> | null>(null);
  const [replyContent, setReplyContent] = useState("");

  const navigate = useNavigate();
  const currentUser = useQuery(api.users.getCurrentUser);

  const discussions = useQuery(api.islamicDiscussions.getDiscussions, { limit: 50 });
  const replies = useQuery(
    api.islamicDiscussions.getReplies,
    expandedDiscussion ? { discussionId: expandedDiscussion } : "skip"
  );

  const createDiscussion = useMutation(api.islamicDiscussions.createDiscussion);
  const createReply = useMutation(api.islamicDiscussions.createReply);
  const toggleLike = useMutation(api.islamicDiscussions.toggleLike);
  const deleteDiscussion = useMutation(api.islamicDiscussions.deleteDiscussion);
  const deleteReply = useMutation(api.islamicDiscussions.deleteReply);
  const getOrCreateConversation = useMutation(api.messages.getOrCreateConversation);

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

  const handleSendMessage = async (otherUserId: Id<"users">) => {
    try {
      await getOrCreateConversation({ otherUserId });
      toast.success("Mesajlar sayfasına yönlendiriliyorsunuz...");
      navigate("/messages");
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
    <div className="container max-w-4xl mx-auto py-6 px-4 space-y-6">
      {/* Header with Back Button */}
      <div className="space-y-2">
        <Button
          variant="ghost"
          onClick={() => navigate("/wellness")}
          className="mb-2"
        >
          ← Geri
        </Button>
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center gap-2">
            <span className="text-4xl">💬</span>
            <h1 className="text-3xl font-bold">İslami Sohbet</h1>
          </div>
          <p className="text-muted-foreground">
            İslam dini, ibadetler ve ahlak ile ilgili sorularınızı sorun, cevaplar alın
          </p>
        </div>
      </div>

      {/* Yeni Soru Formu */}
      <Card className="p-6 bg-gradient-to-br from-purple-50 via-indigo-50 to-purple-50 dark:from-purple-950/20 dark:via-indigo-950/20 dark:to-purple-950/20 border-purple-200 dark:border-purple-900">
        <div className="space-y-4">
          <h2 className="font-semibold text-lg flex items-center gap-2">
            <span>✍️</span>
            Soru Sorun
          </h2>
          <Textarea
            placeholder="İslam dini, ibadetler, ahlak ile ilgili sorularınızı sorun..."
            value={newQuestion}
            onChange={(e) => setNewQuestion(e.target.value)}
            rows={4}
            className="resize-none"
          />
          <Button onClick={handleCreateDiscussion} className="w-full" size="lg">
            <span className="mr-2">📨</span>
            Soruyu Paylaş
          </Button>
        </div>
      </Card>

      {/* Sorular Listesi */}
      <div className="space-y-4">
        <h2 className="font-semibold text-xl flex items-center gap-2">
          <span>📋</span>
          Sorular ve Cevaplar
        </h2>

        {discussions === undefined ? (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-32 w-full" />
            ))}
          </div>
        ) : discussions.length === 0 ? (
          <Card className="p-12 text-center">
            <span className="text-6xl block mb-4">💭</span>
            <h3 className="font-semibold text-lg mb-2">Henüz soru yok</h3>
            <p className="text-sm text-muted-foreground">
              İlk soruyu siz sorun ve toplulukla paylaşın!
            </p>
          </Card>
        ) : (
          discussions.map((discussion) => {
            const isOwner = currentUser && discussion.user?._id === currentUser._id;
            
            return (
              <Card
                key={discussion._id}
                className="p-6 space-y-4 hover:shadow-lg transition-shadow"
              >
                <div className="flex items-start gap-4">
                  <Avatar className="h-10 w-10">
                    {discussion.user?.profilePicture ? (
                      <AvatarImage src={discussion.user.profilePicture} />
                    ) : (
                      <AvatarFallback>
                        <UserIcon className="h-5 w-5" />
                      </AvatarFallback>
                    )}
                  </Avatar>
                  <div className="flex-1 space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button className="flex items-center gap-2 hover:underline cursor-pointer">
                            <span className="font-semibold">
                              {discussion.user?.name || "Anonim"}
                            </span>
                            {discussion.user?.isVerified && (
                              <CheckCircleIcon className="h-4 w-4 text-blue-500" />
                            )}
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                          {discussion.user && (
                            <>
                              {discussion.user.username && (
                                <DropdownMenuItem onClick={() => navigate(`/profile/${discussion.user!.username}`)}>
                                  <UserCircleIcon className="h-4 w-4 mr-2" />
                                  Profili Görüntüle
                                </DropdownMenuItem>
                              )}
                              {!isOwner && (
                                <DropdownMenuItem onClick={() => handleSendMessage(discussion.user!._id)}>
                                  <MessageSquareIcon className="h-4 w-4 mr-2" />
                                  Mesaj Gönder
                                </DropdownMenuItem>
                              )}
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                      {isOwner && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteDiscussion(discussion._id)}
                          className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                        >
                          <span>🗑️</span>
                        </Button>
                      )}
                    </div>
                    
                    <p className="text-base leading-relaxed">{discussion.question}</p>

                    <div className="flex items-center gap-3 pt-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleToggleLike(discussion._id, undefined)}
                        className="gap-2"
                      >
                        <span>❤️</span>
                        <span className="text-sm">{discussion.likeCount}</span>
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          setExpandedDiscussion(
                            expandedDiscussion === discussion._id ? null : discussion._id
                          )
                        }
                        className="gap-2"
                      >
                        <span>💬</span>
                        <span className="text-sm">{discussion.replyCount} cevap</span>
                      </Button>
                    </div>

                    {/* Cevaplar Bölümü */}
                    {expandedDiscussion === discussion._id && (
                      <div className="mt-4 space-y-4 pl-4 border-l-4 border-purple-200 dark:border-purple-800">
                        {replies === undefined ? (
                          <Skeleton className="h-20 w-full" />
                        ) : replies.length === 0 ? (
                          <p className="text-sm text-muted-foreground">
                            Henüz cevap yok. İlk cevabı siz verin!
                          </p>
                        ) : (
                          replies.map((reply) => {
                            const isReplyOwner = currentUser && reply.user?._id === currentUser._id;
                            
                            return (
                              <Card key={reply._id} className="p-4 bg-background/50">
                                <div className="flex items-start gap-3">
                                  <Avatar className="h-8 w-8">
                                    {reply.user?.profilePicture ? (
                                      <AvatarImage src={reply.user.profilePicture} />
                                    ) : (
                                      <AvatarFallback>
                                        <UserIcon className="h-4 w-4" />
                                      </AvatarFallback>
                                    )}
                                  </Avatar>
                                  <div className="flex-1 space-y-2">
                                    <div className="flex items-start justify-between gap-2">
                                      <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                          <button className="flex items-center gap-2 hover:underline cursor-pointer">
                                            <span className="font-medium text-sm">
                                              {reply.user?.name || "Anonim"}
                                            </span>
                                            {reply.user?.isVerified && (
                                              <CheckCircleIcon className="h-3.5 w-3.5 text-blue-500" />
                                            )}
                                          </button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent>
                                          {reply.user && (
                                            <>
                                              {reply.user.username && (
                                                <DropdownMenuItem onClick={() => navigate(`/profile/${reply.user!.username}`)}>
                                                  <UserCircleIcon className="h-4 w-4 mr-2" />
                                                  Profili Görüntüle
                                                </DropdownMenuItem>
                                              )}
                                              {!isReplyOwner && (
                                                <DropdownMenuItem onClick={() => handleSendMessage(reply.user!._id)}>
                                                  <MessageSquareIcon className="h-4 w-4 mr-2" />
                                                  Mesaj Gönder
                                                </DropdownMenuItem>
                                              )}
                                            </>
                                          )}
                                        </DropdownMenuContent>
                                      </DropdownMenu>
                                      {isReplyOwner && (
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          onClick={() => handleDeleteReply(reply._id)}
                                          className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                                        >
                                          <span>🗑️</span>
                                        </Button>
                                      )}
                                    </div>
                                    <p className="text-sm">{reply.content}</p>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleToggleLike(undefined, reply._id)}
                                      className="gap-1.5 h-7"
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

                        {/* Cevap Yazma Formu */}
                        <div className="space-y-3">
                          <Textarea
                            placeholder="Cevabınızı yazın..."
                            value={replyContent}
                            onChange={(e) => setReplyContent(e.target.value)}
                            rows={3}
                            className="resize-none"
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
  );
}

export default function IslamicChatPage() {
  return (
    <AppLayout>
      <Unauthenticated>
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 p-4">
          <span className="text-6xl">💬</span>
          <h2 className="text-2xl font-bold">İslami Sohbet</h2>
          <p className="text-muted-foreground text-center max-w-md">
            İslami sohbete katılmak için lütfen giriş yapın
          </p>
          <SignInButton />
        </div>
      </Unauthenticated>
      <AuthLoading>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="space-y-4 w-full max-w-4xl px-4">
            <Skeleton className="h-40 w-full" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        </div>
      </AuthLoading>
      <Authenticated>
        <IslamicChatContent />
      </Authenticated>
    </AppLayout>
  );
}
