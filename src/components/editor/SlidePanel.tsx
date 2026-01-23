import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { GripVertical, Trash2, Plus, Copy } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Slide } from '@/types/presentation';

interface SlidePanelProps {
  slides: Slide[];
  activeSlideId: string | null;
  onSlideSelect: (slide: Slide) => void;
  onSlideCreate: (afterPosition?: number) => void;
  onSlideDuplicate: (slide: Slide) => void;
  onSlideDelete: (id: string) => void;
  onSlideReorder: (slides: Slide[]) => void;
}

export function SlidePanel({
  slides,
  activeSlideId,
  onSlideSelect,
  onSlideCreate,
  onSlideDuplicate,
  onSlideDelete,
}: SlidePanelProps) {
  const [draggedId, setDraggedId] = useState<string | null>(null);

  return (
    <div className="w-64 editor-panel flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b">
        <h3 className="font-medium text-sm">Stopp</h3>
      </div>

      {/* Slides list */}
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-2">
          {slides.map((slide, index) => (
            <div
              key={slide.id}
              className={cn(
                'group relative slide-thumb p-2 cursor-pointer',
                activeSlideId === slide.id && 'slide-thumb-active',
                draggedId === slide.id && 'opacity-50'
              )}
              onClick={() => onSlideSelect(slide)}
              draggable
              onDragStart={() => setDraggedId(slide.id)}
              onDragEnd={() => setDraggedId(null)}
            >
              {/* Drag handle */}
              <div className="absolute left-1 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                <GripVertical className="h-4 w-4 text-muted-foreground" />
              </div>

              {/* Slide number */}
              <div className="absolute left-8 top-2 text-xs font-medium text-muted-foreground">
                {index + 1}
              </div>

              {/* Delete button */}
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-1 top-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={(e) => {
                  e.stopPropagation();
                  onSlideDelete(slide.id);
                }}
              >
                <Trash2 className="h-3 w-3 text-destructive" />
              </Button>

              {/* Preview */}
              <div 
                className="aspect-video rounded bg-background border mt-4"
                style={{ 
                  backgroundColor: slide.background_type === 'color' ? slide.background_value : undefined,
                  backgroundImage: slide.background_type === 'image' ? `url(${slide.background_value})` : undefined,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                }}
              >
                <div className="p-2 text-[8px] truncate text-foreground/70">
                  {slide.title || `Stopp ${index + 1}`}
                </div>
              </div>

              {/* Action buttons at bottom */}
              <div className="flex justify-center gap-2 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 px-2 text-xs gap-1"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSlideCreate(index);
                  }}
                >
                  <Plus className="h-3 w-3" />
                  Ny
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 px-2 text-xs gap-1"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSlideDuplicate(slide);
                  }}
                >
                  <Copy className="h-3 w-3" />
                  Kopiera
                </Button>
              </div>
            </div>
          ))}

          {/* Empty state - show add button */}
          {slides.length === 0 && (
            <div className="text-center py-8">
              <p className="text-sm text-muted-foreground mb-4">Inga stopp ännu</p>
              <Button variant="outline" size="sm" onClick={() => onSlideCreate()}>
                <Plus className="h-4 w-4 mr-2" />
                Skapa första stoppet
              </Button>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
