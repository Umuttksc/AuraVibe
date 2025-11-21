import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card.tsx";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import { FileText, UserPlus } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { tr } from "date-fns/locale";

function ActivityIcon({ type }: { type: string }) {
  if (type === "post") {
    return (
      <div className="flex-shrink-0">
        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
          <FileText className="h-5 w-5 text-primary" />
        </div>
      </div>
    );
  }
  return (
    <div className="flex-shrink-0">
      <div className="h-10 w-10 rounded-full bg-green-500/10 flex items-center justify-center">
        <UserPlus className="h-5 w-5 text-green-600" />
      </div>
    </div>
  );
}

export default function ActivityFeed() {
  const activities = useQuery(api.admin.getRecentActivity);

  if (activities === undefined) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Son Aktiviteler</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-96 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!activities) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Son Aktiviteler</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground py-8">
            Aktivite verileri yüklenemedi
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Son Aktiviteler</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activities.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              Henüz aktivite yok
            </div>
          ) : (
            activities.map((activity, index) => (
              <div
                key={`${activity.type}-${activity.timestamp}-${index}`}
                className="flex items-start gap-4 p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
              >
                <ActivityIcon type={activity.type} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">
                    {activity.user}
                  </p>
                  <p className="text-sm text-muted-foreground truncate">
                    {activity.content}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {formatDistanceToNow(new Date(activity.timestamp), {
                      addSuffix: true,
                      locale: tr,
                    })}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
