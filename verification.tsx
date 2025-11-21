import { Authenticated, Unauthenticated, AuthLoading } from "convex/react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import type { Id } from "@/convex/_generated/dataModel.d.ts";
import MainLayout from "@/components/layout/main-layout.tsx";
import { SignInButton } from "@/components/ui/signin.tsx";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card.tsx";
import { BadgeCheck, CheckCircle2, XCircle, Clock, User, ArrowLeft } from "lucide-react";
import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs.tsx";
import { Badge } from "@/components/ui/badge.tsx";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog.tsx";
import { Label } from "@/components/ui/label.tsx";
import { Textarea } from "@/components/ui/textarea.tsx";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

function AdminVerificationContent() {
  const pendingRequests = useQuery(api.verificationRequests.listRequests, { status: "pending" });
  const approvedRequests = useQuery(api.verificationRequests.listRequests, { status: "approved" });
  const rejectedRequests = useQuery(api.verificationRequests.listRequests, { status: "rejected" });

  const approveRequest = useMutation(api.verificationRequests.approveRequest);
  const rejectRequest = useMutation(api.verificationRequests.rejectRequest);
  const navigate = useNavigate();

  const [selectedRequest, setSelectedRequest] = useState<{
    _id: Id<"verificationRequests">;
    userId: Id<"users">;
    reason: string;
    user: {
      name?: string;
      username?: string;
      email?: string;
    } | null;
    paymentStatus: "pending" | "completed";
  } | null>(null);
  const [actionType, setActionType] = useState<"approve" | "reject" | null>(null);
  const [adminNotes, setAdminNotes] = useState("");
  const [rejectionReason, setRejectionReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleApprove = (request: typeof selectedRequest) => {
    setSelectedRequest(request);
    setActionType("approve");
    setAdminNotes("");
  };

  const handleReject = (request: typeof selectedRequest) => {
    setSelectedRequest(request);
    setActionType("reject");
    setRejectionReason("");
    setAdminNotes("");
  };

  const handleConfirmApprove = async () => {
    if (!selectedRequest) return;

    setIsSubmitting(true);
    try {
      await approveRequest({
        requestId: selectedRequest._id,
        adminNotes: adminNotes || undefined,
      });
      toast.success("Başvuru onaylandı");
      setSelectedRequest(null);
      setActionType(null);
      setAdminNotes("");
    } catch (error) {
      const err = error as Error;
      toast.error(err.message || "Onaylama başarısız");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmReject = async () => {
    if (!selectedRequest || !rejectionReason.trim()) {
      toast.error("Lütfen red nedenini girin");
      return;
    }

    setIsSubmitting(true);
    try {
      await rejectRequest({
        requestId: selectedRequest._id,
        rejectionReason,
        adminNotes: adminNotes || undefined,
      });
      toast.success("Başvuru reddedildi");
      setSelectedRequest(null);
      setActionType(null);
      setRejectionReason("");
      setAdminNotes("");
    } catch (error) {
      const err = error as Error;
      toast.error(err.message || "Reddetme başarısız");
    } finally {
      setIsSubmitting(false);
    }
  };

  const RequestCard = ({ request, showActions = true }: { request: NonNullable<typeof pendingRequests>[0]; showActions?: boolean }) => {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <CardTitle className="flex items-center gap-2">
                <User className="h-4 w-4" />
                {request.user?.name || "İsimsiz"}
              </CardTitle>
              <CardDescription>
                @{request.user?.username || "kullanıcı"}
              </CardDescription>
            </div>
            <Badge variant={
              request.paymentStatus === "completed" ? "default" : "secondary"
            }>
              {request.paymentStatus === "completed" ? "Ödeme Tamamlandı" : "Ödeme Bekliyor"}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Başvuru Nedeni</Label>
            <p className="text-sm text-muted-foreground mt-1">{request.reason}</p>
          </div>

          <div className="text-xs text-muted-foreground">
            <p>Email: {request.user?.email || "Belirtilmemiş"}</p>
            <p>Başvuru ID: {request._id}</p>
          </div>

          {showActions && request.paymentStatus === "completed" && (
            <div className="flex gap-2 pt-2 border-t">
              <Button
                onClick={() => handleApprove(request)}
                className="flex-1"
                variant="default"
              >
                <CheckCircle2 className="h-4 w-4 mr-1" />
                Onayla
              </Button>
              <Button
                onClick={() => handleReject(request)}
                className="flex-1"
                variant="destructive"
              >
                <XCircle className="h-4 w-4 mr-1" />
                Reddet
              </Button>
            </div>
          )}

          {showActions && request.paymentStatus === "pending" && (
            <div className="pt-2 border-t text-sm text-muted-foreground">
              <Clock className="h-4 w-4 inline mr-1" />
              Ödeme tamamlanmayı bekleyin
            </div>
          )}

          {!showActions && request.adminNotes && (
            <div className="pt-2 border-t">
              <Label>Admin Notu</Label>
              <p className="text-sm text-muted-foreground mt-1">{request.adminNotes}</p>
            </div>
          )}

          {!showActions && request.status === "rejected" && request.rejectionReason && (
            <div className="pt-2 border-t">
              <Label>Red Nedeni</Label>
              <p className="text-sm text-muted-foreground mt-1">{request.rejectionReason}</p>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <MainLayout>
      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-2">
            <BadgeCheck className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold">Doğrulama Başvuruları</h1>
          </div>
          <Button
            variant="outline"
            onClick={() => navigate("/admin")}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Geri Dön
          </Button>
        </div>

        <Tabs defaultValue="pending" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="pending">
              Bekleyen ({pendingRequests?.length || 0})
            </TabsTrigger>
            <TabsTrigger value="approved">
              Onaylanan ({approvedRequests?.length || 0})
            </TabsTrigger>
            <TabsTrigger value="rejected">
              Reddedilen ({rejectedRequests?.length || 0})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pending" className="space-y-4">
            {!pendingRequests && (
              <div className="grid gap-4">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-64 w-full" />
                ))}
              </div>
            )}
            {pendingRequests && pendingRequests.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Bekleyen başvuru yok</p>
              </div>
            )}
            {pendingRequests && pendingRequests.length > 0 && (
              <div className="grid gap-4">
                {pendingRequests.map((request) => (
                  <RequestCard key={request._id} request={request} />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="approved" className="space-y-4">
            {!approvedRequests && (
              <div className="grid gap-4">
                {[1, 2].map((i) => (
                  <Skeleton key={i} className="h-64 w-full" />
                ))}
              </div>
            )}
            {approvedRequests && approvedRequests.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                <CheckCircle2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Onaylanan başvuru yok</p>
              </div>
            )}
            {approvedRequests && approvedRequests.length > 0 && (
              <div className="grid gap-4">
                {approvedRequests.map((request) => (
                  <RequestCard key={request._id} request={request} showActions={false} />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="rejected" className="space-y-4">
            {!rejectedRequests && (
              <div className="grid gap-4">
                {[1, 2].map((i) => (
                  <Skeleton key={i} className="h-64 w-full" />
                ))}
              </div>
            )}
            {rejectedRequests && rejectedRequests.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                <XCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Reddedilen başvuru yok</p>
              </div>
            )}
            {rejectedRequests && rejectedRequests.length > 0 && (
              <div className="grid gap-4">
                {rejectedRequests.map((request) => (
                  <RequestCard key={request._id} request={request} showActions={false} />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Approve Dialog */}
      <Dialog open={actionType === "approve"} onOpenChange={(open) => !open && setActionType(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Başvuruyu Onayla</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              <strong>{selectedRequest?.user?.name}</strong> kullanıcısının başvurusunu onaylamak istediğinizden emin misiniz?
            </p>
            <div className="space-y-2">
              <Label htmlFor="approve-notes">Admin Notu (Opsiyonel)</Label>
              <Textarea
                id="approve-notes"
                placeholder="Kullanıcıya gösterilecek not..."
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                rows={3}
              />
            </div>
            <div className="flex gap-2">
              <Button
                onClick={handleConfirmApprove}
                disabled={isSubmitting}
                className="flex-1"
              >
                {isSubmitting ? "Onaylanıyor..." : "Onayla"}
              </Button>
              <Button
                onClick={() => {
                  setActionType(null);
                  setAdminNotes("");
                }}
                variant="outline"
                className="flex-1"
              >
                İptal
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={actionType === "reject"} onOpenChange={(open) => !open && setActionType(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Başvuruyu Reddet</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              <strong>{selectedRequest?.user?.name}</strong> kullanıcısının başvurusunu reddetmek istediğinizden emin misiniz?
            </p>
            <div className="space-y-2">
              <Label htmlFor="reject-reason">
                Red Nedeni <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="reject-reason"
                placeholder="Kullanıcıya gösterilecek red nedeni..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="reject-notes">Admin Notu (Opsiyonel)</Label>
              <Textarea
                id="reject-notes"
                placeholder="İç not..."
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                rows={2}
              />
            </div>
            <div className="flex gap-2">
              <Button
                onClick={handleConfirmReject}
                disabled={isSubmitting || !rejectionReason.trim()}
                variant="destructive"
                className="flex-1"
              >
                {isSubmitting ? "Reddediliyor..." : "Reddet"}
              </Button>
              <Button
                onClick={() => {
                  setActionType(null);
                  setRejectionReason("");
                  setAdminNotes("");
                }}
                variant="outline"
                className="flex-1"
              >
                İptal
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
}

export default function AdminVerificationPage() {
  return (
    <>
      <Unauthenticated>
        <div className="min-h-screen flex items-center justify-center p-4">
          <div className="text-center space-y-4">
            <p className="text-muted-foreground">Admin girişi yapın</p>
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
        <AdminVerificationContent />
      </Authenticated>
    </>
  );
}
