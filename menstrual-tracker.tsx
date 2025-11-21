import { useState } from "react";
import { usePaginatedQuery } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import { Button } from "@/components/ui/button.tsx";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card.tsx";
import { Calendar, Plus, Droplet } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { tr } from "date-fns/locale";
import AddCycleDialog from "./add-cycle-dialog.tsx";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription, EmptyContent } from "@/components/ui/empty.tsx";

// Icon wrapper components
function CalendarIcon({ className }: { className?: string }) {
  return <Calendar className={className} />;
}

function PlusIcon({ className }: { className?: string }) {
  return <Plus className={className} />;
}

function DropletIcon({ className }: { className?: string }) {
  return <Droplet className={className} />;
}

export default function MenstrualTracker() {
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  
  const { results: cycles, status, loadMore } = usePaginatedQuery(
    api.menstrual.getCycles,
    {},
    { initialNumItems: 10 }
  );

  if (status === "LoadingFirstPage") {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-32 w-full" />
        ))}
      </div>
    );
  }

  const getFlowColor = (flow: string | undefined) => {
    switch (flow) {
      case "light":
        return "text-pink-300";
      case "medium":
        return "text-pink-500";
      case "heavy":
        return "text-pink-700";
      default:
        return "text-muted-foreground";
    }
  };

  const getFlowText = (flow: string | undefined) => {
    switch (flow) {
      case "light":
        return "Hafif";
      case "medium":
        return "Orta";
      case "heavy":
        return "Yoğun";
      default:
        return "-";
    }
  };

  return (
    <div className="space-y-6">
      {!cycles || cycles.length === 0 ? (
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <CalendarIcon />
            </EmptyMedia>
            <EmptyTitle>Henüz kayıt yok</EmptyTitle>
            <EmptyDescription>
              İlk regl döngünü ekleyerek sağlık takibine başla
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button size="lg" onClick={() => setAddDialogOpen(true)}>
              <PlusIcon className="h-4 w-4 mr-2" />
              Yeni Döngü
            </Button>
          </EmptyContent>
        </Empty>
      ) : (
        <>
          <div className="grid gap-5">
            {cycles.map((cycle: {
              _id: string;
              _creationTime: number;
              startDate: string;
              flow?: "light" | "medium" | "heavy";
              periodLength?: number;
              cycleLength?: number;
              symptoms?: string[];
              notes?: string;
            }) => (
              <Card key={cycle._id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="text-lg font-bold">
                        {new Date(cycle.startDate).toLocaleDateString("tr-TR", {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        })}
                      </CardTitle>
                      <CardDescription className="text-xs">
                        {formatDistanceToNow(new Date(cycle._creationTime), {
                          addSuffix: true,
                          locale: tr,
                        })}
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <DropletIcon className={`h-6 w-6 ${getFlowColor(cycle.flow)}`} />
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Stats Grid */}
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-1 p-3 rounded-lg bg-secondary/50">
                      <p className="text-xs text-muted-foreground font-medium">Akış Yoğunluğu</p>
                      <p className="text-base font-bold">{getFlowText(cycle.flow)}</p>
                    </div>
                    {cycle.periodLength && (
                      <div className="space-y-1 p-3 rounded-lg bg-secondary/50">
                        <p className="text-xs text-muted-foreground font-medium">Süre</p>
                        <p className="text-base font-bold">{cycle.periodLength} gün</p>
                      </div>
                    )}
                    {cycle.cycleLength && (
                      <div className="space-y-1 p-3 rounded-lg bg-secondary/50">
                        <p className="text-xs text-muted-foreground font-medium">Döngü</p>
                        <p className="text-base font-bold">{cycle.cycleLength} gün</p>
                      </div>
                    )}
                  </div>

                  {/* Symptoms */}
                  {cycle.symptoms && cycle.symptoms.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-muted-foreground">Semptomlar</p>
                      <div className="flex flex-wrap gap-2">
                        {cycle.symptoms.map((symptom: string, idx: number) => (
                          <span
                            key={idx}
                            className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium bg-pink-100 dark:bg-pink-950 text-pink-800 dark:text-pink-200"
                          >
                            {symptom}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Notes */}
                  {cycle.notes && (
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-muted-foreground">Notlar</p>
                      <p className="text-sm leading-relaxed p-3 rounded-lg bg-muted/50">{cycle.notes}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          {status === "CanLoadMore" && (
            <Button
              variant="outline"
              onClick={() => loadMore(10)}
              className="w-full"
              size="lg"
            >
              Daha Fazla Yükle
            </Button>
          )}
        </>
      )}

      <AddCycleDialog open={addDialogOpen} onOpenChange={setAddDialogOpen} />
    </div>
  );
}
