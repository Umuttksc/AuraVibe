import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Input } from "@/components/ui/input.tsx";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar.tsx";
import { Badge } from "@/components/ui/badge.tsx";
import { usePaginatedQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import { Search, Shield, UserX, UserCog } from "lucide-react";
import type { Id } from "@/convex/_generated/dataModel.d.ts";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu.tsx";
import { MoreVertical } from "lucide-react";
import { Link } from "react-router-dom";

interface MembersDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  communityId: Id<"communities">;
  isAdmin: boolean;
  creatorId: Id<"users">;
}

function SearchIcon({ className }: { className?: string }) {
  return <Search className={className} />;
}

function ShieldIcon({ className }: { className?: string }) {
  return <Shield className={className} />;
}

function UserXIcon({ className }: { className?: string }) {
  return <UserX className={className} />;
}

function UserCogIcon({ className }: { className?: string }) {
  return <UserCog className={className} />;
}

function MoreVerticalIcon({ className }: { className?: string }) {
  return <MoreVertical className={className} />;
}

export default function MembersDialog({
  open,
  onOpenChange,
  communityId,
  isAdmin,
  creatorId,
}: MembersDialogProps) {
  const [searchQuery, setSearchQuery] = useState("");

  const { results: members, status, loadMore } = usePaginatedQuery(
    api.communities.getCommunityMembers,
    open ? { communityId } : "skip",
    { initialNumItems: 20 }
  );

  const removeMember = useMutation(api.communities.removeMember);
  const promoteMember = useMutation(api.communities.promoteMember);
  const demoteMember = useMutation(api.communities.demoteMember);

  const handleRemoveMember = async (userId: Id<"users">, userName?: string) => {
    if (!confirm(`${userName || "Bu kullanıcı"}yı gruptan çıkarmak istediğinizden emin misiniz?`)) {
      return;
    }

    try {
      await removeMember({ communityId, userId });
      toast.success("Üye gruptan çıkarıldı");
    } catch (error) {
      if (error instanceof Error) {
        toast.error(error.message);
      }
    }
  };

  const handlePromoteMember = async (userId: Id<"users">, userName?: string) => {
    try {
      await promoteMember({ communityId, userId });
      toast.success(`${userName || "Kullanıcı"} admin yapıldı`);
    } catch (error) {
      if (error instanceof Error) {
        toast.error(error.message);
      }
    }
  };

  const handleDemoteMember = async (userId: Id<"users">, userName?: string) => {
    try {
      await demoteMember({ communityId, userId });
      toast.success(`${userName || "Kullanıcı"} adminlikten çıkarıldı`);
    } catch (error) {
      if (error instanceof Error) {
        toast.error(error.message);
      }
    }
  };

  const filteredMembers = members?.filter(
    (member) =>
      !searchQuery ||
      member.user?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.user?.username?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Grup Üyeleri</DialogTitle>
        </DialogHeader>

        {/* Search */}
        <div className="relative">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Üye ara..."
            className="pl-10"
          />
        </div>

        {/* Members List */}
        <div className="flex-1 overflow-y-auto space-y-2">
          {status === "LoadingFirstPage" && (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          )}

          {filteredMembers && filteredMembers.length === 0 && (
            <p className="text-center text-muted-foreground py-8">
              {searchQuery ? "Üye bulunamadı" : "Henüz üye yok"}
            </p>
          )}

          {filteredMembers && filteredMembers.length > 0 && (
            <>
              {filteredMembers.map((member) => (
                <div
                  key={member._id}
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-accent"
                >
                  <Link to={`/profile?userId=${member.userId}`} onClick={() => onOpenChange(false)}>
                    <Avatar className="h-10 w-10 cursor-pointer hover:opacity-80">
                      <AvatarImage
                        src={
                          member.user?.profilePicture
                            ? `${import.meta.env.VITE_CONVEX_URL}/api/storage/${member.user.profilePicture}`
                            : undefined
                        }
                      />
                      <AvatarFallback>
                        {member.user?.name?.[0] || "U"}
                      </AvatarFallback>
                    </Avatar>
                  </Link>
                  <div className="flex-1 min-w-0">
                    <Link to={`/profile?userId=${member.userId}`} onClick={() => onOpenChange(false)}>
                      <p className="font-medium truncate cursor-pointer hover:underline">
                        {member.user?.name || "Kullanıcı"}
                      </p>
                    </Link>
                    {member.user?.username && (
                      <p className="text-sm text-muted-foreground truncate">
                        @{member.user.username}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {member.userId === creatorId && (
                      <Badge variant="default" className="flex items-center gap-1">
                        <ShieldIcon className="h-3 w-3" />
                        Kurucu
                      </Badge>
                    )}
                    {member.role === "admin" && member.userId !== creatorId && (
                      <Badge variant="secondary" className="flex items-center gap-1">
                        <ShieldIcon className="h-3 w-3" />
                        Admin
                      </Badge>
                    )}
                    {isAdmin && member.userId !== creatorId && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVerticalIcon className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {member.role === "member" ? (
                            <DropdownMenuItem
                              onClick={() =>
                                handlePromoteMember(member.userId, member.user?.name)
                              }
                            >
                              <UserCogIcon className="h-4 w-4 mr-2" />
                              Admin Yap
                            </DropdownMenuItem>
                          ) : (
                            <DropdownMenuItem
                              onClick={() =>
                                handleDemoteMember(member.userId, member.user?.name)
                              }
                            >
                              <UserCogIcon className="h-4 w-4 mr-2" />
                              Adminlikten Çıkar
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem
                            onClick={() =>
                              handleRemoveMember(member.userId, member.user?.name)
                            }
                            className="text-destructive"
                          >
                            <UserXIcon className="h-4 w-4 mr-2" />
                            Gruptan Çıkar
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>
                </div>
              ))}

              {status === "CanLoadMore" && (
                <div className="flex justify-center py-2">
                  <Button
                    onClick={() => loadMore(20)}
                    variant="ghost"
                    size="sm"
                  >
                    Daha fazla yükle
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
