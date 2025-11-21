import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import { Card } from "@/components/ui/card.tsx";
import { Button } from "@/components/ui/button.tsx";
import { BookOpen, ChevronRight, Heart, Shield, Users, Baby, Sun, Sparkles, CheckCircle2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog.tsx";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import type { Id } from "@/convex/_generated/dataModel.d.ts";

const categoryInfo: Record<
  string,
  { icon: React.ReactNode; label: string; color: string }
> = {
  general: {
    icon: <Heart className="h-5 w-5" />,
    label: "Genel Bilgiler",
    color: "from-pink-500 to-rose-500",
  },
  contraception: {
    icon: <Shield className="h-5 w-5" />,
    label: "Korunma Yöntemleri",
    color: "from-blue-500 to-cyan-500",
  },
  sti_prevention: {
    icon: <Shield className="h-5 w-5" />,
    label: "Cinsel Yolla Bulaşan Hastalıklardan Korunma",
    color: "from-purple-500 to-pink-500",
  },
  reproductive_health: {
    icon: <Baby className="h-5 w-5" />,
    label: "Üreme Sağlığı",
    color: "from-emerald-500 to-teal-500",
  },
  fertility: {
    icon: <Sun className="h-5 w-5" />,
    label: "Doğurganlık",
    color: "from-amber-500 to-orange-500",
  },
  pregnancy: {
    icon: <Baby className="h-5 w-5" />,
    label: "Hamilelik",
    color: "from-purple-500 to-pink-500",
  },
  menopause: {
    icon: <Sun className="h-5 w-5" />,
    label: "Menopoz",
    color: "from-indigo-500 to-purple-500",
  },
  hygiene: {
    icon: <Heart className="h-5 w-5" />,
    label: "Kişisel Hijyen",
    color: "from-teal-500 to-cyan-500",
  },
  relationships: {
    icon: <Users className="h-5 w-5" />,
    label: "Sağlıklı İlişkiler",
    color: "from-rose-500 to-pink-500",
  },
};

export default function SexualHealthEducation() {
  const articles = useQuery(api.sexualHealth.getArticles);
  const currentUser = useQuery(api.users.getCurrentUser);
  const [selectedArticle, setSelectedArticle] = useState<Id<"sexualHealthArticles"> | null>(null);
  const currentArticle = useQuery(
    api.sexualHealth.getArticleById,
    selectedArticle ? { articleId: selectedArticle } : "skip"
  );

  const isFemale = currentUser?.gender === "female";

  if (articles === undefined) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-24 w-full" />
        ))}
      </div>
    );
  }

  if (articles.length === 0) {
    return (
      <>
        {/* Header Card */}
        <Card className="overflow-hidden">
          <div className="bg-gradient-to-r from-rose-500 via-pink-500 to-red-500 p-6 text-white">
            <div className="flex items-start gap-4">
              <div className="h-12 w-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center flex-shrink-0">
                <span className="text-2xl">💗</span>
              </div>
              <div>
                <h2 className="text-xl font-semibold mb-2">Cinsel Sağlık Eğitimi</h2>
                <p className="text-white/90 text-sm">
                  Cinsel sağlık, korunma yöntemleri, üreme sağlığı ve sağlıklı ilişkiler hakkında 
                  kapsamlı bilgiler. Kendinizi ve sevdiklerinizi korumak için bilinçli olun.
                </p>
              </div>
            </div>
          </div>
        </Card>
        
        <Card className="p-12 text-center">
          <BookOpen className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="font-semibold text-lg mb-2">Henüz makale yok</h3>
          <p className="text-sm text-muted-foreground">
            Cinsel sağlık eğitim makaleleri yakında eklenecek
          </p>
        </Card>
      </>
    );
  }

  // Group articles by category
  const groupedArticles = articles.reduce(
    (acc, article) => {
      if (!acc[article.category]) {
        acc[article.category] = [];
      }
      acc[article.category].push(article);
      return acc;
    },
    {} as Record<string, typeof articles>
  );

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <Card className="overflow-hidden">
        <div className="bg-gradient-to-r from-rose-500 via-pink-500 to-red-500 p-6 text-white">
          <div className="flex items-start gap-4">
            <div className="h-12 w-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center flex-shrink-0">
              <span className="text-2xl">💗</span>
            </div>
            <div>
              <h2 className="text-xl font-semibold mb-2">Cinsel Sağlık Eğitimi</h2>
              <p className="text-white/90 text-sm">
                Cinsel sağlık, korunma yöntemleri, üreme sağlığı ve sağlıklı ilişkiler hakkında 
                kapsamlı bilgiler. Kendinizi ve sevdiklerinizi korumak için bilinçli olun.
              </p>
            </div>
          </div>
        </div>
      </Card>

      {/* Women's Special Health Info Card */}
      {isFemale && (
        <Card className="overflow-hidden">
          <div className="bg-gradient-to-r from-rose-500 via-pink-500 to-purple-500 p-6 text-white">
            <div className="flex items-center gap-3 mb-3">
              <div className="h-10 w-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <Sparkles className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-semibold">Kadın Sağlığı - Önemli Bilgiler</h3>
            </div>
            <p className="text-white/90 text-sm mb-4">
              Kadın sağlığı ve refahı için özel olarak hazırlanmış önemli bilgiler
            </p>
          </div>
          
          <div className="p-6 space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              {/* Regular Checkups */}
              <div className="space-y-2">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-sm">Düzenli Kontroller</h4>
                    <p className="text-xs text-muted-foreground mt-1">
                      Jinekolojik muayene yılda en az 1 kez, smear testi 3 yılda bir yapılmalıdır.
                    </p>
                  </div>
                </div>
              </div>

              {/* Self Examination */}
              <div className="space-y-2">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-sm">Kendi Kendine Muayene</h4>
                    <p className="text-xs text-muted-foreground mt-1">
                      Ayda bir meme muayenesi yapın. Herhangi bir değişiklik fark ederseniz doktora başvurun.
                    </p>
                  </div>
                </div>
              </div>

              {/* HPV Vaccine */}
              <div className="space-y-2">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-sm">HPV Aşısı</h4>
                    <p className="text-xs text-muted-foreground mt-1">
                      Rahim ağzı kanserinden korur. Genç yaşta yapılması önerilir (9-26 yaş arası).
                    </p>
                  </div>
                </div>
              </div>

              {/* Birth Control */}
              <div className="space-y-2">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-sm">Doğum Kontrolü</h4>
                    <p className="text-xs text-muted-foreground mt-1">
                      Size uygun korunma yöntemini seçmek için mutlaka doktorunuza danışın.
                    </p>
                  </div>
                </div>
              </div>

              {/* STI Testing */}
              <div className="space-y-2">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-sm">CYBH Testi</h4>
                    <p className="text-xs text-muted-foreground mt-1">
                      Cinsel olarak aktif kadınlar yılda en az 1 kez test yaptırmalıdır.
                    </p>
                  </div>
                </div>
              </div>

              {/* Menstrual Health */}
              <div className="space-y-2">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-sm">Regl Sağlığı</h4>
                    <p className="text-xs text-muted-foreground mt-1">
                      Aşırı ağrı, düzensiz adetler veya anormal kanama varsa doktora başvurun.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t">
              <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 p-4 rounded-lg">
                <p className="text-xs text-amber-900 dark:text-amber-100 font-medium">
                  ⚠️ Acil Durum: Şiddetli karın ağrısı, anormal kanama, ani şişlik veya sürekli ağrı durumunda 
                  hemen sağlık kuruluşuna başvurun.
                </p>
              </div>
            </div>
          </div>
        </Card>
      )}

      {Object.entries(groupedArticles).map(([category, categoryArticles]) => {
        const info = categoryInfo[category];
        if (!info) return null;

        return (
          <div key={category} className="space-y-3">
            <div className="flex items-center gap-2">
              <div
                className={`h-8 w-8 rounded-lg bg-gradient-to-br ${info.color} flex items-center justify-center text-white`}
              >
                {info.icon}
              </div>
              <h3 className="font-semibold text-lg">{info.label}</h3>
            </div>

            <div className="space-y-2">
              {categoryArticles.map((article) => (
                <Card
                  key={article._id}
                  className="p-4 hover:shadow-md transition-all cursor-pointer group"
                  onClick={() => setSelectedArticle(article._id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <BookOpen className="h-5 w-5 text-muted-foreground" />
                      <span className="font-medium group-hover:text-primary transition-colors">
                        {article.title}
                      </span>
                    </div>
                    <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>
                </Card>
              ))}
            </div>
          </div>
        );
      })}

      {/* Article Dialog */}
      <Dialog open={!!selectedArticle} onOpenChange={(open) => !open && setSelectedArticle(null)}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          {currentArticle && (
            <>
              <DialogHeader>
                <DialogTitle className="text-2xl">{currentArticle.title}</DialogTitle>
                <DialogDescription>
                  {categoryInfo[currentArticle.category]?.label}
                </DialogDescription>
              </DialogHeader>
              <div className="prose prose-sm dark:prose-invert max-w-none">
                <div className="whitespace-pre-wrap text-sm leading-relaxed">
                  {currentArticle.content}
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
