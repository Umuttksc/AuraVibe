import { useState } from "react";
import { Wand2, Check } from "lucide-react";
import { Button } from "@/components/ui/button.tsx";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog.tsx";
import { Slider } from "@/components/ui/slider.tsx";
import { Label } from "@/components/ui/label.tsx";
import type { MediaItem } from "./multi-media-selector.tsx";
import { toast } from "sonner";

interface BulkEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mediaItems: MediaItem[];
  onApplyBulkEdit: (settings: BulkEditSettings) => void;
}

export interface BulkEditSettings {
  filter?: string;
  brightness?: number;
  contrast?: number;
  saturation?: number;
}

const FILTERS = [
  { id: "none", name: "Filtre Yok", filter: "" },
  { id: "grayscale", name: "Gri Ton", filter: "grayscale(100%)" },
  { id: "sepia", name: "Sepya", filter: "sepia(100%)" },
  { id: "vintage", name: "Vintage", filter: "sepia(50%) contrast(110%) brightness(110%)" },
  { id: "warm", name: "Sıcak", filter: "sepia(30%) saturate(140%)" },
  { id: "cool", name: "Soğuk", filter: "hue-rotate(180deg) saturate(120%)" },
  { id: "dramatic", name: "Dramatik", filter: "contrast(150%) brightness(90%)" },
];

export default function BulkEditDialog({
  open,
  onOpenChange,
  mediaItems,
  onApplyBulkEdit,
}: BulkEditDialogProps) {
  const [selectedFilter, setSelectedFilter] = useState<string>("none");
  const [brightness, setBrightness] = useState<number>(100);
  const [contrast, setContrast] = useState<number>(100);
  const [saturation, setSaturation] = useState<number>(100);

  const handleApply = () => {
    const settings: BulkEditSettings = {
      brightness,
      contrast,
      saturation,
    };

    // Add filter if selected
    if (selectedFilter !== "none") {
      const filter = FILTERS.find((f) => f.id === selectedFilter);
      if (filter) {
        settings.filter = filter.filter;
      }
    }

    onApplyBulkEdit(settings);
    onOpenChange(false);
    toast.success(`${mediaItems.length} medyaya efekt uygulandı`);
  };

  const handleReset = () => {
    setSelectedFilter("none");
    setBrightness(100);
    setContrast(100);
    setSaturation(100);
  };

  const imageCount = mediaItems.filter((m) => m.type === "image").length;

  // Build preview filter style
  let previewFilterStyle = "";
  if (selectedFilter !== "none") {
    const filter = FILTERS.find((f) => f.id === selectedFilter);
    if (filter) {
      previewFilterStyle = filter.filter;
    }
  }

  // Add manual adjustments
  const adjustments = [];
  if (brightness !== 100) adjustments.push(`brightness(${brightness}%)`);
  if (contrast !== 100) adjustments.push(`contrast(${contrast}%)`);
  if (saturation !== 100) adjustments.push(`saturate(${saturation}%)`);

  const finalFilter = [previewFilterStyle, ...adjustments].filter(Boolean).join(" ");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wand2 className="h-5 w-5" />
            Toplu Düzenleme
          </DialogTitle>
          <DialogDescription>
            {imageCount} fotoğrafa aynı efektleri uygulayın
            {mediaItems.length - imageCount > 0 && ` (${mediaItems.length - imageCount} video etkilenmeyecek)`}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Filter Presets */}
          <div>
            <Label className="text-sm font-medium mb-3 block">Filtre</Label>
            <div className="grid grid-cols-4 gap-3">
              {FILTERS.map((filter) => (
                <button
                  key={filter.id}
                  onClick={() => setSelectedFilter(filter.id)}
                  className={`relative aspect-square rounded-lg border-2 overflow-hidden transition-all ${
                    selectedFilter === filter.id
                      ? "border-primary ring-2 ring-primary/20"
                      : "border-border hover:border-primary/50"
                  }`}
                >
                  {/* Preview */}
                  <div
                    className="w-full h-full bg-gradient-to-br from-pink-400 via-purple-400 to-blue-400"
                    style={{
                      filter: filter.filter,
                    }}
                  />

                  {/* Name */}
                  <div className="absolute bottom-0 inset-x-0 bg-black/70 backdrop-blur-sm text-white text-xs py-1.5 text-center">
                    {filter.name}
                  </div>

                  {/* Selected Indicator */}
                  {selectedFilter === filter.id && (
                    <div className="absolute top-1 right-1 w-5 h-5 bg-primary rounded-full flex items-center justify-center">
                      <Check className="h-3 w-3 text-white" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Manual Adjustments */}
          <div className="space-y-4">
            <Label className="text-sm font-medium">Manuel Ayarlar</Label>

            {/* Brightness */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm">Parlaklık</span>
                <span className="text-sm text-muted-foreground">{brightness}%</span>
              </div>
              <Slider
                value={[brightness]}
                onValueChange={([value]) => setBrightness(value)}
                min={50}
                max={150}
                step={1}
              />
            </div>

            {/* Contrast */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm">Kontrast</span>
                <span className="text-sm text-muted-foreground">{contrast}%</span>
              </div>
              <Slider
                value={[contrast]}
                onValueChange={([value]) => setContrast(value)}
                min={50}
                max={150}
                step={1}
              />
            </div>

            {/* Saturation */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm">Doygunluk</span>
                <span className="text-sm text-muted-foreground">{saturation}%</span>
              </div>
              <Slider
                value={[saturation]}
                onValueChange={([value]) => setSaturation(value)}
                min={0}
                max={200}
                step={1}
              />
            </div>
          </div>

          {/* Live Preview */}
          <div>
            <Label className="text-sm font-medium mb-3 block">Önizleme</Label>
            <div className="grid grid-cols-3 gap-3">
              {mediaItems.slice(0, 3).map((item, index) => (
                <div key={index} className="aspect-square rounded-lg overflow-hidden border">
                  <img
                    src={item.thumbnail || item.preview}
                    alt="Preview"
                    className="w-full h-full object-cover"
                    style={{
                      filter: item.type === "image" ? finalFilter : undefined,
                    }}
                  />
                </div>
              ))}
              {mediaItems.length > 3 && (
                <div className="aspect-square rounded-lg border flex items-center justify-center bg-muted">
                  <span className="text-sm text-muted-foreground">
                    +{mediaItems.length - 3} daha
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-between pt-4 border-t">
          <Button variant="ghost" onClick={handleReset}>
            Sıfırla
          </Button>
          <div className="flex gap-2">
            <Button variant="ghost" onClick={() => onOpenChange(false)}>
              İptal
            </Button>
            <Button onClick={handleApply}>
              {imageCount} Fotoğrafa Uygula
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
