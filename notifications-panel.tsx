import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import type { Id } from "@/convex/_generated/dataModel.d.ts";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import { Heart, MessageCircle, UserPlus, AtSign, Coins, Gamepad2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { tr } from "date-fns/locale";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet.tsx";
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription } from "@/components/ui/empty.tsx";
import { Bell } from "lucide-react";

type Notification = {
  _id: string;
  type: "like" | "comment" | "follow" | "follow_request" | "mention" | "token_grant" | "game_invite";
  actor: {
    _id: Id<"users">;
    username: string;
    profilePictureUrl: string | null;
  };
  post?: {
    _id: Id<"posts">;
    content: string;
    imageUrl: string | null;
  } | null;
  comment?: {
    _id: Id<"comments">;
    content: string;
  } | null;
  followRequestId?: Id<"followRequests">;
  message?: string; // Custom message for token grants
  isRead: boolean;
  createdAt: string;
};

interface NotificationsPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function NotificationsPanel({
  open,
  onOpenChange,
}: NotificationsPanelProps) {
  const notifications = useQuery(api.notifications.getNotifications, {});
  const markAsRead = useMutation(api.notifications.markAsRead);
  const markAllAsRead = useMutation(api.notifications.markAllAsRead);

  const handleNotificationClick = async (notificationId: string) => {
    await markAsRead({ notificationId: notificationId as Id<"notifications"> });
  };

  const NotificationIcon = ({ type }: { type: string }) => {
    switch (type) {
      case "like":
        return <Heart className="h-5 w-5 text-red-500" />;
      case "comment":
        return <MessageCircle className="h-5 w-5 text-blue-500" />;
      case "follow":
        return <UserPlus className="h-5 w-5 text-green-500" />;
      case "follow_request":
        return <UserPlus className="h-5 w-5 text-orange-500" />;
      case "mention":
        return <AtSign className="h-5 w-5 text-purple-500" />;
      case "token_grant":
        return <Coins className="h-5 w-5 text-amber-500" />;
      case "game_invite":
        return <Gamepad2 className="h-5 w-5 text-purple-500" />;
      default:
        return <Bell className="h-5 w-5" />;
    }
  };

  const getNotificationText = (notification: Notification) => {
    switch (notification.type) {
      case "like":
        return "gönderinizi beğendi";
      case "comment":
        return "gönderinize yorum yaptı";
      case "follow":
        return "sizi takip etmeye başladı";
      case "follow_request":
        return "size takip isteği gönderdi";
      case "mention":
        return "sizi bir gönderide bahsetti";
      case "token_grant":
        return notification.message || "Jeton yüklendi";
      case "game_invite":
        return "sizi XOX oyununa davet etti";
      default:
        return "etkileşimde bulundu";
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-md">
        <SheetHeader>
          <div className="flex items-center justify-between">
            <SheetTitle>Bildirimler</SheetTitle>
            {notifications && notifications.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => markAllAsRead()}
              >
                Tümünü okundu işaretle
              </Button>
            )}
          </div>
        </SheetHeader>

        <div className="mt-6 space-y-1">
          {notifications === undefined && (
            <>
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-start gap-3 p-3">
                  <Skeleton className="h-10 w-10 rounded-full flex-shrink-0" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-3 w-20" />
                  </div>
                </div>
              ))}
            </>
          )}

          {notifications && notifications.length === 0 && (
            <div className="flex items-center justify-center h-[400px]">
              <Empty>
                <EmptyHeader>
                  <EmptyMedia variant="icon">
                    <Bell />
                  </EmptyMedia>
                  <EmptyTitle>Henüz bildirim yok</EmptyTitle>
                  <EmptyDescription>
                    Yeni etkileşimleriniz burada görünecek
                  </EmptyDescription>
                </EmptyHeader>
              </Empty>
            </div>
          )}

          {notifications?.map((notification) => (
            <button
              key={notification._id}
              onClick={() => handleNotificationClick(notification._id)}
              className={`w-full flex items-start gap-3 p-3 hover:bg-muted rounded-lg transition-colors text-left ${
                !notification.isRead ? "bg-muted/50" : ""
              }`}
            >
              <div className="relative">
                <Avatar className="h-10 w-10 flex-shrink-0">
                  <AvatarImage
                    src={notification.actor.profilePictureUrl || undefined}
                    alt={notification.actor.username}
                  />
                  <AvatarFallback className="bg-primary text-primary-foreground">
                    {notification.actor.username[0]?.toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="absolute -bottom-1 -right-1 bg-background rounded-full p-0.5">
                  <NotificationIcon type={notification.type} />
                </div>
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-sm">
                  {notification.type === "token_grant" ? (
                    <span className="font-semibold">
                      {getNotificationText(notification)}
                    </span>
                  ) : (
                    <>
                      <span className="font-semibold">
                        {notification.actor.username}
                      </span>{" "}
                      {getNotificationText(notification)}
                    </>
                  )}
                </p>

                {notification.post && notification.type === "like" && (
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                    {notification.post.content}
                  </p>
                )}

                {notification.comment && (
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                    "{notification.comment.content}"
                  </p>
                )}

                <p className="text-xs text-muted-foreground mt-1">
                  {formatDistanceToNow(new Date(notification.createdAt), {
                    addSuffix: true,
                    locale: tr,
                  })}
                </p>
              </div>

              {notification.post?.imageUrl && (
                <div className="flex-shrink-0">
                  <img
                    src={notification.post.imageUrl}
                    alt="Post"
                    className="h-12 w-12 rounded object-cover"
                  />
                </div>
              )}
            </button>
          ))}
        </div>
      </SheetContent>
    </Sheet>
  );
}
