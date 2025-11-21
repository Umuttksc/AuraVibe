import { useState, useEffect, useCallback } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import { Authenticated, Unauthenticated, AuthLoading } from "convex/react";
import MainLayout from "@/components/layout/main-layout.tsx";
import { SignInButton } from "@/components/ui/signin.tsx";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card.tsx";
import { Badge } from "@/components/ui/badge.tsx";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog.tsx";
import { BookText, Trophy, TrendingUp, ArrowLeft, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import type { Id } from "@/convex/_generated/dataModel.d.ts";

// Turkish keyboard layout
const KEYBOARD_ROWS = [
  ["e", "r", "t", "y", "u", "ı", "o", "p", "ğ", "ü"],
  ["a", "s", "d", "f", "g", "h", "j", "k", "l", "ş", "i"],
  ["z", "c", "v", "b", "n", "m", "ö", "ç"],
];

function WordGuessGameContent() {
  const navigate = useNavigate();
  const todaysGame = useQuery(api.wordGuessGames.getTodaysGame);
  const stats = useQuery(api.wordGuessGames.getPlayerStats);
  const createGame = useMutation(api.wordGuessGames.createGame);
  const makeGuess = useMutation(api.wordGuessGames.makeGuess);

  const [currentGuess, setCurrentGuess] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [shakeRow, setShakeRow] = useState<number | null>(null);
  const [showStatsDialog, setShowStatsDialog] = useState(false);
  const [showCompletionDialog, setShowCompletionDialog] = useState(false);
  const [completionMessage, setCompletionMessage] = useState("");
  const [revealedWord, setRevealedWord] = useState<string | undefined>();

  // Keyboard state tracking
  const [keyboardState, setKeyboardState] = useState<Record<string, "correct" | "present" | "absent" | "unused">>({});

  // Update keyboard state based on guesses
  useEffect(() => {
    if (!todaysGame?.guesses) return;

    const newState: Record<string, "correct" | "present" | "absent" | "unused"> = {};

    for (const guess of todaysGame.guesses) {
      for (let i = 0; i < guess.word.length; i++) {
        const letter = guess.word[i];
        const result = guess.result[i];

        // Only update if better result (correct > present > absent)
        if (!newState[letter] || 
            (result === "correct") ||
            (result === "present" && newState[letter] === "absent")) {
          newState[letter] = result;
        }
      }
    }

    setKeyboardState(newState);
  }, [todaysGame?.guesses]);

  const [gameHint, setGameHint] = useState<string>("");

  const handleStartGame = async () => {
    try {
      const result = await createGame({});
      if (result && typeof result === "object" && "hint" in result) {
        setGameHint(result.hint as string);
      }
      toast.success("Oyun başladı!");
    } catch (error) {
      toast.error((error as Error).message);
    }
  };

  // Extract hint from game when loaded
  useEffect(() => {
    if (todaysGame && "hint" in todaysGame && todaysGame.hint) {
      setGameHint(todaysGame.hint as string);
    }
  }, [todaysGame]);

  const handleKeyPress = (key: string) => {
    if (isSubmitting || !todaysGame || todaysGame.status !== "in_progress") return;

    if (key === "backspace") {
      setCurrentGuess(prev => prev.slice(0, -1));
    } else if (key === "enter") {
      if (currentGuess.length === 5) {
        handleSubmitGuess();
      }
    } else if (currentGuess.length < 5) {
      setCurrentGuess(prev => prev + key);
    }
  };

  const handleSubmitGuess = async () => {
    if (!todaysGame || currentGuess.length !== 5 || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const result = await makeGuess({
        gameId: todaysGame._id,
        guess: currentGuess,
      });

      if (result.isWon) {
        setCompletionMessage("Tebrikler! Kelimeyi buldunuz! 🎉");
        setRevealedWord(result.word);
        setShowCompletionDialog(true);
      } else if (result.isLost) {
        setCompletionMessage(`Oyun bitti! Kelime: ${result.word}`);
        setRevealedWord(result.word);
        setShowCompletionDialog(true);
      }

      setCurrentGuess("");
    } catch (error) {
      const errorMsg = (error as Error).message;
      toast.error(errorMsg);
      
      // Shake animation for invalid guess
      if (todaysGame.guesses) {
        setShakeRow(todaysGame.guesses.length);
        setTimeout(() => setShakeRow(null), 500);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Keyboard event listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isSubmitting || !todaysGame || todaysGame.status !== "in_progress") return;
      
      if (e.key === "Backspace") {
        setCurrentGuess(prev => prev.slice(0, -1));
      } else if (e.key === "Enter") {
        if (currentGuess.length === 5) {
          handleSubmitGuess();
        }
      } else if (/^[a-zçğıöşü]$/.test(e.key) && currentGuess.length < 5) {
        setCurrentGuess(prev => prev + e.key.toLowerCase());
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSubmitting, todaysGame, currentGuess]);

  const renderGrid = () => {
    const rows = [];
    const maxGuesses = todaysGame?.maxGuesses || 6;
    const guesses = todaysGame?.guesses || [];

    for (let i = 0; i < maxGuesses; i++) {
      const guess = guesses[i];
      const isCurrentRow = i === guesses.length && todaysGame?.status === "in_progress";
      const displayWord = isCurrentRow ? currentGuess.padEnd(5, " ") : guess?.word.padEnd(5, " ") || "     ";

      rows.push(
        <div key={i} className={`flex gap-2 justify-center ${shakeRow === i ? "animate-shake" : ""}`}>
          {displayWord.split("").map((letter, j) => {
            const result = guess?.result[j];
            let bgColor = "bg-muted border-2 border-border";
            let textColor = "text-foreground";

            if (result === "correct") {
              bgColor = "bg-green-600 border-green-600";
              textColor = "text-white";
            } else if (result === "present") {
              bgColor = "bg-yellow-600 border-yellow-600";
              textColor = "text-white";
            } else if (result === "absent") {
              bgColor = "bg-gray-600 border-gray-600";
              textColor = "text-white";
            } else if (isCurrentRow && letter !== " ") {
              bgColor = "bg-secondary border-primary";
            }

            return (
              <div
                key={j}
                className={`w-12 h-12 sm:w-14 sm:h-14 flex items-center justify-center text-xl sm:text-2xl font-bold ${bgColor} ${textColor} rounded transition-all duration-200`}
              >
                {letter !== " " ? letter.toUpperCase() : ""}
              </div>
            );
          })}
        </div>
      );
    }

    return rows;
  };

  const getKeyColor = (key: string) => {
    const state = keyboardState[key];
    if (state === "correct") return "bg-green-600 text-white hover:bg-green-700";
    if (state === "present") return "bg-yellow-600 text-white hover:bg-yellow-700";
    if (state === "absent") return "bg-gray-600 text-white hover:bg-gray-700";
    return "bg-secondary hover:bg-secondary/80";
  };

  return (
    <MainLayout>
      <div className="max-w-2xl mx-auto p-4 space-y-6">
        {/* Header */}
        <Button variant="ghost" size="sm" onClick={() => navigate("/social-play")}>
          <ArrowLeft className="h-4 w-4 mr-1" />
          Sosyal Oyun Alanına Dön
        </Button>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-xl">
              <BookText className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Kelime Tahmin</h1>
              <p className="text-sm text-muted-foreground">5 harfli kelimeyi bul</p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={() => setShowStatsDialog(true)}>
            <Trophy className="h-4 w-4 mr-1" />
            İstatistikler
          </Button>
        </div>

        {/* Game Area */}
        {!todaysGame ? (
          <Card>
            <CardContent className="p-12 text-center">
              <BookText className="h-16 w-16 mx-auto mb-4 text-blue-600 dark:text-blue-400" />
              <h3 className="text-xl font-semibold mb-2">Günlük Kelime Oyunu</h3>
              <p className="text-muted-foreground mb-6">
                Her gün yeni bir kelime tahmin et! 6 tahmin hakkın var.
              </p>
              <Button onClick={handleStartGame} size="lg">
                Oyuna Başla
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {/* Game Status */}
            <Card>
              <CardContent className="p-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-6">
                      <div>
                        <div className="text-sm text-muted-foreground">Tahmin</div>
                        <div className="text-xl font-bold">
                          {todaysGame.guesses.length}/{todaysGame.maxGuesses}
                        </div>
                      </div>
                      {todaysGame.status !== "in_progress" && (
                        <div>
                          <div className="text-sm text-muted-foreground">Kelime</div>
                          <div className="text-xl font-bold uppercase">{revealedWord || todaysGame.word}</div>
                        </div>
                      )}
                    </div>
                    <Badge variant={
                      todaysGame.status === "won" ? "default" : 
                      todaysGame.status === "lost" ? "destructive" : 
                      "secondary"
                    }>
                      {todaysGame.status === "won" ? "Kazandınız!" : 
                       todaysGame.status === "lost" ? "Kaybettiniz" : "Devam Ediyor"}
                    </Badge>
                  </div>
                  {gameHint && todaysGame.status === "in_progress" && (
                    <div className="flex items-center gap-2 pt-2 border-t">
                      <span className="text-sm text-muted-foreground">İpucu:</span>
                      <Badge variant="outline" className="text-sm">{gameHint}</Badge>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Game Grid */}
            <Card>
              <CardContent className="p-6 space-y-2">
                {renderGrid()}
              </CardContent>
            </Card>

            {/* Keyboard */}
            {todaysGame.status === "in_progress" && (
              <Card>
                <CardContent className="p-3 sm:p-4 space-y-2">
                  {KEYBOARD_ROWS.map((row, i) => (
                    <div key={i} className="flex gap-1 justify-center">
                      {i === 2 && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleKeyPress("enter")}
                          className="px-2 sm:px-3 h-10 sm:h-12 text-xs sm:text-sm font-semibold"
                          disabled={isSubmitting || currentGuess.length !== 5}
                        >
                          GİR
                        </Button>
                      )}
                      {row.map(key => (
                        <Button
                          key={key}
                          variant="secondary"
                          size="sm"
                          onClick={() => handleKeyPress(key)}
                          className={`w-8 sm:w-10 h-10 sm:h-12 p-0 text-sm sm:text-base font-semibold uppercase ${getKeyColor(key)}`}
                          disabled={isSubmitting}
                        >
                          {key}
                        </Button>
                      ))}
                      {i === 2 && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleKeyPress("backspace")}
                          className="px-2 sm:px-3 h-10 sm:h-12 text-xs sm:text-sm font-semibold"
                          disabled={isSubmitting}
                        >
                          SİL
                        </Button>
                      )}
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Stats Dialog */}
        <Dialog open={showStatsDialog} onOpenChange={setShowStatsDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>İstatistiklerim</DialogTitle>
              <DialogDescription>Kelime tahmin performansın</DialogDescription>
            </DialogHeader>
            {stats && (
              <div className="space-y-6">
                <div className="grid grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold">{stats.totalGames}</div>
                    <div className="text-xs text-muted-foreground">Oyun</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold">{stats.winRate}%</div>
                    <div className="text-xs text-muted-foreground">Kazanma</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold">{stats.currentStreak}</div>
                    <div className="text-xs text-muted-foreground">Seri</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold">{stats.maxStreak}</div>
                    <div className="text-xs text-muted-foreground">En İyi</div>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="text-sm font-semibold">Tahmin Dağılımı</div>
                  {Object.entries(stats.guessDistribution).map(([guess, count]) => (
                    <div key={guess} className="flex items-center gap-2">
                      <div className="w-4 text-sm">{guess}</div>
                      <div className="flex-1 h-6 bg-secondary rounded overflow-hidden">
                        <div
                          className="h-full bg-green-600 flex items-center justify-end pr-2 text-xs text-white font-semibold"
                          style={{
                            width: `${stats.wonGames > 0 ? (count / stats.wonGames) * 100 : 0}%`,
                            minWidth: count > 0 ? "20px" : "0",
                          }}
                        >
                          {count > 0 ? count : ""}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Completion Dialog */}
        <Dialog open={showCompletionDialog} onOpenChange={setShowCompletionDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="text-center text-xl">
                {todaysGame?.status === "won" ? "🎉 Tebrikler!" : "😔 Oyun Bitti"}
              </DialogTitle>
              <DialogDescription className="text-center">
                {completionMessage}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="text-center p-4 bg-secondary rounded-lg">
                <div className="text-sm text-muted-foreground mb-1">Tahmin Sayısı</div>
                <div className="text-3xl font-bold">{todaysGame?.guesses.length}/{todaysGame?.maxGuesses}</div>
              </div>
              <Button onClick={() => setShowCompletionDialog(false)} className="w-full">
                Tamam
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </MainLayout>
  );
}

export default function WordGuessGamePage() {
  return (
    <>
      <Unauthenticated>
        <div className="min-h-screen flex flex-col items-center justify-center p-4">
          <div className="text-center space-y-6 max-w-md">
            <BookText className="h-16 w-16 mx-auto text-muted-foreground" />
            <h1 className="text-3xl font-bold">Kelime Tahmin</h1>
            <p className="text-muted-foreground">
              Oyuna erişmek için giriş yapmalısınız
            </p>
            <SignInButton />
          </div>
        </div>
      </Unauthenticated>
      <AuthLoading>
        <div className="min-h-screen flex items-center justify-center">
          <Skeleton className="h-20 w-20 rounded-full" />
        </div>
      </AuthLoading>
      <Authenticated>
        <WordGuessGameContent />
      </Authenticated>
    </>
  );
}
