import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";

interface SplashScreenProps {
  onComplete: () => void;
}

export default function SplashScreen({ onComplete }: SplashScreenProps) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onComplete, 500); // Wait for fade out animation
    }, 2500);

    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-[#1a0b2e]"
        >
          {/* Background gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-br from-purple-900/50 via-pink-900/30 to-blue-900/50" />
          
          <div className="relative flex flex-col items-center gap-8">
            {/* Main Logo Image with animations */}
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{
                type: "spring",
                stiffness: 200,
                damping: 25,
                delay: 0.2,
              }}
              className="relative"
            >
              {/* Pulsing glow effect */}
              <motion.div
                animate={{
                  scale: [1, 1.3, 1],
                  opacity: [0.3, 0.6, 0.3],
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
                className="absolute inset-0 rounded-full bg-gradient-to-br from-cyan-400 via-pink-500 to-purple-600 blur-3xl"
              />
              
              {/* Logo Image */}
              <motion.div
                animate={{
                  rotate: [0, 360],
                }}
                transition={{
                  duration: 25,
                  repeat: Infinity,
                  ease: "linear",
                }}
                className="relative w-64 h-64 rounded-full overflow-hidden"
              >
                <img
                  src="https://cdn.hercules.app/file_YYnI26HedqYvphH3Vv0AQrw2"
                  alt="AuraVibe Logo"
                  className="w-full h-full object-cover drop-shadow-2xl rounded-full"
                />
              </motion.div>

              {/* Orbiting particles */}
              {[0, 1, 2, 3].map((i) => (
                <motion.div
                  key={i}
                  animate={{
                    rotate: [0, 360],
                    scale: [1, 1.2, 1],
                  }}
                  transition={{
                    duration: 4 + i,
                    repeat: Infinity,
                    ease: "linear",
                    delay: i * 0.5,
                  }}
                  className="absolute inset-0"
                >
                  <div
                    className="absolute w-2 h-2 rounded-full bg-white"
                    style={{
                      top: "50%",
                      left: `${50 + 40 * Math.cos((i * Math.PI) / 2)}%`,
                      transform: "translate(-50%, -50%)",
                      boxShadow: "0 0 10px rgba(255, 255, 255, 0.8)",
                    }}
                  />
                </motion.div>
              ))}
            </motion.div>

            {/* App Name with gradient text */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.8 }}
              className="text-center space-y-3"
            >
              <motion.h1
                animate={{
                  textShadow: [
                    "0 0 20px rgba(236, 72, 153, 0.5)",
                    "0 0 40px rgba(236, 72, 153, 0.8)",
                    "0 0 20px rgba(236, 72, 153, 0.5)",
                  ],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
                className="text-5xl font-bold bg-gradient-to-r from-cyan-400 via-pink-500 to-purple-600 bg-clip-text text-transparent"
              >
                AuraVibe
              </motion.h1>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1 }}
                className="text-lg text-white/70 font-light tracking-wider"
              >
                Ruhuna dokunuş
              </motion.p>
            </motion.div>

            {/* Loading indicator with cosmic theme */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.2 }}
              className="flex gap-2"
            >
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  animate={{
                    scale: [1, 1.8, 1],
                    opacity: [0.3, 1, 0.3],
                    backgroundColor: [
                      "rgba(34, 211, 238, 0.5)",
                      "rgba(236, 72, 153, 0.8)",
                      "rgba(147, 51, 234, 0.5)",
                    ],
                  }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    delay: i * 0.2,
                    ease: "easeInOut",
                  }}
                  className="w-3 h-3 rounded-full"
                  style={{
                    boxShadow: "0 0 10px rgba(236, 72, 153, 0.6)",
                  }}
                />
              ))}
            </motion.div>
          </div>

          {/* Animated starfield background */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {Array.from({ length: 20 }).map((_, i) => (
              <motion.div
                key={i}
                animate={{
                  opacity: [0, 1, 0],
                  scale: [0, 1, 0],
                }}
                transition={{
                  duration: 2 + Math.random() * 2,
                  repeat: Infinity,
                  delay: Math.random() * 2,
                  ease: "easeInOut",
                }}
                className="absolute w-1 h-1 bg-white rounded-full"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                  filter: "blur(0.5px)",
                }}
              />
            ))}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
