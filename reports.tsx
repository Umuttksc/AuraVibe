import { Authenticated, Unauthenticated, AuthLoading, usePaginatedQuery, useMutation } from "convex/react";
import MainLayout from "@/components/layout/main-layout.tsx";
import { SignInButton } from "@/components/ui/signin.tsx";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import { AlertTriangle, CheckCircle, X, Eye, ArrowLeft } from "lucide-react";
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription } from "@/components/ui/empty.tsx";
import { api } from "@/convex/_generated/api.js";
import { Button } from "@/components/ui/button.tsx";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card.tsx";
import { Badge } from "@/components/ui/badge.tsx";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { tr } from "date-fns/locale";
import type { Id } from "@/convex/_generated/dataModel.d.ts";
import { useNavigate } from "react-router-dom";

// Icon wrapper components
function AlertTriangleIcon({ className }: { className?: string }) {
  return <AlertTriangle className={className} />;
}

function CheckCircleIcon({ className }: { className?: string }) {
  return <CheckCircle className={className} />;
}

function XIcon({ className }: { className?: string }) {
  return <X className={className} />;
}

function EyeIcon({ className }: { className?: string }) {
  return <Eye className={className} />;
}

interface Report {
  _id: Id<"reports">;
  reason: string;
  description?: string;
  status: "pending" | "reviewed" | "resolved" | "dismissed";
  reporter: {
    _id: Id<"users">;
    name?: string;
    username?: string;
  } | null;
  reportedUser: {
    _id: Id<"users">;
    name?: string;
    username?: string;
  } | null;
  post: {
    _id: Id<"posts">;
    content: string;
  } | null;
  comment: {
    _id: Id<"comments">;
    content: string;
  } | null;
  createdAt: string;
}

const reasonLabels: Record<string, string> = {
  spam: "Spam",
  harassment: "Taciz",
  hate_speech: "Nefret Söylemi",
  violence: "Şiddet",
  inappropriate: "Uygunsuz İçerik",
  other: "Diğer",
};

const statusLabels: Record<string, string> = {
  pending: "Bekliyor",
  reviewed: "İncelendi",
  resolved: "Çözüldü",
  dismissed: "Reddedildi",
};

const statusColors: Record<string, "default" | "secondary" | "destructive"> = {
  pending: "default",
  reviewed: "secondary",
  resolved: "secondary",
  dismissed: "destructive",
};

function ReportsContent() {
  const { results: reports, status, loadMore } = usePaginatedQuery(
    api.reports.getReports,
    {},
    { initialNumItems: 20 }
  );

  const updateStatus = useMutation(api.reports.updateReportStatus);
  const navigate = useNavigate();

  const handleUpdateStatus = async (reportId: Id<"reports">, newStatus: "pending" | "reviewed" | "resolved" | "dismissed") => {
    try {
      await updateStatus({ reportId, status: newStatus });
      toast.success("Rapor durumu güncellendi");
    } catch (error) {
      if (error instanceof Error) {
        toast.error(error.message);
      }
    }
  };

  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-2">
            <AlertTriangleIcon className="h-6 w-6" />
            <h1 className="text-2xl font-bold">Raporlar</h1>
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

        {status === "LoadingFirstPage" && (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-48 w-full" />
            ))}
          </div>
        )}

        {reports && reports.length === 0 && status !== "LoadingFirstPage" && (
          <Empty>
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <CheckCircleIcon />
              </EmptyMedia>
              <EmptyTitle>Hiç rapor yok</EmptyTitle>
              <EmptyDescription>
                Tüm raporlar temizlendi!
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        )}

        {reports && reports.length > 0 && (
          <div className="space-y-4">
            {reports.map((report: Report) => (
              <Card key={report._id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="text-lg flex items-center gap-2">
                        {reasonLabels[report.reason] || report.reason}
                        <Badge variant={statusColors[report.status]}>
                          {statusLabels[report.status]}
                        </Badge>
                      </CardTitle>
                      <p className="text-sm text-muted-foreground">
                        Bildirildi:{" "}
                        {formatDistanceToNow(new Date(report.createdAt), {
                          addSuffix: true,
                          locale: tr,
                        })}
                      </p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Reporter */}
                  <div>
                    <p className="text-sm font-semibold mb-1">Bildiren:</p>
                    <p className="text-sm text-muted-foreground">
                      {report.reporter?.name || "Bilinmeyen"} 
                      {report.reporter?.username && ` (@${report.reporter.username})`}
                    </p>
                  </div>

                  {/* Reported User */}
                  {report.reportedUser && (
                    <div>
                      <p className="text-sm font-semibold mb-1">Bildirilen Kullanıcı:</p>
                      <p className="text-sm text-muted-foreground">
                        {report.reportedUser.name || "Bilinmeyen"}
                        {report.reportedUser.username && ` (@${report.reportedUser.username})`}
                      </p>
                    </div>
                  )}

                  {/* Reported Post */}
                  {report.post && (
                    <div>
                      <p className="text-sm font-semibold mb-1">Bildirilen Gönderi:</p>
                      <div className="bg-muted p-3 rounded-lg">
                        <p className="text-sm line-clamp-3">{report.post.content}</p>
                      </div>
                    </div>
                  )}

                  {/* Reported Comment */}
                  {report.comment && (
                    <div>
                      <p className="text-sm font-semibold mb-1">Bildirilen Yorum:</p>
                      <div className="bg-muted p-3 rounded-lg">
                        <p className="text-sm line-clamp-3">{report.comment.content}</p>
                      </div>
                    </div>
                  )}

                  {/* Description */}
                  {report.description && (
                    <div>
                      <p className="text-sm font-semibold mb-1">Açıklama:</p>
                      <p className="text-sm text-muted-foreground">{report.description}</p>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2 flex-wrap">
                    {report.status === "pending" && (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleUpdateStatus(report._id, "reviewed")}
                        >
                          <EyeIcon className="h-4 w-4 mr-2" />
                          İncelendi
                        </Button>
                        <Button
                          size="sm"
                          variant="default"
                          onClick={() => handleUpdateStatus(report._id, "resolved")}
                        >
                          <CheckCircleIcon className="h-4 w-4 mr-2" />
                          Çözüldü
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleUpdateStatus(report._id, "dismissed")}
                        >
                          <XIcon className="h-4 w-4 mr-2" />
                          Reddet
                        </Button>
                      </>
                    )}
                    {report.status === "reviewed" && (
                      <>
                        <Button
                          size="sm"
                          variant="default"
                          onClick={() => handleUpdateStatus(report._id, "resolved")}
                        >
                          <CheckCircleIcon className="h-4 w-4 mr-2" />
                          Çözüldü
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleUpdateStatus(report._id, "dismissed")}
                        >
                          <XIcon className="h-4 w-4 mr-2" />
                          Reddet
                        </Button>
                      </>
                    )}
                    {(report.status === "resolved" || report.status === "dismissed") && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleUpdateStatus(report._id, "pending")}
                      >
                        Yeniden Aç
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}

            {status === "CanLoadMore" && (
              <div className="flex justify-center py-4">
                <Button onClick={() => loadMore(20)} variant="outline">
                  Daha Fazla Yükle
                </Button>
              </div>
            )}

            {status === "LoadingMore" && (
              <div className="flex justify-center py-4">
                <Skeleton className="h-10 w-32" />
              </div>
            )}
          </div>
        )}
      </div>
    </MainLayout>
  );
}

export default function AdminReportsPage() {
  return (
    <>
      <Unauthenticated>
        <div className="min-h-screen flex items-center justify-center p-4">
          <div className="text-center space-y-4">
            <p className="text-muted-foreground">
              Raporları görüntülemek için giriş yapın
            </p>
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
        <ReportsContent />
      </Authenticated>
    </>
  );
}
