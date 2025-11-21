import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Badge } from "@/components/ui/badge.tsx";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import { Input } from "@/components/ui/input.tsx";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table.tsx";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu.tsx";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog.tsx";
import { Label } from "@/components/ui/label.tsx";
import { Textarea } from "@/components/ui/textarea.tsx";
import { Switch } from "@/components/ui/switch.tsx";
import { MoreVertical, Shield, Ban, Trash2, Eye, Search, BadgeCheck, Coins, TrendingUp, Settings } from "lucide-react";
import { toast } from "sonner";
import type { Id } from "@/convex/_generated/dataModel.d.ts";
import { useState } from "react";
import UserDetailsDialog from "./user-details-dialog.tsx";

export default function UsersManagement() {
  const users = useQuery(api.admin.getUsers, { limit: 50 });
  const isSuperAdmin = useQuery(api.admin.isSuperAdmin);
  const updateUserRole = useMutation(api.admin.updateUserRole);
  const toggleBlockUser = useMutation(api.admin.toggleBlockUser);
  const toggleVerifyUser = useMutation(api.admin.toggleVerifyUser);
  const deleteUser = useMutation(api.admin.deleteUser);
  const grantTokensToUser = useMutation(api.tokens.grantTokensToUser);
  const setUserGiftLevel = useMutation(api.admin.setUserGiftLevel);
  const updateAdminPermissions = useMutation(api.admin.updateAdminPermissions);
  const [selectedUserId, setSelectedUserId] = useState<Id<"users"> | null>(null);
  const selectedUserTokenBalance = useQuery(
    api.tokens.getTokenBalance,
    selectedUserId ? { userId: selectedUserId } : "skip"
  );
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [tokenDialogOpen, setTokenDialogOpen] = useState(false);
  const [tokenAmount, setTokenAmount] = useState("");
  const [tokenReason, setTokenReason] = useState("");
  const [levelDialogOpen, setLevelDialogOpen] = useState(false);
  const [levelAmount, setLevelAmount] = useState("");
  const [permissionsDialogOpen, setPermissionsDialogOpen] = useState(false);
  const [permissions, setPermissions] = useState({
    canManageUsers: true,
    canGrantTokens: true,
    canManageReports: true,
    canManageContent: true,
  });
  const [searchUsername, setSearchUsername] = useState("");
  const searchResults = useQuery(
    api.users.searchUsers, 
    searchUsername.trim() ? { searchQuery: searchUsername } : "skip"
  );

  const handleRoleChange = async (userId: Id<"users">, newRole: "admin" | "user") => {
    try {
      await updateUserRole({ userId, role: newRole });
      toast.success("Kullanıcı rolü güncellendi");
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Rol güncellenirken hata oluştu";
      toast.error(errorMessage);
      console.error("Role update error:", error);
    }
  };

  const handleToggleBlock = async (userId: Id<"users">) => {
    try {
      await toggleBlockUser({ userId });
      toast.success("Kullanıcı durumu güncellendi");
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "İşlem başarısız oldu";
      toast.error(errorMessage);
      console.error("Toggle block error:", error);
    }
  };

  const handleToggleVerify = async (userId: Id<"users">) => {
    try {
      await toggleVerifyUser({ userId });
      toast.success("Doğrulama durumu güncellendi");
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "İşlem başarısız oldu";
      toast.error(errorMessage);
      console.error("Toggle verify error:", error);
    }
  };

  const handleDelete = async (userId: Id<"users">) => {
    if (!confirm("Bu kullanıcıyı silmek istediğinizden emin misiniz?")) {
      return;
    }
    try {
      await deleteUser({ userId });
      toast.success("Kullanıcı silindi");
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Kullanıcı silinirken hata oluştu";
      toast.error(errorMessage);
      console.error("Delete user error:", error);
    }
  };

  const handleGrantTokens = async () => {
    if (!selectedUserId) return;
    const amount = parseInt(tokenAmount);
    
    if (isNaN(amount) || amount <= 0) {
      toast.error("Geçerli bir jeton miktarı girin");
      return;
    }

    try {
      const result = await grantTokensToUser({
        userId: selectedUserId,
        amount,
        reason: tokenReason || undefined,
      });
      toast.success(`${amount} jeton başarıyla eklendi! Yeni bakiye: ${result.newBalance}`);
      setTokenDialogOpen(false);
      setTokenAmount("");
      setTokenReason("");
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Jeton yüklenirken hata oluştu";
      toast.error(errorMessage);
      console.error("Grant tokens error:", error);
    }
  };

  const handleSetLevel = async () => {
    if (!selectedUserId) return;
    const level = parseInt(levelAmount);
    
    if (isNaN(level) || level < 0 || level > 100) {
      toast.error("Geçerli bir seviye girin (0-100)");
      return;
    }

    try {
      const result = await setUserGiftLevel({
        userId: selectedUserId,
        level,
      });
      toast.success(`Seviye ${result.newLevel} olarak ayarlandı!${result.autoVerified ? " Kullanıcı otomatik doğrulandı." : ""}`);
      setLevelDialogOpen(false);
      setLevelAmount("");
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Seviye ayarlanırken hata oluştu";
      toast.error(errorMessage);
      console.error("Set level error:", error);
    }
  };

  const handleUpdatePermissions = async () => {
    if (!selectedUserId) return;

    try {
      await updateAdminPermissions({
        userId: selectedUserId,
        permissions,
      });
      toast.success("Admin yetkileri güncellendi");
      setPermissionsDialogOpen(false);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Yetkiler güncellenirken hata oluştu";
      toast.error(errorMessage);
      console.error("Update permissions error:", error);
    }
  };

  const openPermissionsDialog = (userId: Id<"users">, currentPermissions?: typeof permissions) => {
    setSelectedUserId(userId);
    setPermissions(currentPermissions || {
      canManageUsers: true,
      canGrantTokens: true,
      canManageReports: true,
      canManageContent: true,
    });
    setPermissionsDialogOpen(true);
  };

  if (users === undefined) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Kullanıcı Yönetimi</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-96 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!users) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Kullanıcı Yönetimi</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground py-8">
            Kullanıcı verileri yüklenemedi
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      {/* Search Section */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Kullanıcı Adıyla Admin Yetkisi Ver</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Kullanıcı adı girin..."
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
                      <div className="flex items-center gap-2">
                        {user.isSuperAdmin ? (
                          <Badge variant="default" className="bg-purple-600">
                            Baş Admin
                          </Badge>
                        ) : user.role === "admin" ? (
                          <>
                            <Badge variant="default">Admin</Badge>
                            {isSuperAdmin && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleRoleChange(user._id, "user")}
                              >
                                Yetkiyi Kaldır
                              </Button>
                            )}
                          </>
                        ) : (
                          <>
                            <Badge variant="secondary">Kullanıcı</Badge>
                            {isSuperAdmin && (
                              <Button
                                size="sm"
                                onClick={() => handleRoleChange(user._id, "admin")}
                              >
                                <Shield className="mr-2 h-4 w-4" />
                                Admin Yap
                              </Button>
                            )}
                          </>
                        )}
                      </div>
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
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle>Tüm Kullanıcılar</CardTitle>
        </CardHeader>
        <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Kullanıcı</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Rol</TableHead>
                <TableHead>İstatistikler</TableHead>
                <TableHead>Durum</TableHead>
                <TableHead className="text-right">İşlemler</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground">
                    Kullanıcı bulunamadı
                  </TableCell>
                </TableRow>
              ) : (
                users.map((user) => (
                  <TableRow key={user._id}>
                    <TableCell className="font-medium">
                      <div>
                        <div>{user.name || "İsimsiz"}</div>
                        <div className="text-xs text-muted-foreground">
                          @{user.username || "kullanici"}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {user.email || "-"}
                    </TableCell>
                    <TableCell>
                      {user.isSuperAdmin ? (
                        <Badge variant="default" className="bg-purple-600">
                          Baş Admin
                        </Badge>
                      ) : user.role === "admin" ? (
                        <Badge variant="default">Admin</Badge>
                      ) : (
                        <Badge variant="secondary">Kullanıcı</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="text-xs space-y-1">
                        <div>{user.postsCount} gönderi</div>
                        <div>{user.followersCount} takipçi</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        {user.isBlocked ? (
                          <Badge variant="destructive">Engelli</Badge>
                        ) : (
                          <Badge variant="outline" className="text-green-600 border-green-600">
                            Aktif
                          </Badge>
                        )}
                        {user.isVerified && (
                          <Badge variant="secondary" className="text-blue-600 border-blue-600">
                            <BadgeCheck className="h-3 w-3 mr-1" />
                            Doğrulanmış
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setSelectedUserId(user._id);
                            setDetailsOpen(true);
                          }}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {!user.isSuperAdmin && (
                              <>
                                {user.role === "user" && isSuperAdmin ? (
                                  <DropdownMenuItem
                                    onClick={() => handleRoleChange(user._id, "admin")}
                                  >
                                    <Shield className="mr-2 h-4 w-4" />
                                    Admin Yap
                                  </DropdownMenuItem>
                                ) : user.role === "admin" && isSuperAdmin ? (
                                  <>
                                    <DropdownMenuItem
                                      onClick={() => handleRoleChange(user._id, "user")}
                                    >
                                      <Shield className="mr-2 h-4 w-4" />
                                      Kullanıcı Yap
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      onClick={() => openPermissionsDialog(user._id, user.adminPermissions)}
                                    >
                                      <Settings className="mr-2 h-4 w-4" />
                                      Yetkileri Düzenle
                                    </DropdownMenuItem>
                                  </>
                                ) : null}
                                <DropdownMenuItem onClick={() => handleToggleVerify(user._id)}>
                                  <BadgeCheck className="mr-2 h-4 w-4" />
                                  {user.isVerified ? "Doğrulamayı Kaldır" : "Doğrula"}
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => {
                                  setSelectedUserId(user._id);
                                  setTokenDialogOpen(true);
                                }}>
                                  <Coins className="mr-2 h-4 w-4" />
                                  Jeton Yükle
                                </DropdownMenuItem>
                                {isSuperAdmin && (
                                  <DropdownMenuItem onClick={() => {
                                    setSelectedUserId(user._id);
                                    setLevelDialogOpen(true);
                                  }}>
                                    <TrendingUp className="mr-2 h-4 w-4" />
                                    Seviye Ayarla
                                  </DropdownMenuItem>
                                )}
                                <DropdownMenuItem onClick={() => handleToggleBlock(user._id)}>
                                  <Ban className="mr-2 h-4 w-4" />
                                  {user.isBlocked ? "Engeli Kaldır" : "Engelle"}
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => handleDelete(user._id)}
                                  className="text-destructive"
                                >
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Sil
                                </DropdownMenuItem>
                              </>
                            )}
                            {user.isSuperAdmin && (
                              <DropdownMenuItem disabled>
                                Baş admin üzerinde işlem yapılamaz
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
        <UserDetailsDialog
          userId={selectedUserId}
          open={detailsOpen}
          onOpenChange={setDetailsOpen}
        />
      </Card>

      {/* Token Grant Dialog */}
      <Dialog open={tokenDialogOpen} onOpenChange={setTokenDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>🎟️ Kullanıcıya Jeton Yükle</DialogTitle>
            <DialogDescription>
              Kullanıcının hesabına jeton ekleyin. Kullanıcı bildirim alacaktır.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {/* Current Token Balance */}
            {selectedUserTokenBalance && (
              <div className="p-3 rounded-lg bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-200">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Mevcut Jetonları:</span>
                  <span className="text-lg font-bold text-purple-600">
                    🎟️ {selectedUserTokenBalance.tokens}
                  </span>
                </div>
                {selectedUserTokenBalance.bonusTokens > 0 && (
                  <div className="text-xs text-muted-foreground mt-1">
                    ({selectedUserTokenBalance.paidTokens} ödeme + {selectedUserTokenBalance.bonusTokens} bonus)
                  </div>
                )}
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="token-amount">Jeton Miktarı *</Label>
              <Input
                id="token-amount"
                type="number"
                min="1"
                value={tokenAmount}
                onChange={(e) => setTokenAmount(e.target.value)}
                placeholder="Örn: 100"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="token-reason">Sebep (Opsiyonel)</Label>
              <Textarea
                id="token-reason"
                value={tokenReason}
                onChange={(e) => setTokenReason(e.target.value)}
                placeholder="Örn: Kampanya hediyesi"
                rows={3}
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={handleGrantTokens} className="flex-1">
                Jeton Yükle
              </Button>
              <Button 
                variant="outline" 
                onClick={() => {
                  setTokenDialogOpen(false);
                  setTokenAmount("");
                  setTokenReason("");
                }}
              >
                İptal
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Level Set Dialog */}
      <Dialog open={levelDialogOpen} onOpenChange={setLevelDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>📈 Kullanıcı Seviyesi Ayarla</DialogTitle>
            <DialogDescription>
              Kullanıcının hediye seviyesini ayarlayın (0-100). 50+ seviyede otomatik doğrulama yapılır.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="level-amount">Seviye (0-100) *</Label>
              <Input
                id="level-amount"
                type="number"
                min="0"
                max="100"
                value={levelAmount}
                onChange={(e) => setLevelAmount(e.target.value)}
                placeholder="Örn: 50"
              />
              <p className="text-xs text-muted-foreground">
                • 1-9: Bronz 🥉<br />
                • 10-24: Gümüş 🥈<br />
                • 25-49: Altın 🥇<br />
                • 50-74: Platin 💎<br />
                • 75-89: Elmas 💠<br />
                • 90-100: Efsane 👑
              </p>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleSetLevel} className="flex-1">
                Seviye Ayarla
              </Button>
              <Button 
                variant="outline" 
                onClick={() => {
                  setLevelDialogOpen(false);
                  setLevelAmount("");
                }}
              >
                İptal
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Admin Permissions Dialog */}
      <Dialog open={permissionsDialogOpen} onOpenChange={setPermissionsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>⚙️ Admin Yetkilerini Düzenle</DialogTitle>
            <DialogDescription>
              Bu adminin hangi işlemleri yapabileceğini belirleyin. Süper admin her zaman tüm yetkilere sahiptir.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="manage-users">Kullanıcı Yönetimi</Label>
                  <p className="text-xs text-muted-foreground">
                    Kullanıcıları engelleyebilir, doğrulayabilir ve silebilir
                  </p>
                </div>
                <Switch
                  id="manage-users"
                  checked={permissions.canManageUsers}
                  onCheckedChange={(checked) => 
                    setPermissions({ ...permissions, canManageUsers: checked })
                  }
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="grant-tokens">Jeton Yükleme</Label>
                  <p className="text-xs text-muted-foreground">
                    Kullanıcılara jeton yükleyebilir
                  </p>
                </div>
                <Switch
                  id="grant-tokens"
                  checked={permissions.canGrantTokens}
                  onCheckedChange={(checked) => 
                    setPermissions({ ...permissions, canGrantTokens: checked })
                  }
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="manage-reports">Rapor Yönetimi</Label>
                  <p className="text-xs text-muted-foreground">
                    Kullanıcı raporlarını görüntüleyebilir ve işlem yapabilir
                  </p>
                </div>
                <Switch
                  id="manage-reports"
                  checked={permissions.canManageReports}
                  onCheckedChange={(checked) => 
                    setPermissions({ ...permissions, canManageReports: checked })
                  }
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="manage-content">İçerik Yönetimi</Label>
                  <p className="text-xs text-muted-foreground">
                    Gönderileri ve yorumları silebilir
                  </p>
                </div>
                <Switch
                  id="manage-content"
                  checked={permissions.canManageContent}
                  onCheckedChange={(checked) => 
                    setPermissions({ ...permissions, canManageContent: checked })
                  }
                />
              </div>
            </div>
            
            <div className="flex gap-2">
              <Button onClick={handleUpdatePermissions} className="flex-1">
                Yetkileri Güncelle
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setPermissionsDialogOpen(false)}
              >
                İptal
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
