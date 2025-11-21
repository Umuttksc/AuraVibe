import { useState, useRef, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button.tsx";

interface MediaCarouselProps {
  media: Array<{
    type: "image" | "video";
    url: string;
  }>;
  className?: string;
  showControls?: boolean;
  autoPlayVideo?: boolean;
}

export default function MediaCarousel({
  media,
  className = "",
  showControls = true,
  autoPlayVideo = true,
}: MediaCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const goToNext = () => {
    setCurrentIndex((prev) => (prev + 1) % media.length);
  };

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev - 1 + media.length) % media.length);
  };

  // Touch handlers for swipe
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (touchStart - touchEnd > 75) {
      // Swiped left
      goToNext();
    }

    if (touchStart - touchEnd < -75) {
      // Swiped right
      goToPrevious();
    }
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") {
        goToPrevious();
      } else if (e.key === "ArrowRight") {
        goToNext();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (media.length === 0) {
    return null;
  }

  const currentMedia = media[currentIndex];
  const hasMultiple = media.length > 1;

  return (
    <div
      ref={containerRef}
      className={`relative w-full aspect-square bg-black/5 rounded-lg overflow-hidden ${className}`}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Media Display */}
      <div className="w-full h-full flex items-center justify-center">
        {currentMedia.type === "image" ? (
          <img
            src={currentMedia.url}
            alt={`Media ${currentIndex + 1}`}
            className="w-full h-full object-cover"
          />
        ) : (
          <video
            src={currentMedia.url}
            controls
            autoPlay={autoPlayVideo}
            loop
            playsInline
            className="w-full h-full object-cover"
          />
        )}
      </div>

      {/* Navigation Buttons - Desktop */}
      {hasMultiple && showControls && (
        <>
          <Button
            variant="ghost"
            size="icon"
            onClick={goToPrevious}
            className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white backdrop-blur-sm hidden md:flex"
          >
            <ChevronLeft className="h-6 w-6" />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={goToNext}
            className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white backdrop-blur-sm hidden md:flex"
          >
            <ChevronRight className="h-6 w-6" />
          </Button>
        </>
      )}

      {/* Indicators */}
      {hasMultiple && (
        <>
          {/* Counter - Top Right */}
          <div className="absolute top-3 right-3 px-3 py-1.5 bg-black/70 backdrop-blur-sm text-white text-sm font-medium rounded-full">
            {currentIndex + 1} / {media.length}
          </div>

          {/* Dot Indicators - Bottom Center */}
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
            {media.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentIndex(index)}
                className={`h-1.5 rounded-full transition-all ${
                  index === currentIndex
                    ? "bg-white w-8"
                    : "bg-white/50 w-1.5 hover:bg-white/75"
                }`}
                aria-label={`Go to media ${index + 1}`}
              />
            ))}
          </div>
        </>
      )}

      {/* Swipe Hint - Mobile Only */}
      {hasMultiple && currentIndex === 0 && (
        <div className="absolute top-1/2 -translate-y-1/2 left-1/2 -translate-x-1/2 pointer-events-none md:hidden">
          <div className="bg-black/70 backdrop-blur-sm text-white text-xs px-3 py-2 rounded-full animate-pulse">
            ← Kaydırın →
          </div>
        </div>
      )}
    </div>
  );
}
