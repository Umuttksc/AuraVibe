import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog.tsx";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs.tsx";
import { Badge } from "@/components/ui/badge.tsx";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion.tsx";
import { formatDistanceToNow } from "date-fns";
import { tr } from "date-fns/locale";
import type { Id } from "@/convex/_generated/dataModel.d.ts";

interface UserDetailsDialogProps {
  userId: Id<"users"> | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface Message {
  _id: Id<"messages">;
  _creationTime: number;
  content: string;
  conversationWith: string;
  isSentByUser: boolean;
}

function MessagesByPartner({ messages }: { messages: Message[] }) {
  const messagesByPartner = messages.reduce((acc, message) => {
    const partner = message.conversationWith;
    if (!acc[partner]) {
      acc[partner] = [];
    }
    acc[partner].push(message);
    return acc;
  }, {} as Record<string, Message[]>);

  return (
    <Accordion type="single" collapsible className="w-full">
      {Object.entries(messagesByPartner).map(([partner, partnerMessages]) => (
        <AccordionItem key={partner} value={partner}>
          <AccordionTrigger className="hover:no-underline">
            <div className="flex items-center gap-3">
              <div className="font-medium">{partner}</div>
              <Badge variant="secondary">{partnerMessages.length} mesaj</Badge>
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <div className="space-y-2 pt-2">
              {partnerMessages.map((message) => (
                <div
                  key={message._id}
                  className={`p-3 rounded-lg border ${
                    message.isSentByUser
                      ? "bg-primary/5 border-primary/20 ml-8"
                      : "bg-muted mr-8"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium">
                      {message.isSentByUser ? "Gönderdi" : "Aldı"}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(message._creationTime), {
                        addSuffix: true,
                        locale: tr,
                      })}
                    </span>
                  </div>
                  <p className="text-sm">{message.content}</p>
                </div>
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}

export default function UserDetailsDialog({
  userId,
  open,
  onOpenChange,
}: UserDetailsDialogProps) {
  const userDetails = useQuery(
    api.admin.getUserDetails,
    userId ? { userId } : "skip"
  );

  if (!userId) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Kullanıcı Detayları</DialogTitle>
        </DialogHeader>

        {userDetails === undefined ? (
          <Skeleton className="h-96 w-full" />
        ) : (
          <Tabs defaultValue="info" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="info">Bilgiler</TabsTrigger>
              <TabsTrigger value="messages">
                Mesajlar ({userDetails.messages.length})
              </TabsTrigger>
              <TabsTrigger value="posts">
                Gönderiler ({userDetails.posts.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="info" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    İsim
                  </label>
                  <p className="text-sm">
                    {userDetails.user.name || "Belirtilmemiş"}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Kullanıcı Adı
                  </label>
                  <p className="text-sm">
                    @{userDetails.user.username || "belirtilmemiş"}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Email
                  </label>
                  <p className="text-sm">
                    {userDetails.user.email || "Belirtilmemiş"}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Rol
                  </label>
                  <div className="mt-1">
                    {userDetails.user.isSuperAdmin ? (
                      <Badge variant="default" className="bg-purple-600">
                        Baş Admin
                      </Badge>
                    ) : userDetails.user.role === "admin" ? (
                      <Badge variant="default">Admin</Badge>
                    ) : (
                      <Badge variant="secondary">Kullanıcı</Badge>
                    )}
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Biyografi
                  </label>
                  <p className="text-sm">
                    {userDetails.user.bio || "Belirtilmemiş"}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Konum
                  </label>
                  <p className="text-sm">
                    {userDetails.user.location || "Belirtilmemiş"}
                  </p>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="messages" className="space-y-4">
              {userDetails.messages.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  Mesaj bulunamadı
                </p>
              ) : (
                <MessagesByPartner messages={userDetails.messages} />
              )}
            </TabsContent>

            <TabsContent value="posts" className="space-y-4">
              {userDetails.posts.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  Gönderi bulunamadı
                </p>
              ) : (
                <div className="space-y-3">
                  {userDetails.posts.map((post) => (
                    <div key={post._id} className="p-4 rounded-lg border">
                      <p className="text-sm mb-2">{post.content}</p>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span>{post.likeCount} beğeni</span>
                        <span>{post.commentCount} yorum</span>
                        <span>
                          {formatDistanceToNow(new Date(post._creationTime), {
                            addSuffix: true,
                            locale: tr,
                          })}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        )}
      </DialogContent>
    </Dialog>
  );
}
