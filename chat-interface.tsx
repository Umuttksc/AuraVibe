import { useEffect, useRef, useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Input } from "@/components/ui/input.tsx";
import { Send, ImageIcon, Camera, X, Ghost, Gift, Mic, Video, Phone, PhoneOff, Play, Pause } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { tr } from "date-fns/locale";
import type { Id } from "@/convex/_generated/dataModel.d.ts";
import { Spinner } from "@/components/ui/spinner.tsx";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog.tsx";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs.tsx";
import { Badge } from "@/components/ui/badge.tsx";
import PremiumGiftAnimation from "@/components/ui/premium-gift-animation.tsx";
import LevelUpAnimation from "@/components/ui/level-up-animation.tsx";
import { useNavigate } from "react-router-dom";
import VideoCallScreen from "@/components/video-call-screen.tsx";
import IncomingCallDialog from "@/components/incoming-call-dialog.tsx";

// Icon wrapper components to prevent DataCloneError
function GhostIcon({ className }: { className?: string }) {
  return <Ghost className={className} />;
}

function XIcon({ className }: { className?: string }) {
  return <X className={className} />;
}

function ImageIconWrapper({ className }: { className?: string }) {
  return <ImageIcon className={className} />;
}

function CameraIcon({ className }: { className?: string }) {
  return <Camera className={className} />;
}

function SendIcon({ className }: { className?: string }) {
  return <Send className={className} />;
}

function GiftIcon({ className }: { className?: string }) {
  return <Gift className={className} />;
}

interface ChatInterfaceProps {
  conversationId: Id<"conversations">;
  prefillMessage?: string | null;
}

export default function ChatInterface({ conversationId, prefillMessage }: ChatInterfaceProps) {
  const navigate = useNavigate();
  const [messageText, setMessageText] = useState("");
  const [selectedMedia, setSelectedMedia] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<"image" | "video" | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [giftDialogOpen, setGiftDialogOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedGift, setSelectedGift] = useState<{ name: string; imageUrl: string; isPremium?: boolean; animationType?: string } | null>(null);
  const [levelUpInfo, setLevelUpInfo] = useState<{ show: boolean; newLevel: number }>({ show: false, newLevel: 0 });
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  
  // Voice message states
  const [isRecording, setIsRecording] = useState(false);
  const [recordedAudio, setRecordedAudio] = useState<Blob | null>(null);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const recordingIntervalRef = useRef<number | null>(null);
  
  // Video call states
  const [inCall, setInCall] = useState(false);
  const [showIncomingCall, setShowIncomingCall] = useState(false);

  const messages = useQuery(api.messages.getMessages, { conversationId });
  const conversations = useQuery(api.messages.getConversations, {});
  const sendMessage = useMutation(api.messages.sendMessage);
  const markAsRead = useMutation(api.messages.markAsRead);
  const generateUploadUrl = useMutation(api.messages.generateUploadUrl);
  const currentUser = useQuery(api.users.getCurrentUser);
  const tokenBalance = useQuery(api.tokens.getTokenBalance, currentUser ? { userId: currentUser._id } : "skip");
  const tokenSettings = useQuery(api.tokens.getTokenSettings, {});
  const gifts = useQuery(api.gifts.getActiveGifts, {});
  const sendGiftWithTokens = useMutation(api.giftTransactions.sendGiftWithTokens);
  
  // Video call
  const startCall = useMutation(api.videoCalls.startCall);
  const activeCall = useQuery(api.videoCalls.getActiveCall, { conversationId });
  const incomingCalls = useQuery(api.videoCalls.getIncomingCalls, {});

  const currentConversation = conversations?.find((c) => c._id === conversationId);

  // Set prefill message when provided
  useEffect(() => {
    if (prefillMessage) {
      setMessageText(prefillMessage);
    }
  }, [prefillMessage]);

  // Mark messages as read when viewing
  useEffect(() => {
    if (conversationId) {
      markAsRead({ conversationId }).catch(() => {});
    }
  }, [conversationId, markAsRead]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleMediaSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const maxSize = file.type.startsWith("video/") ? 50 * 1024 * 1024 : 10 * 1024 * 1024;
      if (file.size > maxSize) {
        toast.error(`Dosya boyutu ${file.type.startsWith("video/") ? "50MB" : "10MB"}'dan küçük olmalıdır`);
        return;
      }
      
      const type = file.type.startsWith("video/") ? "video" : "image";
      setMediaType(type);
      setSelectedMedia(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  const handleRemoveMedia = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setSelectedMedia(null);
    setPreviewUrl(null);
    setMediaType(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    if (cameraInputRef.current) {
      cameraInputRef.current.value = "";
    }
  };

  // Voice message recording
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const chunks: Blob[] = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunks.push(e.data);
        }
      };

      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: "audio/webm" });
        setRecordedAudio(blob);
        stream.getTracks().forEach((track) => track.stop());
      };

      recorder.start();
      setMediaRecorder(recorder);
      setIsRecording(true);
      setRecordingDuration(0);

      // Start duration counter
      recordingIntervalRef.current = window.setInterval(() => {
        setRecordingDuration((prev) => prev + 1);
      }, 1000);
    } catch (error) {
      console.error("Recording error:", error);
      toast.error("Mikrofon erişimi reddedildi");
    }
  };

  const stopRecording = () => {
    if (mediaRecorder && isRecording) {
      mediaRecorder.stop();
      setIsRecording(false);
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
        recordingIntervalRef.current = null;
      }
    }
  };

  const cancelRecording = () => {
    if (mediaRecorder && isRecording) {
      mediaRecorder.stop();
      setIsRecording(false);
      setRecordedAudio(null);
      setRecordingDuration(0);
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
        recordingIntervalRef.current = null;
      }
    }
  };

  const sendVoiceMessage = async () => {
    if (!recordedAudio) return;

    try {
      setIsUploading(true);

      // Upload audio
      const uploadUrl = await generateUploadUrl();
      const result = await fetch(uploadUrl, {
        method: "POST",
        headers: { "Content-Type": recordedAudio.type },
        body: recordedAudio,
      });

      if (!result.ok) {
        throw new Error("Ses kaydı yüklenemedi");
      }

      const { storageId } = await result.json();

      // Send message with audio
      await sendMessage({
        conversationId,
        content: "🎤 Sesli mesaj",
        audioId: storageId,
        audioDuration: recordingDuration,
        mediaType: "audio",
        isAnonymous,
      });

      setRecordedAudio(null);
      setRecordingDuration(0);
      setIsAnonymous(false);
      toast.success("Sesli mesaj gönderildi");
    } catch (error) {
      console.error("Send voice message error:", error);
      toast.error("Sesli mesaj gönderilemedi");
    } finally {
      setIsUploading(false);
    }
  };

  // Check for incoming calls
  useEffect(() => {
    const relevantCall = incomingCalls?.find((call) => call.conversationId === conversationId);
    if (relevantCall && !inCall) {
      setShowIncomingCall(true);
    }
  }, [incomingCalls, conversationId, inCall]);

  // Video call functions
  const handleStartCall = async () => {
    if (!currentConversation?.otherUser._id) return;

    try {
      await startCall({
        conversationId,
        receiverId: currentConversation.otherUser._id,
      });
      setInCall(true);
      toast.success("Arama başlatıldı");
    } catch (error) {
      console.error("Start call error:", error);
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error("Arama başlatılamadı");
      }
    }
  };

  const handleAcceptCall = () => {
    setShowIncomingCall(false);
    setInCall(true);
  };

  const handleRejectCall = () => {
    setShowIncomingCall(false);
  };

  const handleEndCall = () => {
    setInCall(false);
    toast.success("Arama sonlandırıldı");
  };

  const handleSend = async () => {
    if (!messageText.trim() && !selectedMedia) return;

    try {
      setIsUploading(true);
      let imageId: Id<"_storage"> | undefined = undefined;

      // Upload media if selected
      if (selectedMedia) {
        const uploadUrl = await generateUploadUrl();
        const result = await fetch(uploadUrl, {
          method: "POST",
          headers: { "Content-Type": selectedMedia.type },
          body: selectedMedia,
        });

        if (!result.ok) {
          throw new Error("Medya yüklenemedi");
        }

        const { storageId } = await result.json();
        imageId = storageId;
      }

      // Send message
      const defaultContent = mediaType === "video" ? "🎥 Video" : "📷 Resim";
      await sendMessage({
        conversationId,
        content: messageText.trim() || defaultContent,
        imageId,
        mediaType: mediaType || undefined,
        isAnonymous,
      });

      setMessageText("");
      setIsAnonymous(false);
      handleRemoveMedia();
    } catch (error) {
      console.error("Send message error:", error);
      toast.error("Mesaj gönderilemedi");
    } finally {
      setIsUploading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSendGift = async (giftId: Id<"gifts">, quantity: number) => {
    if (!currentConversation?.otherUser._id) {
      toast.error("Alıcı bulunamadı");
      return;
    }

    try {
      const result = await sendGiftWithTokens({
        recipientId: currentConversation.otherUser._id,
        giftId,
        conversationId,
        quantity,
      });
      
      // Show level up animation if leveled up
      if (result.leveledUp) {
        setLevelUpInfo({ show: true, newLevel: result.newLevel });
      } else {
        toast.success("Hediye gönderildi!");
      }
      
      setGiftDialogOpen(false);
    } catch (error) {
      console.error("Send gift error:", error);
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error("Hediye gönderilemedi");
      }
    }
  };

  const categories = [
    { id: "all", name: "Tümü" },
    { id: "team", name: "Takımlar" },
    { id: "animated", name: "Animasyonlu" },
    { id: "premium", name: "Premium" },
  ];

  const filteredGifts = gifts?.filter((gift) => {
    if (selectedCategory === "all") return true;
    return gift.category === selectedCategory;
  }) || [];

  if (messages === undefined) {
    return (
      <div className="flex-1 flex flex-col">
        <div className="border-b p-4 flex items-center gap-3">
          <Skeleton className="h-10 w-10 rounded-full" />
          <Skeleton className="h-4 w-32" />
        </div>
        <div className="flex-1 p-4 space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className={`flex ${i % 2 === 0 ? "" : "justify-end"}`}>
              <Skeleton className="h-16 w-64 rounded-2xl" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full">
      {/* Header */}
      <div className="border-b p-4 flex items-center gap-3">
        <Avatar className="h-10 w-10">
          <AvatarImage
            src={currentConversation?.otherUser.profilePictureUrl || undefined}
            alt={currentConversation?.otherUser.username}
          />
          <AvatarFallback className="bg-primary text-primary-foreground">
            {currentConversation?.otherUser.username[0]?.toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <h2 className="font-semibold flex-1">{currentConversation?.otherUser.username}</h2>
        <Button
          size="icon"
          variant="ghost"
          onClick={handleStartCall}
          disabled={!!activeCall || inCall}
        >
          <Video className="h-5 w-5" />
        </Button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message._id}
            className={`flex flex-col ${message.isFromMe ? "items-end" : "items-start"}`}
          >
            {message.isAnonymous && !message.isFromMe && (
              <div className="flex items-center gap-1 mb-1 text-xs text-muted-foreground">
                <GhostIcon className="h-3 w-3" />
                <span>Anonim Kullanıcı</span>
              </div>
            )}
            {message.isAnonymous && message.isFromMe && (
              <div className="flex items-center gap-1 mb-1 text-xs text-muted-foreground">
                <GhostIcon className="h-3 w-3" />
                <span>Anonim gönderildi</span>
              </div>
            )}
            <div
              className={`max-w-[70%] rounded-2xl px-4 py-2 ${
                message.isFromMe
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted"
              }`}
            >
              {message.giftDetails && (
                <div
                  className="cursor-pointer mb-2"
                  onClick={() => {
                    if (message.giftDetails?.isPremium) {
                      setSelectedGift({
                        name: message.giftDetails.name,
                        imageUrl: message.giftDetails.imageUrl,
                        isPremium: message.giftDetails.isPremium,
                        animationType: message.giftDetails.animationType,
                      });
                    }
                  }}
                >
                  <div className="relative">
                    <img
                      src={message.giftDetails.imageUrl}
                      alt={message.giftDetails.name}
                      className="rounded-lg w-32 h-32 object-cover"
                    />
                    {message.giftDetails.isPremium && (
                      <div className="absolute top-2 right-2 bg-yellow-500 text-white text-xs px-2 py-1 rounded-full">
                        💎 Premium
                      </div>
                    )}
                  </div>
                  <p className="text-xs mt-1 font-semibold">
                    🎁 {message.giftDetails.name}
                  </p>
                </div>
              )}
              {message.audioUrl && (
                <div className="flex items-center gap-2 mb-2">
                  <audio src={message.audioUrl} controls className="w-full max-w-xs" />
                  {message.audioDuration && (
                    <span className="text-xs opacity-70 whitespace-nowrap">
                      {Math.floor(message.audioDuration / 60)}:{(message.audioDuration % 60).toString().padStart(2, "0")}
                    </span>
                  )}
                </div>
              )}
              {message.imageUrl && !message.giftDetails && !message.audioUrl && (
                <>
                  {message.mediaType === "video" ? (
                    <video
                      src={message.imageUrl}
                      controls
                      className="rounded-lg mb-2 max-w-full"
                    />
                  ) : (
                    <img
                      src={message.imageUrl}
                      alt="Message attachment"
                      className="rounded-lg mb-2 max-w-full"
                    />
                  )}
                </>
              )}
              {!message.audioUrl && <p className="break-words">{message.content}</p>}
              <p
                className={`text-xs mt-1 ${
                  message.isFromMe
                    ? "text-primary-foreground/70"
                    : "text-muted-foreground"
                }`}
              >
                {formatDistanceToNow(new Date(message.createdAt), {
                  addSuffix: true,
                  locale: tr,
                })}
              </p>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Media Preview */}
      {previewUrl && (
        <div className="px-4 py-2 border-t">
          <div className="relative inline-block">
            {mediaType === "video" ? (
              <video
                src={previewUrl}
                controls
                className="h-20 rounded-lg"
              />
            ) : (
              <img
                src={previewUrl}
                alt="Preview"
                className="h-20 rounded-lg object-cover"
              />
            )}
            <button
              onClick={handleRemoveMedia}
              className="absolute -top-2 -right-2 p-1 rounded-full bg-destructive text-destructive-foreground"
              disabled={isUploading}
            >
              <XIcon className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Anonymous Mode Toggle */}
      {isAnonymous && (
        <div className="px-4 py-2 border-t bg-muted/50">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <GhostIcon className="h-4 w-4" />
            <span>Anonim mod aktif</span>
          </div>
        </div>
      )}

      {/* Input */}
      <div className="border-t p-4 flex items-center gap-2">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,video/*"
          className="hidden"
          onChange={handleMediaSelect}
          disabled={isUploading}
        />
        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*,video/*"
          capture="environment"
          className="hidden"
          onChange={handleMediaSelect}
          disabled={isUploading}
        />
        <Button
          variant="ghost"
          size="icon"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading || !!selectedMedia}
        >
          <ImageIconWrapper className="h-5 w-5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => cameraInputRef.current?.click()}
          disabled={isUploading || !!selectedMedia}
        >
          <CameraIcon className="h-5 w-5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setGiftDialogOpen(true)}
          disabled={isUploading}
          title="Hediye gönder"
        >
          <GiftIcon className="h-5 w-5" />
        </Button>
        <Button
          variant={isAnonymous ? "default" : "ghost"}
          size="icon"
          onClick={() => setIsAnonymous(!isAnonymous)}
          disabled={isUploading}
          title={isAnonymous ? "Anonim modu kapat" : "Anonim mod"}
        >
          <GhostIcon className="h-5 w-5" />
        </Button>
        {!isRecording && !recordedAudio && (
          <Button
            variant="ghost"
            size="icon"
            onClick={startRecording}
            disabled={isUploading}
            title="Sesli mesaj"
          >
            <Mic className="h-5 w-5" />
          </Button>
        )}
        {isRecording && (
          <div className="flex items-center gap-2 px-3 py-1 bg-red-100 dark:bg-red-900 rounded-lg">
            <div className="flex items-center gap-1">
              <div className="h-2 w-2 bg-red-500 rounded-full animate-pulse" />
              <span className="text-sm font-medium">
                {Math.floor(recordingDuration / 60)}:{(recordingDuration % 60).toString().padStart(2, "0")}
              </span>
            </div>
            <Button
              size="sm"
              variant="ghost"
              onClick={cancelRecording}
              className="h-7 px-2"
            >
              İptal
            </Button>
            <Button
              size="sm"
              onClick={stopRecording}
              className="h-7 px-2"
            >
              Durdur
            </Button>
          </div>
        )}
        {recordedAudio && !isRecording && (
          <div className="flex items-center gap-2 px-3 py-1 bg-green-100 dark:bg-green-900 rounded-lg">
            <audio src={URL.createObjectURL(recordedAudio)} controls className="h-8" />
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setRecordedAudio(null)}
              className="h-7 px-2"
            >
              Sil
            </Button>
            <Button
              size="sm"
              onClick={sendVoiceMessage}
              disabled={isUploading}
              className="h-7 px-2"
            >
              {isUploading ? <Spinner /> : "Gönder"}
            </Button>
          </div>
        )}
        {!isRecording && !recordedAudio && (
          <Input
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={isAnonymous ? "Anonim mesaj yaz..." : "Mesaj yaz..."}
            disabled={isUploading}
            className="flex-1"
          />
        )}
        {!isRecording && !recordedAudio && (
          <Button
            onClick={handleSend}
            disabled={(!messageText.trim() && !selectedMedia) || isUploading}
            size="icon"
          >
            {isUploading ? (
              <Spinner className="h-5 w-5" />
            ) : (
              <SendIcon className="h-5 w-5" />
            )}
          </Button>
        )}
      </div>

      {/* Gift Dialog */}
      <Dialog open={giftDialogOpen} onOpenChange={setGiftDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>🎁 Hediye Gönder</span>
              {tokenBalance && (
                <Badge variant="secondary" className="text-base">
                  🎟️ {tokenBalance.tokens} Jeton
                </Badge>
              )}
            </DialogTitle>
          </DialogHeader>

          <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
            <TabsList className="grid w-full grid-cols-4">
              {categories.map((cat) => (
                <TabsTrigger key={cat.id} value={cat.id}>
                  {cat.name}
                </TabsTrigger>
              ))}
            </TabsList>

            <TabsContent value={selectedCategory} className="mt-4">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {filteredGifts.map((gift) => {
                  const tokenValue = tokenSettings?.tokenValue || 1000;
                  const tokensRequired = Math.ceil(gift.price / tokenValue);
                  const canAfford = (tokenBalance?.tokens || 0) >= tokensRequired;

                  return (
                    <button
                      key={gift._id}
                      onClick={() => {
                        if (!canAfford) {
                          toast.error("Yetersiz jeton bakiyesi");
                          setGiftDialogOpen(false);
                          navigate("/settings");
                          return;
                        }
                        handleSendGift(gift._id, 1);
                      }}
                      className={`p-4 rounded-lg border-2 transition-all ${
                        canAfford
                          ? "hover:border-primary hover:shadow-lg cursor-pointer"
                          : "border-red-500/50 hover:border-red-500 cursor-pointer"
                      }`}
                    >
                      <div className="aspect-square mb-2">
                        <img
                          src={gift.imageUrl}
                          alt={gift.name}
                          className="w-full h-full object-cover rounded-lg"
                        />
                      </div>
                      <h3 className="font-semibold text-sm mb-1">{gift.name}</h3>
                      <div className="flex items-center justify-between">
                        <Badge variant={canAfford ? "default" : "destructive"}>
                          🎟️ {tokensRequired}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {(gift.price / 100).toFixed(2)} TL
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>

              {filteredGifts.length === 0 && (
                <div className="text-center py-12 text-muted-foreground">
                  <p>Bu kategoride hediye bulunmuyor</p>
                </div>
              )}
            </TabsContent>
          </Tabs>

          <div className="mt-4 p-4 bg-muted rounded-lg">
            <p className="text-sm text-muted-foreground">
              💡 Jeton bakiyeniz: <strong>{tokenBalance?.tokens || 0}</strong>
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Ayarlar'dan jeton satın alabilirsiniz.
            </p>
          </div>
        </DialogContent>
      </Dialog>

      {/* Premium Gift Animation */}
      {selectedGift && selectedGift.isPremium && (
        <PremiumGiftAnimation
          show={!!selectedGift}
          animationType={selectedGift.animationType as "confetti" | "fireworks" | "hearts" | "stars" | "diamonds" | "coins" | "fire" | "snow"}
          giftName={selectedGift.name}
          giftImageUrl={selectedGift.imageUrl}
          onComplete={() => setSelectedGift(null)}
        />
      )}

      {/* Video Call Screen */}
      {inCall && activeCall && currentConversation && (
        <VideoCallScreen
          callId={activeCall._id}
          isCaller={activeCall.caller._id === currentUser?._id}
          receiverName={currentConversation.otherUser.username}
          receiverAvatar={currentConversation.otherUser.profilePictureUrl}
          onEnd={handleEndCall}
        />
      )}

      {/* Incoming Call Dialog */}
      {showIncomingCall && incomingCalls && incomingCalls.length > 0 && (
        <IncomingCallDialog
          callId={incomingCalls[0]._id}
          callerName={incomingCalls[0].caller.name}
          callerAvatar={incomingCalls[0].caller.profilePictureUrl}
          onAccept={handleAcceptCall}
          onReject={handleRejectCall}
        />
      )}

      {/* Level Up Animation */}
      <LevelUpAnimation
        show={levelUpInfo.show}
        newLevel={levelUpInfo.newLevel}
        onComplete={() => {
          setLevelUpInfo({ show: false, newLevel: 0 });
          toast.success(`Level ${levelUpInfo.newLevel}'e yükseldiniz! 🎉`);
        }}
      />
    </div>
  );
}
