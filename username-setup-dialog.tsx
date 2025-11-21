import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2, CheckCircle2, XCircle } from "lucide-react";
import { useDebounce } from "@/hooks/use-debounce";
import OnboardingScreens from "@/components/onboarding-screens.tsx";

interface UsernameSetupDialogProps {
  open: boolean;
  currentUser: { name?: string } | null;
}

export function UsernameSetupDialog({
  open,
  currentUser,
}: UsernameSetupDialogProps) {
  const [showOnboarding, setShowOnboarding] = useState(true);
  const [username, setUsername] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [gender, setGender] = useState<"female" | "male" | "">("");
  const [maritalStatus, setMaritalStatus] = useState<"single" | "in_relationship" | "married" | "divorced" | "widowed" | "">("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [debouncedUsername] = useDebounce(username, 500);

  const setUsernameMutation = useMutation(api.users.setUsername);
  const updateProfile = useMutation(api.users.updateProfile);
  const availability = useQuery(
    api.users.checkUsernameAvailability,
    debouncedUsername.length >= 3 ? { username: debouncedUsername } : "skip"
  );
  const suggestions = useQuery(
    api.users.suggestAlternativeUsernames,
    currentUser?.name ? { baseUsername: currentUser.name } : "skip"
  );

  const handleSubmit = async (selectedUsername: string) => {
    if (!selectedUsername || isSubmitting) return;
    
    if (!birthDate) {
      toast.error("Lütfen doğum tarihinizi girin");
      return;
    }
    
    if (!gender) {
      toast.error("Lütfen cinsiyetinizi seçin");
      return;
    }
    
    if (!maritalStatus) {
      toast.error("Lütfen medeni halinizi seçin");
      return;
    }

    setIsSubmitting(true);
    try {
      await setUsernameMutation({ username: selectedUsername });
      await updateProfile({ birthDate, gender, maritalStatus });
      toast.success("Profil başarıyla oluşturuldu!");
      // Dialog will close automatically when getCurrentUser updates
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Profil oluşturulamadı"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const isValid = username.length >= 3 && availability?.available && birthDate && gender && maritalStatus;

  // Show onboarding screens first
  if (showOnboarding) {
    return (
      <OnboardingScreens onComplete={() => setShowOnboarding(false)} />
    );
  }

  return (
    <Dialog open={open}>
      <DialogContent
        className="sm:max-w-md"
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>Profilini Oluştur</DialogTitle>
          <DialogDescription>
            Devam etmek için profilini tamamla. Kullanıcı adın benzersiz olmalı ve değiştirilemez.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="birthDate">Doğum Tarihi</Label>
            <Input
              id="birthDate"
              type="date"
              value={birthDate}
              onChange={(e) => setBirthDate(e.target.value)}
              max={new Date().toISOString().split('T')[0]}
            />
            <p className="text-xs text-muted-foreground">
              Yaş kontrolü için gereklidir
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="gender">Cinsiyet</Label>
            <select
              id="gender"
              value={gender}
              onChange={(e) => setGender(e.target.value as "female" | "male" | "")}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              <option value="">Seçin</option>
              <option value="female">Kadın</option>
              <option value="male">Erkek</option>
            </select>
            <p className="text-xs text-muted-foreground">
              Sağlık özelliklerini kişiselleştirmek için kullanılır
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="maritalStatus">Medeni Hal</Label>
            <select
              id="maritalStatus"
              value={maritalStatus}
              onChange={(e) => setMaritalStatus(e.target.value as "single" | "in_relationship" | "married" | "divorced" | "widowed" | "")}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              <option value="">Seçin</option>
              <option value="single">Bekar</option>
              <option value="in_relationship">İlişkide</option>
              <option value="married">Evli</option>
              <option value="divorced">Boşanmış</option>
              <option value="widowed">Dul</option>
            </select>
            <p className="text-xs text-muted-foreground">
              Profilinde göstermek istersen paylaşabilirsin
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="username">Kullanıcı Adı</Label>
            <div className="relative">
              <Input
                id="username"
                placeholder="kullaniciadi"
                value={username}
                onChange={(e) =>
                  setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))
                }
                className="pr-10"
              />
              {username.length >= 3 && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  {!availability ? (
                    <Loader2 className="size-4 animate-spin text-muted-foreground" />
                  ) : availability.available ? (
                    <CheckCircle2 className="size-4 text-green-600" />
                  ) : (
                    <XCircle className="size-4 text-destructive" />
                  )}
                </div>
              )}
            </div>
            {username.length >= 3 && availability && (
              <p
                className={`text-sm ${availability.available ? "text-green-600" : "text-destructive"}`}
              >
                {availability.message}
              </p>
            )}
            <p className="text-xs text-muted-foreground">
              3-20 karakter, sadece küçük harf, rakam ve alt çizgi
            </p>
          </div>

          <Button
            onClick={() => handleSubmit(username)}
            disabled={!isValid || isSubmitting}
            className="w-full"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 size-4 animate-spin" />
                Kaydediliyor...
              </>
            ) : (
              "Devam Et"
            )}
          </Button>

          {suggestions && suggestions.length > 0 && (
            <div className="space-y-2">
              <Label className="text-sm text-muted-foreground">
                Önerilen kullanıcı adları:
              </Label>
              <div className="flex flex-wrap gap-2">
                {suggestions.map((suggestion) => (
                  <Button
                    key={suggestion}
                    variant="outline"
                    size="sm"
                    onClick={() => handleSubmit(suggestion)}
                    disabled={isSubmitting}
                  >
                    {suggestion}
                  </Button>
                ))}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
