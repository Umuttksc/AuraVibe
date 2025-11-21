import { motion, AnimatePresence } from "motion/react";
import { useEffect, useState } from "react";

interface LevelUpAnimationProps {
  show: boolean;
  newLevel: number;
  onComplete: () => void;
}

export default function LevelUpAnimation({
  show,
  newLevel,
  onComplete,
}: LevelUpAnimationProps) {
  const [particles, setParticles] = useState<Array<{ id: number; x: number; y: number; delay: number }>>([]);

  useEffect(() => {
    if (show) {
      // Generate random particles
      const newParticles = Array.from({ length: 40 }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        delay: Math.random() * 0.3,
      }));
      setParticles(newParticles);

      // Auto-complete after 4 seconds
      const timer = setTimeout(() => {
        onComplete();
      }, 4000);

      return () => clearTimeout(timer);
    }
  }, [show, onComplete]);

  const getLevelBadge = (level: number) => {
    if (level < 10) return { emoji: "🥉", title: "Bronz", color: "from-amber-700 via-amber-600 to-amber-700" };
    if (level < 25) return { emoji: "🥈", title: "Gümüş", color: "from-gray-400 via-gray-300 to-gray-400" };
    if (level < 50) return { emoji: "🥇", title: "Altın", color: "from-yellow-400 via-yellow-300 to-yellow-400" };
    if (level < 75) return { emoji: "💎", title: "Platin", color: "from-cyan-400 via-cyan-300 to-cyan-400" };
    if (level < 90) return { emoji: "💠", title: "Elmas", color: "from-blue-400 via-purple-400 to-pink-400" };
    return { emoji: "👑", title: "Efsane", color: "from-purple-500 via-pink-500 to-red-500" };
  };

  const badge = getLevelBadge(newLevel);
  const particleEmojis = ["⭐", "✨", "🌟", "💫", "🎉", "🎊"];

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
          {/* Dark Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.7 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black"
          />

          {/* Particles */}
          {particles.map((particle) => (
            <motion.div
              key={particle.id}
              initial={{ y: "100%", x: `${particle.x}%`, opacity: 0, scale: 0 }}
              animate={{
                y: "-10%",
                opacity: [0, 1, 1, 0],
                scale: [0, 1.5, 1.5, 0],
                rotate: [0, 360],
              }}
              transition={{
                duration: 2.5 + Math.random(),
                delay: particle.delay,
                ease: "easeOut",
              }}
              className="absolute text-3xl"
              style={{ left: `${particle.x}%` }}
            >
              {particleEmojis[Math.floor(Math.random() * particleEmojis.length)]}
            </motion.div>
          ))}

          {/* Center Content */}
          <div className="absolute inset-0 flex items-center justify-center">
            <motion.div
              initial={{ scale: 0, rotate: -180, opacity: 0 }}
              animate={{ scale: 1, rotate: 0, opacity: 1 }}
              exit={{ scale: 0, rotate: 180, opacity: 0 }}
              transition={{
                type: "spring",
                stiffness: 200,
                damping: 15,
                duration: 0.6,
              }}
              className="flex flex-col items-center gap-6 pointer-events-auto px-4"
            >
              {/* Level Badge */}
              <motion.div
                animate={{
                  scale: [1, 1.15, 1],
                  rotate: [0, 5, -5, 0],
                }}
                transition={{
                  duration: 2,
                  repeat: Number.POSITIVE_INFINITY,
                  ease: "easeInOut",
                }}
                className="relative"
              >
                <div className={`w-32 h-32 rounded-full bg-gradient-to-br ${badge.color} flex items-center justify-center shadow-2xl border-4 border-white`}>
                  <span className="text-6xl">{badge.emoji}</span>
                </div>
                <motion.div
                  animate={{
                    scale: [1, 1.3, 1],
                    opacity: [0.3, 0.7, 0.3],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Number.POSITIVE_INFINITY,
                    ease: "easeInOut",
                  }}
                  className={`absolute inset-0 bg-gradient-to-br ${badge.color} rounded-full blur-2xl -z-10`}
                />
              </motion.div>

              {/* Text */}
              <motion.div
                initial={{ y: 30, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="text-center"
              >
                <motion.h2
                  animate={{
                    scale: [1, 1.05, 1],
                  }}
                  transition={{
                    duration: 1.5,
                    repeat: Number.POSITIVE_INFINITY,
                    ease: "easeInOut",
                  }}
                  className="text-5xl font-bold text-white mb-4 drop-shadow-lg"
                >
                  🎉 Tebrikler! 🎉
                </motion.h2>
                <div className="bg-white/10 backdrop-blur-md rounded-2xl px-8 py-6 border-2 border-white/30">
                  <p className="text-2xl text-white/90 mb-2">
                    Level <span className="font-bold text-3xl">{newLevel}</span>
                  </p>
                  <p className="text-xl font-semibold text-white">
                    {badge.title}
                  </p>
                </div>
              </motion.div>
            </motion.div>
          </div>

          {/* Radial burst effect */}
          <motion.div
            initial={{ scale: 0, opacity: 1 }}
            animate={{ scale: 4, opacity: 0 }}
            transition={{ duration: 1.5, ease: "easeOut" }}
            className="absolute inset-0 flex items-center justify-center"
          >
            <div className={`w-96 h-96 rounded-full bg-gradient-to-br ${badge.color} blur-3xl`} />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
