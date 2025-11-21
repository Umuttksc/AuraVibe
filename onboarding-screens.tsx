import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Button } from "@/components/ui/button";
import {
  Sparkles,
  MessageCircle,
  Gamepad2,
  Heart,
  Coins,
  Gift,
  TrendingUp,
  ChevronRight,
  Video,
} from "lucide-react";

interface OnboardingScreensProps {
  onComplete: () => void;
}

const screens = [
  {
    icon: Sparkles,
    title: "AuraVibe'a Hoş Geldin! 🎉",
    description:
      "Sosyal paylaşım, wellness, eğlence ve daha fazlası... Ruhuna dokunuş yapan bir dünyaya adım at!",
    gradient: "from-purple-500 via-pink-500 to-rose-500",
    features: [
      "Paylaşım yap, hikaye ekle, mesajlaş",
      "Sesli mesaj ve görüntülü arama",
      "Gruplar oluştur, topluluklar kur",
    ],
  },
  {
    icon: Gamepad2,
    title: "Eğlenceli Oyunlar 🎮",
    description:
      "15+ farklı oyunla arkadaşlarınla yarış! XOX, Satranç, Kelime Tahmin, Sudoku ve daha fazlası...",
    gradient: "from-blue-500 via-cyan-500 to-teal-500",
    features: [
      "Arkadaşlarına oyun daveti gönder",
      "Skor tablosunda yüksel",
      "Her gün yeni meydan okumalar",
    ],
  },
  {
    icon: Heart,
    title: "Fal ve Maneviyat 🔮",
    description:
      "Kahve falı, el falı, aura analizi, doğum haritası... Geleceğini keşfet, ruhunu tanı!",
    gradient: "from-indigo-500 via-purple-500 to-pink-500",
    features: [
      "AI destekli fal yorumları",
      "Günlük ücretsiz fallar",
      "Tarot kartları ve rüya tabiri",
    ],
  },
  {
    icon: MessageCircle,
    title: "Wellness & Sağlık 💚",
    description:
      "Regl takibi, su hatırlatıcı, egzersiz planları, günlük tutma ve daha fazlası...",
    gradient: "from-green-500 via-emerald-500 to-teal-500",
    features: [
      "Kişiselleştirilmiş wellness takibi",
      "Sağlık ipuçları ve rehberler",
      "İslami içerik ve ezan vakitleri",
    ],
  },
  {
    icon: Coins,
    title: "Token Kazan, Para Kazan! 💰",
    description:
      "Uygulamayı kullanarak token kazan, gerçek paraya çevir! Oyunlarda başarılı ol, hediyeler kazan.",
    gradient: "from-amber-500 via-orange-500 to-red-500",
    features: [
      "Başarı rozetleriyle token kazan",
      "Oyun kazançlarını nakde çevir",
      "Arkadaşlarına hediye gönder",
    ],
  },
  {
    icon: Gift,
    title: "Premium Hediyeler 🎁",
    description:
      "Sevdiklerine özel 3D animasyonlu hediyeler gönder! Kral tacı, kalp yağmuru ve daha fazlası...",
    gradient: "from-pink-500 via-rose-500 to-red-500",
    features: [
      "15+ farklı premium hediye",
      "Özel animasyonlar ve efektler",
      "Hediye geçmişini takip et",
    ],
  },
];

export default function OnboardingScreens({
  onComplete,
}: OnboardingScreensProps) {
  const [currentScreen, setCurrentScreen] = useState(0);

  const handleNext = () => {
    if (currentScreen < screens.length - 1) {
      setCurrentScreen(currentScreen + 1);
    } else {
      onComplete();
    }
  };

  const handleSkip = () => {
    onComplete();
  };

  const screen = screens[currentScreen];
  const Icon = screen.icon;
  const isLastScreen = currentScreen === screens.length - 1;

  return (
    <div className="fixed inset-0 z-[9998] bg-background flex items-center justify-center p-4">
      {/* Background gradient */}
      <motion.div
        key={currentScreen}
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.1 }}
        transition={{ duration: 0.5 }}
        className={`absolute inset-0 bg-gradient-to-br ${screen.gradient}`}
      />

      <div className="relative w-full max-w-md">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentScreen}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.3 }}
            className="space-y-6"
          >
            {/* Icon */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{
                type: "spring",
                stiffness: 200,
                damping: 15,
                delay: 0.1,
              }}
              className="flex justify-center"
            >
              <div
                className={`p-6 rounded-full bg-gradient-to-br ${screen.gradient} shadow-2xl`}
              >
                <Icon className="w-16 h-16 text-white" />
              </div>
            </motion.div>

            {/* Content */}
            <div className="text-center space-y-4 px-4">
              <motion.h2
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="text-3xl font-bold"
              >
                {screen.title}
              </motion.h2>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-muted-foreground text-lg leading-relaxed"
              >
                {screen.description}
              </motion.p>

              {/* Features */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="space-y-3 pt-4"
              >
                {screen.features.map((feature, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5 + index * 0.1 }}
                    className="flex items-center gap-3 text-left bg-background/50 backdrop-blur-sm rounded-lg p-3"
                  >
                    <div
                      className={`p-1.5 rounded-full bg-gradient-to-br ${screen.gradient}`}
                    >
                      <ChevronRight className="w-4 h-4 text-white" />
                    </div>
                    <span className="text-sm">{feature}</span>
                  </motion.div>
                ))}
              </motion.div>
            </div>

            {/* Progress dots */}
            <div className="flex justify-center gap-2 pt-4">
              {screens.map((_, index) => (
                <motion.div
                  key={index}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.6 + index * 0.05 }}
                  className={`h-2 rounded-full transition-all ${
                    index === currentScreen
                      ? "w-8 bg-primary"
                      : "w-2 bg-muted-foreground/30"
                  }`}
                />
              ))}
            </div>

            {/* Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
              className="flex gap-3 pt-4"
            >
              {!isLastScreen && (
                <Button
                  variant="ghost"
                  onClick={handleSkip}
                  className="flex-1"
                >
                  Atla
                </Button>
              )}
              <Button
                onClick={handleNext}
                className={`${isLastScreen ? "w-full" : "flex-1"} bg-gradient-to-r ${screen.gradient} hover:opacity-90 text-white border-0`}
              >
                {isLastScreen ? "Hadi Başlayalım! 🚀" : "İleri"}
                {!isLastScreen && <ChevronRight className="ml-2 w-4 h-4" />}
              </Button>
            </motion.div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
