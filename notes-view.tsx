import { useState } from "react";
import { usePaginatedQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import type { Id } from "@/convex/_generated/dataModel.d.ts";
import { Button } from "@/components/ui/button.tsx";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card.tsx";
import { Plus, StickyNote, Trash2, Pin, PinOff } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { tr } from "date-fns/locale";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription, EmptyContent } from "@/components/ui/empty.tsx";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog.tsx";
import { Input } from "@/components/ui/input.tsx";
import { Label } from "@/components/ui/label.tsx";
import { Textarea } from "@/components/ui/textarea.tsx";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select.tsx";

function StickyNoteIcon() {
  return <StickyNote />;
}

function PlusIcon() {
  return <Plus className="h-4 w-4 mr-2" />;
}

function PinIcon() {
  return <Pin className="h-4 w-4 fill-current" />;
}

function PinOffIcon() {
  return <PinOff className="h-4 w-4" />;
}

function Trash2Icon() {
  return <Trash2 className="h-4 w-4" />;
}

function PinIconButton() {
  return <Pin className="h-4 w-4" />;
}

function PinOffIconButton() {
  return <PinOff className="h-4 w-4 mr-2" />;
}

const NOTE_COLORS = [
  { value: "default", label: "Varsayılan", class: "bg-card" },
  { value: "yellow", label: "Sarı", class: "bg-yellow-50 dark:bg-yellow-950/30 border-yellow-200 dark:border-yellow-900" },
  { value: "green", label: "Yeşil", class: "bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-900" },
  { value: "blue", label: "Mavi", class: "bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-900" },
  { value: "pink", label: "Pembe", class: "bg-pink-50 dark:bg-pink-950/30 border-pink-200 dark:border-pink-900" },
  { value: "purple", label: "Mor", class: "bg-purple-50 dark:bg-purple-950/30 border-purple-200 dark:border-purple-900" },
];

function AddNoteDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [color, setColor] = useState("default");
  const [isPinned, setIsPinned] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const createNote = useMutation(api.notes.createNote);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim() || !content.trim()) {
      toast.error("Başlık ve içerik gereklidir");
      return;
    }

    setIsSubmitting(true);
    try {
      await createNote({
        title: title.trim(),
        content: content.trim(),
        color,
        isPinned,
      });

      toast.success("Not eklendi");
      setTitle("");
      setContent("");
      setColor("default");
      setIsPinned(false);
      onOpenChange(false);
    } catch (error) {
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error("Not eklenemedi");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Yeni Not</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Başlık *</Label>
            <Input
              id="title"
              placeholder="Not başlığı"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="content">İçerik *</Label>
            <Textarea
              id="content"
              placeholder="Not içeriği..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={6}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="color">Renk</Label>
            <Select value={color} onValueChange={setColor}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {NOTE_COLORS.map((c) => (
                  <SelectItem key={c.value} value={c.value}>
                    {c.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant={isPinned ? "default" : "outline"}
              size="sm"
              onClick={() => setIsPinned(!isPinned)}
            >
              {isPinned ? <PinIconButton /> : <PinOffIconButton />}
              {isPinned ? "Sabitleme kaldır" : "Sabitle"}
            </Button>
          </div>

          <div className="flex gap-2 justify-end">
            <Button
              type="button"
              variant="secondary"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              İptal
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Ekleniyor..." : "Ekle"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default function NotesView() {
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  
  const { results: notes, status, loadMore } = usePaginatedQuery(
    api.notes.getNotes,
    {},
    { initialNumItems: 20 }
  );

  const deleteNote = useMutation(api.notes.deleteNote);
  const updateNote = useMutation(api.notes.updateNote);

  const handleDelete = async (noteId: Id<"notes">) => {
    if (!confirm("Bu notu silmek istediğinizden emin misiniz?")) return;
    
    try {
      await deleteNote({ noteId });
      toast.success("Not silindi");
    } catch (error) {
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error("Not silinemedi");
      }
    }
  };

  const handleTogglePin = async (noteId: Id<"notes">, currentPinned: boolean) => {
    try {
      await updateNote({ noteId, isPinned: !currentPinned });
      toast.success(currentPinned ? "Sabitleme kaldırıldı" : "Not sabitlendi");
    } catch (error) {
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error("İşlem başarısız");
      }
    }
  };

  const getColorClass = (color: string) => {
    return NOTE_COLORS.find((c) => c.value === color)?.class || NOTE_COLORS[0].class;
  };

  if (status === "LoadingFirstPage") {
    return (
      <div className="space-y-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-32 w-full" />
        ))}
      </div>
    );
  }

  // Separate pinned and unpinned notes
  const pinnedNotes = notes?.filter((n) => n.isPinned) || [];
  const unpinnedNotes = notes?.filter((n) => !n.isPinned) || [];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start gap-4">
        <div className="space-y-1">
          <h2 className="text-2xl font-bold tracking-tight">Notlarım</h2>
          <p className="text-muted-foreground">
            Önemli bilgilerini, fikirleri ve hatırlatmaları kaydet
          </p>
        </div>
        <Button onClick={() => setAddDialogOpen(true)} size="lg" className="shrink-0">
          <PlusIcon />
          Yeni Not
        </Button>
      </div>

      {!notes || notes.length === 0 ? (
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <StickyNoteIcon />
            </EmptyMedia>
            <EmptyTitle>Henüz not yok</EmptyTitle>
            <EmptyDescription>
              İlk notunu oluşturarak önemli bilgilerini kaydetmeye başla
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button size="lg" onClick={() => setAddDialogOpen(true)}>
              <PlusIcon />
              Yeni Not
            </Button>
          </EmptyContent>
        </Empty>
      ) : (
        <>
          {/* Pinned Notes */}
          {pinnedNotes.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <PinIconButton />
                <h3 className="text-lg font-bold">Sabitlenmiş Notlar</h3>
              </div>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {pinnedNotes.map((note) => (
                  <Card key={note._id} className={`${getColorClass(note.color)} hover:shadow-md transition-shadow border-2`}>
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between gap-2">
                        <CardTitle className="text-base font-bold line-clamp-2">
                          {note.title}
                        </CardTitle>
                        <div className="flex items-center gap-1 shrink-0">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => handleTogglePin(note._id, note.isPinned)}
                          >
                            <PinIcon />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-destructive hover:text-destructive"
                            onClick={() => handleDelete(note._id)}
                          >
                            <Trash2Icon />
                          </Button>
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(note._creationTime), {
                          addSuffix: true,
                          locale: tr,
                        })}
                      </p>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm whitespace-pre-wrap leading-relaxed line-clamp-6">{note.content}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Unpinned Notes */}
          {unpinnedNotes.length > 0 && (
            <div className="space-y-4">
              {pinnedNotes.length > 0 && (
                <div className="flex items-center gap-2 mt-8">
                  <h3 className="text-lg font-bold">Tüm Notlar</h3>
                </div>
              )}
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {unpinnedNotes.map((note) => (
                  <Card key={note._id} className={`${getColorClass(note.color)} hover:shadow-md transition-shadow`}>
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between gap-2">
                        <CardTitle className="text-base font-bold line-clamp-2">
                          {note.title}
                        </CardTitle>
                        <div className="flex items-center gap-1 shrink-0">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => handleTogglePin(note._id, note.isPinned)}
                          >
                            <PinOffIcon />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-destructive hover:text-destructive"
                            onClick={() => handleDelete(note._id)}
                          >
                            <Trash2Icon />
                          </Button>
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(note._creationTime), {
                          addSuffix: true,
                          locale: tr,
                        })}
                      </p>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm whitespace-pre-wrap leading-relaxed line-clamp-6">{note.content}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {status === "CanLoadMore" && (
            <Button
              variant="outline"
              onClick={() => loadMore(20)}
              className="w-full mt-6"
              size="lg"
            >
              Daha Fazla Yükle
            </Button>
          )}
        </>
      )}

      <AddNoteDialog open={addDialogOpen} onOpenChange={setAddDialogOpen} />
    </div>
  );
}
