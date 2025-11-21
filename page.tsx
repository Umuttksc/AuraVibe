import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import MainLayout from "@/components/layout/main-layout.tsx";
import { Authenticated, Unauthenticated, AuthLoading } from "convex/react";
import { SignInButton } from "@/components/ui/signin.tsx";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card.tsx";
import { Badge } from "@/components/ui/badge.tsx";
import { Progress } from "@/components/ui/progress.tsx";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs.tsx";
import { Trophy, Users, Heart, MessageSquare, Book, Sparkles, Star, Lock } from "lucide-react";
import { cn } from "@/lib/utils.ts";

const categoryIcons = {
  social: Users,
  engagement: Heart,
  community: MessageSquare,
  wellness: Book,
  special: Star,
};

const categoryLabels = {
  social: "Sosyal",
  engagement: "Etkileşim",
  community: "Topluluk",
  wellness: "Wellness",
  special: "Özel",
};

export default function AchievementsPage() {
  return (
    <MainLayout>
      <div className="min-h-screen bg-background">
        <Authenticated>
          <AchievementsContent />
        </Authenticated>
        <Unauthenticated>
          <div className="flex flex-col items-center justify-center min-h-[80vh] px-4">
            <Trophy className="h-16 w-16 text-muted-foreground mb-4" />
            <h2 className="text-2xl font-bold mb-2">Başarılarını Keşfet</h2>
            <p className="text-muted-foreground mb-6 text-center">
              Başarılarını görmek ve ödüller kazanmak için giriş yap
            </p>
            <SignInButton />
          </div>
        </Unauthenticated>
        <AuthLoading>
          <div className="container mx-auto px-4 py-6 max-w-4xl">
            <Skeleton className="h-10 w-64 mb-6" />
            <div className="grid gap-4">
              {[...Array(6)].map((_, i) => (
                <Skeleton key={i} className="h-32 w-full" />
              ))}
            </div>
          </div>
        </AuthLoading>
      </div>
    </MainLayout>
  );
}

function AchievementsContent() {
  const achievements = useQuery(api.achievements.getUserAchievements);

  if (!achievements) {
    return (
      <div className="container mx-auto px-4 py-6 max-w-4xl">
        <Skeleton className="h-10 w-64 mb-6" />
        <div className="grid gap-4">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
      </div>
    );
  }

  const unlockedCount = achievements.filter(a => a.isUnlocked).length;
  const totalCount = achievements.length;
  const percentage = Math.round((unlockedCount / totalCount) * 100);

  // Group by category
  const grouped = achievements.reduce((acc, achievement) => {
    if (!acc[achievement.category]) {
      acc[achievement.category] = [];
    }
    acc[achievement.category].push(achievement);
    return acc;
  }, {} as Record<string, typeof achievements>);

  return (
    <div className="container mx-auto px-4 py-6 max-w-4xl md:ml-64">
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Trophy className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold">Başarılar</h1>
        </div>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">Tamamlanan Başarılar</span>
              <span className="text-sm font-semibold">{unlockedCount}/{totalCount}</span>
            </div>
            <Progress value={percentage} className="h-2" />
            <div className="text-xs text-muted-foreground mt-2 text-center">%{percentage} Tamamlandı</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="all" className="w-full">
        <TabsList className="grid w-full grid-cols-6 mb-6">
          <TabsTrigger value="all">Tümü</TabsTrigger>
          <TabsTrigger value="social">
            <Users className="h-4 w-4" />
          </TabsTrigger>
          <TabsTrigger value="engagement">
            <Heart className="h-4 w-4" />
          </TabsTrigger>
          <TabsTrigger value="community">
            <MessageSquare className="h-4 w-4" />
          </TabsTrigger>
          <TabsTrigger value="wellness">
            <Book className="h-4 w-4" />
          </TabsTrigger>
          <TabsTrigger value="special">
            <Star className="h-4 w-4" />
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          {Object.entries(grouped).map(([category, items]) => (
            <div key={category}>
              <div className="flex items-center gap-2 mb-3">
                {(() => {
                  const Icon = categoryIcons[category as keyof typeof categoryIcons];
                  return <Icon className="h-5 w-5 text-primary" />;
                })()}
                <h2 className="text-xl font-semibold">{categoryLabels[category as keyof typeof categoryLabels]}</h2>
              </div>
              <div className="grid gap-3">
                {items.map((achievement) => (
                  <AchievementCard key={achievement.id} achievement={achievement} />
                ))}
              </div>
            </div>
          ))}
        </TabsContent>

        {Object.keys(grouped).map((category) => (
          <TabsContent key={category} value={category} className="space-y-3">
            {grouped[category].map((achievement) => (
              <AchievementCard key={achievement.id} achievement={achievement} />
            ))}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}

interface AchievementCardProps {
  achievement: {
    id: string;
    title: string;
    description: string;
    icon: string;
    category: string;
    requirement: number;
    reward: { type: "none" | "tokens"; amount?: number };
    isUnlocked: boolean;
    progress: number;
    unlockedAt?: number;
  };
}

function AchievementCard({ achievement }: AchievementCardProps) {
  const progressPercentage = Math.min((achievement.progress / achievement.requirement) * 100, 100);

  return (
    <Card className={cn(
      "transition-all hover:shadow-md",
      achievement.isUnlocked ? "border-primary/50 bg-primary/5" : "opacity-70"
    )}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            <div className={cn(
              "text-4xl flex-shrink-0",
              !achievement.isUnlocked && "grayscale opacity-50"
            )}>
              {achievement.isUnlocked ? achievement.icon : <Lock className="h-10 w-10 text-muted-foreground" />}
            </div>
            <div>
              <CardTitle className="text-lg mb-1 flex items-center gap-2">
                {achievement.title}
                {achievement.isUnlocked && (
                  <Badge variant="default" className="text-xs">
                    Kazanıldı
                  </Badge>
                )}
              </CardTitle>
              <p className="text-sm text-muted-foreground">{achievement.description}</p>
            </div>
          </div>
          {achievement.reward.type === "tokens" && (
            <Badge variant="secondary" className="flex items-center gap-1 flex-shrink-0">
              <Sparkles className="h-3 w-3" />
              {achievement.reward.amount} Jeton
            </Badge>
          )}
        </div>
      </CardHeader>
      {!achievement.isUnlocked && (
        <CardContent className="pt-0">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">İlerleme</span>
              <span className="font-semibold">
                {achievement.progress}/{achievement.requirement}
              </span>
            </div>
            <Progress value={progressPercentage} className="h-2" />
          </div>
        </CardContent>
      )}
      {achievement.isUnlocked && achievement.unlockedAt && (
        <CardContent className="pt-0">
          <div className="text-xs text-muted-foreground">
            🎉 {new Date(achievement.unlockedAt).toLocaleDateString("tr-TR", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })} tarihinde kazanıldı
          </div>
        </CardContent>
      )}
    </Card>
  );
}
