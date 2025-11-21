import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Badge } from "@/components/ui/badge.tsx";
import { Input } from "@/components/ui/input.tsx";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import { Search, X, Download, Copy } from "lucide-react";
import { toast } from "sonner";
import type { Id } from "@/convex/_generated/dataModel.d.ts";
import { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { tr } from "date-fns/locale";

export default function DataExport() {
  const [searchUsername, setSearchUsername] = useState("");
  const [selectedUserIds, setSelectedUserIds] = useState<Id<"users">[]>([]);
  
  const searchResults = useQuery(
    api.users.searchUsers,
    searchUsername.trim() ? { searchQuery: searchUsername } : "skip"
  );
  
  const usersData = useQuery(
    api.admin.getUsersDataExport,
    selectedUserIds.length > 0 ? { userIds: selectedUserIds } : "skip"
  );

  const addUser = (userId: Id<"users">) => {
    if (!selectedUserIds.includes(userId)) {
      setSelectedUserIds([...selectedUserIds, userId]);
      setSearchUsername("");
    }
  };

  const removeUser = (userId: Id<"users">) => {
    setSelectedUserIds(selectedUserIds.filter((id) => id !== userId));
  };

  const copyToClipboard = () => {
    if (!usersData || usersData.length === 0) {
      toast.error("Kopyalanacak veri yok");
      return;
    }

    const text = usersData
      .map((user) => {
        return `
Kullanıcı Adı: ${user.username || "Yok"}
İsim: ${user.name || "Yok"}
Email: ${user.email || "Yok"}
Rol: ${user.isSuperAdmin ? "Baş Admin" : user.role === "admin" ? "Admin" : "Kullanıcı"}
Şehir: ${user.city || "Yok"}
Ülke: ${user.country || "Yok"}
Konum: ${user.location || "Yok"}
Biyografi: ${user.bio || "Yok"}
Durum: ${user.isBlocked ? "Engelli" : "Aktif"}
Toplam Gönderi: ${user.postsCount}
Takipçi: ${user.followersCount}
Takip Edilen: ${user.followingCount}
Toplam Mesaj: ${user.totalMessages}
Konuşma Sayısı: ${user.conversationsCount}
Kayıt Tarihi: ${new Date(user.createdAt).toLocaleDateString("tr-TR")}
Son Aktivite: ${user.lastActivity ? formatDistanceToNow(new Date(user.lastActivity), { addSuffix: true, locale: tr }) : "Bilinmiyor"}
-------------------`;
      })
      .join("\n");

    navigator.clipboard.writeText(text);
    toast.success("Veriler panoya kopyalandı");
  };

  const downloadAsText = () => {
    if (!usersData || usersData.length === 0) {
      toast.error("İndirilecek veri yok");
      return;
    }

    const text = usersData
      .map((user) => {
        return `Kullanıcı Adı: ${user.username || "Yok"}
İsim: ${user.name || "Yok"}
Email: ${user.email || "Yok"}
Rol: ${user.isSuperAdmin ? "Baş Admin" : user.role === "admin" ? "Admin" : "Kullanıcı"}
Şehir: ${user.city || "Yok"}
Ülke: ${user.country || "Yok"}
Konum: ${user.location || "Yok"}
Biyografi: ${user.bio || "Yok"}
Durum: ${user.isBlocked ? "Engelli" : "Aktif"}
Toplam Gönderi: ${user.postsCount}
Takipçi: ${user.followersCount}
Takip Edilen: ${user.followingCount}
Toplam Mesaj: ${user.totalMessages}
Konuşma Sayısı: ${user.conversationsCount}
Kayıt Tarihi: ${new Date(user.createdAt).toLocaleDateString("tr-TR")}
Son Aktivite: ${user.lastActivity ? formatDistanceToNow(new Date(user.lastActivity), { addSuffix: true, locale: tr }) : "Bilinmiyor"}
-------------------`;
      })
      .join("\n\n");

    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `kullanici-verileri-${new Date().toISOString().split("T")[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success("Dosya indirildi");
  };

  return (
    <div className="space-y-6">
      {/* Search and Select Users */}
      <Card>
        <CardHeader>
          <CardTitle>Kullanıcı Seç</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Kullanıcı adı veya isim ara..."
                value={searchUsername}
                onChange={(e) => setSearchUsername(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          {/* Search Results */}
          {searchUsername.trim() && (
            <div className="mt-4">
              {searchResults === undefined ? (
                <Skeleton className="h-20 w-full" />
              ) : searchResults && searchResults.length > 0 ? (
                <div className="space-y-2">
                  {searchResults.slice(0, 5).map((user) => (
                    <div
                      key={user._id}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div className="flex-1">
                        <div className="font-medium">{user.name || "İsimsiz"}</div>
                        <div className="text-sm text-muted-foreground">
                          @{user.username || "kullanici"}
                        </div>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => addUser(user._id)}
                        disabled={selectedUserIds.includes(user._id)}
                      >
                        {selectedUserIds.includes(user._id) ? "Eklendi" : "Ekle"}
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center text-muted-foreground py-4">
                  Kullanıcı bulunamadı
                </div>
              )}
            </div>
          )}

          {/* Selected Users */}
          {selectedUserIds.length > 0 && (
            <div className="pt-4 border-t">
              <div className="text-sm font-medium mb-2">
                Seçilen Kullanıcılar ({selectedUserIds.length})
              </div>
              <div className="flex flex-wrap gap-2">
                {usersData?.map((user) => (
                  <Badge key={user._id} variant="secondary" className="gap-2">
                    {user.username || user.name || "İsimsiz"}
                    <button
                      onClick={() => removeUser(user._id)}
                      className="hover:text-destructive"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Data Display */}
      {selectedUserIds.length > 0 && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Kullanıcı Verileri</CardTitle>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={copyToClipboard}>
                <Copy className="mr-2 h-4 w-4" />
                Kopyala
              </Button>
              <Button variant="outline" size="sm" onClick={downloadAsText}>
                <Download className="mr-2 h-4 w-4" />
                İndir
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {usersData === undefined ? (
              <Skeleton className="h-96 w-full" />
            ) : usersData && usersData.length > 0 ? (
              <div className="space-y-6">
                {usersData.map((user) => (
                  <div key={user._id} className="p-4 border rounded-lg space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold text-lg">
                          {user.name || "İsimsiz"}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          @{user.username || "kullanici"}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        {user.isSuperAdmin ? (
                          <Badge className="bg-purple-600">Baş Admin</Badge>
                        ) : user.role === "admin" ? (
                          <Badge>Admin</Badge>
                        ) : (
                          <Badge variant="secondary">Kullanıcı</Badge>
                        )}
                        {user.isBlocked ? (
                          <Badge variant="destructive">Engelli</Badge>
                        ) : (
                          <Badge variant="outline" className="text-green-600 border-green-600">
                            Aktif
                          </Badge>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                      <div>
                        <div className="text-muted-foreground">Email</div>
                        <div className="font-medium">{user.email || "Yok"}</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Şehir</div>
                        <div className="font-medium">{user.city || "Yok"}</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Ülke</div>
                        <div className="font-medium">{user.country || "Yok"}</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Konum</div>
                        <div className="font-medium">{user.location || "Yok"}</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Gönderi</div>
                        <div className="font-medium">{user.postsCount}</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Takipçi</div>
                        <div className="font-medium">{user.followersCount}</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Takip</div>
                        <div className="font-medium">{user.followingCount}</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Mesaj</div>
                        <div className="font-medium">{user.totalMessages}</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Konuşma</div>
                        <div className="font-medium">{user.conversationsCount}</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Kayıt Tarihi</div>
                        <div className="font-medium">
                          {new Date(user.createdAt).toLocaleDateString("tr-TR")}
                        </div>
                      </div>
                      <div className="col-span-2">
                        <div className="text-muted-foreground">Son Aktivite</div>
                        <div className="font-medium">
                          {user.lastActivity
                            ? formatDistanceToNow(new Date(user.lastActivity), {
                                addSuffix: true,
                                locale: tr,
                              })
                            : "Bilinmiyor"}
                        </div>
                      </div>
                    </div>

                    {user.bio && (
                      <div>
                        <div className="text-muted-foreground text-sm">Biyografi</div>
                        <p className="text-sm mt-1">{user.bio}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center text-muted-foreground py-8">
                Veri yüklenemedi
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
