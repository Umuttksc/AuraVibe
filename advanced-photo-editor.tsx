import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button.tsx";
import { Slider } from "@/components/ui/slider.tsx";
import { Input } from "@/components/ui/input.tsx";
import { X, Check, Type, Wand2, SlidersHorizontal, RotateCw, Music2 } from "lucide-react";
import { toast } from "sonner";
import MusicSelectorDialog from "@/components/music-selector-dialog.tsx";
import type { Id } from "@/convex/_generated/dataModel.d.ts";

interface PhotoEditorProps {
  imageUrl: string;
  onSave: (editedBlob: Blob) => void;
  onCancel: () => void;
  selectedMusicId?: Id<"music">;
  onMusicSelect?: (musicId: Id<"music">) => void;
}

interface TextElement {
  id: string;
  text: string;
  x: number;
  y: number;
  color: string;
  size: number;
  backgroundColor?: string;
  textStyle: "normal" | "filled" | "outlined";
}

// Filtreler
const FILTERS = [
  { name: "Normal", filter: "" },
  { name: "Canlı", filter: "contrast(1.2) saturate(1.35)" },
  { name: "Pastel", filter: "brightness(1.05) hue-rotate(-10deg)" },
  { name: "Güneş", filter: "contrast(1.2) brightness(1.1) saturate(1.4) sepia(0.2)" },
  { name: "Aydınlık", filter: "contrast(0.9) brightness(1.1) saturate(1.2)" },
  { name: "Görkemli", filter: "brightness(1.05) saturate(2)" },
  { name: "Sıcak", filter: "contrast(1.08) brightness(1.08) sepia(0.08)" },
  { name: "Doğa", filter: "brightness(1.1) hue-rotate(10deg) sepia(0.3) saturate(1.6)" },
];

export default function AdvancedPhotoEditor({ imageUrl, onSave, onCancel, selectedMusicId, onMusicSelect }: PhotoEditorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const [activeTab, setActiveTab] = useState<"filters" | "adjust" | "crop" | "text" | null>(null);
  const [musicDialogOpen, setMusicDialogOpen] = useState(false);
  
  // Filtre
  const [selectedFilter, setSelectedFilter] = useState(0);
  
  // Ayarlamalar
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  const [saturation, setSaturation] = useState(100);
  const [rotation, setRotation] = useState(0);
  
  // Metin
  const [textElements, setTextElements] = useState<TextElement[]>([]);
  const [currentText, setCurrentText] = useState("");
  const [textColor, setTextColor] = useState("#FFFFFF");
  const [textSize, setTextSize] = useState(48);
  const [textStyle, setTextStyle] = useState<"normal" | "filled" | "outlined">("normal");
  const [textBackgroundColor, setTextBackgroundColor] = useState("#000000");
  const [selectedElement, setSelectedElement] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  // Canvas'ı çiz
  const drawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const img = imageRef.current;
    if (!canvas || !img) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Canvas boyutunu ayarla
    canvas.width = img.width;
    canvas.height = img.height;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();

    // Rotasyon
    if (rotation !== 0) {
      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.rotate((rotation * Math.PI) / 180);
      ctx.translate(-canvas.width / 2, -canvas.height / 2);
    }

    // Filtreler
    const filterString = `
      ${FILTERS[selectedFilter].filter}
      brightness(${brightness}%)
      contrast(${contrast}%)
      saturate(${saturation}%)
    `.trim();
    ctx.filter = filterString;

    // Resmi çiz
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    ctx.filter = "none";
    ctx.restore();

    // Metinleri çiz
    textElements.forEach((element) => {
      ctx.save();
      ctx.translate(element.x, element.y);
      ctx.font = `bold ${element.size}px Arial`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      
      const textWidth = ctx.measureText(element.text).width;
      const padding = 12;
      
      // Stil uygula
      if (element.textStyle === "filled") {
        // Dolgulu arka plan
        ctx.fillStyle = element.backgroundColor || "#000000";
        ctx.fillRect(
          -textWidth / 2 - padding,
          -element.size / 2 - padding / 2,
          textWidth + padding * 2,
          element.size + padding
        );
        // Metin
        ctx.fillStyle = element.color;
        ctx.fillText(element.text, 0, 0);
      } else if (element.textStyle === "outlined") {
        // Konturlu metin
        ctx.strokeStyle = element.backgroundColor || "#000000";
        ctx.lineWidth = 6;
        ctx.strokeText(element.text, 0, 0);
        ctx.fillStyle = element.color;
        ctx.fillText(element.text, 0, 0);
      } else {
        // Normal - gölge ile
        ctx.shadowColor = "rgba(0, 0, 0, 0.8)";
        ctx.shadowBlur = 4;
        ctx.shadowOffsetX = 2;
        ctx.shadowOffsetY = 2;
        ctx.fillStyle = element.color;
        ctx.fillText(element.text, 0, 0);
      }
      
      // Seçili metne border göster
      if (element.id === selectedElement) {
        ctx.shadowColor = "transparent";
        ctx.shadowBlur = 0;
        ctx.strokeStyle = "#3b82f6";
        ctx.lineWidth = 3;
        ctx.strokeRect(
          -textWidth / 2 - padding,
          -element.size / 2 - padding,
          textWidth + padding * 2,
          element.size + padding * 2
        );
      }
      
      ctx.restore();
    });
  }, [selectedFilter, brightness, contrast, saturation, rotation, textElements, selectedElement]);

  // Resmi yükle
  useEffect(() => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      imageRef.current = img;
      drawCanvas();
    };
    img.src = imageUrl;
  }, [imageUrl, drawCanvas]);

  // Canvas'ı güncelle
  useEffect(() => {
    drawCanvas();
  }, [selectedFilter, brightness, contrast, saturation, rotation, textElements, drawCanvas]);

  // Metin ekle
  const addText = () => {
    if (!currentText.trim()) {
      toast.error("Lütfen bir metin girin");
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;

    const newElement: TextElement = {
      id: Date.now().toString(),
      text: currentText,
      x: canvas.width / 2,
      y: canvas.height / 2 + (textElements.length * 60), // Her metin biraz aşağıda
      color: textColor,
      size: textSize,
      backgroundColor: textBackgroundColor,
      textStyle: textStyle,
    };

    setTextElements([...textElements, newElement]);
    setCurrentText("");
    // Seçimi kaldır ki hemen yeni metin ekleyebilsin
    setSelectedElement(null);
    toast.success(`Metin ${textElements.length + 1} eklendi! Tıklayarak düzenle`);
  };

  // Metin sürükleme
  const handleCanvasMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    // Metne tıklandı mı?
    const clickedElement = textElements.find((el) => {
      const textWidth = el.size * el.text.length * 0.6;
      const textHeight = el.size;
      return (
        x >= el.x - textWidth / 2 &&
        x <= el.x + textWidth / 2 &&
        y >= el.y - textHeight / 2 &&
        y <= el.y + textHeight / 2
      );
    });

    if (clickedElement) {
      setSelectedElement(clickedElement.id);
      setIsDragging(true);
      setDragOffset({ x: x - clickedElement.x, y: y - clickedElement.y });
    } else {
      // Boş alana tıklandı, seçimi kaldır
      setSelectedElement(null);
    }
  };

  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDragging || !selectedElement) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    setTextElements((elements) =>
      elements.map((el) =>
        el.id === selectedElement
          ? { ...el, x: x - dragOffset.x, y: y - dragOffset.y }
          : el
      )
    );
  };

  const handleCanvasMouseUp = () => {
    setIsDragging(false);
  };

  // Touch event'leri (mobil için)
  const handleCanvasTouchStart = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (e.touches.length !== 1) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;

    const touch = e.touches[0];
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (touch.clientX - rect.left) * scaleX;
    const y = (touch.clientY - rect.top) * scaleY;

    // Metne dokunuldu mu?
    const clickedElement = textElements.find((el) => {
      const textWidth = el.size * el.text.length * 0.6;
      const textHeight = el.size;
      return (
        x >= el.x - textWidth / 2 &&
        x <= el.x + textWidth / 2 &&
        y >= el.y - textHeight / 2 &&
        y <= el.y + textHeight / 2
      );
    });

    if (clickedElement) {
      setSelectedElement(clickedElement.id);
      setIsDragging(true);
      setDragOffset({ x: x - clickedElement.x, y: y - clickedElement.y });
    } else {
      // Boş alana dokunuldu, seçimi kaldır
      setSelectedElement(null);
    }
  };

  const handleCanvasTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDragging || !selectedElement || e.touches.length !== 1) return;

    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;

    const touch = e.touches[0];
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (touch.clientX - rect.left) * scaleX;
    const y = (touch.clientY - rect.top) * scaleY;

    setTextElements((elements) =>
      elements.map((el) =>
        el.id === selectedElement
          ? { ...el, x: x - dragOffset.x, y: y - dragOffset.y }
          : el
      )
    );
  };

  const handleCanvasTouchEnd = () => {
    setIsDragging(false);
  };

  // Metni sil
  const deleteText = () => {
    if (!selectedElement) return;
    setTextElements((elements) => elements.filter((el) => el.id !== selectedElement));
    setSelectedElement(null);
    toast.success("Metin silindi");
  };

  // Seçili metnin özelliklerini güncelle
  const updateSelectedTextColor = (color: string) => {
    if (!selectedElement) return;
    setTextElements((elements) =>
      elements.map((el) => (el.id === selectedElement ? { ...el, color } : el))
    );
    setTextColor(color);
  };

  const updateSelectedTextStyle = (style: "normal" | "filled" | "outlined") => {
    if (!selectedElement) return;
    setTextElements((elements) =>
      elements.map((el) => (el.id === selectedElement ? { ...el, textStyle: style } : el))
    );
    setTextStyle(style);
  };

  const updateSelectedTextBackgroundColor = (bgColor: string) => {
    if (!selectedElement) return;
    setTextElements((elements) =>
      elements.map((el) => (el.id === selectedElement ? { ...el, backgroundColor: bgColor } : el))
    );
    setTextBackgroundColor(bgColor);
  };

  // Seçili eleman değiştiğinde özelliklerini yükle
  useEffect(() => {
    if (selectedElement) {
      const element = textElements.find((el) => el.id === selectedElement);
      if (element) {
        setTextColor(element.color);
        setTextSize(element.size);
        setTextStyle(element.textStyle);
        setTextBackgroundColor(element.backgroundColor || "#000000");
      }
    }
  }, [selectedElement, textElements]);

  // Kaydet
  const handleSave = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.toBlob((blob) => {
      if (blob) {
        onSave(blob);
      }
    }, "image/jpeg", 0.95);
  };

  // Rotasyon
  const handleRotate = () => {
    setRotation((prev) => (prev + 90) % 360);
  };

  // Sıfırla
  const handleReset = () => {
    setSelectedFilter(0);
    setBrightness(100);
    setContrast(100);
    setSaturation(100);
    setRotation(0);
    setTextElements([]);
    setSelectedElement(null);
    toast.success("Sıfırlandı");
  };

  return (
    <div className="fixed inset-0 z-[9999] bg-black flex flex-col" style={{ pointerEvents: "auto" }}>
      {/* Üst Bar */}
      <div className="flex items-center justify-between px-4 py-3 bg-black/90 backdrop-blur-sm z-10">
        <button
          type="button"
          onClick={onCancel}
          className="flex items-center justify-center w-10 h-10 text-white hover:bg-white/10 rounded-full transition-colors cursor-pointer"
        >
          <X className="h-6 w-6" />
        </button>
        
        <h1 className="text-lg font-semibold text-white">Düzenle</h1>
        
        <button
          type="button"
          onClick={handleSave}
          className="flex items-center justify-center w-10 h-10 text-blue-500 hover:bg-white/10 rounded-full transition-colors cursor-pointer"
        >
          <Check className="h-6 w-6" />
        </button>
      </div>

      {/* Canvas - Tam Ekran */}
      <div className="flex-1 flex items-center justify-center overflow-hidden p-4 relative">
        <canvas
          ref={canvasRef}
          className="max-w-full max-h-full object-contain rounded-lg"
          style={{ 
            touchAction: "none", 
            pointerEvents: "auto",
            cursor: isDragging ? "grabbing" : selectedElement ? "grab" : "default"
          }}
          onMouseDown={handleCanvasMouseDown}
          onMouseMove={handleCanvasMouseMove}
          onMouseUp={handleCanvasMouseUp}
          onMouseLeave={handleCanvasMouseUp}
          onTouchStart={handleCanvasTouchStart}
          onTouchMove={handleCanvasTouchMove}
          onTouchEnd={handleCanvasTouchEnd}
        />
      </div>

      {/* Alt Araç Çubuğu */}
      <div className="bg-black/90 backdrop-blur-sm border-t border-white/10 relative z-50">
        {/* Araç Butonları */}
        <div className="flex items-center justify-around p-3 border-b border-white/10">
          <button
            type="button"
            onClick={() => setActiveTab(activeTab === "filters" ? null : "filters")}
            className={`flex flex-col items-center gap-1 px-4 py-2 rounded-lg transition-colors cursor-pointer ${
              activeTab === "filters" ? "bg-white/20 text-white" : "text-gray-400 hover:text-white hover:bg-white/10"
            }`}
          >
            <Wand2 className="h-5 w-5" />
            <span className="text-xs">Filtre</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab(activeTab === "adjust" ? null : "adjust")}
            className={`flex flex-col items-center gap-1 px-4 py-2 rounded-lg transition-colors cursor-pointer ${
              activeTab === "adjust" ? "bg-white/20 text-white" : "text-gray-400 hover:text-white hover:bg-white/10"
            }`}
          >
            <SlidersHorizontal className="h-5 w-5" />
            <span className="text-xs">Ayarla</span>
          </button>

          <button
            type="button"
            onClick={handleRotate}
            className="flex flex-col items-center gap-1 px-4 py-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <RotateCw className="h-5 w-5" />
            <span className="text-xs">Döndür</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab(activeTab === "text" ? null : "text")}
            className={`flex flex-col items-center gap-1 px-4 py-2 rounded-lg transition-colors cursor-pointer ${
              activeTab === "text" ? "bg-white/20 text-white" : "text-gray-400 hover:text-white hover:bg-white/10"
            }`}
          >
            <Type className="h-5 w-5" />
            <span className="text-xs">Metin</span>
          </button>

          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setMusicDialogOpen(true);
            }}
            className={`flex flex-col items-center gap-1 px-4 py-2 rounded-lg transition-colors cursor-pointer touch-manipulation ${
              selectedMusicId ? "bg-white/20 text-white" : "text-gray-400 hover:text-white hover:bg-white/10"
            }`}
            style={{ pointerEvents: "auto", zIndex: 50 }}
          >
            <Music2 className="h-5 w-5" />
            <span className="text-xs">Müzik</span>
          </button>
        </div>

        {/* Araç Panelleri */}
        {activeTab === "filters" && (
          <div className="p-4 max-h-64 overflow-y-auto">
            <div className="grid grid-cols-4 gap-3">
              {FILTERS.map((filter, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => setSelectedFilter(index)}
                  className={`flex flex-col items-center gap-2 p-2 rounded-lg transition-colors cursor-pointer ${
                    selectedFilter === index
                      ? "bg-blue-600 text-white"
                      : "bg-white/5 text-gray-300 hover:bg-white/10"
                  }`}
                >
                  <div
                    className="w-full aspect-square rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 pointer-events-none"
                    style={{ filter: filter.filter }}
                  />
                  <span className="text-xs pointer-events-none">{filter.name}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {activeTab === "adjust" && (
          <div className="p-4 space-y-4">
            <div>
              <div className="flex justify-between text-sm text-gray-400 mb-2">
                <span>Parlaklık</span>
                <span>{brightness}%</span>
              </div>
              <Slider
                value={[brightness]}
                onValueChange={([val]) => setBrightness(val)}
                min={50}
                max={150}
                step={1}
                className="w-full"
              />
            </div>

            <div>
              <div className="flex justify-between text-sm text-gray-400 mb-2">
                <span>Kontrast</span>
                <span>{contrast}%</span>
              </div>
              <Slider
                value={[contrast]}
                onValueChange={([val]) => setContrast(val)}
                min={50}
                max={150}
                step={1}
                className="w-full"
              />
            </div>

            <div>
              <div className="flex justify-between text-sm text-gray-400 mb-2">
                <span>Doygunluk</span>
                <span>{saturation}%</span>
              </div>
              <Slider
                value={[saturation]}
                onValueChange={([val]) => setSaturation(val)}
                min={0}
                max={200}
                step={1}
                className="w-full"
              />
            </div>

            <Button
              onClick={handleReset}
              variant="outline"
              size="sm"
              className="w-full"
            >
              Sıfırla
            </Button>
          </div>
        )}

        {activeTab === "text" && (
          <div className="p-4 space-y-3">
            {!selectedElement ? (
              <>
                {/* Yeni Metin Ekle */}
                <div className="text-sm text-gray-400 font-medium mb-2">Yeni Metin</div>
                <Input
                  value={currentText}
                  onChange={(e) => setCurrentText(e.target.value)}
                  placeholder="Metin gir..."
                  className="bg-white/5 border-white/10 text-white placeholder:text-gray-400"
                />

                <div className="flex gap-2 items-center">
                  <span className="text-xs text-gray-400 w-12">Renk</span>
                  <input
                    type="color"
                    value={textColor}
                    onChange={(e) => setTextColor(e.target.value)}
                    className="w-12 h-10 rounded-lg cursor-pointer"
                  />
                  <Slider
                    value={[textSize]}
                    onValueChange={([val]) => setTextSize(val)}
                    min={24}
                    max={96}
                    step={4}
                    className="flex-1"
                  />
                  <span className="text-sm text-gray-400 w-12 text-right">{textSize}px</span>
                </div>

                {/* Stil Seçimi */}
                <div className="space-y-2">
                  <span className="text-xs text-gray-400">Stil</span>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setTextStyle("normal")}
                      className={`px-3 py-2 rounded-lg text-sm transition-colors cursor-pointer ${
                        textStyle === "normal"
                          ? "bg-blue-600 text-white"
                          : "bg-white/5 text-gray-300 hover:bg-white/10"
                      }`}
                    >
                      Normal
                    </button>
                    <button
                      type="button"
                      onClick={() => setTextStyle("filled")}
                      className={`px-3 py-2 rounded-lg text-sm transition-colors cursor-pointer ${
                        textStyle === "filled"
                          ? "bg-blue-600 text-white"
                          : "bg-white/5 text-gray-300 hover:bg-white/10"
                      }`}
                    >
                      Dolgulu
                    </button>
                    <button
                      type="button"
                      onClick={() => setTextStyle("outlined")}
                      className={`px-3 py-2 rounded-lg text-sm transition-colors cursor-pointer ${
                        textStyle === "outlined"
                          ? "bg-blue-600 text-white"
                          : "bg-white/5 text-gray-300 hover:bg-white/10"
                      }`}
                    >
                      Kontur
                    </button>
                  </div>
                </div>

                {/* Arka Plan Rengi (Dolgulu/Kontur için) */}
                {(textStyle === "filled" || textStyle === "outlined") && (
                  <div className="flex gap-2 items-center">
                    <span className="text-xs text-gray-400 w-20">Arka Plan</span>
                    <input
                      type="color"
                      value={textBackgroundColor}
                      onChange={(e) => setTextBackgroundColor(e.target.value)}
                      className="w-12 h-10 rounded-lg cursor-pointer"
                    />
                  </div>
                )}

                <Button onClick={addText} className="w-full">
                  Ekle
                </Button>
              </>
            ) : (
              <>
                {/* Seçili Metni Düzenle */}
                <div className="text-sm text-gray-400 font-medium mb-2">Seçili Metni Düzenle</div>
                
                <div className="flex gap-2 items-center">
                  <span className="text-xs text-gray-400 w-12">Renk</span>
                  <input
                    type="color"
                    value={textColor}
                    onChange={(e) => updateSelectedTextColor(e.target.value)}
                    className="w-12 h-10 rounded-lg cursor-pointer"
                  />
                </div>

                {/* Stil Seçimi */}
                <div className="space-y-2">
                  <span className="text-xs text-gray-400">Stil</span>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => updateSelectedTextStyle("normal")}
                      className={`px-3 py-2 rounded-lg text-sm transition-colors cursor-pointer ${
                        textStyle === "normal"
                          ? "bg-blue-600 text-white"
                          : "bg-white/5 text-gray-300 hover:bg-white/10"
                      }`}
                    >
                      Normal
                    </button>
                    <button
                      type="button"
                      onClick={() => updateSelectedTextStyle("filled")}
                      className={`px-3 py-2 rounded-lg text-sm transition-colors cursor-pointer ${
                        textStyle === "filled"
                          ? "bg-blue-600 text-white"
                          : "bg-white/5 text-gray-300 hover:bg-white/10"
                      }`}
                    >
                      Dolgulu
                    </button>
                    <button
                      type="button"
                      onClick={() => updateSelectedTextStyle("outlined")}
                      className={`px-3 py-2 rounded-lg text-sm transition-colors cursor-pointer ${
                        textStyle === "outlined"
                          ? "bg-blue-600 text-white"
                          : "bg-white/5 text-gray-300 hover:bg-white/10"
                      }`}
                    >
                      Kontur
                    </button>
                  </div>
                </div>

                {/* Arka Plan Rengi */}
                {(textStyle === "filled" || textStyle === "outlined") && (
                  <div className="flex gap-2 items-center">
                    <span className="text-xs text-gray-400 w-20">Arka Plan</span>
                    <input
                      type="color"
                      value={textBackgroundColor}
                      onChange={(e) => updateSelectedTextBackgroundColor(e.target.value)}
                      className="w-12 h-10 rounded-lg cursor-pointer"
                    />
                  </div>
                )}

                <div className="flex gap-2">
                  <Button onClick={deleteText} variant="destructive" className="flex-1">
                    Sil
                  </Button>
                  <Button onClick={() => setSelectedElement(null)} variant="secondary" className="flex-1">
                    Seçimi Kaldır
                  </Button>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Müzik Seçici Dialog */}
      <MusicSelectorDialog
        open={musicDialogOpen}
        onOpenChange={setMusicDialogOpen}
        onSelect={(music) => {
          if (onMusicSelect) {
            onMusicSelect(music._id);
            toast.success(`${music.title} - ${music.artist} eklendi`);
          }
        }}
        selectedMusicId={selectedMusicId}
      />
    </div>
  );
}
