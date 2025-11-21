import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar.tsx";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import { Badge } from "@/components/ui/badge.tsx";
import { formatDistanceToNow } from "date-fns";
import { tr } from "date-fns/locale";
import type { Id } from "@/convex/_generated/dataModel.d.ts";
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription } from "@/components/ui/empty.tsx";
import { MessageSquare } from "lucide-react";

interface ConversationListProps {
  selectedConversationId: Id<"conversations"> | null;
  onConversationSelect: (conversationId: Id<"conversations">) => void;
}

export default function ConversationList({
  selectedConversationId,
  onConversationSelect,
}: ConversationListProps) {
  const conversations = useQuery(api.messages.getConversations, {});

  if (conversations === undefined) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 p-3">
            <Skeleton className="h-12 w-12 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-48" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (conversations.length === 0) {
    return (
      <div className="flex items-center justify-center h-full p-8">
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <MessageSquare />
            </EmptyMedia>
            <EmptyTitle>Henüz mesaj yok</EmptyTitle>
            <EmptyDescription>
              Yeni bir sohbet başlatmak için yukarıdaki arama butonunu kullanın
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {conversations.map((conversation) => (
        <button
          key={conversation._id}
          onClick={() => onConversationSelect(conversation._id)}
          className={`w-full flex items-center gap-3 p-3 hover:bg-muted transition-colors ${
            selectedConversationId === conversation._id ? "bg-muted" : ""
          }`}
        >
          <Avatar className="h-12 w-12 flex-shrink-0">
            <AvatarImage
              src={conversation.otherUser.profilePictureUrl || undefined}
              alt={conversation.otherUser.username}
            />
            <AvatarFallback className="bg-primary text-primary-foreground">
              {conversation.otherUser.username[0]?.toUpperCase()}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 min-w-0 text-left">
            <div className="flex items-center justify-between gap-2 mb-1">
              <span className="font-medium text-sm truncate">
                {conversation.otherUser.username}
              </span>
              {conversation.lastMessageAt && (
                <span className="text-xs text-muted-foreground flex-shrink-0">
                  {formatDistanceToNow(new Date(conversation.lastMessageAt), {
                    addSuffix: true,
                    locale: tr,
                  })}
                </span>
              )}
            </div>

            <div className="flex items-center justify-between gap-2">
              <p className="text-sm text-muted-foreground truncate">
                {conversation.isLastMessageFromMe && "Sen: "}
                {conversation.lastMessage || "Henüz mesaj yok"}
              </p>
              {conversation.unreadCount > 0 && (
                <Badge variant="default" className="flex-shrink-0 h-5 min-w-5 px-1.5">
                  {conversation.unreadCount}
                </Badge>
              )}
            </div>
          </div>
        </button>
      ))}
    </div>
  );
}
