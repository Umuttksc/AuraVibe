import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import { Button } from "@/components/ui/button.tsx";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card.tsx";
import { Input } from "@/components/ui/input.tsx";
import { Label } from "@/components/ui/label.tsx";
import { Textarea } from "@/components/ui/textarea.tsx";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select.tsx";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog.tsx";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs.tsx";
import { Progress } from "@/components/ui/progress.tsx";
import { Plus, Trash2, Edit, Star, BookOpen } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import type { Id } from "@/convex/_generated/dataModel.d.ts";

function PlusIconWrapper() {
  return <Plus className="h-4 w-4" />;
}

function Trash2IconWrapper() {
  return <Trash2 className="h-4 w-4" />;
}

function EditIconWrapper() {
  return <Edit className="h-4 w-4" />;
}

function StarIconWrapper({ filled }: { filled: boolean }) {
  return <Star className={`h-4 w-4 ${filled ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}`} />;
}

function BookOpenIconWrapper() {
  return <BookOpen className="h-4 w-4" />;
}

const statusLabels: Record<string, string> = {
  reading: "Okuyor",
  completed: "Tamamlandı",
  want_to_read: "Okunacak",
};

const statusColors: Record<string, string> = {
  reading: "bg-blue-500",
  completed: "bg-green-500",
  want_to_read: "bg-yellow-500",
};

type BookStatus = "reading" | "completed" | "want_to_read";

interface BookFormData {
  title: string;
  author: string;
  coverImage: string;
  pageCount: string;
  currentPage: string;
  status: BookStatus;
  rating: string;
  startDate: string;
  finishDate: string;
  notes: string;
}

export default function BookJournal() {
  const books = useQuery(api.books.getBooks);
  const addBook = useMutation(api.books.addBook);
  const updateBook = useMutation(api.books.updateBook);
  const deleteBook = useMutation(api.books.deleteBook);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingBook, setEditingBook] = useState<Id<"books"> | null>(null);
  const [activeTab, setActiveTab] = useState<BookStatus | "all">("all");
  const [formData, setFormData] = useState<BookFormData>({
    title: "",
    author: "",
    coverImage: "",
    pageCount: "",
    currentPage: "",
    status: "want_to_read",
    rating: "",
    startDate: "",
    finishDate: "",
    notes: "",
  });

  const resetForm = () => {
    setFormData({
      title: "",
      author: "",
      coverImage: "",
      pageCount: "",
      currentPage: "",
      status: "want_to_read",
      rating: "",
      startDate: "",
      finishDate: "",
      notes: "",
    });
    setEditingBook(null);
  };

  const handleAddOrUpdateBook = async () => {
    if (!formData.title.trim() || !formData.author.trim()) {
      toast.error("Kitap adı ve yazar gerekli");
      return;
    }

    try {
      const bookData = {
        title: formData.title.trim(),
        author: formData.author.trim(),
        coverImage: formData.coverImage.trim() || undefined,
        pageCount: formData.pageCount ? parseInt(formData.pageCount) : undefined,
        currentPage: formData.currentPage ? parseInt(formData.currentPage) : undefined,
        status: formData.status,
        rating: formData.rating ? parseInt(formData.rating) : undefined,
        startDate: formData.startDate || undefined,
        finishDate: formData.finishDate || undefined,
        notes: formData.notes.trim() || undefined,
      };

      if (editingBook) {
        await updateBook({ bookId: editingBook, ...bookData });
        toast.success("Kitap güncellendi!");
      } else {
        await addBook(bookData);
        toast.success("Kitap eklendi!");
      }

      resetForm();
      setIsDialogOpen(false);
    } catch (error) {
      toast.error("Kitap kaydedilirken hata oluştu");
    }
  };

  const handleEditBook = (book: typeof books extends (infer U)[] | undefined ? U : never) => {
    setFormData({
      title: book.title,
      author: book.author,
      coverImage: book.coverImage || "",
      pageCount: book.pageCount?.toString() || "",
      currentPage: book.currentPage?.toString() || "",
      status: book.status,
      rating: book.rating?.toString() || "",
      startDate: book.startDate || "",
      finishDate: book.finishDate || "",
      notes: book.notes || "",
    });
    setEditingBook(book._id);
    setIsDialogOpen(true);
  };

  const handleDeleteBook = async (bookId: Id<"books">) => {
    try {
      await deleteBook({ bookId });
      toast.success("Kitap silindi");
    } catch (error) {
      toast.error("Kitap silinirken hata oluştu");
    }
  };

  const filteredBooks = books?.filter((book) => 
    activeTab === "all" ? true : book.status === activeTab
  );

  const completedCount = books?.filter((b) => b.status === "completed").length || 0;
  const readingCount = books?.filter((b) => b.status === "reading").length || 0;
  const wantToReadCount = books?.filter((b) => b.status === "want_to_read").length || 0;

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600">{completedCount}</div>
            <div className="text-xs text-muted-foreground">Tamamlandı</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">{readingCount}</div>
            <div className="text-xs text-muted-foreground">Okuyor</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-yellow-600">{wantToReadCount}</div>
            <div className="text-xs text-muted-foreground">Okunacak</div>
          </CardContent>
        </Card>
      </div>

      {/* Add Book Button */}
      <Dialog open={isDialogOpen} onOpenChange={(open) => {
        setIsDialogOpen(open);
        if (!open) resetForm();
      }}>
        <DialogTrigger asChild>
          <Button className="w-full gap-2">
            <PlusIconWrapper />
            Yeni Kitap Ekle
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingBook ? "Kitabı Düzenle" : "Yeni Kitap Ekle"}</DialogTitle>
            <DialogDescription>
              Okuduğun veya okumak istediğin kitapları kaydet
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Kitap Adı *</Label>
                <Input
                  placeholder="Örn: Suç ve Ceza"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Yazar *</Label>
                <Input
                  placeholder="Örn: Dostoyevski"
                  value={formData.author}
                  onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Kapak Resmi URL</Label>
              <Input
                placeholder="https://..."
                value={formData.coverImage}
                onChange={(e) => setFormData({ ...formData, coverImage: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Toplam Sayfa</Label>
                <Input
                  type="number"
                  placeholder="500"
                  value={formData.pageCount}
                  onChange={(e) => setFormData({ ...formData, pageCount: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Okunan Sayfa</Label>
                <Input
                  type="number"
                  placeholder="250"
                  value={formData.currentPage}
                  onChange={(e) => setFormData({ ...formData, currentPage: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Puan (1-5)</Label>
                <Input
                  type="number"
                  min="1"
                  max="5"
                  placeholder="5"
                  value={formData.rating}
                  onChange={(e) => setFormData({ ...formData, rating: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Durum</Label>
              <Select value={formData.status} onValueChange={(val) => setFormData({ ...formData, status: val as BookStatus })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="want_to_read">📚 Okunacak</SelectItem>
                  <SelectItem value="reading">📖 Okuyor</SelectItem>
                  <SelectItem value="completed">✅ Tamamlandı</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Başlangıç Tarihi</Label>
                <Input
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Bitiş Tarihi</Label>
                <Input
                  type="date"
                  value={formData.finishDate}
                  onChange={(e) => setFormData({ ...formData, finishDate: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Notlar</Label>
              <Textarea
                placeholder="Kitap hakkında düşünceler..."
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={3}
              />
            </div>

            <Button onClick={handleAddOrUpdateBook} className="w-full">
              {editingBook ? "Güncelle" : "Ekle"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Books List */}
      <Card>
        <CardHeader>
          <CardTitle>📚 Kitap Koleksiyonum</CardTitle>
          <CardDescription>Okuma geçmişin ve planın</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={(val) => setActiveTab(val as typeof activeTab)}>
            <TabsList className="w-full grid grid-cols-4">
              <TabsTrigger value="all">Tümü ({books?.length || 0})</TabsTrigger>
              <TabsTrigger value="reading">Okuyor ({readingCount})</TabsTrigger>
              <TabsTrigger value="completed">Bitti ({completedCount})</TabsTrigger>
              <TabsTrigger value="want_to_read">Liste ({wantToReadCount})</TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab} className="mt-4">
              {filteredBooks && filteredBooks.length > 0 ? (
                <div className="space-y-3">
                  {filteredBooks.map((book) => {
                    const progress = book.pageCount && book.currentPage
                      ? Math.min((book.currentPage / book.pageCount) * 100, 100)
                      : 0;

                    return (
                      <Card key={book._id}>
                        <CardContent className="p-4">
                          <div className="flex gap-4">
                            {/* Book Cover */}
                            {book.coverImage ? (
                              <img
                                src={book.coverImage}
                                alt={book.title}
                                className="w-20 h-28 object-cover rounded-lg"
                              />
                            ) : (
                              <div className="w-20 h-28 bg-muted rounded-lg flex items-center justify-center">
                                <BookOpenIconWrapper />
                              </div>
                            )}

                            {/* Book Info */}
                            <div className="flex-1 space-y-2">
                              <div className="flex items-start justify-between">
                                <div>
                                  <h4 className="font-bold">{book.title}</h4>
                                  <p className="text-sm text-muted-foreground">{book.author}</p>
                                </div>
                                <div className="flex gap-1">
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleEditBook(book)}
                                  >
                                    <EditIconWrapper />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleDeleteBook(book._id)}
                                  >
                                    <Trash2IconWrapper />
                                  </Button>
                                </div>
                              </div>

                              {/* Status Badge */}
                              <div className="flex items-center gap-2">
                                <span className={`inline-block w-2 h-2 rounded-full ${statusColors[book.status]}`} />
                                <span className="text-xs text-muted-foreground">{statusLabels[book.status]}</span>
                              </div>

                              {/* Rating */}
                              {book.rating && (
                                <div className="flex gap-1">
                                  {Array.from({ length: 5 }).map((_, i) => (
                                    <StarIconWrapper key={i} filled={i < book.rating!} />
                                  ))}
                                </div>
                              )}

                              {/* Progress */}
                              {book.status === "reading" && book.pageCount && (
                                <div className="space-y-1">
                                  <div className="flex justify-between text-xs text-muted-foreground">
                                    <span>{book.currentPage || 0} / {book.pageCount} sayfa</span>
                                    <span>%{Math.round(progress)}</span>
                                  </div>
                                  <Progress value={progress} className="h-2" />
                                </div>
                              )}

                              {/* Dates */}
                              {(book.startDate || book.finishDate) && (
                                <div className="text-xs text-muted-foreground">
                                  {book.startDate && <span>Başlangıç: {new Date(book.startDate).toLocaleDateString("tr-TR")}</span>}
                                  {book.startDate && book.finishDate && <span> • </span>}
                                  {book.finishDate && <span>Bitiş: {new Date(book.finishDate).toLocaleDateString("tr-TR")}</span>}
                                </div>
                              )}

                              {/* Notes */}
                              {book.notes && (
                                <p className="text-sm text-muted-foreground line-clamp-2">
                                  {book.notes}
                                </p>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <p>Henüz kitap eklemedin</p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
