import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button.tsx";
import {
  X,
  Camera,
  Video,
  FlipHorizontal,
  Zap,
  ZapOff,
  Grid3x3,
  Timer,
  Image as ImageIcon,
  Circle,
} from "lucide-react";
import { toast } from "sonner";

interface CameraScreenProps {
  open: boolean;
  mode: "story" | "post";
  onClose: () => void;
  onCapture: (file: File, type: "image" | "video") => void;
  onGalleryClick: () => void;
}

export default function CameraScreen({
  open,
  mode,
  onClose,
  onCapture,
  onGalleryClick,
}: CameraScreenProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);

  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [facingMode, setFacingMode] = useState<"user" | "environment">("user");
  const [flashEnabled, setFlashEnabled] = useState(false);
  const [gridEnabled, setGridEnabled] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState<0 | 3 | 5 | 10>(0); // 0 = off
  const [countdown, setCountdown] = useState<number>(0);
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [permissionState, setPermissionState] = useState<"pending" | "granted" | "denied">("pending");
  const [captureMode, setCaptureMode] = useState<"photo" | "video">("photo");
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Start camera
  const startCamera = useCallback(async () => {
    try {
      // Stop existing stream
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }

      const constraints: MediaStreamConstraints = {
        video: {
          facingMode,
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
        audio: captureMode === "video",
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        
        // Try to play, but don't fail if it doesn't work immediately
        try {
          await videoRef.current.play();
        } catch (playError) {
          console.log("Play error (will retry):", playError);
          // Video will autoplay due to autoPlay attribute
        }
        
        setIsCameraReady(true);
        setPermissionState("granted");
      }

      // Enable torch/flash if supported
      if (flashEnabled && facingMode === "environment") {
        const videoTrack = stream.getVideoTracks()[0];
        const capabilities = videoTrack.getCapabilities() as {
          torch?: boolean;
        };
        if (capabilities.torch) {
          await videoTrack.applyConstraints({
            // @ts-expect-error - torch is not in standard types yet
            advanced: [{ torch: true }],
          });
        }
      }
    } catch (error) {
      console.error("Camera error:", error);
      if (error instanceof Error) {
        if (error.name === "NotAllowedError") {
          setPermissionState("denied");
          toast.error("Kamera izni reddedildi");
        } else if (error.name === "NotFoundError") {
          setPermissionState("denied");
          toast.error("Kamera bulunamadı");
        } else {
          setPermissionState("denied");
          toast.error("Kamera başlatılamadı");
        }
      } else {
        setPermissionState("denied");
      }
    }
  }, [facingMode, flashEnabled, captureMode]);

  useEffect(() => {
    // Auto-start camera when component opens - with small delay to ensure DOM is ready
    if (open && !isCameraReady && permissionState === "pending") {
      const timeoutId = setTimeout(() => {
        startCamera();
      }, 100);
      
      return () => clearTimeout(timeoutId);
    }
    
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, isCameraReady, permissionState]);

  // Toggle flash/torch
  const toggleFlash = async () => {
    if (!streamRef.current) return;

    const videoTrack = streamRef.current.getVideoTracks()[0];
    const capabilities = videoTrack.getCapabilities() as { torch?: boolean };

    if (capabilities.torch) {
      try {
        await videoTrack.applyConstraints({
          // @ts-expect-error - torch is not in standard types yet
          advanced: [{ torch: !flashEnabled }],
        });
        setFlashEnabled(!flashEnabled);
      } catch (error) {
        toast.error("Flash desteklenmiyor");
      }
    } else {
      toast.error("Bu cihazda flash desteklenmiyor");
    }
  };

  // Switch camera (front/back)
  const switchCamera = async () => {
    const newFacingMode = facingMode === "user" ? "environment" : "user";
    setFacingMode(newFacingMode);
  };
  
  // Restart camera when facing mode changes
  useEffect(() => {
    if (open && isCameraReady) {
      startCamera();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [facingMode]);
  
  // Restart camera when capture mode changes (for audio)
  useEffect(() => {
    if (open && isCameraReady) {
      startCamera();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [captureMode]);

  // Toggle timer (cycle through 0, 3, 5, 10 seconds)
  const toggleTimer = () => {
    const timerCycle: Array<0 | 3 | 5 | 10> = [0, 3, 5, 10];
    const currentIndex = timerCycle.indexOf(timerSeconds);
    const nextIndex = (currentIndex + 1) % timerCycle.length;
    setTimerSeconds(timerCycle[nextIndex]);
  };

  // Start countdown
  const startCountdown = useCallback((seconds: number, onComplete: () => void) => {
    setCountdown(seconds);
    
    let remaining = seconds;
    countdownIntervalRef.current = setInterval(() => {
      remaining--;
      setCountdown(remaining);
      
      if (remaining <= 0) {
        if (countdownIntervalRef.current) {
          clearInterval(countdownIntervalRef.current);
          countdownIntervalRef.current = null;
        }
        setCountdown(0);
        onComplete();
      }
    }, 1000);
  }, []);

  // Take photo
  const takePhoto = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext("2d");
    if (!context) return;

    // Set canvas size to video size
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Draw video frame to canvas
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Convert to blob
    canvas.toBlob(
      (blob) => {
        if (blob) {
          const file = new File([blob], "photo.jpg", { type: "image/jpeg" });
          onCapture(file, "image");
          toast.success("Fotoğraf çekildi!");
        }
      },
      "image/jpeg",
      0.95
    );
  }, [onCapture]);

  // Stop video recording
  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current = null;
      setIsRecording(false);

      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
    }
  }, [isRecording]);

  // Start video recording
  const startRecording = useCallback(async () => {
    if (!streamRef.current) return;

    chunksRef.current = [];

    try {
      const mimeType = MediaRecorder.isTypeSupported("video/webm;codecs=vp9")
        ? "video/webm;codecs=vp9"
        : MediaRecorder.isTypeSupported("video/webm")
        ? "video/webm"
        : "video/mp4";

      const mediaRecorder = new MediaRecorder(streamRef.current, {
        mimeType,
        videoBitsPerSecond: 2500000,
      });

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mimeType });
        const file = new File([blob], "video.mp4", { type: "video/mp4" });
        onCapture(file, "video");
        toast.success("Video kaydedildi!");
      };

      mediaRecorder.start();
      mediaRecorderRef.current = mediaRecorder;
      setIsRecording(true);
      setRecordingTime(0);

      // Start recording timer
      timerIntervalRef.current = setInterval(() => {
        setRecordingTime((prev) => {
          const newTime = prev + 1;
          // Auto-stop at 60 seconds
          if (newTime >= 60) {
            stopRecording();
          }
          return newTime;
        });
      }, 1000);
    } catch (error) {
      console.error("Recording error:", error);
      toast.error("Video kaydı başlatılamadı");
    }
  }, [onCapture, stopRecording]);

  // Handle capture button (photo or video)
  const handleCaptureClick = () => {
    // If countdown is active, ignore clicks
    if (countdown > 0) return;

    if (captureMode === "photo") {
      // If timer is enabled, start countdown
      if (timerSeconds > 0) {
        startCountdown(timerSeconds, () => {
          takePhoto();
        });
      } else {
        takePhoto();
      }
    } else {
      if (isRecording) {
        stopRecording();
      } else {
        // Video mode doesn't use timer
        startRecording();
      }
    }
  };

  // Long press for video recording in photo mode
  const handleCaptureMouseDown = () => {
    if (captureMode === "photo") {
      // Switch to video mode and start recording on long press
      setTimeout(() => {
        setCaptureMode("video");
        startRecording();
      }, 500);
    }
  };

  const handleCaptureMouseUp = () => {
    if (captureMode === "video" && isRecording) {
      stopRecording();
      setTimeout(() => setCaptureMode("photo"), 100);
    }
  };

  // Format recording time
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  // Don't render if not open
  if (!open) return null;

  // Show permission screen if denied
  if (permissionState === "denied") {
    return (
      <div className="fixed inset-0 z-[100] bg-black flex flex-col items-center justify-center text-white p-6">
        <div className="max-w-md bg-gradient-to-b from-gray-900 to-black p-8 rounded-2xl border border-white/10 shadow-2xl">
          <div className="text-center space-y-6">
            <div className="mx-auto w-20 h-20 rounded-full bg-red-500/20 flex items-center justify-center">
              <Camera className="h-10 w-10 text-red-400" />
            </div>
            
            <div className="space-y-2">
              <h2 className="text-2xl font-bold">Kamera İzni Gerekli</h2>
              <p className="text-sm text-white/70 leading-relaxed">
                Fotoğraf ve video çekebilmek için kamera erişimine izin vermeniz gerekiyor.
              </p>
            </div>
            
            <div className="bg-white/5 rounded-xl p-4 text-left space-y-3">
              <p className="text-white/90 font-semibold text-sm flex items-center gap-2">
                <span className="text-lg">💡</span>
                İzin nasıl verilir?
              </p>
              <ol className="text-white/70 text-xs space-y-2 list-decimal list-inside">
                <li>Tarayıcınızın adres çubuğundaki <strong className="text-white">kilit (🔒)</strong> ikonuna tıklayın</li>
                <li><strong className="text-white">Kamera</strong> iznini <strong className="text-white">"İzin Ver"</strong> olarak değiştirin</li>
                <li>Sayfayı yenileyin ve tekrar deneyin</li>
              </ol>
            </div>

            <div className="flex flex-col gap-3">
              <Button onClick={startCamera} className="w-full bg-blue-600 hover:bg-blue-700">
                Tekrar Dene
              </Button>
              <Button onClick={onGalleryClick} variant="secondary" className="w-full">
                <ImageIcon className="h-4 w-4 mr-2" />
                Galeriden Seç
              </Button>
              <button 
                onClick={onClose}
                className="text-white/60 text-sm hover:text-white transition-colors"
              >
                Vazgeç
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show start screen if camera is not ready
  if (!isCameraReady) {
    return (
      <div className="fixed inset-0 z-[100] bg-black flex flex-col items-center justify-center text-white p-6">
        <div className="max-w-md bg-gradient-to-b from-gray-900 to-black p-8 rounded-2xl border border-white/10 shadow-2xl">
          <div className="text-center space-y-6">
            {permissionState === "pending" ? (
              <>
                {/* Loading Animation */}
                <div className="mx-auto w-20 h-20 rounded-full bg-blue-500/20 flex items-center justify-center relative">
                  <Camera className="h-10 w-10 text-blue-400" />
                  <div className="absolute inset-0 rounded-full border-4 border-blue-400/30 border-t-blue-400 animate-spin"></div>
                </div>
                
                <div className="space-y-2">
                  <h2 className="text-2xl font-bold">Kamera Başlatılıyor...</h2>
                  <p className="text-sm text-white/70 leading-relaxed">
                    Lütfen bekleyin
                  </p>
                </div>
              </>
            ) : (
              <>
                {/* Ready to Start */}
                <div className="mx-auto w-20 h-20 rounded-full bg-blue-500/20 flex items-center justify-center">
                  <Camera className="h-10 w-10 text-blue-400" />
                </div>
                
                <div className="space-y-2">
                  <h2 className="text-2xl font-bold">Kamera Hazır</h2>
                  <p className="text-sm text-white/70 leading-relaxed">
                    Fotoğraf veya video çekmek için kamerayı başlatın.
                  </p>
                </div>
                
                <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4 text-left">
                  <p className="text-blue-200 text-xs">
                    📸 Fotoğraf ve video çekebilmek için kameranızı açın.
                  </p>
                </div>
                
                {/* Start Camera Button */}
                <Button 
                  onClick={startCamera} 
                  className="w-full bg-blue-600 hover:bg-blue-700"
                  size="lg"
                >
                  <Camera className="h-5 w-5 mr-2" />
                  Kamerayı Başlat
                </Button>
              </>
            )}

            <div className="flex flex-col gap-3 pt-2">
              {permissionState === "pending" && (
                <Button onClick={onClose} variant="ghost" className="w-full text-white border border-white/20 hover:bg-white/10">
                  <X className="h-4 w-4 mr-2" />
                  İptal
                </Button>
              )}
              <Button onClick={onGalleryClick} variant="secondary" className="w-full">
                <ImageIcon className="h-4 w-4 mr-2" />
                Galeriden Seç
              </Button>
              {permissionState !== "pending" && (
                <button 
                  onClick={onClose}
                  className="text-white/60 text-sm hover:text-white transition-colors"
                >
                  Vazgeç
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[100] bg-black">
      {/* Video Preview */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="absolute inset-0 w-full h-full object-cover"
      />
      
      {/* Hidden canvas for photo capture */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Grid Overlay */}
      {gridEnabled && (
        <div className="absolute inset-0 pointer-events-none">
          <div className="w-full h-full grid grid-cols-3 grid-rows-3">
            {Array.from({ length: 9 }).map((_, i) => (
              <div key={i} className="border border-white/20" />
            ))}
          </div>
        </div>
      )}

      {/* Top Bar */}
      <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between p-4 bg-gradient-to-b from-black/60 to-transparent">
        {/* Close button */}
        <Button
          size="icon"
          variant="ghost"
          onClick={onClose}
          className="text-white hover:bg-white/10"
        >
          <X className="h-6 w-6" />
        </Button>

        {/* Mode Selector */}
        <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-black/40 backdrop-blur-sm">
          <button
            onClick={() => setCaptureMode("photo")}
            className={`px-4 py-1 rounded-full text-sm font-medium transition-colors ${
              captureMode === "photo"
                ? "bg-white text-black"
                : "text-white/70"
            }`}
          >
            FOTO
          </button>
          <button
            onClick={() => setCaptureMode("video")}
            className={`px-4 py-1 rounded-full text-sm font-medium transition-colors ${
              captureMode === "video"
                ? "bg-white text-black"
                : "text-white/70"
            }`}
          >
            VİDEO
          </button>
        </div>

        {/* Settings placeholder */}
        <div className="w-10" />
      </div>

      {/* Right Side Toolbar */}
      <div className="absolute right-4 top-1/2 -translate-y-1/2 z-10 flex flex-col gap-6">
        {/* Flash */}
        <button
          onClick={toggleFlash}
          className="p-3 rounded-full bg-black/40 backdrop-blur-sm hover:bg-black/60 transition-colors"
          title={flashEnabled ? "Flash Kapat" : "Flash Aç"}
        >
          {flashEnabled ? (
            <Zap className="h-6 w-6 text-yellow-400" />
          ) : (
            <ZapOff className="h-6 w-6 text-white" />
          )}
        </button>

        {/* Camera Switch */}
        <button
          onClick={switchCamera}
          className="p-3 rounded-full bg-black/40 backdrop-blur-sm hover:bg-black/60 transition-colors"
          title="Kamera Değiştir"
        >
          <FlipHorizontal className="h-6 w-6 text-white" />
        </button>

        {/* Grid */}
        <button
          onClick={() => setGridEnabled(!gridEnabled)}
          className="p-3 rounded-full bg-black/40 backdrop-blur-sm hover:bg-black/60 transition-colors"
          title={gridEnabled ? "Grid Kapat" : "Grid Aç"}
        >
          <Grid3x3 className={`h-6 w-6 ${gridEnabled ? "text-blue-400" : "text-white"}`} />
        </button>

        {/* Timer */}
        <button
          onClick={toggleTimer}
          className="p-3 rounded-full bg-black/40 backdrop-blur-sm hover:bg-black/60 transition-colors relative"
          title={timerSeconds > 0 ? `Timer: ${timerSeconds}s` : "Timer Kapalı"}
        >
          <Timer className={`h-6 w-6 ${timerSeconds > 0 ? "text-blue-400" : "text-white"}`} />
          {timerSeconds > 0 && (
            <span className="absolute -bottom-1 -right-1 text-xs font-bold bg-blue-500 text-white rounded-full w-5 h-5 flex items-center justify-center">
              {timerSeconds}
            </span>
          )}
        </button>
      </div>

      {/* Countdown indicator */}
      {countdown > 0 && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/30">
          <div className="text-white text-9xl font-bold animate-pulse">
            {countdown}
          </div>
        </div>
      )}

      {/* Recording indicator with progress */}
      {isRecording && (
        <>
          {/* Recording pulse effect */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute inset-0 border-4 border-red-500 animate-pulse rounded-lg" />
          </div>
          
          {/* Recording info */}
          <div className="absolute top-20 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-2">
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-red-600 text-white shadow-lg">
              <div className="h-3 w-3 rounded-full bg-white animate-pulse" />
              <span className="font-mono font-semibold text-lg">{formatTime(recordingTime)}</span>
            </div>
            
            {/* Progress bar */}
            <div className="w-64 h-1 bg-white/30 rounded-full overflow-hidden">
              <div 
                className="h-full bg-white transition-all duration-1000"
                style={{ width: `${(recordingTime / 60) * 100}%` }}
              />
            </div>
            
            {/* Remaining time */}
            <div className="text-white/80 text-sm font-medium">
              Kalan: {formatTime(60 - recordingTime)}
            </div>
          </div>
        </>
      )}

      {/* Bottom Bar */}
      <div className="absolute bottom-0 left-0 right-0 z-10 flex items-center justify-center gap-8 p-8 bg-gradient-to-t from-black/60 to-transparent">
        {/* Gallery Button */}
        <button
          onClick={onGalleryClick}
          className="w-12 h-12 rounded-lg border-2 border-white/50 overflow-hidden bg-white/10 hover:bg-white/20 transition-colors flex items-center justify-center"
        >
          <ImageIcon className="h-6 w-6 text-white" />
        </button>

        {/* Capture Button */}
        <button
          onMouseDown={handleCaptureMouseDown}
          onMouseUp={handleCaptureMouseUp}
          onTouchStart={handleCaptureMouseDown}
          onTouchEnd={handleCaptureMouseUp}
          onClick={handleCaptureClick}
          disabled={countdown > 0}
          className={`relative w-20 h-20 rounded-full border-4 transition-all ${
            isRecording
              ? "border-red-600 bg-red-600 scale-90"
              : "border-white bg-transparent hover:bg-white/10 active:scale-95"
          } ${countdown > 0 ? "opacity-50" : ""}`}
        >
          {isRecording ? (
            <div className="absolute inset-3 rounded-sm bg-white" />
          ) : (
            <>
              {captureMode === "video" ? (
                <Circle className="h-16 w-16 text-red-500 fill-red-500/20" />
              ) : (
                <Circle className="h-16 w-16 text-white" />
              )}
            </>
          )}
          
          {/* Video mode indicator ring */}
          {captureMode === "video" && !isRecording && (
            <div className="absolute inset-0 rounded-full border-2 border-red-500 animate-pulse" />
          )}
        </button>

        {/* Preview placeholder */}
        <div className="w-12 h-12 rounded-lg border-2 border-white/50 bg-white/10" />
      </div>
    </div>
  );
}
