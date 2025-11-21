import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Badge } from "@/components/ui/badge.tsx";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table.tsx";
import { Plus, Eye, Trash2, Edit } from "lucide-react";
import { toast } from "sonner";
import type { Id } from "@/convex/_generated/dataModel.d.ts";
import { useState } from "react";
import CreateAdDialog from "./create-ad-dialog.tsx";

export default function AdsManagement() {
  const ads = useQuery(api.admin.getAllAds);
  const deleteAd = useMutation(api.admin.deleteAd);
  const updateAd = useMutation(api.admin.updateAd);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editingAd, setEditingAd] = useState<Id<"ads"> | null>(null);

  const handleDelete = async (adId: Id<"ads">) => {
    if (!confirm("Bu reklamı silmek istediğinizden emin misiniz?")) {
      return;
    }
    try {
      await deleteAd({ adId });
      toast.success("Reklam silindi");
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Reklam silinirken hata oluştu";
      toast.error(errorMessage);
      console.error("Delete ad error:", error);
    }
  };

  const handleToggleActive = async (adId: Id<"ads">, currentStatus: boolean) => {
    try {
      await updateAd({ adId, isActive: !currentStatus });
      toast.success(currentStatus ? "Reklam devre dışı bırakıldı" : "Reklam aktif edildi");
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Durum güncellenirken hata oluştu";
      toast.error(errorMessage);
      console.error("Toggle ad error:", error);
    }
  };

  const placementLabels = {
    home_feed: "Ana Sayfa Feed",
    profile_top: "Profil Üstü",
    explore_top: "Keşfet Üstü",
    story: "Story",
  };

  if (ads === undefined) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Reklam Yönetimi</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-96 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!ads) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Reklam Yönetimi</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground py-8">
            Reklam verileri yüklenemedi
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Reklam Yönetimi</CardTitle>
          <Button onClick={() => setCreateDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Yeni Reklam
          </Button>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Başlık</TableHead>
                  <TableHead>Yerleşim</TableHead>
                  <TableHead>İstatistikler</TableHead>
                  <TableHead>Durum</TableHead>
                  <TableHead className="text-right">İşlemler</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ads.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground">
                      Henüz reklam yok
                    </TableCell>
                  </TableRow>
                ) : (
                  ads.map((ad) => (
                    <TableRow key={ad._id}>
                      <TableCell className="font-medium">
                        <div>
                          <div>{ad.title}</div>
                          {ad.description && (
                            <div className="text-xs text-muted-foreground truncate max-w-xs">
                              {ad.description}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {placementLabels[ad.placement]}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="text-xs space-y-1">
                          <div>{ad.impressions} gösterim</div>
                          <div>{ad.clicks} tıklama</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleToggleActive(ad._id, ad.isActive)}
                        >
                          {ad.isActive ? (
                            <Badge className="bg-green-600">Aktif</Badge>
                          ) : (
                            <Badge variant="outline">Devre Dışı</Badge>
                          )}
                        </Button>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          {ad.imageUrl && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => window.open(ad.imageUrl!, "_blank")}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(ad._id)}
                            className="text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
      <CreateAdDialog open={createDialogOpen} onOpenChange={setCreateDialogOpen} />
    </>
  );
}
