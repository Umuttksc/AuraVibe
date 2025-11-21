import { useState } from "react";
import { usePaginatedQuery } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import { Button } from "@/components/ui/button.tsx";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card.tsx";
import { Plus, BookOpen } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { tr } from "date-fns/locale";
import AddJournalDialog from "./add-journal-dialog.tsx";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription, EmptyContent } from "@/components/ui/empty.tsx";

// Icon wrapper components
function PlusIcon({ className }: { className?: string }) {
  return <Plus className={className} />;
}

function BookOpenIcon({ className }: { className?: string }) {
  return <BookOpen className={className} />;
}

type Mood = "happy" | "sad" | "anxious" | "calm" | "energetic" | "tired";

const MOOD_EMOJI: Record<Mood, string> = {
  happy: "😊",
  sad: "😢",
  anxious: "😰",
  calm: "😌",
  energetic: "⚡",
  tired: "😴",
};

const MOOD_TEXT: Record<Mood, string> = {
  happy: "Mutlu",
  sad: "Üzgün",
  anxious: "Endişeli",
  calm: "Sakin",
  energetic: "Enerjik",
  tired: "Yorgun",
};

export default function JournalView() {
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  
  const { results: entries, status, loadMore } = usePaginatedQuery(
    api.journal.getEntries,
    {},
    { initialNumItems: 10 }
  );

  if (status === "LoadingFirstPage") {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-40 w-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start gap-4">
        <div className="space-y-1">
          <h2 className="text-2xl font-bold tracking-tight">Günlük Kayıtları</h2>
          <p className="text-muted-foreground">
            Günlük düşüncelerini, hislerini ve yaşadıklarını kaydet
          </p>
        </div>
        <Button onClick={() => setAddDialogOpen(true)} size="lg" className="shrink-0">
          <PlusIcon className="h-4 w-4 mr-2" />
          Yeni Kayıt
        </Button>
      </div>

      {!entries || entries.length === 0 ? (
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <BookOpenIcon />
            </EmptyMedia>
            <EmptyTitle>Henüz kayıt yok</EmptyTitle>
            <EmptyDescription>
              İlk günlük kaydını oluşturarak düşüncelerini kaydetmeye başla
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button size="lg" onClick={() => setAddDialogOpen(true)}>
              <PlusIcon className="h-4 w-4 mr-2" />
              Yeni Kayıt
            </Button>
          </EmptyContent>
        </Empty>
      ) : (
        <>
          <div className="grid gap-5">
            {entries.map((entry: {
              _id: string;
              _creationTime: number;
              date: string;
              content: string;
              mood?: Mood;
              activities?: string[];
              isPrivate: boolean;
            }) => (
              <Card key={entry._id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1 flex-1">
                      <CardTitle className="text-lg font-bold">
                        {new Date(entry.date).toLocaleDateString("tr-TR", {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        })}
                      </CardTitle>
                      <CardDescription className="text-xs">
                        {formatDistanceToNow(new Date(entry._creationTime), {
                          addSuffix: true,
                          locale: tr,
                        })}
                      </CardDescription>
                    </div>
                    {entry.mood && (
                      <div className="flex flex-col items-center gap-1 shrink-0">
                        <div className="text-3xl" title={MOOD_TEXT[entry.mood]}>
                          {MOOD_EMOJI[entry.mood]}
                        </div>
                        <span className="text-xs font-medium text-muted-foreground">
                          {MOOD_TEXT[entry.mood]}
                        </span>
                      </div>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Content */}
                  <div className="prose prose-sm dark:prose-invert max-w-none">
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">{entry.content}</p>
                  </div>

                  {/* Activities */}
                  {entry.activities && entry.activities.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-muted-foreground">Aktiviteler</p>
                      <div className="flex flex-wrap gap-2">
                        {entry.activities.map((activity: string, idx: number) => (
                          <span
                            key={idx}
                            className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-200"
                          >
                            {activity}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Privacy Badge */}
                  {entry.isPrivate && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-muted">
                        🔒 Gizli
                      </span>
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

      <AddJournalDialog open={addDialogOpen} onOpenChange={setAddDialogOpen} />
    </div>
  );
}
