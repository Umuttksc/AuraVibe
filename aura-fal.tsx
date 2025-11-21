import { useQuery, useMutation, useAction } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import { Button } from "@/components/ui/button.tsx";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card.tsx";
import { Label } from "@/components/ui/label.tsx";
import { Input } from "@/components/ui/input.tsx";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select.tsx";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog.tsx";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs.tsx";
import { Plus, Trash2, Sparkles, Coffee, Upload, Sparkle, ShoppingCart, AlertCircle, Crown, Star, Globe, Lock, StickyNote, Share2, Calendar, X } from "lucide-react";
import { useState, useRef } from "react";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert.tsx";
import { Textarea } from "@/components/ui/textarea.tsx";
import type { Id } from "@/convex/_generated/dataModel.d.ts";
import { playBilling, PLAY_BILLING_PRODUCTS } from "@/lib/play-billing.ts";
import { isMobile } from "@/lib/webview-bridge.ts";

function PlusIconWrapper() {
  return <Plus className="h-4 w-4" />;
}

function Trash2IconWrapper() {
  return <Trash2 className="h-4 w-4" />;
}

function SparklesIconWrapper() {
  return <Sparkles className="h-4 w-4" />;
}

function CoffeeIconWrapper() {
  return <Coffee className="h-4 w-4" />;
}

function UploadIconWrapper() {
  return <Upload className="h-4 w-4" />;
}

function SparkleIconWrapper() {
  return <Sparkle className="h-4 w-4" />;
}

function ShoppingCartIconWrapper() {
  return <ShoppingCart className="h-4 w-4" />;
}

function AlertCircleIconWrapper() {
  return <AlertCircle className="h-4 w-4" />;
}

function CrownIconWrapper() {
  return <Crown className="h-4 w-4" />;
}

function StarIconWrapper() {
  return <Star className="h-4 w-4" />;
}

function GlobeIconWrapper() {
  return <Globe className="h-4 w-4" />;
}

function LockIconWrapper() {
  return <Lock className="h-4 w-4" />;
}

function StickyNoteIconWrapper() {
  return <StickyNote className="h-4 w-4" />;
}

function Share2IconWrapper() {
  return <Share2 className="h-4 w-4" />;
}

const categoryLabels: Record<string, string> = {
  love: "Aşk Hayatı",
  general: "Genel",
  career: "İş ve Kariyer",
  health: "Sağlık",
  money: "Para ve Finans",
};

const categoryEmojis: Record<string, string> = {
  love: "❤️",
  general: "🔮",
  career: "💼",
  health: "🏥",
  money: "💰",
};

// Turkish translations of Major Arcana
const TAROT_TURKISH: Record<string, string> = {
  "The Fool": "Deli",
  "The Magician": "Büyücü",
  "The High Priestess": "Baş Rahibe",
  "The Empress": "İmparatoriçe",
  "The Emperor": "İmparator",
  "The Hierophant": "Aziz",
  "The Lovers": "Aşıklar",
  "The Chariot": "Savaş Arabası",
  "Strength": "Güç",
  "The Hermit": "Ermiş",
  "Wheel of Fortune": "Kader Çarkı",
  "Justice": "Adalet",
  "The Hanged Man": "Asılan Adam",
  "Death": "Ölüm",
  "Temperance": "Ölçülülük",
  "The Devil": "Şeytan",
  "The Tower": "Kule",
  "The Star": "Yıldız",
  "The Moon": "Ay",
  "The Sun": "Güneş",
  "Judgement": "Mahşer",
  "The World": "Dünya"
};

// Tarot card images for each Major Arcana
const TAROT_IMAGES: Record<string, string> = {
  "The Fool": "https://images.unsplash.com/photo-1641588013627-fbd6a189501a?w=400",
  "The Magician": "https://images.unsplash.com/photo-1636392701520-e66bb50b313d?w=400",
  "The High Priestess": "https://images.unsplash.com/photo-1667068722405-90a81575b96c?w=400",
  "The Empress": "https://images.unsplash.com/photo-1643150630829-27666fe7a6bd?w=400",
  "The Emperor": "https://images.unsplash.com/photo-1630148180214-417337ce9652?w=400",
  "The Hierophant": "https://images.unsplash.com/photo-1643249659012-934e2dc66c54?w=400",
  "The Lovers": "https://images.unsplash.com/photo-1616863496857-01ffd220265e?w=400",
  "The Chariot": "https://images.unsplash.com/photo-1675805173284-4cd3be67adcf?w=400",
  "Strength": "https://images.unsplash.com/photo-1647690868150-b2132f01fb3c?w=400",
  "The Hermit": "https://images.unsplash.com/photo-1570041544732-7690bf144593?w=400",
  "Wheel of Fortune": "https://images.unsplash.com/photo-1677357623576-7c8aab08da22?w=400",
  "Justice": "https://images.unsplash.com/photo-1552591663-19c67e9e2f77?w=400",
  "The Hanged Man": "https://images.unsplash.com/photo-1621963203282-c5a32b4a13ae?w=400",
  "Death": "https://images.unsplash.com/photo-1619506147374-76d641a3a44a?w=400",
  "Temperance": "https://images.unsplash.com/photo-1547800317-96ab5a035346?w=400",
  "The Devil": "https://images.unsplash.com/photo-1618590067824-5ba32ca76ce9?w=400",
  "The Tower": "https://images.unsplash.com/photo-1674841151927-0012be37e7ef?w=400",
  "The Star": "https://images.unsplash.com/photo-1570041544732-7690bf144593?w=400",
  "The Moon": "https://images.unsplash.com/photo-1667068722405-90a81575b96c?w=400",
  "The Sun": "https://images.unsplash.com/photo-1630148180214-417337ce9652?w=400",
  "Judgement": "https://images.unsplash.com/photo-1711994872307-34c9e0216e95?w=400",
  "The World": "https://images.unsplash.com/photo-1677357623576-7c8aab08da22?w=400"
};

type FortuneCategory = "love" | "general" | "career" | "health" | "money";
type FortuneType = "coffee" | "tarot" | "palm" | "birthchart" | "aura";

export default function AuraFal() {
  // Date filter states
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  
  const fortunes = useQuery(api.fortunes.getFortunes, {
    startDate: startDate || undefined,
    endDate: endDate || undefined,
  });
  const addFortune = useMutation(api.fortunes.addFortune);
  const toggleFortuneHidden = useMutation(api.fortunes.toggleFortuneHidden);
  const generateUploadUrl = useMutation(api.fortunes.generateUploadUrl);
  const interpretFortune = useAction(api.fortuneInterpretation.interpretFortune);
  const interpretTarot = useAction(api.tarotInterpretation.interpretTarot);
  const interpretPalmReading = useAction(api.fortuneInterpretation.interpretPalmReading);
  const interpretBirthChart = useAction(api.fortuneInterpretation.interpretBirthChart);
  const interpretAuraReading = useAction(api.fortuneInterpretation.interpretAuraReading);
  const useFreeFortuneIfAvailable = useMutation(api.fortuneUsage.useFreeFortuneIfAvailable);
  const createFortuneCheckout = useAction(api.fortunePayments.createFortuneCheckout);
  const createPremiumCheckout = useAction(api.fortunePayments.createPremiumCheckout);
  const recordPlayBillingFortunePayment = useMutation(api.fortuneUsage.recordPlayBillingFortunePayment);
  const recordPlayBillingPremiumSubscription = useMutation(api.fortuneUsage.recordPlayBillingPremiumSubscription);
  const toggleFortuneFavorite = useMutation(api.fortunes.toggleFortuneFavorite);
  const toggleFortunePublic = useMutation(api.fortunes.toggleFortunePublic);
  const updateFortuneNotes = useMutation(api.fortunes.updateFortuneNotes);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  const [interpretingId, setInterpretingId] = useState<Id<"fortunes"> | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [category, setCategory] = useState<FortuneCategory>("general");
  const [fortuneType, setFortuneType] = useState<FortuneType | "">("");
  const [filterTab, setFilterTab] = useState<"all" | "favorites" | "public">("all");
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Birth chart fields
  const [birthDate, setBirthDate] = useState("");
  const [birthTime, setBirthTime] = useState("");
  const [birthPlace, setBirthPlace] = useState("");

  // Clean up preview when fortune type changes
  const handleFortuneTypeChange = (newType: FortuneType | "") => {
    setFortuneType(newType);
    // Clear file and preview when switching tabs
    setSelectedFile(null);
    setPreviewUrl(null);
    // Clear birth chart fields if switching away from birthchart
    if (newType !== "birthchart") {
      setBirthDate("");
      setBirthTime("");
      setBirthPlace("");
    }
  };

  // Check availability for current fortune type
  const coffeeAvailability = useQuery(api.fortuneUsage.checkFortuneAvailability, {
    fortuneType: "coffee",
  });
  const tarotAvailability = useQuery(api.fortuneUsage.checkFortuneAvailability, {
    fortuneType: "tarot",
  });
  const palmAvailability = useQuery(api.fortuneUsage.checkFortuneAvailability, {
    fortuneType: "palm",
  });
  const birthchartAvailability = useQuery(api.fortuneUsage.checkFortuneAvailability, {
    fortuneType: "birthchart",
  });
  const auraAvailability = useQuery(api.fortuneUsage.checkFortuneAvailability, {
    fortuneType: "aura",
  });
  const pricing = useQuery(api.fortuneUsage.getPricingSettings);
  const premiumSettings = useQuery(api.fortuneUsage.getPremiumSettings);

  const currentAvailability = 
    fortuneType === "coffee" ? coffeeAvailability :
    fortuneType === "tarot" ? tarotAvailability :
    fortuneType === "palm" ? palmAvailability :
    fortuneType === "birthchart" ? birthchartAvailability :
    auraAvailability;

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        toast.error("Dosya boyutu 10MB'dan küçük olmalıdır");
        return;
      }
      if (!file.type.startsWith("image/")) {
        toast.error("Sadece resim dosyaları yüklenebilir");
        return;
      }
      setSelectedFile(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  const handleAddCoffeeFortune = async () => {
    if (!selectedFile) {
      toast.error("Lütfen bir fincan fotoğrafı seçin");
      return;
    }

    setIsUploading(true);
    try {
      // Try to use free fortune or paid credit
      // eslint-disable-next-line react-hooks/rules-of-hooks
      const freeResult = await useFreeFortuneIfAvailable({ fortuneType: "coffee" });
      
      if (!freeResult.success) {
        // No free or paid credits available, requires payment
        toast.info("Günlük ücretsiz hakkınız bitti. Ödeme yapmanız gerekiyor.");
        setIsPaymentDialogOpen(true);
        setIsUploading(false);
        return;
      }

      // Upload image
      const uploadUrl = await generateUploadUrl();
      const result = await fetch(uploadUrl, {
        method: "POST",
        headers: { "Content-Type": selectedFile.type },
        body: selectedFile,
      });

      if (!result.ok) {
        throw new Error("Fotoğraf yüklenemedi");
      }

      const { storageId } = await result.json();

      // Add fortune (with paymentId if used paid credit)
      await addFortune({
        fortuneType: "coffee",
        imageId: storageId,
        category,
        date: new Date().toISOString().split("T")[0],
        paymentId: freeResult.paymentId,
      });

      toast.success("Fincan fotoğrafı yüklendi!");
      resetForm();
    } catch (error) {
      toast.error("Fotoğraf yüklenirken hata oluştu");
    } finally {
      setIsUploading(false);
    }
  };

  const handleAddTarotFortune = async () => {
    setIsUploading(true);
    try {
      // Try to use free fortune or paid credit
      // eslint-disable-next-line react-hooks/rules-of-hooks
      const freeResult = await useFreeFortuneIfAvailable({ fortuneType: "tarot" });
      
      if (!freeResult.success) {
        // No free or paid credits available, requires payment
        toast.info("Günlük ücretsiz hakkınız bitti. Ödeme yapmanız gerekiyor.");
        setIsPaymentDialogOpen(true);
        setIsUploading(false);
        return;
      }

      // Add tarot fortune (with paymentId if used paid credit)
      await addFortune({
        fortuneType: "tarot",
        category,
        date: new Date().toISOString().split("T")[0],
        tarotCards: [], // Will be filled when interpreted
        paymentId: freeResult.paymentId,
      });

      toast.success("Tarot yayılımı hazırlandı!");
      resetForm();
    } catch (error) {
      toast.error("Tarot yayılımı eklenirken hata oluştu");
    } finally {
      setIsUploading(false);
    }
  };

  const handleAddPalmFortune = async () => {
    if (!selectedFile) {
      toast.error("Lütfen bir el fotoğrafı seçin");
      return;
    }

    setIsUploading(true);
    try {
      // Try to use free fortune or paid credit
      // eslint-disable-next-line react-hooks/rules-of-hooks
      const freeResult = await useFreeFortuneIfAvailable({ fortuneType: "palm" });
      
      if (!freeResult.success) {
        toast.info("Günlük ücretsiz hakkınız bitti. Ödeme yapmanız gerekiyor.");
        setIsPaymentDialogOpen(true);
        setIsUploading(false);
        return;
      }

      // Upload image
      const uploadUrl = await generateUploadUrl();
      const result = await fetch(uploadUrl, {
        method: "POST",
        headers: { "Content-Type": selectedFile.type },
        body: selectedFile,
      });

      if (!result.ok) {
        throw new Error("Fotoğraf yüklenemedi");
      }

      const { storageId } = await result.json();

      // Add palm fortune (with paymentId if used paid credit)
      await addFortune({
        fortuneType: "palm",
        imageId: storageId,
        category,
        date: new Date().toISOString().split("T")[0],
        paymentId: freeResult.paymentId,
      });

      toast.success("El fotoğrafı yüklendi!");
      resetForm();
    } catch (error) {
      toast.error("Fotoğraf yüklenirken hata oluştu");
    } finally {
      setIsUploading(false);
    }
  };

  const handleAddAuraFortune = async () => {
    if (!selectedFile) {
      toast.error("Lütfen bir fotoğraf seçin");
      return;
    }

    setIsUploading(true);
    try {
      // Try to use free fortune or paid credit
      // eslint-disable-next-line react-hooks/rules-of-hooks
      const freeResult = await useFreeFortuneIfAvailable({ fortuneType: "aura" });
      
      if (!freeResult.success) {
        toast.info("Günlük ücretsiz hakkınız bitti. Ödeme yapmanız gerekiyor.");
        setIsPaymentDialogOpen(true);
        setIsUploading(false);
        return;
      }

      // Upload image
      const uploadUrl = await generateUploadUrl();
      const result = await fetch(uploadUrl, {
        method: "POST",
        headers: { "Content-Type": selectedFile.type },
        body: selectedFile,
      });

      if (!result.ok) {
        throw new Error("Fotoğraf yüklenemedi");
      }

      const { storageId } = await result.json();

      // Add aura fortune (with paymentId if used paid credit)
      await addFortune({
        fortuneType: "aura",
        imageId: storageId,
        category,
        date: new Date().toISOString().split("T")[0],
        paymentId: freeResult.paymentId,
      });

      toast.success("Fotoğraf yüklendi!");
      resetForm();
    } catch (error) {
      toast.error("Fotoğraf yüklenirken hata oluştu");
    } finally {
      setIsUploading(false);
    }
  };

  const handleAddBirthChartFortune = async () => {
    if (!birthDate || !birthTime || !birthPlace) {
      toast.error("Lütfen tüm doğum bilgilerini girin");
      return;
    }

    setIsUploading(true);
    try {
      // Try to use free fortune or paid credit
      // eslint-disable-next-line react-hooks/rules-of-hooks
      const freeResult = await useFreeFortuneIfAvailable({ fortuneType: "birthchart" });
      
      if (!freeResult.success) {
        toast.info("Günlük ücretsiz hakkınız bitti. Ödeme yapmanız gerekiyor.");
        setIsPaymentDialogOpen(true);
        setIsUploading(false);
        return;
      }

      // Add birth chart fortune (with paymentId if used paid credit)
      await addFortune({
        fortuneType: "birthchart",
        category,
        date: new Date().toISOString().split("T")[0],
        birthDate,
        birthTime,
        birthPlace,
        paymentId: freeResult.paymentId,
      });

      toast.success("Doğum haritası hazırlandı!");
      resetForm();
    } catch (error) {
      toast.error("Doğum haritası eklenirken hata oluştu");
    } finally {
      setIsUploading(false);
    }
  };

  const resetForm = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setCategory("general");
    setFortuneType("");
    setBirthDate("");
    setBirthTime("");
    setBirthPlace("");
    setIsDialogOpen(false);
  };

  const handlePayForSingleFortune = async () => {
    try {
      // Check which fortune types are supported
      if (fortuneType !== "coffee" && fortuneType !== "tarot" && fortuneType !== "palm" && fortuneType !== "birthchart" && fortuneType !== "aura") {
        toast.error("Bu fal tipi için ödeme henüz desteklenmiyor");
        return;
      }

      // Check if on mobile and Play Billing is available
      if (isMobile() && playBilling.isAvailable()) {
        toast.info("Ödeme işlemi başlatılıyor...");
        
        // Initialize Play Billing
        const initialized = await playBilling.initialize();
        if (!initialized) {
          toast.error("Ödeme sistemi başlatılamadı. Web ödeme sayfasına yönlendiriliyorsunuz...");
          // Fallback to Stripe
          if (fortuneType === "coffee" || fortuneType === "tarot") {
            const { url } = await createFortuneCheckout({
              fortuneType,
              successUrl: `${window.location.origin}/wellness?payment=success`,
              cancelUrl: `${window.location.origin}/wellness?payment=cancel`,
            });
            if (url) {
              window.location.href = url;
            }
          }
          return;
        }

        // Get product ID for this fortune type
        const productIdMap = {
          coffee: PLAY_BILLING_PRODUCTS.FORTUNE_COFFEE,
          tarot: PLAY_BILLING_PRODUCTS.FORTUNE_TAROT,
          palm: PLAY_BILLING_PRODUCTS.FORTUNE_PALM,
          birthchart: PLAY_BILLING_PRODUCTS.FORTUNE_BIRTHCHART,
          aura: PLAY_BILLING_PRODUCTS.FORTUNE_AURA,
        };
        const productId = productIdMap[fortuneType];

        // Query product to get price
        const products = await playBilling.queryProducts([productId]);
        if (products.length === 0) {
          toast.error("Ürün bulunamadı");
          return;
        }

        // Purchase
        const purchase = await playBilling.purchase(productId);
        if (purchase) {
          toast.success("Ödeme başarılı! Fal hakkınız tanımlanıyor...");
          
          // Record payment in database
          await recordPlayBillingFortunePayment({
            fortuneType,
            orderId: purchase.orderId,
            purchaseToken: purchase.purchaseToken,
            productId: purchase.productId,
            amount: products[0].priceAmountMicros / 10000, // Convert micros to kuruş
          });

          // Consume the purchase (it's a one-time purchase)
          await playBilling.consumePurchase(purchase.purchaseToken);

          toast.success("Fal hakkınız tanımlandı! Artık fal baktırabilirsiniz.");
          setIsPaymentDialogOpen(false);
        }
      } else {
        // Web or Play Billing not available - use Stripe
        if (fortuneType !== "coffee" && fortuneType !== "tarot") {
          toast.error("Bu fal tipi için web ödemesi henüz desteklenmiyor");
          return;
        }
        const { url } = await createFortuneCheckout({
          fortuneType,
          successUrl: `${window.location.origin}/wellness?payment=success`,
          cancelUrl: `${window.location.origin}/wellness?payment=cancel`,
        });

        if (url) {
          window.location.href = url;
        }
      }
    } catch (error) {
      toast.error("Ödeme işlemi başarısız oldu");
      console.error(error);
    }
  };

  const handlePurchasePremium = async () => {
    try {
      // Check if on mobile and Play Billing is available
      if (isMobile() && playBilling.isAvailable()) {
        toast.info("Ödeme işlemi başlatılıyor...");
        
        // Initialize Play Billing
        const initialized = await playBilling.initialize();
        if (!initialized) {
          toast.error("Ödeme sistemi başlatılamadı. Web ödeme sayfasına yönlendiriliyorsunuz...");
          // Fallback to Stripe
          const { url } = await createPremiumCheckout({
            successUrl: `${window.location.origin}/wellness?payment=success&type=premium`,
            cancelUrl: `${window.location.origin}/wellness?payment=cancel`,
          });
          if (url) {
            window.location.href = url;
          }
          return;
        }

        // Get premium subscription product
        const productId = PLAY_BILLING_PRODUCTS.PREMIUM_MONTHLY;
        const products = await playBilling.queryProducts([productId]);
        if (products.length === 0) {
          toast.error("Ürün bulunamadı");
          return;
        }

        // Purchase subscription
        const purchase = await playBilling.purchase(productId);
        if (purchase) {
          toast.success("Ödeme başarılı! Premium üyeliğiniz aktifleştiriliyor...");
          
          // Record subscription in database
          await recordPlayBillingPremiumSubscription({
            orderId: purchase.orderId,
            purchaseToken: purchase.purchaseToken,
            productId: purchase.productId,
            amount: products[0].priceAmountMicros / 10000, // Convert micros to kuruş
          });

          toast.success("Premium üyeliğiniz aktif! Artık sınırsız fal baktırabilirsiniz.");
          setIsPaymentDialogOpen(false);
        }
      } else {
        // Web or Play Billing not available - use Stripe
        const { url } = await createPremiumCheckout({
          successUrl: `${window.location.origin}/wellness?payment=success&type=premium`,
          cancelUrl: `${window.location.origin}/wellness?payment=cancel`,
        });

        if (url) {
          window.location.href = url;
        }
      }
    } catch (error) {
      toast.error("Ödeme işlemi başarısız oldu");
      console.error(error);
    }
  };

  const handleToggleHidden = async (fortuneId: Id<"fortunes">) => {
    try {
      const result = await toggleFortuneHidden({ fortuneId });
      toast.success(result.isHidden ? "Fal gizlendi" : "Fal gösterildi");
    } catch (error) {
      toast.error("İşlem başarısız oldu");
    }
  };

  const handleInterpretCoffeeFortune = async (fortuneId: Id<"fortunes">, imageUrl: string, category: FortuneCategory) => {
    setInterpretingId(fortuneId);
    try {
      await interpretFortune({ fortuneId, imageUrl, category });
      toast.success("Falın yorumlandı!");
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Fal yorumlanırken hata oluştu";
      toast.error(errorMessage);
    } finally {
      setInterpretingId(null);
    }
  };

  const handleInterpretTarot = async (fortuneId: Id<"fortunes">, category: FortuneCategory) => {
    setInterpretingId(fortuneId);
    try {
      await interpretTarot({ fortuneId, category });
      toast.success("Tarot yorumlandı!");
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Tarot yorumlanırken hata oluştu";
      toast.error(errorMessage);
    } finally {
      setInterpretingId(null);
    }
  };

  const handleInterpretPalmReading = async (fortuneId: Id<"fortunes">, imageUrl: string, category: FortuneCategory) => {
    setInterpretingId(fortuneId);
    try {
      await interpretPalmReading({ fortuneId, imageUrl, category });
      toast.success("El falı yorumlandı!");
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "El falı yorumlanırken hata oluştu";
      toast.error(errorMessage);
    } finally {
      setInterpretingId(null);
    }
  };

  const handleInterpretBirthChart = async (fortuneId: Id<"fortunes">, birthDate: string, birthTime: string, birthPlace: string, category: FortuneCategory) => {
    setInterpretingId(fortuneId);
    try {
      await interpretBirthChart({ fortuneId, birthDate, birthTime, birthPlace, category });
      toast.success("Doğum haritası yorumlandı!");
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Doğum haritası yorumlanırken hata oluştu";
      toast.error(errorMessage);
    } finally {
      setInterpretingId(null);
    }
  };

  const handleInterpretAuraReading = async (fortuneId: Id<"fortunes">, imageUrl: string, category: FortuneCategory) => {
    setInterpretingId(fortuneId);
    try {
      await interpretAuraReading({ fortuneId, imageUrl, category });
      toast.success("Aura okuma yorumlandı!");
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Aura okuma yorumlanırken hata oluştu";
      toast.error(errorMessage);
    } finally {
      setInterpretingId(null);
    }
  };

  const handleToggleFavorite = async (fortuneId: Id<"fortunes">) => {
    try {
      const result = await toggleFortuneFavorite({ fortuneId });
      toast.success(result.isFavorite ? "Favorilere eklendi" : "Favorilerden çıkarıldı");
    } catch (error) {
      toast.error("İşlem başarısız oldu");
    }
  };

  const handleTogglePublic = async (fortuneId: Id<"fortunes">) => {
    try {
      const result = await toggleFortunePublic({ fortuneId });
      toast.success(result.isPublic ? "Fal herkese açık" : "Fal gizlendi");
    } catch (error) {
      toast.error("İşlem başarısız oldu");
    }
  };

  const handleUpdateNotes = async (fortuneId: Id<"fortunes">, notes: string) => {
    try {
      await updateFortuneNotes({ fortuneId, notes });
      toast.success("Notlar kaydedildi");
    } catch (error) {
      toast.error("Notlar kaydedilemedi");
    }
  };

  // Filter fortunes based on selected tab
  const filteredFortunes = fortunes?.filter((f) => {
    if (filterTab === "favorites") return f.isFavorite === true;
    if (filterTab === "public") return f.isPublic === true;
    return true;
  }) || [];

  const totalFortunes = fortunes?.length || 0;
  const interpretedFortunes = fortunes?.filter((f) => f.isInterpreted).length || 0;
  const favoriteFortunes = fortunes?.filter((f) => f.isFavorite === true).length || 0;
  const publicFortunes = fortunes?.filter((f) => f.isPublic === true).length || 0;
  const coffeeFortunes = filteredFortunes.filter((f) => f.fortuneType === "coffee");
  const tarotFortunes = filteredFortunes.filter((f) => f.fortuneType === "tarot");
  const palmFortunes = filteredFortunes.filter((f) => f.fortuneType === "palm");
  const birthchartFortunes = filteredFortunes.filter((f) => f.fortuneType === "birthchart");
  const auraFortunes = filteredFortunes.filter((f) => f.fortuneType === "aura");

  const isPremium = currentAvailability?.isPremium ?? false;
  const isUnlimited = isPremium && (currentAvailability?.freeRemaining === -1);

  return (
    <div className="space-y-6">
      {/* Usage Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-amber-600">{totalFortunes}</div>
            <div className="text-xs text-muted-foreground">Toplam Fal</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-purple-600">{interpretedFortunes}</div>
            <div className="text-xs text-muted-foreground">Yorumlandı</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600">
              {isUnlimited ? "∞" : coffeeAvailability?.freeRemaining ?? 0}
            </div>
            <div className="text-xs text-muted-foreground">☕ Kalan Ücretsiz</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            {isPremium ? (
              <>
                <div className="text-xl font-bold text-amber-500 flex items-center justify-center gap-1">
                  <CrownIconWrapper />
                  <span>Premium</span>
                </div>
                <div className="text-xs text-muted-foreground">Aktif</div>
              </>
            ) : (
              <>
                <div className="text-2xl font-bold text-gray-400">-</div>
                <div className="text-xs text-muted-foreground">Premium Değil</div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Premium Upgrade Banner */}
      {!isPremium && premiumSettings && (
        <Alert className="border-purple-200 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20">
          <CrownIconWrapper />
          <AlertDescription className="flex items-center justify-between">
            <div>
              <p className="font-semibold">⭐ Premium'a geçin!</p>
              <p className="text-sm text-muted-foreground">
                Sınırsız fal bakma ve özel özellikler için ₺{(premiumSettings.monthlyPrice / 100).toFixed(2)}/ay
              </p>
            </div>
            <Button onClick={handlePurchasePremium} variant="default" size="sm">
              Premium Ol
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Add Fortune Button */}
      <Dialog open={isDialogOpen} onOpenChange={(open) => {
        setIsDialogOpen(open);
        if (!open) resetForm();
      }}>
        <DialogTrigger asChild>
          <Button className="w-full gap-2">
            <PlusIconWrapper />
            Yeni Fal Baktır
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>✨ {fortuneType === "" ? "Fal Seç" : "Fal Baktır"}</DialogTitle>
            <DialogDescription>
              {fortuneType === "" ? "Hangi falı baktırmak istiyorsun?" : "Formu doldur ve falını baktır"}
            </DialogDescription>
          </DialogHeader>

          {fortuneType === "" ? (
            /* Grid Selection */
            <div className="grid grid-cols-3 gap-5 py-6">
              <Card 
                className="cursor-pointer hover:shadow-xl hover:border-amber-500 transition-all border-2 h-full"
                onClick={() => handleFortuneTypeChange("coffee")}
              >
                <CardContent className="p-6 flex flex-col items-center justify-center text-center h-full min-h-[180px]">
                  <div className="text-5xl mb-3">☕</div>
                  <p className="font-bold text-base mb-1">Kahve Falı</p>
                  <p className="text-xs text-muted-foreground">Fincan fotoğrafı</p>
                </CardContent>
              </Card>

              <Card 
                className="cursor-pointer hover:shadow-xl hover:border-purple-500 transition-all border-2 h-full"
                onClick={() => handleFortuneTypeChange("tarot")}
              >
                <CardContent className="p-6 flex flex-col items-center justify-center text-center h-full min-h-[180px]">
                  <div className="text-5xl mb-3">🔮</div>
                  <p className="font-bold text-base mb-1">Tarot</p>
                  <p className="text-xs text-muted-foreground">3 kart yayılımı</p>
                </CardContent>
              </Card>

              <Card 
                className="cursor-pointer hover:shadow-xl hover:border-blue-500 transition-all border-2 h-full"
                onClick={() => handleFortuneTypeChange("palm")}
              >
                <CardContent className="p-6 flex flex-col items-center justify-center text-center h-full min-h-[180px]">
                  <div className="text-5xl mb-3">🤚</div>
                  <p className="font-bold text-base mb-1">El Falı</p>
                  <p className="text-xs text-muted-foreground">Avuç içi analizi</p>
                </CardContent>
              </Card>

              <Card 
                className="cursor-pointer hover:shadow-xl hover:border-indigo-500 transition-all border-2 h-full"
                onClick={() => handleFortuneTypeChange("birthchart")}
              >
                <CardContent className="p-6 flex flex-col items-center justify-center text-center h-full min-h-[180px]">
                  <div className="text-5xl mb-3">⭐</div>
                  <p className="font-bold text-base mb-1">Doğum Haritası</p>
                  <p className="text-xs text-muted-foreground">Astroloji analizi</p>
                </CardContent>
              </Card>

              <Card 
                className="cursor-pointer hover:shadow-xl hover:border-violet-500 transition-all border-2 h-full"
                onClick={() => handleFortuneTypeChange("aura")}
              >
                <CardContent className="p-6 flex flex-col items-center justify-center text-center h-full min-h-[180px]">
                  <div className="text-5xl mb-3">✨</div>
                  <p className="font-bold text-base mb-1">Aura Okuma</p>
                  <p className="text-xs text-muted-foreground">Enerji analizi</p>
                </CardContent>
              </Card>
            </div>
          ) : fortuneType === "coffee" ? (
            <div className="space-y-6 mt-4">
              <Button variant="ghost" size="sm" onClick={() => handleFortuneTypeChange("")}>← Geri Dön</Button>
              <div className="bg-amber-50 dark:bg-amber-950/20 p-4 rounded-lg text-center">
                <Coffee className="h-8 w-8 mx-auto mb-2 text-amber-600" />
                <p className="text-sm text-muted-foreground">
                  Fincan fotoğrafı yükle, AI yorumlasın
                </p>
              </div>

              {/* Category Selection - First */}
              <div className="space-y-2">
                <Label className="text-base font-semibold">Ne Hakkında Fal Baktırmak İstiyorsun?</Label>
                <Select value={category} onValueChange={(val) => setCategory(val as FortuneCategory)}>
                  <SelectTrigger className="h-11">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="love">{categoryEmojis.love} Aşk Hayatı</SelectItem>
                    <SelectItem value="general">{categoryEmojis.general} Genel</SelectItem>
                    <SelectItem value="career">{categoryEmojis.career} İş ve Kariyer</SelectItem>
                    <SelectItem value="health">{categoryEmojis.health} Sağlık</SelectItem>
                    <SelectItem value="money">{categoryEmojis.money} Para ve Finans</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Coffee Fortune - Image Upload */}
              <div className="space-y-2">
                <Label className="text-base font-semibold">Fincan Fotoğrafı *</Label>
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-amber-300 dark:border-amber-700 rounded-lg p-8 text-center cursor-pointer hover:border-amber-500 hover:bg-amber-50/50 dark:hover:bg-amber-950/30 transition-all"
                >
                  {previewUrl && selectedFile ? (
                    <div className="space-y-3">
                      <img 
                        src={previewUrl} 
                        alt="Preview" 
                        className="max-h-64 mx-auto rounded-lg object-contain shadow-lg"
                      />
                      <p className="text-xs text-muted-foreground">Değiştirmek için tekrar tıkla</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <Upload className="h-12 w-12 mx-auto text-amber-600" />
                      <div>
                        <p className="font-medium text-amber-900 dark:text-amber-100">
                          Fincan fotoğrafını seç
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Tıkla ve fotoğrafını yükle
                        </p>
                      </div>
                    </div>
                  )}
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </div>

              <Button 
                onClick={handleAddCoffeeFortune} 
                className="w-full h-11 text-base"
                disabled={isUploading || !selectedFile}
              >
                {isUploading ? "Yükleniyor..." : "☕ Fal Baktır"}
              </Button>
            </div>
          ) : fortuneType === "tarot" ? (
            <div className="space-y-6 mt-4">
              <Button variant="ghost" size="sm" onClick={() => handleFortuneTypeChange("")}>← Geri Dön</Button>
              {/* Tarot - No image needed */}
              <div className="bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-950/40 dark:to-pink-950/40 p-6 rounded-lg text-center space-y-3">
                <Sparkle className="h-10 w-10 mx-auto text-purple-600" />
                <div>
                  <p className="font-semibold text-purple-900 dark:text-purple-100">3 Kartlı Tarot Yayılımı</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    AI senin için 3 tarot kartı çekecek ve geçmiş-şimdi-gelecek yayılımını yorumlayacak
                  </p>
                </div>
              </div>

              {/* Category Selection */}
              <div className="space-y-2">
                <Label className="text-base font-semibold">Ne Hakkında Tarot Baktırmak İstiyorsun?</Label>
                <Select value={category} onValueChange={(val) => setCategory(val as FortuneCategory)}>
                  <SelectTrigger className="h-11">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="love">{categoryEmojis.love} Aşk Hayatı</SelectItem>
                    <SelectItem value="general">{categoryEmojis.general} Genel</SelectItem>
                    <SelectItem value="career">{categoryEmojis.career} İş ve Kariyer</SelectItem>
                    <SelectItem value="health">{categoryEmojis.health} Sağlık</SelectItem>
                    <SelectItem value="money">{categoryEmojis.money} Para ve Finans</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button 
                onClick={handleAddTarotFortune} 
                className="w-full h-11 text-base bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                disabled={isUploading}
              >
                {isUploading ? "Hazırlanıyor..." : "🔮 Kartları Çek"}
              </Button>
            </div>
          ) : fortuneType === "palm" ? (
            <div className="space-y-6 mt-4">
              <Button variant="ghost" size="sm" onClick={() => handleFortuneTypeChange("")}>← Geri Dön</Button>
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 p-4 rounded-lg text-center">
                <div className="text-4xl mb-2">🤚</div>
                <p className="text-sm text-muted-foreground">
                  El fotoğrafı yükle, AI avuç içi çizgilerini analiz etsin
                </p>
              </div>

              {/* Category Selection */}
              <div className="space-y-2">
                <Label className="text-base font-semibold">Ne Hakkında El Falı Baktırmak İstiyorsun?</Label>
                <Select value={category} onValueChange={(val) => setCategory(val as FortuneCategory)}>
                  <SelectTrigger className="h-11">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="love">{categoryEmojis.love} Aşk Hayatı</SelectItem>
                    <SelectItem value="general">{categoryEmojis.general} Genel</SelectItem>
                    <SelectItem value="career">{categoryEmojis.career} İş ve Kariyer</SelectItem>
                    <SelectItem value="health">{categoryEmojis.health} Sağlık</SelectItem>
                    <SelectItem value="money">{categoryEmojis.money} Para ve Finans</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Palm Reading - Image Upload */}
              <div className="space-y-2">
                <Label className="text-base font-semibold">El Fotoğrafı *</Label>
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-blue-300 dark:border-blue-700 rounded-lg p-8 text-center cursor-pointer hover:border-blue-500 hover:bg-blue-50/50 dark:hover:bg-blue-950/30 transition-all"
                >
                  {previewUrl && selectedFile ? (
                    <div className="space-y-3">
                      <img 
                        src={previewUrl} 
                        alt="Preview" 
                        className="max-h-64 mx-auto rounded-lg object-contain shadow-lg"
                      />
                      <p className="text-xs text-muted-foreground">Değiştirmek için tekrar tıkla</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <Upload className="h-12 w-12 mx-auto text-blue-600" />
                      <div>
                        <p className="font-medium text-blue-900 dark:text-blue-100">
                          El fotoğrafını seç
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Avuç içini net görebilecek şekilde çek
                        </p>
                      </div>
                    </div>
                  )}
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </div>

              <Button 
                onClick={handleAddPalmFortune} 
                className="w-full h-11 text-base"
                disabled={isUploading || !selectedFile}
              >
                {isUploading ? "Yükleniyor..." : "🤚 El Falı Baktır"}
              </Button>
            </div>
          ) : fortuneType === "birthchart" ? (
            <div className="space-y-6 mt-4">
              <Button variant="ghost" size="sm" onClick={() => handleFortuneTypeChange("")}>← Geri Dön</Button>
              {/* Birth Chart - Form */}
              <div className="bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-950/40 dark:to-purple-950/40 p-6 rounded-lg text-center space-y-3">
                <div className="text-4xl">⭐</div>
                <div>
                  <p className="font-semibold text-indigo-900 dark:text-indigo-100">Astrolojik Doğum Haritası</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Doğum bilgilerinize göre kişisel doğum haritanız oluşturulacak ve yorumlanacak
                  </p>
                </div>
              </div>

              {/* Category Selection */}
              <div className="space-y-2">
                <Label className="text-base font-semibold">Ne Hakkında Doğum Haritası Baktırmak İstiyorsun?</Label>
                <Select value={category} onValueChange={(val) => setCategory(val as FortuneCategory)}>
                  <SelectTrigger className="h-11">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="love">{categoryEmojis.love} Aşk Hayatı</SelectItem>
                    <SelectItem value="general">{categoryEmojis.general} Genel</SelectItem>
                    <SelectItem value="career">{categoryEmojis.career} İş ve Kariyer</SelectItem>
                    <SelectItem value="health">{categoryEmojis.health} Sağlık</SelectItem>
                    <SelectItem value="money">{categoryEmojis.money} Para ve Finans</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-1 gap-4">
                {/* Birth Date */}
                <div className="space-y-2">
                  <Label className="text-base font-semibold">Doğum Tarihi *</Label>
                  <input
                    type="date"
                    value={birthDate}
                    onChange={(e) => setBirthDate(e.target.value)}
                    className="w-full h-11 px-4 py-2 border border-input rounded-md bg-background text-foreground"
                  />
                </div>

                {/* Birth Time */}
                <div className="space-y-2">
                  <Label className="text-base font-semibold">Doğum Saati *</Label>
                  <input
                    type="time"
                    value={birthTime}
                    onChange={(e) => setBirthTime(e.target.value)}
                    className="w-full h-11 px-4 py-2 border border-input rounded-md bg-background text-foreground"
                  />
                </div>

                {/* Birth Place */}
                <div className="space-y-2">
                  <Label className="text-base font-semibold">Doğum Yeri *</Label>
                  <input
                    type="text"
                    value={birthPlace}
                    onChange={(e) => setBirthPlace(e.target.value)}
                    placeholder="Örn: İstanbul, Türkiye"
                    className="w-full h-11 px-4 py-2 border border-input rounded-md bg-background text-foreground"
                  />
                </div>
              </div>

              <Button 
                onClick={handleAddBirthChartFortune} 
                className="w-full h-11 text-base"
                disabled={isUploading || !birthDate || !birthTime || !birthPlace}
              >
                {isUploading ? "Hazırlanıyor..." : "⭐ Doğum Haritası Oluştur"}
              </Button>
            </div>
          ) : (
            <div className="space-y-6 mt-4">
              <Button variant="ghost" size="sm" onClick={() => handleFortuneTypeChange("")}>← Geri Dön</Button>
              <div className="bg-gradient-to-br from-violet-50 to-fuchsia-50 dark:from-violet-950/30 dark:to-fuchsia-950/30 p-4 rounded-lg text-center">
                <div className="text-4xl mb-2">✨</div>
                <p className="text-sm text-muted-foreground">
                  Fotoğrafını yükle, AI enerji auranı analiz etsin
                </p>
              </div>

              {/* Category Selection */}
              <div className="space-y-2">
                <Label className="text-base font-semibold">Ne Hakkında Aura Okuma İstiyorsun?</Label>
                <Select value={category} onValueChange={(val) => setCategory(val as FortuneCategory)}>
                  <SelectTrigger className="h-11">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="love">{categoryEmojis.love} Aşk Hayatı</SelectItem>
                    <SelectItem value="general">{categoryEmojis.general} Genel</SelectItem>
                    <SelectItem value="career">{categoryEmojis.career} İş ve Kariyer</SelectItem>
                    <SelectItem value="health">{categoryEmojis.health} Sağlık</SelectItem>
                    <SelectItem value="money">{categoryEmojis.money} Para ve Finans</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Aura Reading - Image Upload */}
              <div className="space-y-2">
                <Label className="text-base font-semibold">Fotoğrafınız *</Label>
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-violet-300 dark:border-violet-700 rounded-lg p-8 text-center cursor-pointer hover:border-violet-500 hover:bg-violet-50/50 dark:hover:bg-violet-950/30 transition-all"
                >
                  {previewUrl && selectedFile ? (
                    <div className="space-y-3">
                      <img 
                        src={previewUrl} 
                        alt="Preview" 
                        className="max-h-64 mx-auto rounded-lg object-contain shadow-lg"
                      />
                      <p className="text-xs text-muted-foreground">Değiştirmek için tekrar tıkla</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <Upload className="h-12 w-12 mx-auto text-violet-600" />
                      <div>
                        <p className="font-medium text-violet-900 dark:text-violet-100">
                          Fotoğrafını seç
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Yüzünün net göründüğü bir fotoğraf seç
                        </p>
                      </div>
                    </div>
                  )}
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </div>

              <Button 
                onClick={handleAddAuraFortune} 
                className="w-full h-11 text-base"
                disabled={isUploading || !selectedFile}
              >
                {isUploading ? "Yükleniyor..." : "✨ Aura Oku"}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Payment Options Dialog */}
      <Dialog open={isPaymentDialogOpen} onOpenChange={setIsPaymentDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>💳 Ödeme Seçenekleri</DialogTitle>
            <DialogDescription>
              Günlük ücretsiz haklarınızı kullandınız. Devam etmek için bir seçenek belirleyin.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* Single Fortune Payment */}
            <Card className="border-amber-200 hover:shadow-md transition-shadow cursor-pointer" onClick={handlePayForSingleFortune}>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <ShoppingCartIconWrapper />
                  Tek Fal Satın Al
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  Sadece bu {fortuneType === "coffee" ? "kahve falı" : "tarot"} için ödeme yap
                </p>
                {pricing && (
                  <p className="text-2xl font-bold">
                    ₺
                    {(
                      (fortuneType === "coffee"
                        ? pricing.coffeeFortunePricePerFortune
                        : pricing.tarotFortunePricePerFortune) / 100
                    ).toFixed(2)}
                  </p>
                )}
                <Button variant="outline" className="w-full mt-2">
                  Ödeme Yap
                </Button>
              </CardContent>
            </Card>

            {/* Premium Subscription */}
            {premiumSettings && (
              <Card className="border-purple-200 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20 hover:shadow-md transition-shadow cursor-pointer" onClick={handlePurchasePremium}>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <CrownIconWrapper />
                    Premium'a Geç
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <p className="text-sm text-muted-foreground">
                    Sınırsız fal bakma ve özel özellikler
                  </p>
                  <p className="text-2xl font-bold">
                    ₺{(premiumSettings.monthlyPrice / 100).toFixed(2)} / ay
                  </p>
                  <ul className="text-xs space-y-1 text-muted-foreground">
                    <li>✓ Sınırsız kahve falı</li>
                    <li>✓ Sınırsız tarot</li>
                    <li>✓ Özel özellikler</li>
                  </ul>
                  <Button variant="default" className="w-full mt-2">
                    Premium Ol
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Cancel Button */}
            <Button 
              variant="ghost" 
              className="w-full" 
              onClick={() => setIsPaymentDialogOpen(false)}
            >
              İptal - Geri Dön
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Filter Tabs */}
      <Card>
        <CardHeader>
          <CardTitle>✨ Fallarım</CardTitle>
          <CardDescription>Kahve falı ve tarot yorumlarını görüntüle</CardDescription>
        </CardHeader>
        <CardContent>
          {/* Date Filter */}
          <div className="mb-4 space-y-3">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Tarih Filtresi</span>
              {(startDate || endDate) && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setStartDate("");
                    setEndDate("");
                  }}
                  className="h-6 px-2 text-xs"
                >
                  <X className="h-3 w-3 mr-1" />
                  Temizle
                </Button>
              )}
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label htmlFor="startDate" className="text-xs">Başlangıç</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="text-sm"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="endDate" className="text-xs">Bitiş</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="text-sm"
                />
              </div>
            </div>
          </div>

          <div className="mb-4">
            <Tabs value={filterTab} onValueChange={(val) => setFilterTab(val as "all" | "favorites" | "public")} className="w-full">
              <TabsList className="grid w-full grid-cols-3 gap-2">
                <TabsTrigger value="all" className="flex items-center gap-1">
                  <span>Tümü</span>
                  <span className="text-xs">({totalFortunes})</span>
                </TabsTrigger>
                <TabsTrigger value="favorites" className="flex items-center gap-1">
                  <Star className="h-3 w-3" />
                  <span>Favoriler</span>
                  <span className="text-xs">({favoriteFortunes})</span>
                </TabsTrigger>
                <TabsTrigger value="public" className="flex items-center gap-1">
                  <Globe className="h-3 w-3" />
                  <span>Açık</span>
                  <span className="text-xs">({publicFortunes})</span>
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          {/* Fortune Type Tabs */}
          <Tabs defaultValue="all" className="w-full">
            <TabsList className="grid grid-cols-3 gap-2 h-auto p-2 bg-muted w-full">
              <TabsTrigger value="all">Tümü ({filteredFortunes.length})</TabsTrigger>
              <TabsTrigger value="coffee">☕ Kahve ({coffeeFortunes.length})</TabsTrigger>
              <TabsTrigger value="tarot">🔮 Tarot ({tarotFortunes.length})</TabsTrigger>
              <TabsTrigger value="palm">🤚 El Falı ({filteredFortunes.filter((f) => f.fortuneType === "palm").length})</TabsTrigger>
              <TabsTrigger value="birthchart" className="text-xs">⭐ Doğum H. ({filteredFortunes.filter((f) => f.fortuneType === "birthchart").length})</TabsTrigger>
              <TabsTrigger value="aura">✨ Aura ({filteredFortunes.filter((f) => f.fortuneType === "aura").length})</TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="mt-4">
              {filteredFortunes.length > 0 ? (
                <div className="space-y-4">
                  {filteredFortunes.map((fortune) => (
                    <FortuneCard
                      key={fortune._id}
                      fortune={fortune}
                      interpretingId={interpretingId}
                      onToggleHidden={handleToggleHidden}
                      onInterpretCoffee={handleInterpretCoffeeFortune}
                      onInterpretTarot={handleInterpretTarot}
                      onInterpretPalm={handleInterpretPalmReading}
                      onInterpretBirthChart={handleInterpretBirthChart}
                      onInterpretAura={handleInterpretAuraReading}
                      onToggleFavorite={handleToggleFavorite}
                      onTogglePublic={handleTogglePublic}
                      onUpdateNotes={handleUpdateNotes}
                    />
                  ))}
                </div>
              ) : (
                <EmptyState message={filterTab === "favorites" ? "Henüz favori fal yok" : filterTab === "public" ? "Henüz herkese açık fal yok" : "Henüz fal yok"} />
              )}
            </TabsContent>

            <TabsContent value="coffee" className="mt-4">
              {coffeeFortunes.length > 0 ? (
                <div className="space-y-4">
                  {coffeeFortunes.map((fortune) => (
                    <FortuneCard
                      key={fortune._id}
                      fortune={fortune}
                      interpretingId={interpretingId}
                      onToggleHidden={handleToggleHidden}
                      onInterpretCoffee={handleInterpretCoffeeFortune}
                      onInterpretTarot={handleInterpretTarot}
                      onInterpretPalm={handleInterpretPalmReading}
                      onInterpretBirthChart={handleInterpretBirthChart}
                      onInterpretAura={handleInterpretAuraReading}
                      onToggleFavorite={handleToggleFavorite}
                      onTogglePublic={handleTogglePublic}
                      onUpdateNotes={handleUpdateNotes}
                    />
                  ))}
                </div>
              ) : (
                <EmptyState message="Henüz kahve falı yok" />
              )}
            </TabsContent>

            <TabsContent value="tarot" className="mt-4">
              {tarotFortunes.length > 0 ? (
                <div className="space-y-4">
                  {tarotFortunes.map((fortune) => (
                    <FortuneCard
                      key={fortune._id}
                      fortune={fortune}
                      interpretingId={interpretingId}
                      onToggleHidden={handleToggleHidden}
                      onInterpretCoffee={handleInterpretCoffeeFortune}
                      onInterpretTarot={handleInterpretTarot}
                      onInterpretPalm={handleInterpretPalmReading}
                      onInterpretBirthChart={handleInterpretBirthChart}
                      onInterpretAura={handleInterpretAuraReading}
                      onToggleFavorite={handleToggleFavorite}
                      onTogglePublic={handleTogglePublic}
                      onUpdateNotes={handleUpdateNotes}
                    />
                  ))}
                </div>
              ) : (
                <EmptyState message="Henüz tarot yorumu yok" />
              )}
            </TabsContent>

            <TabsContent value="palm" className="mt-4">
              {palmFortunes.length > 0 ? (
                <div className="space-y-4">
                  {palmFortunes.map((fortune) => (
                    <FortuneCard
                      key={fortune._id}
                      fortune={fortune}
                      interpretingId={interpretingId}
                      onToggleHidden={handleToggleHidden}
                      onInterpretCoffee={handleInterpretCoffeeFortune}
                      onInterpretTarot={handleInterpretTarot}
                      onInterpretPalm={handleInterpretPalmReading}
                      onInterpretBirthChart={handleInterpretBirthChart}
                      onInterpretAura={handleInterpretAuraReading}
                      onToggleFavorite={handleToggleFavorite}
                      onTogglePublic={handleTogglePublic}
                      onUpdateNotes={handleUpdateNotes}
                    />
                  ))}
                </div>
              ) : (
                <EmptyState message="Henüz el falı yok" />
              )}
            </TabsContent>

            <TabsContent value="birthchart" className="mt-4">
              {birthchartFortunes.length > 0 ? (
                <div className="space-y-4">
                  {birthchartFortunes.map((fortune) => (
                    <FortuneCard
                      key={fortune._id}
                      fortune={fortune}
                      interpretingId={interpretingId}
                      onToggleHidden={handleToggleHidden}
                      onInterpretCoffee={handleInterpretCoffeeFortune}
                      onInterpretTarot={handleInterpretTarot}
                      onInterpretPalm={handleInterpretPalmReading}
                      onInterpretBirthChart={handleInterpretBirthChart}
                      onInterpretAura={handleInterpretAuraReading}
                      onToggleFavorite={handleToggleFavorite}
                      onTogglePublic={handleTogglePublic}
                      onUpdateNotes={handleUpdateNotes}
                    />
                  ))}
                </div>
              ) : (
                <EmptyState message="Henüz doğum haritası yok" />
              )}
            </TabsContent>

            <TabsContent value="aura" className="mt-4">
              {auraFortunes.length > 0 ? (
                <div className="space-y-4">
                  {auraFortunes.map((fortune) => (
                    <FortuneCard
                      key={fortune._id}
                      fortune={fortune}
                      interpretingId={interpretingId}
                      onToggleHidden={handleToggleHidden}
                      onInterpretCoffee={handleInterpretCoffeeFortune}
                      onInterpretTarot={handleInterpretTarot}
                      onInterpretPalm={handleInterpretPalmReading}
                      onInterpretBirthChart={handleInterpretBirthChart}
                      onInterpretAura={handleInterpretAuraReading}
                      onToggleFavorite={handleToggleFavorite}
                      onTogglePublic={handleTogglePublic}
                      onUpdateNotes={handleUpdateNotes}
                    />
                  ))}
                </div>
              ) : (
                <EmptyState message="Henüz aura okuma yok" />
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}

interface FortuneCardProps {
  fortune: {
    _id: Id<"fortunes">;
    fortuneType: FortuneType;
    category: FortuneCategory;
    date: string;
    isInterpreted: boolean;
    interpretation?: string;
    imageUrl?: string | null;
    tarotCards?: string[];
    birthDate?: string;
    birthTime?: string;
    birthPlace?: string;
    isFavorite?: boolean;
    isPublic?: boolean;
    isHidden?: boolean;
    notes?: string;
  };
  interpretingId: Id<"fortunes"> | null;
  onToggleHidden: (id: Id<"fortunes">) => void;
  onInterpretCoffee: (id: Id<"fortunes">, imageUrl: string, category: FortuneCategory) => void;
  onInterpretTarot: (id: Id<"fortunes">, category: FortuneCategory) => void;
  onInterpretPalm: (id: Id<"fortunes">, imageUrl: string, category: FortuneCategory) => void;
  onInterpretBirthChart: (id: Id<"fortunes">, birthDate: string, birthTime: string, birthPlace: string, category: FortuneCategory) => void;
  onInterpretAura: (id: Id<"fortunes">, imageUrl: string, category: FortuneCategory) => void;
  onToggleFavorite: (id: Id<"fortunes">) => void;
  onTogglePublic: (id: Id<"fortunes">) => void;
  onUpdateNotes: (id: Id<"fortunes">, notes: string) => void;
}

function FortuneCard({ fortune, interpretingId, onToggleHidden, onInterpretCoffee, onInterpretTarot, onInterpretPalm, onInterpretBirthChart, onInterpretAura, onToggleFavorite, onTogglePublic, onUpdateNotes }: FortuneCardProps) {
  const fortuneTypeLabel = 
    fortune.fortuneType === "coffee" ? "☕ Kahve Falı" :
    fortune.fortuneType === "tarot" ? "🔮 Tarot" :
    fortune.fortuneType === "palm" ? "🤚 El Falı" :
    fortune.fortuneType === "birthchart" ? "⭐ Doğum Haritası" :
    "✨ Aura Okuma";
  const [isNotesDialogOpen, setIsNotesDialogOpen] = useState(false);
  const [notesText, setNotesText] = useState(fortune.notes || "");
  
  const handleSaveNotes = () => {
    onUpdateNotes(fortune._id, notesText);
    setIsNotesDialogOpen(false);
  };

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-0">
        {/* Header */}
        <div className="p-4 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20 border-b">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm font-medium text-muted-foreground">{fortuneTypeLabel}</span>
                {fortune.isFavorite && (
                  <span className="text-amber-500">
                    <Star className="h-4 w-4 fill-current" />
                  </span>
                )}
                {fortune.isPublic && (
                  <span className="text-blue-500">
                    <Globe className="h-4 w-4" />
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xl">{categoryEmojis[fortune.category]}</span>
                <h4 className="font-bold text-lg">{categoryLabels[fortune.category]}</h4>
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                {new Date(fortune.date).toLocaleDateString("tr-TR", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </p>
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onToggleFavorite(fortune._id)}
                title={fortune.isFavorite ? "Favorilerden çıkar" : "Favorilere ekle"}
              >
                <Star className={`h-4 w-4 ${fortune.isFavorite ? "fill-amber-500 text-amber-500" : ""}`} />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onTogglePublic(fortune._id)}
                title={fortune.isPublic ? "Gizli yap" : "Herkese açık yap"}
              >
                {fortune.isPublic ? <Globe className="h-4 w-4 text-blue-500" /> : <Lock className="h-4 w-4" />}
              </Button>
              <Dialog open={isNotesDialogOpen} onOpenChange={setIsNotesDialogOpen}>
                <DialogTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    title="Not ekle"
                  >
                    <StickyNote className={`h-4 w-4 ${fortune.notes ? "text-amber-500" : ""}`} />
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>📝 Fal Notları</DialogTitle>
                    <DialogDescription>
                      Bu fal için özel notlar ekle
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <Textarea
                      value={notesText}
                      onChange={(e) => setNotesText(e.target.value)}
                      placeholder="Notlarını buraya yaz..."
                      className="min-h-[150px]"
                    />
                    <div className="flex gap-2 justify-end">
                      <Button variant="ghost" onClick={() => setIsNotesDialogOpen(false)}>
                        İptal
                      </Button>
                      <Button onClick={handleSaveNotes}>
                        Kaydet
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onToggleHidden(fortune._id)}
                title={fortune.isHidden ? "Göster" : "Gizle"}
              >
                {fortune.isHidden ? <LockIconWrapper /> : <GlobeIconWrapper />}
              </Button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          {/* Image for coffee, palm, and aura fortunes */}
          {(fortune.fortuneType === "coffee" || fortune.fortuneType === "palm" || fortune.fortuneType === "aura") && fortune.imageUrl && (
            <img 
              src={fortune.imageUrl}
              alt={fortune.fortuneType === "coffee" ? "Fincan" : fortune.fortuneType === "palm" ? "El" : "Fotoğraf"}
              className="w-full max-h-96 object-contain rounded-lg bg-muted"
            />
          )}

          {/* Tarot Cards Display */}
          {fortune.fortuneType === "tarot" && fortune.tarotCards && fortune.tarotCards.length > 0 && (
            <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20 p-4 rounded-lg">
              <h5 className="text-sm font-semibold mb-3 flex items-center gap-2">
                🔮 Çekilen Kartlar
              </h5>
              <div className="grid grid-cols-3 gap-3">
                {fortune.tarotCards.map((card, index) => {
                  const position = index === 0 ? "Geçmiş" : index === 1 ? "Şimdi" : "Gelecek";
                  const turkishName = TAROT_TURKISH[card] || card;
                  const cardImage = TAROT_IMAGES[card];
                  return (
                    <div key={index} className="text-center">
                      <div className="aspect-[2/3] mb-2 rounded-lg overflow-hidden shadow-lg border-2 border-amber-200 dark:border-amber-800 relative">
                        {cardImage ? (
                          <img 
                            src={cardImage} 
                            alt={turkishName}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-purple-900 to-pink-900"></div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-br from-purple-900/40 via-transparent to-pink-900/40 flex flex-col items-center justify-center p-2">
                          <div className="text-3xl mb-2">🔮</div>
                          <div className="text-[9px] leading-tight font-bold text-white bg-black/70 px-2 py-1.5 rounded max-w-full text-center">
                            {turkishName}
                          </div>
                        </div>
                      </div>
                      <div className="text-xs text-muted-foreground mb-1">{position}</div>
                      <div className="text-xs font-medium text-center px-1 leading-tight">{turkishName}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Birth Chart Info Display */}
          {fortune.fortuneType === "birthchart" && fortune.birthDate && fortune.birthTime && fortune.birthPlace && (
            <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20 p-4 rounded-lg">
              <h5 className="text-sm font-semibold mb-3 flex items-center gap-2">
                ⭐ Doğum Bilgileri
              </h5>
              <div className="grid grid-cols-3 gap-3 text-sm">
                <div>
                  <div className="text-xs text-muted-foreground mb-1">Doğum Tarihi</div>
                  <div className="font-medium">{fortune.birthDate}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground mb-1">Doğum Saati</div>
                  <div className="font-medium">{fortune.birthTime}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground mb-1">Doğum Yeri</div>
                  <div className="font-medium">{fortune.birthPlace}</div>
                </div>
              </div>
            </div>
          )}

          {/* Personal Notes */}
          {fortune.notes && (
            <div className="bg-amber-50 dark:bg-amber-950/20 p-4 rounded-lg border-l-4 border-amber-500">
              <h5 className="text-sm font-semibold mb-2 flex items-center gap-2">
                <StickyNote className="h-4 w-4 text-amber-500" />
                Notlarım
              </h5>
              <div className="text-sm whitespace-pre-wrap leading-relaxed text-muted-foreground">
                {fortune.notes}
              </div>
            </div>
          )}

          {/* Interpretation */}
          {fortune.isInterpreted && fortune.interpretation ? (
            <div className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20 p-4 rounded-lg">
              <h5 className="text-sm font-semibold mb-3 flex items-center gap-2">
                <SparklesIconWrapper />
                AI Yorumu
              </h5>
              <div className="text-sm whitespace-pre-wrap leading-relaxed prose prose-sm dark:prose-invert max-w-none">
                {fortune.interpretation}
              </div>
            </div>
          ) : (
            <Button
              onClick={() => {
                if (fortune.fortuneType === "coffee" && fortune.imageUrl) {
                  onInterpretCoffee(fortune._id, fortune.imageUrl, fortune.category);
                } else if (fortune.fortuneType === "tarot") {
                  onInterpretTarot(fortune._id, fortune.category);
                } else if (fortune.fortuneType === "palm" && fortune.imageUrl) {
                  onInterpretPalm(fortune._id, fortune.imageUrl, fortune.category);
                } else if (fortune.fortuneType === "birthchart" && fortune.birthDate && fortune.birthTime && fortune.birthPlace) {
                  onInterpretBirthChart(fortune._id, fortune.birthDate, fortune.birthTime, fortune.birthPlace, fortune.category);
                } else if (fortune.fortuneType === "aura" && fortune.imageUrl) {
                  onInterpretAura(fortune._id, fortune.imageUrl, fortune.category);
                }
              }}
              disabled={interpretingId === fortune._id}
              className="w-full gap-2"
              variant="outline"
            >
              <SparklesIconWrapper />
              {interpretingId === fortune._id ? "Yorumlanıyor..." : 
               fortune.fortuneType === "coffee" ? "AI ile Fal Baktır" :
               fortune.fortuneType === "tarot" ? "Kartları Çek ve Yorumla" :
               fortune.fortuneType === "palm" ? "AI ile El Falı Baktır" :
               fortune.fortuneType === "birthchart" ? "AI ile Doğum Haritası Yorumla" :
               "AI ile Aura Oku"}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function EmptyState({ message = "Henüz fal baktırmadın" }: { message?: string }) {
  return (
    <div className="text-center py-12 text-muted-foreground">
      <CoffeeIconWrapper />
      <p className="mt-2">{message}</p>
    </div>
  );
}
