import { motion, AnimatePresence } from "motion/react";
import { useEffect, useState } from "react";

interface PremiumGiftAnimationProps {
  show: boolean;
  animationType: "confetti" | "fireworks" | "hearts" | "stars" | "diamonds" | "coins" | "fire" | "snow";
  giftName: string;
  giftImageUrl: string;
  onComplete: () => void;
}

export default function PremiumGiftAnimation({
  show,
  animationType,
  giftName,
  giftImageUrl,
  onComplete,
}: PremiumGiftAnimationProps) {
  const [particles, setParticles] = useState<Array<{ id: number; x: number; y: number; delay: number }>>([]);

  useEffect(() => {
    if (show) {
      // Generate random particles
      const newParticles = Array.from({ length: 50 }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        delay: Math.random() * 0.5,
      }));
      setParticles(newParticles);

      // Auto-complete after 5 seconds
      const timer = setTimeout(() => {
        onComplete();
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [show, onComplete]);

  const getParticleEmoji = () => {
    switch (animationType) {
      case "confetti":
        return ["🎊", "🎉", "✨", "⭐"];
      case "fireworks":
        return ["💥", "✨", "🎆", "🌟"];
      case "hearts":
        return ["❤️", "💕", "💖", "💗"];
      case "stars":
        return ["⭐", "🌟", "✨", "💫"];
      case "diamonds":
        return ["💎", "💠", "🔷", "🔹"];
      case "coins":
        return ["💰", "💵", "💴", "🪙"];
      case "fire":
        return ["🔥", "💥", "⚡", "🌟"];
      case "snow":
        return ["❄️", "☃️", "⛄", "🌨️"];
      default:
        return ["✨"];
    }
  };

  const particleEmojis = getParticleEmoji();

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] pointer-events-none"
          style={{ perspective: "1000px" }}
        >
          {/* Overlay with gradient */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.3 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-gradient-to-b from-black/50 via-transparent to-black/50"
          />

          {/* Particles */}
          {particles.map((particle) => (
            <motion.div
              key={particle.id}
              initial={{ y: "-10%", x: `${particle.x}%`, opacity: 0, scale: 0 }}
              animate={{
                y: "110%",
                opacity: [0, 1, 1, 0],
                scale: [0, 1.5, 1, 0.5],
                rotate: [0, 360],
              }}
              transition={{
                duration: 3 + Math.random() * 2,
                delay: particle.delay,
                ease: "easeOut",
              }}
              className="absolute text-4xl"
              style={{ left: `${particle.x}%` }}
            >
              {particleEmojis[Math.floor(Math.random() * particleEmojis.length)]}
            </motion.div>
          ))}

          {/* Center Gift Display */}
          <div className="absolute inset-0 flex items-center justify-center">
            <motion.div
              initial={{ scale: 0, rotate: -180, opacity: 0 }}
              animate={{ scale: 1, rotate: 0, opacity: 1 }}
              exit={{ scale: 0, rotate: 180, opacity: 0 }}
              transition={{
                type: "spring",
                stiffness: 200,
                damping: 20,
                duration: 0.8,
              }}
              className="flex flex-col items-center gap-4 pointer-events-auto"
            >
              <motion.div
                animate={{
                  scale: [1, 1.1, 1],
                  rotate: [0, 5, -5, 0],
                }}
                transition={{
                  duration: 2,
                  repeat: Number.POSITIVE_INFINITY,
                  ease: "easeInOut",
                }}
                className="relative"
              >
                <img
                  src={giftImageUrl}
                  alt={giftName}
                  className="w-48 h-48 object-contain drop-shadow-2xl"
                />
                <motion.div
                  animate={{
                    scale: [1, 1.5, 1],
                    opacity: [0.5, 1, 0.5],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Number.POSITIVE_INFINITY,
                    ease: "easeInOut",
                  }}
                  className="absolute inset-0 bg-gradient-to-r from-yellow-400 via-pink-500 to-purple-500 rounded-full blur-3xl -z-10"
                />
              </motion.div>
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="text-center bg-black/50 backdrop-blur-md rounded-2xl px-8 py-4 border-2 border-white/20"
              >
                <h3 className="text-3xl font-bold text-white drop-shadow-lg">
                  {giftName}
                </h3>
              </motion.div>
            </motion.div>
          </div>

          {/* Radial burst effect */}
          <motion.div
            initial={{ scale: 0, opacity: 1 }}
            animate={{ scale: 3, opacity: 0 }}
            transition={{ duration: 1.5, ease: "easeOut" }}
            className="absolute inset-0 flex items-center justify-center"
          >
            <div className="w-96 h-96 rounded-full bg-gradient-to-r from-yellow-400 via-pink-500 to-purple-500 blur-3xl" />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
