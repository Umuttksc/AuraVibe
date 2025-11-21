import { useState } from "react";
import { Card } from "@/components/ui/card.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Hand, RotateCcw, Plus } from "lucide-react";

function HandIcon() {
  return <Hand className="h-5 w-5" />;
}

function RotateCcwIcon() {
  return <RotateCcw className="h-4 w-4" />;
}

function PlusIcon() {
  return <Plus className="h-4 w-4" />;
}

const DHIKR_OPTIONS = [
  { text: "سُبْحَانَ اللهِ", meaning: "Sübhanallah", target: 33 },
  { text: "الْحَمْدُ لِلّهِ", meaning: "Elhamdülillah", target: 33 },
  { text: "اللهُ أَكْبَرُ", meaning: "Allahu Ekber", target: 34 },
  { text: "لاَ إِلَهَ إِلاَّ اللهُ", meaning: "La ilahe illallah", target: 100 },
  { text: "أَسْتَغْفِرُ اللهَ", meaning: "Estağfirullah", target: 100 },
];

export default function DhikrCounter() {
  const [selectedDhikr, setSelectedDhikr] = useState(0);
  const [count, setCount] = useState(0);
  const currentDhikr = DHIKR_OPTIONS[selectedDhikr];

  const handleCount = () => {
    if (count < currentDhikr.target) {
      setCount(count + 1);
    } else {
      // Vibrate if available
      if ('vibrate' in navigator) {
        navigator.vibrate(200);
      }
    }
  };

  const handleReset = () => {
    setCount(0);
  };

  return (
    <Card className="overflow-hidden bg-gradient-to-br from-teal-50 via-cyan-50 to-teal-50 dark:from-teal-950/20 dark:via-cyan-950/20 dark:to-teal-950/20 border-teal-200 dark:border-teal-900">
      <div className="p-4 sm:p-6 space-y-6">
        <div className="flex items-center gap-2">
          <HandIcon />
          <h3 className="font-semibold text-lg sm:text-xl text-teal-900 dark:text-teal-100">
            Zikirmatik
          </h3>
        </div>

        {/* Dhikr Selection */}
        <div className="grid grid-cols-2 gap-2">
          {DHIKR_OPTIONS.map((dhikr, idx) => (
            <Button
              key={idx}
              variant={selectedDhikr === idx ? "default" : "outline"}
              className="h-auto py-3 flex flex-col items-center gap-1"
              onClick={() => {
                setSelectedDhikr(idx);
                setCount(0);
              }}
            >
              <span className="font-arabic text-base">{dhikr.text}</span>
              <span className="text-xs">{dhikr.meaning}</span>
            </Button>
          ))}
        </div>

        {/* Counter Display */}
        <div className="text-center space-y-4">
          <div className="p-8 rounded-2xl bg-teal-100 dark:bg-teal-900/20 border-2 border-teal-200 dark:border-teal-800">
            <p className="font-arabic text-3xl mb-2 text-teal-900 dark:text-teal-100">
              {currentDhikr.text}
            </p>
            <p className="text-sm text-muted-foreground mb-4">{currentDhikr.meaning}</p>
            <div className="text-6xl font-bold text-teal-900 dark:text-teal-100">
              {count}
            </div>
            <div className="text-sm text-muted-foreground mt-2">
              / {currentDhikr.target}
            </div>
          </div>

          {/* Counter Button */}
          <Button
            size="lg"
            className="w-full h-20 text-xl"
            onClick={handleCount}
            disabled={count >= currentDhikr.target}
          >
            <PlusIcon />
            Zikir Ekle
          </Button>

          {/* Reset Button */}
          <Button
            variant="outline"
            size="sm"
            className="w-full"
            onClick={handleReset}
          >
            <RotateCcwIcon />
            Sıfırla
          </Button>

          {count >= currentDhikr.target && (
            <div className="p-3 rounded-lg bg-green-100 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
              <p className="text-sm font-medium text-green-900 dark:text-green-100">
                ✓ Hedefe ulaştınız! Mâşâallah
              </p>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
