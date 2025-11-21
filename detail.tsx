import { Authenticated, Unauthenticated, AuthLoading, useQuery, useMutation, usePaginatedQuery } from "convex/react";
import MainLayout from "@/components/layout/main-layout.tsx";
import { SignInButton } from "@/components/ui/signin.tsx";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import { Users, ArrowLeft, Lock, Globe, LogOut, MessageCircle, Send, Image as ImageIcon, Settings, UserPlus, Pin } from "lucide-react";
import { api } from "@/convex/_generated/api.js";
import { Button } from "@/components/ui/button.tsx";
import { useState, useRef, useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card.tsx";
import { toast } from "sonner";
import { Input } from "@/components/ui/input.tsx";
import { formatDistanceToNow } from "date-fns";
import { tr } from "date-fns/locale";
import type { Id } from "@/convex/_generated/dataModel.d.ts";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar.tsx";
import GroupSettingsDialog from "./_components/group-settings-dialog.tsx";
import MembersDialog from "./_components/members-dialog.tsx";

// Icon wrapper components
function UsersIcon({ className }: { className?: string }) {
  return <Users className={className} />;
}

function ArrowLeftIcon({ className }: { className?: string }) {
  return <ArrowLeft className={className} />;
}

function LockIcon({ className }: { className?: string }) {
  return <Lock className={className} />;
}

function GlobeIcon({ className }: { className?: string }) {
  return <Globe className={className} />;
}

function LogOutIcon({ className }: { className?: string }) {
  return <LogOut className={className} />;
}

function MessageCircleIcon({ className }: { className?: string }) {
  return <MessageCircle className={className} />;
}

function SendIcon({ className }: { className?: string }) {
  return <Send className={className} />;
}

function ImageIconWrapper({ className }: { className?: string }) {
  return <ImageIcon className={className} />;
}

function SettingsIcon({ className }: { className?: string }) {
  return <Settings className={className} />;
}

function UserPlusIcon({ className }: { className?: string }) {
  return <UserPlus className={className} />;
}

function PinIcon({ className }: { className?: string }) {
  return <Pin className={className} />;
}

function CommunityDetailContent() {
  const { id } = useParams<{ id: string }>();
  const communityId = id as Id<"communities">;
  
  const community = useQuery(
    api.communities.getCommunityById,
    communityId ? { communityId } : "skip"
  );
  
  const joinCommunity = useMutation(api.communities.joinCommunity);
  const leaveCommunity = useMutation(api.communities.leaveCommunity);
  const sendMessage = useMutation(api.groupMessages.sendGroupMessage);
  const generateUploadUrl = useMutation(api.groupMessages.generateUploadUrl);

  const { results: messages, status, loadMore } = usePaginatedQuery(
    api.groupMessages.getGroupMessages,
    communityId && community?.isMember ? { communityId } : "skip",
    { initialNumItems: 50 }
  );

  const [messageContent, setMessageContent] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [showMembers, setShowMembers] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  const pinnedMessages = useQuery(
    api.groupMessages.getPinnedMessages,
    communityId && community?.isMember ? { communityId } : "skip"
  );

  const typingUsers = useQuery(
    api.groupMessages.getTypingUsers,
    communityId && community?.isMember ? { communityId } : "skip"
  );

  const setTyping = useMutation(api.groupMessages.setTyping);
  const toggleReaction = useMutation(api.groupMessages.toggleReaction);
  const togglePinMessage = useMutation(api.groupMessages.togglePinMessage);
  const deleteMessage = useMutation(api.groupMessages.deleteMessage);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (messages && messages.length > 0) {
      scrollToBottom();
    }
  }, [messages]);

  const handleJoin = async () => {
    if (!communityId) return;
    try {
      await joinCommunity({ communityId });
      toast.success("Topluluğa katıldınız!");
    } catch (error) {
      if (error instanceof Error) {
        toast.error(error.message);
      }
    }
  };

  const handleLeave = async () => {
    if (!communityId) return;
    if (!confirm("Topluluktan ayrılmak istediğinizden emin misiniz?")) {
      return;
    }
    try {
      await leaveCommunity({ communityId });
      toast.success("Topluluktan ayrıldınız");
    } catch (error) {
      if (error instanceof Error) {
        toast.error(error.message);
      }
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!communityId || (!messageContent.trim() && !selectedImage)) return;

    setIsSending(true);
    try {
      let imageId = undefined;
      let mediaType = undefined;

      if (selectedImage) {
        const uploadUrl = await generateUploadUrl();
        const uploadResult = await fetch(uploadUrl, {
          method: "POST",
          headers: { "Content-Type": selectedImage.type },
          body: selectedImage,
        });
        const { storageId } = await uploadResult.json();
        imageId = storageId;
        mediaType = selectedImage.type.startsWith("video/") ? "video" : "image";
      }

      await sendMessage({
        communityId,
        content: messageContent.trim() || " ",
        imageId,
        mediaType: mediaType as "image" | "video" | undefined,
      });

      setMessageContent("");
      setSelectedImage(null);
      setImagePreview(null);
      if (imageInputRef.current) {
        imageInputRef.current.value = "";
      }

      // Stop typing indicator
      await setTyping({ communityId, isTyping: false });
    } catch (error) {
      if (error instanceof Error) {
        toast.error(error.message);
      }
    } finally {
      setIsSending(false);
    }
  };

  const handleTyping = async () => {
    if (!communityId) return;
    try {
      await setTyping({ communityId, isTyping: true });
    } catch {
      // Ignore typing errors
    }
  };

  const handleReaction = async (messageId: Id<"groupMessages">, reaction: "like" | "love" | "laugh" | "wow" | "sad" | "angry") => {
    try {
      await toggleReaction({ messageId, reaction });
    } catch (error) {
      if (error instanceof Error) {
        toast.error(error.message);
      }
    }
  };

  const handlePinMessage = async (messageId: Id<"groupMessages">) => {
    try {
      await togglePinMessage({ messageId });
      toast.success("Mesaj sabitleme durumu değişti");
    } catch (error) {
      if (error instanceof Error) {
        toast.error(error.message);
      }
    }
  };

  const handleDeleteMessage = async (messageId: Id<"groupMessages">) => {
    if (!confirm("Bu mesajı silmek istediğinizden emin misiniz?")) {
      return;
    }
    try {
      await deleteMessage({ messageId });
      toast.success("Mesaj silindi");
    } catch (error) {
      if (error instanceof Error) {
        toast.error(error.message);
      }
    }
  };

  if (!communityId) {
    return (
      <MainLayout>
        <div className="max-w-2xl mx-auto px-4 py-6">
          <p>Topluluk bulunamadı</p>
        </div>
      </MainLayout>
    );
  }

  if (community === undefined) {
    return (
      <MainLayout>
        <div className="max-w-2xl mx-auto px-4 py-6">
          <Skeleton className="h-64 w-full" />
        </div>
      </MainLayout>
    );
  }

  if (community === null) {
    return (
      <MainLayout>
        <div className="max-w-2xl mx-auto px-4 py-6">
          <p>Topluluk bulunamadı</p>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="max-w-2xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="mb-6">
          <Link to="/communities">
            <Button variant="ghost" size="sm" className="mb-4">
              <ArrowLeftIcon className="h-4 w-4 mr-2" />
              Geri
            </Button>
          </Link>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="h-20 w-20 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white flex-shrink-0">
                  {community.imageId ? (
                    <img
                      src={`${import.meta.env.VITE_CONVEX_URL}/api/storage/${community.imageId}`}
                      alt={community.name}
                      className="h-full w-full object-cover rounded-lg"
                    />
                  ) : (
                    <UsersIcon className="h-10 w-10" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <h1 className="text-2xl font-bold">{community.name}</h1>
                    {community.isPrivate ? (
                      <LockIcon className="h-5 w-5 text-muted-foreground" />
                    ) : (
                      <GlobeIcon className="h-5 w-5 text-muted-foreground" />
                    )}
                  </div>
                  <p className="text-muted-foreground mb-3">
                    {community.description}
                  </p>
                  <div className="flex items-center gap-4 mb-4">
                    <span className="text-sm text-muted-foreground">
                      {community.memberCount} üye
                    </span>
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    {!community.isMember ? (
                      <Button onClick={handleJoin} size="sm">
                        Katıl
                      </Button>
                    ) : (
                      <>
                        <Button
                          onClick={() => setShowMembers(true)}
                          variant="outline"
                          size="sm"
                        >
                          <UserPlusIcon className="h-4 w-4 mr-2" />
                          Üyeler
                        </Button>
                        {community.isAdmin && (
                          <Button
                            onClick={() => setShowSettings(true)}
                            variant="outline"
                            size="sm"
                          >
                            <SettingsIcon className="h-4 w-4 mr-2" />
                            Ayarlar
                          </Button>
                        )}
                        {!community.isAdmin && (
                          <Button
                            onClick={handleLeave}
                            variant="outline"
                            size="sm"
                          >
                            <LogOutIcon className="h-4 w-4 mr-2" />
                            Ayrıl
                          </Button>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Group Chat */}
        {community.isMember ? (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageCircleIcon className="h-5 w-5" />
                Grup Sohbeti
              </CardTitle>
            </CardHeader>
            <CardContent>
              {/* Pinned Messages */}
              {pinnedMessages && pinnedMessages.length > 0 && (
                <div className="mb-4 p-3 bg-muted rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <PinIcon className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Sabitlenmiş Mesajlar</span>
                  </div>
                  <div className="space-y-2">
                    {pinnedMessages.slice(0, 2).map((msg) => (
                      <div key={msg._id} className="text-sm">
                        <span className="font-semibold">{msg.sender?.name}: </span>
                        <span className="text-muted-foreground">{msg.content}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Messages */}
              <div className="space-y-4 mb-4 max-h-[500px] overflow-y-auto">
                {status === "LoadingFirstPage" && (
                  <div className="space-y-2">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <Skeleton key={i} className="h-16 w-full" />
                    ))}
                  </div>
                )}

                {messages && messages.length === 0 && (
                  <p className="text-center text-muted-foreground py-8">
                    Henüz mesaj yok. İlk mesajı siz gönderin!
                  </p>
                )}

                {messages && messages.length > 0 && (
                  <>
                    {status === "CanLoadMore" && (
                      <div className="flex justify-center py-2">
                        <Button
                          onClick={() => loadMore(50)}
                          variant="ghost"
                          size="sm"
                        >
                          Önceki mesajları yükle
                        </Button>
                      </div>
                    )}

                    {messages.map((message) => (
                      <div key={message._id} className="flex gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage
                            src={
                              message.sender?.profilePicture
                                ? `${import.meta.env.VITE_CONVEX_URL}/api/storage/${message.sender.profilePicture}`
                                : undefined
                            }
                          />
                          <AvatarFallback>
                            {message.sender?.name?.[0] || "U"}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="flex items-baseline gap-2 mb-1">
                            <span className="font-semibold text-sm">
                              {message.sender?.name || "Kullanıcı"}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {formatDistanceToNow(new Date(message.createdAt), {
                                addSuffix: true,
                                locale: tr,
                              })}
                            </span>
                          </div>
                          {message.imageId && (
                            <div className="mb-2">
                              {message.mediaType === "video" ? (
                                <video
                                  src={`${import.meta.env.VITE_CONVEX_URL}/api/storage/${message.imageId}`}
                                  controls
                                  className="max-w-xs rounded-lg"
                                />
                              ) : (
                                <img
                                  src={`${import.meta.env.VITE_CONVEX_URL}/api/storage/${message.imageId}`}
                                  alt="Message"
                                  className="max-w-xs rounded-lg"
                                />
                              )}
                            </div>
                          )}
                          {message.content.trim() && (
                            <p className="text-sm">{message.content}</p>
                          )}
                        </div>
                      </div>
                    ))}
                    <div ref={messagesEndRef} />
                  </>
                )}
              </div>

              {/* Image Preview */}
              {imagePreview && (
                <div className="mb-2 relative inline-block">
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="max-w-xs rounded-lg"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="absolute top-2 right-2"
                    onClick={() => {
                      setSelectedImage(null);
                      setImagePreview(null);
                      if (imageInputRef.current) {
                        imageInputRef.current.value = "";
                      }
                    }}
                  >
                    ×
                  </Button>
                </div>
              )}

              {/* Message Input */}
              <form onSubmit={handleSendMessage} className="flex gap-2">
                <input
                  ref={imageInputRef}
                  type="file"
                  accept="image/*,video/*"
                  onChange={handleImageSelect}
                  className="hidden"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => imageInputRef.current?.click()}
                  disabled={isSending}
                >
                  <ImageIconWrapper className="h-4 w-4" />
                </Button>
                <Input
                  value={messageContent}
                  onChange={(e) => {
                    setMessageContent(e.target.value);
                    handleTyping();
                  }}
                  placeholder="Mesajınızı yazın..."
                  disabled={isSending}
                />
                {typingUsers && typingUsers.length > 0 && (
                  <span className="text-xs text-muted-foreground">
                    {typingUsers.join(", ")} yazıyor...
                  </span>
                )}
                <Button type="submit" disabled={isSending || (!messageContent.trim() && !selectedImage)}>
                  <SendIcon className="h-4 w-4" />
                </Button>
              </form>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="p-6 text-center">
              <p className="text-muted-foreground mb-4">
                Grup sohbetini görüntülemek için topluluğa katılın
              </p>
              <Button onClick={handleJoin}>Topluluğa Katıl</Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Dialogs */}
      {community && community.isMember && (
        <>
          <MembersDialog
            open={showMembers}
            onOpenChange={setShowMembers}
            communityId={communityId}
            isAdmin={community.isAdmin}
            creatorId={community.creatorId}
          />
          {community.isAdmin && (
            <GroupSettingsDialog
              open={showSettings}
              onOpenChange={setShowSettings}
              community={{
                _id: community._id,
                name: community.name,
                description: community.description,
                imageId: community.imageId,
                isPrivate: community.isPrivate,
              }}
            />
          )}
        </>
      )}
    </MainLayout>
  );
}

export default function CommunityDetailPage() {
  return (
    <>
      <Unauthenticated>
        <div className="min-h-screen flex items-center justify-center p-4">
          <div className="text-center space-y-4">
            <p className="text-muted-foreground">
              Topluluğu görüntülemek için giriş yapın
            </p>
            <SignInButton />
          </div>
        </div>
      </Unauthenticated>
      <AuthLoading>
        <div className="min-h-screen flex items-center justify-center">
          <Skeleton className="h-20 w-20 rounded-full" />
        </div>
      </AuthLoading>
      <Authenticated>
        <CommunityDetailContent />
      </Authenticated>
    </>
  );
}
