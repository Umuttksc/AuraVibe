import { useState, useEffect } from "react";
import { X, GripVertical, Edit, Camera, ImageIcon, UserPlus, Wand2, Play } from "lucide-react";
import { Button } from "@/components/ui/button.tsx";
import { toast } from "sonner";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import type { DragEndEvent } from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  rectSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { Id } from "@/convex/_generated/dataModel.d.ts";

export interface MediaTag {
  userId: Id<"users">;
  username: string;
  x: number;
  y: number;
}

export interface MediaItem {
  id: string;
  file: File;
  preview: string;
  thumbnail?: string; // Video thumbnail
  type: "image" | "video";
  edited?: boolean;
  tags?: MediaTag[];
}

interface MultiMediaSelectorProps {
  mediaItems: MediaItem[];
  onMediaItemsChange: (items: MediaItem[]) => void;
  onEditItem: (item: MediaItem) => void;
  onTagItem?: (item: MediaItem) => void;
  onBulkEdit?: () => void;
  maxItems?: number;
  onCameraClick: () => void;
  onGalleryClick: () => void;
}

// Helper: Generate video thumbnail
function generateVideoThumbnail(file: File): Promise<string> {
  return new Promise((resolve) => {
    const video = document.createElement("video");
    video.preload = "metadata";
    video.muted = true;
    video.playsInline = true;
    
    video.onloadeddata = () => {
      video.currentTime = 0.1; // Capture at 0.1 seconds
    };
    
    video.onseeked = () => {
      const canvas = document.createElement("canvas");
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/jpeg", 0.8));
      }
      
      video.remove();
    };
    
    video.onerror = () => {
      resolve(""); // Return empty string on error
      video.remove();
    };
    
    video.src = URL.createObjectURL(file);
  });
}

function SortableMediaItem({
  item,
  onRemove,
  onEdit,
  onTag,
}: {
  item: MediaItem;
  onRemove: () => void;
  onEdit: () => void;
  onTag?: () => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const displayImage = item.type === "video" && item.thumbnail ? item.thumbnail : item.preview;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="relative aspect-square rounded-lg overflow-hidden border-2 border-border group"
    >
      {/* Preview */}
      <img
        src={displayImage}
        alt="Preview"
        className="w-full h-full object-cover"
      />

      {/* Video Play Icon Overlay */}
      {item.type === "video" && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="p-3 bg-black/60 backdrop-blur-sm rounded-full">
            <Play className="h-6 w-6 text-white fill-white" />
          </div>
        </div>
      )}

      {/* Overlay Controls */}
      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
        {/* Drag Handle */}
        <button
          {...attributes}
          {...listeners}
          className="p-2 bg-white/10 backdrop-blur-sm rounded-lg hover:bg-white/20 transition-colors cursor-grab active:cursor-grabbing"
        >
          <GripVertical className="h-5 w-5 text-white" />
        </button>

        {/* Edit Button */}
        <button
          onClick={onEdit}
          className="p-2 bg-white/10 backdrop-blur-sm rounded-lg hover:bg-white/20 transition-colors"
        >
          <Edit className="h-5 w-5 text-white" />
        </button>

        {/* Tag Button */}
        {onTag && (
          <button
            onClick={onTag}
            className="p-2 bg-white/10 backdrop-blur-sm rounded-lg hover:bg-white/20 transition-colors"
          >
            <UserPlus className="h-5 w-5 text-white" />
          </button>
        )}

        {/* Remove Button */}
        <button
          onClick={onRemove}
          className="p-2 bg-red-500/80 backdrop-blur-sm rounded-lg hover:bg-red-600 transition-colors"
        >
          <X className="h-5 w-5 text-white" />
        </button>
      </div>

      {/* Tags Badge */}
      {item.tags && item.tags.length > 0 && (
        <div className="absolute top-2 left-2 px-2 py-1 bg-blue-600 text-white text-xs font-medium rounded flex items-center gap-1">
          <UserPlus className="h-3 w-3" />
          {item.tags.length}
        </div>
      )}

      {/* Edited Badge */}
      {item.edited && (
        <div className="absolute top-2 right-2 px-2 py-1 bg-green-600 text-white text-xs font-medium rounded">
          Düzenlendi
        </div>
      )}
    </div>
  );
}

export default function MultiMediaSelector({
  mediaItems,
  onMediaItemsChange,
  onEditItem,
  onTagItem,
  onBulkEdit,
  maxItems = 10,
  onCameraClick,
  onGalleryClick,
}: MultiMediaSelectorProps) {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Generate thumbnails for videos
  useEffect(() => {
    const generateThumbnails = async () => {
      const updatedItems = await Promise.all(
        mediaItems.map(async (item) => {
          if (item.type === "video" && !item.thumbnail) {
            try {
              const thumbnail = await generateVideoThumbnail(item.file);
              return { ...item, thumbnail };
            } catch {
              return item;
            }
          }
          return item;
        })
      );

      const hasNewThumbnails = updatedItems.some(
        (item, index) => item.thumbnail && !mediaItems[index].thumbnail
      );

      if (hasNewThumbnails) {
        onMediaItemsChange(updatedItems);
      }
    };

    if (mediaItems.some((item) => item.type === "video" && !item.thumbnail)) {
      generateThumbnails();
    }
  }, [mediaItems, onMediaItemsChange]);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = mediaItems.findIndex((item) => item.id === active.id);
      const newIndex = mediaItems.findIndex((item) => item.id === over.id);

      onMediaItemsChange(arrayMove(mediaItems, oldIndex, newIndex));
      toast.success("Sıralama güncellendi");
    }
  };

  const handleRemoveItem = (id: string) => {
    const item = mediaItems.find((i) => i.id === id);
    if (item) {
      URL.revokeObjectURL(item.preview);
      if (item.thumbnail) {
        URL.revokeObjectURL(item.thumbnail);
      }
    }
    onMediaItemsChange(mediaItems.filter((item) => item.id !== id));
    toast.success("Medya kaldırıldı");
  };

  const canAddMore = mediaItems.length < maxItems;
  const hasMultipleItems = mediaItems.length > 1;

  return (
    <div className="space-y-4">
      {/* Header with count and bulk actions */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {mediaItems.length} / {maxItems} medya seçildi
        </p>
        <div className="flex items-center gap-2">
          {hasMultipleItems && (
            <p className="text-xs text-muted-foreground hidden sm:block">
              💡 Sürükleyerek sıralama yapın
            </p>
          )}
          {onBulkEdit && hasMultipleItems && (
            <Button
              onClick={onBulkEdit}
              variant="ghost"
              size="sm"
              className="h-8"
            >
              <Wand2 className="h-4 w-4 mr-2" />
              Toplu Düzenle
            </Button>
          )}
        </div>
      </div>

      {/* Media Grid */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={mediaItems} strategy={rectSortingStrategy}>
          <div className="grid grid-cols-3 gap-3">
            {mediaItems.map((item) => (
              <SortableMediaItem
                key={item.id}
                item={item}
                onRemove={() => handleRemoveItem(item.id)}
                onEdit={() => onEditItem(item)}
                onTag={onTagItem ? () => onTagItem(item) : undefined}
              />
            ))}

            {/* Add More Button */}
            {canAddMore && (
              <div className="aspect-square rounded-lg border-2 border-dashed border-border flex flex-col items-center justify-center gap-2">
                <div className="flex gap-2">
                  <button
                    onClick={onCameraClick}
                    className="p-3 bg-primary/10 rounded-lg hover:bg-primary/20 transition-colors"
                  >
                    <Camera className="h-5 w-5" />
                  </button>
                  <button
                    onClick={onGalleryClick}
                    className="p-3 bg-primary/10 rounded-lg hover:bg-primary/20 transition-colors"
                  >
                    <ImageIcon className="h-5 w-5" />
                  </button>
                </div>
                <p className="text-xs text-muted-foreground text-center px-2">
                  Daha Ekle
                </p>
              </div>
            )}
          </div>
        </SortableContext>
      </DndContext>

      {/* Helper Text */}
      {mediaItems.length === 0 && (
        <div className="text-center py-8 space-y-4">
          <p className="text-muted-foreground">Henüz medya seçilmedi</p>
          <div className="flex gap-3 justify-center">
            <Button onClick={onCameraClick} variant="ghost">
              <Camera className="h-4 w-4 mr-2" />
              Kamera
            </Button>
            <Button onClick={onGalleryClick} variant="ghost">
              <ImageIcon className="h-4 w-4 mr-2" />
              Galeri
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
