import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog.tsx";
import { Input } from "@/components/ui/input.tsx";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar.tsx";
import { useDebounce } from "@/hooks/use-debounce.ts";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import { Search } from "lucide-react";
import type { Id } from "@/convex/_generated/dataModel.d.ts";
import { toast } from "sonner";

interface NewMessageDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConversationCreated: (conversationId: Id<"conversations">) => void;
}

export default function NewMessageDialog({
  open,
  onOpenChange,
  onConversationCreated,
}: NewMessageDialogProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm] = useDebounce(searchTerm, 300);

  const searchResults = useQuery(
    api.messages.searchUsers,
    debouncedSearchTerm ? { searchTerm: debouncedSearchTerm } : "skip",
  );

  const getOrCreateConversation = useMutation(
    api.messages.getOrCreateConversation,
  );

  const handleUserClick = async (userId: Id<"users">) => {
    try {
      const conversationId = await getOrCreateConversation({
        otherUserId: userId,
      });
      onConversationCreated(conversationId);
      onOpenChange(false);
      setSearchTerm("");
    } catch (error) {
      console.error("Error creating conversation:", error);
      toast.error("Sohbet başlatılamadı");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Yeni Mesaj</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Kullanıcı ara..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>

          <div className="max-h-[300px] overflow-y-auto space-y-2">
            {!debouncedSearchTerm && (
              <p className="text-center text-sm text-muted-foreground py-8">
                Kullanıcı aramak için yazmaya başlayın
              </p>
            )}

            {debouncedSearchTerm && searchResults === undefined && (
              <>
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-3 p-2">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <Skeleton className="h-4 w-32" />
                  </div>
                ))}
              </>
            )}

            {debouncedSearchTerm &&
              searchResults !== undefined &&
              searchResults.length === 0 && (
                <p className="text-center text-sm text-muted-foreground py-8">
                  Kullanıcı bulunamadı
                </p>
              )}

            {searchResults?.map((user) => (
              <button
                key={user._id}
                onClick={() => handleUserClick(user._id)}
                className="w-full flex items-center gap-3 p-2 hover:bg-muted rounded-lg transition-colors"
              >
                <Avatar className="h-10 w-10">
                  <AvatarImage
                    src={user.profilePictureUrl || undefined}
                    alt={user.username}
                  />
                  <AvatarFallback className="bg-primary text-primary-foreground">
                    {user.username[0]?.toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="text-left">
                  <p className="font-medium text-sm">{user.username}</p>
                  {user.name && (
                    <p className="text-xs text-muted-foreground">{user.name}</p>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
